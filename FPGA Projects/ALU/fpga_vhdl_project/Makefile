GHDL = ghdl
WORKDIR = work
SRC_DIR = src
TB_DIR = tb
WAVE_DIR = waves

all: clean simulate

clean:
	rm -rf $(WORKDIR) $(WAVE_DIR)

simulate:
	mkdir -p $(WORKDIR) $(WAVE_DIR)
	$(GHDL) -a --std=08 --workdir=$(WORKDIR) $(SRC_DIR)/alu_pkg.vhd
	$(GHDL) -a --std=08 --workdir=$(WORKDIR) $(SRC_DIR)/alu.vhd
	$(GHDL) -a --std=08 --workdir=$(WORKDIR) $(TB_DIR)/alu_tb.vhd
	$(GHDL) -e --std=08 --workdir=$(WORKDIR) tb_alu
	$(GHDL) -r --std=08 --workdir=$(WORKDIR) tb_alu --vcd=$(WAVE_DIR)/alu_tb.vcd --stop-time=1us