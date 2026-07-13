import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { applyDeterministicGeneratedCodeRepairs } from '../src/server/deterministicGeneratedCodeRepair';
import { buildGeneratedCodeRepairPrompt, type RepairableGeneratedFile } from '../src/server/generatedCodeRepair';
import type { GeneratedVhdlFailureDetail, GeneratedVhdlValidationResult } from '../src/server/generatedVhdlValidation';

async function createRepairableFile(relativePath: string, content: string): Promise<RepairableGeneratedFile> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-deterministic-fix-'));
  const absolutePath = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, 'utf8');
  return {
    absolutePath,
    relativePath,
    kind: 'module',
    content,
  };
}

function createValidation(...details: GeneratedVhdlFailureDetail[]): GeneratedVhdlValidationResult {
  const [firstDetail] = details;
  if (!firstDetail) {
    throw new Error('createValidation requires at least one failure detail');
  }
  return {
    ok: false,
    stage: 'prevalidate',
    summary: firstDetail.message,
    logs: details.map((detail) => detail.message),
    validatedTopEntities: [],
    failureCode: firstDetail.code,
    failureCategory: firstDetail.category,
    failureDetails: details,
  };
}

test('deterministic fixer converts plain architecture-body variables into shared variables', async () => {
  const file = await createRepairableFile(
    'tb/alu_tb.vhd',
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
      '  process begin wait; end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'architecture_body_variable',
      category: 'declaration_scope',
      message: 'tb/alu_tb.vhd: declares plain architecture-body variable "pass_count".',
      excerpt: 'plain architecture-body variable "pass_count"',
      relativePath: 'tb/alu_tb.vhd',
      forbiddenConstruct: 'plain architecture-body variable "pass_count" (testbench_bookkeeping)',
      legalReplacementPattern: 'replace "pass_count" with a signal for sampled state, or use a shared variable only for deliberate shared testbench bookkeeping',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.ok(result.appliedCodes.includes('architecture_body_variable'));
  assert.match(result.repairedFiles[0].content, /shared variable pass_count : integer := 0;/i);
});

test('deterministic fixer hoists architecture-body scratch variables into a sole process declarative region', async () => {
  const file = await createRepairableFile(
    'src/alu.vhd',
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
      '  process(all) begin null; end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'architecture_body_variable',
      category: 'declaration_scope',
      message: 'src/alu.vhd: declares plain architecture-body variable "temp_sum".',
      excerpt: 'plain architecture-body variable "temp_sum"',
      relativePath: 'src/alu.vhd',
      forbiddenConstruct: 'plain architecture-body variable "temp_sum" (process_local_scratch)',
      legalReplacementPattern: 'move "temp_sum" into the nearest process/subprogram declarative region as a local variable unless persistent shared state is truly required',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.deepEqual(result.appliedCodes, ['architecture_body_variable']);
  assert.match(result.repairedFiles[0].content, /architecture rtl of alu is\s+begin/is);
  assert.match(result.repairedFiles[0].content, /process\(all\)\s+    variable temp_sum : integer := 0;\s+begin/is);
  assert.doesNotMatch(result.repairedFiles[0].content, /\bshared variable temp_sum : integer := 0;/i);
});

test('deterministic fixer converts persistent architecture-body logic variables into signals and normalizes assignments', async () => {
  const file = await createRepairableFile(
    'src/alu.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity alu is',
      'end entity;',
      '',
      'architecture rtl of alu is',
      '  variable result_out : unsigned(7 downto 0) := (others => \'0\');',
      'begin',
      '  process(all)',
      '  begin',
      '    result_out := unsigned(a_slv) + unsigned(b_slv);',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'architecture_body_variable',
      category: 'declaration_scope',
      message: 'src/alu.vhd: declares plain architecture-body variable "result_out".',
      excerpt: 'plain architecture-body variable "result_out"',
      relativePath: 'src/alu.vhd',
      forbiddenConstruct: 'plain architecture-body variable "result_out" (persistent_signal_intent)',
      legalReplacementPattern: 'replace "result_out" with a signal if persistent state is intended, or move it into a process-local variable if it is only temporary scratch state',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.deepEqual(result.appliedCodes, ['architecture_body_variable']);
  assert.match(result.repairedFiles[0].content, /\bsignal result_out : unsigned\(7 downto 0\) := \(others => '0'\);/i);
  assert.match(result.repairedFiles[0].content, /\bresult_out <= unsigned\(a_slv\) \+ unsigned\(b_slv\);/i);
  assert.doesNotMatch(result.repairedFiles[0].content, /\bresult_out := unsigned\(a_slv\) \+ unsigned\(b_slv\);/i);
});

test('deterministic fixer hoists signals to architecture scope and constants to process declarative scope', async () => {
  const file = await createRepairableFile(
    'src/alu.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity alu is',
      'end entity;',
      '',
      'architecture rtl of alu is',
      'begin',
      '  process(all)',
      '  begin',
      '    signal s_add : std_logic;',
      '    constant OP_ADD : integer := 1;',
      '    null;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const execSignalFix = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'executable_region_signal_declaration',
      category: 'declaration_scope',
      message: 'src/alu.vhd: declares signal "s_add" inside an executable region after "begin".',
      excerpt: 'signal declaration for "s_add" after begin',
      relativePath: 'src/alu.vhd',
      forbiddenConstruct: 'signal declaration for "s_add" after begin',
      legalReplacementPattern: 'declare before begin',
    }),
    availableFiles: [file],
  });

  const constantFix = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'declaration_after_begin',
      category: 'declaration_scope',
      message: 'src/alu.vhd: declares constant "OP_ADD" inside an executable region after "begin".',
      excerpt: 'constant declaration for "OP_ADD" after begin',
      relativePath: 'src/alu.vhd',
      forbiddenConstruct: 'constant declaration for "OP_ADD" after begin',
      legalReplacementPattern: 'move before begin',
    }),
    availableFiles: execSignalFix.repairedFiles,
  });

  assert.equal(constantFix.changed, true);
  assert.match(constantFix.repairedFiles[0].content, /architecture rtl of alu is\s+  signal s_add : std_logic;\s+begin/is);
  assert.match(constantFix.repairedFiles[0].content, /process\(all\)\s+    constant OP_ADD : integer := 1;\s+begin/is);
  assert.doesNotMatch(constantFix.repairedFiles[0].content, /process\(all\)\s+begin[\s\S]*signal s_add : std_logic;/i);
  assert.doesNotMatch(constantFix.repairedFiles[0].content, /process\(all\)\s+begin[\s\S]*constant OP_ADD : integer := 1;/i);
});

