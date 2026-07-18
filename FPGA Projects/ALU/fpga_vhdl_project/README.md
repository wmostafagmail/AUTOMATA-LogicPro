# FPGA VHDL Project: 8-bit ALU

## Overview
This project implements an 8-bit Arithmetic Logic Unit (ALU) in VHDL-2008. It supports standard arithmetic and bitwise operations, driven by a synchronous active-high reset and a 100 MHz clock.

## Structure
- `src/`: VHDL source files (`alu_pkg.vhd`, `alu.vhd`).
- `tb/`: Self-checking testbench (`alu_tb.vhd`).
- `sim/`: GHDL analysis plan and run script.
- `constraints/`: XDC constraint placeholder.
- `docs/`: Architecture and verification documentation.

## Simulation
Run the provided GHDL script to simulate the design:
```bash
bash sim/run_ghdl.sh