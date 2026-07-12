#!/bin/bash
GHDL=ghdl
STD="--std=08"
SRC="src/uart_spi_bridge_pkg.vhd src/uart_spi_bridge_pkg_body.vhd src/uart_spi_bridge.vhd"
TB="tb/tb_uart_spi_bridge.vhd"

$GHDL -a $STD $SRC
$GHDL -a $STD $TB
$GHDL -e $STD tb_uart_spi_bridge
$GHDL -r $STD tb_uart_spi_bridge --vcd=tb_uart_spi_bridge.vcd