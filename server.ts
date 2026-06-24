import express from 'express';
import { createHash, randomUUID } from 'crypto';
import fs from 'fs/promises';
import os from 'os';
import { promisify } from 'util';
import { execFile } from 'child_process';
import path from 'path';
import type { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import type { AiMacroId, TbGenerationMode } from './src/aiMacros.ts';
import { validateMacroOutput } from './src/aiMacroValidation.ts';
import { buildMacroPromptContract } from './src/aiMacroPrompting.ts';

// Load environment variables
dotenv.config();

type LLMProviderId = 'gemini' | 'ollama' | 'mtplx' | 'openai' | 'anthropic' | 'openrouter' | 'groq' | 'mistral';

type ProviderDescriptor = {
  id: LLMProviderId;
  label: string;
  enabled: boolean;
  reason?: string;
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

type HazardFinding = {
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
};

type ProtocolKind = 'SPI' | 'I2C' | 'UART';

type ProtocolFrame = {
  protocol: ProtocolKind;
  channel: string;
  startTick: number;
  endTick: number;
  summary: string;
  detail: string;
};

const activeAiJobs = new Map<string, AbortController>();

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
    },
    {
      id: 'mtplx',
      label: 'MTPLX Local',
      enabled: true,
      reason: `Uses ${MTPLX_BASE_URL}`,
    },
    {
      id: 'gemini',
      label: 'Google Gemini',
      enabled: Boolean(process.env.GEMINI_API_KEY),
      reason: process.env.GEMINI_API_KEY ? 'Gemini API key detected' : 'Set GEMINI_API_KEY',
    },
    {
      id: 'openai',
      label: 'OpenAI',
      enabled: Boolean(process.env.OPENAI_API_KEY),
      reason: process.env.OPENAI_API_KEY ? 'OpenAI API key detected' : 'Set OPENAI_API_KEY',
    },
    {
      id: 'anthropic',
      label: 'Anthropic Claude',
      enabled: Boolean(process.env.ANTHROPIC_API_KEY),
      reason: process.env.ANTHROPIC_API_KEY ? 'Anthropic API key detected' : 'Set ANTHROPIC_API_KEY',
    },
    {
      id: 'openrouter',
      label: 'OpenRouter',
      enabled: Boolean(process.env.OPENROUTER_API_KEY),
      reason: process.env.OPENROUTER_API_KEY ? 'OpenRouter API key detected' : 'Set OPENROUTER_API_KEY',
    },
    {
      id: 'groq',
      label: 'Groq',
      enabled: Boolean(process.env.GROQ_API_KEY),
      reason: process.env.GROQ_API_KEY ? 'Groq API key detected' : 'Set GROQ_API_KEY',
    },
    {
      id: 'mistral',
      label: 'Mistral',
      enabled: Boolean(process.env.MISTRAL_API_KEY),
      reason: process.env.MISTRAL_API_KEY ? 'Mistral API key detected' : 'Set MISTRAL_API_KEY',
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
  return responseText;
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
  return responseText;
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

function normalizeLogicValue(value: number | string | undefined | null): number | 'Z' | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') {
    if (value === -1) return 'Z';
    return value === 1 ? 1 : 0;
  }
  const normalized = String(value).trim().toUpperCase();
  if (!normalized) return null;
  if (normalized === 'Z' || normalized === 'X') return 'Z';
  if (normalized === '1' || normalized === 'H' || normalized === 'HIGH' || normalized === 'TRUE') return 1;
  if (normalized === '0' || normalized === 'L' || normalized === 'LOW' || normalized === 'FALSE') return 0;
  if (/^[01]+$/.test(normalized)) {
    return normalized.endsWith('1') ? 1 : 0;
  }
  return null;
}

function formatTickWindow(startTick: number, endTick: number, tickDuration: number, timeUnit: string) {
  const startTime = startTick * tickDuration;
  const endTime = endTick * tickDuration;
  if (startTick === endTick) {
    return `tick ${startTick} (${startTime} ${timeUnit})`;
  }
  return `ticks ${startTick}-${endTick} (${startTime}-${endTime} ${timeUnit})`;
}

function formatSeverityBadge(severity: HazardFinding['severity']) {
  switch (severity) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    default:
      return 'Low';
  }
}

function formatByte(byteValue: number) {
  const hex = `0x${byteValue.toString(16).toUpperCase().padStart(2, '0')}`;
  const ascii = byteValue >= 32 && byteValue <= 126 ? ` '${String.fromCharCode(byteValue)}'` : '';
  return `${hex}${ascii}`;
}

function getSignalName(signal: AnalyzerSignal) {
  return signal.name || signal.id || 'unnamed_signal';
}

function getSignalValues(signal: AnalyzerSignal | undefined, fallback: Array<number | string> = []) {
  return Array.isArray(signal?.values) ? signal!.values : fallback;
}

function findSignalByName(signals: AnalyzerSignal[], patterns: RegExp[]) {
  return signals.find((signal) => {
    const haystack = `${signal.name || ''} ${signal.id || ''}`.toLowerCase();
    return patterns.some((pattern) => pattern.test(haystack));
  });
}

function findSignalById(signals: AnalyzerSignal[], id?: string) {
  if (!id) return undefined;
  return signals.find((signal) => signal.id === id);
}

function estimateUartBaudTicks(values: Array<number | string>) {
  const runLengths: number[] = [];
  let current = normalizeLogicValue(values[0]);
  let length = 1;
  for (let index = 1; index < values.length; index += 1) {
    const next = normalizeLogicValue(values[index]);
    if (next === current) {
      length += 1;
    } else {
      if (length >= 2 && current !== null && current !== 'Z') {
        runLengths.push(length);
      }
      current = next;
      length = 1;
    }
  }
  if (length >= 2 && current !== null && current !== 'Z') {
    runLengths.push(length);
  }
  if (runLengths.length === 0) return 8;

  const counts = new Map<number, number>();
  runLengths.forEach((runLength) => counts.set(runLength, (counts.get(runLength) || 0) + 1));
  return [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0] - right[0])[0]?.[0] || 8;
}

function decodeSpiFrames(
  channel: string,
  sckValues: Array<number | string>,
  dataValues: Array<number | string>,
  csValues: Array<number | string>,
): ProtocolFrame[] {
  const frames: ProtocolFrame[] = [];
  let inTransaction = false;
  let startTick = 0;
  let bits: number[] = [];
  const bytes: number[] = [];

  const flushFrame = (endTick: number) => {
    if (!inTransaction) return;
    const renderedBytes = bytes.map(formatByte);
    frames.push({
      protocol: 'SPI',
      channel,
      startTick,
      endTick,
      summary: renderedBytes.length > 0 ? `SPI bytes ${renderedBytes.join(', ')}` : 'SPI transaction detected',
      detail: renderedBytes.length > 0
        ? `Decoded ${bytes.length} byte(s) on MOSI: ${renderedBytes.join(', ')}.`
        : `Chip-select asserted from tick ${startTick} to ${endTick}, but a complete byte was not captured.`,
    });
    inTransaction = false;
    bits = [];
    bytes.length = 0;
  };

  for (let tick = 1; tick < Math.min(sckValues.length, dataValues.length, csValues.length); tick += 1) {
    const csPrev = normalizeLogicValue(csValues[tick - 1]);
    const csCurr = normalizeLogicValue(csValues[tick]);
    const sckPrev = normalizeLogicValue(sckValues[tick - 1]);
    const sckCurr = normalizeLogicValue(sckValues[tick]);

    if (!inTransaction && csCurr === 0) {
      inTransaction = true;
      startTick = tick;
      bits = [];
      bytes.length = 0;
    }

    if (inTransaction && sckPrev === 0 && sckCurr === 1 && csCurr === 0) {
      const bit = normalizeLogicValue(dataValues[tick]);
      if (bit === 0 || bit === 1) {
        bits.push(bit);
        if (bits.length === 8) {
          let byteValue = 0;
          bits.forEach((capturedBit) => {
            byteValue = (byteValue << 1) | capturedBit;
          });
          bytes.push(byteValue);
          bits = [];
        }
      }
    }

    if (inTransaction && csPrev === 0 && csCurr === 1) {
      flushFrame(tick);
    }
  }

  if (inTransaction) {
    flushFrame(Math.min(sckValues.length, dataValues.length, csValues.length) - 1);
  }

  return frames;
}

function decodeI2cFrames(
  channel: string,
  sclValues: Array<number | string>,
  sdaValues: Array<number | string>,
): ProtocolFrame[] {
  const frames: ProtocolFrame[] = [];
  let inTransaction = false;
  let startTick = 0;
  let bits: number[] = [];
  const bytes: Array<{ value: number; ack: boolean }> = [];

  const flushFrame = (endTick: number) => {
    if (!inTransaction) return;
    const renderedBytes = bytes.map((entry) => `${formatByte(entry.value)}${entry.ack ? ' ACK' : ' NACK'}`);
    frames.push({
      protocol: 'I2C',
      channel,
      startTick,
      endTick,
      summary: renderedBytes.length > 0 ? `I2C frame ${renderedBytes.join(', ')}` : 'I2C START/STOP transaction detected',
      detail: renderedBytes.length > 0
        ? `Decoded ${bytes.length} byte(s) between START and STOP: ${renderedBytes.join(', ')}.`
        : `START/STOP activity was detected from tick ${startTick} to ${endTick}, but a complete byte+ACK group was not captured.`,
    });
    inTransaction = false;
    bits = [];
    bytes.length = 0;
  };

  for (let tick = 1; tick < Math.min(sclValues.length, sdaValues.length); tick += 1) {
    const sclPrev = normalizeLogicValue(sclValues[tick - 1]);
    const sclCurr = normalizeLogicValue(sclValues[tick]);
    const sdaPrev = normalizeLogicValue(sdaValues[tick - 1]);
    const sdaCurr = normalizeLogicValue(sdaValues[tick]);

    const isStart = sclCurr === 1 && sdaPrev === 1 && sdaCurr === 0;
    const isStop = sclCurr === 1 && sdaPrev === 0 && sdaCurr === 1;

    if (isStart) {
      if (inTransaction) {
        flushFrame(tick - 1);
      }
      inTransaction = true;
      startTick = tick;
      bits = [];
      bytes.length = 0;
      continue;
    }

    if (inTransaction && sclPrev === 0 && sclCurr === 1) {
      const bit = normalizeLogicValue(sdaValues[tick]);
      if (bit === 0 || bit === 1) {
        bits.push(bit);
        if (bits.length === 9) {
          let byteValue = 0;
          for (let index = 0; index < 8; index += 1) {
            byteValue = (byteValue << 1) | bits[index];
          }
          bytes.push({ value: byteValue, ack: bits[8] === 0 });
          bits = [];
        }
      }
    }

    if (inTransaction && isStop) {
      flushFrame(tick);
    }
  }

  if (inTransaction) {
    flushFrame(Math.min(sclValues.length, sdaValues.length) - 1);
  }

  return frames;
}

