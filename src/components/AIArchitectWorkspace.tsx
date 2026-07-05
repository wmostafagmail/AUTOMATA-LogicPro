import React, { useEffect, useMemo, useState } from 'react';
import { Save, Send, Check, Loader2, FileCode2, FileText } from 'lucide-react';
import type { AIWorkspaceReport } from '../aiReport';
import { apiFetch } from '../api';
import { VhdlCodeEditor } from './VhdlCodeEditor';

const AI_PROVIDER_STORAGE_KEY = 'automata-logicpro-ai-provider';
const AI_MODEL_STORAGE_KEY = 'automata-logicpro-ai-models';

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

type ArchitectChatMessage = {
  role: 'user' | 'assistant';
  text: string;
};

export const AIArchitectWorkspace: React.FC<{
  report: AIWorkspaceReport;
}> = ({ report }) => {
  const architectProject = report.meta.architectProject;
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savedFlags, setSavedFlags] = useState<Record<string, boolean>>({});
  const [savingPath, setSavingPath] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ArchitectChatMessage[]>([]);
  const [chatBusy, setChatBusy] = useState(false);

  const files = architectProject?.files || [];

  useEffect(() => {
    if (!architectProject) return;
    setSelectedPath((current) => current && files.some((file) => file.path === current)
      ? current
      : files.find((file) => file.path.endsWith('.vhd') || file.path.endsWith('.vhdl'))?.path || files[0]?.path || ''
    );
    setDrafts(Object.fromEntries(files.map((file) => [file.path, file.content])));
    setSavedFlags({});
    setChatMessages([]);
    setChatInput('');
  }, [architectProject]);

  const selectedFile = useMemo(
    () => files.find((file) => file.path === selectedPath) || null,
    [files, selectedPath]
  );

  const selectedDraft = selectedFile ? (drafts[selectedFile.path] ?? selectedFile.content) : '';
  const isVhdlFile = Boolean(selectedFile?.path.match(/\.vhd[l]?$/i));
  const selectedProvider = typeof window !== 'undefined'
    ? (window.localStorage.getItem(AI_PROVIDER_STORAGE_KEY) || 'ollama')
    : 'ollama';

  const storedModelMap = loadStoredModelSelections();
  const selectedModel = typeof storedModelMap?.[selectedProvider] === 'string' ? storedModelMap[selectedProvider] : '';

  if (!architectProject) {
    return null;
  }

  const handleSaveCurrent = async () => {
    if (!selectedFile) return;
    setSavingPath(selectedFile.path);
    try {
      await apiFetch('/api/project/write-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: selectedFile.savedPath || selectedFile.path,
          content: drafts[selectedFile.path] ?? selectedFile.content,
        }),
      }).then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to save the edited file.');
        }
      });
      setSavedFlags((current) => ({ ...current, [selectedFile.path]: true }));
      window.setTimeout(() => {
        setSavedFlags((current) => ({ ...current, [selectedFile.path]: false }));
      }, 1500);
    } catch (error: any) {
      setChatMessages((current) => [...current, {
        role: 'assistant',
        text: `Save failed: ${error?.message || String(error)}`,
      }]);
    } finally {
      setSavingPath(null);
    }
  };

  const handleSendChat = async () => {
    if (!selectedFile || !chatInput.trim() || chatBusy) return;
    const question = chatInput.trim();
    setChatMessages((current) => [...current, { role: 'user', text: question }]);
    setChatInput('');
    setChatBusy(true);
    try {
      const response = await apiFetch('/api/ai/code-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          model: selectedModel,
          question,
          filePath: selectedFile.path,
          fileContent: drafts[selectedFile.path] ?? selectedFile.content,
          projectPath: architectProject.outputDirectory,
          projectSummary: architectProject.summary,
          filePaths: files.map((file) => file.path),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Code chat failed.');
      }
      setChatMessages((current) => [...current, {
        role: 'assistant',
        text: typeof data?.answer === 'string' ? data.answer : 'No response returned from the model.',
      }]);
    } catch (error: any) {
      setChatMessages((current) => [...current, {
        role: 'assistant',
        text: `Chat failed: ${error?.message || String(error)}`,
      }]);
    } finally {
      setChatBusy(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 gap-3">
      <aside className="flex w-[260px] flex-none flex-col overflow-hidden rounded-lg border border-brand-outline-variant/25 bg-[#09111f]">
        <div className="border-b border-brand-outline-variant/25 px-3 py-2">
          <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-brand-cyan">Architect Files</div>
          <div className="mt-1 text-[12px] text-slate-400">{architectProject.projectName}</div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2 space-y-1.5">
          {files.map((file) => {
            const active = file.path === selectedPath;
            return (
              <button
                key={file.path}
                type="button"
                onClick={() => setSelectedPath(file.path)}
                className={`w-full rounded border px-2.5 py-2 text-left cursor-pointer ${
                  active
                    ? 'border-brand-cyan/40 bg-brand-cyan/10'
                    : 'border-white/5 bg-[#060a12]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {file.path.match(/\.vhd[l]?$/i) ? <FileCode2 size={12} className="text-emerald-200" /> : <FileText size={12} className="text-slate-400" />}
                  <div className="truncate text-[12px] font-bold text-slate-100">{file.path.split('/').pop()}</div>
                </div>
                <div className="mt-1 break-all text-[12px] text-slate-400">{file.path}</div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-outline-variant/25 bg-[#09111f] px-3 py-2">
          <div className="min-w-0">
            <div className="truncate text-[12px] font-bold uppercase tracking-[0.18em] text-emerald-200">
              {selectedFile?.path || 'No file selected'}
            </div>
            <div className="text-[12px] text-slate-400">{selectedFile?.purpose || 'Select a generated file to inspect and edit.'}</div>
          </div>
          <button
            type="button"
            onClick={() => void handleSaveCurrent()}
            disabled={!selectedFile || savingPath === selectedFile.path}
            className="inline-flex items-center gap-1 rounded border border-emerald-400/35 bg-emerald-500/10 px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide text-emerald-200 disabled:opacity-40 cursor-pointer"
          >
            {savingPath === selectedFile?.path ? <Loader2 size={12} className="animate-spin" /> : savedFlags[selectedFile?.path || ''] ? <Check size={12} /> : <Save size={12} />}
            <span>{savedFlags[selectedFile?.path || ''] ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        <div className="min-h-0 flex-1">
          {selectedFile ? (
            isVhdlFile ? (
              <VhdlCodeEditor
                value={selectedDraft}
                onChange={(value) => setDrafts((current) => ({ ...current, [selectedFile.path]: value }))}
              />
            ) : (
              <textarea
                value={selectedDraft}
                spellCheck={false}
                onChange={(event) => setDrafts((current) => ({ ...current, [selectedFile.path]: event.target.value }))}
                className="h-full w-full resize-none rounded-lg border border-brand-outline-variant/25 bg-[#050811] px-4 py-3 font-mono text-[12px] leading-6 text-slate-200 outline-none"
              />
            )
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-brand-outline-variant/25 bg-[#050811] text-[12px] text-slate-500">
              No generated file selected.
            </div>
          )}
        </div>
      </section>

      <aside className="flex w-[340px] flex-none flex-col overflow-hidden rounded-lg border border-brand-outline-variant/25 bg-[#09111f]">
        <div className="border-b border-brand-outline-variant/25 px-3 py-2">
          <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-brand-amber">Chat About Code</div>
          <div className="mt-1 text-[12px] text-slate-400">Ask the LLM about the selected file, architecture, or next edits.</div>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {chatMessages.length === 0 && (
            <div className="rounded border border-white/5 bg-[#060a12] px-3 py-2 text-[12px] text-slate-400">
              This code chat uses the current AI provider/model and the selected file content.
            </div>
          )}
          {chatMessages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded border px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap ${
                message.role === 'user'
                  ? 'border-brand-cyan/25 bg-brand-cyan/8 text-slate-200'
                  : 'border-brand-outline-variant/20 bg-[#060a12] text-slate-300'
              }`}
            >
              {message.text}
            </div>
          ))}
          {chatBusy && (
            <div className="flex items-center gap-2 rounded border border-brand-amber/25 bg-brand-amber/10 px-3 py-2 text-[12px] text-brand-amber">
              <Loader2 size={12} className="animate-spin" />
              <span>Thinking about the code...</span>
            </div>
          )}
        </div>
        <div className="border-t border-brand-outline-variant/25 p-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSendChat();
            }}
            className="flex items-center gap-2"
          >
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ask about this VHDL project..."
              className="flex-1 rounded border border-brand-outline-variant/30 bg-[#060a12] px-3 py-2 text-[12px] text-slate-200 outline-none"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatBusy || !selectedModel}
              className="rounded bg-brand-amber px-3 py-2 text-[12px] font-bold text-brand-surface-lowest disabled:opacity-40 cursor-pointer"
            >
              <Send size={12} />
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
};
