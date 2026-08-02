# Dataset Factory Plan

The dataset factory will materialize training records only from audited lab results.

## Accepted Record Types

- Contract to accepted RTL.
- Contract plus failing RTL plus repair instruction to accepted RTL.
- Contract to self-checking testbench.
- Failure cluster to prompt patch candidate.

## Exclusions

- Failed artifacts that never pass verification.
- Unlabeled repair fragments.
- Raw provider logs containing secrets or unrelated prompts.
- Benchmark holdouts unless explicitly exported as evaluation-only data.

## Current Status

The storage schema reserves dataset release entries and artifact directories. Export and split logic is not active yet.
