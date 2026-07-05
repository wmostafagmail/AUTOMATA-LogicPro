# Skill: timing-constraints

## Purpose

Use this skill for timing assumptions, startup sequencing, reset release discipline, and FPGA implementation-risk review.

## Required Rules

- Make clock frequency/period assumptions explicit.
- Treat reset assertion/deassertion order as a first-class design and verification concern.
- Flag unsafe asynchronous release, underspecified startup windows, and sampling races.
- Keep timing/constraint notes aligned with the actual generated interfaces and clocks.
- Do not fabricate board-specific constraints unless the task explicitly provides them; state assumptions clearly instead.

## Deliverables

- Clock/reset assumptions
- Timing-risk notes
- Constraint placeholders/checklist
- Startup safety review
