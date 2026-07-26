import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBuildingBlockCatalogPromptSection,
  buildKnownGoodLeafAvailabilityPromptSection,
  CURATED_DESIGN_PATTERNS,
  synthesizeCuratedFpgaArchitecture,
} from '../src/server/fpgaArchitectureKnowledge';
import {
  synthesizeFpgaArchitectureBlueprintFromPrompt,
} from '../src/server/fpgaArchitectureBlueprint';
import {
  buildFpgaArchitectureContractDraft,
  validateFpgaArchitectureContract,
} from '../src/server/fpgaArchitectureContract';

function assertPatternSelected(prompt: string, expectedPatternId: string) {
  const synthesis = synthesizeCuratedFpgaArchitecture(prompt);
  assert.equal(synthesis.primaryPattern.patternId, expectedPatternId, prompt);
}

function secondaryIdsFor(prompt: string) {
  return synthesizeCuratedFpgaArchitecture(prompt).secondaryPatterns.map((pattern) => pattern.patternId);
}

test('curated FPGA pattern catalog is broad and contract-ready', () => {
  assert.ok(CURATED_DESIGN_PATTERNS.length >= 80, `expected at least 80 patterns, got ${CURATED_DESIGN_PATTERNS.length}`);

  for (const pattern of CURATED_DESIGN_PATTERNS) {
    assert.match(pattern.patternId, /^pattern_[a-z][a-z0-9_]*$/, pattern.patternId);
    assert.match(pattern.designClass, /^[a-z][a-z0-9_]*$/, pattern.designClass);
    assert.ok(pattern.family, `${pattern.patternId} must declare a family`);
    assert.ok(pattern.specificity, `${pattern.patternId} must declare specificity`);
    assert.ok(pattern.requiredBlocks.some((block) => block.kind === 'package'), `${pattern.patternId} needs a package block`);
    assert.ok(pattern.requiredBlocks.some((block) => block.kind === 'top'), `${pattern.patternId} needs a top block`);
    assert.ok(pattern.requiredBlocks.some((block) => block.kind === 'testbench'), `${pattern.patternId} needs a testbench block`);
    assert.ok(pattern.topOutputOwnership.length > 0, `${pattern.patternId} needs explicit output ownership`);
    assert.ok(pattern.timingContracts.length > 0, `${pattern.patternId} needs explicit timing`);
    assert.ok(pattern.verificationScenarios.some((scenario) => /self-check|check|prove/i.test(scenario)), `${pattern.patternId} needs concrete verification language`);
  }
});

test('classifier selects specific primary patterns across major FPGA domains', () => {
  const cases: Array<[string, string]> = [
    ['Design a UART core with byte valid status.', 'pattern_uart_core'],
    ['Build an SPI controller for sensor transactions.', 'pattern_spi_controller'],
    ['Create an I2C temperature sensor frontend.', 'pattern_i2c_controller'],
    ['Implement a CAN controller frame parser.', 'pattern_can_controller'],
    ['Build an Ethernet MAC-lite endpoint.', 'pattern_ethernet_mac_lite'],
    ['Create an AXI-Lite register peripheral.', 'pattern_axi4_lite_peripheral'],
    ['Build a Wishbone peripheral with registers.', 'pattern_wishbone_peripheral'],
    ['Create an Avalon-MM peripheral.', 'pattern_avalon_mm_peripheral'],
    ['Implement an APB peripheral.', 'pattern_apb_peripheral'],
    ['Design a streaming FIR filter.', 'pattern_fir_filter'],
    ['Build an FFT pipeline.', 'pattern_fft_pipeline'],
    ['Implement a CORDIC engine.', 'pattern_cordic_engine'],
    ['Create a MAC multiply accumulate unit.', 'pattern_mac_unit'],
    ['Design a fixed point datapath.', 'pattern_fixed_point_datapath'],
    ['Implement a matrix vector engine.', 'pattern_matrix_vector_engine'],
    ['Create a VGA timing generator with framebuffer output.', 'pattern_video_pipeline'],
    ['Build an HDMI video pipeline.', 'pattern_video_pipeline'],
    ['Design a camera capture pipeline.', 'pattern_video_pipeline'],
    ['Implement a PID controller.', 'pattern_pid_controller'],
    ['Build a flight controller for a drone.', 'pattern_flight_controller'],
    ['Create an async FIFO between clock domains.', 'pattern_async_fifo'],
    ['Build a DMA engine.', 'pattern_dma_engine'],
  ];

  for (const [prompt, expectedPatternId] of cases) {
    assertPatternSelected(prompt, expectedPatternId);
  }
});

