library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_async_fifo is end entity;
architecture sim of tb_async_fifo is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal wr_clk : std_logic := '0'; signal rd_clk : std_logic := '0';
  signal we,re,full,af,empty,ae : std_logic := '0';
  signal wd,rd : std_logic_vector(7 downto 0) := (others=>'0');
begin
  wr_clk <= not wr_clk after 4 ns;
  rd_clk <= not rd_clk after 7 ns;
  dut : entity work.async_fifo generic map(DATA_WIDTH=>8,DEPTH=>8) port map(wr_clk=>wr_clk,wr_rst_n=>rst_n,wr_en=>we,wr_data=>wd,full=>full,almost_full=>af,rd_clk=>rd_clk,rd_rst_n=>rst_n,rd_en=>re,rd_data=>rd,empty=>empty,almost_empty=>ae);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';wait for 10 ns;wd<=x"A5";we<='1';wait for 8 ns;we<='0';wait for 70 ns;re<='1';wait for 14 ns;re<='0';wait for 20 ns;assert rd=x"A5" report "async FIFO mismatch" severity error;
    assert false report "PASS async_fifo" severity note;
    wait;
  end process;
end architecture;
