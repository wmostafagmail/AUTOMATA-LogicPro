import { AiMacroId, AiMacroValidationResult, TbGenerationMode, getAiMacroSpec } from './aiMacros';

export interface AiReportMeta {
  macroId?: AiMacroId;
  tbGenerationMode?: TbGenerationMode | null;
  provider?: string;
  model?: string;
  validation?: AiMacroValidationResult | null;
  hazardMarkdown?: string | null;
  protocolMarkdown?: string | null;
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

export interface ParsedAssistantReport {
  summary: string | null;
  sections: ReportSection[];
  highCount: number;
  mediumCount: number;
  lowCount: number;
  protocolCount: number;
  codeBlockCount: number;
}

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
  };
};

export const buildDisplayReport = (text: string, meta?: AiReportMeta): ParsedAssistantReport => {
  const macroSpec = getAiMacroSpec(meta?.macroId);
  const reports: ParsedAssistantReport[] = [buildStructuredReport(text)];

  if (macroSpec.deterministicContext.hazardScan && meta?.hazardMarkdown) {
    reports.unshift(buildStructuredReport(meta.hazardMarkdown));
  }

  if (macroSpec.deterministicContext.protocolScan && meta?.protocolMarkdown) {
    reports.unshift(buildStructuredReport(meta.protocolMarkdown));
  }

  return combineReports(reports);
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
