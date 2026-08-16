import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  assignVhdlQualityDatasetSplit,
  auditVhdlQualitySplitOverlaps,
  buildVhdlQualityDatasetReport,
  buildVhdlTrainingValidationEvents,
  deduplicateVhdlTrainingRecords,
  discoverMlxAdapterCheckpoints,
  evaluateVhdlTrainingEarlyStopping,
  evaluateValidationImprovement,
  normalizeVhdlContentForHash,
  parseMlxProgressLine,
  parseMlxTrainingMetrics,
  resolveVhdlTrainingEarlyStoppingPolicy,
  renderMlxLoraConfigYaml,
  resolveVhdlQualityTrainingConfig,
  selectBestMlxAdapterCandidate,
  selectBestMlxAdapterCandidateFromCatalog,
  validateVhdlQualityDatasetMinimums,
} from '../src/server/vhdlTrainingQuality.ts';

const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');

function record(id: string, completion = `entity ${id} is end; architecture rtl of ${id} is begin end;`, extra: Record<string, any> = {}) {
  return {
    id,
    recordType: 'verified_10k_block_to_project_rtl',
    contractHash: `contract_${id}`,
    blockName: id,
    category: 'demo',
    prompt: { instruction: 'Generate RTL' },
    completion,
    contentHash: sha256(normalizeVhdlContentForHash(completion)),
    evaluationOnly: false,
    ...extra,
  };
}

async function writeQualityDatasetManifest(
  datasetPath: string,
  splits: Record<'train' | 'validation' | 'test' | 'holdout', string>,
  overrides: { counts?: Partial<Record<'train' | 'validation' | 'test' | 'holdout', unknown>>; hashes?: Partial<Record<'train' | 'validation' | 'test' | 'holdout', string>> } = {},
) {
  const hashes = {
    train: sha256(splits.train),
    validation: sha256(splits.validation),
    test: sha256(splits.test),
    holdout: sha256(splits.holdout),
    ...overrides.hashes,
  };
  const counts = {
    train: splits.train.trim() ? splits.train.trim().split(/\r?\n/).length : 0,
    validation: splits.validation.trim() ? splits.validation.trim().split(/\r?\n/).length : 0,
    test: splits.test.trim() ? splits.test.trim().split(/\r?\n/).length : 0,
    holdout: splits.holdout.trim() ? splits.holdout.trim().split(/\r?\n/).length : 0,
    ...overrides.counts,
  };
  await fs.writeFile(path.join(datasetPath, 'manifest.json'), `${JSON.stringify({ schemaVersion: 2, splits: counts, hashes }, null, 2)}\n`);
  return { hashes, counts };
}

async function writeQualityDatasetFixture(root: string, options: {
  splitCounts?: Partial<Record<'train' | 'validation' | 'test' | 'holdout', number>>;
  manifestCounts?: Partial<Record<'train' | 'validation' | 'test' | 'holdout', unknown>>;
  manifestHashes?: Partial<Record<'train' | 'validation' | 'test' | 'holdout', string>>;
  releaseCounts?: Partial<Record<'trainCount' | 'validationCount' | 'testCount' | 'holdoutCount', unknown>>;
  manifestText?: string | null;
  status?: string;
  audit?: Record<string, any>;
} = {}) {
  const datasetPath = path.join(root, `dataset-${Math.random().toString(16).slice(2)}`);
  await fs.mkdir(datasetPath, { recursive: true });
  const counts = { train: 1, validation: 1, test: 1, holdout: 1, ...options.splitCounts };
  const splitContent = (split: keyof typeof counts) => Array.from({ length: counts[split] }, (_, index) => `${JSON.stringify({ prompt: `${split}-${index}`, completion: `rtl ${split} ${index}` })}\n`).join('');
  const splits = {
    train: splitContent('train'),
    validation: splitContent('validation'),
    test: splitContent('test'),
    holdout: splitContent('holdout'),
  };
  await Promise.all(Object.entries(splits).map(([split, content]) => fs.writeFile(path.join(datasetPath, `${split}.jsonl`), content)));
  if (options.manifestText !== null) {
    if (options.manifestText !== undefined) await fs.writeFile(path.join(datasetPath, 'manifest.json'), options.manifestText);
    else await writeQualityDatasetManifest(datasetPath, splits, { counts: options.manifestCounts, hashes: options.manifestHashes });
  }
  return {
    datasetPath,
    splits,
    release: {
      id: 'dataset_quality_fixture',
      schemaVersion: 2 as const,
      status: (options.status || 'BUILT') as any,
      name: 'quality fixture',
      recordCount: Object.values(counts).reduce((sum, count) => sum + count, 0),
      trainCount: counts.train,
      validationCount: counts.validation,
      testCount: counts.test,
      holdoutCount: counts.holdout,
      ...options.releaseCounts,
      manifestPath: path.join(datasetPath, 'manifest.json'),
      datasetPath,
      sourceRunIds: [],
      sourceArtifactIds: [],
      createdAt: new Date(0).toISOString(),
      frozenAt: new Date(0).toISOString(),
      audit: options.audit || {},
    } as any,
  };
}

test('quality normalization preserves semantics while stabilizing hashes', () => {
  const left = 'entity demo is\r\n  -- keep comment   \r\n  constant S : string := " a  b ";   \r\nend;\r\n';
  const right = 'entity demo is\n  -- keep comment\n  constant S : string := " a  b ";\nend;\n';
  assert.equal(normalizeVhdlContentForHash(left), right);
  assert.match(normalizeVhdlContentForHash(left), /-- keep comment/);
  assert.match(normalizeVhdlContentForHash(left), /" a  b "/);
});

