import fs from 'node:fs';
import path from 'node:path';

export type FpgaBuildingBlockCatalogPort = {
  name: string;
  direction: string;
  width: string;
  purpose: string;
};

export type FpgaBuildingBlockCatalogConfigurable = {
  name: string;
  typicalRange: string;
  meaning: string;
};

export type FpgaBuildingBlockCatalogEntry = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  origin: string;
  summary: string;
  ports: FpgaBuildingBlockCatalogPort[];
  configurables: FpgaBuildingBlockCatalogConfigurable[];
  usedFor: string[];
  relatedBlocks: string[];
  implementationNotes: string;
  keywords: string[];
};

export type FpgaBuildingBlockCatalog = {
  catalogVersion: string;
  sourceArchive: string;
  sourceFiles: string[];
  targetCount: number;
  entryCount: number;
  categoryCounts: Record<string, number>;
  entries: FpgaBuildingBlockCatalogEntry[];
};

export type SelectedFpgaBuildingBlockCatalogEntry = {
  entry: FpgaBuildingBlockCatalogEntry;
  score: number;
  matchedTerms: string[];
};

const DEFAULT_CATALOG_PATH = path.resolve(process.cwd(), 'data/fpga-building-block-catalog/catalog.compact.json');
const SCORE_STOP_WORDS = new Set([
  'and',
  'are',
  'block',
  'blocks',
  'clock',
  'core',
  'data',
  'define',
  'design',
  'deterministic',
  'entity',
  'error',
  'explicit',
  'file',
  'for',
  'from',
  'input',
  'interface',
  'logic',
  'output',
  'outputs',
  'own',
  'owns',
  'package',
  'port',
  'reset',
  'rtl',
  'self',
  'status',
  'testbench',
  'the',
  'top',
  'typed',
  'with',
]);

let cachedCatalog: FpgaBuildingBlockCatalog | null = null;

function emptyCatalog(): FpgaBuildingBlockCatalog {
  return {
    catalogVersion: 'missing',
    sourceArchive: '',
    sourceFiles: [],
    targetCount: 0,
    entryCount: 0,
    categoryCounts: {},
    entries: [],
  };
}

export function loadFpgaBuildingBlockCatalog(catalogPath = DEFAULT_CATALOG_PATH): FpgaBuildingBlockCatalog {
  if (catalogPath === DEFAULT_CATALOG_PATH && cachedCatalog) return cachedCatalog;
  try {
    const parsed = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as FpgaBuildingBlockCatalog;
    const normalized = {
      ...parsed,
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      entryCount: Array.isArray(parsed.entries) ? parsed.entries.length : 0,
    };
    if (catalogPath === DEFAULT_CATALOG_PATH) cachedCatalog = normalized;
    return normalized;
  } catch {
    return emptyCatalog();
  }
}

function normalizeId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function tokenize(values: string[]) {
  return Array.from(new Set(values
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !SCORE_STOP_WORDS.has(token))));
}

function exactNeedleRegex(value: string) {
  return new RegExp(`\\b${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/_/g, '[_\\s-]*')}\\b`, 'i');
}

