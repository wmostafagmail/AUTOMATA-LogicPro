#!/usr/bin/env bash
set -e
GHDL=ghdl
TOP=tb_alu
SRC="src/alu_pkg.vhd src/alu.vhd tb/tb_alu.vhd"

echo "Analyzing sources..."
$GHDL -a --std=08 $SRC
echo "Elaborating top: $TOP"
$GHDL -e --std=08 $TOP
echo "Simulating..."
$GHDL -r --std=08 $TOP --vcd=tb_alu.vcd
echo "Done. Check tb_alu.vcd for waveform."