import { AiMacroId, AiMacroValidationResult, TbGenerationMode, getAiMacroSpec } from './aiMacros';
import type { CustomQueryMode } from './customQueryIntent';

export interface AiSignalDiagnostic {
  displayKey: string;
  signal: string;
  normalizedSignal: string;
  score: number;
  activityScore: number;
  categories: string[];
  entities: string[];
  relatedNodes: string[];
}

export interface AiHazardFinding {
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  signalNames: string[];
  startTick: number | null;
  endTick: number | null;
  relatedTicks: number[];
}

export const getHazardFindingDisplayId = (finding: AiHazardFinding, index: number) => {
  const relatedTicks = Array.isArray(finding.relatedTicks) ? finding.relatedTicks : [];
  const primaryTick = typeof finding.startTick === 'number' ? finding.startTick : relatedTicks[0] ?? 'na';
  const title = typeof finding.title === 'string' && finding.title.trim() ? finding.title.trim() : `finding-${index}`;
  return `hazard-${index}-${title}-${primaryTick}`;
};

export interface AiProtocolFrame {
  protocol: 'SPI' | 'I2C' | 'UART';
  channel: string;
  startTick: number;
  endTick: number;
  summary: string;
  detail: string;
}

export const getProtocolFrameDisplayId = (frame: AiProtocolFrame, index: number) => {
  const protocol = typeof frame.protocol === 'string' ? frame.protocol : 'PROTO';
  const channel = typeof frame.channel === 'string' && frame.channel.trim() ? frame.channel.trim() : `channel-${index}`;
  const startTick = typeof frame.startTick === 'number' ? frame.startTick : 'na';
  return `protocol-${index}-${protocol}-${channel}-${startTick}`;
};

export interface AiMacroDiagnostics {
  rootEntity: string;
  reachableEntities: string[];
  entityHierarchy: Array<{
    parent: string;
    child: string;
    instanceLabel: string;
  }>;
  entityDepths: Record<string, number>;
  entityRoles: Record<string, string>;
  focusEntities: string[];
  desiredCategories: string[];
  semanticConfidence: number;
  selectionNotes: string[];
  visibleSignalsSent: number;
  totalSignalsAvailable: number;
  selectedSignals: AiSignalDiagnostic[];
}

export interface AiReportMeta {
  macroId?: AiMacroId;
  tbGenerationMode?: TbGenerationMode | null;
  customQueryMode?: CustomQueryMode | null;
  provider?: string;
  model?: string;
  telemetry?: {
    engineLabel: string;
    inputTokens: number | null;
    latestAttemptInputTokens?: number;
    jobInputTokens?: number;
    attemptCount?: number;
    retryCount?: number;
    sessionInputTokens?: number;
    outputTokens: number | null;
    jobOutputTokens?: number;
    sessionOutputTokens?: number;
    tokensPerSecond: number | null;
    endToEndTokensPerSecond?: number | null;
    durationMs: number;
  } | null;
  retryUsed?: boolean;
  outputDirectory?: string | null;
  generatedFiles?: Array<{
    name: string;
    path: string;
    kind?: 'testbench' | 'module' | 'assertions' | 'rtl_skeleton' | 'unknown';
  }>;
  architectProject?: {
    projectName: string;
    sanitizedProjectName: string;
    topEntity: string;
    vhdlStandard: string;
    targetFpga: string | null;
    summary: string;
    assumptions: string[];
    warnings: string[];
    folderTree: string;
    outputDirectory: string | null;
    files: Array<{
      path: string;
      fileType: string;
      purpose: string;
      content: string;
      savedPath?: string;
    }>;
    ghdl: {
      analysisOrder: string[];
      topTestbench: string;
      runCommands: string[];
      expectedResult: string;
    };
    qualityChecklist: string[];
  } | null;
  validation?: AiMacroValidationResult | null;
  hazardMarkdown?: string | null;
  hazardFindings?: AiHazardFinding[];
  protocolMarkdown?: string | null;
  protocolFrames?: AiProtocolFrame[];
  diagnostics?: AiMacroDiagnostics | null;
  deterministicSkillSelection?: {
    registryPath: string;
    selectedSkills: OrchestratorSkillEntry[];
    skillCallPlan: string[];
  } | null;
}

