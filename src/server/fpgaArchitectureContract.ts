import path from 'path';
import type { FpgaArchitectProject } from './fpgaArchitect';
import {
  inferFpgaArchitectureBlueprintFromPrompt,
  type FpgaArchitectureBlueprint,
} from './fpgaArchitectureBlueprint';
import { VHDL_RESERVED_IDENTIFIERS } from './ghdlStrictVhdlRules';

export type FpgaArchitecturePortContract = {
  name: string;
  mode: 'in' | 'out' | 'inout' | 'buffer';
  type: string;
  purpose: string;
};

export type FpgaArchitectureComponentContract = {
  id: string;
  kind: 'package' | 'rtl' | 'top' | 'testbench';
  name: string;
  file: string;
  responsibility: string;
  implements: string[];
  dependsOn: string[];
  children: string[];
  clockDomain: string | null;
  generics: Array<{
    name: string;
    type: string;
    default: string;
  }>;
  ports: FpgaArchitecturePortContract[];
  exports: string[];
};

export type FpgaArchitectureClockDomainContract = {
  id: string;
  clockPort: string;
  resetPort: string;
  resetActive: 'high' | 'low';
  resetStyle: 'synchronous' | 'asynchronous';
  memberComponents: string[];
};

export type FpgaArchitectureBehaviorContract = {
  id: string;
  requirement: string;
  inputs: string[];
  outputs: string[];
  timing: string;
};

export type FpgaArchitectureVerificationContract = {
  id: string;
  requirement: string;
  stimulus: string;
  expected: string;
  observables: string[];
  covers: string[];
};

export type FpgaArchitectureContract = {
  schemaVersion: '1.0';
  designName: string;
  designClass: string;
  topEntity: string;
  topTestbench: string;
  systemIntent: string;
  assumptions: string[];
  requiredCapabilityIds: string[];
  components: FpgaArchitectureComponentContract[];
  clockDomains: FpgaArchitectureClockDomainContract[];
  behaviors: FpgaArchitectureBehaviorContract[];
  verification: FpgaArchitectureVerificationContract[];
  sourceOrder: string[];
};

export type FpgaArchitectureContractIssue = {
  code: string;
  path: string;
  message: string;
};

export type FpgaArchitectureContractValidation = {
  ok: boolean;
  issues: FpgaArchitectureContractIssue[];
};

export class FpgaArchitectureContractError extends Error {
  readonly issues: FpgaArchitectureContractIssue[];

  constructor(message: string, issues: FpgaArchitectureContractIssue[] = []) {
    super(message);
    this.name = 'FpgaArchitectureContractError';
    this.issues = issues;
  }
}

const VHDL_IDENTIFIER = /^[a-zA-Z](?:[a-zA-Z0-9]|_(?=[a-zA-Z0-9]))*$/;
const VHDL_RESERVED_IDENTIFIER_SET = new Set(VHDL_RESERVED_IDENTIFIERS.map((entry) => entry.toLowerCase()));
const PLACEHOLDER_PATTERN = /(?:<[^>]+>|\b(?:tbd|todo|placeholder|fill\s+this|not\s+specified)\b)/i;
const CONTRACT_MAX_REPAIR_ATTEMPTS = 1;

function stableId(value: string, fallback: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
  return normalized || fallback;
}

function safeRelativeVhdlPath(value: string) {
  if (!value || path.isAbsolute(value)) return false;
  const normalized = path.normalize(value).replace(/\\/g, '/');
  return normalized !== '..'
    && !normalized.startsWith('../')
    && !normalized.includes('/../')
    && /\.(?:vhd|vhdl)$/i.test(normalized);
}

function normalizePath(value: string) {
  return path.normalize(String(value || '')).replace(/\\/g, '/');
}

function normalizeType(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*([(),])\s*/g, '$1')
    .replace(/\s+(downto|to)\s+/g, ' $1 ')
    .trim();
}

function isLegalVhdlIdentifier(value: string) {
  return VHDL_IDENTIFIER.test(value) && !VHDL_RESERVED_IDENTIFIER_SET.has(value.toLowerCase());
}

function isConstrainedPublicType(value: string) {
  const normalized = normalizeType(value);
  if (!normalized) return false;
  if (/\b(?:std_logic_vector|std_ulogic_vector|unsigned|signed)\b/.test(normalized)) {
    return /\b(?:std_logic_vector|std_ulogic_vector|unsigned|signed)\s*\(/.test(normalized)
      && /\b(?:downto|to)\b/.test(normalized);
  }
  return true;
}

function pushIssue(
  issues: FpgaArchitectureContractIssue[],
  code: string,
  issuePath: string,
  message: string,
) {
  issues.push({ code, path: issuePath, message });
}

function findDuplicates(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    const normalized = value.toLowerCase();
    if (seen.has(normalized)) duplicates.add(value);
    seen.add(normalized);
  }
  return Array.from(duplicates);
}

function requiredCapabilitiesForBlueprint(blueprint: FpgaArchitectureBlueprint) {
  return blueprint.buildingBlocks.map((description, index) => ({
    id: stableId(description, `required_block_${index + 1}`),
    description,
  }));
}

