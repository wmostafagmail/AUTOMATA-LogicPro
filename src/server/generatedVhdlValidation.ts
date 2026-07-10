import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import type { AiMacroId, TbGenerationMode } from '../aiMacros';
import {
  buildDeterministicArchitectGhdlRunCommands,
  type FpgaArchitectProject,
} from './fpgaArchitect';
import {
  getCanonicalRuleIdsForFailureCode,
  VHDL_OPERATOR_KEYWORDS,
  VHDL_RESERVED_IDENTIFIERS,
} from './vhdlSkillRules';

const execFileAsync = promisify(execFile);

type ArtifactKind = 'testbench' | 'module' | 'assertions' | 'rtl_skeleton' | 'unknown';

export type GeneratedVhdlFailureCategory =
  | 'declaration_scope'
  | 'identifier_reserved_word'
  | 'numeric_std_type_discipline'
  | 'package_type_definition'
  | 'interface_generic_port_syntax'
  | 'simulation_success'
  | 'array_subtype_misuse'
  | 'signal_variable_assignment_misuse'
  | 'width_literal_mismatch'
  | 'runtime_bound_risk'
  | 'missing_ieee_clause'
  | 'unresolved_work_unit'
  | 'source_selection'
  | 'top_level_generic_default_missing'
  | 'top_level_port_unconstrained'
  | 'mixed_vhdl_standard_group'
  | 'missing_ghdl_command_contract'
  | 'invalid_source_order_contract'
  | 'multiple_architecture_elaboration_ambiguity'
  | 'rtl_contains_tb_only_construct'
  | 'unsupported_textio_package_policy'
  | 'missing_waveform_generation_contract'
  | 'generated_clock_in_rtl'
  | 'mixed_clock_edge_domain'
  | 'other';

export type GeneratedVhdlFailureDetail = {
  code: string;
  category: GeneratedVhdlFailureCategory;
  ruleId?: string | null;
  ruleIds?: string[];
  message: string;
  excerpt: string;
  relativePath?: string;
  lineHint?: number | null;
  forbiddenConstruct?: string;
  legalReplacementPattern?: string;
};

export type GeneratedVhdlArtifactForValidation = {
  fileName: string;
  path: string;
  kind: ArtifactKind;
};

export type GeneratedVhdlValidationResult = {
  ok: boolean;
  stage: 'unavailable' | 'prevalidate' | 'analyze' | 'elaborate' | 'simulate';
  summary: string;
  logs: string[];
  validatedTopEntities: string[];
  failureCode?: string | null;
  failureCategory?: GeneratedVhdlFailureCategory | null;
  ruleIds?: string[];
  failureDetails?: GeneratedVhdlFailureDetail[];
};

type VhdlSourceDescriptor = {
  path: string;
  entities: string[];
  packages: string[];
  packageBodies: string[];
  dependencies: string[];
  isTestbench: boolean;
};

function classifyArchitectureBodyVariableIntent(params: {
  relativePath: string;
  variableName: string;
  subtype: string;
}) {
  const lowerName = params.variableName.toLowerCase();
  const lowerSubtype = params.subtype.toLowerCase();
  const isTestbenchPath = /(^|\/)(tb|testbench)\//i.test(params.relativePath)
    || /(^|[_-])(tb|testbench)([_-]|$)/i.test(path.basename(params.relativePath, path.extname(params.relativePath)));
  const isBookkeepingName = /(pass|fail|error|done|finished|status|count|score|flag)/i.test(params.variableName);
  const isLogicStateType = /\bstd_(u)?logic(_vector)?\b/.test(lowerSubtype) || /\bunsigned\b|\bsigned\b/.test(lowerSubtype);

  if (isTestbenchPath && isBookkeepingName) {
    return {
      flavor: 'testbench_bookkeeping',
      messageTail:
        `This looks like testbench bookkeeping or shared status state. ` +
        `Prefer a signal for sampled DUT-visible state, or a shared variable only when shared testbench bookkeeping is truly required.`,
      legalReplacementPattern:
        `replace "${params.variableName}" with a signal for sampled state, or use a shared variable only for deliberate shared testbench bookkeeping`,
    } as const;
  }

  if (isLogicStateType) {
    return {
      flavor: 'persistent_signal_intent',
      messageTail:
        `This looks like persistent design state, not a process-local scratch value. ` +
        `Prefer a signal declared in the architecture declarative region, or move the scratch use into a process-local variable if the state is temporary.`,
      legalReplacementPattern:
        `replace "${params.variableName}" with a signal if persistent state is intended, or move it into a process-local variable if it is only temporary scratch state`,
    } as const;
  }

  return {
    flavor: 'process_local_scratch',
    messageTail:
      `This most likely represents temporary local scratch state. ` +
      `Move it into the nearest process/subprogram declarative region unless persistent cross-process state is truly required.`,
    legalReplacementPattern:
      `move "${params.variableName}" into the nearest process/subprogram declarative region as a local variable unless persistent shared state is truly required`,
  } as const;
}

function shouldSkipProjectEntry(name: string) {
  return ['.git', 'node_modules', 'dist', 'build', '.next', '.automata-logicpro'].includes(name);
}

async function listProjectFiles(rootPath: string, currentPath = rootPath): Promise<string[]> {
  const entries = await fs.readdir(currentPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (shouldSkipProjectEntry(entry.name)) continue;
    const absolutePath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listProjectFiles(rootPath, absolutePath));
      continue;
    }
    files.push(path.relative(rootPath, absolutePath));
  }

  return files;
}

function stripVhdlComments(content: string) {
  return content.replace(/--.*$/gm, '');
}

function extractUniqueMatches(content: string, expression: RegExp, transform: (value: string) => string = (value) => value) {
  const matches = new Set<string>();
  for (const match of content.matchAll(expression)) {
    const raw = match[1];
    if (!raw) continue;
    matches.add(transform(raw));
  }
  return Array.from(matches);
}

async function describeVhdlSource(projectPath: string, relativePath: string): Promise<VhdlSourceDescriptor> {
  const absolutePath = path.join(projectPath, relativePath);
  const rawContent = await fs.readFile(absolutePath, 'utf8');
  const content = stripVhdlComments(rawContent);

  const entities = extractUniqueMatches(content, /\bentity\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\b/gi, (value) => value.toLowerCase());
  const packages = extractUniqueMatches(content, /\bpackage\s+(?!body\b)([a-zA-Z][a-zA-Z0-9_]*)\s+is\b/gi, (value) => value.toLowerCase());
  const packageBodies = extractUniqueMatches(content, /\bpackage\s+body\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\b/gi, (value) => value.toLowerCase());
  const dependencies = Array.from(new Set([
    ...extractUniqueMatches(content, /\buse\s+work\.([a-zA-Z][a-zA-Z0-9_]*)(?:\.[a-zA-Z][a-zA-Z0-9_]*)?\s*;/gi, (value) => value.toLowerCase()),
    ...extractUniqueMatches(content, /\bentity\s+work\.([a-zA-Z][a-zA-Z0-9_]*)\b/gi, (value) => value.toLowerCase()),
  ]));

  return {
    path: relativePath,
    entities,
    packages,
    packageBodies,
    dependencies,
    isTestbench: /(^|[_-])(tb|testbench)([_-]|$)/i.test(path.basename(relativePath, path.extname(relativePath))),
  };
}

async function collectVhdlSources(rootPath: string) {
  const files = await listProjectFiles(rootPath);
  const vhdlFiles = files
    .filter((file) => ['.vhd', '.vhdl'].includes(path.extname(file).toLowerCase()))
    .sort((left, right) => left.localeCompare(right));

  return Promise.all(vhdlFiles.map((file) => describeVhdlSource(rootPath, file)));
}

async function runCommand(command: string, args: string[], options: { cwd?: string } = {}) {
  try {
    return await execFileAsync(command, args, {
      cwd: options.cwd,
      maxBuffer: 1024 * 1024 * 16,
    });
  } catch (error: any) {
    const stdout = String(error?.stdout || '').trim();
    const stderr = String(error?.stderr || '').trim();
    const detail = stderr || stdout || error?.message || `${command} ${args.join(' ')}`;
    const failure = new Error(detail);
    (failure as any).stdout = stdout;
    (failure as any).stderr = stderr;
    throw failure;
  }
}

function rankSourceForCompilation(source: VhdlSourceDescriptor) {
  if (source.packages.length > 0) return 0;
  if (source.packageBodies.length > 0) return 1;
  if (source.isTestbench) return 3;
  return 2;
}

function getSatisfiedDependencyCount(source: VhdlSourceDescriptor, compiledUnits: Set<string>) {
  return source.dependencies.reduce((count, dependency) => count + (compiledUnits.has(dependency) ? 1 : 0), 0);
}

function sortCompileCandidates(candidates: VhdlSourceDescriptor[], compiledUnits: Set<string>) {
  return [...candidates].sort((left, right) => {
    const leftRank = rankSourceForCompilation(left);
    const rightRank = rankSourceForCompilation(right);
    if (leftRank !== rightRank) return leftRank - rightRank;

    const leftSatisfied = getSatisfiedDependencyCount(left, compiledUnits);
    const rightSatisfied = getSatisfiedDependencyCount(right, compiledUnits);
    if (leftSatisfied !== rightSatisfied) return rightSatisfied - leftSatisfied;

    return left.path.localeCompare(right.path);
  });
}

function extractMissingWorkUnits(stderr: string) {
  const units = new Set<string>();
  for (const match of stderr.matchAll(/unit\s+"([^"]+)"\s+not\s+found\s+in\s+library\s+"work"/gi)) {
    if (match[1]) units.add(match[1].toLowerCase());
  }
  return Array.from(units);
}

async function analyzeSelectedSources(params: {
  projectPath: string;
  outputDir: string;
  sources: VhdlSourceDescriptor[];
  logs: string[];
}) {
  const { projectPath, outputDir, sources, logs } = params;
  const compiledUnits = new Set<string>();
  const pending = new Map(sources.map((source) => [source.path, source]));

  while (pending.size > 0) {
    let progress = false;
    const deferredFailures: Array<{ source: VhdlSourceDescriptor; missing: string[] }> = [];
    const candidates = sortCompileCandidates(Array.from(pending.values()), compiledUnits);

    for (const source of candidates) {
      const sourcePath = path.join(projectPath, source.path);
      logs.push(`ghdl -a --std=08 --workdir=${outputDir} ${source.path}`);
      try {
        const { stdout, stderr } = await runCommand('ghdl', ['-a', '--std=08', `--workdir=${outputDir}`, sourcePath], { cwd: outputDir });
        if (stdout) logs.push(stdout);
        if (stderr) logs.push(stderr);
        source.entities.forEach((entity) => compiledUnits.add(entity));
        source.packages.forEach((pkg) => compiledUnits.add(pkg));
        source.packageBodies.forEach((pkg) => compiledUnits.add(pkg));
        pending.delete(source.path);
        progress = true;
      } catch (error: any) {
        const stdout = String(error?.stdout || '').trim();
        const stderr = String(error?.stderr || '').trim();
        if (stdout) logs.push(stdout);
        if (stderr) logs.push(stderr);
        const missing = extractMissingWorkUnits(stderr);
        if (missing.length > 0) {
          deferredFailures.push({ source, missing });
          continue;
        }
        throw error;
      }
    }

    if (pending.size === 0) break;

    if (!progress) {
      const unresolved = deferredFailures.map(({ source, missing }) => {
        const internal = missing.filter((unit) => sources.some((candidate) =>
          candidate.entities.includes(unit) || candidate.packages.includes(unit) || candidate.packageBodies.includes(unit)
        ));
        const missingText = internal.length > 0 ? internal.join(', ') : missing.join(', ');
        return `${source.path}: unresolved work units -> ${missingText}`;
      });
      throw new Error(unresolved.join('\n'));
    }
  }
}

function normalizeRelativePath(rootPath: string, absolutePath: string) {
  return path.relative(rootPath, absolutePath).split(path.sep).join('/');
}

function collectExecutableRegionDeclarations(content: string) {
  const declarationExpression = /\b(type|subtype|procedure|function|constant)\s+([a-zA-Z][a-zA-Z0-9_]*)\b/i;
  const scopedRegions = [
    /\barchitecture\s+[a-zA-Z][a-zA-Z0-9_]*\s+of\s+[a-zA-Z][a-zA-Z0-9_]*\s+is\b[\s\S]*?\bbegin\b([\s\S]*?)\bend\s+architecture\b[^;]*;/gi,
    /\bprocess(?:\s*\([^)]*\))?\b[\s\S]*?\bbegin\b([\s\S]*?)\bend\s+process\b[^;]*;/gi,
    /\bfunction\s+[a-zA-Z][a-zA-Z0-9_]*\b[\s\S]*?\bis\b[\s\S]*?\bbegin\b([\s\S]*?)\bend\s+function\b[^;]*;/gi,
    /\bprocedure\s+[a-zA-Z][a-zA-Z0-9_]*\b[\s\S]*?\bis\b[\s\S]*?\bbegin\b([\s\S]*?)\bend\s+procedure\b[^;]*;/gi,
  ];
  const findings: Array<{ kind: string; name: string }> = [];
  const seen = new Set<string>();

  for (const regionExpression of scopedRegions) {
    for (const match of content.matchAll(regionExpression)) {
      const executableRegion = match[1];
      if (!executableRegion) continue;
      const declarationMatch = declarationExpression.exec(executableRegion);
      if (declarationMatch) {
        const finding = {
          kind: declarationMatch[1].toLowerCase(),
          name: declarationMatch[2],
        };
        const signature = `${finding.kind}:${finding.name.toLowerCase()}`;
        if (seen.has(signature)) continue;
        seen.add(signature);
        findings.push(finding);
      }
    }
  }

  return findings;
}

