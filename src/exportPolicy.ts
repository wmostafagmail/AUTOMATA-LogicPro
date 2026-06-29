import type { ProjectContextPayload } from './types';

export type ProviderDeployment = 'local' | 'remote';

export interface ScrubbedProjectContextResult {
  context: ProjectContextPayload;
  redactionNotes: string[];
}

export interface RemoteExportPreviewSection {
  id: 'query' | 'waveform' | 'protocol_scan' | 'hazard_scan' | 'project_context' | 'export_policy' | 'macro_contract' | 'final_prompt';
  title: string;
  content: string;
  charCount: number;
}

export interface RemoteExportPreviewPayload {
  schemaVersion: 1;
  provider: string;
  model: string;
  deployment: 'remote';
  macroId: string;
  totalChars: number;
  sections: RemoteExportPreviewSection[];
  notes: string[];
}

function computeDeterministicHashHex(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

const LOCAL_PROVIDER_IDS = new Set(['ollama', 'mtplx']);
const REMOTE_EXPORT_ALLOWED_EXTENSIONS = new Set([
  '.vcd', '.vsd', '.json', '.vhd', '.vhdl', '.sv', '.v', '.vh',
  '.c', '.cc', '.cpp', '.h', '.hpp', '.py', '.tcl', '.md', '.txt',
]);
const REMOTE_EXPORT_MAX_FILE_PATHS = 80;
const REMOTE_EXPORT_MAX_EXCERPTS = 8;
const REMOTE_EXPORT_MAX_EXCERPT_CHARS = 12_000;

const SENSITIVE_PATH_PATTERNS = [
  /(^|\/)\.env(\.|$)/i,
  /(^|\/).*\.(pem|key|p12|pfx|crt|cer)$/i,
  /(^|\/)(id_rsa|id_dsa|known_hosts|authorized_keys)$/i,
  /(^|\/)(secrets?|credentials?|tokens?|passwd|shadow)(\/|\.|$)/i,
];

const SENSITIVE_CONTENT_PATTERNS: Array<[RegExp, string]> = [
  [/-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]'],
  [/\b(AKIA|ASIA)[A-Z0-9]{16}\b/g, '[REDACTED_AWS_ACCESS_KEY]'],
  [/\b(sk|rk|pk)_[A-Za-z0-9_-]{16,}\b/g, '[REDACTED_API_KEY]'],
  [/\bBearer\s+[A-Za-z0-9._=-]{16,}\b/gi, 'Bearer [REDACTED_TOKEN]'],
  [/\b(api[_-]?key|token|secret|password|passwd)\b\s*[:=]\s*["']?([^\s"',`]{6,})["']?/gi, '$1=[REDACTED]'],
];

function scrubSensitiveText(value: string) {
  return SENSITIVE_CONTENT_PATTERNS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    value
  );
}

function isSensitiveProjectPath(filePath: string) {
  return SENSITIVE_PATH_PATTERNS.some((pattern) => pattern.test(filePath));
}

function hasAllowedRemoteExportExtension(filePath: string) {
  const normalized = String(filePath || '').toLowerCase();
  const lastDot = normalized.lastIndexOf('.');
  const extension = lastDot >= 0 ? normalized.slice(lastDot) : '';
  return REMOTE_EXPORT_ALLOWED_EXTENSIONS.has(extension);
}

function normalizePreviewSection(
  id: RemoteExportPreviewSection['id'],
  title: string,
  content: string | null | undefined
): RemoteExportPreviewSection | null {
  const normalizedContent = typeof content === 'string' ? content.trim() : '';
  if (!normalizedContent) {
    return null;
  }
  return {
    id,
    title,
    content: normalizedContent,
    charCount: normalizedContent.length,
  };
}

export function getProviderDeployment(providerId: string | null | undefined): ProviderDeployment {
  return LOCAL_PROVIDER_IDS.has(String(providerId || '').trim().toLowerCase()) ? 'local' : 'remote';
}

export function requiresRemoteExportConsent(providerId: string | null | undefined) {
  return getProviderDeployment(providerId) === 'remote';
}

