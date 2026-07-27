import path from 'path';
import { createHash } from 'crypto';
import type { FpgaArchitectProject } from './fpgaArchitect';
import {
  inferFpgaArchitectureBlueprintFromPrompt,
  synthesizeFpgaArchitectureBlueprintFromPrompt,
  type FpgaArchitectureBlueprint,
} from './fpgaArchitectureBlueprint';
import { formatBuildingBlockCatalogPromptSection } from './fpgaBuildingBlockCatalog';
import {
  formatFpgaArchitectureEvidenceFactsForPrompt,
  isApprovedFpgaArchitectureEvidenceUrl,
  type FpgaArchitectureEvidenceFact,
  type FpgaArchitectureRetrievalMode,
} from './fpgaArchitectureEvidence';
import { collectFpgaArchitectureEvidence } from './fpgaArchitectureRetrieval';
import {
  buildMissingBlockFitReviewPrompt,
  discoverMissingFpgaBlocks,
  formatMissingBlockDiscoveryPromptSection,
  type FpgaMissingBlockDiscoveryResult,
} from './fpgaMissingBlockDiscovery';
import {
  buildDeterministicFpgaArchitectureIntent,
  buildFpgaArchitectureIntentClarificationIssues,
  extractFpgaArchitectureIntentSource,
  mergeFpgaArchitectureIntentIntoPrompt,
  validateFpgaArchitectureIntentCompleteness,
  type FpgaArchitectureClarificationRequest,
  type FpgaArchitectureIntent,
} from './fpgaArchitectureIntent';
import {
  applyResolvedFpgaArchitectureParameters,
  buildFpgaArchitectureParameterClarificationIssues,
  validateFpgaArchitectureParameterCompleteness,
} from './fpgaArchitectureParameterIntent';
import { VHDL_RESERVED_IDENTIFIERS } from './ghdlStrictVhdlRules';
import { buildModelGenerationProfile, type ModelGenerationProfile } from './modelGenerationProfiles';
import { parseVhdlSemanticModel } from './vhdlSemanticFrontend';

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
  packageSymbols?: FpgaArchitecturePackageSymbolContract[];
  implementationSourcePreference?: 'verified_library' | 'golden_leaf' | 'deterministic_template' | 'missing_verified_source';
};

export type FpgaArchitecturePackageSymbolContract = {
  name: string;
  kind: 'constant' | 'subtype' | 'enum' | 'record' | 'array';
  type: string;
  value?: string;
  literals?: string[];
  fields?: Array<{ name: string; type: string }>;
};

export type FpgaArchitectureNumericFormatContract = {
  id: string;
  type: 'unsigned' | 'signed' | 'sfixed' | 'ufixed';
  width: number;
  integerBits: number;
  fractionalBits: number;
  overflow: 'wrap' | 'saturate';
  rounding: 'truncate' | 'nearest';
};

export type FpgaArchitectureInstanceContract = {
  id: string;
  parentComponentId: string;
  childComponentId: string;
  label: string;
  genericMap: Record<string, string>;
  portMap: Record<string, string>;
};

export type FpgaArchitectureConnectionEndpoint = {
  componentId: string;
  port: string;
};

export type FpgaArchitectureConnectionContract = {
  id: string;
  type: string;
  source: FpgaArchitectureConnectionEndpoint;
  sinks: FpgaArchitectureConnectionEndpoint[];
  clockDomain: string | null;
  cdc: 'none' | 'synchronizer' | 'async_fifo' | 'handshake';
  handshake?: { valid: string; ready: string; payload: string[] };
};

export type FpgaArchitectureStateMachineContract = {
  id: string;
  componentId: string;
  stateType: string;
  states: string[];
  resetState: string;
  transitions: Array<{
    from: string;
    event: string;
    to: string;
    outputs: string[];
  }>;
};

export type FpgaArchitectureScenarioAction = {
  kind: 'drive' | 'wait_cycles' | 'expect' | 'expect_stable' | 'finish';
  signal?: string;
  value?: string;
  cycles?: number;
  message?: string;
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
  resetBehavior?: string;
  latencyCycles?: number;
  preconditions?: string[];
};

export type FpgaArchitectureVerificationContract = {
  id: string;
  requirement: string;
  stimulus: string;
  expected: string;
  observables: string[];
  covers: string[];
  coversBehaviors?: string[];
  actions?: FpgaArchitectureScenarioAction[];
};

export type FpgaArchitectureSynthesisMetadata = {
  sourceMode: 'curated_first_hybrid';
  synthesisId: string;
  primaryPatternId: string;
  secondaryPatternIds: string[];
  buildingBlockCatalogIds?: string[];
  methodologyRuleIds: string[];
  referenceDesignIds: string[];
  evidenceClaimIds: string[];
  retrievalMode?: FpgaArchitectureRetrievalMode;
  retrievedSourceIds?: string[];
  sourceSnapshotIds?: string[];
  sourceHashes?: string[];
  evidenceFreshness?: string;
  confidence: number;
};

export type FpgaArchitectureSelectionReviewFit = 'good' | 'partial' | 'poor' | 'unavailable';

export type FpgaArchitectureSelectionReview = {
  fit: FpgaArchitectureSelectionReviewFit;
  confidence: number;
  selectedPrimaryPattern: string;
  selectedSupportBlocks: string[];
  missingBlocks: string[];
  unnecessaryBlocks: string[];
  recommendedPrimaryPattern: string;
  recommendedSupportBlocks: string[];
  architectureRisks: string[];
  reasoningSummary: string;
  userActionPrompt?: string;
};

export type FpgaArchitectureSourceGroundedRequirement = {
  id: string;
  sourceClaimId: string;
  appliesTo: 'architecture' | 'hierarchy' | 'clock_reset' | 'interface' | 'numeric' | 'memory' | 'verification' | 'tool_flow' | 'reference_design';
  requirement: string;
  sourceUrl?: string;
  sourceHash?: string;
  sourceSnapshotId?: string;
};

export type FpgaArchitectureOutputOwnershipRule = {
  ruleId: string;
  signal: string;
  ownerComponentId: string;
  evidence: string;
};

export type FpgaArchitectureSignalTimelineRule = {
  ruleId: string;
  signal: string;
  ownerComponentId: string;
  events: Array<{
    at: string;
    value: string;
    evidence: string;
  }>;
};

export type FpgaArchitectureTruthTableRule = {
  ruleId: string;
  ownerComponentId: string;
  input: string;
  rows: Array<Record<string, string>>;
};

export type FpgaArchitectureFsmContractRule = {
  ruleId: string;
  componentId: string;
  stateType: string;
  resetState: string;
  states: string[];
};

export type FpgaArchitectureVerificationDerivationRule = {
  verificationId: string;
  derivesFromRuleIds: string[];
};

export type FpgaArchitectureContract = {
  schemaVersion: '1.0' | '2.0';
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
  numericFormats?: FpgaArchitectureNumericFormatContract[];
  instances?: FpgaArchitectureInstanceContract[];
  connections?: FpgaArchitectureConnectionContract[];
  stateMachines?: FpgaArchitectureStateMachineContract[];
  architectureSynthesis?: FpgaArchitectureSynthesisMetadata;
  sourceGroundedRequirements?: FpgaArchitectureSourceGroundedRequirement[];
  outputOwnership?: FpgaArchitectureOutputOwnershipRule[];
  signalTimelines?: FpgaArchitectureSignalTimelineRule[];
  truthTables?: FpgaArchitectureTruthTableRule[];
  fsmContracts?: FpgaArchitectureFsmContractRule[];
  verificationDerivation?: FpgaArchitectureVerificationDerivationRule[];
  intent?: FpgaArchitectureIntent;
  clarification?: FpgaArchitectureClarificationRequest;
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
const AMBIGUOUS_CONTRACT_TEXT_PATTERN = /\b(?:eventually|as\s+needed|as\s+appropriate|where\s+possible|if\s+necessary|implementation[- ]defined|unspecified|model\s+decides|best\s+effort|some\s+time|later)\b/i;
const CONTRACT_MAX_REPAIR_ATTEMPTS = 2;

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

function isAmbiguousContractText(value: string) {
  return AMBIGUOUS_CONTRACT_TEXT_PATTERN.test(value || '');
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
    id: stableId(description.match(/^\s*([a-zA-Z][a-zA-Z0-9_]*)\s*:/)?.[1] || description, `required_block_${index + 1}`),
    description,
  }));
}

function classifyCapabilityOwnership(capability: { id: string; description: string }) {
  const id = capability.id.toLowerCase();
  const text = `${capability.id} ${capability.description}`.toLowerCase();
  if (/(?:^|_)(?:self_checking|testbench|verification|verify|scenario)(?:_|$)|operation_testbench/.test(id)) return 'testbench' as const;
  if (/(?:^|_)(?:pkg|package)(?:_|$)|_pkg(?:_|$)/.test(id)) return 'package' as const;
  if (/(?:^|_)(?:top|wrapper|integration)(?:_|$)|_top(?:_|$)/.test(id)) return 'top' as const;
  if (/\b(?:self_checking|testbench|verification|verify|scenario|operation_testbench)\b/.test(text)) return 'testbench' as const;
  if (/\b(?:pkg|package|constants?|types?|records?|opcodes?)\b/.test(text)) return 'package' as const;
  if (/\b(?:top|wrapper|integration|integrat(?:e|ion)|output integration)\b/.test(text)) return 'top' as const;
  return 'rtl' as const;
}