test('classifier composes secondary architecture patterns deterministically', () => {
  assert.deepEqual(
    secondaryIdsFor('flight controller with SPI IMU and PID').slice(0, 3),
    ['pattern_spi_controller', 'pattern_pid_controller', 'pattern_imu_sensor_frontend'],
  );

  assert.deepEqual(
    secondaryIdsFor('AXI DMA framebuffer VGA output').slice(0, 4),
    ['pattern_vga_timing_generator', 'pattern_framebuffer_controller', 'pattern_dma_engine', 'pattern_axi4_memory_mapped_master'],
  );

  assert.deepEqual(
    secondaryIdsFor('streaming FIR over AXI-Stream').slice(0, 3),
    ['pattern_axi_stream_source', 'pattern_axi_stream_sink', 'pattern_stream_fifo'],
  );

  assert.ok(secondaryIdsFor('I2C temperature sensor with AXI-Lite registers').includes('pattern_axi4_lite_peripheral'));
  assert.ok(secondaryIdsFor('I2C temperature sensor with AXI-Lite registers').includes('pattern_register_map_subsystem'));
});

test('representative families produce valid app-owned contract drafts', () => {
  const prompts = [
    'Mandatory design class: uart_core',
    'Mandatory design class: fir_filter',
    'Mandatory design class: axi4_lite_peripheral',
    'Mandatory design class: vga_timing_generator',
    'Mandatory design class: pid_controller',
    'Mandatory design class: sync_fifo',
    'Mandatory design class: watchdog_supervisor',
  ];

  for (const prompt of prompts) {
    const synthesis = synthesizeFpgaArchitectureBlueprintFromPrompt(prompt);
    assert.ok(synthesis.blueprint.topOutputOwnership.length > 0, prompt);
    assert.ok(synthesis.blueprint.timingContracts.length > 0, prompt);

    const contract = buildFpgaArchitectureContractDraft({ userRequest: prompt });
    const validation = validateFpgaArchitectureContract({ contract, userRequest: prompt });
    assert.equal(validation.ok, true, `${prompt}: ${JSON.stringify(validation.issues, null, 2)}`);
    assert.equal(contract.sourceOrder.at(-1), contract.components.find((component) => component.kind === 'testbench')?.file);
  }
});

test('curated architecture synthesis includes selected 3600-catalog building-block specs', () => {
  const synthesis = synthesizeCuratedFpgaArchitecture('UART to SPI bridge with rx fifo and tx fifo buffering');
  const catalogNames = synthesis.buildingBlockCatalogEntries.map(({ entry }) => entry.name);

  assert.ok(synthesis.blueprint.buildingBlockCatalogIds.length > 0);
  assert.ok(synthesis.blueprint.buildingBlockCatalogSummaries.some((summary) => /uart_spi_protocol_bridge/i.test(summary)));
  assert.ok(catalogNames.includes('uart_spi_protocol_bridge'));
  assert.ok(catalogNames.includes('uart_rx'));
  assert.ok(catalogNames.includes('uart_tx'));
  assert.ok(catalogNames.includes('spi_master'));
  assert.ok(catalogNames.includes('sync_fifo') || catalogNames.includes('stream_fifo'));
});

test('catalog prompt section exposes compact enhanced building-block guidance', () => {
  const section = buildBuildingBlockCatalogPromptSection({
    promptText: 'AXI DMA framebuffer VGA output',
    maxEntries: 6,
  });

  assert.match(section, /Curated Building-Block Catalog Matches/);
  assert.match(section, /framebuffer_controller/);
  assert.match(section, /pixel_address_generator/);
  assert.match(section, /Representative ports:/);
  assert.match(section, /Configurables:/);
  assert.doesNotMatch(section, /architecture\s+rtl/i);
});

test('known-good leaf availability prompt section is compact metadata only', () => {
  const section = buildKnownGoodLeafAvailabilityPromptSection([
    { componentId: 'rx_fifo', mode: 'exact_match', passCount: 3 },
    { componentId: 'spi_master', mode: 'safe_adaptation', passCount: 2 },
  ]);
  assert.match(section, /rx_fifo: exact_match; passing samples=3/);
  assert.match(section, /spi_master: safe_adaptation; passing samples=2/);
  assert.doesNotMatch(section, /entity\s+rx_fifo\s+is/i);
  assert.doesNotMatch(section, /architecture\s+rtl/i);
});
