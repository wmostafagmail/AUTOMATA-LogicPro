library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity uart_spi_bridge is
    generic (
        FIFO_DEPTH_G : natural := 16
    );
    port (
        clk_i           : in  std_logic;
        rst_i           : in  std_logic;
        uart_rx_i       : in  std_logic;
        uart_tx_o       : out std_logic;
        uart_rx_valid_i : in  std_logic;
        uart_rx_data_i  : in  unsigned(7 downto 0);
        uart_tx_ready_o : out std_logic;
        spi_sclk_o      : out std_logic;
        spi_mosi_o      : out std_logic;
        spi_miso_i      : in  std_logic;
        spi_csn_o       : out std_logic;
        spi_tx_valid_o  : out std_logic;
        spi_tx_data_o   : out unsigned(7 downto 0);
        spi_rx_valid_i  : in  std_logic;
        spi_rx_data_i   : in  unsigned(7 downto 0);
        spi_rx_ready_i  : in  std_logic;
        busy_o          : out std_logic;
        error_o         : out std_logic
    );
end entity uart_spi_bridge;

architecture rtl of uart_spi_bridge is
    type fifo_mem_t is array (natural range <>) of unsigned(7 downto 0);
    type fifo_ctrl_t is record
        wr_ptr : natural;
        rd_ptr : natural;
        count  : natural;
        full   : std_logic;
        empty  : std_logic;
    end record;

    signal fifo_ctrl : fifo_ctrl_t := (wr_ptr => 0, rd_ptr => 0, count => 0, full => '1', empty => '1');
    signal fifo_mem  : fifo_mem_t(0 to FIFO_DEPTH_G - 1);

    type bridge_state_t is (IDLE, TX_SHIFT, RX_SHIFT, ERROR);
    signal state_reg : bridge_state_t := IDLE;

    signal spi_shift_reg : unsigned(7 downto 0) := (others => '0');
    signal uart_bit_cnt  : natural range 0 to 7 := 0;
    signal error_int     : std_logic := '0';
    signal tx_active_int : std_logic := '0';

begin
    fifo_proc : process (clk_i)
    begin
        if rising_edge(clk_i) then
            if rst_i = '1' then
                fifo_ctrl.count <= 0;
                fifo_ctrl.full  <= '1';
                fifo_ctrl.empty <= '1';
                fifo_ctrl.wr_ptr <= 0;
                fifo_ctrl.rd_ptr <= 0;
            else
                if uart_rx_valid_i = '1' and fifo_ctrl.full = '0' then
                    fifo_mem(fifo_ctrl.wr_ptr) <= uart_rx_data_i;
                    fifo_ctrl.wr_ptr <= (fifo_ctrl.wr_ptr + 1) mod FIFO_DEPTH_G;
                    if fifo_ctrl.count = FIFO_DEPTH_G - 1 then
                        fifo_ctrl.full <= '1';
                    else
                        fifo_ctrl.count <= fifo_ctrl.count + 1;
                        fifo_ctrl.empty <= '0';
                    end if;
                elsif spi_rx_ready_i = '1' and fifo_ctrl.empty = '0' then
                    if fifo_ctrl.count = 1 then
                        fifo_ctrl.empty <= '1';
                    else
                        fifo_ctrl.count <= fifo_ctrl.count - 1;
                    end if;
                    fifo_ctrl.rd_ptr <= (fifo_ctrl.rd_ptr + 1) mod FIFO_DEPTH_G;
                    fifo_ctrl.full <= '0';
                end if;
            end if;
        end if;
    end process fifo_proc;

    bridge_proc : process (clk_i)
    begin
        if rising_edge(clk_i) then
            if rst_i = '1' then
                state_reg       <= IDLE;
                spi_shift_reg   <= (others => '0');
                uart_bit_cnt    <= 0;
                tx_active_int   <= '0';
                error_int       <= '0';
            else
                uart_tx_o       <= '1';
                uart_tx_ready_o <= '0';
                spi_csn_o       <= '1';
                spi_tx_valid_o  <= '0';
                spi_sclk_o      <= '0';
                busy_o          <= '0';
                error_o         <= error_int;

                case state_reg is
                    when IDLE =>
                        busy_o <= '1';
                        uart_tx_ready_o <= '1';
                        if fifo_ctrl.empty = '0' then
                            spi_shift_reg <= fifo_mem(fifo_ctrl.rd_ptr);
                            uart_bit_cnt  <= 0;
                            tx_active_int <= '1';
                            state_reg     <= TX_SHIFT;
                        end if;
                    when TX_SHIFT =>
                        uart_tx_o <= spi_shift_reg(uart_bit_cnt);
                        uart_bit_cnt <= uart_bit_cnt + 1;
                        spi_sclk_o   <= '1';
                        if uart_bit_cnt = 7 then
                            state_reg <= RX_SHIFT;
                        end if;
                    when RX_SHIFT =>
                        spi_csn_o    <= '0';
                        spi_tx_valid_o <= '1';
                        spi_tx_data_o  <= spi_shift_reg;
                        spi_sclk_o     <= '0';
                        if spi_rx_ready_i = '1' and spi_rx_valid_i = '1' then
                            state_reg <= IDLE;
                        elsif spi_rx_ready_i = '0' then
                            error_int <= '1';
                            state_reg <= ERROR;
                        end if;
                    when ERROR =>
                        error_int <= '1';
                        state_reg <= IDLE;
                end case;
            end if;
        end if;
    end process bridge_proc;
end architecture rtl;