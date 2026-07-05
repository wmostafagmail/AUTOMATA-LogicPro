# Unit Note: alu_pkg

## Purpose
Defines core types, constants, and helper functions for the ALU datapath.

## Key Elements
- `alu_op_t`: Enumerated type for operation selection.
- `alu_flags_t`: Record type for status flags.
- `calc_result`: Computes operation result based on opcode.
- `calc_flags`: Derives zero and carry flags from operands and result.

## Verification Notes
- Functions are purely combinational and fully tested via the top-level testbench.
- All numeric operations use `ieee.numeric_std` types.