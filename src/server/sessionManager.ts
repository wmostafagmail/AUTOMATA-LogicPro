import { randomUUID } from 'crypto';

export interface LogicProSession {
  id: string;
  csrfToken: string;
  approvedProjectRoots: Set<string>;
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

  const pruneExpiredSessions = () => {
    const cutoff = Date.now() - sessionTtlMs;
    for (const [sessionId, session] of sessions.entries()) {
      if (session.lastSeenAt < cutoff) {
        sessions.delete(sessionId);
      }
    }
  };

  const createSession = () => {
    const now = Date.now();
    const session: LogicProSession = {
      id: randomUUID(),
      csrfToken: randomUUID(),
      approvedProjectRoots: new Set<string>(),
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
    rememberApprovedRoot(session: LogicProSession, normalizedRoot: string) {
      session.approvedProjectRoots.add(normalizedRoot);
      session.lastSeenAt = Date.now();
      return normalizedRoot;
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
      for (const approvedRoot of session.approvedProjectRoots) {
        if (isPathWithinRoot(normalizedPath, approvedRoot)) {
          session.lastSeenAt = Date.now();
          return normalizedPath;
        }
      }

      const error = new Error(
        `${label} is not approved for this app session. Re-select the project folder from inside AUTOMATA LogicPro and try again.`
      );
      (error as any).statusCode = 403;
      throw error;
    },
  };
}
