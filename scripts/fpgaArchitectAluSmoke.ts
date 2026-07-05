import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { createSessionManager } from '../src/server/sessionManager.ts';
import { getAiMacroSpec } from '../src/aiMacros.ts';
import { buildMacroPromptContract } from '../src/aiMacroPrompting.ts';
import { validateMacroOutput } from '../src/aiMacroValidation.ts';
import { buildMacroSystemPrompt } from '../src/server/macroSystemPrompts.ts';
import {
  buildFpgaArchitectCompactRetryPrompt,
  buildFpgaArchitectJsonRepairPrompt,
  buildFpgaArchitectMarkdownReport,
  buildFpgaArchitectRetryPrompt,
  parseFpgaArchitectResponse,
  saveFpgaArchitectProject,
} from '../src/server/fpgaArchitect.ts';
import { validateGeneratedVhdlWithGhdl } from '../src/server/generatedVhdlValidation.ts';
import { runAiAnalyzeJob } from '../src/server/aiAnalyzeRunner.ts';
import { prepareVhdlSkillOrchestratorPrompt } from '../src/server/vhdlSkillOrchestrator.ts';

type OllamaUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  tokensPerSecond?: number;
};

type AiRunResult = {
  text: string;
  telemetry: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
    tokensPerSecond: number | null;
    endToEndTokensPerSecond: number | null;
    durationMs: number;
  };
};

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const MODEL = process.env.LOGICPRO_SMOKE_MODEL || 'charaf/qwen3.6-35b-a3b-coding-nvfp4-mlx-latest-latest-latest-latest-latest-latest:latest';
const USER_QUERY = process.env.LOGICPRO_SMOKE_QUERY || [
  'Design an 8-bit ALU in VHDL.',
  'Include add, subtract, and, or, xor, xnor, not, shift-left, shift-right, and equality-test support.',
  'Generate synthesizable RTL, a package if needed, a self-checking VHDL-2008 GHDL-compatible testbench, a GHDL plan, and concise architecture/verification notes.',
  'Use safe VHDL identifiers only. Do not use reserved words or operator keywords as enum literals, constants, packages, signals, variables, procedure arguments, or helper names.',
  'The project must pass GHDL analyze, elaborate, and simulate as generated.',
].join(' ');

function isLikelyOllamaChatModel(modelId: string) {
  const id = modelId.toLowerCase();
  return id.includes('thinking') || id.includes('instruct') || id.includes('chat') || id.includes('claude');
}

function shouldDisableOllamaThinking(modelId: string) {
  const id = modelId.toLowerCase();
  return id.includes('thinking') || id.includes(':think') || id.includes('/think');
}

function extractOllamaText(data: any) {
  if (typeof data?.response === 'string' && data.response.trim()) {
    return data.response.trim();
  }
  if (typeof data?.message?.content === 'string' && data.message.content.trim()) {
    return data.message.content.trim();
  }
  return '';
}

async function runOllamaGenerate(model: string, prompt: string, signal?: AbortSignal) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
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
  if (!response.ok) {
    throw new Error(`Ollama /api/generate failed with HTTP ${response.status}`);
  }
  const data = await response.json();
  const text = extractOllamaText(data);
  if (!text) {
    throw new Error(`Ollama /api/generate returned no text for model "${model}".`);
  }
  return {
    text,
    usage: {
      inputTokens: typeof data?.prompt_eval_count === 'number' ? data.prompt_eval_count : undefined,
      outputTokens: typeof data?.eval_count === 'number' ? data.eval_count : undefined,
      totalTokens:
        typeof data?.prompt_eval_count === 'number' && typeof data?.eval_count === 'number'
          ? data.prompt_eval_count + data.eval_count
          : undefined,
      tokensPerSecond:
        typeof data?.eval_count === 'number' &&
        typeof data?.eval_duration === 'number' &&
        data.eval_duration > 0
          ? Number((data.eval_count / (data.eval_duration / 1_000_000_000)).toFixed(2))
          : undefined,
    } satisfies OllamaUsage,
  };
}

async function runOllamaChat(model: string, prompt: string, signal?: AbortSignal) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
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
  if (!response.ok) {
    throw new Error(`Ollama /api/chat failed with HTTP ${response.status}`);
  }
  const data = await response.json();
  const text = extractOllamaText(data);
  if (!text) {
    throw new Error(`Ollama /api/chat returned no text for model "${model}".`);
  }
  return {
    text,
    usage: {
      inputTokens: typeof data?.prompt_eval_count === 'number' ? data.prompt_eval_count : undefined,
      outputTokens: typeof data?.eval_count === 'number' ? data.eval_count : undefined,
      totalTokens:
        typeof data?.prompt_eval_count === 'number' && typeof data?.eval_count === 'number'
          ? data.prompt_eval_count + data.eval_count
          : undefined,
      tokensPerSecond:
        typeof data?.eval_count === 'number' &&
        typeof data?.eval_duration === 'number' &&
        data.eval_duration > 0
          ? Number((data.eval_count / (data.eval_duration / 1_000_000_000)).toFixed(2))
          : undefined,
    } satisfies OllamaUsage,
  };
}

