type AnalyzerSignal = {
  id?: string;
  name?: string;
  type?: string;
  values?: Array<number | string>;
  visible?: boolean;
  config?: {
    gateType?: string;
    inputA?: string;
    inputB?: string;
    decoderType?: 'SPI' | 'I2C' | 'UART';
    clkSignalId?: string;
    dataSignalId?: string;
    csSignalId?: string;
    rxSignalId?: string;
    baudTicks?: number;
  };
};

type HazardFinding = {
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  signalNames: string[];
  startTick: number | null;
  endTick: number | null;
  relatedTicks: number[];
};

type ProtocolKind = 'SPI' | 'I2C' | 'UART';

type ProtocolFrame = {
  protocol: ProtocolKind;
  channel: string;
  startTick: number;
  endTick: number;
  summary: string;
  detail: string;
};

export function formatSignalValue(value: number | string) {
  if (typeof value === 'number') {
    if (value === -1) return 'Z';
    return String(value);
  }
  return value;
}

export function normalizeLogicValue(value: number | string | undefined | null): number | 'Z' | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') {
    if (value === -1) return 'Z';
    return value === 1 ? 1 : 0;
  }
  const normalized = String(value).trim().toUpperCase();
  if (!normalized) return null;
  if (normalized === 'Z' || normalized === 'X') return 'Z';
  if (normalized === '1' || normalized === 'H' || normalized === 'HIGH' || normalized === 'TRUE') return 1;
  if (normalized === '0' || normalized === 'L' || normalized === 'LOW' || normalized === 'FALSE') return 0;
  if (/^[01]+$/.test(normalized)) {
    return normalized.endsWith('1') ? 1 : 0;
  }
  return null;
}

function formatTickWindow(startTick: number, endTick: number, tickDuration: number, timeUnit: string) {
  const startTime = startTick * tickDuration;
  const endTime = endTick * tickDuration;
  if (startTick === endTick) {
    return `tick ${startTick} (${startTime} ${timeUnit})`;
  }
  return `ticks ${startTick}-${endTick} (${startTime}-${endTime} ${timeUnit})`;
}

function formatSeverityBadge(severity: HazardFinding['severity']) {
  switch (severity) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    default:
      return 'Low';
  }
}

function formatByte(byteValue: number) {
  const hex = `0x${byteValue.toString(16).toUpperCase().padStart(2, '0')}`;
  const ascii = byteValue >= 32 && byteValue <= 126 ? ` '${String.fromCharCode(byteValue)}'` : '';
  return `${hex}${ascii}`;
}

export function getSignalName(signal: AnalyzerSignal) {
  return signal.name || signal.id || 'unnamed_signal';
}

export function getSignalValues(signal: AnalyzerSignal | undefined, fallback: Array<number | string> = []) {
  return Array.isArray(signal?.values) ? signal.values : fallback;
}

function findSignalByName(signals: AnalyzerSignal[], patterns: RegExp[]) {
  return signals.find((signal) => {
    const haystack = `${signal.name || ''} ${signal.id || ''}`.toLowerCase();
    return patterns.some((pattern) => pattern.test(haystack));
  });
}

function findSignalById(signals: AnalyzerSignal[], id?: string) {
  if (!id) return undefined;
  return signals.find((signal) => signal.id === id);
}

function estimateUartBaudTicks(values: Array<number | string>) {
  const runLengths: number[] = [];
  let current = normalizeLogicValue(values[0]);
  let length = 1;
  for (let index = 1; index < values.length; index += 1) {
    const next = normalizeLogicValue(values[index]);
    if (next === current) {
      length += 1;
    } else {
      if (length >= 2 && current !== null && current !== 'Z') {
        runLengths.push(length);
      }
      current = next;
      length = 1;
    }
  }
  if (length >= 2 && current !== null && current !== 'Z') {
    runLengths.push(length);
  }
  if (runLengths.length === 0) return 8;

  const counts = new Map<number, number>();
  runLengths.forEach((runLength) => counts.set(runLength, (counts.get(runLength) || 0) + 1));
  return [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0] - right[0])[0]?.[0] || 8;
}

