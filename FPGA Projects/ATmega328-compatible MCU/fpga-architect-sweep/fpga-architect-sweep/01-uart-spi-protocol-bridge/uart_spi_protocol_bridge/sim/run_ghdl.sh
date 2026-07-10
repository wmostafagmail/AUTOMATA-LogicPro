#!/bin/bash
ghdl --std=08 -a src/uart_spi_bridge_pkg.vhd
ghdl --std=08 -a src/uart_spi_bridge_top.vhd
ghdl --std=08 -a tb/tb_uart_spi_bridge.vhd
ghdl --std=08 -e uart_spi_bridge_top
ghdl --std=08 -r uart_spi_bridge_top --tb-top=tb_uart_spi_bridge --vcd=waveform.vcd