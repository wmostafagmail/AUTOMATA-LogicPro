.PHONY: clean analyze simulate run

analyze:
	ghdl -a --std=08 src/dsp_chain_pkg.vhd
	ghdl -a --std=08 src/fir_filter.vhd
	ghdl -a --std=08 src/fft_lite.vhd
	ghdl -a --std=08 src/dsp_chain_top.vhd
	ghdl -a --std=08 tb/tb_dsp_chain.vhd

simulate: analyze
	ghdl -e --std=08 tb_dsp_chain
	ghdl -r --std=08 tb_dsp_chain --vcd=dsp_chain.vcd

run: simulate
	@echo "Run complete."

clean:
	rm -f *.vcd *.o *.cf