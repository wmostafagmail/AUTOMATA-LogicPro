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
    validateGeneratedVhdlWithGhdl: async () => ({
      ok: true,
      stage: 'simulate' as const,
      summary: 'Generated VHDL passed GHDL simulation.',
      logs: ['ghdl ok'],
      validatedTopEntities: ['tb_generated'],
    }),
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
  assert.equal(result.telemetry.jobInputTokens, 180);
  assert.equal(result.telemetry.jobOutputTokens, 60);
  assert.equal(result.telemetry.attemptCount, 2);
  assert.equal(result.telemetry.retryCount, 1);
  assert.equal(result.telemetry.sessionInputTokens, 180);
  assert.equal(result.telemetry.sessionOutputTokens, 60);
  assert.equal(result.deterministicSkillSelection?.primary.name, 'VHDL-skill-orchestrator');
  assert.equal(result.deterministicSkillSelection?.supporting[0]?.name, 'vhdl-language');
});

test('runAiAnalyzeJob uses FPGA Architect compact test-run prompt on the initial attempt when requested', async () => {
  const params = createBaseParams({
    macroId: 'fpga_vhdl_architect' as const,
    artifactDirectory: '.',
    macroSpec: { label: 'FPGA Architect' },
    normalizedProjectPath: '/Users/waleedmostafa/Documents/Automata LogicPro/tmp/ai-analyze-runner-repair-project',
    fpgaArchitectExecutionMode: 'test_compact' as const,
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      return {
        text: JSON.stringify({
          project_name: 'proj',
          sanitized_project_name: 'proj',
          top_entity: 'counter',
          vhdl_standard: 'VHDL-2008',
          target_fpga: null,
          summary: 'summary',
          assumptions: [],
          warnings: [],
          folder_tree: '',
          files: [
            { path: 'src/counter.vhd', file_type: 'vhdl_rtl', purpose: 'rtl', content: 'entity counter is end entity; architecture rtl of counter is begin end architecture;' },
            { path: 'tb/tb_counter.vhd', file_type: 'vhdl_testbench', purpose: 'tb', content: 'entity tb_counter is end entity; architecture sim of tb_counter is begin end architecture;' },
            { path: 'constraints/top.xdc', file_type: 'constraints', purpose: 'xdc', content: '#' },
            { path: 'Makefile', file_type: 'makefile', purpose: 'build', content: 'all:' },
            { path: 'README.md', file_type: 'markdown', purpose: 'docs', content: 'readme' },
            { path: 'sim/run_ghdl.sh', file_type: 'script', purpose: 'simulation', content: 'ghdl -a' },
            { path: 'requirements/spec.md', file_type: 'markdown', purpose: 'requirements', content: 'req' },
          ],
          ghdl: {
            analysis_order: ['src/counter.vhd', 'tb/tb_counter.vhd'],
            top_testbench: 'tb_counter',
            run_commands: ['ghdl -a', 'ghdl -e', 'ghdl -r'],
            expected_result: 'pass',
          },
          quality_checklist: [],
        }),
        telemetry: {
          inputTokens: 50,
          outputTokens: 20,
          totalTokens: 70,
          tokensPerSecond: 10,
          durationMs: 200,
        },
      };
    },
    parseFpgaArchitectResponse: (text: string) => JSON.parse(text),
    saveFpgaArchitectProject: async ({ projectPath, project }: { projectPath: string; project: any }) => ({
      outputDirectory: `${projectPath}/${project.sanitized_project_name}`,
      savedFiles: project.files.map((file: any) => ({
        ...file,
        name: file.path.split('/').pop(),
        path: `${projectPath}/${project.sanitized_project_name}/${file.path}`,
        kind: file.file_type === 'vhdl_testbench' ? 'testbench' : 'module',
      })),
    }),
    buildFpgaArchitectMarkdownReport: () => 'architect report',
    buildFpgaArchitectRetryPrompt: ({ originalPrompt, errorSummary }: { originalPrompt: string; errorSummary: string }) => `${originalPrompt}\n${errorSummary}`,
    buildFpgaArchitectJsonRepairPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nJSON-ONLY-REPAIR`,
    buildFpgaArchitectCompactRetryPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nCOMPACT-REGEN`,
    buildFpgaArchitectTestRunPrompt: ({ originalPrompt, compactMode }: { originalPrompt: string; compactMode?: 'ultra_compact' | 'minimal' }) => (
      `${originalPrompt}\nTEST-RUN-COMPACT:${compactMode || 'minimal'}`
    ),
    validateGeneratedVhdlWithGhdl: async () => ({
      ok: true,
      stage: 'simulate' as const,
      summary: 'Generated VHDL passed GHDL simulation for tb_counter.',
      logs: ['simulation pass'],
      validatedTopEntities: ['tb_counter'],
    }),
  });

  const result = await runAiAnalyzeJob(params);

  assert.equal(params.__runCalls.length, 1);
  assert.match(params.__runCalls[0]?.prompt || '', /^wrapped:system prompt\n\ncontract:check waveform\nTEST-RUN-COMPACT:minimal$/);
  assert.equal(result.retryUsed, false);
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
  assert.equal(firstResult.telemetry.sessionInputTokens, 40);
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

  assert.equal(secondResult.telemetry.jobInputTokens, 60);
  assert.equal(secondResult.telemetry.jobOutputTokens, 20);
  assert.equal(secondResult.telemetry.sessionInputTokens, 100);
  assert.equal(secondResult.telemetry.sessionOutputTokens, 35);
});

