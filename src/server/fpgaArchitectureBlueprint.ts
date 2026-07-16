import type { AiMacroId } from '../aiMacros';

export type FpgaArchitectureBlueprint = {
  designClass: string;
  systemRole: string;
  buildingBlocks: string[];
  externalInterfaces: string[];
  internalContracts: string[];
  clockResetRules: string[];
  filePlan: string[];
  verificationPlan: string[];
};

type BlueprintPreset = {
  keywords: RegExp[];
  blueprint: FpgaArchitectureBlueprint;
};

const GENERIC_BLUEPRINT: FpgaArchitectureBlueprint = {
  designClass: 'generic_fpga_vhdl_system',
  systemRole: 'Implement the requested FPGA/VHDL system with explicit hierarchy, deterministic interfaces, and a self-checking GHDL validation flow.',
  buildingBlocks: [
    'top-level integration entity',
    'shared package for public constants, types, and records',
    'one or more cohesive leaf RTL blocks',
    'control/status or observable debug outputs where useful for verification',
  ],
  externalInterfaces: [
    'single primary clock input',
    'explicit reset input matching the selected reset style',
    'typed, constrained data/control ports',
    'status or done/error outputs when behavior is transaction-oriented',
  ],
  internalContracts: [
    'all leaf blocks expose typed entity ports with explicit widths',
    'top-level port maps exactly match declared formal types and widths',
    'shared packages are analyzed before all dependent RTL and testbench files',
  ],
  clockResetRules: [
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
  verificationPlan: [
    'compile every generated VHDL file in dependency order with --std=08',
    'elaborate the top-level testbench entity',
    'simulate with a waveform output and deterministic PASS/FAIL result',
    'check reset behavior, at least one nominal behavior path, and at least one boundary/error path when applicable',
  ],
};

const BLUEPRINT_PRESETS: BlueprintPreset[] = [
  {
    keywords: [/flight\s*controller/i, /\bdrone\b/i, /\buav\b/i, /\bimu\b/i, /\bpid\b/i],
    blueprint: {
      designClass: 'flight_controller',
      systemRole: 'Implement a deterministic FPGA flight-control subsystem that samples sensors, estimates attitude, runs control loops, mixes motor commands, and exposes failsafe/telemetry behavior.',
      buildingBlocks: [
        'sensor interface block for IMU/sample acquisition',
        'sensor conditioning and calibration block',
        'attitude/rate estimator or simplified complementary-filter block',
        'PID/control-loop block with explicit signed/fixed-point widths',
        'motor mixer block',
        'PWM/DSHOT-style output timing block or clearly documented motor-command output block',
        'failsafe/watchdog block',
        'configuration/status register block',
        'top-level flight_controller integration entity',
      ],
      externalInterfaces: [
        'system clock and reset',
        'sensor input interface signals such as SPI/I2C-style data/control or sampled sensor buses',
        'pilot command inputs or setpoint inputs',
        'motor command outputs',
        'telemetry/status/error outputs',
        'configuration interface or simple control/status ports',
      ],
      internalContracts: [
        'all signed/fixed-point control-loop values use explicit signed/unsigned types and documented scaling',
        'sensor-valid, estimator-valid, controller-valid, and motor-update handshakes are explicit',
        'failsafe path can override normal motor commands deterministically',
        'control loop latency is either single-cycle documented or explicitly pipeline-tracked',
      ],
      clockResetRules: [
        'use one primary synchronous control clock for the generated RTL unless the user requests a separate sensor clock',
        'release reset into a safe idle/disarmed state',
        'do not generate clocks inside RTL; derive timing by counters and clock-enable pulses',
      ],
      filePlan: [
        'src/flight_controller_pkg.vhd for widths, records, constants, and mode/state types',
        'src/sensor_frontend.vhd',
        'src/attitude_estimator.vhd',
        'src/control_loop.vhd',
        'src/motor_mixer.vhd',
        'src/failsafe_watchdog.vhd',
        'src/flight_controller_top.vhd',
        'tb/tb_flight_controller_top.vhd',
        'sim/ghdl_plan.json and sim/run_ghdl.sh',
      ],
      verificationPlan: [
        'prove reset leaves the design disarmed with safe motor outputs',
        'feed deterministic sensor/setpoint samples and check motor-command response direction',
        'exercise failsafe timeout/invalid-sensor behavior',
        'check valid/ready or sample-valid timing alignment through the pipeline',
      ],
    },
  },
  {
    keywords: [/\buart\b.*\bspi\b/i, /\bspi\b.*\buart\b/i, /protocol\s*bridge/i],
    blueprint: {
      ...GENERIC_BLUEPRINT,
      designClass: 'uart_spi_protocol_bridge',
      systemRole: 'Bridge UART-framed commands to an SPI master transaction path with buffering, control FSMs, and deterministic error reporting.',
      buildingBlocks: ['uart_rx', 'uart_tx', 'spi_master', 'tx_fifo', 'rx_fifo', 'bridge_control_fsm', 'status_error_block', 'top-level bridge entity'],
      externalInterfaces: ['clock/reset', 'uart_rx_i/uart_tx_o', 'spi_sclk_o/spi_mosi_o/spi_miso_i/spi_cs_o', 'busy/error/data_available status outputs'],
      verificationPlan: ['prove nominal UART-command to SPI transaction', 'prove FIFO backpressure behavior', 'prove at least one error/recovery path'],
    },
  },
  {
    keywords: [/\bcpu\b/i, /\brisc/i, /\bprocessor\b/i, /\binstruction\b/i],
    blueprint: {
      ...GENERIC_BLUEPRINT,
      designClass: 'cpu_core',
      systemRole: 'Implement a small CPU with explicit fetch/decode/execute/writeback architecture and deterministic memory/testbench behavior.',
      buildingBlocks: ['program_counter', 'instruction_memory_interface', 'decoder', 'register_file', 'alu', 'control_fsm', 'data_memory_interface', 'cpu_top'],
      verificationPlan: ['execute a deterministic instruction program', 'check register updates', 'check ALU/control-flow behavior', 'check reset fetch state'],
    },
  },
  {
    keywords: [/\balu\b/i, /arithmetic\s*logic/i],
    blueprint: {
      ...GENERIC_BLUEPRINT,
      designClass: 'alu',
      systemRole: 'Implement a typed arithmetic logic unit with explicit opcode contract, flags, and self-checking operation coverage.',
      buildingBlocks: ['alu_pkg for opcodes/flags', 'alu_core combinational or registered datapath', 'optional top wrapper', 'self-checking operation testbench'],
      internalContracts: ['all arithmetic operands are unsigned/signed before numeric_std operations', 'every opcode has deterministic result and flags', 'invalid opcodes produce a documented safe result'],
      verificationPlan: ['check add/sub/and/or/xor/not/shift behavior as requested', 'check zero/carry/overflow flags when present', 'check reset if registered'],
    },
  },
  {
    keywords: [/\bvga\b/i, /\bhdmi\b/i, /video/i, /framebuffer/i],
    blueprint: {
      ...GENERIC_BLUEPRINT,
      designClass: 'video_pattern_generator',
      systemRole: 'Implement deterministic video timing, active-window detection, framebuffer/pattern addressing, and sync output verification.',
      buildingBlocks: ['horizontal_counter', 'vertical_counter', 'sync_generator', 'active_video_window', 'pixel_address_generator', 'pattern_or_framebuffer_stage', 'video_top'],
      verificationPlan: ['check sync pulse widths', 'check counter wrap points', 'check active-video region', 'check representative pixel address/data'],
    },
  },
  {
    keywords: [/\bdsp\b/i, /\bfir\b/i, /\bfft\b/i, /filter/i],
    blueprint: {
      ...GENERIC_BLUEPRINT,
      designClass: 'dsp_chain',
      systemRole: 'Implement a latency-aware signed/fixed-point DSP pipeline with explicit stage boundaries and deterministic numeric verification.',
      buildingBlocks: ['sample_input_stage', 'fir_filter_stage', 'pipeline_latency_tracker', 'fft_lite_or_analyzer_stage', 'output_valid_stage', 'dsp_top'],
      internalContracts: ['all numeric widths and scaling are explicit', 'pipeline valid/latency tracking is visible', 'no raw std_logic_vector arithmetic'],
      verificationPlan: ['check representative numeric output', 'check latency alignment', 'check reset clears pipeline state'],
    },
  },
  {
    keywords: [/\baxi\b/i, /axis/i, /stream/i, /packet\s*router/i, /network\s*switch/i],
    blueprint: {
      ...GENERIC_BLUEPRINT,
      designClass: 'axi_stream_router',
      systemRole: 'Implement streaming packet routing with valid/ready handshakes, deterministic arbitration, and backpressure verification.',
      buildingBlocks: ['ingress_interface_blocks', 'routing_decision_logic', 'arbiter', 'egress_interface_blocks', 'backpressure_control', 'packet_tracker', 'stream_router_top'],
      internalContracts: ['valid remains asserted until ready handshake completes', 'ready/backpressure paths are deterministic', 'arbitration policy is explicit'],
      verificationPlan: ['check route selection', 'check contention arbitration', 'check backpressure', 'check packet boundary preservation'],
    },
  },
];

function mergeBlueprint(base: FpgaArchitectureBlueprint, overlay: Partial<FpgaArchitectureBlueprint>): FpgaArchitectureBlueprint {
  return {
    ...base,
    ...overlay,
    buildingBlocks: overlay.buildingBlocks || base.buildingBlocks,
    externalInterfaces: overlay.externalInterfaces || base.externalInterfaces,
    internalContracts: overlay.internalContracts || base.internalContracts,
    clockResetRules: overlay.clockResetRules || base.clockResetRules,
    filePlan: overlay.filePlan || base.filePlan,
    verificationPlan: overlay.verificationPlan || base.verificationPlan,
  };
}

export function inferFpgaArchitectureBlueprintFromPrompt(promptText: string): FpgaArchitectureBlueprint {
  const normalizedPrompt = promptText || '';
  const matchedPreset = BLUEPRINT_PRESETS.find((preset) => (
    preset.keywords.some((keyword) => keyword.test(normalizedPrompt))
  ));
  return matchedPreset ? mergeBlueprint(GENERIC_BLUEPRINT, matchedPreset.blueprint) : GENERIC_BLUEPRINT;
}

function bulletSection(title: string, items: string[]) {
  return [
    `### ${title}`,
    ...items.map((item) => `- ${item}`),
  ].join('\n');
}

export function buildArchitectureBlueprintPromptSection(params: {
  macroId: AiMacroId;
  promptText: string;
  heading?: string;
}) {
  if (params.macroId !== 'fpga_vhdl_architect') {
    return '';
  }

  const blueprint = inferFpgaArchitectureBlueprintFromPrompt(params.promptText);
  return [
    `## ${params.heading || 'App-Owned Architecture Blueprint Contract'}`,
    `Design class: ${blueprint.designClass}`,
    `System role: ${blueprint.systemRole}`,
    '',
    'The model owns the detailed micro-architecture choices inside this contract, but the generated project must preserve these block/interface/file/test responsibilities. Do not replace this with a vague report.',
    '',
    bulletSection('Required building blocks', blueprint.buildingBlocks),
    '',
    bulletSection('Required external interfaces', blueprint.externalInterfaces),
    '',
    bulletSection('Internal interface contracts', blueprint.internalContracts),
    '',
    bulletSection('Clock/reset rules', blueprint.clockResetRules),
    '',
    bulletSection('Required file-level scaffold', blueprint.filePlan),
    '',
    bulletSection('Required verification targets', blueprint.verificationPlan),
  ].join('\n');
}

export function buildConstrainedRegionPromptSection(macroId: AiMacroId) {
  if (macroId !== 'fpga_vhdl_architect') {
    return '';
  }

  return [
    '## Constrained Implementation Regions',
    '- Treat the file scaffold, entity names, public ports, GHDL plan, and self-checking testbench result contract as app-owned constraints.',
    '- The model may fill in RTL behavior, FSM transitions, datapath operations, constants, and verification stimuli only within those constraints.',
    '- Do not change public interfaces during repair unless the exact validator/GHDL failure proves the interface itself is illegal.',
    '- If a block cannot be implemented fully in one pass, return a smaller but complete legal version instead of placeholders or prose.',
  ].join('\n');
}
