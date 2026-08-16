import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const makeContract = () => ({
  contract_version: '1.0' as const,
  entity: { name: 'phase3_counter' },
  generics: [{ name: 'WIDTH', type: 'positive', default: '8' }],
  ports: [
    { name: 'clk', mode: 'in' as const, type: 'std_logic' },
    { name: 'rst', mode: 'in' as const, type: 'std_logic' },
    { name: 'count_o', mode: 'out' as const, type: 'unsigned(WIDTH - 1 downto 0)' },
  ],
  clocking: { domains: [{ name: 'main', clock_port: 'clk', edge: 'rising' as const }] },
  reset: { port: 'rst', polarity: 'active_high' as const, synchronous: true },
  behavior: ['reset clears count_o'],
  corner_cases: ['WIDTH=1'],
  prohibited_implementations: ['std_logic_unsigned'],
  synthesis_requirements: ['numeric_std only'],
  testbench_obligations: ['self-check reset'],
  pass_marker: 'PASS',
});

const hashText = (value: string) => createHash('sha256').update(value).digest('hex');

async function writePhase3DatasetManifest(datasetPath: string, splits: Record<'train' | 'validation' | 'test' | 'holdout', string>) {
  const counts = Object.fromEntries(Object.entries(splits).map(([split, content]) => [split, content.trim() ? content.trim().split(/\r?\n/).length : 0]));
  const hashes = Object.fromEntries(Object.entries(splits).map(([split, content]) => [split, hashText(content)]));
  await fs.writeFile(path.join(datasetPath, 'manifest.json'), `${JSON.stringify({ schemaVersion: 2, splits: counts, hashes }, null, 2)}\n`);
}

async function writeMinimalBuiltDatasetRelease(lab: any, dataRoot: string, releaseId: string) {
  const datasetPath = path.join(dataRoot, releaseId);
  await fs.mkdir(datasetPath, { recursive: true });
  const splits = {
    train: `${JSON.stringify({ prompt: 'contract', completion: 'rtl train' })}\n`,
    validation: `${JSON.stringify({ prompt: 'contract', completion: 'rtl validation' })}\n`,
    test: `${JSON.stringify({ prompt: 'contract', completion: 'rtl test' })}\n`,
    holdout: `${JSON.stringify({ prompt: 'contract', completion: 'rtl holdout' })}\n`,
  };
  await fs.writeFile(path.join(datasetPath, 'train.jsonl'), splits.train);
  await fs.writeFile(path.join(datasetPath, 'validation.jsonl'), splits.validation);
  await fs.writeFile(path.join(datasetPath, 'test.jsonl'), splits.test);
  await fs.writeFile(path.join(datasetPath, 'holdout.jsonl'), splits.holdout);
  await writePhase3DatasetManifest(datasetPath, splits);
  const release = {
    id: releaseId,
    schemaVersion: 2 as const,
    status: 'BUILT' as const,
    name: releaseId,
    recordCount: 4,
    trainCount: 1,
    validationCount: 1,
    testCount: 1,
    holdoutCount: 1,
    manifestPath: path.join(datasetPath, 'manifest.json'),
    datasetPath,
    sourceRunIds: ['run_a'],
    sourceArtifactIds: ['artifact_a'],
    createdAt: new Date(0).toISOString(),
    frozenAt: new Date(0).toISOString(),
    audit: {},
  };
  const state = await lab.readVhdlLabState();
  await lab.writeVhdlLabState({ ...state, datasetReleases: [release, ...(state.datasetReleases || []).filter((entry: any) => entry.id !== release.id)] });
  return release;
}

async function waitForTrainingStatus(lab: any, trainingRunId: string, statuses: string[], attempts = 30) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const state = await lab.readVhdlLabState();
    const run = state.trainingRuns.find((entry: any) => entry.id === trainingRunId);
    if (run && statuses.includes(run.status)) return { state, run };
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const state = await lab.readVhdlLabState();
  return { state, run: state.trainingRuns.find((entry: any) => entry.id === trainingRunId) };
}

test('VHDL Lab can recover and resume interrupted MLX training from latest valid checkpoint', async () => {
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-resume-'));
  process.env.VHDL_LAB_DATA_ROOT = dataRoot;
  const oldCommand = process.env.VHDL_LAB_MLX_LORA_COMMAND;
  const oldProjectMlx = process.env.VHDL_LAB_ENABLE_PROJECT_MLX;
  delete process.env.VHDL_LAB_MLX_LORA_COMMAND;
  process.env.VHDL_LAB_ENABLE_PROJECT_MLX = 'false';
  try {
    const lab = await import('../src/server/vhdlImprovementLab.ts');
    await lab.ensureVhdlLabStorage();
    const release = await writeMinimalBuiltDatasetRelease(lab, dataRoot, 'dataset_resume_fixture');
    const outputPath = path.join(dataRoot, 'training', 'training_interrupted');
    const adapterPath = path.join(outputPath, 'adapter');
    await fs.mkdir(adapterPath, { recursive: true });
    const logPath = path.join(outputPath, 'training.log');
    await fs.writeFile(logPath, 'Iter 40: Train loss 0.123\n');
    await fs.writeFile(path.join(adapterPath, '0000020_adapters.safetensors'), 'checkpoint-20');
    await fs.writeFile(path.join(adapterPath, '0000040_adapters.safetensors'), 'checkpoint-40');
    const oldDate = new Date(Date.now() - 10 * 60 * 1000);
    await fs.utimes(logPath, oldDate, oldDate);
    const state = await lab.readVhdlLabState();
    const interruptedRun = {
      id: 'training_interrupted',
      status: 'RUNNING',
      datasetReleaseId: release.id,
      baseModel: 'local-mlx-model',
      adapterName: 'resume-fixture',
      config: {
        requested: { profile: 'quality_v2_repair_augmented' },
        resolved: {
          profile: 'quality_v2_repair_augmented',
          epochs: 4,
          iters: 100,
          batchSize: 1,
          gradAccumulationSteps: 8,
          effectiveBatchSize: 8,
          maxSeqLength: 4096,
          learningRate: 0.00002,
          minimumLearningRate: 0.000002,
          warmupIterations: 3,
          numLayers: -1,
          stepsPerReport: 10,
          stepsPerEval: 25,
          saveEvery: 20,
          valBatches: -1,
          testBatches: -1,
          loraParameters: { rank: 32, scale: 2, dropout: 0.05 },
        },
      },
      outputPath,
      logPath,
      checkpointIds: [],
      checkpointCatalogPath: path.join(outputPath, 'checkpoint-catalog.json'),
      requestedEarlyStoppingPolicy: null,
      resolvedEarlyStoppingPolicy: null,
      currentIteration: 40,
      totalIterations: 100,
      progressFraction: 0.4,
      createdAt: oldDate.toISOString(),
      startedAt: oldDate.toISOString(),
      completedAt: null,
      error: null,
    };
    await lab.writeVhdlLabState({ ...state, trainingRuns: [interruptedRun, ...state.trainingRuns] });

    const recovery = await lab.recoverInterruptedVhdlLabTrainingRuns({ staleMs: 1000 });
    assert.equal(recovery.changed, true);
    const recoveredState = await lab.readVhdlLabState();
    const recovered = recoveredState.trainingRuns.find((entry: any) => entry.id === interruptedRun.id);
    assert.equal(recovered.status, 'INTERRUPTED');
    assert.equal(recovered.resumableCheckpointIteration, 40);
    assert.match(recovered.resumableCheckpointPath, /0000040_adapters\.safetensors$/);

    const resumed = await lab.resumeInterruptedVhdlLabTrainingRun(interruptedRun.id);
    assert.equal(resumed.ok, true);
    if (!resumed.ok) return;
    assert.equal(resumed.trainingRun.parentTrainingRunId, interruptedRun.id);
    assert.equal(resumed.trainingRun.resumedFromCheckpointIteration, 40);
    assert.equal(resumed.trainingRun.totalIterations, 60);
    assert.equal((resumed.trainingRun.config as any).requested.iters, 60);
    assert.equal((resumed.trainingRun.config as any).requested.warmupIterations, 0);
    assert.match(resumed.trainingRun.resumedFromCheckpointPath || '', /0000040_adapters\.safetensors$/);
  } finally {
    if (oldCommand === undefined) delete process.env.VHDL_LAB_MLX_LORA_COMMAND;
    else process.env.VHDL_LAB_MLX_LORA_COMMAND = oldCommand;
    if (oldProjectMlx === undefined) delete process.env.VHDL_LAB_ENABLE_PROJECT_MLX;
    else process.env.VHDL_LAB_ENABLE_PROJECT_MLX = oldProjectMlx;
  }
});

test('VHDL Lab Phase 3 repair packets are compact and stage-specific', async () => {
  process.env.VHDL_LAB_DATA_ROOT = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-packet-'));
  const lab = await import('../src/server/vhdlImprovementLab.ts');
  const packet = lab.buildVhdlLabRepairPacket({
    stage: 'validating_interface',
    candidateAttempt: 1,
    issues: [{ code: 'interface_port_missing', path: '$.ports.done_o', message: 'Generated entity is missing port "done_o".' }],
    previousCandidatePath: '/tmp/candidate.vhd',
    content: 'entity demo is end entity;',
  });
  assert.equal(packet.failureCode, 'interface_port_missing');
  assert.equal(packet.stage, 'validating_interface');
  assert.match(packet.legalReplacement, /frozen entity/i);
  assert(packet.excerpt.length <= 360);
  assert.match(packet.contentHash || '', /^[a-f0-9]{64}$/);
});

test('VHDL Lab Phase 3 builds audited dataset releases only from accepted artifacts', async () => {
  process.env.VHDL_LAB_DATA_ROOT = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-dataset-'));
  const lab = await import('../src/server/vhdlImprovementLab.ts');
  await lab.ensureVhdlLabStorage();
  const contractResult = await lab.createVhdlLabContract({
    name: 'Phase 3 Dataset Contract',
    taskFamily: 'PHASE3_TEST',
    contractJson: makeContract(),
    sourceType: 'fixture',
  });
  assert.equal(contractResult.ok, true);
  if (!contractResult.ok) return;
  const artifactPath = path.join(process.env.VHDL_LAB_DATA_ROOT!, 'accepted.vhd');
  const vhdl = 'library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity phase3_counter is end entity;\narchitecture rtl of phase3_counter is begin end architecture;\n';
  await fs.writeFile(artifactPath, vhdl);
  const state = await lab.readVhdlLabState();
  await lab.writeVhdlLabState({
    ...state,
    acceptedArtifacts: [{
      id: 'accepted_phase3',
      runId: 'run_phase3',
      contractId: (contractResult.contract as any).id,
      contractHash: (contractResult.contract as any).contractHash,
      entityName: (contractResult.contract as any).entityName,
      artifactPath,
      contentHash: lab.sha256(vhdl),
      createdAt: new Date(0).toISOString(),
    }],
  });
  const dataset = await lab.buildVhdlLabDatasetRelease({ name: 'phase3 dataset' });
  assert.equal(dataset.ok, false);
  assert.equal(dataset.release.status, 'AUDIT_FAILED');
  assert.equal(dataset.release.schemaVersion, 2);
  assert.equal(dataset.release.testCount, 0);
  assert.equal(dataset.release.recordCount, 1);
  assert.equal((await fs.readFile(path.join(dataset.release.datasetPath, 'records.jsonl'), 'utf8')).trim().split('\n').length, 1);
});

