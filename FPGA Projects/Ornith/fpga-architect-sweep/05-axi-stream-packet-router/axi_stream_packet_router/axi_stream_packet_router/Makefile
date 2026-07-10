GHDL     := ghdl
STD      := --std=08
WNO      := -Wno-miscellaneous
OUTDIR   := output

RTL_SRCS := src/axi_stream_router_pkg.vhd \
            src/router_arbiter.vhd \
            src/axi_stream_slave.vhd \
            src/axi_stream_master.vhd \
            src/axi_stream_packet_router.vhd

TB_SRC   := tb/tb_axi_stream_packet_router.vhd

ALL_SRCS := $(RTL_SRCS) $(TB_SRC)

.PHONY: all analyze elaborate simulate clean

all: simulate

analyze:
	$(GHDL) $(STD) $(WNO) -a $(ALL_SRCS)

elaborate: analyze
	$(GHDL) -e $(STD) $(WNO) tb_axi_stream_packet_router

simulate: elaborate
	mkdir -p $(OUTDIR)
	$(GHDL) -r $(STD) $(WNO) tb_axi_stream_packet_router --vcd=$(OUTDIR)/output.vcd

clean:
	rm -rf $(OUTDIR) *.cf db obj work_*