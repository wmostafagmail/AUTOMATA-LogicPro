library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package uart_spi_bridge_pkg is
  constant TX_FIFO_DEPTH_C : integer := 4;
  constant RX_FIFO_DEPTH_C : integer := 4;
  constant DATA_WIDTH_C    : integer := 8;

  subtype byte_t is std_logic_vector(DATA_WIDTH_C - 1 downto 0);
  
  type state_t is (ST_IDLE, ST_RX, ST_TX, ST_WAIT);
  
  function next_state_fn(current : in state_t;
                         rx_active : in std_logic;
                         tx_done : in std_logic) return state_t;
end package uart_spi_bridge_pkg;