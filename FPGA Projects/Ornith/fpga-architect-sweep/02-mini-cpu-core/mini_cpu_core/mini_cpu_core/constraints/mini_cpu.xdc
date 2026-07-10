# Clock definition (100 MHz)
create_clock -period 10.000 [get_ports clk]

# Reset pin assignment (if applicable)
set_property IOSTANDARD LVCMOS33 [get_ports reset_n]

# Debug output pins (optional)
set_property IOSTANDARD LVCMOS33 [get_ports {pc_out[*]}]
set_property IOSTANDARD LVCMOS33 [get_ports {current_opcode_out[*]}]