function decodeSpiFrames(channel: string, sckValues: Array<number | string>, dataValues: Array<number | string>, csValues: Array<number | string>): ProtocolFrame[] {
  const frames: ProtocolFrame[] = [];
  let inTransaction = false;
  let startTick = 0;
  let bits: number[] = [];
  const bytes: number[] = [];

  const flushFrame = (endTick: number) => {
    if (!inTransaction) return;
    const renderedBytes = bytes.map(formatByte);
    frames.push({
      protocol: 'SPI',
      channel,
      startTick,
      endTick,
      summary: renderedBytes.length > 0 ? `SPI bytes ${renderedBytes.join(', ')}` : 'SPI transaction detected',
      detail: renderedBytes.length > 0
        ? `Decoded ${bytes.length} byte(s) on MOSI: ${renderedBytes.join(', ')}.`
        : `Chip-select asserted from tick ${startTick} to ${endTick}, but a complete byte was not captured.`,
    });
    inTransaction = false;
    bits = [];
    bytes.length = 0;
  };

  for (let tick = 1; tick < Math.min(sckValues.length, dataValues.length, csValues.length); tick += 1) {
    const csPrev = normalizeLogicValue(csValues[tick - 1]);
    const csCurr = normalizeLogicValue(csValues[tick]);
    const sckPrev = normalizeLogicValue(sckValues[tick - 1]);
    const sckCurr = normalizeLogicValue(sckValues[tick]);

    if (!inTransaction && csCurr === 0) {
      inTransaction = true;
      startTick = tick;
      bits = [];
      bytes.length = 0;
    }

    if (inTransaction && sckPrev === 0 && sckCurr === 1 && csCurr === 0) {
      const bit = normalizeLogicValue(dataValues[tick]);
      if (bit === 0 || bit === 1) {
        bits.push(bit);
        if (bits.length === 8) {
          let byteValue = 0;
          bits.forEach((capturedBit) => {
            byteValue = (byteValue << 1) | capturedBit;
          });
          bytes.push(byteValue);
          bits = [];
        }
      }
    }

    if (inTransaction && csPrev === 0 && csCurr === 1) {
      flushFrame(tick);
    }
  }

  if (inTransaction) {
    flushFrame(Math.min(sckValues.length, dataValues.length, csValues.length) - 1);
  }

  return frames;
}

function decodeI2cFrames(channel: string, sclValues: Array<number | string>, sdaValues: Array<number | string>): ProtocolFrame[] {
  const frames: ProtocolFrame[] = [];
  let inTransaction = false;
  let startTick = 0;
  let bits: number[] = [];
  const bytes: Array<{ value: number; ack: boolean }> = [];

  const flushFrame = (endTick: number) => {
    if (!inTransaction) return;
    const renderedBytes = bytes.map((entry) => `${formatByte(entry.value)}${entry.ack ? ' ACK' : ' NACK'}`);
    frames.push({
      protocol: 'I2C',
      channel,
      startTick,
      endTick,
      summary: renderedBytes.length > 0 ? `I2C frame ${renderedBytes.join(', ')}` : 'I2C START/STOP transaction detected',
      detail: renderedBytes.length > 0
        ? `Decoded ${bytes.length} byte(s) between START and STOP: ${renderedBytes.join(', ')}.`
        : `START/STOP activity was detected from tick ${startTick} to ${endTick}, but a complete byte+ACK group was not captured.`,
    });
    inTransaction = false;
    bits = [];
    bytes.length = 0;
  };

  for (let tick = 1; tick < Math.min(sclValues.length, sdaValues.length); tick += 1) {
    const sclPrev = normalizeLogicValue(sclValues[tick - 1]);
    const sclCurr = normalizeLogicValue(sclValues[tick]);
    const sdaPrev = normalizeLogicValue(sdaValues[tick - 1]);
    const sdaCurr = normalizeLogicValue(sdaValues[tick]);

    const isStart = sclCurr === 1 && sdaPrev === 1 && sdaCurr === 0;
    const isStop = sclCurr === 1 && sdaPrev === 0 && sdaCurr === 1;

    if (isStart) {
      if (inTransaction) {
        flushFrame(tick - 1);
      }
      inTransaction = true;
      startTick = tick;
      bits = [];
      bytes.length = 0;
      continue;
    }

    if (inTransaction && sclPrev === 0 && sclCurr === 1) {
      const bit = normalizeLogicValue(sdaValues[tick]);
      if (bit === 0 || bit === 1) {
        bits.push(bit);
        if (bits.length === 9) {
          let byteValue = 0;
          for (let index = 0; index < 8; index += 1) {
            byteValue = (byteValue << 1) | bits[index];
          }
          bytes.push({ value: byteValue, ack: bits[8] === 0 });
          bits = [];
        }
      }
    }

    if (inTransaction && isStop) {
      flushFrame(tick);
    }
  }

  if (inTransaction) {
    flushFrame(Math.min(sclValues.length, sdaValues.length) - 1);
  }

  return frames;
}

