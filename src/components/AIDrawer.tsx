import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ProjectContextPayload, ProjectFileEntry, Signal } from '../types';
import { 
  Send, 
  X, 
  Terminal, 
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
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface ReportCodeBlock {
  language: string;
  content: string;
}

interface ReportSection {
  title: string;
  paragraphs: string[];
  bullets: string[];
  codeBlocks: ReportCodeBlock[];
}

interface ParsedAssistantReport {
  summary: string | null;
  sections: ReportSection[];
  highCount: number;
  mediumCount: number;
  lowCount: number;
  protocolCount: number;
  codeBlockCount: number;
}

interface ProviderOption {
  id: string;
  label: string;
  enabled: boolean;
  reason?: string;
}

interface ModelOption {
  id: string;
  label: string;
}

type TbGenerationMode = 'project_entities' | 'reverse_from_vcd';

const buildStructuredReport = (text: string): ParsedAssistantReport => {
  const lines = text.split('\n');
  const sections: ReportSection[] = [];
  let currentSection: ReportSection = {
    title: 'Overview',
    paragraphs: [],
    bullets: [],
    codeBlocks: [],
  };

  let inCodeBlock = false;
  let currentCodeLanguage = '';
  let currentCodeLines: string[] = [];

  const flushCodeBlock = () => {
    if (!inCodeBlock) return;
    currentSection.codeBlocks.push({
      language: currentCodeLanguage,
      content: currentCodeLines.join('\n').trimEnd(),
    });
    inCodeBlock = false;
    currentCodeLanguage = '';
    currentCodeLines = [];
  };

  const pushSection = () => {
    if (
      currentSection.paragraphs.length > 0 ||
      currentSection.bullets.length > 0 ||
      currentSection.codeBlocks.length > 0 ||
      currentSection.title !== 'Overview'
    ) {
      sections.push(currentSection);
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r/g, '');
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        inCodeBlock = true;
        currentCodeLanguage = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      currentCodeLines.push(line);
      continue;
    }

    if (trimmed === '---') {
      continue;
    }

    if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
      pushSection();
      currentSection = {
        title: trimmed.replace(/^#{2,3}\s*/, '').trim() || 'Section',
        paragraphs: [],
        bullets: [],
        codeBlocks: [],
      };
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentSection.bullets.push(trimmed.slice(2).trim());
      continue;
    }

    if (trimmed.length > 0) {
      currentSection.paragraphs.push(trimmed);
    }
  }

  flushCodeBlock();
  pushSection();

  const summarySection = sections.find((section) => !section.title.toLowerCase().includes('deterministic') && section.paragraphs.length > 0);
  const summary = summarySection?.paragraphs[0] || sections.flatMap((section) => section.paragraphs)[0] || null;
  const bulletPool = sections.flatMap((section) => section.bullets);

  return {
    summary,
    sections,
    highCount: bulletPool.filter((bullet) => bullet.includes('[High]')).length,
    mediumCount: bulletPool.filter((bullet) => bullet.includes('[Medium]')).length,
    lowCount: bulletPool.filter((bullet) => bullet.includes('[Low]')).length,
    protocolCount: bulletPool.filter((bullet) => /\[(SPI|I2C|UART)\]/.test(bullet)).length,
    codeBlockCount: sections.reduce((count, section) => count + section.codeBlocks.length, 0),
  };
};

const getSectionAccent = (title: string) => {
  const normalized = title.toLowerCase();
  if (normalized.includes('protocol')) {
    return 'border-cyan-400/25 bg-cyan-500/5';
  }
  if (normalized.includes('hazard') || normalized.includes('timing')) {
    return 'border-amber-400/25 bg-amber-500/5';
  }
  if (normalized.includes('assumption')) {
    return 'border-violet-400/25 bg-violet-500/5';
  }
  if (normalized.includes('module') || normalized.includes('testbench') || normalized.includes('code')) {
    return 'border-emerald-400/25 bg-emerald-500/5';
  }
  return 'border-brand-outline-variant/20 bg-brand-surface-low';
};

