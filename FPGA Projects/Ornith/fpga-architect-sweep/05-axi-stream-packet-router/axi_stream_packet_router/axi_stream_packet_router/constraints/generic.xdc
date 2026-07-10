## Generic XDC placeholder - adapt to your board/clock.
## Clock at 100 MHz (period = 10 ns).
create_clock -period 10.000 [get_ports clk_i]

## Synchronous active-high reset release timing guard.
set_property PACKAGE_PIN <pin> [get_ports rst_ni]
set_property IOSTANDARD LVCMOS33 [get_ports rst_ni]