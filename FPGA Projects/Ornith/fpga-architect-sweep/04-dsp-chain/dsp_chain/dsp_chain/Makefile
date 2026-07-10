VHDL_STD = --std=08
GHDL     = ghdl

RTL_DIR  = src
TB_DIR   = tb
OUT_DIR  = out
TOP      = dsp_chain_top

ANALYSIS_ORDER = $(RTL_DIR)/fir_filter.vhd \
                 $(RTL_DIR)/fft_lite_analyzer.vhd \
                 $(RTL_DIR)/dsp_chain_top.vhd \
                 $(TB_DIR)/tb_dsp_chain.vhd

.PHONY: all clean simulate

all: analyze elaborate simulate

analyze:
	@echo "Analyzing VHDL files..."
	$(GHDL) -a $(VHDL_STD) $(ANALYSIS_ORDER)

elaborate:
	@echo "Elaborating $(TOP)..."
	$(GHDL) -e $(VHDL_STD) $(TOP)

simulate: elaborate
	@echo "Running simulation..."
	mkdir -p $(OUT_DIR)
	$(GHDL) -r $(VHDL_STD) $(TOP) \
	  --vcd=$(OUT_DIR)/waveform.vcd \
	  --stop-time=2us

clean:
	rm -rf $(OUT_DIR)/*.vcd *.o *.cfi *.d work.cfg