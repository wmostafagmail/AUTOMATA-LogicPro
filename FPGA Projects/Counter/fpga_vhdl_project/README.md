# Counter Project

## Description
8-bit Up/Down Counter with synchronous active-high reset.

## Interface
- `clk`: Clock input.
- `rst`: Synchronous active-high reset.
- `en`: Enable counting.
- `dir`: Direction ('1' = up, '0' = down).
- `count_o`: 8-bit output value.

## Simulation
Run GHDL simulation:
```bash
make sim
```
Output waveform: `waveform.vcd`.

## Verification
Self-checking testbench validates reset, up/down counting, enable hold, and wrap-around.
Stops cleanly on success with `std.env.stop(0)`.