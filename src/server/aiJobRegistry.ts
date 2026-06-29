export interface RegisteredAiJob {
  sessionId: string;
  controller: AbortController;
}

export function createAiJobRegistry() {
  const jobs = new Map<string, RegisteredAiJob>();

  return {
    register(jobId: string, sessionId: string, controller: AbortController) {
      jobs.set(jobId, { sessionId, controller });
    },
    get(jobId: string) {
      return jobs.get(jobId) || null;
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
