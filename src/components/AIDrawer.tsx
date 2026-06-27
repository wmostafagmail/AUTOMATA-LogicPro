import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ProjectContextPayload, ProjectFileEntry, ProviderOption, Signal, SimulationMacroContextPayload } from '../types';
import { AiMacroId, TbGenerationMode, getAiMacroSpec, getVisibleAiMacros } from '../aiMacros';
import { resolveMacroInvocation } from '../aiDrawerModel';
import { AIWorkspaceReport, AiReportMeta, buildDisplayReport } from '../aiReport';
import { apiFetch } from '../api';
import { getProviderDeployment, requiresRemoteExportConsent } from '../exportPolicy';
import { 
  Send, 
  X, 
  Cpu, 
  Sparkles, 
  FileCode, 
  Bug, 
  Layers, 
  Loader2,
  Copy,
  Check,
  SlidersHorizontal,
  Bot,
  ChevronRight
} from 'lucide-react';

interface AIDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  signals: Signal[];
  timeUnit: 'ns' | 'us' | 'ms' | 's';
  tickDuration: number;
  projectName: string;
  projectPath: string | null;
  projectFiles: ProjectFileEntry[];
  workspaceFileName: string | null;
  simulationMacroContext: SimulationMacroContextPayload | null;
  onMacrosPanelHeightChange?: (height: number) => void;
  onLatestStructuredReportChange?: (report: AIWorkspaceReport | null) => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  meta?: AiReportMeta;
}

interface ModelOption {
  id: string;
  label: string;
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

const AI_PROVIDER_STORAGE_KEY = 'automata-logicpro-ai-provider';
const AI_MODEL_STORAGE_KEY = 'automata-logicpro-ai-models';
const AI_REMOTE_EXPORT_CONSENT_STORAGE_KEY = 'automata-logicpro-ai-remote-export-consents';

const normalizeProviderOptions = (providers: unknown[]): ProviderOption[] => (
  providers
    .filter((provider): provider is Partial<ProviderOption> & { id: string; label: string } => (
      Boolean(provider)
      && typeof provider === 'object'
      && typeof (provider as ProviderOption).id === 'string'
      && typeof (provider as ProviderOption).label === 'string'
    ))
    .map((provider) => ({
      id: provider.id,
      label: provider.label,
      enabled: provider.enabled !== false,
      reason: provider.reason,
      deployment: provider.deployment === 'remote' ? 'remote' : getProviderDeployment(provider.id),
    }))
);

const estimateTokenCount = (text: string) => {
  const normalized = text.trim();
  if (!normalized) return 0;
  return Math.max(1, Math.round(normalized.length / 4));
};

const renderTelemetryValue = (
  value: number | null,
  options?: {
    suffix?: string;
    loading?: boolean;
  }
) => {
  if (value === null) {
    if (options?.loading) {
      return <span className="text-lime-300">Calculating</span>;
    }
    return '0';
  }
  return `${value}${options?.suffix || ''}`;
};

const getMacroButtonTone = (macroId: AiMacroId) => {
  switch (macroId) {
    case 'generate_vhdl_tb':
      return 'text-cyan-200';
    case 'inspect_race_hazards':
      return 'text-amber-200';
    case 'protocol_decoder_details':
      return 'text-emerald-200';
    case 'verify_clock_reset_sequence':
      return 'text-lime-200';
    case 'explain_fsm_behavior':
      return 'text-violet-200';
    case 'summarize_protocol_timeline':
      return 'text-sky-200';
    case 'generate_vhdl_assertions':
      return 'text-rose-200';
    case 'draft_rtl_skeleton':
      return 'text-fuchsia-200';
    case 'suggest_debug_probes':
      return 'text-orange-200';
    default:
      return 'text-brand-on-surface';
  }
};

export const AIDrawer: React.FC<AIDrawerProps> = ({
  isOpen,
  onClose,
  signals,
  timeUnit,
  tickDuration,
  projectName,
  projectPath,
  projectFiles,
  workspaceFileName,
  simulationMacroContext,
  onMacrosPanelHeightChange,
  onLatestStructuredReportChange,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [selectedProvider, setSelectedProvider] = useState(() => {
    if (typeof window === 'undefined') return 'ollama';
    return window.localStorage.getItem(AI_PROVIDER_STORAGE_KEY) || 'ollama';
  });
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [providerError, setProviderError] = useState<string | null>(null);
  const [remoteExportConsents, setRemoteExportConsents] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const parsed = JSON.parse(window.localStorage.getItem(AI_REMOTE_EXPORT_CONSENT_STORAGE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });
  const [showConsoleHelp, setShowConsoleHelp] = useState(false);
  const [showTbComposer, setShowTbComposer] = useState(false);
  const [tbGenerationMode, setTbGenerationMode] = useState<TbGenerationMode>('project_entities');
  const [tbPromptDraft, setTbPromptDraft] = useState('');
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
  const [testGenerating, setTestGenerating] = useState(false);
  const [testGenerateResult, setTestGenerateResult] = useState<string | null>(null);
  const activeRequestControllerRef = useRef<AbortController | null>(null);
  const drawerScrollRef = useRef<HTMLDivElement | null>(null);
  const lowerControlsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadProviders = async () => {
      try {
        const response = await apiFetch('/api/ai/providers');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load providers');
        }
        const nextProviders = normalizeProviderOptions(Array.isArray(data.providers) ? data.providers : []);
        setProviders(nextProviders);
        const storedProvider = typeof window !== 'undefined'
          ? window.localStorage.getItem(AI_PROVIDER_STORAGE_KEY)
          : null;
        const preferredProvider = nextProviders.find((provider: ProviderOption) => provider.id === storedProvider)
          || nextProviders.find((provider: ProviderOption) => provider.id === selectedProvider)
          || nextProviders.find((provider: ProviderOption) => provider.id === 'ollama')
          || nextProviders.find((provider: ProviderOption) => provider.enabled)
          || nextProviders[0];
        if (preferredProvider) {
          setSelectedProvider(preferredProvider.id);
        }
        setProviderError(null);
      } catch (error: any) {
        setProviderError(error.message || String(error));
      }
    };

    void loadProviders();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedProvider) return;

