library ieee;
use ieee.std_logic_1164.all;

entity bridge_ctrl is
    port (
        clk_i         : in  std_logic;
        rst_i         : in  std_logic;
        -- UART side
        uart_rx_data_i: in  std_logic;
        uart_tx_o     : out std_logic;
        uart_tx_busy_o: out std_logic;
        -- SPI side
        spi_mosi_o    : out std_logic;
        spi_sclk_o    : out std_logic;
        spi_cs_n_o    : out std_logic;
        spi_miso_i    : in  std_logic;
        -- Status outputs (computed from internal signals, never read back)
        busy_o        : out std_logic;
        error_o       : out std_logic;
        rx_valid_o    : out std_logic;
        rx_data_o     : out std_logic_vector(7 downto 0);
        tx_fifo_full_o: out std_logic;
        rx_fifo_empty_o: out std_logic;
        -- UART RX side (from uart_rx)
        uart_rx_valid_i   : in  std_logic;
        uart_rx_byte_i    : in  std_logic_vector(7 downto 0);
        uart_rx_err_frame_i: in  std_logic
    );
end entity bridge_ctrl;

architecture rtl of bridge_ctrl is
    component fifo_8x8 is
        generic (
            WIDTH : integer := 8;
            DEPTH : integer := 8
        );
        port (
            clk_i   : in  std_logic;
            rst_i   : in  std_logic;
            wr_en_i : in  std_logic;
            rd_en_i : in  std_logic;
            din_i   : in  std_logic_vector(WIDTH-1 downto 0);
            dout_o  : out std_logic_vector(WIDTH-1 downto 0);
            full_o  : out std_logic;
            empty_o : out std_logic
        );
    end component;

    component uart_tx is
        port (
            clk_i      : in  std_logic;
            rst_i      : in  std_logic;
            tx_data_i  : in  std_logic_vector(7 downto 0);
            start_i    : in  std_logic;
            busy_o     : out std_logic;
            tx_data_o  : out std_logic
        );
    end component;

    component spi_master is
        port (
            clk_i           : in  std_logic;
            rst_i           : in  std_logic;
            tx_data_i       : in  std_logic_vector(7 downto 0);
            tx_start_i      : in  std_logic;
            tx_done_o       : out std_logic;
            tx_busy_o       : out std_logic;
            mosi_o          : out std_logic;
            sclk_o          : out std_logic;
            cs_n_o          : out std_logic;
            miso_i          : in  std_logic;
            rx_data_o       : out std_logic_vector(7 downto 0);
            rx_valid_o      : out std_logic
        );
    end component;

    type ctrl_state_t is (IDLE, UART_RX_WAIT, SPI_TX, SPI_RX, UART_TX_RESPONSE, ERROR_RECOVER, DONE);
    signal state_s          : ctrl_state_t := IDLE;
    signal uart_rx_valid_i  : in  std_logic;
    -- Internal FIFO connections
    signal tx_wr_en_s       : std_logic;
    signal tx_rd_en_s       : std_logic;
    signal tx_din_s         : std_logic_vector(7 downto 0);
    signal tx_dout_s        : std_logic_vector(7 downto 0);
    signal tx_full_s        : std_logic;
    signal tx_empty_s       : std_logic;

    signal rx_wr_en_s       : std_logic;
    signal rx_rd_en_s       : std_logic;
    signal rx_din_s         : std_logic_vector(7 downto 0);
    signal rx_dout_s        : std_logic_vector(7 downto 0);
    signal rx_full_s        : std_logic;
    signal rx_empty_s       : std_logic;

    -- SPI master connections
    signal spi_tx_start_s   : std_logic;
    signal spi_tx_done_s    : std_logic;
    signal spi_rx_valid_s   : std_logic;
    signal spi_mosi_s       : std_logic;
    signal spi_sclk_s       : std_logic;
    signal spi_cs_n_s       : std_logic;

  signal uart_tx_busy_o_int : std_logic;
