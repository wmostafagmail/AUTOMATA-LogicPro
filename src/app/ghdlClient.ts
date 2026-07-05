import { apiFetch } from '../api';
import type { GhdlProjectInfo, GhdlRunResponse, GhdlStatus } from '../types';

export async function fetchGhdlModalData(projectPath: string) {
  const [statusResponse, infoResponse] = await Promise.all([
    apiFetch('/api/ghdl/status'),
    apiFetch('/api/ghdl/project-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectPath }),
    }),
  ]);

  const statusData = await statusResponse.json();
  const infoData = await infoResponse.json();

  if (!statusResponse.ok) {
    throw new Error(statusData.error || 'Unable to detect GHDL status.');
  }
  if (!infoResponse.ok) {
    throw new Error(infoData.error || 'Unable to inspect VHDL sources.');
  }

  return {
    status: statusData as GhdlStatus,
    projectInfo: infoData as GhdlProjectInfo,
  };
}

export async function installGhdl(confirmPhrase: string, installCommand: string[] | null | undefined) {
  const response = await apiFetch('/api/ghdl/install', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      confirmInstall: true,
      confirmPhrase,
      installCommand,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Unable to install GHDL.');
  }
  return data as { status: GhdlStatus; logs: string[] };
}

export async function runGhdl(projectPath: string, topEntity: string, sourcePaths: string[], stopTime?: string) {
  const response = await apiFetch('/api/ghdl/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectPath,
      topEntity,
      sourcePaths,
      stopTime,
      autoInstall: false,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    const detail = Array.isArray(data.logs) && data.logs.length > 0
      ? `${data.error || 'GHDL simulation failed.'}\n\n${data.logs.join('\n')}`
      : (data.error || 'GHDL simulation failed.');
    const error = new Error(detail);
    (error as any).logs = Array.isArray(data.logs) ? data.logs : [];
    throw error;
  }
  return data as GhdlRunResponse;
}
