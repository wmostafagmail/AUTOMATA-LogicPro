import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  detectKnownVhdlAntiPatternDetails,
  detectKnownVhdlAntiPatterns,
  inferFailureDetailsFromGhdlMessage,
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

test('detectKnownVhdlAntiPatternDetails includes relative file paths for machine-readable findings', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-details-path-'));
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

  const details = await detectKnownVhdlAntiPatternDetails(root, ['tb/alu_tb.vhd']);
  const architectureVariable = details.find((detail) => detail.code === 'architecture_body_variable');

  assert.ok(architectureVariable);
  assert.equal(architectureVariable?.relativePath, 'tb/alu_tb.vhd');
});

test('detectKnownVhdlAntiPatternDetails classifies architecture-body bookkeeping variables as shared-state intent', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-archvar-bookkeeping-'));
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

  const details = await detectKnownVhdlAntiPatternDetails(root, ['tb/alu_tb.vhd']);
  const architectureVariable = details.find((detail) => detail.code === 'architecture_body_variable');

  assert.ok(architectureVariable);
  assert.match(architectureVariable?.forbiddenConstruct || '', /testbench_bookkeeping/i);
  assert.match(architectureVariable?.legalReplacementPattern || '', /shared testbench bookkeeping/i);
});

test('detectKnownVhdlAntiPatternDetails classifies architecture-body scratch variables as process-local intent', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-archvar-scratch-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity alu is',
      'end entity;',
      '',
      'architecture rtl of alu is',
      '  variable temp_sum : integer := 0;',
      'begin',
      '  process(all)',
      '  begin',
      '    null;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['src/alu.vhd']);
  const architectureVariable = details.find((detail) => detail.code === 'architecture_body_variable');

  assert.ok(architectureVariable);
  assert.match(architectureVariable?.forbiddenConstruct || '', /process_local_scratch/i);
  assert.match(architectureVariable?.legalReplacementPattern || '', /nearest process\/subprogram declarative region/i);
});

test('detectKnownVhdlAntiPatternDetails reports multiple architecture-body variables from one file', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-archvar-multi-'));
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
      '  variable fail_count : integer := 0;',
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

  const details = await detectKnownVhdlAntiPatternDetails(root, ['tb/alu_tb.vhd']);
  const architectureVariables = details.filter((detail) => detail.code === 'architecture_body_variable');

  assert.equal(architectureVariables.length, 2);
  assert.deepEqual(
    architectureVariables.map((detail) => detail.forbiddenConstruct).sort(),
    [
      'plain architecture-body variable "fail_count" (testbench_bookkeeping)',
      'plain architecture-body variable "pass_count" (testbench_bookkeeping)',
    ],
  );
});

test('detectKnownVhdlAntiPatternDetails does not flag function-local variables before architecture begin as architecture-body variables', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-archvar-local-fn-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu_pkg.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity alu_pkg is',
      'end entity;',
      '',
      'architecture rtl of alu_pkg is',
      '  function carry_or_zero(flag_i : std_logic) return integer is',
      '    variable local_value : integer := 0;',
      '  begin',
      '    if flag_i = \'1\' then',
      '      local_value := 1;',
      '    end if;',
      '    return local_value;',
      '  end function carry_or_zero;',
      'begin',
      '  process(all)',
      '  begin',
      '    null;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['src/alu_pkg.vhd']);
  const codes = new Set(details.map((detail) => detail.code));

  assert.equal(codes.has('architecture_body_variable'), false);
});

test('detectKnownVhdlAntiPatternDetails does not flag process-local helper variables as architecture-body variables', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-archvar-process-helper-'));
  const tbPath = path.join(root, 'tb');
  await fs.mkdir(tbPath, { recursive: true });
  await fs.writeFile(
    path.join(tbPath, 'tb_nested_helper.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity tb_nested_helper is',
      'end entity;',
      '',
      'architecture sim of tb_nested_helper is',
      'begin',
      '  stim_proc : process',
      '    function next_count(seed_i : integer) return integer is',
      '      variable local_count : integer := seed_i;',
      '    begin',
      '      local_count := local_count + 1;',
      '      return local_count;',
      '    end function next_count;',
      '    variable pass_cnt : integer := 0;',
      '  begin',
      '    pass_cnt := next_count(pass_cnt);',
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['tb/tb_nested_helper.vhd']);
  const codes = new Set(details.map((detail) => detail.code));

  assert.equal(codes.has('architecture_body_variable'), false);
  assert.equal(codes.has('declaration_after_begin'), false);
});

test('inferFailureDetailsFromGhdlMessage maps recurring analyze errors into canonical failure codes', () => {
  const architectureDetails = inferFailureDetailsFromGhdlMessage(
    'tb/router_tb.vhd:33:3:error: non-shared variable declaration not allowed in architecture body',
  );
  assert.equal(architectureDetails[0]?.code, 'architecture_body_variable');
  assert.equal(architectureDetails[0]?.category, 'declaration_scope');

  const ieeeDetails = inferFailureDetailsFromGhdlMessage(
    'src/alu_pkg.vhd:12:27:error: no declaration for "std_logic_vector"',
  );
  assert.equal(ieeeDetails[0]?.code, 'missing_std_logic_1164_clause');
  assert.equal(ieeeDetails[0]?.category, 'missing_ieee_clause');

  const numericDetails = inferFailureDetailsFromGhdlMessage(
    'src/alu.vhd:39:28:error: no overloaded function found matching "resize"',
  );
  assert.equal(numericDetails[0]?.code, 'resize_on_raw_std_logic_vector');
  assert.equal(numericDetails[0]?.category, 'numeric_std_type_discipline');

  const functionReturnDetails = inferFailureDetailsFromGhdlMessage(
    'src/alu.vhd:35:23:error: can\'t match function call with type array type "UNRESOLVED_UNSIGNED"',
  );
  assert.equal(functionReturnDetails[0]?.code, 'typed_function_result_mismatch');
  assert.equal(functionReturnDetails[0]?.category, 'numeric_std_type_discipline');
});

