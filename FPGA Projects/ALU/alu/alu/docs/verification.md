# Verification Plan

## Testbench
- **File**: `tb/alu_tb.vhd`
- **Coverage**: All opcodes with sample vectors.
- **Checks**: Result comparison and assertions.

## Simulation
- **Tool**: GHDL
- **Standard**: VHDL-2008
- **Duration**: 100 us
- **Stop**: `std.env.stop(0)` on success.

## Results
- Expected: All assertions pass.
- Output: VCD waveform (optional).