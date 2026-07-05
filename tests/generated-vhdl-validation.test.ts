import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  detectKnownVhdlAntiPatternDetails,
  detectKnownVhdlAntiPatterns,
  resolveValidationSourceSelection,
  validateGeneratedProjectContracts,
} from '../src/server/generatedVhdlValidation';

test('resolveValidationSourceSelection keeps exact architect analysis-order file paths', () => {
  const resolved = resolveValidationSourceSelection({
    availableSources: [
      { path: 'src/counter_pkg.vhd' },
      { path: 'src/updown_counter.vhd' },
      { path: 'tb/tb_updown_counter.vhd' },
    ],
    requestedSourcePaths: [
      'src/counter_pkg.vhd',
      'src/updown_counter.vhd',
      'tb/tb_updown_counter.vhd',
    ],
    fallbackSourcePaths: [],
  });

  assert.deepEqual(resolved, [
    'src/counter_pkg.vhd',
    'src/updown_counter.vhd',
    'tb/tb_updown_counter.vhd',
  ]);
});

test('resolveValidationSourceSelection accepts suffixed or rooted architect analysis-order paths', () => {
  const resolved = resolveValidationSourceSelection({
    availableSources: [
      { path: 'src/counter_pkg.vhd' },
      { path: 'src/updown_counter.vhd' },
      { path: 'tb/tb_updown_counter.vhd' },
    ],
    requestedSourcePaths: [
      'counter/src/counter_pkg.vhd',
      '/workspace/project/counter/src/updown_counter.vhd',
      './counter/tb/tb_updown_counter.vhd',
    ],
    fallbackSourcePaths: [],
  });

  assert.deepEqual(resolved, [
    'src/counter_pkg.vhd',
    'src/updown_counter.vhd',
    'tb/tb_updown_counter.vhd',
  ]);
});

test('resolveValidationSourceSelection falls back to generated artifacts when architect analysis-order is not made of VHDL paths', () => {
  const resolved = resolveValidationSourceSelection({
    availableSources: [
      { path: 'src/counter_pkg.vhd' },
      { path: 'src/updown_counter.vhd' },
      { path: 'tb/tb_updown_counter.vhd' },
    ],
    requestedSourcePaths: [
      'reset_behavior',
      'load_functionality',
      'up_count_sequence',
      'down_count_sequence',
    ],
    fallbackSourcePaths: [
      'src/counter_pkg.vhd',
      'src/updown_counter.vhd',
      'tb/tb_updown_counter.vhd',
    ],
  });

  assert.deepEqual(resolved, [
    'src/counter_pkg.vhd',
    'src/updown_counter.vhd',
    'tb/tb_updown_counter.vhd',
  ]);
});

test('detectKnownVhdlAntiPatterns flags reserved identifiers and illegal prefix operators proactively', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-anti-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu_pkg.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'package alu_pkg is',
      '  type alu_op_t is (OP_ADD, and);',
      '  function bad(a : std_logic_vector(7 downto 0); b : std_logic_vector(7 downto 0)) return std_logic_vector;',
      'end package;',
      '',
      'package body alu_pkg is',
      '  function bad(a : std_logic_vector(7 downto 0); b : std_logic_vector(7 downto 0)) return std_logic_vector is',
      '    variable result_v : std_logic_vector(7 downto 0);',
      '  begin',
      '    result_v := xnor a, b;',
      '    return result_v;',
      '  end function;',
      'end package body;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['src/alu_pkg.vhd']);

  assert.ok(findings.some((entry) => entry.includes('reserved VHDL identifier "and"')));
  assert.ok(findings.some((entry) => entry.includes('illegal prefix/function-style VHDL operator form')));
});

test('detectKnownVhdlAntiPatterns flags reserved shift operator enum literals proactively', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-enum-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu_pkg.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'package alu_pkg is',
      '  type alu_op_t is (ADD, SUB, SLL, SRL);',
      'end package;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['src/alu_pkg.vhd']);

  assert.ok(findings.some((entry) => entry.includes('reserved VHDL identifier "SLL"')));
  assert.ok(findings.some((entry) => entry.includes('reserved VHDL identifier "SRL"')));
});

test('detectKnownVhdlAntiPatterns flags resize on raw std_logic_vector operands', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-resize-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity alu is',
      '  port (',
      '    a : in std_logic_vector(7 downto 0)',
      '  );',
      'end entity;',
      '',
      'architecture rtl of alu is',
      '  signal resized_u : unsigned(7 downto 0);',
      'begin',
      '  resized_u <= resize(a, 8);',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['src/alu.vhd']);

  assert.ok(findings.some((entry) => entry.includes('calls resize on raw std_logic_vector "a"')));
});

