# Project Overview: 8-bit ALU Core (ALU\_E2E)

## Purpose
The `alu_e2e` is a synthesizable hardware component designed to perform standard arithmetic, logical, and shift operations on two 8-bit operands (A and B). It functions as the core computational unit of a simplified CPU pipeline stage.

## Functionality
The ALU supports eight major modes selectable via an `OpCode` input:
1. Addition (ADD)
2. Subtraction (SUB)
3. Bitwise AND (AND)
4. Bitwise OR (OR)
5. Bitwise XOR (XOR)
6. Shift Left (SLL)
7. Shift Right (SRL)
8. Immediate Operations: Carry, Zero, Overflow mode selection.

## Ports
| Signal | Width | Description | Type |
| :--- | :--- | :--- | :--- |
| `A` | 8 bits | First input operand. | Data Input |
| `B` | 8 bits | Second input operand. | Data Input |
| `OpCode` | 3 bits | Selects the operation to perform (000 to 111). | Control Input |
| `Result` | 8 bits | The computed result of A op B. | Output Data |
| `Carry_Out` | 1 bit | Flag set upon arithmetic overflow (C flag for ADD/SUB). | Status Flag |
| `Zero_Flag` | 1 bit | Set if the Result is zero (`0x00`). | Status Flag |
| `Overflow_Flag` | 1 bit | Set if signed overflow occurs during ADD or SUB operations. | Status Flag |

## Operation Codes (OpCode Definition)
*   **ADD:** "000" (Decimal 0)
*   **SUB:** "001" (Decimal 1)
*   **AND:** "010" (Decimal 2)
*   **OR:** "011" (Decimal 3)
*   **XOR:** "100" (Decimal 4)
*   **SLL:** "101" (Decimal 5)
*   **SRL:** "110" (Decimal 6)
*   **CUSTOM/NOC:** Used for other flag checks or reserved.