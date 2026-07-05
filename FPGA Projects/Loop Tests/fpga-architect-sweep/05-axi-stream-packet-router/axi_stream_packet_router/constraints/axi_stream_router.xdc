# AXI-Stream Router Constraints
create_clock -name clk -period 10.000 [get_ports clk]
set_property PACKAGE_PIN <clk_pin> [get_ports clk]
set_property IOSTANDARD LVCMOS33 [get_ports clk]