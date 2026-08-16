import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export type VhdlQualityDatasetSplit =
  | 'train'
  | 'validation'
  | 'test'
  | 'holdout';

export type VhdlQualityTrainingProfile = 'quality_v1' | 'quality_v2_repair_augmented';

export type VhdlQualityTrainingConfig = {
  profile: VhdlQualityTrainingProfile;
  epochs: number;
  iters: number;
  batchSize: number;
  gradAccumulationSteps: number;
  effectiveBatchSize: number;
  maxSeqLength: number;
  learningRate: number;
  minimumLearningRate: number;
  warmupIterations: number;
  numLayers: number;
  maskPrompt: boolean;
  gradCheckpoint: boolean;
  optimizer: 'adamw';
  optimizerConfig: {
    betas: [number, number];
    eps: number;
    weightDecay: number;
    biasCorrection: boolean;
  };
  loraParameters: {
    rank: number;
    scale: number;
    dropout: number;
  };
  seed: number;
  stepsPerReport: number;
  stepsPerEval: number;
  saveEvery: number;
  valBatches: number;
  testBatches: number;
  trainCount: number;
};

export type VhdlTrainingEarlyStoppingPolicy = {
  enabled: boolean;
  metric: 'validation_loss';
  mode: 'min';
  minimumValidationEvents: number;
  patienceValidationEvents: number;
  minimumAbsoluteImprovement: number;
  minimumRelativeImprovement: number;
  hardRegressionRelativeThreshold: number | null;
  stopOnNonFiniteMetric: boolean;
  preserveAllCheckpoints: boolean;
  materializeBestAdapterAfterStop: boolean;
};

export type VhdlTrainingValidationEvent = {
  iteration: number;
  validationLoss: number;
  observedAt: string;
  source: 'mlx_log';
  checkpointPath: string | null;
  checkpointIteration: number | null;
  isFinite: boolean;
  isImprovement: boolean;
  improvementAbsolute: number | null;
  improvementRelative: number | null;
  consecutiveNonImprovingEvents: number;
  decision:
    | 'INITIAL'
    | 'IMPROVED'
    | 'NO_SIGNIFICANT_IMPROVEMENT'
    | 'REGRESSION'
    | 'HARD_REGRESSION'
    | 'NON_FINITE'
    | 'STOP_REQUESTED';
};

export type VhdlTrainingCheckpointArtifact = {
  iteration: number | null;
  path: string;
  fileName: string;
  sizeBytes: number;
  sha256: string;
  kind: 'INTERMEDIATE' | 'FINAL';
  discoveredAt: string;
  valid: boolean;
  validationIssues: string[];
};

export type VhdlTrainingCheckpointCatalog = {
  schemaVersion: number;
  trainingRunId: string;
  generatedAt: string;
  checkpoints: VhdlTrainingCheckpointArtifact[];
  validationEvents: VhdlTrainingValidationEvent[];
  currentBest: {
    bestValidationIteration: number | null;
    bestValidationLoss: number | null;
    selectedCheckpointIteration: number | null;
    selectedCheckpointPath: string | null;
    selectionReason: string | null;
  };
  earlyStopping: {
    enabled: boolean;
    stopRequested: boolean;
    stopReason: 'VALIDATION_PATIENCE_EXHAUSTED' | 'HARD_VALIDATION_REGRESSION' | 'NON_FINITE_VALIDATION_METRIC' | null;
    stoppedAtIteration: number | null;
    policy: VhdlTrainingEarlyStoppingPolicy;
  };
};

export type VhdlDatasetDeduplicationResult<T> = {
  records: T[];
  removedCount: number;
  duplicateGroups: number;
  evaluationOnlyConflicts: number;
  sourceContentHashMismatchCount: number;
};

export type VhdlQualityDatasetReport = {
  schemaVersion: 1;
  generatedAt: string;
  totalRecords: number;
  recordTypes: Record<string, number>;
  categories: Record<string, number>;
  verificationStrengths: Record<string, number>;
  failureCodes: Record<string, number>;
  repairAugmentedRecords: number;
  selfContainedRecords: number;
  antiPatternRecords: number;
  testbenchDerivedRecords: number;
  evaluationOnlyRecords: number;
  highValueFailureCoverage: Record<string, number>;
  recommendations: string[];
};

export type VhdlMlxValidationMetric = {
  iteration: number;
  validationLoss: number;
};

export type VhdlMlxTrainingMetrics = {
  validation: VhdlMlxValidationMetric[];
  train: Array<{
    iteration: number;
    trainLoss: number;
    iterationsPerSecond: number | null;
    tokensPerSecond: number | null;
    trainedTokens: number | null;
  }>;
  bestValidation: VhdlMlxValidationMetric | null;
  finalTrainLoss: number | null;
  testLoss: number | null;
  testPpl: number | null;
  trainableParameterPercent: number | null;
  trainableParameterMillions: number | null;
  totalParameterMillions: number | null;
  peakMemoryGb: number | null;
  truncationWarningCount: number;
};

export type VhdlMlxAdapterSelection = {
  selectedSourcePath: string;
  selectedCheckpointIteration: number | null;
  selectedCheckpointValidationLoss: number | null;
  bestValidationIteration: number | null;
  bestValidationLoss: number | null;
  selectionReason:
    | 'minimum_validation_loss_exact_checkpoint'
    | 'minimum_validation_loss_closest_lower_checkpoint'
    | 'minimum_validation_loss_closest_checkpoint'
    | 'final_adapter_fallback';
};

type RecordLike = Record<string, any>;

export const DEFAULT_VHDL_TRAINING_EARLY_STOPPING_POLICY: VhdlTrainingEarlyStoppingPolicy = Object.freeze({
  enabled: true,
  metric: 'validation_loss',
  mode: 'min',
  minimumValidationEvents: 4,
  patienceValidationEvents: 3,
  minimumAbsoluteImprovement: 1e-4,
  minimumRelativeImprovement: 0.005,
  hardRegressionRelativeThreshold: 0.25,
  stopOnNonFiniteMetric: true,
  preserveAllCheckpoints: true,
  materializeBestAdapterAfterStop: true,
});

