library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package body cpu_pkg is
  function alu_op(a : data_t; b : data_t; op : op_code_t) return data_t is
    variable a_u : unsigned(7 downto 0);
    variable b_u : unsigned(7 downto 0);
    variable res : unsigned(7 downto 0);
  begin
    a_u := unsigned(a);
    b_u := unsigned(b);
    case op is
      when OP_ADD => res := a_u + b_u;
      when OP_SUB => res := a_u - b_u;
      when OP_AND => res := a_u and b_u;
      when OP_OR  => res := a_u or b_u;
      when others => res := (others => '0');
    end case;
    return std_logic_vector(res);
  end function alu_op;
end package body cpu_pkg;
