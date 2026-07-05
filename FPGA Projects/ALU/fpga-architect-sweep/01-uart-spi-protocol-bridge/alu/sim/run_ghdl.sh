#!/bin/bash
ghdl -a --std=08 src/alu_pkg.vhd
ghdl -a --std=08 src/alu.vhd
ghdl -a --std=08 tb/tb_alu.vhd
ghdl -e --std=08 tb_alu
ghdl -r --std=08 tb_alu --vcd=tb_alu.vcd
echo "Simulation complete."