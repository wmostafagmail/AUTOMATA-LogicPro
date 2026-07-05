# Skill: rtl-verification

## Purpose

Use this skill for self-checking testbenches, assertions, scoreboard strategy, compile/elaborate/simulate readiness, and deterministic regression discipline.

## Required Rules

- Testbenches must be plain GHDL-compatible VHDL-2008.
- Use `std.env.stop(0)` or equivalent std-library clean stop for passing runs; do not signal success via failure severity.
- Declare helper procedures/functions in the architecture declarative region before `begin`.
- Keep ordinary variables inside processes/subprograms only; do not place plain variables in the architecture body.
- Sample synchronous DUT behavior only after the active edge update has taken effect.
- For counters/FSMs/register pipelines, compare against expected values at the correct post-edge observation point.
- Assertions and reports must use valid VHDL string concatenation with `&`.
- Timeout/watchdog behavior must terminate hung simulations deterministically.

## Deliverables

- Self-checking TB
- Assertion/check strategy
- GHDL compile/elaborate/run commands
- Expected pass condition
- Failure explanation hooks