function uniqueStableId(value: string, fallback: string, used: Set<string>) {
  const base = stableId(value, fallback);
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate.toLowerCase()) || !isLegalVhdlIdentifier(candidate)) {
    candidate = `${base}_${suffix}`;
    suffix += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function defaultGenericValueForType(type: string) {
  const normalized = normalizeType(type);
  if (/^(?:positive|natural|integer)$/.test(normalized)) return normalized === 'positive' ? '1' : '0';
  if (/^boolean$/.test(normalized)) return 'false';
  if (/^std_logic$/.test(normalized)) return "'0'";
  return '';
}

function buildNormalizedSourceOrder(components: FpgaArchitectureComponentContract[]) {
  const byId = new Map(components.map((component) => [component.id, component]));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const ordered: string[] = [];

  const visit = (component: FpgaArchitectureComponentContract) => {
    const key = component.id.toLowerCase();
    if (visited.has(key) || visiting.has(key)) return;
    visiting.add(key);
    for (const dependencyId of component.dependsOn) {
      const dependency = byId.get(dependencyId);
      if (dependency) visit(dependency);
    }
    visiting.delete(key);
    visited.add(key);
    if (component.file) ordered.push(normalizePath(component.file));
  };

  components
    .filter((component) => component.kind === 'package')
    .forEach(visit);
  components
    .filter((component) => component.kind === 'rtl')
    .forEach(visit);
  components
    .filter((component) => component.kind === 'top')
    .forEach(visit);
  components
    .filter((component) => component.kind === 'testbench')
    .forEach(visit);

  return Array.from(new Set(ordered));
}

export function buildFpgaArchitectureContractDraft(params: {
  userRequest: string;
  evidenceFacts?: FpgaArchitectureEvidenceFact[];
  retrievalMode?: FpgaArchitectureRetrievalMode;
  intent?: FpgaArchitectureIntent;
}): FpgaArchitectureContract {
  const synthesis = synthesizeFpgaArchitectureBlueprintFromPrompt(params.userRequest);
  const blueprint = synthesis.blueprint;
  const capabilities = requiredCapabilitiesForBlueprint(blueprint);
  const usedIds = new Set<string>();
  const designName = uniqueStableId(blueprint.designClass, 'fpga_design', usedIds);
  const packageId = uniqueStableId(`${designName}_pkg`, 'design_pkg', usedIds);
  const topId = uniqueStableId(`${designName}_top`, 'design_top', usedIds);
  const testbenchId = uniqueStableId(`tb_${designName}_top`, 'tb_design_top', usedIds);
  const clockDomainId = uniqueStableId(`${designName}_clk_domain`, 'sys_clk_domain', usedIds);
  const packageCapabilities = capabilities.filter((capability) => classifyCapabilityOwnership(capability) === 'package');
  const topCapabilities = capabilities.filter((capability) => classifyCapabilityOwnership(capability) === 'top');
  const testbenchCapabilities = capabilities.filter((capability) => classifyCapabilityOwnership(capability) === 'testbench');
  const rtlCapabilities = capabilities.filter((capability) => classifyCapabilityOwnership(capability) === 'rtl');
  const rtlComponents = rtlCapabilities.map((capability, index) => {
    const componentId = uniqueStableId(capability.id.replace(/^(self_checking_|optional_)/, ''), `rtl_block_${index + 1}`, usedIds);
    return {
      capability,
      component: {
        id: componentId,
        kind: 'rtl' as const,
        name: componentId,
        file: `src/${componentId}.vhd`,
        responsibility: `Implement the ${capability.description} capability with typed, synthesizable VHDL.`,
        implements: [capability.id],
        dependsOn: [packageId],
        children: [],
        clockDomain: clockDomainId,
        generics: [],
        ports: [
          { name: 'clk', mode: 'in' as const, type: 'std_logic', purpose: 'Synchronous design clock.' },
          { name: 'rst', mode: 'in' as const, type: 'std_logic', purpose: 'Active-high synchronous reset.' },
          { name: 'enable_i', mode: 'in' as const, type: 'std_logic', purpose: 'Enables this contracted processing block.' },
          { name: 'data_i', mode: 'in' as const, type: 'std_logic_vector(7 downto 0)', purpose: 'Contracted input sample or command byte.' },
        ],
        exports: [],
        implementationSourcePreference: 'deterministic_template' as const,
      },
    };
  });

  const behaviorIds = capabilities.map((capability, index) => `behavior_${stableId(capability.id, `capability_${index + 1}`)}`);
  const isUartSpiProtocolBridge = blueprint.designClass === 'uart_spi_protocol_bridge';
  const contractedBehaviorTiming = isUartSpiProtocolBridge
    ? 'After reset deassertion and a one-cycle start_i pulse with data_i = x"5A", the nominal bridge scenario must assert done_o within four rising clock edges, keep error_o = 0, and drive status_o = x"01".'
    : 'After reset deassertion and start_i assertion, status_o/done_o settle to deterministic expected values within a bounded cycle window.';
  const contractedResetBehavior = isUartSpiProtocolBridge
    ? 'During reset, done_o = 0, error_o = 0, and status_o = x"00"; these outputs are registered or driven from explicit internal status state.'
    : 'During reset, done_o, error_o, and status_o are driven to zero.';
  const contractedVerificationExpected = isUartSpiProtocolBridge
    ? 'Reset drives done_o = 0, error_o = 0, and status_o = x"00"; after start_i with x"5A", done_o asserts, error_o remains 0, and status_o equals x"01" within four clock cycles.'
    : 'Reset drives outputs to zero; after start_i, done_o asserts, error_o remains zero, and status_o is deterministic.';
  const contractedVerificationActions = isUartSpiProtocolBridge
    ? [
      { kind: 'drive', signal: 'rst', value: "'1'" },
      { kind: 'drive', signal: 'start_i', value: "'0'" },
      { kind: 'drive', signal: 'data_i', value: 'x"00"' },
      { kind: 'wait_cycles', cycles: 2 },
      { kind: 'expect', signal: 'done_o', value: "'0'", message: 'FAIL reset done_o asserted' },
      { kind: 'expect', signal: 'error_o', value: "'0'", message: 'FAIL reset error_o asserted' },
      { kind: 'expect', signal: 'status_o', value: 'x"00"', message: 'FAIL reset status_o not x00' },
      { kind: 'drive', signal: 'rst', value: "'0'" },
      { kind: 'drive', signal: 'data_i', value: 'x"5A"' },
      { kind: 'drive', signal: 'start_i', value: "'1'" },
      { kind: 'wait_cycles', cycles: 1 },
      { kind: 'drive', signal: 'start_i', value: "'0'" },
      { kind: 'wait_cycles', cycles: 4 },
      { kind: 'expect', signal: 'error_o', value: "'0'", message: 'FAIL error_o asserted' },
      { kind: 'expect', signal: 'done_o', value: "'1'", message: 'FAIL done_o did not assert' },
      { kind: 'expect', signal: 'status_o', value: 'x"01"', message: 'FAIL status_o did not report nominal completion' },
      { kind: 'finish', message: 'TEST PASSED' },
    ]
    : [
      { kind: 'drive', signal: 'rst', value: "'1'" },
      { kind: 'drive', signal: 'start_i', value: "'0'" },
      { kind: 'wait_cycles', cycles: 2 },
      { kind: 'drive', signal: 'rst', value: "'0'" },
      { kind: 'drive', signal: 'data_i', value: 'x"5A"' },
      { kind: 'drive', signal: 'start_i', value: "'1'" },
      { kind: 'wait_cycles', cycles: 4 },
      { kind: 'expect', signal: 'error_o', value: "'0'", message: 'FAIL error_o asserted' },
      { kind: 'expect', signal: 'done_o', value: "'1'", message: 'FAIL done_o did not assert' },
      { kind: 'finish', message: 'TEST PASSED' },
    ];
  const components: FpgaArchitectureComponentContract[] = [
    {
      id: packageId,
      kind: 'package',
      name: packageId,
      file: `src/${packageId}.vhd`,
      responsibility: `Define shared constants and subtypes for the ${blueprint.designClass} architecture.`,
      implements: packageCapabilities.map((capability) => capability.id),
      dependsOn: [],
      children: [],
      clockDomain: null,
      generics: [],
      ports: [],
      exports: ['DATA_WIDTH', 'data_t'],
      packageSymbols: [
        { name: 'DATA_WIDTH', kind: 'constant', type: 'positive', value: '8' },
        { name: 'data_t', kind: 'subtype', type: 'std_logic_vector(7 downto 0)' },
      ],
    },
    ...rtlComponents.map((entry) => entry.component),
    {
      id: topId,
      kind: 'top',
      name: topId,
      file: `src/${topId}.vhd`,
      responsibility: `Integrate the ${blueprint.designClass} RTL blocks and expose the stable top-level interface.`,
      implements: topCapabilities.map((capability) => capability.id),
      dependsOn: [packageId, ...rtlComponents.map((entry) => entry.component.id)],
      children: rtlComponents.map((entry) => entry.component.id),
      clockDomain: clockDomainId,
      generics: [],
      ports: [
        { name: 'clk', mode: 'in', type: 'std_logic', purpose: 'Top-level synchronous design clock.' },
        { name: 'rst', mode: 'in', type: 'std_logic', purpose: 'Top-level active-high synchronous reset.' },
        { name: 'start_i', mode: 'in', type: 'std_logic', purpose: 'Starts the deterministic verification scenario.' },
        { name: 'data_i', mode: 'in', type: 'std_logic_vector(7 downto 0)', purpose: 'Top-level command or payload byte.' },
        { name: 'done_o', mode: 'out', type: 'std_logic', purpose: 'Indicates the contracted operation completed.' },
        { name: 'error_o', mode: 'out', type: 'std_logic', purpose: 'Indicates a detected protocol or datapath error.' },
        { name: 'status_o', mode: 'out', type: 'std_logic_vector(7 downto 0)', purpose: 'Observable contracted status byte.' },
      ],
      exports: [],
    },
    {
      id: testbenchId,
      kind: 'testbench',
      name: testbenchId,
      file: `tb/${testbenchId}.vhd`,
      responsibility: `Instantiate ${topId} and prove the required ${blueprint.designClass} contract with self-checking assertions.`,
      implements: testbenchCapabilities.map((capability) => capability.id),
      dependsOn: [packageId, topId],
      children: [topId],
      clockDomain: null,
      generics: [],
      ports: [],
      exports: [],
    },
  ];

  const sourceGroundedRequirements: FpgaArchitectureSourceGroundedRequirement[] = synthesis.evidenceClaims.map((claim, index) => ({
    id: `source_req_${index + 1}_${stableId(claim.guidanceType, 'guidance')}`,
    sourceClaimId: claim.claimId,
    appliesTo: ([
      'hierarchy',
      'clock_reset',
      'interface',
      'numeric',
      'memory',
      'verification',
      'tool_flow',
      'reference_design',
    ].includes(claim.guidanceType) ? claim.guidanceType : 'architecture') as FpgaArchitectureSourceGroundedRequirement['appliesTo'],
    requirement: claim.contractImplication,
    sourceUrl: claim.sourceUrl,
  }));
  const evidenceFacts = params.evidenceFacts || [];
  sourceGroundedRequirements.push(...evidenceFacts.map((fact, index) => ({
    id: `live_source_req_${index + 1}_${stableId(fact.appliesTo, 'guidance')}`,
    sourceClaimId: fact.factId,
    appliesTo: fact.appliesTo,
    requirement: fact.contractImplication,
    sourceUrl: fact.sourceUrl,
    sourceHash: fact.sourceHash,
    ...(fact.snapshotId ? { sourceSnapshotId: fact.snapshotId } : {}),
  })));

  const outputOwnership: FpgaArchitectureOutputOwnershipRule[] = ['done_o', 'error_o', 'status_o'].map((signal) => ({
    ruleId: `own_${signal}`,
    signal,
    ownerComponentId: topId,
    evidence: 'App-owned top/status contract owns generic completion, error, and status outputs unless refined by a child-output connection.',
  }));
  const signalTimelines: FpgaArchitectureSignalTimelineRule[] = [
    {
      ruleId: 'timeline_reset_status_outputs',
      signal: 'done_o,error_o,status_o',
      ownerComponentId: topId,
      events: [
        { at: 'while rst = 1', value: 'done_o = 0, error_o = 0, status_o = x"00"', evidence: contractedResetBehavior },
        { at: 'after start_i pulse within the bounded verification window', value: isUartSpiProtocolBridge ? 'done_o = 1, error_o = 0, status_o = x"01"' : 'done_o = 1, error_o = 0, status_o remains deterministic', evidence: contractedBehaviorTiming },
      ],
    },
  ];
  const truthTables: FpgaArchitectureTruthTableRule[] = [
    {
      ruleId: 'truth_table_nominal_status',
      ownerComponentId: topId,
      input: 'rst,start_i',
      rows: [
        { rst: '1', start_i: '0', done_o: '0', error_o: '0', status_o: 'x"00"' },
        { rst: '0', start_i: '1', done_o: '0 initially, then 1 inside latency window', error_o: '0', status_o: isUartSpiProtocolBridge ? 'x"01" at nominal completion' : 'deterministic nominal status' },
      ],
    },
  ];
  const verificationDerivation: FpgaArchitectureVerificationDerivationRule[] = [{
    verificationId: `verify_${designName}_contract`,
    derivesFromRuleIds: [
      ...outputOwnership.map((entry) => entry.ruleId),
      ...signalTimelines.map((entry) => entry.ruleId),
      ...truthTables.map((entry) => entry.ruleId),
      ...behaviorIds,
    ],
  }];

  return {
    schemaVersion: '2.0',
    designName,
    designClass: blueprint.designClass,
    topEntity: topId,
    topTestbench: testbenchId,
    systemIntent: `Generate a deterministic ${blueprint.systemRole} implementation with a self-checking GHDL testbench.`,
    assumptions: [
      'The generated project uses VHDL-2008 and one active-high synchronous clock/reset domain unless the model refines this contract consistently.',
    ],
    requiredCapabilityIds: capabilities.map((entry) => entry.id),
    components,
    clockDomains: [{
      id: clockDomainId,
      clockPort: 'clk',
      resetPort: 'rst',
      resetActive: 'high',
      resetStyle: 'synchronous',
      memberComponents: [topId, ...rtlComponents.map((entry) => entry.component.id)],
    }],
    behaviors: capabilities.map((capability, index) => ({
      id: behaviorIds[index],
      requirement: `The design implements and exposes observable evidence for ${capability.description}.`,
      inputs: ['start_i', 'data_i'],
      outputs: ['done_o', 'error_o', 'status_o'],
      timing: contractedBehaviorTiming,
      resetBehavior: contractedResetBehavior,
      latencyCycles: 1,
      preconditions: ['rst is deasserted before start_i is asserted.'],
    })),
    verification: [{
      id: `verify_${designName}_contract`,
      requirement: `Self-check reset, startup, and one deterministic scenario covering every required ${blueprint.designClass} capability.`,
      stimulus: 'Drive reset, apply one deterministic command byte, wait for completion, and check stable DUT outputs.',
      expected: contractedVerificationExpected,
      observables: ['done_o', 'error_o', 'status_o'],
      covers: capabilities.map((entry) => entry.id),
      coversBehaviors: behaviorIds,
      actions: contractedVerificationActions,
    }],
    numericFormats: [{
      id: `${designName}_data_format`,
      type: 'unsigned',
      width: 8,
      integerBits: 8,
      fractionalBits: 0,
      overflow: 'wrap',
      rounding: 'truncate',
    }],
    instances: [
      ...rtlComponents.map((entry, index) => ({
        id: `u_${entry.component.id}`,
        parentComponentId: topId,
        childComponentId: entry.component.id,
        label: `u_${entry.component.id}`,
        genericMap: {},
        portMap: {
          clk: 'clk',
          rst: 'rst',
          enable_i: 'start_i',
          data_i: 'data_i',
        },
      })),
      {
        id: 'dut',
        parentComponentId: testbenchId,
        childComponentId: topId,
        label: 'dut',
        genericMap: {},
        portMap: {
          clk: 'clk',
          rst: 'rst',
          start_i: 'start_i',
          data_i: 'data_i',
          done_o: 'done_o',
          error_o: 'error_o',
          status_o: 'status_o',
        },
      },
    ],
    connections: [],
    stateMachines: [],
    sourceOrder: buildNormalizedSourceOrder(components),
    architectureSynthesis: {
      sourceMode: synthesis.sourceMode,
      synthesisId: synthesis.synthesisId,
      primaryPatternId: synthesis.primaryPattern.patternId,
      secondaryPatternIds: synthesis.secondaryPatterns.map((pattern) => pattern.patternId),
      buildingBlockCatalogIds: synthesis.buildingBlockCatalogEntries.map(({ entry }) => entry.id),
      methodologyRuleIds: synthesis.methodologyRules.map((rule) => rule.ruleId),
      referenceDesignIds: synthesis.referenceDesigns.map((reference) => reference.referenceId),
      evidenceClaimIds: [
        ...synthesis.evidenceClaims.map((claim) => claim.claimId),
        ...evidenceFacts.map((fact) => fact.factId),
      ],
      retrievalMode: params.retrievalMode || 'off',
      retrievedSourceIds: Array.from(new Set(evidenceFacts.map((fact) => fact.sourceId))),
      sourceSnapshotIds: Array.from(new Set(evidenceFacts.map((fact) => fact.snapshotId).filter(Boolean) as string[])),
      sourceHashes: Array.from(new Set(evidenceFacts.map((fact) => fact.sourceHash).filter(Boolean))),
      evidenceFreshness: evidenceFacts.length > 0 ? 'live_or_cached_official_evidence' : 'curated_only',
      confidence: synthesis.confidence,
    },
    sourceGroundedRequirements,
    outputOwnership,
    signalTimelines,
    truthTables,
    fsmContracts: [],
    verificationDerivation,
    ...(params.intent ? { intent: params.intent } : {}),
  };
}

function contractScaffold(blueprint: FpgaArchitectureBlueprint) {
  const capabilities = requiredCapabilitiesForBlueprint(blueprint);
  return {
    schemaVersion: '2.0',
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
      packageSymbols: [{
        name: '<exact package symbol name>',
        kind: '<constant | subtype | enum | record | array>',
        type: '<exact VHDL declaration type>',
        value: '<constant value when kind is constant>',
        literals: ['<enum literal when kind is enum>'],
        fields: [{ name: '<record field>', type: '<exact field type>' }],
      }],
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
      resetBehavior: '<exact reset behavior>',
      latencyCycles: 0,
      preconditions: ['<behavior precondition>'],
    }],
    verification: [{
      id: '<verification id>',
      requirement: '<what this proves>',
      stimulus: '<deterministic stimulus>',
      expected: '<exact expected behavior>',
      observables: ['<top port or visible status>'],
      covers: ['<required capability id>'],
      coversBehaviors: ['<behavior id>'],
      actions: [
        { kind: 'drive', signal: '<top input>', value: "'0'" },
        { kind: 'wait_cycles', cycles: 1 },
        { kind: 'expect', signal: '<top output>', value: "'0'", message: '<precise failure message>' },
        { kind: 'finish', message: 'TEST PASSED' },
      ],
    }],
    outputOwnership: [{
      ruleId: '<ownership rule id>',
      signal: '<top output signal>',
      ownerComponentId: '<component that owns the value>',
      evidence: '<user intent, pattern, catalog, or methodology evidence>',
    }],
    signalTimelines: [{
      ruleId: '<timeline rule id>',
      signal: '<signal name>',
      ownerComponentId: '<component id>',
      events: [{ at: '<exact cycle/state/condition>', value: '<exact value/range>', evidence: '<source evidence>' }],
    }],
    truthTables: [{
      ruleId: '<truth table rule id>',
      ownerComponentId: '<component id>',
      input: '<input set>',
      rows: [{ '<input>': '<value>', '<output>': '<value>' }],
    }],
    fsmContracts: [{
      ruleId: '<fsm rule id>',
      componentId: '<component id>',
      stateType: '<state type>',
      resetState: '<reset state>',
      states: ['<state literal>'],
    }],
    verificationDerivation: [{
      verificationId: '<verification id>',
      derivesFromRuleIds: ['<behavior or rule id>'],
    }],
    intent: {
      schemaVersion: '1.0',
      explicitRequirements: {},
      inferredRequirements: {},
      unknownRequirements: [],
      designClassCandidates: [],
      confidenceByField: {},
      clarificationQuestions: [],
      acceptedAppDefaults: [],
    },
    numericFormats: [{
      id: '<numeric format id>',
      type: '<unsigned | signed | sfixed | ufixed>',
      width: 8,
      integerBits: 8,
      fractionalBits: 0,
      overflow: '<wrap | saturate>',
      rounding: '<truncate | nearest>',
    }],
    instances: [{
      id: '<instance id>',
      parentComponentId: '<parent component id>',
      childComponentId: '<child component id>',
      label: '<legal instance label>',
      genericMap: { '<child generic>': '<parent expression or literal>' },
      portMap: { '<child formal port>': '<parent signal or port>' },
    }],
    connections: [{
      id: '<connection id>',
      type: '<exact VHDL signal type>',
      source: { componentId: '<source component id>', port: '<source port>' },
      sinks: [{ componentId: '<sink component id>', port: '<sink port>' }],
      clockDomain: '<clock domain id or null>',
      cdc: '<none | synchronizer | async_fifo | handshake>',
      handshake: { valid: '<valid signal>', ready: '<ready signal>', payload: ['<payload signal>'] },
    }],
    stateMachines: [{
      id: '<state machine id>',
      componentId: '<owning component id>',
      stateType: '<package enum type>',
      states: ['<state literal>'],
      resetState: '<reset state literal>',
      transitions: [{ from: '<state>', event: '<condition>', to: '<state>', outputs: ['<output action>'] }],
    }],
    architectureSynthesis: {
      sourceMode: 'curated_first_hybrid',
      synthesisId: '<app-owned synthesis id>',
      primaryPatternId: '<selected curated design-pattern id>',
      secondaryPatternIds: ['<composed pattern id>'],
      buildingBlockCatalogIds: ['<selected building-block catalog id>'],
      methodologyRuleIds: ['<official methodology rule id>'],
      referenceDesignIds: ['<official reference design id>'],
      evidenceClaimIds: ['<source claim id>'],
      retrievalMode: 'off',
      retrievedSourceIds: [],
      sourceSnapshotIds: [],
      sourceHashes: [],
      evidenceFreshness: 'curated_only',
      confidence: 0.9,
    },
    sourceGroundedRequirements: [{
      id: '<source-grounded requirement id>',
      sourceClaimId: '<claim id from architectureSynthesis.evidenceClaimIds>',
      appliesTo: '<architecture | hierarchy | clock_reset | interface | numeric | memory | verification | tool_flow | reference_design>',
      requirement: '<contract implication from curated methodology/reference evidence>',
      sourceUrl: '<approved official source URL>',
      sourceHash: '<optional evidence content hash>',
      sourceSnapshotId: '<optional cached evidence snapshot id>',
    }],
    sourceOrder: ['<package file>', '<leaf RTL file>', '<top RTL file>', '<testbench file>'],
  };
}