test('deterministic fixer hoists full function blocks from executable regions into the nearest process declarative region', async () => {
  const file = await createRepairableFile(
    'tb/tb_axi_stream_router.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity tb_axi_stream_router is',
      'end entity;',
      '',
      'architecture sim of tb_axi_stream_router is',
      'begin',
      '  process',
      '  begin',
      '    function to_slv(value : integer) return std_logic_vector is',
      '    begin',
      '      return std_logic_vector(to_unsigned(value, 8));',
      '    end function;',
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'declaration_after_begin',
      category: 'declaration_scope',
      message: 'tb/tb_axi_stream_router.vhd: declares function "to_slv" inside an executable region after "begin".',
      excerpt: 'function declaration for "to_slv" after begin',
      relativePath: 'tb/tb_axi_stream_router.vhd',
      forbiddenConstruct: 'function declaration for "to_slv" after begin',
      legalReplacementPattern: 'move "to_slv" into an enclosing declarative region before begin',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.match(result.repairedFiles[0].content, /process\s+    function to_slv\(value : integer\) return std_logic_vector is\s+      begin\s+        return std_logic_vector\(to_unsigned\(value, 8\)\);\s+      end function;\s+begin/is);
  assert.doesNotMatch(result.repairedFiles[0].content, /process\s+begin\s+[\s\S]*function to_slv\(value : integer\) return std_logic_vector is/i);
});

test('deterministic fixer ignores commented function names when hoisting the real subprogram block', async () => {
  const file = await createRepairableFile(
    'tb/tb_axi_stream_router.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity tb_axi_stream_router is',
      'end entity;',
      '',
      'architecture sim of tb_axi_stream_router is',
      'begin',
      '  process',
      '  begin',
      "    -- REPAIRED: Moved function declaration before 'function to_slv' after validator feedback",
      '    function to_slv(value : integer) return std_logic_vector is',
      '    begin',
      '      return std_logic_vector(to_unsigned(value, 8));',
      '    end function;',
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'declaration_after_begin',
      category: 'declaration_scope',
      message: 'tb/tb_axi_stream_router.vhd: declares function "to_slv" inside an executable region after "begin".',
      excerpt: 'function declaration for "to_slv" after begin',
      relativePath: 'tb/tb_axi_stream_router.vhd',
      forbiddenConstruct: 'function declaration for "to_slv" after begin',
      legalReplacementPattern: 'move "to_slv" into an enclosing declarative region before begin',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.match(result.repairedFiles[0].content, /process\s+    function to_slv\(value : integer\) return std_logic_vector is\s+      begin/is);
  assert.doesNotMatch(result.repairedFiles[0].content, /function to_slv' after validator feedback/i);
  assert.doesNotMatch(result.repairedFiles[0].content, /process\s+begin\s+[\s\S]*function to_slv\(value : integer\) return std_logic_vector is/i);
});

test('deterministic fixer hoists full procedure blocks from executable regions into the nearest process declarative region', async () => {
  const file = await createRepairableFile(
    'tb/tb_dsp_chain.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity tb_dsp_chain is',
      'end entity;',
      '',
      'architecture sim of tb_dsp_chain is',
      'begin',
      '  process',
      '  begin',
      '    procedure check_eq(actual : integer; expected : integer) is',
      '    begin',
      '      assert actual = expected report "mismatch" severity failure;',
      '    end procedure;',
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'declaration_after_begin',
      category: 'declaration_scope',
      message: 'tb/tb_dsp_chain.vhd: declares procedure "check_eq" inside an executable region after "begin".',
      excerpt: 'procedure declaration for "check_eq" after begin',
      relativePath: 'tb/tb_dsp_chain.vhd',
      forbiddenConstruct: 'procedure declaration for "check_eq" after begin',
      legalReplacementPattern: 'move "check_eq" into an enclosing declarative region before begin',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.match(result.repairedFiles[0].content, /process[\s\S]*procedure check_eq\(actual : integer; expected : integer\) is[\s\S]*assert actual = expected report "mismatch" severity failure;[\s\S]*end procedure;\s+begin/is);
  assert.doesNotMatch(result.repairedFiles[0].content, /process\s+begin\s+[\s\S]*procedure check_eq\(actual : integer; expected : integer\) is/i);
});

test('deterministic fixer moves an architecture-body scratch variable into the one process that actually uses it', async () => {
  const file = await createRepairableFile(
    'tb/tb_bridge.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity tb_bridge is',
      'end entity;',
      '',
      'architecture sim of tb_bridge is',
      '  variable local_res : integer := 0;',
      'begin',
      '  clk_gen : process',
      '  begin',
      '    wait;',
      '  end process;',
      '',
      '  stim_proc : process',
      '  begin',
      '    local_res := local_res + 1;',
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'architecture_body_variable',
      category: 'declaration_scope',
      message: 'tb/tb_bridge.vhd: declares plain architecture-body variable "local_res".',
      excerpt: 'plain architecture-body variable "local_res"',
      relativePath: 'tb/tb_bridge.vhd',
      forbiddenConstruct: 'plain architecture-body variable "local_res" (process_local_scratch)',
      legalReplacementPattern: 'move "local_res" into the nearest process/subprogram declarative region as a local variable unless persistent shared state is truly required',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.match(result.repairedFiles[0].content, /stim_proc : process\s+    variable local_res : integer := 0;\s+begin/is);
  assert.doesNotMatch(result.repairedFiles[0].content, /architecture sim of tb_bridge is\s+  variable local_res : integer := 0;/is);
  assert.doesNotMatch(result.repairedFiles[0].content, /clk_gen : process\s+    variable local_res : integer := 0;\s+begin/is);
});

test('deterministic fixer repairs combined declaration-scope issues from one file in a single pass', async () => {
  const file = await createRepairableFile(
    'tb/tb_combo.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity tb_combo is',
      'end entity;',
      '',
      'architecture sim of tb_combo is',
      '  variable sample_count : integer := 0;',
      'begin',
      '  process',
      '  begin',
      '    procedure check_eq(actual : integer; expected : integer) is',
      '    begin',
      '      assert actual = expected report "mismatch" severity failure;',
      '    end procedure;',
      '    sample_count := sample_count + 1;',
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const validation: GeneratedVhdlValidationResult = {
    ok: false,
    stage: 'prevalidate',
    summary: 'combined declaration-scope issues',
    logs: ['combined declaration-scope issues'],
    validatedTopEntities: [],
    failureCode: 'architecture_body_variable',
    failureCategory: 'declaration_scope',
    failureDetails: [
      {
        code: 'architecture_body_variable',
        category: 'declaration_scope',
        message: 'tb/tb_combo.vhd: declares plain architecture-body variable "sample_count".',
        excerpt: 'plain architecture-body variable "sample_count"',
        relativePath: 'tb/tb_combo.vhd',
        forbiddenConstruct: 'plain architecture-body variable "sample_count" (process_local_scratch)',
        legalReplacementPattern: 'move "sample_count" into the nearest process/subprogram declarative region as a local variable unless persistent shared state is truly required',
      },
      {
        code: 'declaration_after_begin',
        category: 'declaration_scope',
        message: 'tb/tb_combo.vhd: declares procedure "check_eq" inside an executable region after "begin".',
        excerpt: 'procedure declaration for "check_eq" after begin',
        relativePath: 'tb/tb_combo.vhd',
        forbiddenConstruct: 'procedure declaration for "check_eq" after begin',
        legalReplacementPattern: 'move "check_eq" into an enclosing declarative region before begin',
      },
    ],
  };

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation,
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.match(
    result.repairedFiles[0].content,
    /process[\s\S]*variable sample_count : integer := 0;[\s\S]*procedure check_eq\(actual : integer; expected : integer\) is[\s\S]*end procedure;[\s\S]*begin/is,
  );
  assert.doesNotMatch(result.repairedFiles[0].content, /architecture sim of tb_combo is\s+  variable sample_count : integer := 0;/is);
  assert.doesNotMatch(result.repairedFiles[0].content, /process\s+begin\s+[\s\S]*procedure check_eq/i);
});

test('deterministic fixer hoists constant declarations to the nearest process declarative region', async () => {
  const file = await createRepairableFile(
    'tb/tb_uart_bridge.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity tb_uart_bridge is',
      'end entity;',
      '',
      'architecture sim of tb_uart_bridge is',
      'begin',
      '  process',
      '  begin',
      '    constant SAMPLE_COUNT : integer := 4;',
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'declaration_after_begin',
      category: 'declaration_scope',
      message: 'tb/tb_uart_bridge.vhd: declares constant "SAMPLE_COUNT" inside an executable region after "begin".',
      excerpt: 'constant SAMPLE_COUNT : integer := 4;',
      relativePath: 'tb/tb_uart_bridge.vhd',
      forbiddenConstruct: 'constant declaration for "SAMPLE_COUNT" after begin',
      legalReplacementPattern: 'move "SAMPLE_COUNT" into an enclosing declarative region before begin',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.match(result.repairedFiles[0].content, /process\s+  constant SAMPLE_COUNT : integer := 4;\s+begin/i);
  assert.doesNotMatch(result.repairedFiles[0].content, /process\s+begin\s+[\s\S]*constant SAMPLE_COUNT : integer := 4;/i);
});

test('deterministic fixer rewrites anonymous array object declarations into named array types', async () => {
  const file = await createRepairableFile(
    'src/cpu_core.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity cpu_core is',
      'end entity;',
      '',
      'architecture rtl of cpu_core is',
      '  signal regs : array(reg_idx_t range 0 to 7) of data_t := (others => (others => \'0\'));',
      'begin',
      '  null;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'anonymous_array_object_declaration',
      category: 'array_subtype_misuse',
      message: 'src/cpu_core.vhd: uses anonymous array(...) of ... syntax directly in an object declaration.',
      excerpt: 'signal regs : array(reg_idx_t range 0 to 7) of data_t := ...;',
      relativePath: 'src/cpu_core.vhd',
      forbiddenConstruct: 'anonymous object declaration that uses array(...) of ... directly in a signal/variable declaration',
      legalReplacementPattern: 'declare a named array type or subtype first, then declare the object using that named type instead of inline array(...) syntax',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.deepEqual(result.appliedCodes, ['anonymous_array_object_declaration']);
  assert.match(result.repairedFiles[0].content, /\btype regs_t is array\(reg_idx_t range 0 to 7\) of data_t;/i);
  assert.match(result.repairedFiles[0].content, /\bsignal regs : regs_t\s*:=\s*\(others => \(others => '0'\)\);/i);
  assert.doesNotMatch(result.repairedFiles[0].content, /\bsignal regs : array\(reg_idx_t range 0 to 7\) of data_t/i);
});

test('deterministic fixer hoists helper procedures to the nearest subprogram declarative region', async () => {
  const file = await createRepairableFile(
    'src/pkg_bridge.vhd',
    [
      'package body pkg_bridge is',
      '  function build_word return integer is',
      '  begin',
      '    procedure note_word is',
      '    begin',
      '      null;',
      '    end procedure;',
      '    note_word;',
      '    return 1;',
      '  end function build_word;',
      'end package body pkg_bridge;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'declaration_after_begin',
      category: 'declaration_scope',
      message: 'src/pkg_bridge.vhd: declares procedure "note_word" inside an executable region after "begin".',
      excerpt: 'procedure note_word is',
      relativePath: 'src/pkg_bridge.vhd',
      forbiddenConstruct: 'procedure declaration for "note_word" after begin',
      legalReplacementPattern: 'move "note_word" into an enclosing declarative region before begin',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.match(result.repairedFiles[0].content, /function build_word return integer is\s+  procedure note_word is[\s\S]*?end procedure;\s+begin/i);
  assert.doesNotMatch(result.repairedFiles[0].content, /\bbegin\b[\s\S]*procedure note_word is/i);
});

test('deterministic fixer splits subprogram bodies out of package declarations', async () => {
  const file = await createRepairableFile(
    'src/alu_pkg.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'package alu_pkg is',
      '  function op_name return string is',
      '  begin',
      '    return "ADD";',
      '  end function;',
      'end package;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'subprogram_body_inside_package_declaration',
      category: 'package_type_definition',
      message: 'src/alu_pkg.vhd: places a subprogram body inside package declaration "alu_pkg".',
      excerpt: 'subprogram body inside package declaration "alu_pkg"',
      relativePath: 'src/alu_pkg.vhd',
      forbiddenConstruct: 'subprogram body inside package alu_pkg declaration',
      legalReplacementPattern: 'keep signature in package and move body into package body',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.match(result.repairedFiles[0].content, /package alu_pkg is[\s\S]*function op_name return string;[\s\S]*end package;/i);
  assert.match(result.repairedFiles[0].content, /package body alu_pkg is[\s\S]*function op_name return string is[\s\S]*return "ADD";[\s\S]*end function;[\s\S]*end package body alu_pkg;/i);
});

test('deterministic fixer splits package-declaration subprogram bodies with constrained return types', async () => {
  const file = await createRepairableFile(
    'src/vector_pkg.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'package vector_pkg is',
      '  function reset_word return std_logic_vector(7 downto 0) is',
      '  begin',
      '    return (others => \'0\');',
      '  end function;',
      'end package;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'subprogram_body_inside_package_declaration',
      category: 'package_type_definition',
      message: 'src/vector_pkg.vhd: places a subprogram body inside package declaration "vector_pkg".',
      excerpt: 'subprogram body inside package declaration "vector_pkg"',
      relativePath: 'src/vector_pkg.vhd',
      forbiddenConstruct: 'subprogram body inside package vector_pkg declaration',
      legalReplacementPattern: 'keep signature in package and move body into package body',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.match(result.repairedFiles[0].content, /package vector_pkg is[\s\S]*function reset_word return std_logic_vector\(7 downto 0\);[\s\S]*end package;/i);
  assert.match(result.repairedFiles[0].content, /package body vector_pkg is[\s\S]*function reset_word return std_logic_vector\(7 downto 0\) is[\s\S]*return \(others => '0'\);[\s\S]*end function;[\s\S]*end package body vector_pkg;/i);
});

test('deterministic fixer runs bundled package-body repair across sibling subprogram bodies from one reported detail', async () => {
  const file = await createRepairableFile(
    'src/bridge_pkg.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'package bridge_pkg is',
      '  function op_name return string is',
      '  begin',
      '    return "ADD";',
      '  end function;',
      '',
      '  procedure clear_flags is',
      '  begin',
      '    null;',
      '  end procedure;',
      'end package;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'subprogram_body_inside_package_declaration',
      category: 'package_type_definition',
      message: 'src/bridge_pkg.vhd: places a subprogram body inside package declaration "bridge_pkg".',
      excerpt: 'subprogram body inside package declaration "bridge_pkg"',
      relativePath: 'src/bridge_pkg.vhd',
      forbiddenConstruct: 'subprogram body inside package bridge_pkg declaration',
      legalReplacementPattern: 'keep signature in package and move body into package body',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.ok(result.appliedCodes.includes('subprogram_body_inside_package_declaration'));
  assert.match(result.repairedFiles[0].content, /package bridge_pkg is[\s\S]*function op_name return string;[\s\S]*procedure clear_flags;[\s\S]*end package;/i);
  assert.match(result.repairedFiles[0].content, /package body bridge_pkg is[\s\S]*function op_name return string is[\s\S]*return "ADD";[\s\S]*end function;[\s\S]*procedure clear_flags is[\s\S]*null;[\s\S]*end procedure;[\s\S]*end package body bridge_pkg;/i);
});

test('deterministic fixer runs bundled package-body repair across multiple package declarations in one file', async () => {
  const file = await createRepairableFile(
    'src/multi_pkg.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'package alpha_pkg is',
      '  function alpha_name return string is',
      '  begin',
      '    return "ALPHA";',
      '  end function;',
      'end package;',
      '',
      'package beta_pkg is',
      '  procedure beta_ping is',
      '  begin',
      '    null;',
      '  end procedure;',
      'end package;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'subprogram_body_inside_package_declaration',
      category: 'package_type_definition',
      message: 'src/multi_pkg.vhd: places a subprogram body inside package declaration "alpha_pkg".',
      excerpt: 'subprogram body inside package declaration "alpha_pkg"',
      relativePath: 'src/multi_pkg.vhd',
      forbiddenConstruct: 'subprogram body inside package alpha_pkg declaration',
      legalReplacementPattern: 'keep signature in package and move body into package body',
    }),
    availableFiles: [file],
  });

  const next = result.repairedFiles[0].content;
  assert.equal(result.changed, true);
  assert.ok(result.appliedCodes.includes('package_body_cluster'));
  assert.match(next, /package alpha_pkg is[\s\S]*function alpha_name return string;[\s\S]*end package;/i);
  assert.match(next, /package beta_pkg is[\s\S]*procedure beta_ping;[\s\S]*end package;/i);
  assert.match(next, /package body alpha_pkg is[\s\S]*function alpha_name return string is[\s\S]*return "ALPHA";[\s\S]*end function;[\s\S]*end package body alpha_pkg;/i);
  assert.match(next, /package body beta_pkg is[\s\S]*procedure beta_ping is[\s\S]*null;[\s\S]*end procedure;[\s\S]*end package body beta_pkg;/i);
});

test('deterministic fixer rewrites malformed interface declaration arrows into legal colons', async () => {
  const file = await createRepairableFile(
    'src/bridge.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity bridge is',
      '  port (',
      '    clk => in std_logic;',
      '    rst_n => in std_logic',
      '  );',
      'end entity;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'interface_arrow_syntax',
      category: 'interface_generic_port_syntax',
      message: 'src/bridge.vhd: uses association syntax inside an interface declaration.',
      excerpt: 'clk => in std_logic',
      relativePath: 'src/bridge.vhd',
      forbiddenConstruct: '=> inside entity/component interface declaration',
      legalReplacementPattern: 'use ":" between interface names and types/modes inside generic and port lists',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.deepEqual(result.appliedCodes, ['interface_arrow_syntax']);
  assert.match(result.repairedFiles[0].content, /\bclk\s*:\s*in std_logic;/i);
  assert.match(result.repairedFiles[0].content, /\brst_n\s*:\s*in std_logic/i);
});

test('deterministic fixer comments out natural-language leakage after a valid declaration expression', async () => {
  const file = await createRepairableFile(
    'src/notes_pkg.vhd',
    [
      'package notes_pkg is',
      '  constant STARTUP_DELAY_C : integer := 0 after "startup window" element is approximate;',
      'end package;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'natural_language_leakage',
      category: 'other',
      message: 'src/notes_pkg.vhd: contains natural-language prose inside a VHDL declaration.',
      excerpt: 'constant STARTUP_DELAY_C : integer := 0 after "startup window" element is approximate;',
      relativePath: 'src/notes_pkg.vhd',
      forbiddenConstruct: 'natural-language prose embedded in a VHDL declaration',
      legalReplacementPattern: 'keep prose only in VHDL comments after syntactically complete statements',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.deepEqual(result.appliedCodes, ['natural_language_leakage']);
  assert.match(result.repairedFiles[0].content, /\bconstant STARTUP_DELAY_C : integer := 0; -- after "startup window" element is approximate/i);
});

test('deterministic fixer comments out leaked repair/meta commentary lines inside VHDL source', async () => {
  const file = await createRepairableFile(
    'src/alu.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity alu is end entity;',
      'architecture rtl of alu is',
      'begin',
      '  REPAIRED: changed signal typing after validator feedback',
      '  ### Updated file summary',
      '  - FIXED reserved identifier',
      '  process(all) begin null; end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'natural_language_leakage',
      category: 'other',
      message: 'src/alu.vhd: contains repair/meta commentary inside VHDL source.',
      excerpt: 'REPAIRED: changed signal typing after validator feedback',
      relativePath: 'src/alu.vhd',
      forbiddenConstruct: 'repair/meta commentary embedded in VHDL source',
      legalReplacementPattern: 'keep any explanatory text only as VHDL comments starting with "--", and never emit markdown headings, bullets, or repair labels in source files',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.deepEqual(result.appliedCodes, ['natural_language_leakage']);
  assert.match(result.repairedFiles[0].content, /^\s*-- changed signal typing after validator feedback$/im);
  assert.match(result.repairedFiles[0].content, /^\s*-- Updated file summary$/im);
  assert.match(result.repairedFiles[0].content, /^\s*-- fixed: reserved identifier$/im);
});

test('deterministic fixer removes illegal file extensions from VHDL end statements', async () => {
  const file = await createRepairableFile(
    'src/alu_pkg.vhd',
    [
      'package alu_pkg is',
      '  constant ZERO_C : integer := 0;',
      'end package alu_pkg.vhd;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'end_statement_file_extension',
      category: 'package_type_definition',
      message: 'src/alu_pkg.vhd: ends a package with a file extension.',
      excerpt: 'end package alu_pkg.vhd;',
      relativePath: 'src/alu_pkg.vhd',
      forbiddenConstruct: 'end statement containing .vhd file suffix',
      legalReplacementPattern: 'end the design unit with only its identifier or a bare end statement',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.deepEqual(result.appliedCodes, ['end_statement_file_extension']);
  assert.match(result.repairedFiles[0].content, /\bend package alu_pkg;/i);
  assert.doesNotMatch(result.repairedFiles[0].content, /\bend package alu_pkg\.vhd;/i);
});

test('deterministic fixer swaps variable and signal assignment operators when the validator class is explicit', async () => {
  const file = await createRepairableFile(
    'src/alu.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity alu is',
      '  port (',
      '    clk : in std_logic;',
      '    done_o : out std_logic',
      '  );',
      'end entity;',
      '',
      'architecture rtl of alu is',
      '  signal done_reg : std_logic := \'0\';',
      'begin',
      '  process(all)',
      '    variable tmp_done : std_logic := \'0\';',
      '  begin',
      '    tmp_done <= \'1\';',
      '    done_reg := tmp_done;',
      '  end process;',
      '  done_o <= done_reg;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const variableFix = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'variable_assigned_with_signal_operator',
      category: 'signal_variable_assignment_misuse',
      message: 'src/alu.vhd: assigns variable "tmp_done" with "<=".',
      excerpt: 'variable "tmp_done" assigned with "<="',
      relativePath: 'src/alu.vhd',
      forbiddenConstruct: 'variable "tmp_done" assigned with "<="',
      legalReplacementPattern: 'use := for variable "tmp_done"',
    }),
    availableFiles: [file],
  });

  const signalFix = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'signal_assigned_with_variable_operator',
      category: 'signal_variable_assignment_misuse',
      message: 'src/alu.vhd: assigns signal "done_reg" with ":=".',
      excerpt: 'signal "done_reg" assigned with ":="',
      relativePath: 'src/alu.vhd',
      forbiddenConstruct: 'signal "done_reg" assigned with ":="',
      legalReplacementPattern: 'use <= for signal "done_reg"',
    }),
    availableFiles: variableFix.repairedFiles,
  });

  assert.equal(signalFix.changed, true);
  assert.match(signalFix.repairedFiles[0].content, /\btmp_done\s*:=\s*'1';/i);
  assert.match(signalFix.repairedFiles[0].content, /\bdone_reg\s*<=\s*tmp_done;/i);
});

test('deterministic fixer rewrites assignment operator misuse inside boolean bounds checks', async () => {
  const file = await createRepairableFile(
    'tb/tb_cpu_core.vhd',
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
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'conditional_assignment_operator_misuse',
      category: 'signal_variable_assignment_misuse',
      message: 'tb/tb_cpu_core.vhd: uses variable assignment operator ":=" inside a boolean condition.',
      excerpt: 'condition "addr_int >= 0 and addr_int := 15" contains "addr_int := 15"',
      relativePath: 'tb/tb_cpu_core.vhd',
      forbiddenConstruct: 'condition "addr_int >= 0 and addr_int := 15" contains "addr_int := 15"',
      legalReplacementPattern: 'replace "addr_int := 15" with "addr_int <= 15" for upper-bound checks',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.match(result.repairedFiles[0].content, /if addr_int >= 0 and addr_int <= 15 then/i);
  assert.doesNotMatch(result.repairedFiles[0].content, /if addr_int >= 0 and addr_int := 15 then/i);
});

test('deterministic fixer rewrites every assignment operator misuse inside conditions in the same file', async () => {
  const file = await createRepairableFile(
    'src/mini_cpu_core.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity mini_cpu_core is end entity;',
      'architecture rtl of mini_cpu_core is',
      'begin',
      '  p : process',
      '    variable idx_a : integer;',
      '    variable idx_b : integer;',
      '  begin',
      '    if idx_a >= 0 and idx_a := 255 then',
      '      idx_b := 1;',
      '    elsif idx_b := 3 then',
      '      idx_a := 0;',
      '    end if;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'conditional_assignment_operator_misuse',
      category: 'signal_variable_assignment_misuse',
      message: 'src/mini_cpu_core.vhd: uses variable assignment operator ":=" inside a boolean condition.',
      excerpt: 'condition "idx_a >= 0 and idx_a := 255" contains "idx_a := 255"',
      relativePath: 'src/mini_cpu_core.vhd',
      forbiddenConstruct: 'condition "idx_a >= 0 and idx_a := 255" contains "idx_a := 255"',
      legalReplacementPattern: 'replace assignment inside the condition with a comparison operator',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.match(result.repairedFiles[0].content, /if idx_a >= 0 and idx_a <= 255 then/i);
  assert.match(result.repairedFiles[0].content, /elsif idx_b = 3 then/i);
  assert.doesNotMatch(result.repairedFiles[0].content, /\b(?:if|elsif)\b[^\n;]*:=/i);
});

test('deterministic fixer preserves legal case branch variable assignments', async () => {
  const file = await createRepairableFile(
    'src/alu.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity alu is end entity;',
      'architecture rtl of alu is',
      '  type alu_op_t is (OP_AND, OP_OR);',
      'begin',
      '  p : process(all)',
      '    variable op : alu_op_t;',
      '    variable a_u : unsigned(7 downto 0);',
      '    variable b_u : unsigned(7 downto 0);',
      '    variable res_u : unsigned(7 downto 0);',
      '  begin',
      '    case op is',
      '      when OP_AND => res_u := a_u and b_u;',
      '      when OP_OR => res_u := a_u or b_u;',
      '    end case;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'conditional_assignment_operator_misuse',
      category: 'signal_variable_assignment_misuse',
      message: 'src/alu.vhd: uses variable assignment operator ":=" inside a boolean condition.',
      excerpt: 'case branches are not conditions',
      relativePath: 'src/alu.vhd',
      forbiddenConstruct: 'case branches are not conditions',
      legalReplacementPattern: 'do not rewrite legal case branch variable assignments',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, false);
  assert.match(result.repairedFiles[0].content, /when OP_AND => res_u := a_u and b_u;/);
  assert.match(result.repairedFiles[0].content, /when OP_OR => res_u := a_u or b_u;/);
});

test('deterministic fixer rewrites common output-port readback into an internal signal bridge', async () => {
  const file = await createRepairableFile(
    'src/uart_tx.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity uart_tx is',
      '  port (',
      '    tx_o : out std_logic;',
      '    enable_i : in std_logic',
      '  );',
      'end entity;',
      '',
      'architecture rtl of uart_tx is',
      'begin',
      '  process(all)',
      '  begin',
      '    if enable_i = \'1\' then',
      '      tx_o <= not tx_o;',
      '    else',
      '      tx_o <= \'1\';',
      '    end if;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'output_port_readback',
      category: 'numeric_std_type_discipline',
      message: 'src/uart_tx.vhd: appears to read back output port "tx_o".',
      excerpt: 'internal logic reading output port "tx_o"',
      relativePath: 'src/uart_tx.vhd',
      forbiddenConstruct: 'internal logic reading output port "tx_o"',
      legalReplacementPattern: 'use an internal signal/variable for the computed value and assign the out port from that internal object',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.deepEqual(result.appliedCodes, ['output_port_readback']);
  assert.match(result.repairedFiles[0].content, /architecture rtl of uart_tx is\s+  signal tx_o_int : std_logic;\s+begin/is);
  assert.match(result.repairedFiles[0].content, /\btx_o_int\s*<=\s*not\s+tx_o_int;/i);
  assert.match(result.repairedFiles[0].content, /\btx_o\s*<=\s*tx_o_int;/i);
});

test('deterministic fixer rewrites outer-scope procedure writes into explicit formal parameters and call-site actuals', async () => {
  const file = await createRepairableFile(
    'tb/alu_tb.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity alu_tb is',
      'end entity;',
      '',
      'architecture sim of alu_tb is',
      '  signal test_failed : std_logic := \'0\';',
      '  procedure mark_fail(msg_name : string) is',
      '  begin',
      '    test_failed <= \'1\';',
      '  end procedure;',
      'begin',
      '  process(all)',
      '  begin',
      '    mark_fail("boom");',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'procedure_outer_scope_write',
      category: 'declaration_scope',
      message: 'tb/alu_tb.vhd: procedure "mark_fail" assigns to outer-scope object "test_failed" without passing it as a formal parameter.',
      excerpt: 'procedure "mark_fail" assigns to outer-scope object "test_failed"',
      relativePath: 'tb/alu_tb.vhd',
      forbiddenConstruct: 'procedure "mark_fail" mutates outer-scope object "test_failed"',
      legalReplacementPattern: 'pass "test_failed" as a formal parameter or keep the mutable state local to the caller',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.ok(result.appliedCodes.includes('procedure_outer_scope_write'));
  assert.match(result.repairedFiles[0].content, /procedure mark_fail\(msg_name : string; signal test_failed_io : out std_logic\) is/i);
  assert.match(result.repairedFiles[0].content, /\btest_failed_io\s*<=\s*'1';/i);
  assert.match(result.repairedFiles[0].content, /\bmark_fail\("boom", test_failed\);/i);
});

test('deterministic fixer fully normalizes a helper declared after begin that also writes outer-scope state', async () => {
  const file = await createRepairableFile(
    'tb/tb_uart_spi_bridge.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity tb_uart_spi_bridge is',
      'end entity;',
      '',
      'architecture sim of tb_uart_spi_bridge is',
      "  signal fail_flag : std_logic := '0';",
      'begin',
      '  process',
      '  begin',
      '    procedure check_eq(actual : integer; expected : integer) is',
      '    begin',
      "      fail_flag <= '1';",
      '      assert actual = expected report "mismatch" severity failure;',
      '    end procedure;',
      '    check_eq(1, 2);',
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'declaration_after_begin',
      category: 'declaration_scope',
      message: 'tb/tb_uart_spi_bridge.vhd: declares procedure "check_eq" inside an executable region after "begin".',
      excerpt: 'procedure declaration for "check_eq" after begin',
      relativePath: 'tb/tb_uart_spi_bridge.vhd',
      forbiddenConstruct: 'procedure declaration for "check_eq" after begin',
      legalReplacementPattern: 'move "check_eq" into an enclosing declarative region before begin',
    }, {
      code: 'procedure_outer_scope_write',
      category: 'declaration_scope',
      message: 'tb/tb_uart_spi_bridge.vhd: procedure "check_eq" assigns to outer-scope object "fail_flag" without passing it as a formal parameter.',
      excerpt: 'procedure "check_eq" assigns to outer-scope object "fail_flag"',
      relativePath: 'tb/tb_uart_spi_bridge.vhd',
      forbiddenConstruct: 'procedure "check_eq" mutates outer-scope object "fail_flag"',
      legalReplacementPattern: 'pass "fail_flag" as a formal parameter or keep the mutable state local to the caller',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.match(result.repairedFiles[0].content, /process[\s\S]*procedure check_eq\(actual : integer; expected : integer; signal fail_flag_io : out std_logic\) is[\s\S]*?end procedure;\s+begin/is);
  assert.match(result.repairedFiles[0].content, /\bfail_flag_io\s*<=\s*'1';/i);
  assert.match(result.repairedFiles[0].content, /\bcheck_eq\(1, 2, fail_flag\);/i);
  assert.doesNotMatch(result.repairedFiles[0].content, /process\s+begin\s+[\s\S]*procedure check_eq/i);
});

test('deterministic fixer rewrites only the nested helper that owns the outer-scope write', async () => {
  const file = await createRepairableFile(
    'tb/tb_nested_scope.vhd',
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
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'procedure_outer_scope_write',
      category: 'declaration_scope',
      message: 'tb/tb_nested_scope.vhd: procedure "inner_proc" assigns to outer-scope object "fail_cnt" without passing it as a formal parameter.',
      excerpt: 'procedure "inner_proc" assigns to outer-scope object "fail_cnt"',
      relativePath: 'tb/tb_nested_scope.vhd',
      forbiddenConstruct: 'procedure "inner_proc" mutates outer-scope object "fail_cnt"',
      legalReplacementPattern: 'pass "fail_cnt" as a formal parameter or keep the mutable state local to the caller',
    }),
    availableFiles: [file],
  });

  const next = result.repairedFiles[0].content;
  assert.equal(result.changed, true);
  assert.ok(result.appliedCodes.includes('procedure_outer_scope_write'));
  assert.match(next, /procedure inner_proc\(step_value : integer; variable fail_cnt_io : inout integer\) is/i);
  assert.match(next, /\bfail_cnt_io\s*:=\s*fail_cnt_io\s*\+\s*step_value;/i);
  assert.match(next, /\binner_proc\(local_state, fail_cnt\);/i);
  assert.match(next, /procedure outer_proc is/i);
  assert.doesNotMatch(next, /procedure outer_proc\([^)]*fail_cnt/i);
});

test('deterministic fixer rewrites illegal scalar type aliases into legal subtypes', async () => {
  const file = await createRepairableFile(
    'src/alu_pkg.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'package alu_pkg is',
      '  type operation_code_t is integer range 0 to 7;',
      'end package;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'illegal_scalar_type_alias',
      category: 'package_type_definition',
      message: 'src/alu_pkg.vhd: declares constrained scalar alias "operation_code_t" with "type ... is integer range".',
      excerpt: 'type operation_code_t is integer range 0 to 7',
      relativePath: 'src/alu_pkg.vhd',
      forbiddenConstruct: '"type operation_code_t is integer range ..."',
      legalReplacementPattern: 'use "subtype operation_code_t is integer range ...;"',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.deepEqual(result.appliedCodes, ['illegal_scalar_type_alias']);
  assert.match(result.repairedFiles[0].content, /\bsubtype operation_code_t is integer range 0 to 7;/i);
  assert.doesNotMatch(result.repairedFiles[0].content, /\btype operation_code_t is integer range 0 to 7;/i);
});

test('deterministic fixer removes illegal subtype re-constraints from already constrained aliases', async () => {
  const file = await createRepairableFile(
    'src/lanes_pkg.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'package lanes_pkg is',
      '  type lane_matrix_t is array (0 to 1) of std_logic_vector(3 downto 0);',
      '  subtype lane_alias_t is lane_matrix_t(0 to 1);',
      'end package;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'reconstrained_subtype_alias',
      category: 'array_subtype_misuse',
      message: 'src/lanes_pkg.vhd: re-constrains existing subtype/type "lane_matrix_t" in subtype "lane_alias_t".',
      excerpt: 'subtype lane_alias_t is lane_matrix_t(0 to 1)',
      relativePath: 'src/lanes_pkg.vhd',
      forbiddenConstruct: 'subtype lane_alias_t is lane_matrix_t(...)',
      legalReplacementPattern: 'declare a new legal subtype from the base type, or reuse the existing constrained subtype unchanged',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.deepEqual(result.appliedCodes, ['reconstrained_subtype_alias']);
  assert.match(result.repairedFiles[0].content, /\bsubtype lane_alias_t is lane_matrix_t;/i);
  assert.doesNotMatch(result.repairedFiles[0].content, /\bsubtype lane_alias_t is lane_matrix_t\(0 to 1\);/i);
});

test('deterministic fixer injects missing IEEE use clauses for std_logic_1164 and numeric_std', async () => {
  const file = await createRepairableFile(
    'src/alu_pkg.vhd',
    [
      'package alu_pkg is',
      '  constant ZERO_U : unsigned(3 downto 0) := "0000";',
      '  constant DONE_C : std_logic := \'0\';',
      'end package;',
      '',
    ].join('\n'),
  );

  const logicImportFix = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'missing_std_logic_1164_clause',
      category: 'missing_ieee_clause',
      message: 'src/alu_pkg.vhd: uses std_logic/std_ulogic logic types without a local "use ieee.std_logic_1164.all;" clause.',
      excerpt: 'logic types used without local std_logic_1164 import',
      relativePath: 'src/alu_pkg.vhd',
      forbiddenConstruct: 'logic types used without local std_logic_1164 import',
      legalReplacementPattern: 'add local library/use clauses for ieee.std_logic_1164 in the same file',
    }),
    availableFiles: [file],
  });

  const numericImportFix = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'missing_numeric_std_clause',
      category: 'missing_ieee_clause',
      message: 'src/alu_pkg.vhd: uses numeric_std types/functions without a local "use ieee.numeric_std.all;" clause.',
      excerpt: 'numeric_std types/functions used without local numeric_std import',
      relativePath: 'src/alu_pkg.vhd',
      forbiddenConstruct: 'numeric_std types/functions used without local numeric_std import',
      legalReplacementPattern: 'add local use ieee.numeric_std.all; in the same file',
    }),
    availableFiles: logicImportFix.repairedFiles,
  });

  assert.equal(numericImportFix.changed, true);
  assert.match(numericImportFix.repairedFiles[0].content, /^library ieee;$/im);
  assert.match(numericImportFix.repairedFiles[0].content, /^use ieee\.std_logic_1164\.all;$/im);
  assert.match(numericImportFix.repairedFiles[0].content, /^use ieee\.numeric_std\.all;$/im);
});

test('deterministic fixer rewrites numeric discipline anti-patterns into typed forms when the fix is mechanical', async () => {
  const file = await createRepairableFile(
    'src/alu.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity alu is end entity;',
      'architecture rtl of alu is',
      '  signal a_slv : std_logic_vector(7 downto 0);',
      '  signal b_slv : std_logic_vector(7 downto 0);',
      '  signal helper_result : unsigned(7 downto 0);',
      '  signal range_target : unsigned(7 downto 0);',
      '  signal idx_slv : std_logic_vector(2 downto 0);',
      'begin',
      '  process(all)',
      '  begin',
      '    helper_result <= a_slv and b_slv;',
      '    helper_result <= not a_slv;',
      '    helper_result <= resize(a_slv, range_target\'range);',
      '    report integer\'image(to_integer(a_slv));',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const typedBitwiseFix = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'typed_bitwise_mismatch',
      category: 'numeric_std_type_discipline',
      message: 'src/alu.vhd: assigns raw std_logic_vector bitwise expression into unsigned. Normalize operands first and apply "and".',
      excerpt: 'helper_result <= a_slv and b_slv;',
      relativePath: 'src/alu.vhd',
      forbiddenConstruct: 'raw std_logic_vector and expression assigned to unsigned',
      legalReplacementPattern: 'convert a_slv and b_slv into matching unsigned operands before applying and',
    }),
    availableFiles: [file],
  });

  const typedUnaryFix = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'typed_unary_mismatch',
      category: 'numeric_std_type_discipline',
      message: 'src/alu.vhd: assigns raw std_logic_vector unary expression into unsigned.',
      excerpt: 'helper_result <= not a_slv;',
      relativePath: 'src/alu.vhd',
      forbiddenConstruct: 'raw std_logic_vector unary not assigned to unsigned',
      legalReplacementPattern: 'convert "a_slv" into matching unsigned before applying not',
    }),
    availableFiles: typedBitwiseFix.repairedFiles,
  });

  const resizeWidthFix = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'resize_with_range_attribute',
      category: 'numeric_std_type_discipline',
      message: 'src/alu.vhd: calls resize with attribute range "range_target\'range".',
      excerpt: 'resize(a_slv, range_target\'range)',
      relativePath: 'src/alu.vhd',
      forbiddenConstruct: 'resize(..., range_target\'range)',
      legalReplacementPattern: 'pass a scalar width such as range_target\'length or an explicit integer',
    }),
    availableFiles: typedUnaryFix.repairedFiles,
  });

  const resizeTypedFix = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'resize_on_raw_std_logic_vector',
      category: 'numeric_std_type_discipline',
      message: 'src/alu.vhd: calls resize on raw std_logic_vector "a_slv".',
      excerpt: 'resize(a_slv, range_target\'length)',
      relativePath: 'src/alu.vhd',
      forbiddenConstruct: 'resize(a_slv, ...) on std_logic_vector',
      legalReplacementPattern: 'convert "a_slv" to unsigned/signed before calling resize',
    }),
    availableFiles: resizeWidthFix.repairedFiles,
  });

  const toIntegerFix = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'to_integer_on_raw_logic_type',
      category: 'numeric_std_type_discipline',
      message: 'src/alu.vhd: calls to_integer on raw std_logic_vector "a_slv".',
      excerpt: 'to_integer(a_slv)',
      relativePath: 'src/alu.vhd',
      forbiddenConstruct: 'to_integer(a_slv) on raw std_logic_vector',
      legalReplacementPattern: 'convert "a_slv" with unsigned(...) or signed(...) before to_integer',
    }),
    availableFiles: resizeTypedFix.repairedFiles,
  });

  const finalContent = toIntegerFix.repairedFiles[0].content;
  assert.match(finalContent, /\bhelper_result\s*<=\s*unsigned\(a_slv\)\s+and\s+unsigned\(b_slv\);/i);
  assert.match(finalContent, /\bhelper_result\s*<=\s*not\s+unsigned\(a_slv\);/i);
  assert.match(finalContent, /\bhelper_result\s*<=\s*resize\(unsigned\(a_slv\),\s*range_target'length\);/i);
  assert.match(finalContent, /\bto_integer\(unsigned\(a_slv\)\)/i);
});

