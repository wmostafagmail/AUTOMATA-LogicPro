# Optional LM Studio Setup

Ollama is the default VHDL Lab provider. LM Studio is optional and can be enabled as a secondary local provider when needed for experiments.

## Expected Server

Start LM Studio with the local server enabled. The default lab URL is:

```text
http://127.0.0.1:1234
```

Override it with:

```bash
VHDL_LAB_LM_STUDIO_BASE_URL=http://127.0.0.1:1234
```

## Discovery

The VHDL Lab panel discovers Ollama models by default. LM Studio remains available through provider health/discovery plumbing and can be promoted to a visible secondary-provider workflow in a later UI pass. Its model discovery calls `/v1/models`, stores discovered models as local model profiles, and marks them as generator-capable until more detailed role assignment is added.

## Safety

The lab assumes loopback-only use. Do not expose LM Studio to untrusted networks while using local project files and generated artifacts.
