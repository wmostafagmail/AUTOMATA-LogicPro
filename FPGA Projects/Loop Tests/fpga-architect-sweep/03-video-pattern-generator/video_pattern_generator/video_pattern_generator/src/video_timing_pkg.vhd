library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package video_timing_pkg is
  constant H_TOTAL       : integer := 800;
  constant H_SYNC_START : integer := 128;
  constant H_SYNC_END    : integer := 232;
  constant H_VALID_END   : integer := 639;

  constant V_TOTAL       : integer := 525;
  constant V_SYNC_START : integer := 35;
  constant V_SYNC_END    : integer := 345;
  constant V_VALID_END   : integer := 479;
end package video_timing_pkg;