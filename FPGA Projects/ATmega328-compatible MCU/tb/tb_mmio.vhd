library ieee;
use ieee.std_logic_1164.all;

use work.cpu_pkg.all;

entity tb_mmio is
end entity;

architecture sim of tb_mmio is
  signal clk           : std_logic := '0';
  signal reset         : std_logic := '1';
  signal addr          : byte_t := (others => '0');
  signal write_en      : std_logic := '0';
  signal write_data    : byte_t := (others => '0');
  signal uart_busy     : std_logic := '0';
  signal read_data     : byte_t;
  signal led_out       : byte_t;
  signal uart_tx_data  : byte_t;
  signal uart_tx_write : std_logic;
begin
  clk <= not clk after 5 ns;

  dut: entity work.mmio
    port map (
      clk           => clk,
      reset         => reset,
      addr          => addr,
      write_en      => write_en,
      write_data    => write_data,
      uart_busy     => uart_busy,
      read_data     => read_data,
      led_out       => led_out,
      uart_tx_data  => uart_tx_data,
      uart_tx_write => uart_tx_write
    );

  process
  begin
    wait for 12 ns;
    reset <= '0';

    addr       <= LED_ADDR;
    write_data <= x"3C";
    write_en   <= '1';
    wait for 10 ns;
    write_en   <= '0';
    wait for 1 ns;
    assert led_out = x"3C" report "LED register write failed" severity failure;

    addr <= UART_STATUS_ADDR;
    wait for 1 ns;
    assert read_data(0) = '0' report "UART status read failed" severity failure;

    addr       <= UART_TX_ADDR;
    write_data <= x"41";
    write_en   <= '1';
    wait for 10 ns;
    write_en   <= '0';
    wait for 1 ns;
    assert uart_tx_write = '0' report "Pulse should be one clock only after edge" severity failure;
    assert uart_tx_data = x"41" report "UART data register failed" severity failure;

    wait;
  end process;
end architecture;
