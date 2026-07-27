library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity bb_pwm_core is
  generic (
    WIDTH : positive := 16
  );
  port (
    clk       : in  std_logic;
    rst_n     : in  std_logic;
    enable    : in  std_logic;
    period    : in  std_logic_vector(WIDTH-1 downto 0);
    duty      : in  std_logic_vector(WIDTH-1 downto 0);
    pwm_out   : out std_logic;
    period_tick : out std_logic
  );
end entity;

architecture rtl of bb_pwm_core is
  signal counter : unsigned(WIDTH-1 downto 0) := (others => '0');
  signal tick_reg : std_logic := '0';
begin
  pwm_out <= '1' when enable = '1' and counter < unsigned(duty) else '0';
  period_tick <= tick_reg;
  process(clk)
  begin
    if rising_edge(clk) then
      tick_reg <= '0';
      if rst_n = '0' or enable = '0' then
        counter <= (others => '0');
      elsif counter >= unsigned(period) then
        counter <= (others => '0');
        tick_reg <= '1';
      else
        counter <= counter + 1;
      end if;
    end if;
  end process;
end architecture;
