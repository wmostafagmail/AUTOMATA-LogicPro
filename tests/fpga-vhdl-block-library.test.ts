import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import test from 'node:test';
import type { FpgaArchitectureComponentContract } from '../src/server/fpgaArchitectureContract';
import {
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

test('verified VHDL prompt section reports library trust status without pasting RTL', async () => {
  const { qualificationPath } = await writeVerifiedLibraryFixture(true);
  const section = formatVerifiedVhdlBlockLibraryPromptSection(['verified_passthrough'], { qualificationPath });
  assert.match(section, /locally GHDL-qualified VHDL library is available/);
  assert.match(section, /verified_passthrough/);
  assert.doesNotMatch(section, /architecture rtl/);
});
