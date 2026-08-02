import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import test from 'node:test';
import {
  rewrapModelImplementationIntoSkeleton,
  runStagedFpgaArchitectGeneration,
  ModelVhdlGenerationBlockedByPolicyError,
  HybridImplementationSourceUnresolvedError,
  StagedComponentOutputOwnershipError,
  StagedComponentEntityMissingError,
  StagedPortInterfaceDriftError,
} from '../src/server/fpgaArchitectStagedGeneration';
import {
  buildVhdlSpecialistAdvisorPrompt,
  scoreVhdlSpecialistAdvisorResponse,
} from '../src/server/fpgaVhdlSpecialistAdvisor';
import { parseFpgaArchitectResponse } from '../src/server/fpgaArchitect';
import type { FpgaArchitectureContract } from '../src/server/fpgaArchitectureContract';
import {
  buildLeafBehaviorSignature,
  buildLeafInterfaceSignature,
  writeGoldenLeafLibrary,
} from '../src/server/fpgaGoldenLeafLibrary';
import { renderDeterministicLeafTemplate } from '../src/server/fpgaDeterministicLeafTemplates';

const contract: FpgaArchitectureContract = {
  schemaVersion: '2.0', designName: 'logic_gate', designClass: 'generic_fpga_vhdl_system', topEntity: 'logic_gate', topTestbench: 'tb_logic_gate', systemIntent: 'Implement one AND gate.', assumptions: ['Combinational.'], requiredCapabilityIds: [],
  components: [
    { id: 'logic_gate', kind: 'top', name: 'logic_gate', file: 'src/logic_gate.vhd', responsibility: 'AND inputs.', implements: [], dependsOn: [], children: [], clockDomain: null, generics: [], ports: [{ name: 'a_i', mode: 'in', type: 'std_logic', purpose: 'A.' }, { name: 'b_i', mode: 'in', type: 'std_logic', purpose: 'B.' }, { name: 'y_o', mode: 'out', type: 'std_logic', purpose: 'Y.' }], exports: [] },
    { id: 'tb_logic_gate', kind: 'testbench', name: 'tb_logic_gate', file: 'tb/tb_logic_gate.vhd', responsibility: 'Check AND.', implements: [], dependsOn: ['logic_gate'], children: ['logic_gate'], clockDomain: null, generics: [], ports: [], exports: [] },
  ], clockDomains: [], behaviors: [{ id: 'and_behavior', requirement: 'Y is A and B.', inputs: ['a_i', 'b_i'], outputs: ['y_o'], timing: 'Delta cycle.', resetBehavior: 'No reset.', latencyCycles: 0 }],
  verification: [{ id: 'check_and', requirement: 'Check AND.', stimulus: 'Drive ones.', expected: 'One.', observables: ['y_o'], covers: [], coversBehaviors: ['and_behavior'], actions: [{ kind: 'drive', signal: 'a_i', value: "'1'" }, { kind: 'drive', signal: 'b_i', value: "'1'" }, { kind: 'expect', signal: 'y_o', value: "'1'", message: 'AND' }, { kind: 'finish', message: 'TEST PASSED' }] }],
  numericFormats: [], instances: [{ id: 'tb_dut', parentComponentId: 'tb_logic_gate', childComponentId: 'logic_gate', label: 'dut', genericMap: {}, portMap: { a_i: 'a_i', b_i: 'b_i', y_o: 'y_o' } }], connections: [], stateMachines: [], sourceOrder: ['src/logic_gate.vhd', 'tb/tb_logic_gate.vhd'],
};

test('strict staged generation renders deterministic logic leaf without calling the model', async () => {
  const result = await runStagedFpgaArchitectGeneration({
    ai: null,
    provider: 'ollama',
    model: 'model',
    contract,
    maxStageOutputChars: 20_000,
    runModelAnalysis: async () => {
      throw new Error('model must not be called under strict deterministic VHDL policy');
    },
  });

  const logicFile = result.project.files.find((file) => file.path === 'src/logic_gate.vhd')?.content || '';
  assert.equal(result.attempts.length, 0);
  assert.match(logicFile, /DETERMINISTIC_TEMPLATE: scalar logic AND/i);
  assert.match(logicFile, /y_o <= a_i and b_i;/i);
});

test('strict staged generation blocks fresh model VHDL when no verified or deterministic source exists', async () => {
  const strictContract: FpgaArchitectureContract = {
    ...contract,
    designName: 'custom_crypto',
    topEntity: 'custom_crypto_top',
    topTestbench: 'tb_custom_crypto_top',
    components: [
      {
        id: 'custom_crypto_unit',
        kind: 'rtl',
        name: 'custom_crypto_unit',
        file: 'src/custom_crypto_unit.vhd',
        responsibility: 'Implement a custom cryptographic transform not covered by deterministic templates.',
        implements: [],
        dependsOn: [],
        children: [],
        clockDomain: null,
        generics: [],
        ports: [
          { name: 'data_i', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'Input byte.' },
          { name: 'ready_o', mode: 'out', type: 'std_logic', purpose: 'Ready flag.' },
        ],
        exports: [],
      },
      {
        id: 'custom_crypto_top',
        kind: 'top',
        name: 'custom_crypto_top',
        file: 'src/custom_crypto_top.vhd',
        responsibility: 'Integrate custom crypto.',
        implements: [],
        dependsOn: ['custom_crypto_unit'],
        children: ['custom_crypto_unit'],
        clockDomain: null,
        generics: [],
        ports: [
          { name: 'data_i', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'Input byte.' },
          { name: 'ready_o', mode: 'out', type: 'std_logic', purpose: 'Ready flag.' },
        ],
        exports: [],
      },
      {
        id: 'tb_custom_crypto_top',
        kind: 'testbench',
        name: 'tb_custom_crypto_top',
        file: 'tb/tb_custom_crypto_top.vhd',
        responsibility: 'Check custom crypto top.',
        implements: [],
        dependsOn: ['custom_crypto_top'],
        children: ['custom_crypto_top'],
        clockDomain: null,
        generics: [],
        ports: [],
        exports: [],
      },
    ],
    instances: [
      { id: 'u_custom_crypto_unit', parentComponentId: 'custom_crypto_top', childComponentId: 'custom_crypto_unit', label: 'u_custom_crypto_unit', genericMap: {}, portMap: { data_i: 'data_i', ready_o: 'ready_o' } },
      { id: 'tb_dut', parentComponentId: 'tb_custom_crypto_top', childComponentId: 'custom_crypto_top', label: 'dut', genericMap: {}, portMap: { data_i: 'data_i', ready_o: 'ready_o' } },
    ],
    sourceOrder: ['src/custom_crypto_unit.vhd', 'src/custom_crypto_top.vhd', 'tb/tb_custom_crypto_top.vhd'],
  };

  await assert.rejects(
    runStagedFpgaArchitectGeneration({
      ai: null,
      provider: 'ollama',
      model: 'model',
      contract: strictContract,
      maxStageOutputChars: 20_000,
      runModelAnalysis: async () => {
        throw new Error('model must not be called for missing deterministic implementation source');
      },
    }),
    (error: unknown) => {
      assert.ok(error instanceof ModelVhdlGenerationBlockedByPolicyError);
      assert.equal(error.failureCode, 'model_vhdl_generation_blocked_by_policy');
      assert.equal(error.componentId, 'custom_crypto_unit');
      return true;
    },
  );
});

test('deterministic leaf templates cover generic sample input and stream ingress roles', () => {
  const sampleComponent = {
    id: 'sample_input_stage',
    kind: 'rtl' as const,
    name: 'sample_input_stage',
    file: 'src/sample_input_stage.vhd',
    responsibility: 'Accept valid samples and align input handshakes.',
    implements: [],
    dependsOn: [],
    children: [],
    clockDomain: 'clk',
    generics: [],
    ports: [
      { name: 'clk', mode: 'in' as const, type: 'std_logic', purpose: 'Clock.' },
      { name: 'rst', mode: 'in' as const, type: 'std_logic', purpose: 'Reset.' },
      { name: 'sample_i', mode: 'in' as const, type: 'std_logic_vector(15 downto 0)', purpose: 'Sample.' },
      { name: 'valid_i', mode: 'in' as const, type: 'std_logic', purpose: 'Valid.' },
      { name: 'sample_o', mode: 'out' as const, type: 'std_logic_vector(15 downto 0)', purpose: 'Registered sample.' },
      { name: 'valid_o', mode: 'out' as const, type: 'std_logic', purpose: 'Output valid.' },
      { name: 'ready_o', mode: 'out' as const, type: 'std_logic', purpose: 'Input ready.' },
    ],
    exports: [],
  };
  const streamComponent = {
    ...sampleComponent,
    id: 'ingress_interface_blocks',
    name: 'ingress_interface_blocks',
    file: 'src/ingress_interface_blocks.vhd',
    responsibility: 'Own valid/ready input handshake and packet capture.',
    ports: [
      { name: 'clk', mode: 'in' as const, type: 'std_logic', purpose: 'Clock.' },
      { name: 'rst', mode: 'in' as const, type: 'std_logic', purpose: 'Reset.' },
      { name: 's_valid_i', mode: 'in' as const, type: 'std_logic', purpose: 'Stream valid.' },
      { name: 's_data_i', mode: 'in' as const, type: 'std_logic_vector(7 downto 0)', purpose: 'Stream data.' },
      { name: 's_last_i', mode: 'in' as const, type: 'std_logic', purpose: 'Stream last.' },
      { name: 'm_valid_o', mode: 'out' as const, type: 'std_logic', purpose: 'Captured valid.' },
      { name: 'm_data_o', mode: 'out' as const, type: 'std_logic_vector(7 downto 0)', purpose: 'Captured data.' },
      { name: 'm_last_o', mode: 'out' as const, type: 'std_logic', purpose: 'Captured last.' },
      { name: 's_ready_o', mode: 'out' as const, type: 'std_logic', purpose: 'Ready.' },
    ],
  };

  const sampleTemplate = renderDeterministicLeafTemplate({ contract, component: sampleComponent });
  const streamTemplate = renderDeterministicLeafTemplate({ contract, component: streamComponent });

  assert.equal(sampleTemplate?.templateId, 'deterministic_sample_input_stage');
  assert.match(sampleTemplate?.content || '', /sample_o_r <= sample_i;/);
  assert.match(sampleTemplate?.content || '', /ready_o <= '1';/);
  assert.equal(streamTemplate?.templateId, 'deterministic_stream_boundary_leaf');
  assert.match(streamTemplate?.content || '', /m_data_o_r <= s_data_i;/);
  assert.match(streamTemplate?.content || '', /m_last_o_r <= s_last_i;/);
  assert.match(streamTemplate?.content || '', /s_ready_o <= '1';/);
});

test('strict staged generation renders framebuffer pixel stage without illegal integer bitmask operators', async () => {
  const videoContract: FpgaArchitectureContract = {
    ...contract,
    designName: 'video_pattern',
    designClass: 'video_pattern_generator',
    topEntity: 'video_top',
    topTestbench: 'tb_video_top',
    components: [
      {
        id: 'pattern_or_framebuffer_stage',
        kind: 'rtl',
        name: 'pattern_or_framebuffer_stage',
        file: 'src/pattern_or_framebuffer_stage.vhd',
        responsibility: 'Produce deterministic pixel data from a framebuffer address.',
        implements: [],
        dependsOn: [],
        children: [],
        clockDomain: null,
        generics: [],
        ports: [
          { name: 'fb_addr', mode: 'in', type: 'std_logic_vector(18 downto 0)', purpose: 'Framebuffer address.' },
          { name: 'active_i', mode: 'in', type: 'std_logic', purpose: 'Active video.' },
          { name: 'pixel_val', mode: 'out', type: 'std_logic_vector(7 downto 0)', purpose: 'Pixel value.' },
        ],
        exports: [],
      },
      {
        id: 'video_top',
        kind: 'top',
        name: 'video_top',
        file: 'src/video_top.vhd',
        responsibility: 'Integrate video pattern stage.',
        implements: [],
        dependsOn: ['pattern_or_framebuffer_stage'],
        children: ['pattern_or_framebuffer_stage'],
        clockDomain: null,
        generics: [],
        ports: [
          { name: 'fb_addr', mode: 'in', type: 'std_logic_vector(18 downto 0)', purpose: 'Framebuffer address.' },
          { name: 'active_i', mode: 'in', type: 'std_logic', purpose: 'Active video.' },
          { name: 'pixel_val', mode: 'out', type: 'std_logic_vector(7 downto 0)', purpose: 'Pixel value.' },
        ],
        exports: [],
      },
      {
        id: 'tb_video_top',
        kind: 'testbench',
        name: 'tb_video_top',
        file: 'tb/tb_video_top.vhd',
        responsibility: 'Check video top.',
        implements: [],
        dependsOn: ['video_top'],
        children: ['video_top'],
        clockDomain: null,
        generics: [],
        ports: [],
        exports: [],
      },
    ],
    instances: [
      { id: 'u_pattern', parentComponentId: 'video_top', childComponentId: 'pattern_or_framebuffer_stage', label: 'u_pattern', genericMap: {}, portMap: { fb_addr: 'fb_addr', active_i: 'active_i', pixel_val: 'pixel_val' } },
      { id: 'tb_dut', parentComponentId: 'tb_video_top', childComponentId: 'video_top', label: 'dut', genericMap: {}, portMap: { fb_addr: 'fb_addr', active_i: 'active_i', pixel_val: 'pixel_val' } },
    ],
    verification: [{
      id: 'check_pixel_stage',
      requirement: 'Check active pixel output.',
      stimulus: 'Drive active video and address.',
      expected: 'Pixel value is deterministic.',
      observables: ['pixel_val'],
      covers: [],
      coversBehaviors: [],
      actions: [
        { kind: 'drive', signal: 'active_i', value: "'1'" },
        { kind: 'drive', signal: 'fb_addr', value: '"0000000000000000011"' },
        { kind: 'finish', message: 'TEST PASSED' },
      ],
    }],
    sourceOrder: ['src/pattern_or_framebuffer_stage.vhd', 'src/video_top.vhd', 'tb/tb_video_top.vhd'],
  };
  const result = await runStagedFpgaArchitectGeneration({
    ai: null,
    provider: 'ollama',
    model: 'model',
    contract: videoContract,
    maxStageOutputChars: 20_000,
    runModelAnalysis: async () => {
      throw new Error('model must not be called for deterministic video pixel template');
    },
  });

  const pixelFile = result.project.files.find((file) => file.path === 'src/pattern_or_framebuffer_stage.vhd')?.content || '';
  assert.doesNotMatch(pixelFile, /to_integer\s*\(\s*unsigned\s*\([^)]*\)\s*\)\s+and\s+255/i);
  assert.match(pixelFile, /resize\(unsigned\(fb_addr\),\s*8\)/i);
});

