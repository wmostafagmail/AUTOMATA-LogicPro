# AVR-Compatible Softcore VHDL Architecture Specification

## Purpose
This document defines a module-by-module VHDL architecture for an `ATmega328P`-compatible soft microcontroller targeting Xilinx FPGA devices.

It is intended to be detailed enough to drive RTL implementation, testbench development, and integration planning.

## Design Goals

- preserve AVR8 programmer's model compatibility
- run firmware built with `avr-gcc -mmcu=atmega328p`
- fit cleanly into Xilinx BRAM-based FPGA implementations
- favor correctness and compatibility before performance optimization
- use a multi-cycle microarchitecture for first implementation

## Top-Level Design Style
The implementation should be split into:

- core CPU modules
- memory-space and bus modules
- peripheral modules
- FPGA integration wrapper
- simulation and ROM-loading support

Recommended directory:

- `rtl/avr/`

## Core Integration Overview
Suggested top-level core composition:

- `avr_core.vhd`
  - instantiates decoder, control FSM, register file, ALU, status register logic, PC/stack unit, interrupt controller
- `avr_prog_mem.vhd`
  - provides instruction fetch interface
- `avr_data_space.vhd`
  - arbitrates data-space accesses among regfile window, I/O window, extended I/O, SRAM, and peripherals
- peripheral modules
  - implement ATmega328P-visible register behavior
- `avr_top.vhd`
  - wraps core plus memories and peripherals
- `avr_soc_top.vhd`
  - binds FPGA pins, clocks, reset, and constraints

## High-Level Interfaces

### Instruction-side interface
The core should expose a simple synchronous fetch interface:

- `pmem_addr : out std_logic_vector(15 downto 0)`
- `pmem_req  : out std_logic`
- `pmem_rdata : in std_logic_vector(15 downto 0)`
- `pmem_valid : in std_logic`

Notes:

- address is word-addressed
- multiword instructions fetch an additional word
- BRAM-backed implementations may tie `pmem_valid` high after one cycle if read latency is fixed

### Data-side interface
The core should expose a byte-oriented data access interface:

- `d_addr   : out std_logic_vector(15 downto 0)`
- `d_wdata  : out std_logic_vector(7 downto 0)`
- `d_rdata  : in  std_logic_vector(7 downto 0)`
- `d_we     : out std_logic`
- `d_re     : out std_logic`
- `d_valid  : in  std_logic`

Notes:

- AVR data memory is byte-addressed
- `LD`, `ST`, `IN`, `OUT`, stack, and peripheral accesses all use this path
- synchronous memory should be assumed for FPGA realism

## Module Specifications

## 1. `avr_pkg.vhd`
Purpose:

- define all common types, constants, subtypes, register addresses, bit indices, and instruction-class enums

Responsibilities:

- byte, word, address, opcode, and status-flag types
- instruction classification enums
- control micro-op enums
- I/O register address constants
- interrupt vector constants
- timer/UART/SPI/TWI register addresses

Recommended contents:

- `subtype byte_t`
- `subtype word_t`
- `subtype addr16_t`
- `type avr_instr_t`
- `type alu_op_t`
- `type core_state_t`
- `type skip_kind_t`
- `type irq_id_t`

Important constants:

- `SREG_ADDR`
- `SPL_ADDR`, `SPH_ADDR`
- `PORTB_ADDR`, `DDRB_ADDR`, `PINB_ADDR`
- `UCSR0A_ADDR`, `UCSR0B_ADDR`, `UCSR0C_ADDR`
- `UBRR0L_ADDR`, `UBRR0H_ADDR`, `UDR0_ADDR`
- `TIMSK0_ADDR`, `TIFR0_ADDR`, `TCCR0A_ADDR`, `TCCR0B_ADDR`, `TCNT0_ADDR`, `OCR0A_ADDR`, `OCR0B_ADDR`

Implementation note:

- centralize all memory-mapped constants here to avoid inconsistent address decoding

## 2. `avr_decoder.vhd`
Purpose:

- decode fetched instruction words into a normalized internal representation

Inputs:

- `instr_word0 : in word_t`
- `instr_word1 : in word_t`
- `instr_word1_valid : in std_logic`

Outputs:

