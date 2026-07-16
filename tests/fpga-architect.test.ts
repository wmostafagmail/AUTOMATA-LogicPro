import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  buildDeterministicArchitectGhdlRunCommands,
  buildFpgaArchitectRetryPrompt,
  buildFpgaArchitectCompactRetryPrompt,
  buildFpgaArchitectJsonRepairPrompt,
  buildFpgaArchitectTestRunPrompt,
  parseFpgaArchitectResponse,
  saveFpgaArchitectProject,
} from '../src/server/fpgaArchitect';

test('parseFpgaArchitectResponse repairs missing commas inside content_lines arrays', () => {
  const malformedJson = `{
    "project_name": "Counter",
    "sanitized_project_name": "counter",
    "top_entity": "updown_counter",
    "vhdl_standard": "VHDL-2008",
    "target_fpga": "Xilinx Artix-7",
    "summary": "Compact counter project",
    "assumptions": [],
    "warnings": [],
    "folder_tree": "src/\\ntb/",
    "files": [
      {
        "path": "src/updown_counter.vhd",
        "file_type": "vhdl_rtl",
        "purpose": "rtl",
        "content_lines": [
          "entity updown_counter is"
          "end entity;"
          "architecture rtl of updown_counter is begin end architecture;"
        ]
      },
      {
        "path": "tb/tb_updown_counter.vhd",
        "file_type": "vhdl_testbench",
        "purpose": "testbench",
        "content_lines": [
          "entity tb_updown_counter is"
          "end entity;"
          "architecture sim of tb_updown_counter is begin end architecture;"
        ]
      },
      {
        "path": "requirements/spec.md",
        "file_type": "markdown",
        "purpose": "requirements",
        "content": "spec"
      },
      {
        "path": "architecture/design.md",
        "file_type": "markdown",
        "purpose": "architecture",
        "content": "design"
      },
      {
        "path": "sim/run.sh",
        "file_type": "script",
        "purpose": "simulation",
        "content": "ghdl"
      },
      {
        "path": "constraints/top.xdc",
        "file_type": "constraints",
        "purpose": "constraints",
        "content": "#"
      },
      {
        "path": "docs/readme.md",
        "file_type": "markdown",
        "purpose": "docs",
        "content": "readme"
      }
    ],
    "ghdl": {
      "analysis_order": [
        "src/updown_counter.vhd",
        "tb/tb_updown_counter.vhd"
      ],
      "top_testbench": "tb_updown_counter",
      "run_commands": [
        "ghdl -a --std=08 src/updown_counter.vhd",
        "ghdl -a --std=08 tb/tb_updown_counter.vhd",
        "ghdl -e --std=08 tb_updown_counter",
        "ghdl -r --std=08 tb_updown_counter --stop-time=1us"
      ],
      "expected_result": "pass"
    },
    "quality_checklist": []
  }`;

  const project = parseFpgaArchitectResponse(malformedJson);

  assert.equal(project.topEntity, 'updown_counter');
  assert.equal(project.ghdl.topTestbench, 'tb_updown_counter');
  assert.match(project.files.find((file) => file.path === 'src/updown_counter.vhd')?.content || '', /entity updown_counter is/);
  assert.match(project.files.find((file) => file.path === 'tb/tb_updown_counter.vhd')?.content || '', /entity tb_updown_counter is/);
});

test('FPGA Architect retry prompts include recurring failure guards for repeated sweep blockers', () => {
  const prompt = buildFpgaArchitectRetryPrompt({
    originalPrompt: 'base architect prompt: design a flight controller with IMU PID motor mixer and failsafe',
    errorSummary: 'tb/example.vhd: declares procedure after begin',
  });

  assert.match(prompt, /Recurring failure guards you must explicitly self-audit before returning/);
  assert.match(prompt, /Failure evidence contract:/);
  assert.match(prompt, /Do not infer or guess a different failure reason/);
  assert.match(prompt, /Reported failure: tb\/example\.vhd: declares procedure after begin/);
  assert.match(prompt, /Failure code: declaration_after_begin/);
  assert.match(prompt, /Failure code: output_port_readback/);
  assert.match(prompt, /Failure code: reserved_identifier/);
  assert.match(prompt, /Failure code: runtime_bound_check_risk/);
  assert.match(prompt, /Failure code: missing_waveform_generation_contract/);
  assert.match(prompt, /Structure-First Generation Contract/);
  assert.match(prompt, /Golden VHDL Templates/);
  assert.match(prompt, /Repair Scope Control/);
  assert.match(prompt, /App-Owned Architecture Blueprint Contract/);
  assert.match(prompt, /Design class: flight_controller/);
  assert.match(prompt, /Constrained Implementation Regions/);
});

