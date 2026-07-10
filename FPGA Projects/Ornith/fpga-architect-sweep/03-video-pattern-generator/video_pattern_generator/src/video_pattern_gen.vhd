-- ============================================================
-- Entity: video_pattern_gen
-- Purpose: Produce an 8-bit RGB color from the active-video
--          pixel coordinate (pixel_x, pixel_y). Pattern is a
--          diagonal gradient that is easy to verify visually
--          and in simulation via sampled pixels.
-- Standard: VHDL-2008
-- ============================================================

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity video_pattern_gen is
  port (
    pix_en_i : in  std_logic;
    pix_x_i  : in  natural range 0 to 639;
    pix_y_i  : in  natural range 0 to 479;
    r_o      : out unsigned(7 downto 0);
    g_o      : out unsigned(7 downto 0);
    b_o      : out unsigned(7 downto 0)
  );
end entity video_pattern_gen;

architecture rtl of video_pattern_gen is

  signal r_s : unsigned(7 downto 0) := (others => '0');
  signal g_s : unsigned(7 downto 0) := (others => '0');
  signal b_s : unsigned(7 downto 0) := (others => '0');

begin

  process(pix_en_i, pix_x_i, pix_y_i)
    variable v_r     : unsigned(7 downto 0);
    variable v_g     : unsigned(7 downto 0);
    variable v_b     : unsigned(7 downto 0);
    variable v_x_u   : unsigned(9 downto 0);
    variable v_y_u   : unsigned(8 downto 0);
  begin
    if pix_en_i = '1' then

      -- Normalize integer pixel coordinates to typed vectors.
      -- pix_x_i / pix_y_i are natural (integer) values, so use
      -- to_unsigned instead of the illegal unsigned() cast.
      v_x_u := to_unsigned(pix_x_i, 10);
      v_y_u := to_unsigned(pix_y_i, 9);

      -- Horizontal stripe: R increases with x (low 8 bits).
      v_r := to_unsigned(pix_x_i mod 256, 8);

      -- Vertical stripe: G increases with y (low 8 bits).
      v_g := to_unsigned(pix_y_i mod 256, 8);

      -- Diagonal mix: B depends on the MSB of each coordinate.
      if v_x_u(7) /= v_y_u(7) then
        v_b := to_unsigned(200, 8);
      else
        v_b := to_unsigned(40, 8);
      end if;

    else
      v_r := (others => '0');
      v_g := (others => '0');
      v_b := (others => '0');
    end if;

    r_s <= v_r;
    g_s <= v_g;
    b_s <= v_b;
  end process;

  r_o <= r_s;
  g_o <= g_s;
  b_o <= b_s;

end architecture rtl;
