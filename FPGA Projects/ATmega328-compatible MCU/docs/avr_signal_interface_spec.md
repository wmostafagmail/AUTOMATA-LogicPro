# AVR Core Signal-Level Interface Specification

## Purpose
This document defines the signal-level interface contract for:

- `avr_core.vhd`
- `avr_control_fsm.vhd`
- the datapath-side control/status bus between the controller and core datapath blocks

It is intended to freeze entity ports and internal control-bus structure before RTL skeleton implementation begins.

## Design Goals

- keep the top-level CPU entity readable
- isolate control logic from datapath implementation details
- use typed enums for selectors wherever practical
- avoid excessive single-bit control sprawl at `avr_core` boundaries
- make the first RTL version easy to simulate and debug

## Recommended File Ownership

- `avr_pkg.vhd`
  - owns shared types, enums, subtypes, and record definitions
- `avr_control_fsm.vhd`
  - owns control-state transitions and drives a typed control-bus record
- `avr_core.vhd`
  - owns instruction/data temporary registers, ALU/regfile/PC/SP/SREG integration, and bridges between controller and datapath

## Interface Philosophy

Use three layers of interfaces:

1. external SoC-facing interfaces
   - program memory
   - data-space
   - IRQ lines
   - debug outputs
2. controller-facing decoded/status interfaces
   - decoder outputs
   - datapath status bundle
3. internal control bus
   - one typed record from controller to datapath/core machinery

This prevents the top-level core entity from becoming a flat list of dozens of wires.

## Shared Types To Add In `avr_pkg.vhd`

## Fundamental subtypes
- `subtype byte_t is std_logic_vector(7 downto 0);`
- `subtype word_t is std_logic_vector(15 downto 0);`
- `subtype addr16_t is std_logic_vector(15 downto 0);`
- `subtype reg_idx5_t is std_logic_vector(4 downto 0);`
- `subtype bit_idx3_t is std_logic_vector(2 downto 0);`
- `subtype io_addr6_t is std_logic_vector(5 downto 0);`
- `subtype sreg_t is std_logic_vector(7 downto 0);`

## Instruction/decode enums
- `type avr_instr_t is (...)`
- `type ptr_sel_t is (PTR_NONE, PTR_X, PTR_Y, PTR_Z);`
- `type ptr_mode_t is (PTR_MODE_NONE, PTR_MODE_DIRECT, PTR_MODE_POSTINC, PTR_MODE_PREDEC);`
- `type branch_cond_t is (BC_NONE, BC_ALWAYS, BC_SREG_BIT_SET, BC_SREG_BIT_CLEAR);`
- `type skip_kind_t is (SKIP_NONE, SKIP_IF_REG_EQ, SKIP_IF_BIT_CLR_REG, SKIP_IF_BIT_SET_REG, SKIP_IF_BIT_CLR_IO, SKIP_IF_BIT_SET_IO);`

## Control selector enums
- `type rf_wsel_t is (RF_W_NONE, RF_W_ALU, RF_W_MEM, RF_W_IMM, RF_W_BIT_BLEND, RF_W_POP);`
- `type alu_rhs_sel_t is (ALU_RHS_REG, ALU_RHS_IMM8, ALU_RHS_ONE, ALU_RHS_ZERO, ALU_RHS_CARRY);`
- `type d_addr_sel_t is (DA_NONE, DA_IO, DA_ABS16, DA_PTR, DA_SP);`
- `type d_wdata_sel_t is (DW_NONE, DW_RF, DW_RET_HI, DW_RET_LO, DW_BITMOD);`
- `type pc_op_t is (PC_HOLD, PC_INC1, PC_INC2, PC_LOAD_ABS, PC_LOAD_REL, PC_LOAD_IRQ);`
- `type sp_op_t is (SP_HOLD, SP_DEC, SP_INC, SP_WRITE);`

## ALU enum
- `type alu_op_t is (...)`

Recommended minimum operations:

- `ALU_NOP`
- `ALU_PASS_RR`
- `ALU_PASS_IMM`
- `ALU_ADD`
- `ALU_ADC`
- `ALU_SUB`
- `ALU_SBC`
- `ALU_AND`
- `ALU_OR`
- `ALU_EOR`
- `ALU_COM`
- `ALU_NEG`
- `ALU_INC`
- `ALU_DEC`
- `ALU_LSL`
- `ALU_LSR`
- `ALU_ROL`
- `ALU_ROR`
- `ALU_ASR`
- `ALU_SWAP`
- `ALU_BIT_BLEND`
- `ALU_ADIW`

