import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertFpgaArchitectProjectMatchesContract,
  attachFpgaArchitectureContractArtifact,
  buildApprovedFpgaArchitectureContractSection,
  buildFpgaArchitectureContractDraft,
  buildFpgaArchitectureContractProposalPrompt,
  buildFpgaArchitectureSelectionReviewPrompt,
  canonicalizeFpgaArchitectureContract,
  completeFpgaArchitectureContract,
  hashFpgaArchitectureContract,
  normalizeFpgaArchitectureContract,
  parseAndValidateFpgaArchitectureContract,
  parseFpgaArchitectureSelectionReview,
  proposeApprovedFpgaArchitectureContract,
  validateFpgaArchitectureContract,
  validateFpgaArchitectProjectAgainstContract,
  type FpgaArchitectureContract,
} from '../src/server/fpgaArchitectureContract';
import type { FpgaArchitectProject } from '../src/server/fpgaArchitect';
import {
  inferFpgaArchitectureBlueprintFromPrompt,
  synthesizeFpgaArchitectureBlueprintFromPrompt,
} from '../src/server/fpgaArchitectureBlueprint';
import { buildFpgaArchitectureEvidenceSnapshot } from '../src/server/fpgaArchitectureEvidence';

const ALU_CAPABILITIES = [
  'alu_pkg_for_opcodes_flags',
  'alu_core_combinational_or_registered_datapath',
  'optional_top_wrapper',
  'self_checking_operation_testbench',
];

function makeValidContract(): FpgaArchitectureContract {
  return {
    schemaVersion: '1.0',
    designName: 'alu_project',
    designClass: 'alu',
    topEntity: 'alu_top',
    topTestbench: 'tb_alu_top',
    systemIntent: 'Implement an 8-bit combinational ALU with explicit opcodes and observable result and carry outputs.',
    assumptions: ['Operands are unsigned for add and subtract.'],
    requiredCapabilityIds: [...ALU_CAPABILITIES],
    components: [
      {
        id: 'alu_pkg',
        kind: 'package',
        name: 'alu_pkg',
        file: 'src/alu_pkg.vhd',
        responsibility: 'Own opcode constants and shared ALU subtypes.',
        implements: ['alu_pkg_for_opcodes_flags'],
        dependsOn: [],
        children: [],
        clockDomain: null,
        generics: [],
        ports: [],
        exports: ['alu_opcode_t'],
      },
      {
        id: 'alu_top',
        kind: 'top',
        name: 'alu_top',
        file: 'src/alu_top.vhd',
        responsibility: 'Compute the selected ALU operation and flags.',
        implements: ['alu_core_combinational_or_registered_datapath', 'optional_top_wrapper'],
        dependsOn: ['alu_pkg'],
        children: [],
        clockDomain: null,
        generics: [],
        ports: [
          { name: 'a_i', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'First operand.' },
          { name: 'b_i', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'Second operand.' },
          { name: 'op_i', mode: 'in', type: 'std_logic_vector(2 downto 0)', purpose: 'Operation selector.' },
          { name: 'result_o', mode: 'out', type: 'std_logic_vector(7 downto 0)', purpose: 'Operation result.' },
          { name: 'carry_o', mode: 'out', type: 'std_logic', purpose: 'Carry or borrow status.' },
        ],
        exports: [],
      },
      {
        id: 'tb_alu_top',
        kind: 'testbench',
        name: 'tb_alu_top',
        file: 'tb/tb_alu_top.vhd',
        responsibility: 'Drive every opcode and self-check result and carry behavior.',
        implements: ['self_checking_operation_testbench'],
        dependsOn: ['alu_top'],
        children: ['alu_top'],
        clockDomain: null,
        generics: [],
        ports: [],
        exports: [],
      },
    ],
    clockDomains: [],
    behaviors: [{
      id: 'add_behavior',
      requirement: 'ADD produces the low eight result bits and carry-out.',
      inputs: ['a_i', 'b_i', 'op_i'],
      outputs: ['result_o', 'carry_o'],
      timing: 'Combinational result settles within one delta cycle.',
    }],
    verification: [{
      id: 'verify_all_alu_contracts',
      requirement: 'Prove all required ALU architecture capabilities.',
      stimulus: 'Apply deterministic operand pairs for every supported opcode.',
      expected: 'Each result and flag equals the package-defined operation contract.',
      observables: ['result_o', 'carry_o'],
      covers: [...ALU_CAPABILITIES],
    }],
    sourceOrder: ['src/alu_pkg.vhd', 'src/alu_top.vhd', 'tb/tb_alu_top.vhd'],
  };
}

