# Benchmark Policy

Benchmarks prevent the lab from optimizing for a single recent failure while breaking broad VHDL quality.

## Required Benchmark Families

- Simple counters/registers.
- FIFOs and memory wrappers.
- ALU/datapath blocks.
- Protocol RX/TX leaves.
- CPU/control leaves.
- Video timing/addressing leaves.
- Negative tests for extraction/interface/static-policy failure.

## Promotion Rule

A prompt or model checkpoint must improve the target failure family and preserve or improve aggregate holdout pass rate.
