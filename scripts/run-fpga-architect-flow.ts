import fs from 'fs/promises';
import path from 'path';
import { createSessionManager } from '../src/server/sessionManager.ts';
import { prepareAiAnalyzeRequest } from '../src/server/aiAnalyzePreparation.ts';
import { runAiAnalyzeJob } from '../src/server/aiAnalyzeRunner.ts';
import { runFpgaArchitectStressLoop } from '../src/server/fpgaArchitectStressLoop.ts';
import { validateGeneratedVhdlWithGhdl } from '../src/server/generatedVhdlValidation.ts';
import {
  FPGA_VHDL_ARCHITECT_SYSTEM_PROMPT,
  buildFpgaArchitectCompactRetryPrompt,
  buildFpgaArchitectTestRunPrompt,
  buildFpgaArchitectJsonRepairPrompt,
  buildFpgaArchitectMarkdownReport,
  buildFpgaArchitectRetryPrompt,
  parseFpgaArchitectResponse,
  saveFpgaArchitectProject,
} from '../src/server/fpgaArchitect.ts';
import { prepareVhdlSkillOrchestratorPrompt } from '../src/server/vhdlSkillOrchestrator.ts';
import { getProviderDeployment, requiresRemoteExportConsent, scrubProjectContextForRemoteExport } from '../src/exportPolicy.ts';
import { buildMacroPromptContract } from '../src/aiMacroPrompting.ts';
import { getAiMacroSpec } from '../src/aiMacros.ts';
import { validateMacroOutput } from '../src/aiMacroValidation.ts';
import { filterArchitectReferenceFiles } from '../src/fpgaArchitectContext.ts';

type ProviderDescriptor = {
  id: string;
  label: string;
  enabled: boolean;
  reason?: string;
  deployment: 'local' | 'remote';
};

type ProjectFileEntry = {
  path: string;
  name: string;
  extension: string;
  size: number;
  type: string;
  lastModified: number;
};

type ParsedArgs = {
  projectPath: string;
  provider: string;
  model: string;
  attempts: number;
  projectName: string;
  targetFpga: string;
  clockHz: string;
  resetStyle: string;
  userRequest: string;
};

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = 'charaf/qwen3.6-35b-a3b-coding-nvfp4-mlx-latest-latest-latest-latest-latest-latest:latest';

function parseArgs(argv: string[]): ParsedArgs {
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token?.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      values.set(key, 'true');
      continue;
    }
    values.set(key, next);
    index += 1;
  }

  const projectPath = path.resolve(values.get('project') || 'FPGA Projects/ALU');
  const provider = values.get('provider') || 'ollama';
  const model = values.get('model') || DEFAULT_MODEL;
  const attempts = Math.min(20, Math.max(1, Number.parseInt(values.get('attempts') || '10', 10) || 10));
  const projectName = values.get('project-name') || 'fpga_vhdl_project';
  const targetFpga = values.get('target-fpga') || 'Generic portable FPGA';
  const clockHz = values.get('clock') || '100 MHz';
  const resetStyle = values.get('reset') || 'Synchronous active-high reset';
  const userRequest = values.get('prompt') || [
    'Design an 8-bit ALU in VHDL.',
    'Support add, subtract, AND, OR, XOR, NOT, shift-left, and shift-right operations.',
    'Expose zero, carry, and overflow flags.',
    'Generate a self-checking GHDL-compatible VHDL testbench and simulation collateral.',
  ].join(' ');

  return {
    projectPath,
    provider,
    model,
    attempts,
    projectName,
    targetFpga,
    clockHz,
    resetStyle,
    userRequest,
  };
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

function summarizePayloadShape(data: any) {
  if (!data || typeof data !== 'object') {
    return `non-object payload (${typeof data})`;
  }

  const topLevelKeys = Object.keys(data).slice(0, 12);
  const summaryParts = [`keys=${topLevelKeys.join(', ') || 'none'}`];
  if (typeof data.model === 'string') {
    summaryParts.push(`model=${data.model}`);
  }
  if (typeof data.done === 'boolean') {
    summaryParts.push(`done=${String(data.done)}`);
  }
  if (typeof data.done_reason === 'string') {
    summaryParts.push(`done_reason=${data.done_reason}`);
  }
  if (typeof data.response === 'string') {
    summaryParts.push(`response_length=${data.response.trim().length}`);
  }
  if (typeof data.message === 'object' && data.message !== null) {
    summaryParts.push(`message_keys=${Object.keys(data.message).slice(0, 8).join(', ') || 'none'}`);
    if (typeof data.message.content === 'string') {
      summaryParts.push(`message_content_length=${data.message.content.trim().length}`);
    }
  }
  return summaryParts.join('; ');
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
    const contentText = data.message.content
      .map((item: any) => {
        if (typeof item === 'string') return item;
        if (typeof item?.text === 'string') return item.text;
        return '';
      })
      .join('\n')
      .trim();
    if (contentText) return contentText;
  }
  if (Array.isArray(data.content)) {
    const contentText = data.content
      .map((item: any) => {
        if (typeof item === 'string') return item;
        if (typeof item?.text === 'string') return item.text;
        return '';
      })
      .join('\n')
      .trim();
    if (contentText) return contentText;
  }
  return '';
}

