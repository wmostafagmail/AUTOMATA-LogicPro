# Clock constraint
create_clock -period 10.0 -name clk [get_ports clk]

# I/O constraints (optional, adjust as needed)
# set_property PACKAGE_PIN <pin> [get_ports clk]
# set_property IOSTANDARD LVCMOS33 [get_ports clk]