function decodeUartFrames(channel: string, rxValues: Array<number | string>, baudTicks: number): ProtocolFrame[] {
  const frames: ProtocolFrame[] = [];
  const baud = Math.max(2, baudTicks);
  let tick = 1;

  while (tick < rxValues.length) {
    const prev = normalizeLogicValue(rxValues[tick - 1]);
    const curr = normalizeLogicValue(rxValues[tick]);
    if (prev === 1 && curr === 0) {
      const startTick = tick;
      let byteValue = 0;
      let valid = true;

      for (let bitIndex = 0; bitIndex < 8; bitIndex += 1) {
        const sampleTick = Math.round(startTick + baud * (bitIndex + 1) + baud / 2);
        const sampled = normalizeLogicValue(rxValues[sampleTick]);
        if (sampled !== 0 && sampled !== 1) {
          valid = false;
          break;
        }
        byteValue |= sampled << bitIndex;
      }

      const stopTick = Math.round(startTick + baud * 9 + baud / 2);
      const stopBit = normalizeLogicValue(rxValues[stopTick]);
      if (valid && stopBit === 1) {
        const endTick = Math.min(rxValues.length - 1, Math.round(startTick + baud * 10));
        frames.push({
          protocol: 'UART',
          channel,
          startTick,
          endTick,
          summary: `UART byte ${formatByte(byteValue)}`,
          detail: `Decoded UART frame from tick ${startTick} to ${endTick}: ${formatByte(byteValue)} using an estimated baud window of ${baud} tick(s) per bit.`,
        });
        tick = endTick;
        continue;
      }
    }
    tick += 1;
  }

  return frames;
}

