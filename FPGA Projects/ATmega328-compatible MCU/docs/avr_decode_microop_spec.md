# AVR Decode Table and Micro-Op Specification

## Purpose
This document defines the normalized decode model and execution micro-ops for an `ATmega328P`-compatible AVR softcore.

It is the direct blueprint for:

- `rtl/avr/avr_decoder.vhd`
- `rtl/avr/avr_control_fsm.vhd`

The goal is not to mirror every internal detail of Atmel silicon, but to produce a stable implementation contract that preserves software-visible AVR behavior.

## Scope
This first decode/micro-op spec focuses on the instruction groups needed for initial compatibility:

- register/immediate moves
- arithmetic and logic
- direct and indirect loads/stores
- stack operations
- control flow
- skip instructions
- interrupt return
- basic bit operations

More advanced timing-sensitive peripherals and rarely used multiply-family instructions can be added in later revisions.

## Decoder Output Contract
The decoder should transform raw instruction words into a normalized internal record.

Suggested internal record fields:

- `instr_kind`
- `is_32bit`
- `uses_rd`
- `uses_rr`
- `uses_imm8`
- `uses_imm16`
- `uses_io_addr`
- `uses_bit_index`
- `rd_idx`
- `rr_idx`
- `imm8`
- `imm16`
- `io_addr`
- `bit_index`
- `ptr_sel`
- `ptr_mode`
- `branch_cond`
- `flag_mask`
- `skip_kind`
- `writeback_en`
- `flags_en`
- `decode_illegal`

## Suggested Enum Types

### `avr_instr_t`
Representative normalized instruction kinds:

- `I_NOP`
- `I_MOV`
- `I_MOVW`
- `I_LDI`
- `I_IN`
- `I_OUT`
- `I_LD_X`
- `I_LD_X_POSTINC`
- `I_LD_X_PREDEC`
- `I_LD_Y`
- `I_LD_Y_POSTINC`
- `I_LD_Y_PREDEC`
- `I_LD_Z`
- `I_LD_Z_POSTINC`
- `I_LD_Z_PREDEC`
- `I_ST_X`
- `I_ST_X_POSTINC`
- `I_ST_X_PREDEC`
- `I_ST_Y`
- `I_ST_Y_POSTINC`
- `I_ST_Y_PREDEC`
- `I_ST_Z`
- `I_ST_Z_POSTINC`
- `I_ST_Z_PREDEC`
- `I_LDS`
- `I_STS`
- `I_PUSH`
- `I_POP`
- `I_ADD`
- `I_ADC`
- `I_ADIW`
- `I_SUB`
- `I_SUBI`
- `I_SBC`
- `I_SBCI`
- `I_AND`
- `I_ANDI`
- `I_OR`
- `I_ORI`
- `I_EOR`
- `I_COM`
- `I_NEG`
- `I_INC`
- `I_DEC`
- `I_CP`
- `I_CPC`
- `I_CPI`
- `I_TST`
- `I_LSL`
- `I_LSR`
- `I_ROL`
- `I_ROR`
- `I_ASR`
- `I_SWAP`
- `I_BSET`
- `I_BCLR`
- `I_BST`
- `I_BLD`
- `I_SBI`
- `I_CBI`
- `I_RJMP`
- `I_JMP`
- `I_RCALL`
- `I_CALL`
- `I_RET`
- `I_RETI`
- `I_BRBS`
- `I_BRBC`
- `I_CPSE`
- `I_SBRC`
- `I_SBRS`
- `I_SBIC`
- `I_SBIS`
- `I_ILLEGAL`

### `ptr_sel_t`
- `PTR_NONE`
- `PTR_X`
- `PTR_Y`
- `PTR_Z`

### `ptr_mode_t`
- `PTR_MODE_NONE`
- `PTR_MODE_DIRECT`
- `PTR_MODE_POSTINC`
- `PTR_MODE_PREDEC`

### `branch_cond_t`
- `BC_NONE`
- `BC_ALWAYS`
- `BC_SREG_BIT_SET`
- `BC_SREG_BIT_CLEAR`

