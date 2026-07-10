#!/bin/bash
set -e

echo "Analyzing VHDL files..."
ghdl -a --std=08 -Work=work src/cpu_pkg.vhd
ghdl -a --std=08 -Work=work src/alu.vhd
ghdl -a --std=08 -Work=work src/reg_file.vhd
ghdl -a --std=08 -Work=work src/cpu_core.vhd
ghdl -a --std=08 -Work=work tb/tb_mini_cpu.vhd

echo "Elaborating testbench..."
ghdl -e --std=08 -Work=work tb_mini_cpu

echo "Running simulation..."
ghdl -r --std=08 -Work=work tb_mini_cpu --vcd=wave.vcd