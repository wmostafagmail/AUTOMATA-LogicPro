GHDL := ghdl
STD   := --std=08

.PHONY: all clean sim

all: sim

sim:
	$(GHDL) -a $(STD) src/bridge_pkg.vhd
	$(GHDL) -a $(STD) src/uart_spi_bridge.vhd
	$(GHDL) -a $(STD) tb/tb_uart_spi_bridge.vhd
	$(GHDL) -e $(STD) tb_uart_spi_bridge
	$(GHDL) -r $(STD) tb_uart_spi_bridge --vcd=uart_spi_bridge.vcd

clean:
	rm -f *.vhd *.o *.elab *.ghw *.vcd