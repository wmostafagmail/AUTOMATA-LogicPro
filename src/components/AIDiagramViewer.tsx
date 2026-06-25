import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GitBranch, Layers, RadioTower, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { AIWorkspaceReport } from '../aiReport';

interface AIDiagramContentProps {
  report: AIWorkspaceReport | null;
}

interface DiagramNode {
  id: string;
  label: string;
  detail: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tone: 'root' | 'entity' | 'signal';
  highlighted?: boolean;
}

interface DiagramEdge {
  from: string;
  to: string;
  tone: 'primary' | 'secondary' | 'signal';
  label?: string;
}

interface EntityTreeNode {
  id: string;
  label: string;
  detail: string;
  highlighted: boolean;
  children: EntityTreeNode[];
  signals: Array<{ id: string; label: string; detail: string }>;
}

const VIEWBOX_WIDTH = 1480;
const VIEWBOX_HEIGHT = 920;
const NODE_WIDTH = 220;
const NODE_HEIGHT = 88;
const ROOT_WIDTH = 280;
const ROOT_HEIGHT = 96;
const SIGNAL_WIDTH = 180;
const SIGNAL_HEIGHT = 72;
const HORIZONTAL_GAP = 48;
const VERTICAL_GAP = 124;
const SIGNAL_VERTICAL_GAP = 104;
const DIAGRAM_MARGIN_X = 70;
const DIAGRAM_MARGIN_Y = 56;

const truncateLabel = (value: string, max = 26) => (
  value.length > max ? `${value.slice(0, max - 1)}…` : value
);

const isInfrastructureSignal = (signal: { signal: string; categories: string[] }) => {
  const normalized = signal.signal.trim().toLowerCase();
  if (
    normalized === 'clk'
    || normalized === 'clock'
    || normalized === 'rst'
    || normalized === 'reset'
    || normalized.endsWith('_clk')
    || normalized.endsWith('_clock')
    || normalized.endsWith('_rst')
    || normalized.endsWith('_reset')
  ) {
    return true;
  }

  return signal.categories.includes('clockReset');
};

const wrapLabel = (value: string, lineLength = 18, maxLines = 3) => {
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return ['Unnamed'];
  }

  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= lineLength) {
      current = next;
      continue;
    }
    if (current) {
      lines.push(current);
    }
    current = word;
    if (lines.length === maxLines - 1) {
      break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = truncateLabel(lines[maxLines - 1], lineLength);
  }

  return lines.slice(0, maxLines);
};

const getNodeTone = (tone: DiagramNode['tone'], highlighted = false) => {
  switch (tone) {
    case 'root':
      return {
        fill: '#091f33',
        stroke: '#22d3ee',
        title: '#bcf5ff',
        detail: '#9eb5ca',
        shadow: 'drop-shadow(0 18px 24px rgba(34,211,238,0.14))',
      };
    case 'signal':
      return {
        fill: '#0d201f',
        stroke: '#34d399',
        title: '#bbf7df',
        detail: '#8ca69f',
        shadow: 'drop-shadow(0 14px 20px rgba(52,211,153,0.12))',
      };
    default:
      return {
        fill: highlighted ? '#261735' : '#141c2d',
        stroke: highlighted ? '#f59e0b' : '#8b5cf6',
        title: highlighted ? '#fde68a' : '#ddd6fe',
        detail: highlighted ? '#f4d79b' : '#a7a0c7',
        shadow: highlighted
          ? 'drop-shadow(0 16px 24px rgba(245,158,11,0.18))'
          : 'drop-shadow(0 14px 20px rgba(139,92,246,0.12))',
      };
  }
};

const getEdgeTone = (tone: DiagramEdge['tone']) => {
  switch (tone) {
    case 'primary':
      return { stroke: '#22d3ee', opacity: 0.9, width: 3 };
    case 'signal':
      return { stroke: '#34d399', opacity: 0.7, width: 2.5 };
    default:
      return { stroke: '#7c8aa7', opacity: 0.5, width: 2 };
  }
};

const measureSubtreeWidth = (node: EntityTreeNode): number => {
  if (node.children.length === 0) {
    return NODE_WIDTH;
  }
  const childrenWidth = node.children.reduce((sum, child, index) => {
    const childWidth = measureSubtreeWidth(child);
    return sum + childWidth + (index > 0 ? HORIZONTAL_GAP : 0);
  }, 0);
  return Math.max(NODE_WIDTH, childrenWidth);
};

