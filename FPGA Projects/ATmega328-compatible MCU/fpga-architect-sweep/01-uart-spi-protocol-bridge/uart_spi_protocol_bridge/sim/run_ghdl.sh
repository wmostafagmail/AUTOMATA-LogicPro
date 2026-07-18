#!/bin/bash
mkdir -p work waves
ghdl -a --std=08 --workdir=work src/uart_spi_bridge_pkg.vhd
ghdl -a --std=08 --workdir=work src/uart_rx.vhd
ghdl -a --std=08 --workdir=work src/uart_tx.vhd
ghdl -a --std=08 --workdir=work src/spi_master.vhd
ghdl -a --std=08 --workdir=work src/tx_fifo.vhd
ghdl -a --std=08 --workdir=work src/rx_fifo.vhd
ghdl -a --std=08 --workdir=work src/bridge_fsm.vhd
ghdl -a --std=08 --workdir=work src/uart_spi_bridge.vhd
ghdl -a --std=08 --workdir=work tb/tb_uart_spi_bridge.vhd
ghdl -e --std=08 --workdir=work tb_uart_spi_bridge
ghdl -r --std=08 --workdir=work tb_uart_spi_bridge --vcd=waves/tb_uart_spi_bridge.vcd --stop-time=500us