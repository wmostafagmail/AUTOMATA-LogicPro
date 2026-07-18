import type { GoogleGenAI } from '@google/genai';
import fs from 'fs/promises';
import path from 'path';
import type { AiMacroId, AiMacroValidationResult, TbGenerationMode } from '../aiMacros';
import type { LogicProSession, createSessionManager } from './sessionManager';
import type { DeterministicSkillSelection, PreparedVhdlSkillPrompt } from './vhdlSkillOrchestrator';
import {
  buildDeterministicArchitectGhdlRunCommands,
  type FpgaArchitectProject,
} from './fpgaArchitect';
import { buildMacroExecutionPrompt } from './aiPromptUtils';
import {
  applyGeneratedCodeRepairs,
  buildGeneratedCodeRepairPrompt,
  parseGeneratedCodeRepairs,
  type RepairableGeneratedFile,
} from './generatedCodeRepair';
import { applyDeterministicGeneratedCodeRepairs } from './deterministicGeneratedCodeRepair';
import type {
  GeneratedVhdlArtifactForValidation,
  GeneratedVhdlRepairAuditEntry,
  GeneratedVhdlValidationResult,
} from './generatedVhdlValidation';
import {
  assertFpgaArchitectProjectMatchesContract,
  attachFpgaArchitectureContractArtifact,
  buildApprovedFpgaArchitectureContractSection,
  proposeApprovedFpgaArchitectureContract,
  validateFpgaArchitectProjectAgainstContract,
  type FpgaArchitectureContract,
} from './fpgaArchitectureContract';

type SessionManager = ReturnType<typeof createSessionManager>;

type AiRunTelemetry = {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  tokensPerSecond: number | null;
  endToEndTokensPerSecond?: number | null;
  durationMs: number;
};

type AiRunResult = {
  text: string;
  telemetry: AiRunTelemetry;
};

type SavedGeneratedVhdlArtifact = {
  fileName: string;
  content: string;
  kind: 'testbench' | 'module' | 'assertions' | 'rtl_skeleton' | 'unknown';
  path: string;
};

const FPGA_ARCHITECT_MAX_INNER_REPAIR_ATTEMPTS = 10;
const FPGA_ARCHITECT_MAX_PROJECT_STRUCTURE_REPAIR_ATTEMPTS = 2;
const GENERATED_CODE_MAX_DETERMINISTIC_REPAIR_PASSES = 5;

type SavedFpgaArchitectArtifact = {
  name: string;
  path: string;
  fileType: string;
  purpose: string;
  content: string;
  kind: 'testbench' | 'module' | 'assertions' | 'rtl_skeleton' | 'unknown';
};

type SavedArchitectProjectResult = {
  outputDirectory: string;
  savedFiles: SavedFpgaArchitectArtifact[];
};

type HazardFindingLike = {
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
};

type ProtocolFrameLike = {
  protocol: 'SPI' | 'I2C' | 'UART';
  channel: string;
  startTick: number;
  endTick: number;
  summary: string;
  detail: string;
};

type ExtractedArtifact = {
  fileName: string;
  content: string;
  kind: 'testbench' | 'module' | 'assertions' | 'rtl_skeleton' | 'unknown';
};

type AnnotatedAiAnalyzeError = Error & {
  generatedVhdlValidation?: GeneratedVhdlValidationResult | null;
  fpgaArchitectureContract?: FpgaArchitectureContract | null;
};

function summarizeRepairFailureLocation(validation: GeneratedVhdlValidationResult) {
  const firstDetail = validation.failureDetails?.[0];
  if (firstDetail?.relativePath && firstDetail.lineHint) {
    return `${firstDetail.relativePath}:${firstDetail.lineHint}`;
  }
  if (firstDetail?.relativePath) {
    return firstDetail.relativePath;
  }
  const summaryMatch = validation.summary.match(/([^:\n]+\.(?:vhd|vhdl)):(\d+)/i);
  if (summaryMatch) {
    return `${summaryMatch[1]}:${summaryMatch[2]}`;
  }
  return null;
}

function getRepairFailureCode(validation: GeneratedVhdlValidationResult) {
  return validation.failureCode || validation.failureDetails?.[0]?.code || null;
}

function collectGeneratedVhdlFailureCodes(validation: GeneratedVhdlValidationResult) {
  return new Set([
    validation.failureCode,
    ...(validation.failureDetails || []).map((detail) => detail.code),
  ].filter(Boolean) as string[]);
}

function isFpgaArchitectProjectStructureContractFailure(validation: GeneratedVhdlValidationResult | null | undefined) {
  if (!validation || validation.ok) return false;
  const failureCodes = collectGeneratedVhdlFailureCodes(validation);
  return (
    failureCodes.has('unresolved_work_unit')
    || failureCodes.has('missing_work_package_file')
    || failureCodes.has('package_symbol_not_visible')
  );
}

function summarizePostRepairValidation(validation: GeneratedVhdlValidationResult) {
  return {
    ok: validation.ok,
    stage: validation.stage,
    failureCode: getRepairFailureCode(validation),
    summary: validation.summary,
  };
}

function compactGeneratedVhdlValidationSummary(validation: GeneratedVhdlValidationResult) {
  const details = (validation.failureDetails || [])
    .slice(0, 8)
    .map((detail) => ({
      code: detail.code,
      category: detail.category,
      file: detail.relativePath || null,
      line: detail.lineHint || null,
      excerpt: detail.excerpt ? detail.excerpt.slice(0, 240) : '',
      forbiddenConstruct: detail.forbiddenConstruct || null,
      legalReplacementPattern: detail.legalReplacementPattern || null,
      message: detail.message.slice(0, 360),
    }));

  return JSON.stringify({
    ok: validation.ok,
    stage: validation.stage,
    failureCode: validation.failureCode || null,
    failureCategory: validation.failureCategory || null,
    summary: validation.summary,
    details,
  }, null, 2);
}

function buildFpgaArchitectProjectStructureSnapshot(project: FpgaArchitectProject) {
  const files = (project.files || []).map((file) => ({
    path: file.path,
    fileType: file.fileType,
    purpose: file.purpose,
    declarations: [
      ...Array.from(file.content.matchAll(/\bpackage\s+(?!body\b)([a-zA-Z][a-zA-Z0-9_]*)\s+is\b/gi)).map((match) => `package ${match[1]}`),
      ...Array.from(file.content.matchAll(/\bentity\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\b/gi)).map((match) => `entity ${match[1]}`),
    ],
    workReferences: [
      ...Array.from(file.content.matchAll(/\bentity\s+work\.([a-zA-Z][a-zA-Z0-9_]*)\b/gi)).map((match) => `entity work.${match[1]}`),
      ...Array.from(file.content.matchAll(/\buse\s+work\.([a-zA-Z][a-zA-Z0-9_]*)(?:\.[a-zA-Z][a-zA-Z0-9_]*)?\s*;/gi)).map((match) => `use work.${match[1]}`),
    ],
  }));

  const snapshot = JSON.stringify({
    projectName: project.projectName,
    topEntity: project.topEntity,
    vhdlStandard: project.vhdlStandard,
    ghdl: {
      analysisOrder: project.ghdl?.analysisOrder || [],
      topTestbench: project.ghdl?.topTestbench || '',
      runCommands: project.ghdl?.runCommands || [],
    },
    files,
  }, null, 2);

  const maxSnapshotChars = 12000;
  return snapshot.length > maxSnapshotChars
    ? `${snapshot.slice(0, maxSnapshotChars)}\n...<project structure snapshot truncated>`
    : snapshot;
}

function formatRepairAuditEntry(entry: GeneratedVhdlRepairAuditEntry) {
  return [
    `repairAttempt=${entry.repairAttempt}`,
    `failureCode=${entry.failureCode || 'unknown'}`,
    `fileLine=${entry.fileLine || 'unknown'}`,
    `repairType=${entry.repairType}`,
    `changedFiles=${entry.changedFiles.length > 0 ? entry.changedFiles.join(', ') : 'none'}`,
    `postRepairValidation=${entry.postRepairValidation.ok ? 'PASS' : 'FAIL'} ${entry.postRepairValidation.stage}` +
      `${entry.postRepairValidation.failureCode ? `/${entry.postRepairValidation.failureCode}` : ''}: ${entry.postRepairValidation.summary}`,
  ].join(' | ');
}

function getRepairAuditLogKey(entry: GeneratedVhdlRepairAuditEntry) {
  return [
    entry.repairAttempt,
    entry.failureCode || 'unknown',
    entry.fileLine || 'unknown',
    entry.repairType,
    entry.changedFiles.join(','),
    entry.postRepairValidation.ok ? 'PASS' : 'FAIL',
    entry.postRepairValidation.stage,
    entry.postRepairValidation.failureCode || 'unknown',
    entry.postRepairValidation.summary,
  ].join('\u0001');
}

function compactRepairAuditForLog(audit: GeneratedVhdlRepairAuditEntry[]) {
  const compacted: GeneratedVhdlRepairAuditEntry[] = [];
  for (const entry of audit) {
    const previous = compacted[compacted.length - 1];
    if (previous && getRepairAuditLogKey(previous) === getRepairAuditLogKey(entry)) {
      continue;
    }
    compacted.push(entry);
  }
  return compacted;
}

function withRepairAudit(
  validation: GeneratedVhdlValidationResult,
  audit: GeneratedVhdlRepairAuditEntry[],
) {
  if (audit.length === 0) {
    return validation;
  }
  const compactedAudit = compactRepairAuditForLog(audit);
  const compactedCount = audit.length - compactedAudit.length;
  const auditLines = [
    ...(compactedCount > 0 ? [`INNER_REPAIR_AUDIT | compactedRepeatedEntries=${compactedCount}`] : []),
    ...compactedAudit.map((entry) => `INNER_REPAIR_AUDIT | ${formatRepairAuditEntry(entry)}`),
  ];
  return {
    ...validation,
    logs: [
      ...validation.logs.filter((line) => !line.startsWith('INNER_REPAIR_AUDIT |')),
      ...auditLines,
    ],
    repairAudit: audit,
  };
}

function collectChangedRepairPaths(
  beforeFiles: RepairableGeneratedFile[],
  afterFiles: RepairableGeneratedFile[],
) {
  return afterFiles
    .filter((file) => {
      const before = beforeFiles.find((candidate) => candidate.absolutePath === file.absolutePath);
      return before ? before.content !== file.content : true;
    })
    .map((file) => file.relativePath);
}

function macroRequiresPassingSimulation(macroId: AiMacroId) {
  return macroId === 'generate_vhdl_tb' || macroId === 'fpga_vhdl_architect';
}

function describeValidationGate(stage: GeneratedVhdlValidationResult['stage']) {
  if (stage === 'prevalidate') {
    return 'strict pre-GHDL validation';
  }
  return `GHDL ${stage} validation`;
}

function buildAnnotatedAiAnalyzeError(
  message: string,
  metadata?: {
    generatedVhdlValidation?: GeneratedVhdlValidationResult | null;
    fpgaArchitectureContract?: FpgaArchitectureContract | null;
  },
): AnnotatedAiAnalyzeError {
  const error = new Error(message) as AnnotatedAiAnalyzeError;
  if (metadata?.generatedVhdlValidation) {
    error.generatedVhdlValidation = metadata.generatedVhdlValidation;
  }
  if (metadata?.fpgaArchitectureContract) {
    error.fpgaArchitectureContract = metadata.fpgaArchitectureContract;
  }
  return error;
}

