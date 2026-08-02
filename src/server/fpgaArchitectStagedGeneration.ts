import { execFile } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import type { FpgaArchitectFile, FpgaArchitectProject } from './fpgaArchitect';
import { buildDeterministicArchitectGhdlRunCommands } from './fpgaArchitect';
import type { FpgaArchitectureComponentContract, FpgaArchitectureContract, FpgaArchitecturePortContract } from './fpgaArchitectureContract';
import { completeFpgaArchitectureContract, hashFpgaArchitectureContract } from './fpgaArchitectureContract';
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
  buildLeafInterfaceSignature,
  type GoldenLeafCandidate,
} from './fpgaGoldenLeafLibrary';
import {
  findVerifiedVhdlBlockCandidate,
  findVerifiedVhdlBlockNearMatch,
  type VerifiedVhdlBlockNearMatch,
} from './fpgaVerifiedVhdlBlockLibrary';
import { planVerifiedVhdlWrapper, renderVerifiedVhdlWrapper, type VerifiedWrapperPlan } from './fpgaVerifiedVhdlWrapper';
import {
  evaluateVerifiedVhdlParameterCompatibility,
  hasSamePublicInterfaceIgnoringGenericDefaults,
  type VerifiedVhdlParameterCompatibilityResult,
} from './fpgaVerifiedVhdlParameterGate';
import {
  applyVerifiedGenericPromotionToContract,
  promoteVerifiedVhdlGenericsIntoComponent,
} from './fpgaArchitectureParameterIntent';
import { findBootstrapFacadeNearMatch } from './fpgaBootstrapArchitectureResolver';
import { normalizeComponentContractForVerifiedCapability } from './fpgaCapabilityContractNormalizer';
import { renderDeterministicLeafTemplate } from './fpgaDeterministicLeafTemplates';
import type { FpgaVhdlImplementationPolicy } from './fpgaPipelineConfig';
import {
  buildVhdlSpecialistAdvisorPrompt,
  scoreVhdlSpecialistAdvisorResponse,
  type VhdlSpecialistMissingSignalAdvice,
  type VhdlSpecialistAdvisorScore,
} from './fpgaVhdlSpecialistAdvisor';
import { classifyVerifiedPortRole, rolesCompatible } from './fpgaVerifiedVhdlPortRoles';

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

function shouldWrapAsStagedRuntimeError(error: unknown) {
  if ((error as any)?.failureCode) return false;
  if ((error as any)?.name === 'AbortError' || /aborted|aborterror/i.test(String((error as any)?.message || error))) return false;
  return true;
}

function formatVhdlSpecialistAdviceForError(advice: VhdlSpecialistAdvisorScore | null) {
  if (!advice) return 'specialistAdvice=not_run';
  const acceptedMappings = advice.acceptedMappings.map((mapping) => `${mapping.verifiedPort}->${mapping.approvedPort}`).join(',') || '(none)';
  const missingSignals = advice.missingContractSignals.map((signal) => signal.name).join(',') || '(none)';
  const rejected = advice.rejectedReasons.slice(0, 5).join(' | ') || '(none)';
  return [
    `specialistAdvice=${advice.accepted ? 'accepted' : 'rejected'}`,
    `specialistAcceptedMappings=${acceptedMappings}`,
    `specialistMissingSignals=${missingSignals}`,
    `specialistRejectedReasons=${rejected}`,
    `specialistVerdict=${advice.verdict}`,
  ].join('\n');
}

function createTimeoutSignal(parent: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromParent = () => controller.abort();
  if (parent?.aborted) controller.abort();
  parent?.addEventListener('abort', abortFromParent, { once: true });
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeout);
      parent?.removeEventListener('abort', abortFromParent);
    },
  };
}

function normalizePortName(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase();
}

function isLegalBasicVhdlIdentifier(value: string) {
  return /^[A-Za-z][A-Za-z0-9_]*$/.test(value) && !VHDL_RESERVED_IDENTIFIER_SET.has(value.toLowerCase());
}

function findUnresolvedVerifiedPort(params: {
  candidate: VerifiedVhdlBlockNearMatch;
  wrapperPlan: VerifiedWrapperPlan;
  requiredFor: string | undefined;
}) {
  const required = normalizePortName(params.requiredFor);
  if (!required) return null;
  const unresolved = new Set(params.wrapperPlan.mismatches
    .filter((mismatch) => ['extra_port', 'verified_config_input_unresolved'].includes(mismatch.kind))
    .map((mismatch) => normalizePortName(mismatch.verifiedName)));
  if (!unresolved.has(required)) return null;
  return params.candidate.actualSignature.ports.find((port) => normalizePortName(port.name) === required) || null;
}

function advisorSignalMatchesVerifiedPort(params: {
  component: FpgaArchitectureComponentContract;
  verifiedPort: { name: string; mode?: string; type: string };
  signal: VhdlSpecialistMissingSignalAdvice;
}) {
  if (!isLegalBasicVhdlIdentifier(params.signal.name)) return false;
  if (params.signal.direction && normalizePortName(params.signal.direction) !== normalizePortName(params.verifiedPort.mode)) return false;
  if (params.signal.type && params.signal.type.trim().toLowerCase() !== params.verifiedPort.type.trim().toLowerCase()) return false;
  const advisedRole = params.signal.role
    ? { role: params.signal.role as any, activeLowReset: false, optional: false, confidence: 100, evidence: ['advisor role'] }
    : null;
  const verifiedRole = classifyVerifiedPortRole(params.verifiedPort as any, params.component);
  return !advisedRole || rolesCompatible(verifiedRole, advisedRole) || verifiedRole.role === advisedRole.role;
}