function decodeUartFrames(
  channel: string,
  rxValues: Array<number | string>,
  baudTicks: number,
): ProtocolFrame[] {
  const frames: ProtocolFrame[] = [];
  const baud = Math.max(2, baudTicks);

  let tick = 1;
  while (tick < rxValues.length) {
    const prev = normalizeLogicValue(rxValues[tick - 1]);
    const curr = normalizeLogicValue(rxValues[tick]);
    if (prev === 1 && curr === 0) {
      const startTick = tick;
      let byteValue = 0;
      let valid = true;

      for (let bitIndex = 0; bitIndex < 8; bitIndex += 1) {
        const sampleTick = Math.round(startTick + baud * (bitIndex + 1) + baud / 2);
        const sampled = normalizeLogicValue(rxValues[sampleTick]);
        if (sampled !== 0 && sampled !== 1) {
          valid = false;
          break;
        }
        byteValue |= sampled << bitIndex;
      }

      const stopTick = Math.round(startTick + baud * 9 + baud / 2);
      const stopBit = normalizeLogicValue(rxValues[stopTick]);
      if (valid && stopBit === 1) {
        const endTick = Math.min(rxValues.length - 1, Math.round(startTick + baud * 10));
        frames.push({
          protocol: 'UART',
          channel,
          startTick,
          endTick,
          summary: `UART byte ${formatByte(byteValue)}`,
          detail: `Decoded UART frame from tick ${startTick} to ${endTick}: ${formatByte(byteValue)} using an estimated baud window of ${baud} tick(s) per bit.`,
        });
        tick = endTick;
        continue;
      }
    }
    tick += 1;
  }

  return frames;
}

function analyzeProtocolFrames(
  signals: AnalyzerSignal[],
  tickDuration: number,
  timeUnit: string,
) {
  const frames: ProtocolFrame[] = [];
  const visibleSignals = signals.filter((signal) => signal && signal.visible !== false && Array.isArray(signal.values));
  const usedChannels = new Set<string>();

  const addFrames = (channelKey: string, nextFrames: ProtocolFrame[]) => {
    if (nextFrames.length === 0 || usedChannels.has(channelKey)) return;
    usedChannels.add(channelKey);
    frames.push(...nextFrames);
  };

  const decoderSignals = visibleSignals.filter((signal) => signal.type === 'decoder' && signal.config?.decoderType);
  for (const decoderSignal of decoderSignals) {
    const decoderType = decoderSignal.config?.decoderType;
    if (decoderType === 'SPI') {
      const sck = findSignalById(visibleSignals, decoderSignal.config?.clkSignalId);
      const data = findSignalById(visibleSignals, decoderSignal.config?.dataSignalId);
      const cs = findSignalById(visibleSignals, decoderSignal.config?.csSignalId);
      if (sck && data && cs) {
        addFrames(`SPI:${decoderSignal.id}`, decodeSpiFrames(
          `${getSignalName(decoderSignal)} via ${getSignalName(data)}`,
          getSignalValues(sck),
          getSignalValues(data),
          getSignalValues(cs),
        ));
      }
    } else if (decoderType === 'I2C') {
      const scl = findSignalById(visibleSignals, decoderSignal.config?.clkSignalId);
      const sda = findSignalById(visibleSignals, decoderSignal.config?.dataSignalId);
      if (scl && sda) {
        addFrames(`I2C:${decoderSignal.id}`, decodeI2cFrames(
          `${getSignalName(decoderSignal)} via ${getSignalName(sda)}`,
          getSignalValues(scl),
          getSignalValues(sda),
        ));
      }
    } else if (decoderType === 'UART') {
      const rx = findSignalById(visibleSignals, decoderSignal.config?.rxSignalId);
      if (rx) {
        addFrames(`UART:${decoderSignal.id}`, decodeUartFrames(
          `${getSignalName(decoderSignal)} via ${getSignalName(rx)}`,
          getSignalValues(rx),
          decoderSignal.config?.baudTicks ?? estimateUartBaudTicks(getSignalValues(rx)),
        ));
      }
    }
  }

  const spiSck = findSignalByName(visibleSignals, [/\bsck\b/, /\bspi.*clk\b/, /\bspi.*sck\b/]);
  const spiData = findSignalByName(visibleSignals, [/\bmosi\b/, /\bspi.*data\b/, /\bspi.*mosi\b/]);
  const spiCs = findSignalByName(visibleSignals, [/\bcs\b/, /\bss\b/, /chip.?select/, /\bspi.*cs\b/]);
  if (spiSck && spiData && spiCs) {
    addFrames('SPI:heuristic', decodeSpiFrames(
      `${getSignalName(spiData)} heuristic`,
      getSignalValues(spiSck),
      getSignalValues(spiData),
      getSignalValues(spiCs),
    ));
  }

  const i2cScl = findSignalByName(visibleSignals, [/\bscl\b/, /\bi2c.*clk\b/]);
  const i2cSda = findSignalByName(visibleSignals, [/\bsda\b/, /\bi2c.*data\b/]);
  if (i2cScl && i2cSda) {
    addFrames('I2C:heuristic', decodeI2cFrames(
      `${getSignalName(i2cSda)} heuristic`,
      getSignalValues(i2cScl),
      getSignalValues(i2cSda),
    ));
  }

  const uartCandidates = visibleSignals.filter((signal) => {
    const haystack = `${signal.name || ''} ${signal.id || ''}`.toLowerCase();
    return /\buart\b/.test(haystack) || /\brx\b/.test(haystack) || /\btx\b/.test(haystack) || /\bserial\b/.test(haystack);
  });
  uartCandidates.forEach((signal) => {
    addFrames(`UART:heuristic:${signal.id || signal.name}`, decodeUartFrames(
      `${getSignalName(signal)} heuristic`,
      getSignalValues(signal),
      estimateUartBaudTicks(getSignalValues(signal)),
    ));
  });

  frames.sort((left, right) => left.startTick - right.startTick || left.protocol.localeCompare(right.protocol));
  const protocolCounts = new Map<ProtocolKind, number>();
  frames.forEach((frame) => protocolCounts.set(frame.protocol, (protocolCounts.get(frame.protocol) || 0) + 1));

  const markdownLines = [
    '### Deterministic Protocol Pre-Decode',
    frames.length > 0
      ? `Detected ${frames.length} frame(s): ${(['SPI', 'I2C', 'UART'] as ProtocolKind[])
          .filter((protocol) => protocolCounts.has(protocol))
          .map((protocol) => `${protocol} ${protocolCounts.get(protocol)}`)
          .join(', ')}`
      : 'No deterministic SPI, I2C, or UART frames could be decoded from the currently visible signals.',
  ];

  if (frames.length > 0) {
    markdownLines.push('');
    frames.slice(0, 16).forEach((frame) => {
      markdownLines.push(`- [${frame.protocol}] ${frame.summary} on ${frame.channel} at ${formatTickWindow(frame.startTick, frame.endTick, tickDuration, timeUnit)}. ${frame.detail}`);
    });
    if (frames.length > 16) {
      markdownLines.push(`- Additional decoded frames omitted from summary: ${frames.length - 16}`);
    }
  }

  return {
    frames,
    markdown: markdownLines.join('\n'),
  };
}

