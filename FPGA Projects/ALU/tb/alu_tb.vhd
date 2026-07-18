library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;
use std.env.all;

entity tb_alu is
end entity tb_alu;

architecture sim of tb_alu is
  signal clk : std_logic := '0';
  signal rst : std_logic := '1';
  signal op     : alu_op_t := OP_ADD;
  signal a      : std_logic_vector(7 downto 0) := (others => '0');
  signal b      : std_logic_vector(7 downto 0) := (others => '0');
  signal result_slv : std_logic_vector(7 downto 0);
  signal got_u        : unsigned(7 downto 0);
  signal flags        : alu_flags_t;

  procedure check_result(
    constant label_text : in string;
    constant got_result : in unsigned;
    constant exp_result : in unsigned;
    constant got_flags  : in alu_flags_t;
    variable failed_io  : inout boolean
  ) is
  begin
    if got_result /= exp_result or got_flags /= (zero => '0', carry_out => '0', overflow => '0') then
      failed_io := true;
      report "FAIL " & label_text severity error;
    end if;
  end procedure;

begin
  got_u <= unsigned(result_slv);

  clk <= not clk after 5 ns;

  dut : entity work.alu(rtl)
    port map (
      clk        => clk,
      rst        => rst,
      op         => op,
      a          => a,
      b          => b,
      result     => result_slv,
      flags      => flags
    );

  stimulus : process
    variable failed : boolean := false;
  begin
    wait for 20 ns;
    rst <= '0';
    wait until rising_edge(clk);
    wait for 1 ns;

    op <= OP_ADD;
    a  <= std_logic_vector(to_unsigned(1, 8));
    b  <= std_logic_vector(to_unsigned(2, 8));
    wait until rising_edge(clk); wait for 1 ns;
    check_result("ADD 1+2", got_u, to_unsigned(3, 8), flags, failed);

    op <= OP_SUB;
    a  <= std_logic_vector(to_unsigned(5, 8));
    b  <= std_logic_vector(to_unsigned(2, 8));
    wait until rising_edge(clk); wait for 1 ns;
    check_result("SUB 5-2", got_u, to_unsigned(3, 8), flags, failed);

    op <= OP_AND;
    a  <= x"FF";
    b  <= x"0F";
    wait until rising_edge(clk); wait for 1 ns;
    check_result("AND FF&0F", got_u, to_unsigned(15, 8), flags, failed);

    op <= OP_OR;
    a  <= x"01";
    b  <= x"02";
    wait until rising_edge(clk); wait for 1 ns;
    check_result("OR 01|02", got_u, to_unsigned(3, 8), flags, failed);

    op <= OP_XOR;
    a  <= x"AA";
    b  <= x"55";
    wait until rising_edge(clk); wait for 1 ns;
    check_result("XOR AA^55", got_u, to_unsigned(255, 8), flags, failed);

    op <= OP_NOT;
    a  <= x"00";
    b  <= x"00";
    wait until rising_edge(clk); wait for 1 ns;
    check_result("NOT 00", got_u, to_unsigned(255, 8), flags, failed);

    if failed then
      report "TEST FAILED" severity failure;
    else
      report "TEST PASSED" severity note;
      std.env.stop(0);
    end if;
  end process;
end architecture sim;