function collectExecutableRegionSignalDeclarations(content: string) {
  const signalExpression = /\bsignal\s+([a-zA-Z][a-zA-Z0-9_]*)\s*:/i;
  const scopedRegions = [
    /\barchitecture\s+[a-zA-Z][a-zA-Z0-9_]*\s+of\s+[a-zA-Z][a-zA-Z0-9_]*\s+is\b[\s\S]*?\bbegin\b([\s\S]*?)\bend\s+architecture\b[^;]*;/gi,
    /\bprocess(?:\s*\([^)]*\))?\b[\s\S]*?\bbegin\b([\s\S]*?)\bend\s+process\b[^;]*;/gi,
    /\bfunction\s+[a-zA-Z][a-zA-Z0-9_]*\b[\s\S]*?\bis\b[\s\S]*?\bbegin\b([\s\S]*?)\bend\s+function\b[^;]*;/gi,
    /\bprocedure\s+[a-zA-Z][a-zA-Z0-9_]*\b[\s\S]*?\bis\b[\s\S]*?\bbegin\b([\s\S]*?)\bend\s+procedure\b[^;]*;/gi,
  ];
  const findings: string[] = [];
  const seen = new Set<string>();

  for (const regionExpression of scopedRegions) {
    for (const match of content.matchAll(regionExpression)) {
      const executableRegion = match[1];
      if (!executableRegion) continue;
      const signalMatch = signalExpression.exec(executableRegion);
      if (!signalMatch) continue;
      const signalName = signalMatch[1];
      const signature = signalName.toLowerCase();
      if (seen.has(signature)) continue;
      seen.add(signature);
      findings.push(signalName);
    }
  }

  return findings;
}

function dedupe(values: string[]) {
  return Array.from(new Set(values));
}

