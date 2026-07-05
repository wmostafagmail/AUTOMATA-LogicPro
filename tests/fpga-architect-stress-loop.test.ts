import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { buildFpgaArchitectTestRunPrompt } from '../src/server/fpgaArchitect';
import { createSessionManager } from '../src/server/sessionManager';
import {
  buildSweepDesignPrompt,
  runFpgaArchitectStressLoop,
  type FpgaArchitectSweepFeedbackItem,
  type RunLoopAttemptResult,
} from '../src/server/fpgaArchitectStressLoop';
import { summarizeFpgaArchitectLoopFailures } from '../src/server/fpgaArchitectLoopDiagnostics';
import type { FpgaArchitectSweepPreset } from '../src/fpgaArchitectSweepConfig';

function createTestPreset(key: string, label: string): FpgaArchitectSweepPreset {
  return {
    key,
    label,
    whyItTests: `${label} coverage`,
    projectName: key,
    outputFolderName: key,
    logFileName: `${key}.log`,
    objective: `Generate ${label}.`,
    requiredBuildingBlocks: [`${label} controller`, `${label} datapath`],
    requiredInterfaces: [`${label} clock/reset`, `${label} data interface`],
    clockResetRules: [`${label} deterministic reset`],
    dataPathRules: [`${label} explicit control/datapath split`],
    verificationRequirements: [`${label} self-checking testbench`],
    acceptanceCriteria: [`${label} must pass GHDL compile and simulation`],
    forbiddenShortcuts: [`${label} no placeholder logic`],
  };
}

function createLoopHarness(projectRoot: string) {
  const sessionManager = createSessionManager({ cookieName: 'logicpro-session-id' });
  const session = sessionManager.getOrCreateSession(undefined);
  sessionManager.setApprovedRoot(session, projectRoot);
  return { sessionManager, session };
}

function buildLoopDependencies(projectRoot: string, overrideRunAiAnalyzeJob: (params: any) => Promise<any>) {
  return {
    ai: null,
    selectedProvider: 'ollama',
    selectedModel: 'gemma4:latest',
    userQuery: 'Design an FPGA project.',
    projectPath: projectRoot,
    prepareAiAnalyzeRequest: async (params: any) => ({
      selectedProvider: 'ollama',
      selectedModel: 'gemma4:latest',
      hazardScan: { findings: [] },
      protocolScan: { frames: [] },
      normalizedProjectPath: params.projectPath,
      macroSpec: { label: 'FPGA Architect' },
      artifactDirectory: null,
      systemPrompt: 'system',
    }),
    runAiAnalyzeJob: overrideRunAiAnalyzeJob,
    getProviderDeployment: () => 'local' as const,
    requiresRemoteExportConsent: () => false,
    assertApprovedProjectPath: async (_session: any, candidatePath: string) => candidatePath,
    analyzeWaveformHazards: () => ({ markdown: '', findings: [] }),
    analyzeProtocolFrames: () => ({ markdown: '', frames: [] }),
    getAiMacroSpec: () => ({ label: 'FPGA Architect' }),
    getOrBuildMacroSignalIndex: async () => null,
    selectMacroSignals: () => ({ selectedSignals: [], selectedSignalInsights: [], focusEntities: [], desiredCategories: [] }),
    getSignalName: () => '',
    formatSignalValue: () => '',
    buildSignalTransitionSummary: () => '',
    buildProjectContextFromPath: async () => null,
    scrubProjectContextForRemoteExport: () => null,
    getProviderDescriptors: () => [{ id: 'ollama', label: 'Ollama Local' }],
    buildMacroPromptContract: () => 'contract',
    applyMandatoryVhdlSkill: async () => ({ prompt: 'prepared prompt', selection: null }),
    runModelAnalysis: async () => ({ text: 'unused', telemetry: { inputTokens: null, outputTokens: null, totalTokens: null, tokensPerSecond: null, durationMs: 0 } }),
    validateMacroOutput: () => ({ ok: true, warnings: [] }),
    buildArtifactRetryPrompt: () => 'artifact retry',
    buildValidationRetryPrompt: () => 'validation retry',
    extractGeneratedVhdlArtifacts: () => [],
    saveGeneratedVhdlArtifacts: async () => ({ outputDirectory: projectRoot, savedArtifacts: [] }),
    formatValidationFailureDetails: () => 'validation failed',
    parseFpgaArchitectResponse: () => ({}) as any,
    buildFpgaArchitectRetryPrompt: () => 'retry',
    buildFpgaArchitectJsonRepairPrompt: () => 'json retry',
    buildFpgaArchitectCompactRetryPrompt: () => 'compact retry',
    buildFpgaArchitectTestRunPrompt,
    saveFpgaArchitectProject: async () => ({ outputDirectory: projectRoot, savedFiles: [] }),
    buildFpgaArchitectMarkdownReport: () => 'report',
    validateGeneratedVhdlWithGhdl: async () => ({ ok: true }),
  };
}

