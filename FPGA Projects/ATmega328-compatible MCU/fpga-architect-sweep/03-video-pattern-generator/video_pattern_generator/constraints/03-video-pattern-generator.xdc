## Clock Constraints
create_clock -period 39.72 [get_ports clk_i]

## Output Ports
set_output_delay -clock [get_clocks clk_i] [get_ports h_sync_o]
set_output_delay -clock [get_clocks clk_i] [get_ports v_sync_o]
set_output_delay -clock [get_clocks clk_i] [get_ports pixel_data_o]