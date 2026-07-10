create_clock -period 10.000 -name clk [get_ports clk]
set_property IOSTANDARD LVCMOS33 [get_ports rst]