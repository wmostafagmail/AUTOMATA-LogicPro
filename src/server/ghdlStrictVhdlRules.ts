import type { AiMacroId } from '../aiMacros';

export const SHARED_VHDL_SKILL_NAMES = [
  '- `VHDL-skill-orchestrator`: deterministic routing and sequencing for the repository-local VHDL skill registry.',
  '- `vhdl-language`: IEEE-style VHDL parsing, coding rules, numeric_std discipline, and GHDL-compatible RTL/testbench generation.',
  '- `fpga-architecture`: requirements to RTL architecture, hierarchy, interfaces, clocks, resets, datapath/control partitioning.',
  '- `rtl-verification`: self-checking testbenches, assertions, scoreboard/check strategy, and GHDL compile/elaborate/simulate discipline.',
  '- `timing-constraints`: clock period, reset timing, setup/hold concepts, generated constraints, and timing-risk review.',
].join('\n');

export const VHDL_OPERATOR_KEYWORDS = [
  'abs', 'and', 'mod', 'nand', 'nor', 'not', 'or', 'rem',
  'rol', 'ror', 'sla', 'sll', 'sra', 'srl', 'xnor', 'xor',
];

export const VHDL_RESERVED_IDENTIFIERS = [
  'abs', 'access', 'after', 'alias', 'all', 'and', 'architecture', 'array', 'assert', 'attribute',
  'begin', 'block', 'body', 'buffer', 'bus',
  'case', 'component', 'configuration', 'constant', 'context',
  'disconnect', 'downto',
  'else', 'elsif', 'end', 'entity', 'exit',
  'file', 'for', 'function',
  'generate', 'generic', 'group', 'guarded',
  'if', 'impure', 'in', 'inertial', 'inout', 'is',
  'label', 'library', 'linkage', 'literal', 'loop',
  'map', 'mod',
  'nand', 'new', 'next', 'nor', 'not', 'null',
  'of', 'on', 'open', 'or', 'others', 'out',
  'package', 'port', 'postponed', 'procedure', 'process', 'protected', 'pure',
  'range', 'record', 'register', 'reject', 'rem', 'report', 'return', 'rol', 'ror',
  'select', 'severity', 'shared', 'signal', 'sla', 'sll', 'sra', 'srl', 'subtype',
  'then', 'to', 'transport', 'type',
  'unaffected', 'units', 'until', 'use',
  'variable',
  'wait', 'when', 'while', 'with',
  'xnor', 'xor',
];

