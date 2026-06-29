import fs from 'fs/promises';
import path from 'path';

type RegistrySkill = {
  name: string;
  path: string;
  description: string;
  domains: string[];
  phases: string[];
  outputs: string[];
  triggerKeywords: string[];
  priority: number;
  conflicts: string[];
};

type VhdlSkillRegistry = {
  registryPath: string;
  skills: RegistrySkill[];
};

export type DeterministicSkillSelection = {
  registryPath: string;
  primary: RegistrySkill;
  supporting: Array<RegistrySkill & { reason: string; matchedKeywords: string[]; score: number }>;
  skillCallPlan: string[];
};

export type PreparedVhdlSkillPrompt = {
  prompt: string;
  selection: DeterministicSkillSelection | null;
};

const registryCache = new Map<string, VhdlSkillRegistry>();

const MACRO_SKILL_HINTS: Array<{
  macroId: string;
  required: string[];
  preferred: string[];
}> = [
  {
    macroId: 'generate_vhdl_tb',
    required: ['vhdl-language', 'rtl-verification'],
    preferred: ['fpga-architecture'],
  },
  {
    macroId: 'inspect_race_hazards',
    required: ['vhdl-language', 'rtl-verification'],
    preferred: ['fpga-architecture', 'timing-constraints'],
  },
  {
    macroId: 'protocol_decoder_details',
    required: ['vhdl-language'],
    preferred: ['rtl-verification'],
  },
  {
    macroId: 'verify_clock_reset_sequence',
    required: ['vhdl-language', 'fpga-architecture'],
    preferred: ['rtl-verification'],
  },
  {
    macroId: 'explain_fsm_behavior',
    required: ['vhdl-language', 'fpga-architecture'],
    preferred: ['rtl-verification'],
  },
  {
    macroId: 'summarize_protocol_timeline',
    required: ['vhdl-language'],
    preferred: ['rtl-verification'],
  },
  {
    macroId: 'generate_vhdl_assertions',
    required: ['vhdl-language', 'rtl-verification'],
    preferred: ['timing-constraints'],
  },
  {
    macroId: 'draft_rtl_skeleton',
    required: ['vhdl-language', 'fpga-architecture'],
    preferred: ['rtl-verification'],
  },
  {
    macroId: 'suggest_debug_probes',
    required: ['vhdl-language', 'rtl-verification'],
    preferred: ['fpga-architecture'],
  },
];

function parseInlineArray(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
    return [];
  }
  const inner = trimmed.slice(1, -1).trim();
  if (!inner) {
    return [];
  }
  return inner
    .split(',')
    .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

function parseRegistrySkillBlock(block: string): RegistrySkill | null {
  const nameMatch = block.match(/^\s*-\s+name:\s*(.+)$/m);
  if (!nameMatch) {
    return null;
  }

  const getScalar = (field: string) => {
    const match = block.match(new RegExp(`^\\s*${field}:\\s*(.+)$`, 'm'));
    return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : '';
  };

  const getArray = (field: string) => {
    const match = block.match(new RegExp(`^\\s*${field}:\\s*(\\[[^\\n]*\\])$`, 'm'));
    return match ? parseInlineArray(match[1]) : [];
  };

  return {
    name: nameMatch[1].trim(),
    path: getScalar('path'),
    description: getScalar('description'),
    domains: getArray('domains'),
    phases: getArray('phases'),
    outputs: getArray('outputs'),
    triggerKeywords: getArray('trigger_keywords'),
    priority: Number.parseInt(getScalar('priority') || '0', 10) || 0,
    conflicts: getArray('conflicts'),
  };
}

async function loadVhdlSkillRegistry(projectRoot: string): Promise<VhdlSkillRegistry> {
  const normalizedRoot = path.resolve(projectRoot);
  const cached = registryCache.get(normalizedRoot);
  if (cached) {
    return cached;
  }

  const registryPath = path.join(normalizedRoot, 'VHDL-skill-orchestrator', 'skills.registry.yaml');
  const registryText = await fs.readFile(registryPath, 'utf8');
  const skillsSection = registryText.split(/^skills:\s*$/m)[1] || '';
  const blocks = skillsSection
    .split(/(?=^\s*-\s+name:\s*)/m)
    .map((block) => block.trim())
    .filter(Boolean);

  const skills = blocks
    .map((block) => parseRegistrySkillBlock(block))
    .filter((skill): skill is RegistrySkill => Boolean(skill));

  const registry = { registryPath, skills };
  registryCache.set(normalizedRoot, registry);
  return registry;
}

