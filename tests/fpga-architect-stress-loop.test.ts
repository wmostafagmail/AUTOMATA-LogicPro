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
import { classifyFpgaArchitectLoopFailure, summarizeFpgaArchitectLoopFailures } from '../src/server/fpgaArchitectLoopDiagnostics';
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
  const staleMetaPath = path.join(projectRoot, '.automata-logicpro', 'fpga-architect-sweep.meta.json');
  const staleOutputRoot = path.join(projectRoot, 'fpga-architect-sweep');
  await fs.mkdir(path.dirname(staleMasterLogPath), { recursive: true });
  await fs.writeFile(staleMasterLogPath, 'stale-master-content\n', 'utf8');
  await fs.mkdir(staleOutputRoot, { recursive: true });
  await fs.writeFile(path.join(staleOutputRoot, 'stale.txt'), 'stale', 'utf8');
  await fs.writeFile(
    staleMetaPath,
    JSON.stringify({
      runtimeFingerprint: 'stalefinger01',
      runtimePid: 99999,
      sourceFiles: ['src/server/generatedVhdlValidation.ts'],
      createdAt: '2026-07-10T00:00:00.000Z',
    }, null, 2),
    'utf8',
  );
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
  assert.equal(typeof result.runtimeFingerprint, 'string');
  assert.equal(result.runtimeFingerprint.length, 12);
  assert.equal(result.staleSweepStateDiscarded, true);
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
  assert.match(masterLogContent, /Runtime Fingerprint: /);
  assert.match(masterLogContent, /Stale Sweep State Discarded: yes/);
  assert.match(masterLogContent, /Previous Runtime Fingerprint: stalefinger01/);
  assert.match(masterLogContent, /=== Design 1\/2: Alpha Design ===/);
  assert.match(masterLogContent, /=== Design 2\/2: Beta Design ===/);
  assert.match(masterLogContent, /Summary for Alpha Design: 1 failure\(s\), 1 success\(es\), 2\/2 completed\./);
  assert.match(masterLogContent, /Summary for Beta Design: 1 failure\(s\), 1 success\(es\), 2\/2 completed\./);
  assert.match(masterLogContent, /=== Overall Failure Categories ===/);
  assert.match(masterLogContent, /Stopped Early: no/);

  for (const summary of result.designSummaries) {
    const designLogContent = await fs.readFile(summary.logFilePath, 'utf8');
    assert.match(designLogContent, new RegExp(`Design: ${summary.label}`));
    assert.match(designLogContent, /Runtime Fingerprint: /);
    assert.match(designLogContent, /=== Design Summary @/);
    assert.match(designLogContent, /Completed Attempts: 2/);
  }

  await assert.rejects(fs.stat(path.join(staleOutputRoot, 'stale.txt')));
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

test('runFpgaArchitectStressLoop logs validator-backed categories instead of Other when machine-readable failure details exist', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-sweep-validator-category-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);

  const result = await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async () => {
      const failure = new Error(
        'FPGA Architect hard-failed because the generated project did not pass strict pre-GHDL validation. tb/tb_uart_spi_bridge.vhd: declares procedure "wait_clk" inside an executable region after "begin".',
      ) as Error & { generatedVhdlValidation?: any };
      failure.generatedVhdlValidation = {
        ok: false,
        stage: 'prevalidate',
        summary: 'validator failed',
        logs: [],
        validatedTopEntities: [],
        failureCode: 'declaration_after_begin',
        failureCategory: 'declaration_scope',
        ruleIds: ['ghdl-clocked-variable-discipline'],
        failureDetails: [
          {
            code: 'declaration_after_begin',
            category: 'declaration_scope',
            ruleIds: ['ghdl-clocked-variable-discipline'],
            message: 'tb/tb_uart_spi_bridge.vhd: declares procedure "wait_clk" inside an executable region after "begin".',
            excerpt: 'declares procedure "wait_clk" inside an executable region after "begin"',
            relativePath: 'tb/tb_uart_spi_bridge.vhd',
          },
        ],
      };
      throw failure;
    }),
    session,
    sessionManager,
    designPresets: [createTestPreset('alpha', 'Alpha Design')],
    attemptsPerDesign: 1,
  });

  assert.equal(result.failureBuckets[0]?.label, 'Procedure / Testbench Scope');
  const masterLogContent = await fs.readFile(result.masterLogPath, 'utf8');
  assert.match(masterLogContent, /Failure category: Procedure \/ Testbench Scope/);
  assert.doesNotMatch(masterLogContent, /Failure category: Other/);
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
    providerPaused?: boolean;
    providerMessage?: string;
    providerRetryAt?: string;
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
    providerPaused: false,
    providerMessage: '',
    providerRetryAt: '',
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
      providerPaused: false,
      providerMessage: '',
      providerRetryAt: '',
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
      providerPaused: false,
      providerMessage: '',
      providerRetryAt: '',
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
      providerPaused: false,
      providerMessage: '',
      providerRetryAt: '',
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
      providerPaused: false,
      providerMessage: '',
      providerRetryAt: '',
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
      providerPaused: false,
      providerMessage: '',
      providerRetryAt: '',
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
      providerPaused: false,
      providerMessage: '',
      providerRetryAt: '',
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
      providerPaused: false,
      providerMessage: '',
      providerRetryAt: '',
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
      providerPaused: false,
      providerMessage: '',
      providerRetryAt: '',
      currentDesignKey: 'beta',
      currentDesignLabel: 'Beta Design',
      currentDesignIndex: 2,
      totalDesigns: 2,
      currentDesignAttempt: 2,
      attemptsPerDesign: 2,
    },
  ]);
});

