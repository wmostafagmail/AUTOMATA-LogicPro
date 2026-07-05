library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;

entity tb_uart_spi_bridge is
end entity tb_uart_spi_bridge;

architecture sim of tb_uart_spi_bridge is
  constant CLK_PERIOD : time := 10 ns;
  signal clk_i        : std_logic := '0';
  signal rst_i        : std_logic := '0';
  signal uart_rx_i    : std_logic := '1';
  signal uart_tx_o    : std_logic;
  signal spi_sclk_o   : std_logic;
  signal spi_mosi_o   : std_logic;
  signal spi_miso_i   : std_logic := '0';
  signal spi_cs_o     : std_logic;
  signal rx_valid_i   : std_logic := '0';
  signal rx_data_i    : std_logic_vector(7 downto 0) := (others => '0');
  signal tx_ready_o   : std_logic;
  signal spi_miso_valid_i : std_logic := '0';
  signal spi_miso_data_i  : std_logic_vector(7 downto 0) := (others => '0');
  signal spi_tx_ready_o   : std_logic;
  signal bridge_busy_o    : std_logic;
  signal bridge_error_o   : std_logic;

  procedure wait_clk(clk : in std_logic) is
  begin
    wait until rising_edge(clk);
  end procedure wait_clk;

  procedure verify_flag(sig : std_logic; expected : std_logic; msg : string) is
  begin
    if sig /= expected then
      report "FAIL: " & msg severity failure;
    end if;
  end procedure verify_flag;
begin
  clk_i <= not clk_i after CLK_PERIOD / 2;

  dut : entity work.uart_spi_bridge
    port map (
      clk_i => clk_i, rst_i => rst_i,
      uart_rx_i => uart_rx_i, uart_tx_o => uart_tx_o,
      spi_sclk_o => spi_sclk_o, spi_mosi_o => spi_mosi_o, spi_miso_i => spi_miso_i, spi_cs_o => spi_cs_o,
      rx_valid_i => rx_valid_i, rx_data_i => rx_data_i, tx_ready_o => tx_ready_o,
      spi_miso_valid_i => spi_miso_valid_i, spi_miso_data_i => spi_miso_data_i, spi_tx_ready_o => spi_tx_ready_o,
      bridge_busy_o => bridge_busy_o, bridge_error_o => bridge_error_o
    );

  stim_proc : process
  begin
    rst_i <= '1';
    wait for 20 ns;
    rst_i <= '0';
    wait for 20 ns;

    rx_valid_i <= '1';
    rx_data_i <= x"55";
    wait until tx_ready_o = '1' and bridge_busy_o = '0';
    wait_clk(clk_i);
    wait until bridge_busy_o = '1';
    wait until bridge_busy_o = '0';
    verify_flag(bridge_error_o, '0', "Nominal Error Flag");

    rx_valid_i <= '0';
    wait for 50 ns;
    verify_flag(bridge_error_o, '0', "Post Error Flag");

    report "Simulation completed successfully." severity note;
    std.env.stop(0);
  end process stim_proc;
end architecture sim;