test('runAiAnalyzeJob hard-fails artifact generation when saved VHDL fails GHDL validation and does not auto-fix the files', async () => {
  const params = createBaseParams({
    macroId: 'generate_vhdl_tb' as const,
    tbGenerationMode: 'reverse_from_vcd' as const,
    artifactDirectory: 'AI Generated TB',
    macroSpec: { label: 'Generate TB' },
    normalizedProjectPath: '/workspace/project',
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      return {
        text: [
          '## Selected Skills',
          '- Primary: VHDL-skill-orchestrator',
          '## Assumptions',
          '- first',
          '## Generated Artifact(s)',
          '### generated_tb.vhd',
          '```vhdl',
          'entity tb_generated is end entity;',
          'architecture sim of tb_generated is begin end architecture;',
          '```',
          '## Verification Notes',
          '- note',
        ].join('\n'),
        telemetry: {
          inputTokens: 90,
          outputTokens: 30,
          totalTokens: 120,
          tokensPerSecond: 20,
          durationMs: 400,
        },
      };
    },
    validateMacroOutput: () => ({
      macroId: 'generate_vhdl_tb' as const,
      status: 'pass' as const,
      summary: 'TB generated',
      warnings: [],
      checks: [{ id: 'code:vhdl', label: 'VHDL code', status: 'pass' as const, detail: 'present' }],
    }),
    extractGeneratedVhdlArtifacts: () => [
      { fileName: 'generated_tb.vhd', content: 'tb code', kind: 'testbench' as const },
    ],
    validateGeneratedVhdlWithGhdl: async ({ savedArtifacts }: { savedArtifacts: Array<{ fileName: string }> }) => {
      if (savedArtifacts[0]?.fileName === 'generated_tb.vhd') {
        return {
          ok: false,
          stage: 'simulate' as const,
          summary: 'tb_generated ended with severity failure',
          logs: ['tb_generated: simulation complete', 'severity failure used on pass'],
          validatedTopEntities: [],
        };
      }
      return {
        ok: true,
        stage: 'simulate' as const,
        summary: 'Generated VHDL passed GHDL simulation for tb_generated.',
        logs: ['simulation stopped with status 0'],
        validatedTopEntities: ['tb_generated'],
      };
    },
  });

  await assert.rejects(
    () => runAiAnalyzeJob(params),
    /Generate TB hard-failed because the generated VHDL did not pass GHDL simulate validation\. The app does not auto-fix VHDL file issues\./i,
  );

  assert.equal(params.__runCalls.length, 2);
});

test('runAiAnalyzeJob treats Generate TB analyze-only GHDL success as a failure and hard-fails without auto-fixing', async () => {
  const params = createBaseParams({
    macroId: 'generate_vhdl_tb' as const,
    tbGenerationMode: 'project_entities' as const,
    artifactDirectory: 'AI Generated TB',
    macroSpec: { label: 'Generate TB' },
    normalizedProjectPath: '/workspace/project',
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      return {
        text: '### counter_tb.vhd\n```vhdl\nentity counter_tb is end entity;\narchitecture sim of counter_tb is begin end architecture;\n```',
        telemetry: {
          inputTokens: 60,
          outputTokens: 20,
          totalTokens: 80,
          tokensPerSecond: 12,
          durationMs: 220,
        },
      };
    },
    validateMacroOutput: () => ({
      macroId: 'generate_vhdl_tb' as const,
      status: 'pass' as const,
      summary: 'TB generated',
      warnings: [],
      checks: [{ id: 'code:vhdl', label: 'VHDL code', status: 'pass' as const, detail: 'present' }],
    }),
    extractGeneratedVhdlArtifacts: () => [
      { fileName: 'counter_tb.vhd', content: 'entity counter_tb is end entity; architecture sim of counter_tb is begin end architecture;', kind: 'testbench' as const },
    ],
    validateGeneratedVhdlWithGhdl: async () => ({
      ok: true,
      stage: 'analyze' as const,
      summary: 'Generated VHDL passed GHDL analysis.',
      logs: ['ghdl -a counter_tb.vhd', 'analysis only'],
      validatedTopEntities: [],
    }),
  });

  await assert.rejects(
    () => runAiAnalyzeJob(params),
    /Generate TB hard-failed because the generated VHDL did not pass GHDL analyze validation\. The app does not auto-fix VHDL file issues\./i,
  );

  assert.equal(params.__runCalls.length, 2);
});

test('runAiAnalyzeJob repairs generated VHDL artifacts through the shared repair pipeline before hard-failing', async () => {
  const params = createBaseParams({
    macroId: 'generate_vhdl_tb' as const,
    tbGenerationMode: 'project_entities' as const,
    artifactDirectory: 'AI Generated TB',
    macroSpec: { label: 'Generate TB' },
    normalizedProjectPath: '/private/tmp/logicpro-repair-artifact-test',
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      if (params.__runCalls.length === 1) {
        return {
          text: '### counter_tb.vhd\n```vhdl\nentity counter_tb is end entity;\narchitecture sim of counter_tb is begin end architecture;\n```',
          telemetry: {
            inputTokens: 60,
            outputTokens: 20,
            totalTokens: 80,
            tokensPerSecond: 12,
            durationMs: 220,
          },
        };
      }

      return {
        text: '### AI Generated TB/counter_tb.vhd\n```vhdl\nentity counter_tb is end entity;\narchitecture sim of counter_tb is begin\n  process begin std.env.stop(0); wait; end process;\nend architecture;\n```',
        telemetry: {
          inputTokens: 30,
          outputTokens: 15,
          totalTokens: 45,
          tokensPerSecond: 10,
          durationMs: 140,
        },
      };
    },
    validateMacroOutput: () => ({
      macroId: 'generate_vhdl_tb' as const,
      status: 'pass' as const,
      summary: 'TB generated',
      warnings: [],
      checks: [{ id: 'code:vhdl', label: 'VHDL code', status: 'pass' as const, detail: 'present' }],
    }),
    extractGeneratedVhdlArtifacts: () => [
      {
        fileName: 'counter_tb.vhd',
        content: 'entity counter_tb is end entity;\narchitecture sim of counter_tb is begin end architecture;',
        kind: 'testbench' as const,
      },
    ],
    validateGeneratedVhdlWithGhdl: async ({ savedArtifacts }: { savedArtifacts: Array<{ fileName: string; path: string }> }) => {
      const saved = savedArtifacts[0];
      if (!saved) {
        throw new Error('missing artifact');
      }
      if (params.__runCalls.length === 1) {
        return {
          ok: false,
          stage: 'simulate' as const,
          summary: `${saved.path}: severity failure used for pass`,
          logs: [`${saved.path}: severity failure used for pass`],
          validatedTopEntities: [],
          failureCode: 'simulation_success_stop_style',
          failureCategory: 'simulation_success' as const,
          failureDetails: [
            {
              code: 'simulation_success_stop_style',
              category: 'simulation_success' as const,
              ruleIds: ['sim.success.stop_style'],
              message: 'Passing simulations must stop cleanly instead of using severity failure.',
              excerpt: `${saved.path}: severity failure used for pass`,
              forbiddenConstruct: 'severity failure used for pass termination',
              legalReplacementPattern: 'use std.env.stop(0) or another VHDL-2008 clean success termination',
            },
          ],
        };
      }
      return {
        ok: true,
        stage: 'simulate' as const,
        summary: 'Generated VHDL passed GHDL simulation for counter_tb.',
        logs: ['simulation pass'],
        validatedTopEntities: ['counter_tb'],
      };
    },
  });

  const result = await runAiAnalyzeJob(params);

  assert.equal(params.__runCalls.length, 2);
  assert.match(params.__runCalls[1].prompt, /Shared Generated-Code Repair Pipeline/);
  assert.match(params.__runCalls[1].prompt, /severity failure used for pass termination/);
  assert.match(params.__runCalls[1].prompt, /Always-on recurring failure guards/);
  assert.match(params.__runCalls[1].prompt, /Failure code: declaration_after_begin/);
  assert.match(params.__runCalls[1].prompt, /Failure code: output_port_readback/);
  assert.match(params.__runCalls[1].prompt, /Failure code: reserved_identifier/);
  assert.match(params.__runCalls[1].prompt, /Failure code: missing_waveform_generation_contract/);
  assert.equal(result.retryUsed, true);
  assert.equal(result.telemetry.attemptCount, 2);
  assert.equal(result.telemetry.retryCount, 1);
  assert.match(result.analysis, /## GHDL Validation/);
});

