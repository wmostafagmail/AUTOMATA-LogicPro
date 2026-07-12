library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.cpu_pkg.all;

entity alu is
  port (
    a_i, b_i   : in  cpu_t;
    op_i       : in  op_code_t;
    res_o      : out cpu_t;
    zero_o     : out std_logic
  );
end entity alu;

architecture rtl of alu is
  signal res_s : cpu_t;
begin
  process(a_i, b_i, op_i)
  begin
    res_s <= (others => '0');
    case op_i is
      when OP_ADD => res_s <= a_i + b_i;
      when OP_SUB => res_s <= a_i - b_i;
      when OP_AND => res_s <= a_i and b_i;
      when OP_OR  => res_s <= a_i or b_i;
      when OP_LDI => res_s <= b_i;
      when others => res_s <= (others => '0');
    end case;
  end process;
  res_o <= res_s;
  zero_o <= '1' when (res_s = to_unsigned(0, CPU_W)) else '0';
end architecture rtl;
