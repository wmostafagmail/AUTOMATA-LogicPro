library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package bridge_pkg is
    constant FIFO_DEPTH_C : natural := 16;
    subtype byte_t is unsigned(7 downto 0);
end package bridge_pkg;