test('runFpgaArchitectStressLoop disables broad project-context rebuilding for sweep attempts', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-sweep-project-context-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);
  const prepareCalls: any[] = [];

  await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async (params: any) => ({
      validation: { summary: `Generated VHDL passed GHDL simulation for ${params.normalizedProjectPath}.` },
      outputDirectory: params.normalizedProjectPath,
    })),
    prepareAiAnalyzeRequest: async (params: any) => {
      prepareCalls.push(params);
      return {
        selectedProvider: 'ollama',
        selectedModel: 'gemma4:latest',
        hazardScan: { findings: [] },
        protocolScan: { frames: [] },
        normalizedProjectPath: params.projectPath,
        macroSpec: { label: 'FPGA Architect' },
        artifactDirectory: null,
        systemPrompt: 'system',
      };
    },
    session,
    sessionManager,
    designPresets: [createTestPreset('alpha', 'Alpha Design')],
    attemptsPerDesign: 1,
  });

  assert.equal(prepareCalls.length, 1);
  assert.equal(prepareCalls[0]?.skipProjectContextBuild, true);
});

test('runFpgaArchitectStressLoop narrows continuation context to the failing file set', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-sweep-continuation-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);
  const prompts: string[] = [];
  let runCount = 0;

  await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async (params: any) => {
      runCount += 1;
      prompts.push(params.userQuery);
      if (runCount === 1) {
        await fs.mkdir(path.join(params.normalizedProjectPath, 'tb'), { recursive: true });
        await fs.mkdir(path.join(params.normalizedProjectPath, 'docs'), { recursive: true });
        await fs.writeFile(
          path.join(params.normalizedProjectPath, 'tb', 'tb_uart_spi_bridge.vhd'),
          'architecture sim of tb_uart_spi_bridge is\nbegin\nend architecture;\n',
          'utf8',
        );
        await fs.writeFile(
          path.join(params.normalizedProjectPath, 'docs', 'notes.md'),
          '# very long unrelated notes\n'.repeat(500),
          'utf8',
        );
        const error = new Error('tb/tb_uart_spi_bridge.vhd: procedure "check_eq" assigns to outer-scope object "fail_flag"');
        (error as any).generatedVhdlValidation = {
          ok: false,
          stage: 'prevalidate',
          summary: 'Generated helper violated declaration scope rules.',
          logs: [],
          validatedTopEntities: [],
          failureCode: 'procedure_outer_scope_write',
          failureCategory: 'declaration_scope',
          failureDetails: [{
            code: 'procedure_outer_scope_write',
            category: 'declaration_scope',
            message: 'tb/tb_uart_spi_bridge.vhd: procedure "check_eq" assigns to outer-scope object "fail_flag" without passing it as a formal parameter.',
            relativePath: 'tb/tb_uart_spi_bridge.vhd',
            forbiddenConstruct: 'procedure "check_eq" mutates outer-scope object "fail_flag"',
            legalReplacementPattern: 'pass "fail_flag" as a formal parameter or keep the mutable state local to the caller',
          }],
        };
        throw error;
      }
      return {
        validation: { summary: `Generated VHDL passed GHDL simulation for ${params.normalizedProjectPath}.` },
        outputDirectory: params.normalizedProjectPath,
      };
    }),
    session,
    sessionManager,
    designPresets: [createTestPreset('alpha', 'Alpha Design')],
    attemptsPerDesign: 2,
  });

  assert.equal(prompts.length, 2);
  assert.match(prompts[1], /### tb\/tb_uart_spi_bridge\.vhd/);
  assert.doesNotMatch(prompts[1], /### docs\/notes\.md/);
});

