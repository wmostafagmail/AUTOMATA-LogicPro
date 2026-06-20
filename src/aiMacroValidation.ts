import {
  AiMacroId,
  AiMacroValidationCheck,
  AiMacroValidationResult,
  HazardFindingLike,
  ProtocolFrameLike,
  getAiMacroSpec,
} from './aiMacros';

interface ValidateMacroOutputParams {
  macroId: AiMacroId;
  text: string;
  hazardFindings?: HazardFindingLike[];
  protocolFrames?: ProtocolFrameLike[];
}

function normalizeText(text: string) {
  return text.toLowerCase();
}

function extractCodeBlocks(text: string) {
  return [...text.matchAll(/```([^\n`]*)\n([\s\S]*?)```/g)].map((match) => ({
    language: match[1].trim().toLowerCase(),
    content: match[2].trim(),
  }));
}

function hasSectionAlias(text: string, aliases: string[]) {
  const normalized = normalizeText(text);
  return aliases.some((alias) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|\\n)#{0,3}\\s*${escaped}\\b`, 'i').test(text) || normalized.includes(alias.toLowerCase());
  });
}

function buildSectionChecks(macroId: AiMacroId, text: string): AiMacroValidationCheck[] {
  const spec = getAiMacroSpec(macroId);
  return spec.expectedOutputSections.map((section) => {
    const found = hasSectionAlias(text, section.aliases);
    return {
      id: `section:${section.id}`,
      label: `${section.label} section`,
      status: found ? 'pass' : 'fail',
      detail: found
        ? `Found "${section.label}" content.`
        : `Missing "${section.label}" section or equivalent heading.`,
    };
  });
}

function collectKeywords(items: string[]) {
  const stopwords = new Set([
    'the', 'and', 'for', 'near', 'with', 'from', 'that', 'this', 'were', 'tick',
    'ticks', 'signal', 'signals', 'risk', 'suspect', 'detected', 'decode', 'decoded',
    'frame', 'frames', 'protocol', 'using', 'around', 'into', 'out', 'byte',
  ]);
  return [...new Set(
    items
      .flatMap((item) => item.toLowerCase().split(/[^a-z0-9_]+/))
      .filter((token) => token.length >= 3 && !stopwords.has(token))
  )];
}

function buildHazardReferenceCheck(text: string, hazardFindings: HazardFindingLike[]): AiMacroValidationCheck {
  if (hazardFindings.length === 0) {
    const acknowledged = /no obvious hazards? detected|no hazards? detected|no obvious glitch|none were found/i.test(text);
    return {
      id: 'deterministic:hazards',
      label: 'Deterministic hazard findings referenced',
      status: acknowledged ? 'pass' : 'warn',
      detail: acknowledged
        ? 'The response explicitly acknowledges that no obvious hazards were detected.'
        : 'The response should explicitly acknowledge that no deterministic hazards were found.',
    };
  }

  const keywords = collectKeywords(hazardFindings.flatMap((finding) => [finding.title, finding.detail]));
  const normalized = normalizeText(text);
  const mentionsKeyword = keywords.some((keyword) => normalized.includes(keyword));
  const mentionsDomain = /(hazard|glitch|setup|hold|race|pulse)/i.test(text);

  return {
    id: 'deterministic:hazards',
    label: 'Deterministic hazard findings referenced',
    status: mentionsKeyword && mentionsDomain ? 'pass' : 'warn',
    detail: mentionsKeyword && mentionsDomain
      ? 'The response references deterministic hazard findings.'
      : 'The response should reference the actual deterministic hazard scan findings.',
  };
}

