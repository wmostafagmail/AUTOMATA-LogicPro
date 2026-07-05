# Unit: tb_alu

## Description
Self-checking testbench for `alu`. Stimulates all defined operations and compares against expected results. Stops cleanly with `std.env.stop(0)` on success.

## Test Cases
- ADD, SUB, AND, OR, XOR, NOT, SLT, MOV.
- Boundary cases: overflow, carry, zero result, less-than.

## Simulation
- GHDL-ready.
- Clock: 100 MHz.
- Reset: Sync active-high.
- Scoreboard: Compares result and flags after each clock edge.