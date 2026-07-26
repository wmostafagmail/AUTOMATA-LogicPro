import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import type { FpgaArchitectProject } from './fpgaArchitect';
import type { FpgaArchitectureComponentContract, FpgaArchitectureContract } from './fpgaArchitectureContract';
import { hashFpgaArchitectureContract } from './fpgaArchitectureContract';
import { parseVhdlSemanticModel } from './vhdlSemanticFrontend';

export const FPGA_GOLDEN_LEAF_LIBRARY_VERSION = 1;

export type GoldenLeafInterfaceItem = {
  name: string;
  mode: string | null;
  type: string;
  defaultValue: string | null;
};

export type GoldenLeafInterfaceSignature = {
  entityName: string;
  generics: GoldenLeafInterfaceItem[];
  ports: GoldenLeafInterfaceItem[];
};

export type GoldenLeafBehaviorSignature = {
  componentId: string;
  clockDomain: string | null;
  outputPorts: string[];
  behaviorIds: string[];
};

export type GoldenLeafBlock = {
  libraryVersion: number;
  designClass: string;
  componentId: string;
  entityName: string;
  filePath: string;
  interfaceSignature: GoldenLeafInterfaceSignature;
  behaviorSignature: GoldenLeafBehaviorSignature;
  contentHash: string;
  contractHash: string;
  sourceDesignKey: string;
  sourceAttempt: number;
  passCount: number;
  repairCount: number;
  promotedAt: string;
  vhdlContent: string;
};

export type GoldenLeafLibrary = {
  libraryVersion: number;
  blocks: GoldenLeafBlock[];
};

export type GoldenLeafComparisonKind = 'exact_match' | 'safe_adaptation' | 'unsafe_mismatch';

export type GoldenLeafComparison = {
  kind: GoldenLeafComparisonKind;
  deltas: string[];
  unsafeReasons: string[];
};

export type GoldenLeafCandidate = {
  block: GoldenLeafBlock;
  comparison: GoldenLeafComparison;
};

function normalizeType(value: string | null | undefined) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeName(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase();
}

function stableHash(value: unknown) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return createHash('sha256').update(text).digest('hex');
}

function interfaceHash(signature: GoldenLeafInterfaceSignature) {
  return stableHash(signature);
}

function behaviorHash(signature: GoldenLeafBehaviorSignature) {
  return stableHash(signature);
}

function flattenInterfaceItems(items: Array<{ names: string[]; mode: string | null; type: string; defaultValue: string | null }>) {
  return items.flatMap((item) => item.names.map((name) => ({
    name: normalizeName(name),
    mode: item.mode === null ? null : normalizeName(item.mode),
    type: normalizeType(item.type),
    defaultValue: item.defaultValue === null ? null : item.defaultValue.trim(),
  })));
}

export function buildLeafInterfaceSignature(component: FpgaArchitectureComponentContract): GoldenLeafInterfaceSignature {
  return {
    entityName: normalizeName(component.name),
    generics: component.generics.map((generic) => ({
      name: normalizeName(generic.name),
      mode: null,
      type: normalizeType(generic.type),
      defaultValue: generic.default.trim(),
    })),
    ports: component.ports.map((port) => ({
      name: normalizeName(port.name),
      mode: normalizeName(port.mode),
      type: normalizeType(port.type),
      defaultValue: null,
    })),
  };
}

export function buildVhdlEntityInterfaceSignature(content: string, entityName: string): GoldenLeafInterfaceSignature | null {
  const model = parseVhdlSemanticModel(content);
  const entity = model.entities.find((candidate) => candidate.name.toLowerCase() === entityName.toLowerCase());
  if (!entity) return null;
  return {
    entityName: normalizeName(entity.name),
    generics: flattenInterfaceItems(entity.generics),
    ports: flattenInterfaceItems(entity.ports),
  };
}

export function buildLeafBehaviorSignature(
  contract: FpgaArchitectureContract,
  component: FpgaArchitectureComponentContract,
): GoldenLeafBehaviorSignature {
  const componentPorts = new Set(component.ports.map((port) => normalizeName(port.name)));
  const behaviorIds = contract.behaviors
    .filter((behavior) => [...behavior.inputs, ...behavior.outputs].some((name) => componentPorts.has(normalizeName(name))))
    .map((behavior) => behavior.id)
    .sort();
  return {
    componentId: normalizeName(component.id),
    clockDomain: component.clockDomain ? normalizeName(component.clockDomain) : null,
    outputPorts: component.ports
      .filter((port) => port.mode === 'out' || port.mode === 'buffer' || port.mode === 'inout')
      .map((port) => normalizeName(port.name))
      .sort(),
    behaviorIds,
  };
}

