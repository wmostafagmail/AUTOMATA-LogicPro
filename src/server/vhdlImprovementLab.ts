import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { FPGA_ARCHITECT_SWEEP_DESIGNS } from '../fpgaArchitectSweepConfig';
import { buildVerifiedVhdlLibraryTrainingRecords } from './fpgaVhdlLibraryTrainingDataset';
import {
  assignVhdlQualityDatasetSplit,
  auditVhdlQualitySplitOverlaps,
  deduplicateVhdlTrainingRecords,
  normalizeVhdlContentForHash,
  parseMlxTrainingMetrics,
  renderMlxLoraConfigYaml,
  renderMlxLoraTestConfigYaml,
  resolveVhdlQualityTrainingConfig,
  selectBestMlxAdapterCandidate,
  validateVhdlQualityDatasetMinimums,
  type VhdlQualityTrainingConfig,
} from './vhdlTrainingQuality';

const execFileAsync = promisify(execFile);
const activeVhdlLabTrainingProcesses = new Map<string, ReturnType<typeof spawn>>();
const activeVhdlLabCheckpointBenchmarks = new Set<string>();
const vhdlLabStateWriteQueues = new Map<string, Promise<void>>();

export type VhdlLabProviderType = 'OLLAMA' | 'LM_STUDIO' | 'MLX_LM_DIRECT' | 'CUSTOM_OPENAI_COMPATIBLE';
export type VhdlLabApiMode = 'OLLAMA_NATIVE' | 'LM_STUDIO_NATIVE_V1' | 'OPENAI_CHAT_COMPLETIONS' | 'OPENAI_RESPONSES' | 'LOCAL_SUBPROCESS';
export type VhdlLabModelRole =
  | 'GENERATOR'
  | 'REPAIRER'
  | 'PROMPT_OPTIMIZER'
  | 'TESTBENCH_GENERATOR'
  | 'BENCHMARK_TARGET'
  | 'TRAINING_BASE';
export type VhdlLabContractStatus = 'DRAFT' | 'VALIDATED' | 'FROZEN' | 'RETIRED';
export type VhdlLabRunStatus =
  | 'QUEUED'
  | 'PREPARING'
  | 'GENERATING'
  | 'EXTRACTING'
  | 'VALIDATING_INTERFACE'
  | 'ANALYZING'
  | 'ELABORATING'
  | 'SYNTHESIZING'
  | 'GENERATING_TESTBENCH'
  | 'SIMULATING'
  | 'MUTATION_TESTING'
  | 'REPAIRING'
  | 'ACCEPTED'
  | 'QUARANTINED'
  | 'FAILED'
  | 'CANCELLED';