export function buildFpgaArchitectureContractProposalPrompt(params: {
  userRequest: string;
  intent?: FpgaArchitectureIntent;
  evidenceFacts?: FpgaArchitectureEvidenceFact[];
  retrievalMode?: FpgaArchitectureRetrievalMode;
  retrievalWarnings?: string[];
  architectureSelectionReview?: FpgaArchitectureSelectionReview;
  missingBlockDiscovery?: FpgaMissingBlockDiscoveryResult;
  missingBlockFitReview?: FpgaArchitectureSelectionReview;
}) {
  const synthesis = synthesizeFpgaArchitectureBlueprintFromPrompt(params.userRequest);
  const blueprint = synthesis.blueprint;
  const requiredCapabilities = requiredCapabilitiesForBlueprint(blueprint);
  const evidenceFacts = params.evidenceFacts || [];
  const appOwnedDraft = buildFpgaArchitectureContractDraft({
    userRequest: params.userRequest,
    evidenceFacts,
    retrievalMode: params.retrievalMode,
    intent: params.intent,
  });
  const liveEvidencePrompt = formatFpgaArchitectureEvidenceFactsForPrompt(evidenceFacts);
  return [
    'You are preparing a machine-checkable FPGA architecture contract before any VHDL is generated.',
    'Return exactly one JSON object and no Markdown, prose, code fences, VHDL, comments, or trailing text.',
    'Start from the app-owned draft contract below. Preserve app-owned IDs, schemaVersion, designClass, requiredCapabilityIds, architectureSynthesis, sourceGroundedRequirements, top/package/testbench intent, and source-order shape unless a listed design detail requires a consistent bounded refinement.',
    '',
    'Curated-first hybrid architecture synthesis:',
    `- Source mode: ${synthesis.sourceMode}`,
    `- Primary app-owned design pattern: ${synthesis.primaryPattern.patternId}`,
    `- Secondary composed patterns: ${synthesis.secondaryPatterns.map((pattern) => pattern.patternId).join(', ') || 'none'}`,
    `- Pattern confidence: ${Math.round(synthesis.confidence * 100)}%`,
    '- The curated design pattern owns high-level building-block architecture. The model fills bounded details inside that architecture and must not invent a replacement architecture from scratch.',
    '',
    'Strict no-assumption intent gate:',
    params.intent
      ? JSON.stringify({
        explicitRequirements: params.intent.explicitRequirements,
        inferredRequirements: params.intent.inferredRequirements,
        acceptedAppDefaults: params.intent.acceptedAppDefaults || [],
        designClassCandidates: params.intent.designClassCandidates,
      }, null, 2)
      : 'No explicit intent packet was supplied. Do not infer fields without evidence from the original request.',
    '- Treat unknown or absent intent as unknown, not as permission to guess.',
    '- Do not silently expand acronyms or add unrequested external interfaces, timing, widths, or verification expectations.',
    '',
    `Design class: ${blueprint.designClass}`,
    `System role: ${blueprint.systemRole}`,
    '',
    'Selected pattern building blocks:',
    ...synthesis.primaryPattern.requiredBlocks.map((block) => `- ${block.id} (${block.kind}): ${block.responsibility}`),
    '',
    'Selected pattern top-output ownership:',
    ...synthesis.primaryPattern.topOutputOwnership.map((entry) => `- ${entry}`),
    '',
    'Selected pattern timing contracts:',
    ...synthesis.primaryPattern.timingContracts.map((entry) => `- ${entry}`),
    '',
    formatBuildingBlockCatalogPromptSection(synthesis.buildingBlockCatalogEntries, {
      heading: 'Selected Curated Building-Block Catalog Specs',
      maxEntries: 10,
    }),
    '',
    ...buildArchitectureSelectionReviewGuidance(params.architectureSelectionReview),
    formatMissingBlockDiscoveryPromptSection(params.missingBlockDiscovery),
    ...buildArchitectureSelectionReviewGuidance(params.missingBlockFitReview),
    'Official methodology/reference evidence. Keep only these source-grounded requirements and do not invent unsupported claims:',
    ...synthesis.evidenceClaims.map((claim) => `- ${claim.claimId}: ${claim.contractImplication} [${claim.sourceTitle}]`),
    '',
    `Optional official live/cached evidence mode: ${params.retrievalMode || 'off'}`,
    liveEvidencePrompt
      ? `Approved retrieved evidence facts:\n${liveEvidencePrompt}`
      : 'Approved retrieved evidence facts: none. Use only the app-owned curated library and built-in official methodology/reference claims.',
    ...(params.retrievalWarnings?.length ? [
      'Retrieval warnings. These are non-fatal and must not be treated as design requirements:',
      ...params.retrievalWarnings.map((warning) => `- ${warning}`),
    ] : []),
    '',
    'Required capabilities. Preserve every ID exactly and assign every ID to at least one component:',
    ...requiredCapabilities.map((entry) => `- ${entry.id}: ${entry.description}`),
    '',
    'Architecture rules:',
    '- Fill or refine bounded design details: component responsibilities, leaf component ports/generics, instances, named maps, connections, behaviors, verification actions, state machines, and numeric formats.',
    '- Do not replace the contract with prose and do not remove app-owned IDs or required sections.',
    '- Every model-filled field must be grounded in the strict intent packet, app-owned pattern/template, catalog spec, or official methodology/reference evidence.',
    '- If a required design choice is still unclear, keep the contract invalid rather than guessing; the app should ask for clarification before VHDL generation.',
    '- Use legal basic VHDL identifiers and exact constrained VHDL subtype indications for public vector ports.',
    '- Include exactly one top component and one testbench component.',
    '- Every component dependency must name another component and sourceOrder must place dependencies first and the testbench last.',
    '- Every RTL/top/testbench hierarchy edge must appear in children; use direct entity instantiation in generated VHDL.',
    '- The approved top must reach every RTL leaf through children, and the testbench must instantiate only the approved top.',
    '- Every required capability must be implemented by a component and covered by at least one verification item.',
    '- schemaVersion must be "2.0". Define exact package symbols, direct instances, named generic/port maps, typed connections, state-machine transitions, numeric formats, reset behavior, cycle latency, and executable verification actions.',
    '- Every behavior must be covered by at least one verification item through coversBehaviors.',
    '- Fill outputOwnership, signalTimelines, truthTables, fsmContracts, and verificationDerivation when applicable. They must be exact and source-grounded, not vague.',
    '- Every hierarchy edge must have one exact instances entry whose named maps match the child interface.',
    '- Every internal connection must have one driver, typed sinks, an explicit clock domain, and an explicit CDC policy.',
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
    'App-owned draft contract to preserve and refine:',
    JSON.stringify(appOwnedDraft, null, 2),
    '',
    'Reference JSON shape and field meanings:',
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
  intent?: FpgaArchitectureIntent;
  evidenceFacts?: FpgaArchitectureEvidenceFact[];
  retrievalMode?: FpgaArchitectureRetrievalMode;
  retrievalWarnings?: string[];
  architectureSelectionReview?: FpgaArchitectureSelectionReview;
  missingBlockDiscovery?: FpgaMissingBlockDiscoveryResult;
  missingBlockFitReview?: FpgaArchitectureSelectionReview;
}) {
  const topIssues = params.issues.slice(0, 50);
  const issueCodes = new Set(params.issues.map((issue) => issue.code));
  const graphRepairGuidance = [
    'architecture_contract_instance_actual_unknown',
    'architecture_contract_instance_output_actual_invalid',
    'architecture_contract_connection_sink_direction',
    'architecture_contract_connection_sink_type',
  ].some((code) => issueCodes.has(code))
    ? [
      '',
      'Graph repair contract for instance/connection issues:',
      '- Do not invent free-floating actual names such as core_result unless they are declared as exact connection IDs in $.connections.',
      '- For child output/buffer/inout ports, use a writable parent port, declared connection id, or legal testbench DUT signal.',
      '- For each declared connection, source must be an out/buffer/inout port and every sink must be an in/inout port with the exact same type.',
      '- If a generated name is just an internal wire, add one typed connection object for it instead of leaving it implicit.',
      '- Preserve app-owned component IDs, required capabilities, topEntity, topTestbench, and sourceOrder ownership.',
    ]
    : [];
  return [
    buildFpgaArchitectureContractProposalPrompt({
      userRequest: params.userRequest,
      intent: params.intent,
      evidenceFacts: params.evidenceFacts,
      retrievalMode: params.retrievalMode,
      retrievalWarnings: params.retrievalWarnings,
      architectureSelectionReview: params.architectureSelectionReview,
      missingBlockDiscovery: params.missingBlockDiscovery,
      missingBlockFitReview: params.missingBlockFitReview,
    }),
    '',
    'The previous architecture contract was rejected by deterministic validation.',
    'Return one complete JSON object only. No Markdown, no comments, no prose, no code fences, no trailing text.',
    'Quote all string values. Never emit bare VHDL tokens such as open, high, low, synchronous, asynchronous, std_logic, or std_logic_vector.',
    'Correct every issue below while preserving all non-failing paths and app-owned IDs.',
    '',
    'Issue table: code | path | message',
    ...topIssues.map((issue) => `${issue.code} | ${issue.path} | ${issue.message}`),
    ...(params.issues.length > topIssues.length ? [`... ${params.issues.length - topIssues.length} additional issue(s) omitted from prompt for compactness; fix the same classes wherever they appear.`] : []),
    ...graphRepairGuidance,
    '',
    'Previous rejected response:',
    params.invalidResponse.slice(0, 12_000),
  ].join('\n');
}

function recoverJsonishContractText(text: string) {
  return text
    .replace(/(:\s*)open(?=\s*[,}\]])/gi, '$1"open"')
    .replace(/(:\s*)high(?=\s*[,}\]])/gi, '$1"high"')
    .replace(/(:\s*)low(?=\s*[,}\]])/gi, '$1"low"')
    .replace(/(:\s*)synchronous(?=\s*[,}\]])/gi, '$1"synchronous"')
    .replace(/(:\s*)asynchronous(?=\s*[,}\]])/gi, '$1"asynchronous"');
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

function asRecordOfStringArrays(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
    key,
    Array.isArray(entry) ? entry.map(asString).filter(Boolean) : asString(entry) ? [asString(entry)] : [],
  ]));
}

function parseIntentObject(value: any): FpgaArchitectureIntent | undefined {
  if (!value || typeof value !== 'object') return undefined;
  return {
    schemaVersion: '1.0',
    explicitRequirements: asRecordOfStringArrays(value.explicitRequirements),
    inferredRequirements: value.inferredRequirements && typeof value.inferredRequirements === 'object'
      ? Object.fromEntries(Object.entries(value.inferredRequirements as Record<string, unknown>).map(([key, entries]) => [
        key,
        Array.isArray(entries)
          ? entries.map((entry: any) => ({
            value: asString(entry?.value),
            evidence: asString(entry?.evidence),
            confidence: clamp01(asNumber(entry?.confidence, 0)),
          })).filter((entry) => entry.value && entry.evidence)
          : [],
      ]))
      : {},
    unknownRequirements: asStringArray(value.unknownRequirements),
    designClassCandidates: Array.isArray(value.designClassCandidates)
      ? value.designClassCandidates.map((candidate: any) => ({
        designClass: asString(candidate?.designClass),
        confidence: clamp01(asNumber(candidate?.confidence, 0)),
        evidence: asString(candidate?.evidence),
      })).filter((candidate: any) => candidate.designClass && candidate.evidence)
      : [],
    confidenceByField: value.confidenceByField && typeof value.confidenceByField === 'object'
      ? Object.fromEntries(Object.entries(value.confidenceByField as Record<string, unknown>).map(([field, confidence]) => [field, clamp01(asNumber(confidence, 0))]))
      : {},
    clarificationQuestions: asStringArray(value.clarificationQuestions),
    acceptedAppDefaults: asStringArray(value.acceptedAppDefaults),
  };
}

function asNumber(value: unknown, fallback = 0) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function buildFpgaArchitectureSelectionReviewPrompt(params: {
  userRequest: string;
}) {
  const synthesis = synthesizeFpgaArchitectureBlueprintFromPrompt(params.userRequest);
  const selectedCatalogEntries = synthesis.buildingBlockCatalogEntries.slice(0, 16);
  return [
    'You are reviewing the app-selected FPGA architecture approach before any Architecture Contract or VHDL is generated.',
    'Return exactly one JSON object and no Markdown, prose, code fences, VHDL, comments, or trailing text.',
    '',
    'User request:',
    params.userRequest,
    '',
    'App-selected curated architecture pattern:',
    JSON.stringify({
      primaryPatternId: synthesis.primaryPattern.patternId,
      primaryDesignClass: synthesis.primaryPattern.designClass,
      secondaryPatternIds: synthesis.secondaryPatterns.map((pattern) => pattern.patternId),
      systemRole: synthesis.primaryPattern.systemRole,
      requiredBlocks: synthesis.primaryPattern.requiredBlocks.map((block) => ({
        id: block.id,
        kind: block.kind,
        responsibility: block.responsibility,
      })),
      topOutputOwnership: synthesis.primaryPattern.topOutputOwnership,
      timingContracts: synthesis.primaryPattern.timingContracts,
    }, null, 2),
    '',
    'App-selected 3,600-catalog building-block specs:',
    JSON.stringify(selectedCatalogEntries.map(({ entry, score, matchedTerms }) => ({
      id: entry.id,
      name: entry.name,
      category: entry.category,
      subcategory: entry.subcategory,
      summary: entry.summary,
      representativePorts: entry.ports.slice(0, 8),
      configurables: entry.configurables.slice(0, 6),
      implementationNotes: entry.implementationNotes,
      score,
      matchedTerms,
    })), null, 2),
    '',
    'Review rules:',
    '- Judge whether the selected primary pattern and support blocks are the right starting approach for the user request.',
    '- You are not generating VHDL and must not invent free-form architecture outside the curated selection.',
    '- If the selection is mostly right but missing support blocks, use fit "partial".',
    '- Use fit "poor" only when the primary architecture class is clearly wrong for the user request.',
    '- Recommended patterns/blocks must be named as existing app-selected pattern ids, design classes, catalog IDs, or catalog block names visible above when possible.',
    '- If a custom block is truly required, prefix it with "custom:" and explain the risk.',
    '',
    'Return this exact JSON shape:',
    JSON.stringify({
      fit: 'good | partial | poor',
      confidence: 0.0,
      selectedPrimaryPattern: synthesis.primaryPattern.patternId,
      selectedSupportBlocks: ['<selected catalog id or block name>'],
      missingBlocks: ['<missing block id/name or custom:block_name>'],
      unnecessaryBlocks: ['<unnecessary selected block id/name>'],
      recommendedPrimaryPattern: '<pattern id or design class; empty if unchanged>',
      recommendedSupportBlocks: ['<catalog id/name or custom:block_name>'],
      architectureRisks: ['<short risk>'],
      reasoningSummary: '<one concise sentence>',
    }, null, 2),
  ].join('\n');
}

