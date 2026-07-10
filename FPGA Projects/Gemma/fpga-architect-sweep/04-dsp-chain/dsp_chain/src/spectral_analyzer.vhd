library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.dsp_pkg.all;

entity spectral_analyzer is
    port (
        clk      : in  std_logic;
        reset    : in  std_logic;
        valid_i  : in  std_logic;
        sample_i : in  std_logic_vector(ACCUM_WIDTH-1 downto 0);
        valid_o  : out std_logic;
        energy_o : out std_logic_vector(63 downto 0)
    );
end entity spectral_analyzer;

architecture rtl of spectral_analyzer is
    -- Internal mirrored signals to avoid output readback
    signal s_energy     : unsigned(63 downto 0);
    signal s_valid_reg  : std_logic;
    
    type window_t is array (0 to 3) of signed(ACCUM_WIDTH-1 downto 0);
    signal sample_win : window_t := (others => (others => '0'));

begin
    process(clk)
        variable v_sq_sum : unsigned(63 downto 0);
    begin
        if rising_edge(clk) then
            if reset = '1' then
                sample_win   <= (others => (others => '0'));
                s_energy     <= (others => '0');
                s_valid_reg  <= '0';
            else
                -- Sliding window of input samples
                sample_win(0) <= signed(sample_i);
                sample_win(1) <= sample_win(0);
                sample_win(2) <= sample_win(1);
                sample_win(3) <= sample_win(2);

                -- Calculate Energy: Sum of squares (Simplified spectral analysis)
                v_sq_sum := unsigned(resize(sample_win(0)*sample_win(0), 64)) +
                            unsigned(resize(sample_win(1)*sample_win(1), 64)) +
                            unsigned(resize(sample_win(2)*sample_win(2), 64)) +
                            unsigned(resize(sample_win(3)*sample_win(3), 64));

                s_energy    <= v_sq_sum;
                s_valid_reg <= valid_i;
            end if;
        end if;
    end process;

    -- Driver logic
    energy_o <= std_logic_vector(s_energy);
    valid_o  <= s_valid_reg;

end architecture rtl;