const buildEntityTree = (report: AIWorkspaceReport | null) => {
  const diagnostics = report?.meta.diagnostics;
  if (!diagnostics) {
    return null;
  }

  const focusSet = new Set(diagnostics.focusEntities);
  const childrenByParent = new Map<string, Array<{ child: string; instanceLabel: string }>>();
  const incomingChildren = new Set<string>();

  diagnostics.entityHierarchy.forEach((edge) => {
    const bucket = childrenByParent.get(edge.parent) || [];
    bucket.push({ child: edge.child, instanceLabel: edge.instanceLabel });
    childrenByParent.set(edge.parent, bucket);
    incomingChildren.add(edge.child);
  });

  const signalAttachments = new Map<string, Array<{ id: string; label: string; detail: string }>>();
  diagnostics.selectedSignals
    .filter((signal) => !isInfrastructureSignal(signal))
    .forEach((signal) => {
    const attachTo = [...signal.entities]
      .sort((left, right) => (diagnostics.entityDepths[right] ?? 0) - (diagnostics.entityDepths[left] ?? 0))[0]
      || diagnostics.rootEntity;
    const bucket = signalAttachments.get(attachTo) || [];
    bucket.push({
      id: `signal:${signal.normalizedSignal}`,
      label: signal.signal,
      detail: signal.categories.join(', ') || 'selected signal',
    });
    signalAttachments.set(attachTo, bucket);
  });

  const visited = new Set<string>();
  const buildNode = (entityName: string): EntityTreeNode => {
    visited.add(entityName);
    const sortedChildren = (childrenByParent.get(entityName) || [])
      .sort((left, right) =>
        (diagnostics.entityDepths[left.child] ?? 0) - (diagnostics.entityDepths[right.child] ?? 0)
        || left.child.localeCompare(right.child)
      );

    const uniqueChildren: EntityTreeNode[] = [];
    const childSeen = new Set<string>();
    for (const entry of sortedChildren) {
      if (childSeen.has(entry.child) || visited.has(entry.child)) {
        continue;
      }
      childSeen.add(entry.child);
      uniqueChildren.push(buildNode(entry.child));
    }

    return {
      id: `entity:${entityName}`,
      label: entityName,
      detail: diagnostics.entityRoles[entityName] || `level ${(diagnostics.entityDepths[entityName] ?? 0) + 1} entity`,
      highlighted: focusSet.has(entityName),
      children: uniqueChildren,
      signals: (signalAttachments.get(entityName) || []).slice(0, 4),
    };
  };

  const rootName = diagnostics.rootEntity;
  const rootNode = buildNode(rootName);

  const orphanEntities = diagnostics.reachableEntities
    .filter((entityName) => entityName !== rootName && !incomingChildren.has(entityName) && !visited.has(entityName))
    .sort((left, right) => left.localeCompare(right));

  orphanEntities.forEach((entityName) => {
    rootNode.children.push(buildNode(entityName));
  });

  return rootNode;
};