function inferMacroHints(taskPrompt: string) {
  const macroIdMatch = taskPrompt.match(/Macro ID:\s*([a-z0-9_]+)/i);
  const macroId = macroIdMatch ? macroIdMatch[1].trim().toLowerCase() : null;
  if (!macroId) {
    return null;
  }
  return MACRO_SKILL_HINTS.find((entry) => entry.macroId === macroId) || null;
}

function scoreSkill(skill: RegistrySkill, taskText: string) {
  const normalizedTask = taskText.toLowerCase();
  const matchedKeywords = skill.triggerKeywords.filter((keyword) => normalizedTask.includes(keyword.toLowerCase()));
  let score = matchedKeywords.length * 20;

  if (normalizedTask.includes(skill.name.toLowerCase())) {
    score += 30;
  }
  for (const domain of skill.domains) {
    if (normalizedTask.includes(domain.toLowerCase())) {
      score += 6;
    }
  }
  for (const phase of skill.phases) {
    if (normalizedTask.includes(phase.toLowerCase())) {
      score += 4;
    }
  }
  for (const output of skill.outputs) {
    if (normalizedTask.includes(output.toLowerCase())) {
      score += 5;
    }
  }

  return {
    matchedKeywords,
    score,
  };
}

function buildReason(skill: RegistrySkill, matchedKeywords: string[], taskText: string) {
  if (matchedKeywords.length > 0) {
    return `matched keywords: ${matchedKeywords.slice(0, 4).join(', ')}`;
  }
  if (taskText.includes('stateDiagram-v2') && skill.name === 'fpga-architecture') {
    return 'supports structural/state reasoning for the requested FSM artifact';
  }
  if (skill.name === 'vhdl-language') {
    return 'core VHDL/RTL reasoning is required for this macro';
  }
  if (skill.name === 'rtl-verification') {
    return 'verification and testbench-oriented reasoning is required for this macro';
  }
  if (skill.name === 'fpga-architecture') {
    return 'architecture-level interface and control reasoning is required for this macro';
  }
  return skill.description || 'selected by deterministic registry matching';
}

export async function selectVhdlSkills(taskPrompt: string, projectRoot = process.cwd()): Promise<DeterministicSkillSelection> {
  const registry = await loadVhdlSkillRegistry(projectRoot);
  const primary = registry.skills.find((skill) => skill.name === 'VHDL-skill-orchestrator');
  if (!primary) {
    throw new Error('VHDL-skill-orchestrator is missing from the repository-local skills registry.');
  }

  const normalizedTask = taskPrompt.toLowerCase();
  const macroHints = inferMacroHints(taskPrompt);
  const supportingByName = new Map<string, DeterministicSkillSelection['supporting'][number]>();

  const upsertSupporting = (skillName: string, forceReason?: string) => {
    const skill = registry.skills.find((entry) => entry.name === skillName);
    if (!skill || skill.name === primary.name) {
      return;
    }
    const { matchedKeywords, score } = scoreSkill(skill, normalizedTask);
    const entry = {
      ...skill,
      matchedKeywords,
      score,
      reason: forceReason || buildReason(skill, matchedKeywords, normalizedTask),
    };
    const existing = supportingByName.get(skill.name);
    if (!existing || existing.score < entry.score || forceReason) {
      supportingByName.set(skill.name, entry);
    }
  };

  if (macroHints) {
    macroHints.required.forEach((skillName) => upsertSupporting(skillName, 'required by deterministic macro-to-skill routing'));
    macroHints.preferred.forEach((skillName) => upsertSupporting(skillName));
  }

  registry.skills
    .filter((skill) => skill.name !== primary.name)
    .forEach((skill) => {
      const { matchedKeywords, score } = scoreSkill(skill, normalizedTask);
      if (score > 0) {
        upsertSupporting(skill.name);
      }
    });

  if (!supportingByName.has('vhdl-language')) {
    upsertSupporting('vhdl-language', 'baseline VHDL reasoning is mandatory for AI hardware macros');
  }

  const supporting = [...supportingByName.values()]
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      if (right.priority !== left.priority) {
        return right.priority - left.priority;
      }
      return left.name.localeCompare(right.name);
    })
    .slice(0, 4);

  const skillCallPlan = [
    `1. ${primary.name}: coordinate the selected skills and preserve the required output contract.`,
    ...supporting.map((skill, index) => `${index + 2}. ${skill.name}: ${skill.reason}.`),
    `${supporting.length + 2}. ${primary.name}: merge the outputs and run the final verification checklist before replying.`,
  ];

  return {
    registryPath: registry.registryPath,
    primary,
    supporting,
    skillCallPlan,
  };
}