const earlyStoppingPolicyKeys = new Set<keyof VhdlTrainingEarlyStoppingPolicy>([
  'enabled',
  'metric',
  'mode',
  'minimumValidationEvents',
  'patienceValidationEvents',
  'minimumAbsoluteImprovement',
  'minimumRelativeImprovement',
  'hardRegressionRelativeThreshold',
  'stopOnNonFiniteMetric',
  'preserveAllCheckpoints',
  'materializeBestAdapterAfterStop',
]);

function finitePolicyNumber(value: unknown, key: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Invalid early-stopping policy ${key}: expected a finite number.`);
  return number;
}

function policyInteger(value: unknown, key: string) {
  const number = finitePolicyNumber(value, key);
  if (!Number.isInteger(number) || number < 1) throw new Error(`Invalid early-stopping policy ${key}: expected integer >= 1.`);
  return number;
}

function policyNonNegativeNumber(value: unknown, key: string) {
  const number = finitePolicyNumber(value, key);
  if (number < 0) throw new Error(`Invalid early-stopping policy ${key}: expected number >= 0.`);
  return number;
}

export function resolveVhdlTrainingEarlyStoppingPolicy(requested: unknown = {}): VhdlTrainingEarlyStoppingPolicy {
  const raw = requested && typeof requested === 'object' && !Array.isArray(requested)
    ? requested as Record<string, unknown>
    : {};
  const unknown = Object.keys(raw).filter((key) => !earlyStoppingPolicyKeys.has(key as keyof VhdlTrainingEarlyStoppingPolicy));
  if (unknown.length) throw new Error(`Unsupported early-stopping policy field(s): ${unknown.join(', ')}.`);
  const merged = { ...DEFAULT_VHDL_TRAINING_EARLY_STOPPING_POLICY, ...raw };
  if (typeof merged.enabled !== 'boolean') throw new Error('Invalid early-stopping policy enabled: expected boolean.');
  if (merged.metric !== 'validation_loss') throw new Error(`Unsupported early-stopping metric ${String(merged.metric)}.`);
  if (merged.mode !== 'min') throw new Error(`Unsupported early-stopping mode ${String(merged.mode)}.`);
  if (typeof merged.stopOnNonFiniteMetric !== 'boolean') throw new Error('Invalid early-stopping policy stopOnNonFiniteMetric: expected boolean.');
  if (typeof merged.preserveAllCheckpoints !== 'boolean') throw new Error('Invalid early-stopping policy preserveAllCheckpoints: expected boolean.');
  if (typeof merged.materializeBestAdapterAfterStop !== 'boolean') throw new Error('Invalid early-stopping policy materializeBestAdapterAfterStop: expected boolean.');
  const hardRegressionRelativeThreshold = merged.hardRegressionRelativeThreshold == null
    ? null
    : finitePolicyNumber(merged.hardRegressionRelativeThreshold, 'hardRegressionRelativeThreshold');
  if (hardRegressionRelativeThreshold !== null && hardRegressionRelativeThreshold <= 0) {
    throw new Error('Invalid early-stopping policy hardRegressionRelativeThreshold: expected null or number > 0.');
  }
  return {
    enabled: merged.enabled,
    metric: 'validation_loss',
    mode: 'min',
    minimumValidationEvents: policyInteger(merged.minimumValidationEvents, 'minimumValidationEvents'),
    patienceValidationEvents: policyInteger(merged.patienceValidationEvents, 'patienceValidationEvents'),
    minimumAbsoluteImprovement: policyNonNegativeNumber(merged.minimumAbsoluteImprovement, 'minimumAbsoluteImprovement'),
    minimumRelativeImprovement: policyNonNegativeNumber(merged.minimumRelativeImprovement, 'minimumRelativeImprovement'),
    hardRegressionRelativeThreshold,
    stopOnNonFiniteMetric: merged.stopOnNonFiniteMetric,
    preserveAllCheckpoints: merged.preserveAllCheckpoints,
    materializeBestAdapterAfterStop: merged.materializeBestAdapterAfterStop,
  };
}

export function splitVhdlTrainingRequestedConfig(config: Record<string, unknown> = {}) {
  const requestedEarlyStoppingPolicy = Object.prototype.hasOwnProperty.call(config, 'earlyStoppingPolicy')
    ? config.earlyStoppingPolicy
    : {};
  const qualityConfig = { ...config };
  delete qualityConfig.earlyStoppingPolicy;
  return { qualityConfig, requestedEarlyStoppingPolicy };
}

export function evaluateValidationImprovement(params: {
  bestLoss: number;
  candidateLoss: number;
  policy: VhdlTrainingEarlyStoppingPolicy;
}) {
  const absoluteImprovement = params.bestLoss - params.candidateLoss;
  const relativeImprovement = params.bestLoss === 0
    ? absoluteImprovement > 0
      ? Number.POSITIVE_INFINITY
      : 0
    : absoluteImprovement / Math.abs(params.bestLoss);
  const passesAbsolute = absoluteImprovement >= params.policy.minimumAbsoluteImprovement;
  const passesRelative = relativeImprovement >= params.policy.minimumRelativeImprovement;
  return {
    improved: absoluteImprovement > 0 && (passesAbsolute || passesRelative),
    absoluteImprovement,
    relativeImprovement,
  };
}

export function normalizeVhdlContentForHash(content: string): string {
  return content.replace(/\r\n?/g, '\n').split('\n').map((line) => line.replace(/[ \t]+$/g, '')).join('\n').replace(/\n*$/, '\n');
}

function sha256Bytes(content: string | Buffer) {
  return createHash('sha256').update(content).digest('hex');
}

async function hashFile(filePath: string) {
  return sha256Bytes(await fs.readFile(filePath));
}

const mlxValidationLineRegex = /Iter\s+(\d+)\s*:\s*Val(?:idation)?\s+loss\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|nan|inf|-inf|infinity|-infinity)/i;
const mlxTrainLineRegex = /Iter\s+(\d+)\s*:\s*Train\s+loss\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|nan|inf|-inf|infinity|-infinity)/i;
const mlxProgressLineRegex = /(Calculating\s+loss|Training|Validating|Testing)\.{0,3}\s*:\s*(\d+)it(?:\s*\[([^\]]+)\])?/i;

function parseMlxNumber(raw: string) {
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'nan') return Number.NaN;
  if (normalized === 'inf' || normalized === 'infinity') return Number.POSITIVE_INFINITY;
  if (normalized === '-inf' || normalized === '-infinity') return Number.NEGATIVE_INFINITY;
  return Number(raw);
}

export function parseMlxValidationMetricLine(line: string): VhdlMlxValidationMetric | null {
  const match = mlxValidationLineRegex.exec(line);
  if (!match) return null;
  const iteration = Number(match[1]);
  const validationLoss = parseMlxNumber(match[2]);
  if (!Number.isFinite(iteration)) return null;
  return { iteration, validationLoss };
}

export function parseMlxTrainMetricLine(line: string): {
  iteration: number;
  trainLoss: number;
  iterationsPerSecond: number | null;
  tokensPerSecond: number | null;
  trainedTokens: number | null;
} | null {
  const match = mlxTrainLineRegex.exec(line);
  if (!match) return null;
  const iteration = Number(match[1]);
  const trainLoss = parseMlxNumber(match[2]);
  if (!Number.isFinite(iteration) || !Number.isFinite(trainLoss)) return null;
  const iterationsPerSecondMatch = /It\/sec\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)/i.exec(line);
  const tokensPerSecondMatch = /Tokens\/sec\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)/i.exec(line);
  const trainedTokensMatch = /Trained\s+Tokens\s+(\d+)/i.exec(line);
  const iterationsPerSecond = iterationsPerSecondMatch ? Number(iterationsPerSecondMatch[1]) : null;
  const tokensPerSecond = tokensPerSecondMatch ? Number(tokensPerSecondMatch[1]) : null;
  const trainedTokens = trainedTokensMatch ? Number(trainedTokensMatch[1]) : null;
  return {
    iteration,
    trainLoss,
    iterationsPerSecond: Number.isFinite(iterationsPerSecond) ? iterationsPerSecond : null,
    tokensPerSecond: Number.isFinite(tokensPerSecond) ? tokensPerSecond : null,
    trainedTokens: Number.isFinite(trainedTokens) ? trainedTokens : null,
  };
}

export function parseMlxProgressLine(line: string): { phase: string; count: number; detail: string | null } | null {
  const match = mlxProgressLineRegex.exec(line);
  if (!match) return null;
  const count = Number(match[2]);
  if (!Number.isFinite(count)) return null;
  return {
    phase: match[1].trim().replace(/\s+/g, ' ').toLowerCase(),
    count,
    detail: match[3]?.trim() || null,
  };
}

function associateCheckpointForIteration(iteration: number, checkpoints: VhdlTrainingCheckpointArtifact[]) {
  const validNumbered = checkpoints
    .filter((checkpoint) => checkpoint.valid && checkpoint.kind === 'INTERMEDIATE' && checkpoint.iteration !== null)
    .sort((left, right) => Number(left.iteration) - Number(right.iteration) || left.fileName.localeCompare(right.fileName));
  const exact = validNumbered.find((checkpoint) => checkpoint.iteration === iteration);
  if (exact) return exact;
  const lower = [...validNumbered].reverse().find((checkpoint) => Number(checkpoint.iteration) <= iteration);
  if (lower) return lower;
  return [...validNumbered].sort((left, right) => (
    Math.abs(Number(left.iteration) - iteration) - Math.abs(Number(right.iteration) - iteration)
      || Number(left.iteration) - Number(right.iteration)
      || left.fileName.localeCompare(right.fileName)
  ))[0] || null;
}

export function buildVhdlTrainingValidationEvents(params: {
  metrics: VhdlMlxValidationMetric[];
  policy: VhdlTrainingEarlyStoppingPolicy;
  checkpoints?: VhdlTrainingCheckpointArtifact[];
  observedAt?: string;
}): VhdlTrainingValidationEvent[] {
  const checkpoints = params.checkpoints || [];
  const observedAt = params.observedAt || new Date(0).toISOString();
  const events: VhdlTrainingValidationEvent[] = [];
  let bestLoss: number | null = null;
  let consecutiveNonImprovingEvents = 0;
  const seen = new Set<string>();
  for (const metric of params.metrics) {
    const key = `${metric.iteration}:${String(metric.validationLoss)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const associated = associateCheckpointForIteration(metric.iteration, checkpoints);
    const finite = Number.isFinite(metric.validationLoss);
    const isTrainedEvent = metric.iteration > 1;
    let improvementAbsolute: number | null = null;
    let improvementRelative: number | null = null;
    let isImprovement = false;
    let decision: VhdlTrainingValidationEvent['decision'] = 'NO_SIGNIFICANT_IMPROVEMENT';
    if (!finite) {
      decision = 'NON_FINITE';
      consecutiveNonImprovingEvents += params.policy.stopOnNonFiniteMetric ? params.policy.patienceValidationEvents : 1;
    } else if (!isTrainedEvent) {
      decision = 'NO_SIGNIFICANT_IMPROVEMENT';
    } else if (bestLoss === null) {
      bestLoss = metric.validationLoss;
      isImprovement = true;
      decision = 'INITIAL';
      consecutiveNonImprovingEvents = 0;
    } else {
      const improvement = evaluateValidationImprovement({
        bestLoss,
        candidateLoss: metric.validationLoss,
        policy: params.policy,
      });
      improvementAbsolute = improvement.absoluteImprovement;
      improvementRelative = improvement.relativeImprovement;
      if (improvement.improved) {
        bestLoss = metric.validationLoss;
        isImprovement = true;
        decision = 'IMPROVED';
        consecutiveNonImprovingEvents = 0;
      } else {
        consecutiveNonImprovingEvents += 1;
        const regressionRelative = bestLoss === 0
          ? Number.POSITIVE_INFINITY
          : (metric.validationLoss - bestLoss) / Math.abs(bestLoss);
        decision = params.policy.hardRegressionRelativeThreshold !== null
          && regressionRelative >= params.policy.hardRegressionRelativeThreshold
          ? 'HARD_REGRESSION'
          : metric.validationLoss > bestLoss
            ? 'REGRESSION'
            : 'NO_SIGNIFICANT_IMPROVEMENT';
      }
    }
    events.push({
      iteration: metric.iteration,
      validationLoss: metric.validationLoss,
      observedAt,
      source: 'mlx_log',
      checkpointPath: associated?.path || null,
      checkpointIteration: associated?.iteration ?? null,
      isFinite: finite,
      isImprovement,
      improvementAbsolute,
      improvementRelative,
      consecutiveNonImprovingEvents,
      decision,
    });
  }
  return events;
}

