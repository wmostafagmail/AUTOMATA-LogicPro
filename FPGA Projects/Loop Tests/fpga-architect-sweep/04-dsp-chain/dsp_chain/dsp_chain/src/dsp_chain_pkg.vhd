library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package dsp_chain_pkg is
  constant SAMPLE_WIDTH : integer := 16;
  subtype sample_t is signed(SAMPLE_WIDTH - 1 downto 0);
  constant FIR_TAPS : integer := 4;
  type coeff_array_t is array (0 to FIR_TAPS - 1) of sample_t;
  constant COEFFS : coeff_array_t := (
    to_signed(1, SAMPLE_WIDTH),
    to_signed(2, SAMPLE_WIDTH),
    to_signed(2, SAMPLE_WIDTH),
    to_signed(1, SAMPLE_WIDTH)
  );
end package dsp_chain_pkg;