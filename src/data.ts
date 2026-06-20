import { Preset, Signal } from './types';

// Let's create the default presets for the interactive workspace to represent realistic captured logic traces

// Helper to expand a binary pattern string into a signal values array of length 200
function binaryPattern(patternStr: string, length: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < length; i++) {
    // Repeated pattern cycle or fill remaining with idle (1 or 0 depending on type)
    if (i < patternStr.length) {
      result.push(patternStr[i] === '1' ? 1 : (patternStr[i] === 'z' ? -1 : 0));
    } else {
      result.push(patternStr[patternStr.length - 1] === '1' ? 1 : 0);
    }
  }
  return result;
}

// 1. Preset SPI
const spiSCKWave = Array(200).fill(0);
const spiMOSIWave = Array(200).fill(0);
const spiMISOWave = Array(200).fill(0);
const spiCSWave = Array(200).fill(1); // SPI Active Low, idle High

// Construct a beautiful SPI write sequence for 2 bytes: 0x41 ('A') and 0x58 ('X')
// Byte 1: 0x41 => 01000001
// Byte 2: 0x58 => 01011000
// CS low from tick 15 to tick 165
for (let t = 15; t < 165; t++) {
  spiCSWave[t] = 0;
}

// Generate SCK pulses (rising edges) inside CS low region
// We'll generate 8 pulses for Byte 1 starting at tick 25 (spaced by 6 ticks: period=12)
// SCK has period 12
let sckPulseCount = 0;
const byte1Start = 25;
const byte2Start = 100;

for (let bit = 0; bit < 8; bit++) {
  const p1 = byte1Start + bit * 8;
  // SCK pulse of duration 4
  for (let t = p1; t < p1 + 4; t++) {
    if (t < 200) spiSCKWave[t] = 1;
  }
  // Setup data on MOSI (at clock rising edge p1, MOSI is sampled)
  // 0x41 => MSB first: 0, 1, 0, 0, 0, 0, 0, 1
  const bits1 = [0, 1, 0, 0, 0, 0, 0, 1];
  const bitsMiso1 = [1, 0, 1, 1, 0, 1, 0, 0]; // MISO returns 0xB4
  for (let t = p1 - 2; t < p1 + 6; t++) {
    if (t >= 0 && t < 200) {
      spiMOSIWave[t] = bits1[bit];
      spiMISOWave[t] = bitsMiso1[bit];
    }
  }

  const p2 = byte2Start + bit * 8;
  for (let t = p2; t < p2 + 4; t++) {
    if (t < 200) spiSCKWave[t] = 1;
  }
  // 0x58 => MSB first: 0, 1, 0, 1, 1, 0, 0, 0
  const bits2 = [0, 1, 0, 1, 1, 0, 0, 0];
  const bitsMiso2 = [0, 0, 1, 1, 1, 1, 0, 1]; // MISO returns 0x3D
  for (let t = p2 - 2; t < p2 + 6; t++) {
    if (t >= 0 && t < 200) {
      spiMOSIWave[t] = bits2[bit];
      spiMISOWave[t] = bitsMiso2[bit];
    }
  }
}

// 2. Preset I2C Temperature Controller
// SCL Clock, SDA Data. Idle High.
const i2cSCLWave = Array(200).fill(1);
const i2cSDAWave = Array(200).fill(1);

// I2C Start: SDA goes High to Low while SCL is High at tick 12
i2cSDAWave[12] = 1;
for (let t = 13; t < 200; t++) i2cSDAWave[t] = 0; // SDA transitions Low

// SCL starts pulsing at tick 20. Period 10 (High 5, Low 5)
// Let's run pulses for address + write + ACK (9 SCL pulses)
// And data byte + ACK (9 SCL pulses)
// We need 18 pulses in total. Pulse starts at tick 18, 28, 38, ...
const addressBits = [1, 0, 0, 1, 0, 1, 0, 0, 0]; // Address 0x4A, write=0, ACK=0
const dataBits = [0, 0, 1, 1, 1, 1, 0, 0, 0];    // Data 0x3C, ACK=0

for (let pulse = 0; pulse < 9; pulse++) {
  const tStart = 20 + pulse * 8;
  // SCL high for 4 ticks
  for (let k = tStart; k < tStart + 4; k++) {
    if (k < 200) i2cSCLWave[k] = 1;
  }
  for (let k = tStart + 4; k < tStart + 8; k++) {
    if (k < 200) i2cSCLWave[k] = 0;
  }
  // SDA is sampled on SCL rising edge (tStart)
  // Setup SDA slightly early (at tStart - 2)
  for (let k = tStart - 2; k < tStart + 6; k++) {
    if (k >= 0 && k < 200) {
      i2cSDAWave[k] = addressBits[pulse];
    }
  }
}

