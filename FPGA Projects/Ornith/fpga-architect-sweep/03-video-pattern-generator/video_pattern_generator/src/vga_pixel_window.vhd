-- ============================================================
-- Entity: vga_pixel_window
-- Purpose: Produce pixel_x_o, pixel_y_o, and pix_en_o for the
--          active-video region of VGA 640x480 @ 60 Hz.
-- Standard: VHDL-2008
-- ============================================================

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

use work.vga_timing_pkg.all;

entity vga_pixel_window is
  port (
    clk_i     : in  std_logic;
    rst_ni    : in  std_logic;
    active_i  : in  std_logic;
    h_cnt_i   : in  h_cnt_t;
    v_cnt_i   : in  v_cnt_t;
    pix_x_o   : out natural range 0 to H_ACTIVE - 1;
    pix_y_o   : out natural range 0 to V_ACTIVE - 1;
    pix_en_o  : out std_logic
  );
end entity vga_pixel_window;

architecture rtl of vga_pixel_window is

  signal px_s  : integer range 0 to H_ACTIVE - 1 := 0;
  signal py_s  : integer range 0 to V_ACTIVE - 1 := 0;
  signal en_s  : std_logic := '0';

begin

  process(clk_i)
    variable v_px : integer range 0 to H_ACTIVE - 1;
    variable v_py : integer range 0 to V_ACTIVE - 1;
    variable v_en : std_logic;
  begin
    if rising_edge(clk_i) then
      if rst_ni = '0' then
        v_px := 0;
        v_py := 0;
        v_en := '0';
      elsif active_i = '1' then
        -- Update Y only at the start of each new line inside active video.
        if h_cnt_i = H_ACTIVE - 1 then
          v_py := v_py + 1;
        end if;

        -- X always advances while in active video.
        v_px := v_px + 1;

        -- Clamp X at the right edge of active video.
        if v_px > H_ACTIVE - 1 then
          v_px := H_ACTIVE - 1;
        end if;

        -- Clamp Y at the bottom edge of active video.
        if v_py > V_ACTIVE - 1 then
          v_py := V_ACTIVE - 1;
        end if;

        v_en := '1';
      else
        v_px := 0;
        v_py := 0;
        v_en := '0';
      end if;

      px_s <= v_px;
      py_s <= v_py;
      en_s <= v_en;
    end if;
  end process;

  pix_x_o <= px_s;
  pix_y_o <= py_s;
  pix_en_o<= en_s;

end architecture rtl;