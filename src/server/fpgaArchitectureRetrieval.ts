import fs from 'fs/promises';
import path from 'path';
import {
  buildFpgaArchitectureEvidenceSnapshot,
  capFpgaArchitectureEvidenceFacts,
  type FpgaArchitectureEvidenceCollection,
  type FpgaArchitectureEvidenceFact,
  type FpgaArchitectureEvidenceSnapshot,
  type FpgaArchitectureRetrievalMode,
  isApprovedFpgaArchitectureEvidenceUrl,
} from './fpgaArchitectureEvidence';
import type { CuratedArchitectureSynthesis } from './fpgaArchitectureKnowledge';

type EvidenceSourceCandidate = {
  sourceId: string;
  sourceTitle: string;
  sourceUrl: string;
  seedText: string;
};

function evidenceDirectory(projectPath?: string | null) {
  return projectPath
    ? path.join(projectPath, '.automata-logicpro', 'fpga-architecture-evidence')
    : null;
}

function snapshotFileName(sourceId: string) {
  return `${sourceId.replace(/[^a-zA-Z0-9_-]+/g, '_')}.json`;
}

function sourceCandidatesFromSynthesis(synthesis: CuratedArchitectureSynthesis) {
  const methodology = synthesis.methodologyRules.map((rule): EvidenceSourceCandidate => ({
    sourceId: rule.ruleId,
    sourceTitle: rule.sourceTitle,
    sourceUrl: rule.sourceUrl,
    seedText: `${rule.title}. ${rule.summary}`,
  }));
  const references = synthesis.referenceDesigns.map((reference): EvidenceSourceCandidate => ({
    sourceId: reference.referenceId,
    sourceTitle: reference.title,
    sourceUrl: reference.sourceUrl,
    seedText: `${reference.summary}. ${reference.contractImplications.join(' ')}`,
  }));
  return [...methodology, ...references].filter((source) => isApprovedFpgaArchitectureEvidenceUrl(source.sourceUrl));
}

async function readCachedSnapshots(projectPath: string | null | undefined, candidates: EvidenceSourceCandidate[]) {
  const directory = evidenceDirectory(projectPath);
  if (!directory) return { snapshots: [] as FpgaArchitectureEvidenceSnapshot[], warnings: ['No project path was available for cached architecture evidence.'] };
  const snapshots: FpgaArchitectureEvidenceSnapshot[] = [];
  const warnings: string[] = [];
  for (const candidate of candidates) {
    const filePath = path.join(directory, snapshotFileName(candidate.sourceId));
    try {
      const parsed = JSON.parse(await fs.readFile(filePath, 'utf8')) as FpgaArchitectureEvidenceSnapshot;
      if (parsed?.sourceUrl && isApprovedFpgaArchitectureEvidenceUrl(parsed.sourceUrl)) snapshots.push(parsed);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') warnings.push(`Could not read cached evidence for ${candidate.sourceId}: ${error?.message || String(error)}`);
    }
  }
  return { snapshots, warnings };
}

async function writeSnapshot(projectPath: string | null | undefined, snapshot: FpgaArchitectureEvidenceSnapshot) {
  const directory = evidenceDirectory(projectPath);
  if (!directory) return;
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, snapshotFileName(snapshot.sourceId)), JSON.stringify(snapshot, null, 2));
}

async function fetchEvidenceSource(candidate: EvidenceSourceCandidate, signal?: AbortSignal) {
  const response = await fetch(candidate.sourceUrl, { signal, redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const text = await response.text();
  return text || candidate.seedText;
}

export async function collectFpgaArchitectureEvidence(params: {
  promptText: string;
  synthesis: CuratedArchitectureSynthesis;
  retrievalMode?: FpgaArchitectureRetrievalMode;
  projectPath?: string | null;
  signal?: AbortSignal;
}): Promise<FpgaArchitectureEvidenceCollection> {
  const retrievalMode = params.retrievalMode || 'off';
  const candidates = sourceCandidatesFromSynthesis(params.synthesis);
  if (retrievalMode === 'off') {
    return { retrievalMode, facts: [], snapshots: [], warnings: [] };
  }

  const cached = await readCachedSnapshots(params.projectPath, candidates);
  if (retrievalMode === 'official_live_cached') {
    const facts = capFpgaArchitectureEvidenceFacts(cached.snapshots.flatMap((snapshot) => snapshot.facts || []));
    return { retrievalMode, facts, snapshots: cached.snapshots, warnings: cached.warnings };
  }

  const snapshots: FpgaArchitectureEvidenceSnapshot[] = [...cached.snapshots];
  const warnings: string[] = [...cached.warnings];
  const cachedIds = new Set(cached.snapshots.map((snapshot) => snapshot.sourceId));
  for (const candidate of candidates.slice(0, 6)) {
    if (cachedIds.has(candidate.sourceId)) continue;
    try {
      const sourceText = await fetchEvidenceSource(candidate, params.signal);
      const snapshot = buildFpgaArchitectureEvidenceSnapshot({
        sourceId: candidate.sourceId,
        sourceUrl: candidate.sourceUrl,
        sourceTitle: candidate.sourceTitle,
        sourceText,
      });
      snapshots.push(snapshot);
      await writeSnapshot(params.projectPath, snapshot);
    } catch (error: any) {
      warnings.push(`Official architecture evidence unavailable for ${candidate.sourceId}: ${error?.message || String(error)}`);
    }
  }

  const liveFacts = snapshots.flatMap((snapshot) => snapshot.facts || []);
  if (liveFacts.length === 0) {
    const seedFacts = candidates.flatMap((candidate) => buildFpgaArchitectureEvidenceSnapshot({
      sourceId: candidate.sourceId,
      sourceUrl: candidate.sourceUrl,
      sourceTitle: candidate.sourceTitle,
      sourceText: candidate.seedText,
      warnings: ['Seeded from curated official-source metadata because live retrieval did not return usable text.'],
    }).facts);
    return { retrievalMode, facts: capFpgaArchitectureEvidenceFacts(seedFacts), snapshots, warnings };
  }
  return { retrievalMode, facts: capFpgaArchitectureEvidenceFacts(liveFacts), snapshots, warnings };
}
