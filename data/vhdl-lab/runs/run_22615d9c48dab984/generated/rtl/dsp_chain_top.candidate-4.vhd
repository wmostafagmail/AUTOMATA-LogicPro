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

    -- FIR filter coefficients (example values)
    constant COEFF_0 : signed(DATA_WIDTH-1 downto 0) := to_signed(1, DATA_WIDTH);
    constant COEFF_1 : signed(DATA_WIDTH-1 downto 0) := to_signed(-2, DATA_WIDTH);
    constant COEFF_2 : signed(DATA_WIDTH-1 downto 0) := to_signed(3, DATA_WIDTH);

    -- FIR filter signals
    signal fir_input_reg   : signed(DATA_WIDTH-1 downto 0);
    signal fir_output      : signed(DATA_WIDTH+1 downto 0); -- +1 for overflow

    -- FFT-lite or spectral analyzer signals
    signal fft_input       : signed(DATA_WIDTH+1 downto 0);

begin

    -- FIR filter process
    fir_filter_proc : process(clk, rst)
        variable sum : signed(DATA_WIDTH+2 downto 0); -- +2 for overflow
    begin
        if rising_edge(clk) then
            if rst = '1' then
                fir_input_reg <= (others => '0');
                fir_output    <= (others => '0');
            else
                fir_input_reg <= sample_i;
                sum := resize(fir_input_reg * COEFF_0, DATA_WIDTH+2)
                     + resize(fir_input_reg * COEFF_1, DATA_WIDTH+2)
                     + resize(fir_input_reg * COEFF_2, DATA_WIDTH+2);
                fir_output    <= sum(DATA_WIDTH+1 downto 0); -- truncate to fit
            end if;
        end if;
    end process;

    -- FFT-lite or spectral analyzer process
    fft_proc : process(clk, rst)
    begin
        if rising_edge(clk) then
            if rst = '1' then
                fft_input <= (others => '0');
                result_o  <= (others => '0');
            else
                fft_input <= fir_output;
                -- Simple example: just shift left by 2 to simulate FFT output
                result_o  <= resize(fft_input, 32) sll 2; -- +1 for overflow
            end if;
        end if;
    end process;

    -- Output valid signal generation
    sample_ready_o <= '1';
    result_valid_o <= sample_valid_i;

end architecture rtl;
