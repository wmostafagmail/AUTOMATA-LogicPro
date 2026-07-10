library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
library work;
use work.dsp_chain_pkg.all;

entity fft_lite is
  port (
    clk       : in  std_logic;
    rst       : in  std_logic;
    sample_i  : in  sample_t;
    valid_i   : in  std_logic;
    sample_o  : out sample_t;
    valid_o   : out std_logic
  );
end entity fft_lite;

architecture rtl of fft_lite is
  type buf_t is array (0 to 3) of sample_t;
  signal buf  : buf_t;
  signal idx  : integer range 0 to 3;
  signal acc  : sample_t;
  signal valid_d : std_logic;
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        buf <= (0 => (others => '0'), 1 => (others => '0'), 2 => (others => '0'), 3 => (others => '0'));
        idx <= 0;
        valid_d <= '0';
        acc <= (others => '0');
      else
        if valid_i = '1' then
          buf(idx) <= sample_i;
          idx <= idx + 1;
          if idx = 3 then
            valid_d <= '1';
          else
            valid_d <= '0';
          end if;
        else
          valid_d <= '0';
        end if;
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
        if valid_d = '1' and idx = 3 then
          acc <= (buf(0) * to_signed(1, SAMPLE_WIDTH)) +
                (buf(1) * to_signed(1, SAMPLE_WIDTH)) +
                (buf(2) * to_signed(1, SAMPLE_WIDTH)) +
                (buf(3) * to_signed(1, SAMPLE_WIDTH));
          sample_o <= acc;
          valid_o  <= '1';
        else
          sample_o <= (others => '0');
          valid_o  <= '0';
        end if;
      end if;
    end if;
  end process;
end architecture rtl;