GHDL   ?= ghdl
STD    ?= --std=08
OUT    ?= vpid_tb
VCD    ?= sim/vga_waveform.vcd

SRCS  := src/vga_timing_pkg.vhd \
         src/vga_timing_gen.vhd \
         src/vga_pixel_window.vhd \
         src/video_pattern_gen.vhd \
         src/top_video_gen.vhd \
         tb/tb_top_video_gen.vhd

.PHONY: all clean sim run

all: $(OUT)

$(OUT): $(SRCS)
	@$(GHDL) -a $(STD) $(SRCS)
	@$(GHDL) -e $(STD) -o $@ tb_top_video_gen

sim: $(OUT)
	@mkdir -p sim
	@$(GHDL) -r $(STD) -o $(OUT) tb_top_video_gen --vcd=$(VCD) --stop-time=20ms

run: sim
	@grep -E "PASS|FAIL" *.log 2>/dev/null || true

clean:
	rm -f $(OUT) *.ghw *.vcd work_*