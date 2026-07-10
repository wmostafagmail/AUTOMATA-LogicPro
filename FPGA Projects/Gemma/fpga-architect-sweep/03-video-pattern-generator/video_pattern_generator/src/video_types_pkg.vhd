library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package video_types_pkg is
    -- Standard VGA 640x480 @ 60Hz Timings (Pixels)
    constant H_ACTIVE   : integer := 640;
    constant H_FRONT    : integer := 16;
    constant H_SYNC     : integer := 96;
    constant H_BACK     : integer := 48;
    constant H_TOTAL    : integer := 800;

    constant V_ACTIVE   : integer := 480;
    constant V_FRONT    : integer := 10;
    constant V_SYNC     : integer := 2;
    constant V_BACK     : integer := 33;
    constant V_TOTAL    : integer := 525;

    type rgb_pixel_t is record
        r : unsigned(7 downto 0);
        g : unsigned(7 downto 0);
        b : unsigned(7 downto 0);
    end record;

end package video_types_pkg;