import type { ProjectContextPayload } from './types';

export type ProviderDeployment = 'local' | 'remote';

export interface ScrubbedProjectContextResult {
  context: ProjectContextPayload;
  redactionNotes: string[];
}

const LOCAL_PROVIDER_IDS = new Set(['ollama', 'mtplx']);
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
  const filteredFilePaths = projectContext.filePaths.filter((filePath) => {
    const sensitive = isSensitiveProjectPath(filePath);
    if (sensitive) {
      redactionNotes.push(`Excluded sensitive path: ${filePath}`);
    }
    return !sensitive;
  });

  const filteredExcerpts = projectContext.excerpts
    .filter((excerpt) => {
      const sensitive = isSensitiveProjectPath(excerpt.path);
      if (sensitive) {
        redactionNotes.push(`Skipped excerpt from sensitive path: ${excerpt.path}`);
      }
      return !sensitive;
    })
    .map((excerpt) => {
      const scrubbedContent = scrubSensitiveText(excerpt.content);
      if (scrubbedContent !== excerpt.content) {
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
