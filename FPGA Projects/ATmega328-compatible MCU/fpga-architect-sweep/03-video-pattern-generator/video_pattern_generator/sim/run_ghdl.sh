#!/usr/bin/env bash
set -e
WORKDIR=work
mkdir -p "$WORKDIR" waves
cd "$WORKDIR"

ghdl -a --std=08 --workdir=. ../src/video_pkg.vhd
ghdl -a --std=08 --workdir=. ../src/timing_gen.vhd
ghdl -a --std=08 --workdir=. ../src/pixel_gen.vhd
ghdl -a --std=08 --workdir=. ../src/video_top.vhd
ghdl -a --std=08 --workdir=. ../tb/tb_video_top.vhd
ghdl -e --std=08 --workdir=. tb_video_top
ghdl -r --std=08 --workdir=. tb_video_top --vcd=../waves/tb_video_top.vcd --stop-time=2us
echo "Simulation complete."