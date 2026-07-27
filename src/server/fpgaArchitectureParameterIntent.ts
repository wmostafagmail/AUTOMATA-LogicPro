import type {
  FpgaArchitectureComponentContract,
  FpgaArchitectureContract,
} from './fpgaArchitectureContract';
import type { FpgaArchitectureIntent } from './fpgaArchitectureIntent';

export type FpgaArchitectureParameterSource =
  | 'user_explicit'
  | 'user_clarified'
  | 'pattern_default'
  | 'verified_default'
  | 'app_policy_default'
  | 'unknown';

export type FpgaArchitectureParameterRequirement = {
  componentId: string;
  componentName: string;
  genericName: string;
  canonicalName: string;
  type: string;
  currentDefault: string;
  required: boolean;
  source: FpgaArchitectureParameterSource;
  constraintSummary: string;
  requiresConfiguredSmoke: boolean;
  question: string;
};

export type FpgaArchitectureResolvedParameter = {
  componentId: string;
  genericName: string;
  canonicalName: string;
  value: string;
  source: FpgaArchitectureParameterSource;
  evidence: string;
};

export type FpgaArchitectureResolvedParameterSet = {
  parameters: FpgaArchitectureResolvedParameter[];
  auditSummary: string[];
};

export type FpgaArchitectureParameterClarificationRequest = {
  status: 'awaiting_architecture_clarification';
  subtype: 'parameter_clarification';
  questions: string[];
  unknownRequirements: string[];
  requirements: FpgaArchitectureParameterRequirement[];
  issueCodes: string[];
  userActionPrompt: string;
};

