.PHONY: all clean sim

all: sim

sim:
	@echo "Running GHDL simulation..."
	ghdl -a --std=08 src/video_timing_pkg.vhd
	ghdl -a --std=08 src/video_top.vhd
	ghdl -a --std=08 tb/tb_video_top.vhd
	ghdl -e --std=08 tb_video_top
	ghdl -r --std=08 tb_video_top --vcd=tb_video_top.vcd --stop-time=10us

clean:
	@rm -f *.o *.vcd *.ghw tb_video_top