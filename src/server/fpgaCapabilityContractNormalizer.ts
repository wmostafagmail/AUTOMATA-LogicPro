import type {
  FpgaArchitectureComponentContract,
  FpgaArchitectureContract,
  FpgaArchitecturePortContract,
} from './fpgaArchitectureContract';
import type { GoldenLeafInterfaceItem } from './fpgaGoldenLeafLibrary';
import {
  classifyVerifiedPortRole,
  isProgramCounterComponent,
  isRegisterFileComponent,
  isSpiMasterComponent,
  isUartTransmitterComponent,
  isVideoTimingComponent,
  type VerifiedPortRole,
} from './fpgaVerifiedVhdlPortRoles';

export type CapabilityContractNormalizationAudit = {
  capability: 'uart_tx' | 'register_file' | 'spi_master' | 'program_counter' | 'video_timing' | 'none';
  componentId: string;
  addedPorts: string[];
  addedGenerics: string[];
  addedInstanceMappings: Array<{ instanceId: string; formal: string; actual: string }>;
  semanticMappings: Array<{ approvedPort: string; role: VerifiedPortRole; status: 'resolved' | 'added' }>;
  assumptions: string[];
};

export type CapabilityContractNormalizationResult = {
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
  audit: CapabilityContractNormalizationAudit;
};

function normalizeName(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase();
}

function portAsInterfaceItem(port: FpgaArchitecturePortContract): GoldenLeafInterfaceItem {
  return {
    name: port.name,
    mode: port.mode,
    type: port.type,
    defaultValue: null,
  };
}

function hasRole(component: FpgaArchitectureComponentContract, role: VerifiedPortRole) {
  return component.ports.some((port) => classifyVerifiedPortRole(portAsInterfaceItem(port), component).role === role);
}

function findRolePort(component: FpgaArchitectureComponentContract, role: VerifiedPortRole) {
  return component.ports.find((port) => classifyVerifiedPortRole(portAsInterfaceItem(port), component).role === role) || null;
}

function hasGeneric(component: FpgaArchitectureComponentContract, name: string) {
  return (component.generics || []).some((generic) => normalizeName(generic.name) === normalizeName(name));
}

function vectorWidth(type: string) {
  const match = String(type || '').replace(/\s+/g, ' ').match(/\((\d+)\s+downto\s+(\d+)\)/i);
  if (!match) return null;
  return Math.abs(Number(match[1]) - Number(match[2])) + 1;
}

function addPortIfMissing(params: {
  component: FpgaArchitectureComponentContract;
  audit: CapabilityContractNormalizationAudit;
  role: VerifiedPortRole;
  port: FpgaArchitecturePortContract;
}) {
  const existing = findRolePort(params.component, params.role);
  if (existing) {
    params.audit.semanticMappings.push({ approvedPort: existing.name, role: params.role, status: 'resolved' });
    return params.component;
  }
  params.audit.addedPorts.push(params.port.name);
  params.audit.semanticMappings.push({ approvedPort: params.port.name, role: params.role, status: 'added' });
  return {
    ...params.component,
    ports: [...params.component.ports, params.port],
  };
}

function addNamedPortIfMissing(params: {
  component: FpgaArchitectureComponentContract;
  audit: CapabilityContractNormalizationAudit;
  role: VerifiedPortRole;
  port: FpgaArchitecturePortContract;
}) {
  const existing = params.component.ports.find((port) => normalizeName(port.name) === normalizeName(params.port.name));
  if (existing) {
    params.audit.semanticMappings.push({ approvedPort: existing.name, role: params.role, status: 'resolved' });
    return params.component;
  }
  params.audit.addedPorts.push(params.port.name);
  params.audit.semanticMappings.push({ approvedPort: params.port.name, role: params.role, status: 'added' });
  return {
    ...params.component,
    ports: [...params.component.ports, params.port],
  };
}

