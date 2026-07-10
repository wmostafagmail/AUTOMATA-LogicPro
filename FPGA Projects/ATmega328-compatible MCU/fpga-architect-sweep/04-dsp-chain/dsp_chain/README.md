# 04-dsp-chain

Minimal DSP chain implementation featuring a FIR filter followed by a spectral magnitude analyzer.

## Components
- `dsp_chain_pkg`: Definitions for sample widths, coefficient types.
- `fir_filter`: 3-tap FIR filter with coefficients {-1, 4, -1}. Uses signed arithmetic.
- `spectral_analyzer`: Computes magnitude squared of the filtered output.
- `dsp_chain_top`: Integrates the stages.

## Verification
The testbench `tb_dsp_chain_top` injects a known sample and verifies the latency-aligned output magnitude against a golden model expectation.

## Build
Run `make sim` or execute `sim/run_ghdl.sh`. Requires GHDL >= 0.37 with VHDL-2008 support.