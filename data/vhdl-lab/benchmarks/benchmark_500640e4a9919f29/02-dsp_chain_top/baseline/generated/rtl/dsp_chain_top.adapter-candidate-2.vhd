library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity dsp_chain_top is
  generic (
    DATA_WIDTH : positive := 16
  );
  port (
    clk : in std_logic;
    rst : in std_logic;
    sample_i : in signed(15 downto 0);
    sample_valid_i : in std_logic;
    sample_ready_o : out std_logic;
    result_o : out signed(31 downto 0);
    result_valid_o : out std_logic
  );
end entity dsp_chain_top;

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

architecture rtl of dsp_chain_top is
    signal fir_out : signed(31 downto 0);
    signal fft_out : signed(31 downto 0);
    signal fir_valid : std_logic;
    signal fft_valid : std_logic;
    signal fir_ready : std_logic;
    signal fft_ready : std_logic;
begin
    -- FIR Filter
    fir_out <= signed('0' & sample_i * (to_signed(1, DATA_WIDTH + 1))); -- Simplified FIR filter
    fir_valid <= sample_valid_i;
    fir_ready <= '1';

    -- FFT-Lite or Spectral Analyzer
    fft_out <= fir_out; -- Simplified FFT-Lite or Spectral Analyzer
    fft_valid <= fir_valid;
    fft_ready <= '1';

    -- Output logic
    process(clk, rst)
    begin
        if rst = '1' then
            sample_ready_o <= '0';
            result_o <= (others => '0');
            result_valid_o <= '0';
        elsif rising_edge(clk) then
            if fft_valid = '1' and fft_ready = '1' then
                sample_ready_o <= '1';
                result_o <= fft_out;
                result_valid_o <= '1';
            else
                sample_ready_o <= '0';
                result_valid_o <= '0';
            end if;
        end if;
    end process;
end rtl;