export interface ReportCodeBlock {
  language: string;
  content: string;
}

export interface ReportSection {
  title: string;
  paragraphs: string[];
  bullets: string[];
  codeBlocks: ReportCodeBlock[];
}

export interface OrchestratorSkillEntry {
  role: 'primary' | 'supporting' | 'other';
  name: string;
  reason?: string | null;
}

export interface OrchestratorAudit {
  selectedSkills: OrchestratorSkillEntry[];
  executionSummary: string[];
  deliverables: string[];
  validation: string[];
  assumptions: string[];
}

export interface ParsedAssistantReport {
  summary: string | null;
  sections: ReportSection[];
  highCount: number;
  mediumCount: number;
  lowCount: number;
  protocolCount: number;
  codeBlockCount: number;
  orchestratorAudit: OrchestratorAudit | null;
}

const ALLOWED_VHDL_SKILL_NAMES = new Set([
  'VHDL-skill-orchestrator',
  'vhdl-language',
  'fpga-architecture',
  'rtl-verification',
  'timing-constraints',
]);

const normalizeSkillNameForDisplay = (value: string) => (
  value
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .trim()
);

const normalizeSectionTitle = (title: string) => title.trim().toLowerCase();

const getSectionByTitle = (sections: ReportSection[], matcher: RegExp) => (
  sections.find((section) => matcher.test(normalizeSectionTitle(section.title)))
);

const collectSectionItems = (section: ReportSection | undefined) => {
  if (!section) {
    return [];
  }
  return [
    ...section.paragraphs.map((paragraph) => paragraph.trim()).filter(Boolean),
    ...section.bullets.map((bullet) => bullet.trim()).filter(Boolean),
  ];
};

const parseSelectedSkills = (section: ReportSection | undefined): OrchestratorSkillEntry[] => {
  if (!section) {
    return [];
  }

  const items = collectSectionItems(section);
  const parsed = items.map((item) => {
    const normalized = item.replace(/^[-*]\s*/, '').trim();

    const primaryMatch = normalized.match(/^primary\s*:\s*(.+)$/i);
    if (primaryMatch) {
      return {
        role: 'primary' as const,
        name: normalizeSkillNameForDisplay(primaryMatch[1].trim()),
        reason: null,
      };
    }

    const supportingMatch = normalized.match(/^supporting\s*:\s*(.+)$/i);
    if (supportingMatch) {
      const supportingBody = supportingMatch[1].trim();
      const [name, ...reasonParts] = supportingBody.split(/\s+-\s+/);
      return {
        role: 'supporting' as const,
        name: normalizeSkillNameForDisplay(name.trim()),
        reason: reasonParts.join(' - ').trim() || null,
      };
    }

    const splitMatch = normalized.match(/^([^:]+):\s*(.+)$/);
    if (splitMatch) {
      return {
        role: 'other' as const,
        name: normalizeSkillNameForDisplay(`${splitMatch[1].trim()}: ${splitMatch[2].trim()}`),
        reason: null,
      };
    }

    return {
      role: 'other' as const,
      name: normalizeSkillNameForDisplay(normalized),
      reason: null,
    };
  });

  return parsed.filter((entry) => entry.name.length > 0);
};

const filterAllowedSelectedSkills = (skills: OrchestratorSkillEntry[]) => {
  const seen = new Set<string>();
  return skills.filter((entry) => {
    const normalizedName = normalizeSkillNameForDisplay(entry.name);
    if (!ALLOWED_VHDL_SKILL_NAMES.has(normalizedName)) {
      return false;
    }
    if (seen.has(normalizedName)) {
      return false;
    }
    entry.name = normalizedName;
    seen.add(normalizedName);
    return true;
  });
};

