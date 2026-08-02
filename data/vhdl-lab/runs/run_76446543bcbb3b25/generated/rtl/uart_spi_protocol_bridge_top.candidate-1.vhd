library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity uart_spi_protocol_bridge_top is
  generic (
    DATA_WIDTH : positive := 8
  );
  port (
    clk : in std_logic;
    rst : in std_logic;
    uart_rx_i : in std_logic;
    uart_tx_o : out std_logic;
    spi_miso_i : in std_logic;
    spi_mosi_o : out std_logic;
    spi_sclk_o : out std_logic;
    spi_cs_o : out std_logic;
    busy_o : out std_logic;
    error_o : out std_logic;
    status_o : out std_logic_vector(7 downto 0)
  );
end entity uart_spi_protocol_bridge_top;

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

architecture rtl of uart_spi_protocol_bridge_top is

    -- Constants
    constant FIFO_DEPTH : natural := 16; -- Example depth, can be adjusted

    -- Signals for UART RX
    signal uart_rx_data   : std_logic_vector(DATA_WIDTH-1 downto 0);
    signal uart_rx_valid  : std_logic;
    signal uart_rx_ready  : std_logic;

    -- Signals for UART TX
    signal uart_tx_data   : std_logic_vector(DATA_WIDTH-1 downto 0);
    signal uart_tx_valid  : std_logic;
    signal uart_tx_ready  : std_logic;

    -- Signals for SPI Master
    signal spi_mosi_data  : std_logic_vector(DATA_WIDTH-1 downto 0);
    signal spi_miso_data  : std_logic_vector(DATA_WIDTH-1 downto 0);
    signal spi_start      : std_logic;
    signal spi_done       : std_logic;

    -- Signals for FIFOs
    signal tx_fifo_full   : std_logic;
    signal tx_fifo_empty  : std_logic;
    signal rx_fifo_full   : std_logic;
    signal rx_fifo_empty  : std_logic;

    -- Control signals
    type state_type is (IDLE, LOAD_TX_FIFO, START_SPI_TRANSACTION, WAIT_FOR_SPI_DONE, READ_RX_FIFO);
    signal current_state  : state_type := IDLE;
    signal next_state     : state_type;

begin

    -- UART RX Receiver Path
    uart_rx_inst: entity work.uart_receiver
        generic map (
            DATA_WIDTH => DATA_WIDTH
        )
        port map (
            clk       => clk,
            rst       => rst,
            rx_i      => uart_rx_i,
            data_o    => uart_rx_data,
            valid_o   => uart_rx_valid,
            ready_i   => uart_rx_ready
        );

    -- UART TX Transmitter Path
    uart_tx_inst: entity work.uart_transmitter
        generic map (
            DATA_WIDTH => DATA_WIDTH
        )
        port map (
            clk       => clk,
            rst       => rst,
            tx_o      => uart_tx_o,
            data_i    => uart_tx_data,
            valid_i   => uart_tx_valid,
            ready_o   => uart_tx_ready
        );

    -- SPI Master Controller
    spi_master_inst: entity work.spi_master
        generic map (
            DATA_WIDTH => DATA_WIDTH
        )
        port map (
            clk       => clk,
            rst       => rst,
            miso_i    => spi_miso_i,
            mosi_o    => spi_mosi_o,
            sclk_o    => spi_sclk_o,
            cs_o      => spi_cs_o,
            data_i    => spi_mosi_data,
            start_i   => spi_start,
            done_o    => spi_done
        );

    -- Transmit FIFO Buffering for Outbound SPI Payloads
    tx_fifo_inst: entity work.fifo
        generic map (
            DATA_WIDTH => DATA_WIDTH,
            DEPTH      => FIFO_DEPTH
        )
        port map (
            clk       => clk,
            rst       => rst,
            data_i    => uart_rx_data,
            valid_i   => uart_rx_valid,
            ready_o   => uart_rx_ready,
            data_o    => spi_mosi_data,
            valid_o   => spi_start,
            ready_i   => not tx_fifo_full
        );

    -- Receive FIFO Buffering for Inbound SPI Response Data
    rx_fifo_inst: entity work.fifo
        generic map (
            DATA_WIDTH => DATA_WIDTH,
            DEPTH      => FIFO_DEPTH
        )
        port map (
            clk       => clk,
            rst       => rst,
            data_i    => spi_miso_data,
            valid_i   => spi_done,
            ready_o   => open, -- Not used in this example
            data_o    => uart_tx_data,
            valid_o   => uart_tx_valid,
            ready_i   => not rx_fifo_full
        );

    -- Control/Status Register Block or Equivalent Status Signaling
    status_o <= (others => '0'); -- Placeholder for actual status signals

    -- Bridge Control FSM Coordinating UART Framing and SPI Execution
    process(clk, rst)
    begin
        if rst = '1' then
            current_state <= IDLE;
        elsif rising_edge(clk) then
            current_state <= next_state;
        end if;
    end process;

    process(current_state, uart_rx_valid, spi_done, tx_fifo_full, rx_fifo_full)
    begin
        case current_state is
            when IDLE =>
                if uart_rx_valid = '1' and not tx_fifo_full then
                    next_state <= LOAD_TX_FIFO;
                else
                    next_state <= IDLE;
                end if;

            when LOAD_TX_FIFO =>
                next_state <= START_SPI_TRANSACTION;

            when START_SPI_TRANSACTION =>
                if spi_done = '1' then
                    next_state <= READ_RX_FIFO;
                else
                    next_state <= WAIT_FOR_SPI_DONE;
                end if;

            when WAIT_FOR_SPI_DONE =>
                if spi_done = '1' then
                    next_state <= READ_RX_FIFO;
                else
                    next_state <= WAIT_FOR_SPI_DONE;
                end if;

            when READ_RX_FIFO =>
                if not rx_fifo_full then
                    next_state <= IDLE;
                else
                    next_state <= READ_RX_FIFO; -- Handle overflow case
                end if;

        end case;
    end process;

    -- Error Reporting for Framing, Overflow, Underflow, and Protocol Faults
    error_o <= '1' when (tx_fifo_full = '1' or rx_fifo_full = '1') else '0';

end architecture rtl;
