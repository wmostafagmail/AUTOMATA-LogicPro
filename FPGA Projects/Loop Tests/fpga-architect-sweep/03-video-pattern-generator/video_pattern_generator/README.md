# video_pattern_generator

## Overview
VGA-style pattern generator with deterministic timing, sync generation, and framebuffer pixel addressing. Designed for GHDL simulation and generic FPGA synthesis.

## Usage
1. Run simulation: `make sim` or `./run_ghdl.sh`
2. Analyze waveform: `ghw-view tb_video_top.ghw` or `gtkwave tb_video_top.vcd`
3. Synthesize: Map to target using vendor tools with `constraints/video_timing.xdc`

## Verification
Self-checking testbench validates reset behavior, sync pulse widths, active video window, and framebuffer address increment. Exits with code 0 on success.