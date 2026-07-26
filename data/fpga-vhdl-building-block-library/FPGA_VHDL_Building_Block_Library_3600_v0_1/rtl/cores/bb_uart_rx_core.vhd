library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity bb_uart_rx_core is
  generic (
    CLOCK_HZ : positive := 50_000_000;
    BAUD_RATE: positive := 115_200;
    DATA_BITS: positive := 8
  );
  port (
    clk          : in  std_logic;
    rst_n        : in  std_logic;
    uart_rx      : in  std_logic;
    rx_data      : out std_logic_vector(DATA_BITS-1 downto 0);
    rx_valid     : out std_logic;
    framing_error: out std_logic
  );
end entity;

architecture rtl of bb_uart_rx_core is
  constant DIVISOR : positive := CLOCK_HZ / BAUD_RATE;
  type state_t is (IDLE, START_BIT, DATA_BITS_STATE, STOP_BIT);
  signal state : state_t := IDLE;
  signal sample_count : natural range 0 to DIVISOR-1 := 0;
  signal bit_index : natural range 0 to DATA_BITS-1 := 0;
  signal data_reg : std_logic_vector(DATA_BITS-1 downto 0) := (others => '0');
  signal valid_reg, error_reg : std_logic := '0';
begin
  rx_data <= data_reg;
  rx_valid <= valid_reg;
  framing_error <= error_reg;
  process(clk)
  begin
    if rising_edge(clk) then
      valid_reg <= '0';
      error_reg <= '0';
      if rst_n = '0' then
        state <= IDLE;
        sample_count <= 0;
        bit_index <= 0;
        data_reg <= (others => '0');
      else
        case state is
          when IDLE =>
            if uart_rx = '0' then
              sample_count <= DIVISOR/2;
              state <= START_BIT;
            end if;
          when START_BIT =>
            if sample_count = 0 then
              if uart_rx = '0' then
                sample_count <= DIVISOR-1;
                bit_index <= 0;
                state <= DATA_BITS_STATE;
              else
                state <= IDLE;
              end if;
            else
              sample_count <= sample_count - 1;
            end if;
          when DATA_BITS_STATE =>
            if sample_count = 0 then
              data_reg(bit_index) <= uart_rx;
              sample_count <= DIVISOR-1;
              if bit_index = DATA_BITS-1 then
                state <= STOP_BIT;
              else
                bit_index <= bit_index + 1;
              end if;
            else
              sample_count <= sample_count - 1;
            end if;
          when STOP_BIT =>
            if sample_count = 0 then
              if uart_rx = '1' then valid_reg <= '1'; else error_reg <= '1'; end if;
              state <= IDLE;
            else
              sample_count <= sample_count - 1;
            end if;
        end case;
      end if;
    end if;
  end process;
end architecture;
