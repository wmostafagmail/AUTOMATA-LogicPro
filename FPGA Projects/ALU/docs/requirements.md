# ALU Requirements
- **Data Width**: 8 bits (configurable via generic WIDTH).
- **Operations**: ADD, SUB, AND, OR, XOR, NOT, SLL, SRL, NOP.
- **Reset**: Synchronous active-high.
- **Clock**: 100 MHz (10 ns period).
- **Output**: 8-bit result vector and flags record (zero, carry).
- **Constraints**: Portable to standard FPGA families.