function makeMatchingProject(): FpgaArchitectProject {
  return {
    projectName: 'ALU Project',
    sanitizedProjectName: 'alu_project',
    topEntity: 'alu_top',
    vhdlStandard: '08',
    targetFpga: null,
    summary: 'ALU project',
    assumptions: [],
    warnings: [],
    folderTree: 'src/\ntb/',
    files: [
      {
        path: 'src/alu_pkg.vhd',
        fileType: 'vhdl_package',
        purpose: 'Shared types',
        content: 'package alu_pkg is subtype alu_opcode_t is std_logic_vector(2 downto 0); end package;',
      },
      {
        path: 'src/alu_top.vhd',
        fileType: 'vhdl_rtl',
        purpose: 'ALU top',
        content: [
          'entity alu_top is',
          '  port (',
          '    a_i : in std_logic_vector(7 downto 0);',
          '    b_i : in std_logic_vector(7 downto 0);',
          '    op_i : in std_logic_vector(2 downto 0);',
          '    result_o : out std_logic_vector(7 downto 0);',
          '    carry_o : out std_logic',
          '  );',
          'end entity;',
          'architecture rtl of alu_top is begin end architecture;',
        ].join('\n'),
      },
      {
        path: 'tb/tb_alu_top.vhd',
        fileType: 'vhdl_testbench',
        purpose: 'Self-checking TB',
        content: 'entity tb_alu_top is end entity; architecture sim of tb_alu_top is begin dut: entity work.alu_top; end architecture;',
      },
    ],
    ghdl: {
      analysisOrder: ['src/alu_pkg.vhd', 'src/alu_top.vhd', 'tb/tb_alu_top.vhd'],
      topTestbench: 'tb_alu_top',
      runCommands: [],
      expectedResult: 'TEST PASSED',
    },
    qualityChecklist: [],
  };
}

test('architecture contract proposal prompt makes model-owned choices machine-checkable', () => {
  const prompt = buildFpgaArchitectureContractProposalPrompt({ userRequest: 'Design an 8-bit ALU.' });
  assert.match(prompt, /before any VHDL is generated/);
  assert.match(prompt, /App-owned draft contract to preserve and refine/);
  assert.match(prompt, /alu_pkg_for_opcodes_flags/);
  assert.match(prompt, /Every required capability must be implemented/);
  assert.match(prompt, /sourceOrder/);
  assert.match(prompt, /Return exactly one JSON object/);
  assert.match(prompt, /schemaVersion must be "2.0"/);
  assert.match(prompt, /named generic\/port maps/);
  assert.match(prompt, /Curated-first hybrid architecture synthesis/);
  assert.match(prompt, /Primary app-owned design pattern: pattern_alu_core/);
  assert.match(prompt, /curated design pattern owns high-level building-block architecture/i);
  assert.match(prompt, /sourceGroundedRequirements/);
  assert.match(prompt, /claim_method_numeric_boundary_types/);
});

test('architecture selection review prompt asks the model to sanity-check selected curated blocks only', () => {
  const prompt = buildFpgaArchitectureSelectionReviewPrompt({
    userRequest: 'UART to SPI bridge with rx fifo and tx fifo buffering.',
  });

  assert.match(prompt, /reviewing the app-selected FPGA architecture approach/i);
  assert.match(prompt, /App-selected curated architecture pattern/);
  assert.match(prompt, /App-selected 3,600-catalog building-block specs/);
  assert.match(prompt, /fit": "good \| partial \| poor/);
  assert.match(prompt, /uart_spi_protocol_bridge/);
  assert.match(prompt, /BB-0001/);
  assert.doesNotMatch(prompt, /architecture\s+rtl\s+of/i);
});

test('architecture selection review parser normalizes strict JSON response', () => {
  const review = parseFpgaArchitectureSelectionReview(JSON.stringify({
    fit: 'partial',
    confidence: 0.84,
    selectedPrimaryPattern: 'pattern_protocol_bridge_uart_spi',
    selectedSupportBlocks: ['BB-0001'],
    missingBlocks: ['sync_fifo'],
    unnecessaryBlocks: ['spi_slave'],
    recommendedPrimaryPattern: '',
    recommendedSupportBlocks: ['BB-0078'],
    architectureRisks: ['FIFO depth was not selected.'],
    reasoningSummary: 'Mostly right, but needs explicit buffering.',
  }));

  assert.equal(review.fit, 'partial');
  assert.equal(review.confidence, 0.84);
  assert.deepEqual(review.missingBlocks, ['sync_fifo']);
  assert.deepEqual(review.recommendedSupportBlocks, ['BB-0078']);
});

test('app-owned contract draft validates before model refinement', () => {
  const contract = buildFpgaArchitectureContractDraft({ userRequest: 'Design an 8-bit ALU.' });
  const validation = validateFpgaArchitectureContract({ contract, userRequest: 'Design an 8-bit ALU.' });
  assert.equal(validation.ok, true, JSON.stringify(validation.issues, null, 2));
  assert.equal(contract.schemaVersion, '2.0');
  assert.equal(contract.components.filter((component) => component.kind === 'top').length, 1);
  assert.equal(contract.components.filter((component) => component.kind === 'testbench').length, 1);
  assert.equal(contract.sourceOrder.at(-1), contract.components.find((component) => component.kind === 'testbench')?.file);
});

test('contract parser safely quotes recoverable raw JSON-ish VHDL tokens', () => {
  const contract = buildFpgaArchitectureContractDraft({ userRequest: 'Design an 8-bit ALU.' });
  contract.verification[0] = {
    ...contract.verification[0],
    actions: [
      { kind: 'drive', signal: 'start_i', value: 'open' },
      { kind: 'finish', message: 'TEST PASSED' },
    ],
  };
  const jsonish = JSON.stringify(contract, null, 2).replace('"open"', 'open');
  const parsed = parseAndValidateFpgaArchitectureContract({ text: jsonish, userRequest: 'Design an 8-bit ALU.' });
  assert.equal(parsed.verification[0]?.actions?.[0]?.value, 'open');
});

