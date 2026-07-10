# AXI-Stream Packet Router Constraints
create_clock -period 10.0 -name clk [get_ports clk_i]
set_property IOSTANDARD LVCMOS33 [get_ports {clk_i}]
set_property IOSTANDARD LVCMOS33 [get_ports {rst_i}]
set_property IOSTANDARD LVCMOS33 [get_ports {dest_sel_i}]