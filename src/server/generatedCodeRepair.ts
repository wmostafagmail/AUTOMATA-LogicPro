import fs from 'fs/promises';
import path from 'path';
import type { AiMacroId } from '../aiMacros';
import type { GeneratedVhdlFailureDetail, GeneratedVhdlValidationResult } from './generatedVhdlValidation';
import { buildCodeGeneratingMacroRuleSection } from './ghdlStrictVhdlRules';
import { buildRecurringVhdlFailureGuardSection } from './recurringVhdlFailureGuards';

export type RepairableGeneratedFile = {
  relativePath: string;
  absolutePath: string;
  content: string;
  kind: 'testbench' | 'module' | 'assertions' | 'rtl_skeleton' | 'unknown';
};

export type GeneratedCodeRepair = {
  relativePath: string;
  content: string;
};

function normalizePromptPath(value: string) {
  return value.replace(/\\/g, '/');
}

function pathsReferToSameFile(left: string, right: string) {
  const normalizedLeft = normalizePromptPath(left).toLowerCase();
  const normalizedRight = normalizePromptPath(right).toLowerCase();
  return normalizedLeft === normalizedRight
    || normalizedLeft.endsWith(`/${normalizedRight}`)
    || normalizedRight.endsWith(`/${normalizedLeft}`);
}

function normalizeFileName(value: string) {
  return path.basename(value).toLowerCase();
}

function extractExplicitFailurePaths(validation: GeneratedVhdlValidationResult, availableFiles: RepairableGeneratedFile[]) {
  const explicitPaths = new Set(
    (validation.failureDetails || [])
      .map((detail) => detail.relativePath)
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => normalizePromptPath(value).toLowerCase()),
  );
  if (explicitPaths.size > 0) {
    const directMatches = availableFiles.filter((file) => {
      const filePath = normalizePromptPath(file.relativePath).toLowerCase();
      return Array.from(explicitPaths).some((detailPath) => pathsReferToSameFile(filePath, detailPath));
    });
    if (directMatches.length > 0) {
      return directMatches;
    }
  }

  const haystacks = [
    validation.summary,
    ...validation.logs,
    ...(validation.failureDetails || []).flatMap((detail) => [detail.message, detail.excerpt]),
  ]
    .filter((value) => typeof value === 'string' && value.trim().length > 0)
    .join('\n')
    .toLowerCase();

  const matched = availableFiles.filter((file) => {
    const relative = normalizePromptPath(file.relativePath).toLowerCase();
    const base = normalizeFileName(file.relativePath);
    return haystacks.includes(relative) || haystacks.includes(base);
  });

  return matched.length > 0 ? matched : availableFiles;
}

function renderFailureDetails(details: GeneratedVhdlFailureDetail[]) {
  if (details.length === 0) {
    return '- No machine-readable failure classes were available. Use the GHDL logs and repair the exact failing files only.';
  }

  return details.map((detail, index) => {
    const lines = [
      `${index + 1}. Failure class: ${detail.category} / ${detail.code}`,
      `   Summary: ${detail.message}`,
    ];
    if (detail.relativePath) {
      lines.push(`   File: ${normalizePromptPath(detail.relativePath)}`);
    }
    if (typeof detail.lineHint === 'number' && Number.isFinite(detail.lineHint)) {
      lines.push(`   Line hint: ${detail.lineHint}`);
    }
    if (detail.ruleIds && detail.ruleIds.length > 0) {
      lines.push(`   Canonical rules: ${detail.ruleIds.join(', ')}`);
    }
    if (detail.forbiddenConstruct) {
      lines.push(`   Forbidden construct: ${detail.forbiddenConstruct}`);
    }
    if (detail.legalReplacementPattern) {
      lines.push(`   Legal replacement pattern: ${detail.legalReplacementPattern}`);
    }
    return lines.join('\n');
  }).join('\n');
}

