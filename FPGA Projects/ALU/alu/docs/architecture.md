# ALU Architecture Notes

## Entity Interface
- `clk_i`   : 100 MHz system clock (input)
- `rst_ni`  : synchronous active-high reset (input)
- `op_i`    : 3-bit opcode select (input)
- `a_i`     : 8-bit operand A (input)
- `b_i`     : 8-bit operand B / shift count (input)
- `result_o`: 8-bit ALU result (output, registered)
- `zero_o`  : zero flag output (output, registered)

## Internal Design
- Opcode is decoded from the raw `op_i` vector using its index range.
- All arithmetic and bitwise operations are performed on typed `unsigned` intermediates inside a clocked process.
- The SRA branch converts operand A to `signed` before shifting to preserve the sign bit; all other branches operate on `unsigned`.
- The zero flag is computed from the post-operation result by scanning every bit, then registered alongside the result.

## Clock/Reset Strategy
- Single-clock synchronous design.
- Reset is active-low (`rst_ni`) with synchronous reset: outputs go to 0 and `zero_o` goes high after reset release on the next rising edge.

## Datapath/Control Partitioning
- This ALU has no separate control unit; opcode decode is combinational inside a single registered process, keeping the design compact and timing-friendly for an 8-bit width at 100 MHz.

## Timing Risks
- Minimal: one combinational path from inputs to result_o / zero_o within a single clock cycle. Trivially meets 100 MHz on any modern FPGA family.