#!/bin/bash
set -e
echo "Running GHDL simulation for Counter project..."
ghdl -a --std=08 counter/counter/src/alu_pkg.vhd counter/counter/src/alu.vhd counter/counter/tb/tb_alu.vhd
ghdl -e --std=08 tb_alu
ghdl -r --std=08 tb_alu --wave=tb_alu.fst
echo "Simulation complete. Waveform saved to tb_alu.fst."