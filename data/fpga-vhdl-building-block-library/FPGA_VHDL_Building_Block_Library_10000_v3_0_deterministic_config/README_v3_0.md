# FPGA VHDL Building Block Library 10,000 — v3.0 Deterministic Configuration

This release extends v2.1 with a deterministic configuration and wrapper-generation layer for all 10,000 catalog entities.

## New in v3.0
- 10,000 JSON block manifests.
- 10,000 resolved default configuration files.
- 10,000 locked deterministic wrappers.
- Stable SHA-256-derived configuration IDs.
- Shared VHDL configuration and family-profile packages.
- JSON Schema for block manifests.
- Custom locked-wrapper generator.
- Whole-library configuration-layer validator.
- Coding-agent operating contract in `AGENTS.md`.
- LLM system prompt and top-level integration example.

## First commands
```bash
make config-validate
make config-example
```

Read `AGENTS.md` before using an AI coding agent with this repository.

## Compatibility
The original RTL entities and testbenches are retained. The deterministic layer is additive and does not modify the source block interfaces.

## Verification boundary
Configuration reproducibility does not by itself establish protocol compliance, CDC/RDC safety, numerical qualification, synthesis success, or timing closure. Read every selected manifest and the evidence reports before making claims.
