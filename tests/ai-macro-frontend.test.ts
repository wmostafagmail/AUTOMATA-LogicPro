import test from 'node:test';
import assert from 'node:assert/strict';
import { getVisibleAiMacros } from '../src/aiMacros';
import { resolveMacroInvocation } from '../src/aiDrawerModel';
import { architectPromptRequestsReuse, filterArchitectReferenceFiles, isGeneratedArchitectPath } from '../src/fpgaArchitectContext';

test('visible macros expose stable ids in the intended order', () => {
  const macros = getVisibleAiMacros().map((macro) => macro.id);
  assert.deepEqual(macros, [
    'fpga_vhdl_architect',
    'generate_vhdl_tb',
    'inspect_race_hazards',
    'protocol_decoder_details',
    'verify_clock_reset_sequence',
    'explain_fsm_behavior',
    'summarize_protocol_timeline',
    'generate_vhdl_assertions',
    'draft_rtl_skeleton',
    'suggest_debug_probes',
  ]);
});

test('Generate VHDL TB resolves to the composer flow', () => {
  const invocation = resolveMacroInvocation('generate_vhdl_tb');
  assert.equal(invocation.kind, 'composer');
  if (invocation.kind === 'composer') {
    assert.equal(invocation.tbGenerationMode, 'project_entities');
  }
});

test('Inspect Race Hazards resolves to a direct macro request', () => {
  const invocation = resolveMacroInvocation('inspect_race_hazards');
  assert.equal(invocation.kind, 'request');
  if (invocation.kind === 'request') {
    assert.match(invocation.prompt, /hazard|setup|hold|synchronization/i);
  }
});

test('Protocol Decoder details resolves to a direct macro request', () => {
  const invocation = resolveMacroInvocation('protocol_decoder_details');
  assert.equal(invocation.kind, 'request');
  if (invocation.kind === 'request') {
    assert.match(invocation.prompt, /decode the protocol sequences/i);
  }
});

test('Verify Clock/Reset Sequence resolves to a direct macro request', () => {
  const invocation = resolveMacroInvocation('verify_clock_reset_sequence');
  assert.equal(invocation.kind, 'request');
  if (invocation.kind === 'request') {
    assert.match(invocation.prompt, /clock and reset behavior/i);
  }
});

test('Explain FSM Behavior resolves to a direct macro request', () => {
  const invocation = resolveMacroInvocation('explain_fsm_behavior');
  assert.equal(invocation.kind, 'request');
  if (invocation.kind === 'request') {
    assert.match(invocation.prompt, /finite state machine behavior/i);
  }
});

test('Summarize Protocol Timeline resolves to a direct macro request', () => {
  const invocation = resolveMacroInvocation('summarize_protocol_timeline');
  assert.equal(invocation.kind, 'request');
  if (invocation.kind === 'request') {
    assert.match(invocation.prompt, /transaction timeline/i);
  }
});

test('Generate VHDL Assertions resolves to a direct macro request', () => {
  const invocation = resolveMacroInvocation('generate_vhdl_assertions');
  assert.equal(invocation.kind, 'request');
  if (invocation.kind === 'request') {
    assert.match(invocation.prompt, /VHDL assertions/i);
  }
});

test('Draft RTL Skeleton resolves to a direct macro request', () => {
  const invocation = resolveMacroInvocation('draft_rtl_skeleton');
  assert.equal(invocation.kind, 'request');
  if (invocation.kind === 'request') {
    assert.match(invocation.prompt, /RTL skeleton/i);
  }
});

test('Suggest Debug Probes resolves to a direct macro request', () => {
  const invocation = resolveMacroInvocation('suggest_debug_probes');
  assert.equal(invocation.kind, 'request');
  if (invocation.kind === 'request') {
    assert.match(invocation.prompt, /trigger conditions|capture plan/i);
  }
});

test('FPGA Architect generated-folder filter excludes app-generated subfolders by default', () => {
  assert.equal(isGeneratedArchitectPath('fpga_vhdl_project/src/top.vhd'), true);
  assert.equal(isGeneratedArchitectPath('Counter/AI Generated TB/tb_counter.vhd'), true);
  assert.equal(isGeneratedArchitectPath('rtl/top.vhd'), false);

  const filtered = filterArchitectReferenceFiles([
    {
      path: 'fpga_vhdl_project/src/updown_counter.vhd',
      name: 'updown_counter.vhd',
      extension: '.vhd',
      size: 100,
      type: 'file',
      lastModified: 0,
    },
    {
      path: 'rtl/counter.vhd',
      name: 'counter.vhd',
      extension: '.vhd',
      size: 100,
      type: 'file',
      lastModified: 0,
    },
  ]);

  assert.deepEqual(filtered.map((file) => file.path), ['rtl/counter.vhd']);
});

test('FPGA Architect generated-folder filter can be bypassed only by explicit reuse wording', () => {
  assert.equal(architectPromptRequestsReuse('Please reuse the existing generated files as a starting point.'), true);
  assert.equal(architectPromptRequestsReuse('Build a fresh architecture for this project.'), false);
});