test('VHDL Lab quality v2 dataset includes verified repair and self-contained records', async () => {
  process.env.VHDL_LAB_DATA_ROOT = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-quality-v2-dataset-'));
  const lab = await import('../src/server/vhdlImprovementLab.ts');
  await lab.ensureVhdlLabStorage();
  const contractResult = await lab.createVhdlLabContract({
    name: 'Quality v2 Repair Contract',
    taskFamily: 'PROTOCOL',
    contractJson: makeContract(),
    sourceType: 'fixture',
  });
  assert.equal(contractResult.ok, true);
  if (!contractResult.ok) return;

  const root = process.env.VHDL_LAB_DATA_ROOT!;
  const runWorkspace = path.join(root, 'runs', 'run_quality_v2');
  const artifactPath = path.join(root, 'accepted-quality-v2.vhd');
  const failedPath = path.join(runWorkspace, 'generated', 'rtl', 'phase3_counter.candidate-1.vhd');
  const repairAuditPath = path.join(runWorkspace, 'repair-audit.json');
  await fs.mkdir(path.dirname(failedPath), { recursive: true });
  const acceptedVhdl = [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'use ieee.numeric_std.all;',
    'entity phase3_counter is',
    '  generic (WIDTH : positive := 8);',
    '  port (clk : in std_logic; rst : in std_logic; count_o : out unsigned(WIDTH - 1 downto 0));',
    'end entity;',
    'architecture rtl of phase3_counter is',
    'begin',
    '  count_o <= (others => \'0\');',
    'end architecture;',
    '',
  ].join('\n');
  const failedVhdl = acceptedVhdl.replace('end architecture;', 'u_missing: entity work.missing_child; end architecture;');
  await fs.writeFile(artifactPath, acceptedVhdl);
  await fs.writeFile(failedPath, failedVhdl);
  await fs.mkdir(path.dirname(repairAuditPath), { recursive: true });
  await fs.writeFile(repairAuditPath, `${JSON.stringify({
    runId: 'run_quality_v2',
    packets: [{
      failureCode: 'missing_work_unit_dependency',
      stage: 'validating_dependencies',
      fileLine: 'phase3_counter.vhd:10',
      excerpt: 'entity work.missing_child was not declared',
      validatorOutput: 'missing_work_unit_dependency: missing_child',
      ghdlOutput: '',
      forbiddenPattern: 'entity work.X without same-file declaration',
      legalReplacement: 'Return self-contained RTL or declare the dependency in the same file before use.',
      previousCandidatePath: failedPath,
      candidateAttempt: 1,
      contentHash: hashText(failedVhdl),
      createdAt: new Date(0).toISOString(),
    }],
  }, null, 2)}\n`);

  const state = await lab.readVhdlLabState();
  const contract = contractResult.contract as any;
  await lab.writeVhdlLabState({
    ...state,
    runs: [{
      id: 'run_quality_v2',
      contractId: contract.id,
      modelProfileId: 'model',
      promptVersionId: 'prompt',
      providerId: 'ollama',
      modelName: 'model',
      seed: 42,
      temperature: 0,
      maxTokens: 1000,
      candidateCount: 1,
      maxRepairAttempts: 3,
      workspacePath: runWorkspace,
      currentStage: 'accepted',
      stageLog: [],
      repairAuditPath,
      startedAt: new Date(0).toISOString(),
      completedAt: new Date(0).toISOString(),
      cancelledAt: null,
      createdAt: new Date(0).toISOString(),
    }, ...state.runs],
    acceptedArtifacts: [{
      id: 'accepted_quality_v2',
      runId: 'run_quality_v2',
      contractId: contract.id,
      contractHash: contract.contractHash,
      entityName: contract.entityName,
      artifactPath,
      acceptedTestbenchPath: null,
      verificationStrength: 'ghdl_simulation',
      simulationRequired: true,
      passMarkerRequired: true,
      contentHash: lab.sha256(acceptedVhdl),
      createdAt: new Date(0).toISOString(),
    }],
  });

  const dataset = await lab.buildVhdlLabDatasetRelease({
    name: 'quality v2 dataset',
    sourceType: 'quality_v2_repair_augmented',
    sourceRunIds: ['run_quality_v2'],
    maxLibraryRecords: 1,
  });
  const records = (await fs.readFile(path.join(dataset.release.datasetPath, 'records.jsonl'), 'utf8'))
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const recordTypes = new Set(records.map((record) => record.recordType));
  assert(recordTypes.has('contract_to_accepted_rtl'));
  assert(recordTypes.has('contract_to_self_contained_rtl'));
  assert(recordTypes.has('failed_rtl_to_repaired_rtl'));
  assert(recordTypes.has('anti_pattern_to_safe_pattern'));
  const qualityReport = JSON.parse(await fs.readFile(path.join(dataset.release.datasetPath, 'quality_report.json'), 'utf8'));
  assert.equal(qualityReport.highValueFailureCoverage.missing_work_unit_dependency, 2);
  assert.equal((dataset.release.audit as any).qualityV2.repairAugmentedRecords, 1);
});


test('VHDL Lab Phase 3 builds dataset records from a trusted verified VHDL library', async () => {
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-verified-library-'));
  const libraryRoot = path.join(dataRoot, 'library');
  const manifestDir = path.join(libraryRoot, 'manifests', 'blocks', 'demo');
  const rtlDir = path.join(libraryRoot, 'rtl', 'blocks', 'demo');
  await fs.mkdir(manifestDir, { recursive: true });
  await fs.mkdir(rtlDir, { recursive: true });
  await fs.mkdir(path.join(libraryRoot, 'manifests'), { recursive: true });
  const rtl = [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity demo_leaf is port(clk : in std_logic; y_o : out std_logic); end entity;',
    'architecture rtl of demo_leaf is begin y_o <= clk; end architecture;',
    '',
  ].join('\n');
  await fs.writeFile(path.join(rtlDir, 'demo_leaf.vhd'), rtl);
  await fs.writeFile(path.join(manifestDir, 'demo_leaf.json'), JSON.stringify({
    block: { name: 'demo_leaf', entity: 'demo_leaf', category: 'demo', source: 'rtl/blocks/demo/demo_leaf.vhd' },
    configuration: { id: 'DEMO_LEAF', generics: [], resolved_defaults: {} },
    interface: { ports: [{ name: 'clk', direction: 'in', type: 'std_logic' }, { name: 'y_o', direction: 'out', type: 'std_logic' }], clock_ports: ['clk'], reset_ports: [] },
    contracts: { latency: { cycles: 0 } },
    maturity: { verification: 'unit test fixture' },
  }, null, 2));
  await fs.writeFile(path.join(libraryRoot, 'manifests', 'library_index.json'), JSON.stringify({
    blocks: [{ name: 'demo_leaf', category: 'demo', manifest: 'manifests/blocks/demo/demo_leaf.json' }],
  }, null, 2));
  const qualificationPath = path.join(dataRoot, 'qualification.json');
  await fs.writeFile(qualificationPath, JSON.stringify({
    libraryVersion: 'test',
    libraryRoot,
    ghdlVersion: 'GHDL test',
    verifiedAt: new Date(0).toISOString(),
    blockCount: 1,
    testbenchCount: 1,
    coreCount: 0,
    trustedForReuse: true,
    targets: {
      static: { ok: true, exitCode: 0, summary: 'ok' },
      'core-regression': { ok: true, exitCode: 0, summary: 'ok' },
      'all-smokes': { ok: true, exitCode: 0, summary: 'ok' },
    },
    warnings: [],
  }, null, 2));
  const dataset = await import('../src/server/fpgaVhdlLibraryTrainingDataset.ts');
  const result = await dataset.buildVerifiedVhdlLibraryTrainingRecords({
    libraryRoot,
    qualificationPath,
    nowIso: () => new Date(0).toISOString(),
    sha256: (value) => createHash('sha256').update(value).digest('hex'),
  });
  assert.equal(result.audit.trusted, true);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].recordType, 'verified_10k_block_to_project_rtl');
  assert.equal(result.records[0].entityName, 'demo_leaf');
  assert.match(result.records[0].completion, /entity demo_leaf/);
});

test('VHDL Lab Phase 3 dataset builder supports capped verified 10k releases', async () => {
  process.env.VHDL_LAB_DATA_ROOT = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-verified-10k-release-'));
  const lab = await import('../src/server/vhdlImprovementLab.ts');
  await lab.ensureVhdlLabStorage();
  const release = await lab.buildVhdlLabDatasetRelease({
    name: 'verified 10k capped dataset',
    sourceType: 'verified_10k_blocks',
    maxLibraryRecords: 2,
  });
  assert.equal(release.ok, false);
  assert.equal(release.release.status, 'AUDIT_FAILED');
  assert.equal(release.release.schemaVersion, 2);
  assert.equal(release.release.recordCount, 2);
  assert.equal(release.release.audit.sourceType, 'verified_10k_blocks');
  assert.equal((release.release.audit.verified10k as any).trusted, true);
  const records = (await fs.readFile(path.join(release.release.datasetPath, 'records.jsonl'), 'utf8')).trim().split('\n');
  assert.equal(records.length, 2);
  assert.equal(JSON.parse(records[0]).recordType, 'verified_10k_block_to_project_rtl');
});

test('VHDL Lab Phase 3 queues benchmark child runs and prompt candidates', async () => {
  process.env.VHDL_LAB_DATA_ROOT = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-benchmark-'));
  const lab = await import('../src/server/vhdlImprovementLab.ts');
  await lab.ensureVhdlLabStorage();
  const contractResult = await lab.createVhdlLabContract({
    name: 'Phase 3 Benchmark Contract',
    taskFamily: 'PHASE3_TEST',
    contractJson: makeContract(),
    sourceType: 'fixture',
  });
  assert.equal(contractResult.ok, true);
  if (!contractResult.ok) return;
  const optimize = await lab.createVhdlLabPromptOptimization({ promptTemplateId: 'prompt_template_vhdl_rtl_generator' });
  assert.equal(optimize.ok, true);
  if (!optimize.ok) return;
  assert.equal(optimize.promptVersion.status, 'CANDIDATE');
  const benchmark = await lab.queueVhdlLabBenchmark({
    suiteId: 'smoke_core_contracts',
    contractIds: [(contractResult.contract as any).id],
    promptVersionId: optimize.promptVersion.id,
    seedList: [42, 43],
  });
  assert.equal(benchmark.ok, true);
  if (!benchmark.ok) return;
  assert.equal(benchmark.benchmark.childRunIds.length, 2);
});

test('VHDL Lab Phase 3 benchmark finalizer marks interrupted child runs instead of ghost running', async () => {
  process.env.VHDL_LAB_DATA_ROOT = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-interrupted-benchmark-'));
  const lab = await import('../src/server/vhdlImprovementLab.ts');
  await lab.ensureVhdlLabStorage();
  const contractResult = await lab.createVhdlLabContract({
    name: 'Interrupted Benchmark Contract',
    taskFamily: 'PHASE3_TEST',
    contractJson: makeContract(),
    sourceType: 'fixture',
  });
  assert.equal(contractResult.ok, true);
  if (!contractResult.ok) return;
  const state = await lab.readVhdlLabState();
  const runId = 'run_interrupted_benchmark_child';
  await lab.writeVhdlLabState({
    ...state,
    runs: [{
      id: runId,
      contractId: (contractResult.contract as any).id,
      modelProfileId: null,
      promptVersionId: state.promptVersions[0].id,
      verificationProfileId: state.verificationProfiles[0].id,
      runType: 'BENCHMARK' as const,
      status: 'GENERATING' as const,
      seed: 42,
      temperature: 0.1,
      maxTokens: 512,
      candidateCount: 1,
      maxRepairAttempts: 3,
      workspacePath: path.join(process.env.VHDL_LAB_DATA_ROOT!, 'runs', runId),
      currentStage: 'generating',
      stageLog: [],
      benchmarkSuiteId: 'smoke_core_contracts',
      datasetReleaseId: null,
      promptVersionIds: [state.promptVersions[0].id],
      seedList: [42],
      metrics: {},
      repairAuditPath: path.join(process.env.VHDL_LAB_DATA_ROOT!, 'runs', runId, 'repair-audit.json'),
      startedAt: new Date(0).toISOString(),
      completedAt: null,
      cancelledAt: null,
      createdAt: new Date(0).toISOString(),
    }, ...state.runs],
    benchmarkRuns: [{
      id: 'benchmark_interrupted_child',
      suiteId: 'smoke_core_contracts',
      status: 'RUNNING' as const,
      contractIds: [(contractResult.contract as any).id],
      childRunIds: [runId],
      modelProfileId: null,
      promptVersionId: state.promptVersions[0].id,
      seedList: [42],
      maxRepairAttempts: 3,
      summary: { total: 1, passed: 0, failed: 0, running: 1, passRate: 0 },
      resultPath: path.join(process.env.VHDL_LAB_DATA_ROOT!, 'benchmarks', 'benchmark_interrupted_child', 'summary.json'),
      createdAt: new Date(0).toISOString(),
      completedAt: null,
    }, ...(state.benchmarkRuns || [])],
  });
  await lab.finalizeVhdlLabBenchmarks();
  const finalState = await lab.readVhdlLabState();
  const finalRun = finalState.runs.find((run) => run.id === runId);
  const finalBenchmark = (finalState.benchmarkRuns || []).find((benchmark) => benchmark.id === 'benchmark_interrupted_child');
  assert.equal(finalRun?.status, 'FAILED');
  assert.match(finalRun?.stageLog.at(-1)?.message || '', /run_interrupted/);
  assert.equal(finalBenchmark?.status, 'FAILED');
  assert.equal(finalBenchmark?.summary.running, 0);
});

