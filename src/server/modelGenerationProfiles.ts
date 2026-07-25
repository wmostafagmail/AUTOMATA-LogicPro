import { createHash } from 'crypto';

export type ModelResponseMode = 'text' | 'json';

export type ModelGenerationProfile = {
  id: 'contract_json' | 'vhdl_stage' | 'repair' | 'analysis';
  temperature: number;
  seed: number;
  maxOutputTokens: number;
  responseMode: ModelResponseMode;
};

function stablePositiveSeed(scope: string) {
  const digest = createHash('sha256').update(scope).digest();
  return Math.max(1, digest.readUInt32BE(0) & 0x7fffffff);
}

export function buildModelGenerationProfile(params: {
  id: ModelGenerationProfile['id'];
  scope: string;
  maxOutputTokens?: number;
}): ModelGenerationProfile {
  const responseMode: ModelResponseMode = params.id === 'contract_json' ? 'json' : 'text';
  const defaultOutputTokens = params.id === 'contract_json'
    ? 8_192
    : params.id === 'vhdl_stage'
      ? 12_288
      : 8_192;
  return {
    id: params.id,
    temperature: 0,
    seed: stablePositiveSeed(`${params.id}\u0000${params.scope}`),
    maxOutputTokens: params.maxOutputTokens || defaultOutputTokens,
    responseMode,
  };
}

export function buildOpenAiCompatibleGenerationOptions(profile?: ModelGenerationProfile) {
  if (!profile) return {};
  return {
    temperature: profile.temperature,
    seed: profile.seed,
    max_tokens: profile.maxOutputTokens,
    ...(profile.responseMode === 'json' ? { response_format: { type: 'json_object' } } : {}),
  };
}

export function buildOllamaGenerationOptions(profile?: ModelGenerationProfile) {
  if (!profile) return {};
  return {
    options: {
      temperature: profile.temperature,
      seed: profile.seed,
      num_predict: profile.maxOutputTokens,
    },
    ...(profile.responseMode === 'json' ? { format: 'json' } : {}),
  };
}
