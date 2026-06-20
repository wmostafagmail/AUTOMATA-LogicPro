# ESP32 C Emulator

## Overview
The original project implements the CPU in VHDL for Xilinx Spartan-6. This emulator mirrors the same ISA in portable C so it can run on an ESP32 as software.

The emulator lives in:
- `emulator/include/teaching_cpu.h`
- `emulator/src/teaching_cpu.c`

## What Matches the VHDL Design
- 8 general-purpose 8-bit registers
- 8-bit PC
- 256-word program ROM
- 256-byte data/MMIO space
- Same opcodes and instruction encodings
- Same memory map for LED and UART registers
- Illegal reserved-bit encodings trap to HALT

## ESP32 Behavior
- `0xF0` LED register is surfaced through a callback.
- `0xF1` UART TX writes are surfaced through a callback and logged internally.
- `0xF2` UART status returns `0` in this emulator, so software sees UART as always ready.

That last point keeps the ESP32 version simple and deterministic. It also means the sample UART polling loops still work correctly.

## Generated Program Headers
Use the assembler to emit C headers:

```bash
python3 asm/assembler.py asm/arithmetic_selfcheck.asm --out-dir asm/build --c-out emulator/programs/arithmetic_selfcheck.h --c-symbol arithmetic_selfcheck_program
python3 asm/assembler.py asm/led_uart_demo.asm --out-dir asm/build --c-out emulator/programs/led_uart_demo.h --c-symbol led_uart_demo_program
```

## Desktop Build
From the repository root:

```bash
clang -Iemulator/include emulator/src/teaching_cpu.c emulator/src/main.c -o emulator_host
./emulator_host
```

Run the C tests:

```bash
clang -Iemulator/include emulator/src/teaching_cpu.c emulator/tests/test_teaching_cpu.c -o emulator_tests
./emulator_tests
```

## Arduino-ESP32 Sketch
An example sketch is in:
- `emulator/examples/esp32_arduino/esp32_arduino.ino`

To use it in Arduino IDE:
- create a sketch folder
- copy the sketch plus `teaching_cpu.h`, `teaching_cpu.c`, and the generated program header into that sketch or a small local library
- select your ESP32 board
- open Serial Monitor at `115200`

The sketch runs `led_uart_demo`, prints the CPU status, mirrors the LED register to `LED_BUILTIN` bit 0 when available, and sends the emulated UART bytes to `Serial`.
