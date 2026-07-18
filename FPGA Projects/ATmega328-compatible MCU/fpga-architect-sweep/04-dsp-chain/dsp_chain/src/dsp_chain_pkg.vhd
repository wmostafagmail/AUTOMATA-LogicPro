library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package dsp_chain_pkg is
  constant DATA_WIDTH : integer := 16;
  constant COEFF_WIDTH : integer := 16;
  constant FILTER_TAP_COUNT : integer := 4;
  constant FFT_POINT_COUNT : integer := 4;

  type sample_array_t is array (natural range <>) of signed(COEFF_WIDTH-1 downto 0);
end package;