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
import { collectProcedureScopeSnapshots } from './vhdlScopeAnalysis';

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
  | 'testbench_structure'
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
  assertionLabel?: string;
  simulationTime?: string;
  instructionSequence?: string[];
  expectedBehavior?: string;
  relatedSourcePaths?: string[];
};

export type GeneratedVhdlArtifactForValidation = {
  fileName: string;
  path: string;
  kind: ArtifactKind;
};

export type GeneratedVhdlRepairAuditEntry = {
  repairAttempt: number;
  failureCode: string | null;
  fileLine: string | null;
  repairType: 'deterministic' | 'deterministic_skipped' | 'llm' | 'llm_then_deterministic' | 'llm_no_change';
  changedFiles: string[];
  postRepairValidation: {
    ok: boolean;
    stage: GeneratedVhdlValidationResult['stage'];
    failureCode: string | null;
    summary: string;
  };
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
  repairAudit?: GeneratedVhdlRepairAuditEntry[];
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

function lineNumberForIndex(content: string, index: number) {
  return content.slice(0, Math.max(0, index)).split(/\r\n|\r|\n/).length;
}

function isIndexInsideLineComment(content: string, index: number) {
  const lineStart = content.lastIndexOf('\n', Math.max(0, index - 1)) + 1;
  const commentIndex = content.indexOf('--', lineStart);
  return commentIndex >= 0 && commentIndex < index;
}

function isIndexInsideDoubleQuotedString(content: string, index: number) {
  const lineStart = content.lastIndexOf('\n', Math.max(0, index - 1)) + 1;
  let inString = false;
  for (let offset = lineStart; offset < index; offset += 1) {
    if (content[offset] !== '"') continue;
    if (content[offset + 1] === '"') {
      offset += 1;
      continue;
    }
    inString = !inString;
  }
  return inString;
}

function lineTextForIndex(content: string, index: number) {
  const lineStart = content.lastIndexOf('\n', Math.max(0, index - 1)) + 1;
  const nextLine = content.indexOf('\n', index);
  const lineEnd = nextLine >= 0 ? nextLine : content.length;
  return content.slice(lineStart, lineEnd).trim();
}

function collectMalformedCharacterLiterals(content: string) {
  const issues: Array<{
    lineHint: number;
    badText: string;
    replacement: string;
    lineText: string;
  }> = [];
  const cleanContent = stripVhdlComments(content);
  const expression = /'([01])(?=\s*[);,])/g;

  for (const match of cleanContent.matchAll(expression)) {
    if (match.index == null || isIndexInsideDoubleQuotedString(cleanContent, match.index)) continue;
    const badText = match[0];
    const replacement = `'${match[1]}'`;
    issues.push({
      lineHint: lineNumberForIndex(cleanContent, match.index),
      badText,
      replacement,
      lineText: lineTextForIndex(cleanContent, match.index),
    });
  }

  return issues;
}

function findClosingParen(content: string, openParenIndex: number) {
  let depth = 0;
  for (let index = openParenIndex; index < content.length; index += 1) {
    const char = content[index];
    if (char === '"' && !isIndexInsideDoubleQuotedString(content, index)) {
      index += 1;
      while (index < content.length) {
        if (content[index] === '"' && content[index + 1] === '"') {
          index += 2;
          continue;
        }
        if (content[index] === '"') break;
        index += 1;
      }
      continue;
    }
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function collectIncompleteSubprogramInterfaces(content: string) {
  const issues: Array<{
    kind: 'function' | 'procedure';
    name: string;
    lineHint: number;
    illegalToken: string;
    excerpt: string;
  }> = [];
  const cleanContent = stripVhdlComments(content);
  const startExpression = /\b(function|procedure)\s+([a-zA-Z][a-zA-Z0-9_]*)\s*\(/gi;
  const executableBeforeClosedInterface =
    /^\s*(report|if|wait|assert|begin|process|for|while)\b|^\s*[a-zA-Z][a-zA-Z0-9_]*(?:\s*\([^)]*\))?\s*(?:<=|:=)/im;

  for (const match of cleanContent.matchAll(startExpression)) {
    if (match.index == null) continue;
    const kind = match[1].toLowerCase() as 'function' | 'procedure';
    const name = match[2];
    const openParenIndex = match.index + match[0].lastIndexOf('(');
    const closeParenIndex = findClosingParen(cleanContent, openParenIndex);
    const searchEnd = closeParenIndex >= 0
      ? closeParenIndex
      : (() => {
          const endMatch = /\bend\s+(?:function|procedure)\b/i.exec(cleanContent.slice(openParenIndex));
          return endMatch?.index == null ? Math.min(cleanContent.length, openParenIndex + 2000) : openParenIndex + endMatch.index;
        })();
    const interfaceText = cleanContent.slice(openParenIndex + 1, searchEnd);
    const illegalMatch = executableBeforeClosedInterface.exec(interfaceText);
    if (!illegalMatch || illegalMatch.index == null) continue;

    const illegalIndex = openParenIndex + 1 + illegalMatch.index;
    issues.push({
      kind,
      name,
      lineHint: lineNumberForIndex(cleanContent, illegalIndex),
      illegalToken: illegalMatch[1] || illegalMatch[0].trim().split(/\s+/)[0] || 'statement',
      excerpt: lineTextForIndex(cleanContent, illegalIndex),
    });
  }

  return issues;
}

function collectIllegalOthersAggregateComparisons(content: string) {
  const issues: Array<{
    lineHint: number;
    expression: string;
    objectName: string;
    bit: string;
  }> = [];
  const cleanContent = stripVhdlComments(content);
  const expression = /\b([a-zA-Z][a-zA-Z0-9_]*)\s*(=|\/=)\s*\(\s*others\s*=>\s*'([01])'\s*\)/gi;

  for (const match of cleanContent.matchAll(expression)) {
    if (match.index == null || isIndexInsideDoubleQuotedString(cleanContent, match.index)) continue;
    issues.push({
      lineHint: lineNumberForIndex(cleanContent, match.index),
      expression: match[0],
      objectName: match[1],
      bit: match[3],
    });
  }

  return issues;
}

function collectCommaSeparatedPackedVectorSubtypes(content: string) {
  const issues: Array<{
    lineHint: number;
    expression: string;
    typeName: string;
  }> = [];
  const cleanContent = stripVhdlComments(content);
  const expression = /\b(std_logic_vector|unsigned|signed)\s*\(([^()\n;]*\bdownto\b[^()\n;]*,[^()\n;]*\bdownto\b[^()\n;]*)\)/gi;

  for (const match of cleanContent.matchAll(expression)) {
    if (match.index == null || isIndexInsideDoubleQuotedString(cleanContent, match.index)) continue;
    issues.push({
      lineHint: lineNumberForIndex(cleanContent, match.index),
      expression: match[0],
      typeName: match[1],
    });
  }

  return issues;
}

function collectDeclaredObjectNames(content: string, declarationKind: 'signal' | 'variable') {
  const names = new Set<string>();
  const declarationExpression = new RegExp(`\\b${declarationKind}\\s+([^:;]+)\\s*:`, 'gi');
  for (const match of content.matchAll(declarationExpression)) {
    const declarationList = match[1] || '';
    for (const rawName of declarationList.split(',')) {
      const name = rawName.trim().match(/^([a-zA-Z][a-zA-Z0-9_]*)$/)?.[1];
      if (name) names.add(name.toLowerCase());
    }
  }
  return names;
}

function collectStatementLevelAssignmentOperatorMisuse(content: string) {
  const cleanContent = stripVhdlComments(content);
  const declaredVariables = collectDeclaredObjectNames(cleanContent, 'variable');
  const declaredSignals = collectDeclaredObjectNames(cleanContent, 'signal');
  const findings: Array<{
    code: 'variable_assigned_with_signal_operator' | 'signal_assigned_with_variable_operator';
    name: string;
    operator: '<=' | ':=';
    lineHint: number;
    statement: string;
  }> = [];

  const lines = cleanContent.split(/\r\n|\r|\n/);
  for (const [lineIndex, rawLine] of lines.entries()) {
    const statement = rawLine.trim();
    const assignmentMatch = statement.match(/^([a-zA-Z][a-zA-Z0-9_]*)(?:\s*\([^)]*\))?\s*(<=|:=)\s*.+;?\s*$/);
    if (!assignmentMatch) continue;

    const name = assignmentMatch[1];
    const normalizedName = name.toLowerCase();
    const operator = assignmentMatch[2] as '<=' | ':=';
    if (operator === '<=' && declaredVariables.has(normalizedName)) {
      findings.push({
        code: 'variable_assigned_with_signal_operator',
        name,
        operator,
        lineHint: lineIndex + 1,
        statement,
      });
    } else if (operator === ':=' && declaredSignals.has(normalizedName)) {
      findings.push({
        code: 'signal_assigned_with_variable_operator',
        name,
        operator,
        lineHint: lineIndex + 1,
        statement,
      });
    }
  }

  return findings;
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

function maskVhdlCommentsAndStrings(content: string) {
  let result = '';
  let index = 0;

  while (index < content.length) {
    const current = content[index];
    const next = content[index + 1];

    if (current === '-' && next === '-') {
      while (index < content.length && content[index] !== '\n') {
        result += ' ';
        index += 1;
      }
      continue;
    }

    if (current === '"') {
      result += ' ';
      index += 1;
      while (index < content.length) {
        const char = content[index];
        if (char === '"') {
          result += ' ';
          index += 1;
          break;
        }
        result += char === '\n' ? '\n' : ' ';
        index += 1;
      }
      continue;
    }

    result += current;
    index += 1;
  }

  return result;
}

type VhdlScopeKind = 'architecture' | 'process' | 'function' | 'procedure';

type VhdlToken = {
  lower: string;
  raw: string;
  index: number;
};

type ExecutableRegionDeclarationFinding = {
  kind: string;
  name: string;
};

type ArchitectureVariableFinding = {
  name: string;
  subtype: string;
};

function tokenizeVhdlStructure(content: string): VhdlToken[] {
  const masked = maskVhdlCommentsAndStrings(content);
  return Array.from(masked.matchAll(/\b[a-zA-Z][a-zA-Z0-9_]*\b|:=|<=|=>|[():;,.]/g)).map((match) => ({
    lower: match[0].toLowerCase(),
    raw: match[0],
    index: match.index ?? 0,
  }));
}

function collectExecutableRegionFindings(content: string) {
  const trackedScopeKinds = new Set<VhdlScopeKind>(['architecture', 'process', 'function', 'procedure']);
  const declarationKinds = new Set(['type', 'subtype', 'procedure', 'function', 'constant']);
  const signalFindings: string[] = [];
  const declarationFindings: ExecutableRegionDeclarationFinding[] = [];
  const architectureVariableFindings: ArchitectureVariableFinding[] = [];
  const seenSignals = new Set<string>();
  const seenDeclarations = new Set<string>();
  const seenArchitectureVariables = new Set<string>();
  const tokens = tokenizeVhdlStructure(content);
  const scopeStack: Array<{ kind: VhdlScopeKind; beginSeen: boolean }> = [];
  let pendingArchitecture = false;
  let pendingSubprogram: { kind: 'function' | 'procedure'; parenthesisDepth: number } | null = null;

  const pushDeclarationFinding = (kind: string, name: string) => {
    const signature = `${kind}:${name.toLowerCase()}`;
    if (seenDeclarations.has(signature)) return;
    seenDeclarations.add(signature);
    declarationFindings.push({ kind, name });
  };

  const pushSignalFinding = (name: string) => {
    const signature = name.toLowerCase();
    if (seenSignals.has(signature)) return;
    seenSignals.add(signature);
    signalFindings.push(name);
  };

  const findNextIdentifierBeforeSemicolon = (startIndex: number) => {
    for (let cursor = startIndex; cursor < tokens.length; cursor += 1) {
      const token = tokens[cursor];
      if (token.lower === ';') return null;
      if (/^[a-z]/i.test(token.raw)) return token.raw;
    }
    return null;
  };

  const extractStatementTextFromToken = (startIndex: number) => {
    const startToken = tokens[startIndex];
    if (!startToken) {
      return '';
    }
    for (let cursor = startIndex; cursor < tokens.length; cursor += 1) {
      if (tokens[cursor].lower !== ';') {
        continue;
      }
      const statementEnd = tokens[cursor].index + tokens[cursor].raw.length;
      return content.slice(startToken.index, statementEnd);
    }
    return content.slice(startToken.index);
  };

  const pushArchitectureVariableFindings = (startIndex: number) => {
    const statement = extractStatementTextFromToken(startIndex);
    const declarationMatch = statement.match(/\bvariable\s+([^:;]+?)\s*:\s*([^;:=\n]+(?:\([^;\n]*\))?)/i);
    if (!declarationMatch) {
      return;
    }

    const variableNames = splitIdentifierList(declarationMatch[1]);
    const subtype = declarationMatch[2].trim();
    for (const variableName of variableNames) {
      const signature = variableName.toLowerCase();
      if (seenArchitectureVariables.has(signature)) {
        continue;
      }
      seenArchitectureVariables.add(signature);
      architectureVariableFindings.push({
        name: variableName,
        subtype,
      });
    }
  };

  const subprogramHasBody = (startIndex: number) => {
    let parenthesisDepth = 0;
    for (let cursor = startIndex + 1; cursor < tokens.length; cursor += 1) {
      const token = tokens[cursor];
      if (token.lower === '(') {
        parenthesisDepth += 1;
        continue;
      }
      if (token.lower === ')') {
        parenthesisDepth = Math.max(0, parenthesisDepth - 1);
        continue;
      }
      if (token.lower === ';' && parenthesisDepth === 0) return false;
      if (token.lower === 'is') return true;
    }
    return false;
  };

  const popScopeByKind = (kind: VhdlScopeKind) => {
    for (let cursor = scopeStack.length - 1; cursor >= 0; cursor -= 1) {
      if (scopeStack[cursor].kind === kind) {
        scopeStack.splice(cursor, 1);
        return;
      }
    }
  };

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const previous = index > 0 ? tokens[index - 1] : null;
    const topScope = scopeStack.at(-1) ?? null;

    if (pendingArchitecture && token.lower === 'is') {
      scopeStack.push({ kind: 'architecture', beginSeen: false });
      pendingArchitecture = false;
      continue;
    }
    if (pendingArchitecture && token.lower === ';') {
      pendingArchitecture = false;
    }

    if (pendingSubprogram) {
      if (token.lower === '(') {
        pendingSubprogram.parenthesisDepth += 1;
      } else if (token.lower === ')') {
        pendingSubprogram.parenthesisDepth = Math.max(0, pendingSubprogram.parenthesisDepth - 1);
      }
      if (token.lower === 'is') {
        scopeStack.push({ kind: pendingSubprogram.kind, beginSeen: false });
        pendingSubprogram = null;
        continue;
      }
      if (token.lower === ';' && pendingSubprogram.parenthesisDepth === 0) {
        pendingSubprogram = null;
      }
      if (pendingSubprogram) {
        continue;
      }
    }

    if (token.lower === 'begin' && topScope && !topScope.beginSeen) {
      topScope.beginSeen = true;
      continue;
    }

    if (token.lower === 'end') {
      let matchedKind: VhdlScopeKind | null = null;
      for (let cursor = index + 1; cursor < tokens.length; cursor += 1) {
        const lookahead = tokens[cursor];
        if (lookahead.lower === ';') break;
        if (trackedScopeKinds.has(lookahead.lower as VhdlScopeKind)) {
          matchedKind = lookahead.lower as VhdlScopeKind;
          break;
        }
      }
      if (matchedKind) {
        popScopeByKind(matchedKind);
      }
      continue;
    }

    if (token.lower === 'architecture' && previous?.lower !== 'end') {
      pendingArchitecture = true;
      continue;
    }

    if (token.lower === 'process' && previous?.lower !== 'end') {
      scopeStack.push({ kind: 'process', beginSeen: false });
      continue;
    }

    if ((token.lower === 'procedure' || token.lower === 'function') && previous?.lower !== 'end') {
      const declarationName = findNextIdentifierBeforeSemicolon(index + 1);
      if (topScope?.beginSeen && declarationName) {
        pushDeclarationFinding(token.lower, declarationName);
      }
      if (declarationName && subprogramHasBody(index)) {
        pendingSubprogram = {
          kind: token.lower as 'function' | 'procedure',
          parenthesisDepth: 0,
        };
      }
      continue;
    }

    if (token.lower === 'variable' && topScope?.kind === 'architecture' && !topScope.beginSeen) {
      pushArchitectureVariableFindings(index);
      continue;
    }

    if (token.lower === 'signal' && topScope?.beginSeen) {
      const signalName = findNextIdentifierBeforeSemicolon(index + 1);
      if (signalName) {
        pushSignalFinding(signalName);
      }
      continue;
    }

    if (declarationKinds.has(token.lower) && token.lower !== 'procedure' && token.lower !== 'function' && topScope?.beginSeen) {
      const declarationName = findNextIdentifierBeforeSemicolon(index + 1);
      if (declarationName) {
        pushDeclarationFinding(token.lower, declarationName);
      }
    }
  }

  return {
    declarations: declarationFindings,
    signals: signalFindings,
    architectureVariables: architectureVariableFindings,
  };
}

function collectExecutableRegionDeclarations(content: string) {
  return collectExecutableRegionFindings(content).declarations;
}

function collectExecutableRegionSignalDeclarations(content: string) {
  return collectExecutableRegionFindings(content).signals;
}

function collectArchitectureBodyVariables(content: string) {
  return collectExecutableRegionFindings(content).architectureVariables;
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
  assertionLabel?: string;
  simulationTime?: string;
  instructionSequence?: string[];
  expectedBehavior?: string;
  relatedSourcePaths?: string[];
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
    assertionLabel: params.assertionLabel,
    simulationTime: params.simulationTime,
    instructionSequence: params.instructionSequence,
    expectedBehavior: params.expectedBehavior,
    relatedSourcePaths: params.relatedSourcePaths,
  };
}

function extractAssertionLabel(assertionText: string) {
  const failLabel = assertionText.match(/\bFAIL[:\s]+([a-zA-Z][a-zA-Z0-9_]*)/i)?.[1];
  if (failLabel) return failLabel;
  const firstToken = assertionText.match(/\b([a-zA-Z][a-zA-Z0-9_]*(?:_[a-zA-Z0-9]+)+)\b/)?.[1];
  return firstToken || null;
}

function inferExpectedBehaviorFromAssertionLabel(label: string | null, assertionText: string) {
  const source = `${label || ''} ${assertionText}`.toLowerCase();
  if (/\b(add|sub|and|or|xor|not|sll|srl|shl|shr)[_\s-]*(carry|overflow|zero|flag)\b/.test(source)
    || /\b(carry|overflow|zero|flag)[_\s-]*(add|sub|and|or|xor|not|sll|srl|shl|shr)\b/.test(source)) {
    return 'ALU flag behavior must match the self-checking expectation. ADD carry must be computed from a widened carry-out bit, not from comparing the truncated result against an operand.';
  }
  if (/\b(add|sub|and|or|xor|not|sll|srl|shl|shr)[_\s-]*(result|res|output|value)\b/.test(source)
    || /\b(result|res|output|value)[_\s-]*(add|sub|and|or|xor|not|sll|srl|shl|shr)\b/.test(source)) {
    return 'ALU result behavior must match the operation golden model at the reported simulation time.';
  }
  if (/halt/.test(source)) {
    return 'CPU halt/control behavior must match the self-checking halt-cycle expectation at the reported simulation time.';
  }
  if (/\bpc\b|program_counter|fetch/.test(source)) {
    return 'Program-counter/fetch sequencing must match the self-checking expectation at the reported simulation time.';
  }
  if (/\bdm_we\b|\bwe\b|write[-_\s]?enable|control|decode|opcode/.test(source)) {
    return 'CPU decode/control write-enable behavior must match the self-checking expectation at the reported simulation time.';
  }
  if (/\breg|register|writeback/.test(source)) {
    return 'Register/writeback behavior must match the self-checking expectation at the reported simulation time.';
  }
  if (/valid|ready|done|enable/.test(source)) {
    return 'Handshake/status timing must match the self-checking expectation at the reported simulation time.';
  }
  return null;
}

function isCpuHaltAssertion(label: string | null, assertionText: string) {
  return /\bhalt(?:_cycle)?(?:_\d+)?\b/i.test(`${label || ''} ${assertionText}`);
}

function classifyCpuBehaviorAssertion(label: string | null, assertionText: string) {
  const source = `${label || ''} ${assertionText}`.toLowerCase();
  if (/\bhalt(?:_cycle)?(?:_\d+)?\b/.test(source)) return 'cpu_halt_behavior_mismatch';
  if (/\breset\b.*\bpc\b|\bpc\b.*\breset\b/.test(source)) return 'cpu_reset_pc_behavior_mismatch';
  if (/\bfetch\b|\bpc\b|program_counter/.test(source)) return 'cpu_fetch_sequence_mismatch';
  if (/\bdm_we\b|\bwe\b|write[-_\s]?enable|control|decode|opcode/.test(source)) return 'cpu_control_signal_behavior_mismatch';
  return null;
}

function classifyAluBehaviorAssertion(label: string | null, assertionText: string) {
  const source = `${label || ''} ${assertionText}`.toLowerCase();
  const opPattern = '(add|sub|and|or|xor|not|sll|srl|shl|shr)';
  const flagPattern = '(carry|overflow|zero|flag)';
  if (
    new RegExp(`\\b${opPattern}[_\\s-]*${flagPattern}\\b`).test(source)
    || new RegExp(`\\b${flagPattern}[_\\s-]*${opPattern}\\b`).test(source)
  ) {
    return 'alu_flag_behavior_mismatch';
  }
  if (
    new RegExp(`\\b${opPattern}[_\\s-]*(result|res|output|value)\\b`).test(source)
    || new RegExp(`\\b(result|res|output|value)[_\\s-]*${opPattern}\\b`).test(source)
  ) {
    return 'alu_result_behavior_mismatch';
  }
  return null;
}

function buildSimulationAssertionDetailsFromGhdlMessage(message: string) {
  const details: GeneratedVhdlFailureDetail[] = [];
  const assertionLinePattern = /([^\n:]+\.vhdl?):(\d+):(\d+):@([^:\n]+):\((?:assertion failure|report error|report failure)\):\s*([^\n]+)/gi;

  for (const match of message.matchAll(assertionLinePattern)) {
    const sourcePath = match[1];
    const lineHint = Number.parseInt(match[2], 10);
    const timeText = match[4].trim();
    const assertionText = match[5].trim();
    const assertionLabel = extractAssertionLabel(assertionText);
    if (/expected\s+'?[01]'?\s+got\s+'?[UXZW-]'?/i.test(assertionText) || /got\s+'?[UXZW-]'?/i.test(assertionText)) {
      continue;
    }
    const expectedActual = assertionText.match(/\bexpected\s+(.+?)\s+but\s+got\s+(.+)$/i);
    const aluBehaviorCode = classifyAluBehaviorAssertion(assertionLabel, assertionText);
    const cpuBehaviorCode = classifyCpuBehaviorAssertion(assertionLabel, assertionText);
    const code = aluBehaviorCode || cpuBehaviorCode
      ? (aluBehaviorCode || cpuBehaviorCode)!
      : expectedActual
      ? 'simulation_assertion_expected_actual_mismatch'
      : /valid|ready|enable|done|empty|full/i.test(assertionText)
        ? 'simulation_valid_latency_mismatch'
        : 'ghdl_simulate_failure';
    const legalReplacementPattern = expectedActual
      ? `repair the existing RTL/TB logic so the value at ${timeText} matches expected ${expectedActual[1].trim()} instead of actual ${expectedActual[2].trim()}; do not delete, weaken, or rename the assertion`
      : aluBehaviorCode
        ? `repair the ALU result/flag logic so the assertion is true at ${timeText}; for ADD carry, compute the widened carry-out bit from DATA_WIDTH+1 arithmetic instead of comparing the truncated result to an operand; do not delete, weaken, skip, rename, or silence the assertion`
      : cpuBehaviorCode
        ? `repair the CPU reset/fetch/halt/control decoder/TB timing contract so the assertion is true at ${timeText}; do not delete, weaken, skip, rename, or silence the assertion`
      : `repair the existing RTL/TB timing or handshake behavior that triggers this assertion at ${timeText}; do not delete, weaken, or rename the assertion`;
    const expectedBehavior = inferExpectedBehaviorFromAssertionLabel(assertionLabel, assertionText);

    details.push(createFailureDetail({
      code,
      category: 'simulation_success',
      message: `${sourcePath}:${lineHint}: assertion failed at ${timeText}: ${assertionText}`,
      relativePath: sourcePath,
      lineHint,
      forbiddenConstruct: `self-checking assertion/report failure at ${timeText}: ${assertionText}`,
      legalReplacementPattern,
      assertionLabel: assertionLabel || undefined,
      simulationTime: timeText,
      expectedBehavior: expectedBehavior || undefined,
      relatedSourcePaths: aluBehaviorCode
        ? ['src/alu_pkg.vhd', 'src/alu.vhd', 'tb/tb_alu.vhd']
        : cpuBehaviorCode
        ? ['src/cpu_pkg.vhd', 'src/mini_cpu_pkg.vhd', 'src/decoder.vhd', 'src/control_fsm.vhd', 'src/cpu_top.vhd', 'src/mini_cpu_top.vhd', 'src/program_counter.vhd', 'src/alu.vhd']
        : undefined,
    }));
  }

  return details;
}

function summarizeFailureDetails(details: GeneratedVhdlFailureDetail[]) {
  return details.map((detail) => detail.message).join('\n');
}

export function inferFailureDetailsFromGhdlMessage(message: string): GeneratedVhdlFailureDetail[] {
  const details: GeneratedVhdlFailureDetail[] = [];
  const push = (params: Parameters<typeof createFailureDetail>[0]) => {
    details.push(createFailureDetail(params));
  };

  details.push(...buildSimulationAssertionDetailsFromGhdlMessage(message));

  if (/unit\s+".*"\s+not\s+found\s+in\s+library\s+"work"|unresolved work units/i.test(message)) {
    push({
      code: 'unresolved_work_unit',
      category: 'unresolved_work_unit',
      message,
      forbiddenConstruct: 'reference to a work unit that was not compiled into the active work library',
      legalReplacementPattern: 'compile the dependency first and keep analysis_order so every package/entity is analyzed before the dependent file',
    });
  }

  if (
    /metavalue detected|returning FALSE|returning 0/i.test(message)
    || /expected\s+'[01]'\s+got\s+'[UXZW-]'/i.test(message)
    || /got\s+'[UXZW-]'/i.test(message)
  ) {
    push({
      code: 'simulation_unknown_metavalue',
      category: 'simulation_success',
      message,
      forbiddenConstruct: 'simulation checks observe U/X/Z/W/- values, numeric_std metavalue conversions, or outputs checked before deterministic reset/default initialization',
      legalReplacementPattern:
        'initialize every RTL output/state register on reset, provide deterministic combinational defaults before every branch, hold TB reset long enough, wait at least one full clock after reset release before checking outputs, and guard or avoid to_integer on vectors that may contain unknown values',
    });
  }

  const conditionalAssignmentOperator = message.match(/\bif\s+([^\n;]*?\b([a-zA-Z][a-zA-Z0-9_]*)\s*:=\s*([^\s;]+)[^\n;]*?)\s+then\b/i);
  if (conditionalAssignmentOperator) {
    push({
      code: 'conditional_assignment_operator_misuse',
      category: 'signal_variable_assignment_misuse',
      message,
      forbiddenConstruct: `condition "${conditionalAssignmentOperator[1].trim()}" contains "${conditionalAssignmentOperator[2]} := ${conditionalAssignmentOperator[3]}"`,
      legalReplacementPattern: `replace "${conditionalAssignmentOperator[2]} := ${conditionalAssignmentOperator[3]}" with a comparison such as "${conditionalAssignmentOperator[2]} <= ${conditionalAssignmentOperator[3]}" for upper-bound checks or "${conditionalAssignmentOperator[2]} = ${conditionalAssignmentOperator[3]}" for equality checks`,
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

  if (/declaration of variable ".*" with unconstrained array type "string" is not allowed/i.test(message)) {
    push({
      code: 'tb_unconstrained_string_variable',
      category: 'declaration_scope',
      message,
      forbiddenConstruct: 'unconstrained local string variable declaration in generated VHDL/testbench code',
      legalReplacementPattern:
        'replace the mutable unconstrained string variable with a direct report literal, a legal constant with an explicit bound, or a helper contract that does not require a mutable string variable',
    });
  }

  if (/no choices for\s+\d+\s+to\s+\d+|no choices for\s+\d+\s+downto\s+\d+/i.test(message)) {
    push({
      code: 'incomplete_array_aggregate_choices',
      category: 'array_subtype_misuse',
      message,
      forbiddenConstruct: 'fixed-range array aggregate missing explicit choices or an others choice',
      legalReplacementPattern:
        'complete the aggregate with every explicit index or add a safe "others => <default>" choice matching the array element type',
    });
  }

  if (/no actual for (?:constant|signal|variable)?\s*interface\s+"([^"]+)"/i.test(message)) {
    const missingPort = message.match(/no actual for (?:constant|signal|variable)?\s*interface\s+"([^"]+)"/i)?.[1] || 'unknown';
    push({
      code: 'unconnected_required_input_port',
      category: 'interface_generic_port_syntax',
      message,
      forbiddenConstruct: `port map omitted required input formal "${missingPort}"`,
      legalReplacementPattern:
        `connect "${missingPort}" to a correctly typed actual signal or add a local adapter signal before the port map`,
    });
  }

  if (/no function declarations for operator\s+"="/i.test(message) && /std_logic_vector\s*\(/i.test(message)) {
    push({
      code: 'typed_equality_operand_mismatch',
      category: 'numeric_std_type_discipline',
      message,
      forbiddenConstruct: 'comparison between numeric_std typed object and std_logic_vector(...) expression',
      legalReplacementPattern:
        'compare operands with the same numeric_std type, for example unsigned_signal = to_unsigned(value, unsigned_signal\'length)',
    });
  }

  if (/string length does not match that of anonymous interface|anonymous interface.*string|formal.*string/i.test(message)) {
    push({
      code: 'tb_string_formal_actual_constraint_mismatch',
      category: 'width_literal_mismatch',
      message,
      forbiddenConstruct: 'constrained string helper contract or fixed-width string message path whose actual/formal lengths diverge across calls',
      legalReplacementPattern:
        'use an unconstrained read-only string formal for helper message text, or remove the helper string formal and report literals directly at the call site',
    });
  }

  if (/actual constraints don't match formal ones/i.test(message)) {
    push({
      code: 'typed_port_width_mismatch',
      category: 'numeric_std_type_discipline',
      message,
      forbiddenConstruct: 'port-map actual/formal subtype constraints do not match',
      legalReplacementPattern:
        'connect an object of the exact formal subtype/width, or add a local typed adapter signal with an explicit, legal conversion outside output/inout associations',
    });
  }

  if (
    /interface declaration expected/i.test(message)
    || /variable parameter must be a variable/i.test(message)
    || /formal parameter .* must be a signal/i.test(message)
  ) {
    push({
      code: 'invalid_subprogram_formal_syntax',
      category: 'interface_generic_port_syntax',
      message,
      forbiddenConstruct: 'malformed helper procedure/function formal declaration or signal-vs-variable formal/actual mismatch',
      legalReplacementPattern:
        'rebuild helper formals in canonical VHDL form such as "name : in type", "signal name : out std_logic", or "variable name : inout integer", and keep actual kinds aligned with those formals',
    });
  }

  const missingActualMatch = message.match(/no actual for (?:constant|signal|variable)?\s*interface\s+"([^"]+)"/i);
  if (missingActualMatch) {
    push({
      code: 'subprogram_call_arity_mismatch',
      category: 'interface_generic_port_syntax',
      message,
      forbiddenConstruct: `subprogram call omits required formal interface "${missingActualMatch[1]}"`,
      legalReplacementPattern:
        'make the helper declaration and every call site agree on one exact formal/actual count; remove unused extra formals or add the missing actual where the helper truly needs it',
    });
  }

  const subprogramActualMismatchMatch = message.match(/can't associate "([^"]+)" with (?:constant|signal|variable)?\s*interface "([^"]+)"/i);
  if (subprogramActualMismatchMatch) {
    push({
      code: 'subprogram_actual_type_mismatch',
      category: 'interface_generic_port_syntax',
      message,
      forbiddenConstruct: `actual "${subprogramActualMismatchMatch[1]}" does not match helper formal "${subprogramActualMismatchMatch[2]}"`,
      legalReplacementPattern:
        'align helper formal types with the actuals at every call site; split scalar std_logic helpers from std_logic_vector helpers instead of forcing one unsafe signature',
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

  const unknownPortMapFormal = message.match(/no declaration for "([a-zA-Z][a-zA-Z0-9_]*)"/i);
  const unknownPortMapSymbol = unknownPortMapFormal?.[1]?.toLowerCase() || null;
  if (unknownPortMapFormal && /\bport\s+map\b[\s\S]*=>/i.test(message)) {
    push({
      code: 'unknown_port_map_formal',
      category: 'interface_generic_port_syntax',
      message,
      forbiddenConstruct: `named port-map formal "${unknownPortMapFormal[1]}" is not declared by the instantiated entity/component`,
      legalReplacementPattern: 'inspect the instantiated entity/component declaration and rewrite the port map to use only exact formal port names',
    });
  } else if (unknownPortMapFormal && unknownPortMapSymbol && !BUILTIN_VHDL_TYPE_NAMES.has(unknownPortMapSymbol)) {
    const symbol = unknownPortMapFormal[1];
    push({
      code: 'package_symbol_not_visible',
      category: 'package_type_definition',
      message,
      forbiddenConstruct: `custom type or package symbol "${symbol}" used where it is not visible`,
      legalReplacementPattern:
        `declare/export "${symbol}" in a selected package, import it with use work.<package>.all in the failing file, and analyze that package before the dependent source`,
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

  if (/no overloaded function found matching "to_integer"/i.test(message) && /\bto_integer\s*\(\s*OP_[A-Z0-9_]+\s*\)/i.test(message)) {
    const opcode = message.match(/\bto_integer\s*\(\s*(OP_[A-Z0-9_]+)\s*\)/i)?.[1] || 'OP_*';
    push({
      code: 'enum_opcode_numeric_conversion_misuse',
      category: 'numeric_std_type_discipline',
      message,
      forbiddenConstruct: `numeric conversion to_integer(${opcode}) on opcode/custom symbol`,
      legalReplacementPattern:
        `define ${opcode} as an integer constant or std_logic_vector encoding constant and use that encoding directly; do not pass enum literals through to_integer(...)`,
    });
  }

  const enumChoiceMatch = message.match(/no choice for ([a-zA-Z][a-zA-Z0-9_]*)/i);
  if (enumChoiceMatch) {
    push({
      code: 'enum_case_choice_missing',
      category: 'interface_generic_port_syntax',
      message,
      forbiddenConstruct: `case statement omits enum choice "${enumChoiceMatch[1]}"`,
      legalReplacementPattern:
        `add an explicit when branch for "${enumChoiceMatch[1]}" or add a safe when others branch that preserves the FSM/reset behavior`,
    });
  }

  const nonVectorUnsignedConversion = message.match(/conversion allowed only between closely related types[\s\S]*?\bto_integer\s*\(\s*(unsigned|signed)\s*\(\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\)\s*\)/i);
  if (nonVectorUnsignedConversion) {
    push({
      code: 'unsigned_conversion_on_non_vector',
      category: 'numeric_std_type_discipline',
      message,
      forbiddenConstruct: `to_integer(${nonVectorUnsignedConversion[1].toLowerCase()}(${nonVectorUnsignedConversion[2]})) on a non-vector value`,
      legalReplacementPattern:
        `if "${nonVectorUnsignedConversion[2]}" is already integer/natural, use it directly; if it is already unsigned/signed, call to_integer(${nonVectorUnsignedConversion[2]}); otherwise convert through a correctly typed vector value first`,
    });
  }

  const undeclaredInterfaceConstant = message.match(/no declaration for "([A-Z][A-Z0-9_]*)"/);
  if (undeclaredInterfaceConstant && /\b(?:std_logic_vector|unsigned|signed)\s*\([^)]*\b[A-Z][A-Z0-9_]*\b[^)]*\)/i.test(message)) {
    push({
      code: 'interface_constant_not_visible',
      category: 'interface_generic_port_syntax',
      message,
      forbiddenConstruct: `interface width references undeclared "${undeclaredInterfaceConstant[1]}"`,
      legalReplacementPattern:
        `declare "${undeclaredInterfaceConstant[1]}" as an earlier entity generic with a safe default, import it from a selected package, or replace it with a literal width`,
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

  if (/body of function ".*" does not conform with specification/i.test(message)) {
    push({
      code: 'package_body_signature_mismatch',
      category: 'package_type_definition',
      message,
      forbiddenConstruct: 'package body function header that does not exactly match the package declaration',
      legalReplacementPattern: 'copy the exact function signature from the package declaration into the package body, changing only the trailing ";" into "is"',
    });
  }

  if (/'others' choice not allowed for an aggregate in this context/i.test(message)) {
    push({
      code: 'illegal_others_aggregate_context',
      category: 'width_literal_mismatch',
      message,
      forbiddenConstruct: 'comparison against unqualified aggregate "(others => ...)"',
      legalReplacementPattern: 'qualify the aggregate with the compared object range, for example "signal_name = (signal_name\'range => \'0\')"',
    });
  }

  if (/subtype has more indexes than array subtype "STD_LOGIC_VECTOR"/i.test(message)) {
    push({
      code: 'illegal_multidimensional_logic_vector',
      category: 'array_subtype_misuse',
      message,
      forbiddenConstruct: 'comma-separated multidimensional std_logic_vector/unsigned/signed subtype',
      legalReplacementPattern: 'flatten the object into one dimension or use a named array type declared in a package',
    });
  }

  if (/can't use an in conversion for an out\/buffer interface|conversion expression.*out\/buffer interface/i.test(message)) {
    push({
      code: 'out_port_actual_conversion',
      category: 'interface_generic_port_syntax',
      message,
      forbiddenConstruct: 'type conversion expression used as the actual for an out/buffer port association',
      legalReplacementPattern: 'connect the out/buffer port to a writable signal of the exact formal type, then convert or assign that signal separately outside the port map',
    });
  }

  const missingRecordFieldMatch = message.match(/no element "([^"]+)" in record type "([^"]+)"/i);
  if (missingRecordFieldMatch) {
    push({
      code: 'record_field_not_declared',
      category: 'package_type_definition',
      message,
      forbiddenConstruct: `record field access ".${missingRecordFieldMatch[1]}" on ${missingRecordFieldMatch[2]} even though that field is not declared`,
      legalReplacementPattern: `repair implementation code to use only fields declared by ${missingRecordFieldMatch[2]}; do not invent new record fields in dependent files`,
    });
  }

  const ghdlPortTypeMatch = message.match(/\(type of port "([^"]+)" is ([a-zA-Z][a-zA-Z0-9_]*)\)/i);
  if (
    ghdlPortTypeMatch
    && !/^(?:std_logic|std_logic_vector|unsigned|signed|integer|string)$/i.test(ghdlPortTypeMatch[2])
  ) {
    push({
      code: 'custom_type_port_association_mismatch',
      category: 'package_type_definition',
      message,
      forbiddenConstruct: `actual type does not match custom formal port "${ghdlPortTypeMatch[1]}" of type ${ghdlPortTypeMatch[2]}`,
      legalReplacementPattern: `wire "${ghdlPortTypeMatch[1]}" with a signal declared as ${ghdlPortTypeMatch[2]}, and perform any decoding/conversion before or after the port map`,
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

  if (/\b(?:if|elsif)\s+[a-zA-Z][a-zA-Z0-9_]*\s+in\s+[^;\n]+?\s+to\s+[^;\n]+?\s+then\b/i.test(message)
    || /unexpected token 'in' in a primary/i.test(message)
    || /\(found: 'in'\)/i.test(message)) {
    push({
      code: 'invalid_range_membership_syntax',
      category: 'runtime_bound_risk',
      message,
      forbiddenConstruct: 'invalid VHDL conditional range-membership syntax such as "if idx in 0 to 15 then"',
      legalReplacementPattern: 'rewrite the bounds check as "if idx >= 0 and idx <= 15 then"',
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
  if (/unconstrained array type "string"/i.test(message)) return 'declaration_scope';
  if (/plain architecture-body variable|inside an executable region|outer-scope object|not allowed in the architecture declarative region/i.test(message)) return 'declaration_scope';
  if (/string length does not match that of anonymous interface|anonymous interface.*string|formal.*string/i.test(message)) return 'width_literal_mismatch';
  if (/actual constraints don't match formal ones/i.test(message)) return 'numeric_std_type_discipline';
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
  if (/testbench.*(?:missing dut|does not instantiate|checked signal.*not driven|drives dut output|dut output signal)/i.test(message)) return 'testbench_structure';
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
  | 'string'
  | 'other'
  | `custom:${string}`;

type InterfacePortSignature = {
  type: NormalizedDeclaredType;
  rawType: string;
  mode: 'in' | 'out' | 'inout' | 'buffer' | 'linkage';
};

type RecordTypeSignature = {
  typeName: string;
  fields: Map<string, string>;
  declaration: string;
};

const BUILTIN_VHDL_TYPE_NAMES = new Set([
  'bit',
  'bit_vector',
  'boolean',
  'character',
  'integer',
  'natural',
  'positive',
  'real',
  'severity_level',
  'signed',
  'std_logic',
  'std_logic_vector',
  'std_ulogic',
  'std_ulogic_vector',
  'string',
  'time',
  'unsigned',
]);

function customTypeName(value: string) {
  return `custom:${value.trim().toLowerCase()}` as const;
}

function isCustomDeclaredType(value: NormalizedDeclaredType | null | undefined): value is `custom:${string}` {
  return typeof value === 'string' && value.startsWith('custom:');
}

function formatDeclaredTypeForMessage(value: NormalizedDeclaredType | null | undefined) {
  return isCustomDeclaredType(value) ? value.slice('custom:'.length) : value || 'unknown';
}

function splitIdentifierList(value: string) {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function splitTopLevelArguments(value: string) {
  return splitTopLevelSegments(value, ',');
}

function splitTopLevelSegments(value: string, delimiter: ',' | ';') {
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
    if (char === delimiter && depth === 0) {
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

function findBalancedCloseParen(value: string, openParenIndex: number) {
  let depth = 0;
  for (let index = openParenIndex; index < value.length; index += 1) {
    const char = value[index];
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
}

function collectBalancedKeywordBlocks(content: string, keyword: string) {
  const blocks: Array<{ body: string; index: number; closeIndex: number }> = [];
  const expression = new RegExp(`\\b${keyword}\\s*\\(`, 'gi');
  for (const match of content.matchAll(expression)) {
    const openParenIndex = (match.index ?? 0) + match[0].lastIndexOf('(');
    const closeIndex = findBalancedCloseParen(content, openParenIndex);
    if (closeIndex < 0) continue;
    blocks.push({
      body: content.slice(openParenIndex + 1, closeIndex),
      index: match.index ?? 0,
      closeIndex,
    });
  }
  return blocks;
}

function updateParenDepthForVhdlLine(line: string, initialDepth: number) {
  let depth = initialDepth;
  let inString = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (!inString && char === '-' && next === '-') {
      break;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth = Math.max(0, depth - 1);
    }
  }
  return depth;
}

function findTopLevelInterfaceArrowLine(blockBody: string) {
  let depth = 0;
  for (const line of blockBody.split('\n')) {
    const codeLine = line.replace(/--.*$/, '');
    if (depth === 0 && /^[\t ]*[a-zA-Z][a-zA-Z0-9_]*\s*=>/.test(codeLine)) {
      return line.trim();
    }
    depth = updateParenDepthForVhdlLine(line, depth);
  }
  return null;
}

function collectEntityOrComponentInterfaceRegions(content: string) {
  const regions: Array<{ name: string; body: string }> = [];
  const expression = /\b(entity|component)\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\b/gi;
  for (const match of content.matchAll(expression)) {
    const kind = match[1]?.toLowerCase();
    const name = match[2];
    const startIndex = match.index ?? 0;
    if (!kind || !name) continue;

    const endExpression = new RegExp(`\\bend\\s+(?:${kind}\\s+)?${name}\\s*;|\\bend\\s+${kind}\\s*;`, 'i');
    const remaining = content.slice(startIndex);
    const endMatch = remaining.match(endExpression);
    const endIndex = endMatch?.index == null ? content.length : startIndex + endMatch.index + endMatch[0].length;
    regions.push({
      name,
      body: content.slice(startIndex, endIndex),
    });
  }
  return regions;
}

function collectPortMapInstances(content: string) {
  const instances: Array<{ name: string; associations: string; index: number; associationsIndex: number }> = [];
  const expression =
    /(?:^|\n)\s*[a-zA-Z][a-zA-Z0-9_]*\s*:\s*(?:entity\s+work\.)?(?!(?:in|out|inout|buffer|linkage|signal|variable|constant|unsigned|signed|std_logic|std_logic_vector)\b)([a-zA-Z][a-zA-Z0-9_]*)\b[\s\S]*?\bport\s+map\s*\(/gi;

  for (const match of content.matchAll(expression)) {
    const name = match[1];
    const openParenIndex = (match.index ?? 0) + match[0].lastIndexOf('(');
    const closeIndex = findBalancedCloseParen(content, openParenIndex);
    if (!name || closeIndex < 0) continue;
    instances.push({
      name,
      associations: content.slice(openParenIndex + 1, closeIndex),
      index: match.index ?? 0,
      associationsIndex: openParenIndex + 1,
    });
  }

  return instances;
}

type ParsedPortMapAssociation = {
  formal: string;
  actual: string;
  lineHint: number;
  excerpt: string;
};

function parsePortMapAssociations(content: string, instance: ReturnType<typeof collectPortMapInstances>[number]) {
  const associations: ParsedPortMapAssociation[] = [];
  for (const association of splitTopLevelArguments(instance.associations)) {
    const match = association.match(/^\s*([a-zA-Z][a-zA-Z0-9_]*)\s*=>\s*(.+?)\s*$/i);
    if (!match) continue;
    const associationOffset = instance.associations.indexOf(association);
    const associationIndex = instance.associationsIndex + Math.max(0, associationOffset);
    associations.push({
      formal: match[1],
      actual: match[2].trim(),
      lineHint: lineNumberForIndex(content, associationIndex),
      excerpt: association.trim(),
    });
  }
  return associations;
}

function isSimpleIdentifier(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^([a-zA-Z][a-zA-Z0-9_]*)$/);
  return match?.[1] || null;
}

function collectMalformedSubprogramFormalClauses(content: string) {
  const issues: Array<{
    kind: 'function' | 'procedure';
    name: string;
    clause: string;
  }> = [];

  for (const subprogram of content.matchAll(/\b(function|procedure)\s+([a-zA-Z][a-zA-Z0-9_]*)\s*\(([\s\S]*?)\)\s*(?:return\s+[^;\n]+?(?:\s+is\b|\s*;)|is\b)/gi)) {
    const kind = subprogram[1]?.toLowerCase() as 'function' | 'procedure' | undefined;
    const name = subprogram[2];
    const formals = subprogram[3];
    if (!kind || !name || !formals) continue;

    for (const clause of splitTopLevelSegments(formals, ';')) {
      const normalizedClause = clause.trim();
      if (!normalizedClause) continue;

      if (
        /^(?:in|out|inout|buffer|linkage)\s+[a-zA-Z][a-zA-Z0-9_]*\s*:/i.test(normalizedClause)
        || /^(?:shared\s+)?(?:signal|variable|constant)\s+[a-zA-Z][a-zA-Z0-9_]*\s*:\s*(?:in|out|inout|buffer|linkage)\s+(?:in|out|inout|buffer|linkage)\b/i.test(normalizedClause)
        || /^shared\s+(?:signal|variable|constant)\b/i.test(normalizedClause)
        || /:\s*(?:in|out|inout|buffer|linkage)\s+(?:in|out|inout|buffer|linkage)\b/i.test(normalizedClause)
        || /:\s*(?:signal|variable|constant)\b/i.test(normalizedClause)
        || /^(?:signal|variable|constant)\s+[a-zA-Z][a-zA-Z0-9_]*\s*:\s*(?:signal|variable|constant)\b/i.test(normalizedClause)
      ) {
        issues.push({ kind, name, clause: normalizedClause });
      }
    }
  }

  return issues;
}

type ParsedSubprogramFormalClause = {
  objectClass: 'signal' | 'variable' | 'constant' | null;
  names: string[];
  mode: 'in' | 'out' | 'inout' | 'buffer' | 'linkage' | null;
  subtype: string;
};

function parseSubprogramFormalClause(clause: string): ParsedSubprogramFormalClause | null {
  const match = clause.match(
    /^\s*(?:(signal|variable|constant)\s+)?([a-zA-Z][a-zA-Z0-9_,\s]*)\s*:\s*(?:(in|out|inout|buffer|linkage)\s+)?(.+?)\s*$/i,
  );
  if (!match) {
    return null;
  }

  return {
    objectClass: (match[1]?.toLowerCase() as ParsedSubprogramFormalClause['objectClass']) || null,
    names: splitIdentifierList(match[2]),
    mode: (match[3]?.toLowerCase() as ParsedSubprogramFormalClause['mode']) || null,
    subtype: match[4].trim(),
  };
}

function collectClockEdgeHelperFormalMismatches(content: string) {
  const issues: Array<{
    kind: 'function' | 'procedure';
    name: string;
    formalName: string;
    edgeFunction: 'rising_edge' | 'falling_edge';
    clause: string;
    requiredClause: string;
  }> = [];

  const subprogramPattern =
    /\b(function|procedure)\s+([a-zA-Z][a-zA-Z0-9_]*)\s*\(([\s\S]*?)\)\s*(?:return\s+[^;\n]+?\s+is\b|is\b)([\s\S]*?)end\s+(?:function|procedure)(?:\s+[a-zA-Z][a-zA-Z0-9_]*)?\s*;/gi;

  for (const subprogram of content.matchAll(subprogramPattern)) {
    const kind = subprogram[1]?.toLowerCase() as 'function' | 'procedure' | undefined;
    const name = subprogram[2];
    const formals = subprogram[3];
    const body = subprogram[4];
    if (!kind || !name || !formals || !body) continue;

    const clauses = splitTopLevelSegments(formals, ';');
    const parsedClauses = clauses
      .map((clause) => ({ clause: clause.trim(), parsed: parseSubprogramFormalClause(clause) }))
      .filter((entry) => entry.parsed && entry.clause.length > 0) as Array<{
      clause: string;
      parsed: ParsedSubprogramFormalClause;
    }>;

    const seen = new Set<string>();
    for (const edgeMatch of body.matchAll(/\b(rising_edge|falling_edge)\s*\(\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\)/gi)) {
      const edgeFunction = edgeMatch[1]?.toLowerCase() as 'rising_edge' | 'falling_edge' | undefined;
      const formalName = edgeMatch[2];
      if (!edgeFunction || !formalName) continue;

      const ownerClause = parsedClauses.find((entry) => entry.parsed.names.some((namePart) => namePart.toLowerCase() === formalName.toLowerCase()));
      if (!ownerClause || ownerClause.parsed.objectClass === 'signal') {
        continue;
      }

      const dedupeKey = `${name.toLowerCase()}::${formalName.toLowerCase()}::${edgeFunction}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);

      issues.push({
        kind,
        name,
        formalName,
        edgeFunction,
        clause: ownerClause.clause,
        requiredClause: `signal ${formalName} : in ${ownerClause.parsed.subtype}`,
      });
    }
  }

  return issues;
}

function collectUnsafeTbLogicIndexConversions(params: {
  relativePath: string;
  content: string;
  declaredTypes: Map<string, NormalizedDeclaredType>;
}) {
  const issues: Array<{
    arrayName: string;
    conversionKind: 'unsigned' | 'signed';
    indexIdentifier: string;
    expression: string;
  }> = [];
  const seen = new Set<string>();

  const directIndexPattern =
    /\b([a-zA-Z][a-zA-Z0-9_]*)\s*\(\s*to_integer\s*\(\s*(unsigned|signed)\s*\(\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\)\s*\)\s*\)/gi;

  for (const match of params.content.matchAll(directIndexPattern)) {
    const arrayName = match[1];
    const conversionKind = match[2]?.toLowerCase() as 'unsigned' | 'signed' | undefined;
    const indexIdentifier = match[3];
    if (!arrayName || !conversionKind || !indexIdentifier) continue;

    const declaredType = params.declaredTypes.get(indexIdentifier.toLowerCase());
    if (declaredType !== 'std_logic_vector' && declaredType !== 'std_logic') {
      continue;
    }

    const expression = match[0].trim();
    if (/tb_safe_(?:slv|signed)_to_index\s*\(/i.test(expression)) {
      continue;
    }

    const dedupeKey = `${arrayName.toLowerCase()}::${conversionKind}::${indexIdentifier.toLowerCase()}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    issues.push({
      arrayName,
      conversionKind,
      indexIdentifier,
      expression,
    });
  }

  return issues;
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

function inferActualExpressionTypeForSubprogram(
  actualExpression: string,
  declaredTypes: Map<string, NormalizedDeclaredType>,
): NormalizedDeclaredType | null {
  const trimmed = actualExpression.trim().replace(/^[a-zA-Z][a-zA-Z0-9_]*\s*=>\s*/i, '').trim();
  if (/^'[01UXZWLH-]'$/i.test(trimmed)) return 'std_logic';
  if (/^"(?:[^"]|"")*"$/.test(trimmed) || /^x"[0-9a-f_]*"$/i.test(trimmed)) return 'std_logic_vector';
  if (/^[+-]?\d+$/.test(trimmed)) return 'integer';
  return inferActualExpressionType(trimmed, declaredTypes);
}

function isLikelyTestbenchSource(relativePath: string, content: string) {
  return /(^|\/)(tb|testbench)\//i.test(relativePath)
    || /(^|[_-])(tb|testbench)([_-]|$)/i.test(path.basename(relativePath, path.extname(relativePath)))
    || /\bentity\s+(?:tb_|[a-zA-Z][a-zA-Z0-9_]*_tb\b)/i.test(content);
}

function isLikelyTestbenchEntityName(name: string) {
  return /^tb_/i.test(name) || /_tb$/i.test(name) || /^testbench_/i.test(name);
}

function inferDutCandidateNamesFromTestbench(content: string) {
  const candidates: string[] = [];
  for (const region of collectEntityOrComponentInterfaceRegions(content)) {
    const name = region.name;
    if (/^tb_/i.test(name)) {
      candidates.push(name.replace(/^tb_/i, ''));
    }
    if (/_tb$/i.test(name)) {
      candidates.push(name.replace(/_tb$/i, ''));
    }
    if (/^testbench_/i.test(name)) {
      candidates.push(name.replace(/^testbench_/i, ''));
    }
  }
  return Array.from(new Set(candidates.map((candidate) => candidate.toLowerCase()).filter(Boolean)));
}

function collectCheckHelperObservedArgumentIndexes(content: string) {
  const observedByHelper = new Map<string, Set<number>>();
  const helperDeclarationPattern =
    /\b(?:procedure|function)\s+((?:check|expect|assert_eq)(?:_[a-zA-Z0-9]+)*)\s*\(([\s\S]*?)\)\s*(?:return\s+[^;\n]+?\s+is\b|is\b|;)/gi;

  for (const declaration of content.matchAll(helperDeclarationPattern)) {
    const helperName = declaration[1]?.toLowerCase();
    const formals = declaration[2];
    if (!helperName || !formals) continue;

    const observedIndexes = new Set<number>();
    let parameterIndex = 0;
    for (const segment of splitTopLevelSegments(formals, ';')) {
      const parsed = parseSubprogramFormalClause(segment);
      if (!parsed) continue;
      for (const formalName of parsed.names) {
        const lowerFormalName = formalName.toLowerCase();
        if (
          /^(?:got|actual|observed|observed_value|dut|dut_value|dut_result|result|readback|sampled|measured|value)$/i.test(lowerFormalName)
          || /(?:_got|_actual|_observed|_dut|_result|_readback|_sampled)$/i.test(lowerFormalName)
        ) {
          observedIndexes.add(parameterIndex);
        }
        parameterIndex += 1;
      }
    }

    if (observedIndexes.size > 0) {
      observedByHelper.set(helperName, observedIndexes);
    }
  }

  return observedByHelper;
}

function collectCheckLikeActuals(content: string, declaredTypes: Map<string, NormalizedDeclaredType>) {
  const checked: Array<{ name: string; lineHint: number; excerpt: string }> = [];
  const seen = new Set<string>();
  const checkCallPattern = /\b(check(?:_[a-zA-Z0-9]+)*|expect(?:_[a-zA-Z0-9]+)*|assert_eq(?:_[a-zA-Z0-9]+)*)\s*\(/gi;
  const observedIndexesByHelper = collectCheckHelperObservedArgumentIndexes(content);
  const isBookkeepingActual = (identifier: string, actualIndex: number, actualCount: number) => {
    if (/^(?:failed|fail(?:ed)?|test_failed|has_failed|error_flag|tb_error|pass_count|fail_count|status|done)$/i.test(identifier)) {
      return true;
    }
    return actualIndex === actualCount - 1
      && /(?:fail|error|status|done|pass)/i.test(identifier);
  };

  for (const match of content.matchAll(checkCallPattern)) {
    const helperName = match[1]?.toLowerCase();
    const openParenIndex = (match.index ?? 0) + match[0].lastIndexOf('(');
    const closeIndex = findBalancedCloseParen(content, openParenIndex);
    if (closeIndex < 0) continue;
    const callText = content.slice(match.index ?? 0, closeIndex + 1);
    const lineHint = lineNumberForIndex(content, match.index ?? 0);
    const actuals = splitTopLevelArguments(content.slice(openParenIndex + 1, closeIndex));
    const observedIndexes = helperName ? observedIndexesByHelper.get(helperName) : null;
    for (const [actualIndex, actual] of actuals.entries()) {
      if (observedIndexes && !observedIndexes.has(actualIndex)) {
        continue;
      }
      if (!observedIndexes && actualIndex === 0 && /^["']/.test(actual.trim())) {
        continue;
      }
      if (!observedIndexes && actualIndex > 1 && /(?:expected|expect|exp|golden|ref|reference|fail|status|done)/i.test(actual)) {
        continue;
      }
      const rhs = actual.replace(/^[a-zA-Z][a-zA-Z0-9_]*\s*=>\s*/i, '').trim();
      const identifier = isSimpleIdentifier(rhs);
      if (!identifier || !declaredTypes.has(identifier.toLowerCase())) continue;
      if (isBookkeepingActual(identifier, actualIndex, actuals.length)) continue;
      const key = `${identifier.toLowerCase()}:${lineHint}`;
      if (seen.has(key)) continue;
      seen.add(key);
      checked.push({
        name: identifier,
        lineHint,
        excerpt: callText.replace(/\s+/g, ' ').trim(),
      });
    }
  }

  return checked;
}

function collectSignalAssignments(content: string) {
  const assignments: Array<{ name: string; lineHint: number; excerpt: string }> = [];
  for (const match of content.matchAll(/^\s*([a-zA-Z][a-zA-Z0-9_]*)\s*<=\s*([^;\n]+)\s*;/gm)) {
    assignments.push({
      name: match[1],
      lineHint: lineNumberForIndex(content, match.index ?? 0),
      excerpt: match[0].trim(),
    });
  }
  return assignments;
}

function collectTestbenchDutContractFindings(params: {
  relativePath: string;
  content: string;
  declaredTypes: Map<string, NormalizedDeclaredType>;
  interfaceSignatures: Map<string, InterfaceSignature>;
}) {
  const findings: GeneratedVhdlFailureDetail[] = [];
  if (!isLikelyTestbenchSource(params.relativePath, params.content)) {
    return findings;
  }

  const instances = collectPortMapInstances(params.content)
    .map((instance) => ({
      instance,
      signature: params.interfaceSignatures.get(instance.name.toLowerCase()) || null,
      associations: parsePortMapAssociations(params.content, instance),
    }))
    .filter((entry) => entry.signature && !isLikelyTestbenchEntityName(entry.signature.name));

  const tbCandidateNames = inferDutCandidateNamesFromTestbench(params.content);
  const preferredCandidate = tbCandidateNames
    .map((candidate) => params.interfaceSignatures.get(candidate))
    .find((signature): signature is InterfaceSignature => Boolean(signature))
    || Array.from(params.interfaceSignatures.values())
      .find((signature) => !isLikelyTestbenchEntityName(signature.name) && signature.ports.size > 0)
    || null;

  if (preferredCandidate && instances.length === 0) {
    const legalPorts = Array.from(preferredCandidate.ports.entries())
      .map(([name, signature]) => `${name}:${signature.mode} ${signature.rawType}`)
      .join(', ');
    findings.push(createFailureDetail({
      code: 'testbench_missing_dut_instantiation',
      category: 'testbench_structure',
      relativePath: params.relativePath,
      lineHint: 1,
      message:
        `${params.relativePath}: testbench appears to target DUT "${preferredCandidate.name}" but does not instantiate it. ` +
        `A self-checking testbench must instantiate the DUT and connect checked output signals to DUT output ports before simulation.`,
      forbiddenConstruct: `testbench without an entity work.${preferredCandidate.name} DUT instantiation`,
      legalReplacementPattern:
        `instantiate "entity work.${preferredCandidate.name}" with a named port map using these formal ports: ${legalPorts || 'declared DUT ports'}`,
    }));
  }

  const outputDrivenSignals = new Map<string, {
    entityName: string;
    formalName: string;
    lineHint: number;
    excerpt: string;
  }>();

  for (const entry of instances) {
    if (!entry.signature) continue;
    for (const association of entry.associations) {
      const formalPort = entry.signature.ports.get(association.formal.toLowerCase());
      if (!formalPort || (formalPort.mode !== 'out' && formalPort.mode !== 'buffer' && formalPort.mode !== 'inout')) {
        continue;
      }
      const actualIdentifier = isSimpleIdentifier(association.actual);
      if (!actualIdentifier) continue;
      outputDrivenSignals.set(actualIdentifier.toLowerCase(), {
        entityName: entry.signature.name,
        formalName: association.formal,
        lineHint: association.lineHint,
        excerpt: association.excerpt,
      });
    }
  }

  const tbAssignments = collectSignalAssignments(params.content);
  const assignedSignals = new Map(tbAssignments.map((assignment) => [assignment.name.toLowerCase(), assignment]));
  for (const assignment of tbAssignments) {
    const outputDrive = outputDrivenSignals.get(assignment.name.toLowerCase());
    if (!outputDrive) continue;
    findings.push(createFailureDetail({
      code: 'testbench_drives_dut_output_signal',
      category: 'testbench_structure',
      relativePath: params.relativePath,
      lineHint: assignment.lineHint,
      message:
        `${params.relativePath}:${assignment.lineHint}: testbench assigns "${assignment.name}" even though that signal is mapped to output port "${outputDrive.formalName}" of DUT "${outputDrive.entityName}". ` +
        `A testbench must stimulate only DUT inputs and must observe DUT outputs without driving them.`,
      forbiddenConstruct: `testbench assignment "${assignment.excerpt}" to DUT output actual "${assignment.name}"`,
      legalReplacementPattern:
        `remove the testbench assignment to "${assignment.name}" and let DUT output "${outputDrive.formalName}" drive that signal through the port map`,
    }));
  }

  for (const checkedSignal of collectCheckLikeActuals(params.content, params.declaredTypes)) {
    const lowerName = checkedSignal.name.toLowerCase();
    if (outputDrivenSignals.has(lowerName)) continue;
    if (assignedSignals.has(lowerName)) continue;
    findings.push(createFailureDetail({
      code: 'checked_signal_not_dut_driven',
      category: 'testbench_structure',
      relativePath: params.relativePath,
      lineHint: checkedSignal.lineHint,
      message:
        `${params.relativePath}:${checkedSignal.lineHint}: self-checking testbench checks signal "${checkedSignal.name}", but that signal is not driven by a DUT output port or any local driver. ` +
        `This usually means the DUT instantiation/port map is missing or the checked signal is disconnected.`,
      forbiddenConstruct: `check call "${checkedSignal.excerpt}" observes undriven signal "${checkedSignal.name}"`,
      legalReplacementPattern:
        `connect "${checkedSignal.name}" to the correct DUT output in a named port map, or drive it from a deliberate local model before checking it`,
    }));
  }

  return findings;
}

function collectSubprogramContractFindings(params: {
  relativePath: string;
  content: string;
  declaredTypes: Map<string, NormalizedDeclaredType>;
  subprogramSignatures: Map<string, SubprogramSignature[]>;
}) {
  const findings: GeneratedVhdlFailureDetail[] = [];
  const seen = new Set<string>();

  for (const call of collectPotentialSubprogramCalls(params.content)) {
    const lowerName = call.name.toLowerCase();
    const prefix = params.content.slice(Math.max(0, call.index - 48), call.index);
    if (/\b(?:function|procedure|entity|component|type|subtype|signal|variable|constant|generic|port)\s+$/i.test(prefix)) {
      continue;
    }

    const signatures = params.subprogramSignatures.get(lowerName);
    if (!signatures?.length) continue;

    const actuals = splitTopLevelArguments(call.actualText);
    const matchingArity = signatures.filter((signature) => signature.parameters.length === actuals.length);
    const lineHint = lineNumberForIndex(params.content, call.index);
    const excerpt = lineTextForIndex(params.content, call.index);

    if (matchingArity.length === 0) {
      const expectedCounts = Array.from(new Set(signatures.map((signature) => signature.parameters.length))).sort((a, b) => a - b);
      const key = `${lowerName}:arity:${lineHint}:${actuals.length}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push(createFailureDetail({
        code: 'subprogram_call_arity_mismatch',
        category: 'interface_generic_port_syntax',
        relativePath: params.relativePath,
        lineHint,
        message:
          `${params.relativePath}:${lineHint}: calls "${call.name}" with ${actuals.length} actual argument(s), ` +
          `but its visible declaration expects ${expectedCounts.join(' or ')} argument(s).`,
        forbiddenConstruct: `call "${excerpt}" has ${actuals.length} actual argument(s)`,
        legalReplacementPattern:
          `make the "${call.name}" declaration and every call site agree on one exact formal/actual count; for wait_clk helpers prefer "procedure wait_clk(signal clk_i : in std_logic)" and calls "wait_clk(clk)"`,
      }));
      continue;
    }

    for (const signature of matchingArity) {
      for (let index = 0; index < actuals.length; index += 1) {
        const formalType = signature.parameters[index];
        const actualType = inferActualExpressionTypeForSubprogram(actuals[index], params.declaredTypes);
        if (!actualType || formalType === actualType) continue;
        const scalarVectorMismatch =
          (formalType === 'std_logic_vector' && actualType === 'std_logic')
          || (formalType === 'std_logic' && actualType === 'std_logic_vector');
        if (!scalarVectorMismatch) continue;

        const key = `${lowerName}:type:${lineHint}:${index}:${formalType}:${actualType}`;
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push(createFailureDetail({
          code: 'subprogram_actual_type_mismatch',
          category: 'interface_generic_port_syntax',
          relativePath: params.relativePath,
          lineHint,
          message:
            `${params.relativePath}:${lineHint}: calls "${call.name}" with ${formatDeclaredTypeForMessage(actualType)} actual "${actuals[index].trim()}" ` +
            `for formal argument #${index + 1}, but the visible helper declaration expects ${formatDeclaredTypeForMessage(formalType)}.`,
          forbiddenConstruct: `${formatDeclaredTypeForMessage(actualType)} actual "${actuals[index].trim()}" passed to ${formatDeclaredTypeForMessage(formalType)} formal of "${call.name}"`,
          legalReplacementPattern:
            /^check_eq_sl$/i.test(call.name)
              ? 'use scalar helper check_eq_sl(label, got : std_logic, expected : std_logic, failed), and use check_eq_slv only for std_logic_vector comparisons'
              : `make "${call.name}" formals and call actuals use the same scalar/vector type, or split helpers by type instead of overloading one unsafe signature`,
        }));
        break;
      }
    }
  }

  return findings;
}

function collectEnumOpcodeNumericConversionFindings(params: {
  relativePath: string;
  content: string;
  declaredTypes: Map<string, NormalizedDeclaredType>;
}) {
  const findings: GeneratedVhdlFailureDetail[] = [];
  const cleanContent = stripVhdlComments(params.content);
  const enumLiterals = new Set<string>();

  for (const typeMatch of cleanContent.matchAll(/\btype\s+[a-zA-Z][a-zA-Z0-9_]*\s+is\s*\(([\s\S]*?)\)\s*;/gi)) {
    splitIdentifierList(typeMatch[1]).forEach((literal) => enumLiterals.add(literal.toLowerCase()));
  }

  for (const conversion of cleanContent.matchAll(/\bto_integer\s*\(\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\)/gi)) {
    const identifier = conversion[1];
    const normalized = identifier.toLowerCase();
    const declaredType = params.declaredTypes.get(normalized);
    const looksOpcode = /^op_[a-z0-9_]+$/i.test(identifier);
    const isUnsafe =
      enumLiterals.has(normalized)
      || (looksOpcode && declaredType !== 'integer' && declaredType !== 'unsigned' && declaredType !== 'signed');
    if (!isUnsafe) continue;

    const lineHint = lineNumberForIndex(cleanContent, conversion.index ?? 0);
    const lineText = lineTextForIndex(cleanContent, conversion.index ?? 0);
    findings.push(createFailureDetail({
      code: 'enum_opcode_numeric_conversion_misuse',
      category: 'numeric_std_type_discipline',
      relativePath: params.relativePath,
      lineHint,
      message:
        `${params.relativePath}:${lineHint}: uses numeric_std conversion "${conversion[0]}" on opcode/custom symbol "${identifier}". ` +
        `Opcode encodings must be integer constants or std_logic_vector constants before numeric conversion.`,
      forbiddenConstruct: `numeric conversion "${conversion[0]}" in "${lineText}"`,
      legalReplacementPattern:
        `define ${identifier} as an integer constant or std_logic_vector encoding constant and use that constant directly; do not pass enum literals through to_integer(...)`,
    }));
  }

  return findings;
}

function collectUnsignedConversionOnNonVectorFindings(params: {
  relativePath: string;
  content: string;
  declaredTypes: Map<string, NormalizedDeclaredType>;
}) {
  const findings: GeneratedVhdlFailureDetail[] = [];
  const cleanContent = stripVhdlComments(params.content);
  const seen = new Set<string>();

  for (const conversion of cleanContent.matchAll(/\bto_integer\s*\(\s*(unsigned|signed)\s*\(\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\)\s*\)/gi)) {
    const conversionType = conversion[1].toLowerCase() as 'unsigned' | 'signed';
    const identifier = conversion[2];
    const identifierType = params.declaredTypes.get(identifier.toLowerCase());
    if (!identifierType || identifierType === 'std_logic_vector' || identifierType === conversionType) {
      continue;
    }

    const lineHint = lineNumberForIndex(cleanContent, conversion.index ?? 0);
    const lineText = lineTextForIndex(cleanContent, conversion.index ?? 0);
    const key = `${identifier.toLowerCase()}:${lineHint}:${conversionType}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const legalReplacementPattern = identifierType === 'integer'
      ? `replace "${conversion[0]}" with "${identifier}" because "${identifier}" is already an integer/natural value`
      : `convert "${identifier}" through a value of the correct numeric_std vector type before calling to_integer; do not call ${conversionType}(...) on ${formatDeclaredTypeForMessage(identifierType)}`;

    findings.push(createFailureDetail({
      code: 'unsigned_conversion_on_non_vector',
      category: 'numeric_std_type_discipline',
      relativePath: params.relativePath,
      lineHint,
      message:
        `${params.relativePath}:${lineHint}: uses "${conversion[0]}" but "${identifier}" is declared as ${formatDeclaredTypeForMessage(identifierType)}, not a raw std_logic_vector. ` +
        `numeric_std ${conversionType}(...) conversions must not wrap non-vector scalar/custom values.`,
      forbiddenConstruct: `${conversion[0]} in "${lineText}"`,
      legalReplacementPattern,
    }));
  }

  return findings;
}

function collectEnumCaseChoiceFindings(params: {
  relativePath: string;
  content: string;
}) {
  const findings: GeneratedVhdlFailureDetail[] = [];
  const cleanContent = stripVhdlComments(params.content);
  const enumTypes: Array<{ typeName: string; literals: string[]; declaration: string }> = [];

  for (const typeMatch of cleanContent.matchAll(/\btype\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\s*\(([\s\S]*?)\)\s*;/gi)) {
    const literals = splitIdentifierList(typeMatch[2])
      .map((literal) => literal.replace(/\s+/g, ' ').trim())
      .filter((literal) => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(literal));
    if (literals.length === 0) continue;
    enumTypes.push({
      typeName: typeMatch[1],
      literals,
      declaration: typeMatch[0].replace(/\s+/g, ' ').trim(),
    });
  }

  if (enumTypes.length === 0) return findings;

  for (const caseMatch of cleanContent.matchAll(/\bcase\s+([\s\S]*?)\s+is\b([\s\S]*?)\bend\s+case\b[^;]*;/gi)) {
    const body = caseMatch[2] || '';
    if (/\bwhen\s+others\s*=>/i.test(body)) continue;

    const handled = new Set(
      Array.from(body.matchAll(/\bwhen\s+([a-zA-Z][a-zA-Z0-9_]*(?:\s*\|\s*[a-zA-Z][a-zA-Z0-9_]*)*)\s*=>/gi))
        .flatMap((match) => match[1].split('|').map((part) => part.trim().toLowerCase()))
    );

    for (const enumType of enumTypes) {
      const enumLiteralSet = new Set(enumType.literals.map((literal) => literal.toLowerCase()));
      const matchedLiteralCount = Array.from(handled).filter((literal) => enumLiteralSet.has(literal)).length;
      if (matchedLiteralCount === 0) continue;

      const missing = enumType.literals.filter((literal) => !handled.has(literal.toLowerCase()));
      if (missing.length === 0) continue;

      const caseLine = lineNumberForIndex(cleanContent, caseMatch.index ?? 0);
      const caseExcerpt = lineTextForIndex(cleanContent, caseMatch.index ?? 0);
      findings.push(createFailureDetail({
        code: 'enum_case_choice_missing',
        category: 'interface_generic_port_syntax',
        relativePath: params.relativePath,
        lineHint: caseLine,
        message:
          `${params.relativePath}:${caseLine}: case statement appears to cover enum type "${enumType.typeName}" but omits choice(s): ${missing.join(', ')}. ` +
          `VHDL case statements over enum values must cover every literal or include a safe when others branch.`,
        forbiddenConstruct: `case statement "${caseExcerpt}" omits enum choice(s) ${missing.join(', ')} from ${enumType.declaration}`,
        legalReplacementPattern:
          `add explicit when branch(es) for ${missing.join(', ')} or add a safe when others branch that preserves the FSM/reset behavior`,
      }));
      break;
    }
  }

  return findings;
}

function collectInterfaceConstantVisibilityFindings(params: {
  relativePath: string;
  content: string;
  packageExports: Map<string, Set<string>>;
}) {
  const findings: GeneratedVhdlFailureDetail[] = [];
  const cleanContent = stripVhdlComments(params.content);
  const locallyVisible = new Set<string>();
  for (const constantMatch of cleanContent.matchAll(/\bconstant\s+([a-zA-Z][a-zA-Z0-9_]*)\s*:/gi)) {
    locallyVisible.add(constantMatch[1].toLowerCase());
  }
  for (const genericBlock of collectBalancedKeywordBlocks(cleanContent, 'generic')) {
    for (const segment of splitTopLevelSegments(genericBlock.body, ';')) {
      const genericMatch = segment.match(/^\s*([a-zA-Z][a-zA-Z0-9_,\s]*)\s*:/i);
      if (!genericMatch) continue;
      splitIdentifierList(genericMatch[1]).forEach((name) => locallyVisible.add(name.toLowerCase()));
    }
  }
  for (const packageName of collectImportedWorkAllPackages(cleanContent)) {
    for (const exported of params.packageExports.get(packageName) || []) {
      locallyVisible.add(exported.toLowerCase());
    }
  }

  for (const portBlock of collectBalancedKeywordBlocks(cleanContent, 'port')) {
    for (const widthRef of portBlock.body.matchAll(/\b(std_logic_vector|unsigned|signed)\s*\(([^)]*)\)/gi)) {
      const rangeText = widthRef[2] || '';
      for (const identifierMatch of rangeText.matchAll(/\b([A-Z][A-Z0-9_]*)\b/g)) {
        const identifier = identifierMatch[1];
        if (/^(?:TO|DOWNTO|RANGE|OTHERS)$/i.test(identifier)) continue;
        if (locallyVisible.has(identifier.toLowerCase())) continue;
        const absoluteIndex = portBlock.index + (widthRef.index ?? 0) + (identifierMatch.index ?? 0);
        findings.push(createFailureDetail({
          code: 'interface_constant_not_visible',
          category: 'interface_generic_port_syntax',
          relativePath: params.relativePath,
          lineHint: lineNumberForIndex(cleanContent, absoluteIndex),
          message:
            `${params.relativePath}:${lineNumberForIndex(cleanContent, absoluteIndex)}: entity/component port width references "${identifier}" before that generic/constant is declared or imported.`,
          forbiddenConstruct: `interface width expression "${widthRef[0]}" references undeclared "${identifier}"`,
          legalReplacementPattern:
            `declare "${identifier}" as an earlier entity generic with a safe default, import it from a selected package analyzed before this file, or replace it with a literal width`,
        }));
      }
    }
  }

  return findings;
}

function normalizeDeclaredType(typeText: string): NormalizedDeclaredType {
  const normalized = typeText.replace(/\s+/g, ' ').trim().toLowerCase();
  if (normalized.includes('std_logic_vector')) return 'std_logic_vector';
  if (normalized.includes('unsigned')) return 'unsigned';
  if (normalized.includes('signed')) return 'signed';
  if (/\bstd_(u)?logic\b/.test(normalized)) return 'std_logic';
  if (normalized.includes('integer') || normalized.includes('natural') || normalized.includes('positive')) return 'integer';
  if (normalized === 'string' || /\bstring\s*\(/.test(normalized)) return 'string';
  const simpleCustomType = normalized.match(/^([a-zA-Z][a-zA-Z0-9_]*)$/);
  if (simpleCustomType) return customTypeName(simpleCustomType[1]);
  return 'other';
}

function normalizeDeclaredTypeWithAliases(
  typeText: string,
  aliases: Map<string, NormalizedDeclaredType>,
): NormalizedDeclaredType {
  const normalized = typeText.replace(/\s+/g, ' ').trim().toLowerCase();
  const simpleAliasMatch = normalized.match(/^([a-zA-Z][a-zA-Z0-9_]*)$/);
  if (simpleAliasMatch && aliases.has(simpleAliasMatch[1])) {
    return aliases.get(simpleAliasMatch[1]) || 'other';
  }

  const direct = normalizeDeclaredType(typeText);
  if (direct !== 'other') return direct;

  if (!simpleAliasMatch) return 'other';
  return aliases.get(simpleAliasMatch[1]) || 'other';
}

function collectDeclaredTypeAliases(
  content: string,
  inheritedAliases?: Map<string, NormalizedDeclaredType>,
) {
  const declaredTypeAliases = new Map<string, NormalizedDeclaredType>(inheritedAliases || []);
  for (const match of content.matchAll(/\btype\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\s+record\b/gi)) {
    declaredTypeAliases.set(match[1].toLowerCase(), customTypeName(match[1]));
  }
  for (const match of content.matchAll(/\btype\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\s*\(([\s\S]*?)\)\s*;/gi)) {
    declaredTypeAliases.set(match[1].toLowerCase(), customTypeName(match[1]));
  }
  for (const match of content.matchAll(/\b(type|subtype)\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\s+(?!record\b)(?!\()([^;]+?)\s*;/gi)) {
    const aliasName = match[2].toLowerCase();
    const aliasType = normalizeDeclaredTypeWithAliases(match[3], declaredTypeAliases);
    declaredTypeAliases.set(aliasName, aliasType === 'other' ? customTypeName(match[2]) : aliasType);
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
      const match = segment.match(/^\s*(?:(?:signal|variable|constant)\s+)?([a-zA-Z][a-zA-Z0-9_,\s]*)\s*:\s*(?:(?:in|out|inout|buffer|linkage)\s+)?(.+)\s*$/i);
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
  for (const block of [...collectBalancedKeywordBlocks(content, 'port'), ...collectBalancedKeywordBlocks(content, 'generic')]) {
    recordParameterList(block.body);
  }

  return declaredTypes;
}

type RawDeclaredIdentifierType = {
  rawType: string;
  normalizedType: NormalizedDeclaredType;
};

function collectRawDeclaredIdentifierTypeTexts(
  content: string,
  inheritedAliases?: Map<string, NormalizedDeclaredType>,
) {
  const declaredTypes = new Map<string, RawDeclaredIdentifierType>();
  const declaredTypeAliases = collectDeclaredTypeAliases(content, inheritedAliases);

  const recordType = (names: string[], typeText: string) => {
    const rawType = typeText.replace(/\s+/g, ' ').trim();
    const normalizedType = normalizeDeclaredTypeWithAliases(rawType, declaredTypeAliases);
    names.forEach((name) => declaredTypes.set(name.toLowerCase(), { rawType, normalizedType }));
  };

  for (const match of content.matchAll(/\b(signal|variable|constant)\s+([^:;]+?)\s*:\s*([^;:=]+(?:\([^;]*?\))?)/gi)) {
    recordType(splitIdentifierList(match[2]), match[3]);
  }

  const recordParameterList = (parameterList: string) => {
    for (const segment of parameterList.split(';')) {
      const match = segment.match(/^\s*(?:(?:signal|variable|constant)\s+)?([a-zA-Z][a-zA-Z0-9_,\s]*)\s*:\s*(?:(?:in|out|inout|buffer|linkage)\s+)?(.+)\s*$/i);
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
  for (const block of [...collectBalancedKeywordBlocks(content, 'port'), ...collectBalancedKeywordBlocks(content, 'generic')]) {
    recordParameterList(block.body);
  }

  return declaredTypes;
}

function getBaseActualIdentifier(actualExpression: string) {
  return actualExpression.trim().match(/^([a-zA-Z][a-zA-Z0-9_]*)(?:\s*\([^)]*\))?$/)?.[1] || null;
}

function isNamedSubtypeText(typeText: string) {
  return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(typeText.trim())
    && !BUILTIN_VHDL_TYPE_NAMES.has(typeText.trim().toLowerCase());
}

function typesRequireExactSubtypeBoundary(params: {
  formalType: NormalizedDeclaredType;
  actualType: NormalizedDeclaredType | null;
  formalRawType: string;
  actualRawType: string | null;
}) {
  if (!params.actualType || params.actualType !== params.formalType) return false;
  if (params.formalType !== 'unsigned' && params.formalType !== 'signed' && params.formalType !== 'std_logic_vector') {
    return false;
  }
  const formalRaw = params.formalRawType.replace(/\s+/g, ' ').trim();
  const actualRaw = (params.actualRawType || '').replace(/\s+/g, ' ').trim();
  if (!formalRaw || !actualRaw || formalRaw.toLowerCase() === actualRaw.toLowerCase()) {
    return false;
  }
  return isNamedSubtypeText(formalRaw) || isNamedSubtypeText(actualRaw);
}

function collectIntegerConstants(content: string) {
  const constants = new Map<string, number>();
  for (const match of stripVhdlComments(content).matchAll(/\b(?:constant|generic)\s+([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(?:integer|natural|positive)\s*(?::=\s*([0-9]+))?/gi)) {
    if (match[2] == null) continue;
    constants.set(match[1].toLowerCase(), Number.parseInt(match[2], 10));
  }
  for (const genericBlock of collectBalancedKeywordBlocks(content, 'generic')) {
    for (const segment of splitTopLevelSegments(genericBlock.body, ';')) {
      const match = segment.match(/^\s*([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(?:integer|natural|positive)\s*:=\s*([0-9]+)\s*$/i);
      if (match) constants.set(match[1].toLowerCase(), Number.parseInt(match[2], 10));
    }
  }
  return constants;
}

function evaluateSimpleIntegerExpression(expression: string, constants: Map<string, number>) {
  const trimmed = expression.replace(/\s+/g, ' ').trim();
  const literal = trimmed.match(/^[0-9]+$/);
  if (literal) return Number.parseInt(trimmed, 10);
  const minusMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9_]*)\s*-\s*([0-9]+)$/);
  if (minusMatch && constants.has(minusMatch[1].toLowerCase())) {
    return (constants.get(minusMatch[1].toLowerCase()) || 0) - Number.parseInt(minusMatch[2], 10);
  }
  const plusMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9_]*)\s*\+\s*([0-9]+)$/);
  if (plusMatch && constants.has(plusMatch[1].toLowerCase())) {
    return (constants.get(plusMatch[1].toLowerCase()) || 0) + Number.parseInt(plusMatch[2], 10);
  }
  if (constants.has(trimmed.toLowerCase())) {
    return constants.get(trimmed.toLowerCase()) || 0;
  }
  return null;
}

function collectIncompleteArrayAggregateChoicesFindings(params: {
  relativePath: string;
  content: string;
}) {
  const findings: GeneratedVhdlFailureDetail[] = [];
  const cleanContent = stripVhdlComments(params.content);
  const constants = collectIntegerConstants(cleanContent);
  const arrayTypes = new Map<string, { low: number; high: number; elementType: string; declaration: string }>();

  for (const typeMatch of cleanContent.matchAll(/\btype\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\s+array\s*\(\s*([^)]+?)\s+(?:to|downto)\s+([^)]+?)\s*\)\s+of\s+([^;]+)\s*;/gi)) {
    const low = evaluateSimpleIntegerExpression(typeMatch[2], constants);
    const high = evaluateSimpleIntegerExpression(typeMatch[3], constants);
    if (low == null || high == null) continue;
    arrayTypes.set(typeMatch[1].toLowerCase(), {
      low: Math.min(low, high),
      high: Math.max(low, high),
      elementType: typeMatch[4].replace(/\s+/g, ' ').trim(),
      declaration: typeMatch[0].replace(/\s+/g, ' ').trim(),
    });
  }

  if (arrayTypes.size === 0) return findings;

  for (const objectMatch of cleanContent.matchAll(/\b(signal|constant|variable)\s+([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*([a-zA-Z][a-zA-Z0-9_]*)\s*:=\s*\(/gi)) {
    const arrayType = arrayTypes.get(objectMatch[3].toLowerCase());
    if (!arrayType) continue;
    const openIndex = (objectMatch.index ?? 0) + objectMatch[0].lastIndexOf('(');
    const closeIndex = findBalancedCloseParen(cleanContent, openIndex);
    if (closeIndex < 0) continue;
    const aggregateBody = cleanContent.slice(openIndex + 1, closeIndex);
    if (/\bothers\s*=>/i.test(aggregateBody)) continue;
    const explicitChoices = Array.from(aggregateBody.matchAll(/\b([0-9]+)\s*=>/g)).map((choice) => Number.parseInt(choice[1], 10));
    if (explicitChoices.length === 0) continue;
    const rangeLength = arrayType.high - arrayType.low + 1;
    const coveredChoices = new Set(explicitChoices.filter((choice) => choice >= arrayType.low && choice <= arrayType.high));
    if (coveredChoices.size >= rangeLength) continue;
    const lineHint = lineNumberForIndex(cleanContent, objectMatch.index ?? 0);
    findings.push(createFailureDetail({
      code: 'incomplete_array_aggregate_choices',
      category: 'array_subtype_misuse',
      relativePath: params.relativePath,
      lineHint,
      message:
        `${params.relativePath}:${lineHint}: initializes array object "${objectMatch[2]}" of type "${objectMatch[3]}" with ${coveredChoices.size}/${rangeLength} explicit choice(s) and no others choice. ` +
        `Fixed-range array aggregates must cover every index or include a safe others default before GHDL analyze.`,
      forbiddenConstruct: `${objectMatch[2]} aggregate for ${objectMatch[3]} omits choices in ${arrayType.declaration}`,
      legalReplacementPattern:
        `add an explicit "others => <safe ${arrayType.elementType} default>" choice, for example "others => (others => '0')" for vector element types`,
    }));
  }

  return findings;
}

function collectTypedEqualityOperandMismatchFindings(params: {
  relativePath: string;
  content: string;
  declaredTypes: Map<string, NormalizedDeclaredType>;
}) {
  const findings: GeneratedVhdlFailureDetail[] = [];
  const cleanContent = stripVhdlComments(params.content);
  for (const match of cleanContent.matchAll(/\b([a-zA-Z][a-zA-Z0-9_]*)\s*(=|\/=)\s*std_logic_vector\s*\(([^;\n]+?)\)/gi)) {
    const lhsName = match[1];
    const lhsType = params.declaredTypes.get(lhsName.toLowerCase());
    if (lhsType !== 'unsigned' && lhsType !== 'signed') continue;
    const lineHint = lineNumberForIndex(cleanContent, match.index ?? 0);
    const lineText = lineTextForIndex(cleanContent, match.index ?? 0);
    findings.push(createFailureDetail({
      code: 'typed_equality_operand_mismatch',
      category: 'numeric_std_type_discipline',
      relativePath: params.relativePath,
      lineHint,
      message:
        `${params.relativePath}:${lineHint}: compares ${lhsType} object "${lhsName}" against std_logic_vector(...) expression. ` +
        `VHDL equality operands must have matching types; do not wrap numeric_std values in std_logic_vector for the comparison.`,
      forbiddenConstruct: match[0].trim(),
      legalReplacementPattern:
        `compare "${lhsName}" directly to a ${lhsType} expression such as to_unsigned(..., ${lhsName}'length), or convert both operands to the same numeric_std type outside the comparison`,
    }));
    if (!lineText.includes(match[0])) {
      continue;
    }
  }
  return findings;
}

type SubprogramSignature = {
  name: string;
  kind: 'function' | 'procedure';
  parameters: NormalizedDeclaredType[];
  returnType?: NormalizedDeclaredType;
};

type PackageFunctionHeader = {
  packageName: string;
  functionName: string;
  header: string;
};

type InterfaceSignature = {
  name: string;
  ports: Map<string, InterfacePortSignature>;
};

function collectRecordTypeDeclarations(content: string) {
  const records = new Map<string, RecordTypeSignature>();

  for (const match of content.matchAll(/\btype\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\s+record\b([\s\S]*?)\bend\s+record\s*;/gi)) {
    const typeName = match[1];
    const body = match[2] || '';
    const fields = new Map<string, string>();

    for (const segment of body.split(';')) {
      const fieldMatch = segment.match(/^\s*([a-zA-Z][a-zA-Z0-9_,\s]*)\s*:\s*(.+?)\s*$/i);
      if (!fieldMatch) continue;
      splitIdentifierList(fieldMatch[1]).forEach((fieldName) => {
        fields.set(fieldName.toLowerCase(), fieldMatch[2].replace(/\s+/g, ' ').trim());
      });
    }

    records.set(typeName.toLowerCase(), {
      typeName,
      fields,
      declaration: `type ${typeName} is record${body}end record;`,
    });
  }

  return records;
}

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
      const match = segment.match(/^\s*(?:(?:signal|variable|constant)\s+)?([a-zA-Z][a-zA-Z0-9_,\s]*)\s*:\s*(?:(?:in|out|inout|buffer|linkage)\s+)?(.+)\s*$/i);
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

function normalizeVhdlHeader(value: string) {
  return value.replace(/\s+/g, ' ').replace(/\s*;\s*$/, '').trim().toLowerCase();
}

function collectPackageDeclarationFunctionHeaders(content: string) {
  const headers: PackageFunctionHeader[] = [];
  const cleanContent = stripVhdlComments(content);
  const packageExpression = /\bpackage\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is([\s\S]*?)\bend\s+(?:package(?:\s+[a-zA-Z][a-zA-Z0-9_]*)?|[a-zA-Z][a-zA-Z0-9_]*)\s*;/gi;

  for (const packageMatch of cleanContent.matchAll(packageExpression)) {
    const packageName = packageMatch[1];
    const body = packageMatch[2];
    for (const functionMatch of body.matchAll(/\bfunction\s+([a-zA-Z][a-zA-Z0-9_]*)\s*\(([\s\S]*?)\)\s*return\s+([^;\n]+?)\s*;/gi)) {
      headers.push({
        packageName,
        functionName: functionMatch[1],
        header: `function ${functionMatch[1]}(${functionMatch[2].trim()}) return ${functionMatch[3].trim()}`,
      });
    }
  }

  return headers;
}

async function collectProjectPackageFunctionHeaders(projectRoot: string, sourcePaths: string[]) {
  const headers = new Map<string, PackageFunctionHeader>();
  for (const relativePath of sourcePaths) {
    try {
      const content = await fs.readFile(path.join(projectRoot, relativePath), 'utf8');
      for (const header of collectPackageDeclarationFunctionHeaders(content)) {
        headers.set(`${header.packageName.toLowerCase()}.${header.functionName.toLowerCase()}`, header);
      }
    } catch {
      continue;
    }
  }
  return headers;
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
    const ports = new Map<string, InterfacePortSignature>();
    for (const segment of interfaceBody.split(';')) {
      const match = segment.match(/^\s*([a-zA-Z][a-zA-Z0-9_,\s]*)\s*:\s*(?:(in|out|inout|buffer|linkage)\s+)?(.+)\s*$/i);
      if (!match) continue;
      const mode = (match[2]?.toLowerCase() || 'in') as InterfacePortSignature['mode'];
      const rawType = match[3].replace(/\s+/g, ' ').trim();
      const normalizedType = normalizeDeclaredTypeWithAliases(rawType, declaredTypeAliases);
      splitIdentifierList(match[1]).forEach((identifier) => ports.set(identifier.toLowerCase(), {
        type: normalizedType,
        rawType,
        mode,
      }));
    }
    signatures.set(name.toLowerCase(), {
      name,
      ports,
    });
  };

  for (const region of collectEntityOrComponentInterfaceRegions(content)) {
    const portBlock = collectBalancedKeywordBlocks(region.body, 'port')[0];
    if (!portBlock) continue;
    addInterfaceSignature(region.name, portBlock.body);
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

async function collectProjectRecordTypeDeclarations(projectRoot: string, sourcePaths: string[]) {
  const records = new Map<string, RecordTypeSignature>();

  for (const relativePath of sourcePaths) {
    const absolutePath = path.join(projectRoot, relativePath);
    let content = '';
    try {
      content = stripVhdlComments(await fs.readFile(absolutePath, 'utf8'));
    } catch {
      continue;
    }

    for (const [key, record] of collectRecordTypeDeclarations(content)) {
      if (!records.has(key)) {
        records.set(key, record);
      }
    }
  }

  return records;
}

function collectPackageExportedTypeAliases(content: string) {
  const exportsByPackage = new Map<string, Set<string>>();
  const packageExpression = /\bpackage\s+(?!body\b)([a-zA-Z][a-zA-Z0-9_]*)\s+is\b([\s\S]*?)\bend\s+(?:package(?:\s+[a-zA-Z][a-zA-Z0-9_]*)?|[a-zA-Z][a-zA-Z0-9_]*)\s*;/gi;

  for (const packageMatch of content.matchAll(packageExpression)) {
    const packageName = packageMatch[1].toLowerCase();
    const body = packageMatch[2] || '';
    const exported = exportsByPackage.get(packageName) || new Set<string>();
    for (const typeMatch of body.matchAll(/\b(?:type|subtype)\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\b/gi)) {
      exported.add(typeMatch[1].toLowerCase());
    }
    exportsByPackage.set(packageName, exported);
  }

  return exportsByPackage;
}

async function collectProjectPackageTypeExports(projectRoot: string, sourcePaths: string[]) {
  const exportsByPackage = new Map<string, Set<string>>();
  const packagesBySymbol = new Map<string, Set<string>>();

  for (const relativePath of sourcePaths) {
    const absolutePath = path.join(projectRoot, relativePath);
    let content = '';
    try {
      content = stripVhdlComments(await fs.readFile(absolutePath, 'utf8'));
    } catch {
      continue;
    }

    for (const [packageName, symbols] of collectPackageExportedTypeAliases(content)) {
      const exported = exportsByPackage.get(packageName) || new Set<string>();
      for (const symbol of symbols) {
        exported.add(symbol);
        const packageNames = packagesBySymbol.get(symbol) || new Set<string>();
        packageNames.add(packageName);
        packagesBySymbol.set(symbol, packageNames);
      }
      exportsByPackage.set(packageName, exported);
    }
  }

  return { exportsByPackage, packagesBySymbol };
}

type PackageSymbolExport = {
  normalizedName: string;
  declaredName: string;
  packageName: string;
  kind: 'constant' | 'type' | 'subtype';
};

function collectPackageExportedSymbols(content: string) {
  const symbolsByPackage = new Map<string, PackageSymbolExport[]>();
  const packageExpression = /\bpackage\s+(?!body\b)([a-zA-Z][a-zA-Z0-9_]*)\s+is\b([\s\S]*?)\bend\s+(?:package(?:\s+[a-zA-Z][a-zA-Z0-9_]*)?|[a-zA-Z][a-zA-Z0-9_]*)\s*;/gi;

  for (const packageMatch of content.matchAll(packageExpression)) {
    const packageName = packageMatch[1].toLowerCase();
    const body = packageMatch[2] || '';
    const symbols = symbolsByPackage.get(packageName) || [];
    for (const symbolMatch of body.matchAll(/\b(type|subtype|constant)\s+([a-zA-Z][a-zA-Z0-9_]*)\b/gi)) {
      const kind = symbolMatch[1].toLowerCase() as 'constant' | 'type' | 'subtype';
      const declaredName = symbolMatch[2];
      symbols.push({
        normalizedName: declaredName.toLowerCase(),
        declaredName,
        packageName,
        kind,
      });
    }
    symbolsByPackage.set(packageName, symbols);
  }

  return symbolsByPackage;
}

async function collectProjectPackageSymbols(projectRoot: string, sourcePaths: string[]) {
  const symbolsByPackage = new Map<string, PackageSymbolExport[]>();

  for (const relativePath of sourcePaths) {
    const absolutePath = path.join(projectRoot, relativePath);
    let content = '';
    try {
      content = stripVhdlComments(await fs.readFile(absolutePath, 'utf8'));
    } catch {
      continue;
    }

    for (const [packageName, symbols] of collectPackageExportedSymbols(content)) {
      const existing = symbolsByPackage.get(packageName) || [];
      existing.push(...symbols);
      symbolsByPackage.set(packageName, existing);
    }
  }

  return symbolsByPackage;
}

function collectImportedWorkAllPackages(content: string) {
  return new Set(
    Array.from(content.matchAll(/\buse\s+work\.([a-zA-Z][a-zA-Z0-9_]*)\.all\s*;/gi))
      .map((match) => match[1].toLowerCase())
  );
}

function normalizeTypeNameForVisibility(typeText: string) {
  const normalized = typeText
    .replace(/:=.*$/s, '')
    .replace(/\brange\b[\s\S]*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  const match = normalized.match(/^(?:(?:inout|in|out|buffer|linkage)\s+)?([a-zA-Z][a-zA-Z0-9_]*)\b/i);
  return match?.[1]?.toLowerCase() || null;
}

function collectDeclaredTypeUseSites(content: string) {
  const uses: Array<{ typeName: string; lineHint: number; lineText: string }> = [];
  const addTypeUse = (typeText: string, index: number) => {
    const typeName = normalizeTypeNameForVisibility(typeText);
    if (!typeName || BUILTIN_VHDL_TYPE_NAMES.has(typeName)) return;
    uses.push({
      typeName,
      lineHint: lineNumberForIndex(content, index),
      lineText: lineTextForIndex(content, index),
    });
  };

  const inspectInterfaceBlock = (body: string, blockStart: number) => {
    for (const segment of splitTopLevelSegments(body, ';')) {
      const segmentIndex = body.indexOf(segment);
      const match = segment.match(/^\s*[a-zA-Z][a-zA-Z0-9_,\s]*\s*:\s*(?:(?:in|out|inout|buffer|linkage)\s+)?(.+?)\s*$/i);
      if (!match) continue;
      addTypeUse(match[1], blockStart + Math.max(0, segmentIndex));
    }
  };

  for (const match of content.matchAll(/\b(signal|variable|constant)\s+[^:;]+?\s*:\s*([^;:=]+(?:\([^;]*?\))?)/gi)) {
    addTypeUse(match[2], match.index ?? 0);
  }

  for (const block of [...collectBalancedKeywordBlocks(content, 'port'), ...collectBalancedKeywordBlocks(content, 'generic')]) {
    inspectInterfaceBlock(block.body, block.index);
  }

  for (const match of content.matchAll(/\bfunction\s+[a-zA-Z][a-zA-Z0-9_]*\s*\(([\s\S]*?)\)\s*return\s+([^;\n]+?)(?:\s+is\b|\s*;)/gi)) {
    const parameterList = match[1] || '';
    inspectInterfaceBlock(parameterList, (match.index ?? 0) + match[0].indexOf(parameterList));
    addTypeUse(match[2], match.index ?? 0);
  }

  for (const match of content.matchAll(/\bprocedure\s+[a-zA-Z][a-zA-Z0-9_]*\s*\(([\s\S]*?)\)\s*is\b/gi)) {
    const parameterList = match[1] || '';
    inspectInterfaceBlock(parameterList, (match.index ?? 0) + match[0].indexOf(parameterList));
  }

  return uses;
}

function collectPackageSymbolVisibilityFindings(params: {
  relativePath: string;
  content: string;
  packageExports: Map<string, Set<string>>;
  packagesBySymbol: Map<string, Set<string>>;
}) {
  const findings: GeneratedVhdlFailureDetail[] = [];
  const localAliases = collectDeclaredTypeAliases(params.content);
  const importedPackages = collectImportedWorkAllPackages(params.content);
  const visibleTypeNames = new Set<string>([...BUILTIN_VHDL_TYPE_NAMES, ...localAliases.keys()]);

  for (const packageName of importedPackages) {
    const exported = params.packageExports.get(packageName);
    if (!exported) continue;
    for (const symbol of exported) {
      visibleTypeNames.add(symbol);
    }
  }

  for (const useSite of collectDeclaredTypeUseSites(params.content)) {
    if (visibleTypeNames.has(useSite.typeName)) continue;

    const exportingPackages = Array.from(params.packagesBySymbol.get(useSite.typeName) || []);
    const replacement = exportingPackages.length > 0
      ? `add use work.${exportingPackages[0]}.all; in this file and ensure ${exportingPackages[0]} is analyzed before ${params.relativePath}, or change the declaration to use a type that is already visible`
      : `generate a package/type declaration that exports ${useSite.typeName}, import it with use work.<package>.all, and analyze that package before ${params.relativePath}`;

    findings.push(createFailureDetail({
      code: 'package_symbol_not_visible',
      category: 'package_type_definition',
      relativePath: params.relativePath,
      lineHint: useSite.lineHint,
      message:
        `${params.relativePath}:${useSite.lineHint}: uses custom type "${useSite.typeName}" but that type is not locally declared or exported by any imported work package. ` +
        (exportingPackages.length > 0
          ? `It is exported by package(s): ${exportingPackages.join(', ')}.`
          : 'No selected package exports this type.'),
      forbiddenConstruct: `custom type "${useSite.typeName}" used without visible package/type declaration in "${useSite.lineText}"`,
      legalReplacementPattern: replacement,
    }));
  }

  return findings;
}

function collectCaseInsensitivePackageCollisionFindings(params: {
  relativePath: string;
  content: string;
  packageSymbols: Map<string, PackageSymbolExport[]>;
}) {
  const findings: GeneratedVhdlFailureDetail[] = [];
  const importedPackages = collectImportedWorkAllPackages(params.content);
  const importedSymbols = new Map<string, PackageSymbolExport[]>();

  for (const packageName of importedPackages) {
    for (const symbol of params.packageSymbols.get(packageName) || []) {
      const existing = importedSymbols.get(symbol.normalizedName) || [];
      existing.push(symbol);
      importedSymbols.set(symbol.normalizedName, existing);
    }
  }

  if (importedSymbols.size === 0) {
    return findings;
  }

  const reportCollision = (kind: string, identifier: string, index: number) => {
    const normalizedIdentifier = identifier.toLowerCase();
    const collisions = importedSymbols.get(normalizedIdentifier) || [];
    if (collisions.length === 0) return;

    const imported = collisions[0];
    findings.push(createFailureDetail({
      code: 'case_insensitive_identifier_collision',
      category: 'identifier_legality',
      relativePath: params.relativePath,
      lineHint: lineNumberForIndex(params.content, index),
      message:
        `${params.relativePath}:${lineNumberForIndex(params.content, index)}: ${kind} "${identifier}" collides with ` +
        `${imported.kind} "${imported.declaredName}" imported from work.${imported.packageName}.all. ` +
        `VHDL identifiers are case-insensitive, so these names are the same identifier.`,
      forbiddenConstruct: `${kind} "${identifier}" and imported ${imported.kind} "${imported.declaredName}" differ only by case or spelling style`,
      legalReplacementPattern:
        `rename one side to a distinct VHDL identifier, for example use descriptive constants such as ` +
        `"${imported.declaredName}_PIXELS" or "${imported.declaredName}_LINES" instead of colliding with interface signal "${identifier}"`,
    }));
  };

  const inspectInterfaceBlock = (blockBody: string, blockIndex: number, kind: string) => {
    for (const segment of splitTopLevelSegments(blockBody, ';')) {
      const segmentOffset = blockBody.indexOf(segment);
      const nameMatch = segment.match(/^\s*([a-zA-Z][a-zA-Z0-9_,\s]*)\s*:/i);
      if (!nameMatch) continue;
      for (const identifier of splitIdentifierList(nameMatch[1])) {
        reportCollision(kind, identifier, blockIndex + Math.max(0, segmentOffset));
      }
    }
  };

  for (const block of collectBalancedKeywordBlocks(params.content, 'port')) {
    inspectInterfaceBlock(block.body, block.index, 'port');
  }
  for (const block of collectBalancedKeywordBlocks(params.content, 'generic')) {
    inspectInterfaceBlock(block.body, block.index, 'generic');
  }
  for (const declaration of params.content.matchAll(/\b(signal|variable|constant)\s+([a-zA-Z][a-zA-Z0-9_,\s]*)\s*:/gi)) {
    const kind = declaration[1].toLowerCase();
    const names = declaration[2];
    for (const identifier of splitIdentifierList(names)) {
      reportCollision(kind, identifier, declaration.index ?? 0);
    }
  }

  return findings;
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
  const projectPackageTypeExports = await collectProjectPackageTypeExports(projectRoot, sourcePaths);
  const projectPackageSymbols = await collectProjectPackageSymbols(projectRoot, sourcePaths);
  const projectInterfaceSignatures = await collectProjectInterfaceSignatures(projectRoot, sourcePaths);
  const projectSubprogramSignatures = await collectProjectSubprogramSignatures(projectRoot, sourcePaths);
  const projectPackageFunctionHeaders = await collectProjectPackageFunctionHeaders(projectRoot, sourcePaths);
  const projectRecordTypes = await collectProjectRecordTypeDeclarations(projectRoot, sourcePaths);

  for (const relativePath of sourcePaths) {
    const absolutePath = path.join(projectRoot, relativePath);
    let content = '';
    try {
      content = stripVhdlComments(await fs.readFile(absolutePath, 'utf8'));
    } catch {
      continue;
    }

    findings.push(...collectReservedIdentifierFindings(relativePath, content));
    findings.push(...collectPackageSymbolVisibilityFindings({
      relativePath,
      content,
      packageExports: projectPackageTypeExports.exportsByPackage,
      packagesBySymbol: projectPackageTypeExports.packagesBySymbol,
    }));
    findings.push(...collectInterfaceConstantVisibilityFindings({
      relativePath,
      content,
      packageExports: projectPackageTypeExports.exportsByPackage,
    }));
    findings.push(...collectCaseInsensitivePackageCollisionFindings({
      relativePath,
      content,
      packageSymbols: projectPackageSymbols,
    }));

    const declaredTypes = collectDeclaredIdentifierTypes(content, projectTypeAliases);
    const rawDeclaredTypes = collectRawDeclaredIdentifierTypeTexts(content, projectTypeAliases);
    const subprogramSignatures = projectSubprogramSignatures;
    const interfaceSignatures = projectInterfaceSignatures;
    findings.push(...collectIncompleteArrayAggregateChoicesFindings({ relativePath, content }));
    findings.push(...collectTypedEqualityOperandMismatchFindings({ relativePath, content, declaredTypes }));
    findings.push(...collectSubprogramContractFindings({
      relativePath,
      content,
      declaredTypes,
      subprogramSignatures,
    }));
    findings.push(...collectTestbenchDutContractFindings({
      relativePath,
      content,
      declaredTypes,
      interfaceSignatures,
    }));
    findings.push(...collectEnumOpcodeNumericConversionFindings({
      relativePath,
      content,
      declaredTypes,
    }));
    findings.push(...collectUnsignedConversionOnNonVectorFindings({
      relativePath,
      content,
      declaredTypes,
    }));
    findings.push(...collectEnumCaseChoiceFindings({
      relativePath,
      content,
    }));

    for (const recordAccess of content.matchAll(/\b([a-zA-Z][a-zA-Z0-9_]*)\s*\.\s*([a-zA-Z][a-zA-Z0-9_]*)\b/g)) {
      const objectName = recordAccess[1];
      const fieldName = recordAccess[2];
      const objectType = declaredTypes.get(objectName.toLowerCase());
      if (!isCustomDeclaredType(objectType)) continue;

      const recordTypeName = objectType.slice('custom:'.length);
      const recordType = projectRecordTypes.get(recordTypeName);
      if (!recordType || recordType.fields.has(fieldName.toLowerCase())) continue;

      const lineHint = lineNumberForIndex(content, recordAccess.index ?? 0);
      const lineText = content.split(/\r\n|\r|\n/)[lineHint - 1]?.trim() || recordAccess[0];
      const legalFields = Array.from(recordType.fields.keys()).join(', ') || 'none';
      findings.push(createFailureDetail({
        code: 'record_field_not_declared',
        category: 'package_type_definition',
        relativePath,
        lineHint,
        message:
          `${relativePath}:${lineHint}: accesses "${objectName}.${fieldName}", but record type "${recordType.typeName}" has no field named "${fieldName}". ` +
          `Legal fields are: ${legalFields}.`,
        forbiddenConstruct: `record access "${objectName}.${fieldName}" in "${lineText}"`,
        legalReplacementPattern:
          `repair the implementation to use one of the declared ${recordType.typeName} fields (${legalFields}) or derive the needed value from those fields; do not invent new record fields`,
      }));
    }

    for (const malformedLiteral of collectMalformedCharacterLiterals(content)) {
      findings.push(createFailureDetail({
        code: 'malformed_character_literal',
        category: 'width_literal_mismatch',
        relativePath,
        lineHint: malformedLiteral.lineHint,
        message:
          `${relativePath}:${malformedLiteral.lineHint}: contains malformed one-bit character literal in "${malformedLiteral.lineText}". ` +
          `The literal ${malformedLiteral.badText} is missing its closing quote; use ${malformedLiteral.replacement}.`,
        forbiddenConstruct: `malformed one-bit character literal "${malformedLiteral.badText}"`,
        legalReplacementPattern: `replace "${malformedLiteral.badText}" with "${malformedLiteral.replacement}" in the same expression`,
      }));
    }

    for (const incompleteSubprogram of collectIncompleteSubprogramInterfaces(content)) {
      findings.push(createFailureDetail({
        code: 'incomplete_subprogram_interface',
        category: 'interface_generic_port_syntax',
        relativePath,
        lineHint: incompleteSubprogram.lineHint,
        message:
          `${relativePath}:${incompleteSubprogram.lineHint}: ${incompleteSubprogram.kind} "${incompleteSubprogram.name}" has executable token "${incompleteSubprogram.illegalToken}" before the formal parameter list is closed. ` +
          `The broken line is "${incompleteSubprogram.excerpt}". Complete the helper interface before the body begins.`,
        forbiddenConstruct: `${incompleteSubprogram.kind} "${incompleteSubprogram.name}" executable token "${incompleteSubprogram.illegalToken}" before ") is"`,
        legalReplacementPattern:
          incompleteSubprogram.kind === 'procedure' && /^check_eq$/i.test(incompleteSubprogram.name)
            ? `replace "${incompleteSubprogram.name}" with a complete canonical self-checking helper: procedure check_eq(constant label_text : in string; constant got : in <type>; constant expected : in <type>; variable failed_io : inout boolean) is ... end procedure`
            : `close the formal parameter list with ") is" before any report/if/wait/assert/assignment/process statements`,
      }));
    }

    for (const illegalOthers of collectIllegalOthersAggregateComparisons(content)) {
      findings.push(createFailureDetail({
        code: 'illegal_others_aggregate_context',
        category: 'width_literal_mismatch',
        relativePath,
        lineHint: illegalOthers.lineHint,
        message:
          `${relativePath}:${illegalOthers.lineHint}: compares "${illegalOthers.objectName}" with aggregate "${illegalOthers.expression}". ` +
          `GHDL cannot infer the aggregate bounds from plain "(others => '${illegalOthers.bit}')" in this expression context.`,
        forbiddenConstruct: illegalOthers.expression,
        legalReplacementPattern:
          `replace "(others => '${illegalOthers.bit}')" with a range-qualified aggregate such as "(${illegalOthers.objectName}'range => '${illegalOthers.bit}')"`,
      }));
    }

    for (const architectureVariable of collectArchitectureBodyVariables(content)) {
      const intent = classifyArchitectureBodyVariableIntent({
        relativePath,
        variableName: architectureVariable.name,
        subtype: architectureVariable.subtype,
      });
      findings.push(createFailureDetail({
        code: 'architecture_body_variable',
        category: 'declaration_scope',
        message:
          `${relativePath}: declares plain architecture-body variable "${architectureVariable.name}". ` +
          `Ordinary variables are not allowed in the architecture declarative region for GHDL-compatible VHDL. ` +
          `${intent.messageTail}`,
        forbiddenConstruct: `plain architecture-body variable "${architectureVariable.name}" (${intent.flavor})`,
        legalReplacementPattern: intent.legalReplacementPattern,
      }));
    }

    const isLikelyTestbench = /(^|\/)(tb|testbench)\//i.test(relativePath)
      || /(^|[_-])(tb|testbench)([_-]|$)/i.test(path.basename(relativePath, path.extname(relativePath)));
    if (isLikelyTestbench) {
      for (const localStringVariable of content.matchAll(/\bvariable\s+([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*string\b(?!\s*\()/gi)) {
        findings.push(createFailureDetail({
          code: 'tb_unconstrained_string_variable',
          category: 'declaration_scope',
          message:
            `${relativePath}: declares unconstrained local string variable "${localStringVariable[1]}". ` +
            `Generated testbenches must not rely on mutable unconstrained string variables because they are illegal in GHDL-compatible VHDL. ` +
            `Use a directly reported string literal, a constant with an explicit bound, or a helper/report path that does not require a mutable string variable.`,
          forbiddenConstruct: `unconstrained local string variable "${localStringVariable[1]}"`,
          legalReplacementPattern: `replace "${localStringVariable[1]}" with a direct report literal, a constant with an explicit bound, or a helper contract that does not require a mutable string variable`,
        }));
      }

      for (const clockEdgeFormalMismatch of collectClockEdgeHelperFormalMismatches(content)) {
        findings.push(createFailureDetail({
          code: 'clock_edge_helper_requires_signal_formal',
          category: 'interface_generic_port_syntax',
          message:
            `${relativePath}: helper ${clockEdgeFormalMismatch.kind} "${clockEdgeFormalMismatch.name}" calls ${clockEdgeFormalMismatch.edgeFunction} on formal "${clockEdgeFormalMismatch.formalName}" but declares it as "${clockEdgeFormalMismatch.clause}". ` +
            `Any helper formal passed to ${clockEdgeFormalMismatch.edgeFunction}(...) must be declared as a signal formal so GHDL accepts the edge test inside the helper body.`,
          forbiddenConstruct:
            `${clockEdgeFormalMismatch.kind} "${clockEdgeFormalMismatch.name}" calls ${clockEdgeFormalMismatch.edgeFunction} on non-signal formal clause "${clockEdgeFormalMismatch.clause}"`,
          legalReplacementPattern:
            `rewrite the helper formal as "${clockEdgeFormalMismatch.requiredClause}" and preserve the existing helper body/call sites`,
        }));
      }

      for (const malformedFormal of collectMalformedSubprogramFormalClauses(content)) {
        findings.push(createFailureDetail({
          code: 'invalid_subprogram_formal_syntax',
          category: 'interface_generic_port_syntax',
          message:
            `${relativePath}: helper ${malformedFormal.kind} "${malformedFormal.name}" declares malformed formal clause "${malformedFormal.clause}". ` +
            `Generated helper interfaces must use canonical VHDL formal syntax only: "name : in type", ` +
            `"signal name : out std_logic", or "variable name : inout integer". ` +
            `Never place mode keywords before the identifier and never place signal/variable/constant after the colon.`,
          forbiddenConstruct: `${malformedFormal.kind} "${malformedFormal.name}" declares malformed formal clause "${malformedFormal.clause}"`,
          legalReplacementPattern:
            `rewrite "${malformedFormal.clause}" into canonical VHDL formal syntax and keep signal/variable actual kinds aligned with the helper body`,
        }));
      }

      for (const constrainedStringFormal of content.matchAll(/\b(function|procedure)\s+([a-zA-Z][a-zA-Z0-9_]*)\s*\(([\s\S]*?)\)\s*(?:return\s+[^;\n]+?(?:\s+is\b|\s*;)|is\b)/gi)) {
        const constrainedFormalMatch = constrainedStringFormal[3].match(/([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(?:(?:in|out|inout|buffer|linkage)\s+)?string\s*\([^)]*\)/i);
        if (!constrainedFormalMatch) continue;
        findings.push(createFailureDetail({
          code: 'tb_string_formal_actual_constraint_mismatch',
          category: 'width_literal_mismatch',
          message:
            `${relativePath}: helper ${constrainedStringFormal[1].toLowerCase()} "${constrainedStringFormal[2]}" declares constrained string formal "${constrainedFormalMatch[1]}". ` +
            `Generated self-checking testbench helpers must not constrain string message formals because varying literal lengths across call sites can trigger actual/formal constraint mismatches in GHDL.`,
          forbiddenConstruct: `${constrainedStringFormal[1].toLowerCase()} "${constrainedStringFormal[2]}" declares constrained string formal "${constrainedFormalMatch[1]}"`,
          legalReplacementPattern: `use an unconstrained read-only string formal for "${constrainedFormalMatch[1]}", or remove the helper string formal and report literals directly at the call site`,
        }));
      }

      for (const unsafeIndexConversion of collectUnsafeTbLogicIndexConversions({
        relativePath,
        content,
        declaredTypes,
      })) {
        findings.push(createFailureDetail({
          code: 'tb_unguarded_logic_index_conversion',
          category: 'runtime_bound_risk',
          message:
            `${relativePath}: performs direct array indexing "${unsafeIndexConversion.expression}" using raw ${declaredTypes.get(unsafeIndexConversion.indexIdentifier.toLowerCase())} "${unsafeIndexConversion.indexIdentifier}". ` +
            `Self-checking testbenches must not convert DUT-visible logic vectors directly into array indexes because X/U/Z bits can trigger runtime metavalue failures before the DUT is stable.`,
          forbiddenConstruct: `direct raw logic index conversion "${unsafeIndexConversion.expression}"`,
          legalReplacementPattern:
            unsafeIndexConversion.conversionKind === 'signed'
              ? `replace "${unsafeIndexConversion.expression}" with a local guarded helper such as ${unsafeIndexConversion.arrayName}(tb_safe_signed_to_index(${unsafeIndexConversion.indexIdentifier})) after validating every bit is '0'/'1'`
              : `replace "${unsafeIndexConversion.expression}" with a local guarded helper such as ${unsafeIndexConversion.arrayName}(tb_safe_slv_to_index(${unsafeIndexConversion.indexIdentifier})) after validating every bit is '0'/'1'`,
        }));
      }

      for (const rangeMembership of content.matchAll(/\b(if|elsif)\s+([a-zA-Z][a-zA-Z0-9_]*)\s+in\s+([^;\n]+?)\s+to\s+([^;\n]+?)\s+then\b/gi)) {
        const keyword = rangeMembership[1].toLowerCase();
        const subject = rangeMembership[2].trim();
        const lowerBound = rangeMembership[3].trim();
        const upperBound = rangeMembership[4].trim();
        findings.push(createFailureDetail({
          code: 'invalid_range_membership_syntax',
          category: 'runtime_bound_risk',
          message:
            `${relativePath}: uses invalid VHDL range-membership condition "${rangeMembership[0]}". ` +
            `VHDL does not support "${subject} in ${lowerBound} to ${upperBound}" inside ${keyword} conditions. ` +
            `Generated bounds checks must use explicit comparisons.`,
          forbiddenConstruct: rangeMembership[0],
          legalReplacementPattern: `${keyword} ${subject} >= ${lowerBound} and ${subject} <= ${upperBound} then`,
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
      const badAssociationLine = findTopLevelInterfaceArrowLine(blockBody);
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

    for (const match of content.matchAll(/(^|\n)([ \t]*others\s*:\s*[^;\n,)]+)(?=\s*(?:[,)]|\n|$))/gi)) {
      const absoluteIndex = (match.index ?? 0) + match[1].length;
      if (isIndexInsideLineComment(content, absoluteIndex) || isIndexInsideDoubleQuotedString(content, absoluteIndex)) {
        continue;
      }
      const lineHint = content.slice(0, absoluteIndex).split('\n').length;
      const badLine = match[2].trim();
      findings.push(createFailureDetail({
        code: 'aggregate_choice_operator_misrepair',
        category: 'array_subtype_misuse',
        relativePath,
        lineHint,
        message:
          `${relativePath}:${lineHint}: uses ":" for aggregate choice "${badLine}". ` +
          `VHDL aggregate choices such as others must use "=>"; ":" is only for declarations/interfaces.`,
        excerpt: badLine,
        forbiddenConstruct: badLine,
        legalReplacementPattern: badLine.replace(/\bothers\s*:/i, 'others =>'),
      }));
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

    const conditionAssignmentExpressions = [
      /\b(if|elsif)\s+([^;\n]*?:=[^;\n]*?)\s+then\b/gi,
      /\bassert\s+([^;\n]*?:=[^;\n]*?)(?:\s+report|\s+severity|;)/gi,
      // Only conditional expressions use `when ... else`. A `case` branch such as
      // `when OP_AND => res := a_u and b_u;` is a legal variable assignment.
      /\bwhen\s+([^;\n]*?:=[^;\n]*?)\s+else\b/gi,
    ];
    for (const expression of conditionAssignmentExpressions) {
      for (const conditionMatch of content.matchAll(expression)) {
        const conditionText = (conditionMatch[2] || conditionMatch[1] || '').trim();
        const assignmentMatch = conditionText.match(/\b([a-zA-Z][a-zA-Z0-9_]*)\s*:=\s*([^;\n,)]+)/);
        findings.push(createFailureDetail({
          code: 'conditional_assignment_operator_misuse',
          category: 'signal_variable_assignment_misuse',
          message:
            `${relativePath}: uses variable assignment operator ":=" inside a boolean condition ("${conditionText}"). ` +
            `Conditions must use comparison operators such as =, /=, <, <=, >, or >=. Use ":=" only as a standalone variable assignment statement.`,
          relativePath,
          lineHint: conditionMatch.index == null ? null : lineNumberForIndex(content, conditionMatch.index),
          forbiddenConstruct: assignmentMatch
            ? `condition "${conditionText}" contains "${assignmentMatch[1]} := ${assignmentMatch[2].trim()}"`
            : `condition "${conditionText}" contains ":="`,
          legalReplacementPattern: assignmentMatch
            ? `replace "${assignmentMatch[1]} := ${assignmentMatch[2].trim()}" with a comparison such as "${assignmentMatch[1]} <= ${assignmentMatch[2].trim()}" for upper-bound checks or "${assignmentMatch[1]} = ${assignmentMatch[2].trim()}" for equality checks`
            : 'replace assignment inside the condition with a legal comparison operator',
        }));
        break;
      }
      if (findings.some((detail) => detail.code === 'conditional_assignment_operator_misuse')) {
        break;
      }
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

    for (const instance of collectPortMapInstances(content)) {
      const instantiatedName = instance.name;
      const interfaceSignature = interfaceSignatures.get(instantiatedName.toLowerCase());
      if (!interfaceSignature) continue;

      const associations = parsePortMapAssociations(content, instance);
      const associatedFormals = new Set(associations.map((association) => association.formal.toLowerCase()));
      for (const [formalName, formalPort] of interfaceSignature.ports.entries()) {
        if (formalPort.mode !== 'in' || associatedFormals.has(formalName)) continue;
        const legalFormals = Array.from(interfaceSignature.ports.keys()).join(', ') || 'none';
        const lineHint = lineNumberForIndex(content, instance.index);
        findings.push(createFailureDetail({
          code: 'unconnected_required_input_port',
          category: 'interface_generic_port_syntax',
          relativePath,
          lineHint,
          message:
            `${relativePath}:${lineHint}: instance of "${interfaceSignature.name}" leaves required input port "${formalName}" unconnected. ` +
            `Every mandatory input formal must be connected explicitly in generated VHDL port maps.`,
          forbiddenConstruct: `port map for ${interfaceSignature.name} omits required input formal "${formalName}"`,
          legalReplacementPattern:
            `connect "${formalName}" to a correctly typed existing signal or add a local adapter signal; legal formal ports are: ${legalFormals}`,
        }));
      }

      for (const association of associations) {
        const formalPortName = association.formal;
        const actualExpression = association.actual;
        const formalPort = interfaceSignature.ports.get(formalPortName.toLowerCase());
        if (!formalPort) {
          const legalFormals = Array.from(interfaceSignature.ports.keys()).join(', ') || 'none';
          findings.push(createFailureDetail({
            code: 'unknown_port_map_formal',
            category: 'interface_generic_port_syntax',
            relativePath,
            lineHint: association.lineHint,
            message:
              `${relativePath}:${association.lineHint}: maps unknown formal port "${formalPortName}" on instance of "${interfaceSignature.name}". ` +
              `Legal formal ports are: ${legalFormals}.`,
            forbiddenConstruct: `port-map association "${formalPortName} => ${actualExpression}" on ${interfaceSignature.name}; "${formalPortName}" is not a declared formal port`,
            legalReplacementPattern:
              `rewrite this port map to use only exact formal names declared by ${interfaceSignature.name}: ${legalFormals}`,
          }));
          continue;
        }

        const formalType = formalPort.type;
        const actualType = inferActualExpressionType(actualExpression, declaredTypes);
        const actualIdentifier = getBaseActualIdentifier(actualExpression);
        const actualRawType = actualIdentifier ? rawDeclaredTypes.get(actualIdentifier.toLowerCase())?.rawType || null : null;
        const isOutputAssociation = formalPort.mode === 'out' || formalPort.mode === 'buffer';
        const conversionMatch = actualExpression.match(/^\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\(([\s\S]+)\)\s*$/);
        if (isOutputAssociation && conversionMatch) {
          findings.push(createFailureDetail({
            code: 'out_port_actual_conversion',
            category: 'interface_generic_port_syntax',
            relativePath,
            lineHint: association.lineHint,
            message:
              `${relativePath}:${association.lineHint}: maps output port "${formalPortName}" of "${interfaceSignature.name}" through conversion expression "${actualExpression}". ` +
              `VHDL output/buffer port associations must be writable objects, not type-conversion expressions.`,
            forbiddenConstruct: `output port association "${formalPortName} => ${actualExpression}"`,
            legalReplacementPattern:
              `connect "${formalPortName}" to a correctly typed internal signal, then assign or convert that signal separately outside the port map`,
          }));
          continue;
        }

        if (typesRequireExactSubtypeBoundary({
          formalType,
          actualType,
          formalRawType: formalPort.rawType,
          actualRawType,
        })) {
          findings.push(createFailureDetail({
            code: 'typed_port_width_mismatch',
            category: 'numeric_std_type_discipline',
            relativePath,
            lineHint: association.lineHint,
            message:
              `${relativePath}:${association.lineHint}: connects "${actualExpression}" declared as ${actualRawType} to formal port "${formalPortName}" declared as ${formalPort.rawType} on "${interfaceSignature.name}". ` +
              `Named numeric subtypes must match at port boundaries unless an explicit, legal adapter signal/conversion is used.`,
            forbiddenConstruct: `port-map association "${formalPortName} => ${actualExpression}" crosses ${actualRawType} to ${formalPort.rawType}`,
            legalReplacementPattern:
              `declare/use an actual signal of exact type ${formalPort.rawType}, or add a local adapter with explicit resize/conversion before the port map`,
          }));
          continue;
        }

        if (!actualType || actualType === formalType) continue;

        if (isCustomDeclaredType(formalType)) {
          const formalTypeName = formatDeclaredTypeForMessage(formalType);
          const actualTypeName = formatDeclaredTypeForMessage(actualType);
          findings.push(createFailureDetail({
            code: 'custom_type_port_association_mismatch',
            category: 'package_type_definition',
            relativePath,
            lineHint: association.lineHint,
            message:
              `${relativePath}:${association.lineHint}: connects ${actualTypeName} expression "${actualExpression}" to custom typed formal port "${formalPortName}" (${formalTypeName}) of "${interfaceSignature.name}". ` +
              `Record/enum/package-defined ports must be wired with objects of the exact declared type.`,
            forbiddenConstruct: `${actualTypeName} actual "${actualExpression}" passed to custom ${formalTypeName} formal port "${formalPortName}"`,
            legalReplacementPattern:
              `declare or reuse an internal signal of type ${formalTypeName} and connect that signal directly; repair schema conversions outside the port map`,
          }));
          continue;
        }

        if (formalType !== 'unsigned' && formalType !== 'signed') continue;

        const actualTypeDescriptor = actualType === 'std_logic_vector'
          ? 'raw std_logic_vector actual'
          : `${formatDeclaredTypeForMessage(actualType)} actual`;
        findings.push(createFailureDetail({
          code: 'typed_port_association_mismatch',
          category: 'numeric_std_type_discipline',
          relativePath,
          lineHint: association.lineHint,
          message:
            `${relativePath}:${association.lineHint}: drives ${formalType} formal port "${formalPortName}" of "${interfaceSignature.name}" with ${actualTypeDescriptor} "${actualExpression}" in a port map. ` +
            `Convert the actual at the entity boundary into the exact formal type expected by the instantiated design unit.`,
          forbiddenConstruct: `${actualTypeDescriptor} "${actualExpression}" passed to ${formalType} formal port "${formalPortName}" of ${interfaceSignature.name}`,
          legalReplacementPattern: `wrap "${actualExpression}" with ${formalType}(...) at the port-map boundary or change the formal/actual types so they match exactly`,
        }));
      }
    }

    for (const procedureScope of collectProcedureScopeSnapshots(content)) {
      const formalNames = new Set(procedureScope.formalNames.map((name) => name.toLowerCase()));
      const localNames = new Set(procedureScope.localNames.map((name) => name.toLowerCase()));

      for (const assignmentTarget of procedureScope.assignmentTargets) {
        const normalizedAssignee = assignmentTarget.toLowerCase();
        if (formalNames.has(normalizedAssignee) || localNames.has(normalizedAssignee)) {
          continue;
        }
        if (!declaredTypes.has(normalizedAssignee)) {
          continue;
        }
        findings.push(createFailureDetail({
          code: 'procedure_outer_scope_write',
          category: 'declaration_scope',
          message:
            `${relativePath}: procedure "${procedureScope.name}" assigns to outer-scope object "${assignmentTarget}" without passing it as a formal parameter. ` +
            `Pass the target in explicitly, or keep that state local to the calling process.`,
          forbiddenConstruct: `procedure "${procedureScope.name}" mutates outer-scope object "${assignmentTarget}"`,
          legalReplacementPattern: `pass "${assignmentTarget}" as a formal parameter or keep the mutable state local to the caller`,
        }));
        break;
      }
    }

    for (const assignmentMisuse of collectStatementLevelAssignmentOperatorMisuse(content)) {
      if (assignmentMisuse.code === 'variable_assigned_with_signal_operator') {
        findings.push(createFailureDetail({
          code: assignmentMisuse.code,
          category: 'signal_variable_assignment_misuse',
          message:
            `${relativePath}: assigns variable "${assignmentMisuse.name}" with the signal assignment operator "<=". ` +
            `Variables must use ":="; reserve "<=" for signals only.`,
          lineHint: assignmentMisuse.lineHint,
          forbiddenConstruct: `variable "${assignmentMisuse.name}" assigned with "<=" in statement "${assignmentMisuse.statement}"`,
          legalReplacementPattern: `replace "<=" with ":=" for variable "${assignmentMisuse.name}" or convert it into a signal if that was the intent`,
        }));
      } else {
        findings.push(createFailureDetail({
          code: assignmentMisuse.code,
          category: 'signal_variable_assignment_misuse',
          message:
            `${relativePath}: assigns signal "${assignmentMisuse.name}" with the variable assignment operator ":=". ` +
            `Signals must use "<="; reserve ":=" for variables/constants only.`,
          lineHint: assignmentMisuse.lineHint,
          forbiddenConstruct: `signal "${assignmentMisuse.name}" assigned with ":=" in statement "${assignmentMisuse.statement}"`,
          legalReplacementPattern: `replace ":=" with "<=" for signal "${assignmentMisuse.name}" or convert it into a variable if it is process-local temporary state`,
        }));
      }
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

    for (const commaVector of collectCommaSeparatedPackedVectorSubtypes(content)) {
      findings.push(createFailureDetail({
        code: 'illegal_multidimensional_logic_vector',
        category: 'array_subtype_misuse',
        relativePath,
        lineHint: commaVector.lineHint,
        message:
          `${relativePath}:${commaVector.lineHint}: declares an illegal comma-separated packed vector form ("${commaVector.expression}"). ` +
          `std_logic_vector/unsigned/signed are one-dimensional; flatten the port or declare a named array type.`,
        forbiddenConstruct: commaVector.expression,
        legalReplacementPattern:
          `for NxM ports, flatten to one dimension such as ${commaVector.typeName}((N * M) - 1 downto 0), or declare a named array type in a package`,
      }));
    }

    const packageBodyExpression = /\bpackage\s+body\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\b([\s\S]*?)\bend\s+package\s+body\b[^;]*;/gi;
    for (const packageBodyMatch of content.matchAll(packageBodyExpression)) {
      const packageBodyName = packageBodyMatch[1];
      const packageBodyContent = packageBodyMatch[2] || '';
      const packageBodyContentStart = (packageBodyMatch.index ?? 0) + packageBodyMatch[0].indexOf(packageBodyContent);
      for (const bodyFunctionMatch of packageBodyContent.matchAll(/\bfunction\s+([a-zA-Z][a-zA-Z0-9_]*)\s*\(([\s\S]*?)\)\s*return\s+([^;\n]+?)\s+is\b/gi)) {
        const functionName = bodyFunctionMatch[1];
        const bodyHeader = `function ${functionName}(${bodyFunctionMatch[2].trim()}) return ${bodyFunctionMatch[3].trim()}`;
        const specHeader = projectPackageFunctionHeaders.get(`${packageBodyName.toLowerCase()}.${functionName.toLowerCase()}`);
        if (!specHeader || normalizeVhdlHeader(specHeader.header) === normalizeVhdlHeader(bodyHeader)) {
          continue;
        }
        findings.push(createFailureDetail({
          code: 'package_body_signature_mismatch',
          category: 'package_type_definition',
          relativePath,
          lineHint: lineNumberForIndex(content, packageBodyContentStart + (bodyFunctionMatch.index ?? 0)),
          message:
            `${relativePath}: package body function "${functionName}" does not match its package declaration signature. ` +
            `The body header must exactly conform to the package declaration.`,
          forbiddenConstruct: bodyHeader,
          legalReplacementPattern: `replace body header with "${specHeader.header} is"`,
        }));
      }
    }

    for (const functionMatch of content.matchAll(/\bfunction\s+([a-zA-Z][a-zA-Z0-9_]*)[\s\S]*?\breturn\s+(unsigned|signed)\b([\s\S]*?)\bend\s+function(?:\s+\1)?\s*;/gi)) {
      const functionName = functionMatch[1];
      const returnType = functionMatch[2].toLowerCase();
      const functionBody = functionMatch[3];
      const resizeReturn = functionBody.match(/\breturn\s+resize\s*\(([^;]+)\)\s*;/i);
      if (!resizeReturn) continue;
      findings.push(createFailureDetail({
        code: 'typed_resize_return_mismatch',
        category: 'numeric_std_type_discipline',
        relativePath,
        lineHint: lineNumberForIndex(content, (functionMatch.index ?? 0) + functionMatch[0].indexOf(resizeReturn[0])),
        message:
          `${relativePath}: function "${functionName}" returns ${returnType} but returns raw resize(...) without explicitly converting the result to ${returnType}.`,
        forbiddenConstruct: resizeReturn[0],
        legalReplacementPattern: `replace "${resizeReturn[0]}" with "return ${returnType}(resize(${resizeReturn[1].trim()}));"`,
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

    const packageDeclarationWithBody = Array.from(
      content.matchAll(/\bpackage\s+(?!body\b)([a-zA-Z][a-zA-Z0-9_]*)\s+is\b([\s\S]*?)\bend\s+package(?:\s+body)?\b[^;]*;/gi),
    ).find((match) => (
      /\b(function|procedure)\s+[a-zA-Z][a-zA-Z0-9_]*(?:\s*\([^)]*\))?(?:\s+return\s+[^;\n]+)?\s+is[\s\S]*?\bbegin\b/i.test(match[2] || '')
    ));
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
    const importedSymbolNames = new Set<string>();
    for (const packageName of collectImportedWorkAllPackages(content)) {
      for (const symbol of projectPackageSymbols.get(packageName) || []) {
        importedSymbolNames.add(symbol.normalizedName);
      }
    }
    for (const outputName of outputPortNames) {
      if (importedSymbolNames.has(outputName.toLowerCase())) {
        continue;
      }
      const escapedOutput = outputName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rhsAssignmentReadback = new RegExp(`(?:<=|:=)[^;\\n]*\\b${escapedOutput}\\b`, 'i');
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

    const runtimeBoundRisk = content.match(/\b([a-zA-Z][a-zA-Z0-9_]*)\s*\(\s*(to_integer\s*\((?:[^()]|\([^()]*\))*\))\s*\)/i);
    if (runtimeBoundRisk?.index != null) {
      const lineHint = lineNumberForIndex(content, runtimeBoundRisk.index);
      const lineText = lineTextForIndex(content, runtimeBoundRisk.index);
      findings.push(createFailureDetail({
        code: 'runtime_bound_check_risk',
        category: 'runtime_bound_risk',
        relativePath,
        lineHint,
        message:
          `${relativePath}:${lineHint}: performs indexing with an unchecked to_integer(...) expression ("${runtimeBoundRisk[0]}"). ` +
          `Generated indexing and array math must guard bounds explicitly so simulation does not fail with avoidable range errors.`,
        excerpt: lineText,
        forbiddenConstruct: `unchecked index expression "${runtimeBoundRisk[0]}" using index conversion "${runtimeBoundRisk[2]}"`,
        legalReplacementPattern:
          `convert "${runtimeBoundRisk[2]}" into a local integer, check it against ${runtimeBoundRisk[1]}'low and ${runtimeBoundRisk[1]}'high before indexing, and use a safe fallback branch for out-of-range or unknown values`,
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

function findWorkUnitReferenceContext(content: string, unitName: string) {
  const escapedUnit = unitName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`\\buse\\s+work\\.${escapedUnit}(?:\\.[a-zA-Z][a-zA-Z0-9_]*)?\\s*;`, 'i'),
    new RegExp(`\\bentity\\s+work\\.${escapedUnit}\\b`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.index != null) {
      const lineHint = lineNumberForIndex(content, match.index);
      const line = content.split(/\r\n|\r|\n/)[lineHint - 1]?.trim() || match[0].trim();
      return {
        lineHint,
        construct: line,
      };
    }
  }

  return {
    lineHint: null,
    construct: `reference to work.${unitName}`,
  };
}

function describeMissingWorkUnitReplacement(missingUnits: string[]) {
  const likelyPackages = missingUnits.filter((unit) => /(?:^|_)pkg$/i.test(unit) || /_package$/i.test(unit));
  const likelyEntities = missingUnits.filter((unit) => !likelyPackages.includes(unit));
  const actions: string[] = [];

  if (likelyPackages.length > 0) {
    actions.push(
      `generate package source file(s) declaring ${likelyPackages.map((unit) => `package ${unit} is`).join(', ')} and add them before dependents in analysis_order`,
    );
  }
  if (likelyEntities.length > 0) {
    actions.push(
      `generate entity/architecture source file(s) declaring ${likelyEntities.map((unit) => `entity ${unit} is`).join(', ')} and add them before dependents in analysis_order`,
    );
  }
  actions.push('or remove/inline the reference so no missing work unit is used');
  return actions.join('; ');
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

function hasSelfCheckingPassPath(content: string) {
  return /\bTEST\s+PASSED\b/i.test(content)
    || /\bPASS(?:ED)?\b/i.test(content)
    || /\bstd\.env\.stop\s*\(\s*0\s*\)/i.test(content)
    || /\bstop\s*\(\s*0\s*\)/i.test(content);
}

function extractEntityBlock(content: string, entityName: string) {
  const expression = new RegExp(`\\bentity\\s+${entityName}\\s+is\\b([\\s\\S]*?)\\bend\\b`, 'i');
  return content.match(expression)?.[1] || null;
}

function collectProvidedWorkUnits(sources: VhdlSourceDescriptor[]) {
  return new Set(
    sources.flatMap((source) => [
      ...source.entities,
      ...source.packages,
      ...source.packageBodies,
    ]).map((unit) => unit.toLowerCase())
  );
}

function findUnresolvedWorkUnitContracts(sources: VhdlSourceDescriptor[]) {
  const providedUnits = collectProvidedWorkUnits(sources);
  const findings: Array<{ source: VhdlSourceDescriptor; missing: string[] }> = [];

  for (const source of sources) {
    const missing = Array.from(new Set(
      source.dependencies
        .map((dependency) => dependency.toLowerCase())
        .filter((dependency) => !providedUnits.has(dependency))
    )).sort((left, right) => left.localeCompare(right));

    if (missing.length > 0) {
      findings.push({ source, missing });
    }
  }

  return findings;
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
  const unresolvedWorkUnitContracts = findUnresolvedWorkUnitContracts(params.selectedSources);

  for (const unresolved of unresolvedWorkUnitContracts) {
    const missingText = unresolved.missing.join(', ');
    const missingLooksPackageOnly = unresolved.missing.every((unit) => /(?:^|_)pkg$/i.test(unit) || /_package$/i.test(unit));
    const sourceContent = sourceContents.get(unresolved.source.path) || '';
    const firstReference = unresolved.missing
      .map((unit) => ({ unit, ...findWorkUnitReferenceContext(sourceContent, unit) }))
      .find((reference) => reference.lineHint !== null);
    const referenceSummary = firstReference
      ? ` First unresolved reference appears at line ${firstReference.lineHint}: ${firstReference.construct}.`
      : '';
    findings.push(createFailureDetail({
      code: missingLooksPackageOnly ? 'missing_work_package_file' : 'unresolved_work_unit',
      category: 'unresolved_work_unit',
      relativePath: unresolved.source.path,
      lineHint: firstReference?.lineHint ?? null,
      message:
        `${unresolved.source.path}: references work unit(s) that are not generated or selected for validation: ${missingText}. ` +
        `Every entity/package referenced through work must have a matching generated source file in the current project file set.${referenceSummary}`,
      forbiddenConstruct: firstReference
        ? `unresolved work unit reference "${firstReference.construct}" for missing unit(s): ${missingText}`
        : `unresolved work unit reference(s): ${missingText}`,
      legalReplacementPattern: describeMissingWorkUnitReplacement(unresolved.missing),
    }));
  }

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
          code: 'source_order_dependency_inversion',
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
      if (/\bentity\s+[a-zA-Z][a-zA-Z0-9_]*\s+is\b/i.test(content) && !hasSelfCheckingPassPath(content)) {
        findings.push(createFailureDetail({
          code: 'self_checking_testbench_missing_pass_path',
          category: 'simulation_success',
          relativePath: source.path,
          message:
            `${source.path}: generated testbench does not expose a deterministic PASS path. ` +
            'Runnable generated testbenches must report TEST PASSED or stop successfully when all checks pass.',
          forbiddenConstruct: 'self-checking testbench without a deterministic PASS/success termination path',
          legalReplacementPattern: 'add a final if/else pass/fail block that reports "TEST PASSED" severity note and calls std.env.stop(0) on success, and reports severity failure on failure',
        }));
      }
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
        const errorMessage = error?.message || String(error);
        logs.push(errorMessage);
        const inferredDetails = inferFailureDetailsFromGhdlMessage(errorMessage)
          .filter((detail) => detail.code !== 'ghdl_analyze_failure');
        return buildValidationFailureResult({
          stage: 'simulate',
          summary: `Generated VHDL failed GHDL simulation for ${topEntity}: ${errorMessage}`,
          logs,
          validatedTopEntities,
          failureDetails: inferredDetails.length > 0
            ? inferredDetails
            : [
                createFailureDetail({
                  code: 'ghdl_simulate_failure',
                  category: classifyKnownFailureCategory(errorMessage),
                  message: `Generated VHDL failed GHDL simulation for ${topEntity}: ${errorMessage}`,
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
