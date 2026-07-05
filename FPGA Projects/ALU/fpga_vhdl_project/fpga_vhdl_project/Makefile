.PHONY: all clean sim analyze elaborate run

GHDL = ghdl
STD = --std=08

all: sim

analyze:
	$(GHDL) -a $(STD) src/alu_pkg.vhd
	$(GHDL) -a $(STD) src/alu.vhd
	$(GHDL) -a $(STD) tb/alu_tb.vhd

elaborate: analyze
	$(GHDL) -e $(STD) alu_tb

run: elaborate
	$(GHDL) -r $(STD) alu_tb --stop-time=120us

sim: run

clean:
	rm -f *.o *.elf workdir/*