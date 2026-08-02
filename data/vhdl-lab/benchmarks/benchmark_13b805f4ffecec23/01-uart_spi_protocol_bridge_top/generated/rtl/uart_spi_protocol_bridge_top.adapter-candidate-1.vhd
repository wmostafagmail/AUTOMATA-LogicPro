library ieee; use ieee.std_logic_1164.all;


library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity uart_spi_protocol_bridge_top is
  generic (
    DATA_WIDTH : positive := 8
  );
  port (
    clk : in std_logic;
    rst : in std_logic;
    uart_rx_i : in std_logic;
    uart_tx_o : out std_logic;
    spi_miso_i : in std_logic;
    spi_mosi_o : out std_logic;
    spi_sclk_o : out std_logic;
    spi_cs_o : out std_logic;
    busy_o : out std_logic;
    error_o : out std_logic;
    status_o : out std_logic_vector(7 downto 0)
  );
end entity uart_spi_protocol_bridge_top;


library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

architecture rtl of uart_spi_protocol_bridge_top is begin u_uart_rx:entity work.uart_rx generic map(DATA_WIDTH=>DATA_WIDTH) port map(clk=>clk,rst=>rst,rx_i=>uart_rx_i);u_uart_tx:entity work.uart_tx generic map(DATA_WIDTH=>DATA_WIDTH) port map(clk=>clk,rst=>rst,tx_o=>uart_tx_o);u_spi_master:entity work.spi_master generic map(DATA_WIDTH=>DATA_WIDTH) port map(clk=>clk,rst=>rst,miso_iport=>spi_miso_i,mosi_oport=>spi  _mos  _o  ,sclk_oport=>spi_sclk_o,cs_oport=>spi_cs_o);!=>busy_o=>busy_o,error_o=>error_o,status_o=>status_o);end architecture;
