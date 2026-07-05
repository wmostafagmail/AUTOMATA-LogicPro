#!/bin/bash
set -e
GHDL=ghdl
TOP=video_top
TB=tb_video_top

echo "Analyzing packages..."
$GHDL -a --std=08 src/video_pkg.vhd
echo "Analyzing sources..."
$GHDL -a --std=08 src/h_timing.vhd
$GHDL -a --std=08 src/v_timing.vhd
$GHDL -a --std=08 src/pixel_gen.vhd
$GHDL -a --std=08 src/video_top.vhd
echo "Analyzing testbench..."
$GHDL -a --std=08 tb/tb_video_top.vhd
echo "Elaborating..."
$GHDL -e --std=08 $TOP
echo "Simulating..."
$GHDL -r --std=08 $TOP --tb-top=$TB
echo "Done."