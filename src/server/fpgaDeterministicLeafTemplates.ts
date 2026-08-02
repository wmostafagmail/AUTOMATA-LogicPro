import type { FpgaArchitectureComponentContract, FpgaArchitectureContract, FpgaArchitecturePortContract } from './fpgaArchitectureContract';
import { defaultVhdlValue, renderLeafSkeleton } from './fpgaContractRenderer';

export type DeterministicLeafTemplateResult = {
  content: string;
  templateId: string;
  reason: string;
};

function replaceSkeletonRegions(skeleton: string, declarations: string[], statements: string[]) {
  const declarationBlock = declarations.length > 0 ? declarations.join('\n') : '  -- No template-local declarations required.';
  const statementBlock = statements.length > 0 ? statements.join('\n') : '  -- No template-local statements required.';
  return skeleton
    .replace(
      /  -- MODEL_IMPLEMENTATION_DECLARATIONS_BEGIN[\s\S]*?  -- MODEL_IMPLEMENTATION_DECLARATIONS_END/,
      `  -- MODEL_IMPLEMENTATION_DECLARATIONS_BEGIN\n${declarationBlock}\n  -- MODEL_IMPLEMENTATION_DECLARATIONS_END`,
    )
    .replace(
      /  -- MODEL_IMPLEMENTATION_STATEMENTS_BEGIN[\s\S]*?  -- MODEL_IMPLEMENTATION_STATEMENTS_END/,
      `  -- MODEL_IMPLEMENTATION_STATEMENTS_BEGIN\n${statementBlock}\n  -- MODEL_IMPLEMENTATION_STATEMENTS_END`,
    );
}

function normalized(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function roleText(component: FpgaArchitectureComponentContract) {
  return normalized(`${component.id} ${component.name} ${component.responsibility}`);
}

function isScalarLogic(type: string) {
  return /\bstd_ulogic\b|\bstd_logic\b/i.test(type) && !/vector/i.test(type);
}

function vectorRange(type: string) {
  return type.match(/\b(?:std_logic_vector|std_ulogic_vector|unsigned|signed)\s*\(\s*([^)]+)\)/i)?.[1]?.trim() || null;
}

function vectorMsb(type: string) {
  const range = vectorRange(type);
  return range?.match(/^(\d+)\s+downto\s+0$/i)?.[1] || null;
}

function vectorWidthLiteral(type: string) {
  const msb = vectorMsb(type);
  return msb ? String(Number.parseInt(msb, 10) + 1) : null;
}

function inputPorts(component: FpgaArchitectureComponentContract) {
  return component.ports.filter((port) => port.mode === 'in');
}

function outputPorts(component: FpgaArchitectureComponentContract) {
  return component.ports.filter((port) => port.mode === 'out' || port.mode === 'buffer' || port.mode === 'inout');
}

function findClock(component: FpgaArchitectureComponentContract) {
  return component.ports.find((port) => isScalarLogic(port.type) && /^(?:clk|clock|clk_i|clock_i)$/i.test(port.name))?.name || null;
}

function findReset(component: FpgaArchitectureComponentContract) {
  return component.ports.find((port) => isScalarLogic(port.type) && /^(?:rst|reset|rst_i|reset_i|rst_n|reset_n|reset_ni|aresetn)$/i.test(port.name))?.name || null;
}

function resetAssertedExpression(resetName: string) {
  return /(?:_n$|_ni$|n$|aresetn|resetn)/i.test(resetName) ? `${resetName} = '0'` : `${resetName} = '1'`;
}

function renderDefaultOutputAssignments(component: FpgaArchitectureComponentContract, comment: string) {
  return [
    `  -- DETERMINISTIC_TEMPLATE: ${comment}`,
    ...outputPorts(component).map((port) => `  ${port.name} <= ${defaultVhdlValue(port.type)};`),
  ];
}

function renderPassThroughTemplate(
  contract: FpgaArchitectureContract,
  component: FpgaArchitectureComponentContract,
  skeleton: string,
): DeterministicLeafTemplateResult | null {
  const outputs = outputPorts(component);
  const inputs = inputPorts(component);
  if (outputs.length !== 1) return null;
  const output = outputs[0];
  const sameTypedInput = inputs.find((port) => port.type.trim().toLowerCase() === output.type.trim().toLowerCase() && !/clk|rst|reset/i.test(port.name));
  if (!sameTypedInput) return null;
  return {
    templateId: 'deterministic_passthrough_leaf',
    reason: `Pass-through leaf from ${sameTypedInput.name} to ${output.name}.`,
    content: replaceSkeletonRegions(skeleton || renderLeafSkeleton(contract, component), [], [
      '  -- DETERMINISTIC_TEMPLATE: exact same-type pass-through leaf.',
      `  ${output.name} <= ${sameTypedInput.name};`,
    ]),
  };
}