test('detectKnownVhdlAntiPatterns flags plain variables declared in the architecture body', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-archvar-'));
  const sourcePath = path.join(root, 'tb');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu_tb.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity alu_tb is',
      'end entity;',
      '',
      'architecture sim of alu_tb is',
      '  variable pass_count : integer := 0;',
      'begin',
      '  process',
      '  begin',
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['tb/alu_tb.vhd']);

  assert.ok(findings.some((entry) => entry.includes('declares plain architecture-body variable "pass_count"')));
});

test('detectKnownVhdlAntiPatterns flags signal declarations inside executable regions', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-exec-signal-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity alu is',
      'end entity;',
      '',
      'architecture rtl of alu is',
      'begin',
      '  process(all)',
      '  begin',
      '    signal s_add : unsigned(7 downto 0);',
      '    null;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['src/alu.vhd']);

  assert.ok(findings.some((entry) => entry.includes('declares signal "s_add" inside an executable region')));
});

test('detectKnownVhdlAntiPatterns flags reserved procedure arguments and package identifiers', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-reserved-'));
  const sourcePath = path.join(root, 'tb');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu_tb.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'package signal is',
      'end package;',
      '',
      'entity alu_tb is',
      'end entity;',
      '',
      'architecture sim of alu_tb is',
      '  procedure check_count(label : string) is',
      '  begin',
      '    null;',
      '  end procedure;',
      'begin',
      '  process begin wait; end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['tb/alu_tb.vhd']);

  assert.ok(findings.some((entry) => entry.includes('reserved VHDL identifier "signal"')));
  assert.ok(findings.some((entry) => entry.includes('reserved VHDL identifier "label"')));
});

test('detectKnownVhdlAntiPatterns flags illegal logical hybrids on numeric operands', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-hybrid-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity alu is',
      'end entity;',
      '',
      'architecture rtl of alu is',
      'begin',
      '  process(all)',
      '    variable a_int : integer := 0;',
      '    variable b_int : integer := 0;',
      '    variable zero_v : boolean := false;',
      '  begin',
      '    zero_v := a_int and b_int = 0;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['src/alu.vhd']);

  assert.ok(findings.some((entry) => entry.includes('illegal logical-operator expression on numeric operands')));
});

test('detectKnownVhdlAntiPatterns flags missing local IEEE clauses in package files', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-imports-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu_pkg.vhd'),
    [
      'package alu_pkg is',
      '  constant OP_AND : std_logic_vector(3 downto 0) := "0010";',
      'end package;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['src/alu_pkg.vhd']);

  assert.ok(findings.some((entry) => entry.includes('uses std_logic/std_ulogic logic types without a local "use ieee.std_logic_1164.all;" clause')));
});

test('detectKnownVhdlAntiPatterns flags raw std_logic_vector bitwise expressions assigned into unsigned', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-typed-mismatch-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity alu is',
      '  port (',
      '    a : in std_logic_vector(7 downto 0);',
      '    b : in std_logic_vector(7 downto 0)',
      '  );',
      'end entity;',
      '',
      'architecture rtl of alu is',
      '  signal a_sig : std_logic_vector(7 downto 0);',
      '  signal b_sig : std_logic_vector(7 downto 0);',
      '  signal result_u : unsigned(7 downto 0);',
      'begin',
      '  result_u <= a_sig and b_sig;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['src/alu.vhd']);

  assert.ok(findings.some((entry) => entry.includes('assigns raw std_logic_vector bitwise expression')));
});

test('detectKnownVhdlAntiPatterns flags interface declarations that misuse => instead of :', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-interface-arrow-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu_core.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity alu_core is',
      '  port (',
      '    Result => std_logic_vector(7 downto 0);',
      '    Carry_Out => std_logic',
      '  );',
      'end entity;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['src/alu_core.vhd']);

  assert.ok(findings.some((entry) => entry.includes('uses association syntax')));
  assert.ok(findings.some((entry) => entry.includes('must use ":" after the identifier')));
});

