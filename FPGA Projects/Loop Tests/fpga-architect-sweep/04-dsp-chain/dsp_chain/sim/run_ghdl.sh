#!/bin/bash
set -e
GHDL=ghdl
GHDL_FLAGS="--std=08"
PROJECT="dsp_chain_top"
TB="tb_${PROJECT}"

echo "Analyzing..."
$GHDL -a $GHDL_FLAGS src/dsp_chain_pkg.vhd
$GHDL -a $GHDL_FLAGS src/fir_filter.vhd
$GHDL -a $GHDL_FLAGS src/fft_lite.vhd
$GHDL -a $GHDL_FLAGS src/${PROJECT}.vhd
$GHDL -a $GHDL_FLAGS tb/${TB}.vhd

echo "Elaborating..."
$GHDL -e $GHDL_FLAGS ${PROJECT}

echo "Simulating..."
$GHDL -r ${PROJECT} --wave=waveform.vcd

echo "Done."