test('FPGA Architect compact and test-run prompts include recurring failure guards for repeated sweep blockers', () => {
  const compactPrompt = buildFpgaArchitectCompactRetryPrompt({
    originalPrompt: 'base architect prompt: design an AXI stream packet router',
    errorSummary: 'summary',
    compactMode: 'minimal',
  });
  const testRunPrompt = buildFpgaArchitectTestRunPrompt({
    originalPrompt: 'base architect prompt: design an 8-bit ALU',
    compactMode: 'minimal',
  });

  assert.match(compactPrompt, /Failure code: declaration_after_begin/);
  assert.match(compactPrompt, /Failure evidence contract:/);
  assert.match(compactPrompt, /Reported failure: summary/);
  assert.match(compactPrompt, /Failure code: output_port_readback/);
  assert.match(compactPrompt, /Failure code: missing_waveform_generation_contract/);
  assert.match(testRunPrompt, /Failure code: declaration_after_begin/);
  assert.match(testRunPrompt, /Failure code: reserved_identifier/);
  assert.match(testRunPrompt, /Failure code: runtime_bound_check_risk/);
  assert.match(testRunPrompt, /Structure-First Generation Contract/);
  assert.match(testRunPrompt, /File-By-File Generation Order/);
  assert.match(testRunPrompt, /Semantic Preflight Checklist/);
  assert.match(compactPrompt, /Design class: axi_stream_router/);
  assert.match(testRunPrompt, /Design class: alu/);
});

test('parseFpgaArchitectResponse accepts JSON aliases and infers top entity from generated files', () => {
  const aliasedJson = `{
    "projectName": "Counter",
    "sanitizedProjectName": "counter",
    "vhdlStandard": "VHDL-2008",
    "targetFpga": "Xilinx Artix-7",
    "summary": "Compact counter project",
    "assumptions": [],
    "warnings": [],
    "folderTree": "src/\\ntb/",
    "files": [
      {
        "path": "src/updown_counter.vhd",
        "fileType": "vhdl_rtl",
        "purpose": "rtl",
        "content": "entity updown_counter is\\nend entity;\\narchitecture rtl of updown_counter is begin end architecture;"
      },
      {
        "path": "tb/tb_updown_counter.vhd",
        "fileType": "vhdl_testbench",
        "purpose": "testbench",
        "content": "entity tb_updown_counter is\\nend entity;\\narchitecture sim of tb_updown_counter is begin end architecture;"
      },
      {
        "path": "requirements/spec.md",
        "fileType": "markdown",
        "purpose": "requirements",
        "content": "spec"
      },
      {
        "path": "architecture/design.md",
        "fileType": "markdown",
        "purpose": "architecture",
        "content": "design"
      },
      {
        "path": "sim/run.sh",
        "fileType": "script",
        "purpose": "simulation",
        "content": "ghdl"
      },
      {
        "path": "constraints/top.xdc",
        "fileType": "constraints",
        "purpose": "constraints",
        "content": "#"
      },
      {
        "path": "docs/readme.md",
        "fileType": "markdown",
        "purpose": "docs",
        "content": "readme"
      }
    ],
    "simulation": {
      "topTestbench": "tb_updown_counter",
      "analysisOrder": [
        "src/updown_counter.vhd",
        "tb/tb_updown_counter.vhd"
      ],
      "runCommands": [
        "ghdl -a --std=08 src/updown_counter.vhd",
        "ghdl -a --std=08 tb/tb_updown_counter.vhd",
        "ghdl -e --std=08 tb_updown_counter",
        "ghdl -r --std=08 tb_updown_counter --stop-time=1us"
      ],
      "expectedResult": "pass"
    },
    "qualityChecklist": []
  }`;

  const project = parseFpgaArchitectResponse(aliasedJson);

  assert.equal(project.projectName, 'Counter');
  assert.equal(project.topEntity, 'updown_counter');
  assert.equal(project.ghdl.topTestbench, 'tb_updown_counter');
});

