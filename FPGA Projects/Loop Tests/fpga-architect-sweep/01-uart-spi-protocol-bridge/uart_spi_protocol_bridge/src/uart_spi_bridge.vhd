library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.uart_spi_bridge_pkg.all;

entity uart_spi_bridge is
  generic (
    CLK_FREQ_HZ : natural := 100000000
  );
  port (
    clk_i             : in  std_logic;
    rst_i             : in  std_logic;
    uart_rx_i         : in  std_logic;
    uart_tx_o         : out std_logic;
    spi_sclk_o        : out std_logic;
    spi_mosi_o        : out std_logic;
    spi_miso_i        : in  std_logic;
    spi_cs_o          : out std_logic;
    rx_valid_i        : in  std_logic;
    rx_data_i         : in  fifo_data_t;
    tx_ready_o        : out std_logic;
    spi_miso_valid_i  : in  std_logic;
    spi_miso_data_i   : in  fifo_data_t;
    spi_tx_ready_o    : out std_logic;
    bridge_busy_o     : out std_logic;
    bridge_error_o    : out std_logic
  );
end entity uart_spi_bridge;

architecture rtl of uart_spi_bridge is
  signal tx_ctrl : fifo_ctrl_t;
  signal rx_ctrl : fifo_ctrl_t;
  signal tx_mem  : std_logic_vector(0 to FIFO_DEPTH - 1) := (others => '0');
  signal rx_mem  : std_logic_vector(0 to FIFO_DEPTH - 1) := (others => '0');
  signal tx_wr_en : std_logic;
  signal tx_rd_en : std_logic;
  signal rx_wr_en : std_logic;
  signal rx_rd_en : std_logic;
  signal state_reg : std_logic_vector(3 downto 0) := (others => '0');
  signal uart_shift : std_logic_vector(7 downto 0) := (others => '0');
  signal uart_cnt   : natural range 0 to 8 := 0;
  signal spi_shift  : std_logic_vector(7 downto 0) := (others => '0');
  signal spi_cnt    : natural range 0 to 8 := 0;
  signal spi_cs_reg : std_logic := '1';
  signal err_reg    : std_logic := '0';
  signal busy_reg   : std_logic := '0';
begin
  wr_proc : process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_i = '1' then
        tx_ctrl.count <= 0;
        tx_ctrl.wr_ptr <= 0;
        rx_ctrl.count <= 0;
        rx_ctrl.wr_ptr <= 0;
      else
        if tx_wr_en = '1' and tx_ctrl.count < FIFO_DEPTH then
          tx_mem(to_integer(tx_ctrl.wr_ptr)) <= rx_data_i;
          tx_ctrl.wr_ptr <= tx_ctrl.wr_ptr + 1;
          tx_ctrl.count   <= tx_ctrl.count + 1;
        end if;
        if rx_wr_en = '1' and rx_ctrl.count < FIFO_DEPTH then
          rx_mem(to_integer(rx_ctrl.wr_ptr)) <= spi_miso_data_i;
          rx_ctrl.wr_ptr <= rx_ctrl.wr_ptr + 1;
          rx_ctrl.count   <= rx_ctrl.count + 1;
        end if;
      end if;
    end if;
  end process wr_proc;

  rd_proc : process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_i = '1' then
        tx_ctrl.rd_ptr <= 0;
        rx_ctrl.rd_ptr <= 0;
      else
        if tx_rd_en = '1' and tx_ctrl.count > 0 then
          tx_ctrl.rd_ptr <= tx_ctrl.rd_ptr + 1;
          tx_ctrl.count  <= tx_ctrl.count - 1;
        end if;
        if rx_rd_en = '1' and rx_ctrl.count > 0 then
          rx_ctrl.rd_ptr <= rx_ctrl.rd_ptr + 1;
          rx_ctrl.count  <= rx_ctrl.count - 1;
        end if;
      end if;
    end if;
  end process rd_proc;

  tx_full  <= '1' when tx_ctrl.count = FIFO_DEPTH else '0';
  tx_empty <= '0' when tx_ctrl.count = 0 else '1';
  rx_full  <= '1' when rx_ctrl.count = FIFO_DEPTH else '0';
  rx_empty <= '0' when rx_ctrl.count = 0 else '1';

  main_proc : process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_i = '1' then
        state_reg <= "0000";
        uart_shift <= (others => '0');
        uart_cnt <= 0;
        spi_shift <= (others => '0');
        spi_cnt <= 0;
        spi_cs_reg <= '1';
        err_reg <= '0';
        busy_reg <= '0';
        tx_wr_en <= '0';
        tx_rd_en <= '0';
        rx_wr_en <= '0';
        rx_rd_en <= '0';
        uart_tx_o <= '1';
        spi_sclk_o <= '0';
        spi_mosi_o <= '0';
      else
        tx_wr_en <= '0';
        tx_rd_en <= '0';
        rx_wr_en <= '0';
        rx_rd_en <= '0';
        uart_tx_o <= '1';
        spi_sclk_o <= '0';
        spi_mosi_o <= '0';
        spi_cs_reg <= '1';
        err_reg <= '0';

        case state_reg is
          when "0000" =>
            if rx_valid_i = '1' and tx_empty = '1' then
              tx_wr_en <= '1';
              if tx_full = '0' then
                state_reg <= "0001";
              else
                err_reg <= '1';
                state_reg <= "1111";
              end if;
            end if;
          when "0001" =>
            tx_rd_en <= '1';
            uart_shift <= tx_mem(to_integer(tx_ctrl.rd_ptr));
            uart_cnt <= 0;
            spi_shift <= (others => '0');
            spi_cnt <= 0;
            spi_cs_reg <= '0';
            state_reg <= "0010";
          when "0010" =>
            uart_tx_o <= uart_shift(0);
            uart_shift <= '0' & uart_shift(7 downto 1);
            uart_cnt <= uart_cnt + 1;
            if uart_cnt = 8 then
              state_reg <= "0011";
            end if;
          when "0011" =>
            if uart_rx_i = '0' then
              state_reg <= "0100";
            end if;
          when "0100" =>
            spi_mosi_o <= spi_shift(7);
            spi_sclk_o <= '1';
            spi_cnt <= spi_cnt + 1;
            if spi_cnt = 8 then
              spi_sclk_o <= '0';
              spi_cs_reg <= '1';
              state_reg <= "0101";
            end if;
          when "0101" =>
            spi_sclk_o <= '1';
            spi_cnt <= spi_cnt + 1;
            if spi_miso_valid_i = '1' then
              spi_shift <= spi_shift(6 downto 0) & spi_miso_i;
            end if;
            if spi_cnt = 8 then
              spi_sclk_o <= '0';
              spi_cs_reg <= '1';
              state_reg <= "0110";
            end if;
          when "0110" =>
            if rx_empty = '0' then
              rx_wr_en <= '1';
              state_reg <= "1000";
            else
              err_reg <= '1';
              state_reg <= "1111";
            end if;
          when "1000" =>
            state_reg <= "0000";
          when "1111" =>
            err_reg <= '1';
          when others =>
            state_reg <= "0000";
        end case;
      end if;
    end if;
  end process main_proc;

  bridge_busy_o <= busy_reg;
  bridge_error_o <= err_reg;
  tx_ready_o <= tx_empty;
  spi_tx_ready_o <= rx_empty;
end architecture rtl;