export async function prepareVhdlSkillOrchestratorPrompt(taskPrompt: string, projectRoot = process.cwd()): Promise<PreparedVhdlSkillPrompt> {
  try {
    const selection = await selectVhdlSkills(taskPrompt, projectRoot);
    const selectedSkillsText = [
      `- Primary: ${selection.primary.name}`,
      ...selection.supporting.map((skill) => `- Supporting: ${skill.name} - ${skill.reason}`),
    ].join('\n');

    const skillReferenceText = [
      `### Registry Source`,
      `Use the repository-local VHDL skills registry at: ${selection.registryPath}`,
      `Do not re-select skills from scratch. Use the deterministic selection below unless the task clearly requires an additional skill.`,
      `### Deterministically Selected Skills`,
      selectedSkillsText,
      `### Skill Call Plan`,
      selection.skillCallPlan.join('\n'),
      `### Selected Skill Registry Notes`,
      `- ${selection.primary.name}: ${selection.primary.description}`,
      ...selection.supporting.map((skill) => {
        const details = [
          `${skill.name}: ${skill.description}`,
          `domains=${skill.domains.join(', ') || 'n/a'}`,
          `phases=${skill.phases.join(', ') || 'n/a'}`,
          `outputs=${skill.outputs.join(', ') || 'n/a'}`,
          `matched=${skill.matchedKeywords.join(', ') || 'macro routing'}`,
        ];
        return `- ${details.join(' | ')}`;
      }),
    ].join('\n\n');

    return {
      selection,
      prompt: [
        '@Use VHDL-skill-orchestrator',
        'Use the available skills registry to select only the skills needed for this task.',
        'Create a short skill call plan, execute the plan, merge outputs, and run the final verification checklist.',
        'Task:',
        taskPrompt,
        '### Deterministic Server Skill Selection',
        'The app already selected the skills below from the repository-local registry. Use this deterministic selection as the authoritative registry result for this task.',
        skillReferenceText,
        '### Task-Specific Priority',
        'If the task above contains a stricter response contract, exact-token requirement, validation rule, or output format, obey that exact contract while still following the deterministic skill plan.',
      ].join('\n\n'),
    };
  } catch (error: any) {
    return {
      selection: null,
      prompt: [
        '@Use VHDL-skill-orchestrator',
        'Use the available skills registry to select only the skills needed for this task.',
        'Create a short skill call plan, execute the plan, merge outputs, and run the final verification checklist.',
        'Task:',
        taskPrompt,
        '### Registry Load Failure',
        `The repository-local deterministic VHDL skill selection could not be loaded automatically: ${error?.message || String(error)}`,
        'Proceed with VHDL-oriented best effort, but state assumptions clearly and keep the answer within the requested response contract.',
      ].join('\n\n'),
    };
  }
}

export async function applyVhdlSkillOrchestrator(taskPrompt: string, projectRoot = process.cwd()) {
  const prepared = await prepareVhdlSkillOrchestratorPrompt(taskPrompt, projectRoot);
  return prepared.prompt;
}
