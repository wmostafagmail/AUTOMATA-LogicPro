GHDL := ghdl
STD := 08

all: sim

sim:
	$(GHDL) -a --std=$(STD) src/alu_pkg.vhd
	$(GHDL) -a --std=$(STD) src/alu.vhd
	$(GHDL) -a --std=$(STD) tb/tb_alu.vhd
	$(GHDL) -e --std=$(STD) tb_alu
	$(GHDL) -r --std=$(STD) tb_alu --vcd=tb_alu.vcd

clean:
	rm -f *.vhd *.vhdl *.o *.cf *.ghw *.vcd *.exe