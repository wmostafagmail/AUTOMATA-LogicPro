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
      contractId: contractResult.contract.id,
      contractHash: contractResult.contract.contractHash,
      entityName: contractResult.contract.entityName,
      artifactPath,
      contentHash: lab.sha256(vhdl),
      createdAt: new Date(0).toISOString(),
    }],
  });
  const dataset = await lab.buildVhdlLabDatasetRelease({ name: 'phase3 dataset' });
  assert.equal(dataset.ok, true);
  assert.equal(dataset.release.recordCount, 1);
  assert.equal((await fs.readFile(path.join(dataset.release.datasetPath, 'records.jsonl'), 'utf8')).trim().split('\n').length, 1);
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
  assert.equal(release.ok, true);
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
    contractIds: [contractResult.contract.id],
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
      contractId: contractResult.contract.id,
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
      contractIds: [contractResult.contract.id],
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
      status: 'BUILT' as const,
      name: 'training test',
      recordCount: 1,
      trainCount: 1,
      validationCount: 0,
      holdoutCount: 0,
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
      status: 'BUILT' as const,
      name: 'training unique test',
      recordCount: 1,
      trainCount: 1,
      validationCount: 0,
      holdoutCount: 0,
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
  await fs.writeFile(fakeCommand, '#!/bin/sh\nprintf "%s\\n" "$@" > "$PWD/invocation.args"\nmkdir -p "$PWD/adapter"\nexit 0\n');
  await fs.chmod(fakeCommand, 0o755);
  process.env.VHDL_LAB_MLX_LORA_COMMAND = fakeCommand;
  try {
    const lab = await import('../src/server/vhdlImprovementLab.ts');
    await lab.ensureVhdlLabStorage();
    const datasetPath = path.join(dataRoot, 'qualified-dataset');
    await fs.mkdir(datasetPath, { recursive: true });
    await fs.writeFile(path.join(datasetPath, 'train.jsonl'), `${JSON.stringify({ prompt: 'contract', completion: 'rtl' })}\n`);
    await fs.writeFile(path.join(datasetPath, 'validation.jsonl'), `${JSON.stringify({ prompt: 'contract', completion: 'rtl' })}\n`);
    await fs.writeFile(path.join(datasetPath, 'holdout.jsonl'), `${JSON.stringify({ prompt: 'contract', completion: 'rtl' })}\n`);
    const state = await lab.readVhdlLabState();
    const release = {
      id: 'dataset_mlx_launch_test',
      status: 'BUILT' as const,
      name: 'mlx launch test',
      recordCount: 1,
      trainCount: 1,
      validationCount: 1,
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
      config: { iters: 1, batchSize: 1, maxSeqLength: 128 },
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
    assert.match(await fs.readFile(path.join(training.trainingRun.outputPath, 'invocation.args'), 'utf8'), /--train/);
    const mlxTrainRecord = JSON.parse((await fs.readFile(path.join(training.trainingRun.outputPath, 'mlx-data', 'train.jsonl'), 'utf8')).trim().split(/\r?\n/)[0]);
    assert.equal(Array.isArray(mlxTrainRecord.messages), true);
    assert.equal(typeof mlxTrainRecord.messages[1].content, 'string');
    assert.equal((finalState.checkpoints || []).some((entry) => entry.trainingRunId === training.trainingRun.id), true);
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
    const holdoutRecord = { contractId: contractResult.contract.id, prompt: 'contract', completion: 'rtl' };
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
        status: 'BUILT' as const,
        name: 'checkpoint benchmark test',
        recordCount: 1,
        trainCount: 1,
        validationCount: 1,
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
    const holdoutRecord = { contractId: contractResult.contract.id, prompt: 'contract', completion: 'rtl' };
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
        status: 'BUILT' as const,
        name: 'checkpoint repair test',
        recordCount: 1,
        trainCount: 1,
        validationCount: 1,
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
    const holdoutRecord = { contractId: contractResult.contract.id, prompt: 'contract', completion: 'rtl' };
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
        status: 'BUILT' as const,
        name: 'checkpoint fallback test',
        recordCount: 1,
        trainCount: 1,
        validationCount: 1,
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
    const holdoutRecord = { contractId: contractResult.contract.id, prompt: 'contract', completion: 'rtl' };
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
        status: 'BUILT' as const,
        name: 'checkpoint ghdl fallback test',
        recordCount: 1,
        trainCount: 1,
        validationCount: 1,
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
      status: 'BUILT',
      name: 'promotion missing dataset',
      recordCount: 1,
      trainCount: 1,
      validationCount: 0,
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
      status: 'BUILT',
      name: 'materialized holdout dataset',
      recordCount: 2,
      trainCount: 0,
      validationCount: 0,
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
      status: 'FROZEN',
      name: `Strictness Contract ${index}`,
      taskFamily: index % 2 === 0 ? 'protocol' : 'dsp',
      entityName: `strictness_entity_${index}`,
      contractJson: { entity: { name: `strictness_entity_${index}` } },
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
      status: 'BUILT',
      name: 'promotion fallback dataset',
      recordCount: 5,
      trainCount: 4,
      validationCount: 0,
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
      status: 'BUILT',
      name: 'promotion clean dataset',
      recordCount: 10,
      trainCount: 8,
      validationCount: 1,
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
