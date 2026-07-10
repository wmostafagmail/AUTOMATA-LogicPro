## Timing Constraints for 04-dsp-chain
create_clock -period 10.0 -name clk_sys [get_ports clk]
set_clock_uncertainty -setup 0.5 [get_clocks clk_sys]
set_false_path -from [get_cells u_dut/u_fir/*/CLKIN_divide] -to [get_cells u_dut/u_analyzer/*]