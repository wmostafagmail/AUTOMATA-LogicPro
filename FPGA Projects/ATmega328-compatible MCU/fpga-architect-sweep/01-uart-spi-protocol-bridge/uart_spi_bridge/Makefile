SIM_CMD := ghdl
STANDARD := 08
VCD_OUT := sim/bridge_sim.vcd

all: sim

clean:
	-rm -rf *.o *~ work-*/ *.vcd

sim: clean
	$(SIM_CMD) -a --std=$(STANDARD) src/*.vhd tb/*.vhd
	$(SIM_CMD) -e tb_uart_spi_bridge
	./tb_uart_spi_bridge --vcd=$(VCD_OUT)