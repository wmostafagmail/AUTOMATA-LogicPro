#!/bin/bash
set -e

# 1. Analysis
ghdl -a --std=08 \
    src/video_types_pkg.vhd \
    src/video_timing_gen.vhd \
    src/pattern_gen.vhd \
    src/video_top.vhd \
    tb/tb_video_generator.vhd

# 2. Elaboration
ghdl -e --std=08 tb_video_generator

# 3. Execution with VCD output
ghdl -r --std=08 tb_video_generator --vcd=video_sim.vcd