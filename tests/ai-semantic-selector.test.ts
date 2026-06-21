import test from 'node:test';
import assert from 'node:assert/strict';

process.env.AI_SELECTOR_TEST_MODE = '1';

const { __semanticTestHooks } = await import('../server.ts');

const makeSignal = (name: string, values: Array<number | string>) => ({
  id: name,
  name,
  type: 'wire' as const,
  values,
});

const semanticFixtureSources = [
  {
    path: 'rtl/spi_core.vhd',
    isTestbench: false,
    content: `
entity spi_core is
  generic (
    WIDTH : integer := 8
  );
  port (
    clk       : in  std_logic;
    reset_n   : in  std_logic;
    start_tx  : in  std_logic;
    spi_mosi  : out std_logic;
    spi_sck   : out std_logic;
    data_byte : out std_logic_vector(7 downto 0);
    state_dbg : out std_logic_vector(1 downto 0)
  );
end entity;

architecture rtl of spi_core is
  signal tx_state : std_logic_vector(1 downto 0);
begin
  state_dbg <= tx_state;
  tx_state <= start_tx & reset_n;
  spi_mosi <= start_tx;
  spi_sck <= clk;
  data_byte <= tx_state & tx_state & tx_state & tx_state;
end architecture;
`,
  },
  {
    path: 'rtl/dut_wrapper.vhd',
    isTestbench: false,
    content: `
entity dut_wrapper is
  port (
    wrapper_clk    : in  std_logic;
    wrapper_reset_n: in  std_logic;
    wrapper_start  : in  std_logic;
    wrapper_mosi   : out std_logic;
    wrapper_sck    : out std_logic;
    wrapper_data   : out std_logic_vector(7 downto 0);
    wrapper_state  : out std_logic_vector(1 downto 0)
  );
end entity;

architecture rtl of dut_wrapper is
  alias launch_alias is wrapper_start;
begin
  u_core: entity work.spi_core
    generic map (
      WIDTH => 8
    )
    port map (
      clk       => wrapper_clk,
      reset_n   => wrapper_reset_n,
      start_tx  => launch_alias,
      spi_mosi  => wrapper_mosi,
      spi_sck   => wrapper_sck,
      data_byte => wrapper_data,
      state_dbg => wrapper_state
    );
end architecture;
`,
  },
  {
    path: 'tb/tb_spi.vhd',
    isTestbench: true,
    content: `
entity tb_spi is
end entity;

architecture sim of tb_spi is
  signal tb_clk         : std_logic := '0';
  signal tb_reset_n     : std_logic := '0';
  signal launch_req     : std_logic := '0';
  signal bus_mosi       : std_logic;
  signal bus_sck        : std_logic;
  signal observed_data  : std_logic_vector(7 downto 0);
  signal observed_state : std_logic_vector(1 downto 0);
  signal dut_start      : std_logic;
  alias start_alias is launch_req;
begin
  dut_start <= start_alias;

  gen_spi: if true generate
    u_wrap: entity work.dut_wrapper
      port map (
        wrapper_clk     => tb_clk,
        wrapper_reset_n => tb_reset_n,
        wrapper_start   => dut_start,
        wrapper_mosi    => bus_mosi,
        wrapper_sck     => bus_sck,
        wrapper_data    => observed_data,
        wrapper_state   => observed_state
      );
  end generate;
end architecture;
`,
  },
];

test('buildMacroSignalIndexFromFixtures traverses generic-map instances inside generate blocks', () => {
  const index = __semanticTestHooks.buildMacroSignalIndexFromFixtures({
    rootEntity: 'tb_spi',
    sources: semanticFixtureSources,
  });

  assert.equal(index.rootEntity, 'tb_spi');
  assert.ok(index.reachableEntities.includes('dut_wrapper'));
  assert.ok(index.reachableEntities.includes('spi_core'));
  assert.equal(index.entityRoles.tb_spi, 'testbench');
  assert.equal(index.entityRoles.dut_wrapper, 'wrapper');
  assert.equal(index.entityRoles.spi_core, 'protocol');
  assert.ok(index.categorySignals.clockReset.includes('tb_clk'));
  assert.ok(index.categorySignals.protocol.includes('bus_mosi'));
  assert.ok(index.categorySignals.protocol.includes('bus_sck'));
});

test('selectMacroSignals ranks protocol entities ahead of wrappers for protocol-focused macros', () => {
  const index = __semanticTestHooks.buildMacroSignalIndexFromFixtures({
    rootEntity: 'tb_spi',
    sources: semanticFixtureSources,
  });

  const result = __semanticTestHooks.selectMacroSignals({
    macroId: 'protocol_decoder_details',
    signals: [
      makeSignal('tb_clk', [0, 1, 0, 1, 0, 1]),
      makeSignal('tb_reset_n', [0, 0, 1, 1, 1, 1]),
      makeSignal('launch_req', [0, 0, 1, 0, 0, 1]),
      makeSignal('bus_mosi', [0, 1, 0, 1, 0, 1]),
      makeSignal('bus_sck', [0, 1, 0, 1, 0, 1]),
      makeSignal('observed_data', ['00000000', '00000001', '00000011']),
      makeSignal('observed_state', ['00', '01', '10']),
    ],
    index,
  });

  assert.equal(result.focusEntities[0], 'spi_core');
  assert.ok(result.focusEntities.includes('dut_wrapper'));
  assert.ok(result.selectedSignals.some((signal: { name?: string }) => signal.name === 'bus_mosi'));
  assert.ok(result.selectedSignals.some((signal: { name?: string }) => signal.name === 'bus_sck'));
});

test('inferEntityRole uses signal and port semantics, not only entity names', () => {
  const inferred = __semanticTestHooks.inferEntityRole(
    {
      name: 'mystery_block',
      sourcePath: 'rtl/mystery_block.vhd',
      ports: ['addr_in', 'data_out', 'write_enable'],
      localSignals: ['ram_index'],
      aliases: [],
      assignments: [],
      instances: [],
      generateBlockCount: 0,
      isTestbench: false,
    },
    'mystery_block',
    'rtl/mystery_block.vhd'
  );

  assert.equal(inferred, 'memory');
});

test('selectMacroSignals keeps available signals when semantic matching is weak', () => {
  const index = __semanticTestHooks.buildMacroSignalIndexFromFixtures({
    rootEntity: 'tb_spi',
    sources: semanticFixtureSources,
  });

  const result = __semanticTestHooks.selectMacroSignals({
    macroId: 'custom_query',
    signals: [
      makeSignal('mystery_probe_a', [0, 0, 1, 0]),
      makeSignal('mystery_probe_b', [1, 1, 0, 1]),
    ],
    index,
  });

  assert.equal(result.selectedSignals.length, 2);
  assert.deepEqual(
    result.selectedSignals.map((signal: { name?: string }) => signal.name),
    ['mystery_probe_a', 'mystery_probe_b']
  );
});