function fifoGoldenVhdl(width = 8) {
  return [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'use ieee.numeric_std.all;',
    'entity rx_fifo is',
    '  port (',
    '    clk : in std_logic;',
    '    rst : in std_logic;',
    `    data_i : in std_logic_vector(${width - 1} downto 0);`,
    `    data_o : out std_logic_vector(${width - 1} downto 0)`,
    '  );',
    'end entity rx_fifo;',
    'architecture rtl of rx_fifo is',
    'begin',
    '  data_o <= data_i;',
    'end architecture rtl;',
    '',
  ].join('\n');
}

function makeGoldenLeafContract(width = 8, clockDomain = 'clk'): FpgaArchitectureContract {
  const vectorType = `std_logic_vector(${width - 1} downto 0)`;
  return {
    schemaVersion: '2.0',
    designName: 'uart_spi_bridge',
    designClass: 'uart_spi_protocol_bridge',
    topEntity: 'fifo_top',
    topTestbench: 'tb_fifo_top',
    systemIntent: 'Exercise golden leaf reuse.',
    assumptions: [],
    requiredCapabilityIds: [],
    components: [
      {
        id: 'rx_fifo',
        kind: 'rtl',
        name: 'rx_fifo',
        file: 'src/rx_fifo.vhd',
        responsibility: 'Buffer response bytes with bounded pointer/index logic.',
        implements: [],
        dependsOn: [],
        children: [],
        clockDomain,
        generics: [],
        ports: [
          { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
          { name: 'rst', mode: 'in', type: 'std_logic', purpose: 'Reset.' },
          { name: 'data_i', mode: 'in', type: vectorType, purpose: 'Input.' },
          { name: 'data_o', mode: 'out', type: vectorType, purpose: 'Output.' },
        ],
        exports: [],
      },
      {
        id: 'fifo_top',
        kind: 'top',
        name: 'fifo_top',
        file: 'src/fifo_top.vhd',
        responsibility: 'Instantiate FIFO.',
        implements: [],
        dependsOn: ['rx_fifo'],
        children: ['rx_fifo'],
        clockDomain,
        generics: [],
        ports: [
          { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
          { name: 'rst', mode: 'in', type: 'std_logic', purpose: 'Reset.' },
          { name: 'data_i', mode: 'in', type: vectorType, purpose: 'Input.' },
          { name: 'data_o', mode: 'out', type: vectorType, purpose: 'Output.' },
        ],
        exports: [],
      },
      {
        id: 'tb_fifo_top',
        kind: 'testbench',
        name: 'tb_fifo_top',
        file: 'tb/tb_fifo_top.vhd',
        responsibility: 'Self-check FIFO top.',
        implements: [],
        dependsOn: ['fifo_top'],
        children: ['fifo_top'],
        clockDomain: null,
        generics: [],
        ports: [],
        exports: [],
      },
    ],
    clockDomains: [],
    behaviors: [{ id: 'fifo_move', requirement: 'Move data.', inputs: ['data_i'], outputs: ['data_o'], timing: 'one cycle', resetBehavior: 'zero', latencyCycles: 1 }],
    verification: [],
    numericFormats: [],
    instances: [
      { id: 'fifo_inst', parentComponentId: 'fifo_top', childComponentId: 'rx_fifo', label: 'u_rx_fifo', genericMap: {}, portMap: { clk: 'clk', rst: 'rst', data_i: 'data_i', data_o: 'data_o' } },
      { id: 'tb_dut', parentComponentId: 'tb_fifo_top', childComponentId: 'fifo_top', label: 'dut', genericMap: {}, portMap: { clk: 'clk', rst: 'rst', data_i: 'data_i', data_o: 'data_o' } },
    ],
    connections: [],
    stateMachines: [],
    sourceOrder: ['src/rx_fifo.vhd', 'src/fifo_top.vhd', 'tb/tb_fifo_top.vhd'],
  };
}

function makeConfigurableFifoContract(width = 16, depth = 64): FpgaArchitectureContract {
  const componentGenerics = [
    { name: 'DATA_WIDTH', type: 'positive', default: String(width) },
    { name: 'DEPTH', type: 'positive', default: String(depth) },
  ];
  const leafPorts = [
    { name: 'clk', mode: 'in' as const, type: 'std_logic', purpose: 'Clock.' },
    { name: 'rst', mode: 'in' as const, type: 'std_logic', purpose: 'Reset.' },
    { name: 'data_i', mode: 'in' as const, type: 'std_logic_vector(DATA_WIDTH-1 downto 0)', purpose: 'Input.' },
    { name: 'data_o', mode: 'out' as const, type: 'std_logic_vector(DATA_WIDTH-1 downto 0)', purpose: 'Output.' },
  ];
  const topPorts = [
    { name: 'clk', mode: 'in' as const, type: 'std_logic', purpose: 'Clock.' },
    { name: 'rst', mode: 'in' as const, type: 'std_logic', purpose: 'Reset.' },
    { name: 'data_i', mode: 'in' as const, type: `std_logic_vector(${width - 1} downto 0)`, purpose: 'Input.' },
    { name: 'data_o', mode: 'out' as const, type: `std_logic_vector(${width - 1} downto 0)`, purpose: 'Output.' },
  ];
  return {
    ...makeGoldenLeafContract(),
    components: [
      {
        id: 'rx_fifo',
        kind: 'rtl',
        name: 'rx_fifo',
        file: 'src/rx_fifo.vhd',
        responsibility: 'Configurable FIFO.',
        implements: [],
        dependsOn: [],
        children: [],
        clockDomain: 'clk',
        generics: componentGenerics,
        ports: leafPorts,
        exports: [],
      },
      {
        id: 'fifo_top',
        kind: 'top',
        name: 'fifo_top',
        file: 'src/fifo_top.vhd',
        responsibility: 'Instantiate configurable FIFO.',
        implements: [],
        dependsOn: ['rx_fifo'],
        children: ['rx_fifo'],
        clockDomain: 'clk',
        generics: [],
        ports: topPorts,
        exports: [],
      },
      {
        id: 'tb_fifo_top',
        kind: 'testbench',
        name: 'tb_fifo_top',
        file: 'tb/tb_fifo_top.vhd',
        responsibility: 'Self-check configurable FIFO top.',
        implements: [],
        dependsOn: ['fifo_top'],
        children: ['fifo_top'],
        clockDomain: null,
        generics: [],
        ports: [],
        exports: [],
      },
    ],
    instances: [
      {
        id: 'fifo_inst',
        parentComponentId: 'fifo_top',
        childComponentId: 'rx_fifo',
        label: 'u_rx_fifo',
        genericMap: { DATA_WIDTH: String(width), DEPTH: String(depth) },
        portMap: { clk: 'clk', rst: 'rst', data_i: 'data_i', data_o: 'data_o' },
      },
      { id: 'tb_dut', parentComponentId: 'tb_fifo_top', childComponentId: 'fifo_top', label: 'dut', genericMap: {}, portMap: { clk: 'clk', rst: 'rst', data_i: 'data_i', data_o: 'data_o' } },
    ],
  };
}

async function writeGoldenLibraryForContract(libraryPath: string, sourceContract = makeGoldenLeafContract(), passCount = 2) {
  const component = sourceContract.components.find((candidate) => candidate.id === 'rx_fifo')!;
  await writeGoldenLeafLibrary(libraryPath, {
    libraryVersion: 1,
    blocks: [{
      libraryVersion: 1,
      designClass: sourceContract.designClass,
      componentId: component.id,
      entityName: component.name,
      filePath: component.file,
      interfaceSignature: buildLeafInterfaceSignature(component),
      behaviorSignature: buildLeafBehaviorSignature(sourceContract, component),
      contentHash: 'golden-hash',
      contractHash: 'contract-hash',
      sourceDesignKey: 'uart_spi_bridge',
      sourceAttempt: 1,
      passCount,
      repairCount: 0,
      promotedAt: '2026-01-01T00:00:00.000Z',
      vhdlContent: fifoGoldenVhdl(),
    }],
  });
}

async function writeVerifiedVhdlLibraryForContract(root: string, sourceContract = makeGoldenLeafContract()) {
  const component = sourceContract.components.find((candidate) => candidate.id === 'rx_fifo')!;
  await fs.mkdir(path.join(root, 'reports'), { recursive: true });
  await fs.mkdir(path.join(root, 'rtl', 'blocks', 'memory'), { recursive: true });
  await fs.mkdir(path.join(root, 'rtl', 'common'), { recursive: true });
  await fs.mkdir(path.join(root, 'rtl', 'cores'), { recursive: true });
  await fs.mkdir(path.join(root, 'tb', 'blocks', 'memory'), { recursive: true });
  await fs.writeFile(path.join(root, 'reports', 'verification_matrix.csv'), [
    'block_id,name,category,subcategory,origin,function,archetype,implementation_tier,protocol_status,timing_status,cdc_status,numeric_status,core,source_file,testbench_file,static_validation,ghdl_analysis,functional_simulation',
    '0001,rx_fifo,Memory,FIFO,fixture,FIFO fixture,leaf,A,ok,ok,ok,ok,bb_fifo_core,rtl/blocks/memory/rx_fifo.vhd,tb/blocks/memory/tb_rx_fifo.vhd,PASS,PASS,PASS',
    '',
  ].join('\n'));
  await fs.writeFile(path.join(root, 'rtl', 'common', 'bb_util_pkg.vhd'), 'package bb_util_pkg is end package;\n');
  await fs.writeFile(path.join(root, 'rtl', 'cores', 'bb_fifo_core.vhd'), [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity bb_fifo_core is',
    '  port (data_i : in std_logic_vector(7 downto 0); data_o : out std_logic_vector(7 downto 0));',
    'end entity;',
    'architecture rtl of bb_fifo_core is begin',
    '  data_o <= data_i;',
    'end architecture;',
    '',
  ].join('\n'));
  await fs.writeFile(path.join(root, 'rtl', 'blocks', 'memory', 'rx_fifo.vhd'), [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'use work.bb_util_pkg.all;',
    'entity rx_fifo is',
    '  port (',
    '    clk : in std_logic;',
    '    rst : in std_logic;',
    '    data_i : in std_logic_vector(7 downto 0);',
    '    data_o : out std_logic_vector(7 downto 0)',
    '  );',
    'end entity rx_fifo;',
    'architecture rtl of rx_fifo is begin',
    '  u_core : entity work.bb_fifo_core port map(data_i => data_i, data_o => data_o);',
    'end architecture rtl;',
    '',
  ].join('\n'));
  await fs.writeFile(path.join(root, 'tb', 'blocks', 'memory', 'tb_rx_fifo.vhd'), 'entity tb_rx_fifo is end entity;\narchitecture sim of tb_rx_fifo is begin end architecture;\n');
  const qualificationPath = path.join(root, 'qualification.json');
  const target = { ok: true, exitCode: 0, summary: 'passed' };
  await fs.writeFile(qualificationPath, JSON.stringify({
    libraryVersion: 'fixture',
    libraryRoot: root,
    ghdlVersion: 'GHDL fixture',
    verifiedAt: '2026-01-01T00:00:00.000Z',
    blockCount: 1,
    testbenchCount: 1,
    coreCount: 1,
    trustedForReuse: true,
    targets: { static: target, 'core-regression': target, 'all-smokes': target },
    warnings: [],
  }, null, 2));
  assert.equal(component.name, 'rx_fifo');
  return qualificationPath;
}

async function writeConfigurableVerifiedVhdlLibrary(root: string) {
  const qualificationPath = await writeVerifiedVhdlLibraryForContract(root);
  await fs.writeFile(path.join(root, 'rtl', 'blocks', 'memory', 'rx_fifo.vhd'), [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity rx_fifo is',
    '  generic (',
    '    DATA_WIDTH : positive := 8;',
    '    DEPTH : positive := 16',
    '  );',
    '  port (',
    '    clk : in std_logic;',
    '    rst : in std_logic;',
    '    data_i : in std_logic_vector(DATA_WIDTH-1 downto 0);',
    '    data_o : out std_logic_vector(DATA_WIDTH-1 downto 0)',
    '  );',
    'end entity rx_fifo;',
    'architecture rtl of rx_fifo is begin',
    '  data_o <= data_i;',
    'end architecture rtl;',
    '',
  ].join('\n'));
  return qualificationPath;
}

function makeUartRxContractMissingVerifiedGenerics(): FpgaArchitectureContract {
  const base = makeGoldenLeafContract();
  return {
    ...base,
    designName: 'uart_rx_demo',
    designClass: 'uart_core',
    topEntity: 'uart_rx_top',
    topTestbench: 'tb_uart_rx_top',
    components: [
      {
        id: 'uart_rx',
        kind: 'rtl',
        name: 'uart_rx',
        file: 'src/uart_rx.vhd',
        responsibility: 'Receive UART frames.',
        implements: [],
        dependsOn: [],
        children: [],
        clockDomain: 'clk',
        generics: [],
        ports: [
          { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
          { name: 'rst', mode: 'in', type: 'std_logic', purpose: 'Reset.' },
          { name: 'rx_i', mode: 'in', type: 'std_logic', purpose: 'UART serial input.' },
          { name: 'data_o', mode: 'out', type: 'std_logic_vector(DATA_BITS-1 downto 0)', purpose: 'Received byte.' },
          { name: 'valid_o', mode: 'out', type: 'std_logic', purpose: 'Data valid pulse.' },
        ],
        exports: [],
      },
      {
        id: 'uart_rx_top',
        kind: 'top',
        name: 'uart_rx_top',
        file: 'src/uart_rx_top.vhd',
        responsibility: 'Instantiate UART RX.',
        implements: [],
        dependsOn: ['uart_rx'],
        children: ['uart_rx'],
        clockDomain: 'clk',
        generics: [],
        ports: [
          { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
          { name: 'rst', mode: 'in', type: 'std_logic', purpose: 'Reset.' },
          { name: 'rx_i', mode: 'in', type: 'std_logic', purpose: 'UART serial input.' },
          { name: 'data_o', mode: 'out', type: 'std_logic_vector(7 downto 0)', purpose: 'Received byte.' },
          { name: 'valid_o', mode: 'out', type: 'std_logic', purpose: 'Data valid pulse.' },
        ],
        exports: [],
      },
      {
        id: 'tb_uart_rx_top',
        kind: 'testbench',
        name: 'tb_uart_rx_top',
        file: 'tb/tb_uart_rx_top.vhd',
        responsibility: 'Self-check UART RX.',
        implements: [],
        dependsOn: ['uart_rx_top'],
        children: ['uart_rx_top'],
        clockDomain: null,
        generics: [],
        ports: [],
        exports: [],
      },
    ],
    instances: [
      { id: 'uart_rx_inst', parentComponentId: 'uart_rx_top', childComponentId: 'uart_rx', label: 'u_uart_rx', genericMap: {}, portMap: { clk: 'clk', rst: 'rst', rx_i: 'rx_i', data_o: 'data_o', valid_o: 'valid_o' } },
      { id: 'tb_dut', parentComponentId: 'tb_uart_rx_top', childComponentId: 'uart_rx_top', label: 'dut', genericMap: {}, portMap: { clk: 'clk', rst: 'rst', rx_i: 'rx_i', data_o: 'data_o', valid_o: 'valid_o' } },
    ],
    sourceOrder: ['src/uart_rx.vhd', 'src/uart_rx_top.vhd', 'tb/tb_uart_rx_top.vhd'],
    assumptions: ['UART RX demo uses verified-library defaults when the prompt does not specify clock/baud/data bits.'],
  };
}

async function writeUartRxVerifiedVhdlLibrary(root: string) {
  await fs.mkdir(path.join(root, 'reports'), { recursive: true });
  await fs.mkdir(path.join(root, 'rtl', 'blocks', 'communication'), { recursive: true });
  await fs.writeFile(path.join(root, 'reports', 'verification_matrix.csv'), [
    'block_id,name,category,subcategory,origin,function,archetype,implementation_tier,protocol_status,timing_status,cdc_status,numeric_status,core,source_file,testbench_file,static_validation,ghdl_analysis,functional_simulation',
    '0002,uart_rx,Communication,UART,fixture,UART RX fixture,leaf,A,ok,ok,ok,ok,,rtl/blocks/communication/uart_rx.vhd,,PASS,PASS,PASS',
    '',
  ].join('\n'));
  await fs.writeFile(path.join(root, 'rtl', 'blocks', 'communication', 'uart_rx.vhd'), [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity uart_rx is',
    '  generic (',
    '    CLOCK_HZ : positive := 100000000;',
    '    BAUD_RATE : positive := 115200;',
    '    DATA_BITS : positive := 8',
    '  );',
    '  port (',
    '    clk : in std_logic;',
    '    rst : in std_logic;',
    '    rx_i : in std_logic;',
    '    data_o : out std_logic_vector(DATA_BITS-1 downto 0);',
    '    valid_o : out std_logic',
    '  );',
    'end entity uart_rx;',
    'architecture rtl of uart_rx is begin',
    "  data_o <= (others => '0');",
    "  valid_o <= '0';",
    'end architecture rtl;',
    '',
  ].join('\n'));
  const target = { ok: true, exitCode: 0, summary: 'passed' };
  const qualificationPath = path.join(root, 'qualification.json');
  await fs.writeFile(qualificationPath, JSON.stringify({
    libraryVersion: 'fixture',
    libraryRoot: root,
    ghdlVersion: 'GHDL fixture',
    verifiedAt: '2026-01-01T00:00:00.000Z',
    blockCount: 1,
    testbenchCount: 0,
    coreCount: 0,
    trustedForReuse: true,
    targets: { static: target, 'core-regression': target, 'all-smokes': target },
    warnings: [],
  }, null, 2));
  return qualificationPath;
}

test('staged generation uses the model only for constrained RTL and preserves manifest compatibility', async () => {
  const prompts: string[] = [];
  const progress: string[] = [];
  const result = await runStagedFpgaArchitectGeneration({
    ai: null, provider: 'ollama', model: 'model', contract, maxStageOutputChars: 20_000, vhdlImplementationPolicy: 'allow_model_vhdl_fallback',
    runModelAnalysis: async ({ prompt, generationProfile }) => {
      prompts.push(prompt);
      assert.equal(generationProfile?.temperature, 0);
      return { text: `library ieee; use ieee.std_logic_1164.all; entity logic_gate is port (a_i : in std_logic; b_i : in std_logic; y_o : out std_logic); end entity logic_gate; architecture rtl of logic_gate is begin y_o <= a_i and b_i; end architecture rtl;`, telemetry: { durationMs: 1 } };
    },
    onStageProgress: async ({ stage, status }) => { progress.push(`${stage}:${status}`); },
  });
  assert.equal(prompts.length, 1);
  assert.match(prompts[0], /Replace only the two MODEL_IMPLEMENTATION regions/);
  assert.equal(result.project.files.some((file) => file.path === 'tb/tb_logic_gate.vhd'), true);
  assert.equal(parseFpgaArchitectResponse(result.text).topEntity, 'logic_gate');
  assert.equal(progress.includes('testbench:completed'), true);
});

test('staged generation retries a component once when the public port interface drifts', async () => {
  const prompts: string[] = [];
  const result = await runStagedFpgaArchitectGeneration({
    ai: null, provider: 'ollama', model: 'model', contract, maxStageOutputChars: 20_000, vhdlImplementationPolicy: 'allow_model_vhdl_fallback',
    runModelAnalysis: async ({ prompt }) => {
      prompts.push(prompt);
      if (prompts.length === 1) {
        return { text: 'library ieee; use ieee.std_logic_1164.all; entity logic_gate is port (a_i : in std_logic; b_i : in std_logic; bad_o : out std_logic); end entity logic_gate; architecture rtl of logic_gate is begin bad_o <= a_i and b_i; end architecture rtl;', telemetry: { durationMs: 1 } };
      }
      return { text: 'library ieee; use ieee.std_logic_1164.all; entity logic_gate is port (a_i : in std_logic; b_i : in std_logic; y_o : out std_logic); end entity logic_gate; architecture rtl of logic_gate is begin y_o <= a_i and b_i; end architecture rtl;', telemetry: { durationMs: 1 } };
    },
  });

  assert.equal(prompts.length, 2);
  assert.match(prompts[1], /staged_port_interface_drift/);
  assert.match(prompts[1], /expectedPorts: a_i, b_i, y_o/);
  assert.equal(result.attempts.length, 2);
  assert.match(result.project.files.find((file) => file.path === 'src/logic_gate.vhd')?.content || '', /y_o <= a_i and b_i/);
});

test('staged generation retries a component once when it assigns a non-owned output', async () => {
  const prompts: string[] = [];
  const result = await runStagedFpgaArchitectGeneration({
    ai: null, provider: 'ollama', model: 'model', contract, maxStageOutputChars: 20_000, vhdlImplementationPolicy: 'allow_model_vhdl_fallback',
    runModelAnalysis: async ({ prompt }) => {
      prompts.push(prompt);
      if (prompts.length === 1) {
        return { text: 'library ieee; use ieee.std_logic_1164.all; entity logic_gate is port (a_i : in std_logic; b_i : in std_logic; y_o : out std_logic); end entity logic_gate; architecture rtl of logic_gate is begin done_o <= a_i and b_i; y_o <= a_i and b_i; end architecture rtl;', telemetry: { durationMs: 1 } };
      }
      return { text: 'library ieee; use ieee.std_logic_1164.all; entity logic_gate is port (a_i : in std_logic; b_i : in std_logic; y_o : out std_logic); end entity logic_gate; architecture rtl of logic_gate is begin y_o <= a_i and b_i; end architecture rtl;', telemetry: { durationMs: 1 } };
    },
  });

  assert.equal(prompts.length, 2);
  assert.match(prompts[1], /component_output_ownership_violation/);
  assert.match(prompts[1], /assignedTarget: done_o/);
  assert.match(prompts[1], /allowedOutputPorts: y_o/);
  assert.match(prompts[1], /Remove assignments to undeclared parent\/top\/sibling outputs/);
  assert.equal(result.attempts.length, 2);
  const fileContent = result.project.files.find((file) => file.path === 'src/logic_gate.vhd')?.content || '';
  assert.match(fileContent, /y_o <= a_i and b_i/);
  assert.doesNotMatch(fileContent, /done_o\s*<=/);
});

test('staged generation can rewrap marked implementation regions into the app-owned skeleton', () => {
  const skeleton = [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity logic_gate is',
    '  port (a_i : in std_logic; b_i : in std_logic; y_o : out std_logic);',
    'end entity logic_gate;',
    'architecture rtl of logic_gate is',
    '  -- MODEL_IMPLEMENTATION_DECLARATIONS_BEGIN',
    '  -- MODEL_IMPLEMENTATION_DECLARATIONS_END',
    'begin',
    '  -- MODEL_IMPLEMENTATION_STATEMENTS_BEGIN',
    '  -- MODEL_IMPLEMENTATION_STATEMENTS_END',
    'end architecture rtl;',
    '',
  ].join('\n');
  const drifted = [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity logic_gate is',
    '  port (a_i : in std_logic; b_i : in std_logic; extra_o : out std_logic; y_o : out std_logic);',
    'end entity logic_gate;',
    'architecture rtl of logic_gate is',
    '  -- MODEL_IMPLEMENTATION_DECLARATIONS_BEGIN',
    '  signal tmp_s : std_logic;',
    '  -- MODEL_IMPLEMENTATION_DECLARATIONS_END',
    'begin',
    '  -- MODEL_IMPLEMENTATION_STATEMENTS_BEGIN',
    '  tmp_s <= a_i and b_i;',
    '  y_o <= tmp_s;',
    '  -- MODEL_IMPLEMENTATION_STATEMENTS_END',
    'end architecture rtl;',
    '',
  ].join('\n');

  const rewrapped = rewrapModelImplementationIntoSkeleton({ skeleton, modelContent: drifted });

  assert.ok(rewrapped);
  assert.match(rewrapped, /port \(a_i : in std_logic; b_i : in std_logic; y_o : out std_logic\)/);
  assert.doesNotMatch(rewrapped, /extra_o/);
  assert.match(rewrapped, /signal tmp_s : std_logic/);
  assert.match(rewrapped, /y_o <= tmp_s/);
});

test('staged generation retries a component once when the required entity declaration is missing', async () => {
  const prompts: string[] = [];
  const result = await runStagedFpgaArchitectGeneration({
    ai: null,
    provider: 'ollama',
    model: 'model',
    contract,
    maxStageOutputChars: 20_000,
    vhdlImplementationPolicy: 'allow_model_vhdl_fallback',
    runModelAnalysis: async ({ prompt }) => {
      prompts.push(prompt);
      if (prompts.length === 1) {
        return {
          text: [
            'library ieee;',
            'use ieee.std_logic_1164.all;',
            'entity wrong_logic_gate is',
            '  port (a_i : in std_logic; b_i : in std_logic; y_o : out std_logic);',
            'end entity wrong_logic_gate;',
            'architecture rtl of wrong_logic_gate is begin',
            '  y_o <= a_i and b_i;',
            'end architecture rtl;',
          ].join('\n'),
          telemetry: { durationMs: 1 },
        };
      }
      return {
        text: [
          'library ieee;',
          'use ieee.std_logic_1164.all;',
          'entity logic_gate is',
          '  port (a_i : in std_logic; b_i : in std_logic; y_o : out std_logic);',
          'end entity logic_gate;',
          'architecture rtl of logic_gate is begin',
          '  y_o <= a_i and b_i;',
          'end architecture rtl;',
        ].join('\n'),
        telemetry: { durationMs: 1 },
      };
    },
  });

  assert.equal(prompts.length, 2);
  assert.match(prompts[1], /staged_component_entity_missing/);
  assert.match(prompts[1], /entity logic_gate is/);
  assert.match(prompts[1], /declaredEntities: wrong_logic_gate/);
  assert.equal(result.attempts.length, 2);
  assert.match(result.project.files.find((file) => file.path === 'src/logic_gate.vhd')?.content || '', /entity logic_gate is/i);
});

test('staged generation reuses an exact known-good leaf without calling the model', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'staged-golden-exact-'));
  const libraryPath = path.join(tempDir, 'fpga-golden-leaf-library.json');
  const goldenContract = makeGoldenLeafContract();
  await writeGoldenLibraryForContract(libraryPath, goldenContract);
  const result = await runStagedFpgaArchitectGeneration({
    ai: null,
    provider: 'ollama',
    model: 'model',
    contract: goldenContract,
    maxStageOutputChars: 20_000,
    vhdlImplementationPolicy: 'allow_model_vhdl_fallback',
    goldenLeafLibraryPath: libraryPath,
    runModelAnalysis: async () => {
      throw new Error('model should not be called for exact golden leaf reuse');
    },
  });

  const fifoFile = result.project.files.find((file) => file.path === 'src/rx_fifo.vhd')?.content || '';
  assert.match(fifoFile, /data_o <= data_i;/);
  assert.equal(result.attempts.length, 0);
});

test('staged generation reuses an exact verified VHDL library leaf with dependencies before calling the model', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'staged-verified-vhdl-'));
  const verifiedLibraryRoot = path.join(tempDir, 'verified-library');
  const verifiedVhdlBlockQualificationPath = await writeVerifiedVhdlLibraryForContract(verifiedLibraryRoot);
  const result = await runStagedFpgaArchitectGeneration({
    ai: null,
    provider: 'ollama',
    model: 'model',
    contract: makeGoldenLeafContract(),
    maxStageOutputChars: 20_000,
    vhdlImplementationPolicy: 'allow_model_vhdl_fallback',
    verifiedVhdlBlockLibraryRoot: verifiedLibraryRoot,
    verifiedVhdlBlockQualificationPath,
    runModelAnalysis: async () => {
      throw new Error('model should not be called for exact verified VHDL library reuse');
    },
  });

  const filePaths = result.project.files.map((file) => file.path);
  assert.ok(filePaths.includes('lib/fpga_vhdl_blocks/common/bb_util_pkg.vhd'));
  assert.ok(filePaths.includes('lib/fpga_vhdl_blocks/cores/bb_fifo_core.vhd'));
  assert.match(result.project.files.find((file) => file.path === 'src/rx_fifo.vhd')?.content || '', /entity work\.bb_fifo_core/);
  assert.deepEqual(result.project.ghdl.analysisOrder.slice(0, 3), [
    'lib/fpga_vhdl_blocks/common/bb_util_pkg.vhd',
    'lib/fpga_vhdl_blocks/cores/bb_fifo_core.vhd',
    'src/rx_fifo.vhd',
  ]);
  assert.equal(result.attempts.length, 0);
});