### `skip_kind_t`
- `SKIP_NONE`
- `SKIP_IF_REG_EQ`
- `SKIP_IF_BIT_CLR_REG`
- `SKIP_IF_BIT_SET_REG`
- `SKIP_IF_BIT_CLR_IO`
- `SKIP_IF_BIT_SET_IO`

## Decode Strategy
Decode should follow this precedence:

1. exact fixed-pattern instructions
2. 32-bit instructions
3. indirect addressing families
4. register-register ALU instructions
5. immediate ALU instructions
6. branch/skip instructions
7. bit/I/O instructions
8. illegal fallback

This avoids ambiguous matches between overlapping AVR patterns.

## Operand Normalization Rules

### Register fields
Many AVR encodings split register fields across non-contiguous bits.

Recommended helpers:

- `decode_rd_5()`
- `decode_rr_5()`
- `decode_d_upper16()`
- `decode_r_upper16()`
- `decode_word_reg_pair()`

Rules:

- `LDI`, `ANDI`, `ORI`, `SUBI`, `SBCI`, `CPI` target only `R16..R31`
- `MOVW`, `ADIW` operate on even register pairs
- X/Y/Z pointers are aliases of high registers:
  - `X = R27:R26`
  - `Y = R29:R28`
  - `Z = R31:R30`

### Immediate fields
Helpers:

- `decode_k8()`
- `decode_k12_signed()`
- `decode_k7_signed()`
- `decode_addr16_from_word1()`

Rules:

- `RJMP` and `RCALL` use signed relative offsets
- `BRBS` and `BRBC` use signed 7-bit branch offset
- `LDS`, `STS`, `JMP`, `CALL` take second-word absolute address

### Bit index fields
Helpers:

- `decode_bit_3()`
- `decode_sreg_bit_3()`

Used by:

- `BST`, `BLD`
- `SBRC`, `SBRS`
- `SBIC`, `SBIS`
- `SBI`, `CBI`
- `BSET`, `BCLR`
- `BRBS`, `BRBC`

## Micro-Op Model
The FSM should not hardcode per-instruction logic directly. Instead, each instruction should map to a small set of abstract execution actions.

Suggested abstract micro-ops:

- `UOP_FETCH_WORD0`
- `UOP_FETCH_WORD1`
- `UOP_DECODE`
- `UOP_REG_READ`
- `UOP_ALU_EXEC`
- `UOP_REG_WRITE`
- `UOP_FLAGS_WRITE`
- `UOP_DMEM_READ`
- `UOP_DMEM_WRITE`
- `UOP_IO_READ`
- `UOP_IO_WRITE`
- `UOP_PC_INC`
- `UOP_PC_LOAD_ABS`
- `UOP_PC_LOAD_REL`
- `UOP_SP_DEC`
- `UOP_SP_INC`
- `UOP_PUSH_BYTE`
- `UOP_POP_BYTE`
- `UOP_SKIP_EVAL`
- `UOP_IRQ_ACK`
- `UOP_SET_I`
- `UOP_CLR_I`
- `UOP_HALT_ILLEGAL`

Implementation note:

- these do not need to exist as a literal VHDL enum if control signals are easier, but the FSM should be designed as though these are the primitive actions

## Fetch and Decode Pipeline Contract

### Baseline fetch sequence
1. fetch word 0 from `PC`
2. latch into `ir0`
3. decode word 0 enough to know whether instruction is 16-bit or 32-bit
4. if 32-bit, fetch word 1 from `PC + 1`
5. perform final decode

### PC convention
- `PC` is word-addressed
- 16-bit instructions increment `PC` by 1 word after fetch
- 32-bit instructions increment `PC` by 2 words after fetch
- relative branches add offset relative to next instruction address

## Instruction Decode Table

The patterns below are written in AVR-style bit notation. They are intended as implementation guidance, not as a replacement for a final checked decode package.

## Group A: Data Movement

### `NOP`
- Pattern: `0000 0000 0000 0000`
- Decodes to: `I_NOP`
- Micro-op sequence:
  1. `FETCH0/FETCH1`
  2. `DECODE`
  3. no writeback
  4. continue
- Flags: unchanged
- Cycles target: 1 AVR-visible instruction cycle