- `instr_kind : out avr_instr_t`
- `is_32bit   : out std_logic`
- `rd_idx     : out std_logic_vector(4 downto 0)`
- `rr_idx     : out std_logic_vector(4 downto 0)`
- `imm8       : out byte_t`
- `imm16      : out addr16_t`
- `bit_index  : out std_logic_vector(2 downto 0)`
- `io_addr    : out std_logic_vector(5 downto 0)`
- `decode_illegal : out std_logic`

Responsibilities:

- pattern-match all supported AVR instruction encodings
- normalize differing operand encodings into a single control-friendly form
- identify instructions requiring second word
- provide branch displacement and immediate fields

Implementation notes:

- use pure combinational decode
- split decode into helper functions for readability
- keep a strict illegal-instruction output for unsupported or malformed encodings

Verification:

- dedicated decoder testbench with known binary encodings
- compare against `avr-objdump` disassembly cases

## 3. `avr_control_fsm.vhd`
Purpose:

- sequence multi-cycle execution of AVR instructions

Inputs:

- decoded instruction outputs
- status flags
- fetch/data acknowledge signals
- interrupt pending information

Outputs:

- register file write controls
- ALU operation selects
- PC update controls
- stack update controls
- data-space read/write controls
- program-memory fetch sequencing
- interrupt entry/return controls

Recommended states:

- `CORE_S_RESET`
- `CORE_S_FETCH0`
- `CORE_S_FETCH1`
- `CORE_S_DECODE`
- `CORE_S_EXEC_ALU`
- `CORE_S_EXEC_IO_READ`
- `CORE_S_EXEC_IO_WRITE`
- `CORE_S_EXEC_DATA_READ`
- `CORE_S_EXEC_DATA_WRITE`
- `CORE_S_EXEC_PUSH1`
- `CORE_S_EXEC_PUSH2`
- `CORE_S_EXEC_POP1`
- `CORE_S_EXEC_POP2`
- `CORE_S_EXEC_CALL_0`
- `CORE_S_EXEC_CALL_1`
- `CORE_S_EXEC_CALL_2`
- `CORE_S_EXEC_RET_0`
- `CORE_S_EXEC_RET_1`
- `CORE_S_EXEC_RET_2`
- `CORE_S_SKIP_RESOLVE`
- `CORE_S_IRQ_ENTRY_0`
- `CORE_S_IRQ_ENTRY_1`
- `CORE_S_IRQ_ENTRY_2`
- `CORE_S_HALT_ILLEGAL`

Responsibilities:

- fetch instruction word 0
- fetch word 1 when required
- drive correct cycle sequencing for each instruction class
- implement skip-instruction behavior for 16-bit and 32-bit next instructions
- guarantee correct push/pop ordering and SP update timing
- enforce `RETI` behavior and interrupt masking rules

Implementation note:

- this module should not compute instruction semantics directly; it should orchestrate datapath and memory actions

## 4. `avr_regfile.vhd`
Purpose:

- implement the AVR general-purpose register file `R0..R31`

Inputs:

- `clk`
- `reset`
- two or three read addresses
- one write address/data/enable
- optional paired-write controls for `MOVW`

Outputs:

- read data ports

Recommended ports:

- `ra_idx`, `rb_idx`, `rc_idx`
- `ra_data`, `rb_data`, `rc_data`
- `we`
- `wd_idx`
- `wd_data`
- `we_pair`
- `wd_pair_idx`
- `wd_pair_data_lo`
- `wd_pair_data_hi`

Responsibilities:

- support combinational reads
- support synchronous writes
- expose X, Y, Z pointer values through register reads:
  - `X = R27:R26`
  - `Y = R29:R28`
  - `Z = R31:R30`

Implementation notes:

- infer distributed RAM or registers, not BRAM
- allow two reads and one write every cycle
- consider a third read path to simplify pointer and bit operations

Verification:

- test reset state
- single and paired writes
- simultaneous read/write corner cases

## 5. `avr_alu.vhd`
Purpose:

- perform arithmetic, logic, shift, compare, and bit operations

Inputs:

- `lhs : in byte_t`
- `rhs : in byte_t`
- `carry_in : in std_logic`
- `bit_in : in std_logic`
- `op : in alu_op_t`

Outputs:

- `result : out byte_t`
- `result_hi : out byte_t`
- `flags_next : out std_logic_vector(7 downto 0)`

