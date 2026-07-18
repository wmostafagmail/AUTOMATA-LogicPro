import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import { runAiAnalyzeJob } from '../src/server/aiAnalyzeRunner';
import { buildFailureCodeSpecificRepairShaping, buildRepairLoopCallerContract } from '../src/server/aiAnalyzeRunner';
import { createSessionManager } from '../src/server/sessionManager';
import type { FpgaArchitectureContract } from '../src/server/fpgaArchitectureContract';

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

function makeRunnerArchitectureContract(): FpgaArchitectureContract {
  const capabilityIds = [
    'alu_pkg_for_opcodes_flags',
    'alu_core_combinational_or_registered_datapath',
    'optional_top_wrapper',
    'self_checking_operation_testbench',
  ];
  return {
    schemaVersion: '1.0',
    designName: 'alu_project',
    designClass: 'alu',
    topEntity: 'alu_top',
    topTestbench: 'tb_alu_top',
    systemIntent: 'Implement an 8-bit ALU with deterministic operation and flag behavior.',
    assumptions: ['The ALU is combinational.'],
    requiredCapabilityIds: capabilityIds,
    components: [
      {
        id: 'alu_pkg', kind: 'package', name: 'alu_pkg', file: 'src/alu_pkg.vhd',
        responsibility: 'Define operation encodings.', implements: [capabilityIds[0]], dependsOn: [],
        children: [],
        clockDomain: null, generics: [], ports: [], exports: ['op_t'],
      },
      {
        id: 'alu_top', kind: 'top', name: 'alu_top', file: 'src/alu_top.vhd',
        responsibility: 'Compute ALU results.', implements: [capabilityIds[1], capabilityIds[2]], dependsOn: ['alu_pkg'],
        children: [],
        clockDomain: null, generics: [],
        ports: [
          { name: 'a_i', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'Operand.' },
          { name: 'result_o', mode: 'out', type: 'std_logic_vector(7 downto 0)', purpose: 'Result.' },
        ],
        exports: [],
      },
      {
        id: 'tb_alu_top', kind: 'testbench', name: 'tb_alu_top', file: 'tb/tb_alu_top.vhd',
        responsibility: 'Self-check ALU behavior.', implements: [capabilityIds[3]], dependsOn: ['alu_top'],
        children: ['alu_top'],
        clockDomain: null, generics: [], ports: [], exports: [],
      },
    ],
    clockDomains: [],
    behaviors: [{
      id: 'operation_behavior', requirement: 'Result matches the selected operation.',
      inputs: ['a_i'], outputs: ['result_o'], timing: 'Combinational.',
    }],
    verification: [{
      id: 'verify_alu', requirement: 'Verify every contracted ALU responsibility.',
      stimulus: 'Apply deterministic operands.', expected: 'Observe expected result.',
      observables: ['result_o'], covers: capabilityIds,
    }],
    sourceOrder: ['src/alu_pkg.vhd', 'src/alu_top.vhd', 'tb/tb_alu_top.vhd'],
  };
}

