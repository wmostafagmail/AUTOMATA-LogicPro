import fs from 'fs/promises';
import path from 'path';
import type { RepairableGeneratedFile } from './generatedCodeRepair';
import type { GeneratedVhdlFailureDetail, GeneratedVhdlValidationResult } from './generatedVhdlValidation';
import { collectProcedureScopeSnapshots } from './vhdlScopeAnalysis';

type DeterministicRepairResult = {
  repairedFiles: RepairableGeneratedFile[];
  changed: boolean;
  appliedCodes: string[];
};

type StatementExtractionResult = {
  statement: string;
  start: number;
  end: number;
};

type ProcessRegion = {
  start: number;
  end: number;
  beginIndex: number;
};

function locateProcessDeclarativeBeginOffset(processBlock: string) {
  const headerMatch = /\bprocess(?:\s*\([^)]*\))?/i.exec(processBlock);
  const searchStart = headerMatch ? headerMatch.index + headerMatch[0].length : 0;
  const tokenExpression = /\b(begin|procedure|function|end)\b/gi;
  let announcedSubprograms = 0;
  let activeSubprogramBodies = 0;

  for (const match of processBlock.matchAll(tokenExpression)) {
    if (match.index == null || match.index < searchStart) continue;
    const token = match[1].toLowerCase();
    const prefix = processBlock.slice(Math.max(0, match.index - 12), match.index).toLowerCase();
    const isEndQualifiedToken = /\bend\s+$/.test(prefix);

    if ((token === 'procedure' || token === 'function') && !isEndQualifiedToken) {
      announcedSubprograms += 1;
      continue;
    }

    if (token === 'begin') {
      if (announcedSubprograms > 0) {
        announcedSubprograms -= 1;
        activeSubprogramBodies += 1;
        continue;
      }
      if (activeSubprogramBodies === 0) {
        return match.index;
      }
      continue;
    }

    if ((token === 'procedure' || token === 'function') && isEndQualifiedToken) {
      activeSubprogramBodies = Math.max(0, activeSubprogramBodies - 1);
    }
  }

  return processBlock.toLowerCase().indexOf('begin', searchStart);
}

function normalizeRelativePath(value: string) {
  return value.replace(/\\/g, '/').toLowerCase();
}

function pathsReferToSameFile(left: string, right: string) {
  const normalizedLeft = normalizeRelativePath(left);
  const normalizedRight = normalizeRelativePath(right);
  return normalizedLeft === normalizedRight
    || normalizedLeft.endsWith(`/${normalizedRight}`)
    || normalizedRight.endsWith(`/${normalizedLeft}`);
}

function isLikelyTestbenchRelativePath(relativePath: string) {
  const normalized = normalizeRelativePath(relativePath);
  return normalized.includes('/tb/')
    || /(?:^|\/)tb_[^/]+\.vhd$/i.test(normalized)
    || /(?:^|\/)[^/]+_tb\.vhd$/i.test(normalized);
}

function collectDeclaredNames(content: string, kind: 'variable' | 'signal') {
  const expression = kind === 'variable'
    ? /\bvariable\s+([a-zA-Z][a-zA-Z0-9_]*)\b/g
    : /\bsignal\s+([a-zA-Z][a-zA-Z0-9_]*)\b/g;
  return Array.from(content.matchAll(expression))
    .map((match) => match[1])
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
}

function collectProcessRegions(content: string) {
  const regions: ProcessRegion[] = [];
  const processExpression = /\bprocess(?:\s*\([^)]*\))?[\s\S]*?end\s+process\b[^;]*;/gi;

  for (const match of content.matchAll(processExpression)) {
    if (match.index == null) continue;
    const beginOffset = locateProcessDeclarativeBeginOffset(match[0]);
    if (beginOffset < 0) continue;
    const start = match.index;
    const end = start + match[0].length;
    regions.push({
      start,
      end,
      beginIndex: start + beginOffset,
    });
  }

  return regions;
}

function collectObjectUsageIndices(content: string, objectName: string, startIndex = 0) {
  const escapedName = objectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = new RegExp(`\\b${escapedName}\\b`, 'g');
  const usageIndices: number[] = [];

  for (const match of content.matchAll(expression)) {
    if (match.index == null || match.index < startIndex) continue;
    usageIndices.push(match.index);
  }

  return usageIndices;
}

function replaceAssignmentOperator(params: {
  content: string;
  objectName: string;
  nextOperator: ':=' | '<=';
}) {
  const escapedName = params.objectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = new RegExp(`(^|[\\s;(])(${escapedName})(\\s*)(?:<=|:=)`, 'gm');
  let changed = false;
  const content = params.content.replace(expression, (match, prefix, name, spacing) => {
    const next = `${prefix}${name}${spacing}${params.nextOperator}`;
    if (next !== match) {
      changed = true;
    }
    return next;
  });
  return { content, changed };
}

function repairConditionalAssignmentOperatorMisuse(content: string, objectName: string, rhsExpression: string) {
  const escapedName = objectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedRhs = rhsExpression.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let changed = false;
  let nextContent = content;

  const upperBoundCondition = new RegExp(
    `(\\b(?:if|elsif)\\b[^;\\n]*?\\b${escapedName}\\s*(?:>=|>)\\s*[^;\\n]*?\\band\\s*)\\b${escapedName}\\s*:=\\s*(${escapedRhs})([^;\\n]*?\\bthen\\b)`,
    'gi',
  );
  nextContent = nextContent.replace(upperBoundCondition, (match, prefix, rhs, suffix) => {
    changed = true;
    return `${prefix}${objectName} <= ${rhs.trim()}${suffix}`;
  });

  const lowerBoundCondition = new RegExp(
    `(\\b(?:if|elsif)\\b[^;\\n]*?\\b${escapedName}\\s*(?:<=|<)\\s*[^;\\n]*?\\band\\s*)\\b${escapedName}\\s*:=\\s*(${escapedRhs})([^;\\n]*?\\bthen\\b)`,
    'gi',
  );
  nextContent = nextContent.replace(lowerBoundCondition, (match, prefix, rhs, suffix) => {
    changed = true;
    return `${prefix}${objectName} >= ${rhs.trim()}${suffix}`;
  });

  const genericCondition = new RegExp(
    `(\\b(?:if|elsif)\\b[^;\\n]*?)\\b${escapedName}\\s*:=\\s*(${escapedRhs})([^;\\n]*?\\bthen\\b)`,
    'gi',
  );
  nextContent = nextContent.replace(genericCondition, (match, prefix, rhs, suffix) => {
    changed = true;
    return `${prefix}${objectName} = ${rhs.trim()}${suffix}`;
  });

  const assertCondition = new RegExp(
    `(\\bassert\\b[^;\\n]*?)\\b${escapedName}\\s*:=\\s*(${escapedRhs})([^;\\n]*(?:\\breport\\b|\\bseverity\\b|;))`,
    'gi',
  );
  nextContent = nextContent.replace(assertCondition, (match, prefix, rhs, suffix) => {
    changed = true;
    return `${prefix}${objectName} = ${rhs.trim()}${suffix}`;
  });

  const whenCondition = new RegExp(
    `(\\bwhen\\b[^;\\n]*?)\\b${escapedName}\\s*:=\\s*(${escapedRhs})([^;\\n]*(?:\\belse\\b|,|;))`,
    'gi',
  );
  nextContent = nextContent.replace(whenCondition, (match, prefix, rhs, suffix) => {
    changed = true;
    return `${prefix}${objectName} = ${rhs.trim()}${suffix}`;
  });

  return { content: nextContent, changed };
}

function repairAllConditionalAssignmentOperatorMisuse(content: string) {
  let changed = false;
  const conditionExpression = /\b(if|elsif)\s+([^;\n]*?:=[^;\n]*?)\s+then\b/gi;
  const nextContent = content.replace(conditionExpression, (match, keyword, conditionText) => {
    let conditionChanged = false;
    const repairedCondition = String(conditionText).replace(
      /\b([a-zA-Z][a-zA-Z0-9_]*)\s*:=\s*([^;\n,)]+?)(?=\s+(?:and|or)\b|\s*$)/gi,
      (assignmentMatch, objectName, rhsExpression, offset, fullCondition) => {
        const conditionPrefix = String(fullCondition).slice(0, offset);
        const escapedName = String(objectName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const isUpperBoundCheck = new RegExp(`\\b${escapedName}\\s*(?:>=|>)\\s*`, 'i').test(conditionPrefix);
        const isLowerBoundCheck = new RegExp(`\\b${escapedName}\\s*(?:<=|<)\\s*`, 'i').test(conditionPrefix);
        conditionChanged = true;
        if (isUpperBoundCheck) {
          return `${objectName} <= ${String(rhsExpression).trim()}`;
        }
        if (isLowerBoundCheck) {
          return `${objectName} >= ${String(rhsExpression).trim()}`;
        }
        return `${objectName} = ${String(rhsExpression).trim()}`;
      },
    );

    if (!conditionChanged) {
      return match;
    }
    changed = true;
    return `${keyword} ${repairedCondition} then`;
  });

  return { content: nextContent, changed };
}

function ensureUseClause(content: string, clause: string) {
  if (new RegExp(`^\\s*use\\s+${clause.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*;`, 'im').test(content)) {
    return { content, changed: false };
  }

  const libraryMatch = content.match(/^\s*library\s+ieee\s*;\s*$/im);
  if (libraryMatch?.index != null) {
    const insertIndex = libraryMatch.index + libraryMatch[0].length;
    return {
      content: `${content.slice(0, insertIndex)}\nuse ${clause};${content.slice(insertIndex)}`,
      changed: true,
    };
  }

  return {
    content: `library ieee;\nuse ${clause};\n${content}`,
    changed: true,
  };
}

