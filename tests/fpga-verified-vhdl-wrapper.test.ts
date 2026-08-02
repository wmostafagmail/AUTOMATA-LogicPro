import assert from 'node:assert/strict';
import test from 'node:test';
import type { FpgaArchitectureContract } from '../src/server/fpgaArchitectureContract';
import { buildLeafInterfaceSignature, buildVhdlEntityInterfaceSignature } from '../src/server/fpgaGoldenLeafLibrary';
import type { VerifiedVhdlBlockNearMatch } from '../src/server/fpgaVerifiedVhdlBlockLibrary';
import { planVerifiedVhdlWrapper, renderVerifiedVhdlWrapper } from '../src/server/fpgaVerifiedVhdlWrapper';
import { normalizeComponentContractForVerifiedCapability } from '../src/server/fpgaCapabilityContractNormalizer';
import { evaluateVerifiedVhdlParameterCompatibility } from '../src/server/fpgaVerifiedVhdlParameterGate';

const component = {
  id: 'rx_fifo',
  kind: 'rtl' as const,
  name: 'rx_fifo',
  file: 'src/rx_fifo.vhd',
  responsibility: 'Buffer bytes.',
  implements: [],
  dependsOn: [],
  children: [],
  clockDomain: 'clk',
  generics: [],
  ports: [
    { name: 'clk', mode: 'in' as const, type: 'std_logic', purpose: 'Clock.' },
    { name: 'rst', mode: 'in' as const, type: 'std_logic', purpose: 'Reset.' },
    { name: 'data_i', mode: 'in' as const, type: 'std_logic_vector(7 downto 0)', purpose: 'Input.' },
    { name: 'data_o', mode: 'out' as const, type: 'std_logic_vector(7 downto 0)', purpose: 'Output.' },
  ],
  exports: [],
};

const contract: FpgaArchitectureContract = {
  schemaVersion: '2.0',
  designName: 'wrapper_test',
  designClass: 'generic_fpga_vhdl_system',
  topEntity: 'wrapper_top',
  topTestbench: 'tb_wrapper_top',
  systemIntent: 'Exercise verified wrapper reuse.',
  assumptions: [],
  requiredCapabilityIds: [],
  components: [component],
  clockDomains: [],
  behaviors: [],
  verification: [],
  numericFormats: [],
  instances: [],
  connections: [],
  stateMachines: [],
  sourceOrder: [],
};

function makeCandidate(content: string, entityName: string, approvedComponent = component): VerifiedVhdlBlockNearMatch {
  const actualSignature = buildVhdlEntityInterfaceSignature(content, entityName);
  assert.ok(actualSignature);
  return {
    blockName: 'rx_fifo',
    entityName,
    relativeRtlPath: 'rtl/blocks/memory/rx_fifo.vhd',
    generatedRtlPath: 'lib/fpga_vhdl_blocks/blocks/memory/rx_fifo.vhd',
    relativeTestbenchPath: null,
    rtlContent: content,
    rtlFile: { path: 'lib/fpga_vhdl_blocks/blocks/memory/rx_fifo.vhd', fileType: 'vhdl_rtl', purpose: 'fixture', content },
    dependencyFiles: [],
    qualification: {
      libraryVersion: 'test',
      libraryRoot: '/tmp/test',
      ghdlVersion: 'GHDL test',
      verifiedAt: '2026-01-01T00:00:00.000Z',
      blockCount: 1,
      testbenchCount: 1,
      coreCount: 0,
      trustedForReuse: true,
      targets: {
        static: { ok: true, exitCode: 0, summary: 'ok' },
        'core-regression': { ok: true, exitCode: 0, summary: 'ok' },
        'all-smokes': { ok: true, exitCode: 0, summary: 'ok' },
      },
      warnings: [],
    },
    actualSignature,
    approvedSignature: buildLeafInterfaceSignature(approvedComponent),
  };
}

