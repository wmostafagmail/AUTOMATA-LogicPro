import fs from 'fs/promises';
import path from 'path';
import { LOCAL_LLM_JSON_GENERATION_CONTRACT, LOCAL_LLM_JSON_GENERATION_SKILL_NAME } from './jsonGenerationSkill.ts';
import {
  buildCodeGeneratingMacroRuleList,
  buildCodeGeneratingCommandContractSection,
  buildNumberedRuleList,
  FPGA_ARCHITECT_EXTRA_GHDL_RULES,
  SHARED_GHDL_CONFORMANCE_RULES,
  STRICT_CODE_GENERATION_RULES,
} from './vhdlSkillRules';
import { buildRecurringVhdlFailureGuardSection } from './recurringVhdlFailureGuards';

export type FpgaArchitectFile = {
  path: string;
  fileType: string;
  purpose: string;
  content: string;
  savedPath?: string;
};

export type FpgaArchitectProject = {
  projectName: string;
  sanitizedProjectName: string;
  topEntity: string;
  vhdlStandard: string;
  targetFpga: string | null;
  summary: string;
  assumptions: string[];
  warnings: string[];
  folderTree: string;
  files: FpgaArchitectFile[];
  ghdl: {
    analysisOrder: string[];
    topTestbench: string;
    runCommands: string[];
    expectedResult: string;
  };
  qualityChecklist: string[];
};

export function normalizeArchitectVhdlStandardToken(value: string | null | undefined) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '08';
  if (normalized === '08' || normalized === '2008' || normalized === 'vhdl-2008' || normalized === 'vhdl 2008') return '08';
  if (normalized === '93' || normalized === '1993' || normalized === 'vhdl-1993' || normalized === 'vhdl 1993') return '93';
  if (normalized === '19' || normalized === '2019' || normalized === 'vhdl-2019' || normalized === 'vhdl 2019') return '19';
  return normalized.replace(/^vhdl[-\s]?/, '') || '08';
}

export function buildDeterministicArchitectGhdlRunCommands(params: {
  analysisOrder: string[];
  topTestbench: string;
  vhdlStandard?: string | null;
}) {
  const analysisOrder = params.analysisOrder
    .map((entry) => entry.trim())
    .filter(Boolean);
  const topTestbench = params.topTestbench.trim();
  if (analysisOrder.length === 0 || !topTestbench) {
    return [];
  }

  const stdToken = normalizeArchitectVhdlStandardToken(params.vhdlStandard);
  const waveformPath = `sim/${topTestbench}.vcd`;
  return [
    ...analysisOrder.map((relativePath) => `ghdl -a --std=${stdToken} ${relativePath}`),
    `ghdl -e --std=${stdToken} ${topTestbench}`,
    `ghdl -r --std=${stdToken} ${topTestbench} --vcd=${waveformPath} --stop-time=1us`,
  ];
}

const FPGA_ARCHITECT_MANIFEST_SCAFFOLD = `# PROJECT
project_name: <string>
sanitized_project_name: <string>
top_entity: <string>
vhdl_standard: <string>
target_fpga: <string or null>
summary: <one short line>

## ASSUMPTIONS
- <item>

## WARNINGS
- <item>

## FOLDER_TREE
<very short tree or summary>

## GHDL
top_testbench: <string>
expected_result: <string>
analysis_order:
- <relative/path/file.vhd>

## QUALITY_CHECKLIST
- <item>

# FILE: <relative/path/inside/project.ext>
file_type: <vhdl_rtl | vhdl_package | vhdl_testbench | markdown | script | makefile | json | constraints | placeholder>
purpose: <string>
\`\`\`<language>
<full exact file content>
\`\`\``;

const REQUIRED_FILE_PREFIXES = [
  'requirements/',
  'architecture/',
  'src/',
  'tb/',
  'sim/',
  'constraints/',
  'docs/',
];

const FPGA_ARCHITECT_STRICT_RULE_LIST = buildCodeGeneratingMacroRuleList('fpga_vhdl_architect');

