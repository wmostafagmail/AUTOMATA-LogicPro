import type { AiMacroId } from '../aiMacros';
import { inferFpgaArchitectureBlueprintFromPrompt } from './fpgaArchitectureBlueprint';

const CODE_GENERATING_MACROS: AiMacroId[] = [
  'fpga_vhdl_architect',
  'generate_vhdl_tb',
  'generate_vhdl_assertions',
  'draft_rtl_skeleton',
];

type ReferenceModelPreset = {
  keywords: RegExp[];
  designClass: string;
  modelContract: string[];
  tbChecks: string[];
};

const REFERENCE_MODEL_PRESETS: ReferenceModelPreset[] = [
  {
    keywords: [/\balu\b/i, /arithmetic\s*logic/i],
    designClass: 'alu',
    modelContract: [
      'Represent operands as unsigned/signed variables before every operation.',
      'Compute expected result and flags in the testbench before sampling DUT outputs.',
      'Check every requested opcode and at least one boundary case such as zero, carry/borrow, or overflow.',
    ],
    tbChecks: [
      'procedure apply_and_check(op, a, b, expected_y, expected_flags)',
      'wait until rising_edge(clk); wait for 1 ns; then compare externally visible DUT outputs',
      'report TEST PASSED and call std.env.stop(0) only after all opcode checks pass',
    ],
  },
  {
    keywords: [/\buart\b.*\bspi\b/i, /\bspi\b.*\buart\b/i, /protocol\s*bridge/i],
    designClass: 'uart_spi_protocol_bridge',
    modelContract: [
      'Model UART input as byte-level command transactions, not analog serial timing unless explicitly requested.',
      'Model SPI expected behavior as ordered chip-select, shift, and response transactions.',
      'Track FIFO occupancy, backpressure, busy, error, and data_available state with explicit counters/booleans.',
    ],
    tbChecks: [
      'send one nominal command and check one SPI transaction is emitted in order',
      'exercise FIFO full/backpressure or empty behavior deterministically',
      'verify error/status flags clear or latch exactly as the spec says',
    ],
  },
  {
    keywords: [/\bcpu\b/i, /\brisc/i, /\bprocessor\b/i, /\binstruction\b/i],
    designClass: 'cpu_core',
    modelContract: [
      'Use a tiny deterministic instruction program as the reference behavior.',
      'Track expected PC, register-file writes, ALU result, and memory-visible side effects.',
      'Keep instruction encoding small and documented inside the package/testbench.',
    ],
    tbChecks: [
      'reset fetch state is deterministic',
      'execute a short program and check final register/memory state',
      'check at least one ALU instruction and one control-flow or memory instruction when present',
    ],
  },
  {
    keywords: [/\bvga\b/i, /\bhdmi\b/i, /video/i, /framebuffer/i],
    designClass: 'video_pattern_generator',
    modelContract: [
      'Use counters to model expected h_count, v_count, active_video, sync pulses, and pixel address.',
      'Do not rely on visual inspection; compare representative timing points numerically.',
      'Document timing constants and keep them small in TB-friendly compact mode.',
    ],
    tbChecks: [
      'check sync pulse start/end points',
      'check active window boundaries',
      'check representative pixel address/data inside active video',
    ],
  },
  {
    keywords: [/\bdsp\b/i, /\bfir\b/i, /\bfft\b/i, /filter/i],
    designClass: 'dsp_chain',
    modelContract: [
      'Use signed/fixed-point variables with explicit width and scaling comments.',
      'Track pipeline latency with a valid shift register in the reference model.',
      'Compare a short deterministic impulse/step/sample sequence rather than random data.',
    ],
    tbChecks: [
      'check reset clears pipeline-valid state',
      'check representative numeric output after documented latency',
      'check output_valid alignment with expected reference sample',
    ],
  },
  {
    keywords: [/\baxi\b/i, /axis/i, /stream/i, /packet\s*router/i, /network\s*switch/i],
    designClass: 'axi_stream_router',
    modelContract: [
      'Represent packets as ordered records: destination, payload, last, and expected egress.',
      'Track valid/ready handshakes; valid must remain stable until accepted.',
      'Model backpressure and arbitration state explicitly.',
    ],
    tbChecks: [
      'route one packet to the expected egress',
      'hold downstream ready low and confirm input/output stability',
      'exercise contention and verify deterministic arbitration order',
    ],
  },
];

