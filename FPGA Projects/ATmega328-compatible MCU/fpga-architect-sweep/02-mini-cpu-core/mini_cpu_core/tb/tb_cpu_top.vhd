library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;
use work.cpu_pkg.all;

entity tb_cpu_top is
end entity;

architecture sim of tb_cpu_top is
  signal clk : std_logic := '0';
  signal rst : std_logic := '1';
  signal halt_o : std_logic;

  procedure check_eq(
    constant label_text : in string;
    constant got         : in std_logic_vector;
    constant expected    : in std_logic_vector;
    variable failed_io   : inout boolean
  ) is
  begin
    if got /= expected then
      failed_io := true;
      report "FAIL " & label_text severity error;
    end if;
  end procedure check_eq;

begin
  clk <= not clk after 5 ns;

  dut : entity work.cpu_top
    port map (
      clk    => clk,
      rst    => rst,
      halt_o => halt_o
    );

  stimulus : process
    variable failed : boolean := false;
  begin
    rst <= '1';
    wait for 20 ns;
    rst <= '0';
    wait until rising_edge(clk);

    wait until halt_o = '1';
    wait for 10 ns;

    if halt_o = '1' then
      report "HALT reached" severity note;
    else
      failed := true;
      report "HALT not reached" severity error;
    end if;

    if failed then
      report "TEST FAILED" severity failure;
    else
      report "TEST PASSED" severity note;
      std.env.stop(0);
    end if;
  end process;
end architecture;
