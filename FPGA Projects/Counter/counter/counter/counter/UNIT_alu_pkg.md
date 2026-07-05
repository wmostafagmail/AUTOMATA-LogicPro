# UNIT_alu_pkg.md

## Entity: alu_pkg
Defines types, constants, and operation codes for the 8-bit ALU.

## Architecture
- Uses `ieee.numeric_std` for arithmetic.
- Defines `ALU_OP` type as `std_logic_vector(2 downto 0)`.
- Constants for ADD, SUB, AND, OR, XOR, NOT_A, SHL, SHR.