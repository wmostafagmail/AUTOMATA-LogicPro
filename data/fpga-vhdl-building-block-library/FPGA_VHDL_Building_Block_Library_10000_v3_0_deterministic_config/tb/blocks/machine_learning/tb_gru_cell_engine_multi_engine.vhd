library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_gru_cell_engine_multi_engine is end entity;
architecture sim of tb_gru_cell_engine_multi_engine is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal iv,ir,ov : std_logic := '0';
  signal va,vb : std_logic_vector(31 downto 0) := (others=>'0');
  signal vr : std_logic_vector(31 downto 0);
begin
  clk <= not clk after 5 ns;
  dut : entity work.gru_cell_engine_multi_engine generic map(ELEM_WIDTH=>8,LANES=>4,ACC_WIDTH=>32) port map(clk=>clk,rst_n=>rst_n,vector_a=>va,vector_b=>vb,in_valid=>iv,in_ready=>ir,result=>vr,out_valid=>ov,out_ready=>'1');
  stim : process
  begin
    wait for 20 ns;rst_n<='1';va<=x"01020304";vb<=x"01010101";iv<='1';wait for 10 ns;iv<='0';wait for 5 ns;assert ov='1' report "vector valid missing" severity error;
    assert false report "PASS gru_cell_engine_multi_engine" severity note;
    wait;
  end process;
end architecture;
