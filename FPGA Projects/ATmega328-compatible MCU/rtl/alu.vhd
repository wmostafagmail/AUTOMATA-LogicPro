library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

use work.cpu_pkg.all;

entity alu is
  port (
    lhs        : in  byte_t;
    rhs        : in  byte_t;
    op         : in  alu_op_t;
    result     : out byte_t;
    zero_flag  : out std_logic;
    carry_flag : out std_logic
  );
end entity;

architecture rtl of alu is
begin
  process(lhs, rhs, op)
    variable tmp : unsigned(8 downto 0);
    variable res : byte_t;
    variable car : std_logic;
  begin
    tmp := (others => '0');
    res := (others => '0');
    car := '0';

    case op is
      when ALU_PASS_RS =>
        res := rhs;
      when ALU_ADD =>
        tmp := unsigned('0' & lhs) + unsigned('0' & rhs);
        res := std_logic_vector(tmp(7 downto 0));
        car := tmp(8);
      when ALU_SUB =>
        tmp := unsigned('0' & lhs) - unsigned('0' & rhs);
        res := std_logic_vector(tmp(7 downto 0));
        car := tmp(8);
      when ALU_AND =>
        res := lhs and rhs;
      when ALU_OR =>
        res := lhs or rhs;
      when ALU_XOR =>
        res := lhs xor rhs;
    end case;

    result <= res;
    carry_flag <= car;

    if res = x"00" then
      zero_flag <= '1';
    else
      zero_flag <= '0';
    end if;
  end process;
end architecture;
