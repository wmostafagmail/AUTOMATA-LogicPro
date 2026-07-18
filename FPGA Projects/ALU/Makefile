WORKDIR = work
GHDL = ghdl
WAVES_DIR = waves

.PHONY: analyze elaborate simulate clean

analyze:
	$(GHDL) -a --std=08 --workdir=$(WORKDIR) src/alu_pkg.vhd
	$(GHDL) -a --std=08 --workdir=$(WORKDIR) src/alu.vhd
	$(GHDL) -a --std=08 --workdir=$(WORKDIR) tb/alu_tb.vhd

elaborate: analyze
	$(GHDL) -e --std=08 --workdir=$(WORKDIR) tb_alu

simulate: elaborate
	mkdir -p $(WAVES_DIR)
	$(GHDL) -r --std=08 --workdir=$(WORKDIR) tb_alu --vcd=$(WAVES_DIR)/alu_tb.vcd --stop-time=1us

clean:
	rm -rf $(WORKDIR) $(WAVES_DIR)