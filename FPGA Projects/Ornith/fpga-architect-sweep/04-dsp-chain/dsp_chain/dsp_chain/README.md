# dsp_chain — FIR Filter + FFT-lite DSP Chain

Compact signed DSP chain: 4-tap FIR filter followed by a single-bin DFT magnitude estimator. Designed for deterministic pipeline latency verification under GHDL simulation.

## Blocks
- **fir_filter**: 4-tap, coefficients [-1, 2, 2, -1], signed-8 input → signed-16 output, 3-cycle latency.
- **fft_lite_analyzer**: Sums 4 consecutive samples, outputs |sum| as magnitude estimate, additional 3-cycle latency.
- **dsp_chain_top**: Integrates the two stages with clean valid-signaling boundaries.

## Run under GHDL
```bash
make simulate
# or:
chmod +x sim/run_ghdl.sh && ./sim/run_ghdl.sh