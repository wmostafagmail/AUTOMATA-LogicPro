GHDL := ghdl
GHDL_FLAGS := --std=08
DUT := alu
TB := tb_alu
TOP := tb_alu

all: compile sim run

compile:
	$(GHDL) -a $(GHDL_FLAGS) src/alu_pkg.vhd
	$(GHDL) -a $(GHDL_FLAGS) src/alu.vhd
	$(GHDL) -a $(GHDL_FLAGS) tb/$(TB).vhd

sim:
	$(GHDL) -e $(GHDL_FLAGS) $(TOP)
	$(GHDL) -r $(TOP) --wave=alu.vcd

run: sim
	@echo Simulation complete. Check exit code.

clean:
	rm -f *.o *.vcd *.cf
	rm -rf work

.PHONY: all compile sim run clean