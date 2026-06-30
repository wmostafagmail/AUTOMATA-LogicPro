import type { LogicProSession, createSessionManager } from './sessionManager';
import type { AiMacroId, TbGenerationMode } from '../aiMacros';
import { detectCustomQueryMode, type CustomQueryMode } from '../customQueryIntent';

type SessionManager = ReturnType<typeof createSessionManager>;

type AnalyzerSignal = {
  id?: string;
  name?: string;
  type?: string;
  values?: Array<number | string>;
};

type HazardScanResult = {
  markdown: string;
  findings: Array<{
    severity: 'high' | 'medium' | 'low';
    title: string;
    detail: string;
    signalNames: string[];
    startTick: number | null;
    endTick: number | null;
    relatedTicks: number[];
  }>;
};

type ProtocolScanResult = {
  markdown: string;
  frames: Array<{
    protocol: 'SPI' | 'I2C' | 'UART';
    channel: string;
    startTick: number;
    endTick: number;
    summary: string;
    detail: string;
  }>;
};

type MacroDiagnostics = {
  rootEntity: string;
  reachableEntities: string[];
  entityHierarchy: Array<{
    parent: string;
    child: string;
    instanceLabel: string;
  }>;
  entityDepths: Record<string, number>;
  entityRoles: Record<string, string>;
  focusEntities: string[];
  desiredCategories: string[];
  semanticConfidence: number;
  selectionNotes: string[];
  visibleSignalsSent: number;
  totalSignalsAvailable: number;
  selectedSignals: Array<{
    displayKey: string;
    signal: string;
    normalizedSignal: string;
    score: number;
    activityScore: number;
    categories: string[];
    entities: string[];
    relatedNodes: string[];
  }>;
};

type ProjectContext = {
  name?: string;
  fileCount?: number;
  filePaths?: string[];
  excerpts?: Array<{
    path?: string;
    content?: string;
  }>;
};