## FSM enum
- `type core_state_t is (...)`

Use the states already defined in the state-table document.

## Record Definitions

## 1. Decoder output record
Recommended record:

```vhdl
type avr_decode_t is record
  instr_kind      : avr_instr_t;
  is_32bit        : std_logic;
  decode_illegal  : std_logic;
  rd_idx          : reg_idx5_t;
  rr_idx          : reg_idx5_t;
  imm8            : byte_t;
  imm16           : addr16_t;
  io_addr         : io_addr6_t;
  bit_index       : bit_idx3_t;
  ptr_sel         : ptr_sel_t;
  ptr_mode        : ptr_mode_t;
  branch_cond     : branch_cond_t;
  skip_kind       : skip_kind_t;
end record;
```

Rationale:

- decoder-to-controller interface becomes one typed signal
- easier to expand without port churn

## 2. Datapath status record
Recommended record:

```vhdl
type avr_status_t is record
  sreg_q              : sreg_t;
  rd_eq_rr            : std_logic;
  reg_bit_value       : std_logic;
  io_bit_value        : std_logic;
  pmem_valid          : std_logic;
  d_valid             : std_logic;
  irq_pending         : std_logic;
  next_instr_is_32bit : std_logic;
end record;
```

Optional later additions:

- `alu_zero`
- `alu_carry`
- `halted`
- `data_latch_valid`

## 3. Control bus record
Recommended record:

```vhdl
type avr_ctrl_t is record
  pmem_req         : std_logic;
  ir0_we           : std_logic;
  ir1_we           : std_logic;

  pc_op            : pc_op_t;
  sp_op            : sp_op_t;

  rf_we            : std_logic;
  rf_wpair_we      : std_logic;
  rf_wsel          : rf_wsel_t;

  alu_exec         : std_logic;
  alu_op           : alu_op_t;
  alu_rhs_sel      : alu_rhs_sel_t;

  sreg_we          : std_logic;
  sreg_src_alu     : std_logic;
  sreg_bit_set_we  : std_logic;
  sreg_bit_clr_we  : std_logic;
  sreg_t_load      : std_logic;
  sreg_i_set       : std_logic;
  sreg_i_clr       : std_logic;

  ptr_predec_we    : std_logic;
  ptr_postinc_we   : std_logic;
  ptr_sel_out      : ptr_sel_t;

  d_re             : std_logic;
  d_we             : std_logic;
  d_addr_sel       : d_addr_sel_t;
  d_wdata_sel      : d_wdata_sel_t;
  data_latch_we    : std_logic;

  skip_eval_en     : std_logic;
  skip_len_capture : std_logic;
  irq_ack          : std_logic;
  illegal_halt_set : std_logic;
end record;
```

Rationale:

- `pc_op` and `sp_op` compress several mutually exclusive bits
- typed record keeps controller/datapath connection manageable

## 4. Debug record
Recommended optional record:

```vhdl
type avr_debug_t is record
  pc_q        : addr16_t;
  sp_q        : addr16_t;
  ir0_q       : word_t;
  ir1_q       : word_t;
  state_q     : core_state_t;
  instr_kind  : avr_instr_t;
  sreg_q      : sreg_t;
end record;
```

This is optional for synthesis but very helpful in simulation.

## Entity Specification: `avr_control_fsm.vhd`

## Purpose
- consume normalized decode/status information
- emit next-state and control-bus outputs

## Recommended entity

```vhdl
entity avr_control_fsm is
  port (
    clk          : in  std_logic;
    reset        : in  std_logic;
    dec_i        : in  avr_decode_t;
    sts_i        : in  avr_status_t;
    irq_vector_i : in  addr16_t;
    state_o      : out core_state_t;
    ctrl_o       : out avr_ctrl_t
  );
end entity;
```

## Port notes

- `dec_i`
  - full normalized decoder record
- `sts_i`
  - datapath and handshake status bundle
- `irq_vector_i`
  - selected vector from `avr_irq_ctrl`
- `state_o`
  - debug visibility
- `ctrl_o`
  - complete control record to core/datapath

## Optional refinement
If you want cleaner separation, `irq_pending` can remain inside `sts_i` and `irq_vector_i` can be grouped into a separate IRQ-status record. For the first version, a flat `irq_vector_i` is fine.

