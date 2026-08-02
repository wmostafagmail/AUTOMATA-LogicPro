import type express from 'express';
import {
  cancelVhdlLabRun,
  cancelVhdlLabTrainingRun,
  benchmarkVhdlLabCheckpoint,
  buildVhdlLabDatasetRelease,
  classifyVhdlLabFailure,
  createVhdlLabContract,
  createVhdlLabPromptOptimization,
  createVhdlLabRun,
  createVhdlLabTrainingRun,
  discoverOllamaModels,
  ensureVhdlLabStorage,
  finalizeVhdlLabBenchmarks,
  freezeVhdlLabContract,
  buildVhdlLabSweepPresetContracts,
  getVhdlLabDiagnostics,
  getVhdlLabConfig,
  getVhdlLabMlxLmAvailability,
  getVhdlLabWorkerSnapshot,
  promoteVhdlLabCheckpoint,
  promoteVhdlLabPromptVersion,
  queueVhdlLabBenchmark,
  queueVhdlLabPromptAbTest,
  readVhdlLabState,
  rejectVhdlLabPromptVersion,
  startVhdlLabWorker,
  validateVhdlContractDocument,
  VHDL_LAB_PROMOTION_STRICTNESS_PROFILES,
  vhdlLabPaths,
} from './vhdlImprovementLab';

type RouteContext = {
  getRequiredSession: (req: express.Request) => unknown;
};

