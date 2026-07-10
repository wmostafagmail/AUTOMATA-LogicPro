library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package router_pkg is

    -- Data width of the AXI-Stream bus
    constant DATA_WIDTH : integer := 32;
    
    -- Type for the data bus
    subtype t_data is std_logic_vector(DATA_WIDTH-1 downto 0);

    -- Record representing an AXI-Stream interface
    type axi_stream_if is record
        tdata  : t_data;
        tvalid : std_logic;
        tready : std_logic;
        tlast  : std_logic;
    end record;

    -- Array of interfaces for scalable port counts
    type axi_stream_array is array (natural range <>) of axi_stream_if;

end package router_pkg;