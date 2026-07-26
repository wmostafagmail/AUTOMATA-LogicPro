import fs from 'fs/promises';
import path from 'path';
import type { GoogleGenAI } from '@google/genai';
import type { LogicProSession, createSessionManager } from './sessionManager';
import { buildFpgaArchitectTestRunPrompt } from './fpgaArchitect';
import {
  classifyFpgaArchitectLoopFailure,
  classifyFpgaArchitectLoopFailureWithValidation,
  summarizeFpgaArchitectLoopFailures,
} from './fpgaArchitectLoopDiagnostics';
import {
  inferFailureDetailsFromGhdlMessage,
  type GeneratedVhdlFailureDetail,
  type GeneratedVhdlRepairAuditEntry,
  type GeneratedVhdlValidationResult,
} from './generatedVhdlValidation';
import {
  FPGA_ARCHITECT_SWEEP_ATTEMPTS_PER_DESIGN,
  FPGA_ARCHITECT_SWEEP_DESIGNS,
  FPGA_ARCHITECT_SWEEP_TOTAL_ATTEMPTS,
  type FpgaArchitectSweepPreset,
} from '../fpgaArchitectSweepConfig';
import {
  buildFpgaArchitectSweepRuntimeInfo,
  readFpgaArchitectSweepMeta,
  writeFpgaArchitectSweepMeta,
} from './fpgaArchitectSweepRuntime';
import {
  buildModelQualityGuidanceSection,
  readModelQualityScoreboard,
  recordModelQualityAttempt,
  writeModelQualityScoreboard,
} from './modelQualityScoreboard';
import {
  FpgaArchitectureContractError,
  buildFpgaArchitectureContractDraft,
  hashFpgaArchitectureContract,
  type FpgaArchitectureContract,
  type FpgaArchitectureContractIssue,
} from './fpgaArchitectureContract';
import { getFpgaPipelineConfig, type FpgaSweepMode } from './fpgaPipelineConfig';
import {
  readFpgaGoldenContract,
  writeFpgaGoldenContract,
} from './fpgaGoldenContracts';
import { hashGeneratedFpgaVhdl, summarizeFpgaReproducibility } from './fpgaReproducibilityMetrics';
import {
  buildGoldenLeafLibraryPath,
  promotePassedLeafBlocks,
} from './fpgaGoldenLeafLibrary';

type SessionManager = ReturnType<typeof createSessionManager>;

type SweepContinuationFile = {
  relativePath: string;
  content: string;
  kind: 'vhdl' | 'markdown' | 'script' | 'constraints' | 'text' | 'other';
};

type PreparedAiAnalyzeRequestLike = {
  selectedProvider: string;
  selectedModel: string;
  hazardScan: { findings: Array<any>; markdown?: string };
  protocolScan: { frames: Array<any>; markdown?: string };
  normalizedProjectPath: string;
  macroSpec: { label: string };
  artifactDirectory: string | null;
  macroDiagnostics?: unknown;
  systemPrompt: string;
};

type FpgaArchitectAttemptErrorLike = Error & {
  generatedVhdlValidation?: GeneratedVhdlValidationResult | null;
  fpgaArchitectureContract?: FpgaArchitectureContract | null;
  issues?: FpgaArchitectureContractIssue[];
  architectureContractIssues?: FpgaArchitectureContractIssue[];
};

function formatInnerRepairAuditForLog(repairAudit: GeneratedVhdlRepairAuditEntry[] | null | undefined) {
  if (!repairAudit || repairAudit.length === 0) {
    return 'Inner repair audit: none recorded';
  }
  const compactedAudit: GeneratedVhdlRepairAuditEntry[] = [];
  for (const entry of repairAudit) {
    const previous = compactedAudit[compactedAudit.length - 1];
    const previousKey = previous
      ? [
        previous.repairAttempt,
        previous.failureCode || 'unknown',
        previous.fileLine || 'unknown',
        previous.repairType,
        previous.changedFiles.join(','),
        previous.postRepairValidation.ok ? 'PASS' : 'FAIL',
        previous.postRepairValidation.stage,
        previous.postRepairValidation.failureCode || 'unknown',
        previous.postRepairValidation.summary,
      ].join('\u0001')
      : null;
    const entryKey = [
      entry.repairAttempt,
      entry.failureCode || 'unknown',
      entry.fileLine || 'unknown',
      entry.repairType,
      entry.changedFiles.join(','),
      entry.postRepairValidation.ok ? 'PASS' : 'FAIL',
      entry.postRepairValidation.stage,
      entry.postRepairValidation.failureCode || 'unknown',
      entry.postRepairValidation.summary,
    ].join('\u0001');
    if (previousKey === entryKey) {
      continue;
    }
    compactedAudit.push(entry);
  }
  const compactedCount = repairAudit.length - compactedAudit.length;
  return [
    '=== Inner Repair Audit ===',
    ...(compactedCount > 0 ? [`Compacted repeated repair audit entries: ${compactedCount}`] : []),
    ...compactedAudit.map((entry) => [
      `- repairAttempt: ${entry.repairAttempt}`,
      `  failureCode: ${entry.failureCode || 'unknown'}`,
      `  file:line: ${entry.fileLine || 'unknown'}`,
      `  repairType: ${entry.repairType}`,
      `  changedFiles: ${entry.changedFiles.length > 0 ? entry.changedFiles.join(', ') : 'none'}`,
      `  postRepairValidation: ${entry.postRepairValidation.ok ? 'PASS' : 'FAIL'} ${entry.postRepairValidation.stage}` +
        `${entry.postRepairValidation.failureCode ? `/${entry.postRepairValidation.failureCode}` : ''} - ${entry.postRepairValidation.summary}`,
    ].join('\n')),
  ].join('\n');
}

export type FpgaArchitectSweepFeedbackItem = {
  failureCode: string | null;
  failureCategory: string;
  ruleId: string | null;
  ruleIds: string[];
  count: number;
  summary: string;
  forbiddenConstruct: string | null;
  legalReplacementPattern: string | null;
  source: 'validator' | 'diagnostic';
};

export type RunLoopAttemptResult = {
  attempt: number;
  designKey: string;
  designLabel: string;
  designAttempt: number;
  ok: boolean;
  message: string;
  generatedVhdlValidation?: GeneratedVhdlValidationResult | null;
  architectureContractHash?: string | null;
  generatedVhdlHash?: string | null;
};

export type FpgaArchitectProviderPauseEvent = {
  attempt: number;
  designKey: string;
  designLabel: string;
  designAttempt: number;
  message: string;
  retryDelayMs: number;
  retryAt: string;
};

export type FpgaArchitectStressLoopDesignSummary = {
  key: string;
  label: string;
  outputRoot: string;
  logFilePath: string;
  attempts: number;
  completedAttempts: number;
  failures: number;
  providerRuntimeFailures: number;
  contextBudgetFailures: number;
  architectureContractFailures: number;
  codeQualityFailures: number;
  successes: number;
  results: RunLoopAttemptResult[];
  failureBuckets: Array<{
    category: string;
    label: string;
    ruleIds: string[];
    count: number;
    attempts: number[];
    example: string;
  }>;
  feedbackSummaries: FpgaArchitectSweepFeedbackItem[];
  contractIssueBuckets: Array<{ code: string; count: number; paths: string[]; examples: string[] }>;
  contractAttemptLogPaths: string[];
  contractFallbackUsed: boolean;
  uniqueOutputHashes: number;
  reproducibilityRate: number;
};

export type FpgaArchitectStressLoopResult = {
  sweepMode: FpgaSweepMode;
  attempts: number;
  completedAttempts: number;
  failures: number;
  providerRuntimeFailures: number;
  contextBudgetFailures: number;
  architectureContractFailures: number;
  codeQualityFailures: number;
  successes: number;
  logFilePath: string;
  masterLogPath: string;
  modelQualityScoreboardPath: string;
  runtimeFingerprint: string;
  staleSweepStateDiscarded: boolean;
  results: RunLoopAttemptResult[];
  stoppedEarly: boolean;
  contractIssueBuckets: Array<{ code: string; count: number; paths: string[]; examples: string[] }>;
  contractAttemptLogPaths: string[];
  contractFallbackUsed: boolean;
  failureBuckets: Array<{
    category: string;
    label: string;
    ruleIds: string[];
    count: number;
    attempts: number[];
    example: string;
  }>;
  designSummaries: FpgaArchitectStressLoopDesignSummary[];
};

function buildAttemptLogHeader(params: {
  attempt: number;
  totalAttempts: number;
  designAttempt: number;
  designAttempts: number;
  designLabel: string;
}) {
  return [
    '',
    `=== Attempt ${params.attempt}/${params.totalAttempts} @ ${new Date().toISOString()} ===`,
    `Design: ${params.designLabel}`,
    `Design Attempt: ${params.designAttempt}/${params.designAttempts}`,
  ].join('\n');
}

function buildDesignLogHeader(params: {
  preset: FpgaArchitectSweepPreset;
  selectedProvider: string;
  selectedModel: string;
  projectPath: string;
  outputRoot: string;
  runtimeFingerprint: string;
  runtimePid: number;
}) {
  return [
    `FPGA Architect design sweep`,
    `Design: ${params.preset.label}`,
    `Provider: ${params.selectedProvider}`,
    `Model: ${params.selectedModel}`,
    `Project Root: ${params.projectPath}`,
    `Design Output Root: ${params.outputRoot}`,
    `Runtime Fingerprint: ${params.runtimeFingerprint}`,
    `Runtime PID: ${params.runtimePid}`,
    `Started: ${new Date().toISOString()}`,
    `Why it tests the generator: ${params.preset.whyItTests}`,
    '',
  ].join('\n');
}

function buildMasterLogHeader(params: {
  selectedProvider: string;
  selectedModel: string;
  projectPath: string;
  totalAttempts: number;
  runtimeFingerprint: string;
  runtimePid: number;
  staleSweepStateDiscarded: boolean;
  previousRuntimeFingerprint?: string | null;
}) {
  return [
    `FPGA Architect multi-design sweep`,
    `Provider: ${params.selectedProvider}`,
    `Model: ${params.selectedModel}`,
    `Project: ${params.projectPath}`,
    `Runtime Fingerprint: ${params.runtimeFingerprint}`,
    `Runtime PID: ${params.runtimePid}`,
    `Designs: ${FPGA_ARCHITECT_SWEEP_DESIGNS.length}`,
    `Attempts per design: ${FPGA_ARCHITECT_SWEEP_ATTEMPTS_PER_DESIGN}`,
    `Total attempts: ${params.totalAttempts}`,
    `Stale Sweep State Discarded: ${params.staleSweepStateDiscarded ? 'yes' : 'no'}`,
    ...(params.previousRuntimeFingerprint ? [`Previous Runtime Fingerprint: ${params.previousRuntimeFingerprint}`] : []),
    `Started: ${new Date().toISOString()}`,
    '',
  ].join('\n');
}

function renderMarkdownBulletSection(title: string, items: string[]) {
  if (items.length === 0) {
    return `## ${title}\n- None specified.`;
  }

  return [
    `## ${title}`,
    ...items.map((item) => `- ${item}`),
  ].join('\n');
}

async function appendLog(logFilePath: string, text: string) {
  await fs.appendFile(logFilePath, `${text.trimEnd()}\n`, 'utf8');
}

function getContractIssuesFromError(error: unknown): FpgaArchitectureContractIssue[] {
  if (error instanceof FpgaArchitectureContractError) {
    return error.issues || [];
  }
  const annotated = error as FpgaArchitectAttemptErrorLike | undefined;
  if (Array.isArray(annotated?.architectureContractIssues)) {
    return annotated.architectureContractIssues;
  }
  if (Array.isArray(annotated?.issues) && annotated.issues.every((issue: any) => issue?.code && issue?.path && issue?.message)) {
    return annotated.issues;
  }
  return [];
}

function isArchitectureContractFailure(error: unknown, category: string) {
  return category === 'architecture_contract' || getContractIssuesFromError(error).length > 0;
}

function summarizeContractIssueBuckets(issues: FpgaArchitectureContractIssue[]) {
  const buckets = new Map<string, { code: string; count: number; paths: Set<string>; examples: Set<string> }>();
  for (const issue of issues) {
    const code = issue.code || 'architecture_contract_unknown';
    const existing = buckets.get(code) || { code, count: 0, paths: new Set<string>(), examples: new Set<string>() };
    existing.count += 1;
    if (issue.path) existing.paths.add(issue.path);
    if (issue.message) existing.examples.add(issue.message);
    buckets.set(code, existing);
  }
  return Array.from(buckets.values())
    .sort((left, right) => right.count - left.count || left.code.localeCompare(right.code))
    .map((bucket) => ({
      code: bucket.code,
      count: bucket.count,
      paths: Array.from(bucket.paths).slice(0, 10),
      examples: Array.from(bucket.examples).slice(0, 3),
    }));
}

function formatContractIssueLog(issues: FpgaArchitectureContractIssue[], artifactPath: string | null) {
  if (issues.length === 0) {
    return 'Architecture contract issues: none captured';
  }
  return [
    `Architecture contract issues: ${issues.length}`,
    ...(artifactPath ? [`Architecture contract issue artifact: ${artifactPath}`] : []),
    'Top architecture contract issues:',
    ...issues.slice(0, 20).map((issue, index) => `${index + 1}. [${issue.code}] ${issue.path}: ${issue.message}`),
    ...(issues.length > 20 ? [`... ${issues.length - 20} additional issue(s) written to the artifact.`] : []),
  ].join('\n');
}