test('quality canonical hashing keeps meaningful VHDL text differences', () => {
  assert.equal(
    normalizeVhdlContentForHash('entity demo is end;'),
    normalizeVhdlContentForHash('entity demo is end;\n\n'),
  );
  assert.notEqual(
    sha256(normalizeVhdlContentForHash('-- implementation A\nentity demo is end;\n')),
    sha256(normalizeVhdlContentForHash('-- implementation B\nentity demo is end;\n')),
  );
  assert.notEqual(
    sha256(normalizeVhdlContentForHash('constant S : string := "a b";\n')),
    sha256(normalizeVhdlContentForHash('constant S : string := "a  b";\n')),
  );
  const spaced = 'entity demo  is\n  port(clk   : in std_logic);\nend;\n';
  assert.equal(normalizeVhdlContentForHash(spaced), spaced);
});

test('quality deduplication removes exact duplicates and keeps evaluation-only content sealed', () => {
  const completion = 'entity same is end; architecture rtl of same is begin end;';
  const result = deduplicateVhdlTrainingRecords([
    record('train_duplicate', completion, { evaluationOnly: false }),
    record('holdout_duplicate', completion, { evaluationOnly: true }),
  ], sha256);
  assert.equal(result.records.length, 1);
  assert.equal(result.removedCount, 1);
  assert.equal(result.duplicateGroups, 1);
  assert.equal(result.evaluationOnlyConflicts, 1);
  assert.equal(result.records[0].evaluationOnly, true);
});

test('quality deduplication canonicalizes hashes and audits source hash drift', () => {
  const completion = 'entity canon is\r\n  signal s : string := "keep   me";   \r\nend;\r\narchitecture rtl of canon is begin end;\r\n';
  const originalSourceHash = sha256(completion);
  const canonical = sha256(normalizeVhdlContentForHash(completion));
  const result = deduplicateVhdlTrainingRecords([
    record('source_hash_old', completion, { sourceContentHash: originalSourceHash, contentHash: 'previous-canonical-or-legacy-hash', recordType: 'contract_to_accepted_rtl', verificationStrength: 'ghdl_simulation' }),
    record('canonical_hash', normalizeVhdlContentForHash(completion), { contentHash: canonical }),
  ], sha256);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].contentHash, canonical);
  assert.equal(result.sourceContentHashMismatchCount, 1);
  assert.equal((result.records[0] as any).sourceContentHash, originalSourceHash);
});

test('quality deduplication preserves explicit and legacy source hashes', () => {
  const completion = 'entity source_trace is end; architecture rtl of source_trace is begin end;';
  const explicit = deduplicateVhdlTrainingRecords([
    record('explicit_source', completion, { sourceContentHash: 'original-source-hash', contentHash: 'previous-canonical-or-legacy-hash' }),
  ], sha256);
  assert.equal((explicit.records[0] as any).sourceContentHash, 'original-source-hash');
  assert.equal(explicit.records[0].contentHash, sha256(normalizeVhdlContentForHash(completion)));

  const legacy = deduplicateVhdlTrainingRecords([
    record('legacy_source', completion, { contentHash: 'legacy-source-hash' }),
  ], sha256);
  assert.equal((legacy.records[0] as any).sourceContentHash, 'legacy-source-hash');
  assert.equal(legacy.records[0].contentHash, sha256(normalizeVhdlContentForHash(completion)));
  assert.equal(legacy.sourceContentHashMismatchCount, 1);
});

test('quality deduplication prefers simulation-verified accepted artifacts', () => {
  const completion = 'entity same2 is end; architecture rtl of same2 is begin end;';
  const result = deduplicateVhdlTrainingRecords([
    record('verified_library', completion, { recordType: 'verified_10k_block_to_project_rtl' }),
    record('accepted_sim', completion, { recordType: 'contract_to_accepted_rtl', verificationStrength: 'ghdl_simulation' }),
  ], sha256);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].id, 'accepted_sim');
});

test('quality deduplication keeps intentional repair variants with explicit keys', () => {
  const completion = 'entity repair_same is end; architecture rtl of repair_same is begin end;';
  const result = deduplicateVhdlTrainingRecords([
    record('contract_example', completion, { deduplicationKey: 'contract:repair_same' }),
    record('repair_example', completion, { recordType: 'failed_rtl_to_repaired_rtl', failureCode: 'missing_work_unit_dependency', deduplicationKey: 'repair:repair_same:missing_work_unit_dependency' }),
  ], sha256);
  assert.equal(result.records.length, 2);
  assert.equal(result.removedCount, 0);
});

test('quality dataset report summarizes repair-augmented coverage', () => {
  const report = buildVhdlQualityDatasetReport([
    record('accepted', undefined, { recordType: 'contract_to_accepted_rtl', verificationStrength: 'ghdl_simulation', category: 'protocol' }),
    record('repair', undefined, { recordType: 'failed_rtl_to_repaired_rtl', failureCode: 'missing_work_unit_dependency', verificationStrength: 'ghdl_simulation', category: 'protocol' }),
    record('anti', undefined, { recordType: 'anti_pattern_to_safe_pattern', failureCode: 'video_pixel_address_bound_check', category: 'video' }),
  ], new Date(0).toISOString());
  assert.equal(report.totalRecords, 3);
  assert.equal(report.recordTypes.failed_rtl_to_repaired_rtl, 1);
  assert.equal(report.repairAugmentedRecords, 1);
  assert.equal(report.antiPatternRecords, 1);
  assert.equal(report.highValueFailureCoverage.missing_work_unit_dependency, 1);
});

