# Architecture Notes: 8-bit ALU

## Top-Level Interface
- `clk_i`: Primary clock (100 MHz).
- `rst_i`: Synchronous active-high reset.
- `a_i`, `b_i`: 8-bit operand inputs.
- `op_i`: 3-bit opcode selector.
- `y_o`: 8-bit result output.
- `flags_o`: Record containing `zero`, `carry`, `overflow` flags.

## Block Responsibilities
- `alu_pkg`: Defines opcode constants, `opcode_t` subtype, `alu_flags_t` record, and the `alu_execute` helper function.
- `alu`: Instantiates the combinational datapath and registered output stage. The combinational process computes the next result and flags using typed `unsigned` operands. The registered process updates state on the rising clock edge, subject to synchronous reset.
- `tb_alu`: Self-checking testbench that applies stimulus, waits for the correct post-edge observation point, compares against a golden model, and terminates cleanly with `std.env.stop(0)` on success.