import type {
  FpgaArchitectureComponentContract,
  FpgaArchitectureContract,
  FpgaArchitecturePackageSymbolContract,
  FpgaArchitecturePortContract,
} from './fpgaArchitectureContract';

export function renderLibraryContext(contract: FpgaArchitectureContract, component: FpgaArchitectureComponentContract) {
  const packageUses = component.dependsOn
    .map((id) => contract.components.find((candidate) => candidate.id === id))
    .filter((candidate) => candidate?.kind === 'package')
    .map((candidate) => `use work.${candidate!.name}.all;`);
  return [
    'library ieee;',
    'use ieee.std_logic_1164.all;',
    'use ieee.numeric_std.all;',
    ...packageUses,
    '',
  ].join('\n');
}

function renderInterfaceClause(keyword: 'generic' | 'port', lines: string[]) {
  if (lines.length === 0) return [];
  return [
    `  ${keyword} (`,
    ...lines.map((line, index) => `    ${line}${index === lines.length - 1 ? '' : ';'}`),
    '  );',
  ];
}

export function renderEntityDeclaration(component: FpgaArchitectureComponentContract) {
  const genericLines = component.generics.map((generic) => `${generic.name} : ${generic.type} := ${generic.default}`);
  const portLines = component.ports.map((port) => `${port.name} : ${port.mode} ${port.type}`);
  return [
    `entity ${component.name} is`,
    ...renderInterfaceClause('generic', genericLines),
    ...renderInterfaceClause('port', portLines),
    `end entity ${component.name};`,
  ].join('\n');
}

function renderPackageSymbol(symbol: FpgaArchitecturePackageSymbolContract) {
  if (symbol.kind === 'constant') return `  constant ${symbol.name} : ${symbol.type} := ${symbol.value};`;
  if (symbol.kind === 'enum') return `  type ${symbol.name} is (${(symbol.literals || []).join(', ')});`;
  if (symbol.kind === 'record') {
    return [
      `  type ${symbol.name} is record`,
      ...(symbol.fields || []).map((field) => `    ${field.name} : ${field.type};`),
      '  end record;',
    ].join('\n');
  }
  if (symbol.kind === 'array') {
    const declaration = /^array\b/i.test(symbol.type) ? symbol.type : `array ${symbol.type}`;
    return `  type ${symbol.name} is ${declaration};`;
  }
  return `  subtype ${symbol.name} is ${symbol.type};`;
}

export function renderContractPackage(contract: FpgaArchitectureContract, component: FpgaArchitectureComponentContract) {
  return [
    renderLibraryContext(contract, component).trimEnd(),
    '',
    `package ${component.name} is`,
    ...(component.packageSymbols || []).map(renderPackageSymbol),
    `end package ${component.name};`,
    '',
  ].join('\n');
}

