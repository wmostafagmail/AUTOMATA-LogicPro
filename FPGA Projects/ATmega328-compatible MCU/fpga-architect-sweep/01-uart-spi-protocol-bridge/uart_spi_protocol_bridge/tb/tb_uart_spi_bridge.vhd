library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;

entity tb_uart_spi_bridge is
end entity tb_uart_spi_bridge;

architecture tb of tb_uart_spi_bridge is
  constant CLK_PERIOD_NS : integer := 10;
  
  signal clk_i         : std_logic := '0';
  signal rst_i         : std_logic := '0';
  signal uart_rx_i     : std_logic := '1';
  signal uart_tx_o     : std_logic;
  signal spi_sclk_o    : std_logic;
  signal spi_mosi_o    : std_logic;
  signal spi_miso_i    : std_logic := '0';
  signal spi_csn_o     : std_logic;
  signal busy_o        : std_logic;
  signal err_o         : std_logic;
  signal data_valid_o  : std_logic;
  
  signal test_failed : std_logic := '0';
  
  procedure wait_clk(signal clk : in std_logic; times : in integer) is
  begin
    for i in 1 to times loop
      wait until rising_edge(clk);
    end loop;
  end procedure wait_clk;

  procedure check_status(expected_busy : in std_logic;
                         expected_err : in std_logic;
                         expected_valid : in std_logic;
                         msg : in string;
                         signal err_flag : out std_logic) is
  begin
    if busy_o /= expected_busy or err_o /= expected_err or data_valid_o /= expected_valid then
      err_flag <= '1';
      report "FAIL: " & msg & " Expected busy=" & std_logic'image(expected_busy) & " err=" & std_logic'image(expected_err) & " valid=" & std_logic'image(expected_valid);
    else
      report "PASS: " & msg;
    end if;
  end procedure check_status;

begin

  dut : entity work.uart_spi_bridge
    port map (
      clk_i         => clk_i,
      rst_i         => rst_i,
      uart_rx_i     => uart_rx_i,
      uart_tx_o     => uart_tx_o,
      spi_sclk_o    => spi_sclk_o,
      spi_mosi_o    => spi_mosi_o,
      spi_miso_i    => spi_miso_i,
      spi_csn_o     => spi_csn_o,
      busy_o        => busy_o,
      err_o         => err_o,
      data_valid_o  => data_valid_o
    );

  clk_proc : process
  begin
    clk_i <= '0';
    wait for (CLK_PERIOD_NS / 2) * 1 ns;
    clk_i <= '1';
    wait for (CLK_PERIOD_NS / 2) * 1 ns;
  end process clk_proc;

  tb_proc : process
  begin
    rst_i <= '0';
    uart_rx_i <= '1';
    wait for (CLK_PERIOD_NS * 5) * 1 ns;
    rst_i <= '1';
    wait for (CLK_PERIOD_NS * 5) * 1 ns;
    rst_i <= '0';
    wait for (CLK_PERIOD_NS * 5) * 1 ns;
    
    wait_clk(clk_i, 10);
    check_status('0', '0', '0', "Reset Status", test_failed);
    
    uart_rx_i <= '0';
    wait_clk(clk_i, 1);
    wait_clk(clk_i, 1);
    uart_rx_i <= '1';
    
    wait_clk(clk_i, 1);
    check_status('1', '0', '0', "RX State", test_failed);
    
    wait_clk(clk_i, 1);
    check_status('1', '0', '1', "TX State", test_failed);
    
    wait_clk(clk_i, 1);
    check_status('0', '0', '0', "Idle State", test_failed);
    
    if test_failed = '0' then
      report "SUCCESS: All tests passed.";
    else
      report "FAILURE: Tests failed.";
    end if;
    
    std.env.stop(0);
  end process tb_proc;

end architecture tb;
