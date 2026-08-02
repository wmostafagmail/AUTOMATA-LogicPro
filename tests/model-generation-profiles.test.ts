import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildModelGenerationProfile,
  buildOllamaGenerationOptions,
  buildOllamaGenerationOptionsForModel,
  buildOpenAiCompatibleGenerationOptions,
  resolveOllamaMaxOutputTokens,
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

test('Ollama contract JSON output budget is capped for heavy local models', () => {
  const profile = buildModelGenerationProfile({ id: 'contract_json', scope: 'contract' });
  const heavyModel = 'hf.co/mradermacher/qwen-32b-vhdl-gpt-GGUF:Q8_0';
  const genericModel = 'some-local-coder:latest';

  assert.equal(resolveOllamaMaxOutputTokens(profile, heavyModel), 1536);
  assert.equal(resolveOllamaMaxOutputTokens(profile, genericModel), 3072);
  assert.deepEqual(buildOllamaGenerationOptionsForModel(profile, heavyModel), {
    options: { temperature: 0, seed: profile.seed, num_predict: 1536 },
    format: 'json',
  });
});