export const FPGA_VHDL_ARCHITECT_SYSTEM_PROMPT = `You are a senior FPGA architect, digital design engineer, VHDL expert, and verification engineer.

Transform the user's natural-language FPGA design request into a complete, high-quality, GHDL-simulatable VHDL project.

${LOCAL_LLM_JSON_GENERATION_CONTRACT}

Preferred output format: a Markdown project manifest with per-file fenced code blocks.

Return only Markdown in this exact machine-readable structure:

${FPGA_ARCHITECT_MANIFEST_SCAFFOLD}

Repeat the FILE section once per generated file.

Fallback format: strict JSON with the existing top-level schema is still accepted if you cannot follow the Markdown manifest format perfectly.

Constraints:
- No prose before or after the manifest.
- Use relative file paths only.
- Default to VHDL-2008 unless the user explicitly requests another standard.
- Generate a complete project, not a single snippet.
- Split project documentation and metadata into a structured set of smaller files instead of one very long Markdown or JSON file.
- Prefer this structure:
  - docs/project_overview.md: short project-level summary, assumptions, integration notes.
  - architecture/top_level.md: short top-level block/interface/clock-reset overview.
  - architecture/units/<unit_name>.md: one small Markdown file per major entity/package/unit.
  - sim/ghdl_plan.json: short machine-readable GHDL compile/elaborate/run metadata.
  - sim/verification_plan.md: short simulation and pass/fail checklist.
- Keep each individual Markdown or JSON file compact and focused. Avoid giant monolithic docs or giant monolithic metadata files.
- Prefer clean synthesizable VHDL RTL, self-checking testbenches, and GHDL-compatible scripts.
- The generated DUT and testbench must compile, elaborate, and simulate under GHDL as written.
- The app will automatically run a strict generate -> compile -> elaborate -> simulate acceptance flow and will reject any project that does not pass it completely.
- The app will synthesize the exact GHDL analyze/elaborate/run command list deterministically from your \`analysis_order\`, \`top_testbench\`, and selected VHDL standard. Do not spend output budget listing raw run_commands unless you need to mirror that plan in docs.
- Before returning the manifest, self-audit every generated VHDL file and regenerate any file that still contains declarations after begin, helper procedures/functions that mutate outer-scope state, output-port readback, or signal/variable assignment misuse.
- ${buildCodeGeneratingCommandContractSection('fpga_vhdl_architect').replace(/^## Exact GHDL Command \/ Output Contract\n/, '').replace(/\n/g, '\n- ')}
- ${STRICT_CODE_GENERATION_RULES.replace(/^## Strict Code-Generation Rules\n/, '').replace(/\n/g, '\n- ')}
- ${FPGA_ARCHITECT_EXTRA_GHDL_RULES.replace(/^## FPGA Architect Extra GHDL Rules\n/, '').replace(/\n/g, '\n- ')}
- ${SHARED_GHDL_CONFORMANCE_RULES.replace(/^## Shared GHDL Conformance Rules\n/, '').replace(/\n/g, '\n- ')}
- Include project documentation, assumptions, verification notes, and simulation instructions, but distribute them across short top-level and unit-level files.
- Use deterministic filenames and a safe snake_case project name.
- Keep folder_tree concise; quality_checklist short; docs/requirements/architecture markdown practical and compact.
- top_entity must be explicit and must exactly match a generated DUT entity name.
- ghdl.top_testbench must be explicit and must exactly match a generated testbench entity name.
`;

function sanitizeSnakeCase(value: string, fallback: string) {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return sanitized || fallback;
}

function normalizeArchitectJson(rawText: string) {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error('The FPGA architect returned an empty response instead of JSON.');
  }

  if (trimmed.startsWith('```')) {
    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
      return fencedMatch[1].trim();
    }
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

function stripTrailingCommasOutsideStrings(text: string) {
  let output = '';
  let inString = false;
  let escapeNext = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      output += char;
      if (escapeNext) {
        escapeNext = false;
      } else if (char === '\\') {
        escapeNext = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }

    if (char === ',') {
      let lookahead = index + 1;
      while (lookahead < text.length && /\s/.test(text[lookahead] || '')) {
        lookahead += 1;
      }
      const nextChar = text[lookahead];
      if (nextChar === ']' || nextChar === '}') {
        continue;
      }
    }

    output += char;
  }

  return output;
}

function findMatchingBracket(text: string, openBracketIndex: number) {
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let index = openBracketIndex; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escapeNext) {
        escapeNext = false;
      } else if (char === '\\') {
        escapeNext = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '[') {
      depth += 1;
      continue;
    }

    if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function repairMissingStringArrayCommas(innerText: string) {
  let output = '';
  let inString = false;
  let escapeNext = false;
  let previousToken: 'none' | 'string' | 'comma' | 'other' = 'none';

  for (let index = 0; index < innerText.length; index += 1) {
    const char = innerText[index];

    if (inString) {
      output += char;
      if (escapeNext) {
        escapeNext = false;
      } else if (char === '\\') {
        escapeNext = true;
      } else if (char === '"') {
        inString = false;
        previousToken = 'string';
      }
      continue;
    }

    if (char === '"') {
      if (previousToken === 'string') {
        output += ',';
      }
      output += char;
      inString = true;
      continue;
    }

    output += char;
    if (!/\s/.test(char)) {
      previousToken = char === ',' ? 'comma' : 'other';
    }
  }

  return output;
}

function repairNamedStringArrays(text: string, fieldName: string) {
  const searchPattern = `"${fieldName}"`;
  let output = '';
  let cursor = 0;

  while (cursor < text.length) {
    const fieldIndex = text.indexOf(searchPattern, cursor);
    if (fieldIndex === -1) {
      output += text.slice(cursor);
      break;
    }

    output += text.slice(cursor, fieldIndex);
    const arrayStart = text.indexOf('[', fieldIndex + searchPattern.length);
    if (arrayStart === -1) {
      output += text.slice(fieldIndex);
      break;
    }
    const arrayEnd = findMatchingBracket(text, arrayStart);
    if (arrayEnd === -1) {
      output += text.slice(fieldIndex);
      break;
    }

    const prefix = text.slice(fieldIndex, arrayStart + 1);
    const innerText = text.slice(arrayStart + 1, arrayEnd);
    const repairedInnerText = repairMissingStringArrayCommas(innerText);
    output += `${prefix}${repairedInnerText}]`;
    cursor = arrayEnd + 1;
  }

  return output;
}

function repairObjectLiteralKeys(text: string) {
  return text.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3');
}

