# AVR Control FSM State Table

## Purpose
This document defines the per-state behavior of `avr_control_fsm.vhd`.

It is the direct implementation reference for:

- state transitions
- output control signal defaults
- state-specific control assertions
- instruction-class dispatch rules

This document assumes the decoder and timing model defined in:

- [avr_decode_microop_spec.md](/Users/waleedmostafa/Documents/FPGA processor/docs/avr_decode_microop_spec.md)
- [avr_cycle_timing_spec.md](/Users/waleedmostafa/Documents/FPGA processor/docs/avr_cycle_timing_spec.md)

## Design Philosophy
The controller should:

- be purely sequential at the state level
- keep all combinational decision logic in one next-state/output process
- default all outputs inactive each cycle
- assert only the control signals required by the active state

The datapath should do the arithmetic and storage work. The FSM should only orchestrate.

## State Register Contract
Suggested implementation style:

- `state_reg`
- `state_next`

Optional latched helpers:

- `skip_taken_reg`
- `skip_next_is_32_reg`
- `tmp_data_reg`
- `tmp_addr_reg`
- `tmp_ret_lo_reg`
- `tmp_ret_hi_reg`

These temporary registers may live outside the FSM if the datapath owns them. The key point is that the FSM may need intermediate storage for return-address bytes and read data.

## Recommended FSM Inputs

### Core control inputs
- `clk`
- `reset`
- `instr_kind`
- `decode_illegal`
- `is_32bit`

### Decoder operand/control qualifiers
- `ptr_mode`
- `ptr_sel`
- `skip_kind`
- `branch_cond`
- `bit_index`

### Datapath status inputs
- `sreg_q`
- `rd_eq_rr`
- `reg_bit_value`
- `io_bit_value`
- `pmem_valid`
- `d_valid`
- `irq_pending`
- `irq_vector_addr`

### Reduced skip helper input
- `next_instr_is_32bit`

This may come from:

- a reduced-length combinational classifier over fetched skipped word0, or
- a second invocation of a lightweight decoder helper

## Recommended FSM Outputs

### Program memory controls
- `pmem_req`
- `ir0_we`
- `ir1_we`
- `pc_hold`
- `pc_inc1`
- `pc_inc2`
- `pc_load_abs`
- `pc_load_rel`
- `pc_load_irq_vector`

### Register file controls
- `rf_we`
- `rf_wpair_we`
- `rf_wsel`

Suggested `rf_wsel` sources:

- `RF_W_ALU`
- `RF_W_MEM`
- `RF_W_IMM`
- `RF_W_BIT_BLEND`
- `RF_W_POP`

### ALU controls
- `alu_op`
- `alu_rhs_sel`
- `alu_exec`

Suggested `alu_rhs_sel`:

- `ALU_RHS_REG`
- `ALU_RHS_IMM`
- `ALU_RHS_ONE`
- `ALU_RHS_ZERO`

### Status register controls
- `sreg_we`
- `sreg_src_alu`
- `sreg_bit_set_we`
- `sreg_bit_clr_we`
- `sreg_t_load`
- `sreg_i_set`
- `sreg_i_clr`

### Pointer and stack controls
- `ptr_predec_we`
- `ptr_postinc_we`
- `ptr_sel_out`
- `sp_dec`
- `sp_inc`
- `sp_write_data_sel`

### Data-space controls
- `d_re`
- `d_we`
- `d_addr_sel`
- `d_wdata_sel`
- `data_latch_we`

Suggested `d_addr_sel`:

- `DA_NONE`
- `DA_IO`
- `DA_ABS16`
- `DA_PTR`
- `DA_SP`

Suggested `d_wdata_sel`:

- `DW_NONE`
- `DW_RF`
- `DW_RET_HI`
- `DW_RET_LO`
- `DW_BITMOD`

### Flow/exception controls
- `skip_eval_en`
- `skip_len_capture`
- `irq_ack`
- `illegal_halt_set`

## Output Defaults
Every cycle, unless overridden by the active state:

- `pmem_req = 0`
- `ir0_we = 0`
- `ir1_we = 0`
- `pc_hold = 1`
- `pc_inc1 = 0`
- `pc_inc2 = 0`
- `pc_load_abs = 0`
- `pc_load_rel = 0`
- `pc_load_irq_vector = 0`
- `rf_we = 0`
- `rf_wpair_we = 0`
- `alu_exec = 0`
- `sreg_we = 0`
- `sreg_bit_set_we = 0`
- `sreg_bit_clr_we = 0`
- `sreg_t_load = 0`
- `sreg_i_set = 0`
- `sreg_i_clr = 0`
- `ptr_predec_we = 0`
- `ptr_postinc_we = 0`
- `sp_dec = 0`
- `sp_inc = 0`
- `d_re = 0`
- `d_we = 0`
- `data_latch_we = 0`
- `skip_eval_en = 0`
- `skip_len_capture = 0`
- `irq_ack = 0`
- `illegal_halt_set = 0`

## State Table

## `CORE_S_RESET`
Purpose:

- initialize control flow after reset

Asserted outputs:

- `pc_hold = 1`

Transition:

- unconditional -> `CORE_S_FETCH0`

Notes:

- datapath reset should clear `PC`, `SREG`, `SP`, and temporary latches externally

## `CORE_S_FETCH0`
Purpose:

- request instruction word0 from program memory

Asserted outputs:

- `pmem_req = 1`
- `pc_hold = 1`

Transition:

- if `pmem_valid = 1` -> `CORE_S_FETCH1`
- else stay in `CORE_S_FETCH0`

Notes:

- if BRAM interface is fixed-latency and `pmem_valid` is implicit, this state can always transition after one cycle

## `CORE_S_FETCH1`
Purpose:

- latch fetched word0
- decide whether a second fetch is required

Asserted outputs:

- `ir0_we = 1`

Transition:

- if `is_32bit = 1` based on word0 classification -> `CORE_S_FETCH2_32`
- else -> `CORE_S_DECODE`

PC action:

- do not commit final PC update here if you want one unified PC policy
- alternatively:
  - for 16-bit instructions assert `pc_inc1 = 1`
  - for 32-bit instructions defer to `CORE_S_FETCH2_32`

Recommended approach:

- commit `pc_inc1` here only for 16-bit instructions

## `CORE_S_FETCH2_32`
Purpose:

- fetch and latch word1 for 32-bit instructions

Asserted outputs:

- `pmem_req = 1`
- `ir1_we = 1` when returning data
- `pc_inc2 = 1`

Transition:

- if `pmem_valid = 1` -> `CORE_S_DECODE`
- else stay in `CORE_S_FETCH2_32`

Address rule:

- request address is `PC + 1` from the original fetched instruction

## `CORE_S_DECODE`
Purpose:

- final instruction dispatch

Asserted outputs:

- none by default

Transition priority:

1. if `decode_illegal = 1` -> `CORE_S_HALT_ILLEGAL`
2. else if `irq_pending = 1` and current instruction window is empty
   - do not take interrupt here for the current instruction
   - interrupts should be sampled only when entering a new fetch after instruction completion
3. dispatch by `instr_kind`

Dispatch groups:

- `I_NOP` -> `CORE_S_COMPLETE`
- simple ALU/writeback -> `CORE_S_EXEC_ALU`
- `I_ADIW` -> `CORE_S_EXEC_ALU16`
- `I_IN`, `I_LD_*`, `I_LDS`, `I_POP`, `I_SBIC`, `I_SBIS` -> `CORE_S_EXEC_READ_REQ`
- `I_OUT`, `I_ST_*`, `I_STS`, `I_PUSH`, `I_SBI`, `I_CBI` -> `CORE_S_EXEC_WRITE_PREP`
- `I_RJMP`, `I_JMP`, `I_BRBS`, `I_BRBC` -> `CORE_S_EXEC_BRANCH`
- `I_RCALL`, `I_CALL` -> `CORE_S_EXEC_CALL_PREP`
- `I_RET`, `I_RETI` -> `CORE_S_EXEC_RET_POP0`
- `I_CPSE`, `I_SBRC`, `I_SBRS` -> `CORE_S_EXEC_SKIP_EVAL`
- `I_BSET`, `I_BCLR`, `I_BST`, `I_BLD` -> `CORE_S_EXEC_BIT`

## `CORE_S_EXEC_ALU`
Purpose:

- execute 8-bit ALU and compare class instructions

Applies to:

- `MOV`
- `LDI`
- `ADD`
- `ADC`
- `SUB`
- `SBC`
- `SUBI`
- `SBCI`
- `AND`
- `ANDI`
- `OR`
- `ORI`
- `EOR`
- `CP`
- `CPC`
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
- `MOVW` if implemented as same-state pair write