test('runAiAnalyzeJob repairs FPGA Architect generated VHDL through the shared repair pipeline before falling back to full regeneration', async () => {
  const params = createBaseParams({
    macroId: 'fpga_vhdl_architect' as const,
    artifactDirectory: '.',
    macroSpec: { label: 'FPGA Architect' },
    normalizedProjectPath: '/private/tmp/logicpro-repair-architect-test',
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      if (params.__runCalls.length === 1) {
        return {
          text: JSON.stringify({
            project_name: 'proj',
            sanitized_project_name: 'proj',
            top_entity: 'counter',
            vhdl_standard: 'VHDL-2008',
            target_fpga: null,
            summary: 'summary',
            assumptions: [],
            warnings: [],
            folder_tree: '',
            files: [
              { path: 'src/counter.vhd', file_type: 'vhdl_rtl', purpose: 'rtl', content: 'entity counter is end entity; architecture rtl of counter is begin end architecture;' },
              { path: 'tb/tb_counter.vhd', file_type: 'vhdl_testbench', purpose: 'tb', content: 'entity tb_counter is end entity; architecture sim of tb_counter is begin end architecture;' },
              { path: 'constraints/top.xdc', file_type: 'constraints', purpose: 'xdc', content: '#' },
              { path: 'Makefile', file_type: 'makefile', purpose: 'build', content: 'all:' },
              { path: 'README.md', file_type: 'markdown', purpose: 'docs', content: 'readme' },
              { path: 'sim/run_ghdl.sh', file_type: 'script', purpose: 'simulation', content: 'ghdl -a' },
              { path: 'requirements/spec.md', file_type: 'markdown', purpose: 'requirements', content: 'req' },
            ],
            ghdl: {
              analysis_order: ['src/counter.vhd', 'tb/tb_counter.vhd'],
              top_testbench: 'tb_counter',
              run_commands: ['ghdl -a', 'ghdl -e', 'ghdl -r'],
              expected_result: 'pass',
            },
            quality_checklist: [],
          }),
          telemetry: {
            inputTokens: 50,
            outputTokens: 20,
            totalTokens: 70,
            tokensPerSecond: 10,
            durationMs: 200,
          },
        };
      }

      return {
        text: '### proj/tb/tb_counter.vhd\n```vhdl\nentity tb_counter is end entity;\narchitecture sim of tb_counter is begin\n  process begin std.env.stop(0); wait; end process;\nend architecture;\n```',
        telemetry: {
          inputTokens: 25,
          outputTokens: 10,
          totalTokens: 35,
          tokensPerSecond: 9,
          durationMs: 150,
        },
      };
    },
    parseFpgaArchitectResponse: (text: string) => JSON.parse(text),
    saveFpgaArchitectProject: async ({ projectPath, project }: { projectPath: string; project: any }) => ({
      outputDirectory: `${projectPath}/${project.sanitized_project_name}`,
      savedFiles: project.files.map((file: any) => ({
        ...file,
        name: file.path.split('/').pop(),
        path: `${projectPath}/${project.sanitized_project_name}/${file.path}`,
        kind: file.file_type === 'vhdl_testbench' ? 'testbench' : 'module',
      })),
    }),
    buildFpgaArchitectMarkdownReport: () => 'architect report',
    buildFpgaArchitectRetryPrompt: ({ originalPrompt, errorSummary }: { originalPrompt: string; errorSummary: string }) => `${originalPrompt}\n${errorSummary}`,
    buildFpgaArchitectJsonRepairPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nJSON-ONLY-REPAIR`,
    buildFpgaArchitectCompactRetryPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nCOMPACT-REGEN`,
    validateGeneratedVhdlWithGhdl: async () => {
      if (params.__runCalls.length === 1) {
        return {
          ok: false,
          stage: 'simulate' as const,
          summary: 'tb/tb_counter.vhd: passing simulations must stop cleanly',
          logs: ['tb/tb_counter.vhd: passing simulations must stop cleanly'],
          validatedTopEntities: [],
          failureCode: 'simulation_success_stop_style',
          failureCategory: 'simulation_success' as const,
          failureDetails: [
            {
              code: 'simulation_success_stop_style',
              category: 'simulation_success' as const,
              ruleIds: ['sim.success.stop_style'],
              message: 'Passing simulations must stop cleanly instead of using severity failure.',
              excerpt: 'tb/tb_counter.vhd: passing simulations must stop cleanly',
              forbiddenConstruct: 'severity failure used for pass termination',
              legalReplacementPattern: 'use std.env.stop(0) or another VHDL-2008 clean success termination',
            },
          ],
        };
      }
      return {
        ok: true,
        stage: 'simulate' as const,
        summary: 'Generated VHDL passed GHDL simulation for tb_counter.',
        logs: ['simulation pass'],
        validatedTopEntities: ['tb_counter'],
      };
    },
  });

  const result = await runAiAnalyzeJob(params);

  assert.equal(params.__runCalls.length, 2);
  assert.match(params.__runCalls[1].prompt, /Shared Generated-Code Repair Pipeline/);
  assert.doesNotMatch(params.__runCalls[1].prompt, /Generated project failed/);
  assert.equal(result.retryUsed, true);
  assert.match(result.analysis, /architect report/);
  assert.match(result.analysis, /## GHDL Validation/);
});

