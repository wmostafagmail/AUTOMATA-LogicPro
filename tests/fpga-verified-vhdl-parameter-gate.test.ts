import assert from 'node:assert/strict';
import test from 'node:test';
import type { FpgaArchitectureComponentContract } from '../src/server/fpgaArchitectureContract';
import { buildLeafInterfaceSignature, buildVhdlEntityInterfaceSignature } from '../src/server/fpgaGoldenLeafLibrary';
import type { VerifiedVhdlBlockNearMatch } from '../src/server/fpgaVerifiedVhdlBlockLibrary';
import {
  evaluateVerifiedVhdlParameterCompatibility,
  hasSamePublicInterfaceIgnoringGenericDefaults,
} from '../src/server/fpgaVerifiedVhdlParameterGate';

function fifoComponent(width = 8, depth = 16): FpgaArchitectureComponentContract {
  return {
    id: 'rx_fifo',
    kind: 'rtl',
    name: 'rx_fifo',
    file: 'src/rx_fifo.vhd',
    responsibility: 'FIFO.',
    implements: [],
    dependsOn: [],
    children: [],
    clockDomain: 'clk',
    generics: [
      { name: 'DATA_WIDTH', type: 'positive', default: String(width) },
      { name: 'DEPTH', type: 'positive', default: String(depth) },
    ],
    ports: [
      { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
      { name: 'rst', mode: 'in', type: 'std_logic', purpose: 'Reset.' },
      { name: 'data_i', mode: 'in', type: 'std_logic_vector(DATA_WIDTH-1 downto 0)', purpose: 'Input.' },
      { name: 'data_o', mode: 'out', type: 'std_logic_vector(DATA_WIDTH-1 downto 0)', purpose: 'Output.' },
    ],
    exports: [],
  };
}

function makeCandidate(component: FpgaArchitectureComponentContract, rtlContent: string): VerifiedVhdlBlockNearMatch {
  const actualSignature = buildVhdlEntityInterfaceSignature(rtlContent, 'rx_fifo');
  assert.ok(actualSignature);
  return {
    blockName: 'rx_fifo',
    entityName: 'rx_fifo',
    relativeRtlPath: 'rtl/blocks/memory/rx_fifo.vhd',
    generatedRtlPath: 'lib/fpga_vhdl_blocks/blocks/memory/rx_fifo.vhd',
    relativeTestbenchPath: null,
    rtlContent,
    rtlFile: { path: 'lib/fpga_vhdl_blocks/blocks/memory/rx_fifo.vhd', fileType: 'vhdl_rtl', purpose: 'fixture', content: rtlContent },
    dependencyFiles: [],
    qualification: {
      libraryVersion: 'fixture',
      libraryRoot: '/tmp/fpga-lib',
      ghdlVersion: 'GHDL fixture',
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
    approvedSignature: buildLeafInterfaceSignature(component),
  };
}

function makeGenericCandidate(component: FpgaArchitectureComponentContract, entityName: string, rtlContent: string): VerifiedVhdlBlockNearMatch {
  const actualSignature = buildVhdlEntityInterfaceSignature(rtlContent, entityName);
  assert.ok(actualSignature);
  return {
    blockName: entityName,
    entityName,
    relativeRtlPath: `rtl/blocks/${entityName}.vhd`,
    generatedRtlPath: `lib/fpga_vhdl_blocks/blocks/${entityName}.vhd`,
    relativeTestbenchPath: null,
    rtlContent: rtlContent,
    rtlFile: { path: `lib/fpga_vhdl_blocks/blocks/${entityName}.vhd`, fileType: 'vhdl_rtl', purpose: 'fixture', content: rtlContent },
    dependencyFiles: [],
    qualification: {
      libraryVersion: 'fixture',
      libraryRoot: '/tmp/fpga-lib',
      ghdlVersion: 'GHDL fixture',
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
    approvedSignature: buildLeafInterfaceSignature(component),
  };
}

function fifoRtl(width = 8, depth = 16, async = false) {
  return [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity rx_fifo is',
    '  generic (',
    `    DATA_WIDTH : positive := ${width};`,
    `    DEPTH : positive := ${depth}`,
    '  );',
    '  port (',
    '    clk : in std_logic;',
    '    rst : in std_logic;',
    '    data_i : in std_logic_vector(DATA_WIDTH-1 downto 0);',
    '    data_o : out std_logic_vector(DATA_WIDTH-1 downto 0)',
    '  );',
    'end entity;',
    'architecture rtl of rx_fifo is begin',
    ...(async ? [
      '  assert DEPTH >= 4 and is_power_of_two(DEPTH)',
      '    report "DEPTH must be a power of two and at least 4";',
    ] : []),
    '  data_o <= data_i;',
    'end architecture;',
    '',
  ].join('\n');
}

test('parameter gate accepts exact verified generic defaults', () => {
  const component = fifoComponent(8, 16);
  const candidate = makeCandidate(component, fifoRtl(8, 16));
  const result = evaluateVerifiedVhdlParameterCompatibility({ component, candidate });
  assert.equal(result.kind, 'parameter_exact');
  assert.equal(result.requiresConfiguredSmoke, false);
  assert.deepEqual(result.genericMap, { data_width: 'data_width', depth: 'depth' });
});

test('parameter gate accepts safe configured FIFO width and depth', () => {
  const component = fifoComponent(16, 64);
  const candidate = makeCandidate(component, fifoRtl(8, 16));
  const result = evaluateVerifiedVhdlParameterCompatibility({ component, candidate });
  assert.equal(result.kind, 'parameter_safe_configured');
  assert.equal(result.requiresConfiguredSmoke, true);
  assert.equal(result.resolvedValues.data_width, '16');
  assert.equal(result.resolvedValues.depth, '64');
  assert.equal(hasSamePublicInterfaceIgnoringGenericDefaults(candidate), true);
});

test('parameter gate rejects async FIFO depth that violates power-of-two contract', () => {
  const component = fifoComponent(8, 3);
  const candidate = makeCandidate(component, fifoRtl(8, 16, true));
  const result = evaluateVerifiedVhdlParameterCompatibility({ component, candidate });
  assert.equal(result.kind, 'parameter_unsafe');
  assert.match(result.unsafeReasons.join('\n'), /below verified minimum 4/);
  assert.match(result.unsafeReasons.join('\n'), /not a power of two/);
});

test('parameter gate rejects unknown changed generics', () => {
  const component: FpgaArchitectureComponentContract = {
    ...fifoComponent(8, 16),
    generics: [{ name: 'MODE', type: 'integer', default: '2' }],
    ports: [
      { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
      { name: 'data_o', mode: 'out', type: 'std_logic', purpose: 'Output.' },
    ],
  };
  const rtl = [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity rx_fifo is',
    '  generic (MODE : integer := 1);',
    '  port (clk : in std_logic; data_o : out std_logic);',
    'end entity;',
    'architecture rtl of rx_fifo is begin data_o <= clk; end architecture;',
    '',
  ].join('\n');
  const candidate = makeCandidate(component, rtl);
  const result = evaluateVerifiedVhdlParameterCompatibility({ component, candidate });
  assert.equal(result.kind, 'parameter_unsafe');
  assert.match(result.unsafeReasons.join('\n'), /mode is not recognized/);
});

test('parameter gate accepts configured UART clock and baud generics', () => {
  const component: FpgaArchitectureComponentContract = {
    ...fifoComponent(8, 16),
    id: 'uart_rx',
    name: 'uart_rx',
    generics: [
      { name: 'CLOCK_HZ', type: 'positive', default: '100000000' },
      { name: 'BAUD_RATE', type: 'positive', default: '115200' },
      { name: 'DATA_BITS', type: 'positive', default: '8' },
    ],
    ports: [
      { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
      { name: 'rx_i', mode: 'in', type: 'std_logic', purpose: 'Input.' },
      { name: 'data_o', mode: 'out', type: 'std_logic_vector(DATA_BITS-1 downto 0)', purpose: 'Output.' },
    ],
  };
  const rtl = [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity uart_rx is',
    '  generic (CLOCK_HZ : positive := 50000000; BAUD_RATE : positive := 9600; DATA_BITS : positive := 8);',
    '  port (clk : in std_logic; rx_i : in std_logic; data_o : out std_logic_vector(DATA_BITS-1 downto 0));',
    'end entity;',
    'architecture rtl of uart_rx is begin data_o <= (others => rx_i); end architecture;',
    '',
  ].join('\n');
  const candidate = makeGenericCandidate(component, 'uart_rx', rtl);

  const result = evaluateVerifiedVhdlParameterCompatibility({ component, candidate });
  assert.equal(result.kind, 'parameter_safe_configured');
  assert.ok(result.constraints.some((constraint) => constraint.rule === 'baud_less_than_clock' && constraint.ok));
  assert.ok(result.constraints.some((constraint) => constraint.rule === 'uart_data_bits_5_to_9' && constraint.ok));
});

test('parameter gate rejects impossible UART baud configuration', () => {
  const component: FpgaArchitectureComponentContract = {
    ...fifoComponent(8, 16),
    id: 'uart_tx',
    name: 'uart_tx',
    generics: [
      { name: 'CLOCK_HZ', type: 'positive', default: '9600' },
      { name: 'BAUD_RATE', type: 'positive', default: '115200' },
    ],
    ports: [{ name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' }],
  };
  const rtl = [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity uart_tx is',
    '  generic (CLOCK_HZ : positive := 50000000; BAUD_RATE : positive := 9600);',
    '  port (clk : in std_logic);',
    'end entity;',
    'architecture rtl of uart_tx is begin end architecture;',
    '',
  ].join('\n');
  const candidate = makeGenericCandidate(component, 'uart_tx', rtl);

  const result = evaluateVerifiedVhdlParameterCompatibility({ component, candidate });
  assert.equal(result.kind, 'parameter_unsafe');
  assert.match(result.unsafeReasons.join('\n'), /not compatible with CLOCK_HZ/i);
});

test('parameter gate accepts boolean and key-width generic families', () => {
  const component: FpgaArchitectureComponentContract = {
    ...fifoComponent(8, 16),
    id: 'crypto_datapath',
    name: 'crypto_datapath',
    generics: [
      { name: 'KEY_WIDTH', type: 'positive', default: '256' },
      { name: 'SIGNED_MODE', type: 'boolean', default: 'false' },
    ],
    ports: [{ name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' }],
  };
  const rtl = [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity crypto_datapath is',
    '  generic (KEY_WIDTH : positive := 128; SIGNED_MODE : boolean := false);',
    '  port (clk : in std_logic);',
    'end entity;',
    'architecture rtl of crypto_datapath is begin -- aes crypto cipher datapath',
    'end architecture;',
    '',
  ].join('\n');
  const candidate = makeGenericCandidate(component, 'crypto_datapath', rtl);

  const result = evaluateVerifiedVhdlParameterCompatibility({ component, candidate });
  assert.equal(result.kind, 'parameter_safe_configured');
  assert.ok(result.constraints.some((constraint) => constraint.rule === 'key_width_common_crypto_values' && constraint.ok));
  assert.ok(result.constraints.some((constraint) => constraint.rule === 'boolean_compatible' && constraint.ok));
});
