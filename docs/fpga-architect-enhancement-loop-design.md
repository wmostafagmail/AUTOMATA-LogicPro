# FPGA Architect Enhancement Loop Design

## Goal

Define a deterministic multi-attempt generation loop for code-generating macros, starting with `fpga_vhdl_architect`, so the app can:

1. generate a project,
2. parse and save it,
3. run strict pre-GHDL validation,
4. run GHDL analyze/elaborate/simulate when eligible,
5. collect normalized failure classes across attempts,
6. feed those failures back into the next repair prompt,
7. stop only on a passing result or when the configured attempt budget is exhausted.

This document is design-only. It does not implement the loop.

## Scope

Phase 1 target:

- `fpga_vhdl_architect`

Phase 2 candidates:

- `generate_vhdl_tb`
- `draft_rtl_skeleton`
- `generate_vhdl_assertions`

## Loop Budget

Default loop budget:

- `maxAttempts = 12`

User-configurable range:

- `min = 1`
- `max = 20`

Attempt accounting:

- Attempt 1 = initial generation
- Attempts 2..N = repair/regeneration attempts
- JSON/manifest repair attempts count against the same budget
- Strict pre-GHDL failures count against the same budget
- GHDL analyze/elaborate/simulate failures count against the same budget

## Exact Loop Architecture

### 1. Loop Controller

Create a single controller module:

- `src/server/generationEnhancementLoop.ts`

Primary entrypoint:

- `runGenerationEnhancementLoop(params): Promise<GenerationLoopResult>`

Responsibilities:

- own attempt budget
- run one generation/repair cycle at a time
- normalize failures into stable categories
- accumulate evidence across attempts
- build the next repair prompt from the normalized evidence
- produce one final success/failure result for the caller

### 2. Attempt Pipeline

Each attempt runs the exact same ordered stages:

1. `prompt_build`
2. `model_run`
3. `manifest_parse`
4. `artifact_save`
5. `strict_prevalidate`
6. `ghdl_analyze`
7. `ghdl_elaborate`
8. `ghdl_simulate`
9. `accept_or_retry`

Stage rules:

- If `manifest_parse` fails, do not save files; record a `manifest_*` failure.
- If `strict_prevalidate` fails, do not invoke GHDL; record `prevalidate_*` failures.
- If `ghdl_analyze` fails, stop that attempt immediately and record `ghdl_analyze_*` failures.
- If `ghdl_elaborate` fails, stop that attempt immediately and record `ghdl_elaborate_*` failures.
- If `ghdl_simulate` fails, stop that attempt immediately and record `ghdl_simulate_*` failures.
- Only a full simulate pass is accepted for `fpga_vhdl_architect`.

### 3. Failure Normalizer

Create a stable classifier:

- `src/server/generationFailureNormalizer.ts`

Primary entrypoint:

- `normalizeGenerationFailure(input): NormalizedFailure[]`

Each normalized failure must contain:

- `id`
- `family`
- `stage`
- `severity`
- `file`
- `line`
- `column`
- `summary`
- `repairDirective`
- `rawEvidence`
- `dedupeKey`

### 4. Failure Families

Initial required families:

- `manifest_json_invalid`
- `manifest_markdown_invalid`
- `manifest_missing_top_entity`
- `manifest_missing_files`
- `prevalidate_reserved_identifier`
- `prevalidate_architecture_variable`
- `prevalidate_interface_arrow`
- `prevalidate_missing_ieee_clause`
- `prevalidate_resize_std_logic_vector`
- `prevalidate_typed_bitwise_mismatch`
- `prevalidate_illegal_logical_hybrid`
- `prevalidate_prefix_operator_form`
- `ghdl_analyze_interface_syntax`
- `ghdl_analyze_reserved_identifier_escape`
- `ghdl_analyze_missing_dependency`
- `ghdl_analyze_missing_library_use`
- `ghdl_analyze_type_mismatch`
- `ghdl_elaborate_failure`
- `ghdl_simulate_assertion_failure`
- `ghdl_simulate_runtime_failure`

### 5. Failure Memory Across Attempts