export function parseFpgaArchitectureSelectionReview(text: string): FpgaArchitectureSelectionReview {
  let parsed: any;
  try {
    parsed = JSON.parse(extractJsonObject(text));
  } catch (error: any) {
    throw new FpgaArchitectureContractError(`Architecture selection review JSON was invalid: ${error?.message || String(error)}`, [{
      code: 'architecture_selection_review_json_invalid',
      path: '$',
      message: error?.message || String(error),
    }]);
  }

  const rawFit = asString(parsed?.fit).toLowerCase();
  const fit: FpgaArchitectureSelectionReviewFit = rawFit === 'good' || rawFit === 'partial' || rawFit === 'poor'
    ? rawFit
    : 'unavailable';
  return {
    fit,
    confidence: clamp01(asNumber(parsed?.confidence, 0)),
    selectedPrimaryPattern: asString(parsed?.selectedPrimaryPattern),
    selectedSupportBlocks: asStringArray(parsed?.selectedSupportBlocks).slice(0, 16),
    missingBlocks: asStringArray(parsed?.missingBlocks).slice(0, 16),
    unnecessaryBlocks: asStringArray(parsed?.unnecessaryBlocks).slice(0, 16),
    recommendedPrimaryPattern: asString(parsed?.recommendedPrimaryPattern),
    recommendedSupportBlocks: asStringArray(parsed?.recommendedSupportBlocks).slice(0, 16),
    architectureRisks: asStringArray(parsed?.architectureRisks).slice(0, 12),
    reasoningSummary: asString(parsed?.reasoningSummary).slice(0, 600),
  };
}

function buildUnavailableArchitectureSelectionReview(reason: string): FpgaArchitectureSelectionReview {
  return {
    fit: 'unavailable',
    confidence: 0,
    selectedPrimaryPattern: '',
    selectedSupportBlocks: [],
    missingBlocks: [],
    unnecessaryBlocks: [],
    recommendedPrimaryPattern: '',
    recommendedSupportBlocks: [],
    architectureRisks: [],
    reasoningSummary: reason,
  };
}

function buildArchitectureSelectionReviewGuidance(review: FpgaArchitectureSelectionReview | undefined) {
  if (!review || review.fit === 'good' || review.fit === 'unavailable') return [];
  return [
    'Architecture selection reviewer feedback:',
    `- Fit: ${review.fit}; confidence: ${Math.round(review.confidence * 100)}%`,
    `- Recommended primary pattern: ${review.recommendedPrimaryPattern || 'unchanged'}`,
    `- Missing blocks: ${review.missingBlocks.join(', ') || 'none'}`,
    `- Unnecessary blocks: ${review.unnecessaryBlocks.join(', ') || 'none'}`,
    `- Recommended support blocks: ${review.recommendedSupportBlocks.join(', ') || 'none'}`,
    `- Risks: ${review.architectureRisks.join('; ') || 'none'}`,
    `- Summary: ${review.reasoningSummary || 'No additional reviewer summary.'}`,
    'Apply this feedback only within the app-owned curated architecture and catalog constraints. Do not invent arbitrary blocks unless they are prefixed with "custom:" and necessary.',
    '',
  ];
}

export function parseFpgaArchitectureContract(text: string): FpgaArchitectureContract {
  let parsed: any;
  try {
    parsed = JSON.parse(recoverJsonishContractText(extractJsonObject(text)));
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
    ...(typeof component?.implementationSourcePreference === 'string' ? {
      implementationSourcePreference: asString(component.implementationSourcePreference) as FpgaArchitectureComponentContract['implementationSourcePreference'],
    } : {}),
    ...(Array.isArray(component?.packageSymbols) ? {
      packageSymbols: component.packageSymbols.map((symbol: any) => ({
        name: asString(symbol?.name),
        kind: asString(symbol?.kind) as FpgaArchitecturePackageSymbolContract['kind'],
        type: asString(symbol?.type),
        ...(asString(symbol?.value) ? { value: asString(symbol?.value) } : {}),
        ...(Array.isArray(symbol?.literals) ? { literals: asStringArray(symbol?.literals) } : {}),
        ...(Array.isArray(symbol?.fields) ? {
          fields: symbol.fields.map((field: any) => ({ name: asString(field?.name), type: asString(field?.type) })),
        } : {}),
      })),
    } : {}),
  })) : [];

  const contract: FpgaArchitectureContract = {
    schemaVersion: asString(parsed?.schemaVersion) as FpgaArchitectureContract['schemaVersion'],
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
      ...(Array.isArray(verification?.coversBehaviors) ? { coversBehaviors: asStringArray(verification?.coversBehaviors) } : {}),
      ...(Array.isArray(verification?.actions) ? {
        actions: verification.actions.map((action: any) => ({
          kind: asString(action?.kind) as FpgaArchitectureScenarioAction['kind'],
          ...(asString(action?.signal) ? { signal: asString(action?.signal) } : {}),
          ...(asString(action?.value) ? { value: asString(action?.value) } : {}),
          ...(Number.isFinite(action?.cycles) ? { cycles: Number(action.cycles) } : {}),
          ...(asString(action?.message) ? { message: asString(action?.message) } : {}),
        })),
      } : {}),
    })) : [],
    sourceOrder: asStringArray(parsed?.sourceOrder).map(normalizePath),
  };
  contract.behaviors = Array.isArray(parsed?.behaviors) ? parsed.behaviors.map((behavior: any) => ({
    id: asString(behavior?.id),
    requirement: asString(behavior?.requirement),
    inputs: asStringArray(behavior?.inputs),
    outputs: asStringArray(behavior?.outputs),
    timing: asString(behavior?.timing),
    ...(asString(behavior?.resetBehavior) ? { resetBehavior: asString(behavior?.resetBehavior) } : {}),
    ...(Number.isFinite(behavior?.latencyCycles) ? { latencyCycles: Number(behavior.latencyCycles) } : {}),
    ...(Array.isArray(behavior?.preconditions) ? { preconditions: asStringArray(behavior?.preconditions) } : {}),
  })) : [];
  if (Array.isArray(parsed?.numericFormats)) {
    contract.numericFormats = parsed.numericFormats.map((format: any) => ({
      id: asString(format?.id),
      type: asString(format?.type) as FpgaArchitectureNumericFormatContract['type'],
      width: Number(format?.width),
      integerBits: Number(format?.integerBits),
      fractionalBits: Number(format?.fractionalBits),
      overflow: asString(format?.overflow) as FpgaArchitectureNumericFormatContract['overflow'],
      rounding: asString(format?.rounding) as FpgaArchitectureNumericFormatContract['rounding'],
    }));
  }
  if (Array.isArray(parsed?.instances)) {
    contract.instances = parsed.instances.map((instance: any) => ({
      id: asString(instance?.id),
      parentComponentId: asString(instance?.parentComponentId),
      childComponentId: asString(instance?.childComponentId),
      label: asString(instance?.label),
      genericMap: typeof instance?.genericMap === 'object' && instance.genericMap !== null ? instance.genericMap : {},
      portMap: typeof instance?.portMap === 'object' && instance.portMap !== null ? instance.portMap : {},
    }));
  }
  if (Array.isArray(parsed?.connections)) {
    contract.connections = parsed.connections.map((connection: any) => ({
      id: asString(connection?.id),
      type: asString(connection?.type),
      source: { componentId: asString(connection?.source?.componentId), port: asString(connection?.source?.port) },
      sinks: Array.isArray(connection?.sinks) ? connection.sinks.map((sink: any) => ({ componentId: asString(sink?.componentId), port: asString(sink?.port) })) : [],
      clockDomain: connection?.clockDomain === null ? null : asString(connection?.clockDomain) || null,
      cdc: asString(connection?.cdc) as FpgaArchitectureConnectionContract['cdc'],
      ...(connection?.handshake && typeof connection.handshake === 'object' ? {
        handshake: {
          valid: asString(connection.handshake.valid),
          ready: asString(connection.handshake.ready),
          payload: asStringArray(connection.handshake.payload),
        },
      } : {}),
    }));
  }
  if (Array.isArray(parsed?.stateMachines)) {
    contract.stateMachines = parsed.stateMachines.map((machine: any) => ({
      id: asString(machine?.id),
      componentId: asString(machine?.componentId),
      stateType: asString(machine?.stateType),
      states: asStringArray(machine?.states),
      resetState: asString(machine?.resetState),
      transitions: Array.isArray(machine?.transitions) ? machine.transitions.map((transition: any) => ({
        from: asString(transition?.from),
        event: asString(transition?.event),
        to: asString(transition?.to),
        outputs: asStringArray(transition?.outputs),
      })) : [],
    }));
  }
  if (parsed?.architectureSynthesis && typeof parsed.architectureSynthesis === 'object') {
    contract.architectureSynthesis = {
      sourceMode: asString(parsed.architectureSynthesis.sourceMode) as FpgaArchitectureSynthesisMetadata['sourceMode'],
      synthesisId: asString(parsed.architectureSynthesis.synthesisId),
      primaryPatternId: asString(parsed.architectureSynthesis.primaryPatternId),
      secondaryPatternIds: asStringArray(parsed.architectureSynthesis.secondaryPatternIds),
      ...(Array.isArray(parsed.architectureSynthesis.buildingBlockCatalogIds) ? { buildingBlockCatalogIds: asStringArray(parsed.architectureSynthesis.buildingBlockCatalogIds) } : {}),
      methodologyRuleIds: asStringArray(parsed.architectureSynthesis.methodologyRuleIds),
      referenceDesignIds: asStringArray(parsed.architectureSynthesis.referenceDesignIds),
      evidenceClaimIds: asStringArray(parsed.architectureSynthesis.evidenceClaimIds),
      ...(asString(parsed.architectureSynthesis.retrievalMode) ? { retrievalMode: asString(parsed.architectureSynthesis.retrievalMode) as FpgaArchitectureRetrievalMode } : {}),
      ...(Array.isArray(parsed.architectureSynthesis.retrievedSourceIds) ? { retrievedSourceIds: asStringArray(parsed.architectureSynthesis.retrievedSourceIds) } : {}),
      ...(Array.isArray(parsed.architectureSynthesis.sourceSnapshotIds) ? { sourceSnapshotIds: asStringArray(parsed.architectureSynthesis.sourceSnapshotIds) } : {}),
      ...(Array.isArray(parsed.architectureSynthesis.sourceHashes) ? { sourceHashes: asStringArray(parsed.architectureSynthesis.sourceHashes) } : {}),
      ...(asString(parsed.architectureSynthesis.evidenceFreshness) ? { evidenceFreshness: asString(parsed.architectureSynthesis.evidenceFreshness) } : {}),
      confidence: Number(parsed.architectureSynthesis.confidence),
    };
  }
  if (Array.isArray(parsed?.sourceGroundedRequirements)) {
    contract.sourceGroundedRequirements = parsed.sourceGroundedRequirements.map((requirement: any) => ({
      id: asString(requirement?.id),
      sourceClaimId: asString(requirement?.sourceClaimId),
      appliesTo: asString(requirement?.appliesTo) as FpgaArchitectureSourceGroundedRequirement['appliesTo'],
      requirement: asString(requirement?.requirement),
      ...(asString(requirement?.sourceUrl) ? { sourceUrl: asString(requirement.sourceUrl) } : {}),
      ...(asString(requirement?.sourceHash) ? { sourceHash: asString(requirement.sourceHash) } : {}),
      ...(asString(requirement?.sourceSnapshotId) ? { sourceSnapshotId: asString(requirement.sourceSnapshotId) } : {}),
    }));
  }
  if (Array.isArray(parsed?.outputOwnership)) {
    contract.outputOwnership = parsed.outputOwnership.map((entry: any) => ({
      ruleId: asString(entry?.ruleId),
      signal: asString(entry?.signal),
      ownerComponentId: asString(entry?.ownerComponentId),
      evidence: asString(entry?.evidence),
    }));
  }
  if (Array.isArray(parsed?.signalTimelines)) {
    contract.signalTimelines = parsed.signalTimelines.map((entry: any) => ({
      ruleId: asString(entry?.ruleId),
      signal: asString(entry?.signal),
      ownerComponentId: asString(entry?.ownerComponentId),
      events: Array.isArray(entry?.events)
        ? entry.events.map((event: any) => ({
          at: asString(event?.at),
          value: asString(event?.value),
          evidence: asString(event?.evidence),
        }))
        : [],
    }));
  }
  if (Array.isArray(parsed?.truthTables)) {
    contract.truthTables = parsed.truthTables.map((entry: any) => ({
      ruleId: asString(entry?.ruleId),
      ownerComponentId: asString(entry?.ownerComponentId),
      input: asString(entry?.input),
      rows: Array.isArray(entry?.rows)
        ? entry.rows.map((row: any) => (row && typeof row === 'object' ? Object.fromEntries(Object.entries(row).map(([key, value]) => [key, asString(value)])) : {}))
        : [],
    }));
  }
  if (Array.isArray(parsed?.fsmContracts)) {
    contract.fsmContracts = parsed.fsmContracts.map((entry: any) => ({
      ruleId: asString(entry?.ruleId),
      componentId: asString(entry?.componentId),
      stateType: asString(entry?.stateType),
      resetState: asString(entry?.resetState),
      states: asStringArray(entry?.states),
    }));
  }
  if (Array.isArray(parsed?.verificationDerivation)) {
    contract.verificationDerivation = parsed.verificationDerivation.map((entry: any) => ({
      verificationId: asString(entry?.verificationId),
      derivesFromRuleIds: asStringArray(entry?.derivesFromRuleIds),
    }));
  }
  const parsedIntent = parseIntentObject(parsed?.intent);
  if (parsedIntent) contract.intent = parsedIntent;
  return normalizeFpgaArchitectureContract(contract);
}