test('VHDL Lab Phase 3 finalizer settles interrupted adapter benchmarks without child runs', async () => {
  process.env.VHDL_LAB_DATA_ROOT = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-interrupted-adapter-benchmark-'));
  const lab = await import('../src/server/vhdlImprovementLab.ts');
  await lab.ensureVhdlLabStorage();
  const state = await lab.readVhdlLabState();
  await lab.writeVhdlLabState({
    ...state,
    benchmarkRuns: [{
      id: 'benchmark_interrupted_adapter',
      suiteId: 'checkpoint_adapter_generation:smoke_core_contracts',
      status: 'RUNNING' as const,
      contractIds: ['contract_a', 'contract_b'],
      childRunIds: [],
      modelProfileId: null,
      promptVersionId: state.promptVersions[0].id,
      seedList: [42],
      maxRepairAttempts: 3,
      summary: { total: 2, passed: 1, failed: 0, running: 1, passRate: 0.5, results: [{ passed: true }] },
      resultPath: path.join(process.env.VHDL_LAB_DATA_ROOT!, 'benchmarks', 'benchmark_interrupted_adapter', 'summary.json'),
      createdAt: new Date(0).toISOString(),
      completedAt: null,
    }, ...(state.benchmarkRuns || [])],
  });
  await lab.finalizeVhdlLabBenchmarks();
  const finalState = await lab.readVhdlLabState();
  const finalBenchmark = (finalState.benchmarkRuns || []).find((benchmark) => benchmark.id === 'benchmark_interrupted_adapter');
  assert.equal(finalBenchmark?.status, 'FAILED');
  assert.equal(finalBenchmark?.summary.running, 0);
  assert.equal(finalBenchmark?.summary.interrupted, 1);
  assert.equal(finalBenchmark?.summary.failed, 1);
});

test('VHDL Lab Phase 3 reports MLX unavailable without failing the app', async () => {
  process.env.VHDL_LAB_DATA_ROOT = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-training-'));
  const oldPath = process.env.PATH;
  const oldProjectMlx = process.env.VHDL_LAB_ENABLE_PROJECT_MLX;
  process.env.PATH = '/nonexistent';
  process.env.VHDL_LAB_ENABLE_PROJECT_MLX = 'false';
  try {
    const lab = await import('../src/server/vhdlImprovementLab.ts');
    await lab.ensureVhdlLabStorage();
    const state = await lab.readVhdlLabState();
    const release = {
      id: 'dataset_training_test',
      schemaVersion: 2 as const,
      status: 'BUILT' as const,
      name: 'training test',
      recordCount: 4,
      trainCount: 1,
      validationCount: 1,
      testCount: 1,
      holdoutCount: 1,
      manifestPath: '/tmp/manifest.json',
      datasetPath: '/tmp/dataset',
      sourceRunIds: ['run_a'],
      sourceArtifactIds: ['artifact_a'],
      createdAt: new Date(0).toISOString(),
      frozenAt: new Date(0).toISOString(),
      audit: {},
    };
    await lab.writeVhdlLabState({ ...state, datasetReleases: [release] });
    const training = await lab.createVhdlLabTrainingRun({ datasetReleaseId: release.id, baseModel: 'local' });
    assert.equal(training.ok, true);
    assert.equal(training.trainingRun.status, 'BLOCKED_MLX_UNAVAILABLE');
    assert.match(training.trainingRun.error || '', /mlx_lm\.lora/i);
  } finally {
    process.env.PATH = oldPath;
    if (oldProjectMlx === undefined) delete process.env.VHDL_LAB_ENABLE_PROJECT_MLX;
    else process.env.VHDL_LAB_ENABLE_PROJECT_MLX = oldProjectMlx;
  }
});

test('VHDL Lab Phase 3 creates a fresh training run for repeated same dataset and model launches', async () => {
  process.env.VHDL_LAB_DATA_ROOT = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-training-unique-'));
  const oldPath = process.env.PATH;
  const oldProjectMlx = process.env.VHDL_LAB_ENABLE_PROJECT_MLX;
  process.env.PATH = '/nonexistent';
  process.env.VHDL_LAB_ENABLE_PROJECT_MLX = 'false';
  try {
    const lab = await import('../src/server/vhdlImprovementLab.ts');
    await lab.ensureVhdlLabStorage();
    const state = await lab.readVhdlLabState();
    const release = {
      id: 'dataset_training_unique_test',
      schemaVersion: 2 as const,
      status: 'BUILT' as const,
      name: 'training unique test',
      recordCount: 160,
      trainCount: 100,
      validationCount: 20,
      testCount: 20,
      holdoutCount: 20,
      manifestPath: '/tmp/manifest.json',
      datasetPath: '/tmp/dataset',
      sourceRunIds: ['run_a'],
      sourceArtifactIds: ['artifact_a'],
      createdAt: new Date(0).toISOString(),
      frozenAt: new Date(0).toISOString(),
      audit: {},
    };
    await lab.writeVhdlLabState({ ...state, datasetReleases: [release] });
    const first = await lab.createVhdlLabTrainingRun({ datasetReleaseId: release.id, baseModel: 'local' });
    const second = await lab.createVhdlLabTrainingRun({ datasetReleaseId: release.id, baseModel: 'local' });
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    assert.notEqual(first.trainingRun.id, second.trainingRun.id);
    const nextState = await lab.readVhdlLabState();
    assert.equal(nextState.trainingRuns.filter((run) => run.datasetReleaseId === release.id).length, 2);
  } finally {
    process.env.PATH = oldPath;
    if (oldProjectMlx === undefined) delete process.env.VHDL_LAB_ENABLE_PROJECT_MLX;
    else process.env.VHDL_LAB_ENABLE_PROJECT_MLX = oldProjectMlx;
  }
});

test('VHDL Lab Phase 3 launches local MLX LoRA training and records a checkpoint', async () => {
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-mlx-run-'));
  process.env.VHDL_LAB_DATA_ROOT = dataRoot;
  const oldCommand = process.env.VHDL_LAB_MLX_LORA_COMMAND;
  const fakeCommand = path.join(dataRoot, 'fake-mlx-lora.sh');
  await fs.writeFile(fakeCommand, [
    '#!/bin/sh',
    'printf "%s\\n" "$@" > "$PWD/invocation.args"',
    'if echo "$@" | grep -q "best-adapter-test-config"; then',
    '  echo "Test loss 0.321, Test ppl 1.378."',
    '  exit 0',
    'fi',
    'mkdir -p "$PWD/adapter"',
    'printf "weights" > "$PWD/adapter/0000100_adapters.safetensors"',
    'printf "final" > "$PWD/adapter/adapters.safetensors"',
    'printf "{\\"adapter\\":\\"lora\\"}\\n" > "$PWD/adapter/adapter_config.json"',
    'echo "Trainable parameters: 0.123% (45.678M/37000.000M)"',
    'echo "Iter 10: Train loss 0.900"',
    'echo "Iter 100: Val loss 0.500, Val took 1.0s"',
    'echo "Peak mem 2.5 GB"',
    'exit 0',
    '',
  ].join('\n'));
  await fs.chmod(fakeCommand, 0o755);
  process.env.VHDL_LAB_MLX_LORA_COMMAND = fakeCommand;
  try {
    const lab = await import('../src/server/vhdlImprovementLab.ts');
    await lab.ensureVhdlLabStorage();
    const datasetPath = path.join(dataRoot, 'qualified-dataset');
    await fs.mkdir(datasetPath, { recursive: true });
    const splits = {
      train: `${JSON.stringify({ prompt: 'contract', completion: 'rtl train' })}\n`,
      validation: `${JSON.stringify({ prompt: 'contract', completion: 'rtl validation' })}\n`,
      test: `${JSON.stringify({ prompt: 'contract', completion: 'rtl test' })}\n`,
      holdout: `${JSON.stringify({ prompt: 'contract', completion: 'rtl holdout' })}\n`,
    };
    await fs.writeFile(path.join(datasetPath, 'train.jsonl'), splits.train);
    await fs.writeFile(path.join(datasetPath, 'validation.jsonl'), splits.validation);
    await fs.writeFile(path.join(datasetPath, 'test.jsonl'), splits.test);
    await fs.writeFile(path.join(datasetPath, 'holdout.jsonl'), splits.holdout);
    await writePhase3DatasetManifest(datasetPath, splits);
    const state = await lab.readVhdlLabState();
    const release = {
      id: 'dataset_mlx_launch_test',
      schemaVersion: 2 as const,
      status: 'BUILT' as const,
      name: 'mlx launch test',
      recordCount: 4,
      trainCount: 1,
      validationCount: 1,
      testCount: 1,
      holdoutCount: 1,
      manifestPath: path.join(datasetPath, 'manifest.json'),
      datasetPath,
      sourceRunIds: ['run_a'],
      sourceArtifactIds: ['artifact_a'],
      createdAt: new Date(0).toISOString(),
      frozenAt: new Date(0).toISOString(),
      audit: {},
    };
    await lab.writeVhdlLabState({ ...state, datasetReleases: [release] });
    const training = await lab.createVhdlLabTrainingRun({
      datasetReleaseId: release.id,
      baseModel: 'local-mlx-model',
      config: { profile: 'quality_v1' },
    });
    assert.equal(training.ok, true);
    if (!training.ok) return;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const nextState = await lab.readVhdlLabState();
      const nextRun = nextState.trainingRuns.find((entry) => entry.id === training.trainingRun.id);
      if (nextRun?.status === 'COMPLETED') break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    const finalState = await lab.readVhdlLabState();
    const finalRun = finalState.trainingRuns.find((entry) => entry.id === training.trainingRun.id);
    assert.equal(finalRun?.status, 'COMPLETED');
    assert.equal(finalRun?.checkpointIds.length, 1);
    assert.match(await fs.readFile(path.join(training.trainingRun.outputPath, 'invocation.args'), 'utf8'), /--config/);
    assert.match(await fs.readFile(path.join(training.trainingRun.outputPath, 'mlx-lora-config.yaml'), 'utf8'), /max_seq_length: 4096/);
    const mlxTrainRecord = JSON.parse((await fs.readFile(path.join(training.trainingRun.outputPath, 'mlx-data', 'train.jsonl'), 'utf8')).trim().split(/\r?\n/)[0]);
    assert.equal(Array.isArray(mlxTrainRecord.messages), true);
    assert.equal(typeof mlxTrainRecord.messages[1].content, 'string');
    const checkpoint = (finalState.checkpoints || []).find((entry) => entry.trainingRunId === training.trainingRun.id);
    assert(checkpoint);
    assert.match(checkpoint.checkpointPath, /best-adapter$/);
    assert.equal(checkpoint.metrics.mlxHeldoutTestLoss, 0.321);
    assert.equal(checkpoint.metrics.mlxHeldoutTestPpl, 1.378);
    assert.equal(checkpoint.metrics.trainCount, 1);
    assert.equal(checkpoint.metrics.validationCount, 1);
    assert.equal(checkpoint.metrics.testCount, 1);
    assert.equal(checkpoint.metrics.holdoutCount, 1);
    assert.equal(checkpoint.metrics.datasetManifestSha256, hashText(await fs.readFile(release.manifestPath, 'utf8')));
    assert.equal(checkpoint.metrics.selectedAdapterWeightsSizeBytes, Buffer.byteLength('weights'));
    assert.equal(checkpoint.metrics.adapterConfigSizeBytes, Buffer.byteLength('{"adapter":"lora"}\n'));
    const selection = JSON.parse(await fs.readFile(path.join(checkpoint.checkpointPath, 'selection.json'), 'utf8'));
    assert.equal(selection.weightsSizeBytes, checkpoint.metrics.selectedAdapterWeightsSizeBytes);
    assert.equal(selection.adapterConfigSizeBytes, checkpoint.metrics.adapterConfigSizeBytes);
    assert.equal(selection.weightsSha256, hashText(await fs.readFile(path.join(checkpoint.checkpointPath, 'adapters.safetensors'), 'utf8')));
    assert.equal(selection.adapterConfigSha256, hashText(await fs.readFile(path.join(checkpoint.checkpointPath, 'adapter_config.json'), 'utf8')));
  } finally {
    if (oldCommand === undefined) delete process.env.VHDL_LAB_MLX_LORA_COMMAND;
    else process.env.VHDL_LAB_MLX_LORA_COMMAND = oldCommand;
  }
});

