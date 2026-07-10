library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

library work;
use work.dsp_chain_pkg.all;

entity dsp_chain_top is
  generic (
    Sample_Width : positive := SAMPLE_WIDTH;
    Prod_Width   : positive := PROD_WIDTH;
    Mag_Width    : positive := 38
  );
  port (
    clk               : in  std_logic;
    reset             : in  std_logic;
    sample_in_valid   : in  std_logic;
    sample_in_data    : in  std_logic_vector(Sample_Width - 1 downto 0);
    chain_out_valid   : out std_logic;
    chain_out_mag     : out std_logic_vector(Mag_Width - 1 downto 0)
  );
end entity dsp_chain_top;

architecture rtl of dsp_chain_top is

    -- Internal wires between stages
  signal fir_out_valid_sig : std_logic;
  signal fir_out_data_sig  : std_logic_vector(Prod_Width - 1 downto 0);

begin

  u_fir : entity work.fir_filter
    generic map (
      Width_Sample => Sample_Width,
      Width_Prod   => Prod_Width
    )
    port map (
      clk               => clk,
      reset             => reset,
      sample_in_valid   => sample_in_valid,
      sample_in_data    => sample_in_data,
      filt_out_valid    => fir_out_valid_sig,
      filt_out_data     => fir_out_data_sig
    );

  u_analyzer : entity work.spectral_analyzer
    generic map (
      Width_In   => Prod_Width,
      Width_Out  => Mag_Width
    )
    port map (
      clk               => clk,
      reset             => reset,
      data_in_valid     => fir_out_valid_sig,
      data_in_sig       => fir_out_data_sig,
      result_out_valid  => chain_out_valid,
      result_out_mag    => chain_out_mag
    );

end architecture rtl;