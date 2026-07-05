---
name: VHDL-skill-orchestrator
description: VHDL-focused meta-skill that selects, sequences, and coordinates specialized FPGA/VHDL-related skills from a declared skill registry. Use it as the first skill for FPGA, RTL, VHDL, testbench, synthesis, timing, CDC, or debug tasks.
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
metadata:
  mcpmarket-version: 1.0.0
  skill-type: vhdl-orchestration
  alias: skill-orchestrator
  default-registry: skills.registry.yaml
---

# VHDL Skill Orchestrator

This skill is a VHDL-focused routing and coordination layer for LLM coding agents. It inspects the user request, reads the available skill list or registry, selects the needed skill or skills, sequences them, and produces a controlled execution plan.

Use this skill as the first skill for FPGA/VHDL architecture, RTL design, code generation, testbench generation, synthesis preparation, timing closure, CDC review, and debugging workflows.

---

## Purpose

The VHDL Skill Orchestrator ensures the agent does not randomly choose skills or ignore specialized instructions. It must:

1. Parse the user request.
2. Identify required domains and lifecycle phase.
3. Load or inspect the available skill list.
4. Select the most relevant primary skill.
5. Select supporting skills when needed.
6. Define the order of execution.
7. Pass only the relevant task scope to each skill.
8. Merge the outputs into one consistent answer or implementation.
9. Verify that the final output satisfies the user request and all selected skill rules.
10. Enforce repository-local GHDL/VHDL conformance rules before finalizing any generated RTL, package, or testbench output.

---

## When to Use This Skill

Use this skill when the request involves any of the following:

- Multiple disciplines, such as architecture + coding + testing + security + documentation.
- FPGA, RTL, embedded, backend, frontend, UI/UX, database, DevOps, security, QA, or documentation work.
- A user asks to “use the right skill,” “orchestrate skills,” “call needed skills,” or “route to skills.”
- The correct skill is not obvious.
- A task must be completed in phases.
- The agent has a list of available skills and must choose from it.
- Existing code must be analyzed, fixed, tested, and documented.

---

## Inputs

The orchestrator can work with any of these inputs:

```markdown
Task: <user request>
Available Skills:
- <skill-name>: <short description or path>
- <skill-name>: <short description or path>
Target Output: <code/docs/tests/design/etc.>
Constraints: <toolchain, language, standard, style, deadline, etc.>
```

Or with a registry file such as:

```yaml
skills:
  - name: vhdl-language
    path: .agents/skills/vhdl-language/SKILL.md
    domains: [vhdl, fpga, rtl, ieee-1076, synthesis]
    phases: [architecture, rtl-design, coding, debug, verification]
    outputs: [vhdl, testbench, constraints, design-notes]
```

---

## Required Orchestration Workflow

Always follow this workflow before invoking or applying any specialized skill.

### 1. Understand the User Request

Extract:

- Primary objective.
- Required deliverables.
- Technical domain.
- Lifecycle phase.
- Target language, framework, platform, hardware, or toolchain.
- Quality requirements.
- Constraints and assumptions.
- Whether the task is design, implementation, debug, review, test, deployment, documentation, or a combination.

### 2. Load Available Skills

Use the provided list of skills or locate skill files in common locations:

```text
.agents/skills/*/SKILL.md
.codex/skills/*/SKILL.md
.skills/*/SKILL.md
~/.gemini/antigravity/skills/*/SKILL.md
```

When a registry file exists, prefer the registry over directory guessing.

Do not invent skills that are not listed or found.

### 3. Classify the Task

Classify the request using these dimensions:

```yaml
domain:
  - fpga
  - rtl
  - embedded
  - backend
  - frontend
  - ui-ux
  - database
  - devops
  - security
  - testing
  - documentation
  - business-analysis

phase:
  - requirements
  - architecture
  - design
  - implementation
  - debugging
  - verification
  - optimization
  - deployment
  - documentation
  - review

risk_level:
  - low
  - medium
  - high

output_type:
  - code
  - testbench
  - design-document
  - patch
  - review
  - checklist
  - prompt
  - configuration
```

### 4. Score Candidate Skills

Score each available skill from 0 to 5 using:

| Criterion | Score Meaning |
|---|---|
| Domain match | Does the skill match the technical domain? |
| Phase match | Does the skill match the task phase? |
| Output match | Can the skill produce the requested deliverable? |
| Constraint match | Does it support required standards/tools/platforms? |
| Safety/quality relevance | Does it reduce risk or improve correctness? |

Recommended selection rule:

```text
primary_skill = highest scoring skill with domain match >= 4
supporting_skills = skills with score >= 3 and non-overlapping responsibilities
```

If no skill scores at least 3, proceed with general reasoning and clearly state that no matching specialized skill was found.

### 5. Choose Execution Mode

Use one of these modes:

#### Single-Skill Mode

Use when one skill fully covers the task.

Example:

```text
Task: Generate synthesizable VHDL UART receiver.
Primary skill: vhdl-language
Mode: single-skill
```

