#!/bin/bash
set -e
GHDL="ghdl"
WORKDIR="work"
SRC_DIR="src"
TB_DIR="tb"
WAVE_DIR="waves"

mkdir -p "$WORKDIR" "$WAVE_DIR"

echo "Analyzing alu_pkg..."
$GHDL -a --std=08 --workdir=$WORKDIR $SRC_DIR/alu_pkg.vhd

echo "Analyzing alu..."
$GHDL -a --std=08 --workdir=$WORKDIR $SRC_DIR/alu.vhd

echo "Analyzing tb_alu..."
$GHDL -a --std=08 --workdir=$WORKDIR $TB_DIR/alu_tb.vhd

echo "Elaborating tb_alu..."
$GHDL -e --std=08 --workdir=$WORKDIR tb_alu

echo "Running tb_alu..."
$GHDL -r --std=08 --workdir=$WORKDIR tb_alu --vcd=$WAVE_DIR/alu_tb.vcd --stop-time=1us

echo "Simulation complete."