test('VHDL Lab Phase 3 early-stops from validation policy and materializes best prior checkpoint', async () => {
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-early-stop-'));
  process.env.VHDL_LAB_DATA_ROOT = dataRoot;
  const oldCommand = process.env.VHDL_LAB_MLX_LORA_COMMAND;
  const fakeCommand = path.join(dataRoot, 'fake-mlx-lora.sh');
  await fs.writeFile(fakeCommand, [
    '#!/bin/sh',
    'trap "exit 0" TERM',
    'if echo "$@" | grep -q "best-adapter-test-config"; then',
    '  echo "Test loss 0.222, Test ppl 1.248."',
    '  exit 0',
    'fi',
    'mkdir -p "$PWD/adapter"',
    'printf "{\\"adapter\\":\\"lora\\"}\\n" > "$PWD/adapter/adapter_config.json"',
    'printf "best-10" > "$PWD/adapter/10_adapters.safetensors"',
    'echo "Iter 10: Val loss 0.500, Val took 1.0s"',
    'sleep 0.1',
    'printf "worse-20" > "$PWD/adapter/20_adapters.safetensors"',
    'echo "Iter 20: Val loss 0.900, Val took 1.0s"',
    'sleep 1',
    'printf "final" > "$PWD/adapter/adapters.safetensors"',
    'exit 0',
    '',
  ].join('\n'));
  await fs.chmod(fakeCommand, 0o755);
  process.env.VHDL_LAB_MLX_LORA_COMMAND = fakeCommand;
  try {
    const lab = await import('../src/server/vhdlImprovementLab.ts');
    await lab.ensureVhdlLabStorage();
    const release = await writeMinimalBuiltDatasetRelease(lab, dataRoot, 'dataset_early_stop');
    const training = await lab.createVhdlLabTrainingRun({
      datasetReleaseId: release.id,
      baseModel: 'local-mlx-model',
      config: {
        profile: 'quality_v1',
        earlyStoppingPolicy: {
          enabled: true,
          minimumValidationEvents: 2,
          patienceValidationEvents: 1,
          hardRegressionRelativeThreshold: null,
        },
      },
    });
    assert.equal(training.ok, true);
    if (!training.ok) return;
    let finalState: any = null;
    let run: any = null;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      finalState = await lab.readVhdlLabState();
      run = finalState.trainingRuns.find((entry: any) => entry.id === training.trainingRun.id);
      const checkpointReady = (finalState.checkpoints || []).some((entry: any) => entry.trainingRunId === training.trainingRun.id);
      if ((run?.status === 'EARLY_STOPPED' || run?.status === 'FAILED') && run?.completedAt && checkpointReady) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.equal(run?.status, 'EARLY_STOPPED');
    assert.equal(run?.earlyStopReason, 'VALIDATION_PATIENCE_EXHAUSTED');
    assert.equal(run?.bestValidationIteration, 10);
    assert.equal(run?.selectedCheckpointIteration, 10);
    const checkpoint = (finalState.checkpoints || []).find((entry: any) => entry.trainingRunId === training.trainingRun.id);
    assert(checkpoint);
    assert.equal(await fs.readFile(path.join(checkpoint.checkpointPath, 'adapters.safetensors'), 'utf8'), 'best-10');
    const catalog = JSON.parse(await fs.readFile(path.join(training.trainingRun.outputPath, 'checkpoint-catalog.json'), 'utf8'));
    assert.equal(catalog.earlyStopping.stopRequested, true);
    assert.equal(catalog.currentBest.selectedCheckpointIteration, 10);
    await fs.stat(path.join(training.trainingRun.outputPath, 'adapter', '20_adapters.safetensors'));
  } finally {
    if (oldCommand === undefined) delete process.env.VHDL_LAB_MLX_LORA_COMMAND;
    else process.env.VHDL_LAB_MLX_LORA_COMMAND = oldCommand;
  }
});

test('VHDL Lab Phase 3 derives quality_v1 iterations from verified physical train records', async () => {
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-verified-iters-'));
  process.env.VHDL_LAB_DATA_ROOT = dataRoot;
  const oldCommand = process.env.VHDL_LAB_MLX_LORA_COMMAND;
  const fakeCommand = path.join(dataRoot, 'fake-mlx-lora.sh');
  await fs.writeFile(fakeCommand, [
    '#!/bin/sh',
    'if echo "$@" | grep -q "best-adapter-test-config"; then',
    '  echo "Test loss 0.321, Test ppl 1.378."',
    '  exit 0',
    'fi',
    'mkdir -p "$PWD/adapter"',
    'printf "weights" > "$PWD/adapter/adapters.safetensors"',
    'printf "{\\"adapter\\":\\"lora\\"}\\n" > "$PWD/adapter/adapter_config.json"',
    'echo "Iter 9: Val loss 0.500, Val took 1.0s"',
    'exit 0',
    '',
  ].join('\n'));
  await fs.chmod(fakeCommand, 0o755);
  process.env.VHDL_LAB_MLX_LORA_COMMAND = fakeCommand;
  try {
    const lab = await import('../src/server/vhdlImprovementLab.ts');
    await lab.ensureVhdlLabStorage();
    const datasetPath = path.join(dataRoot, 'qualified-dataset');
    await fs.mkdir(datasetPath, { recursive: true });
    const train = [0, 1, 2].map((index) => `${JSON.stringify({ prompt: `train-${index}`, completion: `rtl train ${index}` })}\n`).join('');
    const splits = {
      train,
      validation: `${JSON.stringify({ prompt: 'validation', completion: 'rtl validation' })}\n`,
      test: `${JSON.stringify({ prompt: 'test', completion: 'rtl test' })}\n`,
      holdout: `${JSON.stringify({ prompt: 'holdout', completion: 'rtl holdout' })}\n`,
    };
    await Promise.all(Object.entries(splits).map(([split, content]) => fs.writeFile(path.join(datasetPath, `${split}.jsonl`), content)));
    await writePhase3DatasetManifest(datasetPath, splits);
    const state = await lab.readVhdlLabState();
    const release = {
      id: 'dataset_verified_iter_count',
      schemaVersion: 2 as const,
      status: 'BUILT' as const,
      name: 'verified iter count',
      recordCount: 6,
      trainCount: 3,
      validationCount: 1,
      testCount: 1,
      holdoutCount: 1,
      manifestPath: path.join(datasetPath, 'manifest.json'),
      datasetPath,
      sourceRunIds: ['run_a'],
      sourceArtifactIds: ['artifact_a'],
      createdAt: new Date(0).toISOString(),
      frozenAt: new Date(0).toISOString(),
      audit: {},
    };
    await lab.writeVhdlLabState({ ...state, datasetReleases: [release] });
    const training = await lab.createVhdlLabTrainingRun({
      datasetReleaseId: release.id,
      baseModel: 'local-mlx-model',
      config: { profile: 'quality_v1' },
    });
    assert.equal(training.ok, true);
    if (!training.ok) return;
    const { state: finalState, run } = await waitForTrainingStatus(lab, training.trainingRun.id, ['COMPLETED']);
    assert.equal(run?.status, 'COMPLETED');
    assert.match(await fs.readFile(path.join(training.trainingRun.outputPath, 'mlx-lora-config.yaml'), 'utf8'), /iters: 9/);
    assert.match(await fs.readFile(training.trainingRun.logPath, 'utf8'), /Verified train\/validation\/test\/holdout counts: 3\/1\/1\/1/);
    const checkpoint = (finalState.checkpoints || []).find((entry: any) => entry.trainingRunId === training.trainingRun.id);
    assert.equal(checkpoint?.metrics.iters, 9);
    assert.equal(checkpoint?.metrics.trainCount, 3);
  } finally {
    if (oldCommand === undefined) delete process.env.VHDL_LAB_MLX_LORA_COMMAND;
    else process.env.VHDL_LAB_MLX_LORA_COMMAND = oldCommand;
  }
});

test('VHDL Lab Phase 3 rejects stale release train count before launching MLX iterations', async () => {
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-stale-release-count-'));
  process.env.VHDL_LAB_DATA_ROOT = dataRoot;
  const oldCommand = process.env.VHDL_LAB_MLX_LORA_COMMAND;
  const fakeCommand = path.join(dataRoot, 'fake-mlx-lora.sh');
  await fs.writeFile(fakeCommand, '#!/bin/sh\necho "should not run"\nexit 0\n');
  await fs.chmod(fakeCommand, 0o755);
  process.env.VHDL_LAB_MLX_LORA_COMMAND = fakeCommand;
  try {
    const lab = await import('../src/server/vhdlImprovementLab.ts');
    await lab.ensureVhdlLabStorage();
    const release = await writeMinimalBuiltDatasetRelease(lab, dataRoot, 'dataset_stale_train_count');
    const datasetPath = release.datasetPath;
    const train = [0, 1, 2].map((index) => `${JSON.stringify({ prompt: `train-${index}`, completion: `rtl train ${index}` })}\n`).join('');
    await fs.writeFile(path.join(datasetPath, 'train.jsonl'), train);
    const splits = {
      train,
      validation: await fs.readFile(path.join(datasetPath, 'validation.jsonl'), 'utf8'),
      test: await fs.readFile(path.join(datasetPath, 'test.jsonl'), 'utf8'),
      holdout: await fs.readFile(path.join(datasetPath, 'holdout.jsonl'), 'utf8'),
    };
    await writePhase3DatasetManifest(datasetPath, splits);
    const state = await lab.readVhdlLabState();
    await lab.writeVhdlLabState({
      ...state,
      datasetReleases: [{ ...release, recordCount: 6, trainCount: 1 }, ...state.datasetReleases.filter((entry: any) => entry.id !== release.id)],
    });
    const training = await lab.createVhdlLabTrainingRun({
      datasetReleaseId: release.id,
      baseModel: 'local-mlx-model',
      config: { profile: 'quality_v1' },
    });
    assert.equal(training.ok, true);
    if (!training.ok) return;
    const { state: finalState, run } = await waitForTrainingStatus(lab, training.trainingRun.id, ['FAILED']);
    assert.equal(run?.status, 'FAILED');
    assert.match(run?.error || '', /Dataset release\/count mismatch: release trainCount=1, but train\.jsonl contains 3 records/);
    assert.equal((finalState.checkpoints || []).filter((entry: any) => entry.trainingRunId === training.trainingRun.id).length, 0);
  } finally {
    if (oldCommand === undefined) delete process.env.VHDL_LAB_MLX_LORA_COMMAND;
    else process.env.VHDL_LAB_MLX_LORA_COMMAND = oldCommand;
  }
});

test('VHDL Lab Phase 3 rejects corrupted MLX adapter artifacts and unparseable test metrics', async () => {
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-mlx-failures-'));
  process.env.VHDL_LAB_DATA_ROOT = dataRoot;
  const oldCommand = process.env.VHDL_LAB_MLX_LORA_COMMAND;
  const fakeCommand = path.join(dataRoot, 'fake-mlx-lora.sh');
  await fs.writeFile(fakeCommand, [
    '#!/bin/sh',
    'mkdir -p "$PWD/adapter"',
    'printf "weights" > "$PWD/adapter/0000100_adapters.safetensors"',
    'printf "final" > "$PWD/adapter/adapters.safetensors"',
    'echo "Iter 100: Val loss 0.500, Val took 1.0s"',
    'if [ "$MLX_TEST_WITHOUT_METRICS" = "1" ] && echo "$@" | grep -q "best-adapter-test-config"; then',
    '  echo "test completed without metrics"',
    '  exit 0',
    'fi',
    'if [ "$MLX_WRITE_CONFIG" = "1" ]; then',
    '  printf "{\\"adapter\\":\\"lora\\"}\\n" > "$PWD/adapter/adapter_config.json"',
    'fi',
    'if echo "$@" | grep -q "best-adapter-test-config"; then',
    '  echo "Test loss 0.321, Test ppl 1.378."',
    'fi',
    'exit 0',
    '',
  ].join('\n'));
  await fs.chmod(fakeCommand, 0o755);
  process.env.VHDL_LAB_MLX_LORA_COMMAND = fakeCommand;
  try {
    const lab = await import('../src/server/vhdlImprovementLab.ts');
    await lab.ensureVhdlLabStorage();
    const releaseMissingConfig = await writeMinimalBuiltDatasetRelease(lab, dataRoot, 'dataset_missing_adapter_config');
    const missingConfigRun = await lab.createVhdlLabTrainingRun({
      datasetReleaseId: releaseMissingConfig.id,
      baseModel: 'local-mlx-model',
      config: { profile: 'quality_v1' },
    });
    assert.equal(missingConfigRun.ok, true);
    if (!missingConfigRun.ok) return;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const state = await lab.readVhdlLabState();
      const run = state.trainingRuns.find((entry: any) => entry.id === missingConfigRun.trainingRun.id);
      if (run?.status === 'FAILED') break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    let state = await lab.readVhdlLabState();
    let run = state.trainingRuns.find((entry: any) => entry.id === missingConfigRun.trainingRun.id);
    assert.equal(run?.status, 'FAILED');
    assert.match(run?.error || '', /MLX adapter_config\.json is missing/);
    assert.equal((state.checkpoints || []).filter((entry: any) => entry.trainingRunId === missingConfigRun.trainingRun.id).length, 0);
    await fs.stat(path.join(missingConfigRun.trainingRun.outputPath, 'adapter'));

    process.env.MLX_WRITE_CONFIG = '1';
    process.env.MLX_TEST_WITHOUT_METRICS = '1';
    const releaseNoMetrics = await writeMinimalBuiltDatasetRelease(lab, dataRoot, 'dataset_unparseable_test_metrics');
    const noMetricsRun = await lab.createVhdlLabTrainingRun({
      datasetReleaseId: releaseNoMetrics.id,
      baseModel: 'local-mlx-model',
      config: { profile: 'quality_v1' },
    });
    assert.equal(noMetricsRun.ok, true);
    if (!noMetricsRun.ok) return;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      state = await lab.readVhdlLabState();
      run = state.trainingRuns.find((entry: any) => entry.id === noMetricsRun.trainingRun.id);
      if (run?.status === 'FAILED') break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    state = await lab.readVhdlLabState();
    run = state.trainingRuns.find((entry: any) => entry.id === noMetricsRun.trainingRun.id);
    assert.equal(run?.status, 'FAILED');
    assert.match(run?.error || '', /Test loss could not be parsed/);
    assert.equal((state.checkpoints || []).filter((entry: any) => entry.trainingRunId === noMetricsRun.trainingRun.id).length, 0);
    await fs.stat(path.join(noMetricsRun.trainingRun.outputPath, 'best-adapter'));
  } finally {
    delete process.env.MLX_WRITE_CONFIG;
    delete process.env.MLX_TEST_WITHOUT_METRICS;
    if (oldCommand === undefined) delete process.env.VHDL_LAB_MLX_LORA_COMMAND;
    else process.env.VHDL_LAB_MLX_LORA_COMMAND = oldCommand;
  }
});

