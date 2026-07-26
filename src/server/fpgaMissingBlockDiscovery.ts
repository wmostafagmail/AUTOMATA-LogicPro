export type FpgaMissingBlockSourceTrust =
  | 'official_vendor'
  | 'open_source'
  | 'documentation'
  | 'curated_seed';

export type FpgaDiscoveredBlockPort = {
  name: string;
  direction: 'in' | 'out' | 'inout';
  width: string;
  purpose: string;
};

export type FpgaDiscoveredBlockGeneric = {
  name: string;
  type: string;
  default?: string;
  purpose: string;
};

export type FpgaDiscoveredBlockContract = {
  blockId: string;
  name: string;
  sourceUrls: string[];
  sourceTrust: FpgaMissingBlockSourceTrust;
  licenseNotes: string;
  purpose: string;
  ports: FpgaDiscoveredBlockPort[];
  generics: FpgaDiscoveredBlockGeneric[];
  ownedOutputs: string[];
  timingContract: string;
  resetContract: string;
  verificationScenarios: string[];
  integrationRisks: string[];
  portableVhdlAssumptions: string[];
};

export type FpgaMissingBlockDiscoveryMode =
  | 'not_needed'
  | 'auto_discovered'
  | 'unresolved_or_unsafe';

export type FpgaMissingBlockDiscoveryResult = {
  requestedBlocks: string[];
  discoveredBlocks: FpgaDiscoveredBlockContract[];
  unresolvedBlocks: string[];
  unsafeReasons: string[];
  sourceUrls: string[];
  warnings: string[];
  mode: FpgaMissingBlockDiscoveryMode;
};

export type DiscoverMissingFpgaBlocksParams = {
  missingBlocks: string[];
  userRequest: string;
  signal?: AbortSignal;
  fetchText?: (url: string, signal?: AbortSignal) => Promise<string>;
};

const MAX_MISSING_BLOCKS_TO_DISCOVER = 6;
const MAX_SOURCE_CHARS = 12_000;

export const APPROVED_MISSING_BLOCK_DISCOVERY_DOMAINS = [
  'docs.amd.com',
  'docs.altera.com',
  'www.intel.com',
  'www.microchip.com',
  'ghdl.github.io',
  'github.com',
  'raw.githubusercontent.com',
  'opencores.org',
] as const;

export function isApprovedMissingBlockDiscoveryUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    return APPROVED_MISSING_BLOCK_DISCOVERY_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}

export function normalizeMissingBlockName(blockName: string): string {
  return blockName
    .replace(/^custom:/i, '')
    .replace(/['"`]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_');
}

export function isLegalTemporaryBlockId(blockId: string): boolean {
  return /^[a-z][a-z0-9_]{1,62}$/.test(blockId) && !blockId.endsWith('_');
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed.toLowerCase())) continue;
    seen.add(trimmed.toLowerCase());
    result.push(trimmed);
  }
  return result;
}

function blockSourceCandidates(blockName: string): string[] {
  const query = encodeURIComponent(`${blockName} vhdl fpga`);
  return [
    `https://github.com/search?q=${query}&type=repositories`,
    `https://opencores.org/projects`,
    `https://ghdl.github.io/ghdl/using/InvokingGHDL.html`,
    `https://www.intel.com/content/www/us/en/docs/programmable/683082/current/recommended-hdl-coding-styles.html`,
    `https://docs.amd.com/r/en-US/ug949-vivado-design-methodology`,
  ].filter(isApprovedMissingBlockDiscoveryUrl);
}

async function defaultFetchText(url: string, signal?: AbortSignal): Promise<string> {
  if (typeof fetch !== 'function') return '';
  const response = await fetch(url, { signal });
  if (!response.ok) return '';
  const text = await response.text();
  return text.slice(0, MAX_SOURCE_CHARS);
}

function sourceTrustForUrl(url: string): FpgaMissingBlockSourceTrust {
  try {
    const hostname = new URL(url).hostname;
    if (
      hostname.endsWith('amd.com') ||
      hostname.endsWith('intel.com') ||
      hostname.endsWith('altera.com') ||
      hostname.endsWith('microchip.com')
    ) {
      return 'official_vendor';
    }
    if (hostname.endsWith('github.com') || hostname.endsWith('opencores.org')) return 'open_source';
  } catch {
    return 'documentation';
  }
  return 'documentation';
}

