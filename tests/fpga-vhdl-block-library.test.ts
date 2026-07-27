import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import test from 'node:test';
import type { FpgaArchitectureComponentContract } from '../src/server/fpgaArchitectureContract';
import {
  findVerifiedVhdlBlockNearMatch,
  findVerifiedVhdlBlockCandidate,
  formatVerifiedVhdlBlockLibraryPromptSection,
  isVhdlBlockLibraryTrusted,
  loadVhdlBlockLibraryQualification,
} from '../src/server/fpgaVerifiedVhdlBlockLibrary';

function passthroughComponent(): FpgaArchitectureComponentContract {
  return {
    id: 'verified_passthrough',
    kind: 'rtl',
    name: 'verified_passthrough',
    file: 'src/verified_passthrough.vhd',
    responsibility: 'Pass input to output.',
    implements: [],
    dependsOn: [],
    children: [],
    clockDomain: null,
    generics: [],
    ports: [
      { name: 'a_i', mode: 'in', type: 'std_logic', purpose: 'Input.' },
      { name: 'y_o', mode: 'out', type: 'std_logic', purpose: 'Output.' },
    ],
    exports: [],
  };
}

function programCounterComponent(): FpgaArchitectureComponentContract {
  return {
    id: 'program_counter',
    kind: 'rtl',
    name: 'program_counter',
    file: 'src/program_counter.vhd',
    responsibility: 'Track program counter.',
    implements: [],
    dependsOn: [],
    children: [],
    clockDomain: 'clk',
    generics: [
      { name: 'PC_WIDTH', type: 'positive', default: '64' },
      { name: 'RESET_VECTOR', type: 'natural', default: '4096' },
      { name: 'INSTR_BYTES', type: 'positive', default: '4' },
    ],
    ports: [
      { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
      { name: 'rst_n', mode: 'in', type: 'std_logic', purpose: 'Reset.' },
      { name: 'stall', mode: 'in', type: 'std_logic', purpose: 'Stall.' },
      { name: 'sequential_advance', mode: 'in', type: 'std_logic', purpose: 'Advance.' },
      { name: 'redirect_valid', mode: 'in', type: 'std_logic', purpose: 'Redirect valid.' },
      { name: 'redirect_pc', mode: 'in', type: 'std_logic_vector(PC_WIDTH-1 downto 0)', purpose: 'Redirect target.' },
      { name: 'pc_current', mode: 'out', type: 'std_logic_vector(PC_WIDTH-1 downto 0)', purpose: 'Current PC.' },
      { name: 'pc_next', mode: 'out', type: 'std_logic_vector(PC_WIDTH-1 downto 0)', purpose: 'Next PC.' },
      { name: 'pc_valid', mode: 'out', type: 'std_logic', purpose: 'PC valid.' },
    ],
    exports: [],
  };
}

async function writeVerifiedLibraryFixture(trustedForReuse: boolean) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'verified-vhdl-lib-'));
  await fs.mkdir(path.join(root, 'reports'), { recursive: true });
  await fs.mkdir(path.join(root, 'rtl', 'blocks', 'generic'), { recursive: true });
  await fs.mkdir(path.join(root, 'rtl', 'common'), { recursive: true });
  await fs.mkdir(path.join(root, 'rtl', 'cores'), { recursive: true });
  await fs.mkdir(path.join(root, 'tb', 'blocks', 'generic'), { recursive: true });
  await fs.writeFile(path.join(root, 'reports', 'verification_matrix.csv'), [
    'block_id,name,category,subcategory,origin,function,archetype,implementation_tier,protocol_status,timing_status,cdc_status,numeric_status,core,source_file,testbench_file,static_validation,ghdl_analysis,functional_simulation',
    '0001,verified_passthrough,Generic,Logic,fixture,Pass-through,leaf,A,ok,ok,ok,ok,bb_passthrough_core,rtl/blocks/generic/verified_passthrough.vhd,tb/blocks/generic/tb_verified_passthrough.vhd,PASS,PASS,PASS',
    '',
  ].join('\n'));
  await fs.writeFile(path.join(root, 'rtl', 'common', 'bb_util_pkg.vhd'), [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'package bb_util_pkg is',
    'end package;',
    '',
  ].join('\n'));
  await fs.writeFile(path.join(root, 'rtl', 'cores', 'bb_passthrough_core.vhd'), [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity bb_passthrough_core is',
    '  port (a_i : in std_logic; y_o : out std_logic);',
    'end entity;',
    'architecture rtl of bb_passthrough_core is begin',
    '  y_o <= a_i;',
    'end architecture;',
    '',
  ].join('\n'));
  await fs.writeFile(path.join(root, 'rtl', 'blocks', 'generic', 'verified_passthrough.vhd'), [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'use work.bb_util_pkg.all;',
    'entity verified_passthrough is',
    '  port (a_i : in std_logic; y_o : out std_logic);',
    'end entity;',
    'architecture rtl of verified_passthrough is begin',
    '  u_core : entity work.bb_passthrough_core port map(a_i => a_i, y_o => y_o);',
    'end architecture;',
    '',
  ].join('\n'));
  await fs.writeFile(path.join(root, 'tb', 'blocks', 'generic', 'tb_verified_passthrough.vhd'), [
    'entity tb_verified_passthrough is end entity;',
    'architecture sim of tb_verified_passthrough is begin end architecture;',
    '',
  ].join('\n'));
  const qualificationPath = path.join(root, 'qualification.json');
  const target = (ok: boolean) => ({ ok, exitCode: ok ? 0 : 2, summary: ok ? 'passed' : 'failed' });
  await fs.writeFile(qualificationPath, JSON.stringify({
    libraryVersion: 'fixture',
    libraryRoot: root,
    ghdlVersion: 'GHDL fixture',
    verifiedAt: '2026-01-01T00:00:00.000Z',
    blockCount: 1,
    testbenchCount: 1,
    coreCount: 1,
    trustedForReuse,
    targets: {
      static: target(true),
      'core-regression': target(true),
      'all-smokes': target(trustedForReuse),
    },
    warnings: [],
  }, null, 2));
  return { root, qualificationPath };
}

async function writeDeterministicConfigLibraryFixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'verified-vhdl-v3-lib-'));
  await fs.mkdir(path.join(root, 'reports'), { recursive: true });
  await fs.mkdir(path.join(root, 'manifests', 'blocks', 'cpu_and_soc'), { recursive: true });
  await fs.mkdir(path.join(root, 'generated', 'default_wrappers', 'cpu_and_soc'), { recursive: true });
  await fs.mkdir(path.join(root, 'rtl', 'blocks', 'cpu_and_soc'), { recursive: true });
  await fs.mkdir(path.join(root, 'rtl', 'cores'), { recursive: true });
  await fs.writeFile(path.join(root, 'manifests', 'library_index.json'), JSON.stringify({
    schema_version: 1,
    block_count: 1,
    blocks: [{
      name: 'program_counter',
      category: 'cpu_and_soc',
      manifest: 'manifests/blocks/cpu_and_soc/program_counter.json',
      wrapper: 'generated/default_wrappers/cpu_and_soc/program_counter_det_cfg.vhd',
      config_id: 'PROGRAM_COUNTER_FIXTURE',
      generic_count: 3,
      port_count: 9,
    }],
  }, null, 2));
  await fs.writeFile(path.join(root, 'manifests', 'blocks', 'cpu_and_soc', 'program_counter.json'), JSON.stringify({
    schema_version: 1,
    block: {
      name: 'program_counter',
      entity: 'program_counter',
      version: '3.0.0',
      category: 'cpu_and_soc',
      source: 'rtl/blocks/cpu_and_soc/program_counter.vhd',
      wrapper_entity: 'program_counter_det_cfg',
    },
    configuration: {
      id: 'PROGRAM_COUNTER_FIXTURE',
      hash_algorithm: 'sha256-64',
      locked: true,
      generics: [
        { name: 'PC_WIDTH', type: 'positive', default: '32', minimum: 1 },
        { name: 'RESET_VECTOR', type: 'natural', default: '0', minimum: 0 },
        { name: 'INSTR_BYTES', type: 'positive', default: '4', minimum: 1 },
      ],
      resolved_defaults: { PC_WIDTH: 32, RESET_VECTOR: 0, INSTR_BYTES: 4 },
    },
    interface: {
      ports: programCounterComponent().ports.map((port) => ({ name: port.name, direction: port.mode, type: port.type })),
      clock_ports: ['clk'],
      reset_ports: ['rst_n'],
    },
    contracts: {},
    maturity: {},
    generation: {
      wrapper_path: 'generated/default_wrappers/cpu_and_soc/program_counter_det_cfg.vhd',
      configuration_file: 'configurations/default/program_counter.json',
    },
  }, null, 2));
  await fs.writeFile(path.join(root, 'rtl', 'cores', 'bb_program_counter_core.vhd'), [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity bb_program_counter_core is',
    '  generic (PC_WIDTH : positive := 32; RESET_VECTOR : natural := 0; INSTR_BYTES : positive := 4);',
    '  port (clk : in std_logic; rst_n : in std_logic; stall : in std_logic; sequential_advance : in std_logic; redirect_valid : in std_logic; redirect_pc : in std_logic_vector(PC_WIDTH-1 downto 0); pc_current : out std_logic_vector(PC_WIDTH-1 downto 0); pc_next : out std_logic_vector(PC_WIDTH-1 downto 0); pc_valid : out std_logic);',
    'end entity;',
    'architecture rtl of bb_program_counter_core is begin pc_current <= redirect_pc; pc_next <= redirect_pc; pc_valid <= redirect_valid; end architecture;',
    '',
  ].join('\n'));
  await fs.writeFile(path.join(root, 'rtl', 'blocks', 'cpu_and_soc', 'program_counter.vhd'), [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity program_counter is',
    '  generic (PC_WIDTH : positive := 32; RESET_VECTOR : natural := 0; INSTR_BYTES : positive := 4);',
    '  port (clk : in std_logic; rst_n : in std_logic; stall : in std_logic; sequential_advance : in std_logic; redirect_valid : in std_logic; redirect_pc : in std_logic_vector(PC_WIDTH-1 downto 0); pc_current : out std_logic_vector(PC_WIDTH-1 downto 0); pc_next : out std_logic_vector(PC_WIDTH-1 downto 0); pc_valid : out std_logic);',
    'end entity;',
    'architecture rtl of program_counter is begin',
    '  u_core : entity work.bb_program_counter_core generic map(PC_WIDTH => PC_WIDTH, RESET_VECTOR => RESET_VECTOR, INSTR_BYTES => INSTR_BYTES) port map(clk => clk, rst_n => rst_n, stall => stall, sequential_advance => sequential_advance, redirect_valid => redirect_valid, redirect_pc => redirect_pc, pc_current => pc_current, pc_next => pc_next, pc_valid => pc_valid);',
    'end architecture;',
    '',
  ].join('\n'));
  await fs.writeFile(path.join(root, 'generated', 'default_wrappers', 'cpu_and_soc', 'program_counter_det_cfg.vhd'), [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity program_counter_det_cfg is',
    '  generic (PC_WIDTH : positive := 32; RESET_VECTOR : natural := 0; INSTR_BYTES : positive := 4; G_CONFIG_SCHEMA : natural := 1; G_CONFIG_ID : string := "PROGRAM_COUNTER_FIXTURE");',
    '  port (clk : in std_logic; rst_n : in std_logic; stall : in std_logic; sequential_advance : in std_logic; redirect_valid : in std_logic; redirect_pc : in std_logic_vector(PC_WIDTH-1 downto 0); pc_current : out std_logic_vector(PC_WIDTH-1 downto 0); pc_next : out std_logic_vector(PC_WIDTH-1 downto 0); pc_valid : out std_logic);',
    'end entity;',
    'architecture deterministic_wrapper of program_counter_det_cfg is begin',
    '  u_block : entity work.program_counter generic map(PC_WIDTH => PC_WIDTH, RESET_VECTOR => RESET_VECTOR, INSTR_BYTES => INSTR_BYTES) port map(clk => clk, rst_n => rst_n, stall => stall, sequential_advance => sequential_advance, redirect_valid => redirect_valid, redirect_pc => redirect_pc, pc_current => pc_current, pc_next => pc_next, pc_valid => pc_valid);',
    'end architecture;',
    '',
  ].join('\n'));
  const qualificationPath = path.join(root, 'qualification.json');
  const target = { ok: true, exitCode: 0, summary: 'passed' };
  await fs.writeFile(qualificationPath, JSON.stringify({
    libraryVersion: 'fixture-v3',
    libraryRoot: root,
    ghdlVersion: 'GHDL fixture',
    verifiedAt: '2026-01-01T00:00:00.000Z',
    blockCount: 1,
    testbenchCount: 1,
    coreCount: 1,
    trustedForReuse: true,
    targets: { static: target, 'core-regression': target, 'all-smokes': target },
    warnings: [],
  }, null, 2));
  return { root, qualificationPath };
}

