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

architecture rtl of uart_spi_protocol_bridge_top is
begin
  uart_tx_o <= '0';
  spi_mosi_o <= '0';
  spi_sclk_o <= '0';
  spi_cs_o <= '1';
  busy_o <= '0';
  error_o <= '0';
  status_o <= (others => '0');
end architecture rtl;
