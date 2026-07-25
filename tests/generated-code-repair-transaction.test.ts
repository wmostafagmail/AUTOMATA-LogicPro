import assert from 'node:assert/strict';
import test from 'node:test';
import { decideRepairCandidate } from '../src/server/generatedCodeRepairTransaction';
import type { GeneratedVhdlValidationResult } from '../src/server/generatedVhdlValidation';

function failure(stage: GeneratedVhdlValidationResult['stage'], count: number): GeneratedVhdlValidationResult {
  return { ok: false, stage, summary: 'failed', logs: [], validatedTopEntities: [], failureDetails: Array.from({ length: count }, (_, index) => ({ code: `failure_${index}`, category: 'other', message: 'failure', excerpt: '' })) };
}

test('repair transaction rejects earlier-stage regressions and same-score mutations', () => {
  assert.equal(decideRepairCandidate({ previous: failure('simulate', 1), candidate: failure('analyze', 1) }).accept, false);
  assert.equal(decideRepairCandidate({ previous: failure('analyze', 1), candidate: failure('analyze', 1) }).accept, false);
});

test('repair transaction accepts fewer defects, later stages, and passing candidates', () => {
  assert.equal(decideRepairCandidate({ previous: failure('prevalidate', 3), candidate: failure('prevalidate', 1) }).accept, true);
  assert.equal(decideRepairCandidate({ previous: failure('analyze', 1), candidate: failure('elaborate', 2) }).accept, true);
  assert.equal(decideRepairCandidate({ previous: failure('simulate', 1), candidate: { ...failure('simulate', 1), ok: true } }).accept, true);
});

test('repair transaction can continue a deterministic same-stage closure only after resolving the active class', () => {
  const previous = { ...failure('prevalidate', 1), failureCode: 'first_class' };
  const candidate = { ...failure('prevalidate', 1), failureCode: 'second_class', failureDetails: [{ code: 'second_class', category: 'other' as const, message: 'second', excerpt: '' }] };
  assert.equal(decideRepairCandidate({ previous, candidate }).accept, false);
  assert.equal(decideRepairCandidate({ previous, candidate, allowResolvedClassTransition: true }).accept, true);
});