export function scrubProjectContextForRemoteExport(
  projectContext: ProjectContextPayload | null | undefined
): ScrubbedProjectContextResult | null {
  if (!projectContext) {
    return null;
  }

  const redactionNotes: string[] = [];
  const filteredFilePaths = projectContext.filePaths
    .filter((filePath) => {
      if (isSensitiveProjectPath(filePath)) {
        redactionNotes.push(`Excluded sensitive path: ${filePath}`);
        return false;
      }
      if (!hasAllowedRemoteExportExtension(filePath)) {
        redactionNotes.push(`Excluded non-allowlisted file path: ${filePath}`);
        return false;
      }
      return true;
    })
    .slice(0, REMOTE_EXPORT_MAX_FILE_PATHS);

  const filteredExcerpts = projectContext.excerpts
    .filter((excerpt) => {
      if (isSensitiveProjectPath(excerpt.path)) {
        redactionNotes.push(`Skipped excerpt from sensitive path: ${excerpt.path}`);
        return false;
      }
      if (!hasAllowedRemoteExportExtension(excerpt.path)) {
        redactionNotes.push(`Skipped excerpt from non-allowlisted file: ${excerpt.path}`);
        return false;
      }
      return true;
    })
    .slice(0, REMOTE_EXPORT_MAX_EXCERPTS)
    .map((excerpt) => {
      const truncatedContent = excerpt.content.slice(0, REMOTE_EXPORT_MAX_EXCERPT_CHARS);
      const scrubbedContent = scrubSensitiveText(truncatedContent);
      if (truncatedContent.length !== excerpt.content.length) {
        redactionNotes.push(`Truncated excerpt to ${REMOTE_EXPORT_MAX_EXCERPT_CHARS} chars: ${excerpt.path}`);
      }
      if (scrubbedContent !== truncatedContent) {
        redactionNotes.push(`Redacted sensitive content in: ${excerpt.path}`);
      }
      return {
        path: excerpt.path,
        content: scrubbedContent,
      };
    });

  return {
    context: {
      ...projectContext,
      filePaths: filteredFilePaths,
      excerpts: filteredExcerpts,
    },
    redactionNotes,
  };
}

export function buildRemoteExportPreviewPayload(params: {
  provider: string;
  model: string;
  macroId: string;
  query: string;
  waveformText: string;
  protocolMarkdown?: string | null;
  hazardMarkdown?: string | null;
  projectText?: string | null;
  exportPolicyText?: string | null;
  macroContract?: string | null;
  finalPrompt: string;
  notes?: string[];
}): RemoteExportPreviewPayload {
  const {
    provider,
    model,
    macroId,
    query,
    waveformText,
    protocolMarkdown,
    hazardMarkdown,
    projectText,
    exportPolicyText,
    macroContract,
    finalPrompt,
    notes = [],
  } = params;

  const sections = [
    normalizePreviewSection('query', 'User Query', query),
    normalizePreviewSection('waveform', 'Waveform Summary', waveformText),
    normalizePreviewSection('protocol_scan', 'Protocol Scan', protocolMarkdown),
    normalizePreviewSection('hazard_scan', 'Hazard Scan', hazardMarkdown),
    normalizePreviewSection('project_context', 'Project Context', projectText),
    normalizePreviewSection('export_policy', 'Export Policy Notes', exportPolicyText),
    normalizePreviewSection('macro_contract', 'Macro Contract', macroContract),
    normalizePreviewSection('final_prompt', 'Final Prompt Sent To Remote Model', finalPrompt),
  ].filter((section): section is RemoteExportPreviewSection => Boolean(section));

  return {
    schemaVersion: 1,
    provider,
    model,
    deployment: 'remote',
    macroId,
    totalChars: sections.reduce((sum, section) => sum + section.charCount, 0),
    sections,
    notes: notes.filter(Boolean),
  };
}

export function computeRemoteExportPreviewHash(preview: RemoteExportPreviewPayload) {
  return computeDeterministicHashHex(JSON.stringify(preview));
}