function applyAcceptedVhdlSpecialistAdviceToContract(params: {
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
  candidate: VerifiedVhdlBlockNearMatch;
  wrapperPlan: VerifiedWrapperPlan;
  advice: VhdlSpecialistAdvisorScore | null;
}): { contract: FpgaArchitectureContract; component: FpgaArchitectureComponentContract; addedPorts: FpgaArchitecturePortContract[] } | null {
  if (!params.advice?.accepted || params.advice.missingContractSignals.length === 0) return null;
  const existingPortNames = new Set(params.component.ports.map((port) => normalizePortName(port.name)));
  const addedPorts: FpgaArchitecturePortContract[] = [];
  for (const signal of params.advice.missingContractSignals) {
    const verifiedPort = findUnresolvedVerifiedPort({
      candidate: params.candidate,
      wrapperPlan: params.wrapperPlan,
      requiredFor: signal.requiredFor,
    });
    if (!verifiedPort) continue;
    if (!advisorSignalMatchesVerifiedPort({ component: params.component, verifiedPort, signal })) continue;
    const normalized = normalizePortName(signal.name);
    if (existingPortNames.has(normalized)) continue;
    existingPortNames.add(normalized);
    addedPorts.push({
      name: signal.name,
      mode: (verifiedPort.mode || 'in') as FpgaArchitecturePortContract['mode'],
      type: verifiedPort.type,
      purpose: [
        `Advisor-normalized contract signal for verified port ${verifiedPort.name}.`,
        signal.rationale || '',
      ].filter(Boolean).join(' '),
    });
  }
  if (addedPorts.length === 0) return null;
  const componentWithAdvice: FpgaArchitectureComponentContract = {
    ...params.component,
    ports: [...params.component.ports, ...addedPorts],
  };
  const contractWithAdvice: FpgaArchitectureContract = {
    ...params.contract,
    assumptions: [
      ...(params.contract.assumptions || []),
      `VHDL_SPECIALIST_CONTRACT_NORMALIZATION component=${params.component.id} addedPorts=${addedPorts.map((port) => port.name).join(',')}`,
    ],
    components: params.contract.components.map((component) => (
      component.id === params.component.id ? componentWithAdvice : component
    )),
  };
  const completed = completeFpgaArchitectureContract({
    contract: contractWithAdvice,
    userRequest: contractWithAdvice.systemIntent,
  });
  const completedComponent = completed.contract.components.find((component) => component.id === params.component.id);
  if (!completedComponent) return null;
  return {
    contract: completed.contract,
    component: completedComponent,
    addedPorts,
  };
}

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

export class StagedComponentOutputOwnershipError extends Error {
  readonly failureCode = 'component_output_ownership_violation';
  readonly stage: FpgaArchitectStage;
  readonly componentId: string;
  readonly componentName: string;
  readonly assignedTarget: string;
  readonly lineHint: number;
  readonly excerpt: string;
  readonly allowedOutputPorts: string[];
  readonly localDeclarations: string[];

  constructor(params: {
    stage: FpgaArchitectStage;
    component: FpgaArchitectureComponentContract;
    assignedTarget: string;
    lineHint: number;
    excerpt: string;
    allowedOutputPorts: string[];
    localDeclarations: string[];
  }) {
    super([
      'component_output_ownership_violation',
      `Staged VHDL for component "${params.component.id}" assigns "${params.assignedTarget}", but that name is not owned by this component.`,
      `componentId=${params.component.id}`,
      `entityName=${params.component.name}`,
      `line=${params.lineHint}`,
      `assignedTarget=${params.assignedTarget}`,
      `allowedOutputPorts=${params.allowedOutputPorts.join(',') || '(none)'}`,
      `localDeclarations=${params.localDeclarations.slice(0, 24).join(',') || '(none)'}`,
      `excerpt=${params.excerpt}`,
    ].join('\n'));
    this.name = 'StagedComponentOutputOwnershipError';
    this.stage = params.stage;
    this.componentId = params.component.id;
    this.componentName = params.component.name;
    this.assignedTarget = params.assignedTarget;
    this.lineHint = params.lineHint;
    this.excerpt = params.excerpt;
    this.allowedOutputPorts = params.allowedOutputPorts;
    this.localDeclarations = params.localDeclarations;
  }
}

export class ModelVhdlGenerationBlockedByPolicyError extends Error {
  readonly failureCode = 'model_vhdl_generation_blocked_by_policy';
  readonly stage: FpgaArchitectStage;
  readonly componentId: string;
  readonly componentName: string;
  readonly policy: FpgaVhdlImplementationPolicy;

  constructor(params: {
    stage: FpgaArchitectStage;
    component: FpgaArchitectureComponentContract;
    policy: FpgaVhdlImplementationPolicy;
  }) {
    super([
      'model_vhdl_generation_blocked_by_policy',
      `Strict FPGA implementation policy blocked fresh model-authored VHDL for component "${params.component.id}".`,
      `componentId=${params.component.id}`,
      `componentName=${params.component.name}`,
      `policy=${params.policy}`,
      'Provide a verified library block, an exact golden leaf, or a deterministic app-owned template for this component.',
    ].join('\n'));
    this.name = 'ModelVhdlGenerationBlockedByPolicyError';
    this.stage = params.stage;
    this.componentId = params.component.id;
    this.componentName = params.component.name;
    this.policy = params.policy;
  }
}

export class VerifiedLeafImplementationMissingError extends Error {
  readonly failureCode = 'verified_leaf_implementation_missing';
  readonly stage: FpgaArchitectStage;
  readonly componentId: string;
  readonly componentName: string;

  constructor(params: {
    stage: FpgaArchitectStage;
    component: FpgaArchitectureComponentContract;
  }) {
    super([
      'verified_leaf_implementation_missing',
      `No verified/golden/template VHDL implementation is available for component "${params.component.id}".`,
      `componentId=${params.component.id}`,
      `componentName=${params.component.name}`,
      'The app will not ask the model to invent fresh VHDL under the strict implementation policy.',
    ].join('\n'));
    this.name = 'VerifiedLeafImplementationMissingError';
    this.stage = params.stage;
    this.componentId = params.component.id;
    this.componentName = params.component.name;
  }
}

export class StagedGenerationRuntimeError extends Error {
  readonly failureCode = 'staged_generation_runtime_error';
  readonly stage: FpgaArchitectStage;
  readonly componentId: string;
  readonly componentName: string;
  readonly originalMessage: string;

  constructor(params: {
    stage: FpgaArchitectStage;
    component: FpgaArchitectureComponentContract;
    error: unknown;
  }) {
    const originalMessage = params.error instanceof Error ? params.error.message : String(params.error);
    super([
      'staged_generation_runtime_error',
      `The app hit an internal staged-generation runtime error while processing component "${params.component.id}".`,
      `stage=${params.stage}`,
      `componentId=${params.component.id}`,
      `componentName=${params.component.name}`,
      `originalMessage=${originalMessage}`,
    ].join('\n'));
    this.name = 'StagedGenerationRuntimeError';
    this.stage = params.stage;
    this.componentId = params.component.id;
    this.componentName = params.component.name;
    this.originalMessage = originalMessage;
  }
}

export class VerifiedWrapperUnsafeMismatchError extends Error {
  readonly failureCode = 'verified_semantic_wrapper_unsafe_mismatch';
  readonly stage: FpgaArchitectStage;
  readonly componentId: string;
  readonly componentName: string;
  readonly verifiedBlockName: string;
  readonly verifiedEntityName: string;
  readonly unsafeReasons: string[];
  readonly mismatches: string[];
  readonly specialistAdvice: VhdlSpecialistAdvisorScore | null;

