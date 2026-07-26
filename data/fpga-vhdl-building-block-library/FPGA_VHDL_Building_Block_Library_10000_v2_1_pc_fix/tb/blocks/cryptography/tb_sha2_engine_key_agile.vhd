library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_sha2_engine_key_agile is end entity;
architecture sim of tb_sha2_engine_key_agile is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal iv,ir,ov,fault : std_logic := '0';
  signal di,key,data_o : std_logic_vector(127 downto 0) := (others=>'0');
begin
  clk <= not clk after 5 ns;
  dut : entity work.sha2_engine_key_agile port map(clk=>clk,rst_n=>rst_n,data_in=>di,key_in=>key,in_valid=>iv,in_ready=>ir,data_out=>data_o,out_valid=>ov,out_ready=>'1',fault=>fault);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';di<=(others=>'1');key<=(others=>'1');iv<='1';wait for 10 ns;iv<='0';wait for 5 ns;assert ov='1' and data_o=(data_o'range=>'0') report "crypto shell contract failed" severity error;
    assert false report "PASS sha2_engine_key_agile" severity note;
    wait;
  end process;
end architecture;
