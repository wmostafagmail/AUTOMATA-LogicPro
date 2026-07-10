create_clock -name clk -period 10.0 [get_ports clk_i]
set_property IOSTANDARD LVCMOS33 [get_ports clk_i]
set_property IOSTANDARD LVCMOS33 [get_ports rst_i]