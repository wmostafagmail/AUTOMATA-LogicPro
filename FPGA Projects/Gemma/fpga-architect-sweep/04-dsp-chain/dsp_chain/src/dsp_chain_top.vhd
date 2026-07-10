library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.dsp_pkg.all;

entity dsp_chain_top is
    port (
        clk      : in  std_logic;
        reset    : in  std_logic;
        valid_i  : in  std_logic;
        sample_i : in  std_logic_vector(DATA_WIDTH-1 downto 0);
        valid_o  : out std_logic;
        energy_o : out std_logic_vector(63 downto 0)
    );
end entity dsp_chain_top;

architecture rtl of dsp_chain_top is
    signal fir_valid_o   : std_logic;
    signal fir_result_o  : std_logic_vector(ACCUM_WIDTH-1 downto 0);
    signal ana_valid_o   : std_logic;
    signal ana_energy_o  : std_logic_vector(63 downto 0);

begin
    -- FIR Stage
    u_fir : entity work.fir_filter
        port map (
            clk      => clk,
            reset    => reset,
            valid_i  => valid_i,
            sample_i => sample_i,
            valid_o  => fir_valid_o,
            result_o => fir_result_o
        );

    -- Analyzer Stage
    u_ana : entity work.spectral_analyzer
        port map (
            clk      => clk,
            reset    => reset,
            valid_i  => fir_valid_o,
            sample_i => fir_result_o,
            valid_o  => ana_valid_o,
            energy_o => ana_energy_o
        );

    -- Final outputs
    valid_o  <= ana_valid_o;
    energy_o <= ana_energy_o;

end architecture rtl;