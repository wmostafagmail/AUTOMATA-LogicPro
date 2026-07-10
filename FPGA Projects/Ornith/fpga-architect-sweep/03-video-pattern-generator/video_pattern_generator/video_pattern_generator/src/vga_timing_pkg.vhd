-- ============================================================
-- Package: vga_timing_pkg
-- Purpose: Shared constants and types for VGA 640x480 @ 60 Hz.
-- Standard: VHDL-2008
-- ============================================================

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package vga_timing_pkg is

  constant CLK_FREQ_MHZ : natural := 25;
  constant CLK_PERIOD_NS : natural := 40;

  -- Horizontal (pixel) timing
  constant H_ACTIVE      : natural := 640;
  constant H_FRONT_PORCH : natural := 16;
  constant H_SYNC        : natural := 96;
  constant H_BACK_PORCH  : natural := 48;
  constant H_TOTAL       : natural := H_ACTIVE + H_FRONT_PORCH + H_SYNC + H_BACK_PORCH;

  -- Vertical (line) timing
  constant V_ACTIVE      : natural := 480;
  constant V_FRONT_PORCH : natural := 10;
  constant V_SYNC        : natural := 2;
  constant V_BACK_PORCH  : natural := 33;
  constant V_TOTAL       : natural := V_ACTIVE + V_FRONT_PORCH + V_SYNC + V_BACK_PORCH;

  subtype h_cnt_t is integer range 0 to H_TOTAL - 1;
  subtype v_cnt_t is integer range 0 to V_TOTAL - 1;

end package vga_timing_pkg;