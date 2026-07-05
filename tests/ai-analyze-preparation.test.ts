import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareAiAnalyzeRequest } from '../src/server/aiAnalyzePreparation';
import { createSessionManager } from '../src/server/sessionManager';

function createBaseParams(overrides: Record<string, any> = {}) {
  const sessionManager = createSessionManager({ cookieName: 'logicpro-prepare-test' });
  const session = sessionManager.getOrCreateSession(undefined);

  return {
    provider: 'ollama',
    signals: [],
    query: 'inspect this waveform',
    model: '',
    timeUnit: 'ns',
    tickDuration: 5,
    projectContext: null,
    projectPath: '',
    workspaceFileName: null,
    simulationMacroContext: null,
    macroId: 'inspect_race_hazards' as const,
    session,
    sessionManager,
    getProviderDeployment: (provider: string) => (provider === 'ollama' ? 'local' : 'remote'),
    requiresRemoteExportConsent: (provider: string) => provider !== 'ollama',
    assertApprovedProjectPath: async (_session: unknown, candidatePath: string) => candidatePath,
    analyzeWaveformHazards: () => ({ markdown: 'hazards', findings: [] }),
    analyzeProtocolFrames: () => ({ markdown: 'protocols', frames: [] }),
    getAiMacroSpec: () => ({ label: 'Inspect Hazards', generatedArtifactDirectory: null }),
    getOrBuildMacroSignalIndex: async () => null,
    selectMacroSignals: ({ signals }: { signals: any[] }) => ({
      selectedSignals: signals,
      selectedSignalInsights: [],
      focusEntities: [],
      desiredCategories: [],
    }),
    getSignalName: (signal: { name?: string }) => signal.name || 'sig',
    formatSignalValue: (value: number | string) => String(value),
    buildSignalTransitionSummary: () => 'none',
    buildProjectContextFromPath: async () => null,
    scrubProjectContextForRemoteExport: () => null,
    buildMacroPromptContract: () => 'contract',
    estimatePreprocessingTokenCount: () => 0,
    ...overrides,
  };
}

test('prepareAiAnalyzeRequest hard-fails when provider is missing', async () => {
  await assert.rejects(
    () => prepareAiAnalyzeRequest(createBaseParams({ provider: '   ' })),
    (error: any) => {
      assert.equal(error?.statusCode, 400);
      assert.match(String(error?.message || ''), /Provider is required/i);
      return true;
    }
  );
});

test('prepareAiAnalyzeRequest uses macro-specific inspect hazards system prompt content', async () => {
  const result = await prepareAiAnalyzeRequest(createBaseParams({
    signals: [
      { name: 'clk', values: ['0', '1', '0'] },
      { name: 'reset', values: ['1', '0', '0'] },
    ],
    query: 'inspect the waveform for hazards',
    analyzeWaveformHazards: () => ({ markdown: 'hazards-markdown', findings: [] }),
    analyzeProtocolFrames: () => ({ markdown: 'protocol-markdown', frames: [] }),
    getAiMacroSpec: () => ({ label: 'Inspect Hazards', generatedArtifactDirectory: null }),
  }));

  assert.match(result.systemPrompt, /System Prompt — Inspect Hazards Macro/i);
  assert.match(result.systemPrompt, /Classify each issue by severity/i);
  assert.match(result.systemPrompt, /Deterministic Hazard Scan/i);
  assert.match(result.systemPrompt, /hazards-markdown/);
  assert.match(result.systemPrompt, /vhdl-language/i);
});

test('prepareAiAnalyzeRequest uses general-design custom-query prompt when waveform forcing is not appropriate', async () => {
  const result = await prepareAiAnalyzeRequest(createBaseParams({
    macroId: 'custom_query',
    query: 'Can you design a digital clock?',
    analyzeWaveformHazards: () => ({ markdown: 'hazards-markdown', findings: [] }),
    analyzeProtocolFrames: () => ({ markdown: 'protocol-markdown', frames: [] }),
  }));

  assert.match(result.systemPrompt, /System Prompt — General FPGA \/ VHDL Design Query/i);
  assert.doesNotMatch(result.systemPrompt, /Deterministic Hazard Scan/i);
  assert.doesNotMatch(result.systemPrompt, /Deterministic Protocol Scan/i);
});
