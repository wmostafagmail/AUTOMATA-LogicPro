# Prompt Optimization Plan

Prompt optimization is gated by evidence. A prompt candidate may be created from repeated failure clusters, but it is not promoted until it improves pass rate on benchmark contracts without regressing holdouts.

## Candidate Inputs

- Frozen contract.
- Current active prompt.
- Normalized failure cluster.
- Exact validator/GHDL excerpt.
- Accepted examples when available.

## Promotion Gates

- Higher verified pass rate than the active prompt.
- No regression on benchmark holdouts.
- No increase in extraction, interface, or static-policy failures.
- Repeatability across fixed seeds.

## Current Status

This implementation stores prompt templates and active versions. Automated prompt candidate generation and A/B promotion are a later worker phase.
