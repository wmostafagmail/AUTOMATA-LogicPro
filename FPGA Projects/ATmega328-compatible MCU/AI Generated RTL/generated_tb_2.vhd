assert rising_edge(clk_sync) and rst_sync = '1' => 
      assert addr = (others => '0') report "Reset: addr must be zero" severity error;
