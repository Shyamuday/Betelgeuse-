export type JsonApiFetch = <T>(path: string, init?: RequestInit) => Promise<T>;

export function createJsonApiFetch(apiUrl: string, getBearerToken: () => string): JsonApiFetch {
  return async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const bearer = getBearerToken();
    const response = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        ...(init?.headers || {})
      }
    });

    if (!response.ok) {
      let message = 'Request failed.';
      try {
        message = (await response.json())?.message || message;
      } catch {
        // no-op
      }
      throw new Error(message);
    }

    return (await response.json()) as T;
  };
}
