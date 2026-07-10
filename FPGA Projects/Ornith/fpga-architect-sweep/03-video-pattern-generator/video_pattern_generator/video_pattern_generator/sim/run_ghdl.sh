#!/usr/bin/env bash
set -euo pipefail

GHDL="ghdl"
STD="--std=08"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="vpid_tb"
VCD="${PROJECT_DIR}/sim/vga_waveform.vcd"

echo "=== GHDL VGA Pattern Generator ==="

echo "[1/6] Analyze src/vga_timing_pkg.vhd"
${GHDL} -a ${STD} "${PROJECT_DIR}/src/vga_timing_pkg.vhd"

echo "[2/6] Analyze src/vga_timing_gen.vhd"
${GHDL} -a ${STD} "${PROJECT_DIR}/src/vga_timing_gen.vhd"

echo "[3/6] Analyze src/vga_pixel_window.vhd"
${GHDL} -a ${STD} "${PROJECT_DIR}/src/vga_pixel_window.vhd"

echo "[4/6] Analyze src/video_pattern_gen.vhd"
${GHDL} -a ${STD} "${PROJECT_DIR}/src/video_pattern_gen.vhd"

echo "[5/6] Analyze src/top_video_gen.vhd"
${GHDL} -a ${STD} "${PROJECT_DIR}/src/top_video_gen.vhd"

echo "[6/6] Analyze tb/tb_top_video_gen.vhd"
${GHDL} -a ${STD} "${PROJECT_DIR}/tb/tb_top_video_gen.vhd"

echo "Elaborating..."
${GHDL} -e ${STD} -o "${OUT}" tb_top_video_gen

echo "Running simulation (VCD -> ${VCD})..."
${GHDL} -r ${STD} -o "${OUT}" tb_top_video_gen --vcd="${VCD}" --stop-time=20ms

if [ $? -eq 0 ]; then
    echo "Simulation PASSED. Waveform: ${VCD}"
else
    echo "Simulation FAILED."
    exit 1
fi