library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.dsp_chain_pkg.all;

entity dsp_chain_top is
  
  generic (
    DATA_WIDTH : positive := 8
  );
port (
    clk_i     : in  std_logic;
    rst_ni    : in  std_logic;
    in_valid_i: in  std_logic;
    in_data_i : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    out_valid_o: out std_logic;
    out_data_o: out std_logic_vector(DATA_WIDTH-1 downto 0)
  );
end entity;

architecture rtl of dsp_chain_top is
  signal fir_valid : std_logic;
begin
  u_fir : entity work.fir_filter
    generic map (TAP_COUNT => FILTER_TAP_COUNT)
    port map (clk_i => clk_i, rst_ni => rst_ni, in_valid_i => in_valid_i, in_data_i => in_data_i, out_valid_o => open, out_data_o => open);
end architecture;