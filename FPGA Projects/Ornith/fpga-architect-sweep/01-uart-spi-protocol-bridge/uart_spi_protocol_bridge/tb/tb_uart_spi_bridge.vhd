library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;

entity tb_uart_spi_bridge is
end entity tb_uart_spi_bridge;

architecture sim of tb_uart_spi_bridge is
    constant CLK_FREQ   : integer := 100_000_000;
    constant CLK_PERIOD : time    := 10 ns;
    constant BAUD_RATE  : integer := 9600;
    constant BIT_PERIOD : time    := to_time(CLK_FREQ) / to_time(BAUD_RATE);

    signal clk_s        : std_logic := '0';
    signal rst_s        : std_logic := '0';
    signal uart_rx_i    : std_logic := '1';
    signal spi_mosi_o   : std_logic;
    signal spi_sclk_o   : std_logic;
    signal spi_cs_n_o   : std_logic;
    signal spi_miso_i   : std_logic := '1';
    signal busy_o       : std_logic;
    signal error_o      : std_logic;
    signal rx_valid_o   : std_logic;
    signal rx_data_o    : std_logic_vector(7 downto 0);

    component bridge_ctrl is
        port (
            clk_i       : in  std_logic;
            rst_i       : in  std_logic;
            uart_rx_i   : in  std_logic;
            uart_tx_o   : out std_logic;
            spi_mosi_o  : out std_logic;
            spi_sclk_o  : out std_logic;
            spi_cs_n_o  : out std_logic;
            spi_miso_i  : in  std_logic;
            busy_o      : out std_logic;
            error_o     : out std_logic;
            rx_valid_o  : out std_logic;
            rx_data_o   : out std_logic_vector(7 downto 0)
        );
    end component bridge_ctrl;

    procedure clock_pulse(signal clk_sig_io : inout std_logic; constant period_i : in time) is
    begin
        wait for period_i / 2;
        clk_sig_io <= not clk_sig_io;
        wait for period_i / 2;
    end procedure clock_pulse;

    procedure send_uart_byte(signal uart_tx_o_int : out std_logic; constant bit_period_i : in time; byte_val : in std_logic_vector(7 downto 0)) is
        variable bit_idx_v : integer range 0 to 7;
    begin
        -- Start bit (low)
        uart_tx_o_int <= '0';
        wait for bit_period_i * 5;

        -- Data bits MSB first
        for bit_idx_v in 7 downto 0 loop
            uart_tx_o_int <= byte_val(bit_idx_v);
            wait for bit_period_i * 4;
        end loop;

        -- Stop bit (high)
        uart_tx_o_int <= '1';
        wait for bit_period_i * 4;
    end procedure send_uart_byte;

begin

    dut_inst : bridge_ctrl
        port map (
            clk_i       => clk_s,
            rst_i       => rst_s,
            uart_rx_i   => uart_rx_i,
            uart_tx_o   => open,
            spi_mosi_o  => spi_mosi_o,
            spi_sclk_o  => spi_sclk_o,
            spi_cs_n_o  => spi_cs_n_o,
            spi_miso_i  => spi_miso_i,
            busy_o      => busy_o,
            error_o     => error_o,
            rx_valid_o  => rx_valid_o,
            rx_data_o   => rx_data_o
        );

    clk_gen : process
    begin
        clk_s <= '0';
        wait for CLK_PERIOD / 2;
        clk_s <= '1';
        wait for CLK_PERIOD / 2;
    end process clk_gen;

    stim_proc : process
        variable uart_rx_local : std_logic := '1';
    begin
        -- Reset sequence
        rst_s     <= '0';
        uart_rx_i <= '1';
        spi_miso_i<= '1';
        wait for CLK_PERIOD * 2;
        rst_s     <= '1';
        wait until rising_edge(clk_s);
        wait for CLK_PERIOD * 2;
        rst_s     <= '0';

        -- Test 1: Nominal UART -> SPI transfer
        report "TEST 1: Nominal UART->SPI transfer";
        send_uart_byte(uart_rx_i, BIT_PERIOD, x"AA");
        uart_rx_i <= uart_rx_local;
        wait for BIT_PERIOD * 50;

        assert rx_valid_o = '1' severity failure
            report "FAIL TEST 1: Expected rx_valid_o='1'";
        assert rx_data_o = x"AA" severity failure
            report "FAIL TEST 1: rx_data mismatch, got " & to_string(rx_data_o);
        report "TEST 1 PASSED";

        -- Test 2: FIFO overflow detection
        report "TEST 2: FIFO overflow handling";
        for i in 0 to 9 loop
            send_uart_byte(uart_rx_i, BIT_PERIOD, std_logic_vector(to_unsigned(i + 1, 8)));
            uart_rx_i <= uart_rx_local;
            wait until rising_edge(clk_s);
        end loop;

        -- Allow time for error detection
        wait for BIT_PERIOD * 20;
        assert error_o = '1' severity failure
            report "FAIL TEST 2: Expected error_o='1' on overflow";
        report "TEST 2 PASSED";

        -- Test 3: SPI MISO response path
        report "TEST 3: SPI MISO response handling";
        rst_s <= '0';
        wait for CLK_PERIOD * 2;
        rst_s <= '1';
        wait until rising_edge(clk_s);
        wait for CLK_PERIOD * 2;
        rst_s     <= '0';

        spi_miso_i <= '0';
        send_uart_byte(uart_rx_i, BIT_PERIOD, x"55");
        uart_rx_i <= uart_rx_local;
        wait for BIT_PERIOD * 30;

        assert rx_valid_o = '1' severity failure
            report "FAIL TEST 3: Expected rx_valid_o='1' after MISO response";
        report "TEST 3 PASSED";

        report "ALL TESTS PASSED";
        std.env.stop(0);
    end process stim_proc;

end architecture sim;
