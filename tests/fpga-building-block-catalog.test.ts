import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBuildingBlockCatalogPromptSection,
  loadFpgaBuildingBlockCatalog,
  selectFpgaBuildingBlockCatalogEntries,
} from '../src/server/fpgaBuildingBlockCatalog';

test('FPGA building-block catalog imports all enhanced Markdown entries', () => {
  const catalog = loadFpgaBuildingBlockCatalog();

  assert.equal(catalog.entryCount, 10000);
  assert.equal(catalog.targetCount, 10000);
  assert.equal(catalog.categoryCounts['UART SPI I2C'], 57);
  assert.equal(catalog.categoryCounts['Video Timing'], 57);
  assert.equal(catalog.categoryCounts['Advanced Integer Arithmetic'], 240);

  const syncFifo = catalog.entries.find((entry) => entry.name === 'sync_fifo');
  assert.ok(syncFifo);
  assert.equal(syncFifo.category, 'Memory');
  assert.ok(syncFifo.ports.some((port) => port.name === 'wr_data' && port.direction === 'in'));
  assert.ok(syncFifo.configurables.some((configurable) => configurable.name === 'DEPTH'));
  assert.match(syncFifo.implementationNotes, /overflow, reset, latency, and backpressure/i);

  const carrySkip = catalog.entries.find((entry) => entry.name === 'carry_skip_adder_combinational');
  assert.ok(carrySkip);
  assert.equal(carrySkip.id, 'BB-3601');
  assert.equal(carrySkip.category, 'Advanced Integer Arithmetic');
  assert.match(carrySkip.summary, /addition networks/i);

  const last = catalog.entries.at(-1);
  assert.equal(last?.id, 'BB-10000');
  assert.equal(last?.name, 'adaptive_voltage_controller_fail_safe');
});

test('catalog selector prefers exact blocks and maps role-specific FIFO names to reusable FIFO specs', () => {
  const selections = selectFpgaBuildingBlockCatalogEntries({
    promptText: 'UART to SPI protocol bridge with rx fifo and tx fifo buffering',
    designClass: 'uart_spi_protocol_bridge',
    requiredBlockHints: [
      'uart_rx: receive UART frames and expose valid byte events',
      'uart_tx: transmit response/status bytes',
      'spi_master: own SPI clock/chip-select sequencing',
      'rx_fifo: response FIFO buffer',
      'tx_fifo: command FIFO buffer',
    ],
    maxEntries: 12,
  });
  const names = selections.map((selection) => selection.entry.name);

  assert.equal(names[0], 'uart_spi_protocol_bridge');
  assert.ok(names.slice(1, 4).includes('uart_rx'));
  assert.ok(names.slice(1, 4).includes('uart_tx'));
  assert.ok(names.slice(1, 4).includes('spi_master'));
  assert.ok(names.includes('sync_fifo') || names.includes('stream_fifo'));
});

test('catalog selector covers high-level composed architecture prompts', () => {
  const flightNames = selectFpgaBuildingBlockCatalogEntries({
    promptText: 'flight controller with SPI IMU and PID',
    designClass: 'flight_controller',
    requiredBlockHints: [
      'sensor_frontend: sample IMU data',
      'pid_controller: run control loop',
      'motor_mixer: mix motor outputs',
    ],
    maxEntries: 8,
  }).map((selection) => selection.entry.name);
  assert.ok(flightNames.includes('flight_controller'));
  assert.ok(flightNames.includes('pid_controller'));

  const videoNames = selectFpgaBuildingBlockCatalogEntries({
    promptText: 'AXI DMA framebuffer VGA output',
    designClass: 'video_pattern_generator',
    requiredBlockHints: [
      'pixel_address_generator: generate bounded address',
      'framebuffer_controller: own frame memory',
      'vga_timing_generator: sync timing',
    ],
    maxEntries: 8,
  }).map((selection) => selection.entry.name);
  assert.ok(videoNames.includes('framebuffer_controller'));
  assert.ok(videoNames.includes('pixel_address_generator'));
  assert.ok(videoNames.includes('vga_timing_generator'));
});

test('catalog prompt section includes enhanced MD-derived fields but no VHDL bodies', () => {
  const selections = selectFpgaBuildingBlockCatalogEntries({
    promptText: 'streaming FIR over AXI Stream with FIFO buffering',
    designClass: 'fir_filter',
    requiredBlockHints: [
      'fir_filter_stage: MAC pipeline',
      'stream_fifo: buffer samples',
      'axi_stream_source: source endpoint',
    ],
    maxEntries: 4,
  });
  const prompt = formatBuildingBlockCatalogPromptSection(selections);

  assert.match(prompt, /Curated Building-Block Catalog Matches/);
  assert.match(prompt, /Representative ports:/);
  assert.match(prompt, /Configurables:/);
  assert.match(prompt, /Verification\/implementation note:/);
  assert.match(prompt, /fir_filter/);
  assert.match(prompt, /stream_fifo/);
  assert.doesNotMatch(prompt, /architecture\s+rtl\s+of/i);
  assert.doesNotMatch(prompt, /entity\s+fir_filter\s+is/i);
});
