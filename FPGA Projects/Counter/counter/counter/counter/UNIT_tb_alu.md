# UNIT_tb_alu.md

## Testbench: tb_alu
Self-checking testbench for the ALU.
Tests all operations with random and deterministic inputs.
Checks overflow and zero flags.
Verifies reset behavior.

## Simulation
- Runs for 1000 ns.
- Checks results against expected values.
- Stops with `std.env.stop(0)` on success.
- Reports failures with `std.env.stop(1)`.