function findReferencePreset(promptText: string) {
  return REFERENCE_MODEL_PRESETS.find((preset) => (
    preset.keywords.some((keyword) => keyword.test(promptText))
  )) || null;
}

function bulletLines(items: string[]) {
  return items.map((item) => `- ${item}`);
}

export function buildAppOwnedSkeletonPromptSection(macroId: AiMacroId, promptText?: string) {
  if (!CODE_GENERATING_MACROS.includes(macroId)) return '';

  const blueprint = inferFpgaArchitectureBlueprintFromPrompt(promptText || '');
  if (macroId !== 'fpga_vhdl_architect') {
    const artifactScope = macroId === 'generate_vhdl_tb'
      ? 'self-checking testbench artifact'
      : macroId === 'generate_vhdl_assertions'
        ? 'VHDL assertion/checker artifact'
        : 'synthesizable RTL skeleton artifact';

    return [
      '## App-Owned Skeleton-First Contract',
      `Skeleton scope: ${artifactScope}.`,
      'Use the app-owned artifact shape for this macro instead of inventing a new workflow.',
      'Required skeleton regions:',
      '- File header region: local IEEE library/use clauses required by the file contents.',
      '- Interface region: exact entity/package/procedure interfaces that match supplied project context.',
      '- Implementation region: complete legal VHDL for the requested artifact only.',
      '- Verification metadata region: exact GHDL command metadata when the artifact is runnable.',
      'Constrained-region rule: keep output limited to the requested artifact and its directly required support declarations; do not regenerate unrelated project files.',
    ].join('\n');
  }

  return [
    '## App-Owned Skeleton-First Contract',
    'Use this app-owned scaffold as the generation frame. The LLM may fill constrained behavior regions, but must not invent a different project shape.',
    `Skeleton design class: ${blueprint.designClass}`,
    'Required skeleton regions:',
    '- Package region: constants, subtypes, records, enums, and pure helper signatures only.',
    '- Leaf RTL regions: one entity/architecture per required block, with constrained ports and no testbench-only constructs.',
    '- Top integration region: only public ports, internal mirror signals, component/entity instantiations, and wiring.',
    '- Testbench region: clock/reset, reference model, stimulus, scoreboarding, PASS/FAIL, timeout, waveform-ready GHDL plan.',
    '- Docs/scripts region: concise README/plan plus app-owned GHDL command metadata.',
    'Constrained-region rule: if a region is unclear, emit the smallest complete legal implementation for that region rather than prose, TODOs, placeholders, or omitted files.',
  ].join('\n');
}

export function buildBehavioralReferenceModelPromptSection(macroId: AiMacroId, promptText?: string) {
  if (!CODE_GENERATING_MACROS.includes(macroId)) return '';

  const preset = findReferencePreset(promptText || '');
  const common = [
    '## Behavioral Reference Model Contract',
    'Every runnable testbench must contain a simple deterministic expected-behavior model. It can be compact, but it must be executable VHDL logic, not prose.',
    '- Compute expected values in testbench variables/signals using legal VHDL before comparing DUT outputs.',
    '- Compare only externally observable DUT outputs and status signals.',
    '- Preserve assertions/checks during repair; fix the DUT/TB logic instead of weakening the check.',
  ];

  if (!preset) {
    return [
      ...common,
      '- For generic designs, model reset behavior, one nominal transaction/path, and one boundary/error path when applicable.',
      '- End with a deterministic TEST PASSED path and std.env.stop(0).',
    ].join('\n');
  }

  return [
    ...common,
    `Reference design class: ${preset.designClass}`,
    'Expected model contract:',
    ...bulletLines(preset.modelContract),
    'Required self-checking TB checks:',
    ...bulletLines(preset.tbChecks),
  ].join('\n');
}
