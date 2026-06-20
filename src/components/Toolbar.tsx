import React from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  FolderOpen,
  Trash2, 
  Sliders, 
  Sparkles,
  Play,
  RefreshCw,
  Copy,
  Terminal,
} from 'lucide-react';

interface ToolbarProps {
  projectLabel: string;
  onPickProjectDirectory: () => void;
  zoom: number;
  setZoom: (z: number) => void;
  timeUnit: 'ns' | 'us' | 'ms' | 's';
  setTimeUnit: (u: 'ns' | 'us' | 'ms' | 's') => void;
  tickDuration: number;
  setTickDuration: (d: number) => void;
  simulationLength: number;
  setSimulationLength: (l: number) => void;
  onClearWorkspace: () => void;
  onInjectGlitch: () => void;
  onExportVCD: () => void;
  onOpenWorkspace: () => void;
  onOpenAIDrawer: () => void;
  onOpenGhdlRunner: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  projectLabel,
  onPickProjectDirectory,
  zoom,
  setZoom,
  timeUnit,
  setTimeUnit,
  tickDuration,
  setTickDuration,
  simulationLength,
  setSimulationLength,
  onClearWorkspace,
  onInjectGlitch,
  onExportVCD,
  onOpenWorkspace,
  onOpenAIDrawer,
  onOpenGhdlRunner
}) => {
  return (
    <div className="h-10 border-b border-brand-outline-variant/40 bg-brand-surface-low px-3 flex items-center justify-between flex-none select-none font-sans z-10 gap-2 overflow-x-auto">
      
      {/* 1. Left Section: Project Picker */}
      <div className="flex items-center gap-2 flex-none">
        <div className="flex items-center gap-1 bg-brand-surface-lowest p-1 rounded border border-brand-outline-variant/20">
          <span className="text-[9px] text-slate-400 font-bold uppercase px-1">Project:</span>
          <button
            type="button"
            onClick={onPickProjectDirectory}
            className="inline-flex items-center gap-1 rounded bg-[#0b1326] px-2 py-1 text-[11px] font-medium text-brand-cyan outline-none cursor-pointer hover:bg-[#101a32] transition-colors"
            title="Select the project directory for this workspace"
          >
            <FolderOpen size={11} />
            <span className="max-w-[220px] truncate text-left">{projectLabel}</span>
          </button>
        </div>
      </div>

      {/* 2. Middle Section: Timing Configs (Timeline size, Tick resolution) */}
      <div className="hidden lg:flex items-center gap-3 bg-brand-surface-low border-x border-brand-outline-variant/30 px-3 flex-none select-none">
        
        {/* Tick scale */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="text-slate-400 font-bold uppercase">Tick Scale:</span>
          <select
            value={tickDuration}
            onChange={e => setTickDuration(Number(e.target.value))}
            className="bg-brand-surface-lowest border border-brand-outline-variant/30 rounded text-[11px] text-brand-on-surface px-1.5 py-0.5 outline-none"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <select
            value={timeUnit}
            onChange={e => setTimeUnit(e.target.value as any)}
            className="bg-brand-surface-lowest border border-brand-outline-variant/30 rounded text-[11px] text-brand-on-surface px-1 py-0.5 outline-none font-mono"
          >
            <option value="ns">ns</option>
            <option value="us">us</option>
            <option value="ms">ms</option>
            <option value="s">s</option>
          </select>
        </div>

        {/* length */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="text-slate-400 font-bold uppercase">Length (Ticks):</span>
          <select
            value={simulationLength}
            onChange={e => setSimulationLength(Number(e.target.value))}
            className="bg-brand-surface-lowest border border-brand-outline-variant/30 rounded text-[11px] text-brand-on-surface px-1 py-0.5 outline-none"
          >
            <option value="100">100 ticks</option>
            <option value="150">150 ticks</option>
            <option value="200">200 ticks</option>
            <option value="300">300 ticks</option>
          </select>
        </div>
      </div>

      {/* 3. Global Zoom Controls */}
      <div className="flex items-center gap-1.5 flex-none">
        <button
          onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
          className="p-1.5 rounded bg-brand-surface-high hover:bg-brand-surface-bright text-brand-on-surface transition-all cursor-pointer border border-brand-outline-variant/20"
          title="Zoom Waveform Out"
        >
          <ZoomOut size={12} />
        </button>
        <span className="text-[10px] font-mono text-brand-cyan select-none w-10 text-center font-bold">
          {(zoom * 100).toFixed(0)}%
        </span>
        <button
          onClick={() => setZoom(Math.min(4.0, zoom + 0.2))}
          className="p-1.5 rounded bg-brand-surface-high hover:bg-brand-surface-bright text-brand-on-surface transition-all cursor-pointer border border-brand-outline-variant/20"
          title="Zoom Waveform In"
        >
          <ZoomIn size={12} />
        </button>
        <button
          onClick={() => setZoom(1.0)}
          className="p-1.5 rounded bg-brand-surface-high hover:bg-brand-surface-bright text-brand-on-surface transition-all cursor-pointer border border-brand-outline-variant/20"
          title="Reset Zoom scale"
        >
          <RotateCcw size={12} />
        </button>
      </div>

      {/* 4. Right Section: Action Utilities */}
      <div className="flex items-center gap-1.5 flex-none ml-auto">
        <button
          onClick={onInjectGlitch}
          className="px-2 py-1 select-none flex items-center gap-1 bg-rose-950/40 hover:bg-rose-900 border border-rose-500/20 rounded text-[10px] font-bold text-rose-300 uppercase cursor-pointer"
          title="Inject logic noise spike into Wire channels"
        >
          <Sparkles size={11} />
          <span className="hidden sm:inline">Inject Glitch</span>
        </button>

        <button
          onClick={onOpenGhdlRunner}
          className="px-2 py-1 select-none flex items-center gap-1 bg-brand-surface-high hover:bg-brand-surface-bright border border-brand-outline-variant/40 rounded text-[10px] font-bold text-slate-100 uppercase cursor-pointer"
          title="Run a GHDL simulation from the selected project folder"
        >
          <Play size={11} />
          <span>Run GHDL</span>
        </button>

        <button
          onClick={onOpenWorkspace}
          className="px-2 py-1 select-none flex items-center gap-1 bg-brand-surface-high hover:bg-brand-surface-bright border border-brand-outline-variant/40 rounded text-[10px] font-bold text-slate-100 uppercase cursor-pointer"
          title="Open a VCD waveform dump or saved Signal Logic Pro workspace"
        >
          <FolderOpen size={11} />
          <span>Open VCD</span>
        </button>

        <button
          onClick={onExportVCD}
          className="px-2 py-1 select-none flex items-center gap-1 bg-brand-surface-high hover:bg-brand-surface-bright border border-brand-outline-variant/40 rounded text-[10px] font-bold text-slate-100 uppercase cursor-pointer"
          title="Export captured timeline as VCD file (Value Change Dump)"
        >
          <Download size={11} />
          <span>VCD Export</span>
        </button>

        <button
          onClick={onOpenAIDrawer}
          className="px-2.5 py-1 select-none flex items-center gap-1 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/30 rounded text-[10px] font-bold text-brand-tertiary uppercase cursor-pointer transition-all animate-pulse"
          title="Open AI Hardware timing assistant"
        >
          <Terminal size={11} className="text-brand-amber text-yellow-300" />
          <span>AI Assist</span>
        </button>

        <button
          onClick={onClearWorkspace}
          className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-red-950/30 transition-all cursor-pointer"
          title="Wipe channel stack"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};
