import assert from 'node:assert/strict';
import test from 'node:test';
import { hashGeneratedFpgaVhdl, summarizeFpgaReproducibility } from '../src/server/fpgaReproducibilityMetrics';

test('VHDL output hashes are path-order independent and reproducibility is measurable', () => {
  const first: any = { files: [{ path: 'src/b.vhd', content: 'entity b is end;' }, { path: 'src/a.vhd', content: 'entity a is end;\n' }] };
  const second: any = { files: [...first.files].reverse() };
  const changed: any = { files: [{ path: 'src/a.vhd', content: 'entity changed is end;' }] };
  const stableHash = hashGeneratedFpgaVhdl(first);
  assert.equal(hashGeneratedFpgaVhdl(second), stableHash);
  const summary = summarizeFpgaReproducibility([stableHash, stableHash, hashGeneratedFpgaVhdl(changed)]);
  assert.equal(summary.uniqueOutputHashes, 2);
  assert.equal(summary.reproducibilityRate, 2 / 3);
});
