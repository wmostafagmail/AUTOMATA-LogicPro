SIM ?= ghdl
DUT ?= alu
TB ?= tb_alu

all: sim

sim:
	$(SIM) -a --std=08 counter/counter/src/alu_pkg.vhd counter/counter/src/alu.vhd counter/counter/tb/tb_alu.vhd
	$(SIM) -e --std=08 $(TB)
	$(SIM) -r --std=08 $(TB) --wave=$(TB).fst

clean:
	rm -f *.vhd *.fst *.o

run:
	$(SIM) -r --std=08 $(TB)

help:
	@echo "Usage: make [target]"
	@echo "Targets: all, sim, clean, run, help"