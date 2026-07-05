#!/bin/bash
set -e
WORKDIR=work
GHDL=ghdl

rm -rf "$WORKDIR"
mkdir -p "$WORKDIR"

$GHDL -a --std=08 --workdir=$WORKDIR src/cpu_pkg.vhd
$GHDL -a --std=08 --workdir=$WORKDIR src/cpu_core.vhd
$GHDL -a --std=08 --workdir=$WORKDIR tb/tb_cpu_core.vhd
$GHDL -e --std=08 --workdir=$WORKDIR tb_cpu_core
$GHDL -r --std=08 --workdir=$WORKDIR tb_cpu_core --vcd=tb_cpu_core.vcd

echo "Simulation completed successfully."