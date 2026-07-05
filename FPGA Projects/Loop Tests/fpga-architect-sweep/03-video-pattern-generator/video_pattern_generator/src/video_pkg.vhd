library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package video_pkg is
  constant H_TOTAL    : integer := 800;
  constant H_ACTIVE   : integer := 640;
  constant H_FRONT    : integer := 16;
  constant H_SYNC     : integer := 96;
  constant H_BACK     : integer := 48;
  
  constant V_TOTAL    : integer := 525;
  constant V_ACTIVE   : integer := 480;
  constant V_FRONT    : integer := 10;
  constant V_SYNC     : integer := 2;
  constant V_BACK     : integer := 13;
  
  subtype pixel_t is std_logic_vector(15 downto 0);
end package video_pkg;

package body video_pkg is
end package body video_pkg;