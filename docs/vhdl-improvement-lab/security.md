# Security Notes

- The lab is local-first and writes under `data/vhdl-lab` by default.
- Ollama and optional LM Studio providers should be bound to loopback only.
- Do not include secrets in hardware contracts, prompt templates, or dataset exports.
- Dataset exports should strip provider metadata and raw system prompts unless explicitly needed for internal research.
- Generated VHDL is treated as untrusted until it passes static policy and GHDL gates.
