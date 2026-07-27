# AUTOMATA LogicPro FPGA Bootstrap Pack v1.0

External, read-only-preparation package for reducing Codex integration work. It contains deterministic facade VHDL, manifests, schemas, TypeScript registries/types, presets, behavioral-contract stubs, reference models, static validators, and a low-noise GHDL regression script.

## Source-of-truth qualified wrappers
- UART RX
- UART TX
- Program counter: basic, stallable, redirectable, full
- Synchronous FIFO
- Asynchronous FIFO
- VGA timing 640x480 profile

## Bootstrap canonical cores
- Generic counter
- Periodic timer

The canonical cores are clearly marked and must not be represented as previously verified catalog blocks.

## Validation
```bash
python3 scripts/validate_facades.py
python3 scripts/validate_vhdl_static.py
scripts/run_ghdl_regression.sh /path/to/FPGA_VHDL_Building_Block_Library_10000_v3_0_deterministic_config
```

GHDL was not available in the artifact-generation environment. Static validation was run; dynamic results remain pending.
