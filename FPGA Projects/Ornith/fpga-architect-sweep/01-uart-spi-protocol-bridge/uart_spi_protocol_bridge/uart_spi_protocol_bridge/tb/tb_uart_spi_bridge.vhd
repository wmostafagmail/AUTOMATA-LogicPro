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

    signal clk_s       : std_logic := '0';
    signal rst_s       : std_logic := '0';
    signal uart_rx_s   : std_logic := '1';
    signal spi_miso_s  : std_logic := '1';

    -- Monitor signals for DUT outputs we need to observe.
    signal mon_error_s     : std_logic;
    signal mon_rx_valid_s  : std_logic;
    signal mon_rx_data_s   : std_logic_vector(7 downto 0);
    signal mon_busy_s      : std_logic;

    component bridge_ctrl is
        port (
            clk_i           : in  std_logic;
            rst_i           : in  std_logic;
            uart_rx_data_i  : in  std_logic;
            spi_miso_i      : in  std_logic;
            uart_tx_o       : out std_logic;
            spi_mosi_o      : out std_logic;
            spi_sclk_o      : out std_logic;
            spi_cs_n_o      : out std_logic;
            busy_o          : out std_logic;
            error_o         : out std_logic;
            rx_valid_o      : out std_logic;
            rx_data_o       : out std_logic_vector(7 downto 0);
            tx_fifo_full_o  : out std_logic;
            rx_fifo_empty_o : out std_logic
        );
    end component bridge_ctrl;

    procedure send_uart_byte(signal uart_rx_sig_io : inout std_logic;
                             constant bit_period_i   : in time;
                             byte_val                : in std_logic_vector(7 downto 0)) is
        variable bit_idx_v : integer range 0 to 7;
    begin
        -- Start bit (low).
        uart_rx_sig_io <= '0';
        wait for bit_period_i * 5;

        -- Data bits MSB first.
        for bit_idx_v in 7 downto 0 loop
            uart_rx_sig_io <= byte_val(bit_idx_v);
            wait for bit_period_i * 4;
        end loop;

        -- Stop bit (high).
        uart_rx_sig_io <= '1';
        wait for bit_period_i * 5;
    end procedure send_uart_byte;

begin

    dut_inst : bridge_ctrl
        port map (
            clk_i           => clk_s,
            rst_i           => rst_s,
            uart_rx_data_i  => uart_rx_s,
            spi_miso_i      => spi_miso_s,
            uart_tx_o       => open,
            spi_mosi_o      => open,
            spi_sclk_o      => open,
            spi_cs_n_o      => open,
            busy_o          => mon_busy_s,
            error_o         => mon_error_s,
            rx_valid_o      => mon_rx_valid_s,
            rx_data_o       => mon_rx_data_s,
            tx_fifo_full_o  => open,
            rx_fifo_empty_o => open
        );

    clk_gen : process
    begin
        clk_s <= '0';
        wait for CLK_PERIOD / 2;
        clk_s <= '1';
        wait for CLK_PERIOD / 2;
    end process clk_gen;

    stim_proc : process
        variable pass_count_v : integer := 0;
        variable fail_count_v : integer := 0;
    begin
        -- Reset sequence.
        rst_s          <= '0';
        uart_rx_s      <= '1';
        spi_miso_s     <= '1';
        wait for CLK_PERIOD * 2;
        rst_s          <= '1';
        wait until rising_edge(clk_s);
        wait for CLK_PERIOD * 2;
        rst_s          <= '0';

        -- Wait for reset to settle.
        wait until rising_edge(clk_s);
        wait for CLK_PERIOD * 2;

        -- Test 1: Nominal UART -> SPI transfer.
        report "TEST 1: Nominal UART->SPI transfer";
        send_uart_byte(uart_rx_s, BIT_PERIOD, x"AA");
        wait for BIT_PERIOD * 30;

        if mon_rx_valid_s = '1' and mon_rx_data_s = x"AA" then
            pass_count_v := pass_count_v + 1;
            report "TEST 1 PASSED";
        else
            fail_count_v := fail_count_v + 1;
            assert false severity failure
                report "FAIL TEST 1: Expected valid='1' and data=x""AA"", got valid=" & std_logic'image(mon_rx_valid_s) & " data=" & std_logic_vector'image(mon_rx_data_s);
        end if;

        -- Test 2: FIFO overflow detection.
        report "TEST 2: FIFO overflow handling";
        for i in 0 to 9 loop
            send_uart_byte(uart_rx_s, BIT_PERIOD, std_logic_vector(to_unsigned(i + 1, 8)));
            wait until rising_edge(clk_s);
        end loop;

        wait for BIT_PERIOD * 20;
        if mon_error_s = '1' then
            pass_count_v := pass_count_v + 1;
            report "TEST 2 PASSED";
        else
            fail_count_v := fail_count_v + 1;
            assert false severity failure
                report "FAIL TEST 2: Expected error_o='1' on overflow";
        end if;

        -- Test 3: SPI MISO response path.
        report "TEST 3: SPI MISO response handling";
        rst_s <= '0';
        wait for CLK_PERIOD * 2;
        rst_s <= '1';
        wait until rising_edge(clk_s);
        wait for CLK_PERIOD * 2;
        rst_s     <= '0';

        spi_miso_s <= '0';
        send_uart_byte(uart_rx_s, BIT_PERIOD, x"55");
        wait for BIT_PERIOD * 30;

        if mon_rx_valid_s = '1' then
            pass_count_v := pass_count_v + 1;
            report "TEST 3 PASSED";
        else
            fail_count_v := fail_count_v + 1;
            assert false severity failure
                report "FAIL TEST 3: Expected rx_valid_o='1' after MISO response";
        end if;

        report "ALL TESTS PASSED";
        std.env.stop(0);
    end process stim_proc;

end architecture sim;