test('runFpgaArchitectStressLoop reports oversized prompt assembly as context budget, not code quality', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-context-budget-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);
  let modelCalls = 0;

  const result = await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async () => {
      modelCalls += 1;
      return {
        validation: { summary: 'should not be called' },
        outputDirectory: projectRoot,
      };
    }),
    userQuery: 'Oversized prompt '.repeat(20_000),
    session,
    sessionManager,
    designPresets: [createTestPreset('alpha', 'Alpha Design')],
    attemptsPerDesign: 1,
  });

  assert.equal(modelCalls, 0);
  assert.equal(result.failures, 1);
  assert.equal(result.contextBudgetFailures, 1);
  assert.equal(result.codeQualityFailures, 0);
  assert.equal(result.designSummaries[0]?.contextBudgetFailures, 1);
  assert.equal(result.designSummaries[0]?.codeQualityFailures, 0);
  assert.equal(result.failureBuckets[0]?.category, 'context_budget');
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
    modelQualityGuidance: [
      '## Model Quality Scoreboard Guidance',
      'Recurring model-specific failure families to avoid in this attempt:',
      '1. numeric_std Typing (3 occurrence(s))',
      '   Canonical rules: ghdl-no-raw-slv-arithmetic',
    ].join('\n'),
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
  assert.match(prompt, /## Model Quality Scoreboard Guidance/);
  assert.match(prompt, /numeric_std Typing \(3 occurrence\(s\)\)/);
  assert.match(prompt, /ghdl-no-raw-slv-arithmetic/);
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

test('buildSweepDesignPrompt caps oversized prior-failure feedback sections', () => {
  const preset = createTestPreset('alpha', 'Alpha Design');
  const feedbackItems: FpgaArchitectSweepFeedbackItem[] = Array.from({ length: 12 }, (_, index) => ({
    failureCode: `failure_${index}`,
    failureCategory: 'numeric_std_type_discipline',
    ruleId: null,
    ruleIds: [],
    count: index + 1,
    summary: `Very long repeated failure ${index} ${'x'.repeat(1200)}`,
    forbiddenConstruct: `bad construct ${index} ${'y'.repeat(500)}`,
    legalReplacementPattern: `legal replacement ${index} ${'z'.repeat(500)}`,
    source: 'validator',
  }));

  const prompt = buildSweepDesignPrompt({
    basePrompt: 'Base FPGA architect contract.',
    preset,
    outputRoot: '/tmp/alpha-output',
    designIndex: 0,
    failureFeedbackItems: feedbackItems,
  });

  const feedbackSection = prompt.slice(prompt.indexOf('## Prior Failure Feedback'));
  assert.ok(feedbackSection.length < 3_300);
  assert.match(feedbackSection, /Additional prior failures omitted|Failure family:/);
});

test('buildSweepDesignPrompt switches to repair continuation mode when prior generated files are provided', () => {
  const preset = createTestPreset('alpha', 'Alpha Design');

  const prompt = buildSweepDesignPrompt({
    basePrompt: 'Base FPGA architect contract.',
    preset,
    outputRoot: '/tmp/alpha-output',
    designIndex: 0,
    continuationFiles: [
      {
        relativePath: 'src/alu.vhd',
        content: 'entity alu is end entity;',
        kind: 'vhdl',
      },
    ],
  });

  assert.match(prompt, /## Repair Continuation Mode/);
  assert.match(prompt, /repair the current generated project in place/i);
  assert.match(prompt, /## Existing Generated Files To Repair/);
  assert.match(prompt, /### src\/alu\.vhd/);
  assert.doesNotMatch(prompt, /Clean-context rule: do not reuse prior generated files/);
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
  assert.match(seenPrompts[1]?.prompt || '', /resize_on_raw_std_logic_vector/);
  assert.doesNotMatch(seenPrompts[2]?.prompt || '', /resize_on_raw_std_logic_vector/);
  assert.doesNotMatch(seenPrompts[2]?.prompt || '', /## Prior Failure Feedback/);
  assert.doesNotMatch(seenPrompts[2]?.prompt || '', /## Model Quality Scoreboard Guidance/);
  assert.match(seenPrompts[3]?.prompt || '', /architecture_body_variable/);
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
  assert.doesNotMatch(seenPrompts[1] || '', /resize_on_raw_std_logic_vector/);
});

test('runFpgaArchitectStressLoop records model quality failures and injects them into later attempts', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-model-quality-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);
  const presets = [createTestPreset('alpha', 'Alpha Design')];
  const seenPrompts: string[] = [];
  let runCount = 0;

  const structuredFailure = Object.assign(
    new Error('Core logic simulation analysis failed: src/alu.vhd:39:28:error: no overloaded function found matching "resize"'),
    {
      generatedVhdlValidation: {
        ok: false,
        stage: 'prevalidate' as const,
        summary: 'resize called on an untyped std_logic_vector operand.',
        logs: [],
        validatedTopEntities: [],
        failureCode: 'resize_on_raw_std_logic_vector',
        failureCategory: 'numeric_std_typing',
        ruleIds: ['ghdl-no-raw-slv-arithmetic'],
        failureDetails: [
          {
            code: 'resize_on_raw_std_logic_vector',
            category: 'numeric_std_typing',
            ruleId: 'ghdl-no-raw-slv-arithmetic',
            ruleIds: ['ghdl-no-raw-slv-arithmetic'],
            message: 'src/alu.vhd:39:28: resize called on raw std_logic_vector operand.',
            excerpt: 'res_val := resize(a, DATA_WIDTH);',
            relativePath: 'src/alu.vhd',
          },
        ],
      },
    },
  );

  const result = await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async (params: any) => {
      seenPrompts.push(params.userQuery);
      runCount += 1;
      if (runCount === 1) {
        throw structuredFailure;
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

  assert.equal(seenPrompts.length, 2);
  assert.doesNotMatch(seenPrompts[0] || '', /## Model Quality Scoreboard Guidance/);
  assert.match(seenPrompts[1] || '', /## Model Quality Scoreboard Guidance/);
  assert.match(seenPrompts[1] || '', /numeric_std Typing/);
  assert.match(seenPrompts[1] || '', /ghdl-no-raw-slv-arithmetic/);
  assert.equal(result.failures, 1);
  assert.equal(result.successes, 1);

  const scoreboardRaw = await fs.readFile(result.modelQualityScoreboardPath, 'utf8');
  const scoreboard = JSON.parse(scoreboardRaw);
  const entry = Object.values(scoreboard.models)[0] as any;
  assert.equal(entry.provider, 'ollama');
  assert.equal(entry.model, 'gemma4:latest');
  assert.equal(entry.macroId, 'fpga_vhdl_architect');
  assert.equal(entry.attempts, 2);
  assert.equal(entry.successes, 1);
  assert.equal(entry.codeQualityFailures, 1);
  assert.equal(entry.designs.alpha.attempts, 2);
  assert.equal(entry.designs.alpha.codeQualityFailures, 1);
});

test('runFpgaArchitectStressLoop keeps first design attempts free of prior model-quality guidance', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-model-quality-clean-first-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);
  const presets = [createTestPreset('alpha', 'Alpha Design'), createTestPreset('beta', 'Beta Design')];
  const seenPrompts: string[] = [];
  let runCount = 0;

  await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async (params: any) => {
      seenPrompts.push(params.userQuery);
      runCount += 1;
      if (runCount === 1) {
        throw Object.assign(
          new Error('Core logic simulation analysis failed: src/alu.vhd:39:28:error: no overloaded function found matching "resize"'),
          {
            generatedVhdlValidation: {
              ok: false,
              stage: 'prevalidate' as const,
              summary: 'resize called on raw std_logic_vector operand.',
              logs: [],
              validatedTopEntities: [],
              failureCode: 'resize_on_raw_std_logic_vector',
              failureCategory: 'numeric_std_type_discipline',
              failureDetails: [
                {
                  code: 'resize_on_raw_std_logic_vector',
                  category: 'numeric_std_type_discipline',
                  ruleId: 'ghdl-no-raw-slv-arithmetic',
                  ruleIds: ['ghdl-no-raw-slv-arithmetic'],
                  message: 'src/alu.vhd:39:28: resize called on raw std_logic_vector operand.',
                  relativePath: 'src/alu.vhd',
                  lineHint: 39,
                },
              ],
            },
          },
        );
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

  assert.equal(seenPrompts.length, 4);
  assert.doesNotMatch(seenPrompts[0] || '', /## Model Quality Scoreboard Guidance/);
  assert.match(seenPrompts[1] || '', /## Model Quality Scoreboard Guidance/);
  assert.doesNotMatch(seenPrompts[2] || '', /## Model Quality Scoreboard Guidance/);
  assert.doesNotMatch(seenPrompts[2] || '', /resize_on_raw_std_logic_vector/);
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

  assert.match(seenPrompts[1] || '', /resize_on_raw_std_logic_vector/);
  assert.match(seenPrompts[2] || '', /resize_on_raw_std_logic_vector/);
  assert.match(seenPrompts[2] || '', /architecture_body_variable/);
});

test('runFpgaArchitectStressLoop does not feed provider/runtime failures into the next attempt feedback', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-feedback-provider-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);
  const presets = [createTestPreset('alpha', 'Alpha Design')];
  const seenPrompts: string[] = [];
  let runCount = 0;

  await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async (params: any) => {
      seenPrompts.push(params.userQuery);
      runCount += 1;
      if (runCount === 1) {
        throw new Error('Core logic simulation analysis failed: Ollama is reachable at http://127.0.0.1:11434, but text generation failed for model "gemma4:latest". Original error: fetch failed');
      }
      throw new Error('Core logic simulation analysis failed: src/alu.vhd:39:28:error: no overloaded function found matching "resize"');
    }),
    session,
    sessionManager,
    designPresets: presets,
    attemptsPerDesign: 2,
    providerRetryDelayMs: 0,
  });

  assert.equal(seenPrompts.length, 3);
  assert.doesNotMatch(seenPrompts[1] || '', /provider_runtime/);
  assert.doesNotMatch(seenPrompts[1] || '', /## Prior Failure Feedback/);
  assert.doesNotMatch(seenPrompts[2] || '', /provider_runtime/);
  assert.match(seenPrompts[2] || '', /resize_on_raw_std_logic_vector/);
});

test('runFpgaArchitectStressLoop does not feed manifest or source-selection failures into the next attempt feedback', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-feedback-non-code-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);
  const presets = [createTestPreset('alpha', 'Alpha Design')];
  const seenPrompts: string[] = [];
  let runCount = 0;

  await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async (params: any) => {
      seenPrompts.push(params.userQuery);
      runCount += 1;
      if (runCount === 1) {
        throw new Error('Core logic simulation analysis failed: FPGA Architect hard-failed because the generated project manifest was still invalid before VHDL validation.');
      }
      throw new Error('Core logic simulation analysis failed: The generated validation source set was empty after selection.');
    }),
    session,
    sessionManager,
    designPresets: presets,
    attemptsPerDesign: 2,
  });

  assert.equal(seenPrompts.length, 2);
  assert.doesNotMatch(seenPrompts[1] || '', /manifest_structure/);
  assert.doesNotMatch(seenPrompts[1] || '', /source_selection/);
  assert.doesNotMatch(seenPrompts[1] || '', /## Prior Failure Feedback/);
});

test('runFpgaArchitectStressLoop carries failed generated files into the next attempt as repair continuation context', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-repair-continuation-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);
  const presets = [createTestPreset('alpha', 'Alpha Design')];
  const seenPrompts: string[] = [];
  let runCount = 0;

  await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async (params: any) => {
      seenPrompts.push(params.userQuery);
      runCount += 1;
      if (runCount === 1) {
        const generatedPath = path.join(params.normalizedProjectPath, 'src', 'alu.vhd');
        await fs.mkdir(path.dirname(generatedPath), { recursive: true });
        await fs.writeFile(generatedPath, 'entity alu is end entity;\n', 'utf8');
        throw new Error('Core logic simulation analysis failed: src/alu.vhd:39:28:error: no overloaded function found matching "resize"');
      }
      throw new Error('Core logic simulation analysis failed: src/alu.vhd:47:24:error: no function declarations for operator "and"');
    }),
    session,
    sessionManager,
    designPresets: presets,
    attemptsPerDesign: 2,
  });

  assert.equal(seenPrompts.length, 2);
  assert.doesNotMatch(seenPrompts[0] || '', /## Repair Continuation Mode/);
  assert.match(seenPrompts[1] || '', /## Repair Continuation Mode/);
  assert.match(seenPrompts[1] || '', /### src\/alu\.vhd/);
  assert.match(seenPrompts[1] || '', /entity alu is end entity;/);
});

test('runFpgaArchitectStressLoop enriches CPU halt simulation failures with TB stimulus and CPU RTL context', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-cpu-behavior-context-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);
  const presets = [createTestPreset('mini-cpu', 'Mini CPU Design')];
  const seenPrompts: string[] = [];
  let runCount = 0;

  await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async (params: any) => {
      seenPrompts.push(params.userQuery);
      runCount += 1;

      const tbPath = path.join(params.normalizedProjectPath, 'tb', 'tb_cpu_top.vhd');
      const decoderPath = path.join(params.normalizedProjectPath, 'src', 'decoder.vhd');
      const controlPath = path.join(params.normalizedProjectPath, 'src', 'control_fsm.vhd');
      const docsPath = path.join(params.normalizedProjectPath, 'docs', 'notes.md');
      await fs.mkdir(path.dirname(tbPath), { recursive: true });
      await fs.mkdir(path.dirname(decoderPath), { recursive: true });
      await fs.mkdir(path.dirname(controlPath), { recursive: true });
      await fs.mkdir(path.dirname(docsPath), { recursive: true });
      await fs.writeFile(
        tbPath,
        [
          'entity tb_cpu_top is end entity;',
          'architecture sim of tb_cpu_top is',
          '  signal clk : std_logic := \'0\';',
          '  signal rst : std_logic := \'1\';',
          '  signal instr_data : std_logic_vector(7 downto 0);',
          'begin',
          '  stimulus : process',
          '  begin',
          '    rst <= \'1\';',
          '    wait for 20 ns;',
          '    rst <= \'0\';',
          ...Array.from({ length: 70 }, (_, index) => `    -- filler ${index + 1}`),
          '    instr_data <= "00000000"; wait until rising_edge(clk);',
          '    instr_data <= "11111111"; wait until rising_edge(clk);',
          '    report "FAIL halt_cycle_1" severity error;',
          '    wait;',
          '  end process;',
          'end architecture;',
          '',
        ].join('\n'),
        'utf8',
      );
      await fs.writeFile(decoderPath, 'entity decoder is end entity;\narchitecture rtl of decoder is begin end architecture;\n', 'utf8');
      await fs.writeFile(controlPath, 'entity control_fsm is end entity;\narchitecture rtl of control_fsm is begin end architecture;\n', 'utf8');
      await fs.writeFile(docsPath, '# unrelated notes\n'.repeat(100), 'utf8');

      if (runCount === 1) {
        const error = new Error(`${tbPath}:84:5:@206ns:(report error): FAIL halt_cycle_1`);
        (error as any).generatedVhdlValidation = {
          ok: false,
          stage: 'simulate',
          summary: 'Generated VHDL failed GHDL simulation for tb_cpu_top.',
          logs: [],
          validatedTopEntities: ['tb_cpu_top'],
          failureCode: 'cpu_halt_behavior_mismatch',
          failureCategory: 'simulation_success',
          failureDetails: [{
            code: 'cpu_halt_behavior_mismatch',
            category: 'simulation_success',
            message: 'tb/tb_cpu_top.vhd:84: assertion failed at 206ns: FAIL halt_cycle_1',
            excerpt: 'FAIL halt_cycle_1',
            relativePath: 'tb/tb_cpu_top.vhd',
            lineHint: 84,
            forbiddenConstruct: 'self-checking assertion/report failure at 206ns: FAIL halt_cycle_1',
            legalReplacementPattern: 'repair the CPU decoder/control/TB timing contract so the halt-cycle expectation is true at 206ns; do not delete, weaken, skip, rename, or silence the assertion',
            assertionLabel: 'halt_cycle_1',
            simulationTime: '206ns',
            expectedBehavior: 'CPU halt/control behavior must match the self-checking halt-cycle expectation at the reported simulation time.',
            relatedSourcePaths: ['src/decoder.vhd', 'src/control_fsm.vhd', 'src/cpu_top.vhd'],
          }],
        };
        throw error;
      }

      return {
        validation: { summary: 'Generated VHDL passed GHDL simulation for tb_cpu_top.' },
        outputDirectory: params.normalizedProjectPath,
      };
    }),
    session,
    sessionManager,
    designPresets: presets,
    attemptsPerDesign: 2,
  });

  assert.equal(seenPrompts.length, 2);
  assert.match(seenPrompts[1] || '', /cpu_halt_behavior_mismatch/);
  assert.match(seenPrompts[1] || '', /### tb\/tb_cpu_top\.vhd/);
  assert.match(seenPrompts[1] || '', /AUTOMATA_BEHAVIOR_CONTEXT: CPU instruction stimulus/);
  assert.match(seenPrompts[1] || '', /instr_data <= "11111111"/);
  assert.match(seenPrompts[1] || '', /### src\/decoder\.vhd/);
  assert.match(seenPrompts[1] || '', /### src\/control_fsm\.vhd/);
  assert.doesNotMatch(seenPrompts[1] || '', /### docs\/notes\.md/);

  const masterLog = await fs.readFile(path.join(projectRoot, '.automata-logicpro', 'fpga-architect-sweep.log'), 'utf8');
  assert.match(masterLog, /Behavioral context: failing TB window included=yes instruction sequence found=yes CPU RTL files included=/);
});

test('runFpgaArchitectStressLoop narrows repair continuation to file paths extracted from raw failure text', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-raw-path-continuation-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);
  const presets = [createTestPreset('alpha', 'Alpha Design')];
  const seenPrompts: string[] = [];
  let runCount = 0;

  await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async (params: any) => {
      seenPrompts.push(params.userQuery);
      runCount += 1;

      const generatedRoot = path.join(params.normalizedProjectPath, 'alpha');
      const srcPath = path.join(generatedRoot, 'src', 'alu.vhd');
      const tbPath = path.join(generatedRoot, 'tb', 'alu_tb.vhd');
      const notesPath = path.join(generatedRoot, 'docs', 'notes.md');
      await fs.mkdir(path.dirname(srcPath), { recursive: true });
      await fs.mkdir(path.dirname(tbPath), { recursive: true });
      await fs.mkdir(path.dirname(notesPath), { recursive: true });
      await fs.writeFile(srcPath, 'entity alu is end entity;\n', 'utf8');
      await fs.writeFile(tbPath, 'entity alu_tb is end entity;\n', 'utf8');
      await fs.writeFile(notesPath, '# unrelated notes\n', 'utf8');

      if (runCount === 1) {
        throw new Error(`Core logic simulation analysis failed: ${srcPath}:39:28:error: no overloaded function found matching "resize"`);
      }

      return {
        validation: { summary: 'Generated VHDL passed GHDL simulation for alpha_tb.' },
        outputDirectory: params.normalizedProjectPath,
      };
    }),
    session,
    sessionManager,
    designPresets: presets,
    attemptsPerDesign: 2,
  });

  assert.equal(runCount, 2);
  assert.match(seenPrompts[1] || '', /## Existing Generated Files To Repair/);
  assert.match(seenPrompts[1] || '', /### alpha\/src\/alu\.vhd/);
  assert.match(seenPrompts[1] || '', /Failure family: numeric_std_type_discipline \/ resize_on_raw_std_logic_vector/);
  assert.match(seenPrompts[1] || '', /Forbidden construct: calling resize on a raw std_logic_vector operand/);
  assert.match(seenPrompts[1] || '', /Legal replacement pattern: convert the operand into unsigned\(\.\.\.\) or signed\(\.\.\.\) first, then call resize on the typed value/);
  assert.doesNotMatch(seenPrompts[1] || '', /### alpha\/tb\/alu_tb\.vhd/);
  assert.doesNotMatch(seenPrompts[1] || '', /### alpha\/docs\/notes\.md/);
});

test('runFpgaArchitectStressLoop narrows poisoned repeated repair continuations to tight line windows', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-poisoned-repair-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);
  const presets = [createTestPreset('alpha', 'Alpha Design')];
  const seenPrompts: string[] = [];
  let runCount = 0;

  const makeLargeFile = () => Array.from({ length: 150 }, (_, index) => {
    const line = index + 1;
    if (line === 80) return 'res_val := resize(a, DATA_WIDTH); -- FAIL_LINE';
    if (line === 120) return '-- MARKER_ONLY_IN_WIDE_WINDOW';
    return `-- filler ${line}`;
  }).join('\n');

  await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async (params: any) => {
      seenPrompts.push(params.userQuery);
      runCount += 1;
      const generatedPath = path.join(params.normalizedProjectPath, 'src', 'alu.vhd');
      await fs.mkdir(path.dirname(generatedPath), { recursive: true });
      await fs.writeFile(generatedPath, makeLargeFile(), 'utf8');
      throw new Error(`Core logic simulation analysis failed: ${generatedPath}:80:28:error: no overloaded function found matching "resize"`);
    }),
    session,
    sessionManager,
    designPresets: presets,
    attemptsPerDesign: 3,
  });

  assert.equal(seenPrompts.length, 3);
  assert.match(seenPrompts[1] || '', /MARKER_ONLY_IN_WIDE_WINDOW/);
  assert.doesNotMatch(seenPrompts[2] || '', /MARKER_ONLY_IN_WIDE_WINDOW/);

  const masterLog = await fs.readFile(path.join(projectRoot, '.automata-logicpro', 'fpga-architect-sweep.log'), 'utf8');
  assert.match(masterLog, /Context mode: clean generation/);
  assert.match(masterLog, /Context mode: repair continuation/);
  assert.match(masterLog, /Design-specific feedback packets:/);
  assert.match(masterLog, /Model-quality feedback packets:/);
  assert.match(masterLog, /Continuation file count:/);
  assert.match(masterLog, /Poisoned repair continuation: yes/);
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

