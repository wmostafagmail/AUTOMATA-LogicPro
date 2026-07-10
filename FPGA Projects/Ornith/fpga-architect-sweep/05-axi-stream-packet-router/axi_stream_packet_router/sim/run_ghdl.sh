#!/usr/bin/env bash
set -euo pipefail

GHDL="ghdl"
STD="--std=08"
WNO="-Wno-miscellaneous"
OUTDIR="$(dirname "$0")/../output"
mkdir -p "$OUTDIR"

cd "$(dirname "$0")/.."

$GHDL $STD $WNO -a src/axi_stream_router_pkg.vhd
$GHDL $STD $WNO -a src/router_arbiter.vhd
$GHDL $STD $WNO -a src/axi_stream_slave.vhd
$GHDL $STD $WNO -a src/axi_stream_master.vhd
$GHDL $STD $WNO -a src/axi_stream_packet_router.vhd
$GHDL $STD $WNO -a tb/tb_axi_stream_packet_router.vhd

$GHDL -e $STD $WNO tb_axi_stream_packet_router

$GHDL -r $STD $WNO tb_axi_stream_packet_router --vcd="$OUTDIR/output.vcd"