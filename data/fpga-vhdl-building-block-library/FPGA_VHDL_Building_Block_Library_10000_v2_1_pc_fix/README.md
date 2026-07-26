# FPGA VHDL Building Block Library — 10,000 Entities, Evidence-Based v2.1

This release contains all 10,000 catalog-named VHDL-2008 entities and their catalog smoke-test scaffolds. It also adds a separately controlled `qualified_cores` area, executable reference models, randomized numerical tests, structural/interface audits, GHDL regression scripts, and device-specific timing gates.

## Critical status statement

The package is **not represented as 10,000 production-pre-verified IP blocks**. That statement would be technically false without block specifications, exact protocol revisions, FPGA targets, full constraints, external protocol VIP, CDC/RDC reports, numerical error budgets, synthesis reports, and post-route STA evidence.

The v2.1 policy is evidence-based:

- `PASS_STATIC`: source structure and named associations were audited by the supplied Python evidence audit.
- `PASS_REFERENCE_MODEL`: executable Python oracle tests passed; this does not replace VHDL simulation.
- `GHDL_REQUIRED`: compilation, elaboration, and VHDL self-checking simulation must run in CI or locally.
- `TARGET_REQUIRED`: timing closure cannot be universal; it is established for one exact part, speed grade, clock set, pinout, and tool version.
- `VIP_REQUIRED`: protocol compliance needs the selected revision and independent VIP/assertion/interoperability evidence.
- `CDC_TOOL_REQUIRED`: CDC safety is integration-dependent and requires a clock/reset map plus structural CDC/RDC sign-off.

## v2.1 program-counter correction

Seven program-counter smoke tests inherited a fixed-delay sampling race. They now use rising-edge synchronization plus a short post-edge settling delay. No program-counter RTL or wrapper was changed. Run the focused regression with:

```bash
make pc-regression
```

See `docs/PROGRAM_COUNTER_FIX_v2_1.md` and `reports/program_counter_testbench_fix_v2_1.patch`.

## Contents

- `rtl/blocks/`: 10,000 catalog-named entities.
- `tb/blocks/`: 10,000 catalog testbench scaffolds.
- `rtl/cores/`: inherited shared cores, with unsafe generic slices corrected in v2.0.
- `rtl/qualified_cores/`: additional concrete arithmetic, control, buffering, measurement, memory, and streaming cores.
- `tb/qualified_cores/`: self-checking VHDL-2008 tests for those concrete cores.
- `reference_models/` and `tests/python/`: bit-exact executable oracles and randomized checks.
- `qualification/`: release gates and evidence policy.
- `flows/`: GHDL and FPGA timing-flow entry points.
- `reports/`: generated audit, model-test, and release-status evidence.

## Run

```bash
python3 scripts/evidence_audit.py
python3 tests/python/test_reference_models.py
scripts/run_v2_qualification.sh
```

The last command exits with status 2 when GHDL is unavailable. That is intentional: a missing simulator must never be converted into a false PASS.


## Generated evidence snapshot

| Gate | Result in this release |
|---|---|
| Catalog entity/testbench count | PASS — 10,000 / 10,000 |
| Whole-tree structural and named-interface audit | PASS — 20,071 VHDL files |
| Python bit-exact reference-model suite | PASS — 178,471 checks |
| VHDL-2008 analysis/elaboration | NOT RUN — GHDL unavailable in generation environment |
| VHDL self-checking simulations | NOT RUN — GHDL unavailable |
| Protocol VIP/compliance | NOT SIGNED OFF |
| CDC/RDC tool sign-off | NOT SIGNED OFF |
| FPGA synthesis | NOT RUN |
| Post-route timing closure | NOT RUN |
| Production-preverified entities claimed | 0 |

See `reports/evidence_summary.json`, `reports/qualification_status_10000.csv`, and `docs/RELEASE_SCOPE_AND_LIMITATIONS.md`.
