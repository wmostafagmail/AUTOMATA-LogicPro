import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createSessionManager } from '../src/server/sessionManager';
import { prepareAiAnalyzeRequest } from '../src/server/aiAnalyzePreparation';
import { runAiAnalyzeJob } from '../src/server/aiAnalyzeRunner';
import {
  parseFpgaArchitectResponse,
  saveFpgaArchitectProject,
  buildFpgaArchitectRetryPrompt,
  buildFpgaArchitectJsonRepairPrompt,
  buildFpgaArchitectCompactRetryPrompt,
  buildFpgaArchitectMarkdownReport,
} from '../src/server/fpgaArchitect';
import { validateGeneratedVhdlWithGhdl } from '../src/server/generatedVhdlValidation';
import { validateMacroOutput } from '../src/aiMacroValidation';
import { getAiMacroSpec, type AiMacroId } from '../src/aiMacros';
import { buildMacroPromptContract } from '../src/aiMacroPrompting';
import { analyzeProtocolFrames, analyzeWaveformHazards } from '../src/server/waveformAnalysis';
import { prepareVhdlSkillOrchestratorPrompt } from '../src/server/vhdlSkillOrchestrator';
import { getProviderDeployment, requiresRemoteExportConsent } from '../src/exportPolicy';

const execFileAsync = promisify(execFile);

type ProviderModel = { id: string; label: string };
type LlmProviderId = 'ollama';
type AiRunTelemetry = {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  tokensPerSecond: number | null;
  endToEndTokensPerSecond?: number | null;
  durationMs: number;
};
type AiRunResult = {
  text: string;
  telemetry: AiRunTelemetry;
};

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';

function isLikelyOllamaEmbeddingModel(modelId: string) {
  const id = modelId.toLowerCase();
  return (
    id.includes('embed') ||
    id.includes('embedding') ||
    id.includes('bge-') ||
    id.includes('bge_') ||
    id.includes('rerank') ||
    id.includes('minilm') ||
    id.includes('nomic-embed') ||
    id.includes('mxbai-embed') ||
    id.includes('snowflake-arctic-embed')
  );
}

function scoreOllamaModel(modelId: string) {
  const id = modelId.toLowerCase();
  let score = 0;
  if (isLikelyOllamaEmbeddingModel(id)) score -= 100;
  if (id.includes('coder')) score += 40;
  if (id.includes('code')) score += 20;
  if (id.includes('qwen')) score += 12;
  if (id.includes('llama')) score += 10;
  if (id.includes('deepseek')) score += 10;
  if (id.includes('gemma')) score += 8;
  if (id.includes('claude')) score += 8;
  if (id.includes('instruct')) score += 8;
  if (id.includes('chat')) score += 6;
  return score;
}

function getProviderDescriptors() {
  return [
    {
      id: 'ollama',
      label: 'Ollama Local',
      enabled: true,
      reason: `Uses ${OLLAMA_BASE_URL}`,
      deployment: 'local' as const,
    },
  ];
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }
  return response.json();
}

function isAbortError(error: unknown) {
  const message = String((error as any)?.message || error || '').toLowerCase();
  return (
    (error as any)?.name === 'AbortError' ||
    message.includes('aborterror') ||
    message.includes('aborted') ||
    message.includes('request was cancelled')
  );
}

function isLikelyConnectivityError(error: unknown) {
  const message = String((error as any)?.message || error || '').toLowerCase();
  return (
    message.includes('fetch failed') ||
    message.includes('econnrefused') ||
    message.includes('ehostunreach') ||
    message.includes('enotfound') ||
    message.includes('timed out') ||
    message.includes('socket hang up') ||
    message.includes('networkerror')
  );
}

async function canReachOllamaApi() {
  try {
    await fetchJson(`${OLLAMA_BASE_URL}/api/tags`);
    return true;
  } catch {
    return false;
  }
}

function isLikelyOllamaChatModel(modelId: string) {
  const id = modelId.toLowerCase();
  return id.includes('thinking') || id.includes('instruct') || id.includes('chat') || id.includes('claude');
}

