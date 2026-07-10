# VHDL / GHDL Partial Closure Checklist

Use this file to track the remaining partial-closure items that need either test-harness proof or live-sweep proof before they can be marked fully done.

## Status Meanings

- `[ ]` not started
- `[-]` in progress
- `[x]` implemented and locally verified
- `[p]` implemented in code but still needs additional live-sweep proof

## Tracker

| Status | Area | Remaining Work | Exact File(s) | Test File(s) | Proof Needed To Mark Done |
|---|---|---|---|---|---|
| [x] | `architecture_body_variable` | Validator, repair shaping, deterministic rewrite partitioning, and sweep-harness continuation proof are in place for process-local scratch, TB bookkeeping, and persistent-state intent. | `/Users/waleedmostafa/Documents/Automata LogicPro/src/server/generatedVhdlValidation.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/aiAnalyzeRunner.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/deterministicGeneratedCodeRepair.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/fpgaArchitectStressLoop.ts` | `/Users/waleedmostafa/Documents/Automata LogicPro/tests/generated-vhdl-validation.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/deterministic-generated-code-repair.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/fpga-architect-stress-loop.test.ts` | Focused tests prove classification, safe deterministic fixing, and repair-continuation carry-forward for this family. |
| [x] | `ghdl_analyze_failure` declaration/type/object escapes | Recurring raw analyze declaration/type escapes are now reclassified into canonical categories instead of landing in `other`, and sweep-harness summaries keep them bucketed under stable root-cause families. | `/Users/waleedmostafa/Documents/Automata LogicPro/src/server/generatedVhdlValidation.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/ghdlStrictVhdlRules.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/recurringVhdlFailureGuards.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/fpgaArchitectLoopDiagnostics.ts` | `/Users/waleedmostafa/Documents/Automata LogicPro/tests/generated-vhdl-validation.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/fpga-architect-stress-loop.test.ts` | Focused tests prove known declaration/type raw analyze failures are categorized and kept out of the `Other` bucket. |
| [x] | Type/interface coercion mismatches | Validator coverage, retry shaping, deterministic rewrites, and sweep-harness continuation proof are in place for typed helper actuals, typed function returns, raw-vector shift helpers, and typed port-map associations. | `/Users/waleedmostafa/Documents/Automata LogicPro/src/server/generatedVhdlValidation.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/aiAnalyzeRunner.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/deterministicGeneratedCodeRepair.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/fpgaArchitectStressLoop.ts` | `/Users/waleedmostafa/Documents/Automata LogicPro/tests/generated-vhdl-validation.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/deterministic-generated-code-repair.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/ai-analyze-runner.test.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/tests/fpga-architect-stress-loop.test.ts` | Focused tests prove these failures are either blocked pre-GHDL, repaired deterministically when mechanical, or carried forward into repair continuation with exact failure shaping. |
| [x] | Provider/runtime failure isolation | Provider/network errors are kept out of VHDL-quality scoring, excluded from per-design feedback memory, and reported separately in loop summaries. | `/Users/waleedmostafa/Documents/Automata LogicPro/src/server/fpgaArchitectLoopDiagnostics.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/fpgaArchitectStressLoop.ts` | `/Users/waleedmostafa/Documents/Automata LogicPro/tests/fpga-architect-stress-loop.test.ts` | Provider failures are classified into `provider_runtime`, excluded from prompt feedback injection, and counted separately from code-quality failures. |
| [x] | Feedback memory pollution | Per-design feedback memory is filtered so only same-design canonical code failures feed the next attempt. Manifest/source-selection noise and transport/runtime failures are excluded. | `/Users/waleedmostafa/Documents/Automata LogicPro/src/server/fpgaArchitectStressLoop.ts`<br>`/Users/waleedmostafa/Documents/Automata LogicPro/src/server/fpgaArchitectLoopDiagnostics.ts` | `/Users/waleedmostafa/Documents/Automata LogicPro/tests/fpga-architect-stress-loop.test.ts` | Prompt feedback snapshots contain only same-design code failures, not transport noise or non-code manifest/source-selection failures. |

## Phase 1 Exit Criteria

- [x] Architecture-body variables are classified into at least:
  - process-local scratch
  - testbench bookkeeping / shared-state intent
  - persistent state / signal intent
- [x] Deterministic repair only rewrites the safe subset locally.
- [x] Focused tests are green.
- [x] Focused sweep-harness proof exists for the remaining recurring families.
