import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertFpgaArchitectProjectMatchesContract,
  attachFpgaArchitectureContractArtifact,
  buildApprovedFpgaArchitectureContractSection,
  buildFpgaArchitectureContractProposalPrompt,
  parseAndValidateFpgaArchitectureContract,
  proposeApprovedFpgaArchitectureContract,
  validateFpgaArchitectureContract,
  validateFpgaArchitectProjectAgainstContract,
  type FpgaArchitectureContract,
} from '../src/server/fpgaArchitectureContract';
import type { FpgaArchitectProject } from '../src/server/fpgaArchitect';

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
  assert.match(prompt, /alu_pkg_for_opcodes_flags/);
  assert.match(prompt, /Every required capability must be implemented/);
  assert.match(prompt, /sourceOrder/);
  assert.match(prompt, /Return exactly one JSON object/);
});

test('valid architecture contract passes deterministic schema and graph validation', () => {
  const contract = makeValidContract();
  const validation = validateFpgaArchitectureContract({ contract, userRequest: 'Design an 8-bit ALU.' });
  assert.equal(validation.ok, true, JSON.stringify(validation.issues, null, 2));
  assert.deepEqual(parseAndValidateFpgaArchitectureContract({
    text: JSON.stringify(contract),
    userRequest: 'Design an 8-bit ALU.',
  }), contract);
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

test('contract proposal gets one narrow repair attempt before VHDL generation', async () => {
  const contract = makeValidContract();
  const prompts: string[] = [];
  const result = await proposeApprovedFpgaArchitectureContract({
    ai: null,
    provider: 'ollama',
    model: 'test-model',
    userRequest: 'Design an 8-bit ALU.',
    runModelAnalysis: async ({ prompt }) => {
      prompts.push(prompt);
      return {
        text: prompts.length === 1 ? '{"schemaVersion":"1.0"}' : JSON.stringify(contract),
        telemetry: { durationMs: 1 },
      };
    },
  });
  assert.equal(prompts.length, 2);
  assert.match(prompts[1], /previous architecture contract was rejected/i);
  assert.equal(result.repaired, true);
  assert.equal(result.contract.topEntity, 'alu_top');
});
