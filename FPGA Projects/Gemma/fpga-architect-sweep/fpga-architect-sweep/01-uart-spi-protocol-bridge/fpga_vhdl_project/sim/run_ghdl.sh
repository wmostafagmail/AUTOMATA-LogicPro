#!/bin/bash
set -e

echo "Analyzing bridge_pkg..."
ghdl -a --std=08 ../src/bridge_pkg.vhd

echo "Analyzing uart_spi_bridge..."
ghdl -a --std=08 ../src/uart_spi_bridge.vhd

echo "Analyzing testbench..."
ghdl -a --std=08 ../tb/tb_uart_spi_bridge.vhd

echo "Elaborating tb_uart_spi_bridge..."
ghdl -e --std=08 tb_uart_spi_bridge

echo "Running simulation..."
ghdl -r --std=08 tb_uart_spi_bridge --vcd=uart_spi_bridge.vcd

echo "Simulation complete. Check uart_spi_bridge.vcd for waveforms."