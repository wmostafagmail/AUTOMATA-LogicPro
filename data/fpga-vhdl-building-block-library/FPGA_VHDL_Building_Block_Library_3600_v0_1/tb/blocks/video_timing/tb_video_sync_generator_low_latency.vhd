library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_video_sync_generator_low_latency is end entity;
architecture sim of tb_video_sync_generator_low_latency is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal vx,vy : std_logic_vector(7 downto 0);
  signal hs,vs,de,fs : std_logic;
begin
  clk <= not clk after 5 ns;
  dut : entity work.video_sync_generator_low_latency generic map(H_WIDTH=>8,V_WIDTH=>8) port map(pixel_clk=>clk,rst_n=>rst_n,enable=>'1',h_active=>x"04",h_front=>x"01",h_sync=>x"01",h_back=>x"01",v_active=>x"03",v_front=>x"01",v_sync=>x"01",v_back=>x"01",x=>vx,y=>vy,hsync_out=>hs,vsync_out=>vs,data_enable=>de,frame_start=>fs);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';wait for 50 ns;assert unsigned(vx)>0 or unsigned(vy)>0 report "video counters did not advance" severity error;
    assert false report "PASS video_sync_generator_low_latency" severity note;
    wait;
  end process;
end architecture;
