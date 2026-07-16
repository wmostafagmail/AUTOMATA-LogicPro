import type { AiMacroId } from '../aiMacros';
import {
  buildAppOwnedSkeletonPromptSection,
  buildBehavioralReferenceModelPromptSection,
} from './vhdlAppOwnedTemplates';
import { inferFpgaArchitectureBlueprintFromPrompt } from './fpgaArchitectureBlueprint';

type VhdlGoldenTemplate = {
  id: string;
  title: string;
  appliesTo: Array<AiMacroId | 'all_code_macros' | 'runnable_artifacts'>;
  useWhen: string;
  contract: string[];
  template: string;
};

const CODE_GENERATING_MACROS: AiMacroId[] = [
  'fpga_vhdl_architect',
  'generate_vhdl_tb',
  'generate_vhdl_assertions',
  'draft_rtl_skeleton',
];

export const VHDL_GOLDEN_TEMPLATES: VhdlGoldenTemplate[] = [
  {
    id: 'single-clock-rtl-process',
    title: 'Single-clock RTL process',
    appliesTo: ['all_code_macros'],
    useWhen: 'RTL needs registered state, counters, flags, FIFOs, FSM state, or datapath registers.',
    contract: [
      'Use exactly one clock edge for one synchronous domain.',
      'Keep reset handling at the top of the clocked branch.',
      'Use clock-enable logic instead of generated clocks.',
    ],
    template: [
      'process(clk)',
      'begin',
      '  if rising_edge(clk) then',
      "    if rst = '1' then",
      '      state_reg <= IDLE;',
      '      data_reg  <= (others => \'0\');',
      "    elsif ce = '1' then",
      '      state_reg <= state_next;',
      '      data_reg  <= data_next;',
      '    end if;',
      '  end if;',
      'end process;',
    ].join('\n'),
  },
  {
    id: 'combinational-next-state',
    title: 'Combinational next-state/default assignment block',
    appliesTo: ['all_code_macros'],
    useWhen: 'RTL needs next-state, handshake, arbitration, muxing, or output decode logic.',
    contract: [
      'Use process(all) for combinational logic.',
      'Assign defaults before branches to prevent latches.',
      'Use typed unsigned/signed temporaries for arithmetic.',
    ],
    template: [
      'process(all)',
      'begin',
      '  state_next <= state_reg;',
      '  ready_o    <= \'0\';',
      '  valid_o    <= valid_reg;',
      '',
      '  case state_reg is',
      '    when IDLE =>',
      "      ready_o <= '1';",
      '    when others =>',
      '      state_next <= IDLE;',
      '  end case;',
      'end process;',
    ].join('\n'),
  },
  {
    id: 'package-and-body',
    title: 'Package declaration plus separate body',
    appliesTo: ['all_code_macros'],
    useWhen: 'Shared constants, types, records, helper functions, or procedures are needed across files.',
    contract: [
      'Package declarations contain declarations/signatures only.',
      'Function/procedure bodies go in a separate package body.',
      'Each file that uses logic/numeric types has its own local library/use clauses.',
    ],
    template: [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      '',
      'package design_pkg is',
      '  subtype byte_t is unsigned(7 downto 0);',
      '  function clamp8(value : unsigned) return byte_t;',
      'end package;',
      '',
      'package body design_pkg is',
      '  function clamp8(value : unsigned) return byte_t is',
      '  begin',
      '    return resize(value, 8);',
      '  end function;',
      'end package body;',
    ].join('\n'),
  },
  {
    id: 'typed-arithmetic-boundary',
    title: 'Typed numeric_std boundary',
    appliesTo: ['all_code_macros'],
    useWhen: 'Ports are std_logic_vector but internal logic needs arithmetic, resize, shifts, or comparisons.',
    contract: [
      'Convert raw std_logic_vector to unsigned/signed once at the boundary.',
      'Keep arithmetic in one typed domain.',
      'Convert back to std_logic_vector only at output boundaries.',
    ],
    template: [
      'variable a_u : unsigned(a_i\'range);',
      'variable b_u : unsigned(b_i\'range);',
      'variable y_u : unsigned(y_o\'range);',
      'begin',
      '  a_u := unsigned(a_i);',
      '  b_u := unsigned(b_i);',
      '  y_u := resize(a_u, y_u\'length) + resize(b_u, y_u\'length);',
      '  y_o <= std_logic_vector(y_u);',
    ].join('\n'),
  },
  {
    id: 'self-checking-testbench',
    title: 'Self-checking GHDL testbench skeleton',
    appliesTo: ['fpga_vhdl_architect', 'generate_vhdl_tb'],
    useWhen: 'A runnable testbench is emitted.',
    contract: [
      'Testbench entity has no ports.',
      'Helpers are declared before begin and use canonical formals.',
      'PASS uses severity note and std.env.stop(0); FAIL uses severity failure.',
    ],
    template: [
      'library ieee;',
      'use ieee.std_logic_1164.all;',
      'use ieee.numeric_std.all;',
      'use std.env.all;',
      '',
      'entity tb_design is end entity;',
      '',
      'architecture sim of tb_design is',
      '  signal clk : std_logic := \'0\';',
      '  signal rst : std_logic := \'1\';',
      '  procedure check_eq(',
      '    constant label_text : in string;',
      '    constant got        : in unsigned;',
      '    constant expected   : in unsigned;',
      '    variable failed_io  : inout boolean',
      '  ) is',
      '  begin',
      '    if got /= expected then',
      '      failed_io := true;',
      '      report "FAIL " & label_text severity error;',
      '    end if;',
      '  end procedure;',
      'begin',
      '  clk <= not clk after 5 ns;',
      '  stimulus : process',
      '    variable failed : boolean := false;',
      '  begin',
      '    rst <= \'1\'; wait for 20 ns;',
      '    rst <= \'0\'; wait until rising_edge(clk);',
      '    if failed then',
      '      report "TEST FAILED" severity failure;',
      '    else',
      '      report "TEST PASSED" severity note;',
      '      std.env.stop(0);',
      '    end if;',
      '  end process;',
      'end architecture;',
    ].join('\n'),
  },
];