function analyzeWaveformHazards(
  signals: AnalyzerSignal[],
  tickDuration: number,
  timeUnit: string
) {
  const findings: HazardFinding[] = [];
  const visibleSignals = signals.filter((signal) => signal && signal.visible !== false && Array.isArray(signal.values));
  const signalMap = new Map<string, AnalyzerSignal>(
    visibleSignals
      .filter((signal) => typeof signal.id === 'string' && signal.id)
      .map((signal) => [signal.id as string, signal])
  );

  const transitionMap = new Map<string, number[]>();
  const edgeMap = new Map<string, number[]>();

  for (const signal of visibleSignals) {
    const name = signal.name || signal.id || 'unnamed_signal';
    const values = signal.values || [];
    const transitions: number[] = [];
    const activeEdges: number[] = [];

    for (let index = 1; index < values.length; index += 1) {
      const previous = normalizeLogicValue(values[index - 1]);
      const current = normalizeLogicValue(values[index]);
      if (previous === null || current === null) {
        continue;
      }
      if (previous !== current) {
        transitions.push(index);
        if ((previous === 0 && current === 1) || (previous === 1 && current === 0)) {
          activeEdges.push(index);
        }
      }
    }

    transitionMap.set(name, transitions);
    edgeMap.set(name, activeEdges);

    for (let transitionIndex = 1; transitionIndex < transitions.length; transitionIndex += 1) {
      const pulseWidthTicks = transitions[transitionIndex] - transitions[transitionIndex - 1];
      if (pulseWidthTicks <= 1) {
        findings.push({
          severity: 'high',
          title: `${name}: single-tick pulse/glitch suspect`,
          detail: `Back-to-back transitions were detected at ${formatTickWindow(transitions[transitionIndex - 1], transitions[transitionIndex], tickDuration, timeUnit)}. This usually indicates a very narrow pulse or combinational glitch.`,
        });
      } else if (pulseWidthTicks === 2) {
        findings.push({
          severity: 'medium',
          title: `${name}: narrow pulse suspect`,
          detail: `A two-tick pulse was detected around ${formatTickWindow(transitions[transitionIndex - 1], transitions[transitionIndex], tickDuration, timeUnit)}. Review whether this pulse is intentional or a hazard caused by skewed input arrival.`,
        });
      }
    }

    let highZTransitions = 0;
    for (let index = 1; index < values.length; index += 1) {
      const previous = normalizeLogicValue(values[index - 1]);
      const current = normalizeLogicValue(values[index]);
      if ((previous === 'Z' && current !== 'Z' && current !== null) || (current === 'Z' && previous !== 'Z' && previous !== null)) {
        highZTransitions += 1;
      }
    }
    if (highZTransitions > 0) {
      findings.push({
        severity: 'low',
        title: `${name}: tri-state transition activity`,
        detail: `${highZTransitions} transition(s) into or out of High-Z were detected. Confirm bus turn-around timing and contention-free enable sequencing.`,
      });
    }
  }

  const clockSignals = visibleSignals.filter((signal) => {
    const name = `${signal.name || ''} ${signal.id || ''}`.toLowerCase();
    return signal.type === 'clock' || name.includes('clk') || name.includes('clock');
  });

  for (const clockSignal of clockSignals) {
    const clockName = clockSignal.name || clockSignal.id || 'clock';
    const clockEdges = edgeMap.get(clockName) || [];
    for (const signal of visibleSignals) {
      const signalName = signal.name || signal.id || 'unnamed_signal';
      if (signalName === clockName) continue;
      const transitions = transitionMap.get(signalName) || [];
      if (transitions.length === 0 || clockEdges.length === 0) continue;

      const setupHoldHits: Array<{ signalTick: number; clockTick: number }> = [];
      for (const transitionTick of transitions) {
        for (const edgeTick of clockEdges) {
          if (Math.abs(transitionTick - edgeTick) <= 1) {
            setupHoldHits.push({ signalTick: transitionTick, clockTick: edgeTick });
            break;
          }
        }
      }

      if (setupHoldHits.length > 0) {
        const firstHit = setupHoldHits[0];
        findings.push({
          severity: setupHoldHits.length >= 3 ? 'high' : 'medium',
          title: `${signalName}: setup/hold risk near ${clockName}`,
          detail: `${setupHoldHits.length} transition(s) occur within ±1 tick of ${clockName} active edges. First overlap: signal tick ${firstHit.signalTick}, clock edge tick ${firstHit.clockTick}. This is a classic race/setup-hold risk area.`,
        });
      }
    }
  }

  for (const signal of visibleSignals) {
    if (signal.type !== 'gate' || !signal.config?.inputA) {
      continue;
    }
    const signalName = signal.name || signal.id || 'gate_output';
    const inputA = signalMap.get(signal.config.inputA);
    const inputB = signal.config.inputB ? signalMap.get(signal.config.inputB) : undefined;
    if (!inputA) continue;

    const inputATransitions = transitionMap.get(inputA.name || inputA.id || '') || [];
    const inputBTransitions = inputB ? transitionMap.get(inputB.name || inputB.id || '') || [] : [];
    const outputTransitions = transitionMap.get(signalName) || [];

    for (const inputTickA of inputATransitions) {
      const nearInputB = inputBTransitions.find((inputTickB) => Math.abs(inputTickB - inputTickA) <= 1);
      if (!nearInputB) continue;
      const nearOutput = outputTransitions.find((outputTick) => outputTick >= Math.min(inputTickA, nearInputB) && outputTick <= Math.max(inputTickA, nearInputB) + 1);
      if (nearOutput !== undefined) {
        findings.push({
          severity: 'medium',
          title: `${signalName}: gate-level race/hazard window`,
          detail: `Gate inputs ${(inputA.name || inputA.id)} and ${(inputB?.name || inputB?.id)} transition nearly together around ticks ${inputTickA} and ${nearInputB}, and the output reacts at tick ${nearOutput}. Review logic skew and reconvergent fan-in hazards.`,
        });
      }
    }
  }

  const severityRank: Record<HazardFinding['severity'], number> = { high: 0, medium: 1, low: 2 };
  findings.sort((left, right) => severityRank[left.severity] - severityRank[right.severity] || left.title.localeCompare(right.title));

  const highCount = findings.filter((finding) => finding.severity === 'high').length;
  const mediumCount = findings.filter((finding) => finding.severity === 'medium').length;
  const lowCount = findings.filter((finding) => finding.severity === 'low').length;

  const summaryLines = [
    '### Deterministic Hazard Scan',
    `Signals scanned: ${visibleSignals.length}`,
    `Findings: ${findings.length} total (${highCount} high, ${mediumCount} medium, ${lowCount} low)`,
  ];

  if (findings.length === 0) {
    summaryLines.push('No obvious glitch, narrow-pulse, or setup/hold-adjacent transitions were detected in the sampled waveform data.');
  } else {
    summaryLines.push('');
    findings.slice(0, 12).forEach((finding) => {
      summaryLines.push(`- [${formatSeverityBadge(finding.severity)}] ${finding.title}: ${finding.detail}`);
    });
    if (findings.length > 12) {
      summaryLines.push(`- Additional findings omitted from summary: ${findings.length - 12}`);
    }
  }

  return {
    findings,
    markdown: summaryLines.join('\n'),
  };
}