  constructor(params: {
    stage: FpgaArchitectStage;
    component: FpgaArchitectureComponentContract;
    candidate: VerifiedVhdlBlockNearMatch;
    plan: VerifiedWrapperPlan;
    specialistAdvice?: VhdlSpecialistAdvisorScore | null;
  }) {
    super([
      'verified_semantic_wrapper_unsafe_mismatch',
      `Verified VHDL block "${params.candidate.blockName}" was found for component "${params.component.id}", but the interface mismatch is not safe to wrap deterministically.`,
      `componentId=${params.component.id}`,
      `componentName=${params.component.name}`,
      `verifiedBlock=${params.candidate.blockName}`,
      `verifiedEntity=${params.candidate.entityName}`,
      `unsafeReasons=${params.plan.unsafeReasons.join(' | ') || '(none)'}`,
      `mismatches=${params.plan.mismatches.map((mismatch) => mismatch.message).join(' | ') || '(none)'}`,
      formatVhdlSpecialistAdviceForError(params.specialistAdvice || null),
    ].join('\n'));
    this.name = 'VerifiedWrapperUnsafeMismatchError';
    this.stage = params.stage;
    this.componentId = params.component.id;
    this.componentName = params.component.name;
    this.verifiedBlockName = params.candidate.blockName;
    this.verifiedEntityName = params.candidate.entityName;
    this.unsafeReasons = params.plan.unsafeReasons;
    this.mismatches = params.plan.mismatches.map((mismatch) => mismatch.message);
    this.specialistAdvice = params.specialistAdvice || null;
  }
}

export class HybridImplementationSourceUnresolvedError extends Error {
  readonly failureCode = 'hybrid_implementation_source_unresolved';
  readonly stage: FpgaArchitectStage;
  readonly componentId: string;
  readonly componentName: string;
  readonly verifiedBlockName: string;
  readonly verifiedEntityName: string;
  readonly unsafeReasons: string[];
  readonly specialistAdvice: VhdlSpecialistAdvisorScore | null;

  constructor(params: {
    stage: FpgaArchitectStage;
    component: FpgaArchitectureComponentContract;
    candidate: VerifiedVhdlBlockNearMatch;
    plan: VerifiedWrapperPlan;
    specialistAdvice?: VhdlSpecialistAdvisorScore | null;
  }) {
    super([
      'hybrid_implementation_source_unresolved',
      `Curated verified-library wrapping is unsafe for component "${params.component.id}", so the app must switch to hybrid source discovery before generating this leaf.`,
      `componentId=${params.component.id}`,
      `componentName=${params.component.name}`,
      `verifiedBlock=${params.candidate.blockName}`,
      `verifiedEntity=${params.candidate.entityName}`,
      `unsafeReasons=${params.plan.unsafeReasons.join(' | ') || '(none)'}`,
      formatVhdlSpecialistAdviceForError(params.specialistAdvice || null),
      'Do not ask the model to invent fresh VHDL for this component until a verified source, safe wrapper, golden leaf, deterministic template, or approved hybrid source is available.',
    ].join('\n'));
    this.name = 'HybridImplementationSourceUnresolvedError';
    this.stage = params.stage;
    this.componentId = params.component.id;
    this.componentName = params.component.name;
    this.verifiedBlockName = params.candidate.blockName;
    this.verifiedEntityName = params.candidate.entityName;
    this.unsafeReasons = params.plan.unsafeReasons;
    this.specialistAdvice = params.specialistAdvice || null;
  }
}

export class VerifiedParameterUnsafeMismatchError extends Error {
  readonly failureCode = 'verified_parameter_unsafe_mismatch';
  readonly stage: FpgaArchitectStage;
  readonly componentId: string;
  readonly componentName: string;
  readonly verifiedBlockName: string;
  readonly unsafeReasons: string[];

  constructor(params: {
    stage: FpgaArchitectStage;
    component: FpgaArchitectureComponentContract;
    candidate: VerifiedVhdlBlockNearMatch;
    parameterCompatibility: VerifiedVhdlParameterCompatibilityResult;
  }) {
    super([
      'verified_parameter_unsafe_mismatch',
      `Verified VHDL block "${params.candidate.blockName}" cannot be configured safely for component "${params.component.id}".`,
      `componentId=${params.component.id}`,
      `componentName=${params.component.name}`,
      `verifiedBlock=${params.candidate.blockName}`,
      `verifiedEntity=${params.candidate.entityName}`,
      `unsafeReasons=${params.parameterCompatibility.unsafeReasons.join(' | ') || '(none)'}`,
      `resolvedValues=${JSON.stringify(params.parameterCompatibility.resolvedValues)}`,
    ].join('\n'));
    this.name = 'VerifiedParameterUnsafeMismatchError';
    this.stage = params.stage;
    this.componentId = params.component.id;
    this.componentName = params.component.name;
    this.verifiedBlockName = params.candidate.blockName;
    this.unsafeReasons = params.parameterCompatibility.unsafeReasons;
  }
}

export class VerifiedParameterSmokeFailedError extends Error {
  readonly failureCode = 'verified_parameter_smoke_failed';
  readonly stage: FpgaArchitectStage;
  readonly componentId: string;
  readonly componentName: string;
  readonly verifiedBlockName: string;
  readonly configurationHash: string;

  constructor(params: {
    stage: FpgaArchitectStage;
    component: FpgaArchitectureComponentContract;
    candidate: VerifiedVhdlBlockNearMatch;
    parameterCompatibility: VerifiedVhdlParameterCompatibilityResult;
    cause: unknown;
  }) {
    super([
      'verified_parameter_smoke_failed',
      `Configured verified VHDL block "${params.candidate.blockName}" failed focused GHDL smoke for component "${params.component.id}".`,
      `componentId=${params.component.id}`,
      `componentName=${params.component.name}`,
      `verifiedBlock=${params.candidate.blockName}`,
      `verifiedEntity=${params.candidate.entityName}`,
      `configurationHash=${params.parameterCompatibility.configurationHash}`,
      `resolvedValues=${JSON.stringify(params.parameterCompatibility.resolvedValues)}`,
      `cause=${params.cause instanceof Error ? params.cause.message : String(params.cause)}`,
    ].join('\n'));
    this.name = 'VerifiedParameterSmokeFailedError';
    this.stage = params.stage;
    this.componentId = params.component.id;
    this.componentName = params.component.name;
    this.verifiedBlockName = params.candidate.blockName;
    this.configurationHash = params.parameterCompatibility.configurationHash;
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

function defaultSignalInitializerForType(type: string) {
  const normalized = type.toLowerCase();
  if (/\bstd_(?:u)?logic\b/.test(normalized) && !/vector/.test(normalized)) return " := '0'";
  if (/\b(?:std_logic_vector|std_ulogic_vector|unsigned|signed)\b/.test(normalized)) return " := (others => '0')";
  if (/\bboolean\b/.test(normalized)) return ' := false';
  if (/\b(?:integer|natural|positive)\b/.test(normalized)) return ' := 0';
  return '';
}

function substituteResolvedGenericValues(type: string, resolvedValues: Record<string, string>) {
  let result = type;
  for (const [name, value] of Object.entries(resolvedValues)) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), value);
  }
  return result;
}