test('runAiAnalyzeJob hard-fails FPGA Architect when generated project fails GHDL validation and does not auto-fix the files', async () => {
  const params = createBaseParams({
    macroId: 'fpga_vhdl_architect' as const,
    artifactDirectory: '.',
    macroSpec: { label: 'FPGA Architect' },
    normalizedProjectPath: '/Users/waleedmostafa/Documents/Automata LogicPro/tmp/ai-analyze-runner-repair-project',
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      return {
        text: JSON.stringify({
          project_name: 'proj',
          sanitized_project_name: 'proj',
          top_entity: 'counter',
          vhdl_standard: 'VHDL-2008',
          target_fpga: null,
          summary: 'summary',
          assumptions: [],
          warnings: [],
          folder_tree: '',
          files: [
            { path: 'src/counter.vhd', file_type: 'vhdl_rtl', purpose: 'rtl', content: 'entity counter is end entity; architecture rtl of counter is begin end architecture;' },
            { path: 'tb/tb_counter.vhd', file_type: 'vhdl_testbench', purpose: 'tb', content: 'entity tb_counter is end entity; architecture sim of tb_counter is begin end architecture;' },
            { path: 'requirements/req.md', file_type: 'markdown', purpose: 'req', content: 'req' },
            { path: 'architecture/arch.md', file_type: 'markdown', purpose: 'arch', content: 'arch' },
            { path: 'sim/run.sh', file_type: 'script', purpose: 'run', content: 'ghdl' },
            { path: 'constraints/top.xdc', file_type: 'constraints', purpose: 'xdc', content: '#' },
            { path: 'docs/readme.md', file_type: 'markdown', purpose: 'docs', content: 'docs' },
          ],
          ghdl: {
            analysis_order: ['src/counter.vhd', 'tb/tb_counter.vhd'],
            top_testbench: 'tb_counter',
            run_commands: ['ghdl -a', 'ghdl -e', 'ghdl -r'],
            expected_result: 'pass',
          },
          quality_checklist: [],
        }),
        telemetry: {
          inputTokens: 50,
          outputTokens: 20,
          totalTokens: 70,
          tokensPerSecond: 10,
          durationMs: 200,
        },
      };
    },
    parseFpgaArchitectResponse: (text: string) => JSON.parse(text),
    saveFpgaArchitectProject: async ({ projectPath, project }: { projectPath: string; project: any }) => ({
      outputDirectory: `${projectPath}/${project.sanitized_project_name}`,
      savedFiles: project.files.map((file: any) => ({
        ...file,
        name: file.path.split('/').pop(),
        path: `${projectPath}/${project.sanitized_project_name}/${file.path}`,
        kind: file.file_type === 'vhdl_testbench' ? 'testbench' : 'module',
      })),
    }),
    buildFpgaArchitectMarkdownReport: () => 'architect report',
    buildFpgaArchitectRetryPrompt: ({ originalPrompt, errorSummary }: { originalPrompt: string; errorSummary: string }) => `${originalPrompt}\n${errorSummary}`,
    buildFpgaArchitectJsonRepairPrompt: ({
      originalPrompt,
      invalidResponse,
      errorSummary,
    }: {
      originalPrompt: string;
      invalidResponse: string;
      errorSummary: string;
    }) => `${originalPrompt}\nJSON-ONLY-REPAIR\n${errorSummary}\n${invalidResponse}`,
    buildFpgaArchitectCompactRetryPrompt: ({
      originalPrompt,
      errorSummary,
      compactMode,
    }: {
      originalPrompt: string;
      errorSummary: string;
      compactMode?: 'compact' | 'ultra_compact';
    }) => `${originalPrompt}\nCOMPACT-REGEN:${compactMode || 'compact'}\n${errorSummary}`,
    validateGeneratedVhdlWithGhdl: async () => ({
      ok: false,
      stage: 'simulate' as const,
      summary: 'tb_counter failed reset expectation',
      logs: ['FAIL-P1'],
      validatedTopEntities: [],
    }),
  });

  await assert.rejects(
    async () => {
      try {
        await runAiAnalyzeJob(params);
      } catch (error: any) {
        assert.equal(error?.generatedVhdlValidation?.stage, 'simulate');
        assert.equal(error?.generatedVhdlValidation?.summary, 'tb_counter failed reset expectation');
        assert.ok(Array.isArray(error?.generatedVhdlValidation?.logs));
        throw error;
      }
    },
    /FPGA Architect hard-failed because the generated project did not pass GHDL simulate validation after 10 repair attempt\(s\)\. The app does not auto-fix VHDL file issues\./i
  );
  assert.equal(params.__runCalls.length, 11);
  assert.match(params.__runCalls[1]?.prompt || '', /Shared Generated-Code Repair Pipeline/i);
  assert.match(params.__runCalls[10]?.prompt || '', /Repair loop attempt: 10\/10/i);
  assert.match(params.__runCalls[10]?.prompt || '', /Repair loop attempt: 10\/10/i);
});