test('classifyFpgaArchitectLoopFailure isolates provider/runtime transport failures from VHDL categories', () => {
  const diagnostic = classifyFpgaArchitectLoopFailure(
    'Core logic simulation analysis failed: Ollama is reachable at http://127.0.0.1:11434, but text generation failed for model "gemma4:latest". Original error: fetch failed',
  );

  assert.equal(diagnostic.category, 'provider_runtime');
  assert.equal(diagnostic.label, 'Provider / Runtime');
  assert.deepEqual(diagnostic.ruleIds, []);
});

test('runFpgaArchitectStressLoop pauses and retries provider/runtime failures without counting them as failed attempts', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-provider-counts-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);
  const presets = [createTestPreset('alpha', 'Alpha Design')];
  let runCount = 0;
  const progressEvents: any[] = [];

  const result = await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async () => {
      runCount += 1;
      if (runCount === 1) {
        throw new Error('Core logic simulation analysis failed: Ollama is reachable at http://127.0.0.1:11434, but text generation failed for model "gemma4:latest". Original error: fetch failed');
      }
      if (runCount === 2) {
        throw new Error('Core logic simulation analysis failed: src/alu.vhd:39:28:error: no overloaded function found matching "resize"');
      }
      return { validation: { summary: 'passed' }, outputDirectory: projectRoot };
    }),
    session,
    sessionManager,
    designPresets: presets,
    attemptsPerDesign: 2,
    providerRetryDelayMs: 0,
    onProgress: (progress) => {
      progressEvents.push(progress);
    },
  });

  assert.equal(runCount, 3);
  assert.equal(result.completedAttempts, 2);
  assert.equal(result.failures, 1);
  assert.equal(result.providerRuntimeFailures, 1);
  assert.equal(result.codeQualityFailures, 1);
  assert.equal(result.successes, 1);
  assert.equal(result.designSummaries[0]?.providerRuntimeFailures, 1);
  assert.equal(result.designSummaries[0]?.codeQualityFailures, 1);
  assert.equal(result.designSummaries[0]?.completedAttempts, 2);
  assert.equal(progressEvents.some((event) => event.providerPaused === true), true);
  assert.equal(
    progressEvents
      .filter((event) => event.providerPaused === true)
      .every((event) => event.failures === 0 && event.completedAttempts === 0),
    true,
  );
});

