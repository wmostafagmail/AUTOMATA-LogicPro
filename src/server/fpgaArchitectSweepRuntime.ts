import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

export const FPGA_ARCHITECT_SWEEP_RUNTIME_FILES = [
  'src/server/generatedVhdlValidation.ts',
  'src/server/fpgaArchitectLoopDiagnostics.ts',
  'src/server/deterministicGeneratedCodeRepair.ts',
  'src/server/aiAnalyzeRunner.ts',
  'src/server/fpgaArchitectStressLoop.ts',
] as const;

export type FpgaArchitectSweepRuntimeInfo = {
  fingerprint: string;
  pid: number;
  sourceFiles: string[];
};

export type FpgaArchitectSweepMeta = {
  runtimeFingerprint: string;
  runtimePid: number;
  sourceFiles: string[];
  createdAt: string;
};

export async function buildFpgaArchitectSweepRuntimeInfo(): Promise<FpgaArchitectSweepRuntimeInfo> {
  const hash = createHash('sha1');
  const sourceFiles = [...FPGA_ARCHITECT_SWEEP_RUNTIME_FILES];

  for (const relativePath of sourceFiles) {
    const absolutePath = path.resolve(process.cwd(), relativePath);
    try {
      const content = await fs.readFile(absolutePath, 'utf8');
      hash.update(`FILE:${relativePath}\n`);
      hash.update(content);
      hash.update('\n');
    } catch {
      hash.update(`FILE:${relativePath}\n<MISSING>\n`);
    }
  }

  return {
    fingerprint: hash.digest('hex').slice(0, 12),
    pid: process.pid,
    sourceFiles,
  };
}

export async function readFpgaArchitectSweepMeta(metaPath: string): Promise<FpgaArchitectSweepMeta | null> {
  try {
    const raw = await fs.readFile(metaPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (
      !parsed
      || typeof parsed.runtimeFingerprint !== 'string'
      || typeof parsed.runtimePid !== 'number'
      || !Array.isArray(parsed.sourceFiles)
      || typeof parsed.createdAt !== 'string'
    ) {
      return null;
    }
    return {
      runtimeFingerprint: parsed.runtimeFingerprint,
      runtimePid: parsed.runtimePid,
      sourceFiles: parsed.sourceFiles.filter((value: unknown): value is string => typeof value === 'string'),
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}

export async function writeFpgaArchitectSweepMeta(
  metaPath: string,
  runtimeInfo: FpgaArchitectSweepRuntimeInfo,
) {
  const payload: FpgaArchitectSweepMeta = {
    runtimeFingerprint: runtimeInfo.fingerprint,
    runtimePid: runtimeInfo.pid,
    sourceFiles: runtimeInfo.sourceFiles,
    createdAt: new Date().toISOString(),
  };
  await fs.writeFile(metaPath, JSON.stringify(payload, null, 2), 'utf8');
}
