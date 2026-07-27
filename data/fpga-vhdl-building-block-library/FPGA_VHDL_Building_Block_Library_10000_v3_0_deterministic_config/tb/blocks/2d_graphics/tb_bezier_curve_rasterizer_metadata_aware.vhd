library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_bezier_curve_rasterizer_metadata_aware is end entity;
architecture sim of tb_bezier_curve_rasterizer_metadata_aware is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal iv,ir,ov : std_logic := '0';
  signal si,so : std_logic_vector(23 downto 0) := (others=>'0');
begin
  clk <= not clk after 5 ns;
  dut : entity work.bezier_curve_rasterizer_metadata_aware port map(clk=>clk,rst_n=>rst_n,sample_in=>si,in_valid=>iv,in_ready=>ir,sample_out=>so,out_valid=>ov,out_ready=>'1');
  stim : process
  begin
    wait for 20 ns;rst_n<='1';si<=x"123456";iv<='1';wait for 10 ns;iv<='0';wait for 5 ns;assert ov='1' severity error;
    assert false report "PASS bezier_curve_rasterizer_metadata_aware" severity note;
    wait;
  end process;
end architecture;
