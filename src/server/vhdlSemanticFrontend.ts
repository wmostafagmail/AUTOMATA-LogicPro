export type VhdlTokenKind = 'identifier' | 'number' | 'string' | 'character' | 'symbol';

export type VhdlToken = {
  kind: VhdlTokenKind;
  text: string;
  normalized: string;
  offset: number;
  line: number;
  column: number;
};

export type VhdlInterfaceItem = {
  names: string[];
  mode: string | null;
  type: string;
  defaultValue: string | null;
  line: number;
};

export type VhdlEntityModel = {
  name: string;
  generics: VhdlInterfaceItem[];
  ports: VhdlInterfaceItem[];
  line: number;
};

export type VhdlPackageModel = {
  name: string;
  isBody: boolean;
  exportedIdentifiers: string[];
  line: number;
};

export type VhdlInstanceModel = {
  label: string;
  entityName: string;
  genericMap: Record<string, string>;
  portMap: Record<string, string>;
  line: number;
};

export type VhdlArchitectureModel = {
  name: string;
  entityName: string;
  instances: VhdlInstanceModel[];
  line: number;
};

export type VhdlSemanticModel = {
  tokens: VhdlToken[];
  entities: VhdlEntityModel[];
  packages: VhdlPackageModel[];
  architectures: VhdlArchitectureModel[];
};

const MULTI_SYMBOLS = ['=>', ':=', '<=', '>=', '/=', '**', '<>', '<<', '>>'];