function contractScaffold(blueprint: FpgaArchitectureBlueprint) {
  const capabilities = requiredCapabilitiesForBlueprint(blueprint);
  return {
    schemaVersion: '1.0',
    designName: '<snake_case project name>',
    designClass: blueprint.designClass,
    topEntity: '<top entity VHDL identifier>',
    topTestbench: '<testbench entity VHDL identifier>',
    systemIntent: '<one precise sentence>',
    assumptions: ['<explicit assumption>'],
    requiredCapabilityIds: capabilities.map((entry) => entry.id),
    components: [{
      id: '<stable component id>',
      kind: '<package | rtl | top | testbench>',
      name: '<package or entity VHDL identifier>',
      file: '<src/name.vhd or tb/name.vhd>',
      responsibility: '<single clear responsibility>',
      implements: ['<required capability id>'],
      dependsOn: ['<component id analyzed first>'],
      children: ['<directly instantiated RTL/top component id>'],
      clockDomain: '<clock domain id or null>',
      generics: [{ name: '<name>', type: '<exact VHDL type>', default: '<required default>' }],
      ports: [{ name: '<name>', mode: '<in | out | inout | buffer>', type: '<exact constrained VHDL subtype indication>', purpose: '<purpose>' }],
      exports: ['<package export name; empty for entities>'],
    }],
    clockDomains: [{
      id: '<clock domain id>',
      clockPort: '<top-level clock port>',
      resetPort: '<top-level reset port>',
      resetActive: '<high | low>',
      resetStyle: '<synchronous | asynchronous>',
      memberComponents: ['<component id>'],
    }],
    behaviors: [{
      id: '<behavior id>',
      requirement: '<observable behavioral requirement>',
      inputs: ['<input/control name>'],
      outputs: ['<observable output/status name>'],
      timing: '<cycle/latency/handshake rule>',
    }],
    verification: [{
      id: '<verification id>',
      requirement: '<what this proves>',
      stimulus: '<deterministic stimulus>',
      expected: '<exact expected behavior>',
      observables: ['<top port or visible status>'],
      covers: ['<required capability id>'],
    }],
    sourceOrder: ['<package file>', '<leaf RTL file>', '<top RTL file>', '<testbench file>'],
  };
}

export function buildFpgaArchitectureContractProposalPrompt(params: {
  userRequest: string;
}) {
  const blueprint = inferFpgaArchitectureBlueprintFromPrompt(params.userRequest);
  const requiredCapabilities = requiredCapabilitiesForBlueprint(blueprint);
  return [
    'You are preparing a machine-checkable FPGA architecture contract before any VHDL is generated.',
    'Return exactly one JSON object and no Markdown, prose, code fences, VHDL, comments, or trailing text.',
    '',
    `Design class: ${blueprint.designClass}`,
    `System role: ${blueprint.systemRole}`,
    '',
    'Required capabilities. Preserve every ID exactly and assign every ID to at least one component:',
    ...requiredCapabilities.map((entry) => `- ${entry.id}: ${entry.description}`),
    '',
    'Architecture rules:',
    '- Choose the detailed micro-architecture, file split, entity names, generics, ports, clock/reset ownership, and verification strategy.',
    '- Use legal basic VHDL identifiers and exact constrained VHDL subtype indications for public vector ports.',
    '- Include exactly one top component and one testbench component.',
    '- Every component dependency must name another component and sourceOrder must place dependencies first and the testbench last.',
    '- Every RTL/top/testbench hierarchy edge must appear in children; use direct entity instantiation in generated VHDL.',
    '- The approved top must reach every RTL leaf through children, and the testbench must instantiate only the approved top.',
    '- Every required capability must be implemented by a component and covered by at least one verification item.',
    '- Every clock-domain clockPort/resetPort must be a declared top-entity port and every member must be a synchronous RTL/top component.',
    '- Do not use TBD, TODO, placeholders, omitted blocks, vague types, or unspecified behavior.',
    '- Keep the contract compact enough to guide deterministic VHDL generation.',
    '',
    'App-owned clock/reset guidance:',
    ...blueprint.clockResetRules.map((entry) => `- ${entry}`),
    '',
    'App-owned internal-contract guidance:',
    ...blueprint.internalContracts.map((entry) => `- ${entry}`),
    '',
    'App-owned verification guidance:',
    ...blueprint.verificationPlan.map((entry) => `- ${entry}`),
    '',
    'Required JSON shape:',
    JSON.stringify(contractScaffold(blueprint), null, 2),
    '',
    'Original user request:',
    params.userRequest.trim(),
  ].join('\n');
}

export function buildFpgaArchitectureContractRepairPrompt(params: {
  userRequest: string;
  invalidResponse: string;
  issues: FpgaArchitectureContractIssue[];
}) {
  return [
    buildFpgaArchitectureContractProposalPrompt({ userRequest: params.userRequest }),
    '',
    'The previous architecture contract was rejected by deterministic validation.',
    'Correct every issue below and return one complete replacement JSON object only.',
    ...params.issues.map((issue, index) => `${index + 1}. [${issue.code}] ${issue.path}: ${issue.message}`),
    '',
    'Previous rejected response:',
    params.invalidResponse.slice(0, 12_000),
  ].join('\n');
}

function extractJsonObject(text: string) {
  const trimmed = String(text || '').trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new FpgaArchitectureContractError('Architecture contract response did not contain a JSON object.', [{
      code: 'architecture_contract_json_missing',
      path: '$',
      message: 'Return one complete JSON object with no Markdown or prose.',
    }]);
  }
  return unfenced.slice(start, end + 1);
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(asString).filter(Boolean) : [];
}

