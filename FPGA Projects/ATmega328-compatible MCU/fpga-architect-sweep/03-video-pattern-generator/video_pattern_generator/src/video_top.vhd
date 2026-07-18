library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.video_pkg.all;

entity video_top is
  port (
    clk        : in  std_logic;
    rst        : in  std_logic;
    h_sync_o   : out std_logic;
    v_sync_o   : out std_logic;
    active_o   : out std_logic;
    pixel_data : out pixel_t
  );
end entity;

architecture rtl of video_top is
  signal active_int : std_logic := '0';
  signal pixel_addr : unsigned(10 downto 0) := (others => '0');
  signal pixel_en   : std_logic := '0';
begin
  gen_timing : entity work.timing_gen
    port map (clk => clk, rst => rst, h_sync_o => h_sync_o, v_sync_o => v_sync_o, active_o => active_int);

  gen_pixel : entity work.pixel_gen
    port map (clk => clk, rst => rst, pixel_addr => pixel_addr, enable => pixel_en, pixel_data => pixel_data);

  active_o <= active_int;

  process(clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        pixel_addr <= (others => '0');
        pixel_en   <= '0';
      elsif active_int = '1' then
        pixel_en   <= '1';
        pixel_addr <= pixel_addr + 1;
      else
        pixel_en   <= '0';
        pixel_addr <= (others => '0');
      end if;
    end if;
  end process;
end architecture;