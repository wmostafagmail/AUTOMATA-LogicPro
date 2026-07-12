type VhdlScopeKind = 'architecture' | 'process' | 'function' | 'procedure';

type VhdlToken = {
  lower: string;
  raw: string;
  index: number;
};

type BaseScopeState = {
  kind: VhdlScopeKind;
  beginSeen: boolean;
};

type ProcedureScopeState = BaseScopeState & {
  kind: 'procedure';
  name: string;
  startIndex: number;
  formalNames: Set<string>;
  localNames: Set<string>;
  assignmentTargets: string[];
  seenAssignmentTargets: Set<string>;
};

type GenericScopeState = BaseScopeState & {
  kind: 'architecture' | 'process' | 'function';
};

type ScopeState = ProcedureScopeState | GenericScopeState;

export type VhdlProcedureScopeSnapshot = {
  name: string;
  startIndex: number;
  formalNames: string[];
  localNames: string[];
  assignmentTargets: string[];
};

function maskVhdlCommentsAndStrings(content: string) {
  let result = '';
  let index = 0;
  let inString = false;

  while (index < content.length) {
    const current = content[index];
    const next = content[index + 1];

    if (!inString && current === '-' && next === '-') {
      result += '  ';
      index += 2;
      while (index < content.length && content[index] !== '\n') {
        result += ' ';
        index += 1;
      }
      continue;
    }

    if (current === '"') {
      inString = !inString;
      result += ' ';
      index += 1;
      continue;
    }

    result += inString && current !== '\n' ? ' ' : current;
    index += 1;
  }

  return result;
}

function tokenizeVhdlStructure(content: string): VhdlToken[] {
  const masked = maskVhdlCommentsAndStrings(content);
  return Array.from(masked.matchAll(/\b[a-zA-Z][a-zA-Z0-9_]*\b|:=|<=|=>|[():;,.]/g)).map((match) => ({
    lower: match[0].toLowerCase(),
    raw: match[0],
    index: match.index ?? 0,
  }));
}

