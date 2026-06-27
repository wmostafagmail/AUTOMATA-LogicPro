export type AiMacroId =
  | 'custom_query'
  | 'generate_vhdl_tb'
  | 'inspect_race_hazards'
  | 'protocol_decoder_details'
  | 'verify_clock_reset_sequence'
  | 'explain_fsm_behavior'
  | 'summarize_protocol_timeline'
  | 'generate_vhdl_assertions'
  | 'draft_rtl_skeleton'
  | 'suggest_debug_probes';

export type TbGenerationMode = 'project_entities' | 'reverse_from_vcd';

export interface AiMacroSpec {
  id: AiMacroId;
  label: string;
  defaultPrompt: string;
  launchMode: 'direct' | 'composer';
  deterministicContext: {
    hazardScan: boolean;
    protocolScan: boolean;
    projectContext: boolean;
    waveform: boolean;
  };
  expectedOutputSections: Array<{
    id: string;
    label: string;
    aliases: string[];
  }>;
  requiresVhdlCodeBlock: boolean;
  requiresMermaidDiagram?: boolean;
  generatedArtifactDirectory?: string | null;
  rubric: string[];
}

export interface AiMacroValidationCheck {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail' | 'not_applicable';
  detail: string;
}

export interface AiMacroValidationResult {
  macroId: AiMacroId;
  status: 'pass' | 'warn' | 'fail';
  summary: string;
  warnings: string[];
  checks: AiMacroValidationCheck[];
}

export interface HazardFindingLike {
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
}

export interface ProtocolFrameLike {
  protocol: 'SPI' | 'I2C' | 'UART';
  channel: string;
  startTick: number;
  endTick: number;
  summary: string;
  detail: string;
}

