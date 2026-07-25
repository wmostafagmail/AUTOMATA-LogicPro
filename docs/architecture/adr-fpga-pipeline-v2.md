# ADR: FPGA Architect Deterministic Pipeline V2

## Status

Accepted. New FPGA Architect runs use Pipeline V2 by default. Contract V1 remains readable for existing generated projects but is not emitted for new runs.

## Context

The original FPGA Architect flow asked a model for a complete Markdown project manifest in one response. Validation and repair improved invalid projects after generation, but architecture choices, interfaces, testbench behavior, and source ordering could still drift between retries. Sweep-only memory also made clean-generation quality difficult to measure independently from repair convergence.

## Decision

Pipeline V2 uses these ordered gates:

1. Produce and validate a machine-readable Architecture Contract V2.
2. Canonicalize and hash the approved contract.
3. Render app-owned packages, interfaces, top-level wiring skeletons, and self-checking testbench structure.
4. Ask the model only for constrained implementation regions, one component at a time.
5. Parse generated VHDL with the app's token-aware semantic frontend and validate it against the contract.
6. Run strict prevalidation, GHDL analysis, elaboration, simulation, and optional synthesis-quality checks.
7. Treat every repair as a transaction. Keep a candidate only when it improves the validation score without introducing an earlier-stage regression.

Normal FPGA Architect execution and sweeps share the same contract, renderer, validator, repair, and provider-profile modules. Sweeps add orchestration and reporting only.

## Determinism Rules

- Contract proposal and code generation use temperature zero and stable request seeds when the provider supports them.
- JSON-only stages request structured JSON output where the provider supports it.
- New attempts start from a clean contract and app-owned scaffold. Repair memory is scoped to the current design and canonical failure codes.
- App-owned interfaces and testbench assertions cannot be weakened by model repair.
- Contract hashes are persisted with generated projects and included in validation reports.

## Compatibility

- The public FPGA Architect API response and `FpgaArchitectProject` shape remain compatible.
- Contract V1 can be parsed and migrated in memory to V2 for validation.
- Environment flags can disable individual V2 stages for diagnosis, but V2 is the default.

## Consequences

The model has less freedom to invent project structure after contract approval, generation requires more small calls for multi-block projects, and deterministic validation becomes stricter. In return, failures are localized, reproducibility is measurable, and repair can no longer silently replace a good project with a worse candidate.