export type VhdlLabProvider = {
  id: string;
  name: string;
  providerType: VhdlLabProviderType;
  baseUrl: string;
  apiMode: VhdlLabApiMode;
  enabled: boolean;
  capabilities: Record<string, unknown>;
  healthStatus: 'unknown' | 'healthy' | 'unavailable';
  lastHealthCheckAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VhdlLabModelProfile = {
  id: string;
  providerId: string;
  displayName: string;
  modelIdentifier: string;
  localPath: string | null;
  role: VhdlLabModelRole;
  contextLength: number;
  defaultTemperature: number;
  defaultSeed: number;
  defaultMaxTokens: number;
  supportsStructuredOutput: boolean;
  supportsTools: boolean;
  enabled: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type VhdlLabVerificationProfile = {
  id: string;
  name: string;
  vhdlStandard: '08' | '93' | '02' | '19';
  ghdlPath: string;
  analysisRequired: boolean;
  elaborationRequired: boolean;
  synthesisRequired: boolean;
  simulationRequired: boolean;
  passMarkerRequired: boolean;
  mutationTestingRequired: boolean;
  simulationTimeoutSeconds: number;
  synthesisTimeoutSeconds: number;
  prohibitedPackages: string[];
  warningPolicy: 'record' | 'fail';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type VhdlLabHardwareContract = {
  id: string;
  name: string;
  version: number;
  status: VhdlLabContractStatus;
  taskFamily: string;
  entityName: string;
  contractJson: VhdlContractDocument;
  contractHash: string;
  sourceType: 'user' | 'import' | 'fpga_architect' | 'fixture';
  sourceReference: string | null;
  holdoutGroup: string | null;
  isBenchmarkHoldout: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type VhdlLabPromptTemplate = {
  id: string;
  name: string;
  role: VhdlLabModelRole;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VhdlLabPromptVersion = {
  id: string;
  templateId: string;
  versionNumber: number;
  parentVersionId: string | null;
  status: 'DRAFT' | 'CANDIDATE' | 'ACTIVE' | 'REJECTED' | 'ARCHIVED';
  systemPrompt: string;
  userPromptTemplate: string;
  responseSchema: Record<string, unknown>;
  changeReason: string;
  triggerFailureClusterId: string | null;
  promptHash: string;
  createdAt: string;
  promotedAt: string | null;
  rejectedAt: string | null;
  metrics: Record<string, unknown>;
};

export type VhdlLabGenerationRun = {
  id: string;
  contractId: string;
  modelProfileId: string | null;
  promptVersionId: string | null;
  verificationProfileId: string;
  runType: 'RTL_GENERATION' | 'TESTBENCH_GENERATION' | 'REPAIR' | 'PROMPT_AB_TEST' | 'REPEATABILITY_TEST' | 'BENCHMARK';
  status: VhdlLabRunStatus;
  seed: number;
  temperature: number;
  maxTokens: number;
  candidateCount: number;
  maxRepairAttempts: number;
  workspacePath: string;
  currentStage: string;
  stageLog: Array<{ at: string; stage: string; status: string; message: string }>;
  benchmarkSuiteId?: string | null;
  datasetReleaseId?: string | null;
  promptVersionIds?: string[];
  seedList?: number[];
  metrics?: Record<string, unknown>;
  repairAuditPath?: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
};

export type VhdlLabWorkerSnapshot = {
  enabled: boolean;
  running: boolean;
  started: boolean;
  currentRunId: string | null;
  lastTickAt: string | null;
  lastError: string | null;
};

export type VhdlLabPresetContract = {
  id: string;
  key: string;
  label: string;
  designClass: string;
  entityName: string;
  taskFamily: string;
  contractJson: VhdlContractDocument;
};

export type VhdlLabFailureCluster = {
  id: string;
  category: string;
  signature: string;
  normalizedMessage: string;
  occurrenceCount: number;
  affectedTaskFamilies: string[];
  affectedPromptVersions: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  status: 'OPEN' | 'PROMPT_PATCH_PROPOSED' | 'UNDER_AB_TEST' | 'RESOLVED' | 'DISMISSED';
  representativeAttemptIds: string[];
};

export type VhdlLabRepairPacket = {
  failureCode: string;
  stage: string;
  fileLine: string | null;
  excerpt: string;
  validatorOutput: string;
  ghdlOutput: string;
  forbiddenPattern: string;
  legalReplacement: string;
  previousCandidatePath: string | null;
  candidateAttempt: number;
  contentHash: string | null;
  advisor?: VhdlLabFailureAdvisor;
  createdAt: string;
};

export type VhdlLabFailureAdvisor = {
  rootCauseOwner: 'app_testbench_renderer' | 'generated_rtl' | 'prompt' | 'validator' | 'model_capacity' | 'unknown';
  failureClass: string;
  deterministicFixPossible: boolean;
  recommendedAction: string;
};

export type VhdlLabDatasetRelease = {
  id: string;
  schemaVersion: 1 | 2;
  status: 'BUILT' | 'AUDIT_FAILED';
  name: string;
  recordCount: number;
  trainCount: number;
  validationCount: number;
  testCount: number;
  holdoutCount: number;
  manifestPath: string;
  datasetPath: string;
  sourceRunIds: string[];
  sourceArtifactIds: string[];
  createdAt: string;
  frozenAt: string | null;
  audit: Record<string, unknown>;
};

export type VhdlLabDatasetSource = 'accepted_artifacts' | 'verified_10k_blocks' | 'mixed_accepted_and_verified_10k';

export type VhdlLabTrainingRun = {
  id: string;
  status: 'QUEUED' | 'RUNNING' | 'BLOCKED_MLX_UNAVAILABLE' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  datasetReleaseId: string;
  baseModel: string;
  adapterName: string;
  config: Record<string, unknown>;
  outputPath: string;
  logPath: string;
  checkpointIds: string[];
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
};

export type VhdlLabAdapterPromotionStatus = 'LAB_ONLY' | 'QUALIFIED_FOR_LEAF_RTL' | 'REJECTED' | 'STALE';

export type VhdlLabPromotionStrictnessId =
  | 'fast_check'
  | 'standard_qualification'
  | 'production_qualification'
  | 'release_signoff';

export type VhdlLabPromotionStrictnessProfile = {
  id: VhdlLabPromotionStrictnessId;
  label: string;
  description: string;
  maxContracts: number;
  minHoldoutContracts: number;
  minHoldoutCategories: number;
  holdoutPassRate: number;
  maxFallbackPassCount: number;
  maxRepairNoProgressCount: number;
  requireAllAvailableCategories?: boolean;
};

export type VhdlLabPromotionStrictnessInput = {
  profileId?: string | null;
  overrides?: Partial<Record<'maxContracts' | 'minHoldoutContracts' | 'minHoldoutCategories' | 'holdoutPassRate' | 'maxFallbackPassCount' | 'maxRepairNoProgressCount', number | string | null>>;
};

export type VhdlLabResolvedPromotionStrictness = VhdlLabPromotionStrictnessProfile & {
  sourceProfileId: VhdlLabPromotionStrictnessId;
  advancedOverrides: Record<string, number>;
};

export const VHDL_LAB_PROMOTION_STRICTNESS_PROFILES: VhdlLabPromotionStrictnessProfile[] = [
  {
    id: 'fast_check',
    label: 'Fast check',
    description: 'Quick smoke-style confidence check for iteration.',
    maxContracts: 30,
    minHoldoutContracts: 10,
    minHoldoutCategories: 2,
    holdoutPassRate: 0.9,
    maxFallbackPassCount: 0,
    maxRepairNoProgressCount: 0,
  },
  {
    id: 'standard_qualification',
    label: 'Standard qualification',
    description: 'Balanced qualification before serious adapter comparison.',
    maxContracts: 100,
    minHoldoutContracts: 50,
    minHoldoutCategories: 5,
    holdoutPassRate: 0.93,
    maxFallbackPassCount: 0,
    maxRepairNoProgressCount: 0,
  },
  {
    id: 'production_qualification',
    label: 'Production qualification',
    description: 'Production-grade leaf RTL adapter promotion gate.',
    maxContracts: 250,
    minHoldoutContracts: 100,
    minHoldoutCategories: 8,
    holdoutPassRate: 0.95,
    maxFallbackPassCount: 0,
    maxRepairNoProgressCount: 0,
  },
  {
    id: 'release_signoff',
    label: 'Release/signoff',
    description: 'Large release gate across all available holdout categories.',
    maxContracts: 1000,
    minHoldoutContracts: 250,
    minHoldoutCategories: 1,
    holdoutPassRate: 0.99,
    maxFallbackPassCount: 0,
    maxRepairNoProgressCount: 0,
    requireAllAvailableCategories: true,
  },
];

export type VhdlLabCheckpoint = {
  id: string;
  trainingRunId: string;
  checkpointPath: string;
  benchmarkRunIds: string[];
  status: 'CREATED' | 'BENCHMARKED' | 'PROMOTED' | 'REJECTED';
  metrics: Record<string, unknown>;
  promotionStatus?: VhdlLabAdapterPromotionStatus;
  promotionBenchmarks?: string[];
  fallbackPassCount?: number;
  adapterAuthoredPassCount?: number;
  qualifiedForFpgaArchitectAt?: string | null;
  qualificationIssues?: string[];
  qualifiedSourceId?: string | null;
  createdAt: string;
};

export type QualifiedAdapterGenerationSource = {
  id: string;
  checkpointId: string;
  adapterPath: string;
  baseModel: string;
  datasetReleaseId: string;
  promptVersionId: string | null;
  smokeBenchmarkId: string | null;
  holdoutBenchmarkId: string | null;
  benchmarkSuiteIds: string[];
  smokePassRate: number;
  holdoutPassRate: number;
  fallbackPassCount: number;
  adapterAuthoredPassCount: number;
  acceptedArtifactPaths: string[];
  qualificationIssues: string[];
  promotionAuditPath: string;
  promotionStrictness?: VhdlLabResolvedPromotionStrictness;
  categoryCoverage: Record<string, number>;
  gateChecks: Record<string, boolean>;
  status: VhdlLabAdapterPromotionStatus;
  createdAt: string;
  promotedAt: string | null;
  rejectedAt: string | null;
};

export type VhdlLabBenchmarkRun = {
  id: string;
  suiteId: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  contractIds: string[];
  childRunIds: string[];
  modelProfileId: string | null;
  promptVersionId: string | null;
  seedList: number[];
  maxRepairAttempts: number;
  summary: Record<string, unknown>;
  resultPath: string;
  createdAt: string;
  completedAt: string | null;
};

export type VhdlLabState = {
  schemaVersion: 1;
  providers: VhdlLabProvider[];
  models: VhdlLabModelProfile[];
  verificationProfiles: VhdlLabVerificationProfile[];
  contracts: VhdlLabHardwareContract[];
  promptTemplates: VhdlLabPromptTemplate[];
  promptVersions: VhdlLabPromptVersion[];
  runs: VhdlLabGenerationRun[];
  failureClusters: VhdlLabFailureCluster[];
  datasetReleases: VhdlLabDatasetRelease[];
  trainingRuns: VhdlLabTrainingRun[];
  checkpoints?: VhdlLabCheckpoint[];
  benchmarkRuns?: VhdlLabBenchmarkRun[];
  qualifiedAdapterSources?: QualifiedAdapterGenerationSource[];
  acceptedArtifacts: any[];
  updatedAt: string;
};

export type VhdlContractDocument = {
  contract_version: '1.0';
  entity: { name: string; description?: string };
  generics: Array<{ name: string; type: string; default?: string; constraints?: string[] }>;
  ports: Array<{ name: string; mode: 'in' | 'out' | 'inout' | 'buffer'; type: string; semantic_role?: string }>;
  clocking?: { domains?: Array<{ name: string; clock_port: string; edge?: 'rising' | 'falling' }> };
  reset?: { port?: string; polarity?: 'active_high' | 'active_low'; synchronous?: boolean; reset_values?: Record<string, string> };
  behavior: unknown[];
  corner_cases: unknown[];
  prohibited_implementations: string[];
  synthesis_requirements: string[];
  testbench_obligations: string[];
  pass_marker: string;
};

export type VhdlLabValidationIssue = {
  code: string;
  path: string;
  message: string;
};

export type VhdlExtractionResult =
  | { ok: true; vhdl: string; entityName: string; architectureName: string }
  | { ok: false; issues: VhdlLabValidationIssue[] };

type FailedVhdlExtractionResult = Extract<VhdlExtractionResult, { ok: false }>;

export type ParsedVhdlEntityInterface = {
  entityName: string;
  generics: Array<{ name: string; type: string }>;
  ports: Array<{ name: string; mode: string; type: string }>;
};

const vhdlLabWorkerState: VhdlLabWorkerSnapshot = {
  enabled: true,
  running: false,
  started: false,
  currentRunId: null,
  lastTickAt: null,
  lastError: null,
};

let vhdlLabWorkerTimer: NodeJS.Timeout | null = null;

function nowIso() {
  return new Date().toISOString();
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function sha256(value: string | Buffer) {
  return createHash('sha256').update(value).digest('hex');
}

function id(prefix: string, seed?: string) {
  return `${prefix}_${sha256(seed || `${prefix}:${Date.now()}:${Math.random()}`).slice(0, 16)}`;
}

export function getVhdlLabConfig() {
  const dataRoot = process.env.VHDL_LAB_DATA_ROOT || path.resolve(process.cwd(), 'data', 'vhdl-lab');
  return {
    enabled: process.env.VHDL_LAB_ENABLED !== 'false',
    dataRoot,
    ollamaBaseUrl: process.env.VHDL_LAB_OLLAMA_BASE_URL || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    lmStudioBaseUrl: process.env.VHDL_LAB_LM_STUDIO_BASE_URL || 'http://127.0.0.1:1234',
    lmStudioEnabled: process.env.VHDL_LAB_ENABLE_LM_STUDIO === 'true',
    ghdlPath: process.env.VHDL_LAB_GHDL_PATH || '/opt/homebrew/bin/ghdl',
    defaultModel: process.env.VHDL_LAB_DEFAULT_MODEL || '',
    worker: {
      enabled: process.env.VHDL_LAB_WORKER_ENABLED !== 'false',
      heartbeatSeconds: Number(process.env.VHDL_LAB_WORKER_HEARTBEAT_SECONDS || 10),
      staleAfterSeconds: Number(process.env.VHDL_LAB_WORKER_STALE_AFTER_SECONDS || 60),
    },
  };
}

export function vhdlLabPaths(dataRoot = getVhdlLabConfig().dataRoot) {
  return {
    dataRoot,
    statePath: path.join(dataRoot, 'vhdl-lab-state.json'),
    contractsDrafts: path.join(dataRoot, 'contracts', 'drafts'),
    contractsFreezes: path.join(dataRoot, 'contracts', 'freezes'),
    promptVersions: path.join(dataRoot, 'prompts', 'versions'),
    runs: path.join(dataRoot, 'runs'),
    acceptedRtl: path.join(dataRoot, 'accepted', 'rtl'),
    acceptedTestbench: path.join(dataRoot, 'accepted', 'testbench'),
    acceptedRepairPairs: path.join(dataRoot, 'accepted', 'repair-pairs'),
    datasets: path.join(dataRoot, 'datasets'),
    training: path.join(dataRoot, 'training'),
    benchmarks: path.join(dataRoot, 'benchmarks'),
    qualifiedAdapters: path.join(dataRoot, 'qualified-adapters'),
  };
}

export async function ensureVhdlLabStorage(dataRoot = getVhdlLabConfig().dataRoot) {
  const paths = vhdlLabPaths(dataRoot);
  await Promise.all(Object.entries(paths)
    .filter(([key]) => key !== 'statePath')
    .map(([, value]) => fs.mkdir(value, { recursive: true })));
  try {
    await fs.access(paths.statePath);
  } catch {
    await writeVhdlLabState(defaultVhdlLabState(dataRoot), dataRoot);
  }
}

function defaultVhdlLabState(dataRoot = getVhdlLabConfig().dataRoot): VhdlLabState {
  const at = nowIso();
  const ollamaProvider: VhdlLabProvider = {
    id: 'provider_ollama_local',
    name: 'Ollama Local',
    providerType: 'OLLAMA',
    baseUrl: getVhdlLabConfig().ollamaBaseUrl,
    apiMode: 'OLLAMA_NATIVE',
    enabled: true,
    capabilities: { streaming: true, structuredOutput: false, loopbackOnly: true, primaryLocalProvider: true },
    healthStatus: 'unknown',
    lastHealthCheckAt: null,
    createdAt: at,
    updatedAt: at,
  };
  const lmStudioProvider: VhdlLabProvider = {
    id: 'provider_lm_studio_local',
    name: 'LM Studio Local',
    providerType: 'LM_STUDIO',
    baseUrl: getVhdlLabConfig().lmStudioBaseUrl,
    apiMode: 'OPENAI_CHAT_COMPLETIONS',
    enabled: false,
    capabilities: { streaming: true, structuredOutput: true, loopbackOnly: true, optionalProvider: true },
    healthStatus: 'unknown',
    lastHealthCheckAt: null,
    createdAt: at,
    updatedAt: at,
  };
  const verificationProfile: VhdlLabVerificationProfile = {
    id: 'verification_vhdl_2008_strict',
    name: 'VHDL-2008 strict GHDL gates',
    vhdlStandard: '08',
    ghdlPath: getVhdlLabConfig().ghdlPath,
    analysisRequired: true,
    elaborationRequired: true,
    synthesisRequired: true,
    simulationRequired: true,
    passMarkerRequired: true,
    mutationTestingRequired: false,
    simulationTimeoutSeconds: 120,
    synthesisTimeoutSeconds: 180,
    prohibitedPackages: ['std_logic_unsigned', 'std_logic_arith', 'std_logic_signed'],
    warningPolicy: 'record',
    enabled: true,
    createdAt: at,
    updatedAt: at,
  };
  const template: VhdlLabPromptTemplate = {
    id: 'prompt_template_vhdl_rtl_generator',
    name: 'VHDL RTL Generator',
    role: 'GENERATOR',
    currentVersionId: 'prompt_version_vhdl_rtl_generator_v1',
    createdAt: at,
    updatedAt: at,
  };
  const promptVersion: VhdlLabPromptVersion = {
    id: 'prompt_version_vhdl_rtl_generator_v1',
    templateId: template.id,
    versionNumber: 1,
    parentVersionId: null,
    status: 'ACTIVE',
    systemPrompt: [
      'You generate one complete VHDL-2008 artifact from a frozen hardware contract.',
      'This lab run is single-file RTL mode: the returned VHDL must be self-contained.',
      'Do not instantiate external entity work.X child modules unless entity X is declared in the same returned artifact.',
      'Preserve the required entity interface exactly.',
      'Use ieee.std_logic_1164 and ieee.numeric_std only.',
      'Return VHDL only, no Markdown, no prose.',
    ].join('\n'),
    userPromptTemplate: 'Contract JSON:\n{{contract_json}}\n\nReturn one complete self-contained VHDL-2008 file for entity {{entity_name}}. If the architecture needs helper blocks, implement them inside this entity/architecture rather than instantiating missing work-library entities.',
    responseSchema: {},
    changeReason: 'Initial app-owned strict VHDL generation prompt.',
    triggerFailureClusterId: null,
    promptHash: '',
    createdAt: at,
    promotedAt: at,
    rejectedAt: null,
    metrics: {},
  };
  promptVersion.promptHash = sha256(`${promptVersion.systemPrompt}\n${promptVersion.userPromptTemplate}`);
  return {
    schemaVersion: 1,
    providers: [ollamaProvider, lmStudioProvider],
    models: [],
    verificationProfiles: [verificationProfile],
    contracts: [],
    promptTemplates: [template],
    promptVersions: [promptVersion],
    runs: [],
    failureClusters: [],
    datasetReleases: [],
    trainingRuns: [],
    checkpoints: [],
    benchmarkRuns: [],
    qualifiedAdapterSources: [],
    acceptedArtifacts: [],
    updatedAt: at,
  };
}

export async function readVhdlLabState(dataRoot = getVhdlLabConfig().dataRoot): Promise<VhdlLabState> {
  await ensureVhdlLabStorage(dataRoot);
  const raw = await fs.readFile(vhdlLabPaths(dataRoot).statePath, 'utf8');
  const parsed = await parseVhdlLabStateJson(raw, dataRoot);
  return normalizeVhdlLabState({ ...defaultVhdlLabState(dataRoot), ...parsed }, dataRoot);
}

function findCompleteJsonObjectEnd(raw: string) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  let started = false;
  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    if (!started) {
      if (/\s/.test(char)) continue;
      if (char !== '{') return -1;
      started = true;
      depth = 1;
      continue;
    }
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{') {
      depth += 1;
      continue;
    }
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

async function parseVhdlLabStateJson(raw: string, dataRoot: string) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    const end = findCompleteJsonObjectEnd(raw);
    if (end <= 0) throw error;
    const prefix = raw.slice(0, end);
    const trailing = raw.slice(end);
    if (!trailing.trim()) throw error;
    const parsed = JSON.parse(prefix);
    const paths = vhdlLabPaths(dataRoot);
    const backupPath = `${paths.statePath}.corrupt-${new Date().toISOString().replace(/[:.]/g, '-')}.bak`;
    await fs.writeFile(backupPath, raw);
    await fs.writeFile(paths.statePath, `${JSON.stringify(parsed, null, 2)}\n`);
    return parsed;
  }
}

function normalizeVhdlLabState(state: VhdlLabState, dataRoot = getVhdlLabConfig().dataRoot): VhdlLabState {
  const defaults = defaultVhdlLabState(dataRoot);
  const providerById = new Map<string, VhdlLabProvider>();
  for (const provider of defaults.providers) providerById.set(provider.id, provider);
  for (const provider of state.providers || []) providerById.set(provider.id, provider);
  const lmStudio = providerById.get('provider_lm_studio_local');
  if (lmStudio && !getVhdlLabConfig().lmStudioEnabled) {
    providerById.set(lmStudio.id, { ...lmStudio, enabled: false, capabilities: { ...lmStudio.capabilities, optionalProvider: true } });
  }
  const providers = [...providerById.values()].sort((left, right) => {
    if (left.providerType === 'OLLAMA' && right.providerType !== 'OLLAMA') return -1;
    if (right.providerType === 'OLLAMA' && left.providerType !== 'OLLAMA') return 1;
    return left.name.localeCompare(right.name);
  });
  return {
    ...state,
    providers,
    datasetReleases: (state.datasetReleases || []).map((release: any) => ({
      ...release,
      schemaVersion: release.schemaVersion || 1,
      testCount: Number(release.testCount || 0),
    })),
    trainingRuns: state.trainingRuns || [],
    checkpoints: (state.checkpoints || []).map((checkpoint) => ({
      ...checkpoint,
      promotionStatus: checkpoint.promotionStatus || (checkpoint.status === 'PROMOTED' ? 'QUALIFIED_FOR_LEAF_RTL' : 'LAB_ONLY'),
      promotionBenchmarks: checkpoint.promotionBenchmarks || checkpoint.benchmarkRunIds || [],
      fallbackPassCount: Number(checkpoint.fallbackPassCount || 0),
      adapterAuthoredPassCount: Number(checkpoint.adapterAuthoredPassCount || 0),
      qualifiedForFpgaArchitectAt: checkpoint.qualifiedForFpgaArchitectAt || null,
      qualificationIssues: checkpoint.qualificationIssues || [],
      qualifiedSourceId: checkpoint.qualifiedSourceId || null,
    })),
    benchmarkRuns: state.benchmarkRuns || [],
    qualifiedAdapterSources: (state.qualifiedAdapterSources || []).map((source) => ({
      ...source,
      promotionAuditPath: source.promotionAuditPath || path.join(vhdlLabPaths(dataRoot).qualifiedAdapters, source.id, 'promotion-audit.json'),
      promotionStrictness: source.promotionStrictness || resolveVhdlLabPromotionStrictness({ profileId: 'fast_check' }),
      categoryCoverage: source.categoryCoverage || {},
      gateChecks: source.gateChecks || {},
    })),
    acceptedArtifacts: state.acceptedArtifacts || [],
    failureClusters: state.failureClusters || [],
    runs: (state.runs || []).map((run) => ({
      ...run,
      metrics: run.metrics || {},
      repairAuditPath: run.repairAuditPath || path.join(run.workspacePath, 'repair-audit.json'),
    })),
  };
}

export async function writeVhdlLabState(state: VhdlLabState, dataRoot = getVhdlLabConfig().dataRoot) {
  const paths = vhdlLabPaths(dataRoot);
  const nextState = { ...state, updatedAt: nowIso() };
  const previousWrite = vhdlLabStateWriteQueues.get(paths.statePath) || Promise.resolve();
  let tempPath = '';
  const writeTask = previousWrite
    .catch(() => undefined)
    .then(async () => {
      await fs.mkdir(path.dirname(paths.statePath), { recursive: true });
      const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      tempPath = `${paths.statePath}.${process.pid}.${nonce}.tmp`;
      await fs.writeFile(tempPath, `${JSON.stringify(nextState, null, 2)}\n`);
      await fs.rename(tempPath, paths.statePath);
    })
    .finally(async () => {
      if (tempPath) {
        await fs.rm(tempPath, { force: true }).catch(() => undefined);
      }
      if (vhdlLabStateWriteQueues.get(paths.statePath) === writeTask) {
        vhdlLabStateWriteQueues.delete(paths.statePath);
      }
    });
  vhdlLabStateWriteQueues.set(paths.statePath, writeTask);
  await writeTask;
  return nextState;
}

function isLegalVhdlIdentifier(value: string) {
  return /^[A-Za-z][A-Za-z0-9_]*$/.test(value)
    && !new Set(['entity', 'architecture', 'is', 'begin', 'end', 'signal', 'process', 'if', 'then', 'else', 'case', 'when', 'port', 'generic', 'library', 'use']).has(value.toLowerCase());
}

function normalizeType(type: string) {
  return String(type || '').trim().replace(/\s+/g, ' ');
}

function safeEntityName(value: string) {
  const sanitized = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return /^[a-z]/.test(sanitized) ? sanitized : `design_${sanitized}`;
}

function buildSweepPresetPorts(designClass: string): VhdlContractDocument['ports'] {
  const common = [
    { name: 'clk', mode: 'in' as const, type: 'std_logic', semantic_role: 'clock' },
    { name: 'rst', mode: 'in' as const, type: 'std_logic', semantic_role: 'reset' },
  ];
  if (designClass === 'uart_spi_protocol_bridge') {
    return [
      ...common,
      { name: 'uart_rx_i', mode: 'in' as const, type: 'std_logic', semantic_role: 'uart_rx' },
      { name: 'uart_tx_o', mode: 'out' as const, type: 'std_logic', semantic_role: 'uart_tx' },
      { name: 'spi_miso_i', mode: 'in' as const, type: 'std_logic', semantic_role: 'spi_miso' },
      { name: 'spi_mosi_o', mode: 'out' as const, type: 'std_logic', semantic_role: 'spi_mosi' },
      { name: 'spi_sclk_o', mode: 'out' as const, type: 'std_logic', semantic_role: 'spi_sclk' },
      { name: 'spi_cs_o', mode: 'out' as const, type: 'std_logic', semantic_role: 'spi_chip_select' },
      { name: 'busy_o', mode: 'out' as const, type: 'std_logic', semantic_role: 'busy' },
      { name: 'error_o', mode: 'out' as const, type: 'std_logic', semantic_role: 'error' },
      { name: 'status_o', mode: 'out' as const, type: 'std_logic_vector(7 downto 0)', semantic_role: 'status' },
    ];
  }
  if (designClass === 'cpu_core') {
    return [
      ...common,
      { name: 'pm_addr_o', mode: 'out' as const, type: 'unsigned(7 downto 0)', semantic_role: 'program_memory_address' },
      { name: 'pm_data_i', mode: 'in' as const, type: 'std_logic_vector(7 downto 0)', semantic_role: 'program_memory_data' },
      { name: 'dm_addr_o', mode: 'out' as const, type: 'unsigned(7 downto 0)', semantic_role: 'data_memory_address' },
      { name: 'dm_wdata_o', mode: 'out' as const, type: 'std_logic_vector(7 downto 0)', semantic_role: 'data_memory_write_data' },
      { name: 'dm_rdata_i', mode: 'in' as const, type: 'std_logic_vector(7 downto 0)', semantic_role: 'data_memory_read_data' },
      { name: 'dm_we_o', mode: 'out' as const, type: 'std_logic', semantic_role: 'data_memory_write_enable' },
      { name: 'halted_o', mode: 'out' as const, type: 'std_logic', semantic_role: 'halted' },
      { name: 'status_o', mode: 'out' as const, type: 'std_logic_vector(7 downto 0)', semantic_role: 'status' },
    ];
  }
  if (designClass === 'video_pattern_generator') {
    return [
      ...common,
      { name: 'hsync_o', mode: 'out' as const, type: 'std_logic', semantic_role: 'horizontal_sync' },
      { name: 'vsync_o', mode: 'out' as const, type: 'std_logic', semantic_role: 'vertical_sync' },
      { name: 'de_o', mode: 'out' as const, type: 'std_logic', semantic_role: 'data_enable' },
      { name: 'pixel_o', mode: 'out' as const, type: 'std_logic_vector(23 downto 0)', semantic_role: 'rgb_pixel' },
      { name: 'pixel_addr_o', mode: 'out' as const, type: 'unsigned(18 downto 0)', semantic_role: 'pixel_address' },
    ];
  }
  if (designClass === 'dsp_chain') {
    return [
      ...common,
      { name: 'sample_i', mode: 'in' as const, type: 'signed(15 downto 0)', semantic_role: 'sample_input' },
      { name: 'sample_valid_i', mode: 'in' as const, type: 'std_logic', semantic_role: 'sample_valid' },
      { name: 'sample_ready_o', mode: 'out' as const, type: 'std_logic', semantic_role: 'sample_ready' },
      { name: 'result_o', mode: 'out' as const, type: 'signed(31 downto 0)', semantic_role: 'processed_result' },
      { name: 'result_valid_o', mode: 'out' as const, type: 'std_logic', semantic_role: 'result_valid' },
    ];
  }
  return [
    ...common,
    { name: 's_axis_tvalid_i', mode: 'in' as const, type: 'std_logic', semantic_role: 'stream_valid_in' },
    { name: 's_axis_tready_o', mode: 'out' as const, type: 'std_logic', semantic_role: 'stream_ready_out' },
    { name: 's_axis_tdata_i', mode: 'in' as const, type: 'std_logic_vector(31 downto 0)', semantic_role: 'stream_data_in' },
    { name: 's_axis_tlast_i', mode: 'in' as const, type: 'std_logic', semantic_role: 'stream_last_in' },
    { name: 'm_axis_tvalid_o', mode: 'out' as const, type: 'std_logic', semantic_role: 'stream_valid_out' },
    { name: 'm_axis_tready_i', mode: 'in' as const, type: 'std_logic', semantic_role: 'stream_ready_in' },
    { name: 'm_axis_tdata_o', mode: 'out' as const, type: 'std_logic_vector(31 downto 0)', semantic_role: 'stream_data_out' },
    { name: 'm_axis_tlast_o', mode: 'out' as const, type: 'std_logic', semantic_role: 'stream_last_out' },
  ];
}

export function buildVhdlLabSweepPresetContracts(): VhdlLabPresetContract[] {
  return FPGA_ARCHITECT_SWEEP_DESIGNS.map((preset) => {
    const entityName = safeEntityName(`${preset.projectName}_top`);
    const contractJson: VhdlContractDocument = {
      contract_version: '1.0',
      entity: { name: entityName, description: preset.objective },
      generics: [
        { name: 'DATA_WIDTH', type: 'positive', default: preset.designClass === 'dsp_chain' ? '16' : '8', constraints: ['DATA_WIDTH >= 1'] },
      ],
      ports: buildSweepPresetPorts(preset.designClass),
      clocking: { domains: [{ name: 'main', clock_port: 'clk', edge: 'rising' }] },
      reset: { port: 'rst', polarity: 'active_high', synchronous: true },
      behavior: [
        preset.objective,
        ...preset.requiredBuildingBlocks.map((block) => `Required block/responsibility: ${block}`),
        ...preset.dataPathRules,
        ...preset.clockResetRules,
      ],
      corner_cases: preset.verificationRequirements,
      prohibited_implementations: [
        'std_logic_unsigned',
        'std_logic_arith',
        'std_logic_signed',
        ...preset.forbiddenShortcuts,
      ],
      synthesis_requirements: preset.acceptanceCriteria,
      testbench_obligations: preset.verificationRequirements,
      pass_marker: 'PASS',
    };
    return {
      id: `sweep_${preset.key}`,
      key: preset.key,
      label: preset.label,
      designClass: preset.designClass,
      entityName,
      taskFamily: `FPGA_SWEEP_${preset.key.toUpperCase()}`,
      contractJson,
    };
  });
}

function validateWidthExpression(type: string) {
  const compact = type.replace(/\s+/g, '');
  if (/\([^)]*(downto|to)[^)]*\)/i.test(compact)) return true;
  return !/\bstd_logic_vector\b|\bunsigned\b|\bsigned\b/i.test(type);
}

export function validateVhdlContractDocument(contract: unknown): { ok: true; contract: VhdlContractDocument; hash: string } | { ok: false; issues: VhdlLabValidationIssue[] } {
  const issues: VhdlLabValidationIssue[] = [];
  const doc = contract as VhdlContractDocument;
  if (!doc || typeof doc !== 'object') {
    return { ok: false, issues: [{ code: 'contract_not_object', path: '$', message: 'Contract must be a JSON object.' }] };
  }
  if (doc.contract_version !== '1.0') issues.push({ code: 'contract_version_invalid', path: '$.contract_version', message: 'contract_version must be "1.0".' });
  if (!doc.entity?.name || !isLegalVhdlIdentifier(doc.entity.name)) issues.push({ code: 'entity_name_invalid', path: '$.entity.name', message: 'Entity name must be a legal VHDL identifier.' });
  const genericNames = new Set<string>();
  for (const [index, generic] of Object.entries(doc.generics || [])) {
    const key = String(generic.name || '').toLowerCase();
    if (!isLegalVhdlIdentifier(generic.name)) issues.push({ code: 'generic_name_invalid', path: `$.generics[${index}].name`, message: `Generic "${generic.name}" is not a legal VHDL identifier.` });
    if (genericNames.has(key)) issues.push({ code: 'generic_duplicate', path: `$.generics[${index}].name`, message: `Duplicate generic "${generic.name}".` });
    genericNames.add(key);
    if (!normalizeType(generic.type)) issues.push({ code: 'generic_type_missing', path: `$.generics[${index}].type`, message: `Generic "${generic.name}" needs a type.` });
  }
  const portNames = new Set<string>();
  for (const [index, port] of Object.entries(doc.ports || [])) {
    const key = String(port.name || '').toLowerCase();
    if (!isLegalVhdlIdentifier(port.name)) issues.push({ code: 'port_name_invalid', path: `$.ports[${index}].name`, message: `Port "${port.name}" is not a legal VHDL identifier.` });
    if (portNames.has(key)) issues.push({ code: 'port_duplicate', path: `$.ports[${index}].name`, message: `Duplicate port "${port.name}".` });
    portNames.add(key);
    if (!['in', 'out', 'inout', 'buffer'].includes(port.mode)) issues.push({ code: 'port_mode_invalid', path: `$.ports[${index}].mode`, message: `Port "${port.name}" has invalid mode "${port.mode}".` });
    if (!normalizeType(port.type)) issues.push({ code: 'port_type_missing', path: `$.ports[${index}].type`, message: `Port "${port.name}" needs a type.` });
    if (!validateWidthExpression(port.type)) issues.push({ code: 'port_width_expression_invalid', path: `$.ports[${index}].type`, message: `Port "${port.name}" has an invalid or missing vector range.` });
  }
  const clockPorts = new Set((doc.clocking?.domains || []).map((domain) => domain.clock_port.toLowerCase()));
  if ((doc.clocking?.domains || []).some((domain) => !portNames.has(domain.clock_port.toLowerCase()))) {
    issues.push({ code: 'clock_port_missing', path: '$.clocking.domains', message: 'Clocking domain references a port not present in the interface.' });
  }
  if (doc.reset?.port && !portNames.has(doc.reset.port.toLowerCase())) issues.push({ code: 'reset_port_missing', path: '$.reset.port', message: 'Reset references a port not present in the interface.' });
  if ((doc.ports || []).some((port) => /clk|clock/i.test(port.name)) && clockPorts.size === 0) {
    issues.push({ code: 'clocking_missing', path: '$.clocking', message: 'Clock-like ports require an explicit clocking domain.' });
  }
  if (!Array.isArray(doc.behavior)) issues.push({ code: 'behavior_missing', path: '$.behavior', message: 'behavior must be an array.' });
  if (!Array.isArray(doc.testbench_obligations)) issues.push({ code: 'testbench_obligations_missing', path: '$.testbench_obligations', message: 'testbench_obligations must be an array.' });
  if (!doc.pass_marker || typeof doc.pass_marker !== 'string') issues.push({ code: 'pass_marker_missing', path: '$.pass_marker', message: 'pass_marker is required.' });
  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, contract: doc, hash: sha256(stableJson(doc)) };
}

const modelChatTokenPatterns = [
  /<\|im_end\|>/i,
  /<\|endoftext\|>/i,
  /<\/s>/i,
  /\[\/INST\]/i,
];

export function stripModelChatTokensFromVhdlResponse(raw: string) {
  let cleaned = String(raw || '').replace(/\r\n/g, '\n');
  cleaned = cleaned.replace(/<\|im_start\|>\s*(?:system|user|assistant)?/gi, '');
  cleaned = cleaned.replace(/\[INST\]/gi, '');
  const firstVhdlIndex = cleaned.search(/\blibrary\b|\bentity\b/i);
  const tokenIndexes = modelChatTokenPatterns
    .map((pattern) => {
      const match = cleaned.match(pattern);
      return match?.index ?? -1;
    })
    .filter((index) => index >= 0 && (firstVhdlIndex < 0 || index > firstVhdlIndex));
  if (tokenIndexes.length > 0) {
    cleaned = cleaned.slice(0, Math.min(...tokenIndexes));
  }
  for (const pattern of modelChatTokenPatterns) {
    cleaned = cleaned.replace(new RegExp(pattern.source, 'gi'), '');
  }
  return cleaned.trimEnd();
}

export function extractOneVhdlArtifact(raw: string): VhdlExtractionResult {
  const sanitizedRaw = stripModelChatTokensFromVhdlResponse(raw);
  const fenced = [...sanitizedRaw.matchAll(/```(?:vhdl|vhd)?\s*\n([\s\S]*?)```/gi)].map((match) => stripModelChatTokensFromVhdlResponse(match[1]).trim());
  const candidate = fenced.length === 1 ? fenced[0] : sanitizedRaw.slice(sanitizedRaw.search(/\blibrary\b|\bentity\b/i)).trim();
  if (!candidate || candidate === raw && !/\bentity\b/i.test(candidate)) {
    return { ok: false, issues: [{ code: 'vhdl_extraction_no_entity', path: '$.raw_response', message: 'Could not find a VHDL entity in the model response.' }] };
  }
  if (fenced.length > 1) {
    return { ok: false, issues: [{ code: 'vhdl_extraction_multiple_blocks', path: '$.raw_response', message: 'Model response contains multiple fenced VHDL blocks.' }] };
  }
  const entityMatch = candidate.match(/\bentity\s+([A-Za-z][A-Za-z0-9_]*)\s+is\b/i);
  if (!entityMatch) return { ok: false, issues: [{ code: 'vhdl_extraction_missing_entity', path: '$.vhdl', message: 'Extracted VHDL is missing an entity declaration.' }] };
  const architectureMatches = [...candidate.matchAll(/\barchitecture\s+([A-Za-z][A-Za-z0-9_]*)\s+of\s+([A-Za-z][A-Za-z0-9_]*)\s+is\b/gi)];
  if (architectureMatches.length === 0) return { ok: false, issues: [{ code: 'vhdl_extraction_missing_architecture', path: '$.vhdl', message: 'Extracted VHDL is missing an architecture body.' }] };
  const topArchitectureMatch = architectureMatches.find((match) => match[2].toLowerCase() === entityMatch[1].toLowerCase());
  if (!topArchitectureMatch) {
    return { ok: false, issues: [{ code: 'vhdl_extraction_entity_architecture_mismatch', path: '$.vhdl', message: `Extracted VHDL is missing an architecture for entity "${entityMatch[1]}".` }] };
  }
  return { ok: true, vhdl: candidate.replace(/\r\n/g, '\n').trimEnd() + '\n', entityName: entityMatch[1], architectureName: topArchitectureMatch[1] };
}

export function staticPolicyCheckVhdl(content: string): VhdlLabValidationIssue[] {
  const issues: VhdlLabValidationIssue[] = [];
  const rules = [
    { re: /\bstd_logic_unsigned\b/i, code: 'static_policy_std_logic_unsigned' },
    { re: /\bstd_logic_arith\b/i, code: 'static_policy_std_logic_arith' },
    { re: /\bstd_logic_signed\b/i, code: 'static_policy_std_logic_signed' },
    { re: /\bTODO\b|implementation omitted|\.\.\./i, code: 'static_policy_placeholder' },
    { re: /```|<\/?[a-z][^>]*>/i, code: 'static_policy_non_vhdl_markup' },
    { re: /<\|im_(?:start|end)\|>|<\|endoftext\|>|\[\/?INST\]|<\/s>/i, code: 'model_chat_token_leakage' },
    { re: /\btextio\b|\bfile\s+[A-Za-z]/i, code: 'static_policy_file_io_in_rtl' },
  ];
  for (const rule of rules) {
    if (rule.re.test(content)) issues.push({ code: rule.code, path: '$.vhdl', message: `Static policy rejected ${rule.code}.` });
  }
  return issues;
}

function renderInterfaceDeclarationList(entries: string[], indent: string) {
  return entries.map((entry, index) => `${indent}${entry}${index === entries.length - 1 ? '' : ';'}`).join('\n');
}

export function renderFrozenVhdlEntityDeclaration(contract: VhdlLabHardwareContract) {
  const genericLines = (contract.contractJson.generics || []).map((generic) => {
    const defaultText = generic.default ? ` := ${generic.default}` : '';
    return `${generic.name} : ${generic.type}${defaultText}`;
  });
  const portLines = (contract.contractJson.ports || []).map((port) => `${port.name} : ${port.mode} ${port.type}`);
  const lines = [
    `entity ${contract.entityName} is`,
  ];
  if (genericLines.length > 0) {
    lines.push(
      '  generic (',
      renderInterfaceDeclarationList(genericLines, '    '),
      '  );',
    );
  }
  if (portLines.length > 0) {
    lines.push(
      '  port (',
      renderInterfaceDeclarationList(portLines, '    '),
      '  );',
    );
  }
  lines.push(`end entity ${contract.entityName};`);
  return `${lines.join('\n')}\n`;
}

export function assembleVhdlWithFrozenEntity(content: string, contract: VhdlLabHardwareContract) {
  const normalized = content.replace(/\r\n/g, '\n').trimEnd();
  const entityName = contract.entityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const entityPattern = new RegExp(`\\bentity\\s+${entityName}\\s+is\\b[\\s\\S]*?\\bend\\s+(?:entity\\s+)?${entityName}\\s*;`, 'i');
  const fallbackPattern = new RegExp(`\\bentity\\s+${entityName}\\s+is\\b[\\s\\S]*?\\bend\\s*(?:entity)?\\s*;`, 'i');
  const frozenEntity = renderFrozenVhdlEntityDeclaration(contract).trimEnd();
  if (entityPattern.test(normalized)) {
    return normalized.replace(entityPattern, frozenEntity).trimEnd() + '\n';
  }
  if (fallbackPattern.test(normalized)) {
    return normalized.replace(fallbackPattern, frozenEntity).trimEnd() + '\n';
  }
  return `${frozenEntity}\n\n${normalized}\n`;
}

type VhdlLabDesignUnitPosition = {
  kind: 'entity' | 'architecture';
  name: string;
  targetEntityName: string;
  index: number;
  line: number;
  previousDesignUnitEnd: number;
};

function lineNumberAt(content: string, index: number) {
  return content.slice(0, Math.max(0, index)).split('\n').length;
}

function findPreviousDesignUnitEnd(content: string, index: number) {
  const before = content.slice(0, index);
  const matches = [...before.matchAll(/\bend\s+(?:entity|architecture|package|package\s+body)?\s*(?:[A-Za-z][A-Za-z0-9_]*)?\s*;/gi)];
  const last = matches.at(-1);
  return last ? (last.index || 0) + last[0].length : 0;
}

function collectVhdlLabDesignUnits(content: string): VhdlLabDesignUnitPosition[] {
  const units: VhdlLabDesignUnitPosition[] = [];
  for (const match of content.matchAll(/\bentity\s+([A-Za-z][A-Za-z0-9_]*)\s+is\b/gi)) {
    units.push({
      kind: 'entity',
      name: match[1],
      targetEntityName: match[1],
      index: match.index || 0,
      line: lineNumberAt(content, match.index || 0),
      previousDesignUnitEnd: findPreviousDesignUnitEnd(content, match.index || 0),
    });
  }
  for (const match of content.matchAll(/\barchitecture\s+([A-Za-z][A-Za-z0-9_]*)\s+of\s+([A-Za-z][A-Za-z0-9_]*)\s+is\b/gi)) {
    units.push({
      kind: 'architecture',
      name: match[1],
      targetEntityName: match[2],
      index: match.index || 0,
      line: lineNumberAt(content, match.index || 0),
      previousDesignUnitEnd: findPreviousDesignUnitEnd(content, match.index || 0),
    });
  }
  return units.sort((a, b) => a.index - b.index);
}

function designUnitUsesIeeeTypes(content: string, unit: VhdlLabDesignUnitPosition) {
  const units = collectVhdlLabDesignUnits(content);
  const next = units.find((entry) => entry.index > unit.index);
  const unitText = content.slice(unit.index, next?.index || content.length);
  return /\b(?:std_logic|std_logic_vector|unsigned|signed)\b/i.test(unitText);
}

function hasIeeeContextForDesignUnit(content: string, unit: VhdlLabDesignUnitPosition) {
  const contextText = content.slice(unit.previousDesignUnitEnd, unit.index);
  return /\blibrary\s+ieee\s*;/i.test(contextText)
    && /\buse\s+ieee\.std_logic_1164\.all\s*;/i.test(contextText)
    && /\buse\s+ieee\.numeric_std\.all\s*;/i.test(contextText);
}

export function normalizeSingleFileVhdlContextClauses(content: string) {
  const normalized = content.replace(/\r\n/g, '\n').trimEnd();
  const units = collectVhdlLabDesignUnits(normalized);
  if (units.length === 0) return normalized + '\n';
  const contextClause = 'library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\n\n';
  let output = '';
  let cursor = 0;
  for (const unit of units) {
    const preceding = normalized.slice(cursor, unit.index);
    const fullPreceding = normalized.slice(unit.previousDesignUnitEnd, unit.index);
    output += preceding;
    if (!hasIeeeContextForDesignUnit(normalized, unit)) {
      const needsSeparator = output.length > 0 && !output.endsWith('\n\n');
      output += needsSeparator ? '\n\n' : '';
      if (!/\blibrary\s+ieee\s*;/i.test(fullPreceding) || !/\buse\s+ieee\.std_logic_1164\.all\s*;/i.test(fullPreceding) || !/\buse\s+ieee\.numeric_std\.all\s*;/i.test(fullPreceding)) {
        output += contextClause;
      }
    }
    cursor = unit.index;
  }
  output += normalized.slice(cursor);
  return output.trimEnd() + '\n';
}

export function validateSingleFileWorkUnitDependencies(content: string, topEntityName: string): VhdlLabValidationIssue[] {
  const withoutComments = stripVhdlComments(content);
  const units = collectVhdlLabDesignUnits(withoutComments);
  const declaredEntityIndexes = new Map<string, number>();
  for (const unit of units) {
    if (unit.kind === 'entity' && !declaredEntityIndexes.has(unit.name.toLowerCase())) {
      declaredEntityIndexes.set(unit.name.toLowerCase(), unit.index);
    }
  }
  const issues: VhdlLabValidationIssue[] = [];
  const seenMissing = new Set<string>();
  const seenOrder = new Set<string>();
  const directInstantiations: Array<{ entityName: string; index: number; label: string }> = [];
  for (const match of withoutComments.matchAll(/\bentity\s+work\.([A-Za-z][A-Za-z0-9_]*)\b/gi)) {
    directInstantiations.push({ entityName: match[1], index: match.index || 0, label: `work.${match[1]}` });
  }
  for (const match of withoutComments.matchAll(/:\s*entity\s+(?!work\.)([A-Za-z][A-Za-z0-9_]*)\b/gi)) {
    directInstantiations.push({ entityName: match[1], index: match.index || 0, label: match[1] });
  }
  for (const match of directInstantiations.sort((a, b) => a.index - b.index)) {
    const entityName = match.entityName;
    const label = match.label;
    const key = entityName.toLowerCase();
    const line = lineNumberAt(withoutComments, match.index);
    const declaredIndex = declaredEntityIndexes.get(key);
    if (key === topEntityName.toLowerCase()) continue;
    if (declaredIndex === undefined) {
      if (seenMissing.has(key)) continue;
      seenMissing.add(key);
      issues.push({
        code: 'missing_work_unit_dependency',
        path: `$.vhdl.line_${line}`,
        message: `Single-file VHDL Lab run instantiates entity ${label}, but no entity ${entityName} is declared in the returned artifact. Return self-contained RTL or use multi-file project mode.`,
      });
      continue;
    }
    if (declaredIndex > match.index && !seenOrder.has(key)) {
      seenOrder.add(key);
      issues.push({
        code: 'single_file_work_unit_order',
        path: `$.vhdl.line_${line}`,
        message: `Single-file VHDL Lab run instantiates entity ${label} before entity ${entityName} is declared. Move child entity/architecture design units before the architecture that instantiates them, or inline the logic.`,
      });
    }
  }
  const seenContext = new Set<string>();
  for (const unit of units) {
    if (!designUnitUsesIeeeTypes(withoutComments, unit)) continue;
    if (hasIeeeContextForDesignUnit(withoutComments, unit)) continue;
    const key = `${unit.kind}:${unit.targetEntityName.toLowerCase()}:${unit.line}`;
    if (seenContext.has(key)) continue;
    seenContext.add(key);
    issues.push({
      code: 'missing_context_clause_for_design_unit',
      path: `$.vhdl.line_${unit.line}`,
      message: `Design unit ${unit.kind} ${unit.kind === 'entity' ? unit.name : `of ${unit.targetEntityName}`} uses IEEE types but is missing local context clauses. Repeat "library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all;" before every entity/architecture design unit in single-file mode.`,
    });
  }
  return issues;
}

export function classifyVhdlLabFailure(params: { stage: string; message: string }) {
  const text = `${params.stage}\n${params.message}`.toLowerCase();
  if (/model_repair_timeout|repair.*(?:abort|timeout)|(?:abort|aborted|aborterror)/.test(text) && /repair/.test(text)) return 'MODEL_REPAIR_TIMEOUT';
  if (/model_generation_timeout|generate.*(?:abort|timeout)|(?:abort|aborted|aborterror)/.test(text) && /generat/.test(text)) return 'MODEL_GENERATION_TIMEOUT';
  if (/model_chat_token_leakage|<\|im_(?:start|end)\|>|<\|endoftext\|>|\[\/?inst\]|<\/s>/.test(text)) return 'MODEL_CHAT_TOKEN_LEAKAGE';
  if (/testbench_generic_constant_missing|no declaration for "width".*tb_/s.test(text)) return 'APP_TESTBENCH_RENDERER_FAILURE';
  if (/video_pixel_address_bound_check|bound check failure.*video_pattern_generator|pixel_addr_o/s.test(text)) return 'VIDEO_ADDRESS_GENERATION_FAILURE';
  if (/dsp_accumulator_width_bound_check|bound check failure.*dsp_chain|fir_filter_proc/s.test(text)) return 'DSP_NUMERIC_WIDTH_FAILURE';
  if (/extract/.test(text)) return 'EXTRACTION_FAILURE';
  if (/missing_work_unit_dependency|not found in library "work"|unit .* not found in library/i.test(text)) return 'DEPENDENCY_FAILURE';
  if (/interface|port|generic/.test(text)) return 'INTERFACE_MISMATCH';
  if (/static_policy|std_logic_unsigned|std_logic_arith|placeholder/.test(text)) return 'STATIC_POLICY_FAILURE';
  if (/syntax|parse|missing.*;|unexpected/.test(text)) return 'VHDL_SYNTAX_ERROR';
  if (/type|numeric_std|no function declarations|can't match|cannot match/.test(text)) return 'VHDL_TYPE_ERROR';
  if (/dependency|work\./.test(text)) return 'DEPENDENCY_FAILURE';
  if (/elaborat/.test(text)) return 'ELABORATION_FAILURE';
  if (/synth/.test(text)) return 'SYNTHESIS_FAILURE';
  if (/timeout/.test(text)) return 'SIMULATION_TIMEOUT';
  if (/assertion|report error|failure/.test(text)) return 'ASSERTION_FAILURE';
  if (/pass marker/.test(text)) return 'PASS_MARKER_MISSING';
  if (/mutation|weak testbench/.test(text)) return 'TESTBENCH_TOO_WEAK';
  if (/behavior|mismatch/.test(text)) return 'BEHAVIORAL_MISMATCH';
  if (/repeat|mode collapse/.test(text)) return 'REPETITION_OR_MODE_COLLAPSE';
  return 'UNKNOWN';
}

export function normalizeFailureSignature(params: { stage: string; category: string; message: string; taskFamily?: string; promptVersionId?: string }) {
  const normalizedMessage = params.message
    .toLowerCase()
    .replace(/\/[^\s:)]+(?:\/[^\s:)]+)*/g, '<path>')
    .replace(/[A-Za-z]:?\/[^\s)]+/g, '<path>')
    .replace(/\b\d+\b/g, '<n>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
  return sha256([params.stage, params.category, normalizedMessage, params.taskFamily || '', params.promptVersionId || ''].join('\n')).slice(0, 24);
}

function appendRunLog(run: VhdlLabGenerationRun, stage: string, status: VhdlLabRunStatus | string, message: string): VhdlLabGenerationRun {
  return {
    ...run,
    status: status as VhdlLabRunStatus,
    currentStage: stage,
    stageLog: [...run.stageLog, { at: nowIso(), stage, status, message }],
  };
}

function extractFileLine(message: string) {
  const match = message.match(/([^:\s]+\.vhdl?|[^:\s]+\.vhd):(\d+)(?::(\d+))?/i);
  return match ? `${match[1]}:${match[2]}${match[3] ? `:${match[3]}` : ''}` : null;
}

function compactExcerpt(value: string, maxLength = 360) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function failureCodeFromIssues(stage: string, issues: VhdlLabValidationIssue[]) {
  return issues[0]?.code || stage.replace(/[^A-Za-z0-9_]+/g, '_') || 'unknown_failure';
}

function failureCodeFromMessage(stage: string, message: string) {
  const codeMatch = message.match(/\b([a-z][a-z0-9_]{3,})\s*:/i);
  if (codeMatch) return codeMatch[1].toLowerCase();
  const category = classifyVhdlLabFailure({ stage, message }).toLowerCase();
  return category === 'unknown' ? stage.replace(/[^A-Za-z0-9_]+/g, '_') : category;
}

function legalReplacementForStage(stage: string, failureCode: string) {
  if (failureCode === 'testbench_generic_constant_missing') return 'Declare local testbench constants for every frozen entity generic before declaring port signals that use those generics.';
  if (failureCode === 'video_pixel_address_bound_check') return "Use a constrained integer pixel address formula and one explicit to_unsigned(..., pixel_addr_o'length) conversion guarded by active_video.";
  if (failureCode === 'dsp_accumulator_width_bound_check') return "Use an accumulator wide enough for signed multiply/add products, resize products to sum'length, then resize the final result to the output signal length.";
  if (failureCode === 'model_chat_token_leakage') return 'Strip chat/template boundary tokens before VHDL validation and configure the model stop tokens so only VHDL reaches GHDL.';
  if (/interface/.test(stage) || /interface/.test(failureCode)) return 'Preserve the exact frozen entity generic/port names, order, modes, and types.';
  if (/dependency|missing_work_unit|work_unit/.test(stage) || /dependency|missing_work_unit|work_unit/.test(failureCode)) return 'Return one self-contained VHDL file; declare any entity work.X child units in the same file before use, or inline the logic.';
  if (/static/.test(stage) || /static_policy/.test(failureCode)) return 'Use synthesizable VHDL-2008 with ieee.std_logic_1164 and ieee.numeric_std only; remove placeholders and non-VHDL markup.';
  if (/analyz|type|syntax|ghdl/.test(stage) || /type|syntax|ghdl/.test(failureCode)) return 'Repair the exact GHDL error locally while preserving the frozen entity interface and using numeric_std-safe typing.';
  if (/model_.*timeout/.test(failureCode)) return 'Retry with a smaller focused prompt or a faster model; do not count this as VHDL quality.';
  return 'Repair locally and keep the frozen contract unchanged.';
}

export function adviseVhdlLabFailure(params: { stage: string; message: string; content?: string }): VhdlLabFailureAdvisor {
  const text = `${params.stage}\n${params.message}\n${params.content || ''}`.toLowerCase();
  if (/no declaration for "width"|no declaration for ".*"\s+signal .*?\([^)]*\bdownto\b/.test(text) && /tb_/.test(text)) {
    return {
      rootCauseOwner: 'app_testbench_renderer',
      failureClass: 'testbench_generic_constant_missing',
      deterministicFixPossible: true,
      recommendedAction: 'Fix the deterministic testbench renderer to declare local constants for entity generics before TB signal declarations.',
    };
  }
  if (/bound check failure/.test(text) && /pixel_addr_o|video_pattern_generator|h_count|v_count/.test(text)) {
    return {
      rootCauseOwner: 'generated_rtl',
      failureClass: 'video_pixel_address_bound_check',
      deterministicFixPossible: true,
      recommendedAction: "Rewrite pixel_addr_o with a guarded integer address calculation and to_unsigned(..., pixel_addr_o'length).",
    };
  }
  if (/bound check failure/.test(text) && /fir_filter_proc|fir_input_reg\s*\*\s*coeff_|dsp_chain/.test(text)) {
    return {
      rootCauseOwner: 'generated_rtl',
      failureClass: 'dsp_accumulator_width_bound_check',
      deterministicFixPossible: true,
      recommendedAction: "Normalize FIR multiply/add sizing by resizing products to a wide accumulator and resizing the final assignment to the destination length.",
    };
  }
  if (/model_repair_timeout|abort|aborted|timeout/.test(text) && /repair/.test(text)) {
    return {
      rootCauseOwner: 'model_capacity',
      failureClass: 'model_repair_timeout',
      deterministicFixPossible: false,
      recommendedAction: 'Retry with a smaller focused prompt or a faster model; do not treat this as RTL quality.',
    };
  }
  if (/repair_no_progress|unchanged candidate|unchanged raw response/.test(text)) {
    return {
      rootCauseOwner: 'prompt',
      failureClass: 'repair_no_progress',
      deterministicFixPossible: false,
      recommendedAction: 'Stop retrying the same prompt and create a narrower prompt/template/validator improvement.',
    };
  }
  return {
    rootCauseOwner: 'unknown',
    failureClass: '',
    deterministicFixPossible: false,
    recommendedAction: 'Use the canonical validator/GHDL output to choose the next repair route.',
  };
}

export function buildVhdlLabRepairPacket(params: {
  stage: string;
  candidateAttempt: number;
  previousCandidatePath?: string | null;
  issues?: VhdlLabValidationIssue[];
  message?: string;
  ghdlOutput?: string;
  content?: string;
}): VhdlLabRepairPacket {
  const message = params.message || (params.issues || []).map((issue) => `${issue.code}: ${issue.message}`).join(' ');
  const advisor = adviseVhdlLabFailure({ stage: params.stage, message, content: params.content });
  const failureCode = advisor.failureClass || (params.issues?.length ? failureCodeFromIssues(params.stage, params.issues) : failureCodeFromMessage(params.stage, message));
  return {
    failureCode,
    stage: params.stage,
    fileLine: extractFileLine(message),
    excerpt: compactExcerpt(message),
    validatorOutput: compactExcerpt(message, 800),
    ghdlOutput: compactExcerpt(params.ghdlOutput || '', 1200),
    forbiddenPattern: failureCode,
    legalReplacement: legalReplacementForStage(params.stage, failureCode),
    previousCandidatePath: params.previousCandidatePath || null,
    candidateAttempt: params.candidateAttempt,
    contentHash: params.content ? sha256(params.content) : null,
    advisor,
    createdAt: nowIso(),
  };
}

async function appendVhdlLabRepairAudit(run: VhdlLabGenerationRun, packet: VhdlLabRepairPacket) {
  const auditPath = run.repairAuditPath || path.join(run.workspacePath, 'repair-audit.json');
  let existing: any = { runId: run.id, packets: [] };
  try {
    existing = JSON.parse(await fs.readFile(auditPath, 'utf8'));
  } catch {
    existing = { runId: run.id, packets: [] };
  }
  const next = { ...existing, runId: run.id, packets: [...(existing.packets || []), packet] };
  await fs.writeFile(auditPath, `${JSON.stringify(next, null, 2)}\n`);
  return auditPath;
}

async function updateVhdlLabRun(runId: string, updater: (run: VhdlLabGenerationRun, state: VhdlLabState) => VhdlLabGenerationRun | Promise<VhdlLabGenerationRun>) {
  const state = await readVhdlLabState();
  let nextRun: VhdlLabGenerationRun | null = null;
  const runs: VhdlLabGenerationRun[] = [];
  for (const run of state.runs) {
    if (run.id !== runId) {
      runs.push(run);
      continue;
    }
    nextRun = await updater(run, state);
    runs.push(nextRun);
  }
  if (!nextRun) return null;
  await writeVhdlLabState({ ...state, runs });
  return nextRun;
}

function renderVhdlLabPrompt(contract: VhdlLabHardwareContract, promptVersion: VhdlLabPromptVersion) {
  const contractJson = JSON.stringify(contract.contractJson, null, 2);
  const userPrompt = promptVersion.userPromptTemplate
    .replaceAll('{{contract_json}}', contractJson)
    .replaceAll('{{entity_name}}', contract.entityName);
  return `${promptVersion.systemPrompt}\n\n${userPrompt}\n`;
}

function renderVhdlLabAdapterBenchmarkPrompt(contract: VhdlLabHardwareContract, promptVersion: VhdlLabPromptVersion) {
  const description = contract.contractJson.entity.description || contract.name;
  const portSummary = (contract.contractJson.ports || [])
    .map((port) => `- ${port.name}: ${port.mode} ${port.type}${port.semantic_role ? ` (${port.semantic_role})` : ''}`)
    .join('\n');
  const reset = contract.contractJson.reset;
  const resetSummary = reset?.port
    ? `${reset.port}, ${reset.polarity || 'active_high'}, ${reset.synchronous === false ? 'asynchronous' : 'synchronous'}`
    : 'no explicit reset';
  const outputPorts = (contract.contractJson.ports || [])
    .filter((port) => port.mode === 'out' || port.mode === 'buffer' || port.mode === 'inout')
    .map((port) => `- drive ${port.name} deterministically after reset`);
  return [
    promptVersion.systemPrompt,
    '',
    '## Adapter Benchmark Output Contract',
    'This benchmark validates exactly one returned VHDL file as a single-file artifact.',
    `Design intent: ${description}`,
    '',
    'Frozen interface that must be preserved exactly:',
    renderFrozenInterfaceForPrompt(contract),
    '',
    'Port semantic summary:',
    portSummary || '- none',
    '',
    `Reset policy: ${resetSummary}.`,
    'Observable output obligations:',
    outputPorts.length > 0 ? outputPorts.join('\n') : '- no output ports',
    '',
    'Do not create a hierarchical project.',
    'Do not instantiate any external work-library unit.',
    'Forbidden text in the returned VHDL: entity work.',
    'Forbidden text in the returned VHDL: entity bb_ or entity core as an instantiation target.',
    'Forbidden construct in the returned VHDL: component declaration/instantiation for missing child blocks.',
    'Return one top entity and one top architecture for the frozen entity.',
    `The returned file must contain "architecture rtl of ${contract.entityName} is".`,
    'If the architecture description mentions sub-block responsibilities, implement them as local signals, processes, constants, records, functions, or procedures inside the top architecture.',
    'Do not add child entity declarations unless absolutely necessary; if you do, every child entity and architecture must appear before the top architecture and must not instantiate more missing children.',
    'Use deterministic, conservative behavior that satisfies the observable interface contract rather than trying to recreate a full multi-file subsystem.',
    'Prefer a compact implementation under 180 lines.',
    'Return VHDL only.',
  ].join('\n');
}

function buildMissingWorkUnitRepairPrompt(params: {
  contract: VhdlLabHardwareContract;
  promptVersion: VhdlLabPromptVersion;
  previousVhdl: string;
  dependencyIssues: VhdlLabValidationIssue[];
  repairAttempt: number;
  maxRepairAttempts: number;
}) {
  const missingSummary = params.dependencyIssues
    .map((issue) => `- ${issue.message}`)
    .join('\n');
  return [
    params.promptVersion.systemPrompt,
    '',
    '## Focused Single-File Dependency Repair',
    `Repair attempt ${params.repairAttempt}/${params.maxRepairAttempts}.`,
    'The previous answer instantiated missing child entities in a single-file VHDL Lab run.',
    'Return exactly one complete self-contained VHDL-2008 file.',
    'For this repair, do not output any line containing "entity work.".',
    'For this repair, do not output component declarations or component instantiations.',
    'Hard rule: do not use entity work.X unless entity X and architecture of X are declared earlier in this same returned file.',
    'Best repair: inline simple child behavior into the top architecture and remove entity work.X instantiations.',
    'If helper entities are necessary, declare each child entity/architecture before the top architecture that instantiates it.',
    'Repeat these context clauses before every design unit: library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all;',
    'Preserve the exact frozen entity interface below. Do not add/remove/rename public ports or generics.',
    'Return VHDL only, no Markdown, no prose.',
    '',
    'Frozen interface:',
    renderFrozenInterfaceForPrompt(params.contract),
    '',
    'Required behavior obligations:',
    JSON.stringify(params.contract.contractJson.testbench_obligations || params.contract.contractJson.behavior || [], null, 2),
    '',
    'Missing dependency findings:',
    missingSummary,
    '',
    'Do not copy the previous broken hierarchy. Treat this as the required replacement shape:',
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'use ieee.numeric_std.all;',
    `entity ${params.contract.entityName} is ... end entity;`,
    `architecture rtl of ${params.contract.entityName} is`,
    '  -- local signals/functions/procedures only',
    'begin',
    '  -- synchronous processes and concurrent assignments only',
    'end architecture;',
    '',
    'Diagnostic excerpt from the previous broken VHDL, for reference only:',
    params.previousVhdl.slice(0, 2500),
  ].join('\n');
}

function renderFrozenInterfaceForPrompt(contract: VhdlLabHardwareContract) {
  const generics = (contract.contractJson.generics || [])
    .map((generic) => {
      const defaultText = generic.default ? ` := ${generic.default}` : '';
      return `- generic ${generic.name} : ${generic.type}${defaultText}`;
    });
  const ports = (contract.contractJson.ports || [])
    .map((port) => `- port ${port.name} : ${port.mode} ${port.type}`);
  return [
    `entity ${contract.entityName}`,
    'Required generics:',
    generics.length > 0 ? generics.join('\n') : '- none',
    'Required ports:',
    ports.join('\n'),
  ].join('\n');
}

function buildInterfaceRepairPrompt(params: {
  contract: VhdlLabHardwareContract;
  promptVersion: VhdlLabPromptVersion;
  previousVhdl: string;
  interfaceIssues: VhdlLabValidationIssue[];
  repairAttempt: number;
  maxRepairAttempts: number;
}) {
  const issueSummary = params.interfaceIssues
    .map((issue) => `- ${issue.code}: ${issue.message}`)
    .join('\n');
  return [
    renderVhdlLabPrompt(params.contract, params.promptVersion),
    '',
    '## Repair Required',
    `Repair attempt ${params.repairAttempt}/${params.maxRepairAttempts}.`,
    'You returned VHDL whose entity interface does not match the frozen hardware contract.',
    'Return one complete VHDL-2008 file preserving the exact frozen entity interface.',
    'Do not remove, rename, reorder, or change the mode/type of any required generic or port.',
    'Do not add extra public generics or ports.',
    'Implement any missing required output behavior internally while preserving the public interface exactly.',
    'Use ieee.std_logic_1164 and ieee.numeric_std only.',
    'Return VHDL only, no Markdown, no prose.',
    '',
    'Frozen interface that must be preserved exactly:',
    renderFrozenInterfaceForPrompt(params.contract),
    '',
    'Interface validation findings:',
    issueSummary,
    '',
    'Previous generated VHDL to repair:',
    params.previousVhdl,
  ].join('\n');
}

function buildExtractionRepairPrompt(params: {
  contract: VhdlLabHardwareContract;
  promptVersion: VhdlLabPromptVersion;
  rawResponse: string;
  extractionIssues: VhdlLabValidationIssue[];
  repairAttempt: number;
  maxRepairAttempts: number;
}) {
  const issueSummary = params.extractionIssues.map((issue) => `- ${issue.code}: ${issue.message}`).join('\n');
  return [
    renderVhdlLabPrompt(params.contract, params.promptVersion),
    '',
    '## Repair Required',
    `Repair attempt ${params.repairAttempt}/${params.maxRepairAttempts}.`,
    'The previous response could not be extracted as one complete VHDL artifact.',
    'Return exactly one complete VHDL-2008 file.',
    'Do not include Markdown fences, prose, multiple alternatives, JSON, or explanations.',
    'The file must contain the frozen entity and one architecture for that entity.',
    'Return VHDL only.',
    '',
    'Extraction findings:',
    issueSummary,
    '',
    'Previous raw response to repair:',
    params.rawResponse.slice(0, 8000),
  ].join('\n');
}

function buildStaticPolicyRepairPrompt(params: {
  contract: VhdlLabHardwareContract;
  promptVersion: VhdlLabPromptVersion;
  previousVhdl: string;
  staticIssues: VhdlLabValidationIssue[];
  repairAttempt: number;
  maxRepairAttempts: number;
}) {
  const issueSummary = params.staticIssues.map((issue) => `- ${issue.code}: ${issue.message}`).join('\n');
  return [
    renderVhdlLabPrompt(params.contract, params.promptVersion),
    '',
    '## Repair Required',
    `Repair attempt ${params.repairAttempt}/${params.maxRepairAttempts}.`,
    'The returned VHDL violated static policy before GHDL was allowed to run.',
    'Return one complete VHDL-2008 file preserving the exact frozen entity interface.',
    'Use ieee.std_logic_1164 and ieee.numeric_std only.',
    'Remove placeholders, Markdown, vendor primitives, file I/O, and unsafe non-standard packages.',
    'Do not delete, weaken, rename, or skip required behavior from the contract.',
    'Return VHDL only, no Markdown, no prose.',
    '',
    'Static policy findings:',
    issueSummary,
    '',
    'Previous generated VHDL to repair:',
    params.previousVhdl,
  ].join('\n');
}

function buildGhdlAnalyzeRepairPrompt(params: {
  contract: VhdlLabHardwareContract;
  promptVersion: VhdlLabPromptVersion;
  previousVhdl: string;
  ghdlOutput: string;
  repairAttempt: number;
  maxRepairAttempts: number;
}) {
  return [
    renderVhdlLabPrompt(params.contract, params.promptVersion),
    '',
    '## Repair Required',
    `Repair attempt ${params.repairAttempt}/${params.maxRepairAttempts}.`,
    'GHDL analyze rejected the returned VHDL.',
    'Repair only the exact syntax/type/analyze issues reported below.',
    'Preserve the exact frozen entity interface.',
    'Use VHDL-2008, ieee.std_logic_1164, and ieee.numeric_std only.',
    'Do not introduce missing work-library entities; keep this a self-contained single file.',
    'Do not weaken or remove required behavior.',
    'Return one complete VHDL file only, no Markdown, no prose.',
    '',
    'GHDL analyze output:',
    params.ghdlOutput.slice(0, 6000),
    '',
    'Previous generated VHDL to repair:',
    params.previousVhdl,
  ].join('\n');
}

function buildSimulationRepairPrompt(params: {
  contract: VhdlLabHardwareContract;
  promptVersion: VhdlLabPromptVersion;
  previousVhdl: string;
  simulationOutput: string;
  repairAttempt: number;
  maxRepairAttempts: number;
}) {
  return [
    renderVhdlLabPrompt(params.contract, params.promptVersion),
    '',
    '## Repair Required',
    `Repair attempt ${params.repairAttempt}/${params.maxRepairAttempts}.`,
    'The generated RTL passed static/interface checks, but the self-checking simulation gate failed.',
    'Repair the RTL behavior locally while preserving the exact frozen entity interface.',
    'Do not delete, weaken, rename, skip, or silence the testbench PASS/assertion behavior.',
    'Use synthesizable VHDL-2008 and numeric_std only.',
    'Return one complete VHDL file only, no Markdown, no prose.',
    '',
    'Simulation/testbench output:',
    params.simulationOutput.slice(0, 6000),
    '',
    'Contract behavior obligations:',
    JSON.stringify(params.contract.contractJson.testbench_obligations || [], null, 2),
    '',
    'Previous generated VHDL to repair:',
    params.previousVhdl,
  ].join('\n');
}

function buildAdapterCandidateRepairPrompt(params: {
  contract: VhdlLabHardwareContract;
  promptVersion: VhdlLabPromptVersion;
  rawResponse: string;
  previousVhdl: string;
  stage: string;
  failureCode: string;
  message: string;
  issues?: VhdlLabValidationIssue[];
  repairAttempt: number;
  maxRepairAttempts: number;
}) {
  const fallbackIssues = params.issues && params.issues.length > 0
    ? params.issues
    : [{ code: params.failureCode || params.stage, path: '$', message: params.message }];
  const dependencyLikeFailure = /missing_work_unit|work_unit|no declaration for "\w+"|entity\s+(?:work\.)?\w+|not found in library "work"/i
    .test(`${params.failureCode}\n${params.stage}\n${params.message}`);
  if (params.stage === 'extracting') {
    const issueSummary = fallbackIssues.map((issue) => `- ${issue.code}: ${issue.message}`).join('\n');
    return [
      renderVhdlLabAdapterBenchmarkPrompt(params.contract, params.promptVersion),
      '',
      '## Focused Extraction Repair',
      `Repair attempt ${params.repairAttempt}/${params.maxRepairAttempts}.`,
      `The previous adapter response did not include a complete architecture for ${params.contract.entityName}.`,
      `Return a complete file containing both "entity ${params.contract.entityName} is" and "architecture rtl of ${params.contract.entityName} is".`,
      'Do not emit child-only entities, recursive helper entities, catalog metadata, Markdown, JSON, or prose.',
      'Do not instantiate external children. No entity work. No component instantiations.',
      'Return compact self-contained VHDL only.',
      '',
      'Extraction findings:',
      issueSummary,
      '',
      'Previous raw response tail, for diagnosis only:',
      params.rawResponse.slice(-2500),
    ].join('\n');
  }
  if (params.stage === 'validating_interface') {
    return buildInterfaceRepairPrompt({
      contract: params.contract,
      promptVersion: params.promptVersion,
      previousVhdl: params.previousVhdl,
      interfaceIssues: fallbackIssues,
      repairAttempt: params.repairAttempt,
      maxRepairAttempts: params.maxRepairAttempts,
    });
  }
  if (params.stage === 'validating_dependencies') {
    return buildMissingWorkUnitRepairPrompt({
      contract: params.contract,
      promptVersion: params.promptVersion,
      previousVhdl: params.previousVhdl,
      dependencyIssues: fallbackIssues,
      repairAttempt: params.repairAttempt,
      maxRepairAttempts: params.maxRepairAttempts,
    });
  }
  if (dependencyLikeFailure) {
    return buildMissingWorkUnitRepairPrompt({
      contract: params.contract,
      promptVersion: params.promptVersion,
      previousVhdl: params.previousVhdl,
      dependencyIssues: fallbackIssues.map((issue) => ({
        ...issue,
        code: issue.code === params.failureCode ? 'missing_work_unit_dependency' : issue.code,
      })),
      repairAttempt: params.repairAttempt,
      maxRepairAttempts: params.maxRepairAttempts,
    });
  }
  if (params.stage === 'static_policy') {
    return buildStaticPolicyRepairPrompt({
      contract: params.contract,
      promptVersion: params.promptVersion,
      previousVhdl: params.previousVhdl,
      staticIssues: fallbackIssues,
      repairAttempt: params.repairAttempt,
      maxRepairAttempts: params.maxRepairAttempts,
    });
  }
  if (params.stage === 'simulating' || params.stage === 'elaborating' || params.stage === 'generating_testbench') {
    return buildSimulationRepairPrompt({
      contract: params.contract,
      promptVersion: params.promptVersion,
      previousVhdl: params.previousVhdl,
      simulationOutput: params.message,
      repairAttempt: params.repairAttempt,
      maxRepairAttempts: params.maxRepairAttempts,
    });
  }
  return buildGhdlAnalyzeRepairPrompt({
    contract: params.contract,
    promptVersion: params.promptVersion,
    previousVhdl: params.previousVhdl,
    ghdlOutput: params.message,
    repairAttempt: params.repairAttempt,
    maxRepairAttempts: params.maxRepairAttempts,
  });
}

export function applyDeterministicVhdlLabSimulationRepair(params: {
  contract: VhdlLabHardwareContract;
  vhdl: string;
  simulationOutput: string;
}) {
  const advisor = adviseVhdlLabFailure({ stage: 'simulating', message: params.simulationOutput, content: params.vhdl });
  if (advisor.failureClass === 'video_pixel_address_bound_check') {
    const replacement = [
      "pixel_addr_o <= to_unsigned((to_integer(v_count) * H_ACTIVE) + to_integer(h_count), pixel_addr_o'length)",
      "                when active_video = '1' else (others => '0');",
    ].join('\n    ');
    const next = params.vhdl.replace(/pixel_addr_o\s*<=\s*[^;]+;/is, replacement);
    if (next !== params.vhdl) {
      return {
        ok: true as const,
        repairType: 'deterministic_video_pixel_address_template',
        advisor,
        vhdl: next,
        message: "Rewrote pixel_addr_o with guarded integer address calculation and to_unsigned(..., pixel_addr_o'length).",
      };
    }
  }

  if (advisor.failureClass === 'dsp_accumulator_width_bound_check') {
    let next = params.vhdl
      .replace(
        /variable\s+sum\s*:\s*signed\s*\(\s*DATA_WIDTH\s*\+\s*2\s+downto\s+0\s*\)\s*;/i,
        'variable sum : signed((DATA_WIDTH * 2) + 2 downto 0);',
      )
      .replace(/resize\(\s*(fir_input_reg\s*\*\s*COEFF_\d+)\s*,\s*DATA_WIDTH\s*\+\s*2\s*\)/gi, "resize($1, sum'length)")
      .replace(
        /fir_output\s*<=\s*sum\s*\(\s*DATA_WIDTH\s*\+\s*1\s+downto\s+0\s*\)\s*;/i,
        "fir_output    <= resize(sum, fir_output'length);",
      );
    next = next.replace(
      /(\bfft_output\s*<=\s*)(\b[A-Za-z][A-Za-z0-9_]*\b)\s*\*\s*(\b[A-Za-z][A-Za-z0-9_]*\b)\s*;/gi,
      (_match, prefix, lhs, rhs) => `${prefix}resize(${lhs} * ${rhs}, fft_output'length);`,
    );
    next = next.replace(
      /(\bfir_output\s*<=\s*)(\([^)]+?\*\s*COEFF_\d+\)[\s\S]*?COEFF_\d+\))\s*;/i,
      (_match, prefix, expression) => {
        const resizedExpression = String(expression).replace(
          /\(([^()]+?\*\s*COEFF_\d+)\)/gi,
          "resize($1, (DATA_WIDTH * 2) + 3)",
        );
        return `${prefix}resize(${resizedExpression}, fir_output'length);`;
      },
    );
    if (next !== params.vhdl) {
      return {
        ok: true as const,
        repairType: 'deterministic_dsp_accumulator_width_template',
        advisor,
        vhdl: next,
        message: "Rewrote DSP multiply/add sizing to resize products into a wide accumulator and resize square/multiply outputs to the destination length.",
      };
    }
  }

  return {
    ok: false as const,
    repairType: 'none',
    advisor,
    vhdl: params.vhdl,
    message: advisor.recommendedAction,
  };
}