test('deterministic fixer rewrites raw std_logic_vector shift calls into typed numeric_std forms', async () => {
  const file = await createRepairableFile(
    'src/shifter.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity shifter is end entity;',
      'architecture rtl of shifter is',
      '  signal a_slv : std_logic_vector(7 downto 0);',
      '  signal result_u : unsigned(7 downto 0);',
      'begin',
      '  process(all)',
      '  begin',
      '    result_u <= shift_left(a_slv, 1);',
      '    result_u <= shift_right(a_slv, 2);',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const leftFix = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'shift_left_on_raw_std_logic_vector',
      category: 'numeric_std_type_discipline',
      message: 'src/shifter.vhd: calls shift_left on raw std_logic_vector "a_slv".',
      excerpt: 'shift_left(a_slv, 1)',
      relativePath: 'src/shifter.vhd',
      forbiddenConstruct: 'shift_left(a_slv, ...) on std_logic_vector',
      legalReplacementPattern: 'convert "a_slv" to unsigned/signed before shifting',
    }),
    availableFiles: [file],
  });

  const rightFix = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'shift_right_on_raw_std_logic_vector',
      category: 'numeric_std_type_discipline',
      message: 'src/shifter.vhd: calls shift_right on raw std_logic_vector "a_slv".',
      excerpt: 'shift_right(a_slv, 2)',
      relativePath: 'src/shifter.vhd',
      forbiddenConstruct: 'shift_right(a_slv, ...) on std_logic_vector',
      legalReplacementPattern: 'convert "a_slv" to unsigned/signed before shifting',
    }),
    availableFiles: leftFix.repairedFiles,
  });

  const finalContent = rightFix.repairedFiles[0].content;
  assert.match(finalContent, /\bresult_u\s*<=\s*shift_left\(unsigned\(a_slv\),\s*1\);/i);
  assert.match(finalContent, /\bresult_u\s*<=\s*shift_right\(unsigned\(a_slv\),\s*2\);/i);
});

