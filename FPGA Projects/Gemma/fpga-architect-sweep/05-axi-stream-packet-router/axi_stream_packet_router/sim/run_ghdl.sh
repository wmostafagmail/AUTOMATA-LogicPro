#!/bin/bash
set -e

# Analysis order is critical for dependencies
ghdl -a --std=08 -Work=work ../src/router_pkg.vhd
ghdl -a --std=08 -Work=work ../src/axi_stream_packet_router.vhd
ghdl -a --std=08 -Work=work ../tb/tb_axi_stream_packet_router.vhd

# Elaborate
ghdl -e --std=08 -Work=work tb_axi_stream_packet_router

# Run and generate waveform
ghdl -r --std=08 -Work=work tb_axi_stream_packet_router --vcd=router_sim.vcd