function isLikelyOllamaChatModel(modelId: string) {
  const id = modelId.toLowerCase();
  return id.includes('thinking') || id.includes('instruct') || id.includes('chat') || id.includes('claude');
}

function shouldDisableOllamaThinking(modelId: string) {
  const id = modelId.toLowerCase();
  return id.includes('thinking') || id.includes(':think') || id.includes('/think');
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
  provider: string;
  model: string;
  prompt: string;
  signal?: AbortSignal;
}) {
  const { provider, model, prompt, signal } = params;
  const startedAt = Date.now();
  const finalizeResult = (text: string, usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    tokensPerSecond?: number;
  }) => {
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
    throw new Error(`This runner currently supports only Ollama. Received provider "${provider}".`);
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
        return finalizeResult(result.text, result.usage);
      } catch (error) {
        if (isAbortError(error)) throw error;
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error(`Ollama text generation failed for model "${model}".`);
  } catch (error: any) {
    if (isLikelyConnectivityError(error)) {
      const apiReachable = await canReachOllamaApi();
      if (apiReachable) {
        throw new Error(`Ollama is reachable at ${OLLAMA_BASE_URL}, but text generation failed for model "${model}" across both chat/generate attempts. Original error: ${String(error?.message || error)}`);
      }
      throw new Error(`Ollama Local is selected, but ${OLLAMA_BASE_URL} is unreachable.`);
    }
    throw error;
  }
}

function shouldSkipProjectEntry(name: string) {
  return ['.git', 'node_modules', 'dist', 'build', '.next', '.automata-logicpro'].includes(name);
}

