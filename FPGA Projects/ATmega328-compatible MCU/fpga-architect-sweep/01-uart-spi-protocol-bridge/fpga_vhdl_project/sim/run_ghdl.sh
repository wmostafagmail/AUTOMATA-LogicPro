#!/bin/bash
ghdl -a --std=08 --workdir=work src/uart_spi_bridge_pkg.vhd
ghdl -a --std=08 --workdir=work src/uart_spi_bridge.vhd
ghdl -a --std=08 --workdir=work tb/tb_uart_spi_bridge.vhd
ghdl -e --std=08 --workdir=work tb_uart_spi_bridge
ghdl -r --std=08 --workdir=work tb_uart_spi_bridge --vcd=waves/tb_uart_spi_bridge.vcd --stop-time=1us