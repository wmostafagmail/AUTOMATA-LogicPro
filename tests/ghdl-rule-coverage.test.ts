import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMacroPromptContract } from '../src/aiMacroPrompting';
import { buildMacroSystemPrompt } from '../src/server/macroSystemPrompts';
import {
  buildCodeGeneratingCommandContract,
  buildGhdlRuleCoverageReport,
  GHDL_EXTERNAL_RULE_REGISTRY,
  getCanonicalRulesForMacro,
} from '../src/server/vhdlSkillRules';

test('every external GHDL/VHDL rule is represented with required coverage metadata', () => {
  assert.ok(GHDL_EXTERNAL_RULE_REGISTRY.length > 50);

  for (const rule of GHDL_EXTERNAL_RULE_REGISTRY) {
    assert.ok(rule.ruleId.length > 0, `missing ruleId for ${rule.title}`);
    assert.ok(rule.sourceSection.length > 0, `missing sourceSection for ${rule.ruleId}`);
    assert.ok(rule.summary.length > 0, `missing summary for ${rule.ruleId}`);
    assert.ok(rule.enforcementLayers.length > 0, `missing enforcement layers for ${rule.ruleId}`);
    assert.ok(['implemented', 'partial', 'planned'].includes(rule.status), `invalid status for ${rule.ruleId}`);
  }
});

test('coverage report summarizes totals consistently', () => {
  const report = buildGhdlRuleCoverageReport();

  assert.equal(report.totals.total, GHDL_EXTERNAL_RULE_REGISTRY.length);
  assert.equal(
    report.totals.implemented + report.totals.partial + report.totals.planned,
    report.totals.total,
  );
  assert.ok(report.byFamily.some((entry) => entry.family === 'ghdl_commands'));
  assert.ok(report.byFamily.some((entry) => entry.family === 'testbench_behavior'));
  assert.equal(report.byMacro.length, 4);
  assert.ok(report.byMacro.every((entry) => entry.total > 0));
  assert.ok(report.byEnforcementLayer.some((entry) => entry.layer === 'validator' && entry.total > 0));
  assert.ok(report.byEnforcementLayer.some((entry) => entry.layer === 'runtime_acceptance' && entry.total > 0));
});

test('all code-generating macros receive the exact GHDL command contract section in system prompts', () => {
  const macroIds = [
    'fpga_vhdl_architect',
    'generate_vhdl_tb',
    'generate_vhdl_assertions',
    'draft_rtl_skeleton',
  ] as const;

  for (const macroId of macroIds) {
    const prompt = buildMacroSystemPrompt({
      macroId,
      waveformText: '',
      protocolMarkdown: '',
      hazardMarkdown: '',
      exportPolicyText: '',
      projectText: '',
      customQueryMode: null,
    });

    assert.match(prompt, /## Exact GHDL Command \/ Output Contract/);
    assert.match(prompt, /Use one VHDL standard consistently across the generated project, defaulting to `--std=08`/);
    assert.match(prompt, /include exact GHDL analyze\/elaborate\/run commands/);
  }
});

test('macro-scoped canonical rule selection covers command and waveform rules for runnable macros', () => {
  const architectRules = getCanonicalRulesForMacro('fpga_vhdl_architect').map((rule) => rule.ruleId);
  const tbRules = getCanonicalRulesForMacro('generate_vhdl_tb').map((rule) => rule.ruleId);

  assert.ok(architectRules.includes('ghdl-clean-command-contract'));
  assert.ok(architectRules.includes('ghdl-waveform-rules'));
  assert.ok(tbRules.includes('ghdl-clean-command-contract'));
  assert.ok(tbRules.includes('ghdl-tb-entity-rules'));
  assert.match(buildCodeGeneratingCommandContract('generate_vhdl_tb'), /waveform argument/);
});

test('all code-generating macro prompt contracts include shared GHDL command expectations', () => {
  const promptContracts = [
    buildMacroPromptContract({
      macroId: 'fpga_vhdl_architect',
      userQuery: 'design an ALU',
      tbGenerationMode: null,
    }),
    buildMacroPromptContract({
      macroId: 'generate_vhdl_tb',
      userQuery: 'generate a testbench',
      tbGenerationMode: 'project_entities',
    }),
    buildMacroPromptContract({
      macroId: 'generate_vhdl_assertions',
      userQuery: 'generate assertions',
      tbGenerationMode: null,
    }),
    buildMacroPromptContract({
      macroId: 'draft_rtl_skeleton',
      userQuery: 'draft an rtl skeleton',
      tbGenerationMode: null,
    }),
  ];

  for (const prompt of promptContracts) {
    assert.match(prompt, /Exact GHDL command\/output contract|Exact GHDL Command \/ Output Contract/i);
    assert.match(prompt, /--std=08/);
  }
});
