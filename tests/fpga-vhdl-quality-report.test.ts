import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFpgaVhdlQualityReport } from '../src/server/fpgaVhdlQualityReport';
import type { FpgaArchitectProject } from '../src/server/fpgaArchitect';

test('quality report measures semantic structure and penalizes placeholders', () => {
  const project: FpgaArchitectProject = {
    projectName: 'gate', sanitizedProjectName: 'gate', topEntity: 'gate', vhdlStandard: '08', targetFpga: null, summary: '', assumptions: [], warnings: [], folderTree: '',
    files: [{ path: 'src/gate.vhd', fileType: 'vhdl_rtl', purpose: '', content: 'entity gate is end entity; architecture rtl of gate is begin -- TODO\nend architecture;'}],
    ghdl: { analysisOrder: ['src/gate.vhd'], topTestbench: 'tb_gate', runCommands: [], expectedResult: 'TEST PASSED' }, qualityChecklist: [],
  };
  const report = buildFpgaVhdlQualityReport(project);
  assert.equal(report.entityCount, 1);
  assert.equal(report.architectureCount, 1);
  assert.equal(report.placeholderCount, 1);
  assert.ok(report.score < 100);
});
