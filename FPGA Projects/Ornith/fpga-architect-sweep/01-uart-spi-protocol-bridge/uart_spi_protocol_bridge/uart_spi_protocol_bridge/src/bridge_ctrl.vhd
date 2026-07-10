library ieee;
use ieee.std_logic_1164.all;

entity bridge_ctrl is
    port (
        clk_i           : in  std_logic;
        rst_i           : in  std_logic;
        -- UART side
        uart_rx_data_i  : in  std_logic;
        uart_tx_o       : out std_logic;
        -- SPI side
        spi_mosi_o      : out std_logic;
        spi_sclk_o      : out std_logic;
        spi_cs_n_o      : out std_logic;
        spi_miso_i      : in  std_logic;
        -- Status outputs (computed from internal signals only)
        busy_o          : out std_logic;
        error_o         : out std_logic;
        rx_valid_o      : out std_logic;
        rx_data_o       : out std_logic_vector(7 downto 0);
        tx_fifo_full_o  : out std_logic;
        rx_fifo_empty_o : out std_logic
    );
end entity bridge_ctrl;

architecture rtl of bridge_ctrl is
    component fifo_generic is
        generic (
            WIDTH : integer := 8;
            DEPTH : integer := 8
        );
        port (
            clk_i   : in  std_logic;
            rst_i   : in  std_logic;
            wr_en_i : in  std_logic;
            rd_en_i : in  std_logic;
            din_i   : in  std_logic_vector(WIDTH - 1 downto 0);
            dout_o  : out std_logic_vector(WIDTH - 1 downto 0);
            full_o  : out std_logic;
            empty_o : out std_logic
        );
    end component fifo_generic;

    component uart_rx is
        port (
            clk_i       : in  std_logic;
            rst_i       : in  std_logic;
            rx_data_i   : in  std_logic;
            byte_o      : out std_logic_vector(7 downto 0);
            valid_o     : out std_logic;
            err_frame_o : out std_logic
        );
    end component uart_rx;

    component uart_tx is
        port (
            clk_i      : in  std_logic;
            rst_i      : in  std_logic;
            tx_data_i  : in  std_logic_vector(7 downto 0);
            start_i    : in  std_logic;
            busy_o     : out std_logic;
            tx_data_o  : out std_logic
        );
    end component uart_tx;

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
    end component spi_master;

    type ctrl_state_t is (IDLE, UART_RX_WAIT, SPI_TX, SPI_RX, UART_TX_RESPONSE, ERROR_RECOVER);

    signal state_s              : ctrl_state_t := IDLE;

    -- Decoded UART RX signals from the local uart_rx sub-block.
    signal uart_rx_valid_int    : std_logic;
    signal uart_rx_byte_int     : std_logic_vector(7 downto 0);
    signal uart_rx_err_frame_int: std_logic;

    -- TX FIFO (UART -> SPI) internal connections.
    signal tx_wr_en_s           : std_logic;
    signal tx_rd_en_s           : std_logic;
    signal tx_dout_s            : std_logic_vector(7 downto 0);
    signal tx_full_s            : std_logic;
    signal tx_empty_s           : std_logic;

    -- RX FIFO (SPI response -> UART TX) internal connections.
    signal rx_wr_en_s           : std_logic;
    signal rx_rd_en_s           : std_logic;
    signal rx_dout_s            : std_logic_vector(7 downto 0);
    signal rx_full_s            : std_logic;
    signal rx_empty_s           : std_logic;

    -- SPI master connections.
    signal spi_tx_start_s       : std_logic;
    signal spi_tx_done_s        : std_logic;
    signal spi_rx_valid_int     : std_logic;
    signal spi_rx_data_int      : std_logic_vector(7 downto 0);

    -- Internal mirror for uart_tx busy (never read back the out port).
    signal uart_tx_busy_int     : std_logic;

