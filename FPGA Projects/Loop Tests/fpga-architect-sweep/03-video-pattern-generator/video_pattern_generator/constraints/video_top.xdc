# Constraints for video_pattern_generator
# Target: Generic FPGA
# Clock: 100 MHz (10 ns period)
create_clock -name clk -period 10.0 [get_ports clk]

# Reset Synchronization (Synchronous Active-High)
set_property PACKAGE_PIN <RESET_PIN> [get_ports rst]
set_property IOSTANDARD LVCMOS33 [get_ports rst]

# Video Outputs
set_property PACKAGE_PIN <H_SYNC_PIN> [get_ports h_sync_o]
set_property PACKAGE_PIN <V_SYNC_PIN> [get_ports v_sync_o]
set_property PACKAGE_PIN <PIXEL_DATA_PIN> [get_ports pixel_data_o]
set_property IOSTANDARD LVCMOS33 [get_ports {h_sync_o v_sync_o pixel_data_o}]