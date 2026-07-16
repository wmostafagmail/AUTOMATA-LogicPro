import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMacroPromptContract } from '../src/aiMacroPrompting';
import { buildMacroSystemPrompt } from '../src/server/macroSystemPrompts';
import {
  buildCanonicalRuleActionabilitySection,
  buildArchitectureBlueprintPromptSection,
  buildConstrainedRegionPromptSection,
  buildCodeGeneratingCommandContract,
  buildGenerationQualityPromptSection,
  buildGhdlRuleCoverageReport,
  buildLegalIdiomPromptSection,
  GHDL_EXTERNAL_RULE_REGISTRY,
  getCanonicalRuleActionability,
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
  assert.match(prompt, /## Known-Good VHDL Idioms To Copy/);
  assert.match(prompt, /## Structure-First Generation Contract/);
  assert.match(prompt, /## App-Owned Skeleton-First Contract/);
  assert.match(prompt, /## Staged Generation Protocol/);
  assert.match(prompt, /## File-By-File Generation Order/);
  assert.match(prompt, /## Golden VHDL Templates/);
  assert.match(prompt, /## Behavioral Reference Model Contract/);
  assert.match(prompt, /## Semantic Preflight Checklist/);
  assert.match(prompt, /## Strict File-Local Replacement Contract/);
  assert.match(prompt, /## Canonical GHDL Rule Contracts/);
    assert.match(prompt, /Use one VHDL standard consistently across the generated project, defaulting to `--std=08`/);
    assert.match(prompt, /include exact GHDL analyze\/elaborate\/run commands/);
  }
});

test('generation quality section encodes structure-first and file-by-file VHDL generation', () => {
  const section = buildGenerationQualityPromptSection('fpga_vhdl_architect', {
    promptText: 'Build a UART-to-SPI protocol bridge with FIFOs.',
  });

  assert.match(section, /Structure-First Generation Contract/);
  assert.match(section, /First internally plan the project manifest/);
  assert.match(section, /App-Owned Skeleton-First Contract/);
  assert.match(section, /Staged Generation Protocol/);
  assert.match(section, /Interface stage/);
  assert.match(section, /Design-Class Golden Architecture Template/);
  assert.match(section, /Design class: uart_spi_protocol_bridge/);
  assert.match(section, /uart_rx, uart_tx, spi_master/);
  assert.match(section, /Behavioral Reference Model Contract/);
  assert.match(section, /Reference design class: uart_spi_protocol_bridge/);
  assert.match(section, /Model UART input as byte-level command transactions/);
  assert.match(section, /File-By-File Generation Order/);
  assert.match(section, /Shared packages and package declarations/);
  assert.match(section, /Top-level self-checking testbench/);
  assert.match(section, /Semantic Preflight Checklist/);
  assert.match(section, /No malformed formals such as `inout name : inout type`/);
  assert.match(section, /No runnable project is missing GHDL analyze, elaborate, run, waveform, top_testbench, or expected_result metadata/);
});

test('FPGA Architect blueprint contract gives deterministic block-level guidance for new designs', () => {
  const flightControllerSection = buildArchitectureBlueprintPromptSection({
    macroId: 'fpga_vhdl_architect',
    promptText: 'Design a flight controller for a quadcopter with IMU, PID loops, motor mixer, telemetry, and failsafe.',
  });

  assert.match(flightControllerSection, /App-Owned Architecture Blueprint Contract/);
  assert.match(flightControllerSection, /Design class: flight_controller/);
  assert.match(flightControllerSection, /sensor interface block/i);
  assert.match(flightControllerSection, /PID\/control-loop block/i);
  assert.match(flightControllerSection, /motor mixer block/i);
  assert.match(flightControllerSection, /failsafe\/watchdog block/i);
  assert.match(flightControllerSection, /tb\/tb_flight_controller_top\.vhd/);

  const aluSection = buildArchitectureBlueprintPromptSection({
    macroId: 'fpga_vhdl_architect',
    promptText: 'Design an 8-bit ALU with flags.',
  });
  assert.match(aluSection, /Design class: alu/);
  assert.match(aluSection, /every opcode has deterministic result and flags/i);

  assert.equal(buildArchitectureBlueprintPromptSection({
    macroId: 'generate_vhdl_tb',
    promptText: 'Design a flight controller',
  }), '');
});

test('FPGA Architect constrained region contract keeps app-owned skeleton stable', () => {
  const section = buildConstrainedRegionPromptSection('fpga_vhdl_architect');

  assert.match(section, /Constrained Implementation Regions/);
  assert.match(section, /file scaffold, entity names, public ports, GHDL plan/);
  assert.match(section, /Do not change public interfaces during repair/);
  assert.equal(buildConstrainedRegionPromptSection('generate_vhdl_tb'), '');
});

test('legal idiom section gives copyable GHDL-safe VHDL patterns', () => {
  const section = buildLegalIdiomPromptSection('fpga_vhdl_architect');

  assert.match(section, /Self-checking TB helper procedure formals/);
  assert.match(section, /variable failed_io\s+:\s+inout boolean/);
  assert.match(section, /Do not emit malformed formals such as `inout test_failed_io : inout std_logic`/);
  assert.doesNotMatch(section, /^\s*inout\s+\w+\s+:\s+inout\s+std_logic/m);
});

test('canonical rule actionability exposes failure codes and legal repair examples', () => {
  const rule = GHDL_EXTERNAL_RULE_REGISTRY.find((entry) => entry.ruleId === 'ghdl-clocked-variable-discipline');
  assert.ok(rule);

  const actionability = getCanonicalRuleActionability(rule);
  assert.ok(actionability.validatorFailureCodes.includes('procedure_outer_scope_write'));
  assert.ok(actionability.validatorFailureCodes.includes('declaration_after_begin'));
  assert.match(actionability.repairStrategy, /bundled file-local scope fix/);

  const section = buildCanonicalRuleActionabilitySection({
    macroId: 'fpga_vhdl_architect',
    ruleIds: ['ghdl-clocked-variable-discipline'],
  });
  assert.match(section, /ghdl-clocked-variable-discipline/);
  assert.match(section, /helper procedures declared after begin/);
  assert.match(section, /explicit inout formal parameters/);
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
  assert.match(prompt, /## Known-Good VHDL Idioms To Copy/);
  assert.match(prompt, /## Structure-First Generation Contract/);
  assert.match(prompt, /## App-Owned Skeleton-First Contract/);
  assert.match(prompt, /## Staged Generation Protocol/);
  assert.match(prompt, /## File-By-File Generation Order/);
  assert.match(prompt, /## Golden VHDL Templates/);
  assert.match(prompt, /## Behavioral Reference Model Contract/);
  assert.match(prompt, /## Semantic Preflight Checklist/);
  assert.match(prompt, /## Strict File-Local Replacement Contract/);
  assert.match(prompt, /## Canonical GHDL Rule Contracts/);
  }
});

test('FPGA Architect macro prompt contract includes request-derived architecture blueprint', () => {
  const prompt = buildMacroPromptContract({
    macroId: 'fpga_vhdl_architect',
    userQuery: 'Design a flight controller with IMU sensor fusion, PID control loops, motor mixer, telemetry, and failsafe.',
    tbGenerationMode: null,
  });

  assert.match(prompt, /App-Owned Architecture Blueprint Contract/);
  assert.match(prompt, /Design class: flight_controller/);
  assert.match(prompt, /Design-Class Golden Architecture Template/);
  assert.match(prompt, /attitude\/rate estimator/i);
  assert.match(prompt, /Constrained Implementation Regions/);
  assert.match(prompt, /The model may fill in RTL behavior, FSM transitions, datapath operations/);
});