### `MOV Rd, Rr`
- Pattern: `0010 11rd dddd rrrr`
- Decodes to: `I_MOV`
- Fields:
  - `rd_idx = d`
  - `rr_idx = r`
- Micro-op sequence:
  1. read `Rr`
  2. write `Rd <= Rr`
- Flags: unchanged

### `MOVW Rd+1:Rd, Rr+1:Rr`
- Pattern: `0000 0001 dddd rrrr`
- Decodes to: `I_MOVW`
- Rules:
  - both source and destination are even register pairs
- Micro-op sequence:
  1. read low/high source bytes
  2. paired write to destination pair
- Flags: unchanged

### `LDI Rd, K`
- Pattern: `1110 KKKK dddd KKKK`
- Decodes to: `I_LDI`
- Rules:
  - `Rd = 16 + dddd`
- Micro-op sequence:
  1. immediate assemble
  2. write `Rd <= K`
- Flags: unchanged

### `IN Rd, A`
- Pattern: `1011 0AAd dddd AAAA`
- Decodes to: `I_IN`
- Rules:
  - low-I/O address is `0x20 + A`
- Micro-op sequence:
  1. drive `d_addr <= 0x0020 + A`
  2. `d_re <= 1`
  3. wait `d_valid`
  4. write `Rd <= d_rdata`
- Flags: unchanged

### `OUT A, Rr`
- Pattern: `1011 1AAr rrrr AAAA`
- Decodes to: `I_OUT`
- Rules:
  - low-I/O address is `0x20 + A`
- Micro-op sequence:
  1. drive `d_addr <= 0x0020 + A`
  2. `d_wdata <= Rr`
  3. `d_we <= 1`
- Flags: unchanged

### `LDS Rd, k`
- Pattern word0: `1001 000d dddd 0000`
- Pattern word1: `kkkk kkkk kkkk kkkk`
- Decodes to: `I_LDS`
- Micro-op sequence:
  1. fetch word1
  2. drive `d_addr <= k`
  3. `d_re <= 1`
  4. wait `d_valid`
  5. write `Rd <= d_rdata`
- Flags: unchanged

### `STS k, Rr`
- Pattern word0: `1001 001r rrrr 0000`
- Pattern word1: `kkkk kkkk kkkk kkkk`
- Decodes to: `I_STS`
- Micro-op sequence:
  1. fetch word1
  2. drive `d_addr <= k`
  3. `d_wdata <= Rr`
  4. `d_we <= 1`
- Flags: unchanged

### `LD Rd, X`
- Pattern: `1001 000d dddd 1100`
- Decodes to: `I_LD_X`
- Micro-op sequence:
  1. address from `X`
  2. data read
  3. writeback to `Rd`

### `LD Rd, X+`
- Pattern: `1001 000d dddd 1101`
- Decodes to: `I_LD_X_POSTINC`
- Micro-op sequence:
  1. address from old `X`
  2. data read
  3. writeback to `Rd`
  4. increment `X`

### `LD Rd, -X`
- Pattern: `1001 000d dddd 1110`
- Decodes to: `I_LD_X_PREDEC`
- Micro-op sequence:
  1. decrement `X`
  2. address from new `X`
  3. data read
  4. writeback to `Rd`

Apply the same structure for `Y`, `Y+`, `-Y`, `Z`, `Z+`, `-Z`.

### `ST X, Rr`
- Pattern: `1001 001r rrrr 1100`
- Decodes to: `I_ST_X`
- Micro-op sequence:
  1. address from `X`
  2. `d_wdata <= Rr`
  3. write memory

### `ST X+, Rr`
- Pattern: `1001 001r rrrr 1101`
- Decodes to: `I_ST_X_POSTINC`
- Micro-op sequence:
  1. address from old `X`
  2. write memory
  3. increment `X`

### `ST -X, Rr`
- Pattern: `1001 001r rrrr 1110`
- Decodes to: `I_ST_X_PREDEC`
- Micro-op sequence:
  1. decrement `X`
  2. address from new `X`
  3. write memory

Apply the same structure for `Y` and `Z`.

