# AVR Cycle-by-Cycle Timing Specification

## Purpose
This document defines the cycle-by-cycle execution model for the first AVR-compatible softcore implementation.

It is intended to:

- drive `avr_control_fsm.vhd`
- give a stable timing contract for simulation
- reduce ambiguity in branch, skip, stack, and memory behaviors
- provide a compatibility reference when comparing against expected AVR behavior

## Scope and Interpretation
This timing model is for the first multi-cycle softcore version. It aims to preserve software-visible behavior and instruction ordering, not to duplicate Atmel internal pipelines cycle-for-cycle.

The main requirement is:

- architectural state must match AVR expectations
- branch and skip length behavior must be correct
- stack, interrupt, and memory ordering must be correct
- timers and peripherals can be synchronized to this execution model consistently

## Timing Model Conventions

### Clock-cycle naming
Each instruction timing sequence is described using:

- `T0`
- `T1`
- `T2`
- `T3`
- ...

These refer to core clock cycles in the softcore FSM.

### Base assumptions

- program memory is synchronous with one-cycle read latency
- data memory / I/O reads are synchronous with one-cycle read latency
- data writes commit in the cycle where write enable is asserted
- register file reads are combinational
- register file writes occur on the active clock edge

### Core state mapping
Recommended symbolic mapping:

- `T0` -> `CORE_S_FETCH0`
- `T1` -> `CORE_S_FETCH1`
- `T2` -> `CORE_S_DECODE`
- later `Tn` -> execute/writeback states depending on instruction type

### PC convention

- `PC` is word-addressed
- `PC_fetch` is the address used for instruction word 0 fetch
- `PC_next16 = PC_fetch + 1`
- `PC_next32 = PC_fetch + 2`
- relative branch targets are based on the post-fetch next-instruction PC

## Common Primitive Timing Templates

## Template A: 16-bit register-only instruction
Applies to:

- `NOP`
- `MOV`
- `LDI`
- most 16-bit ALU ops
- `BSET`
- `BCLR`
- `BST`
- `BLD`

Timing:

1. `T0`
   - drive `pmem_addr <= PC`
   - assert `pmem_req`
2. `T1`
   - latch `ir0 <= pmem_rdata`
   - provisional `PC <= PC + 1`
3. `T2`
   - decode `ir0`
4. `T3`
   - execute ALU or direct register/status update
   - writeback if required
   - update flags if required

Total softcore cycles: 4

## Template B: 32-bit instruction fetch
Applies to:

- `LDS`
- `STS`
- `JMP`
- `CALL`

Timing:

1. `T0`
   - fetch word0 at `PC`
2. `T1`
   - latch word0
   - request word1 at `PC + 1`
3. `T2`
   - latch word1
   - provisional `PC <= PC + 2`
   - final decode using `ir0` and `ir1`
4. later execute states depend on instruction class

Base fetch cost before execution: 3 cycles

## Template C: synchronous data read
Applies to:

- `IN`
- `LD*`
- `LDS`
- `POP`
- `SBIC`
- `SBIS`

Timing:

1. execute-read-address cycle
   - drive `d_addr`
   - assert `d_re`
2. read-return cycle
   - latch `d_rdata`
   - consume data for writeback or condition test

Read latency cost after decode: 2 cycles minimum

## Template D: synchronous data write
Applies to:

- `OUT`
- `ST*`
- `STS`
- `PUSH`

Timing:

1. execute-write cycle
   - drive `d_addr`
   - drive `d_wdata`
   - assert `d_we`

Write latency cost after decode: 1 cycle minimum

## Template E: stack push byte
Timing:

1. stack adjust cycle
   - `SP <= SP - 1`
2. stack write cycle
   - `d_addr <= new SP`
   - `d_wdata <= push_byte`
   - `d_we <= 1`

Cost per pushed byte: 2 cycles

## Template F: stack pop byte
Timing:

1. stack read cycle
   - `d_addr <= SP`
   - `d_re <= 1`
2. stack consume cycle
   - capture `d_rdata`
   - `SP <= SP + 1`

Cost per popped byte: 2 cycles

## Template G: skip resolver
Timing:

1. evaluate skip condition
2. if taken, request next instruction word0
3. inspect whether next instruction is 16-bit or 32-bit
4. advance `PC` by additional 1 or 2 words

Minimum skip-taken overhead: 2 extra cycles

## Instruction Timing Table

The sequences below assume no stalls beyond the one-cycle fetch and one-cycle data-read model.

## Group A: Simple Register and Status Instructions

### `NOP`
Timing:

1. `T0`: fetch word0
2. `T1`: latch word0, `PC <= PC + 1`
3. `T2`: decode
4. `T3`: no-op complete

Total cycles: 4

### `MOV Rd, Rr`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, read `Rr`
4. `T3`: write `Rd <= Rr`