test('parseFpgaArchitectResponse repairs JavaScript-style object literals', () => {
  const jsLiteral = `{
    project_name: 'Counter',
    sanitized_project_name: 'counter',
    top_entity: 'updown_counter',
    vhdl_standard: 'VHDL-2008',
    target_fpga: 'Xilinx Artix-7',
    summary: 'Compact counter project',
    assumptions: [],
    warnings: [],
    folder_tree: 'src/\\ntb/',
    files: [
      {
        path: 'src/updown_counter.vhd',
        file_type: 'vhdl_rtl',
        purpose: 'rtl',
        content: 'entity updown_counter is\\nend entity;\\narchitecture rtl of updown_counter is begin end architecture;'
      },
      {
        path: 'tb/tb_updown_counter.vhd',
        file_type: 'vhdl_testbench',
        purpose: 'testbench',
        content: 'entity tb_updown_counter is\\nend entity;\\narchitecture sim of tb_updown_counter is begin end architecture;'
      },
      {
        path: 'requirements/spec.md',
        file_type: 'markdown',
        purpose: 'requirements',
        content: 'spec'
      },
      {
        path: 'architecture/design.md',
        file_type: 'markdown',
        purpose: 'architecture',
        content: 'design'
      },
      {
        path: 'sim/run.sh',
        file_type: 'script',
        purpose: 'simulation',
        content: 'ghdl'
      },
      {
        path: 'constraints/top.xdc',
        file_type: 'constraints',
        purpose: 'constraints',
        content: '#'
      },
      {
        path: 'docs/readme.md',
        file_type: 'markdown',
        purpose: 'docs',
        content: 'readme'
      }
    ],
    ghdl: {
      top_testbench: 'tb_updown_counter',
      analysis_order: [
        'src/updown_counter.vhd',
        'tb/tb_updown_counter.vhd'
      ],
      run_commands: [
        'ghdl -a --std=08 src/updown_counter.vhd',
        'ghdl -a --std=08 tb/tb_updown_counter.vhd',
        'ghdl -e --std=08 tb_updown_counter',
        'ghdl -r --std=08 tb_updown_counter --stop-time=1us'
      ],
      expected_result: 'pass'
    },
    quality_checklist: []
  }`;

  const project = parseFpgaArchitectResponse(jsLiteral);

  assert.equal(project.projectName, 'Counter');
  assert.equal(project.topEntity, 'updown_counter');
  assert.equal(project.ghdl.topTestbench, 'tb_updown_counter');
});

test('parseFpgaArchitectResponse treats markdown-labeled prose as a Markdown-manifest failure, not JSON fallback', () => {
  assert.throws(
    () => parseFpgaArchitectResponse('markdown - generated project manifest will follow once ready'),
    /Markdown manifest was invalid/i,
  );
});