test('staged generation accepts configured verified VHDL generics without calling the model', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'staged-verified-params-'));
  const verifiedLibraryRoot = path.join(tempDir, 'verified-library');
  const verifiedVhdlBlockQualificationPath = await writeConfigurableVerifiedVhdlLibrary(verifiedLibraryRoot);
  const result = await runStagedFpgaArchitectGeneration({
    ai: null,
    provider: 'ollama',
    model: 'model',
    contract: makeConfigurableFifoContract(16, 64),
    maxStageOutputChars: 20_000,
    stageGhdlValidation: true,
    verifiedVhdlBlockLibraryRoot: verifiedLibraryRoot,
    verifiedVhdlBlockQualificationPath,
    runModelAnalysis: async () => {
      throw new Error('model should not be called for safe configured verified VHDL reuse');
    },
  });

  const fifoFile = result.project.files.find((file) => file.path === 'src/rx_fifo.vhd')?.content || '';
  const topFile = result.project.files.find((file) => file.path === 'src/fifo_top.vhd')?.content || '';
  assert.match(fifoFile, /DATA_WIDTH : positive := 8/);
  assert.match(topFile, /generic map \(/);
  assert.match(topFile, /DATA_WIDTH => 16/);
  assert.match(topFile, /DEPTH => 64/);
  assert.equal(result.attempts.length, 0);
});