function sameInterface(left: GoldenLeafInterfaceSignature, right: GoldenLeafInterfaceSignature) {
  return interfaceHash(left) === interfaceHash(right);
}

function sameClockResetSemantics(left: GoldenLeafInterfaceSignature, right: GoldenLeafInterfaceSignature) {
  const interesting = /^(?:clk|clock|clk_i|rst|reset|rst_i|reset_i)$/i;
  const leftPorts = new Map(left.ports.filter((port) => interesting.test(port.name)).map((port) => [port.name, port]));
  const rightPorts = new Map(right.ports.filter((port) => interesting.test(port.name)).map((port) => [port.name, port]));
  if (leftPorts.size !== rightPorts.size) return false;
  for (const [name, leftPort] of leftPorts) {
    const rightPort = rightPorts.get(name);
    if (!rightPort || leftPort.mode !== rightPort.mode || leftPort.type !== rightPort.type) return false;
  }
  return true;
}

function roleFamily(value: string) {
  const normalized = normalizeName(value);
  return normalized
    .replace(/^(?:rx|tx)_/, '')
    .replace(/_(?:rx|tx)$/, '')
    .replace(/_core$/, '')
    .replace(/_unit$/, '');
}

function hasUnsafeRoleChange(block: GoldenLeafBlock, component: FpgaArchitectureComponentContract) {
  const oldId = normalizeName(block.componentId);
  const newId = normalizeName(component.id);
  if (oldId === newId) return false;
  return roleFamily(oldId) !== roleFamily(newId);
}

function classifyInterfaceDeltas(oldSignature: GoldenLeafInterfaceSignature, newSignature: GoldenLeafInterfaceSignature) {
  const deltas: string[] = [];
  const unsafeReasons: string[] = [];
  const oldPorts = new Map(oldSignature.ports.map((port) => [port.name, port]));
  const newPorts = new Map(newSignature.ports.map((port) => [port.name, port]));
  const oldGenerics = new Map(oldSignature.generics.map((generic) => [generic.name, generic]));
  const newGenerics = new Map(newSignature.generics.map((generic) => [generic.name, generic]));

  if (oldSignature.entityName !== newSignature.entityName) {
    deltas.push(`entity name: ${oldSignature.entityName} -> ${newSignature.entityName}`);
  }

  for (const [name, oldPort] of oldPorts) {
    const nextPort = newPorts.get(name);
    if (!nextPort) {
      unsafeReasons.push(`removed port ${name}`);
      continue;
    }
    if (oldPort.mode !== nextPort.mode) unsafeReasons.push(`changed mode for port ${name}: ${oldPort.mode} -> ${nextPort.mode}`);
    if (oldPort.type !== nextPort.type) deltas.push(`port ${name} type: ${oldPort.type} -> ${nextPort.type}`);
  }
  for (const [name, nextPort] of newPorts) {
    if (oldPorts.has(name)) continue;
    const statusOutput = /^(?:done|valid|ready|error|status)(?:_o|_out)?$/i.test(name);
    if (nextPort.mode === 'out' && statusOutput) {
      deltas.push(`added owned status output ${name}: ${nextPort.type}`);
    } else {
      unsafeReasons.push(`added non-status port ${name}`);
    }
  }

  for (const [name, oldGeneric] of oldGenerics) {
    const nextGeneric = newGenerics.get(name);
    if (!nextGeneric) {
      unsafeReasons.push(`removed generic ${name}`);
      continue;
    }
    if (oldGeneric.type !== nextGeneric.type) unsafeReasons.push(`changed type for generic ${name}: ${oldGeneric.type} -> ${nextGeneric.type}`);
    if (oldGeneric.defaultValue !== nextGeneric.defaultValue) deltas.push(`generic ${name} default: ${oldGeneric.defaultValue} -> ${nextGeneric.defaultValue}`);
  }
  for (const [name, nextGeneric] of newGenerics) {
    if (oldGenerics.has(name)) continue;
    if (/depth|width|size|bits|count|addr/i.test(name)) {
      deltas.push(`added bounded generic ${name}: ${nextGeneric.type} := ${nextGeneric.defaultValue}`);
    } else {
      unsafeReasons.push(`added generic ${name}`);
    }
  }

  return { deltas, unsafeReasons };
}

