import { createHash } from 'node:crypto';
import type { FpgaArchitectureComponentContract } from './fpgaArchitectureContract';
import type { GoldenLeafInterfaceItem } from './fpgaGoldenLeafLibrary';
import type { VerifiedVhdlBlockNearMatch } from './fpgaVerifiedVhdlBlockLibrary';
import { classifyVerifiedPortRole, rolesCompatible } from './fpgaVerifiedVhdlPortRoles';
import { canonicalParameterName } from './fpgaArchitectureParameterIntent';

export type VerifiedVhdlParameterCompatibilityKind =
  | 'parameter_exact'
  | 'parameter_safe_configured'
  | 'parameter_unsafe';

export type VerifiedVhdlParameterConstraint = {
  genericName: string;
  rule: string;
  value: number | null;
  ok: boolean;
  message: string;
};

export type VerifiedVhdlGenericDerivation = {
  generic: string;
  value: number;
  source: 'approved-port-width';
  sourceReference: string;
  verifiedType: string;
  approvedType: string;
};

export type VerifiedVhdlParameterCompatibilityResult = {
  kind: VerifiedVhdlParameterCompatibilityKind;
  genericMap: Record<string, string>;
  resolvedValues: Record<string, string>;
  constraints: VerifiedVhdlParameterConstraint[];
  derivations: VerifiedVhdlGenericDerivation[];
  unsafeReasons: string[];
  requiresConfiguredSmoke: boolean;
  configurationHash: string;
};

function normalizeName(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase();
}

function canonicalGenericKey(value: string | null | undefined) {
  return canonicalParameterName(String(value || '').replace(/^(?:g|c)_/i, '')).toLowerCase();
}

function normalizeType(value: string | null | undefined) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*([()+\-*/])\s*/g, '$1')
    .toLowerCase();
}

