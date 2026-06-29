import { useMemo } from 'react';
import { getHazardFindingDisplayId, getProtocolFrameDisplayId, type AIWorkspaceReport } from '../aiReport';
import type { Signal, WaveformIssueMarker } from '../types';

export type MarkerFamily = 'hazard' | 'protocol' | 'clockReset' | 'fsm';

function extractHazardTicks(detail: string, fallbackStartTick: number | null, fallbackEndTick: number | null) {
  const explicitRange = detail.match(/ticks?\s+(\d+)\s*[-–]\s*(\d+)/i);
  if (explicitRange) {
    return {
      startTick: Number(explicitRange[1]),
      endTick: Number(explicitRange[2]),
    };
  }

  const explicitTickMatches = Array.from(detail.matchAll(/\btick[s]?\s+(\d+)\b/gi))
    .map((match) => Number(match[1]))
    .filter((tick) => Number.isFinite(tick));
  if (explicitTickMatches.length > 0) {
    return {
      startTick: Math.min(...explicitTickMatches),
      endTick: Math.max(...explicitTickMatches),
    };
  }

  return {
    startTick: fallbackStartTick,
    endTick: fallbackEndTick,
  };
}

export function useWaveformIssueMarkers(params: {
  latestAiReport: AIWorkspaceReport | null;
  simulatedSignals: Signal[];
  simulationLength: number;
  hazardSeverityFilter: 'all' | 'high' | 'medium' | 'low';
  markerDisplayLimit: 'all' | 25 | 50 | 100;
  markerFamilyVisibility: Record<MarkerFamily, boolean>;
}) {
  const {
    latestAiReport,
    simulatedSignals,
    simulationLength,
    hazardSeverityFilter,
    markerDisplayLimit,
    markerFamilyVisibility,
  } = params;

  const rawHazardMarkers = useMemo<WaveformIssueMarker[]>(() => {
    if (latestAiReport?.meta.macroId !== 'inspect_race_hazards' && latestAiReport?.meta.macroId !== 'custom_query') {
      return [];
    }

    const findings = Array.isArray(latestAiReport.meta.hazardFindings)
      ? latestAiReport.meta.hazardFindings
      : [];

    return findings
      .map((finding, index) => {
        const title = typeof finding.title === 'string' ? finding.title : 'Hazard finding';
        const detail = typeof finding.detail === 'string' ? finding.detail : '';
        const rawSignalNames = Array.isArray(finding.signalNames) ? finding.signalNames : [];
        const titleSignalMatch = title.match(/^([^:]+):/);
        const inferredSignalNames = titleSignalMatch?.[1] ? [titleSignalMatch[1].trim()] : [];
        const signalNames = Array.from(new Set(
          [...rawSignalNames, ...inferredSignalNames]
            .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
        ));
        const relatedTicks = Array.isArray(finding.relatedTicks)
          ? finding.relatedTicks.filter((tick): tick is number => typeof tick === 'number' && Number.isFinite(tick))
          : [];
        const parsedTicks = extractHazardTicks(
          detail,
          typeof finding.startTick === 'number' ? finding.startTick : null,
          typeof finding.endTick === 'number' ? finding.endTick : null,
        );

        return {
          id: getHazardFindingDisplayId(finding, index),
          kind: 'hazard',
          severity: finding.severity === 'high' || finding.severity === 'medium' ? finding.severity : 'low',
          title,
          detail,
          signalNames,
          startTick: parsedTicks.startTick,
          endTick: parsedTicks.endTick,
          relatedTicks,
        };
      })
      .filter((finding) => finding.startTick !== null || finding.relatedTicks.length > 0);
  }, [latestAiReport]);

  const clusteredHazardMarkers = useMemo<WaveformIssueMarker[]>(() => {
    const clusterGapTicks = 2;
    const severityRank: Record<'high' | 'medium' | 'low', number> = { high: 0, medium: 1, low: 2 };
    const normalizeName = (value: string) => value.trim().toLowerCase();

    const sorted = [...rawHazardMarkers].sort((left, right) => {
      const leftTick = left.startTick ?? left.relatedTicks[0] ?? 0;
      const rightTick = right.startTick ?? right.relatedTicks[0] ?? 0;
      return severityRank[left.severity] - severityRank[right.severity]
        || leftTick - rightTick
        || left.title.localeCompare(right.title);
    });

    const clusters: WaveformIssueMarker[] = [];

    sorted.forEach((marker, index) => {
      const normalizedSignals = Array.from(new Set(marker.signalNames.map(normalizeName))).sort();
      const markerStart = marker.startTick ?? marker.relatedTicks[0] ?? 0;
      const markerEnd = marker.endTick ?? markerStart;
      const lastCluster = clusters[clusters.length - 1];

      if (lastCluster) {
        const clusterSignals = Array.from(new Set(lastCluster.signalNames.map(normalizeName))).sort();
        const clusterEnd = lastCluster.endTick ?? lastCluster.startTick ?? 0;
        const sameSeverity = lastCluster.severity === marker.severity;
        const sameSignals = clusterSignals.join('|') === normalizedSignals.join('|');
        const closeInTime = markerStart <= clusterEnd + clusterGapTicks;

        if (sameSeverity && sameSignals && closeInTime) {
          const nextClusterSize = (lastCluster.clusterSize || 1) + 1;
          lastCluster.startTick = Math.min(lastCluster.startTick ?? markerStart, markerStart);
          lastCluster.endTick = Math.max(lastCluster.endTick ?? markerEnd, markerEnd);
          lastCluster.relatedTicks = Array.from(new Set([...lastCluster.relatedTicks, ...marker.relatedTicks])).sort((a, b) => a - b);
          lastCluster.clusterSize = nextClusterSize;
          lastCluster.detail = nextClusterSize === 2
            ? `${lastCluster.detail} Combined with another nearby ${marker.severity} finding on the same signal set.`
            : `${lastCluster.detail} Combined with ${nextClusterSize - 1} nearby ${marker.severity} findings on the same signal set.`;
          lastCluster.title = normalizedSignals.length > 0
            ? `${marker.signalNames[0] || lastCluster.signalNames[0]}: ${nextClusterSize} nearby ${marker.severity} findings`
            : `${nextClusterSize} nearby ${marker.severity} findings`;
          return;
        }
      }

      clusters.push({
        ...marker,
        id: `${marker.id}-cluster-${index}`,
        clusterSize: marker.clusterSize || 1,
      });
    });

    return clusters;
  }, [rawHazardMarkers]);

  const activeHazardMarkers = useMemo(() => {
    if (hazardSeverityFilter === 'all') {
      return clusteredHazardMarkers;
    }
    return clusteredHazardMarkers.filter((marker) => marker.severity === hazardSeverityFilter);
  }, [clusteredHazardMarkers, hazardSeverityFilter]);

  const activeProtocolMarkers = useMemo<WaveformIssueMarker[]>(() => {
    const protocolFrames = Array.isArray(latestAiReport?.meta.protocolFrames)
      ? latestAiReport.meta.protocolFrames
      : [];

    return protocolFrames
      .map((frame, index) => {
        const channelName = typeof frame.channel === 'string' ? frame.channel.trim() : '';
        const normalizedChannel = channelName.replace(/\s+heuristic$/i, '').trim();
        const protocol = frame.protocol === 'SPI' || frame.protocol === 'I2C' || frame.protocol === 'UART'
          ? frame.protocol
          : 'SPI';
        return {
          id: getProtocolFrameDisplayId(frame, index),
          kind: 'protocol',
          severity: 'low',
          title: `[${protocol}] ${frame.summary}`,
          detail: frame.detail,
          signalNames: normalizedChannel ? [normalizedChannel] : [],
          startTick: typeof frame.startTick === 'number' ? frame.startTick : null,
          endTick: typeof frame.endTick === 'number' ? frame.endTick : null,
          relatedTicks: [
            ...(typeof frame.startTick === 'number' ? [frame.startTick] : []),
            ...(typeof frame.endTick === 'number' ? [frame.endTick] : []),
          ],
        } satisfies WaveformIssueMarker;
      })
      .filter((marker) => marker.startTick !== null || marker.relatedTicks.length > 0);
  }, [latestAiReport]);

  const activeClockResetMarkers = useMemo<WaveformIssueMarker[]>(() => {
    if (latestAiReport?.meta.macroId !== 'verify_clock_reset_sequence' && latestAiReport?.meta.macroId !== 'custom_query') {
      return [];
    }

    const toLogicValue = (value: number | string): number | null => {
      if (typeof value === 'number') {
        return value === 0 || value === 1 ? value : null;
      }
      const normalized = String(value).trim().toUpperCase();
      if (normalized === '0' || normalized === 'L' || normalized === 'LOW') return 0;
      if (normalized === '1' || normalized === 'H' || normalized === 'HIGH') return 1;
      return null;
    };

    const visibleSignals = simulatedSignals.filter((signal) => signal.visible);
    const clockSignals = visibleSignals.filter((signal) => (
      signal.type === 'clock' || /\b(clk|clock)\b/i.test(signal.name)
    ));
    const resetSignals = visibleSignals.filter((signal) => (
      /\b(rst|reset|nreset|nrst|reset_n|rst_n)\b/i.test(signal.name)
    ));

    const markers: WaveformIssueMarker[] = [];
    const firstClockEdges: Array<{ name: string; tick: number }> = [];
    const resetReleaseTicks: Array<{ name: string; tick: number }> = [];

    clockSignals.forEach((signal) => {
      const transitions: number[] = [];
      for (let index = 1; index < signal.values.length; index += 1) {
        const previous = toLogicValue(signal.values[index - 1] as number | string);
        const current = toLogicValue(signal.values[index] as number | string);
        if (previous !== null && current !== null && previous !== current) {
          transitions.push(index);
        }
      }

      if (transitions.length === 0) {
        markers.push({
          id: `clock-reset-clock-inactive-${signal.id}`,
          kind: 'clockReset',
          severity: 'medium',
          title: `${signal.name}: no clock transitions detected`,
          detail: 'The observed waveform did not show any clean 0/1 clock toggles for this signal.',
          signalNames: [signal.name],
          startTick: 0,
          endTick: Math.max(0, simulationLength - 1),
          relatedTicks: [],
        });
        return;
      }

      firstClockEdges.push({ name: signal.name, tick: transitions[0] });
      const intervals = transitions.slice(1).map((tick, index) => tick - transitions[index]);
      const minInterval = intervals.length > 0 ? Math.min(...intervals) : 0;
      const maxInterval = intervals.length > 0 ? Math.max(...intervals) : 0;
      const averageInterval = intervals.length > 0
        ? intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
        : 0;
      const unstable = intervals.length > 1 && (maxInterval - minInterval > 2);

      markers.push({
        id: `clock-reset-clock-${signal.id}`,
        kind: 'clockReset',
        severity: unstable ? 'medium' : 'low',
        title: unstable ? `${signal.name}: irregular clock cadence` : `${signal.name}: clock activity`,
        detail: unstable
          ? `Clock transitions were observed from tick ${transitions[0]} to ${transitions[transitions.length - 1]}, but the interval varied between ${minInterval} and ${maxInterval} ticks.`
          : `Clock transitions were observed from tick ${transitions[0]} to ${transitions[transitions.length - 1]} with an average interval of ${averageInterval.toFixed(1)} ticks.`,
        signalNames: [signal.name],
        startTick: transitions[0],
        endTick: transitions[transitions.length - 1],
        relatedTicks: transitions.slice(0, 12),
      });
    });

    resetSignals.forEach((signal) => {
      const normalizedName = signal.name.toLowerCase();
      const activeLow = /(nreset|nrst|reset_n|rst_n)/i.test(normalizedName);
      const assertedValue = activeLow ? 0 : 1;
      const logicalValues = signal.values.map((value) => toLogicValue(value as number | string));
      const assertedSpans: Array<{ start: number; end: number }> = [];
      let spanStart: number | null = null;

      logicalValues.forEach((value, index) => {
        if (value === assertedValue && spanStart === null) {
          spanStart = index;
        }
        if (value !== assertedValue && spanStart !== null) {
          assertedSpans.push({ start: spanStart, end: index - 1 });
          spanStart = null;
        }
      });
      if (spanStart !== null) {
        assertedSpans.push({ start: spanStart, end: logicalValues.length - 1 });
      }

      if (assertedSpans.length === 0) {
        return;
      }

      const firstSpan = assertedSpans[0];
      markers.push({
        id: `clock-reset-assert-${signal.id}`,
        kind: 'clockReset',
        severity: 'low',
        title: `${signal.name}: reset asserted`,
        detail: `Reset stayed asserted from tick ${firstSpan.start} through tick ${firstSpan.end}${activeLow ? ' (active-low)' : ''}.`,
        signalNames: [signal.name],
        startTick: firstSpan.start,
        endTick: firstSpan.end,
        relatedTicks: [firstSpan.start, firstSpan.end],
      });

      if (firstSpan.end < logicalValues.length - 1) {
        resetReleaseTicks.push({ name: signal.name, tick: firstSpan.end + 1 });
        markers.push({
          id: `clock-reset-release-${signal.id}`,
          kind: 'clockReset',
          severity: 'low',
          title: `${signal.name}: reset released`,
          detail: `Reset deasserted at tick ${firstSpan.end + 1}${activeLow ? ' from low to high' : ' from high to low'}.`,
          signalNames: [signal.name],
          startTick: firstSpan.end,
          endTick: Math.min(simulationLength - 1, firstSpan.end + 1),
          relatedTicks: [firstSpan.end + 1],
        });
      }

      if (assertedSpans.length > 1) {
        const laterTicks = assertedSpans.slice(1).map((span) => span.start);
        markers.push({
          id: `clock-reset-repeat-${signal.id}`,
          kind: 'clockReset',
          severity: 'medium',
          title: `${signal.name}: repeated reset assertions`,
          detail: `Additional reset assertions were observed after startup at ticks ${laterTicks.join(', ')}.`,
          signalNames: [signal.name],
          startTick: laterTicks[0] ?? null,
          endTick: assertedSpans[assertedSpans.length - 1]?.end ?? laterTicks[0] ?? null,
          relatedTicks: laterTicks,
        });
      }
    });

    if (firstClockEdges.length > 0 && resetReleaseTicks.length > 0) {
      const firstClock = firstClockEdges.reduce((best, current) => current.tick < best.tick ? current : best);
      const firstResetRelease = resetReleaseTicks.reduce((best, current) => current.tick < best.tick ? current : best);
      markers.push({
        id: 'clock-reset-startup-order',
        kind: 'clockReset',
        severity: firstResetRelease.tick <= firstClock.tick ? 'medium' : 'low',
        title: 'Clock/reset startup ordering',
        detail: firstResetRelease.tick <= firstClock.tick
          ? `Reset (${firstResetRelease.name}) released at tick ${firstResetRelease.tick} before the first detected clock transition on ${firstClock.name} at tick ${firstClock.tick}.`
          : `First detected clock transition on ${firstClock.name} happened at tick ${firstClock.tick}, and reset (${firstResetRelease.name}) released at tick ${firstResetRelease.tick}.`,
        signalNames: [firstClock.name, firstResetRelease.name],
        startTick: Math.min(firstClock.tick, firstResetRelease.tick),
        endTick: Math.max(firstClock.tick, firstResetRelease.tick),
        relatedTicks: [firstClock.tick, firstResetRelease.tick],
      });
    }

    return markers.sort((left, right) => {
      const leftTick = left.startTick ?? left.relatedTicks[0] ?? 0;
      const rightTick = right.startTick ?? right.relatedTicks[0] ?? 0;
      return leftTick - rightTick || left.title.localeCompare(right.title);
    });
  }, [latestAiReport, simulatedSignals, simulationLength]);

  const activeFsmMarkers = useMemo<WaveformIssueMarker[]>(() => {
    if (latestAiReport?.meta.macroId !== 'explain_fsm_behavior' && latestAiReport?.meta.macroId !== 'custom_query') {
      return [];
    }

    const normalizeStateValue = (value: number | string): string | null => {
      if (typeof value === 'number') {
        return String(value);
      }
      const normalized = String(value).trim();
      return normalized.length > 0 ? normalized : null;
    };

    const visibleSignals = simulatedSignals.filter((signal) => signal.visible);
    const candidateSignals = visibleSignals.filter((signal) => (
      /\b(state|fsm|phase|mode|step|status)\b/i.test(signal.name)
      || signal.format === 'ascii'
      || signal.type === 'decoder'
    ));

    const markers: WaveformIssueMarker[] = [];

    candidateSignals.forEach((signal) => {
      const segments: Array<{ start: number; end: number; value: string }> = [];
      let currentValue: string | null = null;
      let segmentStart = 0;

      signal.values.forEach((rawValue, index) => {
        const normalizedValue = normalizeStateValue(rawValue as number | string);
        if (normalizedValue === null) {
          return;
        }
        if (currentValue === null) {
          currentValue = normalizedValue;
          segmentStart = index;
          return;
        }
        if (normalizedValue !== currentValue) {
          segments.push({ start: segmentStart, end: Math.max(segmentStart, index - 1), value: currentValue });
          currentValue = normalizedValue;
          segmentStart = index;
        }
      });

      if (currentValue !== null) {
        segments.push({ start: segmentStart, end: Math.max(segmentStart, signal.values.length - 1), value: currentValue });
      }

      if (segments.length === 0) {
        return;
      }

      segments.forEach((segment, index) => {
        markers.push({
          id: `fsm-state-window-${signal.id}-${index}`,
          kind: 'fsm',
          severity: 'low',
          title: `${signal.name}: state ${segment.value}`,
          detail: `State-like signal ${signal.name} remained at ${segment.value} from tick ${segment.start} through tick ${segment.end}.`,
          signalNames: [signal.name],
          startTick: segment.start,
          endTick: segment.end,
          relatedTicks: [segment.start, segment.end],
        });

        if (index === 0) {
          return;
        }

        const previous = segments[index - 1];
        markers.push({
          id: `fsm-transition-${signal.id}-${index}`,
          kind: 'fsm',
          severity: 'medium',
          title: `${signal.name}: ${previous.value} -> ${segment.value}`,
          detail: `State-like signal ${signal.name} transitioned from ${previous.value} to ${segment.value} at tick ${segment.start}.`,
          signalNames: [signal.name],
          startTick: segment.start,
          endTick: segment.start,
          relatedTicks: [segment.start],
        });
      });
    });

    return markers.sort((left, right) => {
      const leftTick = left.startTick ?? left.relatedTicks[0] ?? 0;
      const rightTick = right.startTick ?? right.relatedTicks[0] ?? 0;
      return leftTick - rightTick || left.title.localeCompare(right.title);
    });
  }, [latestAiReport, simulatedSignals]);

  const filteredIssueMarkers = useMemo<WaveformIssueMarker[]>(() => {
    const macroId = latestAiReport?.meta.macroId;
    if (macroId === 'protocol_decoder_details' || macroId === 'summarize_protocol_timeline') {
      return activeProtocolMarkers;
    }
    if (macroId === 'explain_fsm_behavior') {
      return activeFsmMarkers;
    }
    if (macroId === 'verify_clock_reset_sequence') {
      return activeClockResetMarkers;
    }
    if (macroId === 'inspect_race_hazards') {
      return activeHazardMarkers;
    }
    if (macroId === 'custom_query') {
      const familyPriority: Record<MarkerFamily, number> = {
        hazard: 0,
        protocol: 1,
        clockReset: 2,
        fsm: 3,
      };
      return [
        ...clusteredHazardMarkers,
        ...activeProtocolMarkers,
        ...activeClockResetMarkers,
        ...activeFsmMarkers,
      ].sort((left, right) => {
        const leftTick = left.startTick ?? left.relatedTicks[0] ?? 0;
        const rightTick = right.startTick ?? right.relatedTicks[0] ?? 0;
        const leftFamily = (left.kind || 'hazard') as MarkerFamily;
        const rightFamily = (right.kind || 'hazard') as MarkerFamily;
        return leftTick - rightTick
          || familyPriority[leftFamily] - familyPriority[rightFamily]
          || left.title.localeCompare(right.title);
      });
    }
    return [];
  }, [activeClockResetMarkers, activeFsmMarkers, activeHazardMarkers, activeProtocolMarkers, clusteredHazardMarkers, latestAiReport]);

  const markerFamilyCounts = useMemo<Record<MarkerFamily, number>>(() => {
    const counts: Record<MarkerFamily, number> = {
      hazard: 0,
      protocol: 0,
      clockReset: 0,
      fsm: 0,
    };
    filteredIssueMarkers.forEach((marker) => {
      const kind = (marker.kind || 'hazard') as MarkerFamily;
      counts[kind] += 1;
    });
    return counts;
  }, [filteredIssueMarkers]);

  const familyFilteredIssueMarkers = useMemo<WaveformIssueMarker[]>(() => (
    filteredIssueMarkers.filter((marker) => markerFamilyVisibility[(marker.kind || 'hazard') as MarkerFamily])
  ), [filteredIssueMarkers, markerFamilyVisibility]);

  const visibleIssueMarkers = useMemo<WaveformIssueMarker[]>(() => {
    if (markerDisplayLimit === 'all') {
      return familyFilteredIssueMarkers;
    }
    return familyFilteredIssueMarkers.slice(0, markerDisplayLimit);
  }, [familyFilteredIssueMarkers, markerDisplayLimit]);

  const hazardFilterCounts = useMemo<Record<'all' | 'high' | 'medium' | 'low', number>>(() => ({
    all: rawHazardMarkers.length,
    high: rawHazardMarkers.filter((marker) => marker.severity === 'high').length,
    medium: rawHazardMarkers.filter((marker) => marker.severity === 'medium').length,
    low: rawHazardMarkers.filter((marker) => marker.severity === 'low').length,
  }), [rawHazardMarkers]);

  return {
    rawHazardMarkers,
    filteredIssueMarkers,
    markerFamilyCounts,
    visibleIssueMarkers,
    hazardFilterCounts,
  };
}