function shouldDisableOllamaThinking(modelId: string) {
  const id = modelId.toLowerCase();
  return id.includes('thinking') || id.includes(':think') || id.includes('/think');
}

function summarizePayloadShape(data: any) {
  if (!data || typeof data !== 'object') {
    return `non-object payload (${typeof data})`;
  }
  const topLevelKeys = Object.keys(data).slice(0, 12);
  return `keys=${topLevelKeys.join(', ') || 'none'}`;
}

function extractOllamaGeneratedText(data: any) {
  if (!data || typeof data !== 'object') {
    return '';
  }
  if (typeof data.response === 'string' && data.response.trim()) {
    return data.response.trim();
  }
  if (typeof data.message?.content === 'string' && data.message.content.trim()) {
    return data.message.content.trim();
  }
  if (Array.isArray(data.message?.content)) {
    const text = data.message.content
      .map((item: any) => typeof item === 'string' ? item : (typeof item?.text === 'string' ? item.text : ''))
      .join('\n')
      .trim();
    if (text) return text;
  }
  return '';
}

async function runOllamaGenerate(model: string, prompt: string, signal?: AbortSignal) {
  const data = await fetchJson(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      ...(shouldDisableOllamaThinking(model) ? { think: false } : {}),
    }),
  });
  const responseText = extractOllamaGeneratedText(data);
  if (!responseText) {
    throw new Error(`Ollama returned no generated text for model "${model}" via /api/generate. Payload summary: ${summarizePayloadShape(data)}`);
  }
  return {
    text: responseText,
    usage: {
      inputTokens: typeof data?.prompt_eval_count === 'number' ? data.prompt_eval_count : undefined,
      outputTokens: typeof data?.eval_count === 'number' ? data.eval_count : undefined,
      totalTokens: typeof data?.prompt_eval_count === 'number' && typeof data?.eval_count === 'number'
        ? data.prompt_eval_count + data.eval_count
        : undefined,
      tokensPerSecond: typeof data?.eval_count === 'number' && typeof data?.eval_duration === 'number' && data.eval_duration > 0
        ? Number((data.eval_count / (data.eval_duration / 1_000_000_000)).toFixed(2))
        : undefined,
    },
  };
}

async function runOllamaChat(model: string, prompt: string, signal?: AbortSignal) {
  const data = await fetchJson(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      ...(shouldDisableOllamaThinking(model) ? { think: false } : {}),
    }),
  });
  const responseText = extractOllamaGeneratedText(data);
  if (!responseText) {
    throw new Error(`Ollama returned no generated text for model "${model}" via /api/chat. Payload summary: ${summarizePayloadShape(data)}`);
  }
  return {
    text: responseText,
    usage: {
      inputTokens: typeof data?.prompt_eval_count === 'number' ? data.prompt_eval_count : undefined,
      outputTokens: typeof data?.eval_count === 'number' ? data.eval_count : undefined,
      totalTokens: typeof data?.prompt_eval_count === 'number' && typeof data?.eval_count === 'number'
        ? data.prompt_eval_count + data.eval_count
        : undefined,
      tokensPerSecond: typeof data?.eval_count === 'number' && typeof data?.eval_duration === 'number' && data.eval_duration > 0
        ? Number((data.eval_count / (data.eval_duration / 1_000_000_000)).toFixed(2))
        : undefined,
    },
  };
}

