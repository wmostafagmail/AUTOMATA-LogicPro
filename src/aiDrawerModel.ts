import { AiMacroId, TbGenerationMode, getAiMacroSpec } from './aiMacros';

export type MacroInvocation =
  | {
      kind: 'composer';
      macroId: AiMacroId;
      tbGenerationMode: TbGenerationMode;
    }
  | {
      kind: 'request';
      macroId: AiMacroId;
      prompt: string;
    };

export function resolveMacroInvocation(macroId: AiMacroId): MacroInvocation {
  const spec = getAiMacroSpec(macroId);
  if (spec.launchMode === 'composer') {
    return {
      kind: 'composer',
      macroId,
      tbGenerationMode: 'project_entities',
    };
  }
  return {
    kind: 'request',
    macroId,
    prompt: spec.defaultPrompt,
  };
}
