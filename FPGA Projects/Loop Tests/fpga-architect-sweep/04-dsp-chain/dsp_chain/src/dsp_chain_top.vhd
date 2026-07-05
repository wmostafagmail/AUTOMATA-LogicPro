library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.dsp_chain_pkg.all;

entity dsp_chain_top is
  port (
    clk      : in  std_logic;
    rst      : in  std_logic;
    in_valid : in  std_logic;
    in_data  : in  signed(DATA_W-1 downto 0);
    out_valid: out std_logic;
    out_mag  : out unsigned(2*ACC_W-1 downto 0)
  );
end entity dsp_chain_top;

architecture rtl of dsp_chain_top is
  signal fir_out_valid : std_logic;
  signal fir_out_data  : signed(ACC_W-1 downto 0);
begin
  fir_inst : entity work.fir_filter
    generic map (TAP_CNT => FIR_TAP_CNT)
    port map (clk => clk, rst => rst, in_valid => in_valid, in_data => in_data, out_valid => fir_out_valid, out_data => fir_out_data);
    
  fft_inst : entity work.fft_lite
    port map (clk => clk, rst => rst, in_valid => fir_out_valid, in_data => fir_out_data, out_valid => out_valid, out_mag => out_mag);
end architecture rtl;