export const GHDL_STRICT_VHDL_RULE_FAMILIES = {
  declarationScope: [
    'Any local helper procedure/function in a testbench must be declared in the architecture declarative region before `begin`.',
    'Do not declare helper procedures/functions inside a process body or after the architecture `begin`. Put helper signatures/bodies in a legal declarative region before executable statements start.',
    'Local helper procedures/functions must not mutate outer-scope variables or signals implicitly. If helper logic needs to update `test_failed`, `out_test_failed`, pass/fail counters, expected values, scoreboards, or other mutable state, pass those targets explicitly as formal parameters or keep the state local to the calling process.',
    'A helper procedure such as `check_eq`, `check_result`, `mark_fail`, or `expect_result` must not assign directly to architecture-scope bookkeeping objects like `test_failed`, `out_test_failed`, `pass_count`, or `fail_count` unless those objects are passed in through legal VHDL formal arguments.',
    'In a process, declare variables only in the declarative region between the process header and `begin`. Never declare variables after the first sequential statement.',
    'Declare architecture-level signals only in the architecture declarative region before `begin`. Never declare a `signal` inside executable regions such as process bodies, if/case branches, or sequential statements; use a process-local variable declared before the process `begin` if you need a temporary intermediate.',
    'Do not emit pragma translate_on/translate_off lines.',
    'Do not declare plain variables in the architecture body. Ordinary variables belong only inside processes/subprograms; use signals for architecture-level state.',
    'Do not place helper state such as `current_test`, `expected_count`, `pass_count`, `fail_count`, `res_int`, result trackers, or temporary bookkeeping variables in the architecture declarative region. Put them inside a process/subprogram or model them as signals/constants if they must persist across cycles.',
    'For self-checking testbenches, flags such as test_failed must be signals or process-local variables.',
    'No executable-region declarations after `begin`. All signals, constants, procedures, functions, types, subtypes, and helper declarations must appear in a legal declarative region before executable statements start.',
  ],
  identifierReservedWord: [
    'Do not use any VHDL reserved word, operator token, or predefined language keyword as an identifier anywhere in generated code.',
    'This reserved-identifier ban includes entity names, architecture names, package names, enum literals, constants, signals, variables, generics, ports, procedure names, function names, and formal arguments.',
    'In particular, never use VHDL operator keywords such as `and`, `or`, `xor`, `xnor`, `nand`, `nor`, `not`, `sll`, `srl`, `sla`, `sra`, `rol`, or `ror` as user-defined identifiers.',
  ],
  numericStdTypeDiscipline: [
    'Use ieee.std_logic_1164 and ieee.numeric_std. Do not use std_logic_arith/std_logic_unsigned/std_logic_signed.',
    'Every generated VHDL design unit must declare the libraries/packages it actually uses in that same file.',
    'If a file uses std_logic/std_ulogic/std_logic_vector, include `library ieee;` and `use ieee.std_logic_1164.all;` in that file.',
    'If a file uses unsigned/signed/resize/to_integer or other numeric_std features, also include `use ieee.numeric_std.all;` in that file.',
    'Package declarations and package bodies are not exempt from those IEEE clauses. If a package defines `std_logic`, `std_ulogic`, `std_logic_vector`, `unsigned`, or `signed` objects, the package file itself must begin with the required local `library ieee;` and `use ...` clauses.',
    'Never assume `library` or `use` clauses from another file carry over.',
    'For numeric_std unsigned/signed comparisons, do not write equality tests such as `(others => \'0\')` in scalar comparison contexts. Prefer explicit forms like `to_unsigned(0, signal\'length)` or `to_signed(0, signal\'length)`.',
    'Do not use VHDL logical operator tokens as pseudo-English arithmetic/comparison glue. Expressions such as `a_int and b_int = 0`, `a_int or b_int = 0`, or `a_int xor b_int = 0` are illegal unless both operands are boolean.',
    'Use VHDL operator keywords exactly as defined by the language: `and`, `or`, `xor`, `xnor`, `not`, `sll`, and `srl`. Never emit C/Verilog-style symbols such as `~`, `|`, `^`, backticks, or similar operator punctuation in VHDL expressions.',
    'In VHDL, `&` is concatenation, not bitwise AND. Bitwise `and/or/xor/xnor/not` operations must be performed with the keyword operators on compatible std_logic_vector/unsigned/signed operands of matching widths, with explicit conversions where needed.',
    'Numeric_std functions such as `resize`, `shift_left`, and `shift_right` operate on `unsigned` or `signed`, not raw `std_logic_vector`. Convert first, for example `resize(unsigned(a), WIDTH)`.',
    'If a helper package/function accepts raw `std_logic_vector` arguments, normalize them into typed local operands before arithmetic, bitwise logic, shifts, or `resize` calls.',
    'If an internal result is kept as `unsigned` or `signed`, every branch assigning it must return that same type; do not mix in raw `std_logic_vector` expressions without explicit conversion at the boundary.',
    'Do not call `to_integer` on raw `std_logic` or `std_logic_vector`; convert first with `unsigned(...)` or `signed(...)`.',
    'Do not perform direct bitwise/logical operators on integers. Convert to typed vector/numeric operands or rewrite as boolean comparisons/arithmetic as appropriate.',
    'Do not read back `out` ports for internal decisions or flag generation. Compute from internal typed signals/variables first, then drive the port.',
    'For every externally visible result/status signal or port such as `uart_tx`, `uart_tx_out`, `done_o`, or `ready_o`, compute through an internal mirror signal/variable first. Internal logic must consume that internal object, not the `out` port itself.',
    'Do not apply output-port readback or internal driving patterns that conflict with VHDL mode semantics.',
  ],
  packageTypeDefinition: [
    'When constraining an existing scalar type such as `integer`, `natural`, or `positive`, use `subtype`, not `type`. For example write `subtype op_index_t is integer range 0 to 7;`, never `type op_index_t is integer range 0 to 7;`.',
    'For scalar numeric types such as `integer`, `natural`, and `positive`, use numeric literals/expressions on assignment. Do not assign bit-string or hex-string literals such as `"00"` or `x"3"` to scalar numeric declarations; use `0`, `3`, or an explicit typed conversion instead.',
    'No multidimensional `std_logic_vector(...) (...)` declarations. For vectors of vectors, declare a named array type and then use that type, or flatten the storage into a one-dimensional vector.',
    'Do not re-constrain an already constrained subtype or alias. If you need a different width/range, declare a new type/subtype legally from the base type.',
    'Package declarations may declare subprogram signatures only. Subprogram bodies must live in a separate `package body`, not inside the package declaration.',
    'Do not generate malformed packed-bus subtype expressions with nested `downto` arithmetic inside one subtype declaration. Precompute widths cleanly or use simple legal range expressions.',
  ],
  interfaceGenericPortSyntax: [
    'In entity/component generic and port lists, every interface item except the last must end with a semicolon. Do not rely on comments or blank lines as separators.',
    'Keep interface declarations syntactically plain. Do not let inline commentary break the required semicolon/comma structure in generic or port lists.',
    'Inside entity/component generic and port declarations, use `:` between the interface name and its subtype/mode. Never use `=>` there; `=>` is only for associations, named maps, and aggregates.',
    'Do not reference undeclared generics, constants, widths, or helper identifiers inside interface/type declarations. Declare them first in a legal outer declarative region or replace them with explicit legal dimensions.',
  ],
  simulationSuccess: [
    'Default to VHDL-2008 unless the project explicitly requires another revision.',
    'If you use std.env.stop or std.env.finish, import from the std library with `use std.env.all;` or call it fully qualified as `std.env.stop(0);`. Never write `use ieee.std_env.all;`.',
    'Passing testbenches must stop cleanly, for example with std.env.stop(0); never use severity failure to indicate success.',
    'Keep DUT reset style/polarity consistent with the generated testbench.',
    'For synchronous checks, sample outputs only after the active clock edge update has taken effect.',
    'For sequential DUTs such as counters, registers, and FSM outputs, wait for the correct post-edge observation point, allow reset to settle, and do not assert next-state values one clock too early.',
    'Any report/assert message must use valid VHDL string concatenation with `&`.',
    'If any RTL or testbench file references a work package/helper package/shared declaration such as `work.counter_pkg`, that package file must be generated explicitly and must appear before dependents in GHDL analysis order.',
    'Do not reference unresolved work units. Every entity, package, component, and helper used from work must either be generated in the project or removed from the design/testbench.',
    'Use VHDL literal syntax only. Never emit Verilog/SystemVerilog-sized literals such as `3\'b000`, `8\'hFF`, `4\'d7`, or `6\'o77` inside VHDL. Use VHDL forms like `"000"`, `x"FF"`, `to_unsigned(7, 4)`, or explicit typed conversions instead.',
    'Avoid runtime-unsafe placeholder indexing and array math. Any generated indexing, slicing, resize, shift count, and loop bounds must stay within declared widths/ranges for the intended stimuli.',
    'The generated DUT and testbench must be suitable for a full GHDL analyze -> elaborate -> simulate flow as written.',
  ],
} as const;

