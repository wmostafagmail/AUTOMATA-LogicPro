#!/usr/bin/env bash
set -e
GHDL=ghdl
STD="--std=08"

echo "Analyzing VHDL sources..."
$GHDL -a $STD src/timing_pkg.vhd
$GHDL -a $STD src/sync_gen.vhd
$GHDL -a $STD src/pattern_gen.vhd
$GHDL -a $STD src/video_top.vhd
$GHDL -a $STD tb/tb_video_top.vhd

echo "Elaborating testbench..."
$GHDL -e $STD tb_video_top

echo "Running simulation..."
$GHDL -r $STD tb_video_top --wave=tb_video_top.fst

echo "Simulation finished successfully."