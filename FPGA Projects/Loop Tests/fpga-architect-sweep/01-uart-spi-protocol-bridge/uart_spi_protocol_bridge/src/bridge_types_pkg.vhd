library ieee;
use ieee.std_logic_1164.all;

package bridge_types_pkg is
  constant FIFO_DEPTH : integer := 16;
  constant DATA_WIDTH : integer := 8;

  subtype fifo_index_t is integer range 0 to FIFO_DEPTH - 1;

  type fifo_ctrl_t is record
    data      : std_logic_vector(DATA_WIDTH - 1 downto 0);
    valid     : std_logic;
    empty     : std_logic;
    full      : std_logic;
    wr_ptr    : fifo_index_t;
    rd_ptr    : fifo_index_t;
    count     : integer;
  end record;

  function fifo_init return fifo_ctrl_t;
end package bridge_types_pkg;

package body bridge_types_pkg is
  function fifo_init return fifo_ctrl_t is
  begin
    return (
      data      => (others => '0'),
      valid     => '0',
      empty     => '1',
      full      => '0',
      wr_ptr    => 0,
      rd_ptr    => 0,
      count     => 0
     );
  end function fifo_init;
end package body bridge_types_pkg;