Total cycles: 4

### `MOVW Rd+1:Rd, Rr+1:Rr`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, read source pair
4. `T3`: paired writeback

Total cycles: 4

### `LDI Rd, K`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode immediate
4. `T3`: write `Rd <= K`

Total cycles: 4

### `BSET s`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode
4. `T3`: set `SREG[s]`

Total cycles: 4

### `BCLR s`
Same as `BSET`.

Total cycles: 4

### `BST Rd, b`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, read `Rd`
4. `T3`: copy bit into `SREG.T`

Total cycles: 4

### `BLD Rd, b`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, read `Rd`
4. `T3`: merge `SREG.T` into bit `b`, write `Rd`

Total cycles: 4

## Group B: Register-Register and Immediate ALU Instructions

### Applies to:
- `ADD`
- `ADC`
- `SUB`
- `SBC`
- `AND`
- `OR`
- `EOR`
- `CP`
- `CPC`
- `SUBI`
- `SBCI`
- `ANDI`
- `ORI`
- `CPI`
- `COM`
- `NEG`
- `INC`
- `DEC`
- `TST`
- `LSL`
- `LSR`
- `ROL`
- `ROR`
- `ASR`

Common timing:

1. `T0`: fetch instruction
2. `T1`: latch instruction, increment `PC`
3. `T2`: decode, read operands, form ALU control
4. `T3`: execute ALU, update flags, and if applicable write destination

Total cycles:

- writeback ALU ops: 4
- compare-only ops (`CP`, `CPC`, `CPI`, `TST` if no writeback): 4

### `ADIW`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, read register pair
4. `T3`: execute 16-bit add low/high
5. `T4`: paired writeback and flag update

Total cycles: 5

Reason:

- splitting word ALU result/writeback simplifies the first implementation

## Group C: I/O and Memory Read Instructions

### `IN Rd, A`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, drive `d_addr <= 0x20 + A`, assert `d_re`
4. `T3`: capture `d_rdata`
5. `T4`: write `Rd <= d_rdata`

Total cycles: 5

### `LDS Rd, k`
Timing:

1. `T0`: fetch word0
2. `T1`: latch word0, request word1
3. `T2`: latch word1, increment `PC` by 2, decode
4. `T3`: drive `d_addr <= k`, assert `d_re`
5. `T4`: capture `d_rdata`
6. `T5`: write `Rd <= d_rdata`

Total cycles: 6

### `LD Rd, X`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, form address from `X`, assert `d_re`
4. `T3`: capture `d_rdata`
5. `T4`: write `Rd <= d_rdata`

Total cycles: 5

### `LD Rd, X+`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, drive address from old `X`, assert `d_re`
4. `T3`: capture `d_rdata`
5. `T4`: write `Rd <= d_rdata`
6. `T5`: update `X <= X + 1`

Total cycles: 6

### `LD Rd, -X`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, `X <= X - 1`
4. `T3`: drive address from new `X`, assert `d_re`
5. `T4`: capture `d_rdata`
6. `T5`: write `Rd <= d_rdata`

Total cycles: 6

Apply the same cycle shapes to `Y` and `Z` forms.

### `POP Rd`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, drive `d_addr <= SP`, assert `d_re`
4. `T3`: capture `d_rdata`
5. `T4`: write `Rd <= d_rdata`
6. `T5`: `SP <= SP + 1`

Total cycles: 6

## Group D: I/O and Memory Write Instructions

### `OUT A, Rr`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, read `Rr`
4. `T3`: drive `d_addr <= 0x20 + A`, `d_wdata <= Rr`, assert `d_we`

Total cycles: 4

### `STS k, Rr`
Timing:

1. `T0`: fetch word0
2. `T1`: latch word0, request word1
3. `T2`: latch word1, increment `PC` by 2, decode
4. `T3`: read `Rr`, drive address/data
5. `T4`: assert `d_we`

Total cycles: 5

### `ST X, Rr`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, form address from `X`, read `Rr`
4. `T3`: drive write to memory

Total cycles: 4

### `ST X+, Rr`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, form address from old `X`, read `Rr`
4. `T3`: drive write to memory
5. `T4`: `X <= X + 1`

Total cycles: 5

### `ST -X, Rr`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, `X <= X - 1`
4. `T3`: form address from new `X`, read `Rr`
5. `T4`: drive write to memory

Total cycles: 5

Apply the same timing shapes to `Y` and `Z` forms.

### `PUSH Rr`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, read `Rr`
4. `T3`: `SP <= SP - 1`
5. `T4`: drive `d_addr <= SP_new`, `d_wdata <= Rr`, assert `d_we`

Total cycles: 5

## Group E: Branch and Flow Control