function addGenericIfMissing(params: {
  component: FpgaArchitectureComponentContract;
  audit: CapabilityContractNormalizationAudit;
  name: string;
  type: string;
  defaultValue: string;
}) {
  if (hasGeneric(params.component, params.name)) return params.component;
  params.audit.addedGenerics.push(params.name);
  return {
    ...params.component,
    generics: [
      ...(params.component.generics || []),
      { name: params.name, type: params.type, default: params.defaultValue },
    ],
  };
}

function ensureInstanceMap(params: {
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
  audit: CapabilityContractNormalizationAudit;
  formal: string;
  actual: string;
}) {
  return {
    ...params.contract,
    instances: (params.contract.instances || []).map((instance) => {
      if (instance.childComponentId !== params.component.id || Object.prototype.hasOwnProperty.call(instance.portMap || {}, params.formal)) {
        return instance;
      }
      params.audit.addedInstanceMappings.push({ instanceId: instance.id, formal: params.formal, actual: params.actual });
      return {
        ...instance,
        portMap: {
          ...(instance.portMap || {}),
          [params.formal]: params.actual,
        },
      };
    }),
  };
}

function ensureGenericMap(params: {
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
  name: string;
  value: string;
}) {
  return {
    ...params.contract,
    instances: (params.contract.instances || []).map((instance) => {
      if (instance.childComponentId !== params.component.id) return instance;
      return {
        ...instance,
        genericMap: {
          ...(instance.genericMap || {}),
          [params.name]: (instance.genericMap || {})[params.name] || params.value,
        },
      };
    }),
  };
}

function replaceComponent(contract: FpgaArchitectureContract, component: FpgaArchitectureComponentContract) {
  return {
    ...contract,
    components: contract.components.map((candidate) => candidate.id === component.id ? component : candidate),
  };
}

function normalizeUartTx(params: {
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
  audit: CapabilityContractNormalizationAudit;
}) {
  let component = params.component;
  component = addGenericIfMissing({ component, audit: params.audit, name: 'G_CLOCK_HZ', type: 'positive', defaultValue: '50000000' });
  component = addGenericIfMissing({ component, audit: params.audit, name: 'G_BAUD_RATE', type: 'positive', defaultValue: '115200' });
  component = addGenericIfMissing({ component, audit: params.audit, name: 'G_DATA_BITS', type: 'positive', defaultValue: '8' });
  component = addPortIfMissing({
    component,
    audit: params.audit,
    role: 'payload_in',
    port: { name: 'data_i', mode: 'in', type: 'std_logic_vector(G_DATA_BITS-1 downto 0)', purpose: 'Transmit payload byte for the UART TX ready/valid request contract.' },
  });
  component = addPortIfMissing({
    component,
    audit: params.audit,
    role: 'tx_request_valid',
    port: { name: 'valid_i', mode: 'in', type: 'std_logic', purpose: 'Transmit-request valid; one high cycle requests transmission of data_i when ready_o permits.' },
  });
  component = addPortIfMissing({
    component,
    audit: params.audit,
    role: 'tx_request_ready',
    port: { name: 'ready_o', mode: 'out', type: 'std_logic', purpose: 'Transmit-request ready from the UART TX block.' },
  });
  component = addPortIfMissing({
    component,
    audit: params.audit,
    role: 'serial_tx',
    port: { name: 'tx_o', mode: 'out', type: 'std_logic', purpose: 'UART serial transmit output.' },
  });
  if (!component.ports.some((port) => /^(?:busy|busy_o)$/i.test(port.name))) {
    component = { ...component, ports: [...component.ports, { name: 'busy_o', mode: 'out', type: 'std_logic', purpose: 'UART TX busy/status output.' }] };
    params.audit.addedPorts.push('busy_o');
  }
  let contract = replaceComponent(params.contract, component);
  contract = ensureInstanceMap({ contract, component, audit: params.audit, formal: 'valid_i', actual: 'start_i' });
  contract = ensureInstanceMap({ contract, component, audit: params.audit, formal: 'ready_o', actual: 'open' });
  contract = ensureInstanceMap({ contract, component, audit: params.audit, formal: 'tx_o', actual: 'open' });
  contract = ensureInstanceMap({ contract, component, audit: params.audit, formal: 'busy_o', actual: 'open' });
  contract = ensureGenericMap({ contract, component, name: 'G_CLOCK_HZ', value: '50000000' });
  contract = ensureGenericMap({ contract, component, name: 'G_BAUD_RATE', value: '115200' });
  contract = ensureGenericMap({ contract, component, name: 'G_DATA_BITS', value: '8' });
  params.audit.assumptions.push(`CAPABILITY_CONTRACT_NORMALIZATION component=${component.id} capability=uart_tx exposed payload/valid/ready/serial/busy roles.`);
  return { contract, component };
}