function renderLogicGateTemplate(
  contract: FpgaArchitectureContract,
  component: FpgaArchitectureComponentContract,
  skeleton: string,
): DeterministicLeafTemplateResult | null {
  const text = roleText(component);
  if (!/(?:and|logic_gate|logic)/.test(text)) return null;
  const inputs = inputPorts(component).filter((port) => isScalarLogic(port.type) && !/clk|rst|reset/i.test(port.name));
  const outputs = outputPorts(component).filter((port) => isScalarLogic(port.type));
  if (inputs.length < 2 || outputs.length !== 1) return null;
  return {
    templateId: 'deterministic_logic_and_leaf',
    reason: 'Two-input scalar logic AND template.',
    content: replaceSkeletonRegions(skeleton || renderLeafSkeleton(contract, component), [], [
      '  -- DETERMINISTIC_TEMPLATE: scalar logic AND.',
      `  ${outputs[0].name} <= ${inputs[0].name} and ${inputs[1].name};`,
    ]),
  };
}

function renderAluTemplate(
  contract: FpgaArchitectureContract,
  component: FpgaArchitectureComponentContract,
  skeleton: string,
): DeterministicLeafTemplateResult | null {
  if (!/\balu\b|arithmetic_logic/.test(roleText(component))) return null;
  const vectorInputs = inputPorts(component).filter((port) => vectorRange(port.type));
  const opcode = inputPorts(component).find((port) => /op|opcode|sel|func/i.test(port.name) && vectorRange(port.type));
  const result = outputPorts(component).find((port) => /result|res|data|y|out/i.test(port.name) && vectorRange(port.type));
  if (vectorInputs.length < 2 || !result) return null;
  const a = vectorInputs[0];
  const b = vectorInputs.find((port) => port.name !== a.name && port.name !== opcode?.name) || vectorInputs[1];
  const op = opcode?.name || null;
  const resultWidth = vectorWidthLiteral(result.type) || `${result.name}'length`;
  const statements = op ? [
    '  -- DETERMINISTIC_TEMPLATE: numeric_std-safe ALU. Bitwise operations use typed vector operands only.',
    '  alu_p : process(all)',
    '    variable a_u : unsigned(' + result.name + "'range);",
    '    variable b_u : unsigned(' + result.name + "'range);",
    '    variable r_u : unsigned(' + result.name + "'range);",
    '  begin',
    `    a_u := resize(unsigned(${a.name}), ${result.name}'length);`,
    `    b_u := resize(unsigned(${b.name}), ${result.name}'length);`,
    "    r_u := (others => '0');",
    `    case ${op} is`,
    '      when "0000" => r_u := a_u + b_u;',
    '      when "0001" => r_u := a_u - b_u;',
    '      when "0010" => r_u := a_u and b_u;',
    '      when "0011" => r_u := a_u or b_u;',
    '      when "0100" => r_u := a_u xor b_u;',
    '      when others => r_u := a_u;',
    '    end case;',
    `    ${result.name} <= std_logic_vector(r_u);`,
    '  end process;',
  ] : [
    '  -- DETERMINISTIC_TEMPLATE: numeric_std-safe add datapath.',
    `  ${result.name} <= std_logic_vector(resize(unsigned(${a.name}), ${resultWidth}) + resize(unsigned(${b.name}), ${resultWidth}));`,
  ];
  return {
    templateId: 'deterministic_alu_leaf',
    reason: 'ALU/datapath template with typed numeric_std operands.',
    content: replaceSkeletonRegions(skeleton || renderLeafSkeleton(contract, component), [], statements),
  };
}

