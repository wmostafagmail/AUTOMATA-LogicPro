import React from 'react';
import { Bot, ChevronDown, ChevronUp, CircleDot, ShieldCheck, AlertTriangle, GitBranch, Maximize2 } from 'lucide-react';
import { getAiMacroSpec } from '../aiMacros';
import { AIWorkspaceReport, buildStructuredReport, getHazardFindingDisplayId, getProtocolFrameDisplayId, getSectionAccent } from '../aiReport';
import type { WaveformIssueMarker } from '../types';

interface AIBottomDrawerProps {
  report: AIWorkspaceReport | null;
  hazardMarkers?: WaveformIssueMarker[];
  hazardSeverityFilter?: 'all' | 'high' | 'medium' | 'low';
  hazardFilterCounts?: Record<'all' | 'high' | 'medium' | 'low', number>;
  filteredMarkerCount?: number;
  markerFamilyCounts?: Record<'hazard' | 'protocol' | 'clockReset' | 'fsm', number>;
  markerFamilyVisibility?: Record<'hazard' | 'protocol' | 'clockReset' | 'fsm', boolean>;
  markerDisplayLimit?: 'all' | 25 | 50 | 100;
  selectedHazardId?: string | null;
  onSelectHazard?: (hazardId: string) => void;
  onChangeHazardSeverityFilter?: (filter: 'all' | 'high' | 'medium' | 'low') => void;
  onToggleMarkerFamily?: (family: 'hazard' | 'protocol' | 'clockReset' | 'fsm') => void;
  onChangeMarkerDisplayLimit?: (limit: 'all' | 25 | 50 | 100) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  onOpenFloatingWindow?: () => void;
  onOpenDiagramWindow?: () => void;
  fillHeight?: boolean;
}

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
        <span className={`mt-0.5 rounded-full border px-1.5 py-0.5 text-[12px] font-bold uppercase tracking-wide ${badgeClass}`}>
          {badge}
        </span>
      ) : (
        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-cyan flex-none" />
      )}
      <span className="text-[12px] leading-relaxed text-slate-300">{body}</span>
    </div>
  );
};

const getValidationTone = (status: 'pass' | 'warn' | 'fail') => {
  if (status === 'pass') {
    return {
      card: 'border-emerald-400/25 bg-emerald-500/8',
      icon: <ShieldCheck size={12} className="text-emerald-300" />,
      label: 'Pass',
      text: 'text-emerald-200',
    };
  }
  if (status === 'warn') {
    return {
      card: 'border-amber-400/25 bg-amber-500/8',
      icon: <AlertTriangle size={12} className="text-amber-300" />,
      label: 'Warn',
      text: 'text-amber-200',
    };
  }
  return {
    card: 'border-rose-400/25 bg-rose-500/8',
    icon: <AlertTriangle size={12} className="text-rose-300" />,
    label: 'Fail',
    text: 'text-rose-200',
  };
};

const renderDeterministicBlock = (title: string, markdown: string, accent: string) => {
  const parsed = buildStructuredReport(markdown);
  return (
    <section className={`rounded-lg border px-3 py-2.5 ${accent}`}>
      <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-slate-100">{title}</div>
      <div className="mt-2 space-y-2">
        {parsed.sections.flatMap((section) => [
          ...section.paragraphs.map((paragraph, index) => (
            <p key={`${title}-p-${section.title}-${index}`} className="text-[12px] leading-relaxed text-slate-300">
              {paragraph}
            </p>
          )),
          ...section.bullets.map((bullet, index) => renderBullet(bullet, `${title}-b-${section.title}-${index}`)),
        ])}
      </div>
    </section>
  );
};

