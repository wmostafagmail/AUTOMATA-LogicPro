-- avr_spi_master.vhd
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity avr_spi_master is
  generic (
    DATA_WIDTH : natural := 8;
    SCK_FREQ_HZ: natural := 25_000_000
  );
  port (
    clk        : in  std_logic;
    rst_n      : in  std_logic;
    -- SPI Bus (External)
    cs_n       : in  std_logic;
    sck        : out std_logic;
    mosi       : out std_logic;
    miso       : in  std_logic;
    -- Host Interface
    tx_data    : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    tx_valid   : in  std_logic;
    rx_data    : out std_logic_vector(DATA_WIDTH-1 downto 0);
    rx_valid   : out std_logic;
    busy       : out std_logic;
    byte_count : out unsigned(3 downto 0)
  );
end entity avr_spi_master;

architecture rtl of avr_spi_master is
  -- State encoding for deterministic synthesis
  type state_type is (IDLE, TX_SETUP, SHIFT_OUT, SHIFT_IN, RX_CAPTURE);
  signal state         : state_type := IDLE;
  signal sck_reg       : std_logic := '0';
  signal mosi_reg      : std_logic := '0';
  signal shift_reg     : std_logic_vector(DATA_WIDTH-1 downto 0) := (others => '0');
  signal rx_shift_reg  : std_logic_vector(DATA_WIDTH-1 downto 0) := (others => '0');
  signal bit_counter   : unsigned(3 downto 0) := (others => '0');
  signal byte_counter  : unsigned(3 downto 0) := (others => '0');
  signal tx_en_reg     : std_logic := '0';
begin

  -- Synchronous Process: SPI Control FSM & Shift Registers
  -- Maps to waveform: CS active low (ticks 15-165), 2-byte frame (0x20, 0x8B)
  process(clk, rst_n)
  begin
    if rst_n = '0' then
      state         <= IDLE;
      sck_reg       <= '0';
      mosi_reg      <= '0';
      shift_reg     <= (others => '0');
      rx_shift_reg  <= (others => '0');
      bit_counter   <= (others => '0');
      byte_counter  <= (others => '0');
      tx_en_reg     <= '0';
    elsif rising_edge(clk) then
      -- Default assignments
      sck         <= '0';
      mosi        <= '0';
      rx_valid    <= '0';
      busy        <= '0';
      byte_count  <= byte_counter;

      -- Synchronize TX enable to eliminate combinational glitches
      if tx_valid = '1' then
        tx_en_reg <= '1';
      else
        tx_en_reg <= '0';
      end if;

      case state is
        when IDLE =>
          busy <= '1';
          if cs_n = '0' and tx_en_reg = '1' then
            shift_reg <= tx_data;
            byte_counter <= to_unsigned(2, byte_counter'length); -- 2 bytes per frame
            state <= TX_SETUP;
          end if;

        when TX_SETUP =>
          sck_reg <= '1'; -- Drive SCK high (CPOL=0)
          state   <= SHIFT_OUT;

        when SHIFT_OUT =>
          sck_reg <= '0'; -- Drive SCK low
          mosi_reg <= shift_reg(DATA_WIDTH-1);
          shift_reg <= shift_reg(DATA_WIDTH-2 downto 0) & '0';
          bit_counter <= bit_counter + 1;
          state <= SHIFT_IN;

        when SHIFT_IN =>
          sck_reg <= '1'; -- Drive SCK high
          -- Sample MISO synchronously to fix ±1 tick setup/hold risk
          rx_shift_reg <= rx_shift_reg(DATA_WIDTH-2 downto 0) & miso;
          bit_counter <= bit_counter + 1;
          state <= SHIFT_OUT;

        when RX_CAPTURE =>
          sck_reg <= '0';
          rx_data <= rx_shift_reg;
          rx_valid <= '1';
          if byte_counter = 0 then
            state <= IDLE;
          else
            byte_counter <= byte_counter - 1;
            state <= TX_SETUP;
          end if;
      end case;
    end if;
  end process;

end architecture rtl;
