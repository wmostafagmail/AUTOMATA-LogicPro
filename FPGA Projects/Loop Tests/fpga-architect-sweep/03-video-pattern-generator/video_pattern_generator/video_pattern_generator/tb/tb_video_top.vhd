library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.video_timing_pkg.all;
use std.env.all;

entity tb_video_top is
end entity tb_video_top;

architecture sim of tb_video_top is
  constant CLK_PERIOD : time := 10 ns;
  signal clk           : std_logic := '0';
  signal rst           : std_logic := '1';
  signal hsync         : std_logic;
  signal vsync         : std_logic;
  signal vid_active    : std_logic;
  signal fb_addr       : unsigned(15 downto 0);
  signal fb_data       : std_logic_vector(7 downto 0);
  signal vid_data      : std_logic_vector(15 downto 0);

  procedure check_pass(msg : in string) is
  begin
    report msg;
    std.env.stop(0);
  end procedure check_pass;

begin
  clk <= not clk after CLK_PERIOD / 2;

  dut_inst : component video_top
    generic map (
      PIXEL_WIDTH => 16
    )
    port map (
      clk          => clk,
      rst          => rst,
      hsync_o      => hsync,
      vsync_o      => vsync,
      vid_active_o => vid_active,
      fb_addr_o    => fb_addr,
      fb_data_o    => fb_data,
      vid_data_o   => vid_data
    );

  stim_proc : process
    variable h_cnt : integer := 0;
    variable v_cnt : integer := 0;
    variable fb_exp: unsigned(15 downto 0) := (others => '0');
  begin
    wait for 100 ns;
    rst <= '0';

    wait until rising_edge(clk);
    assert hsync = '1' report "HSYNC reset fail" severity error;
    assert vsync = '1' report "VSYNC reset fail" severity error;
    assert vid_active = '0' report "Active video reset fail" severity error;
    assert fb_addr = to_unsigned(0, 16) report "FB addr reset fail" severity error;

    loop
      wait until rising_edge(clk);
      h_cnt := h_cnt + 1;
      if h_cnt = H_TOTAL then
        h_cnt := 0;
        v_cnt := v_cnt + 1;
      end if;

      if h_cnt >= H_SYNC_START and h_cnt <= H_SYNC_END - 1 then
        assert hsync = '0' report "HSYNC should be low" severity error;
      else
        assert hsync = '1' report "HSYNC should be high" severity error;
      end if;

      if v_cnt >= V_SYNC_START and v_cnt <= V_SYNC_END - 1 then
        assert vsync = '0' report "VSYNC should be low" severity error;
      else
        assert vsync = '1' report "VSYNC should be high" severity error;
      end if;

      if h_cnt >= H_SYNC_END and h_cnt <= H_VALID_END and
         v_cnt >= V_SYNC_END and v_cnt <= V_VALID_END then
        assert vid_active = '1' report "Active video should be high" severity error;
        assert fb_addr = fb_exp report "FB addr mismatch" severity error;
        fb_exp := fb_exp + 1;
      else
        assert vid_active = '0' report "Active video should be low" severity error;
        if v_cnt = V_SYNC_END and h_cnt = H_SYNC_END then
          fb_exp := to_unsigned(0, 16);
        end if;
      end if;

      if v_cnt = V_TOTAL then
        exit;
      end if;
    end loop;

    check_pass("All checks passed");
  end process stim_proc;
end architecture sim;
