library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_line_counter_low_latency is end entity;
architecture sim of tb_line_counter_low_latency is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal count : std_logic_vector(31 downto 0);
  signal tc, ov : std_logic;
begin
  clk <= not clk after 5 ns;
  dut : entity work.line_counter_low_latency generic map(MODULUS=>8) port map(clk=>clk,rst_n=>rst_n,enable=>'1',load=>'0',clear=>'0',load_value=>(others=>'0'),count=>count,terminal_count=>tc,overflow=>ov);
  stim : process
  begin
    wait for 20 ns; rst_n<='1';
    wait for 45 ns; assert unsigned(count)>0 report "counter did not advance" severity error;
    assert false report "PASS line_counter_low_latency" severity note;
    wait;
  end process;
end architecture;
