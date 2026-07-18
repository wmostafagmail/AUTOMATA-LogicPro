library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity uart_tx is
  generic (
    DIVIDER    : integer := 100;
    UART_BIT_W : integer := 8
   );
  port (
    clk_i   : in  std_logic;
    rst_i   : in  std_logic;
    data_i  : in  std_logic_vector(UART_BIT_W-1 downto 0);
    valid_i : in  std_logic;
    tx_o    : out std_logic
   );
end entity;

architecture rtl of uart_tx is
  signal tx_sig : std_logic := '1';
  signal cnt    : integer range 0 to DIVIDER + 1 := 0;
  signal bit    : integer range 0 to UART_BIT_W + 1 := 0;
  signal data_reg : std_logic_vector(UART_BIT_W-1 downto 0) := (others => '0');
  signal s        : integer range 0 to 3 := 0;
begin
  tx_o <= tx_sig;

  process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_i = '1' then
        cnt <= 0;
        bit <= 0;
        data_reg <= (others => '0');
        s <= 0;
        tx_sig <= '1';
      else
        case s is
          when 0 =>
            if valid_i = '1' then
              data_reg <= data_i;
              s <= 1;
              cnt <= 0;
              tx_sig <= '0';
            end if;
          when 1 =>
            cnt <= cnt + 1;
            if cnt = DIVIDER / 2 then
              s <= 2;
              bit <= 0;
            end if;
          when 2 =>
            cnt <= cnt + 1;
            if cnt = DIVIDER then
              cnt <= 0;
              tx_sig <= data_reg(bit);
              bit <= bit + 1;
              if bit = UART_BIT_W - 1 then
                s <= 3;
              end if;
            end if;
          when 3 =>
            cnt <= cnt + 1;
            if cnt = DIVIDER then
              s <= 0;
              tx_sig <= '1';
            end if;
        end case;
      end if;
    end if;
  end process;
end architecture;
