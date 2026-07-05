GHDL := ghdl
TOP := tb_alu
SRC := src/alu_pkg.vhd src/alu.vhd tb/tb_alu.vhd

all: sim

sim: $(SRC)
	$(GHDL) -a --std=08 $(SRC)
	$(GHDL) -e --std=08 $(TOP)
	$(GHDL) -r --std=08 $(TOP) --vcd=tb_alu.vcd

clean:
	rm -f *.o *.vcd *.ghw $(TOP)

.PHONY: all sim clean