test('staged generation promotes missing verified-library generics before reuse', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'staged-verified-promote-'));
  const verifiedLibraryRoot = path.join(tempDir, 'verified-library');
  const verifiedVhdlBlockQualificationPath = await writeUartRxVerifiedVhdlLibrary(verifiedLibraryRoot);
  const result = await runStagedFpgaArchitectGeneration({
    ai: null,
    provider: 'ollama',
    model: 'model',
    contract: makeUartRxContractMissingVerifiedGenerics(),
    maxStageOutputChars: 20_000,
    stageGhdlValidation: true,
    verifiedVhdlBlockLibraryRoot: verifiedLibraryRoot,
    verifiedVhdlBlockQualificationPath,
    runModelAnalysis: async () => {
      throw new Error('model should not be called when verified generics can be promoted safely');
    },
  });

  const uartFile = result.project.files.find((file) => file.path === 'src/uart_rx.vhd')?.content || '';
  const topFile = result.project.files.find((file) => file.path === 'src/uart_rx_top.vhd')?.content || '';
  const summary = result.project.files.find((file) => file.path === 'architecture/contract-summary.md')?.content || '';
  assert.match(uartFile, /CLOCK_HZ : positive := 100000000/);
  assert.match(topFile, /generic map \(/);
  assert.match(topFile, /clock_hz => 100000000/i);
  assert.match(topFile, /baud_rate => 115200/i);
  assert.match(topFile, /data_bits => 8/i);
  assert.match(summary, /VERIFIED_GENERIC_PROMOTION component=uart_rx generic=clock_hz value=100000000 source=verified_default/i);
  assert.equal(result.project.assumptions.some((entry) => /VERIFIED_GENERIC_PROMOTION.*baud_rate/i.test(entry)), true);
  assert.equal(result.attempts.length, 0);
});

test('staged generation wraps a safe near-match verified VHDL library leaf without calling the model', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'staged-verified-wrapper-'));
  const verifiedLibraryRoot = path.join(tempDir, 'verified-library');
  const verifiedVhdlBlockQualificationPath = await writeVerifiedVhdlLibraryForContract(verifiedLibraryRoot);
  await fs.writeFile(path.join(verifiedLibraryRoot, 'rtl', 'blocks', 'memory', 'rx_fifo.vhd'), [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'use ieee.numeric_std.all;',
    'use work.bb_util_pkg.all;',
    'entity bb_rx_fifo is',
    '  port (',
    '    clk_i : in std_logic;',
    '    rst_i : in std_logic;',
    '    din_i : in std_logic_vector(7 downto 0);',
    '    dout_o : out unsigned(7 downto 0)',
    '  );',
    'end entity bb_rx_fifo;',
    'architecture rtl of bb_rx_fifo is begin',
    '  dout_o <= unsigned(din_i);',
    'end architecture rtl;',
    '',
  ].join('\n'));

  const result = await runStagedFpgaArchitectGeneration({
    ai: null,
    provider: 'ollama',
    model: 'model',
    contract: makeGoldenLeafContract(),
    maxStageOutputChars: 20_000,
    verifiedVhdlBlockLibraryRoot: verifiedLibraryRoot,
    verifiedVhdlBlockQualificationPath,
    runModelAnalysis: async () => {
      throw new Error('model should not be called for safe verified wrapper reuse');
    },
  });

  const filePaths = result.project.files.map((file) => file.path);
  const wrappedFile = result.project.files.find((file) => file.path === 'src/rx_fifo.vhd')?.content || '';
  assert.ok(filePaths.includes('lib/fpga_vhdl_blocks/blocks/memory/rx_fifo.vhd'));
  assert.match(wrappedFile, /VERIFIED_WRAPPER/);
  assert.match(wrappedFile, /u_verified_leaf : entity work\.bb_rx_fifo/);
  assert.match(wrappedFile, /dout_o => w_dout_o_adapt/);
  assert.match(wrappedFile, /data_o <= std_logic_vector\(w_dout_o_adapt\);/);
  assert.deepEqual(result.project.ghdl.analysisOrder.slice(0, 3), [
    'lib/fpga_vhdl_blocks/common/bb_util_pkg.vhd',
    'lib/fpga_vhdl_blocks/blocks/memory/rx_fifo.vhd',
    'src/rx_fifo.vhd',
  ]);
  assert.equal(result.attempts.length, 0);
});

test('staged generation switches to typed hybrid failure when verified wrapper is unsafe', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'staged-verified-wrapper-unsafe-'));
  const verifiedLibraryRoot = path.join(tempDir, 'verified-library');
  const verifiedVhdlBlockQualificationPath = await writeVerifiedVhdlLibraryForContract(verifiedLibraryRoot);
  await fs.writeFile(path.join(verifiedLibraryRoot, 'rtl', 'blocks', 'memory', 'rx_fifo.vhd'), [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity bb_rx_fifo is',
    '  port (',
    '    clk : in std_logic;',
    '    rst : in std_logic;',
    '    mode_i : in std_logic;',
    '    data_i : in std_logic_vector(7 downto 0);',
    '    data_o : out std_logic_vector(7 downto 0)',
    '  );',
    'end entity bb_rx_fifo;',
    'architecture rtl of bb_rx_fifo is begin',
    '  data_o <= data_i;',
    'end architecture rtl;',
    '',
  ].join('\n'));

  await assert.rejects(
    runStagedFpgaArchitectGeneration({
      ai: null,
      provider: 'ollama',
      model: 'model',
      contract: makeGoldenLeafContract(),
      maxStageOutputChars: 20_000,
      verifiedVhdlBlockLibraryRoot: verifiedLibraryRoot,
      verifiedVhdlBlockQualificationPath,
      vhdlSpecialistAdvisor: false,
      runModelAnalysis: async () => {
        throw new Error('model should not be called for unsafe verified wrapper mismatch');
      },
    }),
    (error: unknown) => {
      assert.ok(error instanceof HybridImplementationSourceUnresolvedError);
      assert.equal(error.failureCode, 'hybrid_implementation_source_unresolved');
      assert.match(error.message, /mode_i/);
      return true;
    },
  );
});