export function compareGoldenLeafToComponent(
  block: GoldenLeafBlock,
  component: FpgaArchitectureComponentContract,
  contract: FpgaArchitectureContract,
): GoldenLeafComparison {
  const targetInterface = buildLeafInterfaceSignature(component);
  const targetBehavior = buildLeafBehaviorSignature(contract, component);
  const deltas: string[] = [];
  const unsafeReasons: string[] = [];

  if (normalizeName(block.designClass) !== normalizeName(contract.designClass)) {
    unsafeReasons.push(`design class changed: ${block.designClass} -> ${contract.designClass}`);
  }
  if (hasUnsafeRoleChange(block, component)) {
    unsafeReasons.push(`component role changed: ${block.componentId} -> ${component.id}`);
  }
  if (block.behaviorSignature.clockDomain !== targetBehavior.clockDomain) {
    unsafeReasons.push(`clock domain changed: ${block.behaviorSignature.clockDomain || '(none)'} -> ${targetBehavior.clockDomain || '(none)'}`);
  }
  if (block.behaviorSignature.outputPorts.join('|') !== targetBehavior.outputPorts.join('|')) {
    unsafeReasons.push(`output ownership changed: ${block.behaviorSignature.outputPorts.join(',') || '(none)'} -> ${targetBehavior.outputPorts.join(',') || '(none)'}`);
  }
  if (block.behaviorSignature.behaviorIds.join('|') !== targetBehavior.behaviorIds.join('|')) {
    deltas.push(`behavior contracts: ${block.behaviorSignature.behaviorIds.join(',') || '(none)'} -> ${targetBehavior.behaviorIds.join(',') || '(none)'}`);
  }

  const interfaceDelta = classifyInterfaceDeltas(block.interfaceSignature, targetInterface);
  deltas.push(...interfaceDelta.deltas);
  unsafeReasons.push(...interfaceDelta.unsafeReasons);

  if (!sameClockResetSemantics(block.interfaceSignature, targetInterface)) {
    unsafeReasons.push('clock/reset interface semantics changed');
  }

  if (
    sameInterface(block.interfaceSignature, targetInterface)
    && behaviorHash(block.behaviorSignature) === behaviorHash(targetBehavior)
    && unsafeReasons.length === 0
  ) {
    return { kind: 'exact_match', deltas, unsafeReasons };
  }
  if (unsafeReasons.length === 0 && deltas.length > 0) {
    return { kind: 'safe_adaptation', deltas, unsafeReasons };
  }
  return { kind: 'unsafe_mismatch', deltas, unsafeReasons };
}

export function buildGoldenLeafLibraryPath(projectPath: string) {
  return path.join(projectPath, '.automata-logicpro', 'fpga-golden-leaf-library.json');
}

export async function readGoldenLeafLibrary(libraryPath: string): Promise<GoldenLeafLibrary> {
  try {
    const parsed = JSON.parse(await fs.readFile(libraryPath, 'utf8'));
    return {
      libraryVersion: FPGA_GOLDEN_LEAF_LIBRARY_VERSION,
      blocks: Array.isArray(parsed?.blocks) ? parsed.blocks : [],
    };
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return { libraryVersion: FPGA_GOLDEN_LEAF_LIBRARY_VERSION, blocks: [] };
    }
    throw error;
  }
}