export function parseFpgaArchitectureContract(text: string): FpgaArchitectureContract {
  let parsed: any;
  try {
    parsed = JSON.parse(extractJsonObject(text));
  } catch (error: any) {
    if (error instanceof FpgaArchitectureContractError) throw error;
    throw new FpgaArchitectureContractError(`Architecture contract JSON was invalid: ${error?.message || String(error)}`, [{
      code: 'architecture_contract_json_invalid',
      path: '$',
      message: error?.message || String(error),
    }]);
  }

  const components = Array.isArray(parsed?.components) ? parsed.components.map((component: any) => ({
    id: asString(component?.id),
    kind: asString(component?.kind) as FpgaArchitectureComponentContract['kind'],
    name: asString(component?.name),
    file: normalizePath(asString(component?.file)),
    responsibility: asString(component?.responsibility),
    implements: asStringArray(component?.implements),
    dependsOn: asStringArray(component?.dependsOn),
    children: asStringArray(component?.children),
    clockDomain: component?.clockDomain === null ? null : asString(component?.clockDomain) || null,
    generics: Array.isArray(component?.generics) ? component.generics.map((generic: any) => ({
      name: asString(generic?.name),
      type: asString(generic?.type),
      default: asString(generic?.default),
    })) : [],
    ports: Array.isArray(component?.ports) ? component.ports.map((port: any) => ({
      name: asString(port?.name),
      mode: asString(port?.mode) as FpgaArchitecturePortContract['mode'],
      type: asString(port?.type),
      purpose: asString(port?.purpose),
    })) : [],
    exports: asStringArray(component?.exports),
  })) : [];

  return {
    schemaVersion: asString(parsed?.schemaVersion) as '1.0',
    designName: asString(parsed?.designName),
    designClass: asString(parsed?.designClass),
    topEntity: asString(parsed?.topEntity),
    topTestbench: asString(parsed?.topTestbench),
    systemIntent: asString(parsed?.systemIntent),
    assumptions: asStringArray(parsed?.assumptions),
    requiredCapabilityIds: asStringArray(parsed?.requiredCapabilityIds),
    components,
    clockDomains: Array.isArray(parsed?.clockDomains) ? parsed.clockDomains.map((domain: any) => ({
      id: asString(domain?.id),
      clockPort: asString(domain?.clockPort),
      resetPort: asString(domain?.resetPort),
      resetActive: asString(domain?.resetActive) as FpgaArchitectureClockDomainContract['resetActive'],
      resetStyle: asString(domain?.resetStyle) as FpgaArchitectureClockDomainContract['resetStyle'],
      memberComponents: asStringArray(domain?.memberComponents),
    })) : [],
    behaviors: Array.isArray(parsed?.behaviors) ? parsed.behaviors.map((behavior: any) => ({
      id: asString(behavior?.id),
      requirement: asString(behavior?.requirement),
      inputs: asStringArray(behavior?.inputs),
      outputs: asStringArray(behavior?.outputs),
      timing: asString(behavior?.timing),
    })) : [],
    verification: Array.isArray(parsed?.verification) ? parsed.verification.map((verification: any) => ({
      id: asString(verification?.id),
      requirement: asString(verification?.requirement),
      stimulus: asString(verification?.stimulus),
      expected: asString(verification?.expected),
      observables: asStringArray(verification?.observables),
      covers: asStringArray(verification?.covers),
    })) : [],
    sourceOrder: asStringArray(parsed?.sourceOrder).map(normalizePath),
  };
}

