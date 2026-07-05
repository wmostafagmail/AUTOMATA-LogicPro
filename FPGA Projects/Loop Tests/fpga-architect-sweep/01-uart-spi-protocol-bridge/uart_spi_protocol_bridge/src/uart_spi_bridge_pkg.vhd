library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package uart_spi_bridge_pkg is
  constant FIFO_DEPTH : natural := 16;
  constant FIFO_WIDTH : natural := 8;
  subtype fifo_data_t is std_logic_vector(FIFO_WIDTH - 1 downto 0);
  subtype fifo_ptr_t  is natural range 0 to FIFO_DEPTH - 1;

  type fifo_ctrl_t is record
    wr_ptr : fifo_ptr_t;
    rd_ptr : fifo_ptr_t;
    count  : natural;
  end record;
end package uart_spi_bridge_pkg;