export async function writeGoldenLeafLibrary(libraryPath: string, library: GoldenLeafLibrary) {
  await fs.mkdir(path.dirname(libraryPath), { recursive: true });
  const normalized: GoldenLeafLibrary = {
    libraryVersion: FPGA_GOLDEN_LEAF_LIBRARY_VERSION,
    blocks: library.blocks
      .map((block) => ({ ...block, libraryVersion: FPGA_GOLDEN_LEAF_LIBRARY_VERSION }))
      .sort((left, right) => (
        left.designClass.localeCompare(right.designClass)
        || left.componentId.localeCompare(right.componentId)
        || left.entityName.localeCompare(right.entityName)
        || left.contentHash.localeCompare(right.contentHash)
      )),
  };
  await fs.writeFile(libraryPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
}

function hasBlockedLeafContent(content: string, component: FpgaArchitectureComponentContract) {
  if (/\b(?:MODEL_IMPLEMENTATION|TODO|TBD|PLACEHOLDER)\b/i.test(content)) return true;
  if (/\b(?:assert|wait\s+for|report\s+"?TEST|finish)\b/i.test(content)) return true;
  const portNames = new Set(component.ports.map((port) => normalizeName(port.name)));
  return ['done_o', 'error_o', 'status_o'].some((name) => (
    !portNames.has(name) && new RegExp(`^\\s*${name}\\s*<=`, 'im').test(content)
  ));
}

export function isGoldenLeafPromotionEligible(params: {
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
  content: string;
}) {
  if (params.component.kind !== 'rtl') return false;
  if (hasBlockedLeafContent(params.content, params.component)) return false;
  const approvedSignature = buildLeafInterfaceSignature(params.component);
  const generatedSignature = buildVhdlEntityInterfaceSignature(params.content, params.component.name);
  return generatedSignature !== null && sameInterface(approvedSignature, generatedSignature);
}

export async function promotePassedLeafBlocks(params: {
  libraryPath: string;
  contract: FpgaArchitectureContract;
  project: FpgaArchitectProject;
  sourceDesignKey: string;
  sourceAttempt: number;
  repairCount: number;
}) {
  const library = await readGoldenLeafLibrary(params.libraryPath);
  let promoted = 0;
  let updated = 0;
  let skipped = 0;
  const contractHash = hashFpgaArchitectureContract(params.contract);
  const fileByPath = new Map(params.project.files.map((file) => [file.path.replace(/\\/g, '/'), file]));

  for (const component of params.contract.components.filter((candidate) => candidate.kind === 'rtl')) {
    const file = fileByPath.get(component.file.replace(/\\/g, '/'));
    if (!file || !isGoldenLeafPromotionEligible({ contract: params.contract, component, content: file.content })) {
      skipped += 1;
      continue;
    }
    const contentHash = stableHash(file.content.replace(/\r\n/g, '\n'));
    const interfaceSignature = buildLeafInterfaceSignature(component);
    const behaviorSignature = buildLeafBehaviorSignature(params.contract, component);
    const existing = library.blocks.find((block) => (
      normalizeName(block.designClass) === normalizeName(params.contract.designClass)
      && normalizeName(block.componentId) === normalizeName(component.id)
      && interfaceHash(block.interfaceSignature) === interfaceHash(interfaceSignature)
      && block.contentHash === contentHash
    ));
    if (existing) {
      existing.passCount += 1;
      existing.repairCount = Math.min(existing.repairCount, params.repairCount);
      existing.promotedAt = new Date().toISOString();
      updated += 1;
      continue;
    }
    library.blocks.push({
      libraryVersion: FPGA_GOLDEN_LEAF_LIBRARY_VERSION,
      designClass: params.contract.designClass,
      componentId: component.id,
      entityName: component.name,
      filePath: component.file,
      interfaceSignature,
      behaviorSignature,
      contentHash,
      contractHash,
      sourceDesignKey: params.sourceDesignKey,
      sourceAttempt: params.sourceAttempt,
      passCount: 1,
      repairCount: params.repairCount,
      promotedAt: new Date().toISOString(),
      vhdlContent: file.content.replace(/\r\n/g, '\n'),
    });
    promoted += 1;
  }

  await writeGoldenLeafLibrary(params.libraryPath, library);
  return { promoted, updated, skipped };
}

export async function findGoldenLeafCandidate(params: {
  libraryPath: string;
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
  allowSinglePassFallback?: boolean;
}): Promise<GoldenLeafCandidate | null> {
  const library = await readGoldenLeafLibrary(params.libraryPath);
  const candidates = library.blocks
    .filter((block) => normalizeName(block.designClass) === normalizeName(params.contract.designClass))
    .filter((block) => normalizeName(block.componentId) === normalizeName(params.component.id) || roleFamily(block.componentId) === roleFamily(params.component.id))
    .filter((block) => block.passCount >= 2 || (params.allowSinglePassFallback && block.passCount >= 1))
    .map((block) => ({ block, comparison: compareGoldenLeafToComponent(block, params.component, params.contract) }))
    .filter((candidate) => candidate.comparison.kind !== 'unsafe_mismatch')
    .sort((left, right) => {
      const leftKindScore = left.comparison.kind === 'exact_match' ? 2 : 1;
      const rightKindScore = right.comparison.kind === 'exact_match' ? 2 : 1;
      return rightKindScore - leftKindScore || right.block.passCount - left.block.passCount || right.block.promotedAt.localeCompare(left.block.promotedAt);
    });
  return candidates[0] || null;
}

export function formatKnownGoodLeafAvailability(items: Array<{ componentId: string; passCount: number; mode: GoldenLeafComparisonKind }>) {
  if (items.length === 0) return '';
  return [
    '## Known-Good Leaf Availability',
    ...items
      .sort((left, right) => left.componentId.localeCompare(right.componentId))
      .map((item) => `- ${item.componentId}: ${item.mode}; prior passing implementations=${item.passCount}`),
  ].join('\n');
}
