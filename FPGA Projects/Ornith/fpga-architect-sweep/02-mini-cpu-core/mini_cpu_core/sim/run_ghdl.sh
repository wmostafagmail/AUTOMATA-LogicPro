#!/bin/bash

# GHDL Simulation Script for mini_cpu_core
# This script compiles, elaborates, and runs the testbench

set -e

echo "=== Mini CPU Core GHDL Simulation ==="
echo ""

# Clean previous build artifacts
echo "Cleaning previous build..."
rm -f *.cfi
rm -f tb_mini_cpu.vcd
rm -f ghdl_*

# Create analysis order array
ANALYSIS_ORDER=(
  "src/mini_cpu_pkg.vhd"
  "src/alu.vhd"
  "src/register_file.vhd"
  "src/control_fsm.vhd"
  "src/program_mem.vhd"
  "src/data_mem.vhd"
  "src/mini_cpu_top.vhd"
  "tb/tb_mini_cpu.vhd"
)

# Analyze all files
echo "Analyzing VHDL files..."
for file in "${ANALYSIS_ORDER[@]}"; do
  echo "  Analyzing: $file"
  ghdl -a --std=08 "$file" || exit 1
done

# Elaborate testbench
echo ""
echo "Elaborating testbench (tb_mini_cpu)..."
ghdl -e --std=08 tb_mini_cpu || exit 1

# Run simulation with VCD waveform output
echo ""
echo "Running simulation (10us)..."
ghdl -r --std=08 tb_mini_cpu --vcd=tb_mini_cpu.vcd --stop-time=10us || exit_status=$?

# Check exit status
if [ "$exit_status" = "0" ] || [ -z "$exit_status" ]; then
  echo ""
  echo "=== Simulation completed successfully ==="
  echo "VCD waveform saved to: tb_mini_cpu.vcd"
  echo ""
  echo "To view waveform (requires gtkwave or similar):"
  echo "  gtkwave tb_mini_cpu.vcd &"
else
  echo ""
  echo "=== Simulation failed with exit code $exit_status ==="
  exit "$exit_status"
fi

echo ""
echo "Done!"