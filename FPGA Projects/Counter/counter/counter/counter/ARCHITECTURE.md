# Counter Project Architecture

## Overview
This project implements a synthesizable 8-bit Arithmetic Logic Unit (ALU) within the 'Counter' FPGA project.
The design targets a generic FPGA family with a 100 MHz clock and synchronous active-high reset.
The architecture follows a clean separation of datapath and control, uses IEEE standard libraries, and is fully GHDL-simulatable.

## Interfaces
| Signal | Width | Direction | Description |
|--------|-------|-----------|-------------|
| clk | 1 | in | 100 MHz system clock |
| reset_n | 1 | in | Synchronous active-high reset (reset_n=1 forces reset) |
| a | 8 | in | Operand A |
| b | 8 | in | Operand B |
| op | 3 | in | Operation select: 000=ADD, 001=SUB, 010=AND, 011=OR, 100=XOR, 101=NOT_A, 110=SHL, 111=SHR |
| result | 8 | out | Computed result |
| overflow | 1 | out | Overflow flag (ADD/SUB) |
| zero | 1 | out | Zero flag |

## Clock/Reset Strategy
- Clock: 100 MHz, rising edge sensitive.
- Reset: Synchronous active-high. Reset is sampled on the rising edge of clk.
- No asynchronous resets are used.

## Modules
- `alu_pkg`: Package defining types, constants, and ALU operation codes.
- `alu`: Top-level entity implementing the 8-bit ALU logic.
- `tb_alu`: Self-checking testbench for GHDL simulation.

## Verification
- Testbench covers all operations, edge cases, and reset behavior.
- Uses `std.env.stop(0)` for clean exit on success.
- Assertions verify output stability and correctness.