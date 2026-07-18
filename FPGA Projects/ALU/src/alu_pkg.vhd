library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package alu_pkg is
  type alu_op_t is (OP_ADD, OP_SUB, OP_AND, OP_OR, OP_XOR, OP_NOT, OP_SLL, OP_SRL);
  
  type alu_flags_t is record
    zero      : std_logic;
    carry_out : std_logic;
    overflow  : std_logic;
  end record;
end package alu_pkg;

package body alu_pkg is
end package body alu_pkg;