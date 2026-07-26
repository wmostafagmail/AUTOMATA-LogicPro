library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;

entity bb_debounce_core is
  generic (
    STABLE_CYCLES : positive := 16
  );
  port (
    clk       : in  std_logic;
    rst_n     : in  std_logic;
    noisy_in  : in  std_logic;
    clean_out : out std_logic;
    rise_pulse: out std_logic;
    fall_pulse: out std_logic
  );
end entity;

architecture rtl of bb_debounce_core is
  signal candidate, clean_reg : std_logic := '0';
  signal count : natural range 0 to STABLE_CYCLES := 0;
  signal rise_reg, fall_reg : std_logic := '0';
begin
  clean_out <= clean_reg;
  rise_pulse <= rise_reg;
  fall_pulse <= fall_reg;
  process(clk)
  begin
    if rising_edge(clk) then
      rise_reg <= '0';
      fall_reg <= '0';
      if rst_n = '0' then
        candidate <= '0';
        clean_reg <= '0';
        count <= 0;
      elsif noisy_in /= candidate then
        candidate <= noisy_in;
        count <= 1;
      elsif candidate /= clean_reg then
        if count >= STABLE_CYCLES-1 then
          if candidate = '1' then rise_reg <= '1'; else fall_reg <= '1'; end if;
          clean_reg <= candidate;
          count <= 0;
        else
          count <= count + 1;
        end if;
      else
        count <= 0;
      end if;
    end if;
  end process;
end architecture;
