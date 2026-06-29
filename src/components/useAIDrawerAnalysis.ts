import { useEffect, useRef, useState } from 'react';
import type { AiReportMeta } from '../aiReport';
import { apiFetch } from '../api';
import type { AiMacroId, TbGenerationMode } from '../aiMacros';
import { getAiMacroSpec } from '../aiMacros';
import { getProviderDeployment, requiresRemoteExportConsent } from '../exportPolicy';
import type { ProjectFileEntry, ProviderOption, Signal, SimulationMacroContextPayload } from '../types';

export interface Message {
  role: 'user' | 'assistant';
  text: string;
  meta?: AiReportMeta;
}

export interface DeterministicSkillSelectionPayload {
  registryPath: string;
  selectedSkills: Array<{
    role: 'primary' | 'supporting' | 'other';
    name: string;
    reason?: string | null;
  }>;
  skillCallPlan: string[];
}

export interface RemoteExportPreviewSectionPayload {
  id: 'query' | 'waveform' | 'protocol_scan' | 'hazard_scan' | 'project_context' | 'export_policy' | 'macro_contract' | 'final_prompt';
  title: string;
  content: string;
  charCount: number;
}

export interface RemoteExportPreviewPayload {
  schemaVersion: 1;
  provider: string;
  model: string;
  deployment: 'remote';
  macroId: string;
  totalChars: number;
  sections: RemoteExportPreviewSectionPayload[];
  notes: string[];
}

export interface PendingRemoteExportPreview {
  preview: RemoteExportPreviewPayload;
  previewHash: string;
  requestBody: Record<string, unknown>;
  providerLabel: string;
  queryText: string;
  macroId: AiMacroId;
  tbGenerationMode: TbGenerationMode | null;
}

interface JobTelemetry {
  engineLabel: string;
  inputTokens: number | null;
  latestAttemptInputTokens: number | null;
  jobInputTokens: number | null;
  sessionInputTokens: number | null;
  outputTokens: number | null;
  jobOutputTokens: number | null;
  sessionOutputTokens: number | null;
  tokensPerSecond: number | null;
  durationMs: number | null;
}

