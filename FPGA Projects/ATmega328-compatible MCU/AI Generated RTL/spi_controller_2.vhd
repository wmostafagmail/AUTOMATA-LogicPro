library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity spi_controller is
  generic (
    SYS_CLK_FREQ : natural := 50_000_000;
    SPI_CLK_DIV  : natural := 2
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

architecture rtl of spi_controller is
  -- State enumeration for synthesis-friendly FSM
  type state_type is (IDLE, SHIFT_OUT, SHIFT_IN, DONE);
  signal state_reg : state_type := IDLE;
  signal next_state : state_type;

  -- Shift registers for MOSI/MISO
  signal mosi_reg : std_logic_vector(7 downto 0) := (others => '0');
  signal miso_reg : std_logic_vector(7 downto 0) := (others => '0');

  -- SCK divider and counters
  signal sck_div_cnt : unsigned(3 downto 0) := (others => '0');
  signal bit_cnt     : unsigned(3 downto 0) := (others => "1111");
  signal byte_cnt    : unsigned(3 downto 0) := (others => "1111");

  -- Control flags
  signal sck_int     : std_logic := '0';
  signal busy_int    : std_logic := '0';
  signal rx_valid_int: std_logic := '0';

begin
  -- Synthesis attribute for debugging hierarchy
  attribute KEEP_HIERARCHY : string;
  attribute KEEP_HIERARCHY of rtl : architecture is "YES";

  -- Clock process with asynchronous reset
  process(clk, rst_n)
  begin
    if rst_n = '0' then
      state_reg      <= IDLE;
      sck_div_cnt    <= (others => '0');
      bit_cnt        <= (others => "1111");
      byte_cnt       <= (others => "1111");
      mosi_reg       <= (others => '0');
      miso_reg       <= (others => '0');
      sck_int        <= '0';
      busy_int       <= '0';
      rx_valid_int   <= '0';
    elsif rising_edge(clk) then
      -- SCK Divider Logic (50% duty cycle)
      if sck_div_cnt = SPI_CLK_DIV - 1 then
        sck_div_cnt <= (others => '0');
        sck_int     <= not sck_int;
      else
        sck_div_cnt <= sck_div_cnt + 1;
      end if;

      -- FSM and Control Logic
      case state_reg is
        when IDLE =>
          busy_int <= '0';
          rx_valid_int <= '0';
          if cs_n = '0' and tx_en = '1' then
            mosi_reg <= tx_data;
            state_reg <= SHIFT_OUT;
            byte_cnt <= to_unsigned(1, byte_cnt'length);
            bit_cnt  <= to_unsigned(8, bit_cnt'length);
          end if;

        when SHIFT_OUT =>
          busy_int <= '1';
          -- Shift MOSI on rising SCK edge
          if sck_int = '1' then
            mosi_reg <= mosi_reg(6 downto 0) & '0';
            if bit_cnt = 1 then
              bit_cnt <= to_unsigned(8, bit_cnt'length);
              state_reg <= SHIFT_IN;
            else
              bit_cnt <= bit_cnt - 1;
            end if;
          end if;

        when SHIFT_IN =>
          -- Sample MISO on falling SCK edge (sck_int = '0' transition)
          if sck_int = '0' then
            miso_reg <= miso_reg(6 downto 0) & miso;
            if bit_cnt = 1 then
              bit_cnt <= bit_cnt - 1;
              if byte_cnt = 1 then
                byte_cnt <= byte_cnt - 1;
                state_reg <= DONE;
              else
                state_reg <= SHIFT_OUT;
                bit_cnt <= to_unsigned(8, bit_cnt'length);
              end if;
            else
              bit_cnt <= bit_cnt - 1;
            end if;
          end if;

        when DONE =>
          busy_int <= '0';
          rx_valid_int <= '1';
          -- Latch output and prepare for next transaction
          if cs_n = '1' then
            state_reg <= IDLE;
            rx_valid_int <= '0';
          end if;

        when others =>
          state_reg <= IDLE;
      end case;
    end if;
  end process;

  -- Output assignments
  sck <= sck_int;
  mosi <= mosi_reg(7);
  rx_data <= miso_reg;
  busy <= busy_int;
  rx_valid <= rx_valid_int;

  -- Design invariant assertions (synthesis-safe via pragma)
  -- assert byte_cnt < 16 report "Byte counter overflow detected" severity error;

end architecture rtl;