test('deterministic fixer rewrites scalar bit-string numeric assignments and typed helper actual mismatches', async () => {
  const file = await createRepairableFile(
    'src/alu_pkg.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'package alu_pkg is',
      '  constant bits_sig : natural := "11";',
      '  function use_unsigned(value_u : unsigned) return unsigned;',
      'end package;',
      '',
      'package body alu_pkg is',
      '  function use_unsigned(value_u : unsigned) return unsigned is',
      '  begin',
      '    return value_u;',
      '  end function;',
      'end package body;',
      '',
      'entity helper_top is end entity;',
      'architecture rtl of helper_top is',
      '  signal a_slv : std_logic_vector(7 downto 0);',
      '  signal helper_result : unsigned(7 downto 0);',
      'begin',
      '  process(all)',
      '  begin',
      '    helper_result <= use_unsigned(a_slv);',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const scalarFix = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'scalar_bit_string_assignment',
      category: 'width_literal_mismatch',
      message: 'src/alu_pkg.vhd: assigns bit-string literal "11" to scalar numeric natural "bits_sig".',
      excerpt: 'constant bits_sig : natural := "11";',
      relativePath: 'src/alu_pkg.vhd',
      forbiddenConstruct: 'bit-string literal assigned to scalar numeric "bits_sig"',
      legalReplacementPattern: 'replace "11" with a numeric literal or explicit typed conversion',
    }),
    availableFiles: [file],
  });

  const helperFix = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'typed_helper_actual_mismatch',
      category: 'numeric_std_type_discipline',
      message: 'src/alu_pkg.vhd: calls function "use_unsigned" with raw std_logic_vector actual "a_slv" for unsigned formal parameter #1.',
      excerpt: 'helper_result <= use_unsigned(a_slv);',
      relativePath: 'src/alu_pkg.vhd',
      forbiddenConstruct: 'raw std_logic_vector actual "a_slv" passed to unsigned formal parameter of use_unsigned',
      legalReplacementPattern: 'convert "a_slv" to unsigned at the call site or change the formal parameter type',
    }),
    availableFiles: scalarFix.repairedFiles,
  });

  const finalContent = helperFix.repairedFiles[0].content;
  assert.match(finalContent, /\bconstant bits_sig : natural := 3;/i);
  assert.match(finalContent, /\bhelper_result\s*<=\s*use_unsigned\(unsigned\(a_slv\)\);/i);
});

