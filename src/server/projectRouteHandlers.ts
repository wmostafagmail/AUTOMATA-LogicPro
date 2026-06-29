import fs from 'fs/promises';
import path from 'path';
import type express from 'express';
import type { LogicProSession } from './sessionManager';

export function createProjectRouteContext(params: {
  getRequiredSession: (req: express.Request) => LogicProSession;
  rememberApprovedProjectRoot: (session: LogicProSession, rootPath: string) => Promise<string>;
  assertApprovedProjectPath: (session: LogicProSession, candidatePath: string, label?: string) => Promise<string>;
  chooseProjectFolder: (defaultPath?: string | null) => Promise<string>;
  chooseWorkspaceFile: (defaultPath?: string | null) => Promise<string>;
  chooseExportPath: (defaultPath: string | null | undefined, suggestedName: string) => Promise<string>;
  listProjectFiles: (rootPath: string) => Promise<unknown[]>;
  ensureDirectoryPath: (targetPath: string, label?: string) => Promise<string>;
  isAppleScriptCancel: (error: unknown) => boolean;
}) {
  const {
    getRequiredSession,
    rememberApprovedProjectRoot,
    assertApprovedProjectPath,
    chooseProjectFolder,
    chooseWorkspaceFile,
    chooseExportPath,
    listProjectFiles,
    ensureDirectoryPath,
    isAppleScriptCancel,
  } = params;

  const selectProjectHandler: express.RequestHandler = async (req, res) => {
    try {
      const session = getRequiredSession(req);
      const requestedDefaultPath = typeof req.body?.defaultPath === 'string' ? req.body.defaultPath : null;
      const projectPath = await chooseProjectFolder(requestedDefaultPath);
      const approvedProjectPath = await rememberApprovedProjectRoot(session, projectPath);
      const files = await listProjectFiles(approvedProjectPath);
      res.json({
        name: path.basename(approvedProjectPath),
        path: approvedProjectPath,
        files,
      });
    } catch (error: any) {
      if (isAppleScriptCancel(error)) {
        return res.status(400).json({ cancelled: true });
      }
      res.status(error?.statusCode || 500).json({ error: error.message || error });
    }
  };

  const restoreProjectHandler: express.RequestHandler = async (req, res) => {
    const projectPath = typeof req.body?.projectPath === 'string' ? req.body.projectPath.trim() : '';
    if (!projectPath) {
      return res.status(400).json({ error: 'Project path is required.' });
    }

    try {
      const session = getRequiredSession(req);
      const ensuredProjectPath = await ensureDirectoryPath(projectPath, 'Project folder');
      const approvedProjectPath = await assertApprovedProjectPath(session, ensuredProjectPath, 'Project folder');
      const files = await listProjectFiles(approvedProjectPath);
      res.json({
        name: path.basename(approvedProjectPath),
        path: approvedProjectPath,
        files,
      });
    } catch (error: any) {
      res.status(error?.statusCode || 500).json({ error: error.message || error });
    }
  };

  const openWorkspaceHandler: express.RequestHandler = async (req, res) => {
    try {
      const session = getRequiredSession(req);
      const defaultPath = typeof req.body?.projectPath === 'string' && req.body.projectPath.trim()
        ? await assertApprovedProjectPath(session, req.body.projectPath, 'Workspace default path')
        : null;
      const selectedPath = await chooseWorkspaceFile(defaultPath);
      const approvedSelectedPath = await assertApprovedProjectPath(session, selectedPath, 'Selected workspace file');
      const content = await fs.readFile(approvedSelectedPath, 'utf8');
      res.json({
        name: path.basename(approvedSelectedPath),
        path: approvedSelectedPath,
        content,
      });
    } catch (error: any) {
      if (isAppleScriptCancel(error)) {
        return res.status(400).json({ cancelled: true });
      }
      res.status(error?.statusCode || 500).json({ error: error.message || error });
    }
  };

  const saveVcdHandler: express.RequestHandler = async (req, res) => {
    try {
      const session = getRequiredSession(req);
      const projectPath = typeof req.body?.projectPath === 'string' && req.body.projectPath.trim()
        ? await assertApprovedProjectPath(session, req.body.projectPath, 'Export directory')
        : null;
      const suggestedName = typeof req.body?.suggestedName === 'string' && req.body.suggestedName.trim()
        ? req.body.suggestedName.trim()
        : 'logic_dump.vcd';
      const content = typeof req.body?.content === 'string' ? req.body.content : '';
      const targetPath = await chooseExportPath(projectPath, suggestedName);
      const approvedTargetPath = await assertApprovedProjectPath(session, targetPath, 'Export file');
      await fs.writeFile(approvedTargetPath, content, 'utf8');
      res.json({ path: approvedTargetPath, name: path.basename(approvedTargetPath) });
    } catch (error: any) {
      if (isAppleScriptCancel(error)) {
        return res.status(400).json({ cancelled: true });
      }
      res.status(error?.statusCode || 500).json({ error: error.message || error });
    }
  };

  return {
    selectProjectHandler,
    restoreProjectHandler,
    openWorkspaceHandler,
    saveVcdHandler,
  };
}