Responsibilities:

- calculate result bytes
- compute `SREG` updates for:
  - `C`, `Z`, `N`, `V`, `S`, `H`, `T`, `I`
- support compare operations without writeback
- support multiply if included in instruction subset

Implementation note:

- AVR flag rules are subtle; encode them as separate helper functions per instruction class

Verification:

- exhaustive tests for 8-bit arithmetic ops if practical
- spot tests for overflow, half-carry, signed overflow, zero, and carry propagation

## 6. `avr_sreg.vhd`
Purpose:

- store and update the AVR status register

Inputs:

- `clk`
- `reset`
- `flags_we`
- `flags_next`
- `sreg_write_en`
- `sreg_write_data`
- `reti_set_i`
- `irq_clear_i`

Outputs:

- `sreg_q`
- individual flag taps

Responsibilities:

- maintain AVR flag state
- support direct writes through data space
- allow instruction-driven selective updates
- handle interrupt entry/`RETI` side effects on `I`

Implementation note:

- keep `SREG` as a standalone register module rather than burying it inside the ALU path; it simplifies formal reasoning and data-space exposure

## 7. `avr_pc_stack.vhd`
Purpose:

- manage program counter and stack pointer behavior

Inputs:

- PC increment/load controls
- relative branch displacement
- call/return controls
- current data-read bytes for return address pop
- SP direct write controls

Outputs:

- current `pc_q`
- current `sp_q`
- stack memory addresses for push/pop cycles
- return-address bytes to write on call/interrupt entry

Responsibilities:

- maintain 16-bit PC
- maintain 16-bit SP
- support:
  - sequential fetch
  - absolute jump/call
  - relative branch/jump
  - push/pop
  - interrupt vector entry

Implementation notes:

- the PC should be word-addressed
- the stack pointer is byte-addressed in data space
- verify byte ordering for pushed return address matches AVR conventions

Verification:

- stack decrement/increment direction
- `RCALL`, `CALL`, `RET`, `RETI`
- nested call and interrupt tests

## 8. `avr_core.vhd`
Purpose:

- integrate core computational blocks into one CPU entity

Submodules:

- `avr_decoder`
- `avr_control_fsm`
- `avr_regfile`
- `avr_alu`
- `avr_sreg`
- `avr_pc_stack`
- `avr_irq_ctrl`

External ports:

- `clk`
- `reset`
- instruction fetch interface
- data-space interface
- interrupt request bundle
- debug outputs

Suggested debug signals:

- `dbg_pc`
- `dbg_ir0`
- `dbg_ir1`
- `dbg_state`
- `dbg_instr_kind`
- `dbg_sreg`
- `dbg_sp`

Responsibilities:

- connect decode, execute, and state sequencing
- arbitrate writeback source selection
- expose clean interfaces to program memory and data space

Implementation note:

- keep peripheral logic out of `avr_core`; it should only speak fetch/data/IRQ interfaces

## 9. `avr_irq_ctrl.vhd`
Purpose:

- manage pending interrupt sources and vector selection

Inputs:

- individual peripheral IRQ lines
- peripheral IRQ enable bits
- global interrupt enable from `SREG.I`
- interrupt flags from peripherals
- interrupt acknowledge from core

Outputs:

- `irq_pending`
- `irq_vector_addr`
- `irq_id`

Responsibilities:

- prioritize interrupts in ATmega328P-compatible order
- present one pending interrupt to the control FSM
- clear accepted request when required

Implementation notes:

- some interrupt flags are cleared by hardware on vector entry, others by software write; model this per peripheral
- keep prioritization explicit, not encoded in fragile numeric assumptions

Verification:

- simultaneous interrupt arbitration
- masked vs unmasked behavior
- `RETI` interaction with global enable

## 10. `avr_prog_mem.vhd`
Purpose:

- provide AVR program memory image storage and instruction fetch behavior

Inputs:

- `clk`
- `addr`
- `req`

Outputs:

- `rdata`
- `valid`

Responsibilities:

- infer Xilinx Block RAM for flash image
- support initialization from generated ROM package or memory file
- provide deterministic synchronous fetch behavior

Implementation options:

- VHDL constant array initialized by generated package
- Xilinx `.coe` or inferred RAM init for synthesis

Recommended first version:

- word-addressed ROM with 16-bit entries
- fixed one-cycle read latency

## 11. `avr_data_space.vhd`
Purpose:

- implement the AVR data memory map and route data accesses

Inputs:

- core data request interface
- register file window hooks
- `SREG`, `SP`, and special register hooks
- peripheral register interfaces
- SRAM read data

Outputs:

- response data to core
- SRAM access controls
- peripheral bus selects

Responsibilities:

- decode data address ranges:
  - `0x0000-0x001F`: register file alias window
  - `0x0020-0x005F`: low I/O
  - `0x0060-0x00FF`: extended I/O
  - SRAM region above
- expose register file and core special registers through data space
- merge read data and acknowledge timing

Implementation note:

- this module is central to software compatibility; keep address decoding readable and table-driven where possible

Verification:

- direct reads/writes to registers through data space
- I/O mapping correctness
- SRAM access timing

## 12. `avr_sram.vhd`
Purpose:

- implement internal SRAM

Inputs:

- `clk`
- `addr`
- `we`
- `wdata`

Outputs:

- `rdata`

Responsibilities:

- provide byte-addressable data memory for stack and globals
- infer BRAM for larger memories or LUT RAM for small configurations

Implementation note:

- if targeting exact ATmega328P SRAM size, configure for 2 KB

## 13. `periph_gpio.vhd`
Purpose:

- implement `PORTB`, `PORTC`, and `PORTD` register behavior

Inputs:

- data-space register reads/writes
- external pin inputs

Outputs:

- pin output values
- output enable controls
- readback values

Responsibilities:

- implement `DDR`, `PORT`, `PIN`
- support input readback and output latch behavior
- optionally support synchronized input sampling

Implementation note:

- map each AVR port to a generic FPGA pin bundle so board wrappers can connect them easily

## 14. `periph_usart.vhd`
Purpose:

- implement ATmega328P USART register behavior

Registers to support first:

- `UCSR0A`
- `UCSR0B`
- `UCSR0C`
- `UBRR0L`
- `UBRR0H`
- `UDR0`

Responsibilities:

- TX and RX shift logic
- baud-rate generation
- register status bits
- interrupt generation for RX complete, TX complete, and data-register-empty as implemented

Implementation notes:

- TX should be implemented first
- RX can be added after core bring-up if software scope allows
- preserve important status semantics such as write-to-clear bits where applicable

Verification:

- loopback simulation
- baud divider tests
- interrupt flag timing

## 15. `periph_timer0.vhd`
Purpose:

- implement 8-bit Timer/Counter0

Registers:

- `TCCR0A`
- `TCCR0B`
- `TCNT0`
- `OCR0A`
- `OCR0B`
- `TIMSK0`
- `TIFR0`

Responsibilities:

- prescaler
- normal and CTC operation at minimum
- compare match and overflow flags
- interrupt requests

Implementation note:

- begin with overflow interrupt and basic compare mode; PWM can come later if firmware requires it

## 16. `periph_timer1.vhd`
Purpose:

- implement 16-bit Timer/Counter1

Notes:

- more complex because of 16-bit register accesses and waveform modes
- start with normal mode, compare match, and overflow

Special care:

- AVR 16-bit register high/low byte access ordering

## 17. `periph_timer2.vhd`
Purpose:

- implement 8-bit Timer/Counter2

Notes:

- similar to Timer0 but with separate control/status registers
- asynchronous clocking support can be deferred if not needed early

## 18. `periph_spi.vhd`
Purpose:

- implement ATmega328P SPI master/slave register behavior

Registers:

- `SPCR`
- `SPSR`
- `SPDR`

Responsibilities:

- shift engine
- status flags
- interrupt request

Recommended first scope:

- master mode first

## 19. `periph_twi.vhd`
Purpose:

- implement TWI/I2C-visible register behavior

Registers:

- `TWBR`
- `TWSR`
- `TWAR`
- `TWDR`
- `TWCR`

Note:

- this is a high-complexity peripheral; it can be added after UART and timers are stable

## 20. `periph_eeprom_regs.vhd`
Purpose:

- implement EEPROM control/status register behavior visible to software

Registers:

- `EEARL`
- `EEARH`
- `EEDR`
- `EECR`

Recommended first version:

- behavioral register model backed by small RAM