#### Sequential Chain Mode

Use when phases depend on each other.

Example:

```text
requirements-analysis -> fpga-architecture -> vhdl-language -> vhdl-testbench -> timing-debug
```

#### Parallel Review Mode

Use when quality gates are needed.

Example:

```text
vhdl-language drafts the RTL or verification artifact
fpga-architecture reviews interfaces, clock/reset, and hierarchy
timing-constraints reviews timing assumptions and implementation risks
```

#### Debug Triage Mode

Use when existing code fails.

Example:

```text
code-debugger -> domain-specific-language-skill -> testbench/verification-skill -> documentation-skill
```

### 6. Create the Skill Call Plan

Before implementation, create a short internal or visible plan depending on the user context:

```markdown
## Skill Call Plan

Primary skill: <skill-name>
Supporting skills:
- <skill-name>: <scope>
- <skill-name>: <scope>

Execution order:
1. <skill-name> - <task>
2. <skill-name> - <task>
3. Merge and verify final output.

### 7. Mandatory GHDL / VHDL Conformance Checklist

When the task produces or edits VHDL, packages, or testbenches, the orchestrator must preserve these rules across all selected skills:

- Target VHDL-2008 by default unless the task explicitly says otherwise.
- Use `ieee.std_logic_1164` and `ieee.numeric_std`; do not use non-standard arithmetic libraries.
- Every generated design unit must include the `library` and `use` clauses it actually needs in that same file.
- Testbenches must be GHDL-compatible and must stop cleanly on success with `std.env.stop(0)` or equivalent std-library usage, never `severity failure`.
- Testbench helper procedures/functions must be declared before `begin`.
- Do not place plain variables in the architecture body.
- Keep reset polarity/style consistent between DUT and TB, and sample synchronous outputs only after the active edge update takes effect.
- Do not use reserved words/operator tokens as identifiers.
- Do not emit invalid boolean/bitwise expressions such as `a_int and b_int = 0`.
- Generate explicit compile-order-safe `work` package usage and avoid unresolved work units.
- The final result should be suitable for a full `ghdl -a`, `ghdl -e`, `ghdl -r` flow as written.

Assumptions:
- <assumption>
```

### 7. Apply Skill Scope Boundaries

Each selected skill must receive a bounded instruction:

```markdown
Use <skill-name> for this scope only:
- Inputs: <relevant task data>
- Expected output: <specific deliverable>
- Constraints: <standards/tools/style>
- Do not modify: <out-of-scope files or decisions>
```

Do not let one skill override another skill outside its domain.

### 8. Merge Outputs

When multiple skills produce outputs:

1. Resolve contradictions using the highest-domain-authority skill.
2. Preserve user constraints over generic skill defaults.
3. Prefer standards-compliant, testable, maintainable solutions.
4. Remove duplicate explanations.
5. Produce one coherent final answer or patch.

### 9. Final Verification Checklist

Before final response or commit, check:

- Correct skills were selected.
- No unavailable skill was invented.
- User constraints were preserved.
- Output is complete.
- Code compiles or includes compile commands.
- Tests are included where appropriate.
- Debug/verification notes are included for technical work.
- Assumptions are documented.
- No skill produced conflicting instructions without resolution.

---

## Skill Registry Format

A skill registry should use this structure:

```yaml
version: 1
skills:
  - name: vhdl-language
    path: .agents/skills/vhdl-language/SKILL.md
    description: FPGA/VHDL architecture, RTL implementation, verification, synthesis, timing, and debug skill.
    domains:
      - fpga
      - rtl
      - vhdl
      - ieee-1076
    phases:
      - requirements
      - architecture
      - design
      - implementation
      - debugging
      - verification
      - optimization
    outputs:
      - vhdl
      - testbench
      - constraints
      - design-notes
    trigger_keywords:
      - vhdl
      - fpga
      - rtl
      - vivado
      - quartus
      - ghdl
      - ieee 1076
    priority: 100
    conflicts: []
```

Required fields:

- `name`
- `description`
- `domains`
- `phases`
- `outputs`

Recommended fields:

- `path`
- `trigger_keywords`
- `priority`
- `conflicts`
- `requires`
- `toolchains`

---

## Standard Skill Handoff Template

Use this format when handing a task to a selected skill:

```markdown
@Use <skill-name>

Task scope:
<exact bounded task>

Inputs:
<relevant files, requirements, constraints, and assumptions>

Expected output:
<specific deliverable>

Quality gates:
- <gate 1>
- <gate 2>
- <gate 3>

Do not:
- <out-of-scope action>
```

---

## Example: FPGA/VHDL Routing

User request:

```text
Design a VHDL SPI master for a Xilinx FPGA and generate a testbench.
```

Classification:

```yaml
domain: [fpga, rtl, vhdl]
phase: [architecture, implementation, verification]
output_type: [vhdl, testbench, design-notes]
risk_level: high
```

Selected skills:

```yaml
primary: vhdl-language
supporting:
  - fpga-architecture
  - rtl-verification
  - timing-constraints
```