function asyncHandler(handler: express.RequestHandler): express.RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function createVhdlImprovementLabRouteContext(params: RouteContext) {
  startVhdlLabWorker();

  const requireSession: express.RequestHandler = (req, _res, next) => {
    params.getRequiredSession(req);
    next();
  };

  const getOverviewHandler = asyncHandler(async (_req, res) => {
    await ensureVhdlLabStorage();
    await finalizeVhdlLabBenchmarks();
    const [state, diagnostics, trainingAvailability] = await Promise.all([
      readVhdlLabState(),
      getVhdlLabDiagnostics(),
      getVhdlLabMlxLmAvailability(),
    ]);
    const benchmarkRuns = (state.benchmarkRuns || []).map((benchmark) => {
      const childRuns = benchmark.childRunIds.map((id) => state.runs.find((run) => run.id === id)).filter(Boolean) as any[];
      if (childRuns.length === 0 && benchmark.suiteId.startsWith('checkpoint_adapter_generation')) {
        const results = Array.isArray(benchmark.summary?.results) ? benchmark.summary.results as any[] : [];
        const total = Number(benchmark.summary?.total || results.length || benchmark.contractIds.length || 0);
        const passed = Number(benchmark.summary?.passed || results.filter((result) => result?.passed === true).length || 0);
        const failed = Number(benchmark.summary?.failed || results.filter((result) => result?.passed === false).length || 0);
        const running = Number(benchmark.summary?.running || 0);
        return {
          ...benchmark,
          summary: {
            ...benchmark.summary,
            total,
            passed,
            failed,
            running,
            passRate: total ? passed / total : 0,
          },
        };
      }
      const passed = childRuns.filter((run) => run.status === 'ACCEPTED').length;
      const failed = childRuns.filter((run) => run.status === 'FAILED').length;
      const running = childRuns.filter((run) => ['QUEUED', 'PREPARING', 'GENERATING', 'EXTRACTING', 'VALIDATING_INTERFACE', 'VALIDATING_DEPENDENCIES', 'ANALYZING', 'GENERATING_TESTBENCH', 'ELABORATING', 'SYNTHESIZING', 'SIMULATING', 'REPAIRING'].includes(run.status)).length;
      const failureCategories = childRuns
        .filter((run) => run.status === 'FAILED')
        .reduce((acc: Record<string, number>, run) => {
          const latest = run.stageLog?.[run.stageLog.length - 1];
          const category = classifyVhdlLabFailure({ stage: latest?.stage || run.currentStage, message: latest?.message || '' });
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});
      return {
        ...benchmark,
        status: running > 0 ? 'RUNNING' : failed > 0 ? 'FAILED' : childRuns.length > 0 ? 'COMPLETED' : benchmark.status,
        summary: {
          ...benchmark.summary,
          total: childRuns.length,
          passed,
          failed,
          running,
          passRate: childRuns.length ? passed / childRuns.length : 0,
          failureCategories,
        },
      };
    });
    const recentRuns = state.runs.slice(0, 10).map((run) => {
      const contract = state.contracts.find((entry) => entry.id === run.contractId);
      const model = state.models.find((entry) => entry.id === run.modelProfileId);
      const acceptedArtifact = state.acceptedArtifacts.find((entry) => entry.runId === run.id);
      return {
        ...run,
        contractName: contract?.name || run.contractId,
        contractEntityName: contract?.entityName || null,
        modelName: model?.displayName || model?.modelIdentifier || null,
        latestEvent: run.stageLog[run.stageLog.length - 1] || null,
        stageLogTail: run.stageLog.slice(-8),
        acceptedArtifactPath: acceptedArtifact?.artifactPath || null,
        acceptedTestbenchPath: acceptedArtifact?.acceptedTestbenchPath || null,
        verificationStrength: acceptedArtifact?.verificationStrength || null,
        simulationRequired: acceptedArtifact?.simulationRequired ?? null,
        passMarkerRequired: acceptedArtifact?.passMarkerRequired ?? null,
      };
    });
    res.json({
      enabled: getVhdlLabConfig().enabled,
      dataRoot: getVhdlLabConfig().dataRoot,
      diagnostics,
      providers: state.providers,
      models: state.models,
      verificationProfiles: state.verificationProfiles,
      presetContracts: buildVhdlLabSweepPresetContracts(),
      promptTemplates: state.promptTemplates,
      promptVersions: state.promptVersions,
      recentContracts: state.contracts.slice(0, 10),
      recentRuns,
      failureClusters: state.failureClusters.slice(0, 20),
      datasetReleases: state.datasetReleases,
      trainingRuns: state.trainingRuns,
      trainingAvailability,
      benchmarkRuns,
      checkpoints: state.checkpoints || [],
      qualifiedAdapterSources: state.qualifiedAdapterSources || [],
      promotionStrictnessProfiles: VHDL_LAB_PROMOTION_STRICTNESS_PROFILES,
      artifactPaths: vhdlLabPaths(),
    });
  });

  const getProvidersHandler = asyncHandler(async (_req, res) => {
    const state = await readVhdlLabState();
    res.json({ providers: state.providers });
  });

  const createProviderHandler = asyncHandler(async (req, res) => {
    const state = await readVhdlLabState();
    const now = new Date().toISOString();
    const id = String(req.body?.id || `provider_${Date.now()}`).replace(/[^A-Za-z0-9_:-]/g, '_');
    const provider = {
      id,
      name: String(req.body?.name || id),
      providerType: req.body?.providerType || req.body?.provider_type || 'CUSTOM_OPENAI_COMPATIBLE',
      baseUrl: String(req.body?.baseUrl || req.body?.base_url || 'http://127.0.0.1:1234'),
      apiMode: req.body?.apiMode || req.body?.api_mode || 'OPENAI_CHAT_COMPLETIONS',
      enabled: req.body?.enabled !== false,
      capabilities: req.body?.capabilities || req.body?.capabilities_json || {},
      healthStatus: 'unknown' as const,
      lastHealthCheckAt: null,
      createdAt: now,
      updatedAt: now,
    };
    const nextState = { ...state, providers: [provider, ...state.providers.filter((entry) => entry.id !== id)] };
    const { writeVhdlLabState } = await import('./vhdlImprovementLab');
    await writeVhdlLabState(nextState);
    res.status(201).json({ provider });
  });

  const providerHealthHandler = asyncHandler(async (req, res) => {
    const state = await readVhdlLabState();
    const provider = state.providers.find((entry) => entry.id === req.params.id);
    if (!provider) {
      res.status(404).json({ error: `Provider ${req.params.id} was not found.` });
      return;
    }
    const { checkLmStudioHealth, checkOllamaHealth, writeVhdlLabState } = await import('./vhdlImprovementLab');
    const health = provider.providerType === 'OLLAMA'
      ? await checkOllamaHealth(provider)
      : provider.providerType === 'LM_STUDIO'
        ? await checkLmStudioHealth(provider)
        : { ok: true, status: 'unknown' as const, message: 'Health check for this provider type is capability-driven and not implemented yet.', models: [] };
    const at = new Date().toISOString();
    const providers = state.providers.map((entry) => entry.id === provider.id ? { ...entry, healthStatus: health.status, lastHealthCheckAt: at, updatedAt: at } : entry);
    await writeVhdlLabState({ ...state, providers });
    res.json(health);
  });

  const getModelsHandler = asyncHandler(async (_req, res) => {
    const state = await readVhdlLabState();
    res.json({ models: state.models });
  });

  const discoverModelsHandler = asyncHandler(async (_req, res) => {
    const result = await discoverOllamaModels();
    res.json(result);
  });

  const testModelHandler = asyncHandler(async (req, res) => {
    const state = await readVhdlLabState();
    const model = state.models.find((entry) => entry.id === req.params.id);
    if (!model) {
      res.status(404).json({ error: `Model ${req.params.id} was not found.` });
      return;
    }
    res.json({
      ok: true,
      model,
      message: 'Model profile is registered. Full generation smoke is intentionally routed through queued lab runs.',
    });
  });

  const getContractsHandler = asyncHandler(async (_req, res) => {
    const state = await readVhdlLabState();
    res.json({ contracts: state.contracts, presetContracts: buildVhdlLabSweepPresetContracts() });
  });

  const getPresetContractsHandler = asyncHandler(async (_req, res) => {
    res.json({ presetContracts: buildVhdlLabSweepPresetContracts() });
  });

  const createPresetContractHandler = asyncHandler(async (req, res) => {
    const preset = buildVhdlLabSweepPresetContracts().find((entry) => entry.id === req.params.id || entry.key === req.params.id);
    if (!preset) {
      res.status(404).json({ error: `Preset contract ${req.params.id} was not found.` });
      return;
    }
    const result = await createVhdlLabContract({
      name: preset.label,
      taskFamily: preset.taskFamily,
      contractJson: preset.contractJson,
      sourceType: 'fixture',
      sourceReference: preset.id,
    });
    res.status(result.ok ? 201 : 400).json(result);
  });

  const createContractHandler = asyncHandler(async (req, res) => {
    const result = await createVhdlLabContract({
      name: String(req.body?.name || req.body?.contractJson?.entity?.name || 'vhdl_contract'),
      taskFamily: String(req.body?.taskFamily || req.body?.task_family || 'VERIFIED_CORE_RTL'),
      contractJson: req.body?.contractJson || req.body?.contract_json || req.body,
      sourceType: req.body?.sourceType || req.body?.source_type || 'user',
      sourceReference: req.body?.sourceReference || req.body?.source_reference || null,
    });
    if (!result.ok) {
      res.status(400).json(result);
      return;
    }
    res.status(201).json(result);
  });

  const getContractHandler = asyncHandler(async (req, res) => {
    const state = await readVhdlLabState();
    const contract = state.contracts.find((entry) => entry.id === req.params.id);
    if (!contract) {
      res.status(404).json({ error: `Contract ${req.params.id} was not found.` });
      return;
    }
    res.json({ contract });
  });

  const validateContractHandler = asyncHandler(async (req, res) => {
    const state = await readVhdlLabState();
    const contract = state.contracts.find((entry) => entry.id === req.params.id);
    const validation = validateVhdlContractDocument(req.body?.contractJson || req.body?.contract_json || contract?.contractJson);
    res.status(validation.ok ? 200 : 400).json(validation);
  });

  const freezeContractHandler = asyncHandler(async (req, res) => {
    const result = await freezeVhdlLabContract(req.params.id);
    res.status(result.ok ? 200 : 400).json(result);
  });

  const diffContractHandler = asyncHandler(async (req, res) => {
    const state = await readVhdlLabState();
    const contract = state.contracts.find((entry) => entry.id === req.params.id);
    if (!contract) {
      res.status(404).json({ error: `Contract ${req.params.id} was not found.` });
      return;
    }
    res.json({ contractId: contract.id, version: contract.version, diff: [], message: 'Version diff is ready for future multi-version contract history.' });
  });

  const getRunsHandler = asyncHandler(async (_req, res) => {
    const state = await readVhdlLabState();
    res.json({ runs: state.runs });
  });

  const createRunHandler = asyncHandler(async (req, res) => {
    const result = await createVhdlLabRun({
      contractId: String(req.body?.contractId || req.body?.contract_id || ''),
      modelProfileId: req.body?.modelProfileId || req.body?.model_profile_id || null,
      promptVersionId: req.body?.promptVersionId || req.body?.prompt_version_id || null,
      runType: req.body?.runType || req.body?.run_type || 'RTL_GENERATION',
      candidateCount: Number(req.body?.candidateCount || req.body?.candidate_count || 1),
      maxRepairAttempts: Number(req.body?.maxRepairAttempts || req.body?.max_repair_attempts || 3),
      idempotencyKey: req.headers['idempotency-key'] ? String(req.headers['idempotency-key']) : undefined,
    });
    res.status(result.ok ? 201 : 400).json(result);
  });

  const getRunHandler = asyncHandler(async (req, res) => {
    const state = await readVhdlLabState();
    const run = state.runs.find((entry) => entry.id === req.params.id);
    if (!run) {
      res.status(404).json({ error: `Run ${req.params.id} was not found.` });
      return;
    }
    res.json({ run });
  });

  const cancelRunHandler = asyncHandler(async (req, res) => {
    const result = await cancelVhdlLabRun(req.params.id);
    res.status(result.ok ? 200 : 404).json(result);
  });

  const retryRunHandler = asyncHandler(async (req, res) => {
    const state = await readVhdlLabState();
    const run = state.runs.find((entry) => entry.id === req.params.id);
    if (!run) {
      res.status(404).json({ error: `Run ${req.params.id} was not found.` });
      return;
    }
    const result = await createVhdlLabRun({
      contractId: run.contractId,
      modelProfileId: run.modelProfileId,
      promptVersionId: run.promptVersionId,
      runType: run.runType,
      candidateCount: run.candidateCount,
      maxRepairAttempts: run.maxRepairAttempts,
    });
    res.status(result.ok ? 201 : 400).json(result);
  });

  const runEventsHandler = asyncHandler(async (req, res) => {
    const state = await readVhdlLabState();
    const run = state.runs.find((entry) => entry.id === req.params.id);
    if (!run) {
      res.status(404).json({ error: `Run ${req.params.id} was not found.` });
      return;
    }
    res.json({ events: run.stageLog });
  });

  const runArtifactsHandler = asyncHandler(async (req, res) => {
    const state = await readVhdlLabState();
    const run = state.runs.find((entry) => entry.id === req.params.id);
    if (!run) {
      res.status(404).json({ error: `Run ${req.params.id} was not found.` });
      return;
    }
    res.json({ runId: run.id, workspacePath: run.workspacePath, manifestPath: `${run.workspacePath}/manifest.json` });
  });

  const promptsHandler = asyncHandler(async (_req, res) => {
    const state = await readVhdlLabState();
    res.json({ promptTemplates: state.promptTemplates, promptVersions: state.promptVersions });
  });

  const promptVersionsHandler = asyncHandler(async (req, res) => {
    const state = await readVhdlLabState();
    res.json({ versions: state.promptVersions.filter((entry) => entry.templateId === req.params.id) });
  });

  const optimizePromptHandler = asyncHandler(async (req, res) => {
    const result = await createVhdlLabPromptOptimization({
      promptTemplateId: req.params.id,
      failureClusterId: req.body?.failureClusterId || req.body?.failure_cluster_id || null,
      changeReason: req.body?.changeReason || req.body?.change_reason,
    });
    res.status(result.ok ? 201 : 400).json(result);
  });

  const promptAbTestHandler = asyncHandler(async (req, res) => {
    const result = await queueVhdlLabPromptAbTest({
      baselinePromptVersionId: req.params.id,
      candidatePromptVersionIds: req.body?.candidatePromptVersionIds || req.body?.candidate_prompt_version_ids,
      contractIds: req.body?.contractIds || req.body?.contract_ids,
      modelProfileId: req.body?.modelProfileId || req.body?.model_profile_id || null,
      seedList: req.body?.seedList || req.body?.seed_list,
      maxRepairAttempts: Number(req.body?.maxRepairAttempts || req.body?.max_repair_attempts || 3),
    });
    res.status(result.ok ? 201 : 400).json(result);
  });

  const promotePromptHandler = asyncHandler(async (req, res) => {
    const result = await promoteVhdlLabPromptVersion(req.params.id);
    res.status(result.ok ? 200 : 404).json(result);
  });

  const rejectPromptHandler = asyncHandler(async (req, res) => {
    const result = await rejectVhdlLabPromptVersion(req.params.id);
    res.status(result.ok ? 200 : 404).json(result);
  });

  const notYetWorkerHandler = asyncHandler(async (_req, res) => {
    res.status(202).json({
      ok: true,
      status: 'queued_for_future_worker_phase',
      message: 'This endpoint is reserved by the VHDL Improvement Lab contract. The durable state and audit scaffolding are implemented; long-running execution is handled in the next worker phase.',
    });
  });

  const datasetsHandler = asyncHandler(async (_req, res) => {
    const state = await readVhdlLabState();
    res.json({ datasetReleases: state.datasetReleases });
  });

  const buildDatasetHandler = asyncHandler(async (req, res) => {
    const result = await buildVhdlLabDatasetRelease({
      name: req.body?.name,
      sourceRunIds: req.body?.sourceRunIds || req.body?.source_run_ids,
      sourceType: req.body?.sourceType || req.body?.source_type,
      maxLibraryRecords: req.body?.maxLibraryRecords || req.body?.max_library_records,
    });
    res.status(result.ok ? 201 : 400).json(result);
  });

  const datasetDetailHandler = asyncHandler(async (req, res) => {
    const state = await readVhdlLabState();
    const release = state.datasetReleases.find((entry) => entry.id === req.params.id);
    if (!release) {
      res.status(404).json({ error: `Dataset release ${req.params.id} was not found.` });
      return;
    }
    res.json({ release });
  });

  const datasetAuditHandler = asyncHandler(async (req, res) => {
    const state = await readVhdlLabState();
    const release = state.datasetReleases.find((entry) => entry.id === req.params.id);
    if (!release) {
      res.status(404).json({ error: `Dataset release ${req.params.id} was not found.` });
      return;
    }
    res.json({ ok: release.status === 'BUILT', audit: release.audit, release });
  });

  const datasetFreezeHandler = asyncHandler(async (req, res) => {
    const state = await readVhdlLabState();
    const found = state.datasetReleases.some((entry) => entry.id === req.params.id);
    if (!found) {
      res.status(404).json({ error: `Dataset release ${req.params.id} was not found.` });
      return;
    }
    const datasetReleases = state.datasetReleases.map((entry) => entry.id === req.params.id ? { ...entry, frozenAt: entry.frozenAt || new Date().toISOString() } : entry);
    const { writeVhdlLabState } = await import('./vhdlImprovementLab');
    await writeVhdlLabState({ ...state, datasetReleases });
    res.json({ ok: true, release: datasetReleases.find((entry) => entry.id === req.params.id) });
  });

  const datasetDownloadHandler = asyncHandler(async (req, res) => {
    const state = await readVhdlLabState();
    const release = state.datasetReleases.find((entry) => entry.id === req.params.id);
    if (!release) {
      res.status(404).json({ error: `Dataset release ${req.params.id} was not found.` });
      return;
    }
    res.download(`${release.datasetPath}/records.jsonl`);
  });

  const trainingRunsHandler = asyncHandler(async (_req, res) => {
    const state = await readVhdlLabState();
    res.json({ trainingRuns: state.trainingRuns });
  });

  const createTrainingRunHandler = asyncHandler(async (req, res) => {
    const result = await createVhdlLabTrainingRun({
      datasetReleaseId: String(req.body?.datasetReleaseId || req.body?.dataset_release_id || ''),
      baseModel: req.body?.baseModel || req.body?.base_model,
      adapterName: req.body?.adapterName || req.body?.adapter_name,
      config: req.body?.config || {},
    });
    res.status(result.ok ? 201 : 400).json(result);
  });

  const getTrainingRunHandler = asyncHandler(async (req, res) => {
    const state = await readVhdlLabState();
    const trainingRun = state.trainingRuns.find((entry) => entry.id === req.params.id);
    if (!trainingRun) {
      res.status(404).json({ error: `Training run ${req.params.id} was not found.` });
      return;
    }
    res.json({ trainingRun });
  });

  const cancelTrainingRunHandler = asyncHandler(async (req, res) => {
    const result = await cancelVhdlLabTrainingRun(req.params.id);
    res.status(result.ok ? 200 : 404).json(result);
  });

  const trainingCheckpointsHandler = asyncHandler(async (req, res) => {
    const state = await readVhdlLabState();
    res.json({ checkpoints: (state.checkpoints || []).filter((entry) => entry.trainingRunId === req.params.id) });
  });

  const benchmarkCheckpointHandler = asyncHandler(async (req, res) => {
    const result = await benchmarkVhdlLabCheckpoint(req.params.id, {
      suiteId: req.body?.suiteId || req.body?.suite_id || null,
      contractIds: req.body?.contractIds || req.body?.contract_ids || null,
      maxRepairAttempts: Number(req.body?.maxRepairAttempts || req.body?.max_repair_attempts || 3),
    });
    res.status(result.ok ? 201 : 404).json(result);
  });

  const promotionBenchmarkCheckpointHandler = asyncHandler(async (req, res) => {
    const promotionStrictness = req.body?.promotionStrictness || req.body?.promotion_strictness || {
      profileId: req.body?.promotionStrictnessProfileId || req.body?.promotion_strictness_profile_id,
      overrides: req.body?.promotionStrictnessOverrides || req.body?.promotion_strictness_overrides,
    };
    const result = await benchmarkVhdlLabCheckpoint(req.params.id, {
      suiteId: 'adapter_promotion_holdout',
      contractIds: req.body?.contractIds || req.body?.contract_ids || null,
      maxRepairAttempts: Number(req.body?.maxRepairAttempts || req.body?.max_repair_attempts || 3),
      promotionStrictness,
    });
    res.status(result.ok ? 201 : 404).json(result);
  });

  const promoteCheckpointHandler = asyncHandler(async (req, res) => {
    const result = await promoteVhdlLabCheckpoint(req.params.id);
    res.status(result.ok ? 200 : 400).json(result);
  });

  const queueBenchmarkHandler = asyncHandler(async (req, res) => {
    const result = await queueVhdlLabBenchmark({
      suiteId: req.body?.suiteId || req.body?.suite_id,
      contractIds: req.body?.contractIds || req.body?.contract_ids,
      modelProfileId: req.body?.modelProfileId || req.body?.model_profile_id || null,
      promptVersionId: req.body?.promptVersionId || req.body?.prompt_version_id || null,
      seedList: req.body?.seedList || req.body?.seed_list,
      maxRepairAttempts: Number(req.body?.maxRepairAttempts || req.body?.max_repair_attempts || 3),
    });
    res.status(result.ok ? 201 : 400).json(result);
  });

  const diagnosticsHandler = asyncHandler(async (_req, res) => {
    res.json(await getVhdlLabDiagnostics());
  });

  const selfTestHandler = asyncHandler(async (_req, res) => {
    await ensureVhdlLabStorage();
    res.json({ ok: true, diagnostics: await getVhdlLabDiagnostics() });
  });

  const workerStatusHandler = asyncHandler(async (_req, res) => {
    const diagnostics = await getVhdlLabDiagnostics();
    res.json({ worker: diagnostics.worker, snapshot: getVhdlLabWorkerSnapshot() });
  });

  return {
    requireSession,
    getOverviewHandler,
    getProvidersHandler,
    createProviderHandler,
    providerHealthHandler,
    getModelsHandler,
    discoverModelsHandler,
    testModelHandler,
    getContractsHandler,
    getPresetContractsHandler,
    createPresetContractHandler,
    createContractHandler,
    getContractHandler,
    validateContractHandler,
    freezeContractHandler,
    diffContractHandler,
    getRunsHandler,
    createRunHandler,
    getRunHandler,
    cancelRunHandler,
    retryRunHandler,
    runEventsHandler,
    runArtifactsHandler,
    promptsHandler,
    promptVersionsHandler,
    optimizePromptHandler,
    promptAbTestHandler,
    promotePromptHandler,
    rejectPromptHandler,
    notYetWorkerHandler,
    datasetsHandler,
    buildDatasetHandler,
    datasetDetailHandler,
    datasetAuditHandler,
    datasetFreezeHandler,
    datasetDownloadHandler,
    trainingRunsHandler,
    createTrainingRunHandler,
    getTrainingRunHandler,
    cancelTrainingRunHandler,
    trainingCheckpointsHandler,
    benchmarkCheckpointHandler,
    promotionBenchmarkCheckpointHandler,
    promoteCheckpointHandler,
    queueBenchmarkHandler,
    diagnosticsHandler,
    selfTestHandler,
    workerStatusHandler,
  };
}
