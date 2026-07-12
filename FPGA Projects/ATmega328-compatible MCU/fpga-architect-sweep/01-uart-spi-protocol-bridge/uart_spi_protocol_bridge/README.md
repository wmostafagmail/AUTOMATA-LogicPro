# UART-to-SPI Protocol Bridge

## Overview
A synchronous UART-to-SPI bridge implemented in VHDL-2008.
Processes UART RX activity and drives an SPI master interface.
Includes a self-checking testbench for GHDL simulation.

## Files
- `src/uart_spi_bridge.vhd`: Top-level DUT.
- `src/uart_spi_bridge_pkg.vhd`: Package declarations.
- `src/uart_spi_bridge_pkg_body.vhd`: Package body.
- `tb/tb_uart_spi_bridge.vhd`: Self-checking testbench.
- `constraints/uart_spi_bridge.xdc`: Xilinx constraints placeholder.
- `Makefile`: Build and simulation script.
- `sim/run_ghdl.sh`: Standalone simulation script.

## Usage
Run `make sim` or `./sim/run_ghdl.sh` to generate `tb_uart_spi_bridge.vcd`.
Verify simulation output for PASS/FAIL status and waveform data.