test('staged generation uses VHDL specialist advisor but rejects unsafe role mappings', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'staged-verified-wrapper-advisor-'));
  const verifiedLibraryRoot = path.join(tempDir, 'verified-library');
  const verifiedVhdlBlockQualificationPath = await writeVerifiedVhdlLibraryForContract(verifiedLibraryRoot);
  await fs.writeFile(path.join(verifiedLibraryRoot, 'rtl', 'blocks', 'memory', 'rx_fifo.vhd'), [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity bb_rx_fifo is',
    '  port (',
    '    clk : in std_logic;',
    '    rst : in std_logic;',
    '    mode_i : in std_logic;',
    '    data_i : in std_logic_vector(7 downto 0);',
    '    data_o : out std_logic_vector(7 downto 0)',
    '  );',
    'end entity bb_rx_fifo;',
    'architecture rtl of bb_rx_fifo is begin',
    '  data_o <= data_i;',
    'end architecture rtl;',
    '',
  ].join('\n'));

  let advisorPrompt = '';
  await assert.rejects(
    runStagedFpgaArchitectGeneration({
      ai: null,
      provider: 'ollama',
      model: 'model',
      contract: makeGoldenLeafContract(),
      maxStageOutputChars: 20_000,
      verifiedVhdlBlockLibraryRoot: verifiedLibraryRoot,
      verifiedVhdlBlockQualificationPath,
      runModelAnalysis: async ({ prompt, generationProfile }) => {
        advisorPrompt = prompt;
        assert.equal(generationProfile?.id, 'vhdl_advisor');
        return {
          text: JSON.stringify({
            canHelp: true,
            safeMappings: [{ verifiedPort: 'mode_i', approvedPort: 'data_i' }],
            missingContractSignals: [],
            verdict: 'incorrectly force mode onto data',
          }),
          telemetry: { durationMs: 1 },
        };
      },
    }),
    (error: unknown) => {
      assert.ok(error instanceof HybridImplementationSourceUnresolvedError);
      assert.equal(error.specialistAdvice?.accepted, false);
      assert.match(error.message, /specialistAdvice=rejected/);
      assert.match(error.message, /mode_i->data_i/);
      assert.match(error.message, /role mismatch/i);
      return true;
    },
  );
  assert.match(advisorPrompt, /VHDL contract\/wrapper specialist/);
  assert.match(advisorPrompt, /Do not write VHDL/);
});

test('VHDL specialist advisor scorer accepts missing contract signals but rejects unsafe mappings', () => {
  const component = makeGoldenLeafContract().components.find((candidate) => candidate.id === 'rx_fifo');
  assert.ok(component);
  const candidate: any = {
    blockName: 'rx_fifo',
    entityName: 'bb_rx_fifo',
    actualSignature: {
      generics: [],
      ports: [
        { name: 'clk', mode: 'in', type: 'std_logic' },
        { name: 'rst', mode: 'in', type: 'std_logic' },
        { name: 'mode_i', mode: 'in', type: 'std_logic' },
      ],
    },
    approvedSignature: {
      generics: [],
      ports: [
        { name: 'clk', mode: 'in', type: 'std_logic' },
        { name: 'rst', mode: 'in', type: 'std_logic' },
        { name: 'data_i', mode: 'in', type: 'std_logic_vector(7 downto 0)' },
      ],
    },
  };
  const score = scoreVhdlSpecialistAdvisorResponse({
    component,
    candidate,
    wrapperPlan: {
      kind: 'wrapper_unsafe',
      componentId: component.id,
      approvedEntityName: component.name,
      verifiedBlockName: 'rx_fifo',
      verifiedEntityName: 'bb_rx_fifo',
      mismatches: [{ kind: 'extra_port', verifiedName: 'mode_i', message: 'Extra verified port mode_i cannot be mapped safely' }],
      unsafeReasons: ['verified port mode_i cannot be safely mapped'],
      portAssociations: {},
      genericAssociations: {},
      declarations: [],
      preInstanceAssignments: [],
      postInstanceAssignments: [],
    },
    responseText: JSON.stringify({
      safeMappings: [{ verifiedPort: 'mode_i', approvedPort: 'data_i' }],
      missingContractSignals: [{ name: 'mode_select_i', role: 'config', direction: 'in' }],
      verdict: 'add explicit mode select instead of using data_i',
    }),
  });
  assert.equal(score.accepted, false);
  assert.deepEqual(score.missingContractSignals.map((signal) => signal.name), ['mode_select_i']);
  assert.match(score.rejectedReasons.join('\n'), /mode_i->data_i/);
});

test('VHDL specialist advisor prompt forces missing contract signals for SPI master unresolved ports', () => {
  const component: any = {
    id: 'spi_master',
    kind: 'rtl',
    name: 'spi_master',
    file: 'src/spi_master.vhd',
    responsibility: 'Own SPI clock/chip-select sequencing and byte transfer control.',
    implements: ['spi_master'],
    dependsOn: [],
    children: [],
    clockDomain: 'clk',
    generics: [],
    ports: [
      { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
      { name: 'rst', mode: 'in', type: 'std_logic', purpose: 'Reset.' },
      { name: 'enable_i', mode: 'in', type: 'std_logic', purpose: 'Enable.' },
      { name: 'data_i', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'Payload.' },
    ],
    exports: [],
  };
  const candidate: any = {
    blockName: 'spi_master',
    entityName: 'spi_master_det_cfg',
    actualSignature: {
      generics: [],
      ports: [
        { name: 'clk', mode: 'in', type: 'std_logic' },
        { name: 'rst', mode: 'in', type: 'std_logic' },
        { name: 'phy_rx', mode: 'in', type: 'std_logic' },
        { name: 'tx_valid', mode: 'in', type: 'std_logic' },
      ],
    },
    approvedSignature: {
      generics: [],
      ports: component.ports.map((port: any) => ({ name: port.name, mode: port.mode, type: port.type })),
    },
  };
  const wrapperPlan: any = {
    kind: 'wrapper_unsafe',
    componentId: 'spi_master',
    approvedEntityName: 'spi_master',
    verifiedBlockName: 'spi_master',
    verifiedEntityName: 'spi_master_det_cfg',
    mismatches: [
      { kind: 'extra_port', verifiedName: 'phy_rx', message: 'Extra verified port phy_rx cannot be mapped safely' },
      { kind: 'extra_port', verifiedName: 'tx_valid', message: 'Extra verified port tx_valid cannot be mapped safely' },
    ],
    unsafeReasons: [
      'verified port phy_rx cannot be safely mapped',
      'verified port tx_valid cannot be safely mapped',
    ],
    portAssociations: {},
    genericAssociations: {},
    declarations: [],
    preInstanceAssignments: [],
    postInstanceAssignments: [],
  };

  const prompt = buildVhdlSpecialistAdvisorPrompt({ component, candidate, wrapperPlan });
  assert.match(prompt, /requiredFor=phy_rx/);
  assert.match(prompt, /role=serial_rx/);
  assert.match(prompt, /suggestedNames=miso_i\|spi_miso_i\|serial_rx_i/);
  assert.match(prompt, /requiredFor=tx_valid/);
  assert.match(prompt, /suggestedNames=tx_valid_i\|start_i\|valid_i/);
  assert.match(prompt, /missingContractSignals must still cover every unresolved requiredFor port/);
  assert.match(prompt, /For SPI master serial_rx, prefer missing input names like miso_i/);
});

test('VHDL specialist advisor scorer accepts role-correct missing SPI contract signals', () => {
  const component: any = {
    id: 'spi_master',
    kind: 'rtl',
    name: 'spi_master',
    file: 'src/spi_master.vhd',
    responsibility: 'Own SPI master PHY pins and transaction command handshake.',
    implements: ['spi_master'],
    dependsOn: [],
    children: [],
    clockDomain: 'clk',
    generics: [],
    ports: [
      { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
      { name: 'rst', mode: 'in', type: 'std_logic', purpose: 'Reset.' },
      { name: 'enable_i', mode: 'in', type: 'std_logic', purpose: 'Enable.' },
      { name: 'data_i', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'Payload.' },
    ],
    exports: [],
  };
  const candidate: any = {
    blockName: 'spi_master',
    entityName: 'spi_master_det_cfg',
    actualSignature: {
      generics: [],
      ports: [
        { name: 'phy_rx', mode: 'in', type: 'std_logic' },
        { name: 'tx_valid', mode: 'in', type: 'std_logic' },
      ],
    },
    approvedSignature: {
      generics: [],
      ports: component.ports.map((port: any) => ({ name: port.name, mode: port.mode, type: port.type })),
    },
  };
  const wrapperPlan: any = {
    kind: 'wrapper_unsafe',
    componentId: 'spi_master',
    approvedEntityName: 'spi_master',
    verifiedBlockName: 'spi_master',
    verifiedEntityName: 'spi_master_det_cfg',
    mismatches: [
      { kind: 'extra_port', verifiedName: 'phy_rx', message: 'Extra verified port phy_rx cannot be mapped safely' },
      { kind: 'extra_port', verifiedName: 'tx_valid', message: 'Extra verified port tx_valid cannot be mapped safely' },
    ],
    unsafeReasons: ['verified port phy_rx cannot be safely mapped', 'verified port tx_valid cannot be safely mapped'],
    portAssociations: {},
    genericAssociations: {},
    declarations: [],
    preInstanceAssignments: [],
    postInstanceAssignments: [],
  };

  const score = scoreVhdlSpecialistAdvisorResponse({
    component,
    candidate,
    wrapperPlan,
    responseText: JSON.stringify({
      safeMappings: [],
      unsafeMappings: [
        { verifiedPort: 'phy_rx', rejectedApprovedPorts: ['data_i'], reason: 'serial_rx cannot map to stream data' },
        { verifiedPort: 'tx_valid', rejectedApprovedPorts: ['enable_i'], reason: 'transaction valid is not generic enable' },
      ],
      missingContractSignals: [
        { name: 'miso_i', role: 'serial_rx', direction: 'in', type: 'std_logic', requiredFor: 'phy_rx' },
        { name: 'tx_valid_i', role: 'valid', direction: 'in', type: 'std_logic', requiredFor: 'tx_valid' },
      ],
      contractRepair: { action: 'add_missing_ports', safe: true },
      verdict: 'add explicit SPI receive and command-valid contract ports',
    }),
  });

  assert.equal(score.accepted, true);
  assert.deepEqual(score.missingContractSignals.map((signal) => signal.name), ['miso_i', 'tx_valid_i']);
  assert.equal(score.rejectedReasons.length, 0);
});

async function writeVerifiedSpiMasterLibrary(root: string) {
  await fs.mkdir(path.join(root, 'reports'), { recursive: true });
  await fs.mkdir(path.join(root, 'rtl', 'blocks', 'communication'), { recursive: true });
  await fs.mkdir(path.join(root, 'tb', 'blocks', 'communication'), { recursive: true });
  await fs.writeFile(path.join(root, 'reports', 'verification_matrix.csv'), [
    'block_id,name,category,subcategory,origin,function,archetype,implementation_tier,protocol_status,timing_status,cdc_status,numeric_status,core,source_file,testbench_file,static_validation,ghdl_analysis,functional_simulation',
    '0002,spi_master,Communication,SPI,fixture,SPI master fixture,leaf,A,ok,ok,ok,ok,spi_master,rtl/blocks/communication/spi_master.vhd,tb/blocks/communication/tb_spi_master.vhd,PASS,PASS,PASS',
    '',
  ].join('\n'));
  await fs.writeFile(path.join(root, 'rtl', 'blocks', 'communication', 'spi_master.vhd'), [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'entity spi_master_det_cfg is',
    '  generic (',
    '    data_width : positive := 8',
    '  );',
    '  port (',
    '    clk : in std_logic;',
    '    rst : in std_logic;',
    '    phy_rx : in std_logic;',
    '    tx_valid : in std_logic;',
    '    data_i : in std_logic_vector(data_width - 1 downto 0);',
    '    data_o : out std_logic_vector(data_width - 1 downto 0)',
    '  );',
    'end entity spi_master_det_cfg;',
    'architecture rtl of spi_master_det_cfg is begin',
    '  data_o <= data_i when tx_valid = \'1\' else (others => phy_rx);',
    'end architecture rtl;',
    '',
  ].join('\n'));
  await fs.writeFile(path.join(root, 'tb', 'blocks', 'communication', 'tb_spi_master.vhd'), 'entity tb_spi_master is end entity;\narchitecture sim of tb_spi_master is begin end architecture;\n');
  const qualificationPath = path.join(root, 'qualification.json');
  const target = { ok: true, exitCode: 0, summary: 'passed' };
  await fs.writeFile(qualificationPath, JSON.stringify({
    libraryVersion: 'fixture',
    libraryRoot: root,
    ghdlVersion: 'GHDL fixture',
    verifiedAt: '2026-01-01T00:00:00.000Z',
    blockCount: 1,
    testbenchCount: 1,
    coreCount: 1,
    trustedForReuse: true,
    targets: { static: target, 'core-regression': target, 'all-smokes': target },
    warnings: [],
  }, null, 2));
  return qualificationPath;
}

function makeThinSpiMasterContract(): FpgaArchitectureContract {
  return {
    ...contract,
    designName: 'spi_wrapper_demo',
    designClass: 'spi_master',
    topEntity: 'spi_top',
    topTestbench: 'tb_spi_top',
    systemIntent: 'Instantiate an SPI master from a verified block.',
    components: [
      {
        id: 'spi_master',
        kind: 'rtl',
        name: 'spi_master',
        file: 'src/spi_master.vhd',
        responsibility: 'Own SPI clock/chip-select sequencing and byte transfer control.',
        implements: ['spi_master'],
        dependsOn: [],
        children: [],
        clockDomain: 'clk',
        generics: [{ name: 'data_width', type: 'positive', default: '8' }],
        ports: [
          { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
          { name: 'rst', mode: 'in', type: 'std_logic', purpose: 'Reset.' },
          { name: 'enable_i', mode: 'in', type: 'std_logic', purpose: 'Enable.' },
          { name: 'data_i', mode: 'in', type: 'std_logic_vector(data_width - 1 downto 0)', purpose: 'Transmit byte.' },
          { name: 'data_o', mode: 'out', type: 'std_logic_vector(data_width - 1 downto 0)', purpose: 'Received byte.' },
        ],
        exports: [],
      },
      {
        id: 'spi_top',
        kind: 'top',
        name: 'spi_top',
        file: 'src/spi_top.vhd',
        responsibility: 'Integrate SPI master.',
        implements: [],
        dependsOn: ['spi_master'],
        children: ['spi_master'],
        clockDomain: 'clk',
        generics: [],
        ports: [
          { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
          { name: 'rst', mode: 'in', type: 'std_logic', purpose: 'Reset.' },
          { name: 'data_i', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'Transmit byte.' },
          { name: 'data_o', mode: 'out', type: 'std_logic_vector(7 downto 0)', purpose: 'Received byte.' },
        ],
        exports: [],
      },
      {
        id: 'tb_spi_top',
        kind: 'testbench',
        name: 'tb_spi_top',
        file: 'tb/tb_spi_top.vhd',
        responsibility: 'Check SPI wrapper.',
        implements: [],
        dependsOn: ['spi_top'],
        children: ['spi_top'],
        clockDomain: null,
        generics: [],
        ports: [],
        exports: [],
      },
    ],
    behaviors: [{
      id: 'spi_passthrough_behavior',
      requirement: 'SPI wrapper exposes deterministic received data.',
      inputs: ['data_i'],
      outputs: ['data_o'],
      timing: 'Registered or combinational within one cycle.',
      resetBehavior: 'Outputs reset to zero.',
      latencyCycles: 1,
    }],
    verification: [{
      id: 'check_spi_wrapper',
      requirement: 'Check SPI wrapper smoke behavior.',
      stimulus: 'Drive reset and one data byte.',
      expected: 'TEST PASSED.',
      observables: ['data_o'],
      covers: ['spi_master'],
      coversBehaviors: ['spi_passthrough_behavior'],
      actions: [{ kind: 'finish', message: 'TEST PASSED' }],
    }],
    instances: [
      { id: 'u_spi_master', parentComponentId: 'spi_top', childComponentId: 'spi_master', label: 'u_spi_master', genericMap: { data_width: '8' }, portMap: { clk: 'clk', rst: 'rst', data_i: 'data_i', data_o: 'data_o' } },
      { id: 'tb_dut', parentComponentId: 'tb_spi_top', childComponentId: 'spi_top', label: 'dut', genericMap: {}, portMap: { clk: 'clk', rst: 'rst', data_i: 'data_i', data_o: 'data_o' } },
    ],
    sourceOrder: ['src/spi_master.vhd', 'src/spi_top.vhd', 'tb/tb_spi_top.vhd'],
  };
}

test('staged generation normalizes SPI missing-port contract before advisor fallback', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'staged-spi-advisor-contract-'));
  const verifiedLibraryRoot = path.join(tempDir, 'verified-library');
  const verifiedVhdlBlockQualificationPath = await writeVerifiedSpiMasterLibrary(verifiedLibraryRoot);
  const result = await runStagedFpgaArchitectGeneration({
    ai: null,
    provider: 'ollama',
    model: 'model',
    contract: makeThinSpiMasterContract(),
    maxStageOutputChars: 20_000,
    verifiedVhdlBlockLibraryRoot: verifiedLibraryRoot,
    verifiedVhdlBlockQualificationPath,
    runModelAnalysis: async ({ generationProfile }) => {
      assert.equal(generationProfile?.id, 'vhdl_advisor');
      return {
        text: JSON.stringify({
          safeMappings: [],
          unsafeMappings: [],
          missingContractSignals: [
            { name: 'miso_i', role: 'serial_rx', direction: 'in', type: 'std_logic', requiredFor: 'phy_rx' },
            { name: 'tx_valid_i', role: 'valid', direction: 'in', type: 'std_logic', requiredFor: 'tx_valid' },
          ],
          contractRepair: { action: 'add_missing_ports', safe: true },
          verdict: 'add explicit SPI serial receive and transaction valid inputs',
        }),
        telemetry: { durationMs: 1 },
      };
    },
  });

  const spiFile = result.project.files.find((file) => file.path === 'src/spi_master.vhd')?.content || '';
  const topFile = result.project.files.find((file) => file.path === 'src/spi_top.vhd')?.content || '';
  assert.match(spiFile, /miso_i\s*:\s*in\s+std_logic/i);
  assert.match(spiFile, /tx_valid_i\s*:\s*in\s+std_logic/i);
  assert.match(spiFile, /phy_rx\s*=>\s*miso_i/i);
  assert.match(spiFile, /tx_valid\s*=>\s*tx_valid_i/i);
  assert.match(topFile, /miso_i\s*=>\s*'0'/i);
  assert.match(topFile, /tx_valid_i\s*=>\s*'1'/i);
  assert.equal(result.attempts.length, 0);
});

test('staged generation adapts a safe near-match from a known-good leaf baseline', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'staged-golden-adapt-'));
  const libraryPath = path.join(tempDir, 'fpga-golden-leaf-library.json');
  await writeGoldenLibraryForContract(libraryPath, makeGoldenLeafContract(8));
  const prompts: string[] = [];
  const result = await runStagedFpgaArchitectGeneration({
    ai: null,
    provider: 'ollama',
    model: 'model',
    contract: makeGoldenLeafContract(16),
    maxStageOutputChars: 20_000,
    vhdlImplementationPolicy: 'allow_model_vhdl_fallback',
    goldenLeafLibraryPath: libraryPath,
    runModelAnalysis: async ({ prompt }) => {
      prompts.push(prompt);
      assert.match(prompt, /Stored passing VHDL baseline:/);
      assert.match(prompt, /port data_i type: std_logic_vector\(7 downto 0\) -> std_logic_vector\(15 downto 0\)/);
      return {
        text: fifoGoldenVhdl(16),
        telemetry: { durationMs: 1 },
      };
    },
  });

  const fifoFile = result.project.files.find((file) => file.path === 'src/rx_fifo.vhd')?.content || '';
  assert.equal(prompts.length, 1);
  assert.match(fifoFile, /std_logic_vector\(15 downto 0\)/);
});