export function validateFpgaArchitectureContract(params: {
  contract: FpgaArchitectureContract;
  userRequest: string;
}): FpgaArchitectureContractValidation {
  const { contract } = params;
  const blueprint = inferFpgaArchitectureBlueprintFromPrompt(params.userRequest);
  const expectedCapabilities = requiredCapabilitiesForBlueprint(blueprint).map((entry) => entry.id);
  const issues: FpgaArchitectureContractIssue[] = [];

  if (contract.schemaVersion !== '1.0') {
    pushIssue(issues, 'architecture_contract_schema_version', '$.schemaVersion', 'schemaVersion must be exactly "1.0".');
  }
  if (!contract.designName || !isLegalVhdlIdentifier(contract.designName)) {
    pushIssue(issues, 'architecture_contract_design_name', '$.designName', 'designName must be a non-empty basic identifier.');
  }
  if (contract.designClass !== blueprint.designClass) {
    pushIssue(issues, 'architecture_contract_design_class', '$.designClass', `designClass must remain "${blueprint.designClass}" for this request.`);
  }
  if (!contract.systemIntent || PLACEHOLDER_PATTERN.test(contract.systemIntent)) {
    pushIssue(issues, 'architecture_contract_system_intent', '$.systemIntent', 'systemIntent must be precise and must not contain placeholders.');
  }
  if (!isLegalVhdlIdentifier(contract.topEntity)) {
    pushIssue(issues, 'architecture_contract_top_entity', '$.topEntity', 'topEntity must be a legal basic VHDL identifier.');
  }
  if (!isLegalVhdlIdentifier(contract.topTestbench)) {
    pushIssue(issues, 'architecture_contract_top_testbench', '$.topTestbench', 'topTestbench must be a legal basic VHDL identifier.');
  }

  const requiredSet = new Set(contract.requiredCapabilityIds);
  for (const capability of expectedCapabilities) {
    if (!requiredSet.has(capability)) {
      pushIssue(issues, 'architecture_contract_capability_missing', '$.requiredCapabilityIds', `Required capability "${capability}" is missing.`);
    }
  }
  for (const capability of contract.requiredCapabilityIds) {
    if (!expectedCapabilities.includes(capability)) {
      pushIssue(issues, 'architecture_contract_capability_unknown', '$.requiredCapabilityIds', `Unknown capability "${capability}" was added; preserve the app-owned capability IDs exactly.`);
    }
  }

  if (contract.components.length === 0) {
    pushIssue(issues, 'architecture_contract_components_missing', '$.components', 'At least one package/RTL component, one top component, and one testbench component are required.');
  }
  for (const duplicate of findDuplicates(contract.components.map((component) => component.id))) {
    pushIssue(issues, 'architecture_contract_component_id_duplicate', '$.components', `Component id "${duplicate}" is duplicated.`);
  }
  for (const duplicate of findDuplicates(contract.components.map((component) => component.file))) {
    pushIssue(issues, 'architecture_contract_component_file_duplicate', '$.components', `VHDL file "${duplicate}" is owned by more than one component.`);
  }

  const componentById = new Map(contract.components.map((component) => [component.id, component]));
  const topComponents = contract.components.filter((component) => component.kind === 'top');
  const tbComponents = contract.components.filter((component) => component.kind === 'testbench');
  if (topComponents.length !== 1 || topComponents[0]?.name !== contract.topEntity) {
    pushIssue(issues, 'architecture_contract_top_component', '$.components', 'Exactly one top component is required and its name must equal topEntity.');
  }
  if (tbComponents.length !== 1 || tbComponents[0]?.name !== contract.topTestbench) {
    pushIssue(issues, 'architecture_contract_testbench_component', '$.components', 'Exactly one testbench component is required and its name must equal topTestbench.');
  }

  for (const [index, component] of contract.components.entries()) {
    const componentPath = `$.components[${index}]`;
    if (!isLegalVhdlIdentifier(component.id)) pushIssue(issues, 'architecture_contract_component_id', `${componentPath}.id`, 'Component id must be a legal non-reserved basic identifier.');
    if (!['package', 'rtl', 'top', 'testbench'].includes(component.kind)) pushIssue(issues, 'architecture_contract_component_kind', `${componentPath}.kind`, 'Component kind must be package, rtl, top, or testbench.');
    if (!isLegalVhdlIdentifier(component.name)) pushIssue(issues, 'architecture_contract_component_name', `${componentPath}.name`, 'Package/entity name must be a legal non-reserved basic VHDL identifier.');
    if (!safeRelativeVhdlPath(component.file)) pushIssue(issues, 'architecture_contract_component_file', `${componentPath}.file`, 'Component file must be a safe relative .vhd/.vhdl path.');
    if (!component.responsibility || PLACEHOLDER_PATTERN.test(component.responsibility)) pushIssue(issues, 'architecture_contract_component_responsibility', `${componentPath}.responsibility`, 'Component responsibility must be complete and precise.');
    if (component.kind === 'package' && component.ports.length > 0) pushIssue(issues, 'architecture_contract_package_ports', `${componentPath}.ports`, 'Package components cannot declare entity ports.');
    if (component.kind === 'testbench' && component.ports.length > 0) pushIssue(issues, 'architecture_contract_testbench_ports', `${componentPath}.ports`, 'Top testbench entities must have no ports.');
    for (const dependency of component.dependsOn) {
      if (!componentById.has(dependency)) pushIssue(issues, 'architecture_contract_dependency_missing', `${componentPath}.dependsOn`, `Dependency component "${dependency}" does not exist.`);
      if (dependency === component.id) pushIssue(issues, 'architecture_contract_dependency_self', `${componentPath}.dependsOn`, 'A component cannot depend on itself.');
    }
    for (const childId of component.children) {
      const child = componentById.get(childId);
      if (!child) pushIssue(issues, 'architecture_contract_child_missing', `${componentPath}.children`, `Child component "${childId}" does not exist.`);
      if (child && !['rtl', 'top'].includes(child.kind)) pushIssue(issues, 'architecture_contract_child_kind', `${componentPath}.children`, `Child "${childId}" must be an RTL or top entity component.`);
      if (!component.dependsOn.includes(childId)) pushIssue(issues, 'architecture_contract_child_dependency_missing', `${componentPath}.dependsOn`, `Instantiated child "${childId}" must also be listed in dependsOn for source ordering.`);
    }
    if (component.kind === 'package' && component.children.length > 0) pushIssue(issues, 'architecture_contract_package_children', `${componentPath}.children`, 'Package components cannot instantiate child entities.');
    for (const capability of component.implements) {
      if (!requiredSet.has(capability)) pushIssue(issues, 'architecture_contract_component_capability_unknown', `${componentPath}.implements`, `Component implements unknown capability "${capability}".`);
    }
    for (const duplicate of findDuplicates(component.ports.map((port) => port.name))) {
      pushIssue(issues, 'architecture_contract_port_duplicate', `${componentPath}.ports`, `Port "${duplicate}" is duplicated.`);
    }
    for (const [portIndex, port] of component.ports.entries()) {
      const portPath = `${componentPath}.ports[${portIndex}]`;
      if (!isLegalVhdlIdentifier(port.name)) pushIssue(issues, 'architecture_contract_port_name', `${portPath}.name`, 'Port name must be a legal non-reserved basic VHDL identifier.');
      if (!['in', 'out', 'inout', 'buffer'].includes(port.mode)) pushIssue(issues, 'architecture_contract_port_mode', `${portPath}.mode`, 'Port mode must be in, out, inout, or buffer.');
      if (!isConstrainedPublicType(port.type)) pushIssue(issues, 'architecture_contract_port_type_unconstrained', `${portPath}.type`, `Port "${port.name}" must use an exact constrained VHDL subtype indication.`);
      if (!port.purpose || PLACEHOLDER_PATTERN.test(port.purpose)) pushIssue(issues, 'architecture_contract_port_purpose', `${portPath}.purpose`, 'Port purpose must be precise.');
    }
    for (const [genericIndex, generic] of component.generics.entries()) {
      const genericPath = `${componentPath}.generics[${genericIndex}]`;
      if (!isLegalVhdlIdentifier(generic.name)) pushIssue(issues, 'architecture_contract_generic_name', `${genericPath}.name`, 'Generic name must be a legal non-reserved basic VHDL identifier.');
      if (!generic.type) pushIssue(issues, 'architecture_contract_generic_type', `${genericPath}.type`, 'Generic type is required.');
      if (!generic.default || PLACEHOLDER_PATTERN.test(generic.default)) pushIssue(issues, 'architecture_contract_generic_default', `${genericPath}.default`, 'Every generated top-level/component generic must have a concrete default.');
    }
  }

  for (const capability of expectedCapabilities) {
    if (!contract.components.some((component) => component.implements.includes(capability))) {
      pushIssue(issues, 'architecture_contract_capability_unowned', '$.components', `No component owns required capability "${capability}".`);
    }
    if (!contract.verification.some((verification) => verification.covers.includes(capability))) {
      pushIssue(issues, 'architecture_contract_capability_unverified', '$.verification', `No verification item covers required capability "${capability}".`);
    }
  }

  const top = topComponents[0];
  const topPortNames = new Set((top?.ports || []).map((port) => port.name.toLowerCase()));
  const domainIds = new Set<string>();
  for (const [index, domain] of contract.clockDomains.entries()) {
    const domainPath = `$.clockDomains[${index}]`;
    if (!isLegalVhdlIdentifier(domain.id)) pushIssue(issues, 'architecture_contract_clock_domain_id', `${domainPath}.id`, 'Clock-domain id must be a legal non-reserved basic identifier.');
    if (domainIds.has(domain.id.toLowerCase())) pushIssue(issues, 'architecture_contract_clock_domain_duplicate', `${domainPath}.id`, `Clock domain "${domain.id}" is duplicated.`);
    domainIds.add(domain.id.toLowerCase());
    if (!topPortNames.has(domain.clockPort.toLowerCase())) pushIssue(issues, 'architecture_contract_clock_port_missing', `${domainPath}.clockPort`, `Top entity does not declare clock port "${domain.clockPort}".`);
    if (!topPortNames.has(domain.resetPort.toLowerCase())) pushIssue(issues, 'architecture_contract_reset_port_missing', `${domainPath}.resetPort`, `Top entity does not declare reset port "${domain.resetPort}".`);
    if (!['high', 'low'].includes(domain.resetActive)) pushIssue(issues, 'architecture_contract_reset_active', `${domainPath}.resetActive`, 'resetActive must be high or low.');
    if (!['synchronous', 'asynchronous'].includes(domain.resetStyle)) pushIssue(issues, 'architecture_contract_reset_style', `${domainPath}.resetStyle`, 'resetStyle must be synchronous or asynchronous.');
    for (const member of domain.memberComponents) {
      const component = componentById.get(member);
      if (!component) pushIssue(issues, 'architecture_contract_clock_member_missing', `${domainPath}.memberComponents`, `Clock-domain member "${member}" does not exist.`);
      if (component?.clockDomain !== domain.id) pushIssue(issues, 'architecture_contract_clock_member_mismatch', `${domainPath}.memberComponents`, `Component "${member}" must reference clockDomain "${domain.id}".`);
    }
  }
  for (const component of contract.components.filter((entry) => entry.clockDomain)) {
    if (!domainIds.has(String(component.clockDomain).toLowerCase())) pushIssue(issues, 'architecture_contract_component_clock_missing', '$.components', `Component "${component.id}" references missing clock domain "${component.clockDomain}".`);
  }

  const orderIndex = new Map(contract.sourceOrder.map((file, index) => [normalizePath(file), index]));
  for (const duplicate of findDuplicates(contract.sourceOrder)) {
    pushIssue(issues, 'architecture_contract_source_order_duplicate', '$.sourceOrder', `Source file "${duplicate}" is duplicated.`);
  }
  for (const component of contract.components) {
    const file = normalizePath(component.file);
    if (!orderIndex.has(file)) pushIssue(issues, 'architecture_contract_source_missing', '$.sourceOrder', `Component file "${file}" is missing from sourceOrder.`);
    for (const dependencyId of component.dependsOn) {
      const dependency = componentById.get(dependencyId);
      if (dependency && (orderIndex.get(normalizePath(dependency.file)) ?? Number.MAX_SAFE_INTEGER) >= (orderIndex.get(file) ?? -1)) {
        pushIssue(issues, 'architecture_contract_source_dependency_order', '$.sourceOrder', `Dependency file "${dependency.file}" must appear before "${component.file}".`);
      }
    }
  }
  const expectedFiles = new Set(contract.components.map((component) => normalizePath(component.file)));
  for (const sourceFile of contract.sourceOrder) {
    if (!expectedFiles.has(normalizePath(sourceFile))) pushIssue(issues, 'architecture_contract_source_unknown', '$.sourceOrder', `Source file "${sourceFile}" has no owning component.`);
  }
  if (tbComponents[0] && contract.sourceOrder.at(-1) !== tbComponents[0].file) {
    pushIssue(issues, 'architecture_contract_testbench_order', '$.sourceOrder', 'The top testbench file must be the final analysis source.');
  }

  const visitState = new Map<string, 'visiting' | 'done'>();
  const visit = (componentId: string): boolean => {
    const state = visitState.get(componentId);
    if (state === 'visiting') return true;
    if (state === 'done') return false;
    visitState.set(componentId, 'visiting');
    const component = componentById.get(componentId);
    const cyclic = Boolean(component?.dependsOn.some(visit));
    visitState.set(componentId, 'done');
    return cyclic;
  };
  if (contract.components.some((component) => visit(component.id))) {
    pushIssue(issues, 'architecture_contract_dependency_cycle', '$.components', 'Component dependency graph contains a cycle.');
  }

  const topComponent = topComponents[0];
  if (topComponent) {
    const reachable = new Set<string>();
    const collectChildren = (componentId: string) => {
      if (reachable.has(componentId)) return;
      reachable.add(componentId);
      for (const child of componentById.get(componentId)?.children || []) collectChildren(child);
    };
    collectChildren(topComponent.id);
    for (const rtlComponent of contract.components.filter((component) => component.kind === 'rtl')) {
      if (!reachable.has(rtlComponent.id)) {
        pushIssue(issues, 'architecture_contract_rtl_unreachable', '$.components', `RTL component "${rtlComponent.id}" is not instantiated by the approved top hierarchy.`);
      }
    }
  }
  if (tbComponents[0] && (tbComponents[0].children.length !== 1 || tbComponents[0].children[0] !== topComponents[0]?.id)) {
    pushIssue(issues, 'architecture_contract_testbench_hierarchy', '$.components', 'The testbench children list must contain exactly the approved top component id.');
  }

  if (contract.behaviors.length === 0) pushIssue(issues, 'architecture_contract_behaviors_missing', '$.behaviors', 'At least one observable behavioral contract is required.');
  if (contract.verification.length === 0) pushIssue(issues, 'architecture_contract_verification_missing', '$.verification', 'At least one deterministic verification item is required.');
  for (const [index, verification] of contract.verification.entries()) {
    if (!verification.requirement || !verification.stimulus || !verification.expected || verification.observables.length === 0) {
      pushIssue(issues, 'architecture_contract_verification_incomplete', `$.verification[${index}]`, 'Verification item must include requirement, deterministic stimulus, expected result, and observables.');
    }
  }

  if (PLACEHOLDER_PATTERN.test(JSON.stringify(contract))) {
    pushIssue(issues, 'architecture_contract_placeholder', '$', 'Architecture contract contains a placeholder/TBD/TODO value.');
  }

  return { ok: issues.length === 0, issues };
}

