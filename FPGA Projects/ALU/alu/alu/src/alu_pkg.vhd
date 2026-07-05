package alu_pkg is
  -- ALU Operation Codes
  type alu_op_t is (
    OP_ADD,
    OP_SUB,
    OP_AND,
    OP_OR,
    OP_XOR,
    OP_NOT,
    OP_SLL,
    OP_SRL,
    OP_NOP
  );

  -- ALU Flags Record
  type alu_flags_t is record
    zero  : std_logic;
    carry : std_logic;
  end record;

  -- Default Values
  constant DEFAULT_FLAGS : alu_flags_t := (zero => '1', carry => '0');
end package alu_pkg;

package body alu_pkg is
end package body alu_pkg;