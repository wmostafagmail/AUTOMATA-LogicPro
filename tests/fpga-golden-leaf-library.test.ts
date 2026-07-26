import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import test from 'node:test';
import type { FpgaArchitectProject } from '../src/server/fpgaArchitect';
import type { FpgaArchitectureComponentContract, FpgaArchitectureContract } from '../src/server/fpgaArchitectureContract';
import {
  buildLeafInterfaceSignature,
  buildVhdlEntityInterfaceSignature,
  compareGoldenLeafToComponent,
  isGoldenLeafPromotionEligible,
  promotePassedLeafBlocks,
  readGoldenLeafLibrary,
  writeGoldenLeafLibrary,
  type GoldenLeafBlock,
} from '../src/server/fpgaGoldenLeafLibrary';

function fifoComponent(overrides: Partial<FpgaArchitectureComponentContract> = {}): FpgaArchitectureComponentContract {
  return {
    id: 'rx_fifo',
    kind: 'rtl',
    name: 'rx_fifo',
    file: 'src/rx_fifo.vhd',
    responsibility: 'Buffer response bytes with bounded pointer/index logic.',
    implements: [],
    dependsOn: [],
    children: [],
    clockDomain: 'clk',
    generics: [{ name: 'DEPTH', type: 'positive', default: '4' }],
    ports: [
      { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
      { name: 'rst', mode: 'in', type: 'std_logic', purpose: 'Reset.' },
      { name: 'data_i', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'Input.' },
      { name: 'data_o', mode: 'out', type: 'std_logic_vector(7 downto 0)', purpose: 'Output.' },
    ],
    exports: [],
    ...overrides,
  };
}

function contract(component = fifoComponent()): FpgaArchitectureContract {
  return {
    schemaVersion: '2.0',
    designName: 'uart_spi_bridge',
    designClass: 'uart_spi_protocol_bridge',
    topEntity: 'bridge_top',
    topTestbench: 'tb_bridge_top',
    systemIntent: 'Bridge UART and SPI.',
    assumptions: [],
    requiredCapabilityIds: [],
    components: [component],
    clockDomains: [],
    behaviors: [{ id: 'fifo_move', requirement: 'Move data.', inputs: ['data_i'], outputs: ['data_o'], timing: 'one cycle', resetBehavior: 'zero', latencyCycles: 1 }],
    verification: [],
    numericFormats: [],
    instances: [],
    connections: [],
    stateMachines: [],
    sourceOrder: [component.file],
  };
}

function fifoVhdl(width = 8) {
  return [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'use ieee.numeric_std.all;',
    'entity rx_fifo is',
    '  generic (',
    '    DEPTH : positive := 4',
    '  );',
    '  port (',
    '    clk : in std_logic;',
    '    rst : in std_logic;',
    `    data_i : in std_logic_vector(${width - 1} downto 0);`,
    `    data_o : out std_logic_vector(${width - 1} downto 0)`,
    '  );',
    'end entity rx_fifo;',
    'architecture rtl of rx_fifo is',
    'begin',
    '  data_o <= data_i;',
    'end architecture rtl;',
    '',
  ].join('\n');
}

function goldenBlock(component = fifoComponent(), vhdl = fifoVhdl()): GoldenLeafBlock {
  return {
    libraryVersion: 1,
    designClass: 'uart_spi_protocol_bridge',
    componentId: component.id,
    entityName: component.name,
    filePath: component.file,
    interfaceSignature: buildLeafInterfaceSignature(component),
    behaviorSignature: { componentId: component.id, clockDomain: component.clockDomain, outputPorts: ['data_o'], behaviorIds: ['fifo_move'] },
    contentHash: 'hash-a',
    contractHash: 'contract-a',
    sourceDesignKey: 'uart_spi_bridge',
    sourceAttempt: 1,
    passCount: 2,
    repairCount: 0,
    promotedAt: '2026-01-01T00:00:00.000Z',
    vhdlContent: vhdl,
  };
}

test('golden leaf library persists deterministic blocks', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'golden-leaf-'));
  const libraryPath = path.join(tempDir, 'fpga-golden-leaf-library.json');
  await writeGoldenLeafLibrary(libraryPath, { libraryVersion: 1, blocks: [goldenBlock()] });
  const loaded = await readGoldenLeafLibrary(libraryPath);
  assert.equal(loaded.blocks.length, 1);
  assert.equal(loaded.blocks[0].componentId, 'rx_fifo');
  assert.equal(loaded.blocks[0].passCount, 2);
});

test('interface signatures are stable for approved component and matching VHDL entity', () => {
  const component = fifoComponent();
  assert.deepEqual(
    buildVhdlEntityInterfaceSignature(fifoVhdl(), 'rx_fifo'),
    buildLeafInterfaceSignature(component),
  );
});

test('comparison detects exact match and safe FIFO width adaptation', () => {
  const baseComponent = fifoComponent();
  const baseContract = contract(baseComponent);
  assert.equal(compareGoldenLeafToComponent(goldenBlock(baseComponent), baseComponent, baseContract).kind, 'exact_match');

  const widerComponent = fifoComponent({
    ports: baseComponent.ports.map((port) => (
      port.name.startsWith('data_') ? { ...port, type: 'std_logic_vector(15 downto 0)' } : port
    )),
  });
  const comparison = compareGoldenLeafToComponent(goldenBlock(baseComponent), widerComponent, contract(widerComponent));
  assert.equal(comparison.kind, 'safe_adaptation');
  assert.match(comparison.deltas.join('\n'), /data_i type/);
});

test('comparison rejects unsafe protocol or clock-domain changes', () => {
  const changed = fifoComponent({ id: 'spi_slave', name: 'spi_slave', clockDomain: 'spi_clk' });
  const comparison = compareGoldenLeafToComponent(goldenBlock(), changed, contract(changed));
  assert.equal(comparison.kind, 'unsafe_mismatch');
  assert.match(comparison.unsafeReasons.join('\n'), /component role changed|clock domain changed/);
});

test('promotion only accepts clean RTL leaves and increments pass count', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'golden-promote-'));
  const libraryPath = path.join(tempDir, 'fpga-golden-leaf-library.json');
  const component = fifoComponent();
  const project: FpgaArchitectProject = {
    projectName: 'bridge',
    sanitizedProjectName: 'bridge',
    topEntity: 'bridge_top',
    vhdlStandard: '08',
    targetFpga: null,
    summary: '',
    assumptions: [],
    warnings: [],
    folderTree: '',
    files: [{ path: component.file, fileType: 'vhdl_rtl', purpose: component.responsibility, content: fifoVhdl() }],
    ghdl: { analysisOrder: [component.file], topTestbench: 'tb_bridge', runCommands: [], expectedResult: 'pass' },
    qualityChecklist: [],
  };
  const first = await promotePassedLeafBlocks({ libraryPath, contract: contract(component), project, sourceDesignKey: 'uart', sourceAttempt: 1, repairCount: 0 });
  const second = await promotePassedLeafBlocks({ libraryPath, contract: contract(component), project, sourceDesignKey: 'uart', sourceAttempt: 2, repairCount: 0 });
  const loaded = await readGoldenLeafLibrary(libraryPath);
  assert.equal(first.promoted, 1);
  assert.equal(second.updated, 1);
  assert.equal(loaded.blocks[0].passCount, 2);
  assert.equal(isGoldenLeafPromotionEligible({ contract: contract(component), component, content: fifoVhdl().replace('data_o <= data_i;', '-- TODO') }), false);
});