test('deterministic fixer wraps std_logic_vector function results before driving typed destinations', async () => {
  const file = await createRepairableFile(
    'src/alu_pkg.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'package alu_pkg is',
      '  function alu_execute(lhs : unsigned; rhs : unsigned) return std_logic_vector;',
      'end package;',
      '',
      'package body alu_pkg is',
      '  function alu_execute(lhs : unsigned; rhs : unsigned) return std_logic_vector is',
      '  begin',
      '    return std_logic_vector(lhs + rhs);',
      '  end function;',
      'end package body;',
      '',
      'entity helper_top is end entity;',
      'architecture rtl of helper_top is',
      '  signal a_u : unsigned(7 downto 0);',
      '  signal b_u : unsigned(7 downto 0);',
      '  signal result_u : unsigned(7 downto 0);',
      'begin',
      '  process(all)',
      '  begin',
      '    result_u <= alu_execute(a_u, b_u);',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const repair = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'typed_function_result_mismatch',
      category: 'numeric_std_type_discipline',
      message: 'src/alu_pkg.vhd: assigns std_logic_vector function result "alu_execute(...)" into unsigned destination "result_u".',
      excerpt: 'result_u <= alu_execute(a_u, b_u);',
      relativePath: 'src/alu_pkg.vhd',
      forbiddenConstruct: 'std_logic_vector function result from "alu_execute" assigned into unsigned destination "result_u"',
      legalReplacementPattern: 'change "alu_execute" to return unsigned or wrap the call with unsigned(...) at the assignment site',
    }),
    availableFiles: [file],
  });

  assert.match(repair.repairedFiles[0].content, /\bresult_u\s*<=\s*unsigned\(alu_execute\(a_u,\s*b_u\)\);/i);
});