test('quality deduplication order is deterministic', () => {
  const completion = 'entity tie is end; architecture rtl of tie is begin end;';
  const first = deduplicateVhdlTrainingRecords([record('b', completion), record('a', completion)], sha256);
  const second = deduplicateVhdlTrainingRecords([record('a', completion), record('b', completion)], sha256);
  assert.deepEqual(first.records.map((entry) => entry.id), second.records.map((entry) => entry.id));
  assert.equal(first.records[0].id, 'a');
});

test('quality split assignment keeps logical contracts together and ignores recordType', () => {
  const base = record('split_a', 'entity split_a is end; architecture rtl of split_a is begin end;', { contractHash: 'same_contract', recordType: 'contract_to_accepted_rtl' });
  const alternate = { ...base, id: 'split_b', recordType: 'verified_10k_block_to_project_rtl' };
  assert.equal(assignVhdlQualityDatasetSplit(base, sha256), assignVhdlQualityDatasetSplit(alternate, sha256));
  assert.equal(assignVhdlQualityDatasetSplit({ ...base, evaluationOnly: true }, sha256), 'holdout');
});

test('quality split overlap audit detects zero leakage and category coverage', () => {
  const splits = {
    train: [record('train_a')],
    validation: [record('validation_a', undefined, { category: 'protocol' })],
    test: [record('test_a', undefined, { category: null, taskFamily: 'DSP' })],
    holdout: [record('holdout_a', undefined, { category: null, prompt: { blockSpec: { category: 'memory' } } })],
  };
  const audit = auditVhdlQualitySplitOverlaps(splits);
  assert.equal(audit.trainValidationOverlap, 0);
  assert.equal(audit.trainTestOverlap, 0);
  assert.equal(audit.trainHoldoutOverlap, 0);
  assert.equal(audit.validationTestOverlap, 0);
  assert.equal(audit.validationHoldoutOverlap, 0);
  assert.equal(audit.testHoldoutOverlap, 0);
  assert.equal(audit.splitCategoryCoverage.validation.protocol, 1);
  assert.equal(audit.splitCategoryCoverage.holdout.memory, 1);
});

test('quality split overlap audit detects canonical content leaks with different source hashes', () => {
  const completion = 'entity leak is end; architecture rtl of leak is begin end;';
  const canonical = sha256(normalizeVhdlContentForHash(completion));
  const audit = auditVhdlQualitySplitOverlaps({
    train: [record('train_leak', completion, { sourceContentHash: 'source-a', contentHash: canonical })],
    validation: [record('validation_leak', completion, { sourceContentHash: 'source-b', contentHash: canonical })],
    test: [],
    holdout: [],
  });
  assert.equal(audit.trainValidationOverlap, 1);
});

test('quality dataset gates reject narrow or empty splits and accept sufficient sets', () => {
  const cleanAudit = {
    trainValidationOverlap: 0,
    trainTestOverlap: 0,
    trainHoldoutOverlap: 0,
    validationTestOverlap: 0,
    validationHoldoutOverlap: 0,
    testHoldoutOverlap: 0,
    splitCategoryCoverage: { train: {}, validation: {}, test: {}, holdout: {} },
  };
  assert.equal(validateVhdlQualityDatasetMinimums({ total: 99, trainCount: 99, validationCount: 20, testCount: 20, holdoutCount: 20, overlapAudit: cleanAudit }).ok, false);
  assert.equal(validateVhdlQualityDatasetMinimums({ total: 160, trainCount: 100, validationCount: 0, testCount: 20, holdoutCount: 20, overlapAudit: cleanAudit }).ok, false);
  assert.equal(validateVhdlQualityDatasetMinimums({ total: 160, trainCount: 100, validationCount: 20, testCount: 0, holdoutCount: 20, overlapAudit: cleanAudit }).ok, false);
  assert.equal(validateVhdlQualityDatasetMinimums({ total: 160, trainCount: 100, validationCount: 20, testCount: 20, holdoutCount: 0, overlapAudit: cleanAudit }).ok, false);
  assert.equal(validateVhdlQualityDatasetMinimums({ total: 160, trainCount: 100, validationCount: 20, testCount: 20, holdoutCount: 20, overlapAudit: cleanAudit }).ok, true);
});

test('quality config resolver returns required quality_v1 defaults and derived intervals', () => {
  const config = resolveVhdlQualityTrainingConfig({ trainCount: 1000, overrides: { profile: 'quality_v1' } });
  assert.equal(config.epochs, 3);
  assert.equal(config.iters, 3000);
  assert.equal(config.batchSize, 1);
  assert.equal(config.gradAccumulationSteps, 8);
  assert.equal(config.effectiveBatchSize, 8);
  assert.equal(config.maxSeqLength, 4096);
  assert.equal(config.numLayers, -1);
  assert.equal(config.loraParameters.rank, 16);
  assert.equal(config.loraParameters.scale, 2);
  assert.equal(config.loraParameters.dropout, 0.05);
  assert.equal(config.valBatches, -1);
  assert.equal(config.testBatches, -1);
  assert.equal(config.warmupIterations, 90);
});

