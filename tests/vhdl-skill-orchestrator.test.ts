import test from 'node:test';
import assert from 'node:assert/strict';
import { applyVhdlSkillOrchestrator, selectVhdlSkills } from '../src/server/vhdlSkillOrchestrator';

test('deterministic VHDL skill selection routes generate_vhdl_tb to verification-oriented skills', async () => {
  const selection = await selectVhdlSkills([
    '### Active Macro',
    'Macro ID: generate_vhdl_tb',
    'Macro Label: Generate VHDL TB',
    '',
    'Developer Query: "Generate a VHDL testbench for this design and include assertions."',
  ].join('\n'));

  assert.equal(selection.primary.name, 'VHDL-skill-orchestrator');
  assert.ok(selection.supporting.some((skill) => skill.name === 'vhdl-language'));
  assert.ok(selection.supporting.some((skill) => skill.name === 'rtl-verification'));
  assert.ok(selection.supporting.some((skill) => skill.name === 'test-engineer'));
  assert.match(selection.skillCallPlan.join('\n'), /rtl-verification/i);
});

test('deterministic VHDL skill selection routes draft_rtl_skeleton to architecture-oriented skills', async () => {
  const selection = await selectVhdlSkills([
    '### Active Macro',
    'Macro ID: draft_rtl_skeleton',
    'Macro Label: RTL Skeleton',
    '',
    'Developer Query: "Draft a VHDL RTL skeleton with architecture assumptions."',
  ].join('\n'));

  assert.equal(selection.primary.name, 'VHDL-skill-orchestrator');
  assert.ok(selection.supporting.some((skill) => skill.name === 'vhdl-language'));
  assert.ok(selection.supporting.some((skill) => skill.name === 'fpga-architecture'));
});

test('VHDL skill orchestrator prompt uses deterministic selection instead of embedding the full pack', async () => {
  const prompt = await applyVhdlSkillOrchestrator([
    '### Active Macro',
    'Macro ID: verify_clock_reset_sequence',
    'Macro Label: Verify Clock/Reset Sequence',
    '',
    'Developer Query: "Check clock stability and reset deassertion timing."',
  ].join('\n'));

  assert.match(prompt, /^@Use VHDL-skill-orchestrator/m);
  assert.match(prompt, /Use only the deterministically selected skills below for this task\./);
  assert.match(prompt, /### Deterministically Selected Skills/);
  assert.match(prompt, /- Primary: VHDL-skill-orchestrator/);
  assert.match(prompt, /- Supporting: vhdl-language - /);
  assert.match(prompt, /- Supporting: fpga-architecture - /);
  assert.match(prompt, /### Skill Call Plan/);
  assert.doesNotMatch(prompt, /### VHDL-skill-orchestrator README/);
  assert.doesNotMatch(prompt, /### VHDL Skills Registry/);
});
