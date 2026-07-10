# Mini CPU Core - GHDL Build System

GHDL = ghdl
VHDL_STD = --std=08

# Source files
RTL_FILES = src/mini_cpu_pkg.vhd \
            src/alu.vhd \
            src/register_file.vhd \
            src/control_fsm.vhd \
            src/program_mem.vhd \
            src/data_mem.vhd \
            src/mini_cpu_top.vhd

TB_FILE = tb/tb_mini_cpu.vhd

TOP_TB = tb_mini_cpu

# Analysis order (must be in dependency order)
ANALYSIS_ORDER = $(RTL_FILES) $(TB_FILE)

.PHONY: all clean analyze elaborate simulate help

all: analyze elaborate simulate

help:
	@echo "Mini CPU Core - GHDL Build System"
	@echo ""
	@echo "Targets:"
	@echo "  all        - Analyze, elaborate, and simulate (default)"
	@echo "  analyze    - Compile all VHDL files"
	@echo "  elaborate  - Elaborate testbench"
	@echo "  simulate   - Run simulation with VCD output"
	@echo "  clean      - Remove build artifacts"

analyze:
	@echo "Analyzing VHDL files..."
	@for file in $(ANALYSIS_ORDER); do \
		echo "  Analyzing: $$file"; \
		$(GHDL) -a $(VHDL_STD) $$file || exit 1; \
	done
	@echo "Analysis complete."

elaborate: analyze
	@echo ""
	@echo "Elaborating testbench ($(${TOP_TB}))..."
	$(GHDL) -e $(VHDL_STD) $(TOP_TB) || exit 1
	@echo "Elaboration complete."

simulate: elaborate
	@echo ""
	@echo "Running simulation (10us)..."
	$(GHDL) -r $(VHDL_STD) $(TOP_TB) --vcd=$(TOP_TB).vcd --stop-time=10us || exit 1
	@echo ""
	@echo "Simulation complete. VCD waveform: ${TOP_TB}.vcd"

clean:
	@echo "Cleaning build artifacts..."
	rm -f *.cfi
	rm -f $(TOP_TB).vcd
	rm -f ghdl_*
	@echo "Clean complete."