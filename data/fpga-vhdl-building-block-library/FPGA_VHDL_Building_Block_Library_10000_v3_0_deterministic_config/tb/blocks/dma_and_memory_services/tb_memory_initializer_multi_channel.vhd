library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_memory_initializer_multi_channel is end entity;
architecture sim of tb_memory_initializer_multi_channel is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal we,re,rv : std_logic := '0';
  signal wa,ra : std_logic_vector(3 downto 0) := (others=>'0');
  signal wd,rd : std_logic_vector(7 downto 0) := (others=>'0');
begin
  clk <= not clk after 5 ns;
  dut : entity work.memory_initializer_multi_channel generic map(DATA_WIDTH=>8,DEPTH=>16) port map(clk=>clk,rst_n=>rst_n,wr_en=>we,wr_addr=>wa,wr_data=>wd,rd_en=>re,rd_addr=>ra,rd_data=>rd,rd_valid=>rv);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';wa<=x"2";wd<=x"C3";we<='1';wait for 10 ns;we<='0';ra<=x"2";re<='1';wait for 10 ns;re<='0';wait for 10 ns;assert rd=x"C3" report "RAM mismatch" severity error;
    assert false report "PASS memory_initializer_multi_channel" severity note;
    wait;
  end process;
end architecture;
