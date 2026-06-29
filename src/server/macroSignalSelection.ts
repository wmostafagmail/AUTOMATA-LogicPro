import type { AiMacroId } from '../aiMacros';
import { getSignalName, getSignalValues } from './waveformAnalysis';

type AnalyzerSignal = {
  id?: string;
  name?: string;
  type?: string;
  values?: Array<number | string>;
};

export type SemanticSourceSelection = {
  path: string;
  isTestbench: boolean;
};

type VhdlInstanceConnection = {
  port: string;
  signals: string[];
};

type VhdlInstanceModel = {
  label: string;
  entity: string;
  connections: VhdlInstanceConnection[];
};

type VhdlEntitySemanticModel = {
  name: string;
  sourcePath: string;
  ports: string[];
  localSignals: string[];
  aliases: Array<[string, string]>;
  assignments: Array<[string, string]>;
  instances: VhdlInstanceModel[];
  generateBlockCount: number;
  isTestbench: boolean;
};

type MacroSignalInsight = {
  signal: string;
  categories: Array<'clockReset' | 'protocol' | 'state' | 'control' | 'data' | 'debug'>;
  entities: string[];
  relatedNodes: string[];
};

export type MacroSignalIndex = {
  rootEntity: string;
  selectedSourcePaths: string[];
  rootVisibleSignals: string[];
  reachableEntities: string[];
  entityHierarchy: Array<{
    parent: string;
    child: string;
    instanceLabel: string;
  }>;
  entityDepths: Record<string, number>;
  entityRoles: Record<string, string>;
  signalInsights: MacroSignalInsight[];
  categorySignals: {
    clockReset: string[];
    protocol: string[];
    state: string[];
    control: string[];
    data: string[];
    debug: string[];
    all: string[];
  };
};

export type SemanticSourceFixture = {
  path: string;
  isTestbench: boolean;
  content: string;
};

function stripVhdlComments(content: string) {
  return content.replace(/--.*$/gm, '');
}

