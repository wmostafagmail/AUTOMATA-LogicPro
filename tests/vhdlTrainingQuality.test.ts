import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  assignVhdlQualityDatasetSplit,
  auditVhdlQualitySplitOverlaps,
  deduplicateVhdlTrainingRecords,
  normalizeVhdlContentForHash,
  parseMlxTrainingMetrics,
  renderMlxLoraConfigYaml,
  resolveVhdlQualityTrainingConfig,
  selectBestMlxAdapterCandidate,
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

async function writeQualityDatasetManifest(datasetPath: string, splits: Record<'train' | 'validation' | 'test' | 'holdout', string>) {
  const hashes = {
    train: sha256(splits.train),
    validation: sha256(splits.validation),
    test: sha256(splits.test),
    holdout: sha256(splits.holdout),
  };
  const counts = {
    train: splits.train.trim() ? splits.train.trim().split(/\r?\n/).length : 0,
    validation: splits.validation.trim() ? splits.validation.trim().split(/\r?\n/).length : 0,
    test: splits.test.trim() ? splits.test.trim().split(/\r?\n/).length : 0,
    holdout: splits.holdout.trim() ? splits.holdout.trim().split(/\r?\n/).length : 0,
  };
  await fs.writeFile(path.join(datasetPath, 'manifest.json'), `${JSON.stringify({ schemaVersion: 2, splits: counts, hashes }, null, 2)}\n`);
  return { hashes, counts };
}

test('quality normalization preserves semantics while stabilizing hashes', () => {
  const left = 'entity demo is\r\n  -- keep comment   \r\n  constant S : string := " a  b ";   \r\nend;\r\n';
  const right = 'entity demo is\n  -- keep comment\n  constant S : string := " a  b ";\nend;\n';
  assert.equal(normalizeVhdlContentForHash(left), right);
  assert.match(normalizeVhdlContentForHash(left), /-- keep comment/);
  assert.match(normalizeVhdlContentForHash(left), /" a  b "/);
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
  const canonical = sha256(normalizeVhdlContentForHash(completion));
  const result = deduplicateVhdlTrainingRecords([
    record('source_hash_old', completion, { contentHash: sha256(completion) }),
    record('canonical_hash', normalizeVhdlContentForHash(completion), { contentHash: canonical }),
  ], sha256);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].contentHash, canonical);
  assert.equal(result.sourceContentHashMismatchCount, 1);
  assert.equal((result.records[0] as any).sourceContentHash, canonical);
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

test('quality config resolver validates overrides without truncating floats', () => {
  assert.throws(() => resolveVhdlQualityTrainingConfig({ trainCount: 100, overrides: { unknown: 1 } }), /Unsupported/);
  assert.throws(() => resolveVhdlQualityTrainingConfig({ trainCount: 100, overrides: { maxSeqLength: 128 } }), /maxSeqLength/);
  const config = resolveVhdlQualityTrainingConfig({ trainCount: 100, overrides: { learningRate: 0.000123, minimumLearningRate: 0.0000123, loraScale: 2.75, loraDropout: 0.125 } });
  assert.equal(config.learningRate, 0.000123);
  assert.equal(config.minimumLearningRate, 0.0000123);
  assert.equal(config.loraParameters.scale, 2.75);
  assert.equal(config.loraParameters.dropout, 0.125);
  assert.throws(() => resolveVhdlQualityTrainingConfig({ trainCount: 100, overrides: { valBatches: 0 } }), /valBatches/);
  assert.throws(() => resolveVhdlQualityTrainingConfig({ trainCount: 100, overrides: { testBatches: -2 } }), /testBatches/);
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
  assert.doesNotMatch(yaml, /keys:/);
  assert.equal(yaml, renderMlxLoraConfigYaml({ model: 'model "with quote"', dataPath: '/tmp/path with spaces/data', adapterPath: '/tmp/adapter path', config }));
  assert.equal(sha256(yaml), sha256(renderMlxLoraConfigYaml({ model: 'model "with quote"', dataPath: '/tmp/path with spaces/data', adapterPath: '/tmp/adapter path', config })));
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
    recordCount: 160,
    trainCount: 100,
    validationCount: 20,
    testCount: 20,
    holdoutCount: 20,
    manifestPath: path.join(datasetPath, 'manifest.json'),
    datasetPath,
    sourceRunIds: [],
    sourceArtifactIds: [],
    createdAt: new Date(0).toISOString(),
    frozenAt: new Date(0).toISOString(),
    audit: {},
  };
  const dataPath = await lab.prepareMlxTrainingDataset(release, root);
  assert.match(await fs.readFile(path.join(dataPath, 'train.jsonl'), 'utf8'), /rtl train/);
  assert.match(await fs.readFile(path.join(dataPath, 'valid.jsonl'), 'utf8'), /rtl validation/);
  assert.match(await fs.readFile(path.join(dataPath, 'test.jsonl'), 'utf8'), /rtl test/);
  assert.doesNotMatch(await fs.readFile(path.join(dataPath, 'test.jsonl'), 'utf8'), /rtl holdout/);
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
