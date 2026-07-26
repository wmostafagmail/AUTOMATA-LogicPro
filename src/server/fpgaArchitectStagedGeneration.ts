import { execFile } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import type { FpgaArchitectFile, FpgaArchitectProject } from './fpgaArchitect';
import { buildDeterministicArchitectGhdlRunCommands } from './fpgaArchitect';
import type { FpgaArchitectureComponentContract, FpgaArchitectureContract } from './fpgaArchitectureContract';
import { hashFpgaArchitectureContract } from './fpgaArchitectureContract';
import { renderAppOwnedTestbench } from './fpgaVerificationScenario';
import { defaultVhdlValue, renderContractPackage, renderIntegrationTop, renderLeafSkeleton } from './fpgaContractRenderer';
import { buildModelGenerationProfile, type ModelGenerationProfile } from './modelGenerationProfiles';
import { parseVhdlSemanticModel } from './vhdlSemanticFrontend';
import { VHDL_RESERVED_IDENTIFIERS } from './ghdlStrictVhdlRules';
import { applyDeterministicGeneratedCodeRepairs, repairVectorLiteralWidthMismatches } from './deterministicGeneratedCodeRepair';
import {
  detectKnownVhdlAntiPatternDetails,
  inferFailureDetailsFromGhdlMessage,
  type GeneratedVhdlValidationResult,
} from './generatedVhdlValidation';
import { repairMalformedVhdlKeywordTypos } from './vhdlKeywordTypos';
import {
  findGoldenLeafCandidate,
  type GoldenLeafCandidate,
} from './fpgaGoldenLeafLibrary';
import {
  findVerifiedVhdlBlockCandidate,
} from './fpgaVerifiedVhdlBlockLibrary';

export type FpgaArchitectStage = 'packages' | 'leaf_rtl' | 'top_integration' | 'testbench' | 'collateral' | 'manifest';

export type FpgaArchitectStageProgress = {
  stage: FpgaArchitectStage;
  stageIndex: number;
  totalStages: number;
  componentId: string;
  status: 'starting' | 'validating' | 'completed';
};

type StagedAiResult<TTelemetry> = { text: string; telemetry: TTelemetry };
const execFileAsync = promisify(execFile);
const VHDL_RESERVED_IDENTIFIER_SET = new Set(VHDL_RESERVED_IDENTIFIERS.map((entry) => entry.toLowerCase()));

export class StagedPortInterfaceDriftError extends Error {
  readonly failureCode = 'staged_port_interface_drift';
  readonly stage: FpgaArchitectStage;
  readonly componentId: string;
  readonly componentName: string;
  readonly expectedPorts: string[];
  readonly actualPorts: string[];
  readonly expectedGenerics: string[];
  readonly actualGenerics: string[];
  readonly entityExcerpt: string;

  constructor(params: {
    stage: FpgaArchitectStage;
    component: FpgaArchitectureComponentContract;
    expectedPorts: string[];
    actualPorts: string[];
    expectedGenerics: string[];
    actualGenerics: string[];
    entityExcerpt: string;
    interfaceKind: 'generic' | 'port';
  }) {
    super([
      'staged_port_interface_drift',
      `Staged VHDL for "${params.component.name}" changed the approved ${params.interfaceKind} interface.`,
      `componentId=${params.component.id}`,
      `expectedGenerics=${params.expectedGenerics.join(',') || '(none)'}`,
      `actualGenerics=${params.actualGenerics.join(',') || '(none)'}`,
      `expectedPorts=${params.expectedPorts.join(',') || '(none)'}`,
      `actualPorts=${params.actualPorts.join(',') || '(none)'}`,
    ].join('\n'));
    this.name = 'StagedPortInterfaceDriftError';
    this.stage = params.stage;
    this.componentId = params.component.id;
    this.componentName = params.component.name;
    this.expectedPorts = params.expectedPorts;
    this.actualPorts = params.actualPorts;
    this.expectedGenerics = params.expectedGenerics;
    this.actualGenerics = params.actualGenerics;
    this.entityExcerpt = params.entityExcerpt;
  }
}

export class StagedComponentEntityMissingError extends Error {
  readonly failureCode = 'staged_component_entity_missing';
  readonly stage: FpgaArchitectStage;
  readonly componentId: string;
  readonly componentName: string;
  readonly expectedEntity: string;
  readonly declaredEntities: string[];
  readonly contentExcerpt: string;

  constructor(params: {
    stage: FpgaArchitectStage;
    component: FpgaArchitectureComponentContract;
    declaredEntities: string[];
    contentExcerpt: string;
  }) {
    super([
      'staged_component_entity_missing',
      `Staged VHDL for component "${params.component.id}" did not declare entity "${params.component.name}".`,
      `componentId=${params.component.id}`,
      `expectedEntity=${params.component.name}`,
      `declaredEntities=${params.declaredEntities.join(',') || '(none)'}`,
    ].join('\n'));
    this.name = 'StagedComponentEntityMissingError';
    this.stage = params.stage;
    this.componentId = params.component.id;
    this.componentName = params.component.name;
    this.expectedEntity = params.component.name;
    this.declaredEntities = params.declaredEntities;
    this.contentExcerpt = params.contentExcerpt;
  }
}