// Data phase starting at tick 100
for (let pulse = 0; pulse < 9; pulse++) {
  const tStart = 100 + pulse * 8;
  for (let k = tStart; k < tStart + 4; k++) {
    if (k < 200) i2cSCLWave[k] = 1;
  }
  for (let k = tStart + 4; k < tStart + 8; k++) {
    if (k < 200) i2cSCLWave[k] = 0;
  }
  for (let k = tStart - 2; k < tStart + 6; k++) {
    if (k >= 0 && k < 200) {
      i2cSDAWave[k] = dataBits[pulse];
    }
  }
}

// STOP condition: SDA goes Low to High while SCL is High at tick 180
for (let k = 175; k < 180; k++) {
  i2cSDAWave[k] = 0;
  i2cSCLWave[k] = 1;
}
for (let k = 180; k < 200; k++) {
  i2cSDAWave[k] = 1;
  i2cSCLWave[k] = 1;
}

// 3. Preset UART Serial Buffer
// UART TX and RX with Baud Rate = 16 ticks
// Lets write 'H' (72 = 01001000) inside RX
// Idle High (1)
const uartRXWave = Array(200).fill(1);
const uartTXWave = Array(200).fill(1);

// Serial Packet 1 'H' starts at tick 15. Baud ticks = 16.
// Start Bit (0)
for (let t = 15; t < 15 + 16; t++) uartRXWave[t] = 0;
// LSB 0: 0
for (let t = 31; t < 31 + 16; t++) uartRXWave[t] = 0;
// Bit 1: 0
for (let t = 47; t < 47 + 16; t++) uartRXWave[t] = 0;
// Bit 2: 0
for (let t = 63; t < 63 + 16; t++) uartRXWave[t] = 0;
// Bit 3: 1
for (let t = 79; t < 79 + 16; t++) uartRXWave[t] = 1;
// Bit 4: 0
for (let t = 95; t < 95 + 16; t++) uartRXWave[t] = 0;
// Bit 5: 0
for (let t = 111; t < 111 + 16; t++) uartRXWave[t] = 0;
// Bit 6: 1
for (let t = 127; t < 127 + 16; t++) uartRXWave[t] = 1;
// Bit 7: 0
for (let t = 143; t < 143 + 16; t++) uartRXWave[t] = 0;
// Stop Bit (1)
for (let t = 159; t < 159 + 16; t++) uartRXWave[t] = 1;

// Packet 2 'I' (73 = 01001001) starts on TX at tick 40. Start bit (0).
for (let t = 40; t < 40 + 16; t++) uartTXWave[t] = 0;
// MSB sequence LSB first: LSB is 1, then 0, 0, 1, 0, 0, 1, 0
const tBits = [1, 0, 0, 1, 0, 0, 1, 0];
for (let bit = 0; bit < 8; bit++) {
  const bStart = 40 + (bit + 1) * 16;
  for (let t = bStart; t < bStart + 16; t++) {
    if (t < 200) uartTXWave[t] = tBits[bit];
  }
}

