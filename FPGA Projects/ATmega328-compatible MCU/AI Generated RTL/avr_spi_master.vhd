### avr_spi_master.vhd
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity avr_spi_master is
  generic (
    CLK_DIV_PERIOD : natural := 4;  -- 25 MHz SPI clk from 100 MHz sysclk
    DATA_WIDTH     : natural := 8
  );
  port (
    clk       : in  std_logic;
    rst_n     : in  std_logic;
    -- Control & Status
    start     : in  std_logic;
    busy      : out std_logic;
    tx_done   : out std_logic;
    rx_done   : out std_logic;
    -- SPI Pins
    sclk_out  : out std_logic;
    mosi_out  : out std_logic;
    miso_in   : in  std_logic;
    ss_out    : out std_logic;
    -- Data Interface (matches AVR SPDR behavior)
    tx_data   : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    rx_data   : out std_logic_vector(DATA_WIDTH-1 downto 0)
  );
end entity avr_spi_master;

architecture rtl of avr_spi_master is
  type state_type is (IDLE, ACTIVE, DONE);
  signal state       : state_type := IDLE;
  signal sclk_reg    : std_logic  := '0';
  signal mosi_reg    : std_logic  := '0';
  signal ss_reg      : std_logic  := '1';
  signal shift_reg   : std_logic_vector(DATA_WIDTH-1 downto 0) := (others => '0');
  signal rx_reg      : std_logic_vector(DATA_WIDTH-1 downto 0) := (others => '0');
  signal bit_counter : natural range 0 to DATA_WIDTH := 0;
  signal div_counter : natural range 0 to CLK_DIV_PERIOD-1 := 0;
  signal miso_sync1  : std_logic := '0';
  signal miso_sync2  : std_logic := '0';
begin
  -- MISO Synchronizer (prevents metastability from slave timing hazards)
  sync_miso : process(clk, rst_n)
  begin
    if rst_n = '0' then
      miso_sync1 <= '0';
      miso_sync2 <= '0';
    elsif rising_edge(clk) then
      miso_sync1 <= miso_in;
      miso_sync2 <= miso_sync1;
    end if;
  end process sync_miso;

  -- Core FSM & Shift Logic
  process(clk, rst_n)
  begin
    if rst_n = '0' then
      state       <= IDLE;
      sclk_reg    <= '0';
      mosi_reg    <= '0';
      ss_reg      <= '1';
      shift_reg   <= (others => '0');
      rx_reg      <= (others => '0');
      bit_counter <= 0;
      div_counter <= 0;
      busy        <= '0';
      tx_done     <= '0';
      rx_done     <= '0';
    elsif rising_edge(clk) then
      case state is
        when IDLE =>
          sclk_reg <= '0';
          ss_reg   <= '1';
          busy     <= '0';
          if start = '1' then
            shift_reg <= tx_data;
            bit_counter <= 0;
            div_counter <= 0;
            state <= ACTIVE;
          end if;

        when ACTIVE =>
          busy <= '1';
          -- Clock Divider / Phase Generator
          if div_counter = 0 then
            sclk_reg <= not sclk_reg;
          end if;
          div_counter <= div_counter + 1;

          -- Shift MOSI on rising edge (CPOL=0, CPHA=0)
          if div_counter = CLK_DIV_PERIOD / 2 and sclk_reg = '1' then
            mosi_reg <= shift_reg(DATA_WIDTH-1);
            if bit_counter < DATA_WIDTH - 1 then
              shift_reg <= shift_reg(DATA_WIDTH-2 downto 0) & '0';
              bit_counter <= bit_counter + 1;
            end if;
          end if;

          -- Sample MISO on falling edge
          if div_counter = CLK_DIV_PERIOD - 1 and sclk_reg = '0' then
            rx_reg <= rx_reg(DATA_WIDTH-2 downto 0) & miso_sync2;
            if bit_counter < DATA_WIDTH - 1 then
              bit_counter <= bit_counter + 1;
            end if;
          end if;

          -- Frame Completion
          if bit_counter = DATA_WIDTH - 1 and div_counter = CLK_DIV_PERIOD - 1 then
            state <= DONE;
          end if;

        when DONE =>
          sclk_reg <= '0';
          ss_reg   <= '0';
          busy     <= '0';
          tx_done  <= '1';
          rx_done  <= '1';
          if start = '0' then
            state <= IDLE;
          end if;
      end case;
    end if;
  end process;

  -- Registered Output Assignments
  sclk_out <= sclk_reg;
  mosi_out <= mosi_reg;
  ss_out   <= ss_reg;
  rx_data  <= rx_reg;
end architecture rtl;