test('contract normalization repairs safe source-order and generic-default shape issues', () => {
  const contract = makeValidContract();
  contract.schemaVersion = '2.0';
  contract.components[1].generics = [{ name: 'DATA_WIDTH', type: 'positive', default: '' }];
  contract.components[0].packageSymbols = [{ name: 'alu_opcode_t', kind: 'subtype', type: 'std_logic_vector(2 downto 0)' }];
  contract.behaviors[0] = { ...contract.behaviors[0], resetBehavior: 'Reset output is zero.', latencyCycles: 0, preconditions: [] };
  contract.verification[0] = {
    ...contract.verification[0],
    coversBehaviors: ['add_behavior'],
    actions: [{ kind: 'finish', message: 'TEST PASSED' }],
  };
  contract.numericFormats = [];
  contract.instances = [];
  contract.connections = [];
  contract.stateMachines = [];
  contract.sourceOrder = ['tb/tb_alu_top.vhd', 'src/alu_top.vhd'];

  const normalized = normalizeFpgaArchitectureContract(contract);
  assert.equal(normalized.components[1].generics[0].default, '1');
  assert.deepEqual(normalized.sourceOrder, ['src/alu_pkg.vhd', 'src/alu_top.vhd', 'tb/tb_alu_top.vhd']);
});

test('contract completion repairs safe ownership, verification, hierarchy, and instance-map gaps before validation', () => {
  const contract = buildFpgaArchitectureContractDraft({ userRequest: 'Design an 8-bit ALU.' });
  const top = contract.components.find((component) => component.kind === 'top')!;
  const testbench = contract.components.find((component) => component.kind === 'testbench')!;
  for (const component of contract.components) component.implements = [];
  top.children = [];
  top.dependsOn = contract.components.filter((component) => component.kind === 'package').map((component) => component.id);
  testbench.children = [];
  contract.instances = [];
  contract.verification[0].covers = [];
  contract.verification[0].coversBehaviors = [];

  const completion = completeFpgaArchitectureContract({
    contract,
    userRequest: 'Design an 8-bit ALU.',
  });
  const validation = validateFpgaArchitectureContract({
    contract: completion.contract,
    userRequest: 'Design an 8-bit ALU.',
  });

  assert.equal(validation.ok, true, JSON.stringify(validation.issues, null, 2));
  assert.ok(completion.fixes.some((fix) => fix.code === 'contract_completion_capability_owner_added'));
  assert.ok(completion.fixes.some((fix) => fix.code === 'contract_completion_capability_verification_added'));
  assert.ok(completion.fixes.some((fix) => fix.code === 'contract_completion_instance_map_completed'));
  assert.equal(completion.contract.instances?.length, completion.contract.components.filter((component) => component.kind !== 'package').length - 1);
});

test('contract parse/validate uses completion so safe model omissions do not fail the contract gate', () => {
  const contract = buildFpgaArchitectureContractDraft({ userRequest: 'Design an 8-bit ALU.' });
  const top = contract.components.find((component) => component.kind === 'top')!;
  const testbench = contract.components.find((component) => component.kind === 'testbench')!;
  top.children = [];
  testbench.children = [];
  contract.instances = [];
  contract.verification[0].covers = [];

  const parsed = parseAndValidateFpgaArchitectureContract({
    text: JSON.stringify(contract),
    userRequest: 'Design an 8-bit ALU.',
  });

  assert.ok(parsed.instances?.length);
  assert.ok(parsed.verification[0].covers.length >= contract.requiredCapabilityIds.length);
  assert.equal(validateFpgaArchitectureContract({ contract: parsed, userRequest: 'Design an 8-bit ALU.' }).ok, true);
});

test('contract normalization declares safe implicit child-output connections', () => {
  const contract = makeValidContract();
  contract.schemaVersion = '2.0';
  contract.components[0].packageSymbols = [{ name: 'alu_opcode_t', kind: 'subtype', type: 'std_logic_vector(2 downto 0)' }];
  contract.components.splice(1, 0, {
    id: 'alu_core',
    kind: 'rtl',
    name: 'alu_core',
    file: 'src/alu_core.vhd',
    responsibility: 'Compute ALU result.',
    implements: [],
    dependsOn: ['alu_pkg'],
    children: [],
    clockDomain: null,
    generics: [],
    ports: [
      { name: 'a_i', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'A.' },
      { name: 'result_o', mode: 'out', type: 'std_logic_vector(7 downto 0)', purpose: 'Result.' },
    ],
    exports: [],
  });
  const top = contract.components.find((component) => component.id === 'alu_top');
  assert.ok(top);
  top.dependsOn = ['alu_pkg', 'alu_core'];
  top.children = ['alu_core'];
  contract.instances = [{
    id: 'u_core',
    parentComponentId: 'alu_top',
    childComponentId: 'alu_core',
    label: 'u_core',
    genericMap: {},
    portMap: { a_i: 'a_i', result_o: 'core_result' },
  }, {
    id: 'dut',
    parentComponentId: 'tb_alu_top',
    childComponentId: 'alu_top',
    label: 'dut',
    genericMap: {},
    portMap: { a_i: 'a_i', b_i: 'b_i', op_i: 'op_i', result_o: 'result_o', carry_o: 'carry_o' },
  }];
  contract.connections = [];
  contract.numericFormats = [];
  contract.stateMachines = [];
  contract.behaviors[0] = { ...contract.behaviors[0], resetBehavior: 'No reset.', latencyCycles: 0, preconditions: [] };
  contract.verification[0] = {
    ...contract.verification[0],
    coversBehaviors: ['add_behavior'],
    actions: [{ kind: 'finish', message: 'TEST PASSED' }],
  };
  contract.sourceOrder = ['src/alu_pkg.vhd', 'src/alu_core.vhd', 'src/alu_top.vhd', 'tb/tb_alu_top.vhd'];

  const normalized = normalizeFpgaArchitectureContract(contract);
  assert.deepEqual(normalized.connections?.map((connection) => connection.id), ['core_result']);
  assert.equal(normalized.connections?.[0]?.type, 'std_logic_vector(7 downto 0)');
  assert.deepEqual(normalized.connections?.[0]?.source, { componentId: 'alu_core', port: 'result_o' });
  const validation = validateFpgaArchitectureContract({ contract: normalized, userRequest: 'Design an 8-bit ALU.' });
  assert.equal(
    validation.issues.some((issue) => issue.code === 'architecture_contract_instance_actual_unknown' || issue.code === 'architecture_contract_instance_output_actual_invalid'),
    false,
    JSON.stringify(validation.issues, null, 2),
  );
});