const CONTRACT_FALLBACK_SAFE_CODES = new Set([
  'architecture_contract_json_invalid',
  'architecture_contract_json_missing',
  'architecture_contract_schema_version',
  'architecture_contract_design_name',
  'architecture_contract_top_entity',
  'architecture_contract_top_testbench',
  'architecture_contract_source_missing',
  'architecture_contract_source_unknown',
  'architecture_contract_source_order_duplicate',
  'architecture_contract_source_dependency_order',
  'architecture_contract_testbench_order',
  'architecture_contract_generic_default',
  'architecture_contract_placeholder',
]);

function isContractFallbackEligible(issues: FpgaArchitectureContractIssue[]) {
  return issues.length > 0 && issues.every((issue) => CONTRACT_FALLBACK_SAFE_CODES.has(issue.code));
}

async function writeContractIssueArtifact(params: {
  logDirectory: string;
  preset: FpgaArchitectSweepPreset;
  attempt: number;
  designAttempt: number;
  issues: FpgaArchitectureContractIssue[];
  message: string;
}) {
  const contractAttemptDirectory = path.join(
    params.logDirectory,
    'fpga-contract-attempts',
    params.preset.key.replace(/[^a-z0-9_-]+/gi, '_').toLowerCase(),
  );
  await fs.mkdir(contractAttemptDirectory, { recursive: true });
  const artifactPath = path.join(contractAttemptDirectory, `${String(params.designAttempt).padStart(2, '0')}-global-${String(params.attempt).padStart(2, '0')}.issues.json`);
  await fs.writeFile(
    artifactPath,
    `${JSON.stringify({
      schemaVersion: 1,
      stage: 'architecture_contract',
      designKey: params.preset.key,
      designLabel: params.preset.label,
      attempt: params.attempt,
      designAttempt: params.designAttempt,
      issueCount: params.issues.length,
      topIssueCodes: summarizeContractIssueBuckets(params.issues).slice(0, 20).map((bucket) => bucket.code),
      message: params.message,
      issues: params.issues,
    }, null, 2)}\n`,
    'utf8',
  );
  return artifactPath;
}

async function resetDesignOutputRoot(outputRoot: string) {
  await fs.rm(outputRoot, { recursive: true, force: true });
  await fs.mkdir(outputRoot, { recursive: true });
}

function shouldIncludeContinuationFile(relativePath: string) {
  const normalized = relativePath.replace(/\\/g, '/').toLowerCase();
  const baseName = path.basename(normalized);
  return (
    normalized.endsWith('.vhd')
    || normalized.endsWith('.vhdl')
    || normalized.endsWith('.md')
    || normalized.endsWith('.txt')
    || baseName === 'makefile'
  );
}

function inferContinuationFileKind(relativePath: string): SweepContinuationFile['kind'] {
  const normalized = relativePath.replace(/\\/g, '/').toLowerCase();
  const baseName = path.basename(normalized);
  if (normalized.endsWith('.vhd') || normalized.endsWith('.vhdl')) return 'vhdl';
  if (normalized.endsWith('.md')) return 'markdown';
  if (normalized.endsWith('.sh') || normalized.endsWith('.tcl') || normalized.endsWith('.do') || baseName === 'makefile') return 'script';
  if (normalized.endsWith('.xdc')) return 'constraints';
  if (normalized.endsWith('.txt')) return 'text';
  return 'other';
}

function getContinuationFence(kind: SweepContinuationFile['kind']) {
  switch (kind) {
    case 'markdown':
      return 'md';
    case 'script':
      return 'sh';
    case 'constraints':
      return 'tcl';
    case 'text':
      return 'text';
    default:
      return 'vhdl';
  }
}

const SWEEP_FEEDBACK_ITEM_CHAR_LIMIT = 800;
const SWEEP_FEEDBACK_SECTION_CHAR_LIMIT = 3_000;
const SWEEP_PROMPT_CHAR_BUDGET = 180_000;

function compactOneLine(value: string | null | undefined, maxLength = SWEEP_FEEDBACK_ITEM_CHAR_LIMIT) {
  const compact = (value || '').replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, Math.max(0, maxLength - 3))}...`;
}

function makeContextBudgetError(promptLength: number, budget: number) {
  const error = new Error(
    `FPGA Architect sweep prompt exceeded context budget before provider call: ${promptLength} characters > ${budget} characters.`,
  ) as Error & { contextBudgetExceeded?: boolean };
  error.contextBudgetExceeded = true;
  return error;
}

function isModelOutputBudgetExhausted(message: string) {
  return /returned no generated text[\s\S]*done_reason=length|done_reason=length[\s\S]*message_content_length=0|model_output_budget_exhausted/i.test(message);
}

function normalizeContinuationCandidatePath(outputRoot: string, candidatePath: string) {
  const trimmed = candidatePath.trim().replace(/^["'`]+|["'`]+$/g, '').replace(/\\/g, '/');
  if (!trimmed) {
    return null;
  }

  const normalizedOutputRoot = outputRoot.replace(/\\/g, '/');
  if (path.isAbsolute(trimmed)) {
    const normalizedAbsolute = trimmed.replace(/\\/g, '/');
    if (!normalizedAbsolute.startsWith(normalizedOutputRoot)) {
      return null;
    }
    const relativePath = path.relative(outputRoot, trimmed).replace(/\\/g, '/');
    return relativePath.startsWith('..') ? null : relativePath.toLowerCase();
  }

  const relativePath = trimmed.replace(/^\.\/+/, '');
  if (relativePath.startsWith('../')) {
    return null;
  }
  return relativePath.toLowerCase();
}

function extractContinuationPathsFromMessage(outputRoot: string, message: string) {
  const matches = message.match(/[A-Za-z0-9_./\\-]+\.(?:vhd|vhdl|md|txt|sh|tcl|do|xdc)\b/g) || [];
  const extractedPaths = new Set<string>();
  for (const match of matches) {
    const normalizedPath = normalizeContinuationCandidatePath(outputRoot, match);
    if (normalizedPath) {
      extractedPaths.add(normalizedPath);
    }
  }
  return extractedPaths;
}

function buildFocusedContinuationPathSet(
  outputRoot: string,
  failureDetails: GeneratedVhdlFailureDetail[],
  fallbackMessage = '',
) {
  const focused = new Set<string>();
  for (const detail of failureDetails) {
    if (typeof detail.relativePath !== 'string' || detail.relativePath.trim().length === 0) {
      continue;
    }
    const normalizedPath = normalizeContinuationCandidatePath(outputRoot, detail.relativePath);
    if (normalizedPath) {
      focused.add(normalizedPath);
    }
  }
  if (focused.size === 0 && fallbackMessage.trim().length > 0) {
    for (const fallbackPath of extractContinuationPathsFromMessage(outputRoot, fallbackMessage)) {
      focused.add(fallbackPath);
    }
  }
  return focused;
}

function extractContinuationLineHints(
  outputRoot: string,
  failureDetails: GeneratedVhdlFailureDetail[],
  fallbackMessage = '',
) {
  const hints = new Map<string, number[]>();
  const addHint = (relativePath: string | null, lineNumber: number | null | undefined) => {
    if (!relativePath || typeof lineNumber !== 'number' || !Number.isFinite(lineNumber) || lineNumber < 1) {
      return;
    }
    const normalizedPath = normalizeContinuationCandidatePath(outputRoot, relativePath);
    if (!normalizedPath) return;
    const existing = hints.get(normalizedPath) || [];
    existing.push(Math.floor(lineNumber));
    hints.set(normalizedPath, existing);
  };

  for (const detail of failureDetails) {
    addHint(detail.relativePath || null, detail.lineHint || null);
  }

  const absolutePathPattern = /([A-Za-z0-9_./\\ -]+\.(?:vhd|vhdl|md|txt|sh|tcl|do|xdc)):(\d+)(?::\d+)?/g;
  for (const match of fallbackMessage.matchAll(absolutePathPattern)) {
    addHint(match[1], Number.parseInt(match[2], 10));
  }

  return hints;
}

function isCpuBehavioralFailureDetail(detail: GeneratedVhdlFailureDetail) {
  return (
    detail.code === 'cpu_halt_behavior_mismatch'
    || detail.code === 'cpu_reset_pc_behavior_mismatch'
    || detail.code === 'cpu_fetch_sequence_mismatch'
    || detail.code === 'cpu_control_signal_behavior_mismatch'
    || detail.code === 'cpu_top_status_behavior_mismatch'
    || (
      detail.code === 'simulation_unknown_metavalue'
      && /\bcpu|processor|risc|pc|fetch|decode|opcode|halt|dm_we\b/i.test([
        detail.relativePath || '',
        detail.assertionLabel || '',
        detail.message || '',
      ].join(' '))
    )
  );
}

function hasCpuBehavioralFailure(failureDetails: GeneratedVhdlFailureDetail[]) {
  return failureDetails.some(isCpuBehavioralFailureDetail);
}

function isProtocolBehavioralFailureDetail(detail: GeneratedVhdlFailureDetail) {
  return (
    detail.code === 'protocol_status_behavior_mismatch'
    || (
      detail.code === 'simulation_unknown_metavalue'
      && /\buart|spi|fifo|bridge|protocol|done_o|error_o|status_o\b/i.test([
        detail.relativePath || '',
        detail.assertionLabel || '',
        detail.message || '',
      ].join(' '))
    )
  );
}

function hasProtocolBehavioralFailure(failureDetails: GeneratedVhdlFailureDetail[]) {
  return failureDetails.some(isProtocolBehavioralFailureDetail);
}