test('deterministic fixer wraps typed port-map actuals at the entity boundary', async () => {
  const file = await createRepairableFile(
    'src/top.vhd',
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
  );

  const repair = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'typed_port_association_mismatch',
      category: 'numeric_std_type_discipline',
      message: [
        'src/top.vhd:32:22:error: can\'t associate "std_logic_vector(fir_sample)" with port "sample_o"',
        '  sample_o => std_logic_vector(fir_sample),',
        'src/fir_filter.vhd:12:5:error: (type of port "sample_o" is a subtype of UNRESOLVED_SIGNED)',
      ].join('\n'),
      excerpt: 'sample_o => std_logic_vector(fir_sample),',
      relativePath: 'src/top.vhd',
      forbiddenConstruct: 'port map actual whose type does not match the formal port type',
      legalReplacementPattern: 'pass an actual with the same declared type as the formal port type',
    }),
    availableFiles: [file],
  });

  assert.match(repair.repairedFiles[0].content, /\bsample_o\s*=>\s*signed\(std_logic_vector\(fir_sample\)\)/i);
});

test('deterministic fixer wraps named-association and slice typed helper actuals locally', async () => {
  const file = await createRepairableFile(
    'src/helper_args.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'package helper_args is',
      '  function use_unsigned(lhs : unsigned; rhs : unsigned) return unsigned;',
      'end package;',
      '',
      'package body helper_args is',
      '  function use_unsigned(lhs : unsigned; rhs : unsigned) return unsigned is',
      '  begin',
      '    return lhs + rhs;',
      '  end function;',
      'end package body;',
      '',
      'entity helper_top is end entity;',
      'architecture rtl of helper_top is',
      '  signal a_slv : std_logic_vector(7 downto 0);',
      '  signal b_slv : std_logic_vector(7 downto 0);',
      '  signal helper_result : unsigned(7 downto 0);',
      'begin',
      '  process(all)',
      '  begin',
      '    helper_result <= use_unsigned(lhs => a_slv, rhs => b_slv(7 downto 0));',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const helperFix = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'typed_helper_actual_mismatch',
      category: 'numeric_std_type_discipline',
      message: 'src/helper_args.vhd: calls function "use_unsigned" with raw std_logic_vector actual "a_slv" for unsigned formal parameter #1.',
      excerpt: 'helper_result <= use_unsigned(lhs => a_slv, rhs => b_slv(7 downto 0));',
      relativePath: 'src/helper_args.vhd',
      forbiddenConstruct: 'raw std_logic_vector actual "a_slv" passed to unsigned formal parameter of use_unsigned',
      legalReplacementPattern: 'convert "a_slv" to unsigned at the call site or change the formal parameter type',
    }),
    availableFiles: [file],
  });

  const sliceFix = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'typed_helper_actual_mismatch',
      category: 'numeric_std_type_discipline',
      message: 'src/helper_args.vhd: calls function "use_unsigned" with raw std_logic_vector actual "b_slv(7 downto 0)" for unsigned formal parameter #2.',
      excerpt: 'helper_result <= use_unsigned(lhs => unsigned(a_slv), rhs => b_slv(7 downto 0));',
      relativePath: 'src/helper_args.vhd',
      forbiddenConstruct: 'raw std_logic_vector actual "b_slv(7 downto 0)" passed to unsigned formal parameter of use_unsigned',
      legalReplacementPattern: 'convert "b_slv(7 downto 0)" to unsigned at the call site or change the formal parameter type',
    }),
    availableFiles: helperFix.repairedFiles,
  });

  const finalContent = sliceFix.repairedFiles[0].content;
  assert.match(finalContent, /\buse_unsigned\(lhs => unsigned\(a_slv\), rhs => unsigned\(b_slv\(7 downto 0\)\)\);/i);
});

