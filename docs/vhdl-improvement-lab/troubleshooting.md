# Troubleshooting

## Ollama Shows Unavailable

Check that Ollama is running and reachable at `VHDL_LAB_OLLAMA_BASE_URL` or `OLLAMA_BASE_URL`. The default is `http://127.0.0.1:11434`.

## LM Studio Shows Unavailable

LM Studio is optional. If you enable it as a secondary provider, check that its local server is reachable at `VHDL_LAB_LM_STUDIO_BASE_URL`.

## GHDL Shows Missing

Install GHDL or set:

```bash
VHDL_LAB_GHDL_PATH=/path/to/ghdl
```

## Contract Creation Fails

The contract validator requires legal VHDL identifiers, unique port/generic names, explicit clocking for clock-like ports, and clear testbench obligations.

## Runs Stay Queued

Check `/api/vhdl-lab/worker/status`. The embedded worker should show `started: true`. If it is disabled, verify `VHDL_LAB_WORKER_ENABLED` is not set to `false`.
