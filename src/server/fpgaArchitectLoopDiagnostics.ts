import {
  inferFailureDetailsFromGhdlMessage,
  type GeneratedVhdlFailureDetail,
  type GeneratedVhdlValidationResult,
} from './generatedVhdlValidation';
import { getCanonicalRuleIdsForFailureCode } from './vhdlSkillRules';

export type FpgaArchitectLoopFailureCategory =
  | 'architecture_intent'
  | 'architecture_contract'
  | 'manifest_structure'
  | 'provider_runtime'
  | 'reserved_identifier'
  | 'missing_ieee_clause'
  | 'architecture_variable'
  | 'procedure_scope'
  | 'numeric_std_typing'
  | 'package_body_misuse'
  | 'package_type_definition'
  | 'array_subtype_misuse'
  | 'signal_variable_assignment_misuse'
  | 'interface_declaration_misuse'
  | 'top_integration_contract'
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
  | 'protocol_functional_mismatch'
  | 'simulation_assertion'
  | 'testbench_structure'
  | 'source_selection'
  | 'implementation_source'
  | 'context_budget'
  | 'validation_environment'
  | 'other';

export type FpgaArchitectLoopFailureDiagnostic = {
  category: FpgaArchitectLoopFailureCategory;
  label: string;
  ruleIds: string[];
  signature: string;
  normalizedMessage: string;
  excerpt: string;
};

type FpgaArchitectFailureLike = {
  message: string;
  generatedVhdlValidation?: Partial<GeneratedVhdlValidationResult> | null;
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
  architecture_intent: 'Architecture Intent',
  architecture_contract: 'Architecture Contract',
  manifest_structure: 'Manifest / JSON Structure',
  provider_runtime: 'Provider / Runtime',
  reserved_identifier: 'Reserved Identifier',
  missing_ieee_clause: 'Missing IEEE Clause',
  architecture_variable: 'Architecture Declarative Scope',
  procedure_scope: 'Procedure / Testbench Scope',
  numeric_std_typing: 'numeric_std Typing',
  package_body_misuse: 'Package / Body Misuse',
  package_type_definition: 'Package / Type Definition',
  array_subtype_misuse: 'Array / Subtype Misuse',
  signal_variable_assignment_misuse: 'Signal vs Variable Assignment',
  interface_declaration_misuse: 'Interface / Generic Declaration',
  top_integration_contract: 'Top Integration Contract',
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
  protocol_functional_mismatch: 'Protocol / Functional Mismatch',
  simulation_assertion: 'Simulation Assertion',
  testbench_structure: 'Testbench DUT Wiring',
  source_selection: 'Validation Source Selection',
  implementation_source: 'Implementation Source',
  context_budget: 'Context Budget',
  validation_environment: 'Validation Environment',
  other: 'Other',
};

const CATEGORY_FAILURE_CODE_MAP: Partial<Record<FpgaArchitectLoopFailureCategory, string>> = {
  architecture_intent: 'architecture_intent_clarification_required',
  manifest_structure: 'no_generated_artifacts',
  reserved_identifier: 'reserved_identifier',
  missing_ieee_clause: 'missing_std_logic_1164_clause',
  architecture_variable: 'architecture_body_variable',
  procedure_scope: 'procedure_outer_scope_write',
  numeric_std_typing: 'resize_on_raw_std_logic_vector',
  package_body_misuse: 'subprogram_body_inside_package_declaration',
  package_type_definition: 'record_field_not_declared',
  array_subtype_misuse: 'illegal_multidimensional_logic_vector',
  signal_variable_assignment_misuse: 'variable_assigned_with_signal_operator',
  interface_declaration_misuse: 'undeclared_interface_dimension_reference',
  top_integration_contract: 'undriven_top_output_port',
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
  protocol_functional_mismatch: 'ghdl_simulate_failure',
  testbench_structure: 'testbench_missing_dut_instantiation',
  source_selection: 'source_selection',
  implementation_source: 'verified_leaf_implementation_missing',
  context_budget: 'context_budget_exceeded',
  validation_environment: 'validation_environment',
  simulation_assertion: 'ghdl_simulate_failure',
};

