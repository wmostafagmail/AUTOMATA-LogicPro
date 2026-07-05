GHDL = ghdl
STD = 08

all: sim

sim:
	$(GHDL) -a --std=$(STD) src/alu_pkg.vhd
	$(GHDL) -a --std=$(STD) src/alu.vhd
	$(GHDL) -e --std=$(STD) tb/tb_alu
	$(GHDL) -r --std=$(STD) tb/tb_alu --wave=tb_alu.fst

clean:
	rm -f *.vcd *.fst *.o *.elf