function renderPixelOrFramebufferTemplate(
  contract: FpgaArchitectureContract,
  component: FpgaArchitectureComponentContract,
  skeleton: string,
): DeterministicLeafTemplateResult | null {
  const text = roleText(component);
  if (!/(?:pixel|framebuffer|pattern|video)/.test(text)) return null;
  const vectorOutput = outputPorts(component).find((port) => vectorRange(port.type));
  if (!vectorOutput) return null;
  const addressInput = inputPorts(component).find((port) => /addr|address|pixel|x_|h_count|count/i.test(port.name) && vectorRange(port.type));
  const activeInput = inputPorts(component).find((port) => isScalarLogic(port.type) && /active|valid|enable/i.test(port.name));
  const outputWidth = vectorWidthLiteral(vectorOutput.type);
  const outputAssignment = addressInput
    ? outputWidth
      ? `      ${vectorOutput.name} <= std_logic_vector(resize(unsigned(${addressInput.name}), ${outputWidth}));`
      : `      ${vectorOutput.name} <= std_logic_vector(resize(unsigned(${addressInput.name}), ${vectorOutput.name}'length));`
    : `      ${vectorOutput.name} <= (others => '1');`;
  const statements = [
    '  -- DETERMINISTIC_TEMPLATE: video/pixel leaf. No integer bitmask and/or expressions are used.',
    '  pixel_stage_p : process(all)',
    '  begin',
    `    ${vectorOutput.name} <= ${defaultVhdlValue(vectorOutput.type)};`,
    activeInput ? `    if ${activeInput.name} = '1' then` : '    if true then',
    outputAssignment,
    '    end if;',
    '  end process;',
    ...outputPorts(component)
      .filter((port) => port.name !== vectorOutput.name)
      .map((port) => `  ${port.name} <= ${defaultVhdlValue(port.type)};`),
  ];
  return {
    templateId: 'deterministic_video_pixel_leaf',
    reason: 'Video/pixel output template with typed resize instead of illegal integer bitmasking.',
    content: replaceSkeletonRegions(skeleton || renderLeafSkeleton(contract, component), [], statements),
  };
}

function renderSampleInputStageTemplate(
  contract: FpgaArchitectureContract,
  component: FpgaArchitectureComponentContract,
  skeleton: string,
): DeterministicLeafTemplateResult | null {
  const text = roleText(component);
  if (!/(?:sample_input|sample.*stage|input_stage|adc.*capture|stream.*input)/.test(text)) return null;
  const clk = findClock(component);
  const rst = findReset(component);
  if (!clk || !rst) return null;
  const dataIn = inputPorts(component).find((port) => vectorRange(port.type) && /(?:sample|data|payload|din|input)/i.test(port.name));
  const dataOut = outputPorts(component).find((port) => vectorRange(port.type) && /(?:sample|data|payload|dout|output)/i.test(port.name));
  const validIn = inputPorts(component).find((port) => isScalarLogic(port.type) && /(?:valid|strobe|enable|en)/i.test(port.name));
  const validOut = outputPorts(component).find((port) => isScalarLogic(port.type) && /valid/i.test(port.name));
  const readyOut = outputPorts(component).find((port) => isScalarLogic(port.type) && /ready/i.test(port.name));
  if (!dataOut && !validOut && !readyOut) return null;
  const declarations = [
    ...(dataOut ? [`  signal ${dataOut.name}_r : ${dataOut.type} := ${defaultVhdlValue(dataOut.type)};`] : []),
    ...(validOut ? [`  signal ${validOut.name}_r : ${validOut.type} := '0';`] : []),
  ];
  const captureCondition = validIn ? `${validIn.name} = '1'` : 'true';
  const statements = [
    '  -- DETERMINISTIC_TEMPLATE: sample/stream input boundary with registered payload and valid timing.',
    `  ${component.id}_sample_input_p : process(${clk})`,
    '  begin',
    `    if rising_edge(${clk}) then`,
    `      if ${resetAssertedExpression(rst)} then`,
    ...(dataOut ? [`        ${dataOut.name}_r <= ${defaultVhdlValue(dataOut.type)};`] : []),
    ...(validOut ? [`        ${validOut.name}_r <= '0';`] : []),
    '      else',
    ...(validOut ? [`        ${validOut.name}_r <= '0';`] : []),
    `        if ${captureCondition} then`,
    ...(dataOut ? [`          ${dataOut.name}_r <= ${dataIn ? dataIn.name : defaultVhdlValue(dataOut.type)};`] : []),
    ...(validOut ? [`          ${validOut.name}_r <= '1';`] : []),
    '        end if;',
    '      end if;',
    '    end if;',
    '  end process;',
    ...(dataOut ? [`  ${dataOut.name} <= ${dataOut.name}_r;`] : []),
    ...(validOut ? [`  ${validOut.name} <= ${validOut.name}_r;`] : []),
    ...(readyOut ? [`  ${readyOut.name} <= '1';`] : []),
    ...outputPorts(component)
      .filter((port) => port.name !== dataOut?.name && port.name !== validOut?.name && port.name !== readyOut?.name)
      .map((port) => `  ${port.name} <= ${defaultVhdlValue(port.type)};`),
  ];
  return {
    templateId: 'deterministic_sample_input_stage',
    reason: 'Registered sample/stream input stage with ready/valid-safe defaults.',
    content: replaceSkeletonRegions(skeleton || renderLeafSkeleton(contract, component), declarations, statements),
  };
}

