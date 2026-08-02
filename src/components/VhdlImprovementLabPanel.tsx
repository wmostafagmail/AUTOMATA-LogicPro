import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, BrainCircuit, CheckCircle2, Database, FlaskConical, Loader2, Play, RefreshCw, X } from 'lucide-react';
import { apiFetch } from '../api';

type VhdlLabOverview = {
  enabled: boolean;
  dataRoot: string;
  diagnostics: {
    worker?: { status?: string; queueDepth?: number; runningCount?: number; running?: boolean; currentRunId?: string | null; lastTickAt?: string | null; lastError?: string | null };
    ollama?: { status?: string; modelCount?: number; baseUrl?: string; error?: string | null };
    lmStudio?: { status?: string; modelCount?: number; baseUrl?: string; error?: string | null };
    ghdl?: { installed?: boolean; version?: string | null; path?: string; error?: string | null };
    counts?: Record<string, number>;
  };
  providers: Array<{ id: string; name: string; providerType: string; healthStatus: string; baseUrl: string }>;
  models: Array<{ id: string; displayName: string; role: string; enabled: boolean }>;
  verificationProfiles: Array<{ id: string; name: string; enabled: boolean }>;
  promptTemplates: Array<{ id: string; name: string; currentVersionId: string | null }>;
  promptVersions: Array<{ id: string; status: string; promptHash: string }>;
  recentContracts: Array<{ id: string; name: string; status: string; entityName: string; contractHash: string }>;
  presetContracts?: Array<{ id: string; key: string; label: string; designClass: string; entityName: string; taskFamily: string }>;
  recentRuns: Array<{
    id: string;
    status: string;
    runType: string;
    currentStage: string;
    contractName?: string;
    contractEntityName?: string | null;
    modelName?: string | null;
    candidateCount: number;
    maxRepairAttempts: number;
    latestEvent?: { at: string; stage: string; status: string; message: string } | null;
    stageLogTail?: Array<{ at: string; stage: string; status: string; message: string }>;
    acceptedArtifactPath?: string | null;
    acceptedTestbenchPath?: string | null;
    verificationStrength?: string | null;
    simulationRequired?: boolean | null;
    passMarkerRequired?: boolean | null;
    createdAt?: string;
    completedAt?: string | null;
  }>;
  failureClusters: Array<{ id: string; category: string; occurrenceCount: number; status: string }>;
  datasetReleases: Array<{ id: string; status: string; recordCount?: number; trainCount?: number; validationCount?: number; testCount?: number; holdoutCount?: number; schemaVersion?: number; audit?: Record<string, unknown> }>;
  trainingRuns: Array<{ id: string; status: string; error?: string | null; baseModel?: string; adapterName?: string; logPath?: string }>;
  checkpoints?: Array<{
    id: string;
    trainingRunId: string;
    checkpointPath: string;
    benchmarkRunIds: string[];
    status: string;
    promotionStatus?: string;
    promotionBenchmarks?: string[];
    fallbackPassCount?: number;
    adapterAuthoredPassCount?: number;
    qualificationIssues?: string[];
    qualifiedSourceId?: string | null;
    metrics?: Record<string, unknown>;
    createdAt: string;
  }>;
  qualifiedAdapterSources?: Array<{
    id: string;
    checkpointId: string;
    status: string;
    smokePassRate: number;
    holdoutPassRate: number;
    fallbackPassCount: number;
    adapterAuthoredPassCount: number;
    promotionAuditPath?: string;
    categoryCoverage?: Record<string, number>;
    gateChecks?: Record<string, boolean>;
    promotionStrictness?: PromotionStrictnessProfile;
  }>;
  promotionStrictnessProfiles?: PromotionStrictnessProfile[];
  trainingAvailability?: { available: boolean; source: 'project_venv' | 'path' | 'missing'; command: string | null };
  benchmarkRuns?: Array<{ id: string; suiteId: string; status: string; childRunIds?: string[]; summary?: Record<string, unknown>; createdAt?: string; completedAt?: string | null }>;
};

type PromotionStrictnessProfile = {
  id: string;
  label: string;
  description?: string;
  maxContracts: number;
  minHoldoutContracts: number;
  minHoldoutCategories: number;
  holdoutPassRate: number;
  maxFallbackPassCount: number;
  maxRepairNoProgressCount?: number;
  requireAllAvailableCategories?: boolean;
  advancedOverrides?: Record<string, number>;
};

const fallbackPromotionStrictnessProfiles: PromotionStrictnessProfile[] = [
  { id: 'fast_check', label: 'Fast check', description: 'Quick smoke-style confidence check for iteration.', maxContracts: 30, minHoldoutContracts: 10, minHoldoutCategories: 2, holdoutPassRate: 0.9, maxFallbackPassCount: 0, maxRepairNoProgressCount: 0 },
  { id: 'standard_qualification', label: 'Standard qualification', description: 'Balanced qualification before serious adapter comparison.', maxContracts: 100, minHoldoutContracts: 50, minHoldoutCategories: 5, holdoutPassRate: 0.93, maxFallbackPassCount: 0, maxRepairNoProgressCount: 0 },
  { id: 'production_qualification', label: 'Production qualification', description: 'Production-grade leaf RTL adapter promotion gate.', maxContracts: 250, minHoldoutContracts: 100, minHoldoutCategories: 8, holdoutPassRate: 0.95, maxFallbackPassCount: 0, maxRepairNoProgressCount: 0 },
  { id: 'release_signoff', label: 'Release/signoff', description: 'Large release gate across all available holdout categories.', maxContracts: 1000, minHoldoutContracts: 250, minHoldoutCategories: 1, holdoutPassRate: 0.99, maxFallbackPassCount: 0, maxRepairNoProgressCount: 0, requireAllAvailableCategories: true },
];

const activeRunStatuses = ['QUEUED', 'PREPARING', 'GENERATING', 'EXTRACTING', 'VALIDATING_INTERFACE', 'VALIDATING_DEPENDENCIES', 'ANALYZING', 'GENERATING_TESTBENCH', 'ELABORATING', 'SYNTHESIZING', 'SIMULATING', 'REPAIRING'];
const activeBenchmarkStatuses = ['QUEUED', 'RUNNING'];
const customTrainingModelValue = '__custom_mlx_model__';
const datasetSourceOptions = [
  {
    value: 'accepted_artifacts',
    label: 'Accepted Lab artifacts',
    detail: 'Safest default: train only on RTL that this lab accepted after verification.',
  },
  {
    value: 'verified_10k_blocks',
    label: 'Qualified 10k VHDL library',
    detail: 'Use the locally qualified 10,000-block VHDL library as the training source.',
  },
  {
    value: 'mixed_accepted_and_verified_10k',
    label: 'Accepted + qualified 10k',
    detail: 'Mix proven lab outputs with qualified library blocks for broader VHDL exposure.',
  },
];
const mlxTrainingModelOptions = [
  {
    label: 'Qwen2.5 Coder 7B Instruct, 4-bit',
    value: 'mlx-community/Qwen2.5-Coder-7B-Instruct-4bit',
    detail: 'Good default for fast local coding LoRA experiments.',
  },
  {
    label: 'Qwen2.5 Coder 14B Instruct, 4-bit',
    value: 'mlx-community/Qwen2.5-Coder-14B-Instruct-4bit',
    detail: 'Better coding quality if memory allows.',
  },
  {
    label: 'Qwen2.5 Coder 32B Instruct, 4-bit',
    value: 'mlx-community/Qwen2.5-Coder-32B-Instruct-4bit',
    detail: 'Large coding base; use only on machines with enough unified memory.',
  },
  {
    label: 'DeepSeek Coder V2 Lite Instruct, 4-bit',
    value: 'mlx-community/DeepSeek-Coder-V2-Lite-Instruct-4bit',
    detail: 'Strong code-specialized baseline for adapter experiments.',
  },
  {
    label: 'CodeLlama 7B Instruct, 4-bit',
    value: 'mlx-community/CodeLlama-7b-Instruct-hf-4bit',
    detail: 'Older but lightweight code model baseline.',
  },
  {
    label: 'Local converted VHDL/coding model path',
    value: customTrainingModelValue,
    detail: 'Use this for a local MLX model directory or a model not listed here.',
  },
];