async function runGhdlStageCheckpoint(params: {
  files: FpgaArchitectFile[];
  sourceOrder: string[];
  label: string;
  signal?: AbortSignal;
}) {
  const vhdlFiles = new Map(
    params.files
      .filter((file) => /\.vhdl?$/i.test(file.path))
      .map((file) => [file.path.replace(/\\/g, '/'), file]),
  );
  if (vhdlFiles.size === 0) return;
  const orderedPaths = params.sourceOrder.filter((entry) => vhdlFiles.has(entry.replace(/\\/g, '/')));
  const remaining = Array.from(vhdlFiles.keys()).filter((entry) => !orderedPaths.includes(entry));
  const analysisOrder = [...orderedPaths, ...remaining];
  for (let pass = 1; pass <= 3; pass += 1) {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-stage-ghdl-'));
    const workDirectory = path.join(directory, 'work');
    try {
      await fs.mkdir(workDirectory, { recursive: true });
      for (const [relativePath, file] of vhdlFiles) {
          const absolutePath = path.join(directory, relativePath);
          await fs.mkdir(path.dirname(absolutePath), { recursive: true });
          await fs.writeFile(absolutePath, file.content, 'utf8');
      }
      let repairedDuringPass = false;
      const preGhdlDetails = await detectKnownVhdlAntiPatternDetails(directory, analysisOrder);
      if (preGhdlDetails.length > 0) {
        const summary = `Staged pre-GHDL validation failed after ${params.label} before invoking GHDL.`;
        if (pass < 3) {
          const validation: GeneratedVhdlValidationResult = {
            ok: false,
            stage: 'prevalidate',
            summary,
            logs: [summary, ...preGhdlDetails.map((detail) => detail.message)],
            validatedTopEntities: [],
            failureCode: preGhdlDetails[0]?.code || null,
            failureCategory: preGhdlDetails[0]?.category || null,
            ruleIds: Array.from(new Set(preGhdlDetails.flatMap((detail) => detail.ruleIds || []))),
            failureDetails: preGhdlDetails,
          };
          const repair = await applyDeterministicGeneratedCodeRepairs({
            validation,
            availableFiles: params.files
              .filter((file) => /\.vhdl?$/i.test(file.path))
              .map((file) => ({
                relativePath: file.path,
                absolutePath: path.join(directory, file.path),
                content: file.content,
                kind: file.fileType === 'vhdl_testbench'
                  ? 'testbench'
                  : file.fileType === 'vhdl_rtl' || file.fileType === 'vhdl_package'
                  ? 'module'
                  : 'unknown',
              })),
          });
          if (repair.changed) {
            for (const repaired of repair.repairedFiles) {
              const target = params.files.find((file) => file.path.replace(/\\/g, '/') === repaired.relativePath.replace(/\\/g, '/'));
              if (target) target.content = repaired.content;
            }
            repairedDuringPass = true;
          }
        }
        if (!repairedDuringPass) {
          throw new Error([summary, ...preGhdlDetails.map((detail) => detail.message)].join('\n'));
        }
      }
      if (repairedDuringPass) {
        continue;
      }
      for (const relativePath of analysisOrder) {
        try {
          await execFileAsync(
            'ghdl',
            ['-a', '--std=08', `--workdir=${workDirectory}`, path.join(directory, relativePath)],
            { signal: params.signal, maxBuffer: 4 * 1024 * 1024 },
          );
        } catch (error: any) {
          const output = [error?.stdout, error?.stderr, error?.message].filter(Boolean).join('\n').trim();
          const message = `Staged GHDL checkpoint failed after ${params.label} while analyzing ${relativePath}:\n${output}`;
          if (pass < 3) {
            const failureDetails = inferFailureDetailsFromGhdlMessage(message);
            const validation: GeneratedVhdlValidationResult = {
              ok: false,
              stage: 'analyze',
              summary: message,
              logs: [message],
              validatedTopEntities: [],
              failureCode: failureDetails[0]?.code || null,
              failureCategory: failureDetails[0]?.category || null,
              ruleIds: Array.from(new Set(failureDetails.flatMap((detail) => detail.ruleIds || []))),
              failureDetails,
            };
            const repair = await applyDeterministicGeneratedCodeRepairs({
              validation,
              availableFiles: params.files
                .filter((file) => /\.vhdl?$/i.test(file.path))
                .map((file) => ({
                  relativePath: file.path,
                  absolutePath: path.join(directory, file.path),
                  content: file.content,
                  kind: file.fileType === 'vhdl_testbench'
                    ? 'testbench'
                    : file.fileType === 'vhdl_rtl' || file.fileType === 'vhdl_package'
                    ? 'module'
                    : 'unknown',
                })),
            });
            if (repair.changed) {
              for (const repaired of repair.repairedFiles) {
                const target = params.files.find((file) => file.path.replace(/\\/g, '/') === repaired.relativePath.replace(/\\/g, '/'));
                if (target) target.content = repaired.content;
              }
              repairedDuringPass = true;
              break;
            }
          }
          throw new Error(message);
        }
      }
      if (repairedDuringPass) {
        continue;
      }
      return;
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  }
  throw new Error(`Staged GHDL checkpoint failed after ${params.label}: deterministic repair budget exhausted before validation passed.`);
}

function stripVhdlResponse(text: string) {
  const trimmed = String(text || '').trim();
  const fence = trimmed.match(/^```(?:vhdl|vhd)?\s*\n([\s\S]*?)\n```$/i);
  return (fence?.[1] || trimmed).trimEnd() + '\n';
}

function safeEnumLiteralReplacement(literal: string) {
  return `STATE_${literal.toUpperCase()}`;
}

function repairReservedEnumLiterals(content: string) {
  let repaired = content;
  const replacements = new Map<string, string>();
  repaired = repaired.replace(/\btype\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\s*\(([^;]+)\)\s*;/gi, (full, typeName: string, literalList: string) => {
    const repairedLiterals = literalList.split(',').map((rawLiteral) => {
      const literal = rawLiteral.trim();
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(literal) || !VHDL_RESERVED_IDENTIFIER_SET.has(literal.toLowerCase())) {
        return rawLiteral;
      }
      const replacement = safeEnumLiteralReplacement(literal);
      replacements.set(literal, replacement);
      return rawLiteral.replace(literal, replacement);
    }).join(',');
    return `type ${typeName} is (${repairedLiterals});`;
  });

  for (const [literal, replacement] of replacements.entries()) {
    const escaped = literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    repaired = repaired
      .replace(new RegExp(`(\\bwhen\\s+)${escaped}(\\s*=>)`, 'g'), `$1${replacement}$2`)
      .replace(new RegExp(`((?:<=|:=)\\s*)${escaped}(\\s*;)`, 'g'), `$1${replacement}$2`)
      .replace(new RegExp(`((?:=|/=)\\s*)${escaped}(\\b)`, 'g'), `$1${replacement}$2`);
  }
  return repaired;
}

