# Constraints for Counter ALU
# Target: Generic FPGA
# Clock: 100 MHz

set_property CLOCK_PERIOD 10.0 [get_ports clk]
set_property IOSTANDARD LVCMOS33 [get_ports {clk, reset_n, a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7], op[0], op[1], op[2]}]
set_property IOSTANDARD LVCMOS33 [get_ports {result[0], result[1], result[2], result[3], result[4], result[5], result[6], result[7], overflow, zero}]