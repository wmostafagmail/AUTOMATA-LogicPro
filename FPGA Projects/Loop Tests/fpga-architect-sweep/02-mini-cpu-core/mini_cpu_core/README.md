# Mini CPU Core (8-bit RISC-like)

## Overview
A minimal, synthesizable 8-bit CPU core designed for verification and educational purposes. Implements a single-cycle fetch/decode/execute datapath with a 4-register file, ALU (ADD, SUB, AND, OR, LOAD), and program counter.

## Architecture
- **Datapath**: PC, Register File, ALU, Memory Interface
- **Control**: Synchronous active-high reset, unconditional PC increment
- **ISA**: 8-bit instructions (4-bit opcode, 2-bit regA, 2-bit regB)

## Verification
Self-checking testbench validates:
- `1 + 2 = 3` (ADD)
- `3 - 2 = 1` (SUB)
- `2 & 3 = 2` (AND)
- `2 | 1 = 3` (OR)

## Usage
```bash
make sim
# or
./sim/run_ghdl.sh