test('contract V2 validates package symbols, exact instances, behavior timing, and executable scenarios', () => {
  const contract = makeValidContract();
  contract.schemaVersion = '2.0';
  contract.components[0].packageSymbols = [{ name: 'alu_opcode_t', kind: 'subtype', type: 'std_logic_vector(2 downto 0)' }];
  contract.behaviors[0] = { ...contract.behaviors[0], resetBehavior: 'Combinational outputs default to zero for an invalid opcode.', latencyCycles: 0, preconditions: [] };
  contract.verification[0] = {
    ...contract.verification[0],
    coversBehaviors: ['add_behavior'],
    actions: [
      { kind: 'drive', signal: 'a_i', value: 'x"05"' },
      { kind: 'drive', signal: 'b_i', value: 'x"03"' },
      { kind: 'wait_cycles', cycles: 1 },
      { kind: 'expect', signal: 'result_o', value: 'x"08"', message: 'ADD result mismatch' },
      { kind: 'finish', message: 'TEST PASSED' },
    ],
  };
  contract.numericFormats = [{ id: 'alu_data_format', type: 'unsigned', width: 8, integerBits: 8, fractionalBits: 0, overflow: 'wrap', rounding: 'truncate' }];
  contract.instances = [{
    id: 'tb_dut',
    parentComponentId: 'tb_alu_top',
    childComponentId: 'alu_top',
    label: 'dut',
    genericMap: {},
    portMap: { a_i: 'a_i', b_i: 'b_i', op_i: 'op_i', result_o: 'result_o', carry_o: 'carry_o' },
  }];
  contract.connections = [];
  contract.stateMachines = [];

  const validation = validateFpgaArchitectureContract({ contract, userRequest: 'Design an 8-bit ALU.' });
  assert.equal(validation.ok, true, JSON.stringify(validation.issues, null, 2));
  assert.equal(hashFpgaArchitectureContract(contract).length, 64);
  assert.equal(canonicalizeFpgaArchitectureContract(contract), canonicalizeFpgaArchitectureContract(JSON.parse(JSON.stringify(contract))));
});

test('valid architecture contract passes deterministic schema and graph validation', () => {
  const contract = makeValidContract();
  const validation = validateFpgaArchitectureContract({ contract, userRequest: 'Design an 8-bit ALU.' });
  assert.equal(validation.ok, true, JSON.stringify(validation.issues, null, 2));
  const parsed = parseAndValidateFpgaArchitectureContract({
    text: JSON.stringify(contract),
    userRequest: 'Design an 8-bit ALU.',
  });
  assert.equal(parsed.designName, contract.designName);
  assert.equal(parsed.topEntity, contract.topEntity);
  assert.equal(validateFpgaArchitectureContract({ contract: parsed, userRequest: 'Design an 8-bit ALU.' }).ok, true);
});

test('explicit mandatory design class wins over unrelated base-prompt keywords', () => {
  const blueprint = inferFpgaArchitectureBlueprintFromPrompt([
    'Build the old ALU project again.',
    '---',
    'Mandatory design class: video_pattern_generator',
    'Design a VGA/HDMI Pattern Generator with Framebuffer.',
  ].join('\n'));

  assert.equal(blueprint.designClass, 'video_pattern_generator');
});

test('curated architecture synthesis selects app-owned design patterns and official evidence', () => {
  const synthesis = synthesizeFpgaArchitectureBlueprintFromPrompt(
    'Design a flight controller for a quadcopter with IMU, PID loops, motor mixer, telemetry, and failsafe.',
  );

  assert.equal(synthesis.sourceMode, 'curated_first_hybrid');
  assert.equal(synthesis.primaryPattern.patternId, 'pattern_flight_controller');
  assert.equal(synthesis.blueprint.designClass, 'flight_controller');
  assert.ok(synthesis.blueprint.buildingBlocks.some((block) => /sensor_frontend/i.test(block)));
  assert.ok(synthesis.blueprint.buildingBlocks.some((block) => /motor_mixer/i.test(block)));
  assert.ok(synthesis.methodologyRules.some((rule) => rule.ruleId === 'method_amd_hierarchy_ooc'));
  assert.ok(synthesis.evidenceClaims.every((claim) => /^https:\/\/(?:docs\.amd\.com|docs\.altera\.com|ghdl\.github\.io|www\.microchip\.com|www\.intel\.com)/.test(claim.sourceUrl)));
});

