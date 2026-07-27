import assert from 'node:assert/strict';
import test from 'node:test';
import type { FpgaArchitectureComponentContract } from '../src/server/fpgaArchitectureContract';
import { findBootstrapFacadeNearMatch } from '../src/server/fpgaBootstrapArchitectureResolver';
import { planVerifiedVhdlWrapper } from '../src/server/fpgaVerifiedVhdlWrapper';

function genericLeaf(id: string, responsibility: string): FpgaArchitectureComponentContract {
  return {
    id,
    kind: 'rtl',
    name: id,
    file: `src/${id}.vhd`,
    responsibility,
    implements: [id],
    dependsOn: [],
    children: [],
    clockDomain: 'clk',
    generics: [],
    ports: [
      { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
      { name: 'rst', mode: 'in', type: 'std_logic', purpose: 'Reset.' },
      { name: 'enable_i', mode: 'in', type: 'std_logic', purpose: 'Enable.' },
      { name: 'data_i', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'Generic input byte.' },
    ],
    exports: [],
  };
}

test('bootstrap resolver exposes UART RX facade for simplified migrated leaf', () => {
  const component = genericLeaf('uart_rx', 'Receive UART frames.');
  const candidate = findBootstrapFacadeNearMatch({ component });
  assert.ok(candidate);
  assert.equal(candidate.blockName, 'uart_rx');
  assert.equal(candidate.entityName, 'uart_rx_basic');
  assert.ok(candidate.dependencyFiles.some((file) => /uart_rx\.vhd$/.test(file.path)));
  assert.ok(candidate.rtlFile.path.endsWith('facades/uart/uart_rx_basic.vhd'));

  const plan = planVerifiedVhdlWrapper({ component, candidate });
  assert.equal(plan.kind, 'wrapper_safe');
  assert.equal(plan.portAssociations.clk_i, 'clk');
  assert.match(plan.preInstanceAssignments.join('\n'), /w_rst_ni_adapt <= not rst;/);
  assert.equal(plan.portAssociations.rx_i, "'1'");
});

test('bootstrap resolver exposes program-counter facade and hides unused generic data input', () => {
  const component = genericLeaf('program_counter', 'Own reset PC value and sequential PC update.');
  const candidate = findBootstrapFacadeNearMatch({ component });
  assert.ok(candidate);
  assert.equal(candidate.blockName, 'program_counter');
  assert.equal(candidate.entityName, 'program_counter_basic');
  assert.ok(candidate.dependencyFiles.some((file) => /program_counter\.vhd$/.test(file.path)));

  const plan = planVerifiedVhdlWrapper({ component, candidate });
  assert.equal(plan.kind, 'wrapper_safe');
  assert.equal(plan.portAssociations.clk_i, 'clk');
  assert.match(plan.preInstanceAssignments.join('\n'), /w_rst_ni_adapt <= not rst;/);
  assert.ok(plan.mismatches.some((entry) => entry.kind === 'approved_leaf_input_ignored' && entry.approvedName === 'data_i'));
});

test('bootstrap resolver maps horizontal counter to video timing facade before model fallback', () => {
  const component = genericLeaf('horizontal_counter', 'Own horizontal count range and wrap behavior for video timing.');
  const candidate = findBootstrapFacadeNearMatch({ component });
  assert.ok(candidate);
  assert.equal(candidate.blockName, 'video_timing');
  assert.equal(candidate.entityName, 'video_timing_640x480');
  const plan = planVerifiedVhdlWrapper({ component, candidate });
  assert.equal(plan.kind, 'wrapper_safe');
  assert.equal(plan.portAssociations.pixel_clk_i, 'clk');
  assert.equal(plan.portAssociations.enable_i, 'enable_i');
});