Asserted outputs:

- `alu_exec = 1`

Additional outputs by subclass:

- writeback instructions:
  - `rf_we = 1`
  - `rf_wsel = RF_W_ALU`
- paired write:
  - `rf_wpair_we = 1`
- flag-writing instructions:
  - `sreg_we = 1`
  - `sreg_src_alu = 1`

Transition:

- `MOVW` with paired write -> `CORE_S_COMPLETE`
- `ADIW` should not use this state
- otherwise -> `CORE_S_COMPLETE`

## `CORE_S_EXEC_ALU16`
Purpose:

- execute word-sized ALU operation for `ADIW`

Asserted outputs:

- `alu_exec = 1`

Transition:

- -> `CORE_S_EXEC_ALU16_WB`

## `CORE_S_EXEC_ALU16_WB`
Purpose:

- commit 16-bit result and flags

Asserted outputs:

- `rf_wpair_we = 1`
- `rf_wsel = RF_W_ALU`
- `sreg_we = 1`
- `sreg_src_alu = 1`

Transition:

- -> `CORE_S_COMPLETE`

## `CORE_S_EXEC_BIT`
Purpose:

- handle direct `SREG` bit operations and `BLD/BST`

Subcases:

- `I_BSET`
  - `sreg_bit_set_we = 1`
- `I_BCLR`
  - `sreg_bit_clr_we = 1`
- `I_BST`
  - `sreg_t_load = 1`
- `I_BLD`
  - `rf_we = 1`
  - `rf_wsel = RF_W_BIT_BLEND`

Transition:

- -> `CORE_S_COMPLETE`

## `CORE_S_EXEC_READ_REQ`
Purpose:

- issue synchronous data/I/O read request

Applies to:

- `IN`
- `LD*`
- `LDS`
- `POP`
- `SBIC`
- `SBIS`

Asserted outputs:

- `d_re = 1`

Address-select outputs by subclass:

- `IN`, `SBIC`, `SBIS`
  - `d_addr_sel = DA_IO`
- `LDS`
  - `d_addr_sel = DA_ABS16`
- `LD*`
  - `d_addr_sel = DA_PTR`
- `POP`
  - `d_addr_sel = DA_SP`

Pointer/stack pre-actions:

- pre-decrement loads:
  - `ptr_predec_we = 1`
- `POP`
  - no `sp_inc` yet

Transition:

- if `d_valid = 1` -> `CORE_S_EXEC_READ_CAP`
- else stay in `CORE_S_EXEC_READ_REQ`

## `CORE_S_EXEC_READ_CAP`
Purpose:

- capture returned read data

Asserted outputs:

- `data_latch_we = 1`

Transition by instruction:

- `SBIC`, `SBIS` -> `CORE_S_EXEC_SKIP_EVAL`
- otherwise -> `CORE_S_EXEC_WRITEBACK`

## `CORE_S_EXEC_WRITEBACK`
Purpose:

- write read data into destination register

Applies to:

- `IN`
- `LD*`
- `LDS`
- `POP`

Asserted outputs:

- `rf_we = 1`
- `rf_wsel = RF_W_MEM`

Post-actions by subclass:

- post-increment loads:
  - transition next to `CORE_S_EXEC_PTR_POST`
- `POP`
  - transition next to `CORE_S_EXEC_SP_INC`
- plain `IN`, `LDS`, `LD direct`
  - transition to `CORE_S_COMPLETE`

Transition:

- if `LD*_POSTINC` -> `CORE_S_EXEC_PTR_POST`
- else if `POP` -> `CORE_S_EXEC_SP_INC`
- else -> `CORE_S_COMPLETE`

## `CORE_S_EXEC_WRITE_PREP`
Purpose:

- prepare write-type instruction address/data side effects before asserting write

Applies to:

- `OUT`
- `ST*`
- `STS`
- `PUSH`
- `SBI`
- `CBI`

Outputs by subclass:

- `PUSH`
  - `sp_dec = 1`
  - then -> `CORE_S_EXEC_WRITE`
- pre-decrement stores:
  - `ptr_predec_we = 1`
  - then -> `CORE_S_EXEC_WRITE`