test('curated architecture synthesis composes secondary patterns deterministically', () => {
  const synthesis = synthesizeFpgaArchitectureBlueprintFromPrompt(
    'Design a flight controller with an SPI IMU sensor frontend and DSP filtering before PID control.',
  );

  assert.equal(synthesis.primaryPattern.patternId, 'pattern_flight_controller');
  assert.ok(synthesis.secondaryPatterns.some((pattern) => pattern.patternId === 'pattern_dsp_chain'));
  assert.ok(synthesis.blueprint.matchedPatternIds?.includes('pattern_dsp_chain'));
});

test('deterministic draft does not turn package or self-checking capabilities into RTL leaves', () => {
  const contract = buildFpgaArchitectureContractDraft({
    userRequest: 'Mandatory design class: alu. Design an ALU.',
  });
  const rtlComponentIds = contract.components
    .filter((component) => component.kind === 'rtl')
    .map((component) => component.id);
  const packageComponent = contract.components.find((component) => component.kind === 'package');
  const testbenchComponent = contract.components.find((component) => component.kind === 'testbench');

  assert.equal(rtlComponentIds.includes('alu_pkg_for_opcodes_flags'), false);
  assert.equal(rtlComponentIds.includes('operation_testbench'), false);
  assert.ok(packageComponent?.implements.includes('alu_pkg_for_opcodes_flags'));
  assert.ok(testbenchComponent?.implements.includes('self_checking_operation_testbench'));
  assert.equal(validateFpgaArchitectureContract({ contract, userRequest: 'Mandatory design class: alu. Design an ALU.' }).ok, true);
});

test('deterministic draft preserves curated synthesis metadata and source-grounded requirements', () => {
  const contract = buildFpgaArchitectureContractDraft({
    userRequest: 'Mandatory design class: alu. Design an ALU.',
  });

  assert.equal(contract.architectureSynthesis?.sourceMode, 'curated_first_hybrid');
  assert.equal(contract.architectureSynthesis?.primaryPatternId, 'pattern_alu_core');
  assert.ok((contract.architectureSynthesis?.evidenceClaimIds.length || 0) > 0);
  assert.ok((contract.sourceGroundedRequirements?.length || 0) > 0);
  assert.equal(validateFpgaArchitectureContract({
    contract,
    userRequest: 'Mandatory design class: alu. Design an ALU.',
  }).ok, true);
});

test('contract validation rejects source-grounded requirements with invalid evidence claims', () => {
  const contract = buildFpgaArchitectureContractDraft({
    userRequest: 'Mandatory design class: alu. Design an ALU.',
  });
  assert.ok(contract.sourceGroundedRequirements?.[0]);
  contract.sourceGroundedRequirements![0] = {
    ...contract.sourceGroundedRequirements![0],
    sourceClaimId: 'claim_unknown_unapproved_source',
  };

  const validation = validateFpgaArchitectureContract({
    contract,
    userRequest: 'Mandatory design class: alu. Design an ALU.',
  });

  assert.equal(validation.ok, false);
  assert.ok(validation.issues.some((issue) => issue.code === 'architecture_contract_source_requirement_claim_missing'));
});

test('contract draft accepts approved cached/live architecture evidence facts', () => {
  const snapshot = buildFpgaArchitectureEvidenceSnapshot({
    sourceId: 'method_amd_hierarchy_ooc',
    sourceUrl: 'https://docs.amd.com/r/2020.2-English/ug892-vivado-design-flows-overview/Hierarchical-Design',
    sourceTitle: 'AMD Vivado Design Flows Overview UG892',
    sourceText: 'Use hierarchical design methodology to partition modules and preserve independently validatable implementation blocks.',
  });
  const contract = buildFpgaArchitectureContractDraft({
    userRequest: 'Mandatory design class: alu. Design an ALU.',
    evidenceFacts: snapshot.facts,
    retrievalMode: 'official_live_cached',
  });

  assert.equal(contract.architectureSynthesis?.retrievalMode, 'official_live_cached');
  assert.ok(contract.architectureSynthesis?.evidenceClaimIds.some((claimId) => claimId.startsWith('live_claim_')));
  assert.equal(validateFpgaArchitectureContract({
    contract,
    userRequest: 'Mandatory design class: alu. Design an ALU.',
  }).ok, true);
});

test('contract validation rejects unapproved live evidence URLs and malformed hashes', () => {
  const contract = buildFpgaArchitectureContractDraft({
    userRequest: 'Mandatory design class: alu. Design an ALU.',
  });
  contract.architectureSynthesis!.evidenceClaimIds.push('live_claim_bad_source');
  contract.architectureSynthesis!.sourceHashes = ['not-a-sha'];
  contract.sourceGroundedRequirements!.push({
    id: 'live_source_req_bad',
    sourceClaimId: 'live_claim_bad_source',
    appliesTo: 'architecture',
    requirement: 'Do not trust arbitrary web sources.',
    sourceUrl: 'https://random-blog.example/fpga',
    sourceHash: 'not-a-sha',
  });

  const validation = validateFpgaArchitectureContract({
    contract,
    userRequest: 'Mandatory design class: alu. Design an ALU.',
  });
  const codes = new Set(validation.issues.map((issue) => issue.code));
  assert.equal(codes.has('architecture_evidence_source_unapproved'), true);
  assert.equal(codes.has('architecture_evidence_snapshot_invalid'), true);
});

