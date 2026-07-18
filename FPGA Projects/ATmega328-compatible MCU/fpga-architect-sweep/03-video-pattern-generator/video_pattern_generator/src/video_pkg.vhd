library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package video_pkg is
  constant H_ACTIVE_PIXELS : integer := 64;
  constant H_BLANK_PIXELS   : integer := 16;
  constant V_ACTIVE_LINES   : integer := 48;
  constant V_BLANK_LINES    : integer := 8;

  subtype pixel_t is unsigned(7 downto 0);
  subtype h_cnt_t is unsigned(6 downto 0);
  subtype v_cnt_t is unsigned(5 downto 0);

  function generate_pattern(addr : unsigned(10 downto 0)) return pixel_t;
end package;

package body video_pkg is
  function generate_pattern(addr : unsigned(10 downto 0)) return pixel_t is
    variable val : pixel_t;
  begin
    if addr(0) = '1' then
      val := to_unsigned(16#AA#, pixel_t'length);
    else
      val := to_unsigned(16#55#, pixel_t'length);
    end if;
    return val;
  end function;
end package body;
