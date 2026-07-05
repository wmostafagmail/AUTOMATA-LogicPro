.PHONY: all analyze elaborate simulate clean

VHDL_STD   ?= --std=08
GHDL       := ghdl
ANALYZE    := $(GHDL) -a $(VHDL_STD)
ELABORATE  := $(GHDL) -e $(VHDL_STD)
RUN        := $(GHDL) -r $(VHDL_STD)

SRC_PKG    := src/alu_pkg.vhd
SRC_DUT    := src/alu.vhd
TB         := tb/alu_tb.vhd

TOP_TB     := alu_tb
STOP_TIME  ?= 120us

all: analyze elaborate simulate

analyze:
	$(ANALYZE) $(SRC_PKG)
	$(ANALYZE) $(SRC_DUT)
	$(ANALYZE) $(TB)

elaborate: analyze
	$(ELABORATE) $(TOP_TB)

simulate: elaborate
	$(RUN) $(TOP_TB) --stop-time=$(STOP_TIME)

clean:
	rm -f *.o *.cfghdl work-* alu_tb