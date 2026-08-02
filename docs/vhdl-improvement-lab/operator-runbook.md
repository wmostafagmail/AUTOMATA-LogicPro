# Operator Runbook

## Open The Lab

Use the toolbar button `VHDL Lab`.

## Basic Smoke

1. Open the lab panel.
2. Discover Ollama models.
3. Create the smoke counter contract.
4. Queue a verification run.
5. Confirm the run advances through `GENERATING`, `EXTRACTING`, `VALIDATING_INTERFACE`, `ANALYZING`, and then `ACCEPTED` or `FAILED`.

## Environment Variables

```bash
VHDL_LAB_ENABLED=true
VHDL_LAB_DATA_ROOT=./data/vhdl-lab
VHDL_LAB_OLLAMA_BASE_URL=http://127.0.0.1:11434
VHDL_LAB_LM_STUDIO_BASE_URL=http://127.0.0.1:1234
VHDL_LAB_GHDL_PATH=/opt/homebrew/bin/ghdl
```

## Interpretation

Queued runs are consumed by the embedded worker on its heartbeat. `ACCEPTED` means the generated RTL passed extraction, frozen-interface validation, static policy, and GHDL analyze. Later phases will add repair loops, self-checking testbench generation, prompt A/B tests, datasets, and training.
