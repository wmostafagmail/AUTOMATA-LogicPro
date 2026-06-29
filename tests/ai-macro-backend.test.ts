import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMacroPromptContract } from '../src/aiMacroPrompting';
import { validateMacroOutput } from '../src/aiMacroValidation';
import {
  generateVhdlTbBad,
  generateVhdlTbGood,
  generateAssertionsGood,
  draftRtlSkeletonGood,
  explainFsmGood,
  inspectRaceHazardsBad,
  inspectRaceHazardsGood,
  protocolDecoderBad,
  protocolDecoderGood,
  suggestDebugProbesGood,
  summarizeProtocolTimelineGood,
  verifyClockResetGood,
} from './fixtures/aiMacroSamples';

test('project-entity VHDL TB prompt includes macro contract and mode', () => {
  const prompt = buildMacroPromptContract({
    macroId: 'generate_vhdl_tb',
    userQuery: 'Generate a testbench for the project entities.',
    tbGenerationMode: 'project_entities',
  });

  assert.match(prompt, /Macro ID: generate_vhdl_tb/);
  assert.match(prompt, /TB Generation Mode: project_entities/);
  assert.match(prompt, /## Selected Skills|Selected Skills section/i);
  assert.match(prompt, /Include at least one fenced code block tagged as `vhdl`/);
  assert.match(prompt, /Required sections or equivalents/);
});

test('reverse-from-vcd VHDL TB prompt includes waveform-specific guidance', () => {
  const prompt = buildMacroPromptContract({
    macroId: 'generate_vhdl_tb',
    userQuery: 'Reverse engineer from the waveform.',
    tbGenerationMode: 'reverse_from_vcd',
  });

  assert.match(prompt, /reverse-from-VCD mode/i);
  assert.match(prompt, /waveform-based assumptions/i);
});

test('VHDL TB validator passes minimally structured VHDL output', () => {
  const result = validateMacroOutput({
    macroId: 'generate_vhdl_tb',
    text: generateVhdlTbGood,
  });

  assert.equal(result.status, 'pass');
  assert.equal(result.checks.find((check) => check.id === 'code:vhdl')?.status, 'pass');
});

test('VHDL TB validator flags missing VHDL tags and required sections', () => {
  const result = validateMacroOutput({
    macroId: 'generate_vhdl_tb',
    text: generateVhdlTbBad,
  });

  assert.equal(result.status, 'fail');
  assert.equal(result.checks.find((check) => check.id === 'code:vhdl')?.status, 'fail');
  assert.equal(result.checks.find((check) => check.id === 'section:verification_notes')?.status, 'fail');
});

test('race hazard validator passes when deterministic findings are referenced', () => {
  const result = validateMacroOutput({
    macroId: 'inspect_race_hazards',
    text: inspectRaceHazardsGood,
    hazardFindings: [
      {
        severity: 'high',
        title: 'data_valid: setup/hold risk near clk',
        detail: 'Transition occurs within one tick of clk.',
      },
    ],
  });

  assert.equal(result.status, 'pass');
  assert.equal(result.checks.find((check) => check.id === 'deterministic:hazards')?.status, 'pass');
});

test('race hazard validator warns when deterministic findings are not grounded in the response', () => {
  const result = validateMacroOutput({
    macroId: 'inspect_race_hazards',
    text: inspectRaceHazardsBad,
    hazardFindings: [
      {
        severity: 'medium',
        title: 'req: narrow pulse suspect',
        detail: 'A two-tick pulse was detected.',
      },
    ],
  });

  assert.equal(result.status, 'warn');
  assert.equal(result.checks.find((check) => check.id === 'deterministic:hazards')?.status, 'warn');
});

test('race hazard validator accepts explicit no-hazard acknowledgement', () => {
  const result = validateMacroOutput({
    macroId: 'inspect_race_hazards',
    text: `## Hazard Summary\nNo obvious hazards detected.\n\n## Suspected Root Causes\nNone.\n\n## Recommended Fixes\nNo immediate fix required.`,
    hazardFindings: [],
  });

  assert.equal(result.checks.find((check) => check.id === 'deterministic:hazards')?.status, 'pass');
});

test('protocol validator passes when decoded frames are referenced', () => {
  const result = validateMacroOutput({
    macroId: 'protocol_decoder_details',
    text: protocolDecoderGood,
    protocolFrames: [
      {
        protocol: 'SPI',
        channel: 'spi_decoder via MOSI',
        startTick: 4,
        endTick: 25,
        summary: 'SPI byte 0xA5',
        detail: 'Decoded SPI frame 0xA5.',
      },
    ],
  });

  assert.equal(result.status, 'pass');
  assert.equal(result.checks.find((check) => check.id === 'deterministic:protocol')?.status, 'pass');
});

test('protocol validator warns when frames exist but are not referenced', () => {
  const result = validateMacroOutput({
    macroId: 'protocol_decoder_details',
    text: protocolDecoderBad,
    protocolFrames: [
      {
        protocol: 'UART',
        channel: 'uart_rx heuristic',
        startTick: 10,
        endTick: 90,
        summary: 'UART byte 0x55',
        detail: 'Decoded UART frame 0x55.',
      },
    ],
  });

  assert.equal(result.status, 'warn');
  assert.equal(result.checks.find((check) => check.id === 'deterministic:protocol')?.status, 'warn');
});

test('protocol validator accepts explicit no-frame acknowledgement', () => {
  const result = validateMacroOutput({
    macroId: 'protocol_decoder_details',
    text: `## Selected Skills\n- Primary: VHDL-skill-orchestrator\n\n## Decoded Frames\nNo deterministic SPI/I2C/UART frames were decoded.\n\n## Protocol Interpretation\nThere is not enough stable traffic to interpret.\n\n## Anomalies / Uncertainty\nThe decode remains ambiguous.`,
    protocolFrames: [],
  });

  assert.equal(result.checks.find((check) => check.id === 'deterministic:protocol')?.status, 'pass');
});

test('macro validator fails when Selected Skills section is missing', () => {
  const result = validateMacroOutput({
    macroId: 'inspect_race_hazards',
    text: `## Hazard Summary
The deterministic scan shows a setup/hold risk near clk.

## Suspected Root Causes
The issue is near the sampling edge.

## Recommended Fixes
Add synchronization or register staging.`,
    hazardFindings: [
      {
        severity: 'high',
        title: 'clk/data setup-hold risk',
        detail: 'Transition near clk',
      },
    ],
  });

  assert.equal(result.status, 'fail');
  assert.equal(result.checks.find((check) => check.id === 'section:selected_skills')?.status, 'fail');
});

test('clock/reset macro prompt includes startup-sequencing guidance', () => {
  const prompt = buildMacroPromptContract({
    macroId: 'verify_clock_reset_sequence',
    userQuery: 'Check startup sequencing.',
  });

  assert.match(prompt, /clock stability/i);
  assert.match(prompt, /reset assertion\/deassertion timing/i);
});

test('custom query prompt treats general design requests as non-waveform tasks', () => {
  const prompt = buildMacroPromptContract({
    macroId: 'custom_query',
    userQuery: 'Can you design a digital clock?',
    tbGenerationMode: null,
  });

  assert.match(prompt, /general FPGA\/VHDL design request/i);
  assert.match(prompt, /Do not force waveform decoding, protocol analysis, or logic-analyzer interpretation/i);
  assert.doesNotMatch(prompt, /You must use the deterministic protocol pre-decode as required grounding context/i);
});

test('clock/reset validator passes with grounded structured output', () => {
  const result = validateMacroOutput({
    macroId: 'verify_clock_reset_sequence',
    text: verifyClockResetGood,
    hazardFindings: [
      {
        severity: 'medium',
        title: 'reset_n: setup/hold risk near clk',
        detail: 'Reset transition occurs within one tick of clk.',
      },
    ],
  });

  assert.equal(result.status, 'pass');
});

test('FSM behavior validator passes for structured state explanation', () => {
  const result = validateMacroOutput({
    macroId: 'explain_fsm_behavior',
    text: explainFsmGood,
  });

  assert.equal(result.status, 'pass');
});

test('protocol timeline validator passes when deterministic frames are referenced', () => {
  const result = validateMacroOutput({
    macroId: 'summarize_protocol_timeline',
    text: summarizeProtocolTimelineGood,
    protocolFrames: [
      {
        protocol: 'SPI',
        channel: 'spi_decoder via MOSI',
        startTick: 2,
        endTick: 18,
        summary: 'SPI byte 0xA5',
        detail: 'Decoded SPI frame 0xA5.',
      },
    ],
  });

  assert.equal(result.status, 'pass');
});

test('VHDL assertions validator passes when tagged code blocks are present', () => {
  const result = validateMacroOutput({
    macroId: 'generate_vhdl_assertions',
    text: generateAssertionsGood,
    hazardFindings: [
      {
        severity: 'medium',
        title: 'mosi: setup/hold risk near sck',
        detail: 'MOSI changes near active sampling edge.',
      },
    ],
    protocolFrames: [
      {
        protocol: 'SPI',
        channel: 'spi_decoder via MOSI',
        startTick: 2,
        endTick: 18,
        summary: 'SPI byte 0xA5',
        detail: 'Decoded SPI frame 0xA5.',
      },
    ],
  });

  assert.equal(result.status, 'pass');
  assert.equal(result.checks.find((check) => check.id === 'code:vhdl')?.status, 'pass');
});

test('RTL skeleton validator passes when VHDL skeleton structure is present', () => {
  const result = validateMacroOutput({
    macroId: 'draft_rtl_skeleton',
    text: draftRtlSkeletonGood,
    protocolFrames: [
      {
        protocol: 'SPI',
        channel: 'spi heuristic',
        startTick: 0,
        endTick: 20,
        summary: 'SPI bytes 0xA5',
        detail: 'Decoded SPI transaction.',
      },
    ],
  });

  assert.equal(result.status, 'pass');
});

test('debug probe validator passes when blind spots, probes, and capture plan are present', () => {
  const result = validateMacroOutput({
    macroId: 'suggest_debug_probes',
    text: suggestDebugProbesGood,
    hazardFindings: [
      {
        severity: 'medium',
        title: 'req: narrow pulse suspect',
        detail: 'Two-tick pulse detected near handshake.',
      },
    ],
    protocolFrames: [
      {
        protocol: 'SPI',
        channel: 'spi heuristic',
        startTick: 0,
        endTick: 20,
        summary: 'SPI bytes 0xA5, 0x3C',
        detail: 'Decoded SPI transaction.',
      },
    ],
  });

  assert.equal(result.status, 'pass');
});