function hasBundledDeclarationScopeCluster(validation: GeneratedVhdlValidationResult) {
  return (validation.failureDetails || []).some((detail) => (
    detail.code === 'architecture_body_variable'
    || detail.code === 'declaration_after_begin'
    || detail.code === 'executable_region_signal_declaration'
    || detail.code === 'procedure_outer_scope_write'
  ));
}

function buildFailureEvidenceSummary(validation: GeneratedVhdlValidationResult) {
  const details = (validation.failureDetails || []).slice(0, 8);
  if (details.length === 0) {
    return [
      'Failure evidence contract:',
      '- Do not infer or guess a new failure reason. Use only the validator/GHDL summary and log text provided by the app.',
      `- Validation gate: ${describeValidationGate(validation.stage)}.`,
      `- Summary: ${validation.summary || 'No structured summary was provided.'}`,
    ].join('\n');
  }

  return [
    'Failure evidence contract:',
    '- Do not infer or guess a new failure reason. Use only the exact evidence below.',
    '- Repair each listed file/line/expression locally. If a line or snippet is present, treat it as the primary repair target.',
    '- If evidence is incomplete, preserve behavior and make the smallest legal VHDL correction implied by the failure code; do not invent unrelated design changes.',
    ...details.flatMap((detail, index) => {
      const lines = [
        `- Issue ${index + 1}: ${detail.category || validation.failureCategory || 'unknown_category'} / ${detail.code || validation.failureCode || 'unknown_code'}`,
        `  file: ${detail.relativePath || 'unknown'}`,
        `  line: ${typeof detail.lineHint === 'number' ? detail.lineHint : 'unknown'}`,
        `  message: ${detail.message || validation.summary || 'No failure message was provided.'}`,
      ];
      if (detail.excerpt) {
        lines.push(`  exact snippet/expression: ${detail.excerpt}`);
      }
      if (detail.forbiddenConstruct) {
        lines.push(`  forbidden construct: ${detail.forbiddenConstruct}`);
      }
      if (detail.legalReplacementPattern) {
        lines.push(`  required replacement: ${detail.legalReplacementPattern}`);
      }
      if (detail.assertionLabel) {
        lines.push(`  assertion label: ${detail.assertionLabel}`);
      }
      if (detail.simulationTime) {
        lines.push(`  simulation time: ${detail.simulationTime}`);
      }
      if (detail.expectedBehavior) {
        lines.push(`  expected behavior: ${detail.expectedBehavior}`);
      }
      if (detail.instructionSequence && detail.instructionSequence.length > 0) {
        lines.push(`  instruction sequence: ${detail.instructionSequence.join(' | ')}`);
      }
      if (detail.relatedSourcePaths && detail.relatedSourcePaths.length > 0) {
        lines.push(`  related source hints: ${detail.relatedSourcePaths.join(', ')}`);
      }
      return lines;
    }),
  ].join('\n');
}