test('detectKnownVhdlAntiPatterns flags constrained scalar aliases declared with type instead of subtype', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-scalar-type-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu_ops_pkg.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'package alu_ops_pkg is',
      '  type operation_code_type is integer range 0 to 7;',
      'end package;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['src/alu_ops_pkg.vhd']);

  assert.ok(findings.some((entry) => entry.includes('declares constrained scalar alias "operation_code_type"')));
  assert.ok(findings.some((entry) => entry.includes('use "subtype operation_code_type is integer range')));
});

test('detectKnownVhdlAntiPatterns flags bit-string assignments into scalar numeric declarations', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-scalar-bits-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu_pkg.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'package alu_pkg is',
      '  constant OPCODE_ADD : natural := "00";',
      'end package;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['src/alu_pkg.vhd']);

  assert.ok(findings.some((entry) => entry.includes('assigns bit-string literal "00" to scalar numeric natural "OPCODE_ADD"')));
});

test('detectKnownVhdlAntiPatterns does not misread legal package body declarations as reserved package names', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-package-body-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu_operations_pkg.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'package alu_operations_pkg is',
      'end package;',
      '',
      'package body alu_operations_pkg is',
      'end package body;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['src/alu_operations_pkg.vhd']);

  assert.equal(findings.some((entry) => entry.includes('reserved VHDL identifier "body"')), false);
});

test('detectKnownVhdlAntiPatterns flags natural-language leakage inside VHDL declarations', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-prose-leak-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu_types.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'package alu_types is',
      '  constant OP_ADD : std_logic_vector(2 downto 0) := "000" after "integer" element;',
      'end package;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['src/alu_types.vhd']);

  assert.ok(findings.some((entry) => entry.includes('contains natural-language prose inside a VHDL declaration')));
});

test('detectKnownVhdlAntiPatterns flags end statements that incorrectly include file extensions', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-end-extension-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu_types.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'package alu_types is',
      'end package alu_types.vhdl;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['src/alu_types.vhd']);

  assert.ok(findings.some((entry) => entry.includes('ends a package with a file extension')));
});

test('detectKnownVhdlAntiPatterns flags Verilog-style sized literals inside VHDL', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-verilog-literal-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu_pkg.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'package alu_pkg is',
      '  subtype opcode_t is std_logic_vector(2 downto 0);',
      '  constant ALU_OP_ADD : opcode_t := 3\'b000;',
      'end package;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['src/alu_pkg.vhd']);

  assert.ok(findings.some((entry) => entry.includes('uses Verilog-style literal "3\'b000"')));
});

test('detectKnownVhdlAntiPatterns flags raw std_logic_vector use in to_integer and shift helpers', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-numeric-std-helpers-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity alu is',
      'end entity;',
      '',
      'architecture rtl of alu is',
      '  signal a_vec : std_logic_vector(7 downto 0);',
      '  signal shifted_u : unsigned(7 downto 0);',
      '  signal index_v : integer := 0;',
      'begin',
      '  shifted_u <= shift_left(a_vec, 1);',
      '  index_v <= to_integer(a_vec);',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['src/alu.vhd']);

  assert.ok(findings.some((entry) => entry.includes('calls shift_left on raw std_logic_vector "a_vec"')));
  assert.ok(findings.some((entry) => entry.includes('calls to_integer on raw std_logic_vector "a_vec"')));
});

test('detectKnownVhdlAntiPatterns flags raw std_logic_vector actuals passed into typed helper formals', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-typed-helper-actuals-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity alu is',
      '  port (',
      '    a      : in std_logic_vector(7 downto 0);',
      '    b      : in std_logic_vector(7 downto 0);',
      '    opcode : in std_logic_vector(2 downto 0)',
      '  );',
      'end entity;',
      '',
      'architecture rtl of alu is',
      '  function calc_result(',
      '    lhs : unsigned(7 downto 0);',
      '    rhs : unsigned(7 downto 0);',
      '    op  : std_logic_vector(2 downto 0)',
      '  ) return unsigned is',
      '  begin',
      '    return lhs + rhs;',
      '  end function;',
      '  signal res_u : unsigned(7 downto 0);',
      'begin',
      '  process(all)',
      '  begin',
      '    res_u <= calc_result(a, b, opcode);',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['src/alu.vhd']);

  assert.ok(findings.some((entry) => entry.includes('calls function "calc_result" with raw std_logic_vector actual "a" for unsigned formal parameter #1')));
});

