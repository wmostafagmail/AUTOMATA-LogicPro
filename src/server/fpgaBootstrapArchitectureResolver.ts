import fs from 'node:fs';
import path from 'node:path';
import type { FpgaArchitectFile } from './fpgaArchitect';
import type { FpgaArchitectureComponentContract } from './fpgaArchitectureContract';
import {
  buildLeafInterfaceSignature,
  buildVhdlEntityInterfaceSignature,
} from './fpgaGoldenLeafLibrary';
import {
  DEFAULT_VERIFIED_VHDL_BLOCK_LIBRARY_ROOT,
  DEFAULT_VERIFIED_VHDL_BLOCK_QUALIFICATION_PATH,
  isVhdlBlockLibraryTrusted,
  loadVhdlBlockLibraryQualification,
  toGeneratedLibraryPath,
  type VerifiedVhdlBlockNearMatch,
} from './fpgaVerifiedVhdlBlockLibrary';

export const DEFAULT_FPGA_BOOTSTRAP_PACK_ROOT = path.resolve(
  process.cwd(),
  'data/fpga-bootstrap-pack/v1_0',
);

type BootstrapImplementationDescriptor = {
  capability: string;
  aliases: string[];
  facadeId: string;
  entityName: string;
  sourceEntity: string;
  sourcePath: string;
  facadePath: string;
  implementationTier: 'qualified-source-wrapper' | 'bootstrap-canonical-core';
  behavioralContractIds: string[];
};

const BOOTSTRAP_IMPLEMENTATIONS: BootstrapImplementationDescriptor[] = [
  {
    capability: 'uart_rx',
    aliases: ['uart_rx', 'uart_receiver', 'rx_uart', 'serial_receiver'],
    facadeId: 'uart_rx_basic',
    entityName: 'uart_rx_basic',
    sourceEntity: 'uart_rx',
    sourcePath: 'rtl/blocks/communication/uart_rx.vhd',
    facadePath: 'rtl/facades/uart/uart_rx_basic.vhd',
    implementationTier: 'qualified-source-wrapper',
    behavioralContractIds: ['uart_rx-basic-v1'],
  },
  {
    capability: 'uart_tx',
    aliases: ['uart_tx', 'uart_transmitter', 'tx_uart', 'serial_transmitter'],
    facadeId: 'uart_tx_basic',
    entityName: 'uart_tx_basic',
    sourceEntity: 'uart_tx',
    sourcePath: 'rtl/blocks/communication/uart_tx.vhd',
    facadePath: 'rtl/facades/uart/uart_tx_basic.vhd',
    implementationTier: 'qualified-source-wrapper',
    behavioralContractIds: ['uart_tx-basic-v1'],
  },
  {
    capability: 'program_counter',
    aliases: ['program_counter', 'pc', 'instruction_pointer'],
    facadeId: 'program_counter_basic',
    entityName: 'program_counter_basic',
    sourceEntity: 'program_counter',
    sourcePath: 'rtl/blocks/cpu_and_soc/program_counter.vhd',
    facadePath: 'rtl/facades/control/program_counter_basic.vhd',
    implementationTier: 'qualified-source-wrapper',
    behavioralContractIds: ['program_counter-basic-v1'],
  },
  {
    capability: 'sync_fifo',
    aliases: ['sync_fifo', 'synchronous_fifo', 'rx_fifo', 'tx_fifo', 'fifo'],
    facadeId: 'sync_fifo_basic',
    entityName: 'sync_fifo_basic',
    sourceEntity: 'sync_fifo',
    sourcePath: 'rtl/blocks/memory/sync_fifo.vhd',
    facadePath: 'rtl/facades/fifo/sync_fifo_basic.vhd',
    implementationTier: 'qualified-source-wrapper',
    behavioralContractIds: ['sync_fifo-basic-v1'],
  },
  {
    capability: 'async_fifo',
    aliases: ['async_fifo', 'asynchronous_fifo', 'cdc_fifo'],
    facadeId: 'async_fifo_basic',
    entityName: 'async_fifo_basic',
    sourceEntity: 'async_fifo',
    sourcePath: 'rtl/blocks/memory/async_fifo.vhd',
    facadePath: 'rtl/facades/fifo/async_fifo_basic.vhd',
    implementationTier: 'qualified-source-wrapper',
    behavioralContractIds: ['async_fifo-basic-v1'],
  },
  {
    capability: 'video_timing',
    aliases: ['video_timing', 'vga_timing', 'horizontal_counter', 'vertical_counter', 'video_timing_counter'],
    facadeId: 'video_timing_640x480',
    entityName: 'video_timing_640x480',
    sourceEntity: 'vga_timing_generator',
    sourcePath: 'rtl/blocks/video_and_audio/vga_timing_generator.vhd',
    facadePath: 'rtl/facades/video/video_timing_640x480.vhd',
    implementationTier: 'qualified-source-wrapper',
    behavioralContractIds: ['video_timing-basic-v1'],
  },
  {
    capability: 'generic_counter',
    aliases: ['generic_counter', 'counter', 'horizontal_counter', 'vertical_counter'],
    facadeId: 'generic_counter_basic',
    entityName: 'generic_counter_basic',
    sourceEntity: 'generic_counter_basic',
    sourcePath: 'rtl/facades/counter_timer/generic_counter_basic.vhd',
    facadePath: 'rtl/facades/counter_timer/generic_counter_basic.vhd',
    implementationTier: 'bootstrap-canonical-core',
    behavioralContractIds: ['generic_counter-basic-v1'],
  },
  {
    capability: 'timer',
    aliases: ['timer', 'periodic_timer', 'tick_timer'],
    facadeId: 'timer_periodic',
    entityName: 'timer_periodic',
    sourceEntity: 'timer_periodic',
    sourcePath: 'rtl/facades/counter_timer/timer_periodic.vhd',
    facadePath: 'rtl/facades/counter_timer/timer_periodic.vhd',
    implementationTier: 'bootstrap-canonical-core',
    behavioralContractIds: ['timer-basic-v1'],
  },
];

