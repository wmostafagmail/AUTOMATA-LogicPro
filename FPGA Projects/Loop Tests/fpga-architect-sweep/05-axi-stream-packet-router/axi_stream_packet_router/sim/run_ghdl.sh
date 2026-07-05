#!/bin/bash
set -e
GHDL=ghdl
WORK_DIR=ghdl_work

rm -rf $WORK_DIR
mkdir -p $WORK_DIR

$GHDL -a --std=08 --workdir=$WORK_DIR ../src/axi_stream_pkg.vhd
$GHDL -a --std=08 --workdir=$WORK_DIR ../src/axi_stream_router.vhd
$GHDL -a --std=08 --workdir=$WORK_DIR ../tb/tb_axi_stream_router.vhd
$GHDL -e --std=08 --workdir=$WORK_DIR tb_axi_stream_router
$GHDL -r --std=08 --workdir=$WORK_DIR tb_axi_stream_router --wave=tb_axi_stream_router.fst