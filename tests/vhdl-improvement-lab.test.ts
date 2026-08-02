import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  assembleVhdlWithFrozenEntity,
  adviseVhdlLabFailure,
  applyDeterministicVhdlLabSimulationRepair,
  classifyVhdlLabFailure,
  ensureVhdlLabStorage,
  extractOneVhdlArtifact,
  normalizeSingleFileVhdlContextClauses,
  normalizeFailureSignature,
  parseVhdlEntityInterface,
  readVhdlLabState,
  renderVhdlLabSelfCheckingTestbench,
  staticPolicyCheckVhdl,
  stripModelChatTokensFromVhdlResponse,
  validateSingleFileWorkUnitDependencies,
  validateVhdlContractDocument,
  writeVhdlLabState,
  type VhdlContractDocument,
} from '../src/server/vhdlImprovementLab.ts';

const validContract: VhdlContractDocument = {
  contract_version: '1.0',
  entity: { name: 'lab_counter' },
  generics: [{ name: 'WIDTH', type: 'positive', default: '8' }],
  ports: [
    { name: 'clk', mode: 'in', type: 'std_logic' },
    { name: 'rst', mode: 'in', type: 'std_logic' },
    { name: 'enable_i', mode: 'in', type: 'std_logic' },
    { name: 'count_o', mode: 'out', type: 'unsigned(WIDTH - 1 downto 0)' },
  ],
  clocking: { domains: [{ name: 'main', clock_port: 'clk', edge: 'rising' }] },
  reset: { port: 'rst', polarity: 'active_high', synchronous: true },
  behavior: ['increment when enabled'],
  corner_cases: ['reset while enabled'],
  prohibited_implementations: ['std_logic_unsigned'],
  synthesis_requirements: ['numeric_std only'],
  testbench_obligations: ['self-check reset and increment'],
  pass_marker: 'PASS',
};

test('VHDL lab contract validation accepts a complete strict contract', () => {
  const result = validateVhdlContractDocument(validContract);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.contract.entity.name, 'lab_counter');
    assert.match(result.hash, /^[a-f0-9]{64}$/);
  }
});

test('VHDL lab contract validation rejects duplicate ports and missing clock domains', () => {
  const result = validateVhdlContractDocument({
    ...validContract,
    clocking: undefined,
    ports: [
      { name: 'clk', mode: 'in', type: 'std_logic' },
      { name: 'clk', mode: 'out', type: 'std_logic' },
    ],
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert(result.issues.some((issue) => issue.code === 'port_duplicate'));
    assert(result.issues.some((issue) => issue.code === 'clocking_missing'));
  }
});

test('VHDL lab extraction accepts exactly one complete VHDL artifact', () => {
  const result = extractOneVhdlArtifact(`
\`\`\`vhdl
library ieee;
use ieee.std_logic_1164.all;

entity lab_counter is
  port (clk : in std_logic);
end entity;

architecture rtl of lab_counter is
begin
end architecture;
\`\`\`
`);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.entityName, 'lab_counter');
    assert.equal(result.architectureName, 'rtl');
  }
});

test('VHDL lab extraction rejects multiple fenced artifacts', () => {
  const result = extractOneVhdlArtifact('```vhdl\nentity a is end;\n```\n```vhdl\nentity b is end;\n```');
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.issues[0].code, 'vhdl_extraction_multiple_blocks');
});

test('VHDL lab extraction strips leaked model chat boundary tokens', () => {
  const raw = `
library ieee;
use ieee.std_logic_1164.all;

entity lab_counter is
end entity;

architecture rtl of lab_counter is
begin
end architecture;
<|im_end|>
`;
  const result = extractOneVhdlArtifact(raw);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.doesNotMatch(result.vhdl, /<\|im_end\|>/);
    assert.match(result.vhdl, /architecture\s+rtl\s+of\s+lab_counter\s+is/i);
  }
  assert.doesNotMatch(stripModelChatTokensFromVhdlResponse(raw), /<\|im_end\|>/);
});

test('VHDL lab static policy rejects unsafe packages and placeholders', () => {
  const issues = staticPolicyCheckVhdl(`
library ieee;
use ieee.std_logic_unsigned.all;
entity demo is end;
architecture rtl of demo is
begin
  -- TODO implementation omitted
end architecture;
`);
  assert(issues.some((issue) => issue.code === 'static_policy_std_logic_unsigned'));
  assert(issues.some((issue) => issue.code === 'static_policy_placeholder'));
});

