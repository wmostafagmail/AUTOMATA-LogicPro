# Unit Note: alu

## Purpose
Top-level synthesizable entity for the ALU design.

## Key Elements
- Generic `WIDTH` for operand size.
- Synchronous process handling reset and datapath computation.
- Uses `alu_pkg` for helper functions.

## Verification Notes
- Reset behavior verified in testbench.
- All operational modes tested sequentially.
- Output sampling occurs after active clock edge.