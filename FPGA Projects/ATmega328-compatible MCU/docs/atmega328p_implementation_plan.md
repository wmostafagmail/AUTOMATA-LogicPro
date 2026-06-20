# ATmega328P-Compatible Soft Microcontroller Implementation Plan

## Objective
Build a VHDL soft microcontroller for a Xilinx FPGA that is:

- architecturally compatible with `ATmega328P`
- software-compatible with existing AVR `ATmega328P` binaries and toolchains
- close enough in timing and peripheral behavior to run typical bare-metal firmware

This is a substantial project. The current RTL in this repository is a teaching CPU with:

- custom ISA
- 8 registers
- 8-bit PC
- simple RAM/MMIO model

It is not directly compatible with AVR, so the safest plan is to use the current project structure as a verification and FPGA-integration scaffold, while implementing a new AVR-compatible core.

## Important Scope Decision
There are two possible targets:

### 1. Full compatibility target
- run standard `avr-gcc` output for `atmega328p`
- support the AVR instruction set used by real firmware
- implement correct SRAM, register file, stack, interrupts, timers, UART, SPI, TWI, GPIO, EEPROM interface, and reset behavior
- preserve enough cycle behavior for common embedded code

This is the correct target if you want to run Arduino Uno style software or existing compiled firmware.

### 2. Partial compatibility target
- compatible instruction set
- minimal peripherals
- enough support for simple C programs
- not guaranteed to run all Arduino libraries or production binaries

This is the correct target if the goal is educational or proof-of-concept.

If your requirement is truly "same architecture, performance, and software compatibility", plan for the full compatibility target.

## Recommended Architecture

### CPU core
Implement a new AVR8-compatible core with:

- 32 x 8-bit general-purpose registers `R0..R31`
- 16-bit program counter
- status register `SREG`
- stack pointer `SPH/SPL`
- separate program and data spaces
- instruction decoder for AVR 16-bit instructions plus multiword instructions where required

### Program memory
- instruction memory mapped as word-addressed flash image
- start with on-chip Block RAM
- add optional external memory interface only if program size exceeds device BRAM

### Data memory map
Match the AVR data space organization:

- `0x0000-0x001F`: register file view
- `0x0020-0x005F`: I/O space
- `0x0060-0x00FF`: extended I/O
- SRAM above that

This layout is critical for compiler and library compatibility.

### Interrupt system
Implement:

- reset vector
- interrupt vector table
- global interrupt enable in `SREG`
- interrupt entry/return behavior
- peripheral interrupt request lines

### Peripherals required for useful ATmega328P compatibility
Minimum practical set:

- GPIO ports `PORTB`, `PORTC`, `PORTD`
- Timer0
- Timer1
- Timer2
- USART
- SPI
- TWI (I2C)
- watchdog timer
- EEPROM interface registers

Optional later:

- ADC behavioral model
- analog comparator
- fuse/lock-bit behavior
- debugWire-like support

## Compatibility Strategy

### ISA compatibility
Implement the AVR instruction groups in this order:

1. Data movement
   - `LDI`, `MOV`, `MOVW`, `LD`, `ST`, `LDS`, `STS`, `IN`, `OUT`, `PUSH`, `POP`
2. Arithmetic and logic
   - `ADD`, `ADC`, `ADIW`, `SUB`, `SBC`, `SUBI`, `SBCI`, `AND`, `ANDI`, `OR`, `ORI`, `EOR`, `COM`, `NEG`, `INC`, `DEC`, `CP`, `CPC`, `CPI`, `TST`
3. Branch and control flow
   - `RJMP`, `JMP`, `RCALL`, `CALL`, `RET`, `RETI`, `BRxx`, `CPSE`, `SBRC`, `SBRS`, `SBIC`, `SBIS`
4. Shift and bit operations
   - `LSL`, `LSR`, `ROL`, `ROR`, `ASR`, `SWAP`, `BST`, `BLD`, `SBI`, `CBI`
5. Multiplication
   - `MUL`, `MULS`, `MULSU`, `FMUL*` only if required by firmware/toolchain

The first three groups are enough to boot a lot of simple AVR C code. Full compatibility usually needs most of the above.

### Software compatibility
Target these milestones:

- `avr-gcc -mmcu=atmega328p` compiled assembly runs
- interrupt-driven UART demo runs
- timer interrupt demo runs
- simple Arduino core startup runs
- selected Arduino library examples run

### Timing compatibility
Exact transistor-level or cycle-perfect matching is not necessary for most firmware, but you do need:

