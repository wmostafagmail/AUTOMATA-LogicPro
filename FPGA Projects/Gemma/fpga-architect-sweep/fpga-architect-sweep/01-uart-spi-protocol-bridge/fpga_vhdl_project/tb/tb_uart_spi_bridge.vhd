library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;

entity tb_uart_spi_bridge is
end entity tb_uart_spi_bridge;

architecture sim of tb_uart_spi_bridge is
    constant CLK_PERIOD_NS : time := 10 ns;
    constant FIFO_DEPTH_G  : natural := 16;

    signal clk_i               : std_logic := '0';
    signal rst_i               : std_logic := '0';
    signal uart_rx_i           : std_logic := '1';
    signal uart_tx_o           : std_logic;
    signal uart_rx_valid_i     : std_logic := '0';
    signal uart_rx_data_i      : unsigned(7 downto 0) := (others => '0');
    signal uart_tx_ready_o     : std_logic;
    signal spi_sclk_o          : std_logic;
    signal spi_mosi_o          : std_logic;
    signal spi_miso_i          : std_logic := '0';
    signal spi_csn_o           : std_logic;
    signal spi_tx_valid_o      : std_logic;
    signal spi_tx_data_o       : unsigned(7 downto 0);
    signal spi_rx_valid_i      : std_logic := '0';
    signal spi_rx_data_i       : unsigned(7 downto 0) := (others => '0');
    signal spi_rx_ready_i      : std_logic := '0';
    signal busy_o              : std_logic;
    signal error_o             : std_logic;

    procedure check_pass(msg : in string; p_cnt : in out natural) is
    begin
        report "PASS: " & msg severity note;
        p_cnt := p_cnt + 1;
    end procedure check_pass;

    procedure check_fail(msg : in string; f_cnt : in out natural) is
    begin
        report "FAIL: " & msg severity error;
        f_cnt := f_cnt + 1;
    end procedure check_fail;

begin
    clk_i <= not clk_i after CLK_PERIOD_NS / 2;

    dut : entity work.uart_spi_bridge(rtl)
        generic map (FIFO_DEPTH_G => FIFO_DEPTH_G)
        port map (
            clk_i             => clk_i,
            rst_i             => rst_i,
            uart_rx_i         => uart_rx_i,
            uart_tx_o         => uart_tx_o,
            uart_rx_valid_i   => uart_rx_valid_i,
            uart_rx_data_i    => uart_rx_data_i,
            uart_tx_ready_o   => uart_tx_ready_o,
            spi_sclk_o        => spi_sclk_o,
            spi_mosi_o        => spi_mosi_o,
            spi_miso_i        => spi_miso_i,
            spi_csn_o         => spi_csn_o,
            spi_tx_valid_o    => spi_tx_valid_o,
            spi_tx_data_o     => spi_tx_data_o,
            spi_rx_valid_i    => spi_rx_valid_i,
            spi_rx_data_i     => spi_rx_data_i,
            spi_rx_ready_i    => spi_rx_ready_i,
            busy_o            => busy_o,
            error_o           => error_o
        );

    stim_proc : process
        variable p_cnt : natural := 0;
        variable f_cnt : natural := 0;
    begin
        rst_i <= '1';
        wait for CLK_PERIOD_NS * 5;
        rst_i <= '0';
        wait for CLK_PERIOD_NS * 5;

        uart_rx_valid_i <= '1';
        uart_rx_data_i  <= to_unsigned(16#AA#, 8);
        wait until rising_edge(clk_i);
        wait until uart_tx_ready_o = '1';
        uart_rx_valid_i <= '0';
        wait for CLK_PERIOD_NS * 10;
        if error_o = '0' then
            check_pass("Nominal UART to SPI transfer completed", p_cnt);
        else
            check_fail("Nominal transfer generated error", f_cnt);
        end if;

        uart_rx_valid_i <= '1';
        uart_rx_data_i  <= to_unsigned(16#55#, 8);
        spi_rx_ready_i  <= '0';
        wait until rising_edge(clk_i);
        wait until uart_tx_ready_o = '1';
        uart_rx_valid_i <= '0';
        wait for CLK_PERIOD_NS * 10;
        if error_o = '1' then
            check_pass("SPI timeout error handled correctly", p_cnt);
        else
            check_fail("SPI timeout error not detected", f_cnt);
        end if;

        wait for CLK_PERIOD_NS * 5;
        assert (p_cnt = 2 and f_cnt = 0)
            report "Simulation finished with failures"
            severity failure;
        std.env.stop(0);
    end process stim_proc;
end architecture sim;
