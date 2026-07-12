create_clock -period 10 -name clk [get_ports clk_i]
set_property PACKAGE_PIN A1 [get_ports clk_i]
set_property IOSTANDARD LVCMOS33 [get_ports clk_i]