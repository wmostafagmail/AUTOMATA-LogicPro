# Constraints for mini_cpu_core
# Clock definition (100MHz)
create_clock -period 10.000 -name sys_clk [get_ports clk]

# I/O mapping would go here based on board selection