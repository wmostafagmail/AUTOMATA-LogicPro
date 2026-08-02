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
    signal fft_output      : signed(31 downto 0);

    -- Pipeline registers and latency bookkeeping
    type fir_pipeline_type is array (0 to 2) of signed(DATA_WIDTH-1 downto 0);
    signal fir_pipeline_reg : fir_pipeline_type;

begin

    -- FIR filter datapath
    fir_filter_proc : process(clk, rst)
    begin
        if rising_edge(clk) then
            if rst = '1' then
                fir_input_reg <= (others => '0');
                fir_pipeline_reg <= (others => (others => '0'));
            else
                -- Shift pipeline registers
                fir_pipeline_reg(2) <= fir_pipeline_reg(1);
                fir_pipeline_reg(1) <= fir_pipeline_reg(0);

                -- Capture input sample
                if sample_valid_i = '1' then
                    fir_input_reg <= sample_i;
                end if;

                -- Compute FIR output
                fir_output <= (fir_pipeline_reg(2) * COEFF_0) + 
                              (fir_pipeline_reg(1) * COEFF_1) + 
                              (fir_pipeline_reg(0) * COEFF_2);
            end if;
        end if;
    end process;

    -- FFT-lite or spectral analyzer stage
    fft_proc : process(clk, rst)
    begin
        if rising_edge(clk) then
            if rst = '1' then
                fft_input <= (others => '0');
                fft_output <= (others => '0');
            else
                -- Capture FIR output as FFT input
                fft_input <= fir_output;

                -- Perform FFT-lite or spectral analysis (example: simple squaring)
                fft_output <= resize(fft_input * fft_input, fft_output'length);
            end if;
        end if;
    end process;

    -- Output-valid or result-ready signaling
    sample_ready_o <= '1';
    result_valid_o <= '1' when rst = '0' else '0';

    -- Assign final result
    result_o <= fft_output;

end architecture rtl;
