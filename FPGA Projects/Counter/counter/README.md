# Counter Project - 8-bit ALU

## Overview
This project implements a synthesizable, generic 8-bit Arithmetic Logic Unit (ALU) in VHDL-2008.
The design includes a self-checking testbench, GHDL simulation scripts, and timing constraints.

## Features
- **Width**: 8 bits (generic).
- **Clock**: 100 MHz (10 ns period).
- **Reset**: Synchronous active-high.
- **Operations**: ADD, SUB, AND, OR, XOR, SHL, SHR, MOV_A, MOV_B, CMP.
- **Flags**: Zero, Carry, Overflow.
- **Simulation**: GHDL-ready with self-checking assertions and clean stop.

## Usage
- **Synthesis**: Import `src/alu.vhd` and `src/alu_pkg.vhd`.
- **Simulation**: Run `make sim` or `scripts/run_sim.sh`.
- **Constraints**: `constraints/alu.xdc`.

## Author
Automata LogicPro FPGA Architect Macro