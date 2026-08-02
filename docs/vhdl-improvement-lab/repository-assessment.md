# VHDL Improvement Lab Repository Assessment

## Current Architecture

AUTOMATA LogicPro is a local-first TypeScript application with a React/Vite frontend and an Express backend hosted from `server.ts`. The existing FPGA Architect path already contains a large shared VHDL quality stack under `src/server`, including architecture contracts, staged generation, deterministic repair, GHDL validation, verified-library reuse, golden leaf reuse, sweep diagnostics, and local provider integrations.

## Persistence

The current app does not use a database or ORM. Project and lab artifacts are stored as local JSON/filesystem data. The VHDL Improvement Lab therefore starts with an app-owned JSON store at `data/vhdl-lab/vhdl-lab-state.json` plus artifact directories for contracts, prompt versions, runs, accepted RTL/testbenches, datasets, training outputs, and benchmarks.

## Auth And API

API routes are protected by the existing session middleware in `server.ts`. The lab endpoints live under `/api/vhdl-lab/*`, reuse the existing session model, and keep local loopback assumptions for Ollama and other optional local providers.

## VHDL Toolchain

The app already shells out to GHDL in several flows. The lab diagnostics detect GHDL through `VHDL_LAB_GHDL_PATH`, defaulting to `/opt/homebrew/bin/ghdl`, and report installation/version status without blocking the app UI.

## Provider Strategy

The lab uses Ollama as its primary local provider, matching the existing app workflow. LM Studio remains available as an optional secondary provider family for future experiments, but the default model discovery path calls Ollama `/api/tags`.

## Implemented In This Pass

- JSON-backed lab state and artifact directory initialization.
- Strict VHDL contract validation and hashing.
- VHDL artifact extraction from model responses.
- Static VHDL policy checks for banned packages, placeholders, markup, and RTL file I/O.
- Failure classification and normalized signatures.
- API routes for providers, models, contracts, runs, prompts, datasets, training placeholders, diagnostics, and worker status.
- Embedded Ollama worker that consumes queued RTL-generation runs one at a time.
- Worker stages for prompt rendering, VHDL extraction, interface validation, static policy checks, GHDL analyze, accepted artifact storage, and failure clustering.
- A frontend VHDL Improvement Lab panel reachable from the toolbar.
- Unit tests for the foundation.

## Deferred Phases

- Multi-candidate repair loops after failed generation.
- Full GHDL elaborate/simulate/testbench orchestration inside the lab run queue.
- Prompt optimizer proposal/approval/A-B testing loop.
- Dataset factory and train/validation/holdout materialization.
- MLX-LM LoRA training and checkpoint registry.
- Automatic rollback/promotion policy based on benchmark gates.

The deferred work is intentionally not stubbed as “complete”; APIs return explicit planned/not-yet-active states where execution would otherwise be misleading.