test('VHDL Lab Phase 3 rejects empty adapter files and nonzero isolated test evaluation without checkpointing', async () => {
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-mlx-finalization-failures-'));
  process.env.VHDL_LAB_DATA_ROOT = dataRoot;
  const oldCommand = process.env.VHDL_LAB_MLX_LORA_COMMAND;
  const fakeCommand = path.join(dataRoot, 'fake-mlx-lora.sh');
  await fs.writeFile(fakeCommand, [
    '#!/bin/sh',
    'if echo "$@" | grep -q "best-adapter-test-config"; then',
    '  if [ "$MLX_TEST_EXIT_NONZERO" = "1" ]; then',
    '    echo "forced test failure"',
    '    exit 7',
    '  fi',
    '  echo "Test loss 0.321, Test ppl 1.378."',
    '  exit 0',
    'fi',
    'mkdir -p "$PWD/adapter"',
    'if [ "$MLX_EMPTY_WEIGHTS" = "1" ]; then : > "$PWD/adapter/adapters.safetensors"; else printf "final" > "$PWD/adapter/adapters.safetensors"; fi',
    'if [ "$MLX_EMPTY_CONFIG" = "1" ]; then : > "$PWD/adapter/adapter_config.json"; else printf "{\\"adapter\\":\\"lora\\"}\\n" > "$PWD/adapter/adapter_config.json"; fi',
    'echo "Iter 100: Val loss 0.500, Val took 1.0s"',
    'exit 0',
    '',
  ].join('\n'));
  await fs.chmod(fakeCommand, 0o755);
  process.env.VHDL_LAB_MLX_LORA_COMMAND = fakeCommand;
  try {
    const lab = await import('../src/server/vhdlImprovementLab.ts');
    await lab.ensureVhdlLabStorage();

    const runFailureCase = async (releaseId: string, env: Record<string, string>, expected: RegExp, retainedPath: string) => {
      const previous: Record<string, string | undefined> = {};
      for (const [key, value] of Object.entries(env)) {
        previous[key] = process.env[key];
        process.env[key] = value;
      }
      try {
        const release = await writeMinimalBuiltDatasetRelease(lab, dataRoot, releaseId);
        const training = await lab.createVhdlLabTrainingRun({
          datasetReleaseId: release.id,
          baseModel: 'local-mlx-model',
          config: { profile: 'quality_v1' },
        });
        assert.equal(training.ok, true);
        if (!training.ok) return;
        const { state, run } = await waitForTrainingStatus(lab, training.trainingRun.id, ['FAILED']);
        assert.equal(run?.status, 'FAILED');
        assert.match(run?.error || '', expected);
        assert.equal((state.checkpoints || []).filter((entry: any) => entry.trainingRunId === training.trainingRun.id).length, 0);
        await fs.stat(path.join(training.trainingRun.outputPath, retainedPath));
      } finally {
        for (const key of Object.keys(env)) {
          if (previous[key] === undefined) delete process.env[key];
          else process.env[key] = previous[key];
        }
      }
    };

    await runFailureCase('dataset_empty_weights', { MLX_EMPTY_WEIGHTS: '1' }, /Selected adapter weights is missing or empty|No final or intermediate adapter weights were produced/, 'adapter');
    await runFailureCase('dataset_empty_config', { MLX_EMPTY_CONFIG: '1' }, /MLX adapter_config\.json is missing or empty/, 'adapter');
    await runFailureCase('dataset_nonzero_test_eval', { MLX_TEST_EXIT_NONZERO: '1' }, /Best-adapter test evaluation failed/, 'best-adapter');
  } finally {
    if (oldCommand === undefined) delete process.env.VHDL_LAB_MLX_LORA_COMMAND;
    else process.env.VHDL_LAB_MLX_LORA_COMMAND = oldCommand;
  }
});

test('VHDL Lab Phase 3 benchmarks a checkpoint by generating and validating RTL with the adapter', async () => {
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-checkpoint-bench-'));
  process.env.VHDL_LAB_DATA_ROOT = dataRoot;
  const oldLoraCommand = process.env.VHDL_LAB_MLX_LORA_COMMAND;
  const oldGenerateCommand = process.env.VHDL_LAB_MLX_GENERATE_COMMAND;
  const fakeLoraCommand = path.join(dataRoot, 'fake-mlx-lora.sh');
  const fakeGenerateCommand = path.join(dataRoot, 'fake-mlx-generate.sh');
  await fs.writeFile(fakeLoraCommand, '#!/bin/sh\nexit 0\n');
  await fs.writeFile(fakeGenerateCommand, `#!/bin/sh
cat >/dev/null
cat <<'VHDL'
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity phase3_counter is
  generic (
    WIDTH : positive := 8
  );
  port (
    clk : in std_logic;
    rst : in std_logic;
    count_o : out unsigned(WIDTH - 1 downto 0)
  );
end entity phase3_counter;

architecture rtl of phase3_counter is
  signal count_r : unsigned(WIDTH - 1 downto 0) := (others => '0');
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        count_r <= (others => '0');
      else
        count_r <= count_r + 1;
      end if;
    end if;
  end process;
  count_o <= count_r;
end architecture rtl;
VHDL
`);
  await fs.chmod(fakeLoraCommand, 0o755);
  await fs.chmod(fakeGenerateCommand, 0o755);
  process.env.VHDL_LAB_MLX_LORA_COMMAND = fakeLoraCommand;
  process.env.VHDL_LAB_MLX_GENERATE_COMMAND = fakeGenerateCommand;
  try {
    const lab = await import('../src/server/vhdlImprovementLab.ts');
    await lab.ensureVhdlLabStorage();
    const contractResult = await lab.createVhdlLabContract({
      name: 'Phase 3 Adapter Benchmark Contract',
      taskFamily: 'PHASE3_TEST',
      contractJson: makeContract(),
      sourceType: 'fixture',
    });
    assert.equal(contractResult.ok, true);
    if (!contractResult.ok) return;
    const datasetPath = path.join(dataRoot, 'dataset');
    await fs.mkdir(datasetPath, { recursive: true });
    const holdoutRecord = { contractId: (contractResult.contract as any).id, prompt: 'contract', completion: 'rtl' };
    await fs.writeFile(path.join(datasetPath, 'holdout.jsonl'), `${JSON.stringify(holdoutRecord)}\n`);
    await fs.writeFile(path.join(datasetPath, 'train.jsonl'), `${JSON.stringify(holdoutRecord)}\n`);
    await fs.writeFile(path.join(datasetPath, 'validation.jsonl'), `${JSON.stringify(holdoutRecord)}\n`);
    const adapterPath = path.join(dataRoot, 'adapter');
    await fs.mkdir(adapterPath, { recursive: true });
    const state = await lab.readVhdlLabState();
    await lab.writeVhdlLabState({
      ...state,
      datasetReleases: [{
        id: 'dataset_checkpoint_benchmark_test',
        schemaVersion: 2 as const,
        status: 'BUILT' as const,
        name: 'checkpoint benchmark test',
        recordCount: 1,
        trainCount: 1,
        validationCount: 1,
        testCount: 1,
        holdoutCount: 1,
        manifestPath: path.join(datasetPath, 'manifest.json'),
        datasetPath,
        sourceRunIds: ['run_a'],
        sourceArtifactIds: ['artifact_a'],
        createdAt: new Date(0).toISOString(),
        frozenAt: new Date(0).toISOString(),
        audit: {},
      }],
      trainingRuns: [{
        id: 'training_checkpoint_benchmark_test',
        status: 'COMPLETED' as const,
        datasetReleaseId: 'dataset_checkpoint_benchmark_test',
        baseModel: 'local-mlx-model',
        adapterName: 'adapter',
        config: {},
        outputPath: dataRoot,
        logPath: path.join(dataRoot, 'training.log'),
        checkpointIds: ['checkpoint_benchmark_test'],
        createdAt: new Date(0).toISOString(),
        startedAt: new Date(0).toISOString(),
        completedAt: new Date(0).toISOString(),
        error: null,
      }],
      checkpoints: [{
        id: 'checkpoint_benchmark_test',
        trainingRunId: 'training_checkpoint_benchmark_test',
        checkpointPath: adapterPath,
        benchmarkRunIds: [],
        status: 'CREATED' as const,
        metrics: {},
        createdAt: new Date(0).toISOString(),
      }],
    });
    const benchmark = await lab.benchmarkVhdlLabCheckpoint('checkpoint_benchmark_test');
    assert.equal(benchmark.ok, true);
    if (!benchmark.ok) return;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const nextState = await lab.readVhdlLabState();
      const nextBenchmark = (nextState.benchmarkRuns || []).find((entry) => entry.id === benchmark.benchmark.id);
      if (nextBenchmark && ['COMPLETED', 'FAILED'].includes(nextBenchmark.status)) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    const finalState = await lab.readVhdlLabState();
    const finalBenchmark = (finalState.benchmarkRuns || []).find((entry) => entry.id === benchmark.benchmark.id);
    assert.equal(finalBenchmark?.status, 'COMPLETED');
    assert.equal(finalBenchmark?.summary.generationBenchmarkPassed, true);
    assert.equal(finalBenchmark?.summary.evaluationScope, 'dataset_holdout');
    assert.equal(finalBenchmark?.summary.passed, 1);
    const suiteBenchmark = await lab.benchmarkVhdlLabCheckpoint('checkpoint_benchmark_test', { suiteId: 'smoke_core_contracts' });
    assert.equal(suiteBenchmark.ok, true);
    if (!suiteBenchmark.ok) return;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const nextState = await lab.readVhdlLabState();
      const nextBenchmark = (nextState.benchmarkRuns || []).find((entry) => entry.id === suiteBenchmark.benchmark.id);
      if (nextBenchmark && ['COMPLETED', 'FAILED'].includes(nextBenchmark.status)) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    const suiteState = await lab.readVhdlLabState();
    const finalSuiteBenchmark = (suiteState.benchmarkRuns || []).find((entry) => entry.id === suiteBenchmark.benchmark.id);
    assert.equal(finalSuiteBenchmark?.summary.evaluationScope, 'smoke_core_contracts');
    assert.equal(finalSuiteBenchmark?.contractIds.length, 1);
  } finally {
    if (oldLoraCommand === undefined) delete process.env.VHDL_LAB_MLX_LORA_COMMAND;
    else process.env.VHDL_LAB_MLX_LORA_COMMAND = oldLoraCommand;
    if (oldGenerateCommand === undefined) delete process.env.VHDL_LAB_MLX_GENERATE_COMMAND;
    else process.env.VHDL_LAB_MLX_GENERATE_COMMAND = oldGenerateCommand;
  }
});

