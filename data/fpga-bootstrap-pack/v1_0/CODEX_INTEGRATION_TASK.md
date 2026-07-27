# Codex integration task
This pack is external to and does not modify AUTOMATA-LogicPro. Treat the repository as read-only until the user separately authorizes changes.

1. Validate this pack with `python3 scripts/validate_facades.py` and `python3 scripts/validate_vhdl_static.py`.
2. Run `scripts/run_ghdl_regression.sh <library-root>` where GHDL is installed.
3. Import TypeScript types and registries into the existing application architecture; adapt imports/paths only.
4. Insert resolution between architecture intent and the existing renderer. Do not build a parallel Python runtime.
5. Use qualified-source wrappers first: UART RX/TX, program counter, sync/async FIFO, VGA timing.
6. Treat generic counter and timer as bootstrap canonical cores, not previously qualified catalog wrappers.
7. Preserve existing source RTL interfaces and existing GHDL/repair pipeline.
8. Do not claim protocol compliance, formal proof, synthesis, or timing closure without evidence.
