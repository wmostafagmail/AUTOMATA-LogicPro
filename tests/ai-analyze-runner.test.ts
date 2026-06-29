import test from 'node:test';
import assert from 'node:assert/strict';
import { runAiAnalyzeJob } from '../src/server/aiAnalyzeRunner';
import { createSessionManager } from '../src/server/sessionManager';

function createBaseParams(overrides: Record<string, any> = {}) {
  const sessionManager = createSessionManager({ cookieName: 'logicpro-runner-test' });
  const session = sessionManager.getOrCreateSession(undefined);

  const runCalls: Array<{ prompt: string; provider: string; model: string }> = [];
  const savedArtifactsCalls: Array<{ projectPath: string; outputFolder: string; artifacts: any[] }> = [];

  const params = {
    ai: null,
    selectedProvider: 'ollama',
    selectedModel: 'qwen-test',
    macroId: 'inspect_race_hazards' as const,
    tbGenerationMode: null,
    systemPrompt: 'system prompt',
    preprocessingInputTokens: 10,
    normalizedProjectPath: '/tmp/project',
    artifactDirectory: null,
    macroSpec: { label: 'Inspect Hazards' },
    hazardFindings: [],
    protocolFrames: [],
    session,
    sessionManager,
    signal: undefined,
    getProviderDescriptors: () => [{ id: 'ollama', label: 'Ollama Local' }],
    buildMacroPromptContract: ({ userQuery }: { userQuery: string }) => `contract:${userQuery}`,
    userQuery: 'check waveform',
    applyMandatoryVhdlSkill: async (taskPrompt: string) => ({
      prompt: `wrapped:${taskPrompt}`,
      selection: {
        registryPath: '/tmp/VHDL-skill-orchestrator/skills.registry.yaml',
        primary: {
          name: 'VHDL-skill-orchestrator',
          path: '.agents/skills/VHDL-skill-orchestrator/SKILL.md',
          description: 'meta orchestrator',
          domains: ['vhdl-orchestration'],
          phases: ['design'],
          outputs: ['skill-call-plan'],
          triggerKeywords: ['vhdl'],
          priority: 1000,
          conflicts: [],
        },
        supporting: [
          {
            name: 'vhdl-language',
            path: '.agents/skills/vhdl-language/SKILL.md',
            description: 'VHDL implementation',
            domains: ['vhdl'],
            phases: ['implementation'],
            outputs: ['vhdl'],
            triggerKeywords: ['vhdl'],
            priority: 100,
            conflicts: [],
            reason: 'required by deterministic macro-to-skill routing',
            matchedKeywords: ['vhdl'],
            score: 42,
          },
        ],
        skillCallPlan: [
          '1. VHDL-skill-orchestrator: coordinate the selected skills and preserve the required output contract.',
          '2. vhdl-language: required by deterministic macro-to-skill routing.',
          '3. VHDL-skill-orchestrator: merge the outputs and run the final verification checklist before replying.',
        ],
      },
    }),
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      runCalls.push({ prompt, provider, model });
      return {
        text: 'analysis body',
        telemetry: {
          inputTokens: 100,
          outputTokens: 40,
          totalTokens: 140,
          tokensPerSecond: 25,
          durationMs: 500,
        },
      };
    },
    validateMacroOutput: () => ({
      macroId: 'inspect_race_hazards' as const,
      status: 'pass' as const,
      summary: 'Looks good.',
      warnings: [],
      checks: [],
    }),
    buildArtifactRetryPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nartifact retry`,
    buildValidationRetryPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nvalidation retry`,
    extractGeneratedVhdlArtifacts: () => [],
    saveGeneratedVhdlArtifacts: async ({ projectPath, outputFolder, artifacts }: { projectPath: string; outputFolder: string; artifacts: any[] }) => {
      savedArtifactsCalls.push({ projectPath, outputFolder, artifacts });
      return {
        outputDirectory: `${projectPath}/${outputFolder}`,
        savedArtifacts: artifacts.map((artifact, index) => ({
          ...artifact,
          fileName: artifact.fileName || `generated_${index}.vhd`,
          path: `${projectPath}/${outputFolder}/${artifact.fileName || `generated_${index}.vhd`}`,
        })),
      };
    },
    formatValidationFailureDetails: (validation: { checks: Array<{ label: string; status: string }> }) => (
      validation.checks.map((check) => `${check.label}:${check.status}`).join(', ') || 'unknown'
    ),
    __runCalls: runCalls,
    __savedArtifactsCalls: savedArtifactsCalls,
  };

  return Object.assign(params, overrides);
}

