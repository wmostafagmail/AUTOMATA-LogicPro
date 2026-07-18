# 8-bit ALU FPGA Project

## Overview
A fully synthesizable 8-bit ALU with synchronous active-high reset and status flags.
Designed for VHDL-2008 compliant simulators (GHDL) and FPGA targets.

## Structure
- `src/`: VHDL RTL and package files.
- `tb/`: Self-checking testbench.
- `sim/`: GHDL analysis/elaborate/run scripts and JSON plan.
- `constraints/`: XDC timing constraints.
- `docs/`: Architecture and verification notes.

## Quick Start
1. Install GHDL (`ghdl --version`).
2. Run simulation: `bash sim/run_ghdl.sh`
3. View results: `waves/tb_alu.vcd`

## Notes
- Clock: 100 MHz (10 ns period).
- Reset: Synchronous active-high.
- Flags: zero, carry, overflow updated every cycle.