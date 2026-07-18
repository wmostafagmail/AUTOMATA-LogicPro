library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.uart_spi_bridge_pkg.all;

entity uart_spi_bridge is
  generic (
    DIVIDER     : integer := 100;
    SPI_BIT_W_G : integer := 8
    );
  port (
    clk_i         : in  std_logic;
    rst_i         : in  std_logic;
    uart_rx_i     : in  std_logic;
    uart_tx_o     : out std_logic;
    spi_sclk_o    : out std_logic;
    spi_mosi_o    : out std_logic;
    spi_miso_i    : in  std_logic;
    spi_cs_o      : out std_logic;
    busy_o        : out std_logic;
    err_o         : out std_logic;
    data_avail_o  : out std_logic
    );
end entity;

architecture rtl of uart_spi_bridge is
  signal rx_frame : byte_t := (others => '0');
  signal rx_valid : std_logic := '0';
  signal spi_start: std_logic := '0';
  signal spi_data : byte_t := (others => '0');
  signal spi_done : std_logic := '0';
  signal spi_busy : std_logic := '0';
  signal err_sig  : std_logic := '0';
  signal data_avail_sig : std_logic := '0';
  signal tx_data : byte_t := (others => '0');
begin
  uart_rx_inst : entity work.uart_rx
    generic map (DIVIDER => DIVIDER)
    port map (clk_i => clk_i, rst_i => rst_i, rx_i => uart_rx_i, frame_o => rx_frame, valid_o => rx_valid);

  tx_fifo_inst : entity work.tx_fifo
    generic map (DEPTH => FIFO_DEPTH)
    port map (clk_i => clk_i, rst_i => rst_i, wr_en_i => rx_valid, rd_en_i => spi_start, data_i => rx_frame, q_o => tx_data, empty_o => open, full_o => open);

  spi_master_inst : entity work.spi_master
    port map (clk_i => clk_i, rst_i => rst_i, cs_o => spi_cs_o, sclk_o => spi_sclk_o, mosi_o => spi_mosi_o, miso_i => spi_miso_i, data_i => spi_data, start_i => spi_start, done_o => spi_done, busy_o => spi_busy);

  bridge_fsm_inst : entity work.bridge_fsm
    port map (clk_i => clk_i, rst_i => rst_i, rx_frame_i => rx_frame, rx_valid_i => rx_valid, spi_start_o => spi_start, spi_data_o => spi_data, spi_done_i => spi_done, spi_busy_i => spi_busy, err_o => err_sig, data_avail_o => data_avail_sig);

  uart_tx_inst : entity work.uart_tx
    generic map (DIVIDER => DIVIDER)
    port map (clk_i => clk_i, rst_i => rst_i, data_i => std_logic_vector(tx_data), valid_i => rx_valid, tx_o => uart_tx_o);

  busy_o         <= spi_busy;
  err_o          <= err_sig;
  data_avail_o   <= data_avail_sig;
end architecture;