function compactSourceText(text: string): string {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1600);
}

function textMentionsBlock(text: string, blockId: string): boolean {
  if (!text) return false;
  const normalizedText = text.toLowerCase();
  const tokens = blockId.split('_').filter((token) => token.length > 2);
  if (tokens.length === 0) return false;
  return tokens.some((token) => normalizedText.includes(token));
}

function commonClockResetPorts(): FpgaDiscoveredBlockPort[] {
  return [
    { name: 'clk_i', direction: 'in', width: '1 bit', purpose: 'Primary synchronous clock.' },
    {
      name: 'rst_ni',
      direction: 'in',
      width: '1 bit',
      purpose: 'Active-low synchronous reset unless the contract states otherwise.',
    },
  ];
}

function statusOutputs(): FpgaDiscoveredBlockPort[] {
  return [
    { name: 'done_o', direction: 'out', width: '1 bit', purpose: 'Registered completion pulse or level defined by the parent contract.' },
    { name: 'error_o', direction: 'out', width: '1 bit', purpose: 'Registered error indication; stays low for nominal verification scenarios.' },
    { name: 'status_o', direction: 'out', width: '8 bits', purpose: 'Registered status byte with reset value x"00".' },
  ];
}

function buildSeedContract(blockId: string, displayName: string, userRequest: string): FpgaDiscoveredBlockContract | null {
  const lower = `${blockId} ${userRequest.toLowerCase()}`;

  if (/(fifo|queue|skid|stream_buffer|packet_buffer|rx_fifo|tx_fifo)/.test(lower)) {
    return {
      blockId,
      name: displayName,
      sourceUrls: [],
      sourceTrust: 'curated_seed',
      licenseNotes: 'Generated from app-owned FIFO architecture rules; no external implementation code is copied.',
      purpose: 'Provide bounded buffering with explicit full/empty flow-control and GHDL-safe pointer/index handling.',
      generics: [
        { name: 'DATA_WIDTH', type: 'positive', default: '8', purpose: 'Payload width in bits.' },
        { name: 'DEPTH', type: 'positive', default: '16', purpose: 'Storage depth; implementation must use constrained integer pointers.' },
      ],
      ports: [
        ...commonClockResetPorts(),
        { name: 'wr_en_i', direction: 'in', width: '1 bit', purpose: 'Write request, accepted only when full_o = 0.' },
        { name: 'wr_data_i', direction: 'in', width: 'DATA_WIDTH bits', purpose: 'Write payload.' },
        { name: 'full_o', direction: 'out', width: '1 bit', purpose: 'Registered or combinational full flag with no out-port readback.' },
        { name: 'rd_en_i', direction: 'in', width: '1 bit', purpose: 'Read request, accepted only when empty_o = 0.' },
        { name: 'rd_data_o', direction: 'out', width: 'DATA_WIDTH bits', purpose: 'Read payload, reset to zeros or held stable when empty.' },
        { name: 'empty_o', direction: 'out', width: '1 bit', purpose: 'Registered or combinational empty flag with no out-port readback.' },
      ],
      ownedOutputs: ['full_o', 'rd_data_o', 'empty_o'],
      timingContract:
        'Single-clock FIFO accepts writes when not full and reads when not empty; pointer indexes must be bounded, constrained, and guarded before array access.',
      resetContract: 'Reset clears count and pointers, asserts empty_o, deasserts full_o, and clears rd_data_o.',
      verificationScenarios: [
        'Reset produces empty FIFO and known output values.',
        'Nominal write then read returns the same payload in order.',
        'Full and empty boundaries are exercised without out-of-range indexes.',
      ],
      integrationRisks: ['CDC is not allowed unless the selected architecture explicitly requests an async FIFO pattern.'],
      portableVhdlAssumptions: [
        'Use numeric_std only.',
        'Use constrained integer ranges or unsigned pointers converted through guarded integer variables.',
      ],
    };
  }

  if (/(uart|serial_tx|serial_rx)/.test(lower)) {
    return {
      blockId,
      name: displayName,
      sourceUrls: [],
      sourceTrust: 'curated_seed',
      licenseNotes: 'Generated from app-owned UART architecture rules; no external implementation code is copied.',
      purpose: 'Implement byte-oriented UART transmit/receive behavior with explicit baud timing and status ownership.',
      generics: [
        { name: 'CLK_HZ', type: 'positive', default: '50_000_000', purpose: 'Input clock frequency.' },
        { name: 'BAUD_RATE', type: 'positive', default: '115200', purpose: 'UART baud rate.' },
      ],
      ports: [
        ...commonClockResetPorts(),
        { name: 'data_i', direction: 'in', width: '8 bits', purpose: 'Transmit payload or configuration byte.' },
        { name: 'valid_i', direction: 'in', width: '1 bit', purpose: 'Starts a byte transaction when ready_o is high.' },
        { name: 'ready_o', direction: 'out', width: '1 bit', purpose: 'Block is ready for a new byte.' },
        { name: 'data_o', direction: 'out', width: '8 bits', purpose: 'Received payload or observed byte.' },
        { name: 'valid_o', direction: 'out', width: '1 bit', purpose: 'Pulses when data_o is valid.' },
      ],
      ownedOutputs: ['ready_o', 'data_o', 'valid_o'],
      timingContract:
        'UART timing is derived from CLK_HZ/BAUD_RATE with bounded counters; valid outputs are registered and single-cycle unless specified otherwise.',
      resetContract: 'Reset returns the serial-side idle state and clears valid/status outputs.',
      verificationScenarios: [
        'Reset produces idle serial state and no valid pulse.',
        'One nominal byte transaction completes within a bounded baud-window.',
        'Ready/valid handshake never accepts data while busy.',
      ],
      integrationRisks: ['Baud counters must use constrained ranges and avoid unchecked runtime indexing.'],
      portableVhdlAssumptions: ['No vendor UART IP is assumed; implementation must be portable VHDL-2008.'],
    };
  }

  if (/(spi|miso|mosi|sclk|chip_select|cs_n)/.test(lower)) {
    return {
      blockId,
      name: displayName,
      sourceUrls: [],
      sourceTrust: 'curated_seed',
      licenseNotes: 'Generated from app-owned SPI architecture rules; no external implementation code is copied.',
      purpose: 'Implement SPI transfer control with explicit shift-register ownership and bounded bit counting.',
      generics: [
        { name: 'DATA_WIDTH', type: 'positive', default: '8', purpose: 'Transfer word width.' },
        { name: 'CLK_DIV', type: 'positive', default: '4', purpose: 'SPI clock divider.' },
      ],
      ports: [
        ...commonClockResetPorts(),
        { name: 'start_i', direction: 'in', width: '1 bit', purpose: 'Starts one SPI transfer.' },
        { name: 'tx_data_i', direction: 'in', width: 'DATA_WIDTH bits', purpose: 'Data shifted on MOSI.' },
        { name: 'rx_data_o', direction: 'out', width: 'DATA_WIDTH bits', purpose: 'Data sampled from MISO.' },
        { name: 'busy_o', direction: 'out', width: '1 bit', purpose: 'High while the transfer is active.' },
        { name: 'done_o', direction: 'out', width: '1 bit', purpose: 'Pulses when the transfer completes.' },
        { name: 'sclk_o', direction: 'out', width: '1 bit', purpose: 'Generated SPI serial clock.' },
        { name: 'mosi_o', direction: 'out', width: '1 bit', purpose: 'Master output serial data.' },
        { name: 'miso_i', direction: 'in', width: '1 bit', purpose: 'Master input serial data.' },
        { name: 'cs_no', direction: 'out', width: '1 bit', purpose: 'Active-low chip-select output.' },
      ],
      ownedOutputs: ['rx_data_o', 'busy_o', 'done_o', 'sclk_o', 'mosi_o', 'cs_no'],
      timingContract: 'Transfer length is DATA_WIDTH bits; bit counters must be bounded and done_o must be registered.',
      resetContract: 'Reset deasserts busy/done, drives cs_no high, clears shift registers, and returns sclk_o to idle.',
      verificationScenarios: [
        'Reset deasserts chip-select and busy.',
        'Nominal transfer shifts DATA_WIDTH bits and asserts done_o.',
        'No out-of-range shift-register indexing is possible.',
      ],
      integrationRisks: ['CPOL/CPHA must be explicit if the user prompt requires a non-default SPI mode.'],
      portableVhdlAssumptions: ['Use VHDL-2008 and numeric_std; avoid vendor primitives.'],
    };
  }

  if (/(i2c|sda|scl)/.test(lower)) {
    return {
      blockId,
      name: displayName,
      sourceUrls: [],
      sourceTrust: 'curated_seed',
      licenseNotes: 'Generated from app-owned I2C architecture rules; no external implementation code is copied.',
      purpose: 'Implement an I2C control block with open-drain intent, start/stop sequencing, ACK sampling, and status ownership.',
      generics: [
        { name: 'CLK_HZ', type: 'positive', default: '50_000_000', purpose: 'Input clock frequency.' },
        { name: 'I2C_HZ', type: 'positive', default: '100_000', purpose: 'I2C bus clock.' },
      ],
      ports: [
        ...commonClockResetPorts(),
        { name: 'start_i', direction: 'in', width: '1 bit', purpose: 'Starts one I2C transaction.' },
        { name: 'addr_i', direction: 'in', width: '7 bits', purpose: 'Target slave address.' },
        { name: 'data_i', direction: 'in', width: '8 bits', purpose: 'Write payload.' },
        { name: 'data_o', direction: 'out', width: '8 bits', purpose: 'Read payload.' },
        { name: 'busy_o', direction: 'out', width: '1 bit', purpose: 'High while transaction is active.' },
        { name: 'ack_error_o', direction: 'out', width: '1 bit', purpose: 'Indicates missing ACK.' },
      ],
      ownedOutputs: ['data_o', 'busy_o', 'ack_error_o'],
      timingContract: 'I2C phases are sequenced by bounded counters; SDA/SCL output-enable intent must be explicit.',
      resetContract: 'Reset releases the bus intent and clears busy/status outputs.',
      verificationScenarios: [
        'Reset leaves transaction state idle.',
        'Nominal write receives ACK and completes.',
        'Missing ACK raises ack_error_o without weakening checks.',
      ],
      integrationRisks: ['True tri-state IO should remain at top-level constraints; internal RTL should model output-enable intent.'],
      portableVhdlAssumptions: ['No vendor IO primitive is required in portable simulation RTL.'],
    };
  }

  if (/(decoder|decode|control_fsm|controller|fsm)/.test(lower)) {
    return {
      blockId,
      name: displayName,
      sourceUrls: [],
      sourceTrust: 'curated_seed',
      licenseNotes: 'Generated from app-owned control/FSM architecture rules; no external implementation code is copied.',
      purpose: 'Own state transitions, decode conditions, and registered control/status outputs for the selected subsystem.',
      generics: [],
      ports: [
        ...commonClockResetPorts(),
        { name: 'start_i', direction: 'in', width: '1 bit', purpose: 'Starts or enables the controlled operation.' },
        { name: 'busy_o', direction: 'out', width: '1 bit', purpose: 'Registered busy indication.' },
        ...statusOutputs(),
      ],
      ownedOutputs: ['busy_o', 'done_o', 'error_o', 'status_o'],
      timingContract: 'FSM must cover every enum state and every expected transition; done/status timing must match verification scenarios.',
      resetContract: 'Reset returns the FSM to idle and clears all status/control outputs.',
      verificationScenarios: [
        'Reset state and outputs are deterministic.',
        'Nominal start sequence reaches done within the bounded contract window.',
        'Illegal or timeout paths set error/status without hanging.',
      ],
      integrationRisks: ['Every enum case must have explicit handling or a safe when others branch.'],
      portableVhdlAssumptions: ['Use enumerated state types with complete case coverage.'],
    };
  }

  if (/(saturating|alu|mac|multiply|accumulate|fixed_point|arithmetic|shifter|datapath)/.test(lower)) {
    return {
      blockId,
      name: displayName,
      sourceUrls: [],
      sourceTrust: 'curated_seed',
      licenseNotes: 'Generated from app-owned compute/datapath architecture rules; no external implementation code is copied.',
      purpose: 'Implement a bounded numeric datapath with explicit numeric_std conversions, overflow behavior, and output ownership.',
      generics: [
        { name: 'DATA_WIDTH', type: 'positive', default: '8', purpose: 'Datapath operand and result width.' },
      ],
      ports: [
        ...commonClockResetPorts(),
        { name: 'a_i', direction: 'in', width: 'DATA_WIDTH bits', purpose: 'First numeric operand.' },
        { name: 'b_i', direction: 'in', width: 'DATA_WIDTH bits', purpose: 'Second numeric operand or shift amount source.' },
        { name: 'op_i', direction: 'in', width: 'operation selector width', purpose: 'Operation selector defined by the package contract.' },
        { name: 'result_o', direction: 'out', width: 'DATA_WIDTH bits', purpose: 'Registered or combinational result with explicit overflow behavior.' },
        { name: 'valid_o', direction: 'out', width: '1 bit', purpose: 'Result-valid qualifier when the datapath is sequential.' },
        { name: 'overflow_o', direction: 'out', width: '1 bit', purpose: 'Overflow/saturation indication when applicable.' },
      ],
      ownedOutputs: ['result_o', 'valid_o', 'overflow_o'],
      timingContract:
        'Numeric operations must use explicit signed/unsigned boundaries, complete case choices, and declared wrap/saturate behavior.',
      resetContract: 'Reset clears registered result/status outputs; purely combinational variants must define safe default assignments.',
      verificationScenarios: [
        'Nominal add/subtract or selected operation produces the expected result.',
        'Overflow or saturation boundary follows the declared contract.',
        'Every opcode/selector choice is covered by an explicit test.',
      ],
      integrationRisks: ['Do not mix integer/vector arithmetic without explicit to_unsigned/to_signed/resize boundaries.'],
      portableVhdlAssumptions: ['Use ieee.numeric_std and avoid vendor DSP primitives unless the architecture explicitly allows them.'],
    };
  }

  if (/(pid|flight|imu|sensor_fusion|motor|servo|actuator)/.test(lower)) {
    return {
      blockId,
      name: displayName,
      sourceUrls: [],
      sourceTrust: 'curated_seed',
      licenseNotes: 'Generated from app-owned control-loop architecture rules; no external implementation code is copied.',
      purpose: 'Implement bounded fixed-point control-loop computation with explicit sample-valid timing and safety status ownership.',
      generics: [
        { name: 'DATA_WIDTH', type: 'positive', default: '16', purpose: 'Fixed-point input/output width.' },
        { name: 'FRAC_BITS', type: 'natural', default: '8', purpose: 'Number of fractional bits.' },
      ],
      ports: [
        ...commonClockResetPorts(),
        { name: 'sample_valid_i', direction: 'in', width: '1 bit', purpose: 'Marks a new input sample.' },
        { name: 'setpoint_i', direction: 'in', width: 'DATA_WIDTH bits', purpose: 'Target value.' },
        { name: 'measurement_i', direction: 'in', width: 'DATA_WIDTH bits', purpose: 'Measured value.' },
        { name: 'control_o', direction: 'out', width: 'DATA_WIDTH bits', purpose: 'Computed bounded control output.' },
        ...statusOutputs(),
      ],
      ownedOutputs: ['control_o', 'done_o', 'error_o', 'status_o'],
      timingContract:
        'A valid input sample produces a bounded fixed-latency output; arithmetic must use explicit saturation or truncation rules.',
      resetContract: 'Reset clears accumulators, output, done/error, and status.',
      verificationScenarios: [
        'Reset clears control output and status.',
        'Nominal sample produces expected sign/direction and done within latency.',
        'Overflow input follows explicit saturation/truncation behavior.',
      ],
      integrationRisks: ['Fixed-point scaling and saturation must be declared in the package or contract before RTL generation.'],
      portableVhdlAssumptions: ['Use numeric_std signed/unsigned with explicit resize operations.'],
    };
  }

  if (/(video|pixel|vga|hdmi|framebuffer|camera|image)/.test(lower)) {
    return {
      blockId,
      name: displayName,
      sourceUrls: [],
      sourceTrust: 'curated_seed',
      licenseNotes: 'Generated from app-owned video architecture rules; no external implementation code is copied.',
      purpose: 'Generate bounded pixel/frame timing or video address/control signals with active-area guards.',
      generics: [
        { name: 'H_ACTIVE', type: 'positive', default: '640', purpose: 'Active horizontal pixels.' },
        { name: 'V_ACTIVE', type: 'positive', default: '480', purpose: 'Active vertical lines.' },
      ],
      ports: [
        ...commonClockResetPorts(),
        { name: 'active_i', direction: 'in', width: '1 bit', purpose: 'Active-video qualifier.' },
        { name: 'x_i', direction: 'in', width: 'integer range 0 to H_ACTIVE-1', purpose: 'Horizontal active pixel coordinate.' },
        { name: 'y_i', direction: 'in', width: 'integer range 0 to V_ACTIVE-1', purpose: 'Vertical active line coordinate.' },
        { name: 'pixel_addr_o', direction: 'out', width: 'address width from framebuffer size', purpose: 'Guarded pixel address.' },
        { name: 'valid_o', direction: 'out', width: '1 bit', purpose: 'Pixel/address valid qualifier.' },
      ],
      ownedOutputs: ['pixel_addr_o', 'valid_o'],
      timingContract:
        'Address generation must use constrained integer math in active area and one explicit to_unsigned(..., pixel_addr_o\'length) conversion.',
      resetContract: 'Reset clears pixel address and valid output.',
      verificationScenarios: [
        'Reset clears address/valid.',
        'Active pixel coordinates map to monotonic frame addresses.',
        'Blanking area deasserts valid and avoids invalid address math.',
      ],
      integrationRisks: ['Do not multiply unconstrained vectors or mix integer/vector address math without explicit conversion boundaries.'],
      portableVhdlAssumptions: ['Use constrained integer counters and numeric_std conversions only at output boundaries.'],
    };
  }

  return null;
}