test('parseFpgaArchitectResponse accepts a Markdown project manifest with file blocks', () => {
  const manifest = `# PROJECT
project_name: Counter
sanitized_project_name: counter
top_entity: updown_counter
vhdl_standard: VHDL-2008
target_fpga: Xilinx Artix-7
summary: Compact counter project

## ASSUMPTIONS
- 100 MHz board clock

## WARNINGS
- Constraints placeholder only

## FOLDER_TREE
src/
tb/
constraints/

## GHDL
top_testbench: tb_updown_counter
expected_result: pass
analysis_order:
- src/updown_counter.vhd
- tb/tb_updown_counter.vhd
run_commands:
- ghdl -a --std=08 src/updown_counter.vhd
- ghdl -a --std=08 tb/tb_updown_counter.vhd
- ghdl -e --std=08 tb_updown_counter
- ghdl -r --std=08 tb_updown_counter --stop-time=1us

## QUALITY_CHECKLIST
- Simulates under GHDL

# FILE: src/updown_counter.vhd
file_type: vhdl_rtl
purpose: rtl
\`\`\`vhdl
entity updown_counter is
end entity;
architecture rtl of updown_counter is begin end architecture;
\`\`\`

# FILE: tb/tb_updown_counter.vhd
file_type: vhdl_testbench
purpose: testbench
\`\`\`vhdl
entity tb_updown_counter is
end entity;
architecture sim of tb_updown_counter is begin end architecture;
\`\`\`

# FILE: requirements/spec.md
file_type: markdown
purpose: requirements
\`\`\`md
spec
\`\`\`

# FILE: architecture/design.md
file_type: markdown
purpose: architecture
\`\`\`md
design
\`\`\`

# FILE: sim/run.sh
file_type: script
purpose: simulation
\`\`\`sh
ghdl
\`\`\`

# FILE: constraints/top.xdc
file_type: constraints
purpose: constraints
\`\`\`xdc
#
\`\`\`

# FILE: docs/readme.md
file_type: markdown
purpose: docs
\`\`\`md
readme
\`\`\`
`;

  const project = parseFpgaArchitectResponse(manifest);

  assert.equal(project.projectName, 'Counter');
  assert.equal(project.topEntity, 'updown_counter');
  assert.equal(project.ghdl.topTestbench, 'tb_updown_counter');
  assert.equal(project.assumptions[0], '100 MHz board clock');
  assert.match(project.files.find((file) => file.path === 'src/updown_counter.vhd')?.content || '', /entity updown_counter is/);
  assert.deepEqual(
    project.ghdl.runCommands,
    buildDeterministicArchitectGhdlRunCommands({
      analysisOrder: ['src/updown_counter.vhd', 'tb/tb_updown_counter.vhd'],
      topTestbench: 'tb_updown_counter',
      vhdlStandard: 'VHDL-2008',
    }),
  );
});

test('parseFpgaArchitectResponse synthesizes deterministic GHDL commands when the manifest omits run_commands', () => {
  const manifest = `# PROJECT
project_name: Counter
sanitized_project_name: counter
top_entity: updown_counter
vhdl_standard: VHDL-2008
target_fpga: Xilinx Artix-7
summary: Compact counter project

## GHDL
top_testbench: tb_updown_counter
expected_result: pass
analysis_order:
- src/updown_counter.vhd
- tb/tb_updown_counter.vhd

# FILE: src/updown_counter.vhd
file_type: vhdl_rtl
purpose: rtl
\`\`\`vhdl
entity updown_counter is
end entity;
architecture rtl of updown_counter is begin end architecture;
\`\`\`

# FILE: tb/tb_updown_counter.vhd
file_type: vhdl_testbench
purpose: testbench
\`\`\`vhdl
entity tb_updown_counter is
end entity;
architecture sim of tb_updown_counter is begin end architecture;
\`\`\`

# FILE: requirements/spec.md
file_type: markdown
purpose: requirements
\`\`\`md
spec
\`\`\`

# FILE: architecture/design.md
file_type: markdown
purpose: architecture
\`\`\`md
design
\`\`\`

# FILE: sim/run.sh
file_type: script
purpose: simulation
\`\`\`sh
ghdl
\`\`\`

# FILE: constraints/top.xdc
file_type: constraints
purpose: constraints
\`\`\`xdc
#
\`\`\`

# FILE: docs/readme.md
file_type: markdown
purpose: docs
\`\`\`md
readme
\`\`\`
`;

  const project = parseFpgaArchitectResponse(manifest);

  assert.deepEqual(
    project.ghdl.runCommands,
    [
      'ghdl -a --std=08 src/updown_counter.vhd',
      'ghdl -a --std=08 tb/tb_updown_counter.vhd',
      'ghdl -e --std=08 tb_updown_counter',
      'ghdl -r --std=08 tb_updown_counter --vcd=sim/tb_updown_counter.vcd --stop-time=1us',
    ],
  );
});

