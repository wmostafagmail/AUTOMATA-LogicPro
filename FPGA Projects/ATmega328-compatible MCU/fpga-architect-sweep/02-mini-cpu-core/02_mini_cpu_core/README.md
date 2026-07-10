# 02-mini-cpu-core

Minimal RISC-V subset CPU core in VHDL-2008.

## Features
- 8-bit datapath
- Shared opcode definitions via `mini_cpu_core_pkg`
- Deterministic self-checking testbench

## Simulation
Run `sim/run_ghdl.sh` to generate waveform and verify design.

## Constraints
Clock is constrained to 100 MHz in `constraints/02-mini-cpu-core.xdc`.