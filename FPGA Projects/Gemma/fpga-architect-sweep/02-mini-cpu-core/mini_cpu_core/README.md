# Mini CPU Core project

A compact 8-bit custom ISA CPU core implementation in VHDL-2008.

## Architecture
- **Harvard Architecture**: Separate memory interfaces for instructions and data.
- **ISA**: Custom 8-bit subset (LOAD, STORE, ADD, SUB, AND, OR, JUMP, BZ).
- **Registers**: 8 general purpose registers.

## Simulation
To run the simulation:
1. Navigate to `sim/` folder.
2. Execute `./run_ghdl.sh`.
3. View `mini_cpu_core.vcd` using GTKWave.