    const loadModels = async () => {
      try {
        const response = await apiFetch(`/api/ai/providers/${selectedProvider}/models`);
        const data = await response.json();
        if (!response.ok && !Array.isArray(data.models)) {
          throw new Error(data.error || 'Failed to load models');
        }
        const nextModels = Array.isArray(data.models) ? data.models : [];
        setModels(nextModels);
        const storedModels = typeof window !== 'undefined'
          ? JSON.parse(window.localStorage.getItem(AI_MODEL_STORAGE_KEY) || '{}')
          : {};
        const storedModelForProvider = typeof storedModels?.[selectedProvider] === 'string'
          ? storedModels[selectedProvider]
          : '';
        setSelectedModel((current) => {
          if (nextModels.some((model: ModelOption) => model.id === current)) {
            return current;
          }
          if (storedModelForProvider && nextModels.some((model: ModelOption) => model.id === storedModelForProvider)) {
            return storedModelForProvider;
          }
          return nextModels[0]?.id || '';
        });
        setProviderError(data.error || null);
      } catch (error: any) {
        setModels([]);
        setSelectedModel('');
        setProviderError(error.message || String(error));
      }
    };

    void loadModels();
  }, [isOpen, selectedProvider]);

  useEffect(() => {
    if (typeof window === 'undefined' || !selectedProvider) return;
    window.localStorage.setItem(AI_PROVIDER_STORAGE_KEY, selectedProvider);
  }, [selectedProvider]);

  useEffect(() => {
    if (typeof window === 'undefined' || !selectedProvider || !selectedModel) return;
    const storedModels = JSON.parse(window.localStorage.getItem(AI_MODEL_STORAGE_KEY) || '{}');
    storedModels[selectedProvider] = selectedModel;
    window.localStorage.setItem(AI_MODEL_STORAGE_KEY, JSON.stringify(storedModels));
  }, [selectedProvider, selectedModel]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(AI_REMOTE_EXPORT_CONSENT_STORAGE_KEY, JSON.stringify(remoteExportConsents));
  }, [remoteExportConsents]);

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
  }, [loading, jobStartedAt]);

  useEffect(() => {
    if (!isOpen) return;
    const container = drawerScrollRef.current;
    if (!container) return;
    window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, [isOpen, messages, loading, showTbComposer, testGenerateResult]);

  useEffect(() => {
    if (!isOpen || !onMacrosPanelHeightChange) return;
    const element = lowerControlsRef.current;
    if (!element) return;

    const publishHeight = () => {
      const nextHeight = Math.ceil(element.getBoundingClientRect().height);
      if (nextHeight > 0) {
        onMacrosPanelHeightChange(nextHeight);
      }
    };

    publishHeight();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', publishHeight);
      return () => window.removeEventListener('resize', publishHeight);
    }

    const observer = new ResizeObserver(() => publishHeight());
    observer.observe(element);
    return () => observer.disconnect();
  }, [isOpen, loading, onMacrosPanelHeightChange, showTbComposer, testGenerateResult]);

  const vhdlProjectFiles = projectFiles.filter((file) => file.extension === '.vhd' || file.extension === '.vhdl');
  const visibleSignalNames = signals.slice(0, 12).map((signal) => signal.name);

  const buildProjectTbPrompt = () => {
    const fileList = vhdlProjectFiles.slice(0, 20).map((file) => `- ${file.path}`).join('\n');
    const projectLine = projectPath ? `The selected project folder is: ${projectPath}` : `The selected project name is: ${projectName}`;
    return [
      'Generate VHDL testbenches for the VHDL entities found in the selected project folder.',
      projectLine,
      vhdlProjectFiles.length > 0
        ? `These VHDL source files are available in the project:\n${fileList}`
        : 'No VHDL file list is available from the project browser, so infer entities from the provided project context.',
      'Ask me for clarification only if the project context is insufficient.',
      'Prefer idiomatic VHDL-2008.',
      'For each entity, generate a practical matching VHDL testbench with clock/reset generation, representative stimulus, signal checks, and clear comments.',
      'If multiple entities exist, prioritize synthesizable top-level or reusable RTL entities before helper packages.',
      'Return the result in clearly separated Markdown sections with code blocks for each generated VHDL testbench.'
    ].join('\n\n');
  };

  const buildReverseTbPrompt = () => {
    const signalList = visibleSignalNames.length > 0 ? visibleSignalNames.join(', ') : 'No visible signals detected';
    return [
      'Write a complete VHDL module and matching VHDL testbench that reproduces the behavior implied by the loaded VCD waveform.',
      workspaceFileName
        ? `Use the currently loaded waveform file as the reverse-engineering target: ${workspaceFileName}.`
        : 'Use the currently loaded waveform as the reverse-engineering target.',
      `The currently visible signal names are: ${signalList}.`,
      'Reverse engineer the likely entity interface, clocking, resets, state transitions, bus behavior, and protocol timing from the waveform evidence.',
      'Then generate both the VHDL module and a matching VHDL testbench that would produce a waveform consistent with the loaded capture.',
      'Prefer idiomatic VHDL-2008 and explain any assumptions you had to make before the code blocks.',
      'Return the result in Markdown with one section for assumptions, one for the VHDL module, and one for the matching VHDL testbench.'
    ].join('\n\n');
  };

  const getTbPromptForMode = (mode: TbGenerationMode) => (
    mode === 'project_entities' ? buildProjectTbPrompt() : buildReverseTbPrompt()
  );

  const parsedMessages = useMemo(
    () => messages.map((message) => message.role === 'assistant' ? buildDisplayReport(message.text, message.meta) : null),
    [messages]
  );

  const latestStructuredReport = useMemo<AIWorkspaceReport | null>(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message.role !== 'assistant' || !message.meta?.macroId) {
        continue;
      }
      const report = parsedMessages[index];
      if (!report) {
        continue;
      }
      return {
        text: message.text,
        meta: message.meta,
        report,
      };
    }
    return null;
  }, [messages, parsedMessages]);

  useEffect(() => {
    onLatestStructuredReportChange?.(latestStructuredReport);
  }, [latestStructuredReport, onLatestStructuredReportChange]);

  if (!isOpen) return null;

  const buildProjectContext = async (queryText: string): Promise<ProjectContextPayload | null> => {
    if (projectFiles.length === 0) {
      return null;
    }

    const normalizedTerms = queryText
      .toLowerCase()
      .split(/[^a-z0-9_./-]+/i)
      .filter((term) => term.length >= 3);

    const preferredExtensions = new Set([
      '.vcd', '.vsd', '.json', '.vhd', '.vhdl', '.sv', '.v', '.vh',
      '.c', '.cc', '.cpp', '.h', '.hpp', '.py', '.tcl', '.md', '.txt'
    ]);

    const scoredFiles = projectFiles
      .map((file) => {
        let score = 0;
        if (preferredExtensions.has(file.extension)) score += 4;
        if (workspaceFileName && file.name === workspaceFileName) score += 8;
        if (file.extension === '.vcd' || file.extension === '.vsd') score += 5;
        if (file.extension === '.vhd' || file.extension === '.vhdl') score += 4;
        if (file.extension === '.json') score += 2;

        const haystack = `${file.path} ${file.name}`.toLowerCase();
        normalizedTerms.forEach((term) => {
          if (haystack.includes(term)) score += 2;
        });

        return { file, score };
      })
      .sort((left, right) => right.score - left.score || left.file.path.localeCompare(right.file.path));

    const selected = scoredFiles
      .filter((entry) => entry.score > 0)
      .slice(0, 8)
      .map((entry) => entry.file);

    const excerpts: ProjectContextPayload['excerpts'] = [];
    let totalBytes = 0;

    for (const file of selected) {
      if (!file.file) {
        continue;
      }

      if (file.size > 120_000) {
        continue;
      }

      const content = await file.file.text();
      const trimmed = content.slice(0, 12_000);
      totalBytes += trimmed.length;
      if (totalBytes > 48_000) {
        break;
      }

      excerpts.push({
        path: file.path,
        content: trimmed,
      });
    }

    return {
      name: projectName,
      fileCount: projectFiles.length,
      filePaths: projectFiles.slice(0, 80).map((file) => file.path),
      excerpts,
    };
  };

  const handleSendMessage = async (queryText: string) => {
    return handleMacroSendMessage(queryText, {
      macroId: 'custom_query',
      tbGenerationMode: null,
    });
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

    // Append user message
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
    setInputText('');
    setLoading(true);
    setJobStartedAt(Date.now());
    setJobStatus('Preparing AI request...');
    const controller = new AbortController();
    const jobId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `ai-job-${Date.now()}`;
    activeRequestControllerRef.current = controller;
    setActiveJobId(jobId);

    try {
      const selectedProviderRequiresRemoteConsent = requiresRemoteExportConsent(selectedProvider);
      const hasRemoteExportConsent = selectedProviderRequiresRemoteConsent
        ? Boolean(remoteExportConsents[selectedProvider])
        : true;
      const projectContext = hasRemoteExportConsent ? await buildProjectContext(queryText) : null;
      const selectedProviderLabel = providers.find((provider) => provider.id === selectedProvider)?.label || selectedProvider;
      const projectContextText = projectContext
        ? [
            projectContext.name,
            projectContext.filePaths.join('\n'),
            projectContext.excerpts.map((excerpt) => `${excerpt.path}\n${excerpt.content}`).join('\n'),
          ].join('\n')
        : '';
      const signalPreviewText = signals
        .slice(0, 12)
        .map((signal) => `${signal.name}:${Array.isArray(signal.values) ? signal.values.slice(0, 48).join('') : ''}`)
        .join('\n');
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
          macroId,
          tbGenerationMode: tbMode,
          provider: selectedProvider,
          signals,
          query: queryText,
          model: selectedModel,
          timeUnit,
          tickDuration,
          projectContext,
          remoteExportConsent: hasRemoteExportConsent,
          projectPath,
          workspaceFileName,
          simulationMacroContext,
        })
      });

      const data = await response.json();
      setJobStatus('Receiving AI response...');
      if (!response.ok) {
        throw new Error(data.error || 'Server error running simulation analysis');
      }

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
          protocolMarkdown: data.protocolScan?.markdown || null,
          diagnostics: data.diagnostics || null,
        },
      };
      setMessages(prev => [...prev, assistantMsg]);
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
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: '### AI Job Cancelled\n\nThe active AI request was stopped before completion. All tracked backend provider calls for this job were asked to abort.',
          meta: {
            macroId,
            tbGenerationMode: tbMode,
            validation: null,
          },
        }]);
        setJobTelemetry((previous) => previous ? {
          ...previous,
          latestAttemptInputTokens: null,
          jobInputTokens: null,
          outputTokens: null,
          jobOutputTokens: null,
          tokensPerSecond: null,
          durationMs: null,
        } : null);
        setJobStatus('AI job cancelled.');
        return;
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `### Simulation Error\n\nCould not compile timing diagram telemetry: ${err.message || err}`,
        meta: {
          macroId,
          tbGenerationMode: tbMode,
          validation: null,
        },
      }]);
      setJobTelemetry((previous) => previous ? {
        ...previous,
        latestAttemptInputTokens: null,
        jobInputTokens: null,
        outputTokens: null,
        jobOutputTokens: null,
        tokensPerSecond: null,
        durationMs: null,
      } : null);
      setJobStatus(`AI job failed: ${err.message || err}`);
    } finally {
      activeRequestControllerRef.current = null;
      setActiveJobId(null);
      setLoading(false);
      setJobStartedAt(null);
    }
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
        // The local request abort above is still enough to stop the current UI flow.
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
    } catch (error: any) {
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

  const openTbComposer = (mode: TbGenerationMode) => {
    setTbGenerationMode(mode);
    setTbPromptDraft(getTbPromptForMode(mode));
    setShowTbComposer(true);
  };

  const handleSubmitTbPrompt = async () => {
    if (!tbPromptDraft.trim()) return;
    const promptToSend = tbPromptDraft;
    setShowTbComposer(false);
    await handleMacroSendMessage(promptToSend, {
      macroId: 'generate_vhdl_tb',
      tbGenerationMode,
    });
  };

  const selectedProviderInfo = providers.find((provider) => provider.id === selectedProvider);
  const selectedProviderLabel = selectedProviderInfo?.label || selectedProvider || 'AI Provider';
  const selectedProviderRequiresRemoteConsent = requiresRemoteExportConsent(selectedProvider);
  const hasRemoteExportConsent = selectedProviderRequiresRemoteConsent
    ? Boolean(remoteExportConsents[selectedProvider])
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
  const jobCardTitle = loading
    ? 'Active AI Job'
    : jobFailed
      ? 'AI Job Failed'
      : jobWasCancelled
        ? 'Last AI Job'
        : jobCompletedSuccessfully
          ? 'Last AI Job'
          : 'AI Job';
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

  return (
    <div className="w-[360px] md:w-[420px] overflow-x-hidden bg-brand-surface-low border-l border-brand-outline-variant/55 flex flex-col h-full z-20 select-none flex-none font-sans">
      
      {/* Drawer Header */}
      <div className="border-b border-brand-outline-variant/40 px-3 py-2 bg-brand-surface-lowest flex-none select-none space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 text-[12px] uppercase font-bold text-brand-on-surface tracking-wider leading-tight break-words">
              AI Co-Engineer Console
            </span>
            <button
              type="button"
              onClick={() => setShowConsoleHelp((previous) => !previous)}
              className="flex h-4 w-4 flex-none items-center justify-center rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-[12px] font-bold text-brand-cyan cursor-pointer hover:bg-brand-cyan/20"
              title="Explain this panel"
            >
              ?
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-brand-surface-high text-slate-400 hover:text-white transition-all cursor-pointer flex-none"
          >
            <X size={15} />
          </button>
        </div>

        {showConsoleHelp && (
          <div className="rounded border border-brand-cyan/20 bg-brand-cyan/8 px-2.5 py-2 text-[12px] leading-relaxed text-slate-300">
            This is your AI Co-Engineer workspace. Use the macros or a custom prompt to analyze the loaded waveform and project files. The lower-left panel shows the detailed structured AI findings, while this drawer keeps the AI controls plus the summary and key metrics.
          </div>
        )}

        <div className="flex items-center gap-2 rounded bg-brand-surface-high px-2 py-1.5 border border-brand-outline-variant/30 min-w-0">
          <div className="flex items-center gap-1 flex-none">
            <Bot size={11} className="text-brand-cyan" />
            <span className="text-[12px] uppercase font-bold tracking-wide text-slate-400">LLM</span>
          </div>
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-1.5">
            <select
              value={selectedProvider}
              onChange={(event) => setSelectedProvider(event.target.value)}
              className="min-w-0 rounded bg-[#0b1326] px-2 py-1 text-[12px] font-mono text-slate-200 outline-none cursor-pointer"
              title="Choose the AI provider"
            >
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id} className="bg-[#0b1326] text-slate-100">
                  {provider.label}
                </option>
              ))}
            </select>
            <select
              value={selectedModel}
              onChange={(event) => setSelectedModel(event.target.value)}
              className="min-w-0 rounded bg-[#0b1326] px-2 py-1 text-[12px] font-mono text-brand-cyan outline-none cursor-pointer"
              title="Choose the AI model for analysis"
            >
              {models.length === 0 && (
                <option value="" className="bg-[#0b1326] text-slate-100">
                  No models available
                </option>
              )}
              {models.map((model) => (
                <option key={model.id} value={model.id} className="bg-[#0b1326] text-slate-100">
                  {model.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleTestGenerate()}
            disabled={!selectedProvider || !selectedModel || loading || testGenerating}
            className="rounded border border-brand-cyan/30 bg-brand-cyan/10 px-2 py-1 text-[12px] font-bold uppercase tracking-wide text-brand-cyan disabled:opacity-40 cursor-pointer"
          >
            {testGenerating ? 'Testing...' : 'TEST'}
          </button>
          {testGenerateResult && (
            <div className="min-w-0 flex-1 rounded border border-white/5 bg-[#060a12] px-2 py-1 text-[12px] font-mono text-slate-300">
              {testGenerateResult}
            </div>
          )}
        </div>
      </div>

      <div className="flex-none space-y-3 border-b border-brand-outline-variant/30 bg-brand-surface px-3.5 py-3">
        {(selectedProviderInfo || providerError) && (
          <div className="min-w-0 p-2 rounded border border-brand-outline-variant/20 bg-brand-surface-lowest text-[12px] font-mono text-slate-400">
            <div className="break-words">Provider: <span className="text-brand-cyan break-all">{selectedProviderInfo?.label || selectedProvider}</span></div>
            <div className="break-words">Model: <span className="text-brand-cyan break-all">{selectedModel || 'No model available'}</span></div>
            <div className="break-words">Deployment: <span className={selectedProviderDeployment === 'remote' ? 'text-amber-200' : 'text-emerald-200'}>{selectedProviderDeployment}</span></div>
            {selectedProviderInfo?.reason && <div className="break-words">{selectedProviderInfo.reason}</div>}
            {providerError && <div className="break-words text-rose-300">{providerError}</div>}
          </div>
        )}

        {selectedProviderRequiresRemoteConsent && (
          <div className="rounded border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[12px] leading-relaxed text-amber-100">
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={hasRemoteExportConsent}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setRemoteExportConsents((previous) => ({
                    ...previous,
                    [selectedProvider]: checked,
                  }));
                }}
                className="mt-0.5"
              />
              <span>
                Allow export of scrubbed waveform and project context to this remote provider. Sensitive files and token-like values are redacted first, but project-derived data leaves this machine only after you enable this consent.
              </span>
            </label>
          </div>
        )}

        <div className={`rounded border px-2 py-1.5 text-[12px] font-mono ${statusPanelTone}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {loading ? <Loader2 size={12} className="animate-spin text-brand-amber" /> : <Check size={12} className="text-brand-secondary" />}
                <span>{statusPanelText}</span>
              </div>
              {loading && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{jobElapsedSeconds}s</span>
                </div>
              )}
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[12px]">
              <div className="flex min-h-[64px] flex-col rounded border border-white/5 bg-[#060a12] px-2 py-1.5">
                <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">AI Engine</div>
                <div className="mt-auto pt-1.5 text-brand-cyan">{statusPanelTelemetry.engineLabel}</div>
              </div>
              <div className="flex min-h-[64px] flex-col rounded border border-white/5 bg-[#060a12] px-2 py-1.5">
                <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Tokens / Sec</div>
                <div className="mt-auto pt-1.5 text-slate-200">{renderTelemetryValue(statusPanelTelemetry.tokensPerSecond, { loading })}</div>
              </div>
              <div className="flex min-h-[64px] flex-col rounded border border-white/5 bg-[#060a12] px-2 py-1.5">
                <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Job Input Tokens</div>
                <div className="mt-auto pt-1.5 text-slate-200">
                  {renderTelemetryValue(statusPanelTelemetry.jobInputTokens ?? statusPanelTelemetry.latestAttemptInputTokens ?? statusPanelTelemetry.inputTokens, { loading })}
                </div>
              </div>
              <div className="flex min-h-[64px] flex-col rounded border border-white/5 bg-[#060a12] px-2 py-1.5">
                <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Session Input</div>
                <div className="mt-auto pt-1.5 text-slate-200">
                  {renderTelemetryValue(sessionInputDisplayValue, { loading })}
                </div>
              </div>
              <div className="flex min-h-[64px] flex-col rounded border border-white/5 bg-[#060a12] px-2 py-1.5">
                <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Job Output Tokens</div>
                <div className="mt-auto pt-1.5 text-slate-200">{renderTelemetryValue(statusPanelTelemetry.jobOutputTokens ?? statusPanelTelemetry.outputTokens, { loading })}</div>
              </div>
              <div className="flex min-h-[64px] flex-col rounded border border-white/5 bg-[#060a12] px-2 py-1.5">
                <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Session Output</div>
                <div className="mt-auto pt-1.5 text-slate-200">{renderTelemetryValue(sessionOutputDisplayValue, { loading })}</div>
              </div>
            </div>
          </div>
      </div>

      {/* Messages Feed */}
      <div ref={drawerScrollRef} className="relative flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-4 bg-brand-surface text-[12px] leading-relaxed">
        {messages.map((m, idx) => (
          <div 
            key={idx} 
            className={`min-w-0 overflow-x-hidden p-3 rounded-lg border relative group/msg transition-all ${
              m.role === 'user' 
                ? 'bg-[#1a253d] border-[#2c3d61] text-brand-on-surface' 
                : 'bg-brand-surface-lowest border-brand-outline-variant/20 text-brand-on-surface-variant'
            }`}
          >
            {/* Header role badge */}
            <div className="flex items-center justify-between mb-1.5 border-b border-white/5 pb-1">
              <span className={`text-[12px] uppercase font-mono px-1.5 py-0.5 rounded leading-none flex items-center gap-1 ${
                m.role === 'user' ? 'bg-brand-cyan/10 text-brand-cyan' : 'bg-brand-amber/10 text-brand-amber'
              }`}>
                {m.role === 'user' ? <SlidersHorizontal size={8} /> : <Cpu size={8} />}
                {m.role === 'user' ? 'Operator' : 'CO-ENGINEER'}
              </span>

              {/* Copy button */}
              <button
                onClick={() => handleCopyText(m.text, idx)}
                className="opacity-0 group-hover/msg:opacity-100 p-0.5 text-slate-500 hover:text-slate-300 rounded cursor-pointer transition-all flex items-center gap-1 text-[12px]"
                title="Copy contents"
              >
                {copiedIndex === idx ? <Check size={10} className="text-brand-secondary" /> : <Copy size={10} />}
                <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {m.role === 'user' ? (
              <div className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed space-y-2 select-text">
                {m.text.split('\n').map((line, i) => (
                  <p key={i} className="text-slate-300">{line}</p>
                ))}
              </div>
            ) : (
              <div className="space-y-2 select-text">
                {parsedMessages[idx]?.summary && (
                  <div className="rounded-lg border border-brand-cyan/20 bg-brand-cyan/8 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-brand-cyan">Executive Summary</div>
                      {m.meta?.macroId && m.meta.macroId !== 'custom_query' && (
                        <div className="rounded-full border border-brand-cyan/20 bg-brand-cyan/10 px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide text-brand-cyan">
                          {getAiMacroSpec(m.meta.macroId).label}
                        </div>
                      )}
                    </div>
                    <p className="mt-1 break-all text-[12px] leading-relaxed text-slate-200">{parsedMessages[idx]?.summary}</p>
                  </div>
                )}

                {m.meta?.diagnostics && (
                  <div className="rounded-lg border border-violet-400/20 bg-violet-500/8 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-violet-200">Macro Focus</div>
                      <div className="text-[12px] font-mono text-slate-300">
                        {m.meta.diagnostics.visibleSignalsSent}/{m.meta.diagnostics.totalSignalsAvailable} signals
                      </div>
                    </div>
                    <div className="mt-2 grid gap-1 text-[12px] text-slate-300">
                      <div>
                        <span className="font-bold text-slate-100">Root:</span> {m.meta.diagnostics.rootEntity}
                      </div>
                      <div>
                        <span className="font-bold text-slate-100">Focus Entities:</span> {m.meta.diagnostics.focusEntities.join(', ') || 'none'}
                      </div>
                      <div>
                        <span className="font-bold text-slate-100">Confidence:</span> {m.meta.diagnostics.semanticConfidence}%
                      </div>
                      <div>
                        <span className="font-bold text-slate-100">Entity Roles:</span> {Object.entries(m.meta.diagnostics.entityRoles).slice(0, 5).map(([entityName, role]) => `${entityName}:${role}`).join(', ') || 'none'}
                      </div>
                      <div>
                        <span className="font-bold text-slate-100">Categories:</span> {m.meta.diagnostics.desiredCategories.join(', ') || 'none'}
                      </div>
                    </div>
                    {m.meta.diagnostics.selectionNotes.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {m.meta.diagnostics.selectionNotes.slice(0, 3).map((note, noteIndex) => (
                          <div key={`${idx}-note-${noteIndex}`} className="text-[12px] leading-relaxed text-slate-400">
                            {note}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 space-y-1.5">
                      {m.meta.diagnostics.selectedSignals.slice(0, 4).map((signal, signalIndex) => (
                        <div key={signal.displayKey || `${idx}-${signal.normalizedSignal}-${signalIndex}`} className="rounded border border-white/5 bg-[#060a12] px-2 py-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate text-[12px] font-bold text-violet-100">{signal.signal}</div>
                            <div className="text-[12px] font-mono text-slate-400">score {signal.score}</div>
                          </div>
                          <div className="mt-1 text-[12px] leading-relaxed text-slate-400">
                            {signal.entities.join(', ') || 'root only'} • {signal.categories.join(', ') || 'uncategorized'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-5 gap-1.5">
                  <div className="flex min-h-[78px] min-w-0 flex-col rounded-lg border border-white/5 bg-[#060a12] px-2 py-1.5">
                    <div className="min-w-0 whitespace-normal break-normal text-[10px] uppercase leading-tight tracking-[0.08em] text-slate-500">High Risk</div>
                    <div className="mt-auto pt-2 text-base font-bold leading-none tabular-nums text-red-400">{parsedMessages[idx]?.highCount ?? 0}</div>
                  </div>
                  <div className="flex min-h-[78px] min-w-0 flex-col rounded-lg border border-white/5 bg-[#060a12] px-2 py-1.5">
                    <div className="min-w-0 whitespace-normal break-normal text-[10px] uppercase leading-tight tracking-[0.08em] text-slate-500">Medium</div>
                    <div className="mt-auto pt-2 text-base font-bold leading-none tabular-nums text-orange-400">{parsedMessages[idx]?.mediumCount ?? 0}</div>
                  </div>
                  <div className="flex min-h-[78px] min-w-0 flex-col rounded-lg border border-white/5 bg-[#060a12] px-2 py-1.5">
                    <div className="min-w-0 whitespace-normal break-normal text-[10px] uppercase leading-tight tracking-[0.08em] text-slate-500">Low</div>
                    <div className="mt-auto pt-2 text-base font-bold leading-none tabular-nums text-yellow-300">{parsedMessages[idx]?.lowCount ?? 0}</div>
                  </div>
                  <div className="flex min-h-[78px] min-w-0 flex-col rounded-lg border border-white/5 bg-[#060a12] px-2 py-1.5">
                    <div className="min-w-0 whitespace-normal break-normal text-[10px] uppercase leading-tight tracking-[0.06em] text-slate-500">Protocol</div>
                    <div className="mt-auto pt-2 text-base font-bold leading-none tabular-nums text-cyan-200">{parsedMessages[idx]?.protocolCount ?? 0}</div>
                  </div>
                  <div className="flex min-h-[78px] min-w-0 flex-col rounded-lg border border-white/5 bg-[#060a12] px-2 py-1.5">
                    <div className="min-w-0 whitespace-normal break-normal text-[10px] uppercase leading-tight tracking-[0.05em] text-slate-500">Code Blocks</div>
                    <div className="mt-auto pt-2 text-base font-bold leading-none tabular-nums text-emerald-200">{parsedMessages[idx]?.codeBlockCount ?? 0}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {messages.length === 0 && !loading && (
          <div className="rounded border border-brand-outline-variant/20 bg-brand-surface-lowest px-3 py-3 text-[12px] leading-relaxed text-slate-400">
            Choose an engineering macro below or ask a custom question to start.
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <>
            <div className="flex items-center gap-2 text-lime-300 text-[12px] uppercase font-mono bg-brand-surface-lowest p-3 rounded-lg border border-lime-400/20 justify-center">
              <Loader2 size={12} className="animate-spin text-lime-300" />
              <span>AI Analysis {jobElapsedSeconds}s</span>
            </div>
          </>
        )}
      </div>

      {hasFinishedJobCard && (
        <div className="flex-none border-t border-brand-outline-variant/30 bg-brand-surface-lowest px-4 py-1.5">
          <div className={`rounded-xl border px-5 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur ${jobCardSurface}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className={`text-[12px] font-bold uppercase tracking-[0.2em] ${jobCardTitleTone}`}>{jobCardTitle}</div>
                {!loading && (
                  <div className="mt-1 text-[12px] text-slate-400">
                    {jobStatus}
                  </div>
                )}
              </div>
              {loading ? (
                <button
                  type="button"
                  onClick={() => void handleStopJob()}
                  className="flex-none rounded-lg border border-red-400/70 bg-red-600 px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-white shadow-[0_0_18px_rgba(220,38,38,0.35)] cursor-pointer hover:bg-red-500"
                >
                  Stop
                </button>
              ) : (
                <div className={`flex-none rounded-lg border px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide ${jobCardBadgeTone}`}>
                  {jobCardBadge}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suggestion Chips */}
      <div ref={lowerControlsRef} className="flex-none shrink-0">
        {/* Suggestion Chips */}
        <div className="p-2 border-t border-brand-outline-variant/30 bg-brand-surface-lowest text-[12px] space-y-1.5 select-none">
          <span className="text-[12px] uppercase text-slate-400 font-bold tracking-wider px-1 inline-block">ENGINEERING MACROS:</span>
          <div className="grid grid-cols-3 gap-1.5">
            {getVisibleAiMacros().map((macro) => {
              const icon = macro.id === 'generate_vhdl_tb'
                ? <FileCode size={11} />
                : macro.id === 'inspect_race_hazards' || macro.id === 'verify_clock_reset_sequence'
                  ? <Bug size={11} />
                  : macro.id === 'protocol_decoder_details' || macro.id === 'summarize_protocol_timeline'
                    ? <Layers size={11} />
                    : macro.id === 'generate_vhdl_assertions' || macro.id === 'draft_rtl_skeleton'
                      ? <FileCode size={11} />
                      : <Sparkles size={11} />;
              const invocation = resolveMacroInvocation(macro.id);
              return (
              <button
                key={macro.id}
                type="button"
                onClick={() => {
                  if (invocation.kind === 'composer') {
                    openTbComposer(invocation.tbGenerationMode);
                    return;
                  }
                  void handleMacroSendMessage(invocation.prompt, { macroId: invocation.macroId });
                }}
                disabled={loading || (!hasRemoteExportConsent && selectedProviderRequiresRemoteConsent)}
                className="min-w-0 rounded bg-brand-surface-low px-2 py-1 transition-all text-[12px] cursor-pointer text-left border border-brand-outline-variant/30 hover:border-brand-cyan/40 hover:bg-brand-surface-high flex items-center justify-start gap-1.5"
              >
                <span className={`flex-none ${getMacroButtonTone(macro.id)}`}>{icon}</span>
                <span className={`min-w-0 truncate text-left ${getMacroButtonTone(macro.id)}`}>{macro.label}</span>
              </button>
            )})}
          </div>

          {showTbComposer && (
            <div className="mt-2 rounded border border-brand-outline-variant/30 bg-[#060a12] p-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[12px] font-bold uppercase tracking-wide text-brand-cyan">Generate VHDL TB</div>
                <button
                  type="button"
                  onClick={() => setShowTbComposer(false)}
                  className="text-[12px] text-slate-400 hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setTbGenerationMode('project_entities');
                    setTbPromptDraft(getTbPromptForMode('project_entities'));
                  }}
                  className={`rounded border px-2 py-2 text-left transition-all cursor-pointer ${
                    tbGenerationMode === 'project_entities'
                      ? 'border-brand-cyan/60 bg-brand-cyan/10 text-slate-100'
                      : 'border-brand-outline-variant/30 bg-brand-surface-low text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase">
                    <ChevronRight size={10} />
                    <span>Use Project Entities</span>
                  </div>
                  <div className="mt-1 text-[12px] text-slate-400">
                    Generate VHDL testbenches for the VHDL entities already present in the selected project folder.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTbGenerationMode('reverse_from_vcd');
                    setTbPromptDraft(getTbPromptForMode('reverse_from_vcd'));
                  }}
                  className={`rounded border px-2 py-2 text-left transition-all cursor-pointer ${
                    tbGenerationMode === 'reverse_from_vcd'
                      ? 'border-brand-cyan/60 bg-brand-cyan/10 text-slate-100'
                      : 'border-brand-outline-variant/30 bg-brand-surface-low text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase">
                    <ChevronRight size={10} />
                    <span>Reverse From Loaded VCD</span>
                  </div>
                  <div className="mt-1 text-[12px] text-slate-400">
                    Write a complete VHDL module and matching VHDL testbench that reproduce the loaded waveform behavior.
                  </div>
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] uppercase font-bold tracking-wide text-slate-400">Editable Prompt</span>
                  <button
                    type="button"
                    onClick={() => setTbPromptDraft(getTbPromptForMode(tbGenerationMode))}
                    className="text-[12px] text-brand-amber hover:text-yellow-300 cursor-pointer"
                  >
                    Reset Default
                  </button>
                </div>
                <textarea
                  value={tbPromptDraft}
                  onChange={(event) => setTbPromptDraft(event.target.value)}
                  rows={9}
                  className="w-full resize-y rounded border border-brand-outline-variant/40 bg-brand-surface px-2 py-2 text-[12px] font-mono text-slate-200 outline-none focus:border-brand-cyan"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTbComposer(false)}
                  className="px-2 py-1 rounded border border-brand-outline-variant/30 bg-brand-surface-low text-[12px] font-bold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmitTbPrompt()}
                  disabled={loading || !tbPromptDraft.trim() || (!hasRemoteExportConsent && selectedProviderRequiresRemoteConsent)}
                  className="px-2 py-1 rounded bg-brand-amber text-[12px] font-bold text-brand-surface-lowest disabled:opacity-40 cursor-pointer"
                >
                  Run Prompt
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input Form Footer */}
        <form 
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="p-3 border-t border-brand-outline-variant/50 bg-[#060b13] flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Ask AI hardware coder..."
            disabled={loading || (!hasRemoteExportConsent && selectedProviderRequiresRemoteConsent)}
            className="flex-1 bg-brand-surface border border-brand-outline-variant/50 rounded px-3 py-1.5 text-brand-on-surface outline-none focus:border-brand-amber text-[12px] placeholder-slate-500 font-mono"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading || !selectedProvider || !selectedModel || (!hasRemoteExportConsent && selectedProviderRequiresRemoteConsent)}
            className="p-2 rounded bg-brand-amber hover:bg-yellow-400 text-brand-surface-lowest font-bold transition-all disabled:opacity-30 cursor-pointer"
          >
            <Send size={12} />
          </button>
        </form>
      </div>
    </div>
  );
};
