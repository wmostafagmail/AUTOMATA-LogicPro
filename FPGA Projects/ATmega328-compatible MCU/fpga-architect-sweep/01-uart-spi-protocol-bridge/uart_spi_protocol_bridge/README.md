# UART-to-SPI Protocol Bridge

## Overview
This project implements a UART-to-SPI protocol bridge using VHDL-2008. It accepts UART frames, buffers them in a FIFO, and drives an SPI master transaction.

## Build & Simulate
Run `sim/run_ghdl.sh` to compile and simulate.
Expected result: `TEST PASSED`.

## Structure
- `src/`: RTL design units.
- `tb/`: Self-checking testbench.
- `sim/`: GHDL scripts and plan.
- `constraints/`: Timing constraints placeholder.