async function listProjectFiles(rootPath: string, currentPath = rootPath, state = { count: 0 }, limit = 2000): Promise<ProjectFileEntry[]> {
  if (state.count >= limit) {
    return [];
  }
  const entries = await fs.readdir(currentPath, { withFileTypes: true });
  const files: ProjectFileEntry[] = [];

  for (const entry of entries) {
    if (state.count >= limit) break;
    if (shouldSkipProjectEntry(entry.name)) continue;

    const absolutePath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listProjectFiles(rootPath, absolutePath, state, limit));
      continue;
    }

    const stat = await fs.stat(absolutePath);
    files.push({
      path: path.relative(rootPath, absolutePath) || entry.name,
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

async function buildFilteredArchitectProjectContext(projectPath: string, query: string) {
  const files = filterArchitectReferenceFiles(await listProjectFiles(projectPath), { allowGeneratedReuse: false });

  return {
    name: path.basename(projectPath),
    fileCount: files.length,
    filePaths: files.slice(0, 40).map((file) => file.path),
    excerpts: [] as Array<{ path: string; content: string }>,
  };
}

function buildArchitectPrompt(params: Pick<ParsedArgs, 'projectName' | 'projectPath' | 'targetFpga' | 'clockHz' | 'resetStyle' | 'userRequest'>) {
  return [
    `Project name: "${params.projectName}".`,
    `Use the currently selected project folder as the save root: ${params.projectPath}. Create the generated project under that folder.`,
    `Target FPGA / board: ${params.targetFpga}.`,
    `Preferred clock: ${params.clockHz}.`,
    `Reset style: ${params.resetStyle}.`,
    'Interface preferences: choose clean, maintainable interfaces based on the requirement.',
    'Generate a self-checking VHDL testbench.',
    'Generate GHDL scripts, analysis order, and simulation instructions.',
    'Return a compact Markdown project manifest with one "# FILE:" block per generated file and a fenced full file body for each file.',
    'Split documentation and metadata into short files: a project overview, a top-level architecture note, unit-level notes for major entities/packages, a short verification note, and a short GHDL plan JSON file.',
    'Ignore generated project folders by default and generate from the stated requirements only unless I explicitly ask to reuse existing generated files.',
    'Produce a complete FPGA/VHDL project with requirements notes, architecture documentation, synthesizable VHDL RTL, testbench, simulation scripts, constraints placeholder, and design report.',
    'Keep the project maintainable, GHDL-friendly, and explicit about assumptions and warnings.',
    '',
    'User design request:',
    params.userRequest,
  ].join('\n\n');
}

function getProviderDescriptors(): ProviderDescriptor[] {
  return [
    {
      id: 'ollama',
      label: 'Ollama Local',
      enabled: true,
      reason: `Uses ${OLLAMA_BASE_URL}`,
      deployment: 'local',
    },
  ];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sessionManager = createSessionManager({ cookieName: 'logicpro-session-id' });
  const session = sessionManager.getOrCreateSession(undefined);
  sessionManager.setApprovedRoot(session, args.projectPath);

  const explicitProjectContext = await buildFilteredArchitectProjectContext(args.projectPath, args.userRequest);
  const userQuery = buildArchitectPrompt(args);

  const result = await runFpgaArchitectStressLoop({
    ai: null,
    selectedProvider: args.provider,
    selectedModel: args.model,
    userQuery,
    projectPath: args.projectPath,
    session,
    sessionManager,
    prepareAiAnalyzeRequest: async (params) => prepareAiAnalyzeRequest({
      ...(params as any),
      projectContext: explicitProjectContext,
    }),
    runAiAnalyzeJob,
    getProviderDeployment,
    requiresRemoteExportConsent,
    assertApprovedProjectPath: async (targetSession, candidatePath, label = 'Project folder') => {
      return sessionManager.assertApprovedPath(targetSession, path.resolve(candidatePath), label, (candidate, root) => {
        const relativePath = path.relative(root, candidate);
        return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
      });
    },
    analyzeWaveformHazards: () => ({ markdown: '', findings: [] }),
    analyzeProtocolFrames: () => ({ markdown: '', frames: [] }),
    getAiMacroSpec,
    getOrBuildMacroSignalIndex: async () => null,
    selectMacroSignals: () => ({ selectedSignals: [], selectedSignalInsights: [], focusEntities: [], desiredCategories: [] }),
    getSignalName: () => '',
    formatSignalValue: (value: number | string) => String(value),
    buildSignalTransitionSummary: () => '',
    buildProjectContextFromPath: async () => explicitProjectContext,
    scrubProjectContextForRemoteExport,
    getProviderDescriptors,
    buildMacroPromptContract,
    applyMandatoryVhdlSkill: async (taskPrompt: string) => prepareVhdlSkillOrchestratorPrompt(taskPrompt, process.cwd()),
    runModelAnalysis: async ({ provider, model, prompt, signal }) => runModelAnalysis({
      provider,
      model,
      prompt,
      signal,
    }),
    validateMacroOutput,
    buildArtifactRetryPrompt: () => {
      throw new Error('Artifact retry prompt is not used in FPGA Architect mode.');
    },
    buildValidationRetryPrompt: () => {
      throw new Error('Validation retry prompt is not used in FPGA Architect mode.');
    },
    extractGeneratedVhdlArtifacts: () => [],
    saveGeneratedVhdlArtifacts: async () => {
      throw new Error('Generated artifact saving is not used in FPGA Architect mode.');
    },
    formatValidationFailureDetails: (validation) => validation.summary || 'validation failed',
    parseFpgaArchitectResponse,
    buildFpgaArchitectRetryPrompt,
    buildFpgaArchitectJsonRepairPrompt,
    buildFpgaArchitectCompactRetryPrompt,
    buildFpgaArchitectTestRunPrompt,
    saveFpgaArchitectProject,
    buildFpgaArchitectMarkdownReport,
    validateGeneratedVhdlWithGhdl,
    onProgress: ({ currentLoop, totalLoops }) => {
      console.log(`[loop] ${currentLoop}/${totalLoops}`);
    },
  });

  const logTail = (await fs.readFile(result.logFilePath, 'utf8'))
    .trim()
    .split('\n')
    .slice(-40)
    .join('\n');

  console.log(JSON.stringify({
    projectPath: args.projectPath,
    provider: args.provider,
    model: args.model,
    attempts: result.attempts,
    failures: result.failures,
    successes: result.successes,
    stoppedEarly: result.stoppedEarly,
    failureBuckets: result.failureBuckets,
    logFilePath: result.logFilePath,
  }, null, 2));
  console.log('\n--- LOG TAIL ---\n');
  console.log(logTail);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
