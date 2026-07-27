import type { FpgaArchitectureComponentContract, FpgaArchitectureContract } from './fpgaArchitectureContract';
import { renderEntityDeclaration, renderLibraryContext } from './fpgaContractRenderer';
import type { GoldenLeafInterfaceItem } from './fpgaGoldenLeafLibrary';
import type { VerifiedVhdlBlockNearMatch } from './fpgaVerifiedVhdlBlockLibrary';
import type { VerifiedVhdlParameterCompatibilityResult } from './fpgaVerifiedVhdlParameterGate';
import {
  classifyVerifiedPortRole,
  isReceiverLikeComponent,
  rolesCompatible,
} from './fpgaVerifiedVhdlPortRoles';

export type VerifiedWrapperMismatch = {
  kind: string;
  approvedName?: string;
  verifiedName?: string;
  approvedType?: string;
  verifiedType?: string;
  message: string;
};

export type VerifiedWrapperPlan = {
  kind: 'wrapper_safe' | 'wrapper_unsafe';
  componentId: string;
  approvedEntityName: string;
  verifiedBlockName: string;
  verifiedEntityName: string;
  mismatches: VerifiedWrapperMismatch[];
  unsafeReasons: string[];
  portAssociations: Record<string, string>;
  genericAssociations: Record<string, string>;
  declarations: string[];
  preInstanceAssignments: string[];
  postInstanceAssignments: string[];
};

function normalizeName(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase();
}

function isInternalLockedConfigurationGeneric(name: string) {
  return /^g_config_(?:schema|id)$/i.test(String(name || '').trim());
}

function normalizeType(value: string | null | undefined) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*([()+\-*/])\s*/g, '$1')
    .toLowerCase();
}

function substituteResolvedGenerics(type: string, resolvedValues: Record<string, string> = {}) {
  let result = String(type || '');
  for (const [name, value] of Object.entries(resolvedValues)) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), value);
  }
  return result.replace(/\b(\d+)\s*-\s*1\b/g, (_match, raw) => String(Number(raw) - 1));
}

function baseSignalName(name: string) {
  return normalizeName(name)
    .replace(/^(?:i_|o_)/, '')
    .replace(/_(?:i|o|in|out)$/, '')
    .replace(/^(?:in|out)_/, '');
}

function widthOfVector(type: string, resolvedValues: Record<string, string> = {}) {
  const normalized = normalizeType(substituteResolvedGenerics(type, resolvedValues));
  const match = normalized.match(/\((\d+)\s+downto\s+(\d+)\)/);
  if (!match) return null;
  return Math.abs(Number(match[1]) - Number(match[2])) + 1;
}

function vectorKind(type: string) {
  const normalized = normalizeType(type);
  if (/\bstd_logic_vector\b/.test(normalized)) return 'std_logic_vector';
  if (/\bunsigned\b/.test(normalized)) return 'unsigned';
  if (/\bsigned\b/.test(normalized)) return 'signed';
  return null;
}

function isScalarLogic(type: string) {
  return /\bstd_(?:u)?logic\b/.test(normalizeType(type)) && !/vector/.test(normalizeType(type));
}

function sameType(left: string, right: string, resolvedValues: Record<string, string> = {}) {
  return normalizeType(substituteResolvedGenerics(left, resolvedValues)) === normalizeType(substituteResolvedGenerics(right, resolvedValues));
}

function isSafeVectorConversion(fromType: string, toType: string, resolvedValues: Record<string, string> = {}) {
  const fromKind = vectorKind(fromType);
  const toKind = vectorKind(toType);
  if (!fromKind || !toKind || fromKind === toKind) return false;
  const fromWidth = widthOfVector(fromType, resolvedValues);
  const toWidth = widthOfVector(toType, resolvedValues);
  return fromWidth !== null && toWidth !== null && fromWidth === toWidth;
}

function conversionExpression(value: string, fromType: string, toType: string, resolvedValues: Record<string, string> = {}) {
  if (sameType(fromType, toType, resolvedValues)) return value;
  if (!isSafeVectorConversion(fromType, toType, resolvedValues)) return value;
  const toKind = vectorKind(toType);
  if (toKind === 'std_logic_vector') return `std_logic_vector(${value})`;
  if (toKind === 'unsigned') return `unsigned(${value})`;
  if (toKind === 'signed') return `signed(${value})`;
  return value;
}