test('verified VHDL wrapper safely adapts renamed ports and unsigned output conversion', () => {
  const verifiedContent = [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'use ieee.numeric_std.all;',
    'entity bb_rx_fifo is',
    '  port (',
    '    clk_i : in std_logic;',
    '    rst_i : in std_logic;',
    '    din_i : in std_logic_vector(7 downto 0);',
    '    dout_o : out unsigned(7 downto 0)',
    '  );',
    'end entity;',
    'architecture rtl of bb_rx_fifo is begin',
    '  dout_o <= unsigned(din_i);',
    'end architecture;',
    '',
  ].join('\n');
  const candidate = makeCandidate(verifiedContent, 'bb_rx_fifo');
  const plan = planVerifiedVhdlWrapper({ component, candidate });
  assert.equal(plan.kind, 'wrapper_safe');
  assert.equal(plan.portAssociations.clk_i, 'clk');
  assert.equal(plan.portAssociations.rst_i, 'rst');
  assert.equal(plan.portAssociations.din_i, 'data_i');
  assert.match(plan.postInstanceAssignments.join('\n'), /data_o <= std_logic_vector\(w_dout_o_adapt\);/);

  const wrapper = renderVerifiedVhdlWrapper({ contract, component, plan });
  assert.match(wrapper, /entity rx_fifo is/);
  assert.match(wrapper, /u_verified_leaf : entity work\.bb_rx_fifo/);
  assert.match(wrapper, /dout_o => w_dout_o_adapt/);
});

test('verified VHDL wrapper rejects unsafe extra control input', () => {
  const verifiedContent = [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity bb_rx_fifo is',
    '  port (',
    '    clk : in std_logic;',
    '    rst : in std_logic;',
    '    mode_i : in std_logic;',
    '    data_i : in std_logic_vector(7 downto 0);',
    '    data_o : out std_logic_vector(7 downto 0)',
    '  );',
    'end entity;',
    'architecture rtl of bb_rx_fifo is begin',
    '  data_o <= data_i;',
    'end architecture;',
    '',
  ].join('\n');
  const candidate = makeCandidate(verifiedContent, 'bb_rx_fifo');
  const plan = planVerifiedVhdlWrapper({ component, candidate });
  assert.equal(plan.kind, 'wrapper_unsafe');
  assert.match(plan.unsafeReasons.join('\n'), /mode_i/);
});

test('verified VHDL wrapper maps deterministic video timing config inputs', () => {
  const syncComponent = {
    ...component,
    id: 'sync_generator',
    name: 'sync_generator',
    file: 'src/sync_generator.vhd',
    responsibility: 'Generate VGA/video sync timing from configured active/front/sync/back windows.',
    ports: [
      { name: 'clk', mode: 'in' as const, type: 'std_logic', purpose: 'Clock.' },
      { name: 'rst', mode: 'in' as const, type: 'std_logic', purpose: 'Reset.' },
      { name: 'hsync_o', mode: 'out' as const, type: 'std_logic', purpose: 'Horizontal sync.' },
      { name: 'vsync_o', mode: 'out' as const, type: 'std_logic', purpose: 'Vertical sync.' },
    ],
  };
  const verifiedContent = [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity sync_generator_det_cfg is',
    '  port (',
    '    clk : in std_logic;',
    '    rst : in std_logic;',
    '    h_active : in positive;',
    '    h_front : in positive;',
    '    h_sync : in positive;',
    '    h_back : in positive;',
    '    hsync : out std_logic;',
    '    vsync : out std_logic',
    '  );',
    'end entity;',
    'architecture rtl of sync_generator_det_cfg is begin',
    "  hsync <= '0';",
    "  vsync <= '0';",
    'end architecture;',
    '',
  ].join('\n');
  const candidate = makeCandidate(verifiedContent, 'sync_generator_det_cfg', syncComponent);
  const plan = planVerifiedVhdlWrapper({ component: syncComponent, candidate });
  assert.equal(plan.kind, 'wrapper_safe');
  assert.equal(plan.portAssociations.h_active, '640');
  assert.equal(plan.portAssociations.h_front, '16');
  assert.equal(plan.portAssociations.h_sync, '96');
  assert.equal(plan.portAssociations.h_back, '48');
  assert.ok(plan.mismatches.some((entry) => entry.kind === 'verified_config_input_defaulted'));
});