function trimFailureExcerpt(message: string, maxLength = 220) {
  const compact = message.replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 3)}...`;
}

function extractQuotedGhdlToken(message: string) {
  const singleQuoted = message.match(/(?:unexpected token|\(found:)\s+'([^']+)'/i)?.[1];
  if (singleQuoted) {
    return singleQuoted;
  }
  const doubleQuoted = message.match(/operator\s+"([^"]+)"/i)?.[1];
  return doubleQuoted || null;
}

function isReservedVhdlIdentifierToken(token: string | null) {
  if (!token) return false;
  return VHDL_RESERVED_IDENTIFIERS.includes(token.toLowerCase());
}

function createFailureDetail(params: {
  code: string;
  category: GeneratedVhdlFailureCategory;
  ruleId?: string | null;
  ruleIds?: string[];
  message: string;
  relativePath?: string;
  lineHint?: number | null;
  forbiddenConstruct?: string;
  legalReplacementPattern?: string;
}): GeneratedVhdlFailureDetail {
  const canonicalRuleIds = params.ruleIds && params.ruleIds.length > 0
    ? params.ruleIds
    : getCanonicalRuleIdsForFailureCode(params.code);
  const inferredPathMatch = params.message.match(/^([^:\n]+\.(?:vhd|vhdl)):/i);
  const inferredLineMatch = params.message.match(/\.vhd[l]?:([0-9]+):/i);
  return {
    ...params,
    ruleId: params.ruleId ?? canonicalRuleIds[0] ?? null,
    ruleIds: canonicalRuleIds,
    excerpt: trimFailureExcerpt(params.message),
    relativePath: params.relativePath ?? inferredPathMatch?.[1],
    lineHint: params.lineHint ?? (inferredLineMatch?.[1] ? Number.parseInt(inferredLineMatch[1], 10) : null),
  };
}

function summarizeFailureDetails(details: GeneratedVhdlFailureDetail[]) {
  return details.map((detail) => detail.message).join('\n');
}

export function inferFailureDetailsFromGhdlMessage(message: string): GeneratedVhdlFailureDetail[] {
  const details: GeneratedVhdlFailureDetail[] = [];
  const push = (params: Parameters<typeof createFailureDetail>[0]) => {
    details.push(createFailureDetail(params));
  };

  if (/unit\s+".*"\s+not\s+found\s+in\s+library\s+"work"|unresolved work units/i.test(message)) {
    push({
      code: 'unresolved_work_unit',
      category: 'unresolved_work_unit',
      message,
      forbiddenConstruct: 'reference to a work unit that was not compiled into the active work library',
      legalReplacementPattern: 'compile the dependency first and keep analysis_order so every package/entity is analyzed before the dependent file',
    });
  }

  if (/non-shared variable declaration not allowed in architecture body/i.test(message)) {
    push({
      code: 'architecture_body_variable',
      category: 'declaration_scope',
      message,
      forbiddenConstruct: 'plain architecture-body variable emitted into the architecture declarative region',
      legalReplacementPattern:
        'move temporary scratch variables into the nearest process/subprogram declarative region, or use a signal/shared variable only when persistent or shared state is truly intended',
    });
  }

  if (/no declaration for "std_logic(?:_vector)?"|no declaration for "std_ulogic"/i.test(message)) {
    push({
      code: 'missing_std_logic_1164_clause',
      category: 'missing_ieee_clause',
      message,
      forbiddenConstruct: 'logic types used without a local ieee.std_logic_1164 import in the same file',
      legalReplacementPattern: 'add library ieee; and use ieee.std_logic_1164.all; to the file that declares or uses the logic type',
    });
  }

  if (/no declaration for "unsigned"|no declaration for "signed"|no declaration for "resize"|no declaration for "to_integer"|no declaration for "to_unsigned"|no declaration for "to_signed"/i.test(message)) {
    push({
      code: 'missing_numeric_std_clause',
      category: 'missing_ieee_clause',
      message,
      forbiddenConstruct: 'numeric_std types or helpers used without a local ieee.numeric_std import in the same file',
      legalReplacementPattern: 'add use ieee.numeric_std.all; to the file that declares or uses numeric_std types/functions',
    });
  }

  if (/no overloaded function found matching "resize"|calls resize on raw std_logic_vector/i.test(message)) {
    push({
      code: 'resize_on_raw_std_logic_vector',
      category: 'numeric_std_type_discipline',
      message,
      forbiddenConstruct: 'calling resize on a raw std_logic_vector operand',
      legalReplacementPattern: 'convert the operand into unsigned(...) or signed(...) first, then call resize on the typed value',
    });
  }

  if (/no function declarations for operator "(?:and|or|xor|not)"/i.test(message)) {
    push({
      code: 'illegal_numeric_logical_hybrid',
      category: 'numeric_std_type_discipline',
      message,
      forbiddenConstruct: 'bitwise/logical operator use on mismatched or non-typed operands',
      legalReplacementPattern: 'ensure both operands are in the same typed domain and use explicit unsigned/signed or boolean comparisons before applying the operator',
    });
  }

  if (/can't match ".*" with type array type "UNRESOLVED_UNSIGNED"|can't match ".*" with type array type "UNRESOLVED_SIGNED"/i.test(message)) {
    push({
      code: 'typed_bitwise_mismatch',
      category: 'numeric_std_type_discipline',
      message,
      forbiddenConstruct: 'assignment or operator result whose operand types do not match the destination typed domain',
      legalReplacementPattern: 'convert operands and temporaries into the exact destination type before assignment or operator use',
    });
  }

  if (/can't match function call with type array type "UNRESOLVED_UNSIGNED"|can't match function call with type array type "UNRESOLVED_SIGNED"/i.test(message)) {
    push({
      code: 'typed_function_result_mismatch',
      category: 'numeric_std_type_discipline',
      message,
      forbiddenConstruct: 'function call result whose return type does not match the typed destination domain',
      legalReplacementPattern: 'make the helper return unsigned/signed directly, or convert the function result explicitly at the assignment site',
    });
  }

  if (/can't associate ".*" with port ".*"|cannot associate ".*" with port ".*"|type of ".*" is .*type of port ".*" is/i.test(message)) {
    push({
      code: 'typed_port_association_mismatch',
      category: 'numeric_std_type_discipline',
      message,
      forbiddenConstruct: 'port map actual whose type does not match the formal port type',
      legalReplacementPattern: 'pass an actual with the same declared type as the formal port, or convert at the boundary only into the exact formal type expected by the instantiated entity',
    });
  }

  if (
    /type mark expected in a subtype indication/i.test(message)
    && /\b(?:signal|variable|constant)\s+[a-zA-Z][a-zA-Z0-9_]*\s*:\s*array\s*\(/i.test(message)
  ) {
    push({
      code: 'anonymous_array_object_declaration',
      category: 'array_subtype_misuse',
      message,
      forbiddenConstruct: 'anonymous object declaration that uses array(...) of ... directly in a signal/variable declaration',
      legalReplacementPattern: 'declare a named array type or subtype first, then declare the object using that named type instead of inline array(...) syntax',
    });
  }

  const illegalPrefixOperatorSnippet = /\b(xnor|nand|nor)\s+[a-zA-Z][a-zA-Z0-9_]*(?:\s*\([^)]*\))?\s*,\s*[a-zA-Z][a-zA-Z0-9_]*(?:\s*\([^)]*\))?\b/i.test(message);
  const illegalPrefixOperatorToken = message.match(/unexpected token '(xnor|nand|nor)' in a primary/i)?.[1]
    || message.match(/missing ";" at end of statement[\s\S]*?\b(xnor|nand|nor)\b/i)?.[1]
    || null;
  if (illegalPrefixOperatorSnippet || illegalPrefixOperatorToken) {
    const operatorToken = illegalPrefixOperatorToken
      || message.match(/\b(xnor|nand|nor)\b/i)?.[1]
      || 'xnor';
    push({
      code: 'illegal_prefix_operator_form',
      category: 'numeric_std_type_discipline',
      message,
      forbiddenConstruct: `illegal prefix/function-style VHDL operator form "${operatorToken} a, b"`,
      legalReplacementPattern: `rewrite the expression into legal infix VHDL operator form such as "a ${operatorToken} b" on operands of matching type`,
    });
  }

  const reservedToken = extractQuotedGhdlToken(message);
  if (
    isReservedVhdlIdentifierToken(reservedToken)
    && (
      /unexpected token/i.test(message)
      || /\(found:/i.test(message)
      || /identifier or character expected/i.test(message)
    )
    && !(
      /^(xnor|nand|nor)$/i.test(reservedToken || '')
      && (illegalPrefixOperatorSnippet || Boolean(illegalPrefixOperatorToken))
    )
  ) {
    push({
      code: 'reserved_identifier',
      category: 'identifier_reserved_word',
      message,
      forbiddenConstruct: `reserved VHDL identifier "${reservedToken}" reused as an identifier, enum literal, or declaration token`,
      legalReplacementPattern: `rename "${reservedToken}" to a descriptive non-keyword identifier such as ${reservedToken.toLowerCase()}_op or ${reservedToken.toLowerCase()}_value`,
    });
  }

  if (/identifier or character expected.*\bSLL\b|identifier or character expected.*\bSRL\b|identifier or character expected.*\bROL\b|identifier or character expected.*\bROR\b/i.test(message)
    || /unexpected token 'sll'|unexpected token 'srl'|unexpected token 'rol'|unexpected token 'ror'/i.test(message)
    || /\(found: 'sll'\)|\(found: 'srl'\)|\(found: 'rol'\)|\(found: 'ror'\)/i.test(message)) {
    push({
      code: 'reserved_identifier',
      category: 'identifier_reserved_word',
      message,
      forbiddenConstruct: 'reserved VHDL shift/rotate operator keyword reused as an enum literal or identifier',
      legalReplacementPattern: 'rename the identifier to a safe descriptive non-keyword form such as shift_left_op or rotate_right_op',
    });
  }

  if (/subprogram body inside package declaration|package declarations may contain only subprogram signatures|package body .* was not analysed|package ".*" was not analysed/i.test(message)) {
    push({
      code: 'subprogram_body_inside_package_declaration',
      category: 'package_type_definition',
      message,
      forbiddenConstruct: 'executable subprogram body or invalid package/body split inside a package declaration',
      legalReplacementPattern: 'keep only declarations/signatures in the package declaration and move executable bodies into a separate package body',
    });
  }

  if (/interface declaration expected.*\bprocedure\b|missing ";" at end of statement.*\bprocedure\b|unexpected token 'label' in a primary/i.test(message)) {
    push({
      code: 'declaration_after_begin',
      category: 'declaration_scope',
      message,
      forbiddenConstruct: 'procedure/helper declaration that escaped into an executable region or uses an illegal reserved token in its declaration',
      legalReplacementPattern: 'move the full helper declaration into the nearest declarative region before begin and rename any reserved argument identifiers',
    });
  }

  if (details.length === 0) {
    push({
      code: 'ghdl_analyze_failure',
      category: classifyKnownFailureCategory(message),
      message,
    });
  }

  return details;
}

function classifyKnownFailureCategory(message: string): GeneratedVhdlFailureCategory {
  if (/reserved VHDL identifier/i.test(message)) return 'identifier_reserved_word';
  if (/without a local "use ieee/i.test(message) || /no declaration for "std_logic/i.test(message)) return 'missing_ieee_clause';
  if (/plain architecture-body variable|inside an executable region|outer-scope object|not allowed in the architecture declarative region/i.test(message)) return 'declaration_scope';
  if (/calls resize|calls to_integer|shift_left|shift_right|logical-operator expression on numeric operands|raw std_logic_vector|typed operands|output-port|can't associate ".*" with port ".*"|cannot associate ".*" with port ".*"/i.test(message)) return 'numeric_std_type_discipline';
  if (/package body|constrained scalar alias|bit-string literal|end statements|subprogram bodies inside package|missing IEEE import for package/i.test(message)) return 'package_type_definition';
  if (/association syntax|generic and port|undeclared generics|interface declaration/i.test(message)) return 'interface_generic_port_syntax';
  if (/multidimensional|re-constrain|vector of vectors|flatten|type mark expected in a subtype indication.*array\s*\(|anonymous object declaration.*array\(\)/i.test(message)) return 'array_subtype_misuse';
  if (/use `<=` only for signals|use `:=` only for variables|assignment operator/i.test(message)) return 'signal_variable_assignment_misuse';
  if (/width|literal mismatch|sized literals|bit-string/i.test(message)) return 'width_literal_mismatch';
  if (/runtime-unsafe|overflow bounds|out of range|bounds/i.test(message)) return 'runtime_bound_risk';
  if (/unresolved work units|unit ".*" not found in library "work"/i.test(message)) return 'unresolved_work_unit';
  if (/validation source set was empty|No generated VHDL artifacts|No VHDL sources were found/i.test(message)) return 'source_selection';
  if (/top-level generic .*default/i.test(message)) return 'top_level_generic_default_missing';
  if (/top-level .*unconstrained/i.test(message)) return 'top_level_port_unconstrained';
  if (/mixed vhdl standard|--std=/i.test(message)) return 'mixed_vhdl_standard_group';
  if (/exact ghdl|command contract/i.test(message)) return 'missing_ghdl_command_contract';
  if (/analysis order|source order/i.test(message)) return 'invalid_source_order_contract';
  if (/multiple architectures|elaboration target/i.test(message)) return 'multiple_architecture_elaboration_ambiguity';
  if (/rtl file.*testbench-only|testbench-only construct/i.test(message)) return 'rtl_contains_tb_only_construct';
  if (/std_logic_textio|textio policy/i.test(message)) return 'unsupported_textio_package_policy';
  if (/waveform.*contract|--vcd=|--ghw=|--fst=/i.test(message)) return 'missing_waveform_generation_contract';
  if (/generated clock|derived clock/i.test(message)) return 'generated_clock_in_rtl';
  if (/mixed clock edges|rising_edge.*falling_edge|falling_edge.*rising_edge/i.test(message)) return 'mixed_clock_edge_domain';
  return 'other';
}

function buildValidationFailureResult(params: {
  stage: GeneratedVhdlValidationResult['stage'];
  summary: string;
  logs: string[];
  validatedTopEntities?: string[];
  failureDetails?: GeneratedVhdlFailureDetail[];
}): GeneratedVhdlValidationResult {
  const firstFailure = params.failureDetails?.[0] || null;
  const ruleIds = Array.from(new Set((params.failureDetails || []).flatMap((detail) => detail.ruleIds || (detail.ruleId ? [detail.ruleId] : []))));
  return {
    ok: false,
    stage: params.stage,
    summary: params.summary,
    logs: params.logs,
    validatedTopEntities: params.validatedTopEntities || [],
    failureCode: firstFailure?.code || null,
    failureCategory: firstFailure?.category || classifyKnownFailureCategory(params.summary),
    ruleIds,
    failureDetails: params.failureDetails || [],
  };
}

type NormalizedDeclaredType =
  | 'std_logic'
  | 'std_logic_vector'
  | 'unsigned'
  | 'signed'
  | 'integer'
  | 'other';

function splitIdentifierList(value: string) {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function splitTopLevelArguments(value: string) {
  const parts: string[] = [];
  let depth = 0;
  let current = '';

  for (const char of value) {
    if (char === '(') {
      depth += 1;
      current += char;
      continue;
    }
    if (char === ')') {
      depth = Math.max(0, depth - 1);
      current += char;
      continue;
    }
    if (char === ',' && depth === 0) {
      if (current.trim()) {
        parts.push(current.trim());
      }
      current = '';
      continue;
    }
    current += char;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function extractActualBaseIdentifier(actual: string) {
  const trimmed = actual.trim();
  const namedAssociationMatch = trimmed.match(/^(?:[a-zA-Z][a-zA-Z0-9_]*\s*=>\s*)(.+)$/);
  const rhs = namedAssociationMatch ? namedAssociationMatch[1].trim() : trimmed;
  const baseIdentifierMatch = rhs.match(/^([a-zA-Z][a-zA-Z0-9_]*)(?:\s*\([^)]*\))?$/);
  if (!baseIdentifierMatch) {
    return null;
  }
  return {
    actualExpression: rhs,
    baseIdentifier: baseIdentifierMatch[1],
  };
}

function collectPotentialSubprogramCalls(content: string) {
  const calls: Array<{ name: string; actualText: string; index: number }> = [];
  const expression = /\b([a-zA-Z][a-zA-Z0-9_]*)\s*\(/g;

  for (const match of content.matchAll(expression)) {
    const name = match[1];
    const startIndex = match.index ?? -1;
    if (!name || startIndex < 0) continue;

    const openParenIndex = startIndex + match[0].lastIndexOf('(');
    let depth = 0;
    let closeParenIndex = -1;
    for (let index = openParenIndex; index < content.length; index += 1) {
      const char = content[index];
      if (char === '(') {
        depth += 1;
      } else if (char === ')') {
        depth -= 1;
        if (depth === 0) {
          closeParenIndex = index;
          break;
        }
      }
    }

    if (closeParenIndex < 0) continue;
    calls.push({
      name,
      actualText: content.slice(openParenIndex + 1, closeParenIndex),
      index: startIndex,
    });
  }

  return calls;
}

function normalizeDeclaredType(typeText: string): NormalizedDeclaredType {
  const normalized = typeText.replace(/\s+/g, ' ').trim().toLowerCase();
  if (normalized.includes('std_logic_vector')) return 'std_logic_vector';
  if (normalized.includes('unsigned')) return 'unsigned';
  if (normalized.includes('signed')) return 'signed';
  if (/\bstd_(u)?logic\b/.test(normalized)) return 'std_logic';
  if (normalized.includes('integer') || normalized.includes('natural') || normalized.includes('positive')) return 'integer';
  return 'other';
}

function normalizeDeclaredTypeWithAliases(
  typeText: string,
  aliases: Map<string, NormalizedDeclaredType>,
): NormalizedDeclaredType {
  const direct = normalizeDeclaredType(typeText);
  if (direct !== 'other') return direct;

  const normalized = typeText.replace(/\s+/g, ' ').trim().toLowerCase();
  const simpleAliasMatch = normalized.match(/^([a-zA-Z][a-zA-Z0-9_]*)$/);
  if (!simpleAliasMatch) return 'other';
  return aliases.get(simpleAliasMatch[1]) || 'other';
}

function collectDeclaredTypeAliases(
  content: string,
  inheritedAliases?: Map<string, NormalizedDeclaredType>,
) {
  const declaredTypeAliases = new Map<string, NormalizedDeclaredType>(inheritedAliases || []);
  for (const match of content.matchAll(/\b(type|subtype)\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\s+([^;]+?)\s*;/gi)) {
    const aliasName = match[2].toLowerCase();
    const aliasType = normalizeDeclaredTypeWithAliases(match[3], declaredTypeAliases);
    declaredTypeAliases.set(aliasName, aliasType);
  }
  return declaredTypeAliases;
}

function collectDeclaredIdentifierTypes(
  content: string,
  inheritedAliases?: Map<string, NormalizedDeclaredType>,
) {
  const declaredTypes = new Map<string, NormalizedDeclaredType>();
  const declaredTypeAliases = collectDeclaredTypeAliases(content, inheritedAliases);

  for (const [aliasName, aliasType] of declaredTypeAliases.entries()) {
    declaredTypes.set(aliasName, aliasType);
  }

  const recordType = (names: string[], typeText: string) => {
    const normalizedType = normalizeDeclaredTypeWithAliases(typeText, declaredTypeAliases);
    names.forEach((name) => declaredTypes.set(name.toLowerCase(), normalizedType));
  };

  for (const match of content.matchAll(/\b(signal|variable|constant)\s+([^:;]+?)\s*:\s*([^;:=]+(?:\([^;]*?\))?)/gi)) {
    recordType(splitIdentifierList(match[2]), match[3]);
  }

  const recordParameterList = (parameterList: string) => {
    for (const segment of parameterList.split(';')) {
      const match = segment.match(/^\s*([a-zA-Z][a-zA-Z0-9_,\s]*)\s*:\s*(?:(?:in|out|inout|buffer|linkage)\s+)?(.+)\s*$/i);
      if (!match) continue;
      recordType(splitIdentifierList(match[1]), match[2]);
    }
  };

  for (const match of content.matchAll(/\bfunction\s+[a-zA-Z][a-zA-Z0-9_]*\s*\(([\s\S]*?)\)\s*return\b/gi)) {
    recordParameterList(match[1]);
  }
  for (const match of content.matchAll(/\bprocedure\s+[a-zA-Z][a-zA-Z0-9_]*\s*\(([\s\S]*?)\)\s*is\b/gi)) {
    recordParameterList(match[1]);
  }
  for (const match of content.matchAll(/\b(?:port|generic)\s*\(([\s\S]*?)\)\s*;/gi)) {
    recordParameterList(match[1]);
  }

  return declaredTypes;
}

type SubprogramSignature = {
  name: string;
  kind: 'function' | 'procedure';
  parameters: NormalizedDeclaredType[];
  returnType?: NormalizedDeclaredType;
};

type InterfaceSignature = {
  name: string;
  ports: Map<string, NormalizedDeclaredType>;
};

function collectSubprogramSignatures(
  content: string,
  inheritedAliases?: Map<string, NormalizedDeclaredType>,
) {
  const signatures = new Map<string, SubprogramSignature[]>();
  const declaredTypeAliases = collectDeclaredTypeAliases(content, inheritedAliases);

  const addSignature = (signature: SubprogramSignature) => {
    const key = signature.name.toLowerCase();
    const existing = signatures.get(key) || [];
    existing.push(signature);
    signatures.set(key, existing);
  };

  const parseParameterTypes = (parameterList: string) => {
    const parameterTypes: NormalizedDeclaredType[] = [];
    for (const segment of parameterList.split(';')) {
      const match = segment.match(/^\s*([a-zA-Z][a-zA-Z0-9_,\s]*)\s*:\s*(?:(?:in|out|inout|buffer|linkage)\s+)?(.+)\s*$/i);
      if (!match) continue;
      const identifiers = splitIdentifierList(match[1]);
      const normalizedType = normalizeDeclaredTypeWithAliases(match[2], declaredTypeAliases);
      identifiers.forEach(() => parameterTypes.push(normalizedType));
    }
    return parameterTypes;
  };

  for (const match of content.matchAll(/\bfunction\s+([a-zA-Z][a-zA-Z0-9_]*)\s*\(([\s\S]*?)\)\s*return\s+([^;\n]+?)(?:\s+is\b|\s*;)/gi)) {
    addSignature({
      name: match[1],
      kind: 'function',
      parameters: parseParameterTypes(match[2]),
      returnType: normalizeDeclaredTypeWithAliases(match[3], declaredTypeAliases),
    });
  }

  for (const match of content.matchAll(/\bprocedure\s+([a-zA-Z][a-zA-Z0-9_]*)\s*\(([\s\S]*?)\)\s*is\b/gi)) {
    addSignature({
      name: match[1],
      kind: 'procedure',
      parameters: parseParameterTypes(match[2]),
    });
  }

  return signatures;
}

function mergeSubprogramSignatures(
  target: Map<string, SubprogramSignature[]>,
  source: Map<string, SubprogramSignature[]>,
) {
  for (const [name, signatures] of source) {
    const existing = target.get(name) || [];
    existing.push(...signatures);
    target.set(name, existing);
  }
}

function collectInterfaceSignatures(
  content: string,
  inheritedAliases?: Map<string, NormalizedDeclaredType>,
) {
  const signatures = new Map<string, InterfaceSignature>();
  const declaredTypeAliases = collectDeclaredTypeAliases(content, inheritedAliases);

  const addInterfaceSignature = (name: string, interfaceBody: string) => {
    const ports = new Map<string, NormalizedDeclaredType>();
    for (const segment of interfaceBody.split(';')) {
      const match = segment.match(/^\s*([a-zA-Z][a-zA-Z0-9_,\s]*)\s*:\s*(?:(?:in|out|inout|buffer|linkage)\s+)?(.+)\s*$/i);
      if (!match) continue;
      const normalizedType = normalizeDeclaredTypeWithAliases(match[2], declaredTypeAliases);
      splitIdentifierList(match[1]).forEach((identifier) => ports.set(identifier.toLowerCase(), normalizedType));
    }
    signatures.set(name.toLowerCase(), {
      name,
      ports,
    });
  };

  for (const match of content.matchAll(/\b(entity|component)\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is[\s\S]*?\bport\s*\(([\s\S]*?)\)\s*;/gi)) {
    addInterfaceSignature(match[2], match[3]);
  }

  return signatures;
}

async function collectProjectInterfaceSignatures(projectRoot: string, sourcePaths: string[]) {
  const signatures = new Map<string, InterfaceSignature>();
  const sharedTypeAliases = await collectProjectDeclaredTypeAliases(projectRoot, sourcePaths);

  for (const relativePath of sourcePaths) {
    const absolutePath = path.join(projectRoot, relativePath);
    let content = '';
    try {
      content = stripVhdlComments(await fs.readFile(absolutePath, 'utf8'));
    } catch {
      continue;
    }

    for (const [key, signature] of collectInterfaceSignatures(content, sharedTypeAliases)) {
      if (!signatures.has(key)) {
        signatures.set(key, signature);
      }
    }
  }

  return signatures;
}

async function collectProjectDeclaredTypeAliases(projectRoot: string, sourcePaths: string[]) {
  const aliases = new Map<string, NormalizedDeclaredType>();

  for (const relativePath of sourcePaths) {
    const absolutePath = path.join(projectRoot, relativePath);
    let content = '';
    try {
      content = stripVhdlComments(await fs.readFile(absolutePath, 'utf8'));
    } catch {
      continue;
    }

    const localAliases = collectDeclaredTypeAliases(content, aliases);
    for (const [aliasName, aliasType] of localAliases.entries()) {
      if (!aliases.has(aliasName)) {
        aliases.set(aliasName, aliasType);
      }
    }
  }

  return aliases;
}

async function collectProjectSubprogramSignatures(projectRoot: string, sourcePaths: string[]) {
  const signatures = new Map<string, SubprogramSignature[]>();
  const sharedTypeAliases = await collectProjectDeclaredTypeAliases(projectRoot, sourcePaths);

  for (const relativePath of sourcePaths) {
    const absolutePath = path.join(projectRoot, relativePath);
    let content = '';
    try {
      content = stripVhdlComments(await fs.readFile(absolutePath, 'utf8'));
    } catch {
      continue;
    }

    mergeSubprogramSignatures(signatures, collectSubprogramSignatures(content, sharedTypeAliases));
  }

  return signatures;
}

function inferActualExpressionType(actualExpression: string, declaredTypes: Map<string, NormalizedDeclaredType>): NormalizedDeclaredType | null {
  const trimmed = actualExpression.trim();
  const wrappedMatch = trimmed.match(/^(std_logic_vector|unsigned|signed)\s*\(\s*([a-zA-Z][a-zA-Z0-9_]*)(?:\s*\([^)]*\))?\s*\)$/i);
  if (wrappedMatch) {
    return normalizeDeclaredType(wrappedMatch[1]);
  }

  const baseIdentifierMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9_]*)(?:\s*\([^)]*\))?$/);
  if (!baseIdentifierMatch) return null;
  return declaredTypes.get(baseIdentifierMatch[1].toLowerCase()) || null;
}

function collectReservedIdentifierFindings(relativePath: string, content: string) {
  const findings: GeneratedVhdlFailureDetail[] = [];
  const reservedIdentifiers = new Set(VHDL_RESERVED_IDENTIFIERS.map((value) => value.toLowerCase()));

  const reportIfReserved = (kind: string, identifier: string) => {
    if (!reservedIdentifiers.has(identifier.toLowerCase())) return;
    findings.push(createFailureDetail({
      code: 'reserved_identifier',
      category: 'identifier_reserved_word',
      message:
        `${relativePath}: uses reserved VHDL identifier "${identifier}" as a ${kind}. ` +
        `Rename it to a safe descriptive name such as ALU_OP_${identifier.toUpperCase()} or logical_${identifier.toLowerCase()}_op.`,
      forbiddenConstruct: `reserved identifier "${identifier}" used as ${kind}`,
      legalReplacementPattern: `rename "${identifier}" to a descriptive non-keyword identifier such as ALU_OP_${identifier.toUpperCase()}`,
    }));
  };

  for (const match of content.matchAll(/\b(entity|component|package(?!\s+body\b)|architecture|procedure|function|type|subtype|alias)\s+([a-zA-Z][a-zA-Z0-9_]*)\b/gi)) {
    reportIfReserved(match[1].toLowerCase(), match[2]);
  }

  for (const match of content.matchAll(/\b(signal|variable|constant)\s+([^:;]+?)\s*:/gi)) {
    splitIdentifierList(match[2]).forEach((identifier) => reportIfReserved(match[1].toLowerCase(), identifier));
  }

  for (const match of content.matchAll(/\btype\s+[a-zA-Z][a-zA-Z0-9_]*\s+is\s*\(([^;]+)\)\s*;/gi)) {
    splitIdentifierList(match[1]).forEach((identifier) => reportIfReserved('enum literal', identifier));
  }

  const inspectParameterList = (parameterList: string, kind: string) => {
    for (const segment of parameterList.split(';')) {
      const parameterMatch = segment.match(/^\s*([a-zA-Z][a-zA-Z0-9_,\s]*)\s*:/i);
      if (!parameterMatch) continue;
      splitIdentifierList(parameterMatch[1]).forEach((identifier) => reportIfReserved(kind, identifier));
    }
  };

  for (const match of content.matchAll(/\bfunction\s+[a-zA-Z][a-zA-Z0-9_]*\s*\(([\s\S]*?)\)\s*return\b/gi)) {
    inspectParameterList(match[1], 'function argument');
  }
  for (const match of content.matchAll(/\bprocedure\s+[a-zA-Z][a-zA-Z0-9_]*\s*\(([\s\S]*?)\)\s*is\b/gi)) {
    inspectParameterList(match[1], 'procedure argument');
  }
  for (const match of content.matchAll(/\b(?:port|generic)\s*\(([\s\S]*?)\)\s*;/gi)) {
    inspectParameterList(match[1], 'interface name');
  }

  return findings;
}

export async function detectKnownVhdlAntiPatternDetails(projectRoot: string, sourcePaths: string[]) {
  const findings: GeneratedVhdlFailureDetail[] = [];
  const logicalKeywordsPattern = [...new Set([...VHDL_OPERATOR_KEYWORDS, 'nand', 'nor'])]
    .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const projectTypeAliases = await collectProjectDeclaredTypeAliases(projectRoot, sourcePaths);
  const projectInterfaceSignatures = await collectProjectInterfaceSignatures(projectRoot, sourcePaths);
  const projectSubprogramSignatures = await collectProjectSubprogramSignatures(projectRoot, sourcePaths);

  for (const relativePath of sourcePaths) {
    const absolutePath = path.join(projectRoot, relativePath);
    let content = '';
    try {
      content = stripVhdlComments(await fs.readFile(absolutePath, 'utf8'));
    } catch {
      continue;
    }

    findings.push(...collectReservedIdentifierFindings(relativePath, content));

    const declaredTypes = collectDeclaredIdentifierTypes(content, projectTypeAliases);
    const subprogramSignatures = projectSubprogramSignatures;
    const interfaceSignatures = projectInterfaceSignatures;

    const architectureDeclarativeRegion = content.match(/\barchitecture\s+[a-zA-Z][a-zA-Z0-9_]*\s+of\s+[a-zA-Z][a-zA-Z0-9_]*\s+is\b([\s\S]*?)\bbegin\b/i);
    if (architectureDeclarativeRegion) {
      for (const architectureVariable of architectureDeclarativeRegion[1].matchAll(/\bvariable\s+([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*([^;:=\n]+(?:\([^;\n]*\))?)/gi)) {
        const intent = classifyArchitectureBodyVariableIntent({
          relativePath,
          variableName: architectureVariable[1],
          subtype: architectureVariable[2].trim(),
        });
        findings.push(createFailureDetail({
          code: 'architecture_body_variable',
          category: 'declaration_scope',
          message:
            `${relativePath}: declares plain architecture-body variable "${architectureVariable[1]}". ` +
            `Ordinary variables are not allowed in the architecture declarative region for GHDL-compatible VHDL. ` +
            `${intent.messageTail}`,
          forbiddenConstruct: `plain architecture-body variable "${architectureVariable[1]}" (${intent.flavor})`,
          legalReplacementPattern: intent.legalReplacementPattern,
        }));
      }
    }

    for (const executableSignalDeclaration of collectExecutableRegionSignalDeclarations(content)) {
      findings.push(createFailureDetail({
        code: 'executable_region_signal_declaration',
        category: 'declaration_scope',
        message:
          `${relativePath}: declares signal "${executableSignalDeclaration}" inside an executable region after "begin". ` +
          `Signal declarations belong only in the architecture/block declarative region before "begin"; for temporary sequential intermediates, declare a process-local variable before the process "begin" instead.`,
        forbiddenConstruct: `signal declaration for "${executableSignalDeclaration}" after begin`,
        legalReplacementPattern: `declare "${executableSignalDeclaration}" before the enclosing begin, or use a process-local variable declared before the process begin`,
      }));
    }

    for (const match of content.matchAll(/\b(entity|component)\s+[a-zA-Z][a-zA-Z0-9_]*\s+is[\s\S]*?\b(?:port|generic)\s*\(([\s\S]*?)\)\s*;/gi)) {
      const blockBody = match[2];
      const badAssociationLine = blockBody
        .split('\n')
        .map((line) => line.trim())
        .find((line) => /^[a-zA-Z][a-zA-Z0-9_]*\s*=>/.test(line));
      if (badAssociationLine) {
        findings.push(createFailureDetail({
          code: 'interface_arrow_syntax',
          category: 'interface_generic_port_syntax',
          message:
            `${relativePath}: uses association syntax "${badAssociationLine}" inside an interface declaration. ` +
            `Entity/component generic and port items must use ":" after the identifier; reserve "=>" for port maps, generic maps, and aggregates.`,
          forbiddenConstruct: `"=>" inside entity/component interface declaration`,
          legalReplacementPattern: `use ":" between interface names and types/modes inside generic and port lists`,
        }));
      }
    }

    const illegalScalarTypeAlias = content.match(/\btype\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\s+(integer|natural|positive)\s+range\b/i);
    if (illegalScalarTypeAlias) {
      findings.push(createFailureDetail({
        code: 'illegal_scalar_type_alias',
        category: 'package_type_definition',
        message:
          `${relativePath}: declares constrained scalar alias "${illegalScalarTypeAlias[1]}" with "type ... is ${illegalScalarTypeAlias[2].toLowerCase()} range". ` +
          `For constrained scalar aliases in GHDL-compatible VHDL, use "subtype ${illegalScalarTypeAlias[1]} is ${illegalScalarTypeAlias[2].toLowerCase()} range ...;" instead of declaring a new type from ${illegalScalarTypeAlias[2].toLowerCase()}.`,
        forbiddenConstruct: `"type ${illegalScalarTypeAlias[1]} is ${illegalScalarTypeAlias[2].toLowerCase()} range ..."`,
        legalReplacementPattern: `use "subtype ${illegalScalarTypeAlias[1]} is ${illegalScalarTypeAlias[2].toLowerCase()} range ...;"`,
      }));
    }

    const scalarBitStringAssignment = content.match(/\b(constant|signal|variable)\s+([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(integer|natural|positive)\b[^;\n]*:=\s*("[01_xXzZ]+")/i);
    if (scalarBitStringAssignment) {
      findings.push(createFailureDetail({
        code: 'scalar_bit_string_assignment',
        category: 'width_literal_mismatch',
        message:
          `${relativePath}: assigns bit-string literal ${scalarBitStringAssignment[4]} to scalar numeric ${scalarBitStringAssignment[3].toLowerCase()} "${scalarBitStringAssignment[2]}". ` +
          `Scalar numeric declarations must use numeric literals/expressions such as 0, 3, or an explicit typed conversion instead of VHDL bit strings.`,
        forbiddenConstruct: `bit-string literal assigned to scalar numeric "${scalarBitStringAssignment[2]}"`,
        legalReplacementPattern: `replace ${scalarBitStringAssignment[4]} with a numeric literal or explicit typed conversion`,
      }));
    }

    const inlineProseLeak = content.match(/\b(constant|signal|variable)\s+[a-zA-Z][a-zA-Z0-9_]*\b[^;\n]*:=\s*[^;\n]*\bafter\s+"[^"\n]+"\s+element\b[^;\n]*;/i);
    if (inlineProseLeak) {
      findings.push(createFailureDetail({
        code: 'natural_language_leakage',
        category: 'other',
        message:
          `${relativePath}: contains natural-language prose inside a VHDL declaration ("${inlineProseLeak[0].trim()}"). ` +
          `Complete the VHDL declaration first and move any explanation into a trailing "--" comment after the terminating semicolon.`,
        forbiddenConstruct: 'natural-language prose embedded in a VHDL declaration',
        legalReplacementPattern: 'keep prose only in VHDL comments after syntactically complete statements',
      }));
    }

    const repairMetaLeak = content.match(
      /^(?:\s*(?:REPAIRED|FIXED|UPDATED|CHANGED|NOTE|EXPLANATION)\s*:.*|\s*#{1,6}\s+.*|\s*[-*]\s+(?:REPAIRED|FIXED|UPDATED|CHANGED|NOTE|EXPLANATION)\b.*)$/im,
    );
    if (repairMetaLeak) {
      findings.push(createFailureDetail({
        code: 'natural_language_leakage',
        category: 'other',
        message:
          `${relativePath}: contains repair/meta commentary inside VHDL source ("${repairMetaLeak[0].trim()}"). ` +
          `Generated VHDL must contain code and VHDL comments only; convert repair notes, markdown headings, and bullet summaries into "--" comments or remove them entirely.`,
        forbiddenConstruct: 'repair/meta commentary embedded in VHDL source',
        legalReplacementPattern: 'keep any explanatory text only as VHDL comments starting with "--", and never emit markdown headings, bullets, or repair labels in source files',
      }));
    }

    const invalidEndWithExtension = content.match(/\bend\s+(package|entity|architecture|component)\s+[a-zA-Z][a-zA-Z0-9_]*\.(vhd|vhdl)\s*;/i);
    if (invalidEndWithExtension) {
      findings.push(createFailureDetail({
        code: 'end_statement_file_extension',
        category: 'package_type_definition',
        message:
          `${relativePath}: ends a ${invalidEndWithExtension[1].toLowerCase()} with a file extension ("${invalidEndWithExtension[0].trim()}"). ` +
          `VHDL end statements must name the design unit only, never a filename; remove the .${invalidEndWithExtension[2].toLowerCase()} suffix.`,
        forbiddenConstruct: `end statement containing .${invalidEndWithExtension[2].toLowerCase()} file suffix`,
        legalReplacementPattern: 'end the design unit with only its identifier or a bare end statement',
      }));
    }

    const verilogStyleLiteral = content.match(/\b\d+\s*'[bBdDhHoO]\s*[0-9a-fA-F_xXzZ]+\b/);
    if (verilogStyleLiteral) {
      findings.push(createFailureDetail({
        code: 'verilog_style_literal',
        category: 'width_literal_mismatch',
        message:
          `${relativePath}: uses Verilog-style literal "${verilogStyleLiteral[0]}". ` +
          `VHDL does not support sized base literals in that form. Use legal VHDL syntax such as bit strings ("000"), hex strings (x"FF"), or typed numeric constructors like to_unsigned(...).`,
        forbiddenConstruct: `Verilog/SystemVerilog literal "${verilogStyleLiteral[0]}"`,
        legalReplacementPattern: 'use legal VHDL bit strings, hex strings, or typed numeric_std constructors',
      }));
    }

    const illegalLogicalHybrid = content.match(new RegExp(`\\b([a-zA-Z][a-zA-Z0-9_]*)\\s+(${logicalKeywordsPattern})\\s+([a-zA-Z][a-zA-Z0-9_]*)\\s*=\\s*0\\b`, 'i'));
    if (illegalLogicalHybrid) {
      findings.push(createFailureDetail({
        code: 'illegal_numeric_logical_hybrid',
        category: 'numeric_std_type_discipline',
        message:
          `${relativePath}: illegal logical-operator expression on numeric operands ("${illegalLogicalHybrid[0]}"). ` +
          `Use explicit boolean comparisons such as (${illegalLogicalHybrid[1]} = 0) ${illegalLogicalHybrid[2]} (${illegalLogicalHybrid[3]} = 0), ` +
          `or derive the zero flag from the final ALU result instead.`,
        forbiddenConstruct: `numeric operands combined with ${illegalLogicalHybrid[2].toLowerCase()} as if they were booleans`,
        legalReplacementPattern: `compare each numeric expression explicitly or derive the condition from a typed final result`,
      }));
    }

    const prefixOperatorForm = content.match(/\b(xnor|nand|nor)\s+[a-zA-Z][a-zA-Z0-9_]*\s*,\s*[a-zA-Z][a-zA-Z0-9_]*\b/i);
    if (prefixOperatorForm) {
      findings.push(createFailureDetail({
        code: 'illegal_prefix_operator_form',
        category: 'numeric_std_type_discipline',
        message:
          `${relativePath}: illegal prefix/function-style VHDL operator form ("${prefixOperatorForm[0]}"). ` +
          `Use legal infix syntax such as "a_u ${prefixOperatorForm[1].toLowerCase()} b_u" on matching typed operands.`,
        forbiddenConstruct: `prefix/function-style ${prefixOperatorForm[1].toLowerCase()} operator form`,
        legalReplacementPattern: `use infix "${prefixOperatorForm[1].toLowerCase()}" on operands of matching type and width`,
      }));
    }

    const usesLogicTypes = /\b(std_logic|std_ulogic|std_logic_vector)\b/i.test(content);
    const hasStdLogic1164 = /\buse\s+ieee\.std_logic_1164\.all\s*;/i.test(content);
    if (usesLogicTypes && !hasStdLogic1164) {
      findings.push(createFailureDetail({
        code: 'missing_std_logic_1164_clause',
        category: 'missing_ieee_clause',
        message:
          `${relativePath}: uses std_logic/std_ulogic logic types without a local "use ieee.std_logic_1164.all;" clause. ` +
          `Add "library ieee;" and "use ieee.std_logic_1164.all;" in this same file.`,
        forbiddenConstruct: 'logic types used without local std_logic_1164 import',
        legalReplacementPattern: 'add local library/use clauses for ieee.std_logic_1164 in the same file',
      }));
    }

    const usesNumericStdTypes = /\b(unsigned|signed)\b/i.test(content);
    const usesNumericStdFns = /\b(resize|to_integer|to_signed|to_unsigned)\s*\(/i.test(content);
    const hasNumericStd = /\buse\s+ieee\.numeric_std\.all\s*;/i.test(content);
    if ((usesNumericStdTypes || usesNumericStdFns) && !hasNumericStd) {
      findings.push(createFailureDetail({
        code: 'missing_numeric_std_clause',
        category: 'missing_ieee_clause',
        message:
          `${relativePath}: uses numeric_std types/functions without a local "use ieee.numeric_std.all;" clause. ` +
          `Add the numeric_std use clause in this same file.`,
        forbiddenConstruct: 'numeric_std types/functions used without local numeric_std import',
        legalReplacementPattern: 'add local use ieee.numeric_std.all; in the same file',
      }));
    }

    const resizeOnStdLogicVector = content.match(/\bresize\s*\(\s*([a-zA-Z][a-zA-Z0-9_]*)\s*,/i);
    if (resizeOnStdLogicVector) {
      const identifier = resizeOnStdLogicVector[1].toLowerCase();
      if (declaredTypes.get(identifier) === 'std_logic_vector') {
        findings.push(createFailureDetail({
          code: 'resize_on_raw_std_logic_vector',
          category: 'numeric_std_type_discipline',
          message:
            `${relativePath}: calls resize on raw std_logic_vector "${resizeOnStdLogicVector[1]}". ` +
            `Convert first, for example resize(unsigned(${resizeOnStdLogicVector[1]}), WIDTH), or normalize it into a typed local operand.`,
          forbiddenConstruct: `resize(${resizeOnStdLogicVector[1]}, ...) on std_logic_vector`,
          legalReplacementPattern: `convert "${resizeOnStdLogicVector[1]}" to unsigned/signed before calling resize`,
        }));
      }
    }

    const resizeRangeArgument = content.match(/\bresize\s*\(\s*[^,]+,\s*([a-zA-Z][a-zA-Z0-9_]*'range)\s*\)/i);
    if (resizeRangeArgument) {
      findings.push(createFailureDetail({
        code: 'resize_with_range_attribute',
        category: 'numeric_std_type_discipline',
        message:
          `${relativePath}: calls resize with attribute range "${resizeRangeArgument[1]}". ` +
          `resize expects a scalar width/count, not a 'range attribute. Use a length such as SOME_SIGNAL'length or an explicit integer width instead.`,
        forbiddenConstruct: `resize(..., ${resizeRangeArgument[1]})`,
        legalReplacementPattern: `pass a scalar width such as SOME_SIGNAL'length or an explicit integer`,
      }));
    }

    const toIntegerOnStdLogicVector = content.match(/\bto_integer\s*\(\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\)/i);
    if (toIntegerOnStdLogicVector) {
      const identifier = toIntegerOnStdLogicVector[1].toLowerCase();
      const identifierType = declaredTypes.get(identifier);
      if (identifierType === 'std_logic_vector' || identifierType === 'std_logic') {
        findings.push(createFailureDetail({
          code: 'to_integer_on_raw_logic_type',
          category: 'numeric_std_type_discipline',
          message:
            `${relativePath}: calls to_integer on raw ${identifierType} "${toIntegerOnStdLogicVector[1]}". ` +
            `Convert it first with unsigned(...) or signed(...), for example to_integer(unsigned(${toIntegerOnStdLogicVector[1]})).`,
          forbiddenConstruct: `to_integer(${toIntegerOnStdLogicVector[1]}) on raw ${identifierType}`,
          legalReplacementPattern: `convert "${toIntegerOnStdLogicVector[1]}" with unsigned(...) or signed(...) before to_integer`,
        }));
      }
    }

    const shiftOnStdLogicVector = content.match(/\bshift_(left|right)\s*\(\s*([a-zA-Z][a-zA-Z0-9_]*)\s*,/i);
    if (shiftOnStdLogicVector) {
      const identifier = shiftOnStdLogicVector[2].toLowerCase();
      if (declaredTypes.get(identifier) === 'std_logic_vector') {
        findings.push(createFailureDetail({
          code: `shift_${shiftOnStdLogicVector[1].toLowerCase()}_on_raw_std_logic_vector`,
          category: 'numeric_std_type_discipline',
          message:
            `${relativePath}: calls shift_${shiftOnStdLogicVector[1].toLowerCase()} on raw std_logic_vector "${shiftOnStdLogicVector[2]}". ` +
            `Normalize it into unsigned(...) or signed(...) before calling numeric_std shift functions.`,
          forbiddenConstruct: `shift_${shiftOnStdLogicVector[1].toLowerCase()}(${shiftOnStdLogicVector[2]}, ...) on std_logic_vector`,
          legalReplacementPattern: `convert "${shiftOnStdLogicVector[2]}" to unsigned/signed before shifting`,
        }));
      }
    }

    const typedBitwiseMismatch = content.match(/\b([a-zA-Z][a-zA-Z0-9_]*)\s*(?::=|<=|=)\s*([a-zA-Z][a-zA-Z0-9_]*)\s+(and|or|xor|xnor|nand|nor)\s+([a-zA-Z][a-zA-Z0-9_]*)\s*;/i);
    if (typedBitwiseMismatch) {
      const [, lhs, leftOperand, operatorKeyword, rightOperand] = typedBitwiseMismatch;
      const lhsType = declaredTypes.get(lhs.toLowerCase());
      const leftType = declaredTypes.get(leftOperand.toLowerCase());
      const rightType = declaredTypes.get(rightOperand.toLowerCase());
      if ((lhsType === 'unsigned' || lhsType === 'signed') && leftType === 'std_logic_vector' && rightType === 'std_logic_vector') {
        findings.push(createFailureDetail({
          code: 'typed_bitwise_mismatch',
          category: 'numeric_std_type_discipline',
          message:
            `${relativePath}: assigns raw std_logic_vector bitwise expression "${typedBitwiseMismatch[0]}" into ${lhsType}. ` +
            `Normalize operands into matching ${lhsType} locals first, then apply "${operatorKeyword.toLowerCase()}" on those typed operands.`,
          forbiddenConstruct: `raw std_logic_vector ${operatorKeyword.toLowerCase()} expression assigned to ${lhsType}`,
          legalReplacementPattern: `convert ${leftOperand} and ${rightOperand} into matching ${lhsType} operands before applying ${operatorKeyword.toLowerCase()}`,
        }));
      }
    }

    const typedUnaryMismatch = content.match(/\b([a-zA-Z][a-zA-Z0-9_]*)\s*(?::=|<=|=)\s*not\s+([a-zA-Z][a-zA-Z0-9_]*)\s*;/i);
    if (typedUnaryMismatch) {
      const [, lhs, operand] = typedUnaryMismatch;
      const lhsType = declaredTypes.get(lhs.toLowerCase());
      const operandType = declaredTypes.get(operand.toLowerCase());
      if ((lhsType === 'unsigned' || lhsType === 'signed') && operandType === 'std_logic_vector') {
        findings.push(createFailureDetail({
          code: 'typed_unary_mismatch',
          category: 'numeric_std_type_discipline',
          message:
            `${relativePath}: assigns raw std_logic_vector unary expression "${typedUnaryMismatch[0]}" into ${lhsType}. ` +
            `Convert "${operand}" into a matching typed local before applying "not".`,
          forbiddenConstruct: `raw std_logic_vector unary not assigned to ${lhsType}`,
          legalReplacementPattern: `convert "${operand}" into matching ${lhsType} before applying not`,
        }));
      }
    }

    for (const match of collectPotentialSubprogramCalls(content)) {
      const subprogramName = match.name;
      const lowerName = subprogramName.toLowerCase();
      const linePrefix = content.slice(Math.max(0, match.index - 24), match.index + subprogramName.length);
      if (/\b(function|procedure)\s+$/i.test(linePrefix)) continue;

      const signatures = subprogramSignatures.get(lowerName);
      if (!signatures?.length) continue;

      const actuals = splitTopLevelArguments(match.actualText);

      for (const signature of signatures) {
        const checkCount = Math.min(actuals.length, signature.parameters.length);
        for (let index = 0; index < checkCount; index += 1) {
          const formalType = signature.parameters[index];
          if (formalType !== 'unsigned' && formalType !== 'signed') continue;
          const actualInfo = extractActualBaseIdentifier(actuals[index]);
          if (!actualInfo) continue;
          const actualType = declaredTypes.get(actualInfo.baseIdentifier.toLowerCase());
          if (actualType !== 'std_logic_vector') continue;

          findings.push(createFailureDetail({
            code: 'typed_helper_actual_mismatch',
            category: 'numeric_std_type_discipline',
            message:
              `${relativePath}: calls ${signature.kind} "${subprogramName}" with raw std_logic_vector actual "${actualInfo.actualExpression}" for ${formalType} formal parameter #${index + 1}. ` +
              `Convert "${actualInfo.actualExpression}" at the call site, for example ${formalType}(${actualInfo.actualExpression}), or normalize it into a typed local before calling "${subprogramName}".`,
            forbiddenConstruct: `raw std_logic_vector actual "${actualInfo.actualExpression}" passed to ${formalType} formal parameter of ${subprogramName}`,
            legalReplacementPattern: `convert "${actualInfo.actualExpression}" to ${formalType} at the call site or change the formal parameter type`,
          }));
          break;
        }
      }
    }

    for (const [lowerName, signatures] of subprogramSignatures.entries()) {
      for (const signature of signatures) {
        if (signature.kind !== 'function' || signature.returnType !== 'std_logic_vector') continue;
        const assignmentExpression = new RegExp(`\\b([a-zA-Z][a-zA-Z0-9_]*)\\s*(?::=|<=|=)\\s*${lowerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\(`, 'gi');
        for (const assignmentMatch of content.matchAll(assignmentExpression)) {
          const lhsName = assignmentMatch[1];
          if (!lhsName) continue;
          const lhsType = declaredTypes.get(lhsName.toLowerCase());
          if (lhsType !== 'unsigned' && lhsType !== 'signed') continue;

          findings.push(createFailureDetail({
            code: 'typed_function_result_mismatch',
            category: 'numeric_std_type_discipline',
            message:
              `${relativePath}: assigns std_logic_vector function result "${signature.name}(...)" into ${lhsType} destination "${lhsName}". ` +
              `Return ${lhsType} directly from "${signature.name}" or convert the function result explicitly at the assignment site before driving "${lhsName}".`,
            forbiddenConstruct: `std_logic_vector function result from "${signature.name}" assigned into ${lhsType} destination "${lhsName}"`,
            legalReplacementPattern: `change "${signature.name}" to return ${lhsType} or wrap the call with ${lhsType}(...) at the assignment site`,
          }));
          break;
        }
      }
    }

    for (const match of content.matchAll(
      /(?:^|\n)\s*[a-zA-Z][a-zA-Z0-9_]*\s*:\s*(?:entity\s+work\.)?(?!(?:in|out|inout|buffer|linkage|signal|variable|constant|unsigned|signed|std_logic|std_logic_vector)\b)([a-zA-Z][a-zA-Z0-9_]*)\b[\s\S]*?\bport\s+map\s*\(([\s\S]*?)\)\s*;/gi,
    )) {
      const instantiatedName = match[1];
      const interfaceSignature = interfaceSignatures.get(instantiatedName.toLowerCase());
      if (!interfaceSignature) continue;

      const associations = splitTopLevelArguments(match[2]);
      for (const association of associations) {
        const associationMatch = association.match(/^\s*([a-zA-Z][a-zA-Z0-9_]*)\s*=>\s*(.+)\s*$/i);
        if (!associationMatch) continue;

        const formalPortName = associationMatch[1];
        const actualExpression = associationMatch[2].trim();
        const formalType = interfaceSignature.ports.get(formalPortName.toLowerCase());
        if (formalType !== 'unsigned' && formalType !== 'signed') continue;

        const actualType = inferActualExpressionType(actualExpression, declaredTypes);
        if (!actualType || actualType === formalType) continue;

        const actualTypeDescriptor = actualType === 'std_logic_vector' ? 'raw std_logic_vector actual' : `${actualType} actual`;
        findings.push(createFailureDetail({
          code: 'typed_port_association_mismatch',
          category: 'numeric_std_type_discipline',
          message:
            `${relativePath}: drives ${formalType} formal port "${formalPortName}" of "${interfaceSignature.name}" with ${actualTypeDescriptor} "${actualExpression}" in a port map. ` +
            `Convert the actual at the entity boundary into the exact formal type expected by the instantiated design unit.`,
          forbiddenConstruct: `${actualTypeDescriptor} "${actualExpression}" passed to ${formalType} formal port "${formalPortName}" of ${interfaceSignature.name}`,
          legalReplacementPattern: `wrap "${actualExpression}" with ${formalType}(...) at the port-map boundary or change the formal/actual types so they match exactly`,
        }));
      }
    }

    for (const match of content.matchAll(/\bprocedure\s+([a-zA-Z][a-zA-Z0-9_]*)\s*\(([\s\S]*?)\)\s*is([\s\S]*?)end\s+procedure\b/gi)) {
      const [, procedureName, parameterList, procedureBody] = match;
      const formalNames = new Set<string>();
      for (const segment of parameterList.split(';')) {
        const parameterMatch = segment.match(/^\s*([a-zA-Z][a-zA-Z0-9_,\s]*)\s*:/i);
        if (!parameterMatch) continue;
        splitIdentifierList(parameterMatch[1]).forEach((identifier) => formalNames.add(identifier.toLowerCase()));
      }

      const localNames = new Set<string>();
      for (const localMatch of procedureBody.matchAll(/\b(signal|variable|constant)\s+([^:;]+?)\s*:/gi)) {
        splitIdentifierList(localMatch[2]).forEach((identifier) => localNames.add(identifier.toLowerCase()));
      }

      for (const assignmentMatch of procedureBody.matchAll(/\b([a-zA-Z][a-zA-Z0-9_]*)\s*(<=|:=)/gi)) {
        const assignee = assignmentMatch[1].toLowerCase();
        if (formalNames.has(assignee) || localNames.has(assignee)) continue;
        if (!declaredTypes.has(assignee)) continue;
        findings.push(createFailureDetail({
          code: 'procedure_outer_scope_write',
          category: 'declaration_scope',
          message:
            `${relativePath}: procedure "${procedureName}" assigns to outer-scope object "${assignmentMatch[1]}" without passing it as a formal parameter. ` +
            `Pass the target in explicitly, or keep that state local to the calling process.`,
          forbiddenConstruct: `procedure "${procedureName}" mutates outer-scope object "${assignmentMatch[1]}"`,
          legalReplacementPattern: `pass "${assignmentMatch[1]}" as a formal parameter or keep the mutable state local to the caller`,
        }));
        break;
      }
    }

    const variableSignalAssignmentMisuse = content.match(/\bvariable\s+([a-zA-Z][a-zA-Z0-9_]*)\b[\s\S]*?\bbegin\b[\s\S]*?\b\1\s*<=/i);
    if (variableSignalAssignmentMisuse) {
      findings.push(createFailureDetail({
        code: 'variable_assigned_with_signal_operator',
        category: 'signal_variable_assignment_misuse',
        message:
          `${relativePath}: assigns variable "${variableSignalAssignmentMisuse[1]}" with the signal assignment operator "<=". ` +
          `Variables must use ":="; reserve "<=" for signals only.`,
        forbiddenConstruct: `variable "${variableSignalAssignmentMisuse[1]}" assigned with "<="`,
        legalReplacementPattern: `replace "<=" with ":=" for variable "${variableSignalAssignmentMisuse[1]}" or convert it into a signal if that was the intent`,
      }));
    }

    const signalVariableAssignmentMisuse = content.match(/\bsignal\s+([a-zA-Z][a-zA-Z0-9_]*)\b[\s\S]*?\bbegin\b[\s\S]*?\b\1\s*:=/i);
    if (signalVariableAssignmentMisuse) {
      findings.push(createFailureDetail({
        code: 'signal_assigned_with_variable_operator',
        category: 'signal_variable_assignment_misuse',
        message:
          `${relativePath}: assigns signal "${signalVariableAssignmentMisuse[1]}" with the variable assignment operator ":=". ` +
          `Signals must use "<="; reserve ":=" for variables/constants only.`,
        forbiddenConstruct: `signal "${signalVariableAssignmentMisuse[1]}" assigned with ":="`,
        legalReplacementPattern: `replace ":=" with "<=" for signal "${signalVariableAssignmentMisuse[1]}" or convert it into a variable if it is process-local temporary state`,
      }));
    }

    const multidimensionalStdLogicVector = content.match(/\b(std_logic_vector|unsigned|signed)\s*\([^)]*\)\s*\([^)]*\)/i);
    if (multidimensionalStdLogicVector) {
      findings.push(createFailureDetail({
        code: 'illegal_multidimensional_logic_vector',
        category: 'array_subtype_misuse',
        message:
          `${relativePath}: declares an illegal multidimensional packed vector form ("${multidimensionalStdLogicVector[0]}"). ` +
          `VHDL requires a named array type for vectors-of-vectors, or a flattened one-dimensional packed vector.`,
        forbiddenConstruct: multidimensionalStdLogicVector[0],
        legalReplacementPattern: 'declare a named array type and use that type, or flatten the storage into one legal vector subtype',
      }));
    }

    const anonymousArrayObjectDeclaration = content.match(
      /\b(signal|variable|constant)\s+([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*array\s*\(([^)\n]+)\)\s+of\s+([^;:=\n]+)/i,
    );
    if (anonymousArrayObjectDeclaration) {
      findings.push(createFailureDetail({
        code: 'anonymous_array_object_declaration',
        category: 'array_subtype_misuse',
        message:
          `${relativePath}: declares ${anonymousArrayObjectDeclaration[1]} "${anonymousArrayObjectDeclaration[2]}" with inline anonymous array(...) of ... syntax. ` +
          `Declare a named array type or subtype first, then declare the object using that named type instead of inline array(...) syntax.`,
        forbiddenConstruct: `${anonymousArrayObjectDeclaration[1]} ${anonymousArrayObjectDeclaration[2]} : array(${anonymousArrayObjectDeclaration[3]}) of ${anonymousArrayObjectDeclaration[4]}`,
        legalReplacementPattern: 'declare a named array type or subtype first, then declare the object using that named type instead of inline array(...) syntax',
      }));
    }

    const reconstrainedSubtype = content.match(/\bsubtype\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\s+([a-zA-Z][a-zA-Z0-9_]*)\s*\([^)]*\)\s*;/i);
    if (reconstrainedSubtype && declaredTypes.has(reconstrainedSubtype[2].toLowerCase())) {
      findings.push(createFailureDetail({
        code: 'reconstrained_subtype_alias',
        category: 'array_subtype_misuse',
        message:
          `${relativePath}: re-constrains existing subtype/type "${reconstrainedSubtype[2]}" in subtype "${reconstrainedSubtype[1]}". ` +
          `Do not re-constrain an already constrained subtype or alias; derive a legal new type/subtype from the true base type instead.`,
        forbiddenConstruct: `subtype ${reconstrainedSubtype[1]} is ${reconstrainedSubtype[2]}(...)`,
        legalReplacementPattern: 'declare a new legal subtype from the base type, or reuse the existing constrained subtype unchanged',
      }));
    }

    const packageDeclarationWithBody = content.match(/\bpackage\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is[\s\S]*?\b(function|procedure)\s+[a-zA-Z][a-zA-Z0-9_]*(?:\s*\([^)]*\))?\s+is[\s\S]*?\bbegin\b/i);
    if (packageDeclarationWithBody) {
      findings.push(createFailureDetail({
        code: 'subprogram_body_inside_package_declaration',
        category: 'package_type_definition',
        message:
          `${relativePath}: places a subprogram body inside package declaration "${packageDeclarationWithBody[1]}". ` +
          `Package declarations may contain only subprogram signatures; move executable subprogram bodies into a separate package body.`,
        forbiddenConstruct: `subprogram body inside package ${packageDeclarationWithBody[1]} declaration`,
        legalReplacementPattern: 'keep only the subprogram signature in the package declaration and move the body into package body',
      }));
    }

    const undeclaredInterfaceReference = content.match(/\b(?:port|generic)\s*\(([\s\S]*?)\)\s*;/i);
    if (undeclaredInterfaceReference) {
      const interfaceText = undeclaredInterfaceReference[1];
      const upperDecls = new Set([
        ...Array.from(declaredTypes.keys()),
        ...extractUniqueMatches(content, /\bgeneric\s*\(([\s\S]*?)\)\s*;/gi, (value) => value),
      ]);
      const suspiciousReference = interfaceText.match(/:\s*(?:in|out|inout|buffer)?\s*[a-zA-Z][a-zA-Z0-9_]*\s*\(\s*([A-Z_][A-Z0-9_]*)\s*-\s*1\s+downto\s+0\s*\)/);
      if (suspiciousReference && !upperDecls.has(suspiciousReference[1].toLowerCase())) {
        findings.push(createFailureDetail({
          code: 'undeclared_interface_dimension_reference',
          category: 'interface_generic_port_syntax',
          message:
            `${relativePath}: uses undeclared width/generic "${suspiciousReference[1]}" inside an interface declaration. ` +
            `Declare the controlling generic/constant legally before using it in a port or generic subtype declaration.`,
          forbiddenConstruct: `undeclared interface dimension "${suspiciousReference[1]}"`,
          legalReplacementPattern: `declare generic/constant "${suspiciousReference[1]}" first or replace it with a legal explicit dimension`,
        }));
      }
    }

    for (const executableTypeDeclaration of collectExecutableRegionDeclarations(content)) {
      findings.push(createFailureDetail({
        code: 'declaration_after_begin',
        category: 'declaration_scope',
        message:
          `${relativePath}: declares ${executableTypeDeclaration.kind} "${executableTypeDeclaration.name}" inside an executable region after "begin". ` +
          `All such declarations must appear in a legal declarative region before executable statements start.`,
        forbiddenConstruct: `${executableTypeDeclaration.kind} declaration for "${executableTypeDeclaration.name}" after begin`,
        legalReplacementPattern: `move "${executableTypeDeclaration.name}" into an enclosing declarative region before begin`,
      }));
    }

    const portSection = content.match(/\bport\s*\(([\s\S]*?)\)\s*;/i)?.[1] || '';
    const architectureBody = content.match(/\bbegin\b([\s\S]*)$/i)?.[1] || '';
    const outputPortNames = Array.from(portSection.matchAll(/\b([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*out\b/gi))
      .map((match) => match[1])
      .filter((value): value is string => typeof value === 'string' && value.length > 0);
    for (const outputName of outputPortNames) {
      const escapedOutput = outputName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rhsAssignmentReadback = new RegExp(`\\b[a-zA-Z][a-zA-Z0-9_]*\\b[^;\\n]*(?:<=|:=)[^;\\n]*\\b${escapedOutput}\\b`, 'i');
      const conditionalReadback = new RegExp(`\\b(?:if|elsif|when|assert|report)\\b[^;\\n]*\\b${escapedOutput}\\b`, 'i');
      if (!rhsAssignmentReadback.test(architectureBody) && !conditionalReadback.test(architectureBody)) {
        continue;
      }
      findings.push(createFailureDetail({
        code: 'output_port_readback',
        category: 'numeric_std_type_discipline',
        message:
          `${relativePath}: appears to read back output port "${outputName}" inside implementation logic. ` +
          `Do not derive internal behavior from an out port; compute through internal typed signals/variables first, then drive the out port.`,
        forbiddenConstruct: `internal logic reading output port "${outputName}"`,
        legalReplacementPattern: `use an internal signal/variable for the computed value and assign the out port from that internal object`,
      }));
    }

    const runtimeBoundRisk = content.match(/\b([a-zA-Z][a-zA-Z0-9_]*)\s*\(\s*to_integer\([^)]+\)\s*\)/i);
    if (runtimeBoundRisk) {
      findings.push(createFailureDetail({
        code: 'runtime_bound_check_risk',
        category: 'runtime_bound_risk',
        message:
          `${relativePath}: performs indexing with an unchecked to_integer(...) expression ("${runtimeBoundRisk[0]}"). ` +
          `Generated indexing and array math must guard bounds explicitly so simulation does not fail with avoidable range errors.`,
        forbiddenConstruct: runtimeBoundRisk[0],
        legalReplacementPattern: 'bound-check the index first, or clamp/validate the converted integer before indexing',
      }));
    }
  }

  return findings;
}