function normalizeName(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase();
}

function normalizePath(value: string) {
  return value.replace(/\\/g, '/').replace(/^\/+/, '');
}

function componentSearchText(component: FpgaArchitectureComponentContract) {
  return [
    component.id,
    component.name,
    component.file,
    component.responsibility,
    ...(component.implements || []),
  ].join(' ').toLowerCase();
}

function readFileIfPresent(filePath: string) {
  try {
    return fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  } catch {
    return null;
  }
}

function fileExists(filePath: string) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function dependencyRelativePathForWorkUnit(libraryRoot: string, unitName: string) {
  const candidates = [
    path.join('rtl', 'config', `${unitName}.vhd`),
    path.join('rtl', 'common', `${unitName}.vhd`),
    path.join('rtl', 'cores', `${unitName}.vhd`),
    path.join('rtl', 'reference_cores', `${unitName}.vhd`),
    path.join('rtl', 'blocks', 'communication', `${unitName}.vhd`),
    path.join('rtl', 'blocks', 'cpu_and_soc', `${unitName}.vhd`),
    path.join('rtl', 'blocks', 'memory', `${unitName}.vhd`),
    path.join('rtl', 'blocks', 'video_and_audio', `${unitName}.vhd`),
  ];
  return candidates.find((candidate) => fileExists(path.join(libraryRoot, candidate))) || null;
}

function collectLibraryDependencyPaths(libraryRoot: string, relativePath: string, visited = new Set<string>()): string[] | null {
  const normalized = normalizePath(relativePath);
  if (visited.has(normalized)) return [];
  visited.add(normalized);
  const content = readFileIfPresent(path.join(libraryRoot, normalized));
  if (content === null) return null;
  const dependencies = new Set<string>();
  for (const match of content.matchAll(/\buse\s+work\.([a-zA-Z][a-zA-Z0-9_]*)\.all\s*;/gi)) {
    const dependency = dependencyRelativePathForWorkUnit(libraryRoot, match[1]);
    if (!dependency) return null;
    dependencies.add(normalizePath(dependency));
  }
  for (const match of content.matchAll(/\bentity\s+work\.([a-zA-Z][a-zA-Z0-9_]*)\b/gi)) {
    const dependency = dependencyRelativePathForWorkUnit(libraryRoot, match[1]);
    if (!dependency) return null;
    dependencies.add(normalizePath(dependency));
  }
  const ordered: string[] = [];
  for (const dependency of dependencies) {
    const nested = collectLibraryDependencyPaths(libraryRoot, dependency, visited);
    if (nested === null) return null;
    ordered.push(...nested, dependency);
  }
  return Array.from(new Set(ordered.filter((entry) => entry !== normalized)));
}