test('capability normalization promotes video timing config ports before wrapper planning', () => {
  const syncComponent = {
    ...component,
    id: 'sync_generator',
    name: 'sync_generator',
    file: 'src/sync_generator.vhd',
    responsibility: 'Generate sync pulses from timing counters.',
    ports: [
      { name: 'clk', mode: 'in' as const, type: 'std_logic', purpose: 'Clock.' },
      { name: 'rst', mode: 'in' as const, type: 'std_logic', purpose: 'Reset.' },
      { name: 'data_i', mode: 'in' as const, type: 'std_logic_vector(7 downto 0)', purpose: 'Broad placeholder input that sync generation does not consume.' },
      { name: 'hsync_o', mode: 'out' as const, type: 'std_logic', purpose: 'Horizontal sync.' },
      { name: 'vsync_o', mode: 'out' as const, type: 'std_logic', purpose: 'Vertical sync.' },
    ],
  };
  const normalized = normalizeComponentContractForVerifiedCapability({
    contract: { ...contract, components: [syncComponent] },
    component: syncComponent,
  });
  assert.equal(normalized.audit.capability, 'video_timing');
  for (const name of ['h_active', 'h_front', 'h_sync', 'h_back', 'v_active', 'v_front', 'v_sync', 'v_back']) {
    assert.ok(normalized.component.ports.some((port) => port.name === name), `${name} should be promoted`);
  }
  const verifiedContent = [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity sync_generator_det_cfg is',
    '  port (',
    '    clk : in std_logic;',
    '    rst : in std_logic;',
    '    h_active : in positive;',
    '    h_front : in positive;',
    '    h_sync : in positive;',
    '    h_back : in positive;',
    '    v_active : in positive;',
    '    v_front : in positive;',
    '    v_sync : in positive;',
    '    v_back : in positive;',
    '    hsync_o : out std_logic;',
    '    vsync_o : out std_logic',
    '  );',
    'end entity;',
    'architecture rtl of sync_generator_det_cfg is begin',
    "  hsync_o <= '0';",
    "  vsync_o <= '0';",
    'end architecture;',
    '',
  ].join('\n');
  const candidate = makeCandidate(verifiedContent, 'sync_generator_det_cfg', normalized.component as any);
  const parameterCompatibility = evaluateVerifiedVhdlParameterCompatibility({ component: normalized.component as any, candidate });
  assert.notEqual(parameterCompatibility.kind, 'parameter_unsafe');
  const plan = planVerifiedVhdlWrapper({ component: normalized.component as any, candidate, parameterCompatibility });
  assert.equal(plan.kind, 'wrapper_safe');
  assert.equal(plan.portAssociations.h_active, 'h_active');
  assert.ok(plan.mismatches.some((entry) => entry.kind === 'approved_leaf_input_ignored' && entry.approvedName === 'data_i'));
});