function repairSingleQuotedStrings(text: string) {
  let output = '';
  let inDoubleString = false;
  let inSingleString = false;
  let escapeNext = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inDoubleString) {
      output += char;
      if (escapeNext) {
        escapeNext = false;
      } else if (char === '\\') {
        escapeNext = true;
      } else if (char === '"') {
        inDoubleString = false;
      }
      continue;
    }

    if (inSingleString) {
      if (escapeNext) {
        output += char;
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        output += '\\';
        escapeNext = true;
        continue;
      }
      if (char === '\'') {
        output += '"';
        inSingleString = false;
        continue;
      }
      if (char === '"') {
        output += '\\"';
        continue;
      }
      output += char;
      continue;
    }

    if (char === '"') {
      inDoubleString = true;
      output += char;
      continue;
    }

    if (char === '\'') {
      inSingleString = true;
      output += '"';
      continue;
    }

    output += char;
  }

  return output;
}

function stripDuplicateOuterBraces(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
    return trimmed.slice(1, -1);
  }
  return text;
}

function repairCommonArchitectJsonIssues(text: string) {
  let repaired = text;
  repaired = stripDuplicateOuterBraces(repaired);
  repaired = repairObjectLiteralKeys(repaired);
  repaired = repairSingleQuotedStrings(repaired);
  repaired = repairNamedStringArrays(repaired, 'content_lines');
  repaired = stripTrailingCommasOutsideStrings(repaired);
  return repaired;
}

function assertSafeRelativeProjectPath(value: string) {
  const normalized = value.replace(/\\/g, '/').trim();
  if (!normalized) {
    throw new Error('Generated file path cannot be empty.');
  }
  if (normalized.startsWith('/') || normalized.startsWith('.')) {
    throw new Error(`Generated file path "${value}" must stay relative inside the project.`);
  }
  const collapsed = path.posix.normalize(normalized);
  if (collapsed.startsWith('../') || collapsed === '..') {
    throw new Error(`Generated file path "${value}" attempts to escape the project root.`);
  }
  return collapsed;
}

function coerceStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string').map((entry) => entry.trim()).filter(Boolean)
    : [];
}

function coerceFileContent(file: any) {
  if (typeof file?.content === 'string') {
    return file.content.replace(/\r\n/g, '\n');
  }

  const contentLines = Array.isArray(file?.content_lines)
    ? file.content_lines.filter((entry: unknown): entry is string => typeof entry === 'string')
    : [];

  if (contentLines.length > 0) {
    return contentLines.join('\n').replace(/\r\n/g, '\n');
  }

  return '';
}