test('runAiAnalyzeJob reports FPGA Architect strict-rule violations as pre-GHDL validation failures before retry', async () => {
  const params = createBaseParams({
    macroId: 'fpga_vhdl_architect' as const,
    artifactDirectory: '.',
    macroSpec: { label: 'FPGA Architect' },
    normalizedProjectPath: '/Users/waleedmostafa/Documents/Automata LogicPro/tmp/ai-analyze-runner-repair-project',
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      return {
        text: JSON.stringify({
          project_name: 'proj',
          sanitized_project_name: 'proj',
          top_entity: 'counter',
          vhdl_standard: 'VHDL-2008',
          target_fpga: null,
          summary: 'summary',
          assumptions: [],
          warnings: [],
          folder_tree: '',
          files: [
            { path: 'src/counter.vhd', file_type: 'vhdl_rtl', purpose: 'rtl', content: 'entity counter is end entity; architecture rtl of counter is begin end architecture;' },
            { path: 'tb/tb_counter.vhd', file_type: 'vhdl_testbench', purpose: 'tb', content: 'entity tb_counter is end entity; architecture sim of tb_counter is begin end architecture;' },
            { path: 'requirements/req.md', file_type: 'markdown', purpose: 'req', content: 'req' },
            { path: 'architecture/arch.md', file_type: 'markdown', purpose: 'arch', content: 'arch' },
            { path: 'sim/run.sh', file_type: 'script', purpose: 'run', content: 'ghdl' },
            { path: 'constraints/top.xdc', file_type: 'constraints', purpose: 'xdc', content: '#' },
            { path: 'docs/readme.md', file_type: 'markdown', purpose: 'docs', content: 'docs' },
          ],
          ghdl: {
            analysis_order: ['src/counter.vhd', 'tb/tb_counter.vhd'],
            top_testbench: 'tb_counter',
            run_commands: ['ghdl -a', 'ghdl -e', 'ghdl -r'],
            expected_result: 'pass',
          },
          quality_checklist: [],
        }),
        telemetry: {
          inputTokens: 50,
          outputTokens: 20,
          totalTokens: 70,
          tokensPerSecond: 10,
          durationMs: 200,
        },
      };
    },
    parseFpgaArchitectResponse: (text: string) => JSON.parse(text),
    saveFpgaArchitectProject: async ({ projectPath, project }: { projectPath: string; project: any }) => ({
      outputDirectory: `${projectPath}/${project.sanitized_project_name}`,
      savedFiles: project.files.map((file: any) => ({
        ...file,
        name: file.path.split('/').pop(),
        path: `${projectPath}/${project.sanitized_project_name}/${file.path}`,
        kind: file.file_type === 'vhdl_testbench' ? 'testbench' : 'module',
      })),
    }),
    buildFpgaArchitectMarkdownReport: () => 'architect report',
    buildFpgaArchitectRetryPrompt: ({ originalPrompt, errorSummary }: { originalPrompt: string; errorSummary: string }) => `${originalPrompt}\nARCH-RETRY\n${errorSummary}`,
    buildFpgaArchitectJsonRepairPrompt: ({
      originalPrompt,
      invalidResponse,
      errorSummary,
    }: {
      originalPrompt: string;
      invalidResponse: string;
      errorSummary: string;
    }) => `${originalPrompt}\nJSON-ONLY-REPAIR\n${errorSummary}\n${invalidResponse}`,
    buildFpgaArchitectCompactRetryPrompt: ({
      originalPrompt,
      errorSummary,
      compactMode,
    }: {
      originalPrompt: string;
      errorSummary: string;
      compactMode?: 'compact' | 'ultra_compact' | 'minimal';
    }) => `${originalPrompt}\nCOMPACT-REGEN:${compactMode || 'compact'}\n${errorSummary}`,
    validateGeneratedVhdlWithGhdl: async () => ({
      ok: false,
      stage: 'prevalidate' as const,
      summary: 'src/alu_pkg.vhd: uses reserved VHDL identifier "body" as a package.',
      logs: ['src/alu_pkg.vhd: uses reserved VHDL identifier "body" as a package.'],
      validatedTopEntities: [],
    }),
  });

  await assert.rejects(
    () => runAiAnalyzeJob(params),
    /FPGA Architect hard-failed because the generated project did not pass strict pre-GHDL validation after 10 repair attempt\(s\)\. The app does not auto-fix VHDL file issues\./i,
  );
  assert.equal(params.__runCalls.length, 11);
  assert.match(params.__runCalls[1]?.prompt || '', /Shared Generated-Code Repair Pipeline/i);
  assert.match(params.__runCalls[10]?.prompt || '', /Repair loop attempt: 10\/10/i);
  assert.match(params.__runCalls[10]?.prompt || '', /reserved VHDL identifier "body"/i);
});

test('runAiAnalyzeJob treats FPGA Architect analyze-only GHDL success as a failure and hard-fails without auto-fixing', async () => {
  const params = createBaseParams({
    macroId: 'fpga_vhdl_architect' as const,
    artifactDirectory: '.',
    macroSpec: { label: 'FPGA Architect' },
    normalizedProjectPath: '/Users/waleedmostafa/Documents/Automata LogicPro/tmp/ai-analyze-runner-repair-project',
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      return {
        text: JSON.stringify({
          project_name: 'proj',
          sanitized_project_name: 'proj',
          top_entity: 'counter',
          vhdl_standard: 'VHDL-2008',
          target_fpga: null,
          summary: 'summary',
          assumptions: [],
          warnings: [],
          folder_tree: '',
          files: [
            { path: 'src/counter.vhd', file_type: 'vhdl_rtl', purpose: 'rtl', content: 'entity counter is end entity; architecture rtl of counter is begin end architecture;' },
            { path: 'tb/tb_counter.vhd', file_type: 'vhdl_testbench', purpose: 'tb', content: 'entity tb_counter is end entity; architecture sim of tb_counter is begin end architecture;' },
            { path: 'requirements/req.md', file_type: 'markdown', purpose: 'req', content: 'req' },
            { path: 'architecture/arch.md', file_type: 'markdown', purpose: 'arch', content: 'arch' },
            { path: 'sim/run.sh', file_type: 'script', purpose: 'run', content: 'ghdl' },
            { path: 'constraints/top.xdc', file_type: 'constraints', purpose: 'xdc', content: '#' },
            { path: 'docs/readme.md', file_type: 'markdown', purpose: 'docs', content: 'docs' },
          ],
          ghdl: {
            analysis_order: ['src/counter.vhd', 'tb/tb_counter.vhd'],
            top_testbench: 'tb_counter',
            run_commands: ['ghdl -a', 'ghdl -e', 'ghdl -r'],
            expected_result: 'pass',
          },
          quality_checklist: [],
        }),
        telemetry: {
          inputTokens: 50,
          outputTokens: 20,
          totalTokens: 70,
          tokensPerSecond: 10,
          durationMs: 200,
        },
      };
    },
    parseFpgaArchitectResponse: (text: string) => JSON.parse(text),
    saveFpgaArchitectProject: async ({ projectPath, project }: { projectPath: string; project: any }) => ({
      outputDirectory: `${projectPath}/${project.sanitized_project_name}`,
      savedFiles: project.files.map((file: any) => ({
        ...file,
        name: file.path.split('/').pop(),
        path: `${projectPath}/${project.sanitized_project_name}/${file.path}`,
        kind: file.file_type === 'vhdl_testbench' ? 'testbench' : 'module',
      })),
    }),
    buildFpgaArchitectMarkdownReport: () => 'architect report',
    buildFpgaArchitectRetryPrompt: ({ originalPrompt, errorSummary }: { originalPrompt: string; errorSummary: string }) => `${originalPrompt}\n${errorSummary}`,
    buildFpgaArchitectJsonRepairPrompt: ({
      originalPrompt,
      invalidResponse,
      errorSummary,
    }: {
      originalPrompt: string;
      invalidResponse: string;
      errorSummary: string;
    }) => `${originalPrompt}\nJSON-ONLY-REPAIR\n${errorSummary}\n${invalidResponse}`,
    buildFpgaArchitectCompactRetryPrompt: ({
      originalPrompt,
      errorSummary,
    }: {
      originalPrompt: string;
      errorSummary: string;
    }) => `${originalPrompt}\nCOMPACT-REGEN\n${errorSummary}`,
    validateGeneratedVhdlWithGhdl: async () => ({
      ok: true,
      stage: 'analyze' as const,
      summary: 'Generated VHDL passed GHDL analysis.',
      logs: ['ghdl -a ok', 'simulation was not reached'],
      validatedTopEntities: [],
    }),
  });

  await assert.rejects(
    () => runAiAnalyzeJob(params),
    /FPGA Architect hard-failed because the generated project did not pass GHDL analyze validation after 10 repair attempt\(s\)\. The app does not auto-fix VHDL file issues\./i
  );
  assert.equal(params.__runCalls.length, 11);
});

