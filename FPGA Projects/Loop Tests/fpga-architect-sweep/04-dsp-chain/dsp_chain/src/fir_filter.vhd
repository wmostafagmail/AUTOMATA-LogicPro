library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.dsp_chain_pkg.all;

entity fir_filter is
  generic (
    TAP_CNT : integer := FIR_TAP_CNT
  );
  port (
    clk      : in  std_logic;
    rst      : in  std_logic;
    in_valid : in  std_logic;
    in_data  : in  signed(DATA_W-1 downto 0);
    out_valid: out std_logic;
    out_data : out signed(ACC_W-1 downto 0)
  );
end entity fir_filter;

architecture rtl of fir_filter is
  type tap_array_t is array (natural range <>) of signed(DATA_W-1 downto 0);
  constant COEFFS : tap_array_t(0 to TAP_CNT-1) := (
    to_signed(1, DATA_W),
    to_signed(2, DATA_W),
    to_signed(3, DATA_W),
    to_signed(1, DATA_W)
  );
  signal taps : tap_array_t(0 to TAP_CNT-1);
begin
  process(clk)
    variable acc : signed(ACC_W-1 downto 0);
  begin
    if rising_edge(clk) then
      if rst = '1' then
        for i in 0 to TAP_CNT-1 loop
          taps(i) <= (others => '0');
        end loop;
        out_valid <= '0';
        out_data  <= (others => '0');
      else
        for i in reverse TAP_CNT-1 downto 1 loop
          taps(i) <= taps(i-1);
        end loop;
        if in_valid = '1' then
          taps(0) <= in_data;
        end if;
        
        acc := (others => '0');
        for i in 0 to TAP_CNT-1 loop
          acc := acc + (taps(i) * COEFFS(i));
        end loop;
        out_valid <= in_valid;
        out_data  <= acc;
      end if;
    end if;
  end process;
end architecture rtl;