# Clock definition
create_clock -name sys_clk -period 10.0 [get_ports clk]

# Reset timing
set_property ASYNC_REG TRUE [get_cells -hier -filter {NAME =~ *rst*}]