export function tokenizeVhdl(source: string): VhdlToken[] {
  const tokens: VhdlToken[] = [];
  let offset = 0;
  let line = 1;
  let column = 1;
  const advance = (text: string) => {
    for (const char of text) {
      offset += 1;
      if (char === '\n') {
        line += 1;
        column = 1;
      } else {
        column += 1;
      }
    }
  };
  const push = (kind: VhdlTokenKind, text: string, startOffset: number, startLine: number, startColumn: number) => {
    tokens.push({ kind, text, normalized: kind === 'identifier' ? text.toLowerCase() : text, offset: startOffset, line: startLine, column: startColumn });
  };

  while (offset < source.length) {
    const rest = source.slice(offset);
    if (/^\s/.test(rest)) {
      const match = rest.match(/^\s+/)![0];
      advance(match);
      continue;
    }
    if (rest.startsWith('--')) {
      const end = rest.indexOf('\n');
      advance(end < 0 ? rest : rest.slice(0, end));
      continue;
    }

    const startOffset = offset;
    const startLine = line;
    const startColumn = column;
    if (rest[0] === '"') {
      let length = 1;
      while (length < rest.length) {
        if (rest[length] === '"' && rest[length + 1] === '"') {
          length += 2;
          continue;
        }
        if (rest[length] === '"') {
          length += 1;
          break;
        }
        length += 1;
      }
      const text = rest.slice(0, length);
      push('string', text, startOffset, startLine, startColumn);
      advance(text);
      continue;
    }
    if (rest[0] === '\'' && rest.length >= 3 && rest[2] === '\'') {
      const text = rest.slice(0, 3);
      push('character', text, startOffset, startLine, startColumn);
      advance(text);
      continue;
    }
    const identifier = rest.match(/^[A-Za-z][A-Za-z0-9_]*/)?.[0];
    if (identifier) {
      push('identifier', identifier, startOffset, startLine, startColumn);
      advance(identifier);
      continue;
    }
    const number = rest.match(/^\d+(?:_?\d)*(?:#[0-9A-Fa-f_]+#)?/)?.[0];
    if (number) {
      push('number', number, startOffset, startLine, startColumn);
      advance(number);
      continue;
    }
    const multi = MULTI_SYMBOLS.find((symbol) => rest.startsWith(symbol));
    const symbol = multi || rest[0];
    push('symbol', symbol, startOffset, startLine, startColumn);
    advance(symbol);
  }
  return tokens;
}

function renderTokens(tokens: VhdlToken[]) {
  return tokens.map((token) => token.text).join(' ').replace(/\s+([,;()])/g, '$1').replace(/([(])\s+/g, '$1').trim();
}

function findBalancedEnd(tokens: VhdlToken[], openIndex: number) {
  let depth = 0;
  for (let index = openIndex; index < tokens.length; index += 1) {
    if (tokens[index].text === '(') depth += 1;
    if (tokens[index].text === ')') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function splitTopLevel(tokens: VhdlToken[], separator: string) {
  const parts: VhdlToken[][] = [];
  let depth = 0;
  let start = 0;
  tokens.forEach((token, index) => {
    if (token.text === '(') depth += 1;
    if (token.text === ')') depth -= 1;
    if (token.text === separator && depth === 0) {
      parts.push(tokens.slice(start, index));
      start = index + 1;
    }
  });
  parts.push(tokens.slice(start));
  return parts.filter((part) => part.length > 0);
}

function parseInterfaceItems(tokens: VhdlToken[], isPort: boolean): VhdlInterfaceItem[] {
  return splitTopLevel(tokens, ';').flatMap((part) => {
    const colon = part.findIndex((token) => token.text === ':');
    if (colon < 1) return [];
    const names = part.slice(0, colon).filter((token) => token.kind === 'identifier').map((token) => token.text);
    let cursor = colon + 1;
    let mode: string | null = null;
    if (isPort && ['in', 'out', 'inout', 'buffer', 'linkage'].includes(part[cursor]?.normalized)) {
      mode = part[cursor].normalized;
      cursor += 1;
    }
    const defaultIndex = part.findIndex((token, index) => index >= cursor && token.text === ':=');
    const typeTokens = part.slice(cursor, defaultIndex >= 0 ? defaultIndex : part.length);
    return [{
      names,
      mode,
      type: renderTokens(typeTokens),
      defaultValue: defaultIndex >= 0 ? renderTokens(part.slice(defaultIndex + 1)) : null,
      line: part[0]?.line || 1,
    }];
  });
}

function parseAssociationMap(tokens: VhdlToken[]) {
  const result: Record<string, string> = {};
  for (const part of splitTopLevel(tokens, ',')) {
    const arrow = part.findIndex((token) => token.text === '=>');
    if (arrow > 0) result[renderTokens(part.slice(0, arrow)).toLowerCase()] = renderTokens(part.slice(arrow + 1));
  }
  return result;
}

export function parseVhdlSemanticModel(source: string): VhdlSemanticModel {
  const tokens = tokenizeVhdl(source);
  const entities: VhdlEntityModel[] = [];
  const packages: VhdlPackageModel[] = [];
  const architectures: VhdlArchitectureModel[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.normalized === 'entity' && tokens[index + 1]?.kind === 'identifier' && tokens[index + 2]?.normalized === 'is') {
      const entity: VhdlEntityModel = { name: tokens[index + 1].text, generics: [], ports: [], line: token.line };
      let cursor = index + 3;
      while (cursor < tokens.length && tokens[cursor].normalized !== 'end') {
        const keyword = tokens[cursor].normalized;
        if ((keyword === 'generic' || keyword === 'port') && tokens[cursor + 1]?.text === '(') {
          const end = findBalancedEnd(tokens, cursor + 1);
          if (end > cursor) {
            const items = parseInterfaceItems(tokens.slice(cursor + 2, end), keyword === 'port');
            if (keyword === 'port') entity.ports.push(...items); else entity.generics.push(...items);
            cursor = end;
          }
        }
        cursor += 1;
      }
      entities.push(entity);
      continue;
    }
    if (token.normalized === 'package') {
      const isBody = tokens[index + 1]?.normalized === 'body';
      const nameToken = tokens[index + (isBody ? 2 : 1)];
      const isToken = tokens[index + (isBody ? 3 : 2)];
      if (nameToken?.kind === 'identifier' && isToken?.normalized === 'is') {
        const exported = new Set<string>();
        let cursor = index + (isBody ? 4 : 3);
        while (cursor < tokens.length && tokens[cursor].normalized !== 'end') {
          if (['type', 'subtype', 'constant', 'function', 'procedure', 'component'].includes(tokens[cursor].normalized)) {
            const candidate = tokens[cursor + 1];
            if (candidate?.kind === 'identifier') exported.add(candidate.text);
          }
          cursor += 1;
        }
        packages.push({ name: nameToken.text, isBody, exportedIdentifiers: Array.from(exported), line: token.line });
      }
      continue;
    }
    if (token.normalized === 'architecture' && tokens[index + 1]?.kind === 'identifier' && tokens[index + 2]?.normalized === 'of' && tokens[index + 3]?.kind === 'identifier') {
      const architecture: VhdlArchitectureModel = { name: tokens[index + 1].text, entityName: tokens[index + 3].text, instances: [], line: token.line };
      let cursor = index + 4;
      while (cursor < tokens.length) {
        if (tokens[cursor].normalized === 'end' && ['architecture', architecture.name.toLowerCase(), ';'].includes(tokens[cursor + 1]?.normalized || tokens[cursor + 1]?.text)) break;
        if (tokens[cursor].kind === 'identifier' && tokens[cursor + 1]?.text === ':' && tokens[cursor + 2]?.normalized === 'entity') {
          let entityIndex = cursor + 3;
          if (tokens[entityIndex]?.normalized === 'work' && tokens[entityIndex + 1]?.text === '.') entityIndex += 2;
          const entityName = tokens[entityIndex]?.text;
          if (entityName) {
            const instance: VhdlInstanceModel = { label: tokens[cursor].text, entityName, genericMap: {}, portMap: {}, line: tokens[cursor].line };
            let mapCursor = entityIndex + 1;
            while (mapCursor < tokens.length && tokens[mapCursor].text !== ';') {
              if ((tokens[mapCursor].normalized === 'generic' || tokens[mapCursor].normalized === 'port') && tokens[mapCursor + 1]?.normalized === 'map' && tokens[mapCursor + 2]?.text === '(') {
                const end = findBalancedEnd(tokens, mapCursor + 2);
                if (end > mapCursor) {
                  const map = parseAssociationMap(tokens.slice(mapCursor + 3, end));
                  if (tokens[mapCursor].normalized === 'generic') instance.genericMap = map; else instance.portMap = map;
                  mapCursor = end;
                }
              }
              mapCursor += 1;
            }
            architecture.instances.push(instance);
          }
        }
        cursor += 1;
      }
      architectures.push(architecture);
    }
  }

  return { tokens, entities, packages, architectures };
}