async function runCommand(command: string, args: string[], options?: { cwd?: string }) {
  const { stdout, stderr } = await execFileAsync(command, args, {
    cwd: options?.cwd,
    maxBuffer: 1024 * 1024 * 20,
  });
  return {
    stdout: String(stdout || '').trim(),
    stderr: String(stderr || '').trim(),
  };
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
  const selectedPaths = sources.map((source) => source.path);
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

type VhdlInstanceConnection = {
  port: string;
  signals: string[];
};

type VhdlInstanceModel = {
  label: string;
  entity: string;
  connections: VhdlInstanceConnection[];
};

type VhdlEntitySemanticModel = {
  name: string;
  sourcePath: string;
  ports: string[];
  localSignals: string[];
  aliases: Array<[string, string]>;
  assignments: Array<[string, string]>;
  instances: VhdlInstanceModel[];
  generateBlockCount: number;
  isTestbench: boolean;
};

type MacroSignalInsight = {
  signal: string;
  categories: Array<'clockReset' | 'protocol' | 'state' | 'control' | 'data' | 'debug'>;
  entities: string[];
  relatedNodes: string[];
};

type MacroSignalIndex = {
  rootEntity: string;
  selectedSourcePaths: string[];
  rootVisibleSignals: string[];
  reachableEntities: string[];
  entityRoles: Record<string, string>;
  signalInsights: MacroSignalInsight[];
  categorySignals: {
    clockReset: string[];
    protocol: string[];
    state: string[];
    control: string[];
    data: string[];
    debug: string[];
    all: string[];
  };
};

type SemanticSourceFixture = {
  path: string;
  isTestbench: boolean;
  content: string;
};

const macroSignalIndexCache = new Map<string, MacroSignalIndex>();

function normalizeVhdlIdentifier(value: string) {
  return value
    .trim()
    .replace(/^\\|\\$/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/'.*$/g, '')
    .split(/[\s./:]+/)
    .filter(Boolean)
    .pop()
    ?.toLowerCase() || value.trim().toLowerCase();
}

function splitTopLevelDelimited(text: string, delimiter = ',') {
  const entries: string[] = [];
  let current = '';
  let depth = 0;
  for (const character of text) {
    if (character === '(') depth += 1;
    if (character === ')') depth = Math.max(0, depth - 1);
    if (character === delimiter && depth === 0) {
      if (current.trim()) {
        entries.push(current.trim());
      }
      current = '';
      continue;
    }
    current += character;
  }
  if (current.trim()) {
    entries.push(current.trim());
  }
  return entries;
}

function parseVhdlIdentifierList(rawText: string) {
  return splitTopLevelDelimited(rawText)
    .flatMap((entry) => entry.split(','))
    .map((entry) => normalizeVhdlIdentifier(entry))
    .filter(Boolean);
}

const VHDL_REFERENCE_STOP_WORDS = new Set([
  'abs', 'access', 'after', 'alias', 'all', 'and', 'architecture', 'array', 'assert', 'attribute',
  'begin', 'block', 'body', 'buffer', 'bus', 'case', 'component', 'configuration', 'constant',
  'disconnect', 'downto', 'else', 'elsif', 'end', 'entity', 'exit', 'file', 'for', 'function',
  'generate', 'generic', 'group', 'guarded', 'if', 'impure', 'in', 'inertial', 'inout', 'is',
  'label', 'library', 'linkage', 'literal', 'loop', 'map', 'mod', 'nand', 'new', 'next', 'nor',
  'not', 'null', 'of', 'on', 'open', 'or', 'others', 'out', 'package', 'port', 'postponed',
  'procedure', 'process', 'pure', 'range', 'record', 'register', 'reject', 'rem', 'report',
  'return', 'rol', 'ror', 'select', 'severity', 'signal', 'shared', 'sla', 'sll', 'sra', 'srl',
  'subtype', 'then', 'to', 'transport', 'type', 'unaffected', 'units', 'until', 'use', 'variable',
  'wait', 'when', 'while', 'with', 'xnor', 'xor',
  'std_logic', 'std_logic_vector', 'unsigned', 'signed', 'integer', 'natural', 'boolean', 'bit',
  'bit_vector', 'true', 'false', 'rising_edge', 'falling_edge', 'conv_integer', 'to_integer',
  'to_unsigned', 'to_signed', 'resize', 'length', 'left', 'right', 'high', 'low', 'event',
  'stable', 'delayed', 'quiet', 'transaction',
]);

function extractIdentifierReferences(rawText: string) {
  const references = new Set<string>();
  const sanitized = rawText
    .replace(/"[^"]*"/g, ' ')
    .replace(/'[^']*'/g, ' ');

  for (const match of sanitized.matchAll(/\b([a-zA-Z][a-zA-Z0-9_]*(?:\s*\([^)]*\))?(?:'[a-zA-Z_][a-zA-Z0-9_]*)?)\b/g)) {
    const normalized = normalizeVhdlIdentifier(match[1]);
    if (!normalized) continue;
    if (VHDL_REFERENCE_STOP_WORDS.has(normalized)) continue;
    references.add(normalized);
  }

  return Array.from(references);
}

function extractEntityPortsFromContent(content: string) {
  const portsByEntity = new Map<string, string[]>();
  const collectPorts = (ownerName: string, body: string) => {
    const portMatch = body.match(/\bport\s*\(([\s\S]*?)\)\s*;/i);
    if (!portMatch) {
      portsByEntity.set(ownerName, []);
      return;
    }

    const ports: string[] = [];
    splitTopLevelDelimited(portMatch[1], ';').forEach((declaration) => {
      const [namesPart] = declaration.split(':');
      if (!namesPart) return;
      parseVhdlIdentifierList(namesPart).forEach((portName) => ports.push(portName));
    });
    portsByEntity.set(ownerName, Array.from(new Set(ports)));
  };

  for (const match of content.matchAll(/\bentity\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\b([\s\S]*?)\bend(?:\s+entity)?(?:\s+[a-zA-Z][a-zA-Z0-9_]*)?\s*;/gi)) {
    collectPorts(normalizeVhdlIdentifier(match[1]), match[2] || '');
  }

  for (const match of content.matchAll(/\bcomponent\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\b([\s\S]*?)\bend\s+component(?:\s+[a-zA-Z][a-zA-Z0-9_]*)?\s*;/gi)) {
    const componentName = normalizeVhdlIdentifier(match[1]);
    if (!portsByEntity.has(componentName)) {
      collectPorts(componentName, match[2] || '');
    }
  }
  return portsByEntity;
}

function extractLocalSignals(declarativeText: string) {
  const localSignals: string[] = [];
  for (const match of declarativeText.matchAll(/\bsignal\s+([^:;]+)\s*:\s*[^;]+;/gi)) {
    const namesPart = match[1];
    if (!namesPart) continue;
    parseVhdlIdentifierList(namesPart).forEach((signalName) => localSignals.push(signalName));
  }
  return Array.from(new Set(localSignals));
}

function extractAliasesFromText(content: string) {
  const aliases: Array<[string, string]> = [];
  for (const match of content.matchAll(/\balias\s+([a-zA-Z][a-zA-Z0-9_]*)\b(?:\s*:\s*[^;]+?)?\s+\bis\s+([\s\S]*?)\s*;/gi)) {
    const aliasName = normalizeVhdlIdentifier(match[1]);
    extractIdentifierReferences(match[2] || '').forEach((reference) => {
      aliases.push([aliasName, reference]);
    });
  }
  return aliases;
}

function extractSimpleAssignments(content: string) {
  const assignments: Array<[string, string]> = [];
  for (const match of content.matchAll(/\b([a-zA-Z][a-zA-Z0-9_]*(?:\s*\([^)]*\))?)\s*(<=|:=)\s*([\s\S]*?)\s*;/gi)) {
    const target = normalizeVhdlIdentifier(match[1]);
    if (!target) continue;
    extractIdentifierReferences(match[3] || '').forEach((reference) => {
      if (reference !== target) {
        assignments.push([target, reference]);
      }
    });
  }
  return assignments;
}

function extractPortSignalReferences(rawValue: string) {
  return extractIdentifierReferences(rawValue);
}

function extractGenerateBlocks(bodyText: string) {
  const blocks: Array<{ label: string; body: string }> = [];
  const pattern = /([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(?:if|for)\b[\s\S]*?\bgenerate\b([\s\S]*?)\bend\s+generate(?:\s+[a-zA-Z][a-zA-Z0-9_]*)?\s*;/gi;
  for (const match of bodyText.matchAll(pattern)) {
    blocks.push({
      label: normalizeVhdlIdentifier(match[1]),
      body: match[2] || '',
    });
  }
  const strippedBody = bodyText.replace(pattern, ' ');
  return { blocks, strippedBody };
}

function extractInstancesFromArchitecture(bodyText: string, entityPorts: Map<string, string[]>, labelPrefix = '') {
  const instances: VhdlInstanceModel[] = [];
  const { blocks, strippedBody } = extractGenerateBlocks(bodyText);

  for (const match of strippedBody.matchAll(/([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(?:entity\s+work\.)?([a-zA-Z][a-zA-Z0-9_]*)(?:\s+generic\s+map\s*\(([\s\S]*?)\))?(?:\s+port\s+map\s*\(([\s\S]*?)\))\s*;/gi)) {
    const localLabel = normalizeVhdlIdentifier(match[1]);
    const label = labelPrefix ? `${labelPrefix}.${localLabel}` : localLabel;
    const entity = normalizeVhdlIdentifier(match[2]);
    const portMapText = match[4] || '';
    const rawAssociations = splitTopLevelDelimited(portMapText);
    const childPorts = entityPorts.get(entity) || [];
    const namedAssociations = rawAssociations.filter((entry) => entry.includes('=>'));
    const connections: VhdlInstanceConnection[] = [];

    if (namedAssociations.length === rawAssociations.length) {
      namedAssociations.forEach((entry) => {
        const [portPart, signalPart] = entry.split('=>');
        const signals = extractPortSignalReferences(signalPart || '');
        if (!portPart || signals.length === 0) return;
        connections.push({
          port: normalizeVhdlIdentifier(portPart),
          signals,
        });
      });
    } else {
      rawAssociations.forEach((entry, index) => {
        const signals = extractPortSignalReferences(entry);
        const port = childPorts[index];
        if (!port || signals.length === 0) return;
        connections.push({ port, signals });
      });
    }

    instances.push({
      label,
      entity,
      connections,
    });
  }

  blocks.forEach((block) => {
    const nestedPrefix = labelPrefix ? `${labelPrefix}.${block.label}` : block.label;
    instances.push(...extractInstancesFromArchitecture(block.body, entityPorts, nestedPrefix));
  });

  return instances;
}

function buildVhdlSemanticModels(params: {
  sources: Array<Pick<VhdlSourceDescriptor, 'path' | 'isTestbench'>>;
  sourceContents: Map<string, string>;
}) {
  const { sources, sourceContents } = params;
  const entityPorts = new Map<string, string[]>();

  for (const source of sources) {
    const content = sourceContents.get(source.path) || '';
    for (const [entityName, ports] of extractEntityPortsFromContent(content).entries()) {
      entityPorts.set(entityName, ports);
    }
  }

  const models = new Map<string, VhdlEntitySemanticModel>();
  for (const source of sources) {
    const content = sourceContents.get(source.path) || '';
    for (const match of content.matchAll(/\barchitecture\s+([a-zA-Z][a-zA-Z0-9_]*)\s+of\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\b([\s\S]*?)\bbegin\b([\s\S]*?)\bend(?:\s+architecture)?(?:\s+[a-zA-Z][a-zA-Z0-9_]*)?\s*;/gi)) {
      const entityName = normalizeVhdlIdentifier(match[2]);
      const declarativeText = match[3] || '';
      const bodyText = match[4] || '';
      models.set(entityName, {
        name: entityName,
        sourcePath: source.path,
        ports: entityPorts.get(entityName) || [],
        localSignals: extractLocalSignals(declarativeText),
        aliases: extractAliasesFromText(`${declarativeText}\n${bodyText}`),
        assignments: extractSimpleAssignments(bodyText),
        instances: extractInstancesFromArchitecture(bodyText, entityPorts),
        generateBlockCount: extractGenerateBlocks(bodyText).blocks.length,
        isTestbench: source.isTestbench,
      });
    }
  }

  return { entityPorts, models };
}

function inferEntityRole(model: VhdlEntitySemanticModel | undefined, entityName: string, sourcePath = '') {
  const normalizedEntity = normalizeVhdlIdentifier(entityName);
  const normalizedPath = sourcePath.toLowerCase();
  const tokenSource = `${normalizedEntity} ${normalizedPath}`;
  const portTokens = (model?.ports || []).flatMap((portName) => tokenizeSignalName(portName));
  const signalTokens = (model?.localSignals || []).flatMap((signalName) => tokenizeSignalName(signalName));
  const combinedTokens = [...portTokens, ...signalTokens];
  const tokenHas = (pattern: RegExp) => combinedTokens.some((token) => pattern.test(token)) || pattern.test(tokenSource);

  if (model?.isTestbench || /\b(tb|testbench)\b/.test(tokenSource)) {
    return 'testbench';
  }
  if (/(wrapper|top|shell|harness)/.test(tokenSource) || ((model?.ports.length || 0) === 0 && (model?.instances.length || 0) > 0)) {
    return 'wrapper';
  }
  if (tokenHas(/\b(spi|uart|i2c|axi|apb|ahb|wishbone|protocol|serial|mosi|miso|sck|sda|rx|tx)\b/)) {
    return 'protocol';
  }
  if (tokenHas(/\b(fsm|ctrl|control|sequencer|dispatch|scheduler|arbiter|state|ready|valid|req|ack)\b/)) {
    return 'control';
  }
  if (tokenHas(/\b(mem|ram|rom|fifo|cache|stack|regfile|addr|data|byte|word)\b/)) {
    return 'memory';
  }
  if (/\b(pkg|package|util|helper|common)\b/.test(tokenSource)) {
    return 'helper';
  }
  if (/\b(rtl|core|datapath|alu|decoder|engine)\b/.test(tokenSource)) {
    return 'rtl';
  }
  return 'logic';
}

function tokenizeSignalName(name: string) {
  return normalizeVhdlIdentifier(name)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function classifySignalName(name: string) {
  const normalized = normalizeVhdlIdentifier(name);
  const tokens = tokenizeSignalName(name);
  const categories = new Set<'clockReset' | 'protocol' | 'state' | 'control' | 'data' | 'debug'>();
  const hasToken = (pattern: RegExp) => tokens.some((token) => pattern.test(token)) || pattern.test(normalized);

  if (hasToken(/^(clk|clock|rst|reset|sck|scl)$/) || hasToken(/baud/)) {
    categories.add('clockReset');
  }
  if (hasToken(/(mosi|miso|sda|scl|sck|cs|ss|rx|tx|uart|spi|i2c)/)) {
    categories.add('protocol');
  }
  if (hasToken(/(state|fsm|phase|mode)/)) {
    categories.add('state');
  }
  if (hasToken(/(valid|ready|req|ack|grant|enable|busy|done|start|stop|we|re|wr|rd|cs)/)) {
    categories.add('control');
  }
  if (hasToken(/(data|addr|byte|word|count|cnt|index|payload|opcode)/)) {
    categories.add('data');
  }
  if (hasToken(/(probe|debug|trace|mon|watch)/)) {
    categories.add('debug');
  }

  return categories;
}

function createRootSet(values: Iterable<string>) {
  return new Set(Array.from(values).map((value) => normalizeVhdlIdentifier(value)).filter(Boolean));
}

function createEmptyInsight(signal: string) {
  return {
    signal: normalizeVhdlIdentifier(signal),
    categories: new Set<'clockReset' | 'protocol' | 'state' | 'control' | 'data' | 'debug'>(),
    entities: new Set<string>(),
    relatedNodes: new Set<string>(),
  };
}

function addRootsToMap(target: Map<string, Set<string>>, key: string, values: Iterable<string>) {
  const normalizedKey = normalizeVhdlIdentifier(key);
  if (!normalizedKey) return false;
  const bucket = target.get(normalizedKey) || new Set<string>();
  const beforeSize = bucket.size;
  for (const value of values) {
    const normalizedValue = normalizeVhdlIdentifier(value);
    if (normalizedValue) {
      bucket.add(normalizedValue);
    }
  }
  target.set(normalizedKey, bucket);
  return bucket.size !== beforeSize;
}

function propagateEntityRoots(model: VhdlEntitySemanticModel, seedMap: Map<string, Set<string>>) {
  const adjacency = new Map<string, Set<string>>();
  const connect = (left: string, right: string) => {
    const leftKey = normalizeVhdlIdentifier(left);
    const rightKey = normalizeVhdlIdentifier(right);
    if (!leftKey || !rightKey || leftKey === rightKey) return;
    const leftBucket = adjacency.get(leftKey) || new Set<string>();
    leftBucket.add(rightKey);
    adjacency.set(leftKey, leftBucket);
    const rightBucket = adjacency.get(rightKey) || new Set<string>();
    rightBucket.add(leftKey);
    adjacency.set(rightKey, rightBucket);
  };

  model.aliases.forEach(([left, right]) => connect(left, right));
  model.assignments.forEach(([left, right]) => connect(left, right));

  const resolved = new Map<string, Set<string>>();
  const queue: string[] = [];
  for (const [key, roots] of seedMap.entries()) {
    addRootsToMap(resolved, key, roots);
    queue.push(normalizeVhdlIdentifier(key));
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentRoots = resolved.get(current);
    if (!currentRoots) continue;
    for (const neighbor of adjacency.get(current) || []) {
      if (addRootsToMap(resolved, neighbor, currentRoots)) {
        queue.push(neighbor);
      }
    }
  }

  return resolved;
}

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

function buildMacroSignalIndexFromParsedSources(params: {
  rootEntity: string;
  selectedSources: Array<Pick<VhdlSourceDescriptor, 'path' | 'isTestbench'>>;
  sourceContents: Map<string, string>;
}) {
  const { rootEntity, selectedSources, sourceContents } = params;
  const normalizedSelectedSources = selectedSources.map((source) => ({
    path: source.path,
    isTestbench: source.isTestbench,
  }));

  const { entityPorts, models } = buildVhdlSemanticModels({
    sources: normalizedSelectedSources,
    sourceContents,
  });
  const entityRoles = Object.fromEntries(
    Array.from(models.entries())
      .map(([entityName, model]) => [entityName, inferEntityRole(model, entityName, model.sourcePath)])
      .sort((left, right) => left[0].localeCompare(right[0]))
  );
  const normalizedRootEntity = normalizeVhdlIdentifier(rootEntity);
  const rootModel = models.get(normalizedRootEntity);
  const rootVisibleSignals = Array.from(new Set([
    ...(rootModel?.ports || entityPorts.get(normalizedRootEntity) || []),
    ...(rootModel?.localSignals || []),
  ])).map((signalName) => normalizeVhdlIdentifier(signalName)).filter(Boolean);
  const rootVisibleSet = createRootSet(rootVisibleSignals);

  const categoryBuckets = {
    clockReset: new Set<string>(),
    protocol: new Set<string>(),
    state: new Set<string>(),
    control: new Set<string>(),
    data: new Set<string>(),
    debug: new Set<string>(),
    all: new Set<string>(rootVisibleSignals),
  };
  const reachableEntities = new Set<string>([normalizedRootEntity]);
  const traversalVisited = new Set<string>();
  const signalInsights = new Map<string, ReturnType<typeof createEmptyInsight>>();

  const ensureInsight = (signalName: string) => {
    const normalizedSignal = normalizeVhdlIdentifier(signalName);
    const existing = signalInsights.get(normalizedSignal);
    if (existing) {
      return existing;
    }
    const created = createEmptyInsight(normalizedSignal);
    signalInsights.set(normalizedSignal, created);
    return created;
  };

  const recordSignalObservation = (params: {
    signalName: string;
    entityName: string;
    nodeName: string;
    categories: Iterable<'clockReset' | 'protocol' | 'state' | 'control' | 'data' | 'debug'>;
  }) => {
    const insight = ensureInsight(params.signalName);
    insight.entities.add(normalizeVhdlIdentifier(params.entityName));
    insight.relatedNodes.add(normalizeVhdlIdentifier(params.nodeName));
    for (const category of params.categories) {
      insight.categories.add(category);
    }
  };

  const traverseEntity = (entityName: string, seedMap: Map<string, Set<string>>, depth = 0) => {
    if (depth > 10) {
      return;
    }
    const model = models.get(entityName);
    if (!model) {
      return;
    }

    const signature = `${entityName}|${Array.from(seedMap.entries()).map(([key, values]) => `${key}:${Array.from(values).sort().join(',')}`).sort().join(';')}`;
    if (traversalVisited.has(signature)) {
      return;
    }
    traversalVisited.add(signature);

    const resolved = propagateEntityRoots(model, seedMap);
    for (const [nodeName, roots] of resolved.entries()) {
      const resolvedRoots = Array.from(roots).filter((rootSignal) => rootVisibleSet.has(rootSignal));
      if (resolvedRoots.length === 0) {
        continue;
      }
      categoryBuckets.all.forEach(() => undefined);
      resolvedRoots.forEach((rootSignal) => categoryBuckets.all.add(rootSignal));
      const categories = classifySignalName(nodeName);
      categories.forEach((category) => {
        resolvedRoots.forEach((rootSignal) => categoryBuckets[category].add(rootSignal));
      });
      resolvedRoots.forEach((rootSignal) => {
        recordSignalObservation({
          signalName: rootSignal,
          entityName,
          nodeName,
          categories,
        });
      });
    }

    model.instances.forEach((instance) => {
      reachableEntities.add(instance.entity);
      const childSeedMap = new Map<string, Set<string>>();
      instance.connections.forEach((connection) => {
        const aggregatedRoots = new Set<string>();
        connection.signals.forEach((signalName) => {
          const roots = resolved.get(normalizeVhdlIdentifier(signalName));
          if (!roots || roots.size === 0) {
            return;
          }
          roots.forEach((rootSignal) => aggregatedRoots.add(rootSignal));
        });
        if (aggregatedRoots.size > 0) {
          addRootsToMap(childSeedMap, connection.port, aggregatedRoots);
        }
      });
      if (childSeedMap.size > 0) {
        traverseEntity(instance.entity, childSeedMap, depth + 1);
      }
    });
  };

  const rootSeedMap = new Map<string, Set<string>>();
  rootVisibleSignals.forEach((signalName) => {
    addRootsToMap(rootSeedMap, signalName, [signalName]);
    const seedCategories = classifySignalName(signalName);
    seedCategories.forEach((category) => categoryBuckets[category].add(signalName));
    recordSignalObservation({
      signalName,
      entityName: normalizedRootEntity,
      nodeName: signalName,
      categories: seedCategories,
    });
  });

  if (rootModel) {
    traverseEntity(normalizedRootEntity, rootSeedMap);
  }

  return {
    rootEntity: normalizedRootEntity,
    selectedSourcePaths: normalizedSelectedSources.map((source) => source.path).sort(),
    rootVisibleSignals,
    reachableEntities: Array.from(reachableEntities).sort(),
    entityRoles,
    signalInsights: Array.from(signalInsights.values())
      .map((insight) => ({
        signal: insight.signal,
        categories: Array.from(insight.categories).sort(),
        entities: Array.from(insight.entities).sort(),
        relatedNodes: Array.from(insight.relatedNodes).sort(),
      }))
      .sort((left, right) => left.signal.localeCompare(right.signal)),
    categorySignals: {
      clockReset: Array.from(categoryBuckets.clockReset).sort(),
      protocol: Array.from(categoryBuckets.protocol).sort(),
      state: Array.from(categoryBuckets.state).sort(),
      control: Array.from(categoryBuckets.control).sort(),
      data: Array.from(categoryBuckets.data).sort(),
      debug: Array.from(categoryBuckets.debug).sort(),
      all: Array.from(categoryBuckets.all).sort(),
    },
  } satisfies MacroSignalIndex;
}

function buildMacroSignalIndexFromFixtures(params: {
  rootEntity: string;
  sources: SemanticSourceFixture[];
}) {
  const sourceContents = new Map<string, string>();
  params.sources.forEach((source) => {
    sourceContents.set(source.path, stripVhdlComments(source.content));
  });

  return buildMacroSignalIndexFromParsedSources({
    rootEntity: params.rootEntity,
    selectedSources: params.sources.map((source) => ({
      path: source.path,
      isTestbench: source.isTestbench,
    })),
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

function countSignalTransitions(values: Array<number | string>) {
  let transitions = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (values[index] !== values[index - 1]) {
      transitions += 1;
    }
  }
  return transitions;
}

function selectMacroSignals(params: {
  macroId: AiMacroId;
  signals: AnalyzerSignal[];
  index: MacroSignalIndex;
}) {
  const { macroId, signals, index } = params;
  const insightMap = new Map(index.signalInsights.map((insight) => [normalizeVhdlIdentifier(insight.signal), insight]));
  const entityRoleMap = new Map(Object.entries(index.entityRoles).map(([entityName, role]) => [normalizeVhdlIdentifier(entityName), role]));
  const categorySets = {
    all: createRootSet(index.categorySignals.all),
    clockReset: createRootSet(index.categorySignals.clockReset),
    protocol: createRootSet(index.categorySignals.protocol),
    state: createRootSet(index.categorySignals.state),
    control: createRootSet(index.categorySignals.control),
    data: createRootSet(index.categorySignals.data),
    debug: createRootSet(index.categorySignals.debug),
  };

  const desiredCategories: Array<keyof typeof categorySets> =
    macroId === 'protocol_decoder_details' || macroId === 'summarize_protocol_timeline'
      ? ['protocol', 'clockReset', 'control', 'data', 'all']
      : macroId === 'inspect_race_hazards' || macroId === 'verify_clock_reset_sequence'
        ? ['clockReset', 'control', 'data', 'protocol', 'debug', 'all']
        : macroId === 'explain_fsm_behavior'
          ? ['state', 'control', 'clockReset', 'data', 'all']
          : macroId === 'generate_vhdl_tb' || macroId === 'generate_vhdl_assertions' || macroId === 'draft_rtl_skeleton'
            ? ['all', 'clockReset', 'control', 'data', 'state', 'protocol']
            : macroId === 'suggest_debug_probes'
              ? ['protocol', 'clockReset', 'control', 'state', 'data', 'debug', 'all']
              : ['all', 'clockReset', 'control', 'data', 'protocol', 'state'];

  const desiredSet = new Set<string>();
  desiredCategories.forEach((category) => {
    categorySets[category].forEach((signalName) => desiredSet.add(signalName));
  });

  const preferredRoles =
    macroId === 'protocol_decoder_details' || macroId === 'summarize_protocol_timeline'
      ? ['protocol', 'wrapper', 'rtl', 'logic']
      : macroId === 'inspect_race_hazards' || macroId === 'verify_clock_reset_sequence'
        ? ['testbench', 'wrapper', 'control', 'rtl', 'logic']
        : macroId === 'explain_fsm_behavior'
          ? ['control', 'rtl', 'wrapper', 'logic']
          : macroId === 'generate_vhdl_tb' || macroId === 'generate_vhdl_assertions' || macroId === 'draft_rtl_skeleton'
            ? ['wrapper', 'rtl', 'control', 'protocol', 'logic']
            : macroId === 'suggest_debug_probes'
              ? ['protocol', 'control', 'wrapper', 'rtl', 'memory', 'logic']
              : ['rtl', 'wrapper', 'control', 'protocol', 'logic'];
  const roleWeight = (role: string | undefined) => {
    if (!role) return 0;
    const position = preferredRoles.indexOf(role);
    return position >= 0 ? Math.max(1, preferredRoles.length - position) : 0;
  };

  const scoredSignals = signals.map((signal) => {
    const normalizedName = normalizeVhdlIdentifier(getSignalName(signal));
    const insight = insightMap.get(normalizedName);
    const activityScore = Math.min(8, countSignalTransitions(getSignalValues(signal)));
    let score = 0;
    if (categorySets.all.has(normalizedName)) score += 10;
    if (categorySets.clockReset.has(normalizedName)) score += desiredCategories.includes('clockReset') ? 8 : 2;
    if (categorySets.protocol.has(normalizedName)) score += desiredCategories.includes('protocol') ? 8 : 2;
    if (categorySets.state.has(normalizedName)) score += desiredCategories.includes('state') ? 8 : 2;
    if (categorySets.control.has(normalizedName)) score += desiredCategories.includes('control') ? 6 : 2;
    if (categorySets.data.has(normalizedName)) score += desiredCategories.includes('data') ? 5 : 1;
    if (categorySets.debug.has(normalizedName)) score += desiredCategories.includes('debug') ? 5 : 1;
    score += activityScore;
    score += Math.min(6, insight?.entities.length || 0);
    score += Math.min(4, insight?.categories.length || 0);
    score += Math.max(...(insight?.entities.map((entityName) => roleWeight(entityRoleMap.get(entityName))) || [0]));

    return {
      signal,
      normalizedName,
      score,
      activityScore,
      insight,
    };
  });

  const limit =
    macroId === 'protocol_decoder_details' || macroId === 'summarize_protocol_timeline'
      ? 10
      : macroId === 'inspect_race_hazards' || macroId === 'verify_clock_reset_sequence'
        ? 12
        : macroId === 'explain_fsm_behavior'
          ? 12
          : macroId === 'custom_query'
            ? 16
            : 18;

  const mandatoryNames = scoredSignals
    .filter((entry) => desiredSet.has(entry.normalizedName))
    .sort((left, right) => right.score - left.score || left.signal.name.localeCompare(right.signal.name))
    .slice(0, Math.min(limit, Math.max(6, desiredSet.size)))
    .map((entry) => entry.normalizedName);

  const selected = scoredSignals
    .sort((left, right) => right.score - left.score || left.signal.name.localeCompare(right.signal.name))
    .filter((entry, index, array) => mandatoryNames.includes(entry.normalizedName) || (entry.score > 0 && index < limit) || (array.length <= limit))
    .slice(0, limit);

  const selectedNames = new Set(selected.map((entry) => entry.normalizedName));
  mandatoryNames.forEach((mandatoryName) => {
    if (selectedNames.has(mandatoryName)) {
      return;
    }
    const match = scoredSignals.find((entry) => entry.normalizedName === mandatoryName);
    if (match) {
      selected.push(match);
      selectedNames.add(mandatoryName);
    }
  });

  const selectedEntries = selected
    .sort((left, right) => right.score - left.score || left.signal.name.localeCompare(right.signal.name))
    .slice(0, limit);
  const focusEntityScores = new Map<string, number>();
  selectedEntries.forEach((entry) => {
    entry.insight?.entities.forEach((entityName) => {
      const normalizedEntity = normalizeVhdlIdentifier(entityName);
      const nextScore = (focusEntityScores.get(normalizedEntity) || 0)
        + entry.score
        + roleWeight(entityRoleMap.get(normalizedEntity));
      focusEntityScores.set(normalizedEntity, nextScore);
    });
  });
  const focusEntities = Array.from(focusEntityScores.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 6)
    .map(([entityName]) => entityName);

  return {
    selectedSignals: selectedEntries.map((entry) => entry.signal),
    selectedSignalInsights: selectedEntries.map((entry) => ({
      signal: getSignalName(entry.signal),
      normalizedSignal: entry.normalizedName,
      score: entry.score,
      activityScore: entry.activityScore,
      categories: entry.insight?.categories || [],
      entities: entry.insight?.entities || [],
      relatedNodes: entry.insight?.relatedNodes || [],
    })),
    desiredCategories,
    focusEntities,
  };
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
  autoInstall?: boolean;
}) {
  const logs: string[] = [];
  const { projectPath, topEntity, sourcePaths, stopTime, autoInstall } = params;
  const status = autoInstall ? await ensureGhdlInstalled(logs) : await getGhdlStatus();

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
  return ['.git', 'node_modules', 'dist', 'build', '.next', '.automata-logicpro'].includes(name);
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
}) {
  const { ai, provider, model, prompt, signal } = params;

  switch (provider) {
    case 'gemini': {
      if (!ai) {
        throw new Error('Gemini is unconfigured. Set GEMINI_API_KEY.');
      }
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      return response.text || 'No response generated from the model.';
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
            return await attempt();
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
        return responseText;
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
      return data.choices?.[0]?.message?.content || 'No response generated from OpenAI.';
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
      return data.choices?.[0]?.message?.content || 'No response generated from OpenRouter.';
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
      return data.choices?.[0]?.message?.content || 'No response generated from Groq.';
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
      return data.choices?.[0]?.message?.content || 'No response generated from Mistral.';
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
      return content.map((block: any) => block.text || '').join('\n').trim() || 'No response generated from Anthropic.';
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

async function bootstrap() {
  const app = express();
  const PORT = 3000;
  const HOST = '127.0.0.1';
  const SESSION_HEADER = 'x-logicpro-session';
  const sessionToken = randomUUID();
  const approvedProjectRoots = new Set<string>();

  const rememberApprovedProjectRoot = async (rootPath: string) => {
    const normalizedRoot = await normalizeFilesystemPath(rootPath);
    approvedProjectRoots.add(normalizedRoot);
    return normalizedRoot;
  };

  const assertApprovedProjectPath = async (candidatePath: string, label = 'Project path') => {
    const normalizedPath = await normalizeFilesystemPath(candidatePath);
    for (const approvedRoot of approvedProjectRoots) {
      if (isPathWithinRoot(normalizedPath, approvedRoot)) {
        return normalizedPath;
      }
    }

    const error = new Error(
      `${label} is not approved for this app session. Re-select the project folder from inside AUTOMATA LogicPro and try again.`
    );
    (error as any).statusCode = 403;
    throw error;
  };

  // Middleware for body parsing
  app.use(express.json({ limit: '10mb' }));

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
    console.warn('GEMINI_API_KEY environment variable is not defined. AI Assist features will fallback.');
  }

  // --- API ROUTES ---

  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', database: 'local_persistence' });
  });

  app.get('/api/session', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({ token: sessionToken });
  });

  app.use('/api', (req, res, next) => {
    if (req.path === '/health' || req.path === '/session') {
      return next();
    }

    const providedToken = typeof req.header(SESSION_HEADER) === 'string' ? req.header(SESSION_HEADER) : '';
    if (providedToken !== sessionToken) {
      return res.status(401).json({
        error: 'Missing or invalid local session token. Refresh the app and try again.',
      });
    }

    return next();
  });

  app.post('/api/project/select', async (req, res) => {
    try {
      const requestedDefaultPath = typeof req.body?.defaultPath === 'string' ? req.body.defaultPath : null;
      const projectPath = await chooseProjectFolder(requestedDefaultPath);
      const approvedProjectPath = await rememberApprovedProjectRoot(projectPath);
      const files = await listProjectFiles(approvedProjectPath);
      res.json({
        name: path.basename(approvedProjectPath),
        path: approvedProjectPath,
        files,
      });
    } catch (error: any) {
      if (isAppleScriptCancel(error)) {
        return res.status(400).json({ cancelled: true });
      }
      res.status(error?.statusCode || 500).json({ error: error.message || error });
    }
  });

  app.post('/api/project/restore', async (req, res) => {
    const projectPath = typeof req.body?.projectPath === 'string' ? req.body.projectPath.trim() : '';
    if (!projectPath) {
      return res.status(400).json({ error: 'Project path is required.' });
    }

    try {
      const approvedProjectPath = await rememberApprovedProjectRoot(await ensureDirectoryPath(projectPath, 'Project folder'));
      const files = await listProjectFiles(approvedProjectPath);
      res.json({
        name: path.basename(approvedProjectPath),
        path: approvedProjectPath,
        files,
      });
    } catch (error: any) {
      res.status(error?.statusCode || 500).json({ error: error.message || error });
    }
  });

  app.post('/api/project/open-workspace', async (req, res) => {
    try {
      const defaultPath = typeof req.body?.projectPath === 'string' && req.body.projectPath.trim()
        ? await assertApprovedProjectPath(req.body.projectPath, 'Workspace default path')
        : null;
      const selectedPath = await chooseWorkspaceFile(defaultPath);
      await rememberApprovedProjectRoot(path.dirname(selectedPath));
      const content = await fs.readFile(selectedPath, 'utf8');
      res.json({
        name: path.basename(selectedPath),
        path: selectedPath,
        content,
      });
    } catch (error: any) {
      if (isAppleScriptCancel(error)) {
        return res.status(400).json({ cancelled: true });
      }
      res.status(error?.statusCode || 500).json({ error: error.message || error });
    }
  });

  app.post('/api/project/save-vcd', async (req, res) => {
    try {
      const projectPath = typeof req.body?.projectPath === 'string' && req.body.projectPath.trim()
        ? await assertApprovedProjectPath(req.body.projectPath, 'Export directory')
        : null;
      const suggestedName = typeof req.body?.suggestedName === 'string' && req.body.suggestedName.trim()
        ? req.body.suggestedName.trim()
        : 'logic_dump.vcd';
      const content = typeof req.body?.content === 'string' ? req.body.content : '';
      const targetPath = await chooseExportPath(projectPath, suggestedName);
      await fs.writeFile(targetPath, content, 'utf8');
      res.json({ path: targetPath, name: path.basename(targetPath) });
    } catch (error: any) {
      if (isAppleScriptCancel(error)) {
        return res.status(400).json({ cancelled: true });
      }
      res.status(error?.statusCode || 500).json({ error: error.message || error });
    }
  });

  app.get('/api/ghdl/status', async (req, res) => {
    try {
      res.json(await getGhdlStatus());
    } catch (error: any) {
      res.status(500).json({ error: error.message || error });
    }
  });

  app.post('/api/ghdl/project-info', async (req, res) => {
    const projectPath = typeof req.body?.projectPath === 'string' ? req.body.projectPath.trim() : '';
    if (!projectPath) {
      return res.status(400).json({ error: 'Project path is required.' });
    }

    try {
      const sources = await collectVhdlSources(await assertApprovedProjectPath(projectPath));
      res.json(buildVhdlProjectInfo(sources));
    } catch (error: any) {
      res.status(error?.statusCode || 500).json({ error: error.message || error });
    }
  });

  app.post('/api/ghdl/install', async (req, res) => {
    const logs: string[] = [];
    try {
      const status = await ensureGhdlInstalled(logs);
      res.json({ status, logs });
    } catch (error: any) {
      res.status(500).json({ error: error.message || error, logs });
    }
  });

  app.post('/api/ghdl/run', async (req, res) => {
    const { projectPath, topEntity, sourcePaths, stopTime, autoInstall } = req.body;

    if (typeof projectPath !== 'string' || !projectPath.trim()) {
      return res.status(400).json({ error: 'Project path is required.' });
    }
    if (typeof topEntity !== 'string' || !topEntity.trim()) {
      return res.status(400).json({ error: 'Top entity or testbench name is required.' });
    }

    try {
      const normalizedProjectPath = await assertApprovedProjectPath(projectPath.trim());
      const normalizedTopEntity = topEntity.trim();
      const normalizedSourcePaths = Array.isArray(sourcePaths) ? sourcePaths : undefined;
      const result = await runGhdlSimulation({
        projectPath: normalizedProjectPath,
        topEntity: normalizedTopEntity,
        sourcePaths: normalizedSourcePaths,
        stopTime: typeof stopTime === 'string' && stopTime.trim() ? stopTime.trim() : undefined,
        autoInstall: Boolean(autoInstall),
      });
      try {
        await getOrBuildMacroSignalIndex({
          projectPath: normalizedProjectPath,
          rootEntity: normalizedTopEntity,
          sourcePaths: normalizedSourcePaths,
        });
      } catch (cacheError: any) {
        result.logs = [
          ...result.logs,
          `Macro signal index warmup skipped: ${cacheError?.message || String(cacheError)}`,
        ];
      }
      res.json(result);
    } catch (error: any) {
      res.status(error?.statusCode || 500).json({ error: error.message || error, logs: error.logs || [] });
    }
  });

  app.get('/api/ai/providers', async (req, res) => {
    try {
      const providers = getProviderDescriptors();
      res.json({ providers });
    } catch (error: any) {
      res.status(500).json({ error: error.message || error });
    }
  });

  app.get('/api/ai/providers/:provider/models', async (req, res) => {
    const provider = req.params.provider as LLMProviderId;
    const providerInfo = getProviderDescriptors().find((entry) => entry.id === provider);

    if (!providerInfo) {
      return res.status(404).json({ error: `Unknown provider: ${req.params.provider}` });
    }

    try {
      const models = await listProviderModels(provider);
      res.json({ provider: providerInfo, models });
    } catch (error: any) {
      res.status(500).json({
        provider: providerInfo,
        models: STATIC_PROVIDER_MODELS[provider] || [],
        error: error.message || error,
      });
    }
  });

  // REST API: Run Gemini Timing Diagram Analysis
  app.post('/api/ai-encode', async (req, res) => {
    // Legacy endpoint support
    res.json({ ok: true });
  });

  app.post('/api/ai-jobs/:jobId/cancel', async (req, res) => {
    const jobId = typeof req.params.jobId === 'string' ? req.params.jobId : '';
    const controller = activeAiJobs.get(jobId);
    if (!controller) {
      return res.status(404).json({ ok: false, error: 'AI job not found or already finished.' });
    }
    controller.abort(new Error('Request was cancelled by the user.'));
    activeAiJobs.delete(jobId);
    return res.json({ ok: true, jobId, cancelled: true });
  });

  app.post('/api/ai/test-generate', async (req, res) => {
    const provider = typeof req.body?.provider === 'string' && req.body.provider.trim()
      ? req.body.provider.trim() as LLMProviderId
      : null;
    const model = typeof req.body?.model === 'string' && req.body.model.trim()
      ? req.body.model.trim()
      : '';

    if (!provider) {
      return res.status(400).json({ error: 'Provider is required.' });
    }
    if (!model) {
      return res.status(400).json({ error: 'Model is required.' });
    }

    const startedAt = Date.now();
    try {
      const responseText = await runModelAnalysis({
        ai,
        provider,
        model,
        prompt: [
          'Reply with exactly this token and nothing else:',
          'TEST_OK',
          'Do not add explanation, markdown, quotes, code fences, labels, or reasoning.'
        ].join('\n'),
      });

      const durationMs = Math.max(0, Date.now() - startedAt);
      const trimmed = responseText.trim();
      const normalized = normalizeLlmTestResponse(trimmed);
      const score = durationMs < 2000 ? 'fast' : durationMs < 8000 ? 'good' : durationMs < 20000 ? 'slow' : 'very slow';
      const passedExactMatch = llmTestPassedExactMatch(trimmed);

      return res.json({
        ok: true,
        provider,
        model,
        durationMs,
        speedScore: score,
        responsePreview: trimmed.slice(0, 200),
        normalizedResponsePreview: normalized.slice(0, 200),
        passedExactMatch,
      });
    } catch (error: any) {
      return res.status(500).json({
        ok: false,
        provider,
        model,
        durationMs: Math.max(0, Date.now() - startedAt),
        error: error.message || String(error),
      });
    }
  });

  app.post('/api/ai-analyze', async (req, res) => {
    const { provider, signals, query, model, timeUnit, tickDuration, projectContext, projectPath, workspaceFileName } = req.body;
    const simulationMacroContext = req.body?.simulationMacroContext;
    const jobId = typeof req.body?.jobId === 'string' && req.body.jobId.trim() ? req.body.jobId.trim() : randomUUID();
    const macroId: AiMacroId = typeof req.body?.macroId === 'string' && req.body.macroId.trim()
      ? req.body.macroId.trim() as AiMacroId
      : 'custom_query';
    const tbGenerationMode: TbGenerationMode | null = req.body?.tbGenerationMode === 'reverse_from_vcd'
      ? 'reverse_from_vcd'
      : req.body?.tbGenerationMode === 'project_entities'
        ? 'project_entities'
        : null;

    if (!query) {
      return res.status(400).json({ error: 'User query is required.' });
    }

    const controller = new AbortController();
    activeAiJobs.set(jobId, controller);

    const abortActiveJob = (reason: string) => {
      if (activeAiJobs.has(jobId)) {
        controller.abort(new Error(reason));
        activeAiJobs.delete(jobId);
      }
    };

    // Only abort on a real client disconnect/cancellation, not on the normal
    // request stream closing after Express finishes reading the POST body.
    req.on('aborted', () => {
      abortActiveJob('Request was cancelled by the client connection.');
    });
    res.on('close', () => {
      if (!res.writableEnded) {
        abortActiveJob('Request was cancelled by the client connection.');
      }
    });

    try {
      const resolvedTickDuration = Number.isFinite(Number(tickDuration)) ? Number(tickDuration) : 1;
      const resolvedTimeUnit = typeof timeUnit === 'string' && timeUnit.trim() ? timeUnit : 'ns';
      const hazardScan = analyzeWaveformHazards(
        Array.isArray(signals) ? signals : [],
        resolvedTickDuration,
        resolvedTimeUnit
      );
      const protocolScan = analyzeProtocolFrames(
        Array.isArray(signals) ? signals : [],
        resolvedTickDuration,
        resolvedTimeUnit
      );

      const allSignals = Array.isArray(signals) ? signals : [];
      let normalizedProjectPath = '';
      let projectPathUnavailableReason = '';
      if (typeof projectPath === 'string' && projectPath.trim()) {
        try {
          normalizedProjectPath = await assertApprovedProjectPath(projectPath.trim());
        } catch (projectPathError: any) {
          projectPathUnavailableReason = projectPathError?.message || String(projectPathError);
        }
      }
      const simulationRootEntity = typeof simulationMacroContext?.rootEntity === 'string' && simulationMacroContext.rootEntity.trim()
        ? simulationMacroContext.rootEntity.trim()
        : '';
      const simulationSourcePaths = Array.isArray(simulationMacroContext?.sourcePaths)
        ? simulationMacroContext.sourcePaths.filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
        : [];

      let macroSignalIndex: MacroSignalIndex | null = null;
      let selectedSignals = allSignals;
      let waveformSelectionText = '';
      let macroDiagnostics: {
        rootEntity: string;
        reachableEntities: string[];
        entityRoles: Record<string, string>;
        focusEntities: string[];
        desiredCategories: string[];
        semanticConfidence: number;
        selectionNotes: string[];
        visibleSignalsSent: number;
        totalSignalsAvailable: number;
        selectedSignals: Array<{
          signal: string;
          normalizedSignal: string;
          score: number;
          activityScore: number;
          categories: string[];
          entities: string[];
          relatedNodes: string[];
        }>;
      } | null = null;

      if (normalizedProjectPath && simulationRootEntity && allSignals.length > 0) {
        try {
          macroSignalIndex = await getOrBuildMacroSignalIndex({
            projectPath: normalizedProjectPath,
            rootEntity: simulationRootEntity,
            sourcePaths: simulationSourcePaths,
          });
          const signalSelection = selectMacroSignals({
            macroId,
            signals: allSignals,
            index: macroSignalIndex,
          });
          if (signalSelection.selectedSignals.length > 0) {
            selectedSignals = signalSelection.selectedSignals;
          }
          const roleCounts = Object.values(macroSignalIndex.entityRoles).reduce<Record<string, number>>((acc, role) => {
            acc[role] = (acc[role] || 0) + 1;
            return acc;
          }, {});
          const selectedWithInsights = signalSelection.selectedSignalInsights.filter((signal) => signal.entities.length > 0 || signal.categories.length > 0).length;
          const semanticConfidence = selectedSignals.length > 0
            ? Math.round((selectedWithInsights / selectedSignals.length) * 100)
            : 0;
          const selectionNotes = [
            `selected ${selectedSignals.length} of ${allSignals.length} visible signals for ${macroId}`,
            `reachable entities: ${macroSignalIndex.reachableEntities.length}`,
            `entity roles observed: ${Object.entries(roleCounts).map(([role, count]) => `${role}=${count}`).join(', ') || 'none'}`,
          ];
          if (selectedWithInsights < selectedSignals.length) {
            selectionNotes.push(`some selected signals did not resolve to strong semantic insights (${selectedWithInsights}/${selectedSignals.length})`);
          }
          macroDiagnostics = {
            rootEntity: macroSignalIndex.rootEntity,
            reachableEntities: macroSignalIndex.reachableEntities,
            entityRoles: macroSignalIndex.entityRoles,
            focusEntities: signalSelection.focusEntities,
            desiredCategories: signalSelection.desiredCategories,
            semanticConfidence,
            selectionNotes,
            visibleSignalsSent: selectedSignals.length,
            totalSignalsAvailable: allSignals.length,
            selectedSignals: signalSelection.selectedSignalInsights,
          };

          waveformSelectionText += `### Macro Signal Selection\n`;
          waveformSelectionText += `Simulation Root: ${macroSignalIndex.rootEntity}\n`;
          waveformSelectionText += `Reachable Entities: ${macroSignalIndex.reachableEntities.join(', ') || 'none'}\n`;
          waveformSelectionText += `Entity Roles: ${Object.entries(macroSignalIndex.entityRoles).map(([entityName, role]) => `${entityName}:${role}`).join(', ') || 'none'}\n`;
          waveformSelectionText += `Macro Focus Entities: ${signalSelection.focusEntities.join(', ') || macroSignalIndex.rootEntity}\n`;
          waveformSelectionText += `Selection Categories: ${signalSelection.desiredCategories.join(', ')}\n`;
          waveformSelectionText += `Semantic Confidence: ${semanticConfidence}%\n`;
          waveformSelectionText += `Relevant Signals: ${selectedSignals.map((signal) => getSignalName(signal)).join(', ') || 'none'}\n\n`;
          waveformSelectionText += `### Signal Relevance Hints\n`;
          signalSelection.selectedSignalInsights.forEach((insight) => {
            waveformSelectionText += `- ${insight.signal}`;
            waveformSelectionText += ` | categories: ${insight.categories.join(', ') || 'uncategorized'}`;
            waveformSelectionText += ` | entities: ${insight.entities.join(', ') || macroSignalIndex?.rootEntity || 'unknown'}`;
            waveformSelectionText += ` | related nodes: ${insight.relatedNodes.slice(0, 8).join(', ') || insight.normalizedSignal}`;
            waveformSelectionText += ` | activity score: ${insight.activityScore}\n`;
          });
          waveformSelectionText += '\n';
        } catch (selectionError: any) {
          waveformSelectionText += `### Macro Signal Selection\n`;
          waveformSelectionText += `Selection fallback: full waveform set used because semantic filtering failed: ${selectionError?.message || String(selectionError)}\n\n`;
        }
      }

      // Format the timing trace data into a highly readable block for the LLM
      let waveformText = '### Captured Waves Log:\n';
      waveformText += `Time Base Unit: ${tickDuration} ${timeUnit} per tick\n`;
      waveformText += `Visible Signals Sent: ${selectedSignals.length}/${allSignals.length}\n\n`;
      waveformText += waveformSelectionText;

      if (selectedSignals.length > 0) {
        selectedSignals.forEach((sig: any) => {
          waveformText += `Signal Channel: ${sig.name} | Type: ${sig.type}\n`;
          const sampleValues = sig.values ? sig.values.slice(0, 120) : [];
          waveformText += `Ticks (0-120): ${sampleValues.map((v: any) => v === -1 ? 'Z' : v).join('')}\n\n`;
        });
      }

      let projectText = '';
      let resolvedProjectContext = projectContext;
      if ((!resolvedProjectContext || typeof resolvedProjectContext !== 'object') && normalizedProjectPath) {
        resolvedProjectContext = await buildProjectContextFromPath(normalizedProjectPath, query, workspaceFileName);
      }
      if ((!resolvedProjectContext || typeof resolvedProjectContext !== 'object') && projectPathUnavailableReason) {
        projectText += `### Project Workspace Context\n`;
        projectText += `Server-side project file enrichment skipped: ${projectPathUnavailableReason}\n\n`;
      }

      if (resolvedProjectContext && typeof resolvedProjectContext === 'object') {
        const projectName = typeof resolvedProjectContext.name === 'string' ? resolvedProjectContext.name : 'Selected project';
        const fileCount = Number.isFinite(resolvedProjectContext.fileCount) ? Number(resolvedProjectContext.fileCount) : 0;
        const filePaths = Array.isArray(resolvedProjectContext.filePaths) ? resolvedProjectContext.filePaths.slice(0, 80) : [];
        const excerpts = Array.isArray(resolvedProjectContext.excerpts) ? resolvedProjectContext.excerpts.slice(0, 8) : [];

        projectText += `### Project Workspace Context\n`;
        projectText += `Project Name: ${projectName}\n`;
        projectText += `Project File Count: ${fileCount}\n`;
        if (filePaths.length > 0) {
          projectText += `Project Files:\n${filePaths.map((filePath: string) => `- ${filePath}`).join('\n')}\n\n`;
        }

        excerpts.forEach((excerpt: any) => {
          if (typeof excerpt?.path !== 'string' || typeof excerpt?.content !== 'string') {
            return;
          }
          projectText += `File Excerpt: ${excerpt.path}\n`;
          projectText += `${excerpt.content}\n\n`;
        });
      }

      // Construct expert-level Prompt
      const systemPrompt = `You are a professional ASIC/FPGA digital design engineer, embedding systems developer, and veteran hardware logic analyzer debugger.
You are assisting a developer using "Signal Logic Pro" logic waveforms.
Review the following timing diagram traces captured by the logic analyzer and answer the developer's question.

${waveformText}
${protocolScan.markdown}

${hazardScan.markdown}

${projectText}

Return your explanation in beautifully formatted markdown with clear sections. Prefer VHDL for any HDL examples, RTL, or testbenches unless the developer explicitly asks for Verilog. You may also write C drivers or testbench setups when requested. Address timing delay offsets, race conditions, edge setup/hold times, glitches, active-low triggers, or decoded ASCII bytes. Make your answer highly detailed, technical, and constructive.

When the prompt includes "Macro Signal Selection" and "Signal Relevance Hints", treat those as the primary hierarchy-aware view of the design. Use the focus entities and related nodes to explain why each selected signal matters to the requested macro.`;

      // Call latest recommended Gemini Model
      const selectedProvider: LLMProviderId = typeof provider === 'string' && provider.trim()
        ? provider.trim() as LLMProviderId
        : 'gemini';
      const selectedModel = typeof model === 'string' && model.trim()
        ? model.trim()
        : (STATIC_PROVIDER_MODELS[selectedProvider]?.[0]?.id || 'gemini-2.5-flash');
      const responseText = await runModelAnalysis({
        ai,
        provider: selectedProvider,
        model: selectedModel,
        prompt: `${systemPrompt}\n\n${buildMacroPromptContract({
          macroId,
          userQuery: query,
          tbGenerationMode,
        })}`,
        signal: controller.signal,
      });

      const validation = validateMacroOutput({
        macroId,
        text: responseText,
        hazardFindings: hazardScan.findings,
        protocolFrames: protocolScan.frames,
      });

      return res.json({
        analysis: responseText,
        provider: selectedProvider,
        model: selectedModel,
        hazardScan,
        protocolScan,
        diagnostics: macroDiagnostics,
        macroId,
        tbGenerationMode,
        validation,
        jobId,
      });
    } catch (error: any) {
      if (isAbortError(error)) {
        return res.status(499).json({
          error: 'AI job was cancelled before completion.',
          jobId,
          macroId,
          cancelled: true,
        });
      }
      console.error('Gemini API call error:', error);
      return res.status(error?.statusCode || 500).json({
        error: `Core logic simulation analysis failed: ${error.message || error}`,
        macroId,
      });
    } finally {
      activeAiJobs.delete(jobId);
    }
  });

  // --- VITE MIDDLEWARE OR STATIC SERVER ---

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Mounted Vite development middleware.');
  } else {
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
  bootstrap().catch((err) => {
    console.error('Failed to trigger bootstrap startup server sequence:', err);
  });
}