test('capability normalization promotes program-counter redirect contract before wrapper planning', () => {
  const pcComponent = {
    ...component,
    id: 'program_counter',
    name: 'program_counter',
    file: 'src/program_counter.vhd',
    responsibility: 'Maintain the CPU program counter.',
    ports: [
      { name: 'clk', mode: 'in' as const, type: 'std_logic', purpose: 'Clock.' },
      { name: 'rst', mode: 'in' as const, type: 'std_logic', purpose: 'Reset.' },
      { name: 'enable_i', mode: 'in' as const, type: 'std_logic', purpose: 'Advance enable.' },
      { name: 'data_i', mode: 'in' as const, type: 'std_logic_vector(7 downto 0)', purpose: 'Broad placeholder input not consumed by PC.' },
    ],
  };
  const normalized = normalizeComponentContractForVerifiedCapability({
    contract: { ...contract, components: [pcComponent] },
    component: pcComponent,
  });
  assert.equal(normalized.audit.capability, 'program_counter');
  assert.ok(normalized.component.ports.some((port) => port.name === 'redirect_pc_i'));
  assert.ok(normalized.component.ports.some((port) => port.name === 'redirect_valid_i'));
  const verifiedContent = [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity program_counter_det_cfg is',
    '  generic (',
    '    PC_WIDTH : positive := 32;',
    '    RESET_VECTOR : natural := 0;',
    '    INSTR_BYTES : positive := 4',
    '  );',
    '  port (',
    '    clk : in std_logic;',
    '    rst : in std_logic;',
    '    sequential_advance : in std_logic;',
    '    redirect_valid : in std_logic;',
    '    redirect_pc : in std_logic_vector(PC_WIDTH-1 downto 0);',
    '    pc_current : out std_logic_vector(PC_WIDTH-1 downto 0);',
    '    pc_valid : out std_logic',
    '  );',
    'end entity;',
    'architecture rtl of program_counter_det_cfg is begin',
    '  pc_current <= redirect_pc;',
    '  pc_valid <= redirect_valid;',
    'end architecture;',
    '',
  ].join('\n');
  const candidate = makeCandidate(verifiedContent, 'program_counter_det_cfg', normalized.component as any);
  const parameterCompatibility = evaluateVerifiedVhdlParameterCompatibility({ component: normalized.component as any, candidate });
  assert.notEqual(parameterCompatibility.kind, 'parameter_unsafe');
  const plan = planVerifiedVhdlWrapper({ component: normalized.component as any, candidate, parameterCompatibility });
  assert.equal(plan.kind, 'wrapper_safe');
  assert.equal(plan.portAssociations.redirect_pc, 'redirect_pc_i');
  assert.equal(plan.portAssociations.redirect_valid, 'redirect_valid_i');
  assert.ok(plan.mismatches.some((entry) => entry.kind === 'approved_leaf_input_ignored' && entry.approvedName === 'data_i'));
});

test('verified VHDL wrapper semantically adapts UART RX deterministic wrapper ports', () => {
  const uartComponent = {
    ...component,
    id: 'uart_rx',
    name: 'uart_rx',
    file: 'src/uart_rx.vhd',
    responsibility: 'Receive UART serial frames.',
    generics: [{ name: 'DATA_BITS', type: 'positive', default: '8' }],
    ports: [
      { name: 'clk', mode: 'in' as const, type: 'std_logic', purpose: 'Clock.' },
      { name: 'rst', mode: 'in' as const, type: 'std_logic', purpose: 'Active-high reset.' },
      { name: 'enable_i', mode: 'in' as const, type: 'std_logic', purpose: 'Wrapper enable.' },
      { name: 'rx_i', mode: 'in' as const, type: 'std_logic', purpose: 'UART RX serial input.' },
      { name: 'data_i', mode: 'in' as const, type: 'std_logic_vector(DATA_BITS-1 downto 0)', purpose: 'Erroneous payload input from broad contract.' },
      { name: 'data_o', mode: 'out' as const, type: 'std_logic_vector(DATA_BITS-1 downto 0)', purpose: 'Received data.' },
      { name: 'valid_o', mode: 'out' as const, type: 'std_logic', purpose: 'Data valid.' },
      { name: 'error_o', mode: 'out' as const, type: 'std_logic', purpose: 'Receive error.' },
    ],
  };
  const verifiedContent = [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity uart_rx_det_cfg is',
    '  generic (DATA_BITS : positive := 8; G_CONFIG_SCHEMA : natural := 1; G_CONFIG_ID : string := "UART_RX_FIXTURE");',
    '  port (',
    '    clk : in std_logic;',
    '    rst_n : in std_logic;',
    '    uart_rx : in std_logic;',
    '    rx_data : out std_logic_vector(DATA_BITS-1 downto 0);',
    '    rx_valid : out std_logic;',
    '    framing_error : out std_logic',
    '  );',
    'end entity;',
    'architecture rtl of uart_rx_det_cfg is begin',
    "  rx_data <= (others => '0');",
    "  rx_valid <= '0';",
    "  framing_error <= '0';",
    'end architecture;',
    '',
  ].join('\n');
  const candidate = makeCandidate(verifiedContent, 'uart_rx_det_cfg', uartComponent);
  const plan = planVerifiedVhdlWrapper({ component: uartComponent, candidate });
  assert.equal(plan.kind, 'wrapper_safe');
  assert.equal(plan.portAssociations.clk, 'clk');
  assert.match(plan.preInstanceAssignments.join('\n'), /w_rst_n_adapt <= not rst;/);
  assert.equal(plan.portAssociations.rst_n, 'w_rst_n_adapt');
  assert.equal(plan.portAssociations.uart_rx, 'rx_i');
  assert.equal(plan.portAssociations.rx_data, 'w_rx_data_adapt');
  assert.equal(plan.portAssociations.rx_valid, 'w_rx_valid_adapt');
  assert.equal(plan.portAssociations.framing_error, 'w_framing_error_adapt');
  assert.match(plan.postInstanceAssignments.join('\n'), /data_o <= w_rx_data_adapt when enable_i = '1' else \(others => '0'\);/);
  assert.match(plan.postInstanceAssignments.join('\n'), /valid_o <= w_rx_valid_adapt when enable_i = '1' else '0';/);
  assert.match(plan.postInstanceAssignments.join('\n'), /error_o <= w_framing_error_adapt when enable_i = '1' else '0';/);
  assert.ok(plan.mismatches.some((entry) => entry.kind === 'approved_leaf_input_ignored' && entry.approvedName === 'data_i'));
  const wrapper = renderVerifiedVhdlWrapper({
    contract: { ...contract, components: [uartComponent] },
    component: uartComponent,
    plan,
  });
  assert.match(wrapper, /u_verified_leaf : entity work\.uart_rx_det_cfg/);
  assert.match(wrapper, /rst_n => w_rst_n_adapt/);
  assert.match(wrapper, /uart_rx => rx_i/);
});

