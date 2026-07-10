create_clock -period 10.0 -name clk_sys [get_ports clk]
set_clock_uncertainty -setup 0.5 [get_clocks clk_sys]