const extractOrchestratorAudit = (sections: ReportSection[]): OrchestratorAudit | null => {
  const selectedSkillsSection = getSectionByTitle(sections, /^selected skills$/i);
  const executionSummarySection = getSectionByTitle(sections, /^execution summary$/i);
  const deliverablesSection = getSectionByTitle(sections, /^deliverables$/i);
  const validationSection = getSectionByTitle(sections, /^validation$/i);
  const assumptionsSection = getSectionByTitle(sections, /^assumptions$/i);

  const audit: OrchestratorAudit = {
    selectedSkills: parseSelectedSkills(selectedSkillsSection),
    executionSummary: collectSectionItems(executionSummarySection),
    deliverables: collectSectionItems(deliverablesSection),
    validation: collectSectionItems(validationSection),
    assumptions: collectSectionItems(assumptionsSection),
  };

  const hasAnyAuditContent = (
    audit.selectedSkills.length > 0
    || audit.executionSummary.length > 0
    || audit.deliverables.length > 0
    || audit.validation.length > 0
    || audit.assumptions.length > 0
  );

  return hasAnyAuditContent ? audit : null;
};

const mergeOrchestratorAudit = (
  parsedAudit: OrchestratorAudit | null,
  metaAudit: AiReportMeta['deterministicSkillSelection']
): OrchestratorAudit | null => {
  if (!parsedAudit && !metaAudit) {
    return null;
  }

  const selectedSkills = metaAudit?.selectedSkills?.length
    ? filterAllowedSelectedSkills(metaAudit.selectedSkills.map((entry) => ({
        ...entry,
        name: normalizeSkillNameForDisplay(entry.name),
      })))
    : filterAllowedSelectedSkills((parsedAudit?.selectedSkills || []).map((entry) => ({
        ...entry,
        name: normalizeSkillNameForDisplay(entry.name),
      })));
  const executionSummary = [
    ...(metaAudit?.skillCallPlan || []),
    ...(parsedAudit?.executionSummary || []),
  ];
  const dedupedExecutionSummary = [...new Set(executionSummary.map((item) => item.trim()).filter(Boolean))];

  const merged: OrchestratorAudit = {
    selectedSkills,
    executionSummary: dedupedExecutionSummary,
    deliverables: parsedAudit?.deliverables || [],
    validation: parsedAudit?.validation || [],
    assumptions: parsedAudit?.assumptions || [],
  };

  const hasAnyAuditContent = (
    merged.selectedSkills.length > 0
    || merged.executionSummary.length > 0
    || merged.deliverables.length > 0
    || merged.validation.length > 0
    || merged.assumptions.length > 0
  );

  return hasAnyAuditContent ? merged : null;
};

export interface AIWorkspaceReport {
  text: string;
  meta: AiReportMeta;
  report: ParsedAssistantReport;
}

export const buildStructuredReport = (text: string): ParsedAssistantReport => {
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
    orchestratorAudit: extractOrchestratorAudit(sections),
  };
};

export const combineReports = (reports: ParsedAssistantReport[]): ParsedAssistantReport => {
  const combinedSections = reports.flatMap((report) => report.sections);
  const summary = reports.find((report) => report.summary)?.summary || null;

  return {
    summary,
    sections: combinedSections,
    highCount: reports.reduce((sum, report) => sum + report.highCount, 0),
    mediumCount: reports.reduce((sum, report) => sum + report.mediumCount, 0),
    lowCount: reports.reduce((sum, report) => sum + report.lowCount, 0),
    protocolCount: reports.reduce((sum, report) => sum + report.protocolCount, 0),
    codeBlockCount: reports.reduce((sum, report) => sum + report.codeBlockCount, 0),
    orchestratorAudit: extractOrchestratorAudit(combinedSections),
  };
};

export const buildDisplayReport = (text: string, meta?: AiReportMeta): ParsedAssistantReport => {
  const macroSpec = getAiMacroSpec(meta?.macroId);
  const reports: ParsedAssistantReport[] = [buildStructuredReport(text)];

  if ((meta?.macroId !== 'custom_query' || meta?.customQueryMode !== 'general_design') && macroSpec.deterministicContext.hazardScan && meta?.hazardMarkdown) {
    reports.unshift(buildStructuredReport(meta.hazardMarkdown));
  }

  if ((meta?.macroId !== 'custom_query' || meta?.customQueryMode !== 'general_design') && macroSpec.deterministicContext.protocolScan && meta?.protocolMarkdown) {
    reports.unshift(buildStructuredReport(meta.protocolMarkdown));
  }

  const combined = combineReports(reports);
  return {
    ...combined,
    orchestratorAudit: mergeOrchestratorAudit(combined.orchestratorAudit, meta?.deterministicSkillSelection || null),
  };
};

export const getSectionAccent = (title: string) => {
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