function findRelevantFileForDetail(
  detail: GeneratedVhdlFailureDetail,
  relevantFiles: RepairableGeneratedFile[],
) {
  const rawPath = typeof detail.relativePath === 'string' ? normalizePromptPath(detail.relativePath).toLowerCase() : '';
  if (!rawPath) return null;
  return relevantFiles.find((file) => pathsReferToSameFile(normalizePromptPath(file.relativePath).toLowerCase(), rawPath)) || null;
}

function renderLineContext(file: RepairableGeneratedFile | null, lineHint: number | null | undefined) {
  if (!file || typeof lineHint !== 'number' || !Number.isFinite(lineHint) || lineHint < 1) {
    return null;
  }

  const lines = file.content.split(/\r?\n/);
  const startLine = Math.max(1, lineHint - 1);
  const endLine = Math.min(lines.length, lineHint + 1);
  const width = String(endLine).length;
  const snippet = lines
    .slice(startLine - 1, endLine)
    .map((line, index) => {
      const lineNumber = startLine + index;
      const marker = lineNumber === lineHint ? '>' : ' ';
      return `${marker} ${String(lineNumber).padStart(width, ' ')} | ${line}`;
    })
    .join('\n');

  return snippet.trimEnd();
}

function renderExactIssuePackets(details: GeneratedVhdlFailureDetail[], relevantFiles: RepairableGeneratedFile[]) {
  if (details.length === 0) {
    return '- No exact validator issue packets were available. Use the recent logs and target files below.';
  }

  return details.map((detail, index) => {
    const file = findRelevantFileForDetail(detail, relevantFiles);
    const issueLines = [
      `### Issue ${index + 1}: ${detail.code}`,
      `File: ${detail.relativePath ? normalizePromptPath(detail.relativePath) : 'unknown'}`,
      `Line: ${typeof detail.lineHint === 'number' && Number.isFinite(detail.lineHint) ? detail.lineHint : 'unknown'}`,
      `Failure: ${detail.category} / ${detail.code}`,
    ];

    const lineContext = renderLineContext(file, detail.lineHint);
    if (lineContext) {
      issueLines.push([
        'Bad code context:',
        '```vhdl',
        lineContext,
        '```',
      ].join('\n'));
    } else if (detail.excerpt || detail.forbiddenConstruct) {
      issueLines.push([
        'Bad code or expression:',
        '```text',
        detail.excerpt || detail.forbiddenConstruct || '',
        '```',
      ].join('\n'));
    }

    if (detail.forbiddenConstruct) {
      issueLines.push(`Forbidden construct: ${detail.forbiddenConstruct}`);
    }
    if (detail.legalReplacementPattern) {
      issueLines.push(`Required local replacement: ${detail.legalReplacementPattern}`);
    }
    issueLines.push('Repair instruction: fix this exact local issue and any directly coupled same-file instances only; do not rewrite unrelated legal code.');

    return issueLines.join('\n');
  }).join('\n\n');
}

function renderLogTail(validation: GeneratedVhdlValidationResult) {
  const recentLogs = validation.logs
    .filter((line) => typeof line === 'string' && line.trim().length > 0)
    .slice(-12);

  if (recentLogs.length === 0) {
    return '- No recent GHDL log lines were available.';
  }

  return recentLogs.map((line) => `- ${line}`).join('\n');
}

function renderTargetFiles(files: RepairableGeneratedFile[]) {
  return files.map((file) => {
    const fenceLang = file.relativePath.toLowerCase().endsWith('.md') ? 'md' : 'vhdl';
    return [
      `### ${normalizePromptPath(file.relativePath)}`,
      `\`\`\`${fenceLang}`,
      file.content.trimEnd(),
      '```',
    ].join('\n');
  }).join('\n\n');
}

