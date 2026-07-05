# Verification Plan

## Testbench: `alu_tb`
- Self-checking process validates all 8 opcodes.
- Smoke tests include `ADD`, `SUB`, `AND`, `OR`, `XOR`, `NOT`, `INC`, `SLL`.
- Compares DUT output against hardcoded expected values.
- Stops simulation with `std.env.stop(0)` on success, or `std.env.stop(1)` on failure.
- Generates `alu_tb.vcd` waveform for debugging.