test('inferFailureDetailsFromGhdlMessage recognizes reserved shift keywords and package/body misuse from raw analyze output', () => {
  const reservedKeywordDetails = inferFailureDetailsFromGhdlMessage(
    "src/alu_pkg.vhd:4:63:error: (found: 'sll')",
  );
  assert.equal(reservedKeywordDetails[0]?.code, 'reserved_identifier');
  assert.equal(reservedKeywordDetails[0]?.category, 'identifier_reserved_word');

  const packageBodyDetails = inferFailureDetailsFromGhdlMessage(
    'src/pkg.vhd:14:1:error: package body alu_pkg was not analysed',
  );
  assert.equal(packageBodyDetails[0]?.code, 'subprogram_body_inside_package_declaration');
  assert.equal(packageBodyDetails[0]?.category, 'package_type_definition');
});

test('inferFailureDetailsFromGhdlMessage recognizes reserved generic tokens, leaked procedure declarations, and package analysis escapes', () => {
  const reservedLabelDetails = inferFailureDetailsFromGhdlMessage(
    'tb/tb_updown_counter.vhd:80:23:error: unexpected token \'label\' in a primary',
  );
  assert.equal(reservedLabelDetails[0]?.code, 'reserved_identifier');
  assert.equal(reservedLabelDetails[0]?.category, 'identifier_reserved_word');

  const leakedProcedureDetails = inferFailureDetailsFromGhdlMessage(
    'tb/tb_updown_counter.vhd:76:5:error: interface declaration expected procedure check_count(expected : unsigned; label : string) is',
  );
  assert.ok(leakedProcedureDetails.some((detail) => detail.code === 'declaration_after_begin'));

  const packageAnalysisEscapeDetails = inferFailureDetailsFromGhdlMessage(
    'src/alu_pkg.vhd:15:14:error: package "alu_pkg" was not analysed',
  );
  assert.ok(packageAnalysisEscapeDetails.some((detail) => detail.code === 'subprogram_body_inside_package_declaration'));
});

test('inferFailureDetailsFromGhdlMessage recognizes illegal prefix operator forms without misclassifying them as reserved identifiers', () => {
  const details = inferFailureDetailsFromGhdlMessage(
    'src/alu_pkg.vhd:81:35:error: missing ";" at end of statement res.data := xnor a, b;',
  );

  assert.ok(details.some((detail) => detail.code === 'illegal_prefix_operator_form'));
  assert.ok(!details.some((detail) => detail.code === 'reserved_identifier'));
});

test('inferFailureDetailsFromGhdlMessage recognizes typed port associations and anonymous array object declarations', () => {
  const typedPortDetails = inferFailureDetailsFromGhdlMessage(
    [
      'src/dsp_chain.vhd:32:22:error: can\'t associate "fir_sample" with port "sample_o"',
      '  sample_o => std_logic_vector(fir_sample),',
      'src/dsp_chain.vhd:32:22:error: (type of "fir_sample" is sample_t)',
      'src/fir_filter.vhd:12:5:error: (type of port "sample_o" is a subtype of UNRESOLVED_SIGNED)',
    ].join('\n'),
  );
  assert.equal(typedPortDetails[0]?.code, 'typed_port_association_mismatch');
  assert.equal(typedPortDetails[0]?.category, 'numeric_std_type_discipline');

  const anonymousArrayDetails = inferFailureDetailsFromGhdlMessage(
    [
      'src/cpu_core.vhd:27:20:error: type mark expected in a subtype indication',
      "  signal regs    : array(reg_idx_t range 0 to 7) of data_t := (others => (others => '0'));",
      '                   ^',
    ].join('\n'),
  );
  assert.equal(anonymousArrayDetails[0]?.code, 'anonymous_array_object_declaration');
  assert.equal(anonymousArrayDetails[0]?.category, 'array_subtype_misuse');
});