test('runAiAnalyzeJob retries once when non-artifact validation fails and accumulates tokens across attempts', async () => {
  let validationCalls = 0;
  const params = createBaseParams({
    validateMacroOutput: ({ text }: { text: string }) => {
      validationCalls += 1;
      if (validationCalls === 1) {
        assert.equal(text, 'first response');
        return {
          macroId: 'inspect_race_hazards' as const,
          status: 'fail' as const,
          summary: 'Missing grounding',
          warnings: ['grounding missing'],
          checks: [{ id: 'body:useful', label: 'Useful body', status: 'fail' as const, detail: 'Too weak' }],
        };
      }
      assert.equal(text, 'second response');
      return {
        macroId: 'inspect_race_hazards' as const,
        status: 'pass' as const,
        summary: 'Recovered on retry',
        warnings: [],
        checks: [{ id: 'body:useful', label: 'Useful body', status: 'pass' as const, detail: 'OK' }],
      };
    },
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      const first = params.__runCalls.length === 1;
      return {
        text: first ? 'first response' : 'second response',
        telemetry: {
          inputTokens: first ? 100 : 80,
          outputTokens: first ? 40 : 20,
          totalTokens: first ? 140 : 100,
          tokensPerSecond: first ? 10 : 20,
          durationMs: first ? 900 : 400,
        },
      };
    },
    buildValidationRetryPrompt: ({ originalPrompt, validationSummary }: { originalPrompt: string; validationSummary: string }) => (
      `${originalPrompt}\nretry because: ${validationSummary}`
    ),
  });

  const result = await runAiAnalyzeJob(params);

  assert.equal(params.__runCalls.length, 2);
  assert.match(params.__runCalls[0].prompt, /^wrapped:system prompt\n\ncontract:check waveform$/);
  assert.match(params.__runCalls[1].prompt, /retry because: Missing grounding/);
  assert.equal(result.retryUsed, true);
  assert.equal(result.analysis, 'second response');
  assert.equal(result.telemetry.inputTokens, 80);
  assert.equal(result.telemetry.jobInputTokens, 190);
  assert.equal(result.telemetry.jobOutputTokens, 60);
  assert.equal(result.telemetry.sessionInputTokens, 190);
  assert.equal(result.telemetry.sessionOutputTokens, 60);
  assert.equal(result.deterministicSkillSelection?.primary.name, 'VHDL-skill-orchestrator');
  assert.equal(result.deterministicSkillSelection?.supporting[0]?.name, 'vhdl-language');
});

test('runAiAnalyzeJob hard-fails artifact macros after retry when required artifacts are still missing', async () => {
  const artifactRetryCalls: Array<{
    originalPrompt: string;
    macroId: string;
    tbGenerationMode: string | null;
    artifactDirectory: string;
    validationSummary: string;
    validationWarnings: string[];
  }> = [];
  const params = createBaseParams({
    macroId: 'generate_vhdl_tb' as const,
    tbGenerationMode: 'project_entities' as const,
    artifactDirectory: 'AI Generated TB',
    macroSpec: { label: 'Generate TB' },
    validateMacroOutput: () => ({
      macroId: 'generate_vhdl_tb' as const,
      status: 'fail' as const,
      summary: 'No valid TB',
      warnings: ['missing TB'],
      checks: [
        { id: 'code:vhdl', label: 'VHDL code', status: 'fail' as const, detail: 'missing' },
        { id: 'artifact:testbench', label: 'TB artifact', status: 'fail' as const, detail: 'missing' },
      ],
    }),
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      return {
        text: 'still bad',
        telemetry: {
          inputTokens: 50,
          outputTokens: 10,
          totalTokens: 60,
          tokensPerSecond: 15,
          durationMs: 300,
        },
      };
    },
    extractGeneratedVhdlArtifacts: () => [],
    buildArtifactRetryPrompt: ({
      originalPrompt,
      macroId,
      tbGenerationMode,
      artifactDirectory,
      validationSummary,
      validationWarnings,
    }: {
      originalPrompt: string;
      macroId: string;
      tbGenerationMode: string | null;
      artifactDirectory: string;
      validationSummary: string;
      validationWarnings: string[];
    }) => {
      artifactRetryCalls.push({
        originalPrompt,
        macroId,
        tbGenerationMode,
        artifactDirectory,
        validationSummary,
        validationWarnings,
      });
      return `retry artifact into ${artifactDirectory}: ${validationSummary} | warnings: ${validationWarnings.join(', ')}`;
    },
  });

  await assert.rejects(
    () => runAiAnalyzeJob(params),
    /Generate TB hard-failed because no tagged VHDL code block was returned; no extractable VHDL artifacts were found; no VHDL testbench artifact was identified; macro validation still failed/i
  );
  assert.equal(artifactRetryCalls.length, 1);
  assert.deepEqual(artifactRetryCalls[0], {
    originalPrompt: 'wrapped:system prompt\n\ncontract:check waveform',
    macroId: 'generate_vhdl_tb',
    tbGenerationMode: 'project_entities',
    artifactDirectory: 'AI Generated TB',
    validationSummary: 'No valid TB',
    validationWarnings: ['missing TB'],
  });
  assert.equal(params.__runCalls.length, 2);
  assert.match(params.__runCalls[1].prompt, /retry artifact into AI Generated TB: No valid TB/);
  assert.match(params.__runCalls[1].prompt, /warnings: missing TB/);
});

