import express from 'express';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import os from 'os';
import { promisify } from 'util';
import { execFile } from 'child_process';
import path from 'path';
import type { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import type { AiMacroId, AiMacroValidationResult, TbGenerationMode } from './src/aiMacros.ts';
import { getAiMacroSpec } from './src/aiMacros.ts';
import { validateMacroOutput } from './src/aiMacroValidation.ts';
import { buildMacroPromptContract } from './src/aiMacroPrompting.ts';
import { getProviderDeployment, requiresRemoteExportConsent, scrubProjectContextForRemoteExport } from './src/exportPolicy.ts';
import { createAiJobRegistry } from './src/server/aiJobRegistry.ts';
import { prepareAiAnalyzeRequest } from './src/server/aiAnalyzePreparation.ts';
import { runAiAnalyzeJob } from './src/server/aiAnalyzeRunner.ts';
import { createAiMetaRouteContext } from './src/server/aiMetaHandlers.ts';
import { createAiJobSecurityContext } from './src/server/aiJobSecurity.ts';
import { createAiAnalyzeRouteContext } from './src/server/aiAnalyzeRouteHandlers.ts';
import { createGhdlRouteContext } from './src/server/ghdlRouteHandlers.ts';
import { validateGhdlInstallRequest } from './src/server/ghdlInstallPolicy.ts';
import { createProjectRouteContext } from './src/server/projectRouteHandlers.ts';
import { buildPreparedRemoteExportPreview } from './src/server/remoteExportPreview.ts';
import { createSessionSecurityContext } from './src/server/sessionSecurity.ts';
import { prepareVhdlSkillOrchestratorPrompt } from './src/server/vhdlSkillOrchestrator.ts';
import {
  buildFpgaArchitectCompactRetryPrompt,
  buildFpgaArchitectMarkdownReport,
  buildFpgaArchitectJsonRepairPrompt,
  buildFpgaArchitectRetryPrompt,
  buildFpgaArchitectTestRunPrompt,
  parseFpgaArchitectResponse,
  saveFpgaArchitectProject,
} from './src/server/fpgaArchitect.ts';
import { validateGeneratedVhdlWithGhdl } from './src/server/generatedVhdlValidation.ts';
import {
  buildMacroSignalIndexFromFixtures,
  buildMacroSignalIndexFromParsedSources,
  buildVhdlSemanticModels,
  classifySignalName,
  extractGenerateBlocks,
  extractIdentifierReferences,
  extractInstancesFromArchitecture,
  inferEntityRole,
  normalizeVhdlIdentifier,
  selectMacroSignals,
  type MacroSignalIndex,
  type SemanticSourceFixture,
} from './src/server/macroSignalSelection.ts';
import { analyzeProtocolFrames, analyzeWaveformHazards, formatSignalValue, getSignalName, getSignalValues, normalizeLogicValue } from './src/server/waveformAnalysis.ts';

// Load environment variables
dotenv.config();

type LLMProviderId = 'gemini' | 'ollama' | 'mtplx' | 'openai' | 'anthropic' | 'openrouter' | 'groq' | 'mistral';

type ProviderDescriptor = {
  id: LLMProviderId;
  label: string;
  enabled: boolean;
  reason?: string;
  deployment: 'local' | 'remote';
};

type ProviderModel = {
  id: string;
  label: string;
};

type AnalyzerSignal = {
  id?: string;
  name?: string;
  type?: string;
  values?: Array<number | string>;
  visible?: boolean;
  config?: {
    gateType?: string;
    inputA?: string;
    inputB?: string;
    decoderType?: 'SPI' | 'I2C' | 'UART';
    clkSignalId?: string;
    dataSignalId?: string;
    csSignalId?: string;
    rxSignalId?: string;
    baudTicks?: number;
  };
};

type GeneratedVhdlArtifact = {
  fileName: string;
  content: string;
  kind: 'testbench' | 'module' | 'assertions' | 'rtl_skeleton' | 'unknown';
};

type SavedGeneratedVhdlArtifact = GeneratedVhdlArtifact & {
  path: string;
};

const activeAiJobs = createAiJobRegistry();

function extractTaggedCodeBlocks(text: string) {
  return [...text.matchAll(/```([^\n`]*)\n([\s\S]*?)```/g)].map((match) => ({
    language: match[1].trim().toLowerCase(),
    content: match[2].trim(),
    index: match.index ?? 0,
  }));
}

function looksLikeVhdlTestbench(content: string, fileName = '') {
  const normalizedName = fileName.toLowerCase();
  if (/(^|[_-])(tb|testbench)([_-]|$)/i.test(normalizedName) || normalizedName.endsWith('_tb.vhd')) {
    return true;
  }

  return (
    /\b(wait for|port map|uut\b|dut\b|stimulus|clk_process|clock process|reset process|assert\b)\b/i.test(content)
    && /\b(entity|architecture|process)\b/i.test(content)
  );
}

function sanitizeGeneratedFileBaseName(value: string) {
  return value
    .replace(/\.vhd[l]?$/i, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    || 'generated_tb';
}

function inferGeneratedVhdlFileName(block: { content: string; index: number }, fullText: string, ordinal: number) {
  const leadingText = fullText.slice(0, block.index);
  const recentLines = leadingText.split('\n').slice(-8).reverse();

  for (const line of recentLines) {
    const fileMatch = line.match(/([A-Za-z0-9_.-]+\.vhd[l]?)/i);
    if (fileMatch) {
      const base = sanitizeGeneratedFileBaseName(fileMatch[1]);
      return `${base}.vhd`;
    }
  }

  const entityMatch = block.content.match(/\bentity\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\b/i);
  if (entityMatch) {
    const base = sanitizeGeneratedFileBaseName(entityMatch[1]);
    return `${base}.vhd`;
  }

  return `generated_tb_${ordinal + 1}.vhd`;
}

function extractGeneratedVhdlArtifacts(text: string, macroId: AiMacroId): GeneratedVhdlArtifact[] {
  const blocks = extractTaggedCodeBlocks(text)
    .filter((block) => block.language.includes('vhdl') && block.content.length > 0);

  const artifacts: GeneratedVhdlArtifact[] = [];
  const seenNames = new Map<string, number>();

  blocks.forEach((block, index) => {
    const inferredName = inferGeneratedVhdlFileName(block, text, index);
    const kind = macroId === 'generate_vhdl_assertions'
      ? 'assertions'
      : macroId === 'draft_rtl_skeleton'
        ? 'rtl_skeleton'
        : looksLikeVhdlTestbench(block.content, inferredName)
          ? 'testbench'
          : 'module';
    const baseName = sanitizeGeneratedFileBaseName(inferredName);
    const collisionCount = seenNames.get(baseName) || 0;
    seenNames.set(baseName, collisionCount + 1);
    const fileName = collisionCount === 0 ? `${baseName}.vhd` : `${baseName}_${collisionCount + 1}.vhd`;

    artifacts.push({
      fileName,
      content: block.content.trimEnd(),
      kind,
    });
  });

  return artifacts;
}

function buildArtifactRetryPrompt(params: {
  originalPrompt: string;
  macroId: AiMacroId;
  tbGenerationMode: TbGenerationMode | null;
  artifactDirectory: string;
  validationSummary: string;
  validationWarnings: string[];
}) {
  const {
    originalPrompt,
    macroId,
    tbGenerationMode,
    artifactDirectory,
    validationSummary,
    validationWarnings,
  } = params;
  const warningLines = validationWarnings.length > 0
    ? validationWarnings.map((warning) => `- ${warning}`).join('\n')
    : '- No valid VHDL artifact was detected.';

  const macroLabel = getAiMacroSpec(macroId).label;
  const specificRequirements = macroId === 'generate_vhdl_tb'
    ? [
        'Return Markdown with these sections: Assumptions, Generated Artifact(s), Verification Notes.',
        'At least one generated file must be a VHDL testbench and its filename must end with `_tb.vhd`.',
        tbGenerationMode === 'reverse_from_vcd'
          ? 'Because this is reverse-from-VCD mode, include both the inferred design module and the matching testbench.'
          : 'Because this is project-entity mode, generate usable VHDL testbench file(s) for the project entities.',
      ]
    : macroId === 'generate_vhdl_assertions'
      ? [
          'Return Markdown with these sections: Assumptions, Assertions, Verification Notes.',
          'Each VHDL artifact must contain practical `assert` statements tied to the observed behavior.',
          'Generate files that belong in the project folder under "AI Generated Assertions".',
        ]
      : [
          'Return Markdown with these sections: Assumptions, Entity Skeleton, Architecture Outline, Verification Notes.',
          'The VHDL artifact must contain both an `entity` and an `architecture`.',
          'Generate files that belong in the project folder under "AI Generated RTL".',
        ];

  return `${originalPrompt}

### Automatic Retry: Strict ${macroLabel} Enforcement
Your previous response failed validation for the ${macroLabel} macro.

Validation summary:
${validationSummary}

Validation issues:
${warningLines}

You must now obey all of the following hard requirements:
1. ${specificRequirements.join('\n2. ')}
3. In the artifact section, include fenced code blocks tagged exactly as \`vhdl\`.
4. For every fenced code block, place a filename heading immediately before it in the form:
   ### filename.vhd
5. The generated files must be directly extractable and savable into "${artifactDirectory}".
6. The app will immediately compile, elaborate, and simulate the generated VHDL with GHDL. Use the exact validation summary and issues above to repair the code so the full GHDL flow passes.
7. If you generate a testbench, it must stop cleanly on success using VHDL-2008 style success termination such as \`std.env.stop(0)\`; never use \`severity failure\` to indicate a passing run.
8. Keep DUT reset behavior, reset polarity, and testbench expectations consistent. Do not assume an uninitialized power-up state when a deterministic reset or initialization is intended.
9. For synchronous checks in generated testbenches, sample outputs only after the active clock edge update has taken effect.
10. Do not return prose-only output, pseudo-code, Mermaid-only output, or untagged code fences.
11. Do not explain why you cannot comply unless the project context is genuinely missing. If you comply, output the code.
`;
}

function buildValidationRetryPrompt(params: {
  originalPrompt: string;
  macroId: AiMacroId;
  validationSummary: string;
  validationWarnings: string[];
}) {
  const { originalPrompt, macroId, validationSummary, validationWarnings } = params;
  const macroSpec = getAiMacroSpec(macroId);
  const warningLines = validationWarnings.length > 0
    ? validationWarnings.map((warning) => `- ${warning}`).join('\n')
    : '- The required macro structure was not satisfied.';

  return `${originalPrompt}

### Automatic Retry: Strict ${macroSpec.label} Validation Repair
Your previous response failed the ${macroSpec.label} macro validation.

Validation summary:
${validationSummary}

Validation issues:
${warningLines}

You must now repair the response so that all required sections are present and the macro contract is fully satisfied.
- Keep the answer grounded in the supplied waveform, deterministic scans, and project context.
- Preserve technical usefulness, but prioritize passing the macro format and artifact requirements.
- If the macro requires a Mermaid state diagram, include a fenced \`mermaid\` block using \`stateDiagram-v2\`.
- If the macro requires code, return properly tagged fenced code blocks.
`;
}

async function saveGeneratedVhdlArtifacts(params: {
  projectPath: string;
  outputFolder: string;
  artifacts: GeneratedVhdlArtifact[];
}) {
  const outputDirectory = path.join(params.projectPath, params.outputFolder);
  await fs.mkdir(outputDirectory, { recursive: true });

  const savedArtifacts: SavedGeneratedVhdlArtifact[] = [];
  for (const artifact of params.artifacts) {
    const targetPath = path.join(outputDirectory, artifact.fileName);
    const finalContent = artifact.content.endsWith('\n') ? artifact.content : `${artifact.content}\n`;
    await fs.writeFile(targetPath, finalContent, 'utf8');
    savedArtifacts.push({
      ...artifact,
      path: targetPath,
    });
  }

  return {
    outputDirectory,
    savedArtifacts,
  };
}

function buildSignalTransitionSummary(values: Array<number | string>) {
  if (!Array.isArray(values) || values.length === 0) {
    return 'No captured samples.';
  }

  let transitions = 0;
  const events: string[] = [];
  let previous = values[0];

  for (let index = 1; index < values.length; index += 1) {
    const current = values[index];
    if (current !== previous) {
      transitions += 1;
      if (events.length < 12) {
        events.push(`t${index}:${formatSignalValue(previous)}->${formatSignalValue(current)}`);
      }
      previous = current;
    }
  }

  const recentWindow = values.slice(Math.max(0, values.length - 32));
  return [
    `Transitions: ${transitions}`,
    `First value: ${formatSignalValue(values[0])}`,
    `Last value: ${formatSignalValue(values[values.length - 1])}`,
    `Sample transition events: ${events.join(', ') || 'none'}`,
    `Recent window (${recentWindow.length} ticks): ${recentWindow.map((value) => formatSignalValue(value)).join('')}`,
  ].join(' | ');
}

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

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const MTPLX_BASE_URL = process.env.MTPLX_BASE_URL || 'http://127.0.0.1:8000';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1';
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const GROQ_BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
const MISTRAL_BASE_URL = process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1';
const execFileAsync = promisify(execFile);

const STATIC_PROVIDER_MODELS: Record<LLMProviderId, ProviderModel[]> = {
  gemini: [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  ],
  ollama: [
    { id: 'qwen2.5-coder:latest', label: 'Qwen 2.5 Coder' },
    { id: 'deepseek-coder-v2:latest', label: 'DeepSeek Coder V2' },
    { id: 'llama3.1:latest', label: 'Llama 3.1' },
    { id: 'codellama:latest', label: 'Code Llama' },
  ],
  mtplx: [
    { id: 'mtplx-qwen36-27b-optimized-quality', label: 'MTPLX Qwen36 27B Optimized Quality' },
    { id: 'mtplx-qwen36-27b-optimized-speed', label: 'MTPLX Qwen36 27B Optimized Speed' },
    { id: 'youssofal--gemma4-mtplx-optimized-speed', label: 'Youssofal Gemma4 MTPLX Optimized Speed' },
  ],
  openai: [
    { id: 'gpt-5', label: 'GPT-5' },
    { id: 'gpt-5-mini', label: 'GPT-5 Mini' },
    { id: 'gpt-4.1', label: 'GPT-4.1' },
    { id: 'gpt-4o', label: 'GPT-4o' },
  ],
  anthropic: [
    { id: 'claude-opus-4-1', label: 'Claude Opus 4.1' },
    { id: 'claude-sonnet-4', label: 'Claude Sonnet 4' },
    { id: 'claude-3-7-sonnet-latest', label: 'Claude 3.7 Sonnet' },
  ],
  openrouter: [
    { id: 'openai/gpt-4o', label: 'OpenAI GPT-4o' },
    { id: 'anthropic/claude-sonnet-4', label: 'Anthropic Claude Sonnet 4' },
    { id: 'google/gemini-2.5-pro', label: 'Google Gemini 2.5 Pro' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile' },
    { id: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 Distill Llama 70B' },
    { id: 'llama3-70b-8192', label: 'Llama 3 70B 8K' },
  ],
  mistral: [
    { id: 'mistral-large-latest', label: 'Mistral Large' },
    { id: 'codestral-latest', label: 'Codestral' },
    { id: 'ministral-8b-latest', label: 'Ministral 8B' },
  ],
};

function sortProviderModels(models: ProviderModel[]) {
  return [...models].sort((left, right) => left.label.localeCompare(right.label));
}

function withStaticFallback(provider: LLMProviderId, models: ProviderModel[]) {
  return models.length > 0 ? sortProviderModels(models) : sortProviderModels(STATIC_PROVIDER_MODELS[provider] || []);
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
    {
      id: 'mtplx',
      label: 'MTPLX Local',
      enabled: true,
      reason: `Uses ${MTPLX_BASE_URL}`,
      deployment: 'local',
    },
    {
      id: 'gemini',
      label: 'Google Gemini',
      enabled: Boolean(process.env.GEMINI_API_KEY),
      reason: process.env.GEMINI_API_KEY ? 'Gemini API key detected' : 'Set GEMINI_API_KEY',
      deployment: 'remote',
    },
    {
      id: 'openai',
      label: 'OpenAI',
      enabled: Boolean(process.env.OPENAI_API_KEY),
      reason: process.env.OPENAI_API_KEY ? 'OpenAI API key detected' : 'Set OPENAI_API_KEY',
      deployment: 'remote',
    },
    {
      id: 'anthropic',
      label: 'Anthropic Claude',
      enabled: Boolean(process.env.ANTHROPIC_API_KEY),
      reason: process.env.ANTHROPIC_API_KEY ? 'Anthropic API key detected' : 'Set ANTHROPIC_API_KEY',
      deployment: 'remote',
    },
    {
      id: 'openrouter',
      label: 'OpenRouter',
      enabled: Boolean(process.env.OPENROUTER_API_KEY),
      reason: process.env.OPENROUTER_API_KEY ? 'OpenRouter API key detected' : 'Set OPENROUTER_API_KEY',
      deployment: 'remote',
    },
    {
      id: 'groq',
      label: 'Groq',
      enabled: Boolean(process.env.GROQ_API_KEY),
      reason: process.env.GROQ_API_KEY ? 'Groq API key detected' : 'Set GROQ_API_KEY',
      deployment: 'remote',
    },
    {
      id: 'mistral',
      label: 'Mistral',
      enabled: Boolean(process.env.MISTRAL_API_KEY),
      reason: process.env.MISTRAL_API_KEY ? 'Mistral API key detected' : 'Set MISTRAL_API_KEY',
      deployment: 'remote',
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

async function fetchJsonWithFallback(urls: string[], init?: RequestInit) {
  let lastError: unknown = null;
  for (const url of urls) {
    try {
      return await fetchJson(url, init);
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Request failed');
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

function getMtplxHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(process.env.MTPLX_API_KEY ? { Authorization: `Bearer ${process.env.MTPLX_API_KEY}` } : {}),
  };
}

function extractOpenAICompatibleMessageContent(data: any) {
  const rawContent = data?.choices?.[0]?.message?.content;
  if (typeof rawContent === 'string') {
    return rawContent.trim();
  }
  if (Array.isArray(rawContent)) {
    return rawContent
      .map((item: any) => {
        if (typeof item === 'string') return item;
        if (typeof item?.text === 'string') return item.text;
        return '';
      })
      .join('\n')
      .trim();
  }
  return '';
}

function isLikelyOllamaChatModel(modelId: string) {
  const id = modelId.toLowerCase();
  return (
    id.includes('thinking') ||
    id.includes('instruct') ||
    id.includes('chat') ||
    id.includes('claude')
  );
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
    throw new Error(
      `Ollama returned no generated text for model "${model}" via /api/generate. Payload summary: ${summarizePayloadShape(data)}`
    );
  }
  return {
    text: responseText,
    usage: {
      inputTokens: typeof data?.prompt_eval_count === 'number' ? data.prompt_eval_count : undefined,
      outputTokens: typeof data?.eval_count === 'number' ? data.eval_count : undefined,
      totalTokens: typeof data?.prompt_eval_count === 'number' && typeof data?.eval_count === 'number'
        ? data.prompt_eval_count + data.eval_count
        : undefined,
      tokensPerSecond: (
        typeof data?.eval_count === 'number'
        && typeof data?.eval_duration === 'number'
        && data.eval_duration > 0
      )
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
      messages: [
        { role: 'user', content: prompt },
      ],
      stream: false,
      ...(shouldDisableOllamaThinking(model) ? { think: false } : {}),
    }),
  });
  const responseText = extractOllamaGeneratedText(data);
  if (!responseText) {
    throw new Error(
      `Ollama returned no generated text for model "${model}" via /api/chat. Payload summary: ${summarizePayloadShape(data)}`
    );
  }
  return {
    text: responseText,
    usage: {
      inputTokens: typeof data?.prompt_eval_count === 'number' ? data.prompt_eval_count : undefined,
      outputTokens: typeof data?.eval_count === 'number' ? data.eval_count : undefined,
      totalTokens: typeof data?.prompt_eval_count === 'number' && typeof data?.eval_count === 'number'
        ? data.prompt_eval_count + data.eval_count
        : undefined,
      tokensPerSecond: (
        typeof data?.eval_count === 'number'
        && typeof data?.eval_duration === 'number'
        && data.eval_duration > 0
      )
        ? Number((data.eval_count / (data.eval_duration / 1_000_000_000)).toFixed(2))
        : undefined,
    },
  };
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
  if (Array.isArray(data.messages)) {
    summaryParts.push(`messages=${data.messages.length}`);
  }
  if (Array.isArray(data.content)) {
    summaryParts.push(`content_items=${data.content.length}`);
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
    if (contentText) {
      return contentText;
    }
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
    if (contentText) {
      return contentText;
    }
  }

  if (Array.isArray(data.messages)) {
    const contentText = data.messages
      .map((message: any) => {
        if (typeof message?.content === 'string') return message.content;
        if (Array.isArray(message?.content)) {
          return message.content
            .map((item: any) => {
              if (typeof item === 'string') return item;
              if (typeof item?.text === 'string') return item.text;
              return '';
            })
            .join('\n');
        }
        return '';
      })
      .join('\n')
      .trim();
    if (contentText) {
      return contentText;
    }
  }

  return '';
}

function normalizeLlmTestResponse(text: string) {
  const withoutThinkBlocks = text.replace(/<think>[\s\S]*?<\/think>/gi, ' ');
  const withoutCodeFences = withoutThinkBlocks.replace(/```[\s\S]*?```/g, ' ');
  const withoutInlineTicks = withoutCodeFences.replace(/[`"'“”‘’]/g, ' ');
  const compact = withoutInlineTicks.replace(/\s+/g, ' ').trim();
  const cleanedEdges = compact.replace(/^[^A-Z0-9_]+|[^A-Z0-9_]+$/gi, '').trim();
  return cleanedEdges;
}

function llmTestPassedExactMatch(text: string) {
  const normalized = normalizeLlmTestResponse(text);
  if (normalized === 'TEST_OK') {
    return true;
  }

  const stripped = normalized.replace(/\s+/g, '');
  if (stripped === 'TEST_OK') {
    return true;
  }

  return /\bTEST_OK\b/.test(normalized) && normalized.replace(/\bTEST_OK\b/g, '').trim() === '';
}

function estimateTokenCount(text: string) {
  const normalized = text.trim();
  if (!normalized) {
    return 0;
  }
  return Math.max(1, Math.round(normalized.length / 4));
}

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

function formatValidationFailureDetails(validation: AiMacroValidationResult) {
  const failedChecks = validation.checks.filter((check) => check.status === 'fail');
  if (failedChecks.length === 0) {
    return validation.summary;
  }

  return failedChecks
    .map((check) => `${check.label}: ${check.detail}`)
    .join(' | ');
}

async function runCommand(command: string, args: string[], options?: { cwd?: string }) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd: options?.cwd,
      maxBuffer: 1024 * 1024 * 20,
    });
    return {
      stdout: String(stdout || '').trim(),
      stderr: String(stderr || '').trim(),
    };
  } catch (error: any) {
    const stdout = String(error?.stdout || '').trim();
    const stderr = String(error?.stderr || '').trim();
    const detail = stderr || stdout || error?.message || `Command failed: ${command} ${args.join(' ')}`;
    const failure = new Error(detail);
    (failure as any).stdout = stdout;
    (failure as any).stderr = stderr;
    (failure as any).command = command;
    (failure as any).args = args;
    throw failure;
  }
}

async function commandExists(command: string) {
  try {
    if (process.platform === 'win32') {
      await runCommand('where', [command]);
    } else {
      await runCommand('which', [command]);
    }
    return true;
  } catch {
    return false;
  }
}

function getGhdlInstallPlan() {
  const platform = process.platform;
  if (platform === 'darwin') {
    return { platform, installer: 'Homebrew', commands: [['brew', 'install', 'ghdl']] };
  }
  if (platform === 'linux') {
    return {
      platform,
      installer: 'Auto-detected package manager',
      commands: [
        ['apt-get', 'install', '-y', 'ghdl'],
        ['dnf', 'install', '-y', 'ghdl'],
        ['pacman', '-S', '--noconfirm', 'ghdl'],
        ['zypper', 'install', '-y', 'ghdl'],
      ],
    };
  }
  if (platform === 'win32') {
    return {
      platform,
      installer: 'winget or Chocolatey',
      commands: [
        ['winget', 'install', '--id', 'GHDL.GHDL', '-e', '--accept-package-agreements', '--accept-source-agreements'],
        ['choco', 'install', 'ghdl', '-y'],
      ],
    };
  }
  return { platform, installer: null, commands: [] as string[][] };
}

async function getGhdlStatus() {
  const plan = getGhdlInstallPlan();
  try {
    const { stdout } = await runCommand('ghdl', ['--version']);
    const firstLine = stdout.split(/\r?\n/)[0] || 'GHDL installed';
    return {
      installed: true,
      version: firstLine,
      platform: plan.platform,
      installer: plan.installer,
      installCommand: plan.commands[0] || null,
    };
  } catch {
    return {
      installed: false,
      platform: plan.platform,
      installer: plan.installer,
      installCommand: plan.commands[0] || null,
      reason: 'GHDL is not available on PATH.',
    };
  }
}

async function ensureGhdlInstalled(logs: string[]) {
  const status = await getGhdlStatus();
  if (status.installed) {
    logs.push(status.version || 'GHDL is already installed.');
    return status;
  }

  const plan = getGhdlInstallPlan();
  for (const command of plan.commands) {
    const [binary, ...args] = command;
    if (!(await commandExists(binary))) {
      continue;
    }

    logs.push(`Installing GHDL with ${binary}: ${command.join(' ')}`);
    try {
      const { stdout, stderr } = await runCommand(binary, args);
      if (stdout) logs.push(stdout);
      if (stderr) logs.push(stderr);
      return await getGhdlStatus();
    } catch (error: any) {
      logs.push(`Install attempt failed: ${error.message || error}`);
    }
  }

  throw new Error(`GHDL is not installed. Tried installer: ${plan.installer || 'none available'}.`);
}

type VhdlSourceDescriptor = {
  path: string;
  name: string;
  entities: string[];
  packages: string[];
  packageBodies: string[];
  dependencies: string[];
  isTestbench: boolean;
};

function stripVhdlComments(content: string) {
  return content.replace(/--.*$/gm, '');
}

function extractUniqueMatches(content: string, expression: RegExp, transform: (value: string) => string = (value) => value) {
  const matches = new Set<string>();
  for (const match of content.matchAll(expression)) {
    const raw = match[1];
    if (!raw) {
      continue;
    }
    matches.add(transform(raw));
  }
  return Array.from(matches);
}

async function describeVhdlSource(projectPath: string, relativePath: string): Promise<VhdlSourceDescriptor> {
  const absolutePath = path.join(projectPath, relativePath);
  const rawContent = await fs.readFile(absolutePath, 'utf8');
  const content = stripVhdlComments(rawContent);

  const entities = extractUniqueMatches(content, /\bentity\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\b/gi, (value) => value.toLowerCase());
  const packages = extractUniqueMatches(content, /\bpackage\s+(?!body\b)([a-zA-Z][a-zA-Z0-9_]*)\s+is\b/gi, (value) => value.toLowerCase());
  const packageBodies = extractUniqueMatches(content, /\bpackage\s+body\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\b/gi, (value) => value.toLowerCase());
  const dependencies = Array.from(new Set([
    ...extractUniqueMatches(content, /\buse\s+work\.([a-zA-Z][a-zA-Z0-9_]*)(?:\.[a-zA-Z][a-zA-Z0-9_]*)?\s*;/gi, (value) => value.toLowerCase()),
    ...extractUniqueMatches(content, /\bentity\s+work\.([a-zA-Z][a-zA-Z0-9_]*)\b/gi, (value) => value.toLowerCase()),
  ]));

  return {
    path: relativePath,
    name: path.basename(relativePath),
    entities,
    packages,
    packageBodies,
    dependencies,
    isTestbench: /(^|[_-])(tb|testbench)([_-]|$)/i.test(path.basename(relativePath, path.extname(relativePath))),
  };
}

async function collectVhdlSources(rootPath: string) {
  const files = await listProjectFiles(rootPath);
  const vhdlFiles = files
    .filter((file) => ['.vhd', '.vhdl'].includes(file.extension))
    .sort((left, right) => left.path.localeCompare(right.path));

  const sources = await Promise.all(vhdlFiles.map((file) => describeVhdlSource(rootPath, file.path)));
  return sources;
}

function buildVhdlProjectInfo(sources: VhdlSourceDescriptor[]) {
  const selectedPaths = sources
    .filter((source) => !/(^|\/)AI Generated (TB|RTL|Assertions)(\/|$)/i.test(source.path))
    .map((source) => source.path);
  const topCandidates = Array.from(new Set(
    sources
      .filter((source) => source.entities.length > 0)
      .flatMap((source) => source.entities.map((entity) => ({
        entity,
        rank: source.isTestbench ? 0 : 1,
      })))
      .sort((left, right) => left.rank - right.rank || left.entity.localeCompare(right.entity))
      .map((entry) => entry.entity)
  ));

  return {
    sources,
    topCandidates,
    defaultTopEntity: topCandidates[0] || '',
    defaultSourcePaths: selectedPaths,
  };
}

const macroSignalIndexCache = new Map<string, MacroSignalIndex>();

function createMacroSignalIndexCacheKey(projectPath: string, rootEntity: string, sourcePaths: string[]) {
  return createHash('sha1')
    .update(JSON.stringify({
      projectPath,
      rootEntity: normalizeVhdlIdentifier(rootEntity),
      sourcePaths: [...sourcePaths].sort(),
    }))
    .digest('hex');
}

async function buildMacroSignalIndex(params: {
  projectPath: string;
  rootEntity: string;
  sourcePaths?: string[];
}) {
  const { projectPath, rootEntity } = params;
  const availableSources = await collectVhdlSources(projectPath);
  const selectedSourcePaths = Array.isArray(params.sourcePaths) && params.sourcePaths.length > 0
    ? Array.from(new Set(params.sourcePaths.map((value) => value.trim()).filter(Boolean))).sort()
    : availableSources.map((source) => source.path);
  const selectedSources = availableSources.filter((source) => selectedSourcePaths.includes(source.path));
  const sourceContents = new Map<string, string>();

  for (const source of selectedSources) {
    const rawContent = await fs.readFile(path.join(projectPath, source.path), 'utf8');
    sourceContents.set(source.path, stripVhdlComments(rawContent));
  }

  return buildMacroSignalIndexFromParsedSources({
    rootEntity,
    selectedSources,
    sourceContents,
  });
}


async function getOrBuildMacroSignalIndex(params: {
  projectPath: string;
  rootEntity: string;
  sourcePaths?: string[];
}) {
  const cacheKey = createMacroSignalIndexCacheKey(
    params.projectPath,
    params.rootEntity,
    Array.isArray(params.sourcePaths) ? params.sourcePaths : []
  );
  const cached = macroSignalIndexCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const built = await buildMacroSignalIndex(params);
  macroSignalIndexCache.set(cacheKey, built);
  return built;
}

function estimatePreprocessingTokenCount(parts: Array<string | null | undefined>) {
  return parts.reduce((total, part) => total + estimateTokenCount(typeof part === 'string' ? part : ''), 0);
}

function rankSourceForCompilation(source: VhdlSourceDescriptor) {
  if (source.packages.length > 0) return 0;
  if (source.packageBodies.length > 0) return 1;
  if (source.isTestbench) return 3;
  return 2;
}

function getSatisfiedDependencyCount(source: VhdlSourceDescriptor, compiledUnits: Set<string>) {
  return source.dependencies.reduce((count, dependency) => count + (compiledUnits.has(dependency) ? 1 : 0), 0);
}

function sortCompileCandidates(candidates: VhdlSourceDescriptor[], compiledUnits: Set<string>) {
  return [...candidates].sort((left, right) => {
    const leftRank = rankSourceForCompilation(left);
    const rightRank = rankSourceForCompilation(right);
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    const leftSatisfied = getSatisfiedDependencyCount(left, compiledUnits);
    const rightSatisfied = getSatisfiedDependencyCount(right, compiledUnits);
    if (leftSatisfied !== rightSatisfied) {
      return rightSatisfied - leftSatisfied;
    }

    return left.path.localeCompare(right.path);
  });
}

function extractMissingWorkUnits(stderr: string) {
  const units = new Set<string>();
  for (const match of stderr.matchAll(/unit\s+"([^"]+)"\s+not\s+found\s+in\s+library\s+"work"/gi)) {
    if (match[1]) {
      units.add(match[1].toLowerCase());
    }
  }
  return Array.from(units);
}

async function analyzeVhdlSources(params: {
  projectPath: string;
  outputDir: string;
  sources: VhdlSourceDescriptor[];
  logs: string[];
}) {
  const { projectPath, outputDir, sources, logs } = params;
  const compiledPaths = new Set<string>();
  const compiledUnits = new Set<string>();
  const pending = new Map(sources.map((source) => [source.path, source]));

  while (pending.size > 0) {
    let progress = false;
    const deferredFailures: Array<{ source: VhdlSourceDescriptor; stderr: string; missing: string[] }> = [];
    const candidates = sortCompileCandidates(Array.from(pending.values()), compiledUnits);

    for (const source of candidates) {
      const sourcePath = path.join(projectPath, source.path);
      logs.push(`ghdl -a --std=08 --workdir=${outputDir} ${source.path}`);

      try {
        const { stdout, stderr } = await runCommand('ghdl', ['-a', '--std=08', `--workdir=${outputDir}`, sourcePath], { cwd: outputDir });
        if (stdout) logs.push(stdout);
        if (stderr) logs.push(stderr);

        compiledPaths.add(source.path);
        source.entities.forEach((entity) => compiledUnits.add(entity));
        source.packages.forEach((pkg) => compiledUnits.add(pkg));
        source.packageBodies.forEach((pkg) => compiledUnits.add(pkg));
        pending.delete(source.path);
        progress = true;
      } catch (error: any) {
        const stdout = String(error?.stdout || '').trim();
        const stderr = String(error?.stderr || '').trim();
        if (stdout) logs.push(stdout);
        if (stderr) logs.push(stderr);

        const missing = extractMissingWorkUnits(stderr);
        if (missing.length > 0) {
          deferredFailures.push({ source, stderr, missing });
          continue;
        }

        const failure = new Error(error?.message || stderr || `Failed to analyze ${source.path}`);
        (failure as any).logs = logs;
        throw failure;
      }
    }

    if (pending.size === 0) {
      break;
    }

    if (!progress) {
      const unresolved = deferredFailures.map(({ source, missing }) => {
        const internal = missing.filter((unit) => sources.some((candidate) =>
          candidate.entities.includes(unit) || candidate.packages.includes(unit) || candidate.packageBodies.includes(unit)
        ));
        const missingText = internal.length > 0 ? internal.join(', ') : missing.join(', ');
        return `${source.path}: unresolved work units -> ${missingText}`;
      });

      logs.push('GHDL dependency resolution stalled before all selected sources could compile.');
      unresolved.forEach((entry) => logs.push(entry));

      const failure = new Error(unresolved.join('\n'));
      (failure as any).logs = logs;
      throw failure;
    }
  }

  return {
    compiledPaths: Array.from(compiledPaths),
    compiledUnits: Array.from(compiledUnits),
  };
}

async function runGhdlSimulation(params: {
  projectPath: string;
  topEntity: string;
  sourcePaths?: string[];
  stopTime?: string;
}) {
  const logs: string[] = [];
  const { projectPath, topEntity, sourcePaths, stopTime } = params;
  const status = await getGhdlStatus();

  if (!status.installed) {
    throw new Error(status.reason || 'GHDL is not installed.');
  }

  const availableSources = await collectVhdlSources(projectPath);
  if (availableSources.length === 0) {
    throw new Error('No .vhd or .vhdl files were found in the selected project folder.');
  }

  const selectedSourcePaths = Array.isArray(sourcePaths) && sourcePaths.length > 0
    ? Array.from(new Set(sourcePaths.filter((value): value is string => typeof value === 'string' && value.trim().length > 0).map((value) => value.trim())))
    : availableSources.map((source) => source.path);

  const selectedSources = selectedSourcePaths
    .map((sourcePath) => availableSources.find((source) => source.path === sourcePath))
    .filter((source): source is VhdlSourceDescriptor => Boolean(source));

  if (selectedSources.length === 0) {
    throw new Error('Select at least one VHDL source file before running GHDL.');
  }

  const topEntityName = topEntity.trim().toLowerCase();
  if (!selectedSources.some((source) => source.entities.includes(topEntityName))) {
    throw new Error('The selected source set does not declare the chosen top entity or testbench.');
  }

  const projectCacheKey = createHash('sha1').update(projectPath).digest('hex').slice(0, 12);
  const outputDir = path.join(os.tmpdir(), 'automata-logicpro-ghdl', projectCacheKey);
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });
  const vcdFileName = `${topEntity}.vcd`;
  const vcdPath = path.join(outputDir, vcdFileName);
  const executablePath = path.join(outputDir, topEntity);

  await analyzeVhdlSources({
    projectPath,
    outputDir,
    sources: selectedSources,
    logs,
  });

  logs.push(`ghdl -e --std=08 --workdir=${outputDir} -o ${executablePath} ${topEntity}`);
  {
    const { stdout, stderr } = await runCommand('ghdl', ['-e', '--std=08', `--workdir=${outputDir}`, '-o', executablePath, topEntity], { cwd: outputDir });
    if (stdout) logs.push(stdout);
    if (stderr) logs.push(stderr);
  }

  const runArgs = ['-r', '--std=08', `--workdir=${outputDir}`, topEntity, `--vcd=${vcdPath}`];
  if (stopTime) {
    runArgs.push(`--stop-time=${stopTime}`);
  }
  logs.push(`ghdl ${runArgs.join(' ')}`);
  {
    const { stdout, stderr } = await runCommand('ghdl', runArgs, { cwd: outputDir });
    if (stdout) logs.push(stdout);
    if (stderr) logs.push(stderr);
  }

  const vcdContent = await fs.readFile(vcdPath, 'utf8');
  return { logs, vcdPath, vcdFileName, vcdContent, status };
}

function escapeAppleScriptString(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

async function runAppleScript(lines: string[]) {
  const args = lines.flatMap((line) => ['-e', line]);
  const { stdout } = await execFileAsync('osascript', args);
  return stdout.trim();
}

function isAppleScriptCancel(error: any) {
  const stderr = String(error?.stderr || '');
  const message = String(error?.message || '');
  return stderr.includes('User canceled') || message.includes('User canceled');
}

function shouldSkipProjectEntry(name: string) {
  return [
    '.git',
    'node_modules',
    'dist',
    'build',
    '.next',
    '.automata-logicpro',
    'fpga-architect-sweep',
  ].includes(name);
}

async function listProjectFiles(rootPath: string, currentPath = rootPath): Promise<Array<{
  path: string;
  name: string;
  extension: string;
  size: number;
  type: string;
  lastModified: number;
}>> {
  return listProjectFilesLimited(rootPath, currentPath, { count: 0 });
}

async function listProjectFilesLimited(
  rootPath: string,
  currentPath: string,
  state: { count: number },
  limit = 2000
): Promise<Array<{
  path: string;
  name: string;
  extension: string;
  size: number;
  type: string;
  lastModified: number;
}>> {
  if (state.count >= limit) {
    return [];
  }

  let entries: Array<{ name: string | Buffer; isDirectory: () => boolean }>;
  try {
    entries = await fs.readdir(currentPath, { withFileTypes: true });
  } catch (error: any) {
    if (error?.code === 'EACCES' || error?.code === 'EPERM') {
      return [];
    }
    throw error;
  }

  const files: Array<{
    path: string;
    name: string;
    extension: string;
    size: number;
    type: string;
    lastModified: number;
  }> = [];

  for (const entry of entries) {
    if (state.count >= limit) {
      break;
    }

    const entryName = String(entry.name);

    if (shouldSkipProjectEntry(entryName)) {
      continue;
    }

    const absolutePath = path.join(currentPath, entryName);
    if (entry.isDirectory()) {
      files.push(...await listProjectFilesLimited(rootPath, absolutePath, state, limit));
      continue;
    }

    let stat: Awaited<ReturnType<typeof fs.stat>>;
    try {
      stat = await fs.stat(absolutePath);
    } catch (error: any) {
      if (error?.code === 'EACCES' || error?.code === 'EPERM') {
        continue;
      }
      throw error;
    }
    const relativePath = path.relative(rootPath, absolutePath) || entryName;
    files.push({
      path: relativePath,
      name: entryName,
      extension: entryName.includes('.') ? `.${entryName.split('.').pop()?.toLowerCase()}` : '',
      size: stat.size,
      type: 'file',
      lastModified: stat.mtimeMs,
    });
    state.count += 1;
  }

  return files.sort((left, right) => left.path.localeCompare(right.path));
}

async function chooseProjectFolder(defaultPath?: string | null) {
  const lines = ['set chosenFolder to choose folder with prompt "Select the project directory for Signal Logic Pro"'];
  if (defaultPath) {
    lines[0] += ` default location POSIX file "${escapeAppleScriptString(defaultPath)}"`;
  }
  lines.push('POSIX path of chosenFolder');
  return runAppleScript(lines);
}

async function chooseWorkspaceFile(defaultPath?: string | null) {
  const lines = ['set chosenFile to choose file with prompt "Open a VCD, VSD, or saved workspace file"'];
  if (defaultPath) {
    lines[0] += ` default location POSIX file "${escapeAppleScriptString(defaultPath)}"`;
  }
  lines.push('POSIX path of chosenFile');
  return runAppleScript(lines);
}

async function chooseExportPath(defaultPath: string | null | undefined, suggestedName: string) {
  const lines = [
    `set targetFile to choose file name with prompt "Export VCD file" default name "${escapeAppleScriptString(suggestedName)}"`,
  ];
  if (defaultPath) {
    lines[0] += ` default location POSIX file "${escapeAppleScriptString(defaultPath)}"`;
  }
  lines.push('POSIX path of targetFile');
  return runAppleScript(lines);
}

async function buildProjectContextFromPath(projectPath: string, query: string, workspaceFileName?: string | null) {
  const files = await listProjectFiles(projectPath);
  const normalizedTerms = query
    .toLowerCase()
    .split(/[^a-z0-9_./-]+/i)
    .filter((term) => term.length >= 3);
  const preferredExtensions = new Set([
    '.vcd', '.vsd', '.json', '.vhd', '.vhdl', '.sv', '.v', '.vh',
    '.c', '.cc', '.cpp', '.h', '.hpp', '.py', '.tcl', '.md', '.txt'
  ]);

  const scoredFiles = files
    .map((file) => {
      let score = 0;
      if (preferredExtensions.has(file.extension)) score += 4;
      if (workspaceFileName && file.name === workspaceFileName) score += 8;
      if (file.extension === '.vcd' || file.extension === '.vsd') score += 5;
      if (file.extension === '.vhd' || file.extension === '.vhdl') score += 4;

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
    if (candidate.score <= 0 || candidate.file.size > 120_000) {
      continue;
    }
    const absolutePath = path.join(projectPath, candidate.file.path);
    const content = await fs.readFile(absolutePath, 'utf8');
    const trimmed = content.slice(0, 12_000);
    totalBytes += trimmed.length;
    if (totalBytes > 48_000) {
      break;
    }
    excerpts.push({ path: candidate.file.path, content: trimmed });
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

async function ensureDirectoryPath(targetPath: string, label = 'Directory') {
  const normalizedPath = await normalizeFilesystemPath(targetPath);
  let stat: Awaited<ReturnType<typeof fs.stat>>;
  try {
    stat = await fs.stat(normalizedPath);
  } catch {
    const error = new Error(`${label} does not exist.`);
    (error as any).statusCode = 404;
    throw error;
  }

  if (!stat.isDirectory()) {
    const error = new Error(`${label} must be a folder.`);
    (error as any).statusCode = 400;
    throw error;
  }

  return normalizedPath;
}

async function listProviderModels(provider: LLMProviderId): Promise<ProviderModel[]> {
  switch (provider) {
    case 'ollama': {
      const data = await fetchJson(`${OLLAMA_BASE_URL}/api/tags`);
      const models = Array.isArray(data.models) ? data.models : [];
      return withStaticFallback(provider, models
        .map((model: any) => ({
          id: model.name,
          label: model.name,
        }))
        .filter((model: ProviderModel) => !isLikelyOllamaEmbeddingModel(model.id))
        .sort((left: ProviderModel, right: ProviderModel) => {
          const scoreDelta = scoreOllamaModel(right.id) - scoreOllamaModel(left.id);
          return scoreDelta || left.label.localeCompare(right.label);
        }));
    }
    case 'mtplx': {
      const data = await fetchJsonWithFallback([
        `${MTPLX_BASE_URL}/v1/models`,
        `${MTPLX_BASE_URL}/models`,
      ], {
        headers: process.env.MTPLX_API_KEY ? { Authorization: `Bearer ${process.env.MTPLX_API_KEY}` } : undefined,
      });
      const models = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.models)
            ? data.models
            : [];
      return withStaticFallback(provider, models
        .map((model: any) => ({
          id: model.id || model.name,
          label: model.name || model.id,
        }))
        .filter((model: ProviderModel) => Boolean(model.id))
        .sort((left: ProviderModel, right: ProviderModel) => left.label.localeCompare(right.label)));
    }
    case 'gemini': {
      if (!process.env.GEMINI_API_KEY) return sortProviderModels(STATIC_PROVIDER_MODELS.gemini);
      const data = await fetchJson(`${GEMINI_BASE_URL}/models?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`);
      const models = Array.isArray(data.models) ? data.models : [];
      return withStaticFallback(provider, models
        .filter((model: any) => typeof model.name === 'string' && model.name.includes('models/'))
        .map((model: any) => {
          const id = String(model.name).replace(/^models\//, '');
          return {
            id,
            label: model.displayName || id,
          };
        })
        .sort((left: ProviderModel, right: ProviderModel) => left.label.localeCompare(right.label)));
    }
    case 'openai': {
      if (!process.env.OPENAI_API_KEY) return sortProviderModels(STATIC_PROVIDER_MODELS.openai);
      const data = await fetchJson(`${OPENAI_BASE_URL}/models`, {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      });
      const models = Array.isArray(data.data) ? data.data : [];
      return withStaticFallback(provider, models
        .map((model: any) => ({ id: model.id, label: model.id }))
        .sort((left: ProviderModel, right: ProviderModel) => left.label.localeCompare(right.label)));
    }
    case 'anthropic': {
      if (!process.env.ANTHROPIC_API_KEY) return sortProviderModels(STATIC_PROVIDER_MODELS.anthropic);
      const data = await fetchJson(`${ANTHROPIC_BASE_URL}/models`, {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
      });
      const models = Array.isArray(data.data) ? data.data : [];
      return withStaticFallback(provider, models.map((model: any) => ({
        id: model.id,
        label: model.display_name || model.id,
      })));
    }
    case 'openrouter': {
      if (!process.env.OPENROUTER_API_KEY) return sortProviderModels(STATIC_PROVIDER_MODELS.openrouter);
      const data = await fetchJson(`${OPENROUTER_BASE_URL}/models`, {
        headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
      });
      const models = Array.isArray(data.data) ? data.data : [];
      return withStaticFallback(provider, models.map((model: any) => ({
        id: model.id,
        label: model.name || model.id,
      })));
    }
    case 'groq': {
      if (!process.env.GROQ_API_KEY) return sortProviderModels(STATIC_PROVIDER_MODELS.groq);
      const data = await fetchJson(`${GROQ_BASE_URL}/models`, {
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      });
      const models = Array.isArray(data.data) ? data.data : [];
      return withStaticFallback(provider, models.map((model: any) => ({
        id: model.id,
        label: model.id,
      })));
    }
    case 'mistral': {
      if (!process.env.MISTRAL_API_KEY) return sortProviderModels(STATIC_PROVIDER_MODELS.mistral);
      const data = await fetchJson(`${MISTRAL_BASE_URL}/models`, {
        headers: { Authorization: `Bearer ${process.env.MISTRAL_API_KEY}` },
      });
      const models = Array.isArray(data.data) ? data.data : [];
      return withStaticFallback(provider, models.map((model: any) => ({
        id: model.id,
        label: model.name || model.id,
      })));
    }
    default:
      return [];
  }
}

async function runModelAnalysis(params: {
  ai: GoogleGenAI | null;
  provider: LLMProviderId;
  model: string;
  prompt: string;
  signal?: AbortSignal;
}): Promise<AiRunResult> {
  const { ai, provider, model, prompt, signal } = params;
  const startedAt = Date.now();
  const finalizeResult = (
    text: string,
    usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number; tokensPerSecond?: number }
  ) => {
    const durationMs = Math.max(1, Date.now() - startedAt);
    const inputTokens = typeof usage?.inputTokens === 'number'
      ? Math.max(0, usage.inputTokens)
      : null;
    const outputTokens = typeof usage?.outputTokens === 'number'
      ? Math.max(0, usage.outputTokens)
      : null;
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

  switch (provider) {
    case 'gemini': {
      if (!ai) {
        throw new Error('Gemini is unconfigured. Set GEMINI_API_KEY.');
      }
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = response.text || 'No response generated from the model.';
      const usage = (response as any)?.usageMetadata;
      return finalizeResult(text, {
        inputTokens: usage?.promptTokenCount,
        outputTokens: usage?.candidatesTokenCount,
        totalTokens: usage?.totalTokenCount,
      });
    }
    case 'ollama': {
      if (isLikelyOllamaEmbeddingModel(model)) {
        throw new Error(`The selected Ollama model "${model}" appears to be an embedding or reranking model, not a text-generation model. Choose a chat/coder model instead.`);
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
            if (isAbortError(error)) {
              throw error;
            }
            lastError = error;
          }
        }
        throw lastError instanceof Error ? lastError : new Error(`Ollama text generation failed for model "${model}".`);
      } catch (error: any) {
        if (isLikelyConnectivityError(error)) {
          const apiReachable = await canReachOllamaApi();
          if (apiReachable) {
            throw new Error(
              `Ollama is reachable at ${OLLAMA_BASE_URL}, but text generation failed for model "${model}" across both chat/generate attempts. Check that the model is fully available for chat/completion and try the request again. Original error: ${String(error?.message || error)}`
            );
          }
          throw new Error(`Ollama Local is selected, but ${OLLAMA_BASE_URL} is unreachable. Start the Ollama service or choose a different provider/model.`);
        }
        throw error;
      }
    }
    case 'mtplx': {
      try {
        const data = await fetchJsonWithFallback([
          `${MTPLX_BASE_URL}/v1/chat/completions`,
          `${MTPLX_BASE_URL}/chat/completions`,
        ], {
          method: 'POST',
          signal,
          headers: getMtplxHeaders(),
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        const responseText = extractOpenAICompatibleMessageContent(data);
        if (!responseText) {
          throw new Error(`MTPLX returned no generated text for model "${model}".`);
        }
        return finalizeResult(responseText, {
          inputTokens: data?.usage?.prompt_tokens,
          outputTokens: data?.usage?.completion_tokens,
          totalTokens: data?.usage?.total_tokens,
        });
      } catch (error: any) {
        const message = String(error?.message || error);
        if (message.includes('fetch failed')) {
          throw new Error(`MTPLX Local is selected, but ${MTPLX_BASE_URL} is unreachable. Start MTPLX or update MTPLX_BASE_URL.`);
        }
        throw error;
      }
    }
    case 'openai': {
      if (!process.env.OPENAI_API_KEY) throw new Error('OpenAI is unconfigured. Set OPENAI_API_KEY.');
      const data = await fetchJson(`${OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        signal,
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      return finalizeResult(data.choices?.[0]?.message?.content || 'No response generated from OpenAI.', {
        inputTokens: data?.usage?.prompt_tokens,
        outputTokens: data?.usage?.completion_tokens,
        totalTokens: data?.usage?.total_tokens,
      });
    }
    case 'openrouter': {
      if (!process.env.OPENROUTER_API_KEY) throw new Error('OpenRouter is unconfigured. Set OPENROUTER_API_KEY.');
      const data = await fetchJson(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        signal,
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      return finalizeResult(data.choices?.[0]?.message?.content || 'No response generated from OpenRouter.', {
        inputTokens: data?.usage?.prompt_tokens,
        outputTokens: data?.usage?.completion_tokens,
        totalTokens: data?.usage?.total_tokens,
      });
    }
    case 'groq': {
      if (!process.env.GROQ_API_KEY) throw new Error('Groq is unconfigured. Set GROQ_API_KEY.');
      const data = await fetchJson(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        signal,
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      return finalizeResult(data.choices?.[0]?.message?.content || 'No response generated from Groq.', {
        inputTokens: data?.usage?.prompt_tokens,
        outputTokens: data?.usage?.completion_tokens,
        totalTokens: data?.usage?.total_tokens,
      });
    }
    case 'mistral': {
      if (!process.env.MISTRAL_API_KEY) throw new Error('Mistral is unconfigured. Set MISTRAL_API_KEY.');
      const data = await fetchJson(`${MISTRAL_BASE_URL}/chat/completions`, {
        method: 'POST',
        signal,
        headers: {
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      return finalizeResult(data.choices?.[0]?.message?.content || 'No response generated from Mistral.', {
        inputTokens: data?.usage?.prompt_tokens,
        outputTokens: data?.usage?.completion_tokens,
        totalTokens: data?.usage?.total_tokens,
      });
    }
    case 'anthropic': {
      if (!process.env.ANTHROPIC_API_KEY) throw new Error('Anthropic is unconfigured. Set ANTHROPIC_API_KEY.');
      const data = await fetchJson(`${ANTHROPIC_BASE_URL}/messages`, {
        method: 'POST',
        signal,
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const content = Array.isArray(data.content) ? data.content : [];
      return finalizeResult(content.map((block: any) => block.text || '').join('\n').trim() || 'No response generated from Anthropic.', {
        inputTokens: data?.usage?.input_tokens,
        outputTokens: data?.usage?.output_tokens,
        totalTokens: typeof data?.usage?.input_tokens === 'number' && typeof data?.usage?.output_tokens === 'number'
          ? data.usage.input_tokens + data.usage.output_tokens
          : undefined,
      });
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

async function bootstrap() {
  console.log('Bootstrap: starting server initialization.');
  const app = express();
  const PORT = 3000;
  const HOST = '127.0.0.1';
  console.log('Bootstrap: creating session security context.');
  const {
    sessionManager,
    getRequiredSession,
    rememberApprovedProjectRoot,
    assertApprovedProjectPath,
    sessionMiddleware,
  } = createSessionSecurityContext({
    normalizeFilesystemPath,
    isPathWithinRoot,
  });
  console.log('Bootstrap: creating AI job security context.');
  const {
    cancelAiJobHandler,
    getAiJobStatusHandler,
    beginTrackedJob,
  } = createAiJobSecurityContext({
    activeAiJobs,
    getRequiredSession,
  });

  // Middleware for body parsing
  app.use(express.json({ limit: '10mb' }));
  console.log('Bootstrap: express middleware configured.');

  // Initialize Gemini Client safely
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      ai = new GoogleGenAI({ apiKey });
      console.log('Gemini AI Client initialized successfully.');
    } catch (e) {
      console.error('Error initializing Gemini client:', e);
    }
  } else {
    console.warn('GEMINI_API_KEY environment variable is not defined. Gemini is disabled; AI Assist defaults to available local providers such as Ollama.');
  }
  console.log('Bootstrap: building route contexts.');
  const {
    getProvidersHandler,
    getRemoteExportConsentHandler,
    setRemoteExportConsentHandler,
    listProviderModelsHandler,
    legacyEncodeHandler,
    testGenerateHandler,
  } = createAiMetaRouteContext({
    ai,
    getProviderDescriptors,
    getRequiredSession,
    sessionManager,
    listProviderModels,
    staticProviderModels: STATIC_PROVIDER_MODELS,
    applyMandatoryVhdlSkill,
    runModelAnalysis,
    normalizeLlmTestResponse,
    llmTestPassedExactMatch,
  });
  const {
    getStatusHandler: getGhdlStatusHandler,
    getProjectInfoHandler: getGhdlProjectInfoHandler,
    installHandler: installGhdlHandler,
    runHandler: runGhdlHandler,
  } = createGhdlRouteContext({
    getRequiredSession,
    assertApprovedProjectPath,
    collectVhdlSources,
    buildVhdlProjectInfo,
    getGhdlStatus,
    validateGhdlInstallRequest,
    ensureGhdlInstalled,
    runGhdlSimulation,
    getOrBuildMacroSignalIndex,
  });
  const {
    selectProjectHandler,
    restoreProjectHandler,
    openWorkspaceHandler,
    saveVcdHandler,
    readProjectFileHandler,
    writeProjectFileHandler,
  } = createProjectRouteContext({
    getRequiredSession,
    rememberApprovedProjectRoot,
    assertApprovedProjectPath,
    chooseProjectFolder,
    chooseWorkspaceFile,
    chooseExportPath,
    listProjectFiles,
    ensureDirectoryPath,
    isAppleScriptCancel,
  });
  const {
    remoteExportPreviewHandler,
    remoteExportApproveHandler,
    analyzeHandler,
    fpgaArchitectStressLoopHandler,
    codeChatHandler,
  } = createAiAnalyzeRouteContext({
    ai,
    getRequiredSession,
    sessionManager,
    beginTrackedJob,
    deleteTrackedJob: (jobId: string) => activeAiJobs.delete(jobId),
    prepareAiAnalyzeRequest,
    runAiAnalyzeJob,
    runModelAnalysis,
    getProviderDeployment,
    requiresRemoteExportConsent,
    assertApprovedProjectPath,
    analyzeWaveformHazards,
    analyzeProtocolFrames,
    getAiMacroSpec,
    getOrBuildMacroSignalIndex,
    selectMacroSignals,
    getSignalName,
    formatSignalValue,
    buildSignalTransitionSummary,
    buildProjectContextFromPath,
    scrubProjectContextForRemoteExport,
    buildMacroPromptContract,
    buildPreparedRemoteExportPreview,
    applyMandatoryVhdlSkill,
    getProviderDescriptors,
    validateMacroOutput,
    buildArtifactRetryPrompt,
    buildValidationRetryPrompt,
    extractGeneratedVhdlArtifacts,
    saveGeneratedVhdlArtifacts,
    formatValidationFailureDetails,
    parseFpgaArchitectResponse,
    buildFpgaArchitectRetryPrompt,
    buildFpgaArchitectJsonRepairPrompt,
    buildFpgaArchitectCompactRetryPrompt,
    buildFpgaArchitectTestRunPrompt,
    saveFpgaArchitectProject,
    buildFpgaArchitectMarkdownReport,
    validateGeneratedVhdlWithGhdl,
    isAbortError,
    staticProviderModels: STATIC_PROVIDER_MODELS,
  });

  // --- API ROUTES ---
  console.log('Bootstrap: registering API routes.');

  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', database: 'local_persistence' });
  });

  app.get('/api/session', (req, res) => {
    const session = sessionManager.getOrCreateSession(req.headers.cookie);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Set-Cookie', sessionManager.createCookieValue(session));
    res.json({
      token: session.csrfToken,
      approvedProjectRoot: sessionManager.getApprovedRoot(session),
      remoteExportConsents: sessionManager.getRemoteExportConsents(session),
    });
  });

  app.use('/api', sessionMiddleware);

  app.post('/api/project/select', selectProjectHandler);

  app.post('/api/project/restore', restoreProjectHandler);

  app.post('/api/project/open-workspace', openWorkspaceHandler);

  app.post('/api/project/save-vcd', saveVcdHandler);

  app.post('/api/project/read-file', readProjectFileHandler);

  app.post('/api/project/write-file', writeProjectFileHandler);

  app.get('/api/ghdl/status', getGhdlStatusHandler);

  app.post('/api/ghdl/project-info', getGhdlProjectInfoHandler);

  app.post('/api/ghdl/install', installGhdlHandler);

  app.post('/api/ghdl/run', runGhdlHandler);

  app.get('/api/ai/providers', getProvidersHandler);

  app.get('/api/ai/remote-export-consent', getRemoteExportConsentHandler);

  app.post('/api/ai/remote-export-consent', setRemoteExportConsentHandler);

  app.get('/api/ai/providers/:provider/models', listProviderModelsHandler);

  // REST API: Run Gemini Timing Diagram Analysis
  app.post('/api/ai-encode', legacyEncodeHandler);

  app.post('/api/ai-jobs/:jobId/cancel', cancelAiJobHandler);
  app.get('/api/ai-jobs/:jobId/status', getAiJobStatusHandler);

  app.post('/api/ai/test-generate', testGenerateHandler);

  app.post('/api/ai/remote-export-preview', remoteExportPreviewHandler);

  app.post('/api/ai/remote-export-approve', remoteExportApproveHandler);

  app.post('/api/ai-analyze', analyzeHandler);

  app.post('/api/ai/fpga-architect-loop', fpgaArchitectStressLoopHandler);

  app.post('/api/ai/code-chat', codeChatHandler);

  // --- VITE MIDDLEWARE OR STATIC SERVER ---

  if (process.env.NODE_ENV !== 'production') {
    console.log('Bootstrap: creating Vite development middleware.');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: [
            '**/FPGA Projects/**',
            '**/AI Generated TB/**',
            '**/AI Generated RTL/**',
            '**/AI Generated Assertions/**',
            '**/.automata-logicpro/**',
            '**/work-obj08.cf',
            '**/*.o',
            '**/*.cf',
            '**/*.vcd',
            '**/*.ghw',
            '**/*.fst',
            '**/*.svg',
          ],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Mounted Vite development middleware.');
  } else {
    console.log('Bootstrap: configuring static production serving.');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`Serving static files from: ${distPath}`);
  }

  app.listen(PORT, HOST, () => {
    console.log(`Signal Logic Pro server running on http://${HOST}:${PORT}`);
  });
}

export const __semanticTestHooks = {
  normalizeVhdlIdentifier,
  extractIdentifierReferences,
  extractGenerateBlocks,
  extractInstancesFromArchitecture,
  buildVhdlSemanticModels,
  inferEntityRole,
  classifySignalName,
  buildMacroSignalIndexFromFixtures,
  selectMacroSignals,
};

if (process.env.AI_SELECTOR_TEST_MODE !== '1') {
  const bootstrapKeepAlive = setInterval(() => {
    // Keep the event loop alive until async startup reaches app.listen().
  }, 1000);

  bootstrap()
    .catch((err) => {
      console.error('Failed to trigger bootstrap startup server sequence:', err);
    })
    .finally(() => {
      clearInterval(bootstrapKeepAlive);
    });
}