test('parseFpgaArchitectResponse accepts a Markdown manifest with a leading wrapper prefix', () => {
  const wrappedManifest = `markdown

Here is the generated FPGA project manifest.

# PROJECT
project_name: Counter
sanitized_project_name: counter
top_entity: updown_counter
vhdl_standard: VHDL-2008
target_fpga: Xilinx Artix-7
summary: Compact counter project

## ASSUMPTIONS
- 100 MHz board clock

## WARNINGS
- Constraints placeholder only

## FOLDER_TREE
src/
tb/
constraints/

## GHDL
top_testbench: tb_updown_counter
expected_result: pass
analysis_order:
- src/updown_counter.vhd
- tb/tb_updown_counter.vhd
run_commands:
- ghdl -a --std=08 src/updown_counter.vhd
- ghdl -a --std=08 tb/tb_updown_counter.vhd
- ghdl -e --std=08 tb_updown_counter
- ghdl -r --std=08 tb_updown_counter --stop-time=1us

## QUALITY_CHECKLIST
- Simulates under GHDL

# FILE: src/updown_counter.vhd
file_type: vhdl_rtl
purpose: rtl
\`\`\`vhdl
entity updown_counter is
end entity;
architecture rtl of updown_counter is begin end architecture;
\`\`\`

# FILE: tb/tb_updown_counter.vhd
file_type: vhdl_testbench
purpose: testbench
\`\`\`vhdl
entity tb_updown_counter is
end entity;
architecture sim of tb_updown_counter is begin end architecture;
\`\`\`

# FILE: requirements/spec.md
file_type: markdown
purpose: requirements
\`\`\`md
spec
\`\`\`

# FILE: architecture/design.md
file_type: markdown
purpose: architecture
\`\`\`md
design
\`\`\`

# FILE: sim/run.sh
file_type: script
purpose: simulation
\`\`\`sh
ghdl
\`\`\`

# FILE: constraints/top.xdc
file_type: constraints
purpose: constraints
\`\`\`xdc
#
\`\`\`

# FILE: docs/readme.md
file_type: markdown
purpose: docs
\`\`\`md
readme
\`\`\`
`;

  const project = parseFpgaArchitectResponse(wrappedManifest);

  assert.equal(project.projectName, 'Counter');
  assert.equal(project.topEntity, 'updown_counter');
  assert.equal(project.ghdl.topTestbench, 'tb_updown_counter');
});

test('parseFpgaArchitectResponse accepts a Markdown-like manifest without the PROJECT heading', () => {
  const headinglessManifest = `markdown - generated manifest

project_name: Counter
sanitized_project_name: counter
top_entity: updown_counter
vhdl_standard: VHDL-2008
target_fpga: Xilinx Artix-7
summary: Compact counter project

## ASSUMPTIONS
- 100 MHz board clock

## WARNINGS
- Constraints placeholder only

## FOLDER_TREE
src/
tb/
constraints/

## GHDL
top_testbench: tb_updown_counter
expected_result: pass
analysis_order:
- src/updown_counter.vhd
- tb/tb_updown_counter.vhd
run_commands:
- ghdl -a --std=08 src/updown_counter.vhd
- ghdl -a --std=08 tb/tb_updown_counter.vhd
- ghdl -e --std=08 tb_updown_counter
- ghdl -r --std=08 tb_updown_counter --stop-time=1us

## QUALITY_CHECKLIST
- Simulates under GHDL

# FILE: src/updown_counter.vhd
file_type: vhdl_rtl
purpose: rtl
\`\`\`vhdl
entity updown_counter is
end entity;
architecture rtl of updown_counter is begin end architecture;
\`\`\`

# FILE: tb/tb_updown_counter.vhd
file_type: vhdl_testbench
purpose: testbench
\`\`\`vhdl
entity tb_updown_counter is
end entity;
architecture sim of tb_updown_counter is begin end architecture;
\`\`\`

# FILE: requirements/spec.md
file_type: markdown
purpose: requirements
\`\`\`md
spec
\`\`\`

# FILE: architecture/design.md
file_type: markdown
purpose: architecture
\`\`\`md
design
\`\`\`

# FILE: sim/run.sh
file_type: script
purpose: simulation
\`\`\`sh
ghdl
\`\`\`

# FILE: constraints/top.xdc
file_type: constraints
purpose: constraints
\`\`\`xdc
#
\`\`\`

# FILE: docs/readme.md
file_type: markdown
purpose: docs
\`\`\`md
readme
\`\`\`
`;

  const project = parseFpgaArchitectResponse(headinglessManifest);

  assert.equal(project.projectName, 'Counter');
  assert.equal(project.topEntity, 'updown_counter');
  assert.equal(project.ghdl.topTestbench, 'tb_updown_counter');
});

