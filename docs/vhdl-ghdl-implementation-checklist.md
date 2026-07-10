# VHDL / GHDL Implementation Checklist

Use this file as the phase-by-phase implementation tracker for generation hardening, validation coverage, repair flow stabilization, and sweep verification.

## How To Use

- Mark each phase checkbox when all rows in that phase meet the done criteria.
- Mark each task checkbox when the code, tests, and verification for that item are complete.
- Keep the failure codes unchanged unless the canonical validator vocabulary changes.

## Phase Checklist

- [x] Phase 1: Repeating failure prevention
- [x] Phase 2: Core VHDL legality
- [x] Phase 3: Numeric and type discipline
- [x] Phase 4: Imports, packages, arrays, and subtype safety
- [x] Phase 5: Manifest and GHDL contract integrity
- [x] Phase 6: Top-level interface and standard consistency
- [x] Phase 7: RTL/TB separation and tooling policy
- [x] Phase 8: Catch-all GHDL failure reduction
- [x] Phase 9: Sweep verification and closure

## Tracker

| Status | Phase | Failure Code | Exact File(s) | Test File(s) | Done Criteria |
|---|---|---|---|---|---|
| [x] | 1 | `output_port_readback` | `/Users/waleedmostafa/Documents/Automata LogicPro/src/server/ghdlStrictVhdlRules.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/generatedVhdlValidation.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/generatedCodeRepair.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/deterministicGeneratedCodeRepair.ts` | `/Users/waleedmostafa/Documents/Automata LogicPro/tests/generated-vhdl-validation.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/deterministic-generated-code-repair.test.ts` | Output-port readback is blocked pre-GHDL, repair guidance names the legal internal-signal replacement, and tests prove detection plus deterministic fix guidance. |
| [x] | 1 | `declaration_after_begin` | `/Users/waleedmostafa/Documents/Automata LogicPro/src/server/ghdlStrictVhdlRules.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/generatedVhdlValidation.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/generatedCodeRepair.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/deterministicGeneratedCodeRepair.ts` | `/Users/waleedmostafa/Documents/Automata LogicPro/tests/generated-vhdl-validation.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/deterministic-generated-code-repair.test.ts` | Post-`begin` declarations are rejected before GHDL, retry prompts demand declarative-region placement, and regression tests stay green. |
| [x] | 1 | `procedure_outer_scope_write` | `/Users/waleedmostafa/Documents/Automata LogicPro/src/server/ghdlStrictVhdlRules.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/generatedVhdlValidation.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/generatedCodeRepair.ts` | `/Users/waleedmostafa/Documents/Automata LogicPro/tests/generated-vhdl-validation.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/ai-analyze-runner.test.ts` | Helper procedures that mutate outer-scope state are classified with exact replacement guidance and no longer escape uncategorized. |
| [x] | 1 | `variable_assigned_with_signal_operator`, `signal_assigned_with_variable_operator` | `/Users/waleedmostafa/Documents/Automata LogicPro/src/server/ghdlStrictVhdlRules.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/generatedVhdlValidation.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/generatedCodeRepair.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/deterministicGeneratedCodeRepair.ts` | `/Users/waleedmostafa/Documents/Automata LogicPro/tests/generated-vhdl-validation.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/deterministic-generated-code-repair.test.ts` | Signal/variable operator misuse is prevented or repaired deterministically, with validator and repair tests covering both directions. |
| [x] | 2 | `reserved_identifier`, `illegal_prefix_operator_form`, `interface_arrow_syntax`, `natural_language_leakage`, `end_statement_file_extension`, `verilog_style_literal` | `/Users/waleedmostafa/Documents/Automata LogicPro/src/server/ghdlStrictVhdlRules.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/generatedVhdlValidation.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/vhdlSkillRules.ts` | `/Users/waleedmostafa/Documents/Automata LogicPro/tests/generated-vhdl-validation.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/ghdl-strict-vhdl-rules.test.ts` | Core syntax/style anti-patterns are all mapped to canonical rules, blocked pre-GHDL, and covered by explicit rule/validator tests. |
| [x] | 3 | `illegal_numeric_logical_hybrid`, `resize_on_raw_std_logic_vector`, `resize_with_range_attribute`, `to_integer_on_raw_logic_type`, `typed_bitwise_mismatch`, `typed_unary_mismatch`, `typed_helper_actual_mismatch`, `scalar_bit_string_assignment`, `runtime_bound_check_risk` | `/Users/waleedmostafa/Documents/Automata LogicPro/src/server/ghdlStrictVhdlRules.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/generatedVhdlValidation.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/recurringVhdlFailureGuards.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/generatedCodeRepair.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/deterministicGeneratedCodeRepair.ts` | `/Users/waleedmostafa/Documents/Automata LogicPro/tests/generated-vhdl-validation.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/deterministic-generated-code-repair.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/ghdl-strict-vhdl-rules.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/recurring-vhdl-failure-guards.test.ts` | Numeric/type-discipline failures are caught before GHDL, recurring guards cover known bad ALU/DSP patterns, deterministic repair handles the mechanical rewrites safely, and repair/retry instructions are exact. |
| [x] | 4 | `missing_std_logic_1164_clause`, `missing_numeric_std_clause`, `illegal_multidimensional_logic_vector`, `reconstrained_subtype_alias`, `subprogram_body_inside_package_declaration`, `undeclared_interface_dimension_reference`, `illegal_scalar_type_alias`, `executable_region_signal_declaration` | `/Users/waleedmostafa/Documents/Automata LogicPro/src/server/ghdlStrictVhdlRules.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/generatedVhdlValidation.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/recurringVhdlFailureGuards.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/generatedCodeRepair.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/deterministicGeneratedCodeRepair.ts` | `/Users/waleedmostafa/Documents/Automata LogicPro/tests/generated-vhdl-validation.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/ghdl-strict-vhdl-rules.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/deterministic-generated-code-repair.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/recurring-vhdl-failure-guards.test.ts` | Import/package/array/subtype misuse is fully classified with stable failure codes, recurring guards cover the family, and the known mechanical fixes are handled deterministically before GHDL. |
| [x] | 5 | `no_generated_artifacts`, `no_vhdl_sources_found`, `empty_validation_source_set`, `missing_ghdl_command_contract`, `invalid_source_order_contract` | `/Users/waleedmostafa/Documents/Automata LogicPro/src/server/fpgaArchitect.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/aiAnalyzePreparation.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/aiAnalyzeRunner.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/ghdlRuleCoverage.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/generatedVhdlValidation.ts` | `/Users/waleedmostafa/Documents/Automata LogicPro/tests/fpga-architect.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/ai-analyze-runner.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/generated-vhdl-validation.test.ts` | Every generated project or artifact set includes the required compile plan, source set, and analysis order metadata, and empty/invalid contracts fail early with precise messages. |
| [x] | 6 | `top_level_generic_default_missing`, `top_level_port_unconstrained`, `mixed_vhdl_standard_group`, `multiple_architecture_elaboration_ambiguity` | `/Users/waleedmostafa/Documents/Automata LogicPro/src/server/ghdlStrictVhdlRules.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/generatedVhdlValidation.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/fpgaArchitect.ts` | `/Users/waleedmostafa/Documents/Automata LogicPro/tests/generated-vhdl-validation.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/fpga-architect.test.ts` | Top-level interface and standard-consistency rules are enforced deterministically and elaboration-target ambiguity is no longer left to raw GHDL failures. |
| [x] | 7 | `rtl_contains_tb_only_construct`, `unsupported_textio_package_policy`, `missing_waveform_generation_contract`, `generated_clock_in_rtl`, `mixed_clock_edge_domain`, `simulation_success_stop_style` | `/Users/waleedmostafa/Documents/Automata LogicPro/src/server/ghdlStrictVhdlRules.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/generatedVhdlValidation.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/macroSystemPrompts.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/aiPromptUtils.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/aiAnalyzeRunner.ts` | `/Users/waleedmostafa/Documents/Automata LogicPro/tests/generated-vhdl-validation.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/ai-analyze-runner.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/fpga-architect.test.ts` | RTL/TB/tooling policy is consistent across Architect, TB, Assertions, and RTL Skeleton, and runnable outputs always carry waveform and stop-style expectations. |
| [x] | 8 | `ghdl_analyze_failure`, `ghdl_elaborate_failure`, `ghdl_simulate_failure` | `/Users/waleedmostafa/Documents/Automata LogicPro/src/server/fpgaArchitectLoopDiagnostics.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/generatedCodeRepair.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/aiAnalyzeRunner.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/fpgaArchitectStressLoop.ts` | `/Users/waleedmostafa/Documents/Automata LogicPro/tests/ai-analyze-runner.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/fpga-architect-stress-loop.test.ts` | Catch-all GHDL failures are minimized, classified into canonical families where possible, and repair prompts consume machine-readable categories instead of vague prose. |
| [x] | 9 | All above, plus sweep-only recurrence tracking | `/Users/waleedmostafa/Documents/Automata LogicPro/src/server/fpgaArchitectStressLoop.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/fpgaArchitectLoopDiagnostics.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/ghdlRuleCoverage.ts` | `/Users/waleedmostafa/Documents/Automata LogicPro/tests/fpga-architect-stress-loop.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/ai-macro-backend.test.ts` | The 5-design/50-run sweep completes with known failure families either blocked pre-GHDL or precisely categorized, and no repeat known class appears as an uncategorized surprise. |