test('runAiAnalyzeJob lets FPGA Architect recover from a GHDL failure via one repair retry', async () => {
  const validProject = JSON.stringify({
    project_name: 'proj',
    sanitized_project_name: 'proj',
    top_entity: 'counter',
    vhdl_standard: 'VHDL-2008',
    target_fpga: null,
    summary: 'summary',
    assumptions: [],
    warnings: [],
    folder_tree: '',
    files: [
      { path: 'src/counter.vhd', file_type: 'vhdl_rtl', purpose: 'rtl', content: 'entity counter is end entity; architecture rtl of counter is begin end architecture;' },
      { path: 'tb/tb_counter.vhd', file_type: 'vhdl_testbench', purpose: 'tb', content: 'entity tb_counter is end entity; architecture sim of tb_counter is begin end architecture;' },
      { path: 'requirements/req.md', file_type: 'markdown', purpose: 'req', content: 'req' },
      { path: 'architecture/arch.md', file_type: 'markdown', purpose: 'arch', content: 'arch' },
      { path: 'sim/run.sh', file_type: 'script', purpose: 'run', content: 'ghdl' },
      { path: 'constraints/top.xdc', file_type: 'constraints', purpose: 'xdc', content: '#' },
      { path: 'docs/readme.md', file_type: 'markdown', purpose: 'docs', content: 'docs' },
    ],
    ghdl: {
      analysis_order: ['src/counter.vhd', 'tb/tb_counter.vhd'],
      top_testbench: 'tb_counter',
      run_commands: ['ghdl -a', 'ghdl -e', 'ghdl -r'],
      expected_result: 'pass',
    },
    quality_checklist: [],
  });

  const params = createBaseParams({
    macroId: 'fpga_vhdl_architect' as const,
    artifactDirectory: '.',
    macroSpec: { label: 'FPGA Architect' },
    normalizedProjectPath: '/Users/waleedmostafa/Documents/Automata LogicPro/tmp/ai-analyze-runner-repair-project',
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      const repairResponse = [
        '### proj/src/counter.vhd',
        '```vhdl',
        'entity counter is end entity;',
        'architecture rtl of counter is begin',
        'end architecture;',
        '```',
      ].join('\n');
      return {
        text: prompt.includes('Shared Generated-Code Repair Pipeline') ? repairResponse : validProject,
        telemetry: {
          inputTokens: 50,
          outputTokens: 20,
          totalTokens: 70,
          tokensPerSecond: 10,
          durationMs: 200,
        },
      };
    },
    parseFpgaArchitectResponse: (text: string) => JSON.parse(text),
    saveFpgaArchitectProject: async ({ projectPath, project }: { projectPath: string; project: any }) => ({
      outputDirectory: `${projectPath}/${project.sanitized_project_name}`,
      savedFiles: project.files.map((file: any) => ({
        ...file,
        name: file.path.split('/').pop(),
        path: `${projectPath}/${project.sanitized_project_name}/${file.path}`,
        kind: file.file_type === 'vhdl_testbench' ? 'testbench' : 'module',
      })),
    }),
    buildFpgaArchitectMarkdownReport: () => 'architect report',
    buildFpgaArchitectRetryPrompt: ({ originalPrompt, errorSummary }: { originalPrompt: string; errorSummary: string }) => `${originalPrompt}\nARCH-RETRY\n${errorSummary}`,
    buildFpgaArchitectJsonRepairPrompt: ({
      originalPrompt,
      invalidResponse,
      errorSummary,
    }: {
      originalPrompt: string;
      invalidResponse: string;
      errorSummary: string;
    }) => `${originalPrompt}\nJSON-ONLY-REPAIR\n${errorSummary}\n${invalidResponse}`,
    buildFpgaArchitectCompactRetryPrompt: ({
      originalPrompt,
      errorSummary,
      compactMode,
    }: {
      originalPrompt: string;
      errorSummary: string;
      compactMode?: 'compact' | 'ultra_compact' | 'minimal';
    }) => `${originalPrompt}\nCOMPACT-REGEN:${compactMode || 'compact'}\n${errorSummary}`,
    validateGeneratedVhdlWithGhdl: async () => {
      params.__ghdlCalls = (params.__ghdlCalls || 0) + 1;
      if (params.__ghdlCalls === 1) {
        return {
          ok: false,
          stage: 'analyze' as const,
          summary: 'first pass failed',
          logs: ['bad first pass'],
          validatedTopEntities: [],
        };
      }
      return {
        ok: true,
        stage: 'simulate' as const,
        summary: 'Generated VHDL passed GHDL simulation for tb_counter.',
        logs: ['simulation pass'],
        validatedTopEntities: ['tb_counter'],
      };
    },
  });

  const result = await runAiAnalyzeJob(params);
  assert.equal(params.__runCalls.length, 2);
  assert.equal(result.retryUsed, true);
  assert.match(result.analysis, /## GHDL Validation/i);
  assert.match(result.analysis, /Status: PASS/i);
});

