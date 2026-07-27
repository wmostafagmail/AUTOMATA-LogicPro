# Program-Counter Testbench Correction — v2.1

## Scope

This release backports the program-counter testbench correction from the 3,600-block library into the 10,000-block evidence-based library.

Exactly seven catalog testbenches were changed. No RTL entity, shared core, wrapper, interface, generic, or constraint was modified.

## Root cause

The original tests used fixed delays:

```vhdl
redirect_pc <= x"00000100";
redirect_valid <= '1';
wait for 10 ns;
redirect_valid <= '0';
wait for 10 ns;
assert pc_current = x"00000104";
```

With a 10 ns clock period, the final assertion could execute in the same simulation time slot as the rising edge that scheduled the sequential update. VHDL signal assignments from a clocked process take effect after a delta cycle, and the concurrent `pc_current` output assignment may require another delta cycle. The assertion could therefore sample `0x00000100` before `0x00000104` propagated.

This was a testbench synchronization race, not evidence of an RTL redirect-priority defect.

## Correction

Every affected test now:

1. Releases reset away from a rising edge.
2. Synchronizes each state check with `wait until rising_edge(clk)`.
3. Waits `1 ns` after the edge for registered and concurrent outputs to settle.
4. Checks the first sequential update to `0x00000004`.
5. Checks redirect priority and capture to `0x00000100`.
6. Deasserts redirect after the sampled edge.
7. Checks sequential advance to `0x00000104` and `pc_next = 0x00000108`.

## Changed files

- `tb/blocks/cpu_and_soc/tb_program_counter.vhd`
- `tb/blocks/cpu_frontend/tb_program_counter_continuous.vhd`
- `tb/blocks/cpu_frontend/tb_program_counter_fault_tolerant.vhd`
- `tb/blocks/cpu_frontend/tb_program_counter_low_power.vhd`
- `tb/blocks/cpu_frontend/tb_program_counter_multi_channel.vhd`
- `tb/blocks/cpu_frontend/tb_program_counter_programmable.vhd`
- `tb/blocks/cpu_frontend/tb_program_counter_single_shot.vhd`

## Verification performed in the generation environment

- 10,000 RTL catalog files present: PASS.
- 10,000 DUT-instantiating catalog testbenches present: PASS.
- Whole-tree interface and entity audit: PASS.
- Content comparison against v2.0: exactly seven testbenches changed, zero RTL changes: PASS.
- GHDL focused regression: pending because GHDL was not available in the generation environment.

## Focused GHDL command

```bash
bash scripts/run_program_counter_regression.sh
```

Expected terminal result after all seven simulations complete:

```text
PASS: 7 program-counter regressions
```

The complete 10,000-test smoke suite can then be run with:

```bash
make all-smokes
```