function splitIdentifierList(value: string) {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function extractStatementTextFromToken(content: string, tokens: VhdlToken[], startIndex: number) {
  const startToken = tokens[startIndex];
  if (!startToken) return '';

  for (let cursor = startIndex; cursor < tokens.length; cursor += 1) {
    if (tokens[cursor].lower !== ';') continue;
    const statementEnd = tokens[cursor].index + tokens[cursor].raw.length;
    return content.slice(startToken.index, statementEnd);
  }

  return content.slice(startToken.index);
}

function extractLocalDeclarationNames(statement: string) {
  const declarationMatch = statement.match(/\b(?:signal|variable|constant)\s+([^:;]+?)\s*:/i);
  if (!declarationMatch) return [];
  return splitIdentifierList(declarationMatch[1]);
}

function parseFormalNamesFromHeaderText(headerText: string) {
  const formalNames = new Set<string>();
  const parameterListMatch = headerText.match(/\(([\s\S]*)$/);
  const parameterText = parameterListMatch?.[1] ?? '';

  for (const segment of parameterText.split(';')) {
    const parameterMatch = segment.match(/^\s*(?:(?:signal|variable|constant)\s+)?([a-zA-Z][a-zA-Z0-9_,\s]*)\s*:/i);
    if (!parameterMatch) continue;
    splitIdentifierList(parameterMatch[1]).forEach((identifier) => formalNames.add(identifier.toLowerCase()));
  }

  return formalNames;
}

function subprogramHasBody(tokens: VhdlToken[], startIndex: number) {
  let parenthesisDepth = 0;
  for (let cursor = startIndex + 1; cursor < tokens.length; cursor += 1) {
    const token = tokens[cursor];
    if (token.lower === '(') {
      parenthesisDepth += 1;
      continue;
    }
    if (token.lower === ')') {
      parenthesisDepth = Math.max(0, parenthesisDepth - 1);
      continue;
    }
    if (token.lower === ';' && parenthesisDepth === 0) return false;
    if (token.lower === 'is') return true;
  }
  return false;
}

function createProcedureScopeState(params: {
  name: string;
  startIndex: number;
  formalNames: Set<string>;
}): ProcedureScopeState {
  return {
    kind: 'procedure',
    beginSeen: false,
    name: params.name,
    startIndex: params.startIndex,
    formalNames: params.formalNames,
    localNames: new Set<string>(),
    assignmentTargets: [],
    seenAssignmentTargets: new Set<string>(),
  };
}

export function collectProcedureScopeSnapshots(content: string): VhdlProcedureScopeSnapshot[] {
  const tokens = tokenizeVhdlStructure(content);
  const trackedScopeKinds = new Set<VhdlScopeKind>(['architecture', 'process', 'function', 'procedure']);
  const scopeStack: ScopeState[] = [];
  const procedureSnapshots: VhdlProcedureScopeSnapshot[] = [];
  let pendingArchitecture = false;
  let pendingSubprogram: {
    kind: 'function' | 'procedure';
    name: string;
    startTokenIndex: number;
    parenthesisDepth: number;
  } | null = null;

  const popScopeByKind = (kind: VhdlScopeKind) => {
    for (let cursor = scopeStack.length - 1; cursor >= 0; cursor -= 1) {
      if (scopeStack[cursor].kind !== kind) continue;
      const [popped] = scopeStack.splice(cursor, 1);
      return popped;
    }
    return null;
  };

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const previous = index > 0 ? tokens[index - 1] : null;
    const topScope = scopeStack.at(-1) ?? null;

    if (pendingArchitecture && token.lower === 'is') {
      scopeStack.push({ kind: 'architecture', beginSeen: false });
      pendingArchitecture = false;
      continue;
    }
    if (pendingArchitecture && token.lower === ';') {
      pendingArchitecture = false;
    }

    if (pendingSubprogram) {
      if (token.lower === '(') {
        pendingSubprogram.parenthesisDepth += 1;
      } else if (token.lower === ')') {
        pendingSubprogram.parenthesisDepth = Math.max(0, pendingSubprogram.parenthesisDepth - 1);
      }
      if (token.lower === 'is') {
        const headerText = content.slice(tokens[pendingSubprogram.startTokenIndex].index, token.index);
        if (pendingSubprogram.kind === 'procedure') {
          scopeStack.push(createProcedureScopeState({
            name: pendingSubprogram.name,
            startIndex: tokens[pendingSubprogram.startTokenIndex].index,
            formalNames: parseFormalNamesFromHeaderText(headerText),
          }));
        } else {
          scopeStack.push({ kind: 'function', beginSeen: false });
        }
        pendingSubprogram = null;
        continue;
      }
      if (token.lower === ';' && pendingSubprogram.parenthesisDepth === 0) {
        pendingSubprogram = null;
      }
    }

    if (token.lower === 'begin' && topScope && !topScope.beginSeen) {
      topScope.beginSeen = true;
      continue;
    }

    if (token.lower === 'end') {
      let matchedKind: VhdlScopeKind | null = null;
      for (let cursor = index + 1; cursor < tokens.length; cursor += 1) {
        const lookahead = tokens[cursor];
        if (lookahead.lower === ';') break;
        if (trackedScopeKinds.has(lookahead.lower as VhdlScopeKind)) {
          matchedKind = lookahead.lower as VhdlScopeKind;
          break;
        }
      }
      if (matchedKind) {
        const poppedScope = popScopeByKind(matchedKind);
        if (poppedScope?.kind === 'procedure') {
          procedureSnapshots.push({
            name: poppedScope.name,
            startIndex: poppedScope.startIndex,
            formalNames: Array.from(poppedScope.formalNames),
            localNames: Array.from(poppedScope.localNames),
            assignmentTargets: [...poppedScope.assignmentTargets],
          });
        }
      }
      continue;
    }

    if (token.lower === 'architecture' && previous?.lower !== 'end') {
      pendingArchitecture = true;
      continue;
    }

    if (token.lower === 'process' && previous?.lower !== 'end') {
      scopeStack.push({ kind: 'process', beginSeen: false });
      continue;
    }

    if ((token.lower === 'procedure' || token.lower === 'function') && previous?.lower !== 'end') {
      const nextIdentifier = tokens.slice(index + 1).find((candidate) => {
        if (candidate.lower === ';') return false;
        return /^[a-z]/i.test(candidate.raw);
      });
      if (nextIdentifier && subprogramHasBody(tokens, index)) {
        pendingSubprogram = {
          kind: token.lower as 'function' | 'procedure',
          name: nextIdentifier.raw,
          startTokenIndex: index,
          parenthesisDepth: 0,
        };
      }
      continue;
    }

    if (
      topScope?.kind === 'procedure'
      && !topScope.beginSeen
      && (token.lower === 'signal' || token.lower === 'variable' || token.lower === 'constant')
    ) {
      const statement = extractStatementTextFromToken(content, tokens, index);
      for (const identifier of extractLocalDeclarationNames(statement)) {
        topScope.localNames.add(identifier.toLowerCase());
      }
      continue;
    }

    if (
      topScope?.kind === 'procedure'
      && topScope.beginSeen
      && /^[a-z]/i.test(token.raw)
      && tokens[index + 1]
      && (tokens[index + 1].lower === '<=' || tokens[index + 1].lower === ':=')
    ) {
      const normalizedName = token.raw.toLowerCase();
      if (!topScope.seenAssignmentTargets.has(normalizedName)) {
        topScope.seenAssignmentTargets.add(normalizedName);
        topScope.assignmentTargets.push(token.raw);
      }
    }
  }

  return procedureSnapshots;
}
