#!/usr/bin/env bash
set -euo pipefail

VHDL_STD="--std=08"
GHDL="ghdl"

RTL_DIR="src"
TB_DIR="tb"
OUT_DIR="out"
TOP_ENTITY="dsp_chain_top"

mkdir -p "$OUT_DIR"

echo "=== Analyzing VHDL files ==="
$GHDL -a $VHDL_STD "$RTL_DIR/fir_filter.vhd"
$GHDL -a $VHDL_STD "$RTL_DIR/fft_lite_analyzer.vhd"
$GHDL -a $VHDL_STD "$RTL_DIR/dsp_chain_top.vhd"
$GHDL -a $VHDL_STD "$TB_DIR/tb_dsp_chain.vhd"

echo "=== Elaborating $TOP_ENTITY ==="
$GHDL -e $VHDL_STD "$TOP_ENTITY"

echo "=== Running simulation ==="
$GHDL -r $VHDL_STD "$TOP_ENTITY" \
  --vcd="$OUT_DIR/waveform.vcd" \
  --stop-time=2us

echo "=== Simulation complete ==="
echo "Waveform: $OUT_DIR/waveform.vcd"