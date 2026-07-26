# Pre-Verified Claim Policy

A block may be labeled **pre-verified for a named profile** only when its evidence directory contains all required artifacts:

1. Frozen block specification and interface contract.
2. VHDL analysis/elaboration logs from at least two simulators where feasible.
3. Passing self-checking regression with boundary, randomized, reset, error, and backpressure cases.
4. Bit-exact or tolerance-based golden model for numerical blocks.
5. Protocol assertion/VIP and interoperability reports for standards-based blocks.
6. CDC and reset-domain-crossing report for every integration clock/reset topology.
7. Synthesis and post-route timing reports for an exact FPGA part and speed grade.
8. Reviewed constraints, waivers, tool versions, source checksum, and release approval.

No catalog block in this generic package receives universal protocol, CDC, numerical, or timing sign-off. Sign-off is always scoped to a profile and an evidence bundle.
