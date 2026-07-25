import assert from 'node:assert/strict';
import test from 'node:test';
import { parseVhdlSemanticModel } from '../src/server/vhdlSemanticFrontend';
import { renderAppOwnedTestbench, validateContractScenarios } from '../src/server/fpgaVerificationScenario';
import { renderContractPackage, renderIntegrationTop } from '../src/server/fpgaContractRenderer';
import { validateFpgaArchitectureContract, type FpgaArchitectureContract } from '../src/server/fpgaArchitectureContract';

function makeContract(): FpgaArchitectureContract {
  return {
    schemaVersion: '2.0', designName: 'counter_project', designClass: 'generic_fpga_vhdl_system', topEntity: 'counter_top', topTestbench: 'tb_counter_top', systemIntent: 'Count enabled clock cycles.', assumptions: ['One clock domain.'], requiredCapabilityIds: [],
    components: [
      { id: 'counter_pkg', kind: 'package', name: 'counter_pkg', file: 'src/counter_pkg.vhd', responsibility: 'Types.', implements: [], dependsOn: [], children: [], clockDomain: null, generics: [], ports: [], exports: ['count_t'], packageSymbols: [{ name: 'count_t', kind: 'subtype', type: 'unsigned(7 downto 0)' }] },
      { id: 'counter_leaf', kind: 'rtl', name: 'counter_leaf', file: 'src/counter_leaf.vhd', responsibility: 'Count.', implements: [], dependsOn: ['counter_pkg'], children: [], clockDomain: 'core', generics: [], ports: [{ name: 'clk_i', mode: 'in', type: 'std_logic', purpose: 'Clock.' }, { name: 'rst_i', mode: 'in', type: 'std_logic', purpose: 'Reset.' }, { name: 'count_o', mode: 'out', type: 'count_t', purpose: 'Count.' }], exports: [] },
      { id: 'counter_top', kind: 'top', name: 'counter_top', file: 'src/counter_top.vhd', responsibility: 'Top.', implements: [], dependsOn: ['counter_pkg', 'counter_leaf'], children: ['counter_leaf'], clockDomain: 'core', generics: [], ports: [{ name: 'clk_i', mode: 'in', type: 'std_logic', purpose: 'Clock.' }, { name: 'rst_i', mode: 'in', type: 'std_logic', purpose: 'Reset.' }, { name: 'count_o', mode: 'out', type: 'count_t', purpose: 'Count.' }], exports: [] },
      { id: 'tb_counter_top', kind: 'testbench', name: 'tb_counter_top', file: 'tb/tb_counter_top.vhd', responsibility: 'Verify.', implements: [], dependsOn: ['counter_top'], children: ['counter_top'], clockDomain: null, generics: [], ports: [], exports: [] },
    ],
    clockDomains: [{ id: 'core', clockPort: 'clk_i', resetPort: 'rst_i', resetActive: 'high', resetStyle: 'synchronous', memberComponents: ['counter_leaf', 'counter_top'] }],
    behaviors: [{ id: 'reset', requirement: 'Reset clears count.', inputs: ['rst_i'], outputs: ['count_o'], timing: 'One cycle.', resetBehavior: 'count_o is zero.', latencyCycles: 1 }],
    verification: [{ id: 'reset_check', requirement: 'Check reset.', stimulus: 'Assert reset.', expected: 'Zero.', observables: ['count_o'], covers: [], coversBehaviors: ['reset'], actions: [{ kind: 'drive', signal: 'rst_i', value: "'1'" }, { kind: 'wait_cycles', cycles: 2 }, { kind: 'expect', signal: 'count_o', value: "(others => '0')", message: 'reset count' }, { kind: 'finish', message: 'TEST PASSED' }] }],
    numericFormats: [],
    instances: [
      { id: 'top_leaf', parentComponentId: 'counter_top', childComponentId: 'counter_leaf', label: 'u_counter', genericMap: {}, portMap: { clk_i: 'clk_i', rst_i: 'rst_i', count_o: 'count_o' } },
      { id: 'tb_dut', parentComponentId: 'tb_counter_top', childComponentId: 'counter_top', label: 'dut', genericMap: {}, portMap: { clk_i: 'clk_i', rst_i: 'rst_i', count_o: 'count_o' } },
    ], connections: [], stateMachines: [], sourceOrder: ['src/counter_pkg.vhd', 'src/counter_leaf.vhd', 'src/counter_top.vhd', 'tb/tb_counter_top.vhd'],
  };
}

test('renderer emits exact package exports and integration instance maps', () => {
  const contract = makeContract();
  const packageVhdl = renderContractPackage(contract, contract.components[0]);
  const topVhdl = renderIntegrationTop(contract, contract.components[2]);
  assert.match(packageVhdl, /subtype count_t is unsigned\(7 downto 0\)/);
  const parsed = parseVhdlSemanticModel(topVhdl);
  assert.equal(parsed.architectures[0].instances[0].label, 'u_counter');
  assert.equal(parsed.architectures[0].instances[0].portMap.count_o, 'count_o');
});

test('app-owned scenario renderer creates a DUT-driven self-checking testbench', () => {
  const contract = makeContract();
  assert.deepEqual(validateContractScenarios(contract), []);
  const testbench = renderAppOwnedTestbench(contract);
  assert.match(testbench, /dut : entity work.counter_top/);
  assert.match(testbench, /if count_o \/= \(others => '0'\) then/);
  assert.match(testbench, /report "TEST FAILED" severity failure/);
  assert.doesNotMatch(testbench, /count_o\s*<=/);
});

test('integration renderer emits app-owned drivers for safe status outputs', () => {
  const contract = makeContract();
  const top = contract.components.find((component) => component.id === 'counter_top')!;
  top.ports = [
    { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
    { name: 'rst', mode: 'in', type: 'std_logic', purpose: 'Reset.' },
    { name: 'start_i', mode: 'in', type: 'std_logic', purpose: 'Start.' },
    { name: 'done_o', mode: 'out', type: 'std_logic', purpose: 'Done status.' },
    { name: 'error_o', mode: 'out', type: 'std_logic', purpose: 'Error status.' },
    { name: 'status_o', mode: 'out', type: 'std_logic_vector(7 downto 0)', purpose: 'Status byte.' },
  ];
  contract.instances = [];
  const topVhdl = renderIntegrationTop(contract, top);

  assert.match(topVhdl, /p_auto_done_o_driver/);
  assert.match(topVhdl, /done_o <= '1';/);
  assert.match(topVhdl, /error_o <= '0';/);
  assert.match(topVhdl, /status_o <= \(0 => '1', others => '0'\);/);
});

test('architecture contract rejects arbitrary top output without owner', () => {
  const contract = makeContract();
  contract.behaviors = [];
  contract.verification = [];
  contract.instances = contract.instances?.filter((instance) => instance.parentComponentId !== 'counter_top');
  const validation = validateFpgaArchitectureContract({ contract, userRequest: 'counter' });

  assert.ok(validation.issues.some((issue) => issue.code === 'architecture_contract_output_driver_missing'));
});
