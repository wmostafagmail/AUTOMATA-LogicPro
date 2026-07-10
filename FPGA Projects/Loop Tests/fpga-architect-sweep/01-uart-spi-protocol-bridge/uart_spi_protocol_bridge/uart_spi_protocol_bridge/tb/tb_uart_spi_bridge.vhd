library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bridge_types_pkg.all;
use std.env.all;

entity tb_uart_spi_bridge is
end entity tb_uart_spi_bridge;

architecture sim of tb_uart_spi_bridge is
  constant CLK_PERIOD : time := 10 ns;
  constant DATA_WIDTH : integer := 8;
  
  signal clk_sig         : std_logic := '0';
  signal rst_sig         : std_logic := '0';
  signal uart_rx_sig     : std_logic := '0';
  signal spi_miso_sig    : std_logic := '0';
  signal wr_req_sig      : std_logic := '0';
  signal wr_data_sig     : std_logic_vector(DATA_WIDTH-1 downto 0) := (others => '0');
  
  signal busy_sig        : std_logic;
  signal err_sig         : std_logic;
  signal data_avail_sig  : std_logic;
  
  signal test_failed     : std_logic := '0';
  
begin
  clk_sig <= not clk_sig after CLK_PERIOD/2;

  dut : entity work.uart_spi_bridge(rtl)
    generic map (FIFO_DEPTH => 16, DATA_WIDTH => 8)
    port map (
      clk_i        => clk_sig,
      rst_i        => rst_sig,
      uart_rx_i    => uart_rx_sig,
      uart_tx_o    => open,
      spi_sclk_o   => open,
      spi_mosi_o   => open,
      spi_miso_i   => spi_miso_sig,
      spi_cs_o     => open,
      busy_o       => busy_sig,
      err_o        => err_sig,
      data_avail_o => data_avail_sig,
      wr_req_i     => wr_req_sig,
      wr_data_i    => wr_data_sig,
      rd_req_i     => '0',
      rd_data_o    => open
    );

  stim_proc : process
    variable local_test_failed : std_logic := '0';
  begin
    -- Reset sequence
    wait until rising_edge(clk_sig);
    rst_sig <= '1';
    wait until rising_edge(clk_sig);
    rst_sig <= '0';
    
    wait until rising_edge(clk_sig);
    
    -- UART RX simulation: send 0xAA (10101010)
    uart_rx_sig <= '0'; wait until rising_edge(clk_sig);
    uart_rx_sig <= '0'; wait until rising_edge(clk_sig);
    uart_rx_sig <= '1'; wait until rising_edge(clk_sig);
    uart_rx_sig <= '0'; wait until rising_edge(clk_sig);
    uart_rx_sig <= '1'; wait until rising_edge(clk_sig);
    uart_rx_sig <= '0'; wait until rising_edge(clk_sig);
    uart_rx_sig <= '1'; wait until rising_edge(clk_sig);
    uart_rx_sig <= '0'; wait until rising_edge(clk_sig);
    uart_rx_sig <= '1'; wait until rising_edge(clk_sig);
    
    -- Trigger write
    wr_data_sig <= x"AA";
    wr_req_sig  <= '1';
    wait until rising_edge(clk_sig);
    wr_req_sig  <= '0';
    
    -- Wait for completion
    wait for 500 ns;
    
    if err_sig = '1' then
      local_test_failed := '1';
    end if;
    
    if local_test_failed = '0' then
      report "PASS: UART-SPI Bridge simulation completed successfully." severity note;
      std.env.stop(0);
    else
      report "FAIL: UART-SPI Bridge simulation detected errors." severity error;
      std.env.stop(1);
    end if;
    
    wait;
  end process stim_proc;

end architecture sim;