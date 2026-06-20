import { Signal, SignalType, SimulationState } from './types';

export interface WorkspaceDocument {
  version: number;
  app: string;
  activePresetId?: string;
  simulation: Pick<SimulationState, 'length' | 'timeUnit' | 'tickDuration' | 'zoom' | 'cursorA' | 'cursorB'>;
  signals: Signal[];
}

const TIME_UNITS = new Set(['ns', 'us', 'ms', 's']);
const SIGNAL_TYPES = new Set(['wire', 'bus', 'clock', 'gate', 'decoder']);
const SIGNAL_COLORS = ['#00e5ff', '#4edea3', '#ffb95f', '#a78bfa', '#f87171', '#60a5fa', '#facc15'];
const MAX_VCD_TICKS = 5000;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeNumericValue(value: unknown): number | string {
  if (typeof value === 'number' || typeof value === 'string') {
    return value;
  }
  return 0;
}

function normalizeSignal(signal: unknown, length: number, index: number): Signal {
  if (!isObject(signal)) {
    throw new Error(`Signal ${index + 1} is not a valid object.`);
  }

  const type: SignalType = typeof signal.type === 'string' && SIGNAL_TYPES.has(signal.type)
    ? signal.type as SignalType
    : 'wire';

  const rawValues = Array.isArray(signal.values) ? signal.values.map(normalizeNumericValue) : [];
  const values = Array.from({ length }, (_, valueIndex) => rawValues[valueIndex] ?? 0);

  return {
    id: typeof signal.id === 'string' && signal.id.trim() ? signal.id : `sig_${index + 1}`,
    name: typeof signal.name === 'string' && signal.name.trim() ? signal.name : `SIGNAL_${index + 1}`,
    type,
    color: typeof signal.color === 'string' && signal.color.trim() ? signal.color : SIGNAL_COLORS[index % SIGNAL_COLORS.length],
    visible: typeof signal.visible === 'boolean' ? signal.visible : true,
    pinned: typeof signal.pinned === 'boolean' ? signal.pinned : false,
    values,
    config: isObject(signal.config) ? signal.config as Signal['config'] : undefined,
    format: signal.format === 'hex' || signal.format === 'dec' || signal.format === 'bin' || signal.format === 'ascii'
      ? signal.format
      : undefined,
  };
}

function parseJsonWorkspace(source: string): WorkspaceDocument {
  let parsed: unknown;

  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error('The selected workspace file is not valid JSON.');
  }

  if (!isObject(parsed)) {
    throw new Error('The selected workspace file must contain a JSON object.');
  }

  const simulationNode = isObject(parsed.simulation) ? parsed.simulation : parsed;
  const rawLength = typeof simulationNode.length === 'number'
    ? simulationNode.length
    : typeof parsed.simulationLength === 'number'
      ? parsed.simulationLength
      : 200;
  const length = Math.max(1, Math.min(5000, Math.floor(rawLength)));
  const timeUnit = typeof simulationNode.timeUnit === 'string' && TIME_UNITS.has(simulationNode.timeUnit)
    ? simulationNode.timeUnit as SimulationState['timeUnit']
    : 'ns';
  const tickDuration = typeof simulationNode.tickDuration === 'number' && Number.isFinite(simulationNode.tickDuration)
    ? simulationNode.tickDuration
    : 5;
  const zoom = typeof simulationNode.zoom === 'number' && Number.isFinite(simulationNode.zoom)
    ? Math.min(4, Math.max(0.5, simulationNode.zoom))
    : 1.4;
  const cursorA = typeof simulationNode.cursorA === 'number' ? simulationNode.cursorA : null;
  const cursorB = typeof simulationNode.cursorB === 'number' ? simulationNode.cursorB : null;

  if (!Array.isArray(parsed.signals) || parsed.signals.length === 0) {
    throw new Error('The selected workspace file does not include any signals.');
  }

  return {
    version: typeof parsed.version === 'number' ? parsed.version : 1,
    app: typeof parsed.app === 'string' ? parsed.app : 'Signal Logic Pro',
    activePresetId: typeof parsed.activePresetId === 'string' ? parsed.activePresetId : 'custom',
    simulation: {
      length,
      timeUnit,
      tickDuration,
      zoom,
      cursorA,
      cursorB,
    },
    signals: parsed.signals.map((signal, index) => normalizeSignal(signal, length, index)),
  };
}

function normalizeVcdScalar(value: string): number {
  if (value === '1') return 1;
  if (value === 'z' || value === 'Z' || value === 'x' || value === 'X') return -1;
  return 0;
}

function parseTimescale(rawValue: string): Pick<SimulationState, 'tickDuration' | 'timeUnit'> {
  const match = rawValue.trim().match(/^([0-9]*\.?[0-9]+)\s*(fs|ps|ns|us|ms|s)$/i);
  if (!match) {
    return { tickDuration: 1, timeUnit: 'ns' };
  }

  let tickDuration = Number(match[1]);
  let unit = match[2].toLowerCase();

  if (unit === 'fs') {
    tickDuration /= 1_000_000;
    unit = 'ns';
  } else if (unit === 'ps') {
    tickDuration /= 1_000;
    unit = 'ns';
  }

  const timeUnit = TIME_UNITS.has(unit) ? unit as SimulationState['timeUnit'] : 'ns';
  return { tickDuration, timeUnit };
}

