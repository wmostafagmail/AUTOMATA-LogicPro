import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  buildFpgaArchitectureEvidenceSnapshot,
  capFpgaArchitectureEvidenceFacts,
  extractFpgaArchitectureEvidenceFacts,
  formatFpgaArchitectureEvidenceFactsForPrompt,
  isApprovedFpgaArchitectureEvidenceUrl,
} from '../src/server/fpgaArchitectureEvidence';
import { collectFpgaArchitectureEvidence } from '../src/server/fpgaArchitectureRetrieval';
import { synthesizeFpgaArchitectureBlueprintFromPrompt } from '../src/server/fpgaArchitectureBlueprint';

test('FPGA architecture evidence only accepts official allowlisted sources', () => {
  assert.equal(isApprovedFpgaArchitectureEvidenceUrl('https://docs.amd.com/r/en-US/ug949-vivado-design-methodology'), true);
  assert.equal(isApprovedFpgaArchitectureEvidenceUrl('https://www.intel.com/content/www/us/en/docs/programmable/683082/24-3/recommended-design-practices.html'), true);
  assert.equal(isApprovedFpgaArchitectureEvidenceUrl('https://random-blog.example/fpga-tips'), false);
  assert.equal(isApprovedFpgaArchitectureEvidenceUrl('http://docs.amd.com/insecure'), false);
});

test('evidence extraction emits compact source-grounded facts and caps prompt size', () => {
  const facts = extractFpgaArchitectureEvidenceFacts({
    sourceId: 'method_amd_hierarchy_ooc',
    sourceUrl: 'https://docs.amd.com/r/2020.2-English/ug892-vivado-design-flows-overview/Hierarchical-Design',
    sourceTitle: 'AMD Vivado Design Flows Overview UG892',
    sourceText: [
      'Use hierarchical design methodology to partition modules and preserve independently validatable implementation blocks.',
      'Clock and reset architecture should be explicit at the top level so downstream implementation constraints remain deterministic.',
      'This sentence is useful but should be capped per source when too many facts appear.',
    ].join(' '),
  });

  assert.equal(facts.length, 2);
  assert.equal(facts[0].sourceHash.length, 64);
  assert.match(facts[0].contractImplication, /official/i);
  assert.ok(formatFpgaArchitectureEvidenceFactsForPrompt(facts).length <= 3000);
});

test('evidence fact cap keeps no more than two facts per source and eight total', () => {
  const base = buildFpgaArchitectureEvidenceSnapshot({
    sourceId: 'method_amd_hierarchy_ooc',
    sourceUrl: 'https://docs.amd.com/r/2020.2-English/ug892-vivado-design-flows-overview/Hierarchical-Design',
    sourceTitle: 'AMD Vivado Design Flows Overview UG892',
    sourceText: 'Use hierarchical design methodology to partition architecture modules into independently validatable implementation blocks. Use hierarchy for top-level integration so module planning and validation remain deterministic.',
  }).facts[0];
  assert.ok(base);
  const facts = Array.from({ length: 12 }, (_, index) => ({
    ...base,
    factId: `fact_${index}`,
    sourceId: `source_${Math.floor(index / 3)}`,
  }));

  const capped = capFpgaArchitectureEvidenceFacts(facts);
  assert.equal(capped.length, 8);
  assert.equal(capped.filter((fact) => fact.sourceId === 'source_0').length, 2);
});

test('retrieval mode off performs no collection and cached mode reads existing snapshots only', async () => {
  const projectPath = await fs.mkdtemp(path.join(os.tmpdir(), 'fpga-evidence-'));
  const synthesis = synthesizeFpgaArchitectureBlueprintFromPrompt('Design an 8-bit ALU.');
  const off = await collectFpgaArchitectureEvidence({
    promptText: 'Design an 8-bit ALU.',
    synthesis,
    retrievalMode: 'off',
    projectPath,
  });
  assert.deepEqual(off.facts, []);
  assert.deepEqual(off.snapshots, []);

  const snapshot = buildFpgaArchitectureEvidenceSnapshot({
    sourceId: synthesis.methodologyRules[0].ruleId,
    sourceUrl: synthesis.methodologyRules[0].sourceUrl,
    sourceTitle: synthesis.methodologyRules[0].sourceTitle,
    sourceText: `${synthesis.methodologyRules[0].title}. ${synthesis.methodologyRules[0].summary} Architecture hierarchy should remain explicit and independently validatable.`,
  });
  const evidenceDir = path.join(projectPath, '.automata-logicpro', 'fpga-architecture-evidence');
  await fs.mkdir(evidenceDir, { recursive: true });
  await fs.writeFile(path.join(evidenceDir, `${synthesis.methodologyRules[0].ruleId}.json`), JSON.stringify(snapshot, null, 2));

  const cached = await collectFpgaArchitectureEvidence({
    promptText: 'Design an 8-bit ALU.',
    synthesis,
    retrievalMode: 'official_live_cached',
    projectPath,
  });
  assert.equal(cached.retrievalMode, 'official_live_cached');
  assert.equal(cached.snapshots.length, 1);
  assert.ok(cached.facts.length > 0);
});
