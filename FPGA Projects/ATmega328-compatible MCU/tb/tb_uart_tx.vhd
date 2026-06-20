library ieee;
use ieee.std_logic_1164.all;

use work.cpu_pkg.all;

entity tb_uart_tx is
end entity;

architecture sim of tb_uart_tx is
  constant CLOCK_FREQ_HZ : positive := 100;
  constant BAUD_RATE     : positive := 10;

  signal clk     : std_logic := '0';
  signal reset   : std_logic := '1';
  signal start   : std_logic := '0';
  signal data_in : byte_t := x"55";
  signal tx      : std_logic;
  signal busy    : std_logic;
begin
  clk <= not clk after 5 ns;

  dut: entity work.uart_tx
    generic map (
      CLOCK_FREQ_HZ => CLOCK_FREQ_HZ,
      BAUD_RATE     => BAUD_RATE
    )
    port map (
      clk     => clk,
      reset   => reset,
      start   => start,
      data_in => data_in,
      tx      => tx,
      busy    => busy
    );

  process
  begin
    wait for 12 ns;
    reset <= '0';
    start <= '1';
    wait for 10 ns;
    start <= '0';

    wait for 15 ns;
    assert busy = '1' report "UART did not start" severity failure;

    wait for 1000 ns;
    assert busy = '0' report "UART did not finish frame" severity failure;

    wait;
  end process;
end architecture;
