import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { FPGA_ARCHITECT_SWEEP_DESIGNS } from '../src/fpgaArchitectSweepConfig';
import {
  readFpgaGoldenContract,
  writeFpgaGoldenContract,
} from '../src/server/fpgaGoldenContracts';
import type { FpgaArchitectureContract } from '../src/server/fpgaArchitectureContract';

const contract: FpgaArchitectureContract = {
  schemaVersion: '2.0',
  designName: 'uart_spi',
  designClass: 'protocol_bridge',
  topEntity: 'bridge_top',
  topTestbench: 'tb_bridge_top',
  systemIntent: 'Bridge UART to SPI.',
  assumptions: ['One clock domain.'],
  requiredCapabilityIds: [],
  components: [
    { id: 'bridge_top', kind: 'top', name: 'bridge_top', file: 'src/bridge_top.vhd', responsibility: 'Bridge.', implements: ['bridge'], dependsOn: [], children: [], clockDomain: 'core', generics: [], ports: [{ name: 'clk_i', mode: 'in', type: 'std_logic', purpose: 'Clock.' }], exports: [] },
    { id: 'tb_bridge_top', kind: 'testbench', name: 'tb_bridge_top', file: 'tb/tb_bridge_top.vhd', responsibility: 'Verify.', implements: [], dependsOn: ['bridge_top'], children: ['bridge_top'], clockDomain: null, generics: [], ports: [], exports: [] },
  ],
  clockDomains: [{ id: 'core', clockPort: 'clk_i', resetPort: 'rst_i', resetActive: 'high', resetStyle: 'synchronous', memberComponents: ['bridge_top'] }],
  connections: [],
  numericFormats: [],
  stateMachines: [],
  instances: [{ id: 'dut', parentComponentId: 'tb_bridge_top', childComponentId: 'bridge_top', label: 'dut', genericMap: {}, portMap: { clk_i: 'clk_i' } }],
  behaviors: [{ id: 'idle', requirement: 'Remain idle.', inputs: [], outputs: [], timing: 'One cycle.', resetBehavior: 'Idle.', latencyCycles: 1, preconditions: [] }],
  verification: [{ id: 'idle', requirement: 'Check idle.', stimulus: 'Wait.', expected: 'Stable.', observables: [], covers: [], coversBehaviors: ['idle'], actions: [{ kind: 'wait_cycles', cycles: 1 }, { kind: 'finish', message: 'TEST PASSED' }] }],
  sourceOrder: ['src/bridge_top.vhd', 'tb/tb_bridge_top.vhd'],
};

test('golden contract persists only for the exact preset fingerprint', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-golden-'));
  const preset = FPGA_ARCHITECT_SWEEP_DESIGNS[0];
  try {
    const written = await writeFpgaGoldenContract(directory, preset, contract);
    const loaded = await readFpgaGoldenContract(directory, preset);
    assert.equal(loaded?.contractHash, written.contractHash);
    assert.deepEqual(loaded?.contract, contract);

    const changedPreset = { ...preset, whyItTests: `${preset.whyItTests} changed` };
    assert.equal(await readFpgaGoldenContract(directory, changedPreset), null);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
