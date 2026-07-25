export type CuratedPatternBlock = {
  id: string;
  kind: 'package' | 'rtl' | 'top' | 'testbench';
  responsibility: string;
  owns?: string[];
};

export type CuratedDesignPattern = {
  patternId: string;
  designClass: string;
  family?: 'communication' | 'bus' | 'compute' | 'dsp' | 'memory' | 'video_audio' | 'control' | 'soc' | 'sensors' | 'safety' | 'verification' | 'generic';
  specificity?: 'broad' | 'subsystem' | 'leaf';
  composesWith?: string[];
  keywords: RegExp[];
  systemRole: string;
  requiredBlocks: CuratedPatternBlock[];
  optionalBlocks: string[];
  externalInterfaces: string[];
  internalConnections: string[];
  topOutputOwnership: string[];
  timingContracts: string[];
  clockResetPolicy: string[];
  filePlan: string[];
  verificationScenarios: string[];
  methodologyTags: string[];
  referenceTags: string[];
};

export type CuratedMethodologyRule = {
  ruleId: string;
  title: string;
  guidanceType: 'hierarchy' | 'clock_reset' | 'interface' | 'cdc' | 'numeric' | 'memory' | 'verification' | 'tool_flow';
  summary: string;
  sourceTitle: string;
  sourceUrl: string;
  tags: string[];
};

export type CuratedReferenceDesign = {
  referenceId: string;
  title: string;
  vendor: string;
  sourceUrl: string;
  designClasses: string[];
  summary: string;
  contractImplications: string[];
  tags: string[];
};

export type CuratedEvidenceClaim = {
  claimId: string;
  sourceId: string;
  sourceTitle: string;
  sourceUrl: string;
  guidanceType: string;
  summary: string;
  contractImplication: string;
};

export type CuratedArchitectureSynthesis = {
  synthesisId: string;
  sourceMode: 'curated_first_hybrid';
  retrievalMode?: 'off' | 'official_live_opt_in' | 'official_live_cached';
  retrievedSourceIds?: string[];
  sourceSnapshotIds?: string[];
  sourceHashes?: string[];
  evidenceFreshness?: string;
  primaryPattern: CuratedDesignPattern;
  secondaryPatterns: CuratedDesignPattern[];
  methodologyRules: CuratedMethodologyRule[];
  referenceDesigns: CuratedReferenceDesign[];
  evidenceClaims: CuratedEvidenceClaim[];
  confidence: number;
  blueprint: {
    designClass: string;
    systemRole: string;
    buildingBlocks: string[];
    externalInterfaces: string[];
    internalContracts: string[];
    clockResetRules: string[];
    filePlan: string[];
    verificationPlan: string[];
    patternId: string;
    matchedPatternIds: string[];
    methodologyRuleIds: string[];
    referenceDesignIds: string[];
    evidenceClaimIds: string[];
    topOutputOwnership: string[];
    timingContracts: string[];
  };
};

const GENERIC_PATTERN: CuratedDesignPattern = {
  patternId: 'pattern_generic_fpga_system',
  designClass: 'generic_fpga_vhdl_system',
  keywords: [],
  systemRole: 'Implement the requested FPGA/VHDL system with explicit hierarchy, deterministic interfaces, and a self-checking GHDL validation flow.',
  requiredBlocks: [
    { id: 'shared_package', kind: 'package', responsibility: 'Define public constants, types, records, and numeric formats.' },
    { id: 'leaf_rtl_blocks', kind: 'rtl', responsibility: 'Implement cohesive leaf RTL blocks with typed entity interfaces.' },
    { id: 'top_integration', kind: 'top', responsibility: 'Own top-level public ports, instantiate RTL leaves, and wire all outputs deterministically.' },
    { id: 'self_checking_testbench', kind: 'testbench', responsibility: 'Prove reset and at least one nominal scenario with deterministic PASS/FAIL checks.' },
  ],
  optionalBlocks: ['control/status register block', 'debug/status observability block'],
  externalInterfaces: [
    'single primary clock input',
    'explicit reset input matching the selected reset style',
    'typed, constrained data/control ports',
    'status or done/error outputs when behavior is transaction-oriented',
  ],
  internalConnections: [
    'all leaf blocks expose typed entity ports with explicit widths',
    'top-level port maps exactly match declared formal types and widths',
    'shared packages are analyzed before all dependent RTL and testbench files',
  ],
  topOutputOwnership: [
    'top-level outputs must be driven by a child output, a declared internal signal, or explicit app-owned registered status behavior',
  ],
  timingContracts: [
    'reset behavior and nominal latency must be bounded in cycles before VHDL generation',
  ],
  clockResetPolicy: [
    'use one synchronous clock domain unless the user explicitly requests multiple domains',
    'do not generate gated clocks; use clock-enable signals',
    'reset every state register, output mirror, counter, and valid/error flag deterministically',
  ],
  filePlan: [
    'src/<project>_pkg.vhd for shared public constants/types only',
    'src/<leaf>.vhd for each leaf RTL entity',
    'src/<top>.vhd for integration and top-level port ownership',
    'tb/tb_<top>.vhd for the self-checking testbench',
    'sim/ghdl_plan.json and sim/run_ghdl.sh for the exact GHDL flow',
  ],
  verificationScenarios: [
    'compile every generated VHDL file in dependency order with --std=08',
    'elaborate the top-level testbench entity',
    'simulate with a waveform output and deterministic PASS/FAIL result',
    'check reset behavior, at least one nominal behavior path, and at least one boundary/error path when applicable',
  ],
  methodologyTags: ['hierarchy', 'clock_reset', 'interface', 'verification', 'tool_flow'],
  referenceTags: ['generic'],
};

const CORE_CURATED_DESIGN_PATTERNS: CuratedDesignPattern[] = [
  {
    patternId: 'pattern_protocol_bridge_uart_spi',
    designClass: 'uart_spi_protocol_bridge',
    family: 'communication',
    specificity: 'subsystem',
    composesWith: [],
    keywords: [/\buart\b.*\bspi\b/i, /\bspi\b.*\buart\b/i, /protocol\s*bridge/i],
    systemRole: 'Bridge UART-framed commands to an SPI master transaction path with buffering, control FSMs, and deterministic error reporting.',
    requiredBlocks: [
      { id: 'bridge_pkg', kind: 'package', responsibility: 'Define command/status constants, FIFO depths, byte subtype, and bridge state types.' },
      { id: 'uart_rx', kind: 'rtl', responsibility: 'Receive UART frames and expose valid byte events.' },
      { id: 'uart_tx', kind: 'rtl', responsibility: 'Transmit response/status bytes when the bridge completes or reports an error.' },
      { id: 'spi_master', kind: 'rtl', responsibility: 'Own SPI clock/chip-select sequencing and byte transfer control.' },
      { id: 'tx_fifo', kind: 'rtl', responsibility: 'Buffer command bytes with bounded pointer/index logic.' },
      { id: 'rx_fifo', kind: 'rtl', responsibility: 'Buffer response bytes with bounded pointer/index logic.' },
      { id: 'bridge_control_fsm', kind: 'rtl', responsibility: 'Own transaction lifecycle, start/done/error timing, and block handshakes.', owns: ['done_o', 'error_o'] },
      { id: 'status_error_block', kind: 'rtl', responsibility: 'Own registered status byte and nominal/error status encoding.', owns: ['status_o'] },
      { id: 'bridge_top', kind: 'top', responsibility: 'Instantiate UART, SPI, FIFO, control, and status blocks with exact typed maps.' },
      { id: 'tb_bridge_top', kind: 'testbench', responsibility: 'Self-check reset, nominal command completion, status byte, and error-free SPI transaction.' },
    ],
    optionalBlocks: ['baud-rate tick generator', 'command parser', 'response formatter'],
    externalInterfaces: ['clock/reset', 'uart_rx_i/uart_tx_o', 'spi_sclk_o/spi_mosi_o/spi_miso_i/spi_cs_o', 'start/data/status observability ports'],
    internalConnections: [
      'control FSM consumes UART/FIFO command-valid events and drives SPI start',
      'status block receives control done/error events and drives exactly one registered status byte',
      'FIFO pointers use constrained integer/natural ranges or guarded unsigned conversions',
    ],
    topOutputOwnership: [
      'bridge_control_fsm or top status logic owns done_o and error_o',
      'status_error_block owns status_o with x"00" after reset and x"01" after nominal completion',
    ],
    timingContracts: [
      'done_o asserts within four rising clock edges after a valid start_i pulse for the app-owned nominal command',
      'error_o remains 0 for the app-owned nominal command x"5A"',
      'status_o is x"00" during reset/idle and x"01" after one completed nominal command',
    ],
    clockResetPolicy: GENERIC_PATTERN.clockResetPolicy,
    filePlan: ['src/bridge_pkg.vhd', 'src/uart_rx.vhd', 'src/uart_tx.vhd', 'src/spi_master.vhd', 'src/tx_fifo.vhd', 'src/rx_fifo.vhd', 'src/bridge_control_fsm.vhd', 'src/status_error_block.vhd', 'src/bridge_top.vhd', 'tb/tb_bridge_top.vhd'],
    verificationScenarios: ['reset status/default checks', 'nominal command x"5A" completes in the bounded window', 'FIFO backpressure is exercised without weakening nominal checks'],
    methodologyTags: ['hierarchy', 'clock_reset', 'interface', 'memory', 'verification', 'tool_flow'],
    referenceTags: ['protocol', 'uart', 'spi'],
  },
  {
    patternId: 'pattern_cpu_core_small',
    designClass: 'cpu_core',
    family: 'soc',
    specificity: 'subsystem',
    composesWith: [],
    keywords: [/\bcpu\b/i, /\brisc/i, /\bprocessor\b/i, /\binstruction\b/i],
    systemRole: 'Implement a small CPU with explicit fetch/decode/execute/writeback architecture and deterministic memory/testbench behavior.',
    requiredBlocks: [
      { id: 'cpu_pkg', kind: 'package', responsibility: 'Define instruction width, data/address subtypes, opcode constants, and CPU state types.' },
      { id: 'program_counter', kind: 'rtl', responsibility: 'Own reset PC value, increment/branch update, and fetch address timing.' },
      { id: 'instruction_memory_interface', kind: 'rtl', responsibility: 'Provide deterministic ROM/program stimulus or instruction-memory handshake.' },
      { id: 'decoder', kind: 'rtl', responsibility: 'Decode opcodes into typed control signals without enum/numeric_std misuse.' },
      { id: 'register_file', kind: 'rtl', responsibility: 'Own register storage, read ports, and write-enable/write-data contract.' },
      { id: 'alu', kind: 'rtl', responsibility: 'Implement arithmetic/logic operations with typed operands and flags.' },
      { id: 'control_fsm', kind: 'rtl', responsibility: 'Own fetch/decode/execute/writeback sequencing and halt/control outputs.' },
      { id: 'data_memory_interface', kind: 'rtl', responsibility: 'Own data-memory write enable/address/data timing.' },
      { id: 'cpu_top', kind: 'top', responsibility: 'Integrate CPU pipeline blocks and expose done/error/status observability.' },
      { id: 'tb_cpu_top', kind: 'testbench', responsibility: 'Self-check reset PC, fetch sequence, register/ALU/control behavior, and halt/status behavior.' },
    ],
    optionalBlocks: ['branch unit', 'interrupt/fault unit', 'pipeline register stage'],
    externalInterfaces: ['clock/reset', 'start or run control', 'debug PC/status outputs', 'optional memory-mapped data interface'],
    internalConnections: [
      'program counter drives instruction-memory address and is sampled by the testbench through a stable observable',
      'decoder/control own write-enable and memory-control timing, not the testbench',
      'opcode encodings are vector/integer constants, not enum literals passed through to_integer',
    ],
    topOutputOwnership: ['control_fsm/top status logic owns done_o, error_o, and status_o'],
    timingContracts: ['PC reset/fetch sequence must be defined in cycles before VHDL generation', 'DM_WE must remain inactive for ADD-like register operations'],
    clockResetPolicy: GENERIC_PATTERN.clockResetPolicy,
    filePlan: ['src/cpu_pkg.vhd', 'src/program_counter.vhd', 'src/instruction_memory_interface.vhd', 'src/decoder.vhd', 'src/register_file.vhd', 'src/alu.vhd', 'src/control_fsm.vhd', 'src/data_memory_interface.vhd', 'src/cpu_top.vhd', 'tb/tb_cpu_top.vhd'],
    verificationScenarios: ['reset PC is checked before first fetch advance', 'fetch sequence follows ROM/program contents', 'ADD does not assert data-memory write enable', 'halt/status behavior is checked without assertion weakening'],
    methodologyTags: ['hierarchy', 'clock_reset', 'interface', 'memory', 'numeric', 'verification', 'tool_flow'],
    referenceTags: ['cpu', 'processor'],
  },
  {
    patternId: 'pattern_alu_core',
    designClass: 'alu',
    family: 'compute',
    specificity: 'subsystem',
    composesWith: [],
    keywords: [/\balu\b/i, /arithmetic\s*logic/i],
    systemRole: 'Implement a typed arithmetic logic unit with explicit opcode contract, flags, and self-checking operation coverage.',
    requiredBlocks: [
      { id: 'alu_pkg_for_opcodes_flags', kind: 'package', responsibility: 'Define opcode constants, operand/result subtypes, and flag record/subtypes.' },
      { id: 'alu_core_combinational_or_registered_datapath', kind: 'rtl', responsibility: 'Compute result and flags with typed numeric_std operands and complete opcode coverage.' },
      { id: 'optional_top_wrapper', kind: 'top', responsibility: 'Expose the ALU interface and own optional registered output/status behavior.' },
      { id: 'self_checking_operation_testbench', kind: 'testbench', responsibility: 'Self-check ADD/SUB/logic/shift and flag cases from a compact golden model.' },
    ],
    optionalBlocks: ['registered pipeline wrapper', 'saturation/overflow policy block'],
    externalInterfaces: ['typed operand inputs', 'opcode input', 'result output', 'carry/zero/overflow/status outputs'],
    internalConnections: ['opcode constants are exact vectors or integers', 'flags are computed from same typed intermediates as result'],
    topOutputOwnership: ['alu_core owns result/flag outputs or top mirrors them exactly once'],
    timingContracts: ['combinational ALU results settle in the same cycle unless a registered wrapper is explicitly selected'],
    clockResetPolicy: GENERIC_PATTERN.clockResetPolicy,
    filePlan: ['src/alu_pkg.vhd', 'src/alu_core.vhd', 'src/alu_top.vhd', 'tb/tb_alu_top.vhd'],
    verificationScenarios: ['check representative arithmetic, bitwise, shift, and flag cases using a typed golden expectation'],
    methodologyTags: ['hierarchy', 'numeric', 'verification', 'tool_flow'],
    referenceTags: ['alu'],
  },
  {
    patternId: 'pattern_video_pipeline',
    designClass: 'video_pattern_generator',
    family: 'video_audio',
    specificity: 'subsystem',
    composesWith: [],
    keywords: [/\bvga\b/i, /\bhdmi\b/i, /video/i, /framebuffer/i],
    systemRole: 'Implement deterministic video timing, active-window detection, framebuffer/pattern addressing, and sync output verification.',
    requiredBlocks: [
      { id: 'video_pkg', kind: 'package', responsibility: 'Define timing constants, counter subtypes, pixel/data types, and status constants.' },
      { id: 'horizontal_counter', kind: 'rtl', responsibility: 'Own horizontal count range and wrap behavior.' },
      { id: 'vertical_counter', kind: 'rtl', responsibility: 'Own vertical count range and frame wrap behavior.' },
      { id: 'sync_generator', kind: 'rtl', responsibility: 'Generate hsync/vsync and any pattern-stage counters with typed numeric state.' },
      { id: 'active_video_window', kind: 'rtl', responsibility: 'Detect active display region from typed h/v counters.' },
      { id: 'pixel_address_generator', kind: 'rtl', responsibility: 'Generate bounded pixel/framebuffer addresses without illegal aggregate comparisons.' },
      { id: 'pattern_or_framebuffer_stage', kind: 'rtl', responsibility: 'Produce deterministic pixel data or read-address intent.' },
      { id: 'video_top', kind: 'top', responsibility: 'Integrate timing, address, and pixel stages with exact output ownership.' },
      { id: 'tb_video_top', kind: 'testbench', responsibility: 'Self-check sync widths, counter wraps, active window, and representative pixel addresses.' },
    ],
    optionalBlocks: ['color-bar pattern generator', 'framebuffer read adapter', 'TMDS/HDMI encoder boundary placeholder if explicitly requested'],
    externalInterfaces: ['pixel clock/reset', 'hsync/vsync outputs', 'active/video enable output', 'pixel data output'],
    internalConnections: ['counters use unsigned or constrained integer types consistently', 'no arithmetic is performed on raw std_logic_vector state'],
    topOutputOwnership: ['sync_generator owns hsync/vsync', 'active_video_window owns active_o', 'pattern/framebuffer stage owns pixel outputs'],
    timingContracts: ['counter wrap points and sync pulse widths are exact constants in the package'],
    clockResetPolicy: GENERIC_PATTERN.clockResetPolicy,
    filePlan: ['src/video_pkg.vhd', 'src/horizontal_counter.vhd', 'src/vertical_counter.vhd', 'src/sync_generator.vhd', 'src/active_video_window.vhd', 'src/pixel_address_generator.vhd', 'src/pattern_or_framebuffer_stage.vhd', 'src/video_top.vhd', 'tb/tb_video_top.vhd'],
    verificationScenarios: ['check sync pulse intervals', 'check counter wrap boundaries', 'check active-window entry/exit', 'check representative pixel address/data'],
    methodologyTags: ['hierarchy', 'clock_reset', 'numeric', 'memory', 'verification', 'tool_flow'],
    referenceTags: ['video', 'framebuffer'],
  },
  {
    patternId: 'pattern_dsp_chain',
    designClass: 'dsp_chain',
    family: 'dsp',
    specificity: 'subsystem',
    composesWith: [],
    keywords: [/\bdsp\b/i, /\bfir\b/i, /\bfft\b/i, /filter/i],
    systemRole: 'Implement a latency-aware signed/fixed-point DSP pipeline with explicit stage boundaries and deterministic numeric verification.',
    requiredBlocks: [
      { id: 'dsp_pkg', kind: 'package', responsibility: 'Define sample/coefficient types, widths, scaling, and latency constants.' },
      { id: 'sample_input_stage', kind: 'rtl', responsibility: 'Accept valid samples and align input handshakes.' },
      { id: 'fir_filter_stage', kind: 'rtl', responsibility: 'Implement typed multiply-accumulate or FIR behavior with explicit width growth.' },
      { id: 'pipeline_latency_tracker', kind: 'rtl', responsibility: 'Track valid alignment through the DSP pipeline.' },
      { id: 'output_valid_stage', kind: 'rtl', responsibility: 'Own output sample valid/status behavior.' },
      { id: 'dsp_top', kind: 'top', responsibility: 'Integrate DSP stages and expose typed sample/status outputs.' },
      { id: 'tb_dsp_top', kind: 'testbench', responsibility: 'Self-check reset, latency, representative numeric output, and valid alignment.' },
    ],
    optionalBlocks: ['FFT-lite analyzer stage', 'coefficient reload/control block'],
    externalInterfaces: ['sample input', 'valid/ready or sample-valid handshakes', 'typed sample output', 'output valid/status'],
    internalConnections: ['pipeline stages use signed/unsigned/fixed types consistently and convert only at boundaries'],
    topOutputOwnership: ['output_valid_stage owns output valid/status; DSP datapath owns sample output'],
    timingContracts: ['pipeline latency is explicit and verified in cycles'],
    clockResetPolicy: GENERIC_PATTERN.clockResetPolicy,
    filePlan: ['src/dsp_pkg.vhd', 'src/sample_input_stage.vhd', 'src/fir_filter_stage.vhd', 'src/pipeline_latency_tracker.vhd', 'src/output_valid_stage.vhd', 'src/dsp_top.vhd', 'tb/tb_dsp_top.vhd'],
    verificationScenarios: ['check representative numeric response', 'check latency alignment', 'check reset clears valid pipeline'],
    methodologyTags: ['hierarchy', 'clock_reset', 'numeric', 'verification', 'tool_flow'],
    referenceTags: ['dsp', 'fir'],
  },
  {
    patternId: 'pattern_axi_stream_router',
    designClass: 'axi_stream_router',
    family: 'bus',
    specificity: 'subsystem',
    composesWith: [],
    keywords: [/\baxi\b/i, /axis/i, /stream/i, /packet\s*router/i, /network\s*switch/i],
    systemRole: 'Implement streaming packet routing with valid/ready handshakes, deterministic arbitration, and backpressure verification.',
    requiredBlocks: [
      { id: 'stream_pkg', kind: 'package', responsibility: 'Define payload, route, and packet metadata types.' },
      { id: 'ingress_interface_blocks', kind: 'rtl', responsibility: 'Own valid/ready input handshake and packet capture.' },
      { id: 'routing_decision_logic', kind: 'rtl', responsibility: 'Decode packet metadata into egress route selection.' },
      { id: 'arbiter', kind: 'rtl', responsibility: 'Own deterministic contention policy.' },
      { id: 'egress_interface_blocks', kind: 'rtl', responsibility: 'Drive output valid/data and honor ready backpressure.' },
      { id: 'backpressure_control', kind: 'rtl', responsibility: 'Propagate ready/backpressure without combinational protocol breaks.' },
      { id: 'packet_tracker', kind: 'rtl', responsibility: 'Track packet boundaries and route/status observability.' },
      { id: 'stream_router_top', kind: 'top', responsibility: 'Integrate stream ingress, routing, arbitration, egress, and status.' },
      { id: 'tb_stream_router_top', kind: 'testbench', responsibility: 'Self-check route selection, contention, backpressure, and packet boundary preservation.' },
    ],
    optionalBlocks: ['small skid buffers', 'route-table register block'],
    externalInterfaces: ['AXI-stream-like valid/ready/data/last inputs and outputs', 'route/status observability'],
    internalConnections: ['valid remains asserted until ready handshake completes', 'ready/backpressure is deterministic and acyclic'],
    topOutputOwnership: ['egress blocks own output valid/data/last; packet_tracker owns status outputs'],
    timingContracts: ['arbitration policy and backpressure latency are explicit'],
    clockResetPolicy: GENERIC_PATTERN.clockResetPolicy,
    filePlan: ['src/stream_pkg.vhd', 'src/ingress_interface_blocks.vhd', 'src/routing_decision_logic.vhd', 'src/arbiter.vhd', 'src/egress_interface_blocks.vhd', 'src/backpressure_control.vhd', 'src/packet_tracker.vhd', 'src/stream_router_top.vhd', 'tb/tb_stream_router_top.vhd'],
    verificationScenarios: ['check route selection', 'check contention arbitration', 'check backpressure', 'check packet boundary preservation'],
    methodologyTags: ['hierarchy', 'clock_reset', 'interface', 'verification', 'tool_flow'],
    referenceTags: ['axi_stream', 'packet'],
  },
  {
    patternId: 'pattern_flight_controller',
    designClass: 'flight_controller',
    family: 'control',
    specificity: 'subsystem',
    composesWith: [],
    keywords: [/flight\s*controller/i, /\bdrone\b/i, /\buav\b/i, /\bimu\b/i, /\bpid\b/i],
    systemRole: 'Implement a deterministic FPGA flight-control subsystem that samples sensors, estimates attitude, runs control loops, mixes motor commands, and exposes failsafe/telemetry behavior.',
    requiredBlocks: [
      { id: 'flight_controller_pkg', kind: 'package', responsibility: 'Define sensor/control/motor fixed-point widths, records, states, and status constants.' },
      { id: 'sensor_frontend', kind: 'rtl', responsibility: 'Sample IMU/sensor data through a typed sensor-valid interface.' },
      { id: 'sensor_conditioning', kind: 'rtl', responsibility: 'Apply offset/scale conditioning with explicit signed/fixed-point types.' },
      { id: 'attitude_estimator', kind: 'rtl', responsibility: 'Estimate rate/attitude using a bounded simplified estimator or complementary filter.' },
      { id: 'control_loop', kind: 'rtl', responsibility: 'Run PID/control equations with explicit scaling and saturation policy.' },
      { id: 'motor_mixer', kind: 'rtl', responsibility: 'Mix control outputs into motor commands with bounded output ranges.' },
      { id: 'failsafe_watchdog', kind: 'rtl', responsibility: 'Override motor commands deterministically on invalid sensor/control timeout.' },
      { id: 'configuration_status', kind: 'rtl', responsibility: 'Own configuration/status/error observability.' },
      { id: 'flight_controller_top', kind: 'top', responsibility: 'Integrate flight-control blocks with explicit status and motor-output ownership.' },
      { id: 'tb_flight_controller_top', kind: 'testbench', responsibility: 'Self-check safe reset, nominal response direction, valid timing, and failsafe override.' },
    ],
    optionalBlocks: ['PWM/DSHOT output timing block', 'telemetry packet formatter'],
    externalInterfaces: ['clock/reset', 'sensor input interface', 'pilot setpoint inputs', 'motor command outputs', 'telemetry/status/error outputs'],
    internalConnections: ['sensor-valid, estimator-valid, controller-valid, and motor-update handshakes are explicit', 'failsafe path can override normal motor commands deterministically'],
    topOutputOwnership: ['motor_mixer/failsafe path owns motor outputs; configuration_status owns status/error outputs'],
    timingContracts: ['control loop latency is documented and pipeline-tracked in cycles', 'reset leaves the design disarmed with safe motor outputs'],
    clockResetPolicy: ['use one primary synchronous control clock unless the user requests a separate sensor clock', 'release reset into a safe idle/disarmed state', 'do not generate clocks inside RTL; derive timing by counters and clock-enable pulses'],
    filePlan: ['src/flight_controller_pkg.vhd', 'src/sensor_frontend.vhd', 'src/sensor_conditioning.vhd', 'src/attitude_estimator.vhd', 'src/control_loop.vhd', 'src/motor_mixer.vhd', 'src/failsafe_watchdog.vhd', 'src/configuration_status.vhd', 'src/flight_controller_top.vhd', 'tb/tb_flight_controller_top.vhd'],
    verificationScenarios: ['prove reset leaves motor outputs safe', 'feed deterministic sensor/setpoint samples and check motor-command response direction', 'exercise failsafe timeout/invalid-sensor behavior'],
    methodologyTags: ['hierarchy', 'clock_reset', 'interface', 'numeric', 'verification', 'tool_flow'],
    referenceTags: ['control', 'sensor', 'motor'],
  },
];

