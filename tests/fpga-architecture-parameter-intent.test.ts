import assert from 'node:assert/strict';
import test from 'node:test';
import type { FpgaArchitectureContract } from '../src/server/fpgaArchitectureContract';
import {
  applyResolvedFpgaArchitectureParameters,
  buildFpgaArchitectureParameterClarificationIssues,
  canonicalParameterName,
  discoverFpgaArchitectureParameterRequirements,
  extractFpgaParameterValuesFromPrompt,
  promoteVerifiedVhdlGenericsIntoComponent,
  validateFpgaArchitectureParameterCompleteness,
} from '../src/server/fpgaArchitectureParameterIntent';

function contractWithGeneric(name: string, defaultValue: string, type = 'positive'): FpgaArchitectureContract {
  return {
    schemaVersion: '2.0',
    designName: 'demo',
    designClass: 'generic_fpga_vhdl_system',
    topEntity: 'demo_top',
    topTestbench: 'tb_demo_top',
    systemIntent: 'Demo.',
    assumptions: [],
    requiredCapabilityIds: [],
    components: [{
      id: 'core',
      kind: 'rtl',
      name: 'demo_core',
      file: 'src/demo_core.vhd',
      responsibility: 'Core.',
      implements: [],
      dependsOn: [],
      children: [],
      clockDomain: 'clk',
      generics: [{ name, type, default: defaultValue }],
      ports: [
        { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
        { name: 'data_o', mode: 'out', type: 'std_logic', purpose: 'Output.' },
      ],
      exports: [],
    }],
    clockDomains: [],
    behaviors: [],
    verification: [],
    numericFormats: [],
    instances: [{
      id: 'u_core',
      parentComponentId: 'top',
      childComponentId: 'core',
      label: 'u_core',
      genericMap: {},
      portMap: {},
    }],
    connections: [],
    stateMachines: [],
    sourceOrder: ['src/demo_core.vhd'],
    architectureSynthesis: {
      sourceMode: 'curated_first_hybrid',
      synthesisId: 'synthesis_demo',
      primaryPatternId: 'generic',
      secondaryPatternIds: [],
      buildingBlockCatalogIds: [],
      methodologyRuleIds: [],
      referenceDesignIds: [],
      evidenceClaimIds: [],
      retrievalMode: 'off',
      retrievedSourceIds: [],
      sourceSnapshotIds: [],
      sourceHashes: [],
      evidenceFreshness: 'curated_only',
      confidence: 1,
    },
    sourceGroundedRequirements: [],
    outputOwnership: [],
    signalTimelines: [],
    truthTables: [],
    fsmContracts: [],
    verificationDerivation: [],
  };
}

test('parameter intent extracts common user values from raw prompt evidence', () => {
  const values = extractFpgaParameterValuesFromPrompt('Build a 16-bit UART FIFO, depth 1024, at 100 MHz and baud rate 115200.');

  assert.equal(values.DATA_WIDTH.value, '16');
  assert.equal(values.DEPTH.value, '1024');
  assert.equal(values.CLOCK_HZ.value, '100000000');
  assert.equal(values.BAUD_RATE.value, '115200');
});

test('parameter intent canonicalizes common verified-library generic names', () => {
  assert.equal(canonicalParameterName('fifo_depth'), 'DEPTH');
  assert.equal(canonicalParameterName('CLK_HZ'), 'CLOCK_HZ');
  assert.equal(canonicalParameterName('KEY_WIDTH'), 'KEY_WIDTH');
});

test('explicit user width is applied to approved contract generics and instance maps', () => {
  const contract = contractWithGeneric('DATA_WIDTH', '8');
  const validation = validateFpgaArchitectureParameterCompleteness({
    contract,
    userRequest: 'Design a 16-bit datapath.',
  });

  assert.equal(validation.ok, true);
  if (!validation.ok) throw new Error('unexpected clarification');
  const updated = applyResolvedFpgaArchitectureParameters({ contract, resolved: validation.resolved });
  assert.equal(updated.components[0].generics[0].default, '16');
  assert.equal(updated.instances[0].genericMap.DATA_WIDTH, '16');
});

test('missing high-impact generic can use verified default without user guessing', () => {
  const contract = contractWithGeneric('DEPTH', '16');
  const validation = validateFpgaArchitectureParameterCompleteness({
    contract,
    userRequest: 'Design a FIFO block.',
  });
  assert.equal(validation.ok, true);
  if (!validation.ok) throw new Error('unexpected clarification');
  assert.ok(validation.resolved.auditSummary.some((entry) => /source=verified_default/i.test(entry)));
});

test('missing required generic without a safe default pauses for parameter clarification', () => {
  const contract = contractWithGeneric('CLOCK_HZ', '');
  const validation = validateFpgaArchitectureParameterCompleteness({
    contract,
    userRequest: 'Design a UART controller.',
  });
  assert.equal(validation.ok, false);
  if (validation.ok) throw new Error('expected clarification');
  assert.equal(validation.clarificationRequest.subtype, 'parameter_clarification');
  assert.match(validation.clarificationRequest.questions.join('\n'), /clock frequency/i);
  const issues = buildFpgaArchitectureParameterClarificationIssues(validation.clarificationRequest);
  assert.ok(issues.some((issue) => issue.code === 'architecture_parameter_clarification_required'));
  assert.ok(issues.some((issue) => issue.code === 'architecture_parameter_unknown_required_value'));
});

test('sweep presets do not ask users for parameter clarification', () => {
  const contract = contractWithGeneric('CLOCK_HZ', '');
  const validation = validateFpgaArchitectureParameterCompleteness({
    contract,
    userRequest: '# FPGA Architect Design Spec\n- Mandatory design class: uart_spi_protocol_bridge\nCreate sweep preset.',
  });
  assert.equal(validation.ok, true);
});

test('parameter discovery reports smoke-sensitive high-impact generics', () => {
  const requirements = discoverFpgaArchitectureParameterRequirements({
    contract: contractWithGeneric('KEY_WIDTH', '256'),
    userRequest: 'Design an AES-256 engine.',
  });
  assert.equal(requirements[0].canonicalName, 'KEY_WIDTH');
  assert.equal(requirements[0].requiresConfiguredSmoke, true);
});

test('verified generic promotion adds recognized defaults but rejects unknown defaults', () => {
  const contract = contractWithGeneric('DATA_WIDTH', '8');
  const component = { ...contract.components[0], generics: [] };
  const promotion = promoteVerifiedVhdlGenericsIntoComponent({
    component,
    verifiedGenerics: [
      { name: 'CLOCK_HZ', type: 'positive', defaultValue: '100000000' },
      { name: 'BAUD_RATE', type: 'positive', defaultValue: '115200' },
      { name: 'MODE', type: 'integer', defaultValue: '1' },
    ],
    userRequest: 'Design a UART receiver.',
  });

  assert.deepEqual(promotion.promotedGenerics.map((entry) => entry.genericName), ['CLOCK_HZ', 'BAUD_RATE']);
  assert.equal(promotion.component.generics.some((generic) => generic.name === 'CLOCK_HZ' && generic.default === '100000000'), true);
  assert.match(promotion.unsafeReasons.join('\n'), /MODE is not a deterministic configurable parameter/i);
});
