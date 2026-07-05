#!/bin/bash
set -e
ghdl -a --std=08 ../src/uart_spi_bridge_pkg.vhd
ghdl -a --std=08 ../src/uart_spi_bridge.vhd
ghdl -a --std=08 ../tb/tb_uart_spi_bridge.vhd
ghdl -e --std=08 tb_uart_spi_bridge
ghdl -r --std=08 tb_uart_spi_bridge --vcd=../../uart_spi_bridge.vcd
echo "Simulation finished. Check uart_spi_bridge.vcd for waveforms."