test('runAiAnalyzeJob includes validator failure class guidance in FPGA Architect retry prompts', async () => {
  const validProject = JSON.stringify({
    project_name: 'proj',
    sanitized_project_name: 'proj',
    top_entity: 'counter',
    vhdl_standard: 'VHDL-2008',
    target_fpga: null,
    summary: 'summary',
    assumptions: [],
    warnings: [],
    folder_tree: '',
    files: [
      { path: 'src/counter.vhd', file_type: 'vhdl_rtl', purpose: 'rtl', content: 'entity counter is end entity; architecture rtl of counter is begin end architecture;' },
      { path: 'tb/tb_counter.vhd', file_type: 'vhdl_testbench', purpose: 'tb', content: 'entity tb_counter is end entity; architecture sim of tb_counter is begin end architecture;' },
      { path: 'requirements/req.md', file_type: 'markdown', purpose: 'req', content: 'req' },
      { path: 'architecture/arch.md', file_type: 'markdown', purpose: 'arch', content: 'arch' },
      { path: 'sim/run.sh', file_type: 'script', purpose: 'run', content: 'ghdl' },
      { path: 'constraints/top.xdc', file_type: 'constraints', purpose: 'xdc', content: '#' },
      { path: 'docs/readme.md', file_type: 'markdown', purpose: 'docs', content: 'docs' },
    ],
    ghdl: {
      analysis_order: ['src/counter.vhd', 'tb/tb_counter.vhd'],
      top_testbench: 'tb_counter',
      run_commands: ['ghdl -a', 'ghdl -e', 'ghdl -r'],
      expected_result: 'pass',
    },
    quality_checklist: [],
  });

  const params = createBaseParams({
    macroId: 'fpga_vhdl_architect' as const,
    artifactDirectory: '.',
    macroSpec: { label: 'FPGA Architect' },
    normalizedProjectPath: '/workspace/project',
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      return {
        text: validProject,
        telemetry: {
          inputTokens: 50,
          outputTokens: 20,
          totalTokens: 70,
          tokensPerSecond: 10,
          durationMs: 200,
        },
      };
    },
    parseFpgaArchitectResponse: (text: string) => JSON.parse(text),
    saveFpgaArchitectProject: async ({ projectPath, project }: { projectPath: string; project: any }) => ({
      outputDirectory: `${projectPath}/${project.sanitized_project_name}`,
      savedFiles: project.files.map((file: any) => ({
        ...file,
        name: file.path.split('/').pop(),
        path: `${projectPath}/${project.sanitized_project_name}/${file.path}`,
        kind: file.file_type === 'vhdl_testbench' ? 'testbench' : 'module',
      })),
    }),
    buildFpgaArchitectMarkdownReport: () => 'architect report',
    buildFpgaArchitectRetryPrompt: ({ originalPrompt, errorSummary }: { originalPrompt: string; errorSummary: string }) => `${originalPrompt}\nARCH-RETRY\n${errorSummary}`,
    buildFpgaArchitectJsonRepairPrompt: ({
      originalPrompt,
      invalidResponse,
      errorSummary,
    }: {
      originalPrompt: string;
      invalidResponse: string;
      errorSummary: string;
    }) => `${originalPrompt}\nJSON-ONLY-REPAIR\n${errorSummary}\n${invalidResponse}`,
    buildFpgaArchitectCompactRetryPrompt: ({
      originalPrompt,
      errorSummary,
      compactMode,
    }: {
      originalPrompt: string;
      errorSummary: string;
      compactMode?: 'compact' | 'ultra_compact' | 'minimal';
    }) => `${originalPrompt}\nCOMPACT-REGEN:${compactMode || 'compact'}\n${errorSummary}`,
    validateGeneratedVhdlWithGhdl: async () => {
      params.__ghdlCalls = (params.__ghdlCalls || 0) + 1;
      if (params.__ghdlCalls === 1) {
        return {
          ok: false,
          stage: 'prevalidate' as const,
          summary: 'src/alu.vhd: calls resize on raw std_logic_vector "a".',
          logs: ['src/alu.vhd: calls resize on raw std_logic_vector "a".'],
          validatedTopEntities: [],
          failureCode: 'resize_on_raw_std_logic_vector',
          failureCategory: 'numeric_std_type_discipline' as const,
          failureDetails: [
            {
              code: 'resize_on_raw_std_logic_vector',
              category: 'numeric_std_type_discipline' as const,
              message: 'src/alu.vhd: calls resize on raw std_logic_vector "a". Convert first.',
              excerpt: 'src/alu.vhd: calls resize on raw std_logic_vector "a". Convert first.',
              forbiddenConstruct: 'resize(a, WIDTH) on std_logic_vector',
              legalReplacementPattern: 'resize(unsigned(a), WIDTH)',
            },
          ],
        };
      }
      return {
        ok: true,
        stage: 'simulate' as const,
        summary: 'Generated VHDL passed GHDL simulation for tb_counter.',
        logs: ['simulation pass'],
        validatedTopEntities: ['tb_counter'],
      };
    },
  });

  await assert.rejects(
    () => runAiAnalyzeJob(params),
    /FPGA Architect hard-failed because the generated project did not pass strict pre-GHDL validation after 10 repair attempt\(s\)\. The app does not auto-fix VHDL file issues\./i,
  );

  assert.equal(params.__runCalls.length, 11);
  assert.match(params.__runCalls[1].prompt, /Failure class: numeric_std_type_discipline \/ resize_on_raw_std_logic_vector/);
  assert.match(params.__runCalls[1].prompt, /Forbidden construct: resize\(a, WIDTH\) on std_logic_vector/);
  assert.match(params.__runCalls[1].prompt, /Legal replacement pattern: resize\(unsigned\(a\), WIDTH\)/);
});