test('capability normalization makes UART TX bootstrap facade wrapper-safe without treating enable as valid', () => {
  const uartTxComponent = {
    ...component,
    id: 'uart_tx',
    name: 'uart_tx',
    file: 'src/uart_tx.vhd',
    responsibility: 'Transmit UART serial frames.',
    implements: ['uart_tx'],
    generics: [],
    ports: [
      { name: 'clk', mode: 'in' as const, type: 'std_logic', purpose: 'Clock.' },
      { name: 'rst', mode: 'in' as const, type: 'std_logic', purpose: 'Reset.' },
      { name: 'enable_i', mode: 'in' as const, type: 'std_logic', purpose: 'Generic wrapper enable, not a ready/valid request.' },
      { name: 'data_i', mode: 'in' as const, type: 'std_logic_vector(7 downto 0)', purpose: 'Payload byte.' },
    ],
  };
  const originalContract = { ...contract, components: [uartTxComponent] };
  const normalized = normalizeComponentContractForVerifiedCapability({
    contract: originalContract,
    component: uartTxComponent,
  });
  assert.deepEqual(uartTxComponent.ports.map((port) => port.name), ['clk', 'rst', 'enable_i', 'data_i']);
  assert.ok(normalized.component.ports.some((port) => port.name === 'valid_i'));
  assert.ok(normalized.component.ports.some((port) => port.name === 'ready_o'));
  assert.ok(normalized.component.ports.some((port) => port.name === 'tx_o'));
  assert.ok(normalized.component.ports.some((port) => port.name === 'busy_o'));

  const facadeContent = [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity uart_tx_basic is',
    '  generic (G_CLOCK_HZ : positive := 50000000; G_BAUD_RATE : positive := 115200; G_DATA_BITS : positive := 8);',
    '  port (clk_i : in std_logic; rst_ni : in std_logic; data_i : in std_logic_vector(G_DATA_BITS-1 downto 0); valid_i : in std_logic; ready_o : out std_logic; tx_o : out std_logic; busy_o : out std_logic);',
    'end entity;',
    'architecture rtl of uart_tx_basic is begin end architecture;',
    '',
  ].join('\n');
  const candidate = makeCandidate(facadeContent, 'uart_tx_basic', normalized.component as any);
  const parameterCompatibility = evaluateVerifiedVhdlParameterCompatibility({
    component: normalized.component as any,
    candidate,
  });
  assert.notEqual(parameterCompatibility.kind, 'parameter_unsafe');
  const plan = planVerifiedVhdlWrapper({ component: normalized.component, candidate, parameterCompatibility });
  assert.equal(plan.kind, 'wrapper_safe');
  assert.equal(plan.portAssociations.valid_i, 'valid_i');
  assert.notEqual(plan.portAssociations.valid_i, 'enable_i');
  assert.equal(plan.portAssociations.ready_o, 'ready_o');
  assert.equal(plan.portAssociations.tx_o, 'tx_o');
  assert.equal(plan.portAssociations.busy_o, 'busy_o');
});

