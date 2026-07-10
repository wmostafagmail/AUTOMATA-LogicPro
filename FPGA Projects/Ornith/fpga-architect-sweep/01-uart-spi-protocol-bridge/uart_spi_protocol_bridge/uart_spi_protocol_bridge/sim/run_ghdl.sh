#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== UART-SPI Bridge GHDL Simulation ==="
echo "Project dir: $PROJECT_DIR"

# Clean previous artifacts
rm -f *.o *.cfi *.ghw output.vcd

# Analyze in dependency order
echo "--- Analyzing VHDL sources ---"
ghdl -a --std=08 "$PROJECT_DIR/src/fifo_8x8.vhd"           || { echo "ERROR: fifo_8x8.vhd failed"; exit 1; }
ghdl -a --std=08 "$PROJECT_DIR/src/uart_rx.vhd"            || { echo "ERROR: uart_rx.vhd failed";   exit 1; }
ghdl -a --std=08 "$PROJECT_DIR/src/uart_tx.vhd"            || { echo "ERROR: uart_tx.vhd failed";   exit 1; }
ghdl -a --std=08 "$PROJECT_DIR/src/spi_master.vhd"         || { echo "ERROR: spi_master.vhd failed";  exit 1; }
ghdl -a --std=08 "$PROJECT_DIR/src/bridge_ctrl.vhd"        || { echo "ERROR: bridge_ctrl.vhd failed"; exit 1; }
ghdl -a --std=08 "$PROJECT_DIR/tb/tb_uart_spi_bridge.vhd"  || { echo "ERROR: testbench failed";     exit 1; }

# Elaborate
echo "--- Elaborating tb_uart_spi_bridge ---"
ghdl -e --std=08 tb_uart_spi_bridge || { echo "ERROR: elaboration failed"; exit 1; }

# Run simulation with VCD waveform output
echo "--- Running simulation (5 ms) ---"
ghdl -r --std=08 tb_uart_spi_bridge \
    --vcd=output.vcd \
    --stop-time=5ms || { echo "ERROR: simulation failed"; exit 1; }

echo "=== Simulation complete ==="
echo "Waveform: $PROJECT_DIR/output.vcd"