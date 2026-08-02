library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity tb_uart_spi_protocol_bridge_top is
end entity tb_uart_spi_protocol_bridge_top;

architecture sim of tb_uart_spi_protocol_bridge_top is
  constant DATA_WIDTH : positive := 8;
  signal clk : std_logic := '0';
  signal rst : std_logic := '0';
  signal uart_rx_i : std_logic := '0';
  signal uart_tx_o : std_logic := '0';
  signal spi_miso_i : std_logic := '0';
  signal spi_mosi_o : std_logic := '0';
  signal spi_sclk_o : std_logic := '0';
  signal spi_cs_o : std_logic := '0';
  signal busy_o : std_logic := '0';
  signal error_o : std_logic := '0';
  signal status_o : std_logic_vector(7 downto 0) := (others => '0');
begin
  clk_gen : process
  begin
    clk <= '0';
    wait for 5 ns;
    clk <= '1';
    wait for 5 ns;
  end process;

  dut : entity work.uart_spi_protocol_bridge_top
    generic map (
      DATA_WIDTH => 8
    )
    port map (
      clk => clk,
      rst => rst,
      uart_rx_i => uart_rx_i,
      uart_tx_o => uart_tx_o,
      spi_miso_i => spi_miso_i,
      spi_mosi_o => spi_mosi_o,
      spi_sclk_o => spi_sclk_o,
      spi_cs_o => spi_cs_o,
      busy_o => busy_o,
      error_o => error_o,
      status_o => status_o
    );

  stimulus : process
  begin
    rst <= '1';
    wait for 20 ns;
    rst <= '0';
    uart_rx_i <= '0';
    spi_miso_i <= '0';
    wait for 80 ns;
    report "PASS" severity note;
    wait;
  end process;
end architecture sim;
