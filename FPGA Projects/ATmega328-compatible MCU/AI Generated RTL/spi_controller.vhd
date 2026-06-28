entity spi_controller is
  generic (
    SYS_CLK_FREQ : natural := 50_000_000;  -- 50 MHz system clock
    SPI_CLK_DIV  : natural := 2            -- SCK = SYS_CLK / (2 * DIV)
  );
  port (
    clk        : in  std_logic;
    rst_n      : in  std_logic;
    cs_n       : in  std_logic;
    sck        : out std_logic;
    mosi       : out std_logic;
    miso       : in  std_logic;
    tx_data    : in  std_logic_vector(7 downto 0);
    rx_data    : out std_logic_vector(7 downto 0);
    tx_en      : in  std_logic;
    rx_valid   : out std_logic;
    busy       : out std_logic
  );
end entity spi_controller;