async function runModelAnalysis(params: {
  ai: null;
  provider: LlmProviderId;
  model: string;
  prompt: string;
  signal?: AbortSignal;
}): Promise<AiRunResult> {
  const { provider, model, prompt, signal } = params;
  const startedAt = Date.now();
  console.log(`[harness] runModelAnalysis start provider=${provider} model=${model} promptChars=${prompt.length}`);

  const finalizeResult = (
    text: string,
    usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number; tokensPerSecond?: number },
  ) => {
    const durationMs = Math.max(1, Date.now() - startedAt);
    const inputTokens = typeof usage?.inputTokens === 'number' ? Math.max(0, usage.inputTokens) : null;
    const outputTokens = typeof usage?.outputTokens === 'number' ? Math.max(0, usage.outputTokens) : null;
    const totalTokens = typeof usage?.totalTokens === 'number'
      ? Math.max(0, usage.totalTokens)
      : inputTokens !== null && outputTokens !== null
        ? inputTokens + outputTokens
        : null;
    const endToEndTokensPerSecond = outputTokens !== null && durationMs > 0
      ? Number((outputTokens / (durationMs / 1000)).toFixed(2))
      : null;
    return {
      text,
      telemetry: {
        inputTokens,
        outputTokens,
        totalTokens,
        tokensPerSecond: typeof usage?.tokensPerSecond === 'number' && Number.isFinite(usage.tokensPerSecond)
          ? Math.max(0, usage.tokensPerSecond)
          : null,
        endToEndTokensPerSecond,
        durationMs,
      },
    };
  };

  if (provider !== 'ollama') {
    throw new Error(`Unsupported provider in harness: ${provider}`);
  }

  try {
    const strategies = isLikelyOllamaChatModel(model)
      ? [
          () => runOllamaChat(model, prompt, signal),
          () => runOllamaGenerate(model, prompt, signal),
        ]
      : [
          () => runOllamaGenerate(model, prompt, signal),
          () => runOllamaChat(model, prompt, signal),
        ];

    let lastError: unknown = null;
    for (const attempt of strategies) {
      try {
        const result = await attempt();
        console.log(`[harness] runModelAnalysis success model=${model} durationMs=${Date.now() - startedAt}`);
        return finalizeResult(result.text, result.usage);
      } catch (error) {
        if (isAbortError(error)) throw error;
        lastError = error;
        console.log(`[harness] runModelAnalysis strategy failed model=${model}: ${String((error as any)?.message || error)}`);
      }
    }
    throw lastError instanceof Error ? lastError : new Error(`Ollama text generation failed for model "${model}".`);
  } catch (error: any) {
    if (isLikelyConnectivityError(error)) {
      const reachable = await canReachOllamaApi();
      if (reachable) {
        throw new Error(`Ollama is reachable at ${OLLAMA_BASE_URL}, but text generation failed for model "${model}". Original error: ${String(error?.message || error)}`);
      }
      throw new Error(`Ollama Local is selected, but ${OLLAMA_BASE_URL} is unreachable.`);
    }
    throw error;
  }
}

async function normalizeFilesystemPath(targetPath: string) {
  const resolvedPath = path.resolve(targetPath.trim());
  try {
    return await fs.realpath(resolvedPath);
  } catch {
    return resolvedPath;
  }
}

function isPathWithinRoot(candidatePath: string, rootPath: string) {
  const relativePath = path.relative(rootPath, candidatePath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

function shouldSkipProjectEntry(name: string) {
  return ['.git', 'node_modules', 'dist', 'build', '.next', '.automata-logicpro'].includes(name);
}

async function listProjectFilesLimited(rootPath: string, currentPath: string, state: { count: number }, limit = 2000): Promise<Array<{
  path: string;
  name: string;
  extension: string;
  size: number;
  type: string;
  lastModified: number;
}>> {
  if (state.count >= limit) return [];
  const entries = await fs.readdir(currentPath, { withFileTypes: true });
  const files: Array<{ path: string; name: string; extension: string; size: number; type: string; lastModified: number }> = [];

  for (const entry of entries) {
    if (state.count >= limit) break;
    if (shouldSkipProjectEntry(entry.name)) continue;
    const absolutePath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listProjectFilesLimited(rootPath, absolutePath, state, limit));
      continue;
    }
    const stat = await fs.stat(absolutePath);
    const relativePath = path.relative(rootPath, absolutePath) || entry.name;
    files.push({
      path: relativePath,
      name: entry.name,
      extension: entry.name.includes('.') ? `.${entry.name.split('.').pop()?.toLowerCase()}` : '',
      size: stat.size,
      type: 'file',
      lastModified: stat.mtimeMs,
    });
    state.count += 1;
  }

  return files.sort((left, right) => left.path.localeCompare(right.path));
}

async function listProjectFiles(rootPath: string) {
  return listProjectFilesLimited(rootPath, rootPath, { count: 0 });
}

