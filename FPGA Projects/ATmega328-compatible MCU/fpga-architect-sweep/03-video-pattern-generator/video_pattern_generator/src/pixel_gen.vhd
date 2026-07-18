library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.video_pkg.all;

entity pixel_gen is
  port (
    clk        : in  std_logic;
    rst        : in  std_logic;
    pixel_addr : in  unsigned(10 downto 0);
    enable     : in  std_logic;
    pixel_data : out pixel_t
  );
end entity;

architecture rtl of pixel_gen is
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        pixel_data <= (others => '0');
      elsif enable = '1' then
        pixel_data <= generate_pattern(pixel_addr);
      end if;
    end if;
  end process;
end architecture;