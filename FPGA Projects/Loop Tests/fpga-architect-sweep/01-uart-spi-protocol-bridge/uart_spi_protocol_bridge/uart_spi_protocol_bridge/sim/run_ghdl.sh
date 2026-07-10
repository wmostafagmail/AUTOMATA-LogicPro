#!/bin/bash
# GHDL Simulation Script for UART-SPI Bridge
set -e

GHDL=ghdl
DUT=uart_spi_bridge
TB=tb_${DUT}

echo "Analyzing design..."
${GHDL} -a --std=08 src/bridge_types_pkg.vhd
${GHDL} -a --std=08 src/${DUT}.vhd
${GHDL} -a --std=08 tb/${TB}.vhd

echo "Elaborating testbench..."
${GHDL} -e --std=08 ${TB} --workdir=.

echo "Running simulation..."
${GHDL} -r --std=08 ${TB} --vcd=${TB}.vcd

echo "Simulation finished. Waveform saved to ${TB}.vcd"