function defaultValueForPortType(type: string) {
  const normalized = normalizeType(type);
  if (/\bstd_(?:u)?logic\b/.test(normalized) && !/vector/.test(normalized)) return "'0'";
  if (/\b(?:std_logic_vector|std_ulogic_vector|unsigned|signed)\b/.test(normalized)) return "(others => '0')";
  if (/\bboolean\b/.test(normalized)) return 'false';
  if (/\b(?:integer|natural|positive)\b/.test(normalized)) return '0';
  return 'open';
}

function matchInterfaceItem(
  verifiedItem: GoldenLeafInterfaceItem,
  approvedItems: GoldenLeafInterfaceItem[],
  component: FpgaArchitectureComponentContract,
) {
  const compatibleItems = approvedItems.filter((item) => item.mode === verifiedItem.mode);
  const exact = compatibleItems.find((item) => normalizeName(item.name) === normalizeName(verifiedItem.name));
  if (exact) return { item: exact, adapterKind: 'exact' };
  const verifiedBase = baseSignalName(verifiedItem.name);
  const baseMatches = compatibleItems.filter((item) => baseSignalName(item.name) === verifiedBase);
  if (baseMatches.length === 1) return { item: baseMatches[0], adapterKind: 'base_alias' };
  const aliases: Record<string, string[]> = {
    clk: ['clock', 'clk_i'],
    clock: ['clk', 'clk_i'],
    rst: ['reset', 'rst_i', 'reset_i'],
    reset: ['rst', 'rst_i', 'reset_i'],
    din: ['data', 'data_i', 'in_data'],
    dout: ['data', 'data_o', 'out_data'],
    uart_rx: ['rx', 'rx_i', 'serial_rx', 'serial_rx_i'],
    rx: ['uart_rx', 'rx_i', 'serial_rx', 'serial_rx_i'],
    rx_data: ['data', 'data_o', 'payload_o', 'out_data'],
    rx_valid: ['valid', 'valid_o', 'data_valid', 'data_valid_o'],
    framing_error: ['error', 'error_o', 'err_o', 'framing_error_o'],
  };
  const aliasMatches = compatibleItems.filter((item) => (aliases[verifiedBase] || []).includes(baseSignalName(item.name)));
  if (aliasMatches.length === 1) return { item: aliasMatches[0], adapterKind: 'name_alias' };

  const verifiedRole = classifyVerifiedPortRole(verifiedItem, component);
  const roleMatches = compatibleItems
    .map((item) => ({ item, role: classifyVerifiedPortRole(item, component) }))
    .filter((entry) => rolesCompatible(verifiedRole, entry.role));
  if (roleMatches.length === 1) {
    return {
      item: roleMatches[0].item,
      adapterKind: verifiedRole.role === 'reset' && verifiedRole.activeLowReset !== roleMatches[0].role.activeLowReset
        ? 'reset_polarity_adapter'
        : 'role_alias_adapter',
    };
  }
  return null;
}

function safeExtraInputDefault(name: string) {
  const normalized = normalizeName(name);
  if (/^(?:en|enable|enable_i|ce|clock_enable|clock_enable_i)$/.test(normalized)) return "'1'";
  if (/^(?:clear|clr|flush|load|start|valid|ready)(?:_i)?$/.test(normalized)) return "'0'";
  return null;
}

function adaptedSignalName(name: string) {
  return `w_${normalizeName(name)}_adapt`;
}

function isSafeUnusedApprovedPort(params: {
  approvedPort: GoldenLeafInterfaceItem;
  component: FpgaArchitectureComponentContract;
  verifiedPorts: GoldenLeafInterfaceItem[];
}) {
  if (params.approvedPort.mode !== 'in') return false;
  const role = classifyVerifiedPortRole(params.approvedPort, params.component);
  if (role.role === 'enable') return true;
  const hasSerialRx = params.verifiedPorts.some((port) => classifyVerifiedPortRole(port, params.component).role === 'serial_rx');
  return role.role === 'payload_in' && hasSerialRx && isReceiverLikeComponent(params.component);
}