export function evaluateVhdlTrainingEarlyStopping(params: {
  events: VhdlTrainingValidationEvent[];
  policy: VhdlTrainingEarlyStoppingPolicy;
}) {
  if (!params.policy.enabled) {
    return { stopRequested: false, stopReason: null as null, stoppedAtIteration: null as number | null };
  }
  const trainedEvents = params.events.filter((event) => event.iteration > 1);
  const latest = trainedEvents[trainedEvents.length - 1] || null;
  if (!latest) return { stopRequested: false, stopReason: null as null, stoppedAtIteration: null as number | null };
  if (!latest.isFinite && params.policy.stopOnNonFiniteMetric) {
    return { stopRequested: true, stopReason: 'NON_FINITE_VALIDATION_METRIC' as const, stoppedAtIteration: latest.iteration };
  }
  if (latest.decision === 'HARD_REGRESSION') {
    return { stopRequested: true, stopReason: 'HARD_VALIDATION_REGRESSION' as const, stoppedAtIteration: latest.iteration };
  }
  if (trainedEvents.length >= params.policy.minimumValidationEvents
    && latest.consecutiveNonImprovingEvents >= params.policy.patienceValidationEvents) {
    return { stopRequested: true, stopReason: 'VALIDATION_PATIENCE_EXHAUSTED' as const, stoppedAtIteration: latest.iteration };
  }
  return { stopRequested: false, stopReason: null as null, stoppedAtIteration: null as number | null };
}

