# Clock definition
create_clock -period 10.000 -name clk [get_ports clk]

# Reset definition
set_property PACKAGE_PIN [get_ports rst] [get_ports rst]
set_property IOSTANDARD LVCMOS33 [get_ports rst]