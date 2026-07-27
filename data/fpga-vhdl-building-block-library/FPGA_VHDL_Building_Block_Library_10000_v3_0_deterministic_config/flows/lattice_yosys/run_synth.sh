#!/usr/bin/env bash
set -euo pipefail
: "${TOP:?Set TOP}"; : "${DEVICE:?Set DEVICE, for example 45k}"; : "${PACKAGE:?Set PACKAGE}"; : "${FREQ_MHZ:?Set FREQ_MHZ}"
yosys -m ghdl -p "ghdl --std=08 ../../rtl/common/bb_util_pkg.vhd ../../rtl/cores/*.vhd ../../rtl/qualified_cores/*.vhd -e $TOP; synth_ecp5 -top $TOP -json $TOP.json"
nextpnr-ecp5 --${DEVICE} --package "$PACKAGE" --json "$TOP.json" --textcfg "$TOP.config" --freq "$FREQ_MHZ" --timing-allow-fail
