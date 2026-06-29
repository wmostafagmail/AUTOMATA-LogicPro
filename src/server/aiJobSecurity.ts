import type express from 'express';
import type { LogicProSession } from './sessionManager';
import type { createAiJobRegistry } from './aiJobRegistry';

type AiJobRegistry = ReturnType<typeof createAiJobRegistry>;

export function createAiJobSecurityContext(params: {
  activeAiJobs: AiJobRegistry;
  getRequiredSession: (req: express.Request) => LogicProSession;
}) {
  const { activeAiJobs, getRequiredSession } = params;

  const cancelAiJobHandler: express.RequestHandler = async (req, res) => {
    const jobId = typeof req.params.jobId === 'string' ? req.params.jobId : '';
    const session = getRequiredSession(req);
    const cancellation = activeAiJobs.cancel(jobId, session.id, 'Request was cancelled by the user.');
    if (cancellation.code === 'not_found') {
      return res.status(404).json({ ok: false, error: 'AI job not found or already finished.' });
    }
    if (cancellation.code === 'forbidden') {
      return res.status(403).json({ ok: false, error: 'This AI job belongs to a different app session.' });
    }
    return res.json({ ok: true, jobId, cancelled: true });
  };

  const beginTrackedJob = (session: LogicProSession, jobId: string) => {
    const controller = new AbortController();
    activeAiJobs.register(jobId, session.id, controller);

    const abortTrackedJob = (reason: string) => {
      const activeJob = activeAiJobs.get(jobId);
      if (activeJob && activeJob.sessionId === session.id) {
        controller.abort(new Error(reason));
        activeAiJobs.delete(jobId);
      }
    };

    return {
      controller,
      abortTrackedJob,
    };
  };

  return {
    cancelAiJobHandler,
    beginTrackedJob,
  };
}
