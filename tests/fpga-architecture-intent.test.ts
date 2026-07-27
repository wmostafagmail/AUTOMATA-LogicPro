import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDeterministicFpgaArchitectureIntent,
  buildFpgaArchitectureIntentClarificationIssues,
  buildFpgaArchitectureIntentExtractionPrompt,
  extractFpgaArchitectureIntentSource,
  parseFpgaArchitectureIntent,
  validateFpgaArchitectureIntentCompleteness,
} from '../src/server/fpgaArchitectureIntent';

test('strict intent extraction prompt forbids acronym guessing', () => {
  const prompt = buildFpgaArchitectureIntentExtractionPrompt({
    userRequest: 'Design a 16-bit CUPG.',
  });

  assert.match(prompt, /Do not assume missing intent/i);
  assert.match(prompt, /16-bit CUPG/i);
  assert.match(prompt, /must not become CPU/i);
  assert.match(prompt, /Return exactly one JSON object/i);
});

test('16-bit CPU extracts CPU class and width without clarification', () => {
  const intent = buildDeterministicFpgaArchitectureIntent('Design a 16-bit CPU core.');
  const validation = validateFpgaArchitectureIntentCompleteness(intent, 'Design a 16-bit CPU core.');

  assert.equal(validation.ok, true, JSON.stringify(validation.clarificationRequest, null, 2));
  assert.equal(intent.designClassCandidates[0]?.designClass, 'cpu_core');
  assert.deepEqual(intent.explicitRequirements.widths, ['16-bit']);
  assert.ok(intent.acceptedAppDefaults?.some((entry) => /clock/i.test(entry)));
});

test('16-bit CUPG asks for clarification instead of assuming CPU', () => {
  const request = 'Design a 16-bit CUPG.';
  const intent = buildDeterministicFpgaArchitectureIntent(request);
  const validation = validateFpgaArchitectureIntentCompleteness(intent, request);

  assert.equal(validation.ok, false);
  assert.ok(intent.unknownRequirements.includes('unknown_acronym:CUPG'));
  assert.match(validation.clarificationRequest?.questions.join('\n') || '', /What does CUPG mean/i);
  const issues = buildFpgaArchitectureIntentClarificationIssues(validation.clarificationRequest!);
  assert.ok(issues.some((issue) => issue.code === 'architecture_intent_ambiguous_design_class'));
  assert.ok(issues.some((issue) => issue.code === 'architecture_intent_clarification_required'));
});

test('intent extraction ignores FPGA Architect wrapper and manifest instructions', () => {
  const wrappedPrompt = [
    'Return a compact Markdown project manifest with one "# FILE:" block per generated file.',
    'Generate GHDL scripts and JSON plan files.',
    '',
    'User design request:',
    'Design a 16-bit CPU core.',
  ].join('\n');
  const source = extractFpgaArchitectureIntentSource(wrappedPrompt);
  const intent = buildDeterministicFpgaArchitectureIntent(wrappedPrompt);
  const validation = validateFpgaArchitectureIntentCompleteness(intent, source);

  assert.equal(source, 'Design a 16-bit CPU core.');
  assert.equal(validation.ok, true, JSON.stringify(validation.clarificationRequest, null, 2));
  assert.equal(intent.designClassCandidates[0]?.designClass, 'cpu_core');
  assert.equal(intent.unknownRequirements.some((entry) => /FILE|JSON/.test(entry)), false);
});

test('app-owned sweep design specs are treated as sufficiently specified', () => {
  const sweepPrompt = [
    'Global macro instructions mention # FILE blocks and JSON manifests.',
    '---',
    '# FPGA Architect Design Spec',
    '## Sweep Context',
    '- Sweep design 1/5: UART-to-SPI Protocol Bridge with FIFOs',
    '- Mandatory design class: uart_spi_protocol_bridge',
    '- Project name: uart_spi_protocol_bridge',
    '- Output root: /tmp/generated',
    '',
    '## Objective',
    'Create a UART to SPI bridge with RX FIFO, TX FIFO, SCLK, MOSI, and MISO pins.',
    '',
    '## Verification Requirements',
    '- Self-checking testbench must report PASS or FAIL.',
    '',
    '## User Request',
    'Use the structured design spec above as mandatory source-of-truth detail for this sweep attempt.',
  ].join('\n');
  const source = extractFpgaArchitectureIntentSource(sweepPrompt);
  const intent = buildDeterministicFpgaArchitectureIntent(sweepPrompt);
  const validation = validateFpgaArchitectureIntentCompleteness(intent, source);

  assert.match(source, /Mandatory design class: uart_spi_protocol_bridge/);
  assert.doesNotMatch(source, /Output root:/);
  assert.equal(validation.ok, true, JSON.stringify(validation.clarificationRequest, null, 2));
  assert.equal(intent.unknownRequirements.length, 0);
});

test('intent parser keeps only evidence-backed inferred requirements', () => {
  const intent = parseFpgaArchitectureIntent(JSON.stringify({
    schemaVersion: '1.0',
    explicitRequirements: { widths: ['16-bit'] },
    inferredRequirements: {
      designClass: [
        { value: 'cpu_core', evidence: 'CPU', confidence: 0.9 },
        { value: 'bad_without_evidence', evidence: '', confidence: 0.9 },
      ],
    },
    unknownRequirements: ['externalInterfaces'],
    designClassCandidates: [{ designClass: 'cpu_core', confidence: 0.9, evidence: 'CPU' }],
    confidenceByField: { designClass: 0.9 },
    clarificationQuestions: ['Which external interface should be exposed?'],
  }));

  assert.deepEqual(intent.explicitRequirements.widths, ['16-bit']);
  assert.equal(intent.inferredRequirements.designClass.length, 1);
  assert.equal(intent.inferredRequirements.designClass[0].value, 'cpu_core');
  assert.deepEqual(intent.unknownRequirements, ['externalInterfaces']);
});