test('inferFailureDetailsFromGhdlMessage recognizes recurring string-contract testbench failures', () => {
  const unconstrainedStringDetails = inferFailureDetailsFromGhdlMessage(
    'tb/router_tb.vhd:33:5:error: declaration of variable "fail_msg" with unconstrained array type "string" is not allowed',
  );
  assert.equal(unconstrainedStringDetails[0]?.code, 'tb_unconstrained_string_variable');

  const constrainedFormalDetails = inferFailureDetailsFromGhdlMessage(
    'tb/router_tb.vhd:80:9:error: string length does not match that of anonymous interface\n'
      + 'tb/router_tb.vhd:80:9:error: actual constraints don\'t match formal ones',
  );
  assert.equal(constrainedFormalDetails[0]?.code, 'tb_string_formal_actual_constraint_mismatch');
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

test('detectKnownVhdlAntiPatternDetails reports multiple executable-region declaration clusters from one file', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-exec-multi-'));
  const sourcePath = path.join(root, 'tb');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'tb_router.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity tb_router is',
      'end entity;',
      '',
      'architecture sim of tb_router is',
      'begin',
      '  stimulus: process',
      '  begin',
      '    procedure check_word is',
      '    begin',
      '      null;',
      '    end procedure;',
      '    signal tmp_word : std_logic := \'0\';',
      '    wait;',
      '  end process;',
      '',
      '  monitor: process',
      '  begin',
      '    constant settle_cycles : integer := 2;',
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['tb/tb_router.vhd']);
  const afterBeginDeclarations = details.filter((detail) => detail.code === 'declaration_after_begin');
  const executableSignals = details.filter((detail) => detail.code === 'executable_region_signal_declaration');

  assert.equal(afterBeginDeclarations.length, 2);
  assert.ok(afterBeginDeclarations.some((detail) => detail.forbiddenConstruct === 'procedure declaration for "check_word" after begin'));
  assert.ok(afterBeginDeclarations.some((detail) => detail.forbiddenConstruct === 'constant declaration for "settle_cycles" after begin'));
  assert.equal(executableSignals.length, 1);
  assert.equal(executableSignals[0]?.forbiddenConstruct, 'signal declaration for "tmp_word" after begin');
});

test('detectKnownVhdlAntiPatternDetails flags raw std_logic_vector actuals passed into typed formal ports before GHDL', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-typed-port-map-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'top.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity fir_filter is',
      '  port (',
      '    sample_o : out signed(15 downto 0)',
      '  );',
      'end entity;',
      '',
      'entity top is end entity;',
      'architecture rtl of top is',
      '  signal fir_sample : std_logic_vector(15 downto 0);',
      'begin',
      '  u_fir : entity work.fir_filter',
      '    port map (',
      '      sample_o => std_logic_vector(fir_sample)',
      '    );',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['src/top.vhd']);
  const typedPortMismatch = details.find((detail) => detail.code === 'typed_port_association_mismatch');

  assert.ok(typedPortMismatch);
  assert.equal(typedPortMismatch?.category, 'numeric_std_type_discipline');
  assert.match(typedPortMismatch?.message || '', /raw std_logic_vector actual "std_logic_vector\(fir_sample\)" in a port map/i);
});

test('detectKnownVhdlAntiPatternDetails resolves named signed aliases in typed port-map mismatches', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-typed-port-alias-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'top.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'subtype sample_t is signed(15 downto 0);',
      '',
      'entity fir_filter is',
      '  port (',
      '    sample_o : out unsigned(15 downto 0)',
      '  );',
      'end entity;',
      '',
      'entity top is end entity;',
      'architecture rtl of top is',
      '  signal sample_mid : sample_t;',
      'begin',
      '  u_fir : entity work.fir_filter',
      '    port map (',
      '      sample_o => sample_mid',
      '    );',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['src/top.vhd']);
  const typedPortMismatch = details.find((detail) => detail.code === 'typed_port_association_mismatch');

  assert.ok(typedPortMismatch);
  assert.equal(typedPortMismatch?.category, 'numeric_std_type_discipline');
  assert.match(typedPortMismatch?.message || '', /with signed actual "sample_mid" in a port map/i);
});