### `RJMP k`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, sign-extend offset
4. `T3`: load `PC <= PC_next + k`

Total cycles: 4

### `JMP k`
Timing:

1. `T0`: fetch word0
2. `T1`: latch word0, request word1
3. `T2`: latch word1, increment `PC` by 2, decode
4. `T3`: assemble address
5. `T4`: load `PC <= k`

Total cycles: 5

### `RCALL k`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, compute return address and branch target
4. `T3`: `SP <= SP - 1`
5. `T4`: push return address high byte
6. `T5`: `SP <= SP - 1`
7. `T6`: push return address low byte
8. `T7`: load `PC <= target`

Total cycles: 8

### `CALL k`
Timing:

1. `T0`: fetch word0
2. `T1`: latch word0, request word1
3. `T2`: latch word1, increment `PC` by 2, decode
4. `T3`: compute return address and call target
5. `T4`: `SP <= SP - 1`
6. `T5`: push return address high byte
7. `T6`: `SP <= SP - 1`
8. `T7`: push return address low byte
9. `T8`: load `PC <= target`

Total cycles: 9

### `RET`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, drive `d_addr <= SP`, assert `d_re`
4. `T3`: capture low byte, `SP <= SP + 1`
5. `T4`: drive `d_addr <= SP`, assert `d_re`
6. `T5`: capture high byte, `SP <= SP + 1`
7. `T6`: load `PC`

Total cycles: 7

### `RETI`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, drive `d_addr <= SP`, assert `d_re`
4. `T3`: capture low byte, `SP <= SP + 1`
5. `T4`: drive `d_addr <= SP`, assert `d_re`
6. `T5`: capture high byte, `SP <= SP + 1`
7. `T6`: load `PC`, set `SREG.I`

Total cycles: 7

### `BRBS s, k`
Timing when branch not taken:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode and test `SREG[s]`
4. `T3`: fall through

Total cycles not taken: 4

Timing when branch taken:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode and test `SREG[s]`
4. `T3`: load `PC <= PC_next + k`

Total cycles taken: 4

### `BRBC s, k`
Same shape as `BRBS`.

## Group F: Skip Instructions

### `CPSE Rd, Rr`
Timing when skip not taken:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, compare register values
4. `T3`: fall through

Total cycles not taken: 4

Timing when skip taken and next instruction is 16-bit:

1. `T0`: fetch current
2. `T1`: latch current, increment `PC`
3. `T2`: decode and detect equality
4. `T3`: request next instruction word0 at current `PC`
5. `T4`: latch skipped instruction word0, determine it is 16-bit
6. `T5`: `PC <= PC + 1`

Total cycles taken, next 16-bit: 6

Timing when skip taken and next instruction is 32-bit:

1. `T0`: fetch current
2. `T1`: latch current, increment `PC`
3. `T2`: decode and detect equality
4. `T3`: request next instruction word0
5. `T4`: latch skipped word0, determine it is 32-bit
6. `T5`: `PC <= PC + 2`

Total cycles taken, next 32-bit: 6

Implementation note:

- because only the skipped instruction length matters, the resolver does not need full execution decode, only length classification

### `SBRC Rr, b`
Timing:

- not taken: same as `CPSE` not taken, total 4
- taken: same as `CPSE` taken path, total 6

### `SBRS Rr, b`
Timing:

- not taken: 4
- taken: 6

### `SBIC A, b`
Timing when not taken:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, drive I/O read
4. `T3`: capture I/O value and evaluate bit
5. `T4`: fall through

Total cycles not taken: 5

Timing when taken:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, drive I/O read
4. `T3`: capture I/O value and detect skip
5. `T4`: request next instruction word0
6. `T5`: latch skipped instruction word0 and classify length
7. `T6`: advance `PC` by extra 1 or 2 words

Total cycles taken: 7

### `SBIS A, b`
Same as `SBIC`.

## Group G: Bit Set/Clear in I/O

### `SBI A, b`
Timing:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode, drive I/O read
4. `T3`: capture old value, modify bit
5. `T4`: write modified byte back

Total cycles: 5

### `CBI A, b`
Same as `SBI`.

Total cycles: 5

## Interrupt Entry Timing

Interrupts are sampled after completion of the current instruction, before the next `FETCH0`.

Entry sequence:

1. `IRQ_T0`
   - accept highest-priority pending interrupt
   - clear global `I`
   - compute vector target
2. `IRQ_T1`
   - `SP <= SP - 1`
3. `IRQ_T2`
   - push return PC high byte
4. `IRQ_T3`
   - `SP <= SP - 1`
5. `IRQ_T4`
   - push return PC low byte
6. `IRQ_T5`
   - load `PC <= vector address`
7. next cycle resumes normal `FETCH0`

Total interrupt-entry overhead: 6 cycles before next instruction fetch begins

