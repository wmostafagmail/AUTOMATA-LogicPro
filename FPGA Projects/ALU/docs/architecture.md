# ALU Architecture

## Top-Level Interface
- `clk`: 100 MHz system clock.
- `rst`: Synchronous active-high reset.
- `op`: Operation selector from `alu_pkg.alu_op_t`.
- `a`, `b`: 8-bit operands.
- `result`: 8-bit result output.
- `flags`: Record containing `zero`, `carry_out`, `overflow`.

## Implementation Details
- The ALU uses a single clocked process for registered outputs.
- Internal variables compute next values combinatorially within the clock edge.
- `numeric_std` is used for all arithmetic and bitwise operations.
- No inferred latches or combinational feedback loops.
- Reset deassertion is clean and synchronous.