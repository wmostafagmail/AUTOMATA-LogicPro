library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package dsp_chain_pkg is
  constant FIR_TAP_CNT : integer := 4;
  constant DATA_W      : integer := 16;
  constant ACC_W       : integer := DATA_W + FIR_TAP_CNT;
  
  type sample_array_t is array (natural range <>) of signed(DATA_W-1 downto 0);
  
  function compute_mag_sq (
    input_val : in signed
  ) return unsigned;
end dsp_chain_pkg;

package body dsp_chain_pkg is
  function compute_mag_sq (
    input_val : in signed
  ) return unsigned is
    variable v_sq : unsigned(2*input_val'length-1 downto 0);
  begin
    v_sq := input_val * input_val;
    return v_sq;
  end compute_mag_sq;
end dsp_chain_pkg;