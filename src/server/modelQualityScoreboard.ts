import fs from 'fs/promises';

export type ModelQualityFailureBucket = {
  category: string;
  label: string;
  failureCode?: string | null;
  ruleIds: string[];
  count: number;
  lastMessage: string;
  forbiddenConstruct?: string | null;
  legalReplacementPattern?: string | null;
  lastSeenAt: string;
};

export type ModelQualityDesignStats = {
  attempts: number;
  successes: number;
  codeQualityFailures: number;
  providerRuntimeFailures: number;
  failureBuckets: Record<string, ModelQualityFailureBucket>;
};

export type ModelQualityEntry = {
  provider: string;
  model: string;
  macroId: string;
  attempts: number;
  successes: number;
  codeQualityFailures: number;
  providerRuntimeFailures: number;
  lastUpdatedAt: string;
  designs: Record<string, ModelQualityDesignStats>;
  failureBuckets: Record<string, ModelQualityFailureBucket>;
};

export type ModelQualityScoreboard = {
  schemaVersion: 1;
  updatedAt: string;
  models: Record<string, ModelQualityEntry>;
};

export type ModelQualityAttemptEvent = {
  provider: string;
  model: string;
  macroId: string;
  designKey?: string | null;
  ok: boolean;
  providerRuntimeFailure?: boolean;
  failure?: {
    category: string;
    label: string;
    failureCode?: string | null;
    ruleIds?: string[];
    message: string;
    forbiddenConstruct?: string | null;
    legalReplacementPattern?: string | null;
  } | null;
};

function nowIso() {
  return new Date().toISOString();
}

export function buildModelQualityKey(provider: string, model: string, macroId: string) {
  return [
    provider.trim().toLowerCase() || 'unknown_provider',
    model.trim().toLowerCase() || 'unknown_model',
    macroId.trim().toLowerCase() || 'unknown_macro',
  ].join('::');
}

export function createEmptyModelQualityScoreboard(): ModelQualityScoreboard {
  return {
    schemaVersion: 1,
    updatedAt: nowIso(),
    models: {},
  };
}

export async function readModelQualityScoreboard(filePath: string): Promise<ModelQualityScoreboard> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed?.schemaVersion !== 1 || !parsed?.models || typeof parsed.models !== 'object') {
      return createEmptyModelQualityScoreboard();
    }
    return parsed as ModelQualityScoreboard;
  } catch {
    return createEmptyModelQualityScoreboard();
  }
}

export async function writeModelQualityScoreboard(filePath: string, scoreboard: ModelQualityScoreboard) {
  scoreboard.updatedAt = nowIso();
  await fs.writeFile(filePath, `${JSON.stringify(scoreboard, null, 2)}\n`, 'utf8');
}

function ensureModelEntry(scoreboard: ModelQualityScoreboard, event: ModelQualityAttemptEvent): ModelQualityEntry {
  const key = buildModelQualityKey(event.provider, event.model, event.macroId);
  const existing = scoreboard.models[key];
  if (existing) {
    return existing;
  }

  const entry: ModelQualityEntry = {
    provider: event.provider,
    model: event.model,
    macroId: event.macroId,
    attempts: 0,
    successes: 0,
    codeQualityFailures: 0,
    providerRuntimeFailures: 0,
    lastUpdatedAt: nowIso(),
    designs: {},
    failureBuckets: {},
  };
  scoreboard.models[key] = entry;
  return entry;
}

function ensureDesignStats(entry: ModelQualityEntry, designKey: string): ModelQualityDesignStats {
  const existing = entry.designs[designKey];
  if (existing) {
    return existing;
  }

  const stats: ModelQualityDesignStats = {
    attempts: 0,
    successes: 0,
    codeQualityFailures: 0,
    providerRuntimeFailures: 0,
    failureBuckets: {},
  };
  entry.designs[designKey] = stats;
  return stats;
}

function bucketKey(category: string, ruleIds: string[]) {
  const normalizedRules = Array.from(new Set(ruleIds.filter(Boolean))).sort().join(',');
  return `${category || 'other'}::${normalizedRules}`;
}

