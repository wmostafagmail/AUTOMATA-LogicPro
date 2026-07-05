# VERIFICATION.md

## Verification Plan
The testbench `tb_alu.vhd` performs comprehensive verification.

## Test Cases
1. Reset Test: Verify all outputs are zero after reset.
2. ADD Test: Verify addition with carry and overflow.
3. SUB Test: Verify subtraction and overflow.
4. AND/OR/XOR Test: Verify logical operations.
5. NOT Test: Verify inversion.
6. SHL/SHR Test: Verify shifts.
7. Edge Cases: Test max/min values for each operation.