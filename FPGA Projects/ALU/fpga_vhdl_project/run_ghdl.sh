#!/usr/bin/env bash
set -euo pipefail

GHDL_STD="--std=08"
STOP_TIME="120us"

echo "=== fpga_vhdl_project — ALU GHDL run ==="

echo "[analyze] alu_pkg.vhd"
ghdl -a $GHDL_STD src/alu_pkg.vhd

echo "[analyze] alu.vhd"
ghdl -a $GHDL_STD src/alu.vhd

echo "[analyze] alu_tb.vhd"
ghdl -a $GHDL_STD tb/alu_tb.vhd

echo "[elaborate] alu_tb"
ghdl -e $GHDL_STD alu_tb

echo "[simulate] alu_tb --stop-time=$STOP_TIME"
ghdl -r $GHDL_STD alu_tb --stop-time="$STOP_TIME"

EXIT_CODE=$?
if [ "$EXIT_CODE" -eq 0 ]; then
    echo "=== PASS ==="
else
    echo "=== FAIL (exit code $EXIT_CODE) ==="
fi

exit $EXIT_CODE