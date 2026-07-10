library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package axi_stream_router_pkg is

  constant C_DATA_WIDTH : natural := 32;
  constant C_NUM_IN     : natural := 2;
  constant C_NUM_OUT    : natural := 2;

  subtype dest_field_t is std_logic_vector(7 downto 0);
  subtype port_index_t is integer range 0 to C_NUM_OUT - 1;

  constant DEST_FIELD_MSB : natural := C_DATA_WIDTH - 1;
  constant DEST_FIELD_LSB : natural := C_DATA_WIDTH - 8;

  function get_dest_port(data_in : in std_logic_vector) return port_index_t;

end package axi_stream_router_pkg;
