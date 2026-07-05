# Verification Notes

## Testbench Strategy
Self-checking VHDL testbench (`alu_tb`) with deterministic stimulus and explicit expected values. No external reference model required; expected outputs derived analytically from known inputs.

## Test Coverage
| Test Case            | Inputs (a, b, opcode)        | Expected Result | Flags           | Purpose                     |
|----------------------|------------------------------|-----------------|-----------------|-----------------------------|
| RESET_STATE          | (0, 0, NOP) after reset      | 0x00            | zero=1, carry=0 | Reset value verification    |
| ADD 1+2              | (1, 2, ADD)                  | 0x03            | zero=0, carry=0 | Basic addition              |
| ADD_OVERFLOW         | (255, 1, ADD)                | 0x00            | zero=1, carry=1 | Unsigned overflow detection |
| SUB 5-3              | (5, 3, SUB)                  | 0x02            | zero=0, carry=0 | Basic subtraction           |
| SUB_UNDERFLOW        | (0, 1, SUB)                  | 0xFF            | zero=0, carry=0 | Borrow-out detection        |
| AND F0&A0            | (0xF0, 0xA0, AND)            | 0xA0            | zero=0, carry=0 | Bitwise AND                 |
| OR F0\|0F            | (0xF0, 0x0F, OR)             | 0xFF            | zero=0, carry=0 | Bitwise OR                  |
| XOR F0^0F            | (0xF0, 0x0F, XOR)            | 0xFF            | zero=0, carry=0 | Bitwise XOR                 |
| NOT F0               | (0xF0, 0x00, NOT)            | 0x0F            | zero=0, carry=0 | Bitwise NOT                 |
| SLL 01<<1            | (1, 1, SLL)                  | 0x02            | zero=0, carry=0 | Shift left                  |
| SRL 02>>1            | (2, 1, SRL)                  | 0x01            | zero=0, carry=0 | Shift right                 |
| NOP                  | (0xFF, 0xFF, NOP)            | 0x00            | zero=1, carry=0 | No-operation forced zero    |

## Observation Discipline
- All synchronous checks sample `result` and `flags` **after** the active clock edge has taken effect (`wait until rising_edge(clk)`).
- Reset release followed by one full clock cycle before first functional test.

## Pass/Fail Criteria
- Testbench uses local variables `pass_count` / `fail_count`.
- On completion: if `fail_count = 0`, exits with `std.env.stop(0)` (success code).
- Never uses `severity failure` to signal a passing run.

## GHDL Run Command
```bash
ghdl -r --std=08 alu_tb --stop-time=120us