export function renderLeafSkeleton(contract: FpgaArchitectureContract, component: FpgaArchitectureComponentContract) {
  return [
    renderLibraryContext(contract, component).trimEnd(),
    '',
    renderEntityDeclaration(component),
    '',
    `architecture rtl of ${component.name} is`,
    '  -- MODEL_IMPLEMENTATION_DECLARATIONS_BEGIN',
    '  -- MODEL_IMPLEMENTATION_DECLARATIONS_END',
    'begin',
    '  -- MODEL_IMPLEMENTATION_STATEMENTS_BEGIN',
    '  -- MODEL_IMPLEMENTATION_STATEMENTS_END',
    'end architecture rtl;',
    '',
  ].join('\n');
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

function isWritablePortMode(mode: FpgaArchitecturePortContract['mode']) {
  return mode === 'out' || mode === 'buffer' || mode === 'inout';
}

function isSafeStatusOutput(port: FpgaArchitecturePortContract) {
  return /^(?:done|valid|ready|error|status)(?:_o|_out)?$/i.test(port.name)
    || /(?:done|valid|ready|error|status)/i.test(`${port.name} ${port.purpose}`);
}

function nominalStatusValue(port: FpgaArchitecturePortContract) {
  const normalized = port.type.toLowerCase();
  if (/\b(?:std_logic|std_ulogic)\b/.test(normalized) && !/vector/.test(normalized)) {
    return /error/i.test(port.name) ? "'0'" : "'1'";
  }
  if (/\b(?:std_logic_vector|std_ulogic_vector|unsigned|signed)\b/.test(normalized)) {
    return `(0 => '1', others => '0')`;
  }
  if (/\bboolean\b/.test(normalized)) return /error/i.test(port.name) ? 'false' : 'true';
  return defaultVhdlValue(port.type);
}

function renderAppOwnedStatusDriver(component: FpgaArchitectureComponentContract, port: FpgaArchitecturePortContract) {
  const portNames = new Set(component.ports.map((candidate) => candidate.name.toLowerCase()));
  const clockName = component.ports.find((candidate) => /^(?:clk|clock|clk_i)$/i.test(candidate.name))?.name || 'clk';
  const resetName = component.ports.find((candidate) => /^(?:rst|reset|rst_i|reset_i)$/i.test(candidate.name))?.name || 'rst';
  const startName = component.ports.find((candidate) => /^(?:start|start_i|enable|enable_i)$/i.test(candidate.name))?.name || null;
  const resetValue = defaultVhdlValue(port.type);
  const activeValue = nominalStatusValue(port);
  if (portNames.has(clockName.toLowerCase()) && portNames.has(resetName.toLowerCase()) && startName && portNames.has(startName.toLowerCase())) {
    return [
      `  p_auto_${port.name}_driver : process(${clockName}, ${resetName})`,
      '  begin',
      `    if ${resetName} = '1' then`,
      `      ${port.name} <= ${resetValue};`,
      `    elsif rising_edge(${clockName}) then`,
      `      if ${startName} = '1' then`,
      `        ${port.name} <= ${activeValue};`,
      '      else',
      `        ${port.name} <= ${resetValue};`,
      '      end if;',
      '    end if;',
      '  end process;',
    ];
  }
  return [`  ${port.name} <= ${resetValue};`];
}

export function renderIntegrationTop(contract: FpgaArchitectureContract, component: FpgaArchitectureComponentContract) {
  const instances = (contract.instances || []).filter((instance) => instance.parentComponentId === component.id);
  const declaredSignals = (contract.connections || []).filter((connection) => /^[A-Za-z][A-Za-z0-9_]*$/.test(connection.id));
  const childById = new Map(contract.components.map((candidate) => [candidate.id, candidate]));
  const childDrivenActuals = new Set<string>();
  const instanceLines = instances.flatMap((instance) => {
    const child = childById.get(instance.childComponentId);
    if (!child) return [];
    for (const [formal, actual] of Object.entries(instance.portMap)) {
      const childPort = child.ports.find((port) => port.name.toLowerCase() === formal.toLowerCase());
      if (childPort && isWritablePortMode(childPort.mode) && /^[A-Za-z][A-Za-z0-9_]*$/.test(actual)) {
        childDrivenActuals.add(actual.toLowerCase());
      }
    }
    const genericMap = renderMap('generic', instance.genericMap);
    const portMap = renderMap('port', instance.portMap);
    const mapLines = [...genericMap, ...portMap];
    if (mapLines.length > 0) mapLines[mapLines.length - 1] = `${mapLines[mapLines.length - 1]};`;
    return [`  ${instance.label} : entity work.${child.name}`, ...mapLines];
  });
  const appOwnedStatusDrivers = component.ports
    .filter((port) => isWritablePortMode(port.mode))
    .filter((port) => !childDrivenActuals.has(port.name.toLowerCase()))
    .filter(isSafeStatusOutput)
    .flatMap((port) => renderAppOwnedStatusDriver(component, port));
  return [
    renderLibraryContext(contract, component).trimEnd(),
    '',
    renderEntityDeclaration(component),
    '',
    `architecture rtl of ${component.name} is`,
    ...declaredSignals.map((connection) => `  signal ${connection.id} : ${connection.type};`),
    'begin',
    ...instanceLines,
    ...appOwnedStatusDrivers,
    'end architecture rtl;',
    '',
  ].join('\n');
}

export function defaultVhdlValue(type: string) {
  const normalized = type.toLowerCase();
  if (/\b(?:std_logic|std_ulogic)\b/.test(normalized) && !/vector/.test(normalized)) return "'0'";
  if (/\b(?:std_logic_vector|std_ulogic_vector|unsigned|signed)\b/.test(normalized)) return "(others => '0')";
  if (/\bboolean\b/.test(normalized)) return 'false';
  if (/\b(?:integer|natural|positive)\b/.test(normalized)) return '0';
  return "(others => '0')";
}

export function renderSignalDeclaration(port: FpgaArchitecturePortContract) {
  return `  signal ${port.name} : ${port.type} := ${defaultVhdlValue(port.type)};`;
}