export function normalizeFpgaArchitectureContract(contract: FpgaArchitectureContract): FpgaArchitectureContract {
  const normalized: FpgaArchitectureContract = {
    ...contract,
    assumptions: contract.assumptions || [],
    requiredCapabilityIds: contract.requiredCapabilityIds || [],
    components: (contract.components || []).map((component) => ({
      ...component,
      file: normalizePath(component.file),
      implements: component.implements || [],
      dependsOn: component.dependsOn || [],
      children: component.children || [],
      generics: (component.generics || []).map((generic) => ({
        ...generic,
        default: generic.default || defaultGenericValueForType(generic.type),
      })),
      ports: component.ports || [],
      exports: component.exports || [],
      ...(component.implementationSourcePreference ? { implementationSourcePreference: component.implementationSourcePreference } : {}),
      ...(component.kind === 'package' ? { packageSymbols: component.packageSymbols || [] } : {}),
    })),
    clockDomains: contract.clockDomains || [],
    behaviors: contract.behaviors || [],
    verification: contract.verification || [],
    numericFormats: contract.numericFormats || [],
    instances: contract.instances || [],
    connections: contract.connections || [],
    stateMachines: contract.stateMachines || [],
    ...(contract.architectureSynthesis ? {
      architectureSynthesis: {
        ...contract.architectureSynthesis,
        secondaryPatternIds: contract.architectureSynthesis.secondaryPatternIds || [],
        buildingBlockCatalogIds: contract.architectureSynthesis.buildingBlockCatalogIds || [],
        methodologyRuleIds: contract.architectureSynthesis.methodologyRuleIds || [],
        referenceDesignIds: contract.architectureSynthesis.referenceDesignIds || [],
        evidenceClaimIds: contract.architectureSynthesis.evidenceClaimIds || [],
        retrievalMode: contract.architectureSynthesis.retrievalMode || 'off',
        retrievedSourceIds: contract.architectureSynthesis.retrievedSourceIds || [],
        sourceSnapshotIds: contract.architectureSynthesis.sourceSnapshotIds || [],
        sourceHashes: contract.architectureSynthesis.sourceHashes || [],
        evidenceFreshness: contract.architectureSynthesis.evidenceFreshness || 'curated_only',
      },
    } : {}),
    ...(contract.sourceGroundedRequirements ? { sourceGroundedRequirements: contract.sourceGroundedRequirements || [] } : {}),
    ...(contract.outputOwnership ? { outputOwnership: contract.outputOwnership || [] } : {}),
    ...(contract.signalTimelines ? { signalTimelines: contract.signalTimelines || [] } : {}),
    ...(contract.truthTables ? { truthTables: contract.truthTables || [] } : {}),
    ...(contract.fsmContracts ? { fsmContracts: contract.fsmContracts || [] } : {}),
    ...(contract.verificationDerivation ? { verificationDerivation: contract.verificationDerivation || [] } : {}),
    ...(contract.intent ? { intent: contract.intent } : {}),
    ...(contract.clarification ? { clarification: contract.clarification } : {}),
    sourceOrder: (contract.sourceOrder || []).map(normalizePath),
  };

  const expectedOrder = buildNormalizedSourceOrder(normalized.components);
  const expectedSet = new Set(expectedOrder.map((entry) => entry.toLowerCase()));
  const currentOrder = normalized.sourceOrder.filter((entry, index, array) => (
    entry
    && expectedSet.has(entry.toLowerCase())
    && array.findIndex((candidate) => candidate.toLowerCase() === entry.toLowerCase()) === index
  ));
  if (currentOrder.length !== expectedOrder.length) {
    normalized.sourceOrder = expectedOrder;
  } else {
    const packageFiles = new Set(normalized.components.filter((component) => component.kind === 'package').map((component) => normalizePath(component.file).toLowerCase()));
    const testbenchFiles = new Set(normalized.components.filter((component) => component.kind === 'testbench').map((component) => normalizePath(component.file).toLowerCase()));
    const hasPackageAfterDependent = normalized.components.some((component) => (
      component.dependsOn.some((dependencyId) => {
        const dependency = normalized.components.find((candidate) => candidate.id === dependencyId);
        if (!dependency || !packageFiles.has(normalizePath(dependency.file).toLowerCase())) return false;
        return currentOrder.findIndex((file) => file.toLowerCase() === normalizePath(dependency.file).toLowerCase())
          > currentOrder.findIndex((file) => file.toLowerCase() === normalizePath(component.file).toLowerCase());
      })
    ));
    if (hasPackageAfterDependent || !testbenchFiles.has(currentOrder[currentOrder.length - 1]?.toLowerCase())) {
      normalized.sourceOrder = expectedOrder;
    }
  }

  normalizeSafeImplicitOutputConnections(normalized);

  return normalized;
}

export type FpgaArchitectureContractCompletionFix = {
  code: string;
  path: string;
  message: string;
};

export type FpgaArchitectureContractCompletionResult = {
  contract: FpgaArchitectureContract;
  fixes: FpgaArchitectureContractCompletionFix[];
};