test('VHDL lab static policy flags leaked model chat tokens', () => {
  const issues = staticPolicyCheckVhdl('entity demo is end entity;\n<|im_end|>\n');
  assert(issues.some((issue) => issue.code === 'model_chat_token_leakage'));
});

test('VHDL lab assembly replaces model entity with frozen contract interface', () => {
  const assembled = assembleVhdlWithFrozenEntity(`
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity lab_counter is
  port (
    clk : in std_logic;
    extra_i : in std_logic
  );
end entity;

architecture rtl of lab_counter is
begin
  count_o <= (others => '0');
end architecture;
`, {
    id: 'contract_test',
    name: 'test',
    version: 1,
    status: 'VALIDATED',
    taskFamily: 'test',
    entityName: 'lab_counter',
    contractJson: validContract,
    contractHash: 'hash',
    sourceType: 'fixture',
    sourceReference: null,
    holdoutGroup: null,
    isBenchmarkHoldout: false,
    createdBy: 'test',
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  });
  assert.match(assembled, /enable_i\s*:\s*in\s+std_logic/i);
  assert.match(assembled, /count_o\s*:\s*out\s+unsigned\(WIDTH - 1 downto 0\)/i);
  assert.doesNotMatch(assembled, /extra_i\s*:/i);
  assert.match(assembled, /architecture\s+rtl\s+of\s+lab_counter\s+is/i);
});

test('VHDL lab interface parser keeps ports after ranged vector and numeric types', () => {
  const parsed = parseVhdlEntityInterface(`
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity video_pattern_generator_top is
  generic (
    H_ACTIVE : positive := 640;
    V_ACTIVE : positive := 480
  );
  port (
    clk : in std_logic;
    rst : in std_logic;
    pixel_x_o : out unsigned(9 downto 0);
    pixel_rgb_o : out std_logic_vector(23 downto 0);
    pixel_addr_o : out unsigned(18 downto 0);
    frame_valid_o : out std_logic
  );
end entity;

architecture rtl of video_pattern_generator_top is
begin
end architecture;
`, 'video_pattern_generator_top');

  assert(parsed);
  assert.deepEqual(parsed.ports.map((port) => port.name), [
    'clk',
    'rst',
    'pixel_x_o',
    'pixel_rgb_o',
    'pixel_addr_o',
    'frame_valid_o',
  ]);
  assert.equal(parsed.ports.find((port) => port.name === 'pixel_addr_o')?.type, 'unsigned(18 downto 0)');
});