export function buildFailureCodeSpecificRepairShaping(validation: GeneratedVhdlValidationResult) {
  const details = validation.failureDetails || [];
  const seenCodes = new Set<string>();
  const sections: string[] = [buildFailureEvidenceSummary(validation)];
  const hasDeclarationScopeCluster = details.some((detail) => (
    detail.code === 'architecture_body_variable'
    || detail.code === 'declaration_after_begin'
    || detail.code === 'executable_region_signal_declaration'
    || detail.code === 'procedure_outer_scope_write'
  ));

  if (hasDeclarationScopeCluster) {
    sections.push([
      '- declaration_scope_cluster',
      '  Treat declaration placement, helper placement, and bookkeeping ownership as one bundled local repair pass in the existing file.',
      '  For self-checking testbenches, move helper procedures/functions such as `wait_clk`, `check_eq`, `check_result`, and `expect_*` into one legal declarative region before executable statements start.',
      '  Move mutable bookkeeping objects such as `cnt`, `loop_cnt`, `pass_count`, `fail_count`, `current_test`, and `test_failed` out of the architecture body and into the owning process declarative region unless a true architecture-level signal/shared-variable requirement exists.',
      '  If a helper needs to update mutable state, pass that state explicitly as a formal parameter or keep the state local to the caller process. Do not keep hidden outer-scope writes.',
      '  Repair the whole file-local declaration-scope cluster in one pass. Do not regenerate unrelated files or rename stable interfaces just to fix placement/scope legality.',
    ].join('\n'));
  }

  for (const detail of details) {
    if (!detail.code || seenCodes.has(detail.code)) {
      continue;
    }
    seenCodes.add(detail.code);

    if (detail.code === 'architecture_body_variable') {
      const lowerPattern = (detail.legalReplacementPattern || '').toLowerCase();
      sections.push([
        `- ${detail.code}`,
        '  Fix the existing file locally by moving plain architecture-body variables into a legal form.',
        '  For testbenches, keep helper subprogram declarations before architecture/process begin and keep bookkeeping state local to the owning process whenever shared architecture-level state is not truly required.',
        lowerPattern.includes('shared testbench bookkeeping')
          ? '  Treat this as testbench bookkeeping or shared status state: prefer a signal for sampled state, or a shared variable only when shared TB bookkeeping is truly required.'
          : lowerPattern.includes('persistent state')
            ? '  Treat this as likely persistent state: convert it into a signal in the architecture declarative region and normalize any local assignments to signal semantics.'
            : '  Treat this as likely temporary scratch state: move it into the nearest process/subprogram declarative region instead of keeping it at architecture scope.',
        '  Do not redesign unrelated logic or rename interfaces unless the file cannot compile otherwise.',
      ].join('\n'));
    } else if (
      detail.code === 'declaration_after_begin'
      || detail.code === 'executable_region_signal_declaration'
      || detail.code === 'procedure_outer_scope_write'
    ) {
      sections.push([
        `- ${detail.code}`,
        '  Hoist declarations into the nearest legal declarative region before begin.',
        detail.code === 'declaration_after_begin'
          ? '  When the failing construct is a function or procedure, move the exact existing subprogram block intact. Do not rewrite its header, split its parameter list, insert repair commentary, or leave orphaned declaration fragments behind.'
          : '  Do not introduce repair annotations, explanatory comments, or partial placeholder lines while moving the declaration.',
        detail.code === 'procedure_outer_scope_write'
          ? '  Replace hidden outer-scope mutation by passing the mutated object explicitly as a formal parameter or by keeping mutable state local to the caller process.'
          : '  Keep executable statements and design behavior intact; repair placement, not architecture intent.',
      ].join('\n'));
    } else if (detail.code === 'tb_unconstrained_string_variable') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the existing testbench file locally. Do not regenerate unrelated files just because a message/report helper is illegal.',
        '  Remove mutable unconstrained local string variables such as `variable msg : string;` or `variable fail_msg : string;`.',
        '  Replace them with only these legal patterns: a direct report/assert literal at the call site, a constant with an explicit bound, or a helper/report path that does not require mutable string storage.',
        '  Do not introduce placeholder string buffers, deferred string assembly, or unconstrained mutable string bookkeeping anywhere in the testbench.',
      ].join('\n'));
    } else if (detail.code === 'clock_edge_helper_requires_signal_formal') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the existing helper header locally instead of regenerating the testbench.',
        '  Any helper formal referenced by `rising_edge(...)` or `falling_edge(...)` must be declared as a signal input formal, for example `signal clk_i : in std_logic`.',
        '  Preserve the helper body and call sites. Only normalize the formal clause so the edge test is legal to GHDL before the file reaches compile/analyze.',
      ].join('\n'));
    } else if (detail.code === 'subprogram_call_arity_mismatch') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the existing helper declaration and call sites locally. Do not regenerate the testbench.',
        '  The helper declaration arity and every call-site actual count must match exactly.',
        '  For clock wait helpers, prefer the canonical one-clock contract: `procedure wait_clk(signal clk_i : in std_logic) is ...` and calls like `wait_clk(clk);`.',
        detail.forbiddenConstruct ? `  Failing call/declaration evidence: ${detail.forbiddenConstruct}` : '',
        detail.legalReplacementPattern ? `  Required pattern: ${detail.legalReplacementPattern}` : '',
      ].filter(Boolean).join('\n'));
    } else if (detail.code === 'subprogram_actual_type_mismatch') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the existing helper type contract locally. Do not weaken checks and do not regenerate unrelated files.',
        '  Scalar std_logic actuals must go to scalar std_logic formals; std_logic_vector actuals must go to vector formals.',
        '  For equality helpers, use `check_eq_sl` for std_logic and `check_eq_slv` for std_logic_vector instead of forcing one helper signature to handle both.',
        detail.forbiddenConstruct ? `  Failing actual/formal evidence: ${detail.forbiddenConstruct}` : '',
      ].filter(Boolean).join('\n'));
    } else if (detail.code === 'tb_unguarded_logic_index_conversion') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the existing testbench file locally by removing direct raw-logic array indexing such as `mem(to_integer(unsigned(addr_slv)))`.',
        '  Introduce or reuse a local guarded helper such as `tb_safe_slv_to_index(...)` that first verifies every bit is `0` or `1`, then converts to an index only after that check passes.',
        '  Preserve the existing memory model and stimuli. Do not redesign the DUT or regenerate unrelated files just to normalize the testbench indexing path.',
      ].join('\n'));
    } else if (detail.code === 'invalid_range_membership_syntax') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the existing file locally. Do not regenerate the design just because a bounds-check condition used invalid syntax.',
        '  VHDL does not support `if idx in 0 to 15 then` or similar conditional range-membership syntax.',
        '  Rewrite it as explicit comparisons, for example `if idx >= 0 and idx <= 15 then`.',
        '  Preserve the guarded-indexing intent and all surrounding testbench/DUT behavior.',
      ].join('\n'));
    } else if (detail.code === 'incomplete_array_aggregate_choices') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the existing package/ROM/RAM initializer locally. Do not regenerate unrelated CPU files.',
        '  Fixed-range array aggregates must cover every index or include a safe `others => ...` default of the element type.',
        '  If the element type is a vector/numeric subtype such as data_t, unsigned, signed, or std_logic_vector, prefer a safe zero default such as `others => (others => \'0\')`.',
        '  Preserve explicit initialized program/data entries and add only the missing default choices.',
        detail.forbiddenConstruct ? `  Failing aggregate evidence: ${detail.forbiddenConstruct}` : '',
      ].filter(Boolean).join('\n'));
    } else if (detail.code === 'unconnected_required_input_port') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the exact instantiation locally. A required input formal was omitted from the named port map.',
        '  Add a named association for the missing input using an existing correctly typed signal, constant, or a local adapter signal.',
        '  Do not leave mandatory input formals open, and do not invent placeholder packages or rewrite unrelated components.',
        detail.forbiddenConstruct ? `  Missing-port evidence: ${detail.forbiddenConstruct}` : '',
        detail.legalReplacementPattern ? `  Required connection pattern: ${detail.legalReplacementPattern}` : '',
      ].filter(Boolean).join('\n'));
    } else if (detail.code === 'typed_port_width_mismatch' || detail.code === 'custom_numeric_subtype_port_mismatch') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the exact typed boundary locally. Do not use broad casts across architectural boundaries.',
        '  Named numeric subtypes such as addr_t and data_t are not interchangeable just because both normalize to unsigned.',
        '  Use an exact formal subtype actual, or introduce a local adapter with explicit resize/slice/conversion whose width is proven from the package/entity declaration.',
        '  Never repair this class by blindly wrapping the actual with unsigned(...) or std_logic_vector(...), especially on output/inout associations.',
        detail.forbiddenConstruct ? `  Failing association: ${detail.forbiddenConstruct}` : '',
        detail.legalReplacementPattern ? `  Required pattern: ${detail.legalReplacementPattern}` : '',
      ].filter(Boolean).join('\n'));
    } else if (detail.code === 'typed_equality_operand_mismatch') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the comparison operands locally so both sides have the same numeric_std type.',
        '  If the left side is unsigned, compare it to unsigned/to_unsigned(...), not std_logic_vector(...).',
        '  If the left side is signed, compare it to signed/to_signed(...), not std_logic_vector(...).',
        '  Preserve the check/assertion semantics; do not delete or weaken the comparison.',
        detail.forbiddenConstruct ? `  Failing comparison: ${detail.forbiddenConstruct}` : '',
      ].filter(Boolean).join('\n'));
    } else if (detail.code === 'tb_string_formal_actual_constraint_mismatch') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the existing helper/subprogram contract locally instead of regenerating the whole testbench.',
        '  Do not declare constrained string formals such as `name : string(1 to 32)` or `msg : string(1 to N)` in self-checking helper procedures/functions.',
        '  Replace constrained helper string formals with unconstrained read-only `string`, or remove the helper string formal entirely and report the literal directly at the call site.',
        '  Preserve helper behavior and the self-checking flow; only normalize the string contract so actual/formal lengths can vary safely across calls.',
      ].join('\n'));
    } else if (detail.code === 'testbench_missing_dut_instantiation') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the existing testbench locally by adding the missing DUT instantiation. Do not regenerate unrelated RTL or weaken checks.',
        '  Instantiate the intended DUT with `entity work.<dut_name>` and a named `port map` that uses only exact formal port names from the DUT entity.',
        '  Connect DUT input ports to stimulus signals/constants and connect DUT output ports to observed signals used by check/assert helpers.',
        detail.legalReplacementPattern ? `  Required pattern: ${detail.legalReplacementPattern}` : '',
        '  After the repair, every checked DUT result/status signal must be driven by the DUT output path, not left floating.',
      ].filter(Boolean).join('\n'));
    } else if (detail.code === 'checked_signal_not_dut_driven') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the existing testbench wiring locally. A self-checking signal must be driven by the DUT, a deliberate local reference model, or a clearly initialized driver before it is checked.',
        '  Prefer connecting the signal to the correct DUT output in the DUT instantiation. Do not satisfy the check by assigning expected values directly to the observed DUT-output signal.',
        detail.forbiddenConstruct ? `  Failing check evidence: ${detail.forbiddenConstruct}` : '',
        detail.legalReplacementPattern ? `  Required pattern: ${detail.legalReplacementPattern}` : '',
      ].filter(Boolean).join('\n'));
    } else if (detail.code === 'testbench_drives_dut_output_signal') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the existing testbench locally. Testbench stimulus must never assign to a signal that is mapped to a DUT out/buffer/inout output path.',
        '  Remove the testbench assignment to the observed output signal and let the DUT drive it through the port map.',
        '  If a separate expected value is needed, create a distinct reference/expected signal or variable; do not reuse the DUT output actual as stimulus.',
        detail.forbiddenConstruct ? `  Failing output-drive evidence: ${detail.forbiddenConstruct}` : '',
      ].filter(Boolean).join('\n'));
    } else if (detail.code === 'subprogram_body_inside_package_declaration') {
      sections.push([
        `- ${detail.code}`,
        '  Keep only declarations/signatures in the package declaration and move executable bodies into a package body for the same package.',
        '  Preserve package names, public API, and dependent file structure unless the validator class explicitly forces a rename.',
      ].join('\n'));
    } else if (detail.code === 'missing_std_logic_1164_clause' || detail.code === 'missing_numeric_std_clause') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the existing file locally by adding the missing IEEE import in that same file only.',
        detail.code === 'missing_std_logic_1164_clause'
          ? '  Add library ieee; and use ieee.std_logic_1164.all; before relying on std_logic, std_ulogic, or std_logic_vector.'
          : '  Add use ieee.numeric_std.all; before relying on unsigned, signed, resize, to_integer, to_unsigned, or to_signed.',
        '  Do not redesign ports, types, or logic when the failure is only a missing local import clause.',
      ].join('\n'));
    } else if (
      detail.code === 'illegal_scalar_type_alias'
      || detail.code === 'end_statement_file_extension'
      || detail.code === 'natural_language_leakage'
      || detail.code === 'reconstrained_subtype_alias'
      || detail.code === 'anonymous_array_object_declaration'
    ) {
      sections.push([
        `- ${detail.code}`,
        '  Repair the package/type definition locally without changing overall design intent.',
        detail.code === 'illegal_scalar_type_alias'
          ? '  Use subtype for constrained scalar aliases derived from integer/natural/positive instead of declaring a new type.'
          : detail.code === 'reconstrained_subtype_alias'
            ? '  Reuse the existing constrained subtype directly, or derive the new subtype from the true unconstrained base type instead of re-constraining the alias.'
            : detail.code === 'anonymous_array_object_declaration'
              ? '  Declare a named array type or subtype first, then declare the object using that named type instead of inline array(...) of ... syntax.'
          : detail.code === 'end_statement_file_extension'
            ? '  End the design unit with only the legal unit identifier or a bare end statement; never include a filename suffix.'
            : '  Remove prose from executable/declarative syntax and keep any explanation only in trailing VHDL comments after a legal statement.',
      ].join('\n'));
    } else if (detail.code === 'conditional_assignment_operator_misuse') {
      sections.push([
        `- ${detail.code}`,
        '  Repair only true boolean-condition assignment misuse. In `if`, `elsif`, `assert`, or conditional `when ... else` expressions, never use `:=`; use `=`, `/=`, `<`, `<=`, `>`, or `>=` as appropriate.',
        '  For bounds checks such as `idx >= 0 and idx := 7`, rewrite the second half to `idx <= 7`.',
        '  Do not rewrite legal `case` statement branches such as `when OP_AND => result_v := a_u and b_u;`; that is a standalone variable assignment and is valid VHDL.',
      ].join('\n'));
    } else if (detail.code === 'variable_assigned_with_signal_operator' || detail.code === 'signal_assigned_with_variable_operator') {
      sections.push([
        `- ${detail.code}`,
        '  Repair assignment operators in place: variables use := and signals use <=.',
        '  Do not convert objects between signal and variable form unless operator repair alone cannot satisfy the file.',
      ].join('\n'));
    } else if (detail.code === 'typed_port_association_mismatch') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the failing port map locally instead of regenerating the design.',
        '  Match the actual expression to the formal type exactly at the association boundary.',
        '  If the actual is an integer/natural and the formal is unsigned/signed, use to_unsigned(value, FORMAL_WIDTH) or to_signed(value, FORMAL_WIDTH), or declare the TB actual with the exact formal type/range.',
        '  Never repair integer-to-unsigned/signed mismatches with raw unsigned(integer_value) or signed(integer_value); that is illegal VHDL.',
        '  Never place conversion expressions on out/inout port actuals.',
        '  Preserve the entity interface and keep the fix at the specific instantiation unless the same typed mismatch is structurally repeated elsewhere in the same file.',
      ].join('\n'));
    } else if (detail.code === 'enum_case_choice_missing') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the FSM/case statement locally. VHDL case statements over enum values must cover every enum literal or include a safe when others branch.',
        detail.forbiddenConstruct ? `  Failing evidence: ${detail.forbiddenConstruct}` : '  Use the validator/GHDL evidence to identify the missing enum choice.',
        '  Add explicit behavior for the missing state(s), or add a safe default branch that preserves reset/idle/error behavior. Do not remove the enum literal from the type just to silence GHDL.',
      ].join('\n'));
    } else if (detail.code === 'unsigned_conversion_on_non_vector') {
      sections.push([
        `- ${detail.code}`,
        '  Repair numeric_std conversion locally. Do not call unsigned(...) or signed(...) on integer/natural/custom scalar values.',
        '  If the value is already integer/natural, use it directly instead of to_integer(unsigned(value)).',
        '  If the value is already unsigned/signed, call to_integer(value) directly.',
        '  If a vector encoding is required, create a correctly typed vector first using to_unsigned(value, width) or to_signed(value, width).',
      ].join('\n'));
    } else if (detail.code === 'out_port_actual_conversion') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the failing port map locally. An out/buffer association must be a writable object, never a type-conversion expression.',
        '  Remove conversions such as `pc_out => unsigned(pc_addr_sig)` from output associations. Connect the port to a correctly typed internal signal, then convert/assign outside the port map if needed.',
        '  Preserve the instantiated entity interface and repair only the signal/type boundary around the failing association.',
      ].join('\n'));
    } else if (detail.code === 'custom_type_port_association_mismatch') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the custom record/enum/package type wiring locally. Do not wrap std_logic_vector signals with random conversions for package-defined formal ports.',
        '  Find the formal port type declaration and declare/reuse an actual signal with that exact type. Decode or encode between vectors and records/enums outside the port map using explicit field assignments.',
        '  Preserve package type definitions as the source of truth unless the validator explicitly says the package declaration itself is illegal.',
      ].join('\n'));
    } else if (detail.code === 'package_symbol_not_visible') {
      sections.push([
        `- ${detail.code}`,
        '  Repair package/type visibility locally. Do not duplicate or fork package/type definitions.',
        '  If the missing symbol is already exported by a generated package, import it with `use work.<package>.all;` in the failing file and ensure the package appears before the dependent file in analysis_order.',
        '  If no generated package exports the symbol, add the type/subtype to the appropriate shared package and update analysis_order so dependents compile after it.',
        '  Preserve existing public package names and dependent interfaces unless the validator evidence says the package itself is illegal.',
      ].join('\n'));
    } else if (detail.code === 'unknown_port_map_formal') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the failing port map locally. Named associations must use exact formal port names from the instantiated entity/component declaration.',
        '  Inspect the target entity/component legal formal port list and replace only the bad formal name; do not invent ports or rename the target entity interface unless every dependent instantiation is updated coherently.',
        '  Preserve actual signal intent and connect it to the correct existing formal port, or leave the port intentionally unconnected only when the target mode and design intent allow it.',
      ].join('\n'));
    } else if (detail.code === 'interface_constant_not_visible') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the entity/component interface locally. Any width constant used in a port subtype must be declared before the port list or imported from a visible package.',
        '  If this is an entity-level width such as OUT_WIDTH, add it to the entity generic list with a safe default before the port clause, then keep all dependent widths coherent.',
        '  Do not leave uppercase width symbols floating in port declarations without a generic/package declaration.',
        detail.forbiddenConstruct ? `  Failing interface evidence: ${detail.forbiddenConstruct}` : '',
      ].filter(Boolean).join('\n'));
    } else if (detail.code === 'record_field_not_declared') {
      sections.push([
        `- ${detail.code}`,
        '  Repair cross-file schema drift by making implementation files match the package record definition.',
        '  Do not invent new record fields to satisfy illegal accesses. Use only the fields declared in the package record, or derive the desired value from those declared fields.',
        detail.legalReplacementPattern
          ? `  Required replacement: ${detail.legalReplacementPattern}`
          : '  Include the exact package record declaration and repair every illegal field access in dependent files consistently.',
      ].join('\n'));
    } else if (detail.code === 'output_port_readback') {
      sections.push([
        `- ${detail.code}`,
        '  Introduce or reuse an internal mirror signal/variable for the computation and drive the out port from that internal object.',
        '  Preserve the external port interface exactly while repairing the internal implementation locally.',
      ].join('\n'));
    } else if (
      detail.code === 'numeric_std_operator_misuse'
      || detail.code === 'illegal_numeric_logical_hybrid'
      || detail.code === 'illegal_prefix_operator_form'
      || detail.code === 'resize_on_raw_std_logic_vector'
      || detail.code === 'resize_with_range_attribute'
      || detail.code === 'to_integer_on_raw_logic_type'
      || detail.code === 'typed_bitwise_mismatch'
      || detail.code === 'typed_unary_mismatch'
      || detail.code === 'typed_helper_actual_mismatch'
      || detail.code === 'typed_function_result_mismatch'
      || detail.code === 'typed_port_association_mismatch'
      || detail.code === 'shift_left_on_raw_std_logic_vector'
      || detail.code === 'shift_right_on_raw_std_logic_vector'
      || detail.code === 'enum_opcode_numeric_conversion_misuse'
    ) {
      sections.push([
        `- ${detail.code}`,
        '  Repair numeric_std typing locally: convert operands into unsigned/signed before resize, bitwise operations, shifts, or to_integer.',
        detail.code === 'enum_opcode_numeric_conversion_misuse'
          ? '  CPU instruction encodings must be std_logic_vector constants or integer constants. Do not call to_integer(...) on enum/custom opcode literals such as OP_ADD or OP_HALT.'
          : detail.code === 'illegal_prefix_operator_form'
          ? '  Replace function-style/prefix operator forms with legal infix VHDL operators on operands of matching type and width.'
          : '  Replace pseudo-boolean arithmetic hybrids with explicit comparisons or typed intermediate values.',
      ].join('\n'));
    } else if (detail.code === 'reserved_identifier') {
      sections.push([
        `- ${detail.code}`,
        '  Rename only the reserved-word identifiers that violate VHDL legality.',
        '  Use safe descriptive replacements and keep the rest of the file structure unchanged.',
      ].join('\n'));
    } else if (detail.code === 'simulation_unknown_metavalue') {
      sections.push([
        `- ${detail.code}`,
        '  Repair unknown/metavalue simulation behavior locally; do not mask the failure by weakening testbench checks.',
        '  In RTL: initialize every output, state register, flag, FIFO/status signal, and memory-visible control value on reset, and assign deterministic combinational defaults before case/if branches.',
        '  In the testbench: assert reset long enough, release it on a clock edge, wait at least one full clock after reset release before checking idle/status outputs, and avoid to_integer on vectors until they are known or explicitly guarded.',
        '  Preserve passing files/checks and repair only the files needed to remove U/X/metavalue behavior.',
      ].join('\n'));
    } else if (
      detail.code === 'alu_flag_behavior_mismatch'
      || detail.code === 'alu_result_behavior_mismatch'
    ) {
      sections.push([
        `- ${detail.code}`,
        '  Treat this as an ALU behavioral contract mismatch, not a syntax repair.',
        '  Fix the existing ALU RTL/TB behavior that caused the self-checking assertion to fail. Do not remove, weaken, skip, rename, or silence the assertion.',
        detail.assertionLabel ? `  Failing assertion label: ${detail.assertionLabel}.` : '  Use the failing ALU check assertion label from the evidence above.',
        detail.simulationTime ? `  Reported simulation time: ${detail.simulationTime}.` : '  Use the reported simulation time from the evidence above.',
        detail.expectedBehavior ? `  Expected behavior: ${detail.expectedBehavior}` : '  Expected behavior: ALU result and flags must match the self-checking TB golden model at the failing cycle.',
        detail.code === 'alu_flag_behavior_mismatch'
          ? '  For ADD_CARRY failures, compute carry from DATA_WIDTH+1 widened unsigned addition and use the MSB carry-out bit. Do not compute carry using `result > operand`, because that fails ordinary non-wrapping additions like 1+2.'
          : '',
        detail.code === 'alu_flag_behavior_mismatch'
          ? '  Keep zero/carry/overflow flags derived from the same operation and result timing as the data output; do not hard-code expected TB values.'
          : '',
        detail.code === 'alu_result_behavior_mismatch'
          ? '  Keep each ALU operation result aligned with the operation encoding/package constants and the TB expected values; repair the RTL operation logic or TB timing contract locally.'
          : '',
        '  Preserve the ALU package/entity interface unless the validator evidence proves the interface itself is illegal.',
        '  Preserve already-passing ALU checks and repair the smallest existing file set needed for result/flag consistency.',
      ].filter(Boolean).join('\n'));
    } else if (
      detail.code === 'cpu_halt_behavior_mismatch'
      || detail.code === 'cpu_reset_pc_behavior_mismatch'
      || detail.code === 'cpu_fetch_sequence_mismatch'
      || detail.code === 'cpu_control_signal_behavior_mismatch'
    ) {
      sections.push([
        `- ${detail.code}`,
        '  Treat this as a CPU behavioral contract mismatch, not a syntax repair.',
        '  Fix the RTL/TB behavioral contract that caused the reset/fetch/halt/control assertion to fail. Do not remove, weaken, skip, rename, or silence the assertion.',
        detail.assertionLabel ? `  Failing assertion label: ${detail.assertionLabel}.` : '  Use the failing CPU check assertion label from the evidence above.',
        detail.simulationTime ? `  Reported simulation time: ${detail.simulationTime}.` : '  Use the reported simulation time from the evidence above.',
        detail.expectedBehavior ? `  Expected behavior: ${detail.expectedBehavior}` : '  Expected behavior: CPU reset, fetch, PC, decoder, write-enable, and halt/control state must match the self-checking TB expectation at the failing cycle.',
        detail.code === 'cpu_reset_pc_behavior_mismatch'
          ? '  For PC-after-reset failures, align one legal contract: either hold PC at the reset value until the TB first checks it, or adjust TB sampling only if the RTL intentionally increments immediately after reset.'
          : '',
        detail.code === 'cpu_control_signal_behavior_mismatch'
          ? '  For control/write-enable failures, align opcode decode and write-enable timing with the TB sampled cycle; do not merely invert or delay the assertion.'
          : '',
        '  Inspect the provided instruction stimulus sequence and CPU decoder/control/top excerpts before choosing whether RTL control/decoder behavior or TB timing expectation is wrong.',
        '  Preserve already-passing checks and repair the smallest existing file set needed for CPU decoder/control/TB timing consistency.',
      ].filter(Boolean).join('\n'));
    } else if (
      detail.code === 'simulation_assertion_expected_actual_mismatch'
      || detail.code === 'simulation_valid_latency_mismatch'
    ) {
      sections.push([
        `- ${detail.code}`,
        '  Treat this as an exact self-checking simulation failure with file, line, time, and assertion text already supplied above.',
        '  Do not delete, weaken, skip, rename, or silence the failing assertion/report statement.',
        '  Repair the smallest existing RTL or testbench timing/behavior cause that makes the asserted expected value true at the reported simulation time.',
        '  Preserve already-passing checks and do not broadly regenerate unrelated files.',
      ].join('\n'));
    } else if (detail.code === 'ghdl_simulate_failure') {
      sections.push([
        `- ${detail.code}`,
        '  Treat this as a functional mismatch, not a syntax repair.',
        '  Repair the smallest existing RTL or testbench logic that contradicts the stated design behavior. Do not only edit expected values to hide a real DUT bug.',
        '  Preserve already-passing checks and rerun the same self-checking testbench behavior after the local fix.',
      ].join('\n'));
    } else if (
      detail.code === 'illegal_multidimensional_logic_vector'
      || detail.code === 'anonymous_array_object_declaration'
      || detail.code === 'reconstrained_subtype_alias'
    ) {
      sections.push([
        `- ${detail.code}`,
        '  Repair the array/subtype declaration locally without redesigning consuming logic unless the declaration itself forces a compatible type update.',
        detail.code === 'illegal_multidimensional_logic_vector'
          ? '  Replace packed vector-of-vector syntax with a named array type or a flattened legal vector.'
          : detail.code === 'anonymous_array_object_declaration'
            ? '  Do not declare objects with inline array(...) of ... syntax. Declare a named array type/subtype first, then declare the signal/variable with that named type.'
          : '  Remove illegal re-constraints from already constrained aliases, or derive a new legal subtype from the real base type.',
      ].join('\n'));
    } else if (
      detail.code === 'interface_arrow_syntax'
      || detail.code === 'undeclared_interface_dimension_reference'
      || detail.code === 'top_level_generic_default_missing'
      || detail.code === 'top_level_port_unconstrained'
    ) {
      sections.push([
        `- ${detail.code}`,
        '  Repair the interface declaration contract locally and keep external naming stable.',
        detail.code === 'interface_arrow_syntax'
          ? '  Use ":" inside entity/component generic and port declarations; reserve "=>" for maps and aggregates only.'
          : detail.code === 'undeclared_interface_dimension_reference'
            ? '  Declare every width/generic/constant before using it in a port, generic, or type declaration.'
            : detail.code === 'top_level_generic_default_missing'
              ? '  Add legal default values for top-level generics so the generated top/test flow remains analyzable and runnable.'
            : '  Constrain top-level simulation-facing ports explicitly instead of leaving dimensions open.',
      ].join('\n'));
    } else if (detail.code === 'source_order_dependency_inversion') {
      sections.push([
        `- ${detail.code}`,
        '  Repair the generated GHDL analysis_order and command plan only when the provider file already exists.',
        '  Move package declarations before all files that use work.<package>.all, move package bodies after their declarations, and move entities before testbenches that instantiate them.',
        '  Do not create duplicate package/entity files just to fix ordering. Do not rename units. Preserve generated file contents unless another failure code also requires code edits.',
      ].join('\n'));
    } else if (detail.code === 'missing_work_package_file') {
      sections.push([
        `- ${detail.code}`,
        '  Repair hierarchy completeness locally by generating the missing package source file, not by only editing analysis_order.',
        '  For every `use work.<package>.all` reference, ensure a generated VHDL source file declares exactly `package <package> is ... end package;` and is included before dependents in analysis_order.',
        '  If the package was accidental, remove the use clause and inline the needed declarations in a legal existing package/source. Do not leave dangling work package references.',
        '  Preserve already-passing generated files and stable top/testbench interfaces.',
      ].join('\n'));
    } else if (detail.code === 'unresolved_work_unit') {
      sections.push([
        `- ${detail.code}`,
        '  Repair hierarchy completeness locally. Do not only reorder compile commands when the referenced unit does not exist in the generated file set.',
        '  For every `entity work.<unit>` or `use work.<package>.all` reference, ensure a generated VHDL source file declares that exact entity/package and is included before dependents in analysis_order.',
        '  If the missing name ends in `_pkg` or `_package`, generate a real package file such as `src/<name>.vhd` containing `package <name> is ... end package;` and add it before every source that says `use work.<name>.all;`.',
        '  If the missing name is an entity/component, generate the matching entity/architecture file or remove the instantiation and inline the behavior.',
        '  Do not only add a missing unit to analysis_order. The file that declares the missing package/entity must also exist in the generated project.',
        '  If the missing unit was accidental, remove the instantiation/use and inline or simplify the logic so the project has no unresolved work references.',
        '  Regenerate or repair the minimum missing child files only; preserve already-passing generated files and stable top/testbench interfaces.',
      ].join('\n'));
    } else if (
      detail.code === 'missing_std_logic_1164_clause'
      || detail.code === 'missing_numeric_std_clause'
    ) {
      sections.push([
        `- ${detail.code}`,
        '  Add the required local IEEE library/use clauses in the same file that uses the referenced types or functions.',
        '  Do not rely on imports from other files, packages, or context outside the current file.',
      ].join('\n'));
    }
  }

  if (sections.length === 0) {
    return '';
  }

  return `Repair-loop caller guidance:\n${sections.join('\n')}`;
}