test('detectKnownVhdlAntiPatternDetails resolves typed port-map mismatches across separate source files', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-typed-port-cross-file-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });

  await fs.writeFile(
    path.join(sourcePath, 'fir_filter.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity fir_filter is',
      '  port (',
      '    sample_o : out signed(15 downto 0)',
      '  );',
      'end entity;',
      '',
      'architecture rtl of fir_filter is',
      'begin',
      '  sample_o <= (others => \'0\');',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  await fs.writeFile(
    path.join(sourcePath, 'top.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity top is end entity;',
      'architecture rtl of top is',
      '  signal fir_sample : std_logic_vector(15 downto 0);',
      'begin',
      '  u_fir : entity work.fir_filter',
      '    port map (',
      '      sample_o => fir_sample',
      '    );',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['src/fir_filter.vhd', 'src/top.vhd']);
  const typedPortMismatch = details.find(
    (detail) => detail.code === 'typed_port_association_mismatch' && detail.relativePath === 'src/top.vhd',
  );

  assert.ok(typedPortMismatch);
  assert.equal(typedPortMismatch?.category, 'numeric_std_type_discipline');
  assert.match(typedPortMismatch?.message || '', /formal port "sample_o" of "fir_filter"/i);
});

test('detectKnownVhdlAntiPatternDetails resolves typed port-map mismatches through package-defined subtype aliases', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-typed-port-package-alias-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });

  await fs.writeFile(
    path.join(sourcePath, 'dsp_pkg.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'package dsp_pkg is',
      '  subtype sample_t is signed(15 downto 0);',
      'end package;',
      '',
    ].join('\n'),
    'utf8',
  );

  await fs.writeFile(
    path.join(sourcePath, 'fir_filter.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      'use work.dsp_pkg.all;',
      '',
      'entity fir_filter is',
      '  port (',
      '    sample_o : out sample_t',
      '  );',
      'end entity;',
      '',
      'architecture rtl of fir_filter is',
      'begin',
      '  sample_o <= (others => \'0\');',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  await fs.writeFile(
    path.join(sourcePath, 'top.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      'use work.dsp_pkg.all;',
      '',
      'entity top is end entity;',
      'architecture rtl of top is',
      '  signal fir_sample : sample_t;',
      'begin',
      '  u_fir : entity work.fir_filter',
      '    port map (',
      '      sample_o => std_logic_vector(fir_sample)',
      '    );',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['src/dsp_pkg.vhd', 'src/fir_filter.vhd', 'src/top.vhd']);
  const typedPortMismatch = details.find(
    (detail) => detail.code === 'typed_port_association_mismatch' && detail.relativePath === 'src/top.vhd',
  );

  assert.ok(typedPortMismatch);
  assert.equal(typedPortMismatch?.category, 'numeric_std_type_discipline');
  assert.match(typedPortMismatch?.message || '', /formal port "sample_o" of "fir_filter"/i);
  assert.match(typedPortMismatch?.message || '', /with (?:raw )?std_logic_vector actual "std_logic_vector\(fir_sample\)"/i);
});

test('detectKnownVhdlAntiPatternDetails resolves typed helper actual mismatches across package/source boundaries', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-typed-helper-cross-file-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });

  await fs.writeFile(
    path.join(sourcePath, 'helpers_pkg.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'package helpers_pkg is',
      '  function use_unsigned(lhs : unsigned; rhs : unsigned) return unsigned;',
      'end package;',
      '',
      'package body helpers_pkg is',
      '  function use_unsigned(lhs : unsigned; rhs : unsigned) return unsigned is',
      '  begin',
      '    return lhs + rhs;',
      '  end function;',
      'end package body;',
      '',
    ].join('\n'),
    'utf8',
  );

  await fs.writeFile(
    path.join(sourcePath, 'top.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      'use work.helpers_pkg.all;',
      '',
      'entity top is end entity;',
      'architecture rtl of top is',
      '  signal a_slv : std_logic_vector(7 downto 0);',
      '  signal b_slv : std_logic_vector(7 downto 0);',
      '  signal result_u : unsigned(7 downto 0);',
      'begin',
      '  process(all)',
      '  begin',
      '    result_u <= use_unsigned(a_slv, b_slv);',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['src/helpers_pkg.vhd', 'src/top.vhd']);
  const typedHelperMismatch = details.find(
    (detail) => detail.code === 'typed_helper_actual_mismatch' && detail.relativePath === 'src/top.vhd',
  );

  assert.ok(typedHelperMismatch);
  assert.equal(typedHelperMismatch?.category, 'numeric_std_type_discipline');
  assert.match(typedHelperMismatch?.message || '', /calls function "use_unsigned" with raw std_logic_vector actual "a_slv"/i);
});

