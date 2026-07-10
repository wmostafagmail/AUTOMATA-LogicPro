#!/bin/bash
ghdl -a --std=08 ../src/uart_spi_bridge_top.vhd ../tb/tb_uart_spi_bridge.vhd
if [ $? -ne 0 ]; then exit 1; fi

ghdl -e tb_uart_spi_bridge
if [ $? -ne 0 ]; then exit 1; fi

./tb_uart_spi_bridge --vcd=bridge_sim.vcd
echo "Simulation completed."