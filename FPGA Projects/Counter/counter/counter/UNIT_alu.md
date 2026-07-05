# Unit: alu

## Description
Registered 8-bit ALU with synchronous active-high reset. Supports ADD, SUB, AND, OR, XOR, NOT, SLT, MOV. Flags: Zero, Carry, Overflow, Less.

## Ports
- `clk`: Clock, 100 MHz.
- `rst`: Reset, sync active-high.
- `a`: Input, 8-bit.
- `b`: Input, 8-bit.
- `op`: Input, ALU operation select.
- `result`: Output, 8-bit result.
- `flags`: Output, ALU flags record.

## Timing
- Setup/Hold: Standard synchronous.
- Reset: Synchronous, active-high.
- Clock: 100 MHz.

## Risks
- None critical. Combinational logic in package is safe. Registered output ensures timing closure.