test('UART/SPI deterministic draft contains exact protocol status expectations', () => {
  const contract = buildFpgaArchitectureContractDraft({
    userRequest: 'Mandatory design class: uart_spi_protocol_bridge. Build a UART-to-SPI bridge.',
  });
  const verification = contract.verification[0];
  const behaviorText = contract.behaviors.map((behavior) => [
    behavior.timing,
    behavior.resetBehavior,
  ].join(' ')).join('\n');
  const actionText = verification?.actions.map((action) => JSON.stringify(action)).join('\n') || '';

  assert.equal(contract.designClass, 'uart_spi_protocol_bridge');
  assert.match(behaviorText, /done_o within four rising clock edges/i);
  assert.match(behaviorText, /error_o = 0/i);
  assert.match(behaviorText, /status_o = x"01"/i);
  assert.match(behaviorText, /status_o = x"00"/i);
  assert.match(verification?.expected || '', /status_o equals x"01"/i);
  assert.match(actionText, /FAIL reset status_o not x00/);
  assert.match(actionText, /FAIL status_o did not report nominal completion/);
  assert.equal(validateFpgaArchitectureContract({
    contract,
    userRequest: 'Mandatory design class: uart_spi_protocol_bridge. Build a UART-to-SPI bridge.',
  }).ok, true);
});

