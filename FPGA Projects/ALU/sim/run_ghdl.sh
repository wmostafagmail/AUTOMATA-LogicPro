#!/usr/bin/env bash
set -e

echo "Starting GHDL simulation for ALU project..."

# Create work directory
mkdir -p work
mkdir -p waves

# Analyze
ghdl -a --std=08 --workdir=work src/alu_pkg.vhd
ghdl -a --std=08 --workdir=work src/alu.vhd
ghdl -a --std=08 --workdir=work tb/tb_alu.vhd

# Elaborate
ghdl -e --std=08 --workdir=work tb_alu

# Simulate with VCD waveform output
ghdl -r --std=08 --workdir=work tb_alu --vcd=waves/tb_alu.vcd --stop-time=200ns

echo "Simulation complete. Check waves/tb_alu.vcd for waveform."