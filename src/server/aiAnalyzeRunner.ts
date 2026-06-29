import type { GoogleGenAI } from '@google/genai';
import path from 'path';
import type { AiMacroId, AiMacroValidationResult, TbGenerationMode } from '../aiMacros';
import type { LogicProSession, createSessionManager } from './sessionManager';
import type { DeterministicSkillSelection, PreparedVhdlSkillPrompt } from './vhdlSkillOrchestrator';

type SessionManager = ReturnType<typeof createSessionManager>;

type AiRunTelemetry = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  tokensPerSecond: number;
  durationMs: number;
};

type AiRunResult = {
  text: string;
  telemetry: AiRunTelemetry;
};

type SavedGeneratedVhdlArtifact = {
  fileName: string;
  content: string;
  kind: 'testbench' | 'module' | 'assertions' | 'rtl_skeleton' | 'unknown';
  path: string;
};

type HazardFindingLike = {
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
};

type ProtocolFrameLike = {
  protocol: 'SPI' | 'I2C' | 'UART';
  channel: string;
  startTick: number;
  endTick: number;
  summary: string;
  detail: string;
};

type ExtractedArtifact = {
  fileName: string;
  content: string;
  kind: 'testbench' | 'module' | 'assertions' | 'rtl_skeleton' | 'unknown';
};

