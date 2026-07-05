# AXI-Stream Packet Router

## Overview
A compact, synthesizable VHDL implementation of an AXI-Stream packet router.
Features round-robin arbitration, deterministic backpressure handling, and a self-checking testbench.

## Usage
1. Install GHDL: `sudo apt install ghdl` or `brew install ghdl`.
2. Run simulation: `make sim`.
3. View waveforms: `gtkwave tb_axi_stream_router.fst`.

## Architecture
- `axi_stream_pkg.vhd`: Constants and types.
- `axi_stream_router.vhd`: Router logic.
- `tb_axi_stream_router.vhd`: Self-checking testbench.