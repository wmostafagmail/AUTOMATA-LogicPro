library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.uart_spi_bridge_pkg.all;

entity spi_master is
  port (
    clk_i    : in  std_logic;
    rst_i    : in  std_logic;
    cs_o     : out std_logic;
    sclk_o   : out std_logic;
    mosi_o   : out std_logic;
    miso_i   : in  std_logic;
    data_i   : in byte_t;
    start_i : in  std_logic;
    done_o   : out std_logic;
    busy_o   : out std_logic
   );
end entity;

architecture rtl of spi_master is
  signal cnt : integer range 0 to 10 := 0;
  signal bit : integer range 0 to SPI_BIT_W := 0;
  signal data_reg : byte_t := (others => '0');
  signal s : integer range 0 to 3 := 0;
  signal sclk_o_int : std_logic;
begin
  process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_i = '1' then
        cnt <= 0; bit <= 0; data_reg <= (others => '0'); s <= 0;
        cs_o <= '1'; sclk_o_int <= '0'; mosi_o <= '0'; done_o <= '0'; busy_o <= '0';
      else
        case s is
          when 0 =>
            if start_i = '1' then
              data_reg <= data_i; s <= 1; cnt <= 0; bit <= 0;
              cs_o <= '0'; sclk_o_int <= '0'; mosi_o <= '0'; busy_o <= '1'; done_o <= '0';
            end if;
          when 1 =>
            sclk_o_int <= not sclk_o_int;
            if sclk_o_int = '1' then
              mosi_o <= data_reg(SPI_BIT_W - 1 - bit);
            end if;
            if sclk_o_int = '0' then
              data_reg <= data_reg(SPI_BIT_W - 2 downto 0) & miso_i;
            end if;
            cnt <= cnt + 1;
            if cnt = 10 then
              cnt <= 0;
              bit <= bit + 1;
              if bit = SPI_BIT_W - 1 then
                s <= 2; cs_o <= '1'; busy_o <= '0'; done_o <= '1';
              end if;
            end if;
          when 2 =>
            done_o <= '0'; s <= 0;
          when others =>
            s <= 0;
        end case;
      end if;
    end if;
  end process;
  sclk_o <= sclk_o_int;
end architecture;