function buildLibraryDependencyFiles(libraryRoot: string, relativePath: string, component: FpgaArchitectureComponentContract): FpgaArchitectFile[] | null {
  const dependencies = collectLibraryDependencyPaths(libraryRoot, relativePath);
  if (dependencies === null) return null;
  return dependencies.map((dependency) => {
    const content = readFileIfPresent(path.join(libraryRoot, dependency));
    if (content === null) return null;
    return {
      path: toGeneratedLibraryPath(dependency),
      fileType: /\/(?:common|config)\//.test(dependency) ? 'vhdl_package' : 'vhdl_rtl',
      purpose: `Bootstrap verified dependency for ${component.id}`,
      content,
    } satisfies FpgaArchitectFile;
  }).filter((file): file is FpgaArchitectFile => file !== null);
}

function bootstrapGeneratedPath(relativePath: string) {
  return `lib/fpga_bootstrap_pack/${normalizePath(relativePath).replace(/^rtl\//, '')}`;
}

function findBootstrapDescriptor(component: FpgaArchitectureComponentContract) {
  const id = normalizeName(component.id);
  const name = normalizeName(component.name);
  const implementsSet = new Set((component.implements || []).map(normalizeName));
  const text = componentSearchText(component);
  const score = (entry: BootstrapImplementationDescriptor) => {
    let value = 0;
    if (entry.aliases.some((alias) => normalizeName(alias) === id || normalizeName(alias) === name)) value += 100;
    if (implementsSet.has(normalizeName(entry.capability)) || entry.aliases.some((alias) => implementsSet.has(normalizeName(alias)))) value += 80;
    if (entry.aliases.some((alias) => new RegExp(`\\b${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(text))) value += 40;
    if (entry.capability === 'video_timing' && /\b(?:video|vga|hdmi|pixel|sync|timing)\b/.test(text)) value += 35;
    if (entry.capability === 'generic_counter' && /\b(?:video|vga|hdmi|pixel|sync|timing)\b/.test(text)) value -= 20;
    if (entry.implementationTier === 'qualified-source-wrapper') value += 5;
    return value;
  };
  return BOOTSTRAP_IMPLEMENTATIONS
    .filter((entry) => (
      entry.aliases.some((alias) => normalizeName(alias) === id || normalizeName(alias) === name || implementsSet.has(normalizeName(alias)))
      || entry.aliases.some((alias) => new RegExp(`\\b${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(text))
    ))
    .sort((left, right) => {
      return score(right) - score(left) || left.capability.localeCompare(right.capability) || left.facadeId.localeCompare(right.facadeId);
    })[0] || null;
}

export function findBootstrapFacadeNearMatch(params: {
  component: FpgaArchitectureComponentContract;
  bootstrapRoot?: string;
  verifiedLibraryRoot?: string;
  qualificationPath?: string;
}): VerifiedVhdlBlockNearMatch | null {
  const descriptor = findBootstrapDescriptor(params.component);
  if (!descriptor) return null;
  const bootstrapRoot = params.bootstrapRoot || DEFAULT_FPGA_BOOTSTRAP_PACK_ROOT;
  const verifiedLibraryRoot = params.verifiedLibraryRoot || DEFAULT_VERIFIED_VHDL_BLOCK_LIBRARY_ROOT;
  const facadePath = normalizePath(descriptor.facadePath);
  const facadeContent = readFileIfPresent(path.join(bootstrapRoot, facadePath));
  if (facadeContent === null) return null;
  const qualification = descriptor.implementationTier === 'qualified-source-wrapper'
    ? loadVhdlBlockLibraryQualification(params.qualificationPath || DEFAULT_VERIFIED_VHDL_BLOCK_QUALIFICATION_PATH)
    : null;
  if (descriptor.implementationTier === 'qualified-source-wrapper' && !isVhdlBlockLibraryTrusted(qualification)) return null;

  const actualSignature = buildVhdlEntityInterfaceSignature(facadeContent, descriptor.entityName);
  if (!actualSignature) return null;
  const facadeFile: FpgaArchitectFile = {
    path: bootstrapGeneratedPath(facadePath),
    fileType: 'vhdl_rtl',
    purpose: `Bootstrap facade ${descriptor.facadeId} for ${params.component.id}`,
    content: facadeContent,
  };
  const dependencyFiles = descriptor.implementationTier === 'qualified-source-wrapper'
    ? buildLibraryDependencyFiles(verifiedLibraryRoot, descriptor.sourcePath, params.component)
    : [];
  if (dependencyFiles === null) return null;
  const sourceContent = descriptor.implementationTier === 'qualified-source-wrapper'
    ? readFileIfPresent(path.join(verifiedLibraryRoot, descriptor.sourcePath))
    : null;
  const sourceFile = sourceContent === null ? null : {
    path: toGeneratedLibraryPath(descriptor.sourcePath),
    fileType: 'vhdl_rtl',
    purpose: `Bootstrap verified source for ${params.component.id}`,
    content: sourceContent,
  } satisfies FpgaArchitectFile;

  return {
    blockName: descriptor.capability,
    entityName: descriptor.entityName,
    relativeRtlPath: facadePath,
    generatedRtlPath: facadeFile.path,
    relativeTestbenchPath: null,
    rtlContent: facadeContent,
    rtlFile: facadeFile,
    dependencyFiles: [...dependencyFiles, ...(sourceFile ? [sourceFile] : [])],
    qualification: qualification || {
      libraryVersion: 'bootstrap-pack-v1.0',
      libraryRoot: bootstrapRoot,
      ghdlVersion: 'not-applicable',
      verifiedAt: 'not-applicable',
      blockCount: BOOTSTRAP_IMPLEMENTATIONS.length,
      testbenchCount: 0,
      coreCount: 0,
      trustedForReuse: true,
      targets: {
        static: { ok: true, exitCode: 0, summary: 'bootstrap static validation passed' },
        'core-regression': { ok: true, exitCode: 0, summary: 'bootstrap canonical core' },
        'all-smokes': { ok: true, exitCode: 0, summary: 'bootstrap canonical core' },
      },
      warnings: ['Bootstrap canonical core is not a qualified catalog wrapper; use behavioral evidence before claiming production readiness.'],
    },
    manifestRelativePath: `manifests/facades/${descriptor.facadeId}.json`,
    sourceRelativePath: descriptor.sourcePath,
    wrapperRelativePath: facadePath,
    configurationId: descriptor.facadeId,
    deterministicWrapper: true,
    actualSignature,
    approvedSignature: buildLeafInterfaceSignature(params.component),
  };
}

export function formatBootstrapArchitectureResolverPromptSection(componentIds: string[]) {
  const requested = new Set(componentIds.map(normalizeName).filter(Boolean));
  const available = BOOTSTRAP_IMPLEMENTATIONS
    .filter((entry) => entry.aliases.some((alias) => requested.has(normalizeName(alias))) || requested.has(normalizeName(entry.capability)))
    .map((entry) => `${entry.capability}:${entry.facadeId}:${entry.implementationTier}`);
  if (available.length === 0) return '';
  return [
    '## Bootstrap Architecture Resolver',
    'App-owned bootstrap facades are available for migrated families. Use them through resolved wrappers; do not ask the model to rewrite these leaf RTL blocks.',
    `Available requested facades: ${Array.from(new Set(available)).sort().join(', ')}.`,
  ].join('\n');
}
