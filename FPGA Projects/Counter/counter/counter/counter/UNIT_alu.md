# UNIT_alu.md

## Entity: alu
Implements an 8-bit ALU with synchronous reset.
Supports ADD, SUB, AND, OR, XOR, NOT_A, SHL, SHR operations.
Generates overflow and zero flags.

## Architecture
- Uses `ieee.numeric_std` for arithmetic.
- Uses `ieee.std_logic_1164` for logic.
- Combinational logic for operation selection.
- Sequential logic for register outputs and flags.
- Reset clears registers and flags.

## Notes
- Overflow detected for ADD/SUB based on MSB carry.
- Zero flag set when result is 0.
- Shift operations use logical shift right/left.
- Not_A inverts operand A.