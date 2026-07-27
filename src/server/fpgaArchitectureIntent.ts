export type FpgaArchitectureRequirementEvidence = {
  value: string;
  evidence: string;
  confidence: number;
};

export type FpgaArchitectureIntent = {
  schemaVersion: '1.0';
  explicitRequirements: Record<string, string[]>;
  inferredRequirements: Record<string, FpgaArchitectureRequirementEvidence[]>;
  unknownRequirements: string[];
  designClassCandidates: Array<{
    designClass: string;
    confidence: number;
    evidence: string;
  }>;
  confidenceByField: Record<string, number>;
  clarificationQuestions: string[];
  acceptedAppDefaults?: string[];
};

export type FpgaArchitectureClarificationRequest = {
  status: 'awaiting_architecture_clarification';
  questions: string[];
  unknownRequirements: string[];
  issueCodes: string[];
  userActionPrompt: string;
  intent: FpgaArchitectureIntent;
};

export type FpgaArchitectureIntentValidation = {
  ok: boolean;
  clarificationRequest?: FpgaArchitectureClarificationRequest;
};

const KNOWN_DESIGN_CLASSES: Array<{ designClass: string; patterns: RegExp[] }> = [
  { designClass: 'cpu_core', patterns: [/\b(?:cpu|processor|mcu|microcontroller|instruction\s+decoder|program\s+counter)\b/i] },
  { designClass: 'alu', patterns: [/\balu\b|\barithmetic\s+logic\s+unit\b/i] },
  { designClass: 'uart_spi_protocol_bridge', patterns: [/\buart\b.*\bspi\b|\bspi\b.*\buart\b|\bprotocol\s+bridge\b/i] },
  { designClass: 'video_pattern_generator', patterns: [/\b(?:video|vga|hdmi|framebuffer|pixel|camera|image)\b/i] },
  { designClass: 'dsp_chain', patterns: [/\b(?:dsp|fir|iir|fft|filter|cordic|dds|mixer|sample\s+rate)\b/i] },
  { designClass: 'axi_stream_router', patterns: [/\b(?:axi\s*stream|axis|stream\s+router|valid\/ready)\b/i] },
  { designClass: 'flight_controller', patterns: [/\b(?:flight\s+controller|quadcopter|drone|imu|pid|motor\s+mixer)\b/i] },
  { designClass: 'generic_fpga_vhdl_system', patterns: [/\b(?:fpga\s+block|rtl\s+block|vhdl\s+block|custom\s+block)\b/i] },
];

const KNOWN_ACRONYMS = new Set([
  'ADC',
  'ALU',
  'APB',
  'AXI',
  'CAN',
  'CDC',
  'CLK',
  'CPU',
  'CRC',
  'DAC',
  'DDR',
  'DMA',
  'DSP',
  'FAIL',
  'FFT',
  'FILE',
  'FIFO',
  'FIR',
  'FPGA',
  'FSM',
  'GHDL',
  'GPIO',
  'HDL',
  'HDMI',
  'I2C',
  'IMU',
  'IP',
  'ISA',
  'JSON',
  'LIN',
  'LVDS',
  'MAC',
  'MCU',
  'MISO',
  'MOSI',
  'PID',
  'PLL',
  'PASS',
  'PWM',
  'RAM',
  'RESET',
  'RISC',
  'ROM',
  'RST',
  'RTL',
  'SCLK',
  'SDRAM',
  'SPI',
  'UART',
  'UDP',
  'VGA',
  'VHDL',
]);

const APP_DEFAULT_CLOCK_RESET = 'App default: one 100 MHz-style clock named clk and synchronous active-high reset named rst.';
const APP_DEFAULT_GENERIC_INTERFACE = 'App default: a compact start/data/status interface when the request does not declare external pins.';
const APP_DEFAULT_VERIFICATION = 'App default: a deterministic reset/start/self-checking GHDL smoke scenario.';

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function collectMatches(prompt: string, patterns: RegExp[]) {
  return patterns
    .map((pattern) => prompt.match(pattern)?.[0]?.trim() || '')
    .filter(Boolean);
}

function extractJsonObject(text: string) {
  const trimmed = String(text || '').trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Intent response did not contain one JSON object.');
  return trimmed.slice(start, end + 1);
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(asString).filter(Boolean) : [];
}

function asConfidence(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? Math.min(1, Math.max(0, numberValue)) : 0;
}

function normalizeRequirementRecord(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
    key,
    Array.isArray(entry)
      ? entry.map(asString).filter(Boolean)
      : asString(entry)
        ? [asString(entry)]
        : [],
  ]));
}