function renderStreamBoundaryTemplate(
  contract: FpgaArchitectureContract,
  component: FpgaArchitectureComponentContract,
  skeleton: string,
): DeterministicLeafTemplateResult | null {
  const text = roleText(component);
  if (!/(?:ingress|egress|stream|axis|axi_stream|skid|packet)/.test(text)) return null;
  const clk = findClock(component);
  const rst = findReset(component);
  if (!clk || !rst) return null;
  const dataIn = inputPorts(component).find((port) => vectorRange(port.type) && /(?:data|payload|tdata|sample|din|input)/i.test(port.name));
  const dataOut = outputPorts(component).find((port) => vectorRange(port.type) && /(?:data|payload|tdata|sample|dout|output)/i.test(port.name));
  const validIn = inputPorts(component).find((port) => isScalarLogic(port.type) && /(?:valid|tvalid)/i.test(port.name));
  const readyIn = inputPorts(component).find((port) => isScalarLogic(port.type) && /(?:ready|tready)/i.test(port.name));
  const lastIn = inputPorts(component).find((port) => isScalarLogic(port.type) && /(?:last|tlast)/i.test(port.name));
  const validOut = outputPorts(component).find((port) => isScalarLogic(port.type) && /(?:valid|tvalid)/i.test(port.name));
  const readyOut = outputPorts(component).find((port) => isScalarLogic(port.type) && /(?:ready|tready)/i.test(port.name));
  const lastOut = outputPorts(component).find((port) => isScalarLogic(port.type) && /(?:last|tlast)/i.test(port.name));
  if (!dataOut && !validOut && !readyOut && !lastOut) return null;
  const declarations = [
    ...(dataOut ? [`  signal ${dataOut.name}_r : ${dataOut.type} := ${defaultVhdlValue(dataOut.type)};`] : []),
    ...(validOut ? [`  signal ${validOut.name}_r : std_logic := '0';`] : []),
    ...(lastOut ? [`  signal ${lastOut.name}_r : std_logic := '0';`] : []),
  ];
  const acceptCondition = [
    validIn ? `${validIn.name} = '1'` : 'true',
    readyIn ? `${readyIn.name} = '1'` : '',
  ].filter(Boolean).join(' and ');
  const statements = [
    '  -- DETERMINISTIC_TEMPLATE: stream boundary register preserving ready/valid/data/last behavior.',
    `  ${component.id}_stream_p : process(${clk})`,
    '  begin',
    `    if rising_edge(${clk}) then`,
    `      if ${resetAssertedExpression(rst)} then`,
    ...(dataOut ? [`        ${dataOut.name}_r <= ${defaultVhdlValue(dataOut.type)};`] : []),
    ...(validOut ? [`        ${validOut.name}_r <= '0';`] : []),
    ...(lastOut ? [`        ${lastOut.name}_r <= '0';`] : []),
    '      else',
    ...(validOut ? [`        ${validOut.name}_r <= '0';`] : []),
    ...(lastOut ? [`        ${lastOut.name}_r <= '0';`] : []),
    `        if ${acceptCondition} then`,
    ...(dataOut ? [`          ${dataOut.name}_r <= ${dataIn ? dataIn.name : defaultVhdlValue(dataOut.type)};`] : []),
    ...(validOut ? [`          ${validOut.name}_r <= '1';`] : []),
    ...(lastOut ? [`          ${lastOut.name}_r <= ${lastIn ? lastIn.name : "'0'"};`] : []),
    '        end if;',
    '      end if;',
    '    end if;',
    '  end process;',
    ...(dataOut ? [`  ${dataOut.name} <= ${dataOut.name}_r;`] : []),
    ...(validOut ? [`  ${validOut.name} <= ${validOut.name}_r;`] : []),
    ...(lastOut ? [`  ${lastOut.name} <= ${lastOut.name}_r;`] : []),
    ...(readyOut ? [`  ${readyOut.name} <= '1';`] : []),
    ...outputPorts(component)
      .filter((port) => port.name !== dataOut?.name && port.name !== validOut?.name && port.name !== readyOut?.name && port.name !== lastOut?.name)
      .map((port) => `  ${port.name} <= ${defaultVhdlValue(port.type)};`),
  ];
  return {
    templateId: 'deterministic_stream_boundary_leaf',
    reason: 'Registered stream ingress/egress/skid boundary with conservative handshake behavior.',
    content: replaceSkeletonRegions(skeleton || renderLeafSkeleton(contract, component), declarations, statements),
  };
}