## Entity Specification: `avr_core.vhd`

## Purpose
- integrate controller, decoder, datapath storage, regfile, ALU, SREG, PC/SP logic, and IRQ controller

## Recommended entity

```vhdl
entity avr_core is
  port (
    clk           : in  std_logic;
    reset         : in  std_logic;

    pmem_addr_o   : out addr16_t;
    pmem_req_o    : out std_logic;
    pmem_rdata_i  : in  word_t;
    pmem_valid_i  : in  std_logic;

    d_addr_o      : out addr16_t;
    d_wdata_o     : out byte_t;
    d_rdata_i     : in  byte_t;
    d_we_o        : out std_logic;
    d_re_o        : out std_logic;
    d_valid_i     : in  std_logic;

    irq_lines_i   : in  std_logic_vector(IRQ_COUNT-1 downto 0);

    dbg_o         : out avr_debug_t
  );
end entity;
```

## Port notes

- `pmem_*`
  - pure instruction-side interface
- `d_*`
  - unified AVR data-space access interface
- `irq_lines_i`
  - raw interrupt request lines from peripherals
- `dbg_o`
  - simulation/debug visibility

## Internal submodule connections inside `avr_core`

`avr_core` should instantiate:

- `avr_decoder`
- `avr_control_fsm`
- `avr_regfile`
- `avr_alu`
- `avr_sreg`
- `avr_pc_stack`
- `avr_irq_ctrl`

Recommended key internal signals:

- `dec_s      : avr_decode_t`
- `ctrl_s     : avr_ctrl_t`
- `sts_s      : avr_status_t`
- `dbg_s      : avr_debug_t`
- `irq_vector_s : addr16_t`

## Entity Specification: `avr_decoder.vhd`

## Purpose
- decode `ir0/ir1` into `avr_decode_t`

## Recommended entity

```vhdl
entity avr_decoder is
  port (
    instr_word0_i      : in  word_t;
    instr_word1_i      : in  word_t;
    instr_word1_valid_i: in  std_logic;
    dec_o              : out avr_decode_t
  );
end entity;
```

## Entity Specification: `avr_irq_ctrl.vhd`

## Purpose
- select highest-priority pending interrupt and return vector

## Recommended entity

```vhdl
entity avr_irq_ctrl is
  port (
    irq_lines_i    : in  std_logic_vector(IRQ_COUNT-1 downto 0);
    irq_ack_i      : in  std_logic;
    global_i_en_i  : in  std_logic;
    irq_pending_o  : out std_logic;
    irq_vector_o   : out addr16_t
  );
end entity;
```

## Optional future refinement
- include per-source mask and clear behavior here only if you later decide to move more policy out of peripherals

## Datapath-Side Interface Inside `avr_core`

The controller should not directly connect to many submodules. `avr_core` should translate `ctrl_s` into datapath actions.

Recommended datapath-local signals:

- `ir0_q`, `ir1_q`
- `pc_q`, `sp_q`
- `rf_ra_data`, `rf_rb_data`, `rf_rc_data`
- `alu_result_lo`, `alu_result_hi`
- `alu_flags_next`
- `data_latch_q`
- `skip_word0_q`
- `ret_lo_q`, `ret_hi_q`

## Recommended ownership split

### `avr_control_fsm`
Owns:

- control flow state
- sequencing
- instruction dispatch
- handshakes and control selects

Does not own:

- `PC`, `SP`, `IR`, temporary data registers
- ALU result storage
- actual read-data latches

### `avr_core`
Owns:

- instruction registers
- read-data latch
- pointer registers via regfile aliases
- stack pointer storage
- program counter storage
- return-address staging if needed
- output multiplexing toward program/data memory

## Program Memory Signal Contract

## `pmem_addr_o`
- source: `pc_q` or `pc_q + 1` during 32-bit fetch or skip-length classification
- width: 16 bits
- units: word address

## `pmem_req_o`
- asserted by `ctrl_s.pmem_req`

## `pmem_rdata_i`
- fetched 16-bit instruction word

## `pmem_valid_i`
- instruction fetch acknowledge

Implementation note:

- if BRAM is fixed-latency and always valid one cycle later, still keep `pmem_valid_i` in the interface so the design can evolve

## Data-Space Signal Contract

## `d_addr_o`
Selected from:

- low-I/O address base plus `dec_s.io_addr`
- `dec_s.imm16`
- pointer value from X/Y/Z
- `sp_q`

Address select source is controlled by `ctrl_s.d_addr_sel`.

## `d_wdata_o`
Selected from:

- source register value
- return-address high byte
- return-address low byte
- bit-modified I/O value

Select is controlled by `ctrl_s.d_wdata_sel`.

## `d_rdata_i`
- latched into `data_latch_q` when `ctrl_s.data_latch_we = 1`

## `d_we_o`
- asserted only when performing writes

## `d_re_o`
- asserted only when performing synchronous reads

## `d_valid_i`
- read-data acknowledge

## Control-Bus Behavioral Contract

## `pc_op`
Meaning:

- `PC_HOLD`
  - no change
- `PC_INC1`
  - increment PC by 1 word
- `PC_INC2`
  - increment PC by 2 words
- `PC_LOAD_ABS`
  - load from absolute target mux
- `PC_LOAD_REL`
  - load from relative target adder
- `PC_LOAD_IRQ`
  - load from `irq_vector_i`

Rule:

- exactly one `pc_op` value is active per cycle

## `sp_op`
Meaning:

- `SP_HOLD`
- `SP_DEC`
- `SP_INC`
- `SP_WRITE`

First version note:

- `SP_WRITE` is only needed if direct writes to `SPL/SPH` are handled through a dedicated path

## `rf_wsel`
Meaning:

- `RF_W_NONE`
- `RF_W_ALU`
- `RF_W_MEM`
- `RF_W_IMM`
- `RF_W_BIT_BLEND`
- `RF_W_POP`

First-version simplification:

- `RF_W_MEM` and `RF_W_POP` can map to the same datapath source if desired

## `alu_rhs_sel`
Meaning:

- `ALU_RHS_REG`
  - second operand from register file
- `ALU_RHS_IMM8`
  - immediate byte from decoder
- `ALU_RHS_ONE`
  - constant `1`
- `ALU_RHS_ZERO`
  - constant `0`
- `ALU_RHS_CARRY`
  - used when folding carry semantics if needed

## `d_addr_sel`
Meaning:

- `DA_NONE`
- `DA_IO`
- `DA_ABS16`
- `DA_PTR`
- `DA_SP`

## `d_wdata_sel`
Meaning:

- `DW_NONE`
- `DW_RF`
- `DW_RET_HI`
- `DW_RET_LO`
- `DW_BITMOD`

## Recommended Constants
Add to `avr_pkg.vhd`:

- `constant IRQ_COUNT : positive := <n>;`

Set `<n>` to the number of implemented interrupt sources for the first version.

## Recommended Reset Behavior

On reset:

- `state_reg <= CORE_S_RESET`
- `pc_q <= (others => '0')`
- `ir0_q <= (others => '0')`
- `ir1_q <= (others => '0')`
- `data_latch_q <= (others => '0')`
- `sreg_q <= (others => '0')`
- `sp_q <= AVR_RESET_SP`

Where:

- `AVR_RESET_SP` is a configurable constant based on implemented SRAM top

## Suggested First Skeleton Signal List Inside `avr_core`

```vhdl
signal dec_s        : avr_decode_t;
signal ctrl_s       : avr_ctrl_t;
signal sts_s        : avr_status_t;
signal irq_vector_s : addr16_t;

signal ir0_q        : word_t;
signal ir1_q        : word_t;
signal pc_q         : addr16_t;
signal sp_q         : addr16_t;
signal data_latch_q : byte_t;

signal rf_ra_data_s : byte_t;
signal rf_rb_data_s : byte_t;
signal rf_rc_data_s : byte_t;

signal alu_res_lo_s : byte_t;
signal alu_res_hi_s : byte_t;
signal alu_flags_s  : sreg_t;
```

## Interface Stability Recommendation
Once these records and ports are created, avoid changing them casually. If new instructions or peripherals require extra information:

- first prefer extending internal helper signals inside `avr_core`
- only extend shared records when the added field is truly architectural

This will keep RTL churn low while implementation grows.

## Recommended Next Step
The best next move after this spec is:

- create `rtl/avr/avr_pkg.vhd`
- create empty entity/architecture skeletons for `avr_core.vhd`, `avr_control_fsm.vhd`, and `avr_decoder.vhd`

That will convert the design documents into a compilable project backbone.
