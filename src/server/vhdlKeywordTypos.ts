import { VHDL_RESERVED_IDENTIFIERS } from './ghdlStrictVhdlRules';

export const MALFORMED_VHDL_KEYWORD_CODE = 'malformed_vhdl_keyword';

export type VhdlKeywordTypoOccurrence = {
  typo: string;
  keyword: string;
  lineNumber: number;
  lineText: string;
  column: number;
  startOffset: number;
  endOffset: number;
};

const MANUAL_KEYWORD_TYPOS: Array<[string, string]> = [
  ['downt', 'downto'],
  ['dowto', 'downto'],
  ['downtoo', 'downto'],
  ['beign', 'begin'],
  ['begn', 'begin'],
  ['singal', 'signal'],
  ['sginal', 'signal'],
  ['architecure', 'architecture'],
  ['archtecture', 'architecture'],
  ['entit', 'entity'],
  ['packge', 'package'],
  ['proces', 'process'],
  ['processe', 'process'],
  ['varible', 'variable'],
  ['constnat', 'constant'],
  ['subytpe', 'subtype'],
  ['functon', 'function'],
  ['procedre', 'procedure'],
  ['generc', 'generic'],
];

function buildKeywordTypoMap() {
  const keywords = new Set(VHDL_RESERVED_IDENTIFIERS.map((value) => value.toLowerCase()));
  const candidates = new Map<string, Set<string>>();
  const add = (typo: string, keyword: string) => {
    const normalizedTypo = typo.toLowerCase();
    const normalizedKeyword = keyword.toLowerCase();
    if (normalizedTypo === normalizedKeyword || keywords.has(normalizedTypo)) return;
    const existing = candidates.get(normalizedTypo) || new Set<string>();
    existing.add(normalizedKeyword);
    candidates.set(normalizedTypo, existing);
  };

  for (const keyword of keywords) {
    if (keyword.length >= 3) {
      for (let index = 0; index < keyword.length; index += 1) {
        add(keyword.slice(0, index) + keyword.slice(index + 1), keyword);
      }
    }
    if (keyword.length >= 4) {
      for (let index = 0; index < keyword.length - 1; index += 1) {
        add(
          `${keyword.slice(0, index)}${keyword[index + 1]}${keyword[index]}${keyword.slice(index + 2)}`,
          keyword,
        );
      }
    }
    if (keyword.length >= 4) {
      add(`${keyword}${keyword[keyword.length - 1]}`, keyword);
    }
  }

  for (const [typo, keyword] of MANUAL_KEYWORD_TYPOS) {
    add(typo, keyword);
  }

  const uniqueCandidates = new Map<string, string>();
  for (const [typo, matches] of candidates) {
    if (matches.size === 1) {
      uniqueCandidates.set(typo, [...matches][0]);
    }
  }
  return uniqueCandidates;
}

const KEYWORD_TYPO_MAP = buildKeywordTypoMap();

function maskLineForVhdlSyntax(line: string) {
  let masked = '';
  let index = 0;
  let inString = false;
  while (index < line.length) {
    const char = line[index];
    const next = line[index + 1];
    if (!inString && char === '-' && next === '-') {
      masked += ' '.repeat(line.length - index);
      break;
    }
    if (char === '"') {
      masked += ' ';
      if (inString && next === '"') {
        masked += ' ';
        index += 2;
        continue;
      }
      inString = !inString;
      index += 1;
      continue;
    }
    if (!inString && char === '\'' && index + 2 < line.length && line[index + 2] === '\'') {
      masked += '   ';
      index += 3;
      continue;
    }
    masked += inString ? ' ' : char;
    index += 1;
  }
  return masked;
}

function startsDeclarativeOrStatementLine(maskedLine: string, start: number) {
  const prefix = maskedLine.slice(0, start).trim();
  return prefix.length === 0 || /^[a-zA-Z][a-zA-Z0-9_]*\s*:\s*$/.test(prefix);
}