The loop should maintain:

- `allFailures`
- `latestFailures`
- `failureCountsByFamily`
- `firstSeenAttemptByFamily`
- `lastSeenAttemptByFamily`
- `resolvedFamilies`

Resolution rule:

- A failure family is marked resolved when it appeared in a prior attempt but is absent from the current attempt.

### 6. Prompt Repair Builder

Create:

- `src/server/generationRepairPromptBuilder.ts`

Primary entrypoint:

- `buildRepairPromptFromFailures(params): string`

Prompt structure:

1. task restatement
2. unchanged fixed macro/system rules
3. compact attempt history
4. unresolved failure families only
5. exact file/line evidence excerpts
6. required repair directives
7. output contract reminder

Important rule:

- Never ask the model to explain failures at length.
- Always ask it to regenerate corrected full artifacts.
- Always tell it to preserve already-correct files unless a listed failure requires editing them.

## Reporting Format

The loop must produce two outputs:

### 1. Machine Report

Internal structured object:

```ts
type GenerationLoopResult = {
  status: 'passed' | 'failed' | 'stopped';
  macroId: string;
  attemptsUsed: number;
  maxAttempts: number;
  finalStage: 'manifest_parse' | 'prevalidate' | 'analyze' | 'elaborate' | 'simulate';
  passedAttempt: number | null;
  latestFailureFamilies: string[];
  resolvedFailureFamilies: string[];
  failuresByAttempt: GenerationAttemptReport[];
  aggregateCounts: {
    manifest: number;
    prevalidate: number;
    analyze: number;
    elaborate: number;
    simulate: number;
  };
};
```

```ts
type GenerationAttemptReport = {
  attempt: number;
  status: 'passed' | 'failed';
  stageReached: string;
  model: string;
  promptMode: 'initial' | 'json_repair' | 'compact_retry' | 'failure_repair';
  failureFamilies: string[];
  normalizedFailures: NormalizedFailure[];
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number;
};
```

### 2. User-Facing Report

The app should render a compact report block in this exact order:

1. overall status
2. attempts used
3. stage reached
4. unresolved failure families
5. resolved failure families
6. latest blocking evidence

Proposed Markdown format:

```md
## Enhancement Loop
- Status: FAILED
- Attempts Used: 5 / 12
- Final Stage: strict pre-GHDL validation
- Latest Failure Families: prevalidate_interface_arrow, ghdl_analyze_interface_syntax
- Resolved Families: prevalidate_architecture_variable

## Latest Blocking Evidence
- src/alu_core.vhd:15: interface declaration used `=>` instead of `:`
- src/alu_core.vhd:74: extra closing parenthesis in shift guard expression

## Attempt Timeline
- Attempt 1: failed at prevalidate -> prevalidate_architecture_variable
- Attempt 2: failed at analyze -> ghdl_analyze_interface_syntax
- Attempt 3: failed at analyze -> ghdl_analyze_interface_syntax
- Attempt 4: failed at parse -> manifest_json_invalid
- Attempt 5: failed at analyze -> ghdl_analyze_interface_syntax
```

## UI Requirements

For the future UI implementation:

- show `Attempt X / N` live while the loop is running
- show the current stage live
- show the current unresolved failure family chips live
- keep a collapsible attempt timeline
- let the user inspect normalized failures per attempt
- do not flood the main console with raw GHDL logs by default
- keep raw logs behind an expandable details section

## Acceptance Criteria Before Implementation

The loop design is ready to implement only if:

1. every existing known failure class maps to exactly one normalized family
2. retry prompts consume normalized failures rather than raw free-form logs
3. strict pre-GHDL failures never get reported as generic GHDL analyze failures
4. attempt counts, retry counts, and token totals remain correct across the full loop
5. the final user-facing report stays compact even when raw logs are large

## First Implementation Order

1. add `generationFailureNormalizer.ts`
2. add `generationEnhancementLoop.ts`
3. add `generationRepairPromptBuilder.ts`
4. refactor `fpga_vhdl_architect` to use the loop
5. render compact attempt reporting in the UI
6. extend to the other code-generating macros
