# Clock definition: 100MHz
create_clock -period 10.000 -name sys_clk [get_ports clk]

# Reset and IO placeholders
# set_input_delay -clock sys_clk 2.0 [get_ports reset]