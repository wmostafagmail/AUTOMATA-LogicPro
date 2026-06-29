import { randomUUID } from 'crypto';

export interface LogicProSession {
  id: string;
  csrfToken: string;
  approvedProjectRoot: string | null;
  remoteExportConsents: Record<string, boolean>;
  remoteExportApprovals: Record<string, { providerId: string; createdAt: number }>;
  aiTokenTotals: {
    inputTokens: number;
    outputTokens: number;
  };
  createdAt: number;
  lastSeenAt: number;
}

interface CreateSessionManagerOptions {
  cookieName: string;
  sessionTtlMs?: number;
}

function parseCookieHeader(cookieHeader: string | undefined) {
  const parsed = new Map<string, string>();
  if (!cookieHeader) {
    return parsed;
  }

  cookieHeader.split(';').forEach((segment) => {
    const [rawName, ...rawValue] = segment.split('=');
    const name = rawName?.trim();
    if (!name) {
      return;
    }
    parsed.set(name, decodeURIComponent(rawValue.join('=').trim()));
  });
  return parsed;
}

export function createSessionManager(options: CreateSessionManagerOptions) {
  const { cookieName, sessionTtlMs = 1000 * 60 * 60 * 8 } = options;
  const sessions = new Map<string, LogicProSession>();
  const remoteExportApprovalTtlMs = 1000 * 60 * 10;

  const pruneExpiredSessions = () => {
    const cutoff = Date.now() - sessionTtlMs;
    for (const [sessionId, session] of sessions.entries()) {
      if (session.lastSeenAt < cutoff) {
        sessions.delete(sessionId);
        continue;
      }
      for (const [approvalHash, approval] of Object.entries(session.remoteExportApprovals)) {
        if (approval.createdAt < Date.now() - remoteExportApprovalTtlMs) {
          delete session.remoteExportApprovals[approvalHash];
        }
      }
    }
  };

  const createSession = () => {
    const now = Date.now();
    const session: LogicProSession = {
      id: randomUUID(),
      csrfToken: randomUUID(),
      approvedProjectRoot: null,
      remoteExportConsents: {},
      remoteExportApprovals: {},
      aiTokenTotals: {
        inputTokens: 0,
        outputTokens: 0,
      },
      createdAt: now,
      lastSeenAt: now,
    };
    sessions.set(session.id, session);
    return session;
  };

  const getSessionFromCookieHeader = (cookieHeader: string | undefined) => {
    pruneExpiredSessions();
    const sessionId = parseCookieHeader(cookieHeader).get(cookieName);
    if (!sessionId) {
      return null;
    }
    const session = sessions.get(sessionId);
    if (!session) {
      return null;
    }
    session.lastSeenAt = Date.now();
    return session;
  };

  const createCookieValue = (session: LogicProSession) => (
    `${cookieName}=${encodeURIComponent(session.id)}; Path=/; HttpOnly; SameSite=Strict`
  );

  return {
    getOrCreateSession(cookieHeader: string | undefined) {
      const existing = getSessionFromCookieHeader(cookieHeader);
      return existing || createSession();
    },
    getSession(cookieHeader: string | undefined) {
      return getSessionFromCookieHeader(cookieHeader);
    },
    createCookieValue,
    matchesCsrfToken(session: LogicProSession, token: string | undefined) {
      return typeof token === 'string' && token === session.csrfToken;
    },
    setApprovedRoot(session: LogicProSession, normalizedRoot: string) {
      session.approvedProjectRoot = normalizedRoot;
      session.lastSeenAt = Date.now();
      return normalizedRoot;
    },
    getApprovedRoot(session: LogicProSession) {
      session.lastSeenAt = Date.now();
      return session.approvedProjectRoot;
    },
    setRemoteExportConsent(session: LogicProSession, providerId: string, allowed: boolean) {
      const normalizedProviderId = String(providerId || '').trim().toLowerCase();
      if (!normalizedProviderId) {
        return { ...session.remoteExportConsents };
      }
      session.remoteExportConsents[normalizedProviderId] = allowed;
      session.lastSeenAt = Date.now();
      return { ...session.remoteExportConsents };
    },
    getRemoteExportConsents(session: LogicProSession) {
      session.lastSeenAt = Date.now();
      return { ...session.remoteExportConsents };
    },
    hasRemoteExportConsent(session: LogicProSession, providerId: string) {
      const normalizedProviderId = String(providerId || '').trim().toLowerCase();
      session.lastSeenAt = Date.now();
      return Boolean(session.remoteExportConsents[normalizedProviderId]);
    },
    registerRemoteExportApproval(session: LogicProSession, providerId: string, previewHash: string) {
      const normalizedProviderId = String(providerId || '').trim().toLowerCase();
      const normalizedPreviewHash = String(previewHash || '').trim();
      if (!normalizedProviderId || !normalizedPreviewHash) {
        return false;
      }
      session.remoteExportApprovals[normalizedPreviewHash] = {
        providerId: normalizedProviderId,
        createdAt: Date.now(),
      };
      session.lastSeenAt = Date.now();
      return true;
    },
    consumeRemoteExportApproval(session: LogicProSession, providerId: string, previewHash: string) {
      const normalizedProviderId = String(providerId || '').trim().toLowerCase();
      const normalizedPreviewHash = String(previewHash || '').trim();
      const approval = session.remoteExportApprovals[normalizedPreviewHash];
      if (!normalizedProviderId || !normalizedPreviewHash || !approval) {
        session.lastSeenAt = Date.now();
        return false;
      }
      const isExpired = approval.createdAt < Date.now() - remoteExportApprovalTtlMs;
      if (approval.providerId !== normalizedProviderId || isExpired) {
        delete session.remoteExportApprovals[normalizedPreviewHash];
        session.lastSeenAt = Date.now();
        return false;
      }
      delete session.remoteExportApprovals[normalizedPreviewHash];
      session.lastSeenAt = Date.now();
      return true;
    },
    accumulateAiTokens(
      session: LogicProSession,
      usage: {
        inputTokens?: number;
        outputTokens?: number;
      }
    ) {
      session.aiTokenTotals.inputTokens += Math.max(0, usage.inputTokens ?? 0);
      session.aiTokenTotals.outputTokens += Math.max(0, usage.outputTokens ?? 0);
      session.lastSeenAt = Date.now();
      return {
        inputTokens: session.aiTokenTotals.inputTokens,
        outputTokens: session.aiTokenTotals.outputTokens,
      };
    },
    assertApprovedPath(
      session: LogicProSession,
      normalizedPath: string,
      label: string,
      isPathWithinRoot: (candidatePath: string, rootPath: string) => boolean
    ) {
      const approvedRoot = session.approvedProjectRoot;
      if (approvedRoot && isPathWithinRoot(normalizedPath, approvedRoot)) {
        session.lastSeenAt = Date.now();
        return normalizedPath;
      }

      const error = new Error(
        `${label} is not approved for this app session. Re-select the project folder from inside AUTOMATA LogicPro and try again.`
      );
      (error as any).statusCode = 403;
      throw error;
    },
  };
}
