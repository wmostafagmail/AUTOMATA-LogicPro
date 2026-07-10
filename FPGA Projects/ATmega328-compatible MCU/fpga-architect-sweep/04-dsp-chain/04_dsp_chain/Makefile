all: sim

sim:
	cd sim && ./run_ghdl.sh

clean:
	rm -f sim/*.vcd work-*.cf work-*.o work-*.a tb_dsp_chain_top 2>/dev/null || true

.PHONY: all sim clean