# VHDL Skill Orchestrator Pack

This pack adds a VHDL-focused meta-skill that routes FPGA/VHDL tasks to the correct specialized skills.

## Files

- `SKILL.md` — the main VHDL-skill-orchestrator file.
- `skills.registry.yaml` — example skill list used by the orchestrator.
- `AGENTS.md` — repository-level rule for Codex/OpenCode/Antigravity-style agents.

## Recommended Installation

Use one of these layouts:

```text
.agents/skills/VHDL-skill-orchestrator/SKILL.md
.agents/skills.registry.yaml
AGENTS.md
```

or:

```text
.codex/skills/VHDL-skill-orchestrator/SKILL.md
.codex/skills.registry.yaml
AGENTS.md
```

For Antigravity-style installations, use:

```text
~/.gemini/antigravity/skills/VHDL-skill-orchestrator/SKILL.md
```

## How to Use

Add this to your prompt:

```markdown
@Use VHDL-skill-orchestrator

Use the available skills registry to select only the skills needed for this task.
Create a short skill call plan, execute the plan, merge outputs, and run the final verification checklist.

Task:
<your task here>
```

## How to Add More Skills

Add each skill to `skills.registry.yaml` using this structure:

```yaml
- name: your-skill-name
  path: .agents/skills/your-skill-name/SKILL.md
  description: Short description of what this skill does.
  domains: [domain1, domain2]
  phases: [requirements, architecture, implementation, debugging, verification]
  outputs: [code, docs, tests]
  trigger_keywords: [keyword1, keyword2]
  priority: 50
  conflicts: []
```

## Recommended Rule

Keep `VHDL-skill-orchestrator` as the first skill in FPGA/VHDL prompts. It should decide which other skills are needed.


## Migration from the old name

Replace old prompt references:

```markdown
@Use skill-orchestrator
```

with:

```markdown
@Use VHDL-skill-orchestrator
```