function normalizeRegisterFile(params: {
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
  audit: CapabilityContractNormalizationAudit;
}) {
  const dataWidth = component.ports
    .map((port) => vectorWidth(port.type))
    .find((width) => width !== null) || 8;
  let component = params.component;
  component = addGenericIfMissing({ component, audit: params.audit, name: 'ADDR_WIDTH', type: 'positive', defaultValue: '5' });
  component = addGenericIfMissing({ component, audit: params.audit, name: 'DATA_WIDTH', type: 'positive', defaultValue: String(dataWidth) });
  component = addPortIfMissing({
    component,
    audit: params.audit,
    role: 'register_read_address',
    port: { name: 'src_addr', mode: 'in', type: 'std_logic_vector(ADDR_WIDTH-1 downto 0)', purpose: 'Register read-address input.' },
  });
  component = addPortIfMissing({
    component,
    audit: params.audit,
    role: 'register_write_address',
    port: { name: 'dst_addr', mode: 'in', type: 'std_logic_vector(ADDR_WIDTH-1 downto 0)', purpose: 'Register write-address input.' },
  });
  component = addPortIfMissing({
    component,
    audit: params.audit,
    role: 'register_write_data',
    port: { name: 'data_i', mode: 'in', type: `std_logic_vector(${dataWidth - 1} downto 0)`, purpose: 'Register write-data input.' },
  });
  component = addPortIfMissing({
    component,
    audit: params.audit,
    role: 'register_read_data',
    port: { name: 'data_o', mode: 'out', type: `std_logic_vector(${dataWidth - 1} downto 0)`, purpose: 'Register read-data output.' },
  });
  if (!component.ports.some((port) => /^(?:start|start_i|enable_i)$/i.test(port.name))) {
    component = { ...component, ports: [...component.ports, { name: 'start_i', mode: 'in', type: 'std_logic', purpose: 'Register-file transaction/write request.' }] };
    params.audit.addedPorts.push('start_i');
  }
  for (const statusPort of ['busy_o', 'done_o', 'error_o']) {
    if (component.ports.some((port) => normalizeName(port.name) === normalizeName(statusPort))) continue;
    component = { ...component, ports: [...component.ports, { name: statusPort, mode: 'out', type: 'std_logic', purpose: `Register-file ${statusPort.replace(/_o$/, '')} status output.` }] };
    params.audit.addedPorts.push(statusPort);
  }
  let contract = replaceComponent(params.contract, component);
  contract = ensureInstanceMap({ contract, component, audit: params.audit, formal: 'src_addr', actual: "(others => '0')" });
  contract = ensureInstanceMap({ contract, component, audit: params.audit, formal: 'dst_addr', actual: "(others => '0')" });
  contract = ensureInstanceMap({ contract, component, audit: params.audit, formal: 'data_o', actual: 'open' });
  contract = ensureInstanceMap({ contract, component, audit: params.audit, formal: 'busy_o', actual: 'open' });
  contract = ensureInstanceMap({ contract, component, audit: params.audit, formal: 'done_o', actual: 'open' });
  contract = ensureInstanceMap({ contract, component, audit: params.audit, formal: 'error_o', actual: 'open' });
  contract = ensureGenericMap({ contract, component, name: 'ADDR_WIDTH', value: '5' });
  contract = ensureGenericMap({ contract, component, name: 'DATA_WIDTH', value: String(dataWidth) });
  params.audit.assumptions.push(`CAPABILITY_CONTRACT_NORMALIZATION component=${component.id} capability=register_file exposed read/write address and data roles.`);
  return { contract, component };
}

