import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  buildModelQualityGuidanceSection,
  createEmptyModelQualityScoreboard,
  readModelQualityScoreboard,
  recordModelQualityAttempt,
  writeModelQualityScoreboard,
} from '../src/server/modelQualityScoreboard';

test('model quality scoreboard tracks code failures separately from provider interruptions', async () => {
  const scoreboard = createEmptyModelQualityScoreboard();

  recordModelQualityAttempt(scoreboard, {
    provider: 'ollama',
    model: 'qwen-test',
    macroId: 'fpga_vhdl_architect',
    designKey: 'alu',
    ok: false,
    failure: {
      category: 'numeric_std_typing',
      label: 'numeric_std Typing',
      ruleIds: ['ghdl-no-raw-slv-arithmetic'],
      message: 'resize on raw std_logic_vector',
    },
  });
  recordModelQualityAttempt(scoreboard, {
    provider: 'ollama',
    model: 'qwen-test',
    macroId: 'fpga_vhdl_architect',
    designKey: 'alu',
    ok: false,
    failure: {
      category: 'declaration_scope',
      label: 'Declaration Scope',
      ruleIds: ['ghdl-clocked-variable-discipline'],
      message: 'procedure declared after begin',
    },
  });
  recordModelQualityAttempt(scoreboard, {
    provider: 'ollama',
    model: 'qwen-test',
    macroId: 'fpga_vhdl_architect',
    designKey: 'alu',
    ok: false,
    failure: {
      category: 'interface_generic_port_syntax',
      label: 'Interface Syntax',
      ruleIds: ['ghdl-procedure-formals'],
      message: 'inout name : inout type',
    },
  });
  recordModelQualityAttempt(scoreboard, {
    provider: 'ollama',
    model: 'qwen-test',
    macroId: 'fpga_vhdl_architect',
    designKey: 'alu',
    ok: false,
    providerRuntimeFailure: true,
    failure: {
      category: 'provider_runtime',
      label: 'Provider / Runtime',
      ruleIds: [],
      message: 'fetch failed',
    },
  });
  recordModelQualityAttempt(scoreboard, {
    provider: 'ollama',
    model: 'qwen-test',
    macroId: 'fpga_vhdl_architect',
    designKey: 'alu',
    ok: true,
  });

  const guidance = buildModelQualityGuidanceSection({
    scoreboard,
    provider: 'ollama',
    model: 'qwen-test',
    macroId: 'fpga_vhdl_architect',
    designKey: 'alu',
  });

  assert.match(guidance, /Observed code attempts: 4; successes: 1; code-quality failures: 3; success rate: 25%/);
  assert.match(guidance, /Provider\/runtime interruptions: 1/);
  assert.match(guidance, /Conservative generation mode is required/);
  assert.match(guidance, /Prefer the app-provided golden templates/);
  assert.match(guidance, /numeric_std Typing/);
  assert.match(guidance, /ghdl-no-raw-slv-arithmetic/);
  assert.doesNotMatch(guidance, /Last evidence:/);

  const tmpPath = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-scoreboard-')), 'scoreboard.json');
  await writeModelQualityScoreboard(tmpPath, scoreboard);
  const reloaded = await readModelQualityScoreboard(tmpPath);
  const reloadedGuidance = buildModelQualityGuidanceSection({
    scoreboard: reloaded,
    provider: 'ollama',
    model: 'qwen-test',
    macroId: 'fpga_vhdl_architect',
    designKey: 'alu',
  });
  assert.match(reloadedGuidance, /numeric_std Typing/);
});

test('model quality guidance does not leak global failures into a new design by default', () => {
  const scoreboard = createEmptyModelQualityScoreboard();

  recordModelQualityAttempt(scoreboard, {
    provider: 'ollama',
    model: 'qwen-test',
    macroId: 'fpga_vhdl_architect',
    designKey: 'uart_bridge',
    ok: false,
    failure: {
      category: 'numeric_std_type_discipline',
      label: 'numeric_std Type Discipline',
      failureCode: 'resize_on_raw_std_logic_vector',
      ruleIds: ['ghdl-no-raw-slv-arithmetic'],
      message: 'src/alu.vhd:39: resize called on raw std_logic_vector operand.',
      forbiddenConstruct: 'resize(a, DATA_WIDTH)',
      legalReplacementPattern: 'cast a to unsigned or signed before resize',
    },
  });

  const cleanDesignGuidance = buildModelQualityGuidanceSection({
    scoreboard,
    provider: 'ollama',
    model: 'qwen-test',
    macroId: 'fpga_vhdl_architect',
    designKey: 'mini_cpu',
  });

  assert.equal(cleanDesignGuidance, '');

  const fallbackGuidance = buildModelQualityGuidanceSection({
    scoreboard,
    provider: 'ollama',
    model: 'qwen-test',
    macroId: 'fpga_vhdl_architect',
    designKey: 'mini_cpu',
    allowGlobalUniversalFallback: true,
  });

  assert.match(fallbackGuidance, /Scope: universal VHDL rules from global model history/);
  assert.match(fallbackGuidance, /Failure code: resize_on_raw_std_logic_vector/);
  assert.match(fallbackGuidance, /Canonical rules: ghdl-no-raw-slv-arithmetic/);
  assert.match(fallbackGuidance, /Forbidden construct: resize\(a, DATA_WIDTH\)/);
  assert.match(fallbackGuidance, /Legal replacement pattern: cast a to unsigned or signed before resize/);
  assert.doesNotMatch(fallbackGuidance, /Last evidence:/);
});
