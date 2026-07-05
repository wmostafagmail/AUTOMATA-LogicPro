library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package alu_pkg is
  type alu_op_t is (OP_ADD, OP_SUB, OP_AND, OP_OR, OP_XOR, OP_NOT, OP_SHL, OP_SHR);
  constant NUM_ALU_OPS : integer := 8;
  function decode_op(sig : std_logic_vector) return alu_op_t;
end package alu_pkg;

package body alu_pkg is
  function decode_op(sig : std_logic_vector) return alu_op_t is
  begin
    case sig is
      when "000" => return OP_ADD;
      when "001" => return OP_SUB;
      when "010" => return OP_AND;
      when "011" => return OP_OR;
      when "100" => return OP_XOR;
      when "101" => return OP_NOT;
      when "110" => return OP_SHL;
      when "111" => return OP_SHR;
      when others => return OP_ADD;
    end case;
  end function;
end package body alu_pkg;