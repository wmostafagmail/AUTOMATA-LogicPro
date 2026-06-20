library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

use work.cpu_pkg.all;

entity data_ram is
  port (
    clk       : in  std_logic;
    write_en  : in  std_logic;
    addr      : in  byte_t;
    write_data: in  byte_t;
    read_data : out byte_t
  );
end entity;

architecture rtl of data_ram is
  type ram_t is array (0 to 255) of byte_t;
  signal ram            : ram_t := (others => (others => '0'));
  signal read_data_reg  : byte_t := (others => '0');
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if write_en = '1' then
        ram(to_integer(unsigned(addr))) <= write_data;
      end if;
      read_data_reg <= ram(to_integer(unsigned(addr)));
    end if;
  end process;

  read_data <= read_data_reg;
end architecture;