export async function detectKnownVhdlAntiPatterns(projectRoot: string, sourcePaths: string[]) {
  const details = await detectKnownVhdlAntiPatternDetails(projectRoot, sourcePaths);
  return details.map((detail) => detail.message);
}

function normalizeSelectionPath(value: string) {
  return value
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '')
    .trim()
    .toLowerCase();
}

export function resolveValidationSourceSelection(params: {
  availableSources: Array<Pick<VhdlSourceDescriptor, 'path'>>;
  requestedSourcePaths: string[];
  fallbackSourcePaths?: string[];
}) {
  const availablePaths = params.availableSources.map((source) => source.path);
  const availableByNormalizedPath = new Map(
    availablePaths.map((sourcePath) => [normalizeSelectionPath(sourcePath), sourcePath])
  );

  const resolved: string[] = [];
  const seen = new Set<string>();

  const tryAdd = (sourcePath: string | undefined) => {
    if (!sourcePath || seen.has(sourcePath)) return;
    seen.add(sourcePath);
    resolved.push(sourcePath);
  };

  for (const requestedSourcePath of params.requestedSourcePaths) {
    const normalizedRequested = normalizeSelectionPath(requestedSourcePath);
    if (!normalizedRequested) continue;

    const exactMatch = availableByNormalizedPath.get(normalizedRequested);
    if (exactMatch) {
      tryAdd(exactMatch);
      continue;
    }

    const suffixMatch = availablePaths.find((sourcePath) => {
      const normalizedSource = normalizeSelectionPath(sourcePath);
      return normalizedSource.endsWith(`/${normalizedRequested}`) || normalizedRequested.endsWith(`/${normalizedSource}`);
    });
    tryAdd(suffixMatch);
  }

  if (resolved.length > 0) {
    return resolved;
  }

  const fallbackSourcePaths = params.fallbackSourcePaths || [];
  for (const fallbackSourcePath of fallbackSourcePaths) {
    const normalizedFallback = normalizeSelectionPath(fallbackSourcePath);
    tryAdd(availableByNormalizedPath.get(normalizedFallback));
  }

  if (resolved.length > 0) {
    return resolved;
  }

  return availablePaths;
}

