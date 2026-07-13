export type FpgaArchitectSweepPreset = {
  key: string;
  label: string;
  whyItTests: string;
  projectName: string;
  outputFolderName: string;
  logFileName: string;
  objective: string;
  requiredBuildingBlocks: string[];
  requiredInterfaces: string[];
  clockResetRules: string[];
  dataPathRules: string[];
  verificationRequirements: string[];
  acceptanceCriteria: string[];
  forbiddenShortcuts: string[];
};

export const FPGA_ARCHITECT_SWEEP_ATTEMPTS_PER_DESIGN = 3;
export const FPGA_ARCHITECT_SWEEP_DESIGNS: FpgaArchitectSweepPreset[] = [
  {
    key: 'uart_spi_bridge',
    label: 'UART-to-SPI Protocol Bridge with FIFOs',
    whyItTests: 'Tests protocol handling, clock-domain thinking, FSMs, buffering, and error handling.',
    projectName: 'uart_spi_protocol_bridge',
    outputFolderName: '01-uart-spi-protocol-bridge',
    logFileName: 'fpga-architect-uart-spi-protocol-bridge.log',
    objective: 'Design a UART-to-SPI protocol bridge with transmit and receive FIFOs that cleanly accepts UART traffic, frames transactions, and drives an SPI master path with explicit status/error reporting.',
    requiredBuildingBlocks: [
      'uart_rx receiver path',
      'uart_tx transmitter path',
      'spi_master controller',
      'tx_fifo buffering for outbound SPI payloads',
      'rx_fifo buffering for inbound SPI response data',
      'control/status register block or equivalent status signaling',
      'bridge control FSM coordinating UART framing and SPI execution',
      'error reporting for framing, overflow, underflow, and protocol faults',
    ],
    requiredInterfaces: [
      'single top-level system clock and reset',
      'UART RX input and UART TX output',
      'SPI SCLK, MOSI, MISO, and chip-select outputs',
      'status outputs for busy, error, and data-availability conditions',
      'clean internal handshakes between FIFOs and the control FSM',
    ],
    clockResetRules: [
      'Prefer a single synchronous clock domain unless another domain is absolutely justified and documented.',
      'Reset behavior must be deterministic and compatible with the selected reset style in the app.',
      'Do not use gated clocks; use clock-enable style control instead.',
    ],
    dataPathRules: [
      'Keep UART framing logic separate from SPI transaction execution logic.',
      'Make FIFO widths, depths, and framing assumptions explicit with generics or constants where practical.',
      'Use explicit state-machine transitions for idle, load, transmit, receive, and error recovery behavior.',
    ],
    verificationRequirements: [
      'Generate a self-checking VHDL testbench.',
      'Exercise nominal transfers from UART into SPI and back again.',
      'Exercise FIFO backpressure, framing errors, overflow/underflow handling, and representative recovery behavior.',
      'Produce deterministic PASS/FAIL assertions with useful messages.',
    ],
    acceptanceCriteria: [
      'All generated VHDL must compile with GHDL using VHDL-2008.',
      'The bridge must elaborate and simulate successfully under GHDL.',
      'The testbench must prove nominal transfers and at least one error-path scenario.',
      'The generated project must include clear top-level ownership of UART, SPI, buffering, and control responsibilities.',
    ],
    forbiddenShortcuts: [
      'Do not collapse the entire design into one monolithic process without architectural structure.',
      'Do not omit FIFOs or replace them with hand-wavy placeholder comments.',
      'Do not claim protocol behavior that is not represented in the RTL or testbench.',
    ],
  },
  {
    key: 'mini_cpu_core',
    label: 'Mini RISC-V / Custom 8-bit CPU Core',
    whyItTests: 'Tests architecture generation, instruction decoding, ALU, registers, program memory, and complex testbench generation.',
    projectName: 'mini_cpu_core',
    outputFolderName: '02-mini-cpu-core',
    logFileName: 'fpga-architect-mini-cpu-core.log',
    objective: 'Design a small CPU core project in VHDL, choosing either a mini RISC-V subset or a coherent custom 8-bit ISA, with a complete fetch/decode/execute path and deterministic verification.',
    requiredBuildingBlocks: [
      'instruction fetch path with program counter management',
      'instruction decoder',
      'ALU with clearly defined supported operations',
      'register file',
      'control unit or control FSM',
      'program memory interface',
      'data memory interface',
      'branch/jump or control-flow handling',
      'top-level CPU integration entity',
    ],
    requiredInterfaces: [
      'single top-level clock and reset',
      'program memory address/data interface',
      'data memory address/data/read-write control interface',
      'optional debug or status outputs if they simplify verification',
      'clear interconnect between fetch, decode, execute, and write-back responsibilities',
    ],
    clockResetRules: [
      'Assume a single clock domain for the core and document any alternative choice explicitly.',
      'Reset must place the CPU into a deterministic fetch-ready state.',
      'Avoid gated clocks and uncontrolled combinational feedback between control and datapath blocks.',
    ],
    dataPathRules: [
      'State the chosen ISA subset or custom instruction set clearly.',
      'Define operand widths, register count, and memory interface semantics explicitly.',
      'Keep decode, execute, and state-update behavior understandable rather than opaque.',
    ],
    verificationRequirements: [
      'Generate a meaningful self-checking testbench.',
      'The testbench must prove fetch, decode, execute, register update, and control-flow behavior with deterministic checks.',
      'Include representative arithmetic, logical, load/store, and branch-style scenarios where supported by the chosen ISA.',
    ],
    acceptanceCriteria: [
      'Generated RTL and testbench must compile, elaborate, and simulate under GHDL.',
      'The testbench must verify successful execution of a short deterministic instruction sequence.',
      'The generated collateral must make the architectural split between datapath and control clear.',
    ],
    forbiddenShortcuts: [
      'Do not describe the CPU as complete while omitting decode or write-back behavior.',
      'Do not use placeholder pseudo-instructions without implementing them in the RTL and testbench.',
      'Do not hide the memory interface behind undocumented magic constants or comments.',
    ],
  },
  {
    key: 'video_pattern_generator',
    label: 'VGA/HDMI Pattern Generator with Framebuffer',
    whyItTests: 'Tests pixel timing, counters, memory addressing, video sync generation, and strict timing behavior.',
    projectName: 'video_pattern_generator',
    outputFolderName: '03-video-pattern-generator',
    logFileName: 'fpga-architect-video-pattern-generator.log',
    objective: 'Design a VGA or HDMI-style pattern generator with a framebuffer-oriented architecture in VHDL, including deterministic sync timing, pixel addressing, and a verifiable top-level video path.',
    requiredBuildingBlocks: [
      'horizontal timing counter',
      'vertical timing counter',
      'sync generation logic',
      'active-video window generation',
      'framebuffer or framebuffer-style pixel addressing path',
      'pattern generator or pixel formatting stage',
      'top-level video output integration',
    ],
    requiredInterfaces: [
      'top-level clock and reset',
      'horizontal sync and vertical sync outputs',
      'pixel data outputs or packed video output path',
      'framebuffer address and data path signals',
      'optional video-active or data-enable style output if used by the architecture',
    ],
    clockResetRules: [
      'Use a deterministic single pixel-domain clock model unless more are explicitly justified.',
      'Reset must place timing counters and sync outputs into a known state.',
      'Timing constants must be explicit and easy to review.',
    ],
    dataPathRules: [
      'Keep timing generation separate from pixel/pattern generation.',
      'Make video timing assumptions explicit instead of implied.',
      'Address generation must be internally consistent with active video dimensions.',
    ],
    verificationRequirements: [
      'Generate a GHDL-friendly self-checking testbench.',
      'Verify timing windows, sync pulse widths, counter wrap behavior, and representative pixel flow.',
      'Use deterministic checks rather than visual-only inspection.',
    ],
    acceptanceCriteria: [
      'Generated VHDL must compile, elaborate, and simulate under GHDL.',
      'The testbench must verify sync timing behavior and at least one representative pixel-addressing scenario.',
      'The architecture must clearly separate timing generation from pixel data generation.',
    ],
    forbiddenShortcuts: [
      'Do not hand-wave timing with comments while omitting real counters and sync logic.',
      'Do not mix all timing and pixel behavior into unreadable combinational logic.',
      'Do not generate a video design with no explicit sync behavior.',
    ],
  },
  {
    key: 'dsp_chain',
    label: 'Digital Signal Processing Chain: FIR Filter + FFT-lite Analyzer',
    whyItTests: 'Tests arithmetic, signed/fixed-point math, pipelines, and latency-aware testbench generation.',
    projectName: 'dsp_chain',
    outputFolderName: '04-dsp-chain',
    logFileName: 'fpga-architect-dsp-chain.log',
    objective: 'Design a DSP processing chain in VHDL consisting of a FIR filter followed by an FFT-lite or spectral analyzer stage, with explicit signed or fixed-point arithmetic and verifiable pipeline latency.',
    requiredBuildingBlocks: [
      'sample input staging path',
      'FIR filter datapath with explicit coefficients or coefficient placeholders',
      'pipeline registers and latency bookkeeping',
      'FFT-lite or spectral-analysis stage',
      'output-valid or result-ready signaling',
      'top-level DSP chain integration',
    ],
    requiredInterfaces: [
      'clock and reset',
      'sample input and sample-valid style control',
      'processed output and output-valid style control',
      'optional ready/backpressure signaling if the architecture chooses to support it',
      'clear internal stage boundaries between FIR and analyzer logic',
    ],
    clockResetRules: [
      'Use a deterministic synchronous pipeline model.',
      'Reset must put all pipeline state into known values.',
      'Latency through the datapath must be explicit and testable.',
    ],
    dataPathRules: [
      'Use signed or fixed-point arithmetic explicitly; do not rely on ambiguous implicit typing.',
      'Document widths, growth, truncation, rounding, and saturation assumptions.',
      'Keep stage-to-stage latency visible in the architecture and in the verification plan.',
    ],
    verificationRequirements: [
      'Generate a self-checking testbench aware of pipeline latency.',
      'Verify representative numeric behavior through the FIR stage and the analyzer stage.',
      'Check latency alignment between input stimulus and observed output results.',
    ],
    acceptanceCriteria: [
      'All generated VHDL must compile, elaborate, and simulate under GHDL.',
      'The testbench must demonstrate deterministic latency-aware checking.',
      'The generated design must show a clear staged architecture rather than a vague arithmetic sketch.',
    ],
    forbiddenShortcuts: [
      'Do not omit explicit numeric types and width handling.',
      'Do not produce a DSP chain with undocumented latency.',
      'Do not replace the analyzer stage with placeholder comments while claiming completion.',
    ],
  },
  {
    key: 'axi_stream_router',
    label: 'AXI-Stream Packet Router / Network Switch',
    whyItTests: 'Tests scalable architecture, streaming handshakes, backpressure, arbitration, and randomized-style testbench scenarios.',
    projectName: 'axi_stream_packet_router',
    outputFolderName: '05-axi-stream-packet-router',
    logFileName: 'fpga-architect-axi-stream-packet-router.log',
    objective: 'Design an AXI-Stream packet router or small network-switch style fabric in VHDL with scalable routing, deterministic arbitration, and verifiable valid/ready handshake behavior.',
    requiredBuildingBlocks: [
      'AXI-Stream source/sink interface handling',
      'routing decision logic',
      'arbitration logic for contended outputs',
      'backpressure handling',
      'packet or frame tracking support as needed by the architecture',
      'top-level scalable switch/router integration',
    ],
    requiredInterfaces: [
      'clock and reset',
      'AXI-Stream style valid, ready, and data paths',
      'packet boundary signaling such as last/end markers if the architecture uses them',
      'multiple ingress and egress paths or a clearly parameterized equivalent',
    ],
    clockResetRules: [
      'Use a single deterministic streaming clock domain unless an alternative is explicitly justified.',
      'Reset must place all handshake/control state into a known idle condition.',
      'Handshake behavior must never depend on gated clocks or hidden latches.',
    ],
    dataPathRules: [
      'Make arbitration policy explicit.',
      'Backpressure behavior must be deterministic and represented in the RTL.',
      'Scalability should come from clean structure or generics, not copied ad hoc logic.',
    ],
    verificationRequirements: [
      'Generate a self-checking testbench.',
      'Cover handshake correctness, contention, routing correctness, and backpressure scenarios.',
      'Include representative packet-flow cases and deterministic pass/fail checks.',
    ],
    acceptanceCriteria: [
      'Generated RTL and verification files must compile, elaborate, and simulate under GHDL.',
      'The testbench must demonstrate correct valid/ready behavior under both nominal and contended cases.',
      'The architecture must show a credible routing and arbitration structure.',
    ],
    forbiddenShortcuts: [
      'Do not claim AXI-Stream compatibility while omitting valid/ready semantics.',
      'Do not ignore backpressure or contention handling.',
      'Do not flatten a scalable switch into undocumented one-off wiring.',
    ],
  },
];

export const FPGA_ARCHITECT_SWEEP_TOTAL_ATTEMPTS =
  FPGA_ARCHITECT_SWEEP_DESIGNS.length * FPGA_ARCHITECT_SWEEP_ATTEMPTS_PER_DESIGN;
