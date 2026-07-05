# Unit Documentation: alu (entity)

## Purpose
Synchronous registered ALU with active-high synchronous reset. Computes result and flags each clock cycle via package helper functions.

## Architecture Style
- Single clocked process on `rising_edge(clk)`.
- Combinational computation delegated to `alu_pkg.calc_result` and `alu_pkg.calc_flags`.
- No inferred latches: every branch assigns both `result` and `flags` within the same clock edge.

## Reset Behavior
When `rst = '1'`:
- Internal result variable forced to `(others => '0')`.
- Zero flag asserted (`'1'`).
- Carry flag deasserted (`'0'`).

## Timing Notes
- Result is registered; valid one cycle after opcode/operand change (posedge clk).
- No setup/hold constraints modeled in simulation; add per-target FPGA timing analysis for implementation.