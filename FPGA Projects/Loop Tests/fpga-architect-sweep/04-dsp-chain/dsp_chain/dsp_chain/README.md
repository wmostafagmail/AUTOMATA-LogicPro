# dsp_chain
Compact VHDL DSP chain: 4-tap FIR filter followed by a 4-point DFT analyzer.
- Clock: 100 MHz (10 ns)
- Reset: Synchronous active-high
- Data: 16-bit signed arithmetic
- Latency: 8 cycles

## Build & Simulate
```bash
make simulate
# or
bash sim/run_ghdl.sh