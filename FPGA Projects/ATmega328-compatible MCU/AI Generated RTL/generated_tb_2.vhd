rst_n <= '1'; wait for 4 ns;
     rst_n <= '0'; wait for 10 ns;
     -- Observe debug_zero asserting at t=35ns relative to simulation start
