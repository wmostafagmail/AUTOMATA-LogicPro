import { ChangeEvent, useState, useMemo, useEffect, useRef } from 'react';
import { GhdlProjectInfo, GhdlSourceFile, GhdlStatus, ProjectFileEntry, Signal, SimulationMacroContextPayload } from './types';
import { PRESETS } from './data';
import { runSimulationEvaluations } from './utils';
import { parseImportedWaveform } from './workspaceFile';
import { apiFetch } from './api';
import { fetchGhdlModalData, installGhdl, runGhdl } from './app/ghdlClient';
import { useFloatingWindow } from './hooks/useFloatingWindow';
import { useWaveformIssueMarkers } from './hooks/useWaveformIssueMarkers';
import {
  clearStoredProjectSelection,
  isProjectApprovalErrorMessage,
  loadStoredProjectSelection,
  saveProjectSelection,
} from './app/projectPersistence';

// Components
import { Toolbar } from './components/Toolbar';
import { SignalSidebar } from './components/SignalSidebar';
import { WaveformViewport } from './components/WaveformViewport';
import { AIDrawer } from './components/AIDrawer';
import { AIBottomDrawer, AIAnalysisContent } from './components/AIBottomDrawer';
import { AIDiagramContent } from './components/AIDiagramViewer';
import { AIWorkspaceReport } from './aiReport';
import {
  Wrench,
  X,
  Copy,
  Check,
  AlertCircle,
  FolderOpen,
  Play,
  Loader2,
  Maximize2,
  Minimize2
} from 'lucide-react';

const DEFAULT_LEFT_WORKSPACE_BOTTOM_GAP_PX = 214;
const DEFAULT_AI_OUTPUT_WINDOW_BOUNDS = {
  left: 0,
  top: 0,
  width: 1020,
  height: 760,
};
const DEFAULT_AI_DIAGRAM_WINDOW_BOUNDS = {
  left: 0,
  top: 0,
  width: 1120,
  height: 720,
};
const GHDL_INSTALL_CONFIRMATION_TEXT = 'INSTALL GHDL';