### `PUSH Rr`
- Pattern: `1001 001d dddd 1111`
- Decodes to: `I_PUSH`
- Micro-op sequence:
  1. `SP <= SP - 1`
  2. address from new `SP`
  3. write `Rr` to stack
- Flags: unchanged

### `POP Rd`
- Pattern: `1001 000d dddd 1111`
- Decodes to: `I_POP`
- Micro-op sequence:
  1. address from `SP`
  2. read byte
  3. write `Rd <= d_rdata`
  4. `SP <= SP + 1`
- Flags: unchanged

## Group B: Arithmetic and Logic

### `ADD Rd, Rr`
- Pattern: `0000 11rd dddd rrrr`
- Decodes to: `I_ADD`
- Micro-op sequence:
  1. ALU add `Rd + Rr`
  2. write `Rd`
  3. update flags

### `ADC Rd, Rr`
- Pattern: `0001 11rd dddd rrrr`
- Decodes to: `I_ADC`
- Micro-op sequence:
  1. ALU add with carry
  2. write `Rd`
  3. update flags

### `SUB Rd, Rr`
- Pattern: `0001 10rd dddd rrrr`
- Decodes to: `I_SUB`
- Micro-op sequence:
  1. ALU subtract
  2. write `Rd`
  3. update flags

### `SBC Rd, Rr`
- Pattern: `0000 10rd dddd rrrr`
- Decodes to: `I_SBC`
- Micro-op sequence:
  1. ALU subtract with carry
  2. write `Rd`
  3. update flags

### `AND Rd, Rr`
- Pattern: `0010 00rd dddd rrrr`
- Decodes to: `I_AND`
- Micro-op sequence:
  1. ALU and
  2. write `Rd`
  3. update flags

### `OR Rd, Rr`
- Pattern: `0010 10rd dddd rrrr`
- Decodes to: `I_OR`
- Micro-op sequence:
  1. ALU or
  2. write `Rd`
  3. update flags

### `EOR Rd, Rr`
- Pattern: `0010 01rd dddd rrrr`
- Decodes to: `I_EOR`
- Micro-op sequence:
  1. ALU xor
  2. write `Rd`
  3. update flags

### `CP Rd, Rr`
- Pattern: `0001 01rd dddd rrrr`
- Decodes to: `I_CP`
- Micro-op sequence:
  1. ALU subtract
  2. no register writeback
  3. update flags

### `CPC Rd, Rr`
- Pattern: `0000 01rd dddd rrrr`
- Decodes to: `I_CPC`
- Micro-op sequence:
  1. ALU subtract with carry
  2. no register writeback
  3. update flags

### `SUBI Rd, K`
- Pattern: `0101 KKKK dddd KKKK`
- Decodes to: `I_SUBI`
- Rules:
  - `Rd = 16 + dddd`
- Micro-op sequence:
  1. ALU subtract immediate
  2. write `Rd`
  3. update flags

### `SBCI Rd, K`
- Pattern: `0100 KKKK dddd KKKK`
- Decodes to: `I_SBCI`
- Micro-op sequence:
  1. ALU subtract immediate with carry
  2. write `Rd`
  3. update flags

### `ANDI Rd, K`
- Pattern: `0111 KKKK dddd KKKK`
- Decodes to: `I_ANDI`
- Micro-op sequence:
  1. ALU and immediate
  2. write `Rd`
  3. update flags

### `ORI Rd, K`
- Pattern: `0110 KKKK dddd KKKK`
- Decodes to: `I_ORI`
- Micro-op sequence:
  1. ALU or immediate
  2. write `Rd`
  3. update flags

### `CPI Rd, K`
- Pattern: `0011 KKKK dddd KKKK`
- Decodes to: `I_CPI`
- Micro-op sequence:
  1. ALU compare immediate
  2. update flags only

### `COM Rd`
- Pattern: `1001 010d dddd 0000`
- Decodes to: `I_COM`
- Micro-op sequence:
  1. ones-complement
  2. write `Rd`
  3. update flags

### `NEG Rd`
- Pattern: `1001 010d dddd 0001`
- Decodes to: `I_NEG`
- Micro-op sequence:
  1. `0 - Rd`
  2. write `Rd`
  3. update flags

