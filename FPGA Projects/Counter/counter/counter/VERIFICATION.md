# Verification Plan

## Strategy
- Self-checking testbench `tb_alu` validates all ALU operations.
- Scoreboard compares output against expected values.
- Clean stop with `std.env.stop(0)` on pass.

## GHDL Commands
- Compile: `ghdl -a --std=08 alu_pkg.vhd alu.vhd`
- Elaborate: `ghdl -e --std=08 tb_alu`
- Run: `ghdl -r --std=08 tb_alu --wave=tb_alu.fst`

## Expected Results
- All test cases pass.
- No failures reported.
- Simulation ends with exit code 0.