export function buildRepairLoopCallerContract(params: {
  validation: GeneratedVhdlValidationResult;
  repairAttempt?: number;
  repairAttemptLimit?: number;
}) {
  const attemptLine = typeof params.repairAttempt === 'number' && typeof params.repairAttemptLimit === 'number'
    ? `- Repair loop attempt: ${params.repairAttempt}/${params.repairAttemptLimit}`
    : null;
  const classSpecific = buildFailureCodeSpecificRepairShaping(params.validation);

  return [
    'Repair-loop caller contract:',
    '- This is a local continuation of the existing generated file set, not a fresh regeneration.',
    '- Fix the already generated files completely enough to pass the active validation gate.',
    '- Preserve files that are already passing unless a listed dependency must change with the target repair.',
    '- If several failure classes hit the same file, resolve all of them in the same replacement for that file.',
    '- Prefer the smallest coherent file-local correction that satisfies the validator and GHDL.',
    '- Do not redesign the project, rename unrelated interfaces, or introduce new files unless the listed failure requires it.',
    ...(attemptLine ? [attemptLine] : []),
    ...(classSpecific ? ['', classSpecific] : []),
  ].join('\n');
}

function requirePassingSimulationForMacro(params: {
  macroId: AiMacroId;
  validation: GeneratedVhdlValidationResult;
}) {
  const { macroId, validation } = params;
  if (!macroRequiresPassingSimulation(macroId)) {
    return validation;
  }
  if (!validation.ok) {
    return validation;
  }
  if (validation.stage === 'simulate') {
    return validation;
  }

  return {
    ...validation,
    ok: false,
    summary: `The generated output reached only the GHDL ${validation.stage} stage. This macro requires a full passing compile/elaborate/simulate flow before it can be accepted.`,
  };
}