type ComprehensivePatternSpec = {
  designClass: string;
  family: NonNullable<CuratedDesignPattern['family']>;
  specificity: NonNullable<CuratedDesignPattern['specificity']>;
  aliases?: string[];
  role: string;
  interfaceKind: string;
  coreBehavior: string;
  outputOwner: string;
  timing: string;
  verification: string;
  tags: string[];
  composesWith?: string[];
};

function wordsFromDesignClass(designClass: string) {
  return designClass.split('_').filter(Boolean);
}

function patternKeywords(designClass: string, aliases: string[] = []) {
  const phrase = wordsFromDesignClass(designClass).join('\\s*');
  const compact = wordsFromDesignClass(designClass).join('\\s*[_-]?\\s*');
  return [
    new RegExp(`\\b${phrase}\\b`, 'i'),
    new RegExp(`\\b${compact}\\b`, 'i'),
    ...aliases.map((alias) => new RegExp(alias, 'i')),
  ];
}

function makeComprehensivePattern(spec: ComprehensivePatternSpec): CuratedDesignPattern {
  const words = wordsFromDesignClass(spec.designClass);
  const title = words.join(' ');
  const pkg = `${spec.designClass}_pkg`;
  const core = `${spec.designClass}_core`;
  const top = `${spec.designClass}_top`;
  const tb = `tb_${spec.designClass}_top`;
  const statusOwner = `${core} or ${top}`;
  return {
    patternId: `pattern_${spec.designClass}`,
    designClass: spec.designClass,
    family: spec.family,
    specificity: spec.specificity,
    composesWith: spec.composesWith || [],
    keywords: patternKeywords(spec.designClass, spec.aliases),
    systemRole: spec.role,
    requiredBlocks: [
      { id: pkg, kind: 'package', responsibility: `Define ${title} constants, subtypes, records, states, widths, and status codes used across the generated files.` },
      { id: core, kind: 'rtl', responsibility: spec.coreBehavior, owns: ['data_o', 'valid_o', 'status_o'] },
      { id: top, kind: 'top', responsibility: `Integrate the ${title} RTL core with exact public ports, internal mirrors, and deterministic output ownership.` },
      { id: tb, kind: 'testbench', responsibility: `Self-check reset, nominal ${title} behavior, boundary conditions, timeout handling, and PASS/FAIL completion.` },
    ],
    optionalBlocks: [
      `${spec.designClass}_status_block`,
      `${spec.designClass}_debug_monitor`,
      `${spec.designClass}_config_registers`,
    ],
    externalInterfaces: [
      'clock/reset',
      spec.interfaceKind,
      'valid/ready or start/done control where transaction-oriented',
      'status/error/debug observability outputs',
    ],
    internalConnections: [
      `${core} owns the portable VHDL behavior for ${title}; vendor IP may inspire structure but must not be required for simulation.`,
      `${top} maps every child formal by exact name and type and drives every public output exactly once.`,
      'shared package declarations compile before all dependent RTL and testbench files.',
      'numeric, memory, counter, and handshake boundaries use explicit typed conversions and bounded ranges.',
    ],
    topOutputOwnership: [
      spec.outputOwner,
      `${statusOwner} owns done/valid/error/status outputs through registered or explicitly concurrent drivers.`,
    ],
    timingContracts: [
      spec.timing,
      'reset drives every observable output to a deterministic safe value before the first nominal transaction.',
    ],
    clockResetPolicy: GENERIC_PATTERN.clockResetPolicy,
    filePlan: [
      `src/${pkg}.vhd`,
      `src/${core}.vhd`,
      `src/${top}.vhd`,
      `tb/${tb}.vhd`,
      'sim/ghdl_plan.json and sim/run_ghdl.sh',
    ],
    verificationScenarios: [
      spec.verification,
      `check reset/default behavior for the ${title} top-level outputs`,
      'check at least one boundary/error/timeout scenario without weakening assertions',
    ],
    methodologyTags: Array.from(new Set(['hierarchy', 'clock_reset', 'interface', 'verification', 'tool_flow', ...spec.tags])),
    referenceTags: Array.from(new Set([spec.family, ...spec.tags, ...words])),
  };
}

