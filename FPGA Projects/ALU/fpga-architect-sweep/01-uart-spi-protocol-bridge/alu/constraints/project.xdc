# Project: ALU
# Target: Generic
create_clock -period 10.000 -name clk [get_ports clk_i]
set_property PACKAGE_PIN [get_ports clk_i] <PIN_CLK>
set_property PACKAGE_PIN [get_ports rst_i] <PIN_RST>
set_property PACKAGE_PIN [get_ports op_i[0]] <PIN_OP0>
set_property PACKAGE_PIN [get_ports op_i[1]] <PIN_OP1>
set_property PACKAGE_PIN [get_ports op_i[2]] <PIN_OP2>
set_property PACKAGE_PIN [get_ports a_i[0]] <PIN_A0>
set_property PACKAGE_PIN [get_ports a_i[7]] <PIN_A7>
set_property PACKAGE_PIN [get_ports b_i[0]] <PIN_B0>
set_property PACKAGE_PIN [get_ports b_i[7]] <PIN_B7>
set_property PACKAGE_PIN [get_ports result_o[0]] <PIN_RES0>
set_property PACKAGE_PIN [get_ports result_o[7]] <PIN_RES7>
set_property PACKAGE_PIN [get_ports zero_o] <PIN_ZERO>