begin

    -- UART RX sub-block: converts raw serial bits on uart_rx_data_i into
    -- byte-valid/error-frame outputs consumed by the bridge FSM.
    uart_rx_inst : uart_rx
        port map (
            clk_i       => clk_i,
            rst_i       => rst_i,
            rx_data_i   => uart_rx_data_i,
            byte_o      => uart_rx_byte_int,
            valid_o     => uart_rx_valid_int,
            err_frame_o => uart_rx_err_frame_int
        );

    -- TX FIFO: incoming UART bytes are queued for SPI transmission.
    tx_fifo_inst : fifo_generic
        generic map (WIDTH => 8, DEPTH => 8)
        port map (
            clk_i   => clk_i,
            rst_i   => rst_i,
            wr_en_i => tx_wr_en_s,
            rd_en_i => tx_rd_en_s,
            din_i   => uart_rx_byte_int,
            dout_o  => tx_dout_s,
            full_o  => tx_full_s,
            empty_o => tx_empty_s
        );

    -- RX FIFO: SPI master response bytes are queued for UART TX.
    rx_fifo_inst : fifo_generic
        generic map (WIDTH => 8, DEPTH => 8)
        port map (
            clk_i   => clk_i,
            rst_i   => rst_i,
            wr_en_i => rx_wr_en_s,
            rd_en_i => rx_rd_en_s,
            din_i   => spi_rx_data_int,
            dout_o  => rx_dout_s,
            full_o  => rx_full_s,
            empty_o => rx_empty_s
        );

    -- SPI master: transmits from the TX FIFO and captures MISO response.
    spi_master_inst : spi_master
        port map (
            clk_i           => clk_i,
            rst_i           => rst_i,
            tx_data_i       => tx_dout_s,
            tx_start_i      => spi_tx_start_s,
            tx_done_o       => spi_tx_done_s,
            tx_busy_o       => open,
            mosi_o          => spi_mosi_o,
            sclk_o          => spi_sclk_o,
            cs_n_o          => spi_cs_n_o,
            miso_i          => spi_miso_i,
            rx_data_o       => spi_rx_data_int,
            rx_valid_o      => spi_rx_valid_int
        );

    -- Control FSM process.
    process(clk_i)
    begin
        if rising_edge(clk_i) then
            if rst_i = '1' then
                state_s          <= IDLE;
                tx_wr_en_s       <= '0';
                tx_rd_en_s       <= '0';
                rx_wr_en_s       <= '0';
                rx_rd_en_s       <= '0';
                spi_tx_start_s   <= '0';
            else

                -- Default-disable all control signals; FSM arms only those needed.
                tx_wr_en_s     <= '0';
                tx_rd_en_s     <= '0';
                rx_wr_en_s     <= '0';
                rx_rd_en_s     <= '0';
                spi_tx_start_s <= '0';

                case state_s is
                    when IDLE =>
                        if uart_rx_valid_int = '1' and tx_full_s = '0' then
                            tx_wr_en_s   <= '1';
                            state_s      <= UART_RX_WAIT;
                        elsif uart_rx_err_frame_int = '1' then
                            state_s <= ERROR_RECOVER;
                        end if;

                    when UART_RX_WAIT =>
                        -- Wait until TX FIFO has data and SPI is idle.
                        if tx_empty_s = '0' and spi_tx_done_s = '1' then
                            tx_rd_en_s     <= '1';
                            spi_tx_start_s <= '1';
                            state_s        <= SPI_TX;
                        end if;

                    when SPI_TX =>
                        -- Wait for the current SPI transaction to complete.
                        if spi_tx_done_s = '0' then
                            null;  -- stay in SPI_TX
                        else
                            rx_wr_en_s <= '1';
                            state_s    <= SPI_RX;
                        end if;

                    when SPI_RX =>
                        -- Wait until RX FIFO has a response byte.
                        if rx_empty_s = '0' and uart_tx_busy_int = '0' then
                            rx_rd_en_s   <= '1';
                            state_s      <= UART_TX_RESPONSE;
                        end if;

                    when UART_TX_RESPONSE =>
                        -- Wait for the current SPI transaction to finish, then return to idle.
                        if spi_tx_done_s = '0' then
                            null;  -- stay in UART_TX_RESPONSE
                        else
                            state_s <= IDLE;
                        end if;

                    when ERROR_RECOVER =>
                        -- Clear pending work and return to idle.
                        state_s <= IDLE;

                end case;
            end if;
        end if;
    end process;

    -- UART TX sub-block: serializes queued RX-FIFO data onto uart_tx_o.
    uart_tx_inst : uart_tx
        port map (
            clk_i      => clk_i,
            rst_i      => rst_i,
            tx_data_i  => rx_dout_s,
            start_i    => rx_rd_en_s and (state_s = UART_TX_RESPONSE),
            busy_o     => uart_tx_busy_int,
            tx_data_o  => uart_tx_o
        );

    -- Status outputs: derived from internal signals only.
    error_o         <= '1' when uart_rx_err_frame_int = '1' or tx_full_s = '1' or rx_full_s = '1' else '0';
    rx_valid_o      <= '1' when rx_empty_s = '0' and state_s = UART_TX_RESPONSE else '0';
    rx_data_o       <= rx_dout_s;
    tx_fifo_full_o  <= tx_full_s;
    rx_fifo_empty_o <= rx_empty_s;
    busy_o          <= '1' when state_s /= IDLE else '0';

end architecture rtl;