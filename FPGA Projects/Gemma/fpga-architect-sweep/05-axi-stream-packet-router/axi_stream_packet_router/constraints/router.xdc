# Clock definition (100MHz)
create_clock -period 10.000 -name sys_clk [get_ports clk]

# Reset Path
set_false_path -from [get_ports reset]