export function analyzeProtocolFrames(signals: AnalyzerSignal[], tickDuration: number, timeUnit: string) {
  const frames: ProtocolFrame[] = [];
  const visibleSignals = signals.filter((signal) => signal && signal.visible !== false && Array.isArray(signal.values));
  const usedChannels = new Set<string>();

  const addFrames = (channelKey: string, nextFrames: ProtocolFrame[]) => {
    if (nextFrames.length === 0 || usedChannels.has(channelKey)) return;
    usedChannels.add(channelKey);
    frames.push(...nextFrames);
  };

  const decoderSignals = visibleSignals.filter((signal) => signal.type === 'decoder' && signal.config?.decoderType);
  for (const decoderSignal of decoderSignals) {
    const decoderType = decoderSignal.config?.decoderType;
    if (decoderType === 'SPI') {
      const sck = findSignalById(visibleSignals, decoderSignal.config?.clkSignalId);
      const data = findSignalById(visibleSignals, decoderSignal.config?.dataSignalId);
      const cs = findSignalById(visibleSignals, decoderSignal.config?.csSignalId);
      if (sck && data && cs) {
        addFrames(`SPI:${decoderSignal.id}`, decodeSpiFrames(`${getSignalName(decoderSignal)} via ${getSignalName(data)}`, getSignalValues(sck), getSignalValues(data), getSignalValues(cs)));
      }
    } else if (decoderType === 'I2C') {
      const scl = findSignalById(visibleSignals, decoderSignal.config?.clkSignalId);
      const sda = findSignalById(visibleSignals, decoderSignal.config?.dataSignalId);
      if (scl && sda) {
        addFrames(`I2C:${decoderSignal.id}`, decodeI2cFrames(`${getSignalName(decoderSignal)} via ${getSignalName(sda)}`, getSignalValues(scl), getSignalValues(sda)));
      }
    } else if (decoderType === 'UART') {
      const rx = findSignalById(visibleSignals, decoderSignal.config?.rxSignalId);
      if (rx) {
        addFrames(`UART:${decoderSignal.id}`, decodeUartFrames(`${getSignalName(decoderSignal)} via ${getSignalName(rx)}`, getSignalValues(rx), decoderSignal.config?.baudTicks ?? estimateUartBaudTicks(getSignalValues(rx))));
      }
    }
  }

  const spiSck = findSignalByName(visibleSignals, [/\bsck\b/, /\bspi.*clk\b/, /\bspi.*sck\b/]);
  const spiData = findSignalByName(visibleSignals, [/\bmosi\b/, /\bspi.*data\b/, /\bspi.*mosi\b/]);
  const spiCs = findSignalByName(visibleSignals, [/\bcs\b/, /\bss\b/, /chip.?select/, /\bspi.*cs\b/]);
  if (spiSck && spiData && spiCs) {
    addFrames('SPI:heuristic', decodeSpiFrames(`${getSignalName(spiData)} heuristic`, getSignalValues(spiSck), getSignalValues(spiData), getSignalValues(spiCs)));
  }

  const i2cScl = findSignalByName(visibleSignals, [/\bscl\b/, /\bi2c.*clk\b/]);
  const i2cSda = findSignalByName(visibleSignals, [/\bsda\b/, /\bi2c.*data\b/]);
  if (i2cScl && i2cSda) {
    addFrames('I2C:heuristic', decodeI2cFrames(`${getSignalName(i2cSda)} heuristic`, getSignalValues(i2cScl), getSignalValues(i2cSda)));
  }

  const uartCandidates = visibleSignals.filter((signal) => {
    const haystack = `${signal.name || ''} ${signal.id || ''}`.toLowerCase();
    return /\buart\b/.test(haystack) || /\brx\b/.test(haystack) || /\btx\b/.test(haystack) || /\bserial\b/.test(haystack);
  });
  uartCandidates.forEach((signal) => {
    addFrames(`UART:heuristic:${signal.id || signal.name}`, decodeUartFrames(`${getSignalName(signal)} heuristic`, getSignalValues(signal), estimateUartBaudTicks(getSignalValues(signal))));
  });

  frames.sort((left, right) => left.startTick - right.startTick || left.protocol.localeCompare(right.protocol));
  const protocolCounts = new Map<ProtocolKind, number>();
  frames.forEach((frame) => protocolCounts.set(frame.protocol, (protocolCounts.get(frame.protocol) || 0) + 1));

  const markdownLines = [
    '### Deterministic Protocol Pre-Decode',
    frames.length > 0
      ? `Detected ${frames.length} frame(s): ${(['SPI', 'I2C', 'UART'] as ProtocolKind[])
          .filter((protocol) => protocolCounts.has(protocol))
          .map((protocol) => `${protocol} ${protocolCounts.get(protocol)}`)
          .join(', ')}`
      : 'No deterministic SPI, I2C, or UART frames could be decoded from the currently visible signals.',
  ];

  if (frames.length > 0) {
    markdownLines.push('');
    frames.slice(0, 16).forEach((frame) => {
      markdownLines.push(`- [${frame.protocol}] ${frame.summary} on ${frame.channel} at ${formatTickWindow(frame.startTick, frame.endTick, tickDuration, timeUnit)}. ${frame.detail}`);
    });
    if (frames.length > 16) {
      markdownLines.push(`- Additional decoded frames omitted from summary: ${frames.length - 16}`);
    }
  }

  return {
    frames,
    markdown: markdownLines.join('\n'),
  };
}