function templateAppliesToMacro(template: VhdlGoldenTemplate, macroId: AiMacroId) {
  return template.appliesTo.includes(macroId)
    || template.appliesTo.includes('all_code_macros')
    || (template.appliesTo.includes('runnable_artifacts')
      && (macroId === 'fpga_vhdl_architect' || macroId === 'generate_vhdl_tb'));
}

export function getGoldenTemplatesForMacro(macroId: AiMacroId) {
  if (!CODE_GENERATING_MACROS.includes(macroId)) {
    return [];
  }
  return VHDL_GOLDEN_TEMPLATES.filter((template) => templateAppliesToMacro(template, macroId));
}

export function buildGoldenTemplatePromptSection(macroId: AiMacroId, params?: {
  maxTemplates?: number;
  heading?: string;
}) {
  const templates = getGoldenTemplatesForMacro(macroId).slice(0, params?.maxTemplates ?? 5);
  if (templates.length === 0) return '';

  return [
    `## ${params?.heading ?? 'Golden VHDL Templates'}`,
    'When a generated construct matches one of these common cases, copy the legal structure instead of inventing nearby syntax. Adapt names and widths only; preserve the VHDL legality pattern.',
    ...templates.map((template, index) => [
      `${index + 1}. ${template.title}`,
      `   Use when: ${template.useWhen}`,
      ...template.contract.map((line) => `   Contract: ${line}`),
      '   Template:',
      '```vhdl',
      template.template,
      '```',
    ].join('\n')),
  ].join('\n');
}

export function buildStructureFirstGenerationSection(macroId: AiMacroId) {
  if (!CODE_GENERATING_MACROS.includes(macroId)) return '';

  const architectLine = macroId === 'fpga_vhdl_architect'
    ? '- First internally plan the project manifest: file list, entity/package names, source order, top testbench, and expected PASS condition. Then emit code that exactly matches that plan.'
    : '- First internally plan the emitted artifact set, external dependencies, compile order, and expected PASS condition. Then emit code that exactly matches that plan.';

  return [
    '## Structure-First Generation Contract',
    architectLine,
    '- Do not start writing VHDL until the package/entity/interface/source-order plan is internally coherent.',
    '- Every `use work.<unit>.all` and every `entity work.<unit>` must correspond to a generated or selected source file in the compile plan.',
    '- Interfaces are source-of-truth: port maps, helper calls, and testbench stimulus must match declared types and widths exactly.',
    '- If the requested design is complex, keep each file small and cohesive rather than emitting one large monolithic VHDL file.',
  ].join('\n');
}

export function buildFileByFileGenerationSection(macroId: AiMacroId) {
  if (!CODE_GENERATING_MACROS.includes(macroId)) return '';

  return [
    '## File-By-File Generation Order',
    'Emit files in this dependency order and ensure `analysis_order` follows the same order:',
    '1. Shared packages and package declarations.',
    '2. Package bodies.',
    '3. Leaf RTL entities.',
    '4. Integrating/top RTL entities.',
    '5. Testbench support packages, if any.',
    '6. Top-level self-checking testbench.',
    '7. Scripts, Makefile, constraints, and concise docs.',
    'Never emit a dependent file before the file that declares its package/entity dependency.',
  ].join('\n');
}

export function buildStagedGenerationSection(macroId: AiMacroId) {
  if (!CODE_GENERATING_MACROS.includes(macroId)) return '';

  return [
    '## Staged Generation Protocol',
    'Generate the artifact in these internal stages. Do not skip stages and do not output partial prose in place of files.',
    '1. Interface stage: define packages, public constants, entities, generics, ports, and source order before writing behavior.',
    '2. RTL stage: implement leaf blocks first, then top integration, keeping one clock/reset discipline and typed numeric boundaries.',
    '3. Testbench stage: create a self-checking top testbench with legal helpers declared before begin, deterministic stimuli, PASS/FAIL reporting, and waveform output.',
    '4. Command stage: emit exact GHDL analyze, elaborate, and run commands that match the generated file list and top testbench.',
    '5. Self-audit stage: check every file against the semantic preflight checklist and known-good templates before final output.',
  ].join('\n');
}

