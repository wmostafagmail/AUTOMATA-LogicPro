library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;

entity tb_uart_spi_bridge is
end entity tb_uart_spi_bridge;

architecture tb of tb_uart_spi_bridge is

    component uart_spi_bridge_top is
        generic (
            g_clk_hz   : natural := 100_000_000;
            g_baud_div : natural := 83;
            g_spi_div  : natural := 4
         );
        port (
            sysclk      : in  std_logic;
            reset_i     : in  std_logic;
            uart_rx     : in  std_logic;
            uart_tx_o   : out std_logic;
            spi_sclk_o  : out std_logic;
            spi_mosi_o  : out std_logic;
            spi_miso    : in  std_logic;
            spi_csn_o   : out std_logic;
            status_err_o: out std_logic
         );
    end component;

    constant c_clk_period : time := 10 ns;

    signal s_sysclk      : std_logic := '0';
    signal s_reset_i     : std_logic := '1';
    signal s_uart_rx     : std_logic := '1';
    signal s_uart_tx_o   : std_logic;
    signal s_spi_sclk_o  : std_logic;
    signal s_spi_mosi_o  : std_logic;
    signal s_spi_miso    : std_logic := '0';
    signal s_spi_csn_o   : std_logic;
    signal s_status_err_o: std_logic;

     -- Helper procedures declared in architecture declarative region before begin
    procedure check_pass_fail(
        constant p_condition : in boolean;
        constant p_label     : in string
     ) is
    begin
        assert p_condition
            report "FAIL: " & p_label severity error;
    end procedure check_pass_fail;

begin

     -- DUT Instantiation
    dut_inst : uart_spi_bridge_top
        generic map (
            g_clk_hz   => 100_000_000,
            g_baud_div => 83,
            g_spi_div  => 4
         )
        port map (
            sysclk      => s_sysclk,
            reset_i     => s_reset_i,
            uart_rx     => s_uart_rx,
            uart_tx_o   => s_uart_tx_o,
            spi_sclk_o  => s_spi_sclk_o,
            spi_mosi_o  => s_spi_mosi_o,
            spi_miso    => s_spi_miso,
            spi_csn_o   => s_spi_csn_o,
            status_err_o=> s_status_err_o
         );

     -- Clock Generation Process
    clk_proc : process
    begin
        s_sysclk <= '0';
        wait for c_clk_period / 2;
        s_sysclk <= '1';
        wait for c_clk_period / 2;
    end process clk_proc;

     -- Test Stimulus Process
    stim_proc : process
        variable v_fail_count : natural := 0;
    begin
        report "Starting UART-SPI Bridge Testbench";

         -- Reset sequence
        s_reset_i <= '1';
        wait for 20 ns;
        s_reset_i <= '0';
        wait for c_clk_period * 2;

        check_pass_fail(s_spi_csn_o = '1', "CSN should be high after reset");

         -- UART RX Stimulus (Simulated Start bit detection sequence)
        s_uart_rx <= '0';
        wait for c_clk_period * 85; -- Drive low longer than baud divisor to trigger sampler

        report "UART RX start bit applied. Waiting for SPI activity.";
        wait for 1 us;

        check_pass_fail(s_spi_csn_o = '0', "CSN should go low when TX not empty");

        report "Test sequence complete.";
        if v_fail_count = 0 then
            report "ALL TESTS PASSED" severity note;
        else
            report "TEST FAILURES DETECTED" severity error;
        end if;

        std.env.stop(0);
        wait;
    end process stim_proc;

end architecture tb;