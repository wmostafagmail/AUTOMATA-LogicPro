# Release Scope and Limitations — v2.0 Evidence-Based

## Delivered

- 10,000 catalog-named VHDL-2008 entities.
- 10,000 catalog testbench scaffolds that instantiate their DUTs.
- 27 inherited shared implementation cores.
- 20 additional concrete reference cores and matching self-checking VHDL testbenches.
- Whole-tree structural and named-association audit: **PASS** across 20,071 VHDL files.
- Executable bit-exact Python oracle suite: **PASS**, 178,471 checks.
- GHDL, synthesis, target timing, protocol VIP, CDC/RDC, and numerical sign-off flows and profile templates.

## Not delivered as a completed claim

This artifact does not claim that all 10,000 entries are independently implemented algorithms or production-qualified IP. Many catalog entries remain wrappers around shared archetype cores; standards-heavy entries remain integration shells. The package does not claim universal protocol compliance, CDC safety, numerical equivalence, or timing closure.

## Why universal timing closure is not a meaningful claim

Timing closure is defined only for an exact FPGA part, speed grade, tool/version, clock and generated-clock set, I/O timing, pinout, exceptions, operating corners, and placement/routing result. A source-only library cannot carry one universal timing PASS.

## Why protocol compliance is profile-specific

Compliance requires a frozen protocol revision and role, optional-feature selection, PHY/hard-IP boundary, independent assertions or VIP, malformed-traffic testing, backpressure/error scenarios, and interoperability evidence.

## Why CDC sign-off is integration-specific

A block can provide recognized synchronizer and asynchronous-FIFO structures, but safety depends on the connected clock/reset topology, synchronizer placement, MTBF assumptions, reconvergence, multibit coherency, constraints, and RDC behavior in the final design.

## Release decision

- **Reference use:** permitted subject to project review.
- **Production use:** prohibited until every applicable gate in `qualification/profiles/signoff_gates.json` is supported by archived evidence.
- **Number of production-preverified blocks claimed by this release:** **0**.
