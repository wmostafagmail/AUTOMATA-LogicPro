# ALU Project Overview

This project implements a synchronous 8-bit Arithmetic Logic Unit (ALU) in VHDL-2008.
The design targets a generic FPGA fabric running at 100 MHz.
It supports ADD, SUB, AND, OR, XOR, NOT, SLL, and SRL operations.
Flags (Zero, Carry, Overflow) are updated synchronously based on the operation result.
A self-checking testbench verifies all operations using GHDL with deterministic PASS/FAIL reporting.