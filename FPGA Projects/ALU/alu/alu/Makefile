GHDL = ghdl
VHDL_STD = --std=08
WORK = work

.PHONY: all clean compile simulate

all: clean compile simulate

clean:
	$(GHDL) --clean

compile:
	$(GHDL) $(VHDL_STD) --synth --$(WORK)=$(WORK) --source=src/alu_pkg.vhd
	$(GHDL) $(VHDL_STD) --synth --$(WORK)=$(WORK) --source=src/alu.vhd
	$(GHDL) $(VHDL_STD) --synth --$(WORK)=$(WORK) --source=tb/alu_tb.vhd
	$(GHDL) $(VHDL_STD) -e alu_tb

simulate:
	$(GHDL) -r alu_tb --stop-time=100us

run: simulate