export function parseAndValidateFpgaArchitectureContract(params: {
  text: string;
  userRequest: string;
}) {
  const contract = parseFpgaArchitectureContract(params.text);
  const validation = validateFpgaArchitectureContract({ contract, userRequest: params.userRequest });
  if (!validation.ok) {
    throw new FpgaArchitectureContractError(
      `Architecture contract failed deterministic validation with ${validation.issues.length} issue(s).`,
      validation.issues,
    );
  }
  return contract;
}

export async function proposeApprovedFpgaArchitectureContract<TTelemetry>(params: {
  ai: unknown;
  provider: string;
  model: string;
  userRequest: string;
  signal?: AbortSignal;
  runModelAnalysis: (params: {
    ai: any;
    provider: any;
    model: string;
    prompt: string;
    signal?: AbortSignal;
  }) => Promise<{ text: string; telemetry: TTelemetry }>;
}) {
  let prompt = buildFpgaArchitectureContractProposalPrompt({ userRequest: params.userRequest });
  const attempts: Array<{ text: string; telemetry: TTelemetry }> = [];
  let latestResponse = '';
  let latestError: FpgaArchitectureContractError | null = null;

  for (let attempt = 0; attempt <= CONTRACT_MAX_REPAIR_ATTEMPTS; attempt += 1) {
    const result = await params.runModelAnalysis({
      ai: params.ai,
      provider: params.provider,
      model: params.model,
      prompt,
      signal: params.signal,
    });
    attempts.push(result);
    latestResponse = result.text;
    try {
      return {
        contract: parseAndValidateFpgaArchitectureContract({
          text: latestResponse,
          userRequest: params.userRequest,
        }),
        attempts,
        repaired: attempt > 0,
      };
    } catch (error: any) {
      latestError = error instanceof FpgaArchitectureContractError
        ? error
        : new FpgaArchitectureContractError(error?.message || String(error));
      if (attempt >= CONTRACT_MAX_REPAIR_ATTEMPTS) break;
      prompt = buildFpgaArchitectureContractRepairPrompt({
        userRequest: params.userRequest,
        invalidResponse: latestResponse,
        issues: latestError.issues.length > 0 ? latestError.issues : [{
          code: 'architecture_contract_invalid',
          path: '$',
          message: latestError.message,
        }],
      });
    }
  }

  throw new FpgaArchitectureContractError(
    `FPGA architecture proposal was rejected before VHDL generation. ${latestError?.message || 'Unknown contract error.'}`,
    latestError?.issues || [],
  );
}

