# UART to SPI Protocol Bridge

## Overview
A compact FPGA/VHDL design implementing a UART-to-SPI protocol bridge with synchronous FIFO buffering and FSM-based control. Includes a self-checking testbench for GHDL simulation.

## Usage
- Compile & Simulate: `make sim`
- Direct GHDL: `./sim/run_ghdl.sh`
- Waveforms: `uart_spi_bridge.vcd`

## Architecture
- `bridge_pkg.vhd`: Shared types and constants.
- `uart_spi_bridge.vhd`: Top-level DUT with FIFO and control FSM.
- `tb_uart_spi_bridge.vhd`: Self-checking testbench.
- `uart_spi_bridge.xdc`: Timing constraints placeholder.