test('classifyFpgaArchitectLoopFailure maps typed function return mismatches into numeric_std typing', () => {
  const diagnostic = classifyFpgaArchitectLoopFailure(
    'Core logic simulation analysis failed: src/alu.vhd:35:23:error: can\'t match function call with type array type "UNRESOLVED_UNSIGNED"',
  );

  assert.equal(diagnostic.category, 'numeric_std_typing');
  assert.equal(diagnostic.label, 'numeric_std Typing');
});

test('classifyFpgaArchitectLoopFailure maps typed port associations and anonymous array declarations into stable categories', () => {
  const typedPortDiagnostic = classifyFpgaArchitectLoopFailure(
    'Core logic simulation analysis failed: src/dsp_chain.vhd:32:22:error: can\'t associate "fir_sample" with port "sample_o"',
  );
  assert.equal(typedPortDiagnostic.category, 'numeric_std_typing');

  const anonymousArrayDiagnostic = classifyFpgaArchitectLoopFailure(
    "Core logic simulation analysis failed: src/cpu_core.vhd:27:20:error: type mark expected in a subtype indication signal regs : array(reg_idx_t range 0 to 7) of data_t := (others => (others => '0'));",
  );
  assert.equal(anonymousArrayDiagnostic.category, 'array_subtype_misuse');
});

