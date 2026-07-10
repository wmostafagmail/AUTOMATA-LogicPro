GHDL = ghdl
STD_FLAG = --std=08

SRC_DIR = ../src
TB_DIR = ../tb
SIM_DIR = sim

SRCS := $(wildcard $(SRC_DIR)/*.vhd)
TBS  := $(wildcard $(TB_DIR)/*.vhd)

all: simulate

analyze:
	$(GHDL) -a $(STD_FLAG) $(SRCS)
	$(GHDL) -a $(STD_FLAG) $(TBS)

elaborate: analyze
	$(GHDL) -e tb_video_pattern_gen

simulate: elaborate
	$(GHDL) -r tb_video_pattern_gen --vcd=$(SIM_DIR)/video_pattern_gen.vcd

clean:
	rm -f *.cfi *.o work-*.cfi work-*.o
	rm -rf $(SIM_DIR)/*.vcd

.PHONY: all analyze elaborate simulate clean