test('detectKnownVhdlAntiPatternDetails resolves typed helper actual mismatches through package-defined subtype aliases', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-typed-helper-package-alias-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });

  await fs.writeFile(
    path.join(sourcePath, 'dsp_pkg.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'package dsp_pkg is',
      '  subtype sample_t is signed(15 downto 0);',
      '  function blend(lhs : sample_t; rhs : sample_t) return sample_t;',
      'end package;',
      '',
      'package body dsp_pkg is',
      '  function blend(lhs : sample_t; rhs : sample_t) return sample_t is',
      '  begin',
      '    return lhs + rhs;',
      '  end function;',
      'end package body;',
      '',
    ].join('\n'),
    'utf8',
  );

  await fs.writeFile(
    path.join(sourcePath, 'top.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      'use work.dsp_pkg.all;',
      '',
      'entity top is end entity;',
      'architecture rtl of top is',
      '  signal lhs_v : std_logic_vector(15 downto 0);',
      '  signal rhs_v : std_logic_vector(15 downto 0);',
      '  signal acc_v : sample_t;',
      'begin',
      '  process(all)',
      '  begin',
      '    acc_v <= blend(lhs_v, rhs_v);',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['src/dsp_pkg.vhd', 'src/top.vhd']);
  const typedHelperMismatch = details.find(
    (detail) => detail.code === 'typed_helper_actual_mismatch' && detail.relativePath === 'src/top.vhd',
  );

  assert.ok(typedHelperMismatch);
  assert.equal(typedHelperMismatch?.category, 'numeric_std_type_discipline');
  assert.match(typedHelperMismatch?.message || '', /calls function "blend" with raw std_logic_vector actual "lhs_v"/i);
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

test('detectKnownVhdlAntiPatternDetails does not flag legal package body subprograms as declaration-after-begin', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-package-body-subprogram-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'bridge_types_pkg.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'package bridge_types_pkg is',
      '  type fifo_ctrl_t is record',
      '    valid : std_logic;',
      '  end record;',
      '  function fifo_init return fifo_ctrl_t;',
      'end package bridge_types_pkg;',
      '',
      'package body bridge_types_pkg is',
      '  function fifo_init return fifo_ctrl_t is',
      '  begin',
      "    return (valid => '0');",
      '  end function fifo_init;',
      'end package body bridge_types_pkg;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['src/bridge_types_pkg.vhd']);
  const codes = new Set(details.map((detail) => detail.code));

  assert.equal(codes.has('declaration_after_begin'), false);
  assert.equal(codes.has('subprogram_body_inside_package_declaration'), false);
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

test('detectKnownVhdlAntiPatternDetails returns machine-readable metadata for recurring declaration and operator misuse', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-phase1-details-'));
  const tbPath = path.join(root, 'tb');
  const srcPath = path.join(root, 'src');
  await fs.mkdir(tbPath, { recursive: true });
  await fs.mkdir(srcPath, { recursive: true });

  await fs.writeFile(
    path.join(tbPath, 'tb_phase1.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity tb_phase1 is',
      'end entity;',
      '',
      'architecture sim of tb_phase1 is',
      "  signal test_failed : std_logic := '0';",
      "  signal done_s : std_logic := '0';",
      'begin',
      '  process(all)',
      '    variable count_v : integer := 0;',
      '  begin',
      '    procedure mark_fail(msg_name : string) is',
      '    begin',
      "      test_failed <= '1';",
      '    end procedure;',
      '    count_v <= 1;',
      "    done_s := '1';",
      '    done_s <= done_s;',
      '    mark_fail("boom");',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  await fs.writeFile(
    path.join(srcPath, 'readback.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity readback is',
      '  port (',
      '    done_o : out std_logic',
      '  );',
      'end entity;',
      '',
      'architecture rtl of readback is',
      'begin',
      '  process(all)',
      '  begin',
      '    done_o <= done_o;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['tb/tb_phase1.vhd', 'src/readback.vhd']);
  const codes = new Set(details.map((detail) => detail.code));

  assert.ok(codes.has('procedure_outer_scope_write'));
  assert.ok(codes.has('declaration_after_begin'));
  assert.ok(codes.has('variable_assigned_with_signal_operator'));
  assert.ok(codes.has('signal_assigned_with_variable_operator'));
  assert.ok(codes.has('output_port_readback'));
});

test('detectKnownVhdlAntiPatternDetails does not flag process-local helper procedures declared before the local process begin', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-local-helper-'));
  const tbPath = path.join(root, 'tb');
  await fs.mkdir(tbPath, { recursive: true });

  await fs.writeFile(
    path.join(tbPath, 'tb_uart_spi_bridge.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity tb_uart_spi_bridge is',
      'end entity;',
      '',
      'architecture sim of tb_uart_spi_bridge is',
      "  signal clk : std_logic := '0';",
      'begin',
      '  stim_proc : process',
      '    variable pass_cnt : integer := 0;',
      '    variable fail_cnt : integer := 0;',
      "    variable t_fail : std_logic := '0';",
      '    procedure check_eq(',
      '      a : in std_logic;',
      '      b : in std_logic;',
      '      name : in string;',
      '      pass_cnt : inout integer;',
      '      fail_cnt : inout integer;',
      '      t_fail : inout std_logic',
      '    ) is',
      '    begin',
      '      if a = b then',
      '        pass_cnt := pass_cnt + 1;',
      '      else',
      '        fail_cnt := fail_cnt + 1;',
      "        t_fail := '1';",
      '      end if;',
      '    end procedure check_eq;',
      '    procedure wait_clk(clk_sig : in std_logic) is',
      '    begin',
      '      wait until rising_edge(clk_sig);',
      '    end procedure wait_clk;',
      '  begin',
      '    wait_clk(clk);',
      '    check_eq(\'0\', \'0\', "ok", pass_cnt, fail_cnt, t_fail);',
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['tb/tb_uart_spi_bridge.vhd']);
  const codes = new Set(details.map((detail) => detail.code));

  assert.equal(codes.has('declaration_after_begin'), false);
});

test('detectKnownVhdlAntiPatternDetails tracks nested procedure ownership without misclassifying the parent helper', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-nested-procedure-scope-'));
  const tbPath = path.join(root, 'tb');
  await fs.mkdir(tbPath, { recursive: true });

  await fs.writeFile(
    path.join(tbPath, 'tb_nested_scope.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity tb_nested_scope is',
      'end entity;',
      '',
      'architecture sim of tb_nested_scope is',
      'begin',
      '  stim_proc : process',
      '    variable fail_cnt : integer := 0;',
      '    procedure outer_proc is',
      '      variable local_state : integer := 0;',
      '      procedure inner_proc(step_value : integer) is',
      '      begin',
      '        fail_cnt := fail_cnt + step_value;',
      '      end procedure inner_proc;',
      '    begin',
      '      local_state := local_state + 1;',
      '      inner_proc(local_state);',
      '    end procedure outer_proc;',
      '  begin',
      '    outer_proc;',
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['tb/tb_nested_scope.vhd']);
  const procedureWriteDetails = details.filter((detail) => detail.code === 'procedure_outer_scope_write');
  const messages = procedureWriteDetails.map((detail) => detail.message);

  assert.equal(details.some((detail) => detail.code === 'declaration_after_begin'), false);
  assert.equal(details.some((detail) => detail.code === 'architecture_body_variable'), false);
  assert.ok(messages.some((message) => message.includes('procedure "inner_proc" assigns to outer-scope object "fail_cnt"')));
  assert.equal(messages.some((message) => message.includes('procedure "outer_proc" assigns to outer-scope object')), false);
});

test('detectKnownVhdlAntiPatternDetails flags unsafe testbench string helper contracts before GHDL', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-string-contracts-'));
  const tbPath = path.join(root, 'tb');
  await fs.mkdir(tbPath, { recursive: true });

  await fs.writeFile(
    path.join(tbPath, 'tb_router.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity tb_router is',
      'end entity;',
      '',
      'architecture sim of tb_router is',
      'begin',
      '  stimulus : process',
      '    variable fail_msg : string;',
      '    procedure check_eq(',
      '      actual : in std_logic;',
      '      expected : in std_logic;',
      '      msg_name : in string(1 to 32)',
      '    ) is',
      '    begin',
      '      if actual /= expected then',
      '        report msg_name severity error;',
      '      end if;',
      '    end procedure check_eq;',
      '  begin',
      '    fail_msg := "FAIL";',
      '    check_eq(\'0\', \'0\', "ok");',
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['tb/tb_router.vhd']);
  const codes = new Set(details.map((detail) => detail.code));

  assert.ok(codes.has('tb_unconstrained_string_variable'));
  assert.ok(codes.has('tb_string_formal_actual_constraint_mismatch'));
});

test('detectKnownVhdlAntiPatternDetails flags malformed helper formal syntax before GHDL', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-malformed-formals-'));
  const tbPath = path.join(root, 'tb');
  await fs.mkdir(tbPath, { recursive: true });

  await fs.writeFile(
    path.join(tbPath, 'tb_bridge.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity tb_bridge is',
      'end entity;',
      '',
      'architecture sim of tb_bridge is',
      "  signal test_failed : std_logic := '0';",
      'begin',
      '  stimulus : process',
      '    procedure mark_fail(',
      '      msg_name : in string;',
      '      inout test_failed_io : inout std_logic',
      '    ) is',
      '    begin',
      "      test_failed_io <= '1';",
      '      report msg_name severity error;',
      '    end procedure mark_fail;',
      '  begin',
      '    mark_fail("boom", test_failed);',
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['tb/tb_bridge.vhd']);
  const malformedFormal = details.find((detail) => detail.code === 'invalid_subprogram_formal_syntax');

  assert.ok(malformedFormal);
  assert.equal(malformedFormal?.category, 'interface_generic_port_syntax');
  assert.match(malformedFormal?.message || '', /malformed formal clause/i);
  assert.match(malformedFormal?.forbiddenConstruct || '', /inout test_failed_io : inout std_logic/i);
});

test('detectKnownVhdlAntiPatternDetails flags clock-edge helpers that use non-signal formals', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-clock-edge-formal-'));
  const tbPath = path.join(root, 'tb');
  await fs.mkdir(tbPath, { recursive: true });

  await fs.writeFile(
    path.join(tbPath, 'tb_edge_helper.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity tb_edge_helper is',
      'end entity;',
      '',
      'architecture sim of tb_edge_helper is',
      'begin',
      '  stimulus : process',
      '    procedure wait_clk(clk : in std_logic) is',
      '    begin',
      '      wait until rising_edge(clk);',
      '    end procedure wait_clk;',
      '  begin',
      "    wait_clk('0');",
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['tb/tb_edge_helper.vhd']);
  const failure = details.find((detail) => detail.code === 'clock_edge_helper_requires_signal_formal');

  assert.ok(failure);
  assert.equal(failure?.category, 'interface_generic_port_syntax');
  assert.match(failure?.message || '', /rising_edge/i);
  assert.match(failure?.legalReplacementPattern || '', /signal clk : in std_logic/i);
});

test('detectKnownVhdlAntiPatternDetails returns machine-readable metadata for phase 2 core legality failures', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-phase2-details-'));
  const srcPath = path.join(root, 'src');
  await fs.mkdir(srcPath, { recursive: true });

  await fs.writeFile(
    path.join(srcPath, 'phase2_bad.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity phase2_bad is',
      '  port (',
      '    bad_i => in std_logic',
      '  );',
      'end entity phase2_bad.vhd;',
      '',
      'architecture rtl of phase2_bad is',
      '  type alu_op_t is (GOOD, XOR);',
      '  signal result_s : std_logic := \'0\' after "bad" element text;',
      'begin',
      "  process(all) begin report 4'b0001; end process;",
      '  process(all) begin result_s <= xnor a, b; end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['src/phase2_bad.vhd']);
  const codes = new Set(details.map((detail) => detail.code));

  assert.ok(codes.has('reserved_identifier'));
  assert.ok(codes.has('interface_arrow_syntax'));
  assert.ok(codes.has('natural_language_leakage'));
  assert.ok(codes.has('end_statement_file_extension'));
  assert.ok(codes.has('verilog_style_literal'));
  assert.ok(codes.has('illegal_prefix_operator_form'));
});

test('detectKnownVhdlAntiPatternDetails returns machine-readable metadata for phase 3 numeric and type discipline failures', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-phase3-details-'));
  const srcPath = path.join(root, 'src');
  await fs.mkdir(srcPath, { recursive: true });

  await fs.writeFile(
    path.join(srcPath, 'phase3_bad.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity phase3_bad is end entity;',
      'architecture rtl of phase3_bad is',
      '  signal a_slv : std_logic_vector(7 downto 0);',
      '  signal b_slv : std_logic_vector(7 downto 0);',
      '  signal idx_slv : std_logic_vector(2 downto 0);',
      '  signal scalar_slv : std_logic;',
      '  signal left_u : unsigned(7 downto 0);',
      '  signal helper_result : unsigned(7 downto 0);',
      '  signal range_target : unsigned(7 downto 0);',
      '  signal bits_sig : natural := "11";',
      '  function use_unsigned(value_u : unsigned) return unsigned is',
      '  begin',
      '    return value_u;',
      '  end function;',
      'begin',
      '  process(all)',
      '  begin',
      '    left_u <= not a_slv;',
      '    helper_result <= use_unsigned(a_slv);',
      "    if a_slv and b_slv = 0 then report \"bad\"; end if;",
      '    range_target <= resize(a_slv, range_target\'range);',
      '    helper_result <= a_slv and b_slv;',
      '    scalar_slv <= std_logic(to_integer(idx_slv));',
      '    helper_result <= shift_left(a_slv, 1);',
      '    helper_result <= helper_result;',
      '    report integer\'image(to_integer(a_slv));',
      '    report integer\'image(to_integer(unsigned(idx_slv)));',
      '    report integer\'image(to_integer(unsigned(a_slv(idx_slv))));',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['src/phase3_bad.vhd']);
  const codes = new Set(details.map((detail) => detail.code));

  assert.ok(codes.has('illegal_numeric_logical_hybrid'));
  assert.ok(codes.has('resize_on_raw_std_logic_vector'));
  assert.ok(codes.has('resize_with_range_attribute'));
  assert.ok(codes.has('to_integer_on_raw_logic_type'));
  assert.ok(codes.has('typed_bitwise_mismatch'));
  assert.ok(codes.has('typed_unary_mismatch'));
  assert.ok(codes.has('typed_helper_actual_mismatch'));
  assert.ok(codes.has('scalar_bit_string_assignment'));
  assert.ok(codes.has('runtime_bound_check_risk'));
});

test('detectKnownVhdlAntiPatternDetails flags typed helper mismatches for named associations and slices', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-typed-helper-actuals-'));
  const srcPath = path.join(root, 'src');
  await fs.mkdir(srcPath, { recursive: true });

  await fs.writeFile(
    path.join(srcPath, 'helper_actuals_bad.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity helper_actuals_bad is end entity;',
      '',
      'architecture rtl of helper_actuals_bad is',
      '  signal a_slv : std_logic_vector(7 downto 0);',
      '  signal b_slv : std_logic_vector(7 downto 0);',
      '  signal helper_result : unsigned(7 downto 0);',
      '  function use_unsigned(lhs : unsigned; rhs : unsigned) return unsigned is',
      '  begin',
      '    return lhs + rhs;',
      '  end function;',
      'begin',
      '  process(all)',
      '  begin',
      '    helper_result <= use_unsigned(lhs => a_slv, rhs => b_slv(7 downto 0));',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['src/helper_actuals_bad.vhd']);
  const helperMismatch = details.find((detail) => detail.code === 'typed_helper_actual_mismatch');

  assert.ok(helperMismatch);
  assert.match(helperMismatch.message, /"a_slv"/);
  assert.match(helperMismatch.message, /unsigned formal parameter #1/i);
});

test('detectKnownVhdlAntiPatternDetails flags unsafe raw logic-vector testbench indexing before runtime', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-unsafe-indexing-'));
  const tbPath = path.join(root, 'tb');
  await fs.mkdir(tbPath, { recursive: true });

  await fs.writeFile(
    path.join(tbPath, 'tb_indexing.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity tb_indexing is',
      'end entity;',
      '',
      'architecture sim of tb_indexing is',
      '  type mem_t is array (0 to 15) of std_logic_vector(7 downto 0);',
      '  signal rom : mem_t := (others => (others => \'0\'));',
      '  signal addr_slv : std_logic_vector(3 downto 0);',
      '  signal data_o : std_logic_vector(7 downto 0);',
      'begin',
      '  data_o <= rom(to_integer(unsigned(addr_slv)));',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['tb/tb_indexing.vhd']);
  const failure = details.find((detail) => detail.code === 'tb_unguarded_logic_index_conversion');

  assert.ok(failure);
  assert.equal(failure?.category, 'runtime_bound_risk');
  assert.match(failure?.message || '', /direct array indexing/i);
  assert.match(failure?.legalReplacementPattern || '', /tb_safe_slv_to_index/i);
});

test('detectKnownVhdlAntiPatternDetails flags std_logic_vector function returns assigned into typed destinations', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-typed-helper-returns-'));
  const srcPath = path.join(root, 'src');
  await fs.mkdir(srcPath, { recursive: true });

  await fs.writeFile(
    path.join(srcPath, 'helper_return_bad.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity helper_return_bad is end entity;',
      '',
      'architecture rtl of helper_return_bad is',
      '  signal a_slv : std_logic_vector(7 downto 0);',
      '  signal b_slv : std_logic_vector(7 downto 0);',
      '  signal result_u : unsigned(7 downto 0);',
      '  function alu_execute(lhs : unsigned; rhs : unsigned) return std_logic_vector is',
      '  begin',
      '    return std_logic_vector(lhs + rhs);',
      '  end function;',
      'begin',
      '  process(all)',
      '  begin',
      '    result_u <= alu_execute(unsigned(a_slv), unsigned(b_slv));',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['src/helper_return_bad.vhd']);
  const functionReturnMismatch = details.find((detail) => detail.code === 'typed_function_result_mismatch');

  assert.ok(functionReturnMismatch);
  assert.match(functionReturnMismatch.message, /assigns std_logic_vector function result/i);
  assert.match(functionReturnMismatch.message, /into unsigned destination "result_u"/i);
});

test('detectKnownVhdlAntiPatternDetails returns machine-readable metadata for phase 4 imports, package, array, and subtype safety', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-phase4-details-'));
  const srcPath = path.join(root, 'src');
  await fs.mkdir(srcPath, { recursive: true });

  await fs.writeFile(
    path.join(srcPath, 'phase4_bad.vhd'),
    [
      'package phase4_bad is',
      '  type operation_code_t is natural range 0 to 7;',
      '  type lane_matrix_t is array (0 to 1) of std_logic_vector(3 downto 0);',
      '  subtype lane_alias_t is lane_matrix_t(0 to 1);',
      '  constant lane_zero_u : unsigned(3 downto 0) := "0000";',
      '  procedure helper is',
      '  begin',
      '    null;',
      '  end procedure;',
      'end package;',
      '',
      'entity phase4_top is',
      '  port (',
      '    data_i : in std_logic_vector(DATA_WIDTH - 1 downto 0)',
      '  );',
      'end entity;',
      '',
      'architecture rtl of phase4_top is',
      '  signal regs : array (0 to 1) of unsigned(7 downto 0);',
      '  signal lanes : std_logic_vector(7 downto 0)(3 downto 0);',
      'begin',
      '  signal temp_s : std_logic;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['src/phase4_bad.vhd']);
  const codes = new Set(details.map((detail) => detail.code));

  assert.ok(codes.has('missing_std_logic_1164_clause'));
  assert.ok(codes.has('missing_numeric_std_clause'));
  assert.ok(codes.has('illegal_multidimensional_logic_vector'));
  assert.ok(codes.has('anonymous_array_object_declaration'));
  assert.ok(codes.has('reconstrained_subtype_alias'));
  assert.ok(codes.has('subprogram_body_inside_package_declaration'));
  assert.ok(codes.has('undeclared_interface_dimension_reference'));
  assert.ok(codes.has('illegal_scalar_type_alias'));
  assert.ok(codes.has('executable_region_signal_declaration'));
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

test('detectKnownVhdlAntiPatterns flags assignment operator inside boolean conditions', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-condition-assignment-'));
  const sourcePath = path.join(root, 'tb');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'tb_cpu_core.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity tb_cpu_core is end entity;',
      'architecture sim of tb_cpu_core is',
      '  signal mem_rdata_i : std_logic_vector(7 downto 0);',
      'begin',
      '  mem_bind : process',
      '    variable addr_int : integer;',
      '  begin',
      '    addr_int := 3;',
      '    if addr_int >= 0 and addr_int := 15 then',
      '      mem_rdata_i <= (others => \'0\');',
      '    end if;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['tb/tb_cpu_core.vhd']);
  const conditionMisuse = details.find((detail) => detail.code === 'conditional_assignment_operator_misuse');

  assert.ok(conditionMisuse);
  assert.equal(conditionMisuse.category, 'signal_variable_assignment_misuse');
  assert.match(conditionMisuse.message, /uses variable assignment operator ":=" inside a boolean condition/i);
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

test('detectKnownVhdlAntiPatterns flags leaked repair/meta commentary inside VHDL source', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-repair-meta-'));
  const sourcePath = path.join(root, 'src');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'alu.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity alu is end entity;',
      'architecture rtl of alu is',
      'begin',
      '  REPAIRED: changed signal typing after validator feedback',
      '  ### Updated file summary',
      '  process(all) begin null; end process;',
      'end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );

  const details = await detectKnownVhdlAntiPatternDetails(root, ['src/alu.vhd']);
  const repairLeak = details.find((detail) => detail.code === 'natural_language_leakage');

  assert.ok(repairLeak);
  assert.match(repairLeak?.message || '', /repair\/meta commentary/i);
  assert.match(repairLeak?.legalReplacementPattern || '', /never emit markdown headings, bullets, or repair labels/i);
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
        topTestbench: '',
        runCommands: [],
        expectedResult: 'PASS',
      },
      qualityChecklist: [],
    },
  });

  assert.ok(findings.some((detail) => detail.code === 'missing_ghdl_command_contract'));
  assert.ok(!findings.some((detail) => detail.code === 'missing_waveform_generation_contract'));
  assert.ok(findings.some((detail) => detail.code === 'invalid_source_order_contract'));
});

test('validateGeneratedProjectContracts accepts synthesized FPGA Architect command plans when analysis_order and top_testbench are present', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-vhdl-synthesized-command-contract-'));
  const sourcePath = path.join(root, 'src');
  const tbPath = path.join(root, 'tb');
  await fs.mkdir(sourcePath, { recursive: true });
  await fs.mkdir(tbPath, { recursive: true });
  await fs.writeFile(
    path.join(sourcePath, 'top.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity top is end entity;',
      'architecture rtl of top is begin end architecture;',
      '',
    ].join('\n'),
    'utf8',
  );
  await fs.writeFile(
    path.join(tbPath, 'tb_top.vhd'),
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity tb_top is end entity;',
      'architecture sim of tb_top is begin end architecture;',
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
        dependencies: [],
        isTestbench: false,
      },
      {
        path: 'tb/tb_top.vhd',
        entities: ['tb_top'],
        packages: [],
        packageBodies: [],
        dependencies: [],
        isTestbench: true,
      },
    ],
    topEntities: ['tb_top'],
    architectProject: {
      projectName: 'top',
      sanitizedProjectName: 'top',
      topEntity: 'top',
      vhdlStandard: 'VHDL-2008',
      targetFpga: null,
      summary: '',
      assumptions: [],
      warnings: [],
      folderTree: '',
      files: [],
      ghdl: {
        analysisOrder: ['src/top.vhd', 'tb/tb_top.vhd'],
        topTestbench: 'tb_top',
        runCommands: [],
        expectedResult: 'PASS',
      },
      qualityChecklist: [],
    },
  });

  assert.ok(!findings.some((detail) => detail.code === 'missing_ghdl_command_contract'));
  assert.ok(!findings.some((detail) => detail.code === 'missing_waveform_generation_contract'));
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
