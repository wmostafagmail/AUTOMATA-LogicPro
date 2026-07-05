.PHONY: all clean sim

all: sim

sim:
	ghdl -a --std=08 src/alu_pkg.vhd
	ghdl -a --std=08 src/alu.vhd
	ghdl -a --std=08 tb/alu_tb.vhd
	ghdl -e --std=08 alu_tb
	ghdl -r --std=08 alu_tb --vcd=alu_tb.vcd

clean:
	rm -f *.vcd *.ghw *.cfi *.o