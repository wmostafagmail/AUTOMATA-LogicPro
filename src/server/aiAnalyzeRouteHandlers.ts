import { randomUUID } from 'crypto';
import type express from 'express';
import type { GoogleGenAI } from '@google/genai';
import type { AiMacroId, TbGenerationMode } from '../aiMacros';
import type { LogicProSession, createSessionManager } from './sessionManager';
import type { PreparedAiAnalyzeRequest } from './aiAnalyzePreparation';
import type { FpgaArchitectProject } from './fpgaArchitect';
import { runFpgaArchitectStressLoop } from './fpgaArchitectStressLoop';
import { FPGA_ARCHITECT_SWEEP_TOTAL_ATTEMPTS } from '../fpgaArchitectSweepConfig';
import {
  buildVhdlOrchestratorTaskPrompt,
  normalizePreparedPrompt,
  parseMacroExecutionParams,
} from './aiPromptUtils';

type SessionManager = ReturnType<typeof createSessionManager>;

type BeginTrackedJobResult = {
  controller: AbortController;
  abortTrackedJob: (reason: string) => void;
  updateTrackedJobProgress: (progress: {
    currentLoop?: number;
    totalLoops?: number;
    completedAttempts?: number;
    failures?: number;
    successes?: number;
    currentDesignKey?: string;
    currentDesignLabel?: string;
    currentDesignIndex?: number;
    totalDesigns?: number;
    currentDesignAttempt?: number;
    attemptsPerDesign?: number;
  }) => void;
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

type SavedArchitectProjectResponse = {
  outputDirectory: string;
  files: Array<{
    path: string;
    fileType: string;
    purpose: string;
    content: string;
    savedPath?: string;
  }>;
} & FpgaArchitectProject;

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
  parseFpgaArchitectResponse: (...args: any[]) => FpgaArchitectProject;
  buildFpgaArchitectRetryPrompt: (...args: any[]) => string;
  buildFpgaArchitectJsonRepairPrompt: (...args: any[]) => string;
  buildFpgaArchitectCompactRetryPrompt: (...args: any[]) => string;
  buildFpgaArchitectTestRunPrompt: (...args: any[]) => string;
  saveFpgaArchitectProject: (...args: any[]) => Promise<any>;
  buildFpgaArchitectMarkdownReport: (...args: any[]) => string;
  validateGeneratedVhdlWithGhdl: (...args: any[]) => Promise<any>;
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
    staticProviderModels,
  } = params;

  const remoteExportPreviewHandler: express.RequestHandler = async (req, res) => {
    const { provider, signals, query, model, timeUnit, tickDuration, projectContext, projectPath, workspaceFileName } = req.body;
    const simulationMacroContext = req.body?.simulationMacroContext;
    const { macroId, tbGenerationMode } = parseMacroExecutionParams(req.body);

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
    const { macroId, tbGenerationMode } = parseMacroExecutionParams(req.body);

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
        parseFpgaArchitectResponse,
        buildFpgaArchitectRetryPrompt,
        buildFpgaArchitectJsonRepairPrompt,
        buildFpgaArchitectCompactRetryPrompt,
        buildFpgaArchitectTestRunPrompt,
        saveFpgaArchitectProject,
        buildFpgaArchitectMarkdownReport,
        validateGeneratedVhdlWithGhdl,
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
        customQueryMode: preparedRequest.customQueryMode || null,
        tbGenerationMode,
        retryUsed: analysisResult.retryUsed,
        outputDirectory: analysisResult.outputDirectory,
        generatedFiles: analysisResult.generatedFiles,
        architectProject: analysisResult.architectProject || null,
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

  const fpgaArchitectStressLoopHandler: express.RequestHandler = async (req, res) => {
    const provider = typeof req.body?.provider === 'string' ? req.body.provider.trim() : '';
    const model = typeof req.body?.model === 'string' ? req.body.model.trim() : '';
    const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
    const projectPath = typeof req.body?.projectPath === 'string' ? req.body.projectPath.trim() : '';
    const workspaceFileName = typeof req.body?.workspaceFileName === 'string' ? req.body.workspaceFileName.trim() : '';
    const jobId = typeof req.body?.jobId === 'string' && req.body.jobId.trim() ? req.body.jobId.trim() : randomUUID();

    if (!provider) {
      return res.status(400).json({ error: 'Provider is required.' });
    }
    if (!model) {
      return res.status(400).json({ error: 'Model is required.' });
    }
    if (!query) {
      return res.status(400).json({ error: 'FPGA Architect prompt is required.' });
    }
    if (!projectPath) {
      return res.status(400).json({ error: 'Open a project folder before running the FPGA Architect multi-design sweep.' });
    }

    const session = getRequiredSession(req);
    const { controller, abortTrackedJob, updateTrackedJobProgress } = beginTrackedJob(session, jobId);

    req.on('aborted', () => {
      abortTrackedJob('Request was cancelled by the client connection.');
    });
    res.on('close', () => {
      if (!res.writableEnded) {
        abortTrackedJob('Request was cancelled by the client connection.');
      }
    });

    try {
      const loopResult = await runFpgaArchitectStressLoop({
        ai,
        selectedProvider: provider,
        selectedModel: model,
        userQuery: query,
        projectPath,
        workspaceFileName: workspaceFileName || null,
        session,
        sessionManager,
        signal: controller.signal,
        prepareAiAnalyzeRequest,
        runAiAnalyzeJob,
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
        getProviderDescriptors,
        buildMacroPromptContract,
        applyMandatoryVhdlSkill,
        runModelAnalysis,
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
        onProgress: ({ currentLoop, totalLoops, completedAttempts, failures, successes, currentDesignKey, currentDesignLabel, currentDesignIndex, totalDesigns, currentDesignAttempt, attemptsPerDesign }) => {
          updateTrackedJobProgress({
            currentLoop,
            totalLoops,
            completedAttempts,
            failures,
            successes,
            currentDesignKey,
            currentDesignLabel,
            currentDesignIndex,
            totalDesigns,
            currentDesignAttempt,
            attemptsPerDesign,
          });
        },
      });

      return res.json({
        ok: true,
        jobId,
        ...loopResult,
      });
    } catch (error: any) {
      if (isAbortError(error)) {
        return res.status(499).json({
          error: 'FPGA Architect multi-design sweep was cancelled before completion.',
          expectedAttempts: FPGA_ARCHITECT_SWEEP_TOTAL_ATTEMPTS,
          jobId,
          cancelled: true,
        });
      }
      return res.status(error?.statusCode || 500).json({
        ok: false,
        jobId,
        error: error?.message || String(error),
      });
    } finally {
      deleteTrackedJob(jobId);
    }
  };

  const codeChatHandler: express.RequestHandler = async (req, res) => {
    const provider = typeof req.body?.provider === 'string' ? req.body.provider.trim() : '';
    const model = typeof req.body?.model === 'string' ? req.body.model.trim() : '';
    const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
    const filePath = typeof req.body?.filePath === 'string' ? req.body.filePath.trim() : '';
    const fileContent = typeof req.body?.fileContent === 'string' ? req.body.fileContent : '';
    const projectPath = typeof req.body?.projectPath === 'string' ? req.body.projectPath.trim() : '';
    const projectSummary = typeof req.body?.projectSummary === 'string' ? req.body.projectSummary.trim() : '';
    const filePaths = Array.isArray(req.body?.filePaths)
      ? req.body.filePaths.filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0).slice(0, 80)
      : [];

    if (!provider || !model || !question) {
      return res.status(400).json({ error: 'Provider, model, and question are required.' });
    }

    if (requiresRemoteExportConsent(provider)) {
      return res.status(403).json({
        error: 'Code chat is currently limited to local providers so source code does not leave the machine without a dedicated preview flow.',
      });
    }

    try {
      const session = getRequiredSession(req);
      let approvedProjectPath = '';
      if (projectPath) {
        approvedProjectPath = await assertApprovedProjectPath(session, projectPath, 'Project folder');
      }

      const taskPrompt = buildVhdlOrchestratorTaskPrompt([
        'You are helping with an editable FPGA/VHDL architect project inside AUTOMATA LogicPro.',
        '',
        `Project folder: ${approvedProjectPath || 'not provided'}`,
        `Project summary: ${projectSummary || 'not provided'}`,
        `Selected file: ${filePath || 'unspecified'}`,
        'Project file list:',
        `${filePaths.map((entry) => `- ${entry}`).join('\n') || '- none provided'}`,
        '',
        'Selected file content:',
        '```',
        fileContent,
        '```',
        '',
        'User question:',
        question,
        '',
        'Answer directly about the code. If you suggest code changes, use fenced `vhdl` blocks when appropriate and keep the response practical.',
      ].join('\n'));

      const preparedPrompt = normalizePreparedPrompt(await applyMandatoryVhdlSkill(taskPrompt));
      const result = await runModelAnalysis({
        ai,
        provider,
        model,
        prompt: preparedPrompt.prompt,
      });

      res.json({
        answer: result.text,
        provider,
        model,
        telemetry: result.telemetry,
        deterministicSkillSelection: preparedPrompt.selection,
      });
    } catch (error: any) {
      res.status(error?.statusCode || 500).json({ error: error.message || error });
    }
  };

  return {
    remoteExportPreviewHandler,
    remoteExportApproveHandler,
    analyzeHandler,
    fpgaArchitectStressLoopHandler,
    codeChatHandler,
  };
}
