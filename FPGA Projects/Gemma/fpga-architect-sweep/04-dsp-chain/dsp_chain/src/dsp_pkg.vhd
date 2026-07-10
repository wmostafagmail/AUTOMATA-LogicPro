library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package dsp_pkg is
    -- Data widths
    constant DATA_WIDTH : integer := 16;
    constant COEFF_WIDTH : integer := 16;
    constant ACCUM_WIDTH : integer := 32;

    -- FIR Coefficients (Simple low-pass approximation)
    type coeff_array_t is array (0 to 2) of signed(COEFF_WIDTH-1 downto 0);
    constant FIR_COEFFS : coeff_array_t := (to_signed(100, COEFF_WIDTH), 
                                            to_signed(200, COEFF_WIDTH), 
                                            to_signed(100, COEFF_WIDTH));

    -- Pipeline Latency Constants
    constant LATENCY_FIR : integer := 2;
    constant LATENCY_ANA : integer := 3;
    constant TOTAL_LATENCY : integer := LATENCY_FIR + LATENCY_ANA;

end package dsp_pkg;