function mapGeneratedFailureCodeToLoopCategory(code: string): FpgaArchitectLoopFailureCategory | null {
  switch (code) {
    case 'architecture_parameter_clarification_required':
    case 'architecture_parameter_unknown_required_value':
    case 'architecture_parameter_invalid_user_value':
    case 'architecture_intent_unknown_required_field':
    case 'architecture_intent_ambiguous_design_class':
    case 'architecture_intent_clarification_required':
      return 'architecture_intent';
    case 'reserved_identifier':
    case 'case_insensitive_identifier_collision':
      return 'reserved_identifier';
    case 'missing_std_logic_1164_clause':
    case 'missing_numeric_std_clause':
    case 'missing_std_logic_textio_clause':
      return 'missing_ieee_clause';
    case 'architecture_body_variable':
      return 'architecture_variable';
    case 'procedure_outer_scope_write':
    case 'declaration_after_begin':
    case 'incomplete_subprogram_interface':
    case 'subprogram_call_arity_mismatch':
    case 'subprogram_actual_type_mismatch':
      return 'procedure_scope';
    case 'subprogram_body_inside_package_declaration':
    case 'package_body_signature_mismatch':
    case 'package_missing_ieee_import':
    case 'constrained_scalar_subtype_alias':
      return 'package_body_misuse';
    case 'record_field_not_declared':
    case 'custom_type_port_association_mismatch':
    case 'package_symbol_not_visible':
    case 'missing_reduction_helper':
      return 'package_type_definition';
    case 'incomplete_array_aggregate_choices':
    case 'illegal_multidimensional_logic_vector':
    case 'reconstrained_array_subtype':
    case 'anonymous_array_object_declaration':
      return 'array_subtype_misuse';
    case 'variable_assigned_with_signal_operator':
    case 'signal_assigned_with_variable_operator':
      return 'signal_variable_assignment_misuse';
    case 'undeclared_interface_dimension_reference':
    case 'interface_constant_not_visible':
    case 'malformed_vhdl_keyword':
    case 'out_port_actual_conversion':
    case 'unknown_port_map_formal':
    case 'unconnected_required_input_port':
    case 'component_output_ownership_violation':
    case 'multiple_signal_driver_or_slice_assignment':
      return 'interface_declaration_misuse';
    case 'undriven_top_output_port':
      return 'top_integration_contract';
    case 'verilog_style_literal':
    case 'scalar_bit_string_assignment':
    case 'malformed_character_literal':
    case 'vector_literal_width_mismatch':
    case 'illegal_others_aggregate_context':
      return 'width_literal_mismatch';
    case 'runtime_bound_check_risk':
    case 'invalid_range_membership_syntax':
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
    case 'source_order_dependency_inversion':
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
    case 'unsigned_conversion_on_non_vector':
    case 'typed_function_result_mismatch':
    case 'type_conversion_indexed_or_sliced':
    case 'typed_assignment_mismatch':
    case 'typed_port_association_mismatch':
    case 'typed_port_width_mismatch':
    case 'custom_numeric_subtype_port_mismatch':
    case 'typed_helper_actual_mismatch':
    case 'typed_bitwise_mismatch':
    case 'typed_resize_return_mismatch':
    case 'typed_equality_operand_mismatch':
    case 'arithmetic_on_non_numeric_signal':
    case 'enum_opcode_numeric_conversion_misuse':
    case 'mixed_logical_operator_precedence':
    case 'pixel_address_numeric_contract':
      return 'numeric_std_typing';
    case 'illegal_numeric_logical_hybrid':
    case 'illegal_prefix_operator_form':
      return 'illegal_operator_usage';
    case 'enum_case_choice_missing':
      return 'interface_declaration_misuse';
    case 'unresolved_work_unit':
    case 'missing_work_package_file':
      return 'unresolved_work_unit';
    case 'source_selection':
      return 'source_selection';
    case 'verified_leaf_implementation_missing':
    case 'deterministic_template_not_applicable':
    case 'deterministic_parameterization_unsafe':
    case 'model_vhdl_generation_blocked_by_policy':
    case 'verified_semantic_wrapper_unsafe_mismatch':
    case 'verified_wrapper_unsafe_mismatch':
    case 'verified_wrapper_candidate_rejected':
    case 'verified_parameter_unsafe_mismatch':
    case 'verified_parameter_constraint_violation':
    case 'verified_parameter_smoke_failed':
    case 'verified_config_input_unresolved':
    case 'hybrid_implementation_source_search_started':
    case 'hybrid_implementation_source_unresolved':
      return 'implementation_source';
    case 'ghdl_simulate_failure':
    case 'alu_flag_behavior_mismatch':
    case 'alu_result_behavior_mismatch':
    case 'cpu_halt_behavior_mismatch':
    case 'cpu_reset_pc_behavior_mismatch':
    case 'cpu_fetch_sequence_mismatch':
    case 'cpu_control_signal_behavior_mismatch':
    case 'cpu_top_status_behavior_mismatch':
    case 'protocol_status_behavior_mismatch':
    case 'simulation_assertion_expected_actual_mismatch':
    case 'simulation_valid_latency_mismatch':
      return 'simulation_assertion';
    case 'testbench_missing_dut_instantiation':
    case 'checked_signal_not_dut_driven':
    case 'testbench_drives_dut_output_signal':
    case 'self_checking_testbench_missing_pass_path':
      return 'testbench_structure';
    case 'staged_port_interface_drift':
    case 'staged_generation_runtime_error':
    case 'architecture_selection_review_poor_fit':
    case 'architecture_missing_block_discovery_poor_fit':
    case 'architecture_missing_block_discovery_unresolved':
    case 'architecture_contract_output_driver_missing':
      return 'architecture_contract';
    case 'model_output_budget_exhausted':
    case 'model_generation_timeout':
      return 'context_budget';
    case 'ghdl_tool_internal_error':
    case 'validation_filesystem_timeout':
      return 'validation_environment';
    default:
      return null;
  }
}

