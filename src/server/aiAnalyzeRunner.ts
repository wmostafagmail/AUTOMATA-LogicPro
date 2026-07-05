import type { GoogleGenAI } from '@google/genai';
import path from 'path';
import type { AiMacroId, AiMacroValidationResult, TbGenerationMode } from '../aiMacros';
import type { LogicProSession, createSessionManager } from './sessionManager';
import type { DeterministicSkillSelection, PreparedVhdlSkillPrompt } from './vhdlSkillOrchestrator';
import type { FpgaArchitectProject } from './fpgaArchitect';
import { buildMacroExecutionPrompt } from './aiPromptUtils';
import {
  applyGeneratedCodeRepairs,
  buildGeneratedCodeRepairPrompt,
  parseGeneratedCodeRepairs,
  type RepairableGeneratedFile,
} from './generatedCodeRepair';
import type {
  GeneratedVhdlArtifactForValidation,
  GeneratedVhdlValidationResult,
} from './generatedVhdlValidation';

type SessionManager = ReturnType<typeof createSessionManager>;

type AiRunTelemetry = {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  tokensPerSecond: number | null;
  endToEndTokensPerSecond?: number | null;
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

const FPGA_ARCHITECT_MAX_INNER_REPAIR_ATTEMPTS = 10;

type SavedFpgaArchitectArtifact = {
  name: string;
  path: string;
  fileType: string;
  purpose: string;
  content: string;
  kind: 'testbench' | 'module' | 'assertions' | 'rtl_skeleton' | 'unknown';
};

type SavedArchitectProjectResult = {
  outputDirectory: string;
  savedFiles: SavedFpgaArchitectArtifact[];
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

type AnnotatedAiAnalyzeError = Error & {
  generatedVhdlValidation?: GeneratedVhdlValidationResult | null;
};

function macroRequiresPassingSimulation(macroId: AiMacroId) {
  return macroId === 'generate_vhdl_tb' || macroId === 'fpga_vhdl_architect';
}

function describeValidationGate(stage: GeneratedVhdlValidationResult['stage']) {
  if (stage === 'prevalidate') {
    return 'strict pre-GHDL validation';
  }
  return `GHDL ${stage} validation`;
}

function buildAnnotatedAiAnalyzeError(
  message: string,
  metadata?: {
    generatedVhdlValidation?: GeneratedVhdlValidationResult | null;
  },
): AnnotatedAiAnalyzeError {
  const error = new Error(message) as AnnotatedAiAnalyzeError;
  if (metadata?.generatedVhdlValidation) {
    error.generatedVhdlValidation = metadata.generatedVhdlValidation;
  }
  return error;
}

function requirePassingSimulationForMacro(params: {
  macroId: AiMacroId;
  validation: GeneratedVhdlValidationResult;
}) {
  const { macroId, validation } = params;
  if (!macroRequiresPassingSimulation(macroId)) {
    return validation;
  }
  if (!validation.ok) {
    return validation;
  }
  if (validation.stage === 'simulate') {
    return validation;
  }

  return {
    ...validation,
    ok: false,
    summary: `The generated output reached only the GHDL ${validation.stage} stage. This macro requires a full passing compile/elaborate/simulate flow before it can be accepted.`,
  };
}

export async function runAiAnalyzeJob(params: {
  ai: GoogleGenAI | null;
  selectedProvider: string;
  selectedModel: string;
  macroId: AiMacroId;
  tbGenerationMode: TbGenerationMode | null;
  systemPrompt: string;
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
  fpgaArchitectExecutionMode?: 'normal' | 'test_compact';
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
  parseFpgaArchitectResponse?: (text: string) => FpgaArchitectProject;
  buildFpgaArchitectRetryPrompt?: (params: {
    originalPrompt: string;
    errorSummary: string;
  }) => string;
  buildFpgaArchitectJsonRepairPrompt?: (params: {
    originalPrompt: string;
    invalidResponse: string;
    errorSummary: string;
  }) => string;
  buildFpgaArchitectCompactRetryPrompt?: (params: {
    originalPrompt: string;
    errorSummary: string;
    compactMode?: 'compact' | 'ultra_compact' | 'minimal';
  }) => string;
  buildFpgaArchitectTestRunPrompt?: (params: {
    originalPrompt: string;
    compactMode?: 'ultra_compact' | 'minimal';
  }) => string;
  saveFpgaArchitectProject?: (params: {
    projectPath: string;
    project: FpgaArchitectProject;
  }) => Promise<{
    outputDirectory: string;
    savedFiles: SavedFpgaArchitectArtifact[];
  }>;
  buildFpgaArchitectMarkdownReport?: (params: {
    project: FpgaArchitectProject;
    outputDirectory: string;
  }) => string;
  validateGeneratedVhdlWithGhdl?: (params: {
    macroId: AiMacroId;
    projectPath: string;
    tbGenerationMode: TbGenerationMode | null;
    artifactDirectory: string | null;
    savedArtifacts: GeneratedVhdlArtifactForValidation[];
    architectProject?: FpgaArchitectProject | null;
  }) => Promise<GeneratedVhdlValidationResult>;
}) {
  const {
    ai,
    selectedProvider,
    selectedModel,
    macroId,
    tbGenerationMode,
    systemPrompt,
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
    fpgaArchitectExecutionMode = 'normal',
    applyMandatoryVhdlSkill,
    runModelAnalysis,
    validateMacroOutput,
    buildArtifactRetryPrompt,
    buildValidationRetryPrompt,
    extractGeneratedVhdlArtifacts,
    saveGeneratedVhdlArtifacts,
    formatValidationFailureDetails,
    parseFpgaArchitectResponse,
    buildFpgaArchitectJsonRepairPrompt,
    buildFpgaArchitectCompactRetryPrompt,
    buildFpgaArchitectTestRunPrompt,
    saveFpgaArchitectProject,
    buildFpgaArchitectMarkdownReport,
    validateGeneratedVhdlWithGhdl,
  } = params;

  const resolvedPreparedPrompt = preparedPrompt || await applyMandatoryVhdlSkill(buildMacroExecutionPrompt({
    systemPrompt,
    buildMacroPromptContract,
    macroId,
    userQuery,
    tbGenerationMode,
  }));
  const isFpgaArchitectMacro = macroId === 'fpga_vhdl_architect';
  const initialPrompt = isFpgaArchitectMacro
    && fpgaArchitectExecutionMode === 'test_compact'
    && buildFpgaArchitectTestRunPrompt
    ? buildFpgaArchitectTestRunPrompt({
      originalPrompt: resolvedPreparedPrompt.prompt,
      compactMode: 'minimal',
    })
    : resolvedPreparedPrompt.prompt;
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

  if (isFpgaArchitectMacro) {
    validation = {
      macroId,
      status: 'pass',
      summary: 'Structured FPGA architect JSON received.',
      warnings: [],
      checks: [],
    };
  }

  if (!isFpgaArchitectMacro && artifactDirectory) {
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
  let architectProject: FpgaArchitectProject | null = null;
  let ghdlValidation: GeneratedVhdlValidationResult | null = null;
  let repairableFiles: RepairableGeneratedFile[] = [];

  const appendGhdlValidationSummary = (text: string, validationResult: GeneratedVhdlValidationResult) => {
    const recentLogs = validationResult.logs.slice(-8);
    const logSection = recentLogs.length > 0
      ? `\nRecent validation log lines:\n${recentLogs.map((line) => `- ${line}`).join('\n')}`
      : '';
    return `${text.trimEnd()}\n\n## GHDL Validation\n- Status: PASS\n- Stage: ${validationResult.stage}\n- Summary: ${validationResult.summary}${logSection}\n`;
  };

  const repairFpgaArchitectManifestIfNeeded = async (currentResponseText: string) => {
    if (!parseFpgaArchitectResponse || !buildFpgaArchitectJsonRepairPrompt || !buildFpgaArchitectCompactRetryPrompt) {
      throw new Error('FPGA Architect JSON repair dependencies are unavailable.');
    }
    try {
      return parseFpgaArchitectResponse(currentResponseText);
    } catch (error: any) {
      retryUsed = true;
      const repairPrompt = buildFpgaArchitectJsonRepairPrompt({
        originalPrompt: initialPrompt,
        invalidResponse: currentResponseText,
        errorSummary: error?.message || String(error),
      });
      aiResult = await runModelAnalysis({
        ai,
        provider: selectedProvider,
        model: selectedModel,
        prompt: repairPrompt,
        signal,
      });
      attemptTelemetries.push(aiResult.telemetry);
      responseText = aiResult.text;
      responseTelemetry = aiResult.telemetry;
      try {
        return parseFpgaArchitectResponse(responseText);
      } catch (repairError: any) {
        const compactModes: Array<'compact' | 'ultra_compact' | 'minimal'> = ['compact', 'ultra_compact', 'minimal'];
        let lastCompactError: unknown = repairError;

        for (const compactMode of compactModes) {
          const compactRetryPrompt = buildFpgaArchitectCompactRetryPrompt({
            originalPrompt: initialPrompt,
            errorSummary: (lastCompactError as any)?.message || String(lastCompactError),
            compactMode,
          });
          aiResult = await runModelAnalysis({
            ai,
            provider: selectedProvider,
            model: selectedModel,
            prompt: compactRetryPrompt,
            signal,
          });
          attemptTelemetries.push(aiResult.telemetry);
          responseText = aiResult.text;
          responseTelemetry = aiResult.telemetry;
          try {
            return parseFpgaArchitectResponse(responseText);
          } catch (compactError: any) {
            lastCompactError = compactError;
          }
        }

        throw lastCompactError instanceof Error ? lastCompactError : new Error(String(lastCompactError));
      }
    }
  };

  const attemptSharedGeneratedCodeRepair = async (params: {
    validationResult: GeneratedVhdlValidationResult;
    files: RepairableGeneratedFile[];
    repairAttempt?: number;
    repairAttemptLimit?: number;
  }) => {
    if (params.files.length === 0 || !validateGeneratedVhdlWithGhdl) {
      return null;
    }

    retryUsed = true;
    const repairPrompt = `${buildGeneratedCodeRepairPrompt({
      originalPrompt: initialPrompt,
      macroId,
      macroLabel: macroSpec.label,
      validation: params.validationResult,
      availableFiles: params.files,
    })}${typeof params.repairAttempt === 'number' && typeof params.repairAttemptLimit === 'number'
      ? `\nRepair loop attempt: ${params.repairAttempt}/${params.repairAttemptLimit}\n`
      : ''}`;
    aiResult = await runModelAnalysis({
      ai,
      provider: selectedProvider,
      model: selectedModel,
      prompt: repairPrompt,
      signal,
    });
    attemptTelemetries.push(aiResult.telemetry);
    responseText = aiResult.text;
    responseTelemetry = aiResult.telemetry;

    const parsedRepairs = parseGeneratedCodeRepairs({
      text: responseText,
      allowedFiles: params.files,
    });

    if (parsedRepairs.length === 0) {
      return {
        repairedFiles: params.files,
        validationResult: params.validationResult,
        parsedRepairs,
      };
    }

    const updatedFiles = await applyGeneratedCodeRepairs({
      availableFiles: params.files,
      repairs: parsedRepairs,
    });

    const repairedValidation = requirePassingSimulationForMacro({
      macroId,
      validation: await validateGeneratedVhdlWithGhdl({
        macroId,
        projectPath: normalizedProjectPath,
        tbGenerationMode,
        artifactDirectory,
        savedArtifacts: updatedFiles.map((file) => ({
          fileName: path.basename(file.relativePath),
          path: file.absolutePath,
          kind: file.kind,
        })),
        architectProject,
      }),
    });

    return {
      repairedFiles: updatedFiles,
      validationResult: repairedValidation,
      parsedRepairs,
    };
  };

  const saveAndValidateArchitectProject = async (project: FpgaArchitectProject) => {
    const saveResult = await saveFpgaArchitectProject!({
      projectPath: normalizedProjectPath,
      project,
    }) as SavedArchitectProjectResult;
    outputDirectory = saveResult.outputDirectory;
    savedGeneratedFiles = saveResult.savedFiles.map((file) => ({
      fileName: file.name,
      content: file.content,
      kind: file.kind,
      path: file.path,
    }));
    project.files = project.files.map((file) => {
      const saved = saveResult.savedFiles.find((savedFile) => savedFile.path.endsWith(path.normalize(file.path)));
      return saved ? { ...file, savedPath: saved.path } : file;
    });
    repairableFiles = saveResult.savedFiles
      .filter((file) => file.path.toLowerCase().endsWith('.vhd') || file.path.toLowerCase().endsWith('.vhdl'))
      .map((file) => ({
        relativePath: path.relative(normalizedProjectPath, file.path),
        absolutePath: file.path,
        content: file.content,
        kind: file.kind,
      }));

    let validationResult: GeneratedVhdlValidationResult | null = null;
    if (validateGeneratedVhdlWithGhdl) {
      validationResult = requirePassingSimulationForMacro({
        macroId,
        validation: await validateGeneratedVhdlWithGhdl({
          macroId,
          projectPath: normalizedProjectPath,
          tbGenerationMode,
          artifactDirectory,
          savedArtifacts: saveResult.savedFiles.map((file) => ({
            fileName: file.name,
            path: file.path,
            kind: file.kind,
          })),
          architectProject: project,
        }),
      });
    }

    return { saveResult, validationResult };
  };

  if (isFpgaArchitectMacro) {
    if (!parseFpgaArchitectResponse || !saveFpgaArchitectProject || !buildFpgaArchitectMarkdownReport || !buildFpgaArchitectJsonRepairPrompt || !buildFpgaArchitectCompactRetryPrompt) {
      throw new Error('FPGA Architect save/report dependencies are unavailable.');
    }
    if (!normalizedProjectPath) {
      throw new Error('FPGA Architect requires an opened project folder so the generated project can be saved.');
    }

    try {
      architectProject = await repairFpgaArchitectManifestIfNeeded(responseText);
    } catch (error: any) {
      throw new Error(`FPGA Architect hard-failed because the generated project manifest was still invalid before VHDL validation. The app did not modify or auto-fix any generated VHDL files. ${error?.message || String(error)}`);
    }

    let saveResult = await saveAndValidateArchitectProject(architectProject);
    ghdlValidation = saveResult.validationResult;

    if (ghdlValidation && !ghdlValidation.ok) {
      for (
        let repairAttempt = 1;
        repairAttempt <= FPGA_ARCHITECT_MAX_INNER_REPAIR_ATTEMPTS && ghdlValidation && !ghdlValidation.ok;
        repairAttempt += 1
      ) {
        const sharedRepair = await attemptSharedGeneratedCodeRepair({
          validationResult: ghdlValidation,
          files: repairableFiles,
          repairAttempt,
          repairAttemptLimit: FPGA_ARCHITECT_MAX_INNER_REPAIR_ATTEMPTS,
        });
        if (!sharedRepair) {
          break;
        }
        repairableFiles = sharedRepair.repairedFiles;
        ghdlValidation = sharedRepair.validationResult;
        if (sharedRepair.parsedRepairs.length > 0) {
          savedGeneratedFiles = savedGeneratedFiles.map((artifact) => {
            const repaired = repairableFiles.find((file) => file.absolutePath === artifact.path);
            return repaired ? { ...artifact, content: repaired.content } : artifact;
          });
          if (architectProject) {
            architectProject.files = architectProject.files.map((file) => {
              const repaired = repairableFiles.find((candidate) => candidate.absolutePath === file.savedPath);
              return repaired ? { ...file, content: repaired.content } : file;
            });
          }
        }
      }

      if (ghdlValidation && !ghdlValidation.ok) {
        const retryValidationLabel = describeValidationGate(ghdlValidation.stage);
        throw buildAnnotatedAiAnalyzeError(
          `FPGA Architect hard-failed because the generated project did not pass ${retryValidationLabel} after ${FPGA_ARCHITECT_MAX_INNER_REPAIR_ATTEMPTS} repair attempt(s). The app does not auto-fix VHDL file issues. ${ghdlValidation.summary}`,
          { generatedVhdlValidation: ghdlValidation },
        );
      }
    }

    analysisText = buildFpgaArchitectMarkdownReport({
      project: architectProject,
      outputDirectory,
    });
    if (ghdlValidation?.ok) {
      analysisText = appendGhdlValidationSummary(analysisText, ghdlValidation);
    }
  } else if (artifactDirectory) {
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
    repairableFiles = saveResult.savedArtifacts
      .filter((artifact) => artifact.path.toLowerCase().endsWith('.vhd') || artifact.path.toLowerCase().endsWith('.vhdl'))
      .map((artifact) => ({
        relativePath: path.relative(normalizedProjectPath, artifact.path),
        absolutePath: artifact.path,
        content: artifact.content,
        kind: artifact.kind,
      }));
    if (validateGeneratedVhdlWithGhdl && ['generate_vhdl_tb', 'draft_rtl_skeleton'].includes(macroId)) {
      ghdlValidation = requirePassingSimulationForMacro({
        macroId,
        validation: await validateGeneratedVhdlWithGhdl({
          macroId,
          projectPath: normalizedProjectPath,
          tbGenerationMode,
          artifactDirectory,
          savedArtifacts: saveResult.savedArtifacts.map((artifact) => ({
            fileName: artifact.fileName,
            path: artifact.path,
            kind: artifact.kind,
          })),
        }),
      });

      if (!ghdlValidation.ok) {
        const sharedRepair = await attemptSharedGeneratedCodeRepair({
          validationResult: ghdlValidation,
          files: repairableFiles,
        });
        if (sharedRepair?.parsedRepairs.length) {
          repairableFiles = sharedRepair.repairedFiles;
          ghdlValidation = sharedRepair.validationResult;
          savedGeneratedFiles = savedGeneratedFiles.map((artifact) => {
            const repaired = repairableFiles.find((file) => file.absolutePath === artifact.path);
            return repaired ? { ...artifact, content: repaired.content } : artifact;
          });
        }

        if (!ghdlValidation.ok) {
          const validationLabel = describeValidationGate(ghdlValidation.stage);
          throw new Error(`${macroSpec.label} hard-failed because the generated VHDL did not pass ${validationLabel}. The app does not auto-fix VHDL file issues. ${ghdlValidation.summary}`);
        }
      }
    }

    analysisText = `${responseText.trimEnd()}\n\n## Saved Generated Files\n${savedGeneratedFiles
      .map((artifact) => `- ${path.relative(normalizedProjectPath, artifact.path)}`)
      .join('\n')}\n`;
    if (ghdlValidation?.ok) {
      analysisText = appendGhdlValidationSummary(analysisText, ghdlValidation);
    }
  }

  const latestAttemptInputTokens = responseTelemetry.inputTokens;
  const reportedAttemptInputTokens = attemptTelemetries
    .map((telemetry) => telemetry.inputTokens)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const reportedAttemptOutputTokens = attemptTelemetries
    .map((telemetry) => telemetry.outputTokens)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const jobInputTokens = reportedAttemptInputTokens.length > 0
    ? reportedAttemptInputTokens.reduce((sum, value) => sum + value, 0)
    : null;
  const jobOutputTokens = reportedAttemptOutputTokens.length > 0
    ? reportedAttemptOutputTokens.reduce((sum, value) => sum + value, 0)
    : null;
  const sessionAiTokenTotals = sessionManager.accumulateAiTokens(session, {
    inputTokens: jobInputTokens ?? undefined,
    outputTokens: jobOutputTokens ?? undefined,
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
      attemptCount: attemptTelemetries.length,
      retryCount: Math.max(0, attemptTelemetries.length - 1),
      sessionInputTokens: sessionAiTokenTotals.inputTokens,
      outputTokens: responseTelemetry.outputTokens,
      jobOutputTokens,
      sessionOutputTokens: sessionAiTokenTotals.outputTokens,
      tokensPerSecond: responseTelemetry.tokensPerSecond,
      endToEndTokensPerSecond: responseTelemetry.endToEndTokensPerSecond,
      durationMs: responseTelemetry.durationMs,
    },
    retryUsed,
    outputDirectory,
    generatedFiles: savedGeneratedFiles.map((artifact) => ({
      name: artifact.fileName,
      path: artifact.path,
      kind: artifact.kind,
    })),
    architectProject: architectProject ? {
      ...architectProject,
      outputDirectory,
      files: architectProject.files.map((file) => ({
        ...file,
        savedPath: file.savedPath || path.join(outputDirectory || normalizedProjectPath, file.path),
      })),
    } : null,
    validation,
    deterministicSkillSelection,
  };
}
