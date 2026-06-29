import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRemoteExportPreviewPayload,
  computeRemoteExportPreviewHash,
  scrubProjectContextForRemoteExport,
} from '../src/exportPolicy';

test('remote export policy keeps only allowlisted project context fields and scrubs sensitive content', () => {
  const result = scrubProjectContextForRemoteExport({
    name: 'Demo Project',
    fileCount: 4,
    filePaths: [
      'rtl/top.vhd',
      'notes/readme.md',
      '.env',
      'images/logo.png',
    ],
    excerpts: [
      { path: 'rtl/top.vhd', content: 'entity top is\nend entity;\napi_key = "secret-123456"' },
      { path: '.env', content: 'OPENAI_API_KEY=abc123' },
      { path: 'images/logo.png', content: 'not-text' },
    ],
  });

  assert.ok(result);
  assert.deepEqual(result?.context.filePaths, ['rtl/top.vhd', 'notes/readme.md']);
  assert.equal(result?.context.excerpts.length, 1);
  assert.match(result?.context.excerpts[0]?.content || '', /\[REDACTED\]/);
  assert.ok(result?.redactionNotes.some((note) => /Excluded sensitive path/i.test(note)));
  assert.ok(result?.redactionNotes.some((note) => /non-allowlisted/i.test(note)));
});

test('remote export preview payload exposes explicit sections and stable hash', () => {
  const preview = buildRemoteExportPreviewPayload({
    provider: 'openai',
    model: 'gpt-test',
    macroId: 'inspect_race_hazards',
    query: 'Inspect the race hazards.',
    waveformText: '### Captured Waves Log:\nSignal Channel: clk',
    protocolMarkdown: '### Protocol Scan\nNo frames.',
    hazardMarkdown: '### Hazard Scan\nNo hazards.',
    projectText: '### Project Workspace Context\nProject Name: Demo',
    exportPolicyText: '### Remote Export Policy\n- Excluded sensitive path: .env',
    macroContract: '### Macro Output Contract\nUse selected skills.',
    finalPrompt: 'FULL PROMPT BODY',
    notes: ['Excluded sensitive path: .env'],
  });

  assert.equal(preview.schemaVersion, 1);
  assert.equal(preview.sections[0]?.id, 'query');
  assert.ok(preview.sections.some((section) => section.id === 'final_prompt'));
  assert.ok(preview.totalChars > 0);
  assert.equal(computeRemoteExportPreviewHash(preview), computeRemoteExportPreviewHash(preview));
});
