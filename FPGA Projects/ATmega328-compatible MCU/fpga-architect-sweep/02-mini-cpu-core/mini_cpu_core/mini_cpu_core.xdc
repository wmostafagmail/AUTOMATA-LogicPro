create_clock -period 10.000 -name clk [get_ports clk]
set_clock_uncertainty -setup 1.0 [get_clocks clk]
set_input_delay -clock clk 2.0 [get_ports rst]