library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_uart_transmitter_bridge is end entity;
architecture sim of tb_uart_transmitter_bridge is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal tv,tr,ut,busy : std_logic := '0';
begin
  clk <= not clk after 5 ns;
  dut : entity work.uart_transmitter_bridge generic map(CLOCK_HZ=>1_000_000,BAUD_RATE=>100_000,DATA_BITS=>8) port map(clk=>clk,rst_n=>rst_n,tx_data=>x"55",tx_valid=>tv,tx_ready=>tr,uart_tx=>ut,busy=>busy);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';tv<='1';wait for 10 ns;tv<='0';wait for 30 ns;assert busy='1' report "UART TX did not start" severity error;
    assert false report "PASS uart_transmitter_bridge" severity note;
    wait;
  end process;
end architecture;