function readFirstStringField(source: any, candidateKeys: string[]) {
  for (const key of candidateKeys) {
    const value = source?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseMarkdownBulletList(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

function extractMarkdownSection(text: string, heading: string) {
  const match = new RegExp(`^#{1,6}\\s+${escapeRegExp(heading)}\\s*$`, 'm').exec(text);
  if (!match) {
    return '';
  }
  const sectionStart = match.index + match[0].length;
  const remaining = text.slice(sectionStart);
  const nextHeadingOffset = remaining.search(/^#{1,6}\s+/m);
  return (nextHeadingOffset === -1 ? remaining : remaining.slice(0, nextHeadingOffset)).trim();
}

function parseMarkdownKeyValueBlock(text: string) {
  const entries = new Map<string, string>();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    const separatorIndex = line.indexOf(':');
    if (separatorIndex <= 0) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();
    entries.set(key, value);
  }
  return entries;
}

function parseMarkdownGhdlSection(text: string) {
  const lines = text.split(/\r?\n/);
  const scalars = new Map<string, string>();
  const analysisOrder: string[] = [];
  const runCommands: string[] = [];
  let activeList: 'analysis_order' | 'run_commands' | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    if (line.startsWith('- ')) {
      const item = line.slice(2).trim();
      if (!item) {
        continue;
      }
      if (activeList === 'analysis_order') {
        analysisOrder.push(item);
      } else if (activeList === 'run_commands') {
        runCommands.push(item);
      }
      continue;
    }

    const separatorIndex = line.indexOf(':');
    if (separatorIndex <= 0) {
      activeList = null;
      continue;
    }
    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();
    if (key === 'analysis_order' || key === 'run_commands') {
      activeList = key;
      continue;
    }
    activeList = null;
    scalars.set(key, value);
  }

  return {
    top_testbench: scalars.get('top_testbench') || '',
    expected_result: scalars.get('expected_result') || '',
    analysis_order: analysisOrder,
    run_commands: runCommands,
  };
}

function parseFpgaArchitectMarkdownManifest(text: string) {
  const normalized = text.trim().replace(/\r\n/g, '\n');
  const fileHeaderPattern = /^(?:#{1,6}\s*)?FILE:\s+/im;
  const firstFileIndex = normalized.search(fileHeaderPattern);
  if (firstFileIndex === -1) {
    return null;
  }

  const projectHeadingMatch = /^(?:#{1,6}\s*)?PROJECT\s*$/im.exec(normalized);
  const projectHeadingIndex = projectHeadingMatch && typeof projectHeadingMatch.index === 'number'
    ? projectHeadingMatch.index
    : -1;
  const projectScalarIndex = normalized.search(/(?:^|\n)project_name:\s*/i);
  const manifestStartIndex = projectHeadingIndex >= 0
    ? projectHeadingIndex
    : projectScalarIndex >= 0
      ? projectScalarIndex
      : -1;

  if (manifestStartIndex === -1 || manifestStartIndex > firstFileIndex) {
    return null;
  }

  const manifestCandidate = normalized.slice(manifestStartIndex).trim();

  const firstFileMatch = /^(?:#{1,6}\s*)?FILE:\s+/im.exec(manifestCandidate);
  if (!firstFileMatch || typeof firstFileMatch.index !== 'number') {
    throw new Error('The Markdown manifest did not contain any parsable FILE blocks.');
  }

  const manifestText = manifestCandidate.slice(0, firstFileMatch.index).trim();
  const projectMatch = /^(?:#{1,6}\s*)?PROJECT\s*$/im.exec(manifestText);
  const projectRemainder = projectMatch
    ? manifestText.slice(projectMatch.index + projectMatch[0].length)
    : manifestText;
  const firstSectionOffset = projectRemainder.search(/^#{1,6}\s+/m);
  const projectBody = (firstSectionOffset === -1 ? projectRemainder : projectRemainder.slice(0, firstSectionOffset)).trim();
  const projectScalars = parseMarkdownKeyValueBlock(projectBody);

  const fileBlocks = Array.from(
    manifestCandidate.matchAll(
      /^(?:#{1,6}\s*)?FILE:\s+([^\n]+)\nfile_type:\s*([^\n]+)\npurpose:\s*([^\n]+)\n(?:```[^\n]*\n)([\s\S]*?)(?:\n```)(?=\n(?:#{1,6}\s*)?FILE:\s+|\s*$)/gim,
    ),
  ).map((match) => ({
    path: match[1]?.trim() || '',
    file_type: match[2]?.trim() || 'unknown',
    purpose: match[3]?.trim() || 'Generated project artifact',
    content: (match[4] || '').replace(/\r\n/g, '\n'),
  }));

  if (fileBlocks.length === 0) {
    throw new Error('The Markdown manifest did not contain any valid FILE blocks with fenced content.');
  }

  return {
    project_name: projectScalars.get('project_name') || '',
    sanitized_project_name: projectScalars.get('sanitized_project_name') || '',
    top_entity: projectScalars.get('top_entity') || '',
    vhdl_standard: projectScalars.get('vhdl_standard') || '',
    target_fpga: projectScalars.get('target_fpga') || '',
    summary: projectScalars.get('summary') || '',
    assumptions: parseMarkdownBulletList(extractMarkdownSection(manifestText, 'ASSUMPTIONS')),
    warnings: parseMarkdownBulletList(extractMarkdownSection(manifestText, 'WARNINGS')),
    folder_tree: extractMarkdownSection(manifestText, 'FOLDER_TREE'),
    files: fileBlocks,
    ghdl: parseMarkdownGhdlSection(extractMarkdownSection(manifestText, 'GHDL')),
    quality_checklist: parseMarkdownBulletList(extractMarkdownSection(manifestText, 'QUALITY_CHECKLIST')),
  };
}

function mapArchitectFileTypeToKind(fileType: string): 'testbench' | 'module' | 'assertions' | 'rtl_skeleton' | 'unknown' {
  const normalized = fileType.toLowerCase();
  if (normalized.includes('testbench')) return 'testbench';
  if (normalized.includes('rtl') || normalized.includes('package')) return 'module';
  return 'unknown';
}

function extractEntityNamesFromVhdl(content: string) {
  return Array.from(content.matchAll(/\bentity\s+([a-zA-Z][a-zA-Z0-9_]*)\s+is\b/gi))
    .map((match) => String(match[1] || '').trim().toLowerCase())
    .filter(Boolean);
}

function inferTopEntityFromFiles(files: FpgaArchitectFile[], topTestbenchHint: string) {
  const declaredEntities = Array.from(new Set(files.flatMap((file) => extractEntityNamesFromVhdl(file.content))));
  const normalizedTopTestbench = topTestbenchHint.trim().toLowerCase();
  const nonTestbenchEntities = declaredEntities.filter((entity) => entity !== normalizedTopTestbench && !entity.startsWith('tb_'));

  if (nonTestbenchEntities.length === 1) {
    return nonTestbenchEntities[0];
  }

  const testbenchStem = normalizedTopTestbench.startsWith('tb_')
    ? normalizedTopTestbench.slice(3)
    : normalizedTopTestbench;
  if (testbenchStem && declaredEntities.includes(testbenchStem)) {
    return testbenchStem;
  }

  return '';
}

function isLikelyFpgaArchitectMarkdownResponse(text: string) {
  const trimmed = text.trim();
  const normalized = trimmed.toLowerCase();
  if (!normalized) return false;
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return false;
  if (normalized.startsWith('markdown')) return true;
  if (normalized.includes('# project')) return true;
  if (normalized.includes('project_name:')) return true;
  if (normalized.includes('top_entity:')) return true;
  if (normalized.includes('file_type:')) return true;
  if (normalized.includes('purpose:')) return true;
  if (normalized.includes('# file:') || normalized.includes('file: ')) return true;
  if (normalized.includes('## ghdl') || normalized.includes('top_testbench:')) return true;
  return false;
}

function coerceParsedFpgaArchitectProject(parsed: any, sourceLabel: 'Markdown manifest' | 'JSON'): FpgaArchitectProject {
  const projectName = readFirstStringField(parsed, ['project_name', 'projectName', 'name']) || 'fpga_vhdl_project';
  const sanitizedProjectName = sanitizeSnakeCase(
    readFirstStringField(parsed, ['sanitized_project_name', 'sanitizedProjectName', 'project_slug']) || projectName,
    'fpga_vhdl_project'
  );
  const vhdlStandard = readFirstStringField(parsed, ['vhdl_standard', 'vhdlStandard', 'standard']) || 'VHDL-2008';
  const rawTargetFpga = readFirstStringField(parsed, ['target_fpga', 'targetFpga', 'fpga', 'board']);
  const targetFpga = rawTargetFpga && !['null', 'none'].includes(rawTargetFpga.toLowerCase()) ? rawTargetFpga : null;
  const summary = readFirstStringField(parsed, ['summary', 'description']) || `Generated FPGA/VHDL project for ${projectName}.`;
  const folderTree = readFirstStringField(parsed, ['folder_tree', 'folderTree', 'tree']);
  const assumptions = coerceStringArray(parsed?.assumptions);
  const warnings = coerceStringArray(parsed?.warnings);
  const qualityChecklist = coerceStringArray(parsed?.quality_checklist ?? parsed?.qualityChecklist);

  const files: FpgaArchitectFile[] = Array.isArray(parsed?.files)
    ? parsed.files.map((file: any, index: number) => {
        const filePath = assertSafeRelativeProjectPath(typeof file?.path === 'string' ? file.path : `docs/generated_${index + 1}.txt`);
        return {
          path: filePath,
          fileType: readFirstStringField(file, ['file_type', 'fileType', 'type']) || 'unknown',
          purpose: readFirstStringField(file, ['purpose', 'description']) || 'Generated project artifact',
          content: coerceFileContent(file),
        };
      })
    : [];

  if (files.length === 0) {
    throw new Error(`The FPGA architect ${sourceLabel} did not contain any generated files.`);
  }

  const missingStructure = REQUIRED_FILE_PREFIXES.filter((prefix) => !files.some((file) => file.path.startsWith(prefix)));
  if (missingStructure.length > 0) {
    warnings.push(`Generated project omitted some expected structure roots: ${missingStructure.join(', ')}`);
  }

  const ghdlSource = parsed?.ghdl && typeof parsed.ghdl === 'object'
    ? parsed.ghdl
    : parsed?.simulation && typeof parsed.simulation === 'object'
      ? parsed.simulation
      : null;
  if (!ghdlSource) {
    throw new Error(`The FPGA architect ${sourceLabel} must include a ghdl object with analysis_order, top_testbench, and expected_result metadata.`);
  }
  const topTestbenchRaw = readFirstStringField(ghdlSource, ['top_testbench', 'topTestbench', 'testbench']);
  if (!topTestbenchRaw) {
    throw new Error(`The FPGA architect ${sourceLabel} must include a non-empty ghdl.top_testbench field.`);
  }
  const inferredTopEntity = inferTopEntityFromFiles(files, topTestbenchRaw);
  const rawTopEntity = readFirstStringField(parsed, ['top_entity', 'topEntity', 'entity', 'dut_entity', 'dutEntity']) || inferredTopEntity;
  if (!rawTopEntity) {
    throw new Error(`The FPGA architect ${sourceLabel} must include a non-empty top_entity field.`);
  }
  const topEntity = sanitizeSnakeCase(rawTopEntity, sanitizedProjectName);
  const analysisOrder = coerceStringArray(ghdlSource.analysis_order ?? ghdlSource.analysisOrder);
  const ghdl = {
    analysisOrder,
    topTestbench: topTestbenchRaw,
    runCommands: buildDeterministicArchitectGhdlRunCommands({
      analysisOrder,
      topTestbench: topTestbenchRaw,
      vhdlStandard,
    }),
    expectedResult: readFirstStringField(ghdlSource, ['expected_result', 'expectedResult']) || 'GHDL analysis, elaboration, and simulation complete successfully.',
  };

  const normalizedTopEntity = topEntity.toLowerCase();
  const declaredEntities = new Set(files.flatMap((file) => extractEntityNamesFromVhdl(file.content)));
  if (!declaredEntities.has(normalizedTopEntity)) {
    throw new Error(`The FPGA architect ${sourceLabel} declared top_entity "${topEntity}", but no generated file declared entity ${topEntity}.`);
  }

  const testbenchFiles = files.filter((file) => file.fileType.toLowerCase().includes('testbench') || file.path.startsWith('tb/'));
  const declaredTestbenchEntities = new Set(testbenchFiles.flatMap((file) => extractEntityNamesFromVhdl(file.content)));
  if (declaredTestbenchEntities.size === 0) {
    throw new Error(`The FPGA architect ${sourceLabel} did not contain a generated VHDL testbench entity.`);
  }
  if (!declaredTestbenchEntities.has(ghdl.topTestbench.toLowerCase())) {
    throw new Error(`The FPGA architect ${sourceLabel} declared ghdl.top_testbench "${ghdl.topTestbench}", but the generated testbench entities were: ${Array.from(declaredTestbenchEntities).join(', ')}.`);
  }

  return {
    projectName,
    sanitizedProjectName,
    topEntity,
    vhdlStandard,
    targetFpga,
    summary,
    assumptions,
    warnings,
    folderTree,
    files,
    ghdl,
    qualityChecklist,
  };
}

export function parseFpgaArchitectResponse(text: string): FpgaArchitectProject {
  const markdownCandidate = isLikelyFpgaArchitectMarkdownResponse(text);
  if (markdownCandidate) {
    try {
      const markdownProject = parseFpgaArchitectMarkdownManifest(text);
      if (markdownProject) {
        return coerceParsedFpgaArchitectProject(markdownProject, 'Markdown manifest');
      }
      throw new Error('The response looked like a Markdown manifest attempt, but it did not contain enough required manifest structure to parse.');
    } catch (error: any) {
      throw new Error(`The FPGA architect Markdown manifest was invalid: ${error?.message || String(error)}`);
    }
  }

  const normalizedJson = normalizeArchitectJson(text);
  let parsed: any;
  try {
    parsed = JSON.parse(normalizedJson);
  } catch (error: any) {
    const repairedJson = repairCommonArchitectJsonIssues(normalizedJson);
    if (repairedJson !== normalizedJson) {
      try {
        parsed = JSON.parse(repairedJson);
      } catch {
        throw new Error(`The FPGA architect JSON fallback was not valid: ${error?.message || String(error)}`);
      }
    } else {
      throw new Error(`The FPGA architect JSON fallback was not valid: ${error?.message || String(error)}`);
    }
  }

  return coerceParsedFpgaArchitectProject(parsed, 'JSON');
}

export function buildFpgaArchitectRetryPrompt(params: {
  originalPrompt: string;
  errorSummary: string;
}) {
  const { originalPrompt, errorSummary } = params;
  const structuralRules = [
    'Return only a Markdown project manifest in the exact required structure.',
    'The very first characters of your response must be exactly: "# PROJECT".',
    'Do not begin with "markdown", "here is", code fences, bullets, labels, or any explanatory text.',
    'Do not add prose before or after the manifest.',
    'Include every generated file as its own "# FILE:" block with fenced full content.',
    'Keep every generated path relative and inside the project root.',
    'Include VHDL RTL, testbench, docs, requirements, architecture notes, and GHDL run instructions unless the compact mode later narrows the file set.',
    'Keep docs/requirements/architecture content compact and keep folder_tree/quality_checklist brief.',
    'top_entity must be explicit and must exactly match a generated DUT entity name.',
    'ghdl.top_testbench must be explicit and must exactly match a generated testbench entity name.',
    'The returned project must pass a full GHDL compile, elaborate, and simulate flow as written. Use the failure details above to repair the generated files.',
    'Before returning, self-audit every generated VHDL file and regenerate any file that still contains declarations after begin, helper procedures/functions mutating outer-scope state, output-port readback, or signal/variable assignment misuse.',
    'Fallback to strict JSON only if you absolutely cannot produce the Markdown manifest format.',
  ];
  return `${originalPrompt}

### Automatic Retry: Strict FPGA Architect Manifest Repair
Your previous response did not satisfy the required machine-readable FPGA project contract.

Failure summary:
- ${errorSummary}

Hard requirements:
${buildNumberedRuleList(structuralRules)}

Strict GHDL / VHDL rules:
${buildNumberedRuleList(FPGA_ARCHITECT_STRICT_RULE_LIST, structuralRules.length + 1)}

${buildRecurringVhdlFailureGuardSection({
  heading: 'Recurring failure guards you must explicitly self-audit before returning',
  numbered: true,
})}

Start from this exact scaffold and fill it in:
${FPGA_ARCHITECT_MANIFEST_SCAFFOLD}
`;
}

export function buildFpgaArchitectJsonRepairPrompt(params: {
  originalPrompt: string;
  invalidResponse: string;
  errorSummary: string;
}) {
  const { originalPrompt, invalidResponse, errorSummary } = params;
  const maxSnippetChars = 8000;
  const trimmedInvalidResponse = invalidResponse.trim();
  const invalidResponseSnippet = trimmedInvalidResponse.length > maxSnippetChars
    ? `${trimmedInvalidResponse.slice(0, 4000)}\n...\n${trimmedInvalidResponse.slice(-4000)}`
    : trimmedInvalidResponse;
  const structuralRules = [
    'Return only a valid Markdown project manifest in the exact required structure.',
    'The very first characters of your response must be exactly: "# PROJECT".',
    'Do not begin with "markdown", "here is", code fences, bullets, labels, or any explanatory text.',
    'Do not add comments, summaries, or explanation text outside the manifest.',
    'Preserve the intended project content, but fix any truncated strings, broken fences, malformed headings, missing file sections, or incomplete metadata.',
    'Keep every file path relative and inside the project root.',
    'Ensure top_entity exactly matches a generated DUT entity name and ghdl.top_testbench exactly matches a generated testbench entity name.',
    'Ensure every file block contains a full fenced body with no truncation.',
    'Before returning, self-audit every generated VHDL file and regenerate any file that still contains declarations after begin, helper procedures/functions mutating outer-scope state, output-port readback, or signal/variable assignment misuse.',
    `If you absolutely cannot comply in Markdown, then fall back to strict JSON and apply the ${LOCAL_LLM_JSON_GENERATION_SKILL_NAME} skill.`,
  ];
  return `${originalPrompt}

### Automatic Retry: Machine-Readable Structural Repair
Your previous FPGA Architect response contained the right kind of project content, but its machine-readable structure was invalid and could not be parsed.

Parser failure:
- ${errorSummary}

Broken response to repair:
\`\`\`
${invalidResponseSnippet}
\`\`\`

Hard requirements:
${buildNumberedRuleList(structuralRules)}

Strict GHDL / VHDL rules:
${buildNumberedRuleList(FPGA_ARCHITECT_STRICT_RULE_LIST, structuralRules.length + 1)}

${buildRecurringVhdlFailureGuardSection({
  heading: 'Recurring failure guards you must explicitly self-audit before returning',
  numbered: true,
})}

Use this exact scaffold:
${FPGA_ARCHITECT_MANIFEST_SCAFFOLD}
`;
}

export function buildFpgaArchitectCompactRetryPrompt(params: {
  originalPrompt: string;
  errorSummary: string;
  compactMode?: 'compact' | 'ultra_compact' | 'minimal';
}) {
  const { originalPrompt, errorSummary, compactMode = 'compact' } = params;
  const compactingRules = compactMode === 'minimal'
    ? `9. Generate only the minimal essential file set:
- src/<dut>.vhd
- tb/tb_<dut>.vhd
- constraints/<project>.xdc
- Makefile
- README.md
- sim/run_ghdl.sh
10. Do not generate extra docs folders, requirements folders, architecture folders, helper files, or optional artifacts in this mode.
11. Keep README.md very short and practical.
12. Keep "folder_tree", "summary", "assumptions", "warnings", and "quality_checklist" extremely short.
13. Ensure every file block is complete and not truncated.
14. The returned project must still pass the full GHDL compile, elaborate, and simulate flow.
15. Return the regenerated Markdown manifest only.`
    : compactMode === 'ultra_compact'
    ? `9. Keep documentation extremely short: each markdown file should be concise, practical, and no longer than about 8-12 lines.
10. Keep the generated project minimal and deterministic. Prefer the smallest file set that still gives a complete usable project.
11. Avoid long prose paragraphs, repeated explanations, banner text, decorative separators, or duplicated instructions.
12. Ensure every file block is complete and not truncated.
13. The returned project must still pass the full GHDL compile, elaborate, and simulate flow.
14. Return the regenerated Markdown manifest only.`
    : `9. Keep "folder_tree", "summary", "assumptions", "warnings", and "quality_checklist" brief.
10. Keep every file path relative and inside the project root.
11. Ensure every file block is complete and not truncated.
12. The returned project must still pass the full GHDL compile, elaborate, and simulate flow.
13. Return the regenerated Markdown manifest only.`;
  const structuralRules = [
    'Return only a Markdown project manifest in the required structure.',
    'The very first characters of your response must be exactly: "# PROJECT".',
    'Do not begin with "markdown", "here is", code fences, bullets, labels, or any explanatory text.',
    'Include complete VHDL RTL and complete self-checking testbench file contents.',
    'top_entity must be explicit and must exactly match a generated DUT entity name.',
    'ghdl.top_testbench must be explicit and must exactly match a generated testbench entity name.',
    'Keep markdown/docs/requirements/architecture text concise and practical.',
    'Use one "# FILE:" block per generated file with a full fenced file body.',
    'Before returning, self-audit every generated VHDL file and regenerate any file that still contains declarations after begin, helper procedures/functions mutating outer-scope state, output-port readback, or signal/variable assignment misuse.',
  ];
  return `${originalPrompt}

### Automatic Retry: ${compactMode === 'minimal' ? 'Minimal' : compactMode === 'ultra_compact' ? 'Ultra-Compact' : 'Compact'} Full Regeneration
The previous FPGA Architect responses were still structurally invalid after repair.

Failure summary:
- ${errorSummary}

You must regenerate the full project again, but keep the response compact enough to avoid truncation while preserving the required manifest structure and all essential project files.

Hard requirements:
${buildNumberedRuleList(structuralRules)}

Strict GHDL / VHDL rules:
${buildNumberedRuleList(FPGA_ARCHITECT_STRICT_RULE_LIST, structuralRules.length + 1)}
${buildRecurringVhdlFailureGuardSection({
  heading: 'Recurring failure guards you must explicitly self-audit before returning',
  numbered: true,
})}
${compactingRules}

Use this exact scaffold:
${FPGA_ARCHITECT_MANIFEST_SCAFFOLD}
`;
}

export function buildFpgaArchitectTestRunPrompt(params: {
  originalPrompt: string;
  compactMode?: 'ultra_compact' | 'minimal';
}) {
  const { originalPrompt, compactMode = 'minimal' } = params;
  const compactionRules = compactMode === 'minimal'
    ? [
      'Generate only the minimal essential file set: src/<dut>.vhd, tb/tb_<dut>.vhd, constraints/<project>.xdc, Makefile, README.md, and sim/run_ghdl.sh.',
      'Do not generate extra docs folders, requirements folders, architecture folders, helper files, or optional artifacts in this mode.',
      'Keep README.md very short and practical.',
      'Keep "folder_tree", "summary", "assumptions", "warnings", and "quality_checklist" extremely short.',
      'Ensure every file block is complete and not truncated.',
      'The returned project must still pass the full GHDL compile, elaborate, and simulate flow.',
      'Return the regenerated Markdown manifest only.',
    ]
    : [
      'Keep documentation extremely short and practical.',
      'Prefer the smallest deterministic file set that still yields a complete usable project.',
      'Avoid long prose, repeated explanations, banner text, decorative separators, or duplicated instructions.',
      'Ensure every file block is complete and not truncated.',
      'The returned project must still pass the full GHDL compile, elaborate, and simulate flow.',
      'Return the regenerated Markdown manifest only.',
    ];
  const structuralRules = [
    'This is a validator-focused test run. Optimize for compactness, determinism, and GHDL passability rather than breadth.',
    'Return only a Markdown project manifest in the required structure.',
    'The very first characters of your response must be exactly: "# PROJECT".',
    'Do not begin with "markdown", "here is", code fences, bullets, labels, or any explanatory text.',
    'Include complete VHDL RTL and a complete self-checking testbench.',
    'top_entity must be explicit and must exactly match a generated DUT entity name.',
    'ghdl.top_testbench must be explicit and must exactly match a generated testbench entity name.',
    'Use one "# FILE:" block per generated file with a full fenced file body.',
    'Before returning, self-audit every generated VHDL file and regenerate any file that still contains declarations after begin, helper procedures/functions mutating outer-scope state, output-port readback, or signal/variable assignment misuse.',
  ];
  return `${originalPrompt}

### Test-Run Compact Generation Mode
The app is executing a strict end-to-end validator test with a local model. You must generate the smallest complete project that still satisfies the requested FPGA/VHDL task and passes the full acceptance flow.

Hard requirements:
${buildNumberedRuleList(structuralRules)}

Strict GHDL / VHDL rules:
${buildNumberedRuleList(FPGA_ARCHITECT_STRICT_RULE_LIST, structuralRules.length + 1)}

${buildRecurringVhdlFailureGuardSection({
  heading: 'Recurring failure guards you must explicitly self-audit before returning',
  numbered: true,
})}

Additional compact-mode rules:
${buildNumberedRuleList(compactionRules, structuralRules.length + FPGA_ARCHITECT_STRICT_RULE_LIST.length + 1)}

Use this exact scaffold:
${FPGA_ARCHITECT_MANIFEST_SCAFFOLD}
`;
}

export async function saveFpgaArchitectProject(params: {
  projectPath: string;
  project: FpgaArchitectProject;
}) {
  const normalizedProjectRootName = path.basename(path.resolve(params.projectPath)).toLowerCase();
  const outputDirectory = normalizedProjectRootName === params.project.sanitizedProjectName.toLowerCase()
    ? params.projectPath
    : path.join(params.projectPath, params.project.sanitizedProjectName);
  await fs.mkdir(outputDirectory, { recursive: true });

  const savedFiles = await Promise.all(params.project.files.map(async (file) => {
    const relativePath = assertSafeRelativeProjectPath(file.path);
    const absolutePath = path.join(outputDirectory, relativePath);
    const absoluteDir = path.dirname(absolutePath);
    await fs.mkdir(absoluteDir, { recursive: true });
    await fs.writeFile(absolutePath, file.content.replace(/\r\n/g, '\n'), 'utf8');
    return {
      ...file,
      savedPath: absolutePath,
      kind: mapArchitectFileTypeToKind(file.fileType),
      name: path.basename(relativePath),
      path: absolutePath,
    };
  }));

  return {
    outputDirectory,
    savedFiles,
  };
}

export function buildFpgaArchitectMarkdownReport(params: {
  project: FpgaArchitectProject;
  outputDirectory: string;
}) {
  const { project, outputDirectory } = params;
  const warningLines = project.warnings.length > 0 ? project.warnings.map((item) => `- ${item}`).join('\n') : '- None.';
  const assumptionLines = project.assumptions.length > 0 ? project.assumptions.map((item) => `- ${item}`).join('\n') : '- None stated.';
  const checklistLines = project.qualityChecklist.length > 0 ? project.qualityChecklist.map((item) => `- ${item}`).join('\n') : '- Review generated RTL and testbench before simulation.';
  const fileLines = project.files.map((file) => `- ${file.path} (${file.fileType})`).join('\n');
  const ghdlLines = project.ghdl.runCommands.length > 0 ? project.ghdl.runCommands.map((cmd) => `- ${cmd}`).join('\n') : '- GHDL commands were not returned.';

  return `## Executive Summary
${project.summary}

## Project
- Project Name: ${project.projectName}
- Sanitized Folder: ${project.sanitizedProjectName}
- Top Entity: ${project.topEntity}
- VHDL Standard: ${project.vhdlStandard}
- Target FPGA: ${project.targetFpga || 'Not specified'}
- Output Folder: ${outputDirectory}

## Assumptions
${assumptionLines}

## Warnings
${warningLines}

## Generated Files
${fileLines}

## GHDL Plan
- Top Testbench: ${project.ghdl.topTestbench}
- Expected Result: ${project.ghdl.expectedResult}
${ghdlLines}

## Quality Checklist
${checklistLines}
`;
}
