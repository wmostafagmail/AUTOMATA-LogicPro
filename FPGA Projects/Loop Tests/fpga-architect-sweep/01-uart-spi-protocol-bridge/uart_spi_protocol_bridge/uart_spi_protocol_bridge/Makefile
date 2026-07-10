GHDL = ghdl
DUT = uart_spi_bridge
TB = tb_$(DUT)

all: analyze simulate run

analyze:
	$(GHDL) -a --std=08 src/bridge_types_pkg.vhd
	$(GHDL) -a --std=08 src/$(DUT).vhd
	$(GHDL) -a --std=08 tb/$(TB).vhd

simulate:
	$(GHDL) -e --std=08 $(TB) --workdir=.
	$(GHDL) -r --std=08 $(TB) --vcd=$(TB).vcd

run: simulate
	@echo Simulation complete. Check $(TB).vcd for waveform.

clean:
	rm -f *.o *.vcd $(TB)

.PHONY: all analyze simulate run clean