const COMPREHENSIVE_PATTERN_SPECS: ComprehensivePatternSpec[] = [
  { designClass: 'uart_core', family: 'communication', specificity: 'subsystem', aliases: ['\\buart\\b', 'serial\\s*port'], role: 'Implement a UART subsystem with receive, transmit, baud timing, and packet/status observability.', interfaceKind: 'uart rx/tx serial pins plus byte-valid interfaces', coreBehavior: 'Own UART baud tick, RX sampling, TX shifting, framing status, and byte-valid handshake behavior.', outputOwner: 'uart_core owns received byte valid, transmit busy, framing error, and status outputs.', timing: 'baud timing and byte-valid latency are explicit in cycles or baud ticks.', verification: 'self-check one received byte, one transmitted byte, idle line behavior, and framing error/status handling', tags: ['protocol', 'uart', 'serial'], composesWith: ['uart_rx', 'uart_tx', 'uart_packet_protocol'] },
  { designClass: 'uart_rx', family: 'communication', specificity: 'leaf', aliases: ['uart\\s*receive', 'uart\\s*receiver'], role: 'Implement a UART receiver leaf with deterministic oversampling and byte-valid output.', interfaceKind: 'serial rx input and byte/data valid output', coreBehavior: 'Own start-bit detection, sample counter, shift register, stop-bit check, and framing-error output.', outputOwner: 'uart_rx_core owns rx_data_o, rx_valid_o, busy_o, and framing_error_o.', timing: 'rx_valid_o pulses once after a complete legal frame.', verification: 'self-check a legal frame, idle line, and malformed stop-bit error' , tags: ['protocol', 'uart', 'serial'] },
  { designClass: 'uart_tx', family: 'communication', specificity: 'leaf', aliases: ['uart\\s*transmit', 'uart\\s*transmitter'], role: 'Implement a UART transmitter leaf with deterministic start/data/stop sequencing.', interfaceKind: 'byte input, start control, busy/done status, serial tx output', coreBehavior: 'Own TX shift register, bit counter, baud tick consume, busy, done, and serial output state.', outputOwner: 'uart_tx_core owns tx_o, busy_o, done_o, and status_o.', timing: 'done_o asserts after exactly one start bit, eight data bits, and stop bit sequence.', verification: 'self-check emitted serial frame bits and busy/done timing', tags: ['protocol', 'uart', 'serial'] },
  { designClass: 'uart_packet_protocol', family: 'communication', specificity: 'subsystem', aliases: ['uart\\s*packet', 'serial\\s*packet'], role: 'Implement a UART packet parser/formatter with command/status framing.', interfaceKind: 'UART byte stream plus parsed command/status records', coreBehavior: 'Own packet framing, command decode, checksum/status handling, and parsed payload valid signals.', outputOwner: 'uart_packet_protocol_core owns packet_valid_o, checksum_error_o, command_o, and status_o.', timing: 'packet_valid_o pulses after the final checked byte of a legal packet.', verification: 'self-check legal packet parse, checksum error, and response formatting', tags: ['protocol', 'uart', 'packet'] },
  { designClass: 'spi_controller', family: 'communication', specificity: 'subsystem', aliases: ['\\bspi\\b', 'serial\\s*peripheral\\s*interface'], role: 'Implement a portable SPI controller with clock, chip-select, shift, and transaction status behavior.', interfaceKind: 'SPI sclk/mosi/miso/cs pins plus command/data handshake', coreBehavior: 'Own SPI clock enable, CPOL/CPHA mode, chip-select timing, shift register, bit counter, done/error outputs.', outputOwner: 'spi_controller_core owns sclk_o, mosi_o, cs_o, done_o, busy_o, and status_o.', timing: 'done_o asserts after the configured number of shifted bits and cs_o deassertion timing is explicit.', verification: 'self-check one SPI transfer, chip-select timing, and mode-safe idle values', tags: ['protocol', 'spi', 'serial'], composesWith: ['spi_master', 'spi_slave'] },
  { designClass: 'spi_master', family: 'communication', specificity: 'leaf', aliases: ['spi\\s*master'], role: 'Implement an SPI master leaf for deterministic byte/word transfers.', interfaceKind: 'SPI master pins and transaction command/data ports', coreBehavior: 'Own master-generated SCLK, MOSI shift, MISO sample, chip-select, bit counter, and completion status.', outputOwner: 'spi_master_core owns SPI output pins and transfer done/status outputs.', timing: 'transfer latency is bit_count times the configured clock divider plus cs setup/hold cycles.', verification: 'self-check MOSI sequence, sampled MISO value, and done timing', tags: ['protocol', 'spi'] },
  { designClass: 'spi_slave', family: 'communication', specificity: 'leaf', aliases: ['spi\\s*slave'], role: 'Implement an SPI slave leaf that samples external clock/chip-select and exposes received words.', interfaceKind: 'SPI slave pins and local byte-valid/status ports', coreBehavior: 'Own synchronized SPI inputs, bit counter, MOSI sample, MISO drive, and receive-valid status.', outputOwner: 'spi_slave_core owns miso_o, rx_valid_o, rx_data_o, and status outputs.', timing: 'rx_valid_o asserts on the final sampled bit of an active chip-select transaction.', verification: 'self-check external SPI stimulus and receive/response behavior', tags: ['protocol', 'spi', 'cdc'] },
  { designClass: 'i2c_controller', family: 'communication', specificity: 'subsystem', aliases: ['\\bi2c\\b', 'i\\s*2\\s*c'], role: 'Implement an I2C controller with start/stop, address, byte transfer, ACK/NACK, and status behavior.', interfaceKind: 'I2C scl/sda open-drain style pins plus command/data handshake', coreBehavior: 'Own start/stop sequencing, SCL timing, SDA drive enable, address/data shift, ACK sample, and error status.', outputOwner: 'i2c_controller_core owns scl drive intent, sda drive intent, done_o, ack_error_o, and status_o.', timing: 'done_o asserts after stop condition completion for a bounded byte transaction.', verification: 'self-check start, address byte, ACK/NACK, data byte, stop, and timeout behavior', tags: ['protocol', 'i2c', 'serial'], composesWith: ['i2c_master', 'i2c_slave'] },
  { designClass: 'i2c_master', family: 'communication', specificity: 'leaf', aliases: ['i2c\\s*master'], role: 'Implement an I2C master leaf with deterministic command byte transactions.', interfaceKind: 'I2C master pin-drive enables and command/data ports', coreBehavior: 'Own master SCL generation, SDA direction, byte shifter, ACK sample, and command completion.', outputOwner: 'i2c_master_core owns scl_oe_o, sda_oe_o, done_o, ack_error_o, and rx_valid_o.', timing: 'byte transaction timing is defined by divider ticks and state transitions.', verification: 'self-check write byte, read byte, ACK failure, and stop timing', tags: ['protocol', 'i2c'] },
  { designClass: 'i2c_slave', family: 'communication', specificity: 'leaf', aliases: ['i2c\\s*slave'], role: 'Implement an I2C slave leaf with address match, byte receive/transmit, and ACK behavior.', interfaceKind: 'I2C slave pin sampling/drive enables plus local register byte interface', coreBehavior: 'Own address recognition, SDA direction, ACK drive, byte receive/transmit shift, and status outputs.', outputOwner: 'i2c_slave_core owns sda_oe_o, addressed_o, rx_valid_o, tx_request_o, and status_o.', timing: 'ACK and byte-valid timing are aligned to SCL edges after synchronization.', verification: 'self-check address match, write byte, read byte, and NACK/no-match behavior', tags: ['protocol', 'i2c', 'cdc'] },
  { designClass: 'can_controller', family: 'communication', specificity: 'subsystem', aliases: ['\\bcan\\b', 'controller\\s*area\\s*network'], role: 'Implement a simplified CAN-style frame controller with bit timing, frame fields, CRC/status placeholders, and filtering.', interfaceKind: 'CAN rx/tx pins plus frame command/status records', coreBehavior: 'Own frame state machine, arbitration/status placeholder, bit timing, frame-valid, and error counters.', outputOwner: 'can_controller_core owns tx_o, frame_valid_o, error_o, and status_o.', timing: 'frame_valid_o asserts after a complete accepted frame with bounded bit timing.', verification: 'self-check a simplified frame receive/transmit path and error/status behavior', tags: ['protocol', 'packet', 'safety'] },
  { designClass: 'lin_controller', family: 'communication', specificity: 'subsystem', aliases: ['\\blin\\b', 'local\\s*interconnect\\s*network'], role: 'Implement a LIN-style serial frame controller with break/sync/id/data/checksum handling.', interfaceKind: 'LIN serial rx/tx pins plus frame command/status records', coreBehavior: 'Own break detection/generation, sync byte handling, protected ID, data bytes, checksum/status.', outputOwner: 'lin_controller_core owns tx_o, frame_valid_o, checksum_error_o, and status_o.', timing: 'frame completion and checksum status are bounded by configured byte count and baud timing.', verification: 'self-check break/sync/id/data/checksum path and checksum error behavior', tags: ['protocol', 'serial', 'packet'] },
  { designClass: 'rs485_packet_link', family: 'communication', specificity: 'subsystem', aliases: ['rs\\s*485', 'rs485'], role: 'Implement an RS-485 packet link with direction control, UART-style bytes, and packet status.', interfaceKind: 'RS-485 rx/tx/de pins plus packet payload/status ports', coreBehavior: 'Own driver-enable timing, packet framing, turnaround guard cycles, and packet-valid/status outputs.', outputOwner: 'rs485_packet_link_core owns tx_o, de_o, packet_valid_o, error_o, and status_o.', timing: 'driver enable asserts before TX start and deasserts after stop/turnaround guard cycles.', verification: 'self-check TX direction timing, RX packet acceptance, and timeout/error behavior', tags: ['protocol', 'uart', 'packet'] },
  { designClass: 'ethernet_mac_lite', family: 'communication', specificity: 'subsystem', aliases: ['ethernet\\s*mac', '\\bmac\\s*lite\\b'], role: 'Implement a simulation-friendly Ethernet MAC-lite frame boundary and byte-stream adapter.', interfaceKind: 'byte-stream ingress/egress with frame valid/last/status signals', coreBehavior: 'Own preamble/SFD placeholder, frame byte capture, transmit byte sequencing, and status/error outputs.', outputOwner: 'ethernet_mac_lite_core owns tx_valid_o, tx_data_o, rx_frame_valid_o, and status_o.', timing: 'frame valid/last signals align exactly with byte-stream boundaries.', verification: 'self-check frame receive, frame transmit, and short-frame/error status behavior', tags: ['protocol', 'ethernet', 'packet', 'streaming'] },
  { designClass: 'ethernet_frame_parser', family: 'communication', specificity: 'leaf', aliases: ['ethernet\\s*frame\\s*parser'], role: 'Implement an Ethernet frame parser that extracts header fields and payload boundaries.', interfaceKind: 'byte stream with valid/last input and parsed header/status output', coreBehavior: 'Own byte counter, header field extraction, payload valid window, and malformed-frame status.', outputOwner: 'ethernet_frame_parser_core owns header_valid_o, payload_valid_o, frame_error_o, and status_o.', timing: 'header_valid_o asserts after the final configured header byte.', verification: 'self-check destination/source/type extraction and malformed short frame behavior', tags: ['protocol', 'ethernet', 'packet'] },
  { designClass: 'udp_packet_endpoint', family: 'communication', specificity: 'subsystem', aliases: ['\\budp\\b', 'udp\\s*endpoint'], role: 'Implement a UDP-like packet endpoint around a byte stream with header/payload/status handling.', interfaceKind: 'packet byte stream plus source/destination port and payload observability', coreBehavior: 'Own UDP header parse/format, payload length tracking, checksum placeholder/status, and packet-valid output.', outputOwner: 'udp_packet_endpoint_core owns payload_valid_o, packet_done_o, error_o, and status_o.', timing: 'packet_done_o asserts at the payload-length boundary or error condition.', verification: 'self-check one packet parse, one packet format, and length/error handling', tags: ['protocol', 'packet', 'ethernet'] },
  { designClass: 'serdes_link_layer', family: 'communication', specificity: 'subsystem', aliases: ['serdes', 'serial\\s*link'], role: 'Implement a portable SerDes-style link layer model with word alignment, framing, and status.', interfaceKind: 'parallel word interface plus serial/link status abstraction', coreBehavior: 'Own training/alignment FSM, word framing, lane-valid status, and error counters in portable VHDL.', outputOwner: 'serdes_link_layer_core owns aligned_o, word_valid_o, error_o, and status_o.', timing: 'alignment status asserts after a bounded training sequence.', verification: 'self-check training sequence, aligned word receive, and loss-of-lock behavior', tags: ['protocol', 'packet', 'cdc'] },
  { designClass: 'lvds_source_synchronous_link', family: 'communication', specificity: 'subsystem', aliases: ['lvds', 'source\\s*synchronous'], role: 'Implement an LVDS/source-synchronous link wrapper with capture/valid/status abstraction.', interfaceKind: 'source-synchronous data/clock abstraction plus parallel output status', coreBehavior: 'Own input synchronization model, word assembly, valid window, and link status outputs.', outputOwner: 'lvds_source_synchronous_link_core owns data_valid_o, word_o, link_error_o, and status_o.', timing: 'word_valid latency is defined relative to captured strobe cycles.', verification: 'self-check aligned word capture and invalid/stale strobe behavior', tags: ['protocol', 'cdc', 'streaming'] },
  { designClass: 'packet_framer_deframer', family: 'communication', specificity: 'subsystem', aliases: ['framer', 'deframer', 'packet\\s*framer'], role: 'Implement packet framing/deframing with start/end delimiters, escaping/status, and payload valid output.', interfaceKind: 'byte stream input/output with packet payload and status ports', coreBehavior: 'Own delimiter detection/insertion, byte stuffing placeholder, payload-valid window, and malformed-packet status.', outputOwner: 'packet_framer_deframer_core owns packet_valid_o, payload_o, error_o, and status_o.', timing: 'packet_valid_o asserts after end delimiter and payload length/status are known.', verification: 'self-check legal frame, escaped byte placeholder, and malformed frame timeout', tags: ['protocol', 'packet', 'streaming'] },
  { designClass: 'protocol_bridge_generic', family: 'communication', specificity: 'broad', aliases: ['protocol\\s*bridge', 'bridge\\s*protocol'], role: 'Implement a generic protocol bridge with ingress parser, transaction controller, egress formatter, and status/error ownership.', interfaceKind: 'ingress protocol pins or stream plus egress protocol pins or stream', coreBehavior: 'Own ingress capture, command normalization, egress transaction sequencing, response formatting, and status/error outputs.', outputOwner: 'protocol_bridge_generic_core owns done_o, error_o, busy_o, and status_o.', timing: 'nominal bridge completion latency is bounded and verified in cycles.', verification: 'self-check one nominal ingress-to-egress transaction and one error/timeout path', tags: ['protocol', 'packet', 'streaming'], composesWith: ['packet_framer_deframer'] },
  { designClass: 'spi_i2c_bridge', family: 'communication', specificity: 'subsystem', aliases: ['spi.*i2c', 'i2c.*spi'], role: 'Implement an SPI-to-I2C bridge with command decode, I2C master transaction, and response/status handling.', interfaceKind: 'SPI command side plus I2C master side pins/status', coreBehavior: 'Own SPI command capture, I2C transaction FSM, response byte formation, ACK/error/status reporting.', outputOwner: 'spi_i2c_bridge_core owns SPI response/status and I2C drive-enable outputs.', timing: 'bridge done asserts after I2C stop completion and response status capture.', verification: 'self-check SPI command to I2C write/read transaction and ACK error path', tags: ['protocol', 'spi', 'i2c'] },
  { designClass: 'axi_stream_to_packet_bridge', family: 'communication', specificity: 'subsystem', aliases: ['axi\\s*stream.*packet', 'packet.*axi\\s*stream'], role: 'Bridge AXI-stream-like valid/ready traffic to packet framing with status and boundary preservation.', interfaceKind: 'AXI-stream-like input/output and packet byte/status interfaces', coreBehavior: 'Own stream handshake capture, packet boundary detection, byte framing, and packet status outputs.', outputOwner: 'axi_stream_to_packet_bridge_core owns stream ready/valid, packet_valid_o, and status_o.', timing: 'packet boundary and stream last timing are preserved across the bridge.', verification: 'self-check one packet transfer, backpressure, and boundary preservation', tags: ['protocol', 'axi_stream', 'packet', 'streaming'] },
  { designClass: 'axi4_lite_peripheral', family: 'bus', specificity: 'subsystem', aliases: ['axi4\\s*lite', 'axi\\s*lite'], role: 'Implement an AXI4-Lite-style peripheral shell with register decode, read/write responses, and status.', interfaceKind: 'AXI4-Lite-like address/data/valid/ready response channels', coreBehavior: 'Own write/read address acceptance, register strobes, read mux, response valid, and protocol status outputs.', outputOwner: 'axi4_lite_peripheral_core owns AXI response/ready signals and register side effects.', timing: 'read/write responses complete in a bounded number of clock cycles with stable ready/valid behavior.', verification: 'self-check write transaction, readback transaction, invalid address response, and reset register defaults', tags: ['bus', 'interface', 'memory'] },
  { designClass: 'axi4_lite_register_bank', family: 'bus', specificity: 'leaf', aliases: ['axi4\\s*lite\\s*register', 'axi\\s*lite\\s*register'], role: 'Implement an AXI4-Lite register bank with typed control/status fields.', interfaceKind: 'AXI4-Lite-like register interface plus internal control/status ports', coreBehavior: 'Own register address decode, write enables, read mux, reset values, and status mirroring.', outputOwner: 'axi4_lite_register_bank_core owns register read data, valid responses, and internal control outputs.', timing: 'register read data is valid with the configured response cycle.', verification: 'self-check reset defaults, write/readback, read-only status, and invalid address behavior', tags: ['bus', 'register', 'interface'] },
  { designClass: 'axi4_memory_mapped_slave', family: 'bus', specificity: 'subsystem', aliases: ['axi4\\s*slave', 'axi\\s*memory\\s*mapped\\s*slave'], role: 'Implement an AXI4 memory-mapped slave subset around local memory/register storage.', interfaceKind: 'AXI4-like memory-mapped slave channels and local memory interface', coreBehavior: 'Own address/data channel handshakes, local memory request generation, response timing, and error status.', outputOwner: 'axi4_memory_mapped_slave_core owns ready/valid response channels and local memory request outputs.', timing: 'memory response latency is bounded and backpressure-safe.', verification: 'self-check burst-lite write/read behavior, backpressure, and invalid range response', tags: ['bus', 'memory', 'interface'] },
  { designClass: 'axi4_memory_mapped_master', family: 'bus', specificity: 'subsystem', aliases: ['axi4\\s*master', 'axi\\s*memory\\s*mapped\\s*master'], role: 'Implement an AXI4 memory-mapped master subset for deterministic read/write command issue.', interfaceKind: 'AXI4-like master request channels plus local command/status interface', coreBehavior: 'Own command queue, address/data issue, response capture, outstanding flag, and completion status.', outputOwner: 'axi4_memory_mapped_master_core owns address/data valid outputs, done/error/status outputs.', timing: 'done_o asserts after all accepted responses for the requested command sequence.', verification: 'self-check single read, single write, response error, and backpressure handling', tags: ['bus', 'memory', 'interface'], composesWith: ['dma_engine'] },
  { designClass: 'axi_stream_source', family: 'bus', specificity: 'leaf', aliases: ['axi\\s*stream\\s*source'], role: 'Implement an AXI-stream-like source with valid/data/last generation and backpressure hold.', interfaceKind: 'AXI-stream-like source valid/ready/data/last ports', coreBehavior: 'Own payload counter, valid hold, last generation, and status outputs.', outputOwner: 'axi_stream_source_core owns m_valid_o, m_data_o, m_last_o, and source_done_o.', timing: 'valid remains asserted until ready accepts each beat.', verification: 'self-check stream sequence, last beat, and ready backpressure hold', tags: ['bus', 'axi_stream', 'streaming'] },
  { designClass: 'axi_stream_sink', family: 'bus', specificity: 'leaf', aliases: ['axi\\s*stream\\s*sink'], role: 'Implement an AXI-stream-like sink with ready policy, payload capture, and packet status.', interfaceKind: 'AXI-stream-like sink valid/ready/data/last ports', coreBehavior: 'Own ready generation, data capture, beat count, last detection, and packet status outputs.', outputOwner: 'axi_stream_sink_core owns ready_o, packet_done_o, count_o, and status_o.', timing: 'captured count and packet_done align with accepted valid/ready transfers.', verification: 'self-check accepted beats, backpressure, last handling, and reset state', tags: ['bus', 'axi_stream', 'streaming'] },
  { designClass: 'axi_stream_width_converter', family: 'bus', specificity: 'subsystem', aliases: ['stream\\s*width\\s*converter', 'axi.*width\\s*converter'], role: 'Implement an AXI-stream-like width converter with packing/unpacking and boundary preservation.', interfaceKind: 'narrow/wide stream valid/ready/data/last interfaces', coreBehavior: 'Own pack/unpack counters, data staging, valid/ready propagation, and last alignment.', outputOwner: 'axi_stream_width_converter_core owns converted data/valid/last and status outputs.', timing: 'converted beat latency and packet last placement are explicit.', verification: 'self-check narrow-to-wide, wide-to-narrow, partial last, and backpressure behavior', tags: ['bus', 'axi_stream', 'streaming'] },
  { designClass: 'axi_stream_packet_arbiter', family: 'bus', specificity: 'subsystem', aliases: ['stream\\s*arbiter', 'packet\\s*arbiter'], role: 'Implement packet-aware stream arbitration with deterministic priority or round-robin policy.', interfaceKind: 'multiple stream inputs and one stream output with arbitration status', coreBehavior: 'Own grant FSM, packet lock, ready routing, output muxing, and arbitration status.', outputOwner: 'axi_stream_packet_arbiter_core owns selected output stream and grant/status outputs.', timing: 'grant changes only at packet boundaries unless configured otherwise.', verification: 'self-check two-input contention, priority/round-robin policy, and packet boundary preservation', tags: ['bus', 'axi_stream', 'packet', 'streaming'] },
  { designClass: 'wishbone_peripheral', family: 'bus', specificity: 'subsystem', aliases: ['wishbone'], role: 'Implement a Wishbone-style peripheral shell with register decode and ACK/status behavior.', interfaceKind: 'Wishbone-like cyc/stb/we/addr/data/ack ports', coreBehavior: 'Own cycle/strobe acceptance, write strobes, read mux, ACK timing, and error/status outputs.', outputOwner: 'wishbone_peripheral_core owns ack_o, dat_o, err_o, and internal control outputs.', timing: 'ACK response timing is bounded and deterministic.', verification: 'self-check write/readback, invalid address, and ACK reset behavior', tags: ['bus', 'register', 'interface'] },
  { designClass: 'wishbone_interconnect', family: 'bus', specificity: 'subsystem', aliases: ['wishbone\\s*interconnect'], role: 'Implement a Wishbone-style address interconnect with slave decode and response muxing.', interfaceKind: 'one master-side Wishbone-like port and multiple slave-side ports', coreBehavior: 'Own address decode, slave select, response mux, error response, and no-overlap validation status.', outputOwner: 'wishbone_interconnect_core owns slave selects, master response, and decode error status.', timing: 'selected slave response is routed without changing the ACK/error contract.', verification: 'self-check two slave regions, invalid address, and response mux behavior', tags: ['bus', 'interface'] },
  { designClass: 'avalon_mm_peripheral', family: 'bus', specificity: 'subsystem', aliases: ['avalon\\s*mm', 'avalon\\s*memory\\s*mapped'], role: 'Implement an Avalon-MM-style peripheral with waitrequest/read/write register behavior.', interfaceKind: 'Avalon-MM-like address/read/write/waitrequest/readdata ports', coreBehavior: 'Own read/write command acceptance, waitrequest policy, read data mux, and register side effects.', outputOwner: 'avalon_mm_peripheral_core owns waitrequest_o, readdata_o, and status/control outputs.', timing: 'read data and waitrequest behavior are bounded and deterministic.', verification: 'self-check register write, readback, waitrequest, and invalid address behavior', tags: ['bus', 'register', 'interface'] },
  { designClass: 'avalon_stream_endpoint', family: 'bus', specificity: 'subsystem', aliases: ['avalon\\s*stream', 'avalon\\s*st'], role: 'Implement an Avalon-ST-style endpoint with valid/ready/start/end packet handling.', interfaceKind: 'Avalon-ST-like valid/ready/data/startofpacket/endofpacket ports', coreBehavior: 'Own packet boundary handling, ready/backpressure, payload capture/emit, and status outputs.', outputOwner: 'avalon_stream_endpoint_core owns stream ready/valid/data and packet status outputs.', timing: 'start/end packet observability aligns to accepted transfers.', verification: 'self-check packet transfer, ready backpressure, and start/end boundary handling', tags: ['bus', 'streaming', 'packet'] },
  { designClass: 'apb_peripheral', family: 'bus', specificity: 'subsystem', aliases: ['\\bapb\\b', 'advanced\\s*peripheral\\s*bus'], role: 'Implement an APB-style peripheral with setup/access phase and register/status behavior.', interfaceKind: 'APB-like psel/penable/pwrite/paddr/pwdata/prdata/pready ports', coreBehavior: 'Own setup/access phase decode, register writes, read mux, pready/pslverr timing, and status.', outputOwner: 'apb_peripheral_core owns prdata_o, pready_o, pslverr_o, and internal control outputs.', timing: 'PREADY response timing is deterministic for each access.', verification: 'self-check setup/access write, readback, and error response', tags: ['bus', 'register', 'interface'] },
  { designClass: 'memory_mapped_register_file', family: 'bus', specificity: 'subsystem', aliases: ['memory\\s*mapped\\s*register', 'mmio\\s*register'], role: 'Implement a memory-mapped register file with reset defaults, control writes, and status mirrors.', interfaceKind: 'simple address/read/write register interface plus control/status fields', coreBehavior: 'Own address decode, write mask, read mux, reset defaults, read-only status, and error flag.', outputOwner: 'memory_mapped_register_file_core owns read_data_o, control outputs, and address_error_o.', timing: 'read data and write side effects are defined in one bounded clocked access.', verification: 'self-check reset values, writes, status mirror, and invalid address', tags: ['bus', 'register', 'memory'] },
  { designClass: 'register_map_subsystem', family: 'bus', specificity: 'subsystem', aliases: ['register\\s*map', 'csr\\s*map'], role: 'Implement a register-map subsystem with typed control/status fields and generated readback behavior.', interfaceKind: 'register access interface plus named control/status outputs', coreBehavior: 'Own CSR decode, control field storage, status field synchronization/mirroring, and readback mux.', outputOwner: 'register_map_subsystem_core owns control outputs, read data, and status/error outputs.', timing: 'CSR writes update control outputs on the documented clock edge and readback is deterministic.', verification: 'self-check control writes, status readback, reset defaults, and invalid address behavior', tags: ['bus', 'register', 'interface'] },
  { designClass: 'csr_status_control_block', family: 'bus', specificity: 'leaf', aliases: ['csr', 'control\\s*status\\s*register'], role: 'Implement a CSR status/control block for local control, status, and sticky error bits.', interfaceKind: 'local register access plus control/status/error field ports', coreBehavior: 'Own control register storage, sticky status/error bits, clear-on-write behavior, and readback mux.', outputOwner: 'csr_status_control_block_core owns control field outputs, status readback, and sticky error outputs.', timing: 'control updates and clear-on-write status timing are explicit.', verification: 'self-check reset, control write, sticky error set/clear, and readback behavior', tags: ['bus', 'register', 'safety'] },
  { designClass: 'address_decoder', family: 'bus', specificity: 'leaf', aliases: ['address\\s*decoder'], role: 'Implement an address decoder with non-overlapping region selects and error/status output.', interfaceKind: 'address input plus region select and invalid-address outputs', coreBehavior: 'Own address range comparisons, select generation, no-match error, and optional one-hot validation.', outputOwner: 'address_decoder_core owns region select outputs and address_error_o.', timing: 'select outputs are combinational or registered according to the declared timing contract.', verification: 'self-check boundary addresses, no-match, and one-hot select behavior', tags: ['bus', 'memory', 'interface'] },
  { designClass: 'bus_bridge_generic', family: 'bus', specificity: 'broad', aliases: ['bus\\s*bridge', 'bridge\\s*bus'], role: 'Implement a generic bus bridge with request normalization, response conversion, and status/error propagation.', interfaceKind: 'source bus request/response and destination bus request/response abstractions', coreBehavior: 'Own source request capture, destination command issue, response mapping, and bridge status/error outputs.', outputOwner: 'bus_bridge_generic_core owns source response outputs, destination request outputs, and status_o.', timing: 'bridge request-to-response latency is bounded and backpressure-safe.', verification: 'self-check one read, one write, destination error, and backpressure behavior', tags: ['bus', 'interface'] },
  { designClass: 'interrupt_mapped_peripheral', family: 'bus', specificity: 'subsystem', aliases: ['interrupt\\s*mapped', 'irq\\s*peripheral'], role: 'Implement a register-mapped peripheral with interrupt status, mask, pending, and clear behavior.', interfaceKind: 'register access plus irq output and event inputs', coreBehavior: 'Own interrupt event latch, mask register, pending bits, clear-on-write, and irq aggregation.', outputOwner: 'interrupt_mapped_peripheral_core owns irq_o, pending/status registers, and control outputs.', timing: 'irq_o reflects masked pending events after the documented clock edge.', verification: 'self-check event latch, mask/unmask, clear, and irq timing', tags: ['bus', 'register', 'safety', 'soc'] },
];

