import { Signal, SignalType } from './types';

// Generates clock waveforms
export function generateClockWave(
  length: number,
  frequency: number, // ticks per period (e.g., 8 ticks)
  dutyCycle: number = 0.5,
  phase: number = 0
): number[] {
  const values: number[] = [];
  const freq = Math.max(2, frequency); // Prevent division by zero or infinite loop
  for (let t = 0; t < length; t++) {
    const shiftTime = (t - phase + freq) % freq;
    const split = freq * dutyCycle;
    values.push(shiftTime < split ? 1 : 0);
  }
  return values;
}

// Compute logic gate output
export function computeLogicGate(
  valuesA: (number | string)[],
  valuesB: (number | string)[] | undefined,
  gateType: 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'NOR' | 'XNOR',
  length: number
): number[] {
  const result: number[] = [];
  for (let t = 0; t < length; t++) {
    const valA = Number(valuesA[t] ?? 0) === 1 ? 1 : 0;
    const valB = valuesB ? (Number(valuesB[t] ?? 0) === 1 ? 1 : 0) : 0;

    let out = 0;
    switch (gateType) {
      case 'AND':
        out = valA & valB;
        break;
      case 'OR':
        out = valA | valB;
        break;
      case 'NOT':
        out = valA === 1 ? 0 : 1;
        break;
      case 'XOR':
        out = valA ^ valB;
        break;
      case 'NAND':
        out = (valA & valB) === 1 ? 0 : 1;
        break;
      case 'NOR':
        out = (valA | valB) === 1 ? 0 : 1;
        break;
      case 'XNOR':
        out = valA === valB ? 1 : 0;
        break;
    }
    result.push(out);
  }
  return result;
}

// Decode SPI: samples MOSI on SCK rising edge when CS is Low (0)
export function decodeSPI(
  sck: (number | string)[],
  mosi: (number | string)[],
  cs: (number | string)[],
  length: number
): (string | number)[] {
  const result: (string | number)[] = Array(length).fill('');
  
  let bitBuffer: number[] = [];
  let byteStartIndex = 0;
  let inTransaction = false;

  for (let t = 1; t < length; t++) {
    const csVal = Number(cs[t] ?? 1);
    
    // SPI Chip Select Active Low
    if (csVal === 0) {
      if (!inTransaction) {
        inTransaction = true;
        bitBuffer = [];
        byteStartIndex = t;
      }

      // Check for rising edge on SCK
      const sckPrev = Number(sck[t - 1] ?? 0);
      const sckCurr = Number(sck[t] ?? 0);
      
      if (sckPrev === 0 && sckCurr === 1) {
        const mosiBit = Number(mosi[t] ?? 0) === 1 ? 1 : 0;
        bitBuffer.push(mosiBit);

        // Once we have a byte (8 bits)
        if (bitBuffer.length === 8) {
          // Compute hex value
          let byteVal = 0;
          for (let i = 0; i < 8; i++) {
            byteVal = (byteVal << 1) | bitBuffer[i];
          }

          const hexStr = '0x' + byteVal.toString(16).toUpperCase().padStart(2, '0');
          
          // Fill the result array over the length of the byte transaction
          for (let i = byteStartIndex; i <= t; i++) {
            result[i] = hexStr;
          }

          bitBuffer = [];
          byteStartIndex = t + 1;
        }
      }
    } else {
      // CS High (Inactive)
      inTransaction = false;
      bitBuffer = [];
    }
  }
  
  return result;
}

// Decode I2C: samples SDA when SCL is high. Detects START and STOP.
export function decodeI2C(
  scl: (number | string)[],
  sda: (number | string)[],
  length: number
): (string | number)[] {
  const result: (string | number)[] = Array(length).fill('');
  
  let inTransaction = false;
  let bitBuffer: number[] = [];
  let lastScl = 1;
  let lastSda = 1;
  let byteStartIndex = 0;

  for (let t = 1; t < length; t++) {
    const sclPrev = Number(scl[t - 1] ?? 1);
    const sclCurr = Number(scl[t] ?? 1);
    const sdaPrev = Number(sda[t - 1] ?? 1);
    const sdaCurr = Number(sda[t] ?? 1);

    // Detect START: SDA goes High -> Low when SCL is High
    if (sclCurr === 1 && sdaPrev === 1 && sdaCurr === 0) {
      result[t] = 'START';
      inTransaction = true;
      bitBuffer = [];
      byteStartIndex = t + 1;
      continue;
    }

    // Detect STOP: SDA goes Low -> High when SCL is High
    if (sclCurr === 1 && sdaPrev === 0 && sdaCurr === 1) {
      result[t] = 'STOP';
      inTransaction = false;
      bitBuffer = [];
      continue;
    }

    if (inTransaction) {
      // Sample SDA on SCL rising edge
      if (sclPrev === 0 && sclCurr === 1) {
        // Collect bits
        const sdaBit = sdaCurr === 1 ? 1 : 0;
        bitBuffer.push(sdaBit);

        // Nine bits standard in I2C (8 data + 1 ACK)
        if (bitBuffer.length === 9) {
          let byteVal = 0;
          for (let i = 0; i < 8; i++) {
            byteVal = (byteVal << 1) | bitBuffer[i];
          }
          const isAck = bitBuffer[8] === 0; // ACK is Low
          const hexStr = '0x' + byteVal.toString(16).toUpperCase().padStart(2, '0') + (isAck ? ' (ACK)' : ' (NACK)');

          // Write value backwards over transaction length
          for (let i = byteStartIndex; i <= t; i++) {
            result[i] = hexStr;
          }

          bitBuffer = [];
          byteStartIndex = t + 1;
        }
      }
    }
  }

  return result;
}