test('contract validation rejects testbench-shaped RTL ownership before VHDL generation', () => {
  const contract = buildFpgaArchitectureContractDraft({
    userRequest: 'Mandatory design class: alu. Design an ALU.',
  });
  const packageComponent = contract.components.find((component) => component.kind === 'package');
  const testbenchComponent = contract.components.find((component) => component.kind === 'testbench');
  assert.ok(packageComponent);
  assert.ok(testbenchComponent);
  contract.components.splice(1, 0, {
    id: 'operation_testbench',
    kind: 'rtl',
    name: 'operation_testbench',
    file: 'src/operation_testbench.vhd',
    responsibility: 'Incorrectly owns a self-checking testbench capability.',
    implements: ['self_checking_operation_testbench'],
    dependsOn: [packageComponent.id],
    children: [],
    clockDomain: contract.clockDomains[0].id,
    generics: [],
    ports: [
      { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
      { name: 'rst', mode: 'in', type: 'std_logic', purpose: 'Reset.' },
    ],
    exports: [],
  });
  testbenchComponent.implements = [];
  contract.sourceOrder = contract.components.map((component) => component.file);

  const validation = validateFpgaArchitectureContract({ contract, userRequest: 'Mandatory design class: alu. Design an ALU.' });
  const codes = new Set(validation.issues.map((issue) => issue.code));
  assert.equal(codes.has('architecture_contract_rtl_testbench_identity'), true);
  assert.equal(codes.has('architecture_contract_capability_owner_kind'), true);
});

test('architecture contract rejects missing ownership, verification, unsafe interfaces, and dependency drift', () => {
  const contract = makeValidContract();
  contract.components[1].implements = [];
  contract.components[1].ports[0].type = 'std_logic_vector';
  contract.components[1].dependsOn = ['alu_pkg', 'missing_pkg'];
  contract.verification[0].covers = ['self_checking_operation_testbench'];
  contract.sourceOrder = ['src/alu_top.vhd', 'src/alu_pkg.vhd', 'tb/tb_alu_top.vhd'];

  const validation = validateFpgaArchitectureContract({ contract, userRequest: 'Design an 8-bit ALU.' });
  const codes = new Set(validation.issues.map((issue) => issue.code));
  assert.equal(validation.ok, false);
  assert.equal(codes.has('architecture_contract_capability_unowned'), true);
  assert.equal(codes.has('architecture_contract_capability_unverified'), true);
  assert.equal(codes.has('architecture_contract_port_type_unconstrained'), true);
  assert.equal(codes.has('architecture_contract_dependency_missing'), true);
  assert.equal(codes.has('architecture_contract_source_dependency_order'), true);
});

test('project conformance gate rejects public interface and analysis-order drift before GHDL', () => {
  const contract = makeValidContract();
  const project = makeMatchingProject();
  assert.equal(validateFpgaArchitectProjectAgainstContract({ project, contract }).ok, true);

  project.files[1].content = project.files[1].content.replace(
    'result_o : out std_logic_vector(7 downto 0)',
    'result_o : out std_logic_vector(15 downto 0)',
  );
  project.ghdl.analysisOrder = ['src/alu_top.vhd', 'src/alu_pkg.vhd', 'tb/tb_alu_top.vhd'];
  const validation = validateFpgaArchitectProjectAgainstContract({ project, contract });
  const codes = new Set(validation.issues.map((issue) => issue.code));
  assert.equal(codes.has('architecture_contract_port_drift'), true);
  assert.equal(codes.has('architecture_contract_source_order_drift'), true);
  assert.throws(() => assertFpgaArchitectProjectMatchesContract({ project, contract }), /drifted from the approved architecture contract/);
});

test('project conformance gate keeps approved generic types and defaults exact', () => {
  const contract = makeValidContract();
  contract.components[1].generics = [{ name: 'DATA_WIDTH', type: 'positive', default: '8' }];
  const project = makeMatchingProject();
  project.files[1].content = project.files[1].content.replace(
    'entity alu_top is',
    'entity alu_top is\n  generic (DATA_WIDTH : positive := 16);',
  );

  const validation = validateFpgaArchitectProjectAgainstContract({ project, contract });
  assert.equal(validation.ok, false);
  assert.ok(validation.issues.some((issue) => issue.code === 'architecture_contract_generic_drift'));

  project.files[1].content = project.files[1].content.replace('positive := 16', 'positive := 8');
  assert.equal(validateFpgaArchitectProjectAgainstContract({ project, contract }).ok, true);
});

test('approved architecture contract is persisted as an app-owned project artifact', () => {
  const contract = makeValidContract();
  const project = makeMatchingProject();
  attachFpgaArchitectureContractArtifact(project, contract);
  attachFpgaArchitectureContractArtifact(project, contract);
  const artifacts = project.files.filter((file) => file.path === 'architecture/architecture-contract.json');
  assert.equal(artifacts.length, 1);
  assert.deepEqual(JSON.parse(artifacts[0].content), contract);
  assert.match(buildApprovedFpgaArchitectureContractSection(contract), /immutable source of truth/);
});

test('contract proposal uses narrow repair prompting before VHDL generation', async () => {
  const contract = makeValidContract();
  const prompts: string[] = [];
  const goodReview = {
    fit: 'good',
    confidence: 0.92,
    selectedPrimaryPattern: 'pattern_alu_core',
    selectedSupportBlocks: ['BB-0044'],
    missingBlocks: [],
    unnecessaryBlocks: [],
    recommendedPrimaryPattern: '',
    recommendedSupportBlocks: [],
    architectureRisks: [],
    reasoningSummary: 'The ALU pattern fits the request.',
  };
  const result = await proposeApprovedFpgaArchitectureContract({
    ai: null,
    provider: 'ollama',
    model: 'test-model',
    userRequest: 'Design an 8-bit ALU.',
    runModelAnalysis: async ({ prompt }) => {
      prompts.push(prompt);
      return {
        text: prompts.length === 1
          ? JSON.stringify(goodReview)
          : prompts.length === 2
            ? '{"schemaVersion":"1.0"}'
            : JSON.stringify(contract),
        telemetry: { durationMs: 1 },
      };
    },
  });
  assert.equal(prompts.length, 3);
  assert.match(prompts[0], /architecture approach/);
  assert.match(prompts[2], /previous architecture contract was rejected/i);
  assert.equal(result.repaired, true);
  assert.equal(result.contract.topEntity, 'alu_top');
});

test('partial architecture selection review is injected into the contract proposal prompt', async () => {
  const contract = makeValidContract();
  const prompts: string[] = [];
  const result = await proposeApprovedFpgaArchitectureContract({
    ai: null,
    provider: 'ollama',
    model: 'test-model',
    userRequest: 'Mandatory design class: alu. Design an 8-bit ALU with saturation.',
    missingBlockFetchText: async () => 'saturating arithmetic unit FPGA VHDL numeric_std overflow saturation',
    runModelAnalysis: async ({ prompt }) => {
      prompts.push(prompt);
      const isMissingBlockReview = /automatically discovered FPGA building-block contracts/.test(prompt);
      return {
        text: prompts.length === 1
          ? JSON.stringify({
            fit: 'partial',
            confidence: 0.81,
            selectedPrimaryPattern: 'pattern_alu_core',
            selectedSupportBlocks: ['BB-0044'],
            missingBlocks: ['saturating_arithmetic_unit'],
            unnecessaryBlocks: [],
            recommendedPrimaryPattern: '',
            recommendedSupportBlocks: ['BB-0049'],
            architectureRisks: ['Saturation behavior must be explicit.'],
            reasoningSummary: 'ALU is right, but saturation support should be included.',
          })
          : isMissingBlockReview
            ? JSON.stringify({
              fit: 'good',
              confidence: 0.88,
              selectedPrimaryPattern: 'pattern_alu_core',
              selectedSupportBlocks: ['saturating_arithmetic_unit'],
              missingBlocks: [],
              unnecessaryBlocks: [],
              recommendedPrimaryPattern: '',
              recommendedSupportBlocks: ['saturating_arithmetic_unit'],
              architectureRisks: [],
              reasoningSummary: 'The discovered saturating datapath contract is appropriate.',
            })
          : JSON.stringify(contract),
        telemetry: { durationMs: 1 },
      };
    },
  });

  assert.equal(prompts.length, 3);
  assert.match(prompts[1], /automatically discovered FPGA building-block contracts/i);
  assert.match(prompts[2], /Architecture selection reviewer feedback/);
  assert.match(prompts[2], /Auto-discovered temporary block contracts/);
  assert.match(prompts[2], /saturating_arithmetic_unit/);
  assert.equal((result as any).architectureSelectionReview.fit, 'partial');
  assert.equal((result as any).missingBlockDiscovery.mode, 'auto_discovered');
});

test('unsafe missing block discovery pauses before architecture contract generation', async () => {
  const prompts: string[] = [];
  await assert.rejects(
    proposeApprovedFpgaArchitectureContract({
      ai: null,
      provider: 'ollama',
      model: 'test-model',
      userRequest: 'Design an FPGA block with a custom quantum oracle adapter.',
      missingBlockFetchText: async () => '',
      runModelAnalysis: async ({ prompt }) => {
        prompts.push(prompt);
        return {
          text: JSON.stringify({
            fit: 'partial',
            confidence: 0.8,
            selectedPrimaryPattern: 'pattern_generic_rtl_project',
            selectedSupportBlocks: [],
            missingBlocks: ['custom:quantum oracle adapter'],
            unnecessaryBlocks: [],
            recommendedPrimaryPattern: '',
            recommendedSupportBlocks: ['custom:quantum oracle adapter'],
            architectureRisks: ['The selected catalog has no safe equivalent.'],
            reasoningSummary: 'The project needs a custom block that is not safely known.',
          }),
          telemetry: { durationMs: 1 },
        };
      },
    }),
    /block discovery paused before VHDL generation/i,
  );
  assert.equal(prompts.length, 1);
});

test('poor architecture selection review pauses before VHDL generation with user action options', async () => {
  const prompts: string[] = [];
  await assert.rejects(
    proposeApprovedFpgaArchitectureContract({
      ai: null,
      provider: 'ollama',
      model: 'test-model',
      userRequest: 'Design a flight controller for a drone.',
      runModelAnalysis: async ({ prompt }) => {
        prompts.push(prompt);
        return {
          text: JSON.stringify({
            fit: 'poor',
            confidence: 0.91,
            selectedPrimaryPattern: 'pattern_protocol_bridge_uart_spi',
            selectedSupportBlocks: ['BB-0001'],
            missingBlocks: ['flight_controller', 'imu_sensor_frontend', 'pid_controller'],
            unnecessaryBlocks: ['uart_spi_protocol_bridge'],
            recommendedPrimaryPattern: 'pattern_flight_controller',
            recommendedSupportBlocks: ['BB-0137', 'BB-0147', 'BB-0138'],
            architectureRisks: ['Selected blocks are communication-only.'],
            reasoningSummary: 'The selected architecture does not match a flight-control request.',
          }),
          telemetry: { durationMs: 1 },
        };
      },
    }),
    /Architecture selection review paused before VHDL generation/,
  );
  assert.equal(prompts.length, 1);
});

test('contract proposal gets two repair attempts before final contract-stage failure', async () => {
  const prompts: string[] = [];
  const goodReview = {
    fit: 'good',
    confidence: 0.92,
    selectedPrimaryPattern: 'pattern_alu_core',
    selectedSupportBlocks: ['BB-0044'],
    missingBlocks: [],
    unnecessaryBlocks: [],
    recommendedPrimaryPattern: '',
    recommendedSupportBlocks: [],
    architectureRisks: [],
    reasoningSummary: 'The ALU pattern fits the request.',
  };
  await assert.rejects(
    proposeApprovedFpgaArchitectureContract({
      ai: null,
      provider: 'ollama',
      model: 'test-model',
      userRequest: 'Design an 8-bit ALU.',
      runModelAnalysis: async ({ prompt }) => {
        prompts.push(prompt);
        return {
          text: prompts.length === 1 ? JSON.stringify(goodReview) : '{"schemaVersion":"1.0"}',
          telemetry: { durationMs: 1 },
        };
      },
    }),
    /before VHDL generation/,
  );
  assert.equal(prompts.length, 4);
  assert.match(prompts[2], /Issue table: code \| path \| message/);
  assert.match(prompts[3], /Return one complete JSON object only/);
});

test('contract proposal falls back to app-owned draft after repeated malformed JSON only', async () => {
  const prompts: string[] = [];
  const goodReview = {
    fit: 'good',
    confidence: 0.92,
    selectedPrimaryPattern: 'pattern_protocol_bridge_uart_spi',
    selectedSupportBlocks: ['BB-0001'],
    missingBlocks: [],
    unnecessaryBlocks: [],
    recommendedPrimaryPattern: '',
    recommendedSupportBlocks: [],
    architectureRisks: [],
    reasoningSummary: 'The bridge pattern fits the request.',
  };
  const result = await proposeApprovedFpgaArchitectureContract({
    ai: null,
    provider: 'ollama',
    model: 'test-model',
    userRequest: 'Mandatory design class: uart_spi_protocol_bridge. Build a UART-to-SPI bridge.',
    runModelAnalysis: async ({ prompt }) => {
      prompts.push(prompt);
      return {
        text: prompts.length === 1
          ? JSON.stringify(goodReview)
          : '{"schemaVersion":"2.0","components":[{"id":"broken"',
        telemetry: { durationMs: 1 },
      };
    },
  });

  assert.equal(prompts.length, 4);
  assert.equal(result.repaired, true);
  assert.equal((result as any).appOwnedFallback, true);
  assert.equal(result.contract.designClass, 'uart_spi_protocol_bridge');
  assert.equal(validateFpgaArchitectureContract({
    contract: result.contract,
    userRequest: 'Mandatory design class: uart_spi_protocol_bridge. Build a UART-to-SPI bridge.',
  }).ok, true);
});