begin
    -- TX FIFO (UART -> SPI)
    tx_fifo_inst : fifo_8x8
        generic map (WIDTH => 8, DEPTH => 8)
        port map (
            clk_i   => clk_i,
            rst_i   => rst_i,
            wr_en_i => tx_wr_en_s,
            rd_en_i => tx_rd_en_s,
            din_i   => uart_rx_byte_i,
            dout_o  => tx_dout_s,
            full_o  => tx_full_s,
            empty_o => tx_empty_s
        );

    -- RX FIFO (SPI -> UART response)
    rx_fifo_inst : fifo_8x8
        generic map (WIDTH => 8, DEPTH => 8)
        port map (
            clk_i   => clk_i,
            rst_i   => rst_i,
            wr_en_i => rx_wr_en_s,
            rd_en_i => rx_rd_en_s,
            din_i   => spi_rx_valid_s & spi_mosi_s & spi_sclk_s & spi_cs_n_s & "0000",  -- simplified: use rx_data from spi_master
            dout_o  => rx_dout_s,
            full_o  => rx_full_s,
            empty_o => rx_empty_s
        );

    -- UART TX
    uart_tx_inst : uart_tx
        port map (
            clk_i      => clk_i,
            rst_i      => rst_i,
            tx_data_i  => rx_dout_s,
            start_i    => uart_tx_start_s,
            busy_o     => uart_tx_busy_o_int,
            tx_data_o  => uart_tx_o
        );

    -- SPI Master
    spi_master_inst : spi_master
        port map (
            clk_i           => clk_i,
            rst_i           => rst_i,
            tx_data_i       => tx_dout_s,
            tx_start_i      => spi_tx_start_s,
            tx_done_o       => spi_tx_done_s,
            tx_busy_o       => open,
            mosi_o          => spi_mosi_s,
            sclk_o          => spi_sclk_s,
            cs_n_o          => spi_cs_n_s,
            miso_i          => spi_miso_i,
            rx_data_o       => spi_rx_valid_s & spi_mosi_s & spi_sclk_s & spi_cs_n_s & "0000",  -- simplified
            rx_valid_o      => open
        );

    -- Control FSM process
    process(clk_i)
        variable uart_tx_start_int : std_logic;
        variable rx_wr_en_int      : std_logic;
        variable tx_rd_en_int      : std_logic;
        variable spi_tx_start_int  : std_logic;
    begin
        if rising_edge(clk_i) then
            if rst_i = '1' then
                state_s           <= IDLE;
                uart_rx_valid_i   <= '0';
                tx_wr_en_s        <= '0';
                tx_rd_en_s        <= '0';
                rx_wr_en_s        <= '0';
                rx_rd_en_s        <= '0';
                spi_tx_start_s    <= '0';
                uart_tx_start_s   <= '0';
            else
                uart_rx_valid_i  <= '0';
                tx_wr_en_s       <= '0';
                tx_rd_en_s       <= '0';
                rx_wr_en_s       <= '0';
                rx_rd_en_s       <= '0';
                spi_tx_start_s   <= '0';
                uart_tx_start_s  <= '0';

                case state_s is
                    when IDLE =>
                        if uart_rx_valid_i = '1' and tx_full_s = '0' then
                            tx_wr_en_s  <= '1';
                            state_s     <= UART_RX_WAIT;
                        elsif uart_rx_err_frame_i = '1' then
                            state_s <= ERROR_RECOVER;
                        end if;

                    when UART_RX_WAIT =>
                        -- Wait for FIFO data to be ready for SPI
                        if tx_empty_s = '0' and spi_tx_done_s = '1' then
                            tx_rd_en_s  <= '1';
                            spi_tx_start_s <= '1';
                            state_s     <= SPI_TX;
                        end if;

                    when SPI_TX =>
                        -- Wait for SPI transaction to complete
                        if spi_tx_done_s = '0' then
                            -- still transmitting, stay here
                            null;
                        else
                            rx_wr_en_s  <= '1';
                            state_s     <= SPI_RX;
                        end if;

                    when SPI_RX =>
                        -- Wait for RX FIFO to have data
                        if rx_empty_s = '0' and uart_tx_busy_o_int = '0' then
                            rx_rd_en_s  <= '1';
                            uart_tx_start_s <= '1';
                            state_s     <= UART_TX_RESPONSE;
                        end if;

                    when UART_TX_RESPONSE =>
                        -- Wait for UART TX to complete
                        if uart_tx_busy_o_int = '1' then
                            null;
                        else
                            state_s <= IDLE;
                        end if;

                    when ERROR_RECOVER =>
                        -- Clear FIFOs and return to idle
                        state_s <= IDLE;

                    when DONE =>
                        state_s <= IDLE;
                end case;
            end if;
        end if;
    end process;

    -- Status outputs (computed from internal signals)
    busy_o       <= '1' when state_s /= IDLE else '0';
    error_o      <= '1' when uart_rx_err_frame_i = '1' or tx_full_s = '1' or rx_full_s = '1' else '0';
    rx_valid_o   <= '1' when rx_empty_s = '0' and uart_tx_busy_o_int = '0' else '0';
    rx_data_o    <= rx_dout_s;
    tx_fifo_full_o := tx_full_s;
    rx_fifo_empty_o := rx_empty_s;

  uart_tx_busy_o <= uart_tx_busy_o_int;
end architecture rtl;
