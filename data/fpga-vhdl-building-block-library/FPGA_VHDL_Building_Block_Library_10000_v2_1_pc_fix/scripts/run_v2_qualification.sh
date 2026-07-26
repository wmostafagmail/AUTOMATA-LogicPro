#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
python3 "$ROOT/scripts/evidence_audit.py"
python3 "$ROOT/tests/python/test_reference_models.py"
if ! command -v ghdl >/dev/null 2>&1; then
  echo "GHDL_NOT_AVAILABLE: syntax/elaboration/simulation gate not executed" | tee "$ROOT/reports/ghdl_status.txt"
  exit 2
fi
WORK="$ROOT/build/ghdl_v2"; rm -rf "$WORK"; mkdir -p "$WORK"; cd "$WORK"
ghdl -a --std=08 "$ROOT/rtl/common/bb_util_pkg.vhd"
find "$ROOT/rtl/cores" "$ROOT/rtl/qualified_cores" -name '*.vhd' -print0 | sort -z | xargs -0 -n1 ghdl -a --std=08
find "$ROOT/tb/qualified_cores" -name '*.vhd' -print0 | sort -z | xargs -0 -n1 ghdl -a --std=08
count=0
while IFS= read -r f; do tb="$(basename "$f" .vhd)"; ghdl --elab-run --std=08 "$tb" --assert-level=error --stop-time=5ms; count=$((count+1)); done < <(find "$ROOT/tb/qualified_cores" -name 'tb_*.vhd' | sort)
echo "PASS: $count qualified-core GHDL simulations" | tee "$ROOT/reports/ghdl_status.txt"
