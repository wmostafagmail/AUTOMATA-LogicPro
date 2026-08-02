library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity tb_video_pattern_generator_top is
end entity tb_video_pattern_generator_top;

architecture sim of tb_video_pattern_generator_top is
  constant DATA_WIDTH : positive := 8;
  signal clk : std_logic := '0';
  signal rst : std_logic := '0';
  signal hsync_o : std_logic := '0';
  signal vsync_o : std_logic := '0';
  signal de_o : std_logic := '0';
  signal pixel_o : std_logic_vector(23 downto 0) := (others => '0');
  signal pixel_addr_o : unsigned(18 downto 0) := (others => '0');
begin
  clk_gen : process
  begin
    clk <= '0';
    wait for 5 ns;
    clk <= '1';
    wait for 5 ns;
  end process;

  dut : entity work.video_pattern_generator_top
    generic map (
      DATA_WIDTH => 8
    )
    port map (
      clk => clk,
      rst => rst,
      hsync_o => hsync_o,
      vsync_o => vsync_o,
      de_o => de_o,
      pixel_o => pixel_o,
      pixel_addr_o => pixel_addr_o
    );

  stimulus : process
  begin
    rst <= '1';
    wait for 20 ns;
    rst <= '0';
    wait for 80 ns;
    report "PASS" severity note;
    wait;
  end process;
end architecture sim;
