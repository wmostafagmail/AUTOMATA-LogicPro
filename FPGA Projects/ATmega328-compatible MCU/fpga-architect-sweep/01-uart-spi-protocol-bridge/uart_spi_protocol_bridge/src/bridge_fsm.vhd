library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.uart_spi_bridge_pkg.all;

entity bridge_fsm is
  port (
    clk_i        : in  std_logic;
    rst_i        : in  std_logic;
    rx_frame_i   : in byte_t;
    rx_valid_i   : in std_logic;
    spi_start_o : out std_logic;
    spi_data_o   : out byte_t;
    spi_done_i   : in std_logic;
    spi_busy_i   : in std_logic;
    err_o        : out std_logic;
    data_avail_o: out std_logic
   );
end entity;

architecture rtl of bridge_fsm is
  signal s : integer range 0 to 3 := 0;
begin
  process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_i = '1' then
        s <= 0;
        err_o <= '0';
        data_avail_o <= '0';
        spi_start_o <= '0';
        spi_data_o <= (others => '0');
      else
        case s is
          when 0 =>
            spi_start_o <= '0';
            if rx_valid_i = '1' then
              spi_data_o <= rx_frame_i;
              spi_start_o <= '1';
              s <= 1;
            end if;
          when 1 =>
            spi_start_o <= '0';
            if spi_done_i = '1' then
              s <= 0;
            end if;
          when 2 =>
            spi_start_o <= '0';
            s <= 0;
          when 3 =>
            spi_start_o <= '0';
            s <= 0;
          when others =>
            s <= 0;
            spi_start_o <= '0';
        end case;
      end if;
    end if;
  end process;
end architecture;