function renderFileScopedRepairPlan(details: GeneratedVhdlFailureDetail[], relevantFiles: RepairableGeneratedFile[]) {
  const relevantPathMap = new Map(
    relevantFiles.map((file) => [normalizePromptPath(file.relativePath).toLowerCase(), normalizePromptPath(file.relativePath)]),
  );
  const grouped = new Map<string, GeneratedVhdlFailureDetail[]>();

  details.forEach((detail) => {
    const rawPath = typeof detail.relativePath === 'string' ? normalizePromptPath(detail.relativePath).toLowerCase() : '';
    const matchedPath = Array.from(relevantPathMap.keys()).find((candidate) => rawPath && pathsReferToSameFile(candidate, rawPath));
    const key = matchedPath ? relevantPathMap.get(matchedPath)! : '__global__';
    const list = grouped.get(key) || [];
    list.push(detail);
    grouped.set(key, list);
  });

  if (grouped.size === 0) {
    return [
      '- Repair the listed target files only.',
      '- If multiple validator/GHDL failures point at the same file, fix all of them in one replacement for that file.',
      '- Preserve design intent and preserve unchanged files exactly unless a dependency must move with the target repair.',
    ].join('\n');
  }

  return Array.from(grouped.entries()).map(([targetPath, fileDetails]) => {
    if (targetPath === '__global__') {
      return [
        '### Global repair constraints',
        '- Apply these constraints while repairing the listed target files.',
        ...fileDetails.map((detail) => {
          const summary = [`- ${detail.category} / ${detail.code}: ${detail.message}`];
          if (detail.forbiddenConstruct) {
            summary.push(`  forbidden: ${detail.forbiddenConstruct}`);
          }
          if (detail.legalReplacementPattern) {
            summary.push(`  replace with: ${detail.legalReplacementPattern}`);
          }
          return summary.join('\n');
        }),
      ].join('\n');
    }

    return [
      `### ${targetPath}`,
      '- Return one full replacement for this file that resolves every listed class below in the same pass.',
      ...fileDetails.map((detail) => {
        const summary = [`- ${detail.category} / ${detail.code}: ${detail.message}`];
        if (detail.forbiddenConstruct) {
          summary.push(`  forbidden: ${detail.forbiddenConstruct}`);
        }
        if (detail.legalReplacementPattern) {
          summary.push(`  replace with: ${detail.legalReplacementPattern}`);
        }
        return summary.join('\n');
      }),
    ].join('\n');
  }).join('\n\n');
}