// Decode UART (Serial): Finds start bit, counts bits according to baudTicks
export function decodeUART(
  rx: (number | string)[],
  baudTicks: number = 8,
  length: number
): (string | number)[] {
  const result: (string | number)[] = Array(length).fill('');
  
  let t = 0;
  while (t < length) {
    const rxBit = Number(rx[t] ?? 1);
    
    // UART Idle is High (1). Start bit is Low (0).
    if (rxBit === 0 && (t === 0 || Number(rx[t - 1] ?? 1) === 1)) {
      // Found potential Start bit
      const startT = t;
      const samplePoint = Math.round(t + baudTicks / 2); // Sample half-baud late to bypass edges
      
      // Let's sample 8 data bits
      let byteVal = 0;
      let valid = true;
      let bitsCollected = [];
      
      for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
        const sampleT = Math.round(startT + baudTicks * (bitIdx + 1) + baudTicks / 2);
        if (sampleT >= length) {
          valid = false;
          break;
        }
        const state = Number(rx[sampleT] ?? 1) === 1 ? 1 : 0;
        bitsCollected.push(state);
        // LSB is transmitted first in UART
        byteVal |= (state << bitIdx);
      }

      if (valid) {
        // Verify stop bit (should be High)
        const stopSampleT = Math.round(startT + baudTicks * 9 + baudTicks / 2);
        const stopBit = stopSampleT < length ? Number(rx[stopSampleT] ?? 1) : 1;

        if (stopBit === 1) {
          // Clean decode! Convert to Character / Hex representation
          const asciiChar = byteVal >= 32 && byteVal <= 126 ? String.fromCharCode(byteVal) : '';
          const representation = asciiChar ? `'${asciiChar}'` : `0x${byteVal.toString(16).toUpperCase().padStart(2, '0')}`;
          
          const maxT = Math.min(length, Math.round(startT + baudTicks * 10));
          for (let i = startT; i < maxT; i++) {
            result[i] = representation;
          }
          t = maxT;
          continue;
        }
      }
    }
    t++;
  }

  return result;
}

// Evaluate all generated outputs (Clocks, Gates, Decoders) in order of dependency
export function runSimulationEvaluations(signals: Signal[], length: number): Signal[] {
  // We keep user-defined signal values, but auto-simulate dependent signal types:
  // 1. Clocks
  // 2. Wires (No config / manual clicks keep their historical values unchanged unless empty)
  // 3. Gates
  // 4. Decoders

  let updatedSignals = signals.map(sig => {
    const val = [...sig.values];
    if (val.length < length) {
      // pad with logic low
      while (val.length < length) val.push(0);
    }
    return { ...sig, values: val };
  });

  // Pass 1: Handle clocks because they don't depend on other signals
  updatedSignals = updatedSignals.map(sig => {
    if (sig.type === 'clock' && sig.config) {
      const freq = sig.config.frequency ?? 8;
      const duty = sig.config.dutyCycle ?? 0.5;
      const phase = sig.config.phase ?? 0;
      return {
        ...sig,
        values: generateClockWave(length, freq, duty, phase)
      };
    }
    return sig;
  });

  // Pass 2: Handle Logic Gates (they depend on wires or clocks)
  updatedSignals = updatedSignals.map(sig => {
    if (sig.type === 'gate' && sig.config?.gateType) {
      const gateType = sig.config.gateType;
      const inputA = updatedSignals.find(s => s.id === sig.config?.inputA);
      const inputB = updatedSignals.find(s => s.id === sig.config?.inputB);
      
      const valuesA = inputA ? inputA.values : Array(length).fill(0);
      const valuesB = inputB ? inputB.values : (gateType === 'NOT' ? undefined : Array(length).fill(0));
      
      return {
        ...sig,
        values: computeLogicGate(valuesA, valuesB, gateType, length)
      };
    }
    return sig;
  });

  // Pass 3: Handle Decoders (which depend on clocks, wires, or gate outputs)
  updatedSignals = updatedSignals.map(sig => {
    if (sig.type === 'decoder' && sig.config?.decoderType) {
      const decType = sig.config.decoderType;
      
      if (decType === 'SPI') {
        const sck = updatedSignals.find(s => s.id === sig.config?.clkSignalId);
        const mosi = updatedSignals.find(s => s.id === sig.config?.dataSignalId);
        const cs = updatedSignals.find(s => s.id === sig.config?.csSignalId);
        
        const sckVal = sck ? sck.values : Array(length).fill(0);
        const mosiVal = mosi ? mosi.values : Array(length).fill(0);
        const csVal = cs ? cs.values : Array(length).fill(1); // Idle cs is High
        
        return {
          ...sig,
          values: decodeSPI(sckVal, mosiVal, csVal, length)
        };
      } else if (decType === 'I2C') {
        const scl = updatedSignals.find(s => s.id === sig.config?.clkSignalId);
        const sda = updatedSignals.find(s => s.id === sig.config?.dataSignalId);
        
        const sclVal = scl ? scl.values : Array(length).fill(1); // SCL idle is high
        const sdaVal = sda ? sda.values : Array(length).fill(1); // SDA idle is high
        
        return {
          ...sig,
          values: decodeI2C(sclVal, sdaVal, length)
        };
      } else if (decType === 'UART') {
        const rx = updatedSignals.find(s => s.id === sig.config?.rxSignalId);
        const rxVal = rx ? rx.values : Array(length).fill(1); // RX idle is high
        const ticks = sig.config.baudTicks ?? 8;
        
        return {
          ...sig,
          values: decodeUART(rxVal, ticks, length)
        };
      }
    }
    return sig;
  });

  return updatedSignals;
}
