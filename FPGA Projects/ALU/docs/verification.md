# Verification Plan

## Testbench Strategy
- Self-checking TB `tb_alu` instantiates `work.alu`.
- Stimulus applies each opcode sequentially, waits for one clock cycle, then checks `result` and `flags`.
- Helper procedure `check_result` updates a local `failed` flag on mismatch.
- TB ends with `std.env.stop(0)` on success or `severity failure` on mismatch.

## GHDL Simulation
- Run `make simulate` to compile and run the testbench.
- Waveforms are generated to `waves/alu_tb.vcd`.
- Expected output: `TEST PASSED`.