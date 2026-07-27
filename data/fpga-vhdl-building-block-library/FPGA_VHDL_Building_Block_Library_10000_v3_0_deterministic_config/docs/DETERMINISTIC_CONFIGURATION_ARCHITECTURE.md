# Deterministic Configuration Architecture

Version 3.0 introduces a non-destructive deterministic integration layer over the 10,000 source entities.

## Design choice
The original entities remain unchanged to preserve compatibility with the existing 10,000 testbenches. Deterministic configuration is implemented through generated locked wrappers and machine-readable manifests. This avoids breaking entity interfaces while preventing wrappers from relying on ambiguous defaults.

## Determinism guarantees
For a given entity and resolved generic-value map:
- the configuration JSON is canonicalized with sorted keys;
- the configuration ID is the first 64 bits of SHA-256, represented by 16 hexadecimal characters;
- the generated wrapper has stable source text and entity mappings;
- every functional generic is assigned explicitly;
- elaboration assertions reject override values different from the resolved configuration;
- a sidecar JSON records the exact resolved configuration.

## Scope
All 10,000 blocks now have:
- a per-block JSON manifest;
- a resolved default configuration;
- a locked default wrapper;
- generic type/range metadata;
- exact port declarations;
- clock/reset port discovery;
- inherited maturity, protocol, CDC, numerical, and timing status;
- stable paths in the library index.

## Limits
The wrapper layer makes configuration reproducible; it does not convert an integration shell into a qualified protocol implementation. Latency, throughput, CDC, protocol, numerical, synthesis, and timing contracts must be completed at family/block level where the existing source lacks such evidence.