function buildProtocolReferenceCheck(text: string, protocolFrames: ProtocolFrameLike[]): AiMacroValidationCheck {
  if (protocolFrames.length === 0) {
    const acknowledged = /no deterministic .*frames|no frames were decoded|no protocol frames|no frames decoded/i.test(text);
    return {
      id: 'deterministic:protocol',
      label: 'Deterministic protocol frames referenced',
      status: acknowledged ? 'pass' : 'warn',
      detail: acknowledged
        ? 'The response explicitly acknowledges that no deterministic frames were decoded.'
        : 'The response should explicitly acknowledge that no deterministic protocol frames were decoded.',
    };
  }

  const keywords = collectKeywords(protocolFrames.flatMap((frame) => [frame.protocol, frame.channel, frame.summary, frame.detail]));
  const normalized = normalizeText(text);
  const mentionsKeyword = keywords.some((keyword) => normalized.includes(keyword));
  const mentionsProtocolDomain = /(spi|i2c|uart|frame|byte|ack|start|stop|address)/i.test(text);

  return {
    id: 'deterministic:protocol',
    label: 'Deterministic protocol frames referenced',
    status: mentionsKeyword && mentionsProtocolDomain ? 'pass' : 'warn',
    detail: mentionsKeyword && mentionsProtocolDomain
      ? 'The response references deterministic protocol frames.'
      : 'The response should reference the actual deterministic protocol pre-decode results.',
  };
}

function buildCodeBlockCheck(macroId: AiMacroId, text: string): AiMacroValidationCheck {
  const spec = getAiMacroSpec(macroId);
  if (!spec.requiresVhdlCodeBlock) {
    return {
      id: 'code:vhdl',
      label: 'VHDL code blocks present',
      status: 'not_applicable',
      detail: 'This macro does not require VHDL code blocks.',
    };
  }

  const codeBlocks = extractCodeBlocks(text);
  const hasVhdlCode = codeBlocks.some((block) => block.language.includes('vhdl') && block.content.length > 0);

  return {
    id: 'code:vhdl',
    label: 'VHDL code blocks present',
    status: hasVhdlCode ? 'pass' : 'fail',
    detail: hasVhdlCode
      ? 'Found at least one tagged VHDL code block.'
      : 'Expected at least one non-empty VHDL code block.',
  };
}

function buildNonEmptyCheck(text: string): AiMacroValidationCheck {
  const useful = text.trim().length >= 80;
  return {
    id: 'body:useful',
    label: 'Useful non-empty response body',
    status: useful ? 'pass' : 'fail',
    detail: useful ? 'The response contains a non-trivial answer body.' : 'The response is too short to be useful.',
  };
}

export function validateMacroOutput({
  macroId,
  text,
  hazardFindings = [],
  protocolFrames = [],
}: ValidateMacroOutputParams): AiMacroValidationResult {
  const spec = getAiMacroSpec(macroId);
  const checks: AiMacroValidationCheck[] = [
    buildNonEmptyCheck(text),
    ...buildSectionChecks(macroId, text),
    buildCodeBlockCheck(macroId, text),
  ];

  if (spec.deterministicContext.hazardScan) {
    checks.push(buildHazardReferenceCheck(text, hazardFindings));
  } else {
    checks.push({
      id: 'deterministic:hazards',
      label: 'Deterministic hazard findings referenced',
      status: 'not_applicable',
      detail: 'Hazard references are not required for this macro.',
    });
  }

  if (spec.deterministicContext.protocolScan) {
    checks.push(buildProtocolReferenceCheck(text, protocolFrames));
  } else {
    checks.push({
      id: 'deterministic:protocol',
      label: 'Deterministic protocol frames referenced',
      status: 'not_applicable',
      detail: 'Protocol frame references are not required for this macro.',
    });
  }

  const failCount = checks.filter((check) => check.status === 'fail').length;
  const warnCount = checks.filter((check) => check.status === 'warn').length;
  const warnings = checks
    .filter((check) => check.status === 'warn' || check.status === 'fail')
    .map((check) => check.detail);

  const status = failCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'pass';
  const summary = status === 'pass'
    ? 'All required macro structure checks passed.'
    : status === 'warn'
      ? `${warnCount} validation warning(s) found, but the output is still usable.`
      : `${failCount} required validation check(s) failed.`;

  return {
    macroId,
    status,
    summary,
    warnings,
    checks,
  };
}