function inferArtifactTestbenchEntities(params: {
  projectPath: string;
  sources: VhdlSourceDescriptor[];
  savedArtifacts: GeneratedVhdlArtifactForValidation[];
}) {
  const testbenchPaths = new Set(
    params.savedArtifacts
      .filter((artifact) => artifact.kind === 'testbench')
      .map((artifact) => normalizeRelativePath(params.projectPath, artifact.path).toLowerCase())
  );

  return params.sources
    .filter((source) => testbenchPaths.has(source.path.toLowerCase()))
    .flatMap((source) => source.entities);
}

async function readSourceContentsMap(projectRoot: string, sources: VhdlSourceDescriptor[]) {
  const entries = await Promise.all(sources.map(async (source) => {
    const absolutePath = path.join(projectRoot, source.path);
    const content = stripVhdlComments(await fs.readFile(absolutePath, 'utf8'));
    return [source.path, content] as const;
  }));
  return new Map(entries);
}

function hasWaveformArgument(command: string) {
  return /--(?:vcd|ghw|fst)=/i.test(command);
}

function isTopLevelPortTypeUnconstrained(typeText: string) {
  const normalized = typeText.replace(/\s+/g, ' ').trim().toLowerCase();
  if (/\bstd_logic_vector\b/.test(normalized) && !/\(/.test(normalized)) return true;
  if (/\bunsigned\b/.test(normalized) && !/\(/.test(normalized)) return true;
  if (/\bsigned\b/.test(normalized) && !/\(/.test(normalized)) return true;
  return false;
}

function extractEntityBlock(content: string, entityName: string) {
  const expression = new RegExp(`\\bentity\\s+${entityName}\\s+is\\b([\\s\\S]*?)\\bend\\b`, 'i');
  return content.match(expression)?.[1] || null;
}

export async function validateGeneratedProjectContracts(params: {
  macroId: AiMacroId;
  validationRoot: string;
  selectedSources: VhdlSourceDescriptor[];
  topEntities: string[];
  architectProject?: FpgaArchitectProject | null;
}) {
  const findings: GeneratedVhdlFailureDetail[] = [];
  const sourceContents = await readSourceContentsMap(params.validationRoot, params.selectedSources);
  const architectProject = params.architectProject || null;
  const isArchitect = params.macroId === 'fpga_vhdl_architect';

  const synthesizedArchitectRunCommands = architectProject
    ? buildDeterministicArchitectGhdlRunCommands({
      analysisOrder: architectProject.ghdl.analysisOrder || [],
      topTestbench: architectProject.ghdl.topTestbench || '',
      vhdlStandard: architectProject.vhdlStandard,
    })
    : [];
  const effectiveArchitectRunCommands = architectProject
    ? ((architectProject.ghdl.runCommands && architectProject.ghdl.runCommands.length > 0)
      ? architectProject.ghdl.runCommands
      : synthesizedArchitectRunCommands)
    : [];

  const explicitStandardTokens = effectiveArchitectRunCommands
    .flatMap((command) => Array.from(command.matchAll(/--std=([0-9a-z]+)/gi)).map((match) => match[1].toLowerCase()));
  if (explicitStandardTokens.length > 0) {
    const uniqueStandards = Array.from(new Set(explicitStandardTokens));
    if (uniqueStandards.length > 1 || uniqueStandards.some((value) => value !== '08')) {
      findings.push(createFailureDetail({
        code: 'mixed_vhdl_standard_group',
        category: 'mixed_vhdl_standard_group',
        message:
          `Generated command plan mixes unsupported VHDL standard groups (${uniqueStandards.join(', ')}). ` +
          `Use one standard consistently across analyze/elaborate/run, defaulting to --std=08 unless the user explicitly requested otherwise.`,
        forbiddenConstruct: `mixed or non-default GHDL standards: ${uniqueStandards.join(', ')}`,
        legalReplacementPattern: 'use one coherent --std=08 command plan across analyze, elaborate, and run',
      }));
    }
  }

  if (isArchitect) {
    const runCommands = effectiveArchitectRunCommands;
    const analysisOrder = architectProject?.ghdl.analysisOrder || [];
    if (
      runCommands.length === 0
      || !runCommands.some((command) => /\bghdl\b/i.test(command) && /\s-a\b/.test(command))
      || !runCommands.some((command) => /\bghdl\b/i.test(command) && /\s-(e|m)\b/.test(command))
      || !runCommands.some((command) => /\bghdl\b/i.test(command) && /\s-r\b/.test(command))
    ) {
      findings.push(createFailureDetail({
        code: 'missing_ghdl_command_contract',
        category: 'missing_ghdl_command_contract',
        message:
          'The generated GHDL command contract is incomplete. FPGA Architect projects must include exact analyze, elaborate, and run commands.',
        forbiddenConstruct: 'missing exact GHDL analyze/elaborate/run command contract',
        legalReplacementPattern: 'provide explicit ghdl -a, ghdl -e, and ghdl -r commands that match the generated sources and top testbench',
      }));
    }

    if (runCommands.length > 0 && !runCommands.some(hasWaveformArgument)) {
      findings.push(createFailureDetail({
        code: 'missing_waveform_generation_contract',
        category: 'missing_waveform_generation_contract',
        message:
          'The generated GHDL run command does not declare an explicit waveform output. Include --vcd=..., --ghw=..., or --fst=... in the runnable command plan.',
        forbiddenConstruct: 'GHDL run command without explicit waveform output argument',
        legalReplacementPattern: 'add --vcd=..., --ghw=..., or --fst=... to the GHDL run command',
      }));
    }

    if (analysisOrder.length === 0) {
      findings.push(createFailureDetail({
        code: 'invalid_source_order_contract',
        category: 'invalid_source_order_contract',
        message:
          'The generated project does not declare an analysis_order source plan. FPGA Architect output must provide a deterministic compile order.',
        forbiddenConstruct: 'missing analysis_order contract',
        legalReplacementPattern: 'declare analysis_order with packages first, package bodies next, RTL leaves before top-level RTL, and TB sources last',
      }));
    } else {
      const normalizedOrder = analysisOrder.map((entry) => normalizeSelectionPath(entry));
      const availableByPath = new Map(params.selectedSources.map((source) => [normalizeSelectionPath(source.path), source]));
      const unresolvedDependencies = normalizedOrder.flatMap((entry, index) => {
        const source = availableByPath.get(entry);
        if (!source) return [];
        const earlierUnits = new Set(
          normalizedOrder.slice(0, index)
            .map((pathKey) => availableByPath.get(pathKey))
            .filter((value): value is VhdlSourceDescriptor => Boolean(value))
            .flatMap((value) => [...value.entities, ...value.packages, ...value.packageBodies])
            .map((value) => value.toLowerCase())
        );
        return source.dependencies
          .filter((dependency) => {
            const providedInternally = params.selectedSources.some((candidate) =>
              candidate.entities.includes(dependency)
              || candidate.packages.includes(dependency)
              || candidate.packageBodies.includes(dependency)
            );
            return providedInternally && !earlierUnits.has(dependency.toLowerCase());
          })
          .map((dependency) => `${source.path} -> ${dependency}`);
      });

      if (unresolvedDependencies.length > 0) {
        findings.push(createFailureDetail({
          code: 'invalid_source_order_contract',
          category: 'invalid_source_order_contract',
          message:
            `The generated analysis_order does not satisfy internal compile dependencies: ${unresolvedDependencies.slice(0, 5).join(', ')}.` +
            ' Packages and provider units must appear before dependent RTL or testbench files.',
          forbiddenConstruct: 'analysis_order with internal dependency inversion',
          legalReplacementPattern: 'reorder analysis_order so providers compile before dependents',
        }));
      }
    }
  }

  const topLevelEntityName = architectProject?.topEntity?.trim().toLowerCase() || null;
  if (topLevelEntityName) {
    const topSource = params.selectedSources.find((source) => source.entities.includes(topLevelEntityName));
    const topContent = topSource ? sourceContents.get(topSource.path) || '' : '';
    const topEntityBlock = topContent ? extractEntityBlock(topContent, topLevelEntityName) : null;
    if (topEntityBlock) {
      const genericBlock = topEntityBlock.match(/\bgeneric\s*\(([\s\S]*?)\)\s*;/i)?.[1] || '';
      for (const segment of genericBlock.split(';').map((value) => value.trim()).filter(Boolean)) {
        const hasDefault = /:=/.test(segment);
        if (!hasDefault) {
          const genericName = segment.match(/^([a-zA-Z][a-zA-Z0-9_]*)/i)?.[1] || segment;
          findings.push(createFailureDetail({
            code: 'top_level_generic_default_missing',
            category: 'top_level_generic_default_missing',
            message:
              `${topSource?.path || topLevelEntityName}: top-level generic "${genericName}" does not declare a default value.` +
              ' Generated top-level entities must make generics simulation-usable by providing defaults.',
            forbiddenConstruct: `top-level generic "${genericName}" without default`,
            legalReplacementPattern: `add a default value using ":=" for generic "${genericName}"`,
          }));
        }
      }

      const portBlock = topEntityBlock.match(/\bport\s*\(([\s\S]*?)\)\s*;/i)?.[1] || '';
      for (const segment of portBlock.split(';').map((value) => value.trim()).filter(Boolean)) {
        const match = segment.match(/^([a-zA-Z][a-zA-Z0-9_,\s]*)\s*:\s*(?:(?:in|out|inout|buffer|linkage)\s+)?(.+)$/i);
        if (!match) continue;
        if (!isTopLevelPortTypeUnconstrained(match[2])) continue;
        const portName = splitIdentifierList(match[1])[0] || match[1];
        findings.push(createFailureDetail({
          code: 'top_level_port_unconstrained',
          category: 'top_level_port_unconstrained',
          message:
            `${topSource?.path || topLevelEntityName}: top-level port "${portName}" uses unconstrained type "${match[2].trim()}". ` +
            'Top-level simulation-apex ports must be constrained directly or through defaulted-generic-driven ranges.',
          forbiddenConstruct: `unconstrained top-level port "${portName}" of type ${match[2].trim()}`,
          legalReplacementPattern: `constrain "${portName}" directly, or constrain it through a generic that itself has a default`,
        }));
      }
    }
  }

  const architectureCounts = new Map<string, number>();
  for (const source of params.selectedSources) {
    const content = sourceContents.get(source.path) || '';
    for (const match of content.matchAll(/\barchitecture\s+[a-zA-Z][a-zA-Z0-9_]*\s+of\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\b/gi)) {
      const key = match[1].toLowerCase();
      architectureCounts.set(key, (architectureCounts.get(key) || 0) + 1);
    }
  }
  for (const [entityName, count] of architectureCounts.entries()) {
    if (count > 1 && params.topEntities.includes(entityName) && !/\([^)]+\)|\./.test(architectProject?.ghdl.topTestbench || '')) {
      findings.push(createFailureDetail({
        code: 'multiple_architecture_elaboration_ambiguity',
        category: 'multiple_architecture_elaboration_ambiguity',
        message:
          `Entity "${entityName}" has multiple generated architectures, but the elaboration target does not name one explicitly.` +
          ' Provide an explicit elaboration target or generate only one architecture for the runnable top.',
        forbiddenConstruct: `multiple architectures for "${entityName}" without explicit elaboration target`,
        legalReplacementPattern: 'either emit one architecture only or make the elaboration target explicit',
      }));
    }
  }

  for (const source of params.selectedSources) {
    const content = sourceContents.get(source.path) || '';
    if (/\buse\s+ieee\.std_logic_textio\.all\s*;/i.test(content)) {
      findings.push(createFailureDetail({
        code: 'unsupported_textio_package_policy',
        category: 'unsupported_textio_package_policy',
        message:
          `${source.path}: uses ieee.std_logic_textio, which is not part of the conservative default GHDL compatibility policy.` +
          ' Prefer std.textio unless std_logic_textio support was explicitly requested and confirmed.',
        forbiddenConstruct: 'ieee.std_logic_textio in generated default flow',
        legalReplacementPattern: 'prefer std.textio or emit std_logic_textio only when explicitly requested',
      }));
    }

    if (source.isTestbench) {
      continue;
    }

    if (/\buse\s+std\.textio\.all\s*;/i.test(content) || /\bstd\.env\./i.test(content) || /\bwait\s+for\b/i.test(content)) {
      findings.push(createFailureDetail({
        code: 'rtl_contains_tb_only_construct',
        category: 'rtl_contains_tb_only_construct',
        message:
          `${source.path}: RTL file contains testbench-only construct(s) such as wait-for timing, TextIO, or std.env usage.` +
          ' Keep these constructs in testbench code only.',
        forbiddenConstruct: 'TB-only construct inside synthesizable RTL file',
        legalReplacementPattern: 'move wait-for, TextIO, and std.env logic into TB files and keep RTL synthesizable',
      }));
    }
    if (/\b(signal|variable)\s+[a-zA-Z0-9_]*clk[a-zA-Z0-9_]*\b[\s\S]{0,120}<=\s*not\s+[a-zA-Z0-9_]+\s*(?:after|;)/i.test(content)) {
      findings.push(createFailureDetail({
        code: 'generated_clock_in_rtl',
        category: 'generated_clock_in_rtl',
        message:
          `${source.path}: appears to generate or toggle a derived clock in RTL.` +
          ' Default generated output must prefer clock-enable style instead of synthesizing logic clocks.',
        forbiddenConstruct: 'derived/generated clock toggle in RTL',
        legalReplacementPattern: 'replace derived clock generation with a clock-enable scheme unless explicit DDR/clock-generation behavior was requested',
      }));
    }

    const risingClockMatches = Array.from(content.matchAll(/\brising_edge\s*\(\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\)/gi)).map((match) => match[1].toLowerCase());
    const fallingClockMatches = Array.from(content.matchAll(/\bfalling_edge\s*\(\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\)/gi)).map((match) => match[1].toLowerCase());
    const mixedClock = risingClockMatches.find((clockName) => fallingClockMatches.includes(clockName));
    if (mixedClock) {
      findings.push(createFailureDetail({
        code: 'mixed_clock_edge_domain',
        category: 'mixed_clock_edge_domain',
        message:
          `${source.path}: mixes rising_edge and falling_edge usage on clock "${mixedClock}" within the same generated file.` +
          ' Keep one active edge per domain unless DDR-style behavior was explicitly requested.',
        forbiddenConstruct: `mixed rising/falling edge use on "${mixedClock}"`,
        legalReplacementPattern: 'use one edge per synchronous domain or document an explicitly requested DDR-style exception',
      }));
    }
  }

  return findings;
}

export async function validateGeneratedVhdlWithGhdl(params: {
  macroId: AiMacroId;
  projectPath: string;
  tbGenerationMode: TbGenerationMode | null;
  artifactDirectory: string | null;
  savedArtifacts: GeneratedVhdlArtifactForValidation[];
  architectProject?: FpgaArchitectProject | null;
}) : Promise<GeneratedVhdlValidationResult> {
  const logs: string[] = [];

  try {
    const { stdout, stderr } = await runCommand('ghdl', ['--version']);
    if (stdout) logs.push(stdout);
    if (stderr) logs.push(stderr);
  } catch (error: any) {
    return buildValidationFailureResult({
      stage: 'unavailable',
      summary: `GHDL is unavailable: ${error?.message || String(error)}`,
      logs,
    });
  }

  if (params.savedArtifacts.length === 0) {
    return buildValidationFailureResult({
      stage: 'prevalidate',
      summary: 'No generated VHDL artifacts were available for GHDL validation.',
      logs,
      failureDetails: [
        createFailureDetail({
          code: 'no_generated_artifacts',
          category: 'source_selection',
          message: 'No generated VHDL artifacts were available for GHDL validation.',
        }),
      ],
    });
  }

  const isArchitect = params.macroId === 'fpga_vhdl_architect';
  const validationRoot = isArchitect
    ? (
        params.architectProject
          ? (
              path.basename(path.resolve(params.projectPath)).toLowerCase() === params.architectProject.sanitizedProjectName.toLowerCase()
                ? params.projectPath
                : path.join(params.projectPath, params.architectProject.sanitizedProjectName)
            )
          : params.projectPath
      )
    : params.projectPath;
  const availableSources = await collectVhdlSources(validationRoot);
  if (availableSources.length === 0) {
    return buildValidationFailureResult({
      stage: 'prevalidate',
      summary: 'No VHDL sources were found for generated-code validation.',
      logs,
      failureDetails: [
        createFailureDetail({
          code: 'no_vhdl_sources_found',
          category: 'source_selection',
          message: 'No VHDL sources were found for generated-code validation.',
        }),
      ],
    });
  }

  const generatedRelativePaths = params.savedArtifacts.map((artifact) => normalizeRelativePath(validationRoot, artifact.path));
  let selectedSourcePaths: string[] = [];
  let topEntities: string[] = [];

  if (isArchitect) {
    selectedSourcePaths = resolveValidationSourceSelection({
      availableSources,
      requestedSourcePaths: params.architectProject?.ghdl.analysisOrder?.length
        ? params.architectProject.ghdl.analysisOrder
        : availableSources.map((source) => source.path),
      fallbackSourcePaths: generatedRelativePaths,
    });
    topEntities = params.architectProject?.ghdl.topTestbench
      ? [params.architectProject.ghdl.topTestbench.trim().toLowerCase()]
      : [];
  } else if (params.macroId === 'generate_vhdl_tb') {
    if (params.tbGenerationMode === 'project_entities') {
      const baseProjectSources = availableSources
        .filter((source) => !/(^|\/)AI Generated (TB|RTL|Assertions)(\/|$)/i.test(source.path))
        .map((source) => source.path);
      selectedSourcePaths = dedupe([...baseProjectSources, ...generatedRelativePaths]);
    } else {
      selectedSourcePaths = dedupe(generatedRelativePaths);
    }
    topEntities = inferArtifactTestbenchEntities({
      projectPath: validationRoot,
      sources: availableSources.filter((source) => selectedSourcePaths.includes(source.path)),
      savedArtifacts: params.savedArtifacts,
    });
  } else {
    selectedSourcePaths = dedupe(generatedRelativePaths);
  }

  const selectedSources = availableSources.filter((source) => selectedSourcePaths.includes(source.path));
  if (selectedSources.length === 0) {
    return buildValidationFailureResult({
      stage: 'prevalidate',
      summary: 'The generated validation source set was empty after selection.',
      logs,
      failureDetails: [
        createFailureDetail({
          code: 'empty_validation_source_set',
          category: 'source_selection',
          message: 'The generated validation source set was empty after selection.',
        }),
      ],
    });
  }

  const contractFindings = await validateGeneratedProjectContracts({
    macroId: params.macroId,
    validationRoot,
    selectedSources,
    topEntities,
    architectProject: params.architectProject,
  });
  if (contractFindings.length > 0) {
    logs.push(...contractFindings.map((detail) => detail.message));
    return buildValidationFailureResult({
      stage: 'prevalidate',
      summary: summarizeFailureDetails(contractFindings),
      logs,
      validatedTopEntities: [],
      failureDetails: contractFindings,
    });
  }

  const antiPatternFindings = await detectKnownVhdlAntiPatternDetails(
    validationRoot,
    selectedSources.map((source) => source.path),
  );
  if (antiPatternFindings.length > 0) {
    logs.push(...antiPatternFindings.map((detail) => detail.message));
    return buildValidationFailureResult({
      stage: 'prevalidate',
      summary: summarizeFailureDetails(antiPatternFindings),
      logs,
      failureDetails: antiPatternFindings,
    });
  }

  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'automata-logicpro-generated-ghdl-'));

  try {
    try {
      await analyzeSelectedSources({
        projectPath: validationRoot,
        outputDir,
        sources: selectedSources,
        logs,
      });
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      logs.push(errorMessage);
      const failureDetails = inferFailureDetailsFromGhdlMessage(errorMessage);
      return buildValidationFailureResult({
        stage: 'analyze',
        summary: errorMessage || 'Generated VHDL did not pass GHDL analysis.',
        logs,
        failureDetails,
      });
    }

    if (topEntities.length === 0) {
      return {
        ok: true,
        stage: 'analyze',
        summary: 'Generated VHDL passed GHDL analysis.',
        logs,
        validatedTopEntities: [],
      };
    }

    const validatedTopEntities: string[] = [];
    for (const topEntity of dedupe(topEntities.map((entity) => entity.trim().toLowerCase()).filter(Boolean))) {
      logs.push(`ghdl -e --std=08 --workdir=${outputDir} ${topEntity}`);
      try {
        const { stdout, stderr } = await runCommand('ghdl', ['-e', '--std=08', `--workdir=${outputDir}`, topEntity], { cwd: outputDir });
        if (stdout) logs.push(stdout);
        if (stderr) logs.push(stderr);
      } catch (error: any) {
        logs.push(error?.message || String(error));
        return buildValidationFailureResult({
          stage: 'elaborate',
          summary: `Generated VHDL failed GHDL elaboration for ${topEntity}: ${error?.message || String(error)}`,
          logs,
          validatedTopEntities,
          failureDetails: [
            createFailureDetail({
              code: 'ghdl_elaborate_failure',
              category: classifyKnownFailureCategory(error?.message || ''),
              message: `Generated VHDL failed GHDL elaboration for ${topEntity}: ${error?.message || String(error)}`,
            }),
          ],
        });
      }

      logs.push(`ghdl -r --std=08 --workdir=${outputDir} ${topEntity} --stop-time=1us`);
      try {
        const { stdout, stderr } = await runCommand('ghdl', ['-r', '--std=08', `--workdir=${outputDir}`, topEntity, '--stop-time=1us'], { cwd: outputDir });
        if (stdout) logs.push(stdout);
        if (stderr) logs.push(stderr);
      } catch (error: any) {
        logs.push(error?.message || String(error));
        return buildValidationFailureResult({
          stage: 'simulate',
          summary: `Generated VHDL failed GHDL simulation for ${topEntity}: ${error?.message || String(error)}`,
          logs,
          validatedTopEntities,
          failureDetails: [
            createFailureDetail({
              code: 'ghdl_simulate_failure',
              category: classifyKnownFailureCategory(error?.message || ''),
              message: `Generated VHDL failed GHDL simulation for ${topEntity}: ${error?.message || String(error)}`,
            }),
          ],
        });
      }

      validatedTopEntities.push(topEntity);
    }

    return {
      ok: true,
      stage: 'simulate',
      summary: `Generated VHDL passed GHDL simulation for ${validatedTopEntities.join(', ')}.`,
      logs,
      validatedTopEntities,
    };
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
}