test('quality config resolver supports repair-augmented profile defaults', () => {
  const config = resolveVhdlQualityTrainingConfig({ trainCount: 1000, overrides: { profile: 'quality_v2_repair_augmented' } });
  assert.equal(config.profile, 'quality_v2_repair_augmented');
  assert.equal(config.epochs, 4);
  assert.equal(config.loraParameters.rank, 32);
});

test('quality config resolver supports power-loss resume iteration overrides', () => {
  const config = resolveVhdlQualityTrainingConfig({
    trainCount: 1000,
    overrides: {
      profile: 'quality_v2_repair_augmented',
      iters: 28170,
      warmupIterations: 0,
    },
  });
  assert.equal(config.iters, 28170);
  assert.equal(config.warmupIterations, 0);
  assert.equal(config.profile, 'quality_v2_repair_augmented');
});

test('quality config resolver validates overrides without truncating floats', () => {
  assert.throws(() => resolveVhdlQualityTrainingConfig({ trainCount: 100, overrides: { unknown: 1 } }), /Unsupported/);
  assert.throws(() => resolveVhdlQualityTrainingConfig({ trainCount: 100, overrides: { maxSeqLength: 128 } }), /maxSeqLength/);
  const config = resolveVhdlQualityTrainingConfig({ trainCount: 100, overrides: { learningRate: 0.000123, minimumLearningRate: 0.0000123, loraScale: 2.75, loraDropout: 0.125 } });
  assert.equal(config.learningRate, 0.000123);
  assert.equal(config.minimumLearningRate, 0.0000123);
  assert.equal(config.loraParameters.scale, 2.75);
  assert.equal(config.loraParameters.dropout, 0.125);
  for (const [key, value] of [
    ['valBatches', -1],
    ['valBatches', 1],
    ['valBatches', 100],
    ['testBatches', -1],
    ['testBatches', 1],
    ['testBatches', 100],
  ] as const) {
    assert.equal((resolveVhdlQualityTrainingConfig({ trainCount: 100, overrides: { [key]: value } }) as any)[key], value);
  }
  for (const [key, value] of [
    ['valBatches', 0],
    ['valBatches', -2],
    ['valBatches', 1.5],
    ['testBatches', 0],
    ['testBatches', -2],
    ['testBatches', 1.5],
  ] as const) {
    assert.throws(() => resolveVhdlQualityTrainingConfig({ trainCount: 100, overrides: { [key]: value } }), new RegExp(key));
  }
});

test('quality YAML generation is deterministic, escaped, complete, and omits keys', () => {
  const config = resolveVhdlQualityTrainingConfig({ trainCount: 1000 });
  const yaml = renderMlxLoraConfigYaml({
    model: 'model "with quote"',
    dataPath: '/tmp/path with spaces/data',
    adapterPath: '/tmp/adapter path',
    config,
  });
  assert.match(yaml, /model: "model \\"with quote\\""/);
  assert.match(yaml, /max_seq_length: 4096/);
  assert.match(yaml, /learning_rate: 0.00002/);
  assert.match(yaml, /eps: 1e-8/);
  assert.match(yaml, /grad_accumulation_steps: 8/);
  assert.match(yaml, /rank: 16/);
  assert.doesNotMatch(yaml, /resume_adapter_file:/);
  assert.doesNotMatch(yaml, /keys:/);
  assert.equal(yaml, renderMlxLoraConfigYaml({ model: 'model "with quote"', dataPath: '/tmp/path with spaces/data', adapterPath: '/tmp/adapter path', config }));
  assert.equal(sha256(yaml), sha256(renderMlxLoraConfigYaml({ model: 'model "with quote"', dataPath: '/tmp/path with spaces/data', adapterPath: '/tmp/adapter path', config })));
});

test('quality YAML generation can resume from an MLX adapter checkpoint', () => {
  const config = resolveVhdlQualityTrainingConfig({ trainCount: 1000, overrides: { iters: 100, warmupIterations: 0 } });
  const yaml = renderMlxLoraConfigYaml({
    model: 'quality-model',
    dataPath: '/tmp/data',
    adapterPath: '/tmp/adapter',
    resumeAdapterFile: '/tmp/interrupted adapter/0004026_adapters.safetensors',
    config,
  });
  assert.match(yaml, /resume_adapter_file: "\/tmp\/interrupted adapter\/0004026_adapters\.safetensors"/);
  assert.match(yaml, /iters: 100/);
  assert.match(yaml, /warmup: 0/);
});

test('quality YAML generation preserves override precision', () => {
  const config = resolveVhdlQualityTrainingConfig({
    trainCount: 100,
    overrides: {
      learningRate: 0.000123,
      minimumLearningRate: 0.0000123,
      loraScale: 2.75,
      loraDropout: 0.125,
    },
  });
  const yaml = renderMlxLoraConfigYaml({
    model: 'quality-model',
    dataPath: '/tmp/data',
    adapterPath: '/tmp/adapter',
    config,
  });
  assert.match(yaml, /learning_rate: 0.000123/);
  assert.match(yaml, /arguments: \[0.000123, 300, 0.0000123\]/);
  assert.match(yaml, /scale: 2.75/);
  assert.match(yaml, /dropout: 0.125/);
  assert.match(yaml, /eps: 1e-8/);
});

