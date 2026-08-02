import fs from 'node:fs/promises';
import path from 'node:path';
import {
  DEFAULT_VERIFIED_VHDL_BLOCK_LIBRARY_ROOT,
  DEFAULT_VERIFIED_VHDL_BLOCK_QUALIFICATION_PATH,
  isVhdlBlockLibraryTrusted,
  loadVhdlBlockLibraryQualification,
} from './fpgaVerifiedVhdlBlockLibrary';

type LibraryIndexBlock = {
  name: string;
  category?: string;
  manifest?: string;
  wrapper?: string;
  config_id?: string;
};

type BlockManifest = {
  block?: {
    name?: string;
    entity?: string;
    category?: string;
    source?: string;
    wrapper_entity?: string;
  };
  configuration?: {
    id?: string;
    generics?: Array<{ name?: string; type?: string; default?: string; minimum?: number; maximum?: number }>;
    resolved_defaults?: Record<string, unknown>;
  };
  interface?: {
    ports?: Array<{ name?: string; direction?: string; type?: string }>;
    clock_ports?: string[];
    reset_ports?: string[];
  };
  contracts?: Record<string, unknown>;
  maturity?: Record<string, unknown>;
  generation?: {
    wrapper_path?: string;
    configuration_file?: string;
  };
};

export type VhdlLibraryTrainingRecord = {
  id: string;
  recordType: 'verified_10k_block_to_project_rtl';
  blockName: string;
  entityName: string;
  category: string;
  prompt: {
    instruction: string;
    blockSpec: Record<string, unknown>;
    dependencyPolicy: string;
  };
  completion: string;
  artifactId: string;
  runId: string;
  sourcePath: string;
  sourceContentHash?: string;
  contentHash: string;
  contractHash: string;
  evaluationOnly: boolean;
  createdAt: string;
};

export type VhdlLibraryTrainingDatasetAudit = {
  source: 'verified_10k_blocks';
  trusted: boolean;
  libraryRoot: string;
  qualificationPath: string;
  libraryVersion: string | null;
  scannedBlocks: number;
  includedRecords: number;
  excludedMissingManifest: number;
  excludedMissingSource: number;
  excludedEmptySource: number;
  excludedSecrets: number;
  excludedUntrusted: number;
  cappedAt: number;
};

