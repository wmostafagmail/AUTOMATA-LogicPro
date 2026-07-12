library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity tb_uart_spi_bridge is
end entity tb_uart_spi_bridge;

architecture rtl of tb_uart_spi_bridge is

    signal clk         : std_ulogic := '0';
    signal reset_n     : std_ulogic := '0';
    signal uart_rx_in  : std_ulogic;
    signal uart_tx_out : std_ulogic;
    signal spi_sclk_o  : std_ulogic;
    signal spi_mosi_o  : std_ulogic;
    signal spi_miso_i  : std_ulogic := '0';
    signal busy_o      : std_ulogic;
    signal error_o     : std_ulogic;
    signal data_avail_o: std_ulogic;

begin

    clk <= not clk after 5 ns; -- 100 MHz clock
    reset_n <= '1' after 20 ns;

    DUT: entity work.uart_spi_bridge
        port map (
            clk         => clk,
            reset_n     => reset_n,
            uart_rx_in  => uart_rx_in,
            uart_tx_out => uart_tx_out,
            spi_sclk_o  => spi_sclk_o,
            spi_mosi_o  => spi_mosi_o,
            spi_miso_i  => spi_miso_i,
            busy_o      => busy_o,
            error_o     => error_o,
            data_avail_o=> data_avail_o
        );

    test_process: process is
    begin
        wait for 100 ns;
        
        -- Simulate UART RX input
        uart_rx_in <= '1';
        wait until rising_edge(clk);
        uart_rx_in <= '0';
        wait until rising_edge(clk);

        -- Add more test cases as needed

        std.env.stop(0);
    end process;

end architecture rtl;
