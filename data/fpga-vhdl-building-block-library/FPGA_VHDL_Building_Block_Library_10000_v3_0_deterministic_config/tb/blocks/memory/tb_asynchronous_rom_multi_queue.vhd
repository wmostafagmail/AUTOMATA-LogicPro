library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_asynchronous_rom_multi_queue is end entity;
architecture sim of tb_asynchronous_rom_multi_queue is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal we,re,full,af,empty,ae : std_logic := '0';
  signal wd,rd : std_logic_vector(7 downto 0) := (others=>'0');
  signal level : std_logic_vector(clog2(5)-1 downto 0);
begin
  clk <= not clk after 5 ns;
  dut : entity work.asynchronous_rom_multi_queue generic map(DATA_WIDTH=>8,DEPTH=>4) port map(clk=>clk,rst_n=>rst_n,wr_en=>we,wr_data=>wd,full=>full,almost_full=>af,rd_en=>re,rd_data=>rd,empty=>empty,almost_empty=>ae,level=>level);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';wd<=x"5A";we<='1';wait for 10 ns;we<='0';re<='1';wait for 10 ns;re<='0';wait for 10 ns;assert rd=x"5A" report "FIFO mismatch" severity error;
    assert false report "PASS asynchronous_rom_multi_queue" severity note;
    wait;
  end process;
end architecture;
