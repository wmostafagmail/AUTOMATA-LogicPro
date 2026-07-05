library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;

entity alu is
  port (
    clk           : in  std_logic;
    rst           : in  std_logic;
    op_code       : in  std_logic_vector(2 downto 0);
    a             : in  std_logic_vector(7 downto 0);
    b             : in  std_logic_vector(7 downto 0);
    result        : out std_logic_vector(7 downto 0);
    zero_flag     : out std_logic;
    overflow_flag : out std_logic
  );
end entity alu;

architecture rtl of alu is
begin
  process(clk, rst)
    variable a_v : unsigned(7 downto 0);
    variable b_v : unsigned(7 downto 0);
    variable res_v : unsigned(8 downto 0);
  begin
    if rst = '1' then
      res_v := (others => '0');
    elsif rising_edge(clk) then
      a_v := unsigned(a);
      b_v := unsigned(b);
      case op_code is
        when OP_ADD =>
          res_v := a_v + b_v;
        when OP_SUB =>
          res_v := a_v - b_v;
        when OP_AND =>
          res_v := resize(a_v and b_v, 8);
        when OP_OR  =>
          res_v := resize(a_v or b_v, 8);
        when OP_XOR =>
          res_v := resize(a_v xor b_v, 8);
        when OP_NOT =>
          res_v := resize(not a_v, 8);
        when OP_INC =>
          res_v := a_v + 1;
        when OP_SLL =>
          res_v := resize(a_v sll 1, 8);
        when others =>
          res_v := (others => '0');
      end case;
    end if;
    result <= std_logic_vector(res_v(7 downto 0));
    zero_flag <= '1' when res_v(7 downto 0) = (others => '0') else '0';
    overflow_flag <= res_v(8);
  end process;
end architecture rtl;