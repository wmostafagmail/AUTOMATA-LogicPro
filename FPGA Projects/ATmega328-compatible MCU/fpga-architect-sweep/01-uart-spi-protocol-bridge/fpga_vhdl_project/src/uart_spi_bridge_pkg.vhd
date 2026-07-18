library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package uart_spi_bridge_pkg is
  constant UART_BIT_WIDTH : integer := 8;
  constant UART_FIFO_DEPTH : integer := 16;
  constant SPI_BIT_WIDTH : integer := 8;
  
  type uart_frame_t is record
    data : std_logic_vector(UART_BIT_WIDTH-1 downto 0);
    valid : std_logic;
    err : std_logic;
  end record;
  
  type spi_state_t is (SPI_IDLE, SPI_SHIFT, SPI_STOP);
end package;