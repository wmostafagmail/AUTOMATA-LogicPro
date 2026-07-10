library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity alu is
  port (
    a         : in  std_logic_vector(7 downto 0);
    b         : in  std_logic_vector(7 downto 0);
    alu_op    : in  integer range 0 to 7;
    result    : out std_logic_vector(7 downto 0);
    zero_flag : out std_logic
  );
end entity alu;

architecture rtl of alu is
begin

  process(a, b, alu_op)
    variable a_u     : unsigned(7 downto 0);
    variable b_u     : unsigned(7 downto 0);
    variable res_var : unsigned(7 downto 0);
  begin
    a_u := unsigned(a);
    b_u := unsigned(b);

    case alu_op is
      when 0 => -- ADD
        res_var := a_u + b_u;
      when 1 => -- SUB
        res_var := a_u - b_u;
      when 2 => -- AND
        res_var := a_u and b_u;
      when 3 => -- OR
        res_var := a_u or b_u;
      when 4 => -- XOR
        res_var := a_u xor b_u;
      when 5 => -- SLL
        if to_integer(b_u) < 8 then
          res_var := shift_left(a_u, to_integer(b_u));
        else
          res_var := (others => '0');
        end if;
      when 6 => -- SRL
        if to_integer(b_u) < 8 then
          res_var := shift_right(a_u, to_integer(b_u));
        else
          res_var := (others => '0');
        end if;
      when others =>
        res_var := a_u;
    end case;

    result    <= std_logic_vector(res_var);
    zero_flag <= '1' when res_var = to_unsigned(0, 8) else '0';
  end process;

end architecture rtl;