export const AI_MACROS: AiMacroSpec[] = [
  {
    id: 'custom_query',
    label: 'Custom Query',
    defaultPrompt: '',
    launchMode: 'direct',
    deterministicContext: {
      hazardScan: true,
      protocolScan: true,
      projectContext: true,
      waveform: true,
    },
    expectedOutputSections: [],
    requiresVhdlCodeBlock: false,
    rubric: [
      'Use the loaded waveform and project context.',
      'Keep the answer technical, grounded, and actionable.',
    ],
  },
  {
    id: 'generate_vhdl_tb',
    label: 'Generate TB',
    defaultPrompt: '',
    launchMode: 'composer',
    deterministicContext: {
      hazardScan: false,
      protocolScan: false,
      projectContext: true,
      waveform: true,
    },
    expectedOutputSections: [
      { id: 'assumptions', label: 'Assumptions', aliases: ['assumptions', 'key assumptions'] },
      { id: 'generated_artifacts', label: 'Generated Artifact(s)', aliases: ['generated artifacts', 'generated artifact', 'vhdl module', 'vhdl testbench', 'testbench'] },
      { id: 'verification_notes', label: 'Verification Notes', aliases: ['verification notes', 'validation notes', 'verification'] },
    ],
    requiresVhdlCodeBlock: true,
    generatedArtifactDirectory: 'AI Generated TB',
    rubric: [
      'State assumptions before code.',
      'Include usable VHDL code blocks.',
      'Explain how the generated artifacts should be verified.',
    ],
  },
  {
    id: 'inspect_race_hazards',
    label: 'Inspect Hazards',
    defaultPrompt: 'Analyze these signal waveforms for theoretical propagation delays, hazard spikes, hold/setup timing violations, or asynchronous synchronization issues.',
    launchMode: 'direct',
    deterministicContext: {
      hazardScan: true,
      protocolScan: false,
      projectContext: false,
      waveform: true,
    },
    expectedOutputSections: [
      { id: 'hazard_summary', label: 'Hazard Summary', aliases: ['hazard summary', 'summary of hazards', 'hazard findings'] },
      { id: 'root_causes', label: 'Suspected Root Causes', aliases: ['suspected root causes', 'root causes', 'cause analysis'] },
      { id: 'recommended_fixes', label: 'Recommended Fixes', aliases: ['recommended fixes', 'fixes', 'recommended mitigations'] },
    ],
    requiresVhdlCodeBlock: false,
    rubric: [
      'Reference the deterministic hazard scan.',
      'Do not invent signals or hazards.',
      'Offer concrete fixes or explicitly state that no obvious hazards were detected.',
    ],
  },
  {
    id: 'protocol_decoder_details',
    label: 'Decode Protocol',
    defaultPrompt: 'Verify the signal transition intervals and decode the protocol sequences inside the waveform log. Highlight any byte transitions or framing structure.',
    launchMode: 'direct',
    deterministicContext: {
      hazardScan: false,
      protocolScan: true,
      projectContext: false,
      waveform: true,
    },
    expectedOutputSections: [
      { id: 'decoded_frames', label: 'Decoded Frames', aliases: ['decoded frames', 'frame decode', 'frames'] },
      { id: 'protocol_interpretation', label: 'Protocol Interpretation', aliases: ['protocol interpretation', 'interpretation', 'meaning'] },
      { id: 'anomalies_uncertainty', label: 'Anomalies / Uncertainty', aliases: ['anomalies', 'uncertainty', 'anomalies / uncertainty'] },
    ],
    requiresVhdlCodeBlock: false,
    rubric: [
      'Reference the deterministic protocol pre-decode.',
      'Interpret decoded frames when present.',
      'State uncertainty explicitly when the decode is ambiguous or empty.',
    ],
  },
  {
    id: 'verify_clock_reset_sequence',
    label: 'Check Clock/Reset',
    defaultPrompt: 'Inspect the loaded waveform and verify whether the clock and reset behavior look stable and release in a safe order for startup.',
    launchMode: 'direct',
    deterministicContext: {
      hazardScan: true,
      protocolScan: false,
      projectContext: false,
      waveform: true,
    },
    expectedOutputSections: [
      { id: 'observed_sequence', label: 'Observed Sequence', aliases: ['observed sequence', 'clock/reset sequence', 'startup sequence'] },
      { id: 'risks', label: 'Risks', aliases: ['risks', 'startup risks', 'timing risks'] },
      { id: 'recommendations', label: 'Recommendations', aliases: ['recommendations', 'recommended fixes', 'next steps'] },
    ],
    requiresVhdlCodeBlock: false,
    rubric: [
      'Describe clock stability and reset release ordering.',
      'Reference actual waveform behavior.',
      'Call out startup risks or explicitly state that startup looks clean.',
    ],
  },
  {
    id: 'explain_fsm_behavior',
    label: 'Explain FSM',
    defaultPrompt: 'Infer the likely finite state machine behavior from the loaded waveform and explain the states, transitions, and uncertain areas.',
    launchMode: 'direct',
    deterministicContext: {
      hazardScan: false,
      protocolScan: false,
      projectContext: false,
      waveform: true,
    },
    expectedOutputSections: [
      { id: 'likely_states', label: 'Likely States', aliases: ['likely states', 'states', 'state interpretation'] },
      { id: 'transition_evidence', label: 'Transition Evidence', aliases: ['transition evidence', 'state transitions', 'evidence'] },
      { id: 'state_diagram', label: 'State Diagram', aliases: ['state diagram', 'fsm diagram', 'diagram artifact'] },
      { id: 'uncertainty', label: 'Uncertainty', aliases: ['uncertainty', 'open questions', 'confidence'] },
    ],
    requiresVhdlCodeBlock: false,
    requiresMermaidDiagram: true,
    rubric: [
      'Infer states from waveform evidence rather than inventing them.',
      'Explain transitions in time order.',
      'Include a state diagram artifact.',
      'State uncertainty where the waveform is ambiguous.',
    ],
  },
  {
    id: 'summarize_protocol_timeline',
    label: 'Protocol Timeline',
    defaultPrompt: 'Summarize the decoded protocol activity as a time-ordered transaction timeline and explain what the traffic appears to be doing.',
    launchMode: 'direct',
    deterministicContext: {
      hazardScan: false,
      protocolScan: true,
      projectContext: false,
      waveform: true,
    },
    expectedOutputSections: [
      { id: 'timeline_summary', label: 'Timeline Summary', aliases: ['timeline summary', 'protocol timeline', 'time-ordered summary'] },
      { id: 'decoded_transactions', label: 'Decoded Transactions', aliases: ['decoded transactions', 'transactions', 'decoded frames'] },
      { id: 'anomalies_uncertainty', label: 'Anomalies / Uncertainty', aliases: ['anomalies', 'uncertainty', 'anomalies / uncertainty'] },
    ],
    requiresVhdlCodeBlock: false,
    rubric: [
      'Use the deterministic protocol pre-decode as grounding.',
      'Summarize transactions in time order.',
      'Make ambiguity explicit when traffic is partial or mixed.',
    ],
  },
  {
    id: 'generate_vhdl_assertions',
    label: 'VHDL Assertions',
    defaultPrompt: 'Generate practical VHDL assertions for the currently observed timing behavior, protocol framing, and hazard-sensitive conditions.',
    launchMode: 'direct',
    deterministicContext: {
      hazardScan: true,
      protocolScan: true,
      projectContext: true,
      waveform: true,
    },
    expectedOutputSections: [
      { id: 'assumptions', label: 'Assumptions', aliases: ['assumptions', 'scope assumptions'] },
      { id: 'assertions', label: 'Assertions', aliases: ['assertions', 'vhdl assertions', 'generated assertions'] },
      { id: 'verification_notes', label: 'Verification Notes', aliases: ['verification notes', 'usage notes', 'verification'] },
    ],
    requiresVhdlCodeBlock: true,
    generatedArtifactDirectory: 'AI Generated Assertions',
    rubric: [
      'Produce usable VHDL assertion code blocks.',
      'Tie assertions to observed timing/protocol behavior.',
      'Explain how to integrate and evaluate them.',
    ],
  },
  {
    id: 'draft_rtl_skeleton',
    label: 'RTL Skeleton',
    defaultPrompt: 'Draft a VHDL RTL skeleton that matches the apparent interface and behavior visible in the loaded waveform and any project context.',
    launchMode: 'direct',
    deterministicContext: {
      hazardScan: false,
      protocolScan: true,
      projectContext: true,
      waveform: true,
    },
    expectedOutputSections: [
      { id: 'assumptions', label: 'Assumptions', aliases: ['assumptions', 'design assumptions'] },
      { id: 'entity_skeleton', label: 'Entity Skeleton', aliases: ['entity skeleton', 'entity', 'interface skeleton'] },
      { id: 'architecture_outline', label: 'Architecture Outline', aliases: ['architecture outline', 'architecture', 'implementation outline'] },
      { id: 'verification_notes', label: 'Verification Notes', aliases: ['verification notes', 'validation notes', 'verification'] },
    ],
    requiresVhdlCodeBlock: true,
    generatedArtifactDirectory: 'AI Generated RTL',
    rubric: [
      'Produce a VHDL-oriented skeleton grounded in visible behavior.',
      'Keep uncertain internals clearly marked as assumptions.',
      'End with verification guidance.',
    ],
  },
  {
    id: 'suggest_debug_probes',
    label: 'Debug Probes',
    defaultPrompt: 'Suggest the next internal probes, trigger conditions, and capture plan that would best reduce uncertainty in this waveform debug session.',
    launchMode: 'direct',
    deterministicContext: {
      hazardScan: true,
      protocolScan: true,
      projectContext: true,
      waveform: true,
    },
    expectedOutputSections: [
      { id: 'blind_spots', label: 'Blind Spots', aliases: ['blind spots', 'missing visibility', 'current blind spots'] },
      { id: 'recommended_probes', label: 'Recommended Probes', aliases: ['recommended probes', 'probes', 'signals to add'] },
      { id: 'capture_plan', label: 'Capture Plan', aliases: ['capture plan', 'next capture plan', 'trigger plan'] },
    ],
    requiresVhdlCodeBlock: false,
    rubric: [
      'Use current hazard/protocol evidence to justify the next probes.',
      'Recommend concrete signals or internal nodes.',
      'Provide an actionable next capture strategy.',
    ],
  },
];

export function getAiMacroSpec(macroId: AiMacroId | null | undefined) {
  return AI_MACROS.find((macro) => macro.id === macroId) || AI_MACROS[0];
}

export function getVisibleAiMacros() {
  return AI_MACROS.filter((macro) => macro.id !== 'custom_query');
}

export function getMacroLaunchMode(macroId: AiMacroId) {
  return getAiMacroSpec(macroId).launchMode;
}
