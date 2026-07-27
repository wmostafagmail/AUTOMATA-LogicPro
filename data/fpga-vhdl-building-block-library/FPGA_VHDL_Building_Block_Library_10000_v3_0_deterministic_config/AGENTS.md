# FPGA VHDL Building Block Library — Coding Agent Operating Contract

## Mission
Use this repository as a deterministic VHDL-2008 building-block library for generating FPGA top-level designs, subsystem wrappers, integration testbenches, and constraints. Never select or instantiate a block by filename guesswork. Resolve every block through `manifests/library_index.json` and its per-block manifest.

## Non-negotiable rules
1. Treat `rtl/blocks/**` as source implementations and `generated/default_wrappers/**` as the deterministic integration surface.
2. Do not edit generated wrappers or manifests manually. Regenerate them with scripts in `scripts/configuration/`.
3. Use only named generics present in the selected block manifest.
4. Resolve every generic to an explicit value. Never rely on an undocumented default in a production top-level.
5. Generate a locked wrapper for every non-default configuration.
6. Preserve the wrapper's `G_CONFIG_SCHEMA` and `G_CONFIG_ID` values.
7. Reject unknown generics, invalid positive/natural values, and incompatible clock/reset connections before emitting VHDL.
8. Do not infer protocol compliance, CDC safety, numerical accuracy, or timing closure from an entity name.
9. Read the manifest's `contracts` and `maturity` sections before using a block.
10. Do not connect clock domains directly unless the selected block explicitly declares a CDC function.
11. Compile packages before cores, cores before blocks, wrappers before top levels, and testbenches last.
12. Use VHDL-2008 and `ieee.numeric_std`; do not use non-standard arithmetic packages.

## Library map
- `rtl/config/`: shared configuration types and deterministic integer helper functions.
- `rtl/cores/`: reusable implementation cores.
- `rtl/reference_cores/`: evidence-oriented reference implementations.
- `rtl/blocks/`: 10,000 catalog entities.
- `manifests/blocks/`: one machine-readable contract per block.
- `manifests/library_index.json`: searchable index for all blocks.
- `configurations/default/`: resolved default configuration for every block.
- `generated/default_wrappers/`: locked default wrapper for every block.
- `scripts/configuration/generate_locked_wrapper.py`: creates a wrapper for a requested configuration.
- `scripts/configuration/validate_configuration_layer.py`: validates all manifests and generated wrappers.
- `examples/deterministic_top/`: integration examples.
- `tb/`: block and reference-core simulations.
- `constraints/`: target-specific constraint templates.
- `reports/`: qualification and evidence reports.

## Required block-selection workflow
1. Convert the requested top-level function into required capabilities, interfaces, widths, clocks, reset conventions, throughput, latency, and numerical rules.
2. Search `manifests/library_index.json` by `name` and `category`.
3. Open candidate manifests under `manifests/blocks/<category>/<block>.json`.
4. Compare:
   - generic and port contracts;
   - clock/reset ports;
   - protocol status;
   - CDC status;
   - numerical status;
   - implementation tier and verification status;
   - timing sign-off requirements.
5. Select the smallest block that satisfies the requirements.
6. Create a JSON configuration file with all required overrides.
7. Run the locked-wrapper generator.
8. Instantiate the generated wrapper, not the source block directly.
9. Generate an integration testbench and configuration report.
10. Run analysis, elaboration, simulation, CDC checks, synthesis, and target STA appropriate to the design.

## Generating a locked wrapper
```bash
python3 scripts/configuration/generate_locked_wrapper.py \
  --manifest manifests/blocks/cpu_and_soc/program_counter.json \
  --config configurations/examples/program_counter_64bit.json \
  --output generated/project_wrappers/program_counter_64bit_cfg.vhd
```

The generator:
- validates generic names and primitive types;
- resolves omitted values from the manifest defaults;
- calculates a stable SHA-256-derived configuration ID;
- emits elaboration assertions that prevent accidental generic overrides;
- emits a sidecar JSON report containing the resolved configuration.

## Top-level design procedure
For every instance, produce an instance record containing:
```json
{
  "instance": "u_pc",
  "block": "program_counter",
  "manifest": "manifests/blocks/cpu_and_soc/program_counter.json",
  "wrapper": "program_counter_64bit_cfg",
  "configuration_id": "PROGRAM_COUNTER_AAD86D1164F22FDC",
  "clock_domain": "cpu_clk",
  "reset_domain": "cpu_rst_n",
  "latency_contract": "from manifest or integration specification",
  "verification_required": ["compile", "simulation", "timing"]
}
```

Generate a project-level `design_manifest.json` containing all instance records, clock domains, reset domains, interfaces, address maps, constraints, and unresolved qualification gates.

## Wrapper construction rules
- Wrapper entities must have stable, legal VHDL names.
- Wrapper ports preserve the selected source entity's exact directions and width expressions.
- Functional generic values are locked by assertions.
- Protocol conversion belongs in a separate adapter wrapper.
- CDC belongs in an explicit CDC block, never in ad hoc combinational logic.
- Reset polarity conversion belongs at the boundary, with deassertion synchronized in each destination domain.
- Width conversion must define truncation, extension, sign handling, byte ordering, and alignment.
- Fixed-point adapters must define source/destination Q formats, rounding, saturation, and overflow behavior.
- Backpressure adapters must hold `valid` and payload stable while stalled.

## LLM use policy
An LLM may:
- search manifests;
- propose block compositions;
- generate configuration JSON;
- invoke wrapper generation;
- generate top-level VHDL and testbenches;
- generate assertions and constraints;
- summarize verification results.

An LLM must not:
- claim a block is protocol-compliant because its name contains a protocol;
- claim CDC safety without clock-domain analysis;
- claim timing closure without target implementation reports;
- invent generics or ports;
- silently change a configuration after generating its ID;
- bypass failed elaboration assertions;
- replace arithmetic semantics with assumptions.

## Required LLM output for each design
1. Selected blocks and selection rationale.
2. Configuration JSON for every non-default instance.
3. Generated wrapper filenames and configuration IDs.
4. Top-level VHDL.
5. Clock/reset-domain table.
6. Interface and address map.
7. Latency and throughput table.
8. Numerical format table.
9. Testbench plan and assertions.
10. Constraints required.
11. Qualification gaps and explicit non-claims.

## Compile order
```text
rtl/config/bb_config_pkg.vhd
rtl/config/bb_family_config_pkg.vhd
rtl/cores/*.vhd
rtl/reference_cores/*.vhd
rtl/blocks/**/*.vhd
generated/default_wrappers/**/*.vhd
generated/project_wrappers/**/*.vhd
<project top-level>
<project testbenches>
```

## Acceptance gates
A generated design is not complete until:
- all configuration manifests validate;
- all wrappers elaborate with locked values;
- all selected entities compile;
- self-checking simulations pass;
- reset behavior is tested;
- CDC/RDC is reviewed for every crossing;
- numerical reference comparisons pass where applicable;
- protocol assertions/VIP pass where applicable;
- synthesis completes for the chosen FPGA;
- post-route STA closes at defined corners;
- all waivers are documented.
