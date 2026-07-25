import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import type { FpgaArchitectSweepPreset } from '../fpgaArchitectSweepConfig';
import {
  canonicalizeFpgaArchitectureContract,
  type FpgaArchitectureContract,
} from './fpgaArchitectureContract';

export type FpgaGoldenContractEnvelope = {
  envelopeVersion: 1;
  presetKey: string;
  presetFingerprint: string;
  contractHash: string;
  contract: FpgaArchitectureContract;
};

function stablePresetValue(preset: FpgaArchitectSweepPreset) {
  const entries = Object.entries(preset).sort(([left], [right]) => left.localeCompare(right));
  return JSON.stringify(Object.fromEntries(entries));
}

export function fingerprintFpgaSweepPreset(preset: FpgaArchitectSweepPreset) {
  return createHash('sha256').update(stablePresetValue(preset)).digest('hex');
}

export function getFpgaGoldenContractPath(directory: string, preset: FpgaArchitectSweepPreset) {
  return path.join(directory, `${preset.key}.architecture-contract.json`);
}

export async function readFpgaGoldenContract(
  directory: string,
  preset: FpgaArchitectSweepPreset,
): Promise<FpgaGoldenContractEnvelope | null> {
  try {
    const parsed = JSON.parse(await fs.readFile(getFpgaGoldenContractPath(directory, preset), 'utf8')) as FpgaGoldenContractEnvelope;
    if (
      parsed?.envelopeVersion !== 1
      || parsed.presetKey !== preset.key
      || parsed.presetFingerprint !== fingerprintFpgaSweepPreset(preset)
      || parsed.contract?.schemaVersion !== '2.0'
    ) {
      return null;
    }
    const canonical = canonicalizeFpgaArchitectureContract(parsed.contract);
    const contractHash = createHash('sha256').update(canonical).digest('hex');
    return contractHash === parsed.contractHash ? parsed : null;
  } catch (error: any) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

export async function writeFpgaGoldenContract(
  directory: string,
  preset: FpgaArchitectSweepPreset,
  contract: FpgaArchitectureContract,
) {
  if (contract.schemaVersion !== '2.0') {
    throw new Error('Only FPGA Architecture Contract V2 can be persisted as a golden sweep contract.');
  }
  const canonical = canonicalizeFpgaArchitectureContract(contract);
  const envelope: FpgaGoldenContractEnvelope = {
    envelopeVersion: 1,
    presetKey: preset.key,
    presetFingerprint: fingerprintFpgaSweepPreset(preset),
    contractHash: createHash('sha256').update(canonical).digest('hex'),
    contract,
  };
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(
    getFpgaGoldenContractPath(directory, preset),
    `${JSON.stringify(envelope, null, 2)}\n`,
    'utf8',
  );
  return envelope;
}
