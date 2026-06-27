import React from 'react';
import { Bot, ChevronDown, ChevronUp, CircleDot, ShieldCheck, AlertTriangle, GitBranch, Maximize2 } from 'lucide-react';
import { getAiMacroSpec } from '../aiMacros';
import { AIWorkspaceReport, buildStructuredReport, getSectionAccent } from '../aiReport';

interface AIBottomDrawerProps {
  report: AIWorkspaceReport | null;
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

export const AIAnalysisContent: React.FC<{ report: AIWorkspaceReport | null }> = ({ report }) => {
  if (!report) {
    return (
      <div className="rounded-lg border border-brand-outline-variant/20 bg-brand-surface px-4 py-5 text-[12px] text-slate-400">
        Run an AI macro or send a custom AI request to populate this area with the structured analysis output.
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
          <AIAnalysisContent report={report} />
        </div>
      )}
    </div>
  );
};
