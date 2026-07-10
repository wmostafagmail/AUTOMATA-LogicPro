library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package dsp_chain_pkg is
  constant NUM_FIR_TAPS : positive := 3;
  constant SAMPLE_WIDTH : positive := 16;
  constant PROD_WIDTH   : positive := 20;

  subtype sample_t     is signed(SAMPLE_WIDTH - 1 downto 0);
  subtype prod_acc_t   is signed(PROD_WIDTH - 1 downto 0);

  type coeff_array_t is array (0 to NUM_FIR_TAPS - 1) of signed(7 downto 0);

  function get_fir_coeffs return coeff_array_t;
end package dsp_chain_pkg;

package body dsp_chain_pkg is
  function get_fir_coeffs return coeff_array_t is
    variable coeffs_arr : coeff_array_t;
  begin
    coeffs_arr(0) := to_signed(-1, 8);
    coeffs_arr(1) := to_signed(4, 8);
    coeffs_arr(2) := to_signed(-1, 8);
    return coeffs_arr;
  end function get_fir_coeffs;
end package body dsp_chain_pkg;