const layoutDiagram = (report: AIWorkspaceReport | null) => {
  const diagnostics = report?.meta.diagnostics;
  if (!diagnostics) {
    return { nodes: [] as DiagramNode[], edges: [] as DiagramEdge[], depthCount: 0 };
  }

  const rootTree = buildEntityTree(report);
  if (!rootTree) {
    return { nodes: [] as DiagramNode[], edges: [] as DiagramEdge[], depthCount: 0 };
  }

  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  const hierarchyEdgeMap = new Map(
    diagnostics.entityHierarchy.map((edge) => [`${edge.parent}->${edge.child}`, edge.instanceLabel]),
  );
  let maxDepth = 0;

  const placeNode = (node: EntityTreeNode, x: number, depth: number) => {
    maxDepth = Math.max(maxDepth, depth);
    const width = depth === 0 ? ROOT_WIDTH : NODE_WIDTH;
    const height = depth === 0 ? ROOT_HEIGHT : NODE_HEIGHT;
    const y = DIAGRAM_MARGIN_Y + depth * VERTICAL_GAP;

    nodes.push({
      id: node.id,
      label: node.label,
      detail: node.detail,
      x,
      y,
      width,
      height,
      tone: depth === 0 ? 'root' : 'entity',
      highlighted: node.highlighted,
    });

    if (node.children.length > 0) {
      const childWidths = node.children.map((child) => measureSubtreeWidth(child));
      const totalWidth = childWidths.reduce((sum, childWidth, index) => (
        sum + childWidth + (index > 0 ? HORIZONTAL_GAP : 0)
      ), 0);
      let cursorX = x + width / 2 - totalWidth / 2;

      node.children.forEach((child, index) => {
        const childWidth = childWidths[index];
        const childX = cursorX + (childWidth - NODE_WIDTH) / 2;
        placeNode(child, childX, depth + 1);
        edges.push({
          from: node.id,
          to: child.id,
          tone: depth === 0 ? 'primary' : 'secondary',
          label: hierarchyEdgeMap.get(`${node.label}->${child.label}`),
        });
        cursorX += childWidth + HORIZONTAL_GAP;
      });
    }

    if (node.signals.length > 0) {
      const totalSignalWidth = node.signals.length * SIGNAL_WIDTH + Math.max(0, node.signals.length - 1) * 18;
      let signalCursor = x + width / 2 - totalSignalWidth / 2;
      const signalY = y + SIGNAL_VERTICAL_GAP;

      node.signals.forEach((signal) => {
        nodes.push({
          id: signal.id,
          label: signal.label,
          detail: signal.detail,
          x: signalCursor,
          y: signalY,
          width: SIGNAL_WIDTH,
          height: SIGNAL_HEIGHT,
          tone: 'signal',
        });
        edges.push({
          from: node.id,
          to: signal.id,
          tone: 'signal',
        });
        signalCursor += SIGNAL_WIDTH + 18;
      });
    }
  };

  const treeWidth = measureSubtreeWidth(rootTree);
  const rootX = Math.max(DIAGRAM_MARGIN_X, Math.round((VIEWBOX_WIDTH - Math.max(ROOT_WIDTH, treeWidth)) / 2));
  placeNode(rootTree, rootX + Math.max(0, (treeWidth - ROOT_WIDTH) / 2), 0);

  return { nodes, edges, depthCount: maxDepth + 1 };
};

const getCenteredView = (nodes: DiagramNode[]) => {
  if (nodes.length === 0) {
    return { zoom: 1, pan: { x: 0, y: 0 } };
  }

  const minX = Math.min(...nodes.map((node) => node.x));
  const minY = Math.min(...nodes.map((node) => node.y));
  const maxX = Math.max(...nodes.map((node) => node.x + node.width));
  const maxY = Math.max(...nodes.map((node) => node.y + node.height));

  const contentWidth = Math.max(maxX - minX, 1);
  const contentHeight = Math.max(maxY - minY, 1);
  const paddingX = 140;
  const paddingY = 120;
  const fitZoom = Math.min(
    1,
    (VIEWBOX_WIDTH - paddingX * 2) / contentWidth,
    (VIEWBOX_HEIGHT - paddingY * 2) / contentHeight,
  );
  const zoom = Math.min(2.4, Math.max(0.45, Number(fitZoom.toFixed(3))));

  return {
    zoom,
    pan: {
      x: Number((((VIEWBOX_WIDTH - contentWidth * zoom) / 2) - minX * zoom).toFixed(2)),
      y: Number((((VIEWBOX_HEIGHT - contentHeight * zoom) / 2) - minY * zoom).toFixed(2)),
    },
  };
};

