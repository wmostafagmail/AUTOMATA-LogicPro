# Clock Constraint
create_clock -period 10.000 -name sys_clk [get_ports sys_clk]

# Pin placeholders (generic)
# set_property PACKAGE_PIN <pin> [get_ports hsync_o]
# set_property PACKAGE_PIN <pin> [get_ports vsync_o]
# set_property PACKAGE_PIN <pin> [get_ports rgb_r_o[0]]