test('VHDL lab self-checking testbench renders DUT, generic map, clock, and pass marker', () => {
  const tb = renderVhdlLabSelfCheckingTestbench({
    id: 'contract_test',
    name: 'test',
    version: 1,
    status: 'VALIDATED',
    taskFamily: 'test',
    entityName: 'lab_counter',
    contractJson: validContract,
    contractHash: 'hash',
    sourceType: 'fixture',
    sourceReference: null,
    holdoutGroup: null,
    isBenchmarkHoldout: false,
    createdBy: 'test',
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  });

  assert.match(tb, /entity\s+tb_lab_counter\s+is/i);
  assert.match(tb, /dut\s*:\s*entity\s+work\.lab_counter/i);
  assert.match(tb, /constant\s+WIDTH\s*:\s*positive\s*:=\s*8\s*;/i);
  assert.match(tb, /generic\s+map\s*\(\s*WIDTH\s*=>\s*8/is);
  assert.match(tb, /clk_gen\s*:\s*process/i);
  assert.match(tb, /report\s+"PASS"\s+severity\s+note/i);
});

test('VHDL lab advisor identifies app testbench generic-scope failures', () => {
  const advisor = adviseVhdlLabFailure({
    stage: 'testbench_analyzing',
    message: '../testbench/tb_lab_counter.vhd:12:29:error: no declaration for "width"',
    content: 'signal count_o : unsigned(WIDTH-1 downto 0);',
  });
  assert.equal(advisor.rootCauseOwner, 'app_testbench_renderer');
  assert.equal(advisor.failureClass, 'testbench_generic_constant_missing');
  assert.equal(advisor.deterministicFixPossible, true);
});

test('VHDL lab deterministic simulation repair fixes video pixel address bounds template', () => {
  const vhdl = `
entity video_pattern_generator_top is
  port (pixel_addr_o : out unsigned(18 downto 0));
end entity;
architecture rtl of video_pattern_generator_top is
  constant H_ACTIVE : natural := 640;
  signal h_count : unsigned(9 downto 0);
  signal v_count : unsigned(9 downto 0);
  signal active_video : std_logic;
begin
  pixel_addr_o <= (v_count(8 downto 0) & h_count(9 downto 2));
end architecture;`;
  const repair = applyDeterministicVhdlLabSimulationRepair({
    contract: {
      id: 'contract_video',
      name: 'video',
      version: 1,
      status: 'VALIDATED',
      taskFamily: 'test',
      entityName: 'video_pattern_generator_top',
      contractJson: { ...validContract, entity: { name: 'video_pattern_generator_top' } },
      contractHash: 'hash',
      sourceType: 'fixture',
      sourceReference: null,
      holdoutGroup: null,
      isBenchmarkHoldout: false,
      createdBy: 'test',
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    },
    vhdl,
    simulationOutput: 'bound check failure at video_pattern_generator_top.vhd:90',
  });
  assert.equal(repair.ok, true);
  if (repair.ok) {
    assert.match(repair.vhdl, /to_unsigned\(\(to_integer\(v_count\) \* H_ACTIVE\) \+ to_integer\(h_count\), pixel_addr_o'length\)/);
    assert.match(repair.vhdl, /when active_video = '1' else \(others => '0'\)/);
  }
});

test('VHDL lab deterministic simulation repair fixes DSP accumulator sizing template', () => {
  const vhdl = `
architecture rtl of dsp_chain_top is
begin
  fir_filter_proc : process(clk, rst)
    variable sum : signed(DATA_WIDTH+2 downto 0);
  begin
    sum := resize(fir_input_reg * COEFF_0, DATA_WIDTH+2)
         + resize(fir_input_reg * COEFF_1, DATA_WIDTH+2)
         + resize(fir_input_reg * COEFF_2, DATA_WIDTH+2);
    fir_output <= sum(DATA_WIDTH+1 downto 0);
  end process;
end architecture;`;
  const repair = applyDeterministicVhdlLabSimulationRepair({
    contract: {
      id: 'contract_dsp',
      name: 'dsp',
      version: 1,
      status: 'VALIDATED',
      taskFamily: 'test',
      entityName: 'dsp_chain_top',
      contractJson: { ...validContract, entity: { name: 'dsp_chain_top' } },
      contractHash: 'hash',
      sourceType: 'fixture',
      sourceReference: null,
      holdoutGroup: null,
      isBenchmarkHoldout: false,
      createdBy: 'test',
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    },
    vhdl,
    simulationOutput: 'bound check failure at dsp_chain_top.vhd:52 instance fir_filter_proc',
  });
  assert.equal(repair.ok, true);
  if (repair.ok) {
    assert.match(repair.vhdl, /variable sum : signed\(\(DATA_WIDTH \* 2\) \+ 2 downto 0\);/);
    assert.match(repair.vhdl, /resize\(fir_input_reg \* COEFF_0, sum'length\)/);
    assert.match(repair.vhdl, /fir_output\s*<=\s*resize\(sum, fir_output'length\);/);
  }
});

test('VHDL lab deterministic simulation repair fixes DSP square output sizing', () => {
  const vhdl = `
architecture rtl of dsp_chain_top is
  signal fft_input : signed(DATA_WIDTH+1 downto 0);
  signal fft_output : signed(31 downto 0);
begin
  fft_proc : process(clk, rst)
  begin
    if rising_edge(clk) then
      fft_output <= fft_input * fft_input;
    end if;
  end process;
end architecture;`;
  const repair = applyDeterministicVhdlLabSimulationRepair({
    contract: {
      id: 'contract_dsp',
      name: 'dsp',
      version: 1,
      status: 'VALIDATED',
      taskFamily: 'test',
      entityName: 'dsp_chain_top',
      contractJson: { ...validContract, entity: { name: 'dsp_chain_top' } },
      contractHash: 'hash',
      sourceType: 'fixture',
      sourceReference: null,
      holdoutGroup: null,
      isBenchmarkHoldout: false,
      createdBy: 'test',
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    },
    vhdl,
    simulationOutput: 'bound check failure at dsp_chain_top.vhd:82 instance fft_proc',
  });
  assert.equal(repair.ok, true);
  if (repair.ok) {
    assert.match(repair.vhdl, /fft_output\s*<=\s*resize\(fft_input \* fft_input, fft_output'length\);/);
  }
});

test('VHDL lab single-file dependency validation rejects missing work units before GHDL', () => {
  const issues = validateSingleFileWorkUnitDependencies(`
library ieee;
use ieee.std_logic_1164.all;

entity bridge_top is
  port (clk : in std_logic);
end entity;

architecture rtl of bridge_top is
begin
  u_rx: entity work.uart_receiver
    port map (clk => clk);
end architecture;
`, 'bridge_top');
  assert(issues.some((issue) => issue.code === 'missing_work_unit_dependency'));
  assert.match(issues.find((issue) => issue.code === 'missing_work_unit_dependency')?.message || '', /work\.uart_receiver/);
});

test('VHDL lab single-file dependency validation rejects unqualified missing direct entities before GHDL', () => {
  const issues = validateSingleFileWorkUnitDependencies(`
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity bridge_top is
  port (clk : in std_logic);
end entity;

architecture rtl of bridge_top is
begin
  u_core: entity bb_core port map (clk => clk);
end architecture;
`, 'bridge_top');
  assert(issues.some((issue) => issue.code === 'missing_work_unit_dependency'));
  assert.match(issues.find((issue) => issue.code === 'missing_work_unit_dependency')?.message || '', /entity bb_core/);
});

test('VHDL lab single-file dependency validation allows helpers declared in same artifact', () => {
  const issues = validateSingleFileWorkUnitDependencies(`
entity helper is end entity;
architecture rtl of helper is begin end architecture;

entity bridge_top is
  port (clk : in bit);
end entity;

architecture rtl of bridge_top is
begin
  u_helper: entity work.helper;
end architecture;
`, 'bridge_top');
  assert.deepEqual(issues, []);
});

test('VHDL lab single-file dependency validation rejects child units declared after use', () => {
  const issues = validateSingleFileWorkUnitDependencies(`
entity bridge_top is
  port (clk : in bit);
end entity;

architecture rtl of bridge_top is
begin
  u_helper: entity work.helper;
end architecture;

entity helper is end entity;
architecture rtl of helper is begin end architecture;
`, 'bridge_top');
  assert(issues.some((issue) => issue.code === 'single_file_work_unit_order'));
  assert.match(issues.find((issue) => issue.code === 'single_file_work_unit_order')?.message || '', /before entity helper is declared/);
});

test('VHDL lab single-file dependency validation rejects missing local IEEE context clauses', () => {
  const issues = validateSingleFileWorkUnitDependencies(`
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity helper is
  port (clk : in std_logic);
end entity;

architecture rtl of helper is
begin
end architecture;

entity bridge_top is
  port (clk : in std_logic);
end entity;

architecture rtl of bridge_top is
begin
  u_helper: entity work.helper port map (clk => clk);
end architecture;
`, 'bridge_top');
  assert(issues.some((issue) => issue.code === 'missing_context_clause_for_design_unit'));
});

test('VHDL lab context normalizer repeats IEEE clauses before design units', () => {
  const normalized = normalizeSingleFileVhdlContextClauses(`
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity helper is
  port (clk : in std_logic);
end entity;

architecture rtl of helper is
begin
end architecture;

entity bridge_top is
  port (clk : in std_logic);
end entity;

architecture rtl of bridge_top is
begin
  u_helper: entity work.helper port map (clk => clk);
end architecture;
`);
  const contextCount = (normalized.match(/use\s+ieee\.std_logic_1164\.all\s*;/gi) || []).length;
  assert(contextCount >= 4);
  assert.deepEqual(validateSingleFileWorkUnitDependencies(normalized, 'bridge_top'), []);
});

test('VHDL lab extraction allows top entity with top architecture after child units', () => {
  const result = extractOneVhdlArtifact(`
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity bridge_top is
  port (clk : in std_logic);
end entity;

entity helper is
  port (clk : in std_logic);
end entity;

architecture rtl of helper is
begin
end architecture;

architecture rtl of bridge_top is
begin
  u_helper: entity work.helper port map (clk => clk);
end architecture;
`);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.entityName, 'bridge_top');
    assert.equal(result.architectureName, 'rtl');
  }
});

test('VHDL lab failure classification and signatures are stable', () => {
  assert.equal(classifyVhdlLabFailure({ stage: 'ghdl analyze', message: 'no function declarations for operator +' }), 'VHDL_TYPE_ERROR');
  assert.equal(classifyVhdlLabFailure({ stage: 'validating_dependencies', message: 'missing_work_unit_dependency: entity work.uart_receiver is missing' }), 'DEPENDENCY_FAILURE');
  assert.equal(classifyVhdlLabFailure({ stage: 'repairing', message: 'model_repair_timeout: This operation was aborted' }), 'MODEL_REPAIR_TIMEOUT');
  assert.equal(classifyVhdlLabFailure({ stage: 'generating', message: 'model_generation_timeout: AbortError' }), 'MODEL_GENERATION_TIMEOUT');
  assert.equal(classifyVhdlLabFailure({ stage: 'validating_static_policy', message: 'model_chat_token_leakage: <|im_end|>' }), 'MODEL_CHAT_TOKEN_LEAKAGE');
  const one = normalizeFailureSignature({ stage: 'analyze', category: 'VHDL_TYPE_ERROR', message: '/tmp/a.vhd:42 no function declarations' });
  const two = normalizeFailureSignature({ stage: 'analyze', category: 'VHDL_TYPE_ERROR', message: '/private/tmp/b.vhd:99 no function declarations' });
  assert.equal(one, two);
});

test('VHDL lab JSON storage initializes and persists state', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-test-'));
  await ensureVhdlLabStorage(root);
  const state = await readVhdlLabState(root);
  assert.equal(state.schemaVersion, 1);
  assert.equal(state.providers[0].providerType, 'OLLAMA');
  assert(state.providers.some((provider) => provider.providerType === 'LM_STUDIO'));
  state.models.push({
    id: 'model_test',
    providerId: state.providers[0].id,
    displayName: 'Test Model',
    modelIdentifier: 'test/model',
    localPath: null,
    role: 'GENERATOR',
    contextLength: 4096,
    defaultTemperature: 0.1,
    defaultSeed: 1,
    defaultMaxTokens: 512,
    supportsStructuredOutput: false,
    supportsTools: false,
    enabled: true,
    metadata: {},
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  });
  await writeVhdlLabState(state, root);
  const reloaded = await readVhdlLabState(root);
  assert.equal(reloaded.models.length, 1);
});

test('VHDL lab JSON storage recovers from appended corrupt tail', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-corrupt-state-test-'));
  await ensureVhdlLabStorage(root);
  const state = await readVhdlLabState(root);
  await writeVhdlLabState({ ...state, models: [] }, root);
  const statePath = path.join(root, 'vhdl-lab-state.json');
  await fs.appendFile(statePath, '"artifactPath": "dangling duplicate tail"\n');
  const recovered = await readVhdlLabState(root);
  assert.equal(recovered.schemaVersion, 1);
  assert.equal(recovered.models.length, 0);
  const clean = await fs.readFile(statePath, 'utf8');
  assert.doesNotMatch(clean, /dangling duplicate tail/);
  const backups = await fs.readdir(root);
  assert(backups.some((file) => /vhdl-lab-state\.json\.corrupt-.*\.bak/.test(file)));
});

test('VHDL lab state writes tolerate concurrent auto-refresh and worker updates', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-concurrent-state-test-'));
  await ensureVhdlLabStorage(root);
  const state = await readVhdlLabState(root);
  await Promise.all(Array.from({ length: 20 }, async (_, index) => {
    await writeVhdlLabState({
      ...state,
      models: [{
        id: `model_${index}`,
        providerId: 'provider_ollama_local',
        displayName: `Model ${index}`,
        modelIdentifier: `model-${index}`,
        localPath: null,
        role: 'GENERATOR',
        contextLength: 4096,
        defaultTemperature: 0.1,
        defaultSeed: index,
        defaultMaxTokens: 512,
        supportsStructuredOutput: false,
        supportsTools: false,
        enabled: true,
        metadata: {},
        createdAt: new Date(index).toISOString(),
        updatedAt: new Date(index).toISOString(),
      }],
    }, root);
  }));
  const statePath = path.join(root, 'vhdl-lab-state.json');
  const raw = await fs.readFile(statePath, 'utf8');
  assert.doesNotThrow(() => JSON.parse(raw));
  const leftovers = (await fs.readdir(root)).filter((file) => /\.tmp$/.test(file));
  assert.deepEqual(leftovers, []);
});