test('quality MLX metric parser captures validation, train, test, parameters, memory, and truncation', () => {
  const metrics = parseMlxTrainingMetrics([
    'Iter 1: Val loss 9.9, Val took 0s',
    'Trainable parameters: 0.123% (45.678M/37000.000M)',
    'Iter 100: Train loss 0.800',
    'Iter 100: Val loss 0.700, Val took 1s',
    'Iter 200: Train loss 0.600',
    'Iter 200: Val loss 0.500, Val took 1s',
    'Peak mem 3.0 GB',
    'Peak mem 4.5 GB',
    'Some sequences are longer than the limit and will be truncated',
    'will be truncated',
    'Test loss 0.321, Test ppl 1.378.',
  ].join('\n'));
  assert.equal(metrics.train.length, 2);
  assert.equal(metrics.validation.length, 3);
  assert.deepEqual(metrics.bestValidation, { iteration: 200, validationLoss: 0.5 });
  assert.equal(metrics.finalTrainLoss, 0.6);
  assert.equal(metrics.testLoss, 0.321);
  assert.equal(metrics.testPpl, 1.378);
  assert.equal(metrics.trainableParameterPercent, 0.123);
  assert.equal(metrics.trainableParameterMillions, 45.678);
  assert.equal(metrics.totalParameterMillions, 37000);
  assert.equal(metrics.peakMemoryGb, 4.5);
  assert.equal(metrics.truncationWarningCount, 2);
});

test('quality MLX progress parser captures carriage-return progress bars', () => {
  assert.deepEqual(
    parseMlxProgressLine('Calculating loss...: 254it [09:34,  2.38s/it]'),
    { phase: 'calculating loss', count: 254, detail: '09:34,  2.38s/it' },
  );
  assert.deepEqual(
    parseMlxProgressLine('Training: 10it [00:14,  1.42s/it]'),
    { phase: 'training', count: 10, detail: '00:14,  1.42s/it' },
  );
});

test('quality adapter selection chooses exact, lower, closest, final, and missing weights correctly', async () => {
  const exactDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-quality-exact-'));
  await fs.writeFile(path.join(exactDir, '0000200_adapters.safetensors'), '200');
  await fs.writeFile(path.join(exactDir, 'adapters.safetensors'), 'final');
  assert.equal((await selectBestMlxAdapterCandidate({ adapterDirectory: exactDir, validationMetrics: [{ iteration: 1, validationLoss: 0.05 }, { iteration: 200, validationLoss: 0.1 }] })).selectedCheckpointIteration, 200);

  const lowerDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-quality-lower-'));
  await fs.writeFile(path.join(lowerDir, '0000100_adapters.safetensors'), '100');
  await fs.writeFile(path.join(lowerDir, '0000300_adapters.safetensors'), '300');
  await fs.writeFile(path.join(lowerDir, 'adapters.safetensors'), 'final');
  const lowerSelection = await selectBestMlxAdapterCandidate({ adapterDirectory: lowerDir, validationMetrics: [{ iteration: 250, validationLoss: 0.1 }] });
  assert.equal(lowerSelection.selectedCheckpointIteration, 100);
  assert.equal(lowerSelection.bestValidationIteration, 250);
  assert.equal(lowerSelection.selectedCheckpointValidationLoss, null);

  const closestDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-quality-closest-'));
  await fs.writeFile(path.join(closestDir, '0000300_adapters.safetensors'), '300');
  await fs.writeFile(path.join(closestDir, 'adapters.safetensors'), 'final');
  assert.equal((await selectBestMlxAdapterCandidate({ adapterDirectory: closestDir, validationMetrics: [{ iteration: 100, validationLoss: 0.1 }] })).selectedCheckpointIteration, 300);

  const finalDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-quality-final-'));
  await fs.writeFile(path.join(finalDir, 'adapters.safetensors'), 'final');
  assert.equal((await selectBestMlxAdapterCandidate({ adapterDirectory: finalDir, validationMetrics: [] })).selectionReason, 'final_adapter_fallback');

  const missingDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-quality-missing-'));
  await assert.rejects(() => selectBestMlxAdapterCandidate({ adapterDirectory: missingDir, validationMetrics: [] }), /No final or intermediate adapter weights/);
});

test('training early-stopping policy validation rejects unsafe shapes and freezes defaults', () => {
  const policy = resolveVhdlTrainingEarlyStoppingPolicy({
    patienceValidationEvents: 2,
    minimumValidationEvents: 3,
    minimumAbsoluteImprovement: 0.01,
    hardRegressionRelativeThreshold: null,
  });
  assert.equal(policy.enabled, true);
  assert.equal(policy.patienceValidationEvents, 2);
  assert.equal(policy.metric, 'validation_loss');
  assert.throws(() => resolveVhdlTrainingEarlyStoppingPolicy({ patienceValidationEvents: 1.5 }), /integer >= 1/);
  assert.throws(() => resolveVhdlTrainingEarlyStoppingPolicy({ minimumRelativeImprovement: -0.1 }), /number >= 0/);
  assert.throws(() => resolveVhdlTrainingEarlyStoppingPolicy({ hardRegressionRelativeThreshold: 0 }), /number > 0/);
  assert.throws(() => resolveVhdlTrainingEarlyStoppingPolicy({ unknown: true }), /Unsupported early-stopping policy field/);
});

