library ieee;
use ieee.std_logic_1164.all;

use work.cpu_pkg.all;

entity tb_alu is
end entity;

architecture sim of tb_alu is
  signal lhs        : byte_t := (others => '0');
  signal rhs        : byte_t := (others => '0');
  signal result     : byte_t;
  signal zero_flag  : std_logic;
  signal carry_flag : std_logic;
  signal op         : alu_op_t := ALU_PASS_RS;
begin
  dut: entity work.alu
    port map (
      lhs        => lhs,
      rhs        => rhs,
      op         => op,
      result     => result,
      zero_flag  => zero_flag,
      carry_flag => carry_flag
    );

  process
  begin
    lhs <= x"0A";
    rhs <= x"05";
    op  <= ALU_ADD;
    wait for 1 ns;
    assert result = x"0F" report "ADD failed" severity failure;

    lhs <= x"05";
    rhs <= x"05";
    op  <= ALU_SUB;
    wait for 1 ns;
    assert result = x"00" report "SUB result failed" severity failure;
    assert zero_flag = '1' report "Zero flag failed" severity failure;

    lhs <= x"AA";
    rhs <= x"0F";
    op  <= ALU_AND;
    wait for 1 ns;
    assert result = x"0A" report "AND failed" severity failure;

    wait;
  end process;
end architecture;
