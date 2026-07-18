library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity uart_spi_bridge is
  generic (
    UART_BIT_W : integer := 8;
    SPI_BIT_W  : integer := 8
  );
  port (
    clk_i        : in  std_logic;
    rst_i        : in  std_logic;
    uart_rx_i    : in  std_logic;
    uart_tx_o    : out std_logic;
    spi_sclk_o   : out std_logic;
    spi_mosi_o   : out std_logic;
    spi_miso_i   : in  std_logic;
    spi_cs_o     : out std_logic;
    busy_o       : out std_logic;
    err_o        : out std_logic;
    data_avail_o : out std_logic
  );
end entity;

architecture rtl of uart_spi_bridge is
  signal rx_data_sig   : std_logic_vector(UART_BIT_W-1 downto 0);
  signal rx_valid_sig  : std_logic;
  signal tx_empty_sig  : std_logic;
  signal spi_start_sig : std_logic;
  signal spi_data_sig  : std_logic_vector(SPI_BIT_W-1 downto 0);
  signal spi_done_sig  : std_logic;
  signal spi_busy_sig  : std_logic;
  signal rx_wr_en_sig  : std_logic;
  signal rx_rd_en_sig  : std_logic;
  signal err_sig       : std_logic;
  signal data_avail_sig: std_logic;
  signal tx_data_sig   : std_logic_vector(UART_BIT_W-1 downto 0);
  signal tx_valid_sig  : std_logic;
begin
  uart_rx_inst : entity work.uart_rx
    generic map (DIVIDER => 100, UART_BIT_W => UART_BIT_W)
    port map (clk_i => clk_i, rst_i => rst_i, rx_i => uart_rx_i, frame_o => rx_data_sig);

  uart_tx_inst : entity work.uart_tx
    generic map (UART_BIT_W => UART_BIT_W)
    port map (clk_i => clk_i, rst_i => rst_i, data_i => tx_data_sig, valid_i => tx_valid_sig, tx_o => uart_tx_o);

  tx_fifo_inst : entity work.tx_fifo
    generic map (DEPTH => 16, UART_BIT_W => UART_BIT_W)
    port map (clk_i => clk_i, rst_i => rst_i, wr_en_i => rx_wr_en_sig, rd_en_i => tx_valid_sig, data_i => rx_data_sig, q_o => tx_data_sig, empty_o => open, full_o => open);

  rx_fifo_inst : entity work.rx_fifo
    generic map (DEPTH => 16, UART_BIT_W => UART_BIT_W)
    port map (clk_i => clk_i, rst_i => rst_i, wr_en_i => spi_busy_sig, rd_en_i => rx_rd_en_sig, data_i => spi_data_sig, q_o => open, empty_o => open, full_o => open);

  spi_master_inst : entity work.spi_master
    generic map (SPI_BIT_W => SPI_BIT_W)
    port map (clk_i => clk_i, rst_i => rst_i, cs_o => spi_cs_o, sclk_o => spi_sclk_o, mosi_o => spi_mosi_o, miso_i => spi_miso_i, data_i => spi_data_sig, start_i => spi_start_sig, done_o => spi_done_sig, busy_o => spi_busy_sig);

  bridge_fsm_inst : entity work.bridge_fsm
    generic map (UART_BIT_W => UART_BIT_W, SPI_BIT_W => SPI_BIT_W)
    port map (clk_i => clk_i, rst_i => rst_i, rx_frame_i => rx_data_sig, rx_valid_i => rx_valid_sig, tx_empty_i => tx_empty_sig, spi_start_o => spi_start_sig, spi_data_o => spi_data_sig, spi_done_i => spi_done_sig, spi_busy_i => spi_busy_sig, rx_wr_en_o => rx_wr_en_sig, rx_rd_en_o => rx_rd_en_sig, err_o => err_sig, data_avail_o => data_avail_sig);

  rx_valid_sig <= '1';
  tx_valid_sig <= '1';

  busy_o       <= spi_busy_sig;
  err_o        <= err_sig;
  data_avail_o <= data_avail_sig;
end architecture;
