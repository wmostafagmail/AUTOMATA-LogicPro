import { createHash } from 'crypto';

export type FpgaArchitectureRetrievalMode = 'off' | 'official_live_opt_in' | 'official_live_cached';

export type FpgaArchitectureEvidenceFact = {
  factId: string;
  sourceId: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceHash: string;
  snapshotId?: string;
  appliesTo: 'architecture' | 'hierarchy' | 'clock_reset' | 'interface' | 'numeric' | 'memory' | 'verification' | 'tool_flow' | 'reference_design';
  summary: string;
  contractImplication: string;
  confidence: number;
};

export type FpgaArchitectureEvidenceSnapshot = {
  snapshotId: string;
  sourceId: string;
  sourceUrl: string;
  sourceTitle: string;
  fetchedAt: string;
  sourceHash: string;
  excerpt: string;
  facts: FpgaArchitectureEvidenceFact[];
  warnings: string[];
};

export type FpgaArchitectureEvidenceCollection = {
  retrievalMode: FpgaArchitectureRetrievalMode;
  facts: FpgaArchitectureEvidenceFact[];
  snapshots: FpgaArchitectureEvidenceSnapshot[];
  warnings: string[];
};

export const FPGA_ARCHITECTURE_ALLOWED_EVIDENCE_DOMAINS = [
  'docs.amd.com',
  'docs.altera.com',
  'www.intel.com',
  'www.microchip.com',
  'ghdl.github.io',
] as const;

const MAX_FACTS_PER_SOURCE = 2;
const MAX_TOTAL_FACTS = 8;
const MAX_EXCERPT_CHARS = 1800;

function stableId(value: string, fallback: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 72);
  return normalized || fallback;
}

export function hashArchitectureEvidenceText(text: string) {
  return createHash('sha256').update(text).digest('hex');
}

export function isApprovedFpgaArchitectureEvidenceUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:'
      && FPGA_ARCHITECTURE_ALLOWED_EVIDENCE_DOMAINS.includes(parsed.hostname as any);
  } catch {
    return false;
  }
}

export function sanitizeArchitectureEvidenceText(text: string) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferAppliesTo(text: string): FpgaArchitectureEvidenceFact['appliesTo'] {
  const normalized = text.toLowerCase();
  if (/\b(clock|reset|cdc|domain)\b/.test(normalized)) return 'clock_reset';
  if (/\b(interface|port|generic|ip|subsystem|top[- ]down)\b/.test(normalized)) return 'interface';
  if (/\b(numeric|signed|unsigned|fixed|arithmetic|overflow)\b/.test(normalized)) return 'numeric';
  if (/\b(memory|fifo|ram|rom|buffer)\b/.test(normalized)) return 'memory';
  if (/\b(test|simulate|simulation|ghdl|verify|verification)\b/.test(normalized)) return 'verification';
  if (/\b(flow|compile|analyze|elaborate|tool)\b/.test(normalized)) return 'tool_flow';
  if (/\b(reference design|example|demo)\b/.test(normalized)) return 'reference_design';
  if (/\b(hierarchy|module|block|component)\b/.test(normalized)) return 'hierarchy';
  return 'architecture';
}

function compactSentenceCandidates(text: string) {
  return sanitizeArchitectureEvidenceText(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 48 && sentence.length <= 360)
    .filter((sentence) => /\b(?:design|architecture|hierarchy|clock|reset|interface|verification|simulation|module|component|ip|numeric|memory|fifo|flow)\b/i.test(sentence));
}

export function extractFpgaArchitectureEvidenceFacts(params: {
  sourceId: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceText: string;
  snapshotId?: string;
}) {
  if (!isApprovedFpgaArchitectureEvidenceUrl(params.sourceUrl)) return [];
  const sourceHash = hashArchitectureEvidenceText(params.sourceText);
  const sentences = compactSentenceCandidates(params.sourceText).slice(0, MAX_FACTS_PER_SOURCE);
  return sentences.map((sentence, index): FpgaArchitectureEvidenceFact => {
    const appliesTo = inferAppliesTo(sentence);
    const factId = `live_claim_${stableId(params.sourceId, 'source')}_${index + 1}`;
    return {
      factId,
      sourceId: params.sourceId,
      sourceUrl: params.sourceUrl,
      sourceTitle: params.sourceTitle,
      sourceHash,
      ...(params.snapshotId ? { snapshotId: params.snapshotId } : {}),
      appliesTo,
      summary: sentence.slice(0, 240),
      contractImplication: `Apply official ${appliesTo.replace(/_/g, ' ')} guidance from ${params.sourceTitle}: ${sentence.slice(0, 220)}`,
      confidence: 0.85,
    };
  });
}

export function capFpgaArchitectureEvidenceFacts(facts: FpgaArchitectureEvidenceFact[]) {
  const perSource = new Map<string, number>();
  const capped: FpgaArchitectureEvidenceFact[] = [];
  for (const fact of facts) {
    if (!isApprovedFpgaArchitectureEvidenceUrl(fact.sourceUrl)) continue;
    const count = perSource.get(fact.sourceId) || 0;
    if (count >= MAX_FACTS_PER_SOURCE) continue;
    capped.push(fact);
    perSource.set(fact.sourceId, count + 1);
    if (capped.length >= MAX_TOTAL_FACTS) break;
  }
  return capped;
}

export function buildFpgaArchitectureEvidenceSnapshot(params: {
  sourceId: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceText: string;
  fetchedAt?: string;
  warnings?: string[];
}) {
  const excerpt = sanitizeArchitectureEvidenceText(params.sourceText).slice(0, MAX_EXCERPT_CHARS);
  const sourceHash = hashArchitectureEvidenceText(params.sourceText);
  const snapshotId = `snapshot_${stableId(params.sourceId, 'source')}_${sourceHash.slice(0, 12)}`;
  const facts = extractFpgaArchitectureEvidenceFacts({
    sourceId: params.sourceId,
    sourceUrl: params.sourceUrl,
    sourceTitle: params.sourceTitle,
    sourceText: params.sourceText,
    snapshotId,
  });
  return {
    snapshotId,
    sourceId: params.sourceId,
    sourceUrl: params.sourceUrl,
    sourceTitle: params.sourceTitle,
    fetchedAt: params.fetchedAt || new Date().toISOString(),
    sourceHash,
    excerpt,
    facts,
    warnings: params.warnings || [],
  } satisfies FpgaArchitectureEvidenceSnapshot;
}

export function formatFpgaArchitectureEvidenceFactsForPrompt(facts: FpgaArchitectureEvidenceFact[]) {
  const capped = capFpgaArchitectureEvidenceFacts(facts);
  const lines = capped.map((fact) => (
    `- ${fact.factId}: ${fact.contractImplication} [${fact.sourceTitle}; hash ${fact.sourceHash.slice(0, 12)}]`
  ));
  const text = lines.join('\n');
  return text.length <= 3000 ? text : `${text.slice(0, 2997)}...`;
}
