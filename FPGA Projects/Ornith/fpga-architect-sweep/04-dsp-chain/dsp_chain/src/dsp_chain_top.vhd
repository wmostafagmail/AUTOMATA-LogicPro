-- dsp_chain_top.vhd
-- Integrates fir_filter and fft_lite_analyzer into a staged DSP chain.

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity dsp_chain_top is
  generic (
    DATA_WIDTH : integer := 8
  );
  port (
    clk_i       : in  std_logic;
    rst_i       : in  std_logic;
    valid_in_i  : in  std_logic;
    sample_in_i : in  signed(DATA_WIDTH - 1 downto 0);
    valid_out_o : out std_logic;
    magnitude_o : out signed(15 downto 0)
  );
end entity dsp_chain_top;

architecture rtl of dsp_chain_top is
  signal fir_valid      : std_logic := '0';
  signal fir_sample     : signed(2 * DATA_WIDTH - 1 downto 0) := (others => '0');
  signal analyzer_valid : std_logic := '0';
begin

  u_fir : entity work.fir_filter
    generic map (
      DATA_WIDTH => DATA_WIDTH
    )
    port map (
      clk_i   => clk_i,
      rst_i   => rst_i,
      valid_i => valid_in_i,
      sample_i=> sample_in_i,
      valid_o => fir_valid,
      sample_o=> fir_sample
    );

  u_analyzer : entity work.fft_lite_analyzer
    port map (
      clk_i       => clk_i,
      rst_i       => rst_i,
      valid_i     => fir_valid,
      sample_i    => fir_sample(15 downto 0),
      valid_o     => analyzer_valid,
      magnitude_o => magnitude_o
    );

  valid_out_o <= analyzer_valid;

end architecture rtl;