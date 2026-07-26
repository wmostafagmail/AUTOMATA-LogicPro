import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMissingBlockFitReviewPrompt,
  discoverMissingFpgaBlocks,
  formatMissingBlockDiscoveryPromptSection,
  isApprovedMissingBlockDiscoveryUrl,
  normalizeMissingBlockName,
} from '../src/server/fpgaMissingBlockDiscovery';

test('missing block discovery normalizes reusable FIFO blocks into temporary contracts', async () => {
  const result = await discoverMissingFpgaBlocks({
    missingBlocks: ['custom:rx fifo'],
    userRequest: 'UART to SPI bridge with RX buffering.',
    fetchText: async () => 'RX FIFO VHDL FPGA buffering full empty generic depth',
  });

  assert.equal(result.mode, 'auto_discovered');
  assert.deepEqual(result.unresolvedBlocks, []);
  assert.equal(result.discoveredBlocks.length, 1);
  assert.equal(result.discoveredBlocks[0].blockId, 'rx_fifo');
  assert.ok(result.discoveredBlocks[0].ports.some((port) => port.name === 'wr_en_i'));
  assert.ok(result.discoveredBlocks[0].ownedOutputs.includes('empty_o'));
  assert.match(result.discoveredBlocks[0].timingContract, /bounded/i);
});

test('missing block discovery refuses unsafe arbitrary block roles', async () => {
  const result = await discoverMissingFpgaBlocks({
    missingBlocks: ['custom:quantum oracle adapter'],
    userRequest: 'Build a small FPGA control block.',
    fetchText: async () => '',
  });

  assert.equal(result.mode, 'unresolved_or_unsafe');
  assert.deepEqual(result.discoveredBlocks, []);
  assert.deepEqual(result.unresolvedBlocks, ['custom:quantum oracle adapter']);
  assert.match(result.unsafeReasons.join('\n'), /cannot create a safe temporary contract/i);
});

test('missing block discovery prompt is automatic and contains no user approval gate', async () => {
  const result = await discoverMissingFpgaBlocks({
    missingBlocks: ['spi master'],
    userRequest: 'Build an SPI sensor frontend.',
    fetchText: async () => 'SPI master VHDL FPGA sclk mosi miso chip select',
  });
  const section = formatMissingBlockDiscoveryPromptSection(result);
  const prompt = buildMissingBlockFitReviewPrompt({
    userRequest: 'Build an SPI sensor frontend.',
    discovery: result,
  });

  assert.match(section, /Auto-discovered temporary block contracts/);
  assert.match(section, /spi_master/);
  assert.match(prompt, /Do not ask the user to approve sources/);
  assert.doesNotMatch(prompt, /User clicks/i);
  assert.doesNotMatch(prompt, /approves or rejects/i);
});

test('missing block discovery source allowlist includes official and open-source spec sources only', () => {
  assert.equal(isApprovedMissingBlockDiscoveryUrl('https://docs.amd.com/r/en-US/ug949-vivado-design-methodology'), true);
  assert.equal(isApprovedMissingBlockDiscoveryUrl('https://github.com/search?q=fifo+vhdl&type=repositories'), true);
  assert.equal(isApprovedMissingBlockDiscoveryUrl('http://github.com/search?q=fifo'), false);
  assert.equal(isApprovedMissingBlockDiscoveryUrl('https://example.com/fpga/fifo'), false);
  assert.equal(normalizeMissingBlockName('custom:RX FIFO'), 'rx_fifo');
});