const sampleContract = {
  contract_version: '1.0',
  entity: { name: 'lab_counter', description: 'A tiny counter contract for VHDL Improvement Lab smoke setup.' },
  generics: [{ name: 'WIDTH', type: 'positive', default: '8', constraints: ['WIDTH >= 1'] }],
  ports: [
    { name: 'clk', mode: 'in', type: 'std_logic', semantic_role: 'clock' },
    { name: 'rst', mode: 'in', type: 'std_logic', semantic_role: 'reset' },
    { name: 'enable_i', mode: 'in', type: 'std_logic', semantic_role: 'enable' },
    { name: 'count_o', mode: 'out', type: 'unsigned(WIDTH-1 downto 0)', semantic_role: 'counter_value' },
  ],
  clocking: { domains: [{ name: 'main', clock_port: 'clk', edge: 'rising' }] },
  reset: { port: 'rst', polarity: 'active_high', synchronous: true, reset_values: { count_o: "to_unsigned(0, WIDTH)" } },
  behavior: ['On each rising edge when enable_i is 1, count_o increments by one. Reset clears count_o to zero.'],
  corner_cases: ['Reset while enabled', 'WIDTH=1 minimum legal width', 'Counter wraparound'],
  prohibited_implementations: ['std_logic_unsigned', 'std_logic_arith', 'vendor primitives'],
  synthesis_requirements: ['Synthesizable VHDL-2008', 'Use numeric_std only'],
  testbench_obligations: ['Self-check reset, increment, hold, and wrap behavior', 'Print PASS only after all checks pass'],
  pass_marker: 'PASS',
};

function statusTone(value: string | undefined) {
  if (/not installed|unavailable|failed|quarantined|error/i.test(value || '')) return 'border-rose-400/30 bg-rose-500/10 text-rose-100';
  if (/healthy|accepted|active|completed|frozen|validated|installed|ready/i.test(value || '')) return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100';
  return 'border-brand-outline-variant/30 bg-brand-surface-lowest text-slate-200';
}

function MetricCard({ label, value, detail }: { label: string; value: React.ReactNode; detail?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-brand-outline-variant/30 bg-brand-surface-lowest p-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-secondary">{label}</div>
      <div className="mt-2 text-lg font-black text-brand-on-surface">{value}</div>
      {detail ? <div className="mt-1 text-[12px] text-slate-400">{detail}</div> : null}
    </div>
  );
}

function formatTime(value: string | null | undefined) {
  if (!value) return 'not yet';
  try {
    return new Date(value).toLocaleTimeString();
  } catch {
    return value;
  }
}