test('runFpgaArchitectStressLoop writes master and per-design logs and returns grouped summaries', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-sweep-'));
  const staleMasterLogPath = path.join(projectRoot, '.automata-logicpro', 'fpga-architect-sweep.log');
  await fs.mkdir(path.dirname(staleMasterLogPath), { recursive: true });
  await fs.writeFile(staleMasterLogPath, 'stale-master-content\n', 'utf8');
  const { sessionManager, session } = createLoopHarness(projectRoot);
  const presets = [createTestPreset('alpha', 'Alpha Design'), createTestPreset('beta', 'Beta Design')];

  let runCount = 0;
  const result = await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async (params: any) => {
      runCount += 1;
      if (runCount === 1 || runCount === 4) {
        throw new Error(`failure-${runCount}`);
      }
      return {
        validation: { summary: `Generated VHDL passed GHDL simulation for ${params.normalizedProjectPath}.` },
        outputDirectory: params.normalizedProjectPath,
      };
    }),
    session,
    sessionManager,
    designPresets: presets,
    attemptsPerDesign: 2,
  });

  assert.equal(runCount, 4);
  assert.equal(result.attempts, 4);
  assert.equal(result.completedAttempts, 4);
  assert.equal(result.failures, 2);
  assert.equal(result.successes, 2);
  assert.equal(result.logFilePath, result.masterLogPath);
  assert.equal(result.stoppedEarly, false);
  assert.equal(result.designSummaries.length, 2);
  assert.deepEqual(
    result.designSummaries.map((summary) => ({
      key: summary.key,
      failures: summary.failures,
      successes: summary.successes,
      attempts: summary.attempts,
      completedAttempts: summary.completedAttempts,
    })),
    [
      { key: 'alpha', failures: 1, successes: 1, attempts: 2, completedAttempts: 2 },
      { key: 'beta', failures: 1, successes: 1, attempts: 2, completedAttempts: 2 },
    ],
  );
  assert.deepEqual(
    result.results.map((entry: RunLoopAttemptResult) => ({
      attempt: entry.attempt,
      designKey: entry.designKey,
      designAttempt: entry.designAttempt,
      ok: entry.ok,
    })),
    [
      { attempt: 1, designKey: 'alpha', designAttempt: 1, ok: false },
      { attempt: 2, designKey: 'alpha', designAttempt: 2, ok: true },
      { attempt: 3, designKey: 'beta', designAttempt: 1, ok: true },
      { attempt: 4, designKey: 'beta', designAttempt: 2, ok: false },
    ],
  );

  const masterLogContent = await fs.readFile(result.masterLogPath, 'utf8');
  assert.equal(masterLogContent.includes('stale-master-content'), false);
  assert.match(masterLogContent, /FPGA Architect multi-design sweep/);
  assert.match(masterLogContent, /=== Design 1\/2: Alpha Design ===/);
  assert.match(masterLogContent, /=== Design 2\/2: Beta Design ===/);
  assert.match(masterLogContent, /Summary for Alpha Design: 1 failure\(s\), 1 success\(es\), 2\/2 completed\./);
  assert.match(masterLogContent, /Summary for Beta Design: 1 failure\(s\), 1 success\(es\), 2\/2 completed\./);
  assert.match(masterLogContent, /=== Overall Failure Categories ===/);
  assert.match(masterLogContent, /Stopped Early: no/);

  for (const summary of result.designSummaries) {
    const designLogContent = await fs.readFile(summary.logFilePath, 'utf8');
    assert.match(designLogContent, new RegExp(`Design: ${summary.label}`));
    assert.match(designLogContent, /=== Design Summary @/);
    assert.match(designLogContent, /Completed Attempts: 2/);
  }
});