function normalizeEvidenceRecord(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
    key,
    Array.isArray(entry)
      ? entry.map((item) => ({
        value: asString((item as any)?.value),
        evidence: asString((item as any)?.evidence),
        confidence: asConfidence((item as any)?.confidence),
      })).filter((item) => item.value && item.evidence)
      : [],
  ]));
}

function detectUnknownAcronyms(prompt: string) {
  const acronyms = prompt.match(/\b[A-Z][A-Z0-9]{2,}\b/g) || [];
  return unique(acronyms.filter((acronym) => !KNOWN_ACRONYMS.has(acronym)));
}

function hasMandatoryDesignClass(prompt: string) {
  return /mandatory\s+design\s+class\s*:/i.test(prompt);
}

function extractMandatoryDesignClass(prompt: string) {
  return prompt.match(/mandatory\s+design\s+class\s*:\s*([a-zA-Z0-9_]+)/i)?.[1]?.trim() || '';
}

function extractWidthRequirements(prompt: string) {
  return unique((prompt.match(/\b\d+\s*[- ]?bit\b/gi) || []).map((entry) => entry.replace(/\s+/g, ' ').trim()));
}

function extractExternalInterfaces(prompt: string) {
  const interfaces = [
    'UART',
    'SPI',
    'I2C',
    'AXI-Stream',
    'AXI-Lite',
    'Wishbone',
    'APB',
    'VGA',
    'HDMI',
    'PWM',
    'GPIO',
    'ADC',
    'DAC',
    'Ethernet',
    'CAN',
    'LIN',
  ];
  return interfaces.filter((name) => new RegExp(`\\b${name.replace(/[-]/g, '[- ]?')}\\b`, 'i').test(prompt));
}