function normalizeSpiMaster(params: {
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
  audit: CapabilityContractNormalizationAudit;
}) {
  let component = params.component;
  component = addGenericIfMissing({ component, audit: params.audit, name: 'DATA_WIDTH', type: 'positive', defaultValue: '8' });
  component = addGenericIfMissing({ component, audit: params.audit, name: 'STATUS_WIDTH', type: 'positive', defaultValue: '32' });
  component = addPortIfMissing({
    component,
    audit: params.audit,
    role: 'serial_rx',
    port: { name: 'miso_i', mode: 'in', type: 'std_logic', purpose: 'SPI master serial receive input from the selected slave (MISO).' },
  });
  component = addPortIfMissing({
    component,
    audit: params.audit,
    role: 'valid',
    port: { name: 'tx_valid_i', mode: 'in', type: 'std_logic', purpose: 'One-cycle command-valid input for launching an SPI transfer.' },
  });
  let contract = replaceComponent(params.contract, component);
  contract = ensureInstanceMap({ contract, component, audit: params.audit, formal: 'miso_i', actual: "'0'" });
  contract = ensureInstanceMap({ contract, component, audit: params.audit, formal: 'tx_valid_i', actual: "'1'" });
  contract = ensureGenericMap({ contract, component, name: 'DATA_WIDTH', value: '8' });
  contract = ensureGenericMap({ contract, component, name: 'STATUS_WIDTH', value: '32' });
  params.audit.assumptions.push(`CAPABILITY_CONTRACT_NORMALIZATION component=${component.id} capability=spi_master exposed required serial receive and command-valid roles.`);
  return { contract, component };
}

function normalizeProgramCounter(params: {
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
  audit: CapabilityContractNormalizationAudit;
}) {
  let component = params.component;
  component = addGenericIfMissing({ component, audit: params.audit, name: 'PC_WIDTH', type: 'positive', defaultValue: '32' });
  component = addGenericIfMissing({ component, audit: params.audit, name: 'RESET_VECTOR', type: 'natural', defaultValue: '0' });
  component = addGenericIfMissing({ component, audit: params.audit, name: 'INSTR_BYTES', type: 'positive', defaultValue: '4' });
  component = addNamedPortIfMissing({
    component,
    audit: params.audit,
    role: 'address',
    port: { name: 'redirect_pc_i', mode: 'in', type: 'std_logic_vector(PC_WIDTH-1 downto 0)', purpose: 'Program-counter redirect target address, inactive unless redirect_valid_i is asserted.' },
  });
  component = addNamedPortIfMissing({
    component,
    audit: params.audit,
    role: 'valid',
    port: { name: 'redirect_valid_i', mode: 'in', type: 'std_logic', purpose: 'Program-counter redirect request valid; low means sequential PC advance.' },
  });
  component = addNamedPortIfMissing({
    component,
    audit: params.audit,
    role: 'enable',
    port: { name: 'sequential_advance_i', mode: 'in', type: 'std_logic', purpose: 'Enables normal PC increment by INSTR_BYTES when no redirect is active.' },
  });
  component = addNamedPortIfMissing({
    component,
    audit: params.audit,
    role: 'address',
    port: { name: 'pc_o', mode: 'out', type: 'std_logic_vector(PC_WIDTH-1 downto 0)', purpose: 'Current program counter value.' },
  });
  let contract = replaceComponent(params.contract, component);
  contract = ensureInstanceMap({ contract, component, audit: params.audit, formal: 'redirect_pc_i', actual: "(others => '0')" });
  contract = ensureInstanceMap({ contract, component, audit: params.audit, formal: 'redirect_valid_i', actual: "'0'" });
  contract = ensureInstanceMap({ contract, component, audit: params.audit, formal: 'sequential_advance_i', actual: "'1'" });
  contract = ensureInstanceMap({ contract, component, audit: params.audit, formal: 'pc_o', actual: 'open' });
  contract = ensureGenericMap({ contract, component, name: 'PC_WIDTH', value: '32' });
  contract = ensureGenericMap({ contract, component, name: 'RESET_VECTOR', value: '0' });
  contract = ensureGenericMap({ contract, component, name: 'INSTR_BYTES', value: '4' });
  params.audit.assumptions.push(`CAPABILITY_CONTRACT_NORMALIZATION component=${component.id} capability=program_counter exposed redirect, sequential advance, and PC output roles.`);
  return { contract, component };
}

