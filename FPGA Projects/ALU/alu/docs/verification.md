# ALU Verification Plan

## Testbench Strategy
A self-checking testbench (`alu_tb.vhd`) drives the DUT through deterministic smoke vectors covering every opcode once, plus a reset vector at startup. The testbench uses `std.env.stop(0)` on success and reports failures via GHDL report severity.

## Smoke Vectors Covered
| Test        | Opcode | A   | B   | Expected Result | Zero |
|-------------|--------|-----|-----|-----------------|------|
| RESET       | -      | 0x00| 0x00| 0x00            | 1    |
| ADD_1_2     | OP_ADD | 0x01| 0x02| 0x03            | 0    |
| SUB_5_3     | OP_SUB | 0x05| 0x03| 0x02            | 0    |
| AND_FF_F0   | OP_AND_OP | 0xFF | 0xF0 | 0xF0       | 0    |
| OR_0F_F0    | OP_OR_OP | 0x0F | 0xF0 | 0xFF      | 0    |
| XOR_A5_5A   | OP_XOR_OP | 0xA5 | 0x5A | 0xFF     | 0    |
| NOT_AA      | OP_NOT_OP | 0xAA | -   | 0x55            | 0    |
| SLA_01_3    | OP_SLA_OP | 0x01 | 0x03 | 0x08        | 0    |
| SRA_20_2    | OP_SRA_OP | 0x20 | 0x02 | 0x08        | 0    |

## GHDL Run
```sh
ghdl -a --std=08 src/alu_pkg.vhd src/alu.vhd tb/alu_tb.vhd
ghdl -e --std=08 alu_tb
ghdl -r --std=08 alu_tb --wave=tb.ghw --vcd=tb.vcd --stop-time=2us