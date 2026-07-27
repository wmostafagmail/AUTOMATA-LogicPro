import fs from 'node:fs';
import path from 'node:path';
import type { FpgaArchitectFile } from './fpgaArchitect';
import type { FpgaArchitectureComponentContract } from './fpgaArchitectureContract';
import {
  buildLeafInterfaceSignature,
  buildVhdlEntityInterfaceSignature,
  type GoldenLeafInterfaceSignature,
} from './fpgaGoldenLeafLibrary';
import { parseVhdlSemanticModel } from './vhdlSemanticFrontend';

export const DEFAULT_VERIFIED_VHDL_BLOCK_LIBRARY_ROOT = path.resolve(
  process.cwd(),
  'data/fpga-vhdl-building-block-library/FPGA_VHDL_Building_Block_Library_10000_v3_0_deterministic_config',
);

export const DEFAULT_VERIFIED_VHDL_BLOCK_QUALIFICATION_PATH = path.resolve(
  process.cwd(),
  'data/fpga-vhdl-building-block-library/qualification/latest.json',
);

export type VhdlBlockQualificationTargetName = 'static' | 'core-regression' | 'all-smokes';

export type VhdlBlockQualificationTarget = {
  ok: boolean;
  exitCode: number;
  summary: string;
};

export type VhdlBlockLibraryQualification = {
  libraryVersion: string;
  libraryRoot: string;
  ghdlVersion: string;
  verifiedAt: string;
  blockCount: number;
  testbenchCount: number;
  coreCount: number;
  trustedForReuse: boolean;
  targets: Record<VhdlBlockQualificationTargetName, VhdlBlockQualificationTarget>;
  warnings: string[];
};

export type VerifiedVhdlBlockCandidate = {
  blockName: string;
  entityName?: string;
  relativeRtlPath: string;
  relativeTestbenchPath: string | null;
  rtlContent: string;
  dependencyFiles: FpgaArchitectFile[];
  qualification: VhdlBlockLibraryQualification;
  manifestRelativePath?: string;
  sourceRelativePath?: string;
  wrapperRelativePath?: string;
  configurationId?: string;
  deterministicWrapper?: boolean;
};

export type VerifiedVhdlBlockNearMatch = VerifiedVhdlBlockCandidate & {
  entityName: string;
  generatedRtlPath: string;
  rtlFile: FpgaArchitectFile;
  actualSignature: GoldenLeafInterfaceSignature;
  approvedSignature: GoldenLeafInterfaceSignature;
};

type VerificationMatrixRow = {
  name: string;
  manifestFile?: string;
  wrapperFile?: string;
  sourceFile: string;
  testbenchFile: string;
  implementationTier: string;
};

type DeterministicLibraryIndexBlock = {
  name: string;
  category?: string;
  manifest: string;
  wrapper?: string;
  config_id?: string;
};

type DeterministicBlockManifest = {
  block?: {
    name?: string;
    entity?: string;
    source?: string;
    wrapper_entity?: string;
  };
  generation?: {
    wrapper_path?: string;
    configuration_file?: string;
  };
  configuration?: {
    id?: string;
  };
};

function normalizeName(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase();
}

function normalizePath(value: string) {
  return value.replace(/\\/g, '/').replace(/^\/+/, '');
}

function readJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function loadDeterministicLibraryIndex(libraryRoot: string): DeterministicLibraryIndexBlock[] {
  const indexPath = path.join(libraryRoot, 'manifests', 'library_index.json');
  const index = readJson<{ blocks?: DeterministicLibraryIndexBlock[] }>(indexPath);
  return Array.isArray(index?.blocks) ? index.blocks : [];
}

function loadDeterministicManifest(libraryRoot: string, relativePath: string | undefined): DeterministicBlockManifest | null {
  if (!relativePath) return null;
  return readJson<DeterministicBlockManifest>(path.join(libraryRoot, normalizePath(relativePath)));
}

export function loadVhdlBlockLibraryQualification(
  qualificationPath = DEFAULT_VERIFIED_VHDL_BLOCK_QUALIFICATION_PATH,
): VhdlBlockLibraryQualification | null {
  return readJson<VhdlBlockLibraryQualification>(qualificationPath);
}

