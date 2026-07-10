# AXI-Stream Packet Router
A minimal, deterministic 2-in-1-out AXI-Stream switch/router fabric.
Supports destination selection via `dest_sel_i` and handles backpressure deterministically.

## Build & Simulate
```bash
make analyze
make simulate