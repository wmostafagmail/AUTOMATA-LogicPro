import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyFpgaArchitectLoopFailure,
  summarizeFpgaArchitectLoopFailures,
} from '../src/server/fpgaArchitectLoopDiagnostics';

test('classifyFpgaArchitectLoopFailure recognizes new contract-oriented failure families', () => {
  const commandDiagnostic = classifyFpgaArchitectLoopFailure(
    'The generated GHDL command contract is incomplete. FPGA Architect projects must include exact analyze, elaborate, and run commands.',
  );
  assert.equal(commandDiagnostic.category, 'command_contract');
  assert.deepEqual(commandDiagnostic.ruleIds, ['ghdl-clean-command-contract', 'ghdl-command-rules']);

  const sourceOrderDiagnostic = classifyFpgaArchitectLoopFailure(
    'The generated analysis_order does not satisfy internal compile dependencies: src/top.vhd -> work_pkg.',
  );
  assert.equal(sourceOrderDiagnostic.category, 'source_order_contract');
  assert.deepEqual(sourceOrderDiagnostic.ruleIds, ['ghdl-source-ordering']);

  const topGenericDiagnostic = classifyFpgaArchitectLoopFailure(
    'src/top.vhd: top-level generic "DATA_WIDTH" does not declare a default value.',
  );
  assert.equal(topGenericDiagnostic.category, 'top_level_generic_default');
  assert.deepEqual(topGenericDiagnostic.ruleIds, ['ghdl-top-generic-defaults']);

  const topPortDiagnostic = classifyFpgaArchitectLoopFailure(
    'src/top.vhd: top-level port "data_i" uses unconstrained type "std_logic_vector".',
  );
  assert.equal(topPortDiagnostic.category, 'top_level_port_constraint');
  assert.deepEqual(topPortDiagnostic.ruleIds, ['ghdl-top-port-constraints']);

  const rtlDiagnostic = classifyFpgaArchitectLoopFailure(
    'src/bad_rtl.vhd: RTL file contains testbench-only construct(s) such as wait-for timing, TextIO, or std.env usage.',
  );
  assert.equal(rtlDiagnostic.category, 'rtl_tb_construct_misuse');
  assert.deepEqual(rtlDiagnostic.ruleIds, ['ghdl-rtl-tb-separation', 'ghdl-no-wait-in-rtl']);
});

test('summarizeFpgaArchitectLoopFailures buckets repeated messages by refined category', () => {
  const summary = summarizeFpgaArchitectLoopFailures([
    {
      attempt: 1,
      ok: false,
      message: 'src/top.vhd: top-level generic "DATA_WIDTH" does not declare a default value.',
    },
    {
      attempt: 2,
      ok: false,
      message: 'src/top.vhd: top-level generic "DEPTH" does not declare a default value.',
    },
    {
      attempt: 3,
      ok: false,
      message: 'The generated GHDL command contract is incomplete. FPGA Architect projects must include exact analyze, elaborate, and run commands.',
    },
  ]);

  assert.ok(summary.some((bucket) => bucket.category === 'top_level_generic_default'));
  assert.ok(summary.some((bucket) => bucket.category === 'command_contract'));
  assert.ok(summary.some((bucket) => bucket.ruleIds.includes('ghdl-top-generic-defaults')));
  assert.ok(summary.some((bucket) => bucket.ruleIds.includes('ghdl-clean-command-contract')));
});

test('classifyFpgaArchitectLoopFailure maps summary-only subtype-indication GHDL errors into array/subtype misuse', () => {
  const diagnostic = classifyFpgaArchitectLoopFailure(
    'FPGA Architect hard-failed because the generated project did not pass GHDL analyze validation after 10 repair attempt(s). The app does not auto-fix VHDL file issues. src/cpu_core.vhd:27:20:error: type mark expected in a subtype indication',
  );

  assert.equal(diagnostic.category, 'array_subtype_misuse');
  assert.equal(diagnostic.label, 'Array / Subtype Misuse');
});

test('classifyFpgaArchitectLoopFailure maps illegal prefix operator failures into illegal operator usage', () => {
  const diagnostic = classifyFpgaArchitectLoopFailure(
    'Core logic simulation analysis failed: src/alu_pkg.vhd:81:35:error: missing ";" at end of statement res.data := xnor a, b;',
  );

  assert.equal(diagnostic.category, 'illegal_operator_usage');
  assert.equal(diagnostic.label, 'Illegal Operator Usage');
});
