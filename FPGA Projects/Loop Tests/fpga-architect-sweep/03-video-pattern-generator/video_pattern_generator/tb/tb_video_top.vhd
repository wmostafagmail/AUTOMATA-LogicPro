library ieee;
use ieee.std_logic_1164.all;
use std.env.all;
use work.video_pkg.all;

entity tb_video_top is
end entity tb_video_top;

architecture sim of tb_video_top is
  constant CLK_PERIOD : time := 10 ns;
  
  signal clk : std_logic := '0';
  signal rst : std_logic := '0';
  
  signal h_sync_o : std_logic;
  signal v_sync_o : std_logic;
  signal pixel_data_o : pixel_t;
  signal pixel_valid_o : std_logic;
  
  signal sig_pass_count : integer := 0;
  signal sig_fail_count : integer := 0;
begin
  clk <= not clk after CLK_PERIOD / 2;
  
  dut : entity work.video_top(rtl)
    port map (clk => clk, rst => rst, h_sync_o => h_sync_o, v_sync_o => v_sync_o, pixel_data_o => pixel_data_o, pixel_valid_o => pixel_valid_o);
    
  process
    variable pass_cnt : integer := 0;
    variable fail_cnt : integer := 0;
  begin
    rst <= '1';
    wait for 20 ns;
    rst <= '0';
    wait for 20 ns;
    
    wait until h_sync_o = '1' and v_sync_o = '1';
    wait until h_sync_o = '0';
    
    for i in 0 to H_SYNC - 1 loop
      wait until rising_edge(clk);
      if h_sync_o /= '0' then
        fail_cnt := fail_cnt + 1;
        report "FAIL: H Sync pulse width mismatch" severity error;
      end if;
    end loop;
    
    wait until h_sync_o = '0';
    for i in 0 to H_ACTIVE - 1 loop
      wait until rising_edge(clk);
      if h_sync_o /= '1' then
        fail_cnt := fail_cnt + 1;
        report "FAIL: H Active window mismatch" severity error;
      end if;
    end loop;
    
    wait until v_sync_o = '0';
    for i in 0 to V_SYNC - 1 loop
      wait until rising_edge(clk);
      if v_sync_o /= '0' then
        fail_cnt := fail_cnt + 1;
        report "FAIL: V Sync pulse width mismatch" severity error;
      end if;
    end loop;
    
    wait until h_sync_o = '0';
    wait until v_sync_o = '0';
    for i in 0 to 10 - 1 loop
      wait until rising_edge(clk);
      if pixel_valid_o /= '1' then
        fail_cnt := fail_cnt + 1;
        report "FAIL: Pixel valid missing during active video" severity error;
      else
        pass_cnt := pass_cnt + 1;
      end if;
    end loop;
    
    sig_pass_count <= pass_cnt;
    sig_fail_count <= fail_cnt;
    
    if fail_cnt = 0 then
      report "SUCCESS: All video timing checks passed" severity success;
    else
      report "FAILURE: " & integer'image(fail_cnt) & " checks failed" severity failure;
    end if;
    
    std.env.stop(0);
  end process;
end architecture sim;