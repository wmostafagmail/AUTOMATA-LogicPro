# ALU Architecture Notes

## Top-Level Entity: `alu`
- **Generics**: `WIDTH` (default 8)
- **Ports**: `clk`, `rst`, `a`, `b`, `op_code`, `result`, `zero_flag`, `carry_flag`, `overflow_flag`
- **Structure**: 
   - Combinational process computes result and flags using `alu_pkg` functions.
   - Sequential process registers outputs on active clock edge with synchronous reset.
   - Clean separation of datapath and control logic.

## Package: `alu_pkg`
- **Types**: `alu_op_t` (enum), `alu_flags_t` (record)
- **Functions**: `compute_alu_op`, `compute_flags`
- **Normalization**: Inputs converted to `unsigned`/`signed` before arithmetic/bitwise operations.
- **Flags Logic**: 
   - `zero`: Result equals 0.
   - `carry`: ADD MSB overflow, SUB borrow indicator.
   - `overflow`: Signed operand sign mismatch with result sign.

## Testbench: `alu_tb`
- **Clock**: 10 ns period generator.
- **Reset**: 20 ns active-high pulse.
- **Stimulus**: Sequential operation tests with post-edge sampling.
- **Verification**: Self-checking procedure validates result and all flags.
- **Exit**: Clean simulation exit via `std.env.stop(0)`.