export function buildApprovedFpgaArchitectureContractSection(contract: FpgaArchitectureContract) {
  return [
    '## Approved FPGA Architecture Contract',
    'This contract has passed deterministic app validation and is now immutable source of truth for VHDL generation.',
    '- Generate exactly the declared package/entity/testbench files and public interfaces.',
    '- Do not add, remove, rename, merge, or split contracted VHDL components.',
    '- Preserve clock/reset ownership, dependency order, behavioral requirements, and verification coverage.',
    '- The app will reject any manifest that drifts from this contract before GHDL runs.',
    '```json',
    JSON.stringify(contract, null, 2),
    '```',
  ].join('\n');
}

function stripVhdlComments(content: string) {
  return content.replace(/--.*$/gm, '');
}

function extractBalancedParentheses(content: string, openIndex: number) {
  let depth = 0;
  for (let index = openIndex; index < content.length; index += 1) {
    if (content[index] === '(') depth += 1;
    if (content[index] === ')') {
      depth -= 1;
      if (depth === 0) return content.slice(openIndex + 1, index);
    }
  }
  return null;
}

function extractEntityBlock(content: string, entityName: string) {
  const source = stripVhdlComments(content);
  const entityMatch = new RegExp(`\\bentity\\s+${entityName}\\s+is\\b`, 'i').exec(source);
  if (!entityMatch) return null;
  const entityTail = source.slice(entityMatch.index + entityMatch[0].length);
  const endMatch = /\bend\s+(?:entity\s*)?(?:[a-zA-Z][a-zA-Z0-9_]*)?\s*;/i.exec(entityTail);
  return endMatch ? entityTail.slice(0, endMatch.index) : entityTail;
}