function parseVcdWorkspace(source: string): WorkspaceDocument {
  const lines = source.split(/\r?\n/);
  const signalDefs = new Map<string, { id: string; name: string; type: SignalType; width: number }>();
  const valueChanges = new Map<number, Map<string, number | string>>();
  const observedTimes = new Set<number>();
  let currentTime = 0;
  let maxTime = 0;
  let tickDuration = 1;
  let timeUnit: SimulationState['timeUnit'] = 'ns';

  const registerChange = (time: number, signalId: string, value: number | string) => {
    const bucket = valueChanges.get(time) ?? new Map<string, number | string>();
    bucket.set(signalId, value);
    valueChanges.set(time, bucket);
    observedTimes.add(time);
    maxTime = Math.max(maxTime, time);
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('$timescale')) {
      const timescaleMatch = line.match(/^\$timescale\s+(.+?)\s+\$end$/);
      if (timescaleMatch) {
        const parsedTimescale = parseTimescale(timescaleMatch[1]);
        tickDuration = parsedTimescale.tickDuration;
        timeUnit = parsedTimescale.timeUnit;
      }
      continue;
    }

    if (line.startsWith('$var')) {
      const varMatch = line.match(/^\$var\s+(\S+)\s+(\d+)\s+(\S+)\s+(.+?)\s+\$end$/);
      if (varMatch) {
        const width = Number(varMatch[2]);
        const id = varMatch[3];
        const name = varMatch[4].trim();
        signalDefs.set(id, {
          id,
          name,
          width,
          type: width > 1 ? 'bus' : 'wire',
        });
      }
      continue;
    }

    if (line.startsWith('#')) {
      const nextTime = Number(line.slice(1));
      if (Number.isFinite(nextTime) && nextTime >= 0) {
        currentTime = nextTime;
        observedTimes.add(currentTime);
        maxTime = Math.max(maxTime, currentTime);
      }
      continue;
    }

    const scalarMatch = line.match(/^([01xXzZ])(\S+)$/);
    if (scalarMatch) {
      registerChange(currentTime, scalarMatch[2], normalizeVcdScalar(scalarMatch[1]));
      continue;
    }

    const busMatch = line.match(/^b([01xXzZ]+)\s+(\S+)$/);
    if (busMatch) {
      registerChange(currentTime, busMatch[2], busMatch[1].toUpperCase());
    }
  }

  if (signalDefs.size === 0) {
    throw new Error('The selected VCD file does not declare any signals.');
  }

  observedTimes.add(0);
  const sortedTimes = Array.from(observedTimes).sort((left, right) => left - right);
  const length = maxTime <= MAX_VCD_TICKS
    ? Math.max(1, Math.floor(maxTime) + 1)
    : Math.max(1, Math.min(MAX_VCD_TICKS, sortedTimes.length));
  const timeToTick = new Map<number, number>();

  if (maxTime <= MAX_VCD_TICKS) {
    for (let tick = 0; tick < length; tick++) {
      timeToTick.set(tick, tick);
    }
  } else if (sortedTimes.length === 1) {
    timeToTick.set(sortedTimes[0], 0);
  } else {
    for (let index = 0; index < sortedTimes.length; index++) {
      const normalizedTick = Math.round((index / (sortedTimes.length - 1)) * (length - 1));
      timeToTick.set(sortedTimes[index], normalizedTick);
    }
  }

  const changesByTick = new Map<number, Map<string, number | string>>();
  for (const [time, changes] of valueChanges.entries()) {
    const tick = timeToTick.get(time);
    if (tick === undefined) continue;
    const bucket = changesByTick.get(tick) ?? new Map<string, number | string>();
    for (const [signalId, value] of changes.entries()) {
      bucket.set(signalId, value);
    }
    changesByTick.set(tick, bucket);
  }

  const signals = Array.from(signalDefs.values()).map((definition, index) => {
    const values: (number | string)[] = [];
    let currentValue: number | string = definition.type === 'bus' ? '0' : 0;

    for (let tick = 0; tick < length; tick++) {
      const changes = changesByTick.get(tick);
      if (changes?.has(definition.id)) {
        currentValue = changes.get(definition.id)!;
      }
      values.push(currentValue);
    }

    return {
      id: `vcd_${definition.id}`,
      name: definition.name,
      type: definition.type,
      color: SIGNAL_COLORS[index % SIGNAL_COLORS.length],
      visible: true,
      pinned: index < 2,
      values,
      format: definition.type === 'bus' ? 'hex' : undefined,
    } satisfies Signal;
  });

  return {
    version: 1,
    app: 'Signal Logic Pro',
    activePresetId: 'custom',
    simulation: {
      length,
      timeUnit,
      tickDuration,
      zoom: 1.4,
      cursorA: null,
      cursorB: null,
    },
    signals,
  };
}

export function parseImportedWaveform(source: string, fileName = ''): WorkspaceDocument {
  const normalizedName = fileName.toLowerCase();
  const trimmed = source.trimStart();

  if (normalizedName.endsWith('.vcd') || trimmed.startsWith('$date') || trimmed.includes('$enddefinitions')) {
    return parseVcdWorkspace(source);
  }

  return parseJsonWorkspace(source);
}
