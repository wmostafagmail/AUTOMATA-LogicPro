# Verification Plan (TB\_ALU\_E2E)

## Objective
To exhaustively verify the functionality of `alu_e2e` across all defined operational modes and edge cases for flag calculation using a self-checking testbench.

## Test Methodology
A transaction-level simulation is used, driving CLK and simulating resets/stable cycles. The testbench iterates through predefined `(A, B, OpCode)` vector sets and verifies the resulting output (Result, Z, C, V) against an expected golden reference model for each cycle.

## Key Test Vector Categories
1.  **Arithmetic Tests:** Full range tests including ADDing 0, max values (0xFF), min values (conceptually 0x00 after wrap), and intentional overflows (e.g., $0x80 + 0x80$ to trigger V=1).
2.  **Logical/Shift Tests:** Testing AND, OR, XOR over full ranges, including edge case shifts (shift by 0 or shift by 7).
3.  **Flag Corner Cases:** Specific vectors designed solely to check the flag logic:
    *   Zero Flag: $A=B=0$.
    *   Carry Flag: $A = \text{Max}$, $B = 1$ (should trigger C=1).
    *   Overflow Flag: $A=0x80$, $B=0x80$ (signed overflow, assuming MSB is sign bit).

## Simulation Setup
The testbench uses a structured `wait for clock edge` approach to ensure all DUT outputs are sampled only after the active clock edge has stabilized. Success criteria require the execution of all test cases and termination via `std.env.stop(0)`.