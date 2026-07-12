#!/bin/bash
set -e

# Analysis order is critical (package -> RTL -> TB)
ghdl -a --std=08 ../src/cpu_pkg.vhd
ghdl -a --std=08 ../src/mini_cpu_core.vhd
ghdl -a --std=08 ../tb/tb_mini_cpu_core.vhd

# Elaborate the testbench
ghdl -e --std=08 tb_mini_cpu_core

# Run simulation and dump VCD waveform
ghdl -r --std=08 tb_mini_cpu_core --vcd=mini_cpu_core.vcd