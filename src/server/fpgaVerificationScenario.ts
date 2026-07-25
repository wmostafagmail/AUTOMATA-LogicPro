import type { FpgaArchitectureContract, FpgaArchitectureScenarioAction } from './fpgaArchitectureContract';
import { defaultVhdlValue, renderEntityDeclaration, renderSignalDeclaration } from './fpgaContractRenderer';

export type FpgaScenarioValidationIssue = { code: string; message: string };

export function validateContractScenarios(contract: FpgaArchitectureContract) {
  const issues: FpgaScenarioValidationIssue[] = [];
  const top = contract.components.find((component) => component.kind === 'top');
  if (!top) return [{ code: 'scenario_top_missing', message: 'Contract has no top component.' }];
  const portByName = new Map(top.ports.map((port) => [port.name.toLowerCase(), port]));
  for (const verification of contract.verification) {
    for (const action of verification.actions || []) {
      if (['drive', 'expect', 'expect_stable'].includes(action.kind)) {
        const port = portByName.get(String(action.signal || '').toLowerCase());
        if (!port) issues.push({ code: 'scenario_signal_missing', message: `${verification.id}: action references unknown top signal "${action.signal || ''}".` });
        if (action.kind === 'drive' && port && port.mode !== 'in' && port.mode !== 'inout') issues.push({ code: 'scenario_drives_output', message: `${verification.id}: drive action cannot drive ${port.mode} port "${port.name}".` });
        if ((action.kind === 'expect' || action.kind === 'expect_stable') && port && port.mode === 'in') issues.push({ code: 'scenario_checks_input', message: `${verification.id}: expect action must observe a DUT output/inout port, not input "${port.name}".` });
        if (!action.value) issues.push({ code: 'scenario_value_missing', message: `${verification.id}: ${action.kind} action requires an exact VHDL value.` });
      }
      if (action.kind === 'wait_cycles' && (!Number.isInteger(action.cycles) || Number(action.cycles) < 1)) issues.push({ code: 'scenario_cycles_invalid', message: `${verification.id}: wait_cycles requires a positive integer.` });
    }
  }
  return issues;
}

function renderAction(action: FpgaArchitectureScenarioAction, clockPort: string | null) {
  if (action.kind === 'drive') return [`    ${action.signal} <= ${action.value};`, '    wait for 1 ns;'];
  if (action.kind === 'wait_cycles') {
    if (clockPort) return [`    for cycle_index in 1 to ${action.cycles} loop`, `      wait until rising_edge(${clockPort});`, '    end loop;', '    wait for 1 ns;'];
    return [`    wait for ${action.cycles} ns;`];
  }
  if (action.kind === 'expect' || action.kind === 'expect_stable') {
    const message = String(action.message || `${action.signal} mismatch`).replace(/"/g, '""');
    return [
      `    if ${action.signal} /= ${action.value} then`,
      '      failed := true;',
      `      report "FAIL ${message}" severity error;`,
      '    end if;',
    ];
  }
  return [];
}

export function renderAppOwnedTestbench(contract: FpgaArchitectureContract) {
  const top = contract.components.find((component) => component.kind === 'top');
  const tb = contract.components.find((component) => component.kind === 'testbench');
  if (!top || !tb) throw new Error('Cannot render app-owned testbench without one top and one testbench component.');
  const scenarioIssues = validateContractScenarios(contract);
  if (scenarioIssues.length > 0) throw new Error(`Verification scenario contract is invalid: ${scenarioIssues.map((issue) => issue.message).join(' ')}`);
  const clockDomain = contract.clockDomains[0] || null;
  const clockPort = clockDomain?.clockPort || null;
  const instance = (contract.instances || []).find((candidate) => candidate.parentComponentId === tb.id && candidate.childComponentId === top.id);
  const portMap = instance?.portMap && Object.keys(instance.portMap).length > 0
    ? instance.portMap
    : Object.fromEntries(top.ports.map((port) => [port.name, port.name]));
  const actions = contract.verification.flatMap((verification) => verification.actions || []);
  const actionLines = actions.flatMap((action) => renderAction(action, clockPort));
  const hasFinish = actions.some((action) => action.kind === 'finish');
  return [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'use ieee.numeric_std.all;',
    'use std.env.all;',
    ...contract.components.filter((component) => component.kind === 'package').map((component) => `use work.${component.name}.all;`),
    '',
    renderEntityDeclaration(tb),
    '',
    `architecture sim of ${tb.name} is`,
    ...top.ports.map(renderSignalDeclaration),
    'begin',
    ...(clockPort ? [`  ${clockPort} <= not ${clockPort} after 5 ns;`] : []),
    `  ${instance?.label || 'dut'} : entity work.${top.name}`,
    '    port map (',
    ...Object.entries(portMap).map(([formal, actual], index, entries) => `      ${formal} => ${actual}${index === entries.length - 1 ? '' : ','}`),
    '    );',
    '',
    '  stimulus : process',
    '    variable failed : boolean := false;',
    '  begin',
    ...actionLines,
    ...(hasFinish ? [] : ['    report "TEST PASSED" severity note;']),
    '    if failed then',
    '      report "TEST FAILED" severity failure;',
    '    else',
    '      report "TEST PASSED" severity note;',
    '    end if;',
    '    std.env.stop(0);',
    '    wait;',
    '  end process;',
    'end architecture sim;',
    '',
  ].join('\n');
}