const ADDITIONAL_COMPREHENSIVE_PATTERN_SPECS: ComprehensivePatternSpec[] = [
  ['alu_core','compute','subsystem','\\balu\\s*core\\b','typed ALU datapath','typed operand/opcode/result ports','Compute opcode-selected arithmetic/logic results and flags using numeric_std-safe typed intermediates.','alu_core_core owns result_o and flag/status outputs.','result latency is same-cycle or one registered cycle according to the contract.','self-check arithmetic, logic, shift, and flag cases','compute numeric alu'],
  ['mac_unit','compute','leaf','\\bmac\\b|multiply\\s*accumulate','multiply-accumulate unit','typed sample/coefficient accumulator ports','Own multiply-add datapath, accumulator width growth, clear/enable control, and overflow status.','mac_unit_core owns accumulator/result/valid/status outputs.','valid result appears after the configured multiply/add pipeline latency.','self-check signed/unsigned MAC sequence and accumulator clear','compute dsp numeric'],
  ['multiply_accumulate_pipeline','compute','subsystem','multiply\\s*accumulate\\s*pipeline|mac\\s*pipeline','pipelined multiply-accumulate datapath','streamed operands, coefficient input, valid output','Own pipelined multiplier, adder tree/accumulator, valid shift register, and saturation/overflow status.','multiply_accumulate_pipeline_core owns result_valid_o, result_o, and overflow_o.','pipeline latency is explicit and verified in cycles.','self-check latency alignment and representative accumulated result','compute dsp numeric'],
  ['fixed_point_datapath','compute','subsystem','fixed\\s*point','fixed-point arithmetic datapath','signed/unsigned fixed-width numeric ports','Own scaling, rounding/truncation, saturation/wrap policy, and typed boundary conversions.','fixed_point_datapath_core owns numeric result and overflow/status outputs.','rounding/saturation timing is explicit for every output.','self-check representative fixed-point operations and overflow policy','compute dsp numeric'],
  ['saturating_arithmetic_unit','compute','leaf','saturating|saturation','saturating arithmetic unit','typed numeric operands and saturated result/status','Own signed/unsigned add/sub/limit comparison and saturation flag generation.','saturating_arithmetic_unit_core owns result_o and saturated_o.','saturation flag aligns with the result output cycle.','self-check positive and negative saturation boundaries','compute numeric safety'],
  ['barrel_shifter','compute','leaf','barrel\\s*shift|shifter','barrel shifter','data, shift amount, direction/type ports','Own logical/arithmetic/rotate shift selection and bounded shift amount behavior.','barrel_shifter_core owns shifted result and valid/status outputs.','shift result settles in the declared combinational or registered cycle.','self-check left/right/arithmetic/rotate and overshift behavior','compute numeric'],
  ['priority_encoder','compute','leaf','priority\\s*encoder','priority encoder','request vector input plus encoded index/valid output','Own priority scan policy, encoded output, valid flag, and no-request behavior.','priority_encoder_core owns index_o, valid_o, and empty/status outputs.','encoded output reflects the highest-priority asserted input by the declared cycle.','self-check no request, single request, and multi-request priority','compute control'],
  ['population_count','compute','leaf','population\\s*count|popcount','population count unit','bit-vector input and count output','Own bit-count reduction tree and typed count output width.','population_count_core owns count_o and valid_o.','count latency is combinational or registered as declared.','self-check all-zero, one-hot, alternating, and all-one vectors','compute numeric'],
  ['cordic_engine','compute','subsystem','cordic','CORDIC iterative engine','angle/vector inputs plus result/valid/status outputs','Own CORDIC iteration counter, vector registers, mode control, and convergence status.','cordic_engine_core owns x/y/angle result, valid, and status outputs.','valid result asserts after configured iteration count.','self-check one rotation/vectoring case and iteration latency','compute dsp numeric'],
  ['divider_iterative','compute','subsystem','divider|division','iterative divider','dividend/divisor/start/result/remainder ports','Own divide FSM, subtract/shift datapath, divide-by-zero status, and done output.','divider_iterative_core owns quotient_o, remainder_o, done_o, and div_zero_o.','done_o asserts after the bounded iteration count or divide-by-zero path.','self-check normal division, remainder, and divide-by-zero behavior','compute numeric safety'],
  ['sqrt_iterative','compute','subsystem','sqrt|square\\s*root','iterative square-root unit','radicand/start/root/remainder/done ports','Own square-root iteration FSM, partial remainder datapath, and completion status.','sqrt_iterative_core owns root_o, remainder_o, done_o, and status_o.','done_o asserts after the configured number of iterations.','self-check perfect square, non-perfect square, and zero input','compute numeric'],
  ['matrix_vector_engine','compute','subsystem','matrix\\s*vector','matrix-vector compute engine','matrix/vector sample inputs and result stream output','Own nested index counters, MAC sequencing, result buffering, and valid alignment.','matrix_vector_engine_core owns result_o, result_valid_o, busy_o, and status_o.','one result row/element latency is explicitly bounded.','self-check a small 2x2 or 3x3 matrix/vector operation','compute dsp memory'],
  ['vector_dot_product_engine','compute','subsystem','dot\\s*product','vector dot-product engine','vector element stream plus coefficient stream and result output','Own element counter, multiply-accumulate sequence, done/valid status, and overflow policy.','vector_dot_product_engine_core owns dot_o, valid_o, busy_o, and status_o.','valid_o asserts after the configured vector length is consumed.','self-check a short vector dot product and reset/clear behavior','compute dsp numeric'],
  ['streaming_reduction_engine','compute','subsystem','streaming\\s*reduction|reduce\\s*stream','streaming reduction engine','stream input with valid/last plus reduced result output','Own reduction operator, accumulator, packet boundary reset, result valid, and status.','streaming_reduction_engine_core owns result_o, result_valid_o, and status_o.','result_valid_o asserts on the accepted last beat.','self-check sum/min/max-like reduction and packet boundary behavior','compute streaming'],
  ['lookup_table_datapath','compute','leaf','lookup\\s*table|\\blut\\b','lookup-table datapath','index input and table output/status','Own ROM/table addressing, output register, bounds/default behavior, and valid status.','lookup_table_datapath_core owns data_o, valid_o, and range_error_o.','lookup output latency is documented as combinational or registered.','self-check in-range lookup, boundary index, and default/error path','compute memory'],
  ['crc_checksum_engine','compute','subsystem','\\bcrc\\b|checksum','CRC/checksum engine','byte/word stream input and checksum result/status','Own polynomial/checksum update state, clear/start, final result, and valid/status outputs.','crc_checksum_engine_core owns checksum_o, valid_o, and error/status outputs.','checksum valid aligns to packet end or explicit finalize control.','self-check known input sequence against a compact golden checksum','compute safety packet'],
  ['hash_lite_engine','compute','subsystem','hash\\s*lite|hash\\s*engine','lightweight hash engine','byte stream input and digest/status output','Own simple portable hash/mixing rounds, message boundary control, digest valid, and status.','hash_lite_engine_core owns digest_o, digest_valid_o, busy_o, and status_o.','digest_valid_o asserts after the declared number of rounds/beats.','self-check a short deterministic message digest and reset behavior','compute packet'],
  ['compression_lite_pipeline','compute','subsystem','compression\\s*lite|compress','lightweight compression pipeline','byte stream input/output with block status','Own token placeholder generation, run-length or simple compression state, output valid, and block status.','compression_lite_pipeline_core owns compressed_data_o, valid_o, block_done_o, and status_o.','block_done_o asserts after accepted final input and flushed output.','self-check a small repeated-byte block and uncompressed passthrough case','compute streaming memory'],
  ['fir_filter','dsp','subsystem','\\bfir\\b|finite\\s*impulse','FIR filter','sample/coefficient input and filtered sample output','Own tap delay line, coefficient multiply-accumulate, valid pipeline, and scaling/saturation status.','fir_filter_core owns sample_o, sample_valid_o, and overflow/status outputs.','output valid latency equals the declared tap pipeline latency.','self-check impulse/step response against a compact golden model','dsp numeric memory'],
  ['iir_filter','dsp','subsystem','\\biir\\b|infinite\\s*impulse','IIR filter','sample input and recursive filtered output','Own feedforward/feedback state, coefficient scaling, overflow policy, and valid alignment.','iir_filter_core owns sample_o, valid_o, and overflow/status outputs.','recursive state update and output valid timing are explicit per sample.','self-check a deterministic short input sequence and reset state','dsp numeric'],
  ['cic_filter','dsp','subsystem','\\bcic\\b','CIC filter','sample input plus decimated/interpolated output','Own integrator/comb stages, rate counter, bit growth, and valid timing.','cic_filter_core owns sample_o, valid_o, rate_tick_o, and status_o.','output valid appears at the configured rate-change boundary.','self-check decimation/interpolation counter and representative output','dsp numeric'],
  ['moving_average_filter','dsp','leaf','moving\\s*average','moving average filter','sample stream input and averaged output','Own window buffer/sum, sample count, divide/shift policy, and valid status.','moving_average_filter_core owns avg_o, valid_o, and status_o.','average output valid is delayed until the configured window is primed.','self-check ramp/constant input and window priming behavior','dsp memory numeric'],
  ['fft_pipeline','dsp','subsystem','\\bfft\\b','FFT pipeline','complex sample stream and transformed sample stream','Own staged butterfly placeholder, twiddle/index control, valid pipeline, and frame status.','fft_pipeline_core owns transformed sample, valid, frame_done, and status outputs.','frame output latency is explicit and aligned to valid pipeline stages.','self-check a tiny deterministic frame and valid/frame boundary timing','dsp numeric memory'],
  ['windowing_stage','dsp','leaf','windowing','DSP windowing stage','sample stream and coefficient/windowed output','Own coefficient lookup, multiply scaling, valid propagation, and overflow status.','windowing_stage_core owns sample_o, valid_o, and overflow/status outputs.','windowed output valid aligns with the input valid delayed by the declared latency.','self-check known coefficient/sample pairs and latency','dsp numeric memory'],
  ['complex_mixer','dsp','subsystem','complex\\s*mixer|iq\\s*mixer','complex mixer','I/Q sample input and oscillator/mixed output','Own complex multiply, NCO input consume, scaling, and output valid alignment.','complex_mixer_core owns i_o, q_o, valid_o, and overflow/status outputs.','mixed output latency is bounded by the complex multiply pipeline.', 'self-check one deterministic I/Q multiply and valid alignment','dsp numeric'],
  ['nco_phase_accumulator','dsp','leaf','\\bnco\\b|phase\\s*accumulator','NCO phase accumulator','phase increment/control and phase output','Own phase accumulator, wrap behavior, optional sine/cos lookup address, and valid/status outputs.','nco_phase_accumulator_core owns phase_o, phase_valid_o, and wrap/status outputs.','phase updates once per enable with deterministic wrap behavior.','self-check increment, wrap, reset, and phase-valid behavior','dsp numeric'],
  ['dds_waveform_generator','dsp','subsystem','\\bdds\\b|waveform\\s*generator','DDS waveform generator','phase increment/control and waveform sample output','Own phase accumulator, waveform lookup/sample generation, valid timing, and amplitude/status control.','dds_waveform_generator_core owns sample_o, valid_o, and status_o.','sample_valid_o asserts every enabled phase update after optional lookup latency.','self-check phase progression and representative waveform samples','dsp numeric memory'],
  ['iq_demodulator','dsp','subsystem','iq\\s*demodulator|demod','I/Q demodulator','sample input and I/Q output streams','Own mixer, low-pass placeholder/filter stage, valid alignment, and status outputs.','iq_demodulator_core owns i_o, q_o, valid_o, and status_o.','I/Q output valid latency is explicit and matched between channels.','self-check a deterministic tone/sample sequence and valid alignment','dsp numeric'],
  ['sample_rate_converter','dsp','subsystem','sample\\s*rate\\s*converter|rate\\s*converter','sample-rate converter','input/output sample streams with rate control','Own rate accumulator/counter, interpolation/decimation placeholder, valid timing, and status.','sample_rate_converter_core owns sample_o, valid_o, rate_event_o, and status_o.','output valid follows the declared rate conversion schedule.','self-check decimation/interpolation valid sequence and reset behavior','dsp audio numeric'],
  ['gain_offset_calibration','dsp','leaf','gain.*offset|calibration','gain/offset calibration block','sample input plus gain/offset controls and calibrated output','Own multiply/add calibration, scaling, saturation, and valid propagation.','gain_offset_calibration_core owns calibrated_o, valid_o, and overflow/status outputs.','calibrated output latency is explicit and stable for constant controls.','self-check gain, offset, saturation, and reset behavior','dsp sensors numeric'],
  ['digital_down_converter','dsp','subsystem','digital\\s*down\\s*converter|\\bddc\\b','digital down-converter','sample stream input and decimated baseband output','Own NCO/mixer/filter/decimator sequence, valid alignment, and status outputs.','digital_down_converter_core owns i_o, q_o, valid_o, and status_o.','baseband valid latency and decimation rate are explicit.','self-check simplified mix/filter/decimate sequence and valid timing','dsp numeric streaming'],
  ['digital_up_converter','dsp','subsystem','digital\\s*up\\s*converter|\\bduc\\b','digital up-converter','baseband stream input and interpolated/mixed output','Own interpolation/filter/NCO/mixer sequence, valid alignment, and status outputs.','digital_up_converter_core owns sample_o, valid_o, and status_o.','output valid schedule follows interpolation and mixer latency contract.','self-check simplified interpolate/mix sequence and valid timing','dsp numeric streaming'],
  ['sync_fifo','memory','leaf','sync\\s*fifo|synchronous\\s*fifo','synchronous FIFO','single-clock write/read data interface','Own memory array, write/read pointers, count/full/empty flags, and bounded index guards.','sync_fifo_core owns rd_data_o, full_o, empty_o, count_o, and status_o.','full/empty/count update on the same clock with deterministic read/write collision policy.','self-check push/pop, full, empty, simultaneous read/write, and reset','memory fifo'],
  ['async_fifo','memory','subsystem','async\\s*fifo|asynchronous\\s*fifo','asynchronous FIFO','independent write/read clocks with synchronized pointers','Own dual-clock memory, gray-coded pointer synchronization, full/empty flags, and CDC status.','async_fifo_core owns rd_data_o, wr_full_o, rd_empty_o, and cdc/status outputs.','full/empty flags account for synchronizer latency explicitly.','self-check write/read across separate clocks and reset synchronization','memory fifo cdc'],
  ['skid_buffer','memory','leaf','skid\\s*buffer','skid buffer','valid/ready stream input and output','Own one/two-entry buffering, ready backpressure, valid hold, and payload stability.','skid_buffer_core owns output valid/data and input ready outputs.','valid/data remain stable while downstream ready is low.','self-check no-stall, one-cycle stall, sustained stall, and reset behavior','memory streaming fifo'],
  ['stream_fifo','memory','subsystem','stream\\s*fifo','stream FIFO','valid/ready stream input/output with payload storage','Own payload queue, full/empty level, valid/ready behavior, and packet boundary preservation when present.','stream_fifo_core owns ready_o, valid_o, data_o, and level/status outputs.','backpressure and output valid timing are bounded by FIFO occupancy.', 'self-check stream ordering, backpressure, and reset state','memory fifo streaming'],
  ['packet_fifo','memory','subsystem','packet\\s*fifo','packet FIFO','stream payload plus packet boundary metadata','Own packet storage, last/length metadata, drop/error policy, and packet-valid output.','packet_fifo_core owns packet output, last/valid, full/empty, and packet status outputs.','packet boundary metadata is preserved through read/write operations.','self-check one packet, two packets, backpressure, and overflow/drop behavior','memory fifo packet'],
  ['dual_port_ram_controller','memory','subsystem','dual\\s*port\\s*ram','dual-port RAM controller','two typed memory ports with address/data/control signals','Own dual-port memory access, collision policy, byte/write enables, and read-data timing.','dual_port_ram_controller_core owns read data/status outputs for both ports.','read latency and same-address collision policy are explicit.','self-check independent reads/writes and collision behavior','memory'],
  ['single_port_ram_controller','memory','leaf','single\\s*port\\s*ram','single-port RAM controller','one typed memory port with read/write control','Own single-port memory, write enable, read latency, and address bound checking.','single_port_ram_controller_core owns read_data_o, valid_o, and status_o.','read data latency is explicitly one cycle or declared otherwise.','self-check write/readback, reset/init, and address boundary','memory'],
  ['rom_lookup_table','memory','leaf','rom\\s*lookup|lookup\\s*rom','ROM lookup table','address input and constant data output','Own ROM aggregate, complete choices/others default, address range, and read valid behavior.','rom_lookup_table_core owns data_o, valid_o, and range/status outputs.','ROM output latency is declared and aggregate covers every address.', 'self-check table entries, default/others, and boundary addresses','memory'],
  ['boot_rom_subsystem','memory','subsystem','boot\\s*rom','boot ROM subsystem','instruction/data address input and boot data output','Own boot ROM contents, address decode/range, read latency, and initialized output/status.','boot_rom_subsystem_core owns boot_data_o, valid_o, and range/status outputs.','boot data valid aligns with declared ROM read latency.','self-check first instruction, boundary address, and range error/default behavior','memory soc'],
  ['dma_engine','memory','subsystem','\\bdma\\b|direct\\s*memory\\s*access','DMA engine','local command/status plus memory-mapped master request interface','Own command registers, source/destination/count counters, read/write issue, completion/error status.', 'dma_engine_core owns memory requests, done_o, busy_o, error_o, and status_o.','done_o asserts after the configured transfer count reaches zero and all responses are accepted.','self-check short memory copy, zero-length command, and response error','memory bus'],
  ['scatter_gather_dma_lite','memory','subsystem','scatter\\s*gather','scatter-gather DMA-lite','descriptor input plus memory master request interface','Own descriptor fetch placeholder, segment counters, command issue, and completion/error status.','scatter_gather_dma_lite_core owns descriptor/memory requests and done/error/status outputs.','each descriptor segment completes before the next begins unless explicitly pipelined.','self-check two descriptors and an error descriptor path','memory bus'],
  ['packet_buffer','memory','subsystem','packet\\s*buffer','packet buffer','packet stream input/output plus memory storage status','Own packet memory addressing, write/read pointers, packet length metadata, and overflow/underflow status.','packet_buffer_core owns packet output, level/status, and error outputs.','packet data and length metadata remain aligned across buffering.','self-check packet write/read, overflow, and underflow behavior','memory packet fifo'],
  ['framebuffer_controller','memory','subsystem','framebuffer','framebuffer controller','pixel memory address/read/write ports plus video read stream','Own framebuffer address generation, read/write arbitration placeholder, frame boundary status, and pixel output.', 'framebuffer_controller_core owns pixel_o, pixel_valid_o, address requests, and status_o.','pixel read latency and frame boundary timing are explicit.','self-check representative pixel read/write and frame boundary behavior','memory video'],
  ['line_buffer','memory','leaf','line\\s*buffer','line buffer','pixel/sample stream input and delayed tap outputs','Own line memory, write/read address counters, tap valid alignment, and boundary status.','line_buffer_core owns tap outputs, valid_o, and status_o.','tap outputs become valid after the configured line/window fill latency.','self-check line fill, tap alignment, and reset behavior','memory video'],
  ['ring_buffer','memory','leaf','ring\\s*buffer|circular\\s*buffer','ring buffer','write/read command interface with circular addressing','Own circular pointers, wrap behavior, occupancy tracking, and overrun/underrun status.','ring_buffer_core owns data_o, level_o, overrun_o, underrun_o, and status_o.','pointer wrap and occupancy update are deterministic on each accepted command.','self-check wrap, full/empty, overrun, and underrun behavior','memory fifo'],
  ['cache_lite_readonly','memory','subsystem','cache\\s*lite|readonly\\s*cache','read-only cache-lite','read request interface plus backing memory request interface','Own tag/data arrays, hit/miss state, fill FSM, and response valid/status outputs.','cache_lite_readonly_core owns read_data_o, hit_o, miss_o, request outputs, and status_o.','hit response and miss refill latency are explicitly bounded.','self-check hit, miss/fill, invalidate/reset, and range behavior','memory bus'],
  ['register_file','memory','leaf','register\\s*file','register file','multi-port read/write register storage','Own register array, write enable/data, read ports, zero/default policy, and status outputs.','register_file_core owns read data ports and write/status outputs.','read-after-write behavior is explicitly same-cycle, next-cycle, or bypassed.','self-check reset, write/readback, read-after-write, and disabled write','memory soc'],
  ['memory_scrubber','memory','subsystem','memory\\s*scrubber|scrub','memory scrubber','memory read/write interface plus scrub control/status','Own scrub address counter, read/check/writeback sequence, error count, and done/status outputs.','memory_scrubber_core owns memory requests, corrected/error counters, done_o, and status_o.','scrub pass latency is bounded by memory range and access latency.','self-check scrub address sequence and injected error count behavior','memory safety'],
  ['memory_init_loader','memory','subsystem','memory\\s*init|init\\s*loader','memory initialization loader','initialization stream/input plus memory write interface','Own init address counter, data consume, write request, done/error status, and timeout behavior.','memory_init_loader_core owns memory write request outputs, done_o, error_o, and status_o.','done_o asserts after all initialized words are accepted.','self-check short init sequence, early end, and timeout/error behavior','memory'],
  ['vga_timing_generator','video_audio','subsystem','\\bvga\\b|vga\\s*timing','VGA timing generator','pixel clock/reset plus hsync/vsync/active counters','Own horizontal/vertical counters, sync pulse generation, active window, and frame tick status.','vga_timing_generator_core owns hsync_o, vsync_o, active_o, x/y counters, and frame_tick_o.','sync pulse widths and frame timing follow package constants exactly.','self-check counter wrap, sync pulse width, and active window boundaries','video'],
  ['hdmi_video_pipeline','video_audio','subsystem','\\bhdmi\\b','HDMI-style video pipeline','pixel stream plus sync/control outputs','Own pixel timing integration, video-data enable, control symbol placeholder, and status outputs.','hdmi_video_pipeline_core owns pixel/control outputs, valid_o, and status_o.','video timing and pixel valid are aligned to active display cycles.','self-check active video, sync/control boundaries, and representative pixel flow','video streaming'],
  ['sync_generator','video_audio','leaf','sync\\s*generator','sync generator','timing counters input and sync outputs','Own hsync/vsync or generic sync pulse comparisons and output polarity/status.','sync_generator_core owns sync output pins and timing status outputs.','sync edges occur at exact configured counter boundaries.','self-check pulse start/end boundaries and reset polarity','video'],
  ['active_video_window','video_audio','leaf','active\\s*video|active\\s*window','active video window detector','h/v counter input and active/output window signals','Own active-region comparisons, x/y valid mapping, and window status outputs.','active_video_window_core owns active_o, visible_x/y, and status outputs.','active_o transitions exactly at configured display boundaries.','self-check entry/exit of active region and blanking behavior','video'],
  ['pixel_address_generator','video_audio','leaf','pixel\\s*address','pixel address generator','x/y pixel coordinates and linear/framebuffer address output','Own bounded address calculation, row stride, active gating, and range status.','pixel_address_generator_core owns addr_o, valid_o, and range_error_o.','address output aligns to active pixel coordinates with declared latency.','self-check first pixel, row transition, frame boundary, and inactive range','video memory numeric'],
  ['framebuffer_reader','video_audio','subsystem','framebuffer\\s*reader','framebuffer reader','video timing input plus framebuffer memory read interface','Own active-window read requests, memory latency alignment, pixel output, and underflow/status.', 'framebuffer_reader_core owns memory address requests, pixel_o, pixel_valid_o, and status_o.','pixel output valid compensates for memory read latency.','self-check active pixel read address and delayed pixel valid timing','video memory'],
  ['camera_capture_pipeline','video_audio','subsystem','camera\\s*capture','camera capture pipeline','camera pixel/control inputs and frame buffer/stream output','Own pixel capture, line/frame detect, valid gating, optional buffer write, and status outputs.','camera_capture_pipeline_core owns pixel_valid_o, frame_valid_o, write_request outputs, and status_o.','frame/line valid timing follows captured sync/control inputs.','self-check one line/frame capture and invalid/blanking behavior','video sensors memory'],
  ['image_filter_pipeline','video_audio','subsystem','image\\s*filter','image filter pipeline','pixel stream input and filtered pixel stream output','Own pixel window/tap inputs, filter datapath, valid latency, and boundary policy.','image_filter_pipeline_core owns filtered_pixel_o, valid_o, and status_o.','filtered output latency is explicit and boundary pixels have documented behavior.','self-check representative pixel window and boundary behavior','video dsp'],
  ['sobel_edge_filter','video_audio','leaf','sobel','Sobel edge filter','3x3 pixel window or line-buffered pixel stream input','Own gradient approximation, magnitude/threshold policy, valid latency, and boundary status.','sobel_edge_filter_core owns edge_pixel_o, valid_o, and status_o.','edge output valid follows the line/window fill latency.','self-check a deterministic 3x3 window and threshold behavior','video dsp'],
  ['color_space_converter','video_audio','leaf','color\\s*space|rgb.*yuv|yuv.*rgb','color-space converter','RGB/YUV pixel input and converted pixel output','Own typed coefficient multiply/add, scaling/clip policy, and valid alignment.','color_space_converter_core owns converted_pixel_o, valid_o, and overflow/status outputs.','converted pixel valid aligns to declared coefficient pipeline latency.','self-check known RGB/YUV conversion vectors and clipping','video dsp numeric'],
  ['rgb_to_grayscale','video_audio','leaf','grayscale|grey\\s*scale','RGB to grayscale converter','RGB pixel input and grayscale pixel output','Own weighted sum/approximation, clipping policy, and valid propagation.','rgb_to_grayscale_core owns gray_o, valid_o, and status_o.','grayscale output valid aligns with input valid after declared latency.','self-check black, white, primary color, and mid-gray cases','video dsp numeric'],
  ['test_pattern_generator','video_audio','subsystem','test\\s*pattern|color\\s*bar','test pattern generator','timing counters and pixel output','Own color bars/checker/ramp pattern selection, active gating, and pixel/status outputs.','test_pattern_generator_core owns pixel_o, valid_o, and status_o.','pattern output is deterministic for each x/y coordinate.', 'self-check representative coordinates and active/blanking behavior','video'],
  ['sprite_overlay_engine','video_audio','subsystem','sprite\\s*overlay|overlay','sprite overlay engine','background pixel stream plus sprite position/pixel inputs','Own sprite bounds comparison, transparency policy, mux output, and valid alignment.','sprite_overlay_engine_core owns pixel_o, valid_o, sprite_hit_o, and status_o.','overlay valid aligns to background pixel stream latency.','self-check inside/outside sprite, transparency, and reset behavior','video memory'],
  ['video_scaler_lite','video_audio','subsystem','video\\s*scaler|scaler','lightweight video scaler','input pixel stream and output pixel stream with scale control','Own nearest-neighbor coordinate mapping, counters, valid timing, and boundary status.','video_scaler_lite_core owns scaled_pixel_o, valid_o, and status_o.','output coordinate mapping and valid schedule are explicitly bounded.','self-check simple 2x scale/downscale coordinate mapping','video memory numeric'],
  ['line_buffered_convolution','video_audio','subsystem','line\\s*buffered\\s*convolution|convolution','line-buffered convolution pipeline','pixel stream input and convolved pixel output','Own line buffers, tap window, coefficient multiply-add placeholder, valid latency, and boundary status.','line_buffered_convolution_core owns pixel_o, valid_o, and status_o.','convolution output valid begins after line/window fill latency.','self-check one 3x3 window, boundary policy, and latency','video dsp memory'],
  ['i2s_audio_interface','video_audio','subsystem','\\bi2s\\b','I2S audio interface','bit clock, word select, serial data, and sample stream ports','Own serial shift, word-select alignment, sample valid, channel select, and status outputs.','i2s_audio_interface_core owns serial/audio sample outputs, sample_valid_o, and status_o.','sample_valid_o asserts at the configured word boundary.','self-check left/right sample receive/transmit alignment','audio protocol'],
  ['tdm_audio_interface','video_audio','subsystem','tdm\\s*audio','TDM audio interface','frame sync, serial data, slot/sample ports','Own slot counter, serial shift, channel mapping, sample valid, and status outputs.','tdm_audio_interface_core owns channel sample outputs, valid_o, and slot/status outputs.','channel valid timing follows configured slot boundaries.','self-check two or more TDM slots and frame sync behavior','audio protocol'],
  ['audio_sample_pipeline','video_audio','subsystem','audio\\s*sample\\s*pipeline','audio sample pipeline','sample stream input/output with valid/status','Own sample staging, optional gain/filter slots, valid latency, and clipping/status outputs.','audio_sample_pipeline_core owns sample_o, valid_o, and status_o.','sample latency is explicit and channel alignment is preserved.','self-check reset, one sample path, and valid alignment','audio dsp'],
  ['audio_volume_control','video_audio','leaf','volume\\s*control','audio volume control','sample input plus volume/gain control and sample output','Own gain multiply/shift, saturation/clipping, mute behavior, and valid propagation.','audio_volume_control_core owns sample_o, valid_o, clipping_o, and status_o.','volume-adjusted sample valid aligns with declared latency.','self-check unity gain, mute, clipping, and mid-gain cases','audio dsp numeric'],
  ['audio_mixer','video_audio','subsystem','audio\\s*mixer','audio mixer','multiple sample inputs and mixed sample output','Own channel sum, gain/weight placeholder, saturation policy, valid alignment, and status.','audio_mixer_core owns mixed_sample_o, valid_o, clipping_o, and status_o.','mixed output valid only when required channel samples are aligned.','self-check two-channel mix, clipping, and reset behavior','audio dsp numeric'],
  ['audio_sample_rate_converter','video_audio','subsystem','audio\\s*sample\\s*rate','audio sample-rate converter','audio sample input/output with rate control','Own rate accumulator, sample hold/interpolate placeholder, valid timing, and status outputs.','audio_sample_rate_converter_core owns sample_o, valid_o, rate_event_o, and status_o.','output valid schedule follows the declared conversion ratio.','self-check simple decimation/interpolation schedule and sample hold behavior','audio dsp'],
  ['pdm_microphone_decoder','video_audio','subsystem','pdm\\s*microphone|\\bpdm\\b','PDM microphone decoder','PDM bit input and PCM sample output','Own bit accumulation/filter placeholder, decimation counter, sample valid, and status outputs.','pdm_microphone_decoder_core owns pcm_sample_o, valid_o, and status_o.','PCM sample valid asserts after the configured decimation window.','self-check all-zero/all-one/alternating PDM windows and valid timing','audio dsp sensors'],
  ['sine_wave_audio_generator','video_audio','leaf','sine\\s*wave\\s*audio|tone\\s*generator','sine-wave audio generator','phase/frequency control and sample output','Own phase accumulator, sine lookup/approximation, amplitude control, and sample valid output.','sine_wave_audio_generator_core owns sample_o, valid_o, and status_o.','sample_o updates once per sample enable with deterministic phase progression.','self-check phase increment, wrap, and representative sample values','audio dsp numeric'],
  ['microcoded_controller','soc','subsystem','microcoded','microcoded controller','microinstruction ROM/control outputs/status','Own micro-PC, microinstruction decode, sequencer, branch/dispatch, and control/status outputs.','microcoded_controller_core owns control outputs, micro_pc_o, done_o, and status_o.','microinstruction sequencing and branch latency are explicit.','self-check reset vector, two microinstructions, branch, and halt/status','soc control memory'],
  ['instruction_decoder','soc','leaf','instruction\\s*decoder|decode\\s*instruction','instruction decoder','instruction word input and typed control outputs','Own opcode/field extraction, control signal decode, illegal opcode status, and default-safe controls.','instruction_decoder_core owns decoded control outputs and illegal_o/status_o.','decoded outputs settle or register in the declared decode cycle.','self-check ADD/load/store/halt/illegal opcode decode','soc cpu'],
  ['program_counter','soc','leaf','program\\s*counter|\\bpc\\b','program counter','reset/enable/branch input and PC output','Own reset PC value, increment, branch/load, hold behavior, and status outputs.','program_counter_core owns pc_o, valid_o, and branch/status outputs.','PC updates on the documented clock edge and reset sample timing is explicit.','self-check reset PC, increment, hold, and branch load','soc cpu'],
  ['register_file_cpu','soc','leaf','cpu\\s*register\\s*file','CPU register file','CPU read/write register ports','Own CPU register storage, read ports, write enable/data, zero/default policy, and bypass/read-after-write behavior.','register_file_cpu_core owns read data ports and write/status outputs.','read-after-write behavior is explicitly same-cycle, next-cycle, or bypassed.','self-check reset, write/readback, disabled write, and read-after-write','soc cpu memory'],
  ['alu_cpu_datapath','soc','leaf','cpu\\s*alu|alu\\s*datapath','CPU ALU datapath','CPU operand/control inputs and result/flags outputs','Own CPU arithmetic/logic result, flag generation, branch compare status, and typed numeric boundaries.','alu_cpu_datapath_core owns result_o, flags_o, branch_taken_o, and status_o.','ALU result/flags align to the execute cycle contract.','self-check CPU ADD/SUB/logic/compare flag cases','soc cpu compute'],
  ['control_fsm_cpu','soc','subsystem','cpu\\s*control\\s*fsm|control\\s*fsm','CPU control FSM','decoded instruction/control inputs and sequencer outputs','Own fetch/decode/execute/writeback states, memory/regfile controls, halt/done/status behavior.','control_fsm_cpu_core owns write enable, memory controls, halt/done/status outputs.','control outputs are valid in the documented CPU cycle/state.','self-check reset/fetch, ADD no memory write, load/store controls, and halt','soc cpu control'],
  ['interrupt_controller','soc','subsystem','interrupt\\s*controller|\\birq\\b','interrupt controller','event inputs, mask registers, vector/status outputs','Own pending/mask/priority, acknowledge/clear behavior, vector selection, and irq output.','interrupt_controller_core owns irq_o, vector_o, pending_o, and status_o.','irq/vector outputs update deterministically after event/mask changes.','self-check event latch, mask, priority, acknowledge, and clear behavior','soc safety bus'],
  ['timer_counter_peripheral','soc','subsystem','timer|counter\\s*peripheral','timer/counter peripheral','clock enable/control register input and compare/irq outputs','Own counter, prescaler/enable, compare match, reload, irq/status, and control register behavior.','timer_counter_peripheral_core owns count_o, match_o, irq_o, and status_o.','match/irq timing is defined relative to counter update cycle.','self-check reset, count enable, compare match, reload, and irq clear','soc control'],
  ['gpio_peripheral','soc','subsystem','\\bgpio\\b','GPIO peripheral','register-controlled input/output pins and status','Own direction register, output register, input synchronizer/readback, edge/status flags, and optional interrupt.','gpio_peripheral_core owns gpio_o, gpio_oe_o, status/readback, and irq_o.','input sampling and output update timing are explicit.','self-check direction, output write, input readback, and edge flag','soc bus'],
  ['pwm_peripheral','soc','subsystem','pwm\\s*peripheral','PWM peripheral','control registers and PWM output/status','Own period/duty registers, counter, compare output, enable, and status/irq flags.','pwm_peripheral_core owns pwm_o, period_tick_o, and status_o.','PWM output changes according to period/duty counter boundaries.','self-check duty cycle, period wrap, enable/disable, and reset','soc control motor'],
  ['watchdog_timer','soc','subsystem','watchdog\\s*timer','watchdog timer','kick/control input and timeout/reset/status output','Own timeout counter, kick synchronization, enable/window policy, timeout flag, and reset request.','watchdog_timer_core owns timeout_o, reset_req_o, and status_o.','timeout asserts after exactly the configured no-kick interval.','self-check kick before timeout, timeout assertion, disable, and reset behavior','soc safety'],
  ['simple_soc_top','soc','broad','simple\\s*soc|system\\s*on\\s*chip|\\bsoc\\b','simple SoC top','CPU/peripheral/memory bus top-level interface','Own top-level CPU/peripheral/memory interconnect, reset/status integration, and debug observability.','simple_soc_top_core owns top-level done/error/status/debug outputs through integrated blocks.','reset sequencing and first bus/peripheral access timing are explicitly defined.','self-check reset, one register/peripheral access, interrupt/status, and memory path','soc bus memory'],
  ['memory_mapped_peripheral_subsystem','soc','subsystem','memory\\s*mapped\\s*peripheral','memory-mapped peripheral subsystem','bus/register interface plus local peripheral control/status','Own address decode, CSR block, peripheral command strobes, status readback, and error response.','memory_mapped_peripheral_subsystem_core owns control outputs, bus response, and status/error outputs.','bus access response timing and peripheral strobe timing are bounded.','self-check write/readback, peripheral command strobe, status mirror, and invalid address','soc bus register'],
  ['debug_status_port','soc','leaf','debug\\s*status','debug/status port','debug/status input records and observable output bus','Own status packing, debug muxing, sticky flags, and optional snapshot trigger behavior.','debug_status_port_core owns debug_data_o, valid_o, and status outputs.','debug snapshot/update timing is explicit and stable for readback.','self-check status packing, sticky flag, and snapshot behavior','soc verification safety'],
  ['uart_bootloader_interface','soc','subsystem','uart\\s*bootloader|bootloader','UART bootloader interface','UART byte stream and boot memory write/control outputs','Own boot command parse, address/data counters, memory writes, checksum/status, and done/error outputs.','uart_bootloader_interface_core owns memory write request outputs, done_o, error_o, and status_o.','done_o asserts after the final checked boot payload word is written.','self-check small boot packet, checksum error, and address boundary','soc uart memory'],
  ['pid_controller','control','subsystem','\\bpid\\b','PID controller','setpoint/measurement input and control output','Own proportional/integral/derivative terms, scaling, saturation, integral clamp policy, and valid status.','pid_controller_core owns control_o, valid_o, saturated_o, and status_o.','control output latency is explicit and integral reset behavior is deterministic.','self-check zero error, positive/negative error, saturation, and reset','control numeric dsp'],
  ['multi_axis_pid_controller','control','subsystem','multi\\s*axis\\s*pid|3\\s*axis\\s*pid','multi-axis PID controller','multiple setpoint/measurement axes and control vector output','Own per-axis PID calculations, vector status, saturation, and valid alignment.','multi_axis_pid_controller_core owns control vector outputs, valid_o, and status_o.','all axis outputs align to the same valid cycle.','self-check two/three-axis deterministic response and saturation','control numeric dsp'],
  ['pwm_motor_controller','control','subsystem','pwm\\s*motor|motor\\s*pwm','PWM motor controller','command input and PWM/enable motor outputs','Own period/duty counter, command scaling, enable/failsafe gate, and status outputs.','pwm_motor_controller_core owns pwm_o, enable_o, done/valid/status outputs.','PWM duty changes only at period boundaries unless explicitly documented.','self-check reset-safe output, duty command, period wrap, and disable/failsafe','control motor'],
  ['bldc_commutation_controller_lite','control','subsystem','bldc|commutation','BLDC commutation controller-lite','hall/position input and phase drive outputs','Own commutation state table, phase enable outputs, invalid sensor/failsafe status, and timing.', 'bldc_commutation_controller_lite_core owns phase outputs, valid_o, error_o, and status_o.','phase drive updates at sensor/enable boundaries with safe reset state.','self-check legal hall sequence, invalid hall, and safe disable','control motor safety'],
  ['stepper_motor_controller','control','subsystem','stepper','stepper motor controller','step/direction command and coil/step outputs','Own step interval counter, direction, phase sequence, limit/status, and enable/failsafe behavior.','stepper_motor_controller_core owns coil/step outputs, busy_o, error_o, and status_o.','step pulses and phase transitions occur on configured interval ticks.','self-check step count, direction, limit/failsafe, and reset','control motor'],
  ['quadrature_encoder_interface','control','subsystem','quadrature|encoder','quadrature encoder interface','A/B/Z inputs and position/count/status outputs','Own input synchronization, quadrature decode, position counter, direction, index, and error status.','quadrature_encoder_interface_core owns position_o, direction_o, index_o, and status_o.','position updates once per valid quadrature transition after synchronization.','self-check forward, reverse, invalid transition, and index behavior','control sensors cdc'],
  ['servo_pulse_controller','control','leaf','servo\\s*pulse','servo pulse controller','position command and servo pulse output','Own frame counter, pulse-width compare, command clamp, and status outputs.','servo_pulse_controller_core owns pulse_o, frame_tick_o, and status_o.','pulse width is deterministic for each command and updates at frame boundary.','self-check min/mid/max pulse widths and reset-safe output','control motor'],
  ['robotics_control_loop','control','broad','robotics\\s*control|robot\\s*controller','robotics control loop','sensor/setpoint input and actuator command output','Own sensor capture, control law placeholder, actuator command timing, safety/failsafe, and status outputs.','robotics_control_loop_core owns actuator outputs, valid_o, error_o, and status_o.','control output latency and failsafe timing are explicit.','self-check reset-safe outputs, nominal response direction, and failsafe override','control sensors motor safety'],
  ['sensor_fusion_pipeline','control','subsystem','sensor\\s*fusion','sensor fusion pipeline','multiple sensor sample inputs and fused estimate output','Own sample alignment, validity gating, simplified fusion estimator, covariance/status placeholder, and valid output.','sensor_fusion_pipeline_core owns estimate_o, valid_o, stale_o, and status_o.','fused output valid only when required input samples are aligned.','self-check aligned samples, stale sensor, and reset behavior','control sensors dsp'],
  ['imu_sensor_frontend','control','subsystem','\\bimu\\b|inertial','IMU sensor frontend','SPI/I2C/sample input and typed IMU sample record output','Own IMU register/sample acquisition, scaling/status placeholder, sample valid, and error outputs.','imu_sensor_frontend_core owns imu_sample_o, valid_o, error_o, and status_o.','sample_valid_o asserts after the declared acquisition transaction/window.','self-check deterministic sample capture, invalid sample, and reset behavior','control sensors spi i2c'],
  ['failsafe_watchdog','control','subsystem','failsafe','failsafe watchdog','valid/heartbeat inputs and safe override outputs','Own heartbeat timeout, invalid-input latch, safe-state mux control, and status/error outputs.','failsafe_watchdog_core owns safe_override_o, error_o, and status_o.','safe override asserts after the configured missing-heartbeat timeout.','self-check heartbeat present, timeout, invalid input, and clear/reset behavior','control safety'],
  ['control_status_supervisor','control','subsystem','control\\s*status\\s*supervisor|supervisor','control/status supervisor','subsystem health inputs and aggregated status/control outputs','Own status aggregation, mode control, sticky errors, clear behavior, and debug/status output.','control_status_supervisor_core owns mode/status/error outputs.','status updates and sticky clear timing are explicit.','self-check status aggregation, sticky error, clear, and reset','control safety soc'],
  ['closed_loop_actuator_controller','control','subsystem','closed\\s*loop\\s*actuator|actuator\\s*controller','closed-loop actuator controller','setpoint/feedback input and actuator command output','Own error computation, controller datapath, command clamp, actuator valid, and fault/status outputs.','closed_loop_actuator_controller_core owns actuator_cmd_o, valid_o, saturated_o, and fault/status outputs.','actuator command latency and saturation behavior are explicit.','self-check nominal response, saturation, invalid feedback, and reset-safe output','control motor sensors'],
  ['adc_sample_capture','sensors','subsystem','adc\\s*sample|\\badc\\b','ADC sample capture','ADC sample/control input and captured sample stream output','Own sample strobe, channel counter, sample register, overrun/status, and valid output.','adc_sample_capture_core owns sample_o, valid_o, channel_o, and status_o.','sample_valid_o aligns to accepted ADC sample strobes.','self-check channel sequence, valid pulse, overrun, and reset','sensors streaming'],
  ['adc_stream_processor','sensors','subsystem','adc\\s*stream','ADC stream processor','ADC sample stream and processed sample/status output','Own sample validation, optional average/filter stage, threshold/status flags, and valid alignment.','adc_stream_processor_core owns processed_sample_o, valid_o, threshold_o, and status_o.','processed output latency is explicit and stable across channels.','self-check representative samples, threshold, and valid timing','sensors dsp'],
  ['sensor_frontend_spi','sensors','subsystem','spi\\s*sensor|sensor.*spi','SPI sensor frontend','SPI master command/status plus sensor sample output','Own SPI transaction sequence, register read/write command, sample decode, and error/status outputs.','sensor_frontend_spi_core owns SPI outputs, sample_o, valid_o, error_o, and status_o.','sample_valid_o asserts after the configured SPI read transaction completes.','self-check deterministic sensor read command and returned sample/status','sensors spi protocol'],
  ['sensor_frontend_i2c','sensors','subsystem','i2c\\s*sensor|sensor.*i2c','I2C sensor frontend','I2C command/status plus sensor sample output','Own I2C transaction sequence, register address/data handling, sample decode, ACK/error/status outputs.','sensor_frontend_i2c_core owns I2C drive intent, sample_o, valid_o, error_o, and status_o.','sample_valid_o asserts after a completed ACKed I2C read transaction.','self-check deterministic sensor register read and ACK error path','sensors i2c protocol'],
  ['debounce_filter','sensors','leaf','debounce','debounce filter','noisy digital input and debounced output/event','Own synchronizer placeholder, stability counter, debounced state, edge event, and status outputs.','debounce_filter_core owns debounced_o, edge_o, and status_o.','debounced output changes only after the configured stable count.','self-check bounce rejection, stable transition, and reset','sensors safety'],
  ['edge_event_counter','sensors','leaf','edge\\s*event|event\\s*counter','edge/event counter','event input and count/status output','Own edge detect/synchronization, count increment, overflow status, and optional clear behavior.','edge_event_counter_core owns count_o, event_o, overflow_o, and status_o.','count increments once per detected legal edge.','self-check rising/falling edge detection, clear, and overflow','sensors control'],
  ['timestamp_capture','sensors','subsystem','timestamp','timestamp capture','event input and timestamp/status output','Own free-running timestamp counter, event latch, capture register, valid/overflow status.','timestamp_capture_core owns timestamp_o, valid_o, overflow_o, and status_o.','timestamp captures the counter value from the event detection cycle.','self-check event capture, back-to-back events, clear, and reset','sensors control'],
  ['pulse_width_measurement','sensors','subsystem','pulse\\s*width','pulse-width measurement','digital pulse input and measured width/status output','Own edge detection, high/low width counter, valid flag, timeout/overflow status.','pulse_width_measurement_core owns width_o, valid_o, timeout_o, and status_o.','width_o reflects the number of counted cycles between selected edges.','self-check short pulse, long pulse, timeout, and reset','sensors control'],
  ['frequency_counter','sensors','subsystem','frequency\\s*counter','frequency counter','event/clock input and frequency/count output','Own measurement gate counter, event counter, result latch, valid, and overflow/status outputs.','frequency_counter_core owns frequency_count_o, valid_o, overflow_o, and status_o.','result_valid_o asserts at the end of each measurement gate.','self-check known event rate, zero events, and overflow behavior','sensors control'],
  ['event_logger_lite','sensors','subsystem','event\\s*logger','event logger-lite','event inputs and small log memory/status output','Own event capture, timestamp/ID packing, write pointer, overflow status, and readback interface.','event_logger_lite_core owns log_data_o, valid_o, overflow_o, and status_o.','log entries are written in event order with deterministic overflow policy.','self-check event order, overflow, and readback','sensors memory safety'],
  ['threshold_detector','sensors','leaf','threshold\\s*detector','threshold detector','sample input, threshold controls, and event/status output','Own comparison, hysteresis placeholder, event latch, clear behavior, and status outputs.','threshold_detector_core owns above_o, event_o, and status_o.','event output asserts on the declared threshold crossing condition.','self-check below/above/equal threshold and latch clear','sensors safety numeric'],
  ['trigger_capture_unit','sensors','subsystem','trigger\\s*capture','trigger capture unit','trigger/sample input and captured window/status output','Own trigger condition, pre/post counter placeholder, capture valid, and buffer/status outputs.','trigger_capture_unit_core owns capture_valid_o, capture_data_o, done_o, and status_o.','capture_done_o asserts after the configured post-trigger sample count.','self-check trigger condition, capture length, and timeout/no-trigger behavior','sensors memory'],
  ['fault_status_aggregator','safety','subsystem','fault\\s*status|fault\\s*aggregator','fault/status aggregator','fault inputs and aggregated status/error outputs','Own fault OR/reduction, priority encode, sticky status, clear behavior, and debug output.','fault_status_aggregator_core owns fault_o, fault_code_o, sticky_status_o, and status_o.','fault outputs update deterministically with optional sticky clear timing.','self-check single fault, multiple fault priority, sticky clear, and reset','safety control'],
  ['timeout_monitor','safety','leaf','timeout\\s*monitor','timeout monitor','activity/valid input and timeout/status output','Own watchdog counter, activity reset, timeout latch, clear/enable behavior, and status output.','timeout_monitor_core owns timeout_o, active_o, and status_o.','timeout_o asserts after the configured number of inactive cycles.','self-check activity before timeout, timeout assertion, clear, and disable','safety control'],
  ['watchdog_supervisor','safety','subsystem','watchdog\\s*supervisor','watchdog supervisor','multiple heartbeat inputs and reset/fault/status outputs','Own per-channel heartbeat counters, aggregate fault, reset request, and status reporting.','watchdog_supervisor_core owns reset_req_o, fault_o, fault_code_o, and status_o.','fault/reset request timing is bounded by each channel timeout.','self-check good heartbeats, one missing channel, clear, and reset','safety control'],
  ['parity_memory_wrapper','safety','subsystem','parity\\s*memory','parity memory wrapper','memory data/address interface plus parity status','Own parity generation/check, memory request pass-through, error flag, and corrected/pass-through data status.','parity_memory_wrapper_core owns memory outputs, parity_error_o, and status_o.','parity error aligns to the read data valid cycle.','self-check write parity, read good data, injected parity error','safety memory'],
  ['ecc_memory_wrapper_lite','safety','subsystem','ecc\\s*memory|error\\s*correction','ECC memory wrapper-lite','memory data/address interface plus ECC status','Own simple ECC/parity placeholder, syndrome/status generation, corrected/error output, and counters.','ecc_memory_wrapper_lite_core owns corrected_data_o, error_o, corrected_o, and status_o.','error/corrected flags align to read data valid cycle.','self-check no-error, single-error placeholder, and uncorrectable status','safety memory'],
  ['crc_packet_checker','safety','subsystem','crc\\s*packet\\s*checker','CRC packet checker','packet byte stream and CRC pass/fail/status output','Own CRC accumulation, packet boundary finalize, pass/fail output, and error/status counters.','crc_packet_checker_core owns pass_o, fail_o, packet_done_o, and status_o.','pass/fail asserts at packet end after checksum compare.','self-check good packet, bad packet, and reset/finalize behavior','safety packet'],
  ['safe_state_controller','safety','subsystem','safe\\s*state','safe-state controller','fault/mode inputs and safe output override controls','Own mode FSM, fault override, safe output mux enables, recovery policy, and status outputs.','safe_state_controller_core owns safe_mode_o, output_enable_o, and status/error outputs.','safe_mode_o asserts immediately or within the declared fault response window.','self-check nominal mode, fault entry, recovery/reset, and output override','safety control'],
  ['reset_sequencer','safety','subsystem','reset\\s*sequencer','reset sequencer','raw reset/lock inputs and sequenced reset outputs','Own reset synchronization/release counters, dependency ordering, lock monitoring, and status outputs.','reset_sequencer_core owns sequenced resets and reset_status_o.','reset outputs release in the declared order and minimum cycle spacing.','self-check reset assertion, ordered release, lock loss, and reassertion','safety clock_reset'],
  ['clock_enable_supervisor','safety','leaf','clock\\s*enable\\s*supervisor','clock-enable supervisor','enable requests and gated clock-enable/status outputs','Own enable qualification, rate limiting, fault masking, and status output without generating clocks.','clock_enable_supervisor_core owns clock_enable_o and status/fault outputs.','clock_enable_o is generated synchronously and never gates a clock signal directly.','self-check enable request, inhibit, rate limit, and reset','safety clock_reset'],
  ['assertion_monitor_block','safety','subsystem','assertion\\s*monitor','assertion monitor block','condition inputs and error/status outputs','Own runtime condition checks as synthesizable monitors, sticky fail flags, counters, and clear behavior.','assertion_monitor_block_core owns fail_o, fail_code_o, and status_o.','fail flags latch on the first violated condition until cleared/reset.','self-check passing condition, failing condition, sticky clear, and reset','safety verification'],
  ['error_counter_status_block','safety','leaf','error\\s*counter','error counter/status block','error event inputs and count/status outputs','Own saturating/wrapping error counters, clear behavior, threshold status, and readback.','error_counter_status_block_core owns count_o, threshold_o, and status_o.','counter update and threshold flag timing are explicit.','self-check count increment, threshold, clear, and overflow policy','safety control'],
  ['health_telemetry_block','safety','subsystem','health\\s*telemetry|telemetry','health telemetry block','health/status inputs and packed telemetry output','Own status packing, heartbeat generation, snapshot/valid timing, and error/status output.','health_telemetry_block_core owns telemetry_data_o, valid_o, heartbeat_o, and status_o.','telemetry snapshot updates at the declared interval or trigger.','self-check packed status fields, heartbeat interval, and reset defaults','safety packet control'],
  ['self_checking_testbench_pattern','verification','leaf','self\\s*checking\\s*testbench','self-checking testbench pattern','DUT instance plus deterministic stimulus/check outputs','Own clock/reset stimulus, helper procedures, scoreboard flags, timeout, PASS/FAIL, and std.env.stop success behavior.','self_checking_testbench_pattern_core owns test_failed bookkeeping and simulation completion behavior.','checks sample synchronous outputs only after clock-edge updates settle.','self-check the testbench harness itself with PASS and FAIL paths','verification'],
  ['scoreboard_monitor_pattern','verification','leaf','scoreboard','scoreboard monitor pattern','expected/actual event streams and pass/fail status','Own expected transaction queue, actual comparison, mismatch reporting, and final pass/fail status.','scoreboard_monitor_pattern_core owns mismatch_o, pass_o, fail_o, and status_o.','mismatch is reported on the accepted actual transaction cycle.','self-check matching and mismatching transaction streams','verification packet'],
  ['bus_functional_model_pattern','verification','subsystem','bus\\s*functional\\s*model|\\bbfm\\b','bus functional model pattern','testbench-side bus command sequencer','Own legal bus transaction tasks/procedures, wait states, readback checks, and timeout behavior.','bus_functional_model_pattern_core owns TB command/check sequencing and failure reporting.','BFM waits for ready/valid/ack exactly as the bus contract defines.','self-check write/read/timeout BFM sequences','verification bus'],
  ['golden_model_comparator_pattern','verification','leaf','golden\\s*model|comparator','golden-model comparator pattern','stimulus input, DUT actual output, expected model output','Own compact reference calculation, actual/expected comparison, and mismatch reporting.','golden_model_comparator_pattern_core owns mismatch/fail reporting and expected output generation.','comparison occurs after the DUT latency window declared by the contract.','self-check one matching and one intentionally mismatching comparison','verification compute'],
  ['protocol_monitor_pattern','verification','subsystem','protocol\\s*monitor','protocol monitor pattern','observed protocol pins/stream and error/status output','Own protocol rule checks, transaction capture, timeout status, and assertion-safe reporting.','protocol_monitor_pattern_core owns protocol_error_o, transaction_valid_o, and status_o.','monitor checks are aligned to observed handshake or sampled protocol edges.','self-check legal transaction, illegal transaction, and timeout rule','verification protocol'],
  ['timeout_guard_pattern','verification','leaf','timeout\\s*guard','timeout guard pattern','testbench progress event and timeout failure output','Own simulation-cycle timeout counter, progress reset, fail report, and completion guard.','timeout_guard_pattern_core owns timeout fail reporting for TB flow.','timeout fires only after the declared number of cycles without progress.','self-check progress before timeout and timeout failure path','verification safety'],
  ['clock_reset_tb_harness','verification','leaf','clock\\s*reset\\s*tb|reset\\s*harness','clock/reset testbench harness','testbench clock/reset generation and settled sampling utilities','Own deterministic clock, reset pulse, post-reset wait, and sampling helper procedures.','clock_reset_tb_harness_core owns TB clock/reset sequencing and settled-sample timing.','all synchronous checks occur after a post-edge settle interval.','self-check reset pulse length and sample timing utility','verification clock_reset'],
  ['stream_stimulus_generator','verification','leaf','stream\\s*stimulus','stream stimulus generator','testbench stream valid/ready/data/last generator','Own deterministic stream packet stimuli, backpressure patterns, last markers, and expected transaction records.','stream_stimulus_generator_core owns TB stimulus and expected stream metadata.','stimulus holds valid/data stable while ready is low.','self-check stream packet generation and backpressure hold','verification streaming'],
  ['memory_model_testbench','verification','subsystem','memory\\s*model\\s*testbench','memory model testbench pattern','testbench memory request/response model','Own deterministic RAM/ROM model, latency, response error injection, and read/write checks.','memory_model_testbench_core owns TB memory response and expected memory state.','memory response latency follows the configured cycles.','self-check read/write response and error injection','verification memory'],
  ['register_map_testbench','verification','subsystem','register\\s*map\\s*testbench','register-map testbench pattern','register bus BFM plus reset/read/write checks','Own reset default checks, write/readback checks, read-only status checks, and invalid address tests.','register_map_testbench_core owns TB register transactions and fail reporting.','register checks respect bus response timing and reset settle timing.','self-check reset defaults, legal writes, status readback, and invalid address','verification bus register'],
  ['coverage_scenario_matrix','verification','subsystem','coverage\\s*scenario','coverage scenario matrix','verification scenario list and coverage/status output','Own scenario enumeration, coverage flags, pass/fail aggregation, and missing-coverage reporting.','coverage_scenario_matrix_core owns TB coverage bookkeeping and summary status.','coverage flags update only when their checks complete successfully.','self-check covered, uncovered, and failed scenario bookkeeping','verification'],
  ['waveform_debug_plan','verification','leaf','waveform\\s*debug|debug\\s*waveform','waveform debug plan','GHDL waveform command metadata and signal list','Own exact waveform output plan, signal observability list, and debug checkpoints for generated tests.','waveform_debug_plan_core owns simulation metadata and debug checkpoint reporting.','waveform/debug checkpoints align with testbench phases.','self-check generated GHDL command metadata includes waveform output','verification tool_flow'],
].map(([designClass, family, specificity, alias, roleName, interfaceKind, coreBehavior, outputOwner, timing, verification, tags]) => ({
  designClass,
  family: family as ComprehensivePatternSpec['family'],
  specificity: specificity as ComprehensivePatternSpec['specificity'],
  aliases: [alias],
  role: `Implement a portable ${roleName} architecture with explicit hierarchy, deterministic interfaces, app-owned output ownership, and self-checking GHDL validation.`,
  interfaceKind,
  coreBehavior,
  outputOwner,
  timing,
  verification,
  tags: String(tags).split(/\s+/),
}));