### `INC Rd`
- Pattern: `1001 010d dddd 0011`
- Decodes to: `I_INC`
- Micro-op sequence:
  1. increment
  2. write `Rd`
  3. update flags

### `DEC Rd`
- Pattern: `1001 010d dddd 1010`
- Decodes to: `I_DEC`
- Micro-op sequence:
  1. decrement
  2. write `Rd`
  3. update flags

### `TST Rd`
- Canonical expansion: `AND Rd, Rd`
- Decodes to: `I_TST`
- Micro-op sequence:
  1. ALU and self
  2. flags update
  3. optional no writeback for cleaner implementation

### `LSL Rd`
- Canonical expansion: `ADD Rd, Rd`
- Decodes to: `I_LSL`
- Micro-op sequence:
  1. ALU shift-left semantics
  2. write `Rd`
  3. update flags

### `LSR Rd`
- Pattern: `1001 010d dddd 0110`
- Decodes to: `I_LSR`

### `ROL Rd`
- Canonical expansion: `ADC Rd, Rd`
- Decodes to: `I_ROL`

### `ROR Rd`
- Pattern: `1001 010d dddd 0111`
- Decodes to: `I_ROR`

### `ASR Rd`
- Pattern: `1001 010d dddd 0101`
- Decodes to: `I_ASR`

### `SWAP Rd`
- Pattern: `1001 010d dddd 0010`
- Decodes to: `I_SWAP`
- Flags: unchanged

### `ADIW Rd+1:Rd, K`
- Pattern: `1001 0110 KKdd KKKK`
- Decodes to: `I_ADIW`
- Rules:
  - allowed pairs: `R25:R24`, `R27:R26`, `R29:R28`, `R31:R30`
- Micro-op sequence:
  1. read 16-bit register pair
  2. add immediate
  3. paired writeback
  4. update flags per AVR word rules

## Group C: Bit Operations and Status Operations

### `BST Rd, b`
- Pattern: `1111 101d dddd 0bbb`
- Decodes to: `I_BST`
- Micro-op sequence:
  1. read bit `b` from `Rd`
  2. write `SREG.T`

### `BLD Rd, b`
- Pattern: `1111 100d dddd 0bbb`
- Decodes to: `I_BLD`
- Micro-op sequence:
  1. merge `SREG.T` into bit `b` of `Rd`
  2. write `Rd`
- Flags: unchanged except `T` already held

### `BSET s`
- Pattern: `1001 0100 0sss 1000`
- Decodes to: `I_BSET`
- Micro-op sequence:
  1. set `SREG[s]`

### `BCLR s`
- Pattern: `1001 0100 1sss 1000`
- Decodes to: `I_BCLR`
- Micro-op sequence:
  1. clear `SREG[s]`

### `SBI A, b`
- Pattern: `1001 1010 AAAA Abbb`
- Decodes to: `I_SBI`
- Rules:
  - I/O address in low I/O range only
- Micro-op sequence:
  1. read I/O byte
  2. set bit `b`
  3. write I/O byte back

### `CBI A, b`
- Pattern: `1001 1000 AAAA Abbb`
- Decodes to: `I_CBI`
- Micro-op sequence:
  1. read I/O byte
  2. clear bit `b`
  3. write I/O byte back

## Group D: Branch, Call, Return

### `RJMP k`
- Pattern: `1100 kkkk kkkk kkkk`
- Decodes to: `I_RJMP`
- Micro-op sequence:
  1. sign-extend `k`
  2. `PC <= PC_next + k`

### `JMP k`
- Pattern word0: `1001 010k kkkk 110k`
- Pattern word1: `kkkk kkkk kkkk kkkk`
- Decodes to: `I_JMP`
- Micro-op sequence:
  1. fetch word1
  2. assemble absolute address
  3. `PC <= k`

### `RCALL k`
- Pattern: `1101 kkkk kkkk kkkk`
- Decodes to: `I_RCALL`
- Micro-op sequence:
  1. compute return address = next instruction
  2. push return PC high/low bytes
  3. `PC <= PC_next + k`