function verificationScore(record: RecordLike) {
  if (record.evaluationOnly) return 10_000;
  if (record.recordType === 'failed_rtl_to_repaired_rtl' && record.verificationStrength === 'ghdl_simulation') return 950;
  if (record.recordType === 'contract_to_accepted_rtl' && record.verificationStrength === 'ghdl_simulation') return 900;
  const metadata = `${JSON.stringify(record.verification || '')}\n${JSON.stringify(record.maturity || '')}\n${String(record.verificationStrength || '')}`;
  if (/ghdl[_ -]?simulation|simulation/i.test(metadata)) return 800;
  if (/ghdl|analy[sz]e|static|smoke|verified/i.test(metadata)) return 700;
  if (record.recordType === 'contract_to_accepted_rtl') return 600;
  return 100;
}

export function deduplicateVhdlTrainingRecords<T extends Record<string, any>>(
  records: T[],
  sha256Fn: (value: string) => string,
): VhdlDatasetDeduplicationResult<T> {
  const groups = new Map<string, T[]>();
  let sourceContentHashMismatchCount = 0;
  for (const record of records) {
    const sourceContentHash = record.sourceContentHash != null
      ? String(record.sourceContentHash)
      : record.contentHash != null
        ? String(record.contentHash)
        : null;
    const contentHash = sha256Fn(normalizeVhdlContentForHash(String(record.completion || '')));
    if (sourceContentHash !== null && sourceContentHash !== contentHash) sourceContentHashMismatchCount += 1;
    const next = { ...record, sourceContentHash, contentHash } as T;
    const deduplicationKey = record.deduplicationKey
      ? String(record.deduplicationKey)
      : contentHash;
    const group = groups.get(deduplicationKey) || [];
    group.push(next);
    groups.set(deduplicationKey, group);
  }
  const selected: T[] = [];
  let duplicateGroups = 0;
  let evaluationOnlyConflicts = 0;
  for (const group of groups.values()) {
    if (group.length > 1) duplicateGroups += 1;
    if (group.some((record) => record.evaluationOnly) && group.some((record) => !record.evaluationOnly)) evaluationOnlyConflicts += 1;
    selected.push([...group].sort((left, right) => {
      if (Boolean(left.evaluationOnly) !== Boolean(right.evaluationOnly)) return left.evaluationOnly ? -1 : 1;
      const scoreDelta = verificationScore(right) - verificationScore(left);
      if (scoreDelta) return scoreDelta;
      return String(left.id || '').localeCompare(String(right.id || ''));
    })[0]);
  }
  selected.sort((left, right) => String(left.id || '').localeCompare(String(right.id || '')));
  return {
    records: selected,
    removedCount: records.length - selected.length,
    duplicateGroups,
    evaluationOnlyConflicts,
    sourceContentHashMismatchCount,
  };
}

export function assignVhdlQualityDatasetSplit(record: RecordLike, sha256Fn: (value: string) => string): VhdlQualityDatasetSplit {
  if (record.evaluationOnly) return 'holdout';
  const splitGroupKey = record.contractHash || record.contentHash || record.blockName || record.id;
  const bucket = parseInt(sha256Fn(String(splitGroupKey)).slice(0, 8), 16) % 10000;
  if (bucket < 8000) return 'train';
  if (bucket < 9000) return 'validation';
  if (bucket < 9500) return 'test';
  return 'holdout';
}

export function categoryForVhdlTrainingRecord(record: RecordLike) {
  return String(record.category || record.taskFamily || record.prompt?.blockSpec?.category || 'uncategorized');
}

