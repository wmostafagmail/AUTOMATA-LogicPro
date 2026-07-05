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
  assert.match(selection.registryPath, /VHDL-skill-orchestrator\/skills\.registry\.yaml$/);
  assert.ok(selection.supporting.some((skill) => skill.name === 'vhdl-language'));
  assert.ok(selection.supporting.some((skill) => skill.name === 'rtl-verification'));
  assert.ok(selection.supporting.some((skill) => skill.name === 'fpga-architecture'));
  assert.ok(!selection.supporting.some((skill) => skill.name === 'test-engineer'));
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
  assert.match(prompt, /Use the available skills registry to select only the skills needed for this task\./);
  assert.match(prompt, /Create a short skill call plan, execute the plan, merge outputs, and run the final verification checklist\./);
  assert.match(prompt, /\n\nTask:\n\n### Active Macro/);
  assert.match(prompt, /### Deterministic Server Skill Selection/);
  assert.match(prompt, /### Deterministically Selected Skills/);
  assert.match(prompt, /- Primary: VHDL-skill-orchestrator/);
  assert.match(prompt, /- Supporting: vhdl-language - /);
  assert.match(prompt, /- Supporting: fpga-architecture - /);
  assert.match(prompt, /### Skill Call Plan/);
  assert.match(prompt, /## Shared GHDL Conformance Rules/);
  assert.match(prompt, /std\.env\.stop\(0\)/);
  assert.match(prompt, /Do not use VHDL logical operator tokens as pseudo-English arithmetic\/comparison glue/);
  assert.doesNotMatch(prompt, /### VHDL-skill-orchestrator README/);
  assert.doesNotMatch(prompt, /### VHDL Skills Registry/);
});