test('training validation events use configurable significant-improvement thresholds', () => {
  const policy = resolveVhdlTrainingEarlyStoppingPolicy({
    minimumValidationEvents: 3,
    patienceValidationEvents: 2,
    minimumAbsoluteImprovement: 0.01,
    minimumRelativeImprovement: 0.05,
    hardRegressionRelativeThreshold: null,
  });
  assert.equal(evaluateValidationImprovement({ bestLoss: 1, candidateLoss: 0.995, policy }).improved, false);
  assert.equal(evaluateValidationImprovement({ bestLoss: 1, candidateLoss: 0.94, policy }).improved, true);
  const events = buildVhdlTrainingValidationEvents({
    policy,
    metrics: [
      { iteration: 1, validationLoss: 9.9 },
      { iteration: 100, validationLoss: 1.0 },
      { iteration: 175, validationLoss: 0.995 },
      { iteration: 260, validationLoss: 1.01 },
    ],
  });
  assert.deepEqual(events.map((event) => event.decision), ['NO_SIGNIFICANT_IMPROVEMENT', 'INITIAL', 'NO_SIGNIFICANT_IMPROVEMENT', 'REGRESSION']);
  assert.equal(events.at(-1)?.consecutiveNonImprovingEvents, 2);
  assert.deepEqual(evaluateVhdlTrainingEarlyStopping({ events, policy }), {
    stopRequested: true,
    stopReason: 'VALIDATION_PATIENCE_EXHAUSTED',
    stoppedAtIteration: 260,
  });
});

test('training checkpoint discovery is generic and best selection maps irregular validation to checkpoints', async () => {
  const adapterDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-quality-checkpoints-'));
  await fs.writeFile(path.join(adapterDir, '2_adapters.safetensors'), 'two');
  await fs.writeFile(path.join(adapterDir, '300_adapters.safetensors'), 'three hundred');
  await fs.writeFile(path.join(adapterDir, 'adapters.safetensors'), 'final');
  await fs.writeFile(path.join(adapterDir, 'adapter_config.json'), '{"adapter":"lora"}\n');
  const checkpoints = await discoverMlxAdapterCheckpoints(adapterDir);
  assert.deepEqual(checkpoints.filter((entry) => entry.kind === 'INTERMEDIATE').map((entry) => entry.iteration), [2, 300]);
  assert(checkpoints.every((entry) => entry.valid));
  const policy = resolveVhdlTrainingEarlyStoppingPolicy({ enabled: false });
  const validationEvents = buildVhdlTrainingValidationEvents({
    policy,
    checkpoints,
    metrics: [{ iteration: 250, validationLoss: 0.1 }],
  });
  const selection = selectBestMlxAdapterCandidateFromCatalog({ checkpoints, validationEvents });
  assert.equal(selection.selectedCheckpointIteration, 2);
  assert.equal(selection.bestValidationIteration, 250);
  assert.equal(selection.selectedCheckpointValidationLoss, null);
});

test('training checkpoint discovery reports corrupt numbered checkpoints instead of ignoring them', async () => {
  const adapterDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-quality-corrupt-checkpoint-'));
  await fs.writeFile(path.join(adapterDir, '12_adapters.safetensors'), '');
  await fs.writeFile(path.join(adapterDir, 'adapters.safetensors'), 'final');
  const checkpoints = await discoverMlxAdapterCheckpoints(adapterDir);
  assert.equal(checkpoints.find((entry) => entry.iteration === 12)?.valid, false);
  const events = buildVhdlTrainingValidationEvents({
    policy: resolveVhdlTrainingEarlyStoppingPolicy({ enabled: false }),
    checkpoints,
    metrics: [{ iteration: 12, validationLoss: 0.2 }],
  });
  assert.throws(() => selectBestMlxAdapterCandidateFromCatalog({ checkpoints, validationEvents: events }), /Invalid intermediate adapter checkpoint/);
});

test('quality MLX dataset preparation uses train, validation, and test only', async () => {
  const lab = await import('../src/server/vhdlImprovementLab.ts');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-quality-prepare-'));
  const datasetPath = path.join(root, 'dataset');
  await fs.mkdir(datasetPath, { recursive: true });
  const train = { prompt: 'train', completion: 'rtl train' };
  const validation = { prompt: 'validation', completion: 'rtl validation' };
  const testRecord = { prompt: 'test', completion: 'rtl test' };
  const holdout = { prompt: 'holdout', completion: 'rtl holdout' };
  await fs.writeFile(path.join(datasetPath, 'train.jsonl'), `${JSON.stringify(train)}\n`);
  await fs.writeFile(path.join(datasetPath, 'validation.jsonl'), `${JSON.stringify(validation)}\n`);
  await fs.writeFile(path.join(datasetPath, 'test.jsonl'), `${JSON.stringify(testRecord)}\n`);
  await fs.writeFile(path.join(datasetPath, 'holdout.jsonl'), `${JSON.stringify(holdout)}\n`);
  await writeQualityDatasetManifest(datasetPath, {
    train: `${JSON.stringify(train)}\n`,
    validation: `${JSON.stringify(validation)}\n`,
    test: `${JSON.stringify(testRecord)}\n`,
    holdout: `${JSON.stringify(holdout)}\n`,
  });
  const release = {
    id: 'dataset_quality_prepare',
    schemaVersion: 2 as const,
    status: 'BUILT' as const,
    name: 'quality prepare',
    recordCount: 4,
    trainCount: 1,
    validationCount: 1,
    testCount: 1,
    holdoutCount: 1,
    manifestPath: path.join(datasetPath, 'manifest.json'),
    datasetPath,
    sourceRunIds: [],
    sourceArtifactIds: [],
    createdAt: new Date(0).toISOString(),
    frozenAt: new Date(0).toISOString(),
    audit: {},
  };
  const prepared = await lab.prepareMlxTrainingDataset(release, root);
  const dataPath = prepared.dataPath;
  assert.equal(prepared.integrity.actualCounts.train, 1);
  assert.match(await fs.readFile(path.join(dataPath, 'train.jsonl'), 'utf8'), /rtl train/);
  assert.match(await fs.readFile(path.join(dataPath, 'valid.jsonl'), 'utf8'), /rtl validation/);
  assert.match(await fs.readFile(path.join(dataPath, 'test.jsonl'), 'utf8'), /rtl test/);
  assert.doesNotMatch(await fs.readFile(path.join(dataPath, 'test.jsonl'), 'utf8'), /rtl holdout/);
  await assert.rejects(() => fs.stat(path.join(dataPath, 'holdout.jsonl')), /ENOENT/);
  await assert.rejects(() => lab.prepareMlxTrainingDataset({ ...release, schemaVersion: 1 as const, testCount: 0 }, root), /predates isolated quality-training splits/);
});

