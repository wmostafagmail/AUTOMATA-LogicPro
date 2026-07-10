-- fft_lite_analyzer.vhd
-- Computes the DC bin of a 4-point DFT: X[0] = sum(x[n]) for n=0..3.
-- Outputs |X[0]| as a signed-16-bit magnitude estimate.
-- Latency from first valid_i to valid_o = 3 cycles in steady state.

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity fft_lite_analyzer is
  port (
    clk_i       : in  std_logic;
    rst_i       : in  std_logic;
    valid_i     : in  std_logic;
    sample_i    : in  signed(15 downto 0);
    valid_o     : out std_logic;
    magnitude_o : out signed(15 downto 0)
  );
end entity fft_lite_analyzer;

architecture rtl of fft_lite_analyzer is
  constant BIN_COUNT : integer := 4;

  signal s_valid_0 : std_logic := '0';
  signal s_valid_1 : std_logic := '0';
  signal s_valid_2 : std_logic := '0';

  type sample_array_t is array(0 to BIN_COUNT - 1) of signed(15 downto 0);
  signal samples   : sample_array_t := (others => (others => '0'));
begin

  process(clk_i)
    variable v_sum : signed(17 downto 0);
    variable v_abs : signed(15 downto 0);
  begin
    if rising_edge(clk_i) then
      if rst_i = '1' then
        samples     <= (others => (others => '0'));
        s_valid_0   <= '0';
        s_valid_1   <= '0';
        s_valid_2   <= '0';
        valid_o     <= '0';
        magnitude_o <= (others => '0');
      elsif valid_i = '1' then
        samples(3) <= samples(2);
        samples(2) <= samples(1);
        samples(1) <= samples(0);
        samples(0) <= sample_i;

        v_sum := resize(samples(0), 18)
               + resize(samples(1), 18)
               + resize(samples(2), 18)
               + resize(samples(3), 18);

        if v_sum(17) = '1' then
          v_abs := not resize(v_sum, 16) + 1;
        else
          v_abs := resize(v_sum, 16);
        end if;

        s_valid_0 <= valid_i;
        s_valid_1 <= s_valid_0;
        s_valid_2 <= s_valid_1;
        magnitude_o <= v_abs;
      else
        s_valid_0 <= '0';
        s_valid_1 <= s_valid_0;
        s_valid_2 <= s_valid_1;
        valid_o   <= s_valid_2;
        magnitude_o <= (others => '0');
      end if;
    end if;
  end process;

end architecture rtl;