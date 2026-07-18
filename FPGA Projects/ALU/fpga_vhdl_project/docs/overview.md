# Project Overview: 8-bit ALU

## Design Intent
Implement a synthesizable 8-bit Arithmetic Logic Unit (ALU) with synchronous active-high reset, supporting addition, subtraction, bitwise AND/OR/XOR/NOT, and logical shifts. The design targets a generic portable FPGA fabric and is fully verified via a self-checking VHDL testbench using GHDL.

## Requirements
- **Data Width**: 8 bits.
- **Clock**: 100 MHz (10 ns period).
- **Reset**: Synchronous, active-high.
- **Operations**: ADD, SUB, AND, OR, XOR, NOT, SLL, SRL.
- **Flags**: ZERO, CARRY, OVERFLOW.
- **Verification**: Self-checking testbench with deterministic PASS/FAIL reporting and VCD waveform output.

## Assumptions
- No external vendor IP or simulation libraries are used.
- All numeric operations rely exclusively on `ieee.numeric_std`.
- The testbench stimulates only DUT inputs and samples outputs after the active clock edge.
- Invalid opcodes yield a zeroed result and cleared flags.