export async function runAiAnalyzeJob(params: {
  ai: GoogleGenAI | null;
  selectedProvider: string;
  selectedModel: string;
  macroId: AiMacroId;
  tbGenerationMode: TbGenerationMode | null;
  systemPrompt: string;
  preprocessingInputTokens: number;
  normalizedProjectPath: string;
  artifactDirectory: string | null;
  macroSpec: { label: string };
  hazardFindings: HazardFindingLike[];
  protocolFrames: ProtocolFrameLike[];
  session: LogicProSession;
  sessionManager: SessionManager;
  signal?: AbortSignal;
  getProviderDescriptors: () => Array<{ id: string; label: string }>;
  buildMacroPromptContract: (params: {
    macroId: AiMacroId;
    userQuery: string;
    tbGenerationMode: TbGenerationMode | null;
  }) => string;
  userQuery: string;
  preparedPrompt?: PreparedVhdlSkillPrompt | null;
  applyMandatoryVhdlSkill: (taskPrompt: string) => Promise<{
    prompt: string;
    selection: DeterministicSkillSelection | null;
  }>;
  runModelAnalysis: (params: {
    ai: GoogleGenAI | null;
    provider: any;
    model: string;
    prompt: string;
    signal?: AbortSignal;
  }) => Promise<AiRunResult>;
  validateMacroOutput: (params: {
    macroId: AiMacroId;
    text: string;
    hazardFindings: HazardFindingLike[];
    protocolFrames: ProtocolFrameLike[];
  }) => AiMacroValidationResult;
  buildArtifactRetryPrompt: (params: {
    originalPrompt: string;
    macroId: AiMacroId;
    tbGenerationMode: TbGenerationMode | null;
    artifactDirectory: string;
    validationSummary: string;
    validationWarnings: string[];
  }) => string;
  buildValidationRetryPrompt: (params: {
    originalPrompt: string;
    macroId: AiMacroId;
    validationSummary: string;
    validationWarnings: string[];
  }) => string;
  extractGeneratedVhdlArtifacts: (text: string, macroId: AiMacroId) => ExtractedArtifact[];
  saveGeneratedVhdlArtifacts: (params: {
    projectPath: string;
    outputFolder: string;
    artifacts: ExtractedArtifact[];
  }) => Promise<{
    outputDirectory: string;
    savedArtifacts: SavedGeneratedVhdlArtifact[];
  }>;
  formatValidationFailureDetails: (validation: AiMacroValidationResult) => string;
}) {
  const {
    ai,
    selectedProvider,
    selectedModel,
    macroId,
    tbGenerationMode,
    systemPrompt,
    preprocessingInputTokens,
    normalizedProjectPath,
    artifactDirectory,
    macroSpec,
    hazardFindings,
    protocolFrames,
    session,
    sessionManager,
    signal,
    getProviderDescriptors,
    buildMacroPromptContract,
    userQuery,
    preparedPrompt,
    applyMandatoryVhdlSkill,
    runModelAnalysis,
    validateMacroOutput,
    buildArtifactRetryPrompt,
    buildValidationRetryPrompt,
    extractGeneratedVhdlArtifacts,
    saveGeneratedVhdlArtifacts,
    formatValidationFailureDetails,
  } = params;

  const resolvedPreparedPrompt = preparedPrompt || await applyMandatoryVhdlSkill(`${systemPrompt}\n\n${buildMacroPromptContract({
    macroId,
    userQuery,
    tbGenerationMode,
  })}`);
  const initialPrompt = resolvedPreparedPrompt.prompt;
  const deterministicSkillSelection = resolvedPreparedPrompt.selection;
  let aiResult = await runModelAnalysis({
    ai,
    provider: selectedProvider,
    model: selectedModel,
    prompt: initialPrompt,
    signal,
  });
  const attemptTelemetries: AiRunTelemetry[] = [aiResult.telemetry];
  let responseText = aiResult.text;
  let responseTelemetry = aiResult.telemetry;

  let validation = validateMacroOutput({
    macroId,
    text: responseText,
    hazardFindings,
    protocolFrames,
  });
  let retryUsed = false;

  if (artifactDirectory) {
    const hasVhdlCodeFailure = validation.checks.some((check) => check.id === 'code:vhdl' && check.status === 'fail');
    const extractedInitialArtifacts = extractGeneratedVhdlArtifacts(responseText, macroId);
    const hasRequiredArtifact = macroId === 'generate_vhdl_tb'
      ? extractedInitialArtifacts.some((artifact) => artifact.kind === 'testbench')
      : extractedInitialArtifacts.length > 0;

    if (hasVhdlCodeFailure || !hasRequiredArtifact || validation.status === 'fail') {
      retryUsed = true;
      const retryPrompt = buildArtifactRetryPrompt({
        originalPrompt: initialPrompt,
        macroId,
        tbGenerationMode,
        artifactDirectory,
        validationSummary: validation.summary,
        validationWarnings: validation.warnings,
      });
      aiResult = await runModelAnalysis({
        ai,
        provider: selectedProvider,
        model: selectedModel,
        prompt: retryPrompt,
        signal,
      });
      attemptTelemetries.push(aiResult.telemetry);
      responseText = aiResult.text;
      responseTelemetry = aiResult.telemetry;

      validation = validateMacroOutput({
        macroId,
        text: responseText,
        hazardFindings,
        protocolFrames,
      });
    }
  } else if (macroId !== 'custom_query' && validation.status === 'fail') {
    retryUsed = true;
    const retryPrompt = buildValidationRetryPrompt({
      originalPrompt: initialPrompt,
      macroId,
      validationSummary: validation.summary,
      validationWarnings: validation.warnings,
    });
    aiResult = await runModelAnalysis({
      ai,
      provider: selectedProvider,
      model: selectedModel,
      prompt: retryPrompt,
      signal,
    });
    attemptTelemetries.push(aiResult.telemetry);
    responseText = aiResult.text;
    responseTelemetry = aiResult.telemetry;

    validation = validateMacroOutput({
      macroId,
      text: responseText,
      hazardFindings,
      protocolFrames,
    });
  }

  let outputDirectory: string | null = null;
  let savedGeneratedFiles: SavedGeneratedVhdlArtifact[] = [];
  let analysisText = responseText;

  if (artifactDirectory) {
    const extractedArtifacts = extractGeneratedVhdlArtifacts(responseText, macroId);
    const hasVhdlCodeFailure = validation.checks.some((check) => check.id === 'code:vhdl' && check.status === 'fail');
    const hasRequiredArtifact = macroId === 'generate_vhdl_tb'
      ? extractedArtifacts.some((artifact) => artifact.kind === 'testbench')
      : extractedArtifacts.length > 0;

    if (hasVhdlCodeFailure || extractedArtifacts.length === 0 || !hasRequiredArtifact || validation.status === 'fail') {
      const failureReasons = [
        hasVhdlCodeFailure ? 'no tagged VHDL code block was returned' : null,
        extractedArtifacts.length === 0 ? 'no extractable VHDL artifacts were found' : null,
        macroId === 'generate_vhdl_tb' && !hasRequiredArtifact ? 'no VHDL testbench artifact was identified' : null,
        validation.status === 'fail'
          ? `macro validation still failed (${formatValidationFailureDetails(validation)})`
          : null,
      ].filter(Boolean).join('; ');
      const retryNote = retryUsed ? ' The stricter automatic retry was attempted and still did not produce valid artifact code.' : '';
      throw new Error(`${macroSpec.label} hard-failed because ${failureReasons}.${retryNote}`);
    }

    const saveResult = await saveGeneratedVhdlArtifacts({
      projectPath: normalizedProjectPath,
      outputFolder: artifactDirectory,
      artifacts: extractedArtifacts,
    });
    outputDirectory = saveResult.outputDirectory;
    savedGeneratedFiles = saveResult.savedArtifacts;

    analysisText = `${responseText.trimEnd()}\n\n## Saved Generated Files\n${savedGeneratedFiles
      .map((artifact) => `- ${path.relative(normalizedProjectPath, artifact.path)}`)
      .join('\n')}\n`;
  }

  const latestAttemptInputTokens = responseTelemetry.inputTokens;
  const jobInputTokens = preprocessingInputTokens
    + attemptTelemetries.reduce((sum, telemetry) => sum + telemetry.inputTokens, 0);
  const jobOutputTokens = attemptTelemetries.reduce((sum, telemetry) => sum + telemetry.outputTokens, 0);
  const sessionAiTokenTotals = sessionManager.accumulateAiTokens(session, {
    inputTokens: jobInputTokens,
    outputTokens: jobOutputTokens,
  });

  return {
    analysis: analysisText,
    provider: selectedProvider,
    model: selectedModel,
    telemetry: {
      engineLabel: getProviderDescriptors().find((entry) => entry.id === selectedProvider)?.label || selectedProvider,
      inputTokens: latestAttemptInputTokens,
      latestAttemptInputTokens,
      jobInputTokens,
      sessionInputTokens: sessionAiTokenTotals.inputTokens,
      outputTokens: responseTelemetry.outputTokens,
      jobOutputTokens,
      sessionOutputTokens: sessionAiTokenTotals.outputTokens,
      tokensPerSecond: responseTelemetry.tokensPerSecond,
      durationMs: responseTelemetry.durationMs,
    },
    retryUsed,
    outputDirectory,
    generatedFiles: savedGeneratedFiles.map((artifact) => ({
      name: artifact.fileName,
      path: artifact.path,
      kind: artifact.kind,
    })),
    validation,
    deterministicSkillSelection,
  };
}