### `CALL k`
- Pattern word0: `1001 010k kkkk 111k`
- Pattern word1: `kkkk kkkk kkkk kkkk`
- Decodes to: `I_CALL`
- Micro-op sequence:
  1. fetch word1
  2. compute return address
  3. push return PC high/low bytes
  4. `PC <= absolute target`

### `RET`
- Pattern: `1001 0101 0000 1000`
- Decodes to: `I_RET`
- Micro-op sequence:
  1. pop PC low/high bytes from stack
  2. load PC

### `RETI`
- Pattern: `1001 0101 0001 1000`
- Decodes to: `I_RETI`
- Micro-op sequence:
  1. pop PC low/high bytes
  2. load PC
  3. set `I` flag

### `BRBS s, k`
- Pattern: `1111 00kk kkkk ksss`
- Decodes to: `I_BRBS`
- Micro-op sequence:
  1. test `SREG[s]`
  2. if set, `PC <= PC_next + k`

### `BRBC s, k`
- Pattern: `1111 01kk kkkk ksss`
- Decodes to: `I_BRBC`
- Micro-op sequence:
  1. test `SREG[s]`
  2. if clear, `PC <= PC_next + k`

## Group E: Skip Instructions

Skip instructions are a major compatibility hazard. The core must explicitly determine whether the next instruction is 16-bit or 32-bit before skipping.

### `CPSE Rd, Rr`
- Pattern: `0001 00rd dddd rrrr`
- Decodes to: `I_CPSE`
- Micro-op sequence:
  1. compare register values
  2. if equal, enter skip resolution
  3. fetch/decode next instruction length
  4. advance PC by 1 extra word if next is 16-bit, 2 extra words if next is 32-bit
- Flags: unchanged

### `SBRC Rr, b`
- Pattern: `1111 110r rrrr 0bbb`
- Decodes to: `I_SBRC`
- Micro-op sequence:
  1. test bit `b` in register
  2. if clear, skip next instruction via skip resolver

### `SBRS Rr, b`
- Pattern: `1111 111r rrrr 0bbb`
- Decodes to: `I_SBRS`
- Micro-op sequence:
  1. test bit `b` in register
  2. if set, skip next instruction

### `SBIC A, b`
- Pattern: `1001 1001 AAAA Abbb`
- Decodes to: `I_SBIC`
- Micro-op sequence:
  1. read low-I/O byte
  2. test bit `b`
  3. if clear, skip next instruction

### `SBIS A, b`
- Pattern: `1001 1011 AAAA Abbb`
- Decodes to: `I_SBIS`
- Micro-op sequence:
  1. read low-I/O byte
  2. test bit `b`
  3. if set, skip next instruction

## Control FSM Mapping

This section maps normalized instruction classes onto recommended control-FSM states.

### Simple register-write instructions
Applies to:

- `MOV`
- `LDI`
- `COM`
- `NEG`
- `INC`
- `DEC`
- `SWAP`
- most register-register/immediate ALU ops

State flow:

1. `FETCH0`
2. `FETCH1`
3. `DECODE`
4. `EXEC_ALU`
5. `FETCH0`

### Data read instructions
Applies to:

- `IN`
- `LD*`
- `LDS`
- `POP`

State flow:

1. `FETCH0`
2. `FETCH1`
3. `DECODE`
4. `EXEC_DATA_READ`
5. `EXEC_WRITEBACK`
6. optional pointer/SP update state if needed
7. `FETCH0`

### Data write instructions
Applies to:

- `OUT`
- `ST*`
- `STS`
- `PUSH`

State flow:

1. `FETCH0`
2. `FETCH1`
3. `DECODE`
4. optional pre-update state for pre-decrement or stack adjustment
5. `EXEC_DATA_WRITE`
6. optional post-update state for post-increment
7. `FETCH0`

### Call/return instructions
Applies to:

- `RCALL`
- `CALL`
- `RET`
- `RETI`

State flow:

1. `FETCH0`
2. `FETCH1`
3. `DECODE`
4. repeated push/pop states for return address bytes
5. PC load state
6. `FETCH0`

### Skip instructions
State flow:

