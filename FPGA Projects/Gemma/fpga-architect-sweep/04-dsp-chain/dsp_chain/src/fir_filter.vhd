library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.dsp_pkg.all;

entity fir_filter is
    port (
        clk      : in  std_logic;
        reset    : in  std_logic;
        valid_i  : in  std_logic;
        sample_i : in  std_logic_vector(DATA_WIDTH-1 downto 0);
        valid_o  : out std_logic;
        result_o : out std_logic_vector(ACCUM_WIDTH-1 downto 0)
    );
end entity fir_filter;

architecture rtl of fir_filter is
    signal s_sample    : signed(DATA_WIDTH-1 downto 0);
    signal s_result    : signed(ACCUM_WIDTH-1 downto 0);
    signal s_valid_reg : std_logic;
    
    -- Delay line for FIR taps
    type delay_line_t is array (0 to 2) of signed(DATA_WIDTH-1 downto 0);
    signal shift_reg : delay_line_t := (others => (others => '0'));

begin
    s_sample <= signed(sample_i);

    process(clk)
        variable v_sum : signed(ACCUM_WIDTH-1 downto 0);
    begin
        if rising_edge(clk) then
            if reset = '1' then
                shift_reg   <= (others => (others => '0'));
                s_result    <= (others => '0');
                s_valid_reg <= '0';
            else
                -- Shift register logic
                shift_reg(0) <= s_sample;
                shift_reg(1) <= shift_reg(0);
                shift_reg(2) <= shift_reg(1);

                -- Multiply-Accumulate (MAC) stage 1
                v_sum := (shift_reg(0) * FIR_COEFFS(0)) + 
                         (shift_reg(1) * FIR_COEFFS(1)) + 
                         (shift_reg(2) * FIR_COEFFS(2));

                -- Pipeline output
                s_result    <= v_sum;
                s_valid_reg <= valid_i;
            end if;
        end if;
    end process;

    -- Drive outputs from internal mirrors
    result_o <= std_logic_vector(s_result);
    valid_o  <= s_valid_reg;

end architecture rtl;