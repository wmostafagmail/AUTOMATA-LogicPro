#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; LIB="${1:?Usage: $0 /path/to/library-root}"; WORK="$ROOT/.ghdl-work"; rm -rf "$WORK"; mkdir -p "$WORK"; cd "$WORK"
GHDL_FLAGS=(--std=08 --workdir="$WORK")
# Analyze common packages/cores and selected source blocks.
find "$LIB/rtl/common" "$LIB/rtl/cores" -name '*.vhd' -print0 2>/dev/null | sort -z | xargs -0 -r -n1 ghdl -a "${GHDL_FLAGS[@]}"
for f in "$LIB/rtl/blocks/communication/uart_rx.vhd" "$LIB/rtl/blocks/communication/uart_tx.vhd" "$LIB/rtl/blocks/cpu_and_soc/program_counter.vhd" "$LIB/rtl/blocks/memory/sync_fifo.vhd" "$LIB/rtl/blocks/memory/async_fifo.vhd" "$LIB/rtl/blocks/video_and_audio/vga_timing_generator.vhd"; do ghdl -a "${GHDL_FLAGS[@]}" "$f"; done
find "$ROOT/rtl/facades" -name '*.vhd' -print0 | sort -z | xargs -0 -n1 ghdl -a "${GHDL_FLAGS[@]}"
find "$ROOT/tb/facades" -name '*.vhd' -print0 | sort -z | xargs -0 -n1 ghdl -a "${GHDL_FLAGS[@]}"
for tb in $(grep -RhoE 'entity[[:space:]]+tb_[A-Za-z0-9_]+' "$ROOT/tb/facades" | awk '{print $2}' | sort -u); do log="$WORK/$tb.log"; if ghdl -e "${GHDL_FLAGS[@]}" -Wl,-w "$tb" >"$log" 2>&1 && ghdl -r "${GHDL_FLAGS[@]}" "$tb" --assert-level=error >>"$log" 2>&1; then echo "PASS $tb"; else echo "FAIL $tb"; cat "$log"; exit 1; fi; done
