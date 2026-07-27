library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity bb_video_timing_core is
  generic (
    H_WIDTH : positive := 16;
    V_WIDTH : positive := 16
  );
  port (
    pixel_clk : in  std_logic;
    rst_n     : in  std_logic;
    enable    : in  std_logic;
    h_active  : in  std_logic_vector(H_WIDTH-1 downto 0);
    h_front   : in  std_logic_vector(H_WIDTH-1 downto 0);
    h_sync    : in  std_logic_vector(H_WIDTH-1 downto 0);
    h_back    : in  std_logic_vector(H_WIDTH-1 downto 0);
    v_active  : in  std_logic_vector(V_WIDTH-1 downto 0);
    v_front   : in  std_logic_vector(V_WIDTH-1 downto 0);
    v_sync    : in  std_logic_vector(V_WIDTH-1 downto 0);
    v_back    : in  std_logic_vector(V_WIDTH-1 downto 0);
    x         : out std_logic_vector(H_WIDTH-1 downto 0);
    y         : out std_logic_vector(V_WIDTH-1 downto 0);
    hsync_out : out std_logic;
    vsync_out : out std_logic;
    data_enable : out std_logic;
    frame_start : out std_logic
  );
end entity;

architecture rtl of bb_video_timing_core is
  signal h_count : unsigned(H_WIDTH-1 downto 0) := (others => '0');
  signal v_count : unsigned(V_WIDTH-1 downto 0) := (others => '0');
  signal h_total, v_total : unsigned(H_WIDTH-1 downto 0);
  signal v_total_n : unsigned(V_WIDTH-1 downto 0);
begin
  h_total <= unsigned(h_active)+unsigned(h_front)+unsigned(h_sync)+unsigned(h_back);
  v_total_n <= unsigned(v_active)+unsigned(v_front)+unsigned(v_sync)+unsigned(v_back);
  x <= std_logic_vector(h_count);
  y <= std_logic_vector(v_count);
  data_enable <= '1' when h_count < unsigned(h_active) and v_count < unsigned(v_active) else '0';
  hsync_out <= '0' when h_count >= unsigned(h_active)+unsigned(h_front) and
                        h_count < unsigned(h_active)+unsigned(h_front)+unsigned(h_sync) else '1';
  vsync_out <= '0' when v_count >= unsigned(v_active)+unsigned(v_front) and
                        v_count < unsigned(v_active)+unsigned(v_front)+unsigned(v_sync) else '1';
  frame_start <= '1' when h_count = 0 and v_count = 0 else '0';

  process(pixel_clk)
  begin
    if rising_edge(pixel_clk) then
      if rst_n = '0' then
        h_count <= (others => '0');
        v_count <= (others => '0');
      elsif enable = '1' then
        if h_count + 1 >= h_total then
          h_count <= (others => '0');
          if v_count + 1 >= v_total_n then
            v_count <= (others => '0');
          else
            v_count <= v_count + 1;
          end if;
        else
          h_count <= h_count + 1;
        end if;
      end if;
    end if;
  end process;
end architecture;
