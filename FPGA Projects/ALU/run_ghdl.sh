#!/bin/bash
set -e
echo "Analyzing ALU project..."
ghdl -a --std=08 src/alu_pkg.vhd
ghdl -a --std=08 src/alu.vhd
ghdl -a --std=08 tb/alu_tb.vhd
echo "Elaborating ALU testbench..."
ghdl -e --std=08 alu_tb
echo "Running ALU simulation..."
ghdl -r --std=08 alu_tb --vcd=alu_tb.vcd
echo "Simulation complete."