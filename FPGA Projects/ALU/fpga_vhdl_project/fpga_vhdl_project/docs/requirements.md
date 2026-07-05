# ALU — Requirements Notes

## Design Intent
A parameterized, clocked Arithmetic Logic Unit (ALU) suitable for a small
datapath core. The DUT evaluates one of nine operations on two N-bit operands
each active clock edge and presents the result plus status flags on the next
clock edge.

## Functional Requirements
| #   | Requirement                                                | Status       |
|-----|------------------------------------------------------------|--------------|
| FR-01 | Support ADD, SUB, AND, OR, XOR, NOT, SLL, SRL, NOP      | Implemented  |
| FR-02 | Operands are N bits wide (default 8)                     | Implemented  |
| FR-03 | Zero and carry flags updated per operation               | Implemented  |
| FR-04 | Synchronous active-high reset                            | Implemented  |
| FR-05 | Fully synthesizable, GHDL-simulatable                    | Implemented  |

## Non-Functional Requirements
| #   | Requirement                        | Value                          |
|-----|------------------------------------|--------------------------------|
| NFR-01 | Preferred clock frequency       | 100 MHz (generic)              |
| NFR-02 | Reset style                       | Synchronous, active-high       |
| NFR-03 | VHDL revision                     | VHDL-2008                      |
| NFR-04 | Libraries                         | ieee.std_logic_1164, ieee.numeric_std |
| NFR-05 | Simulation tool                   | GHDL                           |

## Assumptions & Warnings
- Operation decoding and flag computation are combinational; the registered
  output appears one clock cycle after `opcode`, `a`, and `b` stabilize.
- Carry semantics: ADD propagates unsigned carry-out; SUB inverts it to model
  borrow (so zero minus one yields a '1' carry).
- Shift amount is taken from operand `b`; only the low log2(WIDTH) bits are
  meaningful.
- Not targeted at any specific FPGA family; constraints file is a placeholder.