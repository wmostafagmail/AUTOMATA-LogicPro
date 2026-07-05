#!/bin/bash
set -e
ghdl -a --std=08 src/alu_pkg.vhd src/alu.vhd
ghdl -a --std=08 tb/tb_alu.vhd
ghdl -m --std=08 tb_alu
ghdl -r --std=08 tb_alu --wave=tb_alu.ghw --stop-when=0