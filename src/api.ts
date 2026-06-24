let sessionToken: string | null = null;
let sessionTokenPromise: Promise<string> | null = null;

function mergeRequestInit(init: RequestInit = {}, extra: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  const extraHeaders = new Headers(extra.headers || {});
  extraHeaders.forEach((value, key) => headers.set(key, value));

  return {
    ...init,
    ...extra,
    headers,
  };
}

async function loadSessionToken(forceRefresh = false) {
  if (forceRefresh) {
    sessionToken = null;
    sessionTokenPromise = null;
  }

  if (sessionToken) {
    return sessionToken;
  }

  if (!sessionTokenPromise) {
    sessionTokenPromise = fetch('/api/session', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok || typeof data?.token !== 'string' || !data.token.trim()) {
          throw new Error(data?.error || 'Failed to establish a local app session.');
        }
        sessionToken = data.token.trim();
        return sessionToken;
      })
      .catch((error) => {
        sessionTokenPromise = null;
        throw error;
      });
  }

  return sessionTokenPromise;
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}, retryOnUnauthorized = true) {
  const token = await loadSessionToken();
  const requestInit = mergeRequestInit(init, {
    cache: 'no-store',
    headers: {
      'x-logicpro-session': token,
      'Cache-Control': 'no-cache',
    },
  });

  const response = await fetch(input, requestInit);

  if (retryOnUnauthorized && response.status === 401) {
    const refreshedToken = await loadSessionToken(true);
    return fetch(input, mergeRequestInit(init, {
      cache: 'no-store',
      headers: {
        'x-logicpro-session': refreshedToken,
        'Cache-Control': 'no-cache',
      },
    }));
  }

  return response;
}
