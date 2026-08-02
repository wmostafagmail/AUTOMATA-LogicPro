import type { FpgaArchitectureComponentContract } from './fpgaArchitectureContract';
import type { GoldenLeafInterfaceItem } from './fpgaGoldenLeafLibrary';
import type { VerifiedVhdlBlockNearMatch } from './fpgaVerifiedVhdlBlockLibrary';
import type { VerifiedWrapperPlan } from './fpgaVerifiedVhdlWrapper';
import {
  classifyVerifiedPortRole,
  rolesCompatible,
} from './fpgaVerifiedVhdlPortRoles';

export type VhdlSpecialistPortMappingAdvice = {
  verifiedPort: string;
  approvedPort: string;
  rationale?: string;
};

export type VhdlSpecialistMissingSignalAdvice = {
  name: string;
  role?: string;
  direction?: string;
  type?: string;
  requiredFor?: string;
  rationale?: string;
};

export type VhdlSpecialistAdvisorScore = {
  accepted: boolean;
  acceptedMappings: VhdlSpecialistPortMappingAdvice[];
  rejectedMappings: Array<VhdlSpecialistPortMappingAdvice & { reason: string }>;
  missingContractSignals: VhdlSpecialistMissingSignalAdvice[];
  rejectedReasons: string[];
  verdict: string;
  rawText: string;
};

function normalizeName(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase();
}

function legalIdentifier(value: string) {
  return /^[A-Za-z][A-Za-z0-9_]*$/.test(value) && !/__/.test(value);
}

function extractJsonObject(text: string) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function itemSummary(item: GoldenLeafInterfaceItem, component: FpgaArchitectureComponentContract) {
  const role = classifyVerifiedPortRole(item, component);
  return `${item.name}{mode=${item.mode || 'generic'}, type=${item.type}, role=${role.role}, confidence=${role.confidence}}`;
}

function coerceMapping(value: any): VhdlSpecialistPortMappingAdvice | null {
  if (!value || typeof value !== 'object') return null;
  const verifiedPort = String(value.verifiedPort || value.verified || value.verifiedName || '').trim();
  const approvedPort = String(value.approvedPort || value.approved || value.approvedName || '').trim();
  if (!verifiedPort || !approvedPort) return null;
  return {
    verifiedPort,
    approvedPort,
    rationale: typeof value.rationale === 'string' ? value.rationale : undefined,
  };
}

function collectMappings(json: any): VhdlSpecialistPortMappingAdvice[] {
  const candidates = [
    json?.safeMappings,
    json?.mappings,
    json?.portMappings,
    json?.wrapperPlan?.safeMappings,
  ];
  return candidates
    .flatMap((candidate) => (Array.isArray(candidate) ? candidate : []))
    .map(coerceMapping)
    .filter((candidate): candidate is VhdlSpecialistPortMappingAdvice => Boolean(candidate));
}

function coerceMissingSignal(value: any): VhdlSpecialistMissingSignalAdvice | null {
  if (typeof value === 'string') {
    const name = value.trim();
    return name ? { name } : null;
  }
  if (!value || typeof value !== 'object') return null;
  const name = String(value.name || value.signal || value.port || '').trim();
  if (!name) return null;
  return {
    name,
    role: typeof value.role === 'string' ? value.role : undefined,
    direction: typeof value.direction === 'string' ? value.direction : undefined,
    type: typeof value.type === 'string' ? value.type : undefined,
    requiredFor: typeof value.requiredFor === 'string' ? value.requiredFor : undefined,
    rationale: typeof value.rationale === 'string' ? value.rationale : undefined,
  };
}

function collectMissingSignals(json: any): VhdlSpecialistMissingSignalAdvice[] {
  const candidates = [
    json?.missingContractSignals,
    json?.missingSignals,
    json?.requiredSignals,
    json?.wrapperPlan?.missingContractSignals,
  ];
  const seen = new Set<string>();
  const result: VhdlSpecialistMissingSignalAdvice[] = [];
  for (const signal of candidates
    .flatMap((candidate) => (Array.isArray(candidate) ? candidate : []))
    .map(coerceMissingSignal)
    .filter((candidate): candidate is VhdlSpecialistMissingSignalAdvice => Boolean(candidate))) {
    const normalized = normalizeName(signal.name);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(signal);
  }
  return result;
}

function portByName(items: GoldenLeafInterfaceItem[], name: string) {
  const normalized = normalizeName(name);
  return items.find((item) => normalizeName(item.name) === normalized) || null;
}

function isUnresolvedVerifiedPort(plan: VerifiedWrapperPlan, portName: string) {
  const normalized = normalizeName(portName);
  return plan.mismatches.some((mismatch) => (
    normalizeName(mismatch.verifiedName) === normalized
    && ['extra_port', 'verified_config_input_unresolved'].includes(mismatch.kind)
  ));
}

