import fs from 'fs/promises';
import path from 'path';
import type { GoogleGenAI } from '@google/genai';
import type { LogicProSession, createSessionManager } from './sessionManager';
import { buildFpgaArchitectTestRunPrompt } from './fpgaArchitect';
import {
  classifyFpgaArchitectLoopFailure,
  summarizeFpgaArchitectLoopFailures,
} from './fpgaArchitectLoopDiagnostics';
import type { GeneratedVhdlFailureDetail, GeneratedVhdlValidationResult } from './generatedVhdlValidation';
import {
  FPGA_ARCHITECT_SWEEP_ATTEMPTS_PER_DESIGN,
  FPGA_ARCHITECT_SWEEP_DESIGNS,
  FPGA_ARCHITECT_SWEEP_TOTAL_ATTEMPTS,
  type FpgaArchitectSweepPreset,
} from '../fpgaArchitectSweepConfig';

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
};

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
};

export type FpgaArchitectStressLoopResult = {
  attempts: number;
  completedAttempts: number;
  failures: number;
  providerRuntimeFailures: number;
  codeQualityFailures: number;
  successes: number;
  logFilePath: string;
  masterLogPath: string;
  results: RunLoopAttemptResult[];
  stoppedEarly: boolean;
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
}) {
  return [
    `FPGA Architect design sweep`,
    `Design: ${params.preset.label}`,
    `Provider: ${params.selectedProvider}`,
    `Model: ${params.selectedModel}`,
    `Project Root: ${params.projectPath}`,
    `Design Output Root: ${params.outputRoot}`,
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
}) {
  return [
    `FPGA Architect multi-design sweep`,
    `Provider: ${params.selectedProvider}`,
    `Model: ${params.selectedModel}`,
    `Project: ${params.projectPath}`,
    `Designs: ${FPGA_ARCHITECT_SWEEP_DESIGNS.length}`,
    `Attempts per design: ${FPGA_ARCHITECT_SWEEP_ATTEMPTS_PER_DESIGN}`,
    `Total attempts: ${params.totalAttempts}`,
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
    || normalized.endsWith('.sh')
    || normalized.endsWith('.tcl')
    || normalized.endsWith('.xdc')
    || normalized.endsWith('.do')
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

async function collectSweepContinuationFiles(outputRoot: string) {
  const discoveredPaths: string[] = [];

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

  const files: SweepContinuationFile[] = [];
  let totalBytes = 0;
  for (const relativePath of discoveredPaths.slice(0, 18)) {
    const absolutePath = path.join(outputRoot, relativePath);
    try {
      const content = await fs.readFile(absolutePath, 'utf8');
      const trimmed = content.slice(0, 12_000);
      if (totalBytes + trimmed.length > 72_000) {
        break;
      }
      totalBytes += trimmed.length;
      files.push({
        relativePath: relativePath.replace(/\\/g, '/'),
        content: trimmed,
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
    summary: detail.message,
    forbiddenConstruct: detail.forbiddenConstruct || null,
    legalReplacementPattern: detail.legalReplacementPattern || null,
    source: 'validator' as const,
  }));
}

function normalizeDiagnosticFeedbackItem(message: string) {
  const diagnostic = classifyFpgaArchitectLoopFailure(message);
  return {
    failureCode: null,
    failureCategory: diagnostic.category,
    ruleId: null,
    ruleIds: [],
    count: 1,
    summary: diagnostic.excerpt,
    forbiddenConstruct: null,
    legalReplacementPattern: null,
    source: 'diagnostic' as const,
  };
}

const NON_CODE_FEEDBACK_CATEGORIES = new Set([
  'provider_runtime',
  'other',
  'manifest_structure',
  'source_selection',
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
  const details = annotatedError?.generatedVhdlValidation?.failureDetails || [];
  if (details.length > 0) {
    return normalizeValidatorFeedbackItems(details).filter(isFeedbackEligible);
  }
  return [normalizeDiagnosticFeedbackItem(fallbackMessage)].filter(isFeedbackEligible);
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

  items.forEach((item, index) => {
    lines.push(
     `${index + 1}. Failure family: ${item.failureCategory}${item.failureCode ? ` / ${item.failureCode}` : ''}`,
      ...(item.ruleIds.length > 0 ? [`   Canonical rules: ${item.ruleIds.join(', ')}`] : []),
      `   Seen: ${item.count} prior attempt(s)`,
      `   Source: ${item.source}`,
      `   Summary: ${item.summary}`,
    );
    if (item.forbiddenConstruct) {
      lines.push(`   Forbidden construct: ${item.forbiddenConstruct}`);
    }
    if (item.legalReplacementPattern) {
      lines.push(`   Legal replacement pattern: ${item.legalReplacementPattern}`);
    }
  });

  return lines.join('\n');
}

export function buildSweepDesignPrompt(params: {
  basePrompt: string;
  preset: FpgaArchitectSweepPreset;
  outputRoot: string;
  designIndex: number;
  failureFeedbackItems?: FpgaArchitectSweepFeedbackItem[] | null;
  continuationFiles?: SweepContinuationFile[] | null;
}) {
  const failureFeedbackSection = buildFailureFeedbackSection(params.failureFeedbackItems || []);
  const continuationFiles = params.continuationFiles || [];
  const isRepairContinuation = continuationFiles.length > 0;
  return [
    params.basePrompt.trim(),
    '---',
    '# FPGA Architect Design Spec',
    '## Sweep Context',
    `- Sweep design ${params.designIndex + 1}/${FPGA_ARCHITECT_SWEEP_DESIGNS.length}: ${params.preset.label}`,
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
  buildFpgaArchitectCompactRetryPrompt: (...args: any[]) => string;
  buildFpgaArchitectTestRunPrompt: typeof buildFpgaArchitectTestRunPrompt;
  saveFpgaArchitectProject: (...args: any[]) => Promise<any>;
  buildFpgaArchitectMarkdownReport: (...args: any[]) => string;
  validateGeneratedVhdlWithGhdl: (...args: any[]) => Promise<any>;
  designPresets?: FpgaArchitectSweepPreset[];
  attemptsPerDesign?: number;
  onProgress?: (progress: {
    currentLoop: number;
    totalLoops: number;
    completedAttempts: number;
    failures: number;
    successes: number;
    currentDesignKey: string;
    currentDesignLabel: string;
    currentDesignIndex: number;
    totalDesigns: number;
    currentDesignAttempt: number;
    attemptsPerDesign: number;
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
    buildFpgaArchitectCompactRetryPrompt,
    buildFpgaArchitectTestRunPrompt,
    saveFpgaArchitectProject,
    buildFpgaArchitectMarkdownReport,
    validateGeneratedVhdlWithGhdl,
    designPresets = FPGA_ARCHITECT_SWEEP_DESIGNS,
    attemptsPerDesign = FPGA_ARCHITECT_SWEEP_ATTEMPTS_PER_DESIGN,
    onProgress,
  } = params;

  if (getProviderDeployment(selectedProvider) !== 'local') {
    throw new Error('The FPGA Architect multi-design sweep currently supports local providers only.');
  }

  const totalAttempts = designPresets.length * attemptsPerDesign;
  const logDirectory = path.join(projectPath, '.automata-logicpro');
  const masterLogPath = path.join(logDirectory, 'fpga-architect-sweep.log');
  const sweepOutputRoot = path.join(projectPath, 'fpga-architect-sweep');
  await fs.mkdir(logDirectory, { recursive: true });
  await fs.mkdir(sweepOutputRoot, { recursive: true });
  await fs.writeFile(
    masterLogPath,
    buildMasterLogHeader({
      selectedProvider,
      selectedModel,
      projectPath,
      totalAttempts,
    }),
    'utf8',
  );

  const designSummaries: FpgaArchitectStressLoopDesignSummary[] = [];
  let globalFailures = 0;
  let globalProviderRuntimeFailures = 0;
  const results: RunLoopAttemptResult[] = [];
  let currentGlobalAttempt = 0;

  onProgress?.({
    currentLoop: 0,
    totalLoops: totalAttempts,
    completedAttempts: 0,
    failures: 0,
    successes: 0,
    currentDesignKey: designPresets[0]?.key || '',
    currentDesignLabel: designPresets[0]?.label || '',
    currentDesignIndex: designPresets.length > 0 ? 1 : 0,
    totalDesigns: designPresets.length,
    currentDesignAttempt: 0,
    attemptsPerDesign,
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
      }),
      'utf8',
    );
    await appendLog(
      masterLogPath,
      [
        `=== Design ${designIndex + 1}/${designPresets.length}: ${preset.label} ===`,
        `Output Root: ${designOutputRoot}`,
        `Started: ${new Date().toISOString()}`,
        '',
      ].join('\n'),
    );

    const designResults: RunLoopAttemptResult[] = [];
    const designFeedbackMap = new Map<string, FpgaArchitectSweepFeedbackItem>();
    let continuationFiles: SweepContinuationFile[] = [];
    let designProviderRuntimeFailures = 0;

    for (let designAttempt = 1; designAttempt <= attemptsPerDesign; designAttempt += 1) {
      if (signal?.aborted) {
        throw signal.reason instanceof Error ? signal.reason : new Error('FPGA Architect multi-design sweep was cancelled.');
      }

      currentGlobalAttempt += 1;
      onProgress?.({
        currentLoop: currentGlobalAttempt,
        totalLoops: totalAttempts,
        completedAttempts: results.length,
        failures: globalFailures,
        successes: results.length - globalFailures,
        currentDesignKey: preset.key,
        currentDesignLabel: preset.label,
        currentDesignIndex: designIndex + 1,
        totalDesigns: designPresets.length,
        currentDesignAttempt: designAttempt,
        attemptsPerDesign,
      });

      const attemptHeader = buildAttemptLogHeader({
        attempt: currentGlobalAttempt,
        totalAttempts,
        designAttempt,
        designAttempts: attemptsPerDesign,
        designLabel: preset.label,
      });
      await appendLog(designLogPath, attemptHeader);
      await appendLog(masterLogPath, attemptHeader);
      const isRepairContinuation = continuationFiles.length > 0;
      if (!isRepairContinuation) {
        await resetDesignOutputRoot(designOutputRoot);
      }
      const activeFeedbackItems = getSortedFeedbackItems(designFeedbackMap);
      const feedbackSnapshot = activeFeedbackItems.length > 0
        ? buildFailureFeedbackSection(activeFeedbackItems)
        : '## Prior Failure Feedback\nNone yet for this design.';
      await appendLog(
        designLogPath,
        [
          `Continuation mode: ${isRepairContinuation ? 'yes' : 'no'}`,
          `Feedback injected: ${activeFeedbackItems.length > 0 ? 'yes' : 'no'}`,
          feedbackSnapshot,
        ].join('\n'),
      );
      await appendLog(
        masterLogPath,
        [
          `Continuation mode: ${isRepairContinuation ? 'yes' : 'no'}`,
          `Feedback injected: ${activeFeedbackItems.length > 0 ? 'yes' : 'no'}`,
          feedbackSnapshot,
        ].join('\n'),
      );

      try {
        const designUserQuery = buildSweepDesignPrompt({
          basePrompt: userQuery,
          preset,
          outputRoot: designOutputRoot,
          designIndex,
          failureFeedbackItems: activeFeedbackItems,
          continuationFiles,
        });

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
          buildFpgaArchitectCompactRetryPrompt,
          buildFpgaArchitectTestRunPrompt,
          saveFpgaArchitectProject,
          buildFpgaArchitectMarkdownReport,
          validateGeneratedVhdlWithGhdl,
        });

        const successMessage = [
          'PASS',
          analysisResult?.validation?.summary ? `Validation: ${analysisResult.validation.summary}` : '',
          analysisResult?.outputDirectory ? `Output: ${analysisResult.outputDirectory}` : '',
        ].filter(Boolean).join('\n');
        const resultEntry: RunLoopAttemptResult = {
          attempt: currentGlobalAttempt,
          designKey: preset.key,
          designLabel: preset.label,
          designAttempt,
          ok: true,
          message: successMessage,
        };
        results.push(resultEntry);
        designResults.push(resultEntry);
        onProgress?.({
          currentLoop: currentGlobalAttempt,
          totalLoops: totalAttempts,
          completedAttempts: results.length,
          failures: globalFailures,
          successes: results.length - globalFailures,
          currentDesignKey: preset.key,
          currentDesignLabel: preset.label,
          currentDesignIndex: designIndex + 1,
          totalDesigns: designPresets.length,
          currentDesignAttempt: designAttempt,
          attemptsPerDesign,
        });
        await appendLog(designLogPath, successMessage);
        await appendLog(masterLogPath, `PASS\n${preset.label}\n${successMessage}`);
        continuationFiles = [];
      } catch (error: any) {
        globalFailures += 1;
        const message = error?.message || String(error);
        const diagnostic = classifyFpgaArchitectLoopFailure(message);
        if (diagnostic.category === 'provider_runtime') {
          globalProviderRuntimeFailures += 1;
          designProviderRuntimeFailures += 1;
        }
        const feedbackItems = collectFeedbackItemsFromFailure(error, message);
        const feedbackMergeResult = mergeFeedbackItems(designFeedbackMap, feedbackItems);
        const nextContinuationFiles = await collectSweepContinuationFiles(designOutputRoot);
        if (nextContinuationFiles.length > 0) {
          continuationFiles = nextContinuationFiles;
        }
        const resultEntry: RunLoopAttemptResult = {
          attempt: currentGlobalAttempt,
          designKey: preset.key,
          designLabel: preset.label,
          designAttempt,
          ok: false,
          message,
        };
        results.push(resultEntry);
        designResults.push(resultEntry);
        onProgress?.({
          currentLoop: currentGlobalAttempt,
          totalLoops: totalAttempts,
          completedAttempts: results.length,
          failures: globalFailures,
          successes: results.length - globalFailures,
          currentDesignKey: preset.key,
          currentDesignLabel: preset.label,
          currentDesignIndex: designIndex + 1,
          totalDesigns: designPresets.length,
          currentDesignAttempt: designAttempt,
          attemptsPerDesign,
        });
        await appendLog(
          designLogPath,
          [
            'FAIL',
            message,
            `Failure category: ${diagnostic.label}`,
            `Repeated known failures: ${feedbackMergeResult.repeatedKnownFailures}`,
            `New failure classes: ${feedbackMergeResult.newFailureClasses}`,
          ].join('\n'),
        );
        await appendLog(
          masterLogPath,
          [
            'FAIL',
            preset.label,
            message,
            `Failure category: ${diagnostic.label}`,
            `Repeated known failures: ${feedbackMergeResult.repeatedKnownFailures}`,
            `New failure classes: ${feedbackMergeResult.newFailureClasses}`,
          ].join('\n'),
        );
      }
    }

    const designFailureBuckets = summarizeFpgaArchitectLoopFailures(designResults);
    const designFailures = designResults.filter((entry) => !entry.ok).length;
    const designCodeQualityFailures = Math.max(0, designFailures - designProviderRuntimeFailures);
    const designSuccesses = designResults.length - designFailures;
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
        `Code-quality failures: ${designCodeQualityFailures}`,
        `Successes: ${designSuccesses}`,
      ].join('\n'),
    );
    await appendLog(
      masterLogPath,
      [
        `Summary for ${preset.label}: ${designFailures} failure(s), ${designSuccesses} success(es), ${designResults.length}/${attemptsPerDesign} completed.`,
        `Provider/runtime failures: ${designProviderRuntimeFailures}`,
        `Code-quality failures: ${designCodeQualityFailures}`,
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
      codeQualityFailures: designCodeQualityFailures,
      successes: designSuccesses,
      results: designResults,
      failureBuckets: designFailureBuckets,
      feedbackSummaries: getSortedFeedbackItems(designFeedbackMap, Number.MAX_SAFE_INTEGER),
    });
  }

  const failureBuckets = summarizeFpgaArchitectLoopFailures(results);
  const successes = results.filter((entry) => entry.ok).length;
  const globalCodeQualityFailures = Math.max(0, globalFailures - globalProviderRuntimeFailures);
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
      `Code-quality failures: ${globalCodeQualityFailures}`,
      `Successes: ${successes}`,
      'Stopped Early: no',
    ].join('\n'),
  );

  return {
    attempts: totalAttempts,
    completedAttempts: results.length,
    failures: globalFailures,
    providerRuntimeFailures: globalProviderRuntimeFailures,
    codeQualityFailures: globalCodeQualityFailures,
    successes,
    logFilePath: masterLogPath,
    masterLogPath,
    results,
    stoppedEarly: false,
    failureBuckets,
    designSummaries,
  };
}