export function useAIDrawerAnalysis(params: {
  providers: ProviderOption[];
  selectedProvider: string;
  selectedModel: string;
  remoteExportConsents: Record<string, boolean>;
  signals: Signal[];
  timeUnit: 'ns' | 'us' | 'ms' | 's';
  tickDuration: number;
  projectPath: string | null;
  workspaceFileName: string | null;
  simulationMacroContext: SimulationMacroContextPayload | null;
  buildProjectContext: (queryText: string) => Promise<unknown>;
}) {
  const {
    providers,
    selectedProvider,
    selectedModel,
    remoteExportConsents,
    signals,
    timeUnit,
    tickDuration,
    projectPath,
    workspaceFileName,
    simulationMacroContext,
    buildProjectContext,
  } = params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [pendingRemoteExportPreview, setPendingRemoteExportPreview] = useState<PendingRemoteExportPreview | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobStartedAt, setJobStartedAt] = useState<number | null>(null);
  const [jobElapsedSeconds, setJobElapsedSeconds] = useState(0);
  const [jobTelemetry, setJobTelemetry] = useState<JobTelemetry | null>(null);
  const [sessionTokenTotals, setSessionTokenTotals] = useState<{ inputTokens: number; outputTokens: number }>({
    inputTokens: 0,
    outputTokens: 0,
  });
  const sessionTokenTotalsRef = useRef<{ inputTokens: number; outputTokens: number }>({
    inputTokens: 0,
    outputTokens: 0,
  });
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeMacroId, setActiveMacroId] = useState<AiMacroId | null>(null);
  const [testGenerating, setTestGenerating] = useState(false);
  const [testGenerateResult, setTestGenerateResult] = useState<string | null>(null);
  const activeRequestControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!loading || !jobStartedAt) {
      setJobElapsedSeconds(0);
      return;
    }

    const updateElapsed = () => {
      setJobElapsedSeconds(Math.max(0, Math.floor((Date.now() - jobStartedAt) / 1000)));
    };

    updateElapsed();
    const timer = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timer);
  }, [jobStartedAt, loading]);

  const buildAiAnalyzeRequestBody = async (
    queryText: string,
    macroId: AiMacroId,
    tbMode: TbGenerationMode | null
  ) => {
    const selectedProviderRequiresRemoteConsent = requiresRemoteExportConsent(selectedProvider);
    const normalizedProviderId = String(selectedProvider || '').trim().toLowerCase();
    const hasRemoteExportConsent = selectedProviderRequiresRemoteConsent
      ? Boolean(remoteExportConsents[normalizedProviderId])
      : true;
    const projectContext = await buildProjectContext(queryText);
    const selectedProviderLabel = providers.find((provider) => provider.id === selectedProvider)?.label || selectedProvider;

    return {
      selectedProviderRequiresRemoteConsent,
      hasRemoteExportConsent,
      selectedProviderLabel,
      body: {
        macroId,
        tbGenerationMode: tbMode,
        provider: selectedProvider,
        signals,
        query: queryText,
        model: selectedModel,
        timeUnit,
        tickDuration,
        projectContext,
        projectPath,
        workspaceFileName,
        simulationMacroContext,
      },
    };
  };

  const resetFailedJobTelemetry = () => {
    setJobTelemetry((previous) => previous ? {
      ...previous,
      latestAttemptInputTokens: null,
      jobInputTokens: null,
      outputTokens: null,
      jobOutputTokens: null,
      tokensPerSecond: null,
      durationMs: null,
    } : null);
  };

  const executeAiAnalyzeRequest = async (params: {
    queryText: string;
    macroId: AiMacroId;
    tbMode: TbGenerationMode | null;
    requestBody: Record<string, unknown>;
    selectedProviderLabel: string;
    remoteExportPreviewHash?: string | null;
  }) => {
    const {
      queryText,
      macroId,
      tbMode,
      requestBody,
      selectedProviderLabel,
      remoteExportPreviewHash,
    } = params;

    const userMsg: Message = {
      role: 'user',
      text: queryText,
      meta: {
        macroId,
        tbGenerationMode: tbMode,
      },
    };
    setMessages([userMsg]);
    setCopiedIndex(null);
    setLoading(true);
    setJobStartedAt(Date.now());
    setJobStatus('Preparing AI request...');
    const controller = new AbortController();
    const jobId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `ai-job-${Date.now()}`;
    activeRequestControllerRef.current = controller;
    setActiveJobId(jobId);
    setActiveMacroId(macroId);
    setPendingRemoteExportPreview(null);

    try {
      setJobTelemetry({
        engineLabel: selectedProviderLabel,
        inputTokens: null,
        latestAttemptInputTokens: null,
        jobInputTokens: null,
        sessionInputTokens: sessionTokenTotalsRef.current.inputTokens,
        outputTokens: null,
        jobOutputTokens: null,
        sessionOutputTokens: sessionTokenTotalsRef.current.outputTokens,
        tokensPerSecond: null,
        durationMs: null,
      });
      setJobStatus('AI Engine is analyzing...');
      const response = await apiFetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          jobId,
          ...requestBody,
          remoteExportPreviewHash: remoteExportPreviewHash || undefined,
        }),
      });

      const data = await response.json();
      setJobStatus('Receiving AI response...');
      if (!response.ok) {
        throw new Error(data.error || 'Server error running simulation analysis');
      }

      const deterministicSkillSelection = (
        data.deterministicSkillSelection && typeof data.deterministicSkillSelection === 'object'
          ? data.deterministicSkillSelection as DeterministicSkillSelectionPayload
          : null
      );

      const assistantMsg: Message = {
        role: 'assistant',
        text: data.analysis || 'Analysis finished with no return block.',
        meta: {
          macroId: data.macroId || macroId,
          tbGenerationMode: data.tbGenerationMode || tbMode,
          provider: data.provider,
          model: data.model,
          telemetry: data.telemetry || null,
          retryUsed: Boolean(data.retryUsed),
          outputDirectory: data.outputDirectory || null,
          generatedFiles: Array.isArray(data.generatedFiles) ? data.generatedFiles : [],
          validation: data.validation || null,
          hazardMarkdown: data.hazardScan?.markdown || null,
          hazardFindings: Array.isArray(data.hazardScan?.findings) ? data.hazardScan.findings : [],
          protocolMarkdown: data.protocolScan?.markdown || null,
          protocolFrames: Array.isArray(data.protocolScan?.frames) ? data.protocolScan.frames : [],
          diagnostics: data.diagnostics || null,
          deterministicSkillSelection,
        },
      };
      setMessages((prev) => [...prev, assistantMsg]);
      const responseTelemetry = data.telemetry || null;
      if (responseTelemetry) {
        const completedJobInputTokens = Math.max(
          0,
          Number(
            responseTelemetry.jobInputTokens
            ?? responseTelemetry.latestAttemptInputTokens
            ?? responseTelemetry.inputTokens
            ?? 0
          )
        );
        const completedJobOutputTokens = Math.max(
          0,
          Number(
            responseTelemetry.jobOutputTokens
            ?? responseTelemetry.outputTokens
            ?? 0
          )
        );
        const derivedSessionInputTokens = sessionTokenTotalsRef.current.inputTokens + completedJobInputTokens;
        const derivedSessionOutputTokens = sessionTokenTotalsRef.current.outputTokens + completedJobOutputTokens;
        const reportedSessionInputTokens = Number.isFinite(responseTelemetry.sessionInputTokens)
          ? Number(responseTelemetry.sessionInputTokens)
          : 0;
        const reportedSessionOutputTokens = Number.isFinite(responseTelemetry.sessionOutputTokens)
          ? Number(responseTelemetry.sessionOutputTokens)
          : 0;
        const nextSessionTotals = {
          inputTokens: Math.max(0, reportedSessionInputTokens, derivedSessionInputTokens),
          outputTokens: Math.max(0, reportedSessionOutputTokens, derivedSessionOutputTokens),
        };
        sessionTokenTotalsRef.current = nextSessionTotals;
        setSessionTokenTotals(nextSessionTotals);
        setJobTelemetry({
          ...responseTelemetry,
          jobInputTokens: completedJobInputTokens,
          jobOutputTokens: completedJobOutputTokens,
          sessionInputTokens: nextSessionTotals.inputTokens,
          sessionOutputTokens: nextSessionTotals.outputTokens,
        });
      } else {
        setJobTelemetry(null);
      }
      setJobStatus('AI analysis finished.');
    } catch (err: any) {
      if (err?.name === 'AbortError' || String(err?.message || err).toLowerCase().includes('aborted')) {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          text: '### AI Job Cancelled\n\nThe active AI request was stopped before completion. All tracked backend provider calls for this job were asked to abort.',
          meta: {
            macroId,
            tbGenerationMode: tbMode,
            validation: null,
          },
        }]);
        resetFailedJobTelemetry();
        setJobStatus('AI job cancelled.');
        return;
      }
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: `### Simulation Error\n\nCould not compile timing diagram telemetry: ${err.message || err}`,
        meta: {
          macroId,
          tbGenerationMode: tbMode,
          validation: null,
        },
      }]);
      resetFailedJobTelemetry();
      setJobStatus(`AI job failed: ${err.message || err}`);
    } finally {
      activeRequestControllerRef.current = null;
      setActiveJobId(null);
      setLoading(false);
      setJobStartedAt(null);
    }
  };

  const handleMacroSendMessage = async (
    queryText: string,
    options?: {
      macroId?: AiMacroId;
      tbGenerationMode?: TbGenerationMode | null;
    }
  ) => {
    if (!queryText.trim() || loading) return;

    const macroId = options?.macroId || 'custom_query';
    const tbMode = options?.tbGenerationMode ?? null;

    try {
      const {
        selectedProviderRequiresRemoteConsent,
        hasRemoteExportConsent,
        selectedProviderLabel,
        body,
      } = await buildAiAnalyzeRequestBody(queryText, macroId, tbMode);

      if (selectedProviderRequiresRemoteConsent && !hasRemoteExportConsent) {
        setProviderError('Enable remote export consent, review the exact export preview, then approve the request before sending data to this remote provider.');
        return;
      }

      if (selectedProviderRequiresRemoteConsent) {
        setJobStatus('Preparing remote export preview...');
        const response = await apiFetch('/api/ai/remote-export-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to build remote export preview');
        }
        const preview = data.preview as RemoteExportPreviewPayload;
        const previewHash = typeof data.previewHash === 'string' ? data.previewHash : '';
        if (!preview || !previewHash) {
          throw new Error('Remote export preview response was incomplete.');
        }
        setPendingRemoteExportPreview({
          preview,
          previewHash,
          requestBody: body,
          providerLabel: selectedProviderLabel,
          queryText,
          macroId,
          tbGenerationMode: tbMode,
        });
        setProviderError(null);
        setJobStatus('Remote export preview ready. Review the exact payload and approve to send.');
        return;
      }

      await executeAiAnalyzeRequest({
        queryText,
        macroId,
        tbMode,
        requestBody: body,
        selectedProviderLabel,
      });
    } catch (error: any) {
      setProviderError(error.message || String(error));
      setJobStatus(error.message || String(error));
    }
  };

  const handleSendMessage = async (queryText: string) => handleMacroSendMessage(queryText, {
    macroId: 'custom_query',
    tbGenerationMode: null,
  });

  const handleApproveRemoteExportPreview = async () => {
    if (!pendingRemoteExportPreview || loading) {
      return;
    }

    try {
      setJobStatus('Approving remote export preview...');
      const approveResponse = await apiFetch('/api/ai/remote-export-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          previewHash: pendingRemoteExportPreview.previewHash,
        }),
      });
      const approveData = await approveResponse.json();
      if (!approveResponse.ok) {
        throw new Error(approveData.error || 'Failed to approve remote export preview');
      }

      await executeAiAnalyzeRequest({
        queryText: pendingRemoteExportPreview.queryText,
        macroId: pendingRemoteExportPreview.macroId,
        tbMode: pendingRemoteExportPreview.tbGenerationMode,
        requestBody: pendingRemoteExportPreview.requestBody,
        selectedProviderLabel: pendingRemoteExportPreview.providerLabel,
        remoteExportPreviewHash: pendingRemoteExportPreview.previewHash,
      });
    } catch (error: any) {
      setProviderError(error.message || String(error));
      setJobStatus(error.message || String(error));
    }
  };

  const handleCancelRemoteExportPreview = () => {
    setPendingRemoteExportPreview(null);
    setJobStatus('Remote export preview dismissed.');
  };

  const handleStopJob = async () => {
    if (!loading) return;

    setJobStatus('Stopping AI job...');
    activeRequestControllerRef.current?.abort();

    if (activeJobId) {
      try {
        await apiFetch(`/api/ai-jobs/${activeJobId}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch {
        // Local abort already stops the UI flow.
      }
    }
  };

  const handleTestGenerate = async () => {
    if (!selectedProvider || !selectedModel || testGenerating || loading) {
      return;
    }

    setTestGenerating(true);
    setTestGenerateResult(null);
    try {
      const response = await apiFetch('/api/ai/test-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          model: selectedModel,
        }),
      });
      const rawText = await response.text();
      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        const compact = rawText.trim().replace(/\s+/g, ' ').slice(0, 160);
        throw new Error(compact ? `Non-JSON response: ${compact}` : 'Empty response from test generate endpoint');
      }
      if (!response.ok) {
        throw new Error(data?.error || `Test generate failed (${response.status})`);
      }

      setTestGenerateResult(data.passedExactMatch ? 'OK' : 'Failed');
    } catch {
      setTestGenerateResult('Failed');
    } finally {
      setTestGenerating(false);
    }
  };

  const handleCopyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const selectedProviderInfo = providers.find((provider) => provider.id === selectedProvider);
  const selectedProviderLabel = selectedProviderInfo?.label || selectedProvider || 'AI Provider';
  const selectedProviderRequiresRemoteConsent = requiresRemoteExportConsent(selectedProvider);
  const normalizedSelectedProviderId = String(selectedProvider || '').trim().toLowerCase();
  const hasRemoteExportConsent = selectedProviderRequiresRemoteConsent
    ? Boolean(remoteExportConsents[normalizedSelectedProviderId])
    : true;
  const selectedProviderDeployment = selectedProviderInfo?.deployment || getProviderDeployment(selectedProvider);
  const statusPanelTelemetry = jobTelemetry || {
    engineLabel: selectedProviderLabel,
    inputTokens: null,
    latestAttemptInputTokens: null,
    jobInputTokens: null,
    sessionInputTokens: sessionTokenTotalsRef.current.inputTokens,
    outputTokens: null,
    jobOutputTokens: null,
    sessionOutputTokens: sessionTokenTotalsRef.current.outputTokens,
    tokensPerSecond: null,
    durationMs: null,
  };
  const hasFinishedJobCard = Boolean(jobStatus);
  const jobCompletedSuccessfully = jobStatus === 'AI analysis finished.';
  const jobWasCancelled = jobStatus === 'AI job cancelled.';
  const jobFailed = Boolean(jobStatus?.startsWith('AI job failed'));
  const statusPanelText = jobStatus || 'AI Engine ready.';
  const statusPanelTone = loading
    ? 'border-brand-amber/20 bg-brand-surface-lowest text-slate-300'
    : jobFailed
      ? 'border-rose-500/30 bg-rose-950/30 text-rose-100'
      : 'border-brand-secondary/20 bg-brand-surface-lowest text-slate-300';
  const activeMacroLabel = getAiMacroSpec(activeMacroId || 'custom_query').label;
  const jobCardTitle = activeMacroLabel;
  const jobCardTitleTone = loading
    ? 'text-red-200'
    : jobFailed
      ? 'text-rose-200'
      : jobWasCancelled
        ? 'text-amber-200'
        : 'text-emerald-200';
  const jobCardSurface = loading
    ? 'border-red-400/35 bg-[#09111f]/95'
    : jobFailed
      ? 'border-rose-500/35 bg-rose-950/30'
      : jobWasCancelled
        ? 'border-amber-400/35 bg-amber-950/20'
        : 'border-emerald-400/30 bg-[#09111f]/95';
  const sessionInputDisplayValue = loading && (statusPanelTelemetry.sessionInputTokens ?? 0) <= 0
    ? null
    : statusPanelTelemetry.sessionInputTokens;
  const sessionOutputDisplayValue = loading && (statusPanelTelemetry.sessionOutputTokens ?? 0) <= 0
    ? null
    : statusPanelTelemetry.sessionOutputTokens;
  const jobCardBadge = loading
    ? 'Running'
    : jobFailed
      ? 'Failed'
      : jobWasCancelled
        ? 'Cancelled'
        : 'Finished';
  const jobCardBadgeTone = loading
    ? 'border-red-400/45 bg-red-500/15 text-red-100'
    : jobFailed
      ? 'border-rose-400/45 bg-rose-500/15 text-rose-100'
      : jobWasCancelled
        ? 'border-amber-400/45 bg-amber-500/15 text-amber-100'
        : 'border-emerald-400/45 bg-emerald-500/15 text-emerald-100';

  return {
    messages,
    setMessages,
    loading,
    copiedIndex,
    providerError,
    pendingRemoteExportPreview,
    jobStatus,
    jobElapsedSeconds,
    jobTelemetry,
    activeMacroId,
    testGenerating,
    testGenerateResult,
    sessionTokenTotals,
    handleSendMessage,
    handleMacroSendMessage,
    handleApproveRemoteExportPreview,
    handleCancelRemoteExportPreview,
    handleStopJob,
    handleTestGenerate,
    handleCopyText,
    selectedProviderInfo,
    selectedProviderLabel,
    selectedProviderRequiresRemoteConsent,
    hasRemoteExportConsent,
    selectedProviderDeployment,
    statusPanelTelemetry,
    hasFinishedJobCard,
    jobCompletedSuccessfully,
    jobWasCancelled,
    jobFailed,
    statusPanelText,
    statusPanelTone,
    jobCardTitle,
    jobCardTitleTone,
    jobCardSurface,
    sessionInputDisplayValue,
    sessionOutputDisplayValue,
    jobCardBadge,
    jobCardBadgeTone,
    setProviderError,
    setPendingRemoteExportPreview,
  };
}
