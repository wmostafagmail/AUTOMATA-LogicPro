# Unit: tb_alu
- Self-checking testbench for `alu`.
- Stimulus drives inputs, waits for clock edge, samples outputs.
- Validates all supported operations against expected values.
- Exits with code 0 on success, 1 on failure.
- GHDL-ready with VCD waveform generation.