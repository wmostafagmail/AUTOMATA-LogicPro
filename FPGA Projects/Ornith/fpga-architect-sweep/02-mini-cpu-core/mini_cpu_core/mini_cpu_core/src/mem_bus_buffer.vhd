library ieee;
use ieee.std_logic_1164.all;

entity mem_bus_buffer is
  port (
    enable : in  std_logic;
    data_in  : in  std_logic_vector(7 downto 0);
    data_out : out std_logic_vector(7 downto 0)
  );
end entity mem_bus_buffer;

architecture rtl of mem_bus_buffer is
begin
  process(enable, data_in)
  begin
    if enable = '1' then
      data_out <= data_in;
    else
      data_out <= (others => 'Z');
    end if;
  end process;
end architecture rtl;