export const SHARED_GHDL_CONFORMANCE_RULE_LIST = [
  ...GHDL_STRICT_VHDL_RULE_FAMILIES.declarationScope,
  ...GHDL_STRICT_VHDL_RULE_FAMILIES.identifierReservedWord,
  ...GHDL_STRICT_VHDL_RULE_FAMILIES.numericStdTypeDiscipline,
  ...GHDL_STRICT_VHDL_RULE_FAMILIES.packageTypeDefinition,
  ...GHDL_STRICT_VHDL_RULE_FAMILIES.interfaceGenericPortSyntax,
  ...GHDL_STRICT_VHDL_RULE_FAMILIES.simulationSuccess,
];

export const FPGA_ARCHITECT_EXTRA_GHDL_RULE_LIST = [
  'For counters specifically, compare against a tracked expected_count that updates only when the DUT is supposed to update. After reset, verify the reset value first, then step through enabled/disabled cycles one full clock at a time.',
  'For ALUs, derive status flags from the computed result with type-correct logic. In particular, a zero flag must be based on the ALU result value, such as `result_int = 0` or `unsigned(result_vec) = 0`, not by combining raw operands with pseudo-English operator text.',
  'Keep ALU operand, intermediate, and result types explicit and compatible. Do not apply bitwise logical operators directly to integers.',
  'For ALUs, define opcode encodings in one shared package and make both the DUT and testbench consume that same package. Do not duplicate opcode literals independently in RTL and testbench code.',
  'For ALUs with `std_logic_vector` input ports, immediately normalize them into canonical internal typed operands such as `a_u := unsigned(a);`, `b_u := unsigned(b);`, `a_s := signed(a);`, and `b_s := signed(b);` before arithmetic, bitwise, resize, or shift operations.',
  'Apply the same ALU typing rules inside helper packages, pure functions, impure functions, and local procedures, not only inside entity architectures. Package functions must also normalize raw `std_logic_vector` arguments into typed internal operands before ALU operations.',
  'If an ALU helper function or procedure formal parameter is typed as `unsigned` or `signed`, never pass a raw `std_logic_vector` actual into it. Convert at the call site or change the formal interface so the signature and actuals are type-compatible.',
  'For ALU bitwise operations, use VHDL keyword operators on same-typed operands, for example `result_u := a_u and b_u;`, `result_u := a_u or b_u;`, `result_u := a_u xor b_u;`, `result_u := a_u xnor b_u;`, and `result_u := not a_u;`.',
  'The `xnor` operator must be written in legal infix form such as `a_u xnor b_u`; never emit invalid forms like `xnor a, b`.',
  'Never use `&` for AND, `|` for OR, `^` or backticks for XOR, `~` for NOT, or any function/prefix-style substitute for `xnor`.',
  'For ALUs, do not read back an `out` port to derive flags or internal decisions. Compute the operation result in an internal variable/signal of the correct type first, derive flags from that internal typed value, then assign the output port.',
  'For ALUs, keep arithmetic/bitwise intermediates as `unsigned`, `signed`, or `std_logic_vector` consistently. Convert at the boundaries only, not ad hoc inside equality checks.',
  'For ALUs, call `resize` only on `unsigned` or `signed` values. Never write forms like `resize(a, WIDTH)` when `a` is a `std_logic_vector`; instead write `resize(unsigned(a), WIDTH)` or normalize to `a_u` first.',
  'For ALUs using `shift_left` or `shift_right`, convert any vector/unsigned shift amount into an integer count, for example `to_integer(shift_amt)`, before calling the shift function.',
  'For ALUs, if the internal result is `unsigned`, then every arithmetic, bitwise, and shift branch must assign an `unsigned` result. Do not assign raw `std_logic_vector` expressions into an `unsigned` variable without an explicit conversion.',
  'For ALU package/helper functions, do not perform bitwise or resize operations directly on raw `std_logic_vector` parameters. Create typed locals first, for example `a_u`, `b_u`, `a_s`, and `b_s`, then keep the helper body type-consistent end to end.',
  'For ALU package/helper functions returning records, assign deterministic defaults to every record field before the case statement and keep every branch semantically complete.',
  'In a clocked process, do not derive flags from signals that were just assigned earlier in the same cycle. Use variables or internal next-value expressions so every flag is computed from the intended current operation result.',
  'For ALU self-checking testbenches, include deterministic smoke vectors that prove the basic arithmetic and logic path before broader coverage, including at minimum `1 + 2 = 3`, a simple subtract case, and one bitwise operation using the shared opcode constants.',
  'For ALU self-checking testbenches, compare the DUT result against a tiny golden-model expectation computed from the same typed operands/opcodes rather than ad hoc duplicated handwritten expectations that can drift from the DUT interface contract.',
];