test('detectKnownVhdlAntiPatterns flags resize with range attributes and outer-scope procedure writes', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-resize-range-'));
  const sourcePath = path.join(root, 'tb');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu_tb.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity alu_tb is',
      'end entity;',
      '',
      'architecture sim of alu_tb is',
      '  signal test_failed : std_logic := \'0\';',
      '  signal sum_u : unsigned(8 downto 0);',
      '  procedure mark_fail(msg_name : string) is',
      '  begin',
      '    test_failed <= \'1\';',
      '  end procedure;',
      'begin',
      '  process(all)',
      '    variable resized_u : unsigned(8 downto 0);',
      '  begin',
      '    resized_u := resize(sum_u, sum_u\'range);',
      '    mark_fail("boom");',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['tb/alu_tb.vhd']);

  assert.ok(findings.some((entry) => entry.includes('calls resize with attribute range "sum_u\'range"')));
  assert.ok(findings.some((entry) => entry.includes('procedure "mark_fail" assigns to outer-scope object "test_failed"')));
});

test('detectKnownVhdlAntiPatterns flags outer-scope procedure writes for alternate failure flag names', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-out-test-failed-'));
  const sourcePath = path.join(root, 'tb');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu_tb.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity alu_tb is',
      'end entity;',
      '',
      'architecture sim of alu_tb is',
      '  signal out_test_failed : std_logic := \'0\';',
      '  procedure check_result(op_name : string) is',
      '  begin',
      '    out_test_failed <= \'1\';',
      '  end procedure;',
      'begin',
      '  process(all)',
      '  begin',
      '    check_result("add");',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['tb/alu_tb.vhd']);

  assert.ok(findings.some((entry) => entry.includes('procedure "check_result" assigns to outer-scope object "out_test_failed"')));
});

test('detectKnownVhdlAntiPatternDetails returns machine-readable failure metadata', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-detail-meta-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu_pkg.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'package alu_pkg is',
      '  type alu_op_t is (AND, OP_ADD);',
      'end package;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['src/alu_pkg.vhd']);

  assert.equal(details[0]?.code, 'reserved_identifier');
  assert.equal(details[0]?.category, 'identifier_reserved_word');
  assert.match(details[0]?.forbiddenConstruct || '', /reserved identifier/i);
  assert.match(details[0]?.legalReplacementPattern || '', /ALU_OP_AND/i);
});

test('detectKnownVhdlAntiPatterns flags subprogram bodies inside package declarations', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-package-subprogram-body-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'pkg.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'package pkg is',
      '  procedure bad is',
      '  begin',
      '    null;',
      '  end procedure;',
      'end package;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['src/pkg.vhd']);
  assert.ok(findings.some((entry) => entry.includes('subprogram body inside package declaration')));
});

test('detectKnownVhdlAntiPatterns flags signal and variable assignment operator misuse', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-assign-ops-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'mix.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity mix is end entity;',
      'architecture rtl of mix is',
      '  signal done_s : std_logic := \'0\';',
      'begin',
      '  process(all)',
      '    variable count_v : integer := 0;',
      '  begin',
      '    count_v <= 1;',
      '    done_s := \'1\';',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['src/mix.vhd']);
  assert.ok(findings.some((entry) => entry.includes('Variables must use ":="')));
  assert.ok(findings.some((entry) => entry.includes('Signals must use "<="')));
});

test('detectKnownVhdlAntiPatterns flags helper procedures declared after begin', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-procedure-after-begin-'));
  const sourcePath = path.join(root, 'tb');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'tb_bridge_top.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity tb_bridge_top is',
      '  port (',
      '    uart_tx_out : out std_logic',
      '  );',
      'end entity;',
      '',
      'architecture sim of tb_bridge_top is',
      'begin',
      '  process(all)',
      '  begin',
      '    procedure check_signal is',
      '    begin',
      '      null;',
      '    end procedure;',
      '    check_signal;',
      '    uart_tx_out <= uart_tx_out;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['tb/tb_bridge_top.vhd']);

  assert.ok(findings.some((entry) => entry.includes('declares procedure "check_signal" inside an executable region after "begin"')));
});

test('detectKnownVhdlAntiPatterns flags illegal multidimensional packed vectors and runtime bound risks', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-array-runtime-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'buf.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity buf is end entity;',
      'architecture rtl of buf is',
      '  signal lanes : std_logic_vector(7 downto 0)(3 downto 0);',
      '  signal idx_v : std_logic_vector(1 downto 0);',
      'begin',
      '  process(all)',
      '  begin',
      '    lanes(to_integer(unsigned(idx_v))) <= "00000000";',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['src/buf.vhd']);
  assert.ok(findings.some((entry) => entry.includes('illegal multidimensional packed vector form')));
  assert.ok(findings.some((entry) => entry.includes('unchecked to_integer(...) expression')));
});