async function runModelAnalysis(params: {
  provider: string;
  model: string;
  prompt: string;
  signal?: AbortSignal;
}): Promise<AiRunResult> {
  const startedAt = Date.now();
  const finalize = (text: string, usage?: OllamaUsage): AiRunResult => {
    const durationMs = Math.max(1, Date.now() - startedAt);
    const inputTokens = typeof usage?.inputTokens === 'number' ? usage.inputTokens : null;
    const outputTokens = typeof usage?.outputTokens === 'number' ? usage.outputTokens : null;
    const totalTokens =
      typeof usage?.totalTokens === 'number'
        ? usage.totalTokens
        : inputTokens !== null && outputTokens !== null
          ? inputTokens + outputTokens
          : null;
    return {
      text,
      telemetry: {
        inputTokens,
        outputTokens,
        totalTokens,
        tokensPerSecond: typeof usage?.tokensPerSecond === 'number' ? usage.tokensPerSecond : null,
        endToEndTokensPerSecond:
          outputTokens !== null ? Number((outputTokens / (durationMs / 1000)).toFixed(2)) : null,
        durationMs,
      },
    };
  };

  if (params.provider !== 'ollama') {
    throw new Error(`Smoke harness only supports ollama, got "${params.provider}".`);
  }

  console.log(`[smoke] model request started: provider=${params.provider} model=${params.model}`);

  const strategies = isLikelyOllamaChatModel(params.model)
    ? [
        () => runOllamaChat(params.model, params.prompt, params.signal),
        () => runOllamaGenerate(params.model, params.prompt, params.signal),
      ]
    : [
        () => runOllamaGenerate(params.model, params.prompt, params.signal),
        () => runOllamaChat(params.model, params.prompt, params.signal),
      ];

  let lastError: unknown = null;
  for (const attempt of strategies) {
    try {
      const result = await attempt();
      console.log('[smoke] model request completed');
      return finalize(result.text, result.usage);
    } catch (error) {
      lastError = error;
      console.log(`[smoke] model strategy failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Ollama model run failed.');
}

async function main() {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-fpga-architect-alu-'));
  console.log(`[smoke] temp root: ${tempRoot}`);
  const sessionManager = createSessionManager({ cookieName: 'logicpro-session-id' });
  const session = sessionManager.getOrCreateSession(undefined);
  sessionManager.setApprovedRoot(session, tempRoot);

  const macroId = 'fpga_vhdl_architect' as const;
  const userQuery = USER_QUERY;

  const systemPrompt = buildMacroSystemPrompt({
    macroId,
    waveformText: '',
    protocolMarkdown: '',
    hazardMarkdown: '',
    exportPolicyText: 'Local-only provider. No remote export is allowed.',
    projectText: 'No existing reusable VHDL source files are provided. Generate the project from a clean context.',
    customQueryMode: null,
  });

  const initialTaskPrompt = `${systemPrompt}\n\n${buildMacroPromptContract({
    macroId,
    userQuery,
    tbGenerationMode: null,
  })}`;
  const preparedPrompt = await prepareVhdlSkillOrchestratorPrompt(initialTaskPrompt, process.cwd());
  console.log('[smoke] prompt prepared');

  console.log('[smoke] running FPGA Architect analyze job');
  const result = await runAiAnalyzeJob({
    ai: null,
    selectedProvider: 'ollama',
    selectedModel: MODEL,
    macroId,
    tbGenerationMode: null,
    systemPrompt,
    normalizedProjectPath: tempRoot,
    artifactDirectory: null,
    macroSpec: getAiMacroSpec(macroId),
    hazardFindings: [],
    protocolFrames: [],
    session,
    sessionManager,
    signal: undefined,
    getProviderDescriptors: () => [{ id: 'ollama', label: 'Ollama Local' }],
    buildMacroPromptContract,
    userQuery,
    preparedPrompt,
    applyMandatoryVhdlSkill: (taskPrompt: string) => prepareVhdlSkillOrchestratorPrompt(taskPrompt, process.cwd()),
    runModelAnalysis: ({ provider, model, prompt, signal }) => runModelAnalysis({ provider, model, prompt, signal }),
    validateMacroOutput,
    buildArtifactRetryPrompt: () => {
      throw new Error('Artifact retry prompt should not be used for FPGA Architect smoke runs.');
    },
    buildValidationRetryPrompt: () => {
      throw new Error('Validation retry prompt should not be used for FPGA Architect smoke runs.');
    },
    extractGeneratedVhdlArtifacts: () => [],
    saveGeneratedVhdlArtifacts: async () => {
      throw new Error('Generated VHDL artifact save should not be used for FPGA Architect smoke runs.');
    },
    formatValidationFailureDetails: (validation) => validation.summary,
    parseFpgaArchitectResponse,
    buildFpgaArchitectRetryPrompt,
    buildFpgaArchitectJsonRepairPrompt,
    buildFpgaArchitectCompactRetryPrompt,
    saveFpgaArchitectProject,
    buildFpgaArchitectMarkdownReport,
    validateGeneratedVhdlWithGhdl,
  });
  console.log('[smoke] analyze job finished');

  const summary = {
    tempRoot,
    provider: result.provider,
    model: result.model,
    retryUsed: result.retryUsed,
    telemetry: result.telemetry,
    deterministicSkillSelection: result.deterministicSkillSelection
      ? {
          registryPath: result.deterministicSkillSelection.registryPath,
          primary: result.deterministicSkillSelection.primary.name,
          supporting: result.deterministicSkillSelection.supporting.map((skill) => skill.name),
          plan: result.deterministicSkillSelection.skillCallPlan,
        }
      : null,
    generatedFiles: result.generatedFiles,
    architectOutputDirectory: result.architectProject?.outputDirectory || null,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