export const STRICT_CODE_GENERATION_RULE_LIST = [
  'Return only code and metadata that should pass the app\'s strict pre-GHDL validation before simulation is attempted.',
  'Treat every VHDL reserved word and operator keyword as forbidden for enum literals, constants, package names, signals, variables, procedure arguments, ports, generics, and helper identifiers.',
  'If a design concept is naturally named after an operator or keyword, rename it into a safe descriptive identifier such as ALU_OP_AND, ALU_OP_XNOR, ALU_OP_SLL, ALU_OP_SRL, OP_SHIFT_LEFT, OP_SHIFT_RIGHT, check_name, or msg_name.',
  'Before returning the final answer, run a zero-tolerance self-audit across every generated VHDL file. If any file still contains a blocked construct, regenerate that whole file before responding.',
  'Blocked constructs include declarations after any architecture/process/subprogram `begin`, helper procedures/functions that mutate outer-scope state, output-port readback inside implementation logic, and signal/variable assignment operator misuse.',
  'Do not emit giant fallback prose, partial snippets, or pseudo-code in place of full VHDL files. Return complete saveable artifacts only.',
  'Do not insert explanatory prose inside VHDL declarations or executable statements. Keep comments on their own side of a valid `--` comment boundary after a syntactically complete VHDL statement.',
  'End design units with legal VHDL terminators only, for example `end package;`, `end package pkg_name;`, `end entity;`, or `end architecture rtl;`. Never append file extensions such as `.vhd` or `.vhdl` inside end statements.',
  'Use `<=` only for signals and `:=` only for variables/constants. Never assign to a variable with `<=` or to a signal with `:=`.',
];