test('verified VHDL wrapper resolves register-file read/write roles without swapping channels', () => {
  const registerComponent = {
    ...component,
    id: 'register_file',
    name: 'register_file',
    file: 'src/register_file.vhd',
    responsibility: 'Own CPU register storage, read ports, and write-data contract.',
    implements: ['register_file'],
    generics: [
      { name: 'ADDR_WIDTH', type: 'positive', default: '5' },
      { name: 'DATA_WIDTH', type: 'positive', default: '8' },
    ],
    ports: [
      { name: 'clk', mode: 'in' as const, type: 'std_logic', purpose: 'Clock.' },
      { name: 'rst', mode: 'in' as const, type: 'std_logic', purpose: 'Reset.' },
      { name: 'enable_i', mode: 'in' as const, type: 'std_logic', purpose: 'Transaction request.' },
      { name: 'src_addr', mode: 'in' as const, type: 'std_logic_vector(ADDR_WIDTH-1 downto 0)', purpose: 'Read address.' },
      { name: 'dst_addr', mode: 'in' as const, type: 'std_logic_vector(ADDR_WIDTH-1 downto 0)', purpose: 'Write address.' },
      { name: 'data_i', mode: 'in' as const, type: 'std_logic_vector(7 downto 0)', purpose: 'Write data.' },
      { name: 'data_o', mode: 'out' as const, type: 'std_logic_vector(7 downto 0)', purpose: 'Read data.' },
      { name: 'busy_o', mode: 'out' as const, type: 'std_logic', purpose: 'Busy.' },
      { name: 'done_o', mode: 'out' as const, type: 'std_logic', purpose: 'Done.' },
      { name: 'error_o', mode: 'out' as const, type: 'std_logic', purpose: 'Error.' },
    ],
  };
  const verifiedContent = [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity register_file_det_cfg is',
    '  generic (ADDR_WIDTH : positive := 5; DATA_WIDTH : positive := 8);',
    '  port (',
    '    clk : in std_logic;',
    '    rst_n : in std_logic;',
    '    start : in std_logic;',
    '    src_addr : in std_logic_vector(ADDR_WIDTH-1 downto 0);',
    '    dst_addr : in std_logic_vector(ADDR_WIDTH-1 downto 0);',
    '    data_in : in std_logic_vector(DATA_WIDTH-1 downto 0);',
    '    data_out : out std_logic_vector(DATA_WIDTH-1 downto 0);',
    '    busy : out std_logic;',
    '    done : out std_logic;',
    '    error : out std_logic',
    '  );',
    'end entity;',
    'architecture rtl of register_file_det_cfg is begin end architecture;',
    '',
  ].join('\n');
  const candidate = makeCandidate(verifiedContent, 'register_file_det_cfg', registerComponent);
  const plan = planVerifiedVhdlWrapper({
    component: registerComponent,
    candidate,
    parameterCompatibility: {
      kind: 'parameter_exact',
      genericMap: { addr_width: 'ADDR_WIDTH', data_width: 'DATA_WIDTH' },
      resolvedValues: { addr_width: '5', data_width: '8' },
      constraints: [],
      derivations: [],
      unsafeReasons: [],
      requiresConfiguredSmoke: false,
      configurationHash: 'test',
    },
  });
  assert.equal(plan.kind, 'wrapper_safe');
  assert.equal(plan.portAssociations.src_addr, 'src_addr');
  assert.equal(plan.portAssociations.dst_addr, 'dst_addr');
  assert.notEqual(plan.portAssociations.src_addr, 'dst_addr');
  assert.equal(plan.portAssociations.data_in, 'data_i');
  assert.equal(plan.portAssociations.data_out, 'data_o');
});