function normalizeVideoTiming(params: {
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
  audit: CapabilityContractNormalizationAudit;
}) {
  let component = params.component;
  const timingPorts = [
    ['h_active', '640'],
    ['h_front', '16'],
    ['h_sync', '96'],
    ['h_back', '48'],
    ['v_active', '480'],
    ['v_front', '10'],
    ['v_sync', '2'],
    ['v_back', '33'],
  ] as const;
  for (const [portName, _value] of timingPorts) {
    component = addNamedPortIfMissing({
      component,
      audit: params.audit,
      role: 'video_timing_config',
      port: { name: portName, mode: 'in', type: 'positive', purpose: 'VGA 640x480 timing configuration input.' },
    });
  }
  let contract = replaceComponent(params.contract, component);
  for (const [portName, value] of timingPorts) {
    contract = ensureInstanceMap({ contract, component, audit: params.audit, formal: portName, actual: value });
  }
  params.audit.assumptions.push(`CAPABILITY_CONTRACT_NORMALIZATION component=${component.id} capability=video_timing applied VGA_640x480 timing config defaults.`);
  return { contract, component };
}

export function normalizeComponentContractForVerifiedCapability(params: {
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
}): CapabilityContractNormalizationResult {
  const audit: CapabilityContractNormalizationAudit = {
    capability: 'none',
    componentId: params.component.id,
    addedPorts: [],
    addedGenerics: [],
    addedInstanceMappings: [],
    semanticMappings: [],
    assumptions: [],
  };

  if (isUartTransmitterComponent(params.component)) {
    audit.capability = 'uart_tx';
    const normalized = normalizeUartTx({ contract: params.contract, component: params.component, audit });
    return {
      ...normalized,
      audit,
      contract: {
        ...normalized.contract,
        assumptions: [...(normalized.contract.assumptions || []), ...audit.assumptions].slice(0, 64),
      },
    };
  }
  if (isRegisterFileComponent(params.component)) {
    audit.capability = 'register_file';
    const normalized = normalizeRegisterFile({ contract: params.contract, component: params.component, audit });
    return {
      ...normalized,
      audit,
      contract: {
        ...normalized.contract,
        assumptions: [...(normalized.contract.assumptions || []), ...audit.assumptions].slice(0, 64),
      },
    };
  }
  if (isSpiMasterComponent(params.component)) {
    audit.capability = 'spi_master';
    const normalized = normalizeSpiMaster({ contract: params.contract, component: params.component, audit });
    return {
      ...normalized,
      audit,
      contract: {
        ...normalized.contract,
        assumptions: [...(normalized.contract.assumptions || []), ...audit.assumptions].slice(0, 64),
      },
    };
  }
  if (isProgramCounterComponent(params.component)) {
    audit.capability = 'program_counter';
    const normalized = normalizeProgramCounter({ contract: params.contract, component: params.component, audit });
    return {
      ...normalized,
      audit,
      contract: {
        ...normalized.contract,
        assumptions: [...(normalized.contract.assumptions || []), ...audit.assumptions].slice(0, 64),
      },
    };
  }
  if (isVideoTimingComponent(params.component)) {
    audit.capability = 'video_timing';
    const normalized = normalizeVideoTiming({ contract: params.contract, component: params.component, audit });
    return {
      ...normalized,
      audit,
      contract: {
        ...normalized.contract,
        assumptions: [...(normalized.contract.assumptions || []), ...audit.assumptions].slice(0, 64),
      },
    };
  }
  return {
    contract: params.contract,
    component: params.component,
    audit,
  };
}
