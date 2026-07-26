library ieee; use ieee.std_logic_1164.all;
entity tb_bb_uart_loopback is end;
architecture sim of tb_bb_uart_loopback is
 signal clk:std_logic:='0';signal rst_n,tv,tr,line,busy,rv,fe:std_logic:='0';signal txd,rxd:std_logic_vector(7 downto 0):=(others=>'0');
begin clk<=not clk after 5 ns;
 tx:entity work.bb_uart_tx_core generic map(CLOCK_HZ=>1_000_000,BAUD_RATE=>100_000,DATA_BITS=>8) port map(clk=>clk,rst_n=>rst_n,tx_data=>txd,tx_valid=>tv,tx_ready=>tr,uart_tx=>line,busy=>busy);
 rx:entity work.bb_uart_rx_core generic map(CLOCK_HZ=>1_000_000,BAUD_RATE=>100_000,DATA_BITS=>8) port map(clk=>clk,rst_n=>rst_n,uart_rx=>line,rx_data=>rxd,rx_valid=>rv,framing_error=>fe);
 process begin wait for 20 ns;rst_n<='1';wait until tr='1';txd<=x"A6";tv<='1';wait for 10 ns;tv<='0';wait until rv='1' for 2 ms;assert rv='1' report "UART RX timeout" severity failure;assert rxd=x"A6" report "UART loopback mismatch" severity failure;assert fe='0' severity failure;assert false report "PASS tb_bb_uart_loopback" severity note;wait;end process;
end;
