import type { FpgaArchitectProject } from './fpgaArchitect';
import { parseVhdlSemanticModel } from './vhdlSemanticFrontend';

export type FpgaVhdlQualityReport = {
  vhdlFileCount: number;
  entityCount: number;
  packageCount: number;
  architectureCount: number;
  directInstanceCount: number;
  sourceLines: number;
  processCount: number;
  assertionCount: number;
  placeholderCount: number;
  score: number;
};

export function buildFpgaVhdlQualityReport(project: FpgaArchitectProject): FpgaVhdlQualityReport {
  const vhdlFiles = project.files.filter((file) => /\.vhdl?$/i.test(file.path));
  const models = vhdlFiles.map((file) => parseVhdlSemanticModel(file.content));
  const source = vhdlFiles.map((file) => file.content).join('\n');
  const sourceLines = vhdlFiles.reduce((total, file) => total + file.content.split(/\r?\n/).length, 0);
  const placeholderCount = (source.match(/\b(?:todo|tbd|placeholder|model_implementation)\b/gi) || []).length;
  const processCount = (source.match(/\bprocess\s*(?:\(|is|begin)/gi) || []).length;
  const assertionCount = (source.match(/\b(?:assert|report)\b/gi) || []).length;
  const structuralScore = Math.min(50, models.reduce((total, model) => total + model.entities.length * 5 + model.packages.length * 3 + model.architectures.length * 5 + model.architectures.reduce((sum, architecture) => sum + architecture.instances.length * 2, 0), 0));
  const verificationScore = Math.min(30, assertionCount * 3);
  const hygieneScore = Math.max(0, 20 - placeholderCount * 10);
  return {
    vhdlFileCount: vhdlFiles.length,
    entityCount: models.reduce((total, model) => total + model.entities.length, 0),
    packageCount: models.reduce((total, model) => total + model.packages.filter((entry) => !entry.isBody).length, 0),
    architectureCount: models.reduce((total, model) => total + model.architectures.length, 0),
    directInstanceCount: models.reduce((total, model) => total + model.architectures.reduce((sum, architecture) => sum + architecture.instances.length, 0), 0),
    sourceLines,
    processCount,
    assertionCount,
    placeholderCount,
    score: structuralScore + verificationScore + hygieneScore,
  };
}
