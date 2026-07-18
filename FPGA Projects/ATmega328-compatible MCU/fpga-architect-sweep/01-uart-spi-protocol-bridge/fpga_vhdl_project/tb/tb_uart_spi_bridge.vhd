library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;
use work.uart_spi_bridge_pkg.all;

entity tb_uart_spi_bridge is
end entity;

architecture sim of tb_uart_spi_bridge is
  signal clk : std_logic := '0';
  signal rst : std_logic := '1';
  signal uart_rx_sig : std_logic := '1';
  signal spi_miso_sig : std_logic := '0';
  signal data_avail_sig : std_logic;
  signal err_sig : std_logic;
  signal busy_sig : std_logic;
  
  procedure wait_clk(signal clk_i : in std_logic) is
  begin
    wait until rising_edge(clk_i);
  end procedure;
  
  procedure check_eq(
    constant label_text : in string;
    constant got         : in std_logic;
    constant expected    : in std_logic;
    variable failed_io   : inout boolean
  ) is
  begin
    if got /= expected then
      failed_io := true;
      report "FAIL " & label_text severity error;
    end if;
  end procedure;
  
begin
  clk <= not clk after 5 ns;
  
  dut : entity work.uart_spi_bridge
    port map (
      clk_i => clk,
      rst_i => rst,
      uart_rx_i => uart_rx_sig,
      uart_tx_o => open,
      spi_sclk_o => open,
      spi_mosi_o => open,
      spi_miso_i => spi_miso_sig,
      spi_cs_o => open,
      busy_o => busy_sig,
      err_o => err_sig,
      data_avail_o => data_avail_sig
    );
    
  stimulus : process
    variable failed : boolean := false;
  begin
    rst <= '1';
    wait for 20 ns;
    rst <= '0';
    wait until rising_edge(clk);
    
    uart_rx_sig <= '0';
    wait until rising_edge(clk);
    uart_rx_sig <= '1';
    wait for 80 ns;
    uart_rx_sig <= '1';
    wait for 10 ns;
    
    wait until busy_sig = '0';
    wait for 20 ns;
    
    check_eq("data_avail_nominal", data_avail_sig, '1', failed);
    check_eq("err_nominal", err_sig, '0', failed);
    
    if failed then
      report "TEST FAILED" severity failure;
    else
      report "TEST PASSED" severity note;
      std.env.stop(0);
    end if;
  end process;
end architecture;