const PARAMETER_PATTERNS: Array<{
  canonicalName: string;
  aliases: string[];
  evidencePattern: RegExp;
  valuePattern: RegExp;
  constraintSummary: string;
}> = [
  {
    canonicalName: 'DATA_WIDTH',
    aliases: ['WIDTH', 'DATA_WIDTH', 'ELEM_WIDTH', 'SENSOR_WIDTH'],
    evidencePattern: /\b(\d+)\s*[- ]?bit\b/i,
    valuePattern: /\b(\d+)\s*[- ]?bit\b/i,
    constraintSummary: 'positive integer bit width',
  },
  {
    canonicalName: 'ADDR_WIDTH',
    aliases: ['ADDR_WIDTH', 'ADDRESS_WIDTH', 'PC_WIDTH'],
    evidencePattern: /\b(?:addr(?:ess)?|pc)\s*(?:width)?\s*(?:=|is|of)?\s*(\d+)\b/i,
    valuePattern: /\b(?:addr(?:ess)?|pc)\s*(?:width)?\s*(?:=|is|of)?\s*(\d+)\b/i,
    constraintSummary: 'positive integer address width',
  },
  {
    canonicalName: 'RESET_VECTOR',
    aliases: ['RESET_VECTOR'],
    evidencePattern: /\b(?:reset\s+vector|reset_vector)\s*(?:=|is|of)?\s*(\d+)\b/i,
    valuePattern: /\b(?:reset\s+vector|reset_vector)\s*(?:=|is|of)?\s*(\d+)\b/i,
    constraintSummary: 'non-negative integer reset vector address',
  },
  {
    canonicalName: 'INSTR_BYTES',
    aliases: ['INSTR_BYTES', 'INSTRUCTION_BYTES'],
    evidencePattern: /\b(?:instr(?:uction)?\s+bytes|instr_bytes)\s*(?:=|is|of)?\s*(\d+)\b/i,
    valuePattern: /\b(?:instr(?:uction)?\s+bytes|instr_bytes)\s*(?:=|is|of)?\s*(\d+)\b/i,
    constraintSummary: 'positive integer instruction byte stride',
  },
  {
    canonicalName: 'DEPTH',
    aliases: ['DEPTH', 'FIFO_DEPTH', 'MEM_DEPTH', 'REG_COUNT'],
    evidencePattern: /\b(?:depth|fifo\s+depth|memory\s+depth|entries|registers)\s*(?:=|is|of)?\s*(\d+)\b/i,
    valuePattern: /\b(?:depth|fifo\s+depth|memory\s+depth|entries|registers)\s*(?:=|is|of)?\s*(\d+)\b/i,
    constraintSummary: 'positive integer storage depth; async FIFO depth may need power of two',
  },
  {
    canonicalName: 'CLOCK_HZ',
    aliases: ['CLOCK_HZ', 'CLK_HZ'],
    evidencePattern: /\b(\d+(?:\.\d+)?)\s*(mhz|khz|hz)\b/i,
    valuePattern: /\b(\d+(?:\.\d+)?)\s*(mhz|khz|hz)\b/i,
    constraintSummary: 'positive integer frequency in Hz',
  },
  {
    canonicalName: 'BAUD_RATE',
    aliases: ['BAUD_RATE', 'BAUD'],
    evidencePattern: /\b(?:baud(?:\s+rate)?|uart\s+rate)\s*(?:=|is|of|at)?\s*(\d+)\b/i,
    valuePattern: /\b(?:baud(?:\s+rate)?|uart\s+rate)\s*(?:=|is|of|at)?\s*(\d+)\b/i,
    constraintSummary: 'positive integer baud rate less than clock frequency',
  },
  {
    canonicalName: 'DATA_BITS',
    aliases: ['DATA_BITS'],
    evidencePattern: /\b(?:data\s+bits|uart\s+data\s+bits)\s*(?:=|is|of)?\s*(\d+)\b/i,
    valuePattern: /\b(?:data\s+bits|uart\s+data\s+bits)\s*(?:=|is|of)?\s*(\d+)\b/i,
    constraintSummary: 'UART data bits, usually 5 through 9',
  },
  {
    canonicalName: 'KEY_WIDTH',
    aliases: ['KEY_WIDTH'],
    evidencePattern: /\b(?:aes[- ]?)?(128|192|256)\b/i,
    valuePattern: /\b(?:aes[- ]?)?(128|192|256)\b/i,
    constraintSummary: 'common cryptographic key width such as 128, 192, or 256',
  },
  {
    canonicalName: 'LATENCY_CYCLES',
    aliases: ['LATENCY_CYCLES', 'STAGES'],
    evidencePattern: /\b(?:latency|pipeline\s+stages|stages)\s*(?:=|is|of)?\s*(\d+)\b/i,
    valuePattern: /\b(?:latency|pipeline\s+stages|stages)\s*(?:=|is|of)?\s*(\d+)\b/i,
    constraintSummary: 'non-negative integer cycle count',
  },
  {
    canonicalName: 'SIGNED_MODE',
    aliases: ['SIGNED_MODE'],
    evidencePattern: /\b(signed|unsigned)\b/i,
    valuePattern: /\b(signed|unsigned)\b/i,
    constraintSummary: 'boolean-compatible arithmetic mode',
  },
];

const HIGH_IMPACT_GENERIC = /^(?:width|data_width|elem_width|addr_width|address_width|pc_width|reset_vector|instr_bytes|instruction_bytes|key_width|status_width|count_width|cmd_width|cfg_width|sensor_width|mon_width|fifo_depth|mem_depth|depth|reg_count|clock_hz|clk_hz|baud_rate|data_bits|stop_bits|latency_cycles|stages|signed_mode|saturating|acc_width|gain_shift|lanes|modulus|step|threshold|xor_mask)$/i;

function normalizeName(value: string) {
  return String(value || '').trim().toUpperCase();
}

function isSweepOrPresetRequest(userRequest: string) {
  return /#\s*FPGA Architect Design Spec|Mandatory design class:/i.test(userRequest);
}

function isIntegerLike(type: string) {
  return /^(?:positive|natural|integer)\b/i.test(String(type || '').trim());
}

