GHDL = ghdl
STD = --std=08
TOP = uart_spi_bridge_top
TB = tb_uart_spi_bridge

all: analyze elaborate simulate

analyze:
	$(GHDL) $(STD) -a src/uart_spi_bridge_pkg.vhd
	$(GHDL) $(STD) -a src/uart_spi_bridge_top.vhd
	$(GHDL) $(STD) -a tb/$(TB).vhd

elaborate:
	$(GHDL) $(STD) -e $(TOP)

simulate:
	$(GHDL) $(STD) -r $(TOP) --tb-top=$(TB) --vcd=waveform.vcd

clean:
	rm -f *.o *.vcd