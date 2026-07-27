library ieee;
use ieee.std_logic_1164.all;
entity uart_tx_basic is
  generic (G_CLOCK_HZ:positive:=50_000_000; G_BAUD_RATE:positive:=115_200; G_DATA_BITS:positive:=8);
  port (clk_i,rst_ni:in std_logic; data_i:in std_logic_vector(G_DATA_BITS-1 downto 0); valid_i:in std_logic; ready_o,tx_o,busy_o:out std_logic);
end entity;
architecture rtl of uart_tx_basic is begin
  assert G_CLOCK_HZ >= G_BAUD_RATE report "UART clock must be >= baud rate" severity failure;
  u_core: entity work.uart_tx generic map(CLOCK_HZ=>G_CLOCK_HZ,BAUD_RATE=>G_BAUD_RATE,DATA_BITS=>G_DATA_BITS)
    port map(clk=>clk_i,rst_n=>rst_ni,tx_data=>data_i,tx_valid=>valid_i,tx_ready=>ready_o,uart_tx=>tx_o,busy=>busy_o);
end architecture;
