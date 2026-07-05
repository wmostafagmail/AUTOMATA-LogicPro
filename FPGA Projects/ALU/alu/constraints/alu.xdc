# Generic placeholder XDC for the ALU project.
# Update these pins and frequencies to match your actual FPGA board.

# Create 100 MHz system clock (example)
create_clock -period 10.000 [get_ports clk_i]

# Synchronous active-high reset constraint (example)
set_property PACKAGE_PIN <BOARD_RESET_PIN> [get_ports rst_ni]
set_property IOSTANDARD LVCMOS33 [get_ports rst_ni]