function renderConfiguredVerifiedBlockSmoke(params: {
  candidate: VerifiedVhdlBlockNearMatch;
  parameterCompatibility: VerifiedVhdlParameterCompatibilityResult;
}) {
  const signalLines = params.candidate.actualSignature.ports.map((port) => {
    const signalType = substituteResolvedGenericValues(port.type, params.parameterCompatibility.resolvedValues);
    return `  signal s_${port.name.toLowerCase()} : ${signalType}${defaultSignalInitializerForType(signalType)};`;
  });
  const genericPairs = Object.entries(params.parameterCompatibility.resolvedValues);
  const portMap = params.candidate.actualSignature.ports
    .map((port, index) => `      ${port.name} => ${port.mode === 'out' || port.mode === 'buffer' ? 's_' : 's_'}${port.name.toLowerCase()}${index === params.candidate.actualSignature.ports.length - 1 ? '' : ','}`);
  return [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'use ieee.numeric_std.all;',
    '',
    `entity tb_configured_${params.candidate.entityName} is`,
    `end entity tb_configured_${params.candidate.entityName};`,
    '',
    `architecture sim of tb_configured_${params.candidate.entityName} is`,
    ...signalLines,
    'begin',
    `  dut : entity work.${params.candidate.entityName}`,
    ...(genericPairs.length > 0 ? [
      '    generic map (',
      ...genericPairs.map(([genericName, value], index) => `      ${genericName} => ${value}${index === genericPairs.length - 1 ? '' : ','}`),
      '    )',
    ] : []),
    ...(portMap.length > 0 ? [
      '    port map (',
      ...portMap,
      '    );',
    ] : ['    ;']),
    'end architecture sim;',
    '',
  ].join('\n');
}

function vhdlConfigLiteralToJsonValue(value: string) {
  const normalized = String(value || '').trim().replace(/_/g, '');
  if (/^(?:true|false)$/i.test(normalized)) return /^true$/i.test(normalized);
  if (/^[+-]?\d+$/.test(normalized)) {
    const parsed = Number.parseInt(normalized, 10);
    if (Number.isSafeInteger(parsed)) return parsed;
  }
  return value;
}

