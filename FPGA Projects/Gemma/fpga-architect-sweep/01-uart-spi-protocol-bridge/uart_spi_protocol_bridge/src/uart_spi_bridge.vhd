library ieee;
use ieee.std_logic_1164.all;

entity uart_rx is
    port (
        clk       : in  std_ulogic;
        reset_n   : in  std_ulogic;
        data_o    : out std_ulogic_vector(7 downto 0);
        wr_en_o   : out std_ulogic;
        full_i    : in  std_ulogic;
        rx_in     : in  std_ulogic
    );
end entity uart_rx;

architecture rtl of uart_rx is
begin
    -- UART RX implementation goes here
end architecture rtl;

entity uart_tx is
    port (
        clk       : in  std_ulogic;
        reset_n   : in  std_ulogic;
        data_i    : in  std_ulogic_vector(7 downto 0);
        rd_en_o   : out std_ulogic;
        empty_i   : in  std_ulogic;
        tx_out    : out std_ulogic
    );
end entity uart_tx;

architecture rtl of uart_tx is
begin
    -- UART TX implementation goes here
end architecture rtl;

entity spi_master is
    port (
        clk       : in  std_ulogic;
        reset_n   : in  std_ulogic;
        data_in   : in  std_ulogic_vector(7 downto 0);
        wr_en_i   : in  std_ulogic;
        empty_o   : out std_ulogic;
        sclk_o    : out std_ulogic;
        mosi_o    : out std_ulogic;
        miso_i    : in  std_ulogic;
        busy_o    : out std_ulogic
    );
end entity spi_master;

architecture rtl of spi_master is
begin
    -- SPI master implementation goes here
end architecture rtl;

entity fifo is
    generic (
        WIDTH      : natural := 8;
        DEPTH_LOG2 : natural := 4
    );
    port (
        clk       : in  std_ulogic;
        reset_n   : in  std_ulogic;
        data_i    : in  std_ulogic_vector(WIDTH-1 downto 0);
        wr_en_i   : in  std_ulogic;
        full_o    : out std_ulogic;
        rd_en_i   : in  std_ulogic;
        empty_o   : out std_ulogic;
        data_o    : out std_ulogic_vector(WIDTH-1 downto 0)
    );
end entity fifo;

architecture rtl of fifo is
begin
    -- FIFO implementation goes here
end architecture rtl;

entity uart_spi_bridge is
    port (
        clk         : in  std_ulogic;
        reset_n     : in  std_ulogic;
        uart_rx_in  : in  std_ulogic;
        uart_tx_out : out std_ulogic;
        spi_sclk_o  : out std_ulogic;
        spi_mosi_o  : out std_ulogic;
        spi_miso_i  : in  std_ulogic;
        busy_o      : out std_ulogic;
        error_o     : out std_ulogic;
        data_avail_o: out std_ulogic
    );
end entity uart_spi_bridge;

architecture rtl of uart_spi_bridge is

    signal tx_fifo_data_in   : std_ulogic_vector(7 downto 0);
    signal tx_fifo_wr_en     : std_ulogic := '0';
    signal tx_fifo_full      : std_ulogic;
    signal tx_fifo_rd_en     : std_ulogic := '0';
    signal tx_fifo_empty     : std_ulogic;
    signal tx_fifo_data_out  : std_ulogic_vector(7 downto 0);
    
    signal rx_fifo_data_in   : std_ulogic_vector(7 downto 0);
    signal rx_fifo_wr_en     : std_ulogic := '0';
    signal rx_fifo_full      : std_ulogic;
    signal rx_fifo_rd_en     : std_ulogic := '0';
    signal rx_fifo_empty     : std_ulogic;
    signal rx_fifo_data_out  : std_ulogic_vector(7 downto 0);

begin

    -- UART RX receiver path
    uart_rx_inst: entity work.uart_rx
        port map (
            clk       => clk,
            reset_n   => reset_n,
            data_o    => tx_fifo_data_in,
            wr_en_o   => tx_fifo_wr_en,
            full_i    => tx_fifo_full,
            rx_in     => uart_rx_in
        );

    -- UART TX transmitter path
    uart_tx_inst: entity work.uart_tx
        port map (
            clk       => clk,
            reset_n   => reset_n,
            data_i    => rx_fifo_data_out,
            rd_en_o   => rx_fifo_rd_en,
            empty_i   => rx_fifo_empty,
            tx_out    => uart_tx_out
        );

    -- SPI master controller
    spi_master_inst: entity work.spi_master
        port map (
            clk       => clk,
            reset_n   => reset_n,
            data_in   => tx_fifo_data_out,
            wr_en_i   => tx_fifo_rd_en,
            empty_o   => tx_fifo_empty,
            sclk_o    => spi_sclk_o,
            mosi_o    => spi_mosi_o,
            miso_i    => rx_fifo_data_in, -- Corrected to use rx_fifo_data_in as input
            busy_o    => busy_o
        );

    -- TX FIFO buffering for outbound SPI payloads
    tx_fifo_inst: entity work.fifo
        generic map (
            WIDTH      => 8,
            DEPTH_LOG2 => 4
        )
        port map (
            clk       => clk,
            reset_n   => reset_n,
            data_i    => tx_fifo_data_in,
            wr_en_i   => tx_fifo_wr_en,
            full_o    => tx_fifo_full,
            rd_en_i   => tx_fifo_rd_en,
            empty_o   => tx_fifo_empty,
            data_o    => tx_fifo_data_out
        );

    -- RX FIFO buffering for inbound SPI response data
    rx_fifo_inst: entity work.fifo
        generic map (
            WIDTH      => 8,
            DEPTH_LOG2 => 4
        )
        port map (
            clk       => clk,
            reset_n   => reset_n,
            data_i    => spi_miso_i, -- Corrected to use spi_miso_i as input
            wr_en_i   => rx_fifo_wr_en,   
            full_o    => rx_fifo_full,
            rd_en_i   => rx_fifo_rd_en,
            empty_o   => rx_fifo_empty,
            data_o    => rx_fifo_data_out
        );

end architecture rtl;