test('runFpgaArchitectStressLoop executes the full sweep even when the same failure repeats from the start', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-sweep-no-stop-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);
  const presets = [createTestPreset('alpha', 'Alpha Design'), createTestPreset('beta', 'Beta Design')];

  let runCount = 0;
  const result = await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async () => {
      runCount += 1;
      throw new Error('Core logic simulation analysis failed: src/alu.vhd:39:28:error: no overloaded function found matching "resize"');
    }),
    session,
    sessionManager,
    designPresets: presets,
    attemptsPerDesign: 3,
  });

  assert.equal(runCount, 6);
  assert.equal(result.attempts, 6);
  assert.equal(result.completedAttempts, 6);
  assert.equal(result.failures, 6);
  assert.equal(result.successes, 0);
  assert.equal(result.stoppedEarly, false);
  assert.equal(result.failureBuckets.length, 1);
  assert.equal(result.failureBuckets[0]?.label, 'numeric_std Typing');

  const masterLogContent = await fs.readFile(result.masterLogPath, 'utf8');
  assert.equal(masterLogContent.includes('=== Early Stop ==='), false);
  assert.match(masterLogContent, /Completed Attempts: 6/);
});

test('runFpgaArchitectStressLoop emits expanded progress metadata with global and per-design counters', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-sweep-progress-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);
  const presets = [createTestPreset('alpha', 'Alpha Design'), createTestPreset('beta', 'Beta Design')];
  const progressEvents: Array<{
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
  }> = [];

  await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async (params: any) => ({
      validation: { summary: `Generated VHDL passed GHDL simulation for ${params.normalizedProjectPath}.` },
      outputDirectory: params.normalizedProjectPath,
    })),
    session,
    sessionManager,
    designPresets: presets,
    attemptsPerDesign: 2,
    onProgress: (progress) => {
      progressEvents.push(progress);
    },
  });

  assert.deepEqual(progressEvents[0], {
    currentLoop: 0,
    totalLoops: 4,
    completedAttempts: 0,
    failures: 0,
    successes: 0,
    currentDesignKey: 'alpha',
    currentDesignLabel: 'Alpha Design',
    currentDesignIndex: 1,
    totalDesigns: 2,
    currentDesignAttempt: 0,
    attemptsPerDesign: 2,
  });
  assert.deepEqual(progressEvents.slice(1), [
    {
      currentLoop: 1,
      totalLoops: 4,
      completedAttempts: 0,
      failures: 0,
      successes: 0,
      currentDesignKey: 'alpha',
      currentDesignLabel: 'Alpha Design',
      currentDesignIndex: 1,
      totalDesigns: 2,
      currentDesignAttempt: 1,
      attemptsPerDesign: 2,
    },
    {
      currentLoop: 1,
      totalLoops: 4,
      completedAttempts: 1,
      failures: 0,
      successes: 1,
      currentDesignKey: 'alpha',
      currentDesignLabel: 'Alpha Design',
      currentDesignIndex: 1,
      totalDesigns: 2,
      currentDesignAttempt: 1,
      attemptsPerDesign: 2,
    },
    {
      currentLoop: 2,
      totalLoops: 4,
      completedAttempts: 1,
      failures: 0,
      successes: 1,
      currentDesignKey: 'alpha',
      currentDesignLabel: 'Alpha Design',
      currentDesignIndex: 1,
      totalDesigns: 2,
      currentDesignAttempt: 2,
      attemptsPerDesign: 2,
    },
    {
      currentLoop: 2,
      totalLoops: 4,
      completedAttempts: 2,
      failures: 0,
      successes: 2,
      currentDesignKey: 'alpha',
      currentDesignLabel: 'Alpha Design',
      currentDesignIndex: 1,
      totalDesigns: 2,
      currentDesignAttempt: 2,
      attemptsPerDesign: 2,
    },
    {
      currentLoop: 3,
      totalLoops: 4,
      completedAttempts: 2,
      failures: 0,
      successes: 2,
      currentDesignKey: 'beta',
      currentDesignLabel: 'Beta Design',
      currentDesignIndex: 2,
      totalDesigns: 2,
      currentDesignAttempt: 1,
      attemptsPerDesign: 2,
    },
    {
      currentLoop: 3,
      totalLoops: 4,
      completedAttempts: 3,
      failures: 0,
      successes: 3,
      currentDesignKey: 'beta',
      currentDesignLabel: 'Beta Design',
      currentDesignIndex: 2,
      totalDesigns: 2,
      currentDesignAttempt: 1,
      attemptsPerDesign: 2,
    },
    {
      currentLoop: 4,
      totalLoops: 4,
      completedAttempts: 3,
      failures: 0,
      successes: 3,
      currentDesignKey: 'beta',
      currentDesignLabel: 'Beta Design',
      currentDesignIndex: 2,
      totalDesigns: 2,
      currentDesignAttempt: 2,
      attemptsPerDesign: 2,
    },
    {
      currentLoop: 4,
      totalLoops: 4,
      completedAttempts: 4,
      failures: 0,
      successes: 4,
      currentDesignKey: 'beta',
      currentDesignLabel: 'Beta Design',
      currentDesignIndex: 2,
      totalDesigns: 2,
      currentDesignAttempt: 2,
      attemptsPerDesign: 2,
    },
  ]);
});

