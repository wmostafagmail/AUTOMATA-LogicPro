# Constraints for 8-bit ALU
# Target clock: 100 MHz (10 ns period)
create_clock -name clk -period 10.0 [get_ports clk_i]
set_property IOSTANDARD LVCMOS33 [get_ports clk_i]
set_property IOSTANDARD LVCMOS33 [get_ports rst_i]
set_property IOSTANDARD LVCMOS33 [get_ports a_i]
set_property IOSTANDARD LVCMOS33 [get_ports b_i]
set_property IOSTANDARD LVCMOS33 [get_ports op_i]