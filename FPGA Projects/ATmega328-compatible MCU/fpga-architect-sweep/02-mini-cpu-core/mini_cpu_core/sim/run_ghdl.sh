#!/bin/bash
set -e
mkdir -p work waves
ghdl -a --std=08 --workdir=work src/cpu_pkg.vhd
ghdl -a --std=08 --workdir=work src/rom.vhd
ghdl -a --std=08 --workdir=work src/ram.vhd
ghdl -a --std=08 --workdir=work src/alu.vhd
ghdl -a --std=08 --workdir=work src/regfile.vhd
ghdl -a --std=08 --workdir=work src/control_fsm.vhd
ghdl -a --std=08 --workdir=work src/cpu_top.vhd
ghdl -a --std=08 --workdir=work tb/tb_cpu_top.vhd
ghdl -e --std=08 --workdir=work tb_cpu_top
ghdl -r --std=08 --workdir=work tb_cpu_top --vcd=waves/tb_cpu_top.vcd --stop-time=200ns
echo "Simulation complete."