test('VHDL Lab Phase 3 adapter benchmark repairs missing single-file work units', async () => {
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-checkpoint-repair-'));
  process.env.VHDL_LAB_DATA_ROOT = dataRoot;
  const oldLoraCommand = process.env.VHDL_LAB_MLX_LORA_COMMAND;
  const oldGenerateCommand = process.env.VHDL_LAB_MLX_GENERATE_COMMAND;
  const fakeLoraCommand = path.join(dataRoot, 'fake-mlx-lora.sh');
  const fakeGenerateCommand = path.join(dataRoot, 'fake-mlx-generate.sh');
  await fs.writeFile(fakeLoraCommand, '#!/bin/sh\nexit 0\n');
  await fs.writeFile(fakeGenerateCommand, `#!/bin/sh
prompt="$(cat)"
case "$prompt" in
  *Focused\\ Single-File\\ Dependency\\ Repair*)
    cat <<'VHDL'
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity phase3_counter is
  generic (
    WIDTH : positive := 8
  );
  port (
    clk : in std_logic;
    rst : in std_logic;
    count_o : out unsigned(WIDTH - 1 downto 0)
  );
end entity phase3_counter;

architecture rtl of phase3_counter is
  signal count_r : unsigned(WIDTH - 1 downto 0) := (others => '0');
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        count_r <= (others => '0');
      else
        count_r <= count_r + 1;
      end if;
    end if;
  end process;
  count_o <= count_r;
end architecture rtl;
VHDL
    ;;
  *)
    cat <<'VHDL'
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity phase3_counter is
  generic (
    WIDTH : positive := 8
  );
  port (
    clk : in std_logic;
    rst : in std_logic;
    count_o : out unsigned(WIDTH - 1 downto 0)
  );
end entity phase3_counter;

architecture rtl of phase3_counter is
begin
  core_inst : entity work.counter_core
    port map (
      clk => clk,
      rst => rst,
      count_o => count_o
    );
end architecture rtl;
VHDL
    ;;
esac
`);
  await fs.chmod(fakeLoraCommand, 0o755);
  await fs.chmod(fakeGenerateCommand, 0o755);
  process.env.VHDL_LAB_MLX_LORA_COMMAND = fakeLoraCommand;
  process.env.VHDL_LAB_MLX_GENERATE_COMMAND = fakeGenerateCommand;
  try {
    const lab = await import('../src/server/vhdlImprovementLab.ts');
    await lab.ensureVhdlLabStorage();
    const contractResult = await lab.createVhdlLabContract({
      name: 'Phase 3 Adapter Repair Contract',
      taskFamily: 'PHASE3_TEST',
      contractJson: makeContract(),
      sourceType: 'fixture',
    });
    assert.equal(contractResult.ok, true);
    if (!contractResult.ok) return;
    const datasetPath = path.join(dataRoot, 'dataset');
    await fs.mkdir(datasetPath, { recursive: true });
    const holdoutRecord = { contractId: (contractResult.contract as any).id, prompt: 'contract', completion: 'rtl' };
    await fs.writeFile(path.join(datasetPath, 'holdout.jsonl'), `${JSON.stringify(holdoutRecord)}\n`);
    await fs.writeFile(path.join(datasetPath, 'train.jsonl'), `${JSON.stringify(holdoutRecord)}\n`);
    await fs.writeFile(path.join(datasetPath, 'validation.jsonl'), `${JSON.stringify(holdoutRecord)}\n`);
    const adapterPath = path.join(dataRoot, 'adapter');
    await fs.mkdir(adapterPath, { recursive: true });
    const state = await lab.readVhdlLabState();
    await lab.writeVhdlLabState({
      ...state,
      datasetReleases: [{
        id: 'dataset_checkpoint_repair_test',
        schemaVersion: 2 as const,
        status: 'BUILT' as const,
        name: 'checkpoint repair test',
        recordCount: 1,
        trainCount: 1,
        validationCount: 1,
        testCount: 1,
        holdoutCount: 1,
        manifestPath: path.join(datasetPath, 'manifest.json'),
        datasetPath,
        sourceRunIds: ['run_a'],
        sourceArtifactIds: ['artifact_a'],
        createdAt: new Date(0).toISOString(),
        frozenAt: new Date(0).toISOString(),
        audit: {},
      }],
      trainingRuns: [{
        id: 'training_checkpoint_repair_test',
        status: 'COMPLETED' as const,
        datasetReleaseId: 'dataset_checkpoint_repair_test',
        baseModel: 'local-mlx-model',
        adapterName: 'adapter',
        config: {},
        outputPath: dataRoot,
        logPath: path.join(dataRoot, 'training.log'),
        checkpointIds: ['checkpoint_repair_test'],
        createdAt: new Date(0).toISOString(),
        startedAt: new Date(0).toISOString(),
        completedAt: new Date(0).toISOString(),
        error: null,
      }],
      checkpoints: [{
        id: 'checkpoint_repair_test',
        trainingRunId: 'training_checkpoint_repair_test',
        checkpointPath: adapterPath,
        benchmarkRunIds: [],
        status: 'CREATED' as const,
        metrics: {},
        createdAt: new Date(0).toISOString(),
      }],
    });
    const benchmark = await lab.benchmarkVhdlLabCheckpoint('checkpoint_repair_test', { maxRepairAttempts: 1 });
    assert.equal(benchmark.ok, true);
    if (!benchmark.ok) return;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const nextState = await lab.readVhdlLabState();
      const nextBenchmark = (nextState.benchmarkRuns || []).find((entry) => entry.id === benchmark.benchmark.id);
      if (nextBenchmark && ['COMPLETED', 'FAILED'].includes(nextBenchmark.status)) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    const finalState = await lab.readVhdlLabState();
    const finalBenchmark = (finalState.benchmarkRuns || []).find((entry) => entry.id === benchmark.benchmark.id);
    assert.equal(finalBenchmark?.status, 'COMPLETED');
    assert.equal(finalBenchmark?.summary.passed, 1);
    const result = (finalBenchmark?.summary.results as any[])[0];
    assert.equal(result.candidateAttemptsUsed, 2);
    assert.match(await fs.readFile(path.join(path.dirname(finalBenchmark!.resultPath), '01-phase3_counter', 'adapter', 'requests', 'adapter-candidate-2.prompt.txt'), 'utf8'), /Focused Single-File Dependency Repair/);
    const audit = JSON.parse(await fs.readFile(result.repairAuditPath, 'utf8'));
    assert.equal(audit.packets[0].failureCode, 'missing_work_unit_dependency');
  } finally {
    if (oldLoraCommand === undefined) delete process.env.VHDL_LAB_MLX_LORA_COMMAND;
    else process.env.VHDL_LAB_MLX_LORA_COMMAND = oldLoraCommand;
    if (oldGenerateCommand === undefined) delete process.env.VHDL_LAB_MLX_GENERATE_COMMAND;
    else process.env.VHDL_LAB_MLX_GENERATE_COMMAND = oldGenerateCommand;
  }
});

test('VHDL Lab Phase 3 adapter benchmark falls back when dependency repair makes no progress', async () => {
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-checkpoint-fallback-'));
  process.env.VHDL_LAB_DATA_ROOT = dataRoot;
  const oldLoraCommand = process.env.VHDL_LAB_MLX_LORA_COMMAND;
  const oldGenerateCommand = process.env.VHDL_LAB_MLX_GENERATE_COMMAND;
  const fakeLoraCommand = path.join(dataRoot, 'fake-mlx-lora.sh');
  const fakeGenerateCommand = path.join(dataRoot, 'fake-mlx-generate.sh');
  await fs.writeFile(fakeLoraCommand, '#!/bin/sh\nexit 0\n');
  await fs.writeFile(fakeGenerateCommand, `#!/bin/sh
cat >/dev/null
cat <<'VHDL'
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity phase3_counter is
  generic (
    WIDTH : positive := 8
  );
  port (
    clk : in std_logic;
    rst : in std_logic;
    count_o : out unsigned(WIDTH - 1 downto 0)
  );
end entity phase3_counter;

architecture rtl of phase3_counter is
begin
  core_inst : entity bb_core
    port map (
      clk => clk,
      rst => rst,
      count_o => count_o
    );
end architecture rtl;
VHDL
`);
  await fs.chmod(fakeLoraCommand, 0o755);
  await fs.chmod(fakeGenerateCommand, 0o755);
  process.env.VHDL_LAB_MLX_LORA_COMMAND = fakeLoraCommand;
  process.env.VHDL_LAB_MLX_GENERATE_COMMAND = fakeGenerateCommand;
  try {
    const lab = await import('../src/server/vhdlImprovementLab.ts');
    await lab.ensureVhdlLabStorage();
    const contractResult = await lab.createVhdlLabContract({
      name: 'Phase 3 Adapter Fallback Contract',
      taskFamily: 'PHASE3_TEST',
      contractJson: makeContract(),
      sourceType: 'fixture',
    });
    assert.equal(contractResult.ok, true);
    if (!contractResult.ok) return;
    const datasetPath = path.join(dataRoot, 'dataset');
    await fs.mkdir(datasetPath, { recursive: true });
    const holdoutRecord = { contractId: (contractResult.contract as any).id, prompt: 'contract', completion: 'rtl' };
    await fs.writeFile(path.join(datasetPath, 'holdout.jsonl'), `${JSON.stringify(holdoutRecord)}\n`);
    await fs.writeFile(path.join(datasetPath, 'train.jsonl'), `${JSON.stringify(holdoutRecord)}\n`);
    await fs.writeFile(path.join(datasetPath, 'validation.jsonl'), `${JSON.stringify(holdoutRecord)}\n`);
    const adapterPath = path.join(dataRoot, 'adapter');
    await fs.mkdir(adapterPath, { recursive: true });
    const state = await lab.readVhdlLabState();
    await lab.writeVhdlLabState({
      ...state,
      datasetReleases: [{
        id: 'dataset_checkpoint_fallback_test',
        schemaVersion: 2 as const,
        status: 'BUILT' as const,
        name: 'checkpoint fallback test',
        recordCount: 1,
        trainCount: 1,
        validationCount: 1,
        testCount: 1,
        holdoutCount: 1,
        manifestPath: path.join(datasetPath, 'manifest.json'),
        datasetPath,
        sourceRunIds: ['run_a'],
        sourceArtifactIds: ['artifact_a'],
        createdAt: new Date(0).toISOString(),
        frozenAt: new Date(0).toISOString(),
        audit: {},
      }],
      trainingRuns: [{
        id: 'training_checkpoint_fallback_test',
        status: 'COMPLETED' as const,
        datasetReleaseId: 'dataset_checkpoint_fallback_test',
        baseModel: 'local-mlx-model',
        adapterName: 'adapter',
        config: {},
        outputPath: dataRoot,
        logPath: path.join(dataRoot, 'training.log'),
        checkpointIds: ['checkpoint_fallback_test'],
        createdAt: new Date(0).toISOString(),
        startedAt: new Date(0).toISOString(),
        completedAt: new Date(0).toISOString(),
        error: null,
      }],
      checkpoints: [{
        id: 'checkpoint_fallback_test',
        trainingRunId: 'training_checkpoint_fallback_test',
        checkpointPath: adapterPath,
        benchmarkRunIds: [],
        status: 'CREATED' as const,
        metrics: {},
        createdAt: new Date(0).toISOString(),
      }],
    });
    const benchmark = await lab.benchmarkVhdlLabCheckpoint('checkpoint_fallback_test', { maxRepairAttempts: 1 });
    assert.equal(benchmark.ok, true);
    if (!benchmark.ok) return;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const nextState = await lab.readVhdlLabState();
      const nextBenchmark = (nextState.benchmarkRuns || []).find((entry) => entry.id === benchmark.benchmark.id);
      if (nextBenchmark && ['COMPLETED', 'FAILED'].includes(nextBenchmark.status)) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    const finalState = await lab.readVhdlLabState();
    const finalBenchmark = (finalState.benchmarkRuns || []).find((entry) => entry.id === benchmark.benchmark.id);
    assert.equal(finalBenchmark?.status, 'COMPLETED');
    assert.equal(finalBenchmark?.summary.passed, 1);
    const result = (finalBenchmark?.summary.results as any[])[0];
    assert.equal(result.adapterFallbackUsed, true);
    assert.equal(result.adapterModelPassed, false);
    assert.equal(result.previousFailureCode, 'missing_work_unit_dependency');
    const acceptedVhdl = await fs.readFile(result.artifactPath, 'utf8');
    assert.match(acceptedVhdl, /architecture rtl of phase3_counter is/);
    assert.doesNotMatch(acceptedVhdl, /entity\s+(?:work\.)?bb_core/i);
  } finally {
    if (oldLoraCommand === undefined) delete process.env.VHDL_LAB_MLX_LORA_COMMAND;
    else process.env.VHDL_LAB_MLX_LORA_COMMAND = oldLoraCommand;
    if (oldGenerateCommand === undefined) delete process.env.VHDL_LAB_MLX_GENERATE_COMMAND;
    else process.env.VHDL_LAB_MLX_GENERATE_COMMAND = oldGenerateCommand;
  }
});

test('VHDL Lab Phase 3 adapter fallback recognizes repeated missing top entity extraction', async () => {
  const lab = await import('../src/server/vhdlImprovementLab.ts');
  assert.equal(lab.shouldUseAdapterBenchmarkFallback({
    stage: 'repairing',
    failureCode: 'repair_no_progress',
    message: 'repair_no_progress: repeated vhdl_extraction_missing_entity with unchanged adapter candidate content.',
    generatedVhdl: 'The requested UART bridge can be implemented with a UART core and SPI core.',
  }), true);
});