test('runAiAnalyzeJob saves generated files and appends relative saved-file list to analysis output', async () => {
  const artifacts = [
    { fileName: 'generated_tb.vhd', content: 'tb code', kind: 'testbench' as const },
    { fileName: 'generated_module.vhd', content: 'rtl code', kind: 'module' as const },
  ];
  const params = createBaseParams({
    macroId: 'generate_vhdl_tb' as const,
    tbGenerationMode: 'project_entities' as const,
    artifactDirectory: 'AI Generated TB',
    macroSpec: { label: 'Generate TB' },
    normalizedProjectPath: '/workspace/project',
    validateMacroOutput: () => ({
      macroId: 'generate_vhdl_tb' as const,
      status: 'pass' as const,
      summary: 'TB generated',
      warnings: [],
      checks: [{ id: 'code:vhdl', label: 'VHDL code', status: 'pass' as const, detail: 'present' }],
    }),
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      return {
        text: 'artifact response',
        telemetry: {
          inputTokens: 70,
          outputTokens: 25,
          totalTokens: 95,
          tokensPerSecond: 30,
          durationMs: 250,
        },
      };
    },
    extractGeneratedVhdlArtifacts: () => artifacts,
  });

  const result = await runAiAnalyzeJob(params);

  assert.equal(params.__savedArtifactsCalls.length, 1);
  assert.deepEqual(params.__savedArtifactsCalls[0], {
    projectPath: '/workspace/project',
    outputFolder: 'AI Generated TB',
    artifacts,
  });
  assert.equal(result.outputDirectory, '/workspace/project/AI Generated TB');
  assert.deepEqual(result.generatedFiles, [
    {
      name: 'generated_tb.vhd',
      path: '/workspace/project/AI Generated TB/generated_tb.vhd',
      kind: 'testbench',
    },
    {
      name: 'generated_module.vhd',
      path: '/workspace/project/AI Generated TB/generated_module.vhd',
      kind: 'module',
    },
  ]);
  assert.match(result.analysis, /## Saved Generated Files/);
  assert.match(result.analysis, /AI Generated TB\/generated_tb\.vhd/);
  assert.match(result.analysis, /AI Generated TB\/generated_module\.vhd/);
});

test('runAiAnalyzeJob session token accumulation continues across multiple jobs on the same session', async () => {
  const sharedManager = createSessionManager({ cookieName: 'logicpro-runner-shared' });
  const sharedSession = sharedManager.getOrCreateSession(undefined);

  const firstParams = createBaseParams({
    sessionManager: sharedManager,
    session: sharedSession,
    preprocessingInputTokens: 5,
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      firstParams.__runCalls.push({ prompt, provider, model });
      return {
        text: 'job one',
        telemetry: {
          inputTokens: 40,
          outputTokens: 15,
          totalTokens: 55,
          tokensPerSecond: 12,
          durationMs: 200,
        },
      };
    },
  });
  const firstResult = await runAiAnalyzeJob(firstParams);
  assert.equal(firstResult.telemetry.sessionInputTokens, 45);
  assert.equal(firstResult.telemetry.sessionOutputTokens, 15);

  const secondParams = createBaseParams({
    sessionManager: sharedManager,
    session: sharedSession,
    preprocessingInputTokens: 7,
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      secondParams.__runCalls.push({ prompt, provider, model });
      return {
        text: 'job two',
        telemetry: {
          inputTokens: 60,
          outputTokens: 20,
          totalTokens: 80,
          tokensPerSecond: 14,
          durationMs: 250,
        },
      };
    },
  });
  const secondResult = await runAiAnalyzeJob(secondParams);

  assert.equal(secondResult.telemetry.jobInputTokens, 67);
  assert.equal(secondResult.telemetry.jobOutputTokens, 20);
  assert.equal(secondResult.telemetry.sessionInputTokens, 112);
  assert.equal(secondResult.telemetry.sessionOutputTokens, 35);
});
