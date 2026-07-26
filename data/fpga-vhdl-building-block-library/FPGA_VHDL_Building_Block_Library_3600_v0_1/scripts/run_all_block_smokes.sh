#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$ROOT/build/ghdl_blocks"
GHDL="${GHDL:-ghdl}"
mkdir -p "$WORK"; cd "$WORK"
$GHDL -a --std=08 "$ROOT/rtl/common/bb_util_pkg.vhd"
find "$ROOT/rtl/cores" -name '*.vhd' -print0 | sort -z | xargs -0 -n 1 "$GHDL" -a --std=08
find "$ROOT/rtl/blocks" -name '*.vhd' -print0 | sort -z | xargs -0 -n 1 "$GHDL" -a --std=08
find "$ROOT/tb/blocks" -name '*.vhd' -print0 | sort -z | xargs -0 -n 1 "$GHDL" -a --std=08
count=0
while IFS= read -r tbfile; do
  tb="$(basename "$tbfile" .vhd)"
  "$GHDL" --elab-run --std=08 "$tb" --assert-level=error --stop-time=500ns >/dev/null
  count=$((count+1))
  if (( count % 100 == 0 )); then echo "Executed $count block smokes"; fi
 done < <(find "$ROOT/tb/blocks" -name 'tb_*.vhd' | sort)
echo "PASS: $count block smoke tests"
