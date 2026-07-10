import { inferFailureDetailsFromGhdlMessage } from './generatedVhdlValidation';
import { getCanonicalRuleIdsForFailureCode } from './vhdlSkillRules';

export type FpgaArchitectLoopFailureCategory =
  | 'manifest_structure'
  | 'provider_runtime'
  | 'reserved_identifier'
  | 'missing_ieee_clause'
  | 'architecture_variable'
  | 'procedure_scope'
  | 'numeric_std_typing'
  | 'package_body_misuse'
  | 'array_subtype_misuse'
  | 'signal_variable_assignment_misuse'
  | 'interface_declaration_misuse'
  | 'width_literal_mismatch'
  | 'runtime_bound_risk'
  | 'top_level_generic_default'
  | 'top_level_port_constraint'
  | 'standard_group_misuse'
  | 'command_contract'
  | 'source_order_contract'
  | 'architecture_target_ambiguity'
  | 'rtl_tb_construct_misuse'
  | 'textio_policy'
  | 'waveform_contract'
  | 'generated_clock'
  | 'mixed_clock_edge'
  | 'illegal_operator_usage'
  | 'unresolved_work_unit'
  | 'simulation_assertion'
  | 'source_selection'
  | 'other';

export type FpgaArchitectLoopFailureDiagnostic = {
  category: FpgaArchitectLoopFailureCategory;
  label: string;
  ruleIds: string[];
  signature: string;
  normalizedMessage: string;
  excerpt: string;
};

export type FpgaArchitectLoopFailureBucket = {
  category: FpgaArchitectLoopFailureCategory;
  label: string;
  ruleIds: string[];
  count: number;
  attempts: number[];
  signature: string;
  example: string;
};

const CATEGORY_LABELS: Record<FpgaArchitectLoopFailureCategory, string> = {
  manifest_structure: 'Manifest / JSON Structure',
  provider_runtime: 'Provider / Runtime',
  reserved_identifier: 'Reserved Identifier',
  missing_ieee_clause: 'Missing IEEE Clause',
  architecture_variable: 'Architecture Declarative Scope',
  procedure_scope: 'Procedure / Testbench Scope',
  numeric_std_typing: 'numeric_std Typing',
  package_body_misuse: 'Package / Body Misuse',
  array_subtype_misuse: 'Array / Subtype Misuse',
  signal_variable_assignment_misuse: 'Signal vs Variable Assignment',
  interface_declaration_misuse: 'Interface / Generic Declaration',
  width_literal_mismatch: 'Width / Literal Mismatch',
  runtime_bound_risk: 'Runtime Bound Risk',
  top_level_generic_default: 'Top-Level Generic Defaults',
  top_level_port_constraint: 'Top-Level Port Constraints',
  standard_group_misuse: 'VHDL Standard Group',
  command_contract: 'GHDL Command Contract',
  source_order_contract: 'Source Order Contract',
  architecture_target_ambiguity: 'Architecture Target Ambiguity',
  rtl_tb_construct_misuse: 'RTL vs Testbench Construct Misuse',
  textio_policy: 'TextIO Policy',
  waveform_contract: 'Waveform Contract',
  generated_clock: 'Generated Clock',
  mixed_clock_edge: 'Mixed Clock Edge',
  illegal_operator_usage: 'Illegal Operator Usage',
  unresolved_work_unit: 'Unresolved Work Unit',
  simulation_assertion: 'Simulation Assertion',
  source_selection: 'Validation Source Selection',
  other: 'Other',
};

