#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$ROOT/build/ghdl"
GHDL="${GHDL:-ghdl}"
mkdir -p "$WORK"
cd "$WORK"
$GHDL -a --std=08 "$ROOT/rtl/common/bb_util_pkg.vhd"
find "$ROOT/rtl/cores" -name '*.vhd' -print0 | sort -z | xargs -0 -n 1 "$GHDL" -a --std=08
find "$ROOT/rtl/blocks" -name '*.vhd' -print0 | sort -z | xargs -0 -n 1 "$GHDL" -a --std=08
find "$ROOT/tb/core" -name '*.vhd' -print0 | sort -z | xargs -0 -n 1 "$GHDL" -a --std=08
for tb in tb_bb_datapath_core tb_bb_async_fifo_core tb_bb_uart_loopback; do
  "$GHDL" --elab-run --std=08 "$tb" --assert-level=error --stop-time=3ms
 done
python3 "$ROOT/scripts/static_validate.py"
echo "Core GHDL regression completed."