const CODE_GENERATING_MACRO_IDS: AiMacroId[] = [
  'fpga_vhdl_architect',
  'generate_vhdl_tb',
  'generate_vhdl_assertions',
  'draft_rtl_skeleton',
];

export const SHARED_GHDL_CONFORMANCE_RULES = `## Shared GHDL Conformance Rules\n${SHARED_GHDL_CONFORMANCE_RULE_LIST.map((rule) => `- ${rule}`).join('\n')}`;
export const FPGA_ARCHITECT_EXTRA_GHDL_RULES = `## FPGA Architect Extra GHDL Rules\n${FPGA_ARCHITECT_EXTRA_GHDL_RULE_LIST.map((rule) => `- ${rule}`).join('\n')}`;
export const STRICT_CODE_GENERATION_RULES = `## Strict Code-Generation Rules\n${STRICT_CODE_GENERATION_RULE_LIST.map((rule) => `- ${rule}`).join('\n')}`;

export function isCodeGeneratingMacro(macroId: AiMacroId) {
  return CODE_GENERATING_MACRO_IDS.includes(macroId);
}

export function buildStrictRuleSection(title: string, rules: string[]) {
  return `## ${title}\n${rules.map((rule) => `- ${rule}`).join('\n')}`;
}

export function buildNumberedRuleList(rules: string[], startAt = 1) {
  return rules.map((rule, index) => `${startAt + index}. ${rule}`).join('\n');
}

export function buildCodeGeneratingMacroRuleList(macroId: AiMacroId) {
  const rules = [
    ...STRICT_CODE_GENERATION_RULE_LIST,
    ...SHARED_GHDL_CONFORMANCE_RULE_LIST,
    ...(macroId === 'fpga_vhdl_architect' ? FPGA_ARCHITECT_EXTRA_GHDL_RULE_LIST : []),
  ];
  return Array.from(new Set(rules));
}

export function buildCodeGeneratingMacroRuleSection(macroId: AiMacroId) {
  return buildStrictRuleSection('Strict GHDL / VHDL Rules', buildCodeGeneratingMacroRuleList(macroId));
}
