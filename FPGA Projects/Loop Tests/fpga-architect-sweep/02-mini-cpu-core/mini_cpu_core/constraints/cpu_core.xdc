create_clock -name clk -period 10.0 [get_ports clk]
set_property -dict {PACKAGE_PIN J15 IOSTANDARD LVCMOS33} [get_ports clk]
set_property -dict {PACKAGE_PIN J14 IOSTANDARD LVCMOS33} [get_ports rst]
set_false_path -from [get_ports rst]