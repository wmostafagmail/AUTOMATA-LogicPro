import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildModelGenerationProfile,
  buildOllamaGenerationOptions,
  buildOpenAiCompatibleGenerationOptions,
} from '../src/server/modelGenerationProfiles';

test('generation profiles are deterministic for the same stage scope', () => {
  const first = buildModelGenerationProfile({ id: 'vhdl_stage', scope: 'contract/component' });
  const second = buildModelGenerationProfile({ id: 'vhdl_stage', scope: 'contract/component' });
  const different = buildModelGenerationProfile({ id: 'vhdl_stage', scope: 'contract/other-component' });
  assert.deepEqual(first, second);
  assert.equal(first.temperature, 0);
  assert.notEqual(first.seed, different.seed);
});

test('provider option adapters preserve deterministic controls and response mode', () => {
  const profile = buildModelGenerationProfile({ id: 'contract_json', scope: 'contract' });
  assert.deepEqual(buildOllamaGenerationOptions(profile), {
    options: { temperature: 0, seed: profile.seed, num_predict: profile.maxOutputTokens },
    format: 'json',
  });
  assert.deepEqual(buildOpenAiCompatibleGenerationOptions(profile), {
    temperature: 0,
    seed: profile.seed,
    max_tokens: profile.maxOutputTokens,
    response_format: { type: 'json_object' },
  });
});