function hasKeywordSyntaxContext(maskedLine: string, start: number, end: number, keyword: string) {
  const before = maskedLine.slice(0, start);
  const after = maskedLine.slice(end);
  const beforeCompact = before.toLowerCase();
  const afterCompact = after.toLowerCase();
  const lineLower = maskedLine.toLowerCase();

  if ((keyword === 'downto' || keyword === 'to') && /(?:\(|\brange\s+|[0-9a-zA-Z_')])\s*$/.test(beforeCompact)) {
    return /^\s*(?:[a-zA-Z0-9_('+-]|\d)/.test(after);
  }
  if (['in', 'out', 'inout', 'buffer', 'linkage'].includes(keyword) && /:\s*$/.test(before)) {
    return true;
  }
  if (['entity', 'architecture', 'package', 'library', 'use', 'signal', 'variable', 'constant', 'type', 'subtype', 'component', 'process', 'procedure', 'function', 'begin', 'end', 'if', 'elsif', 'else', 'case', 'when', 'for', 'while', 'loop', 'report', 'assert', 'wait', 'return'].includes(keyword)) {
    if (startsDeclarativeOrStatementLine(maskedLine, start)) return true;
  }
  if (keyword === 'is' && /\b(?:entity|architecture|package|procedure|function|component|process|type|subtype)\b[\s\S]*$/i.test(before)) {
    return true;
  }
  if (keyword === 'then' && /\b(?:if|elsif)\b/.test(beforeCompact)) {
    return true;
  }
  if (keyword === 'loop' && /\b(?:for|while)\b/.test(beforeCompact)) {
    return true;
  }
  if (keyword === 'of' && /\b(?:architecture|array|range)\b/.test(beforeCompact)) {
    return true;
  }
  if (keyword === 'map' && /\b(?:port|generic)\s*$/.test(beforeCompact)) {
    return true;
  }
  if (keyword === 'all' && /\buse\s+[\w.]+\.\s*$/.test(beforeCompact)) {
    return true;
  }
  if (['and', 'or', 'xor', 'xnor', 'nand', 'nor'].includes(keyword) && /\S\s+$/.test(before) && /^\s+\S/.test(after)) {
    return true;
  }
  if (keyword === 'not' && (/\(\s*$/.test(before) || /\b(?:if|elsif|when|and|or|xor|nand|nor)\s+$/.test(beforeCompact))) {
    return true;
  }
  if (['others', 'open', 'null'].includes(keyword) && /(?:=>|\()\s*$/.test(beforeCompact)) {
    return true;
  }
  if (keyword === 'severity' && /\breport\b/.test(beforeCompact)) {
    return true;
  }

  return /\bstd_logic_vector\s*\([^)]*$/i.test(before)
    || /\b(?:if|elsif|case|when|for|while|report|assert)\b/.test(lineLower);
}

export function collectMalformedVhdlKeywordOccurrences(content: string): VhdlKeywordTypoOccurrence[] {
  const occurrences: VhdlKeywordTypoOccurrence[] = [];
  let offset = 0;
  const lines = content.split(/\n/);

  lines.forEach((line, index) => {
    const maskedLine = maskLineForVhdlSyntax(line);
    const tokenRegex = /\b[a-zA-Z][a-zA-Z0-9_]*\b/g;
    for (const match of maskedLine.matchAll(tokenRegex)) {
      if (match.index == null) continue;
      const typo = match[0];
      const keyword = KEYWORD_TYPO_MAP.get(typo.toLowerCase());
      if (!keyword) continue;
      const start = match.index;
      const end = start + typo.length;
      if (!hasKeywordSyntaxContext(maskedLine, start, end, keyword)) continue;
      occurrences.push({
        typo,
        keyword,
        lineNumber: index + 1,
        lineText: line,
        column: start + 1,
        startOffset: offset + start,
        endOffset: offset + end,
      });
    }
    offset += line.length + 1;
  });

  return occurrences;
}

export function repairMalformedVhdlKeywordTypos(content: string) {
  const occurrences = collectMalformedVhdlKeywordOccurrences(content);
  if (occurrences.length === 0) {
    return { content, changed: false, occurrences };
  }

  let nextContent = content;
  for (const occurrence of [...occurrences].sort((left, right) => right.startOffset - left.startOffset)) {
    const originalToken = nextContent.slice(occurrence.startOffset, occurrence.endOffset);
    const replacement = /^[A-Z0-9_]+$/.test(originalToken)
      ? occurrence.keyword.toUpperCase()
      : occurrence.keyword;
    nextContent = `${nextContent.slice(0, occurrence.startOffset)}${replacement}${nextContent.slice(occurrence.endOffset)}`;
  }

  return { content: nextContent, changed: nextContent !== content, occurrences };
}

export function inferMalformedVhdlKeywordOccurrenceFromText(text: string) {
  return collectMalformedVhdlKeywordOccurrences(text)[0] || null;
}
