export type FpgaSweepMode = 'repair_convergence' | 'clean_reproducibility';

export type FpgaPipelineConfig = {
  enabled: boolean;
  contractVersion: '2.0';
  semanticFrontend: boolean;
  stagedGeneration: boolean;
  appOwnedTestbench: boolean;
  transactionalRepair: boolean;
  synthesisQualityGate: boolean;
  stageGhdlValidation: boolean;
  defaultSweepMode: FpgaSweepMode;
  maxStageOutputChars: number;
};

function envBoolean(name: string, fallback: boolean) {
  const value = String(process.env[name] || '').trim().toLowerCase();
  if (!value) return fallback;
  return !['0', 'false', 'no', 'off'].includes(value);
}

function envPositiveInteger(name: string, fallback: number) {
  const parsed = Number.parseInt(String(process.env[name] || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getFpgaPipelineConfig(): FpgaPipelineConfig {
  const requestedSweepMode = String(process.env.FPGA_ARCHITECT_SWEEP_MODE || '').trim();
  return {
    enabled: envBoolean('FPGA_ARCHITECT_PIPELINE_V2', true),
    contractVersion: '2.0',
    semanticFrontend: envBoolean('FPGA_ARCHITECT_SEMANTIC_FRONTEND', true),
    stagedGeneration: envBoolean('FPGA_ARCHITECT_STAGED_GENERATION', true),
    appOwnedTestbench: envBoolean('FPGA_ARCHITECT_APP_OWNED_TB', true),
    transactionalRepair: envBoolean('FPGA_ARCHITECT_TRANSACTIONAL_REPAIR', true),
    synthesisQualityGate: envBoolean('FPGA_ARCHITECT_SYNTHESIS_GATE', true),
    stageGhdlValidation: envBoolean('FPGA_ARCHITECT_STAGE_GHDL', true),
    defaultSweepMode: requestedSweepMode === 'clean_reproducibility'
      ? 'clean_reproducibility'
      : 'repair_convergence',
    maxStageOutputChars: envPositiveInteger('FPGA_ARCHITECT_MAX_STAGE_OUTPUT_CHARS', 48_000),
  };
}
