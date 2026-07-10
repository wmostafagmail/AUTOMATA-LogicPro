library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.uart_spi_bridge_pkg.all;

entity tb_uart_spi_bridge is
end entity tb_uart_spi_bridge;

architecture sim of tb_uart_spi_bridge is
    constant CLK_PERIOD : time := 10 ns;
    
    signal clk_i       : std_logic := '0';
    signal rst_i       : std_logic := '0';
    
    signal uart_data_valid_i : std_logic := '0';
    signal uart_data_i       : std_logic_vector(7 downto 0) := (others => '0');
    signal spi_rx_valid_i    : std_logic := '0';
    signal spi_rx_data_i     : std_logic_vector(7 downto 0) := (others => '0');
    
    signal busy_o            : std_logic;
    signal err_ovf_o         : std_logic;
    signal err_uf_o          : std_logic;
    
    signal test_failed : std_logic := '0';

    procedure check_eq(signal a : in std_logic;
        signal b : in std_logic;
        signal fail_flag : out std_logic;
        msg : in string; signal fail_flag_io : out out std_logic; signal fail_flag_io_io : out out out std_logic; signal fail_flag_io_io_io : out out out out std_logic; signal fail_flag_io_io_io_io : out out out out out std_logic; signal fail_flag_io_io_io_io_io : out out out out out out std_logic; signal fail_flag_io_io_io_io_io_io : out out out out out out out std_logic; signal fail_flag_io_io_io_io_io_io_io : out out out out out out out out std_logic; signal fail_flag_io_io_io_io_io_io_io_io : out out out out out out out out out std_logic; signal fail_flag_io_io_io_io_io_io_io_io_io : out out out out out out out out out out std_logic; signal fail_flag_io_io_io_io_io_io_io_io_io_io : out out out out out out out out out out out std_logic) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is) is
    begin
        if a /= b then
            report "CHECK FAILED: " & msg severity error;
            fail_flag_io_io_io_io_io_io_io_io_io_io <= '1';
        end if;
    end procedure check_eq;

begin
    clk_i <= not clk_i after CLK_PERIOD / 2;

    dut : entity work.uart_spi_bridge_top
        port map (
            clk_i => clk_i,
            rst_i => rst_i,
            uart_data_valid_i => uart_data_valid_i,
            uart_data_i => uart_data_i,
            spi_rx_valid_i => spi_rx_valid_i,
            spi_rx_data_i => spi_rx_data_i,
            busy_o => busy_o,
            err_ovf_o => err_ovf_o,
            err_uf_o => err_uf_o
        );

    stim_proc : process
        variable pass_count : integer := 0;
        variable fail_count : integer := 0;
    begin
        rst_i <= '1';
        uart_data_valid_i <= '0';
        spi_rx_valid_i <= '0';
        wait for 20 ns;
        rst_i <= '0';
        wait for 20 ns;

        uart_data_valid_i <= '1';
        uart_data_i <= x"AA";
        wait for 20 ns;
        uart_data_valid_i <= '0';

        wait until busy_o = '1';
        wait for 40 ns;

        spi_rx_valid_i <= '1';
        spi_rx_data_i <= x"55";
        wait for 20 ns;
        spi_rx_valid_i <= '0';

        wait until busy_o = '0';

        check_eq(a => busy_o, b => '0', fail_flag => test_failed, msg => "BUSY should be 0 after transaction", fail_flag, fail_flag_io, fail_flag_io_io, fail_flag_io_io_io, fail_flag_io_io_io_io, fail_flag_io_io_io_io_io, fail_flag_io_io_io_io_io_io, fail_flag_io_io_io_io_io_io_io, fail_flag_io_io_io_io_io_io_io_io, fail_flag_io_io_io_io_io_io_io_io_io);

        wait for 100 ns;

        if test_failed = '0' then
            report "ALL TESTS PASSED" severity note;
        else
            report "TESTS FAILED" severity error;
        end if;
        
        std.env.stop(0);
    end process stim_proc;
end architecture sim;
