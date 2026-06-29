import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Signal, WaveformIssueMarker } from '../types';
import { WaveformRow } from './WaveformRow';
import { ChevronLeft, ChevronRight, EyeOff } from 'lucide-react';

type MarkerFamily = 'hazard' | 'protocol' | 'clockReset' | 'fsm';

interface WaveformViewportProps {
  signals: Signal[];
  issueMarkers?: WaveformIssueMarker[];
  markerFamilyCounts?: Record<MarkerFamily, number>;
  markerFamilyVisibility?: Record<MarkerFamily, boolean>;
  activeIssueMarkerId?: string | null;
  issueFocusRequestKey?: number;
  onToggleMarkerFamily?: (family: MarkerFamily) => void;
  onSelectIssueMarker?: (markerId: string) => void;
  length: number;
  zoom: number;
  tickWidth: number;
  glitchInjectionEnabled: boolean;
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
const ISSUE_OVERVIEW_HEIGHT = 22;
const MARKER_FAMILY_META: Array<{
  family: MarkerFamily;
  label: string;
  color: string;
  enabledClasses: string;
}> = [
  {
    family: 'hazard',
    label: 'Hazard',
    color: '#f87171',
    enabledClasses: 'border-rose-400/35 bg-rose-500/10 text-rose-100',
  },
  {
    family: 'protocol',
    label: 'Protocol',
    color: '#22d3ee',
    enabledClasses: 'border-cyan-400/35 bg-cyan-500/10 text-cyan-100',
  },
  {
    family: 'clockReset',
    label: 'Clock/Reset',
    color: '#4ade80',
    enabledClasses: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100',
  },
  {
    family: 'fsm',
    label: 'FSM',
    color: '#a855f7',
    enabledClasses: 'border-violet-400/35 bg-violet-500/10 text-violet-100',
  },
];

export const WaveformViewport: React.FC<WaveformViewportProps> = ({
  signals,
  issueMarkers = [],
  markerFamilyCounts,
  markerFamilyVisibility,
  activeIssueMarkerId = null,
  issueFocusRequestKey = 0,
  onToggleMarkerFamily,
  onSelectIssueMarker,
  length,
  zoom,
  tickWidth,
  glitchInjectionEnabled,
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
  const [scrollLeft, setScrollLeft] = useState(0);
  const [draggingCursor, setDraggingCursor] = useState<'A' | 'B' | null>(null);
  const [hoveredIssueMarkerId, setHoveredIssueMarkerId] = useState<string | null>(null);
  const [issueTooltip, setIssueTooltip] = useState<{
    markerId: string;
    clientX: number;
    clientY: number;
  } | null>(null);

  const visibleSignals = useMemo(() => signals.filter((signal) => signal.visible), [signals]);
  const waveWidth = length * tickWidth;
  const totalRowsHeight = visibleSignals.length * ROW_HEIGHT;
  const normalizedVisibleSignalRows = useMemo(() => {
    const normalizeSignalKey = (value: string) => value.trim().toLowerCase();
    return new Map(
      visibleSignals.map((signal, index) => [normalizeSignalKey(signal.name || signal.id), index] as const)
    );
  }, [visibleSignals]);
  const resolvedIssueMarkers = useMemo(() => {
    const normalizeSignalKey = (value: string) => value.trim().toLowerCase();
    return issueMarkers
      .map((marker) => {
        const startTick = marker.startTick ?? marker.relatedTicks[0] ?? null;
        const endTick = marker.endTick ?? startTick;
        if (startTick === null || endTick === null) {
          return null;
        }

        const rowIndexes = Array.from(new Set(
          marker.signalNames
            .map((signalName) => normalizedVisibleSignalRows.get(normalizeSignalKey(signalName)))
            .filter((rowIndex): rowIndex is number => typeof rowIndex === 'number')
        ));

        return {
          ...marker,
          startTick: Math.max(0, Math.min(length - 1, startTick)),
          endTick: Math.max(0, Math.min(length - 1, endTick)),
          rowIndexes,
        };
      })
      .filter((marker): marker is NonNullable<typeof marker> => Boolean(marker));
  }, [issueMarkers, length, normalizedVisibleSignalRows]);

  const hoveredIssueMarker = useMemo(
    () => resolvedIssueMarkers.find((marker) => marker.id === hoveredIssueMarkerId) || null,
    [hoveredIssueMarkerId, resolvedIssueMarkers]
  );
  const activeResolvedIssueMarker = useMemo(
    () => resolvedIssueMarkers.find((marker) => marker.id === activeIssueMarkerId) || null,
    [activeIssueMarkerId, resolvedIssueMarkers]
  );
  const activeResolvedIssueMarkerIndex = useMemo(
    () => resolvedIssueMarkers.findIndex((marker) => marker.id === activeIssueMarkerId),
    [activeIssueMarkerId, resolvedIssueMarkers]
  );
  const activeRowIndexes = useMemo(
    () => new Set(activeResolvedIssueMarker?.rowIndexes || []),
    [activeResolvedIssueMarker]
  );
  const activeMarkerTone = useMemo(() => {
    if (!activeResolvedIssueMarker) {
      return null;
    }
    if (activeResolvedIssueMarker.kind === 'protocol') {
      return {
        border: 'border-cyan-400/35',
        text: 'text-cyan-200',
        fill: 'rgba(34, 211, 238, 0.12)',
        glow: 'shadow-[0_0_0_1px_rgba(34,211,238,0.18)]',
      };
    }
    if (activeResolvedIssueMarker.kind === 'clockReset') {
      return {
        border: 'border-emerald-400/35',
        text: 'text-emerald-200',
        fill: 'rgba(74, 222, 128, 0.12)',
        glow: 'shadow-[0_0_0_1px_rgba(74,222,128,0.18)]',
      };
    }
    if (activeResolvedIssueMarker.kind === 'fsm') {
      return {
        border: 'border-violet-400/35',
        text: 'text-violet-200',
        fill: 'rgba(168, 85, 247, 0.12)',
        glow: 'shadow-[0_0_0_1px_rgba(168,85,247,0.18)]',
      };
    }
    if (activeResolvedIssueMarker.severity === 'high') {
      return {
        border: 'border-rose-400/35',
        text: 'text-rose-200',
        fill: 'rgba(248, 113, 113, 0.12)',
        glow: 'shadow-[0_0_0_1px_rgba(248,113,113,0.18)]',
      };
    }
    if (activeResolvedIssueMarker.severity === 'medium') {
      return {
        border: 'border-amber-400/35',
        text: 'text-amber-200',
        fill: 'rgba(251, 191, 36, 0.12)',
        glow: 'shadow-[0_0_0_1px_rgba(251,191,36,0.18)]',
      };
    }
    return {
      border: 'border-yellow-300/35',
      text: 'text-yellow-200',
      fill: 'rgba(253, 224, 71, 0.1)',
      glow: 'shadow-[0_0_0_1px_rgba(253,224,71,0.18)]',
    };
  }, [activeResolvedIssueMarker]);
  const visibleMarkerFamilies = useMemo(() => {
    if (!markerFamilyCounts || !markerFamilyVisibility || !onToggleMarkerFamily) {
      return [];
    }

    return MARKER_FAMILY_META
      .filter(({ family }) => (markerFamilyCounts[family] || 0) > 0)
      .map((entry) => ({
        ...entry,
        count: markerFamilyCounts[entry.family] || 0,
        enabled: markerFamilyVisibility[entry.family],
      }));
  }, [markerFamilyCounts, markerFamilyVisibility, onToggleMarkerFamily]);

  const overviewViewport = useMemo(() => {
    const viewportWidth = containerRef.current?.clientWidth ?? 0;
    if (waveWidth <= 0 || viewportWidth <= 0) {
      return { leftPercent: 0, widthPercent: 100 };
    }

    const leftPercent = Math.max(0, Math.min(100, (scrollLeft / waveWidth) * 100));
    const widthPercent = Math.max(4, Math.min(100, (viewportWidth / waveWidth) * 100));
    return { leftPercent, widthPercent };
  }, [scrollLeft, waveWidth]);

  const scrollToTick = (tick: number) => {
    if (!containerRef.current) {
      return;
    }
    const targetScrollLeft = Math.max(
      0,
      tick * tickWidth - containerRef.current.clientWidth / 2 + tickWidth / 2
    );
    containerRef.current.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (!activeIssueMarkerId || !containerRef.current) {
      return;
    }

    const activeMarker = resolvedIssueMarkers.find((marker) => marker.id === activeIssueMarkerId);
    if (!activeMarker) {
      return;
    }

    const focusTick = activeMarker.startTick ?? activeMarker.relatedTicks[0] ?? null;
    if (focusTick !== null) {
      scrollToTick(focusTick);
    }

    if (rowViewportRef.current && activeMarker.rowIndexes.length > 0) {
      const averageRow = activeMarker.rowIndexes.reduce((sum, rowIndex) => sum + rowIndex, 0) / activeMarker.rowIndexes.length;
      const targetScrollTop = Math.max(
        0,
        averageRow * ROW_HEIGHT - rowViewportRef.current.clientHeight / 2 + ROW_HEIGHT / 2
      );
      const maxScroll = Math.max(0, totalRowsHeight - rowViewportRef.current.clientHeight);
      setScrollTop(Math.max(0, Math.min(maxScroll, targetScrollTop)));
    }
  }, [activeIssueMarkerId, issueFocusRequestKey, resolvedIssueMarkers, tickWidth, totalRowsHeight]);

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

  const handleOverviewClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
    const tick = Math.max(0, Math.min(length - 1, Math.round(ratio * (length - 1))));
    scrollToTick(tick);
  };