export function isVhdlBlockLibraryTrusted(qualification: VhdlBlockLibraryQualification | null) {
  if (!qualification?.trustedForReuse) return false;
  return (['static', 'core-regression', 'all-smokes'] as const).every((target) => qualification.targets?.[target]?.ok === true);
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === ',' && !quoted) {
      cells.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

function loadVerificationMatrix(libraryRoot: string): VerificationMatrixRow[] {
  const deterministicIndex = loadDeterministicLibraryIndex(libraryRoot);
  if (deterministicIndex.length > 0) {
    return deterministicIndex.map((block) => {
      const manifest = loadDeterministicManifest(libraryRoot, block.manifest);
      const sourceFile = manifest?.block?.source || '';
      const wrapperFile = block.wrapper || manifest?.generation?.wrapper_path || '';
      return {
        name: block.name || manifest?.block?.name || '',
        manifestFile: normalizePath(block.manifest),
        wrapperFile: wrapperFile ? normalizePath(wrapperFile) : undefined,
        sourceFile: normalizePath(sourceFile || wrapperFile),
        testbenchFile: '',
        implementationTier: '',
      };
    }).filter((row) => row.name && row.sourceFile);
  }
  const matrixPath = path.join(libraryRoot, 'reports', 'verification_matrix.csv');
  try {
    const lines = fs.readFileSync(matrixPath, 'utf8').split(/\r?\n/).filter(Boolean);
    const header = parseCsvLine(lines[0] || '');
    const indexOf = (name: string) => header.indexOf(name);
    return lines.slice(1).map((line) => {
      const cells = parseCsvLine(line);
      return {
        name: cells[indexOf('name')] || '',
        sourceFile: cells[indexOf('source_file')] || '',
        testbenchFile: cells[indexOf('testbench_file')] || '',
        implementationTier: cells[indexOf('implementation_tier')] || '',
      };
    }).filter((row) => row.name && row.sourceFile);
  } catch {
    return [];
  }
}

function findBlockRow(libraryRoot: string, blockName: string) {
  const normalized = normalizeName(blockName);
  return loadVerificationMatrix(libraryRoot).find((row) => normalizeName(row.name) === normalized) || null;
}

function fileExists(filePath: string) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function readLibraryFile(libraryRoot: string, relativePath: string) {
  const normalized = normalizePath(relativePath);
  const absolutePath = path.join(libraryRoot, normalized);
  if (!fileExists(absolutePath)) return null;
  return fs.readFileSync(absolutePath, 'utf8').replace(/\r\n/g, '\n');
}

function dependencyRelativePathForWorkUnit(libraryRoot: string, unitName: string) {
  const candidates = [
    path.join('rtl', 'config', `${unitName}.vhd`),
    path.join('rtl', 'common', `${unitName}.vhd`),
    path.join('rtl', 'cores', `${unitName}.vhd`),
    path.join('rtl', 'reference_cores', `${unitName}.vhd`),
  ];
  for (const candidate of candidates) {
    if (fileExists(path.join(libraryRoot, candidate))) return normalizePath(candidate);
  }
  const normalizedUnit = normalizeName(unitName);
  for (const row of loadVerificationMatrix(libraryRoot)) {
    const manifest = loadDeterministicManifest(libraryRoot, row.manifestFile);
    if (
      normalizeName(manifest?.block?.entity) === normalizedUnit
      || normalizeName(manifest?.block?.wrapper_entity) === normalizedUnit
      || normalizeName(row.name) === normalizedUnit
    ) {
      return normalizePath(
        normalizeName(manifest?.block?.wrapper_entity) === normalizedUnit && row.wrapperFile
          ? row.wrapperFile
          : manifest?.block?.source || row.sourceFile,
      );
    }
  }
  return null;
}

function collectDependencyPaths(libraryRoot: string, relativePath: string, visited = new Set<string>()): string[] | null {
  const normalized = normalizePath(relativePath);
  if (visited.has(normalized)) return [];
  visited.add(normalized);
  const content = readLibraryFile(libraryRoot, normalized);
  if (content === null) return null;
  const dependencies = new Set<string>();
  for (const match of content.matchAll(/\buse\s+work\.([a-zA-Z][a-zA-Z0-9_]*)\.all\s*;/gi)) {
    const dependency = dependencyRelativePathForWorkUnit(libraryRoot, match[1]);
    if (!dependency) return null;
    dependencies.add(dependency);
  }
  for (const match of content.matchAll(/\bentity\s+work\.([a-zA-Z][a-zA-Z0-9_]*)\b/gi)) {
    const dependency = dependencyRelativePathForWorkUnit(libraryRoot, match[1]);
    if (!dependency) return null;
    dependencies.add(dependency);
  }
  const ordered: string[] = [];
  for (const dependency of dependencies) {
    const nested = collectDependencyPaths(libraryRoot, dependency, visited);
    if (nested === null) return null;
    ordered.push(...nested, dependency);
  }
  return Array.from(new Set(ordered.filter((entry) => entry !== normalized)));
}

export function toGeneratedLibraryPath(relativePath: string) {
  return `lib/fpga_vhdl_blocks/${normalizePath(relativePath).replace(/^rtl\//, '')}`;
}

function buildDependencyFiles(libraryRoot: string, relativePath: string, component: FpgaArchitectureComponentContract) {
  const dependencyPaths = collectDependencyPaths(libraryRoot, relativePath);
  if (dependencyPaths === null) return null;
  return dependencyPaths.map((dependencyPath) => {
    const content = readLibraryFile(libraryRoot, dependencyPath);
    if (content === null) return null;
    return {
      path: toGeneratedLibraryPath(dependencyPath),
      fileType: /\/(?:common|config)\//.test(dependencyPath) ? 'vhdl_package' : 'vhdl_rtl',
      purpose: `Verified VHDL library dependency for ${component.id}`,
      content,
    } satisfies FpgaArchitectFile;
  }).filter((file): file is FpgaArchitectFile => file !== null);
}

function findReusableEntityName(content: string, requestedEntityName: string) {
  const model = parseVhdlSemanticModel(content);
  return model.entities.find((candidate) => candidate.name.toLowerCase() === requestedEntityName.toLowerCase())?.name
    || model.entities[0]?.name
    || null;
}

export function findVerifiedVhdlBlockCandidate(params: {
  component: FpgaArchitectureComponentContract;
  libraryRoot?: string;
  qualificationPath?: string;
}): VerifiedVhdlBlockCandidate | null {
  const libraryRoot = params.libraryRoot || DEFAULT_VERIFIED_VHDL_BLOCK_LIBRARY_ROOT;
  const qualification = loadVhdlBlockLibraryQualification(params.qualificationPath);
  if (!isVhdlBlockLibraryTrusted(qualification)) return null;
  const row = findBlockRow(libraryRoot, params.component.name) || findBlockRow(libraryRoot, params.component.id);
  if (!row) return null;
  const manifest = loadDeterministicManifest(libraryRoot, row.manifestFile);
  const implementationPath = row.wrapperFile || row.sourceFile;
  const rtlContent = readLibraryFile(libraryRoot, implementationPath);
  if (rtlContent === null) return null;
  const requestedEntity = manifest?.block?.wrapper_entity || params.component.name;
  const actualSignature = buildVhdlEntityInterfaceSignature(rtlContent, requestedEntity);
  const approvedSignature = buildLeafInterfaceSignature(params.component);
  if (JSON.stringify(actualSignature) !== JSON.stringify(approvedSignature)) return null;
  const dependencyFiles = buildDependencyFiles(libraryRoot, implementationPath, params.component);
  if (dependencyFiles === null) return null;
  const relativeTestbenchPath = row.testbenchFile && fileExists(path.join(libraryRoot, row.testbenchFile))
    ? normalizePath(row.testbenchFile)
    : null;
  return {
    blockName: row.name,
    entityName: actualSignature?.entityName,
    relativeRtlPath: normalizePath(implementationPath),
    relativeTestbenchPath,
    rtlContent,
    dependencyFiles,
    qualification,
    manifestRelativePath: row.manifestFile,
    sourceRelativePath: manifest?.block?.source ? normalizePath(manifest.block.source) : normalizePath(row.sourceFile),
    wrapperRelativePath: row.wrapperFile,
    configurationId: manifest?.configuration?.id,
    deterministicWrapper: Boolean(row.wrapperFile),
  };
}

export function findVerifiedVhdlBlockNearMatch(params: {
  component: FpgaArchitectureComponentContract;
  libraryRoot?: string;
  qualificationPath?: string;
}): VerifiedVhdlBlockNearMatch | null {
  const libraryRoot = params.libraryRoot || DEFAULT_VERIFIED_VHDL_BLOCK_LIBRARY_ROOT;
  const qualification = loadVhdlBlockLibraryQualification(params.qualificationPath);
  if (!isVhdlBlockLibraryTrusted(qualification)) return null;
  const row = findBlockRow(libraryRoot, params.component.name) || findBlockRow(libraryRoot, params.component.id);
  if (!row) return null;
  const manifest = loadDeterministicManifest(libraryRoot, row.manifestFile);
  const implementationPath = row.wrapperFile || row.sourceFile;
  const rtlContent = readLibraryFile(libraryRoot, implementationPath);
  if (rtlContent === null) return null;
  const entityName = findReusableEntityName(rtlContent, manifest?.block?.wrapper_entity || params.component.name);
  if (!entityName) return null;
  const actualSignature = buildVhdlEntityInterfaceSignature(rtlContent, entityName);
  if (!actualSignature) return null;
  const approvedSignature = buildLeafInterfaceSignature(params.component);
  if (JSON.stringify(actualSignature) === JSON.stringify(approvedSignature)) return null;
  const dependencyFiles = buildDependencyFiles(libraryRoot, implementationPath, params.component);
  if (dependencyFiles === null) return null;
  const relativeRtlPath = normalizePath(implementationPath);
  const generatedRtlPath = toGeneratedLibraryPath(relativeRtlPath);
  const relativeTestbenchPath = row.testbenchFile && fileExists(path.join(libraryRoot, row.testbenchFile))
    ? normalizePath(row.testbenchFile)
    : null;
  return {
    blockName: row.name,
    entityName,
    relativeRtlPath,
    generatedRtlPath,
    relativeTestbenchPath,
    rtlContent,
    rtlFile: {
      path: generatedRtlPath,
      fileType: 'vhdl_rtl',
      purpose: `Verified VHDL library implementation wrapped for ${params.component.id}`,
      content: rtlContent,
    },
    dependencyFiles,
    qualification,
    manifestRelativePath: row.manifestFile,
    sourceRelativePath: manifest?.block?.source ? normalizePath(manifest.block.source) : normalizePath(row.sourceFile),
    wrapperRelativePath: row.wrapperFile,
    configurationId: manifest?.configuration?.id,
    deterministicWrapper: Boolean(row.wrapperFile),
    actualSignature,
    approvedSignature,
  };
}

export function formatVerifiedVhdlBlockLibraryPromptSection(blockNames: string[], options: {
  qualificationPath?: string;
} = {}) {
  const qualification = loadVhdlBlockLibraryQualification(options.qualificationPath);
  if (!qualification) return '';
  const trusted = isVhdlBlockLibraryTrusted(qualification);
  const names = Array.from(new Set(blockNames.map(normalizeName).filter(Boolean))).slice(0, 12);
  return [
    '## Verified VHDL Building-Block Library',
    trusted
      ? `A locally GHDL-qualified VHDL library is available: ${qualification.blockCount} RTL blocks, ${qualification.testbenchCount} testbenches, ${qualification.coreCount} shared cores.`
      : 'A VHDL block library is present but is not trusted for automatic reuse until static, core-regression, and all-smokes all pass locally.',
    names.length > 0
      ? `Selected block names that may have reusable VHDL if their approved entity interface matches exactly: ${names.join(', ')}.`
      : 'No selected block names were available for exact reuse lookup.',
    'Do not paste library VHDL into broad architecture proposals. Full VHDL is used only by staged leaf generation after exact interface and dependency checks.',
  ].join('\n');
}