test('detectKnownVhdlAntiPatterns flags undeclared interface dimensions', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-undeclared-interface-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'bad_if.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity bad_if is',
      '  port (',
      '    data_i : in std_logic_vector(DATA_WIDTH - 1 downto 0)',
      '  );',
      'end entity;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await detectKnownVhdlAntiPatterns(root, ['src/bad_if.vhd']);
  assert.ok(findings.some((entry) => entry.includes('undeclared width/generic "DATA_WIDTH"')));
});

test('validateGeneratedProjectContracts flags missing top-level generic defaults and unconstrained top ports', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-top-contract-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'top.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity top is',
      '  generic (',
      '    DATA_WIDTH : natural',
      '  );',
      '  port (',
      '    data_i : in std_logic_vector;',
      '    data_o : out std_logic_vector(DATA_WIDTH - 1 downto 0)',
      '  );',
      'end entity;',
      'architecture rtl of top is begin end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await validateGeneratedProjectContracts({
    macroId: 'fpga_vhdl_architect',
    validationRoot: root,
    selectedSources: [{
      path: 'src/top.vhd',
      entities: ['top'],
      packages: [],
      packageBodies: [],
      dependencies: [],
      isTestbench: false,
    }],
    topEntities: ['tb_top'],
    architectProject: {
      projectName: 'top',
      sanitizedProjectName: 'top',
      topEntity: 'top',
      vhdlStandard: '08',
      targetFpga: null,
      summary: '',
      assumptions: [],
      warnings: [],
      folderTree: '',
      files: [],
      ghdl: {
        analysisOrder: ['src/top.vhd'],
        topTestbench: 'tb_top',
        runCommands: ['ghdl -a --std=08 src/top.vhd', 'ghdl -e --std=08 tb_top', 'ghdl -r --std=08 tb_top --vcd=waves.vcd'],
        expectedResult: 'PASS',
      },
      qualityChecklist: [],
    },
  });

  assert.ok(findings.some((detail) => detail.code === 'top_level_generic_default_missing'));
  assert.ok(findings.some((detail) => detail.code === 'top_level_port_unconstrained'));
  assert.ok(findings.every((detail) => Array.isArray(detail.ruleIds) && detail.ruleIds.length > 0));
});

test('validateGeneratedProjectContracts flags mixed standards, missing waveform contract, and generated RTL clocks', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-command-contract-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'clk_div.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity clk_div is end entity;',
      'architecture rtl of clk_div is',
      '  signal slow_clk : std_logic := \'0\';',
      'begin',
      '  slow_clk <= not slow_clk after 5 ns;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await validateGeneratedProjectContracts({
    macroId: 'fpga_vhdl_architect',
    validationRoot: root,
    selectedSources: [{
      path: 'src/clk_div.vhd',
      entities: ['clk_div'],
      packages: [],
      packageBodies: [],
      dependencies: [],
      isTestbench: false,
    }],
    topEntities: ['tb_clk_div'],
    architectProject: {
      projectName: 'clk_div',
      sanitizedProjectName: 'clk_div',
      topEntity: 'clk_div',
      vhdlStandard: '08',
      targetFpga: null,
      summary: '',
      assumptions: [],
      warnings: [],
      folderTree: '',
      files: [],
      ghdl: {
        analysisOrder: ['src/clk_div.vhd'],
        topTestbench: 'tb_clk_div',
        runCommands: ['ghdl -a --std=08 src/clk_div.vhd', 'ghdl -e --std=19 tb_clk_div', 'ghdl -r --std=19 tb_clk_div'],
        expectedResult: 'PASS',
      },
      qualityChecklist: [],
    },
  });

  assert.ok(findings.some((detail) => detail.code === 'mixed_vhdl_standard_group'));
  assert.ok(findings.some((detail) => detail.code === 'missing_waveform_generation_contract'));
  assert.ok(findings.some((detail) => detail.code === 'generated_clock_in_rtl'));
});