export const AIAnalysisContent: React.FC<{
  report: AIWorkspaceReport | null;
  hazardMarkers?: WaveformIssueMarker[];
  hazardSeverityFilter?: 'all' | 'high' | 'medium' | 'low';
  hazardFilterCounts?: Record<'all' | 'high' | 'medium' | 'low', number>;
  filteredMarkerCount?: number;
  markerFamilyCounts?: Record<'hazard' | 'protocol' | 'clockReset' | 'fsm', number>;
  markerFamilyVisibility?: Record<'hazard' | 'protocol' | 'clockReset' | 'fsm', boolean>;
  markerDisplayLimit?: 'all' | 25 | 50 | 100;
  selectedHazardId?: string | null;
  onSelectHazard?: (hazardId: string) => void;
  onChangeHazardSeverityFilter?: (filter: 'all' | 'high' | 'medium' | 'low') => void;
  onToggleMarkerFamily?: (family: 'hazard' | 'protocol' | 'clockReset' | 'fsm') => void;
  onChangeMarkerDisplayLimit?: (limit: 'all' | 25 | 50 | 100) => void;
}> = ({
  report,
  hazardMarkers = [],
  hazardSeverityFilter = 'all',
  hazardFilterCounts,
  filteredMarkerCount = 0,
  markerFamilyCounts,
  markerFamilyVisibility,
  markerDisplayLimit = 'all',
  selectedHazardId = null,
  onSelectHazard,
  onChangeHazardSeverityFilter,
  onToggleMarkerFamily,
  onChangeMarkerDisplayLimit,
}) => {
  if (!report) {
    return (
      <div className="rounded-lg border border-brand-outline-variant/20 bg-brand-surface px-4 py-5 text-[12px] text-slate-400">
        Run an AI macro or send a custom AI request to populate this area with the structured analysis output.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredMarkerCount > 0 && markerFamilyCounts && markerFamilyVisibility && (
        <div className="rounded-lg border border-brand-outline-variant/20 bg-brand-surface-low px-3 py-2.5">
          <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-200">Marker Families</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {([
              ['hazard', 'Hazard'],
              ['protocol', 'Protocol'],
              ['clockReset', 'Clock/Reset'],
              ['fsm', 'FSM'],
            ] as const)
              .filter(([family]) => (markerFamilyCounts[family] || 0) > 0)
              .map(([family, label]) => {
                const enabled = markerFamilyVisibility[family];
                return (
                  <button
                    key={`family-${family}`}
                    type="button"
                    onClick={() => onToggleMarkerFamily?.(family)}
                    className={`rounded-full border px-2 py-1 text-[12px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                      enabled
                        ? 'border-brand-cyan/45 bg-brand-cyan/12 text-brand-cyan'
                        : 'border-white/10 bg-[#060a12] text-slate-500 hover:border-brand-cyan/25 hover:text-slate-300'
                    }`}
                  >
                    {label} ({markerFamilyCounts[family]})
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {report.meta.macroId === 'custom_query' && hazardMarkers.length > 0 && (
        <div className="rounded-lg border border-brand-cyan/20 bg-brand-cyan/6 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-brand-cyan">Combined Waveform Markers</div>
            <div className="text-[12px] font-mono text-slate-300">
              {hazardMarkers.length} shown • {filteredMarkerCount} combined marker{filteredMarkerCount === 1 ? '' : 's'}
            </div>
          </div>
          {filteredMarkerCount > 25 && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-400">Display</div>
              {(['all', 25, 50, 100] as const).map((limit) => {
                const isActive = markerDisplayLimit === limit;
                const label = limit === 'all' ? 'All' : `Top ${limit}`;
                return (
                  <button
                    key={`combined-limit-${limit}`}
                    type="button"
                    onClick={() => onChangeMarkerDisplayLimit?.(limit)}
                    className={`rounded-full border px-2 py-1 text-[12px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                      isActive
                        ? 'border-brand-cyan/45 bg-brand-cyan/12 text-brand-cyan'
                        : 'border-white/10 bg-[#060a12] text-slate-400 hover:border-brand-cyan/25 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-2 grid gap-2">
            {hazardMarkers.map((marker) => {
              const isActive = marker.id === selectedHazardId;
              const tickLabel = marker.startTick !== null && marker.endTick !== null
                ? marker.startTick === marker.endTick
                  ? `tick ${marker.startTick}`
                  : `ticks ${marker.startTick}-${marker.endTick}`
                : marker.relatedTicks.length > 0
                  ? `ticks ${marker.relatedTicks.join(', ')}`
                  : 'tick unknown';
              const familyLabel = marker.kind === 'protocol'
                ? 'protocol'
                : marker.kind === 'clockReset'
                  ? 'clock/reset'
                  : marker.kind === 'fsm'
                    ? 'fsm'
                    : 'hazard';
              const familyTone = marker.kind === 'protocol'
                ? 'border-cyan-400/35 text-cyan-100'
                : marker.kind === 'clockReset'
                  ? 'border-emerald-400/35 text-emerald-100'
                  : marker.kind === 'fsm'
                    ? 'border-violet-400/35 text-violet-100'
                    : marker.severity === 'high'
                      ? 'border-rose-400/35 text-rose-100'
                      : marker.severity === 'medium'
                        ? 'border-amber-400/35 text-amber-100'
                        : 'border-yellow-300/35 text-yellow-100';

              return (
                <button
                  key={marker.id}
                  type="button"
                  onClick={() => onSelectHazard?.(marker.id)}
                  className={`rounded border bg-[#060a12] px-2.5 py-2 text-left transition-all cursor-pointer ${
                    isActive
                      ? 'border-brand-cyan/60 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]'
                      : 'border-white/5 hover:border-brand-cyan/35'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-slate-100">{marker.title}</div>
                      <div className="mt-1 text-[12px] leading-relaxed text-slate-400">{marker.detail}</div>
                    </div>
                    <div className={`rounded-full border px-1.5 py-0.5 text-[12px] font-bold uppercase tracking-wide ${familyTone}`}>
                      {familyLabel}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-slate-400">
                    <span>{tickLabel}</span>
                    <span>•</span>
                    <span>{marker.signalNames.join(', ') || 'timeline marker'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {report.meta.macroId === 'inspect_race_hazards' && Array.isArray(report.meta.hazardFindings) && report.meta.hazardFindings.length > 0 && (
        <div className="rounded-lg border border-rose-400/20 bg-rose-500/6 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-rose-200">Waveform Hazard Markers</div>
            <div className="text-[12px] font-mono text-slate-300">
              {hazardMarkers.length} shown • {filteredMarkerCount} filtered cluster{filteredMarkerCount === 1 ? '' : 's'} • {report.meta.hazardFindings.length} raw finding{report.meta.hazardFindings.length === 1 ? '' : 's'}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {([
              ['all', 'All'],
              ['high', 'High'],
              ['medium', 'Medium'],
              ['low', 'Low'],
            ] as const).map(([filterId, filterLabel]) => {
              const isActive = hazardSeverityFilter === filterId;
              const count = hazardFilterCounts?.[filterId] ?? 0;
              return (
                <button
                  key={filterId}
                  type="button"
                  onClick={() => onChangeHazardSeverityFilter?.(filterId)}
                  className={`rounded-full border px-2 py-1 text-[12px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                    isActive
                      ? 'border-brand-cyan/50 bg-brand-cyan/15 text-brand-cyan'
                      : 'border-white/10 bg-[#060a12] text-slate-400 hover:border-brand-cyan/30 hover:text-slate-200'
                  }`}
                >
                  {filterLabel} ({count})
                </button>
              );
            })}
          </div>
          {filteredMarkerCount > 25 && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-400">Display</div>
              {(['all', 25, 50, 100] as const).map((limit) => {
                const isActive = markerDisplayLimit === limit;
                const label = limit === 'all' ? 'All' : `Top ${limit}`;
                return (
                  <button
                    key={`hazard-limit-${limit}`}
                    type="button"
                    onClick={() => onChangeMarkerDisplayLimit?.(limit)}
                    className={`rounded-full border px-2 py-1 text-[12px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                      isActive
                        ? 'border-rose-300/45 bg-rose-400/12 text-rose-100'
                        : 'border-white/10 bg-[#060a12] text-slate-400 hover:border-rose-300/25 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-2 grid gap-2">
            {hazardMarkers.map((marker, index) => {
              const hazardId = marker.id || getHazardFindingDisplayId({
                severity: marker.severity,
                title: marker.title,
                detail: marker.detail,
                signalNames: marker.signalNames,
                startTick: marker.startTick,
                endTick: marker.endTick,
                relatedTicks: marker.relatedTicks,
              }, index);
              const isActive = hazardId === selectedHazardId;
              const severityTone = marker.severity === 'high'
                ? 'border-rose-400/35 text-rose-100'
                : marker.severity === 'medium'
                  ? 'border-amber-400/35 text-amber-100'
                  : 'border-yellow-300/35 text-yellow-100';
              const relatedTicks = Array.isArray(marker.relatedTicks) ? marker.relatedTicks : [];
              const signalNames = Array.isArray(marker.signalNames) ? marker.signalNames : [];
              const tickLabel = marker.startTick !== null && marker.endTick !== null
                ? marker.startTick === marker.endTick
                  ? `tick ${marker.startTick}`
                  : `ticks ${marker.startTick}-${marker.endTick}`
                : relatedTicks.length > 0
                  ? `ticks ${relatedTicks.join(', ')}`
                  : 'tick unknown';

              return (
                <button
                  key={hazardId}
                  type="button"
                  onClick={() => onSelectHazard?.(hazardId)}
                  className={`rounded border bg-[#060a12] px-2.5 py-2 text-left transition-all cursor-pointer ${
                    isActive
                      ? 'border-brand-cyan/60 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]'
                      : 'border-white/5 hover:border-brand-cyan/35'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-slate-100">{marker.title}</div>
                      <div className="mt-1 text-[12px] leading-relaxed text-slate-400">{marker.detail}</div>
                    </div>
                    <div className={`rounded-full border px-1.5 py-0.5 text-[12px] font-bold uppercase tracking-wide ${severityTone}`}>
                      {marker.severity}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-slate-400">
                    <span>{tickLabel}</span>
                    <span>•</span>
                    <span>{signalNames.join(', ') || 'timeline marker'}</span>
                    {(marker.clusterSize || 1) > 1 && (
                      <>
                        <span>•</span>
                        <span>{marker.clusterSize} nearby findings merged</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
            {hazardMarkers.length === 0 && (
              <div className="rounded border border-white/5 bg-[#060a12] px-2.5 py-3 text-[12px] text-slate-400">
                No hazard markers match the current severity filter.
              </div>
            )}
          </div>
        </div>
      )}

      {(report.meta.macroId === 'protocol_decoder_details' || report.meta.macroId === 'summarize_protocol_timeline')
        && Array.isArray(report.meta.protocolFrames)
        && report.meta.protocolFrames.length > 0 && (
        <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/6 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-cyan-200">Waveform Protocol Markers</div>
            <div className="text-[12px] font-mono text-slate-300">
              {hazardMarkers.length} shown • {filteredMarkerCount} decoded marker{filteredMarkerCount === 1 ? '' : 's'} • {report.meta.protocolFrames.length} raw frame{report.meta.protocolFrames.length === 1 ? '' : 's'}
            </div>
          </div>
          {filteredMarkerCount > 25 && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-400">Display</div>
              {(['all', 25, 50, 100] as const).map((limit) => {
                const isActive = markerDisplayLimit === limit;
                const label = limit === 'all' ? 'All' : `Top ${limit}`;
                return (
                  <button
                    key={`protocol-limit-${limit}`}
                    type="button"
                    onClick={() => onChangeMarkerDisplayLimit?.(limit)}
                    className={`rounded-full border px-2 py-1 text-[12px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                      isActive
                        ? 'border-cyan-300/45 bg-cyan-400/12 text-cyan-100'
                        : 'border-white/10 bg-[#060a12] text-slate-400 hover:border-cyan-300/25 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-2 grid gap-2">
            {hazardMarkers.map((marker, index) => {
              const frame = report.meta.protocolFrames?.[index];
              const markerId = frame
                ? getProtocolFrameDisplayId(frame, index)
                : marker.id;
              const isActive = marker.id === selectedHazardId || markerId === selectedHazardId;
              const tickLabel = marker.startTick !== null && marker.endTick !== null
                ? marker.startTick === marker.endTick
                  ? `tick ${marker.startTick}`
                  : `ticks ${marker.startTick}-${marker.endTick}`
                : marker.relatedTicks.length > 0
                  ? `ticks ${marker.relatedTicks.join(', ')}`
                  : 'tick unknown';

              return (
                <button
                  key={marker.id}
                  type="button"
                  onClick={() => onSelectHazard?.(marker.id)}
                  className={`rounded border bg-[#060a12] px-2.5 py-2 text-left transition-all cursor-pointer ${
                    isActive
                      ? 'border-brand-cyan/60 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]'
                      : 'border-white/5 hover:border-brand-cyan/35'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-slate-100">{marker.title}</div>
                      <div className="mt-1 text-[12px] leading-relaxed text-slate-400">{marker.detail}</div>
                    </div>
                    <div className="rounded-full border border-cyan-400/35 px-1.5 py-0.5 text-[12px] font-bold uppercase tracking-wide text-cyan-100">
                      protocol
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-slate-400">
                    <span>{tickLabel}</span>
                    <span>•</span>
                    <span>{marker.signalNames.join(', ') || 'timeline marker'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {report.meta.macroId === 'verify_clock_reset_sequence' && hazardMarkers.length > 0 && (
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/6 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-emerald-200">Clock / Reset Markers</div>
            <div className="text-[12px] font-mono text-slate-300">
              {hazardMarkers.length} shown • {filteredMarkerCount} derived marker{filteredMarkerCount === 1 ? '' : 's'}
            </div>
          </div>
          <div className="mt-2 grid gap-2">
            {hazardMarkers.map((marker) => {
              const isActive = marker.id === selectedHazardId;
              const severityTone = marker.severity === 'medium'
                ? 'border-amber-400/35 text-amber-100'
                : 'border-emerald-400/35 text-emerald-100';
              const tickLabel = marker.startTick !== null && marker.endTick !== null
                ? marker.startTick === marker.endTick
                  ? `tick ${marker.startTick}`
                  : `ticks ${marker.startTick}-${marker.endTick}`
                : marker.relatedTicks.length > 0
                  ? `ticks ${marker.relatedTicks.join(', ')}`
                  : 'tick unknown';

              return (
                <button
                  key={marker.id}
                  type="button"
                  onClick={() => onSelectHazard?.(marker.id)}
                  className={`rounded border bg-[#060a12] px-2.5 py-2 text-left transition-all cursor-pointer ${
                    isActive
                      ? 'border-brand-cyan/60 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]'
                      : 'border-white/5 hover:border-brand-cyan/35'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-slate-100">{marker.title}</div>
                      <div className="mt-1 text-[12px] leading-relaxed text-slate-400">{marker.detail}</div>
                    </div>
                    <div className={`rounded-full border px-1.5 py-0.5 text-[12px] font-bold uppercase tracking-wide ${severityTone}`}>
                      {marker.severity}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-slate-400">
                    <span>{tickLabel}</span>
                    <span>•</span>
                    <span>{marker.signalNames.join(', ') || 'timeline marker'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {report.meta.macroId === 'explain_fsm_behavior' && hazardMarkers.length > 0 && (
        <div className="rounded-lg border border-violet-400/20 bg-violet-500/6 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-violet-200">FSM Markers</div>
            <div className="text-[12px] font-mono text-slate-300">
              {hazardMarkers.length} shown • {filteredMarkerCount} derived marker{filteredMarkerCount === 1 ? '' : 's'}
            </div>
          </div>
          <div className="mt-2 grid gap-2">
            {hazardMarkers.map((marker) => {
              const isActive = marker.id === selectedHazardId;
              const severityTone = marker.severity === 'medium'
                ? 'border-violet-400/35 text-violet-100'
                : 'border-fuchsia-400/35 text-fuchsia-100';
              const tickLabel = marker.startTick !== null && marker.endTick !== null
                ? marker.startTick === marker.endTick
                  ? `tick ${marker.startTick}`
                  : `ticks ${marker.startTick}-${marker.endTick}`
                : marker.relatedTicks.length > 0
                  ? `ticks ${marker.relatedTicks.join(', ')}`
                  : 'tick unknown';

              return (
                <button
                  key={marker.id}
                  type="button"
                  onClick={() => onSelectHazard?.(marker.id)}
                  className={`rounded border bg-[#060a12] px-2.5 py-2 text-left transition-all cursor-pointer ${
                    isActive
                      ? 'border-brand-cyan/60 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]'
                      : 'border-white/5 hover:border-brand-cyan/35'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-slate-100">{marker.title}</div>
                      <div className="mt-1 text-[12px] leading-relaxed text-slate-400">{marker.detail}</div>
                    </div>
                    <div className={`rounded-full border px-1.5 py-0.5 text-[12px] font-bold uppercase tracking-wide ${severityTone}`}>
                      {marker.severity}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-slate-400">
                    <span>{tickLabel}</span>
                    <span>•</span>
                    <span>{marker.signalNames.join(', ') || 'timeline marker'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {report.meta.diagnostics && (
        <div className="rounded-lg border border-violet-400/25 bg-violet-500/8 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-violet-200">Macro Selection Diagnostics</div>
            <div className="text-[12px] font-mono text-slate-300">
              {report.meta.diagnostics.visibleSignalsSent}/{report.meta.diagnostics.totalSignalsAvailable} signals
            </div>
          </div>
          <div className="mt-2 grid gap-1 text-[12px] text-slate-300">
            <div><span className="font-bold text-slate-100">Root Entity:</span> {report.meta.diagnostics.rootEntity}</div>
            <div><span className="font-bold text-slate-100">Focus Entities:</span> {report.meta.diagnostics.focusEntities.join(', ') || 'none'}</div>
            <div><span className="font-bold text-slate-100">Semantic Confidence:</span> {report.meta.diagnostics.semanticConfidence}%</div>
            <div><span className="font-bold text-slate-100">Reachable Entities:</span> {report.meta.diagnostics.reachableEntities.join(', ') || 'none'}</div>
            <div><span className="font-bold text-slate-100">Entity Roles:</span> {Object.entries(report.meta.diagnostics.entityRoles).map(([entityName, role]) => `${entityName}:${role}`).join(', ') || 'none'}</div>
            <div><span className="font-bold text-slate-100">Desired Categories:</span> {report.meta.diagnostics.desiredCategories.join(', ') || 'none'}</div>
          </div>
          {report.meta.diagnostics.selectionNotes.length > 0 && (
            <div className="mt-2 space-y-1">
              {report.meta.diagnostics.selectionNotes.map((note, noteIndex) => (
                <div key={`diag-note-${noteIndex}`} className="text-[12px] leading-relaxed text-slate-400">
                  {note}
                </div>
              ))}
            </div>
          )}
          {report.meta.diagnostics.selectedSignals.length > 0 && (
            <div className="mt-3 grid gap-2 lg:grid-cols-2">
              {report.meta.diagnostics.selectedSignals.map((signal, index) => (
                <div key={signal.displayKey || `${signal.normalizedSignal}-${index}`} className="rounded border border-white/5 bg-[#060a12] px-2.5 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-[12px] font-bold text-violet-100">{signal.signal}</div>
                    <div className="text-[12px] font-mono text-slate-400">score {signal.score}</div>
                  </div>
                  <div className="mt-1 text-[12px] leading-relaxed text-slate-400">
                    <div>categories: {signal.categories.join(', ') || 'uncategorized'}</div>
                    <div>entities: {signal.entities.join(', ') || 'none'}</div>
                    <div>related nodes: {signal.relatedNodes.slice(0, 8).join(', ') || signal.normalizedSignal}</div>
                    <div>activity score: {signal.activityScore}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {report.meta.validation && (() => {
        const tone = getValidationTone(report.meta.validation.status);
        return (
          <div className={`rounded-lg border px-3 py-2.5 ${tone.card}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {tone.icon}
                <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-100">Validation Result</div>
              </div>
              <div className={`text-[12px] font-bold uppercase tracking-[0.18em] ${tone.text}`}>{tone.label}</div>
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-300">{report.meta.validation.summary}</p>
            <div className="mt-2 grid gap-1.5">
              {report.meta.validation.checks.map((check) => (
                <div key={check.id} className="flex items-start gap-2 rounded border border-white/5 bg-[#060a12] px-2 py-1.5">
                  <CircleDot size={10} className={
                    check.status === 'pass'
                      ? 'text-emerald-300'
                      : check.status === 'warn'
                        ? 'text-amber-300'
                        : check.status === 'fail'
                          ? 'text-rose-300'
                          : 'text-slate-500'
                  } />
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-slate-100">{check.label}</div>
                    <div className="text-[12px] leading-relaxed text-slate-400">{check.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {report.meta.generatedFiles && report.meta.generatedFiles.length > 0 && (
        <div className="rounded-lg border border-emerald-400/25 bg-emerald-500/8 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-emerald-200">Saved Generated Files</div>
            <div className="text-[12px] font-mono text-slate-300">
              {report.meta.generatedFiles.length} file{report.meta.generatedFiles.length === 1 ? '' : 's'}
            </div>
          </div>
          {report.meta.outputDirectory && (
            <div className="mt-1 text-[12px] leading-relaxed text-slate-400">
              Output folder: <span className="font-mono text-slate-300">{report.meta.outputDirectory}</span>
            </div>
          )}
          <div className="mt-2 grid gap-1.5">
            {report.meta.generatedFiles.map((file) => (
              <div key={file.path} className="rounded border border-white/5 bg-[#060a12] px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-[12px] font-bold text-emerald-100">{file.name}</div>
                  <div className="text-[12px] uppercase tracking-[0.14em] text-emerald-300">
                    {(file.kind || 'artifact').replace(/_/g, ' ')}
                  </div>
                </div>
                <div className="mt-1 break-all font-mono text-[12px] leading-relaxed text-slate-400">
                  {file.path}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.report.orchestratorAudit && (
        <div className="rounded-lg border border-brand-cyan/25 bg-brand-cyan/8 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-brand-cyan">Skill Usage</div>
            <div className="text-[12px] font-mono text-slate-300">
              {report.report.orchestratorAudit.selectedSkills.length} skill{report.report.orchestratorAudit.selectedSkills.length === 1 ? '' : 's'}
            </div>
          </div>

          {report.meta.deterministicSkillSelection && (
            <div className="mt-2 rounded border border-brand-cyan/20 bg-[#060a12] px-2.5 py-2">
              <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-brand-cyan">Server-Selected Skill Plan</div>
              <div className="mt-1 break-all text-[12px] leading-relaxed text-slate-400">
                Registry: <span className="font-mono text-slate-300">{report.meta.deterministicSkillSelection.registryPath}</span>
              </div>
            </div>
          )}

          {report.report.orchestratorAudit.selectedSkills.length > 0 && (
            <div className="mt-2 grid gap-2">
              {report.report.orchestratorAudit.selectedSkills.map((skill, index) => (
                <div key={`skill-${skill.role}-${skill.name}-${index}`} className="rounded border border-white/5 bg-[#060a12] px-2.5 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[12px] font-bold text-slate-100">{skill.name}</div>
                    <div className={`text-[12px] uppercase tracking-[0.16em] ${
                      skill.role === 'primary'
                        ? 'text-emerald-300'
                        : skill.role === 'supporting'
                          ? 'text-cyan-300'
                          : 'text-slate-400'
                    }`}>
                      {skill.role}
                    </div>
                  </div>
                  {skill.reason && (
                    <div className="mt-1 text-[12px] leading-relaxed text-slate-400">{skill.reason}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {report.report.orchestratorAudit.executionSummary.length > 0 && (
              <section className="rounded-lg border border-white/8 bg-[#060a12] px-2.5 py-2">
                <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-100">Execution Summary</div>
                <div className="mt-2 space-y-1">
                  {report.report.orchestratorAudit.executionSummary.map((item, index) => (
                    <div key={`execution-${index}`} className="text-[12px] leading-relaxed text-slate-300">{item}</div>
                  ))}
                </div>
              </section>
            )}

            {report.report.orchestratorAudit.deliverables.length > 0 && (
              <section className="rounded-lg border border-white/8 bg-[#060a12] px-2.5 py-2">
                <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-100">Deliverables</div>
                <div className="mt-2 space-y-1">
                  {report.report.orchestratorAudit.deliverables.map((item, index) => (
                    <div key={`deliverable-${index}`} className="text-[12px] leading-relaxed text-slate-300">{item}</div>
                  ))}
                </div>
              </section>
            )}

            {report.report.orchestratorAudit.validation.length > 0 && (
              <section className="rounded-lg border border-white/8 bg-[#060a12] px-2.5 py-2">
                <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-100">Verification Checklist</div>
                <div className="mt-2 space-y-1">
                  {report.report.orchestratorAudit.validation.map((item, index) => (
                    <div key={`validation-${index}`} className="text-[12px] leading-relaxed text-slate-300">{item}</div>
                  ))}
                </div>
              </section>
            )}

            {report.report.orchestratorAudit.assumptions.length > 0 && (
              <section className="rounded-lg border border-white/8 bg-[#060a12] px-2.5 py-2">
                <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-100">Assumptions</div>
                <div className="mt-2 space-y-1">
                  {report.report.orchestratorAudit.assumptions.map((item, index) => (
                    <div key={`assumption-${index}`} className="text-[12px] leading-relaxed text-slate-300">{item}</div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {(report.meta.hazardMarkdown || report.meta.protocolMarkdown) && (
        <div className="grid gap-3 lg:grid-cols-2">
          {report.meta.hazardMarkdown && renderDeterministicBlock('Hazard Scan', report.meta.hazardMarkdown, 'border-amber-400/25 bg-amber-500/5')}
          {report.meta.protocolMarkdown && renderDeterministicBlock('Protocol Pre-Decode', report.meta.protocolMarkdown, 'border-cyan-400/25 bg-cyan-500/5')}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {report.report.sections.map((section, sectionIndex) => (
          <section
            key={`${section.title}-${sectionIndex}`}
            className={`rounded-lg border px-3 py-2.5 ${getSectionAccent(section.title)}`}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[12px] font-bold uppercase tracking-[0.18em] text-slate-100">{section.title}</h3>
              <span className="text-[12px] uppercase tracking-[0.18em] text-slate-500">
                {section.bullets.length > 0 ? `${section.bullets.length} findings` : `${section.codeBlocks.length} code`}
              </span>
            </div>

            {section.paragraphs.length > 0 && (
              <div className="mt-2 space-y-2">
                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <p key={`${section.title}-p-${paragraphIndex}`} className="text-[12px] leading-relaxed text-slate-300">
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
                      <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-emerald-200">
                        {codeBlock.language || 'code'}
                      </span>
                    </div>
                    <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-words px-2.5 py-2 text-[12px] leading-relaxed text-emerald-100">
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
  );
};

export const AIBottomDrawer: React.FC<AIBottomDrawerProps> = ({
  report,
  hazardMarkers = [],
  hazardSeverityFilter = 'all',
  hazardFilterCounts,
  filteredMarkerCount = 0,
  markerFamilyCounts,
  markerFamilyVisibility,
  markerDisplayLimit = 'all',
  selectedHazardId,
  onSelectHazard,
  onChangeHazardSeverityFilter,
  onToggleMarkerFamily,
  onChangeMarkerDisplayLimit,
  expanded,
  onToggleExpanded,
  onOpenFloatingWindow,
  onOpenDiagramWindow,
  fillHeight = false,
}) => {
  const macroLabel = report?.meta.macroId ? getAiMacroSpec(report.meta.macroId).label : null;

  return (
    <div className={`${fillHeight ? 'h-full' : 'shrink-0'} border-t border-brand-outline-variant/40 bg-brand-surface-lowest flex flex-col`}>
      <button
        type="button"
        onClick={onToggleExpanded}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left cursor-pointer hover:bg-brand-surface-low transition-colors"
      >
        <div className="flex min-w-0 items-center gap-2">
          <Bot size={14} className="text-brand-cyan flex-none" />
          <div className="min-w-0">
            <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-brand-cyan">AI Analysis Output</div>
            <div className="truncate text-[12px] text-slate-400">
              {report?.report.summary || 'Structured AI findings will appear here after an analysis run.'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-none">
          {macroLabel && (
            <span className="rounded-full border border-brand-cyan/20 bg-brand-cyan/10 px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide text-brand-cyan">
              {macroLabel}
            </span>
          )}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDiagramWindow?.();
            }}
            className="flex items-center gap-1 rounded border border-violet-400/30 bg-violet-500/10 px-1.5 py-1 text-[12px] font-bold uppercase tracking-wide text-violet-200 transition-colors hover:bg-violet-500/20 hover:text-white cursor-pointer"
            title="Open block diagram viewer"
          >
            <GitBranch size={12} />
            <span>Diagram</span>
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenFloatingWindow?.();
            }}
            className="rounded border border-brand-outline-variant/30 bg-brand-surface-high p-1 text-slate-300 transition-colors hover:bg-brand-surface hover:text-white cursor-pointer"
            title="Open AI Analysis Output in a floating window"
          >
            <Maximize2 size={12} />
          </button>
          {expanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronUp size={14} className="text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className={`${fillHeight ? 'min-h-0 flex-1' : 'max-h-[34vh]'} overflow-y-auto px-4 pb-4`}>
          <AIAnalysisContent
            report={report}
            hazardMarkers={hazardMarkers}
            hazardSeverityFilter={hazardSeverityFilter}
            hazardFilterCounts={hazardFilterCounts}
            filteredMarkerCount={filteredMarkerCount}
            markerFamilyCounts={markerFamilyCounts}
            markerFamilyVisibility={markerFamilyVisibility}
            markerDisplayLimit={markerDisplayLimit}
            selectedHazardId={selectedHazardId}
            onSelectHazard={onSelectHazard}
            onChangeHazardSeverityFilter={onChangeHazardSeverityFilter}
            onToggleMarkerFamily={onToggleMarkerFamily}
            onChangeMarkerDisplayLimit={onChangeMarkerDisplayLimit}
          />
        </div>
      )}
    </div>
  );
};