- correct cycle counts for branch, skip, memory, call/return, and interrupt instructions where software depends on them
- correct timer tick rates and prescalers
- correct UART baud generation

## Project Phases

## Phase 0: Requirements Freeze
Deliverables:

- define full or partial compatibility target
- select Xilinx family and device
- set target clock frequency
- define minimum firmware test set

Recommended decisions:

- target a Xilinx 7-series device first if available
- keep Spartan-6 support as a second synthesis target
- begin with 16 MHz visible AVR-equivalent timing model, even if FPGA fabric runs faster internally

Exit criteria:

- one-page requirements sheet signed off

## Phase 1: Microarchitecture Specification
Deliverables:

- AVR-compatible programmer's model document
- instruction decode table
- cycle timing table
- data space and I/O map
- interrupt and reset behavior spec

Key design choice:

- use a multi-cycle core first, not a pipelined core

Reason:

- much easier to verify
- easier to match AVR behavior
- simpler control for skip and branch instructions
- lower risk for first working version

Suggested internal blocks:

- `avr_pkg.vhd`
- `avr_decoder.vhd`
- `avr_control_fsm.vhd`
- `avr_regfile.vhd`
- `avr_alu.vhd`
- `avr_pc_stack.vhd`
- `avr_data_space.vhd`
- `avr_prog_mem.vhd`
- `avr_irq_ctrl.vhd`

Exit criteria:

- complete written spec before RTL implementation expands

## Phase 2: Core Without Peripherals
Implement:

- register file
- ALU and `SREG`
- PC and stack pointer
- program memory fetch
- basic load/store
- control flow
- reset behavior

Verification:

- instruction-level unit tests
- self-checking assembly tests
- C test programs compiled with `avr-gcc`

Must-pass examples:

- arithmetic tests
- stack tests
- call/return tests
- branch/skip tests
- memcpy-like loop tests

Exit criteria:

- non-interrupt bare-metal AVR binaries execute correctly in simulation

## Phase 3: Minimal ATmega328P I/O Compatibility
Implement these first because they unlock real software:

- `DDRx`, `PORTx`, `PINx`
- `SREG`, `SP`, interrupt registers
- USART registers and baud generator
- Timer0 with overflow interrupt

Verification:

- UART transmit test against real baud timings
- GPIO register behavior tests
- timer overflow interrupt tests

Exit criteria:

- `printf` over UART works from AVR C
- periodic timer interrupt demo works

## Phase 4: Full Peripheral Set
Implement:

- Timer1 16-bit
- Timer2
- SPI
- TWI
- EEPROM register behavior
- watchdog behavior

Potential simplification:

- ADC may initially return modeled values or connect to FPGA inputs through a wrapper

Exit criteria:

- representative ATmega328P firmware using UART, timers, SPI, and I2C works

## Phase 5: FPGA Integration for Xilinx
Tasks:

- infer Block RAM for flash and SRAM
- create top-level wrapper for clocks, reset, GPIO pins, UART pins
- map AVR GPIO ports to FPGA pins
- add Xilinx constraints
- add clock generation with PLL/DCM if needed

Artifacts:

- `rtl/avr_top.vhd`
- `rtl/avr_soc_top.vhd`
- `constraints/<target>.xdc` or `.ucf`

Performance goal:

- start with functionally correct 1-instruction-per-multiple-cycles core
- then optimize timing and CPI only after compatibility is proven

Exit criteria:

- bitstream builds successfully
- UART and GPIO demo work on board

## Phase 6: Software Compatibility Validation
Build a firmware regression suite:

- hand-written assembly tests
- avr-libc startup tests
- UART echo
- timer ISR demo
- SPI loopback
- I2C master transaction
- small Arduino sketches

Suggested test ladder:

1. LED blink in pure assembly
2. UART hello world in C
3. timer interrupt blink
4. ring buffer UART ISR
5. Arduino `setup()/loop()` sample

Exit criteria:

- documented list of passing binaries and unsupported features

## Phase 7: Performance Tuning
Only after correctness:

- reduce FSM states where safe
- optimize decode path
- improve BRAM mapping
- add optional prefetch
- add optional fast path for register-register ALU ops

Important note:

Matching ATmega328P "performance" can mean either:

- same observable timing at 16 MHz, or
- higher raw speed while preserving software behavior

For compatibility, it is usually better to preserve peripheral-visible timing and document instruction cycle behavior than to chase maximum MHz first.

## Recommended File/Module Structure
Suggested new RTL tree:

- `rtl/avr/avr_pkg.vhd`
- `rtl/avr/avr_decoder.vhd`
- `rtl/avr/avr_core.vhd`
- `rtl/avr/avr_control_fsm.vhd`
- `rtl/avr/avr_regfile.vhd`
- `rtl/avr/avr_alu.vhd`
- `rtl/avr/avr_sreg.vhd`
- `rtl/avr/avr_pc_stack.vhd`
- `rtl/avr/avr_prog_mem.vhd`
- `rtl/avr/avr_data_space.vhd`
- `rtl/avr/periph_gpio.vhd`
- `rtl/avr/periph_usart.vhd`
- `rtl/avr/periph_timer0.vhd`
- `rtl/avr/periph_timer1.vhd`
- `rtl/avr/periph_timer2.vhd`
- `rtl/avr/periph_spi.vhd`
- `rtl/avr/periph_twi.vhd`
- `rtl/avr/periph_eeprom_regs.vhd`
- `rtl/avr/periph_wdt.vhd`
- `rtl/avr/avr_irq_ctrl.vhd`
- `rtl/avr/avr_top.vhd`

Suggested testbench tree:

- `tb/avr/tb_avr_decoder.vhd`
- `tb/avr/tb_avr_alu.vhd`
- `tb/avr/tb_avr_core_smoke.vhd`
- `tb/avr/tb_avr_irq.vhd`
- `tb/avr/tb_usart.vhd`
- `tb/avr/tb_timer0.vhd`

## Gaps Between Current Repository and Target
Current repository strengths:

- VHDL project structure already exists
- simulation-oriented organization exists
- ROM/RAM/MMIO partition already exists
- FPGA top-level flow already exists

Main gaps:

- current ISA is not AVR
- register file is too small
- PC width is too small
- no AVR-compatible status register model
- no stack behavior compatible with AVR calling convention
- no interrupt controller
- no ATmega328P-compatible I/O register map
- no timer subsystem
- no toolchain-compatible program image flow for AVR binaries

## Toolchain Plan
Use standard AVR software flow for validation:

- `avr-gcc`
- `avr-as`
- `avr-objcopy`
- `avr-objdump`

Needed conversion tools:

- ELF/HEX to FPGA ROM initialization converter
- disassembly checker to compare expected instruction stream with ROM contents

Deliverables:

- `tools/elf_to_avr_rom.py`
- regression scripts for simulation

## Risk Register

### High risk
- full instruction-set corner cases
- skip instructions interacting with 32-bit instructions
- interrupt timing correctness
- timer mode compatibility
- Arduino ecosystem assumptions about register behavior

### Medium risk
- synthesis resource growth on smaller Spartan-6 parts
- matching EEPROM behavior closely enough
- TWI corner cases

### Low risk
- GPIO
- UART TX/RX basic operation
- SRAM/flash mapping using BRAM

## Recommended Execution Order

1. Freeze requirements and decide full vs partial compatibility.
2. Write the AVR programmer's model and memory map spec.
3. Implement decoder, register file, ALU, `SREG`, and PC/stack.
4. Bring up bare instruction execution in simulation.
5. Add AVR data-space mapping and stack-based call/return.
6. Run compiled AVR C test programs.
7. Add GPIO, USART, and Timer0.
8. Add interrupts.
9. Add remaining peripherals.
10. Integrate with Xilinx top-level and board constraints.
11. Run hardware validation on board.
12. Optimize timing and resource use.

## Practical Recommendation For This Repository
Do not try to mutate the current teaching CPU into AVR compatibility instruction by instruction inside the same module set.

Instead:

- keep the current CPU as a reference project
- create a parallel `rtl/avr/` implementation
- reuse only the general project scaffolding, testbench style, ROM generation ideas, and FPGA top-level conventions

This approach reduces risk and keeps the existing project usable during development.

## First 2 Weeks Plan

### Week 1
- freeze target device and compatibility level
- write AVR ISA subset table
- define memory map and control-state timing
- create `avr_pkg.vhd`, decoder skeleton, register file, ALU, and `SREG`

### Week 2
- implement PC, stack pointer, fetch/decode/execute FSM
- support `LDI/MOV/ADD/SUB/AND/OR/EOR/CP/RJMP/RCALL/RET/PUSH/POP/IN/OUT`
- create assembly smoke tests
- compile and simulate first AVR C test

## Success Criteria
The project should be considered successful only when all of the following are true:

- standard AVR tools can build firmware for `atmega328p`
- that firmware runs unmodified on the VHDL softcore
- GPIO, UART, timers, and interrupts behave as expected
- the design synthesizes and fits on the chosen Xilinx FPGA
- the compatibility limitations, if any, are explicitly documented
