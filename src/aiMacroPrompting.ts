import type { AiMacroId, TbGenerationMode } from './aiMacros.ts';
import { getAiMacroSpec } from './aiMacros.ts';
import { detectCustomQueryMode } from './customQueryIntent.ts';

interface BuildMacroPromptContractParams {
  macroId: AiMacroId;
  userQuery: string;
  tbGenerationMode?: TbGenerationMode | null;
}

export function buildMacroPromptContract({
  macroId,
  userQuery,
  tbGenerationMode,
}: BuildMacroPromptContractParams) {
  const spec = getAiMacroSpec(macroId);
  const customQueryMode = macroId === 'custom_query' ? detectCustomQueryMode(userQuery) : null;
  const requiredSections = spec.expectedOutputSections.length > 0
    ? spec.expectedOutputSections.map((section) => `- ${section.label}`).join('\n')
    : '- Clear technical sections as appropriate';

  const macroHeader = [
    `### Active Macro`,
    `Macro ID: ${spec.id}`,
    `Macro Label: ${spec.label}`,
  ];

  if (macroId === 'generate_vhdl_tb') {
    macroHeader.push(`TB Generation Mode: ${tbGenerationMode || 'project_entities'}`);
  }

  const macroInstructions = [
    `### Macro Output Contract`,
    `You are answering under the "${spec.label}" macro contract.`,
    'You must include a `## Selected Skills` section that states the primary skill and any supporting skills actually used for this response.',
    'Preferred format:',
    '- Primary: <skill-name>',
    '- Supporting: <skill-name> - <reason>',
    `Required sections or equivalents:\n${requiredSections}`,
    spec.requiresVhdlCodeBlock
      ? 'Include at least one fenced code block tagged as `vhdl` and make it non-empty.'
      : 'Do not fabricate code unless the user explicitly asks for it.',
    macroId === 'custom_query' && customQueryMode === 'general_design'
      ? 'This is a general FPGA/VHDL design request. Use waveform, protocol, or hazard context only if the user explicitly asks for it or if it is directly relevant.'
      : spec.deterministicContext.hazardScan
      ? 'You must use the deterministic hazard scan as required grounding context.'
      : 'Hazard scan context is optional unless directly relevant.',
    macroId === 'custom_query' && customQueryMode === 'general_design'
      ? 'Do not force waveform decoding, protocol analysis, or logic-analyzer interpretation when the user is asking for general design help.'
      : spec.deterministicContext.protocolScan
      ? 'You must use the deterministic protocol pre-decode as required grounding context.'
      : 'Protocol pre-decode context is optional unless directly relevant.',
    macroId === 'inspect_race_hazards'
      ? 'If deterministic hazard findings exist, reference them explicitly. If none were found, explicitly say that no obvious hazards were detected.'
      : '',
    macroId === 'protocol_decoder_details'
      ? 'If deterministic protocol frames exist, reference the decoded frames explicitly. If none were decoded, explicitly say that no deterministic SPI/I2C/UART frames were decoded. If the decode is ambiguous, say so clearly.'
      : '',
    macroId === 'generate_vhdl_tb' && tbGenerationMode === 'reverse_from_vcd'
      ? 'For reverse-from-VCD mode, explain waveform-based assumptions before the module/testbench code and end with verification notes. Include a filename heading before each VHDL code block, such as "### inferred_module.vhd" and "### inferred_module_tb.vhd".'
      : '',
    macroId === 'generate_vhdl_tb' && tbGenerationMode === 'project_entities'
      ? 'For project-entity mode, prioritize entities present in the provided project context and end with verification notes. Include a filename heading before each VHDL code block, and ensure at least one generated filename ends with "_tb.vhd".'
      : '',
    macroId === 'verify_clock_reset_sequence'
      ? 'Explicitly inspect clock stability, reset assertion/deassertion timing, and whether reset release appears safely aligned to the observed clock behavior.'
      : '',
    macroId === 'explain_fsm_behavior'
      ? 'Infer likely states and transitions from the waveform evidence only. Do not overstate confidence when the state encoding is ambiguous. Include a Mermaid diagram artifact using a fenced `mermaid` block with `stateDiagram-v2`.'
      : '',
    macroId === 'summarize_protocol_timeline'
      ? 'Present protocol activity in time order and tie the explanation back to the deterministic protocol frame decode.'
      : '',
    macroId === 'generate_vhdl_assertions'
      ? 'Generate practical VHDL assertions that check the observed timing/protocol behavior and explain where they should be integrated. Include a filename heading immediately before each fenced `vhdl` block, such as "### protocol_assertions.vhd".'
      : '',
    macroId === 'draft_rtl_skeleton'
      ? 'Produce a VHDL entity/architecture skeleton that matches the apparent interface and behavior, marking uncertain behavior as assumptions. Include a filename heading immediately before each fenced `vhdl` block, such as "### inferred_rtl.vhd".'
      : '',
    macroId === 'suggest_debug_probes'
      ? 'Recommend the next probes, trigger conditions, and capture windows that would reduce uncertainty in the current debug session. Include both observable top-level signals and internal RTL signals that the next testbench/simulation should expose.'
      : '',
  ].filter(Boolean);

  return `${macroHeader.join('\n')}\n\n${macroInstructions.join('\n')}\n\nDeveloper's Query: "${userQuery}"`;
}