1. `FETCH0`
2. `FETCH1`
3. `DECODE`
4. skip condition evaluate
5. if not taken: `FETCH0`
6. if taken: `SKIP_RESOLVE_FETCH`
7. `SKIP_RESOLVE_DECODELEN`
8. update PC accordingly
9. `FETCH0`

Implementation note:

- skip resolution can be simplified if the control FSM directly requests the next word and classifies whether it is 32-bit using a reduced-length decoder

## Flag Update Rules by Class

### No-flag-write instructions
- `MOV`
- `MOVW`
- `LDI`
- `IN`
- `OUT`
- `LD*`
- `ST*`
- `PUSH`
- `POP`
- `RJMP`
- `JMP`
- `RCALL`
- `CALL`
- `RET`
- `SWAP`
- `SBI`
- `CBI`

### ALU-flag-write instructions
- `ADD`
- `ADC`
- `SUB`
- `SUBI`
- `SBC`
- `SBCI`
- `AND`
- `ANDI`
- `OR`
- `ORI`
- `EOR`
- `COM`
- `NEG`
- `INC`
- `DEC`
- `CP`
- `CPC`
- `CPI`
- `TST`
- `LSL`
- `LSR`
- `ROL`
- `ROR`
- `ASR`
- `ADIW`

### Direct `SREG` bit-write instructions
- `BSET`
- `BCLR`
- `BST`
- `RETI` for `I`
- interrupt entry for clearing `I`

## Illegal Instruction Policy
Decoder must output `decode_illegal = '1'` when:

- instruction encoding is not supported by the implemented subset
- 32-bit instruction word1 is required but not valid
- reserved combinations are encountered for supported families
- illegal register-pair constraints are violated:
  - odd `MOVW` pair
  - invalid `ADIW` destination pair

Recommended core behavior:

- enter `HALT_ILLEGAL` in simulation/debug builds
- optionally trap to a configurable illegal-instruction vector in future revisions

## Skip Resolver Requirements
The control FSM needs a reduced decoder function:

- input: next instruction word0
- output: `next_is_32bit`

This helper should recognize at least:

- `CALL`
- `JMP`
- `LDS`
- `STS`

It may ignore unsupported instructions as long as the skip length is still determined correctly.

## Required Decoder Helper Functions
Recommended pure functions in `avr_decoder.vhd` or `avr_pkg.vhd`:

- `is_32bit_instr(word0)`
- `decode_rd_5(word0)`
- `decode_rr_5(word0)`
- `decode_imm8_hi_lo(word0)`
- `decode_rel12(word0)`
- `decode_rel7(word0)`
- `decode_io_addr6(word0)`
- `decode_bit3(word0)`
- `decode_word_reg_pair(word0)`
- `decode_abs_addr(word0, word1)`
- `is_valid_movw_pair(idx)`
- `is_valid_adiw_pair(idx)`

## Minimal First RTL Subset
If implementation must be staged, this is the best first subset:

- `NOP`
- `MOV`
- `MOVW`
- `LDI`
- `IN`
- `OUT`
- `LDS`
- `STS`
- `LD X/Y/Z`
- `ST X/Y/Z`
- `PUSH`
- `POP`
- `ADD`
- `ADC`
- `SUB`
- `SBC`
- `AND`
- `OR`
- `EOR`
- `CP`
- `CPI`
- `RJMP`
- `RCALL`
- `RET`
- `BRBS`
- `BRBC`
- `CPSE`

This subset is enough to support meaningful assembly tests and the first simple AVR C programs.

## Verification Matrix
Every implemented instruction should have:

- one direct decoder test
- one execution-path simulation test
- one edge-case flag or address test if applicable

Priority edge cases:

- `CPSE` before 32-bit instruction
- `SBIC/SBIS` on synchronous I/O reads
- `RCALL/RET` stack ordering
- `RETI` restoring PC and `I`
- `ADIW` flag behavior
- pre-decrement and post-increment pointer semantics

## Recommended Next Artifact
The next document after this one should be:

- a cycle-by-cycle execution timing table per implemented instruction

That timing table will let the control FSM preserve AVR-visible behavior more consistently and make firmware compatibility debugging much easier.