test('verified VHDL library only becomes trusted after all qualification targets pass', async () => {
  const trusted = await writeVerifiedLibraryFixture(true);
  const qualification = loadVhdlBlockLibraryQualification(trusted.qualificationPath);
  assert.equal(isVhdlBlockLibraryTrusted(qualification), true);

  const untrusted = await writeVerifiedLibraryFixture(false);
  assert.equal(isVhdlBlockLibraryTrusted(loadVhdlBlockLibraryQualification(untrusted.qualificationPath)), false);
});

test('verified VHDL candidate requires trusted qualification and exact entity interface', async () => {
  const { root, qualificationPath } = await writeVerifiedLibraryFixture(true);
  const candidate = findVerifiedVhdlBlockCandidate({
    component: passthroughComponent(),
    libraryRoot: root,
    qualificationPath,
  });
  assert.ok(candidate);
  assert.equal(candidate.blockName, 'verified_passthrough');
  assert.equal(candidate.dependencyFiles.map((file) => file.path).join('|'), [
    'lib/fpga_vhdl_blocks/common/bb_util_pkg.vhd',
    'lib/fpga_vhdl_blocks/cores/bb_passthrough_core.vhd',
  ].join('|'));

  const mismatched = findVerifiedVhdlBlockCandidate({
    component: {
      ...passthroughComponent(),
      ports: [...passthroughComponent().ports, { name: 'extra_o', mode: 'out', type: 'std_logic', purpose: 'Extra.' }],
    },
    libraryRoot: root,
    qualificationPath,
  });
  assert.equal(mismatched, null);
});