- `SBI`, `CBI`
  - -> `CORE_S_EXEC_RMW_READ_REQ`
- all other write instructions
  - -> `CORE_S_EXEC_WRITE`

Transition:

- see subclass rules above

## `CORE_S_EXEC_WRITE`
Purpose:

- perform data/I/O write

Asserted outputs:

- `d_we = 1`

Address select by subclass:

- `OUT`
  - `d_addr_sel = DA_IO`
- `STS`
  - `d_addr_sel = DA_ABS16`
- `ST*`
  - `d_addr_sel = DA_PTR`
- `PUSH`
  - `d_addr_sel = DA_SP`
- `SBI`, `CBI`
  - `d_addr_sel = DA_IO`

Write-data select:

- normal register store:
  - `d_wdata_sel = DW_RF`
- `PUSH` return or interrupt push states use special selectors elsewhere
- `SBI`, `CBI`
  - `d_wdata_sel = DW_BITMOD`

Transition:

- if post-increment store -> `CORE_S_EXEC_PTR_POST`
- else -> `CORE_S_COMPLETE`

## `CORE_S_EXEC_PTR_POST`
Purpose:

- apply post-increment to X/Y/Z after successful load/store

Asserted outputs:

- `ptr_postinc_we = 1`

Transition:

- -> `CORE_S_COMPLETE`

## `CORE_S_EXEC_SP_INC`
Purpose:

- increment stack pointer after `POP`

Asserted outputs:

- `sp_inc = 1`

Transition:

- -> `CORE_S_COMPLETE`

## `CORE_S_EXEC_RMW_READ_REQ`
Purpose:

- start read-modify-write for `SBI` and `CBI`

Asserted outputs:

- `d_re = 1`
- `d_addr_sel = DA_IO`

Transition:

- if `d_valid = 1` -> `CORE_S_EXEC_RMW_MODIFY`
- else stay

## `CORE_S_EXEC_RMW_MODIFY`
Purpose:

- capture I/O value and compute set/clear-bit result

Asserted outputs:

- `data_latch_we = 1`

Transition:

- -> `CORE_S_EXEC_WRITE`

## `CORE_S_EXEC_BRANCH`
Purpose:

- handle `RJMP`, `JMP`, `BRBS`, and `BRBC`

Outputs by subclass:

- `I_RJMP`
  - `pc_load_rel = 1`
- `I_JMP`
  - `pc_load_abs = 1`
- `I_BRBS`
  - if tested SREG bit is set: `pc_load_rel = 1`
- `I_BRBC`
  - if tested SREG bit is clear: `pc_load_rel = 1`

Transition:

- -> `CORE_S_COMPLETE`

## `CORE_S_EXEC_CALL_PREP`
Purpose:

- compute target and return address for `RCALL`/`CALL`

Asserted outputs:

- none mandatory if datapath already has return address available from `PC`

Transition:

- -> `CORE_S_EXEC_CALL_PUSH_H_DEC`

## `CORE_S_EXEC_CALL_PUSH_H_DEC`
Purpose:

- decrement SP for first pushed byte

Asserted outputs:

- `sp_dec = 1`

Transition:

- -> `CORE_S_EXEC_CALL_PUSH_H_WR`

## `CORE_S_EXEC_CALL_PUSH_H_WR`
Purpose:

- push return-address high byte

Asserted outputs:

- `d_we = 1`
- `d_addr_sel = DA_SP`
- `d_wdata_sel = DW_RET_HI`

Transition:

- -> `CORE_S_EXEC_CALL_PUSH_L_DEC`

## `CORE_S_EXEC_CALL_PUSH_L_DEC`
Purpose:

- decrement SP for second pushed byte

Asserted outputs:

- `sp_dec = 1`

Transition:

- -> `CORE_S_EXEC_CALL_PUSH_L_WR`

## `CORE_S_EXEC_CALL_PUSH_L_WR`
Purpose:

- push return-address low byte

Asserted outputs:

- `d_we = 1`
- `d_addr_sel = DA_SP`
- `d_wdata_sel = DW_RET_LO`

Transition:

- -> `CORE_S_EXEC_CALL_PC_LOAD`

## `CORE_S_EXEC_CALL_PC_LOAD`
Purpose:

- load call target into PC

Outputs by subclass:

- `RCALL`
  - `pc_load_rel = 1`
- `CALL`
  - `pc_load_abs = 1`