function tokenizeContractText(value: string) {
  return new Set(
    String(value || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter((token) => token.length > 1),
  );
}

function overlapScore(left: Set<string>, right: Set<string>) {
  let score = 0;
  for (const token of left) {
    if (right.has(token)) score += 1;
  }
  return score;
}

function inferImplementationKindForCapability(capability: { id: string; description: string }) {
  return classifyCapabilityOwnership(capability);
}

function findBestComponentForCapability(
  components: FpgaArchitectureComponentContract[],
  capability: { id: string; description: string },
) {
  const expectedKind = inferImplementationKindForCapability(capability);
  const capabilityTokens = tokenizeContractText(`${capability.id} ${capability.description}`);
  let best: { component: FpgaArchitectureComponentContract; score: number } | null = null;
  for (const component of components) {
    if (component.kind !== expectedKind) continue;
    const componentTokens = tokenizeContractText([
      component.id,
      component.name,
      component.file,
      component.responsibility,
      component.exports.join(' '),
      component.ports.map((port) => `${port.name} ${port.purpose}`).join(' '),
    ].join(' '));
    const exactBoost = component.id.toLowerCase() === capability.id.toLowerCase()
      || component.name.toLowerCase() === capability.id.toLowerCase()
      || capability.id.toLowerCase().includes(component.id.toLowerCase())
      || component.id.toLowerCase().includes(capability.id.toLowerCase())
      ? 6
      : 0;
    const score = overlapScore(capabilityTokens, componentTokens) + exactBoost;
    if (score > 0 && (!best || score > best.score || component.id.localeCompare(best.component.id) < 0)) {
      best = { component, score };
    }
  }
  if (best) return best.component;
  return components.find((component) => component.kind === expectedKind) || null;
}

function ensureUniqueString(values: string[], value: string) {
  if (!values.some((entry) => entry.toLowerCase() === value.toLowerCase())) values.push(value);
}

function literalForPortType(type: string, preferActive = false) {
  const normalized = normalizeType(type);
  if (/\b(?:std_logic|std_ulogic)\b/.test(normalized) && !/vector/.test(normalized)) return preferActive ? "'1'" : "'0'";
  if (/\b(?:std_logic_vector|std_ulogic_vector|unsigned|signed)\b/.test(normalized)) return "(others => '0')";
  if (/\bboolean\b/.test(normalized)) return preferActive ? 'true' : 'false';
  if (/\bpositive\b/.test(normalized)) return '1';
  if (/\b(?:integer|natural)\b/.test(normalized)) return '0';
  return "(others => '0')";
}

function compatiblePort(parent: FpgaArchitectureComponentContract, childPort: FpgaArchitecturePortContract) {
  const childType = normalizeType(childPort.type);
  const childName = childPort.name.toLowerCase();
  const inputModes = childPort.mode === 'in' ? ['in', 'inout'] : ['out', 'buffer', 'inout'];
  const exactName = parent.ports.find((port) => (
    inputModes.includes(port.mode)
    && port.name.toLowerCase() === childName
    && normalizeType(port.type) === childType
  ));
  if (exactName) return exactName;
  const aliases = childName === 'enable_i' ? ['start_i', 'valid_i']
    : childName === 'start_i' ? ['enable_i', 'valid_i']
    : childName === 'rst_i' || childName === 'reset_i' ? ['rst', 'reset']
    : childName === 'clk_i' || childName === 'clock_i' ? ['clk', 'clock']
    : [];
  for (const alias of aliases) {
    const match = parent.ports.find((port) => (
      inputModes.includes(port.mode)
      && port.name.toLowerCase() === alias
      && normalizeType(port.type) === childType
    ));
    if (match) return match;
  }
  return parent.ports.find((port) => inputModes.includes(port.mode) && normalizeType(port.type) === childType) || null;
}

function isWritablePort(port: FpgaArchitecturePortContract) {
  return port.mode === 'out' || port.mode === 'buffer' || port.mode === 'inout';
}

function isInputLikePort(port: FpgaArchitecturePortContract) {
  return port.mode === 'in' || port.mode === 'inout';
}

function isSafeStatusLikeName(name: string) {
  return /^(?:done|valid|ready|error|status)(?:_o|_out)?$/i.test(name);
}

function stableConnectionId(instanceLabel: string, portName: string, used: Set<string>) {
  const base = stableId(`${instanceLabel}_${portName}`, 'conn');
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate.toLowerCase()) || !isLegalVhdlIdentifier(candidate)) {
    candidate = `${base}_${suffix}`;
    suffix += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function buildCompletedInstance(params: {
  contract: FpgaArchitectureContract;
  parent: FpgaArchitectureComponentContract;
  child: FpgaArchitectureComponentContract;
  existing?: FpgaArchitectureInstanceContract;
  usedConnectionIds: Set<string>;
  usedWritableActuals: Set<string>;
}) {
  const { parent, child, existing } = params;
  const genericMap: Record<string, string> = { ...(existing?.genericMap || {}) };
  const portMap: Record<string, string> = { ...(existing?.portMap || {}) };
  const newConnections: FpgaArchitectureConnectionContract[] = [];

  for (const generic of child.generics) {
    if (!(generic.name in genericMap)) {
      genericMap[generic.name] = generic.default || defaultGenericValueForType(generic.type) || '0';
    }
  }

  for (const childPort of child.ports) {
    if (portMap[childPort.name]) continue;
    const parentPort = compatiblePort(parent, childPort);
    if (parentPort) {
      const candidateActual = parentPort.name;
      if (isWritablePort(childPort)) {
        const key = `${parent.id}:${candidateActual.toLowerCase()}`;
        if (!params.usedWritableActuals.has(key)) {
          portMap[childPort.name] = candidateActual;
          params.usedWritableActuals.add(key);
          continue;
        }
      } else {
        portMap[childPort.name] = candidateActual;
        continue;
      }
    }

    if (parent.kind === 'testbench') {
      portMap[childPort.name] = childPort.name;
      continue;
    }

    if (isInputLikePort(childPort) && !isWritablePort(childPort)) {
      const active = /(?:enable|valid|ready|start)/i.test(childPort.name);
      portMap[childPort.name] = literalForPortType(childPort.type, active);
      continue;
    }

    const connectionId = stableConnectionId(existing?.label || `u_${child.id}`, childPort.name, params.usedConnectionIds);
    portMap[childPort.name] = connectionId;
    newConnections.push({
      id: connectionId,
      type: childPort.type,
      source: { componentId: child.id, port: childPort.name },
      sinks: [],
      clockDomain: parent.clockDomain || child.clockDomain || null,
      cdc: 'none',
    });
  }

  return {
    instance: {
      id: existing?.id || uniqueStableId(`${parent.id}_${child.id}_inst`, 'instance', new Set()),
      parentComponentId: parent.id,
      childComponentId: child.id,
      label: existing?.label || uniqueStableId(`u_${child.id}`, 'u_child', new Set()),
      genericMap,
      portMap,
    },
    newConnections,
  };
}

export function completeFpgaArchitectureContract(params: {
  contract: FpgaArchitectureContract;
  userRequest: string;
}): FpgaArchitectureContractCompletionResult {
  const fixes: FpgaArchitectureContractCompletionFix[] = [];
  const blueprint = inferFpgaArchitectureBlueprintFromPrompt(params.userRequest);
  const expectedCapabilities = requiredCapabilitiesForBlueprint(blueprint);
  const contract = normalizeFpgaArchitectureContract({
    ...params.contract,
    components: params.contract.components.map((component) => ({ ...component })),
  });
  const componentById = new Map(contract.components.map((component) => [component.id, component]));

  for (const capability of expectedCapabilities) {
    if (!contract.requiredCapabilityIds.includes(capability.id)) {
      contract.requiredCapabilityIds.push(capability.id);
      fixes.push({
        code: 'contract_completion_required_capability_added',
        path: '$.requiredCapabilityIds',
        message: `Restored app-owned required capability "${capability.id}".`,
      });
    }
    if (!contract.components.some((component) => component.implements.includes(capability.id))) {
      const owner = findBestComponentForCapability(contract.components, capability);
      if (owner) {
        ensureUniqueString(owner.implements, capability.id);
        fixes.push({
          code: 'contract_completion_capability_owner_added',
          path: `$.components.${owner.id}.implements`,
          message: `Assigned capability "${capability.id}" to existing ${owner.kind} component "${owner.id}".`,
        });
      }
    }
  }

  const top = contract.components.find((component) => component.kind === 'top' && component.name === contract.topEntity)
    || contract.components.find((component) => component.kind === 'top');
  const testbench = contract.components.find((component) => component.kind === 'testbench' && component.name === contract.topTestbench)
    || contract.components.find((component) => component.kind === 'testbench');
  if (top) {
    for (const rtl of contract.components.filter((component) => component.kind === 'rtl')) {
      if (!top.children.includes(rtl.id)) {
        top.children.push(rtl.id);
        fixes.push({
          code: 'contract_completion_top_child_added',
          path: `$.components.${top.id}.children`,
          message: `Connected RTL component "${rtl.id}" under top component "${top.id}".`,
        });
      }
      if (!top.dependsOn.includes(rtl.id)) top.dependsOn.push(rtl.id);
    }
  }
  if (testbench && top) {
    if (testbench.children.length !== 1 || testbench.children[0] !== top.id) {
      testbench.children = [top.id];
      fixes.push({
        code: 'contract_completion_testbench_child_repaired',
        path: `$.components.${testbench.id}.children`,
        message: `Made the testbench instantiate only approved top "${top.id}".`,
      });
    }
    ensureUniqueString(testbench.dependsOn, top.id);
  }

  contract.verification = contract.verification.length > 0 ? contract.verification : [{
    id: `verify_${stableId(contract.designName, 'design')}_contract`,
    requirement: 'Self-check the app-owned architecture contract with deterministic stimulus and expected observable outputs.',
    stimulus: 'Drive reset and one deterministic scenario.',
    expected: 'DUT outputs match the app-owned contract.',
    observables: top?.ports.filter(isWritablePort).map((port) => port.name) || [],
    covers: [],
    coversBehaviors: [],
    actions: [{ kind: 'finish', message: 'TEST PASSED' }],
  }];
  const primaryVerification = contract.verification[0];
  for (const capability of expectedCapabilities) {
    if (!contract.verification.some((verification) => verification.covers.includes(capability.id))) {
      ensureUniqueString(primaryVerification.covers, capability.id);
      fixes.push({
        code: 'contract_completion_capability_verification_added',
        path: `$.verification.${primaryVerification.id}.covers`,
        message: `Covered required capability "${capability.id}" in deterministic verification.`,
      });
    }
  }

  for (const behavior of contract.behaviors) {
    if (!behavior.resetBehavior) behavior.resetBehavior = 'Reset drives all observable outputs to their safe default values.';
    if (!Number.isInteger(behavior.latencyCycles) || Number(behavior.latencyCycles) < 0) behavior.latencyCycles = 0;
    behavior.preconditions = behavior.preconditions || [];
    if (!contract.verification.some((verification) => verification.coversBehaviors?.includes(behavior.id))) {
      primaryVerification.coversBehaviors = primaryVerification.coversBehaviors || [];
      ensureUniqueString(primaryVerification.coversBehaviors, behavior.id);
      fixes.push({
        code: 'contract_completion_behavior_verification_added',
        path: `$.verification.${primaryVerification.id}.coversBehaviors`,
        message: `Covered behavior "${behavior.id}" in deterministic verification.`,
      });
    }
  }

  if (top) {
    for (const output of top.ports.filter(isWritablePort)) {
      if (!isSafeStatusLikeName(output.name)) continue;
      if (!contract.behaviors.some((behavior) => behavior.outputs.map((name) => name.toLowerCase()).includes(output.name.toLowerCase()))) {
        contract.behaviors.push({
          id: `behavior_${stableId(output.name, 'status_output')}`,
          requirement: `Top status/control output ${output.name} is explicitly driven by the integration contract.`,
          inputs: top.ports.filter((port) => port.mode === 'in').map((port) => port.name).slice(0, 4),
          outputs: [output.name],
          timing: 'Driven to a safe reset value and a deterministic nominal value inside the bounded verification window.',
          resetBehavior: `${output.name} resets to ${literalForPortType(output.type)}.`,
          latencyCycles: 1,
          preconditions: ['rst is asserted before nominal stimulus.'],
        });
        fixes.push({
          code: 'contract_completion_status_behavior_added',
          path: '$.behaviors',
          message: `Added app-owned top status output behavior for "${output.name}".`,
        });
      }
      if (!primaryVerification.observables.some((name) => name.toLowerCase() === output.name.toLowerCase())) {
        primaryVerification.observables.push(output.name);
      }
    }
  }

  const existingInstances = contract.instances || [];
  const completedInstances: FpgaArchitectureInstanceContract[] = [];
  const usedInstanceEdges = new Set<string>();
  const usedConnectionIds = new Set((contract.connections || []).map((connection) => connection.id.toLowerCase()));
  const usedWritableActuals = new Set<string>();
  const connectionAdditions: FpgaArchitectureConnectionContract[] = [];
  for (const parent of contract.components) {
    for (const childId of parent.children) {
      const child = componentById.get(childId);
      if (!child) continue;
      const edgeKey = `${parent.id}->${child.id}`;
      if (usedInstanceEdges.has(edgeKey)) continue;
      usedInstanceEdges.add(edgeKey);
      const existing = existingInstances.find((instance) => instance.parentComponentId === parent.id && instance.childComponentId === child.id);
      const completed = buildCompletedInstance({
        contract,
        parent,
        child,
        existing,
        usedConnectionIds,
        usedWritableActuals,
      });
      completedInstances.push(completed.instance);
      connectionAdditions.push(...completed.newConnections);
      if (!existing || Object.keys(completed.instance.genericMap).length !== Object.keys(existing.genericMap || {}).length || Object.keys(completed.instance.portMap).length !== Object.keys(existing.portMap || {}).length) {
        fixes.push({
          code: 'contract_completion_instance_map_completed',
          path: '$.instances',
          message: `Completed hierarchy instance map for "${parent.id}" -> "${child.id}".`,
        });
      }
    }
  }
  contract.instances = [
    ...completedInstances,
    ...existingInstances.filter((instance) => !usedInstanceEdges.has(`${instance.parentComponentId}->${instance.childComponentId}`)),
  ];
  contract.connections = [...(contract.connections || []), ...connectionAdditions];
  contract.sourceOrder = buildNormalizedSourceOrder(contract.components);

  return {
    contract: normalizeFpgaArchitectureContract(contract),
    fixes,
  };
}

function normalizeSafeImplicitOutputConnections(contract: FpgaArchitectureContract) {
  if (contract.schemaVersion !== '2.0') return;
  const componentById = new Map(contract.components.map((component) => [component.id, component]));
  const connections = contract.connections || [];
  contract.connections = connections;
  const connectionIds = new Set(connections.map((connection) => connection.id.toLowerCase()));

  for (const instance of contract.instances || []) {
    const parent = componentById.get(instance.parentComponentId);
    const child = componentById.get(instance.childComponentId);
    if (!parent || !child) continue;
    const parentPorts = new Set(parent.ports.map((port) => port.name.toLowerCase()));
    for (const childPort of child.ports) {
      if (!['out', 'inout', 'buffer'].includes(childPort.mode)) continue;
      const actual = String(instance.portMap?.[childPort.name] || '').trim();
      if (!VHDL_IDENTIFIER.test(actual)) continue;
      const actualKey = actual.toLowerCase();
      if (parentPorts.has(actualKey) || connectionIds.has(actualKey)) continue;
      if (parent.kind === 'testbench' && actualKey === childPort.name.toLowerCase()) continue;
      connections.push({
        id: actual,
        type: childPort.type,
        source: { componentId: child.id, port: childPort.name },
        sinks: [],
        clockDomain: parent.clockDomain || child.clockDomain || null,
        cdc: 'none',
      });
      connectionIds.add(actualKey);
    }
  }
}

export function validateFpgaArchitectureContract(params: {
  contract: FpgaArchitectureContract;
  userRequest: string;
}): FpgaArchitectureContractValidation {
  const { contract } = params;
  const blueprint = inferFpgaArchitectureBlueprintFromPrompt(params.userRequest);
  const expectedCapabilities = requiredCapabilitiesForBlueprint(blueprint).map((entry) => entry.id);
  const issues: FpgaArchitectureContractIssue[] = [];

  if (!['1.0', '2.0'].includes(contract.schemaVersion)) {
    pushIssue(issues, 'architecture_contract_schema_version', '$.schemaVersion', 'schemaVersion must be "1.0" or "2.0". New contracts must use "2.0".');
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
  if (contract.architectureSynthesis) {
    const synthesis = contract.architectureSynthesis;
    if (synthesis.sourceMode !== 'curated_first_hybrid') {
      pushIssue(issues, 'architecture_contract_synthesis_source_mode', '$.architectureSynthesis.sourceMode', 'architectureSynthesis.sourceMode must remain "curated_first_hybrid".');
    }
    if (!synthesis.synthesisId || !synthesis.primaryPatternId) {
      pushIssue(issues, 'architecture_contract_synthesis_incomplete', '$.architectureSynthesis', 'architectureSynthesis must include synthesisId and primaryPatternId.');
    }
    if (!Array.isArray(synthesis.evidenceClaimIds) || synthesis.evidenceClaimIds.length === 0) {
      pushIssue(issues, 'architecture_contract_synthesis_claims_missing', '$.architectureSynthesis.evidenceClaimIds', 'Curated architecture synthesis must preserve at least one evidence claim id.');
    }
    if (synthesis.retrievalMode && !['off', 'official_live_opt_in', 'official_live_cached'].includes(synthesis.retrievalMode)) {
      pushIssue(issues, 'architecture_evidence_retrieval_mode', '$.architectureSynthesis.retrievalMode', 'Architecture evidence retrieval mode must be off, official_live_opt_in, or official_live_cached.');
    }
    for (const [index, sourceHash] of (synthesis.sourceHashes || []).entries()) {
      if (!/^[a-f0-9]{64}$/i.test(sourceHash)) {
        pushIssue(issues, 'architecture_evidence_snapshot_invalid', `$.architectureSynthesis.sourceHashes[${index}]`, 'Architecture evidence source hash must be a SHA-256 hex digest.');
      }
    }
  }
  if (contract.sourceGroundedRequirements?.length) {
    const evidenceClaimIds = new Set((contract.architectureSynthesis?.evidenceClaimIds || []).map((claimId) => claimId.toLowerCase()));
    for (const [index, requirement] of contract.sourceGroundedRequirements.entries()) {
      const requirementPath = `$.sourceGroundedRequirements[${index}]`;
      if (!isLegalVhdlIdentifier(requirement.id)) {
        pushIssue(issues, 'architecture_contract_source_requirement_id', `${requirementPath}.id`, 'Source-grounded requirement id must be a legal basic identifier.');
      }
      if (!requirement.requirement || PLACEHOLDER_PATTERN.test(requirement.requirement)) {
        pushIssue(issues, 'architecture_contract_source_requirement_text', `${requirementPath}.requirement`, 'Source-grounded requirement must be precise and must not contain placeholders.');
      }
      if (![
        'architecture',
        'hierarchy',
        'clock_reset',
        'interface',
        'numeric',
        'memory',
        'verification',
        'tool_flow',
        'reference_design',
      ].includes(requirement.appliesTo)) {
        pushIssue(issues, 'architecture_contract_source_requirement_scope', `${requirementPath}.appliesTo`, 'Source-grounded requirement appliesTo must use an approved scope.');
      }
      if (!requirement.sourceClaimId || !evidenceClaimIds.has(requirement.sourceClaimId.toLowerCase())) {
        pushIssue(issues, 'architecture_contract_source_requirement_claim_missing', `${requirementPath}.sourceClaimId`, `Source-grounded requirement must reference one architectureSynthesis.evidenceClaimIds entry, not "${requirement.sourceClaimId}".`);
      }
      if (requirement.sourceUrl && !isApprovedFpgaArchitectureEvidenceUrl(requirement.sourceUrl)) {
        pushIssue(issues, 'architecture_evidence_source_unapproved', `${requirementPath}.sourceUrl`, `Source-grounded requirement sourceUrl must be an approved official FPGA/vendor/tool source, not "${requirement.sourceUrl}".`);
      }
      if (requirement.sourceHash && !/^[a-f0-9]{64}$/i.test(requirement.sourceHash)) {
        pushIssue(issues, 'architecture_evidence_snapshot_invalid', `${requirementPath}.sourceHash`, 'Source-grounded requirement sourceHash must be a SHA-256 hex digest.');
      }
      if (requirement.sourceSnapshotId && !/^snapshot_[a-z0-9_]+_[a-f0-9]{12}$/i.test(requirement.sourceSnapshotId)) {
        pushIssue(issues, 'architecture_evidence_snapshot_invalid', `${requirementPath}.sourceSnapshotId`, 'Source-grounded requirement sourceSnapshotId must match a cached architecture evidence snapshot id.');
      }
    }
  }

  const requiredSet = new Set(contract.requiredCapabilityIds);
  const capabilityOwnership = new Map(requiredCapabilitiesForBlueprint(blueprint).map((capability) => [
    capability.id,
    classifyCapabilityOwnership(capability),
  ]));
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
    const componentIdentityText = `${component.id} ${component.name} ${component.file}`.toLowerCase();
    if (component.kind === 'rtl' && /\b(?:tb|testbench)\b|(?:^|_)tb_|_testbench(?:_|\.|$)|(?:^|\/)tb\//i.test(componentIdentityText)) {
      pushIssue(issues, 'architecture_contract_rtl_testbench_identity', componentPath, 'RTL components must not be named or filed as testbenches. Self-checking testbench behavior belongs only to the single testbench component.');
    }
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
      const expectedOwner = capabilityOwnership.get(capability);
      const dangerousOwnerDrift = Boolean(expectedOwner) && (
        (expectedOwner === 'testbench' && component.kind !== 'testbench')
        || (expectedOwner === 'package' && component.kind === 'rtl')
        || (expectedOwner === 'top' && component.kind === 'rtl')
      );
      if (dangerousOwnerDrift) {
        pushIssue(
          issues,
          'architecture_contract_capability_owner_kind',
          `${componentPath}.implements`,
          `Capability "${capability}" is a ${expectedOwner} capability and cannot be implemented by a ${component.kind} component.`,
        );
      }
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

  if (contract.schemaVersion === '2.0') {
    const instances = contract.instances || [];
    const connections = contract.connections || [];
    const numericFormats = contract.numericFormats || [];
    const stateMachines = contract.stateMachines || [];
    const behaviorIds = new Set(contract.behaviors.map((behavior) => behavior.id));
    const connectionById = new Map(connections.map((connection) => [connection.id.toLowerCase(), connection]));

    for (const [index, component] of contract.components.entries()) {
      if (component.kind === 'package') {
        const symbols = component.packageSymbols || [];
        const symbolNames = new Set(symbols.map((symbol) => symbol.name.toLowerCase()));
        for (const exportName of component.exports) {
          if (!symbolNames.has(exportName.toLowerCase())) {
            pushIssue(issues, 'architecture_contract_package_symbol_missing', `$.components[${index}].packageSymbols`, `Package export "${exportName}" requires one exact packageSymbols declaration.`);
          }
        }
        for (const [symbolIndex, symbol] of symbols.entries()) {
          const symbolPath = `$.components[${index}].packageSymbols[${symbolIndex}]`;
          if (!isLegalVhdlIdentifier(symbol.name) || !symbol.type) pushIssue(issues, 'architecture_contract_package_symbol_invalid', symbolPath, 'Package symbols require a legal name and exact VHDL type/declaration contract.');
          if (symbol.kind === 'enum' && (!symbol.literals || symbol.literals.length === 0)) pushIssue(issues, 'architecture_contract_enum_literals_missing', symbolPath, 'Enum package symbols require exact literals.');
          if (symbol.kind === 'record' && (!symbol.fields || symbol.fields.length === 0)) pushIssue(issues, 'architecture_contract_record_fields_missing', symbolPath, 'Record package symbols require exact field names and types.');
        }
      }
      for (const childId of component.children) {
        const matches = instances.filter((instance) => instance.parentComponentId === component.id && instance.childComponentId === childId);
        if (matches.length !== 1) pushIssue(issues, 'architecture_contract_instance_missing', '$.instances', `Hierarchy edge "${component.id}" -> "${childId}" requires exactly one instance contract.`);
      }
    }

    for (const [index, instance] of instances.entries()) {
      const instancePath = `$.instances[${index}]`;
      const parent = componentById.get(instance.parentComponentId);
      const child = componentById.get(instance.childComponentId);
      if (!parent || !child) {
        pushIssue(issues, 'architecture_contract_instance_component_missing', instancePath, 'Instance parent and child must reference declared components.');
        continue;
      }
      if (!parent.children.includes(child.id)) pushIssue(issues, 'architecture_contract_instance_hierarchy_drift', instancePath, `Instance child "${child.id}" is not declared in parent.children.`);
      if (!isLegalVhdlIdentifier(instance.label)) pushIssue(issues, 'architecture_contract_instance_label', `${instancePath}.label`, 'Instance label must be a legal basic VHDL identifier.');
      for (const generic of child.generics) {
        if (!(generic.name in instance.genericMap)) pushIssue(issues, 'architecture_contract_instance_generic_missing', `${instancePath}.genericMap`, `Instance is missing named generic association "${generic.name}".`);
      }
      for (const port of child.ports) {
        if (!(port.name in instance.portMap)) pushIssue(issues, 'architecture_contract_instance_port_missing', `${instancePath}.portMap`, `Instance is missing named port association "${port.name}".`);
      }
      for (const name of Object.keys(instance.genericMap)) {
        if (!child.generics.some((generic) => generic.name.toLowerCase() === name.toLowerCase())) pushIssue(issues, 'architecture_contract_instance_generic_unknown', `${instancePath}.genericMap`, `Unknown child generic "${name}".`);
      }
      for (const name of Object.keys(instance.portMap)) {
        if (!child.ports.some((port) => port.name.toLowerCase() === name.toLowerCase())) pushIssue(issues, 'architecture_contract_instance_port_unknown', `${instancePath}.portMap`, `Unknown child port "${name}".`);
      }
      const parentPorts = new Map(parent.ports.map((port) => [port.name.toLowerCase(), port]));
      for (const childPort of child.ports) {
        const actual = String(instance.portMap[childPort.name] || '').trim();
        if (!actual) continue;
        const simpleActual = VHDL_IDENTIFIER.test(actual) ? actual.toLowerCase() : null;
        const parentPort = simpleActual ? parentPorts.get(simpleActual) : null;
        const connection = simpleActual ? connectionById.get(simpleActual) : null;
        const testbenchSignal = parent.kind === 'testbench' && simpleActual === childPort.name.toLowerCase();
        const literalOrAggregate = /^(?:open|'[^']'|"[^"]*"|\([^;]+\)|(?:true|false|\d+))$/i.test(actual);
        if (!parentPort && !connection && !testbenchSignal && !literalOrAggregate) {
          pushIssue(issues, 'architecture_contract_instance_actual_unknown', `${instancePath}.portMap.${childPort.name}`, `Port actual "${actual}" must be a parent port, declared connection id, testbench DUT signal, literal, aggregate, or open.`);
        }
        if (['out', 'inout', 'buffer'].includes(childPort.mode) && (!simpleActual || (!parentPort && !connection && !testbenchSignal))) {
          pushIssue(issues, 'architecture_contract_instance_output_actual_invalid', `${instancePath}.portMap.${childPort.name}`, `Output/inout port "${childPort.name}" requires one writable named signal actual, not "${actual}".`);
        }
        const actualType = parentPort?.type || connection?.type || (testbenchSignal ? childPort.type : null);
        if (actualType && normalizeType(actualType) !== normalizeType(childPort.type)) {
          pushIssue(issues, 'architecture_contract_instance_actual_type_mismatch', `${instancePath}.portMap.${childPort.name}`, `Actual "${actual}" has type "${actualType}" but child port "${childPort.name}" requires "${childPort.type}".`);
        }
      }
    }

    if (top) {
      const topOutputPorts = top.ports.filter((port) => ['out', 'buffer', 'inout'].includes(port.mode));
      const behaviorOutputs = new Set(contract.behaviors.flatMap((behavior) => behavior.outputs || []).map((name) => name.toLowerCase()));
      const verificationObservables = new Set(contract.verification.flatMap((verification) => verification.observables || []).map((name) => name.toLowerCase()));
      const childDrivenTopActuals = new Set<string>();
      for (const instance of instances.filter((entry) => entry.parentComponentId === top.id)) {
        const child = componentById.get(instance.childComponentId);
        if (!child) continue;
        for (const childPort of child.ports) {
          if (!['out', 'buffer', 'inout'].includes(childPort.mode)) continue;
          const actual = String(instance.portMap[childPort.name] || '').trim();
          if (VHDL_IDENTIFIER.test(actual)) childDrivenTopActuals.add(actual.toLowerCase());
        }
      }
      const legalChildSources = instances
        .filter((entry) => entry.parentComponentId === top.id)
        .flatMap((entry) => {
          const child = componentById.get(entry.childComponentId);
          return child
            ? child.ports
              .filter((port) => ['out', 'buffer', 'inout'].includes(port.mode))
              .map((port) => `${child.id}.${port.name}`)
            : [];
        });
      for (const outputPort of topOutputPorts) {
        const outputName = outputPort.name.toLowerCase();
        if (childDrivenTopActuals.has(outputName) || behaviorOutputs.has(outputName) || verificationObservables.has(outputName)) {
          continue;
        }
        pushIssue(
          issues,
          'architecture_contract_output_driver_missing',
          `$.components.${top.id}.ports.${outputPort.name}`,
          `Top output "${outputPort.name}" must have an explicit owner: map it from a child output, or define app-owned behavior/verification for it. Legal child output sources: ${legalChildSources.join(', ') || 'none'}.`,
        );
      }
    }

    const getPort = (endpoint: FpgaArchitectureConnectionEndpoint) => componentById.get(endpoint.componentId)?.ports.find((port) => port.name.toLowerCase() === endpoint.port.toLowerCase());
    for (const [index, connection] of connections.entries()) {
      const connectionPath = `$.connections[${index}]`;
      const sourcePort = getPort(connection.source);
      if (!sourcePort) pushIssue(issues, 'architecture_contract_connection_source_missing', `${connectionPath}.source`, 'Connection source must reference a declared component port.');
      if (sourcePort && normalizeType(sourcePort.type) !== normalizeType(connection.type)) pushIssue(issues, 'architecture_contract_connection_source_type', connectionPath, `Connection type must match source port type "${sourcePort.type}".`);
      if (sourcePort && !['out', 'inout', 'buffer'].includes(sourcePort.mode)) pushIssue(issues, 'architecture_contract_connection_source_direction', `${connectionPath}.source`, `Connection source port "${connection.source.port}" must be out, inout, or buffer.`);
      for (const sink of connection.sinks) {
        const sinkPort = getPort(sink);
        if (!sinkPort) pushIssue(issues, 'architecture_contract_connection_sink_missing', `${connectionPath}.sinks`, `Connection sink "${sink.componentId}.${sink.port}" does not exist.`);
        if (sinkPort && normalizeType(sinkPort.type) !== normalizeType(connection.type)) pushIssue(issues, 'architecture_contract_connection_sink_type', connectionPath, `Connection type must match sink port type "${sinkPort.type}".`);
        if (sinkPort && !['in', 'inout'].includes(sinkPort.mode)) pushIssue(issues, 'architecture_contract_connection_sink_direction', `${connectionPath}.sinks`, `Connection sink port "${sink.port}" must be in or inout.`);
        const sinkDomain = componentById.get(sink.componentId)?.clockDomain || null;
        const sourceDomain = componentById.get(connection.source.componentId)?.clockDomain || null;
        if (sourceDomain !== sinkDomain && connection.cdc === 'none') pushIssue(issues, 'architecture_contract_connection_cdc_missing', connectionPath, `Cross-domain connection "${connection.id}" requires an explicit CDC strategy.`);
      }
      if (!['none', 'synchronizer', 'async_fifo', 'handshake'].includes(connection.cdc)) pushIssue(issues, 'architecture_contract_connection_cdc', `${connectionPath}.cdc`, 'Every connection requires an explicit CDC policy.');
    }

    for (const [index, format] of numericFormats.entries()) {
      if (!isLegalVhdlIdentifier(format.id) || !['unsigned', 'signed', 'sfixed', 'ufixed'].includes(format.type) || !Number.isInteger(format.width) || format.width < 1 || format.integerBits < 0 || format.fractionalBits < 0 || format.integerBits + format.fractionalBits !== format.width) {
        pushIssue(issues, 'architecture_contract_numeric_format_invalid', `$.numericFormats[${index}]`, 'Numeric format requires a legal id, supported type, positive width, and integerBits + fractionalBits equal to width.');
      }
    }

    for (const [index, machine] of stateMachines.entries()) {
      const machinePath = `$.stateMachines[${index}]`;
      const states = new Set(machine.states);
      if (!componentById.has(machine.componentId) || !machine.stateType || states.size === 0 || !states.has(machine.resetState)) pushIssue(issues, 'architecture_contract_state_machine_invalid', machinePath, 'State machine requires an owning component, state type, states, and a reset state in that state set.');
      for (const transition of machine.transitions) {
        if (!states.has(transition.from) || !states.has(transition.to) || !transition.event) pushIssue(issues, 'architecture_contract_state_transition_invalid', `${machinePath}.transitions`, 'Every transition requires declared from/to states and a precise event.');
      }
    }

    for (const [index, behavior] of contract.behaviors.entries()) {
      if (!behavior.resetBehavior || !Number.isInteger(behavior.latencyCycles) || Number(behavior.latencyCycles) < 0) pushIssue(issues, 'architecture_contract_behavior_timing_incomplete', `$.behaviors[${index}]`, 'Contract V2 behaviors require exact resetBehavior and non-negative integer latencyCycles.');
      if (isAmbiguousContractText([behavior.requirement, behavior.timing, behavior.resetBehavior || '', ...(behavior.preconditions || [])].join(' '))) {
        pushIssue(issues, 'architecture_contract_timeline_ambiguous', `$.behaviors[${index}]`, 'Behavior timing/reset/preconditions must be exact and bounded; do not use vague wording such as eventually, as needed, or implementation-defined.');
      }
    }
    for (const [index, verification] of contract.verification.entries()) {
      if (!verification.actions || verification.actions.length === 0) pushIssue(issues, 'architecture_contract_scenario_actions_missing', `$.verification[${index}].actions`, 'Contract V2 verification requires executable scenario actions.');
      if (isAmbiguousContractText([verification.requirement, verification.stimulus, verification.expected].join(' '))) {
        pushIssue(issues, 'architecture_contract_verification_not_derived', `$.verification[${index}]`, 'Verification must be derived from exact contract rules and must not use vague timing or expected behavior.');
      }
      for (const behaviorId of verification.coversBehaviors || []) {
        if (!behaviorIds.has(behaviorId)) pushIssue(issues, 'architecture_contract_behavior_coverage_unknown', `$.verification[${index}].coversBehaviors`, `Unknown behavior id "${behaviorId}".`);
      }
      for (const [actionIndex, action] of (verification.actions || []).entries()) {
        const actionPath = `$.verification[${index}].actions[${actionIndex}]`;
        const port = action.signal ? top?.ports.find((candidate) => candidate.name.toLowerCase() === action.signal?.toLowerCase()) : null;
        if (action.signal && !port) pushIssue(issues, 'architecture_contract_scenario_signal_unknown', `${actionPath}.signal`, `Scenario action references unknown top-level signal "${action.signal}".`);
        if (action.kind === 'drive' && port && !['in', 'inout'].includes(port.mode)) pushIssue(issues, 'architecture_contract_scenario_drive_direction', actionPath, `Scenario cannot drive DUT output "${port.name}".`);
        if (['expect', 'expect_stable'].includes(action.kind) && port && !['out', 'inout', 'buffer'].includes(port.mode)) pushIssue(issues, 'architecture_contract_scenario_expect_direction', actionPath, `Scenario must check a DUT-driven output, not input "${port.name}".`);
        if (action.kind === 'wait_cycles' && (!Number.isInteger(action.cycles) || Number(action.cycles) < 1)) pushIssue(issues, 'architecture_contract_scenario_wait_invalid', actionPath, 'wait_cycles requires a positive integer cycles value.');
      }
    }
    for (const behavior of contract.behaviors) {
      if (!contract.verification.some((verification) => verification.coversBehaviors?.includes(behavior.id))) pushIssue(issues, 'architecture_contract_behavior_unverified', '$.verification', `No verification scenario covers behavior "${behavior.id}".`);
    }

    const topOutputNames = new Set((top?.ports || [])
      .filter((port) => ['out', 'buffer', 'inout'].includes(port.mode))
      .map((port) => port.name.toLowerCase()));
    const outputOwnershipSignals = new Set((contract.outputOwnership || []).map((entry) => entry.signal.toLowerCase()));
    for (const entry of contract.outputOwnership || []) {
      if (!entry.ruleId || !isLegalVhdlIdentifier(entry.ruleId)) pushIssue(issues, 'architecture_contract_output_owner_missing', '$.outputOwnership', 'Output ownership entries require legal ruleId values.');
      if (!entry.signal || !topOutputNames.has(entry.signal.toLowerCase())) pushIssue(issues, 'architecture_contract_output_owner_missing', '$.outputOwnership', `Output ownership signal "${entry.signal}" must name a declared top output.`);
      if (!componentById.has(entry.ownerComponentId)) pushIssue(issues, 'architecture_contract_output_owner_missing', '$.outputOwnership', `Output ownership owner "${entry.ownerComponentId}" must name a declared component.`);
      if (!entry.evidence || isAmbiguousContractText(entry.evidence)) pushIssue(issues, 'architecture_contract_output_owner_missing', '$.outputOwnership', 'Output ownership evidence must be precise and source-grounded.');
    }
    for (const outputName of topOutputNames) {
      const behaviorOwnsOutput = contract.behaviors.some((behavior) => behavior.outputs.map((entry) => entry.toLowerCase()).includes(outputName));
      if (!outputOwnershipSignals.has(outputName) && !behaviorOwnsOutput) {
        pushIssue(issues, 'architecture_contract_output_owner_missing', '$.outputOwnership', `Top output "${outputName}" requires outputOwnership or a behavior output rule before VHDL generation.`);
      }
    }
    const knownRuleIds = new Set([
      ...contract.behaviors.map((behavior) => behavior.id),
      ...(contract.outputOwnership || []).map((entry) => entry.ruleId),
      ...(contract.signalTimelines || []).map((entry) => entry.ruleId),
      ...(contract.truthTables || []).map((entry) => entry.ruleId),
      ...(contract.fsmContracts || []).map((entry) => entry.ruleId),
    ].filter(Boolean));
    for (const [index, timeline] of (contract.signalTimelines || []).entries()) {
      if (!timeline.ruleId || !timeline.signal || !componentById.has(timeline.ownerComponentId) || timeline.events.length === 0) {
        pushIssue(issues, 'architecture_contract_timeline_ambiguous', `$.signalTimelines[${index}]`, 'Signal timeline rules require ruleId, signal, ownerComponentId, and at least one exact event.');
      }
      for (const [eventIndex, event] of timeline.events.entries()) {
        if (!event.at || !event.value || !event.evidence || isAmbiguousContractText(`${event.at} ${event.value} ${event.evidence}`)) {
          pushIssue(issues, 'architecture_contract_timeline_ambiguous', `$.signalTimelines[${index}].events[${eventIndex}]`, 'Signal timeline events require exact time/condition, value, and evidence.');
        }
      }
    }
    const verificationIds = new Set(contract.verification.map((verification) => verification.id));
    for (const [index, derivation] of (contract.verificationDerivation || []).entries()) {
      if (!verificationIds.has(derivation.verificationId)) {
        pushIssue(issues, 'architecture_contract_verification_not_derived', `$.verificationDerivation[${index}].verificationId`, `Verification derivation references unknown verification "${derivation.verificationId}".`);
      }
      if (derivation.derivesFromRuleIds.length === 0) {
        pushIssue(issues, 'architecture_contract_verification_not_derived', `$.verificationDerivation[${index}].derivesFromRuleIds`, 'Verification derivation must reference at least one behavior or behavior-rule id.');
      }
      for (const ruleId of derivation.derivesFromRuleIds) {
        if (!knownRuleIds.has(ruleId)) {
          pushIssue(issues, 'architecture_contract_verification_not_derived', `$.verificationDerivation[${index}].derivesFromRuleIds`, `Verification derives from unknown rule "${ruleId}".`);
        }
      }
    }
  }

  if (PLACEHOLDER_PATTERN.test(JSON.stringify(contract))) {
    pushIssue(issues, 'architecture_contract_placeholder', '$', 'Architecture contract contains a placeholder/TBD/TODO value.');
  }

  return { ok: issues.length === 0, issues };
}

function canonicalizeJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonicalizeJson(child)]));
  }
  return value;
}

