#!/bin/bash
set -e
GHDL=ghdl
STD="--std=08"

echo "Analyzing packages..."
$GHDL -a $STD src/cpu_pkg.vhd
$GHDL -a $STD src/cpu_pkg_body.vhd

echo "Analyzing DUT..."
$GHDL -a $STD src/cpu_core.vhd

echo "Analyzing Testbench..."
$GHDL -a $STD tb/tb_cpu_core.vhd

echo "Elaborating..."
$GHDL -e $STD tb_cpu_core

echo "Running simulation..."
$GHDL -r $STD tb_cpu_core --vcd=cpu_core_tb.vcd --stop-time=1us

echo "Simulation complete."