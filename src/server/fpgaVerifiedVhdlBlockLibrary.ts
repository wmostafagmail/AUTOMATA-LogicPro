import fs from 'node:fs';
import path from 'node:path';
import type { FpgaArchitectFile } from './fpgaArchitect';
import type { FpgaArchitectureComponentContract } from './fpgaArchitectureContract';
import { buildLeafInterfaceSignature, buildVhdlEntityInterfaceSignature } from './fpgaGoldenLeafLibrary';

export const DEFAULT_VERIFIED_VHDL_BLOCK_LIBRARY_ROOT = path.resolve(
  process.cwd(),
  'data/fpga-vhdl-building-block-library/FPGA_VHDL_Building_Block_Library_10000_v2_1_pc_fix',
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
  relativeRtlPath: string;
  relativeTestbenchPath: string | null;
  rtlContent: string;
  dependencyFiles: FpgaArchitectFile[];
  qualification: VhdlBlockLibraryQualification;
};

type VerificationMatrixRow = {
  name: string;
  sourceFile: string;
  testbenchFile: string;
  implementationTier: string;
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
    path.join('rtl', 'common', `${unitName}.vhd`),
    path.join('rtl', 'cores', `${unitName}.vhd`),
  ];
  for (const candidate of candidates) {
    if (fileExists(path.join(libraryRoot, candidate))) return normalizePath(candidate);
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

function toGeneratedLibraryPath(relativePath: string) {
  return `lib/fpga_vhdl_blocks/${normalizePath(relativePath).replace(/^rtl\//, '')}`;
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
  const rtlContent = readLibraryFile(libraryRoot, row.sourceFile);
  if (rtlContent === null) return null;
  const actualSignature = buildVhdlEntityInterfaceSignature(rtlContent, params.component.name);
  const approvedSignature = buildLeafInterfaceSignature(params.component);
  if (JSON.stringify(actualSignature) !== JSON.stringify(approvedSignature)) return null;
  const dependencyPaths = collectDependencyPaths(libraryRoot, row.sourceFile);
  if (dependencyPaths === null) return null;
  const dependencyFiles = dependencyPaths.map((dependencyPath) => {
    const content = readLibraryFile(libraryRoot, dependencyPath);
    if (content === null) return null;
    return {
      path: toGeneratedLibraryPath(dependencyPath),
      fileType: dependencyPath.includes('/common/') ? 'vhdl_package' : 'vhdl_rtl',
      purpose: `Verified VHDL library dependency for ${params.component.id}`,
      content,
    } satisfies FpgaArchitectFile;
  }).filter((file): file is FpgaArchitectFile => file !== null);
  const relativeTestbenchPath = row.testbenchFile && fileExists(path.join(libraryRoot, row.testbenchFile))
    ? normalizePath(row.testbenchFile)
    : null;
  return {
    blockName: row.name,
    relativeRtlPath: normalizePath(row.sourceFile),
    relativeTestbenchPath,
    rtlContent,
    dependencyFiles,
    qualification,
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