test('deterministic v3 manifest library uses locked wrappers as the integration surface', async () => {
  const { root, qualificationPath } = await writeDeterministicConfigLibraryFixture();
  const nearMatch = findVerifiedVhdlBlockNearMatch({
    component: programCounterComponent(),
    libraryRoot: root,
    qualificationPath,
  });
  assert.ok(nearMatch);
  assert.equal(nearMatch.blockName, 'program_counter');
  assert.equal(nearMatch.entityName, 'program_counter_det_cfg');
  assert.equal(nearMatch.deterministicWrapper, true);
  assert.equal(nearMatch.manifestRelativePath, 'manifests/blocks/cpu_and_soc/program_counter.json');
  assert.equal(nearMatch.wrapperRelativePath, 'generated/default_wrappers/cpu_and_soc/program_counter_det_cfg.vhd');
  assert.ok(nearMatch.dependencyFiles.some((file) => file.path === 'lib/fpga_vhdl_blocks/cores/bb_program_counter_core.vhd'));
  assert.ok(nearMatch.dependencyFiles.some((file) => file.path === 'lib/fpga_vhdl_blocks/blocks/cpu_and_soc/program_counter.vhd'));
  assert.match(nearMatch.rtlContent, /G_CONFIG_ID/);
});

test('verified VHDL prompt section reports library trust status without pasting RTL', async () => {
  const { qualificationPath } = await writeVerifiedLibraryFixture(true);
  const section = formatVerifiedVhdlBlockLibraryPromptSection(['verified_passthrough'], { qualificationPath });
  assert.match(section, /locally GHDL-qualified VHDL library is available/);
  assert.match(section, /verified_passthrough/);
  assert.doesNotMatch(section, /architecture rtl/);
});