const UNIVERSAL_VHDL_FAILURE_CATEGORIES = new Set([
  'identifier_reserved_word',
  'declaration_scope',
  'numeric_std_type_discipline',
  'numeric_std_typing',
  'interface_generic_port_syntax',
  'width_literal_mismatch',
  'assignment_operator_misuse',
]);

const UNIVERSAL_VHDL_RULE_PREFIXES = [
  'ghdl-',
  'vhdl-',
];

const MODEL_QUALITY_GUIDANCE_EXCLUDED_CATEGORIES = new Set([
  'context_budget',
  'manifest_structure',
  'other',
  'source_selection',
]);

function isUniversalVhdlFailureBucket(bucket: ModelQualityFailureBucket) {
  if (MODEL_QUALITY_GUIDANCE_EXCLUDED_CATEGORIES.has(bucket.category)) {
    return false;
  }
  if (UNIVERSAL_VHDL_FAILURE_CATEGORIES.has(bucket.category)) {
    return true;
  }
  return bucket.ruleIds.some((ruleId) => (
    UNIVERSAL_VHDL_RULE_PREFIXES.some((prefix) => ruleId.toLowerCase().startsWith(prefix))
  ));
}

function isModelQualityGuidanceBucket(bucket: ModelQualityFailureBucket) {
  if (MODEL_QUALITY_GUIDANCE_EXCLUDED_CATEGORIES.has(bucket.category)) {
    return false;
  }
  if (bucket.failureCode && bucket.failureCode !== 'category_only') {
    return true;
  }
  return isUniversalVhdlFailureBucket(bucket);
}

function recordFailureBucket(
  buckets: Record<string, ModelQualityFailureBucket>,
  failure: NonNullable<ModelQualityAttemptEvent['failure']>,
) {
  const ruleIds = Array.from(new Set(failure.ruleIds || []));
  const key = bucketKey(failure.category, ruleIds);
  const existing = buckets[key];
  if (existing) {
    existing.count += 1;
    existing.failureCode = failure.failureCode || existing.failureCode || null;
    existing.lastMessage = failure.message;
    existing.forbiddenConstruct = failure.forbiddenConstruct || existing.forbiddenConstruct || null;
    existing.legalReplacementPattern = failure.legalReplacementPattern || existing.legalReplacementPattern || null;
    existing.lastSeenAt = nowIso();
    existing.ruleIds = Array.from(new Set([...existing.ruleIds, ...ruleIds]));
    return;
  }

  buckets[key] = {
    category: failure.category || 'other',
    label: failure.label || failure.category || 'Other',
    failureCode: failure.failureCode || null,
    ruleIds,
    count: 1,
    lastMessage: failure.message,
    forbiddenConstruct: failure.forbiddenConstruct || null,
    legalReplacementPattern: failure.legalReplacementPattern || null,
    lastSeenAt: nowIso(),
  };
}

export function recordModelQualityAttempt(
  scoreboard: ModelQualityScoreboard,
  event: ModelQualityAttemptEvent,
) {
  const entry = ensureModelEntry(scoreboard, event);
  const designStats = ensureDesignStats(entry, event.designKey || 'all_designs');
  entry.lastUpdatedAt = nowIso();
  scoreboard.updatedAt = entry.lastUpdatedAt;

  if (event.providerRuntimeFailure) {
    entry.providerRuntimeFailures += 1;
    designStats.providerRuntimeFailures += 1;
    return entry;
  }

  entry.attempts += 1;
  designStats.attempts += 1;
  if (event.ok) {
    entry.successes += 1;
    designStats.successes += 1;
    return entry;
  }

  entry.codeQualityFailures += 1;
  designStats.codeQualityFailures += 1;
  if (event.failure) {
    recordFailureBucket(entry.failureBuckets, event.failure);
    recordFailureBucket(designStats.failureBuckets, event.failure);
  }
  return entry;
}

export function getModelQualityEntry(
  scoreboard: ModelQualityScoreboard,
  provider: string,
  model: string,
  macroId: string,
) {
  return scoreboard.models[buildModelQualityKey(provider, model, macroId)] || null;
}

