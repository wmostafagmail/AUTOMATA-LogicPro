GHDL = ghdl
DUT = axi_stream_router
TB = tb_$(DUT)
TOP = $(DUT)

analyze:
	$(GHDL) -a --std=08 src/$(DUT).vhd
	$(GHDL) -a --std=08 tb/$(TB).vhd

elaborate:
	$(GHDL) -e --std=08 $(TOP)

simulate: analyze elaborate
	$(GHDL) -r --std=08 $(TOP) --vcd=wave.vcd

clean:
	rm -f *.vcd *.o *.gch

.PHONY: analyze elaborate simulate clean