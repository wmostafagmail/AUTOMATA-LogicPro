# Skill: vhdl-language

## Purpose

Use this skill for IEEE-1076-compliant VHDL generation, repair, review, and compile-readiness work. It is the language-law and GHDL-discipline source for RTL, packages, and testbenches.

## Required Rules

- Default to VHDL-2008 unless the task explicitly says otherwise.
- Use `library ieee;`, `use ieee.std_logic_1164.all;`, and `use ieee.numeric_std.all;` in every file that needs them.
- Do not use `std_logic_arith`, `std_logic_unsigned`, or `std_logic_signed`.
- Never use VHDL reserved words or operator keywords as identifiers, enum literals, constants, signals, procedure names, function names, or formal arguments.
- Do not emit pseudo-English boolean/numeric hybrids such as `a_int and b_int = 0`.
- Use legal infix VHDL operators only: `and`, `or`, `xor`, `xnor`, `nand`, `nor`, `not`, `sll`, `srl`, `sla`, `sra`, `rol`, `ror`.
- In VHDL, `&` is concatenation only.
- Convert raw `std_logic_vector` operands into typed locals before arithmetic, resize, shift, or typed ALU helper operations.
- Call `resize` only on `unsigned` or `signed` values.
- Keep internal result types consistent across all branches of a process/function/case statement.
- Package files must be self-contained and include their own local imports.

## GHDL Compatibility

- Output must survive `ghdl -a --std=08`, `ghdl -e --std=08`, and `ghdl -r --std=08` as written.
- Do not rely on simulator-specific extensions.
- Do not emit malformed package/function syntax, post-`begin` declarations, or illegal prefix operator forms such as `xnor a, b`.