export function planVerifiedVhdlWrapper(params: {
  component: FpgaArchitectureComponentContract;
  candidate: VerifiedVhdlBlockNearMatch;
  parameterCompatibility?: VerifiedVhdlParameterCompatibilityResult;
}): VerifiedWrapperPlan {
  const mismatches: VerifiedWrapperMismatch[] = [];
  const unsafeReasons: string[] = [];
  const portAssociations: Record<string, string> = {};
  const genericAssociations: Record<string, string> = {};
  const declarations: string[] = [];
  const preInstanceAssignments: string[] = [];
  const postInstanceAssignments: string[] = [];
  const approvedPorts = params.candidate.approvedSignature.ports;
  const usedApprovedPorts = new Set<string>();
  const resolvedGenericValues = params.parameterCompatibility?.resolvedValues || {};
  const approvedEnable = approvedPorts.find((port) => (
    port.mode === 'in'
    && isScalarLogic(port.type)
    && classifyVerifiedPortRole(port, params.component).role === 'enable'
  ));

  if (params.parameterCompatibility) {
    Object.assign(genericAssociations, params.parameterCompatibility.genericMap);
    unsafeReasons.push(...params.parameterCompatibility.unsafeReasons);
    for (const reason of params.parameterCompatibility.unsafeReasons) {
      mismatches.push({ kind: 'generic_parameter_mismatch', message: reason });
    }
  } else {
    const approvedGenerics = params.candidate.approvedSignature.generics.filter((generic) => !isInternalLockedConfigurationGeneric(generic.name));
    const usedApprovedGenerics = new Set<string>();
    for (const verifiedGeneric of params.candidate.actualSignature.generics) {
      if (isInternalLockedConfigurationGeneric(verifiedGeneric.name)) continue;
      const approvedGeneric = approvedGenerics.find((item) => normalizeName(item.name) === normalizeName(verifiedGeneric.name));
      if (!approvedGeneric) {
        unsafeReasons.push(`verified generic ${verifiedGeneric.name} has no approved generic to map`);
        mismatches.push({ kind: 'extra_generic', verifiedName: verifiedGeneric.name, message: `Extra verified generic ${verifiedGeneric.name}` });
        continue;
      }
      if (!sameType(verifiedGeneric.type, approvedGeneric.type, resolvedGenericValues)) {
        unsafeReasons.push(`generic ${verifiedGeneric.name} type differs: ${verifiedGeneric.type} vs ${approvedGeneric.type}`);
        mismatches.push({ kind: 'generic_type_mismatch', approvedName: approvedGeneric.name, verifiedName: verifiedGeneric.name, approvedType: approvedGeneric.type, verifiedType: verifiedGeneric.type, message: `Generic type mismatch for ${verifiedGeneric.name}` });
        continue;
      }
      genericAssociations[verifiedGeneric.name] = approvedGeneric.name;
      usedApprovedGenerics.add(normalizeName(approvedGeneric.name));
    }
    for (const approvedGeneric of approvedGenerics) {
      if (!usedApprovedGenerics.has(normalizeName(approvedGeneric.name))) {
        unsafeReasons.push(`approved generic ${approvedGeneric.name} cannot be represented by verified block`);
        mismatches.push({ kind: 'missing_generic', approvedName: approvedGeneric.name, message: `Approved generic ${approvedGeneric.name} is missing from verified block` });
      }
    }
  }

  for (const verifiedPort of params.candidate.actualSignature.ports) {
    const approvedMatch = matchInterfaceItem(verifiedPort, approvedPorts, params.component);
    const approvedPort = approvedMatch?.item || null;
    if (!approvedPort) {
      if (verifiedPort.mode === 'in') {
        const defaultValue = safeExtraInputDefault(verifiedPort.name);
        if (defaultValue !== null && isScalarLogic(verifiedPort.type)) {
          portAssociations[verifiedPort.name] = defaultValue;
          mismatches.push({ kind: 'extra_input_tied_off', verifiedName: verifiedPort.name, message: `Extra verified input ${verifiedPort.name} tied to ${defaultValue}` });
          continue;
        }
      }
      if (verifiedPort.mode === 'out' || verifiedPort.mode === 'buffer') {
        portAssociations[verifiedPort.name] = 'open';
        mismatches.push({ kind: 'extra_output_open', verifiedName: verifiedPort.name, message: `Extra verified output ${verifiedPort.name} left open` });
        continue;
      }
      unsafeReasons.push(`verified port ${verifiedPort.name} cannot be safely mapped`);
      mismatches.push({ kind: 'extra_port', verifiedName: verifiedPort.name, verifiedType: verifiedPort.type, message: `Extra verified port ${verifiedPort.name} cannot be mapped safely` });
      continue;
    }
    if (verifiedPort.mode !== approvedPort.mode) {
      unsafeReasons.push(`port ${verifiedPort.name} mode differs: ${verifiedPort.mode} vs ${approvedPort.mode}`);
      mismatches.push({ kind: 'port_mode_mismatch', approvedName: approvedPort.name, verifiedName: verifiedPort.name, message: `Mode mismatch for ${verifiedPort.name}` });
      continue;
    }

    usedApprovedPorts.add(normalizeName(approvedPort.name));
    if (sameType(verifiedPort.type, approvedPort.type, resolvedGenericValues)) {
      if (approvedMatch?.adapterKind === 'reset_polarity_adapter') {
        const signalName = adaptedSignalName(verifiedPort.name);
        declarations.push(`  signal ${signalName} : ${verifiedPort.type};`);
        preInstanceAssignments.push(`  ${signalName} <= not ${approvedPort.name};`);
        portAssociations[verifiedPort.name] = signalName;
        mismatches.push({ kind: 'reset_polarity_adapter', approvedName: approvedPort.name, verifiedName: verifiedPort.name, message: `Adapted reset polarity ${approvedPort.name} to verified ${verifiedPort.name}` });
        continue;
      }
      const verifiedRole = classifyVerifiedPortRole(verifiedPort, params.component);
      const shouldGateOutput = approvedEnable
        && approvedPort.name !== approvedEnable.name
        && (verifiedPort.mode === 'out' || verifiedPort.mode === 'buffer')
        && ['valid', 'payload_out', 'error', 'status'].includes(verifiedRole.role);
      if (shouldGateOutput) {
        const signalName = adaptedSignalName(verifiedPort.name);
        declarations.push(`  signal ${signalName} : ${verifiedPort.type};`);
        portAssociations[verifiedPort.name] = signalName;
        postInstanceAssignments.push(`  ${approvedPort.name} <= ${signalName} when ${approvedEnable.name} = '1' else ${defaultValueForPortType(approvedPort.type)};`);
        mismatches.push({ kind: 'optional_enable_output_gate', approvedName: approvedPort.name, verifiedName: verifiedPort.name, message: `Gated ${approvedPort.name} with approved enable input ${approvedEnable.name}` });
        continue;
      }
      portAssociations[verifiedPort.name] = approvedPort.name;
      if (normalizeName(verifiedPort.name) !== normalizeName(approvedPort.name) || approvedMatch?.adapterKind !== 'exact') {
        mismatches.push({ kind: approvedMatch?.adapterKind || 'port_rename_adapter', approvedName: approvedPort.name, verifiedName: verifiedPort.name, message: `Mapped approved ${approvedPort.name} to verified ${verifiedPort.name}` });
      }
      continue;
    }
    if (!isSafeVectorConversion(approvedPort.type, verifiedPort.type, resolvedGenericValues)) {
      unsafeReasons.push(`port ${approvedPort.name}/${verifiedPort.name} type differs unsafely: ${approvedPort.type} vs ${verifiedPort.type}`);
      mismatches.push({ kind: 'port_type_mismatch', approvedName: approvedPort.name, verifiedName: verifiedPort.name, approvedType: approvedPort.type, verifiedType: verifiedPort.type, message: `Unsafe type mismatch for ${approvedPort.name}` });
      continue;
    }
    const signalName = adaptedSignalName(verifiedPort.name);
    declarations.push(`  signal ${signalName} : ${verifiedPort.type};`);
    if (verifiedPort.mode === 'in') {
      preInstanceAssignments.push(`  ${signalName} <= ${conversionExpression(approvedPort.name, approvedPort.type, verifiedPort.type, resolvedGenericValues)};`);
      portAssociations[verifiedPort.name] = signalName;
    } else if (verifiedPort.mode === 'out' || verifiedPort.mode === 'buffer') {
      portAssociations[verifiedPort.name] = signalName;
      const converted = conversionExpression(signalName, verifiedPort.type, approvedPort.type, resolvedGenericValues);
      postInstanceAssignments.push(
        approvedEnable
          ? `  ${approvedPort.name} <= ${converted} when ${approvedEnable.name} = '1' else ${defaultValueForPortType(approvedPort.type)};`
          : `  ${approvedPort.name} <= ${converted};`,
      );
    } else {
      unsafeReasons.push(`inout conversion for ${approvedPort.name}/${verifiedPort.name} is unsafe`);
    }
    mismatches.push({ kind: 'safe_vector_conversion', approvedName: approvedPort.name, verifiedName: verifiedPort.name, approvedType: approvedPort.type, verifiedType: verifiedPort.type, message: `Safe vector conversion for ${approvedPort.name}` });
  }

  for (const approvedPort of approvedPorts) {
    if (!usedApprovedPorts.has(normalizeName(approvedPort.name))) {
      if (isSafeUnusedApprovedPort({ approvedPort, component: params.component, verifiedPorts: params.candidate.actualSignature.ports })) {
        mismatches.push({ kind: 'approved_leaf_input_ignored', approvedName: approvedPort.name, approvedType: approvedPort.type, message: `Approved leaf input ${approvedPort.name} is wrapper-level only and is not required by verified block ${params.candidate.blockName}` });
        continue;
      }
      unsafeReasons.push(`approved port ${approvedPort.name} has no verified driver/source`);
      mismatches.push({ kind: 'missing_port', approvedName: approvedPort.name, approvedType: approvedPort.type, message: `Approved port ${approvedPort.name} is missing from verified block` });
    }
  }

  return {
    kind: unsafeReasons.length === 0 ? 'wrapper_safe' : 'wrapper_unsafe',
    componentId: params.component.id,
    approvedEntityName: params.component.name,
    verifiedBlockName: params.candidate.blockName,
    verifiedEntityName: params.candidate.entityName,
    mismatches,
    unsafeReasons,
    portAssociations,
    genericAssociations,
    declarations,
    preInstanceAssignments,
    postInstanceAssignments,
  };
}