function suggestedNamesForRole(params: {
  port: GoldenLeafInterfaceItem;
  component: FpgaArchitectureComponentContract;
}) {
  const role = classifyVerifiedPortRole(params.port, params.component).role;
  const name = normalizeName(params.port.name);
  const componentText = [
    params.component.id,
    params.component.name,
    params.component.file,
    params.component.responsibility,
    ...(params.component.implements || []),
  ].join(' ').toLowerCase();
  const dedupe = (items: string[]) => Array.from(new Set(items));
  if (role === 'serial_rx') {
    if (/\bspi|spi_/.test(componentText)) return ['miso_i', 'spi_miso_i', 'serial_rx_i'];
    if (/miso/.test(name)) return ['miso_i', 'spi_miso_i'];
    if (/mosi/.test(name)) return ['mosi_i', 'spi_mosi_i'];
    if (/rx/.test(name)) return ['rx_i', 'serial_rx_i'];
    return ['miso_i', 'serial_rx_i'];
  }
  if (role === 'serial_tx') {
    if (/\bspi|spi_/.test(componentText)) return ['mosi_o', 'spi_mosi_o', 'serial_tx_o'];
    if (/mosi/.test(name)) return ['mosi_o', 'spi_mosi_o'];
    if (/miso/.test(name)) return ['miso_o', 'spi_miso_o'];
    if (/tx/.test(name)) return ['tx_o', 'serial_tx_o'];
    return ['mosi_o', 'serial_tx_o'];
  }
  if (role === 'valid') return dedupe([`${name}_i`, 'start_i', 'valid_i', 'tx_valid_i']);
  if (role === 'ready') return [`${name}_o`, 'ready_o'];
  if (role === 'address') return [`${name}_i`, 'addr_i', 'redirect_pc_i'];
  if (role === 'control') return [`${name}_i`, 'control_i', 'enable_i'];
  if (role === 'config' || role === 'video_timing_config') return [`${name}_i`, 'config_i'];
  if (role === 'payload_in' || role === 'stream_data' || role === 'sample_input') return [`${name}_i`, 'data_i'];
  if (role === 'payload_out' || role === 'sample_output') return [`${name}_o`, 'data_o'];
  return [`${name}_i`];
}

function unresolvedPortRequirementLines(params: {
  component: FpgaArchitectureComponentContract;
  candidate: VerifiedVhdlBlockNearMatch;
  wrapperPlan: VerifiedWrapperPlan;
}) {
  return params.candidate.actualSignature.ports
    .filter((port) => isUnresolvedVerifiedPort(params.wrapperPlan, port.name))
    .map((port) => {
      const role = classifyVerifiedPortRole(port, params.component);
      const suggestions = suggestedNamesForRole({ port, component: params.component });
      return [
        `- requiredFor=${port.name}`,
        `direction=${port.mode}`,
        `type=${port.type}`,
        `role=${role.role}`,
        `suggestedNames=${suggestions.join('|')}`,
        `mustReturnMissingContractSignal=true`,
      ].join('; ');
    });
}

export function buildVhdlSpecialistAdvisorPrompt(params: {
  component: FpgaArchitectureComponentContract;
  candidate: VerifiedVhdlBlockNearMatch;
  wrapperPlan: VerifiedWrapperPlan;
}) {
  const approvedPorts = params.candidate.approvedSignature.ports.map((port) => itemSummary(port, params.component));
  const verifiedPorts = params.candidate.actualSignature.ports.map((port) => itemSummary(port, params.component));
  const unresolvedRequirements = unresolvedPortRequirementLines(params);
  return [
    'You are a VHDL contract/wrapper specialist. Return one compact JSON object only.',
    'Do not write VHDL. Do not rename ports. Do not invent implementation behavior.',
    'Your job is to produce a bounded contract-repair recommendation for unsafe verified-library wrapper matches.',
    'If a verified port cannot be safely mapped to an approved port, you MUST propose a missing architecture-contract signal for that verified port.',
    '',
    `componentId: ${params.component.id}`,
    `componentName: ${params.component.name}`,
    `verifiedBlock: ${params.candidate.blockName}`,
    `verifiedEntity: ${params.candidate.entityName}`,
    '',
    'Approved component ports:',
    ...approvedPorts.map((line) => `- ${line}`),
    '',
    'Verified block ports:',
    ...verifiedPorts.map((line) => `- ${line}`),
    '',
    'Current deterministic unsafe reasons:',
    ...(params.wrapperPlan.unsafeReasons.length > 0 ? params.wrapperPlan.unsafeReasons.map((line) => `- ${line}`) : ['- none']),
    '',
    'Unresolved verified ports that require missingContractSignals entries:',
    ...(unresolvedRequirements.length > 0 ? unresolvedRequirements : ['- none']),
    '',
    'Required JSON shape:',
    '{',
    '  "canHelp": true,',
    '  "safeMappings": [{"verifiedPort":"...", "approvedPort":"...", "rationale":"..."}],',
    '  "unsafeMappings": [{"verifiedPort":"...", "rejectedApprovedPorts":["..."], "reason":"..."}],',
    '  "missingContractSignals": [{"name":"...", "role":"...", "direction":"in|out", "type":"...", "requiredFor":"verified_port_name", "rationale":"..."}],',
    '  "contractRepair": {"action":"add_missing_ports|no_safe_repair", "safe": true, "reason":"..."},',
    '  "verdict": "..."',
    '}',
    '',
    'Rules:',
    '- A safe mapping must preserve direction, type family, and semantic role.',
    '- Never map address/control/serial signals to generic data just because widths look compatible.',
    '- Never map serial_rx, serial_tx, address, control, valid, or ready ports to generic data_i/data_o unless the approved port has the same semantic role.',
    '- For SPI master serial_rx, prefer missing input names like miso_i or spi_miso_i.',
    '- For SPI master serial_tx, prefer missing output names like mosi_o or spi_mosi_o.',
    '- For transaction valid/start, prefer missing input names like start_i, valid_i, or tx_valid_i.',
    '- If safeMappings is empty, missingContractSignals must still cover every unresolved requiredFor port.',
    '- If you cannot infer an exact name, return the best role-based candidate with confidence in rationale; do not return an empty list.',
  ].join('\n');
}