## Phase Exit Criteria

### Phase 1

- [x] All recurring declaration/operator misuse failures are blocked or deterministically repaired before GHDL.
- [x] No new sweep failures repeat these exact classes uncategorized.

### Phase 2

- [x] Core syntax/style anti-patterns are fully covered by validator tests.
- [x] Shared prompt rules explicitly forbid each of these patterns.

### Phase 3

- [x] Numeric/type-discipline failures are covered by validator plus repair guidance.
- [x] ALU/DSP-style regressions are represented in recurring guards and tests.

### Phase 4

- [x] Import/package/array/subtype families are all represented by stable failure codes.
- [x] Known package/body and array-shape escapes stop before GHDL.

### Phase 5

- [x] Project/artifact contract failures are validated before compile.
- [x] Empty or malformed source-set/analysis-order cases fail with precise messages.

### Phase 6

- [x] Interface and standard-consistency rules are enforced deterministically.
- [x] No top-level ambiguity is left as a raw GHDL-only failure.

### Phase 7

- [x] All code-generating macros share the same RTL/TB/tooling policy source.
- [x] Waveform and stop-style contract coverage exists wherever runnable artifacts are generated.

### Phase 8

- [x] Catch-all GHDL failures are either reclassified into known families or isolated as genuinely new classes.
- [x] Repair prompts consume machine-readable categories consistently.

### Phase 9

- [x] Full sweep runs without uncategorized repeats of already-known failure families.
- [x] Sweep summaries and logs reflect canonical rule-family grouping.
