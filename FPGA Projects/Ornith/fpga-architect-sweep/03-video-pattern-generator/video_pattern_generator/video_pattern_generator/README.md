# VGA Pattern Generator (VHDL / GHDL)

A minimal, synthesizable VGA 640x480 @ 60 Hz pattern generator written in VHDL-2008.

## What it does
- Generates HSYNC/VSYNC and an active-video window from a single 25 MHz pixel clock.
- Produces a deterministic RGB color pattern from the current pixel coordinate.
- Includes a self-checking GHDL testbench that verifies timing windows and one representative pixel-addressing scenario.

## Build & simulate (GHDL)
```bash
make sim
# or directly:
./sim/run_ghdl.sh