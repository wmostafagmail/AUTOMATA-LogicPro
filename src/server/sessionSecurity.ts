import type express from 'express';
import { createSessionManager, type LogicProSession } from './sessionManager';

export const SESSION_HEADER = 'x-logicpro-session';
export const SESSION_COOKIE = 'logicpro-session-id';

export function createSessionSecurityContext(params: {
  normalizeFilesystemPath: (targetPath: string) => Promise<string>;
  isPathWithinRoot: (candidatePath: string, rootPath: string) => boolean;
}) {
  const { normalizeFilesystemPath, isPathWithinRoot } = params;
  const sessionManager = createSessionManager({ cookieName: SESSION_COOKIE });

  const getRequiredSession = (req: express.Request) => {
    const session = sessionManager.getSession(req.headers.cookie);
    if (!session) {
      const error = new Error('Missing or expired local app session. Refresh AUTOMATA LogicPro and try again.');
      (error as any).statusCode = 401;
      throw error;
    }
    return session;
  };

  const rememberApprovedProjectRoot = async (session: LogicProSession, rootPath: string) => {
    const normalizedRoot = await normalizeFilesystemPath(rootPath);
    return sessionManager.setApprovedRoot(session, normalizedRoot);
  };

  const assertApprovedProjectPath = async (
    session: LogicProSession,
    candidatePath: string,
    label = 'Project path'
  ) => {
    const normalizedPath = await normalizeFilesystemPath(candidatePath);
    return sessionManager.assertApprovedPath(session, normalizedPath, label, isPathWithinRoot);
  };

  const sessionMiddleware: express.RequestHandler = (req, res, next) => {
    if (req.path === '/health' || req.path === '/session') {
      return next();
    }

    const session = sessionManager.getSession(req.headers.cookie);
    if (!session) {
      return res.status(401).json({
        error: 'Missing or expired local app session. Refresh the app and try again.',
      });
    }

    const providedToken = typeof req.header(SESSION_HEADER) === 'string' ? req.header(SESSION_HEADER) : '';
    if (!sessionManager.matchesCsrfToken(session, providedToken)) {
      return res.status(401).json({
        error: 'Missing or invalid local session token. Refresh the app and try again.',
      });
    }

    return next();
  };

  return {
    sessionManager,
    getRequiredSession,
    rememberApprovedProjectRoot,
    assertApprovedProjectPath,
    sessionMiddleware,
  };
}
