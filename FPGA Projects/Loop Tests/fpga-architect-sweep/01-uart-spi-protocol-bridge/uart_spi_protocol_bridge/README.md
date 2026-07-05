# UART-to-SPI Protocol Bridge

## Overview
Compact FPGA/VHDL implementation of a UART-to-SPI protocol bridge with TX/RX FIFOs, control FSM, and status reporting. Designed for GHDL-2008 simulation and portable synthesis.

## Usage
- Run `make sim` or `./sim/run_ghdl.sh` to compile and simulate.
- Waveforms are generated at `uart_spi_bridge.vcd`.
- Testbench validates nominal transfers and error flags deterministically.

## Notes
- Single 100 MHz clock domain. Synchronous active-high reset.
- Production deployments should add CDC, backpressure handshakes, and robust error recovery.