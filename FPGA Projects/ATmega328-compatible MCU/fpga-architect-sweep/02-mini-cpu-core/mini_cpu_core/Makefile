GHDL := ghdl
GHDL_FLAGS := --std=08 --workdir=work
TOP := tb_cpu_core

all: sim

sim:
	$(GHDL) -a $(GHDL_FLAGS) src/cpu_pkg.vhd
	$(GHDL) -a $(GHDL_FLAGS) src/alu.vhd
	$(GHDL) -a $(GHDL_FLAGS) src/regfile.vhd
	$(GHDL) -a $(GHDL_FLAGS) src/cpu_core.vhd
	$(GHDL) -a $(GHDL_FLAGS) tb/tb_cpu_core.vhd
	$(GHDL) -e $(GHDL_FLAGS) $(TOP)
	$(GHDL) -r $(GHDL_FLAGS) $(TOP) --vcd=tb_cpu_core.vcd

clean:
	rm -rf work *.vcd *.ghw