function normalizePath(value: string) {
  return value.replace(/\\/g, '/').replace(/^\/+/, '');
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function looksLikeSecret(value: string) {
  return /\b(api[_-]?key|password|secret|token|bearer|github_pat_)\b/i.test(value);
}

function buildRecordId(seed: string, hash: (value: string) => string) {
  return `dataset_record_${hash(seed).slice(0, 16)}`;
}

async function loadLibraryIndex(libraryRoot: string): Promise<LibraryIndexBlock[]> {
  const index = await readJson<{ blocks?: LibraryIndexBlock[] }>(path.join(libraryRoot, 'manifests', 'library_index.json'));
  return Array.isArray(index?.blocks) ? index.blocks : [];
}

function compactManifestSpec(block: LibraryIndexBlock, manifest: BlockManifest) {
  return {
    blockName: manifest.block?.name || block.name,
    entityName: manifest.block?.entity || block.name,
    category: manifest.block?.category || block.category || 'uncategorized',
    wrapperEntity: manifest.block?.wrapper_entity || null,
    configurationId: manifest.configuration?.id || block.config_id || null,
    generics: manifest.configuration?.generics || [],
    resolvedDefaults: manifest.configuration?.resolved_defaults || {},
    ports: manifest.interface?.ports || [],
    clockPorts: manifest.interface?.clock_ports || [],
    resetPorts: manifest.interface?.reset_ports || [],
    contracts: manifest.contracts || {},
    maturity: manifest.maturity || {},
  };
}

export async function buildVerifiedVhdlLibraryTrainingRecords(params: {
  maxRecords?: number;
  libraryRoot?: string;
  qualificationPath?: string;
  nowIso: () => string;
  sha256: (value: string | Buffer) => string;
  containsSecret?: (value: string) => boolean;
}): Promise<{ records: VhdlLibraryTrainingRecord[]; audit: VhdlLibraryTrainingDatasetAudit }> {
  const libraryRoot = params.libraryRoot || DEFAULT_VERIFIED_VHDL_BLOCK_LIBRARY_ROOT;
  const qualificationPath = params.qualificationPath || DEFAULT_VERIFIED_VHDL_BLOCK_QUALIFICATION_PATH;
  const qualification = loadVhdlBlockLibraryQualification(qualificationPath);
  const trusted = isVhdlBlockLibraryTrusted(qualification);
  const cappedAt = Math.max(1, Math.min(10000, Math.floor(params.maxRecords || 10000)));
  const audit: VhdlLibraryTrainingDatasetAudit = {
    source: 'verified_10k_blocks',
    trusted,
    libraryRoot,
    qualificationPath,
    libraryVersion: qualification?.libraryVersion || null,
    scannedBlocks: 0,
    includedRecords: 0,
    excludedMissingManifest: 0,
    excludedMissingSource: 0,
    excludedEmptySource: 0,
    excludedSecrets: 0,
    excludedUntrusted: trusted ? 0 : 1,
    cappedAt,
  };
  if (!trusted) return { records: [], audit };

  const index = await loadLibraryIndex(libraryRoot);
  const records: VhdlLibraryTrainingRecord[] = [];
  const containsSecret = params.containsSecret || looksLikeSecret;
  for (const block of index) {
    if (records.length >= cappedAt) break;
    audit.scannedBlocks += 1;
    if (!block.manifest) {
      audit.excludedMissingManifest += 1;
      continue;
    }
    const manifestPath = path.join(libraryRoot, normalizePath(block.manifest));
    const manifest = await readJson<BlockManifest>(manifestPath);
    if (!manifest) {
      audit.excludedMissingManifest += 1;
      continue;
    }
    const sourceRelativePath = normalizePath(manifest.block?.source || '');
    if (!sourceRelativePath) {
      audit.excludedMissingSource += 1;
      continue;
    }
    let vhdlContent = '';
    try {
      vhdlContent = (await fs.readFile(path.join(libraryRoot, sourceRelativePath), 'utf8')).replace(/\r\n/g, '\n');
    } catch {
      audit.excludedMissingSource += 1;
      continue;
    }
    if (!vhdlContent.trim()) {
      audit.excludedEmptySource += 1;
      continue;
    }
    const blockSpec = compactManifestSpec(block, manifest);
    const payload = `${stableJson(blockSpec)}\n${vhdlContent}`;
    if (containsSecret(payload)) {
      audit.excludedSecrets += 1;
      continue;
    }
    const sourceContentHash = params.sha256(vhdlContent);
    const contentHash = params.sha256(vhdlContent.replace(/\r\n?/g, '\n').split('\n').map((line) => line.replace(/[ \t]+$/g, '')).join('\n').replace(/\n*$/, '\n'));
    const entityName = String(manifest.block?.entity || block.name);
    const blockName = String(manifest.block?.name || block.name);
    records.push({
      id: buildRecordId(`${blockName}:${contentHash}`, params.sha256),
      recordType: 'verified_10k_block_to_project_rtl',
      blockName,
      entityName,
      category: String(manifest.block?.category || block.category || 'uncategorized'),
      prompt: {
        instruction: [
          `Generate the project-mode RTL implementation for verified VHDL library block ${blockName}.`,
          'Preserve the entity interface, generic names, port names, and deterministic configuration contract.',
          'If the RTL references work-library dependencies, keep those as project dependencies rather than pretending the block is single-file standalone.',
        ].join(' '),
        blockSpec,
        dependencyPolicy: 'project_mode_dependencies_allowed_and_must_be_declared_in_manifest',
      },
      completion: vhdlContent,
      artifactId: `verified_10k:${blockName}`,
      runId: 'verified_10k_library',
      sourcePath: path.join(libraryRoot, sourceRelativePath),
      sourceContentHash,
      contentHash,
      contractHash: params.sha256(stableJson(blockSpec)),
      evaluationOnly: false,
      createdAt: params.nowIso(),
    });
  }
  audit.includedRecords = records.length;
  return { records, audit };
}