test('runFpgaArchitectStressLoop rejects remote providers', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-sweep-remote-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);

  await assert.rejects(
    runFpgaArchitectStressLoop({
      ...buildLoopDependencies(projectRoot, async () => {
        throw new Error('should not run');
      }),
      selectedProvider: 'openai',
      selectedModel: 'gpt-model',
      session,
      sessionManager,
      getProviderDeployment: () => 'remote',
    }),
    /currently supports local providers only/,
  );
});

test('buildSweepDesignPrompt renders a structured Markdown design spec instead of a title-only prompt', () => {
  const preset = createTestPreset('alpha', 'Alpha Design');

  const prompt = buildSweepDesignPrompt({
    basePrompt: 'Base FPGA architect contract.',
    preset,
    outputRoot: '/tmp/alpha-output',
    designIndex: 0,
  });

  assert.match(prompt, /# FPGA Architect Design Spec/);
  assert.match(prompt, /## Sweep Context/);
  assert.match(prompt, /## Objective/);
  assert.match(prompt, /## Required Building Blocks/);
  assert.match(prompt, /## Required Interfaces/);
  assert.match(prompt, /## Clocking And Reset Rules/);
  assert.match(prompt, /## Datapath And Control Rules/);
  assert.match(prompt, /## Verification Requirements/);
  assert.match(prompt, /## Acceptance Criteria/);
  assert.match(prompt, /## Forbidden Shortcuts/);
  assert.match(prompt, /## User Request/);
  assert.match(prompt, /Project name: alpha/);
  assert.match(prompt, /Output root: \/tmp\/alpha-output/);
  assert.match(prompt, /Clean-context rule: do not reuse prior generated files/);
  assert.match(prompt, /- Alpha Design controller/);
  assert.match(prompt, /- Alpha Design self-checking testbench/);
  assert.equal(prompt.includes('Design request for this sweep item:'), false);
});

test('buildSweepDesignPrompt appends a compact prior-failure feedback section when feedback items are provided', () => {
  const preset = createTestPreset('alpha', 'Alpha Design');
  const feedbackItems: FpgaArchitectSweepFeedbackItem[] = [
    {
      failureCode: 'reserved_identifier',
      failureCategory: 'identifier_reserved_word',
      ruleId: 'ghdl-identifier-safety',
      ruleIds: ['ghdl-identifier-safety'],
      count: 2,
      summary: 'Reserved VHDL identifier reused as an enum literal.',
      forbiddenConstruct: 'reserved identifier "label" used as enum literal',
      legalReplacementPattern: 'rename "label" to a descriptive non-keyword identifier',
      source: 'validator',
    },
  ];

  const prompt = buildSweepDesignPrompt({
    basePrompt: 'Base FPGA architect contract.',
    preset,
    outputRoot: '/tmp/alpha-output',
    designIndex: 0,
    failureFeedbackItems: feedbackItems,
  });

  assert.match(prompt, /## Prior Failure Feedback/);
  assert.match(prompt, /Failure family: identifier_reserved_word \/ reserved_identifier/);
  assert.match(prompt, /Seen: 2 prior attempt\(s\)/);
  assert.match(prompt, /Forbidden construct: reserved identifier "label" used as enum literal/);
});

test('runFpgaArchitectStressLoop feeds back only prior failures from the same design into later attempts', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-feedback-scope-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);
  const presets = [createTestPreset('alpha', 'Alpha Design'), createTestPreset('beta', 'Beta Design')];
  const seenPrompts: Array<{ projectPath: string; prompt: string }> = [];

  let runCount = 0;
  await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async (params: any) => {
      seenPrompts.push({
        projectPath: params.normalizedProjectPath,
        prompt: params.userQuery,
      });
      runCount += 1;
      throw new Error(runCount <= 2
        ? 'Core logic simulation analysis failed: src/alu.vhd:39:28:error: no overloaded function found matching "resize"'
        : 'Core logic simulation analysis failed: tb/router_tb.vhd:33:3:error: non-shared variable declaration not allowed in architecture body');
    }),
    session,
    sessionManager,
    designPresets: presets,
    attemptsPerDesign: 2,
  });

  assert.equal(seenPrompts.length, 4);
  assert.doesNotMatch(seenPrompts[0]?.prompt || '', /## Prior Failure Feedback/);
  assert.match(seenPrompts[1]?.prompt || '', /## Prior Failure Feedback/);
  assert.match(seenPrompts[1]?.prompt || '', /numeric_std_typing/);
  assert.doesNotMatch(seenPrompts[2]?.prompt || '', /numeric_std_typing/);
  assert.doesNotMatch(seenPrompts[2]?.prompt || '', /## Prior Failure Feedback/);
  assert.match(seenPrompts[3]?.prompt || '', /architecture_variable/);
});

test('runFpgaArchitectStressLoop prefers validator failure details and deduplicates repeated classes by count', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-feedback-dedupe-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);
  const presets = [createTestPreset('alpha', 'Alpha Design')];
  const seenPrompts: string[] = [];

  const structuredFailure = Object.assign(
    new Error('Core logic simulation analysis failed: src/alu.vhd:39:28:error: no overloaded function found matching "resize"'),
    {
      generatedVhdlValidation: {
        ok: false,
        stage: 'prevalidate' as const,
        summary: 'Reserved identifier detected.',
        logs: [],
        validatedTopEntities: [],
        failureCode: 'reserved_identifier',
        failureCategory: 'identifier_reserved_word',
        failureDetails: [
          {
            code: 'reserved_identifier',
            category: 'identifier_reserved_word',
            ruleId: 'ghdl-identifier-safety',
            ruleIds: ['ghdl-identifier-safety'],
            message: 'Reserved VHDL identifier reused as an enum literal.',
            excerpt: 'Reserved VHDL identifier reused as an enum literal.',
            forbiddenConstruct: 'reserved identifier "label" used as enum literal',
            legalReplacementPattern: 'rename "label" to a descriptive non-keyword identifier',
          },
        ],
      },
    },
  );

  await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async (params: any) => {
      seenPrompts.push(params.userQuery);
      throw structuredFailure;
    }),
    session,
    sessionManager,
    designPresets: presets,
    attemptsPerDesign: 3,
  });

  assert.equal(seenPrompts.length, 3);
  assert.doesNotMatch(seenPrompts[0] || '', /## Prior Failure Feedback/);
  assert.match(seenPrompts[1] || '', /identifier_reserved_word \/ reserved_identifier/);
  assert.match(seenPrompts[1] || '', /Seen: 1 prior attempt\(s\)/);
  assert.match(seenPrompts[2] || '', /Seen: 2 prior attempt\(s\)/);
  assert.doesNotMatch(seenPrompts[1] || '', /numeric_std_typing/);
});

test('runFpgaArchitectStressLoop appends newly introduced failure classes to the next attempt feedback', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-feedback-new-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);
  const presets = [createTestPreset('alpha', 'Alpha Design')];
  const seenPrompts: string[] = [];
  let runCount = 0;

  await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async (params: any) => {
      seenPrompts.push(params.userQuery);
      runCount += 1;
      if (runCount === 1) {
        throw new Error('Core logic simulation analysis failed: src/alu.vhd:39:28:error: no overloaded function found matching "resize"');
      }
      throw new Error('Core logic simulation analysis failed: tb/router_tb.vhd:33:3:error: non-shared variable declaration not allowed in architecture body');
    }),
    session,
    sessionManager,
    designPresets: presets,
    attemptsPerDesign: 3,
  });

  assert.match(seenPrompts[1] || '', /numeric_std_typing/);
  assert.match(seenPrompts[2] || '', /numeric_std_typing/);
  assert.match(seenPrompts[2] || '', /architecture_variable/);
});

test('summarizeFpgaArchitectLoopFailures groups newer validator classes into explicit root-cause families', () => {
  const buckets = summarizeFpgaArchitectLoopFailures([
    {
      attempt: 1,
      ok: false,
      message: 'src/pkg.vhd: places a subprogram body inside package declaration "pkg". Package declarations may contain only subprogram signatures.',
    },
    {
      attempt: 2,
      ok: false,
      message: 'src/arr.vhd: declares an illegal multidimensional packed vector form ("std_logic_vector(7 downto 0)(3 downto 0)").',
    },
    {
      attempt: 3,
      ok: false,
      message: 'src/rtl.vhd: assigns signal "done_s" with the variable assignment operator ":=". Signals must use "<=".',
    },
  ]);

  assert.deepEqual(
    buckets.map((bucket) => bucket.label),
    ['Package / Body Misuse', 'Array / Subtype Misuse', 'Signal vs Variable Assignment'],
  );
});
