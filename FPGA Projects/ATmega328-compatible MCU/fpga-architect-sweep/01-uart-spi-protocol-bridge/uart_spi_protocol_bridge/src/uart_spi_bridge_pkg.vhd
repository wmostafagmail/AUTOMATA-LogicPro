library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package uart_spi_bridge_pkg is
  constant SPI_BIT_W : integer := 8;
  constant FIFO_DEPTH : integer := 16;
  subtype byte_t is unsigned(SPI_BIT_W - 1 downto 0);
end package;

package body uart_spi_bridge_pkg is
end package body;