function extractEntityInterfaceBody(content: string, entityName: string, keyword: 'generic' | 'port') {
  const entityBlock = extractEntityBlock(content, entityName);
  if (entityBlock === null) return null;
  const clauseMatch = new RegExp(`\\b${keyword}\\s*\\(`, 'i').exec(entityBlock);
  if (!clauseMatch) return '';
  const openIndex = clauseMatch.index + clauseMatch[0].lastIndexOf('(');
  return extractBalancedParentheses(entityBlock, openIndex);
}

function extractEntityGenerics(content: string, entityName: string) {
  const body = extractEntityInterfaceBody(content, entityName, 'generic');
  if (body === null) return null;
  if (!body) return [];
  const generics: Array<{ name: string; type: string; default: string }> = [];
  for (const clause of body.split(';')) {
    const match = /^\s*([a-zA-Z][a-zA-Z0-9_]*(?:\s*,\s*[a-zA-Z][a-zA-Z0-9_]*)*)\s*:\s*(.+?)\s*$/is.exec(clause);
    if (!match) continue;
    const declaration = match[2].trim();
    const assignmentIndex = declaration.indexOf(':=');
    const type = (assignmentIndex >= 0 ? declaration.slice(0, assignmentIndex) : declaration).trim();
    const defaultValue = assignmentIndex >= 0 ? declaration.slice(assignmentIndex + 2).trim() : '';
    for (const name of match[1].split(',').map((entry) => entry.trim())) {
      generics.push({ name, type, default: defaultValue });
    }
  }
  return generics;
}

function extractEntityPorts(content: string, entityName: string) {
  const body = extractEntityInterfaceBody(content, entityName, 'port');
  if (body === null) return null;
  if (!body) return [];
  const ports: Array<{ name: string; mode: string; type: string }> = [];
  for (const clause of body.split(';')) {
    const match = /^\s*([a-zA-Z][a-zA-Z0-9_]*(?:\s*,\s*[a-zA-Z][a-zA-Z0-9_]*)*)\s*:\s*(inout|buffer|out|in)\s+(.+?)\s*$/is.exec(clause);
    if (!match) continue;
    for (const name of match[1].split(',').map((entry) => entry.trim())) {
      ports.push({ name, mode: match[2].toLowerCase(), type: match[3].trim() });
    }
  }
  return ports;
}