test('summarizeFpgaArchitectLoopFailures keeps recurring raw analyze declaration and type escapes out of the Other bucket', () => {
  const buckets = summarizeFpgaArchitectLoopFailures([
    {
      attempt: 1,
      ok: false,
      message: 'Core logic simulation analysis failed: tb/router_tb.vhd:33:3:error: non-shared variable declaration not allowed in architecture body',
    },
    {
      attempt: 2,
      ok: false,
      message: 'Core logic simulation analysis failed: src/cpu_core.vhd:27:20:error: type mark expected in a subtype indication signal regs : array(reg_idx_t range 0 to 7) of data_t := (others => (others => \'0\'));',
    },
    {
      attempt: 3,
      ok: false,
      message: 'Core logic simulation analysis failed: src/dsp_chain.vhd:32:22:error: can\'t associate "fir_sample" with port "sample_o"',
    },
    {
      attempt: 4,
      ok: false,
      message: 'Core logic simulation analysis failed: src/alu.vhd:35:23:error: can\'t match function call with type array type "UNRESOLVED_UNSIGNED"',
    },
  ]);

  const categories = buckets.map((bucket) => bucket.category);
  const uniqueCategories = [...new Set(categories)];

  assert.deepEqual(uniqueCategories, ['architecture_variable', 'array_subtype_misuse', 'numeric_std_typing']);
  assert.equal(buckets.some((bucket) => bucket.category === 'other'), false);
  assert.equal(
    buckets
      .filter((bucket) => bucket.category === 'numeric_std_typing')
      .reduce((sum, bucket) => sum + bucket.count, 0),
    2,
  );
});