export function analyzeWaveformHazards(signals: AnalyzerSignal[], tickDuration: number, timeUnit: string) {
  const findings: HazardFinding[] = [];
  const visibleSignals = signals.filter((signal) => signal && signal.visible !== false && Array.isArray(signal.values));
  const signalMap = new Map<string, AnalyzerSignal>(
    visibleSignals
      .filter((signal) => typeof signal.id === 'string' && signal.id)
      .map((signal) => [signal.id as string, signal])
  );

  const transitionMap = new Map<string, number[]>();
  const edgeMap = new Map<string, number[]>();

  for (const signal of visibleSignals) {
    const name = signal.name || signal.id || 'unnamed_signal';
    const values = signal.values || [];
    const transitions: number[] = [];
    const activeEdges: number[] = [];

    for (let index = 1; index < values.length; index += 1) {
      const previous = normalizeLogicValue(values[index - 1]);
      const current = normalizeLogicValue(values[index]);
      if (previous === null || current === null) continue;
      if (previous !== current) {
        transitions.push(index);
        if ((previous === 0 && current === 1) || (previous === 1 && current === 0)) {
          activeEdges.push(index);
        }
      }
    }

    transitionMap.set(name, transitions);
    edgeMap.set(name, activeEdges);

    for (let transitionIndex = 1; transitionIndex < transitions.length; transitionIndex += 1) {
      const pulseWidthTicks = transitions[transitionIndex] - transitions[transitionIndex - 1];
      if (pulseWidthTicks <= 1) {
        findings.push({
          severity: 'high',
          title: `${name}: single-tick pulse/glitch suspect`,
          detail: `Back-to-back transitions were detected at ${formatTickWindow(transitions[transitionIndex - 1], transitions[transitionIndex], tickDuration, timeUnit)}. This usually indicates a very narrow pulse or combinational glitch.`,
          signalNames: [name],
          startTick: transitions[transitionIndex - 1],
          endTick: transitions[transitionIndex],
          relatedTicks: [transitions[transitionIndex - 1], transitions[transitionIndex]],
        });
      } else if (pulseWidthTicks === 2) {
        findings.push({
          severity: 'medium',
          title: `${name}: narrow pulse suspect`,
          detail: `A two-tick pulse was detected around ${formatTickWindow(transitions[transitionIndex - 1], transitions[transitionIndex], tickDuration, timeUnit)}. Review whether this pulse is intentional or a hazard caused by skewed input arrival.`,
          signalNames: [name],
          startTick: transitions[transitionIndex - 1],
          endTick: transitions[transitionIndex],
          relatedTicks: [transitions[transitionIndex - 1], transitions[transitionIndex]],
        });
      }
    }

    let highZTransitions = 0;
    for (let index = 1; index < values.length; index += 1) {
      const previous = normalizeLogicValue(values[index - 1]);
      const current = normalizeLogicValue(values[index]);
      if ((previous === 'Z' && current !== 'Z' && current !== null) || (current === 'Z' && previous !== 'Z' && previous !== null)) {
        highZTransitions += 1;
      }
    }
    if (highZTransitions > 0) {
      const highZTicks = values.reduce<number[]>((acc, _, index) => {
        if (index === 0) return acc;
        const previous = normalizeLogicValue(values[index - 1]);
        const current = normalizeLogicValue(values[index]);
        if ((previous === 'Z' && current !== 'Z' && current !== null) || (current === 'Z' && previous !== 'Z' && previous !== null)) {
          acc.push(index);
        }
        return acc;
      }, []);
      findings.push({
        severity: 'low',
        title: `${name}: tri-state transition activity`,
        detail: `${highZTransitions} transition(s) into or out of High-Z were detected. Confirm bus turn-around timing and contention-free enable sequencing.`,
        signalNames: [name],
        startTick: highZTicks.length > 0 ? Math.min(...highZTicks) : null,
        endTick: highZTicks.length > 0 ? Math.max(...highZTicks) : null,
        relatedTicks: highZTicks,
      });
    }
  }

  const clockSignals = visibleSignals.filter((signal) => {
    const name = `${signal.name || ''} ${signal.id || ''}`.toLowerCase();
    return signal.type === 'clock' || name.includes('clk') || name.includes('clock');
  });

  for (const clockSignal of clockSignals) {
    const clockName = clockSignal.name || clockSignal.id || 'clock';
    const clockEdges = edgeMap.get(clockName) || [];
    for (const signal of visibleSignals) {
      const signalName = signal.name || signal.id || 'unnamed_signal';
      if (signalName === clockName) continue;
      const transitions = transitionMap.get(signalName) || [];
      if (transitions.length === 0 || clockEdges.length === 0) continue;

      const setupHoldHits: Array<{ signalTick: number; clockTick: number }> = [];
      for (const transitionTick of transitions) {
        for (const edgeTick of clockEdges) {
          if (Math.abs(transitionTick - edgeTick) <= 1) {
            setupHoldHits.push({ signalTick: transitionTick, clockTick: edgeTick });
            break;
          }
        }
      }

      if (setupHoldHits.length > 0) {
        const firstHit = setupHoldHits[0];
        findings.push({
          severity: setupHoldHits.length >= 3 ? 'high' : 'medium',
          title: `${signalName}: setup/hold risk near ${clockName}`,
          detail: `${setupHoldHits.length} transition(s) occur within ±1 tick of ${clockName} active edges. First overlap: signal tick ${firstHit.signalTick}, clock edge tick ${firstHit.clockTick}. This is a classic race/setup-hold risk area.`,
          signalNames: [signalName, clockName],
          startTick: Math.min(...setupHoldHits.map((hit) => Math.min(hit.signalTick, hit.clockTick))),
          endTick: Math.max(...setupHoldHits.map((hit) => Math.max(hit.signalTick, hit.clockTick))),
          relatedTicks: setupHoldHits.flatMap((hit) => [hit.signalTick, hit.clockTick]),
        });
      }
    }
  }

  for (const signal of visibleSignals) {
    if (signal.type !== 'gate' || !signal.config?.inputA) continue;
    const signalName = signal.name || signal.id || 'gate_output';
    const inputA = signalMap.get(signal.config.inputA);
    const inputB = signal.config.inputB ? signalMap.get(signal.config.inputB) : undefined;
    if (!inputA) continue;

    const inputATransitions = transitionMap.get(inputA.name || inputA.id || '') || [];
    const inputBTransitions = inputB ? transitionMap.get(inputB.name || inputB.id || '') || [] : [];
    const outputTransitions = transitionMap.get(signalName) || [];

    for (const inputTickA of inputATransitions) {
      const nearInputB = inputBTransitions.find((inputTickB) => Math.abs(inputTickB - inputTickA) <= 1);
      if (!nearInputB) continue;
      const nearOutput = outputTransitions.find((outputTick) => outputTick >= Math.min(inputTickA, nearInputB) && outputTick <= Math.max(inputTickA, nearInputB) + 1);
      if (nearOutput !== undefined) {
        findings.push({
          severity: 'medium',
          title: `${signalName}: gate-level race/hazard window`,
          detail: `Gate inputs ${(inputA.name || inputA.id)} and ${(inputB?.name || inputB?.id)} transition nearly together around ticks ${inputTickA} and ${nearInputB}, and the output reacts at tick ${nearOutput}. Review logic skew and reconvergent fan-in hazards.`,
          signalNames: [signalName, inputA.name || inputA.id || '', inputB?.name || inputB?.id || ''].filter(Boolean),
          startTick: Math.min(inputTickA, nearInputB, nearOutput),
          endTick: Math.max(inputTickA, nearInputB, nearOutput),
          relatedTicks: [inputTickA, nearInputB, nearOutput],
        });
      }
    }
  }

  const severityRank: Record<HazardFinding['severity'], number> = { high: 0, medium: 1, low: 2 };
  findings.sort((left, right) => severityRank[left.severity] - severityRank[right.severity] || left.title.localeCompare(right.title));

  const highCount = findings.filter((finding) => finding.severity === 'high').length;
  const mediumCount = findings.filter((finding) => finding.severity === 'medium').length;
  const lowCount = findings.filter((finding) => finding.severity === 'low').length;

  const summaryLines = [
    '### Deterministic Hazard Scan',
    `Signals scanned: ${visibleSignals.length}`,
    `Findings: ${findings.length} total (${highCount} high, ${mediumCount} medium, ${lowCount} low)`,
  ];

  if (findings.length === 0) {
    summaryLines.push('No obvious glitch, narrow-pulse, or setup/hold-adjacent transitions were detected in the sampled waveform data.');
  } else {
    summaryLines.push('');
    findings.slice(0, 12).forEach((finding) => {
      summaryLines.push(`- [${formatSeverityBadge(finding.severity)}] ${finding.title}: ${finding.detail}`);
    });
    if (findings.length > 12) {
      summaryLines.push(`- Additional findings omitted from summary: ${findings.length - 12}`);
    }
  }

  return {
    findings,
    markdown: summaryLines.join('\n'),
  };
}
