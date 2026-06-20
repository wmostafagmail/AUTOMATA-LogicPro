library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

use work.cpu_pkg.all;

entity uart_tx is
  generic (
    CLOCK_FREQ_HZ : positive := 50000000;
    BAUD_RATE     : positive := 115200
  );
  port (
    clk       : in  std_logic;
    reset     : in  std_logic;
    start     : in  std_logic;
    data_in   : in  byte_t;
    tx        : out std_logic;
    busy      : out std_logic
  );
end entity;

architecture rtl of uart_tx is
  constant BAUD_DIVISOR : natural := CLOCK_FREQ_HZ / BAUD_RATE;

  signal shifter      : std_logic_vector(9 downto 0) := (others => '1');
  signal bit_index    : integer range 0 to 9 := 0;
  signal baud_count   : integer range 0 to BAUD_DIVISOR - 1 := 0;
  signal tx_reg       : std_logic := '1';
  signal busy_reg     : std_logic := '0';
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        shifter    <= (others => '1');
        bit_index  <= 0;
        baud_count <= 0;
        tx_reg     <= '1';
        busy_reg   <= '0';
      else
        if busy_reg = '0' then
          tx_reg <= '1';
          if start = '1' then
            shifter    <= '1' & data_in & '0';
            bit_index  <= 0;
            baud_count <= 0;
            tx_reg     <= '0';
            busy_reg   <= '1';
          end if;
        else
          if baud_count = BAUD_DIVISOR - 1 then
            baud_count <= 0;
            tx_reg     <= shifter(bit_index);

            if bit_index = 9 then
              bit_index <= 0;
              busy_reg  <= '0';
              tx_reg    <= '1';
            else
              bit_index <= bit_index + 1;
            end if;
          else
            baud_count <= baud_count + 1;
          end if;
        end if;
      end if;
    end if;
  end process;

  tx   <= tx_reg;
  busy <= busy_reg;
end architecture;