test('deterministic fixer wraps source-level typed port-map mismatch actuals before GHDL wording exists', async () => {
  const file = await createRepairableFile(
    'src/top.vhd',
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
  );

  const repair = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'typed_port_association_mismatch',
      category: 'numeric_std_type_discipline',
      message:
        'src/top.vhd: drives signed formal port "sample_o" of "fir_filter" with std_logic_vector actual "std_logic_vector(fir_sample)" in a port map. Convert the actual at the entity boundary into the exact formal type expected by the instantiated design unit.',
      excerpt: 'sample_o => std_logic_vector(fir_sample),',
      relativePath: 'src/top.vhd',
      forbiddenConstruct: 'std_logic_vector actual "std_logic_vector(fir_sample)" passed to signed formal port "sample_o" of fir_filter',
      legalReplacementPattern: 'wrap "std_logic_vector(fir_sample)" with signed(...) at the port-map boundary or change the formal/actual types so they match exactly',
    }),
    availableFiles: [file],
  });

  assert.match(repair.repairedFiles[0].content, /\bsample_o\s*=>\s*signed\(std_logic_vector\(fir_sample\)\)/i);
});

test('deterministic fixer repairs a combined testbench declaration-scope cluster in one pass', async () => {
  const file = await createRepairableFile(
    'tb/router_tb.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity router_tb is',
      'end entity;',
      '',
      'architecture sim of router_tb is',
      '  variable loop_cnt : integer := 0;',
      'begin',
      '  stimulus : process',
      '  begin',
      '    procedure wait_clk is',
      '    begin',
      '      loop_cnt := loop_cnt + 1;',
      '      wait until rising_edge(clk);',
      '    end procedure;',
      '    wait_clk;',
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: {
      ok: false,
      stage: 'prevalidate',
      summary: 'cluster failure',
      logs: ['tb/router_tb.vhd: declaration-scope cluster'],
      validatedTopEntities: [],
      failureCode: 'declaration_after_begin',
      failureCategory: 'declaration_scope',
      failureDetails: [
        {
          code: 'architecture_body_variable',
          category: 'declaration_scope',
          message: 'tb/router_tb.vhd: declares plain architecture-body variable "loop_cnt".',
          excerpt: 'loop_cnt',
          relativePath: 'tb/router_tb.vhd',
          forbiddenConstruct: 'plain architecture-body variable "loop_cnt" (process_local_scratch)',
          legalReplacementPattern: 'move "loop_cnt" into the nearest process/subprogram declarative region as a local variable unless persistent shared state is truly required',
        },
        {
          code: 'declaration_after_begin',
          category: 'declaration_scope',
          message: 'tb/router_tb.vhd: procedure wait_clk is declared after begin.',
          excerpt: 'procedure wait_clk',
          relativePath: 'tb/router_tb.vhd',
          forbiddenConstruct: 'procedure declaration for "wait_clk"',
          legalReplacementPattern: 'hoist declaration before begin',
        },
        {
          code: 'procedure_outer_scope_write',
          category: 'declaration_scope',
          message: 'tb/router_tb.vhd: procedure wait_clk mutates outer-scope object loop_cnt.',
          excerpt: 'wait_clk writes loop_cnt',
          relativePath: 'tb/router_tb.vhd',
          forbiddenConstruct: 'procedure "wait_clk" mutates outer-scope object "loop_cnt"',
          legalReplacementPattern: 'pass loop_cnt explicitly as a formal parameter or keep it local to the caller',
        },
      ],
    },
    availableFiles: [file],
  });

  const next = result.repairedFiles[0].content;
  assert.equal(result.changed, true);
  assert.match(next, /procedure wait_clk\s*\(\s*variable loop_cnt_io : inout integer\s*\)\s*is/i);
  assert.match(next, /procedure wait_clk\s*\(\s*variable loop_cnt_io : inout integer\s*\)\s*is/i);
  assert.match(next, /wait_clk\(loop_cnt\);/i);
  assert.doesNotMatch(next, /begin[\s\S]*procedure wait_clk is/i);
});

test('deterministic fixer runs bundled testbench declaration-scope repair from a lone declaration_after_begin detail', async () => {
  const file = await createRepairableFile(
    'tb/router_tb.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity router_tb is',
      'end entity;',
      '',
      'architecture sim of router_tb is',
      '  variable loop_cnt : integer := 0;',
      'begin',
      '  stimulus : process',
      '  begin',
      '    procedure wait_clk is',
      '    begin',
      '      loop_cnt := loop_cnt + 1;',
      '      wait until rising_edge(clk);',
      '    end procedure;',
      '    wait_clk;',
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'declaration_after_begin',
      category: 'declaration_scope',
      message: 'tb/router_tb.vhd: procedure wait_clk is declared after begin.',
      excerpt: 'procedure wait_clk',
      relativePath: 'tb/router_tb.vhd',
      forbiddenConstruct: 'procedure declaration for "wait_clk" after begin',
      legalReplacementPattern: 'move "wait_clk" into an enclosing declarative region before begin',
    }),
    availableFiles: [file],
  });

  const next = result.repairedFiles[0].content;
  assert.equal(result.changed, true);
  assert.match(next, /procedure wait_clk\s*\(\s*variable loop_cnt_io : inout integer\s*\)\s*is/i);
  assert.match(next, /wait_clk\(loop_cnt\);/i);
  assert.doesNotMatch(next, /begin[\s\S]*procedure wait_clk is/i);
  assert.ok(
    result.appliedCodes.includes('declaration_after_begin') ||
      result.appliedCodes.includes('procedure_outer_scope_write'),
  );
});

test('deterministic fixer runs bundled testbench declaration-scope repair from a lone architecture_body_variable detail', async () => {
  const file = await createRepairableFile(
    'tb/router_tb.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity router_tb is',
      'end entity;',
      '',
      'architecture sim of router_tb is',
      '  variable loop_cnt : integer := 0;',
      'begin',
      '  stimulus : process',
      '  begin',
      '    procedure wait_clk is',
      '    begin',
      '      loop_cnt := loop_cnt + 1;',
      '      wait until rising_edge(clk);',
      '    end procedure;',
      '    wait_clk;',
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'architecture_body_variable',
      category: 'declaration_scope',
      message: 'tb/router_tb.vhd: declares plain architecture-body variable "loop_cnt".',
      excerpt: 'loop_cnt',
      relativePath: 'tb/router_tb.vhd',
      forbiddenConstruct: 'plain architecture-body variable "loop_cnt" (process_local_scratch)',
      legalReplacementPattern: 'move "loop_cnt" into the nearest process/subprogram declarative region as a local variable unless persistent shared state is truly required',
    }),
    availableFiles: [file],
  });

  const next = result.repairedFiles[0].content;
  assert.equal(result.changed, true);
  assert.ok(result.appliedCodes.includes('architecture_body_variable'));
  assert.ok(result.appliedCodes.includes('declaration_scope_cluster'));
  assert.match(next, /procedure wait_clk\s*\(\s*variable loop_cnt_io : inout integer\s*\)\s*is/i);
  assert.match(next, /wait_clk\(loop_cnt\);/i);
  assert.doesNotMatch(next, /begin[\s\S]*procedure wait_clk is/i);
});

test('deterministic fixer relaxes constrained string helper formals in testbench procedures', async () => {
  const file = await createRepairableFile(
    'tb/router_tb.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      '',
      'entity router_tb is',
      'end entity;',
      '',
      'architecture sim of router_tb is',
      'begin',
      '  stimulus : process',
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
      '    check_eq(\'0\', \'0\', "ok");',
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'tb_string_formal_actual_constraint_mismatch',
      category: 'width_literal_mismatch',
      message: 'tb/router_tb.vhd: helper procedure "check_eq" declares constrained string formal "msg_name".',
      excerpt: 'msg_name : string(1 to 32)',
      relativePath: 'tb/router_tb.vhd',
      forbiddenConstruct: 'procedure "check_eq" declares constrained string formal "msg_name"',
      legalReplacementPattern: 'use an unconstrained read-only string formal for "msg_name", or remove the helper string formal and report literals directly at the call site',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.ok(result.appliedCodes.includes('tb_string_formal_actual_constraint_mismatch'));
  assert.match(result.repairedFiles[0].content, /msg_name : in string\s*\)/i);
  assert.doesNotMatch(result.repairedFiles[0].content, /msg_name : in string\(1 to 32\)/i);
});

