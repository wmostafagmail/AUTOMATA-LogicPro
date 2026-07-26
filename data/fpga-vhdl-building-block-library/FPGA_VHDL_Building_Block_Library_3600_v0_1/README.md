# FPGA VHDL Building Block Library — 3,600 Catalog Entries

This package adds VHDL-2008 source and verification collateral for every block in the FPGA Building Block Catalog.

## Contents

- **3,600 block entities** under `rtl/blocks/`, preserving every catalog block name.
- **27 shared synthesizable cores** under `rtl/cores/`.
- **3,600 per-block smoke testbenches** and deeper tests for core arithmetic, asynchronous FIFO CDC, and UART loopback.
- GHDL scripts, Makefile, GitHub Actions workflow, Xilinx XDC and Intel SDC templates.
- A row-by-row verification matrix stating implementation tier and unverified sign-off obligations.

## Critical status statement

This is not honestly describable as 3,600 production-certified, protocol-compliant, timing-closed IP cores. The package contains three tiers:

- **Tier A:** concrete synthesizable implementation of a defined primitive/operation subset.
- **Tier B:** synthesizable behavioral reference implementation and integration contract.
- **Tier C:** synthesizable integration shell only; external compliant IP/PHY/VIP or a complete implementation is required.

The generation environment did not contain GHDL. Therefore, the sources were statically validated and testbenches were generated, but the package does **not** claim that GHDL analysis or simulation has already passed. Run:

```bash
make static
make core-regression
make all-smokes
```

## Release gates

Do not release a block merely because it compiles. Protocol compliance, timing closure, CDC/RDC sign-off, numerical validation, functional coverage, and target-device implementation evidence are separate required gates. See `docs/VERIFICATION_POLICY.md`, `docs/COMPLIANCE_AND_SIGNOFF.md`, and `reports/verification_matrix.csv`.