function makeRunnerArchitectProject() {
  return {
    projectName: 'ALU Project', sanitizedProjectName: 'alu_project', topEntity: 'alu_top',
    vhdlStandard: '08', targetFpga: null, summary: 'ALU', assumptions: [], warnings: [], folderTree: '',
    files: [
      {
        path: 'src/alu_pkg.vhd', fileType: 'vhdl_package', purpose: 'Package',
        content: 'package alu_pkg is subtype op_t is std_logic_vector(1 downto 0); end package;',
      },
      {
        path: 'src/alu_top.vhd', fileType: 'vhdl_rtl', purpose: 'Top',
        content: 'entity alu_top is port (a_i : in std_logic_vector(7 downto 0); result_o : out std_logic_vector(7 downto 0)); end entity; architecture rtl of alu_top is begin end architecture;',
      },
      {
        path: 'tb/tb_alu_top.vhd', fileType: 'vhdl_testbench', purpose: 'TB',
        content: 'entity tb_alu_top is end entity; architecture sim of tb_alu_top is begin dut: entity work.alu_top; end architecture;',
      },
    ],
    ghdl: {
      analysisOrder: ['src/alu_pkg.vhd', 'src/alu_top.vhd', 'tb/tb_alu_top.vhd'],
      topTestbench: 'tb_alu_top', runCommands: [], expectedResult: 'pass',
    },
    qualityChecklist: [],
  };
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

test('runAiAnalyzeJob approves an architecture contract before VHDL generation and persists it with the project', async () => {
  const contract = makeRunnerArchitectureContract();
  const params = createBaseParams({
    macroId: 'fpga_vhdl_architect' as const,
    artifactDirectory: '.',
    macroSpec: { label: 'FPGA Architect' },
    normalizedProjectPath: '/tmp/logicpro-contract-gate-project',
    userQuery: 'Design an 8-bit ALU.',
    enforceFpgaArchitectureContractGate: true,
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      const isContractProposal = /before any VHDL is generated/.test(prompt);
      return {
        text: isContractProposal ? JSON.stringify(contract) : '# PROJECT\nmanifest',
        telemetry: {
          inputTokens: 50,
          outputTokens: 25,
          totalTokens: 75,
          tokensPerSecond: 20,
          durationMs: 100,
        },
      };
    },
    parseFpgaArchitectResponse: () => makeRunnerArchitectProject(),
    buildFpgaArchitectJsonRepairPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nrepair manifest`,
    buildFpgaArchitectCompactRetryPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\ncompact manifest`,
    buildFpgaArchitectProjectStructureRepairPrompt: () => 'structure repair',
    saveFpgaArchitectProject: async ({ project }: { project: ReturnType<typeof makeRunnerArchitectProject> }) => ({
      outputDirectory: '/tmp/logicpro-contract-gate-project/alu_project',
      savedFiles: project.files.map((file) => ({
        ...file,
        name: file.path.split('/').pop() || file.path,
        path: `/tmp/logicpro-contract-gate-project/alu_project/${file.path}`,
        kind: file.path.startsWith('tb/') ? 'testbench' : 'module',
      })),
    }),
    buildFpgaArchitectMarkdownReport: () => 'architect report',
    validateGeneratedVhdlWithGhdl: async () => ({
      ok: true,
      stage: 'simulate' as const,
      summary: 'Generated VHDL passed GHDL simulation.',
      logs: ['pass'],
      validatedTopEntities: ['tb_alu_top'],
    }),
  });

  const result = await runAiAnalyzeJob(params);

  assert.equal(params.__runCalls.length, 2);
  assert.match(params.__runCalls[0].prompt, /Return exactly one JSON object/);
  assert.match(params.__runCalls[1].prompt, /Approved FPGA Architecture Contract/);
  assert.match(params.__runCalls[1].prompt, /immutable source of truth/);
  assert.equal(result.architectureContract?.topEntity, 'alu_top');
  assert.equal(result.architectProject?.files.some((file: any) => file.path === 'architecture/architecture-contract.json'), true);
  assert.equal(result.telemetry.retryCount, 0);
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
  assert.match(text, /Failure evidence contract:/);
  assert.match(text, /Do not infer or guess a new failure reason/);
  assert.match(text, /file: tb\/tb_axi_stream_packet_router\.vhd/);
  assert.match(text, /exact snippet\/expression: local_res/);
  assert.match(text, /required replacement: move "local_res" into the nearest process\/subprogram declarative region/i);
  assert.match(text, /Repair the failing port map locally instead of regenerating the design/i);
  assert.match(text, /Match the actual expression to the formal type exactly at the association boundary/i);
});

