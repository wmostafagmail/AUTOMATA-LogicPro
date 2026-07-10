-- ============================================================
-- Entity: top_video_gen
-- Purpose: Integrate VGA timing, active-video window, and
--          pattern generation into one top-level video output.
-- Standard: VHDL-2008
-- ============================================================

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

use work.vga_timing_pkg.all;

entity top_video_gen is
  port (
    clk_i     : in  std_logic;
    rst_ni    : in  std_logic;

    hs_o      : out std_logic;
    vs_o      : out std_logic;
    pix_en_o  : out std_logic;
    r_o       : out unsigned(7 downto 0);
    g_o       : out unsigned(7 downto 0);
    b_o       : out unsigned(7 downto 0)
  );
end entity top_video_gen;

architecture rtl of top_video_gen is

  -- Internal timing signals.
  signal h_cnt_s   : h_cnt_t := 0;
  signal v_cnt_s   : v_cnt_t := 0;
  signal hs_s      : std_logic := '0';
  signal vs_s      : std_logic := '0';
  signal active_s  : std_logic := '0';

  -- Pixel window signals.
  signal pix_x_s   : natural range 0 to H_ACTIVE - 1 := 0;
  signal pix_y_s   : natural range 0 to V_ACTIVE - 1 := 0;
  signal pix_en_i  : std_logic := '0';

  -- Pattern generator outputs (internal mirror).
  signal r_int     : unsigned(7 downto 0) := (others => '0');
  signal g_int     : unsigned(7 downto 0) := (others => '0');
  signal b_int     : unsigned(7 downto 0) := (others => '0');

begin

  -- Timing generator instance.
  u_timing : entity work.vga_timing_gen(rtl)
    port map (
      clk_i    => clk_i,
      rst_ni   => rst_ni,
      h_cnt_o  => h_cnt_s,
      v_cnt_o  => v_cnt_s,
      hs_o     => hs_s,
      vs_o     => vs_s,
      active_o => active_s
    );

  -- Pixel window instance.
  u_window : entity work.vga_pixel_window(rtl)
    port map (
      clk_i   => clk_i,
      rst_ni  => rst_ni,
      active_i=> active_s,
      h_cnt_i => h_cnt_s,
      v_cnt_i => v_cnt_s,
      pix_x_o => pix_x_s,
      pix_y_o => pix_y_s,
      pix_en_o=> pix_en_i
    );

  -- Pattern generator instance.
  u_pattern : entity work.video_pattern_gen(rtl)
    port map (
      pix_en_i=> pix_en_i,
      pix_x_i => pix_x_s,
      pix_y_i => pix_y_s,
      r_o     => r_int,
      g_o     => g_int,
      b_o     => b_int
    );

  -- Drive ports from internal mirrors (no output-port readback).
  hs_o   <= hs_s;
  vs_o   <= vs_s;
  pix_en_o<= pix_en_i;
  r_o    <= r_int;
  g_o    <= g_int;
  b_o    <= b_int;

end architecture rtl;