const COMPREHENSIVE_CURATED_DESIGN_PATTERNS = COMPREHENSIVE_PATTERN_SPECS
  .concat(ADDITIONAL_COMPREHENSIVE_PATTERN_SPECS)
  .filter((spec) => !CORE_CURATED_DESIGN_PATTERNS.some((pattern) => pattern.designClass === spec.designClass))
  .map(makeComprehensivePattern);

export const CURATED_DESIGN_PATTERNS: CuratedDesignPattern[] = [
  ...CORE_CURATED_DESIGN_PATTERNS,
  ...COMPREHENSIVE_CURATED_DESIGN_PATTERNS,
];

export const CURATED_METHODOLOGY_RULES: CuratedMethodologyRule[] = [
  {
    ruleId: 'method_amd_hierarchy_ooc',
    title: 'Use explicit hierarchy and independently validatable modules',
    guidanceType: 'hierarchy',
    summary: 'Partition designs into stable hierarchical modules with clear boundaries and validate hierarchy progressively.',
    sourceTitle: 'AMD Vivado Design Flows Overview UG892: Hierarchical Design',
    sourceUrl: 'https://docs.amd.com/r/2020.2-English/ug892-vivado-design-flows-overview/Hierarchical-Design',
    tags: ['hierarchy', 'tool_flow', 'generic'],
  },
  {
    ruleId: 'method_amd_ultrafast_clock_reset_cdc',
    title: 'Own clock/reset and CDC choices explicitly',
    guidanceType: 'clock_reset',
    summary: 'Keep clocking, reset, and CDC structure explicit and methodology-driven before implementation.',
    sourceTitle: 'AMD Vivado Design Methodology UG949',
    sourceUrl: 'https://docs.amd.com/r/en-US/ug949-vivado-design-methodology/Vivado-Design-Suite-User-and-Reference-Guides',
    tags: ['clock_reset', 'cdc', 'generic'],
  },
  {
    ruleId: 'method_intel_hdl_style',
    title: 'Use synthesis-friendly HDL coding style',
    guidanceType: 'interface',
    summary: 'Prefer synchronous design style, constrained types, and tool-recognizable HDL templates for FPGA synthesis.',
    sourceTitle: 'Intel Quartus Prime Pro Edition User Guide: Design Recommendations',
    sourceUrl: 'https://docs.altera.com/r/docs/683082/24.3/quartus-prime-pro-edition-user-guide-design-recommendations',
    tags: ['interface', 'clock_reset', 'memory', 'numeric', 'generic'],
  },
  {
    ruleId: 'method_numeric_boundary_types',
    title: 'Keep numeric intent typed and convert only at boundaries',
    guidanceType: 'numeric',
    summary: 'Arithmetic, counters, shifts, and comparisons should use explicit signed/unsigned/integer intent and avoid raw std_logic_vector arithmetic.',
    sourceTitle: 'IEEE numeric_std-compatible FPGA RTL discipline',
    sourceUrl: 'https://docs.altera.com/r/docs/683082/24.3/quartus-prime-pro-edition-user-guide-design-recommendations',
    tags: ['numeric', 'dsp', 'video', 'cpu', 'alu'],
  },
  {
    ruleId: 'method_self_checking_ghdl_flow',
    title: 'Require deterministic self-checking simulation flow',
    guidanceType: 'verification',
    summary: 'Generated projects must include deterministic compile/elaborate/simulate ordering, self-checking assertions, and observable PASS/FAIL behavior.',
    sourceTitle: 'GHDL usage and VHDL simulation workflow',
    sourceUrl: 'https://ghdl.github.io/ghdl/',
    tags: ['verification', 'tool_flow', 'generic'],
  },
];

