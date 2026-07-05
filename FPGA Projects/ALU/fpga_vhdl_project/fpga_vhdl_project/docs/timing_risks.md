# Timing / CDC Risk Review

## Clock Domain

- Single clock domain only; no CDC/RDC paths present in this unit.

## Combinational Path Length

- The combinational path from `a`, `b`, `opcode` through `calc_result` and
  `calc_flags` back into the registered output is short for an 8-bit ALU and
  comfortably meets a 100 MHz target on generic FPGA families. On wider widths
  or higher clock frequencies, this path should be re-verified against timing.

## Reset Timing

- Synchronous active-high reset; hold time during release is not critical in the
  RTL itself, but the testbench holds `rst='1'` for 20 ns to ensure clean
  initialization before deassertion.

## Constraints Template

- See `constraints/alu.xdc`: clock period placeholder set to 10 ns (100 MHz).
  Update I/O standards and package pins to match your target board before
  implementation.

## Risks

| Risk                              | Severity | Mitigation                                  |
|-----------------------------------|----------|---------------------------------------------|
| Wide-ALU timing closure           | Low      | Pipeline or re-time for wider widths/faster clocks |
| Shift amount >= WIDTH             | Low      | Documented; shift_left/shift_right semantics apply       |
| Unsigned-only arithmetic          | Medium   | Add signed mode if required by downstream spec     |