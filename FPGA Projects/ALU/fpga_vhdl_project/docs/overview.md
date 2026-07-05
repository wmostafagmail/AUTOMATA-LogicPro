# ALU FPGA Project — Overview

## Purpose
A synchronous 8-bit Arithmetic Logic Unit (ALU) implemented in VHDL-2008, designed for GHDL simulation and portable FPGA synthesis.

## Supported Operations
| Opcode Enum Literal | Operation     | Description                        |
|---------------------|---------------|------------------------------------|
| ALU_OP_ADD          | ADD           | Unsigned addition                  |
| ALU_OP_SUB          | SUB           | Two's-complement subtraction       |
| ALU_OP_AND          | AND           | Bitwise logical AND                |
| ALU_OP_OR           | OR            | Bitwise logical OR                 |
| ALU_OP_XOR          | XOR           | Bitwise logical XOR                |
| ALU_OP_NOT          | NOT           | Bitwise logical NOT (operand A)    |
| ALU_OP_SLL          | SLL           | Shift left logical (operand B as count) |
| ALU_OP_SRL          | SRL           | Shift right logical (operand B as count) |
| ALU_OP_NOP          | NOP           | Output zero, assert zero flag      |

## Interfaces
- **clk**: 100 MHz system clock (rising-edge triggered).
- **rst**: Synchronous active-high reset.
- **opcode** (`alu_op_t`): Operation select input.
- **a**, **b**: 8-bit unsigned operand inputs.
- **result**: 8-bit ALU result output.
- **flags.zero**: Asserted when `result = "00000000"`.
- **flags.carry**: ADD carry-out / SUB borrow indicator (architecture-dependent semantics).

## Clock and Reset
- Clock period: 10 ns (100 MHz).
- Reset is synchronous, active-high; ALU registers zero on reset.

## Quick Start (GHDL)
```bash
cd fpga_vhdl_project
ghdl -a --std=08 src/alu_pkg.vhd
ghdl -a --std=08 src/alu.vhd
ghdl -a --std=08 tb/alu_tb.vhd
ghdl -e --std=08 alu_tb
ghdl -r --std=08 alu_tb --stop-time=120us