## Illegal Instruction Timing

When `decode_illegal = 1`:

1. `T0`: fetch
2. `T1`: latch, increment `PC`
3. `T2`: decode as illegal
4. `T3`: enter `HALT_ILLEGAL`

Total cycles before halt: 4

## FSM State Recommendations

The cycle sequences above map well onto these states:

- `CORE_S_FETCH0`
- `CORE_S_FETCH1`
- `CORE_S_FETCH2_32`
- `CORE_S_DECODE`
- `CORE_S_EXEC_ALU`
- `CORE_S_EXEC_ADDR`
- `CORE_S_EXEC_READ_REQ`
- `CORE_S_EXEC_READ_CAP`
- `CORE_S_EXEC_WRITEBACK`
- `CORE_S_EXEC_WRITE`
- `CORE_S_EXEC_PTR_UPDATE`
- `CORE_S_EXEC_SP_DEC`
- `CORE_S_EXEC_SP_INC`
- `CORE_S_EXEC_CALL_PUSH_H`
- `CORE_S_EXEC_CALL_PUSH_L`
- `CORE_S_EXEC_RET_POP_L`
- `CORE_S_EXEC_RET_POP_H`
- `CORE_S_EXEC_PC_LOAD`
- `CORE_S_SKIP_FETCH`
- `CORE_S_SKIP_CLASSIFY`
- `CORE_S_IRQ_ENTRY_0`
- `CORE_S_IRQ_ENTRY_1`
- `CORE_S_IRQ_ENTRY_2`
- `CORE_S_IRQ_ENTRY_3`
- `CORE_S_IRQ_ENTRY_4`
- `CORE_S_IRQ_ENTRY_5`
- `CORE_S_HALT_ILLEGAL`

## Timing Summary Table

### 4-cycle instructions
- `NOP`
- `MOV`
- `MOVW`
- `LDI`
- `ADD`
- `ADC`
- `SUB`
- `SBC`
- `AND`
- `OR`
- `EOR`
- `CP`
- `CPC`
- `SUBI`
- `SBCI`
- `ANDI`
- `ORI`
- `CPI`
- `COM`
- `NEG`
- `INC`
- `DEC`
- `TST`
- `LSL`
- `LSR`
- `ROL`
- `ROR`
- `ASR`
- `OUT`
- `ST X`
- `ST Y`
- `ST Z`
- `RJMP`
- `BRBS`
- `BRBC`
- `BSET`
- `BCLR`
- `BST`
- `BLD`

### 5-cycle instructions
- `ADIW`
- `IN`
- `LD X`
- `LD Y`
- `LD Z`
- `ST X+`
- `ST Y+`
- `ST Z+`
- `ST -X`
- `ST -Y`
- `ST -Z`
- `PUSH`
- `JMP`
- `STS`
- `SBI`
- `CBI`

### 6-cycle instructions
- `LDS`
- `LD X+`
- `LD Y+`
- `LD Z+`
- `LD -X`
- `LD -Y`
- `LD -Z`
- `POP`
- `CPSE` taken
- `SBRC` taken
- `SBRS` taken

### 7-cycle instructions
- `RET`
- `RETI`
- `SBIC` taken
- `SBIS` taken

### 8-cycle instructions
- `RCALL`

### 9-cycle instructions
- `CALL`

## Important Compatibility Notes

### 1. Skip timing is intentionally normalized
The softcore uses a fixed skip-resolution mechanism. It may not match original AVR internal cycle counts exactly, but it must always:

- skip the correct number of words
- preserve architectural correctness
- avoid partially decoding/executing skipped instructions

### 2. Stack ordering must be frozen early
Whichever byte order is chosen for pushed return addresses must match AVR conventions consistently across:

- `RCALL`
- `CALL`
- interrupt entry
- `RET`
- `RETI`

This must be tested immediately once stack logic exists.

### 3. Branch target base must be consistent
All relative branches and calls must use the post-fetch next-instruction address as the base.

### 4. Peripheral-visible timing should be derived from this table
When integrating timers, UART, and interrupts, they should observe instruction completion boundaries based on this FSM timing model rather than ad hoc control behavior.

## Verification Checklist

For each implemented instruction family, verify:

- final PC value
- final register result
- final `SREG`
- final `SP`
- exact data-space access order
- exact number of core cycles

High-priority waveform checks:

- `RCALL` followed by `RET`
- `RETI`
- `PUSH`/`POP`
- `LD -X`, `LD X+`
- `ST -Z`, `ST Z+`
- `CPSE` before `CALL`
- `SBIC` before `LDS`

## Recommended Next Step
The next useful artifact after this timing document is:

- a concrete `avr_control_fsm` state transition table with per-state output control signals

That would be the direct implementation sheet for the first RTL version of the controller.