function isLikelyEmbeddingModel(modelId: string) {
  return /embed|embedding|bge|rerank|retriev/i.test(modelId);
}

async function chooseOllamaModel(state: VhdlLabState, run: VhdlLabGenerationRun) {
  const provider = state.providers.find((entry) => entry.providerType === 'OLLAMA' && entry.enabled);
  if (!provider) return { ok: false as const, error: 'No enabled Ollama provider is registered.' };
  let models = state.models.filter((model) => model.providerId === provider.id && model.enabled && !isLikelyEmbeddingModel(model.modelIdentifier));
  if (run.modelProfileId) {
    models = models.filter((model) => model.id === run.modelProfileId);
  }
  if (models.length === 0) {
    const discovery = await discoverOllamaModels();
    const nextState = await readVhdlLabState();
    models = nextState.models.filter((model) => model.providerId === provider.id && model.enabled && !isLikelyEmbeddingModel(model.modelIdentifier));
    if (run.modelProfileId) models = models.filter((model) => model.id === run.modelProfileId);
    if (models.length === 0) return { ok: false as const, error: discovery.error || 'No Ollama text-generation model is available for the VHDL Lab.' };
  }
  const preferred = getVhdlLabConfig().defaultModel;
  const model = models.find((entry) => preferred && entry.modelIdentifier === preferred)
    || models.find((entry) => /vhdl|code|coder|qwen|deepseek|llama|gemma/i.test(entry.modelIdentifier))
    || models[0];
  return { ok: true as const, provider, model };
}

async function runOllamaVhdlGeneration(params: {
  provider: VhdlLabProvider;
  model: VhdlLabModelProfile;
  prompt: string;
  temperature: number;
  seed: number;
  maxTokens: number;
}) {
  const baseUrl = params.provider.baseUrl.replace(/\/+$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000);
  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: params.model.modelIdentifier,
        prompt: params.prompt,
        stream: false,
        options: {
          temperature: params.temperature,
          seed: params.seed,
          num_predict: params.maxTokens,
        },
      }),
    });
    const payload = await response.json().catch(() => null);
    const text = String((payload as any)?.response || (payload as any)?.message?.content || '').trim();
    if (!response.ok) {
      return { ok: false as const, payload, text, error: `Ollama returned HTTP ${response.status}.` };
    }
    if (!text) {
      return { ok: false as const, payload, text, error: `Ollama returned no generated text for model "${params.model.modelIdentifier}".` };
    }
    return { ok: true as const, payload, text };
  } catch (error: any) {
    return { ok: false as const, payload: null, text: '', error: String(error?.message || error) };
  } finally {
    clearTimeout(timeout);
  }
}

function resolveMlxGenerateCommand(loraCommand: string | null) {
  const override = process.env.VHDL_LAB_MLX_GENERATE_COMMAND?.trim();
  if (override) return override;
  if (!loraCommand) return null;
  const basename = path.basename(loraCommand);
  if (basename === 'mlx_lm.lora') return path.join(path.dirname(loraCommand), 'mlx_lm.generate');
  if (/mlx_lm\.lora$/.test(loraCommand)) return loraCommand.replace(/mlx_lm\.lora$/, 'mlx_lm.generate');
  return null;
}

async function runMlxAdapterVhdlGeneration(params: {
  command: string;
  baseModel: string;
  adapterPath?: string | null;
  mode?: 'baseline' | 'adapter';
  prompt: string;
  workspacePath: string;
  candidateAttempt: number;
  seed: number;
  maxTokens: number;
}) {
  await fs.mkdir(path.join(params.workspacePath, 'requests'), { recursive: true });
  await fs.mkdir(path.join(params.workspacePath, 'raw-responses'), { recursive: true });
  const mode = params.mode || (params.adapterPath ? 'adapter' : 'baseline');
  const promptPath = path.join(params.workspacePath, 'requests', `${mode}-candidate-${params.candidateAttempt}.prompt.txt`);
  const responsePath = path.join(params.workspacePath, 'raw-responses', `${mode}-candidate-${params.candidateAttempt}.txt`);
  await fs.writeFile(promptPath, params.prompt);
  const args = [
    '--model',
    params.baseModel,
    '--prompt',
    '-',
    '--max-tokens',
    String(params.maxTokens),
    '--temp',
    '0',
    '--seed',
    String(params.seed),
    '--extra-eos-token',
    '<|im_end|>',
    '<|endoftext|>',
    '</s>',
    '--verbose',
    'False',
  ];
  if (params.adapterPath) {
    args.splice(2, 0, '--adapter-path', params.adapterPath);
  }
  return await new Promise<{
    ok: boolean;
    text: string;
    stdout: string;
    stderr: string;
    error: string | null;
    promptPath: string;
    responsePath: string;
    elapsedMs: number;
    timeoutMs: number;
    timedOut: boolean;
  }>((resolve) => {
    const startedAt = Date.now();
    const timeoutMs = Number(process.env.VHDL_LAB_MLX_GENERATE_TIMEOUT_MS || 900_000);
    let settled = false;
    const finish = async (result: {
      ok: boolean;
      text?: string;
      error: string | null;
      timedOut?: boolean;
    }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      const text = result.text ?? stdout.trim();
      const elapsedMs = Date.now() - startedAt;
      await fs.writeFile(
        responsePath,
        [
          stdout,
          stderr ? `\n\n--- STDERR ---\n${stderr}` : '',
          result.error ? `\n\n--- ${mode.toUpperCase()} BENCHMARK ERROR ---\n${result.error}` : '',
          `\n\n--- ${mode.toUpperCase()} BENCHMARK METADATA ---\nelapsedMs=${elapsedMs}\ntimeoutMs=${timeoutMs}\ntimedOut=${Boolean(result.timedOut)}`,
        ].join(''),
      );
      resolve({
        ok: result.ok,
        text,
        stdout,
        stderr,
        error: result.error,
        promptPath,
        responsePath,
        elapsedMs,
        timeoutMs,
        timedOut: Boolean(result.timedOut),
      });
    };
    const child = spawn(params.command, args, {
      cwd: params.workspacePath,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    });
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      void finish({
        ok: false,
        error: `model_generation_timeout: mlx_lm.generate timed out after ${Math.round(timeoutMs / 1000)}s while benchmarking the ${mode}. The model may still be cold-loading or too slow for this benchmark profile.`,
        timedOut: true,
      });
    }, timeoutMs);
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', (error) => {
      void finish({
        ok: false,
        error: String(error?.message || error),
      });
    });
    child.on('close', async (code) => {
      const text = stdout.trim();
      await finish({
        ok: code === 0 && text.length > 0,
        text,
        error: code === 0 ? null : `mlx_lm.generate exited with code ${code}.`,
      });
    });
    child.stdin.end(params.prompt);
  });
}

function stripVhdlComments(content: string) {
  return content.split('\n').map((line) => line.replace(/--.*$/, '')).join('\n');
}

function splitInterfaceDeclarations(section: string) {
  const declarations: string[] = [];
  let start = 0;
  let depth = 0;
  let inString = false;
  for (let index = 0; index < section.length; index += 1) {
    const char = section[index];
    if (char === '"' && section[index - 1] !== '\\') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === '(') depth += 1;
    if (char === ')' && depth > 0) depth -= 1;
    if (char === ';' && depth === 0) {
      const declaration = section.slice(start, index).trim();
      if (declaration) declarations.push(declaration);
      start = index + 1;
    }
  }
  const tail = section.slice(start).trim();
  if (tail) declarations.push(tail);
  return declarations;
}

function findBalancedInterfaceSection(body: string, keyword: 'generic' | 'port') {
  const keywordMatch = new RegExp(`\\b${keyword}\\b`, 'i').exec(body);
  if (!keywordMatch) return null;
  let openIndex = keywordMatch.index + keywordMatch[0].length;
  while (openIndex < body.length && /\s/.test(body[openIndex])) openIndex += 1;
  if (body[openIndex] !== '(') return null;

  let depth = 0;
  let inString = false;
  for (let index = openIndex; index < body.length; index += 1) {
    const char = body[index];
    if (char === '"' && body[index - 1] !== '\\') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === '(') depth += 1;
    if (char === ')') {
      depth -= 1;
      if (depth === 0) {
        let next = index + 1;
        while (next < body.length && /\s/.test(body[next])) next += 1;
        if (body[next] !== ';') return null;
        return body.slice(openIndex + 1, index);
      }
    }
  }
  return null;
}

export function parseVhdlEntityInterface(content: string, entityName: string): ParsedVhdlEntityInterface | null {
  const withoutComments = stripVhdlComments(content);
  const namedEndMatch = withoutComments.match(new RegExp(`\\bentity\\s+${entityName}\\s+is\\b([\\s\\S]*?)\\bend\\s+(?:entity\\s+)?${entityName}\\s*;`, 'i'));
  const unnamedEndMatch = namedEndMatch
    ? null
    : withoutComments.match(new RegExp(`\\bentity\\s+${entityName}\\s+is\\b([\\s\\S]*?)\\bend\\s*(?:entity)?\\s*;`, 'i'));
  const body = namedEndMatch?.[1] || unnamedEndMatch?.[1];
  if (!body) return null;
  const generics: ParsedVhdlEntityInterface['generics'] = [];
  const ports: ParsedVhdlEntityInterface['ports'] = [];
  const genericSection = findBalancedInterfaceSection(body, 'generic');
  if (genericSection) {
    for (const declaration of splitInterfaceDeclarations(genericSection)) {
      const match = declaration.match(/^([A-Za-z][A-Za-z0-9_,\s]*)\s*:\s*(?:constant\s+)?(.+?)(?:\s*:=\s*.+)?$/i);
      if (!match) continue;
      const names = match[1].split(',').map((name) => name.trim()).filter(Boolean);
      for (const name of names) generics.push({ name, type: normalizeType(match[2]) });
    }
  }
  const portSection = findBalancedInterfaceSection(body, 'port');
  if (portSection) {
    for (const declaration of splitInterfaceDeclarations(portSection)) {
      const match = declaration.match(/^([A-Za-z][A-Za-z0-9_,\s]*)\s*:\s*(inout|buffer|in|out)\s+(.+)$/i);
      if (!match) continue;
      const names = match[1].split(',').map((name) => name.trim()).filter(Boolean);
      for (const name of names) ports.push({ name, mode: match[2].toLowerCase(), type: normalizeType(match[3]) });
    }
  }
  return { entityName, generics, ports };
}

function compareEntityInterface(contract: VhdlLabHardwareContract, content: string): VhdlLabValidationIssue[] {
  const issues: VhdlLabValidationIssue[] = [];
  const parsed = parseVhdlEntityInterface(content, contract.entityName);
  if (!parsed) {
    return [{ code: 'interface_entity_missing', path: '$.vhdl.entity', message: `Generated VHDL is missing entity "${contract.entityName}".` }];
  }
  const parsedGenerics = new Map(parsed.generics.map((generic) => [generic.name.toLowerCase(), generic]));
  const parsedPorts = new Map(parsed.ports.map((port) => [port.name.toLowerCase(), port]));
  for (const generic of contract.contractJson.generics || []) {
    if (!parsedGenerics.has(generic.name.toLowerCase())) issues.push({ code: 'interface_generic_missing', path: `$.generics.${generic.name}`, message: `Generated entity is missing generic "${generic.name}".` });
  }
  for (const generic of parsed.generics) {
    if (!contract.contractJson.generics.some((entry) => entry.name.toLowerCase() === generic.name.toLowerCase())) issues.push({ code: 'interface_extra_generic', path: `$.generics.${generic.name}`, message: `Generated entity added unapproved generic "${generic.name}".` });
  }
  for (const port of contract.contractJson.ports || []) {
    const actual = parsedPorts.get(port.name.toLowerCase());
    if (!actual) {
      issues.push({ code: 'interface_port_missing', path: `$.ports.${port.name}`, message: `Generated entity is missing port "${port.name}".` });
      continue;
    }
    if (actual.mode !== port.mode) issues.push({ code: 'interface_port_mode_mismatch', path: `$.ports.${port.name}.mode`, message: `Port "${port.name}" mode changed from "${port.mode}" to "${actual.mode}".` });
  }
  for (const port of parsed.ports) {
    if (!contract.contractJson.ports.some((entry) => entry.name.toLowerCase() === port.name.toLowerCase())) issues.push({ code: 'interface_extra_port', path: `$.ports.${port.name}`, message: `Generated entity added unapproved port "${port.name}".` });
  }
  return issues;
}

async function recordVhdlLabFailure(params: {
  run: VhdlLabGenerationRun;
  contract: VhdlLabHardwareContract;
  stage: string;
  message: string;
  promptVersionId: string | null;
}) {
  const state = await readVhdlLabState();
  const category = classifyVhdlLabFailure({ stage: params.stage, message: params.message });
  const signature = normalizeFailureSignature({
    stage: params.stage,
    category,
    message: params.message,
    taskFamily: params.contract.taskFamily,
    promptVersionId: params.promptVersionId || undefined,
  });
  const at = nowIso();
  const existing = state.failureClusters.find((entry) => entry.signature === signature);
  const cluster: VhdlLabFailureCluster = existing
    ? {
      ...existing,
      occurrenceCount: existing.occurrenceCount + 1,
      affectedTaskFamilies: [...new Set([...existing.affectedTaskFamilies, params.contract.taskFamily])],
      affectedPromptVersions: params.promptVersionId ? [...new Set([...existing.affectedPromptVersions, params.promptVersionId])] : existing.affectedPromptVersions,
      lastSeenAt: at,
      representativeAttemptIds: [...new Set([...existing.representativeAttemptIds, params.run.id])].slice(-10),
    }
    : {
      id: id('cluster', signature),
      category,
      signature,
      normalizedMessage: params.message.replace(/\s+/g, ' ').slice(0, 500),
      occurrenceCount: 1,
      affectedTaskFamilies: [params.contract.taskFamily],
      affectedPromptVersions: params.promptVersionId ? [params.promptVersionId] : [],
      firstSeenAt: at,
      lastSeenAt: at,
      status: 'OPEN',
      representativeAttemptIds: [params.run.id],
    };
  await writeVhdlLabState({
    ...state,
    failureClusters: [cluster, ...state.failureClusters.filter((entry) => entry.signature !== signature)],
  });
  return cluster;
}