export const CURATED_REFERENCE_DESIGNS: CuratedReferenceDesign[] = [
  {
    referenceId: 'ref_microchip_reference_design_catalog',
    title: 'Microchip FPGA Reference Design Catalog',
    vendor: 'Microchip',
    sourceUrl: 'https://www.microchip.com/en-us/tools-resources/reference-designs?rv=1239dd60',
    designClasses: ['generic_fpga_vhdl_system'],
    summary: 'Official vendor reference designs can provide proven block-level inspiration when an exact family match exists.',
    contractImplications: ['Normalize reference-design ideas into app-owned components and verification scenarios; do not copy raw source code.'],
    tags: ['generic', 'reference'],
  },
  {
    referenceId: 'ref_amd_ip_top_down_flow',
    title: 'AMD Vivado IP Subsystems UG994: Top-Down Design Flow',
    vendor: 'AMD',
    sourceUrl: 'https://docs.amd.com/r/en-US/ug994-vivado-ip-subsystems/Top-Down-Design-Flow',
    designClasses: ['generic_fpga_vhdl_system'],
    summary: 'Top-down design flow validates subsystem structure and interfaces before downstream implementation.',
    contractImplications: ['Architecture contracts must define top hierarchy, instances, interfaces, and validation intent before VHDL generation.'],
    tags: ['generic', 'hierarchy', 'tool_flow'],
  },
  {
    referenceId: 'ref_intel_design_examples',
    title: 'Intel FPGA Design Examples and Design Recommendations',
    vendor: 'Intel',
    sourceUrl: 'https://www.intel.com/content/www/us/en/docs/programmable/683082/24-3/recommended-design-practices.html',
    designClasses: ['dsp_chain', 'video_pattern_generator', 'axi_stream_router'],
    summary: 'Official examples and recommendations are useful evidence for pipeline, memory, DSP, and interface-oriented FPGA design shapes.',
    contractImplications: ['Use typed pipeline stages, explicit latency tracking, constrained memory/counter ranges, and validated interfaces.'],
    tags: ['dsp', 'video', 'axi_stream', 'memory', 'numeric'],
  },
];

