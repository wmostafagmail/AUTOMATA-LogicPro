library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
library work;
use work.dsp_chain_pkg.all;

entity fir_filter is
  generic (
    TAP_COUNT : integer := FIR_TAPS
  );
  port (
    clk       : in  std_logic;
    rst       : in  std_logic;
    sample_i  : in  sample_t;
    valid_i   : in  std_logic;
    sample_o  : out sample_t;
    valid_o   : out std_logic
  );
end entity fir_filter;

architecture rtl of fir_filter is
  type tap_reg_t is array (0 to 3) of sample_t;
  signal taps : tap_reg_t;
  signal acc  : sample_t;
  signal valid_d : std_logic;
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        taps <= (0 => (others => '0'), 1 => (others => '0'), 2 => (others => '0'), 3 => (others => '0'));
        valid_d <= '0';
        acc <= (others => '0');
      else
        if valid_i = '1' then
          taps(0) <= taps(1);
          taps(1) <= taps(2);
          taps(2) <= taps(3);
          taps(3) <= sample_i;
          valid_d <= '1';
        else
          valid_d <= '0';
        end if;
        acc <= (taps(0) * sample_i) + (taps(1) * sample_i) + (taps(2) * sample_i) + (taps(3) * sample_i);
      end if;
    end if;
  end process;

  process(clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        sample_o <= (others => '0');
        valid_o  <= '0';
      else
        sample_o <= acc;
        valid_o  <= valid_d;
      end if;
    end if;
  end process;
end architecture rtl;