async function failVhdlLabRun(params: {
  run: VhdlLabGenerationRun;
  contract: VhdlLabHardwareContract;
  stage: string;
  message: string;
  promptVersionId: string | null;
}) {
  await fs.mkdir(path.join(params.run.workspacePath, 'diagnostics'), { recursive: true });
  await fs.writeFile(
    path.join(params.run.workspacePath, 'diagnostics', `${params.stage.replace(/[^A-Za-z0-9_-]/g, '_')}.failure.json`),
    `${JSON.stringify({ stage: params.stage, message: params.message, at: nowIso() }, null, 2)}\n`,
  );
  const cluster = await recordVhdlLabFailure(params);
  await updateVhdlLabRun(params.run.id, (run) => ({
    ...appendRunLog(run, params.stage, 'FAILED', `${params.message} Failure cluster ${cluster.signature}.`),
    completedAt: nowIso(),
  }));
}

async function runGhdlAnalyzeForVhdl(params: { run: VhdlLabGenerationRun; profile: VhdlLabVerificationProfile; vhdlPath: string }) {
  const std = `--std=${params.profile.vhdlStandard}`;
  try {
    const result = await execFileAsync(params.profile.ghdlPath, ['-a', std, path.basename(params.vhdlPath)], {
      cwd: path.dirname(params.vhdlPath),
      timeout: params.profile.synthesisTimeoutSeconds * 1000,
    });
    return { ok: true as const, stdout: result.stdout, stderr: result.stderr };
  } catch (error: any) {
    return {
      ok: false as const,
      stdout: String(error?.stdout || ''),
      stderr: String(error?.stderr || ''),
      error: String(error?.message || error),
    };
  }
}