function stableId(value: string, fallback: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 72);
  return normalized || fallback;
}

function findPatternByDesignClass(designClass: string) {
  const normalized = designClass.trim().toLowerCase();
  if (!normalized || normalized === GENERIC_PATTERN.designClass) return GENERIC_PATTERN;
  return CURATED_DESIGN_PATTERNS.find((pattern) => pattern.designClass.toLowerCase() === normalized) || GENERIC_PATTERN;
}

function specificityScore(pattern: CuratedDesignPattern) {
  if (pattern.specificity === 'leaf') return 0.35;
  if (pattern.specificity === 'subsystem') return 0.25;
  if (pattern.specificity === 'broad') return 0.1;
  return 0.2;
}

const DESIGN_CLASS_SCORE_STOP_WORDS = new Set([
  'block',
  'controller',
  'core',
  'engine',
  'generator',
  'interface',
  'pattern',
  'peripheral',
  'pipeline',
  'processor',
  'subsystem',
  'unit',
]);

function scorePattern(pattern: CuratedDesignPattern, promptText: string) {
  const keywordScore = pattern.keywords.reduce((score, keyword) => score + (keyword.test(promptText) ? 10 : 0), 0);
  const designClassWords = pattern.designClass.split('_').filter((word) => (
    word.length > 2 && !DESIGN_CLASS_SCORE_STOP_WORDS.has(word)
  ));
  const designClassWordScore = designClassWords.reduce((score, word) => (
    new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(promptText) ? score + 2 : score
  ), 0);
  const textScore = keywordScore + designClassWordScore;
  return textScore > 0 ? textScore + specificityScore(pattern) : 0;
}

