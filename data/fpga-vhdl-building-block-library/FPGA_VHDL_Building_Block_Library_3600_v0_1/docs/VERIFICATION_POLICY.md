# Verification policy

## Status vocabulary

- **Tier A — concrete reusable implementation:** A synthesizable core implements the named primitive or a well-defined operation subset. A self-checking testbench is supplied.
- **Tier B — behavioral reference implementation:** Synthesizable reference behavior and a stable integration contract are supplied. The implementation is not a complete domain-specific accelerator.
- **Tier C — integration shell:** The file is synthesizable integration scaffolding only. It is not protocol-compliant, cryptographically secure, safety-certified, or a replacement for hardened FPGA transceivers/PHYs.

## What “pre-verified” can and cannot mean

This package does not mark a design as simulation-proven unless the supplied regression has actually passed. Generation-time validation checks file counts, identifiers, entity/architecture consistency, core references, manifests, and testbench presence. GHDL was unavailable in the generation environment, so `ghdl_analysis` and `functional_simulation` remain explicitly unexecuted in the matrix.

Protocol compliance requires the applicable specification, compliant PHY/electrical layer, independent protocol VIP or conformance tests, and implementation-specific corner-case coverage. Timing closure requires synthesis and place-and-route on the selected FPGA, with actual clocks, I/O delays, floorplanning, and constraints. CDC sign-off requires a CDC tool plus review of reconvergence, reset-domain crossings, pulse widths, and constraints. Numerical sign-off requires a bit-accurate reference model, error budgets, rounding/saturation policy, and application-specific test vectors.