function splitIdentifierList(value: string) {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function splitTopLevelArguments(value: string) {
  return splitTopLevelSegments(value, ',');
}

function splitTopLevelSegments(value: string, delimiter: ',' | ';') {
  const parts: string[] = [];
  let depth = 0;
  let current = '';

  for (const char of value) {
    if (char === '(') {
      depth += 1;
      current += char;
      continue;
    }
    if (char === ')') {
      depth = Math.max(0, depth - 1);
      current += char;
      continue;
    }
    if (char === delimiter && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function extractFormalIdentifier(clause: string) {
  const normalizedClause = clause.trim();
  return normalizedClause.match(/^(?:(?:signal|variable|constant)\s+)?([a-zA-Z][a-zA-Z0-9_]*)\s*:/i)?.[1]
    || normalizedClause.match(/^(?:signal|variable|constant|in|out|inout|buffer|linkage)\s+([a-zA-Z][a-zA-Z0-9_]*)\s*:/i)?.[1]
    || null;
}

function inferFormalUsageStyle(body: string, formalName: string) {
  const escapedName = formalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`\\b${escapedName}\\s*<=`, 'i').test(body)) {
    return { objectClass: 'signal', mode: 'out' } as const;
  }
  if (new RegExp(`\\b${escapedName}\\s*:=`, 'i').test(body)) {
    return { objectClass: 'variable', mode: 'inout' } as const;
  }
  return null;
}

function normalizeMalformedFormalClause(clause: string, body: string) {
  const normalizedClause = clause.trim();
  if (!normalizedClause) {
    return { clause, changed: false };
  }

  const duplicateClassMatch = normalizedClause.match(
    /^(signal|variable|constant)\s+([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(signal|variable|constant)\s+(.*)$/i,
  );
  if (duplicateClassMatch) {
    return {
      clause: `${duplicateClassMatch[1]} ${duplicateClassMatch[2]} : ${duplicateClassMatch[4].trim()}`,
      changed: true,
    };
  }

  const postColonClassMatch = normalizedClause.match(
    /^([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(signal|variable|constant)(?:\s+(in|out|inout|buffer|linkage))?\s+(.+)$/i,
  );
  if (postColonClassMatch) {
    const usage = inferFormalUsageStyle(body, postColonClassMatch[1]);
    const objectClass = postColonClassMatch[2].toLowerCase();
    const mode = (postColonClassMatch[3] || usage?.mode || (objectClass === 'signal' ? 'out' : 'inout')).toLowerCase();
    return {
      clause: `${objectClass} ${postColonClassMatch[1]} : ${mode} ${postColonClassMatch[4].trim()}`,
      changed: true,
    };
  }

  const duplicateModeMatch = normalizedClause.match(
    /^(in|out|inout|buffer|linkage)\s+([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(in|out|inout|buffer|linkage)\s+(.+)$/i,
  );
  if (duplicateModeMatch) {
    const usage = inferFormalUsageStyle(body, duplicateModeMatch[2]);
    const prefix = usage ? `${usage.objectClass} ` : '';
    const mode = usage?.mode || duplicateModeMatch[3].toLowerCase();
    return {
      clause: `${prefix}${duplicateModeMatch[2]} : ${mode} ${duplicateModeMatch[4].trim()}`,
      changed: true,
    };
  }

  const leadingModeMatch = normalizedClause.match(
    /^(in|out|inout|buffer|linkage)\s+([a-zA-Z][a-zA-Z0-9_]*)\s*:\s+(.+)$/i,
  );
  if (leadingModeMatch) {
    const usage = inferFormalUsageStyle(body, leadingModeMatch[2]);
    const prefix = usage ? `${usage.objectClass} ` : '';
    const mode = usage?.mode || leadingModeMatch[1].toLowerCase();
    return {
      clause: `${prefix}${leadingModeMatch[2]} : ${mode} ${leadingModeMatch[3].trim()}`,
      changed: true,
    };
  }

  return { clause, changed: false };
}

type ParsedFormalClause = {
  objectClass: 'signal' | 'variable' | 'constant' | null;
  names: string[];
  mode: 'in' | 'out' | 'inout' | 'buffer' | 'linkage' | null;
  subtype: string;
};

function parseFormalClause(clause: string): ParsedFormalClause | null {
  const match = clause.match(
    /^\s*(?:(signal|variable|constant)\s+)?([a-zA-Z][a-zA-Z0-9_,\s]*)\s*:\s*(?:(in|out|inout|buffer|linkage)\s+)?(.+?)\s*$/i,
  );
  if (!match) {
    return null;
  }

  return {
    objectClass: (match[1]?.toLowerCase() as ParsedFormalClause['objectClass']) || null,
    names: splitIdentifierList(match[2]),
    mode: (match[3]?.toLowerCase() as ParsedFormalClause['mode']) || null,
    subtype: match[4].trim(),
  };
}

function rewriteClockEdgeHelperFormalAsSignal(content: string, subprogramName: string, formalName: string) {
  const escapedName = subprogramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const subprogramExpression = new RegExp(
    `(\\b(function|procedure)\\s+${escapedName}\\s*\\()([\\s\\S]*?)(\\)\\s*(?:return\\s+[^;\\n]+?(?:\\s+is\\b|\\s*;)|is\\b))([\\s\\S]*?end\\s+(?:function|procedure)(?:\\s+${escapedName})?\\s*;)`,
    'i',
  );
  const match = subprogramExpression.exec(content);
  if (!match || match.index == null) {
    return { content, changed: false };
  }

  const clauses = splitTopLevelSegments(match[3], ';');
  let changed = false;
  const rewrittenClauses: string[] = [];

  for (const clause of clauses) {
    const parsed = parseFormalClause(clause);
    if (!parsed || !parsed.names.some((name) => name.toLowerCase() === formalName.toLowerCase())) {
      rewrittenClauses.push(clause.trim());
      continue;
    }

    if (parsed.objectClass === 'signal') {
      rewrittenClauses.push(clause.trim());
      continue;
    }

    const remainingNames = parsed.names.filter((name) => name.toLowerCase() !== formalName.toLowerCase());
    if (remainingNames.length > 0) {
      const prefix = parsed.objectClass ? `${parsed.objectClass} ` : '';
      const mode = parsed.mode ? `${parsed.mode} ` : '';
      rewrittenClauses.push(`${prefix}${remainingNames.join(', ')} : ${mode}${parsed.subtype}`.trim());
    }

    rewrittenClauses.push(`signal ${formalName} : in ${parsed.subtype}`);
    changed = true;
  }

  if (!changed) {
    return { content, changed: false };
  }

  const replacement = `${match[1]}${rewrittenClauses.join('; ')}${match[4]}${match[5]}`;
  return {
    content: `${content.slice(0, match.index)}${replacement}${content.slice(match.index + match[0].length)}`,
    changed: true,
  };
}

function normalizeNamedProcedureFormalSyntax(content: string, procedureName: string) {
  const escapedName = procedureName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const procedureExpression = new RegExp(
    `(\\bprocedure\\s+${escapedName}\\s*\\()([\\s\\S]*?)(\\)\\s*is)([\\s\\S]*?end\\s+procedure(?:\\s+${escapedName})?\\s*;)`,
    'i',
  );
  const procedureMatch = procedureExpression.exec(content);
  if (!procedureMatch || procedureMatch.index == null) {
    return { content, changed: false };
  }

  const parameterClauses = splitTopLevelSegments(procedureMatch[2], ';');
  let changed = false;
  const rewrittenClauses = parameterClauses.map((clause) => {
    const normalized = normalizeMalformedFormalClause(clause, procedureMatch[4]);
    changed = changed || normalized.changed;
    return normalized.clause.trim();
  });
  if (!changed) {
    return { content, changed: false };
  }

  const nextParameterText = rewrittenClauses.join('; ');
  const replacement = `${procedureMatch[1]}${nextParameterText}${procedureMatch[3]}${procedureMatch[4]}`;
  return {
    content: `${content.slice(0, procedureMatch.index)}${replacement}${content.slice(procedureMatch.index + procedureMatch[0].length)}`,
    changed: true,
  };
}

function isIndexInsideLineComment(content: string, index: number) {
  const lineStart = content.lastIndexOf('\n', index - 1) + 1;
  const linePrefix = content.slice(lineStart, index);
  const commentIndex = linePrefix.indexOf('--');
  return commentIndex >= 0;
}

function collectNamedCallSpans(content: string, subprogramName: string) {
  const spans: Array<{ start: number; end: number; actualText: string }> = [];
  const escapedName = subprogramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = new RegExp(`\\b${escapedName}\\s*\\(`, 'g');

  for (const match of content.matchAll(expression)) {
    const start = match.index ?? -1;
    if (start < 0) continue;
    const openParenIndex = start + match[0].lastIndexOf('(');
    let depth = 0;
    let closeParenIndex = -1;
    for (let index = openParenIndex; index < content.length; index += 1) {
      const char = content[index];
      if (char === '(') {
        depth += 1;
      } else if (char === ')') {
        depth -= 1;
        if (depth === 0) {
          closeParenIndex = index;
          break;
        }
      }
    }
    if (closeParenIndex < 0) continue;
    spans.push({
      start,
      end: closeParenIndex + 1,
      actualText: content.slice(openParenIndex + 1, closeParenIndex),
    });
  }

  return spans;
}

function relaxConstrainedStringFormals(content: string, subprogramName: string) {
  const escapedName = subprogramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const headerExpression = new RegExp(
    `(\\b(?:function|procedure)\\s+${escapedName}\\s*\\()([\\s\\S]*?)(\\)\\s*(?:return\\s+[^;\\n]+?(?:\\s+is\\b|\\s*;)|is\\b))`,
    'i',
  );
  const headerMatch = headerExpression.exec(content);
  if (!headerMatch || headerMatch.index == null) {
    return { content, changed: false };
  }

  const parameterText = headerMatch[2];
  const nextParameterText = parameterText.replace(
    /(:\s*(?:(?:in|out|inout|buffer|linkage)\s+)?)string\s*\([^)]*\)/gi,
    '$1string',
  );
  if (nextParameterText === parameterText) {
    return { content, changed: false };
  }

  const replacement = `${headerMatch[1]}${nextParameterText}${headerMatch[3]}`;
  return {
    content: `${content.slice(0, headerMatch.index)}${replacement}${content.slice(headerMatch.index + headerMatch[0].length)}`,
    changed: true,
  };
}

function rewriteUnconstrainedStringVariable(content: string, variableName: string) {
  const escapedName = variableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const declarationExpression = new RegExp(`^[ \\t]*variable\\s+${escapedName}\\s*:\\s*string\\s*;\\s*$`, 'im');
  const declarationMatch = declarationExpression.exec(content);
  if (!declarationMatch || declarationMatch.index == null) {
    return { content, changed: false };
  }

  const assignmentExpression = new RegExp(`\\b${escapedName}\\s*:=\\s*(\"(?:[^\"]|\"\")*\")\\s*;`, 'gi');
  const assignments = Array.from(content.matchAll(assignmentExpression));
  const distinctLiterals = Array.from(new Set(assignments.map((match) => match[1])));
  if (distinctLiterals.length !== 1) {
    return { content, changed: false };
  }

  const literal = distinctLiterals[0];
  let nextContent = content.replace(declarationExpression, '');
  nextContent = nextContent.replace(assignmentExpression, '');
  nextContent = nextContent.replace(new RegExp(`\\b${escapedName}\\b`, 'g'), literal);
  return {
    content: nextContent.replace(/\n{3,}/g, '\n\n'),
    changed: nextContent !== content,
  };
}

function rewriteIllegalScalarTypeAlias(content: string, aliasName: string, baseType: string) {
  const expression = new RegExp(
    `\\btype\\s+${aliasName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s+is\\s+${baseType.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s+range\\b`,
    'i',
  );
  if (!expression.test(content)) {
    return { content, changed: false };
  }

  const nextContent = content.replace(
    expression,
    `subtype ${aliasName} is ${baseType} range`,
  );

  return {
    content: nextContent,
    changed: nextContent !== content,
  };
}

function removeSubtypeReconstraint(content: string, subtypeName: string, baseName: string) {
  const expression = new RegExp(
    `\\bsubtype\\s+${subtypeName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s+is\\s+${baseName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s*\\([^;]*\\)\\s*;`,
    'i',
  );
  if (!expression.test(content)) {
    return { content, changed: false };
  }

  const nextContent = content.replace(
    expression,
    `subtype ${subtypeName} is ${baseName};`,
  );

  return {
    content: nextContent,
    changed: nextContent !== content,
  };
}

function rewriteScalarBitStringAssignment(content: string, objectName: string, bitStringLiteral: string) {
  const bits = bitStringLiteral.replace(/"/g, '');
  if (!/^[01]+$/.test(bits)) {
    return { content, changed: false };
  }

  const numericValue = parseInt(bits, 2);
  const expression = new RegExp(
    `(\\b(?:constant|signal|variable)\\s+${objectName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s*:\\s*(?:integer|natural|positive)\\b[^;\\n]*:=\\s*)${bitStringLiteral.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}`,
    'i',
  );
  if (!expression.test(content)) {
    return { content, changed: false };
  }

  const nextContent = content.replace(expression, `$1${numericValue}`);
  return {
    content: nextContent,
    changed: nextContent !== content,
  };
}

function rewriteResizeWidthRangeToLength(content: string, targetRange: string) {
  const escapedRange = targetRange.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = new RegExp(`\\bresize\\s*\\(([^,]+),\\s*${escapedRange}\\s*\\)`, 'g');
  let changed = false;
  const nextContent = content.replace(expression, (_match, leftOperand) => {
    changed = true;
    return `resize(${leftOperand.trim()}, ${targetRange.replace(/'range$/i, "'length")})`;
  });
  return { content: nextContent, changed };
}

function rewriteResizeOnRawStdLogicVector(content: string, identifier: string) {
  const escapedIdentifier = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = new RegExp(`\\bresize\\s*\\(\\s*${escapedIdentifier}\\s*,`, 'g');
  let changed = false;
  const nextContent = content.replace(expression, () => {
    changed = true;
    return `resize(unsigned(${identifier}),`;
  });
  return { content: nextContent, changed };
}

function rewriteShiftOnRawStdLogicVector(params: {
  content: string;
  functionName: 'shift_left' | 'shift_right';
  identifier: string;
}) {
  const escapedIdentifier = params.identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = new RegExp(`\\b${params.functionName}\\s*\\(\\s*${escapedIdentifier}\\s*,`, 'g');
  let changed = false;
  const nextContent = params.content.replace(expression, () => {
    changed = true;
    return `${params.functionName}(unsigned(${params.identifier}),`;
  });
  return { content: nextContent, changed };
}

function rewriteToIntegerOnRawLogicType(content: string, identifier: string, kind: 'std_logic' | 'std_logic_vector') {
  const escapedIdentifier = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = new RegExp(`\\bto_integer\\s*\\(\\s*${escapedIdentifier}\\s*\\)`, 'g');
  let changed = false;
  const nextContent = content.replace(expression, () => {
    changed = true;
    if (kind === 'std_logic') {
      return `to_integer(unsigned'("0" & ${identifier}))`;
    }
    return `to_integer(unsigned(${identifier}))`;
  });
  return { content: nextContent, changed };
}

function ensureTbSafeLogicIndexHelper(content: string, helperName: 'tb_safe_slv_to_index' | 'tb_safe_signed_to_index') {
  if (new RegExp(`\\bfunction\\s+${helperName}\\b`, 'i').test(content)) {
    return { content, changed: false };
  }

  const beginIndex = locateArchitectureBeginIndex(content);
  if (beginIndex == null) {
    return { content, changed: false };
  }

  const helperBody = helperName === 'tb_safe_signed_to_index'
    ? [
      '  function tb_safe_signed_to_index(value : std_logic_vector) return integer is',
      '  begin',
      "    for i in value'range loop",
      "      if value(i) /= '0' and value(i) /= '1' then",
      '        return 0;',
      '      end if;',
      '    end loop;',
      '    return to_integer(signed(value));',
      '  end function tb_safe_signed_to_index;',
      '',
    ].join('\n')
    : [
      '  function tb_safe_slv_to_index(value : std_logic_vector) return natural is',
      '  begin',
      "    for i in value'range loop",
      "      if value(i) /= '0' and value(i) /= '1' then",
      '        return 0;',
      '      end if;',
      '    end loop;',
      '    return to_integer(unsigned(value));',
      '  end function tb_safe_slv_to_index;',
      '',
    ].join('\n');

  return {
    content: `${content.slice(0, beginIndex)}${helperBody}${content.slice(beginIndex)}`,
    changed: true,
  };
}

function rewriteUnsafeTbLogicIndexConversion(params: {
  content: string;
  expression: string;
  indexIdentifier: string;
  conversionKind: 'unsigned' | 'signed';
}) {
  const helperName = params.conversionKind === 'signed'
    ? 'tb_safe_signed_to_index'
    : 'tb_safe_slv_to_index';
  const escapedExpression = params.expression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expressionPattern = new RegExp(escapedExpression, 'g');

  let changed = false;
  let nextContent = params.content.replace(expressionPattern, (_match, offset, whole) => {
    const matchIndex = typeof offset === 'number' ? offset : whole.indexOf(params.expression);
    if (isIndexInsideLineComment(whole, matchIndex)) {
      return params.expression;
    }
    changed = true;
    return params.expression.replace(
      /to_integer\s*\(\s*(unsigned|signed)\s*\(\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\)\s*\)/i,
      `${helperName}($2)`,
    );
  });

  if (!changed) {
    return { content: params.content, changed: false };
  }

  const helperResult = ensureTbSafeLogicIndexHelper(nextContent, helperName);
  nextContent = helperResult.content;
  changed = changed || helperResult.changed;
  return { content: nextContent, changed };
}

function rewriteInvalidRangeMembershipSyntax(content: string) {
  const rangeMembershipPattern = /\b(if|elsif)(\s+)([a-zA-Z][a-zA-Z0-9_]*)\s+in\s+([^;\n]+?)\s+to\s+([^;\n]+?)\s+then\b/gi;
  let changed = false;
  const nextContent = content.replace(rangeMembershipPattern, (match, keyword, spacing, subject, lowerBound, upperBound, offset, whole) => {
    if (typeof offset === 'number' && isIndexInsideLineComment(whole, offset)) {
      return match;
    }
    changed = true;
    return `${keyword}${spacing}${subject.trim()} >= ${lowerBound.trim()} and ${subject.trim()} <= ${upperBound.trim()} then`;
  });

  return { content: nextContent, changed };
}

function rewriteTypedBitwiseMismatch(params: {
  content: string;
  lhsType: 'unsigned' | 'signed';
  leftOperand: string;
  operatorKeyword: string;
  rightOperand: string;
}) {
  const escapedLeft = params.leftOperand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedRight = params.rightOperand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedOperator = params.operatorKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = new RegExp(`\\b${escapedLeft}\\s+${escapedOperator}\\s+${escapedRight}\\b`, 'g');
  let changed = false;
  const nextContent = params.content.replace(expression, () => {
    changed = true;
    return `${params.lhsType}(${params.leftOperand}) ${params.operatorKeyword} ${params.lhsType}(${params.rightOperand})`;
  });
  return { content: nextContent, changed };
}

function rewriteTypedUnaryMismatch(params: {
  content: string;
  lhsType: 'unsigned' | 'signed';
  operand: string;
}) {
  const escapedOperand = params.operand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = new RegExp(`\\bnot\\s+${escapedOperand}\\b`, 'g');
  let changed = false;
  const nextContent = params.content.replace(expression, () => {
    changed = true;
    return `not ${params.lhsType}(${params.operand})`;
  });
  return { content: nextContent, changed };
}

function rewriteTypedHelperActualMismatch(params: {
  content: string;
  subprogramName: string;
  actualExpression: string;
  formalType: 'unsigned' | 'signed';
}) {
  let changed = false;
  const targetExpression = params.actualExpression.trim();
  let nextContent = params.content;

  for (const span of collectNamedCallSpans(nextContent, params.subprogramName).reverse()) {
    const actuals = splitTopLevelArguments(span.actualText);
    let spanChanged = false;
    const rewrittenActuals = actuals.map((actual) => {
      const trimmed = actual.trim();
      const namedAssociationMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9_]*\s*=>\s*)(.+)$/);
      const rhs = namedAssociationMatch ? namedAssociationMatch[2].trim() : trimmed;
      if (rhs !== targetExpression) {
        return actual;
      }
      const wrapped = `${params.formalType}(${targetExpression})`;
      if (rhs === wrapped) {
        return actual;
      }
      spanChanged = true;
      if (namedAssociationMatch) {
        return `${namedAssociationMatch[1]}${wrapped}`;
      }
      return wrapped;
    });

    if (!spanChanged) continue;
    changed = true;
    nextContent = `${nextContent.slice(0, span.start)}${params.subprogramName}(${rewrittenActuals.join(', ')})${nextContent.slice(span.end)}`;
  }

  return { content: nextContent, changed };
}

function rewriteTypedFunctionResultMismatch(params: {
  content: string;
  functionName: string;
  lhsName: string;
  lhsType: 'unsigned' | 'signed';
}) {
  let changed = false;
  let nextContent = params.content;
  const escapedLhs = params.lhsName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  for (const span of collectNamedCallSpans(nextContent, params.functionName).reverse()) {
    const statementStart = Math.max(
      nextContent.lastIndexOf(';', span.start),
      nextContent.lastIndexOf('\n', span.start),
    ) + 1;
    const leadingStatement = nextContent.slice(statementStart, span.start);
    if (!new RegExp(`\\b${escapedLhs}\\s*(?::=|<=|=)\\s*$`, 'i').test(leadingStatement)) {
      continue;
    }

    const functionCall = nextContent.slice(span.start, span.end);
    const wrappedCall = `${params.lhsType}(${functionCall})`;
    if (functionCall === wrappedCall) {
      continue;
    }

    changed = true;
    nextContent = `${nextContent.slice(0, span.start)}${wrappedCall}${nextContent.slice(span.end)}`;
  }

  return { content: nextContent, changed };
}

function rewriteTypedPortAssociationMismatch(params: {
  content: string;
  actualExpression: string;
  formalType: 'unsigned' | 'signed';
  portName?: string;
}) {
  const escapedActual = params.actualExpression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wrappedActual = `${params.formalType}(${params.actualExpression})`;
  let changed = false;
  let nextContent = params.content;

  if (params.portName) {
    const escapedPort = params.portName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const namedAssociationExpression = new RegExp(`(\\b${escapedPort}\\s*=>\\s*)${escapedActual}(\\s*(?:,|\\)))`, 'g');
    nextContent = nextContent.replace(namedAssociationExpression, (_match, prefix, suffix) => {
      changed = true;
      return `${prefix}${wrappedActual}${suffix}`;
    });
  }

  if (changed) {
    return { content: nextContent, changed };
  }

  const genericAssociationExpression = new RegExp(`(=>\\s*)${escapedActual}(\\s*(?:,|\\)))`, 'g');
  nextContent = nextContent.replace(genericAssociationExpression, (_match, prefix, suffix) => {
    changed = true;
    return `${prefix}${wrappedActual}${suffix}`;
  });

  return { content: nextContent, changed };
}

function extractNamedStatement(params: {
  content: string;
  startIndex?: number;
  pattern: RegExp;
}): StatementExtractionResult | null {
  const searchContent = params.startIndex != null
    ? params.content.slice(params.startIndex)
    : params.content;
  const flags = params.pattern.flags.includes('g') ? params.pattern.flags : `${params.pattern.flags}g`;
  const scopedPattern = new RegExp(params.pattern.source, flags);

  for (const match of searchContent.matchAll(scopedPattern)) {
    if (match.index == null) continue;
    const statementStart = (params.startIndex || 0) + match.index;
    if (isIndexInsideLineComment(params.content, statementStart)) {
      continue;
    }
    const semicolonIndex = params.content.indexOf(';', statementStart);
    if (semicolonIndex < 0) continue;

    return {
      statement: params.content.slice(statementStart, semicolonIndex + 1),
      start: statementStart,
      end: semicolonIndex + 1,
    };
  }

  return null;
}

function extractExecutableRegionStatement(params: {
  content: string;
  pattern: RegExp;
}): StatementExtractionResult | null {
  const flags = params.pattern.flags.includes('g') ? params.pattern.flags : `${params.pattern.flags}g`;
  const scopedPattern = new RegExp(params.pattern.source, flags);

  for (const match of params.content.matchAll(scopedPattern)) {
    if (match.index == null) continue;

    const statementStart = match.index;
    if (isIndexInsideLineComment(params.content, statementStart)) {
      continue;
    }
    const nearestBegin = locateNearestExecutableBeginIndex(params.content, statementStart);
    if (nearestBegin == null || statementStart <= nearestBegin) {
      continue;
    }

    const semicolonIndex = params.content.indexOf(';', statementStart);
    if (semicolonIndex < 0) {
      continue;
    }

    return {
      statement: params.content.slice(statementStart, semicolonIndex + 1),
      start: statementStart,
      end: semicolonIndex + 1,
    };
  }

  return null;
}

function extractSubprogramBlock(params: {
  content: string;
  startIndex?: number;
  subprogramKind: 'function' | 'procedure';
  subprogramName: string;
}): StatementExtractionResult | null {
  const escapedKind = params.subprogramKind.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedName = params.subprogramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const searchContent = params.startIndex != null
    ? params.content.slice(params.startIndex)
    : params.content;
  const declarationExpression = new RegExp(`^\\s*${escapedKind}\\s+${escapedName}\\b`, 'gim');

  for (const match of searchContent.matchAll(declarationExpression)) {
    if (match.index == null) continue;
    const blockStart = (params.startIndex || 0) + match.index;
    if (isIndexInsideLineComment(params.content, blockStart)) {
      continue;
    }

    const remainder = params.content.slice(blockStart);
    const endExpression = new RegExp(`\\bend\\s+(?:${escapedKind}(?:\\s+${escapedName})?)\\s*;`, 'i');
    const endMatch = endExpression.exec(remainder);
    if (!endMatch || endMatch.index == null) {
      continue;
    }

    const blockEnd = blockStart + endMatch.index + endMatch[0].length;
    return {
      statement: params.content.slice(blockStart, blockEnd),
      start: blockStart,
      end: blockEnd,
    };
  }

  return null;
}

function locateArchitectureBeginIndex(content: string) {
  const match = /\barchitecture\s+[a-zA-Z][a-zA-Z0-9_]*\s+of\s+[a-zA-Z][a-zA-Z0-9_]*\s+is\b[\s\S]*?\bbegin\b/i.exec(content);
  if (!match || match.index == null) return null;
  const beginOffset = match[0].toLowerCase().lastIndexOf('begin');
  if (beginOffset < 0) return null;
  return match.index + beginOffset;
}

function normalizeDeclarativeBlock(block: string) {
  const lines = block.replace(/\r\n/g, '\n').trim().split('\n');
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const minimumIndent = nonEmptyLines.reduce((minimum, line) => {
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    return Math.min(minimum, indent);
  }, Number.POSITIVE_INFINITY);
  const normalizedLines = lines.map((line) => {
    if (!Number.isFinite(minimumIndent) || minimumIndent <= 0) {
      return `  ${line.trimEnd()}`;
    }
    return `  ${line.slice(minimumIndent).trimEnd()}`;
  });
  return `${normalizedLines.join('\n')}\n`;
}

function locateNearestExecutableBeginIndex(content: string, beforeIndex: number) {
  const prefix = content.slice(0, beforeIndex);
  const beginExpression = /\bbegin\b/gi;
  let lastMatchIndex: number | null = null;
  for (const match of prefix.matchAll(beginExpression)) {
    if (typeof match.index === 'number') {
      lastMatchIndex = match.index;
    }
  }
  return lastMatchIndex;
}

function hoistDeclarativeBlockBeforeNearestBegin(params: {
  content: string;
  blockStart: number;
  blockEnd: number;
  blockText: string;
}) {
  const beginIndex = locateNearestExecutableBeginIndex(params.content, params.blockStart);
  if (beginIndex == null) {
    return { content: params.content, changed: false };
  }

  const declarativeBlock = normalizeDeclarativeBlock(params.blockText);
  const withoutBlock = `${params.content.slice(0, params.blockStart)}${params.content.slice(params.blockEnd)}`;
  const adjustedBeginIndex = beginIndex > params.blockStart
    ? beginIndex - (params.blockEnd - params.blockStart)
    : beginIndex;

  return {
    content: `${withoutBlock.slice(0, adjustedBeginIndex)}${declarativeBlock}${withoutBlock.slice(adjustedBeginIndex)}`,
    changed: true,
  };
}

function hoistSubprogramBlockBeforeArchitectureBegin(params: {
  content: string;
  subprogramKind: 'function' | 'procedure';
  subprogramName: string;
}) {
  const beginIndex = locateArchitectureBeginIndex(params.content);
  if (beginIndex == null) {
    return { content: params.content, changed: false };
  }

  const block = extractSubprogramBlock({
    content: params.content,
    startIndex: beginIndex,
    subprogramKind: params.subprogramKind,
    subprogramName: params.subprogramName,
  });
  if (!block) {
    return { content: params.content, changed: false };
  }

  const declarativeBlock = normalizeDeclarativeBlock(block.statement);
  const withoutBlock = `${params.content.slice(0, block.start)}${params.content.slice(block.end)}`;
  const adjustedBeginIndex = beginIndex > block.start
    ? beginIndex - (block.end - block.start)
    : beginIndex;

  return {
    content: `${withoutBlock.slice(0, adjustedBeginIndex)}${declarativeBlock}${withoutBlock.slice(adjustedBeginIndex)}`,
    changed: true,
  };

  return { content: params.content, changed: false };
}

function hoistSubprogramBlockBeforeNearestBegin(params: {
  content: string;
  subprogramKind: 'function' | 'procedure';
  subprogramName: string;
}) {
  const declarationExpression = new RegExp(
    `^\\s*${params.subprogramKind.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+${params.subprogramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
    'gim',
  );

  for (const declarationMatch of params.content.matchAll(declarationExpression)) {
    if (declarationMatch.index == null) continue;
    if (isIndexInsideLineComment(params.content, declarationMatch.index)) {
      continue;
    }
    const nearestBegin = locateNearestExecutableBeginIndex(params.content, declarationMatch.index);
    if (nearestBegin == null || declarationMatch.index <= nearestBegin) {
      continue;
    }

    const block = extractSubprogramBlock({
      content: params.content,
      startIndex: declarationMatch.index,
      subprogramKind: params.subprogramKind,
      subprogramName: params.subprogramName,
    });
    if (!block) {
      continue;
    }

    return hoistDeclarativeBlockBeforeNearestBegin({
      content: params.content,
      blockStart: block.start,
      blockEnd: block.end,
      blockText: block.statement,
    });
  }

  return { content: params.content, changed: false };
}

function hoistStatementBeforeArchitectureBegin(params: {
  content: string;
  statementPattern: RegExp;
}) {
  const beginIndex = locateArchitectureBeginIndex(params.content);
  if (beginIndex == null) {
    return { content: params.content, changed: false };
  }

  const statement = extractNamedStatement({
    content: params.content,
    startIndex: beginIndex,
    pattern: params.statementPattern,
  });
  if (!statement) {
    return { content: params.content, changed: false };
  }

  const declarativeStatement = `  ${statement.statement.trim()}\n`;
  const withoutStatement = `${params.content.slice(0, statement.start)}${params.content.slice(statement.end)}`;
  const adjustedBeginIndex = beginIndex > statement.start
    ? beginIndex - (statement.end - statement.start)
    : beginIndex;

  return {
    content: `${withoutStatement.slice(0, adjustedBeginIndex)}${declarativeStatement}${withoutStatement.slice(adjustedBeginIndex)}`,
    changed: declarativeStatement.trim().length > 0 && statement.statement.trim().length > 0,
  };
}

function hoistStatementBeforeNearestBegin(params: {
  content: string;
  statementPattern: RegExp;
}) {
  const statement = extractExecutableRegionStatement({
    content: params.content,
    pattern: params.statementPattern,
  });
  if (!statement) {
    return { content: params.content, changed: false };
  }

  return hoistDeclarativeBlockBeforeNearestBegin({
    content: params.content,
    blockStart: statement.start,
    blockEnd: statement.end,
    blockText: statement.statement,
  });
}

function moveArchitectureVariableIntoSingleProcess(params: {
  content: string;
  variableName: string;
}) {
  const architectureMatch = /\barchitecture\s+[a-zA-Z][a-zA-Z0-9_]*\s+of\s+[a-zA-Z][a-zA-Z0-9_]*\s+is\b([\s\S]*?)\bbegin\b/i.exec(params.content);
  if (!architectureMatch || architectureMatch.index == null) {
    return { content: params.content, changed: false };
  }

  const declarativeStart = architectureMatch.index;
  const declarativeEnd = declarativeStart + architectureMatch[0].length - 'begin'.length;
  const declaration = extractNamedStatement({
    content: params.content,
    startIndex: declarativeStart,
    pattern: new RegExp(`\\bvariable\\s+${params.variableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`, 'i'),
  });
  if (!declaration || declaration.start >= declarativeEnd) {
    return { content: params.content, changed: false };
  }

  const architectureBody = params.content.slice(declarativeEnd);
  const processRegions = collectProcessRegions(architectureBody).map((region) => ({
    start: declarativeEnd + region.start,
    end: declarativeEnd + region.end,
    beginIndex: declarativeEnd + region.beginIndex,
  }));
  if (processRegions.length === 0) {
    return { content: params.content, changed: false };
  }

  const usageIndices = collectObjectUsageIndices(params.content, params.variableName, declaration.end)
    .filter((index) => index < declaration.start || index >= declaration.end);
  const candidateProcesses = usageIndices.length === 0
    ? (processRegions.length === 1 ? [processRegions[0]] : [])
    : processRegions.filter((region) => usageIndices.every((index) => index > region.start && index < region.end));
  if (candidateProcesses.length !== 1) {
    return { content: params.content, changed: false };
  }

  const processBeginIndex = candidateProcesses[0].beginIndex;
  const processScopedDeclaration = `\n    ${declaration.statement.trim()}\n  `;
  const withoutDeclaration = `${params.content.slice(0, declaration.start)}${params.content.slice(declaration.end)}`;
  const adjustedProcessBeginIndex = processBeginIndex > declaration.start
    ? processBeginIndex - (declaration.end - declaration.start)
    : processBeginIndex;

  return {
    content: `${withoutDeclaration.slice(0, adjustedProcessBeginIndex)}${processScopedDeclaration}${withoutDeclaration.slice(adjustedProcessBeginIndex)}`,
    changed: true,
  };
}

function moveSubprogramIntoSingleProcess(params: {
  content: string;
  subprogramKind: 'function' | 'procedure';
  subprogramName: string;
}) {
  const block = extractSubprogramBlock({
    content: params.content,
    subprogramKind: params.subprogramKind,
    subprogramName: params.subprogramName,
  });
  if (!block) {
    return { content: params.content, changed: false };
  }

  const processRegions = collectProcessRegions(params.content);
  if (processRegions.length === 0) {
    return { content: params.content, changed: false };
  }

  const usageIndices = collectObjectUsageIndices(params.content, params.subprogramName, block.end)
    .filter((index) => index < block.start || index >= block.end);
  const candidateProcesses = usageIndices.length === 0
    ? (processRegions.length === 1 ? [processRegions[0]] : [])
    : processRegions.filter((region) => usageIndices.every((index) => index > region.beginIndex && index < region.end));
  if (candidateProcesses.length !== 1) {
    return { content: params.content, changed: false };
  }

  const targetProcess = candidateProcesses[0];
  const targetProcessIndex = processRegions.findIndex((region) => (
    region.start === targetProcess.start
    && region.end === targetProcess.end
    && region.beginIndex === targetProcess.beginIndex
  ));
  if (block.start >= targetProcess.start && block.end <= targetProcess.beginIndex) {
    return { content: params.content, changed: false };
  }

  const declarativeBlock = normalizeDeclarativeBlock(block.statement);
  const withoutBlock = `${params.content.slice(0, block.start)}${params.content.slice(block.end)}`;
  const nextProcessRegions = collectProcessRegions(withoutBlock);
  const nextTargetProcess = targetProcessIndex >= 0
    ? nextProcessRegions[targetProcessIndex]
    : undefined;
  if (!nextTargetProcess) {
    return { content: params.content, changed: false };
  }

  return {
    content: `${withoutBlock.slice(0, nextTargetProcess.beginIndex)}${declarativeBlock}${withoutBlock.slice(nextTargetProcess.beginIndex)}`,
    changed: true,
  };
}

function isSubprogramInsideProcessDeclarativeRegion(params: {
  content: string;
  subprogramKind: 'function' | 'procedure';
  subprogramName: string;
}) {
  const block = extractSubprogramBlock({
    content: params.content,
    subprogramKind: params.subprogramKind,
    subprogramName: params.subprogramName,
  });
  if (!block) {
    return false;
  }

  const processRegions = collectProcessRegions(params.content);
  return processRegions.some((region) => block.start >= region.start && block.end <= region.beginIndex);
}

function getDeterministicRepairPriority(code: string) {
  switch (code) {
    case 'subprogram_body_inside_package_declaration':
      return 10;
    case 'architecture_body_variable':
      return 20;
    case 'executable_region_signal_declaration':
    case 'declaration_after_begin':
      return 30;
    case 'invalid_subprogram_formal_syntax':
      return 35;
    case 'procedure_outer_scope_write':
      return 40;
    case 'tb_string_formal_actual_constraint_mismatch':
      return 45;
    case 'tb_unconstrained_string_variable':
      return 46;
    case 'output_port_readback':
      return 50;
    case 'conditional_assignment_operator_misuse':
      return 55;
    case 'variable_assigned_with_signal_operator':
    case 'signal_assigned_with_variable_operator':
      return 60;
    default:
      return 100;
  }
}

function convertArchitectureVariableToShared(content: string, variableName: string) {
  const architectureMatch = /\barchitecture\s+[a-zA-Z][a-zA-Z0-9_]*\s+of\s+[a-zA-Z][a-zA-Z0-9_]*\s+is\b([\s\S]*?)\bbegin\b/i.exec(content);
  if (!architectureMatch || architectureMatch.index == null) {
    return { content, changed: false };
  }

  const declarativeStart = architectureMatch.index;
  const declarativeEnd = declarativeStart + architectureMatch[0].length - 'begin'.length;
  const declarativeRegion = content.slice(declarativeStart, declarativeEnd);
  const expression = new RegExp(`(^[ \\t]*)variable(\\s+${variableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:)`, 'im');
  if (!expression.test(declarativeRegion)) {
    return { content, changed: false };
  }

  const nextDeclarativeRegion = declarativeRegion.replace(expression, '$1shared variable$2');
  if (nextDeclarativeRegion === declarativeRegion) {
    return { content, changed: false };
  }

  return {
    content: `${content.slice(0, declarativeStart)}${nextDeclarativeRegion}${content.slice(declarativeEnd)}`,
    changed: true,
  };
}

function convertArchitectureVariableToSignal(content: string, variableName: string) {
  const architectureMatch = /\barchitecture\s+[a-zA-Z][a-zA-Z0-9_]*\s+of\s+[a-zA-Z][a-zA-Z0-9_]*\s+is\b([\s\S]*?)\bbegin\b/i.exec(content);
  if (!architectureMatch || architectureMatch.index == null) {
    return { content, changed: false };
  }

  const declarativeStart = architectureMatch.index;
  const declarativeEnd = declarativeStart + architectureMatch[0].length - 'begin'.length;
  const declarativeRegion = content.slice(declarativeStart, declarativeEnd);
  const expression = new RegExp(`(^[ \\t]*)variable(\\s+${variableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:)`, 'im');
  if (!expression.test(declarativeRegion)) {
    return { content, changed: false };
  }

  const nextDeclarativeRegion = declarativeRegion.replace(expression, '$1signal$2');
  if (nextDeclarativeRegion === declarativeRegion) {
    return { content, changed: false };
  }

  const declarationUpdated = `${content.slice(0, declarativeStart)}${nextDeclarativeRegion}${content.slice(declarativeEnd)}`;
  const assignmentUpdated = replaceAssignmentOperator({
    content: declarationUpdated,
    objectName: variableName,
    nextOperator: '<=',
  });

  return {
    content: assignmentUpdated.content,
    changed: true,
  };
}

function shouldConvertArchitectureVariableToShared(detail: GeneratedVhdlFailureDetail) {
  const replacement = (detail.legalReplacementPattern || '').toLowerCase();
  const forbidden = (detail.forbiddenConstruct || '').toLowerCase();
  return replacement.includes('shared testbench bookkeeping') || forbidden.includes('(testbench_bookkeeping)');
}

function shouldConvertArchitectureVariableToSignal(detail: GeneratedVhdlFailureDetail) {
  const replacement = (detail.legalReplacementPattern || '').toLowerCase();
  const forbidden = (detail.forbiddenConstruct || '').toLowerCase();
  return replacement.includes('persistent state') || forbidden.includes('(persistent_signal_intent)');
}

function splitSubprogramBodiesFromPackageDeclaration(content: string, packageName: string) {
  const packageExpression = new RegExp(`\\bpackage\\s+${packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+is\\b([\\s\\S]*?)\\bend\\s+package\\b[^;]*;`, 'i');
  const packageMatch = packageExpression.exec(content);
  if (!packageMatch || packageMatch.index == null) {
    return { content, changed: false };
  }

  const declarationBody = packageMatch[1];
  const bodyBlocks: string[] = [];
  const declarationWithoutBodies = declarationBody.replace(
    /\b(function|procedure)\s+[a-zA-Z][a-zA-Z0-9_]*(?:\s*\([^)]*\))?(?:\s+return\s+[^;\n]+)?\s+is[\s\S]*?end\s+(?:function|procedure)\s*;/gi,
    (block) => {
      const signature = block.replace(/\s+is[\s\S]*$/i, ';');
      if (signature.trim() !== block.trim()) {
        bodyBlocks.push(block.trim());
        return `\n  ${signature.trim()}\n`;
      }
      return block;
    },
  );

  if (bodyBlocks.length === 0) {
    return { content, changed: false };
  }

  const rebuiltDeclaration = packageMatch[0].replace(declarationBody, declarationWithoutBodies);
  let nextContent = `${content.slice(0, packageMatch.index)}${rebuiltDeclaration}${content.slice(packageMatch.index + packageMatch[0].length)}`;

  const packageBodyExpression = new RegExp(`\\bpackage\\s+body\\s+${packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+is\\b([\\s\\S]*?)\\bend\\s+package\\s+body\\b[^;]*;`, 'i');
  const packageBodyMatch = packageBodyExpression.exec(nextContent);
  if (packageBodyMatch && packageBodyMatch.index != null) {
    const existingBody = packageBodyMatch[1].trim();
    const injectedBody = [existingBody, ...bodyBlocks].filter(Boolean).join('\n\n  ');
    const replacement = packageBodyMatch[0].replace(packageBodyMatch[1], `\n  ${injectedBody}\n`);
    nextContent = `${nextContent.slice(0, packageBodyMatch.index)}${replacement}${nextContent.slice(packageBodyMatch.index + packageBodyMatch[0].length)}`;
  } else {
    const packageBody = [
      '',
      `package body ${packageName} is`,
      ...bodyBlocks.map((block) => `  ${block.replace(/\n/g, '\n  ')}`),
      `end package body ${packageName};`,
      '',
    ].join('\n');
    nextContent = `${nextContent.trimEnd()}\n${packageBody}`;
  }

  return {
    content: nextContent,
    changed: nextContent !== content,
  };
}

function collectPackageDeclarationsWithEmbeddedBodies(content: string) {
  const packages = new Set<string>();
  const packageExpression = /\bpackage\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\b([\s\S]*?)\bend\s+package\b[^;]*;/gi;

  for (const match of content.matchAll(packageExpression)) {
    const packageName = match[1];
    const declarationBody = match[2] || '';
    if (!packageName) {
      continue;
    }
    if (/\b(function|procedure)\s+[a-zA-Z][a-zA-Z0-9_]*(?:\s*\([^)]*\))?(?:\s+return\s+[^;\n]+)?\s+is\b[\s\S]*?\bbegin\b/i.test(declarationBody)) {
      packages.add(packageName);
    }
  }

  return Array.from(packages);
}

function rewriteAnonymousArrayObjectDeclaration(content: string) {
  const declarationExpression =
    /^([ \t]*)(signal|variable|constant)\s+([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*array\s*\(([^)\n]+)\)\s+of\s+([^;:=\n]+)(\s*(?::=)\s*[^;\n]+)?\s*;$/im;
  const match = declarationExpression.exec(content);
  if (!match || match.index == null) {
    return { content, changed: false };
  }

  const indentation = match[1];
  const objectKind = match[2];
  const objectName = match[3];
  const indexRange = match[4].trim();
  const elementType = match[5].trim();
  const initializerSuffix = match[6] || '';
  const namedType = `${objectName}_t`;
  const insertedType = `${indentation}type ${namedType} is array(${indexRange}) of ${elementType};\n`;
  const rewrittenDeclaration = `${indentation}${objectKind} ${objectName} : ${namedType}${initializerSuffix};`;
  const replacement = `${insertedType}${rewrittenDeclaration}`;

  return {
    content: `${content.slice(0, match.index)}${replacement}${content.slice(match.index + match[0].length)}`,
    changed: true,
  };
}

function rewriteInterfaceArrowSyntax(content: string) {
  const blockExpression = /\b(entity|component)\s+[a-zA-Z][a-zA-Z0-9_]*\s+is[\s\S]*?\b(?:port|generic)\s*\(([\s\S]*?)\)\s*;/gi;
  let changed = false;
  const nextContent = content.replace(blockExpression, (block, _kind, interfaceBody) => {
    const rewrittenInterfaceBody = String(interfaceBody).replace(
      /^(\s*[a-zA-Z][a-zA-Z0-9_]*)\s*=>/gm,
      (_match, identifier) => {
        changed = true;
        return `${identifier} :`;
      },
    );
    if (rewrittenInterfaceBody === interfaceBody) {
      return block;
    }
    return String(block).replace(String(interfaceBody), rewrittenInterfaceBody);
  });
  return { content: nextContent, changed };
}

function rewriteNaturalLanguageLeakage(content: string) {
  const sanitizeRepairMessage = (value: string) => value
    .trim()
    .replace(/\s+before\s+'[^']+'\s+after validator feedback/gi, ' before validator feedback');
  const formatRepairComment = (label: string, message: string) => {
    const normalizedLabel = label.toLowerCase();
    const normalizedMessage = sanitizeRepairMessage(message);
    if (normalizedLabel === 'repaired') {
      return `-- ${normalizedMessage}`;
    }
    if (normalizedLabel === 'updated' || normalizedLabel === 'note' || normalizedLabel === 'explanation') {
      return `-- ${normalizedMessage}`;
    }
    if (normalizedLabel === 'changed') {
      return `-- changed ${normalizedMessage}`;
    }
    return `-- ${normalizedLabel}: ${normalizedMessage}`;
  };
  let changed = false;
  let nextContent = content.replace(
    /^([ \t]*(?:constant|signal|variable)\s+[a-zA-Z][a-zA-Z0-9_]*\b[^;\n]*:=\s*[^;\n]+?)\s+\bafter\b([^;\n]*);$/gim,
    (_match, declarationPrefix, trailingProse) => {
      changed = true;
      return `${declarationPrefix.trimEnd()}; -- after${trailingProse}`;
    },
  );

  nextContent = nextContent.replace(
    /^([ \t]*)(REPAIRED|FIXED|UPDATED|CHANGED|NOTE|EXPLANATION)\s*:\s*(.+)$/gim,
    (_match, indentation, label, message) => {
      changed = true;
      return `${indentation}${formatRepairComment(label, message)}`;
    },
  );

  nextContent = nextContent.replace(
    /^([ \t]*)#{1,6}\s+(.+)$/gim,
    (_match, indentation, message) => {
      changed = true;
      return `${indentation}-- ${message.trim()}`;
    },
  );

  nextContent = nextContent.replace(
    /^([ \t]*)[-*]\s+(REPAIRED|FIXED|UPDATED|CHANGED|NOTE|EXPLANATION)\b\s*:?\s*(.+)$/gim,
    (_match, indentation, label, message) => {
      changed = true;
      const suffix = sanitizeRepairMessage(message);
      return `${indentation}-- ${label.toLowerCase()}${suffix ? `: ${suffix}` : ''}`;
    },
  );

  nextContent = nextContent.replace(
    /^([ \t]*)--\s*(REPAIRED|FIXED|UPDATED|CHANGED|NOTE|EXPLANATION)\s*:?\s*(.+)$/gm,
    (_match, indentation, label, message) => {
      changed = true;
      return `${indentation}${formatRepairComment(label, message)}`;
    },
  );

  return { content: nextContent, changed };
}

function rewriteEndStatementFileExtension(content: string) {
  const expression = /\bend\s+(package|entity|architecture|component)\s+([a-zA-Z][a-zA-Z0-9_]*)\.(vhd|vhdl)\s*;/gi;
  let changed = false;
  const nextContent = content.replace(expression, (_match, kind, identifier) => {
    changed = true;
    return `end ${kind} ${identifier};`;
  });
  return { content: nextContent, changed };
}

function collectDeclaredIdentifiers(content: string) {
  return new Set(
    Array.from(
      content.matchAll(/\b(?:signal|variable|constant|shared\s+variable)\s+([a-zA-Z][a-zA-Z0-9_]*)\b/gi),
    )
      .map((match) => match[1]?.toLowerCase())
      .filter((value): value is string => typeof value === 'string' && value.length > 0),
  );
}

function findMutableObjectDeclaration(content: string, objectName: string) {
  const expression = new RegExp(
    `\\b(shared\\s+variable|variable|signal)\\s+${objectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*([^;:=\\n]+(?:\\([^;\\n]*\\))?)`,
    'i',
  );
  const match = expression.exec(content);
  if (!match) return null;

  const rawKind = match[1].toLowerCase().replace(/\s+/g, ' ');
  const subtype = match[2].trim();
  return {
    kind: rawKind === 'signal' ? 'signal' : 'variable',
    subtype,
  } as const;
}

function parseOutputPortSubtype(content: string, outputName: string) {
  const portSectionMatch = content.match(/\bport\s*\(([\s\S]*?)\)\s*;/i);
  if (!portSectionMatch) return null;

  const outputExpression = new RegExp(
    `\\b${outputName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s*:\\s*out\\s+([^;\\n]+)`,
    'i',
  );
  const outputMatch = outputExpression.exec(portSectionMatch[1]);
  return outputMatch?.[1]?.trim() || null;
}

function replaceTokenInArchitectureBody(params: {
  content: string;
  targetName: string;
  nextName: string;
}) {
  const beginIndex = locateArchitectureBeginIndex(params.content);
  if (beginIndex == null) {
    return { content: params.content, changed: false };
  }

  const bodyStart = beginIndex + 'begin'.length;
  const architectureEndMatch = /\bend\s+architecture\b[^;]*;?/i.exec(params.content.slice(bodyStart));
  const bodyEnd = architectureEndMatch?.index != null
    ? bodyStart + architectureEndMatch.index
    : params.content.length;

  const body = params.content.slice(bodyStart, bodyEnd);
  const expression = new RegExp(`\\b${params.targetName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
  let changed = false;
  const nextBody = body.replace(expression, (match) => {
    changed = true;
    return params.nextName;
  });

  if (!changed) {
    return { content: params.content, changed: false };
  }

  return {
    content: `${params.content.slice(0, bodyStart)}${nextBody}${params.content.slice(bodyEnd)}`,
    changed: true,
  };
}

function insertSignalBeforeArchitectureBegin(params: {
  content: string;
  signalName: string;
  subtype: string;
}) {
  const beginIndex = locateArchitectureBeginIndex(params.content);
  if (beginIndex == null) {
    return { content: params.content, changed: false };
  }

  const signalLine = `  signal ${params.signalName} : ${params.subtype};\n`;
  return {
    content: `${params.content.slice(0, beginIndex)}${signalLine}${params.content.slice(beginIndex)}`,
    changed: true,
  };
}

function appendConcurrentAssignmentBeforeArchitectureEnd(params: {
  content: string;
  outputName: string;
  internalName: string;
}) {
  const existingExpression = new RegExp(
    `\\b${params.outputName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*<=\\s*${params.internalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*;`,
    'i',
  );
  if (existingExpression.test(params.content)) {
    return { content: params.content, changed: false };
  }

  const endMatch = /\bend\s+architecture\b[^;]*;?/i.exec(params.content);
  if (!endMatch || endMatch.index == null) {
    return { content: params.content, changed: false };
  }

  const insertion = `  ${params.outputName} <= ${params.internalName};\n`;
  return {
    content: `${params.content.slice(0, endMatch.index)}${insertion}${params.content.slice(endMatch.index)}`,
    changed: true,
  };
}

function repairOutputPortReadback(content: string, outputName: string) {
  const subtype = parseOutputPortSubtype(content, outputName);
  if (!subtype) {
    return { content, changed: false };
  }

  const declaredIdentifiers = collectDeclaredIdentifiers(content);
  let internalName = `${outputName}_int`;
  let suffix = 1;
  while (declaredIdentifiers.has(internalName.toLowerCase())) {
    internalName = `${outputName}_int_${suffix}`;
    suffix += 1;
  }

  let nextContent = content;
  let changed = false;

  const insertResult = insertSignalBeforeArchitectureBegin({
    content: nextContent,
    signalName: internalName,
    subtype,
  });
  nextContent = insertResult.content;
  changed = changed || insertResult.changed;

  const replaceResult = replaceTokenInArchitectureBody({
    content: nextContent,
    targetName: outputName,
    nextName: internalName,
  });
  nextContent = replaceResult.content;
  changed = changed || replaceResult.changed;

  const appendResult = appendConcurrentAssignmentBeforeArchitectureEnd({
    content: nextContent,
    outputName,
    internalName,
  });
  nextContent = appendResult.content;
  changed = changed || appendResult.changed;

  return { content: nextContent, changed };
}

function repairProcedureOuterScopeWrite(content: string, procedureName: string, objectName: string) {
  const declaration = findMutableObjectDeclaration(content, objectName);
  if (!declaration) {
    return { content, changed: false };
  }

  const escapedProcedureName = procedureName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const procedureExpression = new RegExp(
    `\\bprocedure\\s+${escapedProcedureName}(?:\\s*\\(([^)]*)\\))?\\s*is([\\s\\S]*?)end\\s+procedure(?:\\s+${escapedProcedureName})?\\s*;`,
    'i',
  );
  const procedureMatch = procedureExpression.exec(content);
  if (!procedureMatch || procedureMatch.index == null) {
    return { content, changed: false };
  }

  const normalizedHeaderResult = normalizeNamedProcedureFormalSyntax(content, procedureName);
  const normalizedContent = normalizedHeaderResult.changed ? normalizedHeaderResult.content : content;
  const normalizedProcedureMatch = procedureExpression.exec(normalizedContent);
  if (!normalizedProcedureMatch || normalizedProcedureMatch.index == null) {
    return { content, changed: false };
  }

  const candidateFormalClauses = splitTopLevelSegments(normalizedProcedureMatch[1] || '', ';');
  const existingFormalName = candidateFormalClauses
    .map((clause) => extractFormalIdentifier(clause))
    .find((name) => name && new RegExp(`^${objectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:_io(?:_\\d+)?)?$`, 'i').test(name))
    || null;

  const targetName = existingFormalName || objectName;
  const operatorMatch = new RegExp(`\\b${targetName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(<=|:=)`, 'i').exec(normalizedProcedureMatch[2])
    || new RegExp(`\\b${objectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(<=|:=)`, 'i').exec(normalizedProcedureMatch[2]);
  if (!operatorMatch && !existingFormalName) {
    return { content, changed: false };
  }

  const formalNameBase = `${objectName}_io`;
  let formalName = existingFormalName || formalNameBase;
  if (!existingFormalName) {
    let suffix = 1;
    while (new RegExp(`\\b${formalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(normalizedContent)) {
      formalName = `${formalNameBase}_${suffix}`;
      suffix += 1;
    }
  }

  const formalMode = declaration.kind === 'signal'
    ? 'signal'
    : 'variable';
  const direction = declaration.kind === 'signal'
    ? 'out'
    : 'inout';
  const newFormal = `${formalMode} ${formalName} : ${direction} ${declaration.subtype}`;

  const nextParams = candidateFormalClauses
    .filter((clause) => {
      const identifier = extractFormalIdentifier(clause);
      return !(identifier && new RegExp(`^${objectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:_io(?:_\\d+)?)?$`, 'i').test(identifier));
    })
    .map((clause) => clause.trim())
    .filter(Boolean);
  nextParams.push(newFormal);

  let rewrittenBody = normalizedProcedureMatch[2];
  if (existingFormalName && existingFormalName !== formalName) {
    rewrittenBody = rewrittenBody.replace(
      new RegExp(`\\b${existingFormalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'),
      formalName,
    );
  }
  rewrittenBody = rewrittenBody.replace(
    new RegExp(`\\b${objectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'),
    formalName,
  );
  const replacement = normalizedProcedureMatch[1] != null
    ? normalizedProcedureMatch[0]
      .replace(normalizedProcedureMatch[1], nextParams.join('; '))
      .replace(normalizedProcedureMatch[2], rewrittenBody)
    : normalizedProcedureMatch[0]
      .replace(
        new RegExp(`(\\bprocedure\\s+${escapedProcedureName})\\s*is`, 'i'),
        `$1(${nextParams.join('; ')}) is`,
      )
      .replace(normalizedProcedureMatch[2], rewrittenBody);

  let nextContent = `${normalizedContent.slice(0, normalizedProcedureMatch.index)}${replacement}${normalizedContent.slice(normalizedProcedureMatch.index + normalizedProcedureMatch[0].length)}`;

  const callExpression = new RegExp(`\\b${escapedProcedureName}\\s*\\(([^)]*)\\)\\s*;`, 'g');
  nextContent = nextContent.replace(callExpression, (match, args, offset, whole) => {
    const callStart = typeof offset === 'number' ? offset : whole.indexOf(match);
    if (callStart === normalizedProcedureMatch.index) {
      return match;
    }
    const existingArgs = splitTopLevelArguments(String(args).trim());
    if (existingArgs.some((arg) => arg.trim() === objectName || arg.trim().endsWith(`=> ${objectName}`))) {
      return match;
    }
    const trimmedArgs = String(args).trim();
    const nextArgs = trimmedArgs.length > 0
      ? `${trimmedArgs}, ${objectName}`
      : objectName;
    return `${procedureName}(${nextArgs});`;
  });

  const noArgsCallExpression = new RegExp(`\\b${escapedProcedureName}\\s*;`, 'g');
  nextContent = nextContent.replace(noArgsCallExpression, (match, offset, whole) => {
    const callStart = typeof offset === 'number' ? offset : whole.indexOf(match);
    if (callStart === normalizedProcedureMatch.index) {
      return match;
    }
    return `${procedureName}(${objectName});`;
  });

  return {
    content: nextContent,
    changed: nextContent !== content,
  };
}

function repairProcedureOuterScopeWritesInNamedProcedure(content: string, procedureName: string) {
  const procedureScope = collectProcedureScopeSnapshots(content).find(
    (scope) => scope.name.toLowerCase() === procedureName.toLowerCase(),
  );
  if (!procedureScope) {
    return { content, changed: false };
  }

  const formalNames = new Set(procedureScope.formalNames.map((name) => name.toLowerCase()));
  const localNames = new Set(procedureScope.localNames.map((name) => name.toLowerCase()));

  const assignees: string[] = [];
  const seenAssignees = new Set<string>();
  for (const assignee of procedureScope.assignmentTargets) {
    const normalizedAssignee = assignee.toLowerCase();
    if (formalNames.has(normalizedAssignee) || localNames.has(normalizedAssignee)) {
      continue;
    }
    if (!findMutableObjectDeclaration(content, assignee)) {
      continue;
    }
    if (seenAssignees.has(normalizedAssignee)) {
      continue;
    }
    seenAssignees.add(normalizedAssignee);
    assignees.push(assignee);
  }

  if (assignees.length === 0) {
    return { content, changed: false };
  }

  let nextContent = content;
  let changed = false;
  for (const assignee of assignees) {
    const result = repairProcedureOuterScopeWrite(nextContent, procedureName, assignee);
    nextContent = result.content;
    changed = changed || result.changed;
  }

  return { content: nextContent, changed };
}

function normalizeTestbenchDeclarationScopeCluster(params: {
  content: string;
  details: GeneratedVhdlFailureDetail[];
}) {
  const leakedSubprograms = new Map<string, 'function' | 'procedure'>();
  const variableNames = new Set<string>();

  for (const detail of params.details) {
    if (detail.code === 'architecture_body_variable') {
      const variableName = detail.forbiddenConstruct?.match(/variable\s+\"([^"]+)\"/i)?.[1];
      if (variableName) {
        variableNames.add(variableName);
      }
    }

    if (detail.code === 'declaration_after_begin') {
      const subprogramMatch = detail.forbiddenConstruct?.match(/^(function|procedure)\s+declaration\s+for\s+\"([^"]+)\"/i);
      if (subprogramMatch) {
        leakedSubprograms.set(subprogramMatch[2], subprogramMatch[1].toLowerCase() as 'function' | 'procedure');
      }
    }

    if (detail.code === 'procedure_outer_scope_write') {
      const procedureName = detail.forbiddenConstruct?.match(/procedure\s+(?:declaration\s+for\s+)?\"([^"]+)\"/i)?.[1];
      if (procedureName) {
        leakedSubprograms.set(procedureName, 'procedure');
      }
    }
  }

  for (const subprogram of collectExecutableRegionSubprograms(params.content)) {
    leakedSubprograms.set(subprogram.name, subprogram.kind);
  }

  for (const [subprogramName, subprogramKind] of leakedSubprograms.entries()) {
    if (subprogramKind !== 'procedure') {
      continue;
    }

    const procedureName = subprogramName;
    for (const objectName of collectOuterScopeWriteTargetsInNamedProcedure(params.content, procedureName)) {
      const declaration = findMutableObjectDeclaration(params.content, objectName);
      if (declaration?.kind === 'variable') {
        variableNames.add(objectName);
      }
    }
  }

  let nextContent = params.content;
  let changed = false;

  for (const variableName of variableNames) {
    const variableRepair = moveArchitectureVariableIntoSingleProcess({
      content: nextContent,
      variableName,
    });
    if (variableRepair.changed) {
      nextContent = variableRepair.content;
      changed = true;
    }
  }

  for (const [subprogramName, subprogramKind] of leakedSubprograms.entries()) {
    let hoistResult = { content: nextContent, changed: false };
    const alreadyProcessScoped = isSubprogramInsideProcessDeclarativeRegion({
      content: nextContent,
      subprogramKind,
      subprogramName,
    });
    if (!alreadyProcessScoped) {
      hoistResult = moveSubprogramIntoSingleProcess({
        content: nextContent,
        subprogramKind,
        subprogramName,
      });
      if (!hoistResult.changed) {
        hoistResult = hoistSubprogramBlockBeforeNearestBegin({
          content: nextContent,
          subprogramKind,
          subprogramName,
        });
      }
    }
    if (hoistResult.changed) {
      nextContent = hoistResult.content;
      changed = true;
    }

    if (subprogramKind === 'procedure') {
      const procedureRepair = repairProcedureOuterScopeWritesInNamedProcedure(nextContent, subprogramName);
      if (procedureRepair.changed) {
        nextContent = procedureRepair.content;
        changed = true;
      }
    }
  }

  // Run one final local variable relocation pass after helper hoisting and
  // outer-scope-write normalization, because those rewrites can expose the
  // true single owning process more clearly than the original file shape did.
  for (const variableName of variableNames) {
    const variableRepair = moveArchitectureVariableIntoSingleProcess({
      content: nextContent,
      variableName,
    });
    if (variableRepair.changed) {
      nextContent = variableRepair.content;
      changed = true;
    }
  }

  return { content: nextContent, changed };
}

function shouldRunBundledTestbenchDeclarationScopeRepair(params: {
  content: string;
  relativePath: string;
  fileDetails: GeneratedVhdlFailureDetail[];
}) {
  if (!isLikelyTestbenchRelativePath(params.relativePath)) {
    return false;
  }

  const explicitClusterSignal = params.fileDetails.some((detail) => (
    detail.code === 'declaration_after_begin'
    || detail.code === 'executable_region_signal_declaration'
    || detail.code === 'procedure_outer_scope_write'
  ));

  if (explicitClusterSignal) {
    return true;
  }

  const hasArchitectureVariable = params.fileDetails.some((detail) => detail.code === 'architecture_body_variable');
  if (!hasArchitectureVariable) {
    return false;
  }

  return collectExecutableRegionSubprograms(params.content).length > 0;
}

function collectExecutableRegionSubprograms(content: string) {
  const discovered = new Map<string, { kind: 'function' | 'procedure'; name: string }>();

  for (const region of collectProcessRegions(content)) {
    const executableSlice = content.slice(region.beginIndex, region.end);
    for (const match of executableSlice.matchAll(/\b(function|procedure)\s+([a-zA-Z][a-zA-Z0-9_]*)\b/gi)) {
      const kind = match[1].toLowerCase() as 'function' | 'procedure';
      const name = match[2];
      discovered.set(`${kind}:${name.toLowerCase()}`, { kind, name });
    }
  }

  return Array.from(discovered.values());
}

function normalizePackageDeclarationBodyCluster(params: {
  content: string;
  details: GeneratedVhdlFailureDetail[];
}) {
  const packageNames = new Set<string>();

  for (const detail of params.details) {
    const packageName = detail.forbiddenConstruct?.match(/package\s+([a-zA-Z][a-zA-Z0-9_]*)\s+declaration/i)?.[1];
    if (packageName) {
      packageNames.add(packageName);
    }
  }

  for (const packageName of collectPackageDeclarationsWithEmbeddedBodies(params.content)) {
    packageNames.add(packageName);
  }

  let nextContent = params.content;
  let changed = false;

  for (const packageName of packageNames) {
    const result = splitSubprogramBodiesFromPackageDeclaration(nextContent, packageName);
    if (result.changed) {
      nextContent = result.content;
      changed = true;
    }
  }

  return { content: nextContent, changed };
}

function shouldRunBundledPackageDeclarationRepair(params: {
  content: string;
  fileDetails: GeneratedVhdlFailureDetail[];
}) {
  if (!params.fileDetails.some((detail) => detail.code === 'subprogram_body_inside_package_declaration')) {
    return false;
  }

  return collectPackageDeclarationsWithEmbeddedBodies(params.content).length > 0;
}

function collectOuterScopeWriteTargetsInNamedProcedure(content: string, procedureName: string) {
  const procedureScope = collectProcedureScopeSnapshots(content).find(
    (scope) => scope.name.toLowerCase() === procedureName.toLowerCase(),
  );
  if (!procedureScope) {
    return [];
  }

  const formalNames = new Set(procedureScope.formalNames.map((name) => name.toLowerCase()));
  const localNames = new Set(procedureScope.localNames.map((name) => name.toLowerCase()));

  const assignees: string[] = [];
  const seenAssignees = new Set<string>();
  for (const assignee of procedureScope.assignmentTargets) {
    const normalizedAssignee = assignee.toLowerCase();
    if (formalNames.has(normalizedAssignee) || localNames.has(normalizedAssignee)) {
      continue;
    }
    if (!findMutableObjectDeclaration(content, assignee)) {
      continue;
    }
    if (seenAssignees.has(normalizedAssignee)) {
      continue;
    }
    seenAssignees.add(normalizedAssignee);
    assignees.push(assignee);
  }

  return assignees;
}

function applyDetailToContent(content: string, detail: GeneratedVhdlFailureDetail) {
  let nextContent = content;
  let changed = false;

  if (detail.code === 'missing_std_logic_1164_clause') {
    const result = ensureUseClause(nextContent, 'ieee.std_logic_1164.all');
    nextContent = result.content;
    changed = result.changed;
  } else if (detail.code === 'missing_numeric_std_clause') {
    const result = ensureUseClause(nextContent, 'ieee.numeric_std.all');
    nextContent = result.content;
    changed = result.changed;
  } else if (detail.code === 'illegal_scalar_type_alias') {
    const aliasMatch = detail.forbiddenConstruct?.match(/^"type\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\s+(integer|natural|positive)\s+range/i);
    if (aliasMatch) {
      const result = rewriteIllegalScalarTypeAlias(nextContent, aliasMatch[1], aliasMatch[2]);
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'reconstrained_subtype_alias') {
    const subtypeMatch = detail.forbiddenConstruct?.match(/^subtype\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\s+([a-zA-Z][a-zA-Z0-9_]*)\(/i);
    if (subtypeMatch) {
      const result = removeSubtypeReconstraint(nextContent, subtypeMatch[1], subtypeMatch[2]);
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'scalar_bit_string_assignment') {
    const scalarMatch = detail.message.match(/scalar numeric [a-z]+ "([^"]+)"/i);
    const literalMatch = detail.message.match(/assigns bit-string literal ("[01_xXzZ]+")/i);
    if (scalarMatch && literalMatch) {
      const result = rewriteScalarBitStringAssignment(nextContent, scalarMatch[1], literalMatch[1]);
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'resize_with_range_attribute') {
    const rangeMatch = detail.forbiddenConstruct?.match(/resize\(\.\.\.,\s*([A-Za-z][A-Za-z0-9_]*'range)\)/i);
    if (rangeMatch) {
      const result = rewriteResizeWidthRangeToLength(nextContent, rangeMatch[1]);
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'resize_on_raw_std_logic_vector') {
    const resizeMatch = detail.forbiddenConstruct?.match(/resize\(([A-Za-z][A-Za-z0-9_]*)/i);
    if (resizeMatch) {
      const result = rewriteResizeOnRawStdLogicVector(nextContent, resizeMatch[1]);
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'shift_left_on_raw_std_logic_vector' || detail.code === 'shift_right_on_raw_std_logic_vector') {
    const shiftMatch = detail.forbiddenConstruct?.match(/(shift_left|shift_right)\(([A-Za-z][A-Za-z0-9_]*)/i);
    if (shiftMatch) {
      const result = rewriteShiftOnRawStdLogicVector({
        content: nextContent,
        functionName: shiftMatch[1].toLowerCase() as 'shift_left' | 'shift_right',
        identifier: shiftMatch[2],
      });
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'to_integer_on_raw_logic_type') {
    const match = detail.forbiddenConstruct?.match(/to_integer\(([A-Za-z][A-Za-z0-9_]*)\) on raw (std_logic_vector|std_logic)/i);
    if (match) {
      const result = rewriteToIntegerOnRawLogicType(nextContent, match[1], match[2].toLowerCase() as 'std_logic' | 'std_logic_vector');
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'typed_bitwise_mismatch') {
    const lhsTypeMatch = detail.message.match(/into (unsigned|signed)/i);
    const operandsMatch = detail.legalReplacementPattern?.match(/convert ([A-Za-z][A-Za-z0-9_]*) and ([A-Za-z][A-Za-z0-9_]*) into matching (unsigned|signed)/i);
    const operatorMatch = detail.message.match(/apply "([a-z]+)"/i);
    if (lhsTypeMatch && operandsMatch && operatorMatch) {
      const result = rewriteTypedBitwiseMismatch({
        content: nextContent,
        lhsType: lhsTypeMatch[1].toLowerCase() as 'unsigned' | 'signed',
        leftOperand: operandsMatch[1],
        rightOperand: operandsMatch[2],
        operatorKeyword: operatorMatch[1].toLowerCase(),
      });
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'typed_unary_mismatch') {
    const lhsTypeMatch = detail.message.match(/into (unsigned|signed)/i);
    const operandMatch = detail.legalReplacementPattern?.match(/convert "([A-Za-z][A-Za-z0-9_]*)" into matching (unsigned|signed)/i);
    if (lhsTypeMatch && operandMatch) {
      const result = rewriteTypedUnaryMismatch({
        content: nextContent,
        lhsType: lhsTypeMatch[1].toLowerCase() as 'unsigned' | 'signed',
        operand: operandMatch[1],
      });
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'typed_helper_actual_mismatch') {
    const actualMatch = detail.forbiddenConstruct?.match(/raw std_logic_vector actual "([^"]+)" passed to (unsigned|signed) formal parameter of ([A-Za-z][A-Za-z0-9_]*)/i);
    if (actualMatch) {
      const result = rewriteTypedHelperActualMismatch({
        content: nextContent,
        actualExpression: actualMatch[1],
        formalType: actualMatch[2].toLowerCase() as 'unsigned' | 'signed',
        subprogramName: actualMatch[3],
      });
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'typed_function_result_mismatch') {
    const functionMatch = detail.forbiddenConstruct?.match(/std_logic_vector function result from "([A-Za-z][A-Za-z0-9_]*)" assigned into (unsigned|signed) destination "([A-Za-z][A-Za-z0-9_]*)"/i);
    if (functionMatch) {
      const result = rewriteTypedFunctionResultMismatch({
        content: nextContent,
        functionName: functionMatch[1],
        lhsType: functionMatch[2].toLowerCase() as 'unsigned' | 'signed',
        lhsName: functionMatch[3],
      });
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'typed_port_association_mismatch') {
    const actualMatch = detail.message.match(/can't associate "([^"]+)" with port "([^"]+)"/i)
      || detail.message.match(/cannot associate "([^"]+)" with port "([^"]+)"/i)
      || detail.message.match(/with (?:raw std_logic_vector|std_logic_vector|unsigned|signed|other) actual "([^"]+)" in a port map/i);
    const formalTypeMatch = detail.message.match(/type of port ".*" is .*UNRESOLVED_(SIGNED|UNSIGNED)/i)
      || detail.message.match(/drives (unsigned|signed) formal port "([^"]+)"/i)
      || detail.message.match(/formal port ".*" declared as (unsigned|signed)/i);
    if (actualMatch && formalTypeMatch) {
      const result = rewriteTypedPortAssociationMismatch({
        content: nextContent,
        actualExpression: actualMatch[1],
        portName: actualMatch[2] || formalTypeMatch[2],
        formalType: formalTypeMatch[1].toLowerCase() === 'unsigned' ? 'unsigned' : 'signed',
      });
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'conditional_assignment_operator_misuse') {
    const conditionMatch = detail.forbiddenConstruct?.match(/contains\s+"([A-Za-z][A-Za-z0-9_]*)\s*:=\s*([^"]+)"/i);
    if (conditionMatch) {
      const result = repairConditionalAssignmentOperatorMisuse(nextContent, conditionMatch[1], conditionMatch[2]);
      nextContent = result.content;
      changed = result.changed;
    }
    const result = repairAllConditionalAssignmentOperatorMisuse(nextContent);
    nextContent = result.content;
    changed = changed || result.changed;
  } else if (detail.code === 'variable_assigned_with_signal_operator') {
    const variableName = detail.forbiddenConstruct?.match(/variable\s+"([^"]+)"/i)?.[1];
    if (variableName) {
      const declaredVariables = new Set(collectDeclaredNames(nextContent, 'variable').map((value) => value.toLowerCase()));
      if (declaredVariables.has(variableName.toLowerCase())) {
        const result = replaceAssignmentOperator({
          content: nextContent,
          objectName: variableName,
          nextOperator: ':=',
        });
        nextContent = result.content;
        changed = result.changed;
      }
    }
  } else if (detail.code === 'signal_assigned_with_variable_operator') {
    const signalName = detail.forbiddenConstruct?.match(/signal\s+"([^"]+)"/i)?.[1];
    if (signalName) {
      const declaredSignals = new Set(collectDeclaredNames(nextContent, 'signal').map((value) => value.toLowerCase()));
      if (declaredSignals.has(signalName.toLowerCase())) {
        const result = replaceAssignmentOperator({
          content: nextContent,
          objectName: signalName,
          nextOperator: '<=',
        });
        nextContent = result.content;
        changed = result.changed;
      }
    }
  } else if (detail.code === 'clock_edge_helper_requires_signal_formal') {
    const mismatchMatch = detail.forbiddenConstruct?.match(/(?:function|procedure)\s+"([^"]+)".*?clause\s+"([^"]+)"/i);
    const formalNameMatch = detail.message.match(/formal "([A-Za-z][A-Za-z0-9_]*)"/i);
    if (mismatchMatch && formalNameMatch) {
      const result = rewriteClockEdgeHelperFormalAsSignal(nextContent, mismatchMatch[1], formalNameMatch[1]);
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'tb_unguarded_logic_index_conversion') {
    const expressionMatch = detail.forbiddenConstruct?.match(/"([^"]+)"/);
    const replacementMatch = detail.legalReplacementPattern?.match(/\((tb_safe_(?:slv|signed)_to_index)\(([A-Za-z][A-Za-z0-9_]*)\)\)/i);
    if (expressionMatch && replacementMatch) {
      const result = rewriteUnsafeTbLogicIndexConversion({
        content: nextContent,
        expression: expressionMatch[1],
        indexIdentifier: replacementMatch[2],
        conversionKind: replacementMatch[1].toLowerCase().includes('signed') ? 'signed' : 'unsigned',
      });
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'invalid_range_membership_syntax') {
    const result = rewriteInvalidRangeMembershipSyntax(nextContent);
    nextContent = result.content;
    changed = result.changed;
  } else if (detail.code === 'invalid_subprogram_formal_syntax') {
    const subprogramName = detail.forbiddenConstruct?.match(/(?:function|procedure)\s+"([^"]+)"/i)?.[1];
    if (subprogramName) {
      const result = normalizeNamedProcedureFormalSyntax(nextContent, subprogramName);
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'architecture_body_variable') {
    const variableName = detail.forbiddenConstruct?.match(/variable\s+"([^"]+)"/i)?.[1];
    if (variableName && shouldConvertArchitectureVariableToShared(detail)) {
      const result = convertArchitectureVariableToShared(nextContent, variableName);
      nextContent = result.content;
      changed = result.changed;
    } else if (variableName && shouldConvertArchitectureVariableToSignal(detail)) {
      const result = convertArchitectureVariableToSignal(nextContent, variableName);
      nextContent = result.content;
      changed = result.changed;
    } else if (variableName) {
      const result = moveArchitectureVariableIntoSingleProcess({
        content: nextContent,
        variableName,
      });
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'executable_region_signal_declaration') {
    const signalName = detail.forbiddenConstruct?.match(/"([^"]+)"/i)?.[1];
    if (signalName) {
      const result = hoistStatementBeforeArchitectureBegin({
        content: nextContent,
        statementPattern: new RegExp(`\\bsignal\\s+${signalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`, 'i'),
      });
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'declaration_after_begin') {
    const declarationMatch = detail.forbiddenConstruct?.match(/^(type|subtype|procedure|function|constant)\s+declaration\s+for\s+"([^"]+)"/i);
    if (declarationMatch) {
      const declarationKind = declarationMatch[1].toLowerCase();
      const inferredProcedureWriteTargets = declarationKind === 'procedure'
        ? collectOuterScopeWriteTargetsInNamedProcedure(nextContent, declarationMatch[2])
        : [];
      let result = declarationKind === 'function' || declarationKind === 'procedure'
        ? hoistSubprogramBlockBeforeNearestBegin({
            content: nextContent,
            subprogramKind: declarationKind,
            subprogramName: declarationMatch[2],
          })
        : hoistStatementBeforeNearestBegin({
            content: nextContent,
            statementPattern: new RegExp(`\\b${declarationMatch[1]}\\s+${declarationMatch[2].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
          });
      if (!result.changed) {
        result = declarationKind === 'function' || declarationKind === 'procedure'
          ? hoistSubprogramBlockBeforeArchitectureBegin({
            content: nextContent,
            subprogramKind: declarationKind,
            subprogramName: declarationMatch[2],
          })
          : hoistStatementBeforeArchitectureBegin({
            content: nextContent,
            statementPattern: new RegExp(`\\b${declarationMatch[1]}\\s+${declarationMatch[2].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
          });
      }
      nextContent = result.content;
      changed = result.changed;
      if (declarationKind === 'procedure' && result.changed) {
        const normalizedProcedureRepair = repairProcedureOuterScopeWritesInNamedProcedure(nextContent, declarationMatch[2]);
        nextContent = normalizedProcedureRepair.content;
        changed = changed || normalizedProcedureRepair.changed;
        for (const objectName of inferredProcedureWriteTargets) {
          const declaration = findMutableObjectDeclaration(nextContent, objectName);
          if (declaration?.kind !== 'variable') {
            continue;
          }
          const variableRepair = moveArchitectureVariableIntoSingleProcess({
            content: nextContent,
            variableName: objectName,
          });
          nextContent = variableRepair.content;
          changed = changed || variableRepair.changed;
        }
      }
    }
  } else if (detail.code === 'subprogram_body_inside_package_declaration') {
    const packageName = detail.forbiddenConstruct?.match(/package\s+([a-zA-Z][a-zA-Z0-9_]*)\s+declaration/i)?.[1];
    if (packageName) {
      const result = splitSubprogramBodiesFromPackageDeclaration(nextContent, packageName);
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'anonymous_array_object_declaration') {
    const result = rewriteAnonymousArrayObjectDeclaration(nextContent);
    nextContent = result.content;
    changed = result.changed;
  } else if (detail.code === 'interface_arrow_syntax') {
    const result = rewriteInterfaceArrowSyntax(nextContent);
    nextContent = result.content;
    changed = result.changed;
  } else if (detail.code === 'natural_language_leakage') {
    const result = rewriteNaturalLanguageLeakage(nextContent);
    nextContent = result.content;
    changed = result.changed;
  } else if (detail.code === 'end_statement_file_extension') {
    const result = rewriteEndStatementFileExtension(nextContent);
    nextContent = result.content;
    changed = result.changed;
  } else if (detail.code === 'output_port_readback') {
    const outputName = detail.forbiddenConstruct?.match(/output port\s+"([^"]+)"/i)?.[1];
    if (outputName) {
      const result = repairOutputPortReadback(nextContent, outputName);
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'procedure_outer_scope_write') {
    const match = detail.forbiddenConstruct?.match(/procedure\s+"([^"]+)"\s+mutates outer-scope object\s+"([^"]+)"/i);
    if (match) {
      const result = repairProcedureOuterScopeWrite(nextContent, match[1], match[2]);
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'tb_string_formal_actual_constraint_mismatch') {
    const match = detail.forbiddenConstruct?.match(/(?:function|procedure)\s+"([^"]+)"\s+declares constrained string formal/i);
    if (match) {
      const result = relaxConstrainedStringFormals(nextContent, match[1]);
      nextContent = result.content;
      changed = result.changed;
    }
  } else if (detail.code === 'tb_unconstrained_string_variable') {
    const match = detail.forbiddenConstruct?.match(/"([^"]+)"/i);
    if (match) {
      const result = rewriteUnconstrainedStringVariable(nextContent, match[1]);
      nextContent = result.content;
      changed = result.changed;
    }
  }

  return { content: nextContent, changed };
}

export async function applyDeterministicGeneratedCodeRepairs(params: {
  validation: GeneratedVhdlValidationResult;
  availableFiles: RepairableGeneratedFile[];
}): Promise<DeterministicRepairResult> {
  const details = params.validation.failureDetails || [];
  if (details.length === 0 || params.availableFiles.length === 0) {
    return {
      repairedFiles: params.availableFiles,
      changed: false,
      appliedCodes: [],
    };
  }

  const detailsByFile = new Map<string, GeneratedVhdlFailureDetail[]>();
  for (const detail of details) {
    if (!detail.relativePath) continue;
    const matchedFile = params.availableFiles.find((file) => pathsReferToSameFile(file.relativePath, detail.relativePath!));
    if (!matchedFile) continue;
    const key = normalizeRelativePath(matchedFile.relativePath);
    const fileDetails = detailsByFile.get(key) || [];
    fileDetails.push(detail);
    detailsByFile.set(key, fileDetails);
  }

  const appliedCodes = new Set<string>();
  let changedAny = false;
  const repairedFiles: RepairableGeneratedFile[] = [];

  for (const file of params.availableFiles) {
    const fileDetails = (detailsByFile.get(normalizeRelativePath(file.relativePath)) || [])
      .slice()
      .sort((left, right) => getDeterministicRepairPriority(left.code) - getDeterministicRepairPriority(right.code));
    if (fileDetails.length === 0) {
      repairedFiles.push(file);
      continue;
    }

    let nextContent = file.content;
    let fileChanged = false;
    for (const detail of fileDetails) {
      const result = applyDetailToContent(nextContent, detail);
      nextContent = result.content;
      if (result.changed) {
        fileChanged = true;
        appliedCodes.add(detail.code);
      }
    }

    const cleanupResult = rewriteNaturalLanguageLeakage(nextContent);
    nextContent = cleanupResult.content;
    if (cleanupResult.changed) {
      fileChanged = true;
      appliedCodes.add('natural_language_leakage');
    }

    const declarationScopeDetails = fileDetails.filter((detail) => (
      detail.code === 'architecture_body_variable'
      || detail.code === 'declaration_after_begin'
      || detail.code === 'executable_region_signal_declaration'
      || detail.code === 'procedure_outer_scope_write'
    ));
    if (shouldRunBundledTestbenchDeclarationScopeRepair({
      content: nextContent,
      relativePath: file.relativePath,
      fileDetails: declarationScopeDetails,
    })) {
      const clusterResult = normalizeTestbenchDeclarationScopeCluster({
        content: nextContent,
        details: declarationScopeDetails,
      });
      nextContent = clusterResult.content;
      if (clusterResult.changed) {
        fileChanged = true;
        appliedCodes.add('declaration_scope_cluster');
      }
    }

    const packageDeclarationDetails = fileDetails.filter((detail) => detail.code === 'subprogram_body_inside_package_declaration');
    if (shouldRunBundledPackageDeclarationRepair({
      content: nextContent,
      fileDetails: packageDeclarationDetails,
    })) {
      const packageClusterResult = normalizePackageDeclarationBodyCluster({
        content: nextContent,
        details: packageDeclarationDetails,
      });
      nextContent = packageClusterResult.content;
      if (packageClusterResult.changed) {
        fileChanged = true;
        appliedCodes.add('package_body_cluster');
      }
    }

    if (fileChanged) {
      changedAny = true;
      await fs.mkdir(path.dirname(file.absolutePath), { recursive: true });
      await fs.writeFile(file.absolutePath, `${nextContent.replace(/\r\n/g, '\n')}\n`, 'utf8');
      repairedFiles.push({
        ...file,
        content: nextContent,
      });
      continue;
    }

    repairedFiles.push(file);
  }

  return {
    repairedFiles,
    changed: changedAny,
    appliedCodes: Array.from(appliedCodes),
  };
}