function defaultScalarValueForType(type: string) {
  const normalized = normalizeType(type).toLowerCase();
  if (normalized === 'std_logic') return "'0'";
  if (/\b(unsigned|signed|std_logic_vector)\s*\(/.test(normalized)) return "(others => '0')";
  if (/\bpositive\b/.test(normalized)) return '1';
  if (/\binteger\b|\bnatural\b/.test(normalized)) return '0';
  return null;
}

function defaultOutputValueForPort(port: VhdlContractDocument['ports'][number]) {
  const role = String(port.semantic_role || port.name).toLowerCase();
  const normalized = normalizeType(port.type).toLowerCase();
  if (normalized === 'std_logic') {
    if (/ready/.test(role)) return "'1'";
    if (/chip_select|cs/.test(role)) return "'1'";
    return "'0'";
  }
  if (/\b(unsigned|signed|std_logic_vector)\s*\(/.test(normalized)) return "(others => '0')";
  if (/\bpositive\b/.test(normalized)) return '1';
  if (/\binteger\b|\bnatural\b/.test(normalized)) return '0';
  return null;
}

function renderVhdlLabDeterministicInterfaceSmokeRtl(contract: VhdlLabHardwareContract) {
  const generics = contract.contractJson.generics || [];
  const ports = contract.contractJson.ports || [];
  const genericLines = generics.map((generic, index) => {
    const suffix = index === generics.length - 1 ? '' : ';';
    const defaultText = generic.default ? ` := ${generic.default}` : '';
    return `    ${generic.name} : ${generic.type}${defaultText}${suffix}`;
  });
  const portLines = ports.map((port, index) => {
    const suffix = index === ports.length - 1 ? '' : ';';
    return `    ${port.name} : ${port.mode} ${port.type}${suffix}`;
  });
  const outputAssignments = ports
    .filter((port) => port.mode === 'out' || port.mode === 'buffer' || port.mode === 'inout')
    .map((port) => {
      const value = defaultOutputValueForPort(port);
      return value
        ? `  ${port.name} <= ${value};`
        : `  -- No deterministic smoke default for ${port.name} : ${port.type}`;
    });
  return [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'use ieee.numeric_std.all;',
    '',
    `entity ${contract.entityName} is`,
    ...(genericLines.length > 0 ? ['  generic (', ...genericLines, '  );'] : []),
    ...(portLines.length > 0 ? ['  port (', ...portLines, '  );'] : []),
    `end entity ${contract.entityName};`,
    '',
    `architecture rtl of ${contract.entityName} is`,
    'begin',
    ...(outputAssignments.length > 0 ? outputAssignments : ['  -- Interface-only smoke RTL has no output ports to drive.']),
    'end architecture rtl;',
    '',
  ].join('\n');
}

function renderTbSignalDeclaration(port: VhdlContractDocument['ports'][number]) {
  const defaultValue = defaultScalarValueForType(port.type);
  return `  signal ${port.name} : ${port.type}${defaultValue ? ` := ${defaultValue}` : ''};`;
}

function renderTbPortMap(ports: VhdlContractDocument['ports']) {
  return ports.map((port) => `      ${port.name} => ${port.name}`).join(',\n');
}

function renderTbGenericMap(generics: VhdlContractDocument['generics']) {
  const mappableGenerics = generics.filter((generic) => generic.default !== undefined && String(generic.default).trim().length > 0);
  if (mappableGenerics.length === 0) return '';
  return [
    '    generic map (',
    mappableGenerics.map((generic) => `      ${generic.name} => ${generic.default}`).join(',\n'),
    '    )',
  ].join('\n');
}

function renderTbGenericConstantDeclaration(generic: VhdlContractDocument['generics'][number]) {
  const defaultValue = generic.default !== undefined && String(generic.default).trim().length > 0
    ? String(generic.default).trim()
    : defaultScalarValueForType(generic.type);
  if (!defaultValue) return `  -- No deterministic testbench default for generic ${generic.name} : ${generic.type}`;
  return `  constant ${generic.name} : ${generic.type} := ${defaultValue};`;
}

export function renderVhdlLabSelfCheckingTestbench(contract: VhdlLabHardwareContract) {
  const tbEntityName = `tb_${contract.entityName}`;
  const ports = contract.contractJson.ports || [];
  const generics = contract.contractJson.generics || [];
  const clockPort = contract.contractJson.clocking?.domains?.[0]?.clock_port || ports.find((port) => /clk|clock/i.test(port.name))?.name || 'clk';
  const resetPort = contract.contractJson.reset?.port || ports.find((port) => /rst|reset/i.test(port.name))?.name || '';
  const hasClockPort = ports.some((port) => port.name === clockPort);
  const resetActiveValue = contract.contractJson.reset?.polarity === 'active_low' ? "'0'" : "'1'";
  const resetInactiveValue = contract.contractJson.reset?.polarity === 'active_low' ? "'1'" : "'0'";
  const inputDriveLines = ports
    .filter((port) => port.mode === 'in' && port.name !== clockPort && port.name !== resetPort)
    .map((port) => {
      const value = defaultScalarValueForType(port.type);
      return value ? `    ${port.name} <= ${value};` : `    -- No deterministic default for ${port.name}; left at declaration default.`;
    });
  const resetLines = resetPort ? [
    `    ${resetPort} <= ${resetActiveValue};`,
    '    wait for 20 ns;',
    `    ${resetPort} <= ${resetInactiveValue};`,
  ] : ['    wait for 20 ns;'];
  return [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'use ieee.numeric_std.all;',
    '',
    `entity ${tbEntityName} is`,
    `end entity ${tbEntityName};`,
    '',
    `architecture sim of ${tbEntityName} is`,
    ...generics.map(renderTbGenericConstantDeclaration),
    ...ports.map(renderTbSignalDeclaration),
    'begin',
    ...(hasClockPort ? [
      `  ${clockPort}_gen : process`,
      '  begin',
      `    ${clockPort} <= '0';`,
      '    wait for 5 ns;',
      `    ${clockPort} <= '1';`,
      '    wait for 5 ns;',
      '  end process;',
    ] : []),
    '',
    '  dut : entity work.' + contract.entityName,
    renderTbGenericMap(generics),
    ports.length > 0 ? [
      '    port map (',
      renderTbPortMap(ports),
      '    );',
    ].join('\n') : '    ;',
    '',
    '  stimulus : process',
    '  begin',
    ...resetLines,
    ...inputDriveLines,
    '    wait for 80 ns;',
    `    report "${contract.contractJson.pass_marker}" severity note;`,
    '    wait;',
    '  end process;',
    'end architecture sim;',
    '',
  ].join('\n');
}

async function runGhdlCommand(params: { profile: VhdlLabVerificationProfile; cwd: string; args: string[]; timeoutSeconds: number }) {
  try {
    const result = await execFileAsync(params.profile.ghdlPath, params.args, {
      cwd: params.cwd,
      timeout: params.timeoutSeconds * 1000,
    });
    return { ok: true as const, stdout: result.stdout, stderr: result.stderr };
  } catch (error: any) {
    return {
      ok: false as const,
      stdout: String(error?.stdout || ''),
      stderr: String(error?.stderr || ''),
      error: String(error?.message || error),
    };
  }
}

async function runVhdlLabSimulationGate(params: {
  run: VhdlLabGenerationRun;
  profile: VhdlLabVerificationProfile;
  contract: VhdlLabHardwareContract;
  vhdlPath: string;
  candidateAttempt: number;
}) {
  const tbEntityName = `tb_${params.contract.entityName}`;
  const tbPath = path.join(params.run.workspacePath, 'generated', 'testbench', `${tbEntityName}.candidate-${params.candidateAttempt}.vhd`);
  const tbContent = renderVhdlLabSelfCheckingTestbench(params.contract);
  await fs.writeFile(tbPath, tbContent);
  const std = `--std=${params.profile.vhdlStandard}`;
  const cwd = path.dirname(params.vhdlPath);
  const logBase = path.join(params.run.workspacePath, 'logs');

  const tbAnalyze = await runGhdlCommand({
    profile: params.profile,
    cwd,
    args: ['-a', std, path.relative(cwd, tbPath)],
    timeoutSeconds: params.profile.synthesisTimeoutSeconds,
  });
  const tbAnalyzeOutput = `${tbAnalyze.stdout || ''}${tbAnalyze.stderr || ''}${tbAnalyze.error ? `\n${tbAnalyze.error}\n` : ''}`;
  await fs.writeFile(path.join(logBase, `ghdl-analyze-tb-candidate-${params.candidateAttempt}.log`), tbAnalyzeOutput);
  if (!tbAnalyze.ok) return { ok: false as const, stage: 'testbench_analyzing', message: tbAnalyzeOutput, tbPath, tbContent };

  const elaborate = await runGhdlCommand({
    profile: params.profile,
    cwd,
    args: ['-e', std, tbEntityName],
    timeoutSeconds: params.profile.synthesisTimeoutSeconds,
  });
  const elaborateOutput = `${elaborate.stdout || ''}${elaborate.stderr || ''}${elaborate.error ? `\n${elaborate.error}\n` : ''}`;
  await fs.writeFile(path.join(logBase, `ghdl-elaborate-candidate-${params.candidateAttempt}.log`), elaborateOutput);
  if (!elaborate.ok) return { ok: false as const, stage: 'elaborating', message: elaborateOutput, tbPath, tbContent };

  const simulate = await runGhdlCommand({
    profile: params.profile,
    cwd,
    args: ['-r', std, tbEntityName, '--stop-time=200ns'],
    timeoutSeconds: params.profile.simulationTimeoutSeconds,
  });
  const simulateOutput = `${simulate.stdout || ''}${simulate.stderr || ''}${simulate.error ? `\n${simulate.error}\n` : ''}`;
  await fs.writeFile(path.join(logBase, `ghdl-simulate-candidate-${params.candidateAttempt}.log`), simulateOutput);
  if (!simulate.ok) return { ok: false as const, stage: 'simulating', message: simulateOutput, tbPath, tbContent };
  if (params.profile.passMarkerRequired && !simulateOutput.includes(params.contract.contractJson.pass_marker)) {
    return {
      ok: false as const,
      stage: 'simulating',
      message: `pass_marker_missing: simulation completed but did not print required pass marker "${params.contract.contractJson.pass_marker}".\n${simulateOutput}`,
      tbPath,
      tbContent,
    };
  }

  const acceptedTbPath = path.join(vhdlLabPaths().acceptedTestbench, `${tbEntityName}.${params.contract.contractHash}.${sha256(tbContent).slice(0, 12)}.vhd`);
  await fs.writeFile(acceptedTbPath, tbContent);
  return { ok: true as const, tbPath, acceptedTbPath, simulationLogPath: path.join(logBase, `ghdl-simulate-candidate-${params.candidateAttempt}.log`) };
}

async function validateVhdlLabAdapterCandidate(params: {
  benchmarkId: string;
  contract: VhdlLabHardwareContract;
  profile: VhdlLabVerificationProfile;
  rawText: string;
  workspacePath: string;
  candidateAttempt: number;
  maxRepairAttempts: number;
}) {
  await fs.mkdir(path.join(params.workspacePath, 'generated', 'rtl'), { recursive: true });
  await fs.mkdir(path.join(params.workspacePath, 'generated', 'testbench'), { recursive: true });
  await fs.mkdir(path.join(params.workspacePath, 'logs'), { recursive: true });
  await fs.mkdir(path.join(params.workspacePath, 'diagnostics'), { recursive: true });
  const runShape: VhdlLabGenerationRun = {
    id: `checkpoint_eval_${params.benchmarkId}_${params.contract.id}_${params.candidateAttempt}`,
    contractId: params.contract.id,
    modelProfileId: null,
    promptVersionId: null,
    verificationProfileId: params.profile.id,
    runType: 'BENCHMARK',
    status: 'ANALYZING',
    seed: 42,
    temperature: 0,
    maxTokens: 8192,
    candidateCount: 1,
    maxRepairAttempts: params.maxRepairAttempts,
    workspacePath: params.workspacePath,
    currentStage: 'adapter_benchmark',
    stageLog: [],
    benchmarkSuiteId: 'checkpoint_adapter_generation',
    datasetReleaseId: null,
    promptVersionIds: [],
    seedList: [42],
    metrics: { benchmarkId: params.benchmarkId, checkpointAdapterEvaluation: true },
    repairAuditPath: path.join(params.workspacePath, 'repair-audit.json'),
    startedAt: nowIso(),
    completedAt: null,
    cancelledAt: null,
    createdAt: nowIso(),
  };

  const extraction = extractOneVhdlArtifact(params.rawText);
  if (!extraction.ok) {
    const failedExtraction = extraction as FailedVhdlExtractionResult;
    return {
      ok: false as const,
      stage: 'extracting',
      failureCode: failureCodeFromIssues('extracting', failedExtraction.issues),
      message: failedExtraction.issues.map((issue) => `${issue.code}: ${issue.message}`).join('\n'),
      artifactPath: null,
      rawResponse: params.rawText,
      issues: failedExtraction.issues,
      generatedVhdl: '',
    };
  }
  const assembledVhdl = normalizeSingleFileVhdlContextClauses(assembleVhdlWithFrozenEntity(extraction.vhdl, params.contract));
  const vhdlPath = path.join(params.workspacePath, 'generated', 'rtl', `${params.contract.entityName}.adapter-candidate-${params.candidateAttempt}.vhd`);
  await fs.writeFile(vhdlPath, assembledVhdl);

  const interfaceIssues = compareEntityInterface(params.contract, assembledVhdl);
  if (interfaceIssues.length > 0) {
    return {
      ok: false as const,
      stage: 'validating_interface',
      failureCode: failureCodeFromIssues('validating_interface', interfaceIssues),
      message: interfaceIssues.map((issue) => `${issue.code}: ${issue.message}`).join('\n'),
      artifactPath: vhdlPath,
      rawResponse: params.rawText,
      issues: interfaceIssues,
      generatedVhdl: assembledVhdl,
    };
  }

  const dependencyIssues = validateSingleFileWorkUnitDependencies(assembledVhdl, params.contract.entityName);
  if (dependencyIssues.length > 0) {
    return {
      ok: false as const,
      stage: 'validating_dependencies',
      failureCode: failureCodeFromIssues('validating_dependencies', dependencyIssues),
      message: dependencyIssues.map((issue) => `${issue.code}: ${issue.message}`).join('\n'),
      artifactPath: vhdlPath,
      rawResponse: params.rawText,
      issues: dependencyIssues,
      generatedVhdl: assembledVhdl,
    };
  }

  const staticIssues = staticPolicyCheckVhdl(assembledVhdl);
  if (staticIssues.length > 0) {
    return {
      ok: false as const,
      stage: 'static_policy',
      failureCode: failureCodeFromIssues('static_policy', staticIssues),
      message: staticIssues.map((issue) => `${issue.code}: ${issue.message}`).join('\n'),
      artifactPath: vhdlPath,
      rawResponse: params.rawText,
      issues: staticIssues,
      generatedVhdl: assembledVhdl,
    };
  }

  const analyze = await runGhdlAnalyzeForVhdl({ run: runShape, profile: params.profile, vhdlPath });
  const analyzeOutput = `${analyze.stdout || ''}${analyze.stderr || ''}${analyze.error ? `\n${analyze.error}\n` : ''}`;
  await fs.writeFile(path.join(params.workspacePath, 'logs', `ghdl-analyze-adapter-candidate-${params.candidateAttempt}.log`), analyzeOutput);
  if (!analyze.ok) {
    return {
      ok: false as const,
      stage: 'analyzing',
      failureCode: failureCodeFromMessage('analyzing', analyzeOutput),
      message: analyzeOutput,
      artifactPath: vhdlPath,
      rawResponse: params.rawText,
      issues: [],
      generatedVhdl: assembledVhdl,
    };
  }

  if (params.profile.simulationRequired) {
    const simulation = await runVhdlLabSimulationGate({
      run: runShape,
      profile: params.profile,
      contract: params.contract,
      vhdlPath,
      candidateAttempt: params.candidateAttempt,
    });
    if (!simulation.ok) {
      return {
        ok: false as const,
        stage: simulation.stage,
        failureCode: failureCodeFromMessage(simulation.stage, simulation.message),
        message: simulation.message,
        artifactPath: vhdlPath,
        rawResponse: params.rawText,
        issues: [],
        generatedVhdl: assembledVhdl,
      };
    }
    return {
      ok: true as const,
      stage: 'accepted',
      message: 'Adapter-generated RTL passed extraction, interface, dependency, static policy, GHDL analyze, and simulation gates.',
      artifactPath: vhdlPath,
      acceptedTestbenchPath: simulation.acceptedTbPath,
      simulationLogPath: simulation.simulationLogPath,
    };
  }

  return {
    ok: true as const,
    stage: 'accepted',
    message: 'Adapter-generated RTL passed extraction, interface, dependency, static policy, and GHDL analyze gates.',
    artifactPath: vhdlPath,
  };
}

export function shouldUseAdapterBenchmarkFallback(validation: {
  stage: string;
  failureCode: string;
  message: string;
  generatedVhdl?: string;
}) {
  const text = `${validation.stage}\n${validation.failureCode}\n${validation.message}\n${validation.generatedVhdl || ''}`;
  const extractionMissingTopEntity = /vhdl_extraction_missing_entity|missing an entity declaration/i.test(text);
  const missingOrRecursiveDependency = /missing_work_unit_dependency|single_file_work_unit_order|vhdl_extraction_entity_architecture_mismatch|no declaration for\s+"(?:bb_core|core)"|entity\s+"(?:bb_core|core)"\s+was not analysed/i.test(text)
    && /(?:\bentity\s+(?:work\.)?(?:bb_core|core)\b|_core_core|generic_core|missing an architecture)/i.test(text);
  return extractionMissingTopEntity || missingOrRecursiveDependency;
}

async function tryVhdlLabAdapterBenchmarkFallback(params: {
  benchmarkId: string;
  contract: VhdlLabHardwareContract;
  profile: VhdlLabVerificationProfile;
  promptVersion: VhdlLabPromptVersion;
  workspacePath: string;
  previousValidation: {
    stage: string;
    failureCode: string;
    message: string;
    artifactPath?: string;
    rawResponse?: string;
    issues?: Array<VhdlLabValidationIssue>;
    generatedVhdl?: string;
  };
  candidateAttempt: number;
  maxRepairAttempts: number;
  elapsedMs?: number;
  timeoutMs?: number;
}) {
  const fallbackAttempt = params.candidateAttempt + 1;
  const promptPath = path.join(params.workspacePath, 'requests', `adapter-fallback-${fallbackAttempt}.prompt.txt`);
  const responsePath = path.join(params.workspacePath, 'raw-responses', `adapter-fallback-${fallbackAttempt}.txt`);
  await fs.mkdir(path.dirname(promptPath), { recursive: true });
  await fs.mkdir(path.dirname(responsePath), { recursive: true });
  const prompt = [
    'App-owned deterministic adapter benchmark fallback.',
    '',
    'Reason:',
    `- Adapter candidate repeatedly failed with ${params.previousValidation.failureCode} at ${params.previousValidation.stage}.`,
    '- The adapter did not produce a valid self-contained implementation for the frozen contract.',
    '',
    'Action:',
    '- Emit an interface-smoke RTL implementation owned by the app.',
    '- Preserve the frozen entity, generics, and ports exactly.',
    '- Drive outputs with conservative reset/smoke defaults only.',
    '- Mark this benchmark result as adapterFallbackUsed; do not treat it as adapter-authored success.',
  ].join('\n');
  const fallbackVhdl = renderVhdlLabDeterministicInterfaceSmokeRtl(params.contract);
  await fs.writeFile(promptPath, prompt);
  await fs.writeFile(responsePath, fallbackVhdl);
  const validation = await validateVhdlLabAdapterCandidate({
    benchmarkId: params.benchmarkId,
    contract: params.contract,
    profile: params.profile,
    rawText: fallbackVhdl,
    workspacePath: params.workspacePath,
    candidateAttempt: fallbackAttempt,
    maxRepairAttempts: params.maxRepairAttempts,
  });
  if (validation.ok) {
    return {
      contractId: params.contract.id,
      contractName: params.contract.name,
      entityName: params.contract.entityName,
      passed: true,
      stage: validation.stage,
      failureCode: null,
      message: [
        validation.message,
        'Adapter repair exhausted on malformed, recursive, or missing-dependency output; app-owned deterministic interface-smoke fallback passed validation.',
      ].join('\n'),
      artifactPath: validation.artifactPath,
      acceptedTestbenchPath: validation.acceptedTestbenchPath,
      simulationLogPath: validation.simulationLogPath,
      promptPath,
      responsePath,
      elapsedMs: params.elapsedMs ?? 0,
      timeoutMs: params.timeoutMs ?? 0,
      candidateAttemptsUsed: params.candidateAttempt,
      fallbackCandidateAttempt: fallbackAttempt,
      maxRepairAttempts: params.maxRepairAttempts,
      repairAuditPath: path.join(params.workspacePath, 'repair-audit.json'),
      adapterFallbackUsed: true,
      adapterModelPassed: false,
      previousFailureCode: params.previousValidation.failureCode,
      previousFailureStage: params.previousValidation.stage,
    };
  }
  return {
    contractId: params.contract.id,
    contractName: params.contract.name,
    entityName: params.contract.entityName,
    passed: false,
    stage: validation.stage,
    failureCode: 'adapter_fallback_validation_failed',
    message: [
      'App-owned deterministic interface-smoke fallback was attempted after malformed, recursive, or missing-dependency adapter output, but it did not validate.',
      validation.message,
    ].join('\n'),
    artifactPath: validation.artifactPath,
    promptPath,
    responsePath,
    elapsedMs: params.elapsedMs ?? 0,
    timeoutMs: params.timeoutMs ?? 0,
    candidateAttemptsUsed: params.candidateAttempt,
    fallbackCandidateAttempt: fallbackAttempt,
    maxRepairAttempts: params.maxRepairAttempts,
    repairAuditPath: path.join(params.workspacePath, 'repair-audit.json'),
    adapterFallbackUsed: true,
    adapterModelPassed: false,
    previousFailureCode: params.previousValidation.failureCode,
    previousFailureStage: params.previousValidation.stage,
  };
}

export function getVhdlLabWorkerSnapshot(): VhdlLabWorkerSnapshot {
  return { ...vhdlLabWorkerState };
}

export function startVhdlLabWorker() {
  const config = getVhdlLabConfig();
  vhdlLabWorkerState.enabled = config.worker.enabled;
  if (!config.worker.enabled || vhdlLabWorkerState.started) return getVhdlLabWorkerSnapshot();
  vhdlLabWorkerState.started = true;
  vhdlLabWorkerTimer = setInterval(() => {
    void runVhdlLabWorkerOnce().catch((error) => {
      vhdlLabWorkerState.lastError = String(error?.message || error);
    });
  }, Math.max(2, config.worker.heartbeatSeconds) * 1000);
  void runVhdlLabWorkerOnce().catch((error) => {
    vhdlLabWorkerState.lastError = String(error?.message || error);
  });
  return getVhdlLabWorkerSnapshot();
}

export function stopVhdlLabWorker() {
  if (vhdlLabWorkerTimer) clearInterval(vhdlLabWorkerTimer);
  vhdlLabWorkerTimer = null;
  vhdlLabWorkerState.started = false;
  vhdlLabWorkerState.running = false;
  vhdlLabWorkerState.currentRunId = null;
  return getVhdlLabWorkerSnapshot();
}

export async function runVhdlLabWorkerOnce() {
  const config = getVhdlLabConfig();
  vhdlLabWorkerState.enabled = config.worker.enabled;
  vhdlLabWorkerState.lastTickAt = nowIso();
  if (!config.worker.enabled || vhdlLabWorkerState.running) return getVhdlLabWorkerSnapshot();
  vhdlLabWorkerState.running = true;
  try {
    await ensureVhdlLabStorage();
    const state = await readVhdlLabState();
    const queuedRun = [...state.runs].reverse().find((run) => run.status === 'QUEUED');
    if (!queuedRun) return getVhdlLabWorkerSnapshot();
    vhdlLabWorkerState.currentRunId = queuedRun.id;
    const contract = state.contracts.find((entry) => entry.id === queuedRun.contractId);
    const profile = state.verificationProfiles.find((entry) => entry.id === queuedRun.verificationProfileId)
      || state.verificationProfiles.find((entry) => entry.enabled)
      || defaultVhdlLabState().verificationProfiles[0];
    const promptVersion = state.promptVersions.find((entry) => entry.id === queuedRun.promptVersionId)
      || state.promptVersions.find((entry) => state.promptTemplates.some((template) => template.currentVersionId === entry.id))
      || state.promptVersions[0];
    if (!contract || !promptVersion) {
      await updateVhdlLabRun(queuedRun.id, (run) => ({
        ...appendRunLog(run, 'preparing', 'FAILED', !contract ? 'Run contract was not found.' : 'Run prompt version was not found.'),
        completedAt: nowIso(),
      }));
      return getVhdlLabWorkerSnapshot();
    }

    let run = await updateVhdlLabRun(queuedRun.id, (current) => ({
      ...appendRunLog({ ...current, startedAt: current.startedAt || nowIso() }, 'preparing', 'PREPARING', 'Preparing frozen contract and Ollama model.'),
    }));
    if (!run) return getVhdlLabWorkerSnapshot();

    const modelChoice = await chooseOllamaModel(await readVhdlLabState(), run);
    if (!modelChoice.ok) {
      await failVhdlLabRun({ run, contract, stage: 'provider_model_selection', message: modelChoice.error, promptVersionId: promptVersion.id });
      return getVhdlLabWorkerSnapshot();
    }

    let candidatePrompt = renderVhdlLabPrompt(contract, promptVersion);
    let acceptedVhdl = '';
    let acceptedPath = '';
    let acceptedTestbenchPath = '';
    let verificationStrength: 'ghdl_analyze' | 'ghdl_simulation' = 'ghdl_analyze';
    let lastRepairProgressKey = '';
    const maxCandidateAttempts = 1 + Math.max(0, run.maxRepairAttempts);
    for (let candidateAttempt = 1; candidateAttempt <= maxCandidateAttempts; candidateAttempt += 1) {
      const isRepairAttempt = candidateAttempt > 1;
      await fs.writeFile(path.join(run.workspacePath, 'requests', `candidate-${candidateAttempt}.prompt.txt`), candidatePrompt);
      run = await updateVhdlLabRun(run.id, (current) => ({
        ...appendRunLog(
          current,
          isRepairAttempt ? 'repairing' : 'generating',
          isRepairAttempt ? 'REPAIRING' : 'GENERATING',
          isRepairAttempt
            ? `Repair attempt ${candidateAttempt - 1}/${current.maxRepairAttempts}: regenerating RTL for the previous validation failure.`
            : `Generating RTL with Ollama model ${modelChoice.model.modelIdentifier}.`,
        ),
        modelProfileId: modelChoice.model.id,
        promptVersionId: promptVersion.id,
        temperature: modelChoice.model.defaultTemperature,
        seed: modelChoice.model.defaultSeed,
        maxTokens: Math.min(modelChoice.model.defaultMaxTokens || current.maxTokens, current.maxTokens),
      }));
      if (!run) return getVhdlLabWorkerSnapshot();

      const generation = await runOllamaVhdlGeneration({
        provider: modelChoice.provider,
        model: modelChoice.model,
        prompt: candidatePrompt,
        temperature: run.temperature,
        seed: run.seed,
        maxTokens: run.maxTokens,
      });
      await fs.writeFile(path.join(run.workspacePath, 'raw-responses', `candidate-${candidateAttempt}.json`), `${JSON.stringify(generation.payload || { error: generation.error }, null, 2)}\n`);
      await fs.writeFile(path.join(run.workspacePath, 'raw-responses', `candidate-${candidateAttempt}.txt`), `${generation.text || ''}\n`);
      if (!generation.ok) {
        const isAbort = /abort|aborted|aborterror|timeout/i.test(generation.error);
        const failureCode = isAbort
          ? (isRepairAttempt ? 'model_repair_timeout' : 'model_generation_timeout')
          : (isRepairAttempt ? 'model_repair_failed' : 'model_generation_failed');
        await failVhdlLabRun({
          run,
          contract,
          stage: isRepairAttempt ? 'repairing' : 'generating',
          message: `${failureCode}: ${generation.error}`,
          promptVersionId: promptVersion.id,
        });
        return getVhdlLabWorkerSnapshot();
      }

      run = await updateVhdlLabRun(run.id, (current) => appendRunLog(current, 'extracting', 'EXTRACTING', `Extracting one complete VHDL artifact from candidate ${candidateAttempt}.`));
      if (!run) return getVhdlLabWorkerSnapshot();
      const extraction = extractOneVhdlArtifact(generation.text);
      if (!extraction.ok) {
        const failedExtraction = extraction as FailedVhdlExtractionResult;
        const packet = buildVhdlLabRepairPacket({
          stage: 'extracting',
          candidateAttempt,
          issues: failedExtraction.issues,
          message: failedExtraction.issues.map((issue) => `${issue.code}: ${issue.message}`).join(' '),
        });
        await appendVhdlLabRepairAudit(run, packet);
        if (candidateAttempt < maxCandidateAttempts) {
          const progressKey = `${packet.failureCode}:${sha256(generation.text || '')}`;
          if (lastRepairProgressKey === progressKey) {
            await failVhdlLabRun({ run, contract, stage: 'repairing', message: `repair_no_progress: repeated ${packet.failureCode} with unchanged raw response.`, promptVersionId: promptVersion.id });
            return getVhdlLabWorkerSnapshot();
          }
          lastRepairProgressKey = progressKey;
          candidatePrompt = buildExtractionRepairPrompt({
            contract,
            promptVersion,
            rawResponse: generation.text,
            extractionIssues: failedExtraction.issues,
            repairAttempt: candidateAttempt,
            maxRepairAttempts: run.maxRepairAttempts,
          });
          run = await updateVhdlLabRun(run.id, (current) => appendRunLog(
            current,
            'repairing',
            'REPAIRING',
            `extraction failed in candidate ${candidateAttempt}; requesting one-file VHDL repair.`,
          ));
          if (!run) return getVhdlLabWorkerSnapshot();
          continue;
        }
        await failVhdlLabRun({ run, contract, stage: 'extracting', message: failedExtraction.issues.map((issue) => issue.message).join(' '), promptVersionId: promptVersion.id });
        return getVhdlLabWorkerSnapshot();
      }
      const assembledVhdl = assembleVhdlWithFrozenEntity(extraction.vhdl, contract);
      let normalizedVhdl = normalizeSingleFileVhdlContextClauses(assembledVhdl);
      const candidatePath = path.join(run.workspacePath, 'generated', 'rtl', `${contract.entityName}.candidate-${candidateAttempt}.vhd`);
      await fs.writeFile(candidatePath, normalizedVhdl);

      run = await updateVhdlLabRun(run.id, (current) => appendRunLog(current, 'validating_interface', 'VALIDATING_INTERFACE', `Checking candidate ${candidateAttempt} entity interface against the frozen contract.`));
      if (!run) return getVhdlLabWorkerSnapshot();
      const interfaceIssues = compareEntityInterface(contract, normalizedVhdl);
      if (interfaceIssues.length > 0) {
        const message = interfaceIssues.map((issue) => `${issue.code}: ${issue.message}`).join(' ');
        const packet = buildVhdlLabRepairPacket({
          stage: 'validating_interface',
          candidateAttempt,
          previousCandidatePath: candidatePath,
          issues: interfaceIssues,
          message,
          content: normalizedVhdl,
        });
        await appendVhdlLabRepairAudit(run, packet);
        if (candidateAttempt < maxCandidateAttempts) {
          const progressKey = `${packet.failureCode}:${packet.contentHash}`;
          if (lastRepairProgressKey === progressKey) {
            await failVhdlLabRun({ run, contract, stage: 'repairing', message: `repair_no_progress: repeated ${packet.failureCode} with unchanged candidate content.`, promptVersionId: promptVersion.id });
            return getVhdlLabWorkerSnapshot();
          }
          lastRepairProgressKey = progressKey;
          candidatePrompt = buildInterfaceRepairPrompt({
            contract,
            promptVersion,
            previousVhdl: normalizedVhdl,
            interfaceIssues,
            repairAttempt: candidateAttempt,
            maxRepairAttempts: run.maxRepairAttempts,
          });
          run = await updateVhdlLabRun(run.id, (current) => appendRunLog(
            current,
            'repairing',
            'REPAIRING',
            `interface validation failed in candidate ${candidateAttempt}; requesting exact frozen-interface repair.`,
          ));
          if (!run) return getVhdlLabWorkerSnapshot();
          continue;
        }
        await failVhdlLabRun({ run, contract, stage: 'validating_interface', message, promptVersionId: promptVersion.id });
        return getVhdlLabWorkerSnapshot();
      }

      run = await updateVhdlLabRun(run.id, (current) => appendRunLog(current, 'validating_dependencies', 'VALIDATING_DEPENDENCIES', `Checking candidate ${candidateAttempt} single-file work-library dependencies before GHDL.`));
      if (!run) return getVhdlLabWorkerSnapshot();
      const dependencyIssues = validateSingleFileWorkUnitDependencies(normalizedVhdl, contract.entityName);
      if (dependencyIssues.length > 0) {
        const message = dependencyIssues.map((issue) => `${issue.code}: ${issue.message}`).join(' ');
        const packet = buildVhdlLabRepairPacket({
          stage: 'validating_dependencies',
          candidateAttempt,
          previousCandidatePath: candidatePath,
          issues: dependencyIssues,
          message,
          content: normalizedVhdl,
        });
        await appendVhdlLabRepairAudit(run, packet);
        if (candidateAttempt < maxCandidateAttempts) {
          const progressKey = `${packet.failureCode}:${packet.contentHash}`;
          if (lastRepairProgressKey === progressKey) {
            await failVhdlLabRun({ run, contract, stage: 'repairing', message: `repair_no_progress: repeated ${packet.failureCode} with unchanged candidate content.`, promptVersionId: promptVersion.id });
            return getVhdlLabWorkerSnapshot();
          }
          lastRepairProgressKey = progressKey;
          candidatePrompt = buildMissingWorkUnitRepairPrompt({
            contract,
            promptVersion,
            previousVhdl: normalizedVhdl,
            dependencyIssues,
            repairAttempt: candidateAttempt,
            maxRepairAttempts: run.maxRepairAttempts,
          });
          run = await updateVhdlLabRun(run.id, (current) => appendRunLog(
            current,
            'repairing',
            'REPAIRING',
            `missing_work_unit_dependency found in candidate ${candidateAttempt}; requesting self-contained RTL repair.`,
          ));
          if (!run) return getVhdlLabWorkerSnapshot();
          continue;
        }
        await failVhdlLabRun({ run, contract, stage: 'validating_dependencies', message, promptVersionId: promptVersion.id });
        return getVhdlLabWorkerSnapshot();
      }

      const staticIssues = staticPolicyCheckVhdl(normalizedVhdl);
      if (staticIssues.length > 0) {
        const message = staticIssues.map((issue) => `${issue.code}: ${issue.message}`).join(' ');
        const packet = buildVhdlLabRepairPacket({
          stage: 'static_policy',
          candidateAttempt,
          previousCandidatePath: candidatePath,
          issues: staticIssues,
          message,
          content: normalizedVhdl,
        });
        await appendVhdlLabRepairAudit(run, packet);
        if (candidateAttempt < maxCandidateAttempts) {
          const progressKey = `${packet.failureCode}:${packet.contentHash}`;
          if (lastRepairProgressKey === progressKey) {
            await failVhdlLabRun({ run, contract, stage: 'repairing', message: `repair_no_progress: repeated ${packet.failureCode} with unchanged candidate content.`, promptVersionId: promptVersion.id });
            return getVhdlLabWorkerSnapshot();
          }
          lastRepairProgressKey = progressKey;
          candidatePrompt = buildStaticPolicyRepairPrompt({
            contract,
            promptVersion,
            previousVhdl: normalizedVhdl,
            staticIssues,
            repairAttempt: candidateAttempt,
            maxRepairAttempts: run.maxRepairAttempts,
          });
          run = await updateVhdlLabRun(run.id, (current) => appendRunLog(
            current,
            'repairing',
            'REPAIRING',
            `static policy failed in candidate ${candidateAttempt}; requesting strict VHDL repair.`,
          ));
          if (!run) return getVhdlLabWorkerSnapshot();
          continue;
        }
        await failVhdlLabRun({ run, contract, stage: 'static_policy', message, promptVersionId: promptVersion.id });
        return getVhdlLabWorkerSnapshot();
      }

      const vhdlPath = path.join(run.workspacePath, 'generated', 'rtl', `${contract.entityName}.vhd`);
      await fs.writeFile(vhdlPath, normalizedVhdl);

      run = await updateVhdlLabRun(run.id, (current) => appendRunLog(current, 'analyzing', 'ANALYZING', `Running GHDL analyze on candidate ${candidateAttempt}.`));
      if (!run) return getVhdlLabWorkerSnapshot();
      const analyze = await runGhdlAnalyzeForVhdl({ run, profile, vhdlPath });
      const ghdlOutput = `${analyze.stdout || ''}${analyze.stderr || ''}${analyze.error ? `\n${analyze.error}\n` : ''}`;
      await fs.writeFile(path.join(run.workspacePath, 'logs', `ghdl-analyze-candidate-${candidateAttempt}.log`), ghdlOutput);
      if (!analyze.ok) {
        const packet = buildVhdlLabRepairPacket({
          stage: 'analyzing',
          candidateAttempt,
          previousCandidatePath: vhdlPath,
          message: ghdlOutput,
          ghdlOutput,
          content: normalizedVhdl,
        });
        await appendVhdlLabRepairAudit(run, packet);
        if (candidateAttempt < maxCandidateAttempts) {
          const progressKey = `${packet.failureCode}:${packet.contentHash}`;
          if (lastRepairProgressKey === progressKey) {
            await failVhdlLabRun({ run, contract, stage: 'repairing', message: `repair_no_progress: repeated ${packet.failureCode} with unchanged candidate content.`, promptVersionId: promptVersion.id });
            return getVhdlLabWorkerSnapshot();
          }
          lastRepairProgressKey = progressKey;
          candidatePrompt = buildGhdlAnalyzeRepairPrompt({
            contract,
            promptVersion,
            previousVhdl: normalizedVhdl,
            ghdlOutput,
            repairAttempt: candidateAttempt,
            maxRepairAttempts: run.maxRepairAttempts,
          });
          run = await updateVhdlLabRun(run.id, (current) => appendRunLog(
            current,
            'repairing',
            'REPAIRING',
            `GHDL analyze failed in candidate ${candidateAttempt}; requesting focused VHDL repair.`,
          ));
          if (!run) return getVhdlLabWorkerSnapshot();
          continue;
        }
        await failVhdlLabRun({ run, contract, stage: 'analyzing', message: ghdlOutput, promptVersionId: promptVersion.id });
        return getVhdlLabWorkerSnapshot();
      }

      if (profile.simulationRequired) {
        run = await updateVhdlLabRun(run.id, (current) => appendRunLog(
          current,
          'generating_testbench',
          'GENERATING_TESTBENCH',
          `Rendering deterministic self-checking testbench for candidate ${candidateAttempt}.`,
        ));
        if (!run) return getVhdlLabWorkerSnapshot();
        run = await updateVhdlLabRun(run.id, (current) => appendRunLog(
          current,
          'simulating',
          'SIMULATING',
          `Checking candidate ${candidateAttempt} with GHDL testbench analyze, elaborate, and simulate.`,
        ));
        if (!run) return getVhdlLabWorkerSnapshot();

        let simulation = await runVhdlLabSimulationGate({
          run,
          profile,
          contract,
          vhdlPath,
          candidateAttempt,
        });
        if (!simulation.ok) {
          const deterministicRepair = applyDeterministicVhdlLabSimulationRepair({
            contract,
            vhdl: normalizedVhdl,
            simulationOutput: simulation.message,
          });
          if (deterministicRepair.ok) {
            const repairPacket = buildVhdlLabRepairPacket({
              stage: 'deterministic_repair',
              candidateAttempt,
              previousCandidatePath: vhdlPath,
              message: `${deterministicRepair.repairType}: ${deterministicRepair.message}`,
              content: deterministicRepair.vhdl,
            });
            await appendVhdlLabRepairAudit(run, repairPacket);
            normalizedVhdl = deterministicRepair.vhdl;
            await fs.writeFile(candidatePath, normalizedVhdl);
            await fs.writeFile(vhdlPath, normalizedVhdl);
            run = await updateVhdlLabRun(run.id, (current) => appendRunLog(
              current,
              'deterministic_repair',
              'ANALYZING',
              `${deterministicRepair.repairType}: ${deterministicRepair.message} Re-running GHDL gates.`,
            ));
            if (!run) return getVhdlLabWorkerSnapshot();
            const postRepairAnalyze = await runGhdlAnalyzeForVhdl({ run, profile, vhdlPath });
            const postRepairGhdlOutput = `${postRepairAnalyze.stdout || ''}${postRepairAnalyze.stderr || ''}${postRepairAnalyze.error ? `\n${postRepairAnalyze.error}\n` : ''}`;
            await fs.writeFile(path.join(run.workspacePath, 'logs', `ghdl-analyze-candidate-${candidateAttempt}-deterministic-repair.log`), postRepairGhdlOutput);
            if (postRepairAnalyze.ok) {
              simulation = await runVhdlLabSimulationGate({
                run,
                profile,
                contract,
                vhdlPath,
                candidateAttempt,
              });
            } else {
              simulation = {
                ok: false as const,
                stage: 'analyzing',
                message: postRepairGhdlOutput,
                tbPath: '',
                tbContent: '',
              };
            }
          }
        }
        if (!simulation.ok) {
          const packet = buildVhdlLabRepairPacket({
            stage: simulation.stage,
            candidateAttempt,
            previousCandidatePath: vhdlPath,
            message: simulation.message,
            ghdlOutput: simulation.message,
            content: normalizedVhdl,
          });
          await appendVhdlLabRepairAudit(run, packet);
          if (candidateAttempt < maxCandidateAttempts) {
            const progressKey = `${packet.failureCode}:${packet.contentHash}`;
            if (lastRepairProgressKey === progressKey) {
              await failVhdlLabRun({ run, contract, stage: 'repairing', message: `repair_no_progress: repeated ${packet.failureCode} with unchanged candidate content.`, promptVersionId: promptVersion.id });
              return getVhdlLabWorkerSnapshot();
            }
            lastRepairProgressKey = progressKey;
            candidatePrompt = buildSimulationRepairPrompt({
              contract,
              promptVersion,
              previousVhdl: normalizedVhdl,
              simulationOutput: simulation.message,
              repairAttempt: candidateAttempt,
              maxRepairAttempts: run.maxRepairAttempts,
            });
            run = await updateVhdlLabRun(run.id, (current) => appendRunLog(
              current,
              'repairing',
              'REPAIRING',
              `${simulation.stage} failed in candidate ${candidateAttempt}; requesting behavioral simulation repair.`,
            ));
            if (!run) return getVhdlLabWorkerSnapshot();
            continue;
          }
          await failVhdlLabRun({ run, contract, stage: simulation.stage, message: simulation.message, promptVersionId: promptVersion.id });
          return getVhdlLabWorkerSnapshot();
        }
        acceptedTestbenchPath = simulation.acceptedTbPath;
        verificationStrength = 'ghdl_simulation';
        run = await updateVhdlLabRun(run.id, (current) => appendRunLog(
          current,
          'simulating',
          'SIMULATING',
          `GHDL simulation passed for candidate ${candidateAttempt}; required pass marker was observed.`,
        ));
        if (!run) return getVhdlLabWorkerSnapshot();
      }

      acceptedVhdl = normalizedVhdl;
      acceptedPath = path.join(vhdlLabPaths().acceptedRtl, `${contract.entityName}.${contract.contractHash}.${sha256(normalizedVhdl).slice(0, 12)}.vhd`);
      await fs.writeFile(acceptedPath, normalizedVhdl);
      break;
    }

    if (!acceptedVhdl || !acceptedPath) {
      await failVhdlLabRun({ run, contract, stage: 'repairing', message: 'VHDL Lab repair loop ended without an accepted candidate.', promptVersionId: promptVersion.id });
      return getVhdlLabWorkerSnapshot();
    }
    const finalRun = await updateVhdlLabRun(run.id, (current) => ({
      ...appendRunLog(
        current,
        'accepted',
        'ACCEPTED',
        verificationStrength === 'ghdl_simulation'
          ? `Generated RTL passed extraction, interface, dependency, static policy, GHDL analyze, testbench elaborate, GHDL simulate, and pass marker validation. Accepted artifact: ${acceptedPath}`
          : `Generated RTL passed extraction, interface, dependency, static policy, and GHDL analyze. Accepted artifact: ${acceptedPath}`,
      ),
      completedAt: nowIso(),
    }));
    if (finalRun) {
      const nextState = await readVhdlLabState();
      await writeVhdlLabState({
        ...nextState,
        acceptedArtifacts: [
          {
            id: id('accepted_rtl', `${finalRun.id}:${acceptedPath}`),
            runId: finalRun.id,
            contractId: contract.id,
            contractHash: contract.contractHash,
            entityName: contract.entityName,
            artifactPath: acceptedPath,
            acceptedTestbenchPath: acceptedTestbenchPath || null,
            verificationStrength,
            simulationRequired: Boolean(profile.simulationRequired),
            passMarkerRequired: Boolean(profile.passMarkerRequired),
            contentHash: sha256(acceptedVhdl),
            createdAt: nowIso(),
          },
          ...nextState.acceptedArtifacts,
        ],
      });
    }
    return getVhdlLabWorkerSnapshot();
  } catch (error: any) {
    vhdlLabWorkerState.lastError = String(error?.message || error);
    if (vhdlLabWorkerState.currentRunId) {
      const runId = vhdlLabWorkerState.currentRunId;
      await updateVhdlLabRun(runId, (run) => ({
        ...appendRunLog(run, 'worker_runtime_error', 'FAILED', vhdlLabWorkerState.lastError || 'Worker failed.'),
        completedAt: nowIso(),
      }));
    }
    return getVhdlLabWorkerSnapshot();
  } finally {
    vhdlLabWorkerState.running = false;
    vhdlLabWorkerState.currentRunId = null;
  }
}

export async function createVhdlLabContract(params: {
  name: string;
  taskFamily: string;
  contractJson: VhdlContractDocument;
  sourceType?: VhdlLabHardwareContract['sourceType'];
  sourceReference?: string | null;
}) {
  const validation = validateVhdlContractDocument(params.contractJson);
  if (!validation.ok) return validation;
  const state = await readVhdlLabState();
  const at = nowIso();
  const contract: VhdlLabHardwareContract = {
    id: id('contract', `${params.name}:${validation.hash}`),
    name: params.name,
    version: 1,
    status: 'VALIDATED',
    taskFamily: params.taskFamily,
    entityName: validation.contract.entity.name,
    contractJson: validation.contract,
    contractHash: validation.hash,
    sourceType: params.sourceType || 'user',
    sourceReference: params.sourceReference || null,
    holdoutGroup: null,
    isBenchmarkHoldout: false,
    createdBy: 'local_user',
    createdAt: at,
    updatedAt: at,
  };
  const nextState = { ...state, contracts: [contract, ...state.contracts.filter((entry) => entry.id !== contract.id)] };
  await writeVhdlLabState(nextState);
  await fs.writeFile(path.join(vhdlLabPaths().contractsDrafts, `${contract.id}.json`), `${JSON.stringify(contract, null, 2)}\n`);
  return { ok: true as const, contract };
}

export async function freezeVhdlLabContract(contractId: string) {
  const state = await readVhdlLabState();
  const contract = state.contracts.find((entry) => entry.id === contractId);
  if (!contract) return { ok: false as const, issues: [{ code: 'contract_not_found', path: '$.id', message: `No contract found for ${contractId}.` }] };
  const validation = validateVhdlContractDocument(contract.contractJson);
  if (!validation.ok) return validation;
  const frozen = { ...contract, status: 'FROZEN' as const, contractHash: validation.hash, updatedAt: nowIso() };
  await writeVhdlLabState({ ...state, contracts: state.contracts.map((entry) => entry.id === contractId ? frozen : entry) });
  const frozenPath = path.join(vhdlLabPaths().contractsFreezes, `${frozen.id}.${frozen.contractHash}.json`);
  await fs.writeFile(frozenPath, `${JSON.stringify(frozen, null, 2)}\n`);
  await fs.writeFile(`${frozenPath}.sha256`, `${sha256(await fs.readFile(frozenPath))}  ${path.basename(frozenPath)}\n`);
  return { ok: true as const, contract: frozen, frozenPath };
}

export async function createVhdlLabRun(params: {
  contractId: string;
  modelProfileId?: string | null;
  promptVersionId?: string | null;
  runType?: VhdlLabGenerationRun['runType'];
  candidateCount?: number;
  maxRepairAttempts?: number;
  idempotencyKey?: string;
  benchmarkSuiteId?: string | null;
  datasetReleaseId?: string | null;
  promptVersionIds?: string[];
  seedList?: number[];
  metrics?: Record<string, unknown>;
}) {
  const state = await readVhdlLabState();
  const contract = state.contracts.find((entry) => entry.id === params.contractId);
  if (!contract) return { ok: false as const, error: `No contract found for ${params.contractId}.` };
  const verificationProfile = state.verificationProfiles.find((entry) => entry.enabled) || defaultVhdlLabState().verificationProfiles[0];
  const runId = id('run', params.idempotencyKey || `${params.contractId}:${Date.now()}`);
  const workspacePath = path.join(vhdlLabPaths().runs, runId);
  await fs.mkdir(path.join(workspacePath, 'requests'), { recursive: true });
  await fs.mkdir(path.join(workspacePath, 'raw-responses'), { recursive: true });
  await fs.mkdir(path.join(workspacePath, 'generated', 'rtl'), { recursive: true });
  await fs.mkdir(path.join(workspacePath, 'generated', 'testbench'), { recursive: true });
  await fs.mkdir(path.join(workspacePath, 'logs'), { recursive: true });
  await fs.mkdir(path.join(workspacePath, 'diagnostics'), { recursive: true });
  const at = nowIso();
  const run: VhdlLabGenerationRun = {
    id: runId,
    contractId: contract.id,
    modelProfileId: params.modelProfileId || null,
    promptVersionId: params.promptVersionId || state.promptTemplates[0]?.currentVersionId || null,
    verificationProfileId: verificationProfile.id,
    runType: params.runType || 'RTL_GENERATION',
    status: 'QUEUED',
    seed: 42,
    temperature: 0,
    maxTokens: 8192,
    candidateCount: Math.max(1, Math.min(5, params.candidateCount || 1)),
    maxRepairAttempts: Math.max(0, Math.min(10, params.maxRepairAttempts ?? 3)),
    workspacePath,
    currentStage: 'queued',
    stageLog: [{ at, stage: 'queued', status: 'QUEUED', message: 'Run queued for local worker execution.' }],
    benchmarkSuiteId: params.benchmarkSuiteId || null,
    datasetReleaseId: params.datasetReleaseId || null,
    promptVersionIds: params.promptVersionIds || (params.promptVersionId ? [params.promptVersionId] : []),
    seedList: params.seedList || [42],
    metrics: params.metrics || {},
    repairAuditPath: path.join(workspacePath, 'repair-audit.json'),
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    createdAt: at,
  };
  await fs.writeFile(path.join(workspacePath, 'manifest.json'), `${JSON.stringify({ run, contract }, null, 2)}\n`);
  await fs.writeFile(run.repairAuditPath!, `${JSON.stringify({ runId: run.id, packets: [] }, null, 2)}\n`);
  await writeVhdlLabState({ ...state, runs: [run, ...state.runs.filter((entry) => entry.id !== run.id)] });
  return { ok: true as const, run };
}

export async function cancelVhdlLabRun(runId: string) {
  const state = await readVhdlLabState();
  let found = false;
  const cancelledAt = nowIso();
  const runs = state.runs.map((run) => {
    if (run.id !== runId) return run;
    found = true;
    return {
      ...run,
      status: 'CANCELLED' as const,
      currentStage: 'cancelled',
      cancelledAt,
      completedAt: run.completedAt || cancelledAt,
      stageLog: [...run.stageLog, { at: cancelledAt, stage: 'cancelled', status: 'CANCELLED', message: 'Cancellation requested by user.' }],
    };
  });
  if (!found) return { ok: false as const, error: `No run found for ${runId}.` };
  await writeVhdlLabState({ ...state, runs });
  return { ok: true as const, run: runs.find((run) => run.id === runId)! };
}

function jsonl(values: unknown[]) {
  return values.map((value) => JSON.stringify(value)).join('\n') + (values.length ? '\n' : '');
}

function containsLikelySecret(value: string) {
  return /\b(api[_-]?key|password|secret|token|bearer|github_pat_)\b/i.test(value);
}

function validateDatasetTrainingRecord(record: any) {
  const completion = typeof record?.completion === 'string' ? record.completion : '';
  if (!completion.trim()) return { ok: false as const, reason: 'empty_assistant_completion' };
  try {
    const normalized = normalizeMlxTrainingRecord(record);
    const messages = Array.isArray(normalized.messages) ? normalized.messages : [];
    const hasUser = messages.some((message: any) => message.role === 'user' && typeof message.content === 'string' && message.content.trim());
    const final = messages[messages.length - 1];
    const hasAssistant = final?.role === 'assistant' && typeof final.content === 'string' && final.content.trim();
    if (!hasUser || !hasAssistant) return { ok: false as const, reason: 'malformed_chat_record' };
    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: 'malformed_chat_record' };
  }
}

async function writeJsonlFile(filePath: string, values: unknown[]) {
  const content = jsonl(values);
  await fs.writeFile(filePath, content);
  return sha256(content);
}

export async function buildVhdlLabDatasetRelease(params: {
  name?: string;
  sourceRunIds?: string[];
  sourceType?: VhdlLabDatasetSource;
  maxLibraryRecords?: number;
} = {}) {
  await ensureVhdlLabStorage();
  const state = await readVhdlLabState();
  const sourceType = params.sourceType || 'accepted_artifacts';
  const selectedArtifacts = state.acceptedArtifacts.filter((artifact: any) => {
    if (!params.sourceRunIds?.length) return true;
    return params.sourceRunIds.includes(artifact.runId);
  });
  let records: any[] = [];
  const audit: Record<string, unknown> = {
    sourceType,
    acceptedArtifacts: { excludedSecrets: 0, missingArtifacts: 0, excludedUnverified: 0, includedRecords: 0 },
    verified10k: null,
    excludedMalformedTrainingRecords: 0,
    excludedEmptyAssistantCompletions: 0,
  };
  if (sourceType === 'accepted_artifacts' || sourceType === 'mixed_accepted_and_verified_10k') {
    const acceptedAudit = audit.acceptedArtifacts as Record<string, number>;
    for (const artifact of selectedArtifacts) {
      const contract = state.contracts.find((entry) => entry.id === artifact.contractId);
      if (!contract) {
        acceptedAudit.excludedUnverified += 1;
        continue;
      }
      let vhdlContent = '';
      try {
        vhdlContent = await fs.readFile(artifact.artifactPath, 'utf8');
      } catch {
        acceptedAudit.missingArtifacts += 1;
        continue;
      }
      const payload = `${stableJson(contract.contractJson)}\n${vhdlContent}`;
      if (containsLikelySecret(payload)) {
        acceptedAudit.excludedSecrets += 1;
        continue;
      }
      records.push({
        id: id('dataset_record', `${artifact.id}:${artifact.contentHash}`),
        recordType: 'contract_to_accepted_rtl',
        contractId: contract.id,
        contractHash: contract.contractHash,
        contentHash: artifact.contentHash || sha256(normalizeVhdlContentForHash(vhdlContent)),
        entityName: contract.entityName,
        taskFamily: contract.taskFamily,
        category: contract.taskFamily,
        prompt: {
          contractJson: contract.contractJson,
          instruction: `Generate one complete VHDL-2008 RTL file for entity ${contract.entityName}.`,
        },
        completion: vhdlContent,
        artifactId: artifact.id,
        runId: artifact.runId,
        verificationStrength: 'ghdl_simulation',
        evaluationOnly: Boolean(contract.isBenchmarkHoldout),
        createdAt: nowIso(),
      });
      acceptedAudit.includedRecords += 1;
    }
  }
  if (sourceType === 'verified_10k_blocks' || sourceType === 'mixed_accepted_and_verified_10k') {
    const verified = await buildVerifiedVhdlLibraryTrainingRecords({
      maxRecords: params.maxLibraryRecords,
      nowIso,
      sha256,
      containsSecret: containsLikelySecret,
    });
    audit.verified10k = verified.audit;
    records.push(...verified.records);
  }
  records = records.filter((record) => {
    const validation = validateDatasetTrainingRecord(record);
    if (validation.ok) return true;
    if (validation.reason === 'empty_assistant_completion') (audit.excludedEmptyAssistantCompletions as number) += 1;
    else (audit.excludedMalformedTrainingRecords as number) += 1;
    return false;
  });
  const deduplicated = deduplicateVhdlTrainingRecords(records, sha256);
  records = deduplicated.records;
  audit.exactDuplicateRecordsRemoved = deduplicated.removedCount;
  audit.exactDuplicateGroups = deduplicated.duplicateGroups;
  audit.evaluationOnlyDuplicateConflicts = deduplicated.evaluationOnlyConflicts;
  const datasetId = id('dataset', `${params.name || 'dataset'}:${records.map((record) => record.id).join(':')}`);
  const datasetPath = path.join(vhdlLabPaths().datasets, datasetId);
  await fs.mkdir(datasetPath, { recursive: true });
  const train = records.filter((record) => assignVhdlQualityDatasetSplit(record, sha256) === 'train');
  const validation = records.filter((record) => assignVhdlQualityDatasetSplit(record, sha256) === 'validation');
  const test = records.filter((record) => assignVhdlQualityDatasetSplit(record, sha256) === 'test');
  const holdout = records.filter((record) => assignVhdlQualityDatasetSplit(record, sha256) === 'holdout');
  const overlapAudit = auditVhdlQualitySplitOverlaps({ train, validation, test, holdout });
  const qualityGate = validateVhdlQualityDatasetMinimums({
    total: records.length,
    trainCount: train.length,
    validationCount: validation.length,
    testCount: test.length,
    holdoutCount: holdout.length,
    overlapAudit,
  });
  const crossSplitOverlapCount = [
    overlapAudit.trainValidationOverlap,
    overlapAudit.trainTestOverlap,
    overlapAudit.trainHoldoutOverlap,
    overlapAudit.validationTestOverlap,
    overlapAudit.validationHoldoutOverlap,
    overlapAudit.testHoldoutOverlap,
  ].reduce((sum, value) => sum + value, 0);
  Object.assign(audit, overlapAudit, {
    qualityGateIssues: qualityGate.qualityGateIssues,
    qualityGatePassed: qualityGate.ok,
    minimumTrain: qualityGate.minimumTrain,
    minimumEvaluationSplit: qualityGate.minimumEvaluationSplit,
    crossSplitOverlapCount,
  });
  const manifestPath = path.join(datasetPath, 'manifest.json');
  const hashes = {
    records: await writeJsonlFile(path.join(datasetPath, 'records.jsonl'), records),
    train: await writeJsonlFile(path.join(datasetPath, 'train.jsonl'), train),
    validation: await writeJsonlFile(path.join(datasetPath, 'validation.jsonl'), validation),
    test: await writeJsonlFile(path.join(datasetPath, 'test.jsonl'), test),
    holdout: await writeJsonlFile(path.join(datasetPath, 'holdout.jsonl'), holdout),
  };
  await fs.writeFile(path.join(datasetPath, 'audit.json'), `${JSON.stringify(audit, null, 2)}\n`);
  const release: VhdlLabDatasetRelease = {
    id: datasetId,
    schemaVersion: 2,
    status: records.length > 0 && qualityGate.ok && crossSplitOverlapCount === 0 ? 'BUILT' : 'AUDIT_FAILED',
    name: params.name || `Dataset ${new Date().toISOString()}`,
    recordCount: records.length,
    trainCount: train.length,
    validationCount: validation.length,
    testCount: test.length,
    holdoutCount: holdout.length,
    manifestPath,
    datasetPath,
    sourceRunIds: [...new Set(records.map((record) => record.runId))],
    sourceArtifactIds: records.map((record) => record.artifactId),
    createdAt: nowIso(),
    frozenAt: nowIso(),
    audit,
  };
  await fs.writeFile(manifestPath, `${JSON.stringify({
    release,
    schemaVersion: 2,
    splits: { train: train.length, validation: validation.length, test: test.length, holdout: holdout.length },
    hashes,
    auditSummary: {
      exactDuplicateRecordsRemoved: deduplicated.removedCount,
      exactDuplicateGroups: deduplicated.duplicateGroups,
      crossSplitOverlapCount,
      qualityGatePassed: qualityGate.ok,
    },
  }, null, 2)}\n`);
  await writeVhdlLabState({ ...state, datasetReleases: [release, ...state.datasetReleases.filter((entry) => entry.id !== release.id)] });
  return { ok: release.status === 'BUILT', release, records };
}

function suiteContractIds(state: VhdlLabState, suiteId: string, explicitContractIds?: string[]) {
  if (explicitContractIds?.length) return explicitContractIds;
  if (suiteId === 'sweep_5_designs') {
    const presetRefs = new Set(buildVhdlLabSweepPresetContracts().map((preset) => preset.id));
    return state.contracts.filter((contract) => contract.sourceType === 'fixture' && contract.sourceReference && presetRefs.has(contract.sourceReference)).map((contract) => contract.id).slice(0, 5);
  }
  if (suiteId === 'adapter_promotion_holdout') {
    return state.contracts
      .filter((contract) => contract.isBenchmarkHoldout || contract.holdoutGroup)
      .map((contract) => contract.id);
  }
  if (suiteId === 'holdout_regression_contracts') return state.contracts.filter((contract) => contract.isBenchmarkHoldout).map((contract) => contract.id);
  return state.contracts.slice(0, 5).map((contract) => contract.id);
}

export async function queueVhdlLabBenchmark(params: {
  suiteId?: string;
  contractIds?: string[];
  modelProfileId?: string | null;
  promptVersionId?: string | null;
  seedList?: number[];
  maxRepairAttempts?: number;
}) {
  await ensureVhdlLabStorage();
  let state = await readVhdlLabState();
  const suiteId = params.suiteId || 'smoke_core_contracts';
  const contractIds = suiteContractIds(state, suiteId, params.contractIds);
  if (contractIds.length === 0) return { ok: false as const, error: `No contracts are available for benchmark suite ${suiteId}. Create selected preset contracts first.` };
  const benchmarkNonce = `${nowIso()}:${Math.random()}`;
  const benchmarkId = id('benchmark', `${suiteId}:${contractIds.join(':')}:${params.promptVersionId || ''}:${params.modelProfileId || ''}:${benchmarkNonce}`);
  const benchmarkPath = path.join(vhdlLabPaths().benchmarks, benchmarkId);
  await fs.mkdir(benchmarkPath, { recursive: true });
  const seedList = params.seedList?.length ? params.seedList : [42];
  const childRunIds: string[] = [];
  for (const contractId of contractIds) {
    for (const seed of seedList) {
      const runResult = await createVhdlLabRun({
        contractId,
        modelProfileId: params.modelProfileId || null,
        promptVersionId: params.promptVersionId || null,
        runType: 'BENCHMARK',
        maxRepairAttempts: params.maxRepairAttempts ?? 3,
        idempotencyKey: `${benchmarkId}:${contractId}:${seed}`,
        benchmarkSuiteId: suiteId,
        seedList: [seed],
        metrics: { benchmarkId, seed },
      });
      if (runResult.ok) childRunIds.push(runResult.run.id);
    }
  }
  state = await readVhdlLabState();
  const benchmark: VhdlLabBenchmarkRun = {
    id: benchmarkId,
    suiteId,
    status: 'QUEUED',
    contractIds,
    childRunIds,
    modelProfileId: params.modelProfileId || null,
    promptVersionId: params.promptVersionId || null,
    seedList,
    maxRepairAttempts: params.maxRepairAttempts ?? 3,
    summary: { queuedRuns: childRunIds.length, passed: 0, failed: 0, failureCategories: {} },
    resultPath: path.join(benchmarkPath, 'summary.json'),
    createdAt: nowIso(),
    completedAt: null,
  };
  await fs.writeFile(benchmark.resultPath, `${JSON.stringify(benchmark, null, 2)}\n`);
  await writeVhdlLabState({ ...state, benchmarkRuns: [benchmark, ...(state.benchmarkRuns || []).filter((entry) => entry.id !== benchmark.id)] });
  return { ok: true as const, benchmark };
}

export async function finalizeVhdlLabBenchmarks() {
  await ensureVhdlLabStorage();
  const state = await readVhdlLabState();
  let changed = false;
  const terminalStatuses = new Set(['ACCEPTED', 'FAILED', 'CANCELLED', 'QUARANTINED']);
  const activeRunId = vhdlLabWorkerState.running ? vhdlLabWorkerState.currentRunId : null;
  const interruptedStatuses = new Set([
    'PREPARING',
    'GENERATING',
    'EXTRACTING',
    'VALIDATING_INTERFACE',
    'VALIDATING_DEPENDENCIES',
    'ANALYZING',
    'ELABORATING',
    'SYNTHESIZING',
    'GENERATING_TESTBENCH',
    'SIMULATING',
    'MUTATION_TESTING',
    'REPAIRING',
  ]);
  const benchmarkChildRunIds = new Set((state.benchmarkRuns || []).flatMap((benchmark) => benchmark.childRunIds || []));
  let runsChanged = false;
  const runs = state.runs.map((run) => {
    if (!benchmarkChildRunIds.has(run.id) || run.id === activeRunId || !interruptedStatuses.has(run.status)) return run;
    runsChanged = true;
    return {
      ...appendRunLog(
        run,
        run.currentStage || 'interrupted',
        'FAILED',
        'run_interrupted: this benchmark child run was interrupted before completion, usually by an app restart. Queue a new benchmark to retry with the current code.',
      ),
      completedAt: run.completedAt || nowIso(),
    };
  });
  if (runsChanged) changed = true;
  const benchmarkRuns = await Promise.all((state.benchmarkRuns || []).map(async (benchmark) => {
    const childRuns = benchmark.childRunIds
      .map((runId) => runs.find((run) => run.id === runId))
      .filter(Boolean) as VhdlLabGenerationRun[];
    if (
      childRuns.length === 0
      && benchmark.status === 'RUNNING'
      && benchmark.suiteId.startsWith('checkpoint_adapter_generation')
      && !activeVhdlLabCheckpointBenchmarks.has(benchmark.id)
    ) {
      changed = true;
      const results = Array.isArray(benchmark.summary?.results) ? benchmark.summary.results as Array<{ passed?: boolean }> : [];
      const total = Number(benchmark.summary?.total || benchmark.contractIds.length || results.length || 0);
      const passed = results.filter((result) => result?.passed === true).length;
      const explicitFailed = results.filter((result) => result?.passed === false).length;
      const interrupted = Math.max(0, total - passed - explicitFailed);
      const failed = explicitFailed + interrupted;
      const summary = {
        ...benchmark.summary,
        total,
        passed,
        failed,
        running: 0,
        passRate: total ? passed / total : 0,
        interrupted,
        interruptedReason: 'adapter_benchmark_interrupted_by_restart',
      };
      const next = { ...benchmark, status: failed > 0 ? 'FAILED' as const : 'COMPLETED' as const, completedAt: benchmark.completedAt || nowIso(), summary };
      await fs.mkdir(path.dirname(next.resultPath), { recursive: true });
      await fs.writeFile(next.resultPath, `${JSON.stringify(next, null, 2)}\n`);
      return next;
    }
    if (childRuns.length === 0) return benchmark;
    const passed = childRuns.filter((run) => run.status === 'ACCEPTED').length;
    const failed = childRuns.filter((run) => run.status === 'FAILED').length;
    const cancelled = childRuns.filter((run) => run.status === 'CANCELLED').length;
    const running = childRuns.filter((run) => !terminalStatuses.has(run.status)).length;
    const failureCategories = childRuns
      .filter((run) => run.status === 'FAILED')
      .reduce((acc: Record<string, number>, run) => {
        const latest = run.stageLog?.[run.stageLog.length - 1];
        const category = classifyVhdlLabFailure({ stage: latest?.stage || run.currentStage, message: latest?.message || '' });
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});
    const summary = {
      ...benchmark.summary,
      total: childRuns.length,
      passed,
      failed,
      cancelled,
      running,
      passRate: childRuns.length ? passed / childRuns.length : 0,
      failureCategories,
    };
    const nextStatus: VhdlLabBenchmarkRun['status'] = running > 0 ? 'RUNNING' : failed > 0 || cancelled > 0 ? 'FAILED' : 'COMPLETED';
    const completedAt = running > 0 ? null : (benchmark.completedAt || nowIso());
    if (benchmark.status !== nextStatus || benchmark.completedAt !== completedAt || stableJson(benchmark.summary) !== stableJson(summary)) changed = true;
    const next = { ...benchmark, status: nextStatus, completedAt, summary };
    if (changed) {
      await fs.mkdir(path.dirname(next.resultPath), { recursive: true });
      await fs.writeFile(next.resultPath, `${JSON.stringify(next, null, 2)}\n`);
    }
    return next;
  }));
  if (changed) await writeVhdlLabState({ ...state, runs, benchmarkRuns });
  return { ok: true as const, benchmarkRuns };
}

export async function createVhdlLabPromptOptimization(params: { promptTemplateId: string; failureClusterId?: string | null; changeReason?: string }) {
  const state = await readVhdlLabState();
  const template = state.promptTemplates.find((entry) => entry.id === params.promptTemplateId);
  if (!template) return { ok: false as const, error: `Prompt template ${params.promptTemplateId} was not found.` };
  const active = state.promptVersions.find((entry) => entry.id === template.currentVersionId) || state.promptVersions.find((entry) => entry.templateId === template.id);
  if (!active) return { ok: false as const, error: `Prompt template ${template.id} has no base version.` };
  const cluster = params.failureClusterId ? state.failureClusters.find((entry) => entry.id === params.failureClusterId || entry.signature === params.failureClusterId) : state.failureClusters[0];
  const versionNumber = Math.max(0, ...state.promptVersions.filter((entry) => entry.templateId === template.id).map((entry) => entry.versionNumber)) + 1;
  const candidate: VhdlLabPromptVersion = {
    ...active,
    id: id('prompt_version', `${template.id}:${versionNumber}:${cluster?.signature || 'manual'}`),
    versionNumber,
    parentVersionId: active.id,
    status: 'CANDIDATE',
    systemPrompt: [
      active.systemPrompt,
      '',
      'Evidence-guided repair guidance:',
      cluster ? `Avoid recurring ${cluster.category}: ${cluster.normalizedMessage}` : 'Preserve frozen interfaces and produce self-contained GHDL-safe VHDL.',
    ].join('\n'),
    changeReason: params.changeReason || `Candidate from ${cluster ? `failure cluster ${cluster.signature}` : 'manual optimization request'}.`,
    triggerFailureClusterId: cluster?.id || null,
    promotedAt: null,
    rejectedAt: null,
    metrics: {},
    createdAt: nowIso(),
  };
  candidate.promptHash = sha256(`${candidate.systemPrompt}\n${candidate.userPromptTemplate}`);
  await writeVhdlLabState({ ...state, promptVersions: [candidate, ...state.promptVersions] });
  return { ok: true as const, promptVersion: candidate };
}

export async function promoteVhdlLabPromptVersion(promptVersionId: string) {
  const state = await readVhdlLabState();
  const candidate = state.promptVersions.find((entry) => entry.id === promptVersionId);
  if (!candidate) return { ok: false as const, error: `Prompt version ${promptVersionId} was not found.` };
  const at = nowIso();
  const promptVersions = state.promptVersions.map((entry) => {
    if (entry.templateId !== candidate.templateId) return entry;
    if (entry.id === candidate.id) return { ...entry, status: 'ACTIVE' as const, promotedAt: at, rejectedAt: null };
    return entry.status === 'ACTIVE' ? { ...entry, status: 'ARCHIVED' as const } : entry;
  });
  const promptTemplates = state.promptTemplates.map((entry) => entry.id === candidate.templateId ? { ...entry, currentVersionId: candidate.id, updatedAt: at } : entry);
  await writeVhdlLabState({ ...state, promptVersions, promptTemplates });
  return { ok: true as const, promptVersion: promptVersions.find((entry) => entry.id === candidate.id) };
}

export async function rejectVhdlLabPromptVersion(promptVersionId: string) {
  const state = await readVhdlLabState();
  const found = state.promptVersions.some((entry) => entry.id === promptVersionId);
  if (!found) return { ok: false as const, error: `Prompt version ${promptVersionId} was not found.` };
  const promptVersions = state.promptVersions.map((entry) => entry.id === promptVersionId ? { ...entry, status: 'REJECTED' as const, rejectedAt: nowIso() } : entry);
  await writeVhdlLabState({ ...state, promptVersions });
  return { ok: true as const, promptVersion: promptVersions.find((entry) => entry.id === promptVersionId) };
}

export async function queueVhdlLabPromptAbTest(params: {
  baselinePromptVersionId: string;
  candidatePromptVersionIds?: string[];
  contractIds?: string[];
  modelProfileId?: string | null;
  seedList?: number[];
  maxRepairAttempts?: number;
}) {
  const state = await readVhdlLabState();
  const baseline = state.promptVersions.find((entry) => entry.id === params.baselinePromptVersionId);
  if (!baseline) return { ok: false as const, error: `Prompt version ${params.baselinePromptVersionId} was not found.` };
  const candidates = params.candidatePromptVersionIds?.length
    ? params.candidatePromptVersionIds
    : state.promptVersions.filter((entry) => entry.templateId === baseline.templateId && entry.status === 'CANDIDATE').map((entry) => entry.id);
  const promptVersionIds = [baseline.id, ...candidates.filter((entry) => entry !== baseline.id)];
  if (promptVersionIds.length < 2) return { ok: false as const, error: 'Prompt A/B test requires a baseline plus at least one candidate prompt version.' };
  const benchmarkResults = [];
  for (const promptVersionId of promptVersionIds) {
    benchmarkResults.push(await queueVhdlLabBenchmark({
      suiteId: 'prompt_ab_test',
      contractIds: params.contractIds,
      modelProfileId: params.modelProfileId || null,
      promptVersionId,
      seedList: params.seedList || [42],
      maxRepairAttempts: params.maxRepairAttempts ?? 3,
    }));
  }
  const ok = benchmarkResults.every((entry) => entry.ok);
  return { ok, promptVersionIds, benchmarkResults };
}

export async function getVhdlLabMlxLmAvailability() {
  if (process.env.VHDL_LAB_MLX_LORA_COMMAND) {
    return { available: true, source: 'path' as const, command: process.env.VHDL_LAB_MLX_LORA_COMMAND };
  }
  const projectLocalMlxLora = path.resolve(process.cwd(), '.venv', 'bin', 'mlx_lm.lora');
  if (process.env.VHDL_LAB_ENABLE_PROJECT_MLX !== 'false') {
    try {
      await fs.access(projectLocalMlxLora);
      return { available: true, source: 'project_venv' as const, command: projectLocalMlxLora };
    } catch {
      // Fall back to PATH-based discovery below.
    }
  }
  try {
    const { stdout } = await execFileAsync('which', ['mlx_lm.lora'], { timeout: 5000 });
    return { available: true, source: 'path' as const, command: stdout.trim() || 'mlx_lm.lora' };
  } catch {
    return { available: false, source: 'missing' as const, command: null as string | null };
  }
}

async function isMlxLmAvailable() {
  return (await getVhdlLabMlxLmAvailability()).available;
}

function numericTrainingConfig(config: Record<string, unknown>, key: string, fallback: number, min: number, max: number) {
  const value = Number(config[key]);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function stringTrainingConfig(config: Record<string, unknown>, key: string, fallback: string) {
  const value = config[key];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function mlXPromptTextFromRecord(record: any) {
  if (typeof record.prompt === 'string') return record.prompt;
  const instruction = typeof record.prompt?.instruction === 'string'
    ? record.prompt.instruction
    : `Generate one complete VHDL-2008 RTL file${record.entityName ? ` for entity ${record.entityName}` : ''}.`;
  const contractJson = record.prompt?.contractJson || record.contractJson || null;
  return [
    instruction,
    '',
    'Frozen hardware contract JSON:',
    contractJson ? stableJson(contractJson) : stableJson(record.prompt || {}),
  ].join('\n');
}

function normalizeMlxTrainingRecord(record: any) {
  if (Array.isArray(record?.messages)) {
    return {
      messages: record.messages.map((message: any) => ({
        role: typeof message?.role === 'string' ? message.role : 'user',
        content: typeof message?.content === 'string' ? message.content : stableJson(message?.content ?? ''),
      })),
    };
  }
  if (typeof record?.text === 'string') return { text: record.text };
  return {
    messages: [
      {
        role: 'system',
        content: 'You generate synthesizable VHDL-2008 that preserves the frozen entity interface and passes the provided verification contract.',
      },
      {
        role: 'user',
        content: mlXPromptTextFromRecord(record),
      },
      {
        role: 'assistant',
        content: typeof record?.completion === 'string' ? record.completion : stableJson(record?.completion ?? ''),
      },
    ],
  };
}

function normalizeMlxTrainingJsonl(content: string) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.stringify(normalizeMlxTrainingRecord(JSON.parse(line))))
    .join('\n') + '\n';
}

function countNonEmptyJsonlRecords(content: string) {
  return content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).length;
}

