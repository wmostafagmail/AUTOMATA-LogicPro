library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.video_pkg.all;

entity video_top is
  port (
    clk : in std_logic;
    rst : in std_logic;
    h_sync_o : out std_logic;
    v_sync_o : out std_logic;
    pixel_data_o : out pixel_t;
    pixel_valid_o : out std_logic
  );
end entity video_top;

architecture rtl of video_top is
  signal h_en : std_logic;
  signal h_cnt : unsigned(9 downto 0);
  signal h_sync : std_logic;
  signal h_active : std_logic;
  
  signal v_en : std_logic;
  signal v_cnt : unsigned(9 downto 0);
  signal v_sync : std_logic;
  signal v_active : std_logic;
  
  signal pixel_out : pixel_t;
  signal pixel_valid : std_logic;
begin
  u_h_timing : entity work.h_timing(rtl)
    port map (clk => clk, rst => rst, h_en => h_en, h_cnt => h_cnt, h_sync => h_sync, h_active => h_active);
    
  u_v_timing : entity work.v_timing(rtl)
    port map (clk => clk, rst => rst, h_en => h_en, v_cnt => v_cnt, v_sync => v_sync, v_active => v_active);
    
  u_pixel_gen : entity work.pixel_gen(rtl)
    port map (clk => clk, rst => rst, v_active => v_active, h_active => h_active, h_cnt => h_cnt, v_cnt => v_cnt, pixel_out => pixel_out, pixel_valid => pixel_valid);
    
  h_sync_o <= h_sync;
  v_sync_o <= v_sync;
  pixel_data_o <= pixel_out;
  pixel_valid_o <= pixel_valid;
end architecture rtl;