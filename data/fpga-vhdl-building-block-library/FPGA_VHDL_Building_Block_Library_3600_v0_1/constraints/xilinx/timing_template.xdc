# Replace port names and periods with project values.
create_clock -name sys_clk -period 10.000 [get_ports clk]
# set_input_delay  -clock sys_clk 2.000 [get_ports {data_in[*]}]
# set_output_delay -clock sys_clk 2.000 [get_ports {data_out[*]}]
# Do not add false paths broadly. Constrain only reviewed asynchronous relationships.
