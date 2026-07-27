library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_debounce_filter is end entity;
architecture sim of tb_debounce_filter is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal noisy,clean,rp,fp : std_logic := '0';
begin
  clk <= not clk after 5 ns;
  dut : entity work.debounce_filter generic map(STABLE_CYCLES=>3) port map(clk=>clk,rst_n=>rst_n,noisy_in=>noisy,clean_out=>clean,rise_pulse=>rp,fall_pulse=>fp);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';noisy<='1';wait for 40 ns;assert clean='1' report "debounce failed" severity error;
    assert false report "PASS debounce_filter" severity note;
    wait;
  end process;
end architecture;
