library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.uart_spi_bridge_pkg.all;

entity uart_rx is
  generic (
    DIVIDER    : integer := 100;
    UART_BIT_W : integer := 8
   );
  port (
    clk_i   : in  std_logic;
    rst_i   : in  std_logic;
    rx_i    : in  std_logic;
    frame_o : out byte_t;
    valid_o : out std_logic
   );
end entity;

architecture rtl of uart_rx is
  signal cnt       : integer range 0 to DIVIDER := 0;
  signal bit       : integer range 0 to UART_BIT_W := 0;
  signal data      : byte_t := (others => '0');
  signal s         : integer range 0 to 3 := 0;
  signal valid_o_int : std_logic := '0';
begin
  process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_i = '1' then
        cnt <= 0;
        bit <= 0;
        data <= (others => '0');
        s <= 0;
        valid_o_int <= '0';
      else
        valid_o_int <= '0';
        case s is
          when 0 =>
            if rx_i = '0' then
              s <= 1;
              cnt <= 0;
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
              data(bit) <= rx_i;
              bit <= (bit + 1) mod UART_BIT_W;
              if bit = UART_BIT_W - 1 then
                s <= 3;
              end if;
            end if;
          when 3 =>
            cnt <= cnt + 1;
            if cnt = DIVIDER then
              s <= 0;
              valid_o_int <= '1';
            end if;
        end case;
      end if;
    end if;
  end process;
  frame_o <= data;
  valid_o <= valid_o_int;
end architecture;
