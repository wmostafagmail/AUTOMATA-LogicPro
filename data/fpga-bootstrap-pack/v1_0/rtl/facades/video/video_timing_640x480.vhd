library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all;
entity video_timing_640x480 is port(pixel_clk_i,rst_ni,enable_i:in std_logic;x_o,y_o:out std_logic_vector(15 downto 0);hsync_o,vsync_o,de_o,frame_start_o:out std_logic);end entity;
architecture rtl of video_timing_640x480 is begin
 u_core:entity work.vga_timing_generator generic map(H_WIDTH=>16,V_WIDTH=>16) port map(pixel_clk=>pixel_clk_i,rst_n=>rst_ni,enable=>enable_i,
 h_active=>std_logic_vector(to_unsigned(640,16)),h_front=>std_logic_vector(to_unsigned(16,16)),h_sync=>std_logic_vector(to_unsigned(96,16)),h_back=>std_logic_vector(to_unsigned(48,16)),
 v_active=>std_logic_vector(to_unsigned(480,16)),v_front=>std_logic_vector(to_unsigned(10,16)),v_sync=>std_logic_vector(to_unsigned(2,16)),v_back=>std_logic_vector(to_unsigned(33,16)),
 x=>x_o,y=>y_o,hsync_out=>hsync_o,vsync_out=>vsync_o,data_enable=>de_o,frame_start=>frame_start_o);
end architecture;
