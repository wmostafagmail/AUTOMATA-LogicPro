import type { AiMacroId } from '../aiMacros';

type VhdlLegalIdiom = {
  id: string;
  title: string;
  appliesTo: Array<AiMacroId | 'all_code_macros' | 'runnable_artifacts'>;
  useWhen: string;
  avoid: string[];
  example: string;
};

const CODE_GENERATING_MACROS: AiMacroId[] = [
  'fpga_vhdl_architect',
  'generate_vhdl_tb',
  'generate_vhdl_assertions',
  'draft_rtl_skeleton',
];

export const VHDL_LEGAL_IDIOMS: VhdlLegalIdiom[] = [
  {
    id: 'tb-helper-procedure-formals',
    title: 'Self-checking TB helper procedure formals',
    appliesTo: ['fpga_vhdl_architect', 'generate_vhdl_tb'],
    useWhen: 'A generated testbench needs a local check helper that updates pass/fail bookkeeping.',
    avoid: [
      'Do not declare helpers after architecture/process begin.',
      'Do not write to outer-scope variables or signals from inside the helper.',
      'Do not emit malformed formals such as `inout test_failed_io : inout std_logic`.',
    ],
    example: [
      'procedure check_eq(',
      '  constant label_text : in string;',
      '  constant got        : in unsigned;',
      '  constant expected   : in unsigned;',
      '  variable failed_io  : inout boolean',
      ') is',
      'begin',
      '  if got /= expected then',
      '    failed_io := true;',
      '    report "FAIL " & label_text severity error;',
      '  end if;',
      'end procedure;',
    ].join('\n'),
  },
  {
    id: 'package-body-split',
    title: 'Package declaration and package body split',
    appliesTo: ['all_code_macros'],
    useWhen: 'A package exposes shared constants, types, or subprograms.',
    avoid: [
      'Do not put function/procedure bodies inside `package ... is`.',
      'Do not rely on library/use clauses from another file.',
    ],
    example: [
      'package design_pkg is',
      '  function to_opcode(value : natural) return unsigned;',
      'end package;',
      '',
      'package body design_pkg is',
      '  function to_opcode(value : natural) return unsigned is',
      '  begin',
      '    return to_unsigned(value, 4);',
      '  end function;',
      'end package body;',
    ].join('\n'),
  },
  {
    id: 'typed-numeric-operand-boundary',
    title: 'Typed numeric_std operand boundary',
    appliesTo: ['all_code_macros'],
    useWhen: 'RTL or helper code performs arithmetic, resize, shifts, or bitwise logic on vector ports.',
    avoid: [
      'Do not call `resize` on raw `std_logic_vector`.',
      'Do not apply bitwise operators to integers.',
      'Do not assign raw vector expressions into `unsigned` or `signed` objects.',
    ],
    example: [
      'variable a_u      : unsigned(a\'range);',
      'variable b_u      : unsigned(b\'range);',
      'variable result_u : unsigned(result\'range);',
      'begin',
      '  a_u := unsigned(a);',
      '  b_u := unsigned(b);',
      '  result_u := resize(a_u, result_u\'length) + resize(b_u, result_u\'length);',
      '  result <= std_logic_vector(result_u);',
    ].join('\n'),
  },
  {
    id: 'out-port-internal-mirror',
    title: 'Internal mirror for output ports',
    appliesTo: ['all_code_macros'],
    useWhen: 'Internal RTL logic needs to inspect a value that is also driven to an `out` port.',
    avoid: [
      'Do not read an `out` port in internal implementation logic.',
      'Do not derive flags from an output port that was just assigned.',
    ],
    example: [
      'signal done_i : std_logic := \'0\';',
      '',
      'done_o <= done_i;',
      '',
      'process(clk)',
      'begin',
      '  if rising_edge(clk) then',
      '    if rst = \'1\' then',
      '      done_i <= \'0\';',
      '    elsif done_i = \'0\' then',
      '      done_i <= next_done;',
      '    end if;',
      '  end if;',
      'end process;',
    ].join('\n'),
  },
  {
    id: 'ghdl-command-contract',
    title: 'Exact GHDL command contract',
    appliesTo: ['fpga_vhdl_architect', 'generate_vhdl_tb', 'runnable_artifacts'],
    useWhen: 'A macro emits runnable generated VHDL artifacts.',
    avoid: [
      'Do not describe simulation vaguely.',
      'Do not omit waveform output.',
      'Do not mix VHDL standards between analyze, elaborate, and run.',
    ],
    example: [
      'ghdl -a --std=08 --workdir=work src/design_pkg.vhd',
      'ghdl -a --std=08 --workdir=work src/design.vhd',
      'ghdl -a --std=08 --workdir=work tb/tb_design.vhd',
      'ghdl -e --std=08 --workdir=work tb_design',
      'ghdl -r --std=08 --workdir=work tb_design --vcd=waves/tb_design.vcd --stop-time=1us',
    ].join('\n'),
  },
  {
    id: 'clean-pass-fail-testbench',
    title: 'Clean PASS/FAIL testbench completion',
    appliesTo: ['fpga_vhdl_architect', 'generate_vhdl_tb'],
    useWhen: 'A generated testbench needs deterministic completion.',
    avoid: [
      'Do not use `severity failure` to report a passing test.',
      'Do not silently stop after failed assertions.',
    ],
    example: [
      'if failed then',
      '  report "TEST FAILED" severity failure;',
      'else',
      '  report "TEST PASSED" severity note;',
      '  std.env.stop(0);',
      'end if;',
    ].join('\n'),
  },
];

function idiomAppliesToMacro(idiom: VhdlLegalIdiom, macroId: AiMacroId) {
  return idiom.appliesTo.includes(macroId)
    || idiom.appliesTo.includes('all_code_macros')
    || (idiom.appliesTo.includes('runnable_artifacts')
      && (macroId === 'fpga_vhdl_architect' || macroId === 'generate_vhdl_tb'));
}

export function getLegalIdiomsForMacro(macroId: AiMacroId) {
  if (!CODE_GENERATING_MACROS.includes(macroId)) {
    return [];
  }
  return VHDL_LEGAL_IDIOMS.filter((idiom) => idiomAppliesToMacro(idiom, macroId));
}

export function buildLegalIdiomPromptSection(macroId: AiMacroId, params?: {
  maxIdioms?: number;
  heading?: string;
}) {
  const idioms = getLegalIdiomsForMacro(macroId).slice(0, params?.maxIdioms ?? 6);
  if (idioms.length === 0) {
    return '';
  }

  return [
    `## ${params?.heading ?? 'Known-Good VHDL Idioms To Copy'}`,
    'Use these legal patterns instead of inventing nearby syntax. If a generated construct resembles one of these cases, follow the idiom exactly unless the task explicitly requires a different legal form.',
    ...idioms.map((idiom, index) => [
      `${index + 1}. ${idiom.title}`,
      `   Use when: ${idiom.useWhen}`,
      ...idiom.avoid.map((item) => `   Avoid: ${item}`),
      '   Legal pattern:',
      '```vhdl',
      idiom.example,
      '```',
    ].join('\n')),
  ].join('\n');
}