test('quality MLX dataset integrity rejects count and hash drift before training', async () => {
  const lab = await import('../src/server/vhdlImprovementLab.ts');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-quality-integrity-'));
  const datasetPath = path.join(root, 'dataset');
  await fs.mkdir(datasetPath, { recursive: true });
  const splits = {
    train: `${JSON.stringify({ prompt: 'train', completion: 'rtl train' })}\n`,
    validation: `${JSON.stringify({ prompt: 'validation', completion: 'rtl validation' })}\n`,
    test: `${JSON.stringify({ prompt: 'test', completion: 'rtl test' })}\n`,
    holdout: `${JSON.stringify({ prompt: 'holdout', completion: 'rtl holdout' })}\n`,
  };
  await Promise.all(Object.entries(splits).map(([split, content]) => fs.writeFile(path.join(datasetPath, `${split}.jsonl`), content)));
  await writeQualityDatasetManifest(datasetPath, splits);
  const release = {
    id: 'dataset_quality_integrity',
    schemaVersion: 2 as const,
    status: 'BUILT' as const,
    name: 'quality integrity',
    recordCount: 4,
    trainCount: 1,
    validationCount: 1,
    testCount: 1,
    holdoutCount: 1,
    manifestPath: path.join(datasetPath, 'manifest.json'),
    datasetPath,
    sourceRunIds: [],
    sourceArtifactIds: [],
    createdAt: new Date(0).toISOString(),
    frozenAt: new Date(0).toISOString(),
    audit: {},
  };
  assert.equal((await lab.verifyVhdlQualityDatasetIntegrity(release)).actualCounts.train, 1);
  await fs.appendFile(path.join(datasetPath, 'test.jsonl'), `${JSON.stringify({ prompt: 'tamper', completion: 'tamper' })}\n`);
  await assert.rejects(() => lab.verifyVhdlQualityDatasetIntegrity(release), /Dataset manifest\/count mismatch: expected 1 records in test\.jsonl but found 2/);
  await fs.writeFile(path.join(datasetPath, 'test.jsonl'), splits.test.replace('rtl test', 'rtl tampered'));
  await assert.rejects(() => lab.verifyVhdlQualityDatasetIntegrity(release), /Dataset integrity check failed: test\.jsonl does not match the frozen manifest hash/);
});

