library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_pwm_peripheral_continuous is end entity;
architecture sim of tb_pwm_peripheral_continuous is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal pwm,tick : std_logic;
  signal period,duty : std_logic_vector(7 downto 0) := x"07";
begin
  clk <= not clk after 5 ns;
  dut : entity work.pwm_peripheral_continuous generic map(WIDTH=>8) port map(clk=>clk,rst_n=>rst_n,enable=>'1',period=>period,duty=>x"03",pwm_out=>pwm,period_tick=>tick);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';wait for 30 ns;assert pwm='0' or pwm='1' severity error;
    assert false report "PASS pwm_peripheral_continuous" severity note;
    wait;
  end process;
end architecture;
