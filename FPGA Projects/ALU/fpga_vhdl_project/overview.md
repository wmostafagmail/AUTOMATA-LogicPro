# ALU Project Overview

- **Project Name**: fpga_vhdl_project
- **Target FPGA**: Generic portable FPGA
- **Clock Frequency**: 100 MHz (10 ns period)
- **Reset Style**: Synchronous active-high
- **Data Width**: 8-bit configurable via generic
- **Supported Operations**: ADD, SUB, AND, OR, XOR, NOT, SHIFT LEFT, SHIFT RIGHT
- **Flags**: Zero, Carry, Overflow
- **Simulation**: GHDL-compatible self-checking testbench
- **Design Style**: VHDL-2008, IEEE numeric_std, synthesizable RTL