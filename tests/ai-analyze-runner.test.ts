import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import { runAiAnalyzeJob } from '../src/server/aiAnalyzeRunner';
import { buildFailureCodeSpecificRepairShaping, buildRepairLoopCallerContract } from '../src/server/aiAnalyzeRunner';
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
    saveFpgaArchitectProject: async ({ projectPath, project }: { projectPath: string; project: any }) => {
      const outputDirectory = `${projectPath}/${project.sanitized_project_name}`;
      await Promise.all(project.files.map(async (file: any) => {
        const fullPath = `${outputDirectory}/${file.path}`;
        await fs.mkdir(fullPath.slice(0, fullPath.lastIndexOf('/')), { recursive: true });
        await fs.writeFile(fullPath, file.content, 'utf8');
      }));
      return {
        outputDirectory,
        savedFiles: project.files.map((file: any) => ({
          ...file,
          name: file.path.split('/').pop(),
          path: `${outputDirectory}/${file.path}`,
          kind: file.file_type === 'vhdl_testbench' ? 'testbench' : 'module',
        })),
      };
    },
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

test('buildFailureCodeSpecificRepairShaping adds typed port-map guidance and stronger architecture-variable testbench guidance', () => {
  const text = buildFailureCodeSpecificRepairShaping({
    ok: false,
    stage: 'prevalidate',
    summary: 'fail',
    logs: [],
    validatedTopEntities: [],
    failureDetails: [
      {
        code: 'architecture_body_variable',
        category: 'declaration_scope',
        message: 'tb/tb_axi_stream_packet_router.vhd: declares plain architecture-body variable "local_res".',
        excerpt: 'local_res',
        relativePath: 'tb/tb_axi_stream_packet_router.vhd',
        forbiddenConstruct: 'plain architecture-body variable "local_res" (process_local_scratch)',
        legalReplacementPattern: 'move "local_res" into the nearest process/subprogram declarative region as a local variable unless persistent shared state is truly required',
      },
      {
        code: 'typed_port_association_mismatch',
        category: 'numeric_std_type_discipline',
        message: 'src/dsp_chain.vhd: cannot associate "std_logic_vector(fir_sample)" with port "sample_o".',
        excerpt: 'sample_o',
        relativePath: 'src/dsp_chain.vhd',
        forbiddenConstruct: 'port-map association with mismatched typed actual/formal domains',
        legalReplacementPattern: 'convert the actual expression into the exact formal type at the port association boundary',
      },
    ],
  });

  assert.match(text, /For testbenches, keep helper subprogram declarations before architecture\/process begin/i);
  assert.match(text, /Repair the failing port map locally instead of regenerating the design/i);
  assert.match(text, /Match the actual expression to the formal type exactly at the association boundary/i);
});

test('buildFailureCodeSpecificRepairShaping bundles declaration-scope cluster guidance for testbench repair', () => {
  const text = buildFailureCodeSpecificRepairShaping({
    ok: false,
    stage: 'prevalidate',
    summary: 'scope cluster',
    logs: [],
    validatedTopEntities: [],
    failureCode: 'declaration_after_begin',
    failureCategory: 'declaration_scope',
    failureDetails: [
      {
        code: 'declaration_after_begin',
        category: 'declaration_scope',
        message: 'tb/router_tb.vhd: procedure wait_clk is declared after begin.',
        excerpt: 'procedure wait_clk',
        relativePath: 'tb/router_tb.vhd',
        forbiddenConstruct: 'procedure declaration for "wait_clk"',
        legalReplacementPattern: 'hoist declaration before begin',
      },
      {
        code: 'architecture_body_variable',
        category: 'declaration_scope',
        message: 'tb/router_tb.vhd: declares plain architecture-body variable "loop_cnt".',
        excerpt: 'loop_cnt',
        relativePath: 'tb/router_tb.vhd',
        forbiddenConstruct: 'plain architecture-body variable "loop_cnt" (process_local_scratch)',
        legalReplacementPattern: 'move "loop_cnt" into the nearest process/subprogram declarative region as a local variable unless persistent shared state is truly required',
      },
      {
        code: 'procedure_outer_scope_write',
        category: 'declaration_scope',
        message: 'tb/router_tb.vhd: procedure wait_clk mutates outer-scope object loop_cnt.',
        excerpt: 'wait_clk writes loop_cnt',
        relativePath: 'tb/router_tb.vhd',
        forbiddenConstruct: 'procedure "wait_clk" mutates outer-scope object "loop_cnt"',
        legalReplacementPattern: 'pass loop_cnt explicitly as a formal parameter or keep it local to the caller',
      },
    ],
  });

  assert.match(text, /declaration_scope_cluster/);
  assert.match(text, /Treat declaration placement, helper placement, and bookkeeping ownership as one bundled local repair pass/i);
  assert.match(text, /Move mutable bookkeeping objects such as `cnt`, `loop_cnt`, `pass_count`, `fail_count`, `current_test`, and `test_failed` out of the architecture body/i);
  assert.match(text, /If a helper needs to update mutable state, pass that state explicitly as a formal parameter/i);
});

