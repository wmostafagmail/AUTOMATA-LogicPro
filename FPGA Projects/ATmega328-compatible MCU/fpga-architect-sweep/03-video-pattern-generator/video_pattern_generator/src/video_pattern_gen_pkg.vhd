library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package video_pattern_gen_pkg is

    -- Timing parameters for VGA 640x480 @ 60Hz (approx 25.175 MHz pixel clock)
    constant H_ACTIVE       : integer := 640;
    constant H_SYNC         : integer := 96;
    constant H_FRONT_PORCH  : integer := 16;
    constant H_BACK_PORCH   : integer := 48;
    constant H_TOTAL        : integer := H_ACTIVE + H_SYNC + H_FRONT_PORCH + H_BACK_PORCH;

    constant V_ACTIVE       : integer := 480;
    constant V_SYNC         : integer := 2;
    constant V_FRONT_PORCH  : integer := 10;
    constant V_BACK_PORCH   : integer := 33;
    constant V_TOTAL        : integer := V_ACTIVE + V_SYNC + V_FRONT_PORCH + V_BACK_PORCH;

    -- Derived widths
    constant H_COUNTER_WIDTH : integer := 10;
    constant V_COUNTER_WIDTH : integer := 9;

    -- Pixel data width
    constant PIXEL_DATA_WIDTH : integer := 8;

    type pixel_t is record
        red   : std_logic_vector(7 downto 0);
        green : std_logic_vector(7 downto 0);
        blue  : std_logic_vector(7 downto 0);
    end record pixel_t;

end package video_pattern_gen_pkg;

package body video_pattern_gen_pkg is

end package body video_pattern_gen_pkg;