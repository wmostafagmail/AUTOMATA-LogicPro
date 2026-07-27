# Usage: vivado -mode batch -source run_timing.tcl -tclargs <part> <top> <clock_port> <period_ns>
set part [lindex $argv 0]; set top [lindex $argv 1]; set clk [lindex $argv 2]; set period [lindex $argv 3]
if {$part eq "" || $top eq "" || $clk eq "" || $period eq ""} {error "part, top, clock port, and period are mandatory"}
read_vhdl -vhdl2008 [glob -nocomplain ../../rtl/common/*.vhd ../../rtl/cores/*.vhd ../../rtl/qualified_cores/*.vhd]
synth_design -top $top -part $part
create_clock -name $clk -period $period [get_ports $clk]
opt_design; place_design; phys_opt_design; route_design
report_timing_summary -file ../../reports/${top}_${part}_timing.rpt
report_utilization -file ../../reports/${top}_${part}_utilization.rpt
if {[get_property SLACK [get_timing_paths -delay_type max -max_paths 1]] < 0} {error "TIMING_CLOSURE_FAILED"}
