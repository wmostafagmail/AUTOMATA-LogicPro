import type { ProjectFileEntry } from './types.ts';

const GENERATED_ARCHITECT_FOLDER_PATTERNS = [
  /^fpga_vhdl_project(?:$|[_-])/i,
  /^ai generated tb$/i,
  /^ai generated rtl$/i,
  /^ai_generated_tb$/i,
  /^ai_generated_rtl$/i,
];

const EXPLICIT_REUSE_PATTERN = /\b(?:reuse|re-use|reference|refer to|use|continue from|build on|extend|modify|preserve|keep)\b[\s\S]{0,80}\b(?:existing|generated|current|available|prior|previous)\b/i;

function splitPathSegments(filePath: string) {
  return filePath
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function isGeneratedArchitectPath(filePath: string) {
  const segments = splitPathSegments(filePath);
  return segments.some((segment) => GENERATED_ARCHITECT_FOLDER_PATTERNS.some((pattern) => pattern.test(segment)));
}

export function architectPromptRequestsReuse(promptText: string) {
  return EXPLICIT_REUSE_PATTERN.test(promptText || '');
}

export function filterArchitectReferenceFiles(
  projectFiles: ProjectFileEntry[],
  options?: {
    allowGeneratedReuse?: boolean;
  }
) {
  if (options?.allowGeneratedReuse) {
    return projectFiles;
  }

  return projectFiles.filter((file) => !isGeneratedArchitectPath(file.path));
}
