-- Deterministic generated wrapper. Do not edit manually.
-- Source block: vga_timing_controller_line_buffered
-- Configuration ID: VGA_TIMING_CONTROLLER_LINE_BUFFERED_34DC7A763B6BD0B0
-- Source: rtl/blocks/video_timing/vga_timing_controller_line_buffered.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity vga_timing_controller_line_buffered_det_cfg is
  generic (
    H_WIDTH : positive := 16;
    V_WIDTH : positive := 16;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "VGA_TIMING_CONTROLLER_LINE_BUFFERED_34DC7A763B6BD0B0"
  );
  port (
    pixel_clk : in std_logic;
    rst_n : in std_logic;
    enable : in std_logic;
    h_active : in std_logic_vector(H_WIDTH-1 downto 0);
    h_front : in std_logic_vector(H_WIDTH-1 downto 0);
    h_sync : in std_logic_vector(H_WIDTH-1 downto 0);
    h_back : in std_logic_vector(H_WIDTH-1 downto 0);
    v_active : in std_logic_vector(V_WIDTH-1 downto 0);
    v_front : in std_logic_vector(V_WIDTH-1 downto 0);
    v_sync : in std_logic_vector(V_WIDTH-1 downto 0);
    v_back : in std_logic_vector(V_WIDTH-1 downto 0);
    x : out std_logic_vector(H_WIDTH-1 downto 0);
    y : out std_logic_vector(V_WIDTH-1 downto 0);
    hsync_out : out std_logic;
    vsync_out : out std_logic;
    data_enable : out std_logic;
    frame_start : out std_logic
  );
end entity;

architecture deterministic_wrapper of vga_timing_controller_line_buffered_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert H_WIDTH = 16 report "Locked deterministic configuration mismatch: H_WIDTH" severity failure;
  assert V_WIDTH = 16 report "Locked deterministic configuration mismatch: V_WIDTH" severity failure;

  u_block : entity work.vga_timing_controller_line_buffered
    generic map (
      H_WIDTH => H_WIDTH,
      V_WIDTH => V_WIDTH
    )
    port map (
      pixel_clk => pixel_clk,
      rst_n => rst_n,
      enable => enable,
      h_active => h_active,
      h_front => h_front,
      h_sync => h_sync,
      h_back => h_back,
      v_active => v_active,
      v_front => v_front,
      v_sync => v_sync,
      v_back => v_back,
      x => x,
      y => y,
      hsync_out => hsync_out,
      vsync_out => vsync_out,
      data_enable => data_enable,
      frame_start => frame_start
    );
end architecture;