export function extractFpgaArchitectureIntentSource(userRequest: string) {
  const request = String(userRequest || '').trim();
  const explicitUserRequestMatch = request.match(/(?:^|\n)User design request:\s*\n([\s\S]*?)(?:\n{2,}(?:Strict FPGA architecture intent extracted by the app\.|User clarification for FPGA Architecture intent gate:)|$)/i);
  if (explicitUserRequestMatch?.[1]?.trim()) {
    return explicitUserRequestMatch[1].trim();
  }

  const sweepSpecMatch = request.match(/(?:^|\n)# FPGA Architect Design Spec\s*\n([\s\S]*?)(?:\n## Prior Failure Feedback|\n## Repair Continuation Mode|\n## Existing Generated Files To Repair|\n## User Request|$)/i);
  if (sweepSpecMatch?.[1]?.trim()) {
    return [
      '# FPGA Architect Design Spec',
      sweepSpecMatch[1]
        .split('\n')
        .filter((line) => !/^\s*-\s*Output root:/i.test(line))
        .join('\n')
        .trim(),
    ].join('\n');
  }

  return request;
}

export function buildFpgaArchitectureIntentExtractionPrompt(params: {
  userRequest: string;
}) {
  const intentSource = extractFpgaArchitectureIntentSource(params.userRequest);
  return [
    'Extract FPGA architecture intent from the user prompt. Return exactly one JSON object and no Markdown.',
    'Do not assume missing intent. Any inferred requirement must include exact evidence from the user prompt.',
    'If evidence is missing or an acronym is unknown, put that field in unknownRequirements and ask a concise clarification question.',
    'Never silently expand unknown acronyms. Example: "16-bit CUPG" must not become CPU unless the prompt says CPU or processor.',
    '',
    'Required JSON shape:',
    JSON.stringify({
      schemaVersion: '1.0',
      explicitRequirements: {
        designClass: ['exact stated class'],
        widths: ['16-bit'],
      },
      inferredRequirements: {
        designClass: [{ value: 'cpu_core', evidence: 'CPU', confidence: 0.9 }],
      },
      unknownRequirements: ['field name'],
      designClassCandidates: [{ designClass: 'cpu_core', confidence: 0.9, evidence: 'CPU' }],
      confidenceByField: { designClass: 0.9 },
      clarificationQuestions: ['What does CUPG mean in this design?'],
    }, null, 2),
    '',
    'User prompt:',
    intentSource,
  ].join('\n');
}

export function parseFpgaArchitectureIntent(text: string): FpgaArchitectureIntent {
  const parsed = JSON.parse(extractJsonObject(text));
  return {
    schemaVersion: '1.0',
    explicitRequirements: normalizeRequirementRecord(parsed?.explicitRequirements),
    inferredRequirements: normalizeEvidenceRecord(parsed?.inferredRequirements),
    unknownRequirements: asStringArray(parsed?.unknownRequirements),
    designClassCandidates: Array.isArray(parsed?.designClassCandidates)
      ? parsed.designClassCandidates.map((candidate: any) => ({
        designClass: asString(candidate?.designClass),
        confidence: asConfidence(candidate?.confidence),
        evidence: asString(candidate?.evidence),
      })).filter((candidate: any) => candidate.designClass && candidate.evidence)
      : [],
    confidenceByField: parsed?.confidenceByField && typeof parsed.confidenceByField === 'object'
      ? Object.fromEntries(Object.entries(parsed.confidenceByField).map(([field, confidence]) => [field, asConfidence(confidence)]))
      : {},
    clarificationQuestions: asStringArray(parsed?.clarificationQuestions),
    acceptedAppDefaults: asStringArray(parsed?.acceptedAppDefaults),
  };
}

export function buildDeterministicFpgaArchitectureIntent(userRequest: string): FpgaArchitectureIntent {
  const prompt = extractFpgaArchitectureIntentSource(userRequest);
  const explicitRequirements: Record<string, string[]> = {};
  const inferredRequirements: Record<string, FpgaArchitectureRequirementEvidence[]> = {};
  const designClassCandidates: FpgaArchitectureIntent['designClassCandidates'] = [];
  const confidenceByField: Record<string, number> = {};
  const unknownRequirements: string[] = [];
  const clarificationQuestions: string[] = [];
  const acceptedAppDefaults: string[] = [];

  const mandatoryClass = extractMandatoryDesignClass(prompt);
  if (mandatoryClass) {
    explicitRequirements.designClass = [mandatoryClass];
    designClassCandidates.push({
      designClass: mandatoryClass,
      confidence: 1,
      evidence: `Mandatory design class: ${mandatoryClass}`,
    });
    confidenceByField.designClass = 1;
  } else {
    for (const candidate of KNOWN_DESIGN_CLASSES) {
      const evidence = collectMatches(prompt, candidate.patterns);
      if (evidence.length === 0) continue;
      const confidence = candidate.designClass === 'generic_fpga_vhdl_system' ? 0.62 : 0.82;
      designClassCandidates.push({
        designClass: candidate.designClass,
        confidence,
        evidence: evidence[0],
      });
    }
    designClassCandidates.sort((left, right) => right.confidence - left.confidence || left.designClass.localeCompare(right.designClass));
    if (designClassCandidates[0]) {
      inferredRequirements.designClass = [{
        value: designClassCandidates[0].designClass,
        evidence: designClassCandidates[0].evidence,
        confidence: designClassCandidates[0].confidence,
      }];
      confidenceByField.designClass = designClassCandidates[0].confidence;
    }
  }

  const widths = extractWidthRequirements(prompt);
  if (widths.length > 0) {
    explicitRequirements.widths = widths;
    confidenceByField.widths = 1;
  }

  const interfaces = extractExternalInterfaces(prompt);
  if (interfaces.length > 0) {
    explicitRequirements.externalInterfaces = interfaces;
    confidenceByField.externalInterfaces = 1;
  } else {
    acceptedAppDefaults.push(APP_DEFAULT_GENERIC_INTERFACE);
    confidenceByField.externalInterfaces = 0.55;
  }

  if (/\b(?:clock|clk|mhz|reset|rst|active[- ]?(?:high|low)|synchronous|asynchronous)\b/i.test(prompt)) {
    explicitRequirements.clockReset = [prompt.match(/\b(?:clock|clk|mhz|reset|rst|active[- ]?(?:high|low)|synchronous|asynchronous)[^.;\n]*/i)?.[0]?.trim() || 'clock/reset policy stated'];
    confidenceByField.clockReset = 1;
  } else {
    acceptedAppDefaults.push(APP_DEFAULT_CLOCK_RESET);
    confidenceByField.clockReset = 0.55;
  }

  if (/\b(?:test|verify|self[- ]?check|pass|fail|expected|done|status|observable|assert)\b/i.test(prompt)) {
    explicitRequirements.expectedObservableBehavior = [prompt.match(/\b(?:test|verify|self[- ]?check|pass|fail|expected|done|status|observable|assert)[^.;\n]*/i)?.[0]?.trim() || 'observable behavior stated'];
    confidenceByField.expectedObservableBehavior = 0.8;
  } else {
    acceptedAppDefaults.push(APP_DEFAULT_VERIFICATION);
    confidenceByField.expectedObservableBehavior = 0.55;
  }

  if (prompt.length > 0) {
    explicitRequirements.topLevelPurpose = [prompt.replace(/\s+/g, ' ').slice(0, 240)];
    confidenceByField.topLevelPurpose = 0.85;
  }

  const unknownAcronyms = detectUnknownAcronyms(prompt);
  for (const acronym of unknownAcronyms) {
    unknownRequirements.push(`unknown_acronym:${acronym}`);
    clarificationQuestions.push(`What does ${acronym} mean in this FPGA design?`);
  }

  if (!designClassCandidates[0]) {
    unknownRequirements.push('designClass');
    clarificationQuestions.push('What type of FPGA design should this be, for example CPU core, protocol bridge, datapath, video pipeline, controller, or a custom block?');
  }

  return {
    schemaVersion: '1.0',
    explicitRequirements,
    inferredRequirements,
    unknownRequirements: unique(unknownRequirements),
    designClassCandidates: designClassCandidates.slice(0, 4),
    confidenceByField,
    clarificationQuestions: unique(clarificationQuestions),
    acceptedAppDefaults: unique(acceptedAppDefaults),
  };
}

export function validateFpgaArchitectureIntentCompleteness(
  intent: FpgaArchitectureIntent,
  userRequest: string,
): FpgaArchitectureIntentValidation {
  const unknowns = new Set(intent.unknownRequirements || []);
  const questions = [...intent.clarificationQuestions];
  const candidate = intent.designClassCandidates[0];
  const mandatory = hasMandatoryDesignClass(userRequest);

  if (!candidate && !mandatory) {
    unknowns.add('designClass');
    questions.push('Which design class should the app use before selecting architecture patterns?');
  }

  if (candidate && candidate.confidence < 0.55 && !mandatory) {
    unknowns.add('designClass');
    questions.push('Should the app treat this as a known pattern or a custom FPGA block?');
  }

  if (!intent.explicitRequirements.topLevelPurpose?.length) {
    unknowns.add('topLevelPurpose');
    questions.push('What should the top-level block do in one concrete sentence?');
  }

  if ((intent.confidenceByField.clockReset ?? 0) < 0.5) {
    unknowns.add('clockReset');
    questions.push('Can the app use one synchronous active-high reset named rst and one clock named clk?');
  }

  if ((intent.confidenceByField.externalInterfaces ?? 0) < 0.5) {
    unknowns.add('externalInterfaces');
    questions.push('What external interfaces or pins must the top-level entity expose?');
  }

  if (!mandatory
    && /\b(?:numeric|fixed[- ]?point|signed|unsigned|sample|filter|dsp|alu|cpu|processor|counter)\b/i.test(userRequest)
    && !intent.explicitRequirements.widths?.length
    && !/\bdefault\s+width\b/i.test(userRequest)) {
    unknowns.add('widthOrFormat');
    questions.push('What data width and numeric format should the design use?');
  }

  if ((intent.confidenceByField.expectedObservableBehavior ?? 0) < 0.5) {
    unknowns.add('expectedObservableBehavior');
    questions.push('What observable output should the self-checking testbench prove?');
  }

  const unknownList = Array.from(unknowns);
  if (unknownList.length === 0) return { ok: true };

  const conciseQuestions = unique(questions).slice(0, 4);
  return {
    ok: false,
    clarificationRequest: {
      status: 'awaiting_architecture_clarification',
      questions: conciseQuestions,
      unknownRequirements: unknownList,
      issueCodes: unknownList.map((unknown) => (
        unknown.startsWith('unknown_acronym:')
          ? 'architecture_intent_ambiguous_design_class'
          : 'architecture_intent_unknown_required_field'
      )),
      userActionPrompt: [
        'Architecture intent needs clarification before VHDL generation.',
        'Answer the listed questions so the app can select patterns and build the contract without guessing.',
      ].join(' '),
      intent,
    },
  };
}

export function buildFpgaArchitectureIntentClarificationIssues(
  clarification: FpgaArchitectureClarificationRequest,
) {
  return clarification.unknownRequirements.map((unknown, index) => ({
    code: clarification.issueCodes[index] || 'architecture_intent_clarification_required',
    path: `$.intent.${unknown}`,
    message: clarification.questions[index] || clarification.userActionPrompt,
  })).concat([{
    code: 'architecture_intent_clarification_required',
    path: '$.intent',
    message: clarification.userActionPrompt,
  }]);
}

export function mergeFpgaArchitectureIntentIntoPrompt(params: {
  userRequest: string;
  intent: FpgaArchitectureIntent;
}) {
  return [
    params.userRequest.trim(),
    '',
    'Strict FPGA architecture intent extracted by the app. Treat this as source evidence; do not add assumptions beyond it.',
    JSON.stringify({
      explicitRequirements: params.intent.explicitRequirements,
      inferredRequirements: params.intent.inferredRequirements,
      acceptedAppDefaults: params.intent.acceptedAppDefaults || [],
      designClassCandidates: params.intent.designClassCandidates,
    }, null, 2),
  ].join('\n');
}
