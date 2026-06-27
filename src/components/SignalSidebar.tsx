import React from 'react';
import { Signal } from '../types';
import { CircuitBoard, Plus } from 'lucide-react';

interface SignalSidebarProps {
  signals: Signal[];
  onShowSignal: (id: string) => void;
  onShowAllSignals: () => void;
}

export const SignalSidebar: React.FC<SignalSidebarProps> = ({
  signals,
  onShowSignal,
  onShowAllSignals,
}) => {
  const hiddenSignals = signals.filter((signal) => !signal.visible);
  const visibleCount = signals.length - hiddenSignals.length;

  return (
    <div className="w-[240px] border-r border-brand-outline-variant/40 bg-brand-surface-lowest flex flex-col h-full select-none z-10 flex-none font-sans">
      <div className="h-8 border-b border-brand-outline-variant/40 px-3 flex items-center justify-between bg-brand-surface-low flex-none">
        <div className="flex items-center gap-1.5">
          <CircuitBoard size={13} className="text-brand-cyan" />
          <span className="text-[12px] uppercase tracking-wider font-semibold text-brand-on-surface">Signal Manager</span>
        </div>
        <span className="text-[12px] font-mono text-slate-400">{hiddenSignals.length} hidden</span>
      </div>

      <div className="h-7 border-b border-brand-outline-variant/40 bg-brand-surface-container/70 flex items-center justify-between px-3 text-[12px] font-mono text-slate-400 shrink-0">
        <span>Visible: <strong className="text-brand-cyan">{visibleCount}</strong></span>
        <div className="flex items-center gap-2">
          <span>Available: <strong className="text-slate-300">{hiddenSignals.length}</strong></span>
          {hiddenSignals.length > 0 && (
            <button
              onClick={onShowAllSignals}
              className="px-2 py-0.5 rounded bg-brand-surface-high hover:bg-brand-surface-bright border border-brand-outline-variant/30 text-[12px] font-bold text-brand-cyan uppercase cursor-pointer"
              title="Show all hidden signals"
            >
              Add All
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-brand-surface-lowest">
        {hiddenSignals.length === 0 ? (
          <div className="p-8 text-center text-brand-on-surface-variant text-[12px] space-y-2">
            <p className="text-brand-cyan font-medium">All VCD Signals Are Visible</p>
            <p>Hide any signal from the waveform view to bring it back here for re-adding.</p>
          </div>
        ) : (
          hiddenSignals.map((signal) => (
            <div
              key={signal.id}
              className="h-8 px-2.5 flex items-center justify-between gap-2 shadow-[inset_0_-1px_0_rgba(148,163,184,0.12)] hover:bg-brand-surface-low/20"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-1.5 h-2.5 rounded flex-none" style={{ backgroundColor: signal.color }} />
                <span className="font-mono text-[12px] font-bold text-slate-100 truncate">{signal.name}</span>
              </div>
              <button
                onClick={() => onShowSignal(signal.id)}
                className="px-1.5 py-0.5 rounded bg-brand-surface-high hover:bg-brand-surface-bright border border-brand-outline-variant/30 text-[12px] font-bold text-brand-cyan uppercase flex items-center gap-1 cursor-pointer"
                title="Show signal in waveform view"
              >
                <Plus size={10} />
                <span>Show</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
