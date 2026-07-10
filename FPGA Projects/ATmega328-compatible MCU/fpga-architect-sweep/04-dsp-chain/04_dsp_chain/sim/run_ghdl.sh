#!/bin/bash
set -e

GHDL_BIN=ghdl
STD_FLAG="--std=08"
SRC_DIR="../src"
TB_DIR=".."

echo "Analyzing..."
$GHDL_BIN -a $STD_FLAG \
    $SRC_DIR/dsp_chain_pkg.vhd \
    $SRC_DIR/fir_filter.vhd \
    $SRC_DIR/spectral_analyzer.vhd \
    $SRC_DIR/dsp_chain_top.vhd \
    $TB_DIR/tb/tb_dsp_chain_top.vhd

echo "Elaborating..."
$GHDL_BIN -e $STD_FLAG tb_dsp_chain_top

echo "Simulating with VCD output..."
$GHDL_BIN -r $STD_FLAG tb_dsp_chain_top --vcd=output.vcd

echo "Simulation completed successfully."