export interface RegisteredAiJob {
  sessionId: string;
  controller: AbortController;
  progress: {
    currentLoop: number;
    totalLoops: number;
    completedAttempts: number;
    failures: number;
    successes: number;
    providerPaused: boolean;
    providerMessage: string;
    providerRetryAt: string;
    currentDesignKey: string;
    currentDesignLabel: string;
    currentDesignIndex: number;
    totalDesigns: number;
    currentDesignAttempt: number;
    attemptsPerDesign: number;
  };
}

export function createAiJobRegistry() {
  const jobs = new Map<string, RegisteredAiJob>();

  return {
    register(jobId: string, sessionId: string, controller: AbortController) {
      jobs.set(jobId, {
        sessionId,
        controller,
        progress: {
          currentLoop: 0,
          totalLoops: 0,
          completedAttempts: 0,
          failures: 0,
          successes: 0,
          providerPaused: false,
          providerMessage: '',
          providerRetryAt: '',
          currentDesignKey: '',
          currentDesignLabel: '',
          currentDesignIndex: 0,
          totalDesigns: 0,
          currentDesignAttempt: 0,
          attemptsPerDesign: 0,
        },
      });
    },
    get(jobId: string) {
      return jobs.get(jobId) || null;
    },
    updateProgress(jobId: string, progress: Partial<RegisteredAiJob['progress']>) {
      const job = jobs.get(jobId);
      if (!job) {
        return null;
      }
      job.progress = {
        ...job.progress,
        ...progress,
      };
      jobs.set(jobId, job);
      return job;
    },
    cancel(jobId: string, sessionId: string, reason: string) {
      const job = jobs.get(jobId);
      if (!job) {
        return { ok: false as const, code: 'not_found' as const };
      }
      if (job.sessionId !== sessionId) {
        return { ok: false as const, code: 'forbidden' as const };
      }
      job.controller.abort(new Error(reason));
      jobs.delete(jobId);
      return { ok: true as const };
    },
    delete(jobId: string) {
      jobs.delete(jobId);
    },
  };
}