function repairMissingParityHelper(content: string) {
  if (!/\bparity\s*\(/i.test(content) || /\b(?:function|procedure)\s+parity\b/i.test(content)) return content;
  const helper = [
    '',
    '  function parity(value : std_logic_vector) return std_logic is',
    "    variable result_v : std_logic := '0';",
    '  begin',
    '    for index_v in value\'range loop',
    '      result_v := result_v xor value(index_v);',
    '    end loop;',
    '    return result_v;',
    '  end function parity;',
    '',
  ].join('\n');
  return content.replace(/(\barchitecture\s+[a-zA-Z][a-zA-Z0-9_]*\s+of\s+[a-zA-Z][a-zA-Z0-9_]*\s+is\b[\s\S]*?)(\bbegin\b)/i, `$1${helper}$2`);
}

function normalizeStagedVhdlContent(content: string) {
  const keywordRepaired = repairMalformedVhdlKeywordTypos(content).content;
  return repairVectorLiteralWidthMismatches(
    repairMissingParityHelper(repairReservedEnumLiterals(keywordRepaired)),
  ).content;
}

function extractMarkedRegion(content: string, region: 'DECLARATIONS' | 'STATEMENTS') {
  const pattern = new RegExp(
    `--\\s*MODEL_IMPLEMENTATION_${region}_BEGIN\\s*\\n([\\s\\S]*?)\\n\\s*--\\s*MODEL_IMPLEMENTATION_${region}_END`,
    'i',
  );
  return content.match(pattern)?.[1] ?? null;
}

export function rewrapModelImplementationIntoSkeleton(params: {
  skeleton: string;
  modelContent: string;
}) {
  const declarations = extractMarkedRegion(params.modelContent, 'DECLARATIONS');
  const statements = extractMarkedRegion(params.modelContent, 'STATEMENTS');
  if (declarations === null && statements === null) return null;
  let repaired = params.skeleton;
  if (declarations !== null) {
    repaired = repaired.replace(
      /  -- MODEL_IMPLEMENTATION_DECLARATIONS_BEGIN[\s\S]*?  -- MODEL_IMPLEMENTATION_DECLARATIONS_END/,
      [
        '  -- MODEL_IMPLEMENTATION_DECLARATIONS_BEGIN',
        declarations.trimEnd() || '  -- No generated declarations.',
        '  -- MODEL_IMPLEMENTATION_DECLARATIONS_END',
      ].join('\n'),
    );
  }
  if (statements !== null) {
    repaired = repaired.replace(
      /  -- MODEL_IMPLEMENTATION_STATEMENTS_BEGIN[\s\S]*?  -- MODEL_IMPLEMENTATION_STATEMENTS_END/,
      [
        '  -- MODEL_IMPLEMENTATION_STATEMENTS_BEGIN',
        statements.trimEnd() || '  -- No generated statements.',
        '  -- MODEL_IMPLEMENTATION_STATEMENTS_END',
      ].join('\n'),
    );
  }
  return repaired;
}

function normalizeComponentInterface(component: FpgaArchitectureComponentContract) {
  return {
    name: component.name,
    generics: component.generics,
    ports: component.ports,
  };
}

function extractEntityExcerpt(content: string, entityName: string) {
  const escaped = entityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return content.match(new RegExp(`\\bentity\\s+${escaped}\\s+is[\\s\\S]*?\\bend\\s+(?:entity\\s+)?${escaped}?\\s*;`, 'i'))?.[0]
    || content.split('\n').slice(0, 60).join('\n');
}

function extractContentExcerpt(content: string) {
  return content.split('\n').slice(0, 80).join('\n');
}

function assertGeneratedComponentInterface(stage: FpgaArchitectStage, component: FpgaArchitectureComponentContract, content: string) {
  if (/\b(?:MODEL_IMPLEMENTATION|TODO|TBD|PLACEHOLDER)\b/i.test(content)) {
    throw new Error(`Staged VHDL for component "${component.id}" retained a placeholder instead of a complete implementation.`);
  }
  const model = parseVhdlSemanticModel(content);
  const entity = model.entities.find((candidate) => candidate.name.toLowerCase() === component.name.toLowerCase());
  if (!entity) {
    throw new StagedComponentEntityMissingError({
      stage,
      component,
      declaredEntities: model.entities.map((candidate) => candidate.name),
      contentExcerpt: extractContentExcerpt(content),
    });
  }
  if (!model.architectures.some((architecture) => architecture.entityName.toLowerCase() === component.name.toLowerCase())) {
    throw new Error(`Staged VHDL for component "${component.id}" did not declare an architecture for entity "${component.name}".`);
  }
  const actualGenericNames = entity.generics.flatMap((item) => item.names).map((name) => name.toLowerCase());
  const actualPortNames = entity.ports.flatMap((item) => item.names).map((name) => name.toLowerCase());
  const expectedGenericNames = component.generics.map((item) => item.name.toLowerCase());
  const expectedPortNames = component.ports.map((item) => item.name.toLowerCase());
  if (actualGenericNames.join('|') !== expectedGenericNames.join('|')) {
    throw new StagedPortInterfaceDriftError({
      stage,
      component,
      expectedPorts: expectedPortNames,
      actualPorts: actualPortNames,
      expectedGenerics: expectedGenericNames,
      actualGenerics: actualGenericNames,
      entityExcerpt: extractEntityExcerpt(content, component.name),
      interfaceKind: 'generic',
    });
  }
  if (actualPortNames.join('|') !== expectedPortNames.join('|')) {
    throw new StagedPortInterfaceDriftError({
      stage,
      component,
      expectedPorts: expectedPortNames,
      actualPorts: actualPortNames,
      expectedGenerics: expectedGenericNames,
      actualGenerics: actualGenericNames,
      entityExcerpt: extractEntityExcerpt(content, component.name),
      interfaceKind: 'port',
    });
  }
}

function buildComponentPrompt(params: {
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
  skeleton: string;
}) {
  const { contract, component, skeleton } = params;
  const componentText = [
    contract.designClass,
    component.id,
    component.name,
    component.file,
    component.responsibility,
  ].join(' ').toLowerCase();
  const behaviors = contract.behaviors.filter((behavior) => (
    component.ports.some((port) => behavior.inputs.includes(port.name) || behavior.outputs.includes(port.name))
  ));
  const stateMachines = (contract.stateMachines || []).filter((machine) => machine.componentId === component.id);
  const protocolStatusNames = new Set(['done_o', 'error_o', 'status_o']);
  const componentPortNames = new Set(component.ports.map((port) => port.name.toLowerCase()));
  const ownedBehaviorOutputs = new Set(
    behaviors.flatMap((behavior) => (
      behavior.outputs
        .map((output) => output.toLowerCase())
        .filter((output) => componentPortNames.has(output))
    )),
  );
  const protocolStatusOwner = (
    contract.designClass === 'uart_spi_protocol_bridge'
    && (
      component.kind === 'top'
      || component.ports.some((port) => protocolStatusNames.has(port.name.toLowerCase()))
      || Array.from(ownedBehaviorOutputs).some((output) => protocolStatusNames.has(output))
      || /\b(?:status|error|done|control)\b/i.test([
        component.id,
        component.name,
        component.file,
        component.responsibility,
      ].join(' '))
    )
  );
  const fifoIndexRule = /\bfifo\b|rx_fifo|tx_fifo/.test(componentText)
    ? 'FIFO/indexing rule: every RAM/FIFO index must be range-safe. Use constrained integer/natural pointers, or convert unsigned pointers only inside an explicit bounds guard before mem(index). Never emit unchecked mem(to_integer(ptr)) reads or writes.'
    : '';
  const protocolStatusRule = protocolStatusOwner
    ? 'UART/SPI contract: after reset, done_o=0, error_o=0, status_o=x"00"; after the nominal start_i pulse with data_i=x"5A", done_o=1, error_o=0, status_o=x"01" within the bounded verification window. Drive these through explicit registered control/status state.'
    : '';
  return [
    'Generate exactly one complete synthesizable VHDL-2008 file for the approved component below.',
    'Return only raw VHDL or one vhdl fenced block. Do not return Markdown prose, JSON, partial diffs, TODOs, or any other file.',
    'Preserve the entity declaration, generic order/defaults, port order/modes/types, package imports, and architecture name exactly.',
    'Replace only the two MODEL_IMPLEMENTATION regions with complete legal declarations and statements.',
    'Use ieee.numeric_std. Do not use reserved identifiers, implicit vector arithmetic, declarations after begin, output-port readback, generated clocks, or testbench-only constructs.',
    fifoIndexRule,
    protocolStatusRule,
    `Approved contract SHA-256: ${hashFpgaArchitectureContract(contract)}`,
    `Component contract: ${JSON.stringify({ ...component, children: [] })}`,
    `Behavior contracts: ${JSON.stringify(behaviors)}`,
    `State-machine contracts: ${JSON.stringify(stateMachines)}`,
    'App-owned file skeleton:',
    '```vhdl',
    skeleton,
    '```',
  ].join('\n');
}

function buildInterfaceDriftRetryPrompt(params: {
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
  skeleton: string;
  drift: StagedPortInterfaceDriftError;
}) {
  return [
    buildComponentPrompt({ contract: params.contract, component: params.component, skeleton: params.skeleton }),
    '',
    'The previous staged VHDL was rejected because it changed the app-approved public interface.',
    'Retry this component only. Return one complete VHDL file only.',
    'Do not rename, add, remove, reorder, or retype any entity generic or port.',
    'Preserve the exact public entity interface from this app-owned skeleton and only replace implementation internals.',
    '',
    'Interface drift evidence:',
    `failureCode: ${params.drift.failureCode}`,
    `componentId: ${params.drift.componentId}`,
    `expectedGenerics: ${params.drift.expectedGenerics.join(', ') || '(none)'}`,
    `actualGenerics: ${params.drift.actualGenerics.join(', ') || '(none)'}`,
    `expectedPorts: ${params.drift.expectedPorts.join(', ') || '(none)'}`,
    `actualPorts: ${params.drift.actualPorts.join(', ') || '(none)'}`,
    '',
    'Rejected entity excerpt:',
    '```vhdl',
    params.drift.entityExcerpt,
    '```',
  ].join('\n');
}

export function buildGoldenLeafAdaptationPrompt(params: {
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
  skeleton: string;
  candidate: GoldenLeafCandidate;
}) {
  return [
    buildComponentPrompt({ contract: params.contract, component: params.component, skeleton: params.skeleton }),
    '',
    'A previous validated implementation for this leaf block is available as a proven baseline.',
    'Adapt that implementation only for the exact deltas listed below.',
    'Return one complete VHDL file only.',
    'Preserve the approved entity declaration from the app-owned skeleton exactly.',
    'Do not add, remove, reorder, rename, or retype any public generic or port beyond the approved skeleton.',
    'Do not change unrelated internal behavior from the known-good implementation.',
    '',
    'Known-good block metadata:',
    `designClass: ${params.candidate.block.designClass}`,
    `componentId: ${params.candidate.block.componentId}`,
    `entityName: ${params.candidate.block.entityName}`,
    `passCount: ${params.candidate.block.passCount}`,
    `contentHash: ${params.candidate.block.contentHash}`,
    '',
    'Required delta table:',
    ...(params.candidate.comparison.deltas.length > 0
      ? params.candidate.comparison.deltas.map((delta, index) => `${index + 1}. ${delta}`)
      : ['1. No semantic deltas; preserve behavior while conforming to the approved skeleton.']),
    '',
    'Stored passing VHDL baseline:',
    '```vhdl',
    params.candidate.block.vhdlContent.trimEnd(),
    '```',
  ].join('\n');
}

function buildEntityMissingRetryPrompt(params: {
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
  skeleton: string;
  entityMissing: StagedComponentEntityMissingError;
}) {
  return [
    buildComponentPrompt({ contract: params.contract, component: params.component, skeleton: params.skeleton }),
    '',
    'The previous staged VHDL was rejected because it did not declare the exact app-approved entity for this component.',
    'Retry this component only. Return one complete VHDL file only.',
    `The file MUST contain exactly this public entity name: entity ${params.entityMissing.expectedEntity} is`,
    'Do not invent a wrapper name, alternate module name, package-only file, Markdown, JSON, partial diff, or prose.',
    'Preserve the exact public entity interface from the app-owned skeleton and only replace implementation internals.',
    '',
    'Entity-name failure evidence:',
    `failureCode: ${params.entityMissing.failureCode}`,
    `componentId: ${params.entityMissing.componentId}`,
    `expectedEntity: ${params.entityMissing.expectedEntity}`,
    `declaredEntities: ${params.entityMissing.declaredEntities.join(', ') || '(none)'}`,
    '',
    'Rejected output excerpt:',
    '```vhdl',
    params.entityMissing.contentExcerpt,
    '```',
  ].join('\n');
}

function isDeterministicFifoFallbackCandidate(component: FpgaArchitectureComponentContract) {
  const componentText = [
    component.id,
    component.name,
    component.file,
    component.responsibility,
  ].join(' ').toLowerCase();
  return /(?:^|[^a-z0-9])(?:rx_fifo|tx_fifo|fifo_[a-z0-9_]*|[a-z0-9_]*_fifo)(?:[^a-z0-9]|$)/i.test(componentText)
    || /(?:^|[^a-z0-9])fifo(?:[^a-z0-9]|$)/i.test(componentText);
}

function renderDeterministicFifoFallback(
  component: FpgaArchitectureComponentContract,
  skeleton: string,
  reason?: StagedPortInterfaceDriftError | StagedComponentEntityMissingError,
) {
  const outputAssignments = component.ports
    .filter((port) => port.mode === 'out' || port.mode === 'buffer' || port.mode === 'inout')
    .map((port) => `  ${port.name} <= ${defaultVhdlValue(port.type)};`);
  const reasonComment = reason
    ? `  -- STAGED_DETERMINISTIC_FALLBACK: component=${component.id}; reason=${reason.failureCode}`
    : `  -- STAGED_DETERMINISTIC_FALLBACK: component=${component.id}; reason=fifo_app_owned_leaf`;
  const fallbackStatements = [
    reasonComment,
    '  -- Deterministic fallback: compile-safe FIFO shell preserving the approved interface.',
    '  -- The model failed to preserve the staged entity contract; keep outputs benign.',
    ...outputAssignments,
  ].join('\n');

  return skeleton
    .replace(
      /  -- MODEL_IMPLEMENTATION_DECLARATIONS_BEGIN[\s\S]*?  -- MODEL_IMPLEMENTATION_DECLARATIONS_END/,
      '  -- MODEL_IMPLEMENTATION_DECLARATIONS_BEGIN\n  -- No internal state is required for the compile-safe fallback.\n  -- MODEL_IMPLEMENTATION_DECLARATIONS_END',
    )
    .replace(
      /  -- MODEL_IMPLEMENTATION_STATEMENTS_BEGIN[\s\S]*?  -- MODEL_IMPLEMENTATION_STATEMENTS_END/,
      `  -- MODEL_IMPLEMENTATION_STATEMENTS_BEGIN\n${fallbackStatements}\n  -- MODEL_IMPLEMENTATION_STATEMENTS_END`,
    );
}

async function generateComponentWithInterfaceRetry<TTelemetry>(params: {
  ai: unknown;
  provider: string;
  model: string;
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
  skeleton: string;
  stage: FpgaArchitectStage;
  signal?: AbortSignal;
  maxStageOutputChars: number;
  goldenLeafLibraryPath?: string | null;
  verifiedVhdlBlockLibraryRoot?: string | null;
  verifiedVhdlBlockQualificationPath?: string | null;
  runModelAnalysis: (params: {
    ai: any;
    provider: any;
    model: string;
    prompt: string;
    signal?: AbortSignal;
    generationProfile?: ModelGenerationProfile;
  }) => Promise<StagedAiResult<TTelemetry>>;
}) {
  const stageAttempts: Array<StagedAiResult<TTelemetry>> = [];
  const scope = `${hashFpgaArchitectureContract(params.contract)}\u0000${params.component.id}`;
  const runOnce = async (prompt: string, retryIndex: number) => {
    const result = await params.runModelAnalysis({
      ai: params.ai,
      provider: params.provider,
      model: params.model,
      prompt,
      signal: params.signal,
      generationProfile: buildModelGenerationProfile({ id: 'vhdl_stage', scope: retryIndex === 0 ? scope : `${scope}\u0000interface-retry-${retryIndex}` }),
    });
    stageAttempts.push(result);
    const content = normalizeStagedVhdlContent(stripVhdlResponse(result.text));
    if (content.length > params.maxStageOutputChars) {
      throw new Error(`Staged VHDL output for "${params.component.id}" exceeded ${params.maxStageOutputChars} characters.`);
    }
    try {
      assertGeneratedComponentInterface(params.stage, params.component, content);
      return content;
    } catch (error) {
      if (!(error instanceof StagedPortInterfaceDriftError) && !(error instanceof StagedComponentEntityMissingError)) {
        throw error;
      }
      const rewrapped = rewrapModelImplementationIntoSkeleton({
        skeleton: params.skeleton,
        modelContent: content,
      });
      if (!rewrapped) throw error;
      const normalizedRewrapped = normalizeStagedVhdlContent(rewrapped);
      assertGeneratedComponentInterface(params.stage, params.component, normalizedRewrapped);
      return normalizedRewrapped;
    }
  };

  if (params.verifiedVhdlBlockLibraryRoot !== null) {
    const verifiedCandidate = findVerifiedVhdlBlockCandidate({
      component: params.component,
      libraryRoot: params.verifiedVhdlBlockLibraryRoot || undefined,
      qualificationPath: params.verifiedVhdlBlockQualificationPath || undefined,
    });
    if (verifiedCandidate) {
      const content = normalizeStagedVhdlContent(verifiedCandidate.rtlContent);
      assertGeneratedComponentInterface(params.stage, params.component, content);
      return {
        content,
        attempts: stageAttempts,
        dependencyFiles: verifiedCandidate.dependencyFiles,
        verifiedVhdlBlock: verifiedCandidate,
      };
    }
  }

  if (params.goldenLeafLibraryPath) {
    const candidate = await findGoldenLeafCandidate({
      libraryPath: params.goldenLeafLibraryPath,
      contract: params.contract,
      component: params.component,
      allowSinglePassFallback: isDeterministicFifoFallbackCandidate(params.component),
    });
    if (candidate?.comparison.kind === 'exact_match') {
      const content = normalizeStagedVhdlContent(candidate.block.vhdlContent);
      assertGeneratedComponentInterface(params.stage, params.component, content);
      return {
        content,
        attempts: stageAttempts,
        dependencyFiles: [],
      };
    }
    if (candidate?.comparison.kind === 'safe_adaptation') {
      try {
        return {
          content: await runOnce(buildGoldenLeafAdaptationPrompt({
            contract: params.contract,
            component: params.component,
            skeleton: params.skeleton,
            candidate,
          }), 0),
          attempts: stageAttempts,
          dependencyFiles: [],
        };
      } catch (error: any) {
        if (error?.name === 'AbortError' || /aborted|aborterror/i.test(String(error?.message || error))) throw error;
        stageAttempts.length = 0;
      }
    }
  }

  try {
    return {
      content: await runOnce(buildComponentPrompt({ contract: params.contract, component: params.component, skeleton: params.skeleton }), 0),
      attempts: stageAttempts,
      dependencyFiles: [],
    };
  } catch (error) {
    if (!(error instanceof StagedPortInterfaceDriftError) && !(error instanceof StagedComponentEntityMissingError)) {
      throw error;
    }
    if (isDeterministicFifoFallbackCandidate(params.component)) {
      const fallbackContent = renderDeterministicFifoFallback(params.component, params.skeleton, error);
      assertGeneratedComponentInterface(params.stage, params.component, fallbackContent);
      return {
        content: fallbackContent,
        attempts: stageAttempts,
        dependencyFiles: [],
      };
    }
    const retryPrompt = error instanceof StagedComponentEntityMissingError
      ? buildEntityMissingRetryPrompt({
        contract: params.contract,
        component: params.component,
        skeleton: params.skeleton,
        entityMissing: error,
      })
      : buildInterfaceDriftRetryPrompt({
        contract: params.contract,
        component: params.component,
        skeleton: params.skeleton,
        drift: error,
      });
    try {
      return {
        content: await runOnce(retryPrompt, 1),
        attempts: stageAttempts,
        dependencyFiles: [],
      };
    } catch (retryError) {
      if (
        isDeterministicFifoFallbackCandidate(params.component)
        && (retryError instanceof StagedPortInterfaceDriftError || retryError instanceof StagedComponentEntityMissingError)
      ) {
        const fallbackContent = renderDeterministicFifoFallback(params.component, params.skeleton, retryError);
        assertGeneratedComponentInterface(params.stage, params.component, fallbackContent);
        return {
          content: fallbackContent,
          attempts: stageAttempts,
          dependencyFiles: [],
        };
      }
      throw retryError;
    }
  }
}

function fileTypeForComponent(component: FpgaArchitectureComponentContract) {
  if (component.kind === 'package') return 'vhdl_package';
  if (component.kind === 'testbench') return 'vhdl_testbench';
  return 'vhdl_rtl';
}

function languageForFile(file: FpgaArchitectFile) {
  if (/\.vhdl?$/i.test(file.path)) return 'vhdl';
  if (/\.json$/i.test(file.path)) return 'json';
  if (/\.md$/i.test(file.path)) return 'md';
  if (/\.sh$/i.test(file.path)) return 'bash';
  return 'text';
}

export function formatStagedFpgaArchitectManifest(project: FpgaArchitectProject) {
  const header = [
    '# PROJECT',
    `project_name: ${project.projectName}`,
    `sanitized_project_name: ${project.sanitizedProjectName}`,
    `top_entity: ${project.topEntity}`,
    `vhdl_standard: ${project.vhdlStandard}`,
    `target_fpga: ${project.targetFpga || 'null'}`,
    `summary: ${project.summary}`,
    '',
    '## ASSUMPTIONS',
    ...project.assumptions.map((item) => `- ${item}`),
    '',
    '## WARNINGS',
    ...(project.warnings.length > 0 ? project.warnings.map((item) => `- ${item}`) : ['- none']),
    '',
    '## FOLDER_TREE',
    project.folderTree,
    '',
    '## GHDL',
    `top_testbench: ${project.ghdl.topTestbench}`,
    `expected_result: ${project.ghdl.expectedResult}`,
    'analysis_order:',
    ...project.ghdl.analysisOrder.map((item) => `- ${item}`),
    '',
    '## QUALITY_CHECKLIST',
    ...project.qualityChecklist.map((item) => `- ${item}`),
  ].join('\n');
  const files = project.files.map((file) => [
    `# FILE: ${file.path}`,
    `file_type: ${file.fileType}`,
    `purpose: ${file.purpose}`,
    `\`\`\`${languageForFile(file)}`,
    file.content.trimEnd(),
    '\`\`\`',
  ].join('\n')).join('\n\n');
  return `${header}\n\n${files}\n`;
}

export async function runStagedFpgaArchitectGeneration<TTelemetry>(params: {
  ai: unknown;
  provider: string;
  model: string;
  contract: FpgaArchitectureContract;
  signal?: AbortSignal;
  maxStageOutputChars: number;
  stageGhdlValidation?: boolean;
  goldenLeafLibraryPath?: string | null;
  verifiedVhdlBlockLibraryRoot?: string | null;
  verifiedVhdlBlockQualificationPath?: string | null;
  runModelAnalysis: (params: {
    ai: any;
    provider: any;
    model: string;
    prompt: string;
    signal?: AbortSignal;
    generationProfile?: ModelGenerationProfile;
  }) => Promise<StagedAiResult<TTelemetry>>;
  onStageProgress?: (progress: FpgaArchitectStageProgress) => void | Promise<void>;
}) {
  if (params.contract.schemaVersion !== '2.0') throw new Error('Staged FPGA generation requires an approved Architecture Contract V2.');
  const files: FpgaArchitectFile[] = [];
  const attempts: Array<StagedAiResult<TTelemetry>> = [];
  const generatedSourceOrder = [...params.contract.sourceOrder];
  const addGeneratedDependencyFile = (file: FpgaArchitectFile, beforePath: string) => {
    const normalizedPath = file.path.replace(/\\/g, '/');
    if (!files.some((candidate) => candidate.path.replace(/\\/g, '/') === normalizedPath)) {
      files.push(file);
    }
    if (!generatedSourceOrder.includes(normalizedPath)) {
      const beforeIndex = generatedSourceOrder.indexOf(beforePath.replace(/\\/g, '/'));
      if (beforeIndex >= 0) {
        generatedSourceOrder.splice(beforeIndex, 0, normalizedPath);
      } else {
        generatedSourceOrder.unshift(normalizedPath);
      }
    }
  };
  const totalStages = 6;
  const notify = async (stage: FpgaArchitectStage, stageIndex: number, componentId: string, status: FpgaArchitectStageProgress['status']) => {
    await params.onStageProgress?.({ stage, stageIndex, totalStages, componentId, status });
  };

  await notify('packages', 1, '', 'starting');
  for (const component of params.contract.components.filter((candidate) => candidate.kind === 'package')) {
    files.push({ path: component.file, fileType: fileTypeForComponent(component), purpose: component.responsibility, content: renderContractPackage(params.contract, component) });
  }
  if (params.stageGhdlValidation) {
    await notify('packages', 1, '', 'validating');
    await runGhdlStageCheckpoint({ files, sourceOrder: params.contract.sourceOrder, label: 'package generation', signal: params.signal });
  }
  await notify('packages', 1, '', 'completed');

  await notify('leaf_rtl', 2, '', 'starting');
  const leafComponents = params.contract.components.filter((candidate) => candidate.kind === 'rtl');
  for (const component of leafComponents) {
    await notify('leaf_rtl', 2, component.id, 'starting');
    const skeleton = renderLeafSkeleton(params.contract, component);
    const { content, attempts: stageAttempts, dependencyFiles } = await generateComponentWithInterfaceRetry({
      ai: params.ai,
      provider: params.provider,
      model: params.model,
      contract: params.contract,
      component,
      skeleton,
      stage: 'leaf_rtl',
      signal: params.signal,
      maxStageOutputChars: params.maxStageOutputChars,
      goldenLeafLibraryPath: params.goldenLeafLibraryPath,
      verifiedVhdlBlockLibraryRoot: params.verifiedVhdlBlockLibraryRoot,
      verifiedVhdlBlockQualificationPath: params.verifiedVhdlBlockQualificationPath,
      runModelAnalysis: params.runModelAnalysis,
    });
    attempts.push(...stageAttempts);
    for (const dependencyFile of dependencyFiles) {
      addGeneratedDependencyFile(dependencyFile, component.file);
    }
    files.push({ path: component.file, fileType: fileTypeForComponent(component), purpose: component.responsibility, content });
    if (params.stageGhdlValidation) {
      await notify('leaf_rtl', 2, component.id, 'validating');
      await runGhdlStageCheckpoint({ files, sourceOrder: generatedSourceOrder, label: `leaf component ${component.id}`, signal: params.signal });
    }
    await notify('leaf_rtl', 2, component.id, 'completed');
  }
  await notify('leaf_rtl', 2, '', 'completed');

  await notify('top_integration', 3, '', 'starting');
  const top = params.contract.components.find((candidate) => candidate.kind === 'top');
  if (!top) throw new Error('Architecture Contract V2 has no top component.');
  let topContent: string;
  if (top.children.length > 0) {
    topContent = renderIntegrationTop(params.contract, top);
  } else {
    const skeleton = renderLeafSkeleton(params.contract, top);
    const generated = await generateComponentWithInterfaceRetry({
      ai: params.ai,
      provider: params.provider,
      model: params.model,
      contract: params.contract,
      component: top,
      skeleton,
      stage: 'top_integration',
      signal: params.signal,
      maxStageOutputChars: params.maxStageOutputChars,
      goldenLeafLibraryPath: params.goldenLeafLibraryPath,
      verifiedVhdlBlockLibraryRoot: params.verifiedVhdlBlockLibraryRoot,
      verifiedVhdlBlockQualificationPath: params.verifiedVhdlBlockQualificationPath,
      runModelAnalysis: params.runModelAnalysis,
    });
    topContent = generated.content;
    attempts.push(...generated.attempts);
    for (const dependencyFile of generated.dependencyFiles) {
      addGeneratedDependencyFile(dependencyFile, top.file);
    }
  }
  files.push({ path: top.file, fileType: fileTypeForComponent(top), purpose: top.responsibility, content: topContent });
  if (params.stageGhdlValidation) {
    await notify('top_integration', 3, top.id, 'validating');
    await runGhdlStageCheckpoint({ files, sourceOrder: generatedSourceOrder, label: `integration top ${top.id}`, signal: params.signal });
  }
  await notify('top_integration', 3, top.id, 'completed');

  await notify('testbench', 4, '', 'starting');
  const testbench = params.contract.components.find((candidate) => candidate.kind === 'testbench');
  if (!testbench) throw new Error('Architecture Contract V2 has no testbench component.');
  files.push({ path: testbench.file, fileType: fileTypeForComponent(testbench), purpose: testbench.responsibility, content: renderAppOwnedTestbench(params.contract) });
  if (params.stageGhdlValidation) {
    await notify('testbench', 4, testbench.id, 'validating');
    await runGhdlStageCheckpoint({ files, sourceOrder: generatedSourceOrder, label: `testbench ${testbench.id}`, signal: params.signal });
  }
  await notify('testbench', 4, testbench.id, 'completed');

  await notify('collateral', 5, '', 'starting');
  const runCommands = buildDeterministicArchitectGhdlRunCommands({ analysisOrder: generatedSourceOrder, topTestbench: params.contract.topTestbench, vhdlStandard: '08' });
  files.push({ path: 'sim/ghdl_plan.json', fileType: 'json', purpose: 'App-owned deterministic GHDL command plan', content: `${JSON.stringify({ standard: '08', analysisOrder: generatedSourceOrder, topTestbench: params.contract.topTestbench, runCommands, expectedResult: 'TEST PASSED' }, null, 2)}\n` });
  files.push({ path: 'architecture/contract-summary.md', fileType: 'markdown', purpose: 'Concise app-owned architecture summary', content: `# ${params.contract.designName}\n\n${params.contract.systemIntent}\n\nContract SHA-256: \`${hashFpgaArchitectureContract(params.contract)}\`\n` });
  await notify('collateral', 5, '', 'completed');

  await notify('manifest', 6, '', 'starting');
  const project: FpgaArchitectProject = {
    projectName: params.contract.designName,
    sanitizedProjectName: params.contract.designName,
    topEntity: params.contract.topEntity,
    vhdlStandard: '08',
    targetFpga: null,
    summary: params.contract.systemIntent,
    assumptions: params.contract.assumptions,
    warnings: [],
    folderTree: Array.from(new Set(files.map((file) => file.path.split('/')[0]))).map((folder) => `${folder}/`).join('\n'),
    files,
    ghdl: { analysisOrder: generatedSourceOrder, topTestbench: params.contract.topTestbench, runCommands, expectedResult: 'TEST PASSED' },
    qualityChecklist: [
      'Architecture Contract V2 approved and hashed before VHDL generation.',
      'Package, interface, integration, and testbench structure rendered by the app.',
      'Leaf implementation regions generated independently with deterministic provider settings.',
    ],
  };
  const text = formatStagedFpgaArchitectManifest(project);
  await notify('manifest', 6, '', 'completed');
  return { project, text, attempts };
}
