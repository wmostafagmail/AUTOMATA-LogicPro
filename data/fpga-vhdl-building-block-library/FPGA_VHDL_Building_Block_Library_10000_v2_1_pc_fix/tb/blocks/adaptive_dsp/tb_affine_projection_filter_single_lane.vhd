library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_affine_projection_filter_single_lane is end entity;
architecture sim of tb_affine_projection_filter_single_lane is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal sv,sr,mv,ml : std_logic := '0';
  signal sd,md : std_logic_vector(7 downto 0) := (others=>'0');
begin
  clk <= not clk after 5 ns;
  dut : entity work.affine_projection_filter_single_lane generic map(DATA_WIDTH=>8) port map(clk=>clk,rst_n=>rst_n,s_data=>sd,s_valid=>sv,s_ready=>sr,s_last=>'1',m_data=>md,m_valid=>mv,m_ready=>'1',m_last=>ml);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';sd<=x"3C";sv<='1';wait for 10 ns;sv<='0';wait for 5 ns;assert mv='1' report "stream output valid missing" severity error;assert ml='1' report "stream last missing" severity error;
    assert false report "PASS affine_projection_filter_single_lane" severity note;
    wait;
  end process;
end architecture;
