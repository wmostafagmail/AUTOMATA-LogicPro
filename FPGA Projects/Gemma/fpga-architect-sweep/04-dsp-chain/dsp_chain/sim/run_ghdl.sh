#!/bin/bash
# Analysis order is critical for packages
ghdl -a --std=08 ../src/dsp_pkg.vhd
ghdl -a --std=08 ../src/fir_filter.vhd
ghdl -a --std=08 ../src/spectral_analyzer.vhd
ghdl -a --std=08 ../src/dsp_chain_top.vhd
ghdl -a --std=08 ../tb/tb_dsp_chain.vhd

# Elaborate
ghdl -e --std=08 tb_dsp_chain

# Run with VCD waveform output
ghdl -r --std=08 tb_dsp_chain --vcd=dsp_chain.vcd