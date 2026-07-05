import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMacroExecutionPrompt,
  buildVhdlOrchestratorTaskPrompt,
  normalizePreparedPrompt,
  parseMacroExecutionParams,
} from '../src/server/aiPromptUtils';

test('buildMacroExecutionPrompt appends the macro contract to the system prompt', () => {
  const prompt = buildMacroExecutionPrompt({
    systemPrompt: 'SYSTEM',
    buildMacroPromptContract: ({ macroId, userQuery, tbGenerationMode }) => [
      `macro=${macroId}`,
      `query=${userQuery}`,
      `tb=${tbGenerationMode}`,
    ].join('\n'),
    macroId: 'generate_vhdl_tb',
    userQuery: 'Generate a testbench',
    tbGenerationMode: 'project_entities',
  });

  assert.equal(
    prompt,
    [
      'SYSTEM',
      [
        'macro=generate_vhdl_tb',
        'query=Generate a testbench',
        'tb=project_entities',
      ].join('\n'),
    ].join('\n\n'),
  );
});

test('buildVhdlOrchestratorTaskPrompt keeps the orchestrator contract and appends extra sections', () => {
  const prompt = buildVhdlOrchestratorTaskPrompt('Task body', ['### Extra\nDetails']);

  assert.match(prompt, /^@Use VHDL-skill-orchestrator/m);
  assert.match(prompt, /\n\nTask:\n\nTask body/);
  assert.match(prompt, /\n\n### Extra\nDetails$/);
});

test('normalizePreparedPrompt wraps raw prompts and preserves prepared prompts', () => {
  assert.deepEqual(normalizePreparedPrompt('raw prompt'), {
    prompt: 'raw prompt',
    selection: null,
  });

  const prepared = {
    prompt: 'prepared prompt',
    selection: { primary: 'VHDL-skill-orchestrator' },
  };
  assert.equal(normalizePreparedPrompt(prepared), prepared);
});

test('parseMacroExecutionParams normalizes macro id and TB mode defaults', () => {
  assert.deepEqual(parseMacroExecutionParams({
    macroId: 'generate_vhdl_tb',
    tbGenerationMode: 'reverse_from_vcd',
  }), {
    macroId: 'generate_vhdl_tb',
    tbGenerationMode: 'reverse_from_vcd',
  });

  assert.deepEqual(parseMacroExecutionParams({}), {
    macroId: 'custom_query',
    tbGenerationMode: null,
  });
});
