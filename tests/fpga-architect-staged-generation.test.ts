import assert from 'node:assert/strict';
import test from 'node:test';
import {
  runStagedFpgaArchitectGeneration,
  StagedComponentEntityMissingError,
  StagedPortInterfaceDriftError,
} from '../src/server/fpgaArchitectStagedGeneration';
import { parseFpgaArchitectResponse } from '../src/server/fpgaArchitect';
import type { FpgaArchitectureContract } from '../src/server/fpgaArchitectureContract';

const contract: FpgaArchitectureContract = {
  schemaVersion: '2.0', designName: 'logic_gate', designClass: 'generic_fpga_vhdl_system', topEntity: 'logic_gate', topTestbench: 'tb_logic_gate', systemIntent: 'Implement one AND gate.', assumptions: ['Combinational.'], requiredCapabilityIds: [],
  components: [
    { id: 'logic_gate', kind: 'top', name: 'logic_gate', file: 'src/logic_gate.vhd', responsibility: 'AND inputs.', implements: [], dependsOn: [], children: [], clockDomain: null, generics: [], ports: [{ name: 'a_i', mode: 'in', type: 'std_logic', purpose: 'A.' }, { name: 'b_i', mode: 'in', type: 'std_logic', purpose: 'B.' }, { name: 'y_o', mode: 'out', type: 'std_logic', purpose: 'Y.' }], exports: [] },
    { id: 'tb_logic_gate', kind: 'testbench', name: 'tb_logic_gate', file: 'tb/tb_logic_gate.vhd', responsibility: 'Check AND.', implements: [], dependsOn: ['logic_gate'], children: ['logic_gate'], clockDomain: null, generics: [], ports: [], exports: [] },
  ], clockDomains: [], behaviors: [{ id: 'and_behavior', requirement: 'Y is A and B.', inputs: ['a_i', 'b_i'], outputs: ['y_o'], timing: 'Delta cycle.', resetBehavior: 'No reset.', latencyCycles: 0 }],
  verification: [{ id: 'check_and', requirement: 'Check AND.', stimulus: 'Drive ones.', expected: 'One.', observables: ['y_o'], covers: [], coversBehaviors: ['and_behavior'], actions: [{ kind: 'drive', signal: 'a_i', value: "'1'" }, { kind: 'drive', signal: 'b_i', value: "'1'" }, { kind: 'expect', signal: 'y_o', value: "'1'", message: 'AND' }, { kind: 'finish', message: 'TEST PASSED' }] }],
  numericFormats: [], instances: [{ id: 'tb_dut', parentComponentId: 'tb_logic_gate', childComponentId: 'logic_gate', label: 'dut', genericMap: {}, portMap: { a_i: 'a_i', b_i: 'b_i', y_o: 'y_o' } }], connections: [], stateMachines: [], sourceOrder: ['src/logic_gate.vhd', 'tb/tb_logic_gate.vhd'],
};

test('staged generation uses the model only for constrained RTL and preserves manifest compatibility', async () => {
  const prompts: string[] = [];
  const progress: string[] = [];
  const result = await runStagedFpgaArchitectGeneration({
    ai: null, provider: 'ollama', model: 'model', contract, maxStageOutputChars: 20_000,
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
    ai: null, provider: 'ollama', model: 'model', contract, maxStageOutputChars: 20_000,
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

test('staged generation retries a component once when the required entity declaration is missing', async () => {
  const prompts: string[] = [];
  const result = await runStagedFpgaArchitectGeneration({
    ai: null,
    provider: 'ollama',
    model: 'model',
    contract,
    maxStageOutputChars: 20_000,
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
    clockDomains: [{ id: 'clk', clock: 'clk', reset: 'rst', resetPolarity: 'high', frequencyHint: '100 MHz' }],
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
    clockDomains: [{ id: 'clk', clock: 'clk', reset: 'rst', resetPolarity: 'high', frequencyHint: '100 MHz' }],
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
    connections: [{ id: 'fifo_data_s', type: 'std_logic_vector(7 downto 0)', from: 'u_rx_fifo.data_o', to: 'bridge_top.status_o', cdc: 'none' }],
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
      ai: null, provider: 'ollama', model: 'model', contract, maxStageOutputChars: 20_000,
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

test('staged generation throws typed metadata after repeated missing entity declaration', async () => {
  await assert.rejects(
    runStagedFpgaArchitectGeneration({
      ai: null,
      provider: 'ollama',
      model: 'model',
      contract,
      maxStageOutputChars: 20_000,
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
