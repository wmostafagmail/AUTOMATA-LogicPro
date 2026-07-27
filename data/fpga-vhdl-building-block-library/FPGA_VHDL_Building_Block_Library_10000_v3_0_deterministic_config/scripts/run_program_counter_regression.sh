#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$ROOT/build/ghdl_program_counter"
GHDL="${GHDL:-ghdl}"

if ! command -v "$GHDL" >/dev/null 2>&1; then
  echo "ERROR: GHDL executable '$GHDL' was not found." >&2
  exit 127
fi

rm -rf "$WORK"
mkdir -p "$WORK"
cd "$WORK"

"$GHDL" -a --std=08 "$ROOT/rtl/common/bb_util_pkg.vhd"
"$GHDL" -a --std=08 "$ROOT/rtl/cores/bb_program_counter_core.vhd"

sources=(
  "$ROOT/rtl/blocks/cpu_and_soc/program_counter.vhd"
  "$ROOT/rtl/blocks/cpu_frontend/program_counter_continuous.vhd"
  "$ROOT/rtl/blocks/cpu_frontend/program_counter_fault_tolerant.vhd"
  "$ROOT/rtl/blocks/cpu_frontend/program_counter_low_power.vhd"
  "$ROOT/rtl/blocks/cpu_frontend/program_counter_multi_channel.vhd"
  "$ROOT/rtl/blocks/cpu_frontend/program_counter_programmable.vhd"
  "$ROOT/rtl/blocks/cpu_frontend/program_counter_single_shot.vhd"
)

tests=(
  "$ROOT/tb/blocks/cpu_and_soc/tb_program_counter.vhd"
  "$ROOT/tb/blocks/cpu_frontend/tb_program_counter_continuous.vhd"
  "$ROOT/tb/blocks/cpu_frontend/tb_program_counter_fault_tolerant.vhd"
  "$ROOT/tb/blocks/cpu_frontend/tb_program_counter_low_power.vhd"
  "$ROOT/tb/blocks/cpu_frontend/tb_program_counter_multi_channel.vhd"
  "$ROOT/tb/blocks/cpu_frontend/tb_program_counter_programmable.vhd"
  "$ROOT/tb/blocks/cpu_frontend/tb_program_counter_single_shot.vhd"
)

for source in "${sources[@]}"; do
  "$GHDL" -a --std=08 "$source"
done

for test_source in "${tests[@]}"; do
  "$GHDL" -a --std=08 "$test_source"
done

for test_source in "${tests[@]}"; do
  tb="$(basename "$test_source" .vhd)"
  echo "Running $tb"
  "$GHDL" --elab-run --std=08 "$tb" --assert-level=error --stop-time=200ns
  echo
done

echo "PASS: 7 program-counter regressions"
