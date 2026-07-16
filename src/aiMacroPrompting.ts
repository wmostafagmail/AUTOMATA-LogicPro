import type { AiMacroId, TbGenerationMode } from './aiMacros.ts';
import { getAiMacroSpec } from './aiMacros.ts';
import { detectCustomQueryMode } from './customQueryIntent.ts';
import { LOCAL_LLM_JSON_GENERATION_CONTRACT, LOCAL_LLM_JSON_GENERATION_SKILL_NAME } from './server/jsonGenerationSkill.ts';
import {
  buildSharedCodeMacroRuleBundle,
  isCodeGeneratingMacro,
} from './server/vhdlSkillRules.ts';
import {
  buildArchitectureBlueprintPromptSection,
  buildConstrainedRegionPromptSection,
} from './server/fpgaArchitectureBlueprint.ts';

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
  const codeRuleBundle = isCodeGeneratingMacro(macroId)
    ? buildSharedCodeMacroRuleBundle(macroId, { promptText: userQuery })
    : null;
  const requiredSections = spec.expectedOutputSections.length > 0
    ? spec.expectedOutputSections.map((section) => `- ${section.label}`).join('\n')
    : '- Clear technical sections as appropriate';

  const macroHeader = [
    `### Active Macro`,
    `Macro ID: ${spec.id}`,
    `Macro Label: ${spec.label}`,
  ];

  if (macroId === 'fpga_vhdl_architect') {
    return `### Active Feature
Feature Mode: ${spec.id}
Feature Label: ${spec.label}

### FPGA Architect Workspace Contract
Your output will be loaded into an editable FPGA/VHDL workspace with a VHDL-aware code editor, file tabs, save support, and follow-up code chat.
Preferred output format: a Markdown project manifest with metadata plus one "# FILE:" section per generated file, each with a fenced full file body.
Do not add prose before or after the manifest.
Do not answer as a report-style macro. Do not produce "Selected Skills", executive summaries, markdown sections, or analysis cards.
Generate editable project files with complete file contents so the app can open them directly in the VHDL editor workspace.
Do not concentrate documentation or metadata into one very long Markdown or JSON file.
Instead, split it into:
- one short project-level overview file,
- one short top-level architecture file,
- one short unit-level Markdown file per major entity/package/unit,
- one short simulation/verification Markdown file,
- and one short machine-readable JSON metadata file for the GHDL plan.
Use the available skills registry to select only the skills needed for this task, but surface the actual selected skills through the app metadata rather than adding markdown sections in the model output.
The generated project must include requirements, architecture notes, synthesizable VHDL RTL, a self-checking VHDL testbench, GHDL scripts, and documentation.
The generated DUT and testbench must be GHDL-simulatable as written.
Any generated self-checking testbench must end cleanly with a success stop such as VHDL-2008 std.env.stop(0); never use severity failure to signal a passing run.
When checking synchronous behavior in a generated testbench, sample outputs only after the active clock edge update has taken effect.
Keep reset polarity/style and post-reset expectations consistent between the DUT and the testbench.

${codeRuleBundle?.commandContractSection || ''}

${codeRuleBundle?.legalIdiomSection || ''}

${codeRuleBundle?.generationQualitySection || ''}

${codeRuleBundle?.canonicalRuleContractSection || ''}

${codeRuleBundle?.strictRuleSection || ''}

${buildArchitectureBlueprintPromptSection({
  macroId: 'fpga_vhdl_architect',
  promptText: userQuery,
})}

${buildConstrainedRegionPromptSection('fpga_vhdl_architect')}

If you absolutely cannot produce the Markdown manifest format, fall back to strict JSON only and then obey this contract:
${LOCAL_LLM_JSON_GENERATION_CONTRACT}
Apply the ${LOCAL_LLM_JSON_GENERATION_SKILL_NAME} skill only for that strict JSON fallback.

Developer's Request:
${userQuery}`;
  }

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
      ? 'For reverse-from-VCD mode, explain waveform-based assumptions before the module/testbench code and end with verification notes. Include a filename heading before each VHDL code block, such as "### inferred_module.vhd" and "### inferred_module_tb.vhd". The generated DUT and TB must be GHDL-simulatable, with explicit reset behavior and a clean pass stop such as std.env.stop(0).'
      : '',
    macroId === 'generate_vhdl_tb' && tbGenerationMode === 'project_entities'
      ? 'For project-entity mode, prioritize entities present in the provided project context and end with verification notes. Include a filename heading before each VHDL code block, and ensure at least one generated filename ends with "_tb.vhd". Match the DUT reset style exactly, sample synchronous outputs after the relevant clock edge update, and end successful testbenches with a clean pass stop rather than severity failure.'
      : '',
    macroId === 'generate_vhdl_tb'
      ? `The app will automatically compile, elaborate, and simulate the generated DUT/testbench with GHDL. Only return output that should pass the full GHDL flow as written.`
      : '',
    macroId === 'generate_vhdl_assertions'
      ? `If you emit runnable assertion collateral or TB-integrated VHDL, include the exact GHDL validation plan.`
      : '',
    macroId === 'draft_rtl_skeleton'
      ? `If you emit a runnable RTL/TB validation pair, include the exact GHDL validation plan.`
      : '',
    codeRuleBundle?.commandContractSection || '',
    codeRuleBundle?.legalIdiomSection || '',
    codeRuleBundle?.generationQualitySection || '',
    codeRuleBundle?.canonicalRuleContractSection || '',
    codeRuleBundle?.strictRuleSection || '',
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
      ? 'Produce a VHDL entity/architecture skeleton that matches the apparent interface and behavior, marking uncertain behavior as assumptions. Include a filename heading immediately before each fenced `vhdl` block, such as "### inferred_rtl.vhd". Prefer explicit reset behavior and defined sequential initialization when the intended startup state is knowable.'
      : '',
    macroId === 'suggest_debug_probes'
      ? 'Recommend the next probes, trigger conditions, and capture windows that would reduce uncertainty in the current debug session. Include both observable top-level signals and internal RTL signals that the next testbench/simulation should expose.'
      : '',
  ].filter(Boolean);

  return `${macroHeader.join('\n')}\n\n${macroInstructions.join('\n')}\n\nDeveloper's Query: "${userQuery}"`;
}