export function validateFpgaArchitectProjectAgainstContract(params: {
  project: FpgaArchitectProject;
  contract: FpgaArchitectureContract;
}): FpgaArchitectureContractValidation {
  const { project, contract } = params;
  const issues: FpgaArchitectureContractIssue[] = [];
  if (project.topEntity.toLowerCase() !== contract.topEntity.toLowerCase()) {
    pushIssue(issues, 'architecture_contract_top_entity_drift', '$.top_entity', `Generated top_entity "${project.topEntity}" must equal approved topEntity "${contract.topEntity}".`);
  }
  if (project.ghdl.topTestbench.toLowerCase() !== contract.topTestbench.toLowerCase()) {
    pushIssue(issues, 'architecture_contract_top_testbench_drift', '$.ghdl.top_testbench', `Generated top_testbench "${project.ghdl.topTestbench}" must equal approved topTestbench "${contract.topTestbench}".`);
  }

  const projectFileByPath = new Map(project.files.map((file) => [normalizePath(file.path), file]));
  const contractedFiles = new Set(contract.components.map((component) => normalizePath(component.file)));
  for (const component of contract.components) {
    const file = projectFileByPath.get(normalizePath(component.file));
    if (!file) {
      pushIssue(issues, 'architecture_contract_file_missing', '$.files', `Generated manifest is missing contracted file "${component.file}".`);
      continue;
    }
    if (component.kind === 'package') {
      const packagePattern = new RegExp(`\\bpackage\\s+(?!body\\b)${component.name}\\s+is\\b`, 'i');
      if (!packagePattern.test(file.content)) pushIssue(issues, 'architecture_contract_package_declaration_drift', component.file, `File must declare approved package "${component.name}".`);
      continue;
    }
    const entityPattern = new RegExp(`\\bentity\\s+${component.name}\\s+is\\b`, 'i');
    if (!entityPattern.test(file.content)) {
      pushIssue(issues, 'architecture_contract_entity_declaration_drift', component.file, `File must declare approved entity "${component.name}".`);
      continue;
    }
    const actualGenerics = extractEntityGenerics(file.content, component.name);
    if (actualGenerics === null) {
      pushIssue(issues, 'architecture_contract_generic_parse_failure', component.file, `Could not parse the generic interface for entity "${component.name}".`);
      continue;
    }
    const actualGenericByName = new Map(actualGenerics.map((generic) => [generic.name.toLowerCase(), generic]));
    for (const expectedGeneric of component.generics) {
      const actual = actualGenericByName.get(expectedGeneric.name.toLowerCase());
      if (!actual) {
        pushIssue(issues, 'architecture_contract_generic_missing', component.file, `Entity "${component.name}" is missing approved generic "${expectedGeneric.name}".`);
        continue;
      }
      if (
        normalizeType(actual.type) !== normalizeType(expectedGeneric.type)
        || normalizeType(actual.default) !== normalizeType(expectedGeneric.default)
      ) {
        pushIssue(issues, 'architecture_contract_generic_drift', component.file, `Generic "${expectedGeneric.name}" must remain "${expectedGeneric.type} := ${expectedGeneric.default}" but generated "${actual.type}${actual.default ? ` := ${actual.default}` : ''}".`);
      }
    }
    for (const actualGeneric of actualGenerics) {
      if (!component.generics.some((expected) => expected.name.toLowerCase() === actualGeneric.name.toLowerCase())) {
        pushIssue(issues, 'architecture_contract_generic_added', component.file, `Entity "${component.name}" added unapproved generic "${actualGeneric.name}".`);
      }
    }
    const actualPorts = extractEntityPorts(file.content, component.name);
    if (actualPorts === null) {
      pushIssue(issues, 'architecture_contract_port_parse_failure', component.file, `Could not parse the port interface for entity "${component.name}".`);
      continue;
    }
    const actualByName = new Map(actualPorts.map((port) => [port.name.toLowerCase(), port]));
    for (const expectedPort of component.ports) {
      const actual = actualByName.get(expectedPort.name.toLowerCase());
      if (!actual) {
        pushIssue(issues, 'architecture_contract_port_missing', component.file, `Entity "${component.name}" is missing approved port "${expectedPort.name}".`);
        continue;
      }
      if (actual.mode !== expectedPort.mode || normalizeType(actual.type) !== normalizeType(expectedPort.type)) {
        pushIssue(issues, 'architecture_contract_port_drift', component.file, `Port "${expectedPort.name}" must remain "${expectedPort.mode} ${expectedPort.type}" but generated "${actual.mode} ${actual.type}".`);
      }
    }
    for (const actualPort of actualPorts) {
      if (!component.ports.some((expected) => expected.name.toLowerCase() === actualPort.name.toLowerCase())) {
        pushIssue(issues, 'architecture_contract_port_added', component.file, `Entity "${component.name}" added unapproved public port "${actualPort.name}".`);
      }
    }
    const actualChildNames = Array.from(file.content.matchAll(/\bentity\s+work\.([a-zA-Z][a-zA-Z0-9_]*)\b/gi))
      .map((match) => match[1].toLowerCase());
    const expectedChildNames = component.children
      .map((childId) => contract.components.find((candidate) => candidate.id === childId)?.name.toLowerCase())
      .filter((name): name is string => Boolean(name));
    for (const childName of expectedChildNames) {
      if (!actualChildNames.includes(childName)) pushIssue(issues, 'architecture_contract_child_instantiation_missing', component.file, `Entity "${component.name}" does not directly instantiate approved child entity "${childName}".`);
    }
    for (const childName of actualChildNames) {
      if (!expectedChildNames.includes(childName)) pushIssue(issues, 'architecture_contract_child_instantiation_added', component.file, `Entity "${component.name}" instantiates unapproved child entity "${childName}".`);
    }
  }

  for (const file of project.files.filter((entry) => /\.(?:vhd|vhdl)$/i.test(entry.path))) {
    if (!contractedFiles.has(normalizePath(file.path))) {
      pushIssue(issues, 'architecture_contract_file_added', '$.files', `Generated manifest added unapproved VHDL file "${file.path}".`);
    }
  }

  const generatedOrder = project.ghdl.analysisOrder.map(normalizePath);
  const expectedOrder = contract.sourceOrder.map(normalizePath);
  if (generatedOrder.length !== expectedOrder.length || generatedOrder.some((file, index) => file !== expectedOrder[index])) {
    pushIssue(issues, 'architecture_contract_source_order_drift', '$.ghdl.analysis_order', `analysis_order must exactly match the approved order: ${expectedOrder.join(', ')}.`);
  }
  return { ok: issues.length === 0, issues };
}

export function assertFpgaArchitectProjectMatchesContract(params: {
  project: FpgaArchitectProject;
  contract: FpgaArchitectureContract;
}) {
  const validation = validateFpgaArchitectProjectAgainstContract(params);
  if (!validation.ok) {
    throw new FpgaArchitectureContractError(
      `Generated FPGA project drifted from the approved architecture contract with ${validation.issues.length} issue(s): ${validation.issues.map((issue) => `[${issue.code}] ${issue.message}`).join(' ')}`,
      validation.issues,
    );
  }
}

export function attachFpgaArchitectureContractArtifact(
  project: FpgaArchitectProject,
  contract: FpgaArchitectureContract,
) {
  const contractPath = 'architecture/architecture-contract.json';
  const content = `${JSON.stringify(contract, null, 2)}\n`;
  const existing = project.files.find((file) => normalizePath(file.path) === contractPath);
  if (existing) {
    existing.fileType = 'json';
    existing.purpose = 'App-approved machine-checkable FPGA architecture contract';
    existing.content = content;
    return project;
  }
  project.files.push({
    path: contractPath,
    fileType: 'json',
    purpose: 'App-approved machine-checkable FPGA architecture contract',
    content,
  });
  return project;
}
