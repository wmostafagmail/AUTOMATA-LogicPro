import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDisplayReport, buildStructuredReport } from '../src/aiReport';

test('buildStructuredReport extracts orchestrator audit sections', () => {
  const report = buildStructuredReport(`
## Selected Skills
- Primary: VHDL-skill-orchestrator
- Supporting: vhdl-language - generate synthesizable VHDL
- Supporting: rtl-verification - generate self-checking checks

## Execution Summary
Created a short skill plan.
Executed the primary and supporting skills in order.

## Deliverables
- rtl/spi_master.vhd
- tb/tb_spi_master.vhd

## Validation
- GHDL compile command prepared
- Final verification checklist completed

## Assumptions
- Single clock domain
  `.trim());

  assert.ok(report.orchestratorAudit);
  assert.equal(report.orchestratorAudit?.selectedSkills[0]?.role, 'primary');
  assert.equal(report.orchestratorAudit?.selectedSkills[0]?.name, 'VHDL-skill-orchestrator');
  assert.equal(report.orchestratorAudit?.selectedSkills[1]?.role, 'supporting');
  assert.equal(report.orchestratorAudit?.selectedSkills[1]?.name, 'vhdl-language');
  assert.equal(report.orchestratorAudit?.selectedSkills[1]?.reason, 'generate synthesizable VHDL');
  assert.deepEqual(report.orchestratorAudit?.deliverables, ['rtl/spi_master.vhd', 'tb/tb_spi_master.vhd']);
  assert.deepEqual(report.orchestratorAudit?.validation, ['GHDL compile command prepared', 'Final verification checklist completed']);
  assert.deepEqual(report.orchestratorAudit?.assumptions, ['Single clock domain']);
});

test('buildDisplayReport prefers server deterministic skill metadata when available', () => {
  const report = buildDisplayReport(`
## Execution Summary
The model discussed the work but omitted the selected skills section.
  `.trim(), {
    macroId: 'inspect_race_hazards',
    deterministicSkillSelection: {
      registryPath: '/workspace/VHDL-skill-orchestrator/skills.registry.yaml',
      selectedSkills: [
        { role: 'primary', name: 'VHDL-skill-orchestrator' },
        { role: 'supporting', name: 'vhdl-language', reason: 'required by deterministic macro-to-skill routing' },
      ],
      skillCallPlan: [
        '1. VHDL-skill-orchestrator: coordinate the selected skills and preserve the required output contract.',
        '2. vhdl-language: required by deterministic macro-to-skill routing.',
      ],
    },
  });

  assert.ok(report.orchestratorAudit);
  assert.equal(report.orchestratorAudit?.selectedSkills[0]?.name, 'VHDL-skill-orchestrator');
  assert.equal(report.orchestratorAudit?.selectedSkills[1]?.name, 'vhdl-language');
  assert.match(report.orchestratorAudit?.executionSummary[0] || '', /coordinate the selected skills/i);
});

test('buildDisplayReport filters non-VHDL skills from parsed selected skills text', () => {
  const report = buildDisplayReport(`
## Selected Skills
- Primary: **VHDL-skill-orchestrator**
- Supporting: **vhdl-language** - core VHDL reasoning
- Supporting: **rtl-verification** - verification flow
- Supporting: **ui-ux-designer** - should never appear in the hardware skill list

## Execution Summary
Selected the required hardware-focused skills only.
  `.trim());

  assert.ok(report.orchestratorAudit);
  assert.deepEqual(
    report.orchestratorAudit?.selectedSkills.map((skill) => skill.name),
    ['VHDL-skill-orchestrator', 'vhdl-language', 'rtl-verification'],
  );
});

test('buildDisplayReport does not prepend hazard or protocol summaries for general-design custom queries', () => {
  const report = buildDisplayReport(`
## Design Response
Yes. A digital clock can be built from a clock divider, counters, and display drivers.
  `.trim(), {
    macroId: 'custom_query',
    customQueryMode: 'general_design',
    hazardMarkdown: '## Hazard Summary\nNo obvious hazards detected.',
    protocolMarkdown: '## Decoded Frames\nNo deterministic SPI/I2C/UART frames were decoded.',
  });

  const sectionTitles = report.sections.map((section) => section.title);
  assert.deepEqual(sectionTitles, ['Design Response']);
});
