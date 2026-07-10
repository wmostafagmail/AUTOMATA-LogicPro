library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.video_timing_pkg.all;

entity video_top is
  generic (
    PIXEL_WIDTH : integer := 16
  );
  port (
    clk          : in  std_logic;
    rst          : in  std_logic;
    hsync_o      : out std_logic;
    vsync_o      : out std_logic;
    vid_active_o : out std_logic;
    fb_addr_o    : out unsigned(15 downto 0);
    fb_data_o    : out std_logic_vector(7 downto 0);
    vid_data_o   : out std_logic_vector(PIXEL_WIDTH-1 downto 0)
  );
end entity video_top;

architecture rtl of video_top is
  signal h_cnt         : unsigned(9 downto 0);
  signal v_cnt         : unsigned(9 downto 0);
  signal h_sync_int    : std_logic;
  signal v_sync_int    : std_logic;
  signal vid_active    : std_logic;
  signal fb_addr_int   : unsigned(15 downto 0);
  signal vid_data_int  : std_logic_vector(PIXEL_WIDTH-1 downto 0);
begin
  h_v_counter_proc : process(clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        h_cnt <= (others => '0');
        v_cnt <= (others => '0');
      elsif h_cnt = to_unsigned(H_TOTAL - 1, h_cnt'length) then
        h_cnt <= (others => '0');
        if v_cnt = to_unsigned(V_TOTAL - 1, v_cnt'length) then
          v_cnt <= (others => '0');
        else
          v_cnt <= v_cnt + 1;
        end if;
      else
        h_cnt <= h_cnt + 1;
      end if;
    end if;
  end process h_v_counter_proc;

  sync_gen_proc : process(clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        h_sync_int <= '1';
        v_sync_int <= '1';
      else
        if h_cnt = to_unsigned(H_SYNC_START, h_cnt'length) then
          h_sync_int <= '0';
        elsif h_cnt = to_unsigned(H_SYNC_END, h_cnt'length) then
          h_sync_int <= '1';
        end if;

        if v_cnt = to_unsigned(V_SYNC_START, v_cnt'length) then
          v_sync_int <= '0';
        elsif v_cnt = to_unsigned(V_SYNC_END, v_cnt'length) then
          v_sync_int <= '1';
        end if;
      end if;
    end if;
  end process sync_gen_proc;

  active_fb_proc : process(clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        vid_active <= '0';
        fb_addr_int <= (others => '0');
      else
        if h_cnt >= to_unsigned(H_SYNC_END, h_cnt'length) and
           h_cnt <= to_unsigned(H_VALID_END, h_cnt'length) and
           v_cnt >= to_unsigned(V_SYNC_END, v_cnt'length) and
           v_cnt <= to_unsigned(V_VALID_END, v_cnt'length) then
          vid_active <= '1';
          fb_addr_int <= fb_addr_int + 1;
        else
          vid_active <= '0';
        end if;
      end if;
    end if;
  end process active_fb_proc;

  pattern_gen_proc : process(clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        vid_data_int <= (others => '0');
      elsif vid_active = '1' then
        case h_cnt(2 downto 0) is
          when "000" => vid_data_int <= std_logic_vector(to_unsigned(255, PIXEL_WIDTH));
          when "001" => vid_data_int <= std_logic_vector(to_unsigned(0, PIXEL_WIDTH));
          when "010" => vid_data_int <= std_logic_vector(to_unsigned(170, PIXEL_WIDTH));
          when others => vid_data_int <= std_logic_vector(to_unsigned(85, PIXEL_WIDTH));
        end case;
      else
        vid_data_int <= (others => '0');
      end if;
    end if;
  end process pattern_gen_proc;

  hsync_o         <= h_sync_int;
  vsync_o         <= v_sync_int;
  vid_active_o    <= vid_active;
  fb_addr_o       <= fb_addr_int;
  fb_data_o       <= vid_data_int(7 downto 0);
  vid_data_o      <= vid_data_int;

end architecture rtl;