const renderBullet = (bullet: string, key: string) => {
  const severityMatch = bullet.match(/^\[(High|Medium|Low|SPI|I2C|UART)\]\s*/);
  const badge = severityMatch?.[1] || null;
  const body = severityMatch ? bullet.replace(severityMatch[0], '') : bullet;

  const badgeClass = badge === 'High'
    ? 'bg-rose-500/15 text-rose-200 border-rose-400/20'
    : badge === 'Medium'
      ? 'bg-amber-500/15 text-amber-200 border-amber-400/20'
      : badge === 'Low'
        ? 'bg-slate-500/15 text-slate-200 border-slate-400/20'
        : 'bg-cyan-500/15 text-cyan-200 border-cyan-400/20';

  return (
    <div key={key} className="flex items-start gap-2 rounded border border-white/5 bg-[#060a12] px-2.5 py-2">
      {badge ? (
        <span className={`mt-0.5 rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ${badgeClass}`}>
          {badge}
        </span>
      ) : (
        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-cyan flex-none" />
      )}
      <span className="text-[10px] leading-relaxed text-slate-300">{body}</span>
    </div>
  );
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
  workspaceFileName
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: "System waveform analysis console online.\nI am your AI Hardware Co-Engineer. I can inspect the currently loaded timeline captures, run local hazard and protocol pre-analysis, and help generate VHDL-oriented explanations, testbenches, and RTL drafts from the waveform and project context. I prefer VHDL over Verilog unless you explicitly request otherwise. Choose a macro below or draft custom instructions."
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('ollama');
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [providerError, setProviderError] = useState<string | null>(null);
  const [showTbComposer, setShowTbComposer] = useState(false);
  const [tbGenerationMode, setTbGenerationMode] = useState<TbGenerationMode>('project_entities');
  const [tbPromptDraft, setTbPromptDraft] = useState('');
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobStartedAt, setJobStartedAt] = useState<number | null>(null);
  const [jobElapsedSeconds, setJobElapsedSeconds] = useState(0);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [testGenerating, setTestGenerating] = useState(false);
  const [testGenerateResult, setTestGenerateResult] = useState<string | null>(null);
  const activeRequestControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadProviders = async () => {
      try {
        const response = await fetch('/api/ai/providers');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load providers');
        }
        const nextProviders = Array.isArray(data.providers) ? data.providers : [];
        setProviders(nextProviders);
        const preferredProvider = nextProviders.find((provider: ProviderOption) => provider.id === 'ollama')
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
        const response = await fetch(`/api/ai/providers/${selectedProvider}/models`);
        const data = await response.json();
        if (!response.ok && !Array.isArray(data.models)) {
          throw new Error(data.error || 'Failed to load models');
        }
        const nextModels = Array.isArray(data.models) ? data.models : [];
        setModels(nextModels);
        setSelectedModel((current) => nextModels.some((model: ModelOption) => model.id === current) ? current : (nextModels[0]?.id || ''));
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
    () => messages.map((message) => message.role === 'assistant' ? buildStructuredReport(message.text) : null),
    [messages]
  );

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
    if (!queryText.trim() || loading) return;

    // Append user message
    const userMsg: Message = { role: 'user', text: queryText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);
    setJobStartedAt(Date.now());
    setJobStatus('Preparing waveform and project context...');
    const controller = new AbortController();
    const jobId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `ai-job-${Date.now()}`;
    activeRequestControllerRef.current = controller;
    setActiveJobId(jobId);

    try {
      const projectContext = await buildProjectContext(queryText);
      setJobStatus(`Sending request to ${selectedProvider} / ${selectedModel || 'default model'}...`);
      const response = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          jobId,
          provider: selectedProvider,
          signals,
          query: queryText,
          model: selectedModel,
          timeUnit,
          tickDuration,
          projectContext,
          projectPath,
          workspaceFileName
        })
      });

      const data = await response.json();
      setJobStatus('Receiving model response...');
      if (!response.ok) {
        throw new Error(data.error || 'Server error running simulation analysis');
      }

      const assistantMsg: Message = {
        role: 'assistant',
        text: data.analysis || 'Analysis finished with no return block.'
      };
      setMessages(prev => [...prev, assistantMsg]);
      setJobStatus('AI job finished.');
    } catch (err: any) {
      if (err?.name === 'AbortError' || String(err?.message || err).toLowerCase().includes('aborted')) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: '### AI Job Cancelled\n\nThe active AI request was stopped before completion. All tracked backend provider calls for this job were asked to abort.'
        }]);
        setJobStatus('AI job cancelled.');
        return;
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `### Simulation Error\n\nCould not compile timing diagram telemetry: ${err.message || err}`
      }]);
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
        await fetch(`/api/ai-jobs/${activeJobId}/cancel`, {
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
      const response = await fetch('/api/ai/test-generate', {
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

      const exact = data.passedExactMatch ? 'Exact match' : 'Non-exact reply';
      const preview = typeof data.responsePreview === 'string' && data.responsePreview.trim()
        ? ` Preview: ${data.responsePreview}`
        : '';
      setTestGenerateResult(
        `OK · ${data.speedScore} · ${data.durationMs} ms · ${exact}.${preview}`
      );
    } catch (error: any) {
      setTestGenerateResult(`Failed · ${error.message || String(error)}`);
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
    await handleSendMessage(promptToSend);
  };

  const PROMPT_SUGGESTIONS = [
    {
      label: 'Generate VHDL TB',
      icon: <FileCode size={11} />,
      prompt: ''
    },
    {
      label: 'Inspect Race Hazards',
      icon: <Bug size={11} />,
      prompt: 'Analyze these signal waveforms for theoretical propagation delays, hazard spikes, hold/setup timing violations, or asynchronous synchronization issues.'
    },
    {
      label: 'Protocol Decoder details',
      icon: <Layers size={11} />,
      prompt: 'Verify the signal transition intervals and decode the protocol sequences inside the waveform log. Highlight any byte transitions or framing structure.'
    }
  ];

  const selectedProviderInfo = providers.find((provider) => provider.id === selectedProvider);

  return (
    <div className="w-[360px] md:w-[420px] bg-brand-surface-low border-l border-brand-outline-variant/55 flex flex-col h-full z-20 select-none flex-none font-sans">
      
      {/* Drawer Header */}
      <div className="border-b border-brand-outline-variant/40 px-3 py-2 bg-brand-surface-lowest flex-none select-none space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Terminal size={14} className="text-brand-amber animate-pulse flex-none" />
            <span className="min-w-0 text-[12px] uppercase font-bold text-brand-on-surface tracking-wider leading-tight break-words">
              AI Co-Engineer Console
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-brand-surface-high text-slate-400 hover:text-white transition-all cursor-pointer flex-none"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex items-center gap-2 rounded bg-brand-surface-high px-2 py-1.5 border border-brand-outline-variant/30 min-w-0">
          <div className="flex items-center gap-1 flex-none">
            <Bot size={11} className="text-brand-cyan" />
            <span className="text-[9px] uppercase font-bold tracking-wide text-slate-400">LLM</span>
          </div>
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-1.5">
            <select
              value={selectedProvider}
              onChange={(event) => setSelectedProvider(event.target.value)}
              className="min-w-0 rounded bg-[#0b1326] px-2 py-1 text-[10px] font-mono text-slate-200 outline-none cursor-pointer"
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
              className="min-w-0 rounded bg-[#0b1326] px-2 py-1 text-[10px] font-mono text-brand-cyan outline-none cursor-pointer"
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
            className="rounded border border-brand-cyan/30 bg-brand-cyan/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-brand-cyan disabled:opacity-40 cursor-pointer"
          >
            {testGenerating ? 'Testing...' : 'Test Generate'}
          </button>
          {testGenerateResult && (
            <div className="min-w-0 flex-1 rounded border border-white/5 bg-[#060a12] px-2 py-1 text-[9px] font-mono text-slate-300">
              {testGenerateResult}
            </div>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 bg-brand-surface text-[11.5px] leading-relaxed">
        {(selectedProviderInfo || providerError) && (
          <div className="p-2 rounded border border-brand-outline-variant/20 bg-brand-surface-lowest text-[10px] font-mono text-slate-400">
            <div>Provider: <span className="text-brand-cyan">{selectedProviderInfo?.label || selectedProvider}</span></div>
            <div>Model: <span className="text-brand-cyan">{selectedModel || 'No model available'}</span></div>
            {selectedProviderInfo?.reason && <div>{selectedProviderInfo.reason}</div>}
            {providerError && <div className="text-rose-300">{providerError}</div>}
          </div>
        )}

        {(loading || jobStatus) && (
          <div className={`rounded border p-2 text-[10px] font-mono ${
            loading
              ? 'border-brand-amber/20 bg-brand-surface-lowest text-slate-300'
              : jobStatus?.startsWith('AI job failed')
                ? 'border-rose-500/30 bg-rose-950/30 text-rose-100'
                : 'border-brand-secondary/20 bg-brand-surface-lowest text-slate-300'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {loading ? <Loader2 size={12} className="animate-spin text-brand-amber" /> : <Check size={12} className="text-brand-secondary" />}
                <span>{jobStatus}</span>
              </div>
              {loading && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{jobElapsedSeconds}s</span>
                  <button
                    type="button"
                    onClick={() => void handleStopJob()}
                    className="rounded border border-red-400/60 bg-red-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-[0_0_18px_rgba(220,38,38,0.35)] cursor-pointer hover:bg-red-500"
                  >
                    Stop
                  </button>
                </div>
              )}
            </div>
            {loading && (
              <div className="mt-1 text-slate-500">
                The model can take a while on larger prompts or local providers. If this timer keeps climbing with no answer, the provider may be unavailable.
              </div>
            )}
          </div>
        )}

        {messages.map((m, idx) => (
          <div 
            key={idx} 
            className={`p-3 rounded-lg border relative group/msg transition-all ${
              m.role === 'user' 
                ? 'bg-[#1a253d] border-[#2c3d61] text-brand-on-surface ml-6' 
                : 'bg-brand-surface-lowest border-brand-outline-variant/20 text-brand-on-surface-variant mr-6'
            }`}
          >
            {/* Header role badge */}
            <div className="flex items-center justify-between mb-1.5 border-b border-white/5 pb-1">
              <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded leading-none flex items-center gap-1 ${
                m.role === 'user' ? 'bg-brand-cyan/10 text-brand-cyan' : 'bg-brand-amber/10 text-brand-amber'
              }`}>
                {m.role === 'user' ? <SlidersHorizontal size={8} /> : <Cpu size={8} />}
                {m.role === 'user' ? 'Operator' : 'CO-ENGINEER'}
              </span>

              {/* Copy button */}
              <button
                onClick={() => handleCopyText(m.text, idx)}
                className="opacity-0 group-hover/msg:opacity-100 p-0.5 text-slate-500 hover:text-slate-300 rounded cursor-pointer transition-all flex items-center gap-1 text-[8px]"
                title="Copy contents"
              >
                {copiedIndex === idx ? <Check size={10} className="text-brand-secondary" /> : <Copy size={10} />}
                <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {m.role === 'user' ? (
              <div className="whitespace-pre-wrap font-mono text-[10.5px] leading-relaxed space-y-2 select-text">
                {m.text.split('\n').map((line, i) => (
                  <p key={i} className="text-slate-300">{line}</p>
                ))}
              </div>
            ) : (
              <div className="space-y-3 select-text">
                {parsedMessages[idx]?.summary && (
                  <div className="rounded-lg border border-brand-cyan/20 bg-brand-cyan/8 px-3 py-2">
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-cyan">Executive Summary</div>
                    <p className="mt-1 text-[10.5px] leading-relaxed text-slate-200">{parsedMessages[idx]?.summary}</p>
                  </div>
                )}

                <div className="grid grid-cols-4 items-stretch gap-2">
                  <div className="flex h-full min-h-[88px] flex-col rounded-lg border border-white/5 bg-[#060a12] px-2.5 py-2">
                    <div className="text-[8px] uppercase tracking-[0.2em] text-slate-500">High Risk</div>
                    <div className="mt-auto pt-3 text-lg font-bold leading-none text-rose-200">{parsedMessages[idx]?.highCount ?? 0}</div>
                  </div>
                  <div className="flex h-full min-h-[88px] flex-col rounded-lg border border-white/5 bg-[#060a12] px-2.5 py-2">
                    <div className="text-[8px] uppercase tracking-[0.2em] text-slate-500">Medium</div>
                    <div className="mt-auto pt-3 text-lg font-bold leading-none text-amber-200">{parsedMessages[idx]?.mediumCount ?? 0}</div>
                  </div>
                  <div className="flex h-full min-h-[88px] flex-col rounded-lg border border-white/5 bg-[#060a12] px-2.5 py-2">
                    <div className="text-[8px] uppercase tracking-[0.2em] text-slate-500">Protocol Frames</div>
                    <div className="mt-auto pt-3 text-lg font-bold leading-none text-cyan-200">{parsedMessages[idx]?.protocolCount ?? 0}</div>
                  </div>
                  <div className="flex h-full min-h-[88px] flex-col rounded-lg border border-white/5 bg-[#060a12] px-2.5 py-2">
                    <div className="text-[8px] uppercase tracking-[0.2em] text-slate-500">Code Blocks</div>
                    <div className="mt-auto pt-3 text-lg font-bold leading-none text-emerald-200">{parsedMessages[idx]?.codeBlockCount ?? 0}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {(parsedMessages[idx]?.sections || []).map((section, sectionIndex) => (
                    <section
                      key={`${idx}-${section.title}-${sectionIndex}`}
                      className={`rounded-lg border px-3 py-2.5 ${getSectionAccent(section.title)}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-100">{section.title}</h3>
                        <span className="text-[8px] uppercase tracking-[0.18em] text-slate-500">
                          {section.bullets.length > 0 ? `${section.bullets.length} findings` : `${section.codeBlocks.length} code`}
                        </span>
                      </div>

                      {section.paragraphs.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {section.paragraphs.map((paragraph, paragraphIndex) => (
                            <p key={`${section.title}-p-${paragraphIndex}`} className="text-[10.5px] leading-relaxed text-slate-300">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      )}

                      {section.bullets.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {section.bullets.map((bullet, bulletIndex) => renderBullet(bullet, `${section.title}-b-${bulletIndex}`))}
                        </div>
                      )}

                      {section.codeBlocks.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {section.codeBlocks.map((codeBlock, codeIndex) => (
                            <div key={`${section.title}-c-${codeIndex}`} className="overflow-hidden rounded-lg border border-emerald-400/15 bg-[#050811]">
                              <div className="flex items-center justify-between border-b border-white/5 px-2.5 py-1.5">
                                <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-emerald-200">
                                  {codeBlock.language || 'code'}
                                </span>
                              </div>
                              <pre className="max-w-full overflow-x-auto px-2.5 py-2 text-[10px] leading-relaxed text-emerald-100">
                                <code>{codeBlock.content}</code>
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex items-center gap-2 text-brand-amber text-[10px] uppercase font-mono bg-brand-surface-lowest p-3 rounded-lg border border-brand-amber/10 justify-center">
            <Loader2 size={12} className="animate-spin text-brand-amber" />
            <span>AI model working... {jobElapsedSeconds}s</span>
          </div>
        )}
      </div>

      {/* Suggestion Chips */}
      <div className="p-2 border-t border-brand-outline-variant/30 bg-brand-surface-lowest flex-none shrink-0 text-[10px] space-y-1.5 select-none">
        <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wider px-1 inline-block">ENGINEERING MACROS:</span>
        <div className="flex flex-wrap gap-1">
          {PROMPT_SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (s.label === 'Generate VHDL TB') {
                  openTbComposer('project_entities');
                  return;
                }
                handleSendMessage(s.prompt);
              }}
              disabled={loading}
              className="px-2 py-1 bg-brand-surface-low hover:bg-brand-surface-high text-brand-on-surface border border-brand-outline-variant/30 rounded flex items-center gap-1 hover:border-brand-cyan/40 transition-all text-[9.5px] cursor-pointer"
            >
              {s.icon}
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {showTbComposer && (
          <div className="mt-2 rounded border border-brand-outline-variant/30 bg-[#060a12] p-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-brand-cyan">Generate VHDL TB</div>
              <button
                type="button"
                onClick={() => setShowTbComposer(false)}
                className="text-[9px] text-slate-400 hover:text-white cursor-pointer"
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
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase">
                  <ChevronRight size={10} />
                  <span>Use Project Entities</span>
                </div>
                <div className="mt-1 text-[9px] text-slate-400">
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
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase">
                  <ChevronRight size={10} />
                  <span>Reverse From Loaded VCD</span>
                </div>
                <div className="mt-1 text-[9px] text-slate-400">
                  Write a complete VHDL module and matching VHDL testbench that reproduce the loaded waveform behavior.
                </div>
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] uppercase font-bold tracking-wide text-slate-400">Editable Prompt</span>
                <button
                  type="button"
                  onClick={() => setTbPromptDraft(getTbPromptForMode(tbGenerationMode))}
                  className="text-[9px] text-brand-amber hover:text-yellow-300 cursor-pointer"
                >
                  Reset Default
                </button>
              </div>
              <textarea
                value={tbPromptDraft}
                onChange={(event) => setTbPromptDraft(event.target.value)}
                rows={9}
                className="w-full resize-y rounded border border-brand-outline-variant/40 bg-brand-surface px-2 py-2 text-[10px] font-mono text-slate-200 outline-none focus:border-brand-cyan"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTbComposer(false)}
                className="px-2 py-1 rounded border border-brand-outline-variant/30 bg-brand-surface-low text-[9px] font-bold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSubmitTbPrompt()}
                disabled={loading || !tbPromptDraft.trim()}
                className="px-2 py-1 rounded bg-brand-amber text-[9px] font-bold text-brand-surface-lowest disabled:opacity-40 cursor-pointer"
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
        className="p-3 border-t border-brand-outline-variant/50 bg-[#060b13] flex items-center gap-2 flex-none"
      >
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Ask AI hardware coder..."
          disabled={loading}
          className="flex-1 bg-brand-surface border border-brand-outline-variant/50 rounded px-3 py-1.5 text-brand-on-surface outline-none focus:border-brand-amber text-[11px] placeholder-slate-500 font-mono"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading || !selectedProvider || !selectedModel}
          className="p-2 rounded bg-brand-amber hover:bg-yellow-400 text-brand-surface-lowest font-bold transition-all disabled:opacity-30 cursor-pointer"
        >
          <Send size={12} />
        </button>
      </form>
    </div>
  );
};
