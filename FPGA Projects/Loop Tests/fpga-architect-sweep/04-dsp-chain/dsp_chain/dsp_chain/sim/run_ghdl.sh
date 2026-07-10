#!/bin/bash
set -e
ghdl -a --std=08 src/dsp_chain_pkg.vhd
ghdl -a --std=08 src/fir_filter.vhd
ghdl -a --std=08 src/fft_lite.vhd
ghdl -a --std=08 src/dsp_chain_top.vhd
ghdl -a --std=08 tb/tb_dsp_chain.vhd
ghdl -e --std=08 tb_dsp_chain
ghdl -r --std=08 tb_dsp_chain --vcd=dsp_chain.vcd
echo "Simulation completed. Waveform saved to dsp_chain.vcd"