function isCpuBehavioralRelatedPath(relativePath: string) {
  const normalized = relativePath.replace(/\\/g, '/').toLowerCase();
  const baseName = normalized.split('/').pop() || normalized;
  if (!/\.(?:vhd|vhdl)$/.test(normalized)) return false;
  if (/\/tb\//.test(normalized) && /cpu|core|processor|risc|tb_/.test(normalized)) return true;
  return (
    /\b(cpu|core|processor|risc|decoder|control|control_fsm|program_counter|pc|alu|register_file|regfile|instruction|instr|rom|memory)\b/.test(baseName)
    || /cpu|core|processor|risc|decoder|control|control_fsm|program_counter|pc|alu|register_file|regfile|instruction|instr|rom|memory/.test(baseName)
    || /_pkg\.(?:vhd|vhdl)$/.test(baseName)
  );
}

function scoreCpuBehavioralRelatedPath(relativePath: string) {
  const normalized = relativePath.replace(/\\/g, '/').toLowerCase();
  if (/\/tb\//.test(normalized)) return 0;
  if (/cpu_pkg|_pkg/.test(normalized)) return 1;
  if (/decoder|control|control_fsm/.test(normalized)) return 2;
  if (/cpu_top|core/.test(normalized)) return 3;
  if (/program_counter|pc|alu|register_file|regfile/.test(normalized)) return 4;
  return 5;
}

function isProtocolBehavioralRelatedPath(relativePath: string) {
  const normalized = relativePath.replace(/\\/g, '/').toLowerCase();
  const baseName = normalized.split('/').pop() || normalized;
  if (!/\.(?:vhd|vhdl)$/.test(normalized)) return false;
  if (/\/tb\//.test(normalized) && /uart|spi|fifo|bridge|protocol|tb_/.test(normalized)) return true;
  return (
    /\b(uart|spi|fifo|bridge|protocol|control|control_fsm|status|status_error|rx|tx|top)\b/.test(baseName)
    || /uart|spi|fifo|bridge|protocol|control|control_fsm|status|status_error|rx_fifo|tx_fifo|uart_rx|uart_tx|spi_master/.test(baseName)
    || /_pkg\.(?:vhd|vhdl)$/.test(baseName)
  );
}

function scoreProtocolBehavioralRelatedPath(relativePath: string) {
  const normalized = relativePath.replace(/\\/g, '/').toLowerCase();
  if (/\/tb\//.test(normalized)) return 0;
  if (/_pkg/.test(normalized)) return 1;
  if (/bridge.*top|protocol.*top|top/.test(normalized)) return 2;
  if (/bridge_control|control_fsm|status_error|status/.test(normalized)) return 3;
  if (/rx_fifo|tx_fifo|fifo/.test(normalized)) return 4;
  if (/spi_master|uart_rx|uart_tx|uart|spi/.test(normalized)) return 5;
  return 6;
}

function collectCpuBehavioralStimulusLineHints(content: string) {
  const hints: number[] = [];
  const lines = content.split(/\r\n|\r|\n/);
  lines.forEach((line, index) => {
    if (
      /\b(?:instr|instruction|opcode|program|rom|pm_data|imem_data)[a-zA-Z0-9_]*\s*<=/i.test(line)
      || /\b(?:rst|reset)[a-zA-Z0-9_]*\s*<=/i.test(line)
      || /\bwait\s+(?:for|until)\b/i.test(line)
      || /\bcheck_[a-zA-Z0-9_]*\s*\(/i.test(line)
      || /\bFAIL\b/i.test(line)
    ) {
      hints.push(index + 1);
    }
  });
  return hints;
}

function collectProtocolBehavioralStimulusLineHints(content: string) {
  const hints: number[] = [];
  const lines = content.split(/\r\n|\r|\n/);
  lines.forEach((line, index) => {
    if (
      /\b(?:rst|reset|start_i|data_i|uart|spi|done_o|error_o|status_o)[a-zA-Z0-9_]*\s*<=/i.test(line)
      || /\bwait_for_done\s*\(/i.test(line)
      || /\bwait\s+(?:for|until)\b/i.test(line)
      || /\bcheck_[a-zA-Z0-9_]*\s*\(/i.test(line)
      || /\bFAIL\b/i.test(line)
    ) {
      hints.push(index + 1);
    }
  });
  return hints;
}

function summarizeCpuBehavioralInstructionSequence(content: string) {
  const sequence = content
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => /\b(?:instr|instruction|opcode|pm_data|imem_data)[a-zA-Z0-9_]*\s*<=/.test(line))
    .slice(0, 12);
  return sequence.length > 0 ? sequence : [];
}

function summarizeProtocolBehavioralStimulusSequence(content: string) {
  const sequence = content
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => (
      /\b(?:rst|reset|start_i|data_i|done_o|error_o|status_o)[a-zA-Z0-9_]*\s*<=/i.test(line)
      || /\bwait_for_done\s*\(/i.test(line)
      || /\bwait\s+(?:for|until)\b/i.test(line)
      || /\bFAIL\b/i.test(line)
    ))
    .slice(0, 18);
  return sequence.length > 0 ? sequence : [];
}

function summarizeCpuBehavioralProgramSequence(content: string) {
  const sequence = content
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => (
      /\b[0-9]+\s*=>\s*/.test(line)
      || /\bothers\s*=>\s*/i.test(line)
      || /\b(?:OP_|opcode|instr|program|rom|mem)\b/i.test(line)
    ))
    .slice(0, 18);
  return sequence.length > 0 ? sequence : [];
}

function summarizeCpuBehavioralPcExpectations(content: string) {
  const sequence = content
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => /\bpc(?:_q|_out|_val|_addr)?\b/i.test(line) && (/\bFAIL\b/i.test(line) || /=|\/=|report|assert/i.test(line)))
    .slice(0, 12);
  return sequence.length > 0 ? sequence : [];
}

function sliceContinuationLineWindows(content: string, lineNumbers: number[], radius = 45) {
  if (lineNumbers.length === 0) {
    return content;
  }
  const lines = content.split(/\r\n|\r|\n/);
  const windows: Array<{ start: number; end: number }> = [];
  for (const lineNumber of Array.from(new Set(lineNumbers)).sort((left, right) => left - right)) {
    const start = Math.max(1, lineNumber - radius);
    const end = Math.min(lines.length, lineNumber + radius);
    const previous = windows[windows.length - 1];
    if (previous && start <= previous.end + 1) {
      previous.end = Math.max(previous.end, end);
    } else {
      windows.push({ start, end });
    }
  }

  return windows.map((window) => [
    `-- excerpt lines ${window.start}-${window.end}`,
    ...lines.slice(window.start - 1, window.end),
  ].join('\n')).join('\n\n-- ... omitted unrelated lines ...\n\n');
}

function continuationPathMatchesFocusedPath(relativePath: string, focusedPaths: Set<string>) {
  const normalized = relativePath.replace(/\\/g, '/').toLowerCase();
  for (const focusedPath of focusedPaths) {
    if (normalized === focusedPath || normalized.endsWith(`/${focusedPath}`)) {
      return true;
    }
  }
  return false;
}

async function collectSweepContinuationFiles(
  outputRoot: string,
  failureDetails: GeneratedVhdlFailureDetail[] = [],
  fallbackMessage = '',
  options: { poisonedRepair?: boolean } = {},
) {
  const discoveredPaths: string[] = [];
  const focusedPaths = buildFocusedContinuationPathSet(outputRoot, failureDetails, fallbackMessage);
  const lineHints = extractContinuationLineHints(outputRoot, failureDetails, fallbackMessage);
  const poisonedRepair = options.poisonedRepair === true;
  const includeCpuBehavioralContext = hasCpuBehavioralFailure(failureDetails);
  const includeProtocolBehavioralContext = hasProtocolBehavioralFailure(failureDetails);
  const includeBehavioralContext = includeCpuBehavioralContext || includeProtocolBehavioralContext;

  const walk = async (currentPath: string) => {
    let entries;
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch {
      return;
    }
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const absolutePath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }
      const relativePath = path.relative(outputRoot, absolutePath);
      if (!shouldIncludeContinuationFile(relativePath)) {
        continue;
      }
      discoveredPaths.push(relativePath);
    }
  };

  await walk(outputRoot);

  const prioritizedPaths = focusedPaths.size > 0
    ? discoveredPaths.filter((relativePath) => continuationPathMatchesFocusedPath(relativePath, focusedPaths))
    : discoveredPaths;
  const cpuBehavioralPaths = includeCpuBehavioralContext
    ? discoveredPaths
      .filter((relativePath) => !prioritizedPaths.includes(relativePath) && isCpuBehavioralRelatedPath(relativePath))
      .sort((left, right) => scoreCpuBehavioralRelatedPath(left) - scoreCpuBehavioralRelatedPath(right))
    : [];
  const protocolBehavioralPaths = includeProtocolBehavioralContext
    ? discoveredPaths
      .filter((relativePath) => !prioritizedPaths.includes(relativePath) && isProtocolBehavioralRelatedPath(relativePath))
      .sort((left, right) => scoreProtocolBehavioralRelatedPath(left) - scoreProtocolBehavioralRelatedPath(right))
    : [];
  const candidatePaths = Array.from(new Set([
    ...(focusedPaths.size > 0 ? prioritizedPaths : discoveredPaths),
    ...cpuBehavioralPaths,
    ...protocolBehavioralPaths,
  ]));
  const isFocusedFallback = focusedPaths.size > 0;
  const fileLimit = poisonedRepair ? 3 : includeBehavioralContext ? 8 : (isFocusedFallback ? 4 : 10);
  const perFileCharLimit = poisonedRepair ? 1_600 : includeBehavioralContext ? 3_200 : (isFocusedFallback ? 3_000 : 6_000);
  const totalCharLimit = poisonedRepair ? 4_000 : includeBehavioralContext ? 14_000 : (isFocusedFallback ? 9_000 : 18_000);

  const files: SweepContinuationFile[] = [];
  let totalBytes = 0;
  for (const relativePath of candidatePaths.slice(0, fileLimit)) {
    const absolutePath = path.join(outputRoot, relativePath);
    try {
      const content = await fs.readFile(absolutePath, 'utf8');
      const normalizedRelativePath = relativePath.replace(/\\/g, '/').toLowerCase();
      const matchingHints = Array.from(lineHints.entries())
        .filter(([hintPath]) => normalizedRelativePath === hintPath || normalizedRelativePath.endsWith(`/${hintPath}`))
        .flatMap(([, hints]) => hints);
      const cpuStimulusHints = includeCpuBehavioralContext && /(^|\/)tb\//.test(normalizedRelativePath)
        ? collectCpuBehavioralStimulusLineHints(content)
        : [];
      const protocolStimulusHints = includeProtocolBehavioralContext && /(^|\/)tb\//.test(normalizedRelativePath)
        ? collectProtocolBehavioralStimulusLineHints(content)
        : [];
      const allMatchingHints = Array.from(new Set([...matchingHints, ...cpuStimulusHints, ...protocolStimulusHints]));
      const focusedContent = allMatchingHints.length > 0
        ? sliceContinuationLineWindows(content, allMatchingHints, poisonedRepair ? 18 : includeBehavioralContext ? 28 : 45)
        : content;
      const instructionSequence = includeCpuBehavioralContext && /(^|\/)tb\//.test(normalizedRelativePath)
        ? summarizeCpuBehavioralInstructionSequence(content)
        : [];
      const protocolSequence = includeProtocolBehavioralContext && /(^|\/)tb\//.test(normalizedRelativePath)
        ? summarizeProtocolBehavioralStimulusSequence(content)
        : [];
      const programSequence = includeCpuBehavioralContext && /\b(?:rom|program|pmem|imem|memory)\b/i.test(normalizedRelativePath)
        ? summarizeCpuBehavioralProgramSequence(content)
        : [];
      const pcExpectations = includeCpuBehavioralContext && /(^|\/)tb\//.test(normalizedRelativePath)
        ? summarizeCpuBehavioralPcExpectations(content)
        : [];
      const behaviorHeader = [
        ...(instructionSequence.length > 0
          ? [
            '-- AUTOMATA_BEHAVIOR_CONTEXT: CPU instruction stimulus observed in this testbench.',
            ...instructionSequence.map((line) => `--   ${line}`),
            '',
          ]
          : []),
        ...(protocolSequence.length > 0
          ? [
            '-- AUTOMATA_BEHAVIOR_CONTEXT: Protocol bridge stimulus and checks observed in this testbench.',
            ...protocolSequence.map((line) => `--   ${line}`),
            '',
          ]
          : []),
        ...(programSequence.length > 0
          ? [
            '-- AUTOMATA_BEHAVIOR_CONTEXT: CPU program stimulus observed in ROM/program memory.',
            ...programSequence.map((line) => `--   ${line}`),
            '',
          ]
          : []),
        ...(pcExpectations.length > 0
          ? [
            '-- AUTOMATA_BEHAVIOR_CONTEXT: CPU PC expectations observed in this testbench.',
            ...pcExpectations.map((line) => `--   ${line}`),
            '',
          ]
          : []),
      ].join('\n');
      const trimmed = focusedContent.slice(0, perFileCharLimit);
      const renderedContent = `${behaviorHeader}${trimmed}`;
      if (totalBytes + renderedContent.length > totalCharLimit) {
        break;
      }
      totalBytes += renderedContent.length;
      files.push({
        relativePath: relativePath.replace(/\\/g, '/'),
        content: renderedContent,
        kind: inferContinuationFileKind(relativePath),
      });
    } catch {
      continue;
    }
  }

  return files;
}

function renderContinuationFiles(files: SweepContinuationFile[]) {
  return files.map((file) => [
    `### ${file.relativePath}`,
    `\`\`\`${getContinuationFence(file.kind)}`,
    file.content.trimEnd(),
    '```',
  ].join('\n')).join('\n\n');
}

function buildFeedbackItemKey(params: {
  failureCode: string | null;
  failureCategory: string;
  ruleId: string | null;
}) {
  if (params.ruleId) {
    return `rule:${params.ruleId}`;
  }
  if (params.failureCode) {
    return `code:${params.failureCode}`;
  }
  return `category:${params.failureCategory}`;
}

function normalizeValidatorFeedbackItems(details: GeneratedVhdlFailureDetail[]) {
  return details.map((detail) => ({
    failureCode: detail.code || null,
    failureCategory: detail.category || 'other',
    ruleId: detail.ruleId || null,
    ruleIds: detail.ruleIds || [],
    count: 1,
    summary: compactOneLine([
      detail.relativePath && detail.lineHint ? `${detail.relativePath}:${detail.lineHint}` : detail.relativePath || '',
      detail.assertionLabel ? `assertion=${detail.assertionLabel}` : '',
      detail.simulationTime ? `time=${detail.simulationTime}` : '',
      detail.expectedBehavior ? `expected=${detail.expectedBehavior}` : '',
      detail.message,
    ].filter(Boolean).join(' - ')),
    forbiddenConstruct: detail.forbiddenConstruct ? compactOneLine(detail.forbiddenConstruct, 300) : null,
    legalReplacementPattern: detail.legalReplacementPattern ? compactOneLine(detail.legalReplacementPattern, 300) : null,
    source: 'validator' as const,
  }));
}

function feedbackCategoryForFailureCode(code: string | null) {
  if (!code) return 'other';
  if (/staged_|architecture_contract/.test(code)) return 'architecture_contract';
  if (/cpu_.*behavior|protocol_status_behavior|alu_.*behavior|ghdl_simulate_failure|simulation_/.test(code)) return 'simulation_success';
  if (/runtime_bound|range_membership/.test(code)) return 'runtime_bound_risk';
  if (/undriven_top_output|unknown_port|unconnected_required_input|interface_|port_/.test(code)) return 'interface_generic_port_syntax';
  if (/package|record|custom_type/.test(code)) return 'package_type_definition';
  if (/resize|typed_|unsigned|numeric|operator|to_integer|opcode/.test(code)) return 'numeric_std_type_discipline';
  if (/testbench|dut/.test(code)) return 'testbench_structure';
  return 'other';
}

function normalizeRepairAuditFeedbackItems(audit: GeneratedVhdlRepairAuditEntry[] | undefined | null) {
  return (audit || [])
    .filter((entry) => Boolean(entry.failureCode))
    .map((entry) => ({
      failureCode: entry.failureCode,
      failureCategory: feedbackCategoryForFailureCode(entry.failureCode),
      ruleId: null,
      ruleIds: [],
      count: 1,
      summary: compactOneLine([
        entry.fileLine || '',
        entry.repairType ? `repair=${entry.repairType}` : '',
        entry.postRepairValidation?.failureCode ? `post=${entry.postRepairValidation.failureCode}` : '',
        entry.postRepairValidation?.summary || '',
      ].filter(Boolean).join(' - '), 500),
      forbiddenConstruct: entry.fileLine ? compactOneLine(`previous inner repair failure at ${entry.fileLine}`, 300) : null,
      legalReplacementPattern: 'Avoid reintroducing this exact failure class; preserve passing repaired files and repair only the local failing contract.',
      source: 'validator' as const,
    }))
    .filter(isFeedbackEligible);
}

function normalizeDiagnosticFeedbackItem(message: string) {
  const diagnostic = classifyFpgaArchitectLoopFailure(message);
  const failureCode = isModelOutputBudgetExhausted(message)
    ? 'model_output_budget_exhausted'
    : /staged_port_interface_drift|changed the approved (?:generic|port) interface/i.test(message)
      ? 'staged_port_interface_drift'
    : /staged_component_entity_missing|did not declare entity/i.test(message)
      ? 'staged_component_entity_missing'
      : /string length does not match that of anonymous integer subtype|value constraints don't match target ones/i.test(message)
        ? 'vector_literal_width_mismatch'
      : /only one type of logical operators may be used to combine relation/i.test(message)
        ? 'mixed_logical_operator_precedence'
        : null;
  return {
    failureCode,
    failureCategory: diagnostic.category,
    ruleId: null,
    ruleIds: [],
    count: 1,
    summary: compactOneLine(diagnostic.excerpt),
    forbiddenConstruct: failureCode === 'staged_component_entity_missing'
      ? 'staged component VHDL omitted or renamed the exact app-approved entity declaration'
      : failureCode === 'staged_port_interface_drift'
      ? 'staged component VHDL changed the app-approved entity generic/port interface'
      : failureCode === 'vector_literal_width_mismatch'
        ? 'fixed-width bit/hex literal assigned to a vector object with a different declared width'
      : failureCode === 'mixed_logical_operator_precedence'
        ? 'ungrouped boolean expression mixes and/or relation chains'
        : null,
    legalReplacementPattern: failureCode === 'staged_component_entity_missing'
      ? 'regenerate only the failing component with the exact app-owned entity name and interface from the skeleton; do not return package-only code, wrapper entities, JSON, Markdown, or prose'
      : failureCode === 'staged_port_interface_drift'
      ? 'regenerate only the failing component implementation while preserving the exact app-owned entity declaration, generic names/order/defaults, and port names/order/modes/types'
      : failureCode === 'vector_literal_width_mismatch'
        ? "use width-derived literals such as (others => '0'), std_logic_vector(to_unsigned(value, target'length)), to_unsigned(value, target'length), or to_signed(value, target'length)"
      : failureCode === 'mixed_logical_operator_precedence'
        ? 'fully parenthesize every and-chain before combining with or, for example ((not a) and (not b) and r) or (a and b and (not r))'
        : null,
    source: 'diagnostic' as const,
  };
}

function normalizeContractFeedbackItems(issues: FpgaArchitectureContractIssue[]) {
  return summarizeContractIssueBuckets(issues).slice(0, 6).map((bucket) => ({
    failureCode: bucket.code,
    failureCategory: 'architecture_contract',
    ruleId: null,
    ruleIds: [],
    count: bucket.count,
    summary: compactOneLine(`${bucket.code}: ${bucket.examples[0] || 'Architecture contract validation failed.'} Paths: ${bucket.paths.join(', ')}`, 500),
    forbiddenConstruct: 'Invalid or incomplete Architecture Contract V2 JSON path/value.',
    legalReplacementPattern: 'Return one complete JSON object preserving app-owned IDs and fixing the exact failing contract paths.',
    source: 'diagnostic' as const,
  }));
}

const NON_CODE_FEEDBACK_CATEGORIES = new Set([
  'provider_runtime',
  'other',
  'manifest_structure',
  'source_selection',
  'context_budget',
]);

function isCodeRelevantFeedbackCategory(category: string) {
  return !NON_CODE_FEEDBACK_CATEGORIES.has(category);
}

function isFeedbackEligible(item: FpgaArchitectSweepFeedbackItem) {
  if (item.source === 'validator') {
    return true;
  }
  return isCodeRelevantFeedbackCategory(item.failureCategory);
}

function collectFeedbackItemsFromFailure(error: unknown, fallbackMessage: string) {
  const annotatedError = error as FpgaArchitectAttemptErrorLike | undefined;
  const contractIssues = getContractIssuesFromError(error);
  if (contractIssues.length > 0) {
    return normalizeContractFeedbackItems(contractIssues);
  }
  const details = annotatedError?.generatedVhdlValidation?.failureDetails || [];
  if (details.length > 0) {
    return normalizeValidatorFeedbackItems(details).filter(isFeedbackEligible);
  }
  const diagnostic = classifyFpgaArchitectLoopFailure(fallbackMessage);
  if (!isCodeRelevantFeedbackCategory(diagnostic.category)) {
    return [normalizeDiagnosticFeedbackItem(fallbackMessage)].filter(isFeedbackEligible);
  }
  const inferredDetails = inferFailureDetailsFromGhdlMessage(fallbackMessage);
  const inferredFeedbackItems = normalizeValidatorFeedbackItems(inferredDetails).filter((item) => (
    isFeedbackEligible(item)
    && item.failureCode !== 'ghdl_analyze_failure'
    && item.failureCode !== 'ghdl_elaborate_failure'
    && item.failureCode !== 'ghdl_simulate_failure'
  ));
  if (inferredFeedbackItems.length > 0) {
    return inferredFeedbackItems;
  }
  return [normalizeDiagnosticFeedbackItem(fallbackMessage)].filter(isFeedbackEligible);
}

function collectRepairPoisonKeys(
  failureDetails: GeneratedVhdlFailureDetail[],
  fallbackMessage: string,
) {
  const keys = new Set<string>();
  for (const detail of failureDetails) {
    if (!detail.relativePath && !detail.code && !detail.category) continue;
    keys.add([
      (detail.relativePath || 'unknown_file').replace(/\\/g, '/').toLowerCase(),
      detail.code || detail.category || 'unknown_failure',
    ].join('::'));
  }

  if (keys.size > 0) {
    return Array.from(keys);
  }

  const diagnostic = classifyFpgaArchitectLoopFailure(fallbackMessage);
  const absolutePathPattern = /([A-Za-z0-9_./\\ -]+\.(?:vhd|vhdl)):(\d+)(?::\d+)?/g;
  for (const match of fallbackMessage.matchAll(absolutePathPattern)) {
    const normalizedPath = match[1].replace(/\\/g, '/').toLowerCase();
    const basename = normalizedPath.split('/').slice(-3).join('/');
    keys.add(`${basename}::${diagnostic.category}`);
  }
  return Array.from(keys);
}

function countModelQualityGuidancePackets(modelQualityGuidance: string) {
  if (!modelQualityGuidance.trim()) {
    return 0;
  }
  return modelQualityGuidance.split('\n').filter((line) => /^\d+\.\s+/.test(line.trim())).length;
}

function buildBehavioralContextLogLine(
  failureDetails: GeneratedVhdlFailureDetail[],
  continuationFiles: SweepContinuationFile[],
) {
  const hasCpuContext = hasCpuBehavioralFailure(failureDetails);
  const hasProtocolContext = hasProtocolBehavioralFailure(failureDetails);
  if (!hasCpuContext && !hasProtocolContext) {
    return 'Behavioral context: none';
  }
  const failingTbIncluded = continuationFiles.some((file) => /\/tb\/|^tb\//i.test(file.relativePath));
  if (hasProtocolContext && !hasCpuContext) {
    const protocolStimulusFound = continuationFiles.some((file) => /AUTOMATA_BEHAVIOR_CONTEXT: Protocol bridge stimulus/i.test(file.content));
    const protocolRtlFiles = continuationFiles
      .filter((file) => !/\/tb\/|^tb\//i.test(file.relativePath) && isProtocolBehavioralRelatedPath(file.relativePath))
      .map((file) => file.relativePath);
    return [
      'Behavioral context:',
      `protocol TB window included=${failingTbIncluded ? 'yes' : 'no'}`,
      `stimulus found=${protocolStimulusFound ? 'yes' : 'no'}`,
      `protocol RTL files included=${protocolRtlFiles.length > 0 ? protocolRtlFiles.join(', ') : 'none'}`,
    ].join(' ');
  }
  const instructionSequenceFound = continuationFiles.some((file) => /AUTOMATA_BEHAVIOR_CONTEXT: CPU (?:instruction|program) stimulus/i.test(file.content));
  const cpuRtlFiles = continuationFiles
    .filter((file) => !/\/tb\/|^tb\//i.test(file.relativePath) && isCpuBehavioralRelatedPath(file.relativePath))
    .map((file) => file.relativePath);
  return [
    'Behavioral context:',
    `failing TB window included=${failingTbIncluded ? 'yes' : 'no'}`,
    `instruction sequence found=${instructionSequenceFound ? 'yes' : 'no'}`,
    `CPU RTL files included=${cpuRtlFiles.length > 0 ? cpuRtlFiles.join(', ') : 'none'}`,
  ].join(' ');
}

function inferModelQualityGuidanceScope(modelQualityGuidance: string) {
  if (!modelQualityGuidance.trim()) return 'none';
  if (/Scope:\s+universal VHDL rules from global model history/i.test(modelQualityGuidance)) {
    return 'global-universal';
  }
  return 'design-specific';
}

function mergeFeedbackItems(
  feedbackMap: Map<string, FpgaArchitectSweepFeedbackItem>,
  items: FpgaArchitectSweepFeedbackItem[],
) {
  let repeatedKnownFailures = 0;
  let newFailureClasses = 0;

  for (const item of items) {
    const key = buildFeedbackItemKey({
      failureCode: item.failureCode,
      failureCategory: item.failureCategory,
      ruleId: item.ruleId,
    });
    const existing = feedbackMap.get(key);
    if (existing) {
      existing.count += 1;
      existing.summary = item.summary || existing.summary;
      existing.ruleId = existing.ruleId || item.ruleId;
      existing.ruleIds = Array.from(new Set([...(existing.ruleIds || []), ...(item.ruleIds || [])]));
      existing.forbiddenConstruct = item.forbiddenConstruct || existing.forbiddenConstruct;
      existing.legalReplacementPattern = item.legalReplacementPattern || existing.legalReplacementPattern;
      if (existing.source !== 'validator' && item.source === 'validator') {
        existing.source = 'validator';
      }
      repeatedKnownFailures += 1;
      continue;
    }

    feedbackMap.set(key, { ...item });
    newFailureClasses += 1;
  }

  return { repeatedKnownFailures, newFailureClasses };
}

function getSortedFeedbackItems(feedbackMap: Map<string, FpgaArchitectSweepFeedbackItem>, limit = 6) {
  return Array.from(feedbackMap.values())
    .sort((left, right) => {
      if (left.count !== right.count) return right.count - left.count;
      if (left.source !== right.source) return left.source === 'validator' ? -1 : 1;
      return left.failureCategory.localeCompare(right.failureCategory);
    })
    .slice(0, limit);
}

function buildFailureFeedbackSection(items: FpgaArchitectSweepFeedbackItem[]) {
  if (items.length === 0) {
    return '';
  }

  const lines = [
    '## Prior Failure Feedback',
    'Avoid reintroducing the previously observed failure classes below. Treat every forbidden construct as blocked and follow the legal replacement pattern exactly.',
  ];

  for (const [index, item] of items.entries()) {
    lines.push(
     `${index + 1}. Failure family: ${item.failureCategory}${item.failureCode ? ` / ${item.failureCode}` : ''}`,
      ...(item.ruleIds.length > 0 ? [`   Canonical rules: ${item.ruleIds.join(', ')}`] : []),
      `   Seen: ${item.count} prior attempt(s)`,
      `   Source: ${item.source}`,
      `   Summary: ${compactOneLine(item.summary, 500)}`,
    );
    if (item.forbiddenConstruct) {
      lines.push(`   Forbidden construct: ${compactOneLine(item.forbiddenConstruct, 300)}`);
    }
    if (item.legalReplacementPattern) {
      lines.push(`   Legal replacement pattern: ${compactOneLine(item.legalReplacementPattern, 300)}`);
    }
    if (lines.join('\n').length >= SWEEP_FEEDBACK_SECTION_CHAR_LIMIT) {
      lines.push('Additional prior failures omitted to keep repair context compact.');
      break;
    }
  }

  return lines.join('\n').slice(0, SWEEP_FEEDBACK_SECTION_CHAR_LIMIT);
}

export function buildSweepDesignPrompt(params: {
  basePrompt: string;
  preset: FpgaArchitectSweepPreset;
  outputRoot: string;
  designIndex: number;
  failureFeedbackItems?: FpgaArchitectSweepFeedbackItem[] | null;
  continuationFiles?: SweepContinuationFile[] | null;
  modelQualityGuidance?: string | null;
}) {
  const failureFeedbackSection = buildFailureFeedbackSection(params.failureFeedbackItems || []);
  const continuationFiles = params.continuationFiles || [];
  const isRepairContinuation = continuationFiles.length > 0;
  const modelQualityGuidance = params.modelQualityGuidance?.trim() || '';
  return [
    params.basePrompt.trim(),
    '---',
    '# FPGA Architect Design Spec',
    '## Sweep Context',
    `- Sweep design ${params.designIndex + 1}/${FPGA_ARCHITECT_SWEEP_DESIGNS.length}: ${params.preset.label}`,
    `- Mandatory design class: ${params.preset.designClass}`,
    `- Project name: ${params.preset.projectName}`,
    `- Output root: ${params.outputRoot}`,
    isRepairContinuation
      ? '- Continuation rule: repair the current generated project in place. Do not start from a blank project or switch to a different architecture unless the failures prove the current structure cannot be repaired legally.'
      : '- Clean-context rule: do not reuse prior generated files from any other sweep design or prior attempt.',
    `- Why this design is included: ${params.preset.whyItTests}`,
    '',
    '## Objective',
    params.preset.objective,
    '',
    renderMarkdownBulletSection('Required Building Blocks', params.preset.requiredBuildingBlocks),
    '',
    renderMarkdownBulletSection('Required Interfaces', params.preset.requiredInterfaces),
    '',
    renderMarkdownBulletSection('Clocking And Reset Rules', params.preset.clockResetRules),
    '',
    renderMarkdownBulletSection('Datapath And Control Rules', params.preset.dataPathRules),
    '',
    renderMarkdownBulletSection('Verification Requirements', params.preset.verificationRequirements),
    '',
    renderMarkdownBulletSection('Acceptance Criteria', params.preset.acceptanceCriteria),
    '',
    renderMarkdownBulletSection('Forbidden Shortcuts', params.preset.forbiddenShortcuts),
    ...(modelQualityGuidance ? ['', modelQualityGuidance] : []),
    ...(isRepairContinuation ? [
      '',
      '## Repair Continuation Mode',
      '- A previous attempt for this same design already generated project files in the selected output root.',
      '- Treat those existing files as the baseline to fix, not as disposable draft output.',
      '- Preserve already-valid files whenever possible and change only the files necessary to resolve the current failure classes.',
      '- Return a complete corrected Markdown manifest for the repaired project, not prose, not diffs, and not partial patch instructions.',
      '',
      '## Existing Generated Files To Repair',
      renderContinuationFiles(continuationFiles),
    ] : []),
    ...(failureFeedbackSection ? ['', failureFeedbackSection] : []),
    '',
    '## User Request',
    isRepairContinuation
      ? 'Use the structured design spec above together with the existing generated files below. Repair the current project until it satisfies the validator and GHDL flow.'
      : 'Use the structured design spec above as mandatory source-of-truth detail for this sweep attempt.',
  ].join('\n\n');
}

export async function runFpgaArchitectStressLoop(params: {
  ai: GoogleGenAI | null;
  selectedProvider: string;
  selectedModel: string;
  userQuery: string;
  projectPath: string;
  workspaceFileName?: string | null;
  session: LogicProSession;
  sessionManager: SessionManager;
  signal?: AbortSignal;
  prepareAiAnalyzeRequest: (params: Record<string, unknown>) => Promise<PreparedAiAnalyzeRequestLike>;
  runAiAnalyzeJob: (params: Record<string, unknown>) => Promise<any>;
  getProviderDeployment: (provider: string) => 'local' | 'remote';
  requiresRemoteExportConsent: (provider: string) => boolean;
  assertApprovedProjectPath: (session: LogicProSession, candidatePath: string, label?: string) => Promise<string>;
  analyzeWaveformHazards: (...args: any[]) => any;
  analyzeProtocolFrames: (...args: any[]) => any;
  getAiMacroSpec: (...args: any[]) => any;
  getOrBuildMacroSignalIndex: (...args: any[]) => Promise<any>;
  selectMacroSignals: (...args: any[]) => any;
  getSignalName: (...args: any[]) => any;
  formatSignalValue: (...args: any[]) => any;
  buildSignalTransitionSummary: (...args: any[]) => any;
  buildProjectContextFromPath: (...args: any[]) => Promise<any>;
  scrubProjectContextForRemoteExport: (...args: any[]) => any;
  getProviderDescriptors: () => Array<{ id: string; label: string }>;
  buildMacroPromptContract: (params: {
    macroId: 'fpga_vhdl_architect';
    userQuery: string;
    tbGenerationMode: null;
  }) => string;
  applyMandatoryVhdlSkill: (taskPrompt: string) => Promise<any>;
  runModelAnalysis: (params: {
    ai: GoogleGenAI | null;
    provider: string;
    model: string;
    prompt: string;
    signal?: AbortSignal;
    generationProfile?: any;
  }) => Promise<any>;
  validateMacroOutput: (...args: any[]) => any;
  buildArtifactRetryPrompt: (...args: any[]) => string;
  buildValidationRetryPrompt: (...args: any[]) => string;
  extractGeneratedVhdlArtifacts: (...args: any[]) => any;
  saveGeneratedVhdlArtifacts: (...args: any[]) => Promise<any>;
  formatValidationFailureDetails: (...args: any[]) => string;
  parseFpgaArchitectResponse: (...args: any[]) => any;
  buildFpgaArchitectRetryPrompt: (...args: any[]) => string;
  buildFpgaArchitectJsonRepairPrompt: (...args: any[]) => string;
  buildFpgaArchitectProjectStructureRepairPrompt: (...args: any[]) => string;
  buildFpgaArchitectCompactRetryPrompt: (...args: any[]) => string;
  buildFpgaArchitectTestRunPrompt: typeof buildFpgaArchitectTestRunPrompt;
  saveFpgaArchitectProject: (...args: any[]) => Promise<any>;
  buildFpgaArchitectMarkdownReport: (...args: any[]) => string;
  validateGeneratedVhdlWithGhdl: (...args: any[]) => Promise<any>;
  designPresets?: FpgaArchitectSweepPreset[];
  attemptsPerDesign?: number;
  providerRetryDelayMs?: number;
  sweepMode?: FpgaSweepMode;
  onProgress?: (progress: {
    currentLoop: number;
    totalLoops: number;
    completedAttempts: number;
    failures: number;
    successes: number;
    providerPaused?: boolean;
    providerMessage?: string;
    providerRetryAt?: string;
    currentDesignKey: string;
    currentDesignLabel: string;
    currentDesignIndex: number;
    totalDesigns: number;
    currentDesignAttempt: number;
    attemptsPerDesign: number;
    innerRepairAttempt?: number;
    innerRepairTotal?: number;
    innerRepairFailureCode?: string;
    innerRepairFileLine?: string;
    innerRepairStatus?: string;
    architectureStage?: string;
    architectureStageIndex?: number;
    architectureStageTotal?: number;
    architectureStageComponent?: string;
    architectureStageStatus?: string;
  }) => void;
}) {
  const {
    ai,
    selectedProvider,
    selectedModel,
    userQuery,
    projectPath,
    workspaceFileName = null,
    session,
    sessionManager,
    signal,
    prepareAiAnalyzeRequest,
    runAiAnalyzeJob,
    getProviderDeployment,
    requiresRemoteExportConsent,
    assertApprovedProjectPath,
    analyzeWaveformHazards,
    analyzeProtocolFrames,
    getAiMacroSpec,
    getOrBuildMacroSignalIndex,
    selectMacroSignals,
    getSignalName,
    formatSignalValue,
    buildSignalTransitionSummary,
    buildProjectContextFromPath,
    scrubProjectContextForRemoteExport,
    getProviderDescriptors,
    buildMacroPromptContract,
    applyMandatoryVhdlSkill,
    runModelAnalysis,
    validateMacroOutput,
    buildArtifactRetryPrompt,
    buildValidationRetryPrompt,
    extractGeneratedVhdlArtifacts,
    saveGeneratedVhdlArtifacts,
    formatValidationFailureDetails,
    parseFpgaArchitectResponse,
    buildFpgaArchitectRetryPrompt,
    buildFpgaArchitectJsonRepairPrompt,
    buildFpgaArchitectProjectStructureRepairPrompt,
    buildFpgaArchitectCompactRetryPrompt,
    buildFpgaArchitectTestRunPrompt,
    saveFpgaArchitectProject,
    buildFpgaArchitectMarkdownReport,
    validateGeneratedVhdlWithGhdl,
    designPresets = FPGA_ARCHITECT_SWEEP_DESIGNS,
    attemptsPerDesign = FPGA_ARCHITECT_SWEEP_ATTEMPTS_PER_DESIGN,
    providerRetryDelayMs = 60_000,
    sweepMode: requestedSweepMode,
    onProgress,
  } = params;
  const sweepMode = requestedSweepMode || getFpgaPipelineConfig().defaultSweepMode;

  if (getProviderDeployment(selectedProvider) !== 'local') {
    throw new Error('The FPGA Architect multi-design sweep currently supports local providers only.');
  }

  const totalAttempts = designPresets.length * attemptsPerDesign;
  const logDirectory = path.join(projectPath, '.automata-logicpro');
  const masterLogPath = path.join(logDirectory, 'fpga-architect-sweep.log');
  const modelQualityScoreboardPath = path.join(logDirectory, 'model-quality-scoreboard.json');
  const goldenContractDirectory = path.join(logDirectory, 'fpga-architect-golden-contracts');
  const goldenLeafLibraryPath = buildGoldenLeafLibraryPath(projectPath);
  const metaPath = path.join(logDirectory, 'fpga-architect-sweep.meta.json');
  const sweepOutputRoot = path.join(projectPath, 'fpga-architect-sweep');
  const runtimeInfo = await buildFpgaArchitectSweepRuntimeInfo();
  const previousMeta = await readFpgaArchitectSweepMeta(metaPath);
  const staleSweepStateDiscarded = Boolean(
    previousMeta
    && previousMeta.runtimeFingerprint !== runtimeInfo.fingerprint,
  );
  await fs.mkdir(logDirectory, { recursive: true });
  const modelQualityScoreboard = await readModelQualityScoreboard(modelQualityScoreboardPath);
  if (staleSweepStateDiscarded) {
    await fs.rm(sweepOutputRoot, { recursive: true, force: true });
  }
  await fs.mkdir(sweepOutputRoot, { recursive: true });
  await fs.writeFile(
    masterLogPath,
    buildMasterLogHeader({
      selectedProvider,
      selectedModel,
      projectPath,
      totalAttempts,
      runtimeFingerprint: runtimeInfo.fingerprint,
      runtimePid: runtimeInfo.pid,
      staleSweepStateDiscarded,
      previousRuntimeFingerprint: previousMeta?.runtimeFingerprint || null,
    }),
    'utf8',
  );
  await appendLog(masterLogPath, `Sweep Mode: ${sweepMode}`);
  await writeFpgaArchitectSweepMeta(metaPath, runtimeInfo);

  const designSummaries: FpgaArchitectStressLoopDesignSummary[] = [];
  let globalFailures = 0;
  let globalProviderRuntimeFailures = 0;
  let globalContextBudgetFailures = 0;
  let globalArchitectureContractFailures = 0;
  const globalContractIssues: FpgaArchitectureContractIssue[] = [];
  const globalContractAttemptLogPaths: string[] = [];
  let globalContractFallbackUsed = false;
  const results: RunLoopAttemptResult[] = [];
  let currentGlobalAttempt = 0;

  const waitForProviderRetry = async () => {
    if (providerRetryDelayMs <= 0) {
      return;
    }
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const onAbort = () => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        reject(signal?.reason instanceof Error ? signal.reason : new Error('FPGA Architect multi-design sweep was cancelled.'));
      };
      const timer = setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }, providerRetryDelayMs);
      if (signal?.aborted) {
        onAbort();
        return;
      }
      signal?.addEventListener('abort', onAbort, { once: true });
    });
  };

  onProgress?.({
    currentLoop: 0,
    totalLoops: totalAttempts,
    completedAttempts: 0,
    failures: 0,
    successes: 0,
    providerPaused: false,
    providerMessage: '',
    providerRetryAt: '',
    currentDesignKey: designPresets[0]?.key || '',
    currentDesignLabel: designPresets[0]?.label || '',
    currentDesignIndex: designPresets.length > 0 ? 1 : 0,
    totalDesigns: designPresets.length,
    currentDesignAttempt: 0,
    attemptsPerDesign,
    innerRepairAttempt: 0,
    innerRepairTotal: 0,
    innerRepairFailureCode: '',
    innerRepairFileLine: '',
    innerRepairStatus: '',
  });

  for (let designIndex = 0; designIndex < designPresets.length; designIndex += 1) {
    const preset = designPresets[designIndex];
    const designOutputRoot = path.join(sweepOutputRoot, preset.outputFolderName);
    const designLogPath = path.join(logDirectory, preset.logFileName);

    await fs.writeFile(
      designLogPath,
      buildDesignLogHeader({
        preset,
        selectedProvider,
        selectedModel,
        projectPath,
        outputRoot: designOutputRoot,
        runtimeFingerprint: runtimeInfo.fingerprint,
        runtimePid: runtimeInfo.pid,
      }),
      'utf8',
    );
    await appendLog(
      masterLogPath,
      [
        `=== Design ${designIndex + 1}/${designPresets.length}: ${preset.label} ===`,
        `Output Root: ${designOutputRoot}`,
        `Runtime Fingerprint: ${runtimeInfo.fingerprint}`,
        `Started: ${new Date().toISOString()}`,
        '',
      ].join('\n'),
    );

    const designResults: RunLoopAttemptResult[] = [];
    const designFeedbackMap = new Map<string, FpgaArchitectSweepFeedbackItem>();
    const repairPoisonCounts = new Map<string, number>();
    let continuationFiles: SweepContinuationFile[] = [];
    const goldenContract = sweepMode === 'clean_reproducibility'
      ? await readFpgaGoldenContract(goldenContractDirectory, preset)
      : null;
    let approvedArchitectureContract: FpgaArchitectureContract | null = goldenContract?.contract || null;
    let designProviderRuntimeFailures = 0;
    let designContextBudgetFailures = 0;
    let designArchitectureContractFailures = 0;
    const designContractIssues: FpgaArchitectureContractIssue[] = [];
    const designContractAttemptLogPaths: string[] = [];
    let designContractFallbackUsed = false;
    const modelOutputBudgetRetryCounts = new Map<string, number>();
    await appendLog(
      designLogPath,
      [
        `Sweep Mode: ${sweepMode}`,
        `Golden Contract: ${goldenContract ? 'loaded' : 'not available'}`,
        `Architecture Contract Hash: ${goldenContract?.contractHash || 'pending'}`,
      ].join('\n'),
    );

    let designAttempt = 1;
    while (designAttempt <= attemptsPerDesign) {
      if (signal?.aborted) {
        throw signal.reason instanceof Error ? signal.reason : new Error('FPGA Architect multi-design sweep was cancelled.');
      }

      const activeGlobalAttempt = currentGlobalAttempt + 1;
      const attemptKey = `${preset.key}:${designAttempt}`;
      const modelOutputBudgetRetryCount = modelOutputBudgetRetryCounts.get(attemptKey) || 0;
      const reducedPromptProfile = modelOutputBudgetRetryCount > 0;
      onProgress?.({
        currentLoop: activeGlobalAttempt,
        totalLoops: totalAttempts,
        completedAttempts: results.length,
        failures: globalFailures,
        successes: results.length - globalFailures,
        providerPaused: false,
        providerMessage: '',
        providerRetryAt: '',
        currentDesignKey: preset.key,
        currentDesignLabel: preset.label,
        currentDesignIndex: designIndex + 1,
        totalDesigns: designPresets.length,
        currentDesignAttempt: designAttempt,
        attemptsPerDesign,
        innerRepairAttempt: 0,
        innerRepairTotal: 0,
        innerRepairFailureCode: '',
        innerRepairFileLine: '',
        innerRepairStatus: '',
      });

      const attemptHeader = buildAttemptLogHeader({
        attempt: activeGlobalAttempt,
        totalAttempts,
        designAttempt,
        designAttempts: attemptsPerDesign,
        designLabel: preset.label,
      });
      await appendLog(designLogPath, attemptHeader);
      await appendLog(masterLogPath, attemptHeader);
      const isRepairContinuation = sweepMode === 'repair_convergence' && continuationFiles.length > 0 && !reducedPromptProfile;
      if (!isRepairContinuation) {
        await resetDesignOutputRoot(designOutputRoot);
      }
      const activeFeedbackItems = sweepMode === 'repair_convergence' && !reducedPromptProfile
        ? getSortedFeedbackItems(designFeedbackMap)
        : [];
      const modelQualityGuidance = sweepMode === 'repair_convergence' && designAttempt > 1 && !reducedPromptProfile
        ? buildModelQualityGuidanceSection({
          scoreboard: modelQualityScoreboard,
          provider: selectedProvider,
          model: selectedModel,
          macroId: 'fpga_vhdl_architect',
          designKey: preset.key,
          allowGlobalUniversalFallback: false,
        })
        : '';
      const modelQualityGuidancePackets = countModelQualityGuidancePackets(modelQualityGuidance);
      const modelQualityGuidanceScope = inferModelQualityGuidanceScope(modelQualityGuidance);
      const feedbackSnapshot = activeFeedbackItems.length > 0
        ? buildFailureFeedbackSection(activeFeedbackItems)
        : '## Prior Failure Feedback\nNone yet for this design.';
      await appendLog(
        designLogPath,
        [
          `Context mode: ${isRepairContinuation ? 'repair continuation' : 'clean generation'}`,
          `Sweep mode: ${sweepMode}`,
          `Design-specific feedback packets: ${activeFeedbackItems.length}`,
          `Model-quality feedback packets: ${modelQualityGuidancePackets}`,
          `Model-quality feedback scope: ${modelQualityGuidanceScope}`,
          `Continuation file count: ${continuationFiles.length}`,
          `Reduced prompt profile: ${reducedPromptProfile ? 'yes - retrying after model output budget exhaustion' : 'no'}`,
          `Architecture contract: ${approvedArchitectureContract ? 'reused approved contract' : 'proposal required before VHDL generation'}`,
          feedbackSnapshot,
        ].join('\n'),
      );
      await appendLog(
        masterLogPath,
        [
          `Context mode: ${isRepairContinuation ? 'repair continuation' : 'clean generation'}`,
          `Sweep mode: ${sweepMode}`,
          `Design-specific feedback packets: ${activeFeedbackItems.length}`,
          `Model-quality feedback packets: ${modelQualityGuidancePackets}`,
          `Model-quality feedback scope: ${modelQualityGuidanceScope}`,
          `Continuation file count: ${continuationFiles.length}`,
          `Reduced prompt profile: ${reducedPromptProfile ? 'yes - retrying after model output budget exhaustion' : 'no'}`,
          `Architecture contract: ${approvedArchitectureContract ? 'reused approved contract' : 'proposal required before VHDL generation'}`,
          feedbackSnapshot,
        ].join('\n'),
      );

      try {
        let promptContinuationFiles = continuationFiles;
        let designUserQuery = buildSweepDesignPrompt({
          basePrompt: userQuery,
          preset,
          outputRoot: designOutputRoot,
          designIndex,
          failureFeedbackItems: activeFeedbackItems,
          continuationFiles: promptContinuationFiles,
          modelQualityGuidance,
        });
        if (designUserQuery.length > SWEEP_PROMPT_CHAR_BUDGET && promptContinuationFiles.length > 0) {
          promptContinuationFiles = promptContinuationFiles.map((file) => ({
            ...file,
            content: file.content.slice(0, 1_200),
          }));
          designUserQuery = buildSweepDesignPrompt({
            basePrompt: userQuery,
            preset,
            outputRoot: designOutputRoot,
            designIndex,
            failureFeedbackItems: activeFeedbackItems.slice(0, 3),
            continuationFiles: promptContinuationFiles,
            modelQualityGuidance: null,
          });
        }
        if (designUserQuery.length > SWEEP_PROMPT_CHAR_BUDGET) {
          throw makeContextBudgetError(designUserQuery.length, SWEEP_PROMPT_CHAR_BUDGET);
        }
        await appendLog(
          designLogPath,
          `Prompt size: ${designUserQuery.length} chars; feedback packets: ${activeFeedbackItems.length}; continuation files: ${promptContinuationFiles.length}`,
        );
        await appendLog(
          masterLogPath,
          `Prompt size: ${designUserQuery.length} chars; feedback packets: ${activeFeedbackItems.length}; continuation files: ${promptContinuationFiles.length}`,
        );

        const preparedRequest = await prepareAiAnalyzeRequest({
          provider: selectedProvider,
          model: selectedModel,
          signals: [],
          query: designUserQuery,
          timeUnit: 'ns',
          tickDuration: 1,
          projectContext: null,
          projectPath: designOutputRoot,
          workspaceFileName,
          simulationMacroContext: null,
          macroId: 'fpga_vhdl_architect',
          session,
          sessionManager,
          getProviderDeployment,
          requiresRemoteExportConsent,
          assertApprovedProjectPath,
          analyzeWaveformHazards,
          analyzeProtocolFrames,
          getAiMacroSpec,
          getOrBuildMacroSignalIndex,
          selectMacroSignals,
          getSignalName,
          formatSignalValue,
          buildSignalTransitionSummary,
        buildProjectContextFromPath,
        scrubProjectContextForRemoteExport,
        buildMacroPromptContract,
        skipRemoteExportConsentCheck: false,
        skipProjectContextBuild: true,
      });

        const effectiveModel = preparedRequest.selectedModel || selectedModel || '';
        const analysisResult = await runAiAnalyzeJob({
          ai,
          selectedProvider: preparedRequest.selectedProvider,
          selectedModel: effectiveModel,
          macroId: 'fpga_vhdl_architect',
          tbGenerationMode: null,
          systemPrompt: preparedRequest.systemPrompt,
          normalizedProjectPath: preparedRequest.normalizedProjectPath,
          artifactDirectory: preparedRequest.artifactDirectory,
          macroSpec: preparedRequest.macroSpec,
          hazardFindings: preparedRequest.hazardScan.findings,
          protocolFrames: preparedRequest.protocolScan.frames,
          fpgaArchitectExecutionMode: 'test_compact',
          enforceFpgaArchitectureContractGate: true,
          approvedFpgaArchitectureContract: approvedArchitectureContract,
          session,
          sessionManager,
          signal,
          getProviderDescriptors,
          buildMacroPromptContract,
          userQuery: designUserQuery,
          applyMandatoryVhdlSkill,
          runModelAnalysis,
          validateMacroOutput,
          buildArtifactRetryPrompt,
          buildValidationRetryPrompt,
          extractGeneratedVhdlArtifacts,
          saveGeneratedVhdlArtifacts,
          formatValidationFailureDetails,
          parseFpgaArchitectResponse,
          buildFpgaArchitectRetryPrompt,
          buildFpgaArchitectJsonRepairPrompt,
          buildFpgaArchitectProjectStructureRepairPrompt,
          buildFpgaArchitectCompactRetryPrompt,
          buildFpgaArchitectTestRunPrompt,
          saveFpgaArchitectProject,
          buildFpgaArchitectMarkdownReport,
          validateGeneratedVhdlWithGhdl,
          onArchitectureStageProgress: async (stageProgress: {
            stage: string;
            stageIndex: number;
            totalStages: number;
            componentId: string;
            status: string;
          }) => {
            onProgress?.({
              currentLoop: activeGlobalAttempt,
              totalLoops: totalAttempts,
              completedAttempts: results.length,
              failures: globalFailures,
              successes: results.length - globalFailures,
              providerPaused: false,
              providerMessage: '',
              providerRetryAt: '',
              currentDesignKey: preset.key,
              currentDesignLabel: preset.label,
              currentDesignIndex: designIndex + 1,
              totalDesigns: designPresets.length,
              currentDesignAttempt: designAttempt,
              attemptsPerDesign,
              architectureStage: stageProgress.stage,
              architectureStageIndex: stageProgress.stageIndex,
              architectureStageTotal: stageProgress.totalStages,
              architectureStageComponent: stageProgress.componentId,
              architectureStageStatus: stageProgress.status,
            });
            const progressLine = [
              'ARCHITECTURE_STAGE_PROGRESS',
              `stage=${stageProgress.stageIndex}/${stageProgress.totalStages}`,
              `name=${stageProgress.stage}`,
              `component=${stageProgress.componentId || 'none'}`,
              `status=${stageProgress.status}`,
            ].join(' | ');
            await appendLog(designLogPath, progressLine);
            await appendLog(masterLogPath, `${preset.label}\n${progressLine}`);
          },
          onInnerRepairProgress: async (repairProgress: {
            repairAttempt: number;
            repairTotal: number;
            failureCode: string;
            fileLine: string;
            status: string;
          }) => {
            onProgress?.({
              currentLoop: activeGlobalAttempt,
              totalLoops: totalAttempts,
              completedAttempts: results.length,
              failures: globalFailures,
              successes: results.length - globalFailures,
              providerPaused: false,
              providerMessage: '',
              providerRetryAt: '',
              currentDesignKey: preset.key,
              currentDesignLabel: preset.label,
              currentDesignIndex: designIndex + 1,
              totalDesigns: designPresets.length,
              currentDesignAttempt: designAttempt,
              attemptsPerDesign,
              innerRepairAttempt: repairProgress.repairAttempt,
              innerRepairTotal: repairProgress.repairTotal,
              innerRepairFailureCode: repairProgress.failureCode,
              innerRepairFileLine: repairProgress.fileLine,
              innerRepairStatus: repairProgress.status,
            });
            const progressLine = [
              'INNER_REPAIR_PROGRESS',
              `attempt=${repairProgress.repairAttempt}/${repairProgress.repairTotal}`,
              `status=${repairProgress.status}`,
              `failureCode=${repairProgress.failureCode || 'unknown'}`,
              `fileLine=${repairProgress.fileLine || 'unknown'}`,
            ].join(' | ');
            await appendLog(designLogPath, progressLine);
            await appendLog(masterLogPath, `${preset.label}\n${progressLine}`);
          },
        });

        if (analysisResult?.architectureContract) {
          approvedArchitectureContract = analysisResult.architectureContract;
          if (sweepMode === 'clean_reproducibility' && approvedArchitectureContract.schemaVersion === '2.0') {
            await writeFpgaGoldenContract(goldenContractDirectory, preset, approvedArchitectureContract);
          }
        }

        const architectureContractHash = approvedArchitectureContract
          ? hashFpgaArchitectureContract(approvedArchitectureContract)
          : null;
        const generatedVhdlHash = analysisResult?.architectProject
          ? hashGeneratedFpgaVhdl(analysisResult.architectProject)
          : null;
        const goldenLeafPromotion = approvedArchitectureContract && analysisResult?.architectProject
          ? await promotePassedLeafBlocks({
            libraryPath: goldenLeafLibraryPath,
            contract: approvedArchitectureContract,
            project: analysisResult.architectProject,
            sourceDesignKey: preset.key,
            sourceAttempt: activeGlobalAttempt,
            repairCount: analysisResult?.validation?.repairAudit?.length || 0,
          })
          : null;
        const successMessage = [
          'PASS',
          analysisResult?.validation?.summary ? `Validation: ${analysisResult.validation.summary}` : '',
          analysisResult?.outputDirectory ? `Output: ${analysisResult.outputDirectory}` : '',
          architectureContractHash ? `Architecture Contract Hash: ${architectureContractHash}` : '',
          generatedVhdlHash ? `Generated VHDL Hash: ${generatedVhdlHash}` : '',
          goldenLeafPromotion ? `Golden Leaf Blocks: promoted=${goldenLeafPromotion.promoted}; updated=${goldenLeafPromotion.updated}; skipped=${goldenLeafPromotion.skipped}` : '',
        ].filter(Boolean).join('\n');
        const resultEntry: RunLoopAttemptResult = {
          attempt: activeGlobalAttempt,
          designKey: preset.key,
          designLabel: preset.label,
          designAttempt,
          ok: true,
          message: successMessage,
          generatedVhdlValidation: null,
          architectureContractHash,
          generatedVhdlHash,
        };
        currentGlobalAttempt = activeGlobalAttempt;
        results.push(resultEntry);
        designResults.push(resultEntry);
        recordModelQualityAttempt(modelQualityScoreboard, {
          provider: selectedProvider,
          model: effectiveModel,
          macroId: 'fpga_vhdl_architect',
          designKey: preset.key,
          ok: true,
        });
        const successRepairFeedbackItems = normalizeRepairAuditFeedbackItems(analysisResult?.validation?.repairAudit);
        const successFeedbackMergeResult = sweepMode === 'repair_convergence'
          ? mergeFeedbackItems(designFeedbackMap, successRepairFeedbackItems)
          : { repeatedKnownFailures: 0, newFailureClasses: 0 };
        await writeModelQualityScoreboard(modelQualityScoreboardPath, modelQualityScoreboard);
        onProgress?.({
          currentLoop: activeGlobalAttempt,
          totalLoops: totalAttempts,
          completedAttempts: results.length,
          failures: globalFailures,
          successes: results.length - globalFailures,
          providerPaused: false,
          providerMessage: '',
          providerRetryAt: '',
          currentDesignKey: preset.key,
          currentDesignLabel: preset.label,
          currentDesignIndex: designIndex + 1,
          totalDesigns: designPresets.length,
          currentDesignAttempt: designAttempt,
          attemptsPerDesign,
          innerRepairAttempt: 0,
          innerRepairTotal: 0,
          innerRepairFailureCode: '',
          innerRepairFileLine: '',
          innerRepairStatus: '',
        });
        await appendLog(designLogPath, successMessage);
        if (successRepairFeedbackItems.length > 0) {
          const successFeedbackMessage = [
            'PASSED_WITH_INNER_REPAIR_FEEDBACK',
            `Captured repair feedback packets: ${successRepairFeedbackItems.length}`,
            `Repeated known failures: ${successFeedbackMergeResult.repeatedKnownFailures}`,
            `New failure classes: ${successFeedbackMergeResult.newFailureClasses}`,
          ].join('\n');
          await appendLog(designLogPath, successFeedbackMessage);
          await appendLog(masterLogPath, `${preset.label}\n${successFeedbackMessage}`);
        }
        await appendLog(masterLogPath, `PASS\n${preset.label}\n${successMessage}`);
        continuationFiles = [];
        designAttempt += 1;
      } catch (error: any) {
        const message = error?.message || String(error);
        const annotatedError = error as FpgaArchitectAttemptErrorLike | undefined;
        if (annotatedError?.fpgaArchitectureContract) {
          approvedArchitectureContract = annotatedError.fpgaArchitectureContract;
          if (sweepMode === 'clean_reproducibility' && approvedArchitectureContract.schemaVersion === '2.0') {
            await writeFpgaGoldenContract(goldenContractDirectory, preset, approvedArchitectureContract);
          }
        }
        const failureDetails = annotatedError?.generatedVhdlValidation?.failureDetails || [];
      const diagnostic = classifyFpgaArchitectLoopFailureWithValidation({
          message,
          generatedVhdlValidation: annotatedError?.generatedVhdlValidation || null,
        });
        const contractIssues = getContractIssuesFromError(error);
        const isContractFailure = isArchitectureContractFailure(error, diagnostic.category);
        let contractIssueArtifactPath: string | null = null;
        if (isContractFailure) {
          contractIssueArtifactPath = await writeContractIssueArtifact({
            logDirectory,
            preset,
            attempt: activeGlobalAttempt,
            designAttempt,
            issues: contractIssues,
            message,
          });
          globalArchitectureContractFailures += 1;
          designArchitectureContractFailures += 1;
          globalContractIssues.push(...contractIssues);
          designContractIssues.push(...contractIssues);
          globalContractAttemptLogPaths.push(contractIssueArtifactPath);
          designContractAttemptLogPaths.push(contractIssueArtifactPath);
        }
        if (
          isContractFailure
          && designAttempt === attemptsPerDesign
          && !approvedArchitectureContract
          && !designContractFallbackUsed
          && isContractFallbackEligible(contractIssues)
        ) {
          approvedArchitectureContract = buildFpgaArchitectureContractDraft({
            userRequest: buildSweepDesignPrompt({
              basePrompt: `Generate the ${preset.label} preset. Mandatory design class: ${preset.designClass}.`,
              preset,
              outputRoot: designOutputRoot,
              designIndex,
              failureFeedbackItems: [],
              continuationFiles: [],
              modelQualityGuidance: '',
            }),
          });
          designContractFallbackUsed = true;
          globalContractFallbackUsed = true;
          const fallbackMessage = [
            'ARCHITECTURE CONTRACT FALLBACK',
            'All model contract-stage failures for this design are formatting/shape/source-order repair classes.',
            'The app is providing a deterministic baseline Architecture Contract V2 so VHDL generation can proceed under a marked fallback mode.',
            `Fallback contract hash: ${hashFpgaArchitectureContract(approvedArchitectureContract)}`,
          ].join('\n');
          await appendLog(designLogPath, fallbackMessage);
          await appendLog(masterLogPath, `${preset.label}\n${fallbackMessage}`);
          continue;
        }
        if (diagnostic.category === 'provider_runtime') {
          globalProviderRuntimeFailures += 1;
          designProviderRuntimeFailures += 1;
          const retryAt = new Date(Date.now() + Math.max(0, providerRetryDelayMs)).toISOString();
          const pauseMessage = `Provider issue detected. The sweep is paused and will retry attempt ${activeGlobalAttempt}/${totalAttempts} at ${retryAt} without counting this as a failed attempt.`;
          onProgress?.({
            currentLoop: activeGlobalAttempt,
            totalLoops: totalAttempts,
            completedAttempts: results.length,
            failures: globalFailures,
            successes: results.length - globalFailures,
            providerPaused: true,
            providerMessage: pauseMessage,
            providerRetryAt: retryAt,
            currentDesignKey: preset.key,
            currentDesignLabel: preset.label,
            currentDesignIndex: designIndex + 1,
            totalDesigns: designPresets.length,
            currentDesignAttempt: designAttempt,
            attemptsPerDesign,
            innerRepairAttempt: 0,
            innerRepairTotal: 0,
            innerRepairFailureCode: '',
            innerRepairFileLine: '',
            innerRepairStatus: '',
          });
          await appendLog(
            designLogPath,
            [
              'PROVIDER PAUSE',
              message,
              pauseMessage,
              `Retry delay ms: ${Math.max(0, providerRetryDelayMs)}`,
            ].join('\n'),
          );
          await appendLog(
            masterLogPath,
            [
              'PROVIDER PAUSE',
              preset.label,
              message,
              pauseMessage,
              `Retry delay ms: ${Math.max(0, providerRetryDelayMs)}`,
            ].join('\n'),
          );
          recordModelQualityAttempt(modelQualityScoreboard, {
            provider: selectedProvider,
            model: selectedModel,
            macroId: 'fpga_vhdl_architect',
            designKey: preset.key,
            ok: false,
            providerRuntimeFailure: true,
            failure: {
              category: diagnostic.category,
              label: diagnostic.label,
              ruleIds: diagnostic.ruleIds,
              message,
            },
          });
          await writeModelQualityScoreboard(modelQualityScoreboardPath, modelQualityScoreboard);
          await waitForProviderRetry();
          onProgress?.({
            currentLoop: activeGlobalAttempt,
            totalLoops: totalAttempts,
            completedAttempts: results.length,
            failures: globalFailures,
            successes: results.length - globalFailures,
            providerPaused: false,
            providerMessage: '',
            providerRetryAt: '',
            currentDesignKey: preset.key,
            currentDesignLabel: preset.label,
            currentDesignIndex: designIndex + 1,
            totalDesigns: designPresets.length,
            currentDesignAttempt: designAttempt,
            attemptsPerDesign,
            innerRepairAttempt: 0,
            innerRepairTotal: 0,
            innerRepairFailureCode: '',
            innerRepairFileLine: '',
            innerRepairStatus: '',
          });
          continue;
        }
        if (diagnostic.category === 'context_budget' && isModelOutputBudgetExhausted(message)) {
          globalContextBudgetFailures += 1;
          designContextBudgetFailures += 1;
          continuationFiles = [];
          modelOutputBudgetRetryCounts.set(attemptKey, modelOutputBudgetRetryCount + 1);
          if (modelOutputBudgetRetryCount >= 1 && !approvedArchitectureContract) {
            approvedArchitectureContract = buildFpgaArchitectureContractDraft({
              userRequest: buildSweepDesignPrompt({
                basePrompt: `Generate the ${preset.label} preset. Mandatory design class: ${preset.designClass}.`,
                preset,
                outputRoot: designOutputRoot,
                designIndex,
                failureFeedbackItems: [],
                continuationFiles: [],
                modelQualityGuidance: '',
              }),
            });
            designContractFallbackUsed = true;
            globalContractFallbackUsed = true;
            const fallbackMessage = [
              'MODEL OUTPUT CONTRACT FALLBACK',
              'failureCode: model_output_budget_exhausted',
              message,
              'The local model exhausted output while proposing the Architecture Contract JSON twice.',
              'The app is using its deterministic baseline Architecture Contract V2 and retrying the same attempt without counting pass/fail.',
              `Fallback contract hash: ${hashFpgaArchitectureContract(approvedArchitectureContract)}`,
            ].join('\n');
            await appendLog(designLogPath, fallbackMessage);
            await appendLog(masterLogPath, `${preset.label}\n${fallbackMessage}`);
            onProgress?.({
              currentLoop: activeGlobalAttempt,
              totalLoops: totalAttempts,
              completedAttempts: results.length,
              failures: globalFailures,
              successes: results.length - globalFailures,
              providerPaused: false,
              providerMessage: 'Model output budget exhausted twice. Using app-owned architecture contract fallback and retrying the same attempt.',
              providerRetryAt: '',
              currentDesignKey: preset.key,
              currentDesignLabel: preset.label,
              currentDesignIndex: designIndex + 1,
              totalDesigns: designPresets.length,
              currentDesignAttempt: designAttempt,
              attemptsPerDesign,
              innerRepairAttempt: 0,
              innerRepairTotal: 0,
              innerRepairFailureCode: 'model_output_budget_exhausted',
              innerRepairFileLine: '',
              innerRepairStatus: 'using app-owned contract fallback',
            });
            continue;
          }
          const shouldUseReducedPrompt = modelOutputBudgetRetryCount < 1;
          const retryAt = shouldUseReducedPrompt
            ? ''
            : new Date(Date.now() + Math.max(0, providerRetryDelayMs)).toISOString();
          const pauseMessage = shouldUseReducedPrompt
            ? `Model output budget exhausted. Retrying attempt ${activeGlobalAttempt}/${totalAttempts} with a reduced prompt profile; this does not count as pass/fail.`
            : `Model output budget exhausted. The sweep is paused and will retry attempt ${activeGlobalAttempt}/${totalAttempts} at ${retryAt} without counting this as pass/fail.`;
          await appendLog(
            designLogPath,
            [
              'MODEL OUTPUT BUDGET PAUSE',
              'failureCode: model_output_budget_exhausted',
              message,
              pauseMessage,
              `Retry delay ms: ${shouldUseReducedPrompt ? 0 : Math.max(0, providerRetryDelayMs)}`,
            ].join('\n'),
          );
          await appendLog(
            masterLogPath,
            [
              'MODEL OUTPUT BUDGET PAUSE',
              preset.label,
              'failureCode: model_output_budget_exhausted',
              message,
              pauseMessage,
              `Retry delay ms: ${shouldUseReducedPrompt ? 0 : Math.max(0, providerRetryDelayMs)}`,
            ].join('\n'),
          );
          onProgress?.({
            currentLoop: activeGlobalAttempt,
            totalLoops: totalAttempts,
            completedAttempts: results.length,
            failures: globalFailures,
            successes: results.length - globalFailures,
            providerPaused: false,
            providerMessage: pauseMessage,
            providerRetryAt: retryAt,
            currentDesignKey: preset.key,
            currentDesignLabel: preset.label,
            currentDesignIndex: designIndex + 1,
            totalDesigns: designPresets.length,
            currentDesignAttempt: designAttempt,
            attemptsPerDesign,
            innerRepairAttempt: 0,
            innerRepairTotal: 0,
            innerRepairFailureCode: 'model_output_budget_exhausted',
            innerRepairFileLine: '',
            innerRepairStatus: shouldUseReducedPrompt ? 'retrying with reduced prompt' : 'paused before retry',
          });
          if (!shouldUseReducedPrompt) {
            await waitForProviderRetry();
          }
          continue;
        }
        const isContextBudgetFailure = diagnostic.category === 'context_budget';
        if (isContextBudgetFailure) {
          globalContextBudgetFailures += 1;
          designContextBudgetFailures += 1;
        }
        globalFailures += 1;
        const feedbackItems = collectFeedbackItemsFromFailure(error, message);
        const feedbackMergeResult = sweepMode === 'repair_convergence'
          ? mergeFeedbackItems(designFeedbackMap, feedbackItems)
          : { repeatedKnownFailures: 0, newFailureClasses: 0 };
        const poisonKeys = collectRepairPoisonKeys(failureDetails, message);
        let poisonedRepairContinuation = false;
        for (const poisonKey of poisonKeys) {
          const nextCount = (repairPoisonCounts.get(poisonKey) || 0) + 1;
          repairPoisonCounts.set(poisonKey, nextCount);
          if (nextCount >= 2) {
            poisonedRepairContinuation = true;
          }
        }
        const nextContinuationFiles = sweepMode === 'repair_convergence'
          ? await collectSweepContinuationFiles(
            designOutputRoot,
            failureDetails,
            message,
            { poisonedRepair: poisonedRepairContinuation },
          )
          : [];
        const behavioralContextLogLine = buildBehavioralContextLogLine(failureDetails, nextContinuationFiles);
        if (nextContinuationFiles.length > 0) {
          continuationFiles = nextContinuationFiles;
        }
        const resultEntry: RunLoopAttemptResult = {
          attempt: activeGlobalAttempt,
          designKey: preset.key,
          designLabel: preset.label,
          designAttempt,
          ok: false,
          message,
          generatedVhdlValidation: annotatedError?.generatedVhdlValidation || null,
        };
        currentGlobalAttempt = activeGlobalAttempt;
        results.push(resultEntry);
        designResults.push(resultEntry);
        recordModelQualityAttempt(modelQualityScoreboard, {
          provider: selectedProvider,
          model: selectedModel,
          macroId: 'fpga_vhdl_architect',
          designKey: preset.key,
          ok: false,
          failure: {
            category: diagnostic.category,
            label: diagnostic.label,
            failureCode: isContractFailure ? 'architecture_contract_validation_failed' : (feedbackItems[0]?.failureCode || null),
            stage: isContractFailure ? 'architecture_contract' : (isContextBudgetFailure ? 'context_budget' : 'vhdl_generation'),
            issueCodes: isContractFailure ? Array.from(new Set(contractIssues.map((issue) => issue.code))).slice(0, 20) : [],
            issuePaths: isContractFailure ? Array.from(new Set(contractIssues.map((issue) => issue.path))).slice(0, 20) : [],
            ruleIds: diagnostic.ruleIds,
            message,
            forbiddenConstruct: feedbackItems[0]?.forbiddenConstruct || null,
            legalReplacementPattern: feedbackItems[0]?.legalReplacementPattern || null,
          },
        });
        await writeModelQualityScoreboard(modelQualityScoreboardPath, modelQualityScoreboard);
        onProgress?.({
          currentLoop: activeGlobalAttempt,
          totalLoops: totalAttempts,
          completedAttempts: results.length,
          failures: globalFailures,
          successes: results.length - globalFailures,
          providerPaused: false,
          providerMessage: '',
          providerRetryAt: '',
          currentDesignKey: preset.key,
          currentDesignLabel: preset.label,
          currentDesignIndex: designIndex + 1,
          totalDesigns: designPresets.length,
          currentDesignAttempt: designAttempt,
          attemptsPerDesign,
          innerRepairAttempt: 0,
          innerRepairTotal: 0,
          innerRepairFailureCode: '',
          innerRepairFileLine: '',
          innerRepairStatus: '',
        });
        await appendLog(
          designLogPath,
          [
            'FAIL',
            isContractFailure ? 'Architecture proposal failed validation before VHDL generation.' : '',
            message,
            `Failure category: ${diagnostic.label}`,
            isContractFailure ? formatContractIssueLog(contractIssues, contractIssueArtifactPath) : '',
            `Repeated known failures: ${feedbackMergeResult.repeatedKnownFailures}`,
            `New failure classes: ${feedbackMergeResult.newFailureClasses}`,
            `Poisoned repair continuation: ${poisonedRepairContinuation ? 'yes' : 'no'}`,
            `Next continuation files: ${nextContinuationFiles.length}`,
            behavioralContextLogLine,
            formatInnerRepairAuditForLog(annotatedError?.generatedVhdlValidation?.repairAudit),
          ].join('\n'),
        );
        await appendLog(
          masterLogPath,
          [
            'FAIL',
            preset.label,
            isContractFailure ? 'Architecture proposal failed validation before VHDL generation.' : '',
            message,
            `Failure category: ${diagnostic.label}`,
            isContractFailure ? formatContractIssueLog(contractIssues, contractIssueArtifactPath) : '',
            `Repeated known failures: ${feedbackMergeResult.repeatedKnownFailures}`,
            `New failure classes: ${feedbackMergeResult.newFailureClasses}`,
            `Poisoned repair continuation: ${poisonedRepairContinuation ? 'yes' : 'no'}`,
            `Next continuation files: ${nextContinuationFiles.length}`,
            behavioralContextLogLine,
            formatInnerRepairAuditForLog(annotatedError?.generatedVhdlValidation?.repairAudit),
          ].join('\n'),
        );
        designAttempt += 1;
      }
    }

    const designFailureBuckets = summarizeFpgaArchitectLoopFailures(designResults);
    const designFailures = designResults.filter((entry) => !entry.ok).length;
    const designCodeQualityFailures = Math.max(0, designFailures - designContextBudgetFailures - designArchitectureContractFailures);
    const designSuccesses = designResults.length - designFailures;
    const designContractIssueBuckets = summarizeContractIssueBuckets(designContractIssues);
    const reproducibility = summarizeFpgaReproducibility(
      designResults.flatMap((entry) => entry.ok && entry.generatedVhdlHash ? [entry.generatedVhdlHash] : []),
    );
    if (designFailureBuckets.length > 0) {
      await appendLog(
        designLogPath,
        [
          '',
          '=== Failure Categories ===',
          ...designFailureBuckets.map((bucket) =>
            `- ${bucket.label}: ${bucket.count} attempt(s) [${bucket.attempts.join(', ')}]` +
            `${bucket.ruleIds.length > 0 ? `\n  Rules: ${bucket.ruleIds.join(', ')}` : ''}` +
            `\n  Example: ${bucket.example}`
          ),
        ].join('\n'),
      );
    }
    await appendLog(
      designLogPath,
      [
        '',
        `=== Design Summary @ ${new Date().toISOString()} ===`,
        `Attempts: ${attemptsPerDesign}`,
        `Completed Attempts: ${designResults.length}`,
        `Failures: ${designFailures}`,
        `Provider/runtime failures: ${designProviderRuntimeFailures}`,
        `App context-budget failures: ${designContextBudgetFailures}`,
        `Architecture-contract failures: ${designArchitectureContractFailures}`,
        `Code-quality failures: ${designCodeQualityFailures}`,
        `Architecture contract fallback used: ${designContractFallbackUsed ? 'yes' : 'no'}`,
        ...(designContractIssueBuckets.length > 0 ? [
          'Architecture contract issue buckets:',
          ...designContractIssueBuckets.map((bucket) => `- ${bucket.code}: ${bucket.count} issue(s); paths=${bucket.paths.join(', ') || 'unknown'}`),
        ] : []),
        `Successes: ${designSuccesses}`,
        `Unique successful VHDL hashes: ${reproducibility.uniqueOutputHashes}`,
        `Reproducibility rate: ${(reproducibility.reproducibilityRate * 100).toFixed(1)}%`,
      ].join('\n'),
    );
    await appendLog(
      masterLogPath,
      [
        `Summary for ${preset.label}: ${designFailures} failure(s), ${designSuccesses} success(es), ${designResults.length}/${attemptsPerDesign} completed.`,
        `Provider/runtime failures: ${designProviderRuntimeFailures}`,
        `App context-budget failures: ${designContextBudgetFailures}`,
        `Architecture-contract failures: ${designArchitectureContractFailures}`,
        `Code-quality failures: ${designCodeQualityFailures}`,
        `Architecture contract fallback used: ${designContractFallbackUsed ? 'yes' : 'no'}`,
        `Detailed Log: ${designLogPath}`,
        '',
      ].join('\n'),
    );

    designSummaries.push({
      key: preset.key,
      label: preset.label,
      outputRoot: designOutputRoot,
      logFilePath: designLogPath,
      attempts: attemptsPerDesign,
      completedAttempts: designResults.length,
      failures: designFailures,
      providerRuntimeFailures: designProviderRuntimeFailures,
      contextBudgetFailures: designContextBudgetFailures,
      architectureContractFailures: designArchitectureContractFailures,
      codeQualityFailures: designCodeQualityFailures,
      successes: designSuccesses,
      results: designResults,
      failureBuckets: designFailureBuckets,
      feedbackSummaries: getSortedFeedbackItems(designFeedbackMap, Number.MAX_SAFE_INTEGER),
      contractIssueBuckets: designContractIssueBuckets,
      contractAttemptLogPaths: designContractAttemptLogPaths,
      contractFallbackUsed: designContractFallbackUsed,
      uniqueOutputHashes: reproducibility.uniqueOutputHashes,
      reproducibilityRate: reproducibility.reproducibilityRate,
    });
  }

  const failureBuckets = summarizeFpgaArchitectLoopFailures(results);
  const successes = results.filter((entry) => entry.ok).length;
  const globalCodeQualityFailures = Math.max(0, globalFailures - globalContextBudgetFailures - globalArchitectureContractFailures);
  const globalContractIssueBuckets = summarizeContractIssueBuckets(globalContractIssues);
  if (failureBuckets.length > 0) {
    await appendLog(
      masterLogPath,
      [
        '',
        '=== Overall Failure Categories ===',
        ...failureBuckets.map((bucket) =>
          `- ${bucket.label}: ${bucket.count} attempt(s) [${bucket.attempts.join(', ')}]` +
          `${bucket.ruleIds.length > 0 ? `\n  Rules: ${bucket.ruleIds.join(', ')}` : ''}` +
          `\n  Example: ${bucket.example}`
        ),
      ].join('\n'),
    );
  }

  await appendLog(
    masterLogPath,
    [
      '',
      `=== Final Summary @ ${new Date().toISOString()} ===`,
      `Attempts: ${totalAttempts}`,
      `Completed Attempts: ${results.length}`,
      `Failures: ${globalFailures}`,
      `Provider/runtime failures: ${globalProviderRuntimeFailures}`,
      `App context-budget failures: ${globalContextBudgetFailures}`,
      `Architecture-contract failures: ${globalArchitectureContractFailures}`,
      `Code-quality failures: ${globalCodeQualityFailures}`,
      `Architecture contract fallback used: ${globalContractFallbackUsed ? 'yes' : 'no'}`,
      ...(globalContractIssueBuckets.length > 0 ? [
        'Architecture contract issue buckets:',
        ...globalContractIssueBuckets.map((bucket) => `- ${bucket.code}: ${bucket.count} issue(s); paths=${bucket.paths.join(', ') || 'unknown'}`),
      ] : []),
      `Successes: ${successes}`,
      `Model Quality Scoreboard: ${modelQualityScoreboardPath}`,
      'Stopped Early: no',
      `Runtime Fingerprint: ${runtimeInfo.fingerprint}`,
    ].join('\n'),
  );

  return {
    sweepMode,
    attempts: totalAttempts,
    completedAttempts: results.length,
    failures: globalFailures,
    providerRuntimeFailures: globalProviderRuntimeFailures,
    contextBudgetFailures: globalContextBudgetFailures,
    architectureContractFailures: globalArchitectureContractFailures,
    codeQualityFailures: globalCodeQualityFailures,
    successes,
    logFilePath: masterLogPath,
    masterLogPath,
    modelQualityScoreboardPath,
    runtimeFingerprint: runtimeInfo.fingerprint,
    staleSweepStateDiscarded,
    results,
    stoppedEarly: false,
    contractIssueBuckets: globalContractIssueBuckets,
    contractAttemptLogPaths: globalContractAttemptLogPaths,
    contractFallbackUsed: globalContractFallbackUsed,
    failureBuckets,
    designSummaries,
  };
}