Execution order:

```text
1. fpga-architecture: define SPI architecture, clocking, reset, and interface assumptions.
2. vhdl-language: generate synthesizable VHDL RTL using IEEE numeric_std.
3. rtl-verification: generate self-checking testbench.
4. timing-constraints: suggest SDC/XDC clock and I/O timing constraints.
5. VHDL-skill-orchestrator: merge deliverables and run final checklist.
```

---

## Example: Full-Stack App Routing

User request:

```text
Build a dashboard app with login, PostgreSQL database, API, and responsive UI.
```

Selected skills:

```yaml
primary: VHDL-skill-orchestrator
supporting:
  - vhdl-language
  - fpga-architecture
  - rtl-verification
  - timing-constraints
```

Execution order:

```text
1. VHDL-skill-orchestrator: identify the minimum hardware-focused skill set.
2. fpga-architecture: review hierarchy, interfaces, clocks, resets, and control/data partitioning.
3. vhdl-language: implement or analyze the RTL/VHDL artifact.
4. rtl-verification: validate behavior with testbench/assertion-oriented reasoning.
5. timing-constraints: review timing assumptions, setup/hold risks, and implementation constraints.
6. VHDL-skill-orchestrator: merge and verify final output.
```

---

## Conflict Resolution Rules

When skills disagree:

1. User instruction wins over skill defaults.
2. Safety/security/compliance rules win over convenience.
3. Domain-specific skill wins inside its domain.
4. Architecture skill wins for system boundaries.
5. Verification skill wins for test coverage and validation.
6. Documentation skill may improve clarity but must not change technical meaning.

Example:

```text
If vhdl-language says to use VHDL-2008 and generic-coder suggests non-standard packages, use vhdl-language.
```

---

## Quality Gates by Task Type

### Code Generation

Must include:

- Implementation.
- Assumptions.
- Build or compile commands.
- Test or validation method.
- Known limitations.

### Debugging

Must include:

- Root cause.
- Minimal fix.
- Why the fix works.
- Regression test.
- Side effects.

### Architecture

Must include:

- Components.
- Interfaces.
- Data/control flow.
- Risks.
- Constraints.
- Future extension points.

### FPGA/RTL

Must include:

- Clock/reset assumptions.
- CDC assessment.
- Synthesizable RTL guidance.
- Testbench plan.
- Timing/constraints notes.
- Toolchain notes.

### Documentation

Must include:

- Clear structure.
- Intended audience.
- Assumptions.
- Decision rationale.
- Actionable next steps.

---

## Agent Behavior Rules

The orchestrator must obey these rules:

1. Do not skip skill selection for complex tasks.
2. Do not apply all skills blindly.
3. Do not invent unavailable skills.
4. Do not let a support skill override the primary skill outside its domain.
5. Do not produce implementation before architecture when the task is non-trivial.
6. Do not hide important assumptions.
7. Do not ignore validation, testing, or debug steps.
8. Do not use a skill only because its keyword appears; confirm task relevance.
9. Do not create excessive process overhead for simple tasks.
10. Always produce a final answer that the user can act on.

---

## Minimal Invocation Prompt

Use this in Codex, OpenCode, Antigravity, Claude Code, or similar coding agents:

```markdown
@Use VHDL-skill-orchestrator

Use the available skills registry to select only the skills needed for this task.
Create a short skill call plan, execute the plan, merge outputs, and run the final verification checklist.

Task:
<insert task here>
```

---

## Recommended Repository Layout

```text
.agents/
  skills/
    VHDL-skill-orchestrator/
      SKILL.md
    vhdl-language/
      SKILL.md
    ui-ux-designer/
      SKILL.md
    backend-engineer/
      SKILL.md
    test-engineer/
      SKILL.md
  skills.registry.yaml
AGENTS.md
```

Alternative Codex layout:

```text
.codex/
  skills/
    VHDL-skill-orchestrator/
      SKILL.md
    vhdl-language/
      SKILL.md
  skills.registry.yaml
AGENTS.md
```

---

## AGENTS.md Rule

Add this to the repository-level `AGENTS.md` file:

```markdown
# Skill Usage Policy

For every non-trivial task, first use the `VHDL-skill-orchestrator` skill.
The orchestrator must inspect the available skills list, select only the needed skills, define execution order, and merge outputs.

Do not directly jump into implementation when a specialized skill applies.
Do not invent unavailable skills.
When FPGA/VHDL work is requested, route through `vhdl-language` after the orchestrator creates the design plan.
```

---

## Final Output Contract

For every orchestrated task, produce:

```markdown
## Selected Skills
- Primary: <skill-name>
- Supporting: <skill-name> - <reason>

## Execution Summary
<what was done>

## Deliverables
<files, code, documents, tests, or design outputs>

## Validation
<checks performed or commands to run>

## Assumptions
<assumptions made>

## Next Action
<only if required>
```

For small tasks, this contract may be shortened, but the skill selection and validation logic must still be applied internally.
