# ALU Architecture

## Top-Level Entity: alu
- **Clock**: clk (rising edge)
- **Reset**: rst (synchronous active-high)
- **Inputs**: 
  - a, b: 8-bit operands
  - opcode: alu_op_t enum selecting operation
- **Outputs**:
  - result: 8-bit computed result
  - flags: alu_flags_t record with zero and carry bits

## Internal Architecture
- Single clocked process implements all operations
- Uses helper functions from alu_pkg for result and flag computation
- Type-safe conversions between std_logic_vector and unsigned/signed

## Package: alu_pkg
- Defines operation enum (alu_op_t)
- Defines flags record type (alu_flags_t)
- Provides calc_result and calc_flags functions

## Clock/Reset Strategy
- Synchronous reset clears outputs to zero and asserts zero flag
- Reset deasserted after 20 ns in testbench
- No CDC paths (single clock domain design)

## Timing Considerations
- Combinational path: opcode decode + operation logic
- Sequential path: registered output with one-cycle latency
- Maximum frequency depends on target FPGA (estimate >100 MHz for 8-bit ALU)