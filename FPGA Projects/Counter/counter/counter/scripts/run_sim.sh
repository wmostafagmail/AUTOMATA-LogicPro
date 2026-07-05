#!/bin/bash
set -e
GHDL=ghdl
STD=08
echo "Compiling..."
$GHDL -a --std=$STD src/alu_pkg.vhd
$GHDL -a --std=$STD src/alu.vhd
echo "Elaborating..."
$GHDL -e --std=$STD tb/tb_alu
echo "Running..."
$GHDL -r --std=$STD tb/tb_alu --wave=tb_alu.fst
echo "Simulation complete."