async function buildProjectContextFromPath(projectPath: string, query: string) {
  const files = await listProjectFiles(projectPath);
  const normalizedTerms = query
    .toLowerCase()
    .split(/[^a-z0-9_./-]+/i)
    .filter((term) => term.length >= 3);
  const preferredExtensions = new Set(['.vhd', '.vhdl', '.md', '.txt', '.json']);
  const scoredFiles = files
    .map((file) => {
      let score = 0;
      if (preferredExtensions.has(file.extension)) score += 4;
      const haystack = `${file.path} ${file.name}`.toLowerCase();
      normalizedTerms.forEach((term) => {
        if (haystack.includes(term)) score += 2;
      });
      return { file, score };
    })
    .sort((left, right) => right.score - left.score || left.file.path.localeCompare(right.file.path));

  const excerpts: Array<{ path: string; content: string }> = [];
  let totalBytes = 0;
  for (const candidate of scoredFiles.slice(0, 12)) {
    if (candidate.score <= 0 || candidate.file.size > 120_000) continue;
    const absolutePath = path.join(projectPath, candidate.file.path);
    const content = (await fs.readFile(absolutePath, 'utf8')).slice(0, 12_000);
    totalBytes += content.length;
    if (totalBytes > 48_000) break;
    excerpts.push({ path: candidate.file.path, content });
  }

  return {
    name: path.basename(projectPath),
    fileCount: files.length,
    filePaths: files.slice(0, 80).map((file) => file.path),
    excerpts,
  };
}

async function applyMandatoryVhdlSkill(taskPrompt: string) {
  return prepareVhdlSkillOrchestratorPrompt(taskPrompt, process.cwd());
}

function formatValidationFailureDetails(validation: ReturnType<typeof validateMacroOutput>) {
  const failedChecks = validation.checks.filter((check) => check.status === 'fail');
  if (failedChecks.length === 0) return validation.summary;
  return failedChecks.map((check) => `${check.label}: ${check.detail}`).join(' | ');
}

async function chooseBestOllamaModel() {
  if (process.env.HARNESS_OLLAMA_MODEL?.trim()) {
    return process.env.HARNESS_OLLAMA_MODEL.trim();
  }
  const data = await fetchJson(`${OLLAMA_BASE_URL}/api/tags`);
  const models = Array.isArray((data as any).models) ? (data as any).models : [];
  const choices: ProviderModel[] = models
    .map((model: any) => ({ id: model.name, label: model.name }))
    .filter((model) => !isLikelyOllamaEmbeddingModel(model.id))
    .sort((left, right) => {
      const delta = scoreOllamaModel(right.id) - scoreOllamaModel(left.id);
      return delta || left.label.localeCompare(right.label);
    });
  if (choices.length === 0) {
    throw new Error('No Ollama text-generation models were found.');
  }
  return choices[0].id;
}

async function ensureCleanProjectRoot(projectRoot: string) {
  await fs.rm(projectRoot, { recursive: true, force: true });
  await fs.mkdir(projectRoot, { recursive: true });
}