test('deterministic fixer canonicalizes malformed helper formals and removes unconstrained string scratch variables', async () => {
  const file = await createRepairableFile(
    'tb/tb_bridge.vhd',
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
      '      variable msg : string;',
      '    begin',
      '      msg := "FAIL";',
      "      test_failed_io <= '1';",
      '      report msg severity error;',
      '    end procedure mark_fail;',
      '  begin',
      '    mark_fail("boom", test_failed);',
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation(
      {
        code: 'invalid_subprogram_formal_syntax',
        category: 'interface_generic_port_syntax',
        message: 'tb/tb_bridge.vhd: helper procedure "mark_fail" declares malformed formal clause "inout test_failed_io : inout std_logic".',
        excerpt: 'inout test_failed_io : inout std_logic',
        relativePath: 'tb/tb_bridge.vhd',
        forbiddenConstruct: 'procedure "mark_fail" declares malformed formal clause "inout test_failed_io : inout std_logic"',
        legalReplacementPattern: 'rewrite "inout test_failed_io : inout std_logic" into canonical VHDL formal syntax and keep signal/variable actual kinds aligned with the helper body',
      },
      {
        code: 'tb_unconstrained_string_variable',
        category: 'declaration_scope',
        message: 'tb/tb_bridge.vhd: declares unconstrained local string variable "msg".',
        excerpt: 'variable msg : string;',
        relativePath: 'tb/tb_bridge.vhd',
        forbiddenConstruct: 'unconstrained local string variable "msg"',
        legalReplacementPattern: 'replace "msg" with a direct report literal, a constant with an explicit bound, or a helper contract that does not require a mutable string variable',
      },
    ),
    availableFiles: [file],
  });

  const next = result.repairedFiles[0].content;
  assert.equal(result.changed, true);
  assert.ok(result.appliedCodes.includes('invalid_subprogram_formal_syntax'));
  assert.ok(result.appliedCodes.includes('tb_unconstrained_string_variable'));
  assert.match(next, /procedure mark_fail\(\s*msg_name : in string;\s*signal test_failed_io : out std_logic\s*\) is/i);
  assert.doesNotMatch(next, /inout test_failed_io : inout std_logic/i);
  assert.doesNotMatch(next, /\bvariable msg : string;/i);
  assert.doesNotMatch(next, /\bmsg := "FAIL";/i);
  assert.match(next, /report "FAIL" severity error;/i);
});

test('deterministic fixer converts clock-edge helper formals into signal inputs', async () => {
  const file = await createRepairableFile(
    'tb/tb_edge_helper.vhd',
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
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'clock_edge_helper_requires_signal_formal',
      category: 'interface_generic_port_syntax',
      message: 'tb/tb_edge_helper.vhd: helper procedure "wait_clk" uses rising_edge on non-signal formal "clk".',
      excerpt: 'wait until rising_edge(clk);',
      relativePath: 'tb/tb_edge_helper.vhd',
      forbiddenConstruct: 'procedure "wait_clk" uses rising_edge(...) on non-signal formal clause "clk : in std_logic"',
      legalReplacementPattern: 'rewrite the helper formal as signal clk : in std_logic',
    }),
    availableFiles: [file],
  });

  assert.equal(result.changed, true);
  assert.ok(result.appliedCodes.includes('clock_edge_helper_requires_signal_formal'));
  assert.match(result.repairedFiles[0].content, /procedure wait_clk\(signal clk : in std_logic\) is/i);
  assert.match(result.repairedFiles[0].content, /wait until rising_edge\(clk\);/i);
});

test('deterministic fixer rewrites unsafe raw testbench indexing to a guarded helper', async () => {
  const file = await createRepairableFile(
    'tb/tb_indexing.vhd',
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
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'tb_unguarded_logic_index_conversion',
      category: 'runtime_bound_risk',
      message: 'tb/tb_indexing.vhd: uses direct array indexing from raw logic vector "addr_slv".',
      excerpt: 'rom(to_integer(unsigned(addr_slv)))',
      relativePath: 'tb/tb_indexing.vhd',
      forbiddenConstruct: 'direct array indexing expression "rom(to_integer(unsigned(addr_slv)))"',
      legalReplacementPattern: 'rewrite as rom(tb_safe_slv_to_index(addr_slv))',
    }),
    availableFiles: [file],
  });

  const next = result.repairedFiles[0].content;
  assert.equal(result.changed, true);
  assert.ok(result.appliedCodes.includes('tb_unguarded_logic_index_conversion'));
  assert.match(next, /function tb_safe_slv_to_index\(value : std_logic_vector\) return natural is/i);
  assert.match(next, /data_o <= rom\(tb_safe_slv_to_index\(addr_slv\)\);/i);
  assert.doesNotMatch(next, /rom\(to_integer\(unsigned\(addr_slv\)\)\)/i);
});

test('deterministic fixer rewrites invalid VHDL range-membership checks to explicit comparisons', async () => {
  const file = await createRepairableFile(
    'tb/tb_range.vhd',
    [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'entity tb_range is',
      'end entity;',
      '',
      'architecture sim of tb_range is',
      'begin',
      '  process',
      '    variable idx : integer := 0;',
      '  begin',
      '    if idx in 0 to 15 then',
      '      report "inside range";',
      '    end if;',
      '    wait;',
      '  end process;',
      'end architecture;',
      '',
    ].join('\n'),
  );

  const result = await applyDeterministicGeneratedCodeRepairs({
    validation: createValidation({
      code: 'invalid_range_membership_syntax',
      category: 'runtime_bound_risk',
      message: 'tb/tb_range.vhd: uses invalid VHDL range-membership condition "if idx in 0 to 15 then".',
      excerpt: 'if idx in 0 to 15 then',
      relativePath: 'tb/tb_range.vhd',
      forbiddenConstruct: 'if idx in 0 to 15 then',
      legalReplacementPattern: 'if idx >= 0 and idx <= 15 then',
    }),
    availableFiles: [file],
  });

  const next = result.repairedFiles[0].content;
  assert.equal(result.changed, true);
  assert.ok(result.appliedCodes.includes('invalid_range_membership_syntax'));
  assert.match(next, /if idx >= 0 and idx <= 15 then/i);
  assert.doesNotMatch(next, /if idx in 0 to 15 then/i);
});

test('generated code repair prompt includes file-scoped repair guidance and shared strict rule section', async () => {
  const files = [
    await createRepairableFile(
      'src/alu.vhd',
      [
        'library ieee;',
        'use ieee.std_logic_1164.all;',
        'entity alu is end entity;',
        'architecture rtl of alu is',
        'begin',
        '  p : process',
        '    variable idx : integer := 0;',
        '  begin',
        '    if idx >= 0 and idx := 255 then',
        '      null;',
        '    end if;',
        '  end process;',
        'end architecture;',
      ].join('\n'),
    ),
    await createRepairableFile(
      'tb/alu_tb.vhd',
      [
        'library ieee;',
        'use ieee.std_logic_1164.all;',
        'entity alu_tb is end entity;',
        'architecture sim of alu_tb is begin end architecture;',
      ].join('\n'),
    ),
  ];

  const prompt = buildGeneratedCodeRepairPrompt({
    originalPrompt: 'wrapped:system prompt\n\ncontract:repair me',
    macroId: 'fpga_vhdl_architect',
    macroLabel: 'FPGA Architect',
    availableFiles: files,
    validation: {
      ok: false,
      stage: 'analyze',
      summary: 'Generated code failed validation.',
      logs: ['src/alu.vhd: bad operator typing', 'tb/alu_tb.vhd: declaration after begin'],
      validatedTopEntities: [],
      failureCode: 'numeric_std_operator_misuse',
      failureCategory: 'numeric_std_type_discipline',
      failureDetails: [
        {
          code: 'numeric_std_operator_misuse',
          category: 'numeric_std_type_discipline',
          message: 'src/alu.vhd: uses integer logical operator form that GHDL rejects.',
          excerpt: 'if idx >= 0 and idx := 255 then',
          relativePath: 'src/alu.vhd',
          lineHint: 9,
          forbiddenConstruct: 'condition "idx >= 0 and idx := 255" contains "idx := 255"',
          legalReplacementPattern: 'replace "idx := 255" with "idx <= 255"',
        },
        {
          code: 'declaration_after_begin',
          category: 'declaration_scope',
          message: 'tb/alu_tb.vhd: declares helper signal after begin.',
          excerpt: 'tb/alu_tb.vhd: declares helper signal after begin.',
          relativePath: 'tb/alu_tb.vhd',
          forbiddenConstruct: 'declaration after begin',
          legalReplacementPattern: 'hoist declarations into the declarative region before begin',
        },
      ],
    },
  });

  assert.match(prompt, /### Automatic Retry: Shared Generated-Code Repair Pipeline/);
  assert.match(prompt, /Failure evidence contract:/);
  assert.match(prompt, /Do not infer or guess the failure reason/);
  assert.match(prompt, /exact file, line, snippet\/expression, forbidden construct, and required replacement are authoritative/i);
  assert.match(prompt, /Exact issue packets:/);
  assert.match(prompt, /### Issue 1: numeric_std_operator_misuse/);
  assert.match(prompt, /File: src\/alu\.vhd/);
  assert.match(prompt, /Line: 9/);
  assert.match(prompt, />\s+9 \|\s+if idx >= 0 and idx := 255 then/);
  assert.match(prompt, /Required local replacement: replace "idx := 255" with "idx <= 255"/);
  assert.match(prompt, /Repair instruction: fix this exact local issue and any directly coupled same-file instances only/);
  assert.match(prompt, /File-scoped repair plan:/);
  assert.match(prompt, /### src\/alu\.vhd[\s\S]*Return one full replacement for this file that resolves every listed class below in the same pass\./);
  assert.match(prompt, /### tb\/alu_tb\.vhd[\s\S]*hoist declarations into the declarative region before begin/i);
  assert.match(prompt, /## Strict GHDL \/ VHDL Rules/);
  assert.match(prompt, /Do not use any VHDL reserved word, operator token, or predefined language keyword as an identifier anywhere in generated code\./);
  assert.match(prompt, /Prefer minimal file-local repairs: preserve passing files, preserve names\/interfaces unless a listed failure requires change/);
  assert.match(prompt, /Do not insert meta-comments or repair annotations such as "REPAIRED", "FIXED", "CHANGED", "UPDATED"/);
  assert.match(prompt, /When fixing declarations after "begin", move the exact declaration or subprogram block intact into a legal declarative region\./);
});