test('parseFpgaArchitectResponse accepts alternate Markdown heading levels for project files', () => {
  const relaxedHeadingManifest = `### PROJECT
project_name: Counter
sanitized_project_name: counter
top_entity: updown_counter
vhdl_standard: VHDL-2008
target_fpga: Xilinx Artix-7
summary: Compact counter project

### ASSUMPTIONS
- 100 MHz board clock

### GHDL
top_testbench: tb_updown_counter
expected_result: pass
analysis_order:
- src/updown_counter.vhd
- tb/tb_updown_counter.vhd
run_commands:
- ghdl -a --std=08 src/updown_counter.vhd
- ghdl -a --std=08 tb/tb_updown_counter.vhd
- ghdl -e --std=08 tb_updown_counter
- ghdl -r --std=08 tb_updown_counter --stop-time=1us

FILE: src/updown_counter.vhd
file_type: vhdl_rtl
purpose: rtl
\`\`\`vhdl
entity updown_counter is
end entity;
architecture rtl of updown_counter is begin end architecture;
\`\`\`

## FILE: tb/tb_updown_counter.vhd
file_type: vhdl_testbench
purpose: testbench
\`\`\`vhdl
entity tb_updown_counter is
end entity;
architecture sim of tb_updown_counter is begin end architecture;
\`\`\`

### FILE: requirements/spec.md
file_type: markdown
purpose: requirements
\`\`\`md
spec
\`\`\`

### FILE: architecture/design.md
file_type: markdown
purpose: architecture
\`\`\`md
design
\`\`\`

### FILE: sim/run.sh
file_type: script
purpose: simulation
\`\`\`sh
ghdl
\`\`\`

### FILE: constraints/top.xdc
file_type: constraints
purpose: constraints
\`\`\`xdc
#
\`\`\`

### FILE: docs/readme.md
file_type: markdown
purpose: docs
\`\`\`md
readme
\`\`\`
`;

  const project = parseFpgaArchitectResponse(relaxedHeadingManifest);

  assert.equal(project.projectName, 'Counter');
  assert.equal(project.topEntity, 'updown_counter');
  assert.equal(project.ghdl.topTestbench, 'tb_updown_counter');
});