export function normalizeVhdlIdentifier(value: string) {
  return value
    .trim()
    .replace(/^\\|\\$/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/'.*$/g, '')
    .split(/[\s./:]+/)
    .filter(Boolean)
    .pop()
    ?.toLowerCase() || value.trim().toLowerCase();
}

function splitTopLevelDelimited(text: string, delimiter = ',') {
  const entries: string[] = [];
  let current = '';
  let depth = 0;
  for (const character of text) {
    if (character === '(') depth += 1;
    if (character === ')') depth = Math.max(0, depth - 1);
    if (character === delimiter && depth === 0) {
      if (current.trim()) {
        entries.push(current.trim());
      }
      current = '';
      continue;
    }
    current += character;
  }
  if (current.trim()) {
    entries.push(current.trim());
  }
  return entries;
}

function parseVhdlIdentifierList(rawText: string) {
  return splitTopLevelDelimited(rawText)
    .flatMap((entry) => entry.split(','))
    .map((entry) => normalizeVhdlIdentifier(entry))
    .filter(Boolean);
}

const VHDL_REFERENCE_STOP_WORDS = new Set([
  'abs', 'access', 'after', 'alias', 'all', 'and', 'architecture', 'array', 'assert', 'attribute',
  'begin', 'block', 'body', 'buffer', 'bus', 'case', 'component', 'configuration', 'constant',
  'disconnect', 'downto', 'else', 'elsif', 'end', 'entity', 'exit', 'file', 'for', 'function',
  'generate', 'generic', 'group', 'guarded', 'if', 'impure', 'in', 'inertial', 'inout', 'is',
  'label', 'library', 'linkage', 'literal', 'loop', 'map', 'mod', 'nand', 'new', 'next', 'nor',
  'not', 'null', 'of', 'on', 'open', 'or', 'others', 'out', 'package', 'port', 'postponed',
  'procedure', 'process', 'pure', 'range', 'record', 'register', 'reject', 'rem', 'report',
  'return', 'rol', 'ror', 'select', 'severity', 'signal', 'shared', 'sla', 'sll', 'sra', 'srl',
  'subtype', 'then', 'to', 'transport', 'type', 'unaffected', 'units', 'until', 'use', 'variable',
  'wait', 'when', 'while', 'with', 'xnor', 'xor',
  'std_logic', 'std_logic_vector', 'unsigned', 'signed', 'integer', 'natural', 'boolean', 'bit',
  'bit_vector', 'true', 'false', 'rising_edge', 'falling_edge', 'conv_integer', 'to_integer',
  'to_unsigned', 'to_signed', 'resize', 'length', 'left', 'right', 'high', 'low', 'event',
  'stable', 'delayed', 'quiet', 'transaction',
]);

export function extractIdentifierReferences(rawText: string) {
  const references = new Set<string>();
  const sanitized = rawText
    .replace(/"[^"]*"/g, ' ')
    .replace(/'[^']*'/g, ' ');

  for (const match of sanitized.matchAll(/\b([a-zA-Z][a-zA-Z0-9_]*(?:\s*\([^)]*\))?(?:'[a-zA-Z_][a-zA-Z0-9_]*)?)\b/g)) {
    const normalized = normalizeVhdlIdentifier(match[1]);
    if (!normalized) continue;
    if (VHDL_REFERENCE_STOP_WORDS.has(normalized)) continue;
    references.add(normalized);
  }

  return Array.from(references);
}

function extractEntityPortsFromContent(content: string) {
  const portsByEntity = new Map<string, string[]>();
  const collectPorts = (ownerName: string, body: string) => {
    const portMatch = body.match(/\bport\s*\(([\s\S]*?)\)\s*;/i);
    if (!portMatch) {
      portsByEntity.set(ownerName, []);
      return;
    }

    const ports: string[] = [];
    splitTopLevelDelimited(portMatch[1], ';').forEach((declaration) => {
      const [namesPart] = declaration.split(':');
      if (!namesPart) return;
      parseVhdlIdentifierList(namesPart).forEach((portName) => ports.push(portName));
    });
    portsByEntity.set(ownerName, Array.from(new Set(ports)));
  };

  for (const match of content.matchAll(/\bentity\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\b([\s\S]*?)\bend(?:\s+entity)?(?:\s+[a-zA-Z][a-zA-Z0-9_]*)?\s*;/gi)) {
    collectPorts(normalizeVhdlIdentifier(match[1]), match[2] || '');
  }

  for (const match of content.matchAll(/\bcomponent\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\b([\s\S]*?)\bend\s+component(?:\s+[a-zA-Z][a-zA-Z0-9_]*)?\s*;/gi)) {
    const componentName = normalizeVhdlIdentifier(match[1]);
    if (!portsByEntity.has(componentName)) {
      collectPorts(componentName, match[2] || '');
    }
  }
  return portsByEntity;
}

function extractLocalSignals(declarativeText: string) {
  const localSignals: string[] = [];
  for (const match of declarativeText.matchAll(/\bsignal\s+([^:;]+)\s*:\s*[^;]+;/gi)) {
    const namesPart = match[1];
    if (!namesPart) continue;
    parseVhdlIdentifierList(namesPart).forEach((signalName) => localSignals.push(signalName));
  }
  return Array.from(new Set(localSignals));
}

function extractAliasesFromText(content: string) {
  const aliases: Array<[string, string]> = [];
  for (const match of content.matchAll(/\balias\s+([a-zA-Z][a-zA-Z0-9_]*)\b(?:\s*:\s*[^;]+?)?\s+\bis\s+([\s\S]*?)\s*;/gi)) {
    const aliasName = normalizeVhdlIdentifier(match[1]);
    extractIdentifierReferences(match[2] || '').forEach((reference) => {
      aliases.push([aliasName, reference]);
    });
  }
  return aliases;
}

function extractSimpleAssignments(content: string) {
  const assignments: Array<[string, string]> = [];
  for (const match of content.matchAll(/\b([a-zA-Z][a-zA-Z0-9_]*(?:\s*\([^)]*\))?)\s*(<=|:=)\s*([\s\S]*?)\s*;/gi)) {
    const target = normalizeVhdlIdentifier(match[1]);
    if (!target) continue;
    extractIdentifierReferences(match[3] || '').forEach((reference) => {
      if (reference !== target) {
        assignments.push([target, reference]);
      }
    });
  }
  return assignments;
}

function extractPortSignalReferences(rawValue: string) {
  return extractIdentifierReferences(rawValue);
}

export function extractGenerateBlocks(bodyText: string) {
  const blocks: Array<{ label: string; body: string }> = [];
  const pattern = /([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(?:if|for)\b[\s\S]*?\bgenerate\b([\s\S]*?)\bend\s+generate(?:\s+[a-zA-Z][a-zA-Z0-9_]*)?\s*;/gi;
  for (const match of bodyText.matchAll(pattern)) {
    blocks.push({
      label: normalizeVhdlIdentifier(match[1]),
      body: match[2] || '',
    });
  }
  const strippedBody = bodyText.replace(pattern, ' ');
  return { blocks, strippedBody };
}

export function extractInstancesFromArchitecture(bodyText: string, entityPorts: Map<string, string[]>, labelPrefix = '') {
  const instances: VhdlInstanceModel[] = [];
  const { blocks, strippedBody } = extractGenerateBlocks(bodyText);

  for (const match of strippedBody.matchAll(/([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(?:entity\s+work\.)?([a-zA-Z][a-zA-Z0-9_]*)(?:\s+generic\s+map\s*\(([\s\S]*?)\))?(?:\s+port\s+map\s*\(([\s\S]*?)\))\s*;/gi)) {
    const localLabel = normalizeVhdlIdentifier(match[1]);
    const label = labelPrefix ? `${labelPrefix}.${localLabel}` : localLabel;
    const entity = normalizeVhdlIdentifier(match[2]);
    const portMapText = match[4] || '';
    const rawAssociations = splitTopLevelDelimited(portMapText);
    const childPorts = entityPorts.get(entity) || [];
    const namedAssociations = rawAssociations.filter((entry) => entry.includes('=>'));
    const connections: VhdlInstanceConnection[] = [];

    if (namedAssociations.length === rawAssociations.length) {
      namedAssociations.forEach((entry) => {
        const [portPart, signalPart] = entry.split('=>');
        const signals = extractPortSignalReferences(signalPart || '');
        if (!portPart || signals.length === 0) return;
        connections.push({
          port: normalizeVhdlIdentifier(portPart),
          signals,
        });
      });
    } else {
      rawAssociations.forEach((entry, index) => {
        const signals = extractPortSignalReferences(entry);
        const port = childPorts[index];
        if (!port || signals.length === 0) return;
        connections.push({ port, signals });
      });
    }

    instances.push({
      label,
      entity,
      connections,
    });
  }

  blocks.forEach((block) => {
    const nestedPrefix = labelPrefix ? `${labelPrefix}.${block.label}` : block.label;
    instances.push(...extractInstancesFromArchitecture(block.body, entityPorts, nestedPrefix));
  });

  return instances;
}

export function buildVhdlSemanticModels(params: {
  sources: SemanticSourceSelection[];
  sourceContents: Map<string, string>;
}) {
  const { sources, sourceContents } = params;
  const entityPorts = new Map<string, string[]>();

  for (const source of sources) {
    const content = stripVhdlComments(sourceContents.get(source.path) || '');
    for (const [entityName, ports] of extractEntityPortsFromContent(content).entries()) {
      entityPorts.set(entityName, ports);
    }
  }

  const models = new Map<string, VhdlEntitySemanticModel>();
  for (const source of sources) {
    const content = stripVhdlComments(sourceContents.get(source.path) || '');
    for (const match of content.matchAll(/\barchitecture\s+([a-zA-Z][a-zA-Z0-9_]*)\s+of\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\b([\s\S]*?)\bbegin\b([\s\S]*?)\bend(?:\s+architecture)?(?:\s+[a-zA-Z][a-zA-Z0-9_]*)?\s*;/gi)) {
      const entityName = normalizeVhdlIdentifier(match[2]);
      const declarativeText = match[3] || '';
      const bodyText = match[4] || '';
      models.set(entityName, {
        name: entityName,
        sourcePath: source.path,
        ports: entityPorts.get(entityName) || [],
        localSignals: extractLocalSignals(declarativeText),
        aliases: extractAliasesFromText(`${declarativeText}\n${bodyText}`),
        assignments: extractSimpleAssignments(bodyText),
        instances: extractInstancesFromArchitecture(bodyText, entityPorts),
        generateBlockCount: extractGenerateBlocks(bodyText).blocks.length,
        isTestbench: source.isTestbench,
      });
    }
  }

  return { entityPorts, models };
}

export function inferEntityRole(model: VhdlEntitySemanticModel | undefined, entityName: string, sourcePath = '') {
  const normalizedEntity = normalizeVhdlIdentifier(entityName);
  const normalizedPath = sourcePath.toLowerCase();
  const tokenSource = `${normalizedEntity} ${normalizedPath}`;
  const portTokens = (model?.ports || []).flatMap((portName) => tokenizeSignalName(portName));
  const signalTokens = (model?.localSignals || []).flatMap((signalName) => tokenizeSignalName(signalName));
  const combinedTokens = [...portTokens, ...signalTokens];
  const tokenHas = (pattern: RegExp) => combinedTokens.some((token) => pattern.test(token)) || pattern.test(tokenSource);

  if (model?.isTestbench || /\b(tb|testbench)\b/.test(tokenSource)) {
    return 'testbench';
  }
  if (/(wrapper|top|shell|harness)/.test(tokenSource) || ((model?.ports.length || 0) === 0 && (model?.instances.length || 0) > 0)) {
    return 'wrapper';
  }
  if (tokenHas(/\b(spi|uart|i2c|axi|apb|ahb|wishbone|protocol|serial|mosi|miso|sck|sda|rx|tx)\b/)) {
    return 'protocol';
  }
  if (tokenHas(/\b(fsm|ctrl|control|sequencer|dispatch|scheduler|arbiter|state|ready|valid|req|ack)\b/)) {
    return 'control';
  }
  if (tokenHas(/\b(mem|ram|rom|fifo|cache|stack|regfile|addr|data|byte|word)\b/)) {
    return 'memory';
  }
  if (/\b(pkg|package|util|helper|common)\b/.test(tokenSource)) {
    return 'helper';
  }
  if (/\b(rtl|core|datapath|alu|decoder|engine)\b/.test(tokenSource)) {
    return 'rtl';
  }
  return 'logic';
}

function tokenizeSignalName(name: string) {
  return normalizeVhdlIdentifier(name)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function classifySignalName(name: string) {
  const normalized = normalizeVhdlIdentifier(name);
  const tokens = tokenizeSignalName(name);
  const categories = new Set<'clockReset' | 'protocol' | 'state' | 'control' | 'data' | 'debug'>();
  const hasToken = (pattern: RegExp) => tokens.some((token) => pattern.test(token)) || pattern.test(normalized);

  if (hasToken(/^(clk|clock|rst|reset|sck|scl)$/) || hasToken(/baud/)) {
    categories.add('clockReset');
  }
  if (hasToken(/(mosi|miso|sda|scl|sck|cs|ss|rx|tx|uart|spi|i2c)/)) {
    categories.add('protocol');
  }
  if (hasToken(/(state|fsm|phase|mode)/)) {
    categories.add('state');
  }
  if (hasToken(/(valid|ready|req|ack|grant|enable|busy|done|start|stop|we|re|wr|rd|cs)/)) {
    categories.add('control');
  }
  if (hasToken(/(data|addr|byte|word|count|cnt|index|payload|opcode)/)) {
    categories.add('data');
  }
  if (hasToken(/(probe|debug|trace|mon|watch)/)) {
    categories.add('debug');
  }

  return categories;
}

function createRootSet(values: Iterable<string>) {
  return new Set(Array.from(values).map((value) => normalizeVhdlIdentifier(value)).filter(Boolean));
}

function createEmptyInsight(signal: string) {
  return {
    signal: normalizeVhdlIdentifier(signal),
    categories: new Set<'clockReset' | 'protocol' | 'state' | 'control' | 'data' | 'debug'>(),
    entities: new Set<string>(),
    relatedNodes: new Set<string>(),
  };
}

function addRootsToMap(target: Map<string, Set<string>>, key: string, values: Iterable<string>) {
  const normalizedKey = normalizeVhdlIdentifier(key);
  if (!normalizedKey) return false;
  const bucket = target.get(normalizedKey) || new Set<string>();
  const beforeSize = bucket.size;
  for (const value of values) {
    const normalizedValue = normalizeVhdlIdentifier(value);
    if (normalizedValue) {
      bucket.add(normalizedValue);
    }
  }
  target.set(normalizedKey, bucket);
  return bucket.size !== beforeSize;
}

function propagateEntityRoots(model: VhdlEntitySemanticModel, seedMap: Map<string, Set<string>>) {
  const adjacency = new Map<string, Set<string>>();
  const connect = (left: string, right: string) => {
    const leftKey = normalizeVhdlIdentifier(left);
    const rightKey = normalizeVhdlIdentifier(right);
    if (!leftKey || !rightKey || leftKey === rightKey) return;
    const leftBucket = adjacency.get(leftKey) || new Set<string>();
    leftBucket.add(rightKey);
    adjacency.set(leftKey, leftBucket);
    const rightBucket = adjacency.get(rightKey) || new Set<string>();
    rightBucket.add(leftKey);
    adjacency.set(rightKey, rightBucket);
  };

  model.aliases.forEach(([left, right]) => connect(left, right));
  model.assignments.forEach(([left, right]) => connect(left, right));

  const resolved = new Map<string, Set<string>>();
  const queue: string[] = [];
  for (const [key, roots] of seedMap.entries()) {
    addRootsToMap(resolved, key, roots);
    queue.push(normalizeVhdlIdentifier(key));
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentRoots = resolved.get(current);
    if (!currentRoots) continue;
    for (const neighbor of adjacency.get(current) || []) {
      if (addRootsToMap(resolved, neighbor, currentRoots)) {
        queue.push(neighbor);
      }
    }
  }

  return resolved;
}

export function buildMacroSignalIndexFromParsedSources(params: {
  rootEntity: string;
  selectedSources: SemanticSourceSelection[];
  sourceContents: Map<string, string>;
}) {
  const { rootEntity, selectedSources, sourceContents } = params;
  const normalizedSelectedSources = selectedSources.map((source) => ({
    path: source.path,
    isTestbench: source.isTestbench,
  }));

  const { entityPorts, models } = buildVhdlSemanticModels({
    sources: normalizedSelectedSources,
    sourceContents,
  });
  const entityRoles = Object.fromEntries(
    Array.from(models.entries())
      .map(([entityName, model]) => [entityName, inferEntityRole(model, entityName, model.sourcePath)])
      .sort((left, right) => left[0].localeCompare(right[0]))
  );
  const normalizedRootEntity = normalizeVhdlIdentifier(rootEntity);
  const rootModel = models.get(normalizedRootEntity);
  const rootVisibleSignals = Array.from(new Set([
    ...(rootModel?.ports || entityPorts.get(normalizedRootEntity) || []),
    ...(rootModel?.localSignals || []),
  ])).map((signalName) => normalizeVhdlIdentifier(signalName)).filter(Boolean);
  const rootVisibleSet = createRootSet(rootVisibleSignals);

  const categoryBuckets = {
    clockReset: new Set<string>(),
    protocol: new Set<string>(),
    state: new Set<string>(),
    control: new Set<string>(),
    data: new Set<string>(),
    debug: new Set<string>(),
    all: new Set<string>(rootVisibleSignals),
  };
  const reachableEntities = new Set<string>([normalizedRootEntity]);
  const entityHierarchy = new Map<string, { parent: string; child: string; instanceLabel: string }>();
  const entityDepths = new Map<string, number>([[normalizedRootEntity, 0]]);
  const traversalVisited = new Set<string>();
  const signalInsights = new Map<string, ReturnType<typeof createEmptyInsight>>();

  const ensureInsight = (signalName: string) => {
    const normalizedSignal = normalizeVhdlIdentifier(signalName);
    const existing = signalInsights.get(normalizedSignal);
    if (existing) {
      return existing;
    }
    const created = createEmptyInsight(normalizedSignal);
    signalInsights.set(normalizedSignal, created);
    return created;
  };

  const recordSignalObservation = (recordParams: {
    signalName: string;
    entityName: string;
    nodeName: string;
    categories: Iterable<'clockReset' | 'protocol' | 'state' | 'control' | 'data' | 'debug'>;
  }) => {
    const insight = ensureInsight(recordParams.signalName);
    insight.entities.add(normalizeVhdlIdentifier(recordParams.entityName));
    insight.relatedNodes.add(normalizeVhdlIdentifier(recordParams.nodeName));
    for (const category of recordParams.categories) {
      insight.categories.add(category);
    }
  };

  const traverseEntity = (entityName: string, seedMap: Map<string, Set<string>>, depth = 0) => {
    if (depth > 10) {
      return;
    }
    const model = models.get(entityName);
    if (!model) {
      return;
    }

    const signature = `${entityName}|${Array.from(seedMap.entries()).map(([key, values]) => `${key}:${Array.from(values).sort().join(',')}`).sort().join(';')}`;
    if (traversalVisited.has(signature)) {
      return;
    }
    traversalVisited.add(signature);

    const resolved = propagateEntityRoots(model, seedMap);
    for (const [nodeName, roots] of resolved.entries()) {
      const resolvedRoots = Array.from(roots).filter((rootSignal) => rootVisibleSet.has(rootSignal));
      if (resolvedRoots.length === 0) {
        continue;
      }
      resolvedRoots.forEach((rootSignal) => categoryBuckets.all.add(rootSignal));
      const categories = classifySignalName(nodeName);
      categories.forEach((category) => {
        resolvedRoots.forEach((rootSignal) => categoryBuckets[category].add(rootSignal));
      });
      resolvedRoots.forEach((rootSignal) => {
        recordSignalObservation({
          signalName: rootSignal,
          entityName,
          nodeName,
          categories,
        });
      });
    }

    model.instances.forEach((instance) => {
      reachableEntities.add(instance.entity);
      const hierarchyKey = `${entityName}->${instance.entity}->${instance.label}`;
      entityHierarchy.set(hierarchyKey, {
        parent: entityName,
        child: instance.entity,
        instanceLabel: instance.label,
      });
      const currentDepth = entityDepths.get(instance.entity);
      if (currentDepth === undefined || depth + 1 < currentDepth) {
        entityDepths.set(instance.entity, depth + 1);
      }
      const childSeedMap = new Map<string, Set<string>>();
      instance.connections.forEach((connection) => {
        const aggregatedRoots = new Set<string>();
        connection.signals.forEach((signalName) => {
          const roots = resolved.get(normalizeVhdlIdentifier(signalName));
          if (!roots || roots.size === 0) {
            return;
          }
          roots.forEach((rootSignal) => aggregatedRoots.add(rootSignal));
        });
        if (aggregatedRoots.size > 0) {
          addRootsToMap(childSeedMap, connection.port, aggregatedRoots);
        }
      });
      if (childSeedMap.size > 0) {
        traverseEntity(instance.entity, childSeedMap, depth + 1);
      }
    });
  };

  const rootSeedMap = new Map<string, Set<string>>();
  rootVisibleSignals.forEach((signalName) => {
    addRootsToMap(rootSeedMap, signalName, [signalName]);
    const seedCategories = classifySignalName(signalName);
    seedCategories.forEach((category) => categoryBuckets[category].add(signalName));
    recordSignalObservation({
      signalName,
      entityName: normalizedRootEntity,
      nodeName: signalName,
      categories: seedCategories,
    });
  });

  if (rootModel) {
    traverseEntity(normalizedRootEntity, rootSeedMap);
  }

  return {
    rootEntity: normalizedRootEntity,
    selectedSourcePaths: normalizedSelectedSources.map((source) => source.path).sort(),
    rootVisibleSignals,
    reachableEntities: Array.from(reachableEntities).sort(),
    entityHierarchy: Array.from(entityHierarchy.values()).sort((left, right) =>
      left.parent.localeCompare(right.parent)
      || left.child.localeCompare(right.child)
      || left.instanceLabel.localeCompare(right.instanceLabel)
    ),
    entityDepths: Object.fromEntries(
      Array.from(entityDepths.entries()).sort((left, right) => left[0].localeCompare(right[0]))
    ),
    entityRoles,
    signalInsights: Array.from(signalInsights.values())
      .map((insight) => ({
        signal: insight.signal,
        categories: Array.from(insight.categories).sort(),
        entities: Array.from(insight.entities).sort(),
        relatedNodes: Array.from(insight.relatedNodes).sort(),
      }))
      .sort((left, right) => left.signal.localeCompare(right.signal)),
    categorySignals: {
      clockReset: Array.from(categoryBuckets.clockReset).sort(),
      protocol: Array.from(categoryBuckets.protocol).sort(),
      state: Array.from(categoryBuckets.state).sort(),
      control: Array.from(categoryBuckets.control).sort(),
      data: Array.from(categoryBuckets.data).sort(),
      debug: Array.from(categoryBuckets.debug).sort(),
      all: Array.from(categoryBuckets.all).sort(),
    },
  } satisfies MacroSignalIndex;
}

export function buildMacroSignalIndexFromFixtures(params: {
  rootEntity: string;
  sources: SemanticSourceFixture[];
}) {
  const sourceContents = new Map<string, string>();
  params.sources.forEach((source) => {
    sourceContents.set(source.path, source.content);
  });

  return buildMacroSignalIndexFromParsedSources({
    rootEntity: params.rootEntity,
    selectedSources: params.sources.map((source) => ({
      path: source.path,
      isTestbench: source.isTestbench,
    })),
    sourceContents,
  });
}

function countSignalTransitions(values: Array<number | string>) {
  let transitions = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (values[index] !== values[index - 1]) {
      transitions += 1;
    }
  }
  return transitions;
}

export function selectMacroSignals(params: {
  macroId: AiMacroId;
  signals: AnalyzerSignal[];
  index: MacroSignalIndex;
}) {
  const { macroId, signals, index } = params;
  const insightMap = new Map(index.signalInsights.map((insight) => [normalizeVhdlIdentifier(insight.signal), insight]));
  const entityRoleMap = new Map(Object.entries(index.entityRoles).map(([entityName, role]) => [normalizeVhdlIdentifier(entityName), role]));
  const categorySets = {
    all: createRootSet(index.categorySignals.all),
    clockReset: createRootSet(index.categorySignals.clockReset),
    protocol: createRootSet(index.categorySignals.protocol),
    state: createRootSet(index.categorySignals.state),
    control: createRootSet(index.categorySignals.control),
    data: createRootSet(index.categorySignals.data),
    debug: createRootSet(index.categorySignals.debug),
  };

  const desiredCategories: Array<keyof typeof categorySets> =
    macroId === 'protocol_decoder_details' || macroId === 'summarize_protocol_timeline'
      ? ['protocol', 'clockReset', 'control', 'data', 'all']
      : macroId === 'inspect_race_hazards' || macroId === 'verify_clock_reset_sequence'
        ? ['clockReset', 'control', 'data', 'protocol', 'debug', 'all']
        : macroId === 'explain_fsm_behavior'
          ? ['state', 'control', 'clockReset', 'data', 'all']
          : macroId === 'generate_vhdl_tb' || macroId === 'generate_vhdl_assertions' || macroId === 'draft_rtl_skeleton'
            ? ['all', 'clockReset', 'control', 'data', 'state', 'protocol']
            : macroId === 'suggest_debug_probes'
              ? ['protocol', 'clockReset', 'control', 'state', 'data', 'debug', 'all']
              : ['all', 'clockReset', 'control', 'data', 'protocol', 'state'];

  const desiredSet = new Set<string>();
  desiredCategories.forEach((category) => {
    categorySets[category].forEach((signalName) => desiredSet.add(signalName));
  });

  const preferredRoles =
    macroId === 'protocol_decoder_details' || macroId === 'summarize_protocol_timeline'
      ? ['protocol', 'wrapper', 'rtl', 'logic']
      : macroId === 'inspect_race_hazards' || macroId === 'verify_clock_reset_sequence'
        ? ['testbench', 'wrapper', 'control', 'rtl', 'logic']
        : macroId === 'explain_fsm_behavior'
          ? ['control', 'rtl', 'wrapper', 'logic']
          : macroId === 'generate_vhdl_tb' || macroId === 'generate_vhdl_assertions' || macroId === 'draft_rtl_skeleton'
            ? ['wrapper', 'rtl', 'control', 'protocol', 'logic']
            : macroId === 'suggest_debug_probes'
              ? ['protocol', 'control', 'wrapper', 'rtl', 'memory', 'logic']
              : ['rtl', 'wrapper', 'control', 'protocol', 'logic'];
  const roleWeight = (role: string | undefined) => {
    if (!role) return 0;
    const position = preferredRoles.indexOf(role);
    return position >= 0 ? Math.max(1, preferredRoles.length - position) : 0;
  };

  const scoredSignals = signals.map((signal) => {
    const normalizedName = normalizeVhdlIdentifier(getSignalName(signal));
    const insight = insightMap.get(normalizedName);
    const activityScore = Math.min(8, countSignalTransitions(getSignalValues(signal)));
    let score = 0;
    if (categorySets.all.has(normalizedName)) score += 10;
    if (categorySets.clockReset.has(normalizedName)) score += desiredCategories.includes('clockReset') ? 8 : 2;
    if (categorySets.protocol.has(normalizedName)) score += desiredCategories.includes('protocol') ? 8 : 2;
    if (categorySets.state.has(normalizedName)) score += desiredCategories.includes('state') ? 8 : 2;
    if (categorySets.control.has(normalizedName)) score += desiredCategories.includes('control') ? 6 : 2;
    if (categorySets.data.has(normalizedName)) score += desiredCategories.includes('data') ? 5 : 1;
    if (categorySets.debug.has(normalizedName)) score += desiredCategories.includes('debug') ? 5 : 1;
    score += activityScore;
    score += Math.min(6, insight?.entities.length || 0);
    score += Math.min(4, insight?.categories.length || 0);
    score += Math.max(...(insight?.entities.map((entityName) => roleWeight(entityRoleMap.get(entityName))) || [0]));

    return {
      signal,
      normalizedName,
      score,
      activityScore,
      insight,
    };
  });

  const limit =
    macroId === 'protocol_decoder_details' || macroId === 'summarize_protocol_timeline'
      ? 10
      : macroId === 'inspect_race_hazards' || macroId === 'verify_clock_reset_sequence'
        ? 12
        : macroId === 'explain_fsm_behavior'
          ? 12
          : macroId === 'custom_query'
            ? 16
            : 18;

  const mandatoryNames = scoredSignals
    .filter((entry) => desiredSet.has(entry.normalizedName))
    .sort((left, right) => right.score - left.score || left.signal.name.localeCompare(right.signal.name))
    .slice(0, Math.min(limit, Math.max(6, desiredSet.size)))
    .map((entry) => entry.normalizedName);

  const selected = scoredSignals
    .sort((left, right) => right.score - left.score || left.signal.name.localeCompare(right.signal.name))
    .filter((entry, index, array) => mandatoryNames.includes(entry.normalizedName) || (entry.score > 0 && index < limit) || (array.length <= limit))
    .slice(0, limit);

  const selectedNames = new Set(selected.map((entry) => entry.normalizedName));
  mandatoryNames.forEach((mandatoryName) => {
    if (selectedNames.has(mandatoryName)) {
      return;
    }
    const match = scoredSignals.find((entry) => entry.normalizedName === mandatoryName);
    if (match) {
      selected.push(match);
      selectedNames.add(mandatoryName);
    }
  });

  const selectedEntries = selected
    .sort((left, right) => right.score - left.score || left.signal.name.localeCompare(right.signal.name))
    .slice(0, limit);
  const mergedVisibleEntries = new Map<string, {
    signal: AnalyzerSignal;
    normalizedName: string;
    displaySignalName: string;
    score: number;
    activityScore: number;
    categories: Set<string>;
    entities: Set<string>;
    relatedNodes: Set<string>;
  }>();
  selectedEntries.forEach((entry) => {
    const displaySignalName = getSignalName(entry.signal);
    const visibleNameKey = normalizeVhdlIdentifier(displaySignalName);
    const existing = mergedVisibleEntries.get(visibleNameKey);
    if (!existing) {
      mergedVisibleEntries.set(visibleNameKey, {
        signal: entry.signal,
        normalizedName: entry.normalizedName,
        displaySignalName,
        score: entry.score,
        activityScore: entry.activityScore,
        categories: new Set(entry.insight?.categories || []),
        entities: new Set(entry.insight?.entities || []),
        relatedNodes: new Set(entry.insight?.relatedNodes || []),
      });
      return;
    }

    if (entry.score > existing.score) {
      existing.signal = entry.signal;
      existing.normalizedName = entry.normalizedName;
      existing.displaySignalName = displaySignalName;
    }
    existing.score = Math.max(existing.score, entry.score);
    existing.activityScore = Math.max(existing.activityScore, entry.activityScore);
    (entry.insight?.categories || []).forEach((category) => existing.categories.add(category));
    (entry.insight?.entities || []).forEach((entityName) => existing.entities.add(entityName));
    (entry.insight?.relatedNodes || []).forEach((nodeName) => existing.relatedNodes.add(nodeName));
  });
  const diagnosticEntries = Array.from(mergedVisibleEntries.values())
    .sort((left, right) => right.score - left.score || left.displaySignalName.localeCompare(right.displaySignalName));
  const focusEntityScores = new Map<string, number>();
  diagnosticEntries.forEach((entry) => {
    entry.entities.forEach((entityName) => {
      const normalizedEntity = normalizeVhdlIdentifier(entityName);
      const nextScore = (focusEntityScores.get(normalizedEntity) || 0)
        + entry.score
        + roleWeight(entityRoleMap.get(normalizedEntity));
      focusEntityScores.set(normalizedEntity, nextScore);
    });
  });
  const focusEntities = Array.from(focusEntityScores.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 6)
    .map(([entityName]) => entityName);

  return {
    selectedSignals: diagnosticEntries.map((entry) => entry.signal),
    selectedSignalInsights: diagnosticEntries.map((entry, index) => ({
      displayKey: `${entry.normalizedName}-${entry.displaySignalName || entry.signal.id || index}`,
      signal: entry.displaySignalName,
      normalizedSignal: entry.normalizedName,
      score: entry.score,
      activityScore: entry.activityScore,
      categories: Array.from(entry.categories).sort(),
      entities: Array.from(entry.entities).sort(),
      relatedNodes: Array.from(entry.relatedNodes).sort(),
    })),
    desiredCategories,
    focusEntities,
  };
}
