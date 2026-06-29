-- filename: tb_avr_core_skeleton.vhd (excerpt)
  constant CLK_PERIOD : time := 1 ns;
  signal clk : std_logic := '0';
  begin
      clk <= not clk after CLK_PERIOD / 2;
      reset <= '1', '0' after 4 ns;
      -- Monitor debug_zero transition at ~35 ns
      assert rising_edge(clk) and debug_zero = '1' after 30 ns and before 40 ns 
          report "Zero flag timing mismatch" severity warning;