export async function runAiAnalyzeJob(params: {
  ai: GoogleGenAI | null;
  selectedProvider: string;
  selectedModel: string;
  macroId: AiMacroId;
  tbGenerationMode: TbGenerationMode | null;
  systemPrompt: string;
  normalizedProjectPath: string;
  artifactDirectory: string | null;
  macroSpec: { label: string };
  hazardFindings: HazardFindingLike[];
  protocolFrames: ProtocolFrameLike[];
  session: LogicProSession;
  sessionManager: SessionManager;
  signal?: AbortSignal;
  getProviderDescriptors: () => Array<{ id: string; label: string }>;
  buildMacroPromptContract: (params: {
    macroId: AiMacroId;
    userQuery: string;
    tbGenerationMode: TbGenerationMode | null;
  }) => string;
  userQuery: string;
  preparedPrompt?: PreparedVhdlSkillPrompt | null;
  fpgaArchitectExecutionMode?: 'normal' | 'test_compact';
  enforceFpgaArchitectureContractGate?: boolean;
  approvedFpgaArchitectureContract?: FpgaArchitectureContract | null;
  applyMandatoryVhdlSkill: (taskPrompt: string) => Promise<{
    prompt: string;
    selection: DeterministicSkillSelection | null;
  }>;
  runModelAnalysis: (params: {
    ai: GoogleGenAI | null;
    provider: any;
    model: string;
    prompt: string;
    signal?: AbortSignal;
  }) => Promise<AiRunResult>;
  validateMacroOutput: (params: {
    macroId: AiMacroId;
    text: string;
    hazardFindings: HazardFindingLike[];
    protocolFrames: ProtocolFrameLike[];
  }) => AiMacroValidationResult;
  buildArtifactRetryPrompt: (params: {
    originalPrompt: string;
    macroId: AiMacroId;
    tbGenerationMode: TbGenerationMode | null;
    artifactDirectory: string;
    validationSummary: string;
    validationWarnings: string[];
  }) => string;
  buildValidationRetryPrompt: (params: {
    originalPrompt: string;
    macroId: AiMacroId;
    validationSummary: string;
    validationWarnings: string[];
  }) => string;
  extractGeneratedVhdlArtifacts: (text: string, macroId: AiMacroId) => ExtractedArtifact[];
  saveGeneratedVhdlArtifacts: (params: {
    projectPath: string;
    outputFolder: string;
    artifacts: ExtractedArtifact[];
  }) => Promise<{
    outputDirectory: string;
    savedArtifacts: SavedGeneratedVhdlArtifact[];
  }>;
  formatValidationFailureDetails: (validation: AiMacroValidationResult) => string;
  parseFpgaArchitectResponse?: (text: string) => FpgaArchitectProject;
  buildFpgaArchitectRetryPrompt?: (params: {
    originalPrompt: string;
    errorSummary: string;
  }) => string;
  buildFpgaArchitectJsonRepairPrompt?: (params: {
    originalPrompt: string;
    invalidResponse: string;
    errorSummary: string;
  }) => string;
  buildFpgaArchitectProjectStructureRepairPrompt?: (params: {
    originalPrompt: string;
    currentManifestSummary: string;
    errorSummary: string;
  }) => string;
  buildFpgaArchitectCompactRetryPrompt?: (params: {
    originalPrompt: string;
    errorSummary: string;
    compactMode?: 'compact' | 'ultra_compact' | 'minimal';
  }) => string;
  buildFpgaArchitectTestRunPrompt?: (params: {
    originalPrompt: string;
    compactMode?: 'ultra_compact' | 'minimal';
  }) => string;
  saveFpgaArchitectProject?: (params: {
    projectPath: string;
    project: FpgaArchitectProject;
  }) => Promise<{
    outputDirectory: string;
    savedFiles: SavedFpgaArchitectArtifact[];
  }>;
  buildFpgaArchitectMarkdownReport?: (params: {
    project: FpgaArchitectProject;
    outputDirectory: string;
  }) => string;
  validateGeneratedVhdlWithGhdl?: (params: {
    macroId: AiMacroId;
    projectPath: string;
    tbGenerationMode: TbGenerationMode | null;
    artifactDirectory: string | null;
    savedArtifacts: GeneratedVhdlArtifactForValidation[];
    architectProject?: FpgaArchitectProject | null;
  }) => Promise<GeneratedVhdlValidationResult>;
  onInnerRepairProgress?: (progress: {
    repairAttempt: number;
    repairTotal: number;
    failureCode: string;
    fileLine: string;
    status: string;
  }) => void | Promise<void>;
}) {
  const {
    ai,
    selectedProvider,
    selectedModel,
    macroId,
    tbGenerationMode,
    systemPrompt,
    normalizedProjectPath,
    artifactDirectory,
    macroSpec,
    hazardFindings,
    protocolFrames,
    session,
    sessionManager,
    signal,
    getProviderDescriptors,
    buildMacroPromptContract,
    userQuery,
    preparedPrompt,
    fpgaArchitectExecutionMode = 'normal',
    enforceFpgaArchitectureContractGate = false,
    approvedFpgaArchitectureContract = null,
    applyMandatoryVhdlSkill,
    runModelAnalysis,
    validateMacroOutput,
    buildArtifactRetryPrompt,
    buildValidationRetryPrompt,
    extractGeneratedVhdlArtifacts,
    saveGeneratedVhdlArtifacts,
    formatValidationFailureDetails,
    parseFpgaArchitectResponse,
    buildFpgaArchitectJsonRepairPrompt,
    buildFpgaArchitectProjectStructureRepairPrompt,
    buildFpgaArchitectCompactRetryPrompt,
    buildFpgaArchitectTestRunPrompt,
    saveFpgaArchitectProject,
    buildFpgaArchitectMarkdownReport,
    validateGeneratedVhdlWithGhdl,
    onInnerRepairProgress,
  } = params;

  const resolvedPreparedPrompt = preparedPrompt || await applyMandatoryVhdlSkill(buildMacroExecutionPrompt({
    systemPrompt,
    buildMacroPromptContract,
    macroId,
    userQuery,
    tbGenerationMode,
  }));
  const isFpgaArchitectMacro = macroId === 'fpga_vhdl_architect';
  const baseGenerationPrompt = isFpgaArchitectMacro
    && fpgaArchitectExecutionMode === 'test_compact'
    && buildFpgaArchitectTestRunPrompt
    ? buildFpgaArchitectTestRunPrompt({
      originalPrompt: resolvedPreparedPrompt.prompt,
      compactMode: 'minimal',
    })
    : resolvedPreparedPrompt.prompt;
  const deterministicSkillSelection = resolvedPreparedPrompt.selection;
  let retryUsed = false;
  let architectureContract = approvedFpgaArchitectureContract;
  const contractAttemptTelemetries: AiRunTelemetry[] = [];
  if (isFpgaArchitectMacro && enforceFpgaArchitectureContractGate && !architectureContract) {
    const contractResult = await proposeApprovedFpgaArchitectureContract({
      ai,
      provider: selectedProvider,
      model: selectedModel,
      userRequest: userQuery,
      signal,
      runModelAnalysis,
    });
    architectureContract = contractResult.contract;
    contractAttemptTelemetries.push(...contractResult.attempts.map((attempt) => attempt.telemetry));
    retryUsed = retryUsed || contractResult.repaired;
  }
  const initialPrompt = architectureContract
    ? `${baseGenerationPrompt}\n\n${buildApprovedFpgaArchitectureContractSection(architectureContract)}`
    : baseGenerationPrompt;
  let aiResult = await runModelAnalysis({
    ai,
    provider: selectedProvider,
    model: selectedModel,
    prompt: initialPrompt,
    signal,
  });
  const attemptTelemetries: AiRunTelemetry[] = [...contractAttemptTelemetries, aiResult.telemetry];
  let responseText = aiResult.text;
  let responseTelemetry = aiResult.telemetry;

  let validation = validateMacroOutput({
    macroId,
    text: responseText,
    hazardFindings,
    protocolFrames,
  });
  if (isFpgaArchitectMacro) {
    validation = {
      macroId,
      status: 'pass',
      summary: 'Structured FPGA architect JSON received.',
      warnings: [],
      checks: [],
    };
  }

  if (!isFpgaArchitectMacro && artifactDirectory) {
    const hasVhdlCodeFailure = validation.checks.some((check) => check.id === 'code:vhdl' && check.status === 'fail');
    const extractedInitialArtifacts = extractGeneratedVhdlArtifacts(responseText, macroId);
    const hasRequiredArtifact = macroId === 'generate_vhdl_tb'
      ? extractedInitialArtifacts.some((artifact) => artifact.kind === 'testbench')
      : extractedInitialArtifacts.length > 0;

    if (hasVhdlCodeFailure || !hasRequiredArtifact || validation.status === 'fail') {
      retryUsed = true;
      const retryPrompt = buildArtifactRetryPrompt({
        originalPrompt: initialPrompt,
        macroId,
        tbGenerationMode,
        artifactDirectory,
        validationSummary: validation.summary,
        validationWarnings: validation.warnings,
      });
      aiResult = await runModelAnalysis({
        ai,
        provider: selectedProvider,
        model: selectedModel,
        prompt: retryPrompt,
        signal,
      });
      attemptTelemetries.push(aiResult.telemetry);
      responseText = aiResult.text;
      responseTelemetry = aiResult.telemetry;

      validation = validateMacroOutput({
        macroId,
        text: responseText,
        hazardFindings,
        protocolFrames,
      });
    }
  } else if (macroId !== 'custom_query' && validation.status === 'fail') {
    retryUsed = true;
    const retryPrompt = buildValidationRetryPrompt({
      originalPrompt: initialPrompt,
      macroId,
      validationSummary: validation.summary,
      validationWarnings: validation.warnings,
    });
    aiResult = await runModelAnalysis({
      ai,
      provider: selectedProvider,
      model: selectedModel,
      prompt: retryPrompt,
      signal,
    });
    attemptTelemetries.push(aiResult.telemetry);
    responseText = aiResult.text;
    responseTelemetry = aiResult.telemetry;

    validation = validateMacroOutput({
      macroId,
      text: responseText,
      hazardFindings,
      protocolFrames,
    });
  }

  let outputDirectory: string | null = null;
  let savedGeneratedFiles: SavedGeneratedVhdlArtifact[] = [];
  let analysisText = responseText;
  let architectProject: FpgaArchitectProject | null = null;
  let ghdlValidation: GeneratedVhdlValidationResult | null = null;
  let repairableFiles: RepairableGeneratedFile[] = [];

  const appendGhdlValidationSummary = (text: string, validationResult: GeneratedVhdlValidationResult) => {
    const recentLogs = validationResult.logs.slice(-8);
    const logSection = recentLogs.length > 0
      ? `\nRecent validation log lines:\n${recentLogs.map((line) => `- ${line}`).join('\n')}`
      : '';
    return `${text.trimEnd()}\n\n## GHDL Validation\n- Status: PASS\n- Stage: ${validationResult.stage}\n- Summary: ${validationResult.summary}${logSection}\n`;
  };

  const normalizeArchitectProjectGhdlPlan = (project: FpgaArchitectProject | null) => {
    if (!project) return;

    const vhdlFiles = project.files
      .filter((file) => /\.(?:vhd|vhdl)$/i.test(file.path))
      .map((file) => ({
        path: path.normalize(file.path),
        content: file.content || '',
      }));
    if (vhdlFiles.length === 0) return;

    const fileByPath = new Map(vhdlFiles.map((file) => [file.path, file]));
    const providerByUnit = new Map<string, string>();
    for (const file of vhdlFiles) {
      for (const match of file.content.matchAll(/\bpackage\s+(?!body\b)([a-zA-Z][a-zA-Z0-9_]*)\s+is\b/gi)) {
        providerByUnit.set(match[1].toLowerCase(), file.path);
      }
      for (const match of file.content.matchAll(/\bentity\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\b/gi)) {
        providerByUnit.set(match[1].toLowerCase(), file.path);
      }
    }

    const requestedOrder = (project.ghdl.analysisOrder || [])
      .map((entry) => path.normalize(entry))
      .filter((entry) => fileByPath.has(entry));
    const orderedPaths = Array.from(new Set([
      ...requestedOrder,
      ...vhdlFiles.map((file) => file.path),
    ]));

    const dependenciesByPath = new Map<string, Set<string>>();
    for (const file of vhdlFiles) {
      const dependencies = new Set<string>();
      for (const match of file.content.matchAll(/\buse\s+work\.([a-zA-Z][a-zA-Z0-9_]*)(?:\.[a-zA-Z][a-zA-Z0-9_]*)?\s*;/gi)) {
        const providerPath = providerByUnit.get(match[1].toLowerCase());
        if (providerPath && providerPath !== file.path) dependencies.add(providerPath);
      }
      for (const match of file.content.matchAll(/\bentity\s+work\.([a-zA-Z][a-zA-Z0-9_]*)\b/gi)) {
        const providerPath = providerByUnit.get(match[1].toLowerCase());
        if (providerPath && providerPath !== file.path) dependencies.add(providerPath);
      }
      dependenciesByPath.set(file.path, dependencies);
    }

    const sorted: string[] = [];
    const pending = new Set(orderedPaths);
    while (pending.size > 0) {
      const ready = Array.from(pending).find((candidate) => {
        const dependencies = dependenciesByPath.get(candidate) || new Set<string>();
        return Array.from(dependencies).every((dependency) => !pending.has(dependency));
      });
      if (!ready) break;
      sorted.push(ready);
      pending.delete(ready);
    }
    sorted.push(...Array.from(pending));

    if (sorted.length > 0) {
      project.ghdl.analysisOrder = sorted;
      project.ghdl.runCommands = buildDeterministicArchitectGhdlRunCommands({
        analysisOrder: sorted,
        topTestbench: project.ghdl.topTestbench || '',
        vhdlStandard: project.vhdlStandard,
      });
    }
  };

  const parseAndGateFpgaArchitectProject = (text: string) => {
    if (!parseFpgaArchitectResponse) {
      throw new Error('FPGA Architect parser dependency is unavailable.');
    }
    const project = parseFpgaArchitectResponse(text);
    if (architectureContract) {
      assertFpgaArchitectProjectMatchesContract({
        project,
        contract: architectureContract,
      });
      attachFpgaArchitectureContractArtifact(project, architectureContract);
    }
    return project;
  };

  const repairFpgaArchitectManifestIfNeeded = async (currentResponseText: string) => {
    if (!parseFpgaArchitectResponse || !buildFpgaArchitectJsonRepairPrompt || !buildFpgaArchitectCompactRetryPrompt) {
      throw new Error('FPGA Architect JSON repair dependencies are unavailable.');
    }
    try {
      return parseAndGateFpgaArchitectProject(currentResponseText);
    } catch (error: any) {
      retryUsed = true;
      const repairPrompt = buildFpgaArchitectJsonRepairPrompt({
        originalPrompt: initialPrompt,
        invalidResponse: currentResponseText,
        errorSummary: error?.message || String(error),
      });
      aiResult = await runModelAnalysis({
        ai,
        provider: selectedProvider,
        model: selectedModel,
        prompt: repairPrompt,
        signal,
      });
      attemptTelemetries.push(aiResult.telemetry);
      responseText = aiResult.text;
      responseTelemetry = aiResult.telemetry;
      try {
        return parseAndGateFpgaArchitectProject(responseText);
      } catch (repairError: any) {
        const compactModes: Array<'compact' | 'ultra_compact' | 'minimal'> = ['compact', 'ultra_compact', 'minimal'];
        let lastCompactError: unknown = repairError;

        for (const compactMode of compactModes) {
          const compactRetryPrompt = buildFpgaArchitectCompactRetryPrompt({
            originalPrompt: initialPrompt,
            errorSummary: (lastCompactError as any)?.message || String(lastCompactError),
            compactMode,
          });
          aiResult = await runModelAnalysis({
            ai,
            provider: selectedProvider,
            model: selectedModel,
            prompt: compactRetryPrompt,
            signal,
          });
          attemptTelemetries.push(aiResult.telemetry);
          responseText = aiResult.text;
          responseTelemetry = aiResult.telemetry;
          try {
            return parseAndGateFpgaArchitectProject(responseText);
          } catch (compactError: any) {
            lastCompactError = compactError;
          }
        }

        throw lastCompactError instanceof Error ? lastCompactError : new Error(String(lastCompactError));
      }
    }
  };

  const attemptSharedGeneratedCodeRepair = async (params: {
    validationResult: GeneratedVhdlValidationResult;
    files: RepairableGeneratedFile[];
    repairAttempt?: number;
    repairAttemptLimit?: number;
  }) => {
    if (params.files.length === 0 || !validateGeneratedVhdlWithGhdl) {
      return null;
    }

    retryUsed = true;
    const repairAttemptNumber = params.repairAttempt || 1;
    const repairAttemptLimit = params.repairAttemptLimit || 1;
    let repairAudit = [...(params.validationResult.repairAudit || [])];
    const appendRepairAudit = (entry: GeneratedVhdlRepairAuditEntry) => {
      repairAudit = [
        ...repairAudit,
        entry,
      ];
    };
    const deterministicNoChangeKeys = new Set<string>();
    const getDeterministicNoChangeKey = (validation: GeneratedVhdlValidationResult) => [
      getRepairFailureCode(validation) || 'unknown_failure',
      summarizeRepairFailureLocation(validation) || 'unknown_location',
    ].join('\u0001');
    const syncArchitectProjectFilesFromRepairableFiles = (files: RepairableGeneratedFile[]) => {
      if (!architectProject) return;

      architectProject.files = architectProject.files.map((projectFile) => {
        const savedPath = projectFile.savedPath ? path.resolve(projectFile.savedPath) : null;
        const projectRelativePath = path.normalize(projectFile.path);
        const repaired = files.find((file) => {
          const absolutePath = path.resolve(file.absolutePath);
          const relativePath = path.normalize(file.relativePath);
          return (
            (savedPath !== null && absolutePath === savedPath)
            || relativePath.endsWith(projectRelativePath)
            || absolutePath.endsWith(projectRelativePath)
          );
        });
        return repaired ? { ...projectFile, content: repaired.content } : projectFile;
      });
      normalizeArchitectProjectGhdlPlan(architectProject);
    };

    const persistRepairableFiles = async (files: RepairableGeneratedFile[]) => {
      await Promise.all(files.map(async (file) => {
        await fs.mkdir(path.dirname(file.absolutePath), { recursive: true });
        await fs.writeFile(file.absolutePath, file.content, 'utf8');
      }));
    };

    const validateSynchronizedRepairableFiles = async (files: RepairableGeneratedFile[]) => {
      syncArchitectProjectFilesFromRepairableFiles(files);
      if (architectureContract && architectProject) {
        const contractValidation = validateFpgaArchitectProjectAgainstContract({
          project: architectProject,
          contract: architectureContract,
        });
        if (!contractValidation.ok) {
          const details = contractValidation.issues.map((issue) => ({
            code: issue.code,
            category: 'interface_generic_port_syntax' as const,
            message: `${issue.path}: ${issue.message}`,
            excerpt: issue.message.slice(0, 500),
            relativePath: issue.path.startsWith('$.') ? undefined : issue.path,
            forbiddenConstruct: 'Generated files or public interfaces that drift from the approved FPGA architecture contract.',
            legalReplacementPattern: 'Repair the existing generated file set so file names, declarations, ports, top entity, testbench, and analysis order exactly match the approved contract.',
          }));
          return {
            ok: false,
            stage: 'prevalidate' as const,
            summary: `Generated project drifted from the approved FPGA architecture contract: ${details.map((detail) => detail.message).join(' ')}`,
            logs: details.map((detail) => `ARCHITECTURE_CONTRACT | ${detail.message}`),
            validatedTopEntities: [],
            failureCode: details[0]?.code || 'architecture_contract_drift',
            failureCategory: 'interface_generic_port_syntax' as const,
            failureDetails: details,
          } satisfies GeneratedVhdlValidationResult;
        }
      }
      return requirePassingSimulationForMacro({
        macroId,
        validation: await validateGeneratedVhdlWithGhdl({
          macroId,
          projectPath: normalizedProjectPath,
          tbGenerationMode,
          artifactDirectory,
          savedArtifacts: files.map((file) => ({
            fileName: path.basename(file.relativePath),
            path: file.absolutePath,
            kind: file.kind,
          })),
          architectProject,
        }),
      });
    };

    const notifyInnerRepairProgress = async (validation: GeneratedVhdlValidationResult, status: string) => {
      await onInnerRepairProgress?.({
        repairAttempt: repairAttemptNumber,
        repairTotal: repairAttemptLimit,
        failureCode: getRepairFailureCode(validation) || 'unknown',
        fileLine: summarizeRepairFailureLocation(validation) || 'unknown',
        status,
      });
    };

    await notifyInnerRepairProgress(params.validationResult, 'starting');

    const runDeterministicRepairPasses = async (input: {
      files: RepairableGeneratedFile[];
      validation: GeneratedVhdlValidationResult;
    }) => {
      let deterministicFiles = input.files;
      let deterministicValidation = input.validation;
      let deterministicChangedAny = false;

      for (
        let deterministicPass = 1;
        deterministicPass <= GENERATED_CODE_MAX_DETERMINISTIC_REPAIR_PASSES;
        deterministicPass += 1
      ) {
        const beforeFiles = deterministicFiles;
        const beforeValidation = deterministicValidation;
        const noChangeKey = getDeterministicNoChangeKey(beforeValidation);
        if (deterministicNoChangeKeys.has(noChangeKey)) {
          appendRepairAudit({
            repairAttempt: repairAttemptNumber,
            failureCode: getRepairFailureCode(beforeValidation),
            fileLine: summarizeRepairFailureLocation(beforeValidation),
            repairType: 'deterministic_skipped',
            changedFiles: [],
            postRepairValidation: summarizePostRepairValidation(beforeValidation),
          });
          deterministicValidation = withRepairAudit(deterministicValidation, repairAudit);
          break;
        }
        const declarationScopeClusterActive = hasBundledDeclarationScopeCluster(deterministicValidation);
        const deterministicRepair = await applyDeterministicGeneratedCodeRepairs({
          validation: deterministicValidation,
          availableFiles: deterministicFiles,
        });
        if (!deterministicRepair.changed) {
          deterministicNoChangeKeys.add(noChangeKey);
          break;
        }

        deterministicChangedAny = true;
        deterministicFiles = deterministicRepair.repairedFiles;
        await persistRepairableFiles(deterministicFiles);
        deterministicValidation = await validateSynchronizedRepairableFiles(deterministicFiles);
        appendRepairAudit({
          repairAttempt: repairAttemptNumber,
          failureCode: getRepairFailureCode(beforeValidation),
          fileLine: summarizeRepairFailureLocation(beforeValidation),
          repairType: 'deterministic',
          changedFiles: collectChangedRepairPaths(beforeFiles, deterministicFiles),
          postRepairValidation: summarizePostRepairValidation(deterministicValidation),
        });
        deterministicValidation = withRepairAudit(deterministicValidation, repairAudit);
        if (deterministicValidation.ok) {
          break;
        }
        if (declarationScopeClusterActive && hasBundledDeclarationScopeCluster(deterministicValidation)) {
          continue;
        }
      }

      return {
        files: deterministicFiles,
        validation: deterministicValidation,
        changed: deterministicChangedAny,
      };
    };

    const deterministicBeforeLlm = await runDeterministicRepairPasses({
      files: params.files,
      validation: params.validationResult,
    });

    if (deterministicBeforeLlm.changed) {
      if (deterministicBeforeLlm.validation.ok) {
        return {
          repairedFiles: deterministicBeforeLlm.files,
          validationResult: deterministicBeforeLlm.validation,
          parsedRepairs: deterministicBeforeLlm.files
            .filter((file) => {
              const before = params.files.find((candidate) => candidate.absolutePath === file.absolutePath);
              return before && before.content !== file.content;
            })
            .map((file) => ({
              relativePath: file.relativePath,
              content: file.content,
            })),
        };
      }
      params = {
        ...params,
        files: deterministicBeforeLlm.files,
        validationResult: deterministicBeforeLlm.validation,
      };
    }

    const repairPrompt = `${buildGeneratedCodeRepairPrompt({
      originalPrompt: initialPrompt,
      macroId,
      macroLabel: macroSpec.label,
      validation: params.validationResult,
      availableFiles: params.files,
    })}\n\n${buildRepairLoopCallerContract({
      validation: params.validationResult,
      repairAttempt: params.repairAttempt,
      repairAttemptLimit: params.repairAttemptLimit,
    })}\n`;
    await notifyInnerRepairProgress(params.validationResult, 'model_repair');
    aiResult = await runModelAnalysis({
      ai,
      provider: selectedProvider,
      model: selectedModel,
      prompt: repairPrompt,
      signal,
    });
    attemptTelemetries.push(aiResult.telemetry);
    responseText = aiResult.text;
    responseTelemetry = aiResult.telemetry;

    const parsedRepairs = parseGeneratedCodeRepairs({
      text: responseText,
      allowedFiles: params.files,
    });

    if (parsedRepairs.length === 0) {
      appendRepairAudit({
        repairAttempt: repairAttemptNumber,
        failureCode: getRepairFailureCode(params.validationResult),
        fileLine: summarizeRepairFailureLocation(params.validationResult),
        repairType: 'llm_no_change',
        changedFiles: [],
        postRepairValidation: summarizePostRepairValidation(params.validationResult),
      });
      return {
        repairedFiles: params.files,
        validationResult: withRepairAudit(params.validationResult, repairAudit),
        parsedRepairs,
      };
    }

    const beforeLlmFiles = params.files;
    const beforeLlmValidation = params.validationResult;
    const updatedFiles = await applyGeneratedCodeRepairs({
      availableFiles: params.files,
      repairs: parsedRepairs,
    });
    let repairedValidation = await validateSynchronizedRepairableFiles(updatedFiles);
    const previousFailureCode = getRepairFailureCode(beforeLlmValidation);
    const newFailureCode = getRepairFailureCode(repairedValidation);
    const introducedNewStaticFailure =
      !repairedValidation.ok
      && beforeLlmValidation.stage === 'simulate'
      && (repairedValidation.stage === 'prevalidate' || repairedValidation.stage === 'analyze' || repairedValidation.stage === 'elaborate')
      && previousFailureCode !== newFailureCode;
    repairedValidation = {
      ...repairedValidation,
      logs: [
        ...repairedValidation.logs,
        [
          'REPAIR_REGRESSION_GUARD',
          `introducedNewStaticFailure=${introducedNewStaticFailure ? 'yes' : 'no'}`,
          `previousFailureCode=${previousFailureCode || 'unknown'}`,
          `newFailureCode=${newFailureCode || 'unknown'}`,
          `changedFiles=${collectChangedRepairPaths(beforeLlmFiles, updatedFiles).join(', ') || 'none'}`,
        ].join(' | '),
      ],
    };
    appendRepairAudit({
      repairAttempt: repairAttemptNumber,
      failureCode: getRepairFailureCode(beforeLlmValidation),
      fileLine: summarizeRepairFailureLocation(beforeLlmValidation),
      repairType: collectChangedRepairPaths(beforeLlmFiles, updatedFiles).length > 0 ? 'llm' : 'llm_no_change',
      changedFiles: collectChangedRepairPaths(beforeLlmFiles, updatedFiles),
      postRepairValidation: summarizePostRepairValidation(repairedValidation),
    });

    const deterministicAfterLlm = repairedValidation.ok
      ? {
        files: updatedFiles,
        validation: withRepairAudit(repairedValidation, repairAudit),
        changed: false,
      }
      : await runDeterministicRepairPasses({
        files: updatedFiles,
        validation: withRepairAudit(repairedValidation, repairAudit),
      });

    return {
      repairedFiles: deterministicAfterLlm.files,
      validationResult: withRepairAudit(deterministicAfterLlm.validation, repairAudit),
      parsedRepairs,
    };
  };

  const saveAndValidateArchitectProject = async (project: FpgaArchitectProject) => {
    if (architectureContract) {
      assertFpgaArchitectProjectMatchesContract({ project, contract: architectureContract });
      attachFpgaArchitectureContractArtifact(project, architectureContract);
    }
    const saveResult = await saveFpgaArchitectProject!({
      projectPath: normalizedProjectPath,
      project,
    }) as SavedArchitectProjectResult;
    outputDirectory = saveResult.outputDirectory;
    savedGeneratedFiles = saveResult.savedFiles.map((file) => ({
      fileName: file.name,
      content: file.content,
      kind: file.kind,
      path: file.path,
    }));
    project.files = project.files.map((file) => {
      const saved = saveResult.savedFiles.find((savedFile) => savedFile.path.endsWith(path.normalize(file.path)));
      return saved ? { ...file, savedPath: saved.path } : file;
    });
    normalizeArchitectProjectGhdlPlan(project);
    repairableFiles = saveResult.savedFiles
      .filter((file) => file.path.toLowerCase().endsWith('.vhd') || file.path.toLowerCase().endsWith('.vhdl'))
      .map((file) => ({
        relativePath: path.relative(normalizedProjectPath, file.path),
        absolutePath: file.path,
        content: file.content,
        kind: file.kind,
      }));

    let validationResult: GeneratedVhdlValidationResult | null = null;
    if (validateGeneratedVhdlWithGhdl) {
      validationResult = requirePassingSimulationForMacro({
        macroId,
        validation: await validateGeneratedVhdlWithGhdl({
          macroId,
          projectPath: normalizedProjectPath,
          tbGenerationMode,
          artifactDirectory,
          savedArtifacts: saveResult.savedFiles.map((file) => ({
            fileName: file.name,
            path: file.path,
            kind: file.kind,
          })),
          architectProject: project,
        }),
      });
    }

    return { saveResult, validationResult };
  };

  const attemptFpgaArchitectProjectStructureRepair = async (validationResult: GeneratedVhdlValidationResult) => {
    if (
      !architectProject
      || !parseFpgaArchitectResponse
      || !buildFpgaArchitectProjectStructureRepairPrompt
      || !saveFpgaArchitectProject
      || !validateGeneratedVhdlWithGhdl
    ) {
      return false;
    }

    let latestValidation = validationResult;
    for (
      let structureRepairAttempt = 1;
      structureRepairAttempt <= FPGA_ARCHITECT_MAX_PROJECT_STRUCTURE_REPAIR_ATTEMPTS;
      structureRepairAttempt += 1
    ) {
      retryUsed = true;
      const structureRepairPrompt = buildFpgaArchitectProjectStructureRepairPrompt({
        originalPrompt: initialPrompt,
        currentManifestSummary: buildFpgaArchitectProjectStructureSnapshot(architectProject),
        errorSummary: compactGeneratedVhdlValidationSummary(latestValidation),
      });
      aiResult = await runModelAnalysis({
        ai,
        provider: selectedProvider,
        model: selectedModel,
        prompt: structureRepairPrompt,
        signal,
      });
      attemptTelemetries.push(aiResult.telemetry);
      responseText = aiResult.text;
      responseTelemetry = aiResult.telemetry;

      try {
        architectProject = await repairFpgaArchitectManifestIfNeeded(responseText);
      } catch (error: any) {
        latestValidation = {
          ok: false,
          stage: 'prevalidate',
          summary: `Project structure repair returned an invalid manifest: ${error?.message || String(error)}`,
          logs: [],
          validatedTopEntities: [],
          failureCode: 'unresolved_work_unit',
          failureCategory: 'unresolved_work_unit',
          failureDetails: [{
            code: 'unresolved_work_unit',
            category: 'unresolved_work_unit',
            message: `Project structure repair returned an invalid manifest: ${error?.message || String(error)}`,
            excerpt: String(error?.message || error || '').slice(0, 500),
            forbiddenConstruct: 'Incomplete or invalid FPGA Architect project manifest after missing work-unit repair.',
            legalReplacementPattern: 'Return one complete manifest with all referenced work entities/packages generated and listed in ghdl.analysis_order.',
          }],
        };
        ghdlValidation = latestValidation;
        continue;
      }

      const repairedSaveResult = await saveAndValidateArchitectProject(architectProject);
      latestValidation = repairedSaveResult.validationResult || {
        ok: true,
        stage: 'simulate',
        summary: 'Project structure repair completed without GHDL validation.',
        logs: [],
        validatedTopEntities: [],
      };
      ghdlValidation = latestValidation;
      if (!isFpgaArchitectProjectStructureContractFailure(latestValidation)) {
        return true;
      }
    }

    return false;
  };

  if (isFpgaArchitectMacro) {
    if (!parseFpgaArchitectResponse || !saveFpgaArchitectProject || !buildFpgaArchitectMarkdownReport || !buildFpgaArchitectJsonRepairPrompt || !buildFpgaArchitectCompactRetryPrompt) {
      throw new Error('FPGA Architect save/report dependencies are unavailable.');
    }
    if (!normalizedProjectPath) {
      throw new Error('FPGA Architect requires an opened project folder so the generated project can be saved.');
    }

    try {
      architectProject = await repairFpgaArchitectManifestIfNeeded(responseText);
    } catch (error: any) {
      throw buildAnnotatedAiAnalyzeError(
        `FPGA Architect hard-failed because the generated project manifest was still invalid before VHDL validation. The app did not modify or auto-fix any generated VHDL files. ${error?.message || String(error)}`,
        { fpgaArchitectureContract: architectureContract },
      );
    }

    let saveResult = await saveAndValidateArchitectProject(architectProject);
    ghdlValidation = saveResult.validationResult;

    if (isFpgaArchitectProjectStructureContractFailure(ghdlValidation)) {
      await attemptFpgaArchitectProjectStructureRepair(ghdlValidation!);
      if (isFpgaArchitectProjectStructureContractFailure(ghdlValidation)) {
        throw buildAnnotatedAiAnalyzeError(
          `FPGA Architect hard-failed because the generated project did not pass the project-structure contract after ${FPGA_ARCHITECT_MAX_PROJECT_STRUCTURE_REPAIR_ATTEMPTS} structure repair attempt(s). The app did not spend generic VHDL repair attempts on missing generated work units. ${ghdlValidation!.summary}`,
          {
            generatedVhdlValidation: ghdlValidation,
            fpgaArchitectureContract: architectureContract,
          },
        );
      }
    }

    if (ghdlValidation && !ghdlValidation.ok) {
      for (
        let repairAttempt = 1;
        repairAttempt <= FPGA_ARCHITECT_MAX_INNER_REPAIR_ATTEMPTS && ghdlValidation && !ghdlValidation.ok;
        repairAttempt += 1
      ) {
        const sharedRepair = await attemptSharedGeneratedCodeRepair({
          validationResult: ghdlValidation,
          files: repairableFiles,
          repairAttempt,
          repairAttemptLimit: FPGA_ARCHITECT_MAX_INNER_REPAIR_ATTEMPTS,
        });
        if (!sharedRepair) {
          break;
        }
        const previousRepairableFiles = repairableFiles;
        repairableFiles = sharedRepair.repairedFiles;
        ghdlValidation = sharedRepair.validationResult;
        const changedArtifactPaths = repairableFiles
          .filter((file) => {
            const previous = previousRepairableFiles.find((candidate) => candidate.absolutePath === file.absolutePath);
            return previous && previous.content !== file.content;
          })
          .map((file) => file.absolutePath);
        if (changedArtifactPaths.length > 0) {
          savedGeneratedFiles = savedGeneratedFiles.map((artifact) => {
            const repaired = repairableFiles.find((file) => file.absolutePath === artifact.path);
            return repaired ? { ...artifact, content: repaired.content } : artifact;
          });
          if (architectProject) {
            architectProject.files = architectProject.files.map((file) => {
              const repaired = repairableFiles.find((candidate) => candidate.absolutePath === file.savedPath);
              return repaired ? { ...file, content: repaired.content } : file;
            });
          }
        }
      }

      if (ghdlValidation && !ghdlValidation.ok) {
        const retryValidationLabel = describeValidationGate(ghdlValidation.stage);
        throw buildAnnotatedAiAnalyzeError(
          `FPGA Architect hard-failed because the generated project did not pass ${retryValidationLabel} after ${FPGA_ARCHITECT_MAX_INNER_REPAIR_ATTEMPTS} repair attempt(s). The app does not auto-fix VHDL file issues. ${ghdlValidation.summary}`,
          {
            generatedVhdlValidation: ghdlValidation,
            fpgaArchitectureContract: architectureContract,
          },
        );
      }
    }

    analysisText = buildFpgaArchitectMarkdownReport({
      project: architectProject,
      outputDirectory,
    });
    if (ghdlValidation?.ok) {
      analysisText = appendGhdlValidationSummary(analysisText, ghdlValidation);
    }
  } else if (artifactDirectory) {
    const extractedArtifacts = extractGeneratedVhdlArtifacts(responseText, macroId);
    const hasVhdlCodeFailure = validation.checks.some((check) => check.id === 'code:vhdl' && check.status === 'fail');
    const hasRequiredArtifact = macroId === 'generate_vhdl_tb'
      ? extractedArtifacts.some((artifact) => artifact.kind === 'testbench')
      : extractedArtifacts.length > 0;

    if (hasVhdlCodeFailure || extractedArtifacts.length === 0 || !hasRequiredArtifact || validation.status === 'fail') {
      const failureReasons = [
        hasVhdlCodeFailure ? 'no tagged VHDL code block was returned' : null,
        extractedArtifacts.length === 0 ? 'no extractable VHDL artifacts were found' : null,
        macroId === 'generate_vhdl_tb' && !hasRequiredArtifact ? 'no VHDL testbench artifact was identified' : null,
        validation.status === 'fail'
          ? `macro validation still failed (${formatValidationFailureDetails(validation)})`
          : null,
      ].filter(Boolean).join('; ');
      const retryNote = retryUsed ? ' The stricter automatic retry was attempted and still did not produce valid artifact code.' : '';
      throw new Error(`${macroSpec.label} hard-failed because ${failureReasons}.${retryNote}`);
    }

    const saveResult = await saveGeneratedVhdlArtifacts({
      projectPath: normalizedProjectPath,
      outputFolder: artifactDirectory,
      artifacts: extractedArtifacts,
    });
    outputDirectory = saveResult.outputDirectory;
    savedGeneratedFiles = saveResult.savedArtifacts;
    repairableFiles = saveResult.savedArtifacts
      .filter((artifact) => artifact.path.toLowerCase().endsWith('.vhd') || artifact.path.toLowerCase().endsWith('.vhdl'))
      .map((artifact) => ({
        relativePath: path.relative(normalizedProjectPath, artifact.path),
        absolutePath: artifact.path,
        content: artifact.content,
        kind: artifact.kind,
      }));
    if (validateGeneratedVhdlWithGhdl && ['generate_vhdl_tb', 'draft_rtl_skeleton'].includes(macroId)) {
      ghdlValidation = requirePassingSimulationForMacro({
        macroId,
        validation: await validateGeneratedVhdlWithGhdl({
          macroId,
          projectPath: normalizedProjectPath,
          tbGenerationMode,
          artifactDirectory,
          savedArtifacts: saveResult.savedArtifacts.map((artifact) => ({
            fileName: artifact.fileName,
            path: artifact.path,
            kind: artifact.kind,
          })),
        }),
      });

      if (!ghdlValidation.ok) {
        const sharedRepair = await attemptSharedGeneratedCodeRepair({
          validationResult: ghdlValidation,
          files: repairableFiles,
        });
        if (sharedRepair?.parsedRepairs.length) {
          repairableFiles = sharedRepair.repairedFiles;
          ghdlValidation = sharedRepair.validationResult;
          savedGeneratedFiles = savedGeneratedFiles.map((artifact) => {
            const repaired = repairableFiles.find((file) => file.absolutePath === artifact.path);
            return repaired ? { ...artifact, content: repaired.content } : artifact;
          });
        }

        if (!ghdlValidation.ok) {
          const validationLabel = describeValidationGate(ghdlValidation.stage);
          throw new Error(`${macroSpec.label} hard-failed because the generated VHDL did not pass ${validationLabel}. The app does not auto-fix VHDL file issues. ${ghdlValidation.summary}`);
        }
      }
    }

    analysisText = `${responseText.trimEnd()}\n\n## Saved Generated Files\n${savedGeneratedFiles
      .map((artifact) => `- ${path.relative(normalizedProjectPath, artifact.path)}`)
      .join('\n')}\n`;
    if (ghdlValidation?.ok) {
      analysisText = appendGhdlValidationSummary(analysisText, ghdlValidation);
    }
  }

  const latestAttemptInputTokens = responseTelemetry.inputTokens;
  const reportedAttemptInputTokens = attemptTelemetries
    .map((telemetry) => telemetry.inputTokens)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const reportedAttemptOutputTokens = attemptTelemetries
    .map((telemetry) => telemetry.outputTokens)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const jobInputTokens = reportedAttemptInputTokens.length > 0
    ? reportedAttemptInputTokens.reduce((sum, value) => sum + value, 0)
    : null;
  const jobOutputTokens = reportedAttemptOutputTokens.length > 0
    ? reportedAttemptOutputTokens.reduce((sum, value) => sum + value, 0)
    : null;
  const sessionAiTokenTotals = sessionManager.accumulateAiTokens(session, {
    inputTokens: jobInputTokens ?? undefined,
    outputTokens: jobOutputTokens ?? undefined,
  });

  return {
    analysis: analysisText,
    provider: selectedProvider,
    model: selectedModel,
    telemetry: {
      engineLabel: getProviderDescriptors().find((entry) => entry.id === selectedProvider)?.label || selectedProvider,
      inputTokens: latestAttemptInputTokens,
      latestAttemptInputTokens,
      jobInputTokens,
      attemptCount: attemptTelemetries.length,
      retryCount: Math.max(0, attemptTelemetries.length - 1 - (contractAttemptTelemetries.length > 0 ? 1 : 0)),
      sessionInputTokens: sessionAiTokenTotals.inputTokens,
      outputTokens: responseTelemetry.outputTokens,
      jobOutputTokens,
      sessionOutputTokens: sessionAiTokenTotals.outputTokens,
      tokensPerSecond: responseTelemetry.tokensPerSecond,
      endToEndTokensPerSecond: responseTelemetry.endToEndTokensPerSecond,
      durationMs: responseTelemetry.durationMs,
    },
    retryUsed,
    outputDirectory,
    generatedFiles: savedGeneratedFiles.map((artifact) => ({
      name: artifact.fileName,
      path: artifact.path,
      kind: artifact.kind,
    })),
    architectProject: architectProject ? {
      ...architectProject,
      outputDirectory,
      files: architectProject.files.map((file) => ({
        ...file,
        savedPath: file.savedPath || path.join(outputDirectory || normalizedProjectPath, file.path),
      })),
    } : null,
    architectureContract,
    validation,
    deterministicSkillSelection,
  };
}
