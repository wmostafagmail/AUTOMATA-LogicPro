import type express from 'express';
import type { LogicProSession } from './sessionManager';

type GhdlRunResult = {
  logs: string[];
  [key: string]: unknown;
};

export function createGhdlRouteContext(params: {
  getRequiredSession: (req: express.Request) => LogicProSession;
  assertApprovedProjectPath: (session: LogicProSession, candidatePath: string, label?: string) => Promise<string>;
  collectVhdlSources: (rootPath: string) => Promise<unknown[]>;
  buildVhdlProjectInfo: (sources: unknown[]) => unknown;
  getGhdlStatus: () => Promise<any>;
  validateGhdlInstallRequest: (params: {
    confirmInstall: unknown;
    confirmPhrase: unknown;
    requestedInstallCommand: unknown;
    expectedInstallCommand: unknown;
  }) => { ok: boolean; error?: string };
  ensureGhdlInstalled: (logs: string[]) => Promise<any>;
  runGhdlSimulation: (params: {
    projectPath: string;
    topEntity: string;
    sourcePaths?: string[];
    stopTime?: string;
  }) => Promise<GhdlRunResult>;
  getOrBuildMacroSignalIndex: (params: {
    projectPath: string;
    rootEntity: string;
    sourcePaths?: string[];
  }) => Promise<unknown>;
}) {
  const {
    getRequiredSession,
    assertApprovedProjectPath,
    collectVhdlSources,
    buildVhdlProjectInfo,
    getGhdlStatus,
    validateGhdlInstallRequest,
    ensureGhdlInstalled,
    runGhdlSimulation,
    getOrBuildMacroSignalIndex,
  } = params;

  const getStatusHandler: express.RequestHandler = async (_req, res) => {
    try {
      res.json(await getGhdlStatus());
    } catch (error: any) {
      res.status(500).json({ error: error.message || error });
    }
  };

  const getProjectInfoHandler: express.RequestHandler = async (req, res) => {
    const projectPath = typeof req.body?.projectPath === 'string' ? req.body.projectPath.trim() : '';
    if (!projectPath) {
      return res.status(400).json({ error: 'Project path is required.' });
    }

    try {
      const session = getRequiredSession(req);
      const sources = await collectVhdlSources(await assertApprovedProjectPath(session, projectPath));
      res.json(buildVhdlProjectInfo(sources));
    } catch (error: any) {
      res.status(error?.statusCode || 500).json({ error: error.message || error });
    }
  };

  const installHandler: express.RequestHandler = async (req, res) => {
    const logs: string[] = [];
    const currentStatus = await getGhdlStatus();
    const validation = validateGhdlInstallRequest({
      confirmInstall: req.body?.confirmInstall,
      confirmPhrase: req.body?.confirmPhrase,
      requestedInstallCommand: req.body?.installCommand,
      expectedInstallCommand: currentStatus.installCommand,
    });
    if (!validation.ok) {
      return res.status(400).json({
        error: validation.error || 'Install request validation failed.',
        logs,
        status: currentStatus,
      });
    }
    try {
      const status = await ensureGhdlInstalled(logs);
      res.json({ status, logs });
    } catch (error: any) {
      res.status(500).json({ error: error.message || error, logs });
    }
  };

  const runHandler: express.RequestHandler = async (req, res) => {
    const { projectPath, topEntity, sourcePaths, stopTime } = req.body;

    if (typeof projectPath !== 'string' || !projectPath.trim()) {
      return res.status(400).json({ error: 'Project path is required.' });
    }
    if (typeof topEntity !== 'string' || !topEntity.trim()) {
      return res.status(400).json({ error: 'Top entity or testbench name is required.' });
    }

    try {
      const session = getRequiredSession(req);
      const normalizedProjectPath = await assertApprovedProjectPath(session, projectPath.trim());
      const normalizedTopEntity = topEntity.trim();
      const normalizedSourcePaths = Array.isArray(sourcePaths) ? sourcePaths : undefined;
      const result = await runGhdlSimulation({
        projectPath: normalizedProjectPath,
        topEntity: normalizedTopEntity,
        sourcePaths: normalizedSourcePaths,
        stopTime: typeof stopTime === 'string' && stopTime.trim() ? stopTime.trim() : undefined,
      });
      try {
        await getOrBuildMacroSignalIndex({
          projectPath: normalizedProjectPath,
          rootEntity: normalizedTopEntity,
          sourcePaths: normalizedSourcePaths,
        });
      } catch (cacheError: any) {
        result.logs = [
          ...result.logs,
          `Macro signal index warmup skipped: ${cacheError?.message || String(cacheError)}`,
        ];
      }
      res.json(result);
    } catch (error: any) {
      res.status(error?.statusCode || 500).json({ error: error.message || error, logs: error.logs || [] });
    }
  };

  return {
    getStatusHandler,
    getProjectInfoHandler,
    installHandler,
    runHandler,
  };
}
