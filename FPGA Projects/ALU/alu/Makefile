GHDL = ghdl
STD_FLAG = --std=08
RTL_DIR = src
TB_DIR = tb
TOP_TB = alu_tb
WAVE_OUT = tb.ghw
VCD_OUT = tb.vcd

SRCS = $(wildcard $(RTL_DIR)/*.vhd) $(wildcard $(TB_DIR)/*.vhd)

.PHONY: all analyze elaborate simulate clean

all: simulate

analyze:
	$(GHDL) -a $(STD_FLAG) $(SRCS)

elaborate: analyze
	$(GHDL) -e $(STD_FLAG) $(TOP_TB)

simulate: elaborate
	$(GHDL) -r $(STD_FLAG) $(TOP_TB) --wave=$(WAVE_OUT) --vcd=$(VCD_OUT) --stop-time=2us

clean:
	rm -f *.o *.cf *.ghw *.vcd work-*