export const PRESETS: Preset[] = [
  {
    id: 'spi_debug',
    name: 'SPI Bus Debugeer & RAM R/W',
    description: 'A 4-wire Serial Peripheral Interface transaction tracking logic levels and reading hex commands.',
    length: 200,
    tickDuration: 5,
    timeUnit: 'ns',
    signals: [
      {
        id: 'spi_cs',
        name: 'SPI_CS',
        type: 'wire',
        color: '#ffb95f', // Amber chip select
        visible: true,
        pinned: true,
        values: spiCSWave
      },
      {
        id: 'spi_sck',
        name: 'SPI_SCK',
        type: 'clock',
        color: '#c3f5ff', // Primary cyan SCK
        visible: true,
        pinned: true,
        values: spiSCKWave,
        config: { frequency: 8, dutyCycle: 0.5, phase: 0 }
      },
      {
        id: 'spi_mosi',
        name: 'SPI_MOSI',
        type: 'wire',
        color: '#a78bfa', // MOSI
        visible: true,
        pinned: false,
        values: spiMOSIWave
      },
      {
        id: 'spi_miso',
        name: 'SPI_MISO',
        type: 'wire',
        color: '#34d399', // MISO
        visible: true,
        pinned: false,
        values: spiMISOWave
      },
      {
        id: 'spi_dec',
        name: 'SPI DECODER',
        type: 'decoder',
        color: '#00e5ff',
        visible: true,
        pinned: true,
        values: Array(200).fill(''),
        config: {
          decoderType: 'SPI',
          clkSignalId: 'spi_sck',
          dataSignalId: 'spi_mosi',
          csSignalId: 'spi_cs'
        }
      }
    ]
  },
  {
    id: 'i2c_sensor',
    name: 'I2C Temp-Sensor Transaction',
    description: 'Inter-Integrated Circuit protocol frame reading high-resolution register packets over single data and clock lines.',
    length: 200,
    tickDuration: 10,
    timeUnit: 'us',
    signals: [
      {
        id: 'i2c_scl',
        name: 'I2C_SCL',
        type: 'wire',
        color: '#c3f5ff',
        visible: true,
        pinned: true,
        values: i2cSCLWave
      },
      {
        id: 'i2c_sda',
        name: 'I2C_SDA',
        type: 'wire',
        color: '#4edea3',
        visible: true,
        pinned: true,
        values: i2cSDAWave
      },
      {
        id: 'i2c_dec',
        name: 'I2C PROTOCOL',
        type: 'decoder',
        color: '#ffe9d3',
        visible: true,
        pinned: true,
        values: Array(200).fill(''),
        config: {
          decoderType: 'I2C',
          clkSignalId: 'i2c_scl',
          dataSignalId: 'i2c_sda'
        }
      }
    ]
  },
  {
    id: 'uart_capt',
    name: 'UART Console Serial Terminal',
    description: 'Asynchronous serial transceiver terminal capturing single-byte RX ASCII standard symbols with custom baud rates.',
    length: 200,
    tickDuration: 1,
    timeUnit: 'ms',
    signals: [
      {
        id: 'uart_rx',
        name: 'UART_RX',
        type: 'wire',
        color: '#c3f5ff',
        visible: true,
        pinned: true,
        values: uartRXWave
      },
      {
        id: 'uart_tx',
        name: 'UART_TX',
        type: 'wire',
        color: '#fb7185',
        visible: true,
        pinned: false,
        values: uartTXWave
      },
      {
        id: 'uart_dec_rx',
        name: 'RX DECODE',
        type: 'decoder',
        color: '#00e5ff',
        visible: true,
        pinned: true,
        values: Array(200).fill(''),
        config: {
          decoderType: 'UART',
          rxSignalId: 'uart_rx',
          baudTicks: 16
        }
      },
      {
        id: 'uart_dec_tx',
        name: 'TX DECODE',
        type: 'decoder',
        color: '#4edea3',
        visible: true,
        pinned: false,
        values: Array(200).fill(''),
        config: {
          decoderType: 'UART',
          rxSignalId: 'uart_tx',
          baudTicks: 16
        }
      }
    ]
  },
  {
    id: 'logic_gates',
    name: 'Logic Gate Array Cascade',
    description: 'Combinational logic gate execution testing signal overlap, timing hazards, propagation delays, and XOR parity checkers.',
    length: 200,
    tickDuration: 5,
    timeUnit: 'ns',
    signals: [
      {
        id: 'clk_a',
        name: 'CLK_A',
        type: 'clock',
        color: '#c3f5ff',
        visible: true,
        pinned: false,
        values: [],
        config: { frequency: 16, dutyCycle: 0.5, phase: 0 }
      },
      {
        id: 'clk_b',
        name: 'CLK_B',
        type: 'clock',
        color: '#bbf7d0',
        visible: true,
        pinned: false,
        values: [],
        config: { frequency: 28, dutyCycle: 0.5, phase: 4 }
      },
      {
        id: 'gate_and',
        name: 'AND_A_B',
        type: 'gate',
        color: '#38bdf8',
        visible: true,
        pinned: false,
        values: [],
        config: {
          gateType: 'AND',
          inputA: 'clk_a',
          inputB: 'clk_b'
        }
      },
      {
        id: 'gate_or',
        name: 'OR_A_B',
        type: 'gate',
        color: '#fbbe24',
        visible: true,
        pinned: false,
        values: [],
        config: {
          gateType: 'OR',
          inputA: 'clk_a',
          inputB: 'clk_b'
        }
      },
      {
        id: 'gate_xor',
        name: 'XOR_A_B',
        type: 'gate',
        color: '#ec4899',
        visible: true,
        pinned: true,
        values: [],
        config: {
          gateType: 'XOR',
          inputA: 'clk_a',
          inputB: 'clk_b'
        }
      },
      {
        id: 'gate_not_a',
        name: 'NOT_A',
        type: 'gate',
        color: '#94a3b8',
        visible: true,
        pinned: false,
        values: [],
        config: {
          gateType: 'NOT',
          inputA: 'clk_a'
        }
      }
    ]
  }
];
