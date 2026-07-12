#!/bin/bash
ghdl -a --std=08 --workdir=work src/cpu_pkg.vhd
ghdl -a --std=08 --workdir=work src/alu.vhd
ghdl -a --std=08 --workdir=work src/regfile.vhd
ghdl -a --std=08 --workdir=work src/cpu_core.vhd
ghdl -a --std=08 --workdir=work tb/tb_cpu_core.vhd
ghdl -e --std=08 --workdir=work tb_cpu_core
ghdl -r --std=08 --workdir=work tb_cpu_core --vcd=tb_cpu_core.vcd