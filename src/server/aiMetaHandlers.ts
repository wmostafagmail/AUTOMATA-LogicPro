import type express from 'express';
import type { GoogleGenAI } from '@google/genai';
import { createSessionManager, type LogicProSession } from './sessionManager';
import type { PreparedVhdlSkillPrompt } from './vhdlSkillOrchestrator';
import { normalizePreparedPrompt } from './aiPromptUtils';

type SessionManager = ReturnType<typeof createSessionManager>;

type ProviderDescriptor = {
  id: string;
  label: string;
  enabled: boolean;
  reason?: string;
  deployment: 'local' | 'remote';
};

type ProviderModel = {
  id: string;
  label: string;
};

type ModelAnalysisResult = {
  text: string;
};

export function createAiMetaRouteContext(params: {
  ai: GoogleGenAI | null;
  getProviderDescriptors: () => ProviderDescriptor[];
  getRequiredSession: (req: express.Request) => LogicProSession;
  sessionManager: SessionManager;
  listProviderModels: (provider: string) => Promise<ProviderModel[]>;
  staticProviderModels: Record<string, ProviderModel[]>;
  applyMandatoryVhdlSkill: (taskPrompt: string) => Promise<string | PreparedVhdlSkillPrompt>;
  runModelAnalysis: (params: {
    ai: GoogleGenAI | null;
    provider: string;
    model: string;
    prompt: string;
  }) => Promise<ModelAnalysisResult>;
  normalizeLlmTestResponse: (text: string) => string;
  llmTestPassedExactMatch: (text: string) => boolean;
}) {
  const {
    ai,
    getProviderDescriptors,
    getRequiredSession,
    sessionManager,
    listProviderModels,
    staticProviderModels,
    applyMandatoryVhdlSkill,
    runModelAnalysis,
    normalizeLlmTestResponse,
    llmTestPassedExactMatch,
  } = params;

  const getProvidersHandler: express.RequestHandler = async (_req, res) => {
    try {
      const providers = getProviderDescriptors();
      res.json({ providers });
    } catch (error: any) {
      res.status(500).json({ error: error.message || error });
    }
  };

  const getRemoteExportConsentHandler: express.RequestHandler = async (req, res) => {
    try {
      const session = getRequiredSession(req);
      res.json({
        consents: sessionManager.getRemoteExportConsents(session),
      });
    } catch (error: any) {
      res.status(error?.statusCode || 500).json({ error: error.message || error });
    }
  };

  const setRemoteExportConsentHandler: express.RequestHandler = async (req, res) => {
    const provider = typeof req.body?.provider === 'string' ? req.body.provider.trim() : '';
    if (!provider) {
      return res.status(400).json({ error: 'Provider is required.' });
    }

    try {
      const session = getRequiredSession(req);
      const allowed = req.body?.allowed === true;
      res.json({
        provider,
        allowed,
        consents: sessionManager.setRemoteExportConsent(session, provider, allowed),
      });
    } catch (error: any) {
      res.status(error?.statusCode || 500).json({ error: error.message || error });
    }
  };

  const listProviderModelsHandler: express.RequestHandler = async (req, res) => {
    const provider = req.params.provider;
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
        models: staticProviderModels[provider] || [],
        error: error.message || error,
      });
    }
  };

  const legacyEncodeHandler: express.RequestHandler = async (_req, res) => {
    res.json({ ok: true });
  };

  const testGenerateHandler: express.RequestHandler = async (req, res) => {
    const provider = typeof req.body?.provider === 'string' && req.body.provider.trim()
      ? req.body.provider.trim()
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
      const preparedPrompt = await applyMandatoryVhdlSkill([
        'Reply with exactly this token and nothing else:',
        'TEST_OK',
        'Do not add explanation, markdown, quotes, code fences, labels, or reasoning.'
      ].join('\n'));
      const testPrompt = normalizePreparedPrompt(preparedPrompt).prompt;
      const result = await runModelAnalysis({
        ai,
        provider,
        model,
        prompt: testPrompt,
      });
      const responseText = result.text;

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
  };

  return {
    getProvidersHandler,
    getRemoteExportConsentHandler,
    setRemoteExportConsentHandler,
    listProviderModelsHandler,
    legacyEncodeHandler,
    testGenerateHandler,
  };
}