const PRIMARY_PATTERN_HINTS: Array<{ designClass: string; keywords: RegExp[] }> = [
  { designClass: 'flight_controller', keywords: [/flight\s*controller/i, /\bdrone\b/i, /\buav\b/i] },
  { designClass: 'fir_filter', keywords: [/\bfir\b/i, /streaming\s+fir/i] },
  { designClass: 'fft_pipeline', keywords: [/\bfft\b/i] },
  { designClass: 'cordic_engine', keywords: [/\bcordic\b/i] },
  { designClass: 'i2c_controller', keywords: [/\bi2c\b/i, /i\s*2\s*c/i] },
  { designClass: 'spi_controller', keywords: [/\bspi\b/i] },
  { designClass: 'uart_core', keywords: [/\buart\b/i] },
  { designClass: 'can_controller', keywords: [/\bcan\b/i, /controller\s*area\s*network/i] },
  { designClass: 'ethernet_mac_lite', keywords: [/ethernet/i] },
  { designClass: 'axi4_lite_peripheral', keywords: [/axi4?\s*[-_ ]?\s*lite/i] },
  { designClass: 'wishbone_peripheral', keywords: [/wishbone/i] },
  { designClass: 'avalon_mm_peripheral', keywords: [/avalon/i] },
  { designClass: 'apb_peripheral', keywords: [/\bapb\b/i] },
  { designClass: 'video_pattern_generator', keywords: [/\bvideo\b/i, /\bvga\b/i, /\bhdmi\b/i, /framebuffer/i, /camera/i] },
  { designClass: 'async_fifo', keywords: [/async\s*fifo/i, /asynchronous\s*fifo/i] },
  { designClass: 'sync_fifo', keywords: [/sync\s*fifo/i, /\bfifo\b/i] },
  { designClass: 'pid_controller', keywords: [/\bpid\b/i] },
  { designClass: 'dma_engine', keywords: [/\bdma\b/i] },
  { designClass: 'cpu_core_small', keywords: [/\bcpu\b/i, /\bprocessor\b/i, /\bmcu\b/i] },
  { designClass: 'alu', keywords: [/\balu\b/i] },
];

const SECONDARY_COMPOSITION_HINTS: Record<string, string[]> = {
  flight_controller: ['spi_controller', 'imu_sensor_frontend', 'pid_controller', 'dsp_chain', 'failsafe_watchdog'],
  video_pattern_generator: ['axi4_memory_mapped_master', 'dma_engine', 'framebuffer_controller', 'vga_timing_generator'],
  fir_filter: ['axi_stream_source', 'axi_stream_sink', 'stream_fifo', 'fixed_point_datapath'],
  i2c_controller: ['axi4_lite_peripheral', 'register_map_subsystem', 'sensor_frontend_i2c'],
};

function findPrimaryHintPattern(promptText: string) {
  for (const hint of PRIMARY_PATTERN_HINTS) {
    if (hint.keywords.some((keyword) => keyword.test(promptText))) {
      const pattern = findPatternByDesignClass(hint.designClass);
      if (pattern !== GENERIC_PATTERN) return pattern;
    }
  }
  return undefined;
}

function selectSecondaryPatterns(
  primaryPattern: CuratedDesignPattern,
  promptText: string,
  options: { includePromptMatches?: boolean } = {},
) {
  const includePromptMatches = options.includePromptMatches !== false;
  const patternComposedIds = new Set(primaryPattern.composesWith || []);
  const promptComposedIds = new Set(SECONDARY_COMPOSITION_HINTS[primaryPattern.designClass] || []);
  return CURATED_DESIGN_PATTERNS
    .filter((pattern) => pattern.designClass !== primaryPattern.designClass)
    .map((pattern) => {
      const promptScore = includePromptMatches ? scorePattern(pattern, promptText) : 0;
      const compositionScore = promptComposedIds.has(pattern.designClass)
        ? 70
        : patternComposedIds.has(pattern.designClass)
          ? 30
          : 0;
      return { pattern, score: promptScore + compositionScore };
    })
    .filter((entry) => entry.score >= 10)
    .sort((left, right) => right.score - left.score || right.pattern.designClass.localeCompare(left.pattern.designClass))
    .slice(0, 4)
    .map((entry) => entry.pattern);
}

function selectPattern(promptText: string) {
  const explicitDesignClass = promptText.match(/\b(?:mandatory\s+design\s+class|design\s+class)\s*:\s*([a-zA-Z][a-zA-Z0-9_]*)/i)?.[1];
  if (explicitDesignClass) {
    const explicitPattern = findPatternByDesignClass(explicitDesignClass);
    return {
      primaryPattern: explicitPattern,
      secondaryPatterns: selectSecondaryPatterns(explicitPattern, promptText, { includePromptMatches: false }),
      confidence: explicitPattern === GENERIC_PATTERN ? 0.55 : 1,
    };
  }

  const hintedPrimaryPattern = findPrimaryHintPattern(promptText);
  if (hintedPrimaryPattern) {
    const hintedScore = scorePattern(hintedPrimaryPattern, promptText);
    return {
      primaryPattern: hintedPrimaryPattern,
      secondaryPatterns: selectSecondaryPatterns(hintedPrimaryPattern, promptText),
      confidence: Math.min(0.95, 0.7 + hintedScore * 0.02),
    };
  }

  const scored = CURATED_DESIGN_PATTERNS
    .map((pattern) => ({ pattern, score: scorePattern(pattern, promptText) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.pattern.patternId.localeCompare(right.pattern.patternId));
  if (scored.length === 0) {
    return { primaryPattern: GENERIC_PATTERN, secondaryPatterns: [], confidence: 0.35 };
  }
  return {
    primaryPattern: scored[0].pattern,
    secondaryPatterns: selectSecondaryPatterns(scored[0].pattern, promptText),
    confidence: Math.min(0.95, 0.55 + scored[0].score * 0.015),
  };
}

function selectMethodologyRules(patterns: CuratedDesignPattern[]) {
  const tags = new Set(patterns.flatMap((pattern) => [...pattern.methodologyTags, pattern.designClass, 'generic']));
  return CURATED_METHODOLOGY_RULES.filter((rule) => rule.tags.some((tag) => tags.has(tag)));
}

function selectReferenceDesigns(patterns: CuratedDesignPattern[]) {
  const designClasses = new Set(patterns.map((pattern) => pattern.designClass));
  const tags = new Set(patterns.flatMap((pattern) => [...pattern.referenceTags, pattern.designClass, 'generic']));
  return CURATED_REFERENCE_DESIGNS.filter((reference) => (
    reference.designClasses.some((designClass) => designClasses.has(designClass) || designClass === GENERIC_PATTERN.designClass)
    || reference.tags.some((tag) => tags.has(tag))
  )).slice(0, 4);
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildEvidenceClaims(
  methodologyRules: CuratedMethodologyRule[],
  referenceDesigns: CuratedReferenceDesign[],
) {
  const methodologyClaims = methodologyRules.map((rule) => ({
    claimId: `claim_${rule.ruleId}`,
    sourceId: rule.ruleId,
    sourceTitle: rule.sourceTitle,
    sourceUrl: rule.sourceUrl,
    guidanceType: rule.guidanceType,
    summary: rule.summary,
    contractImplication: rule.title,
  }));
  const referenceClaims = referenceDesigns.flatMap((reference) => reference.contractImplications.map((implication, index) => ({
    claimId: `claim_${reference.referenceId}_${index + 1}`,
    sourceId: reference.referenceId,
    sourceTitle: reference.title,
    sourceUrl: reference.sourceUrl,
    guidanceType: 'reference_design',
    summary: reference.summary,
    contractImplication: implication,
  })));
  return [...methodologyClaims, ...referenceClaims];
}

export function synthesizeCuratedFpgaArchitecture(promptText: string): CuratedArchitectureSynthesis {
  const normalizedPrompt = promptText || '';
  const { primaryPattern, secondaryPatterns, confidence } = selectPattern(normalizedPrompt);
  const patterns = [primaryPattern, ...secondaryPatterns];
  const methodologyRules = selectMethodologyRules(patterns);
  const referenceDesigns = selectReferenceDesigns(patterns);
  const evidenceClaims = buildEvidenceClaims(methodologyRules, referenceDesigns);
  const matchedPatternIds = patterns.map((pattern) => pattern.patternId);

  const blueprint = {
    designClass: primaryPattern.designClass,
    systemRole: primaryPattern.systemRole,
    buildingBlocks: unique(patterns.flatMap((pattern) => pattern.requiredBlocks.map((block) => (
      `${block.id}: ${block.responsibility}`
    )))),
    externalInterfaces: unique(patterns.flatMap((pattern) => pattern.externalInterfaces)),
    internalContracts: unique([
      ...patterns.flatMap((pattern) => pattern.internalConnections),
      ...patterns.flatMap((pattern) => pattern.topOutputOwnership.map((entry) => `Output ownership: ${entry}`)),
      ...patterns.flatMap((pattern) => pattern.timingContracts.map((entry) => `Timing contract: ${entry}`)),
      ...referenceDesigns.flatMap((reference) => reference.contractImplications.map((entry) => `Official reference implication: ${entry}`)),
    ]),
    clockResetRules: unique([
      ...patterns.flatMap((pattern) => pattern.clockResetPolicy),
      ...methodologyRules
        .filter((rule) => rule.guidanceType === 'clock_reset' || rule.guidanceType === 'cdc')
        .map((rule) => `${rule.title}: ${rule.summary}`),
    ]),
    filePlan: unique(patterns.flatMap((pattern) => pattern.filePlan)),
    verificationPlan: unique([
      ...patterns.flatMap((pattern) => pattern.verificationScenarios),
      ...methodologyRules
        .filter((rule) => rule.guidanceType === 'verification' || rule.guidanceType === 'tool_flow')
        .map((rule) => `${rule.title}: ${rule.summary}`),
    ]),
    patternId: primaryPattern.patternId,
    matchedPatternIds,
    methodologyRuleIds: methodologyRules.map((rule) => rule.ruleId),
    referenceDesignIds: referenceDesigns.map((reference) => reference.referenceId),
    evidenceClaimIds: evidenceClaims.map((claim) => claim.claimId),
    topOutputOwnership: unique(patterns.flatMap((pattern) => pattern.topOutputOwnership)),
    timingContracts: unique(patterns.flatMap((pattern) => pattern.timingContracts)),
  };

  return {
    synthesisId: stableId(`synthesis_${primaryPattern.designClass}_${matchedPatternIds.join('_')}`, 'synthesis_generic'),
    sourceMode: 'curated_first_hybrid',
    primaryPattern,
    secondaryPatterns,
    methodologyRules,
    referenceDesigns,
    evidenceClaims,
    confidence,
    blueprint,
  };
}
