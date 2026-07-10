library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bridge_types_pkg.all;

entity uart_spi_bridge is
  generic (
    FIFO_DEPTH : integer := 16;
    DATA_WIDTH : integer := 8
  );
  port (
    clk_i       : in  std_logic;
    rst_i       : in  std_logic;
    uart_rx_i   : in  std_logic;
    uart_tx_o   : out std_logic;
    spi_sclk_o  : out std_logic;
    spi_mosi_o  : out std_logic;
    spi_miso_i  : in  std_logic;
    spi_cs_o    : out std_logic;
    busy_o      : out std_logic;
    err_o       : out std_logic;
    data_avail_o: out std_logic;
    wr_req_i    : in  std_logic;
    wr_data_i   : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    rd_req_i    : in  std_logic;
    rd_data_o   : out std_logic_vector(DATA_WIDTH-1 downto 0)
  );
end entity uart_spi_bridge;

architecture rtl of uart_spi_bridge is
  signal tx_fifo_sig : fifo_ctrl_t := fifo_init;
  signal rx_fifo_sig : fifo_ctrl_t := fifo_init;

  signal spi_busy_int : std_logic := '0';
  signal spi_cs_int   : std_logic := '1';
  signal spi_sclk_int : std_logic := '0';
  signal spi_mosi_int : std_logic := '0';
  signal spi_shift_reg: std_logic_vector(DATA_WIDTH-1 downto 0) := (others => '0');
  signal spi_bit_cnt  : integer range 0 to DATA_WIDTH := 0;

  signal uart_rx_reg     : std_logic_vector(DATA_WIDTH-1 downto 0) := (others => '0');
  signal uart_rx_valid   : std_logic := '0';
  signal uart_rx_cnt     : integer range 0 to DATA_WIDTH := 0;

  type ctrl_state_t is (IDLE, TX_WAIT, SPI_SHIFT, RX_WAIT, DONE);
  signal ctrl_state_sig  : ctrl_state_t := IDLE;
  signal ctrl_next_state : ctrl_state_t := IDLE;
  signal ctrl_busy_int   : std_logic := '0';
  signal ctrl_err_int    : std_logic := '0';
  signal ctrl_data_avail : std_logic := '0';

begin
  uart_tx_o        <= '1' when uart_rx_valid = '0' else uart_rx_reg(DATA_WIDTH-1);
  spi_cs_o         <= spi_cs_int;
  spi_sclk_o       <= spi_sclk_int;
  spi_mosi_o       <= spi_mosi_int;
  busy_o           <= ctrl_busy_int;
  err_o            <= ctrl_err_int;
  data_avail_o     <= ctrl_data_avail;
  rd_data_o        <= rx_fifo_sig.data when rx_fifo_sig.valid = '1' else (others => '0');

  fifo_proc : process(clk_i)
    variable fifo_var : fifo_ctrl_t;
  begin
    fifo_var := tx_fifo_sig;
    if rising_edge(clk_i) then
      if rst_i = '1' then
        fifo_var := fifo_init;
      else
        if wr_req_i = '1' and fifo_var.full = '0' then
          fifo_var.data := wr_data_i;
          fifo_var.valid := '1';
          fifo_var.wr_ptr := fifo_var.wr_ptr + 1;
          fifo_var.count  := fifo_var.count + 1;
          if fifo_var.count = FIFO_DEPTH - 1 then
            fifo_var.full := '1';
          end if;
        end if;
        if spi_busy_int = '0' and fifo_var.valid = '1' then
          fifo_var.valid := '0';
          fifo_var.rd_ptr := fifo_var.rd_ptr + 1;
          fifo_var.count  := fifo_var.count - 1;
          if fifo_var.count = 0 then
            fifo_var.empty := '1';
            fifo_var.full  := '0';
          end if;
        end if;
        tx_fifo_sig <= fifo_var;
      end if;
    end if;
  end process fifo_proc;

  spi_proc : process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_i = '1' then
        spi_busy_int      <= '0';
        spi_cs_int        <= '1';
        spi_sclk_int      <= '0';
        spi_mosi_int      <= '0';
        spi_shift_reg     <= (others => '0');
        spi_bit_cnt       <= 0;
      else
        if ctrl_state_sig = TX_WAIT then
          spi_busy_int      <= '1';
          spi_cs_int        <= '0';
          spi_sclk_int      <= '0';
          spi_shift_reg     <= tx_fifo_sig.data;
          spi_bit_cnt       <= 1;
        elsif spi_busy_int = '1' then
          if spi_bit_cnt < DATA_WIDTH then
            spi_sclk_int    <= not spi_sclk_int;
            spi_mosi_int    <= spi_shift_reg(DATA_WIDTH-1);
            spi_shift_reg   <= spi_shift_reg(DATA_WIDTH-2 downto 0) & spi_miso_i;
            spi_bit_cnt     <= spi_bit_cnt + 1;
          else
            spi_busy_int    <= '0';
            spi_cs_int      <= '1';
            spi_bit_cnt     <= 0;
          end if;
        end if;
      end if;
    end if;
  end process spi_proc;

  uart_rx_proc : process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_i = '1' then
        uart_rx_reg    <= (others => '0');
        uart_rx_valid <= '0';
        uart_rx_cnt    <= 0;
      else
        if uart_rx_i = '0' then
          if uart_rx_cnt < DATA_WIDTH then
            uart_rx_reg <= uart_rx_reg(DATA_WIDTH-2 downto 0) & uart_rx_i;
            uart_rx_cnt <= uart_rx_cnt + 1;
          end if;
        else
          uart_rx_valid <= '1';
        end if;
      end if;
    end if;
  end process uart_rx_proc;

  ctrl_comb : process(ctrl_state_sig, tx_fifo_sig, spi_busy_int, uart_rx_valid)
  begin
    ctrl_next_state <= ctrl_state_sig;
    ctrl_busy_int   <= '0';
    ctrl_err_int    <= '0';
    ctrl_data_avail <= '0';
    case ctrl_state_sig is
      when IDLE =>
        if tx_fifo_sig.valid = '1' then
          ctrl_next_state <= TX_WAIT;
          ctrl_busy_int   <= '1';
        end if;
      when TX_WAIT =>
        if spi_busy_int = '0' then
          ctrl_next_state <= SPI_SHIFT;
        end if;
      when SPI_SHIFT =>
        ctrl_next_state <= RX_WAIT;
      when RX_WAIT =>
        if spi_busy_int = '0' then
          ctrl_next_state <= DONE;
        end if;
      when DONE =>
        ctrl_next_state <= IDLE;
        ctrl_data_avail <= '1';
        if uart_rx_valid = '1' then
          ctrl_next_state <= IDLE;
        end if;
      when others =>
        ctrl_next_state <= IDLE;
        ctrl_err_int    <= '1';
    end case;
  end process ctrl_comb;

  ctrl_seq : process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_i = '1' then
        ctrl_state_sig <= IDLE;
      else
        ctrl_state_sig <= ctrl_next_state;
      end if;
    end if;
  end process ctrl_seq;

end architecture rtl;
