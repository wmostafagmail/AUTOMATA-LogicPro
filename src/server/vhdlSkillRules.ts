import type { AiMacroId } from '../aiMacros';
import {
  buildCodeGeneratingCommandContract,
  buildGhdlRuleCoverageReport,
  GHDL_EXTERNAL_RULE_REGISTRY,
  getCanonicalRuleIdsForFailureCode,
  ruleAppliesToMacro,
  type CanonicalGhdlRule,
  type GhdlRuleEnforcementLayer,
  type GhdlRuleMacroScope,
  type GhdlRuleStatus,
} from './ghdlRuleCoverage';
import {
  buildCodeGeneratingMacroRuleList,
  buildCodeGeneratingMacroRuleSection,
  buildNumberedRuleList,
  buildStrictRuleSection,
  FPGA_ARCHITECT_EXTRA_GHDL_RULES,
  GHDL_STRICT_VHDL_RULE_FAMILIES,
  SHARED_GHDL_CONFORMANCE_RULE_LIST,
  SHARED_GHDL_CONFORMANCE_RULES,
  SHARED_VHDL_SKILL_NAMES,
  STRICT_CODE_GENERATION_RULE_LIST,
  STRICT_CODE_GENERATION_RULES,
  VHDL_OPERATOR_KEYWORDS,
  VHDL_RESERVED_IDENTIFIERS,
} from './ghdlStrictVhdlRules';

export * from './ghdlRuleCoverage';
export * from './ghdlStrictVhdlRules';

export type SharedCodeMacroRuleBundle = {
  strictRuleSection: string;
  commandContractSection: string;
  applicableCanonicalRules: CanonicalGhdlRule[];
};

export function buildCodeGeneratingCommandContractSection(macroId: AiMacroId) {
  return `## Exact GHDL Command / Output Contract\n${buildCodeGeneratingCommandContract(macroId)}`;
}

export function getCanonicalRulesForMacro(macroId: AiMacroId) {
  return GHDL_EXTERNAL_RULE_REGISTRY.filter((rule) => ruleAppliesToMacro(rule, macroId));
}

export function buildSharedCodeMacroRuleBundle(macroId: AiMacroId): SharedCodeMacroRuleBundle {
  return {
    strictRuleSection: buildCodeGeneratingMacroRuleSection(macroId),
    commandContractSection: buildCodeGeneratingCommandContractSection(macroId),
    applicableCanonicalRules: getCanonicalRulesForMacro(macroId),
  };
}

export {
  buildCodeGeneratingMacroRuleList,
  buildCodeGeneratingMacroRuleSection,
  buildGhdlRuleCoverageReport,
  buildNumberedRuleList,
  buildStrictRuleSection,
  FPGA_ARCHITECT_EXTRA_GHDL_RULES,
  GHDL_EXTERNAL_RULE_REGISTRY,
  GHDL_STRICT_VHDL_RULE_FAMILIES,
  getCanonicalRuleIdsForFailureCode,
  ruleAppliesToMacro,
  SHARED_GHDL_CONFORMANCE_RULE_LIST,
  SHARED_GHDL_CONFORMANCE_RULES,
  SHARED_VHDL_SKILL_NAMES,
  STRICT_CODE_GENERATION_RULE_LIST,
  STRICT_CODE_GENERATION_RULES,
  VHDL_OPERATOR_KEYWORDS,
  VHDL_RESERVED_IDENTIFIERS,
};

export type {
  CanonicalGhdlRule,
  GhdlRuleEnforcementLayer,
  GhdlRuleMacroScope,
  GhdlRuleStatus,
};
