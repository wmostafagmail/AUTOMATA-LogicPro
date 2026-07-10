# UART-SPI Protocol Bridge

Implements a protocol bridge converting asynchronous UART serial data to synchronous SPI transactions and vice-versa using FIFOs for buffering.

## Features
- Single clock domain (100 MHz nominal).
- Synchronous active-high reset.
- 4-deep FIFOs for TX/RX paths.
- GHDL compatible VHDL-2008 code.