Transition:

- -> `CORE_S_COMPLETE`

## `CORE_S_EXEC_RET_POP0`
Purpose:

- request first stack byte for `RET/RETI`

Asserted outputs:

- `d_re = 1`
- `d_addr_sel = DA_SP`

Transition:

- if `d_valid = 1` -> `CORE_S_EXEC_RET_POP0_CAP`
- else stay

## `CORE_S_EXEC_RET_POP0_CAP`
Purpose:

- capture first popped byte and increment SP

Asserted outputs:

- `data_latch_we = 1`
- `sp_inc = 1`

Transition:

- -> `CORE_S_EXEC_RET_POP1`

## `CORE_S_EXEC_RET_POP1`
Purpose:

- request second stack byte

Asserted outputs:

- `d_re = 1`
- `d_addr_sel = DA_SP`

Transition:

- if `d_valid = 1` -> `CORE_S_EXEC_RET_POP1_CAP`
- else stay

## `CORE_S_EXEC_RET_POP1_CAP`
Purpose:

- capture second popped byte and increment SP

Asserted outputs:

- `data_latch_we = 1`
- `sp_inc = 1`

Transition:

- -> `CORE_S_EXEC_RET_PC_LOAD`

## `CORE_S_EXEC_RET_PC_LOAD`
Purpose:

- rebuild and load return PC

Asserted outputs:

- `pc_load_abs = 1`

Additional output:

- if `instr_kind = I_RETI`
  - `sreg_i_set = 1`

Transition:

- -> `CORE_S_COMPLETE`

## `CORE_S_EXEC_SKIP_EVAL`
Purpose:

- evaluate skip condition

Applies to:

- `CPSE`
- `SBRC`
- `SBRS`
- `SBIC`
- `SBIS`

Outputs:

- `skip_eval_en = 1`

Condition rules:

- `CPSE`: skip if `rd_eq_rr = 1`
- `SBRC`: skip if tested register bit = 0
- `SBRS`: skip if tested register bit = 1
- `SBIC`: skip if tested I/O bit = 0
- `SBIS`: skip if tested I/O bit = 1

Transition:

- if skip not taken -> `CORE_S_COMPLETE`
- if skip taken -> `CORE_S_SKIP_FETCH`

## `CORE_S_SKIP_FETCH`
Purpose:

- fetch word0 of skipped instruction to determine instruction length

Asserted outputs:

- `pmem_req = 1`

Transition:

- if `pmem_valid = 1` -> `CORE_S_SKIP_CLASSIFY`
- else stay

## `CORE_S_SKIP_CLASSIFY`
Purpose:

- classify skipped instruction length and adjust PC

Asserted outputs:

- `skip_len_capture = 1`

PC action:

- if `next_instr_is_32bit = 1`
  - `pc_inc2 = 1`
- else
  - `pc_inc1 = 1`

Transition:

- -> `CORE_S_COMPLETE`

## `CORE_S_IRQ_ENTRY_0`
Purpose:

- accept pending interrupt and clear global I

Asserted outputs:

- `irq_ack = 1`
- `sreg_i_clr = 1`

Transition:

- -> `CORE_S_IRQ_ENTRY_1`

## `CORE_S_IRQ_ENTRY_1`
Purpose:

- decrement SP for return-address high byte push

Asserted outputs:

- `sp_dec = 1`

Transition:

- -> `CORE_S_IRQ_ENTRY_2`

## `CORE_S_IRQ_ENTRY_2`
Purpose:

- push PC high byte

Asserted outputs:

- `d_we = 1`
- `d_addr_sel = DA_SP`
- `d_wdata_sel = DW_RET_HI`

Transition:

- -> `CORE_S_IRQ_ENTRY_3`

## `CORE_S_IRQ_ENTRY_3`
Purpose:

- decrement SP for low byte push

Asserted outputs:

- `sp_dec = 1`

Transition:

- -> `CORE_S_IRQ_ENTRY_4`

## `CORE_S_IRQ_ENTRY_4`
Purpose:

- push PC low byte

Asserted outputs:

- `d_we = 1`
- `d_addr_sel = DA_SP`
- `d_wdata_sel = DW_RET_LO`

Transition:

- -> `CORE_S_IRQ_ENTRY_5`

## `CORE_S_IRQ_ENTRY_5`
Purpose:

- load interrupt vector into PC

Asserted outputs:

- `pc_load_irq_vector = 1`

Transition:

- -> `CORE_S_FETCH0`

## `CORE_S_HALT_ILLEGAL`
Purpose:

- terminal debug state for unsupported or malformed instruction

Asserted outputs:

- `illegal_halt_set = 1`

Transition:

- stay in `CORE_S_HALT_ILLEGAL`

## `CORE_S_COMPLETE`
Purpose:

- single exit point after successful instruction completion

Asserted outputs:

- none required

Transition priority:

1. if `irq_pending = 1` and `SREG.I = 1` -> `CORE_S_IRQ_ENTRY_0`
2. else -> `CORE_S_FETCH0`

Reason:

- interrupts are sampled only between completed instructions

## Dispatch Table by Instruction Kind

### `CORE_S_EXEC_ALU`
- `I_MOV`
- `I_MOVW`
- `I_LDI`
- `I_ADD`
- `I_ADC`
- `I_SUB`
- `I_SUBI`
- `I_SBC`
- `I_SBCI`
- `I_AND`
- `I_ANDI`
- `I_OR`
- `I_ORI`
- `I_EOR`
- `I_CP`
- `I_CPC`
- `I_CPI`
- `I_COM`
- `I_NEG`
- `I_INC`
- `I_DEC`
- `I_TST`
- `I_LSL`
- `I_LSR`
- `I_ROL`
- `I_ROR`
- `I_ASR`

### `CORE_S_EXEC_ALU16`
- `I_ADIW`

### `CORE_S_EXEC_BIT`
- `I_BSET`
- `I_BCLR`
- `I_BST`
- `I_BLD`

### `CORE_S_EXEC_READ_REQ`
- `I_IN`
- `I_LDS`
- `I_LD_X`
- `I_LD_X_POSTINC`
- `I_LD_X_PREDEC`
- `I_LD_Y`
- `I_LD_Y_POSTINC`
- `I_LD_Y_PREDEC`
- `I_LD_Z`
- `I_LD_Z_POSTINC`
- `I_LD_Z_PREDEC`
- `I_POP`
- `I_SBIC`
- `I_SBIS`

### `CORE_S_EXEC_WRITE_PREP`
- `I_OUT`
- `I_STS`
- `I_ST_X`
- `I_ST_X_POSTINC`
- `I_ST_X_PREDEC`
- `I_ST_Y`
- `I_ST_Y_POSTINC`
- `I_ST_Y_PREDEC`
- `I_ST_Z`
- `I_ST_Z_POSTINC`
- `I_ST_Z_PREDEC`
- `I_PUSH`
- `I_SBI`
- `I_CBI`

### `CORE_S_EXEC_BRANCH`
- `I_RJMP`
- `I_JMP`
- `I_BRBS`
- `I_BRBC`

### `CORE_S_EXEC_CALL_PREP`
- `I_RCALL`
- `I_CALL`

### `CORE_S_EXEC_RET_POP0`
- `I_RET`
- `I_RETI`

### `CORE_S_EXEC_SKIP_EVAL`
- `I_CPSE`
- `I_SBRC`
- `I_SBRS`
- `I_SBIC`
- `I_SBIS`

## Suggested VHDL Coding Shape

### Process 1: state register
- synchronous
- reset to `CORE_S_RESET`

### Process 2: next-state and outputs
- combinational
- set defaults first
- case on `state_reg`
- subcase on `instr_kind` where needed

### Process 3: optional helper latches
- synchronous
- capture skip classification, read data staging, or return-byte staging if not handled elsewhere

## Recommended First RTL Simplifications

1. Keep `CORE_S_COMPLETE` as a real state.
Reason:
- it gives one consistent place for interrupt sampling.

2. Keep read request and read capture separate even if memory is single-cycle.
Reason:
- easier timing closure and easier future external memory support.

3. Keep `SBI/CBI` as explicit read-modify-write states.
Reason:
- preserves correctness for peripheral registers.

4. Do not merge skip resolution into ordinary fetch states initially.
Reason:
- skip bugs are expensive and subtle.

## Recommended Next Step
The most useful artifact after this one is:

- a concrete signal-level interface spec for `avr_core`, `avr_control_fsm`, and the datapath-side control bus

That will let the first VHDL skeletons be written with stable entity ports and enums.
