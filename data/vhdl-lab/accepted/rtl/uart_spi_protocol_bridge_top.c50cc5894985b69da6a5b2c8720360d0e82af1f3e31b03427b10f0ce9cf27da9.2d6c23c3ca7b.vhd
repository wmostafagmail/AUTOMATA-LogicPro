library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity uart_receiver is
  generic (
    DATA_WIDTH : positive := 8
  );
  port (
    clk       : in std_logic;
    rst       : in std_logic;
    rx_i      : in std_logic;
    data_o    : out std_logic_vector(DATA_WIDTH-1 downto 0);
    valid_o   : out std_logic;
    ready_i   : in std_logic
  );
end entity uart_receiver;

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

architecture rtl of uart_receiver is
begin
  -- UART receiver implementation goes here
end architecture rtl;

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity uart_transmitter is
  generic (
    DATA_WIDTH : positive := 8
  );
  port (
    clk       : in std_logic;
    rst       : in std_logic;
    tx_o      : out std_logic;
    data_i    : in std_logic_vector(DATA_WIDTH-1 downto 0);
    valid_i   : in std_logic;
    ready_o   : out std_logic
  );
end entity uart_transmitter;

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

architecture rtl of uart_transmitter is
begin
  -- UART transmitter implementation goes here
end architecture rtl;

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity spi_master is
  generic (
    DATA_WIDTH : positive := 8
  );
  port (
    clk       : in std_logic;
    rst       : in std_logic;
    mosi_o    : out std_logic;
    miso_i    : in std_logic;
    sclk_o    : out std_logic;
    cs_o      : out std_logic;
    data_i    : in std_logic_vector(DATA_WIDTH-1 downto 0);
    start_i   : in std_logic;
    done_o    : out std_logic
  );
end entity spi_master;

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

architecture rtl of spi_master is
begin
  -- SPI master implementation goes here
end architecture rtl;

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity fifo is
  generic (
    DATA_WIDTH : positive := 8;
    DEPTH      : natural := 16
  );
  port (
    clk       : in std_logic;
    rst       : in std_logic;
    data_i    : in std_logic_vector(DATA_WIDTH-1 downto 0);
    valid_i   : in std_logic;
    ready_o   : out std_logic;
    data_o    : out std_logic_vector(DATA_WIDTH-1 downto 0);
    valid_o   : out std_logic;
    ready_i   : in std_logic
  );
end entity fifo;

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

architecture rtl of fifo is
begin
  -- FIFO implementation goes here
end architecture rtl;

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity control_logic is
  generic (
    DATA_WIDTH : positive := 8
  );
  port (
    clk       : in std_logic;
    rst       : in std_logic;
    uart_rx_valid_i : in std_logic;
    uart_tx_ready_i : in std_logic;
    spi_done_i      : in std_logic;
    tx_fifo_full_o  : out std_logic;
    tx_fifo_empty_o : out std_logic;
    rx_fifo_full_o  : out std_logic;
    rx_fifo_empty_o : out std_logic;
    busy_o          : out std_logic;
    error_o         : out std_logic;
    status_o        : out std_logic_vector(7 downto 0)
  );
end entity control_logic;

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

architecture rtl of control_logic is
begin
  -- Control logic implementation goes here
end architecture rtl;

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

    -- SPI Master Path
    spi_master_inst: entity work.spi_master
        generic map (
            DATA_WIDTH => DATA_WIDTH
        )
        port map (
            clk       => clk,
            rst       => rst,
            mosi_o    => spi_mosi_o,
            miso_i    => spi_miso_i,
            sclk_o    => spi_sclk_o,
            cs_o      => spi_cs_o,
            data_i    => spi_mosi_data,
            start_i   => spi_start,
            done_o    => spi_done
        );

    -- FIFO for TX Path
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

    -- FIFO for RX Path
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
            ready_i   => uart_tx_ready
        );

    -- Control Logic Path
    control_logic_inst: entity work.control_logic
        generic map (
            DATA_WIDTH => DATA_WIDTH
        )
        port map (
            clk       => clk,
            rst       => rst,
            uart_rx_valid_i => uart_rx_valid,
            uart_tx_ready_i => uart_tx_ready,
            spi_done_i      => spi_done,
            tx_fifo_full_o  => tx_fifo_full,
            tx_fifo_empty_o => tx_fifo_empty,
            rx_fifo_full_o  => rx_fifo_full,
            rx_fifo_empty_o => rx_fifo_empty,
            busy_o          => busy_o,
            error_o         => error_o,
            status_o        => status_o
        );

end architecture rtl;
