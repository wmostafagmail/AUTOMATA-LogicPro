## VGA Timing Constraints - PLACEHOLDER
## Target: Generic 100 MHz board (e.g., Basys 3 / Arty A7)
## Clock: 25 MHz pixel clock

create_clock -period 40.000 [get_ports clk_i]

set_property IOSTANDARD LVCMOS33 [get_ports {hs_o vs_o}]
set_property IOSTANDARD LVCMOS33 [get_ports {r_o[*] g_o[*] b_o[*]}]

## Timing exceptions (illustrative - verify with your toolchain)
set_property ASYNC_REG TRUE [get_cells {*}/u_timing/*]