test('runAiAnalyzeJob performs a dedicated FPGA Architect JSON repair pass when the returned project JSON is malformed', async () => {
  const validProject = JSON.stringify({
    project_name: 'proj',
    sanitized_project_name: 'proj',
    top_entity: 'counter',
    vhdl_standard: 'VHDL-2008',
    target_fpga: null,
    summary: 'summary',
    assumptions: [],
    warnings: [],
    folder_tree: '',
    files: [
      { path: 'src/counter.vhd', file_type: 'vhdl_rtl', purpose: 'rtl', content: 'entity counter is end entity; architecture rtl of counter is begin end architecture;' },
      { path: 'tb/tb_counter.vhd', file_type: 'vhdl_testbench', purpose: 'tb', content: 'entity tb_counter is end entity; architecture sim of tb_counter is begin end architecture;' },
      { path: 'requirements/req.md', file_type: 'markdown', purpose: 'req', content: 'req' },
      { path: 'architecture/arch.md', file_type: 'markdown', purpose: 'arch', content: 'arch' },
      { path: 'sim/run.sh', file_type: 'script', purpose: 'run', content: 'ghdl' },
      { path: 'constraints/top.xdc', file_type: 'constraints', purpose: 'xdc', content: '#' },
      { path: 'docs/readme.md', file_type: 'markdown', purpose: 'docs', content: 'docs' },
    ],
    ghdl: {
      analysis_order: ['src/counter.vhd', 'tb/tb_counter.vhd'],
      top_testbench: 'tb_counter',
      run_commands: ['ghdl -a', 'ghdl -e', 'ghdl -r'],
      expected_result: 'pass',
    },
    quality_checklist: [],
  });

  const params = createBaseParams({
    macroId: 'fpga_vhdl_architect' as const,
    artifactDirectory: '.',
    macroSpec: { label: 'FPGA Architect' },
    normalizedProjectPath: '/workspace/project',
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      const attempt = params.__runCalls.length;
      return {
        text: attempt < 5 ? '{"project_name":"proj","files":["unterminated]' : validProject,
        telemetry: {
          inputTokens: 50,
          outputTokens: 20,
          totalTokens: 70,
          tokensPerSecond: 10,
          durationMs: 200,
        },
      };
    },
    parseFpgaArchitectResponse: (text: string) => JSON.parse(text),
    saveFpgaArchitectProject: async ({ projectPath, project }: { projectPath: string; project: any }) => ({
      outputDirectory: `${projectPath}/${project.sanitized_project_name}`,
      savedFiles: project.files.map((file: any) => ({
        ...file,
        name: file.path.split('/').pop(),
        path: `${projectPath}/${project.sanitized_project_name}/${file.path}`,
        kind: file.file_type === 'vhdl_testbench' ? 'testbench' : 'module',
      })),
    }),
    buildFpgaArchitectMarkdownReport: () => 'architect report',
    buildFpgaArchitectRetryPrompt: ({ originalPrompt, errorSummary }: { originalPrompt: string; errorSummary: string }) => `${originalPrompt}\nARCH-RETRY\n${errorSummary}`,
    buildFpgaArchitectJsonRepairPrompt: ({
      originalPrompt,
      invalidResponse,
      errorSummary,
    }: {
      originalPrompt: string;
      invalidResponse: string;
      errorSummary: string;
    }) => `${originalPrompt}\nJSON-ONLY-REPAIR\n${errorSummary}\n${invalidResponse}`,
    buildFpgaArchitectCompactRetryPrompt: ({
      originalPrompt,
      errorSummary,
      compactMode,
    }: {
      originalPrompt: string;
      errorSummary: string;
      compactMode?: 'compact' | 'ultra_compact' | 'minimal';
    }) => `${originalPrompt}\nCOMPACT-REGEN:${compactMode || 'compact'}\n${errorSummary}`,
    validateGeneratedVhdlWithGhdl: async () => ({
      ok: true,
      stage: 'simulate' as const,
      summary: 'Generated VHDL passed GHDL simulation for tb_counter.',
      logs: ['simulation pass'],
      validatedTopEntities: ['tb_counter'],
    }),
  });

  const result = await runAiAnalyzeJob(params);

  assert.equal(params.__runCalls.length, 5);
  assert.match(params.__runCalls[1].prompt, /JSON-ONLY-REPAIR/);
  assert.match(params.__runCalls[2].prompt, /COMPACT-REGEN:compact/);
  assert.match(params.__runCalls[3].prompt, /COMPACT-REGEN:ultra_compact/);
  assert.match(params.__runCalls[4].prompt, /COMPACT-REGEN:minimal/);
  assert.match(result.analysis, /architect report/);
  assert.equal(result.retryUsed, true);
});

test('runAiAnalyzeJob reports malformed FPGA Architect JSON as a pre-VHDL failure and does not imply VHDL auto-fix', async () => {
  const params = createBaseParams({
    macroId: 'fpga_vhdl_architect' as const,
    artifactDirectory: '.',
    macroSpec: { label: 'FPGA Architect' },
    normalizedProjectPath: '/workspace/project',
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      return {
        text: '{"project_name":"proj","files":["unterminated]',
        telemetry: {
          inputTokens: 50,
          outputTokens: 20,
          totalTokens: 70,
          tokensPerSecond: 10,
          durationMs: 200,
        },
      };
    },
    parseFpgaArchitectResponse: (text: string) => JSON.parse(text),
    saveFpgaArchitectProject: async () => {
      throw new Error('save should not run for invalid JSON');
    },
    buildFpgaArchitectMarkdownReport: () => 'architect report',
    buildFpgaArchitectRetryPrompt: ({ originalPrompt, errorSummary }: { originalPrompt: string; errorSummary: string }) => `${originalPrompt}\nARCH-RETRY\n${errorSummary}`,
    buildFpgaArchitectJsonRepairPrompt: ({
      originalPrompt,
      invalidResponse,
      errorSummary,
    }: {
      originalPrompt: string;
      invalidResponse: string;
      errorSummary: string;
    }) => `${originalPrompt}\nJSON-ONLY-REPAIR\n${errorSummary}\n${invalidResponse}`,
    buildFpgaArchitectCompactRetryPrompt: ({
      originalPrompt,
      errorSummary,
      compactMode,
    }: {
      originalPrompt: string;
      errorSummary: string;
      compactMode?: 'compact' | 'ultra_compact' | 'minimal';
    }) => `${originalPrompt}\nCOMPACT-REGEN:${compactMode || 'compact'}\n${errorSummary}`,
  });

  await assert.rejects(
    () => runAiAnalyzeJob(params),
    /FPGA Architect hard-failed because the generated project manifest was still invalid before VHDL validation\. The app did not modify or auto-fix any generated VHDL files\./i,
  );
  assert.equal(params.__runCalls.length, 5);
});