test('buildFailureCodeSpecificRepairShaping adds reset/metavalue repair guidance for simulation failures', () => {
  const text = buildFailureCodeSpecificRepairShaping({
    ok: false,
    stage: 'simulate',
    summary: 'tb_bridge.vhd: idle_busy expected \'0\' got \'U\'',
    logs: [],
    validatedTopEntities: [],
    failureDetails: [
      {
        code: 'simulation_unknown_metavalue',
        category: 'simulation_success',
        message: 'tb_bridge.vhd: idle_busy expected \'0\' got \'U\'',
        excerpt: 'got U',
        relativePath: 'tb/tb_bridge.vhd',
        forbiddenConstruct: 'simulation checks observe unknown outputs',
        legalReplacementPattern: 'initialize reset/default assignments and wait after reset',
      },
    ],
  });

  assert.match(text, /Repair unknown\/metavalue simulation behavior locally/i);
  assert.match(text, /initialize every output, state register, flag/i);
  assert.match(text, /wait at least one full clock after reset release/i);
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

test('buildFailureCodeSpecificRepairShaping tells unresolved hierarchy repairs to generate missing child files', () => {
  const text = buildFailureCodeSpecificRepairShaping({
    ok: false,
    stage: 'prevalidate',
    summary: 'src/uart_spi_bridge.vhd: unresolved work units -> sync_fifo, bridge_ctrl',
    logs: [],
    validatedTopEntities: [],
    failureCode: 'unresolved_work_unit',
    failureCategory: 'unresolved_work_unit',
    failureDetails: [
      {
        code: 'unresolved_work_unit',
        category: 'unresolved_work_unit',
        message: 'src/uart_spi_bridge.vhd: references work unit(s) that are not generated or selected for validation: sync_fifo, bridge_ctrl.',
        excerpt: 'entity work.sync_fifo',
        relativePath: 'src/uart_spi_bridge.vhd',
        forbiddenConstruct: 'unresolved work unit reference(s): sync_fifo, bridge_ctrl',
        legalReplacementPattern: 'generate complete source file(s) declaring sync_fifo, bridge_ctrl, add them to analysis_order before dependents, or remove/inline the hierarchy',
      },
    ],
  });

  assert.match(text, /Repair hierarchy completeness locally/i);
  assert.match(text, /ensure a generated VHDL source file declares that exact entity\/package/i);
  assert.match(text, /included before dependents in analysis_order/i);
  assert.match(text, /ends in `_pkg` or `_package`/i);
  assert.match(text, /file that declares the missing package\/entity must also exist/i);
  assert.match(text, /remove the instantiation\/use and inline or simplify the logic/i);
});

test('buildFailureCodeSpecificRepairShaping gives package and source-order specific repair guidance', () => {
  const text = buildFailureCodeSpecificRepairShaping({
    ok: false,
    stage: 'prevalidate',
    summary: 'project contract failures',
    logs: [],
    validatedTopEntities: [],
    failureDetails: [
      {
        code: 'missing_work_package_file',
        category: 'unresolved_work_unit',
        message: 'tb/tb_video_top.vhd: use work.video_top_pkg.all is missing.',
        excerpt: 'use work.video_top_pkg.all;',
        relativePath: 'tb/tb_video_top.vhd',
        lineHint: 3,
        forbiddenConstruct: 'use work.video_top_pkg.all;',
        legalReplacementPattern: 'generate package video_top_pkg is and add it before dependents',
      },
      {
        code: 'source_order_dependency_inversion',
        category: 'invalid_source_order_contract',
        message: 'src/video_top.vhd -> video_top_pkg',
        excerpt: 'analysis_order',
        forbiddenConstruct: 'analysis_order with internal dependency inversion',
        legalReplacementPattern: 'reorder analysis_order so providers compile before dependents',
      },
    ],
  });

  assert.match(text, /missing_work_package_file/);
  assert.match(text, /generating the missing package source file/i);
  assert.match(text, /source_order_dependency_inversion/);
  assert.match(text, /Move package declarations before all files/i);
  assert.match(text, /Do not create duplicate package\/entity files/i);
});

test('buildFailureCodeSpecificRepairShaping adds package visibility and exact port-map formal guidance', () => {
  const text = buildFailureCodeSpecificRepairShaping({
    ok: false,
    stage: 'prevalidate',
    summary: 'project validator failures',
    logs: [],
    validatedTopEntities: [],
    failureDetails: [
      {
        code: 'package_symbol_not_visible',
        category: 'package_type_definition',
        message: 'src/uart_tx.vhd:8: type "byte_t" is not visible at this use site.',
        excerpt: 'tx_data : in byte_t',
        relativePath: 'src/uart_tx.vhd',
        lineHint: 8,
        forbiddenConstruct: 'custom type "byte_t" used without importing/exporting its package',
        legalReplacementPattern: 'add use work.bridge_pkg.all before the entity and compile bridge_pkg first',
      },
      {
        code: 'unknown_port_map_formal',
        category: 'interface_generic_port_syntax',
        message: 'src/bridge_top.vhd:24: maps unknown formal port "miso_i". Legal formal ports are: clk, miso_out.',
        excerpt: 'miso_i => miso',
        relativePath: 'src/bridge_top.vhd',
        lineHint: 24,
        forbiddenConstruct: 'miso_i => miso',
        legalReplacementPattern: 'use only exact formal names declared by spi_master: clk, miso_out',
      },
    ],
  });

  assert.match(text, /package_symbol_not_visible/);
  assert.match(text, /Do not duplicate or fork package\/type definitions/i);
  assert.match(text, /import it with `use work\.<package>\.all;`/i);
  assert.match(text, /unknown_port_map_formal/);
  assert.match(text, /Named associations must use exact formal port names/i);
  assert.match(text, /legal formal port list/i);
});

test('buildFailureCodeSpecificRepairShaping adds testbench DUT wiring guidance', () => {
  const text = buildFailureCodeSpecificRepairShaping({
    ok: false,
    stage: 'prevalidate',
    summary: 'testbench structural validation failed',
    logs: [],
    validatedTopEntities: [],
    failureDetails: [
      {
        code: 'testbench_missing_dut_instantiation',
        category: 'testbench_structure',
        message: 'tb/alu_tb.vhd: testbench targets alu but does not instantiate it',
        excerpt: 'check_eq("ADD", res_sig, x"08")',
        relativePath: 'tb/alu_tb.vhd',
        lineHint: 1,
        legalReplacementPattern: 'instantiate entity work.alu with a named port map',
      },
      {
        code: 'checked_signal_not_dut_driven',
        category: 'testbench_structure',
        message: 'tb/alu_tb.vhd: checks res_sig but it is not driven',
        excerpt: 'check_eq("ADD", res_sig, x"08")',
        relativePath: 'tb/alu_tb.vhd',
        lineHint: 19,
        forbiddenConstruct: 'check call observes undriven signal res_sig',
      },
      {
        code: 'testbench_drives_dut_output_signal',
        category: 'testbench_structure',
        message: 'tb/tb_flagger.vhd: drives valid_s mapped to valid_o',
        excerpt: "valid_s <= '1';",
        relativePath: 'tb/tb_flagger.vhd',
        lineHint: 16,
        forbiddenConstruct: "testbench assignment valid_s <= '1';",
      },
    ],
  });

  assert.match(text, /testbench_missing_dut_instantiation/);
  assert.match(text, /entity work\.<dut_name>/i);
  assert.match(text, /checked_signal_not_dut_driven/);
  assert.match(text, /not left floating/i);
  assert.match(text, /testbench_drives_dut_output_signal/);
  assert.match(text, /distinct reference\/expected signal/i);
});

test('buildFailureCodeSpecificRepairShaping preserves exact simulation assertion evidence', () => {
  const text = buildFailureCodeSpecificRepairShaping({
    ok: false,
    stage: 'simulate',
    summary: 'Generated VHDL failed GHDL simulation',
    logs: [],
    validatedTopEntities: [],
    failureDetails: [
      {
        code: 'simulation_assertion_expected_actual_mismatch',
        category: 'simulation_success',
        message: 'tb/tb_dsp_chain.vhd:44: assertion failed at 115ns: FAIL: FIR Peak Output expected valid but got invalid',
        excerpt: 'FAIL: FIR Peak Output expected valid but got invalid',
        relativePath: 'tb/tb_dsp_chain.vhd',
        lineHint: 44,
        forbiddenConstruct: 'self-checking assertion/report failure at 115ns: FAIL: FIR Peak Output expected valid but got invalid',
        legalReplacementPattern: 'repair existing logic; do not delete, weaken, or rename the assertion',
      },
    ],
  });

  assert.match(text, /simulation_assertion_expected_actual_mismatch/);
  assert.match(text, /file: tb\/tb_dsp_chain\.vhd/i);
  assert.match(text, /line: 44/i);
  assert.match(text, /do not delete, weaken, skip, rename, or silence/i);
  assert.match(text, /reported simulation time/i);
});

test('buildFailureCodeSpecificRepairShaping adds CPU halt behavioral repair guidance', () => {
  const text = buildFailureCodeSpecificRepairShaping({
    ok: false,
    stage: 'simulate',
    summary: 'Generated VHDL failed GHDL simulation',
    logs: [],
    validatedTopEntities: [],
    failureDetails: [
      {
        code: 'cpu_halt_behavior_mismatch',
        category: 'simulation_success',
        message: 'tb/tb_cpu_top.vhd:23: assertion failed at 206ns: FAIL halt_cycle_1',
        excerpt: 'FAIL halt_cycle_1',
        relativePath: 'tb/tb_cpu_top.vhd',
        lineHint: 23,
        forbiddenConstruct: 'self-checking assertion/report failure at 206ns: FAIL halt_cycle_1',
        legalReplacementPattern: 'repair the CPU decoder/control/TB timing contract; do not delete, weaken, skip, rename, or silence the assertion',
        assertionLabel: 'halt_cycle_1',
        simulationTime: '206ns',
        expectedBehavior: 'CPU halt/control behavior must match the self-checking halt-cycle expectation at the reported simulation time.',
        relatedSourcePaths: ['src/decoder.vhd', 'src/control_fsm.vhd', 'src/cpu_top.vhd'],
      },
    ],
  });

  assert.match(text, /cpu_halt_behavior_mismatch/);
  assert.match(text, /assertion label: halt_cycle_1/i);
  assert.match(text, /simulation time: 206ns/i);
  assert.match(text, /CPU behavioral contract mismatch/i);
  assert.match(text, /Do not remove, weaken, skip, rename, or silence/i);
  assert.match(text, /instruction stimulus sequence and CPU decoder\/control\/top excerpts/i);
});

test('buildFailureCodeSpecificRepairShaping adds CPU reset and control behavioral repair guidance', () => {
  const text = buildFailureCodeSpecificRepairShaping({
    ok: false,
    stage: 'simulate',
    summary: 'Generated VHDL failed GHDL simulation',
    logs: [],
    validatedTopEntities: [],
    failureDetails: [
      {
        code: 'cpu_reset_pc_behavior_mismatch',
        category: 'simulation_success',
        message: 'tb/tb_mini_cpu.vhd:23: assertion failed at 27ns: FAIL PC after reset',
        excerpt: 'FAIL PC after reset',
        relativePath: 'tb/tb_mini_cpu.vhd',
        lineHint: 23,
        forbiddenConstruct: 'self-checking assertion/report failure at 27ns: FAIL PC after reset',
        legalReplacementPattern: 'repair the CPU reset/fetch/TB timing contract; do not delete, weaken, skip, rename, or silence the assertion',
        assertionLabel: 'PC after reset',
        simulationTime: '27ns',
        expectedBehavior: 'Program-counter/fetch sequencing must match the self-checking expectation at the reported simulation time.',
        relatedSourcePaths: ['src/mini_cpu_pkg.vhd', 'src/cpu_top.vhd'],
      },
      {
        code: 'cpu_control_signal_behavior_mismatch',
        category: 'simulation_success',
        message: 'tb/tb_mini_cpu.vhd:24: assertion failed at 37ns: FAIL DM_WE on ADD',
        excerpt: 'FAIL DM_WE on ADD',
        relativePath: 'tb/tb_mini_cpu.vhd',
        lineHint: 24,
        forbiddenConstruct: 'self-checking assertion/report failure at 37ns: FAIL DM_WE on ADD',
        legalReplacementPattern: 'repair the CPU decode/control write-enable timing contract; do not delete, weaken, skip, rename, or silence the assertion',
        assertionLabel: 'DM_WE on ADD',
        simulationTime: '37ns',
        expectedBehavior: 'CPU decode/control write-enable behavior must match the self-checking expectation at the reported simulation time.',
        relatedSourcePaths: ['src/mini_cpu_pkg.vhd', 'src/cpu_top.vhd'],
      },
    ],
  });

  assert.match(text, /cpu_reset_pc_behavior_mismatch/);
  assert.match(text, /cpu_control_signal_behavior_mismatch/);
  assert.match(text, /PC-after-reset failures/i);
  assert.match(text, /hold PC at the reset value/i);
  assert.match(text, /control\/write-enable failures/i);
  assert.match(text, /opcode decode and write-enable timing/i);
  assert.match(text, /Do not remove, weaken, skip, rename, or silence/i);
});

test('buildFailureCodeSpecificRepairShaping adds ALU flag behavioral repair guidance', () => {
  const text = buildFailureCodeSpecificRepairShaping({
    ok: false,
    stage: 'simulate',
    summary: 'Generated VHDL failed GHDL simulation',
    logs: [],
    validatedTopEntities: [],
    failureDetails: [
      {
        code: 'alu_flag_behavior_mismatch',
        category: 'simulation_success',
        message: 'tb/tb_alu.vhd:38: assertion failed at 37ns: FAIL ADD_CARRY',
        excerpt: 'FAIL ADD_CARRY',
        relativePath: 'tb/tb_alu.vhd',
        lineHint: 38,
        forbiddenConstruct: 'self-checking assertion/report failure at 37ns: FAIL ADD_CARRY',
        legalReplacementPattern: 'repair ALU carry using widened DATA_WIDTH+1 arithmetic; do not delete, weaken, skip, rename, or silence the assertion',
        assertionLabel: 'ADD_CARRY',
        simulationTime: '37ns',
        expectedBehavior: 'ALU flag behavior must match the self-checking expectation. ADD carry must be computed from a widened carry-out bit, not from comparing the truncated result against an operand.',
        relatedSourcePaths: ['src/alu_pkg.vhd', 'src/alu.vhd', 'tb/tb_alu.vhd'],
      },
    ],
  });

  assert.match(text, /alu_flag_behavior_mismatch/);
  assert.match(text, /assertion label: ADD_CARRY/i);
  assert.match(text, /simulation time: 37ns/i);
  assert.match(text, /ALU behavioral contract mismatch/i);
  assert.match(text, /DATA_WIDTH\+1 widened unsigned addition/i);
  assert.match(text, /Do not remove, weaken, skip, rename, or silence/i);
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

test('runAiAnalyzeJob repairs missing FPGA Architect work units through the project-structure gate before inner repair', async () => {
  const makeProject = (includeChild: boolean) => JSON.stringify({
    projectName: 'proj',
    sanitizedProjectName: 'proj',
    topEntity: 'top',
    vhdlStandard: 'VHDL-2008',
    targetFpga: null,
    summary: 'summary',
    assumptions: [],
    warnings: [],
    folderTree: '',
    files: [
      ...(includeChild ? [{
        path: 'src/child.vhd',
        fileType: 'vhdl_rtl',
        purpose: 'rtl child',
        content: 'entity child is end entity; architecture rtl of child is begin end architecture;',
      }] : []),
      {
        path: 'src/top.vhd',
        fileType: 'vhdl_rtl',
        purpose: 'rtl top',
        content: 'entity top is end entity; architecture rtl of top is begin u_child: entity work.child; end architecture;',
      },
      {
        path: 'tb/tb_top.vhd',
        fileType: 'vhdl_testbench',
        purpose: 'tb',
        content: 'entity tb_top is end entity; architecture sim of tb_top is begin end architecture;',
      },
      { path: 'constraints/top.xdc', fileType: 'constraints', purpose: 'xdc', content: '#' },
      { path: 'Makefile', fileType: 'makefile', purpose: 'build', content: 'all:' },
      { path: 'README.md', fileType: 'markdown', purpose: 'docs', content: 'readme' },
      { path: 'sim/run_ghdl.sh', fileType: 'script', purpose: 'simulation', content: 'ghdl -a' },
      { path: 'requirements/spec.md', fileType: 'markdown', purpose: 'requirements', content: 'req' },
    ],
    ghdl: {
      analysisOrder: includeChild ? ['src/child.vhd', 'src/top.vhd', 'tb/tb_top.vhd'] : ['src/top.vhd', 'tb/tb_top.vhd'],
      topTestbench: 'tb_top',
      runCommands: ['ghdl -a', 'ghdl -e', 'ghdl -r'],
      expectedResult: 'pass',
    },
    qualityChecklist: [],
  });
  let validationCalls = 0;
  const params = createBaseParams({
    macroId: 'fpga_vhdl_architect' as const,
    artifactDirectory: '.',
    macroSpec: { label: 'FPGA Architect' },
    normalizedProjectPath: '/private/tmp/logicpro-structure-gate-success',
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      return {
        text: makeProject(params.__runCalls.length > 1),
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
      outputDirectory: `${projectPath}/${project.sanitizedProjectName}`,
      savedFiles: project.files.map((file: any) => ({
        ...file,
        name: file.path.split('/').pop(),
        path: `${projectPath}/${project.sanitizedProjectName}/${file.path}`,
        kind: file.fileType === 'vhdl_testbench' ? 'testbench' : 'module',
      })),
    }),
    buildFpgaArchitectMarkdownReport: () => 'architect report',
    buildFpgaArchitectRetryPrompt: ({ originalPrompt, errorSummary }: { originalPrompt: string; errorSummary: string }) => `${originalPrompt}\n${errorSummary}`,
    buildFpgaArchitectJsonRepairPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nJSON-ONLY-REPAIR`,
    buildFpgaArchitectProjectStructureRepairPrompt: ({
      originalPrompt,
      errorSummary,
      currentManifestSummary,
    }: {
      originalPrompt: string;
      errorSummary: string;
      currentManifestSummary: string;
    }) => `${originalPrompt}\nPROJECT-STRUCTURE-REPAIR\n${errorSummary}\n${currentManifestSummary}`,
    buildFpgaArchitectCompactRetryPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nCOMPACT-REGEN`,
    validateGeneratedVhdlWithGhdl: async () => {
      validationCalls += 1;
      if (validationCalls === 1) {
        return {
          ok: false,
          stage: 'prevalidate' as const,
          summary: 'src/top.vhd: unresolved work units -> child',
          logs: ['src/top.vhd: unresolved work units -> child'],
          validatedTopEntities: [],
          failureCode: 'unresolved_work_unit',
          failureCategory: 'unresolved_work_unit' as const,
          failureDetails: [{
            code: 'unresolved_work_unit',
            category: 'unresolved_work_unit' as const,
            message: 'Generated VHDL references entity work.child, but no generated file declares entity child is.',
            excerpt: 'u_child: entity work.child',
            relativePath: 'src/top.vhd',
            lineHint: 1,
            forbiddenConstruct: 'entity work.child without generated entity child file',
            legalReplacementPattern: 'Generate src/child.vhd declaring entity child is, or remove/inline the instance consistently.',
          }],
        };
      }
      return {
        ok: true,
        stage: 'simulate' as const,
        summary: 'Generated VHDL passed GHDL simulation for tb_top.',
        logs: ['simulation pass'],
        validatedTopEntities: ['tb_top'],
      };
    },
  });

  const result = await runAiAnalyzeJob(params);

  assert.equal(params.__runCalls.length, 2);
  assert.match(params.__runCalls[1].prompt, /PROJECT-STRUCTURE-REPAIR/);
  assert.match(params.__runCalls[1].prompt, /entity work\.child/);
  assert.doesNotMatch(params.__runCalls[1].prompt, /Shared Generated-Code Repair Pipeline/);
  assert.equal(result.retryUsed, true);
  assert.match(result.analysis, /architect report/);
  assert.match(result.analysis, /## GHDL Validation/);
});

test('runAiAnalyzeJob hard-fails unresolved FPGA Architect work units after structure retries without burning inner repairs', async () => {
  const projectText = JSON.stringify({
    projectName: 'proj',
    sanitizedProjectName: 'proj',
    topEntity: 'top',
    vhdlStandard: 'VHDL-2008',
    targetFpga: null,
    summary: 'summary',
    assumptions: [],
    warnings: [],
    folderTree: '',
    files: [
      {
        path: 'src/top.vhd',
        fileType: 'vhdl_rtl',
        purpose: 'rtl top',
        content: 'entity top is end entity; architecture rtl of top is begin u_child: entity work.child; end architecture;',
      },
      {
        path: 'tb/tb_top.vhd',
        fileType: 'vhdl_testbench',
        purpose: 'tb',
        content: 'entity tb_top is end entity; architecture sim of tb_top is begin end architecture;',
      },
      { path: 'constraints/top.xdc', fileType: 'constraints', purpose: 'xdc', content: '#' },
      { path: 'Makefile', fileType: 'makefile', purpose: 'build', content: 'all:' },
      { path: 'README.md', fileType: 'markdown', purpose: 'docs', content: 'readme' },
      { path: 'sim/run_ghdl.sh', fileType: 'script', purpose: 'simulation', content: 'ghdl -a' },
      { path: 'requirements/spec.md', fileType: 'markdown', purpose: 'requirements', content: 'req' },
    ],
    ghdl: {
      analysisOrder: ['src/top.vhd', 'tb/tb_top.vhd'],
      topTestbench: 'tb_top',
      runCommands: ['ghdl -a', 'ghdl -e', 'ghdl -r'],
      expectedResult: 'pass',
    },
    qualityChecklist: [],
  });
  const params = createBaseParams({
    macroId: 'fpga_vhdl_architect' as const,
    artifactDirectory: '.',
    macroSpec: { label: 'FPGA Architect' },
    normalizedProjectPath: '/private/tmp/logicpro-structure-gate-fail',
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      return {
        text: projectText,
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
      outputDirectory: `${projectPath}/${project.sanitizedProjectName}`,
      savedFiles: project.files.map((file: any) => ({
        ...file,
        name: file.path.split('/').pop(),
        path: `${projectPath}/${project.sanitizedProjectName}/${file.path}`,
        kind: file.fileType === 'vhdl_testbench' ? 'testbench' : 'module',
      })),
    }),
    buildFpgaArchitectMarkdownReport: () => 'architect report',
    buildFpgaArchitectRetryPrompt: ({ originalPrompt, errorSummary }: { originalPrompt: string; errorSummary: string }) => `${originalPrompt}\n${errorSummary}`,
    buildFpgaArchitectJsonRepairPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nJSON-ONLY-REPAIR`,
    buildFpgaArchitectProjectStructureRepairPrompt: ({
      originalPrompt,
      errorSummary,
    }: {
      originalPrompt: string;
      errorSummary: string;
      currentManifestSummary: string;
    }) => `${originalPrompt}\nPROJECT-STRUCTURE-REPAIR\n${errorSummary}`,
    buildFpgaArchitectCompactRetryPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nCOMPACT-REGEN`,
    validateGeneratedVhdlWithGhdl: async () => ({
      ok: false,
      stage: 'prevalidate' as const,
      summary: 'src/top.vhd: unresolved work units -> child',
      logs: ['src/top.vhd: unresolved work units -> child'],
      validatedTopEntities: [],
      failureCode: 'unresolved_work_unit',
      failureCategory: 'unresolved_work_unit' as const,
      failureDetails: [{
        code: 'unresolved_work_unit',
        category: 'unresolved_work_unit' as const,
        message: 'Generated VHDL references entity work.child, but no generated file declares entity child is.',
        excerpt: 'u_child: entity work.child',
        relativePath: 'src/top.vhd',
        lineHint: 1,
        forbiddenConstruct: 'entity work.child without generated entity child file',
        legalReplacementPattern: 'Generate src/child.vhd declaring entity child is, or remove/inline the instance consistently.',
      }],
    }),
  });

  await assert.rejects(
    () => runAiAnalyzeJob(params),
    /project-structure contract after 2 structure repair attempt/,
  );
  assert.equal(params.__runCalls.length, 3);
  assert.match(params.__runCalls[1].prompt, /PROJECT-STRUCTURE-REPAIR/);
  assert.match(params.__runCalls[2].prompt, /PROJECT-STRUCTURE-REPAIR/);
  assert.doesNotMatch(params.__runCalls[1].prompt, /Shared Generated-Code Repair Pipeline/);
  assert.doesNotMatch(params.__runCalls[2].prompt, /Shared Generated-Code Repair Pipeline/);
});

test('runAiAnalyzeJob routes FPGA Architect package-symbol visibility failures through the project-structure gate', async () => {
  const makeProject = (includePackageType: boolean) => JSON.stringify({
    projectName: 'mini_cpu',
    sanitizedProjectName: 'mini_cpu',
    topEntity: 'cpu_top',
    vhdlStandard: 'VHDL-2008',
    targetFpga: null,
    summary: 'summary',
    assumptions: [],
    warnings: [],
    folderTree: '',
    files: [
      {
        path: 'src/cpu_pkg.vhd',
        fileType: 'vhdl_package',
        purpose: 'shared package',
        content: [
          'library ieee;',
          'use ieee.std_logic_1164.all;',
          'package cpu_pkg is',
          includePackageType ? '  type data_mem_t is array (0 to 15) of std_logic_vector(7 downto 0);' : '  subtype data_t is std_logic_vector(7 downto 0);',
          'end package;',
        ].join('\n'),
      },
      {
        path: 'src/ram.vhd',
        fileType: 'vhdl_rtl',
        purpose: 'ram',
        content: [
          'library ieee;',
          'use ieee.std_logic_1164.all;',
          'use work.cpu_pkg.all;',
          'entity ram is end entity;',
          'architecture rtl of ram is',
          '  signal mem : data_mem_t;',
          'begin',
          'end architecture;',
        ].join('\n'),
      },
      {
        path: 'tb/tb_cpu_top.vhd',
        fileType: 'vhdl_testbench',
        purpose: 'tb',
        content: 'entity tb_cpu_top is end entity; architecture sim of tb_cpu_top is begin end architecture;',
      },
      { path: 'constraints/top.xdc', fileType: 'constraints', purpose: 'xdc', content: '#' },
      { path: 'Makefile', fileType: 'makefile', purpose: 'build', content: 'all:' },
      { path: 'README.md', fileType: 'markdown', purpose: 'docs', content: 'readme' },
      { path: 'sim/run_ghdl.sh', fileType: 'script', purpose: 'simulation', content: 'ghdl -a' },
      { path: 'requirements/spec.md', fileType: 'markdown', purpose: 'requirements', content: 'req' },
    ],
    ghdl: {
      analysisOrder: ['src/cpu_pkg.vhd', 'src/ram.vhd', 'tb/tb_cpu_top.vhd'],
      topTestbench: 'tb_cpu_top',
      runCommands: ['ghdl -a', 'ghdl -e', 'ghdl -r'],
      expectedResult: 'pass',
    },
    qualityChecklist: [],
  });
  let validationCalls = 0;
  const params = createBaseParams({
    macroId: 'fpga_vhdl_architect' as const,
    artifactDirectory: '.',
    macroSpec: { label: 'FPGA Architect' },
    normalizedProjectPath: '/private/tmp/logicpro-package-symbol-gate',
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
      return {
        text: makeProject(params.__runCalls.length > 1),
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
      outputDirectory: `${projectPath}/${project.sanitizedProjectName}`,
      savedFiles: project.files.map((file: any) => ({
        ...file,
        name: file.path.split('/').pop(),
        path: `${projectPath}/${project.sanitizedProjectName}/${file.path}`,
        kind: file.fileType === 'vhdl_testbench' ? 'testbench' : 'module',
      })),
    }),
    buildFpgaArchitectMarkdownReport: () => 'architect report',
    buildFpgaArchitectRetryPrompt: ({ originalPrompt, errorSummary }: { originalPrompt: string; errorSummary: string }) => `${originalPrompt}\n${errorSummary}`,
    buildFpgaArchitectJsonRepairPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nJSON-ONLY-REPAIR`,
    buildFpgaArchitectProjectStructureRepairPrompt: ({
      originalPrompt,
      errorSummary,
      currentManifestSummary,
    }: {
      originalPrompt: string;
      errorSummary: string;
      currentManifestSummary: string;
    }) => `${originalPrompt}\nPROJECT-STRUCTURE-REPAIR\n${errorSummary}\n${currentManifestSummary}`,
    buildFpgaArchitectCompactRetryPrompt: ({ originalPrompt }: { originalPrompt: string }) => `${originalPrompt}\nCOMPACT-REGEN`,
    validateGeneratedVhdlWithGhdl: async () => {
      validationCalls += 1;
      if (validationCalls === 1) {
        return {
          ok: false,
          stage: 'prevalidate' as const,
          summary: 'src/ram.vhd: uses custom type "data_mem_t" but that type is not visible.',
          logs: ['src/ram.vhd: data_mem_t missing'],
          validatedTopEntities: [],
          failureCode: 'package_symbol_not_visible',
          failureCategory: 'package_type_definition' as const,
          failureDetails: [{
            code: 'package_symbol_not_visible',
            category: 'package_type_definition' as const,
            message: 'src/ram.vhd:6: uses custom type "data_mem_t" but that type is not locally declared or exported by any imported work package.',
            excerpt: 'signal mem : data_mem_t;',
            relativePath: 'src/ram.vhd',
            lineHint: 6,
            forbiddenConstruct: 'custom type "data_mem_t" used without visible package/type declaration',
            legalReplacementPattern: 'declare data_mem_t in cpu_pkg, import cpu_pkg, and analyze cpu_pkg before ram.vhd',
          }],
        };
      }
      return {
        ok: true,
        stage: 'simulate' as const,
        summary: 'Generated VHDL passed GHDL simulation for tb_cpu_top.',
        logs: ['simulation pass'],
        validatedTopEntities: ['tb_cpu_top'],
      };
    },
  });

  const result = await runAiAnalyzeJob(params);

  assert.equal(params.__runCalls.length, 2);
  assert.match(params.__runCalls[1].prompt, /PROJECT-STRUCTURE-REPAIR/);
  assert.match(params.__runCalls[1].prompt, /data_mem_t/);
  assert.match(params.__runCalls[1].prompt, /cpu_pkg/);
  assert.doesNotMatch(params.__runCalls[1].prompt, /Shared Generated-Code Repair Pipeline/);
  assert.equal(result.retryUsed, true);
  assert.match(result.analysis, /architect report/);
});

test('runAiAnalyzeJob applies deterministic generated-code repairs before invoking the LLM repair prompt', async () => {
  const projectRoot = '/private/tmp/logicpro-deterministic-repair';
  let validationCalls = 0;
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
    validateGeneratedVhdlWithGhdl: async ({
      savedArtifacts,
      architectProject,
    }: {
      savedArtifacts: Array<{ path: string }>;
      architectProject?: any;
    }) => {
      validationCalls += 1;
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
      if (validationCalls > 1) {
        const projectSource = architectProject?.files?.find((file: any) => file.path === 'src/counter.vhd')?.content || '';
        assert.match(projectSource, /temp_v := 1;/);
        assert.doesNotMatch(projectSource, /temp_v <= 1;/);
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
    runModelAnalysis: async ({ prompt, provider, model }: { prompt: string; provider: string; model: string }) => {
      params.__runCalls.push({ prompt, provider, model });
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
        assert.equal(error?.generatedVhdlValidation?.repairAudit?.length, 10);
        assert.equal(error?.generatedVhdlValidation?.repairAudit?.[0]?.repairAttempt, 1);
        assert.equal(error?.generatedVhdlValidation?.repairAudit?.[9]?.repairAttempt, 10);
        assert.equal(error?.generatedVhdlValidation?.repairAudit?.[0]?.repairType, 'llm_no_change');
        assert.deepEqual(error?.generatedVhdlValidation?.repairAudit?.[0]?.changedFiles, []);
        assert.match(error?.generatedVhdlValidation?.logs.join('\n') || '', /INNER_REPAIR_AUDIT \| repairAttempt=1/i);
        assert.match(error?.generatedVhdlValidation?.logs.join('\n') || '', /failureCode=unknown/i);
        assert.match(error?.generatedVhdlValidation?.logs.join('\n') || '', /postRepairValidation=FAIL simulate/i);
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
