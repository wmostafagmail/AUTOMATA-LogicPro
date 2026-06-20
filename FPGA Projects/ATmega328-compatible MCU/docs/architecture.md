# 8-bit Spartan-6 Teaching CPU

## Overview
This project implements a small 8-bit register-register processor in VHDL for Xilinx Spartan-6 devices and ISE-era flows. The CPU uses a Harvard architecture, a 16-bit fixed-width instruction word, and a multi-cycle control FSM to keep timing and debug behavior simple.

## Programmer's Model
- 8 general-purpose 8-bit registers: `R0` to `R7`
- 8-bit program counter
- Zero flag `Z`
- Optional carry flag is generated internally and kept for future expansion
- 256 instruction words in program ROM
- 256-byte unified data/MMIO address space

## Instruction Encoding
### R-type
- Bits `[15:12]`: opcode
- Bits `[11:9]`: destination register `rd`
- Bits `[8:6]`: source register `rs`
- Bits `[5:0]`: reserved, currently ignored

Used by: `MOV`, `ADD`, `SUB`, `AND`, `OR`, `XOR`, `CMP`

### I-type
- Bits `[15:12]`: opcode
- Bits `[11:9]`: register operand
- Bit `[8]`: reserved, must be `0`
- Bits `[7:0]`: immediate or absolute data/MMIO address

Used by: `LDI`, `LD`, `ST`, `OUT`

### J-type
- Bits `[15:12]`: opcode
- Bits `[11:8]`: reserved, must be `0`
- Bits `[7:0]`: absolute jump target

Used by: `JMP`, `JZ`, `JNZ`

### Zero-operand
- Bits `[15:12]`: opcode
- Bits `[11:0]`: must be zero

Used by: `NOP`, `HALT`

Reserved-bit violations trap the CPU into the `HALT` state to provide a simple illegal-instruction policy for v1.

## Opcode Map
- `0x0`: `NOP`
- `0x1`: `MOV`
- `0x2`: `LDI`
- `0x3`: `ADD`
- `0x4`: `SUB`
- `0x5`: `AND`
- `0x6`: `OR`
- `0x7`: `XOR`
- `0x8`: `CMP`
- `0x9`: `LD`
- `0xA`: `ST`
- `0xB`: `JMP`
- `0xC`: `JZ`
- `0xD`: `JNZ`
- `0xE`: `OUT`
- `0xF`: `HALT`

## Memory Map
- `0x00` to `0xDF`: data RAM
- `0xF0`: LED output register
- `0xF1`: UART TX data register
- `0xF2`: UART TX status register, bit 0 = busy

Writes to `0xF1` while the UART is busy are ignored in v1.

## FSM States
- `CPU_S_RESET`: initialize control state
- `CPU_S_FETCH`: latch ROM instruction and increment PC
- `CPU_S_DECODE`: classify instruction and check reserved bits
- `CPU_S_EXEC_ALU`: run ALU/register-register instructions
- `CPU_S_EXEC_IMM`: write immediate value into a register
- `CPU_S_MEM_READ`: issue synchronous RAM read
- `CPU_S_MEM_WRITEBACK`: write memory/MMIO read data to the register file
- `CPU_S_MEM_WRITE`: commit a store or `OUT`
- `CPU_S_BRANCH`: evaluate jump condition and optionally load PC
- `CPU_S_HALT`: terminal state for `HALT` and illegal encodings

## Build Flow
- Assemble a program with `asm/assembler.py`
- Emit hex/bin images plus `rtl/prog_rom_init.vhd`
- Simulate the design with the testbenches in `tb/`
- Synthesize `rtl/top_fpga.vhd` in Xilinx ISE