export function canonicalizeFpgaArchitectureContract(contract: FpgaArchitectureContract) {
  return JSON.stringify(canonicalizeJson(contract));
}

export function hashFpgaArchitectureContract(contract: FpgaArchitectureContract) {
  return createHash('sha256').update(canonicalizeFpgaArchitectureContract(contract)).digest('hex');
}

export function migrateFpgaArchitectureContractToV2(contract: FpgaArchitectureContract): FpgaArchitectureContract {
  if (contract.schemaVersion === '2.0') return contract;
  return {
    ...contract,
    schemaVersion: '2.0',
    components: contract.components.map((component) => ({
      ...component,
      ...(component.kind === 'package' ? {
        packageSymbols: component.exports.map((name) => ({ name, kind: 'subtype' as const, type: name })),
      } : {}),
    })),
    behaviors: contract.behaviors.map((behavior) => ({ ...behavior, resetBehavior: 'Preserve the V1 documented reset behavior.', latencyCycles: 0, preconditions: [] })),
    verification: contract.verification.map((verification) => ({
      ...verification,
      coversBehaviors: contract.behaviors.map((behavior) => behavior.id),
      actions: [{ kind: 'finish' as const, message: 'Migrated V1 scenario requires review before generation.' }],
    })),
    numericFormats: [],
    instances: contract.components.flatMap((parent) => parent.children.map((childComponentId, index) => ({
      id: `${parent.id}_${childComponentId}_${index + 1}`,
      parentComponentId: parent.id,
      childComponentId,
      label: `u_${childComponentId}_${index + 1}`,
      genericMap: {},
      portMap: {},
    }))),
    connections: [],
    stateMachines: [],
  };
}