  const formatIssueTickLabel = (marker: typeof resolvedIssueMarkers[number]) => {
    if (marker.startTick === marker.endTick) {
      return `tick ${marker.startTick}`;
    }
    return `ticks ${Math.min(marker.startTick, marker.endTick)}-${Math.max(marker.startTick, marker.endTick)}`;
  };
  const handleStepIssueMarker = (direction: 'previous' | 'next') => {
    if (resolvedIssueMarkers.length === 0 || !onSelectIssueMarker) {
      return;
    }

    const currentIndex = activeResolvedIssueMarkerIndex >= 0 ? activeResolvedIssueMarkerIndex : 0;
    const nextIndex = direction === 'next'
      ? (currentIndex + 1) % resolvedIssueMarkers.length
      : (currentIndex - 1 + resolvedIssueMarkers.length) % resolvedIssueMarkers.length;
    const nextMarker = resolvedIssueMarkers[nextIndex];
    if (nextMarker) {
      onSelectIssueMarker(nextMarker.id);
    }
  };
  const handleViewportKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (resolvedIssueMarkers.length <= 1) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const isEditable = target
      ? target.tagName === 'INPUT'
        || target.tagName === 'TEXTAREA'
        || target.tagName === 'SELECT'
        || target.isContentEditable
      : false;