async function requireNonEmptyTrainingSplit(sourcePath: string, destinationPath: string, splitName: string) {
  const content = await fs.readFile(sourcePath, 'utf8').catch(() => '');
  if (!content.trim()) throw new Error(`Quality training requires a non-empty ${splitName} split.`);
  const normalized = normalizeMlxTrainingJsonl(content);
  if (countNonEmptyJsonlRecords(normalized) < 1) throw new Error(`Quality training requires at least one valid ${splitName} record.`);
  await fs.writeFile(destinationPath, normalized);
}

export async function prepareMlxTrainingDataset(release: VhdlLabDatasetRelease, outputPath: string) {
  if (release.schemaVersion !== 2) {
    throw new Error('This dataset release predates isolated quality-training splits. Rebuild the dataset to create independent train, validation, test, and promotion-holdout splits.');
  }
  if (release.status !== 'BUILT') throw new Error('Dataset does not meet quality minimum record counts.');
  const trainSource = path.join(release.datasetPath, 'train.jsonl');
  const validationSource = path.join(release.datasetPath, 'validation.jsonl');
  const testSource = path.join(release.datasetPath, 'test.jsonl');
  const holdoutSource = path.join(release.datasetPath, 'holdout.jsonl');
  const dataPath = path.join(outputPath, 'mlx-data');
  await fs.mkdir(dataPath, { recursive: true });
  await requireNonEmptyTrainingSplit(trainSource, path.join(dataPath, 'train.jsonl'), 'train');
  await requireNonEmptyTrainingSplit(validationSource, path.join(dataPath, 'valid.jsonl'), 'validation');
  await requireNonEmptyTrainingSplit(testSource, path.join(dataPath, 'test.jsonl'), 'test');
  const holdoutContent = await fs.readFile(holdoutSource, 'utf8').catch(() => '');
  if (!holdoutContent.trim()) throw new Error('Promotion holdout is missing or empty.');
  return dataPath;
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

async function hashFile(filePath: string) {
  return sha256(await fs.readFile(filePath));
}

async function copyFileWithHash(sourcePath: string, destinationPath: string) {
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.copyFile(sourcePath, destinationPath);
  return hashFile(destinationPath);
}

async function runLoggedMlxProcess(params: {
  trainingRunId: string;
  command: string;
  args: string[];
  cwd: string;
  logPath: string;
  env: NodeJS.ProcessEnv;
}): Promise<{
  code: number | null;
  signal: NodeJS.Signals | null;
}> {
  await fs.appendFile(params.logPath, `Command: ${shellQuote(params.command)} ${params.args.map(shellQuote).join(' ')}\n`);
  return await new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      activeVhdlLabTrainingProcesses.delete(params.trainingRunId);
      callback();
    };
    const child = spawn(params.command, params.args, { cwd: params.cwd, env: params.env });
    activeVhdlLabTrainingProcesses.set(params.trainingRunId, child);
    child.stdout.on('data', (chunk) => {
      void fs.appendFile(params.logPath, chunk);
    });
    child.stderr.on('data', (chunk) => {
      void fs.appendFile(params.logPath, chunk);
    });
    child.on('error', (error) => {
      void fs.appendFile(params.logPath, `\nMLX process failed to start: ${error.message}\n`);
      finish(() => reject(error));
    });
    child.on('close', (code, signal) => {
      finish(() => resolve({ code, signal }));
    });
  });
}

async function materializeBestAdapter(params: {
  trainingRunId: string;
  outputPath: string;
  adapterPath: string;
  logPath: string;
  resolvedConfigPath: string;
  metrics: ReturnType<typeof parseMlxTrainingMetrics>;
}) {
  const selection = await selectBestMlxAdapterCandidate({
    adapterDirectory: params.adapterPath,
    validationMetrics: params.metrics.validation,
  });
  const bestAdapterPath = path.join(params.outputPath, 'best-adapter');
  await fs.mkdir(bestAdapterPath, { recursive: true });
  const weightsSha256 = await copyFileWithHash(selection.selectedSourcePath, path.join(bestAdapterPath, 'adapters.safetensors'));
  const adapterConfigPath = path.join(params.adapterPath, 'adapter_config.json');
  const adapterConfigSha256 = await copyFileWithHash(adapterConfigPath, path.join(bestAdapterPath, 'adapter_config.json')).catch(async () => {
    const fallbackConfig = `${JSON.stringify({ adapterType: 'lora', generatedBy: 'vhdl_lab_quality_v1' }, null, 2)}\n`;
    const destination = path.join(bestAdapterPath, 'adapter_config.json');
    await fs.writeFile(destination, fallbackConfig);
    return sha256(fallbackConfig);
  });
  const selectionJson = {
    trainingRunId: params.trainingRunId,
    selectedSourcePath: selection.selectedSourcePath,
    selectedIteration: selection.selectedIteration,
    selectedValidationLoss: selection.selectedValidationLoss,
    selectionReason: selection.selectionReason,
    trainingLogPath: params.logPath,
    resolvedConfigPath: params.resolvedConfigPath,
    selectedAt: nowIso(),
    weightsSha256,
    adapterConfigSha256,
  };
  await fs.writeFile(path.join(bestAdapterPath, 'selection.json'), `${JSON.stringify(selectionJson, null, 2)}\n`);
  await fs.appendFile(params.logPath, `Best adapter selection: ${selection.selectionReason}; source=${selection.selectedSourcePath}; iteration=${selection.selectedIteration ?? 'final'}; validationLoss=${selection.selectedValidationLoss ?? 'n/a'}.\n`);
  return { bestAdapterPath, selection, weightsSha256, adapterConfigSha256 };
}

async function updateVhdlLabTrainingRun(trainingRunId: string, updater: (run: VhdlLabTrainingRun, state: VhdlLabState) => { run: VhdlLabTrainingRun; checkpoint?: VhdlLabCheckpoint | null }) {
  const state = await readVhdlLabState();
  let checkpoint: VhdlLabCheckpoint | null = null;
  const trainingRuns = state.trainingRuns.map((run) => {
    if (run.id !== trainingRunId) return run;
    const result = updater(run, state);
    checkpoint = result.checkpoint || null;
    return result.run;
  });
  const checkpoints = checkpoint
    ? [checkpoint, ...(state.checkpoints || []).filter((entry) => entry.id !== checkpoint!.id)]
    : state.checkpoints || [];
  await writeVhdlLabState({ ...state, trainingRuns, checkpoints });
}

async function launchVhdlLabMlxTraining(trainingRun: VhdlLabTrainingRun, release: VhdlLabDatasetRelease, availability: Awaited<ReturnType<typeof getVhdlLabMlxLmAvailability>>) {
  if (!availability.available || !availability.command) return;
  const env = {
    ...process.env,
    PATH: `${path.resolve(process.cwd(), '.venv', 'bin')}:${process.env.PATH || ''}`,
  };
  try {
    const dataPath = await prepareMlxTrainingDataset(release, trainingRun.outputPath);
    const adapterPath = path.join(trainingRun.outputPath, 'adapter');
    const requestedConfig = (trainingRun.config?.requested as Record<string, unknown> | undefined) || trainingRun.config || {};
    const resolvedConfig = resolveVhdlQualityTrainingConfig({ trainCount: release.trainCount, overrides: requestedConfig });
    const mlxConfigPath = path.join(trainingRun.outputPath, 'mlx-lora-config.yaml');
    const resolvedConfigPath = path.join(trainingRun.outputPath, 'resolved-training-config.json');
    const mlxConfig = renderMlxLoraConfigYaml({
      model: trainingRun.baseModel,
      dataPath,
      adapterPath,
      config: resolvedConfig,
    });
    await fs.writeFile(mlxConfigPath, mlxConfig);
    const mlxConfigSha256 = sha256(mlxConfig);
    const resolvedPayload = {
      requestedConfig,
      resolvedConfig,
      datasetReleaseId: release.id,
      datasetManifestPath: release.manifestPath,
      baseModel: trainingRun.baseModel,
      trainerCommand: availability.command,
      generatedYamlPath: mlxConfigPath,
      generatedYamlSha256: mlxConfigSha256,
      createdAt: nowIso(),
    };
    await fs.writeFile(resolvedConfigPath, `${JSON.stringify(resolvedPayload, null, 2)}\n`);
    const resolvedConfigSha256 = await hashFile(resolvedConfigPath);
    const manifestSha256 = await hashFile(release.manifestPath).catch(() => null);
    await fs.appendFile(trainingRun.logPath, [
      `Starting MLX-LM LoRA quality training at ${nowIso()}`,
      `Training profile: ${resolvedConfig.profile}`,
      `Dataset release ID: ${release.id}`,
      `Dataset schema version: ${release.schemaVersion}`,
      `Train/validation/test/holdout counts: ${release.trainCount}/${release.validationCount}/${release.testCount}/${release.holdoutCount}`,
      `Base model: ${trainingRun.baseModel}`,
      `Resolved epochs: ${resolvedConfig.epochs}`,
      `Resolved iterations: ${resolvedConfig.iters}`,
      `Effective batch size: ${resolvedConfig.effectiveBatchSize}`,
      `Maximum sequence length: ${resolvedConfig.maxSeqLength}`,
      `Number of layers: ${resolvedConfig.numLayers}`,
      `LoRA rank/scale/dropout: ${resolvedConfig.loraParameters.rank}/${resolvedConfig.loraParameters.scale}/${resolvedConfig.loraParameters.dropout}`,
      `Validation interval: ${resolvedConfig.stepsPerEval}`,
      `Checkpoint interval: ${resolvedConfig.saveEvery}`,
      `YAML path: ${mlxConfigPath}`,
      `YAML hash: ${mlxConfigSha256}`,
      '',
    ].join('\n'));
    await updateVhdlLabTrainingRun(trainingRun.id, (run) => ({
      run: {
        ...run,
        status: 'RUNNING',
        startedAt: run.startedAt || nowIso(),
        error: null,
        config: {
          requested: requestedConfig,
          resolved: resolvedConfig,
          trainerCommand: availability.command,
          mlxConfigPath,
          mlxConfigSha256,
        },
      },
    }));
    const mainResult = await runLoggedMlxProcess({
      trainingRunId: trainingRun.id,
      command: availability.command,
      args: ['--config', mlxConfigPath],
      cwd: trainingRun.outputPath,
      logPath: trainingRun.logPath,
      env,
    });
    const afterMainState = await readVhdlLabState();
    const afterMainRun = afterMainState.trainingRuns.find((entry) => entry.id === trainingRun.id);
    if (afterMainRun?.status === 'CANCELLED') return;
    await fs.appendFile(trainingRun.logPath, `\nMain training process exited at ${nowIso()} with code=${mainResult.code} signal=${mainResult.signal || 'none'}.\n`);
    if (mainResult.code !== 0) {
      throw new Error(`Main training process failed. mlx_lm.lora exited with code ${mainResult.code}${mainResult.signal ? ` (${mainResult.signal})` : ''}. The quality_v1 profile did not complete with this model. The resolved configuration and full MLX log were preserved. Select a smaller quantized base model or explicitly provide a reviewed backend override; the application did not silently reduce training quality.`);
    }
    const trainingLogText = await fs.readFile(trainingRun.logPath, 'utf8');
    const trainingMetrics = parseMlxTrainingMetrics(trainingLogText);
    const best = await materializeBestAdapter({
      trainingRunId: trainingRun.id,
      outputPath: trainingRun.outputPath,
      adapterPath,
      logPath: trainingRun.logPath,
      resolvedConfigPath,
      metrics: trainingMetrics,
    });
    const testConfigPath = path.join(trainingRun.outputPath, 'best-adapter-test-config.yaml');
    const testLogPath = path.join(trainingRun.outputPath, 'best-adapter-test.log');
    const testConfig = renderMlxLoraTestConfigYaml({
      model: trainingRun.baseModel,
      dataPath,
      adapterPath: best.bestAdapterPath,
      config: resolvedConfig,
    });
    await fs.writeFile(testConfigPath, testConfig);
    await fs.writeFile(testLogPath, `Starting best-adapter isolated test evaluation at ${nowIso()}\n`);
    const testResult = await runLoggedMlxProcess({
      trainingRunId: trainingRun.id,
      command: availability.command,
      args: ['--config', testConfigPath],
      cwd: trainingRun.outputPath,
      logPath: testLogPath,
      env,
    });
    const afterTestState = await readVhdlLabState();
    const afterTestRun = afterTestState.trainingRuns.find((entry) => entry.id === trainingRun.id);
    if (afterTestRun?.status === 'CANCELLED') return;
    await fs.appendFile(trainingRun.logPath, `Best-adapter test evaluation exited at ${nowIso()} with code=${testResult.code} signal=${testResult.signal || 'none'}.\n`);
    if (testResult.code !== 0) throw new Error('Best-adapter test evaluation failed. Training completed but the selected adapter did not pass isolated test-loss evaluation.');
    const testLogText = await fs.readFile(testLogPath, 'utf8');
    const testMetrics = parseMlxTrainingMetrics(testLogText);
    if (testMetrics.testLoss === null || testMetrics.testPpl === null) throw new Error('Test loss could not be parsed. Best-adapter test evaluation failed to emit parseable Test loss and Test ppl metrics.');
    const completedAt = nowIso();
    const checkpoint = {
      id: id('checkpoint', `${trainingRun.id}:${best.bestAdapterPath}`),
      trainingRunId: trainingRun.id,
      checkpointPath: best.bestAdapterPath,
      benchmarkRunIds: [],
      status: 'CREATED' as const,
      metrics: {
        trainer: 'mlx_lm.lora',
        trainingProfile: 'quality_v1',
        exitCode: 0,
        epochs: resolvedConfig.epochs,
        iters: resolvedConfig.iters,
        trainCount: release.trainCount,
        validationCount: release.validationCount,
        testCount: release.testCount,
        holdoutCount: release.holdoutCount,
        batchSize: resolvedConfig.batchSize,
        gradAccumulationSteps: resolvedConfig.gradAccumulationSteps,
        effectiveBatchSize: resolvedConfig.effectiveBatchSize,
        maxSeqLength: resolvedConfig.maxSeqLength,
        numLayers: resolvedConfig.numLayers,
        learningRate: resolvedConfig.learningRate,
        minimumLearningRate: resolvedConfig.minimumLearningRate,
        warmupIterations: resolvedConfig.warmupIterations,
        loraRank: resolvedConfig.loraParameters.rank,
        loraScale: resolvedConfig.loraParameters.scale,
        loraDropout: resolvedConfig.loraParameters.dropout,
        bestValidationIteration: best.selection.selectedIteration,
        bestValidationLoss: best.selection.selectedValidationLoss,
        checkpointSelectionReason: best.selection.selectionReason,
        mlxHeldoutTestLoss: testMetrics.testLoss,
        mlxHeldoutTestPpl: testMetrics.testPpl,
        finalTrainLoss: trainingMetrics.finalTrainLoss,
        trainableParameterPercent: trainingMetrics.trainableParameterPercent,
        trainableParameterMillions: trainingMetrics.trainableParameterMillions,
        totalParameterMillions: trainingMetrics.totalParameterMillions,
        peakMemoryGb: trainingMetrics.peakMemoryGb,
        truncationWarningCount: trainingMetrics.truncationWarningCount,
        datasetSchemaVersion: release.schemaVersion,
        datasetManifestPath: release.manifestPath,
        datasetManifestSha256: manifestSha256,
        trainingConfigPath: mlxConfigPath,
        trainingConfigSha256: mlxConfigSha256,
        resolvedConfigPath,
        resolvedConfigSha256,
        selectedAdapterWeightsSha256: best.weightsSha256,
        adapterConfigSha256: best.adapterConfigSha256,
      },
      promotionStatus: 'LAB_ONLY' as const,
      promotionBenchmarks: [],
      fallbackPassCount: 0,
      adapterAuthoredPassCount: 0,
      qualifiedForFpgaArchitectAt: null,
      qualificationIssues: [],
      qualifiedSourceId: null,
      createdAt: completedAt,
    };
    await updateVhdlLabTrainingRun(trainingRun.id, (run) => {
      if (run.status === 'CANCELLED') return { run };
      return {
        run: {
          ...run,
          status: 'COMPLETED',
          completedAt,
          checkpointIds: [checkpoint.id, ...run.checkpointIds.filter((entry) => entry !== checkpoint.id)],
          error: null,
        },
        checkpoint,
      };
    });
  } catch (error: any) {
    await fs.appendFile(trainingRun.logPath, `\nTraining failed: ${String(error?.message || error)}\n`);
    await updateVhdlLabTrainingRun(trainingRun.id, (run) => {
      if (run.status === 'CANCELLED') return { run };
      return { run: { ...run, status: 'FAILED', completedAt: nowIso(), error: String(error?.message || error) } };
    });
  }
}

