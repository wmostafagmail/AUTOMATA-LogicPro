GHDL = ghdl
STD = --std=08
TOP = tb_cpu_core

all: build sim

build:
	$(GHDL) -a $(STD) src/cpu_pkg.vhd
	$(GHDL) -a $(STD) src/cpu_pkg_body.vhd
	$(GHDL) -a $(STD) src/cpu_core.vhd
	$(GHDL) -a $(STD) tb/tb_cpu_core.vhd
	$(GHDL) -e $(STD) $(TOP)

sim:
	$(GHDL) -r $(STD) $(TOP) --vcd=cpu_core_tb.vcd --stop-time=1us

clean:
	rm -f *.o *.vcd $(TOP)