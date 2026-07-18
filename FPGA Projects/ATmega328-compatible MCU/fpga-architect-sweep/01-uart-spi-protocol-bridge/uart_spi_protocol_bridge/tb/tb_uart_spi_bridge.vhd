library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;

entity tb_uart_spi_bridge is
end entity;

architecture sim of tb_uart_spi_bridge is
  signal clk : std_logic := '0';
  signal rst : std_logic := '1';
  signal uart_rx : std_logic := '1';
  signal spi_miso : std_logic := '0';
  signal busy : std_logic;
  signal err : std_logic;
  signal data_avail : std_logic;

  procedure check_pass(
    constant label_text : in string;
    variable failed_io  : inout boolean
  ) is
  begin
    if failed_io then
      report "FAIL " & label_text severity error;
    else
      report "PASS " & label_text severity note;
    end if;
  end procedure;

begin
  clk <= not clk after 5 ns;

  dut : entity work.uart_spi_bridge
    generic map (DIVIDER => 100)
    port map (
      clk_i => clk, rst_i => rst,
      uart_rx_i => uart_rx, uart_tx_o => open,
      spi_sclk_o => open, spi_mosi_o => open,
      spi_miso_i => spi_miso, spi_cs_o => open,
      busy_o => busy, err_o => err, data_avail_o => data_avail
    );

  stimulus : process
    variable failed : boolean := false;
  begin
    rst <= '1'; wait for 20 ns;
    rst <= '0';
    wait until rising_edge(clk); wait for 10 ns;

    uart_rx <= '0'; wait for 10 ns;
    uart_rx <= '1'; wait for 10 ns;
    uart_rx <= '1'; wait for 10 ns;
    uart_rx <= '1'; wait for 10 ns;
    uart_rx <= '1'; wait for 10 ns;
    uart_rx <= '1'; wait for 10 ns;
    uart_rx <= '1'; wait for 10 ns;
    uart_rx <= '1'; wait for 10 ns;
    uart_rx <= '1'; wait for 10 ns;
    uart_rx <= '1'; wait for 10 ns;
    uart_rx <= '1'; wait for 10 ns;

    wait until rising_edge(clk);
    wait until busy = '0';
    wait for 20 ns;

    check_pass("nominal_spi_tx", failed);

    if failed then
      report "TEST FAILED" severity failure;
    else
      report "TEST PASSED" severity note;
      std.env.stop(0);
    end if;
  end process;
end architecture;