test('runFpgaArchitectStressLoop carries architecture-body variable failures forward as repair continuation and clears the class on the next attempt', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-archvar-proof-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);
  const presets = [createTestPreset('alpha', 'Alpha Design')];
  const seenPrompts: string[] = [];
  let runCount = 0;

  const result = await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async (params: any) => {
      seenPrompts.push(params.userQuery);
      runCount += 1;
      const generatedRoot = path.join(params.normalizedProjectPath, 'alpha');
      await fs.mkdir(path.join(generatedRoot, 'tb'), { recursive: true });
      await fs.writeFile(
        path.join(generatedRoot, 'tb', 'alpha_tb.vhd'),
        [
          'library ieee;',
          'use ieee.std_logic_1164.all;',
          '',
          'entity alpha_tb is end entity;',
          'architecture sim of alpha_tb is',
          '  variable pass_count : integer := 0;',
          'begin',
          '  process begin wait; end process;',
          'end architecture;',
        ].join('\n'),
        'utf8',
      );

      if (runCount === 1) {
        const failure = new Error(
          'Core logic simulation analysis failed: tb/alpha_tb.vhd:6:3:error: non-shared variable declaration not allowed in architecture body',
        ) as Error & { generatedVhdlValidation?: any };
        failure.generatedVhdlValidation = {
          ok: false,
          stage: 'prevalidate',
          summary: 'tb/alpha_tb.vhd: plain architecture-body variable "pass_count" violates GHDL declarative-scope rules.',
          logs: [],
          validatedTopEntities: [],
          failureCode: 'architecture_body_variable',
          failureCategory: 'declaration_scope',
          failureDetails: [
            {
              code: 'architecture_body_variable',
              category: 'declaration_scope',
              message: 'tb/alpha_tb.vhd: plain architecture-body variable "pass_count" violates GHDL declarative-scope rules.',
              relativePath: 'tb/alpha_tb.vhd',
              forbiddenConstruct: 'plain architecture-body variable "pass_count" (testbench_bookkeeping)',
              legalReplacementPattern: 'convert testbench bookkeeping into shared-state intent only when required, otherwise move scratch storage into the owning process declarative region',
            },
          ],
        };
        throw failure;
      }

      assert.match(params.userQuery, /## Repair Continuation Mode/);
      assert.match(params.userQuery, /## Existing Generated Files To Repair/);
      assert.match(params.userQuery, /Failure family: declaration_scope \/ architecture_body_variable/);
      assert.match(params.userQuery, /plain architecture-body variable "pass_count"/);

      return {
        validation: { summary: 'Generated VHDL passed GHDL simulation for alpha_tb.' },
        outputDirectory: params.normalizedProjectPath,
      };
    }),
    session,
    sessionManager,
    designPresets: presets,
    attemptsPerDesign: 2,
  });

  assert.equal(runCount, 2);
  assert.equal(result.failures, 1);
  assert.equal(result.successes, 1);
  assert.doesNotMatch(seenPrompts[0] || '', /## Repair Continuation Mode/);
  assert.match(seenPrompts[1] || '', /## Repair Continuation Mode/);
});