export async function prepareAiAnalyzeRequest(params: {
  provider: unknown;
  signals: unknown;
  query: string;
  model: unknown;
  timeUnit: unknown;
  tickDuration: unknown;
  projectContext: unknown;
  projectPath: unknown;
  workspaceFileName: unknown;
  simulationMacroContext: unknown;
  macroId: AiMacroId;
  session: LogicProSession;
  sessionManager: SessionManager;
  getProviderDeployment: (provider: string) => 'local' | 'remote';
  requiresRemoteExportConsent: (provider: string) => boolean;
  assertApprovedProjectPath: (session: LogicProSession, candidatePath: string, label?: string) => Promise<string>;
  analyzeWaveformHazards: (signals: AnalyzerSignal[], tickDuration: number, timeUnit: string) => HazardScanResult;
  analyzeProtocolFrames: (signals: AnalyzerSignal[], tickDuration: number, timeUnit: string) => ProtocolScanResult;
  getAiMacroSpec: (macroId: AiMacroId) => { label: string; generatedArtifactDirectory?: string | null };
  getOrBuildMacroSignalIndex: (params: {
    projectPath: string;
    rootEntity: string;
    sourcePaths: string[];
  }) => Promise<any>;
  selectMacroSignals: (params: { macroId: AiMacroId; signals: AnalyzerSignal[]; index: any }) => {
    selectedSignals: AnalyzerSignal[];
    selectedSignalInsights: MacroDiagnostics['selectedSignals'];
    focusEntities: string[];
    desiredCategories: string[];
  };
  getSignalName: (signal: AnalyzerSignal) => string;
  formatSignalValue: (value: number | string) => string;
  buildSignalTransitionSummary: (values: Array<number | string>) => string;
  buildProjectContextFromPath: (projectPath: string, query: string, workspaceFileName?: string | null) => Promise<ProjectContext | null>;
  scrubProjectContextForRemoteExport: (context: ProjectContext | null) => {
    context: ProjectContext | null;
    redactionNotes: string[];
  } | null;
  buildMacroPromptContract: (params: {
    macroId: AiMacroId;
    userQuery: string;
    tbGenerationMode: TbGenerationMode | null;
  }) => string;
  skipRemoteExportConsentCheck?: boolean;
}) {
  const {
    provider,
    signals,
    query,
    model,
    timeUnit,
    tickDuration,
    projectContext,
    projectPath,
    workspaceFileName,
    simulationMacroContext,
    macroId,
    session,
    sessionManager,
    getProviderDeployment,
    requiresRemoteExportConsent,
    assertApprovedProjectPath,
    analyzeWaveformHazards,
    analyzeProtocolFrames,
    getAiMacroSpec,
    getOrBuildMacroSignalIndex,
    selectMacroSignals,
    getSignalName,
    formatSignalValue,
    buildSignalTransitionSummary,
    buildProjectContextFromPath,
    scrubProjectContextForRemoteExport,
    buildMacroPromptContract,
    skipRemoteExportConsentCheck = false,
  } = params;

  const resolvedTickDuration = Number.isFinite(Number(tickDuration)) ? Number(tickDuration) : 1;
  const resolvedTimeUnit = typeof timeUnit === 'string' && timeUnit.trim() ? timeUnit : 'ns';
  const selectedProvider = typeof provider === 'string' && provider.trim()
    ? provider.trim()
    : '';
  if (!selectedProvider) {
    const error = new Error('Provider is required. Select an AI provider before running analysis.');
    (error as any).statusCode = 400;
    (error as any).details = {
      macroId,
      provider: selectedProvider,
    };
    throw error;
  }
  const selectedModel = typeof model === 'string' && model.trim()
    ? model.trim()
    : '';
  const providerDeployment = getProviderDeployment(selectedProvider);

  if (!skipRemoteExportConsentCheck && requiresRemoteExportConsent(selectedProvider) && !sessionManager.hasRemoteExportConsent(session, selectedProvider)) {
    const error = new Error(`Remote provider export is disabled for ${selectedProvider}. Enable explicit consent in the AI drawer before sending waveform or project context off-machine.`);
    (error as any).statusCode = 403;
    (error as any).details = {
      macroId,
      provider: selectedProvider,
      deployment: providerDeployment,
    };
    throw error;
  }

  const allSignals = Array.isArray(signals) ? signals as AnalyzerSignal[] : [];
  const customQueryMode: CustomQueryMode | null = macroId === 'custom_query'
    ? detectCustomQueryMode(query)
    : null;
  const shouldUseWaveformContext = macroId !== 'custom_query' || customQueryMode !== 'general_design';

  const hazardScan = shouldUseWaveformContext
    ? analyzeWaveformHazards(allSignals, resolvedTickDuration, resolvedTimeUnit)
    : {
        markdown: '',
        findings: [],
      };
  const protocolScan = shouldUseWaveformContext
    ? analyzeProtocolFrames(allSignals, resolvedTickDuration, resolvedTimeUnit)
    : {
        markdown: '',
        frames: [],
      };

  let normalizedProjectPath = '';
  let projectPathUnavailableReason = '';
  if (typeof projectPath === 'string' && projectPath.trim()) {
    try {
      normalizedProjectPath = await assertApprovedProjectPath(session, projectPath.trim());
    } catch (projectPathError: any) {
      projectPathUnavailableReason = projectPathError?.message || String(projectPathError);
    }
  }

  const macroSpec = getAiMacroSpec(macroId);
  const artifactDirectory = macroSpec.generatedArtifactDirectory || null;
  if (artifactDirectory && !normalizedProjectPath) {
    throw new Error(
      projectPathUnavailableReason
        || `${macroSpec.label} requires an opened project folder so the generated .vhd files can be saved into "${artifactDirectory}".`
    );
  }

  const simulationRootEntity = typeof (simulationMacroContext as any)?.rootEntity === 'string' && (simulationMacroContext as any).rootEntity.trim()
    ? (simulationMacroContext as any).rootEntity.trim()
    : '';
  const simulationSourcePaths = Array.isArray((simulationMacroContext as any)?.sourcePaths)
    ? (simulationMacroContext as any).sourcePaths.filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
    : [];

  let macroSignalIndex: any = null;
  let selectedSignals = allSignals;
  let waveformSelectionText = '';
  let macroDiagnostics: MacroDiagnostics | null = null;

  if (shouldUseWaveformContext && normalizedProjectPath && simulationRootEntity && allSignals.length > 0) {
    try {
      macroSignalIndex = await getOrBuildMacroSignalIndex({
        projectPath: normalizedProjectPath,
        rootEntity: simulationRootEntity,
        sourcePaths: simulationSourcePaths,
      });
      const signalSelection = selectMacroSignals({
        macroId,
        signals: allSignals,
        index: macroSignalIndex,
      });
      if (signalSelection.selectedSignals.length > 0) {
        selectedSignals = signalSelection.selectedSignals;
      }
      const roleCounts = Object.values(macroSignalIndex.entityRoles).reduce<Record<string, number>>((acc, role) => {
        const normalizedRole = typeof role === 'string' ? role : 'unknown';
        acc[normalizedRole] = (acc[normalizedRole] || 0) + 1;
        return acc;
      }, {});
      const selectedWithInsights = signalSelection.selectedSignalInsights.filter((signal) => signal.entities.length > 0 || signal.categories.length > 0).length;
      const semanticConfidence = selectedSignals.length > 0
        ? Math.round((selectedWithInsights / selectedSignals.length) * 100)
        : 0;
      const selectionNotes = [
        `selected ${selectedSignals.length} of ${allSignals.length} visible signals for ${macroId}`,
        `reachable entities: ${macroSignalIndex.reachableEntities.length}`,
        `entity roles observed: ${Object.entries(roleCounts).map(([role, count]) => `${role}=${count}`).join(', ') || 'none'}`,
      ];
      if (selectedWithInsights < selectedSignals.length) {
        selectionNotes.push(`some selected signals did not resolve to strong semantic insights (${selectedWithInsights}/${selectedSignals.length})`);
      }
      macroDiagnostics = {
        rootEntity: macroSignalIndex.rootEntity,
        reachableEntities: macroSignalIndex.reachableEntities,
        entityHierarchy: macroSignalIndex.entityHierarchy,
        entityDepths: macroSignalIndex.entityDepths,
        entityRoles: macroSignalIndex.entityRoles,
        focusEntities: signalSelection.focusEntities,
        desiredCategories: signalSelection.desiredCategories,
        semanticConfidence,
        selectionNotes,
        visibleSignalsSent: selectedSignals.length,
        totalSignalsAvailable: allSignals.length,
        selectedSignals: signalSelection.selectedSignalInsights,
      };

      waveformSelectionText += `### Macro Signal Selection\n`;
      waveformSelectionText += `Simulation Root: ${macroSignalIndex.rootEntity}\n`;
      waveformSelectionText += `Reachable Entities: ${macroSignalIndex.reachableEntities.join(', ') || 'none'}\n`;
      waveformSelectionText += `Entity Roles: ${Object.entries(macroSignalIndex.entityRoles).map(([entityName, role]) => `${entityName}:${role}`).join(', ') || 'none'}\n`;
      waveformSelectionText += `Macro Focus Entities: ${signalSelection.focusEntities.join(', ') || macroSignalIndex.rootEntity}\n`;
      waveformSelectionText += `Selection Categories: ${signalSelection.desiredCategories.join(', ')}\n`;
      waveformSelectionText += `Semantic Confidence: ${semanticConfidence}%\n`;
      waveformSelectionText += `Relevant Signals: ${selectedSignals.map((signal) => getSignalName(signal)).join(', ') || 'none'}\n\n`;
      waveformSelectionText += `### Signal Relevance Hints\n`;
      signalSelection.selectedSignalInsights.forEach((insight) => {
        waveformSelectionText += `- ${insight.signal}`;
        waveformSelectionText += ` | categories: ${insight.categories.join(', ') || 'uncategorized'}`;
        waveformSelectionText += ` | entities: ${insight.entities.join(', ') || macroSignalIndex?.rootEntity || 'unknown'}`;
        waveformSelectionText += ` | related nodes: ${insight.relatedNodes.slice(0, 8).join(', ') || insight.normalizedSignal}`;
        waveformSelectionText += ` | activity score: ${insight.activityScore}\n`;
      });
      waveformSelectionText += '\n';
    } catch (selectionError: any) {
      waveformSelectionText += `### Macro Signal Selection\n`;
      waveformSelectionText += `Selection fallback: full waveform set used because semantic filtering failed: ${selectionError?.message || String(selectionError)}\n\n`;
    }
  }

  let waveformText = '';
  if (shouldUseWaveformContext) {
    waveformText = '### Captured Waves Log:\n';
    waveformText += `Time Base Unit: ${tickDuration} ${timeUnit} per tick\n`;
    waveformText += `Visible Signals Sent: ${selectedSignals.length}/${allSignals.length}\n\n`;
    waveformText += waveformSelectionText;

    if (selectedSignals.length > 0) {
      selectedSignals.forEach((sig: AnalyzerSignal) => {
        waveformText += `Signal Channel: ${sig.name} | Type: ${sig.type}\n`;
        const sampleValues = Array.isArray(sig.values) ? sig.values.slice(0, 120) : [];
        waveformText += `Ticks (0-120): ${sampleValues.map((value) => formatSignalValue(value)).join('')}\n`;
        waveformText += `Transition Summary: ${buildSignalTransitionSummary(Array.isArray(sig.values) ? sig.values : [])}\n\n`;
      });
    }
  }

  let projectText = '';
  let resolvedProjectContext = projectContext;
  let exportPolicyText = '';

  if (
    (!resolvedProjectContext || typeof resolvedProjectContext !== 'object')
    && normalizedProjectPath
    && providerDeployment === 'local'
  ) {
    resolvedProjectContext = await buildProjectContextFromPath(
      normalizedProjectPath,
      query,
      typeof workspaceFileName === 'string' ? workspaceFileName : null
    );
  }
  if ((!resolvedProjectContext || typeof resolvedProjectContext !== 'object') && projectPathUnavailableReason) {
    projectText += `### Project Workspace Context\n`;
    projectText += `Server-side project file enrichment skipped: ${projectPathUnavailableReason}\n\n`;
  }

  if (providerDeployment === 'remote') {
    const scrubbed = scrubProjectContextForRemoteExport(
      resolvedProjectContext && typeof resolvedProjectContext === 'object'
        ? resolvedProjectContext as ProjectContext
        : null
    );
    resolvedProjectContext = scrubbed?.context || null;
    if (scrubbed && scrubbed.redactionNotes.length > 0) {
      exportPolicyText += `### Remote Export Policy\n`;
      exportPolicyText += `Provider deployment: remote\n`;
      exportPolicyText += `Project context was scrubbed before export. Redaction notes:\n`;
      exportPolicyText += `${scrubbed.redactionNotes.map((note) => `- ${note}`).join('\n')}\n\n`;
    }
  }

  if (resolvedProjectContext && typeof resolvedProjectContext === 'object') {
    const projectName = typeof (resolvedProjectContext as ProjectContext).name === 'string' ? (resolvedProjectContext as ProjectContext).name : 'Selected project';
    const fileCount = Number.isFinite((resolvedProjectContext as ProjectContext).fileCount) ? Number((resolvedProjectContext as ProjectContext).fileCount) : 0;
    const filePaths = Array.isArray((resolvedProjectContext as ProjectContext).filePaths) ? (resolvedProjectContext as ProjectContext).filePaths!.slice(0, 80) : [];
    const excerpts = Array.isArray((resolvedProjectContext as ProjectContext).excerpts) ? (resolvedProjectContext as ProjectContext).excerpts!.slice(0, 8) : [];

    projectText += `### Project Workspace Context\n`;
    projectText += `Project Name: ${projectName}\n`;
    projectText += `Project File Count: ${fileCount}\n`;
    if (filePaths.length > 0) {
      projectText += `Project Files:\n${filePaths.map((filePath: string) => `- ${filePath}`).join('\n')}\n\n`;
    }

    excerpts.forEach((excerpt) => {
      if (typeof excerpt?.path !== 'string' || typeof excerpt?.content !== 'string') {
        return;
      }
      projectText += `File Excerpt: ${excerpt.path}\n`;
      projectText += `${excerpt.content}\n\n`;
    });
  }

  const systemPrompt = shouldUseWaveformContext
    ? `You are a professional ASIC/FPGA digital design engineer, embedding systems developer, and veteran hardware logic analyzer debugger.
You are assisting a developer using "Signal Logic Pro" logic waveforms.
Review the following timing diagram traces captured by the logic analyzer and answer the developer's question.

${waveformText}
${protocolScan.markdown}

${hazardScan.markdown}

${exportPolicyText}${projectText}

Return your explanation in beautifully formatted markdown with clear sections. Prefer VHDL for any HDL examples, RTL, or testbenches unless the developer explicitly asks for Verilog. You may also write C drivers or testbench setups when requested. Address timing delay offsets, race conditions, edge setup/hold times, glitches, active-low triggers, or decoded ASCII bytes. Make your answer highly detailed, technical, and constructive.

When the prompt includes "Macro Signal Selection" and "Signal Relevance Hints", treat those as the primary hierarchy-aware view of the design. Use the focus entities and related nodes to explain why each selected signal matters to the requested macro.`
    : `You are a professional ASIC/FPGA digital design engineer and embedded systems developer.
You are assisting a developer using "Signal Logic Pro".
The developer is asking a general FPGA/VHDL design question, not a waveform-debug question.

${exportPolicyText}${projectText}

Answer the developer's question directly and do not force waveform decoding, protocol interpretation, or logic-analyzer findings unless the user explicitly asked for them. Prefer VHDL for any HDL examples, RTL, or testbenches unless the developer explicitly asks for Verilog. Keep the answer technical, constructive, and grounded in any relevant project context that was provided.`;

  return {
    selectedProvider,
    selectedModel,
    providerDeployment,
    resolvedTickDuration,
    resolvedTimeUnit,
    hazardScan,
    protocolScan,
    allSignals,
    selectedSignals,
    normalizedProjectPath,
    projectPathUnavailableReason,
    macroSpec,
    artifactDirectory,
    simulationRootEntity,
    simulationSourcePaths,
    macroSignalIndex,
    macroDiagnostics,
    waveformText,
    projectText,
    exportPolicyText,
    customQueryMode,
    systemPrompt,
    buildMacroPromptContract,
  };
}

export type PreparedAiAnalyzeRequest = Awaited<ReturnType<typeof prepareAiAnalyzeRequest>>;
