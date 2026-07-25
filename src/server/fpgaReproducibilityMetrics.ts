import { createHash } from 'crypto';
import type { FpgaArchitectProject } from './fpgaArchitect';

export function hashGeneratedFpgaVhdl(project: FpgaArchitectProject) {
  const canonical = project.files
    .filter((file) => /\.vhdl?$/i.test(file.path))
    .map((file) => ({
      path: file.path.replace(/\\/g, '/'),
      content: file.content.replace(/\r\n/g, '\n').trimEnd(),
    }))
    .sort((left, right) => left.path.localeCompare(right.path))
    .map((file) => `${file.path}\u0000${file.content}`)
    .join('\u0001');
  return createHash('sha256').update(canonical).digest('hex');
}

export function summarizeFpgaReproducibility(hashes: string[]) {
  const counts = new Map<string, number>();
  for (const hash of hashes.filter(Boolean)) counts.set(hash, (counts.get(hash) || 0) + 1);
  const mostCommonCount = Math.max(0, ...counts.values());
  return {
    sampleCount: hashes.length,
    uniqueOutputHashes: counts.size,
    reproducibilityRate: hashes.length > 0 ? mostCommonCount / hashes.length : 0,
  };
}
