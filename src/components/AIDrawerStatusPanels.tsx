import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { apiFetch } from '../api';
import type { ProviderOption } from '../types';
import type { PendingRemoteExportPreview } from './useAIDrawerAnalysis';

const renderTelemetryValue = (
  value: number | null,
  options?: {
    suffix?: string;
    loading?: boolean;
  }
) => {
  if (value === null) {
    if (options?.loading) {
      return <span className="text-lime-300">Pending</span>;
    }
    return 'Unavailable';
  }
  return `${value}${options?.suffix || ''}`;
};

export const ProviderSummaryPanel: React.FC<{
  selectedProviderInfo?: ProviderOption;
  selectedProvider: string;
  selectedModel: string;
  selectedProviderDeployment: 'local' | 'remote';
  providerError: string | null;
}> = ({
  selectedProviderInfo,
  selectedProvider,
  selectedModel,
  selectedProviderDeployment,
  providerError,
}) => {
  if (!selectedProviderInfo && !providerError) {
    return null;
  }

  return (
    <div className="min-w-0 p-2 rounded border border-brand-outline-variant/20 bg-brand-surface-lowest text-[12px] font-mono text-slate-400">
      <div className="break-words">Provider: <span className="text-brand-cyan break-all">{selectedProviderInfo?.label || selectedProvider}</span></div>
      <div className="break-words">Model: <span className="text-brand-cyan break-all">{selectedModel || 'No model available'}</span></div>
      <div className="break-words">Deployment: <span className={selectedProviderDeployment === 'remote' ? 'text-amber-200' : 'text-emerald-200'}>{selectedProviderDeployment}</span></div>
      {selectedProviderInfo?.reason && <div className="break-words">{selectedProviderInfo.reason}</div>}
      {providerError && <div className="break-words text-rose-300">{providerError}</div>}
    </div>
  );
};

export const RemoteConsentPanel: React.FC<{
  selectedProvider: string;
  hasRemoteExportConsent: boolean;
  onConsentUpdated: (consents: Record<string, boolean>) => void;
  onError: (message: string | null) => void;
}> = ({
  selectedProvider,
  hasRemoteExportConsent,
  onConsentUpdated,
  onError,
}) => (
  <div className="rounded border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[12px] leading-relaxed text-amber-100">
    <label className="flex cursor-pointer items-start gap-2">
      <input
        type="checkbox"
        checked={hasRemoteExportConsent}
        onChange={async (event) => {
          const checked = event.target.checked;
          try {
            const response = await apiFetch('/api/ai/remote-export-consent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                provider: selectedProvider,
                allowed: checked,
              }),
            });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.error || 'Failed to update remote export consent');
            }
            const nextConsents = data?.consents && typeof data.consents === 'object' ? data.consents : {};
            onConsentUpdated(nextConsents);
            onError(null);
          } catch (error: any) {
            onError(error.message || String(error));
          }
        }}
        className="mt-0.5"
      />
      <span>
        Allow export of the explicit allowlisted AI payload to this remote provider. Every remote request now requires a per-request preview and approval before the exact payload leaves this machine.
      </span>
    </label>
  </div>
);

