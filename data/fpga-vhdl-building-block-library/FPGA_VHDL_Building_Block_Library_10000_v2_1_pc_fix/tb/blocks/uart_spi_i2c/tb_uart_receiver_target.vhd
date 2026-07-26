library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_uart_receiver_target is end entity;
architecture sim of tb_uart_receiver_target is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal ur,rv,fe : std_logic := '1';
  signal rd : std_logic_vector(7 downto 0);
begin
  clk <= not clk after 5 ns;
  dut : entity work.uart_receiver_target generic map(CLOCK_HZ=>1_000_000,BAUD_RATE=>100_000,DATA_BITS=>8) port map(clk=>clk,rst_n=>rst_n,uart_rx=>ur,rx_data=>rd,rx_valid=>rv,framing_error=>fe);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';wait for 20 ns;assert fe='0' severity error;
    assert false report "PASS uart_receiver_target" severity note;
    wait;
  end process;
end architecture;
