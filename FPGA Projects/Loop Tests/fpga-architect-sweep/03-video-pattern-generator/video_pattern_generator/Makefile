GHDL = ghdl
TOP = video_top
TB = tb_video_top

.PHONY: all clean sim

all: sim

sim:
	$(GHDL) -a --std=08 src/video_pkg.vhd
	$(GHDL) -a --std=08 src/h_timing.vhd
	$(GHDL) -a --std=08 src/v_timing.vhd
	$(GHDL) -a --std=08 src/pixel_gen.vhd
	$(GHDL) -a --std=08 src/video_top.vhd
	$(GHDL) -a --std=08 tb/tb_video_top.vhd
	$(GHDL) -e --std=08 $(TOP)
	$(GHDL) -r --std=08 $(TOP) --tb-top=$(TB)

clean:
	rm -f *.o *.vhd
	rm -f $(TOP)