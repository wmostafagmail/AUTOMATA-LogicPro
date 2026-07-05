#!/bin/bash
# =============================================================================
# Script     : run_sim.sh
# Title      : GHDL Simulation Runner for Counter Project
# Description: Compiles, elaborates, and runs the self-checking testbench.
#              Generates a VCD waveform file for post-simulation analysis.
# Usage      : chmod +x scripts/run_sim.sh && ./scripts/run_sim.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=============================================================================="
echo "  Counter Project: GHDL Simulation"
echo "=============================================================================="
echo "Project root : $PROJECT_ROOT"
echo "VHDL revision: VHDL-2008"
echo "Clock        : 100 MHz (10 ns period)"
echo "Reset style  : Synchronous active-high"
echo "=============================================================================="
echo ""

# Clean previous work directory and waveform files
echo "--- Cleaning previous build artifacts ---"
rm -rf "$PROJECT_ROOT/work"
rm -f "$PROJECT_ROOT/counter_wave.vcd" "$PROJECT_ROOT/*.vcd"
mkdir -p "$PROJECT_ROOT/work"

# Compile DUT (Design Under Test)
echo "--- Compiling updown_counter (DUT) ---"
ghdl -a --std=08 -Wno-misc-alignments "$PROJECT_ROOT/src/updown_counter.vhd" || exit 1

# Compile testbench
echo "--- Compiling tb_updown_counter (testbench) ---"
ghdl -a --std=08 -Wno-misc-alignments "$PROJECT_ROOT/tb/tb_updown_counter.vhd" || exit 1

# Elaborate the testbench (top-level for simulation)
echo "--- Elaborating tb_updown_counter ---"
ghdl -e --std=08 -Wno-misc-alignments tb_updown_counter || exit 1

# Run simulation with VCD waveform output
echo "--- Running simulation (generating counter_wave.vcd) ---"
ghdl -r --std=08 -vcd="$PROJECT_ROOT/counter_wave.vcd" tb_updown_counter || exit 1

echo ""
echo "=============================================================================="
echo "  Simulation completed successfully."
echo "  Waveform file: $PROJECT_ROOT/counter_wave.vcd"
echo ""
echo "  To view waveform with GTKWave, run:"
echo "    gtkwave $PROJECT_ROOT/counter_wave.vcd"
echo "=============================================================================="