export const RemoteExportPreviewPanel: React.FC<{
  pendingRemoteExportPreview: PendingRemoteExportPreview;
  onCancel: () => void;
  onApprove: () => void;
}> = ({
  pendingRemoteExportPreview,
  onCancel,
  onApprove,
}) => (
  <div className="rounded border border-amber-300/30 bg-[#120f08] px-3 py-2.5 text-[12px] text-amber-50">
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-amber-200">Remote Export Preview</div>
        <div className="mt-1 text-[12px] leading-relaxed text-amber-100/90">
          Review the exact allowlisted payload that will be sent to <span className="font-bold">{pendingRemoteExportPreview.providerLabel}</span>.
        </div>
      </div>
      <div className="text-right text-[12px] font-mono text-amber-100/80">
        <div>{pendingRemoteExportPreview.preview.totalChars} chars</div>
        <div>schema v{pendingRemoteExportPreview.preview.schemaVersion}</div>
      </div>
    </div>

    {pendingRemoteExportPreview.preview.notes.length > 0 && (
      <div className="mt-2 rounded border border-amber-300/20 bg-black/20 px-2.5 py-2">
        <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-amber-200">Allowlist Notes</div>
        <div className="mt-1 space-y-1">
          {pendingRemoteExportPreview.preview.notes.map((note, index) => (
            <div key={`preview-note-${index}`} className="text-[12px] leading-relaxed text-amber-100/85">{note}</div>
          ))}
        </div>
      </div>
    )}

    <div className="mt-2 max-h-[260px] space-y-2 overflow-y-auto pr-1">
      {pendingRemoteExportPreview.preview.sections.map((section) => (
        <div key={section.id} className="rounded border border-white/8 bg-[#060a12] px-2.5 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-slate-100">{section.title}</div>
            <div className="text-[12px] font-mono text-slate-400">{section.charCount} chars</div>
          </div>
          <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-slate-300">{section.content}</pre>
        </div>
      ))}
    </div>

    <div className="mt-3 flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded border border-white/10 bg-[#060a12] px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-300 cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onApprove}
        className="rounded border border-amber-300/40 bg-amber-500/15 px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide text-amber-100 cursor-pointer"
      >
        Approve & Send
      </button>
    </div>
  </div>
);

export const JobTelemetryPanel: React.FC<{
  loading: boolean;
  jobElapsedSeconds: number;
  statusPanelText: string;
  statusPanelTone: string;
  statusPanelTelemetry: {
    engineLabel: string;
    jobInputTokens: number | null;
    latestAttemptInputTokens: number | null;
    inputTokens: number | null;
    sessionInputTokens: number | null;
    jobOutputTokens: number | null;
    outputTokens: number | null;
    sessionOutputTokens: number | null;
    tokensPerSecond: number | null;
    endToEndTokensPerSecond: number | null;
  };
  sessionInputDisplayValue: number | null;
  sessionOutputDisplayValue: number | null;
}> = ({
  loading,
  jobElapsedSeconds,
  statusPanelText,
  statusPanelTone,
  statusPanelTelemetry,
  sessionInputDisplayValue,
  sessionOutputDisplayValue,
}) => (
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
        <div className="mt-auto grid grid-cols-2 gap-2 pt-1.5">
          <div className="min-w-0 text-left">
            <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">OUT</div>
            <div className="pt-0.5 text-slate-200">{renderTelemetryValue(statusPanelTelemetry.tokensPerSecond, { loading })}</div>
          </div>
          <div className="min-w-0 text-right">
            <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">E2E</div>
            <div className="pt-0.5 text-slate-200">{renderTelemetryValue(statusPanelTelemetry.endToEndTokensPerSecond, { loading })}</div>
          </div>
        </div>
      </div>
      <div className="flex min-h-[64px] flex-col rounded border border-white/5 bg-[#060a12] px-2 py-1.5">
        <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Job IN Tokens</div>
        <div className="mt-auto pt-1.5 text-slate-200">
          {renderTelemetryValue(statusPanelTelemetry.jobInputTokens ?? statusPanelTelemetry.latestAttemptInputTokens ?? statusPanelTelemetry.inputTokens, { loading })}
        </div>
      </div>
      <div className="flex min-h-[64px] flex-col rounded border border-white/5 bg-[#060a12] px-2 py-1.5">
        <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Session IN Tokens</div>
        <div className="mt-auto pt-1.5 text-slate-200">{renderTelemetryValue(sessionInputDisplayValue, { loading })}</div>
      </div>
      <div className="flex min-h-[64px] flex-col rounded border border-white/5 bg-[#060a12] px-2 py-1.5">
        <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Job OUT Tokens</div>
        <div className="mt-auto pt-1.5 text-slate-200">{renderTelemetryValue(statusPanelTelemetry.jobOutputTokens ?? statusPanelTelemetry.outputTokens, { loading })}</div>
      </div>
      <div className="flex min-h-[64px] flex-col rounded border border-white/5 bg-[#060a12] px-2 py-1.5">
        <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Session OUT Tokens</div>
        <div className="mt-auto pt-1.5 text-slate-200">{renderTelemetryValue(sessionOutputDisplayValue, { loading })}</div>
      </div>
    </div>
  </div>
);
