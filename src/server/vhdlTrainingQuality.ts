import fs from 'node:fs/promises';
import path from 'node:path';

export type VhdlQualityDatasetSplit =
  | 'train'
  | 'validation'
  | 'test'
  | 'holdout';

export type VhdlQualityTrainingConfig = {
  profile: 'quality_v1';
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

export type VhdlDatasetDeduplicationResult<T> = {
  records: T[];
  removedCount: number;
  duplicateGroups: number;
  evaluationOnlyConflicts: number;
  sourceContentHashMismatchCount: number;
};

export type VhdlMlxValidationMetric = {
  iteration: number;
  validationLoss: number;
};

export type VhdlMlxTrainingMetrics = {
  validation: VhdlMlxValidationMetric[];
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

export function normalizeVhdlContentForHash(content: string): string {
  return content.replace(/\r\n?/g, '\n').split('\n').map((line) => line.replace(/[ \t]+$/g, '')).join('\n').replace(/\n*$/, '\n');
}

function verificationScore(record: RecordLike) {
  if (record.evaluationOnly) return 10_000;
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
    const sourceContentHash = record.contentHash ? String(record.contentHash) : null;
    const contentHash = sha256Fn(normalizeVhdlContentForHash(String(record.completion || '')));
    if (sourceContentHash && sourceContentHash !== contentHash) sourceContentHashMismatchCount += 1;
    const next = { ...record, sourceContentHash, contentHash } as T;
    const group = groups.get(contentHash) || [];
    group.push(next);
    groups.set(contentHash, group);
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
  ]).has(key));
  if (unknown.length) throw new Error(`Unsupported quality_v1 override field(s): ${unknown.join(', ')}.`);
  if (overrides.profile && overrides.profile !== 'quality_v1') throw new Error(`Unsupported training profile ${String(overrides.profile)}.`);
  const trainCount = Math.max(0, Math.floor(Number(params.trainCount || 0)));
  const epochs = integerOverride(overrides, 'epochs', 3, 1, 20);
  const batchSize = integerOverride(overrides, 'batchSize', 1, 1, 32);
  const gradAccumulationSteps = integerOverride(overrides, 'gradAccumulationSteps', 8, 1, 256);
  const maxSeqLength = integerOverride(overrides, 'maxSeqLength', 4096, 512, 32768);
  const learningRate = numberOverride(overrides, 'learningRate', 2e-5, Number.MIN_VALUE, 0.01);
  const minimumLearningRate = numberOverride(overrides, 'minimumLearningRate', 2e-6, 0, learningRate);
  const rawNumLayers = integerOverride(overrides, 'numLayers', -1, -1, 1000, true);
  if (rawNumLayers === 0) throw new Error('Invalid quality_v1 override numLayers: expected -1 or 1-1000.');
  const seed = integerOverride(overrides, 'seed', 42, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
  const iterationsPerEpoch = Math.ceil(trainCount / batchSize);
  const iters = iterationsPerEpoch * epochs;
  const warmupIterations = Math.max(10, Math.round(iters * 0.03));
  const stepsPerEval = integerOverride(overrides, 'stepsPerEval', Math.max(100, Math.ceil(iterationsPerEpoch / 4)), 1, 1_000_000);
  return {
    profile: 'quality_v1',
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
      rank: integerOverride(overrides, 'loraRank', 16, 1, 256),
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
  for (const match of logText.matchAll(/Iter\s+(\d+)\s*:\s*Val(?:idation)?\s+loss\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)/gi)) {
    const iteration = Number(match[1]);
    const validationLoss = Number(match[2]);
    if (Number.isFinite(iteration) && Number.isFinite(validationLoss)) validation.push({ iteration, validationLoss });
  }
  const trainedValidation = validation.filter((entry) => entry.iteration > 1 && Number.isFinite(entry.validationLoss));
  const bestValidation = trainedValidation.sort((left, right) => left.validationLoss - right.validationLoss || left.iteration - right.iteration)[0] || null;
  let finalTrainLoss: number | null = null;
  for (const match of logText.matchAll(/Iter\s+\d+\s*:\s*Train\s+loss\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)/gi)) finalTrainLoss = Number(match[1]);
  const testMatch = /Test\s+loss\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)[,\s]+Test\s+ppl\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)/i.exec(logText);
  const paramsMatch = /Trainable\s+parameters:\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))%\s*\(\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))M\s*\/\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))M\s*\)/i.exec(logText);
  let peakMemoryGb: number | null = null;
  for (const match of logText.matchAll(/Peak\s+mem(?:ory)?\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*GB/gi)) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) peakMemoryGb = Math.max(peakMemoryGb || 0, value);
  }
  return {
    validation,
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

export async function selectBestMlxAdapterCandidate(params: {
  adapterDirectory: string;
  validationMetrics: VhdlMlxValidationMetric[];
}): Promise<VhdlMlxAdapterSelection> {
  const finalPath = path.join(params.adapterDirectory, 'adapters.safetensors');
  const best = [...params.validationMetrics]
    .filter((entry) => entry.iteration > 1 && Number.isFinite(entry.validationLoss))
    .sort((left, right) => left.validationLoss - right.validationLoss || left.iteration - right.iteration)[0] || null;
  let numbered: Array<{ file: string; iteration: number }> = [];
  try {
    numbered = (await fs.readdir(params.adapterDirectory))
      .map((file) => ({ file, match: /^(\d{7})_adapters\.safetensors$/.exec(file) }))
      .filter((entry): entry is { file: string; match: RegExpExecArray } => Boolean(entry.match))
      .map((entry) => ({ file: entry.file, iteration: Number(entry.match[1]) }))
      .sort((left, right) => left.iteration - right.iteration);
  } catch {
    numbered = [];
  }
  if (best && numbered.length) {
    const exact = numbered.find((entry) => entry.iteration === best.iteration);
    const lower = [...numbered].reverse().find((entry) => entry.iteration <= best.iteration);
    const closest = [...numbered].sort((left, right) => Math.abs(left.iteration - best.iteration) - Math.abs(right.iteration - best.iteration) || left.iteration - right.iteration)[0];
    const selected = exact || lower || closest;
    if (selected) {
      const selectedMetric = params.validationMetrics.find((entry) => entry.iteration === selected.iteration && Number.isFinite(entry.validationLoss)) || null;
      return {
        selectedSourcePath: path.join(params.adapterDirectory, selected.file),
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
  try {
    await fs.access(finalPath);
  } catch {
    throw new Error('No final or intermediate adapter weights were produced.');
  }
  return {
    selectedSourcePath: finalPath,
    selectedCheckpointIteration: null,
    selectedCheckpointValidationLoss: null,
    bestValidationIteration: best?.iteration ?? null,
    bestValidationLoss: best?.validationLoss ?? null,
    selectionReason: 'final_adapter_fallback',
  };
}