function scoreEntry(params: {
  entry: FpgaBuildingBlockCatalogEntry;
  promptText: string;
  promptTokens: Set<string>;
  requiredBlockIds: Set<string>;
  requiredTokens: Set<string>;
  designClass?: string;
}) {
  const entryId = normalizeId(params.entry.name);
  const categoryText = `${params.entry.category} ${params.entry.subcategory}`;
  const entryTokens = new Set([
    ...params.entry.keywords,
    ...tokenize([
      params.entry.name,
      params.entry.category,
      params.entry.subcategory,
      params.entry.summary,
      params.entry.implementationNotes,
      ...params.entry.usedFor,
      ...params.entry.ports.map((port) => `${port.name} ${port.purpose}`),
      ...params.entry.configurables.map((configurable) => `${configurable.name} ${configurable.meaning}`),
    ]),
  ]);
  let score = 0;
  const matchedTerms = new Set<string>();

  if (params.designClass && normalizeId(params.designClass) === entryId) {
    score += 140;
    matchedTerms.add(params.designClass);
  }
  if (params.requiredBlockIds.has(entryId)) {
    score += 120;
    matchedTerms.add(params.entry.name);
  }
  let fifoAliasBoostApplied = false;
  let queueAliasBoostApplied = false;
  for (const requiredId of params.requiredBlockIds) {
    if (!requiredId || requiredId === entryId) continue;
    if (requiredId.includes(entryId) || entryId.includes(requiredId)) {
      score += 35;
      matchedTerms.add(requiredId);
    }
    if (!fifoAliasBoostApplied && /(?:^|_)fifo$/.test(requiredId) && /(?:^|_)fifo$/.test(entryId)) {
      score += 70;
      fifoAliasBoostApplied = true;
      matchedTerms.add(requiredId);
    }
    if (!queueAliasBoostApplied && /(?:^|_)queue$/.test(requiredId) && /(?:^|_)queue$/.test(entryId)) {
      score += 55;
      queueAliasBoostApplied = true;
      matchedTerms.add(requiredId);
    }
  }
  if (exactNeedleRegex(params.entry.name).test(params.promptText)) {
    score += 95;
    matchedTerms.add(params.entry.name);
  }

  for (const token of params.promptTokens) {
    if (entryTokens.has(token)) {
      score += 4;
      matchedTerms.add(token);
    }
  }
  for (const token of params.requiredTokens) {
    if (entryTokens.has(token)) {
      score += 3;
      matchedTerms.add(token);
    }
  }
  for (const token of tokenize([categoryText])) {
    if (params.promptTokens.has(token)) score += 5;
  }

  const ports = params.entry.ports.map((port) => port.name.toLowerCase());
  if (ports.some((port) => /valid|ready|start|done|status|error|full|empty|level/.test(port))) score += 2;
  if (/fifo|queue|buffer/.test(entryId) && [...params.requiredBlockIds].some((id) => /fifo|queue|buffer/.test(id))) score += 30;
  if (/counter|timing|address/.test(entryId) && [...params.requiredBlockIds].some((id) => /counter|timing|address/.test(id))) score += 20;
  if (/decoder|control|fsm/.test(entryId) && [...params.requiredBlockIds].some((id) => /decoder|control|fsm/.test(id))) score += 20;

  return { score, matchedTerms: Array.from(matchedTerms).slice(0, 8) };
}

export function selectFpgaBuildingBlockCatalogEntries(params: {
  promptText: string;
  designClass?: string;
  requiredBlockHints?: string[];
  maxEntries?: number;
  catalog?: FpgaBuildingBlockCatalog;
}): SelectedFpgaBuildingBlockCatalogEntry[] {
  const catalog = params.catalog || loadFpgaBuildingBlockCatalog();
  if (!catalog.entries.length) return [];

  const promptText = params.promptText || '';
  const requiredBlockHints = params.requiredBlockHints || [];
  const promptTokens = new Set(tokenize([promptText, params.designClass || '']));
  const requiredTokens = new Set(tokenize(requiredBlockHints));
  const requiredBlockIds = new Set(requiredBlockHints
    .map((hint) => hint.split(':')[0])
    .map(normalizeId)
    .filter(Boolean));

  return catalog.entries
    .map((entry) => {
      const { score, matchedTerms } = scoreEntry({
        entry,
        promptText,
        promptTokens,
        requiredTokens,
        requiredBlockIds,
        designClass: params.designClass,
      });
      return { entry, score, matchedTerms };
    })
    .filter((selection) => selection.score >= 18)
    .sort((left, right) => (
      right.score - left.score
      || left.entry.id.localeCompare(right.entry.id)
      || left.entry.name.localeCompare(right.entry.name)
    ))
    .slice(0, params.maxEntries || 12);
}

function compactList(values: string[], maxItems: number) {
  const compacted = values.map((value) => value.trim()).filter(Boolean);
  return compacted.slice(0, maxItems).join(', ') || 'none';
}

export function formatBuildingBlockCatalogPromptSection(
  selections: SelectedFpgaBuildingBlockCatalogEntry[],
  options: { heading?: string; maxEntries?: number } = {},
) {
  const entries = selections.slice(0, options.maxEntries || 10);
  if (entries.length === 0) return '';
  return [
    `## ${options.heading || 'Curated Building-Block Catalog Matches'}`,
    'Use these app-selected reusable block specs as concrete architecture guidance. They are curated block contracts, not pasted RTL; preserve the approved architecture contract and only use these to choose interfaces, ownership, timing, and verification details.',
    ...entries.flatMap(({ entry, matchedTerms }) => [
      `- ${entry.id} ${entry.name} [${entry.category} / ${entry.subcategory}]`,
      `  Function: ${entry.summary}`,
      `  Representative ports: ${entry.ports.slice(0, 8).map((port) => `${port.name}:${port.direction}:${port.width}`).join(', ') || 'none listed'}`,
      `  Configurables: ${entry.configurables.slice(0, 6).map((configurable) => `${configurable.name}=${configurable.typicalRange}`).join(', ') || 'none listed'}`,
      `  Used for: ${compactList(entry.usedFor, 5)}.`,
      `  Verification/implementation note: ${entry.implementationNotes || 'define reset, latency, backpressure, and boundary behavior before coding RTL'}`,
      `  Matched terms: ${compactList(matchedTerms, 8)}.`,
    ]),
  ].join('\n');
}