test('VHDL Lab Phase 3 adapter benchmark falls back when helper core recursion reaches GHDL analyze', async () => {
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-checkpoint-ghdl-fallback-'));
  process.env.VHDL_LAB_DATA_ROOT = dataRoot;
  const oldLoraCommand = process.env.VHDL_LAB_MLX_LORA_COMMAND;
  const oldGenerateCommand = process.env.VHDL_LAB_MLX_GENERATE_COMMAND;
  const fakeLoraCommand = path.join(dataRoot, 'fake-mlx-lora.sh');
  const fakeGenerateCommand = path.join(dataRoot, 'fake-mlx-generate.sh');
  await fs.writeFile(fakeLoraCommand, '#!/bin/sh\nexit 0\n');
  await fs.writeFile(fakeGenerateCommand, `#!/bin/sh
cat >/dev/null
cat <<'VHDL'
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity phase3_counter is
  generic (
    WIDTH : positive := 8
  );
  port (
    clk : in std_logic;
    rst : in std_logic;
    count_o : out unsigned(WIDTH - 1 downto 0)
  );
end entity phase3_counter;

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity bb_core is
  generic (
    WIDTH : positive := 8
  );
  port (
    clk : in std_logic;
    rst : in std_logic;
    count_o : out unsigned(WIDTH - 1 downto 0)
  );
end entity bb_core;

architecture rtl of bb_core is
begin
  self_inst : entity bb_core
    generic map (
      WIDTH => WIDTH
    )
    port map (
      clk => clk,
      rst => rst,
      count_o => count_o
    );
end architecture rtl;

architecture rtl of phase3_counter is
begin
  core_inst : entity bb_core
    generic map (
      WIDTH => WIDTH
    )
    port map (
      clk => clk,
      rst => rst,
      count_o => count_o
    );
end architecture rtl;
VHDL
`);
  await fs.chmod(fakeLoraCommand, 0o755);
  await fs.chmod(fakeGenerateCommand, 0o755);
  process.env.VHDL_LAB_MLX_LORA_COMMAND = fakeLoraCommand;
  process.env.VHDL_LAB_MLX_GENERATE_COMMAND = fakeGenerateCommand;
  try {
    const lab = await import('../src/server/vhdlImprovementLab.ts');
    await lab.ensureVhdlLabStorage();
    const contractResult = await lab.createVhdlLabContract({
      name: 'Phase 3 Adapter GHDL Fallback Contract',
      taskFamily: 'PHASE3_TEST',
      contractJson: makeContract(),
      sourceType: 'fixture',
    });
    assert.equal(contractResult.ok, true);
    if (!contractResult.ok) return;
    const datasetPath = path.join(dataRoot, 'dataset');
    await fs.mkdir(datasetPath, { recursive: true });
    const holdoutRecord = { contractId: (contractResult.contract as any).id, prompt: 'contract', completion: 'rtl' };
    await fs.writeFile(path.join(datasetPath, 'holdout.jsonl'), `${JSON.stringify(holdoutRecord)}\n`);
    await fs.writeFile(path.join(datasetPath, 'train.jsonl'), `${JSON.stringify(holdoutRecord)}\n`);
    await fs.writeFile(path.join(datasetPath, 'validation.jsonl'), `${JSON.stringify(holdoutRecord)}\n`);
    const adapterPath = path.join(dataRoot, 'adapter');
    await fs.mkdir(adapterPath, { recursive: true });
    const state = await lab.readVhdlLabState();
    await lab.writeVhdlLabState({
      ...state,
      datasetReleases: [{
        id: 'dataset_checkpoint_ghdl_fallback_test',
        schemaVersion: 2 as const,
        status: 'BUILT' as const,
        name: 'checkpoint ghdl fallback test',
        recordCount: 1,
        trainCount: 1,
        validationCount: 1,
        testCount: 1,
        holdoutCount: 1,
        manifestPath: path.join(datasetPath, 'manifest.json'),
        datasetPath,
        sourceRunIds: ['run_a'],
        sourceArtifactIds: ['artifact_a'],
        createdAt: new Date(0).toISOString(),
        frozenAt: new Date(0).toISOString(),
        audit: {},
      }],
      trainingRuns: [{
        id: 'training_checkpoint_ghdl_fallback_test',
        status: 'COMPLETED' as const,
        datasetReleaseId: 'dataset_checkpoint_ghdl_fallback_test',
        baseModel: 'local-mlx-model',
        adapterName: 'adapter',
        config: {},
        outputPath: dataRoot,
        logPath: path.join(dataRoot, 'training.log'),
        checkpointIds: ['checkpoint_ghdl_fallback_test'],
        createdAt: new Date(0).toISOString(),
        startedAt: new Date(0).toISOString(),
        completedAt: new Date(0).toISOString(),
        error: null,
      }],
      checkpoints: [{
        id: 'checkpoint_ghdl_fallback_test',
        trainingRunId: 'training_checkpoint_ghdl_fallback_test',
        checkpointPath: adapterPath,
        benchmarkRunIds: [],
        status: 'CREATED' as const,
        metrics: {},
        createdAt: new Date(0).toISOString(),
      }],
    });
    const benchmark = await lab.benchmarkVhdlLabCheckpoint('checkpoint_ghdl_fallback_test', { maxRepairAttempts: 0 });
    assert.equal(benchmark.ok, true);
    if (!benchmark.ok) return;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const nextState = await lab.readVhdlLabState();
      const nextBenchmark = (nextState.benchmarkRuns || []).find((entry) => entry.id === benchmark.benchmark.id);
      if (nextBenchmark && ['COMPLETED', 'FAILED'].includes(nextBenchmark.status)) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    const finalState = await lab.readVhdlLabState();
    const finalBenchmark = (finalState.benchmarkRuns || []).find((entry) => entry.id === benchmark.benchmark.id);
    assert.equal(finalBenchmark?.status, 'COMPLETED');
    assert.equal(finalBenchmark?.summary.passed, 1);
    const result = (finalBenchmark?.summary.results as any[])[0];
    assert.equal(result.adapterFallbackUsed, true);
    assert.equal(result.adapterModelPassed, false);
    assert.equal(result.previousFailureCode, 'error');
    assert.equal(result.previousFailureStage, 'analyzing');
    const acceptedVhdl = await fs.readFile(result.artifactPath, 'utf8');
    assert.doesNotMatch(acceptedVhdl, /entity\s+(?:work\.)?bb_core/i);
  } finally {
    if (oldLoraCommand === undefined) delete process.env.VHDL_LAB_MLX_LORA_COMMAND;
    else process.env.VHDL_LAB_MLX_LORA_COMMAND = oldLoraCommand;
    if (oldGenerateCommand === undefined) delete process.env.VHDL_LAB_MLX_GENERATE_COMMAND;
    else process.env.VHDL_LAB_MLX_GENERATE_COMMAND = oldGenerateCommand;
  }
});

test('VHDL Lab Phase 3 refuses checkpoint promotion without smoke and holdout evidence', async () => {
  process.env.VHDL_LAB_DATA_ROOT = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-promotion-missing-'));
  const lab = await import('../src/server/vhdlImprovementLab.ts');
  await lab.ensureVhdlLabStorage();
  const state = await lab.readVhdlLabState();
  await lab.writeVhdlLabState({
    ...state,
    datasetReleases: [{
      id: 'dataset_promotion_missing',
      schemaVersion: 2 as const,
      status: 'BUILT',
      name: 'promotion missing dataset',
      recordCount: 1,
      trainCount: 1,
      validationCount: 0,
      testCount: 0,
      holdoutCount: 0,
      manifestPath: path.join(process.env.VHDL_LAB_DATA_ROOT!, 'datasets', 'dataset_promotion_missing', 'manifest.json'),
      datasetPath: path.join(process.env.VHDL_LAB_DATA_ROOT!, 'datasets', 'dataset_promotion_missing'),
      sourceRunIds: [],
      sourceArtifactIds: [],
      createdAt: new Date().toISOString(),
      frozenAt: new Date().toISOString(),
      audit: {},
    }],
    trainingRuns: [{
      id: 'training_promotion_missing',
      status: 'COMPLETED',
      datasetReleaseId: 'dataset_promotion_missing',
      baseModel: 'mlx-community/test',
      adapterName: 'missing',
      config: {},
      outputPath: '/tmp/adapter',
      logPath: '/tmp/adapter.log',
      checkpointIds: ['checkpoint_promotion_missing'],
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      error: null,
    }],
    checkpoints: [{
      id: 'checkpoint_promotion_missing',
      trainingRunId: 'training_promotion_missing',
      checkpointPath: '/tmp/adapter',
      benchmarkRunIds: [],
      status: 'CREATED',
      metrics: {},
      createdAt: new Date().toISOString(),
    }],
  });
  const promotion = await lab.promoteVhdlLabCheckpoint('checkpoint_promotion_missing');
  assert.equal(promotion.ok, false);
  if (promotion.ok) return;
  assert.match(promotion.error, /smoke_benchmark_missing/);
  assert.match(promotion.error, /holdout_benchmark_missing/);
  const finalState = await lab.readVhdlLabState();
  const checkpoint = finalState.checkpoints?.find((entry) => entry.id === 'checkpoint_promotion_missing');
  assert.equal(checkpoint?.promotionStatus, 'LAB_ONLY');
});

test('VHDL Lab Phase 3 materializes category-balanced promotion holdouts from verified 10k dataset records', async () => {
  process.env.VHDL_LAB_DATA_ROOT = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-materialized-holdout-'));
  const lab = await import('../src/server/vhdlImprovementLab.ts');
  await lab.ensureVhdlLabStorage();
  const datasetPath = path.join(process.env.VHDL_LAB_DATA_ROOT!, 'datasets', 'dataset_materialized_holdout');
  await fs.mkdir(datasetPath, { recursive: true });
  const makeRecord = (blockName: string, category: string) => ({
    id: `record_${blockName}`,
    recordType: 'verified_10k_block_to_project_rtl',
    blockName,
    entityName: blockName,
    category,
    prompt: {
      instruction: `Generate ${blockName}`,
      blockSpec: {
        blockName,
        entityName: blockName,
        category,
        generics: [{ name: 'DATA_WIDTH', type: 'positive', default: '8', minimum: 1, maximum: 64 }],
        ports: [
          { name: 'clk', direction: 'in', type: 'std_logic' },
          { name: 'rst', direction: 'in', type: 'std_logic' },
          { name: 'data_i', direction: 'in', type: 'std_logic_vector(DATA_WIDTH-1 downto 0)' },
          { name: 'data_o', direction: 'out', type: 'std_logic_vector(DATA_WIDTH-1 downto 0)' },
        ],
        contracts: { latency: 'one cycle' },
      },
      dependencyPolicy: 'single_file',
    },
    completion: 'entity demo is end entity;',
    artifactId: `verified_10k:${blockName}`,
    runId: 'verified_10k_library',
    sourcePath: `/tmp/${blockName}.vhd`,
    contentHash: createHash('sha256').update(blockName).digest('hex'),
    contractHash: createHash('sha256').update(`${blockName}:${category}`).digest('hex'),
    evaluationOnly: true,
    createdAt: new Date().toISOString(),
  });
  await fs.writeFile(path.join(datasetPath, 'holdout.jsonl'), `${JSON.stringify(makeRecord('uart_holdout_block', 'protocol'))}\n${JSON.stringify(makeRecord('fifo_holdout_block', 'memory'))}\n`);
  const state = await lab.readVhdlLabState();
  const now = new Date().toISOString();
  await lab.writeVhdlLabState({
    ...state,
    datasetReleases: [{
      id: 'dataset_materialized_holdout',
      schemaVersion: 2 as const,
      status: 'BUILT',
      name: 'materialized holdout dataset',
      recordCount: 2,
      trainCount: 0,
      validationCount: 0,
      testCount: 0,
      holdoutCount: 2,
      manifestPath: path.join(datasetPath, 'manifest.json'),
      datasetPath,
      sourceRunIds: ['verified_10k_library'],
      sourceArtifactIds: ['verified_10k:uart_holdout_block', 'verified_10k:fifo_holdout_block'],
      createdAt: now,
      frozenAt: now,
      audit: {},
    }],
    trainingRuns: [{
      id: 'training_materialized_holdout',
      status: 'COMPLETED',
      datasetReleaseId: 'dataset_materialized_holdout',
      baseModel: 'mlx-community/test',
      adapterName: 'materialized',
      config: {},
      outputPath: '/tmp/adapter',
      logPath: '/tmp/adapter.log',
      checkpointIds: ['checkpoint_materialized_holdout'],
      createdAt: now,
      startedAt: now,
      completedAt: now,
      error: null,
    }],
    checkpoints: [{
      id: 'checkpoint_materialized_holdout',
      trainingRunId: 'training_materialized_holdout',
      checkpointPath: '/tmp/adapter',
      benchmarkRunIds: [],
      status: 'CREATED',
      metrics: {},
      createdAt: now,
    }],
  });
  const benchmark = await lab.benchmarkVhdlLabCheckpoint('checkpoint_materialized_holdout', { suiteId: 'adapter_promotion_holdout', maxRepairAttempts: 0 });
  assert.equal(benchmark.ok, true);
  if (!benchmark.ok) return;
  assert.equal(benchmark.benchmark.contractIds.length, 2);
  assert.equal(benchmark.benchmark.summary.materializedContractCount, 2);
  assert.deepEqual(benchmark.benchmark.summary.categoryCoverage, { memory: 1, protocol: 1 });
  const finalState = await lab.readVhdlLabState();
  assert.equal(finalState.contracts.filter((contract) => String(contract.sourceReference || '').startsWith('verified_10k:')).length, 2);
});