async function buildProjectLockedVerifiedWrapper(params: {
  stage: FpgaArchitectStage;
  component: FpgaArchitectureComponentContract;
  candidate: VerifiedVhdlBlockNearMatch;
  parameterCompatibility: VerifiedVhdlParameterCompatibilityResult;
  libraryRoot: string;
  signal?: AbortSignal;
}): Promise<VerifiedVhdlBlockNearMatch> {
  if (!params.candidate.manifestRelativePath) return params.candidate;
  const scriptPath = path.join(params.libraryRoot, 'scripts', 'configuration', 'generate_locked_wrapper.py');
  try {
    await fs.stat(scriptPath);
  } catch {
    return params.candidate;
  }
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-verified-wrapper-'));
  try {
    const configPath = path.join(tempDir, `${params.component.id}.json`);
    const wrapperEntity = `${params.component.name}_det_cfg_${params.parameterCompatibility.configurationHash.slice(0, 12)}`.replace(/[^A-Za-z0-9_]/g, '_');
    const outputPath = path.join(tempDir, `${wrapperEntity}.vhd`);
    const generics: Record<string, boolean | number | string> = {};
    for (const [name, value] of Object.entries(params.parameterCompatibility.resolvedValues)) {
      generics[name] = vhdlConfigLiteralToJsonValue(value);
    }
    await fs.writeFile(configPath, `${JSON.stringify({ wrapper_entity: wrapperEntity, generics }, null, 2)}\n`, 'utf8');
    await execFileAsync(
      'python3',
      [
        scriptPath,
        '--manifest',
        path.join(params.libraryRoot, params.candidate.manifestRelativePath),
        '--config',
        configPath,
        '--output',
        outputPath,
        '--entity-name',
        wrapperEntity,
      ],
      { signal: params.signal, maxBuffer: 4 * 1024 * 1024 },
    );
    const rtlContent = await fs.readFile(outputPath, 'utf8');
    const actualSignature = buildVhdlEntityInterfaceSignature(rtlContent, wrapperEntity);
    if (!actualSignature) return params.candidate;
    const generatedRtlPath = `lib/fpga_vhdl_blocks/generated/project_wrappers/${wrapperEntity}.vhd`;
    return {
      ...params.candidate,
      entityName: wrapperEntity,
      relativeRtlPath: `generated/project_wrappers/${wrapperEntity}.vhd`,
      generatedRtlPath,
      rtlContent,
      rtlFile: {
        path: generatedRtlPath,
        fileType: 'vhdl_rtl',
        purpose: `Deterministic configured VHDL wrapper for ${params.component.id}`,
        content: rtlContent,
      },
      actualSignature,
      configurationId: actualSignature.generics.find((generic) => generic.name === 'G_CONFIG_ID')?.defaultValue || params.candidate.configurationId,
      deterministicWrapper: true,
    };
  } catch (error) {
    throw new VerifiedParameterSmokeFailedError({
      stage: params.stage,
      component: params.component,
      candidate: params.candidate,
      parameterCompatibility: params.parameterCompatibility,
      cause: error,
    });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function runConfiguredVerifiedBlockSmoke(params: {
  stage: FpgaArchitectStage;
  component: FpgaArchitectureComponentContract;
  candidate: VerifiedVhdlBlockNearMatch;
  parameterCompatibility: VerifiedVhdlParameterCompatibilityResult;
  signal?: AbortSignal;
}) {
  const smokeFile: FpgaArchitectFile = {
    path: `lib/fpga_vhdl_blocks/smoke/tb_configured_${params.candidate.entityName}_${params.parameterCompatibility.configurationHash.slice(0, 12)}.vhd`,
    fileType: 'vhdl_testbench',
    purpose: `Focused configured-parameter smoke for ${params.component.id}`,
    content: renderConfiguredVerifiedBlockSmoke({
      candidate: params.candidate,
      parameterCompatibility: params.parameterCompatibility,
    }),
  };
  try {
    await runGhdlStageCheckpoint({
      files: [...params.candidate.dependencyFiles, params.candidate.rtlFile, smokeFile],
      sourceOrder: [
        ...params.candidate.dependencyFiles.map((file) => file.path),
        params.candidate.rtlFile.path,
        smokeFile.path,
      ],
      label: `configured verified block ${params.component.id}`,
      signal: params.signal,
    });
  } catch (error) {
    throw new VerifiedParameterSmokeFailedError({
      stage: params.stage,
      component: params.component,
      candidate: params.candidate,
      parameterCompatibility: params.parameterCompatibility,
      cause: error,
    });
  }
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

function lineTextAtLine(content: string, line: number) {
  return content.split(/\r\n|\r|\n/)[Math.max(0, line - 1)]?.trim() || '';
}

function stripLineComments(content: string) {
  return content.replace(/--.*$/gm, '');
}

function extractArchitectureRegion(content: string, entityName: string) {
  const escapedEntity = entityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const startMatch = content.match(new RegExp(`\\barchitecture\\s+[a-zA-Z][a-zA-Z0-9_]*\\s+of\\s+${escapedEntity}\\s+is\\b`, 'i'));
  if (!startMatch || startMatch.index == null) return null;
  const startIndex = startMatch.index;
  const remainder = content.slice(startIndex);
  const endMatch = remainder.match(/\bend\s+architecture(?:\s+[a-zA-Z][a-zA-Z0-9_]*)?\s*;/i);
  const endIndex = endMatch?.index == null ? content.length : startIndex + endMatch.index + endMatch[0].length;
  const full = content.slice(startIndex, endIndex);
  const beginMatch = full.match(/\bbegin\b/i);
  const declarative = beginMatch?.index == null ? full : full.slice(0, beginMatch.index);
  return { full, declarative, startIndex };
}

function collectLocalArchitectureDeclarations(declarativeRegion: string) {
  const names = new Set<string>();
  const addList = (rawNames: string) => {
    for (const rawName of rawNames.split(',')) {
      const name = rawName.trim().match(/[a-zA-Z][a-zA-Z0-9_]*/)?.[0];
      if (name) names.add(name.toLowerCase());
    }
  };
  for (const match of declarativeRegion.matchAll(/\b(?:signal|constant|alias)\s+([a-zA-Z][a-zA-Z0-9_]*(?:\s*,\s*[a-zA-Z][a-zA-Z0-9_]*)*)\b\s*(?::|is\b)/gi)) {
    addList(match[1]);
  }
  for (const match of declarativeRegion.matchAll(/\b(?:shared\s+)?variable\s+([a-zA-Z][a-zA-Z0-9_]*(?:\s*,\s*[a-zA-Z][a-zA-Z0-9_]*)*)\s*:/gi)) {
    addList(match[1]);
  }
  return names;
}

function collectSignalAssignmentTargets(content: string) {
  const targets: Array<{ name: string; line: number; excerpt: string }> = [];
  const clean = stripLineComments(content);
  for (const match of clean.matchAll(/(^|[;\n]|\bbegin\b)\s*([a-zA-Z][a-zA-Z0-9_]*)(?:\s*(?:\([^;\n]*?\)|\.[a-zA-Z][a-zA-Z0-9_]*))*\s*<=/gim)) {
    if (match.index == null) continue;
    const targetName = match[2];
    const targetIndex = match.index + match[0].lastIndexOf(targetName);
    const line = clean.slice(0, targetIndex).split(/\r\n|\r|\n/).length;
    targets.push({ name: targetName, line, excerpt: lineTextAtLine(content, line) });
  }
  return targets;
}

function findComponentOutputOwnershipViolation(params: {
  stage: FpgaArchitectStage;
  component: FpgaArchitectureComponentContract;
  content: string;
}) {
  const architecture = extractArchitectureRegion(params.content, params.component.name);
  if (!architecture) return null;
  const localDeclarations = collectLocalArchitectureDeclarations(architecture.declarative);
  const writablePublicPorts = new Set(
    params.component.ports
      .filter((port) => port.mode === 'out' || port.mode === 'buffer' || port.mode === 'inout')
      .map((port) => port.name.toLowerCase()),
  );
  const architectureStartLine = params.content.slice(0, architecture.startIndex).split(/\r\n|\r|\n/).length;
  for (const assignment of collectSignalAssignmentTargets(architecture.full)) {
    const normalizedTarget = assignment.name.toLowerCase();
    if (localDeclarations.has(normalizedTarget)) continue;
    if (writablePublicPorts.has(normalizedTarget)) continue;
    return new StagedComponentOutputOwnershipError({
      stage: params.stage,
      component: params.component,
      assignedTarget: assignment.name,
      lineHint: architectureStartLine + assignment.line - 1,
      excerpt: assignment.excerpt,
      allowedOutputPorts: Array.from(writablePublicPorts),
      localDeclarations: Array.from(localDeclarations),
    });
  }
  return null;
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
  const ownershipViolation = findComponentOutputOwnershipViolation({ stage, component, content });
  if (ownershipViolation) throw ownershipViolation;
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
      component.ports.some((port) => protocolStatusNames.has(port.name.toLowerCase()))
      || Array.from(ownedBehaviorOutputs).some((output) => protocolStatusNames.has(output))
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
    'Component ownership rule: this file may assign only local signals/variables declared inside this architecture, or out/buffer/inout ports declared in the approved entity. Never assign parent/top outputs, sibling outputs, undeclared names, or input ports.',
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

function buildOutputOwnershipRetryPrompt(params: {
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
  skeleton: string;
  ownership: StagedComponentOutputOwnershipError;
}) {
  return [
    buildComponentPrompt({ contract: params.contract, component: params.component, skeleton: params.skeleton }),
    '',
    'The previous staged VHDL was rejected because it assigned a signal or output that this component does not own.',
    'Retry this component only. Return one complete VHDL file only.',
    'Remove assignments to undeclared parent/top/sibling outputs. If a status/result must leave the component, expose it only through an approved out/buffer/inout port already present in the skeleton.',
    'Do not add ports to solve this. Preserve the approved public interface exactly and keep the fix inside implementation internals.',
    '',
    'Ownership failure evidence:',
    `failureCode: ${params.ownership.failureCode}`,
    `componentId: ${params.ownership.componentId}`,
    `entityName: ${params.ownership.componentName}`,
    `assignedTarget: ${params.ownership.assignedTarget}`,
    `line: ${params.ownership.lineHint}`,
    `allowedOutputPorts: ${params.ownership.allowedOutputPorts.join(', ') || '(none)'}`,
    `localDeclarationsSeen: ${params.ownership.localDeclarations.slice(0, 24).join(', ') || '(none)'}`,
    '',
    'Rejected assignment line:',
    '```vhdl',
    params.ownership.excerpt,
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
  vhdlImplementationPolicy?: FpgaVhdlImplementationPolicy;
  hybridOnUnsafeWrapper?: boolean;
  vhdlSpecialistAdvisor?: boolean;
  stageGhdlValidation?: boolean;
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
      if (
        !(error instanceof StagedPortInterfaceDriftError)
        && !(error instanceof StagedComponentEntityMissingError)
        && !(error instanceof StagedComponentOutputOwnershipError)
      ) {
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

  const runVhdlSpecialistAdvisor = async (
    candidate: VerifiedVhdlBlockNearMatch,
    component: FpgaArchitectureComponentContract,
    wrapperPlan: VerifiedWrapperPlan,
  ): Promise<VhdlSpecialistAdvisorScore | null> => {
    if (params.vhdlSpecialistAdvisor === false) return null;
    const timeout = createTimeoutSignal(params.signal, 90_000);
    try {
      const prompt = buildVhdlSpecialistAdvisorPrompt({ component, candidate, wrapperPlan });
      const result = await params.runModelAnalysis({
        ai: params.ai,
        provider: params.provider,
        model: params.model,
        prompt,
        signal: timeout.signal,
        generationProfile: buildModelGenerationProfile({
          id: 'vhdl_advisor',
          scope: `${hashFpgaArchitectureContract(params.contract)}\u0000${component.id}\u0000${candidate.blockName}`,
          maxOutputTokens: 512,
        }),
      });
      stageAttempts.push(result);
      return scoreVhdlSpecialistAdvisorResponse({
        component,
        candidate,
        wrapperPlan,
        responseText: result.text,
      });
    } catch (error: any) {
      if (params.signal?.aborted) throw error;
      return {
        accepted: false,
        acceptedMappings: [],
        rejectedMappings: [],
        missingContractSignals: [],
        rejectedReasons: [`advisor failed or timed out: ${String(error?.message || error)}`],
        verdict: 'advisor unavailable',
        rawText: '',
      };
    } finally {
      timeout.cleanup();
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
    const capabilityNormalization = normalizeComponentContractForVerifiedCapability({
      contract: params.contract,
      component: params.component,
    });
    const verifiedComponent = capabilityNormalization.component;
    const verifiedContract = capabilityNormalization.contract;
    const bootstrapFacade = findBootstrapFacadeNearMatch({
      component: verifiedComponent,
      verifiedLibraryRoot: params.verifiedVhdlBlockLibraryRoot || undefined,
      qualificationPath: params.verifiedVhdlBlockQualificationPath || undefined,
    });
    if (bootstrapFacade) {
      const bootstrapParameterCompatibility = evaluateVerifiedVhdlParameterCompatibility({
        component: verifiedComponent,
        candidate: bootstrapFacade,
      });
      const wrapperPlan = planVerifiedVhdlWrapper({
        component: verifiedComponent,
        candidate: bootstrapFacade,
        parameterCompatibility: bootstrapParameterCompatibility.kind === 'parameter_unsafe'
          ? undefined
          : bootstrapParameterCompatibility,
      });
      if (wrapperPlan.kind === 'wrapper_safe') {
        const content = normalizeStagedVhdlContent(renderVerifiedVhdlWrapper({
          contract: verifiedContract,
          component: verifiedComponent,
          plan: wrapperPlan,
        }));
        assertGeneratedComponentInterface(params.stage, verifiedComponent, content);
        return {
          content,
          attempts: stageAttempts,
          dependencyFiles: [...bootstrapFacade.dependencyFiles, bootstrapFacade.rtlFile],
          verifiedVhdlBlock: bootstrapFacade,
          verifiedWrapperPlan: wrapperPlan,
          contract: verifiedContract,
        };
      }
    }
    const nearMatch = findVerifiedVhdlBlockNearMatch({
      component: verifiedComponent,
      libraryRoot: params.verifiedVhdlBlockLibraryRoot || undefined,
      qualificationPath: params.verifiedVhdlBlockQualificationPath || undefined,
    });
    if (nearMatch) {
      const promotion = promoteVerifiedVhdlGenericsIntoComponent({
        component: verifiedComponent,
        verifiedGenerics: nearMatch.actualSignature.generics,
        userRequest: [
          verifiedContract.systemIntent,
          ...(verifiedContract.assumptions || []),
          JSON.stringify(verifiedContract.intent?.explicitRequirements || {}),
          JSON.stringify(verifiedContract.sourceGroundedRequirements || []),
        ].join('\n'),
      });
      if (promotion.unsafeReasons.length > 0) {
        if (params.hybridOnUnsafeWrapper !== false) {
          throw new HybridImplementationSourceUnresolvedError({
            stage: params.stage,
            component: verifiedComponent,
            candidate: nearMatch,
            plan: {
              kind: 'wrapper_unsafe',
              componentId: verifiedComponent.id,
              approvedEntityName: verifiedComponent.name,
              verifiedBlockName: nearMatch.blockName,
              verifiedEntityName: nearMatch.entityName,
              mismatches: promotion.unsafeReasons.map((reason) => ({ kind: 'generic_parameter_mismatch', message: reason })),
              unsafeReasons: promotion.unsafeReasons,
              portAssociations: {},
              genericAssociations: {},
              declarations: [],
              preInstanceAssignments: [],
              postInstanceAssignments: [],
            },
          });
        }
      }
      const promotedComponent = promotion.component;
      const promotedContract = applyVerifiedGenericPromotionToContract({
        contract: verifiedContract,
        component: verifiedComponent,
        promotion,
      });
      const promotedNearMatch: VerifiedVhdlBlockNearMatch = {
        ...nearMatch,
        approvedSignature: buildLeafInterfaceSignature(promotedComponent),
      };
      const parameterCompatibility = evaluateVerifiedVhdlParameterCompatibility({
        component: promotedComponent,
        candidate: promotedNearMatch,
      });
      if (parameterCompatibility.kind === 'parameter_unsafe') {
        if (params.hybridOnUnsafeWrapper !== false) {
          throw new HybridImplementationSourceUnresolvedError({
            stage: params.stage,
            component: promotedComponent,
            candidate: promotedNearMatch,
            plan: {
              kind: 'wrapper_unsafe',
              componentId: promotedComponent.id,
              approvedEntityName: promotedComponent.name,
              verifiedBlockName: promotedNearMatch.blockName,
              verifiedEntityName: promotedNearMatch.entityName,
              mismatches: parameterCompatibility.unsafeReasons.map((reason) => ({ kind: 'generic_parameter_mismatch', message: reason })),
              unsafeReasons: parameterCompatibility.unsafeReasons,
              portAssociations: {},
              genericAssociations: parameterCompatibility.genericMap,
              declarations: [],
              preInstanceAssignments: [],
              postInstanceAssignments: [],
            },
          });
        }
        throw new VerifiedParameterUnsafeMismatchError({
          stage: params.stage,
          component: promotedComponent,
          candidate: promotedNearMatch,
          parameterCompatibility,
        });
      }
      let effectiveNearMatch = promotedNearMatch;
      if (parameterCompatibility.requiresConfiguredSmoke && params.verifiedVhdlBlockLibraryRoot) {
        effectiveNearMatch = await buildProjectLockedVerifiedWrapper({
          stage: params.stage,
          component: promotedComponent,
          candidate: promotedNearMatch,
          parameterCompatibility,
          libraryRoot: params.verifiedVhdlBlockLibraryRoot,
          signal: params.signal,
        });
      }
      if (parameterCompatibility.requiresConfiguredSmoke && params.stageGhdlValidation) {
        await runConfiguredVerifiedBlockSmoke({
          stage: params.stage,
          component: promotedComponent,
          candidate: effectiveNearMatch,
          parameterCompatibility,
          signal: params.signal,
        });
      }
      if (hasSamePublicInterfaceIgnoringGenericDefaults(effectiveNearMatch)) {
        const content = normalizeStagedVhdlContent(effectiveNearMatch.rtlContent);
        assertGeneratedComponentInterface(params.stage, promotedComponent, content);
        return {
          content,
          attempts: stageAttempts,
          dependencyFiles: effectiveNearMatch.dependencyFiles,
          verifiedVhdlBlock: effectiveNearMatch,
          verifiedParameterCompatibility: parameterCompatibility,
          contract: promotedContract,
        };
      }
      const wrapperPlan = planVerifiedVhdlWrapper({
        component: promotedComponent,
        candidate: effectiveNearMatch,
        parameterCompatibility,
      });
      if (wrapperPlan.kind === 'wrapper_safe') {
        const content = normalizeStagedVhdlContent(renderVerifiedVhdlWrapper({
          contract: promotedContract,
          component: promotedComponent,
          plan: wrapperPlan,
        }));
        assertGeneratedComponentInterface(params.stage, promotedComponent, content);
        return {
          content,
          attempts: stageAttempts,
          dependencyFiles: [...effectiveNearMatch.dependencyFiles, effectiveNearMatch.rtlFile],
          verifiedVhdlBlock: effectiveNearMatch,
          verifiedWrapperPlan: wrapperPlan,
          verifiedParameterCompatibility: parameterCompatibility,
          contract: promotedContract,
        };
      }
      const specialistAdvice = await runVhdlSpecialistAdvisor(effectiveNearMatch, promotedComponent, wrapperPlan);
      const adviceNormalization = applyAcceptedVhdlSpecialistAdviceToContract({
        contract: promotedContract,
        component: promotedComponent,
        candidate: effectiveNearMatch,
        wrapperPlan,
        advice: specialistAdvice,
      });
      if (adviceNormalization) {
        const advisedNearMatch: VerifiedVhdlBlockNearMatch = {
          ...effectiveNearMatch,
          approvedSignature: buildLeafInterfaceSignature(adviceNormalization.component),
        };
        const advisedWrapperPlan = planVerifiedVhdlWrapper({
          component: adviceNormalization.component,
          candidate: advisedNearMatch,
          parameterCompatibility,
        });
        if (advisedWrapperPlan.kind === 'wrapper_safe') {
          const content = normalizeStagedVhdlContent(renderVerifiedVhdlWrapper({
            contract: adviceNormalization.contract,
            component: adviceNormalization.component,
            plan: advisedWrapperPlan,
          }));
          assertGeneratedComponentInterface(params.stage, adviceNormalization.component, content);
          return {
            content,
            attempts: stageAttempts,
            dependencyFiles: [...effectiveNearMatch.dependencyFiles, effectiveNearMatch.rtlFile],
            verifiedVhdlBlock: effectiveNearMatch,
            verifiedWrapperPlan: advisedWrapperPlan,
            verifiedParameterCompatibility: parameterCompatibility,
            contract: adviceNormalization.contract,
          };
        }
      }
      if (params.hybridOnUnsafeWrapper !== false) {
        throw new HybridImplementationSourceUnresolvedError({
          stage: params.stage,
          component: promotedComponent,
          candidate: effectiveNearMatch,
          plan: wrapperPlan,
          specialistAdvice,
        });
      }
      throw new VerifiedWrapperUnsafeMismatchError({
        stage: params.stage,
        component: promotedComponent,
        candidate: effectiveNearMatch,
        plan: wrapperPlan,
        specialistAdvice,
      });
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
      if (params.vhdlImplementationPolicy === 'allow_model_vhdl_fallback') {
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
  }

  if ((params.vhdlImplementationPolicy || 'verified_or_template_only') !== 'allow_model_vhdl_fallback') {
    const deterministicTemplate = renderDeterministicLeafTemplate({
      contract: params.contract,
      component: params.component,
      skeleton: params.skeleton,
    });
    if (deterministicTemplate) {
      const content = normalizeStagedVhdlContent(deterministicTemplate.content);
      assertGeneratedComponentInterface(params.stage, params.component, content);
      return {
        content,
        attempts: stageAttempts,
        dependencyFiles: [],
        deterministicTemplate,
      };
    }

    if (isDeterministicFifoFallbackCandidate(params.component)) {
      const fallbackContent = renderDeterministicFifoFallback(params.component, params.skeleton);
      assertGeneratedComponentInterface(params.stage, params.component, fallbackContent);
      return {
        content: fallbackContent,
        attempts: stageAttempts,
        dependencyFiles: [],
      };
    }

    throw new ModelVhdlGenerationBlockedByPolicyError({
      stage: params.stage,
      component: params.component,
      policy: params.vhdlImplementationPolicy || 'verified_or_template_only',
    });
  }

  try {
    return {
      content: await runOnce(buildComponentPrompt({ contract: params.contract, component: params.component, skeleton: params.skeleton }), 0),
      attempts: stageAttempts,
      dependencyFiles: [],
    };
  } catch (error) {
    if (
      !(error instanceof StagedPortInterfaceDriftError)
      && !(error instanceof StagedComponentEntityMissingError)
      && !(error instanceof StagedComponentOutputOwnershipError)
    ) {
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
      : error instanceof StagedComponentOutputOwnershipError
        ? buildOutputOwnershipRetryPrompt({
          contract: params.contract,
          component: params.component,
          skeleton: params.skeleton,
          ownership: error,
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
        && (
          retryError instanceof StagedPortInterfaceDriftError
          || retryError instanceof StagedComponentEntityMissingError
          || retryError instanceof StagedComponentOutputOwnershipError
        )
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
  vhdlImplementationPolicy?: FpgaVhdlImplementationPolicy;
  hybridOnUnsafeWrapper?: boolean;
  vhdlSpecialistAdvisor?: boolean;
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
  let workingContract = params.contract;
  const generatedSourceOrder = [...workingContract.sourceOrder];
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
  for (const component of workingContract.components.filter((candidate) => candidate.kind === 'package')) {
    files.push({ path: component.file, fileType: fileTypeForComponent(component), purpose: component.responsibility, content: renderContractPackage(workingContract, component) });
  }
  if (params.stageGhdlValidation) {
    await notify('packages', 1, '', 'validating');
    await runGhdlStageCheckpoint({ files, sourceOrder: workingContract.sourceOrder, label: 'package generation', signal: params.signal });
  }
  await notify('packages', 1, '', 'completed');

  await notify('leaf_rtl', 2, '', 'starting');
  const leafComponentIds = workingContract.components.filter((candidate) => candidate.kind === 'rtl').map((component) => component.id);
  for (const componentId of leafComponentIds) {
    const component = workingContract.components.find((candidate) => candidate.id === componentId);
    if (!component) continue;
    await notify('leaf_rtl', 2, component.id, 'starting');
    const skeleton = renderLeafSkeleton(workingContract, component);
    let generatedLeaf: any;
    try {
      generatedLeaf = await generateComponentWithInterfaceRetry({
        ai: params.ai,
        provider: params.provider,
        model: params.model,
        contract: workingContract,
        component,
        skeleton,
        stage: 'leaf_rtl',
        signal: params.signal,
        maxStageOutputChars: params.maxStageOutputChars,
        goldenLeafLibraryPath: params.goldenLeafLibraryPath,
        verifiedVhdlBlockLibraryRoot: params.verifiedVhdlBlockLibraryRoot,
        verifiedVhdlBlockQualificationPath: params.verifiedVhdlBlockQualificationPath,
        vhdlImplementationPolicy: params.vhdlImplementationPolicy || 'verified_or_template_only',
        hybridOnUnsafeWrapper: params.hybridOnUnsafeWrapper,
        vhdlSpecialistAdvisor: params.vhdlSpecialistAdvisor,
        stageGhdlValidation: params.stageGhdlValidation,
        runModelAnalysis: params.runModelAnalysis,
      });
    } catch (error) {
      if (shouldWrapAsStagedRuntimeError(error)) {
        throw new StagedGenerationRuntimeError({ stage: 'leaf_rtl', component, error });
      }
      throw error;
    }
    const { content, attempts: stageAttempts, dependencyFiles, contract: nextContract } = generatedLeaf;
    if (nextContract) workingContract = nextContract;
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
  const top = workingContract.components.find((candidate) => candidate.kind === 'top');
  if (!top) throw new Error('Architecture Contract V2 has no top component.');
  let topContent: string;
  if (top.children.length > 0) {
    topContent = renderIntegrationTop(workingContract, top);
  } else {
    const skeleton = renderLeafSkeleton(workingContract, top);
    let generated: any;
    try {
      generated = await generateComponentWithInterfaceRetry({
        ai: params.ai,
        provider: params.provider,
        model: params.model,
        contract: workingContract,
        component: top,
        skeleton,
        stage: 'top_integration',
        signal: params.signal,
        maxStageOutputChars: params.maxStageOutputChars,
        goldenLeafLibraryPath: params.goldenLeafLibraryPath,
        verifiedVhdlBlockLibraryRoot: params.verifiedVhdlBlockLibraryRoot,
        verifiedVhdlBlockQualificationPath: params.verifiedVhdlBlockQualificationPath,
        vhdlImplementationPolicy: params.vhdlImplementationPolicy || 'verified_or_template_only',
        hybridOnUnsafeWrapper: params.hybridOnUnsafeWrapper,
        vhdlSpecialistAdvisor: params.vhdlSpecialistAdvisor,
        stageGhdlValidation: params.stageGhdlValidation,
        runModelAnalysis: params.runModelAnalysis,
      });
    } catch (error) {
      if (shouldWrapAsStagedRuntimeError(error)) {
        throw new StagedGenerationRuntimeError({ stage: 'top_integration', component: top, error });
      }
      throw error;
    }
    topContent = generated.content;
    if (generated.contract) workingContract = generated.contract;
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
  const testbench = workingContract.components.find((candidate) => candidate.kind === 'testbench');
  if (!testbench) throw new Error('Architecture Contract V2 has no testbench component.');
  files.push({ path: testbench.file, fileType: fileTypeForComponent(testbench), purpose: testbench.responsibility, content: renderAppOwnedTestbench(workingContract) });
  if (params.stageGhdlValidation) {
    await notify('testbench', 4, testbench.id, 'validating');
    await runGhdlStageCheckpoint({ files, sourceOrder: generatedSourceOrder, label: `testbench ${testbench.id}`, signal: params.signal });
  }
  await notify('testbench', 4, testbench.id, 'completed');

  await notify('collateral', 5, '', 'starting');
  const runCommands = buildDeterministicArchitectGhdlRunCommands({ analysisOrder: generatedSourceOrder, topTestbench: workingContract.topTestbench, vhdlStandard: '08' });
  files.push({ path: 'sim/ghdl_plan.json', fileType: 'json', purpose: 'App-owned deterministic GHDL command plan', content: `${JSON.stringify({ standard: '08', analysisOrder: generatedSourceOrder, topTestbench: workingContract.topTestbench, runCommands, expectedResult: 'TEST PASSED' }, null, 2)}\n` });
  files.push({ path: 'architecture/contract-summary.md', fileType: 'markdown', purpose: 'Concise app-owned architecture summary', content: `# ${workingContract.designName}\n\n${workingContract.systemIntent}\n\nContract SHA-256: \`${hashFpgaArchitectureContract(workingContract)}\`\n\n${workingContract.assumptions.filter((entry) => /VERIFIED_GENERIC_PROMOTION/.test(entry)).join('\n')}\n` });
  await notify('collateral', 5, '', 'completed');

  await notify('manifest', 6, '', 'starting');
  const project: FpgaArchitectProject = {
    projectName: workingContract.designName,
    sanitizedProjectName: workingContract.designName,
    topEntity: workingContract.topEntity,
    vhdlStandard: '08',
    targetFpga: null,
    summary: workingContract.systemIntent,
    assumptions: workingContract.assumptions,
    warnings: [],
    folderTree: Array.from(new Set(files.map((file) => file.path.split('/')[0]))).map((folder) => `${folder}/`).join('\n'),
    files,
    ghdl: { analysisOrder: generatedSourceOrder, topTestbench: workingContract.topTestbench, runCommands, expectedResult: 'TEST PASSED' },
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