export const AIDiagramContent: React.FC<AIDiagramContentProps> = ({ report }) => {
  const diagnostics = report?.meta.diagnostics;
  const { nodes, edges, depthCount } = useMemo(() => layoutDiagram(report), [report]);
  const centeredView = useMemo(() => getCenteredView(nodes), [nodes]);
  const surfaceRef = useRef<SVGSVGElement | null>(null);
  const dragStateRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const [zoom, setZoom] = useState(centeredView.zoom);
  const [pan, setPan] = useState(centeredView.pan);

  useEffect(() => {
    setZoom(centeredView.zoom);
    setPan(centeredView.pan);
  }, [centeredView]);

  if (!diagnostics) {
    return (
      <div className="rounded-lg border border-brand-outline-variant/20 bg-brand-surface px-4 py-5 text-[11px] text-slate-400">
        Run an AI macro that produces structured diagnostics to populate the floating block diagram viewer.
      </div>
    );
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const levelBands = Array.from({ length: Math.max(depthCount, 1) }, (_, index) => ({
    index,
    y: DIAGRAM_MARGIN_Y - 22 + index * VERTICAL_GAP,
    label: index === 0 ? 'ROOT' : `LEVEL ${index}`,
  }));

  const clampZoom = (value: number) => Math.min(2.4, Math.max(0.45, Number(value.toFixed(3))));

  const applyZoom = (nextZoom: number, anchorX = VIEWBOX_WIDTH / 2, anchorY = VIEWBOX_HEIGHT / 2) => {
    const clamped = clampZoom(nextZoom);
    setPan((current) => ({
      x: Number((anchorX - ((anchorX - current.x) * (clamped / zoom))).toFixed(2)),
      y: Number((anchorY - ((anchorY - current.y) * (clamped / zoom))).toFixed(2)),
    }));
    setZoom(clamped);
  };

  const handleWheel: React.WheelEventHandler<SVGSVGElement> = (event) => {
    event.preventDefault();
    const svg = surfaceRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const anchorX = ((event.clientX - rect.left) / rect.width) * VIEWBOX_WIDTH;
    const anchorY = ((event.clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT;
    const zoomFactor = event.deltaY < 0 ? 1.08 : 0.92;
    applyZoom(zoom * zoomFactor, anchorX, anchorY);
  };

  const handlePointerDown: React.PointerEventHandler<SVGSVGElement> = (event) => {
    if (event.button !== 0) return;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove: React.PointerEventHandler<SVGSVGElement> = (event) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }
    const svg = surfaceRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = VIEWBOX_WIDTH / rect.width;
    const scaleY = VIEWBOX_HEIGHT / rect.height;
    setPan({
      x: Number((dragState.originX + (event.clientX - dragState.startX) * scaleX).toFixed(2)),
      y: Number((dragState.originY + (event.clientY - dragState.startY) * scaleY).toFixed(2)),
    });
  };

  const handlePointerUp: React.PointerEventHandler<SVGSVGElement> = (event) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }
    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleResetView = () => {
    setZoom(centeredView.zoom);
    setPan(centeredView.pan);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="grid gap-2 md:grid-cols-4">
        <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/8 px-3 py-2">
          <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-200">Root</div>
          <div className="mt-1 text-[11px] font-bold text-slate-100">{diagnostics.rootEntity}</div>
        </div>
        <div className="rounded-lg border border-violet-400/20 bg-violet-500/8 px-3 py-2">
          <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-violet-200">Hierarchy Levels</div>
          <div className="mt-1 text-[11px] font-bold text-slate-100">{depthCount}</div>
        </div>
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/8 px-3 py-2">
          <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-200">Signals Routed</div>
          <div className="mt-1 text-[11px] font-bold text-slate-100">{diagnostics.selectedSignals.length}</div>
        </div>
        <div className="rounded-lg border border-amber-400/20 bg-amber-500/8 px-3 py-2">
          <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-200">Focus Entities</div>
          <div className="mt-1 text-[11px] font-bold text-slate-100">{diagnostics.focusEntities.length}</div>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-xl border border-brand-outline-variant/20 bg-[#050913]">
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-lg border border-brand-outline-variant/30 bg-[#08101d]/92 px-2 py-1.5 backdrop-blur">
          <button
            type="button"
            onClick={() => applyZoom(zoom / 1.12)}
            className="rounded border border-brand-outline-variant/30 bg-brand-surface-high p-1 text-slate-300 transition-colors hover:bg-brand-surface hover:text-white cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut size={12} />
          </button>
          <div className="min-w-[52px] text-center text-[10px] font-bold text-brand-cyan">{Math.round(zoom * 100)}%</div>
          <button
            type="button"
            onClick={() => applyZoom(zoom * 1.12)}
            className="rounded border border-brand-outline-variant/30 bg-brand-surface-high p-1 text-slate-300 transition-colors hover:bg-brand-surface hover:text-white cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn size={12} />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="rounded border border-brand-outline-variant/30 bg-brand-surface-high p-1 text-slate-300 transition-colors hover:bg-brand-surface hover:text-white cursor-pointer"
            title="Reset diagram view"
          >
            <RotateCcw size={12} />
          </button>
        </div>

        <svg
          ref={surfaceRef}
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="h-full w-full cursor-grab active:cursor-grabbing touch-none select-none"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <defs>
            <linearGradient id="diagramBackground" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#071021" />
              <stop offset="100%" stopColor="#030711" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="url(#diagramBackground)" />

          <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
            {levelBands.map((band) => (
              <g key={`band-${band.index}`}>
                <rect
                  x="18"
                  y={band.y}
                  width={VIEWBOX_WIDTH - 36}
                  height={band.index === 0 ? 108 : 118}
                  rx="26"
                  fill={band.index % 2 === 0 ? 'rgba(12, 18, 36, 0.55)' : 'rgba(7, 13, 28, 0.52)'}
                  stroke="rgba(148,163,184,0.08)"
                />
                <text x="38" y={band.y + 24} fontSize="11" fontWeight="700" fill="#64748b" letterSpacing="3">
                  {band.label}
                </text>
              </g>
            ))}

            {edges.map((edge, index) => {
              const from = nodeById.get(edge.from);
              const to = nodeById.get(edge.to);
              if (!from || !to) {
                return null;
              }

              const tone = getEdgeTone(edge.tone);
              const startX = from.x + from.width / 2;
              const startY = from.y + from.height;
              const endX = to.x + to.width / 2;
              const endY = to.y;
              const midY = Math.round((startY + endY) / 2);
              const midX = Math.round((startX + endX) / 2);

              return (
                <g key={`${edge.from}-${edge.to}-${index}`}>
                  <path
                    d={`M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`}
                    fill="none"
                    stroke={tone.stroke}
                    strokeWidth={tone.width}
                    strokeOpacity={tone.opacity}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {edge.label && (
                    <>
                      <rect
                        x={midX - 38}
                        y={midY - 13}
                        width="76"
                        height="18"
                        rx="9"
                        fill="rgba(5,10,18,0.92)"
                        stroke="rgba(148,163,184,0.15)"
                      />
                      <text x={midX} y={midY} textAnchor="middle" fontSize="9" fontWeight="700" fill="#cbd5e1">
                        {truncateLabel(edge.label, 14)}
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {nodes.map((node) => {
              const tone = getNodeTone(node.tone, node.highlighted);
              const lines = wrapLabel(node.label, node.tone === 'signal' ? 18 : 16);
              const detail = truncateLabel(node.detail, node.tone === 'signal' ? 24 : 22);
              return (
                <g key={node.id} style={{ filter: tone.shadow }}>
                  <path
                    d=""
                  />
                  <rect
                    x={node.x}
                    y={node.y}
                    rx={node.tone === 'signal' ? 18 : 22}
                    ry={node.tone === 'signal' ? 18 : 22}
                    width={node.width}
                    height={node.height}
                    fill={tone.fill}
                    fillOpacity="0.96"
                    stroke={tone.stroke}
                    strokeWidth="2.2"
                  />
                  <rect
                    x={node.x + 10}
                    y={node.y + 10}
                    rx="14"
                    ry="14"
                    width={node.width - 20}
                    height={node.height - 20}
                    fill="rgba(255,255,255,0.02)"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <text
                    x={node.x + node.width / 2}
                    y={node.y + 30}
                    textAnchor="middle"
                    fontSize={node.tone === 'root' ? '15' : '14'}
                    fontWeight="700"
                    fill={tone.title}
                  >
                    {lines.map((line, index) => (
                      <tspan key={`${node.id}-${index}`} x={node.x + node.width / 2} dy={index === 0 ? 0 : 16}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                  <text
                    x={node.x + node.width / 2}
                    y={node.y + node.height - 16}
                    textAnchor="middle"
                    fontSize="11"
                    fill={tone.detail}
                  >
                    {detail}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <div className="rounded-lg border border-brand-outline-variant/20 bg-brand-surface-low px-3 py-2">
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-200">
            <GitBranch size={11} />
            <span>Hierarchy</span>
          </div>
          <div className="mt-1 text-[10px] leading-relaxed text-slate-300">
            Blocks are now grouped beneath their actual parent, with one band per VHDL hierarchy level.
          </div>
        </div>
        <div className="rounded-lg border border-brand-outline-variant/20 bg-brand-surface-low px-3 py-2">
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-violet-200">
            <Layers size={11} />
            <span>Instances</span>
          </div>
          <div className="mt-1 text-[10px] leading-relaxed text-slate-300">
            Connection labels show the instance path or instance name used to instantiate the child block.
          </div>
        </div>
        <div className="rounded-lg border border-brand-outline-variant/20 bg-brand-surface-low px-3 py-2">
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-200">
            <RadioTower size={11} />
            <span>Signals</span>
          </div>
          <div className="mt-1 text-[10px] leading-relaxed text-slate-300">
            Signal blocks attach beneath the deepest related entity so waveform context stays close to the owning block.
          </div>
        </div>
      </div>
    </div>
  );
};
