# Video Pattern Generator Project

## Overview
A compact VGA/HDMI-style timing and pattern generator implemented in VHDL-2008.
Includes horizontal/vertical sync generation, active video window detection, and a deterministic pixel pattern generator.

## Structure
- `src/`: Shared package, timing counters, pixel generator, top-level integration.
- `tb/`: Self-checking testbench with deterministic stimulus and PASS/FAIL reporting.
- `sim/`: GHDL analysis/elaborate/run scripts and plan.

## Usage
Run `sim/run_ghdl.sh` or follow `sim/ghdl_plan.json` for exact GHDL commands.
Expected result: `TEST PASSED`.