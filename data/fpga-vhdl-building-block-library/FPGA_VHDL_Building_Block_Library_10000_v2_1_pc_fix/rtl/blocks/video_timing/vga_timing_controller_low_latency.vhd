-- Auto-generated from FPGA Building Block Catalog BB-0464
-- Block: vga_timing_controller_low_latency
-- Category: Video Timing / Display timing and frame transport
-- Implementation tier: A
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: application-specific; reference model required
library ieee; use ieee.std_logic_1164.all;
entity vga_timing_controller_low_latency is generic(H_WIDTH:positive:=16;V_WIDTH:positive:=16);
 port(pixel_clk,rst_n,enable:in std_logic; h_active,h_front,h_sync,h_back:in std_logic_vector(H_WIDTH-1 downto 0);
      v_active,v_front,v_sync,v_back:in std_logic_vector(V_WIDTH-1 downto 0); x:out std_logic_vector(H_WIDTH-1 downto 0); y:out std_logic_vector(V_WIDTH-1 downto 0);
      hsync_out,vsync_out,data_enable,frame_start:out std_logic); end entity;
architecture rtl of vga_timing_controller_low_latency is begin
 u_core:entity work.bb_video_timing_core generic map(H_WIDTH=>H_WIDTH,V_WIDTH=>V_WIDTH)
 port map(pixel_clk=>pixel_clk,rst_n=>rst_n,enable=>enable,h_active=>h_active,h_front=>h_front,h_sync=>h_sync,h_back=>h_back,
          v_active=>v_active,v_front=>v_front,v_sync=>v_sync,v_back=>v_back,x=>x,y=>y,hsync_out=>hsync_out,vsync_out=>vsync_out,data_enable=>data_enable,frame_start=>frame_start);
end architecture;
