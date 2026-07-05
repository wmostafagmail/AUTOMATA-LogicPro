import type { AiMacroId, TbGenerationMode } from '../aiMacros';

export type NormalizedPreparedPrompt<TSelection = unknown> = {
  prompt: string;
  selection: TSelection | null;
};

const VHDL_ORCHESTRATOR_INSTRUCTION_BLOCK = [
  '@Use VHDL-skill-orchestrator',
  'Use the available skills registry to select only the skills needed for this task.',
  'Create a short skill call plan, execute the plan, merge outputs, and run the final verification checklist.',
].join('\n\n');

export function normalizePreparedPrompt<TSelection = unknown>(
  preparedPrompt: string | NormalizedPreparedPrompt<TSelection>
): NormalizedPreparedPrompt<TSelection> {
  if (typeof preparedPrompt === 'string') {
    return {
      prompt: preparedPrompt,
      selection: null,
    };
  }

  return preparedPrompt;
}

export function buildVhdlOrchestratorTaskPrompt(
  taskPrompt: string,
  extraSections: string[] = [],
) {
  return [
    VHDL_ORCHESTRATOR_INSTRUCTION_BLOCK,
    'Task:',
    taskPrompt,
    ...extraSections.filter((section) => section.trim().length > 0),
  ].join('\n\n');
}

export function buildMacroExecutionPrompt(params: {
  systemPrompt: string;
  buildMacroPromptContract: (params: {
    macroId: AiMacroId;
    userQuery: string;
    tbGenerationMode: TbGenerationMode | null;
  }) => string;
  macroId: AiMacroId;
  userQuery: string;
  tbGenerationMode: TbGenerationMode | null;
}) {
  const {
    systemPrompt,
    buildMacroPromptContract,
    macroId,
    userQuery,
    tbGenerationMode,
  } = params;

  return `${systemPrompt}\n\n${buildMacroPromptContract({
    macroId,
    userQuery,
    tbGenerationMode,
  })}`;
}

export function parseMacroExecutionParams(body: unknown): {
  macroId: AiMacroId;
  tbGenerationMode: TbGenerationMode | null;
} {
  const payload = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const macroId = typeof payload.macroId === 'string' && payload.macroId.trim()
    ? payload.macroId.trim() as AiMacroId
    : 'custom_query';
  const tbGenerationMode: TbGenerationMode | null = payload.tbGenerationMode === 'reverse_from_vcd'
    ? 'reverse_from_vcd'
    : payload.tbGenerationMode === 'project_entities'
      ? 'project_entities'
      : null;

  return {
    macroId,
    tbGenerationMode,
  };
}
