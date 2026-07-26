# Release Notes — v1.0 / 10,000 Blocks

## Change summary

- Preserved the original 3,600 catalog IDs and VHDL entity names.
- Added 6,400 entries, IDs BB-3601 through BB-10000.
- Added 80 engineering families and 400 base concepts.
- Added 16 architecture profiles per new concept.
- Generated matching VHDL-2008 entity wrappers and DUT-instantiating smoke testbenches.
- Expanded the verification matrix to 10,000 rows.
- Added JSON expansion metadata and a per-family CSV summary.
- Static structural validation passed for all source and testbench files.

## Important maturity boundary

The 6,400 expansion entries are maturity-L1 interface/reference wrappers or integration shells. They establish names, interfaces, project structure, shared-core integration, and smoke-test scaffolding. They are not a substitute for block-specific algorithm implementation, protocol compliance, numerical qualification, CDC/RDC sign-off, or timing closure.
