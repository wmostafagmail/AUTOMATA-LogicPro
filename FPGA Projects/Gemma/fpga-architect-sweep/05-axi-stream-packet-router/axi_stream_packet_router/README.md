# AXI-Stream Packet Router

A scalable network switch implemented in VHDL-2008.

## Architecture
- **Routing**: Header-based routing using the first beat of each packet.
- **Handshake**: Full AXI-Stream `TVALID`/`TREADY` compliance.
- **Arbitration**: Round-robin per output port to prevent starvation.

## Simulation Instructions
1. Navigate to `sim/`.
2. Run `./run_ghdl.sh`.
3. Open `router_sim.vcd` in GTKWave to verify packet flow and backpressure.

## Verification Plan
The testbench verifies:
- Single packet delivery across different ports.
- Concurrent transfers on non-conflicting routes.
- Arbitration behavior when multiple inputs target the same output.