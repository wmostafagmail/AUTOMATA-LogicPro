library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.video_pkg.all;
use std.env.all;

entity tb_video_top is
end entity;

architecture sim of tb_video_top is
  constant CLK_PERIOD : time := 10 ns;
  signal clk          : std_logic := '0';
  signal rst          : std_logic := '1';
  signal h_sync       : std_logic;
  signal v_sync       : std_logic;
  signal active       : std_logic;
  signal pixel_data   : pixel_t;

  procedure check_eq(
    constant label_text : in string;
    constant got         : in pixel_t;
    constant expected    : in pixel_t;
    variable failed_io   : inout boolean
  ) is
  begin
    if got /= expected then
      failed_io := true;
      report "FAIL " & label_text severity error;
    end if;
  end procedure;

begin
  clk <= not clk after CLK_PERIOD / 2;

  dut : entity work.video_top
    port map (clk => clk, rst => rst, h_sync_o => h_sync, v_sync_o => v_sync, active_o => active, pixel_data => pixel_data);

  stimulus : process
    variable failed : boolean := false;
    variable pat    : pixel_t;
  begin
    rst <= '1';
    wait for 20 ns;
    rst <= '0';
    wait until rising_edge(clk);

    wait for 100 * CLK_PERIOD;

    if active /= '1' then
      report "ACTIVE_VIDEO_CHECK_FAILED" severity error;
      failed := true;
    end if;

    wait until rising_edge(clk);
    pat := generate_pattern(to_unsigned(0, 11));
    check_eq("PAT_ADDR_0", pixel_data, pat, failed);

    wait until rising_edge(clk);
    pat := generate_pattern(to_unsigned(1, 11));
    check_eq("PAT_ADDR_1", pixel_data, pat, failed);

    if failed then
      report "TEST FAILED" severity failure;
    else
      report "TEST PASSED" severity note;
      std.env.stop(0);
    end if;
  end process;
end architecture;