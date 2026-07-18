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

    const updateTrackedJobProgress = (progress: {
      currentLoop?: number;
      totalLoops?: number;
      completedAttempts?: number;
      failures?: number;
      successes?: number;
      providerPaused?: boolean;
      providerMessage?: string;
      providerRetryAt?: string;
      currentDesignKey?: string;
      currentDesignLabel?: string;
      currentDesignIndex?: number;
      totalDesigns?: number;
      currentDesignAttempt?: number;
      attemptsPerDesign?: number;
      innerRepairAttempt?: number;
      innerRepairTotal?: number;
      innerRepairFailureCode?: string;
      innerRepairFileLine?: string;
      innerRepairStatus?: string;
    }) => {
      const activeJob = activeAiJobs.get(jobId);
      if (activeJob && activeJob.sessionId === session.id) {
        activeAiJobs.updateProgress(jobId, progress);
      }
    };

    return {
      controller,
      abortTrackedJob,
      updateTrackedJobProgress,
    };
  };

  const getAiJobStatusHandler: express.RequestHandler = async (req, res) => {
    const jobId = typeof req.params.jobId === 'string' ? req.params.jobId : '';
    const session = getRequiredSession(req);
    const job = activeAiJobs.get(jobId);
    if (!job) {
      return res.status(404).json({ ok: false, error: 'AI job not found or already finished.' });
    }
    if (job.sessionId !== session.id) {
      return res.status(403).json({ ok: false, error: 'This AI job belongs to a different app session.' });
    }
    return res.json({
      ok: true,
      jobId,
      progress: {
        currentLoop: job.progress.currentLoop,
        totalLoops: job.progress.totalLoops,
        completedAttempts: job.progress.completedAttempts,
        failures: job.progress.failures,
        successes: job.progress.successes,
        providerPaused: job.progress.providerPaused,
        providerMessage: job.progress.providerMessage,
        providerRetryAt: job.progress.providerRetryAt,
        currentDesignKey: job.progress.currentDesignKey,
        currentDesignLabel: job.progress.currentDesignLabel,
        currentDesignIndex: job.progress.currentDesignIndex,
        totalDesigns: job.progress.totalDesigns,
        currentDesignAttempt: job.progress.currentDesignAttempt,
        attemptsPerDesign: job.progress.attemptsPerDesign,
        innerRepairAttempt: job.progress.innerRepairAttempt,
        innerRepairTotal: job.progress.innerRepairTotal,
        innerRepairFailureCode: job.progress.innerRepairFailureCode,
        innerRepairFileLine: job.progress.innerRepairFileLine,
        innerRepairStatus: job.progress.innerRepairStatus,
      },
    });
  };

  return {
    cancelAiJobHandler,
    getAiJobStatusHandler,
    beginTrackedJob,
  };
}
