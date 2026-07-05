library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package timing_pkg is
    constant H_TOTAL_C : integer := 800;
    constant H_SYNC_C  : integer := 96;
    constant H_BACK_C  : integer := 48;
    constant H_ACTIVE_C: integer := 640;
    constant V_TOTAL_C : integer := 525;
    constant V_SYNC_C  : integer := 2;
    constant V_BACK_C  : integer := 33;
    constant V_ACTIVE_C: integer := 480;
end package timing_pkg;