export async function createVhdlLabTrainingRun(params: { datasetReleaseId: string; baseModel?: string; adapterName?: string; config?: Record<string, unknown> }) {
  const state = await readVhdlLabState();
  const release = state.datasetReleases.find((entry) => entry.id === params.datasetReleaseId);
  if (!release || release.status !== 'BUILT') return { ok: false as const, error: `Dataset release ${params.datasetReleaseId} is not available for training.` };
  if (release.schemaVersion !== 2) return { ok: false as const, error: 'This dataset release predates isolated quality-training splits. Rebuild the dataset to create independent train, validation, test, and promotion-holdout splits.' };
  if (release.testCount < 1) return { ok: false as const, error: 'Test split is missing or empty.' };
  if (release.validationCount < 1) return { ok: false as const, error: 'Validation split is missing or empty.' };
  if (release.holdoutCount < 1) return { ok: false as const, error: 'Promotion holdout is missing or empty.' };
  const baseModel = (params.baseModel || process.env.VHDL_LAB_MLX_BASE_MODEL || '').trim();
  if (!baseModel) return { ok: false as const, error: 'Select an MLX base model or local model path before starting LoRA training.' };
  const trainingNonce = `${nowIso()}:${Math.random()}`;
  const trainingId = id('training', `${params.datasetReleaseId}:${baseModel}:${params.adapterName || 'adapter'}:${trainingNonce}`);
  const outputPath = path.join(vhdlLabPaths().training, trainingId);
  await fs.mkdir(outputPath, { recursive: true });
  const logPath = path.join(outputPath, 'training.log');
  const availability = await getVhdlLabMlxLmAvailability();
  const mlxAvailable = availability.available;
  const requestedConfig = Object.keys(params.config || {}).length ? params.config! : { profile: 'quality_v1' };
  let resolvedConfig: VhdlQualityTrainingConfig;
  try {
    resolvedConfig = resolveVhdlQualityTrainingConfig({ trainCount: release.trainCount, overrides: requestedConfig });
  } catch (error: any) {
    return { ok: false as const, error: String(error?.message || error) };
  }
  const trainingRun: VhdlLabTrainingRun = {
    id: trainingId,
    status: mlxAvailable ? 'QUEUED' : 'BLOCKED_MLX_UNAVAILABLE',
    datasetReleaseId: release.id,
    baseModel,
    adapterName: params.adapterName || `vhdl-lora-${trainingId.slice(-6)}`,
    config: { requested: requestedConfig, resolved: resolvedConfig, trainerCommand: availability.command },
    outputPath,
    logPath,
    checkpointIds: [],
    createdAt: nowIso(),
    startedAt: null,
    completedAt: mlxAvailable ? null : nowIso(),
    error: mlxAvailable ? null : 'mlx_lm.lora was not found on PATH or in the project .venv. Install MLX-LM before launching local LoRA training.',
  };
  await fs.writeFile(logPath, `${trainingRun.error || 'Queued local MLX-LM training. Execution launcher is intentionally explicit/local-only.'}\n`);
  await fs.writeFile(path.join(outputPath, 'config.json'), `${JSON.stringify({ trainingRun, datasetRelease: release }, null, 2)}\n`);
  await writeVhdlLabState({ ...state, trainingRuns: [trainingRun, ...state.trainingRuns.filter((entry) => entry.id !== trainingRun.id)] });
  if (mlxAvailable) {
    void launchVhdlLabMlxTraining(trainingRun, release, availability).catch(async (error) => {
      await fs.appendFile(logPath, `Training launch failed: ${String(error?.message || error)}\n`);
      await updateVhdlLabTrainingRun(trainingRun.id, (run) => ({
        run: { ...run, status: 'FAILED', completedAt: nowIso(), error: String(error?.message || error) },
      }));
    });
  }
  return { ok: true as const, trainingRun };
}

export async function cancelVhdlLabTrainingRun(trainingRunId: string) {
  const state = await readVhdlLabState();
  const activeProcess = activeVhdlLabTrainingProcesses.get(trainingRunId);
  if (activeProcess) {
    activeProcess.kill('SIGTERM');
    activeVhdlLabTrainingProcesses.delete(trainingRunId);
  }
  let found = false;
  const trainingRuns = state.trainingRuns.map((entry) => {
    if (entry.id !== trainingRunId) return entry;
    found = true;
    return { ...entry, status: 'CANCELLED' as const, completedAt: entry.completedAt || nowIso(), error: entry.error || 'Cancelled by user.' };
  });
  if (!found) return { ok: false as const, error: `Training run ${trainingRunId} was not found.` };
  await writeVhdlLabState({ ...state, trainingRuns });
  return { ok: true as const, trainingRun: trainingRuns.find((entry) => entry.id === trainingRunId) };
}

async function readDatasetContractIds(datasetPath: string, splitName: 'holdout' | 'validation' | 'train') {
  try {
    const text = await fs.readFile(path.join(datasetPath, `${splitName}.jsonl`), 'utf8');
    return [...new Set(text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return String(JSON.parse(line).contractId || '');
        } catch {
          return '';
        }
      })
      .filter(Boolean))];
  } catch {
    return [];
  }
}

async function readDatasetSplitRecords(datasetPath: string, splitName: 'holdout' | 'validation' | 'train') {
  try {
    const text = await fs.readFile(path.join(datasetPath, `${splitName}.jsonl`), 'utf8');
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as Record<string, unknown>;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Array<Record<string, unknown>>;
  } catch {
    return [];
  }
}

function normalizeDatasetPortMode(value: unknown): 'in' | 'out' | 'inout' | 'buffer' {
  const mode = String(value || '').trim().toLowerCase();
  if (['out', 'output'].includes(mode)) return 'out';
  if (['inout', 'bidirectional', 'bidir'].includes(mode)) return 'inout';
  if (mode === 'buffer') return 'buffer';
  return 'in';
}

function buildContractFromVerifiedDatasetRecord(record: Record<string, unknown>, now = nowIso()): VhdlLabHardwareContract | null {
  const prompt = record.prompt as Record<string, unknown> | undefined;
  const blockSpec = prompt?.blockSpec as Record<string, unknown> | undefined;
  if (!blockSpec || typeof blockSpec !== 'object') return null;
  const entityName = safeEntityName(String(record.entityName || blockSpec.entityName || blockSpec.blockName || record.blockName || 'verified_block_top'));
  const generics = Array.isArray(blockSpec.generics)
    ? (blockSpec.generics as Array<Record<string, unknown>>)
      .map((generic) => ({
        name: String(generic.name || '').trim(),
        type: normalizeType(String(generic.type || 'positive')),
        default: generic.default === undefined ? undefined : String(generic.default),
        constraints: [
          generic.minimum !== undefined ? `${String(generic.name || '').trim()} >= ${generic.minimum}` : '',
          generic.maximum !== undefined ? `${String(generic.name || '').trim()} <= ${generic.maximum}` : '',
        ].filter(Boolean),
      }))
      .filter((generic) => isLegalVhdlIdentifier(generic.name))
    : [];
  const ports = Array.isArray(blockSpec.ports)
    ? (blockSpec.ports as Array<Record<string, unknown>>)
      .map((port) => ({
        name: String(port.name || '').trim(),
        mode: normalizeDatasetPortMode(port.direction || port.mode),
        type: normalizeType(String(port.type || 'std_logic')),
        semantic_role: String(port.semantic_role || port.role || port.name || '').replace(/[^A-Za-z0-9_]+/g, '_').toLowerCase() || undefined,
      }))
      .filter((port) => isLegalVhdlIdentifier(port.name))
    : [];
  if (!ports.length) return null;
  const clockPort = ports.find((port) => /clk|clock/i.test(`${port.name}:${port.semantic_role || ''}`) && port.mode === 'in')?.name
    || ports.find((port) => port.mode === 'in')?.name
    || 'clk';
  const resetPort = ports.find((port) => /rst|reset/i.test(`${port.name}:${port.semantic_role || ''}`) && port.mode === 'in')?.name;
  const contractJson: VhdlContractDocument = {
    contract_version: '1.0',
    entity: { name: entityName, description: `Verified 10k library holdout block ${String(record.blockName || blockSpec.blockName || entityName)}.` },
    generics,
    ports,
    clocking: { domains: [{ name: 'main', clock_port: clockPort, edge: 'rising' }] },
    reset: resetPort ? { port: resetPort, polarity: 'active_high', synchronous: true } : undefined,
    behavior: [
      'Implement the verified library block behavior described by the deterministic block specification.',
      blockSpec.contracts || {},
    ],
    corner_cases: ['Preserve deterministic configuration defaults and legal generic ranges.'],
    prohibited_implementations: ['std_logic_unsigned', 'std_logic_arith', 'std_logic_signed', 'missing work-library dependencies in single-file mode'],
    synthesis_requirements: ['VHDL-2008', 'ieee.std_logic_1164', 'ieee.numeric_std', 'GHDL analyze must pass'],
    testbench_obligations: ['Self-contained RTL must preserve the frozen entity interface.'],
    pass_marker: 'PASS',
  };
  const contractHash = sha256(stableJson(contractJson));
  const sourceSeed = String(record.id || record.artifactId || `${entityName}:${record.contentHash || ''}`);
  return {
    id: `contract_verified10k_${sha256(sourceSeed).slice(0, 16)}`,
    name: `Verified 10k Holdout: ${String(record.blockName || blockSpec.blockName || entityName)}`,
    version: 1,
    status: 'FROZEN',
    taskFamily: String(record.category || blockSpec.category || 'verified_10k'),
    entityName,
    contractJson,
    contractHash,
    sourceType: 'fixture',
    sourceReference: `verified_10k:${String(record.artifactId || record.blockName || entityName)}`,
    holdoutGroup: String(record.category || blockSpec.category || 'verified_10k'),
    isBenchmarkHoldout: true,
    createdBy: 'vhdl_lab_verified_10k_materializer',
    createdAt: now,
    updatedAt: now,
  };
}

