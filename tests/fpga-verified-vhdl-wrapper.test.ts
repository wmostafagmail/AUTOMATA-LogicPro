import assert from 'node:assert/strict';
import test from 'node:test';
import type { FpgaArchitectureContract } from '../src/server/fpgaArchitectureContract';
import { buildLeafInterfaceSignature, buildVhdlEntityInterfaceSignature } from '../src/server/fpgaGoldenLeafLibrary';
import type { VerifiedVhdlBlockNearMatch } from '../src/server/fpgaVerifiedVhdlBlockLibrary';
import { planVerifiedVhdlWrapper, renderVerifiedVhdlWrapper } from '../src/server/fpgaVerifiedVhdlWrapper';

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
