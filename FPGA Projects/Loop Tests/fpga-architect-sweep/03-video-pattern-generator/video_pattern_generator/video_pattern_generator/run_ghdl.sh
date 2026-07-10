#!/bin/bash
set -e
echo "Analyzing VHDL sources..."
ghdl -a --std=08 src/video_timing_pkg.vhd
ghdl -a --std=08 src/video_top.vhd
ghdl -a --std=08 tb/tb_video_top.vhd

echo "Elaborating testbench..."
ghdl -e --std=08 tb_video_top

echo "Running simulation..."
ghdl -r --std=08 tb_video_top --vcd=tb_video_top.vcd --stop-time=10us
echo "Simulation complete. Exit code: $?"