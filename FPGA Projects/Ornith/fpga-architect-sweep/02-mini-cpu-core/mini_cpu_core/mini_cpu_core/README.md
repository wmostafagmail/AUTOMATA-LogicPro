# Mini CPU Core (VHDL-2008)

Minimal 16-bit RISC-like CPU core in VHDL-2008 with separate program/data memories and a self-checking GHDL testbench.

## ISA Snapshot
- Data width: 8 bits; registers: 4 (r0..r3); PC address space: 12 bits.
- Opcodes: NOP, LOAD, STORE, ADD, SUB, AND_OP, OR_OP, XOR_OP, JMP, BEQ.
- Instruction format: 16-bit (opcode[7:0] | rs1[5:4] | rs2[3:2] | rd[1:0] | imm[5:0]).

## Build and Simulate (GHDL)
```bash
cd mini_cpu_core
make clean all
# or:  bash sim/run_ghdl.sh