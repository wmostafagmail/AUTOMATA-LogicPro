# ALU Architecture

## Interfaces
- **clk**: 100 MHz clock.
- **rst**: Synchronous active-high reset.
- **opcode**: Selects operation.
- **a**, **b**: 8-bit operands.
- **result**: 8-bit result.
- **flags**: Zero and Carry flags.

## Operations
- **ADD**: a + b
- **SUB**: a - b
- **AND**: a & b
- **OR**: a | b
- **XOR**: a ^ b
- **NOT**: ~a
- **SLL**: a << (b[3:0])
- **SRL**: a >> (b[3:0])

## Reset Behavior
On reset, result is '0', Zero='1', Carry='0'.