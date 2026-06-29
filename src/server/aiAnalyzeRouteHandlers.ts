import { randomUUID } from 'crypto';
import type express from 'express';
import type { GoogleGenAI } from '@google/genai';
import type { AiMacroId, TbGenerationMode } from '../aiMacros';
import type { LogicProSession, createSessionManager } from './sessionManager';
import type { PreparedAiAnalyzeRequest } from './aiAnalyzePreparation';

type SessionManager = ReturnType<typeof createSessionManager>;

type BeginTrackedJobResult = {
  controller: AbortController;
  abortTrackedJob: (reason: string) => void;
};

type ProviderDescriptor = {
  id: string;
  label: string;
  enabled: boolean;
  reason?: string;
  deployment: 'local' | 'remote';
};

type GeneratedArtifact = {
  fileName: string;
  content: string;
  kind: string;
};

export function createAiAnalyzeRouteContext(params: {
  ai: GoogleGenAI | null;
  getRequiredSession: (req: express.Request) => LogicProSession;
  sessionManager: SessionManager;
  beginTrackedJob: (session: LogicProSession, jobId: string) => BeginTrackedJobResult;
  deleteTrackedJob: (jobId: string) => void;
  prepareAiAnalyzeRequest: (params: Record<string, unknown>) => Promise<PreparedAiAnalyzeRequest>;
  runAiAnalyzeJob: (params: Record<string, unknown>) => Promise<any>;
  runModelAnalysis: (params: {
    ai: GoogleGenAI | null;
    provider: string;
    model: string;
    prompt: string;
    signal?: AbortSignal;
  }) => Promise<any>;
  getProviderDeployment: (provider: string) => 'local' | 'remote';
  requiresRemoteExportConsent: (provider: string) => boolean;
  assertApprovedProjectPath: (session: LogicProSession, candidatePath: string, label?: string) => Promise<string>;
  analyzeWaveformHazards: (...args: any[]) => any;
  analyzeProtocolFrames: (...args: any[]) => any;
  getAiMacroSpec: (macroId: AiMacroId) => { label: string };
  getOrBuildMacroSignalIndex: (params: {
    projectPath: string;
    rootEntity: string;
    sourcePaths?: string[];
  }) => Promise<unknown>;
  selectMacroSignals: (...args: any[]) => any;
  getSignalName: (...args: any[]) => any;
  formatSignalValue: (...args: any[]) => any;
  buildSignalTransitionSummary: (...args: any[]) => any;
  buildProjectContextFromPath: (...args: any[]) => any;
  scrubProjectContextForRemoteExport: (...args: any[]) => any;
  buildMacroPromptContract: (...args: any[]) => any;
  estimatePreprocessingTokenCount: (...args: any[]) => any;
  buildPreparedRemoteExportPreview: (params: {
    preparedRequest: PreparedAiAnalyzeRequest;
    macroId: AiMacroId;
    tbGenerationMode: TbGenerationMode | null;
    userQuery: string;
    applyMandatoryVhdlSkill: (taskPrompt: string) => Promise<any>;
  }) => Promise<{
    preview: unknown;
    previewHash: string;
    preparedPrompt: unknown;
  }>;
  applyMandatoryVhdlSkill: (taskPrompt: string) => Promise<any>;
  getProviderDescriptors: () => ProviderDescriptor[];
  validateMacroOutput: (...args: any[]) => any;
  buildArtifactRetryPrompt: (...args: any[]) => string;
  buildValidationRetryPrompt: (...args: any[]) => string;
  extractGeneratedVhdlArtifacts: (text: string, macroId: AiMacroId) => GeneratedArtifact[];
  saveGeneratedVhdlArtifacts: (...args: any[]) => Promise<any>;
  formatValidationFailureDetails: (...args: any[]) => string;
  isAbortError: (error: unknown) => boolean;
  staticProviderModels: Record<string, Array<{ id: string }>>;
}) {
  const {
    ai,
    getRequiredSession,
    sessionManager,
    beginTrackedJob,
    deleteTrackedJob,
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
    estimatePreprocessingTokenCount,
    buildPreparedRemoteExportPreview,
    applyMandatoryVhdlSkill,
    getProviderDescriptors,
    validateMacroOutput,
    buildArtifactRetryPrompt,
    buildValidationRetryPrompt,
    extractGeneratedVhdlArtifacts,
    saveGeneratedVhdlArtifacts,
    formatValidationFailureDetails,
    isAbortError,
    staticProviderModels,
  } = params;

  const remoteExportPreviewHandler: express.RequestHandler = async (req, res) => {
    const { provider, signals, query, model, timeUnit, tickDuration, projectContext, projectPath, workspaceFileName } = req.body;
    const simulationMacroContext = req.body?.simulationMacroContext;
    const macroId: AiMacroId = typeof req.body?.macroId === 'string' && req.body.macroId.trim()
      ? req.body.macroId.trim() as AiMacroId
      : 'custom_query';
    const tbGenerationMode: TbGenerationMode | null = req.body?.tbGenerationMode === 'reverse_from_vcd'
      ? 'reverse_from_vcd'
      : req.body?.tbGenerationMode === 'project_entities'
        ? 'project_entities'
        : null;

    try {
      if (!requiresRemoteExportConsent(provider)) {
        return res.status(400).json({ error: 'Remote export preview is only required for remote providers.' });
      }
      if (typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'User query is required.' });
      }

      const session = getRequiredSession(req);
      const preparedRequest = await prepareAiAnalyzeRequest({
        provider,
        signals,
        query,
        model,
        timeUnit,
        tickDuration,
        projectContext,
        projectPath,
        workspaceFileName,
        simulationMacroContext,
        macroId,
        session,
        sessionManager,
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
        estimatePreprocessingTokenCount,
        skipRemoteExportConsentCheck: true,
      });

      const selectedProvider = preparedRequest.selectedProvider;
      const selectedModel = preparedRequest.selectedModel
        || staticProviderModels[selectedProvider]?.[0]?.id
        || '';

      const { preview, previewHash } = await buildPreparedRemoteExportPreview({
        preparedRequest,
        macroId,
        tbGenerationMode,
        userQuery: query,
        applyMandatoryVhdlSkill,
      });

      res.json({
        provider: selectedProvider,
        model: selectedModel,
        preview,
        previewHash,
      });
    } catch (error: any) {
      res.status(error?.statusCode || 500).json({ error: error.message || error });
    }
  };

  const remoteExportApproveHandler: express.RequestHandler = async (req, res) => {
    const provider = typeof req.body?.provider === 'string' ? req.body.provider.trim() : '';
    const previewHash = typeof req.body?.previewHash === 'string' ? req.body.previewHash.trim() : '';
    if (!provider || !previewHash) {
      return res.status(400).json({ error: 'Provider and preview hash are required.' });
    }

    try {
      const session = getRequiredSession(req);
      const registered = sessionManager.registerRemoteExportApproval(session, provider, previewHash);
      if (!registered) {
        return res.status(400).json({ error: 'Unable to register remote export approval for this session.' });
      }
      res.json({ ok: true, provider, previewHash });
    } catch (error: any) {
      res.status(error?.statusCode || 500).json({ error: error.message || error });
    }
  };

  const analyzeHandler: express.RequestHandler = async (req, res) => {
    const { provider, signals, query, model, timeUnit, tickDuration, projectContext, projectPath, workspaceFileName } = req.body;
    const simulationMacroContext = req.body?.simulationMacroContext;
    const remoteExportPreviewHash = typeof req.body?.remoteExportPreviewHash === 'string'
      ? req.body.remoteExportPreviewHash.trim()
      : '';
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

    const session = getRequiredSession(req);
    const { controller, abortTrackedJob } = beginTrackedJob(session, jobId);

    req.on('aborted', () => {
      abortTrackedJob('Request was cancelled by the client connection.');
    });
    res.on('close', () => {
      if (!res.writableEnded) {
        abortTrackedJob('Request was cancelled by the client connection.');
      }
    });

    try {
      const preparedRequest = await prepareAiAnalyzeRequest({
        provider,
        signals,
        query,
        model,
        timeUnit,
        tickDuration,
        projectContext,
        projectPath,
        workspaceFileName,
        simulationMacroContext,
        macroId,
        session,
        sessionManager,
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
        estimatePreprocessingTokenCount,
      });
      const {
        selectedProvider: preparedSelectedProvider,
        selectedModel: preparedSelectedModel,
        hazardScan,
        protocolScan,
        normalizedProjectPath,
        macroSpec,
        artifactDirectory,
        macroDiagnostics,
        systemPrompt,
        preprocessingInputTokens,
      } = preparedRequest;
      const selectedProvider = preparedSelectedProvider;
      const selectedModel = preparedSelectedModel
        || staticProviderModels[selectedProvider]?.[0]?.id
        || staticProviderModels.ollama?.[0]?.id
        || 'qwen2.5-coder:latest';
      let preparedRemotePrompt = null;
      if (preparedRequest.providerDeployment === 'remote') {
        const previewResult = await buildPreparedRemoteExportPreview({
          preparedRequest,
          macroId,
          tbGenerationMode,
          userQuery: query,
          applyMandatoryVhdlSkill,
        });
        if (!remoteExportPreviewHash) {
          return res.status(403).json({
            error: 'Remote export preview approval is required before sending data to a remote provider.',
          });
        }
        if (remoteExportPreviewHash !== previewResult.previewHash) {
          return res.status(403).json({
            error: 'Remote export preview is stale. Refresh the preview and approve the exact payload before retrying.',
          });
        }
        const approved = sessionManager.consumeRemoteExportApproval(session, selectedProvider, remoteExportPreviewHash);
        if (!approved) {
          return res.status(403).json({
            error: 'Remote export approval was missing or expired. Review the preview and approve this export again.',
          });
        }
        preparedRemotePrompt = previewResult.preparedPrompt;
      }
      const analysisResult = await runAiAnalyzeJob({
        ai,
        selectedProvider,
        selectedModel,
        macroId,
        tbGenerationMode,
        systemPrompt,
        preprocessingInputTokens,
        normalizedProjectPath,
        artifactDirectory,
        macroSpec,
        hazardFindings: hazardScan.findings,
        protocolFrames: protocolScan.frames,
        session,
        sessionManager,
        signal: controller.signal,
        getProviderDescriptors,
        buildMacroPromptContract,
        userQuery: query,
        preparedPrompt: preparedRemotePrompt,
        applyMandatoryVhdlSkill,
        runModelAnalysis,
        validateMacroOutput,
        buildArtifactRetryPrompt,
        buildValidationRetryPrompt,
        extractGeneratedVhdlArtifacts,
        saveGeneratedVhdlArtifacts,
        formatValidationFailureDetails,
      });

      return res.json({
        analysis: analysisResult.analysis,
        provider: analysisResult.provider,
        model: analysisResult.model,
        telemetry: analysisResult.telemetry,
        hazardScan,
        protocolScan,
        diagnostics: macroDiagnostics,
        macroId,
        tbGenerationMode,
        retryUsed: analysisResult.retryUsed,
        outputDirectory: analysisResult.outputDirectory,
        generatedFiles: analysisResult.generatedFiles,
        validation: analysisResult.validation,
        deterministicSkillSelection: analysisResult.deterministicSkillSelection,
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
      deleteTrackedJob(jobId);
    }
  };

  return {
    remoteExportPreviewHandler,
    remoteExportApproveHandler,
    analyzeHandler,
  };
}