## 21. `periph_wdt.vhd`
Purpose:

- implement watchdog timer behavior sufficient for common firmware

Recommended first version:

- timeout counter
- reset request output
- essential control bits

## 22. `avr_top.vhd`
Purpose:

- SoC-level integration of core, memories, and peripherals

Ports:

- `clk`
- `reset`
- `uart_rx`
- `uart_tx`
- GPIO bundles for B/C/D
- optional SPI/TWI pins
- debug outputs

Responsibilities:

- instantiate `avr_core`
- instantiate `avr_prog_mem`
- instantiate `avr_data_space`
- instantiate SRAM and peripheral blocks
- combine interrupt lines

## 23. `avr_soc_top.vhd`
Purpose:

- board-specific wrapper for Xilinx implementation

Responsibilities:

- clock buffering / PLL / DCM hookup
- reset conditioning
- pin-level mapping
- board-specific LED/UART/SPI pin wiring

Implementation note:

- keep this thin so the design stays portable across boards

## Control and Data Flow Recommendations

### Instruction execution flow
Recommended baseline flow:

1. `FETCH0`
   - request instruction word at current PC
2. `FETCH1`
   - latch returned word
   - if decode says 32-bit instruction, request second word
3. `DECODE`
   - decode and classify instruction
4. `EXEC`
   - one or more execution states depending on instruction type
5. `WRITEBACK`
   - commit result and update flags if needed
6. return to `FETCH0`

### Skip-instruction handling
For `CPSE`, `SBRC`, `SBRS`, `SBIC`, `SBIS`:

- decode current instruction
- determine whether skip is taken
- inspect length of next instruction
- increment PC by 1 or 2 words accordingly

This logic should be explicit in control FSM design; it is a common source of incompatibility.

### Interrupt entry flow
Recommended flow:

1. complete current instruction
2. detect `irq_pending` with `I=1`
3. clear global `I`
4. push return PC high/low bytes to stack
5. load interrupt vector address into PC
6. continue fetch from vector

## Debug and Verification Hooks
Each major module should expose optional debug signals under generics or synthesis guards.

Recommended debug outputs:

- core state
- current PC
- current instruction words
- current `SREG`
- current `SP`
- data-space access traces
- interrupt active/pending IDs

## Testbench Strategy by Module

### Unit tests
- `tb_avr_decoder.vhd`
- `tb_avr_regfile.vhd`
- `tb_avr_alu.vhd`
- `tb_avr_sreg.vhd`
- `tb_avr_pc_stack.vhd`
- `tb_periph_usart.vhd`
- `tb_periph_timer0.vhd`

### Integration tests
- `tb_avr_core_smoke.vhd`
- `tb_avr_top_uart.vhd`
- `tb_avr_top_irq.vhd`

### Firmware-driven tests
- assembly self-check programs
- `avr-gcc` compiled C programs
- ROM-load simulation regression

## Suggested Implementation Order

1. `avr_pkg.vhd`
2. `avr_decoder.vhd`
3. `avr_regfile.vhd`
4. `avr_alu.vhd`
5. `avr_sreg.vhd`
6. `avr_pc_stack.vhd`
7. `avr_control_fsm.vhd`
8. `avr_core.vhd`
9. `avr_prog_mem.vhd`
10. `avr_sram.vhd`
11. `avr_data_space.vhd`
12. `periph_gpio.vhd`
13. `periph_usart.vhd`
14. `periph_timer0.vhd`
15. interrupt integration
16. remaining peripherals
17. `avr_top.vhd`
18. `avr_soc_top.vhd`

## Notes on Reuse From Current Repository
Useful concepts to reuse from the existing project:

- project directory organization
- FPGA top wrapper conventions
- ROM initialization workflow patterns
- self-checking testbench style
- UART simulation ideas

Modules that should not be reused as-is for AVR compatibility:

- current `control_unit.vhd`
- current `datapath.vhd`
- current `register_file.vhd`
- current ISA package and instruction formats

They are structurally helpful references, but not architecturally compatible with AVR.

## Recommended Next Document
After this spec, the next most useful artifact is:

- an AVR instruction decode table with exact bit patterns, internal micro-ops, and cycle counts

That document should directly drive `avr_decoder.vhd` and `avr_control_fsm.vhd`.