test('runFpgaArchitectStressLoop carries typed interface mismatches forward as repair continuation and clears the class on the next attempt', async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-architect-typed-proof-'));
  const { sessionManager, session } = createLoopHarness(projectRoot);
  const presets = [createTestPreset('alpha', 'Alpha Design')];
  const seenPrompts: string[] = [];
  let runCount = 0;

  const result = await runFpgaArchitectStressLoop({
    ...buildLoopDependencies(projectRoot, async (params: any) => {
      seenPrompts.push(params.userQuery);
      runCount += 1;
      const generatedRoot = path.join(params.normalizedProjectPath, 'alpha');
      await fs.mkdir(path.join(generatedRoot, 'src'), { recursive: true });
      await fs.writeFile(
        path.join(generatedRoot, 'src', 'top.vhd'),
        [
          'library ieee;',
          'use ieee.std_logic_1164.all;',
          'use ieee.numeric_std.all;',
          '',
          'entity top is end entity;',
          'architecture rtl of top is',
          '  signal fir_sample : std_logic_vector(15 downto 0);',
          'begin',
          '  null;',
          'end architecture;',
        ].join('\n'),
        'utf8',
      );

      if (runCount === 1) {
        const failure = new Error(
          'Core logic simulation analysis failed: src/top.vhd:32:22:error: can\'t associate "fir_sample" with port "sample_o"',
        ) as Error & { generatedVhdlValidation?: any };
        failure.generatedVhdlValidation = {
          ok: false,
          stage: 'prevalidate',
          summary: 'src/top.vhd: drives signed formal port "sample_o" with std_logic_vector actual "fir_sample" in a port map.',
          logs: [],
          validatedTopEntities: [],
          failureCode: 'typed_port_association_mismatch',
          failureCategory: 'numeric_std_type_discipline',
          failureDetails: [
            {
              code: 'typed_port_association_mismatch',
              category: 'numeric_std_type_discipline',
              message: 'src/top.vhd: drives signed formal port "sample_o" with std_logic_vector actual "fir_sample" in a port map.',
              relativePath: 'src/top.vhd',
              forbiddenConstruct: 'std_logic_vector actual "fir_sample" passed to signed formal port "sample_o"',
              legalReplacementPattern: 'convert the actual at the boundary into the exact formal type or change the declarations so the types already match',
            },
          ],
        };
        throw failure;
      }

      assert.match(params.userQuery, /## Repair Continuation Mode/);
      assert.match(params.userQuery, /Failure family: numeric_std_type_discipline \/ typed_port_association_mismatch/);
      assert.match(params.userQuery, /convert the actual at the boundary into the exact formal type/i);

      return {
        validation: { summary: 'Generated VHDL passed GHDL simulation for alpha_top.' },
        outputDirectory: params.normalizedProjectPath,
      };
    }),
    session,
    sessionManager,
    designPresets: presets,
    attemptsPerDesign: 2,
  });

  assert.equal(runCount, 2);
  assert.equal(result.failures, 1);
  assert.equal(result.successes, 1);
  assert.match(seenPrompts[1] || '', /## Repair Continuation Mode/);
});
