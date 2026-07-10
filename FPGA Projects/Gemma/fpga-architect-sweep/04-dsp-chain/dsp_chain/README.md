# DSP Chain Project
A synthesizable VHDL-2008 pipeline consisting of a 3-tap FIR filter and a spectral energy analyzer.

## Architecture
1. **FIR Filter**: Computes $y[n] = \sum_{k=0}^2 c_k x[n-k]$. Latency: 2 cycles.
2. **Spectral Analyzer**: Calculates $\sum_{i=0}^3 y[n-i]^2$. Latency: 3 cycles.
3. **Total Pipeline Latency**: 5 clock cycles.

## Simulation
Run the provided `sim/run_ghdl.sh` to execute GHDL analysis and simulation.