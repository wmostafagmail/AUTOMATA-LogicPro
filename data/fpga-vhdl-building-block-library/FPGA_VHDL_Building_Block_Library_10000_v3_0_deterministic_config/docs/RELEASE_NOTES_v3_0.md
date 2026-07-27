# Release Notes — v3.0 Deterministic Configuration

## Added
- Deterministic locked-wrapper architecture for all 10,000 blocks.
- Per-block JSON manifest and default configuration.
- Stable 64-bit configuration fingerprint derived from SHA-256.
- Shared VHDL configuration packages and integer-only derived-parameter helpers.
- Custom configuration wrapper generator with validation.
- Manifest JSON Schema and whole-library mapping validator.
- `AGENTS.md` coding-agent contract and `agent/LLM_SYSTEM_PROMPT.md`.
- Example custom wrapper and top-level design.

## Compatibility
No existing source entity or testbench interface was intentionally modified. The v2.1 program-counter testbench fix is retained.

## Validation
- Blocks indexed: 10,000.
- Generic parameters mapped: 25,297.
- Ports mapped: 97,783.
- Manifests generated: 10,000.
- Default configurations generated: 10,000.
- Locked wrappers generated: 10,000.
- Mapping errors: 0.

## Qualification note
The deterministic layer locks configuration and enables reliable wrapper generation. It does not independently qualify protocol behavior, CDC/RDC, numerical accuracy, synthesis, or timing. Existing maturity and evidence records remain authoritative.