test('staged generation falls back to skeleton prompt for unsafe known-good mismatches', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'staged-golden-unsafe-'));
  const libraryPath = path.join(tempDir, 'fpga-golden-leaf-library.json');
  await writeGoldenLibraryForContract(libraryPath, makeGoldenLeafContract(8, 'clk'));
  const prompts: string[] = [];
  await runStagedFpgaArchitectGeneration({
    ai: null,
    provider: 'ollama',
    model: 'model',
    contract: makeGoldenLeafContract(8, 'spi_clk'),
    maxStageOutputChars: 20_000,
    vhdlImplementationPolicy: 'allow_model_vhdl_fallback',
    goldenLeafLibraryPath: libraryPath,
    runModelAnalysis: async ({ prompt }) => {
      prompts.push(prompt);
      assert.doesNotMatch(prompt, /Stored passing VHDL baseline:/);
      return {
        text: fifoGoldenVhdl(8),
        telemetry: { durationMs: 1 },
      };
    },
  });

  assert.equal(prompts.length, 1);
});

test('staged generation uses deterministic FIFO fallback immediately after FIFO entity drift', async () => {
  const fifoContract: FpgaArchitectureContract = {
    ...contract,
    designName: 'fifo_shell',
    topEntity: 'fifo_top',
    topTestbench: 'tb_fifo_top',
    components: [
      {
        id: 'rx_fifo',
        kind: 'rtl',
        name: 'rx_fifo',
        file: 'src/rx_fifo.vhd',
        responsibility: 'Received byte buffering for bytes.',
        implements: [],
        dependsOn: [],
        children: [],
        clockDomain: 'clk',
        generics: [],
        ports: [
          { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
          { name: 'rst', mode: 'in', type: 'std_logic', purpose: 'Reset.' },
          { name: 'enable_i', mode: 'in', type: 'std_logic', purpose: 'Enable.' },
          { name: 'data_i', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'Input byte.' },
          { name: 'data_o', mode: 'out', type: 'std_logic_vector(7 downto 0)', purpose: 'Output byte.' },
        ],
        exports: [],
      },
      {
        id: 'fifo_top',
        kind: 'top',
        name: 'fifo_top',
        file: 'src/fifo_top.vhd',
        responsibility: 'Integrate FIFO.',
        implements: [],
        dependsOn: ['rx_fifo'],
        children: ['rx_fifo'],
        clockDomain: 'clk',
        generics: [],
        ports: [
          { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
          { name: 'rst', mode: 'in', type: 'std_logic', purpose: 'Reset.' },
          { name: 'enable_i', mode: 'in', type: 'std_logic', purpose: 'Enable.' },
          { name: 'data_i', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'Input byte.' },
          { name: 'data_o', mode: 'out', type: 'std_logic_vector(7 downto 0)', purpose: 'Output byte.' },
        ],
        exports: [],
      },
      {
        id: 'tb_fifo_top',
        kind: 'testbench',
        name: 'tb_fifo_top',
        file: 'tb/tb_fifo_top.vhd',
        responsibility: 'Check FIFO top.',
        implements: [],
        dependsOn: ['fifo_top'],
        children: ['fifo_top'],
        clockDomain: null,
        generics: [],
        ports: [],
        exports: [],
      },
    ],
    clockDomains: [{ id: 'clk', clockPort: 'clk', resetPort: 'rst', resetActive: 'high', resetStyle: 'synchronous', memberComponents: ['fifo_top'] }],
    behaviors: [{
      id: 'fifo_default_behavior',
      requirement: 'FIFO output is benign when model fallback is used.',
      inputs: ['data_i'],
      outputs: ['data_o'],
      timing: 'Registered or combinational benign fallback.',
      resetBehavior: 'Reset clears output.',
      latencyCycles: 0,
    }],
    verification: [{
      id: 'check_fifo_fallback',
      requirement: 'Generated artifact is runnable.',
      stimulus: 'Drive reset and enable.',
      expected: 'Simulation finishes.',
      observables: ['data_o'],
      covers: [],
      coversBehaviors: ['fifo_default_behavior'],
      actions: [
        { kind: 'drive', signal: 'rst', value: "'1'" },
        { kind: 'drive', signal: 'rst', value: "'0'" },
        { kind: 'finish', message: 'TEST PASSED' },
      ],
    }],
    numericFormats: [],
    instances: [{
      id: 'u_rx_fifo',
      parentComponentId: 'fifo_top',
      childComponentId: 'rx_fifo',
      label: 'u_rx_fifo',
      genericMap: {},
      portMap: { clk: 'clk', rst: 'rst', enable_i: 'enable_i', data_i: 'data_i', data_o: 'data_o' },
    }, {
      id: 'tb_dut',
      parentComponentId: 'tb_fifo_top',
      childComponentId: 'fifo_top',
      label: 'dut',
      genericMap: {},
      portMap: { clk: 'clk', rst: 'rst', enable_i: 'enable_i', data_i: 'data_i', data_o: 'data_o' },
    }],
    connections: [],
    stateMachines: [],
    sourceOrder: ['src/rx_fifo.vhd', 'src/fifo_top.vhd', 'tb/tb_fifo_top.vhd'],
  };

  const prompts: string[] = [];
  const result = await runStagedFpgaArchitectGeneration({
    ai: null,
    provider: 'ollama',
    model: 'model',
    contract: fifoContract,
    maxStageOutputChars: 20_000,
    vhdlImplementationPolicy: 'allow_model_vhdl_fallback',
    runModelAnalysis: async ({ prompt }) => {
      prompts.push(prompt);
      return {
        text: [
          'library ieee;',
          'use ieee.std_logic_1164.all;',
          'entity bridge_control_fsm is',
          '  port (clk : in std_logic; rst : in std_logic; done_o : out std_logic);',
          'end entity bridge_control_fsm;',
          'architecture rtl of bridge_control_fsm is begin',
          "  done_o <= '0';",
          'end architecture rtl;',
        ].join('\n'),
        telemetry: { durationMs: 1 },
      };
    },
  });

  const fifoFile = result.project.files.find((file) => file.path === 'src/rx_fifo.vhd')?.content || '';
  assert.equal(prompts.length, 1);
  assert.match(fifoFile, /entity rx_fifo is/i);
  assert.match(fifoFile, /data_o <= \(others => '0'\);/i);
  assert.match(fifoFile, /STAGED_DETERMINISTIC_FALLBACK: component=rx_fifo; reason=staged_component_entity_missing/i);
  assert.match(fifoFile, /Deterministic fallback: compile-safe FIFO shell/i);
});

test('staged generation uses deterministic FIFO fallback immediately after FIFO port interface drift', async () => {
  const fifoContract: FpgaArchitectureContract = {
    ...contract,
    designName: 'fifo_shell',
    topEntity: 'fifo_top',
    topTestbench: 'tb_fifo_top',
    components: [
      {
        id: 'rx_fifo',
        kind: 'rtl',
        name: 'rx_fifo',
        file: 'src/rx_fifo.vhd',
        responsibility: 'Received byte buffering for bytes.',
        implements: [],
        dependsOn: [],
        children: [],
        clockDomain: 'clk',
        generics: [],
        ports: [
          { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
          { name: 'rst', mode: 'in', type: 'std_logic', purpose: 'Reset.' },
          { name: 'enable_i', mode: 'in', type: 'std_logic', purpose: 'Enable.' },
          { name: 'data_i', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'Input byte.' },
          { name: 'data_o', mode: 'out', type: 'std_logic_vector(7 downto 0)', purpose: 'Output byte.' },
        ],
        exports: [],
      },
      {
        id: 'fifo_top',
        kind: 'top',
        name: 'fifo_top',
        file: 'src/fifo_top.vhd',
        responsibility: 'Integrate FIFO.',
        implements: [],
        dependsOn: ['rx_fifo'],
        children: ['rx_fifo'],
        clockDomain: 'clk',
        generics: [],
        ports: [
          { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
          { name: 'rst', mode: 'in', type: 'std_logic', purpose: 'Reset.' },
          { name: 'enable_i', mode: 'in', type: 'std_logic', purpose: 'Enable.' },
          { name: 'data_i', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'Input byte.' },
          { name: 'data_o', mode: 'out', type: 'std_logic_vector(7 downto 0)', purpose: 'Output byte.' },
        ],
        exports: [],
      },
      {
        id: 'tb_fifo_top',
        kind: 'testbench',
        name: 'tb_fifo_top',
        file: 'tb/tb_fifo_top.vhd',
        responsibility: 'Check FIFO top.',
        implements: [],
        dependsOn: ['fifo_top'],
        children: ['fifo_top'],
        clockDomain: null,
        generics: [],
        ports: [],
        exports: [],
      },
    ],
    clockDomains: [{ id: 'clk', clockPort: 'clk', resetPort: 'rst', resetActive: 'high', resetStyle: 'synchronous', memberComponents: ['fifo_top'] }],
    behaviors: [],
    verification: [{
      id: 'check_fifo_fallback',
      requirement: 'Generated artifact is runnable.',
      stimulus: 'Drive reset.',
      expected: 'Simulation finishes.',
      observables: ['data_o'],
      covers: [],
      coversBehaviors: [],
      actions: [{ kind: 'finish', message: 'TEST PASSED' }],
    }],
    numericFormats: [],
    instances: [{
      id: 'u_rx_fifo',
      parentComponentId: 'fifo_top',
      childComponentId: 'rx_fifo',
      label: 'u_rx_fifo',
      genericMap: {},
      portMap: { clk: 'clk', rst: 'rst', enable_i: 'enable_i', data_i: 'data_i', data_o: 'data_o' },
    }, {
      id: 'tb_dut',
      parentComponentId: 'tb_fifo_top',
      childComponentId: 'fifo_top',
      label: 'dut',
      genericMap: {},
      portMap: { clk: 'clk', rst: 'rst', enable_i: 'enable_i', data_i: 'data_i', data_o: 'data_o' },
    }],
    connections: [],
    stateMachines: [],
    sourceOrder: ['src/rx_fifo.vhd', 'src/fifo_top.vhd', 'tb/tb_fifo_top.vhd'],
  };

  const prompts: string[] = [];
  const result = await runStagedFpgaArchitectGeneration({
    ai: null,
    provider: 'ollama',
    model: 'model',
    contract: fifoContract,
    maxStageOutputChars: 20_000,
    vhdlImplementationPolicy: 'allow_model_vhdl_fallback',
    runModelAnalysis: async ({ prompt }) => {
      prompts.push(prompt);
      return {
        text: [
          'library ieee;',
          'use ieee.std_logic_1164.all;',
          'entity rx_fifo is',
          '  port (clk : in std_logic; rst : in std_logic; enable_i : in std_logic; data_i : in std_logic_vector(7 downto 0); done_o : out std_logic; error_o : out std_logic; status_o : out std_logic_vector(7 downto 0));',
          'end entity rx_fifo;',
          'architecture rtl of rx_fifo is begin',
          "  done_o <= '0';",
          "  error_o <= '0';",
          "  status_o <= x\"00\";",
          'end architecture rtl;',
        ].join('\n'),
        telemetry: { durationMs: 1 },
      };
    },
  });

  const fifoFile = result.project.files.find((file) => file.path === 'src/rx_fifo.vhd')?.content || '';
  assert.equal(prompts.length, 1);
  assert.match(fifoFile, /entity rx_fifo is/i);
  assert.doesNotMatch(fifoFile, /\bdone_o\b/i);
  assert.doesNotMatch(fifoFile, /\berror_o\b/i);
  assert.doesNotMatch(fifoFile, /\bstatus_o\b/i);
  assert.match(fifoFile, /data_o <= \(others => '0'\);/i);
  assert.match(fifoFile, /STAGED_DETERMINISTIC_FALLBACK: component=rx_fifo; reason=staged_port_interface_drift/i);
});

test('staged generation does not inject bridge status-output contract into fifo leaf prompts', async () => {
  const bridgeContract: FpgaArchitectureContract = {
    ...contract,
    designName: 'uart_spi_bridge',
    designClass: 'uart_spi_protocol_bridge',
    topEntity: 'bridge_top',
    topTestbench: 'tb_bridge_top',
    components: [
      {
        id: 'rx_fifo',
        kind: 'rtl',
        name: 'rx_fifo',
        file: 'src/rx_fifo.vhd',
        responsibility: 'Buffer response bytes with bounded pointer/index logic.',
        implements: [],
        dependsOn: [],
        children: [],
        clockDomain: 'clk',
        generics: [],
        ports: [
          { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
          { name: 'rst', mode: 'in', type: 'std_logic', purpose: 'Reset.' },
          { name: 'enable_i', mode: 'in', type: 'std_logic', purpose: 'Enable.' },
          { name: 'data_i', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'Input data.' },
          { name: 'data_o', mode: 'out', type: 'std_logic_vector(7 downto 0)', purpose: 'Output data.' },
        ],
        exports: [],
      },
      {
        id: 'bridge_top',
        kind: 'top',
        name: 'bridge_top',
        file: 'src/bridge_top.vhd',
        responsibility: 'Instantiate bridge leaf blocks and drive top-level protocol status outputs.',
        implements: [],
        dependsOn: ['rx_fifo'],
        children: ['rx_fifo'],
        clockDomain: 'clk',
        generics: [],
        ports: [
          { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Clock.' },
          { name: 'rst', mode: 'in', type: 'std_logic', purpose: 'Reset.' },
          { name: 'data_i', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'Input data.' },
          { name: 'done_o', mode: 'out', type: 'std_logic', purpose: 'Done.' },
          { name: 'error_o', mode: 'out', type: 'std_logic', purpose: 'Error.' },
          { name: 'status_o', mode: 'out', type: 'std_logic_vector(7 downto 0)', purpose: 'Status.' },
        ],
        exports: [],
      },
      {
        id: 'tb_bridge_top',
        kind: 'testbench',
        name: 'tb_bridge_top',
        file: 'tb/tb_bridge_top.vhd',
        responsibility: 'Self-check the bridge.',
        implements: [],
        dependsOn: ['bridge_top'],
        children: ['bridge_top'],
        clockDomain: null,
        generics: [],
        ports: [],
        exports: [],
      },
    ],
    behaviors: [
      {
        id: 'bridge_nominal_status',
        requirement: 'Top-level bridge status reports nominal completion.',
        inputs: ['clk', 'rst', 'data_i'],
        outputs: ['done_o', 'error_o', 'status_o'],
        timing: 'Within four clocks.',
        resetBehavior: 'Reset drives outputs low/zero.',
        latencyCycles: 4,
      },
    ],
    verification: [],
    instances: [
      {
        id: 'bridge_fifo',
        parentComponentId: 'bridge_top',
        childComponentId: 'rx_fifo',
        label: 'u_rx_fifo',
        genericMap: {},
        portMap: {
          clk: 'clk',
          rst: 'rst',
          enable_i: 'data_i(0)',
          data_i: 'data_i',
          data_o: 'fifo_data_s',
        },
      },
      {
        id: 'tb_dut',
        parentComponentId: 'tb_bridge_top',
        childComponentId: 'bridge_top',
        label: 'dut',
        genericMap: {},
        portMap: {
          clk: 'clk',
          rst: 'rst',
          data_i: 'data_i',
          done_o: 'done_o',
          error_o: 'error_o',
          status_o: 'status_o',
        },
      },
    ],
    connections: [{
      id: 'fifo_data_s',
      type: 'std_logic_vector(7 downto 0)',
      source: { componentId: 'rx_fifo', port: 'data_o' },
      sinks: [{ componentId: 'bridge_top', port: 'status_o' }],
      clockDomain: 'clk',
      cdc: 'none',
    }],
    stateMachines: [],
    sourceOrder: ['src/rx_fifo.vhd', 'src/bridge_top.vhd', 'tb/tb_bridge_top.vhd'],
  };

  const prompts: string[] = [];
  await runStagedFpgaArchitectGeneration({
    ai: null,
    provider: 'ollama',
    model: 'model',
    contract: bridgeContract,
    maxStageOutputChars: 20_000,
    vhdlImplementationPolicy: 'allow_model_vhdl_fallback',
    runModelAnalysis: async ({ prompt }) => {
      prompts.push(prompt);
      return {
        text: [
          'library ieee;',
          'use ieee.std_logic_1164.all;',
          'entity rx_fifo is',
          '  port (clk : in std_logic; rst : in std_logic; enable_i : in std_logic; data_i : in std_logic_vector(7 downto 0); data_o : out std_logic_vector(7 downto 0));',
          'end entity rx_fifo;',
          'architecture rtl of rx_fifo is',
          'begin',
          "  data_o <= (others => '0');",
          'end architecture rtl;',
        ].join('\n'),
        telemetry: { durationMs: 1 },
      };
    },
  }).catch(() => {
    // The first prompt is the assertion target; later stages may fail because this test only cares about prompt scoping.
  });

  assert.ok(prompts.length >= 1);
  assert.doesNotMatch(prompts[0], /UART\/SPI contract:/);
  assert.match(prompts[0], /FIFO\/indexing rule:/);
});

test('staged generation throws typed metadata after repeated port interface drift', async () => {
  await assert.rejects(
    runStagedFpgaArchitectGeneration({
      ai: null, provider: 'ollama', model: 'model', contract, maxStageOutputChars: 20_000, vhdlImplementationPolicy: 'allow_model_vhdl_fallback',
      runModelAnalysis: async () => ({
        text: 'library ieee; use ieee.std_logic_1164.all; entity logic_gate is port (a_i : in std_logic; b_i : in std_logic; bad_o : out std_logic); end entity logic_gate; architecture rtl of logic_gate is begin bad_o <= a_i and b_i; end architecture rtl;',
        telemetry: { durationMs: 1 },
      }),
    }),
    (error: unknown) => {
      assert.ok(error instanceof StagedPortInterfaceDriftError);
      assert.equal(error.failureCode, 'staged_port_interface_drift');
      assert.deepEqual(error.expectedPorts, ['a_i', 'b_i', 'y_o']);
      assert.deepEqual(error.actualPorts, ['a_i', 'b_i', 'bad_o']);
      assert.match(error.entityExcerpt, /entity logic_gate is/);
      return true;
    },
  );
});

test('staged generation throws typed metadata after repeated output ownership violations', async () => {
  await assert.rejects(
    runStagedFpgaArchitectGeneration({
      ai: null, provider: 'ollama', model: 'model', contract, maxStageOutputChars: 20_000, vhdlImplementationPolicy: 'allow_model_vhdl_fallback',
      runModelAnalysis: async () => ({
        text: 'library ieee; use ieee.std_logic_1164.all; entity logic_gate is port (a_i : in std_logic; b_i : in std_logic; y_o : out std_logic); end entity logic_gate; architecture rtl of logic_gate is begin done_o <= a_i and b_i; y_o <= a_i and b_i; end architecture rtl;',
        telemetry: { durationMs: 1 },
      }),
    }),
    (error: unknown) => {
      assert.ok(error instanceof StagedComponentOutputOwnershipError);
      assert.equal(error.failureCode, 'component_output_ownership_violation');
      assert.equal(error.assignedTarget, 'done_o');
      assert.deepEqual(error.allowedOutputPorts, ['y_o']);
      assert.match(error.excerpt, /done_o <=/);
      return true;
    },
  );
});

test('staged generation throws typed metadata after repeated missing entity declaration', async () => {
  await assert.rejects(
    runStagedFpgaArchitectGeneration({
      ai: null,
      provider: 'ollama',
      model: 'model',
      contract,
      maxStageOutputChars: 20_000,
      vhdlImplementationPolicy: 'allow_model_vhdl_fallback',
      runModelAnalysis: async () => ({
        text: [
          'library ieee;',
          'use ieee.std_logic_1164.all;',
          'package logic_gate_pkg is end package;',
        ].join('\n'),
        telemetry: { durationMs: 1 },
      }),
    }),
    (error: unknown) => {
      assert.ok(error instanceof StagedComponentEntityMissingError);
      assert.equal(error.failureCode, 'staged_component_entity_missing');
      assert.equal(error.expectedEntity, 'logic_gate');
      assert.deepEqual(error.declaredEntities, []);
      assert.match(error.contentExcerpt, /package logic_gate_pkg is/);
      return true;
    },
  );
});

test('staged generation normalizes reserved enum literals and missing parity helper before checkpoint', async () => {
  const parityContract: FpgaArchitectureContract = {
    ...contract,
    designName: 'flag_unit',
    topEntity: 'flag_top',
    topTestbench: 'tb_flag_top',
    components: [
      {
        id: 'flag_core',
        kind: 'rtl',
        name: 'flag_core',
        file: 'src/flag_core.vhd',
        responsibility: 'Compute parity status.',
        implements: [],
        dependsOn: [],
        children: [],
        clockDomain: null,
        generics: [],
        ports: [
          { name: 'data_i', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'Input data.' },
          { name: 'status_o', mode: 'out', type: 'std_logic', purpose: 'Parity status.' },
        ],
        exports: [],
      },
      {
        id: 'flag_top',
        kind: 'top',
        name: 'flag_top',
        file: 'src/flag_top.vhd',
        responsibility: 'Integrate flag core.',
        implements: [],
        dependsOn: ['flag_core'],
        children: ['flag_core'],
        clockDomain: null,
        generics: [],
        ports: [
          { name: 'data_i', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'Input data.' },
          { name: 'status_o', mode: 'out', type: 'std_logic', purpose: 'Parity status.' },
        ],
        exports: [],
      },
      {
        id: 'tb_flag_top',
        kind: 'testbench',
        name: 'tb_flag_top',
        file: 'tb/tb_flag_top.vhd',
        responsibility: 'Check flag top.',
        implements: [],
        dependsOn: ['flag_top'],
        children: ['flag_top'],
        clockDomain: null,
        generics: [],
        ports: [],
        exports: [],
      },
    ],
    behaviors: [{
      id: 'parity_behavior',
      requirement: 'status_o reports odd parity for data_i.',
      inputs: ['data_i'],
      outputs: ['status_o'],
      timing: 'Delta cycle.',
      resetBehavior: 'No reset.',
      latencyCycles: 0,
    }],
    verification: [{
      id: 'check_parity',
      requirement: 'Check parity status.',
      stimulus: 'Drive an odd-parity value.',
      expected: 'status_o asserts.',
      observables: ['status_o'],
      covers: [],
      coversBehaviors: ['parity_behavior'],
      actions: [
        { kind: 'drive', signal: 'data_i', value: 'x"01"' },
        { kind: 'expect', signal: 'status_o', value: "'1'", message: 'PARITY' },
        { kind: 'finish', message: 'TEST PASSED' },
      ],
    }],
    instances: [
      {
        id: 'u_flag_core',
        parentComponentId: 'flag_top',
        childComponentId: 'flag_core',
        label: 'u_flag_core',
        genericMap: {},
        portMap: { data_i: 'data_i', status_o: 'status_o' },
      },
      {
        id: 'dut',
        parentComponentId: 'tb_flag_top',
        childComponentId: 'flag_top',
        label: 'dut',
        genericMap: {},
        portMap: { data_i: 'data_i', status_o: 'status_o' },
      },
    ],
    sourceOrder: ['src/flag_core.vhd', 'src/flag_top.vhd', 'tb/tb_flag_top.vhd'],
  };

  const result = await runStagedFpgaArchitectGeneration({
    ai: null,
    provider: 'ollama',
    model: 'model',
    contract: parityContract,
    maxStageOutputChars: 20_000,
    vhdlImplementationPolicy: 'allow_model_vhdl_fallback',
    runModelAnalysis: async () => ({
      text: [
        'library ieee;',
        'use ieee.std_logic_1164.all;',
        'entity flag_core is',
        '  port (data_i : in std_logic_vector(7 downto 0); status_o : out std_logic);',
        'end entity flag_core;',
        'architecture rtl of flag_core is',
        '  type state_t is (IDLE, PROCESS);',
        '  signal state_q : state_t := IDLE;',
        'begin',
        "  status_o <= '1' when parity(data_i) = '1' else '0';",
        '  state_q <= PROCESS;',
        'end architecture rtl;',
      ].join('\n'),
      telemetry: { durationMs: 1 },
    }),
  });

  const generated = result.project.files.find((file) => file.path === 'src/flag_core.vhd')?.content || '';
  assert.match(generated, /function parity\(value : std_logic_vector\) return std_logic is/);
  assert.match(generated, /STATE_PROCESS/);
  assert.doesNotMatch(generated, /\btype\s+state_t\s+is\s*\([^;]*\bPROCESS\b/i);
});

test('staged generation repairs safe vector literal width mismatches before GHDL checkpoint', async () => {
  const statusContract: FpgaArchitectureContract = {
    ...contract,
    designName: 'status_unit',
    topEntity: 'status_unit',
    topTestbench: 'tb_status_unit',
    components: [
      {
        id: 'status_unit',
        kind: 'top',
        name: 'status_unit',
        file: 'src/status_unit.vhd',
        responsibility: 'Drive a narrow status vector.',
        implements: [],
        dependsOn: [],
        children: [],
        clockDomain: null,
        generics: [],
        ports: [
          { name: 'status_o', mode: 'out', type: 'std_logic_vector(1 downto 0)', purpose: 'Status.' },
        ],
        exports: [],
      },
      {
        id: 'tb_status_unit',
        kind: 'testbench',
        name: 'tb_status_unit',
        file: 'tb/tb_status_unit.vhd',
        responsibility: 'Check status.',
        implements: [],
        dependsOn: ['status_unit'],
        children: ['status_unit'],
        clockDomain: null,
        generics: [],
        ports: [],
        exports: [],
      },
    ],
    behaviors: [{
      id: 'status_behavior',
      requirement: 'status_o reports ready as 1.',
      inputs: [],
      outputs: ['status_o'],
      timing: 'Delta cycle.',
      resetBehavior: 'No reset.',
      latencyCycles: 0,
    }],
    verification: [{
      id: 'check_status',
      requirement: 'Check ready status.',
      stimulus: 'No inputs.',
      expected: 'status_o is ready.',
      observables: ['status_o'],
      covers: [],
      coversBehaviors: ['status_behavior'],
      actions: [
        { kind: 'expect', signal: 'status_o', value: '"01"', message: 'STATUS' },
        { kind: 'finish', message: 'TEST PASSED' },
      ],
    }],
    instances: [{
      id: 'dut',
      parentComponentId: 'tb_status_unit',
      childComponentId: 'status_unit',
      label: 'dut',
      genericMap: {},
      portMap: { status_o: 'status_o' },
    }],
    sourceOrder: ['src/status_unit.vhd', 'tb/tb_status_unit.vhd'],
  };

  const result = await runStagedFpgaArchitectGeneration({
    ai: null,
    provider: 'ollama',
    model: 'model',
    contract: statusContract,
    maxStageOutputChars: 20_000,
    vhdlImplementationPolicy: 'allow_model_vhdl_fallback',
    stageGhdlValidation: true,
    runModelAnalysis: async () => ({
      text: [
        'library ieee;',
        'use ieee.std_logic_1164.all;',
        'use ieee.numeric_std.all;',
        'entity status_unit is',
        '  port (status_o : out std_logic_vector(1 downt 0));',
        'end entity status_unit;',
        'architecture rtl of status_unit is',
        '  singal status_s : std_logic_vector(1 downt 0);',
        'begin',
        '  status_s <= x"01";',
        '  status_o <= status_s;',
        'end architecture rtl;',
      ].join('\n'),
      telemetry: { durationMs: 1 },
    }),
  });

  const generated = result.project.files.find((file) => file.path === 'src/status_unit.vhd')?.content || '';
  assert.match(generated, /std_logic_vector\(1 downto 0\)/i);
  assert.match(generated, /\bsignal status_s\b/i);
  assert.match(generated, /status_s\s*<=\s*std_logic_vector\(to_unsigned\(1,\s*status_s'length\)\);/i);
  assert.doesNotMatch(generated, /status_s\s*<=\s*x"01";/i);
});

test('staged generation pre-repairs non-numeric arithmetic and illegal others aggregate before GHDL checkpoint', async () => {
  const videoContract: FpgaArchitectureContract = {
    ...contract,
    designName: 'video_fix_unit',
    topEntity: 'video_fix_unit',
    topTestbench: 'tb_video_fix_unit',
    components: [
      {
        id: 'video_fix_unit',
        kind: 'top',
        name: 'video_fix_unit',
        file: 'src/video_fix_unit.vhd',
        responsibility: 'Expose video counter status.',
        implements: [],
        dependsOn: [],
        children: [],
        clockDomain: null,
        generics: [],
        ports: [
          { name: 'h_cnt', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'Horizontal count.' },
          { name: 'count_o', mode: 'out', type: 'std_logic_vector(7 downto 0)', purpose: 'Derived count.' },
          { name: 'all_ones_o', mode: 'out', type: 'std_logic', purpose: 'All-ones flag.' },
        ],
        exports: [],
      },
      {
        id: 'tb_video_fix_unit',
        kind: 'testbench',
        name: 'tb_video_fix_unit',
        file: 'tb/tb_video_fix_unit.vhd',
        responsibility: 'Check generated file compiles.',
        implements: [],
        dependsOn: ['video_fix_unit'],
        children: ['video_fix_unit'],
        clockDomain: null,
        generics: [],
        ports: [],
        exports: [],
      },
    ],
    behaviors: [{
      id: 'video_fix_behavior',
      requirement: 'all_ones_o reflects all-one h_cnt.',
      inputs: ['h_cnt'],
      outputs: ['all_ones_o'],
      timing: 'Delta cycle.',
      resetBehavior: 'No reset.',
      latencyCycles: 0,
    }],
    verification: [{
      id: 'check_video_fix',
      requirement: 'Check all-ones flag.',
      stimulus: 'Drive h_cnt all ones.',
      expected: 'all_ones_o asserts.',
      observables: ['all_ones_o'],
      covers: [],
      coversBehaviors: ['video_fix_behavior'],
      actions: [
        { kind: 'drive', signal: 'h_cnt', value: 'x"FF"' },
        { kind: 'expect', signal: 'all_ones_o', value: "'1'", message: 'ALL_ONES' },
        { kind: 'finish', message: 'TEST PASSED' },
      ],
    }],
    instances: [{
      id: 'dut',
      parentComponentId: 'tb_video_fix_unit',
      childComponentId: 'video_fix_unit',
      label: 'dut',
      genericMap: {},
      portMap: { h_cnt: 'h_cnt', count_o: 'count_o', all_ones_o: 'all_ones_o' },
    }],
    sourceOrder: ['src/video_fix_unit.vhd', 'tb/tb_video_fix_unit.vhd'],
  };

  const result = await runStagedFpgaArchitectGeneration({
    ai: null,
    provider: 'ollama',
    model: 'model',
    contract: videoContract,
    maxStageOutputChars: 20_000,
    vhdlImplementationPolicy: 'allow_model_vhdl_fallback',
    stageGhdlValidation: true,
    runModelAnalysis: async () => ({
      text: [
        'library ieee;',
        'use ieee.std_logic_1164.all;',
        'entity video_fix_unit is',
        '  port (h_cnt : in std_logic_vector(7 downto 0); count_o : out std_logic_vector(7 downto 0); all_ones_o : out std_logic);',
        'end entity video_fix_unit;',
        'architecture rtl of video_fix_unit is',
        '  signal stage_s : std_logic_vector(7 downto 0);',
        'begin',
        '  process(h_cnt, stage_s) begin',
        '    stage_s <= stage_s + 1;',
        "    if h_cnt = (others => '1') then",
        "      all_ones_o <= '1';",
        '    else',
        "      all_ones_o <= '0';",
        '    end if;',
        '  end process;',
        '  count_o <= stage_s;',
        'end architecture rtl;',
      ].join('\n'),
      telemetry: { durationMs: 1 },
    }),
  });

  const generated = result.project.files.find((file) => file.path === 'src/video_fix_unit.vhd')?.content || '';
  assert.match(generated, /^\s*use ieee\.numeric_std\.all;\s*$/im);
  assert.match(generated, /stage_s <= std_logic_vector\(unsigned\(stage_s\) \+ 1\);/i);
  assert.match(generated, /if h_cnt = \(h_cnt'range => '1'\) then/i);
  assert.doesNotMatch(generated, /h_cnt = \(others => '1'\)/i);
});