test('quality MLX dataset integrity validates manifest and release counts for every split', async () => {
  const lab = await import('../src/server/vhdlImprovementLab.ts');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-quality-count-matrix-'));
  const pass = await writeQualityDatasetFixture(root);
  assert.deepEqual((await lab.verifyVhdlQualityDatasetIntegrity(pass.release)).actualCounts, { train: 1, validation: 1, test: 1, holdout: 1 });

  const manifestTrainMismatch = await writeQualityDatasetFixture(root, { manifestCounts: { train: 2 } });
  await assert.rejects(() => lab.verifyVhdlQualityDatasetIntegrity(manifestTrainMismatch.release), /Dataset manifest\/count mismatch: expected 2 records in train\.jsonl but found 1/);

  const releaseValidationMismatch = await writeQualityDatasetFixture(root, { releaseCounts: { validationCount: 2 } });
  await assert.rejects(() => lab.verifyVhdlQualityDatasetIntegrity(releaseValidationMismatch.release), /Dataset release\/count mismatch: release validationCount=2, but validation\.jsonl contains 1 records/);

  const bothWrong = await writeQualityDatasetFixture(root, { manifestCounts: { test: 2 }, releaseCounts: { testCount: 2 } });
  await assert.rejects(() => lab.verifyVhdlQualityDatasetIntegrity(bothWrong.release), /Dataset manifest\/count mismatch: expected 2 records in test\.jsonl but found 1/);

  const actualManifestAgreeReleaseWrong = await writeQualityDatasetFixture(root, { releaseCounts: { holdoutCount: 2 } });
  await assert.rejects(() => lab.verifyVhdlQualityDatasetIntegrity(actualManifestAgreeReleaseWrong.release), /Dataset release\/count mismatch: release holdoutCount=2, but holdout\.jsonl contains 1 records/);

  const actualReleaseAgreeManifestWrong = await writeQualityDatasetFixture(root, { manifestCounts: { validation: 2 } });
  await assert.rejects(() => lab.verifyVhdlQualityDatasetIntegrity(actualReleaseAgreeManifestWrong.release), /Dataset manifest\/count mismatch: expected 2 records in validation\.jsonl but found 1/);

  for (const split of ['train', 'validation', 'test', 'holdout'] as const) {
    const missing = await writeQualityDatasetFixture(root, { manifestCounts: { [split]: undefined } as any });
    const manifest = JSON.parse(await fs.readFile(missing.release.manifestPath, 'utf8'));
    delete manifest.splits[split];
    await fs.writeFile(missing.release.manifestPath, `${JSON.stringify(manifest)}\n`);
    await assert.rejects(() => lab.verifyVhdlQualityDatasetIntegrity(missing.release), new RegExp(`Dataset manifest is missing a valid integer count for ${split}`));

    const nonInteger = await writeQualityDatasetFixture(root, { manifestCounts: { [split]: 1.5 } as any });
    await assert.rejects(() => lab.verifyVhdlQualityDatasetIntegrity(nonInteger.release), new RegExp(`Dataset manifest is missing a valid integer count for ${split}`));

    const negative = await writeQualityDatasetFixture(root, { manifestCounts: { [split]: -1 } as any });
    await assert.rejects(() => lab.verifyVhdlQualityDatasetIntegrity(negative.release), new RegExp(`Dataset manifest is missing a valid integer count for ${split}`));

    const releaseField = ({ train: 'trainCount', validation: 'validationCount', test: 'testCount', holdout: 'holdoutCount' } as const)[split];
    const invalidRelease = await writeQualityDatasetFixture(root, { releaseCounts: { [releaseField]: 1.5 } as any });
    await assert.rejects(() => lab.verifyVhdlQualityDatasetIntegrity(invalidRelease.release), new RegExp(`Dataset release contains an invalid ${releaseField} value`));
  }
});

test('quality MLX dataset integrity rejects manifest/hash and split-file corruption cases', async () => {
  const lab = await import('../src/server/vhdlImprovementLab.ts');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-quality-manifest-matrix-'));

  const missingManifest = await writeQualityDatasetFixture(root, { manifestText: null });
  await assert.rejects(() => lab.verifyVhdlQualityDatasetIntegrity(missingManifest.release), /Dataset manifest is missing or empty/);

  const emptyManifest = await writeQualityDatasetFixture(root, { manifestText: '' });
  await assert.rejects(() => lab.verifyVhdlQualityDatasetIntegrity(emptyManifest.release), /Dataset manifest is missing or empty/);

  const invalidJson = await writeQualityDatasetFixture(root, { manifestText: '{not json' });
  await assert.rejects(() => lab.verifyVhdlQualityDatasetIntegrity(invalidJson.release), /Dataset manifest is not valid JSON/);

  const missingSplits = await writeQualityDatasetFixture(root);
  const noSplitsManifest = JSON.parse(await fs.readFile(missingSplits.release.manifestPath, 'utf8'));
  delete noSplitsManifest.splits;
  await fs.writeFile(missingSplits.release.manifestPath, `${JSON.stringify(noSplitsManifest)}\n`);
  await assert.rejects(() => lab.verifyVhdlQualityDatasetIntegrity(missingSplits.release), /Dataset manifest is missing a valid integer count for train/);

  for (const split of ['train', 'validation', 'test', 'holdout'] as const) {
    const missingHash = await writeQualityDatasetFixture(root);
    const manifest = JSON.parse(await fs.readFile(missingHash.release.manifestPath, 'utf8'));
    delete manifest.hashes[split];
    await fs.writeFile(missingHash.release.manifestPath, `${JSON.stringify(manifest)}\n`);
    await assert.rejects(() => lab.verifyVhdlQualityDatasetIntegrity(missingHash.release), new RegExp(`Dataset manifest is missing frozen hash for ${split}\\.jsonl`));

    const hashDrift = await writeQualityDatasetFixture(root);
    await fs.writeFile(path.join(hashDrift.datasetPath, `${split}.jsonl`), `${JSON.stringify({ prompt: split, completion: 'tampered' })}\n`);
    await assert.rejects(() => lab.verifyVhdlQualityDatasetIntegrity(hashDrift.release), new RegExp(`Dataset integrity check failed: ${split === 'validation' ? 'validation' : split}\\.jsonl does not match the frozen manifest hash`));

    const countDrift = await writeQualityDatasetFixture(root);
    await fs.appendFile(path.join(countDrift.datasetPath, `${split}.jsonl`), `${JSON.stringify({ prompt: split, completion: 'extra' })}\n`);
    await assert.rejects(() => lab.verifyVhdlQualityDatasetIntegrity(countDrift.release), /Dataset manifest\/count mismatch/);
  }

  const auditFailed = await writeQualityDatasetFixture(root, {
    status: 'AUDIT_FAILED',
    audit: { qualityGateIssues: ['Training split contains 42 records; quality training requires at least 100.'] },
  });
  await assert.rejects(() => lab.verifyVhdlQualityDatasetIntegrity(auditFailed.release), /Training split contains 42 records; quality training requires at least 100/);
});
