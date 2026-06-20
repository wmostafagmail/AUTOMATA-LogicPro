library ieee;
use ieee.std_logic_1164.all;

use work.cpu_pkg.all;

entity mmio is
  port (
    clk          : in  std_logic;
    reset        : in  std_logic;
    addr         : in  byte_t;
    write_en     : in  std_logic;
    write_data   : in  byte_t;
    uart_busy    : in  std_logic;
    read_data    : out byte_t;
    led_out      : out byte_t;
    uart_tx_data : out byte_t;
    uart_tx_write: out std_logic
  );
end entity;

architecture rtl of mmio is
  signal led_reg          : byte_t := (others => '0');
  signal uart_tx_data_reg : byte_t := (others => '0');
  signal uart_tx_pulse    : std_logic := '0';
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        led_reg          <= (others => '0');
        uart_tx_data_reg <= (others => '0');
        uart_tx_pulse    <= '0';
      else
        uart_tx_pulse <= '0';

        if write_en = '1' then
          if addr = LED_ADDR then
            led_reg <= write_data;
          elsif addr = UART_TX_ADDR and uart_busy = '0' then
            uart_tx_data_reg <= write_data;
            uart_tx_pulse    <= '1';
          end if;
        end if;
      end if;
    end if;
  end process;

  process(addr, led_reg, uart_busy)
  begin
    read_data <= (others => '0');

    if addr = LED_ADDR then
      read_data <= led_reg;
    elsif addr = UART_STATUS_ADDR then
      read_data <= "0000000" & uart_busy;
    end if;
  end process;

  led_out       <= led_reg;
  uart_tx_data  <= uart_tx_data_reg;
  uart_tx_write <= uart_tx_pulse;
end architecture;