function renderClockedRegisterOrFifoShell(
  contract: FpgaArchitectureContract,
  component: FpgaArchitectureComponentContract,
  skeleton: string,
): DeterministicLeafTemplateResult | null {
  const text = roleText(component);
  if (!/(?:fifo|register|regfile|buffer|counter|timer|status|control|fsm|rom|ram|memory)/.test(text)) return null;
  const outputs = outputPorts(component);
  const clk = findClock(component);
  const rst = findReset(component);
  if (outputs.length === 0) {
    if (!clk) return {
      templateId: 'deterministic_null_leaf_shell',
      reason: 'Compile-safe deterministic shell for a migrated leaf with no declared outputs.',
      content: replaceSkeletonRegions(skeleton || renderLeafSkeleton(contract, component), [], [
        '  -- DETERMINISTIC_TEMPLATE: compile-safe no-output migrated leaf shell.',
        '  -- The architecture contract did not expose observable outputs for this block.',
      ]),
    };
    return {
      templateId: 'deterministic_clocked_null_leaf_shell',
      reason: 'Compile-safe clocked shell for a migrated leaf with no declared outputs.',
      content: replaceSkeletonRegions(skeleton || renderLeafSkeleton(contract, component), [], [
        '  -- DETERMINISTIC_TEMPLATE: clocked no-output migrated leaf shell.',
        `  ${component.id}_p : process(${clk})`,
        '  begin',
        `    if rising_edge(${clk}) then`,
        ...(rst ? [
          `      if ${resetAssertedExpression(rst)} then`,
          '        null;',
          '      else',
          '        null;',
          '      end if;',
        ] : ['      null;']),
        '    end if;',
        '  end process;',
      ]),
    };
  }
  const sameTypedAssignments = outputs.map((output) => {
    const input = inputPorts(component).find((port) => port.type.trim().toLowerCase() === output.type.trim().toLowerCase() && !/clk|rst|reset/i.test(port.name));
    return { output, input };
  });
  if (!clk || !rst) {
    return {
      templateId: 'deterministic_combinational_safe_shell',
      reason: 'Compile-safe deterministic shell for leaf role without clock/reset.',
      content: replaceSkeletonRegions(skeleton || renderLeafSkeleton(contract, component), [], renderDefaultOutputAssignments(component, 'compile-safe leaf shell')),
    };
  }
  const declarations = outputs.map((port) => `  signal ${port.name}_r : ${port.type} := ${defaultVhdlValue(port.type)};`);
  const statements = [
    '  -- DETERMINISTIC_TEMPLATE: clocked safe leaf shell preserving the approved entity.',
    `  ${component.id}_p : process(${clk})`,
    '  begin',
    `    if rising_edge(${clk}) then`,
    `      if ${resetAssertedExpression(rst)} then`,
    ...outputs.map((port) => `        ${port.name}_r <= ${defaultVhdlValue(port.type)};`),
    '      else',
    ...sameTypedAssignments.map(({ output, input }) => input
      ? `        ${output.name}_r <= ${input.name};`
      : `        ${output.name}_r <= ${defaultVhdlValue(output.type)};`),
    '      end if;',
    '    end if;',
    '  end process;',
    ...outputs.map((port) => `  ${port.name} <= ${port.name}_r;`),
  ];
  return {
    templateId: 'deterministic_clocked_safe_leaf',
    reason: 'Clocked deterministic safe leaf shell.',
    content: replaceSkeletonRegions(skeleton || renderLeafSkeleton(contract, component), declarations, statements),
  };
}

export function renderDeterministicLeafTemplate(params: {
  contract: FpgaArchitectureContract;
  component: FpgaArchitectureComponentContract;
  skeleton?: string;
}): DeterministicLeafTemplateResult | null {
  const skeleton = params.skeleton || renderLeafSkeleton(params.contract, params.component);
  const renderers = [
    renderLogicGateTemplate,
    renderAluTemplate,
    renderSampleInputStageTemplate,
    renderStreamBoundaryTemplate,
    renderPixelOrFramebufferTemplate,
    renderPassThroughTemplate,
    renderClockedRegisterOrFifoShell,
  ];
  for (const renderer of renderers) {
    const result = renderer(params.contract, params.component, skeleton);
    if (result) return result;
  }
  return null;
}