function numberFromSummary(summary: Record<string, unknown> | undefined, key: string) {
  const value = summary?.[key];
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function adapterBenchmarkDisplayCounts(metrics: Record<string, unknown>) {
  const results = Array.isArray(metrics.results) ? metrics.results : [];
  const total = numberFromSummary(metrics, 'total') || results.length || numberFromSummary(metrics, 'holdoutCount');
  const passed = numberFromSummary(metrics, 'passed') || results.filter((result: any) => result?.passed === true).length;
  const failed = numberFromSummary(metrics, 'failed') || results.filter((result: any) => result?.passed === false).length;
  return { total, passed, failed };
}

function adapterBenchmarkFailureDetail(metrics: Record<string, unknown>) {
  const results = Array.isArray(metrics.results) ? metrics.results as any[] : [];
  const failed = results.find((result) => result?.passed === false);
  if (!failed) return '';
  const seconds = Number.isFinite(Number(failed.elapsedMs)) ? ` after ${Math.round(Number(failed.elapsedMs) / 1000)}s` : '';
  const timeout = Number.isFinite(Number(failed.timeoutMs)) ? ` (timeout ${Math.round(Number(failed.timeoutMs) / 1000)}s)` : '';
  const code = failed.failureCode ? `${failed.failureCode}: ` : '';
  const message = String(failed.message || 'Adapter generation failed.').replace(/\s+/g, ' ').trim();
  const contract = failed.contractName ? ` on ${failed.contractName}` : '';
  return `${code}${message}${contract}${seconds}${timeout}`;
}

function percentLabel(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'n/a';
  return `${Math.round(numeric * 100)}%`;
}

function signedPointsLabel(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'n/a';
  const sign = numeric > 0 ? '+' : '';
  return `${sign}${Math.round(numeric * 10) / 10} pts`;
}

async function readVhdlLabJson(response: Response, action: string) {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  if (!text.trim()) return {};
  if (!contentType.includes('application/json')) {
    const firstLine = text.trim().split(/\r?\n/)[0]?.slice(0, 160) || 'non-JSON response';
    throw new Error(`${action} returned ${response.status} ${response.statusText || ''} instead of JSON: ${firstLine}`);
  }
  try {
    return JSON.parse(text);
  } catch (error: any) {
    throw new Error(`${action} returned invalid JSON: ${String(error?.message || error)}`);
  }
}

function benchmarkResultLabel(benchmark: NonNullable<VhdlLabOverview['benchmarkRuns']>[number] | null) {
  if (!benchmark) return 'No benchmark yet';
  const running = numberFromSummary(benchmark.summary, 'running');
  const failed = numberFromSummary(benchmark.summary, 'failed');
  const passed = numberFromSummary(benchmark.summary, 'passed');
  const total = numberFromSummary(benchmark.summary, 'total') || benchmark.childRunIds?.length || 0;
  if (running > 0) return `Running: ${passed}/${total} passed`;
  if (failed > 0) return `Completed: ${passed}/${total} passed, ${failed} failed`;
  if (total > 0) return `Completed: ${passed}/${total} passed`;
  return benchmark.status;
}

function verificationLabel(run: VhdlLabOverview['recentRuns'][number] | null) {
  if (!run) return 'No run yet';
  if (run.status !== 'ACCEPTED') {
    if (run.currentStage === 'simulating' || run.status === 'SIMULATING') return 'Running GHDL simulation';
    if (run.currentStage === 'generating_testbench' || run.status === 'GENERATING_TESTBENCH') return 'Generating testbench';
    return 'Not accepted yet';
  }
  if (run.verificationStrength === 'ghdl_simulation') {
    return run.passMarkerRequired ? 'GHDL simulation + pass marker' : 'GHDL simulation';
  }
  return 'GHDL analyze only';
}

export function VhdlImprovementLabPanel({ onClose }: { onClose: () => void }) {
  const openedAtRef = useRef(Date.now());
  const [overview, setOverview] = useState<VhdlLabOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [selectedPromptVersionId, setSelectedPromptVersionId] = useState('');
  const [selectedBenchmarkSuite, setSelectedBenchmarkSuite] = useState('smoke_core_contracts');
  const [selectedPromotionStrictnessProfile, setSelectedPromotionStrictnessProfile] = useState('standard_qualification');
  const [showPromotionAdvanced, setShowPromotionAdvanced] = useState(false);
  const [promotionOverrides, setPromotionOverrides] = useState<Record<string, string>>({});
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [selectedDatasetSource, setSelectedDatasetSource] = useState('accepted_artifacts');
  const [selectedTrainingBaseModel, setSelectedTrainingBaseModel] = useState('');
  const [customTrainingBaseModel, setCustomTrainingBaseModel] = useState('');
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionRunIds, setSessionRunIds] = useState<Set<string>>(() => new Set());
  const [sessionBenchmarkIds, setSessionBenchmarkIds] = useState<Set<string>>(() => new Set());
  const [sessionTrainingRunIds, setSessionTrainingRunIds] = useState<Set<string>>(() => new Set());

  const loadOverview = async (options: { silent?: boolean } = {}) => {
    if (!options.silent) {
      setLoading(true);
      setError('');
    }
    try {
      const response = await apiFetch('/api/vhdl-lab/overview');
      const data = await readVhdlLabJson(response, 'VHDL Lab overview');
      if (!response.ok) throw new Error(data?.error || 'Failed to load VHDL Improvement Lab overview.');
      setOverview(data);
      setSelectedPresetId((current) => current || data?.presetContracts?.[0]?.id || '');
      setSelectedModelId((current) => current || data?.models?.find((model: any) => model.enabled)?.id || '');
      setSelectedPromptVersionId((current) => current || data?.promptTemplates?.[0]?.currentVersionId || data?.promptVersions?.[0]?.id || '');
      setSelectedTrainingBaseModel((current) => current || data?.trainingRuns?.[0]?.baseModel || mlxTrainingModelOptions[0].value);
    } catch (nextError: any) {
      setError(String(nextError?.message || nextError));
    } finally {
      if (!options.silent) setLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadOverview({ silent: true });
    }, 3000);
    return () => window.clearInterval(interval);
  }, []);

  const counts = overview?.diagnostics?.counts || {};
  const activePrompt = useMemo(() => {
    const id = overview?.promptTemplates?.[0]?.currentVersionId;
    return overview?.promptVersions?.find((version) => version.id === id) || overview?.promptVersions?.[0] || null;
  }, [overview]);
  const sessionRuns = useMemo(() => {
    const openedAt = openedAtRef.current;
    return (overview?.recentRuns || []).filter((run) => {
      if (showHistory) return true;
      if (activeRunStatuses.includes(run.status)) return true;
      if (sessionRunIds.has(run.id)) return true;
      return run.createdAt ? new Date(run.createdAt).getTime() >= openedAt : false;
    });
  }, [overview, sessionRunIds, showHistory]);
  const sessionBenchmarks = useMemo(() => {
    const openedAt = openedAtRef.current;
    return (overview?.benchmarkRuns || []).filter((benchmark) => {
      if (showHistory) return true;
      if (activeBenchmarkStatuses.includes(benchmark.status)) return true;
      if (sessionBenchmarkIds.has(benchmark.id)) return true;
      return benchmark.createdAt ? new Date(benchmark.createdAt).getTime() >= openedAt : false;
    });
  }, [overview, sessionBenchmarkIds, showHistory]);
  const currentRun = useMemo(() => {
    const active = sessionRuns.find((run) => activeRunStatuses.includes(run.status));
    return active || sessionRuns[0] || null;
  }, [sessionRuns]);
  const latestBenchmark = useMemo(() => {
    return sessionBenchmarks[0] || null;
  }, [sessionBenchmarks]);
  const latestCheckpoint = useMemo(() => {
    return overview?.checkpoints?.[0] || null;
  }, [overview]);
  const latestCheckpointBenchmark = useMemo(() => {
    if (!latestCheckpoint) return null;
    const visibleBenchmarks = showHistory ? (overview?.benchmarkRuns || []) : sessionBenchmarks;
    const byId = new Map(visibleBenchmarks.map((benchmark) => [benchmark.id, benchmark]));
    const visibleOrder = new Map(visibleBenchmarks.map((benchmark, index) => [benchmark.id, index]));
    const linkedBenchmarks = (latestCheckpoint.benchmarkRunIds || [])
      .map((benchmarkId) => byId.get(benchmarkId))
      .filter(Boolean) as NonNullable<VhdlLabOverview['benchmarkRuns']>;
    const candidates = linkedBenchmarks.length > 0
      ? linkedBenchmarks
      : visibleBenchmarks.filter((benchmark) => benchmark.suiteId.startsWith('checkpoint_adapter_generation') && String(benchmark.summary?.adapterCheckpointId || '') === latestCheckpoint?.id);
    return candidates
      .sort((a, b) => {
        const leftOrder = Number(visibleOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER);
        const rightOrder = Number(visibleOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER);
        const orderDelta = leftOrder - rightOrder;
        if (orderDelta !== 0) return orderDelta;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      })[0] || null;
  }, [latestCheckpoint, overview, sessionBenchmarks, showHistory]);
  const latestCheckpointMetrics = (latestCheckpointBenchmark?.summary || (showHistory ? latestCheckpoint?.metrics?.adapterGenerationBenchmark : null) || {}) as Record<string, unknown>;
  const latestCheckpointCounts = adapterBenchmarkDisplayCounts(latestCheckpointMetrics);
  const latestImprovement = (latestCheckpointMetrics.improvement || {}) as Record<string, unknown>;
  const latestCheckpointFailure = adapterBenchmarkFailureDetail(latestCheckpointMetrics);
  const showCheckpointDetails = Boolean(showHistory || latestCheckpointBenchmark || (latestCheckpoint && sessionTrainingRunIds.has(latestCheckpoint.trainingRunId)));
  const latestCheckpointBenchmarkIsStarting = Boolean(
    latestCheckpointBenchmark
      && activeBenchmarkStatuses.includes(latestCheckpointBenchmark.status)
      && latestCheckpointCounts.total === 0,
  );
  const latestCheckpointBenchmarkLabel = latestCheckpoint ? (
    <div>
      <div>
        {latestCheckpointBenchmarkIsStarting
          ? `Starting benchmark · ${String(latestCheckpointMetrics.evaluationScope || selectedBenchmarkSuite)}`
          : (latestCheckpointBenchmark || showHistory)
            ? `${latestCheckpointCounts.passed}/${latestCheckpointCounts.total} contracts passed · ${String(latestCheckpointMetrics.evaluationScope || 'not benchmarked')}`
            : 'No adapter benchmark has been started in this lab session.'}
      </div>
      {latestCheckpointFailure ? (
        <div className="mt-2 rounded-lg border border-rose-400/25 bg-rose-500/10 px-2 py-1 text-rose-100">
          {latestCheckpointFailure}
        </div>
      ) : null}
    </div>
  ) : 'Train a LoRA adapter, then benchmark it against held-out/smoke contracts.';
  const latestCheckpointQualificationIssues = latestCheckpoint?.qualificationIssues || [];
  const latestQualifiedSource = useMemo(() => {
    if (!latestCheckpoint) return null;
    return (overview?.qualifiedAdapterSources || []).find((source) => source.checkpointId === latestCheckpoint.id || source.id === latestCheckpoint.qualifiedSourceId) || null;
  }, [latestCheckpoint, overview]);
  const latestQualificationMetrics = (latestCheckpoint?.metrics?.adapterQualification || {}) as Record<string, any>;
  const latestQualificationGateChecks = (latestQualifiedSource?.gateChecks || latestQualificationMetrics.gateChecks || {}) as Record<string, boolean>;
  const promotionReadinessRows = [
    ['Smoke 5/5', latestQualificationGateChecks.smokePassed100Percent],
    ['Holdout threshold', latestQualificationGateChecks.holdoutThresholdMet],
    ['Fallback limit', latestQualificationGateChecks.fallbackWithinLimit],
    ['No repair-no-progress clusters', latestQualificationGateChecks.repairNoProgressWithinLimit],
  ] as Array<[string, boolean | undefined]>;
  const latestCheckpointQualificationLabel = latestCheckpoint ? (
    latestCheckpoint.promotionStatus === 'QUALIFIED_FOR_LEAF_RTL'
      ? `Qualified source ${latestCheckpoint.qualifiedSourceId || ''}`.trim()
      : latestCheckpointQualificationIssues.length > 0
        ? `Lab-only: ${latestCheckpointQualificationIssues.slice(0, 2).join(', ')}`
        : 'Lab-only until smoke plus promotion holdout gates pass.'
  ) : 'Train and benchmark an adapter before promotion.';
  const latestBenchmarkChildRuns = useMemo(() => {
    if (!latestBenchmark) return [];
    const byId = new Map<string, VhdlLabOverview['recentRuns'][number]>();
    for (const run of overview?.recentRuns || []) {
      if (!byId.has(run.id)) byId.set(run.id, run);
    }
    return (latestBenchmark.childRunIds || []).map((id) => byId.get(id) || { id, status: 'UNKNOWN', currentStage: 'unknown', runType: 'BENCHMARK', contractName: id, candidateCount: 0, maxRepairAttempts: 0 });
  }, [latestBenchmark, overview]);
  const visiblePromptAbBenchmarkCount = showHistory
    ? (overview?.benchmarkRuns || []).filter((run) => run.suiteId === 'prompt_ab_test').length
    : sessionBenchmarks.filter((run) => run.suiteId === 'prompt_ab_test').length;
  const sessionFailureCount = sessionRuns.filter((run) => run.status === 'FAILED').length;
  const visibleTrainingRun = useMemo(() => {
    const trainingRuns = overview?.trainingRuns || [];
    if (showHistory) return trainingRuns[0] || null;
    return trainingRuns.find((run) => sessionTrainingRunIds.has(run.id) || ['QUEUED', 'PREPARING', 'RUNNING'].includes(run.status)) || null;
  }, [overview, sessionTrainingRunIds, showHistory]);
  const mlxTrainingStatus = visibleTrainingRun?.status || (overview?.trainingAvailability?.available ? 'ready' : 'not installed');
  const mlxTrainingDetail = visibleTrainingRun?.status
    ? visibleTrainingRun?.error || 'Current lab-session training run status.'
    : overview?.trainingAvailability?.available
      ? `Detected ${overview.trainingAvailability.source === 'project_venv' ? 'project .venv' : 'PATH'} trainer: ${overview.trainingAvailability.command || 'mlx_lm.lora'}`
      : 'Install mlx-lm in the project .venv to enable local LoRA training.';
  const selectedTrainingOption = mlxTrainingModelOptions.find((option) => option.value === selectedTrainingBaseModel);
  const selectedDatasetSourceOption = datasetSourceOptions.find((option) => option.value === selectedDatasetSource);
  const effectiveTrainingBaseModel = selectedTrainingBaseModel === customTrainingModelValue
    ? customTrainingBaseModel.trim()
    : selectedTrainingBaseModel.trim();
  const promotionStrictnessProfiles = overview?.promotionStrictnessProfiles?.length
    ? overview.promotionStrictnessProfiles
    : fallbackPromotionStrictnessProfiles;
  const selectedPromotionStrictness = promotionStrictnessProfiles.find((profile) => profile.id === selectedPromotionStrictnessProfile)
    || promotionStrictnessProfiles[0];
  const numericPromotionOverride = (key: keyof PromotionStrictnessProfile) => {
    const raw = promotionOverrides[String(key)];
    const parsed = Number(raw);
    return raw !== undefined && raw !== '' && Number.isFinite(parsed) ? parsed : undefined;
  };
  const promotionStrictnessPayload = {
    profileId: selectedPromotionStrictness.id,
    overrides: Object.fromEntries(
      [
        ['maxContracts', numericPromotionOverride('maxContracts')],
        ['minHoldoutContracts', numericPromotionOverride('minHoldoutContracts')],
        ['minHoldoutCategories', numericPromotionOverride('minHoldoutCategories')],
        ['holdoutPassRate', numericPromotionOverride('holdoutPassRate')],
        ['maxFallbackPassCount', numericPromotionOverride('maxFallbackPassCount')],
        ['maxRepairNoProgressCount', numericPromotionOverride('maxRepairNoProgressCount')],
      ].filter(([, value]) => value !== undefined),
    ),
  };
  const promotionStrictnessSummary = {
    maxContracts: numericPromotionOverride('maxContracts') ?? selectedPromotionStrictness.maxContracts,
    minHoldoutContracts: numericPromotionOverride('minHoldoutContracts') ?? selectedPromotionStrictness.minHoldoutContracts,
    minHoldoutCategories: numericPromotionOverride('minHoldoutCategories') ?? selectedPromotionStrictness.minHoldoutCategories,
    holdoutPassRate: numericPromotionOverride('holdoutPassRate') ?? selectedPromotionStrictness.holdoutPassRate,
    maxFallbackPassCount: numericPromotionOverride('maxFallbackPassCount') ?? selectedPromotionStrictness.maxFallbackPassCount,
    maxRepairNoProgressCount: numericPromotionOverride('maxRepairNoProgressCount') ?? (selectedPromotionStrictness.maxRepairNoProgressCount ?? 0),
  };

  const runAction = async (label: string, fn: () => Promise<string>) => {
    setActionBusy(label);
    setError('');
    setMessage('');
    try {
      setMessage(await fn());
      await loadOverview();
    } catch (nextError: any) {
      setError(String(nextError?.message || nextError));
    } finally {
      setActionBusy('');
    }
  };

  const discoverModels = () => runAction('discover-models', async () => {
    const response = await apiFetch('/api/vhdl-lab/models/discover', { method: 'POST' });
    const data = await readVhdlLabJson(response, 'Model discovery');
    if (!response.ok) throw new Error(data?.error || 'Model discovery failed.');
    return data.ok
      ? `Discovered ${data.models?.length || 0} Ollama model(s).`
      : `Ollama unavailable: ${data.error || 'server did not respond'}`;
  });

  const runSelectedDesignWorkflow = () => runAction('run-selected-design', async () => {
    const contractResponse = selectedPresetId
      ? await apiFetch(`/api/vhdl-lab/preset-contracts/${encodeURIComponent(selectedPresetId)}/create-contract`, { method: 'POST' })
      : await apiFetch('/api/vhdl-lab/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Lab Counter Smoke Contract', taskFamily: 'VERIFIED_CORE_RTL', contractJson: sampleContract, sourceType: 'fixture' }),
      });
    const contractData = await readVhdlLabJson(contractResponse, 'Contract creation');
    if (!contractResponse.ok) throw new Error((contractData.issues || []).map((issue: any) => issue.message).join('\n') || contractData.error || 'Contract creation failed.');
    const runResponse = await apiFetch('/api/vhdl-lab/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId: contractData.contract.id, modelProfileId: selectedModelId || null, candidateCount: 1, maxRepairAttempts: 3 }),
    });
    const runData = await readVhdlLabJson(runResponse, 'Run queueing');
    if (!runResponse.ok) throw new Error(runData.error || 'Run queueing failed.');
    setSessionRunIds((current) => new Set([...current, runData.run.id]));
    return `Created contract and queued verification run ${runData.run.id}.`;
  });

  const startLoraTraining = () => runAction('start-lora-training', async () => {
    if (!effectiveTrainingBaseModel) throw new Error('Select an MLX base model, or choose custom and enter a local model path/Hugging Face ID.');
    let datasetId = selectedDatasetId;
    if (!datasetId) {
      const datasetResponse = await apiFetch('/api/vhdl-lab/datasets/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `VHDL Lab ${selectedDatasetSourceOption?.label || 'Dataset'} ${new Date().toISOString()}`,
          sourceType: selectedDatasetSource,
        }),
      });
      const datasetData = await readVhdlLabJson(datasetResponse, 'Dataset build');
      if (!datasetResponse.ok || !datasetData.ok) throw new Error(datasetData.error || datasetData.release?.status || 'Dataset build failed.');
      datasetId = datasetData.release.id;
      setSelectedDatasetId(datasetId);
    }
    const response = await apiFetch('/api/vhdl-lab/training-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        datasetReleaseId: datasetId,
        baseModel: effectiveTrainingBaseModel,
        config: { profile: 'quality_v1' },
      }),
    });
    const data = await readVhdlLabJson(response, 'LoRA training start');
    if (!response.ok || !data.ok) throw new Error(data.error || data.trainingRun?.error || 'LoRA training could not be started.');
    setSessionTrainingRunIds((current) => new Set([...current, data.trainingRun.id]));
    return `Started LoRA training ${data.trainingRun.id}.`;
  });

  const queueBenchmark = () => runAction('queue-benchmark', async () => {
    const response = await apiFetch('/api/vhdl-lab/benchmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suiteId: selectedBenchmarkSuite,
        modelProfileId: selectedModelId || null,
        promptVersionId: selectedPromptVersionId || null,
        seedList: [42],
        maxRepairAttempts: 3,
      }),
    });
    const data = await readVhdlLabJson(response, 'Benchmark queueing');
    if (!response.ok) throw new Error(data.error || 'Benchmark queueing failed.');
    setSessionBenchmarkIds((current) => new Set([...current, data.benchmark.id]));
    setSessionRunIds((current) => new Set([...current, ...(data.benchmark.childRunIds || [])]));
    return `Queued benchmark ${data.benchmark.id} with ${data.benchmark.childRunIds.length} run(s).`;
  });

  const optimizePrompt = () => runAction('optimize-prompt', async () => {
    const template = overview?.promptTemplates?.[0];
    if (!template) throw new Error('No prompt template is available.');
    const response = await apiFetch(`/api/vhdl-lab/prompts/${encodeURIComponent(template.id)}/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ failureClusterId: overview?.failureClusters?.[0]?.id || null }),
    });
    const data = await readVhdlLabJson(response, 'Prompt optimization');
    if (!response.ok) throw new Error(data.error || 'Prompt optimization failed.');
    setSelectedPromptVersionId(data.promptVersion.id);
    return `Created prompt candidate ${data.promptVersion.id}.`;
  });

  const startPromptAbTest = () => runAction('prompt-ab-test', async () => {
    if (!selectedPromptVersionId) throw new Error('Select a prompt version before starting A/B.');
    const response = await apiFetch(`/api/vhdl-lab/prompt-versions/${encodeURIComponent(selectedPromptVersionId)}/ab-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelProfileId: selectedModelId || null, seedList: [42], maxRepairAttempts: 3 }),
    });
    const data = await readVhdlLabJson(response, 'Prompt A/B test');
    if (!response.ok) throw new Error(data.error || 'Prompt A/B test could not be queued.');
    return `Queued prompt A/B across ${data.promptVersionIds.length} prompt version(s).`;
  });

  const benchmarkLatestCheckpoint = () => runAction('benchmark-latest-checkpoint', async () => {
    if (!latestCheckpoint) throw new Error('No LoRA checkpoint is available yet. Start training first.');
    const response = await apiFetch(`/api/vhdl-lab/checkpoints/${encodeURIComponent(latestCheckpoint.id)}/benchmark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suiteId: selectedBenchmarkSuite, maxRepairAttempts: 3 }),
    });
    const data = await readVhdlLabJson(response, 'Checkpoint benchmark');
    if (!response.ok || !data.ok) throw new Error(data.error || 'Checkpoint benchmark could not be started.');
    setSessionBenchmarkIds((current) => new Set([...current, data.benchmark.id]));
    return `Started adapter generation benchmark ${data.benchmark.id} for ${selectedBenchmarkSuite.replace(/_/g, ' ')}.`;
  });

  const benchmarkPromotionHoldout = () => runAction('benchmark-promotion-holdout', async () => {
    if (!latestCheckpoint) throw new Error('No LoRA checkpoint is available yet. Start training first.');
    const response = await apiFetch(`/api/vhdl-lab/checkpoints/${encodeURIComponent(latestCheckpoint.id)}/promotion-benchmark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxRepairAttempts: 3, promotionStrictness: promotionStrictnessPayload }),
    });
    const data = await readVhdlLabJson(response, 'Adapter promotion benchmark');
    if (!response.ok || !data.ok) throw new Error(data.error || 'Promotion benchmark could not be started.');
    setSessionBenchmarkIds((current) => new Set([...current, data.benchmark.id]));
    return `Started production promotion benchmark ${data.benchmark.id}.`;
  });

  const promoteLatestCheckpoint = () => runAction('promote-latest-checkpoint', async () => {
    if (!latestCheckpoint) throw new Error('No LoRA checkpoint is available yet. Start training first.');
    const response = await apiFetch(`/api/vhdl-lab/checkpoints/${encodeURIComponent(latestCheckpoint.id)}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await readVhdlLabJson(response, 'Adapter promotion');
    if (!response.ok || !data.ok) throw new Error(data.error || 'Adapter checkpoint did not pass the qualification gates.');
    return `Promoted ${data.source.id} as a qualified leaf-RTL adapter source.`;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-brand-cyan/25 bg-brand-surface shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between gap-4 border-b border-brand-outline-variant/40 bg-brand-surface-lowest px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 p-2 text-brand-cyan">
              <FlaskConical size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-brand-cyan">VHDL Fine-Tuning Lab</div>
              <h2 className="truncate text-xl font-black text-brand-on-surface">Train, benchmark, and qualify VHDL LoRA adapters</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadOverview()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-brand-outline-variant/40 bg-brand-surface-high px-3 py-2 text-[12px] font-bold uppercase tracking-wide text-slate-100 hover:bg-brand-surface-bright disabled:opacity-50"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Refresh
            </button>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-brand-surface-high hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {error ? (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-[12px] text-rose-100">
              <AlertCircle size={15} className="mt-0.5 flex-none" />
              <pre className="whitespace-pre-wrap font-mono">{error}</pre>
            </div>
          ) : null}
          {message ? (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-[12px] text-emerald-100">
              <CheckCircle2 size={15} />
              <span>{message}</span>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <MetricCard label="MLX/LoRA" value={mlxTrainingStatus} detail={mlxTrainingDetail} />
            <MetricCard label="Datasets" value={counts.datasetReleases ?? 0} detail={`${overview?.datasetReleases?.length || 0} available release(s)`} />
            <MetricCard label="Latest checkpoint" value={latestCheckpoint?.status || 'none'} detail={latestCheckpoint?.id || 'Train an adapter first'} />
            <MetricCard label="Qualified adapter" value={latestCheckpoint?.promotionStatus || 'LAB_ONLY'} detail={latestCheckpointQualificationLabel} />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-2xl border border-brand-outline-variant/30 bg-brand-surface-low p-4">
              <div className="mb-4">
                <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-brand-secondary">Fine-Tuning Workflow</div>
                <div className="mt-1 text-[13px] text-slate-400">
                  Choose the training data and MLX base model, then run the single training action. The app builds the dataset first when needed.
                </div>
                <div className="mt-3 rounded-lg border border-brand-cyan/20 bg-brand-cyan/10 px-3 py-2 text-[11px] font-bold text-brand-cyan">
                  Quality v1: 3 epochs · 4,096 tokens · all layers · rank 16 · effective batch 8 · full validation/test · best-checkpoint selection
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="block rounded-xl border border-brand-outline-variant/30 bg-brand-surface-lowest p-3">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-brand-secondary">Training Dataset</span>
                  <select
                    value={selectedDatasetId}
                    onChange={(event) => setSelectedDatasetId(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-brand-outline-variant/40 bg-brand-surface px-3 py-2 text-[12px] font-bold text-brand-on-surface outline-none"
                  >
                    <option value="">Auto-build from selected source</option>
                    {(overview?.datasetReleases || []).filter((release) => release.status === 'BUILT').map((release) => (
                      <option key={release.id} value={release.id}>{release.id} · {release.recordCount || 0} records</option>
                    ))}
                  </select>
                  <span className="mt-2 block text-[11px] text-slate-500">Use an immutable dataset release, or let the lab build one before training.</span>
                  {!selectedDatasetId ? (
                    <>
                      <select
                        value={selectedDatasetSource}
                        onChange={(event) => setSelectedDatasetSource(event.target.value)}
                        className="mt-2 w-full rounded-lg border border-brand-outline-variant/40 bg-brand-surface px-3 py-2 text-[12px] font-bold text-brand-on-surface outline-none"
                      >
                        {datasetSourceOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <span className="mt-2 block text-[11px] text-slate-500">{selectedDatasetSourceOption?.detail}</span>
                    </>
                  ) : null}
                </label>

                <label className="block rounded-xl border border-brand-outline-variant/30 bg-brand-surface-lowest p-3">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-brand-secondary">MLX Coding/VHDL Base Model</span>
                  <select
                    value={selectedTrainingBaseModel}
                    onChange={(event) => setSelectedTrainingBaseModel(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-brand-outline-variant/40 bg-brand-surface px-3 py-2 text-[12px] font-bold text-brand-on-surface outline-none"
                  >
                    {mlxTrainingModelOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {selectedTrainingBaseModel === customTrainingModelValue ? (
                    <input
                      value={customTrainingBaseModel}
                      onChange={(event) => setCustomTrainingBaseModel(event.target.value)}
                      placeholder="/path/to/mlx-model or mlx-community/..."
                      className="mt-2 w-full rounded-lg border border-brand-outline-variant/40 bg-brand-surface px-3 py-2 text-[12px] font-bold text-brand-on-surface outline-none"
                    />
                  ) : null}
                  <span className="mt-2 block text-[11px] text-slate-500">
                    {selectedTrainingOption?.detail || 'Use an MLX-compatible Hugging Face model ID or a local converted model directory.'}
                  </span>
                </label>
              </div>

              <button
                onClick={startLoraTraining}
                disabled={Boolean(actionBusy) || !overview?.trainingAvailability?.available}
                className="mt-4 w-full rounded-xl border border-brand-amber/30 bg-brand-amber/10 px-4 py-4 text-left text-[13px] font-black text-brand-amber hover:bg-brand-amber/15 disabled:opacity-50"
              >
                {actionBusy === 'start-lora-training' ? <Loader2 size={16} className="mb-2 animate-spin" /> : <Database size={16} className="mb-2" />}
                Build Dataset + Start Quality Training
              </button>

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <MetricCard label="Dataset releases" value={counts.datasetReleases ?? 0} />
                <MetricCard label="Training runs" value={overview?.trainingRuns?.length || 0} />
                <MetricCard label="Checkpoints" value={overview?.checkpoints?.length || 0} />
                <MetricCard label="Session failures" value={sessionFailureCount} />
              </div>
            </section>

            <section className="rounded-2xl border border-brand-outline-variant/30 bg-brand-surface-low p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-brand-secondary">Adapter Qualification</div>
                  <div className="mt-1 text-[13px] text-slate-400">Benchmark the latest checkpoint, run the production holdout, then promote only when gates pass.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistory((value) => !value)}
                  className="rounded-xl border border-brand-outline-variant/30 bg-brand-surface-lowest px-3 py-2 text-[12px] font-bold uppercase tracking-wide text-slate-300 hover:bg-brand-surface"
                >
                  {showHistory ? 'Hide History' : 'Show History'}
                </button>
              </div>

              <label className="block rounded-xl border border-brand-outline-variant/30 bg-brand-surface-lowest p-3">
                <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-brand-secondary">Adapter Benchmark Suite</span>
                <select
                  value={selectedBenchmarkSuite}
                  onChange={(event) => setSelectedBenchmarkSuite(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-brand-outline-variant/40 bg-brand-surface px-3 py-2 text-[12px] font-bold text-brand-on-surface outline-none"
                >
                  <option value="smoke_core_contracts">Smoke Core Contracts</option>
                  <option value="sweep_5_designs">5-Design Sweep Contracts</option>
                  <option value="holdout_regression_contracts">Holdout Regression Contracts</option>
                  <option value="known_failure_clusters">Known Failure Clusters</option>
                </select>
                <span className="mt-2 block text-[11px] text-slate-500">Used only to benchmark the latest LoRA adapter; it does not start generic VHDL generation runs.</span>
              </label>

              <div className="mt-3 rounded-xl border border-brand-outline-variant/30 bg-brand-surface-lowest p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <label className="block min-w-[220px] flex-1">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-brand-secondary">Promotion Strictness</span>
                    <select
                      value={selectedPromotionStrictnessProfile}
                      onChange={(event) => {
                        setSelectedPromotionStrictnessProfile(event.target.value);
                        setPromotionOverrides({});
                      }}
                      className="mt-2 w-full rounded-lg border border-brand-outline-variant/40 bg-brand-surface px-3 py-2 text-[12px] font-bold text-brand-on-surface outline-none"
                    >
                      {promotionStrictnessProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>{profile.label}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPromotionAdvanced((value) => !value)}
                    className="mt-6 rounded-lg border border-brand-outline-variant/30 bg-brand-surface px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-300 hover:bg-brand-surface-high"
                  >
                    {showPromotionAdvanced ? 'Hide Overrides' : 'Advanced Overrides'}
                  </button>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">{selectedPromotionStrictness.description}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] md:grid-cols-3">
                  <div className="rounded-lg bg-brand-surface px-2 py-1">Max: <span className="font-bold text-brand-on-surface">{promotionStrictnessSummary.maxContracts}</span></div>
                  <div className="rounded-lg bg-brand-surface px-2 py-1">Min: <span className="font-bold text-brand-on-surface">{promotionStrictnessSummary.minHoldoutContracts}</span></div>
                  <div className="rounded-lg bg-brand-surface px-2 py-1">Categories: <span className="font-bold text-brand-on-surface">{selectedPromotionStrictness.requireAllAvailableCategories ? 'all available' : promotionStrictnessSummary.minHoldoutCategories}</span></div>
                  <div className="rounded-lg bg-brand-surface px-2 py-1">Pass rate: <span className="font-bold text-brand-on-surface">{Math.round(promotionStrictnessSummary.holdoutPassRate * 100)}%</span></div>
                  <div className="rounded-lg bg-brand-surface px-2 py-1">Fallback: <span className="font-bold text-brand-on-surface">{promotionStrictnessSummary.maxFallbackPassCount}</span></div>
                  <div className="rounded-lg bg-brand-surface px-2 py-1">No-progress: <span className="font-bold text-brand-on-surface">{promotionStrictnessSummary.maxRepairNoProgressCount}</span></div>
                </div>
                {showPromotionAdvanced ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
                    {[
                      ['maxContracts', 'Max contracts'],
                      ['minHoldoutContracts', 'Min contracts'],
                      ['minHoldoutCategories', 'Min categories'],
                      ['holdoutPassRate', 'Pass rate (0-1)'],
                      ['maxFallbackPassCount', 'Fallback passes'],
                      ['maxRepairNoProgressCount', 'No-progress clusters'],
                    ].map(([key, label]) => (
                      <label key={key} className="block">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-brand-secondary">{label}</span>
                        <input
                          value={promotionOverrides[key] || ''}
                          onChange={(event) => setPromotionOverrides((current) => ({ ...current, [key]: event.target.value }))}
                          placeholder={String((promotionStrictnessSummary as Record<string, number>)[key])}
                          className="mt-1 w-full rounded-lg border border-brand-outline-variant/40 bg-brand-surface px-2 py-2 text-[12px] font-bold text-brand-on-surface outline-none"
                        />
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-3 grid gap-2">
                <button
                  type="button"
                  onClick={benchmarkLatestCheckpoint}
                  disabled={Boolean(actionBusy) || !latestCheckpoint}
                  className="rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-3 text-left text-[12px] font-bold text-brand-cyan hover:bg-brand-cyan/15 disabled:opacity-50"
                >
                  {actionBusy === 'benchmark-latest-checkpoint' ? <Loader2 size={14} className="mb-2 animate-spin" /> : <Play size={14} className="mb-2" />}
                  Benchmark Best Adapter
                </button>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={benchmarkPromotionHoldout}
                    disabled={Boolean(actionBusy) || !latestCheckpoint}
                    className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-3 text-left text-[12px] font-bold text-amber-200 hover:bg-amber-500/15 disabled:opacity-50"
                  >
                    {actionBusy === 'benchmark-promotion-holdout' ? <Loader2 size={14} className="mb-2 animate-spin" /> : <RefreshCw size={14} className="mb-2" />}
                    Run Promotion Holdout
                  </button>
                  <button
                    type="button"
                    onClick={promoteLatestCheckpoint}
                    disabled={Boolean(actionBusy) || !latestCheckpoint}
                    className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-3 text-left text-[12px] font-bold text-emerald-200 hover:bg-emerald-500/15 disabled:opacity-50"
                  >
                    {actionBusy === 'promote-latest-checkpoint' ? <Loader2 size={14} className="mb-2 animate-spin" /> : <CheckCircle2 size={14} className="mb-2" />}
                    Promote Qualified Adapter
                  </button>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-5 rounded-2xl border border-brand-outline-variant/30 bg-brand-surface-low p-4">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-brand-secondary">Fine-Tuning Status</div>
                <div className="mt-1 text-[13px] text-slate-400">
                  Clean start view: only current-session training and adapter qualification details are shown unless history is enabled.
                </div>
              </div>
              <div className={`rounded-xl border px-3 py-2 text-[12px] font-bold uppercase tracking-wide ${statusTone(visibleTrainingRun?.status || latestCheckpointBenchmark?.status || latestCheckpoint?.status || '')}`}>
                {visibleTrainingRun?.status ? `Training: ${visibleTrainingRun.status}` : latestCheckpointBenchmark?.status ? `Benchmark: ${latestCheckpointBenchmark.status}` : latestCheckpoint?.status || 'No active fine-tuning run'}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-3">
                <div className={`rounded-xl border px-4 py-3 text-[12px] ${statusTone(mlxTrainingStatus)}`}>
                  <div className="font-bold">MLX/LoRA training: {mlxTrainingStatus}</div>
                  <div className="mt-1 text-slate-400">{mlxTrainingDetail}</div>
                  {visibleTrainingRun ? (
                    <div className="mt-2 break-all font-mono text-slate-300">{visibleTrainingRun.id}</div>
                  ) : null}
                </div>

                <div className={`rounded-xl border px-4 py-3 text-[12px] ${statusTone(latestCheckpointBenchmark?.status || '')}`}>
                  <div className="font-bold">Adapter generation benchmark: {latestCheckpointBenchmark?.status || 'available'}</div>
                  <div className="mt-1 text-slate-400">{latestCheckpointBenchmarkLabel}</div>
                </div>

                <div className={`rounded-xl border px-4 py-3 text-[12px] ${statusTone(latestCheckpoint?.promotionStatus || '')}`}>
                  <div className="font-bold">Qualified leaf-RTL adapter: {latestCheckpoint?.promotionStatus || 'LAB_ONLY'}</div>
                  <div className="mt-1 text-slate-400">{latestCheckpointQualificationLabel}</div>
                </div>
              </div>

              <div className="rounded-xl border border-brand-outline-variant/25 bg-brand-surface-lowest p-4 text-[12px] text-slate-400">
                <div className="font-bold text-brand-on-surface">Latest checkpoint</div>
                {latestCheckpoint ? (
                  <>
                    <div className="mt-1 break-all font-mono">{latestCheckpoint.id}</div>
                    {showCheckpointDetails ? (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-brand-surface px-2 py-1">Status: <span className="font-bold text-brand-on-surface">{latestCheckpoint.status}</span></div>
                        <div className="rounded-lg bg-brand-surface px-2 py-1">Promotion: <span className="font-bold text-brand-on-surface">{latestCheckpoint.promotionStatus || 'LAB_ONLY'}</span></div>
                        <div className="rounded-lg bg-brand-surface px-2 py-1">Pass rate: <span className="font-bold text-brand-on-surface">{latestCheckpointBenchmark || showHistory ? `${latestCheckpointCounts.total ? Math.round((latestCheckpointCounts.passed / latestCheckpointCounts.total) * 100) : 0}%` : 'not run this session'}</span></div>
                        <div className="rounded-lg bg-brand-surface px-2 py-1">Adapter-authored: <span className="font-bold text-brand-on-surface">{latestCheckpoint.adapterAuthoredPassCount ?? 0}</span></div>
                        <div className="rounded-lg bg-brand-surface px-2 py-1">Fallback passes: <span className="font-bold text-brand-on-surface">{latestCheckpoint.fallbackPassCount ?? 0}</span></div>
                        <div className="rounded-lg bg-brand-surface px-2 py-1">Loss: <span className="font-bold text-brand-on-surface">{latestCheckpoint.metrics?.mlxHeldoutTestLoss ?? 'not measured'}</span></div>
                        <div className="rounded-lg bg-brand-surface px-2 py-1">PPL: <span className="font-bold text-brand-on-surface">{latestCheckpoint.metrics?.mlxHeldoutTestPpl ?? 'not measured'}</span></div>
                      </div>
                    ) : (
                      <div className="mt-3 rounded-lg bg-brand-surface px-3 py-2 text-slate-500">
                        Historical checkpoint stats are hidden on startup. Run a fresh benchmark or enable history to inspect previous reports.
                      </div>
                    )}
                    {Number(latestImprovement.comparableContracts || 0) > 0 ? (
                      <div className="mt-3 rounded-lg border border-brand-cyan/20 bg-brand-cyan/10 px-3 py-2">
                        <div className="font-bold text-brand-on-surface">Adapter improvement vs base model</div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-brand-surface px-2 py-1">Baseline pass: <span className="font-bold text-brand-on-surface">{percentLabel(latestImprovement.baselinePassRate)}</span></div>
                          <div className="rounded-lg bg-brand-surface px-2 py-1">Adapter pass: <span className="font-bold text-brand-on-surface">{percentLabel(latestImprovement.adapterPassRate)}</span></div>
                          <div className="rounded-lg bg-brand-surface px-2 py-1">Improvement: <span className={`font-bold ${Number(latestImprovement.passRateDeltaPoints || 0) >= 0 ? 'text-emerald-200' : 'text-rose-200'}`}>{signedPointsLabel(latestImprovement.passRateDeltaPoints)}</span></div>
                          <div className="rounded-lg bg-brand-surface px-2 py-1">Regressions: <span className={`font-bold ${Number(latestImprovement.regressionCount || 0) > 0 ? 'text-rose-200' : 'text-emerald-200'}`}>{Number(latestImprovement.regressionCount || 0)}</span></div>
                          <div className="rounded-lg bg-brand-surface px-2 py-1">Repairs: <span className="font-bold text-brand-on-surface">{String(latestImprovement.baselineAverageRepairAttempts ?? 'n/a')} to {String(latestImprovement.adapterAverageRepairAttempts ?? 'n/a')}</span></div>
                          <div className="rounded-lg bg-brand-surface px-2 py-1">Timeouts: <span className="font-bold text-brand-on-surface">{String(latestImprovement.baselineTimeouts ?? 'n/a')} to {String(latestImprovement.adapterTimeouts ?? 'n/a')}</span></div>
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-3 rounded-lg border border-brand-outline-variant/20 bg-brand-surface px-3 py-2">
                      <div className="font-bold text-brand-on-surface">Production readiness checklist</div>
                      <div className="mt-2 grid gap-1">
                        {promotionReadinessRows.map(([label, passed]) => (
                          <div key={label} className="flex items-center justify-between gap-2 rounded-md bg-brand-surface-lowest px-2 py-1">
                            <span>{label}</span>
                            <span className={passed ? 'font-bold text-emerald-200' : passed === false ? 'font-bold text-rose-200' : 'font-bold text-slate-500'}>
                              {passed ? 'ready' : passed === false ? 'blocked' : 'not checked'}
                            </span>
                          </div>
                        ))}
                      </div>
                      {latestCheckpointQualificationIssues.length > 0 ? (
                        <div className="mt-2 rounded-lg border border-amber-400/25 bg-amber-500/10 px-2 py-2 text-amber-100">
                          {latestCheckpointQualificationIssues.slice(0, 4).join(', ')}
                        </div>
                      ) : null}
                      {latestQualifiedSource ? (
                        <div className="mt-2 space-y-1 text-slate-400">
                          <div>Smoke pass rate: <span className="font-bold text-brand-on-surface">{Math.round((latestQualifiedSource.smokePassRate || 0) * 100)}%</span></div>
                          <div>Holdout pass rate: <span className="font-bold text-brand-on-surface">{Math.round((latestQualifiedSource.holdoutPassRate || 0) * 100)}%</span></div>
                          <div>Holdout coverage: <span className="font-bold text-brand-on-surface">{Object.keys(latestQualifiedSource.categoryCoverage || {}).length} categor{Object.keys(latestQualifiedSource.categoryCoverage || {}).length === 1 ? 'y' : 'ies'}</span></div>
                          <div className="break-all">Audit: <span className="font-mono text-brand-on-surface">{latestQualifiedSource.promotionAuditPath || 'not written'}</span></div>
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="mt-3 rounded-lg bg-brand-surface px-3 py-2 text-slate-500">
                    No checkpoint yet. Choose a dataset and base model, then start LoRA training.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
