# Clock definition (100 MHz)
create_clock -period 10.000 [get_ports clk]

# Reset pin assignment (if applicable)
set_property IOSTANDARD LVCMOS33 [get_ports reset_n]

# Memory interface pins (if connected to external memory)
set_property IOSTANDARD LVCMOS33 [get_ports {mem_addr[*]}]
set_property IOSTANDARD LVCMOS33 [get_ports {mem_data[*]}]
set_property IOSTANDARD LVCMOS33 [get_ports {mem_read}]
set_property IOSTANDARD LVCMOS33 [get_ports {mem_write}]

# Debug output pins (optional)
set_property IOSTANDARD LVCMOS33 [get_ports {pc_out[*]}]