export function parseAndValidateFpgaArchitectureContract(params: {
  text: string;
  userRequest: string;
}) {
  const parsedContract = parseFpgaArchitectureContract(params.text);
  const completion = completeFpgaArchitectureContract({
    contract: parsedContract,
    userRequest: params.userRequest,
  });
  const contract = completion.contract;
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
  projectPath?: string | null;
  architectureRetrievalMode?: FpgaArchitectureRetrievalMode;
  signal?: AbortSignal;
  missingBlockFetchText?: (url: string, signal?: AbortSignal) => Promise<string>;
  runModelAnalysis: (params: {
    ai: any;
    provider: any;
    model: string;
    prompt: string;
    signal?: AbortSignal;
    generationProfile?: ModelGenerationProfile;
  }) => Promise<{ text: string; telemetry: TTelemetry }>;
}) {
  const intentSourceRequest = extractFpgaArchitectureIntentSource(params.userRequest);
  const intent = buildDeterministicFpgaArchitectureIntent(intentSourceRequest);
  const intentValidation = validateFpgaArchitectureIntentCompleteness(intent, intentSourceRequest);
  if (!intentValidation.ok && intentValidation.clarificationRequest) {
    throw new FpgaArchitectureContractError(
      `Architecture intent needs clarification before VHDL generation. ${intentValidation.clarificationRequest.questions.join(' ')}`,
      buildFpgaArchitectureIntentClarificationIssues(intentValidation.clarificationRequest),
    );
  }
  const intentGroundedUserRequest = mergeFpgaArchitectureIntentIntoPrompt({
    userRequest: params.userRequest,
    intent,
  });
  const baseSynthesis = synthesizeFpgaArchitectureBlueprintFromPrompt(intentGroundedUserRequest);
  const reviewResult = await params.runModelAnalysis({
    ai: params.ai,
    provider: params.provider,
    model: params.model,
    prompt: buildFpgaArchitectureSelectionReviewPrompt({
      userRequest: intentGroundedUserRequest,
    }),
    signal: params.signal,
    generationProfile: buildModelGenerationProfile({
      id: 'contract_json',
      scope: `${intentGroundedUserRequest}\u0000architecture-selection-review`,
    }),
  });
  let architectureSelectionReview: FpgaArchitectureSelectionReview;
  try {
    architectureSelectionReview = parseFpgaArchitectureSelectionReview(reviewResult.text);
  } catch (error: any) {
    architectureSelectionReview = buildUnavailableArchitectureSelectionReview(error?.message || String(error));
  }
  if (architectureSelectionReview.fit === 'poor' && architectureSelectionReview.confidence >= 0.6) {
    const selectedPattern = baseSynthesis.primaryPattern.patternId;
    const recommendedPattern = architectureSelectionReview.recommendedPrimaryPattern || 'not provided';
    const userActionPrompt = [
      `Architecture selection may not match your request. The app selected "${selectedPattern}", but the reviewer recommended "${recommendedPattern}".`,
      'Choose one next action: Use recommended architecture, keep current architecture, edit selected blocks, retry architecture selection, or cancel before VHDL generation.',
    ].join(' ');
    throw new FpgaArchitectureContractError(
      `Architecture selection review paused before VHDL generation. ${userActionPrompt}`,
      [{
        code: 'architecture_selection_review_poor_fit',
        path: '$.architectureSynthesis.primaryPatternId',
        message: [
          userActionPrompt,
          `Missing blocks: ${architectureSelectionReview.missingBlocks.join(', ') || 'none'}.`,
          `Unnecessary blocks: ${architectureSelectionReview.unnecessaryBlocks.join(', ') || 'none'}.`,
          `Risks: ${architectureSelectionReview.architectureRisks.join('; ') || architectureSelectionReview.reasoningSummary || 'none'}.`,
        ].join(' '),
      }],
    );
  }
  const missingBlockDiscovery = await discoverMissingFpgaBlocks({
    missingBlocks: architectureSelectionReview.missingBlocks,
    userRequest: intentGroundedUserRequest,
    signal: params.signal,
    fetchText: params.missingBlockFetchText,
  });
  if (missingBlockDiscovery.unresolvedBlocks.length > 0) {
    throw new FpgaArchitectureContractError(
      [
        'Architecture block discovery paused before VHDL generation.',
        'The app automatically searched/normalized missing blocks, but at least one block was unsafe or unresolved.',
        'Narrow the requested block role, choose a known reusable FPGA block, or add it to the curated catalog.',
      ].join(' '),
      [{
        code: 'architecture_missing_block_discovery_unresolved',
        path: '$.architectureSynthesis.buildingBlockCatalogIds',
        message: [
          `Requested missing blocks: ${missingBlockDiscovery.requestedBlocks.join(', ') || 'none'}.`,
          `Unresolved blocks: ${missingBlockDiscovery.unresolvedBlocks.join(', ') || 'none'}.`,
          `Unsafe reasons: ${missingBlockDiscovery.unsafeReasons.join('; ') || 'none'}.`,
        ].join(' '),
      }],
    );
  }
  let missingBlockFitReview: FpgaArchitectureSelectionReview | undefined;
  let missingBlockFitReviewAttempt: { text: string; telemetry: TTelemetry } | undefined;
  if (missingBlockDiscovery.discoveredBlocks.length > 0) {
    missingBlockFitReviewAttempt = await params.runModelAnalysis({
      ai: params.ai,
      provider: params.provider,
      model: params.model,
      prompt: buildMissingBlockFitReviewPrompt({
        userRequest: intentGroundedUserRequest,
        discovery: missingBlockDiscovery,
      }),
      signal: params.signal,
      generationProfile: buildModelGenerationProfile({
        id: 'contract_json',
        scope: `${intentGroundedUserRequest}\u0000missing-block-fit-review`,
      }),
    });
    try {
      missingBlockFitReview = parseFpgaArchitectureSelectionReview(missingBlockFitReviewAttempt.text);
    } catch (error: any) {
      missingBlockFitReview = buildUnavailableArchitectureSelectionReview(error?.message || String(error));
    }
    if (missingBlockFitReview.fit === 'poor' && missingBlockFitReview.confidence >= 0.6) {
      missingBlockFitReview = {
        ...missingBlockFitReview,
        architectureRisks: [
          ...missingBlockFitReview.architectureRisks,
          'Auto-discovered support blocks were judged as poor fit; preserve the app-owned curated pattern and use contract completion to avoid free-form block invention.',
        ].slice(0, 12),
      };
    }
  }
  const evidence = await collectFpgaArchitectureEvidence({
    promptText: intentGroundedUserRequest,
    synthesis: baseSynthesis,
    retrievalMode: params.architectureRetrievalMode || 'off',
    projectPath: params.projectPath,
    signal: params.signal,
  });
  let prompt = buildFpgaArchitectureContractProposalPrompt({
    userRequest: intentGroundedUserRequest,
    intent,
    evidenceFacts: evidence.facts,
    retrievalMode: evidence.retrievalMode,
    retrievalWarnings: evidence.warnings,
    architectureSelectionReview,
    missingBlockDiscovery,
    missingBlockFitReview,
  });
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
      generationProfile: buildModelGenerationProfile({
        id: 'contract_json',
        scope: `${intentGroundedUserRequest}\u0000contract-attempt-${attempt + 1}`,
      }),
    });
    attempts.push(result);
    latestResponse = result.text;
    try {
      const approvedContract = parseAndValidateFpgaArchitectureContract({
        text: latestResponse,
        userRequest: intentGroundedUserRequest,
      });
      if (!approvedContract.intent) approvedContract.intent = intent;
      const parameterValidation = validateFpgaArchitectureParameterCompleteness({
        contract: approvedContract,
        userRequest: intentGroundedUserRequest,
        intent,
      });
      if (!parameterValidation.ok) {
        throw new FpgaArchitectureContractError(
          `Architecture parameters need clarification before VHDL generation. ${parameterValidation.clarificationRequest.questions.join(' ')}`,
          buildFpgaArchitectureParameterClarificationIssues(parameterValidation.clarificationRequest),
        );
      }
      const parameterizedContract = applyResolvedFpgaArchitectureParameters({
        contract: approvedContract,
        resolved: parameterValidation.resolved,
      });
      return {
        contract: parameterizedContract,
        attempts,
        repaired: attempt > 0,
        evidence,
        architectureSelectionReview,
        architectureSelectionReviewAttempt: reviewResult,
        missingBlockDiscovery,
        missingBlockFitReview,
        missingBlockFitReviewAttempt,
      };
    } catch (error: any) {
      latestError = error instanceof FpgaArchitectureContractError
        ? error
        : new FpgaArchitectureContractError(error?.message || String(error));
      if (latestError.issues.some((issue) => issue.code.startsWith('architecture_parameter_'))) {
        throw latestError;
      }
      if (attempt >= CONTRACT_MAX_REPAIR_ATTEMPTS) break;
      prompt = buildFpgaArchitectureContractRepairPrompt({
        userRequest: intentGroundedUserRequest,
        intent,
        invalidResponse: latestResponse,
        issues: latestError.issues.length > 0 ? latestError.issues : [{
          code: 'architecture_contract_invalid',
          path: '$',
          message: latestError.message,
        }],
        evidenceFacts: evidence.facts,
        retrievalMode: evidence.retrievalMode,
        retrievalWarnings: evidence.warnings,
        architectureSelectionReview,
        missingBlockDiscovery,
        missingBlockFitReview,
      });
    }
  }

  const issueCodes = latestError?.issues.map((issue) => issue.code) || [];
  const onlyMalformedJson = issueCodes.length > 0
    && issueCodes.every((code) => code === 'architecture_contract_json_invalid' || code === 'architecture_contract_json_missing');
  if (onlyMalformedJson) {
    return {
      contract: buildFpgaArchitectureContractDraft({
        userRequest: intentGroundedUserRequest,
        evidenceFacts: evidence.facts,
        retrievalMode: evidence.retrievalMode,
        intent,
      }),
      attempts,
      repaired: true,
      appOwnedFallback: true,
      evidence,
      architectureSelectionReview,
      architectureSelectionReviewAttempt: reviewResult,
      missingBlockDiscovery,
      missingBlockFitReview,
      missingBlockFitReviewAttempt,
    };
  }

  throw new FpgaArchitectureContractError(
    `FPGA architecture proposal was rejected before VHDL generation. ${latestError?.message || 'Unknown contract error.'}`,
    latestError?.issues || [],
  );
}

export function buildApprovedFpgaArchitectureContractSection(contract: FpgaArchitectureContract) {
  const contractHash = hashFpgaArchitectureContract(contract);
  return [
    '## Approved FPGA Architecture Contract',
    'This contract has passed deterministic app validation and is now immutable source of truth for VHDL generation.',
    '- Generate exactly the declared package/entity/testbench files and public interfaces.',
    '- Do not add, remove, rename, merge, or split contracted VHDL components.',
    '- Preserve clock/reset ownership, dependency order, behavioral requirements, and verification coverage.',
    '- The app will reject any manifest that drifts from this contract before GHDL runs.',
    `- Canonical contract SHA-256: ${contractHash}`,
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
      const semantic = parseVhdlSemanticModel(file.content);
      const packageModel = semantic.packages.find((entry) => !entry.isBody && entry.name.toLowerCase() === component.name.toLowerCase());
      if (!packageModel) pushIssue(issues, 'architecture_contract_package_declaration_drift', component.file, `File must declare approved package "${component.name}".`);
      for (const expectedExport of component.exports) {
        if (packageModel && !packageModel.exportedIdentifiers.some((name) => name.toLowerCase() === expectedExport.toLowerCase())) {
          pushIssue(issues, 'architecture_contract_package_export_drift', component.file, `Package "${component.name}" is missing approved export "${expectedExport}".`);
        }
      }
      continue;
    }
    const semantic = parseVhdlSemanticModel(file.content);
    const entityModel = semantic.entities.find((entry) => entry.name.toLowerCase() === component.name.toLowerCase());
    if (!entityModel) {
      pushIssue(issues, 'architecture_contract_entity_declaration_drift', component.file, `File must declare approved entity "${component.name}".`);
      continue;
    }
    const actualGenerics = entityModel.generics.flatMap((item) => item.names.map((name) => ({
      name,
      type: item.type,
      default: item.defaultValue || '',
    })));
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
    const actualPorts = entityModel.ports.flatMap((item) => item.names.map((name) => ({
      name,
      mode: item.mode || '',
      type: item.type,
    })));
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
    const actualInstances = semantic.architectures
      .filter((architecture) => architecture.entityName.toLowerCase() === component.name.toLowerCase())
      .flatMap((architecture) => architecture.instances);
    const actualChildNames = actualInstances.map((instance) => instance.entityName.toLowerCase());
    const expectedChildNames = component.children
      .map((childId) => contract.components.find((candidate) => candidate.id === childId)?.name.toLowerCase())
      .filter((name): name is string => Boolean(name));
    for (const childName of expectedChildNames) {
      if (!actualChildNames.includes(childName)) pushIssue(issues, 'architecture_contract_child_instantiation_missing', component.file, `Entity "${component.name}" does not directly instantiate approved child entity "${childName}".`);
    }
    for (const childName of actualChildNames) {
      if (!expectedChildNames.includes(childName)) pushIssue(issues, 'architecture_contract_child_instantiation_added', component.file, `Entity "${component.name}" instantiates unapproved child entity "${childName}".`);
    }
    if (contract.schemaVersion === '2.0') {
      for (const expectedInstance of (contract.instances || []).filter((instance) => instance.parentComponentId === component.id)) {
        const child = contract.components.find((candidate) => candidate.id === expectedInstance.childComponentId);
        const actual = actualInstances.find((instance) => instance.label.toLowerCase() === expectedInstance.label.toLowerCase());
        if (!actual) {
          pushIssue(issues, 'architecture_contract_instance_label_drift', component.file, `Missing approved instance label "${expectedInstance.label}".`);
          continue;
        }
        if (child && actual.entityName.toLowerCase() !== child.name.toLowerCase()) pushIssue(issues, 'architecture_contract_instance_entity_drift', component.file, `Instance "${expectedInstance.label}" must instantiate "${child.name}".`);
        for (const [formal, expectedActual] of Object.entries(expectedInstance.genericMap)) {
          if (normalizeType(actual.genericMap[formal.toLowerCase()] || '') !== normalizeType(expectedActual)) pushIssue(issues, 'architecture_contract_instance_generic_map_drift', component.file, `Instance "${expectedInstance.label}" generic "${formal}" must map to "${expectedActual}".`);
        }
        for (const [formal, expectedActual] of Object.entries(expectedInstance.portMap)) {
          if (normalizeType(actual.portMap[formal.toLowerCase()] || '') !== normalizeType(expectedActual)) pushIssue(issues, 'architecture_contract_instance_port_map_drift', component.file, `Instance "${expectedInstance.label}" port "${formal}" must map to "${expectedActual}".`);
        }
      }
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
  const hashPath = 'architecture/architecture-contract.sha256';
  const content = `${JSON.stringify(contract, null, 2)}\n`;
  const existing = project.files.find((file) => normalizePath(file.path) === contractPath);
  if (existing) {
    existing.fileType = 'json';
    existing.purpose = 'App-approved machine-checkable FPGA architecture contract';
    existing.content = content;
  } else {
    project.files.push({
      path: contractPath,
      fileType: 'json',
      purpose: 'App-approved machine-checkable FPGA architecture contract',
      content,
    });
  }
  const hashContent = `${hashFpgaArchitectureContract(contract)}  architecture-contract.json\n`;
  const existingHash = project.files.find((file) => normalizePath(file.path) === hashPath);
  if (existingHash) {
    existingHash.fileType = 'text';
    existingHash.purpose = 'Canonical SHA-256 of the approved FPGA architecture contract';
    existingHash.content = hashContent;
  } else {
    project.files.push({
      path: hashPath,
      fileType: 'text',
      purpose: 'Canonical SHA-256 of the approved FPGA architecture contract',
      content: hashContent,
    });
  }
  return project;
}