function isBooleanLike(type: string) {
  return /^boolean\b/i.test(String(type || '').trim());
}

function numericValueFromFrequency(match: RegExpMatchArray) {
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return '';
  const unit = String(match[2] || 'hz').toLowerCase();
  const multiplier = unit === 'mhz' ? 1_000_000 : unit === 'khz' ? 1_000 : 1;
  return String(Math.round(amount * multiplier));
}

function explicitParameterValue(prompt: string, genericName: string) {
  const canonical = canonicalParameterName(genericName);
  const direct = prompt.match(new RegExp(`\\b${genericName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:=>|:=|=|is|of)?\\s*([A-Za-z0-9_.'"]+)`, 'i'));
  if (direct?.[1]) return { value: direct[1].replace(/^["']|["']$/g, ''), evidence: direct[0] };
  const rule = PARAMETER_PATTERNS.find((entry) => entry.canonicalName === canonical || entry.aliases.includes(normalizeName(genericName)));
  const match = rule ? prompt.match(rule.valuePattern) : null;
  if (!match) return null;
  if (canonical === 'CLOCK_HZ') return { value: numericValueFromFrequency(match), evidence: match[0] };
  if (canonical === 'SIGNED_MODE') return { value: /signed/i.test(match[1]) && !/unsigned/i.test(match[1]) ? 'true' : 'false', evidence: match[0] };
  return { value: match[1], evidence: match[0] };
}

export function canonicalParameterName(genericName: string) {
  const normalized = normalizeName(genericName);
  for (const rule of PARAMETER_PATTERNS) {
    if (rule.aliases.includes(normalized)) return rule.canonicalName;
  }
  if (/BAUD/i.test(normalized)) return 'BAUD_RATE';
  if (/DATA.*BITS/i.test(normalized)) return 'DATA_BITS';
  if (/RESET.*VECTOR/i.test(normalized)) return 'RESET_VECTOR';
  if (/INSTR(?:UCTION)?.*BYTES/i.test(normalized)) return 'INSTR_BYTES';
  if (/CLOCK|CLK.*HZ/i.test(normalized)) return 'CLOCK_HZ';
  if (/DEPTH|ENTRIES|COUNT$/i.test(normalized)) return 'DEPTH';
  if (/WIDTH/i.test(normalized)) return 'DATA_WIDTH';
  return normalized;
}

export function isDeterministicFpgaParameterGeneric(genericName: string) {
  const canonical = canonicalParameterName(genericName);
  return HIGH_IMPACT_GENERIC.test(genericName) || HIGH_IMPACT_GENERIC.test(canonical);
}

export function extractFpgaParameterValuesFromPrompt(userRequest: string) {
  const values: Record<string, { value: string; evidence: string }> = {};
  for (const rule of PARAMETER_PATTERNS) {
    const match = userRequest.match(rule.valuePattern);
    if (!match) continue;
    const value = rule.canonicalName === 'CLOCK_HZ'
      ? numericValueFromFrequency(match)
      : rule.canonicalName === 'SIGNED_MODE'
        ? (/signed/i.test(match[1]) && !/unsigned/i.test(match[1]) ? 'true' : 'false')
        : match[1];
    if (value) values[rule.canonicalName] = { value, evidence: match[0] };
  }
  return values;
}

function questionForRequirement(component: FpgaArchitectureComponentContract, generic: { name: string; type: string; default: string }) {
  const canonical = canonicalParameterName(generic.name);
  const label = `${component.id}.${generic.name}`;
  if (canonical === 'CLOCK_HZ') return `What clock frequency should ${label} use, in Hz or MHz?`;
  if (canonical === 'BAUD_RATE') return `What baud rate should ${label} use?`;
  if (canonical === 'DATA_BITS') return `How many UART data bits should ${label} use?`;
  if (canonical === 'DEPTH') return `What depth should ${label} use? If this is an async FIFO, use a power of two.`;
  if (canonical === 'KEY_WIDTH') return `What key width should ${label} use, for example 128, 192, or 256?`;
  if (canonical === 'SIGNED_MODE') return `Should ${label} use signed arithmetic?`;
  if (canonical === 'LATENCY_CYCLES') return `How many latency cycles or pipeline stages should ${label} use?`;
  return `What value should ${label} use?`;
}

type VerifiedGenericLike = {
  name: string;
  type: string;
  defaultValue: string | null;
};

export type VerifiedGenericPromotionAuditEntry = {
  genericName: string;
  type: string;
  value: string;
  source: FpgaArchitectureParameterSource;
};

export type VerifiedGenericPromotionResult = {
  component: FpgaArchitectureComponentContract;
  promotedGenerics: VerifiedGenericPromotionAuditEntry[];
  unsafeReasons: string[];
  auditSummary: string[];
};

function normalizeGenericKey(value: string) {
  return String(value || '').trim().toLowerCase();
}

function isSupportedPromotedGenericType(genericName: string, type: string) {
  const canonical = canonicalParameterName(genericName);
  if (canonical === 'SIGNED_MODE' || canonical === 'SATURATING') return isBooleanLike(type) || isIntegerLike(type);
  return isIntegerLike(type);
}

function isInternalLockedConfigurationGeneric(genericName: string) {
  return /^G_CONFIG_(?:SCHEMA|ID)$/i.test(genericName);
}

function isUsableDefaultValue(value: string | null | undefined) {
  const normalized = String(value || '').trim();
  return normalized.length > 0 && !/[<>]/.test(normalized);
}

export function promoteVerifiedVhdlGenericsIntoComponent(params: {
  component: FpgaArchitectureComponentContract;
  verifiedGenerics: VerifiedGenericLike[];
  userRequest?: string;
}): VerifiedGenericPromotionResult {
  const existingByName = new Set((params.component.generics || []).map((generic) => normalizeGenericKey(generic.name)));
  const promptValues = extractFpgaParameterValuesFromPrompt(params.userRequest || '');
  const promotedGenerics: VerifiedGenericPromotionAuditEntry[] = [];
  const unsafeReasons: string[] = [];
  const nextGenerics = [...(params.component.generics || [])];

  for (const verifiedGeneric of params.verifiedGenerics) {
    if (isInternalLockedConfigurationGeneric(verifiedGeneric.name)) continue;
    if (existingByName.has(normalizeGenericKey(verifiedGeneric.name))) continue;
    const canonicalName = canonicalParameterName(verifiedGeneric.name);
    if (!isDeterministicFpgaParameterGeneric(verifiedGeneric.name)) {
      unsafeReasons.push(`verified generic ${verifiedGeneric.name} is not a deterministic configurable parameter`);
      continue;
    }
    if (!isSupportedPromotedGenericType(verifiedGeneric.name, verifiedGeneric.type)) {
      unsafeReasons.push(`verified generic ${verifiedGeneric.name} uses unsupported type ${verifiedGeneric.type}`);
      continue;
    }
    if (!isUsableDefaultValue(verifiedGeneric.defaultValue)) {
      unsafeReasons.push(`verified generic ${verifiedGeneric.name} has no safe verified default`);
      continue;
    }
    const promptValue = explicitParameterValue(params.userRequest || '', verifiedGeneric.name)
      || promptValues[canonicalName]
      || null;
    const value = promptValue?.value || String(verifiedGeneric.defaultValue || '').trim();
    const source: FpgaArchitectureParameterSource = promptValue
      ? (/clarification/i.test(promptValue.evidence) ? 'user_clarified' : 'user_explicit')
      : 'verified_default';
    nextGenerics.push({
      name: verifiedGeneric.name,
      type: verifiedGeneric.type,
      default: value,
    });
    existingByName.add(normalizeGenericKey(verifiedGeneric.name));
    promotedGenerics.push({
      genericName: verifiedGeneric.name,
      type: verifiedGeneric.type,
      value,
      source,
    });
  }

  return {
    component: promotedGenerics.length > 0 ? { ...params.component, generics: nextGenerics } : params.component,
    promotedGenerics,
    unsafeReasons,
    auditSummary: promotedGenerics.map((entry) => (
      `VERIFIED_GENERIC_PROMOTION component=${params.component.id} generic=${entry.genericName} value=${entry.value} source=${entry.source}`
    )),
  };
}

export function applyVerifiedGenericPromotionToContract(params: {
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
  promotion: VerifiedGenericPromotionResult;
}) {
  if (params.promotion.promotedGenerics.length === 0) return params.contract;
  const promotedValueByName = new Map(params.promotion.promotedGenerics.map((entry) => [
    normalizeGenericKey(entry.genericName),
    entry.value,
  ]));
  return {
    ...params.contract,
    assumptions: [
      ...(params.contract.assumptions || []),
      ...params.promotion.auditSummary,
    ].slice(0, 48),
    components: (params.contract.components || []).map((component) => (
      component.id === params.component.id ? params.promotion.component : component
    )),
    instances: (params.contract.instances || []).map((instance) => {
      if (instance.childComponentId !== params.component.id) return instance;
      const genericMap = { ...(instance.genericMap || {}) };
      for (const generic of params.promotion.component.generics || []) {
        const value = promotedValueByName.get(normalizeGenericKey(generic.name));
        if (value) genericMap[generic.name] = value;
      }
      return { ...instance, genericMap };
    }),
  };
}

function sourceForDefault(generic: { name: string; type: string; default: string }, promptValue: { value: string; evidence: string } | null): FpgaArchitectureParameterSource {
  if (promptValue) return /clarification/i.test(promptValue.evidence) ? 'user_clarified' : 'user_explicit';
  if (generic.default && !/[<>]/.test(generic.default)) return 'verified_default';
  return 'unknown';
}

export function discoverFpgaArchitectureParameterRequirements(params: {
  contract: FpgaArchitectureContract;
  userRequest: string;
  intent?: FpgaArchitectureIntent;
}) {
  const promptValues = extractFpgaParameterValuesFromPrompt(params.userRequest);
  const requirements: FpgaArchitectureParameterRequirement[] = [];
  const allowPresetDefaults = isSweepOrPresetRequest(params.userRequest);
  for (const component of params.contract.components || []) {
    if (component.kind === 'package' || component.kind === 'testbench') continue;
    for (const generic of component.generics || []) {
      const canonicalName = canonicalParameterName(generic.name);
      const promptValue = explicitParameterValue(params.userRequest, generic.name) || promptValues[canonicalName] || null;
      const highImpact = HIGH_IMPACT_GENERIC.test(generic.name) || HIGH_IMPACT_GENERIC.test(canonicalName);
      const required = highImpact && !allowPresetDefaults;
      const source = sourceForDefault(generic, promptValue);
      const rule = PARAMETER_PATTERNS.find((entry) => entry.canonicalName === canonicalName);
      requirements.push({
        componentId: component.id,
        componentName: component.name,
        genericName: generic.name,
        canonicalName,
        type: generic.type,
        currentDefault: generic.default,
        required,
        source: required ? source : (source === 'unknown' ? 'app_policy_default' : source),
        constraintSummary: rule?.constraintSummary || (isIntegerLike(generic.type) ? 'integer-compatible generic' : `generic type ${generic.type}`),
        requiresConfiguredSmoke: highImpact,
        question: questionForRequirement(component, generic),
      });
    }
  }
  return requirements;
}

export function buildFpgaArchitectureParameterClarificationIssues(
  clarification: FpgaArchitectureParameterClarificationRequest,
) {
  return clarification.requirements.map((requirement) => ({
    code: 'architecture_parameter_unknown_required_value',
    path: `$.components.${requirement.componentId}.generics.${requirement.genericName}`,
    message: `${requirement.question} Constraint: ${requirement.constraintSummary}`,
  })).concat([{
    code: 'architecture_parameter_clarification_required',
    path: '$.parameters',
    message: clarification.userActionPrompt,
  }]);
}

export function validateFpgaArchitectureParameterCompleteness(params: {
  contract: FpgaArchitectureContract;
  userRequest: string;
  intent?: FpgaArchitectureIntent;
}): { ok: true; resolved: FpgaArchitectureResolvedParameterSet } | { ok: false; clarificationRequest: FpgaArchitectureParameterClarificationRequest } {
  const requirements = discoverFpgaArchitectureParameterRequirements(params);
  const unresolved = requirements.filter((requirement) => (
    requirement.required
    && requirement.source !== 'user_explicit'
    && requirement.source !== 'user_clarified'
    && requirement.source !== 'verified_default'
  ));
  if (unresolved.length > 0) {
    const questions = unresolved.map((entry) => entry.question).slice(0, 5);
    return {
      ok: false,
      clarificationRequest: {
        status: 'awaiting_architecture_clarification',
        subtype: 'parameter_clarification',
        questions,
        unknownRequirements: unresolved.map((entry) => `${entry.componentId}.${entry.genericName}`),
        requirements: unresolved.slice(0, 8),
        issueCodes: unresolved.map(() => 'architecture_parameter_unknown_required_value'),
        userActionPrompt: 'FPGA Architect needs parameter choices before generating VHDL. Answer the listed questions so the app can configure verified blocks without guessing.',
      },
    };
  }
  return {
    ok: true,
    resolved: {
      parameters: requirements.map((requirement) => ({
        componentId: requirement.componentId,
        genericName: requirement.genericName,
        canonicalName: requirement.canonicalName,
        value: explicitParameterValue(params.userRequest, requirement.genericName)?.value
          || extractFpgaParameterValuesFromPrompt(params.userRequest)[requirement.canonicalName]?.value
          || requirement.currentDefault,
        source: requirement.source,
        evidence: explicitParameterValue(params.userRequest, requirement.genericName)?.evidence
          || extractFpgaParameterValuesFromPrompt(params.userRequest)[requirement.canonicalName]?.evidence
          || requirement.source,
      })),
      auditSummary: requirements.map((entry) => `${entry.componentId}.${entry.genericName}=${entry.currentDefault || '(unset)'} source=${entry.source}`),
    },
  };
}

export function applyResolvedFpgaArchitectureParameters(params: {
  contract: FpgaArchitectureContract;
  resolved: FpgaArchitectureResolvedParameterSet;
}) {
  const valueByComponentGeneric = new Map(params.resolved.parameters.map((entry) => [
    `${entry.componentId.toLowerCase()}.${entry.genericName.toLowerCase()}`,
    entry.value,
  ]));
  const nextContract: FpgaArchitectureContract = {
    ...params.contract,
    assumptions: [
      ...(params.contract.assumptions || []),
      ...params.resolved.auditSummary.map((entry) => `Parameter resolution: ${entry}`),
    ].slice(0, 32),
    components: (params.contract.components || []).map((component) => ({
      ...component,
      generics: (component.generics || []).map((generic) => {
        const value = valueByComponentGeneric.get(`${component.id.toLowerCase()}.${generic.name.toLowerCase()}`);
        return value ? { ...generic, default: value } : generic;
      }),
    })),
    instances: (params.contract.instances || []).map((instance) => {
      const child = params.contract.components.find((component) => component.id === instance.childComponentId);
      if (!child) return instance;
      const genericMap = { ...(instance.genericMap || {}) };
      for (const generic of child.generics || []) {
        const value = valueByComponentGeneric.get(`${child.id.toLowerCase()}.${generic.name.toLowerCase()}`);
        if (value) genericMap[generic.name] = value;
      }
      return { ...instance, genericMap };
    }),
  };
  return nextContract;
}
