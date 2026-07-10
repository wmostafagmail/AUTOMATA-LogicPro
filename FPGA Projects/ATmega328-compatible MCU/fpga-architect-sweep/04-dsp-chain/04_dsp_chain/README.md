# 04-dsp-chain

Minimal DSP chain with a 3-tap FIR filter and spectral magnitude analyzer.

## Structure
- `src/dsp_chain_pkg.vhd`: Shared constants (Sample Width=16, Product Width=20).
- `src/fir_filter.vhd`: 3-tap signed FIR (-1, 4, -1) with 8-bit coefficients.
- `src/spectral_analyzer.vhd`: Computes input magnitude squared.
- `src/dsp_chain_top.vhd`: Integrates stages; passes clock/reset through.

## Verification
Run `make sim`. The self-checking testbench verifies latency-aligned outputs and stops cleanly on success using `std.env.stop(0)`.