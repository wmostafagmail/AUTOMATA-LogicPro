#!/bin/bash
ghdl -a --std=08 --workdir=work src/dsp_chain_pkg.vhd
ghdl -a --std=08 --workdir=work src/fir_filter.vhd
ghdl -a --std=08 --workdir=work src/fft_lite.vhd
ghdl -a --std=08 --workdir=work src/dsp_chain_top.vhd
ghdl -a --std=08 --workdir=work tb/tb_dsp_chain.vhd
ghdl -e --std=08 --workdir=work tb_dsp_chain
ghdl -r --std=08 --workdir=work tb_dsp_chain --vcd=waves/tb_dsp_chain.vcd --stop-time=2us