async function main() {
  const userQuery = 'Design a synthesizable 8-bit ALU in VHDL with operations add, subtract, AND, OR, XOR, shift-left, shift-right, carry, zero, and overflow flags, plus a self-checking VHDL testbench that fully verifies the operations under GHDL.';
  const projectRoot = path.join(process.cwd(), 'tmp', 'fpga-architect-alu-e2e');
  await ensureCleanProjectRoot(projectRoot);

  const sessionManager = createSessionManager({ cookieName: 'logicpro-session-id' });
  const session = sessionManager.getOrCreateSession(undefined);
  const approvedRoot = await normalizeFilesystemPath(projectRoot);
  sessionManager.setApprovedRoot(session, approvedRoot);

  const model = await chooseBestOllamaModel();
  console.log(`Using model: ${model}`);
  console.log(`Project root: ${approvedRoot}`);
  console.log('[harness] preparing AI analyze request');

  const prepared = await prepareAiAnalyzeRequest({
    provider: 'ollama',
    signals: [],
    query: userQuery,
    model,
    timeUnit: 'ns',
    tickDuration: 1,
    projectContext: null,
    projectPath: approvedRoot,
    workspaceFileName: null,
    simulationMacroContext: null,
    macroId: 'fpga_vhdl_architect' satisfies AiMacroId,
    session,
    sessionManager,
    getProviderDeployment,
    requiresRemoteExportConsent,
    assertApprovedProjectPath: async (activeSession, candidatePath, label = 'Project path') => {
      const normalizedPath = await normalizeFilesystemPath(candidatePath);
      return sessionManager.assertApprovedPath(activeSession, normalizedPath, label, isPathWithinRoot);
    },
    analyzeWaveformHazards,
    analyzeProtocolFrames,
    getAiMacroSpec,
    getOrBuildMacroSignalIndex: async () => ({ rootEntity: '', reachableEntities: [], entityHierarchy: [], entityDepths: {}, entityRoles: {} }),
    selectMacroSignals: () => ({ selectedSignals: [], selectedSignalInsights: [], focusEntities: [], desiredCategories: [] }),
    getSignalName: (signal: any) => String(signal?.name || signal?.id || 'unnamed'),
    formatSignalValue: (value: any) => String(value),
    buildSignalTransitionSummary: () => 'No captured samples.',
    buildProjectContextFromPath,
    scrubProjectContextForRemoteExport: (context) => ({ context, redactionNotes: [] }),
    buildMacroPromptContract,
  });
  console.log('[harness] prepared request, starting runAiAnalyzeJob');

  const result = await runAiAnalyzeJob({
    ai: null,
    selectedProvider: 'ollama',
    selectedModel: model,
    macroId: 'fpga_vhdl_architect',
    tbGenerationMode: null,
    systemPrompt: prepared.systemPrompt,
    normalizedProjectPath: prepared.normalizedProjectPath,
    artifactDirectory: prepared.artifactDirectory,
    macroSpec: prepared.macroSpec,
    hazardFindings: prepared.hazardScan.findings,
    protocolFrames: prepared.protocolScan.frames,
    session,
    sessionManager,
    signal: undefined,
    getProviderDescriptors,
    buildMacroPromptContract,
    userQuery,
    preparedPrompt: null,
    applyMandatoryVhdlSkill,
    runModelAnalysis,
    validateMacroOutput,
    buildArtifactRetryPrompt: () => {
      throw new Error('Artifact retry prompt should not be used for FPGA Architect.');
    },
    buildValidationRetryPrompt: ({ originalPrompt, macroId, validationSummary, validationWarnings }) => {
      const warningLines = validationWarnings.length > 0
        ? validationWarnings.map((warning) => `- ${warning}`).join('\n')
        : '- The required macro structure was not satisfied.';
      const macroSpec = getAiMacroSpec(macroId);
      return `${originalPrompt}

### Automatic Retry: Strict ${macroSpec.label} Validation Repair
Your previous response failed the ${macroSpec.label} macro validation.

Validation summary:
${validationSummary}

Validation issues:
${warningLines}

You must now repair the response so that all required sections are present and the macro contract is fully satisfied.`;
    },
    extractGeneratedVhdlArtifacts: () => [],
    saveGeneratedVhdlArtifacts: async () => ({ outputDirectory: '', savedArtifacts: [] }),
    formatValidationFailureDetails,
    parseFpgaArchitectResponse,
    buildFpgaArchitectRetryPrompt,
    buildFpgaArchitectJsonRepairPrompt,
    buildFpgaArchitectCompactRetryPrompt,
    saveFpgaArchitectProject,
    buildFpgaArchitectMarkdownReport,
    validateGeneratedVhdlWithGhdl,
  });

  console.log(JSON.stringify({
    provider: result.provider,
    model: result.model,
    outputDirectory: result.outputDirectory,
    retryUsed: result.retryUsed,
    validation: result.validation,
    telemetry: result.telemetry,
    deterministicSkillSelection: result.deterministicSkillSelection,
  }, null, 2));

  console.log('\n=== ANALYSIS START ===\n');
  console.log(result.analysis);
  console.log('\n=== ANALYSIS END ===');
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exitCode = 1;
});
