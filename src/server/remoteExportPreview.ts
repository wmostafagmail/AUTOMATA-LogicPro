import type { AiMacroId, TbGenerationMode } from '../aiMacros';
import {
  buildRemoteExportPreviewPayload,
  computeRemoteExportPreviewHash,
  type RemoteExportPreviewPayload,
} from '../exportPolicy';
import type { PreparedVhdlSkillPrompt } from './vhdlSkillOrchestrator';
import { buildMacroExecutionPrompt, normalizePreparedPrompt } from './aiPromptUtils';

type PreparedAnalyzeRequest = {
  selectedProvider: string;
  selectedModel: string;
  providerDeployment: 'local' | 'remote';
  waveformText: string;
  projectText: string;
  exportPolicyText: string;
  hazardScan: { markdown: string };
  protocolScan: { markdown: string };
  systemPrompt: string;
  buildMacroPromptContract: (params: {
    macroId: AiMacroId;
    userQuery: string;
    tbGenerationMode: TbGenerationMode | null;
  }) => string;
};

export async function buildPreparedRemoteExportPreview(params: {
  preparedRequest: PreparedAnalyzeRequest;
  macroId: AiMacroId;
  tbGenerationMode: TbGenerationMode | null;
  userQuery: string;
  applyMandatoryVhdlSkill: (taskPrompt: string) => Promise<string | PreparedVhdlSkillPrompt>;
}) {
  const {
    preparedRequest,
    macroId,
    tbGenerationMode,
    userQuery,
    applyMandatoryVhdlSkill,
  } = params;

  const macroContract = preparedRequest.buildMacroPromptContract({
    macroId,
    userQuery,
    tbGenerationMode,
  });
  const promptTask = buildMacroExecutionPrompt({
    systemPrompt: preparedRequest.systemPrompt,
    buildMacroPromptContract: preparedRequest.buildMacroPromptContract,
    macroId,
    userQuery,
    tbGenerationMode,
  });
  const preparedPrompt = await applyMandatoryVhdlSkill(promptTask);
  const normalizedPreparedPrompt: PreparedVhdlSkillPrompt = normalizePreparedPrompt(preparedPrompt);

  const notes = preparedRequest.exportPolicyText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim());

  const preview = buildRemoteExportPreviewPayload({
    provider: preparedRequest.selectedProvider,
    model: preparedRequest.selectedModel,
    macroId,
    query: userQuery,
    waveformText: preparedRequest.waveformText,
    protocolMarkdown: preparedRequest.protocolScan.markdown,
    hazardMarkdown: preparedRequest.hazardScan.markdown,
    projectText: preparedRequest.projectText,
    exportPolicyText: preparedRequest.exportPolicyText,
    macroContract,
    finalPrompt: normalizedPreparedPrompt.prompt,
    notes,
  });

  return {
    preview,
    previewHash: computeRemoteExportPreviewHash(preview),
    preparedPrompt: normalizedPreparedPrompt,
  };
}

export type PreparedRemoteExportPreview = {
  preview: RemoteExportPreviewPayload;
  previewHash: string;
  preparedPrompt: PreparedVhdlSkillPrompt;
};
