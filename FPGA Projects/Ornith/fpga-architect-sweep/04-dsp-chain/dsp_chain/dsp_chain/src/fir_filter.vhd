-- fir_filter.vhd
-- 4-tap signed FIR filter. Coefficients [-1, 2, 2, -1] on signed-8-bit inputs.
-- Latency = 3 cycles from valid_i to valid_o in steady state.

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity fir_filter is
  generic (
    DATA_WIDTH : integer := 8
  );
  port (
    clk_i   : in  std_logic;
    rst_i   : in  std_logic;
    valid_i : in  std_logic;
    sample_i: in  signed(DATA_WIDTH - 1 downto 0);
    valid_o : out std_logic;
    sample_o: out signed(2 * DATA_WIDTH - 1 downto 0)
  );
end entity fir_filter;

architecture rtl of fir_filter is
  constant COEFF_A : integer := -1;
  constant COEFF_B : integer :=  2;
  constant COEFF_C : integer :=  2;
  constant COEFF_D : integer := -1;

  signal s_valid_0 : std_logic := '0';
  signal s_valid_1 : std_logic := '0';
  signal s_valid_2 : std_logic := '0';
  signal s_valid_3 : std_logic := '0';

  type tap_array_t is array(0 to 3) of signed(DATA_WIDTH - 1 downto 0);
  signal taps      : tap_array_t := (others => (others => '0'));
begin

  process(clk_i)
    variable v_coeff_a : signed(DATA_WIDTH - 1 downto 0);
    variable v_coeff_b : signed(DATA_WIDTH - 1 downto 0);
    variable v_coeff_c : signed(DATA_WIDTH - 1 downto 0);
    variable v_coeff_d : signed(DATA_WIDTH - 1 downto 0);
    variable v_prod_a  : signed(2 * DATA_WIDTH - 1 downto 0);
    variable v_prod_b  : signed(2 * DATA_WIDTH - 1 downto 0);
    variable v_prod_c  : signed(2 * DATA_WIDTH - 1 downto 0);
    variable v_prod_d  : signed(2 * DATA_WIDTH - 1 downto 0);
    variable v_acc     : signed(2 * DATA_WIDTH - 1 downto 0);
  begin
    if rising_edge(clk_i) then
      if rst_i = '1' then
        taps       <= (others => (others => '0'));
        s_valid_0  <= '0';
        s_valid_1  <= '0';
        s_valid_2  <= '0';
        s_valid_3  <= '0';
        valid_o    <= '0';
        sample_o   <= (others => '0');
      elsif valid_i = '1' then
        taps(3) <= taps(2);
        taps(2) <= taps(1);
        taps(1) <= taps(0);
        taps(0) <= sample_i;

        v_coeff_a := resize(signed(to_unsigned(COEFF_A, DATA_WIDTH)), DATA_WIDTH);
        v_coeff_b := resize(signed(to_unsigned(COEFF_B, DATA_WIDTH)), DATA_WIDTH);
        v_coeff_c := resize(signed(to_unsigned(COEFF_C, DATA_WIDTH)), DATA_WIDTH);
        v_coeff_d := resize(signed(to_unsigned(COEFF_D, DATA_WIDTH)), DATA_WIDTH);

        v_prod_a := v_coeff_a * taps(0);
        v_prod_b := v_coeff_b * taps(1);
        v_prod_c := v_coeff_c * taps(2);
        v_prod_d := v_coeff_d * taps(3);

        v_acc := resize(v_prod_a, 2 * DATA_WIDTH)
               + resize(v_prod_b, 2 * DATA_WIDTH)
               + resize(v_prod_c, 2 * DATA_WIDTH)
               + resize(v_prod_d, 2 * DATA_WIDTH);

        s_valid_0 <= valid_i;
        s_valid_1 <= s_valid_0;
        s_valid_2 <= s_valid_1;
        s_valid_3 <= s_valid_2;
        sample_o  <= v_acc;
      else
        s_valid_0 <= '0';
        s_valid_1 <= s_valid_0;
        s_valid_2 <= s_valid_1;
        s_valid_3 <= s_valid_2;
        valid_o   <= s_valid_3;
        sample_o  <= (others => '0');
      end if;
    end if;
  end process;

end architecture rtl;