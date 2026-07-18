import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyFpgaArchitectLoopFailure,
  classifyFpgaArchitectLoopFailureWithValidation,
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

test('classifyFpgaArchitectLoopFailure maps current enum and conversion escapes into stable categories', () => {
  const enumDiagnostic = classifyFpgaArchitectLoopFailure(
    'src/spi_master.vhd:59:11:error: no choice for SPI_WAIT',
  );
  const conversionDiagnostic = classifyFpgaArchitectLoopFailure(
    'src/regfile.vhd:39:28:error: conversion allowed only between closely related types safe_idx := to_integer(unsigned(addr_w_i));',
  );

  assert.equal(enumDiagnostic.category, 'interface_declaration_misuse');
  assert.notEqual(enumDiagnostic.category, 'other');
  assert.equal(conversionDiagnostic.category, 'numeric_std_typing');
  assert.notEqual(conversionDiagnostic.category, 'other');
});

test('classifyFpgaArchitectLoopFailure maps GHDL bound-check failures into runtime bound risk', () => {
  const diagnostic = classifyFpgaArchitectLoopFailure(
    'Generated VHDL failed GHDL simulation for tb_dsp_chain: src/dsp_chain.vhd:87:9:error: bound check failure at fft_stage_proc',
  );

  assert.equal(diagnostic.category, 'runtime_bound_risk');
  assert.equal(diagnostic.label, 'Runtime Bound Risk');
});

test('classifyFpgaArchitectLoopFailure maps protocol mismatch assertions into protocol mismatch', () => {
  const diagnostic = classifyFpgaArchitectLoopFailure(
    'Generated VHDL failed GHDL simulation for tb_uart_spi_bridge: FAIL: Nominal Transfer mismatch detected at 115 ns. FAIL: Second Transfer mismatch detected at 215 ns.',
  );

  assert.equal(diagnostic.category, 'protocol_functional_mismatch');
  assert.equal(diagnostic.label, 'Protocol / Functional Mismatch');
});

test('classifyFpgaArchitectLoopFailureWithValidation prefers machine-readable validator details over flattened error text', () => {
  const diagnostic = classifyFpgaArchitectLoopFailureWithValidation({
    message: 'FPGA Architect hard-failed because the generated project did not pass strict pre-GHDL validation. tb/tb_uart_spi_bridge.vhd: declares procedure "wait_clk" inside an executable region after "begin".',
    generatedVhdlValidation: {
      failureCode: 'declaration_after_begin',
      failureCategory: 'declaration_scope',
      failureDetails: [
        {
          code: 'declaration_after_begin',
          category: 'declaration_scope',
          ruleIds: ['ghdl-clocked-variable-discipline'],
          message: 'tb/tb_uart_spi_bridge.vhd: declares procedure "wait_clk" inside an executable region after "begin".',
          excerpt: 'declares procedure "wait_clk" inside an executable region after "begin"',
        },
      ],
    },
  });

  assert.equal(diagnostic.category, 'procedure_scope');
  assert.equal(diagnostic.label, 'Procedure / Testbench Scope');
  assert.ok(diagnostic.ruleIds.includes('ghdl-clocked-variable-discipline'));
});

test('classifyFpgaArchitectLoopFailure maps missing custom package symbols into package/type visibility', () => {
  const diagnostic = classifyFpgaArchitectLoopFailure(
    'Generated VHDL failed GHDL analyze validation: src/uart_tx.vhd:8:18:error: no declaration for "byte_t" tx_data : in byte_t;',
  );

  assert.equal(diagnostic.category, 'package_type_definition');
  assert.equal(diagnostic.label, 'Package / Type Definition');
  assert.ok(diagnostic.ruleIds.includes('ghdl-record-package-rules'));
});

test('classifyFpgaArchitectLoopFailure maps raw named port-map formal errors into interface misuse', () => {
  const diagnostic = classifyFpgaArchitectLoopFailure(
    'Generated VHDL failed GHDL analyze validation: src/bridge_top.vhd:24:7:error: no declaration for "miso_i" port map (clk => clk, miso_i => miso);',
  );

  assert.equal(diagnostic.category, 'interface_declaration_misuse');
  assert.ok(diagnostic.ruleIds.includes('ghdl-instantiation-rules'));
});

test('classifyFpgaArchitectLoopFailure maps testbench DUT wiring failures into a stable category', () => {
  const diagnostic = classifyFpgaArchitectLoopFailureWithValidation({
    message: 'AI job failed: testbench checks signal "res_sig", but that signal is not driven by a DUT output port or any local driver.',
    generatedVhdlValidation: {
      ok: false,
      stage: 'prevalidate',
      summary: 'testbench structural validation failed',
      logs: [],
      validatedTopEntities: [],
      failureCode: 'testbench_missing_dut_instantiation',
      failureCategory: 'testbench_structure',
      ruleIds: [],
      failureDetails: [
        {
          code: 'checked_signal_not_dut_driven',
          category: 'testbench_structure',
          message: 'tb/alu_tb.vhd: checks signal res_sig but it is not driven by the DUT.',
          excerpt: 'check_eq("ADD", res_sig, x"08")',
        },
      ],
    },
  });

  assert.equal(diagnostic.category, 'testbench_structure');
  assert.equal(diagnostic.label, 'Testbench DUT Wiring');
  assert.ok(diagnostic.ruleIds.includes('ghdl-self-checking-testbenches'));
});

test('classifyFpgaArchitectLoopFailure maps ALU behavioral failures into simulation assertion', () => {
  const diagnostic = classifyFpgaArchitectLoopFailureWithValidation({
    message: 'Generated VHDL failed GHDL simulation for tb_alu: tb/tb_alu.vhd:38:5:@37ns:(report error): FAIL ADD_CARRY',
    generatedVhdlValidation: {
      ok: false,
      stage: 'simulate',
      summary: 'Generated VHDL failed GHDL simulation',
      logs: [],
      validatedTopEntities: [],
      failureCode: 'alu_flag_behavior_mismatch',
      failureCategory: 'simulation_success',
      ruleIds: [],
      failureDetails: [
        {
          code: 'alu_flag_behavior_mismatch',
          category: 'simulation_success',
          message: 'tb/tb_alu.vhd:38: assertion failed at 37ns: FAIL ADD_CARRY',
          excerpt: 'FAIL ADD_CARRY',
        },
      ],
    },
  });

  assert.equal(diagnostic.category, 'simulation_assertion');
  assert.equal(diagnostic.label, 'Simulation Assertion');
  assert.ok(diagnostic.ruleIds.includes('ghdl-numeric-std-rules'));
});
