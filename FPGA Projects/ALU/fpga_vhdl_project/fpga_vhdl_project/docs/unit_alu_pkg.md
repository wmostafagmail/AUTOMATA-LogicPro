# Unit Note — alu_pkg

## Scope
Shared types (`alu_op_t`, `alu_flags_t`), default constants, and pure helper
functions used by both the DUT and the testbench.

## Public Interface
- `constant DEFAULT_DATA_WIDTH : integer := 8;`
- `type alu_op_t is (ADD, SUB, AND_, OR_, XOR_, NOT_, SLL, SRL, NOP);` — safe
  identifiers that avoid VHDL operator keywords.
- `type alu_flags_t is record zero : std_logic; carry : std_logic; end record;`
- `constant DEFAULT_FLAGS : alu_flags_t := (zero => '1', carry => '0');`
- `function calc_result(a, b : in std_logic_vector; op : in alu_op_t) return std_logic_vector;`
- `function calc_flags(a, b, res : in std_logic_vector; op : in alu_op_t) return alu_flags_t;`

## Type Discipline
- Raw `std_logic_vector` arguments are normalized into typed locals (`a_u`,
  `b_u`) before any arithmetic or bitwise operation.
- All internal intermediates stay as `unsigned`; conversion to/from SLV is
  performed only at the function boundary.

## GHDL Order
`alu_pkg.vhd` must be analyzed first, before `alu.vhd` and any testbench that
uses it.