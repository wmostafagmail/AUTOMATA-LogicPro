# Repository Agent Instructions

## Skill Usage Policy

For every non-trivial task, first use the `VHDL-skill-orchestrator` skill.

The orchestrator must:

1. Inspect the available skills registry.
2. Select only the needed skills.
3. Define the execution order.
4. Pass bounded task scopes to selected skills.
5. Merge outputs into one consistent result.
6. Run a final verification checklist.

Do not directly jump into implementation when a specialized skill applies.
Do not invent unavailable skills.
Do not apply all skills blindly.

## FPGA/VHDL Rule

When FPGA, RTL, VHDL, IEEE 1076, Vivado, Quartus, GHDL, ModelSim, Questa, synthesis, timing, CDC, or testbench work is requested:

1. Start with `VHDL-skill-orchestrator`.
2. Route architecture and design planning to the FPGA/VHDL-related skill set.
3. Use `vhdl-language` for VHDL RTL, testbench, synthesis-aware coding, and debug.
4. Require a self-checking testbench or explain why one is not applicable.
5. Include compile/simulation commands where useful.
6. Enforce repository-local GHDL conformance rules for generated RTL, packages, and testbenches.

## GHDL Conformance Baseline

- Default to VHDL-2008 unless told otherwise.
- Use `ieee.std_logic_1164` and `ieee.numeric_std`.
- Keep required `library` / `use` clauses in each generated file.
- Ensure `work` package references are generated and compile-order safe.
- Use clean pass-stop behavior such as `std.env.stop(0)` instead of success-by-failure.
- Keep helper procedures/functions in the testbench declarative region before `begin`.
- Avoid architecture-body plain variable declarations for runtime state.
- Avoid reserved-word identifiers and invalid boolean/bitwise pseudo-English expressions.
- Aim for output that should pass a full GHDL analyze -> elaborate -> simulate flow.

## Minimal Prompt

```markdown
@Use VHDL-skill-orchestrator

Use the available skills registry to select only the skills needed for this task.
Create a short skill call plan, execute the plan, merge outputs, and run the final verification checklist.

Task:
<insert task here>
```