const CATEGORY_FAILURE_CODE_MAP: Partial<Record<FpgaArchitectLoopFailureCategory, string>> = {
  manifest_structure: 'no_generated_artifacts',
  reserved_identifier: 'reserved_identifier',
  missing_ieee_clause: 'missing_std_logic_1164_clause',
  architecture_variable: 'architecture_body_variable',
  procedure_scope: 'procedure_outer_scope_write',
  numeric_std_typing: 'resize_on_raw_std_logic_vector',
  package_body_misuse: 'subprogram_body_inside_package_declaration',
  array_subtype_misuse: 'illegal_multidimensional_logic_vector',
  signal_variable_assignment_misuse: 'variable_assigned_with_signal_operator',
  interface_declaration_misuse: 'undeclared_interface_dimension_reference',
  width_literal_mismatch: 'verilog_style_literal',
  runtime_bound_risk: 'runtime_bound_check_risk',
  top_level_generic_default: 'top_level_generic_default_missing',
  top_level_port_constraint: 'top_level_port_unconstrained',
  standard_group_misuse: 'mixed_vhdl_standard_group',
  command_contract: 'missing_ghdl_command_contract',
  source_order_contract: 'invalid_source_order_contract',
  architecture_target_ambiguity: 'multiple_architecture_elaboration_ambiguity',
  rtl_tb_construct_misuse: 'rtl_contains_tb_only_construct',
  textio_policy: 'unsupported_textio_package_policy',
  waveform_contract: 'missing_waveform_generation_contract',
  generated_clock: 'generated_clock_in_rtl',
  mixed_clock_edge: 'mixed_clock_edge_domain',
  unresolved_work_unit: 'unresolved_work_unit',
  source_selection: 'source_selection',
  simulation_assertion: 'ghdl_simulate_failure',
};

function mapGeneratedFailureCodeToLoopCategory(code: string): FpgaArchitectLoopFailureCategory | null {
  switch (code) {
    case 'reserved_identifier':
      return 'reserved_identifier';
    case 'missing_std_logic_1164_clause':
    case 'missing_numeric_std_clause':
    case 'missing_std_logic_textio_clause':
      return 'missing_ieee_clause';
    case 'architecture_body_variable':
      return 'architecture_variable';
    case 'procedure_outer_scope_write':
    case 'declaration_after_begin':
      return 'procedure_scope';
    case 'subprogram_body_inside_package_declaration':
    case 'package_missing_ieee_import':
    case 'constrained_scalar_subtype_alias':
      return 'package_body_misuse';
    case 'illegal_multidimensional_logic_vector':
    case 'reconstrained_array_subtype':
    case 'anonymous_array_object_declaration':
      return 'array_subtype_misuse';
    case 'variable_assigned_with_signal_operator':
    case 'signal_assigned_with_variable_operator':
      return 'signal_variable_assignment_misuse';
    case 'undeclared_interface_dimension_reference':
      return 'interface_declaration_misuse';
    case 'verilog_style_literal':
    case 'scalar_bit_string_assignment':
      return 'width_literal_mismatch';
    case 'runtime_bound_check_risk':
      return 'runtime_bound_risk';
    case 'top_level_generic_default_missing':
      return 'top_level_generic_default';
    case 'top_level_port_unconstrained':
      return 'top_level_port_constraint';
    case 'mixed_vhdl_standard_group':
      return 'standard_group_misuse';
    case 'missing_ghdl_command_contract':
      return 'command_contract';
    case 'invalid_source_order_contract':
      return 'source_order_contract';
    case 'multiple_architecture_elaboration_ambiguity':
      return 'architecture_target_ambiguity';
    case 'rtl_contains_tb_only_construct':
      return 'rtl_tb_construct_misuse';
    case 'unsupported_textio_package_policy':
      return 'textio_policy';
    case 'missing_waveform_generation_contract':
      return 'waveform_contract';
    case 'generated_clock_in_rtl':
      return 'generated_clock';
    case 'mixed_clock_edge_domain':
      return 'mixed_clock_edge';
    case 'resize_on_raw_std_logic_vector':
    case 'resize_with_range_attribute':
    case 'to_integer_on_raw_logic_type':
    case 'typed_function_result_mismatch':
    case 'typed_port_association_mismatch':
    case 'typed_helper_actual_mismatch':
    case 'typed_bitwise_mismatch':
      return 'numeric_std_typing';
    case 'illegal_numeric_logical_hybrid':
    case 'illegal_prefix_operator_form':
      return 'illegal_operator_usage';
    case 'unresolved_work_unit':
      return 'unresolved_work_unit';
    case 'source_selection':
      return 'source_selection';
    case 'ghdl_simulate_failure':
      return 'simulation_assertion';
    default:
      return null;
  }
}