export function buildGeneratedCodeRepairPrompt(params: {
  originalPrompt: string;
  macroId: AiMacroId;
  macroLabel: string;
  validation: GeneratedVhdlValidationResult;
  availableFiles: RepairableGeneratedFile[];
}) {
  const { originalPrompt, macroId, macroLabel, validation, availableFiles } = params;
  const relevantFiles = extractExplicitFailurePaths(validation, availableFiles);
  const targetList = relevantFiles.map((file) => `- ${normalizePromptPath(file.relativePath)}`).join('\n');
  const fullFileList = availableFiles.map((file) => `- ${normalizePromptPath(file.relativePath)} (${file.kind})`).join('\n');

  return `${originalPrompt}

### Automatic Retry: Shared Generated-Code Repair Pipeline
The ${macroLabel} macro generated files that did not pass ${validation.stage === 'prevalidate' ? 'strict pre-GHDL validation' : `GHDL ${validation.stage} validation`}.

This is a repair-only pass.
- Do not regenerate the whole project from scratch.
- Do not return prose, JSON, Markdown manifests, diffs, patches, or explanations.
- Repair only the generated file set already created by the app.
- If a helper/package/testbench dependency must change, return the full corrected replacement file for it.

Macro:
- ${macroId}

Current generated file set:
${fullFileList}

Primary repair targets:
${targetList}

Machine-readable failure classes:
${renderFailureDetails(validation.failureDetails || [])}

Failure evidence contract:
- Do not infer or guess the failure reason. Use only the machine-readable classes, exact issue packets, file-scoped repair plan, and validator/GHDL log lines below.
- The exact file, line, snippet/expression, forbidden construct, and required replacement are authoritative whenever present.
- If a detail lacks a line number, repair only the smallest same-file construct identified by its failure code/message; do not redesign unrelated logic.
- If multiple issues appear in one file, return one complete replacement for that file that fixes the whole coupled cluster.

Exact issue packets:
${renderExactIssuePackets(validation.failureDetails || [], relevantFiles)}

File-scoped repair plan:
${renderFileScopedRepairPlan(validation.failureDetails || [], relevantFiles)}

${buildRecurringVhdlFailureGuardSection({
  heading: 'Always-on recurring failure guards',
  numbered: true,
})}

${buildCodeGeneratingMacroRuleSection(macroId)}

Recent validator / GHDL log lines:
${renderLogTail(validation)}

Hard output contract:
1. Return only replacement file blocks.
2. Each replacement block must start with a filename heading exactly like:
   ### relative/path/to/file.vhd
3. Immediately after the heading, return one fenced code block tagged with the real language, usually \`vhdl\`.
4. Return the full corrected file contents, not partial snippets.
5. Return only files you are changing.
6. Keep file paths relative and exactly matched to the generated file set above.
7. Every returned VHDL file must satisfy the strict GHDL/VHDL rules already active in this prompt.
8. Do not modify the design intent unless the failure itself proves a construct is illegal or inconsistent.
9. Prefer minimal file-local repairs: preserve passing files, preserve names/interfaces unless a listed failure requires change, and do not redesign the architecture when a localized correction is sufficient.
10. Do not insert meta-comments or repair annotations such as "REPAIRED", "FIXED", "CHANGED", "UPDATED", or similar commentary anywhere in the returned code.
11. When fixing declarations after "begin", move the exact declaration or subprogram block intact into a legal declarative region. Do not split parameter lists, paraphrase declarations, or leave behind orphaned header/body fragments.

Existing generated files to repair:

${renderTargetFiles(relevantFiles)}
`;
}

export function parseGeneratedCodeRepairs(params: {
  text: string;
  allowedFiles: RepairableGeneratedFile[];
}) {
  const { text, allowedFiles } = params;
  const allowedByPath = new Map(
    allowedFiles.map((file) => [normalizePromptPath(file.relativePath).toLowerCase(), file]),
  );
  const repairs: GeneratedCodeRepair[] = [];
  const blockExpression = /(?:^|\n)(?:###\s+([^\n]+)|# FILE:\s*([^\n]+))\n```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g;

  for (const match of text.matchAll(blockExpression)) {
    const requestedPath = normalizePromptPath((match[1] || match[2] || '').trim()).toLowerCase();
    const allowed = allowedByPath.get(requestedPath);
    if (!allowed) {
      continue;
    }
    repairs.push({
      relativePath: allowed.relativePath,
      content: match[3].trimEnd(),
    });
  }

  const deduped = new Map<string, GeneratedCodeRepair>();
  repairs.forEach((repair) => deduped.set(normalizePromptPath(repair.relativePath).toLowerCase(), repair));
  return Array.from(deduped.values());
}

export async function applyGeneratedCodeRepairs(params: {
  availableFiles: RepairableGeneratedFile[];
  repairs: GeneratedCodeRepair[];
}) {
  const repairMap = new Map(
    params.repairs.map((repair) => [normalizePromptPath(repair.relativePath).toLowerCase(), repair.content]),
  );

  const updatedFiles = await Promise.all(params.availableFiles.map(async (file) => {
    const nextContent = repairMap.get(normalizePromptPath(file.relativePath).toLowerCase());
    if (typeof nextContent !== 'string') {
      return file;
    }
    await fs.mkdir(path.dirname(file.absolutePath), { recursive: true });
    await fs.writeFile(file.absolutePath, `${nextContent.replace(/\r\n/g, '\n')}\n`, 'utf8');
    return {
      ...file,
      content: nextContent,
    };
  }));

  return updatedFiles;
}
