create_clock -name clk -period 10.000 [get_ports clk]
set_property IOSTANDARD LVCMOS33 [get_ports {rst clk hsync_o vsync_o vid_data_o fb_addr_o fb_data_o}]