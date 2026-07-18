# Verification Strategy

## Self-Checking Testbench
The testbench `tb_alu` instantiates the DUT and drives stimulus through a single clocked process. It uses a local `check_eq` helper to compare DUT outputs against expected values computed in the testbench.

## Test Sequence
1. **Reset Verification**: Assert `rst_i` for 2 clock cycles, then deassert. Verify outputs are zeroed.
2. **Smoke Tests**: Apply `1 + 2 = 3`, `5 - 3 = 2`, `0xFF AND 0x0F`, `0x00 OR 0x01`, `0xFF XOR 0x01`, `NOT 0x00`, `0x01 << 2`, `0x08 >> 2`.
3. **Observation Point**: All comparisons occur after `rising_edge(clk)` and a 1 ns delay to allow registered outputs to settle.
4. **Termination**: If any `check_eq` fails, the `failed` flag is set. At the end of stimulus, `std.env.stop(0)` is called on PASS, or `severity failure` is raised on FAIL.

## GHDL Execution
Run `sim/run_ghdl.sh` to analyze, elaborate, and simulate. The script generates `waves/alu_tb.vcd` for waveform inspection.