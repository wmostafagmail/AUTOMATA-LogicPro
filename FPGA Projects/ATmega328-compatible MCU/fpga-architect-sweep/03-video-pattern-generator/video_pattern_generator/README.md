# 03-Video-Pattern-Generator

## Overview
A simple VGA/HDMI-style pattern generator that produces horizontal/vertical sync signals and a diagonal checkerboard pixel pattern.

## Architecture
- **video_sync_ctrl**: Generates H_SYNC and V_SYNC pulses based on counter inputs.
- **video_pixel_addr_gen**: Computes active window coordinates (X, Y) from counters.
- **video_pattern_logic**: Generates 8-bit color data based on X+Y parity.
- **video_pattern_gen_top**: Integrates counters and sub-blocks.

## Simulation
Run `make simulate` or execute `sim/run_ghdl.sh`.

## Assumptions
- Pixel Clock: ~25.175 MHz (VGA 640x480)
- Active-Low Sync Pulses
- Synchronous Active-High Reset