function incrementCounter(target: Record<string, number>, key: unknown) {
  const normalized = String(key || 'unknown').trim() || 'unknown';
  target[normalized] = (target[normalized] || 0) + 1;
}

export function buildVhdlQualityDatasetReport(records: RecordLike[], generatedAt = new Date().toISOString()): VhdlQualityDatasetReport {
  const report: VhdlQualityDatasetReport = {
    schemaVersion: 1,
    generatedAt,
    totalRecords: records.length,
    recordTypes: {},
    categories: {},
    verificationStrengths: {},
    failureCodes: {},
    repairAugmentedRecords: 0,
    selfContainedRecords: 0,
    antiPatternRecords: 0,
    testbenchDerivedRecords: 0,
    evaluationOnlyRecords: 0,
    highValueFailureCoverage: {},
    recommendations: [],
  };
  for (const record of records) {
    incrementCounter(report.recordTypes, record.recordType);
    incrementCounter(report.categories, categoryForVhdlTrainingRecord(record));
    incrementCounter(report.verificationStrengths, record.verificationStrength || record.verification?.strength || 'unknown');
    if (record.evaluationOnly) report.evaluationOnlyRecords += 1;
    if (/repair|failure/i.test(String(record.recordType || ''))) report.repairAugmentedRecords += 1;
    if (/self_contained/i.test(String(record.recordType || record.prompt?.dependencyPolicy || ''))) report.selfContainedRecords += 1;
    if (/anti_pattern/i.test(String(record.recordType || ''))) report.antiPatternRecords += 1;
    if (/testbench/i.test(String(record.recordType || ''))) report.testbenchDerivedRecords += 1;
    const failureCode = record.failureCode || record.failure?.failureCode || record.prompt?.failurePacket?.failureCode;
    if (failureCode) {
      incrementCounter(report.failureCodes, failureCode);
      incrementCounter(report.highValueFailureCoverage, failureCode);
    }
  }
  if (report.repairAugmentedRecords < Math.max(20, Math.ceil(records.length * 0.1))) {
    report.recommendations.push('Add more verified failed-RTL-to-repaired-RTL examples; target at least 10% repair-augmented records.');
  }
  if (!report.highValueFailureCoverage.video_pixel_address_bound_check) {
    report.recommendations.push('Add video pixel-address bound-check repair examples if available.');
  }
  if (!report.highValueFailureCoverage.missing_work_unit_dependency) {
    report.recommendations.push('Add single-file missing work-unit dependency repair examples if available.');
  }
  if (Object.keys(report.categories).length < 8) {
    report.recommendations.push('Broaden category coverage before production adapter promotion.');
  }
  return report;
}