test('VHDL Lab Phase 3 stores selected promotion strictness in benchmark summary', async () => {
  process.env.VHDL_LAB_DATA_ROOT = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-promotion-strictness-'));
  const lab = await import('../src/server/vhdlImprovementLab.ts');
  await lab.ensureVhdlLabStorage();
  const state = await lab.readVhdlLabState();
  const now = new Date().toISOString();
  await lab.writeVhdlLabState({
    ...state,
    contracts: Array.from({ length: 6 }, (_, index) => ({
      id: `strictness_contract_${index}`,
      version: 1,
      status: 'FROZEN',
      name: `Strictness Contract ${index}`,
      taskFamily: index % 2 === 0 ? 'protocol' : 'dsp',
      entityName: `strictness_entity_${index}`,
      contractJson: { ...makeContract(), entity: { name: `strictness_entity_${index}` } },
      contractHash: `hash_${index}`,
      sourceType: 'fixture',
      sourceReference: 'test',
      holdoutGroup: index % 2 === 0 ? 'protocol' : 'dsp',
      isBenchmarkHoldout: true,
      createdBy: 'test',
      createdAt: now,
      updatedAt: now,
    })),
    trainingRuns: [{
      id: 'training_strictness',
      status: 'COMPLETED',
      datasetReleaseId: 'dataset_missing_for_direct_holdouts',
      baseModel: 'mlx-community/test',
      adapterName: 'strictness',
      config: {},
      outputPath: '/tmp/adapter',
      logPath: '/tmp/adapter.log',
      checkpointIds: ['checkpoint_strictness'],
      createdAt: now,
      startedAt: now,
      completedAt: now,
      error: null,
    }],
    checkpoints: [{
      id: 'checkpoint_strictness',
      trainingRunId: 'training_strictness',
      checkpointPath: '/tmp/adapter',
      benchmarkRunIds: [],
      status: 'CREATED',
      metrics: {},
      createdAt: now,
    }],
  });
  const benchmark = await lab.benchmarkVhdlLabCheckpoint('checkpoint_strictness', {
    suiteId: 'adapter_promotion_holdout',
    maxRepairAttempts: 0,
    promotionStrictness: {
      profileId: 'production_qualification',
      overrides: {
        maxContracts: 5,
        minHoldoutContracts: 4,
        minHoldoutCategories: 2,
        holdoutPassRate: 0.97,
      },
    },
  });
  assert.equal(benchmark.ok, true);
  if (!benchmark.ok) return;
  assert.equal(benchmark.benchmark.contractIds.length, 5);
  assert.equal((benchmark.benchmark.summary.promotionStrictness as any).sourceProfileId, 'production_qualification');
  assert.equal((benchmark.benchmark.summary.promotionStrictness as any).maxContracts, 5);
  assert.equal((benchmark.benchmark.summary.promotionStrictness as any).minHoldoutContracts, 4);
  assert.equal((benchmark.benchmark.summary.promotionStrictness as any).minHoldoutCategories, 2);
  assert.equal((benchmark.benchmark.summary.promotionStrictness as any).holdoutPassRate, 0.97);
  assert.equal(benchmark.benchmark.summary.promotionStrictnessProfileId, 'production_qualification');
});

test('VHDL Lab Phase 3 blocks production promotion when passes required fallback repair', async () => {
  process.env.VHDL_LAB_DATA_ROOT = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-promotion-fallback-'));
  const lab = await import('../src/server/vhdlImprovementLab.ts');
  await lab.ensureVhdlLabStorage();
  const state = await lab.readVhdlLabState();
  const now = new Date().toISOString();
  const smokeResults = Array.from({ length: 5 }, (_, index) => ({
    contractId: `smoke_${index}`,
    passed: true,
    artifactPath: `/tmp/smoke-${index}.vhd`,
  }));
  await lab.writeVhdlLabState({
    ...state,
    datasetReleases: [{
      id: 'dataset_promotion_fallback',
      schemaVersion: 2 as const,
      status: 'BUILT',
      name: 'promotion fallback dataset',
      recordCount: 5,
      trainCount: 4,
      validationCount: 0,
      testCount: 0,
      holdoutCount: 1,
      manifestPath: '/tmp/manifest.json',
      datasetPath: '/tmp/dataset',
      sourceRunIds: [],
      sourceArtifactIds: [],
      createdAt: now,
      frozenAt: now,
      audit: {},
    }],
    trainingRuns: [{
      id: 'training_promotion_fallback',
      status: 'COMPLETED',
      datasetReleaseId: 'dataset_promotion_fallback',
      baseModel: 'mlx-community/test',
      adapterName: 'fallback',
      config: {},
      outputPath: '/tmp/adapter',
      logPath: '/tmp/adapter.log',
      checkpointIds: ['checkpoint_promotion_fallback'],
      createdAt: now,
      startedAt: now,
      completedAt: now,
      error: null,
    }],
    checkpoints: [{
      id: 'checkpoint_promotion_fallback',
      trainingRunId: 'training_promotion_fallback',
      checkpointPath: '/tmp/adapter',
      benchmarkRunIds: ['benchmark_smoke_fallback', 'benchmark_holdout_fallback'],
      status: 'BENCHMARKED',
      metrics: {},
      createdAt: now,
    }],
    benchmarkRuns: [{
      id: 'benchmark_smoke_fallback',
      suiteId: 'checkpoint_adapter_generation:smoke_core_contracts',
      status: 'COMPLETED',
      contractIds: smokeResults.map((result) => String(result.contractId)),
      childRunIds: [],
      modelProfileId: null,
      promptVersionId: 'prompt_version_vhdl_rtl_generator_v1',
      seedList: [42],
      maxRepairAttempts: 3,
      summary: { total: 5, passed: 5, failed: 0, running: 0, passRate: 1, results: smokeResults, generationBenchmarkPassed: true },
      resultPath: '/tmp/smoke.json',
      createdAt: now,
      completedAt: now,
    }, {
      id: 'benchmark_holdout_fallback',
      suiteId: 'checkpoint_adapter_generation:adapter_promotion_holdout',
      status: 'COMPLETED',
      contractIds: ['holdout_1'],
      childRunIds: [],
      modelProfileId: null,
      promptVersionId: 'prompt_version_vhdl_rtl_generator_v1',
      seedList: [42],
      maxRepairAttempts: 3,
      summary: {
        total: 1,
        passed: 1,
        failed: 0,
        running: 0,
        passRate: 1,
        categoryCoverage: { protocol: 1 },
        results: [{ contractId: 'holdout_1', passed: true, adapterFallbackUsed: true, artifactPath: '/tmp/fallback.vhd' }],
        generationBenchmarkPassed: true,
      },
      resultPath: '/tmp/holdout.json',
      createdAt: now,
      completedAt: now,
    }],
  });
  const promotion = await lab.promoteVhdlLabCheckpoint('checkpoint_promotion_fallback');
  assert.equal(promotion.ok, false);
  if (promotion.ok) return;
  assert.match(promotion.error, /fallback_passes_exceed_limit/);
  const finalState = await lab.readVhdlLabState();
  assert.equal(finalState.qualifiedAdapterSources?.length || 0, 0);
});

test('VHDL Lab Phase 3 promotes only clean smoke plus holdout adapter evidence', async () => {
  process.env.VHDL_LAB_DATA_ROOT = await fs.mkdtemp(path.join(os.tmpdir(), 'vhdl-lab-phase3-promotion-clean-'));
  const lab = await import('../src/server/vhdlImprovementLab.ts');
  await lab.ensureVhdlLabStorage();
  const state = await lab.readVhdlLabState();
  const now = new Date().toISOString();
  const smokeResults = Array.from({ length: 5 }, (_, index) => ({
    contractId: `smoke_${index}`,
    passed: true,
    artifactPath: `/tmp/smoke-${index}.vhd`,
  }));
  const holdoutResults = Array.from({ length: 10 }, (_, index) => ({
    contractId: `holdout_${index}`,
    passed: true,
    artifactPath: `/tmp/holdout-${index}.vhd`,
  }));
  await lab.writeVhdlLabState({
    ...state,
    datasetReleases: [{
      id: 'dataset_promotion_clean',
      schemaVersion: 2 as const,
      status: 'BUILT',
      name: 'promotion clean dataset',
      recordCount: 10,
      trainCount: 8,
      validationCount: 1,
      testCount: 1,
      holdoutCount: 1,
      manifestPath: '/tmp/manifest.json',
      datasetPath: '/tmp/dataset',
      sourceRunIds: [],
      sourceArtifactIds: [],
      createdAt: now,
      frozenAt: now,
      audit: {},
    }],
    trainingRuns: [{
      id: 'training_promotion_clean',
      status: 'COMPLETED',
      datasetReleaseId: 'dataset_promotion_clean',
      baseModel: 'mlx-community/test',
      adapterName: 'clean',
      config: {},
      outputPath: '/tmp/adapter',
      logPath: '/tmp/adapter.log',
      checkpointIds: ['checkpoint_promotion_clean'],
      createdAt: now,
      startedAt: now,
      completedAt: now,
      error: null,
    }],
    checkpoints: [{
      id: 'checkpoint_promotion_clean',
      trainingRunId: 'training_promotion_clean',
      checkpointPath: '/tmp/adapter',
      benchmarkRunIds: ['benchmark_smoke_clean', 'benchmark_holdout_clean'],
      status: 'BENCHMARKED',
      metrics: {},
      createdAt: now,
    }],
    benchmarkRuns: [{
      id: 'benchmark_smoke_clean',
      suiteId: 'checkpoint_adapter_generation:smoke_core_contracts',
      status: 'COMPLETED',
      contractIds: smokeResults.map((result) => String(result.contractId)),
      childRunIds: [],
      modelProfileId: null,
      promptVersionId: 'prompt_version_vhdl_rtl_generator_v1',
      seedList: [42],
      maxRepairAttempts: 3,
      summary: { total: 5, passed: 5, failed: 0, running: 0, passRate: 1, results: smokeResults, generationBenchmarkPassed: true },
      resultPath: '/tmp/smoke.json',
      createdAt: now,
      completedAt: now,
    }, {
      id: 'benchmark_holdout_clean',
      suiteId: 'checkpoint_adapter_generation:adapter_promotion_holdout',
      status: 'COMPLETED',
      contractIds: holdoutResults.map((result) => String(result.contractId)),
      childRunIds: [],
      modelProfileId: null,
      promptVersionId: 'prompt_version_vhdl_rtl_generator_v1',
      seedList: [42],
      maxRepairAttempts: 3,
      summary: { total: 10, passed: 10, failed: 0, running: 0, passRate: 1, categoryCoverage: { protocol: 5, dsp: 5 }, results: holdoutResults, generationBenchmarkPassed: true },
      resultPath: '/tmp/holdout.json',
      createdAt: now,
      completedAt: now,
    }],
  });
  const promotion = await lab.promoteVhdlLabCheckpoint('checkpoint_promotion_clean');
  assert.equal(promotion.ok, true);
  if (!promotion.ok) return;
  assert.equal(promotion.source.status, 'QUALIFIED_FOR_LEAF_RTL');
  assert.equal(promotion.source.fallbackPassCount, 0);
  assert.equal(promotion.source.adapterAuthoredPassCount, 15);
  assert.match(promotion.source.promotionAuditPath, /promotion-audit\.json$/);
  const finalState = await lab.readVhdlLabState();
  const checkpoint = finalState.checkpoints?.find((entry) => entry.id === 'checkpoint_promotion_clean');
  assert.equal(checkpoint?.promotionStatus, 'QUALIFIED_FOR_LEAF_RTL');
  assert.equal(finalState.qualifiedAdapterSources?.[0]?.checkpointId, 'checkpoint_promotion_clean');
  const audit = JSON.parse(await fs.readFile(promotion.source.promotionAuditPath, 'utf8'));
  assert.equal(audit.gates.gateChecks.holdoutThresholdMet, true);
  assert.equal(audit.gates.profileId, 'fast_check');
  assert.equal(audit.gates.promotionStrictness.sourceProfileId, 'fast_check');
});
