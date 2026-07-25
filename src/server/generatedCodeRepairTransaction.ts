import type { GeneratedVhdlValidationResult } from './generatedVhdlValidation';

const STAGE_RANK: Record<GeneratedVhdlValidationResult['stage'], number> = {
  unavailable: 0,
  prevalidate: 1,
  analyze: 2,
  elaborate: 3,
  simulate: 4,
};

export type RepairCandidateDecision = {
  accept: boolean;
  reason: string;
  previousScore: number;
  candidateScore: number;
};

export function scoreGeneratedVhdlValidation(validation: GeneratedVhdlValidationResult) {
  if (validation.ok) return 100_000 + STAGE_RANK[validation.stage] * 1_000;
  const failureCount = Math.max(1, validation.failureDetails?.length || 1);
  const ruleCount = new Set([
    ...(validation.ruleIds || []),
    ...(validation.failureDetails || []).flatMap((detail) => detail.ruleIds || []),
  ]).size;
  return STAGE_RANK[validation.stage] * 1_000 - failureCount * 10 - ruleCount;
}

export function decideRepairCandidate(params: {
  previous: GeneratedVhdlValidationResult;
  candidate: GeneratedVhdlValidationResult;
  allowResolvedClassTransition?: boolean;
}): RepairCandidateDecision {
  const previousScore = scoreGeneratedVhdlValidation(params.previous);
  const candidateScore = scoreGeneratedVhdlValidation(params.candidate);
  if (params.candidate.ok) return { accept: true, reason: 'candidate passes validation', previousScore, candidateScore };
  if (params.previous.ok) return { accept: false, reason: 'candidate regressed a passing project', previousScore, candidateScore };
  if (STAGE_RANK[params.candidate.stage] < STAGE_RANK[params.previous.stage]) return { accept: false, reason: `candidate regressed from ${params.previous.stage} to ${params.candidate.stage}`, previousScore, candidateScore };
  if (params.allowResolvedClassTransition && STAGE_RANK[params.candidate.stage] === STAGE_RANK[params.previous.stage]) {
    const previousCodes = new Set([
      params.previous.failureCode,
      ...(params.previous.failureDetails || []).map((detail) => detail.code),
    ].filter(Boolean));
    const candidateCodes = new Set([
      params.candidate.failureCode,
      ...(params.candidate.failureDetails || []).map((detail) => detail.code),
    ].filter(Boolean));
    const resolvedPreviousClass = Array.from(previousCodes).some((code) => !candidateCodes.has(code));
    if (resolvedPreviousClass) return { accept: true, reason: 'candidate resolved the active class and exposed the next same-stage defect for deterministic closure', previousScore, candidateScore };
  }
  if (candidateScore <= previousScore) return { accept: false, reason: 'candidate did not reduce the validation defect score', previousScore, candidateScore };
  return { accept: true, reason: 'candidate improved validation monotonically', previousScore, candidateScore };
}