test('validateGeneratedProjectContracts flags RTL TB-only constructs, std_logic_textio, and mixed clock edges', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-rtl-policy-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'bad_rtl.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.std_logic_textio.all;',
      '',
      'entity bad_rtl is end entity;',
      'architecture rtl of bad_rtl is',
      'begin',
      '  p_rise : process(clk) begin if rising_edge(clk) then null; end if; end process;',
      '  p_fall : process(clk) begin if falling_edge(clk) then null; end if; end process;',
      '  p_wait : process begin wait for 10 ns; end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await validateGeneratedProjectContracts({
    macroId: 'draft_rtl_skeleton',
    validationRoot: root,
    selectedSources: [{
      path: 'src/bad_rtl.vhd',
      entities: ['bad_rtl'],
      packages: [],
      packageBodies: [],
      dependencies: [],
      isTestbench: false,
    }],
    topEntities: [],
    architectProject: null,
  });

  assert.ok(findings.some((detail) => detail.code === 'rtl_contains_tb_only_construct'));
  assert.ok(findings.some((detail) => detail.code === 'unsupported_textio_package_policy'));
  assert.ok(findings.some((detail) => detail.code === 'mixed_clock_edge_domain'));
});

test('validateGeneratedProjectContracts flags missing command contract and invalid source-order dependencies', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-order-contract-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'top.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use work.util_pkg.all;',
      '',
      'entity top is end entity;',
      'architecture rtl of top is begin end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );
  await fs.writeFile(
    path.join(sourcePath, 'util_pkg.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'package util_pkg is',
      '  constant C_ONE : std_logic := \'1\';',
      'end package;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await validateGeneratedProjectContracts({
    macroId: 'fpga_vhdl_architect',
    validationRoot: root,
    selectedSources: [
      {
        path: 'src/top.vhd',
        entities: ['top'],
        packages: [],
        packageBodies: [],
        dependencies: ['util_pkg'],
        isTestbench: false,
      },
      {
        path: 'src/util_pkg.vhd',
        entities: [],
        packages: ['util_pkg'],
        packageBodies: [],
        dependencies: [],
        isTestbench: false,
      },
    ],
    topEntities: ['tb_top'],
    architectProject: {
      projectName: 'top',
      sanitizedProjectName: 'top',
      topEntity: 'top',
      vhdlStandard: '08',
      targetFpga: null,
      summary: '',
      assumptions: [],
      warnings: [],
      folderTree: '',
      files: [],
      ghdl: {
        analysisOrder: ['src/top.vhd', 'src/util_pkg.vhd'],
        topTestbench: 'tb_top',
        runCommands: ['ghdl -a --std=08 src/top.vhd'],
        expectedResult: 'PASS',
      },
      qualityChecklist: [],
    },
  });

  assert.ok(findings.some((detail) => detail.code === 'missing_ghdl_command_contract'));
  assert.ok(findings.some((detail) => detail.code === 'missing_waveform_generation_contract'));
  assert.ok(findings.some((detail) => detail.code === 'invalid_source_order_contract'));
});

test('validateGeneratedProjectContracts flags multiple architecture ambiguity for runnable tops', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-arch-ambiguity-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'core_rtl.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity core is end entity;',
      'architecture rtl of core is begin end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );
  await fs.writeFile(
    path.join(sourcePath, 'core_gate.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity core is end entity;',
      'architecture gate of core is begin end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const findings = await validateGeneratedProjectContracts({
    macroId: 'fpga_vhdl_architect',
    validationRoot: root,
    selectedSources: [
      {
        path: 'src/core_rtl.vhd',
        entities: ['core'],
        packages: [],
        packageBodies: [],
        dependencies: [],
        isTestbench: false,
      },
      {
        path: 'src/core_gate.vhd',
        entities: ['core'],
        packages: [],
        packageBodies: [],
        dependencies: [],
        isTestbench: false,
      },
    ],
    topEntities: ['core'],
    architectProject: {
      projectName: 'core',
      sanitizedProjectName: 'core',
      topEntity: 'core',
      vhdlStandard: '08',
      targetFpga: null,
      summary: '',
      assumptions: [],
      warnings: [],
      folderTree: '',
      files: [],
      ghdl: {
        analysisOrder: ['src/core_rtl.vhd', 'src/core_gate.vhd'],
        topTestbench: 'tb_core',
        runCommands: ['ghdl -a --std=08 src/core_rtl.vhd', 'ghdl -a --std=08 src/core_gate.vhd', 'ghdl -e --std=08 core', 'ghdl -r --std=08 core --vcd=waves.vcd'],
        expectedResult: 'PASS',
      },
      qualityChecklist: [],
    },
  });

  assert.ok(findings.some((detail) => detail.code === 'multiple_architecture_elaboration_ambiguity'));
});
