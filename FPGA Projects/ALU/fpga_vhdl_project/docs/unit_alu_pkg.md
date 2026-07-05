# Unit Documentation: alu_pkg

## Purpose
Defines the ALU operation enum (`alu_op_t`), flags record type (`alu_flags_t`), and pure helper functions for result computation and flag derivation.

## Types Defined
- **alu_op_t** (enum): ADD, SUB, AND, OR, XOR, NOT, SLL, SRL, NOP.
- **alu_flags_t** (record): `zero : std_logic`, `carry : std_logic`.
- **DEFAULT_FLAGS**: Reset-default flag values `(zero => '1', carry => '0')`.

## Functions
| Function        | Inputs                              | Output             | Notes                                    |
|-----------------|-------------------------------------|--------------------|------------------------------------------|
| calc_result     | a, b : std_logic_vector; op : alu_op_t | std_logic_vector | Normalizes inputs to unsigned before arithmetic/bitwise/shift operations. |
| calc_flags      | a, b, res : std_logic_vector; op : alu_op_t | alu_flags_t | Computes zero flag from result value; carry from extended-width addition for ADD/SUB. |

## Key Rules Applied
- All raw `std_logic_vector` inputs normalized to typed locals (`a_u`, `b_u`) before any arithmetic, bitwise, or shift operation.
- `resize`, `shift_left`, `shift_right` applied only on `unsigned`/`signed` types.
- Zero flag derived from the internal typed result value, not from raw operands.
- Carry for SUB inverts the adder carry_out (borrow-out indicator).