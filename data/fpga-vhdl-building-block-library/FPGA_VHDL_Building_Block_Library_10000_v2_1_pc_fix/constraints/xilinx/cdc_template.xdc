# Example only; adapt hierarchy names after synthesis.
# set_property ASYNC_REG TRUE [get_cells -hier -regexp {.*sync_regs_reg.*}]
# set_clock_groups -asynchronous -group [get_clocks wr_clk] -group [get_clocks rd_clk]
# For asynchronous FIFO pointers, use max-delay/bus-skew constraints appropriate to the FPGA flow.
