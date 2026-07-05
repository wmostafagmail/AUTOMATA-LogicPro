.PHONY: clean sim

WORKDIR := work
GHDL := ghdl

all: sim

sim:
	$(GHDL) -a --std=08 --workdir=$(WORKDIR) src/cpu_pkg.vhd
	$(GHDL) -a --std=08 --workdir=$(WORKDIR) src/cpu_core.vhd
	$(GHDL) -a --std=08 --workdir=$(WORKDIR) tb/tb_cpu_core.vhd
	$(GHDL) -e --std=08 --workdir=$(WORKDIR) tb_cpu_core
	$(GHDL) -r --std=08 --workdir=$(WORKDIR) tb_cpu_core

clean:
	rm -rf $(WORKDIR) *.vcd