export function scoreVhdlSpecialistAdvisorResponse(params: {
  component: FpgaArchitectureComponentContract;
  candidate: VerifiedVhdlBlockNearMatch;
  wrapperPlan: VerifiedWrapperPlan;
  responseText: string;
}): VhdlSpecialistAdvisorScore {
  const json = extractJsonObject(params.responseText);
  if (!json || typeof json !== 'object') {
    return {
      accepted: false,
      acceptedMappings: [],
      rejectedMappings: [],
      missingContractSignals: [],
      rejectedReasons: ['advisor response was not valid JSON'],
      verdict: 'rejected',
      rawText: params.responseText,
    };
  }

  const acceptedMappings: VhdlSpecialistPortMappingAdvice[] = [];
  const rejectedMappings: Array<VhdlSpecialistPortMappingAdvice & { reason: string }> = [];
  const rejectedReasons: string[] = [];

  for (const mapping of collectMappings(json)) {
    const verifiedPort = portByName(params.candidate.actualSignature.ports, mapping.verifiedPort);
    const approvedPort = portByName(params.candidate.approvedSignature.ports, mapping.approvedPort);
    if (!verifiedPort || !approvedPort) {
      rejectedMappings.push({ ...mapping, reason: 'mapping references a port that is not present in the approved/verified signatures' });
      continue;
    }
    if (verifiedPort.mode !== approvedPort.mode) {
      rejectedMappings.push({ ...mapping, reason: `direction mismatch: ${verifiedPort.mode} vs ${approvedPort.mode}` });
      continue;
    }
    const verifiedRole = classifyVerifiedPortRole(verifiedPort, params.component);
    const approvedRole = classifyVerifiedPortRole(approvedPort, params.component);
    if (!rolesCompatible(verifiedRole, approvedRole)) {
      rejectedMappings.push({ ...mapping, reason: `role mismatch: ${verifiedRole.role} cannot map to ${approvedRole.role}` });
      continue;
    }
    acceptedMappings.push(mapping);
  }

  const missingContractSignals = collectMissingSignals(json)
    .filter((signal) => {
      if (!legalIdentifier(signal.name)) {
        rejectedReasons.push(`missing signal "${signal.name}" is not a legal VHDL identifier`);
        return false;
      }
      return true;
    });

  const unresolvedNames = new Set(params.candidate.actualSignature.ports
    .filter((port) => isUnresolvedVerifiedPort(params.wrapperPlan, port.name))
    .map((port) => normalizeName(port.name)));
  if (unresolvedNames.size > 0 && missingContractSignals.length === 0 && acceptedMappings.length === 0) {
    rejectedReasons.push('advisor did not provide a safe mapping or missing contract signal for unresolved verified ports');
  }

  if (rejectedMappings.length > 0) {
    rejectedReasons.push(...rejectedMappings.map((mapping) => `rejected ${mapping.verifiedPort}->${mapping.approvedPort}: ${mapping.reason}`));
  }

  return {
    accepted: rejectedMappings.length === 0 && (acceptedMappings.length > 0 || missingContractSignals.length > 0),
    acceptedMappings,
    rejectedMappings,
    missingContractSignals,
    rejectedReasons,
    verdict: typeof json.verdict === 'string' ? json.verdict : 'no verdict',
    rawText: params.responseText,
  };
}
