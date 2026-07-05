# ALU Project Overview

An 8-bit Arithmetic Logic Unit implemented in VHDL-2008 with a self-checking testbench and GHDL-ready build flow.

## Supported Operations
- ADD, SUB (unsigned arithmetic)
- AND, OR, XOR, NOT (bitwise logic on operand A)
- SLA (arithmetic left shift by operand B)
- SRA (arithmetic right shift of signed operand A by operand B)

## Status Flags
- zero_flag: asserted when the ALU result equals 0.

## Project Structure
- `src/` - synthesizable RTL and shared package
- `tb/`   - self-checking testbench
- `constraints/` - placeholder XDC for a generic target
- `docs/` - architecture, verification, and overview notes
- `ghdl_plan.json` - machine-readable GHDL run metadata

## Quick Simulation (GHDL)
```sh
cd alu
ghdl -a --std=08 src/alu_pkg.vhd src/alu.vhd tb/alu_tb.vhd
ghdl -e --std=08 alu_tb
ghdl -r --std=08 alu_tb --wave=tb.ghw --vcd=tb.vcd --stop-time=2us