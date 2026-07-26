library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_key_wrap_engine_high_throughput is end entity;
architecture sim of tb_key_wrap_engine_high_throughput is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal iv,ir,ov,fault : std_logic := '0';
  signal di,key,data_o : std_logic_vector(127 downto 0) := (others=>'0');
begin
  clk <= not clk after 5 ns;
  dut : entity work.key_wrap_engine_high_throughput port map(clk=>clk,rst_n=>rst_n,data_in=>di,key_in=>key,in_valid=>iv,in_ready=>ir,data_out=>data_o,out_valid=>ov,out_ready=>'1',fault=>fault);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';di<=(others=>'1');key<=(others=>'1');iv<='1';wait for 10 ns;iv<='0';wait for 5 ns;assert ov='1' and data_o=(data_o'range=>'0') report "crypto shell contract failed" severity error;
    assert false report "PASS key_wrap_engine_high_throughput" severity note;
    wait;
  end process;
end architecture;