export function auditVhdlQualitySplitOverlaps(splits: Record<VhdlQualityDatasetSplit, RecordLike[]>) {
  const hashSet = (split: VhdlQualityDatasetSplit) => new Set(splits[split].map((record) => String(record.contentHash || '')).filter(Boolean));
  const train = hashSet('train');
  const validation = hashSet('validation');
  const test = hashSet('test');
  const holdout = hashSet('holdout');
  const overlap = (left: Set<string>, right: Set<string>) => [...left].filter((value) => right.has(value)).length;
  const coverageFor = (records: RecordLike[]) => records.reduce((acc: Record<string, number>, record) => {
    const category = categoryForVhdlTrainingRecord(record);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  return {
    trainValidationOverlap: overlap(train, validation),
    trainTestOverlap: overlap(train, test),
    trainHoldoutOverlap: overlap(train, holdout),
    validationTestOverlap: overlap(validation, test),
    validationHoldoutOverlap: overlap(validation, holdout),
    testHoldoutOverlap: overlap(test, holdout),
    splitCategoryCoverage: {
      train: coverageFor(splits.train),
      validation: coverageFor(splits.validation),
      test: coverageFor(splits.test),
      holdout: coverageFor(splits.holdout),
    },
  };
}

export function validateVhdlQualityDatasetMinimums(params: {
  total: number;
  trainCount: number;
  validationCount: number;
  testCount: number;
  holdoutCount: number;
  overlapAudit: ReturnType<typeof auditVhdlQualitySplitOverlaps>;
}) {
  const minimumTrain = 100;
  const minimumEvaluationSplit = Math.max(20, Math.ceil(params.total * 0.02));
  const issues: string[] = [];
  if (params.trainCount < minimumTrain) issues.push(`Training split contains ${params.trainCount} records; quality training requires at least ${minimumTrain}.`);
  if (params.validationCount < minimumEvaluationSplit) issues.push(`Validation split contains ${params.validationCount} records; quality training requires at least ${minimumEvaluationSplit}.`);
  if (params.testCount < minimumEvaluationSplit) issues.push(`Test split contains ${params.testCount} records; quality training requires at least ${minimumEvaluationSplit}.`);
  if (params.holdoutCount < minimumEvaluationSplit) issues.push(`Promotion holdout split contains ${params.holdoutCount} records; quality training requires at least ${minimumEvaluationSplit}.`);
  const overlaps = params.overlapAudit;
  for (const [key, value] of Object.entries(overlaps)) {
    if (key.endsWith('Overlap') && Number(value) > 0) issues.push(`Exact VHDL content appears in ${key.replace(/Overlap$/, '').replace(/[A-Z]/g, (match) => ` and ${match.toLowerCase()}`)}.`);
  }
  return { ok: issues.length === 0, qualityGateIssues: issues, minimumTrain, minimumEvaluationSplit };
}

function finiteNumber(value: unknown, key: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Invalid quality_v1 override ${key}: expected a finite number.`);
  return number;
}

function integerOverride(overrides: Record<string, unknown>, key: string, fallback: number, min: number, max: number, allowMinusOne = false) {
  if (!(key in overrides)) return fallback;
  const value = finiteNumber(overrides[key], key);
  if (!Number.isInteger(value) || value < min || value > max || (!allowMinusOne && value < 0)) throw new Error(`Invalid quality_v1 override ${key}: expected integer ${allowMinusOne ? '-1 or ' : ''}${min}-${max}.`);
  return value;
}

function evaluationBatchOverride(overrides: Record<string, unknown>, key: string, fallback: number) {
  if (!(key in overrides)) return fallback;
  const value = finiteNumber(overrides[key], key);
  if (!Number.isInteger(value) || value === 0 || value < -1 || value > 1_000_000) throw new Error(`Invalid quality_v1 override ${key}: expected -1 or integer 1-1000000.`);
  return value;
}

function numberOverride(overrides: Record<string, unknown>, key: string, fallback: number, min: number, max: number) {
  if (!(key in overrides)) return fallback;
  const value = finiteNumber(overrides[key], key);
  if (value < min || value > max) throw new Error(`Invalid quality_v1 override ${key}: expected ${min}-${max}.`);
  return value;
}

export function resolveVhdlQualityTrainingConfig(params: {
  trainCount: number;
  overrides?: Record<string, unknown>;
}): VhdlQualityTrainingConfig {
  const overrides = params.overrides || {};
  const unknown = Object.keys(overrides).filter((key) => !new Set([
    'profile',
    'epochs',
    'batchSize',
    'gradAccumulationSteps',
    'maxSeqLength',
    'learningRate',
    'minimumLearningRate',
    'numLayers',
    'seed',
    'stepsPerReport',
    'stepsPerEval',
    'saveEvery',
    'valBatches',
    'testBatches',
    'loraRank',
    'loraScale',
    'loraDropout',
    'iters',
    'warmupIterations',
  ]).has(key));
  if (unknown.length) throw new Error(`Unsupported quality_v1 override field(s): ${unknown.join(', ')}.`);
  const profile: VhdlQualityTrainingProfile = overrides.profile === 'quality_v2_repair_augmented'
    ? 'quality_v2_repair_augmented'
    : 'quality_v1';
  if (overrides.profile && overrides.profile !== 'quality_v1' && overrides.profile !== 'quality_v2_repair_augmented') throw new Error(`Unsupported training profile ${String(overrides.profile)}.`);
  const trainCount = Math.max(0, Math.floor(Number(params.trainCount || 0)));
  const epochs = integerOverride(overrides, 'epochs', profile === 'quality_v2_repair_augmented' ? 4 : 3, 1, 20);
  const batchSize = integerOverride(overrides, 'batchSize', 1, 1, 32);
  const gradAccumulationSteps = integerOverride(overrides, 'gradAccumulationSteps', 8, 1, 256);
  const maxSeqLength = integerOverride(overrides, 'maxSeqLength', 4096, 512, 32768);
  const learningRate = numberOverride(overrides, 'learningRate', 2e-5, Number.MIN_VALUE, 0.01);
  const minimumLearningRate = numberOverride(overrides, 'minimumLearningRate', 2e-6, 0, learningRate);
  const rawNumLayers = integerOverride(overrides, 'numLayers', -1, -1, 1000, true);
  if (rawNumLayers === 0) throw new Error('Invalid quality_v1 override numLayers: expected -1 or 1-1000.');
  const seed = integerOverride(overrides, 'seed', 42, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
  const iterationsPerEpoch = Math.ceil(trainCount / batchSize);
  const defaultIters = iterationsPerEpoch * epochs;
  const iters = integerOverride(overrides, 'iters', defaultIters, 1, 100_000_000);
  const warmupIterations = integerOverride(overrides, 'warmupIterations', Math.max(10, Math.round(iters * 0.03)), 0, iters);
  const stepsPerEval = integerOverride(overrides, 'stepsPerEval', Math.max(100, Math.ceil(iterationsPerEpoch / 4)), 1, 1_000_000);
  return {
    profile,
    epochs,
    iters,
    batchSize,
    gradAccumulationSteps,
    effectiveBatchSize: batchSize * gradAccumulationSteps,
    maxSeqLength,
    learningRate,
    minimumLearningRate,
    warmupIterations,
    numLayers: rawNumLayers,
    maskPrompt: true,
    gradCheckpoint: true,
    optimizer: 'adamw',
    optimizerConfig: {
      betas: [0.9, 0.95],
      eps: 1e-8,
      weightDecay: 0.01,
      biasCorrection: true,
    },
    loraParameters: {
      rank: integerOverride(overrides, 'loraRank', profile === 'quality_v2_repair_augmented' ? 32 : 16, 1, 256),
      scale: numberOverride(overrides, 'loraScale', 2.0, Number.MIN_VALUE, 100),
      dropout: numberOverride(overrides, 'loraDropout', 0.05, 0, 0.5),
    },
    seed,
    stepsPerReport: integerOverride(overrides, 'stepsPerReport', 10, 1, 100_000),
    stepsPerEval,
    saveEvery: integerOverride(overrides, 'saveEvery', stepsPerEval, 1, 1_000_000),
    valBatches: evaluationBatchOverride(overrides, 'valBatches', -1),
    testBatches: evaluationBatchOverride(overrides, 'testBatches', -1),
    trainCount,
  };
}

function quoteYamlString(value: string) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function yamlNumber(value: number) {
  if (!Number.isFinite(value)) throw new Error('Cannot render a non-finite number in MLX YAML.');
  if (Object.is(value, -0)) return '0';
  return String(value);
}

export function renderMlxLoraConfigYaml(params: {
  model: string;
  dataPath: string;
  adapterPath: string;
  resumeAdapterFile?: string | null;
  config: VhdlQualityTrainingConfig;
}): string {
  const config = params.config;
  return [
    `model: ${quoteYamlString(params.model)}`,
    'train: true',
    'fine_tune_type: lora',
    '',
    `data: ${quoteYamlString(params.dataPath)}`,
    `adapter_path: ${quoteYamlString(params.adapterPath)}`,
    ...(params.resumeAdapterFile ? [`resume_adapter_file: ${quoteYamlString(params.resumeAdapterFile)}`] : []),
    '',
    `seed: ${config.seed}`,
    '',
    'optimizer: adamw',
    'optimizer_config:',
    '  adamw:',
    `    betas: [${config.optimizerConfig.betas[0]}, ${config.optimizerConfig.betas[1]}]`,
    `    eps: ${yamlNumber(config.optimizerConfig.eps)}`,
    `    weight_decay: ${config.optimizerConfig.weightDecay}`,
    `    bias_correction: ${config.optimizerConfig.biasCorrection}`,
    '',
    `num_layers: ${config.numLayers}`,
    '',
    `batch_size: ${config.batchSize}`,
    `grad_accumulation_steps: ${config.gradAccumulationSteps}`,
    '',
    `iters: ${config.iters}`,
    '',
    `learning_rate: ${yamlNumber(config.learningRate)}`,
    '',
    'lr_schedule:',
    '  name: cosine_decay',
    `  warmup: ${config.warmupIterations}`,
    '  warmup_init: 1.0e-7',
    `  arguments: [${yamlNumber(config.learningRate)}, ${config.iters}, ${yamlNumber(config.minimumLearningRate)}]`,
    '',
    `mask_prompt: ${config.maskPrompt}`,
    '',
    `max_seq_length: ${config.maxSeqLength}`,
    `grad_checkpoint: ${config.gradCheckpoint}`,
    '',
    `steps_per_report: ${config.stepsPerReport}`,
    `steps_per_eval: ${config.stepsPerEval}`,
    `save_every: ${config.saveEvery}`,
    '',
    `val_batches: ${config.valBatches}`,
    '',
    'test: false',
    `test_batches: ${config.testBatches}`,
    '',
    'lora_parameters:',
    `  rank: ${config.loraParameters.rank}`,
    `  scale: ${config.loraParameters.scale}`,
    `  dropout: ${config.loraParameters.dropout}`,
    '',
  ].join('\n');
}

export function renderMlxLoraTestConfigYaml(params: {
  model: string;
  dataPath: string;
  adapterPath: string;
  config: VhdlQualityTrainingConfig;
}) {
  return [
    `model: ${quoteYamlString(params.model)}`,
    'train: false',
    'test: true',
    '',
    `data: ${quoteYamlString(params.dataPath)}`,
    `adapter_path: ${quoteYamlString(params.adapterPath)}`,
    '',
    `batch_size: ${params.config.batchSize}`,
    `test_batches: ${params.config.testBatches}`,
    `max_seq_length: ${params.config.maxSeqLength}`,
    '',
  ].join('\n');
}

export function parseMlxTrainingMetrics(logText: string): VhdlMlxTrainingMetrics {
  const validation: VhdlMlxValidationMetric[] = [];
  const lines = logText.split(/\r\n|\n|\r/);
  for (const line of lines) {
    const metric = parseMlxValidationMetricLine(line);
    if (metric) validation.push(metric);
  }
  const trainedValidation = validation.filter((entry) => entry.iteration > 1 && Number.isFinite(entry.validationLoss));
  const bestValidation = trainedValidation.sort((left, right) => left.validationLoss - right.validationLoss || left.iteration - right.iteration)[0] || null;
  const train: Array<{ iteration: number; trainLoss: number }> = [];
  let finalTrainLoss: number | null = null;
  for (const line of lines) {
    const metric = parseMlxTrainMetricLine(line);
    if (metric) {
      train.push(metric);
      finalTrainLoss = metric.trainLoss;
    }
  }
  const testMatch = /Test\s+loss\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)[,\s]+Test\s+ppl\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)/i.exec(logText);
  const paramsMatch = /Trainable\s+parameters:\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))%\s*\(\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))M\s*\/\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))M\s*\)/i.exec(logText);
  let peakMemoryGb: number | null = null;
  for (const match of logText.matchAll(/Peak\s+mem(?:ory)?\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*GB/gi)) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) peakMemoryGb = Math.max(peakMemoryGb || 0, value);
  }
  return {
    validation,
    train,
    bestValidation,
    finalTrainLoss,
    testLoss: testMatch ? Number(testMatch[1]) : null,
    testPpl: testMatch ? Number(testMatch[2]) : null,
    trainableParameterPercent: paramsMatch ? Number(paramsMatch[1]) : null,
    trainableParameterMillions: paramsMatch ? Number(paramsMatch[2]) : null,
    totalParameterMillions: paramsMatch ? Number(paramsMatch[3]) : null,
    peakMemoryGb,
    truncationWarningCount: logText.split(/\r?\n/).filter((line) => /Some sequences are longer than|will be truncated/i.test(line)).length,
  };
}

export async function discoverMlxAdapterCheckpoints(adapterDirectory: string, observedAt = new Date().toISOString()): Promise<VhdlTrainingCheckpointArtifact[]> {
  let files: string[] = [];
  try {
    files = await fs.readdir(adapterDirectory);
  } catch {
    return [];
  }
  const candidates = files
    .map((fileName) => {
      if (fileName === 'adapters.safetensors') return { fileName, iteration: null, kind: 'FINAL' as const };
      const match = /^(\d+)_adapters\.safetensors$/.exec(fileName);
      return match ? { fileName, iteration: Number(match[1]), kind: 'INTERMEDIATE' as const } : null;
    })
    .filter((entry): entry is { fileName: string; iteration: number | null; kind: 'INTERMEDIATE' | 'FINAL' } => Boolean(entry))
    .sort((left, right) => {
      if (left.kind !== right.kind) return left.kind === 'INTERMEDIATE' ? -1 : 1;
      return Number(left.iteration ?? Number.MAX_SAFE_INTEGER) - Number(right.iteration ?? Number.MAX_SAFE_INTEGER)
        || left.fileName.localeCompare(right.fileName);
    });
  const artifacts: VhdlTrainingCheckpointArtifact[] = [];
  for (const candidate of candidates) {
    const filePath = path.join(adapterDirectory, candidate.fileName);
    const validationIssues: string[] = [];
    let sizeBytes = 0;
    let digest = '';
    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) validationIssues.push('checkpoint_not_regular_file');
      sizeBytes = stat.size;
      if (stat.size < 1) validationIssues.push('checkpoint_empty');
      if (stat.isFile() && stat.size > 0) digest = await hashFile(filePath);
    } catch {
      validationIssues.push('checkpoint_missing');
    }
    artifacts.push({
      iteration: candidate.iteration,
      path: filePath,
      fileName: candidate.fileName,
      sizeBytes,
      sha256: digest,
      kind: candidate.kind,
      discoveredAt: observedAt,
      valid: validationIssues.length === 0,
      validationIssues,
    });
  }
  return artifacts;
}

export function selectBestMlxAdapterCandidateFromCatalog(params: {
  checkpoints: VhdlTrainingCheckpointArtifact[];
  validationEvents: VhdlTrainingValidationEvent[];
}): VhdlMlxAdapterSelection {
  const corruptNumbered = params.checkpoints.filter((checkpoint) => checkpoint.kind === 'INTERMEDIATE' && !checkpoint.valid);
  if (corruptNumbered.length) {
    throw new Error(`Invalid intermediate adapter checkpoint(s): ${corruptNumbered.map((entry) => `${entry.fileName}(${entry.validationIssues.join('|') || 'invalid'})`).join(', ')}`);
  }
  const best = [...params.validationEvents]
    .filter((event) => event.iteration > 1 && event.isFinite && event.isImprovement)
    .sort((left, right) => left.validationLoss - right.validationLoss || left.iteration - right.iteration)[0] || null;
  const numbered = params.checkpoints
    .filter((checkpoint) => checkpoint.valid && checkpoint.kind === 'INTERMEDIATE' && checkpoint.iteration !== null)
    .sort((left, right) => Number(left.iteration) - Number(right.iteration) || left.fileName.localeCompare(right.fileName));
  if (best && numbered.length) {
    const exact = numbered.find((entry) => entry.iteration === best.iteration);
    const lower = [...numbered].reverse().find((entry) => Number(entry.iteration) <= best.iteration);
    const closest = [...numbered].sort((left, right) => (
      Math.abs(Number(left.iteration) - best.iteration) - Math.abs(Number(right.iteration) - best.iteration)
        || Number(left.iteration) - Number(right.iteration)
        || left.fileName.localeCompare(right.fileName)
    ))[0];
    const selected = exact || lower || closest;
    if (selected) {
      const selectedMetric = params.validationEvents.find((entry) => entry.iteration === selected.iteration && entry.isFinite) || null;
      return {
        selectedSourcePath: selected.path,
        selectedCheckpointIteration: selected.iteration,
        selectedCheckpointValidationLoss: selectedMetric?.validationLoss ?? null,
        bestValidationIteration: best.iteration,
        bestValidationLoss: best.validationLoss,
        selectionReason: exact
          ? 'minimum_validation_loss_exact_checkpoint'
          : lower
            ? 'minimum_validation_loss_closest_lower_checkpoint'
            : 'minimum_validation_loss_closest_checkpoint',
      };
    }
  }
  const final = params.checkpoints.find((checkpoint) => checkpoint.kind === 'FINAL' && checkpoint.valid) || null;
  if (!final) throw new Error('No final or intermediate adapter weights were produced.');
  return {
    selectedSourcePath: final.path,
    selectedCheckpointIteration: null,
    selectedCheckpointValidationLoss: null,
    bestValidationIteration: best?.iteration ?? null,
    bestValidationLoss: best?.validationLoss ?? null,
    selectionReason: 'final_adapter_fallback',
  };
}

export function buildVhdlTrainingCheckpointCatalog(params: {
  trainingRunId: string;
  checkpoints: VhdlTrainingCheckpointArtifact[];
  validationEvents: VhdlTrainingValidationEvent[];
  policy: VhdlTrainingEarlyStoppingPolicy;
  generatedAt?: string;
}): VhdlTrainingCheckpointCatalog {
  const earlyStopping = evaluateVhdlTrainingEarlyStopping({ events: params.validationEvents, policy: params.policy });
  let selection: VhdlMlxAdapterSelection | null = null;
  try {
    selection = selectBestMlxAdapterCandidateFromCatalog({
      checkpoints: params.checkpoints,
      validationEvents: params.validationEvents,
    });
  } catch {
    selection = null;
  }
  const best = [...params.validationEvents]
    .filter((event) => event.iteration > 1 && event.isFinite && event.isImprovement)
    .sort((left, right) => left.validationLoss - right.validationLoss || left.iteration - right.iteration)[0] || null;
  return {
    schemaVersion: 1,
    trainingRunId: params.trainingRunId,
    generatedAt: params.generatedAt || new Date().toISOString(),
    checkpoints: params.checkpoints,
    validationEvents: params.validationEvents,
    currentBest: {
      bestValidationIteration: best?.iteration ?? null,
      bestValidationLoss: best?.validationLoss ?? null,
      selectedCheckpointIteration: selection?.selectedCheckpointIteration ?? null,
      selectedCheckpointPath: selection?.selectedSourcePath ?? null,
      selectionReason: selection?.selectionReason ?? null,
    },
    earlyStopping: {
      enabled: params.policy.enabled,
      stopRequested: earlyStopping.stopRequested,
      stopReason: earlyStopping.stopReason,
      stoppedAtIteration: earlyStopping.stoppedAtIteration,
      policy: params.policy,
    },
  };
}

export async function selectBestMlxAdapterCandidate(params: {
  adapterDirectory: string;
  validationMetrics: VhdlMlxValidationMetric[];
}): Promise<VhdlMlxAdapterSelection> {
  const policy = resolveVhdlTrainingEarlyStoppingPolicy({ enabled: false });
  const checkpoints = await discoverMlxAdapterCheckpoints(params.adapterDirectory);
  const events = buildVhdlTrainingValidationEvents({ metrics: params.validationMetrics, policy, checkpoints });
  return selectBestMlxAdapterCandidateFromCatalog({ checkpoints, validationEvents: events });
}
