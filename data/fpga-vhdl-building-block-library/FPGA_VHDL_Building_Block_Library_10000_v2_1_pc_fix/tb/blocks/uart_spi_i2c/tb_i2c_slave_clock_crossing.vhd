library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_i2c_slave_clock_crossing is end entity;
architecture sim of tb_i2c_slave_clock_crossing is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal ai,so : std_logic_vector(0 downto 0) := (others=>'0');
begin
  clk <= not clk after 5 ns;
  dut : entity work.i2c_slave_clock_crossing port map(dst_clk=>clk,dst_rst_n=>rst_n,async_in=>ai,sync_out=>so);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';ai(0)<='1';wait for 30 ns;assert so(0)='1' report "CDC synchronizer failed" severity error;
    assert false report "PASS i2c_slave_clock_crossing" severity note;
    wait;
  end process;
end architecture;
