#!/usr/bin/env bash
# =============================================================================
# run_ghdl.sh : One-shot GHDL analyze / elaborate / simulate for the ALU.
# =============================================================================
set -euo pipefail

GHDL="ghdl"
STD="--std=08"
STOP_TIME="120us"

echo "[run_ghdl] Analyzing packages and sources..."
${GHDL} -a ${STD} src/alu_pkg.vhd
${GHDL} -a ${STD} src/alu.vhd
${GHDL} -a ${STD} tb/alu_tb.vhd

echo "[run_ghdl] Elaborating testbench alu_tb..."
${GHDL} -e ${STD} alu_tb

echo "[run_ghdl] Running simulation up to ${STOP_TIME}..."
${GHDL} -r ${STD} alu_tb --stop-time=${STOP_TIME}

echo "[run_ghdl] Done."