test('buildFailureCodeSpecificRepairShaping adds string-contract repair guidance for testbench helpers', () => {
  const text = buildFailureCodeSpecificRepairShaping({
    ok: false,
    stage: 'prevalidate',
    summary: 'string contract issues',
    logs: [],
    validatedTopEntities: [],
    failureDetails: [
      {
        code: 'tb_unconstrained_string_variable',
        category: 'declaration_scope',
        message: 'tb/router_tb.vhd: declares unconstrained local string variable "fail_msg".',
        excerpt: 'variable fail_msg : string;',
        relativePath: 'tb/router_tb.vhd',
        forbiddenConstruct: 'unconstrained local string variable "fail_msg"',
        legalReplacementPattern: 'replace "fail_msg" with a direct report literal, a constant with an explicit bound, or a helper contract that does not require a mutable string variable',
      },
      {
        code: 'tb_string_formal_actual_constraint_mismatch',
        category: 'width_literal_mismatch',
        message: 'tb/router_tb.vhd: helper procedure "check_eq" declares constrained string formal "msg_name".',
        excerpt: 'msg_name : string(1 to 32)',
        relativePath: 'tb/router_tb.vhd',
        forbiddenConstruct: 'procedure "check_eq" declares constrained string formal "msg_name"',
        legalReplacementPattern: 'use an unconstrained read-only string formal for "msg_name", or remove the helper string formal and report literals directly at the call site',
      },
    ],
  });

  assert.match(text, /Remove mutable unconstrained local string variables/i);
  assert.match(text, /Do not declare constrained string formals/i);
  assert.match(text, /Replace constrained helper string formals with unconstrained read-only `string`/i);
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

test('runAiAnalyzeJob adds failure-code-specific repair shaping for recurring local fix classes', async () => {
  const params = createBaseParams({
    macroId: 'generate_vhdl_tb' as const,
    tbGenerationMode: 'project_entities' as const,
    artifactDirectory: 'AI Generated TB',
    macroSpec: { label: 'Generate TB' },
    normalizedProjectPath: '/workspace/project',
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      return {
        text: params.__runCalls.length === 1
          ? [
              '## Generated Artifact(s)',
              '### broken_tb.vhd',
              '```vhdl',
              'entity broken_tb is end entity;',
              'architecture sim of broken_tb is begin',
              '  process',
              '    variable label : integer := 0;',
              '  begin',
              '    label := 1;',
              '    wait;',
              '  end process;',
              'end architecture;',
              '```',
            ].join('\n')
          : 'no repairs',
        telemetry: {
          inputTokens: 30,
          outputTokens: 10,
          totalTokens: 40,
          tokensPerSecond: 10,
          durationMs: 100,
        },
      };
    },
    validateMacroOutput: () => ({
      macroId: 'generate_vhdl_tb' as const,
      status: 'pass' as const,
      summary: 'artifact generated',
      warnings: [],
      checks: [{ id: 'code:vhdl', label: 'VHDL code', status: 'pass' as const, detail: 'present' }],
    }),
    extractGeneratedVhdlArtifacts: () => [
      {
        fileName: 'broken_tb.vhd',
        content: [
          'entity broken_tb is end entity;',
          'architecture sim of broken_tb is begin',
          '  process',
          '    variable label : integer := 0;',
          '  begin',
          '    label := 1;',
          '    wait;',
          '  end process;',
          'end architecture;',
        ].join('\n'),
        kind: 'testbench' as const,
      },
    ],
    validateGeneratedVhdlWithGhdl: async ({ savedArtifacts }: { savedArtifacts: Array<{ path: string }> }) => {
      const filePath = savedArtifacts[0]?.path || '/workspace/project/AI Generated TB/broken_tb.vhd';
      return {
        ok: false,
        stage: 'prevalidate' as const,
        summary: `${filePath}: uses reserved VHDL identifier "label" as a variable name.`,
        logs: [`${filePath}: uses reserved VHDL identifier "label" as a variable name.`],
        validatedTopEntities: [],
        failureCode: 'reserved_identifier',
        failureCategory: 'identifier_reserved_word' as const,
        failureDetails: [
          {
            code: 'reserved_identifier',
            category: 'identifier_reserved_word' as const,
            message: `${filePath}: uses reserved VHDL identifier "label" as a variable name.`,
            excerpt: 'identifier "label" is reserved',
            relativePath: 'AI Generated TB/broken_tb.vhd',
            forbiddenConstruct: 'reserved identifier "label"',
            legalReplacementPattern: 'rename "label" to a safe descriptive non-keyword identifier such as op_label or state_label',
          },
        ],
      };
    },
  });

  await assert.rejects(() => runAiAnalyzeJob(params));
  assert.equal(params.__runCalls.length, 2);
  assert.match(params.__runCalls[1].prompt, /Repair-loop caller guidance:/);
  assert.match(params.__runCalls[1].prompt, /reserved_identifier/);
  assert.match(params.__runCalls[1].prompt, /Rename only the reserved-word identifiers that violate VHDL legality\./);
  assert.match(params.__runCalls[1].prompt, /Use safe descriptive replacements and keep the rest of the file structure unchanged\./);
});

test('repair shaping includes package-body misuse guidance', () => {
  const text = buildFailureCodeSpecificRepairShaping({
    ok: false,
    stage: 'prevalidate',
    summary: 'package failure',
    logs: [],
    validatedTopEntities: [],
    failureCode: 'subprogram_body_inside_package_declaration',
    failureCategory: 'package_type_definition',
    failureDetails: [
      {
        code: 'subprogram_body_inside_package_declaration',
        category: 'package_type_definition',
        message: 'src/pkg.vhd: subprogram body is inside the package declaration.',
        excerpt: 'subprogram body inside package declaration',
        relativePath: 'src/pkg.vhd',
        forbiddenConstruct: 'package declaration contains executable subprogram body',
        legalReplacementPattern: 'keep signatures in package and move bodies into package body',
      },
    ],
  });

  assert.match(text, /subprogram_body_inside_package_declaration/);
  assert.match(text, /Keep only declarations\/signatures in the package declaration and move executable bodies into a package body for the same package\./);
  assert.match(text, /Preserve package names, public API, and dependent file structure unless the validator class explicitly forces a rename\./);
});

test('repair shaping includes import and array/subtype repair guidance for recurring raw analyze families', () => {
  const text = buildFailureCodeSpecificRepairShaping({
    ok: false,
    stage: 'prevalidate',
    summary: 'import and array issues',
    logs: [],
    validatedTopEntities: [],
    failureDetails: [
      {
        code: 'missing_numeric_std_clause',
        category: 'missing_ieee_clause',
        message: 'src/alu.vhd: numeric_std helpers used without local import.',
        excerpt: 'missing numeric_std',
        relativePath: 'src/alu.vhd',
        forbiddenConstruct: 'numeric_std helpers used without a local use clause',
        legalReplacementPattern: 'add use ieee.numeric_std.all;',
      },
      {
        code: 'reconstrained_subtype_alias',
        category: 'array_subtype_misuse',
        message: 'src/pkg.vhd: subtype data_word_t is nibble_t(3 downto 0);',
        excerpt: 'reconstrained subtype',
        relativePath: 'src/pkg.vhd',
        forbiddenConstruct: 'subtype declaration that re-constrains an already constrained alias',
        legalReplacementPattern: 'reuse the alias unchanged or derive from the true base type',
      },
      {
        code: 'anonymous_array_object_declaration',
        category: 'array_subtype_misuse',
        message: 'src/core.vhd: signal regs : array(0 to 7) of unsigned(7 downto 0);',
        excerpt: 'anonymous array',
        relativePath: 'src/core.vhd',
        forbiddenConstruct: 'inline array(...) of ... object declaration',
        legalReplacementPattern: 'declare a named array type first and use that type for the object',
      },
    ],
  });

  assert.match(text, /Repair the existing file locally by adding the missing IEEE import in that same file only\./);
  assert.match(text, /Add use ieee\.numeric_std\.all; before relying on unsigned, signed, resize, to_integer, to_unsigned, or to_signed\./);
  assert.match(text, /Reuse the existing constrained subtype directly, or derive the new subtype from the true unconstrained base type instead of re-constraining the alias\./);
  assert.match(text, /Declare a named array type or subtype first, then declare the object using that named type instead of inline array\(\.\.\.\) of \.\.\. syntax\./);
});

test('repair shaping includes local-first guidance for clock-edge helpers and guarded testbench indexing', () => {
  const text = buildFailureCodeSpecificRepairShaping({
    ok: false,
    stage: 'prevalidate',
    summary: 'testbench helper legality issues',
    logs: [],
    validatedTopEntities: [],
    failureDetails: [
      {
        code: 'clock_edge_helper_requires_signal_formal',
        category: 'interface_generic_port_syntax',
        message: 'tb/tb_edge_helper.vhd: helper procedure "wait_clk" uses rising_edge on non-signal formal "clk".',
        excerpt: 'wait until rising_edge(clk);',
        relativePath: 'tb/tb_edge_helper.vhd',
        forbiddenConstruct: 'procedure "wait_clk" uses rising_edge(...) on non-signal formal clause "clk : in std_logic"',
        legalReplacementPattern: 'rewrite the helper formal as signal clk : in std_logic',
      },
      {
        code: 'tb_unguarded_logic_index_conversion',
        category: 'runtime_bound_risk',
        message: 'tb/tb_indexing.vhd: uses direct array indexing from raw logic vector "addr_slv".',
        excerpt: 'rom(to_integer(unsigned(addr_slv)))',
        relativePath: 'tb/tb_indexing.vhd',
        forbiddenConstruct: 'direct array indexing expression "rom(to_integer(unsigned(addr_slv)))"',
        legalReplacementPattern: 'rewrite as rom(tb_safe_slv_to_index(addr_slv))',
      },
    ],
  });

  assert.match(text, /Repair the existing helper header locally instead of regenerating the testbench\./);
  assert.match(text, /must be declared as a signal input formal, for example `signal clk_i : in std_logic`/);
  assert.match(text, /Preserve the helper body and call sites\./);
  assert.match(text, /Repair the existing testbench file locally by removing direct raw-logic array indexing/);
  assert.match(text, /Introduce or reuse a local guarded helper such as `tb_safe_slv_to_index\(\.\.\.\)`/);
  assert.match(text, /Do not redesign the DUT or regenerate unrelated files just to normalize the testbench indexing path\./);
});

test('repair caller contract includes declaration-scope guidance for hidden outer-scope mutation', () => {
  const text = buildRepairLoopCallerContract({
    validation: {
      ok: false,
      stage: 'prevalidate',
      summary: 'scope failure',
      logs: [],
      validatedTopEntities: [],
      failureCode: 'procedure_outer_scope_write',
      failureCategory: 'declaration_scope',
      failureDetails: [
        {
          code: 'procedure_outer_scope_write',
          category: 'declaration_scope',
          message: 'tb/broken_tb.vhd: procedure mutates outer-scope state.',
          excerpt: 'procedure mutates outer-scope state',
          relativePath: 'tb/broken_tb.vhd',
          forbiddenConstruct: 'procedure with hidden outer-scope write',
          legalReplacementPattern: 'pass mutated object explicitly as a formal parameter',
        },
      ],
    },
    repairAttempt: 2,
    repairAttemptLimit: 10,
  });

  assert.match(text, /Repair-loop caller contract:/);
  assert.match(text, /Repair loop attempt: 2\/10/);
  assert.match(text, /procedure_outer_scope_write/);
  assert.match(text, /Replace hidden outer-scope mutation by passing the mutated object explicitly as a formal parameter or by keeping mutable state local to the caller process\./);
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
  assert.match(params.__runCalls[1].prompt, /Repair-loop caller contract:/);
  assert.match(params.__runCalls[1].prompt, /This is a local continuation of the existing generated file set, not a fresh regeneration\./);
  assert.match(params.__runCalls[1].prompt, /Preserve files that are already passing unless a listed dependency must change with the target repair\./);
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
    saveFpgaArchitectProject: async ({ projectPath, project }: { projectPath: string; project: any }) => {
      const outputDirectory = `${projectPath}/${project.sanitized_project_name}`;
      await Promise.all(project.files.map(async (file: any) => {
        const fullPath = `${outputDirectory}/${file.path}`;
        const directory = fullPath.slice(0, fullPath.lastIndexOf('/'));
        await fs.mkdir(directory, { recursive: true });
        await fs.writeFile(fullPath, file.content, 'utf8');
      }));
      return {
        outputDirectory,
        savedFiles: project.files.map((file: any) => ({
          ...file,
          name: file.path.split('/').pop(),
          path: `${outputDirectory}/${file.path}`,
          kind: file.file_type === 'vhdl_testbench' ? 'testbench' : 'module',
        })),
      };
    },
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
  assert.match(params.__runCalls[1].prompt, /Repair-loop caller contract:/);
  assert.match(params.__runCalls[1].prompt, /This is a local continuation of the existing generated file set, not a fresh regeneration\./);
  assert.doesNotMatch(params.__runCalls[1].prompt, /Generated project failed/);
  assert.equal(result.retryUsed, true);
  assert.match(result.analysis, /architect report/);
  assert.match(result.analysis, /## GHDL Validation/);
});

test('runAiAnalyzeJob applies deterministic generated-code repairs before invoking the LLM repair prompt', async () => {
  const projectRoot = '/private/tmp/logicpro-deterministic-repair';
  const params = createBaseParams({
    macroId: 'fpga_vhdl_architect' as const,
    artifactDirectory: '.',
    macroSpec: { label: 'FPGA Architect' },
    normalizedProjectPath: projectRoot,
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
            {
              path: 'src/counter.vhd',
              file_type: 'vhdl_rtl',
              purpose: 'rtl',
              content: [
                'library ieee;',
                'use ieee.std_logic_1164.all;',
                '',
                'entity counter is',
                'end entity;',
                '',
                'architecture rtl of counter is',
                'begin',
                '  process',
                '    variable temp_v : integer := 0;',
                '  begin',
                '    temp_v <= 1;',
                '    wait;',
                '  end process;',
                'end architecture;',
                '',
              ].join('\n'),
            },
            {
              path: 'tb/tb_counter.vhd',
              file_type: 'vhdl_testbench',
              purpose: 'tb',
              content: 'entity tb_counter is end entity;\narchitecture sim of tb_counter is begin\nend architecture;\n',
            },
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
    saveFpgaArchitectProject: async ({ projectPath, project }: { projectPath: string; project: any }) => {
      const outputDirectory = `${projectPath}/${project.sanitized_project_name}`;
      await Promise.all(project.files.map(async (file: any) => {
        const fullPath = `${outputDirectory}/${file.path}`;
        const directory = fullPath.slice(0, fullPath.lastIndexOf('/'));
        await fs.mkdir(directory, { recursive: true });
        await fs.writeFile(fullPath, file.content, 'utf8');
      }));
      return {
        outputDirectory,
        savedFiles: project.files.map((file: any) => ({
          ...file,
          name: file.path.split('/').pop(),
          path: `${outputDirectory}/${file.path}`,
          kind: file.file_type === 'vhdl_testbench' ? 'testbench' : 'module',
        })),
      };
    },
    buildFpgaArchitectMarkdownReport: () => 'architect report',
    buildFpgaArchitectRetryPrompt: ({ originalPrompt, errorSummary }: { originalPrompt: string; errorSummary: string }) => `${originalPrompt}\n${errorSummary}`,
    buildFpgaArchitectJsonRepairPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nJSON-ONLY-REPAIR`,
    buildFpgaArchitectCompactRetryPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nCOMPACT-REGEN`,
    validateGeneratedVhdlWithGhdl: async ({ savedArtifacts }: { savedArtifacts: Array<{ path: string }> }) => {
      const sourcePath = savedArtifacts.find((artifact) => artifact.path.endsWith('src/counter.vhd'))?.path;
      assert.ok(sourcePath);
      const content = await fs.readFile(sourcePath!, 'utf8');
      if (content.includes('temp_v <=')) {
        return {
          ok: false,
          stage: 'prevalidate' as const,
          summary: 'src/counter.vhd: assigns variable "temp_v" with the signal assignment operator "<=".',
          logs: ['src/counter.vhd: assigns variable "temp_v" with the signal assignment operator "<=".'],
          validatedTopEntities: [],
          failureCode: 'variable_assigned_with_signal_operator',
          failureCategory: 'signal_variable_assignment_misuse' as const,
          failureDetails: [
            {
              code: 'variable_assigned_with_signal_operator',
              category: 'signal_variable_assignment_misuse' as const,
              ruleIds: ['ghdl-variable-signal-assignment'],
              message: 'src/counter.vhd: assigns variable "temp_v" with the signal assignment operator "<=".',
              excerpt: 'src/counter.vhd: assigns variable "temp_v" with the signal assignment operator "<=".',
              relativePath: 'src/counter.vhd',
              forbiddenConstruct: 'variable "temp_v" assigned with "<="',
              legalReplacementPattern: 'replace "<=" with ":=" for variable "temp_v"',
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

  assert.equal(params.__runCalls.length, 1);
  assert.equal(result.retryUsed, true);
  assert.equal(result.telemetry.attemptCount, 1);
  assert.equal(result.telemetry.retryCount, 0);
  const repairedSource = result.architectProject?.files.find((file) => file.path === 'src/counter.vhd')?.content || '';
  assert.match(repairedSource, /temp_v := 1;/);
  assert.doesNotMatch(repairedSource, /temp_v <= 1;/);
});

test('runAiAnalyzeJob cascades deterministic generated-code repairs across multiple local validation passes before invoking the LLM', async () => {
  const projectRoot = '/private/tmp/logicpro-deterministic-cascade-repair';
  const params = createBaseParams({
    macroId: 'fpga_vhdl_architect' as const,
    artifactDirectory: '.',
    macroSpec: { label: 'FPGA Architect' },
    normalizedProjectPath: projectRoot,
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
            {
              path: 'src/counter.vhd',
              file_type: 'vhdl_rtl',
              purpose: 'rtl',
              content: [
                'library ieee;',
                'use ieee.std_logic_1164.all;',
                '',
                'entity counter is',
                'end entity;',
                '',
                'architecture rtl of counter is',
                '  variable temp_v : integer := 0;',
                'begin',
                '  process',
                '  begin',
                '    temp_v <= 1;',
                '    wait;',
                '  end process;',
                'end architecture;',
                '',
              ].join('\n'),
            },
            {
              path: 'tb/tb_counter.vhd',
              file_type: 'vhdl_testbench',
              purpose: 'tb',
              content: 'entity tb_counter is end entity;\narchitecture sim of tb_counter is begin\nend architecture;\n',
            },
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
    saveFpgaArchitectProject: async ({ projectPath, project }: { projectPath: string; project: any }) => {
      const outputDirectory = `${projectPath}/${project.sanitized_project_name}`;
      await Promise.all(project.files.map(async (file: any) => {
        const fullPath = `${outputDirectory}/${file.path}`;
        const directory = fullPath.slice(0, fullPath.lastIndexOf('/'));
        await fs.mkdir(directory, { recursive: true });
        await fs.writeFile(fullPath, file.content, 'utf8');
      }));
      return {
        outputDirectory,
        savedFiles: project.files.map((file: any) => ({
          ...file,
          name: file.path.split('/').pop(),
          path: `${outputDirectory}/${file.path}`,
          kind: file.file_type === 'vhdl_testbench' ? 'testbench' : 'module',
        })),
      };
    },
    buildFpgaArchitectMarkdownReport: () => 'architect report',
    buildFpgaArchitectRetryPrompt: ({ originalPrompt, errorSummary }: { originalPrompt: string; errorSummary: string }) => `${originalPrompt}\n${errorSummary}`,
    buildFpgaArchitectJsonRepairPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nJSON-ONLY-REPAIR`,
    buildFpgaArchitectCompactRetryPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nCOMPACT-REGEN`,
    validateGeneratedVhdlWithGhdl: async ({ savedArtifacts }: { savedArtifacts: Array<{ path: string }> }) => {
      const sourcePath = savedArtifacts.find((artifact) => artifact.path.endsWith('src/counter.vhd'))?.path;
      assert.ok(sourcePath);
      const content = await fs.readFile(sourcePath!, 'utf8');

      if (content.includes('architecture rtl of counter is\n  variable temp_v')) {
        return {
          ok: false,
          stage: 'prevalidate' as const,
          summary: 'src/counter.vhd: declares plain architecture-body variable "temp_v".',
          logs: ['src/counter.vhd: declares plain architecture-body variable "temp_v".'],
          validatedTopEntities: [],
          failureCode: 'architecture_body_variable',
          failureCategory: 'declaration_scope' as const,
          failureDetails: [
            {
              code: 'architecture_body_variable',
              category: 'declaration_scope' as const,
              ruleIds: ['ghdl-architecture-body-variable'],
              message: 'src/counter.vhd: declares plain architecture-body variable "temp_v".',
              excerpt: 'plain architecture-body variable "temp_v"',
              relativePath: 'src/counter.vhd',
              forbiddenConstruct: 'plain architecture-body variable "temp_v" (process_local_scratch)',
              legalReplacementPattern: 'move "temp_v" into the nearest process/subprogram declarative region as a local variable unless persistent shared state is truly required',
            },
          ],
        };
      }

      if (content.includes('temp_v <= 1;')) {
        return {
          ok: false,
          stage: 'prevalidate' as const,
          summary: 'src/counter.vhd: assigns variable "temp_v" with the signal assignment operator "<=".',
          logs: ['src/counter.vhd: assigns variable "temp_v" with the signal assignment operator "<=".'],
          validatedTopEntities: [],
          failureCode: 'variable_assigned_with_signal_operator',
          failureCategory: 'signal_variable_assignment_misuse' as const,
          failureDetails: [
            {
              code: 'variable_assigned_with_signal_operator',
              category: 'signal_variable_assignment_misuse' as const,
              ruleIds: ['ghdl-variable-signal-assignment'],
              message: 'src/counter.vhd: assigns variable "temp_v" with the signal assignment operator "<=".',
              excerpt: 'src/counter.vhd: assigns variable "temp_v" with the signal assignment operator "<=".',
              relativePath: 'src/counter.vhd',
              forbiddenConstruct: 'variable "temp_v" assigned with "<="',
              legalReplacementPattern: 'replace "<=" with ":=" for variable "temp_v"',
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

  assert.equal(params.__runCalls.length, 1);
  assert.equal(result.retryUsed, true);
  assert.equal(result.telemetry.attemptCount, 1);
  assert.equal(result.telemetry.retryCount, 0);
  const repairedSource = result.architectProject?.files.find((file) => file.path === 'src/counter.vhd')?.content || '';
  assert.match(repairedSource, /process\s+    variable temp_v : integer := 0;\s+  begin/is);
  assert.match(repairedSource, /temp_v := 1;/);
  assert.doesNotMatch(repairedSource, /architecture rtl of counter is\s+  variable temp_v/i);
  assert.doesNotMatch(repairedSource, /temp_v <= 1;/);
});

test('runAiAnalyzeJob repairs procedure outer-scope writes before invoking the LLM repair prompt', async () => {
  const projectRoot = '/private/tmp/logicpro-procedure-outer-scope-repair';
  const params = createBaseParams({
    macroId: 'fpga_vhdl_architect' as const,
    artifactDirectory: '.',
    macroSpec: { label: 'FPGA Architect' },
    normalizedProjectPath: projectRoot,
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
            {
              path: 'tb/tb_counter.vhd',
              file_type: 'vhdl_testbench',
              purpose: 'tb',
              content: [
                'library ieee;',
                'use ieee.std_logic_1164.all;',
                '',
                'entity tb_counter is',
                'end entity;',
                '',
                'architecture sim of tb_counter is',
                "  signal test_failed : std_logic := '0';",
                'begin',
                '  stimulus : process',
                '    procedure mark_fail(msg_name : string) is',
                '    begin',
                "      test_failed <= '1';",
                '      report msg_name;',
                '    end procedure;',
                '  begin',
                '    mark_fail("boom");',
                '    wait;',
                '  end process;',
                'end architecture;',
                '',
              ].join('\n'),
            },
            {
              path: 'src/counter.vhd',
              file_type: 'vhdl_rtl',
              purpose: 'rtl',
              content: 'entity counter is end entity;\narchitecture rtl of counter is begin\nend architecture;\n',
            },
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
    saveFpgaArchitectProject: async ({ projectPath, project }: { projectPath: string; project: any }) => {
      const outputDirectory = `${projectPath}/${project.sanitized_project_name}`;
      await Promise.all(project.files.map(async (file: any) => {
        const fullPath = `${outputDirectory}/${file.path}`;
        const directory = fullPath.slice(0, fullPath.lastIndexOf('/'));
        await fs.mkdir(directory, { recursive: true });
        await fs.writeFile(fullPath, file.content, 'utf8');
      }));
      return {
        outputDirectory,
        savedFiles: project.files.map((file: any) => ({
          ...file,
          name: file.path.split('/').pop(),
          path: `${outputDirectory}/${file.path}`,
          kind: file.file_type === 'vhdl_testbench' ? 'testbench' : 'module',
        })),
      };
    },
    buildFpgaArchitectMarkdownReport: () => 'architect report',
    buildFpgaArchitectRetryPrompt: ({ originalPrompt, errorSummary }: { originalPrompt: string; errorSummary: string }) => `${originalPrompt}\n${errorSummary}`,
    buildFpgaArchitectJsonRepairPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nJSON-ONLY-REPAIR`,
    buildFpgaArchitectCompactRetryPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nCOMPACT-REGEN`,
    validateGeneratedVhdlWithGhdl: async ({ savedArtifacts }: { savedArtifacts: Array<{ path: string }> }) => {
      const tbPath = savedArtifacts.find((artifact) => artifact.path.endsWith('tb/tb_counter.vhd'))?.path;
      assert.ok(tbPath);
      const content = await fs.readFile(tbPath!, 'utf8');
      if (content.includes('procedure mark_fail(msg_name : string) is') && content.includes("test_failed <= '1';")) {
        return {
          ok: false,
          stage: 'prevalidate' as const,
          summary: 'tb/tb_counter.vhd: procedure "mark_fail" assigns to outer-scope object "test_failed" without passing it as a formal parameter.',
          logs: ['tb/tb_counter.vhd: procedure "mark_fail" assigns to outer-scope object "test_failed" without passing it as a formal parameter.'],
          validatedTopEntities: [],
          failureCode: 'procedure_outer_scope_write',
          failureCategory: 'declaration_scope' as const,
          failureDetails: [
            {
              code: 'procedure_outer_scope_write',
              category: 'declaration_scope' as const,
              ruleIds: ['ghdl-procedure-outer-scope-write'],
              message: 'tb/tb_counter.vhd: procedure "mark_fail" assigns to outer-scope object "test_failed" without passing it as a formal parameter.',
              excerpt: 'tb/tb_counter.vhd: procedure "mark_fail" assigns to outer-scope object "test_failed" without passing it as a formal parameter.',
              relativePath: 'tb/tb_counter.vhd',
              forbiddenConstruct: 'procedure "mark_fail" mutates outer-scope object "test_failed"',
              legalReplacementPattern: 'add the object as a formal parameter and write through that formal instead of closing over outer state',
            },
          ],
        };
      }

      assert.match(content, /procedure mark_fail\(msg_name : string; signal test_failed_io : out std_logic\) is/);
      assert.match(content, /test_failed_io <= '1';/);
      assert.match(content, /mark_fail\("boom", test_failed\);/);

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

  assert.equal(params.__runCalls.length, 1);
  assert.equal(result.retryUsed, true);
  assert.equal(result.telemetry.attemptCount, 1);
  assert.equal(result.telemetry.retryCount, 0);
});

test('runAiAnalyzeJob applies deterministic cleanup to LLM repair output before the next repair attempt', async () => {
  const projectRoot = '/private/tmp/logicpro-post-llm-deterministic-repair';
  const params = createBaseParams({
    macroId: 'fpga_vhdl_architect' as const,
    artifactDirectory: '.',
    macroSpec: { label: 'FPGA Architect' },
    normalizedProjectPath: projectRoot,
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      if (prompt.includes('Automatic Retry: Shared Generated-Code Repair Pipeline')) {
        return {
          text: [
            '### proj/tb/tb_axi_stream_router.vhd',
            '```vhdl',
            'library ieee;',
            'use ieee.std_logic_1164.all;',
            'use ieee.numeric_std.all;',
            '',
            'entity tb_axi_stream_router is',
            'end entity;',
            '',
            'architecture sim of tb_axi_stream_router is',
            'begin',
            '  process',
            '  begin',
            "    REPAIRED: Moved function declaration before 'function to_slv' after validator feedback",
            '    function to_slv(value : integer) return std_logic_vector is',
            '    begin',
            '      return std_logic_vector(to_unsigned(value, 8));',
            '    end function;',
            '    wait;',
            '  end process;',
            'end architecture;',
            '```',
          ].join('\n'),
          telemetry: {
            inputTokens: 30,
            outputTokens: 15,
            totalTokens: 45,
            tokensPerSecond: 10,
            durationMs: 100,
          },
        };
      }

      return {
        text: JSON.stringify({
          project_name: 'proj',
          sanitized_project_name: 'proj',
          top_entity: 'axi_stream_router',
          vhdl_standard: 'VHDL-2008',
          target_fpga: null,
          summary: 'summary',
          assumptions: [],
          warnings: [],
          folder_tree: '',
          files: [
            {
              path: 'src/axi_stream_router.vhd',
              file_type: 'vhdl_rtl',
              purpose: 'rtl',
              content: 'entity axi_stream_router is end entity;\narchitecture rtl of axi_stream_router is begin\nend architecture;\n',
            },
            {
              path: 'tb/tb_axi_stream_router.vhd',
              file_type: 'vhdl_testbench',
              purpose: 'tb',
              content: [
                'library ieee;',
                'use ieee.std_logic_1164.all;',
                '',
                'entity tb_axi_stream_router is',
                'end entity;',
                '',
                'architecture sim of tb_axi_stream_router is',
                'begin',
                '  process',
                '  begin',
                "    assert false report \"pre-repair placeholder\" severity note;",
                '    wait;',
                '  end process;',
                'end architecture;',
                '',
              ].join('\n'),
            },
            { path: 'constraints/top.xdc', file_type: 'constraints', purpose: 'xdc', content: '#' },
            { path: 'Makefile', file_type: 'makefile', purpose: 'build', content: 'all:' },
            { path: 'README.md', file_type: 'markdown', purpose: 'docs', content: 'readme' },
            { path: 'sim/run_ghdl.sh', file_type: 'script', purpose: 'simulation', content: 'ghdl -a' },
            { path: 'requirements/spec.md', file_type: 'markdown', purpose: 'requirements', content: 'req' },
          ],
          ghdl: {
            analysis_order: ['src/axi_stream_router.vhd', 'tb/tb_axi_stream_router.vhd'],
            top_testbench: 'tb_axi_stream_router',
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
    saveFpgaArchitectProject: async ({ projectPath, project }: { projectPath: string; project: any }) => {
      const outputDirectory = `${projectPath}/${project.sanitized_project_name}`;
      await Promise.all(project.files.map(async (file: any) => {
        const fullPath = `${outputDirectory}/${file.path}`;
        const directory = fullPath.slice(0, fullPath.lastIndexOf('/'));
        await fs.mkdir(directory, { recursive: true });
        await fs.writeFile(fullPath, file.content, 'utf8');
      }));
      return {
        outputDirectory,
        savedFiles: project.files.map((file: any) => ({
          ...file,
          name: file.path.split('/').pop(),
          path: `${outputDirectory}/${file.path}`,
          kind: file.file_type === 'vhdl_testbench' ? 'testbench' : 'module',
        })),
      };
    },
    buildFpgaArchitectMarkdownReport: () => 'architect report',
    buildFpgaArchitectRetryPrompt: ({ originalPrompt, errorSummary }: { originalPrompt: string; errorSummary: string }) => `${originalPrompt}\n${errorSummary}`,
    buildFpgaArchitectJsonRepairPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nJSON-ONLY-REPAIR`,
    buildFpgaArchitectCompactRetryPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nCOMPACT-REGEN`,
    validateGeneratedVhdlWithGhdl: async ({ savedArtifacts }: { savedArtifacts: Array<{ path: string }> }) => {
      const tbPath = savedArtifacts.find((artifact) => artifact.path.endsWith('tb/tb_axi_stream_router.vhd'))?.path;
      assert.ok(tbPath);
      const content = await fs.readFile(tbPath!, 'utf8');

      if (/REPAIRED:/i.test(content)) {
        return {
          ok: false,
          stage: 'prevalidate' as const,
          summary: 'tb/tb_axi_stream_router.vhd: contains repair/meta commentary inside VHDL source.',
          logs: ['tb/tb_axi_stream_router.vhd: contains repair/meta commentary inside VHDL source.'],
          validatedTopEntities: [],
          failureCode: 'natural_language_leakage',
          failureCategory: 'other' as const,
          failureDetails: [
            {
              code: 'natural_language_leakage',
              category: 'other' as const,
              message: 'tb/tb_axi_stream_router.vhd: contains repair/meta commentary inside VHDL source.',
              excerpt: 'REPAIRED: Moved function declaration before',
              relativePath: 'tb/tb_axi_stream_router.vhd',
              forbiddenConstruct: 'repair/meta commentary embedded in VHDL source',
              legalReplacementPattern: 'keep any explanatory text only as VHDL comments starting with "--", and never emit markdown headings, bullets, or repair labels in source files',
            },
          ],
        };
      }

      if (/process\s+begin[\s\S]*function to_slv/i.test(content)) {
        return {
          ok: false,
          stage: 'prevalidate' as const,
          summary: 'tb/tb_axi_stream_router.vhd: declares function "to_slv" inside an executable region after "begin".',
          logs: ['tb/tb_axi_stream_router.vhd: declares function "to_slv" inside an executable region after "begin".'],
          validatedTopEntities: [],
          failureCode: 'declaration_after_begin',
          failureCategory: 'declaration_scope' as const,
          failureDetails: [
            {
              code: 'declaration_after_begin',
              category: 'declaration_scope' as const,
              message: 'tb/tb_axi_stream_router.vhd: declares function "to_slv" inside an executable region after "begin".',
              excerpt: 'function declaration for "to_slv" after begin',
              relativePath: 'tb/tb_axi_stream_router.vhd',
              forbiddenConstruct: 'function declaration for "to_slv" after begin',
              legalReplacementPattern: 'move "to_slv" into an enclosing declarative region before begin',
            },
          ],
        };
      }

      if (/pre-repair placeholder/i.test(content)) {
        return {
          ok: false,
          stage: 'analyze' as const,
          summary: 'tb/tb_axi_stream_router.vhd: no declaration for "to_unsigned".',
          logs: ['tb/tb_axi_stream_router.vhd: no declaration for "to_unsigned".'],
          validatedTopEntities: [],
          failureCode: 'ghdl_analyze_failure',
          failureCategory: 'ghdl_analyze_failure' as const,
          failureDetails: [],
        };
      }

      assert.match(content, /process\s+    function to_slv\(value : integer\) return std_logic_vector is[\s\S]*\s+begin/is);
      assert.doesNotMatch(content, /REPAIRED:/i);
      return {
        ok: true,
        stage: 'simulate' as const,
        summary: 'Generated VHDL passed GHDL simulation for tb_axi_stream_router.',
        logs: ['simulation pass'],
        validatedTopEntities: ['tb_axi_stream_router'],
      };
    },
  });

  const result = await runAiAnalyzeJob(params);

  assert.equal(params.__runCalls.length, 2);
  assert.equal(result.retryUsed, true);
  assert.equal(result.telemetry.attemptCount, 2);
  assert.equal(result.telemetry.retryCount, 1);
  const repairedTb = result.architectProject?.files.find((file) => file.path === 'tb/tb_axi_stream_router.vhd')?.content || '';
  assert.match(repairedTb, /process\s+    function to_slv\(value : integer\) return std_logic_vector is[\s\S]*\s+begin/is);
  assert.doesNotMatch(repairedTb, /REPAIRED:/i);
  assert.doesNotMatch(repairedTb, /process\s+begin[\s\S]*function to_slv/i);
});

test('runAiAnalyzeJob repairs bundled testbench declaration-scope failures locally before invoking the LLM repair prompt', async () => {
  const params = createBaseParams({
    macroId: 'fpga_vhdl_architect',
    projectPath: '/tmp/project',
    runModelAnalysis: async ({ prompt }: { prompt: string }) => {
      params.__runCalls.push({ prompt });
      return {
        text: JSON.stringify({
          project_name: 'UART to SPI Bridge',
          sanitized_project_name: 'uart_spi_bridge',
          summary: 'generated project',
          requirements: [],
          architecture: [],
          files: [
            {
              path: 'src/uart_spi_bridge.vhd',
              file_type: 'vhdl',
              purpose: 'rtl',
              content: [
                'library ieee;',
                'use ieee.std_logic_1164.all;',
                '',
                'entity uart_spi_bridge is',
                'end entity;',
                '',
                'architecture rtl of uart_spi_bridge is',
                'begin',
                'end architecture;',
                '',
              ].join('\n'),
            },
            {
              path: 'tb/tb_uart_spi_bridge.vhd',
              file_type: 'vhdl_testbench',
              purpose: 'tb',
              content: [
                'library ieee;',
                'use ieee.std_logic_1164.all;',
                '',
                'entity tb_uart_spi_bridge is',
                'end entity;',
                '',
                'architecture sim of tb_uart_spi_bridge is',
                '  variable loop_cnt : integer := 0;',
                'begin',
                '  stimulus : process',
                '  begin',
                '    procedure wait_clk is',
                '    begin',
                '      loop_cnt := loop_cnt + 1;',
                '      wait until rising_edge(clk);',
                '    end procedure;',
                '    wait_clk;',
                '    wait;',
                '  end process;',
                'end architecture;',
                '',
              ].join('\n'),
            },
          ],
          ghdl: {
            analysis_order: ['src/uart_spi_bridge.vhd', 'tb/tb_uart_spi_bridge.vhd'],
            top_testbench: 'tb_uart_spi_bridge',
            run_commands: ['ghdl -a', 'ghdl -e', 'ghdl -r'],
            expected_result: 'pass',
          },
          quality_checklist: [],
        }),
        telemetry: {
          inputTokens: 40,
          outputTokens: 18,
          totalTokens: 58,
          tokensPerSecond: 12,
          durationMs: 150,
        },
      };
    },
    parseFpgaArchitectResponse: (text: string) => JSON.parse(text),
    saveFpgaArchitectProject: async ({ projectPath, project }: { projectPath: string; project: any }) => {
      const outputDirectory = `${projectPath}/${project.sanitized_project_name}`;
      await Promise.all(project.files.map(async (file: any) => {
        const fullPath = `${outputDirectory}/${file.path}`;
        const directory = fullPath.slice(0, fullPath.lastIndexOf('/'));
        await fs.mkdir(directory, { recursive: true });
        await fs.writeFile(fullPath, file.content, 'utf8');
      }));
      return {
        outputDirectory,
        savedFiles: project.files.map((file: any) => ({
          ...file,
          name: file.path.split('/').pop(),
          path: `${outputDirectory}/${file.path}`,
          kind: file.file_type === 'vhdl_testbench' ? 'testbench' : 'module',
        })),
      };
    },
    buildFpgaArchitectMarkdownReport: () => 'architect report',
    buildFpgaArchitectRetryPrompt: ({ originalPrompt, errorSummary }: { originalPrompt: string; errorSummary: string }) => `${originalPrompt}\n${errorSummary}`,
    buildFpgaArchitectJsonRepairPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nJSON-ONLY-REPAIR`,
    buildFpgaArchitectCompactRetryPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nCOMPACT-REGEN`,
    validateGeneratedVhdlWithGhdl: async ({ savedArtifacts }: { savedArtifacts: Array<{ path: string }> }) => {
      const tbPath = savedArtifacts.find((artifact) => artifact.path.endsWith('tb/tb_uart_spi_bridge.vhd'))?.path;
      assert.ok(tbPath);
      const content = await fs.readFile(tbPath!, 'utf8');

      if (/begin[\s\S]*procedure wait_clk is/i.test(content)) {
        return {
          ok: false,
          stage: 'prevalidate' as const,
          summary: 'tb/tb_uart_spi_bridge.vhd: declares procedure "wait_clk" inside an executable region after "begin".',
          logs: ['tb/tb_uart_spi_bridge.vhd: declares procedure "wait_clk" inside an executable region after "begin".'],
          validatedTopEntities: [],
          failureCode: 'declaration_after_begin',
          failureCategory: 'declaration_scope' as const,
          failureDetails: [
            {
              code: 'declaration_after_begin',
              category: 'declaration_scope' as const,
              message: 'tb/tb_uart_spi_bridge.vhd: declares procedure "wait_clk" inside an executable region after "begin".',
              excerpt: 'procedure wait_clk',
              relativePath: 'tb/tb_uart_spi_bridge.vhd',
              forbiddenConstruct: 'procedure declaration for "wait_clk" after begin',
              legalReplacementPattern: 'move "wait_clk" into an enclosing declarative region before begin',
            },
          ],
        };
      }

      assert.match(content, /stimulus : process[\s\S]*variable loop_cnt : integer := 0;/i);
      assert.match(content, /procedure wait_clk\s*\(\s*variable loop_cnt_io : inout integer\s*\)\s*is/i);
      assert.match(content, /wait_clk\(loop_cnt\);/i);
      return {
        ok: true,
        stage: 'simulate' as const,
        summary: 'Generated VHDL passed GHDL simulation for tb_uart_spi_bridge.',
        logs: ['simulation pass'],
        validatedTopEntities: ['tb_uart_spi_bridge'],
      };
    },
  });

  const result = await runAiAnalyzeJob(params);

  assert.equal(params.__runCalls.length, 1);
  assert.equal(result.retryUsed, true);
  assert.equal(result.telemetry.attemptCount, 1);
  assert.equal(result.telemetry.retryCount, 0);
  const repairedTb = result.architectProject?.files.find((file) => file.path === 'tb/tb_uart_spi_bridge.vhd')?.content || '';
  assert.match(repairedTb, /stimulus : process[\s\S]*variable loop_cnt : integer := 0;/i);
  assert.match(repairedTb, /procedure wait_clk\s*\(\s*variable loop_cnt_io : inout integer\s*\)\s*is/i);
  assert.match(repairedTb, /wait_clk\(loop_cnt\);/i);
  assert.doesNotMatch(repairedTb, /begin[\s\S]*procedure wait_clk is/i);
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