function buildDiagnosticFromValidationDetail(
  message: string,
  detail: Pick<GeneratedVhdlFailureDetail, 'code' | 'category' | 'ruleId' | 'ruleIds' | 'excerpt' | 'message'>,
): FpgaArchitectLoopFailureDiagnostic | null {
  const category = mapGeneratedFailureCodeToLoopCategory(detail.code)
    || (detail.category === 'declaration_scope' ? 'procedure_scope' : null);
  if (!category) {
    return null;
  }

  const explicitRuleIds = Array.isArray(detail.ruleIds)
    ? detail.ruleIds.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    : [];
  const mergedRuleIds = Array.from(new Set([
    ...explicitRuleIds,
    ...(detail.ruleId ? [detail.ruleId] : []),
    ...getCanonicalRuleIdsForFailureCode(detail.code || null),
  ]));
  const normalizedMessage = normalizeFailureMessage(message);

  return {
    category,
    label: CATEGORY_LABELS[category],
    ruleIds: mergedRuleIds,
    signature: `${category}:${mergedRuleIds.join(',')}:${normalizedMessage}`,
    normalizedMessage,
    excerpt: trimExcerpt(detail.message || message),
  };
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
  let inferredFailureCode: string | null = null;

  const inferredDetails = inferFailureDetailsFromGhdlMessage(message);
  const inferredDetail = inferredDetails.find((detail) => mapGeneratedFailureCodeToLoopCategory(detail.code));
  if (inferredDetail) {
    const inferredCategory = mapGeneratedFailureCodeToLoopCategory(inferredDetail.code);
    if (inferredCategory) {
      category = inferredCategory;
      inferredFailureCode = inferredDetail.code;
    }
  }

  if (category === 'other' && (
    /input length .*exceeds.*context|context.*budget|prompt.*too large|context_budget_exceeded|returned no generated text[\s\S]*done_reason=length|done_reason=length[\s\S]*message_content_length=0|model_generation_timeout|model_output_budget_exhausted/i.test(message)
  )) {
    category = 'context_budget';
    if (/model_generation_timeout/i.test(message)) {
      inferredFailureCode = 'model_generation_timeout';
    } else if (/returned no generated text[\s\S]*done_reason=length|done_reason=length[\s\S]*message_content_length=0|model_output_budget_exhausted/i.test(message)) {
      inferredFailureCode = 'model_output_budget_exhausted';
    }
  } else if (category === 'other' && (
    /GHDL Bug occurred|TYPES\.INTERNAL_ERROR|files_map\.adb|internal compiler error|Operation timed out|ETIMEDOUT|No space left on device|dataless|cannotSetXattr/i.test(message)
  )) {
    category = 'validation_environment';
    inferredFailureCode = /GHDL Bug occurred|TYPES\.INTERNAL_ERROR|files_map\.adb|internal compiler error/i.test(message)
      ? 'ghdl_tool_internal_error'
      : 'validation_filesystem_timeout';
  } else if (category === 'other' && (
    /architecture (?:intent|parameters?) needs clarification|architecture_(?:intent|parameter)_[a-z0-9_]+|awaiting_architecture_clarification/i.test(message)
  )) {
    category = 'architecture_intent';
    if (/architecture_parameter_unknown_required_value/i.test(message)) {
      inferredFailureCode = 'architecture_parameter_unknown_required_value';
    } else if (/architecture_parameter_invalid_user_value/i.test(message)) {
      inferredFailureCode = 'architecture_parameter_invalid_user_value';
    } else if (/architecture_parameter_clarification_required/i.test(message)) {
      inferredFailureCode = 'architecture_parameter_clarification_required';
    } else if (/architecture_intent_ambiguous_design_class/i.test(message)) {
      inferredFailureCode = 'architecture_intent_ambiguous_design_class';
    } else if (/architecture_intent_unknown_required_field/i.test(message)) {
      inferredFailureCode = 'architecture_intent_unknown_required_field';
    } else {
      inferredFailureCode = 'architecture_intent_clarification_required';
    }
  } else if (category === 'other' && (
    /verified_leaf_implementation_missing|model_vhdl_generation_blocked_by_policy|deterministic_template_not_applicable|deterministic_parameterization_unsafe|verified_semantic_wrapper_unsafe_mismatch|verified_wrapper_unsafe_mismatch|verified_wrapper_candidate_rejected|verified_parameter_unsafe_mismatch|verified_parameter_constraint_violation|verified_parameter_smoke_failed|verified_config_input_unresolved|hybrid_implementation_source_search_started|hybrid_implementation_source_unresolved/i.test(message)
  )) {
    category = 'implementation_source';
    if (/hybrid_implementation_source_unresolved/i.test(message)) {
      inferredFailureCode = 'hybrid_implementation_source_unresolved';
    } else if (/verified_config_input_unresolved/i.test(message)) {
      inferredFailureCode = 'verified_config_input_unresolved';
    } else if (/hybrid_implementation_source_search_started/i.test(message)) {
      inferredFailureCode = 'hybrid_implementation_source_search_started';
    } else if (/verified_semantic_wrapper_unsafe_mismatch/i.test(message)) {
      inferredFailureCode = 'verified_semantic_wrapper_unsafe_mismatch';
    } else if (/verified_wrapper_unsafe_mismatch/i.test(message)) {
      inferredFailureCode = 'verified_wrapper_unsafe_mismatch';
    } else if (/verified_wrapper_candidate_rejected/i.test(message)) {
      inferredFailureCode = 'verified_wrapper_candidate_rejected';
    } else if (/verified_parameter_smoke_failed/i.test(message)) {
      inferredFailureCode = 'verified_parameter_smoke_failed';
    } else if (/verified_parameter_constraint_violation/i.test(message)) {
      inferredFailureCode = 'verified_parameter_constraint_violation';
    } else if (/verified_parameter_unsafe_mismatch/i.test(message)) {
      inferredFailureCode = 'verified_parameter_unsafe_mismatch';
    } else if (/model_vhdl_generation_blocked_by_policy/i.test(message)) {
      inferredFailureCode = 'model_vhdl_generation_blocked_by_policy';
    } else if (/deterministic_template_not_applicable/i.test(message)) {
      inferredFailureCode = 'deterministic_template_not_applicable';
    } else if (/deterministic_parameterization_unsafe/i.test(message)) {
      inferredFailureCode = 'deterministic_parameterization_unsafe';
    } else {
      inferredFailureCode = 'verified_leaf_implementation_missing';
    }
  } else if (category === 'other' && (
    /architecture proposal was rejected before vhdl generation|approved fpga architecture contract|architecture_contract_[a-z0-9_]+|architecture_selection_review_[a-z0-9_]+|architecture_missing_block_discovery_[a-z0-9_]+|drifted from the approved architecture contract|staged_generation_runtime_error|staged_port_interface_drift|staged_component_entity_missing|component_output_ownership_violation|did not declare entity|changed the approved (?:generic|port) interface|assigns "[a-zA-Z][a-zA-Z0-9_]*", but that name is not owned by this component/i.test(message)
  )) {
    category = 'architecture_contract';
    if (/staged_generation_runtime_error/i.test(message)) {
      category = 'provider_runtime';
      inferredFailureCode = 'staged_generation_runtime_error';
    } else if (/staged_port_interface_drift|changed the approved (?:generic|port) interface/i.test(message)) {
      inferredFailureCode = 'staged_port_interface_drift';
    } else if (/staged_component_entity_missing|did not declare entity/i.test(message)) {
      inferredFailureCode = 'staged_component_entity_missing';
    } else if (/component_output_ownership_violation|assigns "[a-zA-Z][a-zA-Z0-9_]*", but that name is not owned by this component/i.test(message)) {
      category = 'interface_declaration_misuse';
      inferredFailureCode = 'component_output_ownership_violation';
    } else if (/architecture_missing_block_discovery_poor_fit/i.test(message)) {
      inferredFailureCode = 'architecture_missing_block_discovery_poor_fit';
    } else if (/architecture_missing_block_discovery_unresolved/i.test(message)) {
      inferredFailureCode = 'architecture_missing_block_discovery_unresolved';
    } else if (/architecture_selection_review_poor_fit/i.test(message)) {
      inferredFailureCode = 'architecture_selection_review_poor_fit';
    }
  } else if (category === 'other' && (
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
  } else if (category === 'other' && /package body|body of function ".*" does not conform with specification|subprogram body inside package declaration|package declaration.*subprogram signatures/i.test(message)) {
    category = 'package_body_misuse';
  } else if (category === 'other' && /record type|no element ".*" in record type|package-defined|custom typed formal port|custom record|custom enum/i.test(message)) {
    category = 'package_type_definition';
  } else if (category === 'other' && /multidimensional packed vector|subtype has more indexes than array subtype "std_logic_vector"|re-constrains existing subtype|vector-of-vectors|flattened one-dimensional packed vector|illegal multidimensional|type mark expected in a subtype indication(?:.*array\s*\()?|anonymous object declaration.*array\(\)/i.test(message)) {
    category = 'array_subtype_misuse';
  } else if (category === 'other' && /signal assignment operator "<="|variable assignment operator ":="|Signals must use "<="|Variables must use ":="/i.test(message)) {
    category = 'signal_variable_assignment_misuse';
  } else if (category === 'other' && /undeclared width\/generic|interface declaration|generic and port items must use ":"|association syntax/i.test(message)) {
    category = 'interface_declaration_misuse';
  } else if (category === 'other' && /multiple assignments for ".*"|assigned in \d+ separate process drivers/i.test(message)) {
    category = 'interface_declaration_misuse';
    inferredFailureCode = 'multiple_signal_driver_or_slice_assignment';
  } else if (category === 'other' && /string length does not match that of anonymous integer subtype|value constraints don't match target ones|'others' choice not allowed|malformed one-bit character literal|bit-string literal|Verilog-style literal|sized literals|width\/count|scalar numeric declarations/i.test(message)) {
    category = 'width_literal_mismatch';
  } else if (category === 'other' && /bounds explicitly|range errors|unchecked to_integer|runtime-unsafe|bound check failure|index .* out of bounds|range check failed/i.test(message)) {
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
    || /type conversion cannot be indexed or sliced|can't match ".*" with type array type "std_ulogic_vector"|only one type of logical operators may be used to combine relation/i.test(message)
  )) {
    category = 'numeric_std_typing';
  } else if (category === 'other' && (
    /no function declarations for operator|illegal logical-operator expression|illegal prefix\/function-style vhdl operator form|verilog-style literal|unexpected token 'sll'|unexpected token 'srl'|unexpected token 'xnor'/i.test(message)
  )) {
    category = 'illegal_operator_usage';
  } else if (category === 'other' && /unresolved work units|unit ".*" not found in library "work"/i.test(message)) {
    category = 'unresolved_work_unit';
  } else if (category === 'other' && /testbench.*(?:does not instantiate|missing dut|dut instantiation|checked signal.*not driven|drives dut output|mapped to output port)/i.test(message)) {
    category = 'testbench_structure';
  } else if (category === 'other' && /fail:\s+.*mismatch detected|mismatch detected|nominal transfer mismatch|second transfer mismatch|protocol.*mismatch/i.test(message)) {
    category = 'protocol_functional_mismatch';
  } else if (category === 'other' && /assertion failure|simulation failed|generated vhdl failed ghdl simulation/i.test(message)) {
    category = 'simulation_assertion';
  } else if (category === 'other' && /validation source set was empty|no generated vhdl artifacts were available|no vhdl sources were found/i.test(message)) {
    category = 'source_selection';
  }

  const ruleIds = getCanonicalRuleIdsForFailureCode(inferredFailureCode || CATEGORY_FAILURE_CODE_MAP[category] || null);

  return {
    category,
    label: CATEGORY_LABELS[category],
    ruleIds,
    signature: `${category}:${ruleIds.join(',')}:${normalizedMessage}`,
    normalizedMessage,
    excerpt: trimExcerpt(message),
  };
}

export function classifyFpgaArchitectLoopFailureWithValidation(failure: FpgaArchitectFailureLike): FpgaArchitectLoopFailureDiagnostic {
  const validation = failure.generatedVhdlValidation;
  const detail = validation?.failureDetails?.[0];
  if (detail) {
    const directDiagnostic = buildDiagnosticFromValidationDetail(failure.message, detail);
    if (directDiagnostic) {
      return directDiagnostic;
    }
  }

  if (validation?.failureCode) {
    const category = mapGeneratedFailureCodeToLoopCategory(validation.failureCode);
    if (category) {
      const ruleIds = Array.from(new Set([
        ...(Array.isArray(validation.ruleIds) ? validation.ruleIds : []),
        ...getCanonicalRuleIdsForFailureCode(validation.failureCode),
      ]));
      const normalizedMessage = normalizeFailureMessage(failure.message);
      return {
        category,
        label: CATEGORY_LABELS[category],
        ruleIds,
        signature: `${category}:${ruleIds.join(',')}:${normalizedMessage}`,
        normalizedMessage,
        excerpt: trimExcerpt(failure.message),
      };
    }
  }

  return classifyFpgaArchitectLoopFailure(failure.message);
}

export function summarizeFpgaArchitectLoopFailures(results: Array<{
  attempt: number;
  ok: boolean;
  message: string;
  generatedVhdlValidation?: Partial<GeneratedVhdlValidationResult> | null;
}>) {
  const buckets = new Map<string, FpgaArchitectLoopFailureBucket>();

  for (const result of results) {
    if (result.ok) continue;
    const diagnostic = classifyFpgaArchitectLoopFailureWithValidation(result);
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