function trimExcerpt(message: string, maxLength = 220) {
  const compact = message.replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 3)}...`;
}

function normalizeFailureMessage(message: string) {
  return message
    .toLowerCase()
    .replace(/\/users\/[^ \n:]+/g, '<path>')
    .replace(/[a-z]:\\[^ \n:]+/gi, '<path>')
    .replace(/:\d+:\d+(?::@\d+(?:fs|ps|ns|us|ms|s))?/g, ':#:#')
    .replace(/@\d+(?:fs|ps|ns|us|ms|s)/g, '@<time>')
    .replace(/\b\d+\b/g, '#')
    .replace(/\s+/g, ' ')
    .trim();
}

export function classifyFpgaArchitectLoopFailure(message: string): FpgaArchitectLoopFailureDiagnostic {
  const normalizedMessage = normalizeFailureMessage(message);
  let category: FpgaArchitectLoopFailureCategory = 'other';

  const inferredDetails = inferFailureDetailsFromGhdlMessage(message);
  const inferredCategory = inferredDetails
    .map((detail) => mapGeneratedFailureCodeToLoopCategory(detail.code))
    .find((mappedCategory): mappedCategory is FpgaArchitectLoopFailureCategory => Boolean(mappedCategory));
  if (inferredCategory) {
    category = inferredCategory;
  }

  if (category === 'other' && (
    /manifest was still invalid|json fallback was not valid|markdown manifest was invalid|project json was still invalid|project manifest was still invalid/i.test(message)
  )) {
    category = 'manifest_structure';
  } else if (category === 'other' && (
    /fetch failed|text generation failed|provider may be unavailable|no response generated from ollama|connection refused|econnrefused|socket hang up|timed out|network error|provider unavailable|could not reach ollama|ollama is reachable .* but text generation failed/i.test(message)
  )) {
    category = 'provider_runtime';
  } else if (category === 'other' && /reserved vhdl identifier|uses reserved vhdl identifier/i.test(message)) {
    category = 'reserved_identifier';
  } else if (category === 'other' && (
    /without a local "use ieee|no declaration for "std_logic|no declaration for "std_logic_vector|no declaration for "std_ulogic/i.test(message)
  )) {
    category = 'missing_ieee_clause';
  } else if (category === 'other' && /plain architecture-body variable|non-shared variable declaration not allowed in architecture body/i.test(message)) {
    category = 'architecture_variable';
  } else if (category === 'other' && /not a formal parameter|without passing it as a formal parameter|assigns to outer-scope object|declares signal ".*" inside an executable region|procedure argument/i.test(message)) {
    category = 'procedure_scope';
  } else if (category === 'other' && /package body|subprogram body inside package declaration|package declaration.*subprogram signatures/i.test(message)) {
    category = 'package_body_misuse';
  } else if (category === 'other' && /multidimensional packed vector|re-constrains existing subtype|vector-of-vectors|flattened one-dimensional packed vector|illegal multidimensional|type mark expected in a subtype indication(?:.*array\s*\()?|anonymous object declaration.*array\(\)/i.test(message)) {
    category = 'array_subtype_misuse';
  } else if (category === 'other' && /signal assignment operator "<="|variable assignment operator ":="|Signals must use "<="|Variables must use ":="/i.test(message)) {
    category = 'signal_variable_assignment_misuse';
  } else if (category === 'other' && /undeclared width\/generic|interface declaration|generic and port items must use ":"|association syntax/i.test(message)) {
    category = 'interface_declaration_misuse';
  } else if (category === 'other' && /bit-string literal|Verilog-style literal|sized literals|width\/count|scalar numeric declarations/i.test(message)) {
    category = 'width_literal_mismatch';
  } else if (category === 'other' && /bounds explicitly|range errors|unchecked to_integer|runtime-unsafe/i.test(message)) {
    category = 'runtime_bound_risk';
  } else if (category === 'other' && /top-level generic .*default|generic ".*" does not declare a default/i.test(message)) {
    category = 'top_level_generic_default';
  } else if (category === 'other' && /top-level port .*unconstrained|simulation-apex ports must be constrained/i.test(message)) {
    category = 'top_level_port_constraint';
  } else if (category === 'other' && /mixed unsupported vhdl standard groups|one standard consistently across analyze\/elaborate\/run/i.test(message)) {
    category = 'standard_group_misuse';
  } else if (category === 'other' && /ghdl command contract is incomplete|missing exact ghdl analyze\/elaborate\/run command/i.test(message)) {
    category = 'command_contract';
  } else if (category === 'other' && /analysis_order does not satisfy internal compile dependencies|missing analysis_order contract/i.test(message)) {
    category = 'source_order_contract';
  } else if (category === 'other' && /multiple generated architectures|explicit elaboration target/i.test(message)) {
    category = 'architecture_target_ambiguity';
  } else if (category === 'other' && /rtl file contains testbench-only construct|keep these constructs in testbench code only/i.test(message)) {
    category = 'rtl_tb_construct_misuse';
  } else if (category === 'other' && /std_logic_textio|textio support was explicitly requested/i.test(message)) {
    category = 'textio_policy';
  } else if (category === 'other' && /waveform output|--vcd=|--ghw=|--fst=/i.test(message)) {
    category = 'waveform_contract';
  } else if (category === 'other' && /generate or toggle a derived clock|clock-enable style/i.test(message)) {
    category = 'generated_clock';
  } else if (category === 'other' && /mixes rising_edge and falling_edge|one edge per domain/i.test(message)) {
    category = 'mixed_clock_edge';
  } else if (category === 'other' && (
    /resize\(|matching "resize"|to_integer\(|shift_left\(|shift_right\(|can't match ".*" with type array type "unresolved_unsigned"|can't match ".*" with type array type "unresolved_signed"|can't match function call with type array type "unresolved_unsigned"|can't match function call with type array type "unresolved_signed"|can't associate ".*" with port ".*"|cannot associate ".*" with port ".*"|calls resize on raw std_logic_vector|raw std_logic_vector/i.test(message)
  )) {
    category = 'numeric_std_typing';
  } else if (category === 'other' && (
    /no function declarations for operator|illegal logical-operator expression|illegal prefix\/function-style vhdl operator form|verilog-style literal|unexpected token 'sll'|unexpected token 'srl'|unexpected token 'xnor'/i.test(message)
  )) {
    category = 'illegal_operator_usage';
  } else if (category === 'other' && /unresolved work units|unit ".*" not found in library "work"/i.test(message)) {
    category = 'unresolved_work_unit';
  } else if (category === 'other' && /assertion failure|simulation failed|generated vhdl failed ghdl simulation/i.test(message)) {
    category = 'simulation_assertion';
  } else if (category === 'other' && /validation source set was empty|no generated vhdl artifacts were available|no vhdl sources were found/i.test(message)) {
    category = 'source_selection';
  }

  const ruleIds = getCanonicalRuleIdsForFailureCode(CATEGORY_FAILURE_CODE_MAP[category] || null);

  return {
    category,
    label: CATEGORY_LABELS[category],
    ruleIds,
    signature: `${category}:${ruleIds.join(',')}:${normalizedMessage}`,
    normalizedMessage,
    excerpt: trimExcerpt(message),
  };
}

export function summarizeFpgaArchitectLoopFailures(results: Array<{ attempt: number; ok: boolean; message: string }>) {
  const buckets = new Map<string, FpgaArchitectLoopFailureBucket>();

  for (const result of results) {
    if (result.ok) continue;
    const diagnostic = classifyFpgaArchitectLoopFailure(result.message);
    const existing = buckets.get(diagnostic.signature);
    if (existing) {
      existing.count += 1;
      existing.attempts.push(result.attempt);
      continue;
    }
    buckets.set(diagnostic.signature, {
      category: diagnostic.category,
      label: diagnostic.label,
      ruleIds: diagnostic.ruleIds,
      count: 1,
      attempts: [result.attempt],
      signature: diagnostic.signature,
      example: diagnostic.excerpt,
    });
  }

  return Array.from(buckets.values()).sort((left, right) => {
    if (left.count !== right.count) return right.count - left.count;
    return left.attempts[0] - right.attempts[0];
  });
}

export function shouldStopFpgaArchitectLoopEarly(results: Array<{ attempt: number; ok: boolean; message: string }>) {
  if (results.length < 3) {
    return null;
  }

  const tail = results.slice(-3);
  if (tail.some((entry) => entry.ok)) {
    return null;
  }

  const signatures = tail.map((entry) => classifyFpgaArchitectLoopFailure(entry.message).signature);
  if (new Set(signatures).size !== 1) {
    return null;
  }

  const diagnostic = classifyFpgaArchitectLoopFailure(tail[0].message);
  return {
    signature: diagnostic.signature,
    label: diagnostic.label,
    category: diagnostic.category,
    attempts: tail.map((entry) => entry.attempt),
  };
}
