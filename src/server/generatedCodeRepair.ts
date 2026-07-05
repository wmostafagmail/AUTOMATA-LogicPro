import fs from 'fs/promises';
import path from 'path';
import type { AiMacroId } from '../aiMacros';
import type { GeneratedVhdlFailureDetail, GeneratedVhdlValidationResult } from './generatedVhdlValidation';
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

function normalizeFileName(value: string) {
  return path.basename(value).toLowerCase();
}

function extractExplicitFailurePaths(validation: GeneratedVhdlValidationResult, availableFiles: RepairableGeneratedFile[]) {
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

${buildRecurringVhdlFailureGuardSection({
  heading: 'Always-on recurring failure guards',
  numbered: true,
})}

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