function normalizeValue(value: string | null | undefined) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function stableHash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function parseIntegerLiteral(value: string | null | undefined) {
  const normalized = normalizeValue(value).replace(/_/g, '');
  if (!/^[+-]?\d+$/.test(normalized)) return null;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function widthOfConcreteVector(type: string) {
  const normalized = normalizeType(type);
  const match = normalized.match(/\((\d+)\s+downto\s+(\d+)\)/);
  if (!match) return null;
  return Math.abs(Number(match[1]) - Number(match[2])) + 1;
}

function genericWidthNameFromVectorType(type: string) {
  const normalized = normalizeType(type);
  const match = normalized.match(/\(([a-zA-Z][a-zA-Z0-9_]*)-1\s+downto\s+0\)/);
  return match?.[1] || null;
}

function sameBaseName(left: string, right: string) {
  const base = (value: string) => normalizeName(value)
    .replace(/^(?:i_|o_)/, '')
    .replace(/_(?:i|o|in|out)$/, '')
    .replace(/^(?:in|out)_/, '');
  return base(left) === base(right);
}

function findApprovedPortForVerifiedPort(params: {
  verifiedPort: GoldenLeafInterfaceItem;
  approvedPorts: GoldenLeafInterfaceItem[];
  component: FpgaArchitectureComponentContract;
}) {
  const compatible = params.approvedPorts.filter((port) => normalizeName(port.mode) === normalizeName(params.verifiedPort.mode));
  const exact = compatible.find((port) => normalizeName(port.name) === normalizeName(params.verifiedPort.name));
  if (exact) return exact;
  const baseMatches = compatible.filter((port) => sameBaseName(port.name, params.verifiedPort.name));
  if (baseMatches.length === 1) return baseMatches[0];
  const verifiedRole = classifyVerifiedPortRole(params.verifiedPort, params.component);
  const roleMatches = compatible
    .map((port) => ({ port, role: classifyVerifiedPortRole(port, params.component) }))
    .filter((entry) => rolesCompatible(verifiedRole, entry.role));
  return roleMatches.length === 1 ? roleMatches[0].port : null;
}

function deriveGenericWidthsFromPortTypes(params: {
  component: FpgaArchitectureComponentContract;
  candidate: VerifiedVhdlBlockNearMatch;
}) {
  const derivations: VerifiedVhdlGenericDerivation[] = [];
  const unsafeReasons: string[] = [];
  const values = new Map<string, VerifiedVhdlGenericDerivation>();
  for (const verifiedPort of params.candidate.actualSignature.ports) {
    const generic = genericWidthNameFromVectorType(verifiedPort.type);
    if (!generic) continue;
    const approvedPort = findApprovedPortForVerifiedPort({
      verifiedPort,
      approvedPorts: params.candidate.approvedSignature.ports,
      component: params.component,
    });
    if (!approvedPort) continue;
    const width = widthOfConcreteVector(approvedPort.type);
    if (width === null) continue;
    const key = normalizeName(generic);
    const nextDerivation: VerifiedVhdlGenericDerivation = {
      generic,
      value: width,
      source: 'approved-port-width',
      sourceReference: approvedPort.name,
      verifiedType: verifiedPort.type,
      approvedType: approvedPort.type,
    };
    const previous = values.get(key);
    if (previous && previous.value !== width) {
      unsafeReasons.push(
        `generic_derivation_conflict ${generic}: ${previous.value} from ${previous.sourceReference} conflicts with ${width} from ${approvedPort.name}`,
      );
      continue;
    }
    if (!previous) {
      values.set(key, nextDerivation);
      derivations.push(nextDerivation);
    }
  }
  return { derivations, unsafeReasons };
}

function isIntegerLikeType(type: string) {
  return /^(?:positive|natural|integer)\b/i.test(normalizeType(type));
}

function isBooleanLikeType(type: string) {
  return /^boolean\b/i.test(normalizeType(type));
}

function isKnownConfigurableGeneric(name: string) {
  return /^(?:width|data_width|elem_width|addr_width|address_width|key_width|pc_width|status_width|count_width|cmd_width|cfg_width|sensor_width|mon_width|fifo_depth|mem_depth|depth|reg_count|reset_vector|instr_bytes|instruction_bytes|xor_mask|threshold|clock_hz|clk_hz|baud_rate|baud|data_bits|stop_bits|latency_cycles|stages|signed_mode|saturating|acc_width|gain_shift|lanes|modulus|step)$/i.test(name);
}

function isInternalLockedConfigurationGeneric(name: string) {
  return /^G_CONFIG_(?:SCHEMA|ID)$/i.test(name);
}

function publicGenerics(generics: GoldenLeafInterfaceItem[]) {
  return generics.filter((generic) => !isInternalLockedConfigurationGeneric(generic.name));
}

function samePublicGenericShape(left: GoldenLeafInterfaceItem[], right: GoldenLeafInterfaceItem[]) {
  if (left.length !== right.length) return false;
  return left.every((item, index) => (
    normalizeName(item.name) === normalizeName(right[index]?.name)
    && normalizeType(item.type) === normalizeType(right[index]?.type)
  ));
}

function samePublicPortShape(left: GoldenLeafInterfaceItem[], right: GoldenLeafInterfaceItem[]) {
  if (left.length !== right.length) return false;
  return left.every((item, index) => (
    normalizeName(item.name) === normalizeName(right[index]?.name)
    && normalizeName(item.mode) === normalizeName(right[index]?.mode)
    && normalizeType(item.type) === normalizeType(right[index]?.type)
  ));
}

export function hasSamePublicInterfaceIgnoringGenericDefaults(candidate: VerifiedVhdlBlockNearMatch) {
  return normalizeName(candidate.actualSignature.entityName) === normalizeName(candidate.approvedSignature.entityName)
    && samePublicGenericShape(publicGenerics(candidate.actualSignature.generics), publicGenerics(candidate.approvedSignature.generics))
    && samePublicPortShape(candidate.actualSignature.ports, candidate.approvedSignature.ports);
}

function inferMinimumFromAssert(content: string, genericName: string) {
  const escaped = genericName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(new RegExp(`\\b${escaped}\\s*>=\\s*(\\d+)`, 'i'));
  return match ? Number.parseInt(match[1], 10) : null;
}

function isPowerOfTwo(value: number) {
  return value > 0 && (value & (value - 1)) === 0;
}

export function evaluateVerifiedVhdlParameterCompatibility(params: {
  component: FpgaArchitectureComponentContract;
  candidate: VerifiedVhdlBlockNearMatch;
}): VerifiedVhdlParameterCompatibilityResult {
  const genericMap: Record<string, string> = {};
  const resolvedValues: Record<string, string> = {};
  const constraints: VerifiedVhdlParameterConstraint[] = [];
  const unsafeReasons: string[] = [];
  const verifiedPublicGenerics = publicGenerics(params.candidate.actualSignature.generics);
  const approvedPublicGenerics = publicGenerics(params.candidate.approvedSignature.generics);
  const approvedByName = new Map(approvedPublicGenerics.map((item) => [normalizeName(item.name), item]));
  const approvedByCanonical = new Map<string, GoldenLeafInterfaceItem[]>();
  for (const approvedGeneric of approvedPublicGenerics) {
    const key = canonicalGenericKey(approvedGeneric.name);
    approvedByCanonical.set(key, [...(approvedByCanonical.get(key) || []), approvedGeneric]);
  }
  const mappedApprovedGenericNames = new Set<string>();
  let changed = false;
  const portWidthDerivation = deriveGenericWidthsFromPortTypes(params);
  const derivedByGeneric = new Map(portWidthDerivation.derivations.map((entry) => [normalizeName(entry.generic), entry]));
  unsafeReasons.push(...portWidthDerivation.unsafeReasons);

  for (const verifiedGeneric of verifiedPublicGenerics) {
    const canonicalMatches = approvedByCanonical.get(canonicalGenericKey(verifiedGeneric.name)) || [];
    const approvedGeneric = approvedByName.get(normalizeName(verifiedGeneric.name))
      || (canonicalMatches.length === 1 ? canonicalMatches[0] : undefined);
    if (!approvedGeneric) {
      unsafeReasons.push(`verified generic ${verifiedGeneric.name} has no approved generic to map`);
      continue;
    }
    if (normalizeType(verifiedGeneric.type) !== normalizeType(approvedGeneric.type)) {
      unsafeReasons.push(`generic ${verifiedGeneric.name} type differs: ${verifiedGeneric.type} vs ${approvedGeneric.type}`);
      continue;
    }
    genericMap[verifiedGeneric.name] = approvedGeneric.name;
    mappedApprovedGenericNames.add(normalizeName(approvedGeneric.name));
    mappedApprovedGenericNames.add(canonicalGenericKey(approvedGeneric.name));
    const verifiedDefault = normalizeValue(verifiedGeneric.defaultValue);
    const derived = derivedByGeneric.get(normalizeName(verifiedGeneric.name));
    const approvedDefault = derived ? String(derived.value) : normalizeValue(approvedGeneric.defaultValue);
    if (derived) genericMap[verifiedGeneric.name] = approvedDefault;
    resolvedValues[verifiedGeneric.name] = approvedDefault || verifiedDefault;
    if (verifiedDefault !== approvedDefault) changed = true;

    if (!changed && verifiedDefault === approvedDefault) continue;
    if (!isKnownConfigurableGeneric(verifiedGeneric.name)) {
      unsafeReasons.push(`generic ${verifiedGeneric.name} is not recognized as a deterministic configuration parameter`);
      continue;
    }
    const booleanConfig = /^(?:signed_mode|saturating)$/i.test(verifiedGeneric.name) && isBooleanLikeType(verifiedGeneric.type);
    if (!isIntegerLikeType(verifiedGeneric.type) && !booleanConfig) {
      unsafeReasons.push(`generic ${verifiedGeneric.name} uses non-integer-like type ${verifiedGeneric.type}`);
      continue;
    }
    const value = booleanConfig
      ? (/^(?:true|1)$/i.test(approvedDefault) ? 1 : /^(?:false|0)$/i.test(approvedDefault) ? 0 : null)
      : parseIntegerLiteral(approvedDefault);
    if (value === null) {
      unsafeReasons.push(`generic ${verifiedGeneric.name} value "${approvedDefault || '(empty)'}" is not a literal integer`);
      continue;
    }
    const positiveOk = booleanConfig ? true : /positive/i.test(verifiedGeneric.type) ? value > 0 : value >= 0;
    constraints.push({
      genericName: verifiedGeneric.name,
      rule: /positive/i.test(verifiedGeneric.type) ? 'positive_integer' : 'non_negative_integer',
      value,
      ok: positiveOk,
      message: positiveOk ? `${verifiedGeneric.name}=${value} is in range` : `${verifiedGeneric.name}=${value} violates ${verifiedGeneric.type}`,
    });
    if (!positiveOk) unsafeReasons.push(`${verifiedGeneric.name}=${value} violates ${verifiedGeneric.type}`);

    if (/depth/i.test(verifiedGeneric.name)) {
      const minimum = inferMinimumFromAssert(params.candidate.rtlContent, verifiedGeneric.name);
      if (minimum !== null) {
        const minimumOk = value >= minimum;
        constraints.push({
          genericName: verifiedGeneric.name,
          rule: `minimum_${minimum}`,
          value,
          ok: minimumOk,
          message: minimumOk ? `${verifiedGeneric.name}=${value} satisfies minimum ${minimum}` : `${verifiedGeneric.name}=${value} is below minimum ${minimum}`,
        });
        if (!minimumOk) unsafeReasons.push(`${verifiedGeneric.name}=${value} is below verified minimum ${minimum}`);
      }
      if (/async_fifo|is_power_of_two/i.test(params.candidate.rtlContent)) {
        const powerOk = isPowerOfTwo(value);
        constraints.push({
          genericName: verifiedGeneric.name,
          rule: 'power_of_two',
          value,
          ok: powerOk,
          message: powerOk ? `${verifiedGeneric.name}=${value} is a power of two` : `${verifiedGeneric.name}=${value} is not a power of two`,
        });
        if (!powerOk) unsafeReasons.push(`${verifiedGeneric.name}=${value} is not a power of two`);
      }
    }
    if (/^(?:clock_hz|clk_hz)$/i.test(verifiedGeneric.name)) {
      const minimumOk = value > 0;
      constraints.push({
        genericName: verifiedGeneric.name,
        rule: 'positive_clock_frequency_hz',
        value,
        ok: minimumOk,
        message: minimumOk ? `${verifiedGeneric.name}=${value} Hz is positive` : `${verifiedGeneric.name}=${value} must be positive`,
      });
      if (!minimumOk) unsafeReasons.push(`${verifiedGeneric.name} must be a positive frequency`);
    }
    if (/^(?:baud_rate|baud)$/i.test(verifiedGeneric.name)) {
      const clockValueEntry = Object.entries(resolvedValues).find(([name]) => /^(?:clock_hz|clk_hz)$/i.test(name));
      const clockValue = clockValueEntry ? parseIntegerLiteral(clockValueEntry[1]) : null;
      const baudOk = value > 0 && (clockValue === null || value < clockValue);
      constraints.push({
        genericName: verifiedGeneric.name,
        rule: clockValue === null ? 'positive_baud_rate' : 'baud_less_than_clock',
        value,
        ok: baudOk,
        message: baudOk ? `${verifiedGeneric.name}=${value} is compatible with clock${clockValue === null ? '' : ` ${clockValue}`}` : `${verifiedGeneric.name}=${value} must be positive and less than CLOCK_HZ`,
      });
      if (!baudOk) unsafeReasons.push(`${verifiedGeneric.name}=${value} is not compatible with CLOCK_HZ=${clockValue ?? '(unknown)'}`);
    }
    if (/^data_bits$/i.test(verifiedGeneric.name)) {
      const ok = value >= 5 && value <= 9;
      constraints.push({
        genericName: verifiedGeneric.name,
        rule: 'uart_data_bits_5_to_9',
        value,
        ok,
        message: ok ? `${verifiedGeneric.name}=${value} is in UART-compatible range` : `${verifiedGeneric.name}=${value} must be between 5 and 9`,
      });
      if (!ok) unsafeReasons.push(`${verifiedGeneric.name}=${value} must be between 5 and 9`);
    }
    if (/^(?:key_width)$/i.test(verifiedGeneric.name)) {
      const ok = [128, 192, 256].includes(value) || !/aes|crypto|cipher/i.test(params.candidate.rtlContent);
      constraints.push({
        genericName: verifiedGeneric.name,
        rule: 'key_width_common_crypto_values',
        value,
        ok,
        message: ok ? `${verifiedGeneric.name}=${value} is an accepted key width` : `${verifiedGeneric.name}=${value} should be one of 128, 192, or 256`,
      });
      if (!ok) unsafeReasons.push(`${verifiedGeneric.name}=${value} is not a supported cryptographic key width`);
    }
    if (/^(?:signed_mode|saturating)$/i.test(verifiedGeneric.name)) {
      const ok = /^(?:0|1|true|false)$/i.test(approvedDefault);
      constraints.push({
        genericName: verifiedGeneric.name,
        rule: 'boolean_compatible',
        value: parseIntegerLiteral(approvedDefault),
        ok,
        message: ok ? `${verifiedGeneric.name}=${approvedDefault} is boolean-compatible` : `${verifiedGeneric.name}=${approvedDefault} must be true/false/0/1`,
      });
      if (!ok) unsafeReasons.push(`${verifiedGeneric.name}=${approvedDefault} is not boolean-compatible`);
    }
    if (/^(?:latency_cycles|stages|gain_shift|lanes|modulus|step|instr_bytes|instruction_bytes)$/i.test(verifiedGeneric.name)) {
      const naturalOk = /^(?:latency_cycles|gain_shift)$/i.test(verifiedGeneric.name) ? value >= 0 : value > 0;
      constraints.push({
        genericName: verifiedGeneric.name,
        rule: /^(?:latency_cycles|gain_shift)$/i.test(verifiedGeneric.name) ? 'non_negative_integer' : 'positive_integer',
        value,
        ok: naturalOk,
        message: naturalOk ? `${verifiedGeneric.name}=${value} satisfies integer range` : `${verifiedGeneric.name}=${value} violates required integer range`,
      });
      if (!naturalOk) unsafeReasons.push(`${verifiedGeneric.name}=${value} violates required integer range`);
    }
  }

  for (const approvedGeneric of approvedPublicGenerics) {
    if (
      !mappedApprovedGenericNames.has(normalizeName(approvedGeneric.name))
      && !mappedApprovedGenericNames.has(canonicalGenericKey(approvedGeneric.name))
    ) {
      unsafeReasons.push(`approved generic ${approvedGeneric.name} cannot be represented by verified block`);
    }
  }

  const configurationHash = stableHash({
    block: params.candidate.blockName,
    entity: params.candidate.entityName,
    genericMap,
    resolvedValues,
  });
  if (unsafeReasons.length > 0) {
    return { kind: 'parameter_unsafe', genericMap, resolvedValues, constraints, derivations: portWidthDerivation.derivations, unsafeReasons, requiresConfiguredSmoke: false, configurationHash };
  }
  return {
    kind: changed ? 'parameter_safe_configured' : 'parameter_exact',
    genericMap,
    resolvedValues,
    constraints,
    derivations: portWidthDerivation.derivations,
    unsafeReasons,
    requiresConfiguredSmoke: changed,
    configurationHash,
  };
}
