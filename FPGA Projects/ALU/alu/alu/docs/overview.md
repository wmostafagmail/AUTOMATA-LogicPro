# ALU Project Overview

## Description
An 8-bit Arithmetic Logic Unit (ALU) supporting addition, subtraction, logic operations, and shifts.
Designed for synthesis and simulation with GHDL.

## Features
- 8-bit data path.
- Synchronous active-high reset.
- Zero and Carry flags.
- Self-checking testbench.

## Usage
- **RTL**: `src/alu.vhd`
- **Testbench**: `tb/alu_tb.vhd`
- **Simulate**: `make simulate`