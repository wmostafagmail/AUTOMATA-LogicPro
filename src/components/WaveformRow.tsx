import React from 'react';
import { Signal } from '../types';

interface WaveformRowProps {
  signal: Signal;
  length: number;
  zoom: number;
  tickWidth: number; // Width in pixels of one simulation tick
  hoveredTick: number | null;
  glitchInjectionEnabled: boolean;
  onSetValues: (newValues: (number | string)[]) => void;
  onGridClick: (tick: number, e: React.MouseEvent) => void;
}

export const WaveformRow: React.FC<WaveformRowProps> = ({
  signal,
  length,
  zoom,
  tickWidth,
  hoveredTick,
  glitchInjectionEnabled,
  onSetValues,
  onGridClick
}) => {
  const rowHeight = 26;
  const totalWidth = length * tickWidth;

  const formatBusValue = (value: number | string): string => {
    if (typeof value !== 'string') {
      return String(value);
    }

    if (signal.format === 'hex' && /^[01XZ]+$/i.test(value)) {
      if (/[XZ]/i.test(value)) {
        return `0x${value}`;
      }
      const width = Math.max(1, Math.ceil(value.length / 4));
      return `0x${parseInt(value, 2).toString(16).toUpperCase().padStart(width, '0')}`;
    }

    return value;
  };

  const wireColor = signal.color || '#00e5ff';
  const lowColor = '#1e293b'; // Slate gray logic low

  // Generate SVG elements for the signal wave trace
  const renderTrace = () => {
    const values = signal.values;

    if (signal.type === 'wire' || signal.type === 'clock' || signal.type === 'gate') {
      // Logic wave trace path
      const points: string[] = [];
      const fillPoints: string[] = [];

      // Starting point
      let prevVal = Number(values[0] ?? 0);
      let y0 = prevVal === 1 ? 3 : (prevVal === -1 ? 13 : 23);
      
      points.push(`M 0 ${y0}`);
      fillPoints.push(`M 0 23 L 0 ${y0}`);

      for (let t = 1; t < length; t++) {
        const x = t * tickWidth;
        const val = Number(values[t] ?? 0);
        const y = val === 1 ? 3 : (val === -1 ? 13 : 23);

        // Sharp edge transition
        if (val !== prevVal) {
          points.push(`L ${x} ${y0}`);
          points.push(`L ${x} ${y}`);
          
          fillPoints.push(`L ${x} ${y0}`);
          fillPoints.push(`L ${x} ${y}`);
        } else {
          points.push(`L ${x} ${y}`);
          fillPoints.push(`L ${x} ${y}`);
        }
        
        y0 = y;
        prevVal = val;
      }

      // Cap off the path
      const finalX = length * tickWidth;
      points.push(`L ${finalX} ${y0}`);
      fillPoints.push(`L ${finalX} ${y0}`);
      fillPoints.push(`L ${finalX} 23 Z`);

      return (
        <g id={`trace-group-${signal.id}`}>
          {/* Subtle Ambient Area Glow under High State for modern lab-feel */}
          <path
            d={fillPoints.join(' ')}
            fill={wireColor}
            fillOpacity={0.07}
            stroke="none"
          />

          {/* Dotted Zero line */}
          <line
            x1={0}
            y1={23}
            x2={totalWidth}
            y2={23}
            stroke="#1b2438"
            strokeWidth={1}
            strokeDasharray="2,2"
          />

          {/* actual line trace */}
          <path
            d={points.join(' ')}
            stroke={wireColor}
            strokeWidth={1.8}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="bevel"
          />

          {/* High-Z / Floating signal indicator */}
          {values.map((v, idx) => {
            if (v === -1) {
              const xStart = idx * tickWidth;
              return (
                <line
                  key={`hz-${idx}`}
                  x1={xStart}
                  y1={13}
                  x2={xStart + tickWidth}
                  y2={13}
                  stroke="#ef4444" // orange-red for floating
                  strokeWidth={2}
                  strokeDasharray="3,2"
                />
              );
            }
            return null;
          })}
        </g>
      );
    } else {
      // Render multi-bit Bus or Protocol Decoder (Hexagonal segmented capsules)
      const busElements: React.JSX.Element[] = [];
      const values = signal.values;

      let startIdx = 0;
      let curVal = values[0];

      for (let t = 1; t <= length; t++) {
        const atEnd = t === length;
        const valChanged = !atEnd && values[t] !== curVal;

        if (atEnd || valChanged) {
          // Commit the group
          const xStart = startIdx * tickWidth;
          const xEnd = t * tickWidth;
          const w = xEnd - xStart;

          if (curVal !== undefined && curVal !== '') {
            const h = rowHeight;
            const topY = 3;
            const botY = 23;
            const midY = 13;
            const cornerRad = Math.min(5, w / 2);

            // Hexagon SVG Path logic
            const pointsList = [
              `${xStart},${midY}`,
              `${xStart + cornerRad},${topY}`,
              `${xEnd - cornerRad},${topY}`,
              `${xEnd},${midY}`,
              `${xEnd - cornerRad},${botY}`,
              `${xStart + cornerRad},${botY}`
            ].join(' ');

            // Check if hovered
            const isHovered = hoveredTick !== null && hoveredTick >= startIdx && hoveredTick < t;

            busElements.push(
              <g key={`bus-${startIdx}-${t}`} className="group/bus cursor-help">
                <polygon
                  points={pointsList}
                  fill={isHovered ? '#1e3a5f' : '#1e1e38'}
                  stroke={wireColor}
                  strokeWidth={1.2}
                />
                
                {/* Render the decoded String / Hex value inside */}
                {w > 16 && (
                  <text
                    x={xStart + w / 2}
                    y={16}
                    textAnchor="middle"
                    fill="#e2e8f0"
                    className="font-mono text-[12px] select-none font-medium text-center"
                    style={{ maxWidth: w - 8 }}
                  >
                    {(() => {
                      const displayValue = formatBusValue(curVal);
                      return w > 48 ? displayValue : displayValue.substring(0, 5);
                    })()}
                  </text>
                )}
                
                {/* Tooltip on Hover */}
                <title>{`Time bounds: ${startIdx * 5} - ${t * 5}ns\nDecoding: ${formatBusValue(curVal)}`}</title>
              </g>
            );
          } else {
            // Drawn as tri-state idle parallel lines
            busElements.push(
              <g key={`bus-idle-${startIdx}-${t}`}>
                <line
                  x1={xStart}
                  y1={3}
                  x2={xEnd}
                  y2={3}
                  stroke="#2d3748"
                  strokeWidth={1}
                />
                <line
                  x1={xStart}
                  y1={23}
                  x2={xEnd}
                  y2={23}
                  stroke="#2d3748"
                  strokeWidth={1}
                />
                {/* Tri-state crossed line indicators */}
                <line
                  x1={xStart}
                  y1={3}
                  x2={xStart + 5}
                  y2={23}
                  stroke="#1a1e2e"
                  strokeWidth={1}
                />
              </g>
            );
          }

          startIdx = t;
          curVal = values[t];
        }
      }

      return <g>{busElements}</g>;
    }
  };

  // Click on waveform to toggle logical value
  const handleSvgInteraction = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedTick = Math.floor(clickX / tickWidth);
    
    if (clickedTick >= 0 && clickedTick < length) {
      if (glitchInjectionEnabled && signal.type === 'wire') {
        // Toggle Low <-> High <-> High-Z
        const newValues = [...signal.values];
        const val = Number(newValues[clickedTick] ?? 0);
        let nextVal = 1;
        if (val === 1) nextVal = 0;
        else if (val === 0) nextVal = -1;
        else nextVal = 1; // back to high
        
        newValues[clickedTick] = nextVal;
        onSetValues(newValues);
      }
      onGridClick(clickedTick, e);
    }
  };

  return (
    <div
      className="relative border-b border-brand-outline-variant/30 bg-[#070b14] flex-none transition-all"
      style={{ height: rowHeight }}
    >
      <svg
        width={totalWidth}
        height={rowHeight}
        className="block select-none peer flex-none"
        onClick={handleSvgInteraction}
      >
        {/* Draw subtle grid columns */}
        {Array.from({ length: Math.ceil(length / 10) }).map((_, idx) => {
          const t = idx * 10;
          const x = t * tickWidth;
          return (
            <line
              key={`grid-line-${t}`}
              x1={x}
              y1={0}
              x2={x}
              y2={rowHeight}
              stroke="#0f172a"
              strokeWidth={1}
            />
          );
        })}

        {/* Highlight hovered tick vertical band */}
        {hoveredTick !== null && (
          <rect
            x={hoveredTick * tickWidth}
            y={0}
            width={tickWidth}
            height={rowHeight}
            fill="#ffffff"
            fillOpacity={0.03}
            pointerEvents="none"
          />
        )}

        {/* Waveform Trace */}
        {renderTrace()}
      </svg>
    </div>
  );
};