function sortedBuckets(buckets: Record<string, ModelQualityFailureBucket>, limit: number) {
  return Object.values(buckets)
    .sort((left, right) => {
      if (left.count !== right.count) return right.count - left.count;
      return left.label.localeCompare(right.label);
    })
    .slice(0, limit);
}

export function buildModelQualityGuidanceSection(params: {
  scoreboard: ModelQualityScoreboard;
  provider: string;
  model: string;
  macroId: string;
  designKey?: string | null;
  maxBuckets?: number;
  allowGlobalUniversalFallback?: boolean;
}) {
  const entry = getModelQualityEntry(params.scoreboard, params.provider, params.model, params.macroId);
  if (!entry) {
    return '';
  }

  const designStats = params.designKey ? entry.designs[params.designKey] : null;
  const designBuckets = designStats
    ? sortedBuckets(designStats.failureBuckets, params.maxBuckets ?? 5).filter(isModelQualityGuidanceBucket)
    : [];
  const globalUniversalBuckets = params.allowGlobalUniversalFallback
    ? sortedBuckets(entry.failureBuckets, params.maxBuckets ?? 5).filter(isUniversalVhdlFailureBucket)
    : [];
  const buckets = designBuckets.length > 0 ? designBuckets : globalUniversalBuckets;
  const usingGlobalUniversalFallback = designBuckets.length === 0 && globalUniversalBuckets.length > 0;
  const scopeLabel = designBuckets.length > 0
    ? `${params.designKey || 'current design'} only`
    : (globalUniversalBuckets.length > 0 ? 'universal VHDL rules from global model history' : `${params.designKey || 'current design'} only`);
  const attempts = designStats?.attempts ?? (usingGlobalUniversalFallback ? entry.attempts : 0);
  const successes = designStats?.successes ?? (usingGlobalUniversalFallback ? entry.successes : 0);
  const codeQualityFailures = designStats?.codeQualityFailures ?? (usingGlobalUniversalFallback ? entry.codeQualityFailures : 0);
  const providerRuntimeFailures = designStats?.providerRuntimeFailures ?? (usingGlobalUniversalFallback ? entry.providerRuntimeFailures : 0);
  if (buckets.length === 0) {
    return '';
  }
  const successRate = attempts > 0 ? Math.round((successes / attempts) * 100) : 0;
  const needsConservativeMode = attempts >= 3 && successRate < 50;

  return [
    '## Model Quality Scoreboard Guidance',
    `Provider/model: ${entry.provider} / ${entry.model}`,
    `Scope: ${scopeLabel}`,
    `Observed code attempts: ${attempts}; successes: ${successes}; code-quality failures: ${codeQualityFailures}; success rate: ${successRate}%.`,
    `Provider/runtime interruptions: ${providerRuntimeFailures} (tracked separately from code quality).`,
    ...(needsConservativeMode ? [
      'Conservative generation mode is required for this provider/model/design because prior code-quality success is below 50%.',
      '- Prefer the app-provided golden templates and design-class scaffold over creative rewrites.',
      '- Keep files smaller, typed, and dependency-ordered.',
      '- If repairing, modify only the listed failing files and preserve any files that already pass validation.',
    ] : []),
    ...(buckets.length > 0 ? [
      'Recurring model-specific failure families to avoid in this attempt:',
      ...buckets.map((bucket, index) => [
        `${index + 1}. ${bucket.label} (${bucket.count} occurrence(s))`,
        `   Failure code: ${bucket.failureCode || 'category_only'}`,
        `   Category: ${bucket.category}`,
        ...(bucket.ruleIds.length > 0 ? [`   Canonical rules: ${bucket.ruleIds.join(', ')}`] : []),
        ...(bucket.forbiddenConstruct ? [`   Forbidden construct: ${bucket.forbiddenConstruct}`] : []),
        ...(bucket.legalReplacementPattern ? [`   Legal replacement pattern: ${bucket.legalReplacementPattern}`] : []),
      ].join('\n')),
      'Before final output, explicitly self-audit against the recurring families above and choose the known-good idioms instead of repeating the same pattern.',
    ] : []),
  ].join('\n');
}