async function collectSourceHints(
  blockId: string,
  blockName: string,
  signal: AbortSignal | undefined,
  fetchText: (url: string, signal?: AbortSignal) => Promise<string>,
): Promise<{ urls: string[]; trusts: FpgaMissingBlockSourceTrust[]; warnings: string[] }> {
  const urls: string[] = [];
  const trusts: FpgaMissingBlockSourceTrust[] = [];
  const warnings: string[] = [];

  for (const url of blockSourceCandidates(blockName).slice(0, 4)) {
    try {
      const text = compactSourceText(await fetchText(url, signal));
      if (!text || !textMentionsBlock(text, blockId)) continue;
      urls.push(url);
      trusts.push(sourceTrustForUrl(url));
      if (urls.length >= 2) break;
    } catch (error) {
      warnings.push(`Could not read ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { urls, trusts, warnings };
}

function strongestTrust(values: FpgaMissingBlockSourceTrust[]): FpgaMissingBlockSourceTrust {
  if (values.includes('official_vendor')) return 'official_vendor';
  if (values.includes('open_source')) return 'open_source';
  if (values.includes('documentation')) return 'documentation';
  return 'curated_seed';
}

export async function discoverMissingFpgaBlocks(
  params: DiscoverMissingFpgaBlocksParams,
): Promise<FpgaMissingBlockDiscoveryResult> {
  const requestedBlocks = uniqueStrings(params.missingBlocks).slice(0, MAX_MISSING_BLOCKS_TO_DISCOVER);
  if (requestedBlocks.length === 0) {
    return {
      requestedBlocks: [],
      discoveredBlocks: [],
      unresolvedBlocks: [],
      unsafeReasons: [],
      sourceUrls: [],
      warnings: [],
      mode: 'not_needed',
    };
  }

  const fetchText = params.fetchText ?? defaultFetchText;
  const discoveredBlocks: FpgaDiscoveredBlockContract[] = [];
  const unresolvedBlocks: string[] = [];
  const unsafeReasons: string[] = [];
  const sourceUrls: string[] = [];
  const warnings: string[] = [];

  for (const blockName of requestedBlocks) {
    const blockId = normalizeMissingBlockName(blockName);
    if (!isLegalTemporaryBlockId(blockId)) {
      unresolvedBlocks.push(blockName);
      unsafeReasons.push(`Missing block "${blockName}" does not normalize to a legal VHDL-safe block id.`);
      continue;
    }

    const seedContract = buildSeedContract(blockId, blockName, params.userRequest);
    if (!seedContract) {
      unresolvedBlocks.push(blockName);
      unsafeReasons.push(
        `Missing block "${blockName}" is not a recognized reusable FPGA role, so the app cannot create a safe temporary contract automatically.`,
      );
      continue;
    }

    const hints = await collectSourceHints(blockId, blockName, params.signal, fetchText);
    warnings.push(...hints.warnings);
    sourceUrls.push(...hints.urls);
    discoveredBlocks.push({
      ...seedContract,
      sourceUrls: hints.urls,
      sourceTrust: hints.urls.length > 0 ? strongestTrust(hints.trusts) : seedContract.sourceTrust,
      licenseNotes:
        hints.urls.length > 0
          ? 'External sources are used only for block-spec inspiration and methodology hints; no third-party implementation code is copied.'
          : seedContract.licenseNotes,
    });
  }

  return {
    requestedBlocks,
    discoveredBlocks,
    unresolvedBlocks,
    unsafeReasons,
    sourceUrls: uniqueStrings(sourceUrls),
    warnings,
    mode: unresolvedBlocks.length > 0 ? 'unresolved_or_unsafe' : 'auto_discovered',
  };
}

export function formatMissingBlockDiscoveryPromptSection(result: FpgaMissingBlockDiscoveryResult | null | undefined): string {
  if (!result || result.mode === 'not_needed' || result.requestedBlocks.length === 0) return '';

  const lines: string[] = [
    '## Auto-discovered temporary block contracts',
    'The app detected missing architecture blocks and automatically normalized safe temporary contracts before VHDL generation.',
    'Use these as bounded architecture inputs. Do not copy external implementation code and do not invent ports outside the approved contract unless the architecture contract explicitly adds them.',
  ];

  for (const block of result.discoveredBlocks) {
    lines.push(`- ${block.blockId} (${block.name})`);
    lines.push(`  purpose: ${block.purpose}`);
    lines.push(`  sourceTrust: ${block.sourceTrust}`);
    lines.push(`  ownedOutputs: ${block.ownedOutputs.join(', ') || 'none'}`);
    lines.push(`  timing: ${block.timingContract}`);
    lines.push(`  reset: ${block.resetContract}`);
    lines.push(`  generics: ${block.generics.map((generic) => `${generic.name}:${generic.type}${generic.default ? `=${generic.default}` : ''}`).join(', ') || 'none'}`);
    lines.push(
      `  ports: ${block.ports
        .map((port) => `${port.name}:${port.direction}:${port.width}`)
        .join(', ')}`,
    );
    lines.push(`  verification: ${block.verificationScenarios.join(' | ')}`);
    if (block.sourceUrls.length > 0) lines.push(`  sourceUrls: ${block.sourceUrls.join(', ')}`);
  }

  if (result.unresolvedBlocks.length > 0) {
    lines.push(`Unresolved missing blocks: ${result.unresolvedBlocks.join(', ')}`);
    lines.push(`Unsafe reasons: ${result.unsafeReasons.join(' | ')}`);
  }

  return lines.join('\n');
}

export function buildMissingBlockFitReviewPrompt(params: {
  userRequest: string;
  discovery: FpgaMissingBlockDiscoveryResult;
}): string {
  return [
    'You are reviewing automatically discovered FPGA building-block contracts before VHDL architecture generation.',
    'Return one complete JSON object only. No Markdown, comments, or trailing text.',
    '',
    'JSON schema:',
    '{',
    '  "fit": "good" | "partial" | "poor",',
    '  "confidence": number,',
    '  "selectedPrimaryPattern": string,',
    '  "selectedSupportBlocks": string[],',
    '  "missingBlocks": string[],',
    '  "unnecessaryBlocks": string[],',
    '  "recommendedPrimaryPattern": string,',
    '  "recommendedSupportBlocks": string[],',
    '  "architectureRisks": string[],',
    '  "fitIssues": string[],',
    '  "recommendedAdjustment": string',
    '}',
    '',
    'Review rules:',
    '- Mark fit="good" only if the discovered blocks are appropriate and enough to proceed to architecture contract generation.',
    '- Mark fit="partial" if the discovered blocks are useful but require bounded adjustments inside the architecture contract.',
    '- Mark fit="poor" if the discovered blocks are the wrong architectural approach or the missing pieces are unsafe/unresolved.',
    '- Do not ask the user to approve sources. This app flow is automatic.',
    '- Do not recommend copying third-party VHDL. External sources are only block-spec inspiration.',
    '',
    `User request:\n${params.userRequest}`,
    '',
    formatMissingBlockDiscoveryPromptSection(params.discovery),
  ].join('\n');
}
