create_clock -period 10.000 -name clk [get_ports clk]
set_output_delay -clock clk 0.0 [get_ports mem_addr]
set_output_delay -clock clk 0.0 [get_ports mem_din]
set_output_delay -clock clk 0.0 [get_ports mem_we]