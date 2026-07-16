import React, { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  FPGA_ARCHITECT_SWEEP_ATTEMPTS_PER_DESIGN,
  FPGA_ARCHITECT_SWEEP_DESIGNS,
  FPGA_ARCHITECT_SWEEP_TOTAL_ATTEMPTS,
} from '../fpgaArchitectSweepConfig';
import { ProjectContextPayload, ProjectFileEntry, ProviderOption, Signal, SimulationMacroContextPayload } from '../types';
import { AiMacroId, TbGenerationMode, getAiMacroSpec, getVisibleAiMacros } from '../aiMacros';
import { resolveMacroInvocation } from '../aiDrawerModel';
import { AIWorkspaceReport, buildDisplayReport } from '../aiReport';
import { apiFetch } from '../api';
import { architectPromptRequestsReuse, filterArchitectReferenceFiles } from '../fpgaArchitectContext';
import { getProviderDeployment } from '../exportPolicy';
import { useAIDrawerAnalysis, type Message } from './useAIDrawerAnalysis';
import { JobTelemetryPanel, ProviderSummaryPanel, RemoteConsentPanel, RemoteExportPreviewPanel } from './AIDrawerStatusPanels';
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
  ChevronRight,
  Gauge,
  OctagonX,
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

interface ModelOption {
  id: string;
  label: string;
}

const AI_PROVIDER_STORAGE_KEY = 'automata-logicpro-ai-provider';
const AI_MODEL_STORAGE_KEY = 'automata-logicpro-ai-models';
const FPGA_ARCHITECT_LOOP_JOB_STORAGE_KEY = 'automata-logicpro-fpga-architect-loop-job';
const FPGA_TARGET_OPTIONS = [
  { value: '', label: 'Generic / infer from requirements' },
  { value: 'Xilinx Artix-7', label: 'Xilinx Artix-7' },
  { value: 'Xilinx Spartan-7', label: 'Xilinx Spartan-7' },
  { value: 'AMD/Xilinx Zynq-7000', label: 'AMD/Xilinx Zynq-7000' },
  { value: 'Intel Cyclone IV', label: 'Intel Cyclone IV' },
  { value: 'Intel Cyclone V', label: 'Intel Cyclone V' },
  { value: 'Intel MAX 10', label: 'Intel MAX 10' },
  { value: 'Lattice iCE40', label: 'Lattice iCE40' },
  { value: 'Lattice ECP5', label: 'Lattice ECP5' },
  { value: 'Microchip PolarFire', label: 'Microchip PolarFire' },
];
const RESET_STYLE_OPTIONS = [
  { value: 'Synchronous active-high reset', label: 'Synchronous active-high reset' },
  { value: 'Synchronous active-low reset', label: 'Synchronous active-low reset' },
  { value: 'Asynchronous active-high reset', label: 'Asynchronous active-high reset' },
  { value: 'Asynchronous active-low reset', label: 'Asynchronous active-low reset' },
  { value: 'Reset-less / power-on initialization', label: 'Reset-less / power-on initialization' },
];

const loadStoredModelSelections = (): Record<string, string> => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(AI_MODEL_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed as Record<string, string> : {};
  } catch {
    return {};
  }
};

const storeArchitectLoopJobId = (jobId: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (jobId) {
    window.localStorage.setItem(FPGA_ARCHITECT_LOOP_JOB_STORAGE_KEY, jobId);
    return;
  }
  window.localStorage.removeItem(FPGA_ARCHITECT_LOOP_JOB_STORAGE_KEY);
};

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

