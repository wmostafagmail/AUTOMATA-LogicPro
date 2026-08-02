library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity tb_lab_counter is
end entity tb_lab_counter;

architecture sim of tb_lab_counter is
  constant WIDTH : positive := 8;
  signal clk : std_logic := '0';
  signal rst : std_logic := '0';
  signal enable_i : std_logic := '0';
  signal count_o : unsigned(WIDTH-1 downto 0) := (others => '0');
begin
  clk_gen : process
  begin
    clk <= '0';
    wait for 5 ns;
    clk <= '1';
    wait for 5 ns;
  end process;

  dut : entity work.lab_counter
    generic map (
      WIDTH => 8
    )
    port map (
      clk => clk,
      rst => rst,
      enable_i => enable_i,
      count_o => count_o
    );

  stimulus : process
  begin
    rst <= '1';
    wait for 20 ns;
    rst <= '0';
    enable_i <= '0';
    wait for 80 ns;
    report "PASS" severity note;
    wait;
  end process;
end architecture sim;
