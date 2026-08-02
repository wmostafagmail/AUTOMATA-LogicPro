library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all;
entity video_pattern_generator_top is
  generic (
    DATA_WIDTH : positive := 8
  );
  port (
    clk : in std_logic;
    rst : in std_logic;
    hsync_o : out std_logic;
    vsync_o : out std_logic;
    de_o : out std_logic;
    pixel_o : out std_logic_vector(23 downto 0);
    pixel_addr_o : out unsigned(18 downto 0)
  );
end entity video_pattern_generator_top;

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

architecture rtl of video_pattern_generator_top is
begin
  u_core:entity core generic map(DATA_WIDTH=>DATA_WIDTH) port map(clk=>clk,rst=>rst,hsync_o=>hsync_o,vsync_o=>vsync_o,de_o=>de_o,pixel_o=>pixel_o,pixel_addr_o=>pixel_addr_o);
end architecture;
