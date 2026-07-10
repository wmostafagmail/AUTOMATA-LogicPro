#!/bin/bash
set -e
echo "Analyzing VHDL files..."
ghdl --std=08 -a src/mini_cpu_core_pkg.vhd src/mini_cpu_core.vhd tb/tb_mini_cpu_core.vhd

echo "Elaborating testbench..."
ghdl --std=08 -e tb_mini_cpu_core

echo "Running simulation..."
ghdl --std=08 -r tb_mini_cpu_core --vcd=sim/waveform.vcd

echo "Simulation complete. Waveform saved to sim/waveform.vcd"