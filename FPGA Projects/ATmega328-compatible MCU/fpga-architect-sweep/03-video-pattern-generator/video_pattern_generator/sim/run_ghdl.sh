#!/bin/bash
set -e

echo "Analyzing VHDL files..."
ghdl -a --std=08 ../src/video_pattern_gen_pkg.vhd
ghdl -a --std=08 ../src/video_sync_ctrl.vhd
ghdl -a --std=08 ../src/video_pixel_addr_gen.vhd
ghdl -a --std=08 ../src/video_pattern_logic.vhd
ghdl -a --std=08 ../src/video_pattern_gen_top.vhd
ghdl -a --std=08 ../tb/tb_video_pattern_gen.vhd

echo "Elaborating testbench..."
ghdl -e tb_video_pattern_gen

echo "Running simulation with VCD output..."
ghdl -r tb_video_pattern_gen --vcd=sim/video_pattern_gen.vcd

echo "Simulation complete."