    if (isEditable) {
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === '[') {
      event.preventDefault();
      handleStepIssueMarker('previous');
      return;
    }

    if (event.key === 'ArrowRight' || event.key === ']') {
      event.preventDefault();
      handleStepIssueMarker('next');
    }
  };

  return (
    <div
      className="h-full min-h-0 w-full flex flex-col bg-brand-surface overflow-hidden relative font-sans select-none focus:outline-none"
      tabIndex={0}
      onKeyDown={handleViewportKeyDown}
    >
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
            <div className="text-[12px] text-slate-300">
              <span>Δt = </span>
              <span className="text-brand-cyan">{Math.abs(cursorA - cursorB) * tickDuration} {timeUnit}</span>
            </div>
            <div className="text-[12px] text-brand-secondary">
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

        <div className="text-[12px] text-slate-500 italic hidden sm:block">
          Hide signals from the row eye icon to send them back to Signal Manager.
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="w-[260px] flex-none border-r border-brand-outline-variant/40 bg-[#0c1322] flex flex-col min-h-0">
          <div className="h-8 border-b border-brand-outline-variant/40 bg-brand-surface-low flex items-center px-3">
            <span className="text-[12px] font-bold uppercase tracking-wide text-brand-cyan">Signals</span>
          </div>
          <div className="h-[22px] border-b border-brand-outline-variant/30 bg-[#09101b] flex items-center justify-between px-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Issue Map</span>
            <span className="text-[11px] font-mono text-slate-500">
              {resolvedIssueMarkers.length} marker{resolvedIssueMarkers.length === 1 ? '' : 's'}
            </span>
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
                  {visibleSignals.map((signal, index) => {
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
                        className={`relative border-b flex-none transition-all flex items-center justify-between px-2 gap-2 ${
                          activeRowIndexes.has(index)
                            ? 'border-brand-cyan/35 bg-[#0a1424]'
                            : 'border-brand-outline-variant/30 bg-[#070b14]'
                        }`}
                        style={{ height: ROW_HEIGHT }}
                      >
                        {activeRowIndexes.has(index) && (
                          <div className="absolute inset-y-0 left-0 w-1 rounded-r bg-brand-cyan/80" />
                        )}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-1.5 h-2.5 rounded flex-none" style={{ backgroundColor: signal.color }} />
                          <span className={`font-mono text-[12px] font-bold truncate ${activeRowIndexes.has(index) ? 'text-white' : 'text-slate-100'}`}>{signal.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-none">
                          <span
                            className="font-mono text-[12px] uppercase min-w-[42px] text-right"
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

        <div
          ref={containerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden relative min-h-0"
          onScroll={(event) => setScrollLeft(event.currentTarget.scrollLeft)}
        >
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
                          <text x={x + 3} y={9} fill="#94a3b8" className="font-mono text-[12px] font-medium">
                            {formatTime(tick)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            <div className="h-[22px] border-b border-brand-outline-variant/30 bg-[#09101b] flex-none px-2 py-1">
              <div className="flex h-full items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div
                    className="relative h-full w-full rounded border border-brand-outline-variant/30 bg-[#060a12] cursor-pointer overflow-hidden"
                    onClick={handleOverviewClick}
                    title="Timeline issue map"
                  >
                    <div
                      className="absolute inset-y-0 rounded border border-brand-cyan/35 bg-brand-cyan/10"
                      style={{
                        left: `${overviewViewport.leftPercent}%`,
                        width: `${overviewViewport.widthPercent}%`,
                      }}
                    />
                    {resolvedIssueMarkers.map((marker) => {
                      const startTick = Math.min(marker.startTick, marker.endTick);
                      const endTick = Math.max(marker.startTick, marker.endTick);
                      const leftPercent = ((startTick / Math.max(1, length - 1)) * 100);
                      const widthPercent = Math.max(0.35, (((endTick - startTick + 1) / Math.max(1, length)) * 100));
                      const color = marker.kind === 'protocol'
                        ? '#22d3ee'
                        : marker.kind === 'clockReset'
                          ? '#4ade80'
                          : marker.kind === 'fsm'
                            ? '#a855f7'
                        : marker.severity === 'high'
                          ? '#f87171'
                          : marker.severity === 'medium'
                            ? '#fbbf24'
                            : '#fde047';
                      const isActive = marker.id === activeIssueMarkerId;
                      return (
                        <button
                          key={`overview-${marker.id}`}
                          type="button"
                          className="absolute inset-y-[2px] rounded-sm cursor-pointer"
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            backgroundColor: color,
                            opacity: isActive ? 1 : 0.85,
                            boxShadow: isActive ? `0 0 0 1px ${color}` : 'none',
                          }}
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectIssueMarker?.(marker.id);
                          }}
                          title={marker.title}
                        />
                      );
                    })}
                  </div>
                </div>
                {visibleMarkerFamilies.length > 0 && (
                  <div className="flex flex-none items-center gap-1">
                    {visibleMarkerFamilies.map(({ family, label, color, count, enabled, enabledClasses }) => (
                      <button
                        key={`family-toggle-${family}`}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggleMarkerFamily?.(family);
                        }}
                        className={`flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${
                          enabled
                            ? enabledClasses
                            : 'border-slate-700/80 bg-slate-900/70 text-slate-500'
                        }`}
                        title={`${enabled ? 'Hide' : 'Show'} ${label} markers`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                        <span>{label}</span>
                        <span className="font-mono tracking-normal">{count}</span>
                      </button>
                    ))}
                  </div>
                )}
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
                  {activeResolvedIssueMarker && activeResolvedIssueMarker.rowIndexes.length > 0 && activeMarkerTone && (
                    <svg
                      width={waveWidth}
                      height={totalRowsHeight}
                      className="absolute top-0 pointer-events-none"
                    >
                      {activeResolvedIssueMarker.rowIndexes.map((rowIndex) => (
                        <g key={`active-row-band-${rowIndex}`}>
                          <rect
                            x={0}
                            y={rowIndex * ROW_HEIGHT + 1}
                            width={waveWidth}
                            height={ROW_HEIGHT - 2}
                            fill={activeMarkerTone.fill}
                            opacity={0.55}
                          />
                          <line
                            x1={0}
                            y1={rowIndex * ROW_HEIGHT + 1}
                            x2={waveWidth}
                            y2={rowIndex * ROW_HEIGHT + 1}
                            stroke="rgba(34,211,238,0.22)"
                            strokeWidth={0.8}
                          />
                          <line
                            x1={0}
                            y1={(rowIndex + 1) * ROW_HEIGHT - 1}
                            x2={waveWidth}
                            y2={(rowIndex + 1) * ROW_HEIGHT - 1}
                            stroke="rgba(34,211,238,0.16)"
                            strokeWidth={0.8}
                          />
                        </g>
                      ))}
                    </svg>
                  )}

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

                  <svg
                    width={waveWidth}
                    height={totalRowsHeight}
                    className="absolute top-0"
                  >
                    {resolvedIssueMarkers.map((marker) => {
                      const startTick = Math.min(marker.startTick, marker.endTick);
                      const endTick = Math.max(marker.startTick, marker.endTick);
                      const x = startTick * tickWidth;
                      const width = Math.max(tickWidth, (endTick - startTick + 1) * tickWidth);
                      const palette = marker.kind === 'protocol'
                        ? {
                            fill: 'rgba(34, 211, 238, 0.12)',
                            stroke: '#22d3ee',
                            badge: '#22d3ee',
                          }
                        : marker.kind === 'clockReset'
                          ? {
                              fill: 'rgba(74, 222, 128, 0.12)',
                              stroke: '#4ade80',
                              badge: '#4ade80',
                            }
                          : marker.kind === 'fsm'
                            ? {
                                fill: 'rgba(168, 85, 247, 0.12)',
                                stroke: '#a855f7',
                                badge: '#a855f7',
                              }
                        : marker.severity === 'high'
                        ? {
                            fill: 'rgba(239, 68, 68, 0.12)',
                            stroke: '#f87171',
                            badge: '#f87171',
                          }
                        : marker.severity === 'medium'
                          ? {
                              fill: 'rgba(245, 158, 11, 0.12)',
                              stroke: '#fbbf24',
                              badge: '#fbbf24',
                            }
                          : {
                              fill: 'rgba(250, 204, 21, 0.1)',
                              stroke: '#fde047',
                            badge: '#fde047',
                          };
                      const targetRows = marker.rowIndexes;
                      const isActive = marker.id === activeIssueMarkerId;
                      const isHovered = marker.id === hoveredIssueMarkerId;
                      const lineHitWidth = Math.max(8, tickWidth * 0.8);

                      return (
                        <g key={marker.id}>
                          {targetRows.map((rowIndex) => {
                            const y = rowIndex * ROW_HEIGHT;
                            return (
                              <g key={`${marker.id}-${rowIndex}`}>
                                <rect
                                  x={x}
                                  y={y + 1}
                                  width={width}
                                  height={ROW_HEIGHT - 2}
                                  fill={palette.fill}
                                  stroke={palette.stroke}
                                  strokeWidth={isActive || isHovered ? 1.8 : 1}
                                  rx={4}
                                  opacity={isActive ? 0.95 : isHovered ? 0.88 : 0.75}
                                />
                                <rect
                                  x={x}
                                  y={y + 1}
                                  width={Math.max(3, Math.min(6, tickWidth * 0.35))}
                                  height={ROW_HEIGHT - 2}
                                  fill={palette.badge}
                                  rx={3}
                                  opacity={isActive || isHovered ? 1 : 0.85}
                                />
                                <rect
                                  x={x}
                                  y={y}
                                  width={width}
                                  height={ROW_HEIGHT}
                                  fill="transparent"
                                  className="cursor-pointer"
                                  onMouseEnter={(event) => {
                                    setHoveredIssueMarkerId(marker.id);
                                    setIssueTooltip({
                                      markerId: marker.id,
                                      clientX: event.clientX,
                                      clientY: event.clientY,
                                    });
                                  }}
                                  onMouseMove={(event) => {
                                    setIssueTooltip({
                                      markerId: marker.id,
                                      clientX: event.clientX,
                                      clientY: event.clientY,
                                    });
                                  }}
                                  onMouseLeave={() => {
                                    setHoveredIssueMarkerId((current) => (current === marker.id ? null : current));
                                    setIssueTooltip((current) => (current?.markerId === marker.id ? null : current));
                                  }}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onSelectIssueMarker?.(marker.id);
                                  }}
                                />
                              </g>
                            );
                          })}
                          <line
                            x1={x}
                            y1={0}
                            x2={x}
                            y2={totalRowsHeight}
                            stroke={palette.stroke}
                            strokeWidth={isActive || isHovered ? 1.8 : 1}
                            strokeDasharray="3,5"
                            opacity={isActive ? 0.95 : isHovered ? 0.82 : 0.65}
                          />
                          <rect
                            x={x - lineHitWidth / 2}
                            y={0}
                            width={lineHitWidth}
                            height={totalRowsHeight}
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={(event) => {
                              setHoveredIssueMarkerId(marker.id);
                              setIssueTooltip({
                                markerId: marker.id,
                                clientX: event.clientX,
                                clientY: event.clientY,
                              });
                            }}
                            onMouseMove={(event) => {
                              setIssueTooltip({
                                markerId: marker.id,
                                clientX: event.clientX,
                                clientY: event.clientY,
                              });
                            }}
                            onMouseLeave={() => {
                              setHoveredIssueMarkerId((current) => (current === marker.id ? null : current));
                              setIssueTooltip((current) => (current?.markerId === marker.id ? null : current));
                            }}
                            onClick={(event) => {
                              event.stopPropagation();
                              onSelectIssueMarker?.(marker.id);
                            }}
                          />
                        </g>
                      );
                    })}
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
                        glitchInjectionEnabled={glitchInjectionEnabled}
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
                        <text x={cursorA * tickWidth} y={12} textAnchor="middle" fill="#0b1326" className="font-sans font-extrabold text-[12px]">A</text>
                      </g>
                    )}
                    {cursorB !== null && (
                      <g>
                        <line x1={cursorB * tickWidth} y1={0} x2={cursorB * tickWidth} y2={totalRowsHeight} stroke="#ffb95f" strokeWidth={1.5} strokeDasharray="4,4" />
                        <rect x={cursorB * tickWidth - 7} y={0} width={14} height={16} fill="#ffb95f" rx={2} />
                        <text x={cursorB * tickWidth} y={12} textAnchor="middle" fill="#0b1326" className="font-sans font-extrabold text-[12px]">B</text>
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
      {activeResolvedIssueMarker && activeMarkerTone && (
        <div className="pointer-events-none absolute right-3 top-[54px] z-30 w-[340px]">
          <div className={`rounded-xl border bg-[#08101d]/95 px-3 py-2.5 ${activeMarkerTone.border} ${activeMarkerTone.glow}`}>
            {resolvedIssueMarkers.length > 1 && (
              <div className="pointer-events-auto mb-2 flex items-center justify-between gap-3 rounded-lg border border-brand-outline-variant/25 bg-[#0b1320]/85 px-2 py-1">
                <div className="text-[11px] font-mono text-slate-400">
                  Issue {activeResolvedIssueMarkerIndex + 1} / {resolvedIssueMarkers.length}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500">
                    [ ] / arrows
                  </div>
                  <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStepIssueMarker('previous')}
                    className="inline-flex h-6 w-6 items-center justify-center rounded border border-brand-outline-variant/30 bg-brand-surface-low text-slate-300 transition-colors hover:border-brand-cyan/35 hover:text-brand-cyan"
                    title="Previous issue"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepIssueMarker('next')}
                    className="inline-flex h-6 w-6 items-center justify-center rounded border border-brand-outline-variant/30 bg-brand-surface-low text-slate-300 transition-colors hover:border-brand-cyan/35 hover:text-brand-cyan"
                    title="Next issue"
                  >
                    <ChevronRight size={13} />
                  </button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Selected Issue</div>
                <div className="mt-1 text-[12px] font-bold text-slate-100">{activeResolvedIssueMarker.title}</div>
              </div>
              <div className={`rounded-full border px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${activeMarkerTone.border} ${activeMarkerTone.text}`}>
                {activeResolvedIssueMarker.kind === 'protocol'
                  ? 'protocol'
                  : activeResolvedIssueMarker.kind === 'clockReset'
                    ? 'clock/reset'
                    : activeResolvedIssueMarker.kind === 'fsm'
                      ? 'fsm'
                    : activeResolvedIssueMarker.severity}
              </div>
            </div>
            <div className="mt-1 text-[12px] leading-relaxed text-slate-300">{activeResolvedIssueMarker.detail}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span>{formatIssueTickLabel(activeResolvedIssueMarker)}</span>
              <span>•</span>
              <span>{activeResolvedIssueMarker.signalNames.join(', ') || 'timeline marker'}</span>
              {activeResolvedIssueMarker.rowIndexes.length > 0 && (
                <>
                  <span>•</span>
                  <span>{activeResolvedIssueMarker.rowIndexes.length} row{activeResolvedIssueMarker.rowIndexes.length === 1 ? '' : 's'} highlighted</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {hoveredIssueMarker && issueTooltip && (
        <div
          className="pointer-events-none fixed z-40 max-w-[340px] rounded-lg border border-brand-cyan/30 bg-[#08101d]/96 px-3 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.45)]"
          style={{
            left: Math.min(issueTooltip.clientX + 14, window.innerWidth - 360),
            top: Math.max(12, issueTooltip.clientY + 14),
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="text-[12px] font-bold text-slate-100">{hoveredIssueMarker.title}</div>
            <div className={`rounded-full border px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
              hoveredIssueMarker.kind === 'protocol'
                ? 'border-cyan-400/35 text-cyan-200'
                : hoveredIssueMarker.kind === 'clockReset'
                  ? 'border-emerald-400/35 text-emerald-200'
                  : hoveredIssueMarker.kind === 'fsm'
                    ? 'border-violet-400/35 text-violet-200'
                : hoveredIssueMarker.severity === 'high'
                ? 'border-rose-400/35 text-rose-200'
                : hoveredIssueMarker.severity === 'medium'
                  ? 'border-amber-400/35 text-amber-200'
                  : 'border-yellow-300/35 text-yellow-200'
            }`}>
              {hoveredIssueMarker.kind === 'protocol'
                ? 'protocol'
                : hoveredIssueMarker.kind === 'clockReset'
                  ? 'clock/reset'
                  : hoveredIssueMarker.kind === 'fsm'
                    ? 'fsm'
                    : hoveredIssueMarker.severity}
            </div>
          </div>
          <div className="mt-1 text-[12px] leading-relaxed text-slate-300">{hoveredIssueMarker.detail}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            <span>{formatIssueTickLabel(hoveredIssueMarker)}</span>
            <span>•</span>
            <span>{hoveredIssueMarker.signalNames.join(', ') || 'timeline marker'}</span>
            {(hoveredIssueMarker.clusterSize || 1) > 1 && (
              <>
                <span>•</span>
                <span>{hoveredIssueMarker.clusterSize} nearby findings merged</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