export default function App() {
  type MarkerFamily = 'hazard' | 'protocol' | 'clockReset' | 'fsm';
  // 1. Core workspace timing configuration states
  const [simulationLength, setSimulationLength] = useState(200);
  const [timeUnit, setTimeUnit] = useState<'ns' | 'us' | 'ms' | 's'>('ns');
  const [tickDuration, setTickDuration] = useState(5);
  const [activePresetId, setActivePresetId] = useState('spi_debug');
  
  // 2. Waveform View configuration states
  const [zoom, setZoom] = useState(1.4);
  const tickWidth = useMemo(() => Math.round(10 * zoom), [zoom]);

  // Loaded primary signals
  const [signals, setSignals] = useState<Signal[]>([]);

  // 3. Markers and measurements states
  const [cursorA, setCursorA] = useState<number | null>(25);
  const [cursorB, setCursorB] = useState<number | null>(89);
  // 4. Panel drawer toggles
  const [aiDrawerOpen, setAiDrawerOpen] = useState(true);
  const [glitchInjectionEnabled, setGlitchInjectionEnabled] = useState(false);
  const [showVcdModal, setShowVcdModal] = useState(false);
  const [showGhdlModal, setShowGhdlModal] = useState(false);
  const [vcdText, setVcdText] = useState('');
  const [vcdCopied, setVcdCopied] = useState(false);
  const [ghdlStatus, setGhdlStatus] = useState<GhdlStatus | null>(null);
  const [ghdlProjectInfo, setGhdlProjectInfo] = useState<GhdlProjectInfo | null>(null);
  const [ghdlTopEntity, setGhdlTopEntity] = useState('');
  const [ghdlSelectedSourcePaths, setGhdlSelectedSourcePaths] = useState<string[]>([]);
  const [ghdlStopTime, setGhdlStopTime] = useState('1us');
  const [ghdlBusy, setGhdlBusy] = useState(false);
  const [ghdlInstalling, setGhdlInstalling] = useState(false);
  const [ghdlLogs, setGhdlLogs] = useState('');
  const [ghdlJobStatus, setGhdlJobStatus] = useState<string | null>(null);
  const [ghdlJobStartedAt, setGhdlJobStartedAt] = useState<number | null>(null);
  const [ghdlElapsedSeconds, setGhdlElapsedSeconds] = useState(0);
  const [ghdlInstallConfirmationInput, setGhdlInstallConfirmationInput] = useState('');
  const [workspaceFileName, setWorkspaceFileName] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [projectDirectoryName, setProjectDirectoryName] = useState('Select Project Folder');
  const [projectDirectoryPath, setProjectDirectoryPath] = useState<string | null>(null);
  const [projectFileCount, setProjectFileCount] = useState(0);
  const [projectFiles, setProjectFiles] = useState<ProjectFileEntry[]>([]);
  const [leftWorkspaceBottomGapPx, setLeftWorkspaceBottomGapPx] = useState(DEFAULT_LEFT_WORKSPACE_BOTTOM_GAP_PX);
  const [latestAiReport, setLatestAiReport] = useState<AIWorkspaceReport | null>(null);
  const [selectedIssueMarkerId, setSelectedIssueMarkerId] = useState<string | null>(null);
  const [issuePanelDismissed, setIssuePanelDismissed] = useState(false);
  const [issueFocusRequestKey, setIssueFocusRequestKey] = useState(0);
  const [hazardSeverityFilter, setHazardSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [markerDisplayLimit, setMarkerDisplayLimit] = useState<'all' | 25 | 50 | 100>('all');
  const [markerFamilyVisibility, setMarkerFamilyVisibility] = useState<Record<MarkerFamily, boolean>>({
    hazard: true,
    protocol: true,
    clockReset: true,
    fsm: true,
  });
  const [workspaceAiReportExpanded, setWorkspaceAiReportExpanded] = useState(true);
  const [simulationMacroContext, setSimulationMacroContext] = useState<SimulationMacroContextPayload | null>(null);
  const workspaceInputRef = useRef<HTMLInputElement | null>(null);
  const startupWorkspaceRecoveryRef = useRef(false);
  const startupProjectRestorePathRef = useRef<string | null>(null);
  const aiOutputWindow = useFloatingWindow({
    defaultBounds: DEFAULT_AI_OUTPUT_WINDOW_BOUNDS,
    minWidth: 520,
    minHeight: 360,
  });
  const aiDiagramWindow = useFloatingWindow({
    defaultBounds: DEFAULT_AI_DIAGRAM_WINDOW_BOUNDS,
    minWidth: 760,
    minHeight: 460,
  });

  useEffect(() => {
    const storedProject = loadStoredProjectSelection();
    if (storedProject) {
      setProjectDirectoryName(storedProject.name);
      setProjectDirectoryPath(storedProject.path || null);
      setProjectFiles(storedProject.files);
      setProjectFileCount(storedProject.files.length);
    }
  }, []);

  // Bootstrap initial preset on component mount
  useEffect(() => {
    const defaultPreset = PRESETS.find(p => p.id === 'spi_debug');
    if (defaultPreset) {
      setSignals(defaultPreset.signals);
      setSimulationLength(defaultPreset.length);
      setTickDuration(defaultPreset.tickDuration);
      setTimeUnit(defaultPreset.timeUnit);
    }
  }, []);

  useEffect(() => {
    if (startupWorkspaceRecoveryRef.current) {
      return;
    }

    const visibleSignals = signals.filter((signal) => signal.visible);
    const hasHiddenOnlyState = signals.length > 0 && visibleSignals.length === 0;
    const hasCorruptedTimeline = simulationLength < 10;
    const hasNoSignals = signals.length === 0;
    const looksBroken = hasNoSignals || hasHiddenOnlyState || hasCorruptedTimeline;

    if (!looksBroken) {
      startupWorkspaceRecoveryRef.current = true;
      return;
    }

    if (hasHiddenOnlyState && !hasCorruptedTimeline) {
      setSignals((previous) => previous.map((signal) => ({ ...signal, visible: true })));
      startupWorkspaceRecoveryRef.current = true;
      return;
    }

    const defaultPreset = PRESETS.find((preset) => preset.id === 'spi_debug');
    if (!defaultPreset) {
      startupWorkspaceRecoveryRef.current = true;
      return;
    }

    setSignals(defaultPreset.signals);
    setSimulationLength(defaultPreset.length);
    setTickDuration(defaultPreset.tickDuration);
    setTimeUnit(defaultPreset.timeUnit);
    setCursorA(25);
    setCursorB(89);
    setActivePresetId(defaultPreset.id);
    setWorkspaceFileName(null);
    setWorkspaceError(null);
    startupWorkspaceRecoveryRef.current = true;
  }, [signals, simulationLength, tickDuration, timeUnit, workspaceFileName]);

  useEffect(() => {
    if (!aiOutputWindow.isOpen && !aiDiagramWindow.isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        aiOutputWindow.setIsOpen(false);
        aiDiagramWindow.setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aiDiagramWindow.isOpen, aiDiagramWindow.setIsOpen, aiOutputWindow.isOpen, aiOutputWindow.setIsOpen]);

  // 5. Compute Live logic simulation of all clocks, outputs and decoders in parallel
  const simulatedSignals = useMemo(() => {
    return runSimulationEvaluations(signals, simulationLength);
  }, [signals, simulationLength]);

  const {
    rawHazardMarkers,
    filteredIssueMarkers,
    markerFamilyCounts,
    visibleIssueMarkers,
    hazardFilterCounts,
  } = useWaveformIssueMarkers({
    latestAiReport,
    simulatedSignals,
    simulationLength,
    hazardSeverityFilter,
    markerDisplayLimit,
    markerFamilyVisibility,
  });

  useEffect(() => {
    if (visibleIssueMarkers.length === 0) {
      setSelectedIssueMarkerId(null);
      setIssuePanelDismissed(false);
      return;
    }

    if (
      !issuePanelDismissed
      && (!selectedIssueMarkerId || !visibleIssueMarkers.some((marker) => marker.id === selectedIssueMarkerId))
    ) {
      setSelectedIssueMarkerId(visibleIssueMarkers[0]?.id || null);
    }
  }, [issuePanelDismissed, visibleIssueMarkers, selectedIssueMarkerId]);

  const handleSelectIssueMarker = (markerId: string) => {
    setSelectedIssueMarkerId(markerId);
    setIssuePanelDismissed(false);
    setIssueFocusRequestKey((current) => current + 1);

    const marker = visibleIssueMarkers.find((entry) => entry.id === markerId);
    if (!marker) {
      return;
    }

    const startTick = marker.startTick ?? marker.relatedTicks[0] ?? null;
    const endTick = marker.endTick ?? startTick;

    if (typeof startTick === 'number') {
      setCursorA(startTick);
    }
    if (typeof endTick === 'number') {
      setCursorB(endTick);
    }
  };

  const handleCloseIssueMarker = () => {
    setSelectedIssueMarkerId(null);
    setIssuePanelDismissed(true);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !selectedIssueMarkerId) {
        return;
      }
      handleCloseIssueMarker();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIssueMarkerId]);

  // Updates parameters of specific channel item
  const handleUpdateSignal = (id: string, updated: Partial<Signal>) => {
    setSignals(prev => prev.map(sig => {
      if (sig.id === id) {
        return { ...sig, ...updated };
      }
      return sig;
    }));
  };

  const handleUpdateSignalValues = (id: string, newValues: (number | string)[]) => {
    setSignals(prev => prev.map(sig => {
      if (sig.id === id) {
        return { ...sig, values: newValues };
      }
      return sig;
    }));
  };

  const handleOpenAiOutputWindow = () => {
    aiOutputWindow.openWindow();
  };

  const handleOpenAiDiagramWindow = () => {
    aiDiagramWindow.openWindow();
  };

  const openWorkspaceSource = async (fileName: string, content: string) => {
    const workspace = parseImportedWaveform(content, fileName);

    setSignals(workspace.signals);
    setSimulationLength(workspace.simulation.length);
    setTimeUnit(workspace.simulation.timeUnit);
    setTickDuration(workspace.simulation.tickDuration);
    setZoom(workspace.simulation.zoom);
    setCursorA(workspace.simulation.cursorA);
    setCursorB(workspace.simulation.cursorB);
    setActivePresetId(workspace.activePresetId || 'custom');
    setWorkspaceFileName(fileName);
    setWorkspaceError(null);
  };

  const openWorkspaceFile = async (file: File) => {
    await openWorkspaceSource(file.name, await file.text());
  };

  const applyProjectFiles = (
    nextProjectName: string,
    nextProjectPath: string | null,
    nextFiles: ProjectFileEntry[]
  ) => {
    setProjectDirectoryName(nextProjectName);
    setProjectDirectoryPath(nextProjectPath);
    setProjectFiles(nextFiles);
    setProjectFileCount(nextFiles.length);
    setWorkspaceError(null);
    saveProjectSelection(nextProjectName, nextProjectPath, nextFiles);
  };

  const resetProjectSelection = (message?: string) => {
    setProjectDirectoryName('Select Project Folder');
    setProjectDirectoryPath(null);
    setProjectFiles([]);
    setProjectFileCount(0);
    setGhdlProjectInfo(null);
    setGhdlSelectedSourcePaths([]);
    setGhdlTopEntity('');

    if (message) {
      setWorkspaceError(message);
    }

    clearStoredProjectSelection();
  };

  useEffect(() => {
    if (!projectDirectoryPath) {
      return;
    }
    if (startupProjectRestorePathRef.current === projectDirectoryPath) {
      return;
    }
    startupProjectRestorePathRef.current = projectDirectoryPath;

    const restoreProjectAccess = async () => {
      try {
        const response = await apiFetch('/api/project/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectPath: projectDirectoryPath }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Unable to restore the selected project folder.');
        }
        applyProjectFiles(data.name, data.path, Array.isArray(data.files) ? data.files : []);
      } catch (error: any) {
        startupProjectRestorePathRef.current = null;
        resetProjectSelection(error?.message || 'Re-select the project folder to continue.');
      }
    };

    void restoreProjectAccess();
  }, [projectDirectoryPath]);

  const handleToggleGhdlSource = (sourcePath: string) => {
    setGhdlSelectedSourcePaths((previous) =>
      previous.includes(sourcePath)
        ? previous.filter((path) => path !== sourcePath)
        : [...previous, sourcePath]
    );
  };

  // Presets selector
  const handleSelectPreset = (presetId: string) => {
    if (presetId === 'custom') {
      setActivePresetId('custom');
      return;
    }
    const selected = PRESETS.find(p => p.id === presetId);
    if (selected) {
      setSignals(selected.signals);
      setSimulationLength(selected.length);
      setTickDuration(selected.tickDuration);
      setTimeUnit(selected.timeUnit);
      setCursorA(25);
      setCursorB(89);
      setActivePresetId(presetId);
    }
  };

  // Actions
  const handleClearWorkspace = () => {
    setSignals([
      {
        id: 'clk_base',
        name: 'MASTER_CLK',
        type: 'clock',
        color: '#00e5ff',
        visible: true,
        pinned: true,
        values: Array(simulationLength).fill(0),
        config: { frequency: 8, dutyCycle: 0.5, phase: 0 }
      },
      {
        id: 'wire_base',
        name: 'GPIO_0',
        type: 'wire',
        color: '#4edea3',
        visible: true,
        pinned: false,
        values: Array(simulationLength).fill(0)
      }
    ]);
    setCursorA(null);
    setCursorB(null);
    setActivePresetId('custom');
    setSimulationMacroContext(null);
  };

  // Standard VCD Exporter module compile
  const handleExportVCD = async () => {
    let text = `$date ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} $end\n`;
    text += `$version Signal Logic Pro V1.0.0 Export $end\n`;
    text += `$timescale ${tickDuration}${timeUnit} $end\n`;
    text += `$scope module top $end\n`;

    // Declare variables
    simulatedSignals.forEach((sig) => {
      const charId = sig.name.replace(/[^a-zA-Z0-9]/g, '');
      text += `$var wire 1 ${charId} ${sig.name} $end\n`;
    });

    text += `$upscope $end\n`;
    text += `$enddefinitions $end\n`;

    // Dump values tick-by-tick
    for (let t = 0; t < simulationLength; t++) {
      text += `#${t}\n`;
      simulatedSignals.forEach((sig) => {
        const nameClean = sig.name.replace(/[^a-zA-Z0-9]/g, '');
        const rawVal = sig.values[t];
        let symbol = '0';
        if (rawVal === 1) symbol = '1';
        else if (rawVal === -1) symbol = 'z';
        else if (typeof rawVal === 'string' && rawVal !== '') symbol = '1'; // high
        
        text += `${symbol}${nameClean}\n`;
      });
    }

    setVcdText(text);
    setShowVcdModal(true);

    try {
      const response = await apiFetch('/api/project/save-vcd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath: projectDirectoryPath,
          suggestedName: `logic_dump_${activePresetId}.vcd`,
          content: text,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setWorkspaceError(null);
        return;
      }
      if (typeof data?.error === 'string' && isProjectApprovalErrorMessage(data.error)) {
        resetProjectSelection('The saved project folder is no longer authorized for this app session. Re-select it to continue.');
        return;
      }
      if (!data.cancelled) {
        setWorkspaceError(data.error || 'Unable to export the VCD file.');
      }
    } catch (error: any) {
      if (typeof error?.message === 'string' && isProjectApprovalErrorMessage(error.message)) {
        resetProjectSelection('The saved project folder is no longer authorized for this app session. Re-select it to continue.');
        return;
      }
      setWorkspaceError(error?.message || 'Unable to export the VCD file.');
    }

    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `logic_dump_${activePresetId}.vcd`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('File download blocked inside frames:', e);
    }
  };

  const handleCopyVCD = () => {
    navigator.clipboard.writeText(vcdText);
    setVcdCopied(true);
    setTimeout(() => setVcdCopied(false), 2000);
  };

  const handleOpenGhdlModal = async () => {
    if (!projectDirectoryPath) {
      setWorkspaceError('Select a project folder before running GHDL.');
      return;
    }

    setShowGhdlModal(true);
    setGhdlLogs('');

    try {
      const modalData = await fetchGhdlModalData(projectDirectoryPath);
      setGhdlStatus(modalData.status);
      setGhdlProjectInfo(modalData.projectInfo);
      setGhdlSelectedSourcePaths(Array.isArray(modalData.projectInfo.defaultSourcePaths) ? modalData.projectInfo.defaultSourcePaths : []);
      setGhdlTopEntity(modalData.projectInfo.defaultTopEntity || '');
      setWorkspaceError(null);
    } catch (error: any) {
      if (typeof error?.message === 'string' && isProjectApprovalErrorMessage(error.message)) {
        resetProjectSelection('The saved project folder is no longer authorized for this app session. Re-select it to continue.');
        return;
      }
      setWorkspaceError(error?.message || 'Unable to load the GHDL project view.');
    }
  };

  const handleInstallGhdl = async () => {
    if (ghdlInstallConfirmationInput.trim() !== GHDL_INSTALL_CONFIRMATION_TEXT) {
      setWorkspaceError(`Type "${GHDL_INSTALL_CONFIRMATION_TEXT}" to confirm GHDL installation.`);
      return;
    }
    setGhdlInstalling(true);
    setGhdlLogs('');
    setGhdlJobStatus('Installing GHDL...');
    try {
      const result = await installGhdl(ghdlInstallConfirmationInput.trim(), ghdlStatus?.installCommand);
      setGhdlStatus(result.status);
      setGhdlLogs(Array.isArray(result.logs) ? result.logs.join('\n\n') : '');
      setGhdlJobStatus(result.status.installed ? 'GHDL installation finished.' : 'GHDL installation did not complete.');
      setWorkspaceError(null);
      setGhdlInstallConfirmationInput('');
    } catch (error: any) {
      setGhdlJobStatus(`Installation failed: ${error?.message || 'Unable to install GHDL.'}`);
      setWorkspaceError(error?.message || 'Unable to install GHDL.');
    } finally {
      setGhdlInstalling(false);
    }
  };

  const handleRunGhdl = async () => {
    if (!projectDirectoryPath) {
      setWorkspaceError('Select a project folder before running GHDL.');
      return;
    }
    if (!ghdlTopEntity.trim()) {
      setWorkspaceError('Choose the top entity or testbench for the GHDL run.');
      return;
    }
    if (ghdlSelectedSourcePaths.length === 0) {
      setWorkspaceError('Select at least one VHDL source file for the GHDL run.');
      return;
    }

    setGhdlBusy(true);
    setGhdlLogs('');
      setGhdlJobStartedAt(Date.now());
      setGhdlJobStatus('Sending selected source set to GHDL...');
      try {
      const data = await runGhdl(
        projectDirectoryPath,
        ghdlTopEntity.trim(),
        ghdlSelectedSourcePaths,
        ghdlStopTime.trim() || undefined
      );
      setGhdlJobStatus('Waiting for GHDL compile and simulation output...');
      setGhdlLogs(Array.isArray(data.logs) ? data.logs.join('\n\n') : '');
      setGhdlJobStatus('Processing simulation output...');

      await openWorkspaceSource(data.vcdFileName || `${ghdlTopEntity}.vcd`, data.vcdContent);
      setSimulationMacroContext({
        rootEntity: ghdlTopEntity.trim(),
        sourcePaths: [...ghdlSelectedSourcePaths],
      });
      setGhdlLogs((previous) => {
        const successMessage = `\n\nLoaded waveform: ${data.vcdFileName || `${ghdlTopEntity}.vcd`}`;
        return previous ? `${previous}${successMessage}` : successMessage.trim();
      });
      setGhdlJobStatus(`Simulation finished. Loaded ${data.vcdFileName || `${ghdlTopEntity}.vcd`}.`);
      setWorkspaceError(null);
    } catch (error: any) {
      if (typeof error?.message === 'string' && isProjectApprovalErrorMessage(error.message)) {
        resetProjectSelection('The saved project folder is no longer authorized for this app session. Re-select it to continue.');
        return;
      }
      setGhdlJobStatus(`Simulation failed: ${error?.message || 'GHDL simulation failed.'}`);
      setWorkspaceError(error?.message || 'GHDL simulation failed.');
    } finally {
      setGhdlBusy(false);
      setGhdlJobStartedAt(null);
    }
  };

  const handleOpenWorkspace = async () => {
    try {
      const response = await apiFetch('/api/project/open-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath: projectDirectoryPath }),
      });
      const data = await response.json();
      if (response.ok) {
        await openWorkspaceFile(new File([data.content], data.name, { type: 'text/plain' }));
        setSimulationMacroContext(null);
        setWorkspaceError(null);
        return;
      }
      if (typeof data?.error === 'string' && isProjectApprovalErrorMessage(data.error)) {
        resetProjectSelection('The saved project folder is no longer authorized for this app session. Re-select it to continue.');
        return;
      }
      if (!data.cancelled) {
        setWorkspaceError(data.error || 'Unable to open the selected file.');
      }
    } catch (error: any) {
      if (typeof error?.message === 'string' && isProjectApprovalErrorMessage(error.message)) {
        resetProjectSelection('The saved project folder is no longer authorized for this app session. Re-select it to continue.');
        return;
      }
      setWorkspaceError(error?.message || 'Unable to open the selected file.');
    }

    workspaceInputRef.current?.click();
  };

  const handlePickProjectDirectory = async () => {
    try {
      const response = await apiFetch('/api/project/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultPath: projectDirectoryPath }),
      });
      const data = await response.json();
      if (response.ok) {
        applyProjectFiles(data.name, data.path, Array.isArray(data.files) ? data.files : []);
        setSimulationMacroContext(null);
        return;
      }
      if (!data.cancelled) {
        setWorkspaceError(data.error || 'Unable to open the selected project directory.');
      }
    } catch (error: any) {
      setWorkspaceError(error?.message || 'Unable to open the selected project directory.');
    }
  };

  const handleProjectDirectorySelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []) as Array<File & { webkitRelativePath?: string }>;
    if (files.length === 0) {
      return;
    }

    const firstPath = files[0].webkitRelativePath || files[0].name;
    const directoryName = firstPath.split('/')[0] || 'Selected project';

    applyProjectFiles(directoryName, null, files.map((file) => ({
      path: file.webkitRelativePath || file.name,
      name: file.name,
      extension: file.name.includes('.') ? `.${file.name.split('.').pop()?.toLowerCase()}` : '',
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      file,
    })));
    setSimulationMacroContext(null);
    event.target.value = '';
  };

  const handleWorkspaceSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      await openWorkspaceFile(file);
      setSimulationMacroContext(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to open the selected file.';
      setWorkspaceError(message);
    } finally {
      event.target.value = '';
    }
  };

  const handleShowSignal = (id: string) => {
    setSignals((previous) =>
      previous.map((signal) => signal.id === id ? { ...signal, visible: true } : signal)
    );
  };

  const handleShowAllSignals = () => {
    setSignals((previous) =>
      previous.map((signal) => ({ ...signal, visible: true }))
    );
  };

  const handleToggleSignalVisibility = (id: string) => {
    setSignals((previous) =>
      previous.map((signal) => signal.id === id ? { ...signal, visible: !signal.visible } : signal)
    );
  };

  const ghdlSelectedTopMatchesSources = useMemo(() => {
    if (!ghdlProjectInfo || !ghdlTopEntity.trim()) {
      return true;
    }

    const selected = new Set(ghdlSelectedSourcePaths);
    return ghdlProjectInfo.sources
      .filter((source) => selected.has(source.path))
      .some((source) => source.entities.includes(ghdlTopEntity.trim().toLowerCase()));
  }, [ghdlProjectInfo, ghdlSelectedSourcePaths, ghdlTopEntity]);

  const ghdlSelectedSources = useMemo(() => {
    if (!ghdlProjectInfo) {
      return [] as GhdlSourceFile[];
    }

    const selected = new Set(ghdlSelectedSourcePaths);
    return ghdlProjectInfo.sources.filter((source) => selected.has(source.path));
  }, [ghdlProjectInfo, ghdlSelectedSourcePaths]);

  useEffect(() => {
    if (!ghdlBusy || !ghdlJobStartedAt) {
      setGhdlElapsedSeconds(0);
      return;
    }

    const updateElapsed = () => {
      setGhdlElapsedSeconds(Math.max(0, Math.floor((Date.now() - ghdlJobStartedAt) / 1000)));
    };

    updateElapsed();
    const timer = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timer);
  }, [ghdlBusy, ghdlJobStartedAt]);

  return (
    <div className="h-screen w-screen flex flex-col bg-brand-surface text-brand-on-surface select-none font-sans overflow-hidden">
      <input
        ref={workspaceInputRef}
        type="file"
        accept=".vcd,.vsd,.json,text/plain,application/json"
        className="hidden"
        onChange={handleWorkspaceSelected}
      />
      
      {/* 1. Technical lab banner header (No unsolicited terminal status noise) */}
      <header className="h-[54px] border-b border-brand-outline-variant/40 bg-brand-surface-lowest px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3 h-full">
          <img
            src="/automata-logicpro-logo.png"
            alt="AUTOMATA LogicPro"
            className="h-10 w-10 rounded-lg object-cover self-center"
          />
          <div className="flex items-baseline gap-2.5">
            <h1 className="text-[18px] leading-none font-bold tracking-tight uppercase font-sans">
              <span className="text-brand-amber">AUTOMATA</span>{' '}
              <span className="text-brand-cyan">LOGICPRO</span>
            </h1>
            <span className="text-[12px] leading-none text-brand-secondary font-mono lowercase">v1.0</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[12px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5 bg-[#0f1526] p-1 px-2 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary inline-block animate-pulse"></span>
            <span>Logic Simulator Engine Active</span>
          </div>
        </div>
      </header>

      {/* 2. Top Interactive Toolbar */}
      <Toolbar
        projectLabel={projectDirectoryName}
        onPickProjectDirectory={handlePickProjectDirectory}
        zoom={zoom}
        setZoom={setZoom}
        timeUnit={timeUnit}
        setTimeUnit={setTimeUnit}
        tickDuration={tickDuration}
        setTickDuration={setTickDuration}
        simulationLength={simulationLength}
        setSimulationLength={setSimulationLength}
        onClearWorkspace={handleClearWorkspace}
        glitchInjectionEnabled={glitchInjectionEnabled}
        onToggleInjectGlitch={() => setGlitchInjectionEnabled((previous) => !previous)}
        onExportVCD={handleExportVCD}
        onOpenWorkspace={handleOpenWorkspace}
        onOpenAIDrawer={() => setAiDrawerOpen(!aiDrawerOpen)}
        onOpenGhdlRunner={handleOpenGhdlModal}
      />

      {workspaceError && (
        <div className="mx-3 mt-3 rounded border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-[12px] text-rose-100 flex items-center gap-2">
          <AlertCircle size={14} className="text-rose-300 flex-none" />
          <span>{workspaceError}</span>
        </div>
      )}

      {workspaceFileName && !workspaceError && (
        <div className="mx-3 mt-3 rounded border border-brand-cyan/20 bg-brand-cyan/10 px-3 py-2 text-[12px] text-slate-200 flex items-center gap-2">
          <FolderOpen size={14} className="text-brand-cyan flex-none" />
          <span>Opened workspace file: <strong>{workspaceFileName}</strong></span>
        </div>
      )}

      {showGhdlModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 select-none font-sans">
          <div className="w-full max-w-2xl bg-[#0f1526] border border-brand-cyan/20 rounded-lg p-5 flex flex-col max-h-[85vh] overflow-hidden shadow-[0_0_24px_rgba(0,229,255,0.1)]">
            <div className="flex justify-between items-center border-b border-brand-outline-variant/30 pb-2 mb-4">
              <div className="flex items-center gap-2">
                <Play size={16} className="text-brand-cyan" />
                <span className="text-[12px] font-bold uppercase tracking-wide text-white">GHDL Runner</span>
              </div>
              <button
                onClick={() => setShowGhdlModal(false)}
                className="p-1 rounded hover:bg-brand-surface-high text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-[12px]">
              <div className="rounded border border-brand-outline-variant/20 bg-brand-surface-lowest p-3">
                <div className="text-slate-400 uppercase text-[12px] font-bold mb-1">Project Folder</div>
                <div className="font-mono text-slate-200 break-all">{projectDirectoryPath || 'No project selected'}</div>
              </div>
              <div className="rounded border border-brand-outline-variant/20 bg-brand-surface-lowest p-3">
                <div className="text-slate-400 uppercase text-[12px] font-bold mb-1">GHDL Status</div>
              <div className="font-mono text-slate-200">
                  {ghdlStatus?.installed ? `Installed${ghdlStatus.version ? `: ${ghdlStatus.version}` : ''}` : 'Not installed'}
                </div>
                {ghdlStatus?.installer && !ghdlStatus.installed && (
                  <div className="mt-1 text-slate-400">Installer: {ghdlStatus.installer}</div>
                )}
                {ghdlStatus?.installCommand?.length ? (
                  <div className="mt-1 break-all text-slate-500">
                    Command: <span className="font-mono text-slate-300">{ghdlStatus.installCommand.join(' ')}</span>
                  </div>
                ) : null}
                {!ghdlStatus?.installed && (
                  <div className="mt-2 space-y-2">
                    <div className="text-slate-500">
                      To authorize installation, type <span className="font-mono text-brand-amber">{GHDL_INSTALL_CONFIRMATION_TEXT}</span> exactly.
                    </div>
                    <input
                      type="text"
                      value={ghdlInstallConfirmationInput}
                      onChange={(event) => setGhdlInstallConfirmationInput(event.target.value)}
                      placeholder={GHDL_INSTALL_CONFIRMATION_TEXT}
                      className="w-full rounded border border-brand-outline-variant/30 bg-brand-surface-high px-2 py-1 text-[12px] font-mono text-slate-100 outline-none"
                    />
                    <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleInstallGhdl()}
                      disabled={ghdlInstalling || ghdlBusy || ghdlInstallConfirmationInput.trim() !== GHDL_INSTALL_CONFIRMATION_TEXT}
                      className="px-2 py-1 rounded border border-brand-amber/40 bg-brand-surface-high text-[12px] font-bold text-brand-amber cursor-pointer hover:bg-brand-surface-bright disabled:opacity-40"
                    >
                      {ghdlInstalling ? 'Installing...' : 'Install GHDL'}
                    </button>
                    <span className="text-slate-500">Installation is explicit and requires the typed confirmation plus the shown platform command.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <label className="block">
                <span className="text-[12px] text-slate-400 uppercase font-bold tracking-wide mb-1 block">Top Entity / Testbench</span>
                <select
                  value={ghdlTopEntity}
                  onChange={(event) => setGhdlTopEntity(event.target.value)}
                  className="w-full bg-brand-surface border border-brand-outline-variant/50 rounded px-3 py-2 text-brand-on-surface outline-none focus:border-brand-cyan text-[12px] font-mono"
                >
                  {!ghdlProjectInfo?.topCandidates?.length && (
                    <option value="">No entities found</option>
                  )}
                  {(ghdlProjectInfo?.topCandidates || []).map((candidate) => (
                    <option key={candidate} value={candidate}>{candidate}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[12px] text-slate-400 uppercase font-bold tracking-wide mb-1 block">Stop Time</span>
                <input
                  type="text"
                  value={ghdlStopTime}
                  onChange={(event) => setGhdlStopTime(event.target.value)}
                  placeholder="1us"
                  className="w-full bg-brand-surface border border-brand-outline-variant/50 rounded px-3 py-2 text-brand-on-surface outline-none focus:border-brand-cyan text-[12px] font-mono"
                />
              </label>
            </div>

            <div className="rounded border border-brand-outline-variant/20 bg-brand-surface-lowest p-3 mb-4 flex-none">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <div className="text-[12px] text-slate-400 uppercase font-bold tracking-wide">Source Set</div>
                  <div className="text-[12px] text-slate-500 mt-1">Choose the VHDL files GHDL should analyze for this run.</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGhdlSelectedSourcePaths((ghdlProjectInfo?.sources || []).map((source) => source.path))}
                    className="px-2 py-1 rounded border border-brand-outline-variant/40 bg-brand-surface-high text-[12px] font-bold text-slate-200 cursor-pointer hover:bg-brand-surface-bright"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setGhdlSelectedSourcePaths([])}
                    className="px-2 py-1 rounded border border-brand-outline-variant/40 bg-brand-surface-high text-[12px] font-bold text-slate-200 cursor-pointer hover:bg-brand-surface-bright"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="max-h-52 overflow-y-auto rounded border border-brand-outline-variant/20 bg-[#060a12]">
                {(ghdlProjectInfo?.sources || []).length === 0 ? (
                  <div className="px-3 py-4 text-[12px] text-slate-400">No VHDL sources were found in the selected project folder.</div>
                ) : (
                  (ghdlProjectInfo?.sources || []).map((source) => (
                    <label
                      key={source.path}
                      className="flex items-start gap-3 px-3 py-2 border-b border-brand-outline-variant/10 last:border-b-0 cursor-pointer hover:bg-brand-surface/40"
                    >
                      <input
                        type="checkbox"
                        checked={ghdlSelectedSourcePaths.includes(source.path)}
                        onChange={() => handleToggleGhdlSource(source.path)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[12px] text-slate-100 break-all">{source.path}</div>
                        <div className="mt-1 flex flex-wrap gap-2 text-[12px] text-slate-400">
                          <span>entities: {source.entities.join(', ') || 'none'}</span>
                          <span>deps: {source.dependencies.join(', ') || 'none'}</span>
                          {source.isTestbench && <span className="text-brand-cyan">testbench</span>}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="mt-2 text-[12px] text-slate-400">
                {ghdlSelectedSources.length} file(s) selected
                {!ghdlSelectedTopMatchesSources && (
                  <span className="ml-2 text-amber-300">The chosen top entity is not declared by the selected source set.</span>
                )}
              </div>
            </div>

            <div className="rounded border border-brand-outline-variant/20 bg-[#060a12] p-3 mb-4 flex-1 min-h-0 overflow-y-auto">
              <div className="text-[12px] text-slate-400 uppercase font-bold tracking-wide mb-2">Run Log</div>
              {(ghdlBusy || ghdlJobStatus) && (
                <div className={`mb-3 rounded border p-2 text-[12px] font-mono ${
                  ghdlBusy
                    ? 'border-brand-amber/20 bg-brand-surface-lowest text-slate-300'
                    : ghdlJobStatus?.startsWith('Simulation failed')
                      ? 'border-rose-500/30 bg-rose-950/30 text-rose-100'
                      : 'border-brand-secondary/20 bg-brand-surface-lowest text-slate-300'
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {ghdlBusy ? <Loader2 size={12} className="animate-spin text-brand-amber" /> : <Play size={12} className="text-brand-secondary" />}
                      <span>{ghdlJobStatus}</span>
                    </div>
                    {ghdlBusy && <span className="text-slate-500">{ghdlElapsedSeconds}s</span>}
                  </div>
                  {ghdlBusy && (
                    <div className="mt-1 text-slate-500">
                      GHDL can take a while while compiling the source set and generating the VCD. Watch the timer and run log for progress.
                    </div>
                  )}
                </div>
              )}
              <pre className="font-mono text-[12px] text-slate-300 whitespace-pre-wrap">
                {ghdlLogs || 'Run output will appear here. The app now scans VHDL dependencies, lets you choose the source set, then compiles until the dependency graph resolves.'}
              </pre>
            </div>

            <div className="flex items-center justify-end gap-2 flex-none">
              <button
                onClick={() => setShowGhdlModal(false)}
                className="px-3 py-1.5 rounded bg-brand-surface-high hover:bg-brand-surface-bright border border-brand-outline-variant/40 text-[12px] font-bold text-white transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleRunGhdl}
                disabled={ghdlBusy || ghdlInstalling || !ghdlStatus?.installed || !projectDirectoryPath || ghdlSelectedSourcePaths.length === 0 || !ghdlSelectedTopMatchesSources}
                className="px-4 py-1.5 rounded bg-brand-cyan hover:bg-cyan-400 text-[12px] font-bold text-brand-on-primary transition-all cursor-pointer disabled:opacity-40 flex items-center gap-2"
              >
                {ghdlBusy ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                <span>{ghdlBusy ? 'Running...' : 'Run GHDL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Primary Workspace Area */}
      <div className="flex-1 flex overflow-hidden w-full select-none">
        {/* Collapsible Left Signal Tree */}
        <SignalSidebar
          signals={simulatedSignals}
          onShowSignal={handleShowSignal}
          onShowAllSignals={handleShowAllSignals}
        />

        <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
          <div
            className="flex-none overflow-hidden"
            style={{ height: aiDrawerOpen ? `calc(100% - ${leftWorkspaceBottomGapPx}px)` : '100%' }}
          >
            <div className="h-full overflow-hidden">
              {/* Waves Timing view diagram */}
              <WaveformViewport
                signals={simulatedSignals}
                issueMarkers={visibleIssueMarkers}
                markerFamilyCounts={markerFamilyCounts}
                markerFamilyVisibility={markerFamilyVisibility}
                activeIssueMarkerId={selectedIssueMarkerId}
                issueFocusRequestKey={issueFocusRequestKey}
                onToggleMarkerFamily={(family) => setMarkerFamilyVisibility((current) => ({
                  ...current,
                  [family]: !current[family],
                }))}
                onSelectIssueMarker={handleSelectIssueMarker}
                onCloseIssueMarker={handleCloseIssueMarker}
                length={simulationLength}
                zoom={zoom}
                tickWidth={tickWidth}
                glitchInjectionEnabled={glitchInjectionEnabled}
                timeUnit={timeUnit}
                tickDuration={tickDuration}
                cursorA={cursorA}
                cursorB={cursorB}
                setCursorA={setCursorA}
                setCursorB={setCursorB}
                onUpdateSignalValues={handleUpdateSignalValues}
                onToggleSignalVisibility={handleToggleSignalVisibility}
              />
            </div>
          </div>

          {aiDrawerOpen && (
            <div
              className="shrink-0 border-t border-brand-outline-variant/20 bg-brand-surface overflow-hidden"
              style={{ height: leftWorkspaceBottomGapPx }}
            >
              <AIBottomDrawer
                report={latestAiReport}
                hazardMarkers={visibleIssueMarkers}
                hazardSeverityFilter={hazardSeverityFilter}
                hazardFilterCounts={hazardFilterCounts}
                filteredMarkerCount={filteredIssueMarkers.length}
                markerFamilyCounts={markerFamilyCounts}
                markerFamilyVisibility={markerFamilyVisibility}
                markerDisplayLimit={markerDisplayLimit}
                selectedHazardId={selectedIssueMarkerId}
                onSelectHazard={handleSelectIssueMarker}
                onChangeHazardSeverityFilter={setHazardSeverityFilter}
                onToggleMarkerFamily={(family) => setMarkerFamilyVisibility((current) => ({
                  ...current,
                  [family]: !current[family],
                }))}
                onChangeMarkerDisplayLimit={setMarkerDisplayLimit}
                expanded={workspaceAiReportExpanded}
                onToggleExpanded={() => setWorkspaceAiReportExpanded((previous) => !previous)}
                onOpenFloatingWindow={handleOpenAiOutputWindow}
                onOpenDiagramWindow={handleOpenAiDiagramWindow}
                fillHeight
              />
            </div>
          )}
        </div>

        {/* AI Copilot Side Console Drawer */}
        <AIDrawer
          isOpen={aiDrawerOpen}
          onClose={() => setAiDrawerOpen(false)}
          signals={simulatedSignals}
          timeUnit={timeUnit}
          tickDuration={tickDuration}
          projectName={projectDirectoryName}
          projectPath={projectDirectoryPath}
          projectFiles={projectFiles}
          workspaceFileName={workspaceFileName}
          simulationMacroContext={simulationMacroContext}
          onMacrosPanelHeightChange={setLeftWorkspaceBottomGapPx}
          onLatestStructuredReportChange={setLatestAiReport}
        />
      </div>

      {aiOutputWindow.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/20 pointer-events-none">
          <div
            ref={aiOutputWindow.windowRef}
            className={`pointer-events-auto fixed flex overflow-auto border border-brand-cyan/25 bg-[#0b1020]/98 shadow-[0_18px_60px_rgba(0,0,0,0.45)] ${
              aiOutputWindow.fullscreen ? 'rounded-none' : 'min-h-[360px] min-w-[520px] resize rounded-xl'
            }`}
            style={{
              left: aiOutputWindow.bounds.left,
              top: aiOutputWindow.bounds.top,
              width: aiOutputWindow.bounds.width,
              height: aiOutputWindow.bounds.height,
              maxWidth: aiOutputWindow.fullscreen ? '100vw' : 'calc(100vw - 32px)',
              maxHeight: aiOutputWindow.fullscreen ? '100vh' : 'calc(100vh - 32px)',
            }}
          >
            <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
              <div
                className="flex items-center justify-between gap-3 border-b border-brand-outline-variant/40 bg-brand-surface-lowest px-4 py-3 cursor-move"
                onPointerDown={aiOutputWindow.handleHeaderPointerDown}
                onPointerMove={aiOutputWindow.handleHeaderPointerMove}
                onPointerUp={aiOutputWindow.handleHeaderPointerUp}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Maximize2 size={14} className="text-brand-cyan flex-none" />
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-brand-cyan">AI Analysis Output</div>
                    <div className="truncate text-[12px] text-slate-400">
                      {latestAiReport?.report.summary || 'Structured AI findings will appear here after an analysis run.'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      aiOutputWindow.toggleFullscreen();
                    }}
                    className="rounded border border-brand-outline-variant/30 bg-brand-surface-high p-1.5 text-slate-300 transition-colors hover:bg-brand-surface hover:text-white cursor-pointer"
                    title={aiOutputWindow.fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  >
                    {aiOutputWindow.fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </button>
                  <button
                    type="button"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      aiOutputWindow.closeWindow();
                    }}
                    className="rounded border border-brand-outline-variant/30 bg-brand-surface-high p-1.5 text-slate-300 transition-colors hover:bg-brand-surface hover:text-white cursor-pointer"
                    title="Close AI analysis window"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto bg-brand-surface-lowest p-4">
                <AIAnalysisContent
                  report={latestAiReport}
                  hazardMarkers={visibleIssueMarkers}
                  hazardSeverityFilter={hazardSeverityFilter}
                  hazardFilterCounts={hazardFilterCounts}
                  filteredMarkerCount={filteredIssueMarkers.length}
                  markerFamilyCounts={markerFamilyCounts}
                  markerFamilyVisibility={markerFamilyVisibility}
                  markerDisplayLimit={markerDisplayLimit}
                  selectedHazardId={selectedIssueMarkerId}
                  onSelectHazard={handleSelectIssueMarker}
                  onChangeHazardSeverityFilter={setHazardSeverityFilter}
                  onToggleMarkerFamily={(family) => setMarkerFamilyVisibility((current) => ({
                    ...current,
                    [family]: !current[family],
                  }))}
                  onChangeMarkerDisplayLimit={setMarkerDisplayLimit}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {aiDiagramWindow.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/20 pointer-events-none">
          <div
            ref={aiDiagramWindow.windowRef}
            className={`pointer-events-auto fixed flex overflow-auto border border-violet-400/25 bg-[#0b1020]/98 shadow-[0_18px_60px_rgba(0,0,0,0.45)] ${
              aiDiagramWindow.fullscreen ? 'rounded-none' : 'min-h-[460px] min-w-[760px] resize rounded-xl'
            }`}
            style={{
              left: aiDiagramWindow.bounds.left,
              top: aiDiagramWindow.bounds.top,
              width: aiDiagramWindow.bounds.width,
              height: aiDiagramWindow.bounds.height,
              maxWidth: aiDiagramWindow.fullscreen ? '100vw' : 'calc(100vw - 32px)',
              maxHeight: aiDiagramWindow.fullscreen ? '100vh' : 'calc(100vh - 32px)',
            }}
          >
            <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
              <div
                className="flex items-center justify-between gap-3 border-b border-brand-outline-variant/40 bg-brand-surface-lowest px-4 py-3 cursor-move"
                onPointerDown={aiDiagramWindow.handleHeaderPointerDown}
                onPointerMove={aiDiagramWindow.handleHeaderPointerMove}
                onPointerUp={aiDiagramWindow.handleHeaderPointerUp}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Maximize2 size={14} className="text-violet-200 flex-none" />
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-violet-200">Block Diagram Viewer</div>
                    <div className="truncate text-[12px] text-slate-400">
                      {latestAiReport?.meta.diagnostics
                        ? `Graphical entity and signal relations for ${latestAiReport.meta.diagnostics.rootEntity}`
                        : 'Run an AI macro with diagnostics to populate the diagram viewer.'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      aiDiagramWindow.toggleFullscreen();
                    }}
                    className="rounded border border-brand-outline-variant/30 bg-brand-surface-high p-1.5 text-slate-300 transition-colors hover:bg-brand-surface hover:text-white cursor-pointer"
                    title={aiDiagramWindow.fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  >
                    {aiDiagramWindow.fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </button>
                  <button
                    type="button"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      aiDiagramWindow.closeWindow();
                    }}
                    className="rounded border border-brand-outline-variant/30 bg-brand-surface-high p-1.5 text-slate-300 transition-colors hover:bg-brand-surface hover:text-white cursor-pointer"
                    title="Close block diagram window"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-auto bg-brand-surface-lowest p-4">
                <AIDiagramContent report={latestAiReport} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. VCD Export Viewer Dialog Modal */}
      {showVcdModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 select-none font-sans">
          <div className="w-full max-w-2xl bg-[#0f1526] border border-brand-cyan/20 rounded-lg p-5 flex flex-col max-h-[85vh] shadow-[0_0_24px_rgba(0,229,255,0.1)]">
            <div className="flex justify-between items-center border-b border-brand-outline-variant/30 pb-2 mb-3 select-none">
              <div className="flex items-center gap-2">
                <Wrench size={16} className="text-brand-cyan" />
                <span className="text-[12px] font-bold uppercase tracking-wide text-white">Value Change Dump VCD Compilation Output</span>
              </div>
              <button 
                onClick={() => setShowVcdModal(false)}
                className="p-1 rounded hover:bg-brand-surface-high text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-brand-cyan/10 border border-brand-cyan/20 p-2.5 rounded text-[12px] text-slate-300 mb-3 select-none">
              <AlertCircle size={14} className="text-brand-cyan flex-none" />
              <p>Your timeline has been compiled to industrial **IEEE Standard 1364-2001 VCD**. Drag-and-drop downloaded files directly into Verilog Timing analyzers like GTKWave or ModelSim for laboratory synthesis.</p>
            </div>

            <label className="text-[12px] text-brand-cyan uppercase font-bold font-mono tracking-wider mb-1 select-none">VCD String Hex Preview</label>
            <div className="flex-1 bg-black/50 border border-brand-outline-variant/20 rounded p-3 overflow-y-auto mb-4 scrollbar-thin">
              <pre className="font-mono text-[12px] text-amber-100/90 whitespace-pre leading-normal select-all">
                {vcdText}
              </pre>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-2 shrink-0 select-none">
              <button
                onClick={handleCopyVCD}
                className="px-3.5 py-1.5 rounded bg-brand-surface-high hover:bg-brand-surface-bright border border-brand-outline-variant/40 text-[12px] font-bold text-white transition-all flex items-center gap-1 cursor-pointer"
              >
                {vcdCopied ? <Check size={12} className="text-brand-secondary" /> : <Copy size={12} />}
                <span>{vcdCopied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
              </button>
              <button
                onClick={() => setShowVcdModal(false)}
                className="px-4 py-1.5 rounded bg-brand-cyan hover:bg-cyan-400 text-[12px] font-bold text-brand-on-primary transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Compact, clean footer (Max 1px separation) */}
      <footer className="h-6 border-t border-brand-outline-variant/30 bg-brand-surface-lowest px-4 flex items-center justify-between shrink-0 select-none text-[12px] text-slate-500 font-mono">
        <div>
          <span>Project: </span>
          <span className="text-brand-cyan uppercase font-bold">{projectDirectoryName}</span>
          {projectFileCount > 0 && (
            <span className="ml-2 text-slate-400 normal-case">({projectFileCount} files)</span>
          )}
        </div>
        <div className="flex gap-4">
          <span>Simulation length: <strong className="text-slate-300">{simulationLength} steps</strong></span>
          <span>Time: <strong className="text-slate-300">{simulationLength * tickDuration} {timeUnit}</strong></span>
        </div>
      </footer>
    </div>
  );
}
