import type { ProjectFileEntry } from '../types';

export const PROJECT_STORAGE_KEY = 'automata-logicpro-project';

export interface StoredProjectSelection {
  name: string;
  path: string | null;
  files: ProjectFileEntry[];
}

export function loadStoredProjectSelection(): StoredProjectSelection | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredProjectSelection;
    if (!parsed?.name || !Array.isArray(parsed.files)) {
      return null;
    }
    return {
      name: parsed.name,
      path: parsed.path || null,
      files: parsed.files,
    };
  } catch {
    return null;
  }
}

export function saveProjectSelection(nextProjectName: string, nextProjectPath: string | null, nextFiles: ProjectFileEntry[]) {
  if (typeof window === 'undefined') {
    return;
  }

  const serializableFiles = nextFiles.map((file) => ({
    path: file.path,
    name: file.name,
    extension: file.extension,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  }));

  try {
    window.localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify({
      name: nextProjectName,
      path: nextProjectPath,
      files: serializableFiles,
    }));
  } catch {
    // Ignore storage failures.
  }
}

export function clearStoredProjectSelection() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(PROJECT_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function isProjectApprovalErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();
  return (
    normalizedMessage.includes('not approved for this app session') ||
    normalizedMessage.includes('needs to be selected again')
  );
}
