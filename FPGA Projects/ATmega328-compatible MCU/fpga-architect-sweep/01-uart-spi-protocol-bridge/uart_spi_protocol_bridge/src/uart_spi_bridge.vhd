library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity uart_spi_bridge is
  generic (
    CLK_FREQ_MHZ : integer := 100
  );
  port (
    clk_i        : in  std_logic;
    rst_i        : in  std_logic;
    uart_rx_i    : in  std_logic;
    uart_tx_o    : out std_logic;
    spi_sclk_o   : out std_logic;
    spi_mosi_o   : out std_logic;
    spi_miso_i   : in  std_logic;
    spi_csn_o    : out std_logic;
    busy_o       : out std_logic;
    err_o        : out std_logic;
    data_valid_o : out std_logic
  );
end entity uart_spi_bridge;

architecture rtl of uart_spi_bridge is
  use work.uart_spi_bridge_pkg.all;
  
  constant TX_FIFO_SZ : integer := 4;
  constant RX_FIFO_SZ : integer := 4;
  
  type fifo_mem_t is array (integer range <>) of byte_t;
  
  signal rx_fifo_data : fifo_mem_t(TX_FIFO_SZ - 1 downto 0);
  signal wr_ptr : integer range 0 to TX_FIFO_SZ - 1;
  signal rd_ptr : integer range 0 to RX_FIFO_SZ - 1;
  
  signal state_reg : state_t;
  signal next_state : state_t;
  
  signal rx_active : std_logic;
  signal tx_done : std_logic;
  
begin

  fsm_proc : process(clk_i, rst_i)
  begin
    if rst_i = '1' then
      state_reg <= ST_IDLE;
    elsif rising_edge(clk_i) then
      state_reg <= next_state;
    end if;
  end process fsm_proc;

  next_state_proc : process(state_reg, uart_rx_i)
  begin
    rx_active <= '0';
    tx_done <= '0';
    next_state <= state_reg;
    
    case state_reg is
      when ST_IDLE =>
        rx_active <= '1';
        if uart_rx_i = '0' then
          next_state <= ST_RX;
        end if;
      when ST_RX =>
        next_state <= ST_WAIT;
      when ST_WAIT =>
        next_state <= ST_TX;
      when ST_TX =>
        tx_done <= '1';
        next_state <= ST_IDLE;
      when others =>
        next_state <= ST_IDLE;
    end case;
  end process next_state_proc;

  spi_proc : process(clk_i, rst_i)
  begin
    if rst_i = '1' then
      spi_csn_o <= '1';
      spi_mosi_o <= '0';
      spi_sclk_o <= '0';
    elsif rising_edge(clk_i) then
      if state_reg = ST_TX then
        spi_csn_o <= '0';
        spi_sclk_o <= '1';
        spi_mosi_o <= '0';
      else
        spi_csn_o <= '1';
        spi_sclk_o <= '0';
        spi_mosi_o <= '0';
      end if;
    end if;
  end process spi_proc;

  ctrl_proc : process(clk_i, rst_i)
  begin
    if rst_i = '1' then
      busy_o <= '0';
      err_o <= '0';
      data_valid_o <= '0';
      uart_tx_o <= '1';
    elsif rising_edge(clk_i) then
      if state_reg = ST_IDLE then
        busy_o <= '0';
        data_valid_o <= '0';
      elsif state_reg = ST_RX then
        busy_o <= '1';
      elsif state_reg = ST_TX then
        busy_o <= '1';
        data_valid_o <= '1';
      end if;
    end if;
  end process ctrl_proc;

end architecture rtl;