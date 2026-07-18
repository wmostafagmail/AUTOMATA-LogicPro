library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;
use std.env.all;

entity tb_alu is
end entity;

architecture sim of tb_alu is
  constant CLK_PERIOD : time := 10 ns;
  signal clk : std_logic := '0';
  signal rst : std_logic := '1';
  signal a             : unsigned(7 downto 0);
  signal b             : unsigned(7 downto 0);
  signal op            : opcode_t;
  signal y_expected    : std_logic_vector(7 downto 0);
  signal flags         : alu_flags_t;

  procedure check_eq(constant label_text : in string; constant got           : in unsigned; constant expected      : in unsigned; variable failed_io : inout boolean) is
  begin
    if got /= expected then
      failed_io := true;
      report "FAIL " & label_text severity error;
    end if;
  end procedure;

begin
  clk <= not clk after CLK_PERIOD / 2;

  dut : entity work.alu(rtl)
    port map (
      clk_i      => clk,
      rst_i      => rst,
      a_i        => std_logic_vector(a),
      b_i        => std_logic_vector(b),
      op_i       => op,
      y_o        => y_expected,
      flags_o    => flags
    );

  stimulus : process
    variable failed : boolean := false;
  begin
    -- Initialize inputs and hold reset
    a <= (others => '0');
    b <= (others => '0');
    op <= OP_ADD;
    rst <= '1';

    -- Hold reset for at least 2 full clock cycles to ensure DUT initialization
    wait for 20 ns;
    rst <= '0';

    -- Wait for reset to propagate and DUT outputs to become known
    wait until rising_edge(clk);
    wait for CLK_PERIOD;

    -- ADD: 1 + 2 = 3
    a <= to_unsigned(1, 8);
    b <= to_unsigned(2, 8);
    op <= OP_ADD;
    wait until rising_edge(clk);
    wait for CLK_PERIOD / 2;
    check_eq("ADD 1+2", unsigned(y_expected), to_unsigned(3, 8), failed);

    -- SUB: 5 - 3 = 2
    a <= to_unsigned(5, 8);
    b <= to_unsigned(3, 8);
    op <= OP_SUB;
    wait until rising_edge(clk);
    wait for CLK_PERIOD / 2;
    check_eq("SUB 5-3", unsigned(y_expected), to_unsigned(2, 8), failed);

    -- AND: FF & 0F = 0F
    a <= to_unsigned(255, 8);
    b <= to_unsigned(15, 8);
    op <= OP_AND;
    wait until rising_edge(clk);
    wait for CLK_PERIOD / 2;
    check_eq("AND FF&0F", unsigned(y_expected), to_unsigned(15, 8), failed);

    -- OR: 00 | 01 = 01
    a <= to_unsigned(0, 8);
    b <= to_unsigned(1, 8);
    op <= OP_OR;
    wait until rising_edge(clk);
    wait for CLK_PERIOD / 2;
    check_eq("OR 00|01", unsigned(y_expected), to_unsigned(1, 8), failed);

    -- XOR: FF ^ 01 = FE
    a <= to_unsigned(255, 8);
    b <= to_unsigned(1, 8);
    op <= OP_XOR;
    wait until rising_edge(clk);
    wait for CLK_PERIOD / 2;
    check_eq("XOR FF^01", unsigned(y_expected), to_unsigned(254, 8), failed);

    -- NOT: ~00 = FF
    a <= to_unsigned(0, 8);
    b <= (others => '0');
    op <= OP_NOT;
    wait until rising_edge(clk);
    wait for CLK_PERIOD / 2;
    check_eq("NOT 00", unsigned(y_expected), to_unsigned(255, 8), failed);

    -- SLL: 01 << 2 = 04
    a <= to_unsigned(1, 8);
    b <= to_unsigned(2, 8);
    op <= OP_SLL;
    wait until rising_edge(clk);
    wait for CLK_PERIOD / 2;
    check_eq("SLL 01<<2", unsigned(y_expected), to_unsigned(4, 8), failed);

    -- SRL: 08 >> 2 = 02
    a <= to_unsigned(8, 8);
    b <= to_unsigned(2, 8);
    op <= OP_SRL;
    wait until rising_edge(clk);
    wait for CLK_PERIOD / 2;
    check_eq("SRL 08>>2", unsigned(y_expected), to_unsigned(2, 8), failed);

    if failed then
      report "TEST FAILED" severity failure;
    else
      report "TEST PASSED" severity note;
      std.env.stop(0);
    end if;
  end process;
end architecture;