const getMacroButtonTone = (macroId: AiMacroId) => {
  switch (macroId) {
    case 'fpga_vhdl_architect':
      return 'text-orange-200';
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
  const [inputText, setInputText] = useState('');
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [selectedProvider, setSelectedProvider] = useState(() => {
    if (typeof window === 'undefined') return 'ollama';
    return window.localStorage.getItem(AI_PROVIDER_STORAGE_KEY) || 'ollama';
  });
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [remoteExportConsents, setRemoteExportConsents] = useState<Record<string, boolean>>({});
  const [showConsoleHelp, setShowConsoleHelp] = useState(false);
  const [showTbComposer, setShowTbComposer] = useState(false);
  const [showArchitectComposer, setShowArchitectComposer] = useState(false);
  const [tbGenerationMode, setTbGenerationMode] = useState<TbGenerationMode>('project_entities');
  const [tbPromptDraft, setTbPromptDraft] = useState('');
  const [architectProjectName, setArchitectProjectName] = useState('');
  const [architectTargetFpga, setArchitectTargetFpga] = useState('');
  const [architectClockHz, setArchitectClockHz] = useState('100 MHz');
  const [architectResetStyle, setArchitectResetStyle] = useState('Synchronous active-high reset');
  const [architectInterfacePrefs, setArchitectInterfacePrefs] = useState('');
  const [architectIncludeTb, setArchitectIncludeTb] = useState(true);
  const [architectIncludeGhdl, setArchitectIncludeGhdl] = useState(true);
  const [architectPromptDraft, setArchitectPromptDraft] = useState('');
  const [architectLoopRunning, setArchitectLoopRunning] = useState(false);
  const [architectLoopJobId, setArchitectLoopJobId] = useState<string | null>(null);
  const [architectLoopCurrent, setArchitectLoopCurrent] = useState(0);
  const [architectLoopCurrentDesignLabel, setArchitectLoopCurrentDesignLabel] = useState('');
  const [architectLoopCurrentDesignAttempt, setArchitectLoopCurrentDesignAttempt] = useState(0);
  const [architectLoopCompletedAttempts, setArchitectLoopCompletedAttempts] = useState(0);
  const [architectLoopFailures, setArchitectLoopFailures] = useState(0);
  const [architectLoopSuccesses, setArchitectLoopSuccesses] = useState(0);
  const [architectLoopProviderPaused, setArchitectLoopProviderPaused] = useState(false);
  const [architectLoopProviderMessage, setArchitectLoopProviderMessage] = useState('');
  const [architectLoopProviderRetryAt, setArchitectLoopProviderRetryAt] = useState('');
  const [architectLoopResult, setArchitectLoopResult] = useState<{
    failures: number;
    attempts: number;
    logFilePath: string;
    masterLogPath?: string;
    designSummaries?: Array<{
      key: string;
      label: string;
      attempts: number;
      completedAttempts: number;
      failures: number;
      successes: number;
      logFilePath: string;
      outputRoot: string;
    }>;
    error?: string | null;
  } | null>(null);
  const architectLoopAttempts = FPGA_ARCHITECT_SWEEP_TOTAL_ATTEMPTS;
  const architectLoopDesignCount = FPGA_ARCHITECT_SWEEP_DESIGNS.length;
  const drawerScrollRef = useRef<HTMLDivElement | null>(null);
  const lowerControlsRef = useRef<HTMLDivElement | null>(null);
  const architectLoopStopRequestedRef = useRef(false);

  useEffect(() => {
    if (!architectLoopJobId) {
      return;
    }

    let cancelled = false;
    let missedStatusPolls = 0;
    const pollStatus = async () => {
      try {
        const response = await apiFetch(`/api/ai-jobs/${architectLoopJobId}/status`);
        const data = await response.json().catch(() => null);
        if (cancelled) {
          return;
        }
        if (!response.ok) {
          if (response.status === 404 || response.status === 403) {
            missedStatusPolls += 1;
            if (missedStatusPolls >= 2) {
              setArchitectLoopRunning(false);
              setArchitectLoopJobId(null);
              setArchitectLoopProviderPaused(false);
              storeArchitectLoopJobId(null);
            }
          }
          return;
        }

        missedStatusPolls = 0;
        setArchitectLoopRunning(true);
        storeArchitectLoopJobId(architectLoopJobId);

        const nextCurrent = Number(data?.progress?.currentLoop);
        if (Number.isFinite(nextCurrent)) {
          setArchitectLoopCurrent(nextCurrent);
        }
        const nextCompletedAttempts = Number(data?.progress?.completedAttempts);
        if (Number.isFinite(nextCompletedAttempts)) {
          setArchitectLoopCompletedAttempts(nextCompletedAttempts);
        }
        const nextFailures = Number(data?.progress?.failures);
        if (Number.isFinite(nextFailures)) {
          setArchitectLoopFailures(nextFailures);
        }
        const nextSuccesses = Number(data?.progress?.successes);
        if (Number.isFinite(nextSuccesses)) {
          setArchitectLoopSuccesses(nextSuccesses);
        }
        const nextDesignLabel = typeof data?.progress?.currentDesignLabel === 'string'
          ? data.progress.currentDesignLabel
          : '';
        setArchitectLoopCurrentDesignLabel(nextDesignLabel);
        const nextDesignAttempt = Number(data?.progress?.currentDesignAttempt);
        if (Number.isFinite(nextDesignAttempt)) {
          setArchitectLoopCurrentDesignAttempt(nextDesignAttempt);
        }
        setArchitectLoopProviderPaused(Boolean(data?.progress?.providerPaused));
        setArchitectLoopProviderMessage(typeof data?.progress?.providerMessage === 'string'
          ? data.progress.providerMessage
          : '');
        setArchitectLoopProviderRetryAt(typeof data?.progress?.providerRetryAt === 'string'
          ? data.progress.providerRetryAt
          : '');
      } catch {
        // Keep the loop running quietly even if a single status poll misses.
      }
    };

    void pollStatus();
    const timer = window.setInterval(() => {
      void pollStatus();
    }, 400);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [architectLoopJobId]);

  useEffect(() => {
    if (typeof window === 'undefined' || architectLoopJobId) {
      return;
    }

    const storedJobId = window.localStorage.getItem(FPGA_ARCHITECT_LOOP_JOB_STORAGE_KEY);
    if (!storedJobId) {
      return;
    }

    let cancelled = false;
    const restoreStoredLoopJob = async () => {
      try {
        const response = await apiFetch(`/api/ai-jobs/${storedJobId}/status`);
        const data = await response.json().catch(() => null);
        if (cancelled) {
          return;
        }
        if (!response.ok) {
          storeArchitectLoopJobId(null);
          return;
        }

        setArchitectLoopJobId(storedJobId);
        setArchitectLoopRunning(true);
        const nextCurrent = Number(data?.progress?.currentLoop);
        if (Number.isFinite(nextCurrent)) {
          setArchitectLoopCurrent(nextCurrent);
        }
        const nextCompletedAttempts = Number(data?.progress?.completedAttempts);
        if (Number.isFinite(nextCompletedAttempts)) {
          setArchitectLoopCompletedAttempts(nextCompletedAttempts);
        }
        const nextFailures = Number(data?.progress?.failures);
        if (Number.isFinite(nextFailures)) {
          setArchitectLoopFailures(nextFailures);
        }
        const nextSuccesses = Number(data?.progress?.successes);
        if (Number.isFinite(nextSuccesses)) {
          setArchitectLoopSuccesses(nextSuccesses);
        }
        setArchitectLoopCurrentDesignLabel(typeof data?.progress?.currentDesignLabel === 'string'
          ? data.progress.currentDesignLabel
          : '');
        const nextDesignAttempt = Number(data?.progress?.currentDesignAttempt);
        if (Number.isFinite(nextDesignAttempt)) {
          setArchitectLoopCurrentDesignAttempt(nextDesignAttempt);
        }
        setArchitectLoopProviderPaused(Boolean(data?.progress?.providerPaused));
        setArchitectLoopProviderMessage(typeof data?.progress?.providerMessage === 'string'
          ? data.progress.providerMessage
          : '');
        setArchitectLoopProviderRetryAt(typeof data?.progress?.providerRetryAt === 'string'
          ? data.progress.providerRetryAt
          : '');
      } catch {
        // Leave the stored job id alone on transient local request failures.
      }
    };

    void restoreStoredLoopJob();
    return () => {
      cancelled = true;
    };
  }, [architectLoopJobId]);

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
    if (!isOpen) return;

    const loadRemoteExportConsents = async () => {
      try {
        const response = await apiFetch('/api/ai/remote-export-consent');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load remote export consent settings');
        }
        const nextConsents = data?.consents && typeof data.consents === 'object' ? data.consents : {};
        setRemoteExportConsents(nextConsents);
      } catch (error: any) {
        setProviderError((current) => current || error.message || String(error));
      }
    };

    void loadRemoteExportConsents();
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
        const storedModels = loadStoredModelSelections();
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
    setPendingRemoteExportPreview(null);
  }, [selectedProvider, selectedModel, inputText, tbPromptDraft, timeUnit, tickDuration, projectPath, workspaceFileName, simulationMacroContext, signals]);

  useEffect(() => {
    if (typeof window === 'undefined' || !selectedProvider) return;
    window.localStorage.setItem(AI_PROVIDER_STORAGE_KEY, selectedProvider);
  }, [selectedProvider]);

  useEffect(() => {
    if (typeof window === 'undefined' || !selectedProvider || !selectedModel) return;
    const storedModels = loadStoredModelSelections();
    storedModels[selectedProvider] = selectedModel;
    window.localStorage.setItem(AI_MODEL_STORAGE_KEY, JSON.stringify(storedModels));
  }, [selectedProvider, selectedModel]);

  async function buildProjectContext(queryText: string): Promise<ProjectContextPayload | null> {
    const architectAllowsGeneratedReuse = architectPromptRequestsReuse(queryText);
    const sourceProjectFiles = queryText.includes('Project name: "') || queryText.includes('Feature Mode: fpga_vhdl_architect')
      ? filterArchitectReferenceFiles(projectFiles, { allowGeneratedReuse: architectAllowsGeneratedReuse })
      : projectFiles;

    if (sourceProjectFiles.length === 0) {
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

    const scoredFiles = sourceProjectFiles
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
      fileCount: sourceProjectFiles.length,
      filePaths: sourceProjectFiles.slice(0, 80).map((file) => file.path),
      excerpts,
    };
  }

  const {
    messages,
    loading,
    copiedIndex,
    providerError,
    pendingRemoteExportPreview,
    jobStatus,
    jobElapsedSeconds,
    testGenerating,
    testGenerateResult,
    handleSendMessage,
    handleMacroSendMessage,
    handleRetryLastMacro,
    handleApproveRemoteExportPreview,
    handleCancelRemoteExportPreview,
    handleStopJob,
    handleTestGenerate,
    handleStopTestGenerate,
    handleCopyText,
    selectedProviderInfo,
    selectedProviderRequiresRemoteConsent,
    hasRemoteExportConsent,
    selectedProviderDeployment,
    statusPanelTelemetry,
    hasFinishedJobCard,
    jobWasCancelled,
    jobFailed,
    lastRetryableMacroRequest,
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
  } = useAIDrawerAnalysis({
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
  });

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
  }, [isOpen, messages, loading, showTbComposer, showArchitectComposer, testGenerateResult, architectLoopResult]);

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
  }, [isOpen, loading, onMacrosPanelHeightChange, showTbComposer, showArchitectComposer, testGenerateResult, architectLoopResult]);

  const vhdlProjectFiles = projectFiles.filter((file) => file.extension === '.vhd' || file.extension === '.vhdl');
  const architectAllowsGeneratedReuse = architectPromptRequestsReuse(architectPromptDraft);
  const architectReferenceFiles = filterArchitectReferenceFiles(vhdlProjectFiles, {
    allowGeneratedReuse: architectAllowsGeneratedReuse,
  });
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

  const buildArchitectFixedPrompt = () => {
    const fileList = architectReferenceFiles.slice(0, 20).map((file) => `- ${file.path}`).join('\n');
    return [
      `Project name: "${architectProjectName || 'fpga_vhdl_project'}".`,
      projectPath
        ? `Use the currently selected project folder as the save root: ${projectPath}. Create the generated project under that folder.`
        : 'Use the currently selected project folder as the save root once available.',
      architectTargetFpga ? `Target FPGA / board: ${architectTargetFpga}.` : 'Target FPGA / board: infer a generic portable target unless the requirements imply otherwise.',
      `Preferred clock: ${architectClockHz}.`,
      `Reset style: ${architectResetStyle}.`,
      architectInterfacePrefs ? `Interface preferences: ${architectInterfacePrefs}.` : 'Interface preferences: choose clean, maintainable interfaces based on the requirement.',
      architectIncludeTb ? 'Generate a self-checking VHDL testbench.' : 'Do not generate a testbench unless it is necessary to explain the architecture.',
      architectIncludeGhdl ? 'Generate GHDL scripts, analysis order, and simulation instructions.' : 'GHDL script generation is optional.',
      'Return a compact Markdown project manifest with one "# FILE:" block per generated file and a fenced full file body for each file.',
      'Split documentation and metadata into short files: a project overview, a top-level architecture note, unit-level notes for major entities/packages, a short verification note, and a short GHDL plan JSON file.',
      architectReferenceFiles.length > 0
        ? `These existing VHDL files are available for reuse or reference:\n${fileList}`
        : architectAllowsGeneratedReuse && vhdlProjectFiles.length > 0
        ? 'Only generated VHDL files were found in the project browser. Reuse was requested, but no eligible source files remain after filtering.'
        : 'Ignore generated project folders by default and generate from the stated requirements only unless I explicitly ask to reuse existing generated files.',
      'Produce a complete FPGA/VHDL project with requirements notes, architecture documentation, synthesizable VHDL RTL, testbench, simulation scripts, constraints placeholder, and design report.',
      'Keep the project maintainable, GHDL-friendly, and explicit about assumptions and warnings.',
    ].join('\n\n');
  };

  const buildArchitectPrompt = () => {
    const fixedPrompt = buildArchitectFixedPrompt();
    const userPrompt = architectPromptDraft.trim();

    return userPrompt
      ? `${fixedPrompt}\n\nUser design request:\n${userPrompt}`
      : fixedPrompt;
  };

  const parsedMessages = useMemo(
    () => messages.map((message) => message.role === 'assistant' ? buildDisplayReport(message.text, message.meta) : null),
    [messages]
  );

  const getMessageMetricCounts = (message: Message, parsedReport: ReturnType<typeof buildDisplayReport> | null) => {
    if (message.meta?.macroId === 'inspect_race_hazards' && Array.isArray(message.meta.hazardFindings)) {
      return {
        highCount: message.meta.hazardFindings.filter((finding) => finding?.severity === 'high').length,
        mediumCount: message.meta.hazardFindings.filter((finding) => finding?.severity === 'medium').length,
        lowCount: message.meta.hazardFindings.filter((finding) => finding?.severity === 'low').length,
        protocolCount: parsedReport?.protocolCount ?? 0,
        codeBlockCount: parsedReport?.codeBlockCount ?? 0,
      };
    }

    return {
      highCount: parsedReport?.highCount ?? 0,
      mediumCount: parsedReport?.mediumCount ?? 0,
      lowCount: parsedReport?.lowCount ?? 0,
      protocolCount: parsedReport?.protocolCount ?? 0,
      codeBlockCount: parsedReport?.codeBlockCount ?? 0,
    };
  };

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

  const finishedJobSkillSummary = useMemo(() => {
    if (jobStatus !== 'AI analysis finished.') {
      return null;
    }

    const selectedSkills = latestStructuredReport?.report.orchestratorAudit?.selectedSkills || [];
    const uniqueSkillNames = Array.from(
      new Set(
        selectedSkills
          .map((skill) => String(skill.name || '').trim())
          .filter(Boolean)
      )
    );

    return uniqueSkillNames.length > 0 ? uniqueSkillNames.join(', ') : null;
  }, [jobStatus, latestStructuredReport]);

  useEffect(() => {
    onLatestStructuredReportChange?.(latestStructuredReport);
  }, [latestStructuredReport, onLatestStructuredReportChange]);

  const openTbComposer = (mode: TbGenerationMode) => {
    setShowArchitectComposer(false);
    setTbGenerationMode(mode);
    setTbPromptDraft(getTbPromptForMode(mode));
    setShowTbComposer(true);
  };

  const openArchitectComposer = () => {
    setShowTbComposer(false);
    setArchitectProjectName(projectName && projectName !== 'Select Project Folder' ? projectName : 'fpga_vhdl_project');
    setArchitectTargetFpga('');
    setArchitectClockHz('100 MHz');
    setArchitectResetStyle('Synchronous active-high reset');
    setArchitectInterfacePrefs('');
    setArchitectIncludeTb(true);
    setArchitectIncludeGhdl(true);
    setArchitectPromptDraft('');
    setShowArchitectComposer(true);
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

  const handleSubmitArchitectPrompt = async () => {
    const promptToSend = buildArchitectPrompt().trim();
    if (!promptToSend) return;
    setShowArchitectComposer(false);
    await handleMacroSendMessage(promptToSend, {
      macroId: 'fpga_vhdl_architect',
      tbGenerationMode: null,
    });
  };

  const handleRunArchitectLoop = async () => {
    const promptToSend = buildArchitectPrompt().trim();
    if (
      architectLoopRunning
      || !selectedProvider
      || !selectedModel
      || !projectPath
      || !promptToSend
      || loading
      || testGenerating
      || selectedProviderDeployment !== 'local'
    ) {
      return;
    }

    const loopJobId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `architect-loop-${Date.now()}`;
    flushSync(() => {
      architectLoopStopRequestedRef.current = false;
      storeArchitectLoopJobId(loopJobId);
      setArchitectLoopRunning(true);
      setArchitectLoopJobId(loopJobId);
      setArchitectLoopCurrent(0);
      setArchitectLoopCompletedAttempts(0);
      setArchitectLoopFailures(0);
      setArchitectLoopSuccesses(0);
      setArchitectLoopProviderPaused(false);
      setArchitectLoopProviderMessage('');
      setArchitectLoopProviderRetryAt('');
      setArchitectLoopCurrentDesignLabel('');
      setArchitectLoopCurrentDesignAttempt(0);
      setArchitectLoopResult(null);
    });
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
    let keepLoopActiveAfterSettled = false;
    try {
      const response = await apiFetch('/api/ai/fpga-architect-loop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: loopJobId,
          provider: selectedProvider,
          model: selectedModel,
          query: promptToSend,
          projectPath,
          workspaceFileName,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || `FPGA Architect multi-design sweep failed (${response.status})`);
      }

      setArchitectLoopResult({
        failures: Number.isFinite(Number(data?.failures)) ? Number(data.failures) : architectLoopAttempts,
        attempts: Number.isFinite(Number(data?.attempts)) ? Number(data.attempts) : architectLoopAttempts,
        logFilePath: typeof data?.logFilePath === 'string' ? data.logFilePath : '',
        masterLogPath: typeof data?.masterLogPath === 'string' ? data.masterLogPath : '',
        designSummaries: Array.isArray(data?.designSummaries) ? data.designSummaries : [],
        error: null,
      });
      setArchitectLoopCurrent(Number.isFinite(Number(data?.completedAttempts)) ? Number(data.completedAttempts) : architectLoopAttempts);
      setArchitectLoopCompletedAttempts(Number.isFinite(Number(data?.completedAttempts)) ? Number(data.completedAttempts) : architectLoopAttempts);
      setArchitectLoopFailures(Number.isFinite(Number(data?.failures)) ? Number(data.failures) : architectLoopAttempts);
      setArchitectLoopSuccesses(Number.isFinite(Number(data?.successes)) ? Number(data.successes) : 0);
      setArchitectLoopProviderPaused(false);
      setArchitectLoopProviderMessage('');
      setArchitectLoopProviderRetryAt('');
      setArchitectLoopCurrentDesignLabel('');
      setArchitectLoopCurrentDesignAttempt(0);
    } catch (error: any) {
      if (architectLoopStopRequestedRef.current) {
        setArchitectLoopResult(null);
        return;
      }
      try {
        const statusResponse = await apiFetch(`/api/ai-jobs/${loopJobId}/status`);
        if (statusResponse.ok) {
          keepLoopActiveAfterSettled = true;
          setArchitectLoopRunning(true);
          setArchitectLoopJobId(loopJobId);
          storeArchitectLoopJobId(loopJobId);
          return;
        }
      } catch {
        // If the tracked job cannot be reached, fall through and show the request failure.
      }
      setArchitectLoopResult({
        failures: architectLoopAttempts,
        attempts: architectLoopAttempts,
        logFilePath: '',
        error: error?.message || String(error),
      });
    } finally {
      architectLoopStopRequestedRef.current = false;
      if (keepLoopActiveAfterSettled) {
        return;
      }
      setArchitectLoopRunning(false);
      setArchitectLoopJobId(null);
      storeArchitectLoopJobId(null);
      setArchitectLoopProviderPaused(false);
    }
  };

  const handleStopArchitectLoop = async () => {
    if (!architectLoopRunning && !architectLoopJobId) {
      return;
    }

    architectLoopStopRequestedRef.current = true;

    try {
      if (architectLoopJobId) {
        await apiFetch(`/api/ai-jobs/${architectLoopJobId}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch {
      // The in-flight loop request will still settle and clear the local state.
    } finally {
      setArchitectLoopRunning(false);
      setArchitectLoopJobId(null);
      storeArchitectLoopJobId(null);
      setArchitectLoopCurrentDesignLabel('');
      setArchitectLoopCurrentDesignAttempt(0);
    }
  };

  const architectLoopActive = architectLoopRunning || Boolean(architectLoopJobId);

  return (
    <div className={`${isOpen ? 'flex' : 'hidden'} w-[360px] md:w-[420px] overflow-x-hidden bg-brand-surface-low border-l border-brand-outline-variant/55 flex-col h-full z-20 select-none flex-none font-sans`}>
      
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

        <div className="test-dashboard flex min-w-0 flex-col gap-3">
          <div className="test-control-row flex flex-wrap items-start gap-3">
            <div className="test-actions flex flex-col items-stretch gap-3">
              <button
                type="button"
                onClick={() => void (testGenerating ? handleStopTestGenerate() : handleTestGenerate())}
                disabled={!testGenerating && (!selectedProvider || !selectedModel || loading)}
                className={`test-button min-h-12 w-36 rounded-xl border bg-brand-surface-low px-5 py-3 text-[12px] font-bold uppercase tracking-[0.14em] transition-all hover:bg-brand-surface-high disabled:opacity-40 cursor-pointer ${
                  testGenerating
                    ? 'border-red-400/45 text-red-300 hover:border-red-300/55'
                    : 'border-brand-outline-variant/30 text-brand-cyan hover:border-brand-cyan/40'
                }`}
              >
                {testGenerating ? 'STOP' : 'TEST'}
              </button>
              {testGenerateResult && (
                <div className={`flex min-h-12 items-center justify-center rounded-xl border px-4 py-3 text-[12px] font-mono font-bold ${
                  testGenerateResult === 'PASS'
                    ? 'border-lime-400/45 bg-lime-500/10 text-lime-300'
                    : 'border-red-400/45 bg-red-500/10 text-red-300'
                }`}>
                  {testGenerateResult}
                </div>
              )}
            </div>

            <div className="ml-auto flex min-w-0 flex-1 justify-end">
              <div className="flex min-w-0 w-full max-w-[720px] flex-col gap-3">
                <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div
                    className="test-title flex min-h-12 min-w-0 items-center rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 px-5 py-3 text-[12px] font-mono font-bold tracking-[0.04em] text-brand-cyan"
                    title={
                      architectLoopProviderPaused
                        ? architectLoopProviderMessage || 'Provider issue detected. The sweep is paused and will retry this attempt without counting it as failed.'
                        : architectLoopCurrentDesignLabel
                          ? `${architectLoopCurrentDesignLabel}${architectLoopCurrentDesignAttempt > 0 ? ` (${architectLoopCurrentDesignAttempt}/${FPGA_ARCHITECT_SWEEP_ATTEMPTS_PER_DESIGN})` : ''}`
                          : 'Waiting for the first design in the FPGA Architect sweep.'
                    }
                  >
                    <span className="block w-full truncate text-center sm:text-left">
                      {architectLoopProviderPaused
                        ? 'PROVIDER ISSUE - RETRYING'
                        : architectLoopCurrentDesignLabel
                        ? `${architectLoopCurrentDesignLabel}${architectLoopCurrentDesignAttempt > 0 ? ` ${architectLoopCurrentDesignAttempt}/${FPGA_ARCHITECT_SWEEP_ATTEMPTS_PER_DESIGN}` : ''}`
                        : `0 / ${architectLoopDesignCount} DESIGNS`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => void (architectLoopActive ? handleStopArchitectLoop() : handleRunArchitectLoop())}
                    disabled={
                      !architectLoopActive && (
                        !selectedProvider
                        || !selectedModel
                        || !projectPath
                        || loading
                        || testGenerating
                        || selectedProviderDeployment !== 'local'
                      )
                    }
                    className={`test-button test-button-danger flex min-h-12 w-36 items-center justify-center rounded-xl border bg-brand-surface-low px-5 py-3 text-[12px] font-bold uppercase tracking-[0.14em] transition-all hover:bg-brand-surface-high disabled:opacity-40 cursor-pointer ${
                      architectLoopActive
                        ? 'border-red-400/45 text-red-300 hover:border-red-300/55'
                        : 'border-brand-outline-variant/30 text-brand-amber hover:border-brand-amber/40'
                    }`}
                    title={
                      architectLoopActive
                        ? 'Stop the active FPGA Architect multi-design sweep.'
                        : selectedProviderDeployment !== 'local'
                        ? 'The FPGA Architect multi-design sweep currently supports local providers only.'
                        : !projectPath
                          ? 'Open a project folder before running the FPGA Architect multi-design sweep.'
                          : `Run the fixed FPGA Architect sweep: ${FPGA_ARCHITECT_SWEEP_DESIGNS.length} designs, ${FPGA_ARCHITECT_SWEEP_ATTEMPTS_PER_DESIGN} attempts each, ${architectLoopAttempts} total attempts.`
                    }
                  >
                    {architectLoopActive ? <OctagonX size={18} aria-hidden="true" /> : <Gauge size={18} aria-hidden="true" />}
                  </button>
                </div>

                <div className="test-status-row flex justify-end">
                  <div className="grid w-full max-w-[720px] grid-cols-1 gap-3 sm:grid-cols-3">
                    <div
                      className="status-card status-card-total flex h-12 items-center justify-center rounded-xl border border-brand-amber/35 bg-brand-amber/10 px-5 py-0 text-center"
                      title={`Current FPGA Architect loop trial: ${architectLoopCurrent} of ${architectLoopAttempts}. Completed trials: ${architectLoopCompletedAttempts}.`}
                    >
                      <span className="status-value whitespace-nowrap text-[12px] font-mono font-bold uppercase tracking-[0.12em] tabular-nums text-brand-amber">
                        {architectLoopActive ? `${architectLoopCurrent} / ${architectLoopAttempts}` : architectLoopCurrent}
                      </span>
                    </div>

                    <div
                      className="status-card status-card-pass flex h-12 items-center justify-center rounded-xl border border-lime-400/35 bg-lime-500/10 px-5 py-0 text-center"
                      title={`Successful FPGA Architect trials so far: ${architectLoopSuccesses}.`}
                    >
                      <span className="status-value whitespace-nowrap text-[12px] font-mono font-bold uppercase tracking-[0.12em] tabular-nums text-lime-300">
                        {architectLoopSuccesses} PASS
                      </span>
                    </div>

                    <div
                      className="status-card status-card-fail flex h-12 items-center justify-center rounded-xl border border-red-400/35 bg-red-500/10 px-5 py-0 text-center"
                      title={`Failed FPGA Architect trials so far: ${architectLoopFailures}.`}
                    >
                      <span className="status-value whitespace-nowrap text-[12px] font-mono font-bold uppercase tracking-[0.12em] tabular-nums text-red-300">
                        {architectLoopFailures} FAIL
                      </span>
                    </div>
                  </div>
                </div>

                {architectLoopProviderPaused && (
                  <div
                    className="rounded-xl border border-brand-amber/40 bg-brand-amber/10 px-4 py-3 text-[12px] font-mono font-bold leading-relaxed text-brand-amber"
                    title={architectLoopProviderMessage || 'Provider issue detected.'}
                  >
                    <div>Provider issue detected. Sweep paused; this attempt is not counted as failed.</div>
                    <div className="text-brand-amber/80">
                      {architectLoopProviderRetryAt
                        ? `Retry scheduled at ${new Date(architectLoopProviderRetryAt).toLocaleTimeString()}.`
                        : 'Retry scheduled in about 1 minute.'}
                    </div>
                  </div>
                )}

                {!architectLoopRunning && architectLoopResult && (
                  <div
                    className={`flex min-h-12 items-center justify-center rounded-xl border px-4 py-3 text-center text-[12px] font-mono font-bold ${
                      architectLoopResult.error
                        ? 'border-red-400/45 bg-red-500/10 text-red-300'
                        : architectLoopResult.failures > 0
                          ? 'border-brand-amber/40 bg-brand-amber/10 text-brand-amber'
                          : 'border-lime-400/40 bg-lime-500/10 text-lime-300'
                    }`}
                    title={architectLoopResult.error || architectLoopResult.masterLogPath || architectLoopResult.logFilePath || 'FPGA Architect multi-design sweep result'}
                  >
                    {architectLoopResult.error
                      ? 'LOOP FAIL'
                      : `${architectLoopResult.failures} / ${architectLoopResult.attempts} FAIL`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-none space-y-3 border-b border-brand-outline-variant/30 bg-brand-surface px-3.5 py-3">
        <ProviderSummaryPanel
          selectedProviderInfo={selectedProviderInfo}
          selectedProvider={selectedProvider}
          selectedModel={selectedModel}
          selectedProviderDeployment={selectedProviderDeployment}
          providerError={providerError}
        />

        {selectedProviderRequiresRemoteConsent && (
          <RemoteConsentPanel
            selectedProvider={selectedProvider}
            hasRemoteExportConsent={hasRemoteExportConsent}
            onConsentUpdated={setRemoteExportConsents}
            onError={setProviderError}
          />
        )}

        {pendingRemoteExportPreview && (
          <RemoteExportPreviewPanel
            pendingRemoteExportPreview={pendingRemoteExportPreview}
            onCancel={handleCancelRemoteExportPreview}
            onApprove={() => void handleApproveRemoteExportPreview()}
          />
        )}

        <JobTelemetryPanel
          loading={loading}
          jobElapsedSeconds={jobElapsedSeconds}
          statusPanelText={statusPanelText}
          statusPanelTone={statusPanelTone}
          statusPanelTelemetry={statusPanelTelemetry}
          sessionInputDisplayValue={sessionInputDisplayValue}
          sessionOutputDisplayValue={sessionOutputDisplayValue}
        />
      </div>

      {/* Messages Feed */}
      <div ref={drawerScrollRef} className="relative flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-4 bg-brand-surface text-[12px] leading-relaxed">
        {messages.map((m, idx) => {
          const metricCounts = getMessageMetricCounts(m, parsedMessages[idx]);
          return (
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
                    <div className="mt-auto pt-2 text-base font-bold leading-none tabular-nums text-red-400">{metricCounts.highCount}</div>
                  </div>
                  <div className="flex min-h-[78px] min-w-0 flex-col rounded-lg border border-white/5 bg-[#060a12] px-2 py-1.5">
                    <div className="min-w-0 whitespace-normal break-normal text-[10px] uppercase leading-tight tracking-[0.08em] text-slate-500">Medium</div>
                    <div className="mt-auto pt-2 text-base font-bold leading-none tabular-nums text-orange-400">{metricCounts.mediumCount}</div>
                  </div>
                  <div className="flex min-h-[78px] min-w-0 flex-col rounded-lg border border-white/5 bg-[#060a12] px-2 py-1.5">
                    <div className="min-w-0 whitespace-normal break-normal text-[10px] uppercase leading-tight tracking-[0.08em] text-slate-500">Low</div>
                    <div className="mt-auto pt-2 text-base font-bold leading-none tabular-nums text-yellow-300">{metricCounts.lowCount}</div>
                  </div>
                  <div className="flex min-h-[78px] min-w-0 flex-col rounded-lg border border-white/5 bg-[#060a12] px-2 py-1.5">
                    <div className="min-w-0 whitespace-normal break-normal text-[10px] uppercase leading-tight tracking-[0.06em] text-slate-500">Protocol</div>
                    <div className="mt-auto pt-2 text-base font-bold leading-none tabular-nums text-cyan-200">{metricCounts.protocolCount}</div>
                  </div>
                  <div className="flex min-h-[78px] min-w-0 flex-col rounded-lg border border-white/5 bg-[#060a12] px-2 py-1.5">
                    <div className="min-w-0 whitespace-normal break-normal text-[10px] uppercase leading-tight tracking-[0.05em] text-slate-500">Code Blocks</div>
                    <div className="mt-auto pt-2 text-base font-bold leading-none tabular-nums text-emerald-200">{metricCounts.codeBlockCount}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )})}

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
                  <>
                    {finishedJobSkillSummary && (
                      <div className="mt-1 text-[12px] leading-relaxed text-slate-300 break-all">
                        <span className="text-slate-500">Skills used:</span> {finishedJobSkillSummary}
                      </div>
                    )}
                  </>
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
                <div className="flex items-center gap-2">
                  <div className={`flex-none rounded-lg border px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide ${jobCardBadgeTone}`}>
                    {jobCardBadge}
                  </div>
                  {jobFailed && lastRetryableMacroRequest && (
                    <button
                      type="button"
                      onClick={() => void handleRetryLastMacro()}
                      className="flex-none rounded-lg border border-amber-400/55 bg-amber-500/10 px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide text-amber-100 cursor-pointer hover:bg-amber-500/20"
                    >
                      Retry
                    </button>
                  )}
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
          {(() => {
            const visibleMacros = getVisibleAiMacros();
            const fpgaArchitectMacro = visibleMacros.find((macro) => macro.id === 'fpga_vhdl_architect');
            const remainingMacros = visibleMacros.filter((macro) => macro.id !== 'fpga_vhdl_architect');
            const renderMacroButton = (macro: ReturnType<typeof getVisibleAiMacros>[number], fullWidth = false) => {
              const icon = macro.id === 'generate_vhdl_tb'
                ? <FileCode size={11} />
                : macro.id === 'inspect_race_hazards' || macro.id === 'verify_clock_reset_sequence'
                  ? <Bug size={11} />
                  : macro.id === 'protocol_decoder_details' || macro.id === 'summarize_protocol_timeline'
                    ? <Layers size={11} />
                : macro.id === 'generate_vhdl_assertions' || macro.id === 'draft_rtl_skeleton' || macro.id === 'fpga_vhdl_architect'
                      ? <FileCode size={11} />
                      : <Sparkles size={11} />;
              const invocation = resolveMacroInvocation(macro.id);
              return (
              <button
                key={macro.id}
                type="button"
                onClick={() => {
                  if (macro.id === 'fpga_vhdl_architect') {
                    openArchitectComposer();
                    return;
                  }
                  if (invocation.kind === 'composer') {
                    openTbComposer(invocation.tbGenerationMode);
                    return;
                  }
                  void handleMacroSendMessage(invocation.prompt, { macroId: invocation.macroId });
                }}
                disabled={loading || (!hasRemoteExportConsent && selectedProviderRequiresRemoteConsent)}
                className={`min-w-0 rounded bg-brand-surface-low px-2 py-1 transition-all text-[12px] cursor-pointer text-left border border-brand-outline-variant/30 hover:border-brand-cyan/40 hover:bg-brand-surface-high flex items-center gap-1.5 ${fullWidth ? 'col-span-3 justify-center' : 'justify-start'}`}
              >
                <span className={`flex-none ${getMacroButtonTone(macro.id)}`}>{icon}</span>
                <span className={`min-w-0 truncate ${fullWidth ? 'text-center text-yellow-300' : 'text-left'} ${fullWidth ? '' : getMacroButtonTone(macro.id)}`}>{macro.label}</span>
              </button>
            )};

            return (
              <div className="grid grid-cols-3 gap-1.5">
                {fpgaArchitectMacro ? renderMacroButton(fpgaArchitectMacro, true) : null}
                {remainingMacros.map((macro) => renderMacroButton(macro))}
              </div>
            );
          })()}

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

          {showArchitectComposer && (
            <div className="mt-2 rounded border border-brand-outline-variant/30 bg-[#060a12] p-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[12px] font-bold uppercase tracking-wide text-brand-cyan">FPGA VHDL Architect</div>
                <button
                  type="button"
                  onClick={() => setShowArchitectComposer(false)}
                  className="text-[12px] text-slate-400 hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <input
                  value={architectProjectName}
                  onChange={(event) => setArchitectProjectName(event.target.value)}
                  placeholder="Project name"
                  className="rounded border border-brand-outline-variant/40 bg-brand-surface px-2 py-1.5 text-[12px] text-slate-200 outline-none"
                />
                <select
                  value={architectTargetFpga}
                  onChange={(event) => setArchitectTargetFpga(event.target.value)}
                  className="rounded border border-brand-outline-variant/40 bg-brand-surface px-2 py-1.5 text-[12px] text-slate-200 outline-none cursor-pointer"
                  title="Select target FPGA or board family"
                >
                  {FPGA_TARGET_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  value={architectClockHz}
                  onChange={(event) => setArchitectClockHz(event.target.value)}
                  placeholder="Clock preference"
                  className="rounded border border-brand-outline-variant/40 bg-brand-surface px-2 py-1.5 text-[12px] text-slate-200 outline-none"
                />
                <select
                  value={architectResetStyle}
                  onChange={(event) => setArchitectResetStyle(event.target.value)}
                  className="rounded border border-brand-outline-variant/40 bg-brand-surface px-2 py-1.5 text-[12px] text-slate-200 outline-none cursor-pointer"
                  title="Select reset style"
                >
                  {RESET_STYLE_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <input
                value={architectInterfacePrefs}
                onChange={(event) => setArchitectInterfacePrefs(event.target.value)}
                placeholder="Interface preferences"
                className="w-full rounded border border-brand-outline-variant/40 bg-brand-surface px-2 py-1.5 text-[12px] text-slate-200 outline-none"
              />

              <div className="grid grid-cols-2 gap-1.5 text-[12px] text-slate-300">
                <label className="flex items-center gap-2 rounded border border-brand-outline-variant/30 bg-brand-surface-low px-2 py-1.5">
                  <input type="checkbox" checked={architectIncludeTb} onChange={(event) => setArchitectIncludeTb(event.target.checked)} />
                  <span>Include self-checking TB</span>
                </label>
                <label className="flex items-center gap-2 rounded border border-brand-outline-variant/30 bg-brand-surface-low px-2 py-1.5">
                  <input type="checkbox" checked={architectIncludeGhdl} onChange={(event) => setArchitectIncludeGhdl(event.target.checked)} />
                  <span>Include GHDL scripts</span>
                </label>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] uppercase font-bold tracking-wide text-slate-400">User Prompt To Append</span>
                  <button
                    type="button"
                    onClick={() => setArchitectPromptDraft('')}
                    className="text-[12px] text-brand-amber hover:text-yellow-300 cursor-pointer"
                  >
                    Clear User Prompt
                  </button>
                </div>
                <textarea
                  value={architectPromptDraft}
                  onChange={(event) => setArchitectPromptDraft(event.target.value)}
                  rows={8}
                  placeholder="Describe the actual FPGA/VHDL design you want, such as the module behavior, interfaces, protocols, resource goals, or verification expectations."
                  className="w-full resize-y rounded border border-brand-outline-variant/40 bg-brand-surface px-2 py-2 text-[12px] font-mono text-slate-200 outline-none focus:border-brand-cyan"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowArchitectComposer(false)}
                  className="px-2 py-1 rounded border border-brand-outline-variant/30 bg-brand-surface-low text-[12px] font-bold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmitArchitectPrompt()}
                  disabled={loading || !projectPath || (!hasRemoteExportConsent && selectedProviderRequiresRemoteConsent)}
                  className="px-2 py-1 rounded bg-brand-amber text-[12px] font-bold text-brand-surface-lowest disabled:opacity-40 cursor-pointer"
                >
                  Run Architect
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
