# ALU Architecture

## Top Entity: `alu`
- **Clock**: `clk` (100 MHz target)
- **Reset**: `rst` (Synchronous, active-high)
- **Inputs**: `op_code` (3-bit), `a` (8-bit), `b` (8-bit)
- **Outputs**: `result` (8-bit), `zero_flag` (1-bit), `overflow_flag` (1-bit)

## Datapath
- Uses internal `unsigned` variables for arithmetic to avoid type mismatches.
- Overflow flag captures the 9th bit of addition/subtraction results.
- Zero flag asserts when the 8-bit result is all zeros.

## Control
- Opcode decoding drives a case statement inside a synchronous process.
- Reset clears internal state and forces zero result.