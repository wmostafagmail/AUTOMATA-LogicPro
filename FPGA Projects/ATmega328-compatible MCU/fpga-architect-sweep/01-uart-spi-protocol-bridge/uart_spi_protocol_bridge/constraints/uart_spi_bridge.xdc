# Clock definition
create_clock -period 10.000 -name clk [get_ports clk_i]
# Reset definition
set_property -dict {PACKAGE_PIN A1 IOSTANDARD LVCMOS33} [get_ports rst_i]