test('FPGA Architect retry prompts include the local JSON generation skill contract', () => {
  const repairPrompt = buildFpgaArchitectJsonRepairPrompt({
    originalPrompt: 'base prompt',
    invalidResponse: '{"broken": [ "x" "y" ]}',
    errorSummary: 'missing comma',
  });
  const compactPrompt = buildFpgaArchitectCompactRetryPrompt({
    originalPrompt: 'base prompt',
    errorSummary: 'still malformed',
  });

  assert.match(repairPrompt, /Markdown project manifest/i);
  assert.match(compactPrompt, /Markdown project manifest/i);
  assert.match(repairPrompt, /local-llm-json-generation/i);
  assert.match(repairPrompt, /The very first characters of your response must be exactly: "# PROJECT"/i);
  assert.match(compactPrompt, /The very first characters of your response must be exactly: "# PROJECT"/i);
  assert.match(repairPrompt, /Strict GHDL \/ VHDL rules:/i);
  assert.match(repairPrompt, /Treat every VHDL reserved word and operator keyword as forbidden/i);
  assert.match(repairPrompt, /ALU_OP_AND, ALU_OP_XNOR, ALU_OP_SLL, ALU_OP_SRL, OP_SHIFT_LEFT, OP_SHIFT_RIGHT, check_name, or msg_name/i);
  assert.match(repairPrompt, /a_int and b_int = 0/i);
  assert.match(repairPrompt, /a zero flag must be based on the ALU result value/i);
  assert.match(repairPrompt, /result_int = 0/i);
  assert.match(repairPrompt, /std_logic_vector` arguments into typed internal operands/i);
  assert.match(repairPrompt, /use ieee\.std_logic_1164\.all/i);
  assert.match(repairPrompt, /use ieee\.numeric_std\.all/i);
  assert.match(repairPrompt, /The `xnor` operator must be written in legal infix form/i);
  assert.match(compactPrompt, /pragma translate_on\/translate_off/i);
  assert.match(compactPrompt, /std\.env\.stop\(0\)/i);
  assert.match(compactPrompt, /next-state values one clock too early/i);
  assert.match(compactPrompt, /Do not reference unresolved work units/i);
  assert.match(compactPrompt, /Treat every VHDL reserved word and operator keyword as forbidden/i);
  assert.match(compactPrompt, /OP_SHIFT_LEFT, OP_SHIFT_RIGHT/i);
  assert.match(compactPrompt, /Do not use VHDL logical operator tokens as pseudo-English arithmetic\/comparison glue/i);
  assert.match(compactPrompt, /a zero flag must be based on the ALU result value/i);
  assert.match(compactPrompt, /keyword operators on same-typed operands/i);
  assert.match(compactPrompt, /result_u := a_u xnor b_u;/i);
  assert.match(compactPrompt, /The `xnor` operator must be written in legal infix form such as `a_u xnor b_u`/i);
  assert.match(compactPrompt, /Every generated VHDL design unit must declare the libraries\/packages it actually uses in that same file/i);
  assert.match(compactPrompt, /Package declarations and package bodies are not exempt from those IEEE clauses/i);
  assert.match(compactPrompt, /immediately normalize them into canonical internal typed operands/i);
  assert.match(compactPrompt, /define opcode encodings in one shared package/i);
  assert.match(compactPrompt, /never pass a raw `std_logic_vector` actual into it/i);
  assert.match(compactPrompt, /Call `resize` only on `unsigned` or `signed` values/i);
  assert.match(compactPrompt, /every arithmetic, bitwise, and shift branch must assign an `unsigned` result/i);
  assert.match(compactPrompt, /include deterministic smoke vectors.*1 \+ 2 = 3/i);
  assert.match(compactPrompt, /tiny golden-model expectation computed from the same typed operands\/opcodes/i);
  assert.match(compactPrompt, /Package declarations and package bodies are not exempt from those IEEE clauses/i);
  assert.match(repairPrompt, /Do not declare plain variables in the architecture body/i);
  assert.match(repairPrompt, /flags such as test_failed must be signals or process-local variables/i);
  assert.match(repairPrompt, /must not mutate outer-scope variables or signals implicitly/i);
  assert.match(repairPrompt, /must not assign directly to architecture-scope bookkeeping objects like `test_failed`, `out_test_failed`, `pass_count`, or `fail_count` unless those objects are passed in through legal VHDL formal arguments/i);
  assert.match(compactPrompt, /Do not declare plain variables in the architecture body/i);
  assert.match(compactPrompt, /must not mutate outer-scope variables or signals implicitly/i);
});

test('FPGA Architect test-run prompt forces a minimal compact validator-first manifest', () => {
  const testRunPrompt = buildFpgaArchitectTestRunPrompt({
    originalPrompt: 'base prompt',
    compactMode: 'minimal',
  });

  assert.match(testRunPrompt, /Test-Run Compact Generation Mode/i);
  assert.match(testRunPrompt, /strict end-to-end validator test with a local model/i);
  assert.match(testRunPrompt, /smallest complete project/i);
  assert.match(testRunPrompt, /The very first characters of your response must be exactly: "# PROJECT"/i);
  assert.match(testRunPrompt, /Generate only the minimal essential file set/i);
  assert.match(testRunPrompt, /Do not generate extra docs folders, requirements folders, architecture folders/i);
  assert.match(testRunPrompt, /Strict GHDL \/ VHDL rules:/i);
});

test('saveFpgaArchitectProject reuses an already-matching project root instead of nesting another sanitized folder', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'logicpro-fpga-save-'));
  const projectRoot = path.join(tempRoot, 'counter');
  await fs.mkdir(projectRoot, { recursive: true });

  const result = await saveFpgaArchitectProject({
    projectPath: projectRoot,
    project: {
      projectName: 'Counter',
      sanitizedProjectName: 'counter',
      topEntity: 'alu',
      vhdlStandard: 'VHDL-2008',
      targetFpga: null,
      summary: 'summary',
      assumptions: [],
      warnings: [],
      folderTree: 'src/',
      files: [
        {
          path: 'src/alu.vhd',
          fileType: 'vhdl_rtl',
          purpose: 'rtl',
          content: 'library ieee;\n',
        },
      ],
      ghdl: {
        analysisOrder: ['src/alu.vhd'],
        topTestbench: 'tb_alu',
        runCommands: ['ghdl -a --std=08 src/alu.vhd'],
        expectedResult: 'pass',
      },
      qualityChecklist: [],
    },
  });

  assert.equal(result.outputDirectory, projectRoot);
  assert.equal(result.savedFiles[0]?.path, path.join(projectRoot, 'src/alu.vhd'));
});