export function buildDesignClassTemplateSection(macroId: AiMacroId, promptText?: string) {
  if (macroId !== 'fpga_vhdl_architect') return '';

  const blueprint = inferFpgaArchitectureBlueprintFromPrompt(promptText || '');
  const blockList = blueprint.buildingBlocks.slice(0, 8).join(', ');
  const verificationList = blueprint.verificationPlan.slice(0, 5).join('; ');

  return [
    '## Design-Class Golden Architecture Template',
    `Design class: ${blueprint.designClass}`,
    `Use this block-level template before writing files: ${blockList}.`,
    'Required top-level shape:',
    '- shared package for constants/types/records used by more than one file',
    '- one legal VHDL entity/architecture per RTL block unless a package body is explicitly required',
    '- top entity owns external ports and only instantiates/wires leaf blocks',
    '- testbench instantiates only the top entity and checks externally observable behavior',
    `Verification targets to encode in the self-checking TB: ${verificationList}.`,
    'If the requested design is too complex for one pass, implement the smallest complete legal version of every required block instead of omitting files or emitting placeholders.',
  ].join('\n');
}

export function buildSemanticValidationChecklistSection(macroId: AiMacroId) {
  if (!CODE_GENERATING_MACROS.includes(macroId)) return '';

  return [
    '## Semantic Preflight Checklist',
    'Before final output, verify these exact items across every generated VHDL file:',
    '- No declarations appear in an executable region after `begin` unless they are in a legal subprogram/process declarative part before that local `begin`.',
    '- No helper procedure/function mutates outer-scope objects unless those objects are explicit formal parameters with legal mode/kind.',
    '- No malformed formals such as `inout name : inout type`; use `variable name : inout type` or `signal name : out type` as appropriate.',
    '- No unconstrained mutable `variable x : string;` in a testbench.',
    '- No arithmetic, resize, shift, bitwise, or to_integer operation touches raw std_logic_vector without explicit unsigned/signed conversion.',
    '- No output port is read internally; use an internal mirror signal and drive the out port from it.',
    '- No package body content appears inside a package declaration.',
    '- No runnable project is missing GHDL analyze, elaborate, run, waveform, top_testbench, or expected_result metadata.',
  ].join('\n');
}

export function buildRepairScopeControlSection(macroId: AiMacroId) {
  if (!CODE_GENERATING_MACROS.includes(macroId)) return '';

  return [
    '## Repair Scope Control',
    '- Repair the smallest coherent file-local cluster that explains the validator/GHDL evidence.',
    '- Preserve already-passing files and stable public interfaces unless the exact failure proves the interface is illegal.',
    '- If multiple failures point to one helper/procedure/package/file, repair that whole coupled local cluster in one replacement.',
    '- Do not regenerate the whole project when a package split, helper formal rewrite, numeric conversion, or declaration move is sufficient.',
    '- If a dependency file is missing, add the missing dependency file and source-order entry instead of only editing analysis_order.',
  ].join('\n');
}

export function buildStrictFileLocalPatchContractSection(macroId: AiMacroId) {
  if (!CODE_GENERATING_MACROS.includes(macroId)) return '';

  return [
    '## Strict File-Local Replacement Contract',
    '- During repair, return only complete replacement content for files that have exact validator/GHDL evidence.',
    '- Do not return prose, diffs, JSON, broad regenerated projects, or unrelated files.',
    '- Preserve passing files byte-for-byte unless the exact failure requires a coupled dependency change.',
    '- If a generated helper/package/interface is illegal, repair the smallest same-file or directly dependent cluster and revalidate.',
    '- If no local repair is possible, say so through the macro failure path rather than inventing unrelated architecture.',
  ].join('\n');
}

export function buildGenerationQualityPromptSection(macroId: AiMacroId, params?: {
  includeGoldenTemplates?: boolean;
  includeRepairScope?: boolean;
  promptText?: string;
}) {
  return [
    buildStructureFirstGenerationSection(macroId),
    buildAppOwnedSkeletonPromptSection(macroId, params?.promptText),
    buildStagedGenerationSection(macroId),
    buildDesignClassTemplateSection(macroId, params?.promptText),
    buildFileByFileGenerationSection(macroId),
    params?.includeGoldenTemplates === false ? '' : buildGoldenTemplatePromptSection(macroId),
    buildBehavioralReferenceModelPromptSection(macroId, params?.promptText),
    buildSemanticValidationChecklistSection(macroId),
    buildStrictFileLocalPatchContractSection(macroId),
    params?.includeRepairScope ? buildRepairScopeControlSection(macroId) : '',
  ].filter((section) => section.trim().length > 0).join('\n\n');
}
