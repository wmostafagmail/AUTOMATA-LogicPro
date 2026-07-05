GHDL = ghdl
WORK_DIR = ghdl_work
VHDL_SRCS = src/axi_stream_pkg.vhd src/axi_stream_router.vhd
TB_SRCS = tb/tb_axi_stream_router.vhd

.PHONY: all clean sim

all: sim

sim:
	@mkdir -p $(WORK_DIR)
	$(GHDL) -a --std=08 --workdir=$(WORK_DIR) $(VHDL_SRCS)
	$(GHDL) -a --std=08 --workdir=$(WORK_DIR) $(TB_SRCS)
	$(GHDL) -e --std=08 --workdir=$(WORK_DIR) tb_axi_stream_router
	$(GHDL) -r --std=08 --workdir=$(WORK_DIR) tb_axi_stream_router --wave=tb_axi_stream_router.fst

clean:
	rm -rf $(WORK_DIR) *.fst *.vcd