function categoryBalancedContracts(contracts: VhdlLabHardwareContract[], maxContracts: number) {
  const byCategory = new Map<string, VhdlLabHardwareContract[]>();
  for (const contract of contracts) {
    const category = contract.holdoutGroup || contract.taskFamily || 'uncategorized';
    const bucket = byCategory.get(category) || [];
    bucket.push(contract);
    byCategory.set(category, bucket);
  }
  for (const bucket of byCategory.values()) {
    bucket.sort((left, right) => left.id.localeCompare(right.id));
  }
  const categories = [...byCategory.keys()].sort();
  const selected: VhdlLabHardwareContract[] = [];
  let cursor = 0;
  while (selected.length < maxContracts && categories.length > 0) {
    const category = categories[cursor % categories.length];
    const bucket = byCategory.get(category) || [];
    const next = bucket.shift();
    if (next) selected.push(next);
    if (bucket.length === 0) {
      byCategory.delete(category);
      categories.splice(cursor % categories.length, 1);
      cursor = 0;
    } else {
      cursor += 1;
    }
  }
  const categoryCoverage = selected.reduce((acc: Record<string, number>, contract) => {
    const category = contract.holdoutGroup || contract.taskFamily || 'uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  return { selected, categoryCoverage };
}

function positiveNumberOverride(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export function resolveVhdlLabPromotionStrictness(
  input: VhdlLabPromotionStrictnessInput | null | undefined = {},
  availableCategoryCount = 0,
): VhdlLabResolvedPromotionStrictness {
  const rawInput = (input || {}) as VhdlLabPromotionStrictnessInput & { profile_id?: string | null };
  const profileId = String(rawInput.profileId || rawInput.profile_id || 'fast_check') as VhdlLabPromotionStrictnessId;
  const profile = VHDL_LAB_PROMOTION_STRICTNESS_PROFILES.find((entry) => entry.id === profileId)
    || VHDL_LAB_PROMOTION_STRICTNESS_PROFILES[0];
  const overrides = rawInput.overrides || {};
  const advancedOverrides: Record<string, number> = {};
  const withOverride = (key: keyof NonNullable<VhdlLabPromotionStrictnessInput['overrides']>, fallback: number, min: number, max: number) => {
    const raw = overrides[key];
    const resolved = positiveNumberOverride(raw, fallback, min, max);
    if (raw !== undefined && raw !== null && raw !== '') advancedOverrides[key] = resolved;
    return resolved;
  };
  const minCategoriesFallback = profile.requireAllAvailableCategories
    ? Math.max(profile.minHoldoutCategories, availableCategoryCount || profile.minHoldoutCategories)
    : profile.minHoldoutCategories;
  return {
    ...profile,
    sourceProfileId: profile.id,
    maxContracts: withOverride('maxContracts', profile.maxContracts, 1, 10_000),
    minHoldoutContracts: withOverride('minHoldoutContracts', profile.minHoldoutContracts, 1, 10_000),
    minHoldoutCategories: withOverride('minHoldoutCategories', minCategoriesFallback, 1, 10_000),
    holdoutPassRate: withOverride('holdoutPassRate', profile.holdoutPassRate, 0, 1),
    maxFallbackPassCount: withOverride('maxFallbackPassCount', profile.maxFallbackPassCount, 0, 10_000),
    maxRepairNoProgressCount: withOverride('maxRepairNoProgressCount', profile.maxRepairNoProgressCount, 0, 10_000),
    advancedOverrides,
  };
}

function toPromotionStrictnessInput(
  strictness: VhdlLabPromotionStrictnessInput | VhdlLabResolvedPromotionStrictness | null | undefined,
): VhdlLabPromotionStrictnessInput | null {
  if (!strictness) return null;
  const resolved = strictness as Partial<VhdlLabResolvedPromotionStrictness> & VhdlLabPromotionStrictnessInput;
  return {
    profileId: resolved.profileId || resolved.sourceProfileId,
    overrides: resolved.overrides || resolved.advancedOverrides,
  };
}

async function selectCheckpointBenchmarkContracts(
  state: VhdlLabState,
  trainingRun: VhdlLabTrainingRun,
  options: { suiteId?: string | null; contractIds?: string[] | null; promotionStrictness?: VhdlLabResolvedPromotionStrictness | null } = {},
) {
  const maxContracts = options.suiteId === 'adapter_promotion_holdout'
    ? Math.max(1, Number(options.promotionStrictness?.maxContracts || process.env.VHDL_LAB_ADAPTER_PROMOTION_MAX_CONTRACTS || 30))
    : Math.max(1, Math.min(10, Number(process.env.VHDL_LAB_CHECKPOINT_BENCHMARK_MAX_CONTRACTS || 5)));
  const explicitContractIds = (options.contractIds || []).filter(Boolean);
  if (explicitContractIds.length > 0) {
    const explicitContracts = explicitContractIds
      .map((contractId) => state.contracts.find((contract) => contract.id === contractId))
      .filter(Boolean) as VhdlLabHardwareContract[];
    return {
      contracts: explicitContracts.slice(0, maxContracts),
      evaluationScope: 'explicit_contracts' as const,
      holdoutCount: explicitContracts.filter((contract) => contract.isBenchmarkHoldout).length,
      categoryCoverage: categoryBalancedContracts(explicitContracts.slice(0, maxContracts), maxContracts).categoryCoverage,
      materializedContracts: [] as VhdlLabHardwareContract[],
    };
  }
  if (options.suiteId) {
    if (options.suiteId === 'adapter_promotion_holdout') {
      const release = state.datasetReleases.find((entry) => entry.id === trainingRun.datasetReleaseId);
      const materialized = release?.datasetPath
        ? (await readDatasetSplitRecords(release.datasetPath, 'holdout'))
          .map((record) => {
            const contractId = String(record.contractId || '');
            if (contractId) return state.contracts.find((contract) => contract.id === contractId) || null;
            return buildContractFromVerifiedDatasetRecord(record);
          })
          .filter(Boolean) as VhdlLabHardwareContract[]
        : [];
      const explicitHoldouts = state.contracts.filter((contract) => contract.isBenchmarkHoldout || contract.holdoutGroup);
      const combined = [...materialized, ...explicitHoldouts];
      const deduped = [...new Map(combined.map((contract) => [contract.id, contract])).values()];
      const balanced = categoryBalancedContracts(deduped, maxContracts);
      return {
        contracts: balanced.selected,
        evaluationScope: 'adapter_promotion_holdout' as const,
        holdoutCount: deduped.length,
        categoryCoverage: balanced.categoryCoverage,
        materializedContracts: materialized,
      };
    }
    const suiteIds = suiteContractIds(state, options.suiteId);
    const suiteContracts = suiteIds
      .map((contractId) => state.contracts.find((contract) => contract.id === contractId))
      .filter(Boolean) as VhdlLabHardwareContract[];
    const balanced = categoryBalancedContracts(suiteContracts, maxContracts);
    return {
      contracts: balanced.selected,
      evaluationScope: options.suiteId,
      holdoutCount: suiteContracts.filter((contract) => contract.isBenchmarkHoldout).length,
      categoryCoverage: balanced.categoryCoverage,
      materializedContracts: [] as VhdlLabHardwareContract[],
    };
  }
  const release = state.datasetReleases.find((entry) => entry.id === trainingRun.datasetReleaseId);
  if (release?.datasetPath) {
    const holdoutIds = await readDatasetContractIds(release.datasetPath, 'holdout');
    const holdoutContracts = holdoutIds
      .map((contractId) => state.contracts.find((contract) => contract.id === contractId))
      .filter(Boolean) as VhdlLabHardwareContract[];
    if (holdoutContracts.length > 0) {
      const balanced = categoryBalancedContracts(holdoutContracts, maxContracts);
      return { contracts: balanced.selected, evaluationScope: 'dataset_holdout' as const, holdoutCount: holdoutContracts.length, categoryCoverage: balanced.categoryCoverage, materializedContracts: [] as VhdlLabHardwareContract[] };
    }
  }
  const explicitHoldouts = state.contracts.filter((contract) => contract.isBenchmarkHoldout);
  if (explicitHoldouts.length > 0) {
    const balanced = categoryBalancedContracts(explicitHoldouts, maxContracts);
    return { contracts: balanced.selected, evaluationScope: 'contract_holdout' as const, holdoutCount: explicitHoldouts.length, categoryCoverage: balanced.categoryCoverage, materializedContracts: [] as VhdlLabHardwareContract[] };
  }
  const balanced = categoryBalancedContracts(state.contracts, maxContracts);
  return { contracts: balanced.selected, evaluationScope: 'non_holdout_smoke' as const, holdoutCount: 0, categoryCoverage: balanced.categoryCoverage, materializedContracts: [] as VhdlLabHardwareContract[] };
}

async function writeCheckpointBenchmarkProgress(params: {
  benchmarkId: string;
  checkpointId: string;
  status: VhdlLabBenchmarkRun['status'];
  summary: Record<string, unknown>;
  completedAt?: string | null;
}) {
  const state = await readVhdlLabState();
  const benchmark = (state.benchmarkRuns || []).find((entry) => entry.id === params.benchmarkId);
  if (!benchmark) return;
  const nextBenchmark = {
    ...benchmark,
    status: params.status,
    summary: params.summary,
    completedAt: params.completedAt === undefined ? benchmark.completedAt : params.completedAt,
  };
  await fs.mkdir(path.dirname(nextBenchmark.resultPath), { recursive: true });
  await fs.writeFile(nextBenchmark.resultPath, `${JSON.stringify(nextBenchmark, null, 2)}\n`);
  const checkpoints = (state.checkpoints || []).map((entry) => entry.id === params.checkpointId
    ? { ...entry, metrics: { ...entry.metrics, adapterGenerationBenchmark: params.summary } }
    : entry);
  await writeVhdlLabState({
    ...state,
    benchmarkRuns: [nextBenchmark, ...(state.benchmarkRuns || []).filter((entry) => entry.id !== params.benchmarkId)],
    checkpoints,
  });
}

async function runVhdlLabCheckpointBenchmarkWorker(params: { benchmarkId: string; checkpointId: string }) {
  if (activeVhdlLabCheckpointBenchmarks.has(params.benchmarkId)) return;
  activeVhdlLabCheckpointBenchmarks.add(params.benchmarkId);
  try {
    const state = await readVhdlLabState();
    const checkpoint = (state.checkpoints || []).find((entry) => entry.id === params.checkpointId);
    if (!checkpoint) throw new Error(`Checkpoint ${params.checkpointId} was not found.`);
    const trainingRun = state.trainingRuns.find((entry) => entry.id === checkpoint.trainingRunId);
    if (!trainingRun) throw new Error(`Training run ${checkpoint.trainingRunId} was not found.`);
    const benchmark = (state.benchmarkRuns || []).find((entry) => entry.id === params.benchmarkId);
    if (!benchmark) throw new Error(`Benchmark ${params.benchmarkId} was not found.`);
    const promptVersion = state.promptVersions.find((entry) => entry.id === benchmark.promptVersionId)
      || state.promptVersions.find((entry) => entry.status === 'ACTIVE')
      || state.promptVersions[0];
    if (!promptVersion) throw new Error('No VHDL Lab prompt version is available for checkpoint benchmarking.');
    const profile = state.verificationProfiles.find((entry) => entry.enabled) || defaultVhdlLabState().verificationProfiles[0];
    const availability = await getVhdlLabMlxLmAvailability();
    const generateCommand = resolveMlxGenerateCommand(availability.command);
    if (!availability.available || !generateCommand) throw new Error('mlx_lm.generate is unavailable. Install MLX-LM or set VHDL_LAB_MLX_GENERATE_COMMAND.');
    const contracts = benchmark.contractIds
      .map((contractId) => state.contracts.find((contract) => contract.id === contractId))
      .filter(Boolean) as VhdlLabHardwareContract[];
    const benchmarkPath = path.dirname(benchmark.resultPath);
    const results: Array<Record<string, unknown>> = [];
    let passed = 0;
    let failed = 0;
    for (const [index, contract] of contracts.entries()) {
      const contractWorkspace = path.join(benchmarkPath, `${String(index + 1).padStart(2, '0')}-${contract.entityName}`);
      await fs.mkdir(contractWorkspace, { recursive: true });
      const maxAdapterRepairAttempts = Math.max(0, Math.min(10, benchmark.maxRepairAttempts ?? 0));
      const maxAdapterCandidateAttempts = 1 + maxAdapterRepairAttempts;
      const runContractEvaluation = async (mode: 'baseline' | 'adapter', adapterPath: string | null) => {
        const evaluationWorkspace = path.join(contractWorkspace, mode);
        await fs.mkdir(evaluationWorkspace, { recursive: true });
        let adapterPrompt = renderVhdlLabAdapterBenchmarkPrompt(contract, promptVersion);
        let lastRepairProgressKey = '';
        let contractResult: Record<string, unknown> | null = null;
        for (let candidateAttempt = 1; candidateAttempt <= maxAdapterCandidateAttempts; candidateAttempt += 1) {
        const generation = await runMlxAdapterVhdlGeneration({
          command: generateCommand,
          baseModel: trainingRun.baseModel,
          adapterPath,
          mode,
          prompt: adapterPrompt,
          workspacePath: evaluationWorkspace,
          candidateAttempt,
          seed: benchmark.seedList[0] || 42,
          maxTokens: Number(process.env.VHDL_LAB_CHECKPOINT_BENCHMARK_MAX_TOKENS || 8192),
        });
        if (!generation.ok) {
          const failureCode = generation.timedOut
            ? (candidateAttempt > 1 ? 'model_repair_timeout' : 'model_generation_timeout')
            : (candidateAttempt > 1 ? 'model_repair_failed' : 'model_generation_failed');
          contractResult = {
            contractId: contract.id,
            contractName: contract.name,
            entityName: contract.entityName,
            passed: false,
            stage: candidateAttempt > 1 ? 'repairing' : 'generating',
            failureCode,
            message: generation.error || 'Adapter generation failed.',
            promptPath: generation.promptPath,
            responsePath: generation.responsePath,
            elapsedMs: generation.elapsedMs,
            timeoutMs: generation.timeoutMs,
            timedOut: generation.timedOut,
            stderrTail: generation.stderr.slice(-1000),
            candidateAttemptsUsed: candidateAttempt,
            maxRepairAttempts: maxAdapterRepairAttempts,
            generationMode: mode,
            adapterUsed: mode === 'adapter',
            repairAuditPath: path.join(evaluationWorkspace, 'repair-audit.json'),
          };
          break;
        }
        const validation = await validateVhdlLabAdapterCandidate({
          benchmarkId: params.benchmarkId,
          contract,
          profile,
          rawText: generation.text,
          workspacePath: evaluationWorkspace,
          candidateAttempt,
          maxRepairAttempts: maxAdapterRepairAttempts,
        });
        if (validation.ok) {
          contractResult = {
            contractId: contract.id,
            contractName: contract.name,
            entityName: contract.entityName,
            passed: true,
            stage: validation.stage,
            failureCode: null,
            message: validation.message,
            artifactPath: validation.artifactPath,
            acceptedTestbenchPath: validation.acceptedTestbenchPath,
            simulationLogPath: validation.simulationLogPath,
            promptPath: generation.promptPath,
            responsePath: generation.responsePath,
            elapsedMs: generation.elapsedMs,
            timeoutMs: generation.timeoutMs,
            candidateAttemptsUsed: candidateAttempt,
            maxRepairAttempts: maxAdapterRepairAttempts,
            generationMode: mode,
            adapterUsed: mode === 'adapter',
            repairAuditPath: path.join(evaluationWorkspace, 'repair-audit.json'),
          };
          break;
        }
        const packet = buildVhdlLabRepairPacket({
          stage: validation.stage,
          candidateAttempt,
          previousCandidatePath: validation.artifactPath,
          issues: validation.issues,
          message: validation.message,
          ghdlOutput: validation.stage === 'analyzing' || validation.stage === 'simulating' ? validation.message : '',
          content: validation.generatedVhdl,
        });
        await appendVhdlLabRepairAudit({
          id: `checkpoint_eval_${params.benchmarkId}_${contract.id}`,
          contractId: contract.id,
          modelProfileId: null,
          promptVersionId: promptVersion.id,
          verificationProfileId: profile.id,
          runType: 'BENCHMARK',
          status: 'REPAIRING',
          seed: benchmark.seedList[0] || 42,
          temperature: 0,
          maxTokens: Number(process.env.VHDL_LAB_CHECKPOINT_BENCHMARK_MAX_TOKENS || 8192),
          candidateCount: 1,
          maxRepairAttempts: maxAdapterRepairAttempts,
          workspacePath: evaluationWorkspace,
          currentStage: validation.stage,
          stageLog: [],
          benchmarkSuiteId: benchmark.suiteId,
          datasetReleaseId: null,
          promptVersionIds: [promptVersion.id],
          seedList: benchmark.seedList,
          metrics: { benchmarkId: params.benchmarkId, checkpointAdapterEvaluation: true, generationMode: mode },
          repairAuditPath: path.join(evaluationWorkspace, 'repair-audit.json'),
          startedAt: benchmark.createdAt,
          completedAt: null,
          cancelledAt: null,
          createdAt: benchmark.createdAt,
        }, packet);
        const failedValidation = validation as {
          stage: string;
          failureCode: string;
          message: string;
          artifactPath?: string;
          rawResponse?: string;
          issues?: Array<VhdlLabValidationIssue>;
          generatedVhdl?: string;
        };
        const progressKey = `${packet.failureCode}:${packet.contentHash || sha256(generation.text || '')}`;
        if (lastRepairProgressKey === progressKey) {
          contractResult = shouldUseAdapterBenchmarkFallback(failedValidation)
            ? await tryVhdlLabAdapterBenchmarkFallback({
                benchmarkId: params.benchmarkId,
                contract,
                profile,
                promptVersion,
                workspacePath: evaluationWorkspace,
                previousValidation: failedValidation,
                candidateAttempt,
                maxRepairAttempts: maxAdapterRepairAttempts,
                elapsedMs: generation.elapsedMs,
                timeoutMs: generation.timeoutMs,
              })
            : {
                contractId: contract.id,
                contractName: contract.name,
                entityName: contract.entityName,
                passed: false,
                stage: 'repairing',
                failureCode: 'repair_no_progress',
                message: `repair_no_progress: repeated ${packet.failureCode} with unchanged adapter candidate content. Failure cluster ${id('cluster', progressKey)}.`,
                artifactPath: failedValidation.artifactPath,
                promptPath: generation.promptPath,
                responsePath: generation.responsePath,
                elapsedMs: generation.elapsedMs,
                timeoutMs: generation.timeoutMs,
                candidateAttemptsUsed: candidateAttempt,
                maxRepairAttempts: maxAdapterRepairAttempts,
                generationMode: mode,
                adapterUsed: mode === 'adapter',
                repairAuditPath: path.join(evaluationWorkspace, 'repair-audit.json'),
              };
          break;
        }
        lastRepairProgressKey = progressKey;
        if (candidateAttempt >= maxAdapterCandidateAttempts) {
          contractResult = shouldUseAdapterBenchmarkFallback(failedValidation)
            ? await tryVhdlLabAdapterBenchmarkFallback({
                benchmarkId: params.benchmarkId,
                contract,
                profile,
                promptVersion,
                workspacePath: evaluationWorkspace,
                previousValidation: failedValidation,
                candidateAttempt,
                maxRepairAttempts: maxAdapterRepairAttempts,
                elapsedMs: generation.elapsedMs,
                timeoutMs: generation.timeoutMs,
              })
            : {
                contractId: contract.id,
                contractName: contract.name,
                entityName: contract.entityName,
                passed: false,
                stage: validation.stage,
                failureCode: validation.failureCode,
                message: `${validation.message}${maxAdapterRepairAttempts > 0 ? `\nAdapter repair attempts exhausted after ${maxAdapterRepairAttempts} repair(s).` : ''}`,
                artifactPath: validation.artifactPath,
                promptPath: generation.promptPath,
                responsePath: generation.responsePath,
                elapsedMs: generation.elapsedMs,
                timeoutMs: generation.timeoutMs,
                candidateAttemptsUsed: candidateAttempt,
                maxRepairAttempts: maxAdapterRepairAttempts,
                generationMode: mode,
                adapterUsed: mode === 'adapter',
                repairAuditPath: path.join(evaluationWorkspace, 'repair-audit.json'),
              };
          break;
        }
        adapterPrompt = buildAdapterCandidateRepairPrompt({
          contract,
          promptVersion,
          rawResponse: validation.rawResponse || generation.text,
          previousVhdl: validation.generatedVhdl || generation.text,
          stage: validation.stage,
          failureCode: validation.failureCode,
          message: validation.message,
          issues: validation.issues,
          repairAttempt: candidateAttempt,
          maxRepairAttempts: maxAdapterRepairAttempts,
        });
      }
        return contractResult || {
          contractId: contract.id,
          contractName: contract.name,
          entityName: contract.entityName,
          passed: false,
          stage: 'benchmarking',
          failureCode: `${mode}_checkpoint_benchmark_failed`,
          message: `${mode} benchmark ended without a contract result.`,
          generationMode: mode,
          adapterUsed: mode === 'adapter',
        };
      };
      const baselineResult = await runContractEvaluation('baseline', null);
      const contractResult = await runContractEvaluation('adapter', checkpoint.checkpointPath);
      if (contractResult?.passed) passed += 1;
      else failed += 1;
      results.push({
        ...contractResult,
        baseline: {
          contractId: baselineResult.contractId,
          passed: baselineResult.passed,
          stage: baselineResult.stage,
          failureCode: baselineResult.failureCode,
          message: baselineResult.message,
          artifactPath: baselineResult.artifactPath,
          elapsedMs: baselineResult.elapsedMs,
          timeoutMs: baselineResult.timeoutMs,
          timedOut: baselineResult.timedOut,
          candidateAttemptsUsed: baselineResult.candidateAttemptsUsed,
          maxRepairAttempts: baselineResult.maxRepairAttempts,
          adapterFallbackUsed: baselineResult.adapterFallbackUsed,
          repairAuditPath: baselineResult.repairAuditPath,
        },
      });
      const running = contracts.length - results.length;
      const improvement = summarizeAdapterBenchmarkImprovement(results);
      await writeCheckpointBenchmarkProgress({
        benchmarkId: params.benchmarkId,
        checkpointId: params.checkpointId,
        status: running > 0 ? 'RUNNING' : failed > 0 ? 'FAILED' : 'COMPLETED',
        completedAt: running > 0 ? null : nowIso(),
        summary: {
          ...benchmark.summary,
          total: contracts.length,
          passed,
          failed,
          running,
          passRate: contracts.length ? passed / contracts.length : 0,
          adapterCheckpointId: checkpoint.id,
          adapterPath: checkpoint.checkpointPath,
          trainingRunId: trainingRun.id,
          baseModel: trainingRun.baseModel,
          promptVersionId: promptVersion.id,
          results,
          improvement,
          generationBenchmarkPassed: failed === 0 && contracts.length > 0,
        },
      });
    }
    const finalState = await readVhdlLabState();
    const finalBenchmark = (finalState.benchmarkRuns || []).find((entry) => entry.id === params.benchmarkId);
    const checkpoints = (finalState.checkpoints || []).map((entry) => entry.id === params.checkpointId
      ? { ...entry, status: 'BENCHMARKED' as const, metrics: { ...entry.metrics, adapterGenerationBenchmark: finalBenchmark?.summary || {} } }
      : entry);
    await writeVhdlLabState({ ...finalState, checkpoints });
  } catch (error: any) {
    const state = await readVhdlLabState().catch(() => null);
    const benchmark = state?.benchmarkRuns?.find((entry) => entry.id === params.benchmarkId);
    await writeCheckpointBenchmarkProgress({
      benchmarkId: params.benchmarkId,
      checkpointId: params.checkpointId,
      status: 'FAILED',
      completedAt: nowIso(),
      summary: {
        ...(benchmark?.summary || {}),
        adapterCheckpointId: params.checkpointId,
        total: 0,
        passed: 0,
        failed: 1,
        running: 0,
        passRate: 0,
        failureCode: 'checkpoint_adapter_benchmark_failed',
        message: String(error?.message || error),
        generationBenchmarkPassed: false,
      },
    });
  } finally {
    activeVhdlLabCheckpointBenchmarks.delete(params.benchmarkId);
  }
}

export async function benchmarkVhdlLabCheckpoint(
  checkpointId: string,
  options: {
    suiteId?: string | null;
    contractIds?: string[] | null;
    maxRepairAttempts?: number | null;
    promotionStrictness?: VhdlLabPromotionStrictnessInput | VhdlLabResolvedPromotionStrictness | null;
  } = {},
) {
  const state = await readVhdlLabState();
  const checkpoint = (state.checkpoints || []).find((entry) => entry.id === checkpointId);
  if (!checkpoint) return { ok: false as const, error: `Checkpoint ${checkpointId} was not found.` };
  const trainingRun = state.trainingRuns.find((entry) => entry.id === checkpoint.trainingRunId);
  if (!trainingRun) return { ok: false as const, error: `Training run ${checkpoint.trainingRunId} was not found.` };
  const initialPromotionStrictness = options.suiteId === 'adapter_promotion_holdout'
    ? resolveVhdlLabPromotionStrictness(options.promotionStrictness as VhdlLabPromotionStrictnessInput | null | undefined)
    : null;
  const selected = await selectCheckpointBenchmarkContracts(state, trainingRun, { ...options, promotionStrictness: initialPromotionStrictness });
  const promotionStrictness = options.suiteId === 'adapter_promotion_holdout'
    ? resolveVhdlLabPromotionStrictness(options.promotionStrictness as VhdlLabPromotionStrictnessInput | null | undefined, Object.keys(selected.categoryCoverage || {}).length)
    : null;
  if (selected.contracts.length === 0) return { ok: false as const, error: 'No contracts are available for adapter benchmarking.' };
  const materializedContracts = selected.materializedContracts || [];
  const nextContracts = materializedContracts.length > 0
    ? [...new Map([...materializedContracts, ...state.contracts].map((contract) => [contract.id, contract])).values()]
    : state.contracts;
  const promptVersionId = state.promptTemplates[0]?.currentVersionId || state.promptVersions.find((entry) => entry.status === 'ACTIVE')?.id || state.promptVersions[0]?.id || null;
  const maxRepairAttempts = Math.max(0, Math.min(10, Number(options.maxRepairAttempts ?? 3)));
  const benchmarkId = id('benchmark', `checkpoint:${checkpoint.id}:${nowIso()}:${Math.random()}`);
  const benchmarkPath = path.join(vhdlLabPaths().benchmarks, benchmarkId);
  await fs.mkdir(benchmarkPath, { recursive: true });
  const benchmark: VhdlLabBenchmarkRun = {
    id: benchmarkId,
    suiteId: options.suiteId ? `checkpoint_adapter_generation:${options.suiteId}` : 'checkpoint_adapter_generation',
    status: 'RUNNING',
    contractIds: selected.contracts.map((contract) => contract.id),
    childRunIds: [],
    modelProfileId: null,
    promptVersionId,
    seedList: [42],
    maxRepairAttempts,
    summary: {
      total: selected.contracts.length,
      passed: 0,
      failed: 0,
      running: selected.contracts.length,
      passRate: 0,
      adapterCheckpointId: checkpoint.id,
      adapterPath: checkpoint.checkpointPath,
      trainingRunId: trainingRun.id,
      baseModel: trainingRun.baseModel,
      maxRepairAttempts,
      evaluationScope: selected.evaluationScope,
      holdoutCount: selected.holdoutCount,
      categoryCoverage: selected.categoryCoverage || {},
      promotionStrictness,
      promotionStrictnessProfileId: promotionStrictness?.sourceProfileId || null,
      materializedContractCount: materializedContracts.length,
      generationBenchmarkPassed: false,
    },
    resultPath: path.join(benchmarkPath, 'summary.json'),
    createdAt: nowIso(),
    completedAt: null,
  };
  await fs.writeFile(benchmark.resultPath, `${JSON.stringify(benchmark, null, 2)}\n`);
  const checkpoints = (state.checkpoints || []).map((entry) => entry.id === checkpointId
    ? { ...entry, benchmarkRunIds: [...new Set([...entry.benchmarkRunIds, benchmark.id])] }
    : entry);
  await writeVhdlLabState({ ...state, contracts: nextContracts, benchmarkRuns: [benchmark, ...(state.benchmarkRuns || [])], checkpoints });
  void runVhdlLabCheckpointBenchmarkWorker({ benchmarkId: benchmark.id, checkpointId }).catch(() => undefined);
  return { ok: true as const, checkpoint: checkpoints.find((entry) => entry.id === checkpointId), benchmark };
}

type AdapterBenchmarkEvidence = {
  benchmarkId: string;
  suiteId: string;
  total: number;
  passed: number;
  failed: number;
  running: number;
  passRate: number;
  fallbackPassCount: number;
  adapterAuthoredPassCount: number;
  repairNoProgressCount: number;
  acceptedArtifactPaths: string[];
  categoryCoverage: Record<string, number>;
  status: VhdlLabBenchmarkRun['status'];
};

function summarizeAdapterBenchmarkEvidence(benchmark: VhdlLabBenchmarkRun): AdapterBenchmarkEvidence {
  const results = Array.isArray(benchmark.summary?.results) ? benchmark.summary.results as Array<Record<string, unknown>> : [];
  const total = Number(benchmark.summary?.total ?? results.length ?? benchmark.contractIds.length ?? 0);
  const passed = Number(benchmark.summary?.passed ?? results.filter((result) => result.passed === true).length ?? 0);
  const failed = Number(benchmark.summary?.failed ?? results.filter((result) => result.passed === false).length ?? 0);
  const running = Number(benchmark.summary?.running ?? 0);
  const fallbackPassCount = results.filter((result) => result.passed === true && result.adapterFallbackUsed === true).length;
  const adapterAuthoredPassCount = results.filter((result) => result.passed === true && result.adapterFallbackUsed !== true).length;
  const repairNoProgressCount = results.filter((result) => {
    const text = `${String(result.failureCode || '')}\n${String(result.previousFailureCode || '')}\n${String(result.message || '')}`;
    return /repair_no_progress/i.test(text);
  }).length;
  const acceptedArtifactPaths = results
    .filter((result) => result.passed === true && typeof result.artifactPath === 'string')
    .map((result) => String(result.artifactPath));
  const categoryCoverage = benchmark.summary?.categoryCoverage && typeof benchmark.summary.categoryCoverage === 'object'
    ? benchmark.summary.categoryCoverage as Record<string, number>
    : {};
  return {
    benchmarkId: benchmark.id,
    suiteId: benchmark.suiteId,
    total,
    passed,
    failed,
    running,
    passRate: total ? passed / total : 0,
    fallbackPassCount,
    adapterAuthoredPassCount,
    repairNoProgressCount,
    acceptedArtifactPaths,
    categoryCoverage,
    status: benchmark.status,
  };
}

function summarizeAdapterBenchmarkImprovement(results: Array<Record<string, unknown>>) {
  const comparable = results.filter((result) => result && typeof result.baseline === 'object' && result.baseline);
  const total = comparable.length;
  const adapterPassed = comparable.filter((result) => result.passed === true).length;
  const baselinePassed = comparable.filter((result) => (result.baseline as Record<string, unknown>)?.passed === true).length;
  const adapterPassRate = total ? adapterPassed / total : 0;
  const baselinePassRate = total ? baselinePassed / total : 0;
  const repairCount = (value: unknown) => Math.max(0, Number((value as Record<string, unknown>)?.candidateAttemptsUsed || 1) - 1);
  const timedOut = (value: unknown) => {
    const record = value as Record<string, unknown>;
    return record?.timedOut === true || /timeout/i.test(`${String(record?.failureCode || '')}\n${String(record?.message || '')}`);
  };
  const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const adapterRepairAttempts = comparable.map((result) => repairCount(result));
  const baselineRepairAttempts = comparable.map((result) => repairCount(result.baseline));
  const adapterTimeouts = comparable.filter((result) => timedOut(result)).length;
  const baselineTimeouts = comparable.filter((result) => timedOut(result.baseline)).length;
  const regressions = comparable.filter((result) => result.passed !== true && (result.baseline as Record<string, unknown>)?.passed === true);
  const improvements = comparable.filter((result) => result.passed === true && (result.baseline as Record<string, unknown>)?.passed !== true);
  return {
    comparableContracts: total,
    baselinePassed,
    adapterPassed,
    baselinePassRate,
    adapterPassRate,
    passRateDelta: adapterPassRate - baselinePassRate,
    passRateDeltaPoints: Math.round((adapterPassRate - baselinePassRate) * 10_000) / 100,
    baselineAverageRepairAttempts: Math.round(average(baselineRepairAttempts) * 100) / 100,
    adapterAverageRepairAttempts: Math.round(average(adapterRepairAttempts) * 100) / 100,
    repairReduction: Math.round((average(baselineRepairAttempts) - average(adapterRepairAttempts)) * 100) / 100,
    baselineTimeouts,
    adapterTimeouts,
    timeoutChange: adapterTimeouts - baselineTimeouts,
    regressionCount: regressions.length,
    improvementCount: improvements.length,
    regressionContractIds: regressions.map((result) => String(result.contractId || '')).filter(Boolean),
    improvedContractIds: improvements.map((result) => String(result.contractId || '')).filter(Boolean),
  };
}

function selectAdapterPromotionBenchmarks(checkpoint: VhdlLabCheckpoint, benchmarkRuns: VhdlLabBenchmarkRun[]) {
  const linked = benchmarkRuns
    .filter((benchmark) => benchmark.suiteId.startsWith('checkpoint_adapter_generation')
      && (checkpoint.benchmarkRunIds.includes(benchmark.id) || String(benchmark.summary?.adapterCheckpointId || '') === checkpoint.id))
    .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());
  const completed = linked.filter((benchmark) => benchmark.status === 'COMPLETED' || benchmark.status === 'FAILED');
  const smoke = completed.find((benchmark) => /:smoke_core_contracts$/.test(benchmark.suiteId))
    || completed.find((benchmark) => !/holdout|promotion/i.test(`${benchmark.suiteId}:${String(benchmark.summary?.evaluationScope || '')}`));
  const holdout = completed.find((benchmark) => /adapter_promotion_holdout|holdout/i.test(`${benchmark.suiteId}:${String(benchmark.summary?.evaluationScope || '')}`));
  return { smoke, holdout, linked };
}

export function evaluateVhdlLabAdapterQualification(state: VhdlLabState, checkpointId: string, options: {
  holdoutPassRateThreshold?: number;
  maxFallbackPassCount?: number;
  maxRepairNoProgressCount?: number;
  minHoldoutContracts?: number;
  minHoldoutCategories?: number;
  promotionStrictness?: VhdlLabPromotionStrictnessInput | VhdlLabResolvedPromotionStrictness | null;
} = {}) {
  const checkpoint = (state.checkpoints || []).find((entry) => entry.id === checkpointId);
  if (!checkpoint) return { ok: false as const, error: `Checkpoint ${checkpointId} was not found.` };
  const trainingRun = state.trainingRuns.find((entry) => entry.id === checkpoint.trainingRunId);
  if (!trainingRun) return { ok: false as const, error: `Training run ${checkpoint.trainingRunId} was not found.` };
  const { smoke, holdout } = selectAdapterPromotionBenchmarks(checkpoint, state.benchmarkRuns || []);
  const storedStrictness = holdout?.summary?.promotionStrictness as VhdlLabPromotionStrictnessInput | VhdlLabResolvedPromotionStrictness | null | undefined;
  const requestedStrictnessInput = toPromotionStrictnessInput(options.promotionStrictness);
  const storedStrictnessInput = toPromotionStrictnessInput(storedStrictness);
  const promotionStrictness = resolveVhdlLabPromotionStrictness(
    requestedStrictnessInput || storedStrictnessInput || {
      profileId: 'fast_check',
      overrides: {
        holdoutPassRate: options.holdoutPassRateThreshold ?? process.env.VHDL_LAB_ADAPTER_PROMOTION_HOLDOUT_PASS_RATE,
        maxFallbackPassCount: options.maxFallbackPassCount ?? process.env.VHDL_LAB_ADAPTER_PROMOTION_MAX_FALLBACK_PASSES,
        maxRepairNoProgressCount: options.maxRepairNoProgressCount ?? process.env.VHDL_LAB_ADAPTER_PROMOTION_MAX_REPAIR_NO_PROGRESS,
        minHoldoutContracts: options.minHoldoutContracts ?? process.env.VHDL_LAB_ADAPTER_PROMOTION_MIN_HOLDOUT_CONTRACTS,
        minHoldoutCategories: options.minHoldoutCategories ?? process.env.VHDL_LAB_ADAPTER_PROMOTION_MIN_HOLDOUT_CATEGORIES,
      },
    },
    holdout?.summary?.categoryCoverage && typeof holdout.summary.categoryCoverage === 'object'
      ? Object.keys(holdout.summary.categoryCoverage as Record<string, unknown>).length
      : 0,
  );
  const threshold = promotionStrictness.holdoutPassRate;
  const maxFallbackPassCount = promotionStrictness.maxFallbackPassCount;
  const maxRepairNoProgressCount = promotionStrictness.maxRepairNoProgressCount;
  const minHoldoutContracts = promotionStrictness.minHoldoutContracts;
  const minHoldoutCategories = promotionStrictness.minHoldoutCategories;
  const smokeEvidence = smoke ? summarizeAdapterBenchmarkEvidence(smoke) : null;
  const holdoutEvidence = holdout ? summarizeAdapterBenchmarkEvidence(holdout) : null;
  const issues: string[] = [];
  if (!smokeEvidence) issues.push('adapter_promotion_smoke_benchmark_missing');
  else {
    if (smokeEvidence.status !== 'COMPLETED') issues.push('adapter_promotion_smoke_benchmark_not_completed');
    if (smokeEvidence.total < 5) issues.push('adapter_promotion_smoke_requires_5_contracts');
    if (smokeEvidence.passRate !== 1 || smokeEvidence.failed > 0 || smokeEvidence.running > 0) issues.push('adapter_promotion_smoke_must_pass_100_percent');
  }
  if (!holdoutEvidence) issues.push('adapter_promotion_holdout_benchmark_missing');
  else {
    if (holdoutEvidence.status !== 'COMPLETED') issues.push('adapter_promotion_holdout_benchmark_not_completed');
    if (holdoutEvidence.total === 0) issues.push('adapter_promotion_holdout_requires_contracts');
    if (holdoutEvidence.total < minHoldoutContracts) issues.push(`adapter_promotion_holdout_requires_${minHoldoutContracts}_contracts`);
    if (Object.keys(holdoutEvidence.categoryCoverage).length < minHoldoutCategories) issues.push(`adapter_promotion_holdout_requires_${minHoldoutCategories}_categories`);
    if (holdoutEvidence.passRate < threshold || holdoutEvidence.failed > 0 || holdoutEvidence.running > 0) issues.push(`adapter_promotion_holdout_below_threshold_${Math.round(threshold * 100)}pct`);
  }
  const evidence = [smokeEvidence, holdoutEvidence].filter(Boolean) as AdapterBenchmarkEvidence[];
  const fallbackPassCount = evidence.reduce((sum, item) => sum + item.fallbackPassCount, 0);
  const adapterAuthoredPassCount = evidence.reduce((sum, item) => sum + item.adapterAuthoredPassCount, 0);
  const repairNoProgressCount = evidence.reduce((sum, item) => sum + item.repairNoProgressCount, 0);
  if (fallbackPassCount > maxFallbackPassCount) issues.push('adapter_promotion_fallback_passes_exceed_limit');
  if (repairNoProgressCount > maxRepairNoProgressCount) issues.push('adapter_promotion_repair_no_progress_exceeds_limit');
  const acceptedArtifactPaths = [...new Set(evidence.flatMap((item) => item.acceptedArtifactPaths))];
  return {
    ok: issues.length === 0,
    checkpoint,
    trainingRun,
    issues,
    smokeEvidence,
    holdoutEvidence,
    fallbackPassCount,
    adapterAuthoredPassCount,
    acceptedArtifactPaths,
    threshold,
    minHoldoutContracts,
    minHoldoutCategories,
    promotionStrictness,
    gateChecks: {
      smokeBenchmarkPresent: Boolean(smokeEvidence),
      smokePassed100Percent: Boolean(smokeEvidence && smokeEvidence.status === 'COMPLETED' && smokeEvidence.total >= 5 && smokeEvidence.passRate === 1 && smokeEvidence.failed === 0 && smokeEvidence.running === 0),
      holdoutBenchmarkPresent: Boolean(holdoutEvidence),
      holdoutThresholdMet: Boolean(holdoutEvidence && holdoutEvidence.status === 'COMPLETED' && holdoutEvidence.total >= minHoldoutContracts && Object.keys(holdoutEvidence.categoryCoverage).length >= minHoldoutCategories && holdoutEvidence.passRate >= threshold && holdoutEvidence.failed === 0 && holdoutEvidence.running === 0),
      fallbackWithinLimit: fallbackPassCount <= maxFallbackPassCount,
      repairNoProgressWithinLimit: repairNoProgressCount <= maxRepairNoProgressCount,
    },
  };
}

export async function promoteVhdlLabCheckpoint(checkpointId: string) {
  const state = await readVhdlLabState();
  const checkpoint = (state.checkpoints || []).find((entry) => entry.id === checkpointId);
  if (!checkpoint) return { ok: false as const, error: `Checkpoint ${checkpointId} was not found.` };
  const evaluation = evaluateVhdlLabAdapterQualification(state, checkpointId);
  if (!evaluation.ok) {
    const checkpoints = (state.checkpoints || []).map((entry) => entry.id === checkpointId
      ? {
          ...entry,
          promotionStatus: 'LAB_ONLY' as const,
          qualificationIssues: evaluation.issues,
          fallbackPassCount: evaluation.fallbackPassCount,
          adapterAuthoredPassCount: evaluation.adapterAuthoredPassCount,
          metrics: { ...entry.metrics, adapterQualification: evaluation },
        }
      : entry);
    await writeVhdlLabState({ ...state, checkpoints });
    return {
      ok: false as const,
      error: `Checkpoint is not qualified for leaf RTL: ${evaluation.issues.join(', ') || 'unknown qualification issue'}.`,
      evaluation,
    };
  }
  const promotedAt = nowIso();
  const sourcePromptVersionId = (state.benchmarkRuns || []).find((entry) => entry.id === evaluation.holdoutEvidence?.benchmarkId)?.promptVersionId
    || (state.benchmarkRuns || []).find((entry) => entry.id === evaluation.smokeEvidence?.benchmarkId)?.promptVersionId
    || null;
  const sourceId = id('qualified_adapter', `${checkpoint.id}:${evaluation.smokeEvidence?.benchmarkId}:${evaluation.holdoutEvidence?.benchmarkId}`);
  const sourceDir = path.join(vhdlLabPaths().qualifiedAdapters, sourceId);
  await fs.mkdir(sourceDir, { recursive: true });
  const promotionAuditPath = path.join(sourceDir, 'promotion-audit.json');
  const categoryCoverage = evaluation.holdoutEvidence?.categoryCoverage || {};
  const source: QualifiedAdapterGenerationSource = {
    id: sourceId,
    checkpointId: checkpoint.id,
    adapterPath: checkpoint.checkpointPath,
    baseModel: evaluation.trainingRun.baseModel,
    datasetReleaseId: evaluation.trainingRun.datasetReleaseId,
    promptVersionId: sourcePromptVersionId,
    smokeBenchmarkId: evaluation.smokeEvidence?.benchmarkId || null,
    holdoutBenchmarkId: evaluation.holdoutEvidence?.benchmarkId || null,
    benchmarkSuiteIds: [evaluation.smokeEvidence?.suiteId, evaluation.holdoutEvidence?.suiteId].filter(Boolean) as string[],
    smokePassRate: evaluation.smokeEvidence?.passRate || 0,
    holdoutPassRate: evaluation.holdoutEvidence?.passRate || 0,
    fallbackPassCount: evaluation.fallbackPassCount,
    adapterAuthoredPassCount: evaluation.adapterAuthoredPassCount,
    acceptedArtifactPaths: evaluation.acceptedArtifactPaths,
    qualificationIssues: [],
    promotionAuditPath,
    promotionStrictness: evaluation.promotionStrictness,
    categoryCoverage,
    gateChecks: evaluation.gateChecks,
    status: 'QUALIFIED_FOR_LEAF_RTL',
    createdAt: promotedAt,
    promotedAt,
    rejectedAt: null,
  };
  const audit = {
    source,
    checkpoint: {
      id: checkpoint.id,
      checkpointPath: checkpoint.checkpointPath,
      checkpointHash: sha256(checkpoint.checkpointPath),
      trainingRunId: checkpoint.trainingRunId,
    },
    trainingRun: {
      id: evaluation.trainingRun.id,
      datasetReleaseId: evaluation.trainingRun.datasetReleaseId,
      baseModel: evaluation.trainingRun.baseModel,
      adapterName: evaluation.trainingRun.adapterName,
      configHash: sha256(stableJson(evaluation.trainingRun.config || {})),
    },
    gates: {
      promotionStrictness: evaluation.promotionStrictness,
      profileId: evaluation.promotionStrictness.sourceProfileId,
      profileLabel: evaluation.promotionStrictness.label,
      threshold: evaluation.threshold,
      minHoldoutContracts: evaluation.minHoldoutContracts,
      minHoldoutCategories: evaluation.minHoldoutCategories,
      gateChecks: evaluation.gateChecks,
      issues: evaluation.issues,
    },
    evidence: {
      smoke: evaluation.smokeEvidence,
      holdout: evaluation.holdoutEvidence,
      fallbackPassCount: evaluation.fallbackPassCount,
      adapterAuthoredPassCount: evaluation.adapterAuthoredPassCount,
      acceptedArtifactPaths: evaluation.acceptedArtifactPaths,
      benchmarkResultPaths: [evaluation.smokeEvidence?.benchmarkId, evaluation.holdoutEvidence?.benchmarkId]
        .filter(Boolean)
        .map((benchmarkId) => (state.benchmarkRuns || []).find((entry) => entry.id === benchmarkId)?.resultPath)
        .filter(Boolean),
    },
    createdAt: promotedAt,
  };
  await fs.writeFile(promotionAuditPath, `${JSON.stringify(audit, null, 2)}\n`);
  const checkpoints = (state.checkpoints || []).map((entry) => entry.id === checkpointId
    ? {
        ...entry,
        status: 'PROMOTED' as const,
        promotionStatus: 'QUALIFIED_FOR_LEAF_RTL' as const,
        promotionBenchmarks: [source.smokeBenchmarkId, source.holdoutBenchmarkId].filter(Boolean) as string[],
        fallbackPassCount: evaluation.fallbackPassCount,
        adapterAuthoredPassCount: evaluation.adapterAuthoredPassCount,
        qualifiedForFpgaArchitectAt: promotedAt,
        qualificationIssues: [],
        qualifiedSourceId: source.id,
        metrics: { ...entry.metrics, adapterQualification: evaluation, adapterPromotionAuditPath: promotionAuditPath, adapterPromotionStrictness: evaluation.promotionStrictness },
      }
    : entry);
  await writeVhdlLabState({
    ...state,
    checkpoints,
    qualifiedAdapterSources: [source, ...(state.qualifiedAdapterSources || []).filter((entry) => entry.id !== source.id && entry.checkpointId !== source.checkpointId)],
  });
  return { ok: true as const, checkpoint: checkpoints.find((entry) => entry.id === checkpointId), source, evaluation };
}

export async function checkLmStudioHealth(provider: VhdlLabProvider) {
  const baseUrl = provider.baseUrl.replace(/\/+$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${baseUrl}/v1/models`, { signal: controller.signal });
    const data = await response.json().catch(() => null);
    const models = Array.isArray((data as any)?.data) ? (data as any).data : [];
    return { ok: response.ok, status: response.ok ? 'healthy' as const : 'unavailable' as const, models };
  } catch (error: any) {
    return { ok: false, status: 'unavailable' as const, error: String(error?.message || error), models: [] };
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkOllamaHealth(provider: VhdlLabProvider) {
  const baseUrl = provider.baseUrl.replace(/\/+$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${baseUrl}/api/tags`, { signal: controller.signal });
    const data = await response.json().catch(() => null);
    const models = Array.isArray((data as any)?.models) ? (data as any).models : [];
    return { ok: response.ok, status: response.ok ? 'healthy' as const : 'unavailable' as const, models };
  } catch (error: any) {
    return { ok: false, status: 'unavailable' as const, error: String(error?.message || error), models: [] };
  } finally {
    clearTimeout(timeout);
  }
}

export async function discoverOllamaModels() {
  const state = await readVhdlLabState();
  const provider = state.providers.find((entry) => entry.providerType === 'OLLAMA' && entry.enabled)
    || defaultVhdlLabState().providers.find((entry) => entry.providerType === 'OLLAMA')!;
  const health = await checkOllamaHealth(provider);
  const at = nowIso();
  const discovered: VhdlLabModelProfile[] = health.models.map((model: any) => {
    const identifier = String(model.name || model.model || model.id || '').trim();
    return {
      id: id('model', `ollama:${identifier}`),
      providerId: provider.id,
      displayName: identifier,
      modelIdentifier: identifier,
      localPath: null,
      role: 'GENERATOR' as const,
      contextLength: Number(model.details?.context_length || model.context_length || model.contextLength || 0),
      defaultTemperature: 0,
      defaultSeed: 42,
      defaultMaxTokens: 4096,
      supportsStructuredOutput: false,
      supportsTools: false,
      enabled: Boolean(identifier),
      metadata: model,
      createdAt: at,
      updatedAt: at,
    };
  }).filter((model) => model.modelIdentifier);
  const existingByIdentifier = new Map(state.models.map((model) => [`${model.providerId}:${model.modelIdentifier}`, model]));
  const merged = [
    ...discovered.map((model) => ({ ...(existingByIdentifier.get(`${model.providerId}:${model.modelIdentifier}`) || model), ...model, updatedAt: at })),
    ...state.models.filter((model) => model.providerId !== provider.id || !discovered.some((entry) => entry.modelIdentifier === model.modelIdentifier)),
  ];
  const providers = state.providers.map((entry) => entry.id === provider.id ? { ...entry, healthStatus: health.status, lastHealthCheckAt: at, updatedAt: at } : entry);
  await writeVhdlLabState({ ...state, providers, models: merged });
  return { ok: health.ok, provider: providers.find((entry) => entry.id === provider.id), models: discovered, error: (health as any).error || null };
}

export async function discoverLmStudioModels() {
  const state = await readVhdlLabState();
  const provider = state.providers.find((entry) => entry.providerType === 'LM_STUDIO' && entry.enabled)
    || defaultVhdlLabState().providers.find((entry) => entry.providerType === 'LM_STUDIO')!;
  const health = await checkLmStudioHealth(provider);
  const at = nowIso();
  const discovered: VhdlLabModelProfile[] = health.models.map((model: any) => {
    const identifier = String(model.id || model.model || model.name || '').trim();
    return {
      id: id('model', `lmstudio:${identifier}`),
      providerId: provider.id,
      displayName: identifier,
      modelIdentifier: identifier,
      localPath: null,
      role: 'GENERATOR' as const,
      contextLength: Number(model.context_length || model.contextLength || 0),
      defaultTemperature: 0,
      defaultSeed: 42,
      defaultMaxTokens: 8192,
      supportsStructuredOutput: true,
      supportsTools: false,
      enabled: Boolean(identifier),
      metadata: model,
      createdAt: at,
      updatedAt: at,
    };
  }).filter((model) => model.modelIdentifier);
  const existingByIdentifier = new Map(state.models.map((model) => [`${model.providerId}:${model.modelIdentifier}`, model]));
  const merged = [
    ...discovered.map((model) => ({ ...(existingByIdentifier.get(`${model.providerId}:${model.modelIdentifier}`) || model), ...model, updatedAt: at })),
    ...state.models.filter((model) => model.providerId !== provider.id || !discovered.some((entry) => entry.modelIdentifier === model.modelIdentifier)),
  ];
  const providers = state.providers.map((entry) => entry.id === provider.id ? { ...entry, healthStatus: health.status, lastHealthCheckAt: at, updatedAt: at } : entry);
  await writeVhdlLabState({ ...state, providers, models: merged });
  return { ok: health.ok, provider: providers.find((entry) => entry.id === provider.id), models: discovered, error: (health as any).error || null };
}

export async function getVhdlLabDiagnostics() {
  await ensureVhdlLabStorage();
  const state = await readVhdlLabState();
  const config = getVhdlLabConfig();
  let ghdl: any = { installed: false, path: config.ghdlPath, version: null, error: null };
  try {
    const result = await execFileAsync(config.ghdlPath, ['--version'], { timeout: 5000 });
    ghdl = { installed: true, path: config.ghdlPath, version: result.stdout.split('\n')[0] || result.stderr.split('\n')[0] || 'GHDL installed', error: null };
  } catch (error: any) {
    ghdl = { installed: false, path: config.ghdlPath, version: null, error: String(error?.message || error) };
  }
  const ollamaProvider = state.providers.find((entry) => entry.providerType === 'OLLAMA');
  const lmStudioProvider = state.providers.find((entry) => entry.providerType === 'LM_STUDIO');
  const [ollama, lmStudio] = await Promise.all([
    ollamaProvider ? checkOllamaHealth(ollamaProvider) : Promise.resolve({ ok: false, status: 'unavailable' as const, models: [] }),
    lmStudioProvider?.enabled ? checkLmStudioHealth(lmStudioProvider) : Promise.resolve({ ok: false, status: 'unavailable' as const, models: [] }),
  ]);
  return {
    enabled: config.enabled,
    dataRoot: config.dataRoot,
    worker: {
      mode: 'embedded-local',
      status: config.worker.enabled ? 'healthy' : 'disabled',
      started: vhdlLabWorkerState.started,
      running: vhdlLabWorkerState.running,
      currentRunId: vhdlLabWorkerState.currentRunId,
      lastTickAt: vhdlLabWorkerState.lastTickAt,
      lastError: vhdlLabWorkerState.lastError,
      heartbeatSeconds: config.worker.heartbeatSeconds,
      staleAfterSeconds: config.worker.staleAfterSeconds,
      queueDepth: state.runs.filter((run) => run.status === 'QUEUED').length,
      runningCount: state.runs.filter((run) => ['PREPARING', 'GENERATING', 'ANALYZING', 'SIMULATING', 'REPAIRING'].includes(run.status)).length,
    },
    ollama: {
      baseUrl: ollamaProvider?.baseUrl || config.ollamaBaseUrl,
      status: ollama.status,
      modelCount: ollama.models.length,
      error: (ollama as any).error || null,
    },
    lmStudio: {
      baseUrl: lmStudioProvider?.baseUrl || config.lmStudioBaseUrl,
      status: lmStudio.status,
      modelCount: lmStudio.models.length,
      error: (lmStudio as any).error || null,
    },
    ghdl,
    counts: {
      providers: state.providers.length,
      models: state.models.length,
      contracts: state.contracts.length,
      frozenContracts: state.contracts.filter((contract) => contract.status === 'FROZEN').length,
      runs: state.runs.length,
      queuedRuns: state.runs.filter((run) => run.status === 'QUEUED').length,
      failureClusters: state.failureClusters.length,
      datasetReleases: state.datasetReleases.length,
      trainingRuns: state.trainingRuns.length,
      benchmarkRuns: (state.benchmarkRuns || []).length,
      checkpoints: (state.checkpoints || []).length,
    },
  };
}
