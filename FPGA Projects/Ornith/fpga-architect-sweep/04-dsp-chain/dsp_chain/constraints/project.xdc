# project.xdc - Placeholder constraints for dsp_chain
# Replace with board-specific values before implementation.

set_property IOSTANDARD LVCMOS33 [get_ports clk_i]
set_property PACKAGE_PIN <PIN_CLK> [get_ports clk_i]

set_property IOSTANDARD LVCMOS33 [get_ports rst_i]
set_property PACKAGE_PIN <PIN_RST> [get_ports rst_i]

set_property IOSTANDARD LVCMOS33 [get_ports {sample_in_i[*]}]
set_property PACKAGE_PIN <PIN_SAMPLE_IN> [get_ports {sample_in_i[0]}]

set_property IOSTANDARD LVCMOS33 [get_ports {magnitude_o[*]}]
set_property PACKAGE_PIN <PIN_MAGNITUDE_OUT> [get_ports {magnitude_o[0]}]

create_clock -period 10.000 -name clk_sys [get_ports clk_i]