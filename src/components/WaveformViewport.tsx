import React, { useMemo, useRef, useState } from 'react';
import { Signal } from '../types';
import { WaveformRow } from './WaveformRow';
import { EyeOff } from 'lucide-react';

interface WaveformViewportProps {
  signals: Signal[];
  length: number;
  zoom: number;
  tickWidth: number;
  timeUnit: 'ns' | 'us' | 'ms' | 's';
  tickDuration: number;
  cursorA: number | null;
  cursorB: number | null;
  setCursorA: (tick: number | null) => void;
  setCursorB: (tick: number | null) => void;
  onUpdateSignalValues: (id: string, values: (number | string)[]) => void;
  onToggleSignalVisibility: (id: string) => void;
}

const LABEL_WIDTH = 240;
const ROW_HEIGHT = 26;

export const WaveformViewport: React.FC<WaveformViewportProps> = ({
  signals,
  length,
  zoom,
  tickWidth,
  timeUnit,
  tickDuration,
  cursorA,
  cursorB,
  setCursorA,
  setCursorB,
  onUpdateSignalValues,
  onToggleSignalVisibility,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rowViewportRef = useRef<HTMLDivElement>(null);
  const [hoveredTick, setHoveredTick] = useState<number | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [draggingCursor, setDraggingCursor] = useState<'A' | 'B' | null>(null);

  const visibleSignals = useMemo(() => signals.filter((signal) => signal.visible), [signals]);
  const waveWidth = length * tickWidth;
  const totalRowsHeight = visibleSignals.length * ROW_HEIGHT;

  const formatTime = (tick: number): string => `${(tick * tickDuration).toFixed(0)} ${timeUnit}`;

  const getTickFromClientX = (clientX: number): number => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current.scrollLeft;
    const relativeX = clientX - rect.left + scrollLeft;
    return Math.max(0, Math.min(length - 1, Math.floor(relativeX / tickWidth)));
  };

  const handleWaveformWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!rowViewportRef.current) return;
    const maxScroll = Math.max(0, totalRowsHeight - rowViewportRef.current.clientHeight);
    if (maxScroll <= 0) return;

    event.preventDefault();
    setScrollTop((current) => Math.max(0, Math.min(maxScroll, current + event.deltaY)));
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current.scrollLeft;
    const clickX = event.clientX - rect.left + scrollLeft;
    const tickAX = cursorA !== null ? cursorA * tickWidth : -999;
    const tickBX = cursorB !== null ? cursorB * tickWidth : -999;
    const grabBuffer = 12;

    if (Math.abs(clickX - tickAX) < grabBuffer) {
      setDraggingCursor('A');
      event.currentTarget.setPointerCapture(event.pointerId);
    } else if (Math.abs(clickX - tickBX) < grabBuffer) {
      setDraggingCursor('B');
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    const tick = getTickFromClientX(event.clientX);
    if (draggingCursor) {
      if (draggingCursor === 'A') setCursorA(tick);
      else setCursorB(tick);
      return;
    }
    setHoveredTick(tick);
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (draggingCursor) {
      setDraggingCursor(null);
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleRulerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const tick = getTickFromClientX(event.clientX);
    if (event.shiftKey || cursorA !== null) setCursorB(tick);
    else setCursorA(tick);
  };

  return (
    <div className="h-full min-h-0 w-full flex flex-col bg-brand-surface overflow-hidden relative font-sans select-none">
      <div className="h-8 border-b border-brand-outline-variant/40 bg-brand-surface-container/70 flex items-center justify-between px-4 text-xs font-mono text-slate-300 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan inline-block"></span>
            <span>Cursor A: <strong className="text-brand-cyan">{cursorA !== null ? formatTime(cursorA) : 'Unset'}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-amber inline-block"></span>
            <span>Cursor B: <strong className="text-brand-amber">{cursorB !== null ? formatTime(cursorB) : 'Unset'}</strong></span>
          </div>
        </div>

        {cursorA !== null && cursorB !== null && (
          <div className="flex items-center gap-6 bg-brand-surface-low border border-brand-outline-variant/30 px-3 py-1 rounded select-all font-bold">
            <div className="text-[11px] text-slate-300">
              <span>Δt = </span>
              <span className="text-brand-cyan">{Math.abs(cursorA - cursorB) * tickDuration} {timeUnit}</span>
            </div>
            <div className="text-[11px] text-brand-secondary">
              <span>Freq = </span>
              <span>
                {(() => {
                  const deltaSeconds = Math.abs(cursorA - cursorB) * tickDuration * (
                    timeUnit === 'ns' ? 1e-9 :
                    timeUnit === 'us' ? 1e-6 :
                    timeUnit === 'ms' ? 1e-3 : 1
                  );
                  if (deltaSeconds === 0) return '∞';
                  const hz = 1 / deltaSeconds;
                  if (hz >= 1e9) return `${(hz / 1e9).toFixed(2)} GHz`;
                  if (hz >= 1e6) return `${(hz / 1e6).toFixed(2)} MHz`;
                  if (hz >= 1e3) return `${(hz / 1e3).toFixed(2)} kHz`;
                  return `${hz.toFixed(2)} Hz`;
                })()}
              </span>
            </div>
          </div>
        )}

        <div className="text-[10px] text-slate-500 italic hidden sm:block">
          Hide signals from the row eye icon to send them back to Signal Manager.
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="w-[260px] flex-none border-r border-brand-outline-variant/40 bg-[#0c1322] flex flex-col min-h-0">
          <div className="h-8 border-b border-brand-outline-variant/40 bg-brand-surface-low flex items-center px-3">
            <span className="text-[11px] font-bold uppercase tracking-wide text-brand-cyan">Signals</span>
          </div>
          <div
            ref={rowViewportRef}
            className="flex-1 relative overflow-hidden bg-[#06080e] min-h-0"
            onWheel={handleWaveformWheel}
          >
            {visibleSignals.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[12px] font-mono text-slate-500">
                No visible signals. Re-add hidden ones from Signal Manager.
              </div>
            ) : (
              <div
                className="absolute inset-x-0 top-0"
                style={{
                  height: totalRowsHeight,
                  transform: `translateY(-${scrollTop}px)`,
                  willChange: 'transform',
                }}
              >
                <div className="relative flex flex-col" style={{ height: totalRowsHeight }}>
                  {visibleSignals.map((signal) => {
                    const value = hoveredTick === null ? '—' : (() => {
                      const hoveredValue = signal.values[hoveredTick];
                      if (hoveredValue === undefined || hoveredValue === '') return '—';
                      if (signal.type === 'wire' || signal.type === 'clock' || signal.type === 'gate') {
                        if (hoveredValue === 1) return 'H (1)';
                        if (hoveredValue === 0) return 'L (0)';
                        if (hoveredValue === -1) return 'Hi-Z';
                      }
                      if (typeof hoveredValue !== 'string') return String(hoveredValue);
                      if (signal.format === 'hex' && /^[01XZ]+$/i.test(hoveredValue)) {
                        if (/[XZ]/i.test(hoveredValue)) return `0x${hoveredValue}`;
                        const width = Math.max(1, Math.ceil(hoveredValue.length / 4));
                        return `0x${parseInt(hoveredValue, 2).toString(16).toUpperCase().padStart(width, '0')}`;
                      }
                      return hoveredValue;
                    })();

                    return (
                      <div
                        key={signal.id}
                        className="relative border-b border-brand-outline-variant/30 bg-[#070b14] flex-none transition-all flex items-center justify-between px-2 gap-2"
                        style={{ height: ROW_HEIGHT }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-1.5 h-2.5 rounded flex-none" style={{ backgroundColor: signal.color }} />
                          <span className="font-mono text-[10px] font-bold text-slate-100 truncate">{signal.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-none">
                          <span
                            className="font-mono text-[9px] uppercase min-w-[42px] text-right"
                            style={{ color: signal.color }}
                          >
                            {value}
                          </span>
                          <button
                            onClick={() => onToggleSignalVisibility(signal.id)}
                            className="p-0.5 rounded hover:bg-brand-surface-bright/50 hover:text-brand-cyan text-brand-on-surface-variant transition-all cursor-pointer"
                            title="Hide signal"
                          >
                            <EyeOff size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div ref={containerRef} className="flex-1 overflow-x-auto overflow-y-hidden relative min-h-0">
          <div style={{ width: waveWidth }} className="min-h-full flex flex-col">
            <div className="h-8 border-b border-brand-outline-variant/40 bg-brand-surface-low flex-none relative">
              <div
                onClick={handleRulerClick}
                className="absolute inset-0 cursor-col-resize"
              >
                <svg width={waveWidth} height={32} className="block select-none">
                  {Array.from({ length }).map((_, tick) => {
                    const x = tick * tickWidth;
                    const isMajor = tick % 10 === 0;
                    const isMedium = tick % 5 === 0;
                    return (
                      <g key={`ruler-tick-${tick}`}>
                        <line
                          x1={x}
                          y1={isMajor ? 10 : (isMedium ? 16 : 20)}
                          x2={x}
                          y2={32}
                          stroke={isMajor ? '#475569' : '#334155'}
                          strokeWidth={isMajor ? 1 : 0.6}
                        />
                        {isMajor && (
                          <text x={x + 3} y={9} fill="#94a3b8" className="font-mono text-[8px] font-medium">
                            {formatTime(tick)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            <div
              className="flex-1 relative overflow-hidden bg-[#06080e] min-h-0"
              onWheel={handleWaveformWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={() => setHoveredTick(null)}
            >
              {visibleSignals.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[12px] font-mono text-slate-500">
                  No visible signals. Re-add hidden ones from Signal Manager.
                </div>
              ) : (
                <div
                  className="absolute inset-x-0 top-0"
                  style={{
                    height: totalRowsHeight,
                    transform: `translateY(-${scrollTop}px)`,
                    willChange: 'transform',
                  }}
                >
                  <svg
                    width={waveWidth}
                    height={totalRowsHeight}
                    className="absolute top-0 pointer-events-none stroke-brand-outline-variant/10"
                    strokeWidth={0.5}
                  >
                    {Array.from({ length: Math.ceil(length / 10) }).map((_, idx) => (
                      <line
                        key={`v-grid-${idx}`}
                        x1={idx * 10 * tickWidth}
                        y1={0}
                        x2={idx * 10 * tickWidth}
                        y2={totalRowsHeight}
                        strokeDasharray="2,4"
                      />
                    ))}
                  </svg>

                  <div className="relative flex flex-col" style={{ height: totalRowsHeight }}>
                    {visibleSignals.map((signal) => (
                      <WaveformRow
                        key={signal.id}
                        signal={signal}
                        length={length}
                        zoom={zoom}
                        tickWidth={tickWidth}
                        hoveredTick={hoveredTick}
                        onSetValues={(newValues) => onUpdateSignalValues(signal.id, newValues)}
                        onGridClick={() => {}}
                      />
                    ))}
                  </div>

                  <svg
                    width={waveWidth}
                    height={totalRowsHeight}
                    className="absolute top-0 pointer-events-none"
                  >
                    {cursorA !== null && (
                      <g>
                        <line x1={cursorA * tickWidth} y1={0} x2={cursorA * tickWidth} y2={totalRowsHeight} stroke="#00e5ff" strokeWidth={1.5} strokeDasharray="4,4" />
                        <rect x={cursorA * tickWidth - 7} y={0} width={14} height={16} fill="#00e5ff" rx={2} />
                        <text x={cursorA * tickWidth} y={12} textAnchor="middle" fill="#0b1326" className="font-sans font-extrabold text-[10px]">A</text>
                      </g>
                    )}
                    {cursorB !== null && (
                      <g>
                        <line x1={cursorB * tickWidth} y1={0} x2={cursorB * tickWidth} y2={totalRowsHeight} stroke="#ffb95f" strokeWidth={1.5} strokeDasharray="4,4" />
                        <rect x={cursorB * tickWidth - 7} y={0} width={14} height={16} fill="#ffb95f" rx={2} />
                        <text x={cursorB * tickWidth} y={12} textAnchor="middle" fill="#0b1326" className="font-sans font-extrabold text-[10px]">B</text>
                      </g>
                    )}
                    {hoveredTick !== null && (
                      <line x1={hoveredTick * tickWidth} y1={0} x2={hoveredTick * tickWidth} y2={totalRowsHeight} stroke="#94a3b8" strokeWidth={1} strokeDasharray="2,6" />
                    )}
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