function renderMap(keyword: 'generic' | 'port', entries: Record<string, string>) {
  const pairs = Object.entries(entries);
  if (pairs.length === 0) return [];
  return [
    `    ${keyword} map (`,
    ...pairs.map(([formal, actual], index) => `      ${formal} => ${actual}${index === pairs.length - 1 ? '' : ','}`),
    '    )',
  ];
}

export function renderVerifiedVhdlWrapper(params: {
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
  plan: VerifiedWrapperPlan;
}) {
  if (params.plan.kind !== 'wrapper_safe') {
    throw new Error(`Cannot render unsafe verified VHDL wrapper for ${params.component.id}.`);
  }
  const genericMap = renderMap('generic', params.plan.genericAssociations);
  const portMap = renderMap('port', params.plan.portAssociations);
  const mapLines = [...genericMap, ...portMap];
  if (mapLines.length > 0) mapLines[mapLines.length - 1] = `${mapLines[mapLines.length - 1]};`;
  return [
    renderLibraryContext(params.contract, params.component).trimEnd(),
    '',
    renderEntityDeclaration(params.component),
    '',
    `architecture rtl of ${params.component.name} is`,
    '  -- VERIFIED_WRAPPER: app-owned adapter around a GHDL-qualified local VHDL block.',
    `  -- verifiedBlock=${params.plan.verifiedBlockName}; verifiedEntity=${params.plan.verifiedEntityName}`,
    ...params.plan.declarations,
    'begin',
    ...params.plan.preInstanceAssignments,
    `  u_verified_leaf : entity work.${params.plan.verifiedEntityName}`,
    ...mapLines,
    ...params.plan.postInstanceAssignments,
    'end architecture rtl;',
    '',
  ].join('\n');
}
