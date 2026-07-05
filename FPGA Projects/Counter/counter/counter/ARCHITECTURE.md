# Counter Project Architecture

## Overview
This project implements a synthesizable 8-bit ALU (Arithmetic Logic Unit) for a generic FPGA target. The design follows clean VHDL-2008 practices, uses synchronous active-high reset, and targets a 100 MHz clock. The architecture separates the ALU package (function definitions) from the registered entity implementation to facilitate reuse and simulation.

## Clock and Reset
- **Clock**: 100 MHz (10 ns period).
- **Reset**: Synchronous active-high.
- **Reset Domain**: All registers are reset synchronously. No CDC/RDC risks for the core logic.

## Interfaces
- **alu**: 8-bit inputs `a`, `b`; 4-bit `op`; 8-bit `result`; 4-bit `flags`.
- **tb_alu**: Self-checking testbench with stimulus generation, scoreboard, and clean stop.

## Files
- `src/alu_pkg.vhd`: Package with types, constants, and combinational ALU function.
- `src/alu.vhd`: Registered ALU entity.
- `tb/tb_alu.vhd`: Self-checking testbench.
- `constraints/alu.xdc`: Timing constraints placeholder.
- `ghdl_plan.json`: GHDL simulation plan.
- `Makefile`: Build and simulation automation.
- `scripts/run_sim.sh`: GHDL run script.
- `ARCHITECTURE.md`: This file.
- `UNIT_alu.md`: ALU unit documentation.
- `UNIT_tb_alu.md`: Testbench unit documentation.
- `VERIFICATION.md`: Verification strategy.