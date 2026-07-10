library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
library work;
use work.dsp_chain_pkg.all;

entity dsp_chain_top is
  port (
    clk     : in  std_logic;
    rst     : in  std_logic;
    sample_i: in  sample_t;
    valid_i : in  std_logic;
    ready_o : out std_logic;
    sample_o: out sample_t;
    valid_o : out std_logic
  );
end entity dsp_chain_top;

architecture rtl of dsp_chain_top is
  signal fir_valid : std_logic;
  signal sample_mid: sample_t;
begin
  fir_inst : entity work.fir_filter
    port map (
      clk     => clk,
      rst     => rst,
      sample_i=> sample_i,
      valid_i => valid_i,
      sample_o=> sample_mid,
      valid_o => fir_valid
    );

  fft_inst : entity work.fft_lite
    port map (
      clk     => clk,
      rst     => rst,
      sample_i=> sample_mid,
      valid_i => fir_valid,
      sample_o=> sample_o,
      valid_o => valid_o
    );

  ready_o <= '1';
end architecture rtl;