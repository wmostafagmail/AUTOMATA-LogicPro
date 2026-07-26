library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity bb_uart_tx_core is
  generic (
    CLOCK_HZ : positive := 50_000_000;
    BAUD_RATE: positive := 115_200;
    DATA_BITS: positive := 8
  );
  port (
    clk      : in  std_logic;
    rst_n    : in  std_logic;
    tx_data  : in  std_logic_vector(DATA_BITS-1 downto 0);
    tx_valid : in  std_logic;
    tx_ready : out std_logic;
    uart_tx  : out std_logic;
    busy     : out std_logic
  );
end entity;

architecture rtl of bb_uart_tx_core is
  constant DIVISOR : positive := CLOCK_HZ / BAUD_RATE;
  signal shift_reg : std_logic_vector(DATA_BITS+1 downto 0) := (others => '1');
  signal bit_index : natural range 0 to DATA_BITS+1 := 0;
  signal baud_count: natural range 0 to DIVISOR-1 := 0;
  signal busy_reg : std_logic := '0';
begin
  uart_tx <= shift_reg(0) when busy_reg = '1' else '1';
  tx_ready <= not busy_reg;
  busy <= busy_reg;
  process(clk)
  begin
    if rising_edge(clk) then
      if rst_n = '0' then
        shift_reg <= (others => '1');
        bit_index <= 0;
        baud_count <= 0;
        busy_reg <= '0';
      elsif busy_reg = '0' then
        if tx_valid = '1' then
          shift_reg <= '1' & tx_data & '0';
          bit_index <= 0;
          baud_count <= 0;
          busy_reg <= '1';
        end if;
      elsif baud_count = DIVISOR-1 then
        baud_count <= 0;
        shift_reg <= '1' & shift_reg(shift_reg'high downto 1);
        if bit_index = DATA_BITS+1 then
          busy_reg <= '0';
        else
          bit_index <= bit_index + 1;
        end if;
      else
        baud_count <= baud_count + 1;
      end if;
    end if;
  end process;
end architecture;
